import { create } from 'zustand'
import { getSkillManager } from '@/lib/skills'
import { getMemoryStore } from '@/lib/memory'
import { executePrompt, streamPrompt, getAvailableProviders, getOnlineProviders } from '@/lib/providers/client'
import { ProviderInfo, EBURON_ALIASES, EBURON_DISPLAY_NAMES } from '@/lib/providers/types'

export type ActiveView =
  | 'new-thread'
  | 'chat'
  | 'automations'
  | 'skills'
  | 'settings'
  | 'memory'
  | 'projects'
  | 'agents'
  | 'voice'
  | 'tasks'
  | 'workspace'
  | 'plugins'
  | 'prompts'
  | 'history'
  | 'git'
  | 'search'

export interface Thread {
  id: string
  title: string
  mode: 'local' | 'worktree' | 'cloud'
  branch?: string
  projectId: string
  sessionId?: string
  createdAt: number
  tags?: string[]
  pinned?: boolean
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  code?: string
  reasoning?: string
  toolCalls?: { name: string; args: string; result?: string }[]
  timestamp: number
  pinned?: boolean
  bookmarked?: boolean
}

export interface SkillDef {
  id: string
  name: string
  description: string
  type: 'system' | 'custom'
  enabled: boolean
  icon: string
}

export interface ModelDef {
  id: string
  name: string
  provider: string
  isDefault?: boolean
}

export interface Project {
  id: string
  name: string
  path: string
  branch: string
  lastActive: number
  pinned?: boolean
}

export interface Task {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'done' | 'failed'
  agentId?: string
  threadId?: string
  createdAt: number
}

export interface AgentDef {
  id: string
  name: string
  role: string
  description: string
  icon: string
  active: boolean
}

export interface Prompt {
  id: string
  title: string
  content: string
  category: string
  favorite: boolean
  variables?: string[]
}

export interface AppState {
  activeView: ActiveView
  activeThreadId: string | null
  threads: Thread[]
  messages: Record<string, Message[]>
  skills: SkillDef[]
  models: ModelDef[]
  activeModel: string
  activeMode: 'local' | 'worktree' | 'cloud'
  isSidebarOpen: boolean
  isOrbVisible: boolean
  isOrbConnected: boolean
  isOrbListening: boolean
  orbTranscript: string
  theme: 'dark' | 'light'
  isStreaming: boolean
  isTerminalOpen: boolean
  isDiffOpen: boolean
  diffContent: string | null
  engineConnected: boolean
  ollamaConnected: boolean
  availableProviders: ProviderInfo[]
  providerLoading: boolean
  projects: Project[]
  activeProjectId: string | null
  tasks: Task[]
  agents: AgentDef[]
  prompts: Prompt[]
  globalSearch: string
  isCommandPaletteOpen: boolean

  setActiveView: (view: ActiveView) => void
  setActiveThread: (id: string | null) => void
  addThread: (thread: Thread) => void
  removeThread: (id: string) => void
  pinThread: (id: string) => void
  addMessage: (threadId: string, message: Message) => void
  updateMessage: (threadId: string, msgId: string, updates: Partial<Message>) => void
  toggleSkill: (id: string) => void
  setActiveModel: (id: string) => void
  setActiveMode: (mode: AppState['activeMode']) => void
  toggleSidebar: () => void
  toggleOrb: () => void
  toggleOrbConnection: () => void
  setOrbListening: (v: boolean) => void
  setOrbTranscript: (t: string) => void
  toggleTheme: () => void
  setStreaming: (v: boolean) => void
  toggleTerminal: () => void
  toggleDiff: () => void
  setDiffContent: (content: string | null) => void
  setEngineConnected: (v: boolean) => void
  setOllamaConnected: (v: boolean) => void
  refreshProviders: () => Promise<void>
  sendPrompt: (threadId: string, text: string) => Promise<void>
  setActiveProject: (id: string | null) => void
  addProject: (p: Project) => void
  addTask: (t: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  toggleAgent: (id: string) => void
  addPrompt: (p: Prompt) => void
  togglePromptFavorite: (id: string) => void
  setGlobalSearch: (q: string) => void
  setCommandPaletteOpen: (v: boolean) => void
}

const DEFAULT_SKILLS: SkillDef[] = [
  { id: 'ast-indexer', name: 'AST Codebase Indexer', description: 'Automatically builds vector embeddings and semantic syntax trees across your local repository for ultra-fast code retrieval.', type: 'system', enabled: true, icon: 'Code2' },
  { id: 'cve-scanner', name: 'CVE Security Scanner', description: 'Scans code modifications in real-time for SQL injections, XSS vulnerabilities, and outdated package dependencies.', type: 'system', enabled: true, icon: 'Shield' },
  { id: 'react19-migrator', name: 'React 19 Action Migrator', description: 'Specialized refactoring rules converting legacy useEffect hooks and class components directly into React 19 Server Actions.', type: 'custom', enabled: true, icon: 'Layers' },
  { id: 'figma-to-tailwind', name: 'Figma to Tailwind UI', description: 'Translates Figma JSON design tokens and layout hierarchies into accessible, responsive Tailwind CSS JSX structures.', type: 'custom', enabled: false, icon: 'PenTool' },
  { id: 'voice-coding', name: 'Voice Coding Bridge', description: 'Converts voice transcripts to structured code prompts, diff previews, and apply flows.', type: 'system', enabled: true, icon: 'Mic' },
  { id: 'git-ai', name: 'AI Git Assistant', description: 'Generates commit messages, explains diffs, detects conflicts, and reviews pull requests.', type: 'system', enabled: true, icon: 'GitBranch' },
]

const DEFAULT_AGENTS: AgentDef[] = [
  { id: 'coding', name: 'Eburon Coder', role: 'Coding Agent', description: 'Writes, refactors, and debugs code with full project context.', icon: 'Code2', active: true },
  { id: 'architect', name: 'Eburon Architect', role: 'Architect Agent', description: 'Designs system architecture, schemas, and API contracts.', icon: 'Layers', active: true },
  { id: 'reviewer', name: 'Eburon Reviewer', role: 'Reviewer Agent', description: 'Reviews code for bugs, security issues, and best practices.', icon: 'Shield', active: true },
  { id: 'debugger', name: 'Eburon Debugger', role: 'Debugger Agent', description: 'Traces errors, explains stack traces, and suggests fixes.', icon: 'Bug', active: false },
  { id: 'voice', name: 'Eburon Voice', role: 'Voice Agent', description: 'Realtime voice-to-code pipeline with Gemini Live Audio.', icon: 'Mic', active: true },
  { id: 'planner', name: 'Eburon Planner', role: 'Planner Agent', description: 'Breaks down complex tasks into actionable steps and tracks progress.', icon: 'ListChecks', active: false },
  { id: 'docs', name: 'Eburon Docs', role: 'Documentation Agent', description: 'Generates and maintains inline documentation, READMEs, and API docs.', icon: 'FileText', active: false },
  { id: 'research', name: 'Eburon Research', role: 'Research Agent', description: 'Searches codebases, web sources, and memory for contextual information.', icon: 'Search', active: false },
]

const DEFAULT_PROMPTS: Prompt[] = [
  { id: 'p1', title: 'Explain this code', content: 'Explain what this code does, step by step:', category: 'Understanding', favorite: true },
  { id: 'p2', title: 'Fix the bug', content: 'Find and fix the bug in this code. Explain what was wrong:', category: 'Debugging', favorite: true },
  { id: 'p3', title: 'Write unit tests', content: 'Write comprehensive unit tests for this code:', category: 'Testing', favorite: false },
  { id: 'p4', title: 'Refactor for clarity', content: 'Refactor this code to be more readable and maintainable:', category: 'Refactoring', favorite: false },
  { id: 'p5', title: 'Generate API endpoint', content: 'Create a REST API endpoint for:', category: 'Generation', favorite: false },
  { id: 'p6', title: 'Review for security', content: 'Review this code for security vulnerabilities:', category: 'Security', favorite: true },
]

const DEFAULT_PROJECTS: Project[] = [
  { id: 'default', name: 'Codebox Workspace', path: '~/Projects/codebox', branch: 'eb/codebox-main', lastActive: Date.now(), pinned: true },
]

export const useStore = create<AppState>((set, get) => ({
  activeView: 'new-thread',
  activeThreadId: null,
  threads: [],
  messages: {},
  skills: DEFAULT_SKILLS,
  models: EBURON_ALIASES.map((alias) => ({
    id: alias,
    name: EBURON_DISPLAY_NAMES[alias] || alias,
    provider: 'eburon',
    isDefault: alias === 'auto',
  })),
  activeModel: 'auto',
  activeMode: 'local',
  isSidebarOpen: true,
  isOrbVisible: false,
  isOrbConnected: false,
  isOrbListening: false,
  orbTranscript: '',
  theme: 'dark',
  isStreaming: false,
  isTerminalOpen: false,
  isDiffOpen: true,
  diffContent: null,
  engineConnected: false,
  ollamaConnected: false,
  availableProviders: [],
  providerLoading: false,
  projects: DEFAULT_PROJECTS,
  activeProjectId: 'default',
  tasks: [],
  agents: DEFAULT_AGENTS,
  prompts: DEFAULT_PROMPTS,
  globalSearch: '',
  isCommandPaletteOpen: false,

  setActiveView: (view) => set({ activeView: view }),
  setActiveThread: (id) => set({ activeThreadId: id }),
  addThread: (thread) => set((s) => ({ threads: [thread, ...s.threads] })),
  removeThread: (id) => set((s) => ({ threads: s.threads.filter((t) => t.id !== id) })),
  pinThread: (id) => set((s) => ({
    threads: s.threads.map((t) => t.id === id ? { ...t, pinned: !t.pinned } : t),
  })),
  addMessage: (threadId, message) =>
    set((s) => ({
      messages: { ...s.messages, [threadId]: [...(s.messages[threadId] || []), message] },
    })),
  updateMessage: (threadId, msgId, updates) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [threadId]: (s.messages[threadId] || []).map((m) =>
          m.id === msgId ? { ...m, ...updates } : m,
        ),
      },
    })),
  toggleSkill: (id) =>
    set((s) => ({
      skills: s.skills.map((sk) => (sk.id === id ? { ...sk, enabled: !sk.enabled } : sk)),
    })),
  setActiveModel: (id) => set({ activeModel: id }),
  setActiveMode: (mode) => set({ activeMode: mode }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleOrb: () => set((s) => ({ isOrbVisible: !s.isOrbVisible })),
  toggleOrbConnection: () => set((s) => ({ isOrbConnected: !s.isOrbConnected })),
  setOrbListening: (v) => set({ isOrbListening: v }),
  setOrbTranscript: (t) => set({ orbTranscript: t }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setStreaming: (v) => set({ isStreaming: v }),
  toggleTerminal: () => set((s) => ({ isTerminalOpen: !s.isTerminalOpen })),
  toggleDiff: () => set((s) => ({ isDiffOpen: !s.isDiffOpen })),
  setDiffContent: (content) => set({ diffContent: content }),
  setEngineConnected: (v) => set({ engineConnected: v }),
  setOllamaConnected: (v) => set({ ollamaConnected: v }),
  setActiveProject: (id) => set({ activeProjectId: id }),
  addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
  addTask: (t) => set((s) => ({ tasks: [t, ...s.tasks] })),
  updateTask: (id, updates) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t),
  })),
  toggleAgent: (id) => set((s) => ({
    agents: s.agents.map((a) => a.id === id ? { ...a, active: !a.active } : a),
  })),
  addPrompt: (p) => set((s) => ({ prompts: [p, ...s.prompts] })),
  togglePromptFavorite: (id) => set((s) => ({
    prompts: s.prompts.map((p) => p.id === id ? { ...p, favorite: !p.favorite } : p),
  })),
  setGlobalSearch: (q) => set({ globalSearch: q }),
  setCommandPaletteOpen: (v) => set({ isCommandPaletteOpen: v }),

  refreshProviders: async () => {
    set({ providerLoading: true })
    try {
      const providers = await getAvailableProviders()
      const online = await getOnlineProviders()
      set({
        availableProviders: providers.map((p) => ({
          ...p,
          available: online.includes(p.alias),
        })),
        providerLoading: false,
      })
    } catch {
      set({ providerLoading: false })
    }
  },

  sendPrompt: async (threadId, text) => {
    const state = get()
    const skillMgr = getSkillManager()
    const memStore = getMemoryStore()

    set({ isStreaming: true })

    const assistantMsgId = `msg-${Date.now()}-ai`

    set((s) => ({
      messages: {
        ...s.messages,
        [threadId]: [
          ...(s.messages[threadId] || []),
          { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() },
        ],
      },
    }))

    try {
      const [systemPrompt, projectMemories] = await Promise.all([
        skillMgr.getSystemPrompt(),
        memStore.getByProject('default'),
      ])
      const memoryContext = projectMemories
        .slice(0, 5)
        .map((m: any) => `- [${m.type}] ${m.content}`)
        .join('\n')

      let fullPrompt = text
      if (memoryContext) {
        fullPrompt = `Relevant context from past sessions:\n${memoryContext}\n\nUser: ${text}`
      }

      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\n${fullPrompt}`
      }

      const activeModel = state.activeModel
      const provider = activeModel !== 'auto' ? activeModel : undefined

      let aiText = ''

      try {
        const result = await streamPrompt(fullPrompt, provider, (chunk, _prov) => {
          aiText += chunk
          set((s) => ({
            messages: {
              ...s.messages,
              [threadId]: s.messages[threadId].map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + chunk }
                  : m,
              ),
            },
          }))
        })

        aiText = result.content || aiText
        set({ engineConnected: true })
      } catch (streamErr: any) {
        if (streamErr.message?.includes('All available Eburon engines failed')) {
          throw streamErr
        }
        try {
          const result = await executePrompt(fullPrompt, provider)
          aiText = result.content
          set({ engineConnected: true })
        } catch (execErr: any) {
          throw execErr
        }
      }

      if (aiText) {
        set((s) => ({
          messages: {
            ...s.messages,
            [threadId]: s.messages[threadId].map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: aiText, code: aiText.includes('```') ? aiText : undefined }
                : m,
            ),
          },
        }))
      }
    } catch (err: any) {
      const errorMsg = err.message?.includes('All available Eburon engines')
        ? 'All available Eburon engines failed to complete the task. Please try again.'
        : `Error: ${err.message || 'Unknown error'}`

      set((s) => ({
        messages: {
          ...s.messages,
          [threadId]: s.messages[threadId].map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: errorMsg }
              : m,
          ),
        },
      }))
    } finally {
      set({ isStreaming: false })
    }
  },
}))
