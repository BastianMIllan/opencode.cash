import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/keys - List user's API keys (masked)
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      apiKey: true,
      baseUrl: true,
      updatedAt: true,
    },
  })

  // Mask keys for display — only show last 4 chars
  const masked = keys.map((k: { id: string; provider: string; apiKey: string; baseUrl: string | null; updatedAt: Date }) => ({
    ...k,
    apiKey: k.apiKey.length > 4 ? '••••' + k.apiKey.slice(-4) : '••••',
  }))

  return NextResponse.json(masked)
}

// POST /api/keys - Save or update an API key for a provider
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { provider, apiKey, baseUrl } = body

  if (!provider || !apiKey) {
    return NextResponse.json({ error: 'Provider and apiKey are required' }, { status: 400 })
  }

  const key = await prisma.apiKey.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider,
      },
    },
    update: {
      apiKey,
      baseUrl: baseUrl || null,
    },
    create: {
      userId: session.user.id,
      provider,
      apiKey,
      baseUrl: baseUrl || null,
    },
  })

  return NextResponse.json({
    id: key.id,
    provider: key.provider,
    apiKey: key.apiKey.length > 4 ? '••••' + key.apiKey.slice(-4) : '••••',
    baseUrl: key.baseUrl,
  })
}

// DELETE /api/keys - Delete an API key by provider
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')

  if (!provider) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
  }

  await prisma.apiKey.deleteMany({
    where: {
      userId: session.user.id,
      provider,
    },
  })

  return NextResponse.json({ success: true })
}
