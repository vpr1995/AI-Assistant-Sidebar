/**
 * Rewrite Utilities - Tone-based text rewriting prompts and helpers
 */

export type RewriteTone =
  | 'concise'
  | 'professional'
  | 'casual'
  | 'formal'
  | 'engaging'
  | 'simplified'
  | 'technical'
  | 'creative';

export interface RewriteOption {
  id: RewriteTone;
  label: string;
  description: string;
}

export const REWRITE_TONES: RewriteOption[] = [
  {
    id: 'concise',
    label: 'Concise',
    description: 'Shorter and more direct',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Formal business language',
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Friendly and conversational',
  },
  {
    id: 'formal',
    label: 'Formal',
    description: 'Official and structured',
  },
  {
    id: 'engaging',
    label: 'Engaging',
    description: 'Captivating and attention-grabbing',
  },
  {
    id: 'simplified',
    label: 'Simplified',
    description: 'Easy to understand plain language',
  },
  {
    id: 'technical',
    label: 'Technical',
    description: 'More technical and detailed',
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Creative and imaginative',
  },
];

/**
 * Get the rewrite prompt based on the tone
 */
export function getRewritePrompt(originalText: string, tone: RewriteTone): string {
  const tonePrompts: Record<RewriteTone, string> = {
    concise: `Rewrite the following text to be more concise and direct, removing unnecessary words while maintaining the core meaning:

"${originalText}"

Provide only the rewritten text, without any explanation.`,

    professional: `Rewrite the following text in a formal, professional tone suitable for business communication:

"${originalText}"

Provide only the rewritten text, without any explanation.`,

    casual: `Rewrite the following text in a friendly, casual, conversational tone:

"${originalText}"

Provide only the rewritten text, without any explanation.`,

    formal: `Rewrite the following text in an official, structured, formal tone:

"${originalText}"

Provide only the rewritten text, without any explanation.`,

    engaging: `Rewrite the following text to be more captivating and attention-grabbing while maintaining accuracy:

"${originalText}"

Provide only the rewritten text, without any explanation.`,

    simplified: `Rewrite the following text in plain, simple language that's easy to understand. Avoid jargon and complex terms:

"${originalText}"

Provide only the rewritten text, without any explanation.`,

    technical: `Rewrite the following text with more technical depth and detail. Add technical terminology and explanations where appropriate:

"${originalText}"

Provide only the rewritten text, without any explanation.`,

    creative: `Rewrite the following text in a more creative and imaginative way while preserving the main ideas:

"${originalText}"

Provide only the rewritten text, without any explanation.`,
  };

  return tonePrompts[tone];
}

/**
 * Get tone label from tone ID
 */
export function getToneLabel(tone: RewriteTone): string {
  const toneOption = REWRITE_TONES.find((t) => t.id === tone);
  return toneOption?.label || tone;
}

/**
 * Format the user message for rewritten text
 */
export function formatRewriteUserMessage(originalText: string, tone: RewriteTone): string {
  const toneLabel = getToneLabel(tone);
  // Truncate long text for display
  const displayText = originalText.length > 100 ? `${originalText.substring(0, 100)}...` : originalText;
  return `Rewrite: **${toneLabel}**\n\n"${displayText}"`;
}
