import { useStore, ActiveView, Thread } from '@/store'
import {
  Edit3, Clock, Layers, Folder, Settings, Mic, LogOut, Brain,
  FolderOpen, Bot, ListChecks, Layout, Puzzle, BookOpen, History,
  GitBranch, Search, ChevronDown, ChevronRight, Pin, MoreHorizontal,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  view: ActiveView
  icon: React.ElementType
  label: string
  matches?: ActiveView[]
  badge?: number
}

const TOP_NAV: NavItem[] = [
  { view: 'new-thread', icon: Edit3, label: 'New Session', matches: ['new-thread', 'chat'] },
  { view: 'projects', icon: FolderOpen, label: 'Projects' },
  { view: 'agents', icon: Bot, label: 'Agents' },
  { view: 'voice', icon: Mic, label: 'Voice Assistant' },
  { view: 'tasks', icon: ListChecks, label: 'Tasks' },
]

const BOTTOM_NAV: NavItem[] = [
  { view: 'workspace', icon: Layout, label: 'Workspace' },
  { view: 'plugins', icon: Puzzle, label: 'Plugins' },
  { view: 'prompts', icon: BookOpen, label: 'Prompt Library' },
  { view: 'history', icon: History, label: 'History' },
  { view: 'git', icon: GitBranch, label: 'Git' },
  { view: 'search', icon: Search, label: 'Search' },
  { view: 'skills', icon: Layers, label: 'Skills' },
  { view: 'automations', icon: Clock, label: 'Automations' },
  { view: 'memory', icon: Brain, label: 'Memory' },
]

export default function Sidebar() {
  const {
    isSidebarOpen, activeView, setActiveView, setActiveThread,
    threads, activeThreadId, toggleOrb, isOrbVisible, tasks,
    isOrbConnected, projects, activeProjectId, setActiveProject,
  } = useStore()

  const [threadsExpanded, setThreadsExpanded] = useState(true)
  const [projectsExpanded, setProjectsExpanded] = useState(false)

  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length
  const navWithBadges = TOP_NAV.map((n) =>
    n.view === 'tasks' && pendingTasks > 0 ? { ...n, badge: pendingTasks } : n,
  )

  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <aside
      className={`w-[240px] bg-codebox-sidebar border-r border-codebox-border flex flex-col z-10 flex-shrink-0 transition-[width,opacity] duration-250 ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Window controls */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-[11px] font-semibold text-codebox-muted tracking-widest uppercase select-none">
            Eburon
          </span>
        </div>

        {/* Top nav */}
        <nav className="px-2.5 flex flex-col gap-0.5 flex-shrink-0 pb-1">
          {navWithBadges.map(({ view, icon: Icon, label, matches, badge }) => {
            const isActive = matches ? matches.includes(activeView) : activeView === view
            return (
              <button
                key={view}
                className={`nav-item-base w-full text-left ${isActive ? 'nav-item-active' : ''}`}
                onClick={() => {
                  if (view === 'new-thread') setActiveThread(null)
                  setActiveView(view)
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
                <span className="flex-1">{label}</span>
                {badge ? (
                  <span className="text-[10px] font-semibold bg-codebox-purple/20 text-codebox-purple px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 my-1.5 border-t border-codebox-border/60" />

        {/* Scrollable middle section */}
        <div className="flex-1 overflow-y-auto px-2.5 flex flex-col gap-0.5 min-h-0">
          {/* Active project */}
          <button
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer w-full text-left"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
          >
            {projectsExpanded ? <ChevronDown size={13} className="text-codebox-muted" /> : <ChevronRight size={13} className="text-codebox-muted" />}
            <Folder size={14} className="text-codebox-blue flex-shrink-0" strokeWidth={1.8} />
            <span className="text-[12.5px] text-codebox-primary font-medium truncate flex-1">
              {activeProject?.name || 'Workspace'}
            </span>
          </button>

          {projectsExpanded && (
            <div className="pl-3 flex flex-col gap-0.5 mb-1">
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-[12px] w-full text-left cursor-pointer ${
                    p.id === activeProjectId
                      ? 'text-codebox-primary font-medium bg-white/5'
                      : 'text-codebox-secondary hover:text-codebox-primary hover:bg-white/4'
                  }`}
                  onClick={() => setActiveProject(p.id)}
                >
                  {p.pinned && <Pin size={11} className="text-codebox-blue flex-shrink-0" />}
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Threads */}
          <button
            className="flex items-center gap-2 px-2.5 py-1 cursor-pointer w-full text-left mt-1"
            onClick={() => setThreadsExpanded(!threadsExpanded)}
          >
            {threadsExpanded ? <ChevronDown size={13} className="text-codebox-muted" /> : <ChevronRight size={13} className="text-codebox-muted" />}
            <span className="text-[11px] font-medium text-codebox-muted uppercase tracking-wider">
              Sessions
            </span>
          </button>

          {threadsExpanded && (
            <div className="flex flex-col gap-0.5 pl-1">
              {threads.length === 0 ? (
                <div className="px-2.5 py-3 text-center text-codebox-muted text-[11.5px] border border-dashed border-codebox-border rounded-lg mt-1 leading-relaxed mx-1">
                  No sessions yet.
                </div>
              ) : (
                <>
                  {threads.filter((t) => t.pinned).length > 0 && (
                    <div className="mb-0.5">
                      <span className="text-[10px] text-codebox-muted px-2.5 uppercase tracking-wider">Pinned</span>
                      {threads.filter((t) => t.pinned).map((t) => (
                        <ThreadItem key={t.id} thread={t} isActive={t.id === activeThreadId} />
                      ))}
                    </div>
                  )}
                  {threads.filter((t) => !t.pinned).map((t) => (
                    <ThreadItem key={t.id} thread={t} isActive={t.id === activeThreadId} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-3 my-1.5 border-t border-codebox-border/60" />

        {/* Bottom nav items */}
        <nav className="px-2.5 flex flex-col gap-0.5 flex-shrink-0 pb-1">
          {BOTTOM_NAV.map(({ view, icon: Icon, label }) => {
            const isActive = activeView === view
            return (
              <button
                key={view}
                className={`nav-item-base w-full text-left ${isActive ? 'nav-item-active' : ''}`}
                onClick={() => setActiveView(view)}
              >
                <Icon size={15} strokeWidth={1.8} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer toolbar */}
        <div className="px-3 py-3 border-t border-codebox-border flex items-center justify-between bg-codebox-sidebar flex-shrink-0">
          <button
            className="sidebar-icon-btn"
            title="Settings"
            onClick={() => setActiveView('settings')}
          >
            <Settings size={16} strokeWidth={1.8} />
          </button>

          <button
            className={`sidebar-icon-btn ${isOrbConnected ? 'text-codebox-green' : ''} ${isOrbVisible ? 'text-codebox-purple bg-codebox-purple/15 shadow-[0_0_10px_rgba(139,92,246,0.3)]' : ''}`}
            title="Voice Agent Orb"
            onClick={toggleOrb}
          >
            <Mic size={16} strokeWidth={1.8} />
          </button>

          <button
            className="sidebar-icon-btn hover:text-codebox-red hover:bg-red-500/10"
            title="Log out"
          >
            <LogOut size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function ThreadItem({ thread, isActive }: { thread: Thread; isActive: boolean }) {
  const { setActiveThread, setActiveView, pinThread, removeThread } = useStore()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`thread-item-base group relative ${isActive ? 'thread-item-active' : ''}`}
      onClick={() => { setActiveThread(thread.id); setActiveView('chat') }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-codebox-blue flex-shrink-0" />}
      <span className="flex-1 truncate">{thread.title}</span>
      {hovered && (
        <span
          className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 text-codebox-muted hover:text-codebox-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); pinThread(thread.id) }}
          title={thread.pinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={11} />
        </span>
      )}
    </div>
  )
}
