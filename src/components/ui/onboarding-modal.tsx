/**
 * OnboardingModal Component
 * Main modal for onboarding flow with step progression
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingOverlay } from '@/components/ui/onboarding-overlay'
import { InteractiveTooltip } from '@/components/ui/interactive-tooltip'
import type { OnboardingStep } from '@/types/onboarding'

interface OnboardingModalProps {
  isOpen: boolean
  currentStep: OnboardingStep | null
  currentStepIndex: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingModal({
  isOpen,
  currentStep,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  onSkip,
}: OnboardingModalProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(false)

  // Get target element on step change
  useEffect(() => {
    setMounted(true)

    if (!currentStep) {
      setTargetElement(null)
      return
    }

    // Try to find target element
    if (currentStep.targetId) {
      const element = document.getElementById(currentStep.targetId)
      setTargetElement(element)
    } else if (currentStep.targetSelector) {
      const element = document.querySelector(currentStep.targetSelector)
      setTargetElement(element as HTMLElement)
    } else {
      setTargetElement(null)
    }

    return () => {
      setTargetElement(null)
    }
  }, [currentStep])

  const isLastStep = currentStepIndex === totalSteps - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      onNext()
    }
  }

  if (!mounted || !isOpen || !currentStep) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with spotlight */}
          {currentStep.highlighted && targetElement && (
            <OnboardingOverlay isVisible={isOpen} targetElement={targetElement} offset={8} />
          )}

          {/* Tooltip (centered wrapper) */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <InteractiveTooltip
              tooltip={currentStep.tooltip}
              isVisible={isOpen}
              onNext={handleNext}
              onPrevious={currentStepIndex > 0 ? onPrevious : undefined}
              onSkip={onSkip}
              isLastStep={isLastStep}
              currentStep={currentStepIndex + 1}
              totalSteps={totalSteps}
            />
          </div>

          {/* Background click to skip */}
          <motion.div
            className="fixed inset-0 z-30 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            onClick={onSkip}
            style={{ pointerEvents: 'auto' }}
          />
        </>
      )}
    </AnimatePresence>
  )
}
