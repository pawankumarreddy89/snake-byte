import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/analytics - Get platform analytics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || 'all' // all, today, week, month

    let dateFilter: any = {}

    if (timeframe === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dateFilter = { gte: today }
    } else if (timeframe === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      dateFilter = { gte: weekAgo }
    } else if (timeframe === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      dateFilter = { gte: monthAgo }
    }

    // Get all analytics data in parallel for performance
    const [
      totalUsers,
      activeUsers,
      totalGames,
      totalScore,
      totalReplays,
      totalAchievements,
      totalPurchases,
      recentActivity,
      topPlayers,
      dailyStats
    ] = await Promise.all([
      // Total users
      db.user.count(),

      // Active users (users who played in timeframe)
      db.user.count({
        where: {
          gameSessions: {
            some: {
              createdAt: dateFilter
            }
          }
        }
      }),

      // Total games
      db.gameSession.count({
        where: {
          createdAt: dateFilter
        }
      }),

      // Total score across all games
      db.gameSession.aggregate({
        where: {
          createdAt: dateFilter
        },
        _sum: {
          score: true
        }
      }),

      // Total replays
      db.replay.count({
        where: {
          createdAt: dateFilter
        }
      }),

      // Total achievements unlocked
      db.userAchievement.count({
        where: {
          unlockedAt: dateFilter
        }
      }),

      // Total shop purchases
      db.shopPurchase.count({
        where: {
          purchasedAt: dateFilter
        }
      }),

      // Recent activity (last 50 events)
      db.gameSession.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          score: true,
          level: true,
          mode: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),

      // Top players by score
      db.user.findMany({
        take: 10,
        orderBy: { totalScore: 'desc' },
        select: {
          id: true,
          name: true,
          avatar: true,
          totalScore: true,
          gamesPlayed: true,
          level: true,
          highScore: true,
          createdAt: true
        }
      }),

      // Daily stats for the last 30 days
      db.$queryRaw`
        SELECT
          DATE(createdAt) as date,
          COUNT(*) as games,
          AVG(score) as avgScore,
          MAX(score) as highScore
        FROM GameSession
        WHERE createdAt >= datetime('now', '-30 days')
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      ` as any[]
    ])

    // Calculate additional metrics
    const avgScore = totalGames > 0
      ? Math.round((totalScore._sum.score || 0) / totalGames)
      : 0

    const totalRevenue = await db.shopPurchase.aggregate({
      where: dateFilter,
      _sum: {
        price: true
      }
    })

    // Calculate engagement metrics
    const engagementRate = totalUsers > 0
      ? Math.round((activeUsers / totalUsers) * 100)
      : 0

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalGames,
        totalScore: totalScore._sum.score || 0,
        avgScore,
        totalReplays,
        totalAchievements,
        totalPurchases,
        totalRevenue: totalRevenue._sum.price || 0,
        engagementRate
      },
      recentActivity,
      topPlayers,
      dailyStats: dailyStats.map(stat => ({
        date: stat.date,
        games: Number(stat.games),
        avgScore: Math.round(Number(stat.avgScore) || 0),
        highScore: Number(stat.highScore) || 0
      }))
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
