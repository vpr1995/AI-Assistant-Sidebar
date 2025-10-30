/**
 * Onboarding Types & Interfaces
 * Defines the structure for the first-launch tutorial modal with interactive tooltips
 */

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface OnboardingTooltip {
  title: string
  description: string
  position: TooltipPosition
  action?: string // Optional CTA text (e.g., "Got it!", "Next")
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  tooltip: OnboardingTooltip
  targetSelector?: string // CSS selector for element to highlight (optional)
  targetId?: string // HTML id for direct targeting
  highlighted?: boolean // Whether this step highlights an element
  icon?: string // Icon name for visual cue
  order: number
}

export interface OnboardingState {
  isOnboarding: boolean
  currentStepIndex: number
  completedSteps: string[]
  isCompleted: boolean
  hasSeenOnboarding: boolean
  dismissedAt?: number
  lastStepViewed?: string
}

export interface OnboardingContextType {
  state: OnboardingState
  steps: OnboardingStep[]
  currentStep: OnboardingStep | null
  isFirstLaunch: boolean
  goToStep: (index: number) => void
  nextStep: () => void
  previousStep: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  resetOnboarding: () => void
}
