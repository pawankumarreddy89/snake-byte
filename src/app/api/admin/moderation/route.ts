import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/moderation - Get moderation queue
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all' // all, chat, users
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'pending'

    const skip = (page - 1) * limit

    if (type === 'chat') {
      // Get recent chat messages that might need moderation
      const [messages, total] = await Promise.all([
        db.chatMessage.findMany({
          take: limit,
          skip,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true
              }
            }
          }
        }),
        db.chatMessage.count()
      ])

      return NextResponse.json({
        type: 'chat',
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    }

    // Get flagged content or recent activity
    const flaggedUsers = await db.user.findMany({
      where: {
        bio: {
          contains: '[BANNED]'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
        totalScore: true
      },
      take: limit
    })

    return NextResponse.json({
      type: 'users',
      flaggedUsers,
      pagination: {
        page,
        limit,
        total: flaggedUsers.length,
        totalPages: 1
      }
    })
  } catch (error) {
    console.error('Admin moderation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/moderation - Take moderation action
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, targetId, targetType, reason } = body

    if (!action || !targetId || !targetType) {
      return NextResponse.json(
        { error: 'Action, target ID, and target type are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'delete_message':
        if (targetType !== 'chat') {
          return NextResponse.json(
            { error: 'Target type must be chat for delete_message action' },
            { status: 400 }
          )
        }

        await db.chatMessage.delete({
          where: { id: targetId }
        })

        return NextResponse.json({
          message: 'Chat message deleted successfully'
        })

      case 'ban_user':
        if (targetType !== 'user') {
          return NextResponse.json(
            { error: 'Target type must be user for ban_user action' },
            { status: 400 }
          )
        }

        await db.user.update({
          where: { id: targetId },
          data: {
            bio: `[BANNED] ${reason || 'Violation of community guidelines'}`
          }
        })

        return NextResponse.json({
          message: 'User banned successfully'
        })

      case 'warn_user':
        // For now, just log it - could add a warnings table later
        console.log(`Warning user ${targetId}: ${reason}`)

        return NextResponse.json({
          message: 'User warned successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin moderation action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
