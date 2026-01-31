'use client'

import { ReactNode, useRef, useState, useEffect } from 'react'
import { ChevronLeft, MoreVertical, Trash2, Archive, Star, Share } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SwipeableAction {
  id: string
  label: string
  icon?: ReactNode
  color?: 'default' | 'destructive' | 'primary'
  onClick?: () => void
}

export interface SwipeableItemProps {
  id: string
  children: ReactNode
  leftActions?: SwipeableAction[]
  rightActions?: SwipeableAction[]
  threshold?: number
  className?: string
  disabled?: boolean
}

export function SwipeableItem({
  id,
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className,
  disabled = false,
}: SwipeableItemProps) {
  const [leftSwipeProgress, setLeftSwipeProgress] = useState(0)
  const [rightSwipeProgress, setRightSwipeProgress] = useState(0)
  const [leftActionActive, setLeftActionActive] = useState<SwipeableAction | null>(null)
  const [rightActionActive, setRightActionActive] = useState<SwipeableAction | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  const startXRef = useRef<number>(0)
  const currentXRef = useRef<number>(0)

  useEffect(() => {
    const element = document.querySelector(`[data-swipeable-item="${id}"]`)
    if (!element || disabled) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startXRef.current = e.touches[0].clientX
        currentXRef.current = e.touches[0].clientX
        setIsSwiping(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return

      const currentX = e.touches[0].clientX
      const deltaX = currentX - startXRef.current

      // Handle left swipe (reveal right actions)
      if (rightActions.length > 0 && deltaX > 0) {
        const progress = Math.min(Math.abs(deltaX) / threshold, 1)
        setRightSwipeProgress(progress)
        setLeftSwipeProgress(0)
      }
      // Handle right swipe (reveal left actions)
      else if (leftActions.length > 0 && deltaX < 0) {
        const progress = Math.min(Math.abs(deltaX) / threshold, 1)
        setLeftSwipeProgress(progress)
        setRightSwipeProgress(0)
      } else {
        // Return to center
        setLeftSwipeProgress(0)
        setRightSwipeProgress(0)
      }
    }

    const handleTouchEnd = () => {
      if (!isSwiping) return

      setIsSwiping(false)

      // Trigger left action (swiped right)
      if (leftSwipeProgress > 0.8 && leftActions.length > 0) {
        const action = leftActions[leftActions.length - 1]
        setLeftActionActive(action)
        action.onClick?.()
        setTimeout(() => setLeftActionActive(null), 2000)
      }
      // Trigger right action (swiped left)
      else if (rightSwipeProgress > 0.8 && rightActions.length > 0) {
        const action = rightActions[rightActions.length - 1]
        setRightActionActive(action)
        action.onClick?.()
        setTimeout(() => setRightActionActive(null), 2000)
      } else {
        // Reset - not swiped far enough
        setTimeout(() => {
          setLeftSwipeProgress(0)
          setRightSwipeProgress(0)
        }, 150)
      }
    }

    element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true })
    element.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true })
    element.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true })
    element.addEventListener('touchcancel', handleTouchEnd as EventListener, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener)
      element.removeEventListener('touchmove', handleTouchMove as EventListener)
      element.removeEventListener('touchend', handleTouchEnd as EventListener)
      element.removeEventListener('touchcancel', handleTouchEnd as EventListener)
    }
  }, [id, disabled, leftActions, rightActions, threshold, isSwiping, leftSwipeProgress, rightSwipeProgress])

  const getActionIcon = (action: SwipeableAction) => {
    if (action.icon) return action.icon

    switch (action.color) {
      case 'destructive':
        return <Trash2 size={18} />
      case 'primary':
        return <Star size={18} />
      default:
        return <Share size={18} />
    }
  }

  const getActionColor = (action: SwipeableAction) => {
    switch (action.color) {
      case 'destructive':
        return 'bg-destructive text-destructive-foreground'
      case 'primary':
        return 'bg-primary text-primary-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div
      data-swipeable-item={id}
      className={cn('relative overflow-hidden', className, disabled && 'opacity-60')}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Left Actions (revealed by swiping right) */}
      {leftActions.length > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-center",
          style={{
            transform: `translateX(${-leftSwipeProgress * 100}%)`,
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {leftActions.map((action, index) => (
            <button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation()
                action.onClick?.()
              }}
              className={cn(
                'h-full px-4 flex items-center gap-2',
                'transition-colors',
                getActionColor(action)
              )}
              style={{
                minHeight: '56px',
              }}
              aria-label={action.label}
            >
              {getActionIcon(action)}
              <span className="text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="relative z-10 transition-transform duration-150"
        style={{
          transform: `translateX(${(rightSwipeProgress - leftSwipeProgress) * 100}%)`,
        }}
      >
        {children}

        {/* Right Actions Indicator (visible when swiping left) */}
        {leftActions.length > 0 && leftSwipeProgress > 0.2 && (
          <div className="absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-background to-background/90">
            <ChevronLeft size={20} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Right Actions (revealed by swiping left) */}
      {rightActions.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center",
          style={{
            transform: `translateX(${rightSwipeProgress * 100}%)`,
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {rightActions.map((action, index) => (
            <button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation()
                action.onClick?.()
              }}
              className={cn(
                'h-full px-4 flex items-center gap-2',
                'transition-colors',
                getActionColor(action)
              )}
              style={{
                minHeight: '56px',
              }}
              aria-label={action.label}
            >
              {getActionIcon(action)}
              <span className="text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Left Actions Indicator (visible when swiping right) */}
      {rightActions.length > 0 && rightSwipeProgress > 0.2 && (
        <div className="absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-background to-background/90">
          <ChevronLeft size={20} className="text-muted-foreground" style={{ transform: 'rotate(180deg)' }} />
        </div>
      )}
    </div>
  )
}
