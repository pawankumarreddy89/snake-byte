import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = '1' // Demo user ID

    // Get user's achievement progress
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      }
    })

    // Get all available achievements
    const allAchievements = await db.achievement.findMany()

    // Combine and format achievements
    const achievements = allAchievements.map((achievement: any) => {
      const userProgress = userAchievements.find(
        (ua: any) => ua.achievementId === achievement.id
      )

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        unlocked: !!userProgress?.unlocked,
        progress: userProgress?.progress || 0,
        maxProgress: achievement.maxProgress,
        reward: achievement.reward,
        unlockedAt: userProgress?.unlockedAt
      }
    })

    return NextResponse.json(achievements)
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { achievementId, userId = '1', progress } = body

    // Find the achievement
    const achievement = await db.achievement.findUnique({
      where: { id: achievementId }
    })

    if (!achievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      )
    }

    // Check if user already has this achievement
    const existing = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId
        }
      }
    })

    const shouldUnlock = progress >= achievement.maxProgress

    if (existing) {
      // Update progress
      const updated = await db.userAchievement.update({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        },
        data: {
          progress: Math.min(progress, achievement.maxProgress),
          ...(shouldUnlock && !existing.unlocked ? {
            unlocked: true,
            unlockedAt: new Date()
          } : {})
        }
      })

      // Award XP if newly unlocked
      if (shouldUnlock && !existing.unlocked) {
        await db.user.update({
          where: { id: userId },
          data: {
            totalScore: {
              increment: achievement.xpReward || 0
            }
          }
        })
      }

      return NextResponse.json(updated)
    } else {
      // Create new achievement progress
      const newProgress = await db.userAchievement.create({
        data: {
          userId,
          achievementId,
          progress: Math.min(progress, achievement.maxProgress),
          unlocked: shouldUnlock,
          unlockedAt: shouldUnlock ? new Date() : null
        }
      })

      // Award XP if unlocked
      if (shouldUnlock) {
        await db.user.update({
          where: { id: userId },
          data: {
            totalScore: {
              increment: achievement.xpReward || 0
            }
          }
        })
      }

      return NextResponse.json(newProgress, { status: 201 })
    }
  } catch (error) {
    console.error('Error updating achievement:', error)
    return NextResponse.json(
      { error: 'Failed to update achievement' },
      { status: 500 }
    )
  }
}
