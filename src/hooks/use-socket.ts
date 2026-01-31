'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionDelay?: number
}

interface GameState {
  food?: { x: number; y: number }
  snake?: any[]
  obstacles?: { x: number; y: number }[]
  players: Array<{
    id: string
    name: string
    score: number
    snake: any[]
    color: string
  }>
}

export function useSocket(options: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [isInRoom, setIsInRoom] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [chatMessages, setChatMessages] = useState<any[]>([])

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const socket = io('/', {
      path: '/',
      query: {
        XTransformPort: '3003'
      },
      autoConnect: options.autoConnect ?? true,
      reconnection: options.reconnection ?? true,
      reconnectionDelay: options.reconnectionDelay ?? 1000
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to game server')
      setIsConnected(true)
      setPlayerId(socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from game server')
      setIsConnected(false)
      setIsInRoom(false)
    })

    socket.on('joined-room', (data) => {
      console.log('Joined room:', data)
      setRoomId(data.roomId)
      setPlayers(data.players)
      setGameState(data.gameState)
      setIsInRoom(true)
      setGameStatus('waiting')
    })

    socket.on('player-joined', (data) => {
      console.log('Player joined:', data.player)
      setPlayers(data.players)
    })

    socket.on('player-left', (data) => {
      console.log('Player left:', data.playerId)
      setPlayers((prev) => prev.filter(p => p.id !== data.playerId))
    })

    socket.on('match-found', (data) => {
      console.log('Match found:', data)
      // Show countdown UI
    })

    socket.on('game-started', (data) => {
      console.log('Game started:', data)
      setGameStatus('playing')
    })

    socket.on('game-tick', (data) => {
      setGameState(data)
    })

    socket.on('player-moved', (data) => {
      setPlayers((prev) =>
        prev.map(p =>
          p.id === data.playerId
            ? { ...p, snake: data.snake, score: data.score }
            : p
        )
      )
    })

    socket.on('food-spawned', (data) => {
      setGameState((prev) => prev ? { ...prev, food: data.food } : null)
      setPlayers((prev) =>
        prev.map(p =>
          p.id === data.playerId
            ? { ...p, score: data.score }
            : p
        )
      )
    })

    socket.on('player-eliminated', (data) => {
      console.log('Player eliminated:', data)
      setPlayers((prev) =>
        prev.map(p =>
          p.id === data.playerId
            ? { ...p, score: data.finalScore }
            : p
        )
      )
    })

    socket.on('game-ended', (data) => {
      console.log('Game ended:', data)
      setGameStatus('finished')
    })

    socket.on('chat-message', (data) => {
      setChatMessages((prev) => [...prev, data])
    })

    socket.on('player-disconnected', (data) => {
      console.log('Player disconnected:', data)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const joinGame = (playerName: string, mode: 'pvp' | 'battle-royale' | 'cooperative' = 'pvp') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('player-join', { playerName, mode })
    }
  }

  const setReady = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('player-ready')
    }
  }

  const sendMove = (snake: any[], score: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('game-move', { snake, score })
    }
  }

  const eatFood = (points: number = 10) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('food-eaten', { points })
    }
  }

  const gameOver = (score: number, eliminatedPlayers?: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('game-over', { score, eliminatedPlayers })
    }
  }

  const sendChatMessage = (message: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('chat-message', { message })
    }
  }

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room')
      setIsInRoom(false)
      setRoomId(null)
      setPlayers([])
      setGameState(null)
      setGameStatus('waiting')
    }
  }

  return {
    isConnected,
    isInRoom,
    roomId,
    playerId,
    players,
    gameState,
    gameStatus,
    chatMessages,
    joinGame,
    setReady,
    sendMove,
    eatFood,
    gameOver,
    sendChatMessage,
    leaveRoom
  }
}
