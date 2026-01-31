'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Star,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  Lock,
  Calendar,
  Gamepad2,
  X
} from 'lucide-react'

interface UserProfileProps {
  onClose: () => void
  userId?: string
  initialTab?: string
}

interface UserStats {
  totalScore: number
  gamesPlayed: number
  highScore: number
  level: number
  winRate: number
  avgScore: number
  playTime: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  maxProgress: number
  reward?: string
  unlockedAt?: Date
}

interface GameHistoryItem {
  id: string
  score: number
  duration: number
  mode: string
  date: Date
  result: string
}

interface DailyChallenge {
  id: string
  title: string
  description: string
  progress: number
  target: number
  completed: boolean
  reward: string
  xpReward: number
}

interface BattlePassLevel {
  level: number
  xpRequired: number
  rewards: string[]
  unlocked: boolean
}

export function UserProfile({ onClose, userId = '1', initialTab = 'overview' }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([])
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([])
  const [battlePassLevel, setBattlePassLevel] = useState<number>(1)
  const [battlePassXP, setBattlePassXP] = useState<number>(0)
  const [battlePassLevels, setBattlePassLevels] = useState<BattlePassLevel[]>([])

  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    setLoading(true)
    try {
      // Load user stats
      const statsRes = await fetch('/api/profile/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      } else {
        // Mock data for demo
        setStats({
          totalScore: 15420,
          gamesPlayed: 87,
          highScore: 320,
          level: 12,
          winRate: 67.5,
          avgScore: 177.2,
          playTime: 32400 // seconds
        })
      }

      // Load achievements
      const achievementsRes = await fetch('/api/achievements')
      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json()
        setAchievements(achievementsData)
      } else {
        // Mock achievements for demo
        setAchievements([
          {
            id: 'first-game',
            name: 'First Steps',
            description: 'Play your first game',
            icon: '🎮',
            unlocked: true,
            progress: 1,
            maxProgress: 1,
            reward: '100 XP',
            unlockedAt: new Date('2024-01-15')
          },
          {
            id: 'score-100',
            name: 'Century Club',
            description: 'Score 100 points in a single game',
            icon: '💯',
            unlocked: true,
            progress: 1,
            maxProgress: 1,
            reward: '200 XP',
            unlockedAt: new Date('2024-01-16')
          },
          {
            id: 'score-250',
            name: 'Quarter Master',
            description: 'Score 250 points in a single game',
            icon: '🏆',
            unlocked: true,
            progress: 1,
            maxProgress: 1,
            reward: '500 XP',
            unlockedAt: new Date('2024-01-20')
          },
          {
            id: 'games-50',
            name: 'Dedicated Player',
            description: 'Play 50 games',
            icon: '⭐',
            unlocked: true,
            progress: 50,
            maxProgress: 50,
            reward: '300 XP + Skin',
            unlockedAt: new Date('2024-02-01')
          },
          {
            id: 'games-100',
            name: 'Veteran',
            description: 'Play 100 games',
            icon: '🎖️',
            unlocked: false,
            progress: 87,
            maxProgress: 100,
            reward: '1000 XP + Rare Skin'
          },
          {
            id: 'pvp-wins-10',
            name: 'Competitor',
            description: 'Win 10 PvP matches',
            icon: '⚔️',
            unlocked: false,
            progress: 6,
            maxProgress: 10,
            reward: '500 XP + Title'
          },
          {
            id: 'total-score-10000',
            name: 'High Scorer',
            description: 'Accumulate 10,000 total points',
            icon: '🌟',
            unlocked: true,
            progress: 15420,
            maxProgress: 10000,
            reward: '750 XP',
            unlockedAt: new Date('2024-02-10')
          },
          {
            id: 'daily-streak-7',
            name: 'Week Warrior',
            description: 'Maintain a 7-day login streak',
            icon: '🔥',
            unlocked: true,
            progress: 7,
            maxProgress: 7,
            reward: '350 XP + Streak Bonus',
            unlockedAt: new Date('2024-02-15')
          }
        ])
      }

      // Load game history
      const historyRes = await fetch('/api/games/history')
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setGameHistory(historyData.games || [])
      } else {
        // Mock game history for demo
        setGameHistory([
          {
            id: '1',
            score: 320,
            duration: 542,
            mode: 'Classic',
            date: new Date('2024-02-20T14:30:00'),
            result: 'Victory'
          },
          {
            id: '2',
            score: 210,
            duration: 387,
            mode: 'PvP',
            date: new Date('2024-02-20T12:15:00'),
            result: 'Defeat'
          },
          {
            id: '3',
            score: 285,
            duration: 489,
            mode: 'Classic',
            date: new Date('2024-02-19T18:45:00'),
            result: 'Victory'
          },
          {
            id: '4',
            score: 175,
            duration: 298,
            mode: 'PvP',
            date: new Date('2024-02-19T10:20:00'),
            result: 'Victory'
          },
          {
            id: '5',
            score: 245,
            duration: 421,
            mode: 'Classic',
            date: new Date('2024-02-18T16:00:00'),
            result: 'Victory'
          }
        ])
      }

      // Load daily challenges
      const challengesRes = await fetch('/api/battle-pass/challenges')
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json()
        setDailyChallenges(challengesData)
      } else {
        // Mock daily challenges for demo
        setDailyChallenges([
          {
            id: 'daily-1',
            title: 'Score Hunter',
            description: 'Score 500 total points today',
            progress: 320,
            target: 500,
            completed: false,
            reward: '200 XP',
            xpReward: 200
          },
          {
            id: 'daily-2',
            title: 'Game Master',
            description: 'Play 3 games',
            progress: 2,
            target: 3,
            completed: false,
            reward: '150 XP',
            xpReward: 150
          },
          {
            id: 'daily-3',
            title: 'PvP Champion',
            description: 'Win 2 PvP matches',
            progress: 1,
            target: 2,
            completed: false,
            reward: '300 XP',
            xpReward: 300
          }
        ])
      }

      // Load battle pass progress
      const battlePassRes = await fetch('/api/battle-pass/progress')
      if (battlePassRes.ok) {
        const battlePassData = await battlePassRes.json()
        setBattlePassLevel(battlePassData.level)
        setBattlePassXP(battlePassData.xp)
        setBattlePassLevels(battlePassData.levels)
      } else {
        // Mock battle pass data for demo
        setBattlePassLevel(5)
        setBattlePassXP(750)
        setBattlePassLevels([
          { level: 1, xpRequired: 0, rewards: ['100 Coins', 'Basic Skin'], unlocked: true },
          { level: 2, xpRequired: 200, rewards: ['150 Coins', 'XP Boost'], unlocked: true },
          { level: 3, xpRequired: 400, rewards: ['200 Coins', 'Rare Skin'], unlocked: true },
          { level: 4, xpRequired: 600, rewards: ['300 Coins', 'Title: Novice'], unlocked: true },
          { level: 5, xpRequired: 800, rewards: ['400 Coins', 'Epic Skin'], unlocked: false },
          { level: 6, xpRequired: 1000, rewards: ['500 Coins', 'Title: Expert'], unlocked: false },
          { level: 7, xpRequired: 1250, rewards: ['600 Coins', 'Legendary Skin'], unlocked: false },
          { level: 8, xpRequired: 1500, rewards: ['800 Coins', 'Title: Master'], unlocked: false },
          { level: 9, xpRequired: 1800, rewards: ['1000 Coins', 'Mega Pack'], unlocked: false },
          { level: 10, xpRequired: 2000, rewards: ['2000 Coins', 'Mythic Skin', 'Title: Legend'], unlocked: false }
        ])
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return dateObj.toLocaleDateString()
  }

  const currentLevelXP = battlePassLevels[battlePassLevel - 1]?.xpRequired || 0
  const nextLevelXP = battlePassLevels[battlePassLevel]?.xpRequired || 0
  const xpProgress = nextLevelXP > 0 ? ((battlePassXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-100 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-foreground text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-100 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-lg border-b border-slate-300 dark:border-slate-700/50 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-foreground">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 dark:from-purple-400 via-pink-600 dark:via-pink-400 to-orange-600 dark:to-orange-400 bg-clip-text text-transparent">Player Profile</h1>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="hidden sm:inline-flex">
            Close
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-200">Total Score</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.totalScore.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-200">Games</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.gamesPlayed}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-200">High Score</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.highScore}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-200">Level</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.level}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-200">Win Rate</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.winRate}%</p>
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-200">Play Time</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{formatTime(stats.playTime)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-200/50 dark:bg-slate-700/40">
              <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Achievements</span>
                <span className="sm:hidden">Awards</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Game History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
              <TabsTrigger value="battlepass" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Battle Pass</span>
                <span className="sm:hidden">Pass</span>
              </TabsTrigger>
            </TabsList>

            {/* Achievements Tab */}
            <TabsContent value="overview" className="mt-4 sm:mt-6">
              <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      Achievements
                    </CardTitle>
                    <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs sm:text-sm w-fit">
                      {achievements.filter(a => a.unlocked).length}/{achievements.length} Unlocked
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-600 dark:text-slate-200 text-xs sm:text-sm">
                    Complete challenges and reach milestones to unlock rewards!
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                  <ScrollArea className="h-[400px] sm:h-[500px] pr-2 sm:pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                      {achievements.map((achievement) => (
                        <Card
                          key={achievement.id}
                          className={`${
                            achievement.unlocked
                              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                              : 'bg-slate-200/50 dark:bg-slate-700/40 border-slate-300 dark:border-slate-700/50 opacity-60'
                          }`}
                        >
                          <CardContent className="p-2 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-4">
                              <div
                                className={`text-2xl sm:text-3xl ${
                                  achievement.unlocked ? '' : 'grayscale'
                                }`}
                              >
                                {achievement.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                  <h3 className={`font-semibold text-sm sm:text-base ${achievement.unlocked ? 'text-foreground' : 'text-slate-500 dark:text-slate-400'} truncate`}>
                                    {achievement.name}
                                  </h3>
                                  {achievement.unlocked ? (
                                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                                  ) : (
                                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-200 mb-1 sm:mb-2 line-clamp-2">{achievement.description}</p>

                                {achievement.progress > 0 && (
                                  <div className="space-y-1">
                                    <Progress
                                      value={(achievement.progress / achievement.maxProgress) * 100}
                                      className="h-1 sm:h-2"
                                    />
                                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                      <span className="text-slate-600 dark:text-slate-200">
                                        {achievement.progress} / {achievement.maxProgress}
                                      </span>
                                      {achievement.reward && (
                                        <span className="text-purple-400 font-medium">{achievement.reward}</span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {achievement.unlocked && achievement.unlockedAt && (
                                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2">
                                    <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
                                    <span>Unlocked {formatDate(achievement.unlockedAt)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Game History Tab */}
            <TabsContent value="history" className="mt-4 sm:mt-6">
              <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    Game History
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-200 text-xs sm:text-sm">
                    Track your recent games and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                  <ScrollArea className="h-[400px] sm:h-[500px]">
                    <div className="space-y-2 sm:space-y-3">
                      {!Array.isArray(gameHistory) || gameHistory.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 text-slate-400">
                          <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 opacity-50" />
                          <p className="text-sm sm:text-base">No games played yet</p>
                          <p className="text-xs sm:text-sm mt-2">Start playing to see your game history!</p>
                        </div>
                      ) : (
                        gameHistory.map((game) => (
                        <Card key={game.id} className="bg-slate-200/50 dark:bg-slate-700/40 border-slate-300 dark:border-slate-700/50">
                          <CardContent className="p-2 sm:p-4">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                <div
                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    game.result === 'Victory'
                                      ? 'bg-green-500/20'
                                      : 'bg-red-500/20'
                                  }`}
                                >
                                  {game.result === 'Victory' ? (
                                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                                  ) : (
                                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{game.mode} Mode</h3>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-sm text-slate-600 dark:text-slate-200">
                                    <span className="flex items-center gap-1">
                                      <Target className="w-2 h-2 sm:w-3 sm:h-3" />
                                      Score: {game.score}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
                                      {formatTime(game.duration)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-2 h-2 sm:w-3 sm:h-3" />
                                      <span className="hidden sm:inline">{formatDate(game.date)}</span>
                                      <span className="sm:hidden">{formatDate(game.date).split(' ')[0]}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  game.result === 'Victory'
                                    ? 'border-green-500/30 text-green-400'
                                    : 'border-red-500/30 text-red-400'
                                }
                              >
                                {game.result}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Battle Pass Tab */}
            <TabsContent value="battlepass" className="mt-4 sm:mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Battle Pass Progress */}
                <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50 lg:col-span-1">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      Battle Pass
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-200 text-xs sm:text-sm">
                      Level up to unlock exclusive rewards!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                        {battlePassLevel}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200">Current Level</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-slate-600 dark:text-slate-200">XP Progress</span>
                        <span className="text-foreground font-medium text-xs sm:text-sm">
                          {battlePassXP} / {nextLevelXP} XP
                        </span>
                      </div>
                      <Progress value={xpProgress} className="h-2 sm:h-3" />
                    </div>

                    <Card className="bg-slate-200/50 dark:bg-slate-700/40 border-slate-300 dark:border-slate-700/50">
                      <CardContent className="p-2 sm:p-4">
                        <h4 className="font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                          Daily Challenges
                        </h4>
                        <div className="space-y-2 sm:space-y-3">
                          {dailyChallenges.map((challenge) => (
                            <div key={challenge.id} className="space-y-1 sm:space-y-2">
                              <div className="flex items-start justify-between gap-1 sm:gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{challenge.title}</p>
                                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-200 line-clamp-1">{challenge.description}</p>
                                </div>
                                {challenge.completed ? (
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                                ) : (
                                  <Badge variant="outline" className="text-purple-400 border-purple-500/30 text-[10px] sm:text-xs">
                                    {challenge.reward}
                                  </Badge>
                                )}
                              </div>
                              <Progress
                                value={(challenge.progress / challenge.target) * 100}
                                className="h-1 sm:h-2"
                              />
                              <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-600 dark:text-slate-200">
                                <span>{challenge.progress} / {challenge.target}</span>
                                <span className="text-purple-400">+{challenge.xpReward} XP</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                {/* Battle Pass Levels */}
                <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50 lg:col-span-2">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-foreground text-lg sm:text-xl">Rewards Track</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-200 text-xs sm:text-sm">
                      Unlock rewards as you progress through the battle pass
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6">
                    <ScrollArea className="h-[400px] sm:h-[500px]">
                      <div className="space-y-2 sm:space-y-3">
                        {battlePassLevels.map((level, index) => (
                          <Card
                            key={level.level}
                            className={`${
                              level.unlocked
                                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                                : level.level === battlePassLevel
                                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
                                : 'bg-slate-200/50 dark:bg-slate-700/40 border-slate-300 dark:border-slate-700/50 opacity-50'
                            }`}
                          >
                            <CardContent className="p-2 sm:p-4">
                              <div className="flex items-start sm:items-center gap-2 sm:gap-4">
                                <div
                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0 ${
                                    level.unlocked
                                      ? 'bg-yellow-500 text-white'
                                      : level.level === battlePassLevel
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {level.level}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Level {level.level}</h3>
                                    {level.unlocked && (
                                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 sm:gap-2">
                                    {level.rewards.map((reward, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className={
                                          level.unlocked
                                            ? 'border-yellow-500/30 text-yellow-400 text-[10px] sm:text-xs'
                                            : 'border-slate-600 text-slate-400 text-[10px] sm:text-xs'
                                        }
                                      >
                                        {reward}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-200">Required XP</p>
                                  <p className="font-semibold text-foreground text-xs sm:text-base">{level.xpRequired}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
