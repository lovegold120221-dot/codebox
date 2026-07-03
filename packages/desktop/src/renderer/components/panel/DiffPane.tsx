import { useStore } from '@/store'
import { useState } from 'react'
import { showToast } from '@/components/Toast'
import {
  X, GitCommit, Check, Undo2, SplitSquareHorizontal,
  AlignLeft, ChevronDown, ChevronRight,
} from 'lucide-react'

interface DiffLine {
  type: 'add' | 'remove' | 'context'
  text: string
}

interface DiffHunk {
  file: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

const SAMPLE_HUNKS: DiffHunk[] = [
  {
    file: 'src/lib/engine.ts',
    additions: 8,
    deletions: 0,
    lines: [
      { type: 'context', text: "import type { Session } from './types'" },
      { type: 'context', text: '' },
      { type: 'add', text: "import { getSkillManager } from './skills'" },
      { type: 'add', text: "import { getMemoryStore } from './memory'" },
      { type: 'add', text: '' },
      { type: 'context', text: 'export class CodeboxAgent {' },
      { type: 'context', text: '  private session: Session | null = null' },
      { type: 'add', text: '  private skills = getSkillManager()' },
      { type: 'add', text: '  private memory = getMemoryStore()' },
      { type: 'add', text: '' },
      { type: 'add', text: '  async process(prompt: string) {' },
      { type: 'add', text: '    const ctx = this.memory.search(prompt).slice(0, 3)' },
      { type: 'add', text: '    return this.engine.prompt(prompt)' },
      { type: 'add', text: '  }' },
      { type: 'context', text: '' },
      { type: 'context', text: '  async createSession(title?: string) {' },
    ],
  },
]

export default function DiffPane() {
  const { isDiffOpen, toggleDiff, diffContent } = useStore()
  const [viewMode, setViewMode] = useState<'inline' | 'side-by-side'>('inline')
  const [hunks, setHunks] = useState<DiffHunk[]>(diffContent ? [] : SAMPLE_HUNKS)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(SAMPLE_HUNKS.map((h) => h.file)))
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [rejected, setRejected] = useState<Set<string>>(new Set())

  if (!isDiffOpen) {
    return (
      <button
        className="fixed right-4 top-14 bg-codebox-card border border-codebox-border text-codebox-secondary px-3 py-1.5 rounded-md text-xs cursor-pointer hover:text-codebox-primary hover:bg-white/5 z-20"
        onClick={toggleDiff}
      >
        Show Diff
      </button>
    )
  }

  const toggleExpand = (file: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(file) ? next.delete(file) : next.add(file)
      return next
    })
  }

  const handleApprove = (file: string) => {
    setApplied((prev) => new Set(prev).add(file))
    setRejected((prev) => { const n = new Set(prev); n.delete(file); return n })
    showToast(`Applied changes to ${file}`)
  }

  const handleReject = (file: string) => {
    setRejected((prev) => new Set(prev).add(file))
    setApplied((prev) => { const n = new Set(prev); n.delete(file); return n })
    showToast(`Rejected changes to ${file}`)
  }

  const handleRollback = (file: string) => {
    setApplied((prev) => { const n = new Set(prev); n.delete(file); return n })
    setRejected((prev) => { const n = new Set(prev); n.delete(file); return n })
    showToast(`Rolled back ${file}`)
  }

  const handleApproveAll = () => {
    setApplied(new Set(hunks.map((h) => h.file)))
    setRejected(new Set())
    showToast(`Applied ${hunks.length} file${hunks.length !== 1 ? 's' : ''}`)
  }

  return (
    <div className="fixed right-0 top-12 bottom-[120px] w-[460px] bg-codebox-sidebar border-l border-codebox-border flex flex-col z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-codebox-border flex-shrink-0">
        <div className="flex items-center gap-2 text-codebox-primary text-[13px] font-medium">
          <GitCommit size={14} />
          <span>Changes</span>
          {hunks.length > 0 && (
            <span className="text-[10.5px] text-codebox-muted font-normal">
              {hunks.length} file{hunks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`p-1.5 rounded-md border-none cursor-pointer ${viewMode === 'inline' ? 'bg-white/10 text-codebox-primary' : 'text-codebox-muted hover:text-codebox-primary bg-transparent'}`}
            title="Inline view"
            onClick={() => setViewMode('inline')}
          >
            <AlignLeft size={14} />
          </button>
          <button
            className={`p-1.5 rounded-md border-none cursor-pointer ${viewMode === 'side-by-side' ? 'bg-white/10 text-codebox-primary' : 'text-codebox-muted hover:text-codebox-primary bg-transparent'}`}
            title="Side by side"
            onClick={() => setViewMode('side-by-side')}
          >
            <SplitSquareHorizontal size={14} />
          </button>
          <button
            className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1 rounded hover:bg-white/5 hover:text-codebox-primary ml-1"
            onClick={toggleDiff}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {hunks.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-codebox-border flex-shrink-0 bg-codebox-card/40">
          <span className="text-[11px] text-codebox-secondary">
            {applied.size} applied · {rejected.size} rejected · {hunks.length - applied.size - rejected.size} pending
          </span>
          <button
            className="text-[11.5px] text-codebox-green hover:underline cursor-pointer bg-transparent border-none font-medium"
            onClick={handleApproveAll}
          >
            Approve all
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {diffContent ? (
          <pre className="p-4 text-codebox-primary whitespace-pre-wrap font-mono text-xs leading-relaxed">{diffContent}</pre>
        ) : hunks.length === 0 ? (
          <div className="text-codebox-muted text-center py-16 px-4 text-sm">
            No changes yet. Send a prompt to see the diff.
          </div>
        ) : (
          <div className="flex flex-col">
            {hunks.map((hunk) => {
              const isExpanded = expanded.has(hunk.file)
              const isApplied = applied.has(hunk.file)
              const isRejected = rejected.has(hunk.file)

              return (
                <div key={hunk.file} className="border-b border-codebox-border">
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-codebox-card/50 hover:bg-codebox-card cursor-pointer border-none text-left"
                    onClick={() => toggleExpand(hunk.file)}
                  >
                    {isExpanded ? <ChevronDown size={13} className="text-codebox-muted flex-shrink-0" /> : <ChevronRight size={13} className="text-codebox-muted flex-shrink-0" />}
                    <span className="text-[12px] font-mono text-codebox-primary flex-1 truncate">{hunk.file}</span>
                    <span className="text-[10.5px] text-codebox-green">+{hunk.additions}</span>
                    <span className="text-[10.5px] text-codebox-red">−{hunk.deletions}</span>
                    {isApplied && <Check size={13} className="text-codebox-green flex-shrink-0" />}
                    {isRejected && <X size={13} className="text-codebox-red flex-shrink-0" />}
                  </button>

                  {isExpanded && (
                    <>
                      <div className={`font-mono text-[11.5px] leading-relaxed py-1 ${isRejected ? 'opacity-40' : ''}`}>
                        {viewMode === 'inline' ? (
                          hunk.lines.map((line, i) => (
                            <div
                              key={i}
                              className={`px-4 py-0.5 whitespace-pre ${
                                line.type === 'add' ? 'bg-codebox-green/10 text-codebox-green'
                                : line.type === 'remove' ? 'bg-red-500/10 text-codebox-red'
                                : 'text-codebox-secondary'
                              }`}
                            >
                              <span className="select-none opacity-50 mr-2">
                                {line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}
                              </span>
                              {line.text || ' '}
                            </div>
                          ))
                        ) : (
                          <div className="grid grid-cols-2 gap-px bg-codebox-border">
                            <div className="bg-codebox-sidebar">
                              {hunk.lines.filter((l) => l.type !== 'add').map((line, i) => (
                                <div key={i} className={`px-3 py-0.5 whitespace-pre ${line.type === 'remove' ? 'bg-red-500/10 text-codebox-red' : 'text-codebox-secondary'}`}>
                                  {line.text || ' '}
                                </div>
                              ))}
                            </div>
                            <div className="bg-codebox-sidebar">
                              {hunk.lines.filter((l) => l.type !== 'remove').map((line, i) => (
                                <div key={i} className={`px-3 py-0.5 whitespace-pre ${line.type === 'add' ? 'bg-codebox-green/10 text-codebox-green' : 'text-codebox-secondary'}`}>
                                  {line.text || ' '}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 px-4 py-2 border-t border-codebox-border/50">
                        {isApplied || isRejected ? (
                          <button
                            className="flex items-center gap-1.5 text-[11.5px] text-codebox-secondary hover:text-codebox-primary cursor-pointer bg-transparent border-none"
                            onClick={() => handleRollback(hunk.file)}
                          >
                            <Undo2 size={12} /> Rollback
                          </button>
                        ) : (
                          <>
                            <button
                              className="flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-md bg-codebox-green/15 text-codebox-green hover:bg-codebox-green/25 cursor-pointer border-none font-medium"
                              onClick={() => handleApprove(hunk.file)}
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              className="flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-md bg-red-500/10 text-codebox-red hover:bg-red-500/20 cursor-pointer border-none font-medium"
                              onClick={() => handleReject(hunk.file)}
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
