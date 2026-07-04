import { useStore } from '@/store'
import { useState, useEffect } from 'react'
import { Clock, Play, Pause, Trash2, Plus, Calendar, Repeat, Zap, Mic, Square } from 'lucide-react'

const SCHEDULE_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9am', value: '0 9 * * *' },
  { label: 'Every Monday 10am', value: '0 10 * * 1' },
  { label: 'Every Friday 5pm', value: '0 17 * * 5' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'First of month', value: '0 0 1 * *' },
]

export default function AutomationsView() {
  const { automations, loadAutomations, addAutomation, toggleAutomation, removeAutomation } = useStore()
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
    <div className="w-full min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-[860px] flex flex-col gap-5 px-5 pt-8 pb-32 mx-auto">
        <div className="flex justify-between items-center border-b border-codebox-border pb-4">
          <div>
            <h2 className="text-xl font-semibold text-codebox-primary">Automations</h2>
            <p className="text-xs text-codebox-secondary mt-0.5">
              Scheduled agent tasks using cron. Create via text or voice.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isListening
                  ? 'bg-codebox-red/20 text-codebox-red animate-pulse'
                  : 'bg-codebox-input border border-codebox-border text-codebox-secondary hover:text-codebox-primary'
              }`}
              onClick={isListening ? () => setIsListening(false) : startVoiceCreate}
            >
              {isListening ? <Square size={14} /> : <Mic size={14} />}
              {isListening ? 'Listening...' : 'Voice Create'}
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Automation
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="card flex flex-col gap-4">
            <h3 className="font-semibold text-sm text-codebox-primary">New Automation</h3>
            <input
              className="bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg outline-none text-sm"
              placeholder="Automation name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[11px] text-codebox-muted uppercase tracking-wider mb-1 block">Cron Schedule</label>
                <input
                  className="w-full bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg outline-none text-sm font-mono"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-codebox-muted uppercase tracking-wider mb-1 block">Presets</label>
                <select
                  className="w-full bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg outline-none text-sm"
                  onChange={(e) => setNewSchedule(e.target.value)}
                >
                  <option value="">Custom...</option>
                  {SCHEDULE_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-codebox-muted uppercase tracking-wider mb-1 block">Agent Prompt</label>
              <textarea
                className="w-full codebox-input rounded-lg"
                rows={3}
                placeholder="What should the agent do on each run?"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-codebox-input border border-codebox-border text-codebox-secondary px-4 py-2 rounded-lg text-xs cursor-pointer hover:text-codebox-primary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        )}

        {automations.length === 0 ? (
          <div className="py-16 text-center text-codebox-muted border border-dashed border-codebox-border rounded-xl">
            <Clock size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No automations configured</p>
            <p className="text-xs mt-1">Schedule recurring agent tasks to run in the background.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {automations.map((auto) => (
              <div key={auto.id} className="card flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${auto.enabled ? 'bg-codebox-green/10 text-codebox-green' : 'bg-codebox-input text-codebox-muted'}`}>
                  {auto.type === 'project' ? <Repeat size={18} /> : <Zap size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-codebox-primary">{auto.name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${auto.enabled ? 'bg-codebox-green/10 text-codebox-green' : 'bg-codebox-input text-codebox-muted'}`}>
                      {auto.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-xs text-codebox-secondary mb-2 line-clamp-2">{auto.prompt}</p>
                  <div className="flex items-center gap-4 text-[11px] text-codebox-muted">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Cron: {auto.schedule}</span>
                    {auto.lastRun && <span>Last: {new Date(auto.lastRun).toLocaleString()}</span>}
                    <span>Next: {auto.nextRun || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    className={`bg-transparent border-none cursor-pointer p-1.5 rounded-md hover:bg-white/5 ${auto.enabled ? 'text-codebox-yellow' : 'text-codebox-green'}`}
                    onClick={() => toggleAutomation(auto.id)}
                    title={auto.enabled ? 'Pause' : 'Resume'}
                  >
                    {auto.enabled ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    className="bg-transparent border-none text-codebox-secondary cursor-pointer p-1.5 rounded-md hover:bg-white/5 hover:text-codebox-red"
                    onClick={() => removeAutomation(auto.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
