'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  Users,
  Trophy,
  MessageSquare,
  X,
  Clock,
  Target
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

interface Player {
  id: string
  name: string
  snake: Array<{ x: number; y: number }>
  score: number
  color: string
}

interface PvPGameProps {
  onExit?: () => void
}

export function PvPGame({ onExit }: PvPGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playerName, setPlayerName] = useState('')
  const [isInRoom, setIsInRoom] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [gameResult, setGameResult] = useState<{ winner: string; allPlayers: any[] } | null>(null)
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null)
  const [opponent, setOpponent] = useState<Player | null>(null)
  const [chatInput, setChatInput] = useState('')

  const socket = useSocket()

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
      if (socket.players.length >= 2) {
        const winner = socket.players.reduce((a: any, b: any) => (a.score > b.score ? a : b))
        setGameResult({
          winner: winner.name,
          allPlayers: socket.players
        })
      }
    }
  }, [socket.gameStatus])

  useEffect(() => {
    const me = socket.players.find(p => p.id === socket.playerId)
    if (me && JSON.stringify(me) !== JSON.stringify(localPlayer)) {
      setLocalPlayer(me)
    }
    const other = socket.players.find(p => p.id !== socket.playerId)
    if (other && JSON.stringify(other) !== JSON.stringify(opponent)) {
      setOpponent(other)
    }
  }, [socket.players, socket.playerId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !socket.gameState) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

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

    socket.gameState.players.forEach((player, playerIndex) => {
      player.snake.forEach((segment, index) => {
        const color = player.color || (playerIndex === 0 ? '#4ade80' : '#f43f5e')

        const gradient = ctx.createRadialGradient(
          segment.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
          segment.y * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
          0,
          segment.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
          segment.y * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2,
          (CANVAS_SIZE / GRID_SIZE) / 2
        )

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
          segment.x * (CANVAS_SIZE / GRID_SIZE) + 2,
          segment.y * (CANVAS_SIZE / GRID_SIZE) + 2,
          (CANVAS_SIZE / GRID_SIZE) - 4,
          (CANVAS_SIZE / GRID_SIZE) - 4,
          4
        )
        ctx.fill()

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
        }
      })
    })

    if (socket.gameState.food) {
      const foodX = socket.gameState.food.x * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2
      const foodY = socket.gameState.food.y * (CANVAS_SIZE / GRID_SIZE) + (CANVAS_SIZE / GRID_SIZE) / 2

      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 15

      const foodGradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, (CANVAS_SIZE / GRID_SIZE) / 2 - 4)
      foodGradient.addColorStop(0, '#f87171')
      foodGradient.addColorStop(1, '#dc2626')

      ctx.fillStyle = foodGradient
      ctx.beginPath()
      ctx.arc(foodX, foodY, (CANVAS_SIZE / GRID_SIZE) / 2 - 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
    }
  }, [socket.gameState])

  const handleJoin = () => {
    if (!playerName.trim()) {
      alert('Please enter your name')
      return
    }
    socket.joinGame(playerName, 'pvp')
    setIsJoined(true)
    setIsInRoom(true)
  }

  const handleLeave = () => {
    socket.leaveRoom()
    setIsJoined(false)
    setIsPlaying(false)
    setIsWaiting(false)
    setIsInRoom(false)
    setGameResult(null)
    setLocalPlayer(null)
    setOpponent(null)
    onExit?.()
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    socket.sendChatMessage(chatInput)
    setChatInput('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex flex-col p-6">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent dark:from-red-400 dark:to-orange-400">PvP Mode</h1>
              <p className="text-muted-foreground dark:text-slate-400 text-sm">Real-time multiplayer battle</p>
            </div>
          </div>
          {isInRoom ? (
            <Button variant="outline" onClick={handleLeave}>
              <X className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          ) : (
            <Button variant="outline" onClick={handleLeave}>
              <X className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {!isInRoom && (
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-white mb-2">PvP Lobby</CardTitle>
                  <CardDescription className="text-lg text-slate-400">
                    Enter the arena and compete against other players!
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
                      className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white py-6 text-xl"
                      onClick={handleJoin}
                    >
                      <Play className="w-6 h-6 mr-3" />
                      Find Match
                    </Button>
                  ) : (
                    <div className="text-center py-8">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
                        <span className="text-lg text-slate-300">Finding opponent...</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center space-y-3">
                    <h3 className="text-lg font-semibold text-white">How to Play</h3>
                    <div className="text-sm text-slate-400 space-y-2 text-left inline-block">
                      <p>🎮 Use Arrow Keys or WASD to move</p>
                      <p>🎯 Collect food to grow and score points</p>
                      <p>⚔️ Avoid walls, yourself, and your opponent</p>
                      <p>🏆 Last snake standing wins!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isInRoom && isWaiting && (
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardContent className="py-16 text-center">
                  {countdown !== null ? (
                    <div>
                      <div className="text-8xl font-bold text-white mb-4">{countdown}</div>
                      <p className="text-xl text-slate-400">Game Starting!</p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-8">
                        <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">Waiting for Opponent...</h2>
                      <p className="text-muted-foreground dark:text-slate-400 text-lg">You're in the queue</p>
                      <div className="mt-6 flex items-center justify-center gap-3">
                        <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-green-400">Connected to room</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isInRoom && isPlaying && (
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground dark:text-white">PvP Battle</CardTitle>
                    <div className="flex gap-2">
                      {localPlayer && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          {localPlayer.score} pts
                        </Badge>
                      )}
                      {opponent && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                          {opponent.score} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="rounded-lg border border-slate-700/50"
                  />
                </CardContent>
              </Card>
            )}

            {gameResult && (
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardContent className="py-16 text-center">
                  <div className="mb-8">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {gameResult.winner === localPlayer?.name ? 'You Won!' : 'You Lost!'}
                  </h2>
                  <p className="text-muted-foreground dark:text-slate-400 text-lg mb-6">
                    Winner: {gameResult.winner}
                  </p>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
                    onClick={handleLeave}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {isInRoom && (
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Players</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {localPlayer && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-slate-900/50rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {localPlayer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{localPlayer.name}</div>
                        <div className="text-xs text-slate-400">{localPlayer.score} pts</div>
                      </div>
                    </div>
                  )}
                  {opponent && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-slate-900/50rounded-lg">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {opponent.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{opponent.name}</div>
                        <div className="text-xs text-slate-400">{opponent.score} pts</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isInRoom && (
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-48 w-full">
                    {socket.chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No messages yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {socket.chatMessages.map((msg, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-semibold text-purple-400">{msg.player}:</span>
                            <span className="text-muted-foreground dark:text-slate-300 ml-2">{msg.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      className="bg-muted/50 dark:bg-muted/50 dark:bg-slate-900/50border-border dark:border-slate-700 text-white"
                    />
                    <Button size="icon" onClick={handleSendChat} variant="outline">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isInRoom && localPlayer && (
              <Card className="bg-muted/50 dark:bg-slate-800/50 backdrop-blur-xl border-border dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Game Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Your Score</span>
                    <span className="text-white font-semibold">{localPlayer.score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Snake Length</span>
                    <span className="text-white font-semibold">{localPlayer.snake.length}</span>
                  </div>
                  {opponent && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Opponent Score</span>
                        <span className="text-white font-semibold">{opponent.score}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Opponent Length</span>
                        <span className="text-white font-semibold">{opponent.snake.length}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
