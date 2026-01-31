import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = '1' // Demo user ID

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get user's daily challenge progress
    const userChallenges = await db.dailyChallengeProgress.findMany({
      where: {
        userId,
        date: today
      },
      include: {
        challenge: true
      }
    })

    // If no challenges for today, generate new ones
    if (userChallenges.length === 0) {
      const generatedChallenges = await generateDailyChallenges(userId, today)
      return NextResponse.json(generatedChallenges)
    }

    // Format challenges
    const challenges = userChallenges.map((uc: any) => ({
      id: uc.id,
      title: uc.challenge.title,
      description: uc.challenge.description,
      progress: uc.progress,
      target: uc.challenge.target,
      completed: uc.completed,
      reward: uc.challenge.reward,
      xpReward: uc.challenge.xpReward
    }))

    return NextResponse.json(challenges)
  } catch (error) {
    console.error('Error fetching daily challenges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily challenges' },
      { status: 500 }
    )
  }
}

async function generateDailyChallenges(userId: string, date: Date) {
  // Define challenge templates
  const challengeTemplates = [
    {
      title: 'Score Hunter',
      description: 'Score 500 total points today',
      target: 500,
      reward: '200 XP',
      xpReward: 200,
      type: 'score'
    },
    {
      title: 'Game Master',
      description: 'Play 3 games',
      target: 3,
      reward: '150 XP',
      xpReward: 150,
      type: 'games'
    },
    {
      title: 'PvP Champion',
      description: 'Win 2 PvP matches',
      target: 2,
      reward: '300 XP',
      xpReward: 300,
      type: 'pvp_wins'
    },
    {
      title: 'Speed Demon',
      description: 'Complete a game in under 3 minutes',
      target: 1,
      reward: '250 XP',
      xpReward: 250,
      type: 'speed'
    },
    {
      title: 'Sniper',
      description: 'Score 200 in a single game',
      target: 200,
      reward: '200 XP',
      xpReward: 200,
      type: 'single_score'
    }
  ]

  // Select 3 random challenges
  const selectedTemplates = challengeTemplates
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  // Create challenge records
  const challenges = []
  for (const template of selectedTemplates) {
    const challenge = await db.dailyChallenge.create({
      data: {
        title: template.title,
        description: template.description,
        target: template.target,
        reward: template.reward,
        xpReward: template.xpReward,
        date
      }
    })

    // Create user progress
    await db.dailyChallengeProgress.create({
      data: {
        userId,
        dailyChallengeId: challenge.id,
        date,
        progress: 0,
        completed: false
      }
    })

    challenges.push({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      progress: 0,
      target: challenge.target,
      completed: false,
      reward: challenge.reward,
      xpReward: challenge.xpReward
    })
  }

  return challenges
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { challengeId, userId = '1', progress } = body

    // Find the user's challenge progress by challengeId and userId
    const challengeProgress = await db.dailyChallengeProgress.findFirst({
      where: {
        userId,
        challengeId
      },
      include: {
        challenge: true
      }
    })

    if (!challengeProgress) {
      return NextResponse.json(
        { error: 'Challenge progress not found' },
        { status: 404 }
      )
    }

    const shouldComplete = progress >= challengeProgress.challenge.target

    // Update progress
    const updated = await db.dailyChallengeProgress.update({
      where: {
        userId_challengeId: {
          userId,
          challengeId
        }
      },
      data: {
        progress: Math.min(progress, challengeProgress.challenge.target),
        completed: shouldComplete,
        ...(shouldComplete && !challengeProgress.completed ? { completedAt: new Date() } : {})
      }
    })

    // Award XP if newly completed
    if (shouldComplete && !challengeProgress.completed) {
      await db.user.update({
        where: { id: userId },
        data: {
          totalScore: {
            increment: challengeProgress.challenge.xpReward
          },
          experience: {
            increment: challengeProgress.challenge.xpReward
          }
        }
      })

      // Note: Battle pass XP update would require knowing the active battle pass
      // This can be implemented when user has an active battle pass selected
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating challenge:', error)
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    )
  }
}
