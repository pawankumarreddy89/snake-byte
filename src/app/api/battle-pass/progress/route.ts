import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Battle pass level configuration
const BATTLE_PASS_LEVELS = [
  { level: 1, xpRequired: 0, rewards: ['100 Coins', 'Basic Skin'] },
  { level: 2, xpRequired: 200, rewards: ['150 Coins', 'XP Boost'] },
  { level: 3, xpRequired: 400, rewards: ['200 Coins', 'Rare Skin'] },
  { level: 4, xpRequired: 600, rewards: ['300 Coins', 'Title: Novice'] },
  { level: 5, xpRequired: 800, rewards: ['400 Coins', 'Epic Skin'] },
  { level: 6, xpRequired: 1000, rewards: ['500 Coins', 'Title: Expert'] },
  { level: 7, xpRequired: 1250, rewards: ['600 Coins', 'Legendary Skin'] },
  { level: 8, xpRequired: 1500, rewards: ['800 Coins', 'Title: Master'] },
  { level: 9, xpRequired: 1800, rewards: ['1000 Coins', 'Mega Pack'] },
  { level: 10, xpRequired: 2000, rewards: ['2000 Coins', 'Mythic Skin', 'Title: Legend'] }
]

export async function GET(request: NextRequest) {
  try {
    const userId = '1' // Demo user ID

    // Get or create current battle pass
    let currentBattlePass = await db.battlePass.findFirst({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    })

    if (!currentBattlePass) {
      // Create a default battle pass if not exists
      const newBattlePass = await db.battlePass.create({
        data: {
          name: 'Season 1',
          season: 1,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        }
      })
      currentBattlePass = newBattlePass
    }

    // Get user's battle pass progress
    const userBattlePass = await db.battlePassProgress.findUnique({
      where: {
        userId_battlePassId: {
          userId,
          battlePassId: currentBattlePass.id
        }
      }
    })

    if (!userBattlePass) {
      // Create new battle pass entry
      await db.battlePassProgress.create({
        data: {
          userId,
          battlePassId: currentBattlePass.id,
          currentLevel: 1,
          currentXP: 0
        }
      })

      return NextResponse.json({
        level: 1,
        xp: 0,
        levels: BATTLE_PASS_LEVELS.map((level) => ({
          ...level,
          unlocked: false
        }))
      })
    }

    // Determine unlocked levels
    const levelsWithStatus = BATTLE_PASS_LEVELS.map((level) => ({
      ...level,
      unlocked: userBattlePass.currentLevel > level.level
    }))

    return NextResponse.json({
      level: userBattlePass.currentLevel,
      xp: userBattlePass.currentXP,
      levels: levelsWithStatus
    })
  } catch (error) {
    console.error('Error fetching battle pass progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch battle pass progress' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = '1', xp } = body

    // Get current battle pass
    const currentBattlePass = await db.battlePass.findFirst({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    })

    if (!currentBattlePass) {
      return NextResponse.json(
        { error: 'No active battle pass' },
        { status: 404 }
      )
    }

    // Get user's battle pass progress
    const userBattlePass = await db.battlePassProgress.findUnique({
      where: {
        userId_battlePassId: {
          userId,
          battlePassId: currentBattlePass.id
        }
      }
    })

    if (!userBattlePass) {
      return NextResponse.json(
        { error: 'Battle pass not found' },
        { status: 404 }
      )
    }

    // Calculate new XP and level
    const newXP = userBattlePass.currentXP + xp
    let newLevel = userBattlePass.currentLevel

    // Check for level up
    for (let i = BATTLE_PASS_LEVELS.length - 1; i >= 0; i--) {
      if (newXP >= BATTLE_PASS_LEVELS[i].xpRequired) {
        newLevel = BATTLE_PASS_LEVELS[i].level
        break
      }
    }

    // Update battle pass
    const updated = await db.battlePassProgress.update({
      where: {
        userId_battlePassId: {
          userId,
          battlePassId: currentBattlePass.id
        }
      },
      data: {
        currentXP: newXP,
        currentLevel: newLevel
      }
    })

    return NextResponse.json({
      level: newLevel,
      xp: newXP,
      previousLevel: userBattlePass.currentLevel,
      leveledUp: newLevel > userBattlePass.currentLevel
    })
  } catch (error) {
    console.error('Error updating battle pass:', error)
    return NextResponse.json(
      { error: 'Failed to update battle pass' },
      { status: 500 }
    )
  }
}
