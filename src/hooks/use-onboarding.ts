/**
 * useOnboarding Hook
 * Manages onboarding state, progression, and storage synchronization
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { OnboardingState } from '@/types/onboarding'
import {
  getOnboardingState,
  isFirstLaunch,
  completeOnboarding,
  skipOnboarding,
  resetOnboarding,
  updateCurrentStep,
  markStepCompleted,
  startOnboarding,
} from '@/lib/onboarding-storage'
import { ONBOARDING_STEPS } from '@/lib/onboarding-steps'

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => getOnboardingState())
  const [isFirstLaunchSession, setIsFirstLaunchSession] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if this is first launch on mount
  useEffect(() => {
    try {
      const firstLaunch = isFirstLaunch()
      setIsFirstLaunchSession(firstLaunch)

      // If first launch and not completed, start onboarding
      if (firstLaunch && !state.isCompleted) {
        startOnboarding()
        const updatedState = getOnboardingState()
        setState(updatedState)
      }

      setIsLoading(false)
    } catch (error) {
      console.error('[useOnboarding] Error checking first launch:', error)
      setIsLoading(false)
    }
  }, [state.isCompleted])

  // Get current step
  const currentStep = useMemo(() => {
    return ONBOARDING_STEPS[state.currentStepIndex] || null
  }, [state.currentStepIndex])

  // Navigation handlers
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < ONBOARDING_STEPS.length) {
      updateCurrentStep(index)
      const updatedState = getOnboardingState()
      setState(updatedState)
    }
  }, [])

  const nextStep = useCallback(() => {
    if (state.currentStepIndex < ONBOARDING_STEPS.length - 1) {
      const nextIndex = state.currentStepIndex + 1
      if (currentStep) {
        markStepCompleted(currentStep.id)
      }
      goToStep(nextIndex)
    }
  }, [state.currentStepIndex, currentStep, goToStep])

  const previousStep = useCallback(() => {
    if (state.currentStepIndex > 0) {
      goToStep(state.currentStepIndex - 1)
    }
  }, [state.currentStepIndex, goToStep])

  const handleCompleteOnboarding = useCallback(() => {
    if (currentStep) {
      markStepCompleted(currentStep.id)
    }
    completeOnboarding()
    const updatedState = getOnboardingState()
    setState(updatedState)
  }, [currentStep])

  const handleSkipOnboarding = useCallback(() => {
    skipOnboarding()
    const updatedState = getOnboardingState()
    setState(updatedState)
  }, [])

  const handleResetOnboarding = useCallback(() => {
    resetOnboarding()
    setIsFirstLaunchSession(true)
    const defaultState: OnboardingState = {
      isOnboarding: true,
      currentStepIndex: 0,
      completedSteps: [],
      isCompleted: false,
      hasSeenOnboarding: false,
    }
    setState(defaultState)
  }, [])

  return {
    state,
    steps: ONBOARDING_STEPS,
    currentStep,
    isFirstLaunch: isFirstLaunchSession,
    isLoading,
    isOnboarding: state.isOnboarding && !state.isCompleted && isFirstLaunchSession,
    progress: ONBOARDING_STEPS.length > 0 ? (state.currentStepIndex + 1) / ONBOARDING_STEPS.length : 0,
    totalSteps: ONBOARDING_STEPS.length,
    currentStepIndex: state.currentStepIndex,
    goToStep,
    nextStep,
    previousStep,
    completeOnboarding: handleCompleteOnboarding,
    skipOnboarding: handleSkipOnboarding,
    resetOnboarding: handleResetOnboarding,
  }
}
