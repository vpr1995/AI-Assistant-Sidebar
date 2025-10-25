import { useCallback, useEffect, useRef, useState } from "react"

import { recordAudio } from "@/lib/audio-utils"
import { useVoiceSpeechRecognition } from "@/hooks/use-voice-speech-recognition"
import { requestMicrophonePermissionSmart } from "@/lib/iframe-permission-manager"

interface UseAudioRecordingOptions {
  transcribeAudio?: (blob: Blob) => Promise<string>
  onTranscriptionComplete?: (text: string) => void
}

export function useAudioRecording({
  transcribeAudio,
  onTranscriptionComplete,
}: UseAudioRecordingOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const activeRecordingRef = useRef<Promise<Blob> | null>(null)
  const hasStartedRecordingRef = useRef(false)

  // Use Web Speech API for speech recognition
  const voiceSpeechRecognition = useVoiceSpeechRecognition({
    onTranscriptStart: () => {
      setIsTranscribing(false)
    },
    onTranscriptEnd: () => {
      setIsTranscribing(false)
      // Auto-complete recording when speech recognition stops
      console.log("[AudioRecording] Speech recognition ended, completing recording...")
    },
    onError: (error) => {
      console.error("[AudioRecording] Speech recognition error:", error)
    },
  })

  // Watch for speech recognition stopping and auto-complete the recording
  useEffect(() => {
    // Only auto-complete if we actually started recording successfully
    if (hasStartedRecordingRef.current && isListening && isRecording && !voiceSpeechRecognition.isListening) {
      console.log("[AudioRecording] Auto-completing recording after speech recognition stopped")
      hasStartedRecordingRef.current = false
      stopRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, isRecording, voiceSpeechRecognition.isListening])

  useEffect(() => {
    const checkSpeechSupport = async () => {
      const hasMediaDevices = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      )
      // Speech is supported if either Web Speech API is available or transcribeAudio function is provided
      const isWebSpeechSupported = voiceSpeechRecognition.isSupported
      const isBlobTranscriptionSupported = !!transcribeAudio
      setIsSpeechSupported(hasMediaDevices && (isWebSpeechSupported || isBlobTranscriptionSupported))
    }

    checkSpeechSupport()
  }, [transcribeAudio, voiceSpeechRecognition.isSupported])

  const stopRecording = useCallback(async () => {
    setIsRecording(false)
    hasStartedRecordingRef.current = false
    try {
      // Stop Web Speech API recognition
      voiceSpeechRecognition.stopListening()

      // Get the transcript from Web Speech API
      const transcript = voiceSpeechRecognition.transcript
      if (transcript) {
        onTranscriptionComplete?.(transcript)
        voiceSpeechRecognition.resetTranscript()
      } else if (transcribeAudio) {
        // Fallback to blob transcription if no Web Speech API transcript
        setIsTranscribing(true)
        try {
          recordAudio.stop()
          const recording = await activeRecordingRef.current
          if (recording) {
            const text = await transcribeAudio(recording)
            onTranscriptionComplete?.(text)
          }
        } finally {
          setIsTranscribing(false)
        }
      } else {
        recordAudio.stop()
      }
    } catch (error) {
      console.error("[AudioRecording] Error stopping recording:", error)
    } finally {
      setIsListening(false)
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop())
        setAudioStream(null)
      }
      activeRecordingRef.current = null
    }
  }, [audioStream, onTranscriptionComplete, transcribeAudio, voiceSpeechRecognition])

  const toggleListening = async () => {
    if (!isListening) {
      try {
        setIsListening(true)
        setIsRecording(true)

        // Request microphone permission with iframe fallback
        const permissionResult = await requestMicrophonePermissionSmart()
        if (!permissionResult.granted) {
          const errorMsg = permissionResult.error || 'Microphone permission denied'
          console.warn("[AudioRecording] Permission request failed:", errorMsg)
          setIsListening(false)
          setIsRecording(false)
          return
        }

        // Get audio stream for recording
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        setAudioStream(stream)

        // Start audio recording
        activeRecordingRef.current = recordAudio(stream)

        // Start Web Speech API recognition
        if (voiceSpeechRecognition.isSupported) {
          voiceSpeechRecognition.startListening()
          // Mark that we've successfully started recording
          hasStartedRecordingRef.current = true
        }
      } catch (error) {
        // Handle specific permission errors
        const errorMessage = error instanceof Error ? error.message : String(error)

        if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowedError')) {
          console.warn("[AudioRecording] Microphone permission denied by user")
        } else if (errorMessage.includes('NotFoundError')) {
          console.error("[AudioRecording] No microphone found on this device")
        } else {
          console.error("[AudioRecording] Error starting recording:", error)
        }

        setIsListening(false)
        setIsRecording(false)
        hasStartedRecordingRef.current = false
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop())
          setAudioStream(null)
        }
      }
    } else {
      await stopRecording()
    }
  }

  return {
    isListening,
    isSpeechSupported,
    isRecording,
    isTranscribing,
    audioStream,
    toggleListening,
    stopRecording,
  }
}
