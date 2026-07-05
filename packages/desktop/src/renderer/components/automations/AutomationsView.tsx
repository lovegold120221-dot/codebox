import { useStore, AutomationDef } from '@/store'
import { useState, useEffect, useMemo } from 'react'
import {
  Clock, Plus, ChevronDown, Trash2, X, PlayCircle, Mic, Square, Sparkles,
} from 'lucide-react'

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const INITIALS_GRADIENTS = [
  'from-blue-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-rose-500',
  'from-violet-500 to-fuchsia-500',
  'from-cyan-500 to-blue-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-yellow-500',
  'from-indigo-500 to-violet-500',
  'from-red-500 to-orange-500',
  'from-teal-500 to-cyan-500',
]

function getInitialsGradient(name: string) {
  return INITIALS_GRADIENTS[hashString(name) % INITIALS_GRADIENTS.length]
}

function getInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const SCHEDULE_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9am', value: '0 9 * * *' },
  { label: 'Every Monday 10am', value: '0 10 * * 1' },
  { label: 'Every Friday 5pm', value: '0 17 * * 5' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'First of month', value: '0 0 1 * *' },
]

export default function AutomationsView() {
  const { automations, loadAutomations, addAutomation, toggleAutomation, removeAutomation, runNow } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [sort, setSort] = useState<'featured' | 'asc' | 'desc'>('featured')
  const [sortOpen, setSortOpen] = useState(false)
  const [selectedAuto, setSelectedAuto] = useState<AutomationDef | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSchedule, setNewSchedule] = useState('0 9 * * *')
  const [newPrompt, setNewPrompt] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const api = (window as any).electronAPI?.db?.user
    if (api) {
      api.findByFirebaseUid('system').then((u: any) => {
        if (u) {
          setUserId(u.id)
          loadAutomations(u.id)
        }
      }).catch(() => {})
    }
  }, [loadAutomations])

  const filtered = useMemo(() => {
    let result = automations
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.prompt.toLowerCase().includes(q)
      )
    }
    if (filter === 'active') result = result.filter((a) => a.enabled)
    else if (filter === 'paused') result = result.filter((a) => !a.enabled)
    if (sort === 'asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'desc') result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    return result
  }, [automations, search, filter, sort])

  const activeCount = automations.filter((a) => a.enabled).length

  const closeAllDropdowns = () => { setSortOpen(false) }

  const handleCreate = async () => {
    if (!newName.trim() || !newPrompt.trim() || !userId) return
    await addAutomation({ userId, name: newName, prompt: newPrompt, schedule: newSchedule })
    setNewName('')
    setNewPrompt('')
    setShowCreate(false)
  }

  const startVoiceCreate = () => {
    setIsListening(true)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsListening(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      const lower = text.toLowerCase()
      if (lower.includes('every') || lower.includes('each') || lower.includes('daily') || lower.includes('weekly') || lower.includes('hourly')) {
        if (lower.includes('hour') || lower.includes('hourly')) setNewSchedule('0 * * * *')
        else if (lower.includes('day') || lower.includes('daily')) setNewSchedule('0 9 * * *')
        else if (lower.includes('week') || lower.includes('weekly')) setNewSchedule('0 10 * * 1')
        else if (lower.includes('month') || lower.includes('monthly')) setNewSchedule('0 0 1 * *')
      }
      const nameMatch = text.match(/(?:called|named|titled)\s+["']?([^"'.]+)["']?/i)
      if (nameMatch) setNewName(nameMatch[1].trim())
      const promptMatch = text.match(/(?:to|that)\s+(.+)/i)
      if (promptMatch) setNewPrompt(promptMatch[1].trim())
      if (!nameMatch && !promptMatch) {
        const sentences = text.split(/[.!?]+/).filter(Boolean)
        if (sentences.length >= 2) {
          setNewName(sentences[0].trim())
          setNewPrompt(sentences.slice(1).join('. ').trim())
        } else {
          setNewName(text.length > 40 ? text.slice(0, 40) + '...' : text)
          setNewPrompt(text)
        }
      }
      setShowCreate(true)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.start()
  }

  return (
    <div className="w-full min-h-screen flex flex-col" onClick={closeAllDropdowns}>
      <div className="flex-1 w-full max-w-[960px] flex flex-col px-5 pt-16 pb-32 mx-auto">
        <div className="flex items-center justify-between border-b border-codebox-border pb-3 mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-codebox-primary">Automations</h2>
            <span className="text-xs text-codebox-secondary">{activeCount} of {automations.length} active</span>
          </div>
          <div className="flex gap-2">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isListening
                  ? 'bg-codebox-red/20 text-codebox-red animate-pulse'
                  : 'bg-codebox-button border border-codebox-border text-codebox-secondary hover:text-codebox-primary'
              }`}
              onClick={isListening ? () => setIsListening(false) : startVoiceCreate}
            >
              {isListening ? <Square size={14} /> : <Mic size={14} />}
              {isListening ? 'Listening...' : 'Voice Create'}
            </button>
            <button className="flex items-center gap-1.5 text-xs bg-codebox-button border border-codebox-border rounded-lg px-3 py-2 text-codebox-primary hover:bg-codebox-button-hover transition-colors" onClick={() => setShowCreate(true)}>
              <Plus size={13} /> Create Automation
            </button>
          </div>
        </div>

        <div className="relative w-full mb-5">
          <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-codebox-muted pointer-events-none" />
          <input
            type="text"
            className="w-full h-11 bg-codebox-input border border-codebox-border rounded-[10px] pl-11 pr-10 text-codebox-primary text-sm outline-none transition-all focus:bg-codebox-bg focus:border-codebox-border/20"
            placeholder="Search automations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-codebox-muted hover:text-codebox-primary transition-colors"
              onClick={() => setSearch('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex justify-between items-center mb-5">
          <div className="flex gap-1 bg-black/15 p-[3px] rounded-[10px] border border-white/[0.03]">
            <button
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'all' ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'active' ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => setFilter('active')}
            >
              Active ({activeCount})
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'paused' ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => setFilter('paused')}
            >
              Paused ({automations.length - activeCount})
            </button>
          </div>

          <div className="flex items-center gap-2.5 relative">
            <div className="relative">
              <button
                className="flex items-center gap-2 bg-codebox-button border border-codebox-border rounded-lg px-3.5 py-1.5 text-codebox-primary text-[13px] font-medium hover:bg-codebox-button-hover transition-colors"
                onClick={(e) => { e.stopPropagation(); setSortOpen(!sortOpen) }}
              >
                <span>{sort === 'asc' ? 'Name (A-Z)' : sort === 'desc' ? 'Name (Z-A)' : 'Sort by'}</span>
                <ChevronDown size={14} className="text-codebox-secondary" />
              </button>
              {sortOpen && (
                <div className="absolute top-10 right-0 bg-codebox-sidebar border border-codebox-border/50 rounded-[10px] shadow-xl py-1.5 w-44 z-50 flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                  {[
                    { val: 'featured', label: 'Featured' },
                    { val: 'asc', label: 'Name (A-Z)' },
                    { val: 'desc', label: 'Name (Z-A)' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      className={`px-3 py-1.5 text-[13px] rounded-md mx-1 text-left transition-colors ${sort === s.val ? 'text-codebox-primary font-medium bg-white/[0.04]' : 'text-codebox-secondary hover:bg-white/[0.06] hover:text-codebox-primary'}`}
                      onClick={() => { setSort(s.val as typeof sort); setSortOpen(false) }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showCreate && (
          <div className="bg-codebox-card border border-codebox-border/60 rounded-[14px] p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-codebox-blue" />
              <h3 className="text-sm font-semibold text-codebox-primary">New Automation</h3>
            </div>
            <input
              className="w-full bg-codebox-input border border-codebox-border rounded-[10px] px-3 py-2.5 text-codebox-primary text-sm outline-none mb-3 transition-all focus:border-codebox-blue/40"
              placeholder="Automation name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="text-[11px] text-codebox-muted uppercase tracking-wider mb-1 block">Cron Schedule</label>
                <input
                  className="w-full bg-codebox-input border border-codebox-border rounded-[10px] px-3 py-2.5 text-codebox-primary text-sm outline-none font-mono transition-all focus:border-codebox-blue/40"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-codebox-muted uppercase tracking-wider mb-1 block">Presets</label>
                <select
                  className="w-full bg-codebox-input border border-codebox-border rounded-[10px] px-3 py-2.5 text-codebox-primary text-sm outline-none"
                  onChange={(e) => setNewSchedule(e.target.value)}
                >
                  <option value="">Custom...</option>
                  {SCHEDULE_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[11px] text-codebox-muted uppercase tracking-wider mb-1 block">Agent Prompt</label>
              <textarea
                className="w-full bg-codebox-input border border-codebox-border rounded-[10px] p-3 text-codebox-primary text-sm outline-none resize-none min-h-[70px] transition-all focus:border-codebox-blue/40"
                rows={3}
                placeholder="What should the agent do on each run?"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-codebox-input border border-codebox-border text-codebox-secondary px-4 py-2 rounded-lg text-xs cursor-pointer hover:text-codebox-primary transition-colors"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button className="bg-codebox-blue text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-600 transition-colors" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3.5 overflow-y-auto pb-5" style={{ alignContent: 'start' }}>
          {filtered.map((auto) => {
            const initials = getInitials(auto.name)
            const gradient = getInitialsGradient(auto.name)
            return (
              <div
                key={auto.id}
                className="bg-codebox-card border border-codebox-border/60 rounded-[14px] p-5 flex flex-col min-h-[134px] cursor-pointer transition-all duration-200 hover:bg-codebox-card-hover hover:border-white/14 hover:-translate-y-px hover:shadow-lg"
                onClick={() => setSelectedAuto(auto)}
              >
                <div className="flex justify-between items-start mb-3.5">
                  <div className="flex gap-3.5 items-center">
                    <div className={`w-10 h-10 rounded-[10px] bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold`}>
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-[15px] font-semibold text-codebox-primary leading-tight mb-0.5 truncate max-w-[180px]">{auto.name}</div>
                      <span className={`text-[11px] font-medium ${auto.enabled ? 'text-codebox-green' : 'text-codebox-muted'}`}>
                        {auto.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                      auto.enabled
                        ? 'text-codebox-green bg-codebox-green/10 hover:bg-red-500/15 hover:text-red-400'
                        : 'text-codebox-secondary hover:bg-white/8 hover:text-codebox-primary'
                    }`}
                    onClick={(e) => { e.stopPropagation(); toggleAutomation(auto.id) }}
                    title={auto.enabled ? 'Click to pause' : 'Click to activate'}
                  >
                    {auto.enabled ? (
                      <Clock size={16} strokeWidth={2.5} />
                    ) : (
                      <Plus size={18} strokeWidth={2} />
                    )}
                  </button>
                </div>
                <p className="text-[13px] text-codebox-secondary/90 leading-relaxed line-clamp-2 mb-2">{auto.prompt}</p>
                <div className="mt-auto flex items-center gap-3 text-[11px] text-codebox-muted">
                  <span className="font-mono">{auto.schedule}</span>
                  {auto.lastRun && <span>Last: {new Date(auto.lastRun).toLocaleDateString()}</span>}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-codebox-muted">
            <Clock size={44} className="mb-3 opacity-40" />
            <h3 className="text-base text-codebox-secondary font-medium mb-1">No automations found</h3>
            <p className="text-[13px]">
              {search ? 'Try searching for a different keyword.' : 'Schedule recurring agent tasks to run in the background.'}
            </p>
          </div>
        )}
      </div>

      {selectedAuto && (
        <>
          <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setSelectedAuto(null)} />
          <div
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-codebox-sidebar border-l border-codebox-border z-30 p-8 flex flex-col justify-between shadow-2xl"
            style={{ animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <style>{`@keyframes drawerSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
            <button
              className="absolute top-5 right-5 text-codebox-secondary hover:text-codebox-primary p-1.5 rounded-md hover:bg-white/5 transition-colors"
              onClick={() => setSelectedAuto(null)}
            >
              <X size={18} />
            </button>
            <div>
              <div className={`w-14 h-14 rounded-[12px] bg-gradient-to-br ${getInitialsGradient(selectedAuto.name)} flex items-center justify-center mb-4 text-white text-lg font-bold`}>
                {getInitials(selectedAuto.name)}
              </div>
              <h2 className="text-xl font-semibold text-codebox-primary mb-1">{selectedAuto.name}</h2>
              <div className="text-codebox-muted text-[13px] mb-4">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium uppercase ${selectedAuto.enabled ? 'bg-codebox-green/10 text-codebox-green' : 'bg-codebox-input text-codebox-muted'}`}>
                  {selectedAuto.enabled ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="h-px bg-codebox-border mb-4" />
              <p className="text-codebox-secondary text-sm leading-relaxed mb-6">{selectedAuto.prompt}</p>
              <div className="bg-codebox-bg border border-codebox-border rounded-[10px] p-3.5 text-[13px] text-codebox-secondary">
                <div className="flex justify-between mb-2">
                  <span>Schedule</span>
                  <span className="text-codebox-primary font-mono">{selectedAuto.schedule}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Status</span>
                  <span className="text-codebox-primary">{selectedAuto.enabled ? 'Active' : 'Paused'}</span>
                </div>
                {selectedAuto.lastRun && (
                  <div className="flex justify-between mb-2">
                    <span>Last Run</span>
                    <span className="text-codebox-primary">{new Date(selectedAuto.lastRun).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Next Run</span>
                  <span className="text-codebox-primary">{selectedAuto.nextRun ? new Date(selectedAuto.nextRun).toLocaleString() : '—'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[10px] font-semibold text-sm border-none cursor-pointer transition-colors bg-codebox-blue text-white hover:bg-blue-600"
                onClick={() => { runNow(selectedAuto.id); setSelectedAuto(null) }}
              >
                <PlayCircle size={16} /> Run Now
              </button>
              <button
                className={`flex-1 py-3 rounded-[10px] font-semibold text-sm border-none cursor-pointer transition-colors ${
                  selectedAuto.enabled
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-codebox-primary text-codebox-bg hover:opacity-90'
                }`}
                onClick={() => { toggleAutomation(selectedAuto.id); setSelectedAuto({ ...selectedAuto, enabled: !selectedAuto.enabled }) }}
              >
                {selectedAuto.enabled ? 'Pause' : 'Resume'}
              </button>
              <button
                className="py-3 px-4 rounded-[10px] font-semibold text-sm border-none cursor-pointer transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30"
                onClick={() => { removeAutomation(selectedAuto.id); setSelectedAuto(null) }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
