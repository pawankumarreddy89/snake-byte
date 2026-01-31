'use client'

import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { BottomNav, type NavItem } from '@/components/mobile/BottomNav'
import { BottomActionSheet } from '@/components/mobile/BottomActionSheet'
import { Menu as MenuIcon, Bell, User as UserIcon, ChevronRight } from 'lucide-react'

export interface AppLayoutProps {
  children: ReactNode
  title?: string
  showNav?: boolean
  actions?: ReactNode
}

export function AppLayout({ children, title, showNav = true, actions }: AppLayoutProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const navItems: NavItem[] = [
    { id: 'home', label: 'Play', icon: '🎮', onPress: () => {}, badge: 0 },
    { id: 'leaderboard', label: 'Ranks', icon: '🏆', onPress: () => {}, badge: 0 },
    { id: 'profile', label: 'Profile', icon: '👤', onPress: () => {}, badge: 0 },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 bg-background/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-border"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Title */}
          <div className="flex items-center gap-2">
            {title && (
              <>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {title}
                </span>
              </>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {actions}

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with top padding for header */}
      <main
        className="flex-1 pt-[calc(56px+env(safe-area-inset-top,0px))] pb-[calc(64px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="w-full max-w-md mx-auto px-4">
          {children}
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      {showNav && (
        <BottomNav
          items={navItems}
          activeId="home"
        />
      )}

      {/* Settings Bottom Sheet */}
      <BottomActionSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        title="Settings"
        description="Customize your game experience"
        footer={
          <div className="space-y-3">
            <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium">
              Save Changes
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-muted text-muted-foreground py-3 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sound</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-base">Sound Effects</span>
                <div className="w-12 h-7 bg-primary rounded-full" />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-base">Music</span>
                <div className="w-12 h-7 bg-muted rounded-full" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Controls</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-base">Vibration</span>
                <div className="w-12 h-7 bg-primary rounded-full" />
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-base">Haptic Feedback</span>
                <div className="w-12 h-7 bg-primary rounded-full" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account</h3>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <button className="flex items-center gap-3 text-left flex-1 p-3 rounded-lg bg-muted">
                <UserIcon className="w-5 h-5" />
                <div>
                  <div className="text-base font-medium">Guest User</div>
                  <div className="text-sm text-muted-foreground">Sign up to save progress</div>
                </div>
              </button>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </BottomActionSheet>

      {/* Notifications Bottom Sheet */}
      <BottomActionSheet
        open={showNotifications}
        onOpenChange={setShowNotifications}
        title="Notifications"
        description="Stay updated with your game progress"
        footer={
          <button
            onClick={() => setShowNotifications(false)}
            className="w-full bg-muted text-muted-foreground py-3 rounded-lg font-medium"
          >
            Close
          </button>
        }
      >
        <div className="space-y-3">
          {[
            { icon: '🎉', title: 'Achievement Unlocked!', message: 'You earned the Speed Demon badge' },
            { icon: '🏆', title: 'New High Score!', message: 'Beat your record: 1,250 points' },
            { icon: '⚔', title: 'Security Alert', message: 'Account accessed from new device' },
            { icon: '🎮', title: 'Daily Challenge', message: 'Complete 5 games to earn bonus XP' },
          ].map((notification, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 bg-muted/50 rounded-lg border border-border"
            >
              <div className="text-4xl">
                {notification.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">
                  {notification.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {notification.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </BottomActionSheet>
    </div>
  )
}
