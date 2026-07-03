import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { initFirebase } from '@/lib/auth/firebase'
import AuthPage from '@/components/auth/AuthPage'
import Sidebar from '@/components/sidebar/Sidebar'
import TopBar from '@/components/TopBar'
import ThreadCanvas from '@/components/thread/ThreadCanvas'
import Composer from '@/components/composer/Composer'
import SkillsView from '@/components/skills/SkillsView'
import SettingsView from '@/components/settings/SettingsView'
import AutomationsView from '@/components/automations/AutomationsView'
import MemoryView from '@/components/settings/MemoryView'
import DiffPane from '@/components/panel/DiffPane'
import TerminalPane from '@/components/tools/TerminalPane'
import BrowserPane from '@/components/tools/BrowserPane'
import VoiceOrb from '@/components/tools/VoiceOrb'
import Toast from '@/components/Toast'
import ProjectsView from '@/components/views/ProjectsView'
import AgentsView from '@/components/views/AgentsView'
import VoiceAssistantView from '@/components/views/VoiceAssistantView'
import TasksView from '@/components/views/TasksView'
import WorkspaceView from '@/components/views/WorkspaceView'
import PluginsView from '@/components/views/PluginsView'
import PromptLibraryView from '@/components/views/PromptLibraryView'
import HistoryView from '@/components/views/HistoryView'
import GitView from '@/components/views/GitView'
import SearchView from '@/components/views/SearchView'

const VIEWS_WITHOUT_COMPOSER = new Set([
  'settings', 'skills', 'automations', 'memory',
  'projects', 'agents', 'voice', 'tasks',
  'workspace', 'plugins', 'prompts', 'history', 'git', 'search',
])

export default function App() {
  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const { theme, activeView, isSidebarOpen } = useStore()
  useKeyboardShortcuts()

  useEffect(() => {
    initFirebase().then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-codebox-bg">
        <div className="flex flex-col items-center gap-3">
          <EburonLogo className="w-10 h-10 text-codebox-blue" />
          <div className="animate-spin w-6 h-6 border-2 border-codebox-blue border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return <AuthPage onAuthenticated={() => setAuthenticated(true)} />
  }

  const isLight = theme === 'light'
  const showComposer = !VIEWS_WITHOUT_COMPOSER.has(activeView)

  return (
    <div className="flex h-screen overflow-hidden" {...(isLight ? { 'data-theme': 'light' } : {})}>
      <Sidebar />
      <main className="flex-1 flex flex-col relative bg-codebox-bg h-screen min-w-0">
        <TopBar />
        <div
          className="flex-1 flex flex-col items-center justify-center relative overflow-y-auto px-5 pb-[180px] pt-5"
          style={{
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(0)',
            transition: 'transform 0.25s ease',
          }}
        >
          <ContentView />
        </div>
        {showComposer && <Composer />}
        <TerminalPane />
      </main>
      <DiffPane />
      <BrowserPane />
      <VoiceOrb />
      <Toast />
    </div>
  )
}

function ContentView() {
  const { activeView } = useStore()
  switch (activeView) {
    case 'new-thread':
    case 'chat':
      return <ThreadCanvas />
    case 'skills':
      return <SkillsView />
    case 'settings':
      return <SettingsView />
    case 'automations':
      return <AutomationsView />
    case 'memory':
      return <MemoryView />
    case 'projects':
      return <ProjectsView />
    case 'agents':
      return <AgentsView />
    case 'voice':
      return <VoiceAssistantView />
    case 'tasks':
      return <TasksView />
    case 'workspace':
      return <WorkspaceView />
    case 'plugins':
      return <PluginsView />
    case 'prompts':
      return <PromptLibraryView />
    case 'history':
      return <HistoryView />
    case 'git':
      return <GitView />
    case 'search':
      return <SearchView />
    default:
      return <ThreadCanvas />
  }
}

function EburonLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M48 44H18c-6.6 0-12-5.4-12-12 0-5.8 4.2-10.7 9.8-11.8C17.4 13.5 23.8 8 31.5 8c8.5 0 15.5 6.3 16.4 14.5C53.5 23.7 58 28.3 58 34c0 5.5-4.5 10-10 10z"/>
      <path d="M25 29l5 5-5 5"/><line x1="33" y1="39" x2="41" y2="39"/>
    </svg>
  )
}
