'use client'

import { ReactNode, useState } from 'react'
import { Home, Gamepad2, Trophy, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItem {
  id: string
  label: string
  icon: ReactNode
  value: string
  badge?: number
}

export interface BottomNavProps {
  items: NavItem[]
  activeValue?: string
  onValueChange?: (value: string) => void
  className?: string
}

const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home size={24} />, value: 'home' },
  { id: 'game', label: 'Game', icon: <Gamepad2 size={24} />, value: 'game' },
  { id: 'leaderboard', label: 'Ranks', icon: <Trophy size={24} />, value: 'leaderboard' },
  { id: 'profile', label: 'Profile', icon: <User size={24} />, value: 'profile' },
  { id: 'settings', label: 'Settings', icon: <Settings size={24} />, value: 'settings' },
]

export function BottomNav({
  items = defaultNavItems,
  activeValue,
  onValueChange,
  className,
}: BottomNavProps) {
  const [localActiveValue, setLocalActiveValue] = useState(activeValue || items[0]?.value)

  const handleNavChange = (value: string) => {
    setLocalActiveValue(value)
    onValueChange?.(value)
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur-lg border-t border-border',
        'pb-safe-or-4 pt-2 px-4',
        className
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}
    >
      <div className="flex items-center justify-around w-full max-w-md mx-auto">
        {items.map((item) => {
          const isActive = item.value === (activeValue || localActiveValue)

          return (
            <button
              key={item.id}
              onClick={() => handleNavChange(item.value)}
              className={cn(
                'flex flex-col items-center gap-1',
                'min-w-[60px] py-2 px-3',
                'rounded-lg transition-all duration-200',
                'active:scale-95',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted/80',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1",
                    'bg-destructive text-destructive-foreground',
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px]',
                    'flex items-center justify-center'
                  }>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
