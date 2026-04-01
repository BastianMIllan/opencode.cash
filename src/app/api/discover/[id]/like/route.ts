import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/discover/[id]/like — toggle like
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { id: true, isPublic: true },
    })

    if (!project || !project.isPublic) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const existingLike = await prisma.projectLike.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: params.id,
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.projectLike.delete({
          where: { id: existingLike.id }
        }),
        prisma.project.update({
          where: { id: params.id },
          data: { likesCount: { decrement: 1 } },
        }),
      ])
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.$transaction([
        prisma.projectLike.create({
          data: {
            userId: session.user.id,
            projectId: params.id,
          }
        }),
        prisma.project.update({
          where: { id: params.id },
          data: { likesCount: { increment: 1 } },
        }),
      ])
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
