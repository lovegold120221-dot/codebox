import { useState, useRef, useCallback } from 'react'
import { useStore } from '@/store'
import { X, Plus, Sparkles } from 'lucide-react'
import { showToast } from '@/components/Toast'

interface TerminalTab {
  id: string
  title: string
  history: string[]
}

function makeTab(id: string, title: string): TerminalTab {
  return {
    id,
    title,
    history: [
      '\x1b[1;35m◆ Eburon Codebox Terminal\x1b[0m',
      '',
      '\x1b[2m$ git status\x1b[0m',
      'On branch eb/codebox-main',
      'nothing to commit, working tree clean',
      '',
    ],
  }
}

export default function TerminalPane() {
  const { isTerminalOpen, toggleTerminal } = useStore()
  const [tabs, setTabs] = useState<TerminalTab[]>([makeTab('t1', 'bash')])
  const [activeTabId, setActiveTabId] = useState('t1')
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const tabCounter = useRef(1)

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]

  const updateHistory = useCallback((tabId: string, fn: (h: string[]) => string[]) => {
    setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, history: fn(t.history) } : t))
  }, [])

  const addTab = useCallback(() => {
    tabCounter.current++
    const id = `t${tabCounter.current}`
    setTabs((prev) => [...prev, makeTab(id, `bash ${tabCounter.current}`)])
    setActiveTabId(id)
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id)
      const finalTabs = next.length === 0 ? [makeTab('t1', 'bash')] : next
      setActiveTabId((prevActive) => prevActive === id ? finalTabs[0].id : prevActive)
      return finalTabs
    })
  }, [])

  const explainCommand = useCallback((cmd: string) => {
    showToast(`Eburon: "${cmd}" — explanation would appear in chat`)
  }, [])

  const handleEnter = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !input.trim()) return
    const cmd = input.trim()
    const tabId = activeTabId
    updateHistory(tabId, (h) => [...h, `\x1b[1;36m$ ${cmd}\x1b[0m`])
    setInput('')

    if (cmd === 'clear') {
      updateHistory(tabId, () => [])
      return
    }
    if (cmd === 'help') {
      updateHistory(tabId, (h) => [...h, 'Commands: git status, git log, npm test, ls, pwd, clear, help, explain <cmd>'])
      return
    }
    if (cmd.startsWith('explain ')) {
      explainCommand(cmd.slice(8))
      updateHistory(tabId, (h) => [...h, '\x1b[2mAsking Eburon to explain...\x1b[0m'])
      return
    }
    if (cmd.startsWith('git')) {
      updateHistory(tabId, (h) => [...h, `\x1b[2mExecuting: ${cmd}\x1b[0m`, '\x1b[32mDone.\x1b[0m'])
      return
    }
    updateHistory(tabId, (h) => [...h, `\x1b[31mcommand not found: ${cmd.split(' ')[0]}\x1b[0m`])
  }, [input, activeTabId, updateHistory, explainCommand])

  if (!isTerminalOpen) return null

  return (
    <div className="absolute bottom-[130px] left-0 right-0 h-[240px] bg-[#0d0d0f] border-t border-codebox-border flex flex-col z-10 font-mono text-xs">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-codebox-border bg-codebox-sidebar">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-r border-codebox-border cursor-pointer font-sans text-[11px] flex-shrink-0 ${
                tab.id === activeTabId ? 'bg-[#0d0d0f] text-codebox-primary' : 'text-codebox-secondary hover:text-codebox-primary'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  className="bg-transparent border-none cursor-pointer text-codebox-muted hover:text-codebox-red p-0 flex items-center"
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
          <button
            className="p-1.5 text-codebox-secondary hover:text-codebox-primary bg-transparent border-none cursor-pointer flex-shrink-0"
            onClick={addTab}
            title="New terminal tab"
          >
            <Plus size={13} />
          </button>
        </div>
        <div className="flex items-center gap-1 pr-2">
          <button
            className="p-1 text-codebox-secondary hover:text-codebox-purple bg-transparent border-none cursor-pointer"
            title="AI explain last command"
            onClick={() => showToast('Eburon: analyzing terminal output...')}
          >
            <Sparkles size={13} />
          </button>
          <button
            className="bg-transparent border-none text-codebox-secondary cursor-pointer p-0.5 rounded hover:bg-white/5 hover:text-codebox-primary"
            onClick={toggleTerminal}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 leading-relaxed" onClick={() => inputRef.current?.focus()}>
        {activeTab.history.map((line, i) => {
          if (line.includes('\x1b[')) {
            return <pre key={i} className="whitespace-pre-wrap break-all">{line.replace(/\x1b\[[0-9;]*m/g, '')}</pre>
          }
          return <div key={i} className="whitespace-pre-wrap break-all text-codebox-secondary">{line}</div>
        })}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-codebox-green">$</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-codebox-primary font-mono text-xs"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleEnter}
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}
