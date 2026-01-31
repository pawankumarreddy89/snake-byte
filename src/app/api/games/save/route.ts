import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, score, level, length, gameData, status, mode, sessionId } = body

    // Validation
    if (!userId || !score || !level || !length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let gameSession

    if (sessionId) {
      // Update existing session
      gameSession = await db.gameSession.update({
        where: { id: sessionId },
        data: {
          score,
          level,
          length,
          gameData: JSON.stringify(gameData),
          status,
          mode,
          updatedAt: new Date(),
          completedAt: status === 'completed' ? new Date() : null
        }
      })
    } else {
      // Create new session
      gameSession = await db.gameSession.create({
        data: {
          userId,
          score,
          level,
          length,
          gameData: JSON.stringify(gameData),
          status,
          mode
        }
      })
    }

    return NextResponse.json({
      gameSession,
      message: 'Game saved successfully'
    })
  } catch (error) {
    console.error('Game save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
