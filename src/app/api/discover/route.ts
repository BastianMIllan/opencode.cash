import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/discover — list public projects (live from Project table)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const tag = searchParams.get('tag') || ''
    const sort = searchParams.get('sort') || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20

    const where: any = { isPublic: true }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }
      ]
    }

    if (tag) {
      where.tags = { has: tag }
    }

    const orderBy = sort === 'popular'
      ? { likesCount: 'desc' as const }
      : { updatedAt: 'desc' as const }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          tags: true,
          likesCount: true,
          forkedFrom: true,
          createdAt: true,
          updatedAt: true,
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
      }),
      prisma.project.count({ where }),
    ])

    const result = projects.map((p: any) => ({
      ...p,
      liked: p.likes?.length > 0,
      likes: undefined,
    }))

    return NextResponse.json({
      projects: result,
      total,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Discover GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
