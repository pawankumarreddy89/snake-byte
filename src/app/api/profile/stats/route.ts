import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // For demo, we'll return stats for user ID 1
    // In production, you'd get the user ID from the session/JWT
    const userId = '1'

    // Get user stats from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totalScore: true,
        gamesPlayed: true,
        highScore: true,
        level: true,
        createdAt: true
      }
    })

    if (!user) {
      // Return mock data for demo
      return NextResponse.json({
        totalScore: 15420,
        gamesPlayed: 87,
        highScore: 320,
        level: 12,
        winRate: 67.5,
        avgScore: 177.2,
        playTime: 32400
      })
    }

    // Calculate additional stats
    const recentGames = await db.gameSession.findMany({
      where: { userId },
      take: 100,
      orderBy: { createdAt: 'desc' }
    })

    const wins = recentGames.filter((game: any) => {
      const gameData = typeof game.gameData === 'string' ? JSON.parse(game.gameData) : game.gameData
      return gameData?.result === 'Victory'
    }).length

    const winRate = recentGames.length > 0 ? (wins / recentGames.length) * 100 : 0
    const avgScore = recentGames.length > 0 ? user.totalScore / recentGames.length : 0

    // Calculate total play time (sum of all game durations)
    const totalPlayTime = recentGames.reduce((sum: number, game: any) => {
      const gameData = typeof game.gameData === 'string' ? JSON.parse(game.gameData) : game.gameData
      return sum + (gameData?.duration || 0)
    }, 0)

    const stats = {
      totalScore: user.totalScore || 0,
      gamesPlayed: user.gamesPlayed || 0,
      highScore: user.highScore || 0,
      level: user.level || 1,
      winRate: Math.round(winRate * 10) / 10,
      avgScore: Math.round(avgScore * 10) / 10,
      playTime: totalPlayTime
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
