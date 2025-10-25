import { useState, useRef, useEffect } from 'react'
import { Settings, Sun, Moon, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeContext } from '@/hooks/use-theme-context'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

interface MenuPosition {
  top: number
  right: number
}

export function SettingsMenu() {
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
              'w-72 rounded-lg',
              'bg-popover text-popover-foreground',
              'border border-border/50 shadow-lg z-50',
              'overflow-hidden backdrop-blur-sm',
            )}
          >
            <div className="p-4 space-y-4">
              {/* Theme Section */}
              <div>
                <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="text-sm font-semibold text-foreground">
                    Theme
                  </div>
                  <div className="flex gap-2 ml-auto">
                    {themes.map((t, i) => (
                      <motion.button
                        key={t.value}
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => {
                          setTheme(t.value)
                        }}
                        className={cn(
                          'h-8 w-8 p-0 rounded-md flex items-center justify-center',
                          'transition-all duration-150 relative',
                          'hover:bg-accent/50',
                          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                          'dark:focus:ring-offset-background',
                          theme === t.value && 'bg-accent text-accent-foreground shadow-md',
                        )}
                        title={t.label}
                        aria-label={`Select ${t.label} theme`}
                      >
                        {theme === t.value && (
                          <motion.div
                            layoutId="theme-button-bg"
                            className="absolute inset-0 rounded-md bg-accent"
                            style={{ zIndex: -1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              damping: 30,
                            }}
                          />
                        )}
                        <motion.div
                          animate={{ scale: theme === t.value ? 1.15 : 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                          }}
                          className={cn(
                            'transition-colors duration-150',
                            theme === t.value
                              ? 'text-accent-foreground'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {t.icon}
                        </motion.div>
                      </motion.button>
                    ))}
                  </div>
                </div>
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
