import { useStore } from '@/store'
import { Box, Loader2, Wrench, FileCode, Copy, Check } from 'lucide-react'
import { useState, useCallback } from 'react'

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  return (
    <div className="bg-codebox-code border border-codebox-border rounded-lg overflow-hidden mt-3 font-mono text-[12.5px]">
      <div className="bg-black/5 px-3 py-2 border-b border-codebox-border flex justify-between items-center text-codebox-secondary text-[11px]">
        <div className="flex items-center gap-2">
          <FileCode size={12} />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="bg-transparent border-none text-codebox-secondary cursor-pointer text-[11px] hover:text-codebox-primary flex items-center gap-1 transition-colors"
        >
          {copied ? (
            <><Check size={14} className="text-codebox-green" /><span>Copied!</span></>
          ) : (
            <><Copy size={14} /><span>Copy</span></>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-codebox-primary leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code blocks
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push(<CodeBlock key={`code-${i}`} code={codeLines.join('\n')} language={lang || undefined} />)
      i++
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={i} className="text-base font-semibold text-codebox-primary mt-4 mb-1.5">{inlineMarkdown(line.slice(4))}</h3>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={i} className="text-[15px] font-semibold text-codebox-primary mt-4 mb-1.5">{inlineMarkdown(line.slice(3))}</h2>)
      i++; continue
    }
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={i} className="text-[17px] font-semibold text-codebox-primary mt-4 mb-2">{inlineMarkdown(line.slice(2))}</h1>)
      i++; continue
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      nodes.push(<hr key={i} className="border-codebox-border my-4" />)
      i++; continue
    }

    // Unordered list
    if (line.match(/^[-*+] /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*+] /)) {
        items.push(lines[i].slice(2))
        i++
      }
      nodes.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 mt-1.5 mb-1.5 flex flex-col gap-0.5">
          {items.map((item, j) => <li key={j} className="text-codebox-primary">{inlineMarkdown(item)}</li>)}
        </ul>,
      )
      continue
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      nodes.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 mt-1.5 mb-1.5 flex flex-col gap-0.5">
          {items.map((item, j) => <li key={j} className="text-codebox-primary">{inlineMarkdown(item)}</li>)}
        </ol>,
      )
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const lines2: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        lines2.push(lines[i].slice(2))
        i++
      }
      nodes.push(
        <blockquote key={`bq-${i}`} className="border-l-2 border-codebox-blue pl-3 py-0.5 text-codebox-secondary italic my-2">
          {lines2.map((l, j) => <span key={j}>{inlineMarkdown(l)}</span>)}
        </blockquote>,
      )
      continue
    }

    // Empty line
    if (line.trim() === '') {
      if (nodes.length > 0) {
        nodes.push(<div key={`sp-${i}`} className="h-1.5" />)
      }
      i++; continue
    }

    // Regular paragraph
    nodes.push(<p key={i} className="text-codebox-primary leading-relaxed">{inlineMarkdown(line)}</p>)
    i++
  }

  return nodes
}

function inlineMarkdown(text: string): React.ReactNode {
  // Note: keep the inner link groups non-capturing (?:...). A capturing group
  // inside a split() regex splices its captures (and `undefined` for
  // non-participating groups) into the result array, which both duplicates the
  // link text and inserts `undefined` holes that crash the map below.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-codebox-primary">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} className="bg-codebox-code border border-codebox-border px-1.5 py-0.5 rounded text-[11.5px] font-mono text-codebox-primary">{part.slice(1, -1)}</code>
    }
    if (part.startsWith('[')) {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (match) {
        return <span key={i} className="text-codebox-blue hover:underline cursor-pointer">{match[1]}</span>
      }
    }
    return part
  })
}

export function MessageList() {
  const { activeThreadId, messages, isStreaming } = useStore()
  const threadMessages = activeThreadId ? messages[activeThreadId] || [] : []

  if (threadMessages.length === 0) return null

  return (
    <div className="w-full max-w-[760px] flex flex-col gap-6 pt-5 mt-auto mb-auto">
      {threadMessages.map((msg, i) => {
        const isLast = i === threadMessages.length - 1
        const isStreamingLast = isLast && isStreaming && msg.role === 'assistant'

        return (
          <div
            key={msg.id}
            className={`flex flex-col gap-2 leading-relaxed text-sm user-select-text ${
              msg.role === 'user'
                ? 'self-end bg-codebox-input border border-codebox-border px-4 py-2.5 rounded-xl max-w-[80%] text-codebox-primary'
                : 'self-start w-full text-codebox-primary'
            }`}
          >
            {/* Assistant header */}
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 text-xs text-codebox-secondary font-medium">
                <Box size={14} className="text-codebox-purple" strokeWidth={1.8} />
                <span>Eburon</span>
                {isStreamingLast && <Loader2 size={12} className="animate-spin text-codebox-purple" />}
              </div>
            )}

            {/* Reasoning block */}
            {msg.reasoning && (
              <div className="text-xs text-codebox-muted italic border-l-2 border-codebox-border pl-3 py-1">
                {msg.reasoning}
              </div>
            )}

            {/* Tool calls */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {msg.toolCalls.map((tc, j) => (
                  <div key={j} className="bg-codebox-card border border-codebox-border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-codebox-input border-b border-codebox-border text-[11px] text-codebox-secondary">
                      <Wrench size={12} className="text-codebox-purple" />
                      <span className="font-medium">{tc.name}</span>
                      <span className="text-codebox-muted font-mono text-[10px] truncate max-w-[300px]">{tc.args}</span>
                      {!tc.result && <Loader2 size={10} className="animate-spin text-codebox-purple ml-auto" />}
                    </div>
                    {tc.result && (
                      <pre className="p-3 text-[11px] text-codebox-secondary font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                        {tc.result}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message content — markdown rendered for assistant, plain for user */}
            {msg.role === 'assistant' ? (
              <div className="flex flex-col gap-1">
                {renderMarkdown(msg.content)}
                {isStreamingLast && msg.content === '' && (
                  <div className="flex gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-codebox-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-codebox-purple animate-bounce" style={{ animationDelay: '100ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-codebox-purple animate-bounce" style={{ animationDelay: '200ms' }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
