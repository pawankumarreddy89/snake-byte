import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const gameSession = await db.gameSession.findUnique({
      where: { id: sessionId }
    })

    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      )
    }

    // Parse gameData
    const parsedSession = {
      ...gameSession,
      gameData: JSON.parse(gameSession.gameData)
    }

    return NextResponse.json({ gameSession: parsedSession })
  } catch (error) {
    console.error('Game load error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
