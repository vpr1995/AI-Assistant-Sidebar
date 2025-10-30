/**
 * Onboarding Storage Utilities
 * Handles localStorage persistence for onboarding state
 */

import type { OnboardingState } from '@/types/onboarding'

const ONBOARDING_STORAGE_KEY = 'ai-assistant-onboarding-state'
const FIRST_LAUNCH_KEY = 'ai-assistant-first-launch'

const DEFAULT_STATE: OnboardingState = {
  isOnboarding: false,
  currentStepIndex: 0,
  completedSteps: [],
  isCompleted: false,
  hasSeenOnboarding: false,
  dismissedAt: undefined,
  lastStepViewed: undefined,
}

/**
 * Get the current onboarding state from localStorage
 */
export function getOnboardingState(): OnboardingState {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('[Onboarding] Error reading state from localStorage:', error)
  }
  return DEFAULT_STATE
}

/**
 * Save onboarding state to localStorage
 */
export function saveOnboardingState(state: OnboardingState): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('[Onboarding] Error saving state to localStorage:', error)
  }
}

/**
 * Check if this is the first launch of the extension
 */
export function isFirstLaunch(): boolean {
  try {
    const hasLaunched = localStorage.getItem(FIRST_LAUNCH_KEY)
    if (!hasLaunched) {
      // Mark that the extension has been launched
      localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
      return true
    }
    return false
  } catch (error) {
    console.error('[Onboarding] Error checking first launch:', error)
    return false
  }
}

/**
 * Mark onboarding as completed
 */
export function completeOnboarding(): void {
  const state = getOnboardingState()
  state.isCompleted = true
  state.hasSeenOnboarding = true
  state.isOnboarding = false
  state.dismissedAt = Date.now()
  saveOnboardingState(state)
}

/**
 * Mark onboarding as skipped
 */
export function skipOnboarding(): void {
  const state = getOnboardingState()
  state.hasSeenOnboarding = true
  state.isOnboarding = false
  state.dismissedAt = Date.now()
  saveOnboardingState(state)
}

/**
 * Reset onboarding state (for testing or user request)
 */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    localStorage.removeItem(FIRST_LAUNCH_KEY)
    console.log('[Onboarding] State reset')
  } catch (error) {
    console.error('[Onboarding] Error resetting state:', error)
  }
}

/**
 * Update current step in onboarding
 */
export function updateCurrentStep(stepIndex: number): void {
  const state = getOnboardingState()
  state.currentStepIndex = stepIndex
  saveOnboardingState(state)
}

/**
 * Mark a step as completed
 */
export function markStepCompleted(stepId: string): void {
  const state = getOnboardingState()
  if (!state.completedSteps.includes(stepId)) {
    state.completedSteps.push(stepId)
    state.lastStepViewed = stepId
  }
  saveOnboardingState(state)
}

/**
 * Start onboarding session
 */
export function startOnboarding(): void {
  const state = getOnboardingState()
  state.isOnboarding = true
  state.currentStepIndex = 0
  saveOnboardingState(state)
}
