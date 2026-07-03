import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import {
  Search, FileCode, MessageSquare, BookOpen, Brain,
  Clock, ChevronRight, Hash,
} from 'lucide-react'

type SearchCategory = 'all' | 'sessions' | 'files' | 'prompts' | 'memory'

interface SearchResult {
  id: string
  type: 'session' | 'file' | 'prompt' | 'memory'
  title: string
  preview: string
  meta?: string
}

const MOCK_RESULTS: SearchResult[] = [
  { id: 'r1', type: 'session', title: 'Fix authentication bug in AuthPage', preview: 'I found the issue — the Firebase initialization is async but not awaited before...', meta: '2m ago' },
  { id: 'r2', type: 'file', title: 'src/renderer/components/auth/AuthPage.tsx', preview: 'export default function AuthPage({ onAuthenticated }: {...})', meta: '145 lines' },
  { id: 'r3', type: 'prompt', title: 'Fix the bug', preview: 'Find and fix the bug in this code. Explain what was wrong:', meta: 'Debugging' },
  { id: 'r4', type: 'memory', title: 'Prefer functional React components', preview: 'User prefers functional components with hooks over class components.', meta: 'Preference' },
  { id: 'r5', type: 'session', title: 'Add Gemini Live Audio voice pipeline', preview: 'Here is the implementation of the WebSocket connection to Gemini Live...', meta: '1h ago' },
  { id: 'r6', type: 'file', title: 'src/renderer/store/index.ts', preview: 'export const useStore = create<AppState>((set, get) => ({', meta: '280 lines' },
]

const TYPE_ICONS: Record<SearchResult['type'], React.ElementType> = {
  session: MessageSquare,
  file: FileCode,
  prompt: BookOpen,
  memory: Brain,
}

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  session: 'Session',
  file: 'File',
  prompt: 'Prompt',
  memory: 'Memory',
}

const TYPE_COLORS: Record<SearchResult['type'], string> = {
  session: 'text-codebox-blue bg-codebox-blue/10',
  file: 'text-codebox-purple bg-codebox-purple/10',
  prompt: 'text-codebox-green bg-codebox-green/10',
  memory: 'text-orange-400 bg-orange-400/10',
}

export default function SearchView() {
  const { threads, prompts, setActiveThread, setActiveView } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SearchCategory>('all')

  const CATEGORY_TYPE: Record<Exclude<SearchCategory, 'all'>, SearchResult['type']> = {
    sessions: 'session',
    files: 'file',
    prompts: 'prompt',
    memory: 'memory',
  }

  const results = query.trim().length > 0
    ? MOCK_RESULTS.filter((r) => {
        const matchQuery = r.title.toLowerCase().includes(query.toLowerCase()) || r.preview.toLowerCase().includes(query.toLowerCase())
        const matchCat = category === 'all' || r.type === CATEGORY_TYPE[category]
        return matchQuery && matchCat
      })
    : []

  const recentSearches = ['voice audio', 'firebase auth', 'tailwind config', 'prisma schema']

  return (
    <div className="w-full max-w-[860px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Search</h2>
        <p className="text-[13px] text-codebox-secondary mt-0.5">Search across sessions, files, prompts, and memory</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-codebox-secondary" />
        <input
          className="w-full bg-codebox-input border border-codebox-border text-codebox-primary pl-11 pr-4 py-3.5 rounded-xl text-[14px] outline-none focus:border-codebox-secondary placeholder:text-codebox-muted transition-colors"
          placeholder="Search everything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-codebox-muted hover:text-codebox-primary cursor-pointer bg-transparent border-none text-[12px]"
            onClick={() => setQuery('')}
          >
            Clear
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2">
        {(['all', 'sessions', 'files', 'prompts', 'memory'] as SearchCategory[]).map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer border transition-all capitalize ${
              category === cat
                ? 'bg-codebox-input border-codebox-border text-codebox-primary'
                : 'border-transparent text-codebox-secondary hover:text-codebox-primary bg-transparent'
            }`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {query.trim().length === 0 ? (
        <div className="flex flex-col gap-5">
          {/* Recent searches */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-medium text-codebox-muted uppercase tracking-wider px-1">Recent Searches</div>
            {recentSearches.map((s) => (
              <button
                key={s}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-codebox-card border border-codebox-border text-left cursor-pointer hover:border-codebox-secondary transition-colors w-full"
                onClick={() => setQuery(s)}
              >
                <Clock size={14} className="text-codebox-muted flex-shrink-0" />
                <span className="text-[13px] text-codebox-secondary flex-1">{s}</span>
                <ChevronRight size={13} className="text-codebox-muted" />
              </button>
            ))}
          </div>

          {/* Quick access */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-medium text-codebox-muted uppercase tracking-wider px-1">Quick Access</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: MessageSquare, label: `${threads.length} sessions`, color: 'text-codebox-blue', onClick: () => setActiveView('history') },
                { icon: BookOpen, label: `${prompts.length} prompts`, color: 'text-codebox-green', onClick: () => setActiveView('prompts') },
                { icon: Brain, label: 'Memory', color: 'text-orange-400', onClick: () => setActiveView('memory') },
                { icon: Hash, label: 'Command palette', color: 'text-codebox-purple', onClick: () => {} },
              ].map(({ icon: Icon, label, color, onClick }) => (
                <button
                  key={label}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-codebox-card border border-codebox-border cursor-pointer hover:border-codebox-secondary transition-colors w-full text-left"
                  onClick={onClick}
                >
                  <Icon size={16} className={`${color} flex-shrink-0`} strokeWidth={1.8} />
                  <span className="text-[13px] text-codebox-secondary">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 text-codebox-muted text-sm">
          No results for "{query}"
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="text-[12px] text-codebox-muted px-1 mb-1">{results.length} result{results.length !== 1 ? 's' : ''}</div>
          {results.map((result) => {
            const Icon = TYPE_ICONS[result.type]
            const colorClass = TYPE_COLORS[result.type]
            return (
              <div
                key={result.id}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-codebox-card border border-codebox-border cursor-pointer hover:border-codebox-secondary transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon size={15} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-codebox-primary truncate">{result.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colorClass} flex-shrink-0`}>{TYPE_LABELS[result.type]}</span>
                  </div>
                  <p className="text-[12px] text-codebox-secondary mt-0.5 truncate">{result.preview}</p>
                </div>
                <div className="text-[11px] text-codebox-muted flex-shrink-0">{result.meta}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
