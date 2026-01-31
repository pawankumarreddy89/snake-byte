'use client'

import { useState, useEffect } from 'react'

export type NetworkStatus = 'online' | 'offline' | 'unknown'

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>('unknown')
  const [previousStatus, setPreviousStatus] = useState<NetworkStatus>('unknown')

  useEffect(() => {
    // Check initial status
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      setStatus(navigator.onLine ? 'online' : 'offline')
    }

    const handleOnline = () => {
      setPreviousStatus(status)
      setStatus('online')
    }

    const handleOffline = () => {
      setPreviousStatus(status)
      setStatus('offline')
    }

    // Listen for network changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Try to fetch a small resource to check connectivity
        const response = await fetch(window.location.href, {
          method: 'HEAD',
          cache: 'no-store',
        })
        setStatus(response.ok ? 'online' : 'offline')
      } catch {
        setStatus('offline')
      }
    }

    checkStatus()
  }, [])

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    previousStatus,
    justCameOnline: status === 'online' && previousStatus === 'offline',
    justWentOffline: status === 'offline' && previousStatus === 'online',
  }
}
