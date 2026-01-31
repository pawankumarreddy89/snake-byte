'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface BottomActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  showHandle?: boolean
}

export function BottomActionSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  showHandle = true,
}: BottomActionSheetProps) {
  // Handle escape key and backdrop click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      )}

      {/* Sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'bg-background border-t border-border shadow-2xl rounded-t-2xl',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          maxHeight: '85vh',
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div className="w-full flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto" />
          </div>
        )}

        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9"
              >
                <X size={20} />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn('overflow-y-auto px-6 pb-6', className)}>
          {children}
        </div>
      </div>
    </>
  )
}
