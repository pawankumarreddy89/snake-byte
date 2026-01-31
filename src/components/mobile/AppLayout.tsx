'use client'

import { ReactNode, useState } from 'react'
import { Menu, Bell, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BottomNav, type NavItem } from './mobile/BottomNav'
import { SideDrawer, type DrawerItem } from './mobile/SideDrawer'

export interface AppLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  onBackPress?: () => void
  showMenuButton?: boolean
  rightActions?: ReactNode
  navItems?: NavItem[]
  currentNavValue?: string
  onNavChange?: (value: string) => void
  className?: string
}

const defaultDrawerItems: DrawerItem[] = [
  { id: 'profile', label: 'My Profile', icon: <User size={20} />, divider: true },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, badge: 3 },
  { id: 'help', label: 'Help & Support', icon: <Search size={20} />, divider: true },
  { id: 'about', label: 'About', icon: <Menu size={20} /> },
]

export function AppLayout({
  children,
  title = 'Snake Game',
  showBackButton = false,
  onBackPress,
  showMenuButton = true,
  rightActions,
  navItems,
  currentNavValue = 'home',
  onNavChange,
  className,
}: AppLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const drawerItems: DrawerItem[] = [
    { id: 'settings', label: 'Settings', icon: <Menu size={20} />, divider: true },
    ...defaultDrawerItems,
  ]

  return (
    <div className={cn('flex flex-col min-h-screen bg-background', className)}>
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40",
        'bg-background/95 backdrop-blur-lg border-b border-border",
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back Button or Logo */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackPress}
                className="h-10 w-10"
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Button>
            ) : (
              <div className="font-bold text-lg text-primary">
                {title}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {rightActions}
            {showMenuButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDrawerOpen(true)}
                className="h-10 w-10"
              >
                <Menu size={22} />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main
        className="flex-1 overflow-y-auto",
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 60px)', // Header height + safe area
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)', // Bottom nav height + safe area
        }}
      >
        <div className="max-w-md mx-auto px-4 py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        items={navItems}
        activeValue={currentNavValue}
        onValueChange={(value) => {
          onNavChange?.(value)
          // Close drawer when navigating
          setIsDrawerOpen(false)
        }}
      />

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={drawerItems}
        title="Menu"
      />
    </div>
  )
}
