'use client'

import { ReactNode } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface DrawerItem {
  id: string
  label: string
  icon?: ReactNode
  badge?: string | number
  rightElement?: ReactNode
  onClick?: () => void
  divider?: boolean
  disabled?: boolean
}

export interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: DrawerItem[]
  title?: string
  className?: string
}

export function SideDrawer({
  isOpen,
  onClose,
  items,
  title = 'Menu',
  className,
}: SideDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-full max-w-xs',
          'bg-background border-r border-border shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          top: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.map((item, index) => {
            const isDisabled = item.disabled ?? false

            return (
              <div key={item.id}>
                <button
                  onClick={item.onClick}
                  disabled={isDisabled}
                  className={cn(
                    'w-full flex items-center px-6 py-4',
                    'text-left transition-colors duration-150',
                    'active:bg-muted',
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted/50'
                  )}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '56px', // Minimum touch target
                  }}
                  aria-disabled={isDisabled}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {item.icon && (
                      <span className="text-muted-foreground flex-shrink-0">
                        {item.icon}
                      </span>
                    )}
                    <span className="font-medium text-base">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.badge && (
                      <span className={cn(
                        'px-2.5 py-1 text-[11px] font-semibold rounded-full',
                        typeof item.badge === 'number'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
                {item.divider && index < items.length - 1 && (
                  <div className="mx-6 my-1 border-b border-border/50" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
