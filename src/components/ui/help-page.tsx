import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface HelpPageProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpPage({ isOpen, onClose }: HelpPageProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close help"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>

              <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Help & Documentation</h2>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Welcome! This page provides a quick overview of the main features in the AI Assistant extension.
              </p>

              <section className="mb-4">
                <h3 className="font-medium mb-1">Chat</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Type messages in the chat input and press <strong>Enter</strong> or click Send to talk to the AI.</p>
              </section>

              <section className="mb-4">
                <h3 className="font-medium mb-1">AI Providers</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Choose between Built-in AI (fastest), WebLLM and Transformers.js from the provider selector. Built-in AI requires Chrome support.</p>
              </section>

              <section className="mb-4">
                <h3 className="font-medium mb-1">Tools & Plugins</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Enable tools like web search, memory search, or other utilities via the Tools menu to extend the assistant's capabilities.</p>
              </section>

              <section className="mb-4">
                <h3 className="font-medium mb-1">Voice & Images</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Use the microphone button to send voice messages. Attach images with the image button (Built-in AI only) for multimodal queries.</p>
              </section>

              <section className="mb-4">
                <h3 className="font-medium mb-1">Memory & Bookmarks</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Save important messages to memory for semantic search. Use bookmarks for quick access to messages.</p>
              </section>

              <section className="mb-4">
                <h3 className="font-medium mb-1">Page & YouTube Summaries</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Use the context menu on any page or YouTube video to fetch transcripts and produce summaries.</p>
              </section>

              <div className="mt-6 text-sm text-muted-foreground">For more details, visit the project's README or explore the app — tooltips and the onboarding modal highlight key controls.</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default HelpPage
