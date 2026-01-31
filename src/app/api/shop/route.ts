import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/shop - Get shop items or user inventory
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const inventory = searchParams.get('inventory')

    if (inventory === 'true' && userId) {
      // Get user's inventory
      const inventoryItems = await db.inventory.findMany({
        where: { userId },
        include: {
          item: true
        },
        orderBy: { acquiredAt: 'desc' }
      })

      return NextResponse.json({ inventory: inventoryItems })
    } else {
      // Get shop items
      const where: any = { isAvailable: true }
      if (type) {
        where.type = type
      }

      const items = await db.shopItem.findMany({
        where,
        orderBy: [
          { rarity: 'asc' },
          { price: 'desc' }
        ]
      })

      return NextResponse.json({ items })
    }
  } catch (error) {
    console.error('Shop fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/shop - Purchase item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, itemId } = body

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'User ID and item ID are required' },
        { status: 400 }
      )
    }

    // Check if item exists and is available
    const item = await db.shopItem.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    if (!item.isAvailable) {
      return NextResponse.json(
        { error: 'Item is not available' },
        { status: 400 }
      )
    }

    // Check if user already owns the item
    const existing = await db.inventory.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You already own this item' },
        { status: 409 }
      )
    }

    // Check user's coins (using totalScore as currency for demo)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { totalScore: true }
    })

    if (!user || user.totalScore < item.price) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      )
    }

    // Create inventory item and record purchase
    const [inventoryItem, purchase] = await Promise.all([
      db.inventory.create({
        data: {
          userId,
          itemId
        },
        include: {
          item: true
        }
      }),
      db.shopPurchase.create({
        data: {
          userId,
          itemId,
          price: item.price
        }
      })
    ])

    return NextResponse.json({
      item: inventoryItem,
      purchase,
      message: 'Item purchased successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Shop purchase error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
