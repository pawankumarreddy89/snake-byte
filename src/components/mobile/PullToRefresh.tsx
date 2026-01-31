'use client'

import { useState, useEffect, ReactNode } from 'react'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>
  isRefreshing?: boolean
  children: ReactNode
  className?: string
  pullThreshold?: number
  releaseThreshold?: number
}

export function PullToRefresh({
  onRefresh,
  isRefreshing = false,
  children,
  className,
  pullThreshold = 80,
  releaseThreshold = 40,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [canRelease, setCanRelease] = useState(false)
  const [touchStart, setTouchStart] = useState<{ y: number } | null>(null)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setTouchStart({ y: e.touches[0].clientY })
        setPullDistance(0)
        setIsPulling(true)
        setCanRelease(false)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || !touchStart || isRefreshing) return

      const currentY = e.touches[0].clientY
      const distance = currentY - touchStart.y

      // Only allow pulling down
      if (distance > 0) {
        // Add resistance - harder to pull further
        const resistance = distance > pullThreshold ? 0.3 : 1
        setPullDistance(Math.min(distance * resistance, 120))

        // Check if user pulled enough
        if (distance > pullThreshold) {
          setCanRelease(true)
        }
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      if (canRelease && pullDistance > releaseThreshold && !isRefreshing) {
        // Trigger refresh
        setPullDistance(60) // Snap to release position
        await onRefresh()
      }

      // Reset
      setIsPulling(false)
      setCanRelease(false)
      setTouchStart(null)
      setTimeout(() => setPullDistance(0), 150)
    }

    const container = document.querySelector('[data-pull-to-refresh]')
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true })
    container.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true })
    container.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true })
    container.addEventListener('touchcancel', handleTouchEnd as EventListener, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener)
      container.removeEventListener('touchmove', handleTouchMove as EventListener)
      container.removeEventListener('touchend', handleTouchEnd as EventListener)
      container.removeEventListener('touchcancel', handleTouchEnd as EventListener)
    }
  }, [isPulling, touchStart, canRelease, pullDistance, onRefresh, isRefreshing, pullThreshold, releaseThreshold])

  const progress = Math.min(pullDistance / pullThreshold, 1)

  return (
    <div className={cn('relative', className)} data-pull-to-refresh>
      {/* Refresh Indicator */}
      <div
        className="absolute inset-x-0 flex justify-center pointer-events-none z-10",
        style={{
          transform: `translateY(${Math.max(pullDistance - 60, 0)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div
          className="bg-background border border-border rounded-full shadow-lg flex flex-col items-center justify-center",
          style={{
            width: Math.max(40, Math.min(pullDistance * 0.5, 60)),
            height: Math.max(40, Math.min(pullDistance * 0.5, 60)),
            opacity: Math.min(progress, 1),
          }}
        >
          {isRefreshing ? (
            <RefreshCw className="animate-spin text-primary" size={20} />
          ) : canRelease ? (
            <ArrowDown className="text-primary" size={20} />
          ) : (
            <ArrowDown className="text-muted-foreground" size={16} />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'transition-transform duration-300 ease-out',
          isPulling && 'translate-y-0'
        )}
        style={{
          transform: `translateY(${Math.max(pullDistance - 60, 0)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
