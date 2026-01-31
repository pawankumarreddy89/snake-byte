'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  Gamepad2,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Shield,
  Search,
  Ban,
  Trash2,
  RefreshCw,
  BarChart3,
  Trophy
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  country?: string
  bio?: string
  totalScore: number
  gamesPlayed: number
  gamesWon: number
  highScore: number
  level: number
  experience: number
  eloRating: number
  createdAt: string
  _count: {
    gameSessions: number
    replays: number
    achievements: number
    chatMessages: number
  }
}

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalGames: number
    totalScore: number
    avgScore: number
    totalReplays: number
    totalAchievements: number
    totalPurchases: number
    totalRevenue: number
    engagementRate: number
  }
  recentActivity: any[]
  topPlayers: any[]
  dailyStats: any[]
}

interface ChatMessage {
  id: string
  message: string
  type: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
    email: string
  }
}

interface UserProfileProps {
  onClose: () => void
}

export function AdminDashboard({ onClose }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeframe, setTimeframe] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)

  // Moderation state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [moderationLoading, setModerationLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAnalytics()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'moderation') {
      fetchChatMessages()
    } else if (activeTab === 'activity') {
      fetchAnalytics()
    }
  }, [activeTab, timeframe, usersPage])

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({
        page: usersPage.toString(),
        limit: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      setUsers(data.users)
      setUsersTotal(data.pagination.total)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchChatMessages = async () => {
    setModerationLoading(true)
    try {
      const response = await fetch('/api/admin/moderation?type=chat')
      const data = await response.json()
      setChatMessages(data.messages)
    } catch (error) {
      console.error('Failed to fetch chat messages:', error)
    } finally {
      setModerationLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })

      if (response.ok) {
        fetchUsers()
        alert(`User ${action} successful`)
      }
    } catch (error) {
      console.error('Failed to perform user action:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsers()
        alert('User deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_message',
          targetId: messageId,
          targetType: 'chat'
        })
      })

      if (response.ok) {
        setChatMessages(messages => messages.filter(m => m.id !== messageId))
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400">Platform moderation and analytics</p>
            </div>
          </div>
          <Button onClick={onClose} variant="outline" className="text-slate-300 border-slate-600 hover:bg-slate-800">
            ← Back to Game
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-800/50">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="moderation">
              <Shield className="w-4 h-4 mr-2" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="activity">
              <TrendingUp className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Timeframe:</span>
              <Button
                variant={timeframe === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('all')}
              >
                All Time
              </Button>
              <Button
                variant={timeframe === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('today')}
              >
                Today
              </Button>
              <Button
                variant={timeframe === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('week')}
              >
                This Week
              </Button>
              <Button
                variant={timeframe === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('month')}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalytics}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {analyticsLoading ? (
              <div className="text-center py-12 text-slate-400">Loading analytics...</div>
            ) : analytics ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-white">{analytics.overview.totalUsers}</div>
                        <Users className="w-8 h-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-green-400">{analytics.overview.activeUsers}</div>
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        {analytics.overview.engagementRate}% engagement rate
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Total Games</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-white">{analytics.overview.totalGames}</div>
                        <Gamepad2 className="w-8 h-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Total Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-yellow-400">
                          {analytics.overview.totalScore.toLocaleString()}
                        </div>
                        <Trophy className="w-8 h-8 text-yellow-400" />
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        Avg: {analytics.overview.avgScore} pts/game
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Total Replays</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-white">{analytics.overview.totalReplays}</div>
                        <RefreshCw className="w-8 h-8 text-cyan-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Achievements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-purple-400">{analytics.overview.totalAchievements}</div>
                        <Trophy className="w-8 h-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Purchases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-white">{analytics.overview.totalPurchases}</div>
                        <DollarSign className="w-8 h-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-green-400">
                          {analytics.overview.totalRevenue.toLocaleString()}
                        </div>
                        <DollarSign className="w-8 h-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Players */}
                <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white">Top Players</CardTitle>
                    <CardDescription className="text-slate-400">Highest scoring players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-400">Rank</TableHead>
                          <TableHead className="text-slate-400">Player</TableHead>
                          <TableHead className="text-slate-400">Level</TableHead>
                          <TableHead className="text-slate-400">Games</TableHead>
                          <TableHead className="text-slate-400">High Score</TableHead>
                          <TableHead className="text-slate-400">Total Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.topPlayers.map((player, index) => (
                          <TableRow key={player.id} className="border-slate-700">
                            <TableCell className="text-white">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {player.avatar ? (
                                  <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                    {player.name.charAt(0)}
                                  </div>
                                )}
                                <span className="text-white">{player.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-white">{player.level}</TableCell>
                            <TableCell className="text-white">{player.gamesPlayed}</TableCell>
                            <TableCell className="text-yellow-400">{player.highScore.toLocaleString()}</TableCell>
                            <TableCell className="text-green-400">{player.totalScore.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        className="pl-10 w-64 bg-slate-900/50 border-slate-700 text-white"
                      />
                    </div>
                    <Button variant="outline" onClick={fetchUsers}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-slate-400">
                  Manage and moderate user accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-12 text-slate-400">Loading users...</div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-400">User</TableHead>
                          <TableHead className="text-slate-400">Email</TableHead>
                          <TableHead className="text-slate-400">Level</TableHead>
                          <TableHead className="text-slate-400">Games</TableHead>
                          <TableHead className="text-slate-400">Total Score</TableHead>
                          <TableHead className="text-slate-400">Status</TableHead>
                          <TableHead className="text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="border-slate-700">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                    {user.name?.charAt(0)}
                                  </div>
                                )}
                                <span className="text-white">{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{user.email}</TableCell>
                            <TableCell className="text-white">
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                Lvl {user.level}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white">{user.gamesPlayed}</TableCell>
                            <TableCell className="text-green-400">{user.totalScore.toLocaleString()}</TableCell>
                            <TableCell>
                              {user.bio?.includes('[BANNED]') ? (
                                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                                  Banned
                                </Badge>
                              ) : (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.bio?.includes('[BANNED]') ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUserAction(user.id, 'unban')}
                                  >
                                    Unban
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUserAction(user.id, 'ban')}
                                    >
                                      <Ban className="w-3 h-3 mr-1" />
                                      Ban
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUserAction(user.id, 'reset_stats')}
                                    >
                                      Reset
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-slate-400 text-sm">
                        Showing {(usersPage - 1) * 20 + 1} - {Math.min(usersPage * 20, usersTotal)} of {usersTotal}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={usersPage === 1}
                          onClick={() => setUsersPage(p => p - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={usersPage * 20 >= usersTotal}
                          onClick={() => setUsersPage(p => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Chat Moderation</CardTitle>
                  <Button variant="outline" onClick={fetchChatMessages}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <CardDescription className="text-slate-400">
                  Review and moderate chat messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                {moderationLoading ? (
                  <div className="text-center py-12 text-slate-400">Loading messages...</div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {message.user.avatar ? (
                                <img
                                  src={message.user.avatar}
                                  alt={message.user.name}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                  {message.user.name.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-white">{message.user.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {message.type}
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    {new Date(message.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-slate-300">{message.message}</p>
                                <p className="text-xs text-slate-500 mt-1">{message.user.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-slate-400">
                  Latest game sessions across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.recentActivity.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {analytics.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 flex items-center gap-4"
                        >
                          <div className="flex items-center gap-3">
                            {activity.user.avatar ? (
                              <img
                                src={activity.user.avatar}
                                alt={activity.user.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {activity.user.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{activity.user.name}</span>
                              <Badge variant="outline">{activity.mode}</Badge>
                              <Badge
                                className={
                                  activity.status === 'completed'
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                }
                              >
                                {activity.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-300">
                              Score: <span className="text-green-400 font-semibold">{activity.score}</span> |
                              Level: <span className="text-purple-400 font-semibold">{activity.level}</span> |
                              <span className="text-slate-400">
                                {new Date(activity.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-slate-400">No recent activity</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
