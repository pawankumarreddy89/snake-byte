import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/auth/profile - Get user profile
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        country: true,
        createdAt: true,
        totalScore: true,
        gamesPlayed: true,
        gamesWon: true,
        highScore: true,
        level: true,
        experience: true,
        eloRating: true,
        selectedSkin: true,
        selectedArena: true,
        _count: {
          select: {
            gameSessions: true,
            replays: true,
            achievements: true,
            friendSent: true,
            friendReceived: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/profile - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, bio, country, avatar, selectedSkin, selectedArena } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Update user
    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(country !== undefined && { country }),
        ...(avatar !== undefined && { avatar }),
        ...(selectedSkin && { selectedSkin }),
        ...(selectedArena && { selectedArena })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        country: true,
        selectedSkin: true,
        selectedArena: true,
        totalScore: true,
        gamesPlayed: true,
        gamesWon: true,
        highScore: true,
        level: true,
        experience: true,
        eloRating: true
      }
    })

    return NextResponse.json({
      user,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
