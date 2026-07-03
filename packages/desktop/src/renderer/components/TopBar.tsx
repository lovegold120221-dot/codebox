import { useStore } from '@/store'
import { PanelLeft, Sun, Moon, Search, Command } from 'lucide-react'
import ConnectionStatus from './ConnectionStatus'
import CommandPalette from './CommandPalette'

const VIEW_TITLES: Record<string, string> = {
  'new-thread': 'New Session',
  chat: '',
  automations: 'Automations',
  skills: 'Skills & Capabilities',
  settings: 'Preferences',
  memory: 'Memory & Profile',
  projects: 'Projects',
  agents: 'Eburon Agents',
  voice: 'Voice Assistant',
  tasks: 'Tasks',
  workspace: 'Workspace',
  plugins: 'Plugin Store',
  prompts: 'Prompt Library',
  history: 'Session History',
  git: 'Git',
  search: 'Search',
}

export default function TopBar() {
  const { toggleSidebar, theme, toggleTheme, activeView, threads, activeThreadId, setCommandPaletteOpen } = useStore()
  const activeThread = threads.find((t) => t.id === activeThreadId)

  const title = activeView === 'chat' && activeThread
    ? activeThread.title
    : VIEW_TITLES[activeView] || 'Eburon CodeBox'

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-transparent flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <button
          className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1.5 rounded-md flex items-center justify-center hover:bg-white/5 hover:text-codebox-primary transition-colors"
          onClick={toggleSidebar}
          title="Toggle Sidebar (⌘\)"
        >
          <PanelLeft size={17} strokeWidth={1.8} />
        </button>
        <span className="text-[13.5px] font-medium text-codebox-primary truncate max-w-[300px]">{title}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <ConnectionStatus />

        {/* Search button */}
        <button
          className="flex items-center gap-2 bg-codebox-input border border-codebox-border text-codebox-muted px-2.5 py-1 rounded-lg text-[12px] hover:border-codebox-secondary hover:text-codebox-secondary transition-colors cursor-pointer"
          onClick={() => setCommandPaletteOpen(true)}
          title="Search (⌘K)"
        >
          <Search size={12} />
          <span>Search</span>
          <kbd className="text-[10px] px-1 py-0.5 rounded bg-codebox-bg border border-codebox-border font-mono">⌘K</kbd>
        </button>

        <CommandPalette />

        <button
          className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1.5 rounded-md flex items-center justify-center hover:bg-white/5 hover:text-codebox-primary transition-colors"
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
        </button>
      </div>
    </header>
  )
}
