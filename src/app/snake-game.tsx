'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Position {
  x: number
  y: number
}

interface GameState {
  snake: Position[]
  food: Position
  direction: 'up' | 'down' 'left' | 'right'
  score: number
  isGameOver: boolean
  isPaused: boolean
}

interface SnakeGameProps {
  level: string
  onGameOver: (score: number) => void
  onBack: () => void
}

export function SnakeGame({ level, onGameOver, onBack }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const requestRef = useRef<number>()

  const [gameState, setGameState] = useState<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: 'right',
    score: 0,
    isGameOver: false,
    isPaused: false,
  })

  const GRID_SIZE = 20
  const CELL_SIZE = 24

  const getRandomPosition = useCallback(avoidPositions: Position[]): Position => {
    let newPosition: Position
    let attempts = 0
    const maxAttempts = 100

    do {
      newPosition = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }

      attempts++
    } while (
      avoidPositions.some(
        pos => pos.x === newPosition.x && pos.y === newPosition.y
      ) &&
      gameState.snake.some(
        segment => segment.x === newPosition.x && segment.y === newPosition.y
      ) &&
      attempts < maxAttempts
    )

    return newPosition
  }, [])

  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // Wall collision
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      return true
    }

    // Self collision
    if (body.some((segment, index) => index > 0 && segment.x === head.x && segment.y === head.y)) {
      return true
    }

    // Food collision
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
      return true
    }

    return false
  }, [])

  const gameLoop = useCallback(() => {
    if (gameState.isGameOver || gameState.isPaused) return

    const head = gameState.snake[0]
    const collision = checkCollision(head, gameState.snake)

    if (collision) {
      setGameState(prev => ({ ...prev, isGameOver: true }))
      onGameOver(gameState.score)
      return
    }

    // Move snake
    const newSnake = [...gameState.snake]
    newSnake.unshift({
      x: head.x + (gameState.direction === 'right' ? 1 : gameState.direction === 'left' ? -1 : 0),
      y: head.y + (gameState.direction === 'down' ? 1 : gameState.direction === 'up' ? -1 : 0),
    })

    // Check if ate food
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + 10,
        food: getRandomPosition(newSnake),
        snake: newSnake,
      }))
      } else {
      setGameState(prev => ({
        ...prev,
        snake: newSnake,
      }))
      }
  }, [
    gameState.snake,
    gameState.food,
    gameState.direction,
    gameState.isGameOver,
    gameState.isPaused,
  ])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0A0D1B'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(canvas.width, i * CELL_SIZE)
      ctx.stroke()
    }
  }, [GRID_SIZE, CELL_SIZE])

  useEffect(() => {
    if (!gameContainerRef.current) return

    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight - 180
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if ((key === 'arrowup' || key === 'w') && gameState.direction !== 'down') {
        e.preventDefault()
        setGameState(prev => ({ ...prev, direction: 'up' }))
      } else if ((key === 'arrowdown' || key === 's') && gameState.direction !== 'up') {
        e.preventDefault()
        setGameState(prev => ({ ...prev, direction: 'down' }))
      } else if ((key === 'arrowleft' || key === 'a') && gameState.direction !== 'right') {
        e.preventDefault()
        setGameState(prev => ({ ...prev, direction: 'left' }))
      } else if ((key === 'arrowright' || key === 'd') && gameState.direction !== 'left') {
        e.preventDefault()
        setGameState(prev => ({ ...prev, direction: 'right' }))
      } else if (key === ' ' ') {
        e.preventDefault()
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
      } else if (key === 'escape') {
        e.preventDefault()
        onBack()
      }
    }

    // Touch controls - swipe detection
    let touchStartX = 0
    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartX
      const deltaY = touch.clientY - touchStartY
      const threshold = 30

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && gameState.direction !== 'left') {
            setGameState(prev => ({ ...prev, direction: 'right' }))
          } else if (deltaX < 0 && gameState.direction !== 'right') {
            setGameState(prev => ({ ...prev, direction: 'left' }))
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0 && gameState.direction !== 'up') {
            setGameState(prev => ({ ...prev, direction: 'down' }))
          } else if (deltaY < 0 && gameState.direction !== 'down') {
            setGameState(prev => ({ ...prev, direction: 'up' }))
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchend', touchEnd)
    }
  }, [gameState.direction, onGameOver, onBack])

  // Start game loop
  useEffect(() => {
    if (!gameState.isGameOver && !gameState.isPaused) {
      const loop = () => {
        gameLoop()
        requestRef.current = requestAnimationFrame(loop)
      }

      requestRef.current = requestAnimationFrame(loop)

      return () => {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [gameState.isGameOver, gameState.isPaused])

  return (
    <div
      ref={gameContainerRef}
      className="absolute inset-0 flex flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(circle at center, #0A0D1B 0%, #1B1F3E 100%)',
      }}
    >
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onBack}
        className="absolute top-4 left-4 z-10 bg-black/30 hover:bg-black/50 rounded-full p-2"
        transition={{ duration: 200 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M19 12H5M12 19l-7-7 7-7M5 12 19" />
        </svg>
      </motion.button>

      {/* Score */}
      <div className="absolute top-4 right-4 z-10 text-white">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-sm text-white/70">Score</div>
          <div className="text-3xl font-bold text-yellow-300">
            {gameState.score}
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-2xl border-4 border-white/20"
        style={{
          WebkitTapHighlightColor: 'transparent',
        touchAction: 'none',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '12px',
          maxWidth: '95vw',
          maxHeight: '60vh',
        }}
      />

      {/* Pause Overlay */}
      {gameState.isPaused && !gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 300 }}
            >
              <div className="text-6xl font-bold text-white animate-pulse">
                ⏸️
              </div>
              <div className="text-white text-xl">
                PAUSED
              </div>
              <div className="text-white/70 text-sm">
                Tap to resume
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 300 }}
            className="text-center space-y-6"
          >
            <div className="text-8xl mb-4">💀</div>
            <div>
              <h2 className="text-white text-3xl font-bold mb-2">Game Over</h2>
              <p className="text-white/80 text-lg mb-4">
                Final Score: <span className="text-yellow-300 font-bold text-2xl mx-2">{gameState.score}</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Restart game
                setGameState({
                  snake: [{ x: 10, y: 10 }],
                  food: { x: 15, y: 15 },
                  direction: 'right',
                  score: 0,
                  isGameOver: false,
                  isPaused: false,
                })
              }}
              className="bg-white text-black hover:bg-gray-100 border-2 border-white/30 text-white px-8 py-3 rounded-lg font-semibold"
            >
              Play Again
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
