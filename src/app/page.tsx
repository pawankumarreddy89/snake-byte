'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Gamepad2, Settings, Users, Star, ChevronRight, Bell } from 'lucide-react'
import { Game } from './snake-game'
import { useTouchGesture } from '@/hooks/mobile'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
}

const selectionPulseVariants = {
  selected: {
    boxShadow: [
      '0 0 0px 8px rgba(76, 175, 80, 0.2)',
      '0 0 0px 16px rgba(76, 175, 80, 0.1)',
    ],
  },
}

const startButtonVariants = {
  idle: { scale: 1 },
  pressed: { scale: 0.95 },
  idle2: { scale: 1.05 },
}

export type Level = {
  id: string
  name: string
  icon: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  bestScore: number
  avgTime: number
  color: string
  unlocked: boolean
  mode: 'classic' | 'box-arena' | 'corridor'
}

const levels: Level[] = [
  {
    id: 'open-world',
    name: 'Open World',
    icon: '🌍',
    description: 'No boundaries - explore infinite space',
    difficulty: 'easy',
    bestScore: 1850,
    avgTime: 45,
    color: '#4CAF50',
    unlocked: true,
    mode: 'classic',
  },
  {
    id: 'box-arena',
    name: 'Box Arena',
    icon: '⬛',
    description: 'Classic boundaries - test your skills',
    difficulty: 'easy',
    bestScore: 1230,
    avgTime: 38,
    color: '#FF9800',
    unlocked: true,
    mode: 'box-arena',
  },
  {
    id: 'corridor',
    name: 'Corridor',
    icon: '📏',
    description: 'Narrow passages - master precision',
    difficulty: 'medium',
    bestScore: 890,
    avgTime: 52,
    color: '#FF9800',
    unlocked: true,
    mode: 'corridor',
  },
]

export default function SnakeGamePage() {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(levels[0])
  const [isAnimating, setIsAnimating] = useState(false)
  const [startButtonPulse, setStartButtonPulse] = useState(false)
  const gameContainerRef = useRef<HTMLDivElement>(null)

  const { canSwipe: canSwipeRef } = useTouchGesture({
    swipeThreshold: 50,
    longPressDelay: 500,
  })

  const handleLevelSelect = (level: Level) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }

    setIsAnimating(true)
    setTimeout(() => {
      setSelectedLevel(level)
      setIsAnimating(false)
    }, 150)

    // Update start button text
    setTimeout(() => {
      setStartButtonPulse(true)
    }, 500)
    setTimeout(() => {
      setStartButtonPulse(false)
    }, 1000)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 border-green-500 text-green-50'
      case 'medium':
        return 'bg-orange-500/10 border-orange-500 text-orange-50'
      case 'hard':
        return 'bg-red-500/10 border-red-500 text-red-50'
      default:
        return 'bg-gray-500/10 border-gray-500 text-gray-50'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '🟢'
      case 'medium':
        return '🟠'
      case 'hard':
        return '🔴'
      default:
        return '⚪'
    }
  }

  useEffect(() => {
    // Keyboard navigation
    const handleKeyNavigation = (e: KeyboardEvent) => {
      const currentIndex = levels.findIndex(l => l.id === selectedLevel?.id)
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % levels.length
        handleLevelSelect(levels[nextIndex])
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const prevIndex = (currentIndex - 1 + levels.length) % levels.length
        handleLevelSelect(levels[prevIndex])
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setStartButtonPulse(true)
        setTimeout(() => {
          // Start game logic here
          setStartButtonPulse(false)
        }, 300)
      }
    }

    document.addEventListener('keydown', handleKeyNavigation)

    return () => {
      document.removeEventListener('keydown', handleKeyNavigation)
    }
  }, [selectedLevel])

  return (
    <div className="min-h-screen bg-[#0A0D1B] overflow-hidden relative" style={{ WebkitTapHighlightColor: 'transparent' }}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="w-[200%] h-[200%]"
          animate={{
            rotate: [0, 360],
            transition: { duration: 60, repeat: Infinity, ease: 'linear' },
          }}
          style={{
            opacity: 0.03,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(76, 175, 80, 0.1) 50px, transparent)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Header Section */}
      <header className="relative z-20 pt-4 pb-3">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360], transition: { duration: 3, repeat: Infinity, ease: 'linear' } }}
              >
                <div className="text-5xl animate-pulse2">🐍</div>
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-md"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                Snake Ultimate
              </h1>
              <p className="text-white/80 text-sm font-medium">
                {selectedLevel?.difficulty === 'hard' ? '🔴' : '🟢'} {selectedLevel?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Settings className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Trophy className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Score Badge */}
        <div className="absolute right-4 top-4">
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full shadow-lg">
            <Trophy className="w-5 h-5 text-yellow-200" />
            <span className="text-white font-bold text-sm">
              {selectedLevel?.bestScore.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* Level Selection */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-md mx-auto px-4 pt-6">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant={selectedLevel?.difficulty === 'easy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const easyLevel = levels.find(l => l.difficulty === 'easy')
                if (easyLevel) handleLevelSelect(easyLevel)
              }}
              className={getDifficultyColor('easy')}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-lg">{getDifficultyIcon('easy')}</span>
                Easy
              </span>
            </Button>
            <Button
              variant={selectedLevel?.difficulty === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const mediumLevel = levels.find(l => l.difficulty === 'medium')
                if (mediumLevel) handleLevelSelect(mediumLevel)
              }}
              className={getDifficultyColor('medium')}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-lg">{getDifficultyIcon('medium')}</span>
                Medium
              </span>
            </Button>
            <Button
              variant={selectedLevel?.difficulty === 'hard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const hardLevel = levels.find(l => l.difficulty === 'hard')
                if (hardLevel) handleLevelSelect(hardLevel)
              }}
              className={getDifficultyColor('hard')}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-lg">{getDifficultyIcon('hard')}</span>
                Hard
              </span>
            </Button>
          </div>

          {/* Level Cards */}
          <div className="space-y-4">
            {levels.map((level) => {
              const isSelected = selectedLevel?.id === level.id
              const isUnlocked = level.unlocked

              return (
                <motion.div
                  key={level.id}
                  variants={cardVariants}
                  initial="visible"
                  animate={isSelected ? 'selected' : 'visible'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 300 }}
                  onClick={() => isUnlocked && handleLevelSelect(level)}
                  className={cn(
                    'relative overflow-hidden',
                    isSelected ? 'cursor-pointer' : 'cursor-pointer',
                  !isUnlocked && 'opacity-60 cursor-not-allowed'
                  )}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '180px',
                  }}
                >
                  {/* Selection Indicator - Full Border */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        variants={selectionPulseVariants}
                        initial="selected"
                        transition={{ duration: 1000, repeat: Infinity }}
                      >
                        <div className="absolute inset-0 bg-green-500/20 rounded-2xl"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card Header */}
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'text-6xl',
                        'animate-bounce',
                        isUnlocked ? 'grayscale' : ''
                      )}>
                        {level.icon}
                      </div>
                      <div>
                        <h3 className="text-white text-xl font-bold mb-1">
                          {level.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs font-semibold px-3 py-1 border-2',
                            getDifficultyColor(level.difficulty)
                          )}
                        >
                          {level.difficulty.toUpperCase()}
                        </Badge>
                        {!isUnlocked && (
                          <Badge variant="destructive" className="ml-2">
                            🔒
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                    {isUnlocked && (
                      <div className="text-yellow-300 text-sm">
                        📏 Unlocked at Level {Math.floor(Math.random() * 3) + 5)}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <p className="text-white/90 text-base leading-relaxed mb-6">
                      {level.description}
                    </p>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-white/80 text-sm">
                        <span>🏆 Best Score</span>
                        <span className="font-semibold text-white">
                          {level.bestScore.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-white/80 text-sm">
                        <span>⏱️ Average Time</span>
                        <span className="font-semibold text-white">
                          {level.avgTime}s
                        </span>
                      </div>
                    </div>

                    {/* Play Button - Only visible when selected */}
                    {isSelected && (
                      <motion.div
                        className="mt-4"
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                      >
                        <motion.button
                          variants={startButtonVariants}
                          initial="idle"
                          animate={startButtonPulse ? 'idle2' : 'idle'}
                          whileTap="pressed"
                          whileHover={{ scale: 1.05 }}
                          onClick={() => {
                            // Start game logic
                            console.log('Starting game:', level.name)
                          }}
                          className={cn(
                            'w-full h-16',
                            'bg-gradient-to-r from-green-500 to-emerald-600',
                            'text-white font-bold text-lg',
                            'rounded-2xl',
                            'shadow-2xl',
                            'border-4',
                            'border-green-400/30',
                            'flex items-center justify-center',
                            'gap-3',
                            'relative',
                            'overflow-hidden',
                          )}
                          style={{
                            background: `linear-gradient(135deg, ${level.color}, ${level.color}dd)`,
                          }}
                        >
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{
                              boxShadow: isSelected && startButtonPulse ? 'selected' : 'hidden',
                            }}
                            transition={{ duration: 500 }}
                          >
                          </motion.div>
                          <motion.span
                            className="relative z-10"
                            animate={{ scale: [1, 1], [1, 0.95] }}
                            transition={{ duration: 300, delay: 0.2 }}
                          >
                            <span className="mr-2 text-2xl">▶️</span>
                            <span className="relative">
                              PLAY {level.name.toUpperCase()}
                            </span>
                          </motion.span>
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Action Buttons */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 to-black/90 backdrop-blur-lg border-t border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:bg-white/10"
          >
            <Bell className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:bg-white/10"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="text-white/60" />
            <Badge variant="secondary" className="text-white">
              3,240
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper function
function cn(...classes: (string | undefined | boolean | null)[]) {
  return classes.filter(Boolean).join(' ')
}
