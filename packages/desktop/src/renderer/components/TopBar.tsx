import { useStore } from '@/store'
import { PanelLeft, Split, Sun, Moon } from 'lucide-react'
import ConnectionStatus from './ConnectionStatus'
import CommandPalette from './CommandPalette'

export default function TopBar() {
  const { toggleSidebar, theme, toggleTheme, activeView, threads, activeThreadId } = useStore()
  const activeThread = threads.find((t) => t.id === activeThreadId)

  const titles: Record<string, string> = {
    'new-thread': 'New thread',
    chat: '',
    automations: 'Automations',
    skills: 'Skills & Capabilities',
    settings: 'Preferences',
    memory: 'Memory & Profile',
  }

  const title = activeView === 'chat' && activeThread
    ? activeThread.title
    : titles[activeView] || 'New thread'

  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-transparent flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1.5 rounded-md flex items-center justify-center hover:bg-white/5 hover:text-codebox-primary"
          onClick={toggleSidebar}
          title="Toggle Sidebar"
        >
          <PanelLeft size={18} strokeWidth={1.8} />
        </button>
        <span className="text-[13.5px] font-medium text-codebox-primary">{title}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ConnectionStatus />
        <CommandPalette />
        <button
          className="bg-codebox-input border border-codebox-border text-codebox-primary w-7 h-7 rounded-full cursor-pointer flex items-center justify-center hover:bg-white/5 hover:border-codebox-secondary"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'dark' ? <Sun size={13} strokeWidth={2} /> : <Moon size={13} strokeWidth={2} />}
        </button>
        <button
          className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1.5 rounded-md flex items-center justify-center hover:bg-white/5 hover:text-codebox-primary"
          title="Split Editor"
        >
          <Split size={16} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}
