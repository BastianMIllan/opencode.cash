import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/projects - List user's projects
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      tags: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(projects)
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, files, tags, isPublic } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const sanitizedTags = (tags || [])
    .slice(0, 5)
    .map((t: string) => t.toLowerCase().trim().slice(0, 30))
    .filter(Boolean)

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      tags: sanitizedTags,
      files: files || {},
      isPublic: isPublic || false,
      userId: session.user.id,
    },
  })

  return NextResponse.json(project, { status: 201 })
}
