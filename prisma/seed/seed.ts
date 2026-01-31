import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Seed Achievements
  const achievements = [
    {
      name: 'First Steps',
      description: 'Complete your first game',
      icon: '🎯',
      type: 'games-played',
      requirement: { gamesPlayed: 1 },
      reward: '100 XP',
      xpReward: 100,
      maxProgress: 1
    },
    {
      name: 'Centipede',
      description: 'Reach a snake length of 100',
      icon: '🐛',
      type: 'score',
      requirement: { length: 100 },
      reward: '200 XP',
      xpReward: 200,
      maxProgress: 100
    },
    {
      name: 'Score Master',
      description: 'Score 1,000 points in a single game',
      icon: '🏆',
      type: 'score',
      requirement: { score: 1000 },
      reward: '500 XP',
      xpReward: 500,
      maxProgress: 1
    },
    {
      name: 'Champion',
      description: 'Score 10,000 points in a single game',
      icon: '👑',
      type: 'score',
      requirement: { score: 10000 },
      reward: '750 XP',
      xpReward: 750,
      maxProgress: 1
    },
    {
      name: 'Veteran',
      description: 'Play 100 games',
      icon: '🎮',
      type: 'games-played',
      requirement: { gamesPlayed: 100 },
      reward: '300 XP + Rare Skin',
      xpReward: 300,
      maxProgress: 100
    },
    {
      name: 'Speed Demon',
      description: 'Reach level 10 in a single game',
      icon: '⚡',
      type: 'special',
      requirement: { level: 10 },
      reward: '150 XP',
      xpReward: 150,
      maxProgress: 10
    },
    {
      name: 'Marathon Runner',
      description: 'Play for 10 minutes in a single game',
      icon: '🏃',
      type: 'special',
      requirement: { duration: 600 },
      reward: '100 XP',
      xpReward: 100,
      maxProgress: 600
    },
    {
      name: 'Perfect Game',
      description: 'Reach level 5 without dying',
      icon: '⭐',
      type: 'special',
      requirement: { levelWithoutDying: 5 },
      reward: '200 XP',
      xpReward: 200,
      maxProgress: 5
    },
    {
      name: 'PvP Champion',
      description: 'Win 10 PvP matches',
      icon: '⚔️',
      type: 'special',
      requirement: { pvpWins: 10 },
      reward: '500 XP + Title',
      xpReward: 500,
      maxProgress: 10
    },
    {
      name: 'Social Butterfly',
      description: 'Add 10 friends',
      icon: '🦋',
      type: 'special',
      requirement: { friends: 10 },
      reward: '50 XP',
      xpReward: 50,
      maxProgress: 10
    }
  ]

  console.log('📜 Creating achievements...')
  for (const achievement of achievements) {
    const existing = await prisma.achievement.findFirst({
      where: { name: achievement.name }
    })

    if (!existing) {
      await prisma.achievement.create({
        data: achievement
      })
      console.log(`  ✓ ${achievement.name}`)
    } else {
      console.log(`  - ${achievement.name} (already exists)`)
    }
  }

  // Seed Shop Items
  const shopItems = [
    // Skins
    {
      name: 'Classic Green',
      description: 'The original snake skin',
      type: 'skin',
      price: 0,
      rarity: 'common',
      icon: '🐍'
    },
    {
      name: 'Ruby Red',
      description: 'A fierce red snake',
      type: 'skin',
      price: 500,
      rarity: 'rare',
      icon: '❤️'
    },
    {
      name: 'Ocean Blue',
      description: 'Calm blue snake',
      type: 'skin',
      price: 750,
      rarity: 'rare',
      icon: '💙'
    },
    {
      name: 'Golden Snake',
      description: 'Precious golden skin',
      type: 'skin',
      price: 2000,
      rarity: 'epic',
      icon: '✨'
    },
    {
      name: 'Rainbow Snake',
      description: 'All colors of the rainbow',
      type: 'skin',
      price: 5000,
      rarity: 'legendary',
      icon: '🌈'
    },
    {
      name: 'Neon Glow',
      description: 'Cyberpunk neon skin',
      type: 'skin',
      price: 3000,
      rarity: 'epic',
      icon: '💜'
    },
    // Arenas
    {
      name: 'Classic Grid',
      description: 'The traditional playing field',
      type: 'arena',
      price: 0,
      rarity: 'common',
      icon: '🟫'
    },
    {
      name: 'Neon City',
      description: 'Futuristic cityscape arena',
      type: 'arena',
      price: 1500,
      rarity: 'rare',
      icon: '🌃'
    },
    {
      name: 'Space Station',
      description: 'Battle in zero gravity',
      type: 'arena',
      price: 3000,
      rarity: 'epic',
      icon: '🚀'
    },
    {
      name: 'Underwater World',
      description: 'Deep sea adventure',
      type: 'arena',
      price: 2500,
      rarity: 'epic',
      icon: '🐠'
    },
    {
      name: 'Volcano',
      description: 'Dangerous lava arena',
      type: 'arena',
      price: 4000,
      rarity: 'legendary',
      icon: '🌋'
    },
    // Power-ups (cosmetic effects)
    {
      name: 'Fire Trail',
      description: 'Leave a fiery trail behind',
      type: 'power-up',
      price: 1000,
      rarity: 'rare',
      icon: '🔥'
    },
    {
      name: 'Ice Crystals',
      description: 'Crystal ice particle effect',
      type: 'power-up',
      price: 1200,
      rarity: 'rare',
      icon: '❄️'
    },
    {
      name: 'Star Dust',
      description: 'Sparkle like stars',
      type: 'power-up',
      price: 2500,
      rarity: 'epic',
      icon: '💫'
    },
    {
      name: 'Thunder Storm',
      description: 'Electric lightning effects',
      type: 'power-up',
      price: 3500,
      rarity: 'legendary',
      icon: '⚡'
    }
  ]

  console.log('🛒 Creating shop items...')
  for (const item of shopItems) {
    const existing = await prisma.shopItem.findFirst({
      where: { name: item.name }
    })

    if (!existing) {
      await prisma.shopItem.create({
        data: item
      })
      console.log(`  ✓ ${item.name} (${item.rarity})`)
    } else {
      console.log(`  - ${item.name} (${item.rarity}) (already exists)`)
    }
  }

  // Create a Battle Pass
  console.log('🎫 Creating battle pass...')
  const battlePass = await prisma.battlePass.upsert({
    where: {
      id: 'season-1-2024'
    },
    update: {},
    create: {
      id: 'season-1-2024',
      name: 'Season 1: New Beginnings',
      season: 1,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      totalLevels: 100
    }
  })
  console.log(`  ✓ ${battlePass.name}`)

  // Create some demo users
  console.log('👤 Creating demo users...')
  const demoUsers = [
    {
      id: '1',
      email: 'player1@example.com',
      name: 'Demo Player',
      totalScore: 15420,
      gamesPlayed: 87,
      gamesWon: 58,
      highScore: 320,
      level: 12,
      experience: 15420
    },
    {
      id: '2',
      email: 'player2@example.com',
      name: 'Pro Gamer',
      totalScore: 28950,
      gamesPlayed: 156,
      gamesWon: 102,
      highScore: 485,
      level: 18,
      experience: 28950
    },
    {
      id: '3',
      email: 'player3@example.com',
      name: 'Snake Master',
      totalScore: 45680,
      gamesPlayed: 234,
      gamesWon: 156,
      highScore: 520,
      level: 25,
      experience: 45680
    }
  ]

  for (const user of demoUsers) {
    const existing = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!existing) {
      await prisma.user.create({
        data: user
      })
      console.log(`  ✓ ${user.name}`)
    } else {
      console.log(`  - ${user.name} (already exists)`)
    }
  }

  // Create some game sessions for users
  console.log('🎮 Creating game sessions...')
  const gameSessions = [
    {
      userId: '1',
      score: 320,
      level: 12,
      length: 87,
      gameData: JSON.stringify({ result: 'Victory', duration: 542, mode: 'Classic' }),
      status: 'completed',
      mode: 'classic',
      completedAt: new Date()
    },
    {
      userId: '2',
      score: 485,
      level: 18,
      length: 156,
      gameData: JSON.stringify({ result: 'Victory', duration: 623, mode: 'Classic' }),
      status: 'completed',
      mode: 'classic',
      completedAt: new Date()
    },
    {
      userId: '3',
      score: 520,
      level: 25,
      length: 234,
      gameData: JSON.stringify({ result: 'Victory', duration: 789, mode: 'Classic' }),
      status: 'completed',
      mode: 'classic',
      completedAt: new Date()
    }
  ]

  for (const session of gameSessions) {
    await prisma.gameSession.create({
      data: session
    })
  }

  // Create leaderboard entries
  console.log('🏆 Creating leaderboard entries...')
  const leaderboardEntries = [
    {
      userId: '1',
      score: 15420,
      level: 12,
      mode: 'classic',
      period: 'all-time',
      achievedAt: new Date()
    },
    {
      userId: '2',
      score: 28950,
      level: 18,
      mode: 'classic',
      period: 'all-time',
      achievedAt: new Date()
    },
    {
      userId: '3',
      score: 45680,
      level: 25,
      mode: 'classic',
      period: 'all-time',
      achievedAt: new Date()
    }
  ]

  for (const entry of leaderboardEntries) {
    await prisma.leaderboard.create({
      data: entry
    })
  }

  // Create daily challenges
  console.log('📋 Creating daily challenges...')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const challenges = [
    {
      title: 'Score Hunter',
      description: 'Score 500 total points today',
      target: 500,
      reward: '200 XP',
      xpReward: 200,
      type: 'score',
      date: today
    },
    {
      title: 'Game Master',
      description: 'Play 3 games',
      target: 3,
      reward: '150 XP',
      xpReward: 150,
      type: 'games',
      date: today
    },
    {
      title: 'PvP Champion',
      description: 'Win 2 PvP matches',
      target: 2,
      reward: '300 XP',
      xpReward: 300,
      type: 'pvp_wins',
      date: today
    }
  ]

  for (const challenge of challenges) {
    // Just check if a challenge with this title exists
    const existing = await prisma.dailyChallenge.findFirst({
      where: { title: challenge.title }
    })

    if (!existing) {
      await prisma.dailyChallenge.create({
        data: challenge
      })
      console.log(`  ✓ ${challenge.title}`)
    }
  }

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
