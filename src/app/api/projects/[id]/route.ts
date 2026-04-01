import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[id] - Get a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const existing = await prisma.project.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, description, files } = body

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(files && { files }),
    },
  })

  return NextResponse.json(project)
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const existing = await prisma.project.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  await prisma.project.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
