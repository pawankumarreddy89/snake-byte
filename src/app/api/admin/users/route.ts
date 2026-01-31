import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/users - List all users with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: any = {}

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder
        },
        take: limit,
        skip,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          country: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          totalScore: true,
          gamesPlayed: true,
          gamesWon: true,
          highScore: true,
          level: true,
          experience: true,
          eloRating: true,
          _count: {
            select: {
              gameSessions: true,
              replays: true,
              achievements: true,
              friendSent: true,
              friendReceived: true,
              chatMessages: true,
              shopPurchases: true
            }
          }
        }
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users - Update user (ban/unban, role changes)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, action, reason } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'ban':
        updateData = {
          bio: `[BANNED] ${reason || 'Violation of community guidelines'}`
        }
        break
      case 'unban':
        updateData = {
          bio: null
        }
        break
      case 'reset_stats':
        updateData = {
          totalScore: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          highScore: 0,
          level: 1,
          experience: 0,
          eloRating: 1200
        }
        break
      case 'delete_games':
        // Delete all user games
        await db.gameSession.deleteMany({
          where: { userId }
        })
        await db.replay.deleteMany({
          where: { userId }
        })
        return NextResponse.json({
          message: 'User games deleted successfully'
        })
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      user: updatedUser,
      message: `User ${action} successful`
    })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users - Delete user account
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await db.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
