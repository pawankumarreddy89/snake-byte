'use client'

import { useState, useEffect } from 'react'

export type Orientation = 'portrait' | 'landscape' | null

export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<Orientation>(null)

  useEffect(() => {
    const handleOrientationChange = () => {
      if (typeof window !== 'undefined' && 'screen' in window) {
        const screenWidth = window.screen.width
        const screenHeight = window.screen.height

        // Consider device orientation, not just viewport
        if (window.matchMedia('(orientation: portrait)').matches) {
          setOrientation('portrait')
        } else if (window.matchMedia('(orientation: landscape)').matches) {
          setOrientation('landscape')
        } else {
          // Fallback to screen dimensions
          setOrientation(screenWidth > screenHeight ? 'landscape' : 'portrait')
        }
      }
    }

    // Initial check
    handleOrientationChange()

    // Listen for orientation changes
    const mediaQuery = window.matchMedia('(orientation: portrait)')
    mediaQuery.addEventListener('change', handleOrientationChange)

    return () => {
      mediaQuery.removeEventListener('change', handleOrientationChange)
    }
  }, [])

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  }
}
