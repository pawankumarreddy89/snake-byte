import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/friends - List friends
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const where: any = {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }

    if (status) {
      where.status = status
    }

    const friendships = await db.friendship.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            totalScore: true,
            level: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            totalScore: true,
            level: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ friendships })
  } catch (error) {
    console.error('Friends list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/friends - Send friend request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { senderId, receiverId } = body

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Sender ID and receiver ID are required' },
        { status: 400 }
      )
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    // Check if friendship already exists
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Friend request already exists or you are already friends' },
        { status: 409 }
      )
    }

    const friendship = await db.friendship.create({
      data: {
        senderId,
        receiverId,
        status: 'pending'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      friendship,
      message: 'Friend request sent'
    }, { status: 201 })
  } catch (error) {
    console.error('Friend request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/friends - Accept/reject friend request
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { friendshipId, action } = body

    if (!friendshipId || !action) {
      return NextResponse.json(
        { error: 'Friendship ID and action are required' },
        { status: 400 }
      )
    }

    const friendship = await db.friendship.update({
      where: { id: friendshipId },
      data: {
        status: action
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      friendship,
      message: action === 'accepted' ? 'Friend request accepted' : 'Friend request rejected'
    })
  } catch (error) {
    console.error('Friend action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
