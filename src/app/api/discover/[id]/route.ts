import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/discover/[id] — get single public project with files
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        files: true,
        isPublic: true,
        likesCount: true,
        forkedFrom: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        ...(session?.user?.id ? {
          likes: {
            where: { userId: session.user.id },
            select: { id: true },
          }
        } : {}),
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only allow viewing if public or owned by the user
    if (!project.isPublic && project.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const result: any = {
      ...project,
      liked: (project as any).likes?.length > 0,
      isOwner: session?.user?.id === project.userId,
    }
    delete result.likes

    return NextResponse.json(result)
  } catch (error) {
    console.error('Discover GET [id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// POST /api/discover/[id] — fork a project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const original = await prisma.project.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, description: true, tags: true, files: true, isPublic: true, userId: true },
    })

    if (!original || (!original.isPublic && original.userId !== session.user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const forked = await prisma.project.create({
      data: {
        name: `${original.name} (fork)`,
        description: original.description,
        tags: original.tags,
        files: original.files as any,
        isPublic: false,
        forkedFrom: original.id,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        files: true,
      }
    })

    return NextResponse.json(forked, { status: 201 })
  } catch (error) {
    console.error('Fork error:', error)
    return NextResponse.json({ error: 'Failed to fork project' }, { status: 500 })
  }
}
