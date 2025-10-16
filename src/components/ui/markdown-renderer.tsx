import React, { useEffect, useRef } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import hljs from "highlight.js/lib/core"
import javascript from "highlight.js/lib/languages/javascript"
import typescript from "highlight.js/lib/languages/typescript"
import python from "highlight.js/lib/languages/python"
import bash from "highlight.js/lib/languages/bash"
import json from "highlight.js/lib/languages/json"
import "highlight.js/styles/github-dark.css"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/ui/copy-button"

// Register only commonly used languages
hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("python", python)
hljs.registerLanguage("bash", bash)
hljs.registerLanguage("json", json)

interface MarkdownRendererProps {
  children: string
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <div className="space-y-3">
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </Markdown>
    </div>
  )
}

interface HighlightedPreProps extends React.HTMLAttributes<HTMLPreElement> {
  children: string
  language: string
}

const HighlightedPre = ({ children, language, ...props }: HighlightedPreProps) => {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      delete codeRef.current.dataset.highlighted
      hljs.highlightElement(codeRef.current)
    }
  }, [children, language])

  return (
    <pre {...props}>
      <code ref={codeRef} className={`language-${language}`}>
        {children}
      </code>
    </pre>
  )
}

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
  className?: string
  language: string
}

const CodeBlock = ({
  children,
  className,
  language,
}: CodeBlockProps) => {
  const code =
    typeof children === "string"
      ? children
      : childrenTakeAllStringContents(children)

  const preClass = cn(
    "overflow-x-auto rounded-md border bg-background/50 p-4 font-mono text-sm",
    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden", // Hide scrollbar in all browsers
    className
  )

  return (
    <div className="group/code relative mb-4">
      <HighlightedPre language={language} className={preClass}>
        {code}
      </HighlightedPre>

      <div className="invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
        <CopyButton content={code} copyMessage="Copied code to clipboard" />
      </div>
    </div>
  )
}

function childrenTakeAllStringContents(element: React.ReactNode): string {
  if (typeof element === "string") {
    return element
  }

  if (element && typeof element === "object" && "props" in element) {
    const reactElement = element as React.ReactElement<{children: React.ReactNode}>
    const children = reactElement.props.children

    if (Array.isArray(children)) {
      return children
        .map((child) => childrenTakeAllStringContents(child))
        .join("")
    } else {
      return childrenTakeAllStringContents(children)
    }
  }

  return ""
}

const COMPONENTS = {
  h1: withClass("h1", "text-2xl font-semibold"),
  h2: withClass("h2", "font-semibold text-xl"),
  h3: withClass("h3", "font-semibold text-lg"),
  h4: withClass("h4", "font-semibold text-base"),
  h5: withClass("h5", "font-medium"),
  strong: withClass("strong", "font-semibold"),
  a: withClass("a", "text-primary underline underline-offset-2"),
  blockquote: withClass("blockquote", "border-l-2 border-primary pl-4"),
  code: ({ children, className, ...rest }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
    const match = /language-(\w+)/.exec(className || "")
    return match ? (
      <CodeBlock className={className} language={match[1] || "text"}>
        {children}
      </CodeBlock>
    ) : (
      <code
        className={cn(
          "font-mono [:not(pre)>&]:rounded-md [:not(pre)>&]:bg-background/50 [:not(pre)>&]:px-1 [:not(pre)>&]:py-0.5"
        )}
        {...rest}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => children,
  ol: withClass("ol", "list-decimal space-y-2 pl-6"),
  ul: withClass("ul", "list-disc space-y-2 pl-6"),
  li: withClass("li", "my-1.5"),
  table: withClass(
    "table",
    "w-full border-collapse overflow-y-auto rounded-md border border-foreground/20"
  ),
  th: withClass(
    "th",
    "border border-foreground/20 px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  td: withClass(
    "td",
    "border border-foreground/20 px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  tr: withClass("tr", "m-0 border-t p-0 even:bg-muted"),
  p: withClass("p", "whitespace-pre-wrap"),
  hr: withClass("hr", "border-foreground/20"),
}

type IntrinsicElement = keyof React.JSX.IntrinsicElements

function withClass(Tag: IntrinsicElement, classes: string) {
  const Component = (props: React.HTMLAttributes<HTMLElement>) => {
    const TagComponent = Tag as React.ElementType
    return <TagComponent className={classes} {...props} />
  }
  Component.displayName = Tag
  return Component
}

export default MarkdownRenderer
