import { useEffect } from 'react'
import { useStore, AppState } from '@/store'
import {
  Search, FileText, Clock, Layers, Settings, Brain, Edit3, Terminal,
  FolderOpen, Bot, Mic, ListChecks, Layout, Puzzle, BookOpen, History,
  GitBranch, Sun, Moon, X,
} from 'lucide-react'

interface Command {
  id: string
  label: string
  description: string
  icon: typeof Search
  shortcut?: string
  action: (store: AppState) => void
}

const COMMANDS: Command[] = [
  { id: 'new-thread', label: 'New Session', description: 'Start a new coding session', icon: Edit3, shortcut: '⌘N', action: (s) => { s.setActiveView('new-thread'); s.setActiveThread(null) } },
  { id: 'projects', label: 'Projects', description: 'Manage workspaces and repositories', icon: FolderOpen, action: (s) => s.setActiveView('projects') },
  { id: 'agents', label: 'Agents', description: 'Configure and activate Eburon agents', icon: Bot, action: (s) => s.setActiveView('agents') },
  { id: 'voice', label: 'Voice Assistant', description: 'Open Gemini Live Audio voice interface', icon: Mic, shortcut: '⌘.', action: (s) => s.setActiveView('voice') },
  { id: 'tasks', label: 'Tasks', description: 'View and manage agent tasks', icon: ListChecks, action: (s) => s.setActiveView('tasks') },
  { id: 'workspace', label: 'Workspace', description: 'Settings, secrets, and context', icon: Layout, action: (s) => s.setActiveView('workspace') },
  { id: 'plugins', label: 'Plugin Store', description: 'Browse and install plugins', icon: Puzzle, action: (s) => s.setActiveView('plugins') },
  { id: 'prompts', label: 'Prompt Library', description: 'Saved and community prompts', icon: BookOpen, action: (s) => s.setActiveView('prompts') },
  { id: 'history', label: 'Session History', description: 'Browse past sessions', icon: History, action: (s) => s.setActiveView('history') },
  { id: 'git', label: 'Git', description: 'Commits, branches, and pull requests', icon: GitBranch, action: (s) => s.setActiveView('git') },
  { id: 'search', label: 'Search', description: 'Search sessions, files, prompts, memory', icon: Search, action: (s) => s.setActiveView('search') },
  { id: 'skills', label: 'Skills & Capabilities', description: 'Manage agent skills', icon: Layers, action: (s) => s.setActiveView('skills') },
  { id: 'automations', label: 'Automations', description: 'Scheduled background tasks', icon: Clock, action: (s) => s.setActiveView('automations') },
  { id: 'memory', label: 'Memory & Profile', description: 'Cross-session learnings and context', icon: Brain, action: (s) => s.setActiveView('memory') },
  { id: 'settings', label: 'Preferences', description: 'App settings and configuration', icon: Settings, shortcut: '⌘,', action: (s) => s.setActiveView('settings') },
  { id: 'terminal', label: 'Toggle Terminal', description: 'Show/hide integrated terminal', icon: Terminal, shortcut: '⌘`', action: (s) => s.toggleTerminal() },
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', description: 'Collapse or expand sidebar', icon: FileText, shortcut: '⌘\\', action: (s) => s.toggleSidebar() },
  { id: 'toggle-theme', label: 'Toggle Theme', description: 'Switch dark/light mode', icon: Sun, shortcut: '⌘T', action: (s) => s.toggleTheme() },
  { id: 'toggle-voice-orb', label: 'Toggle Voice Orb', description: 'Show/hide floating voice orb', icon: Mic, action: (s) => s.toggleOrb() },
]

export default function CommandPalette() {
  const store = useStore()
  const { isCommandPaletteOpen, setCommandPaletteOpen, globalSearch, setGlobalSearch } = store

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false)
        setGlobalSearch('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isCommandPaletteOpen])

  if (!isCommandPaletteOpen) return null

  const q = globalSearch.toLowerCase()
  const filtered = q
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    : COMMANDS

  const handleSelect = (cmd: Command) => {
    cmd.action(store)
    setCommandPaletteOpen(false)
    setGlobalSearch('')
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-start justify-center pt-[12vh]"
      onClick={() => { setCommandPaletteOpen(false); setGlobalSearch('') }}
    >
      <div
        className="w-[580px] max-w-[90vw] bg-codebox-sidebar border border-codebox-border rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-codebox-border">
          <Search size={16} className="text-codebox-muted flex-shrink-0" />
          <input
            className="flex-1 bg-transparent border-none outline-none text-codebox-primary text-[14px] placeholder:text-codebox-muted"
            placeholder="Search commands and views..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            autoFocus
          />
          <button
            className="bg-transparent border-none cursor-pointer p-1 rounded text-codebox-muted hover:text-codebox-primary"
            onClick={() => { setCommandPaletteOpen(false); setGlobalSearch('') }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-codebox-muted">No commands found</div>
          ) : (
            <>
              {!q && (
                <div className="px-4 py-1.5 text-[10.5px] font-medium text-codebox-muted uppercase tracking-wider">
                  Commands
                </div>
              )}
              {filtered.map((cmd) => {
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left bg-transparent border-none cursor-pointer hover:bg-white/5 transition-colors group"
                    onClick={() => handleSelect(cmd)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-codebox-input border border-codebox-border flex items-center justify-center flex-shrink-0 group-hover:border-codebox-secondary transition-colors">
                      <Icon size={15} className="text-codebox-purple" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-codebox-primary">{cmd.label}</div>
                      <div className="text-[11.5px] text-codebox-muted">{cmd.description}</div>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] text-codebox-muted bg-codebox-input border border-codebox-border px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>

        <div className="px-4 py-2 border-t border-codebox-border flex items-center gap-3 text-[11px] text-codebox-muted">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
