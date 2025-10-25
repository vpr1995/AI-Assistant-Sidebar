"use client"

import React, { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, Info, Loader2, Mic, Square } from "lucide-react"
import { omit } from "remeda"

import { cn } from "@/lib/utils"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { useAutosizeTextArea } from "@/hooks/use-autosize-textarea"
import { AudioVisualizer } from "@/components/ui/audio-visualizer"
import { Button } from "@/components/ui/button"
import { ProviderSelector } from "@/components/ui/provider-selector"
import { InterruptPrompt } from "@/components/ui/interrupt-prompt"

interface MessageInputBaseProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  submitOnEnter?: boolean
  stop?: () => void
  isGenerating: boolean
  enableInterrupt?: boolean
  transcribeAudio?: (blob: Blob) => Promise<string>
  preferredProvider?: "built-in-ai" | "web-llm" | "transformers-js" | "auto"
  onProviderChange?: (provider: "built-in-ai" | "web-llm" | "transformers-js" | "auto") => void
  availableProviders?: ("built-in-ai" | "web-llm" | "transformers-js")[]
}

interface MessageInputWithoutAttachmentProps extends MessageInputBaseProps {
  allowAttachments?: false
}

type MessageInputProps = MessageInputWithoutAttachmentProps

export function MessageInput({
  placeholder = "Ask AI...",
  className,
  onKeyDown: onKeyDownProp,
  submitOnEnter = true,
  stop,
  isGenerating,
  enableInterrupt = true,
  transcribeAudio,
  preferredProvider,
  onProviderChange,
  availableProviders,
  ...props
}: MessageInputProps) {
  const [showInterruptPrompt, setShowInterruptPrompt] = useState(false)

  const {
    isListening,
    isSpeechSupported,
    isRecording,
    isTranscribing,
    audioStream,
    toggleListening,
    stopRecording,
  } = useAudioRecording({
    transcribeAudio,
    onTranscriptionComplete: (text) => {
      props.onChange?.({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>)
    },
  })

  // If generation starts while the mic is active, stop recording to avoid conflicts
  useEffect(() => {
    if (isGenerating && isListening) {
      stopRecording()
    }
  }, [isGenerating, isListening, stopRecording])

  useEffect(() => {
    if (!isGenerating) {
      setShowInterruptPrompt(false)
    }
  }, [isGenerating])

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitOnEnter && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()

      if (isGenerating && stop && enableInterrupt) {
        if (showInterruptPrompt) {
          stop()
          setShowInterruptPrompt(false)
          event.currentTarget.form?.requestSubmit()
        } else if (props.value) {
          setShowInterruptPrompt(true)
          return
        }
      }

      event.currentTarget.form?.requestSubmit()
    }

    onKeyDownProp?.(event)
  }

  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [textAreaHeight, setTextAreaHeight] = useState<number>(0)

  useEffect(() => {
    if (textAreaRef.current) {
      setTextAreaHeight(textAreaRef.current.offsetHeight)
    }
  }, [props.value])

  useAutosizeTextArea({
    ref: textAreaRef,
    maxHeight: 240,
    borderWidth: 1,
    dependencies: [props.value],
  })

  return (
    <div className="relative flex w-full">
      {enableInterrupt && (
        <InterruptPrompt
          isOpen={showInterruptPrompt}
          close={() => setShowInterruptPrompt(false)}
        />
      )}

      <RecordingPrompt
        isVisible={isRecording}
        onStopRecording={stopRecording}
      />

      {/* Bordered container that surrounds both textarea and control row */}
      <div className={cn("relative w-full rounded-xl border border-input bg-background overflow-hidden", className)}>
        {/* Textarea area (keeps its own relative context so overlays can position over it) */}
        <div className="relative">
          <textarea
            aria-label="Write your prompt here"
            placeholder={placeholder}
            ref={textAreaRef}
            onKeyDown={onKeyDown}
            className={cn(
              "z-10 w-full grow resize-none bg-transparent p-3 text-sm ring-offset-background transition-[border] placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              // keep any extra classes provided by callers applied to the outer container
              // but keep textarea visuals consistent
              ""
            )}
            {...omit(props, ["allowAttachments"])}
          />

          <RecordingControls
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            audioStream={audioStream}
            textAreaHeight={textAreaHeight}
            onStopRecording={stopRecording}
          />
        </div>

        {/* Bottom control row inside the same border */}
  <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2">
            {preferredProvider !== undefined && onProviderChange && availableProviders && (
              <ProviderSelector
                value={preferredProvider}
                onChange={onProviderChange}
                availableProviders={availableProviders}
                className="h-8"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSpeechSupported && (
              <Button
                type="button"
                variant="outline"
                className={cn("h-8 w-8", isListening && !isGenerating && "text-primary")}
                aria-label="Voice input"
                size="icon"
                onClick={toggleListening}
                disabled={isGenerating}
                title={isGenerating ? "Voice input disabled while generating" : "Voice input"}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
            {isGenerating && stop ? (
              <Button
                type="button"
                size="icon"
                className="h-8 w-8"
                aria-label="Stop generating"
                onClick={stop}
              >
                <Square className="h-3 w-3 animate-pulse" fill="currentColor" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 transition-opacity"
                aria-label="Send message"
                disabled={props.value === "" || isGenerating}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
MessageInput.displayName = "MessageInput"

function TranscribingOverlay() {
  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <motion.div
          className="absolute inset-0 h-8 w-8 animate-pulse rounded-full bg-primary/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Transcribing audio...
      </p>
    </motion.div>
  )
}

interface RecordingPromptProps {
  isVisible: boolean
  onStopRecording: () => void
}

function RecordingPrompt({ isVisible, onStopRecording }: RecordingPromptProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ top: 0, filter: "blur(5px)" }}
          animate={{
            top: -40,
            filter: "blur(0px)",
            transition: {
              type: "spring",
              filter: { type: "tween" },
            },
          }}
          exit={{ top: 0, filter: "blur(5px)" }}
          className="absolute left-1/2 flex -translate-x-1/2 cursor-pointer overflow-hidden whitespace-nowrap rounded-full border bg-background py-1 text-center text-sm text-muted-foreground"
          onClick={onStopRecording}
        >
          <span className="mx-2.5 flex items-center">
            <Info className="mr-2 h-3 w-3" />
            Click to finish Transcribing
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface RecordingControlsProps {
  isRecording: boolean
  isTranscribing: boolean
  audioStream: MediaStream | null
  textAreaHeight: number
  onStopRecording: () => void
}

function RecordingControls({
  isRecording,
  isTranscribing,
  audioStream,
  textAreaHeight,
  onStopRecording,
}: RecordingControlsProps) {
  if (isRecording) {
    return (
      <div
        className="absolute inset-[1px] z-50 overflow-hidden rounded-xl"
        style={{ height: textAreaHeight - 2 }}
      >
        <AudioVisualizer
          stream={audioStream}
          isRecording={isRecording}
          onClick={onStopRecording}
        />
      </div>
    )
  }

  if (isTranscribing) {
    return (
      <div
        className="absolute inset-[1px] z-50 overflow-hidden rounded-xl"
        style={{ height: textAreaHeight - 2 }}
      >
        <TranscribingOverlay />
      </div>
    )
  }

  return null
}
