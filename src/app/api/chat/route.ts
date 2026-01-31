import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/chat - Get chat messages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'global'
    const userId = searchParams.get('userId')
    const recipientId = searchParams.get('recipientId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { type }

    if (type === 'private' && userId && recipientId) {
      where.OR = [
        { userId, recipientId },
        { userId: recipientId, recipientId: userId }
      ]
    }

    const messages = await db.chatMessage.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            level: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error('Chat messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat - Send chat message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, message, type, recipientId, gameId } = body

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'User ID and message are required' },
        { status: 400 }
      )
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    const chatMessage = await db.chatMessage.create({
      data: {
        userId,
        message,
        type: type || 'global',
        recipientId,
        gameId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            level: true
          }
        }
      }
    })

    return NextResponse.json({
      message: chatMessage,
      status: 'Message sent'
    }, { status: 201 })
  } catch (error) {
    console.error('Chat send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
