/**
 * OnboardingOverlay Component
 * Renders spotlight effect highlighting the current tutorial element
 */

import { motion } from 'framer-motion'

interface OnboardingOverlayProps {
  isVisible: boolean
  targetElement: HTMLElement | null
  offset?: number
}

export function OnboardingOverlay({ isVisible, targetElement, offset = 8 }: OnboardingOverlayProps) {
  // Get target element position
  const getTargetPosition = () => {
    if (!targetElement) {
      return {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      }
    }

    const rect = targetElement.getBoundingClientRect()
    return {
      top: rect.top - offset,
      left: rect.left - offset,
      width: rect.width + offset * 2,
      height: rect.height + offset * 2,
    }
  }

  const position = getTargetPosition()

  return (
    <>
      {/* Semi-transparent dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.7 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black pointer-events-none z-40"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Spotlight around target element */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: 1,
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed pointer-events-none z-40 border-2 border-blue-400 rounded-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.5)',
        }}
      >
        {/* Pulsing animation effect */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.5)',
              '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.8)',
              '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.5)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: isVisible ? Infinity : 0,
          }}
          className="w-full h-full border-2 border-blue-400 rounded-lg"
        />
      </motion.div>
    </>
  )
}
