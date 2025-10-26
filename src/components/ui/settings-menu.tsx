import { useState, useRef, useEffect } from 'react'
import { Settings, Sun, Moon, Monitor, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeContext } from '@/hooks/use-theme-context'
import { cn } from '@/lib/utils'
import { getSummarizerPreference, setSummarizerPreference, type SummarizerPreference } from '@/lib/settings-storage'
import { checkChromeSummarizerAvailability } from '@/lib/summarizer-utils'

type Theme = 'light' | 'dark' | 'system'

interface MenuPosition {
  top: number
  right: number
}

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, right: 0 })
  const [summarizerPreference, setSummarizerPreferenceState] = useState<SummarizerPreference>('built-in')
  const [isBuiltInAvailable, setIsBuiltInAvailable] = useState(false)
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)
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

  // Load summarizer preference and check built-in availability on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const preference = await getSummarizerPreference()
        setSummarizerPreferenceState(preference)
        
        const available = await checkChromeSummarizerAvailability()
        setIsBuiltInAvailable(available)
      } catch (error) {
        console.error('[Settings] Error loading summarizer settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleSummarizerToggle = async () => {
    const newPreference: SummarizerPreference = summarizerPreference === 'built-in' ? 'fallback' : 'built-in'
    setSummarizerPreferenceState(newPreference)
    try {
      await setSummarizerPreference(newPreference)
    } catch (error) {
      console.error('[Settings] Error saving summarizer preference:', error)
    }
  }

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

              {/* Summarizer Section */}
              <div>
                {/* Toggle Row */}
                <div className="flex items-center justify-between px-2 py-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {summarizerPreference === 'built-in' ? 'Built-in Summarizer' : 'AI Fallback'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {summarizerPreference === 'built-in'
                        ? 'Faster, no model download'
                        : 'Works everywhere, uses AI model'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSummarizerToggle}
                      disabled={!isBuiltInAvailable}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        'dark:focus:ring-offset-background',
                        summarizerPreference === 'built-in' && isBuiltInAvailable
                          ? 'bg-primary'
                          : 'bg-muted',
                        !isBuiltInAvailable && 'opacity-50 cursor-not-allowed'
                      )}
                      title={!isBuiltInAvailable ? 'Built-in summarizer not available' : undefined}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
                          summarizerPreference === 'built-in' ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                    {/* Info Icon */}
                    <button
                      onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                      className="p-1 rounded-md hover:bg-accent/50 transition-colors"
                      title="Summarizer information"
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Info Tooltip */}
                <AnimatePresence>
                  {showInfoTooltip && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-2 pb-3"
                    >
                      <div className="rounded-lg bg-accent/5 p-3 text-xs text-muted-foreground">
                        <div className="space-y-2">
                          <div>
                            <strong>Built-in Summarizer:</strong> Uses Chrome's native AI for faster, offline summarization with no model downloads.
                          </div>
                          <div>
                            <strong>AI Fallback:</strong> Uses local AI models that work everywhere but require initial download and more processing.
                          </div>
                          {!isBuiltInAvailable && (
                            <div className="text-amber-600 dark:text-amber-400">
                              <strong>Note:</strong> Built-in summarizer is not available in your browser. Enable it in Chrome flags or use AI fallback.
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
