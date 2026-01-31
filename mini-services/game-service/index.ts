import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

const PORT = 3003
const httpServer = createServer()

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Game rooms management
interface GameRoom {
  id: string
  players: Map<string, Player>
  gameState: GameState
  mode: 'pvp' | 'battle-royale' | 'cooperative'
  status: 'waiting' | 'playing' | 'finished'
  createdAt: Date
}

interface Player {
  id: string
  name: string
  score: number
  isReady: boolean
  snake?: any[]
  color?: string
}

interface GameState {
  food: { x: number; y: number }
  obstacles: { x: number; y: number }[]
  gridWidth: number
  gridHeight: number
  speed: number
  gameLoop?: NodeJS.Timeout
}

const rooms = new Map<string, GameRoom>()
const playerRoomMap = new Map<string, string>()
const matchQueue: Player[] = []

// Helper functions
function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getRandomPosition(gridWidth: number, gridHeight: number) {
  return {
    x: Math.floor(Math.random() * gridWidth),
    y: Math.floor(Math.random() * gridHeight)
  }
}

function createGameState(mode: 'pvp' | 'battle-royale' | 'cooperative'): GameState {
  const gridWidth = 20
  const gridHeight = 20

  return {
    food: getRandomPosition(gridWidth, gridHeight),
    obstacles: [],
    gridWidth,
    gridHeight,
    speed: 150
  }
}

function startGameLoop(roomId: string) {
  const room = rooms.get(roomId)
  if (!room) return

  if (room.gameState.gameLoop) {
    clearInterval(room.gameState.gameLoop)
  }

  room.status = 'playing'

  room.gameState.gameLoop = setInterval(() => {
    io.to(roomId).emit('game-tick', {
      food: room.gameState.food,
      obstacles: room.gameState.obstacles,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        snake: p.snake || [],
        color: p.color
      }))
    })
  }, room.gameState.speed)

  io.to(roomId).emit('game-started', { roomId })
}

function stopGameLoop(roomId: string) {
  const room = rooms.get(roomId)
  if (room && room.gameState.gameLoop) {
    clearInterval(room.gameState.gameLoop)
    room.gameState.gameLoop = undefined
  }
}

function findMatchForPlayer(player: Player): GameRoom | null {
  // Look for a waiting room with same mode
  for (const [roomId, room] of rooms.entries()) {
    if (room.status === 'waiting' && room.players.size < 2) {
      return room
    }
  }
  return null
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('player-join', (data) => {
    const { playerName, mode } = data
    const player: Player = {
      id: socket.id,
      name: playerName || `Player_${socket.id.substr(0, 4)}`,
      score: 0,
      isReady: false,
      snake: [{ x: 10, y: 10 }],
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }

    // Try to find an existing room or create new one
    let room = findMatchForPlayer(player)

    if (room) {
      room.players.set(socket.id, player)
      playerRoomMap.set(socket.id, room.id)
      socket.join(room.id)
    } else {
      const roomId = generateRoomId()
      room = {
        id: roomId,
        players: new Map([[socket.id, player]]),
        gameState: createGameState(mode || 'pvp'),
        mode: mode || 'pvp',
        status: 'waiting',
        createdAt: new Date()
      }
      rooms.set(roomId, room)
      playerRoomMap.set(socket.id, roomId)
      socket.join(roomId)
    }

    socket.emit('joined-room', {
      roomId: room.id,
      playerId: socket.id,
      players: Array.from(room.players.values()),
      gameState: room.gameState
    })

    // Notify other players in the room
    socket.to(room.id).emit('player-joined', {
      player,
      players: Array.from(room.players.values())
    })

    // If room is full (2 players), start countdown
    if (room.players.size === 2) {
      io.to(room.id).emit('match-found', {
        roomId: room.id,
        players: Array.from(room.players.values()),
        countdown: 5
      })

      // Start game after countdown
      setTimeout(() => {
        startGameLoop(room.id)
      }, 5000)
    }
  })

  socket.on('player-ready', () => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.get(socket.id)
    if (player) {
      player.isReady = true
      io.to(roomId).emit('player-ready', { playerId: socket.id })
    }
  })

  socket.on('game-move', (data) => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room || room.status !== 'playing') return

    const player = room.players.get(socket.id)
    if (player) {
      // Update snake position
      if (data.snake) {
        player.snake = data.snake
      }

      // Update score
      if (data.score !== undefined) {
        player.score = data.score
      }

      // Broadcast to other players
      socket.to(roomId).emit('player-moved', {
        playerId: socket.id,
        snake: player.snake,
        score: player.score
      })
    }
  })

  socket.on('food-eaten', (data) => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room || room.status !== 'playing') return

    const player = room.players.get(socket.id)
    if (player) {
      player.score += data.points || 10
      room.gameState.food = getRandomPosition(
        room.gameState.gridWidth,
        room.gameState.gridHeight
      )

      io.to(roomId).emit('food-spawned', {
        food: room.gameState.food,
        playerId: socket.id,
        score: player.score
      })
    }
  })

  socket.on('game-over', (data) => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.get(socket.id)
    if (player) {
      player.isReady = false
      io.to(roomId).emit('player-eliminated', {
        playerId: socket.id,
        playerName: player.name,
        finalScore: data.score || player.score
      })

      // Check if game should end
      const remainingPlayers = Array.from(room.players.values()).filter(p => !data.eliminatedPlayers?.includes(p.id))
      if (remainingPlayers.length <= 1) {
        stopGameLoop(roomId)
        room.status = 'finished'

        const winner = remainingPlayers[0]
        io.to(roomId).emit('game-ended', {
          winner: winner ? { id: winner.id, name: winner.name, score: winner.score } : null,
          allPlayers: Array.from(room.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score
          }))
        })

        // Clean up room after 10 seconds
        setTimeout(() => {
          rooms.delete(roomId)
        }, 10000)
      }
    }
  })

  socket.on('chat-message', (data) => {
    const roomId = playerRoomMap.get(socket.id)
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.get(socket.id)
    if (player) {
      io.to(roomId).emit('chat-message', {
        playerId: socket.id,
        playerName: player.name,
        message: data.message,
        timestamp: new Date()
      })
    }
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)

    const roomId = playerRoomMap.get(socket.id)
    if (roomId) {
      const room = rooms.get(roomId)
      if (room) {
        const player = room.players.get(socket.id)
        room.players.delete(socket.id)

        if (room.status === 'playing') {
          // Handle player disconnect during game
          stopGameLoop(roomId)
          room.status = 'finished'

          io.to(roomId).emit('player-disconnected', {
            playerId: socket.id,
            playerName: player?.name
          })

          io.to(roomId).emit('game-ended', {
            winner: null,
            reason: 'Player disconnected',
            allPlayers: Array.from(room.players.values()).map(p => ({
              id: p.id,
              name: p.name,
              score: p.score
            }))
          })
        } else if (room.players.size === 0) {
          // Remove empty room
          rooms.delete(roomId)
        } else {
          // Notify remaining players
          socket.to(roomId).emit('player-left', {
            playerId: socket.id,
            playerName: player?.name,
            remainingPlayers: room.players.size
          })
        }
      }
      playerRoomMap.delete(socket.id)
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`🎮 Snake Game WebSocket Server running on port ${PORT}`)
  console.log(`📡 Socket.IO endpoint: /?XTransformPort=${PORT}`)
})
