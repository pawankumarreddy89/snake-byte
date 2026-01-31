'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Play,
  Users,
  Trophy,
  X,
  Target,
  Zap,
  Shield,
  Skull,
  Eye,
  Clock
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

interface Player {
  id: string
  name: string
  snake: Array<{ x: number; y: number }>
  score: number
  color: string
  eliminated: boolean
  position?: number
}

interface PowerUp {
  id: string
  type: 'speed' | 'shield' | 'slow' | 'points'
  x: number
  y: number
  duration: number
}

interface BattleRoyaleProps {
  onExit?: () => void
}

export function BattleRoyale({ onExit }: BattleRoyaleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playerName, setPlayerName] = useState('')
  const [isInRoom, setIsInRoom] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpectator, setIsSpectator] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [gameResult, setGameResult] = useState<{ winner: string; position: number } | null>(null)
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null)
  const [otherPlayers, setOtherPlayers] = useState<Player[]>([])
  const [chatInput, setChatInput] = useState('')

  const socket = useSocket()

  // Game constants
  const GRID_SIZE = 20
  const CANVAS_SIZE = 600
  const INITIAL_ARENA_SIZE = GRID_SIZE

  // Power-ups
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; remaining: number } | null>(null)

  // Arena shrinking
  const [arenaSize, setArenaSize] = useState(GRID_SIZE)
  const [shrinkTimer, setShrinkTimer] = useState<number>(60) // seconds before next shrink

  // Helper functions (must be defined before use)
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

  function spawnPowerUp() {
    const types: PowerUp['type'][] = ['speed', 'shield', 'slow', 'points']
    const type = types[Math.floor(Math.random() * types.length)]

    // Random position within current arena
    const x = Math.floor(Math.random() * arenaSize)
    const y = Math.floor(Math.random() * arenaSize)

    const newPowerUp: PowerUp = {
      id: `powerup-${Date.now()}-${Math.random()}`,
      type,
      x,
      y,
      duration: 10000 // 10 seconds
    }

    setPowerUps(prev => [...prev, newPowerUp])

    // Remove after duration
    setTimeout(() => {
      setPowerUps(prev => prev.filter(p => p.id !== newPowerUp.id))
    }, 10000)
  }

  function applyPowerUp(powerUp: PowerUp) {
    switch (powerUp.type) {
      case 'speed':
        setActivePowerUp({ type: 'Speed Boost', remaining: 10 })
        setTimeout(() => setActivePowerUp(null), 10000)
        break
      case 'shield':
        setActivePowerUp({ type: 'Shield', remaining: 10 })
        setTimeout(() => setActivePowerUp(null), 10000)
        break
      case 'slow':
        // Slow down all other players
        setActivePowerUp({ type: 'Slow', remaining: 10 })
        setTimeout(() => setActivePowerUp(null), 10000)
        break
      case 'points':
        socket.eatFood(50)
        break
    }
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
      // Determine result
      if (localPlayer) {
        const survivors = socket.players.filter((p: any) => !(p as any).eliminated)
        const myPosition = localPlayer.eliminated
          ? (socket.players.find((p: any) => p.id === socket.playerId) as any)?.position || 99
          : survivors.length

        setGameResult({
          winner: survivors[0]?.name || 'Unknown',
          position: myPosition
        })
      }
    }
  }, [socket.gameStatus, localPlayer])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Synchronize player state
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Update local player
    const me = socket.players.find(p => p.id === socket.playerId)
    if (me) {
      const playerData = {
        id: me.id,
        name: (me as any).name || 'Player',
        snake: me.snake || [],
        score: me.score || 0,
        color: me.color || '#4ade80',
        eliminated: (me as any).eliminated || false,
        position: (me as any).position
      }

      if (JSON.stringify(playerData) !== JSON.stringify(localPlayer)) {
        setLocalPlayer(playerData)

        // Check if eliminated to go to spectator mode
        if (playerData.eliminated && !isSpectator) {
          setIsSpectator(true)
        }
      }
    }

    // Update other players
    const others = socket.players
      .filter(p => p.id !== socket.playerId)
      .map((p: any) => ({
        id: p.id,
        name: p.name || 'Player',
        snake: p.snake || [],
        score: p.score || 0,
        color: p.color || '#f43f5e',
        eliminated: p.eliminated || false,
        position: p.position
      }))

    if (JSON.stringify(others) !== JSON.stringify(otherPlayers)) {
      setOtherPlayers(others)
    }
  }, [socket.players, socket.playerId])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !socket.gameState) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Calculate arena offset (center the arena)
    const arenaPixelSize = (arenaSize / GRID_SIZE) * CANVAS_SIZE
    const offsetX = (CANVAS_SIZE - arenaPixelSize) / 2
    const offsetY = (CANVAS_SIZE - arenaPixelSize) / 2

    // Draw shrinking arena boundary
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 4
    ctx.strokeRect(offsetX, offsetY, arenaPixelSize, arenaPixelSize)

    // Draw danger zone (outside arena)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Clear the arena area
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(offsetX, offsetY, arenaPixelSize, arenaPixelSize)

    // Draw grid (scaled to current arena size)
    ctx.strokeStyle = '#2a2a4e'
    ctx.lineWidth = 1
    const cellSize = arenaPixelSize / GRID_SIZE

    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(offsetX + i * cellSize, offsetY)
      ctx.lineTo(offsetX + i * cellSize, offsetY + arenaPixelSize)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(offsetX, offsetY + i * cellSize)
      ctx.lineTo(offsetX + arenaPixelSize, offsetY + i * cellSize)
      ctx.stroke()
    }

    // Draw all players
    const allPlayers = [localPlayer, ...otherPlayers].filter((p): p is Player => p !== null)
    allPlayers.forEach((player, playerIndex) => {
      if (player.eliminated) return

      const colors = ['#4ade80', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
      const color = player.color || colors[playerIndex % colors.length]

      // Draw snake
      player.snake.forEach((segment, index) => {
        const segmentX = (segment.x / GRID_SIZE) * arenaPixelSize + offsetX
        const segmentY = (segment.y / GRID_SIZE) * arenaPixelSize + offsetY

        const gradient = ctx.createRadialGradient(segmentX, segmentY, 0, segmentX, segmentY, cellSize / 2 - 4)

        if (index === 0) {
          gradient.addColorStop(0, color)
          gradient.addColorStop(1, shadeColor(color, -20))
        } else {
          gradient.addColorStop(0, shadeColor(color, 20))
          gradient.addColorStop(1, color)
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(
          segmentX + 4,
          segmentY + 4,
          cellSize - 8,
          cellSize - 8,
          4
        )
        ctx.fill()

        // Draw eyes on head
        if (index === 0) {
          ctx.fillStyle = '#fff'
          const eyeSize = 3
          const eyeOffset = cellSize / 4

          ctx.beginPath()
          ctx.arc(segmentX + eyeOffset, segmentY + eyeOffset, eyeSize, 0, Math.PI * 2)
          ctx.arc(segmentX + cellSize - eyeOffset, segmentY + eyeOffset, eyeSize, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw player name tag
      if (player.snake.length > 0) {
        const head = player.snake[0]
        const headX = (head.x / GRID_SIZE) * arenaPixelSize + offsetX + cellSize / 2
        const headY = (head.y / GRID_SIZE) * arenaPixelSize + offsetY + cellSize / 2

        ctx.font = 'bold 12px sans-serif'
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.fillText(player.name, headX + cellSize / 2, headY - 8)
      }
    })

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const x = (powerUp.x / GRID_SIZE) * arenaPixelSize + offsetX + cellSize / 2
      const y = (powerUp.y / GRID_SIZE) * arenaPixelSize + offsetY + cellSize / 2
      const radius = cellSize / 3

      let color, icon
      switch (powerUp.type) {
        case 'speed':
          color = '#f59e0b'
          icon = '⚡'
          break
        case 'shield':
          color = '#3b82f6'
          icon = '🛡️'
          break
        case 'slow':
          color = '#8b5cf6'
          icon = '❄️'
          break
        case 'points':
          color = '#ec4899'
          icon = '💎'
          break
        default:
          color = '#ffffff'
          icon = '✨'
      }

      // Glow effect
      ctx.shadowColor = color
      ctx.shadowBlur = 15

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = '16px sans-serif'
      ctx.fillText(icon, x - 8, y + 5)

      ctx.shadowBlur = 0
    })

    // Draw food
    if (socket.gameState.food) {
      const foodX = (socket.gameState.food.x / GRID_SIZE) * arenaPixelSize + offsetX + cellSize / 2
      const foodY = (socket.gameState.food.y / GRID_SIZE) * arenaPixelSize + offsetY + cellSize / 2

      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 15

      const foodGradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, cellSize / 3 - 4)
      foodGradient.addColorStop(0, '#f87171')
      foodGradient.addColorStop(1, '#dc2626')

      ctx.fillStyle = foodGradient
      ctx.beginPath()
      ctx.arc(foodX, foodY, cellSize / 3 - 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
    }
  }, [socket.gameState, arenaSize, powerUps, localPlayer, otherPlayers])

  // Arena shrinking effect
  useEffect(() => {
    if (!isPlaying || isSpectator) return

    const shrinkInterval = setInterval(() => {
      setShrinkTimer(prev => {
        if (prev <= 0 && arenaSize > 10) {
          // Shrink arena
          const newSize = Math.max(10, arenaSize - 2)
          setArenaSize(newSize)

          // Broadcast shrink to other players
          if (localPlayer) {
            socket.sendMove(localPlayer.snake || [], localPlayer.score || 0)
          }

          return 60 // Reset timer
        } else if (prev > 0) {
          return prev - 1
        }
        return prev
      })
    }, 1000)

    // Power-up spawning
    const powerUpInterval = setInterval(() => {
      if (arenaSize > 10) {
        spawnPowerUp()
      }
    }, 15000) // New power-up every 15 seconds

    return () => {
      clearInterval(shrinkInterval)
      clearInterval(powerUpInterval)
    }
  }, [isPlaying, isSpectator, arenaSize, localPlayer])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isSpectator || !localPlayer) return

      const snake = [...localPlayer.snake]
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

        // Check if outside arena (elimination)
        if (
          newHead.x < 0 ||
          newHead.x >= arenaSize ||
          newHead.y < 0 ||
          newHead.y >= arenaSize
        ) {
          socket.gameOver(localPlayer.score, socket.playerId ? [socket.playerId] : [])
          return
        }

        // Self collision
        if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
          socket.gameOver(localPlayer.score, socket.playerId ? [socket.playerId] : [])
          return
        }

        // Power-up collision
        const collectedPowerUp = powerUps.find(p => p.x === newHead.x && p.y === newHead.y)
        if (collectedPowerUp) {
          applyPowerUp(collectedPowerUp)
          setPowerUps(prev => prev.filter(p => p.id !== collectedPowerUp.id))
        }

        const newSnake = [newHead, ...snake]

        // Check food collision
        if (socket.gameState?.food && newHead.x === socket.gameState.food.x && newHead.y === socket.gameState.food.y) {
          socket.eatFood(10)
          socket.sendMove(newSnake, localPlayer.score + 10)
        } else {
          newSnake.pop()
          socket.sendMove(newSnake, localPlayer.score)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isSpectator, localPlayer, powerUps, socket.gameState, arenaSize])

  const handleJoin = () => {
    if (!playerName.trim()) {
      alert('Please enter your name')
      return
    }
    socket.joinGame(playerName, 'battle-royale')
    setIsJoined(true)
    setIsInRoom(true)
  }

  const handleLeave = () => {
    socket.leaveRoom()
    setIsJoined(false)
    setIsPlaying(false)
    setIsWaiting(false)
    setIsSpectator(false)
    setGameResult(null)
    setLocalPlayer(null)
    setOtherPlayers([])
    setPowerUps([])
    setActivePowerUp(null)
    setArenaSize(GRID_SIZE)
    setShrinkTimer(60)
    onExit?.()
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    socket.sendChatMessage(chatInput)
    setChatInput('')
  }

  const allPlayers = [localPlayer, ...otherPlayers].filter((p): p is Player => p !== null)
  const survivorCount = allPlayers.filter(p => !p.eliminated).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex flex-col p-6">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Skull className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent dark:from-red-400 dark:to-orange-400">Battle Royale</h1>
              <p className="text-muted-foreground dark:text-slate-200 text-sm">Last snake standing wins!</p>
            </div>
          </div>
          {isInRoom ? (
            <Button variant="outline" onClick={handleLeave}>
              <X className="w-4 h-4 mr-2" />
              Leave Arena
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
              <Card className="bg-muted/50 dark:bg-slate-700/40 backdrop-blur-xl border-border dark:border-slate-500/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
                    <Skull className="w-12 h-12 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-white mb-2">Battle Royale</CardTitle>
                  <CardDescription className="text-lg text-slate-400">
                    Survive the shrinking arena and be the last snake standing!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                      className="bg-muted/50 dark:bg-muted/50 dark:bg-slate-600/30border-border dark:border-slate-700 text-white text-lg py-3"
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
                      className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white py-6 text-xl"
                      onClick={handleJoin}
                    >
                      <Play className="w-6 h-6 mr-3" />
                      Join Battle
                    </Button>
                  ) : (
                    <div className="text-center py-8">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
                        <span className="text-lg text-slate-300">Waiting for players...</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center space-y-3">
                    <h3 className="text-lg font-semibold text-white">How to Play</h3>
                    <div className="text-sm text-slate-400 space-y-2 text-left inline-block">
                      <p>🎮 Use Arrow Keys or WASD to move</p>
                      <p>⚔️ Avoid walls, yourself, and other snakes</p>
                      <p>🔴 Stay inside the red arena boundary</p>
                      <p>⚡ Collect power-ups for advantages</p>
                      <p>💎 Last snake standing wins!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isInRoom && isWaiting && (
              /* Waiting / Countdown Screen */
              <Card className="bg-muted/50 dark:bg-slate-700/40 backdrop-blur-xl border-border dark:border-slate-500/50">
                <CardContent className="py-16 text-center">
                  {countdown !== null ? (
                    <div>
                      <div className="text-8xl font-bold text-white mb-4">
                        {countdown}
                      </div>
                      <p className="text-xl text-slate-400">Battle Starting!</p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-8">
                        <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Waiting for Battle...
                      </h2>
                      <p className="text-muted-foreground dark:text-slate-200 text-lg">
                        {socket.players.length} / 8 players joined
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-green-400">Connected to arena</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isInRoom && (isPlaying || isSpectator) && (
              /* Game Screen */
              <Card className="bg-muted/50 dark:bg-slate-700/40 backdrop-blur-xl border-border dark:border-slate-500/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground dark:text-white">
                      {isSpectator ? 'Spectating' : 'Battle Royale Arena'}
                    </CardTitle>
                    <div className="flex gap-2">
                      {isSpectator && (
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                          <Eye className="w-3 h-3 mr-1" />
                          Spectator
                        </Badge>
                      )}
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        In Progress
                      </Badge>
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                        {survivorCount} Alive
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Game Info Bar */}
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4" />
                      <span>Arena shrinks in: {shrinkTimer}s</span>
                    </div>
                    {activePowerUp && (
                      <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 font-medium">
                          {activePowerUp.type} ({activePowerUp.remaining}s)
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-300">
                      <Target className="w-4 h-4" />
                      <span>Arena Size: {Math.round((arenaSize / GRID_SIZE) * 100)}%</span>
                    </div>
                  </div>

                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                      className="rounded-lg border-2 border-slate-700/50 w-full"
                    />
                  </div>

                  {/* Player List */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {allPlayers.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          player.eliminated
                            ? 'bg-muted/50 dark:bg-slate-600/30opacity-50'
                            : player.id === socket.playerId
                            ? 'bg-purple-500/20 border border-purple-500/30'
                            : 'bg-muted/50 dark:bg-slate-600/30border border-slate-700/50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            player.eliminated ? 'grayscale' : ''
                          }`}
                          style={{ backgroundColor: player.color }}
                        >
                          {player.eliminated ? (
                            <Skull className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-white font-bold text-xs">
                              {player.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{player.name}</p>
                          <p className="text-xs text-slate-400">Score: {player.score}</p>
                        </div>
                        {player.eliminated && (
                          <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs">
                            #{player.position || '?'}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Spectator Info */}
                  {isSpectator && (
                    <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Eye className="w-5 h-5 text-orange-400" />
                        <h3 className="text-lg font-bold text-orange-300">You are Spectating</h3>
                      </div>
                      <p className="text-muted-foreground dark:text-slate-200 text-sm">
                        Watch the battle unfold! You will be able to join the next match.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isInRoom && gameResult && (
              /* Game Result Screen */
              <Card className="bg-muted/50 dark:bg-slate-700/40 backdrop-blur-xl border-border dark:border-slate-500/50">
                <CardContent className="py-16 text-center">
                  <div className="mb-6">
                    {gameResult.position === 1 ? (
                      <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                    ) : gameResult.position <= 3 ? (
                      <Skull className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                    ) : (
                      <Skull className="w-20 h-20 text-red-400 mx-auto mb-4" />
                    )}
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    {gameResult.position === 1 ? (
                      <span className="text-green-400">🏆 Victory Royale!</span>
                    ) : (
                      <span className="text-red-400">Eliminated</span>
                    )}
                  </h2>
                  <p className="text-2xl text-slate-300 mb-4">
                    {gameResult.position === 1
                      ? 'You won the Battle Royale!'
                      : `You finished in position #${gameResult.position}`}
                  </p>
                  <p className="text-lg text-slate-400 mb-8">
                    Winner: <span className="font-bold text-yellow-400">{gameResult.winner}</span>
                  </p>

                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
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
                      Leave Arena
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Panel - Info */}
          <div className="space-y-6">
            {/* Game Info Card */}
            <Card className="bg-muted/50 dark:bg-slate-700/40 backdrop-blur-xl border-border dark:border-slate-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-400" />
                  Battle Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Room</span>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    {socket.roomId || 'Not Connected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <Badge className={socket.isConnected ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}>
                    {socket.isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Players</span>
                  <span className="text-white font-semibold">{socket.players.length} / 8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mode</span>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    Battle Royale
                  </Badge>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-700/50">
                  <h4 className="text-white font-semibold">Power-ups</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <p className="text-white font-medium">Speed Boost</p>
                        <p className="text-muted-foreground dark:text-slate-200 text-xs">Move faster for 10s</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <p className="text-white font-medium">Shield</p>
                        <p className="text-muted-foreground dark:text-slate-200 text-xs">Temporary immunity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">❄️</span>
                      <div>
                        <p className="text-white font-medium">Slow</p>
                        <p className="text-muted-foreground dark:text-slate-200 text-xs">Slow others</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💎</span>
                      <div>
                        <p className="text-white font-medium">Bonus Points</p>
                        <p className="text-muted-foreground dark:text-slate-200 text-xs">+50 instant points</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Arena Status */}
            <Card className="bg-muted/50 dark:bg-slate-700/40 backdrop-blur-xl border-border dark:border-slate-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Arena Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Current Size</span>
                    <span className="text-white font-semibold">{Math.round((arenaSize / GRID_SIZE) * 100)}%</span>
                  </div>
                  <Progress value={(arenaSize / GRID_SIZE) * 100} className="h-3" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Shrink Timer</span>
                    <span className="text-white font-semibold">{shrinkTimer}s</span>
                  </div>
                  <Progress value={(60 - shrinkTimer) / 60 * 100} className="h-3" />
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-700/50">
                  <Skull className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-slate-400">
                    Arena shrinks every 60 seconds
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
