'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, TrendingUp, Clock, Users, Globe, ArrowUp, ArrowDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LeaderboardEntry {
  id: string
  userId: string
  name: string
  avatar?: string
  country?: string
  score: number
  level: number
  achievedAt: string
  rank?: number
}

interface LeaderboardProps {
  userId?: string
}

export function Leaderboard({ userId }: LeaderboardProps) {
  const [mode, setMode] = useState<'classic' | 'pvp' | 'battle-royale' | 'cooperative'>('classic')
  const [period, setPeriod] = useState<'all-time' | 'weekly' | 'daily'>('all-time')
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboards()
  }, [mode, period])

  const fetchLeaderboards = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        mode,
        period,
        limit: '50'
      })

      if (userId) {
        params.append('userId', userId)
      }

      const response = await fetch(`/api/leaderboards?${params}`)
      const data = await response.json()

      setLeaderboards(
        data.leaderboards.map((entry: any, index: number) => ({
          ...entry,
          rank: index + 1
        }))
      )
      setUserRank(data.userRank)
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="text-slate-400 font-semibold w-5 text-center">{rank}</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">#1</Badge>
    if (rank === 2) return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">#2</Badge>
    if (rank === 3) return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">#3</Badge>
    return <Badge variant="outline">#{rank}</Badge>
  }

  return (
    <Card className="bg-white/50 dark:bg-slate-700/40 backdrop-blur-xl border-slate-300 dark:border-slate-700/50 w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Leaderboards
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-200">
              Compete with players worldwide
            </CardDescription>
          </div>
          {userId && userRank && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 rounded-lg border border-purple-500/30">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 font-semibold">Your Rank: #{userRank}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classic" onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-slate-200/50 dark:bg-slate-700/40">
            <TabsTrigger value="classic">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Classic
            </TabsTrigger>
            <TabsTrigger value="pvp">
              <Users className="w-4 h-4 mr-2" />
              PvP
            </TabsTrigger>
            <TabsTrigger value="battle-royale">
              <TrendingUp className="w-4 h-4 mr-2" />
              Battle Royale
            </TabsTrigger>
            <TabsTrigger value="cooperative">
              <Users className="w-4 h-4 mr-2" />
              Co-op
            </TabsTrigger>
          </TabsList>

          <TabsContent value={mode} className="space-y-4">
            {/* Period Selector */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={period === 'all-time' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('all-time')}
                className={period === 'all-time' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                <Globe className="w-4 h-4 mr-2" />
                All Time
              </Button>
              <Button
                variant={period === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('weekly')}
                className={period === 'weekly' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Weekly
              </Button>
              <Button
                variant={period === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('daily')}
                className={period === 'daily' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                <Clock className="w-4 h-4 mr-2" />
                Daily
              </Button>
            </div>

            {/* Leaderboard List */}
            {loading ? (
              <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading leaderboards...</div>
            ) : leaderboards.length === 0 ? (
              <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                No entries yet. Be the first to compete!
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {leaderboards.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        userId === entry.userId
                          ? 'bg-purple-500/10 border border-purple-500/30'
                          : 'bg-slate-200/50 dark:bg-slate-700/40 hover:bg-slate-300/50 dark:hover:bg-slate-600/40'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-lg">
                        {getRankIcon(entry.rank!)}
                      </div>

                      {/* Player Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {entry.avatar ? (
                          <img
                            src={entry.avatar}
                            alt={entry.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate">{entry.name}</p>
                            {entry.country && (
                              <span className="text-2xl">{getCountryFlag(entry.country)}</span>
                            )}
                            {userId === entry.userId && (
                              <Badge variant="outline" className="border-green-500/30 text-green-400">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Level {entry.level}</p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{entry.score.toLocaleString()}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function Gamepad2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h4m-2-2v4" />
      <circle cx="16" cy="10" r="2" />
      <circle cx="16" cy="14" r="2" />
    </svg>
  )
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'US': '🇺🇸',
    'UK': '🇬🇧',
    'CA': '🇨🇦',
    'AU': '🇦🇺',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'ES': '🇪🇸',
    'IT': '🇮🇹',
    'JP': '🇯🇵',
    'KR': '🇰🇷',
    'CN': '🇨🇳',
    'BR': '🇧🇷',
    'IN': '🇮🇳',
    'RU': '🇷🇺',
    'MX': '🇲🇽'
  }
  return flags[country.toUpperCase()] || '🌍'
}
