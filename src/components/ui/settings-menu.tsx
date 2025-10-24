import { useState, useRef, useEffect } from 'react'
import { Settings, RotateCcw, Sun, Moon, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeContext } from '@/hooks/use-theme-context'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

interface SettingsMenuProps {
  onReset?: () => void
}

interface MenuPosition {
  top: number
  right: number
}

export function SettingsMenu({ onReset }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { theme, setTheme } = useThemeContext()

  // Update menu position when button position changes or menu opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // distance from right
      })
    }
  }, [isOpen])

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ]

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -8 },
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
    exit: { opacity: 0, scale: 0.95, y: -8 },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -4 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    }),
  }

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-8 w-8 p-0 rounded-md flex items-center justify-center',
          'transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'dark:focus:ring-offset-background',
          isOpen && 'bg-accent text-accent-foreground',
        )}
        title="Settings"
        aria-label="Settings menu"
        aria-expanded={isOpen}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Settings className="h-4 w-4" />
        </motion.div>
      </button>

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
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
            className={cn(
              'w-64 rounded-lg',
              'bg-popover text-popover-foreground',
              'border border-border shadow-lg z-50',
              'overflow-hidden',
            )}
          >
            <div className="p-3">
              {/* Theme Section */}
              <div className="mb-3">
                <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">
                  Theme
                </div>
                <div className="space-y-1">
                  {themes.map((t, i) => (
                    <motion.button
                      key={t.value}
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => {
                        setTheme(t.value)
                        setIsOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                        'text-sm transition-all duration-150',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-ring',
                        theme === t.value && 'bg-accent text-accent-foreground',
                      )}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                      {theme === t.value && (
                        <motion.div
                          layoutId="theme-check"
                          className="ml-auto"
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                          }}
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-current" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-3" />

              {/* Reset Section */}
              <motion.button
                custom={3}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                onClick={() => {
                  onReset?.()
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                  'text-sm transition-all duration-150',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'text-destructive hover:bg-destructive/10',
                )}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Chat</span>
              </motion.button>
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
