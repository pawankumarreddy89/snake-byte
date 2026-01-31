'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/mobile'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { SwipeableItem, type SwipeableAction } from '@/components/mobile/SwipeableItem'
import { BottomActionSheet } from '@/components/mobile/BottomActionSheet'
import { useNetworkStatus, useDeviceOrientation } from '@/hooks/mobile'
import { Trophy, Users, TrendingUp, Settings, Share, Archive, Trash2, Wifi, WifiOff, Smartphone, RotateCw, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileExamplePage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showSettingsSheet, setShowSettingsSheet] = useState(false)
  const [showDetailsSheet, setShowDetailsSheet] = useState(false)
  const { isOnline, justCameOnline, justWentOffline } = useNetworkStatus()
  const { isPortrait, isLandscape } = useDeviceOrientation()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  const sampleData = [
    {
      id: '1',
      title: 'Recent Game - Snake Classic',
      score: 1250,
      date: '2 min ago',
      icon: <Trophy size={24} className="text-yellow-500" />,
    },
    {
      id: '2',
      title: 'PvP Match Won',
      score: 850,
      date: '15 min ago',
      icon: <Users size={24} className="text-purple-500" />,
    },
    {
      id: '3',
      title: 'Achievement Unlocked',
      score: 500,
      date: '1 hour ago',
      icon: <TrendingUp size={24} className="text-green-500" />,
    },
    {
      id: '4',
      title: 'New High Score',
      score: 3200,
      date: '3 hours ago',
      icon: <Settings size={24} className="text-orange-500" />,
    },
  ]

  const getLeftActions = (id: string): SwipeableAction[] => [
    {
      id: `share-${id}`,
      label: 'Share',
      icon: <Share size={18} />,
      color: 'primary',
    },
    {
      id: `archive-${id}`,
      label: 'Archive',
      icon: <Archive size={18} />,
    },
  ]

  const getRightActions = (id: string): SwipeableAction[] => [
    {
      id: `delete-${id}`,
      label: 'Delete',
      icon: <Trash2 size={18} />,
      color: 'destructive',
    },
  ]

  return (
    <AppLayout
      title="Mobile Dashboard"
      showMenuButton
      currentNavValue="home"
    >
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
        {/* Network Status Banner */}
        <AnimatePresence mode="wait">
          {(justCameOnline || justWentOffline) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <div
                className={cn(
                  'rounded-lg p-4 flex items-center gap-3',
                  justCameOnline ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'
                )}
              >
                {justCameOnline ? (
                  <Wifi className="text-green-600" size={24} />
                ) : (
                  <WifiOff className="text-orange-600" size={24} />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-base">
                    {justCameOnline ? 'Back Online' : 'Connection Lost'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {justCameOnline
                      ? 'Your connection has been restored'
                      : 'Please check your internet connection'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <Trophy className="text-purple-600 mb-2" size={28} />
              <p className="text-2xl font-bold text-foreground">3,240</p>
              <p className="text-sm text-muted-foreground">Total Score</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-4">
              <Users className="text-green-600 mb-2" size={28} />
              <p className="text-2xl font-bold text-foreground">47</p>
              <p className="text-sm text-muted-foreground">Games Played</p>
            </CardContent>
          </Card>
        </div>

        {/* Orientation Status */}
        <div className="mb-6">
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-muted-foreground" size={20} />
                  <span className="text-sm font-medium text-muted-foreground">
                    Device Orientation
                  </span>
                </div>
                <Badge
                  variant={isPortrait ? 'default' : 'secondary'}
                  className="text-xs px-3 py-1"
                >
                  {isPortrait ? '📱 Portrait' : '📱 Landscape'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Status Card */}
        <div className="mb-6">
          <Card
            className={cn(
              'border-2',
              isOnline ? 'border-green-500/30 bg-green-500/5' : 'border-orange-500/30 bg-orange-500/5'
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="text-green-600" size={20} />
                ) : (
                  <WifiOff className="text-orange-600" size={20} />
                )}
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="font-semibold text-lg">
                {isOnline ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnline
                  ? 'Your internet connection is stable'
                  : 'Waiting for connection...'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Swipeable List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Swipe items for quick actions
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {sampleData.map((item) => (
              <SwipeableItem
                key={item.id}
                id={item.id}
                leftActions={getLeftActions(item.id)}
                rightActions={getRightActions(item.id)}
              >
                <div className="w-full flex items-center gap-4 p-4 border-b border-border last:border-0 min-h-[60px]">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-base">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{item.score}</p>
                  </div>
                </div>
              </SwipeableItem>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="outline"
            className="h-12 text-base"
            onClick={() => setShowSettingsSheet(true)}
          >
            <Settings className="mr-2" size={20} />
            Settings
          </Button>
          <Button
            variant="outline"
            className="h-12 text-base"
            onClick={() => setShowDetailsSheet(true)}
          >
            <Bell className="mr-2" size={20} />
            Notifications
            <Badge className="ml-2">3</Badge>
          </Button>
        </div>

        {/* Feature Demo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mobile Framework Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <RotateCw className="text-primary" size={20} />
              <div className="flex-1">
                <p className="font-medium">Pull to Refresh</p>
                <p className="text-sm text-muted-foreground">
                  Pull down on this list to refresh
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="text-primary" size={20} />
              <div className="flex-1">
                <p className="font-medium">Swipe Actions</p>
                <p className="text-sm text-muted-foreground">
                  Swipe left or right on list items
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="text-primary" size={20} />
              <div className="flex-1">
                <p className="font-medium">Bottom Sheets</p>
                <p className="text-sm text-muted-foreground">
                  Click Settings or Notifications to see sheets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Settings className="text-primary" size={20} />
              <div className="flex-1">
                <p className="font-medium">Safe Area Support</p>
                <p className="text-sm text-muted-foreground">
                  Layout respects device notches
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PullToRefresh>

      {/* Settings Sheet */}
      <BottomActionSheet
        isOpen={showSettingsSheet}
        onClose={() => setShowSettingsSheet(false)}
        title="Settings"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-3">Display</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Dark Mode</span>
                <Button variant="outline" size="sm">
                  {isPortrait ? 'Auto' : 'Auto'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Animations</span>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3">Sound</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Sound Effects</span>
                <Button variant="outline" size="sm">
                  On
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Music</span>
                <Button variant="outline" size="sm">
                  Off
                </Button>
              </div>
            </div>
          </div>
        </div>
      </BottomActionSheet>

      {/* Notifications Sheet */}
      <BottomActionSheet
        isOpen={showDetailsSheet}
        onClose={() => setShowDetailsSheet(false)}
        title="Notifications"
      >
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium text-base mb-1">New Achievement!</p>
            <p className="text-sm text-muted-foreground">You unlocked "Snake Master"</p>
            <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
          </div>
          <div className="p-4 bg-purple-500/10 border-purple-500/20 rounded-lg">
            <p className="font-medium text-base mb-1">Game Invitation</p>
            <p className="text-sm text-muted-foreground">Player123 wants to play</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm">Accept</Button>
              <Button variant="outline" size="sm">Decline</Button>
            </div>
          </div>
          <div className="p-4 bg-green-500/10 border-green-500/20 rounded-lg">
            <p className="font-medium text-base mb-1">Rank Updated!</p>
            <p className="text-sm text-muted-foreground">You moved up to #42</p>
            <p className="text-xs text-muted-foreground mt-2">Yesterday</p>
          </div>
        </div>
      </BottomActionSheet>
    </AppLayout>
  )
}

// Helper function for className conditional
function cn(...classes: (string | undefined | boolean | null)[]) {
  return classes.filter(Boolean).join(' ')
}
