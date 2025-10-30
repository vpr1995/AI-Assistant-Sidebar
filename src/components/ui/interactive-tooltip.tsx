/**
 * InteractiveTooltip Component
 * Displays tutorial tooltip with positioning and animations
 */

import { motion } from 'framer-motion'
import { ChevronRight, ChevronLeft, X } from 'lucide-react'
import type { OnboardingTooltip } from '@/types/onboarding'

interface InteractiveTooltipProps {
  tooltip: OnboardingTooltip
  isVisible: boolean
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  isLastStep?: boolean
  currentStep?: number
  totalSteps?: number
}

export function InteractiveTooltip({
  tooltip,
  isVisible,
  onNext,
  onPrevious,
  onSkip,
  isLastStep = false,
  currentStep = 1,
  totalSteps = 1,
}: InteractiveTooltipProps) {
  // Tooltip centering is handled by the wrapper container in OnboardingModal

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.8,
        y: isVisible ? 0 : 20,
      }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed z-50 w-full sm:w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-4 overflow-y-auto"
      style={{
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Close button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSkip}
        className="absolute top-2 right-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
        aria-label="Close tutorial"
      >
        <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </motion.button>

      {/* Title */}
      <h3 className="font-semibold text-slate-900 dark:text-white mb-2 pr-6 text-base">{tooltip.title}</h3>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{tooltip.description}</p>

      {/* Progress indicator */}
      {totalSteps > 1 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-500">
              Step {currentStep} of {totalSteps}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalSteps, 8) }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i < currentStep ? 'bg-blue-500 w-2' : 'bg-slate-300 dark:bg-slate-600 w-1'
                  }`}
                  initial={{ width: 4 }}
                  animate={{ width: i < currentStep ? 8 : 4 }}
                />
              ))}
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-blue-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        {onPrevious && currentStep > 1 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPrevious}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </motion.button>
        )}

        {onNext && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            {isLastStep ? 'Complete' : tooltip.action || 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
