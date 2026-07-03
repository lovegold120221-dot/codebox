import { useState } from 'react'
import {
  GitBranch, GitCommit, GitMerge, GitPullRequest,
  Plus, RefreshCw, Check, X, ChevronRight, Diff,
} from 'lucide-react'

type GitTab = 'changes' | 'commits' | 'branches' | 'pull_requests'

const MOCK_COMMITS = [
  { hash: 'a3f2c1d', message: 'Add VoiceAssistantView with Gemini Live Audio', author: 'Emil', time: '2m ago', files: 3 },
  { hash: 'b8e9a2f', message: 'Expand Sidebar with full navigation items', author: 'Emil', time: '8m ago', files: 1 },
  { hash: 'c1d4e5f', message: 'Update store with new views and agent types', author: 'Emil', time: '12m ago', files: 2 },
  { hash: 'd7f3b9a', message: 'Fix Hermes reference in package.json', author: 'Emil', time: '15m ago', files: 1 },
]

const MOCK_CHANGES = [
  { file: 'src/renderer/components/sidebar/Sidebar.tsx', status: 'M', additions: 88, deletions: 32 },
  { file: 'src/renderer/store/index.ts', status: 'M', additions: 145, deletions: 12 },
  { file: 'src/renderer/components/views/AgentsView.tsx', status: 'A', additions: 90, deletions: 0 },
  { file: 'src/renderer/components/views/VoiceAssistantView.tsx', status: 'A', additions: 182, deletions: 0 },
]

const MOCK_BRANCHES = [
  { name: 'eb/codebox-main', current: true, ahead: 4, behind: 0 },
  { name: 'eb/voice-audio', current: false, ahead: 1, behind: 2 },
  { name: 'main', current: false, ahead: 0, behind: 4 },
]

export default function GitView() {
  const [tab, setTab] = useState<GitTab>('changes')
  const [commitMsg, setCommitMsg] = useState('')
  const [staged, setStaged] = useState<string[]>([])

  const toggleStage = (file: string) => {
    setStaged((prev) => prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file])
  }

  return (
    <div className="w-full max-w-[900px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Git</h2>
          <p className="text-[13px] text-codebox-secondary mt-0.5">
            <span className="font-mono text-codebox-primary">eb/codebox-main</span> · 4 ahead, 0 behind
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-[12.5px] text-codebox-secondary bg-codebox-card border border-codebox-border px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/5">
            <RefreshCw size={13} /> Fetch
          </button>
          <button className="flex items-center gap-1.5 text-[12.5px] bg-codebox-blue text-white px-3 py-1.5 rounded-lg cursor-pointer border-none hover:bg-blue-500">
            <GitMerge size={13} /> Push
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-codebox-border">
        {([
          { id: 'changes', label: 'Changes', count: MOCK_CHANGES.length },
          { id: 'commits', label: 'Commits' },
          { id: 'branches', label: 'Branches', count: MOCK_BRANCHES.length },
          { id: 'pull_requests', label: 'Pull Requests' },
        ] as { id: GitTab; label: string; count?: number }[]).map(({ id, label, count }) => (
          <button
            key={id}
            className={`px-4 py-2 text-[13px] cursor-pointer bg-transparent border-none border-b-2 transition-all -mb-px ${
              tab === id
                ? 'border-codebox-blue text-codebox-primary font-medium'
                : 'border-transparent text-codebox-secondary hover:text-codebox-primary'
            }`}
            onClick={() => setTab(id)}
          >
            {label}
            {count !== undefined && (
              <span className="ml-1.5 text-[10px] text-codebox-muted">({count})</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'changes' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            {MOCK_CHANGES.map((change) => (
              <div
                key={change.file}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-codebox-card border border-codebox-border hover:border-codebox-secondary transition-colors cursor-pointer"
                onClick={() => toggleStage(change.file)}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 ${
                  change.status === 'M' ? 'bg-yellow-400/15 text-yellow-400' : 'bg-codebox-green/15 text-codebox-green'
                }`}>
                  {change.status}
                </div>
                <span className="flex-1 text-[12.5px] font-mono text-codebox-primary truncate">{change.file}</span>
                <div className="flex items-center gap-2 text-[11px] flex-shrink-0">
                  <span className="text-codebox-green">+{change.additions}</span>
                  <span className="text-codebox-red">-{change.deletions}</span>
                  <button className="p-1 rounded hover:bg-white/10 bg-transparent border-none cursor-pointer text-codebox-muted hover:text-codebox-primary">
                    <Diff size={13} />
                  </button>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  staged.includes(change.file) ? 'bg-codebox-blue border-codebox-blue' : 'border-codebox-border'
                }`}>
                  {staged.includes(change.file) && <Check size={10} className="text-white" />}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex flex-col gap-3">
            <div className="text-[12px] font-medium text-codebox-primary">Commit Message</div>
            <textarea
              className="w-full bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg text-[13px] outline-none resize-none focus:border-codebox-secondary placeholder:text-codebox-muted font-mono"
              placeholder="feat: describe your changes..."
              rows={3}
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <button className="text-[12px] text-codebox-blue cursor-pointer bg-transparent border-none hover:underline">
                ✨ Generate with AI
              </button>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-[12.5px] text-codebox-secondary border border-codebox-border rounded-lg cursor-pointer bg-transparent hover:bg-white/5">
                  Stage all
                </button>
                <button
                  className="px-3.5 py-1.5 text-[12.5px] bg-codebox-green text-white rounded-lg cursor-pointer border-none font-medium hover:bg-green-500 disabled:opacity-40"
                  disabled={!commitMsg.trim()}
                >
                  <GitCommit size={13} className="inline mr-1" />
                  Commit ({staged.length}/{MOCK_CHANGES.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'commits' && (
        <div className="flex flex-col gap-2">
          {MOCK_COMMITS.map((commit) => (
            <div key={commit.hash} className="bg-codebox-card border border-codebox-border rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-codebox-secondary transition-colors">
              <GitCommit size={16} className="text-codebox-blue flex-shrink-0" strokeWidth={1.8} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-codebox-primary truncate">{commit.message}</div>
                <div className="flex items-center gap-3 mt-0.5 text-[11.5px] text-codebox-secondary">
                  <span className="font-mono text-codebox-muted">{commit.hash}</span>
                  <span>{commit.author}</span>
                  <span>{commit.time}</span>
                  <span>{commit.files} file{commit.files !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'branches' && (
        <div className="flex flex-col gap-2">
          {MOCK_BRANCHES.map((branch) => (
            <div key={branch.name} className={`bg-codebox-card border rounded-xl px-4 py-3.5 flex items-center gap-3 ${branch.current ? 'border-codebox-blue' : 'border-codebox-border hover:border-codebox-secondary'} transition-colors`}>
              <GitBranch size={15} className={branch.current ? 'text-codebox-blue' : 'text-codebox-secondary'} strokeWidth={1.8} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-codebox-primary">{branch.name}</span>
                  {branch.current && <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-codebox-blue/15 text-codebox-blue">current</span>}
                </div>
                <div className="text-[11.5px] text-codebox-secondary mt-0.5">
                  {branch.ahead > 0 && <span className="text-codebox-green mr-2">↑{branch.ahead} ahead</span>}
                  {branch.behind > 0 && <span className="text-codebox-red">↓{branch.behind} behind</span>}
                  {branch.ahead === 0 && branch.behind === 0 && <span>Up to date</span>}
                </div>
              </div>
              {!branch.current && (
                <button className="text-[12px] text-codebox-secondary border border-codebox-border px-2.5 py-1 rounded-lg cursor-pointer bg-transparent hover:border-codebox-secondary">
                  Checkout
                </button>
              )}
            </div>
          ))}
          <button className="flex items-center gap-2 text-[13px] text-codebox-secondary hover:text-codebox-primary cursor-pointer bg-transparent border-none mt-1">
            <Plus size={14} /> New branch
          </button>
        </div>
      )}

      {tab === 'pull_requests' && (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <GitPullRequest size={36} className="text-codebox-border" strokeWidth={1.5} />
          <div className="text-codebox-muted text-sm">No open pull requests.</div>
          <button className="text-codebox-blue text-[13px] cursor-pointer bg-transparent border-none hover:underline">
            Create pull request
          </button>
        </div>
      )}
    </div>
  )
}
