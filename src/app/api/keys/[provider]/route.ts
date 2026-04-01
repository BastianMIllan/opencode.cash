import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/keys/[provider] - Get full API key for a provider (for agent use)
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = await prisma.apiKey.findUnique({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: params.provider,
      },
    },
  })

  if (!key) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  return NextResponse.json({
    provider: key.provider,
    apiKey: key.apiKey,
    baseUrl: key.baseUrl,
  })
}
