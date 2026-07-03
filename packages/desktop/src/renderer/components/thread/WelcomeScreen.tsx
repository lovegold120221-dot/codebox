import { useStore } from '@/store'
import ModelSelector from '@/components/composer/ModelSelector'
import { Zap, Code2, Bug, FileText, Shield, GitBranch } from 'lucide-react'

const QUICK_PROMPTS = [
  { icon: Code2, label: 'Explain this code', prompt: 'Explain what this code does, step by step:' },
  { icon: Bug, label: 'Fix the bug', prompt: 'Find and fix the bug in this code. Explain what was wrong:' },
  { icon: FileText, label: 'Write unit tests', prompt: 'Write comprehensive unit tests for this code:' },
  { icon: Shield, label: 'Security review', prompt: 'Review this code for security vulnerabilities:' },
  { icon: GitBranch, label: 'Generate commit', prompt: 'Generate a clear, conventional commit message for these changes:' },
  { icon: Zap, label: 'Refactor', prompt: 'Refactor this code to be more readable and maintainable:' },
]

export function WelcomeScreen() {
  const { addMessage, addThread, setActiveThread, setActiveView, sendPrompt } = useStore()

  const handleQuickPrompt = async (prompt: string) => {
    const threadId = `thread-${Date.now()}`
    const title = prompt.slice(0, 28) + '...'
    addThread({ id: threadId, title, mode: 'local', projectId: 'default', createdAt: Date.now() })
    setActiveThread(threadId)
    addMessage(threadId, { id: `msg-${Date.now()}`, role: 'user', content: prompt, timestamp: Date.now() })
    setActiveView('chat')
    await sendPrompt(threadId, prompt)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-5 max-w-[560px] w-full text-center">
      {/* Eburon logo */}
      <div className="flex flex-col items-center gap-2 mb-1">
        <svg className="w-12 h-12 text-codebox-blue" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M48 44H18c-6.6 0-12-5.4-12-12 0-5.8 4.2-10.7 9.8-11.8C17.4 13.5 23.8 8 31.5 8c8.5 0 15.5 6.3 16.4 14.5C53.5 23.7 58 28.3 58 34c0 5.5-4.5 10-10 10z"/>
          <path d="M25 29l5 5-5 5"/><line x1="33" y1="39" x2="41" y2="39"/>
        </svg>
        <h1 className="text-[22px] font-semibold text-codebox-primary tracking-tight">
          Eburon CodeBox
        </h1>
        <p className="text-[13.5px] text-codebox-muted max-w-[340px]">
          Your AI coding agent. Start typing, use voice, or pick a quick action below.
        </p>
      </div>

      {/* Model selector */}
      <div className="relative w-full flex justify-center">
        <ModelSelector />
      </div>

      {/* Quick actions */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
        {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-codebox-card border border-codebox-border rounded-xl text-[12.5px] text-codebox-secondary hover:text-codebox-primary hover:border-codebox-secondary cursor-pointer transition-all text-left group"
            onClick={() => handleQuickPrompt(prompt)}
          >
            <Icon size={14} className="text-codebox-blue group-hover:text-codebox-blue flex-shrink-0" strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-[11.5px] text-codebox-muted">
        Press <kbd className="px-1.5 py-0.5 rounded border border-codebox-border bg-codebox-input text-[11px] font-mono">⌘K</kbd> for command palette · <kbd className="px-1.5 py-0.5 rounded border border-codebox-border bg-codebox-input text-[11px] font-mono">⌘.</kbd> for voice
      </p>
    </div>
  )
}
