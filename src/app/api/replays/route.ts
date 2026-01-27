import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/replays - List user's replays
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const replays = await db.replay.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await db.replay.count({ where: { userId } })

    return NextResponse.json({ replays, total, limit, offset })
  } catch (error) {
    console.error('Replay list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/replays - Create a replay
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, score, level, replayData, duration, annotations } = body

    if (!userId || !score || !level || !replayData || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const replay = await db.replay.create({
      data: {
        userId,
        name: name || `Game - ${new Date().toLocaleDateString()}`,
        score,
        level,
        replayData: JSON.stringify(replayData),
        duration,
        annotations: annotations ? JSON.stringify(annotations) : null
      }
    })

    return NextResponse.json({
      replay,
      message: 'Replay saved successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Replay creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
