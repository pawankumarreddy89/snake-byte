'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Play,
  Users,
  Trophy,
  X,
  Target,
  Heart,
  Shield,
  MessageSquare,
  CheckCircle2,
  Star,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

interface Player {
  id: string
  name: string
  score: number
  color: string
  isLeader: boolean
}

interface TeamObjective {
  id: string
  title: string
  description: string
  target: number
  progress: number
  completed: boolean
  xpReward: number
}

interface CoopGameProps {
  onExit?: () => void
}

export function CoopGame({ onExit }: CoopGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playerName, setPlayerName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [coopMode, setCoopMode] = useState<'shared-snake' | 'team-snakes'>('shared-snake')
  const [isInRoom, setIsInRoom] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [gameResult, setGameResult] = useState<{ teamScore: number; completed: boolean } | null>(null)
  const [teamMembers, setTeamMembers] = useState<Player[]>([])
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null)
  const [chatInput, setChatInput] = useState('')

  const socket = useSocket()

  // Game constants
  const GRID_SIZE = 20
  const CANVAS_SIZE = 600

  function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)
  }


  // Synchronize game state with socket status
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (socket.gameStatus === 'playing' && !isPlaying) {
      setIsPlaying(true)
      setGameResult(null)
    } else if (socket.gameStatus === 'waiting' && !isWaiting) {
      setIsWaiting(true)
      setCountdown(null)
    } else if (socket.gameStatus === 'finished') {
      setIsPlaying(false)
      setIsWaiting(false)
      if (socket.players.length > 0) {
        const teamScore = socket.players.reduce((sum: any, p: any) => sum + p.score, 0)
        setGameResult({
          teamScore,
          completed: teamScore >= 500 // Win condition: 500 team points
        })
      }
    }
  }, [socket.gameStatus])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Synchronize team members with socket
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Update team members
    const me = socket.players.find(p => p.id === socket.playerId)
    if (me) {
      setLocalPlayer({
        id: me.id,
        name: (me as any).name || 'Player',
        score: me.score || 0,
        color: me.color || '#4ade80',
        isLeader: (me as any).isLeader || false
      })
    }

    const members = socket.players
      .filter(p => p.id !== socket.playerId)
      .map((p: any) => ({
        id: p.id,
        name: p.name || 'Player',
        score: p.score || 0,
        color: p.color || '#3b82f6',
        isLeader: p.isLeader || false
      }))

    if (JSON.stringify(members) !== JSON.stringify(teamMembers)) {
      setTeamMembers(members)
    }
  }, [socket.players, socket.playerId])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Objectives
  const [teamObjectives, setTeamObjectives] = useState<TeamObjective[]>([
    {
      id: 'obj-1',
      title: 'Reach 500 Points',
      description: 'Work together to score 500 team points',
      target: 500,
      progress: 0,
      completed: false,
      xpReward: 300
    },
    {
      id: 'obj-2',
      title: 'Collect 20 Food',
      description: 'Team up to collect 20 food items',
      target: 20,
      progress: 0,
      completed: false,
      xpReward: 200
    },
    {
      id: 'obj-3',
      title: 'Survive 10 Minutes',
      description: 'Keep your snake alive for 10 minutes',
      target: 600,
      progress: 0,
      completed: false,
      xpReward: 250
    }
  ])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !socket.gameState) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = '#2a2a4e'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * (CANVAS_SIZE / GRID_SIZE), 0)
      ctx.lineTo(i * (CANVAS_SIZE / GRID_SIZE), CANVAS_SIZE)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * (CANVAS_SIZE / GRID_SIZE))
      ctx.lineTo(CANVAS_SIZE, i * (CANVAS_SIZE / GRID_SIZE))
      ctx.stroke()
    }

    // Draw team snake (shared snake in shared-snake mode)
    if (socket.gameState.snake) {
      socket.gameState.snake.forEach((segment, index) => {
        const gradient = ctx.createRadialGradient(
          segment.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
          segment.y * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
          0,
          segment.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
          segment.y * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
          (CANVAS_SIZE / GRID_SIZE) / 2
        )

        // Team gradient (mix of player colors)
        if (index === 0) {
          gradient.addColorStop(0, '#4ade80')
          gradient.addColorStop(0.5, '#3b82f6')
          gradient.addColorStop(1, '#22c55e')
        } else {
          gradient.addColorStop(0, shadeColor('#22c55e', 20))
          gradient.addColorStop(1, '#22c55e')
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(
          segment.x * (CANVAS_SIZE / GRID_SIZE) + 2,
          segment.y * (CANVAS_SIZE / GRID_SIZE) + 2,
          (CANVAS_SIZE / GRID_SIZE) - 4,
          (CANVAS_SIZE / GRID_SIZE) - 4,
          4
        )
        ctx.fill()

        // Draw team logo on head
        if (index === 0) {
          ctx.fillStyle = '#fff'
          const eyeSize = 3
          const eyeOffset = 6
          ctx.beginPath()
          ctx.arc(
            segment.x * (CANVAS_SIZE / GRID_SIZE) + eyeOffset,
            segment.y * (CANVAS_SIZE / GRID_SIZE) + eyeOffset,
            eyeSize,
            0,
            Math.PI * 2
          )
          ctx.arc(
            segment.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) - eyeOffset,
            segment.y * (CANVAS_SIZE / GRID_SIZE) + eyeOffset,
            eyeSize,
            0,
            Math.PI * 2
          )
          ctx.fill()

          // Team heart badge
          ctx.fillStyle = '#ec4899'
          ctx.beginPath()
          ctx.arc(
            segment.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
            segment.y * (CANVAS_SIZE / GRID_SIZE) - 15,
            8,
            0,
            Math.PI * 2
          )
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 10px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('♥',
            segment.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
            segment.y * (CANVAS_SIZE / GRID_SIZE) - 15
          )
        }
      })
    }

    // Draw food with glow
    if (socket.gameState.food) {
      const foodX = socket.gameState.food.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2
      const foodY = socket.gameState.food.y * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2

      ctx.shadowColor = '#ec4899'
      ctx.shadowBlur = 15

      const foodGradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, (CANVAS_SIZE / GRID_SIZE) / 2 - 4)
      foodGradient.addColorStop(0, '#f472b6')
      foodGradient.addColorStop(1, '#db2777')

      ctx.fillStyle = foodGradient
      ctx.beginPath()
      ctx.arc(foodX, foodY, (CANVAS_SIZE / GRID_SIZE) / 2 - 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
    }
  }, [socket.gameState])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || !socket.gameState) return

      const snake = [...socket.gameState.snake]
      const head = { ...snake[0] }
      let newDirection = ''

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          if (snake[1] && snake[1].y === head.y + 1) return
          newDirection = 'up'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          if (snake[1] && snake[1].y === head.y - 1) return
          newDirection = 'down'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          if (snake[1] && snake[1].x === head.x + 1) return
          newDirection = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          if (snake[1] && snake[1].x === head.x - 1) return
          newDirection = 'right'
          break
      }

      if (newDirection) {
        let newHead = { ...head }

        switch (newDirection) {
          case 'up':
            newHead.y -= 1
            break
          case 'down':
            newHead.y += 1
            break
          case 'left':
            newHead.x -= 1
            break
          case 'right':
            newHead.x += 1
            break
        }

        // Check collisions
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          return // Team shares collision
        }

        // Self collision
        if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
          return
        }

        const newSnake = [newHead, ...snake]

        // Check food collision
        if (socket.gameState?.food && newHead.x === socket.gameState.food.x && newHead.y === socket.gameState.food.y) {
          socket.eatFood(10)
          socket.sendMove(newSnake, (localPlayer?.score || 0) + 10)
        } else {
          newSnake.pop()
          socket.sendMove(newSnake, localPlayer?.score || 0)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, socket.gameState, localPlayer])

  const handleJoin = () => {
    if (!playerName.trim()) {
      alert('Please enter your name')
      return
    }
    if (coopMode === 'shared-snake' && !teamName.trim()) {
      alert('Please enter your team name')
      return
    }
    socket.joinGame(playerName, 'coop')
    setIsJoined(true)
    setIsInRoom(true)
  }

  const handleLeave = () => {
    socket.leaveRoom()
    setIsJoined(false)
    setIsPlaying(false)
    setIsWaiting(false)
    setGameResult(null)
    setLocalPlayer(null)
    setTeamMembers([])
    onExit?.()
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    socket.sendChatMessage(chatInput)
    setChatInput('')
  }

  function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)
  }

  const allTeamMembers = [localPlayer, ...teamMembers].filter((p): p is Player => p !== null)
  const teamScore = socket.players.reduce((sum: any, p: any) => sum + (p.score || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex flex-col p-6">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent dark:from-green-400 dark:to-teal-400">Co-op Mode</h1>
              <p className="text-muted-foreground dark:text-slate-400 text-sm">Work together with friends!</p>
            </div>
          </div>
          {isInRoom ? (
            <Button variant="outline" onClick={handleLeave}>
              <X className="w-4 h-4 mr-2" />
              Leave Co-op
            </Button>
          ) : (
            <Button variant="outline" onClick={handleLeave}>
              <X className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            {!isInRoom && (
              /* Lobby Screen */
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <Heart className="w-12 h-12 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-white mb-2">Cooperative Mode</CardTitle>
                  <CardDescription className="text-lg text-slate-400">
                    Team up with friends and achieve shared objectives!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Co-op Mode Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Choose Co-op Mode
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={coopMode === 'shared-snake' ? 'default' : 'outline'}
                        className={coopMode === 'shared-snake' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                        onClick={() => setCoopMode('shared-snake')}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Shared Snake
                      </Button>
                      <Button
                        variant={coopMode === 'team-snakes' ? 'default' : 'outline'}
                        className={coopMode === 'team-snakes' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                        onClick={() => setCoopMode('team-snakes')}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Team Snakes
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400">
                      {coopMode === 'shared-snake'
                        ? 'Control one snake together - take turns or move simultaneously'
                        : 'Multiple snakes working together independently'}
                    </p>
                  </div>

                  {/* Team Name (for shared snake mode) */}
                  {coopMode === 'shared-snake' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Team Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your team name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="bg-muted/50 dark:bg-muted/50 dark:bg-slate-900/50border-border dark:border-slate-700 text-white text-lg py-3"
                        maxLength={20}
                      />
                    </div>
                  )}

                  {/* Player Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Player Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                      className="bg-muted/50 dark:bg-muted/50 dark:bg-slate-900/50border-border dark:border-slate-700 text-white text-lg py-3"
                      maxLength={20}
                    />
                  </div>

                  {!socket.isConnected ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse text-yellow-400 text-lg">
                        Connecting to server...
                      </div>
                    </div>
                  ) : !isJoined ? (
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-xl"
                      onClick={handleJoin}
                    >
                      <Play className="w-6 h-6 mr-3" />
                      Start Co-op Game
                    </Button>
                  ) : (
                    <div className="text-center py-8">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
                        <span className="text-lg text-slate-300">Waiting for teammates...</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center space-y-3">
                    <h3 className="text-lg font-semibold text-white">How to Play</h3>
                    <div className="text-sm text-slate-400 space-y-2 text-left inline-block">
                      <p>🎮 Use Arrow Keys or WASD to move</p>
                      <p>❤️ Work together - share control or coordinate</p>
                      <p>🎯 Achieve team objectives together</p>
                      <p>🏆 Complete shared goals as a team</p>
                      <p>💬 Use team chat to coordinate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isInRoom && isWaiting && (
              /* Waiting / Countdown Screen */
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardContent className="py-16 text-center">
                  {countdown !== null ? (
                    <div>
                      <div className="text-8xl font-bold text-white mb-4">
                        {countdown}
                      </div>
                      <p className="text-xl text-slate-400">Game Starting!</p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-8">
                        <Heart className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Waiting for Team...
                      </h2>
                      <p className="text-muted-foreground dark:text-slate-400 text-lg">
                        {allTeamMembers.length} / 4 players joined
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-green-400">Connected to co-op room</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isInRoom && isPlaying && (
              /* Game Screen */
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground dark:text-white">Co-op Arena</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        In Progress
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {allTeamMembers.length} Players
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                      className="rounded-lg border-2 border-slate-700/50 w-full"
                    />
                  </div>

                  {/* Team Score Display */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-3 bg-emerald-500/20 px-6 py-3 rounded-lg border border-emerald-500/30">
                      <Star className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-sm text-slate-400">Team Score</p>
                        <p className="text-3xl font-bold text-emerald-400">{teamScore}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isInRoom && gameResult && (
              /* Game Result Screen */
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardContent className="py-16 text-center">
                  <div className="mb-6">
                    {gameResult.completed ? (
                      <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                    ) : (
                      <Heart className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                    )}
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    {gameResult.completed ? (
                      <span className="text-green-400">Team Victory!</span>
                    ) : (
                      <span className="text-yellow-400">Game Over</span>
                    )}
                  </h2>
                  <p className="text-2xl text-slate-300 mb-8">
                    Final Team Score: <span className="font-bold text-emerald-400">{gameResult.teamScore}</span>
                  </p>
                  <p className="text-lg text-slate-400 mb-8">
                    {gameResult.completed
                      ? 'Amazing teamwork! You achieved your objective!'
                      : 'Nice try! Work together and try again!'}
                  </p>

                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      onClick={handleJoin}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Play Again
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleLeave}
                    >
                      <X className="w-5 h-5 mr-2" />
                      Leave Co-op
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Panel - Team Info */}
          <div className="space-y-6">
            {/* Team Members Card */}
            <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allTeamMembers.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm">No team members yet</p>
                  ) : (
                    allTeamMembers.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          player.id === socket.playerId
                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-muted/50 dark:bg-muted/50 dark:bg-slate-900/50border-border dark:border-slate-700/50'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: player.color }}
                        >
                          <span className="text-white font-bold">{player.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white">{player.name}</p>
                            {player.isLeader && (
                              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-xs">
                                Leader
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Score: {player.score}</span>
                            {player.id === socket.playerId && (
                              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Objectives Card */}
            <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Team Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamObjectives.map((objective) => (
                    <div
                      key={objective.id}
                      className={`p-4 rounded-lg border-2 ${
                        objective.completed
                          ? 'bg-green-500/20 border-green-500/30'
                          : 'bg-muted/50 dark:bg-muted/50 dark:bg-slate-900/50border-border dark:border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {objective.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Zap className="w-5 h-5 text-blue-400" />
                            )}
                            <h4 className="font-semibold text-white">{objective.title}</h4>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              objective.completed
                                ? 'text-green-400 border-green-500/30'
                                : 'text-purple-400 border-purple-500/30'
                            }`}
                          >
                            +{objective.xpReward} XP
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{objective.description}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            Progress: {objective.progress} / {objective.target}
                          </span>
                          <span className="text-blue-400">
                            {Math.round((objective.progress / objective.target) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              objective.completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, (objective.progress / objective.target) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Chat Card */}
            <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Team Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto mb-4 border border-slate-700/50 rounded-lg p-3">
                  {socket.chatMessages.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm">
                      No messages yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {socket.chatMessages.map((msg, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-semibold text-emerald-400">
                            {(msg as any).playerName}:
                          </span>
                          <span className="text-muted-foreground dark:text-slate-300 ml-2">{msg.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {isInRoom && (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Type a team message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      className="bg-muted/50 dark:bg-muted/50 dark:bg-slate-900/50border-border dark:border-slate-700 text-white"
                      maxLength={200}
                    />
                    <Button size="icon" onClick={handleSendChat}>
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
