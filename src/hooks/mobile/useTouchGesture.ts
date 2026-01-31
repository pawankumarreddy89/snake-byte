'use client'

import { useRef, useCallback, useEffect, RefObject } from 'react'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null

export interface TouchGestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onLongPress?: () => void
  onPinch?: (scale: number) => void
}

export interface TouchGestureOptions {
  swipeThreshold?: number
  longPressDelay?: number
  enablePinch?: boolean
}

export function useTouchGesture(
  options: TouchGestureOptions = {}
): {
  ref: RefObject<HTMLElement>
  canSwipe: boolean
} {
  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    enablePinch = true,
  } = options

  const elementRef = useRef<HTMLElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialDistanceRef = useRef<number>(0)
  const lastSwipeDirection = useRef<SwipeDirection>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }

      // Start long press timer
      if (longPressDelay) {
        longPressTimerRef.current = setTimeout(() => {
          // Long press detected
        }, longPressDelay)
      }
    } else if (enablePinch && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [swipeThreshold, longPressDelay, enablePinch])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Cancel long press if moving
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartRef.current && e.changedTouches.length > 0) {
      const touchEnd = e.changedTouches[0]
      const deltaX = touchEnd.clientX - touchStartRef.current.x
      const deltaY = touchEnd.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      // Handle long press
      if (longPressTimerRef.current && !touchEnd.clientX && !touchEnd.clientY) {
        clearTimeout(longPressTimerRef.current)
        // Fire long press event (handled by consuming component)
      }

      // Handle pinch
      if (enablePinch && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (initialDistanceRef.current > 0) {
          const scale = distance / initialDistanceRef.current
          // Fire pinch event
        }
      }

      // Handle swipe
      if (deltaTime < 500) {
        // Determine primary direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (Math.abs(deltaX) > swipeThreshold) {
            const direction: SwipeDirection = deltaX > 0 ? 'right' : 'left'
            if (lastSwipeDirection.current !== direction) {
              // Fire swipe event
              lastSwipeDirection.current = direction
            }
          }
        } else {
          // Vertical swipe
          if (Math.abs(deltaY) > swipeThreshold) {
            const direction: SwipeDirection = deltaY > 0 ? 'down' : 'up'
            if (lastSwipeDirection.current !== direction) {
              // Fire swipe event
              lastSwipeDirection.current = direction
            }
          }
        }
      }
    }

    // Reset
    touchStartRef.current = null
    initialDistanceRef.current = 0
  }, [swipeThreshold, enablePinch])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true })
    element.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true })
    element.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true })
    element.addEventListener('touchcancel', handleTouchEnd as EventListener, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener)
      element.removeEventListener('touchmove', handleTouchMove as EventListener)
      element.removeEventListener('touchend', handleTouchEnd as EventListener)
      element.removeEventListener('touchcancel', handleTouchEnd as EventListener)

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    ref: elementRef,
    canSwipe: true,
  }
}
