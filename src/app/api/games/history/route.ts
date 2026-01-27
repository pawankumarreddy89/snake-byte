import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = '1' // Demo user ID
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const mode = searchParams.get('mode')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { userId }
    if (mode) {
      where.mode = mode
    }

    // Get game sessions
    const games = await db.gameSession.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' }
    })

    // Format game history
    const gameHistory = games.map((game: any) => {
      const gameData = typeof game.gameData === 'string' ? JSON.parse(game.gameData) : game.gameData

      return {
        id: game.id,
        score: game.score,
        duration: gameData?.duration || 0,
        mode: game.mode || 'Classic',
        date: game.createdAt,
        result: gameData?.result || 'Unknown'
      }
    })

    // Get total count for pagination
    const total = await db.gameSession.count({ where })

    return NextResponse.json({
      games: gameHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching game history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game history' },
      { status: 500 }
    )
  }
}
