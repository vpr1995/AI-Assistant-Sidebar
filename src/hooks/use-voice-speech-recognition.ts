import { useCallback, useEffect, useRef, useState } from 'react'

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionInterface {
  continuous: boolean
  interimResults: boolean
  language: string
  onstart: ((this: SpeechRecognitionInterface, ev: Event) => unknown) | null
  onresult: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionEvent) => unknown) | null
  onerror: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionErrorEvent) => unknown) | null
  onend: ((this: SpeechRecognitionInterface, ev: Event) => unknown) | null
  start(): void
  stop(): void
  abort(): void
}

interface UseVoiceSpeechRecognitionOptions {
  language?: string
  onTranscriptStart?: () => void
  onTranscriptEnd?: () => void
  onError?: (error: string) => void
}

export function useVoiceSpeechRecognition({
  language = 'en-US',
  onTranscriptStart,
  onTranscriptEnd,
  onError,
}: UseVoiceSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if Web Speech API is supported and initialize recognition instance (only once)
  useEffect(() => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition

    if (typeof SpeechRecognition === 'function') {
      setIsSupported(true)
      const recognition = new (SpeechRecognition as new () => SpeechRecognitionInterface)()
      recognitionRef.current = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.language = language

      return () => {
        if (recognition) {
          try {
            recognition.abort()
          } catch {
            // Ignore errors during cleanup
          }
        }
      }
    } else {
      setIsSupported(false)
    }
  }, [language])

  // Setup event handlers (separate effect to handle callback updates properly)
  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setError(null)
      onTranscriptStart?.()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''

      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }

      // Process all results from the beginning
      for (let i = 0; i < event.results.length; i++) {
        const speechRecognitionResult = event.results.item(i)
        if (!speechRecognitionResult) continue

        const speechRecognitionAlternative = speechRecognitionResult.item(0)
        if (!speechRecognitionAlternative) continue

        const transcriptPart = speechRecognitionAlternative.transcript

        // Only accumulate final results
        if (speechRecognitionResult.isFinal) {
          finalTranscript += transcriptPart + ' '
        }
      }

      // Only update if we have final results
      if (finalTranscript) {
        setTranscript((prev) => {
          const combined = prev ? prev + ' ' + finalTranscript : finalTranscript
          return combined.trim()
        })
      }

      // Auto-stop after 2 seconds of silence (no new final results)
      silenceTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          console.log('[VoiceSpeechRecognition] Auto-stopping after silence')
          recognitionRef.current.stop()
        }
      }, 2000)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = `Speech recognition error: ${event.error}`
      setError(errorMessage)
      onError?.(errorMessage)
      console.error('[VoiceSpeechRecognition]', errorMessage)
    }

    recognition.onend = () => {
      setIsListening(false)
      // Clear silence timeout when recognition ends
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = null
      }
      onTranscriptEnd?.()
    }
  }, [onTranscriptStart, onTranscriptEnd, onError, isListening])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      const error = 'Web Speech API is not supported'
      setError(error)
      onError?.(error)
      return
    }

    try {
      // If already listening, stop first to avoid "already started" error
      if (isListening) {
        console.log('[VoiceSpeechRecognition] Already listening, stopping first...')
        recognitionRef.current.abort()
      }
      
      setTranscript('')
      setError(null)
      recognitionRef.current.start()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start recognition'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [isSupported, onError, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        // Clear silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = null
        }
        recognitionRef.current.stop()
        setIsListening(false)
      } catch (err) {
        console.error('[VoiceSpeechRecognition] Error stopping recognition:', err)
      }
    }
  }, [])

  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
        setIsListening(false)
        setTranscript('')
      } catch (err) {
        console.error('[VoiceSpeechRecognition] Error aborting recognition:', err)
      }
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
  }
}
