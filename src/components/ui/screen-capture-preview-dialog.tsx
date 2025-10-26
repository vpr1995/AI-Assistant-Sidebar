/**
 * Screen Capture Preview Dialog Component
 * Shows captured image with options to send, retake, or cancel
 */

import { CaptureResult } from '@/lib/screen-capture-utils';
import { Button } from './button';
import { X, RotateCcw, Send } from 'lucide-react';

export interface ScreenCapturePreviewDialogProps {
  isOpen: boolean;
  capturedImage: CaptureResult | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onRetake: () => void;
  onCancel: () => void;
}

/**
 * Dialog component displaying captured screen with preview and action buttons
 */
export function ScreenCapturePreviewDialog({
  isOpen,
  capturedImage,
  isLoading = false,
  onConfirm,
  onRetake,
  onCancel,
}: ScreenCapturePreviewDialogProps) {
  if (!isOpen || !capturedImage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[90vh] max-w-[90vw] flex-col rounded-lg bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Screen Capture Preview</h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Preview */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-2">
            {/* Image Container */}
            <div className="max-h-[50vh] flex items-center justify-center overflow-auto rounded-md border border-border bg-muted p-2">
              <img
                src={capturedImage.imageData}
                alt="Screen capture preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Image Info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Dimensions: {capturedImage.width}×{capturedImage.height}px
              </span>
              <span>{capturedImage.mimeType}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
            className="flex-1"
          >
            <X size={16} />
            Cancel
          </Button>

          <Button
            onClick={onRetake}
            variant="ghost"
            disabled={isLoading}
            className="flex-1"
          >
            <RotateCcw size={16} />
            Retake
          </Button>

          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            <Send size={16} />
            {isLoading ? 'Sending...' : 'Send to AI'}
          </Button>
        </div>
      </div>
    </div>
  );
}
