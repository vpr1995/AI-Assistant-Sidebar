/**
 * Tool picker component - popover to select which AI tools are enabled
 */

import { useState, useRef, useEffect } from 'react'
import { Settings2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ToolSelection } from '@/lib/tools/types'
import { ALL_TOOLS } from '@/lib/tools'

interface ToolPickerProps {
  selectedTools: ToolSelection
  onToolChange: (toolId: string, enabled: boolean) => void
  className?: string
}

interface MenuPosition {
  top?: number
  bottom?: number
  right: number
}

export function ToolPicker({ selectedTools, onToolChange, className }: ToolPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Update menu position when button position changes or menu opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 8, // Position above the button with 8px gap
        right: window.innerWidth - rect.right, // distance from right
      })
    }
  }, [isOpen])

  // Count how many tools are selected
  const selectedCount = Object.values(selectedTools).filter(Boolean).length
  const someSelected = selectedCount > 0 && selectedCount < ALL_TOOLS.length

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 8 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: { opacity: 0, scale: 0.95, y: 8 },
  }

  return (
    <div className="relative">
      {/* Tool Picker Button */}
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        className={cn('h-8 w-8 relative', className)}
        aria-label="Tool picker"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        title="Select AI tools"
      >
        <Settings2 className="h-4 w-4" />
        {/* Show indicator if not all tools selected */}
        {someSelected && <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-yellow-500" />}
      </Button>

      {/* Dropdown Menu - Using Portal-like fixed positioning */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'fixed',
              bottom: `${menuPosition.bottom}px`,
              right: `${menuPosition.right}px`,
            }}
            className={cn(
              'w-72 rounded-lg',
              'bg-popover text-popover-foreground',
              'border border-border/50 shadow-lg z-50',
              'overflow-hidden backdrop-blur-sm',
            )}
          >
            <div className="p-4 space-y-3">
              <div className="text-sm font-semibold text-foreground mb-3">AI Tools</div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ALL_TOOLS.map((tool) => {
                  const isChecked = selectedTools[tool.id] ?? false
                  return (
                    <label
                      key={tool.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-accent/10 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onToolChange(tool.id, e.currentTarget.checked)}
                        className="mt-1 h-4 w-4 rounded border-input cursor-pointer"
                      />
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="text-sm font-medium">{tool.label}</span>
                        <span className="text-xs text-muted-foreground">{tool.description}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

ToolPicker.displayName = 'ToolPicker'
