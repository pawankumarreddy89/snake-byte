import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') || 'classic'
    const period = searchParams.get('period') || 'all-time'
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get leaderboard entries
    const leaderboards = await db.$queryRaw`
      SELECT
        l.*,
        u.name,
        u.avatar,
        u.country
      FROM Leaderboard l
      INNER JOIN User u ON l.userId = u.id
      WHERE l.mode = ${mode} AND l.period = ${period}
      ORDER BY l.score DESC, l.level DESC, l.achievedAt ASC
      LIMIT ${limit} OFFSET ${offset}
    ` as any[]

    // Get total count
    const total = await db.leaderboard.count({
      where: {
        mode,
        period
      }
    })

    // Get user's rank if provided
    let userRank = null
    if (userId) {
      const userEntry = await db.$queryRaw`
        SELECT
          COUNT(*) + 1 as rank
        FROM Leaderboard l
        WHERE l.mode = ${mode} AND l.period = ${period}
        AND (l.score > (
          SELECT score FROM Leaderboard WHERE userId = ${userId} AND mode = ${mode} AND period = ${period}
        ) OR (l.score = (
          SELECT score FROM Leaderboard WHERE userId = ${userId} AND mode = ${mode} AND period = ${period}
        ) AND l.level > (
          SELECT level FROM Leaderboard WHERE userId = ${userId} AND mode = ${mode} AND period = ${period}
        )))
      ` as any[]

      if (userEntry.length > 0) {
        userRank = userEntry[0].rank
      }
    }

    return NextResponse.json({
      leaderboards,
      total,
      userRank,
      limit,
      offset
    })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, score, level, mode } = body

    if (!userId || !score || !level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Determine periods to update
    const periods = ['all-time', 'weekly', 'daily']

    const updates = await Promise.all(
      periods.map(async (period) => {
        // Check if entry exists
        const existing = await db.leaderboard.findUnique({
          where: {
            userId_mode_period: {
              userId,
              mode: mode || 'classic',
              period
            }
          }
        })

        if (existing) {
          // Update if new score is higher
          if (score > existing.score) {
            return db.leaderboard.update({
              where: {
                userId_mode_period: {
                  userId,
                  mode: mode || 'classic',
                  period
                }
              },
              data: {
                score,
                level,
                achievedAt: new Date()
              }
            })
          }
          return existing
        } else {
          // Create new entry
          return db.leaderboard.create({
            data: {
              userId,
              score,
              level,
              mode: mode || 'classic',
              period,
              achievedAt: new Date()
            }
          })
        }
      })
    )

    return NextResponse.json({
      leaderboards: updates,
      message: 'Leaderboards updated successfully'
    })
  } catch (error) {
    console.error('Leaderboard update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
