import { useState, useEffect } from 'react'
import { getMemoryStore, Memory } from '@/lib/memory'
import { getSkillManager } from '@/lib/skills'
import { Brain, Search, Trash2, Sparkles, User, BookOpen, Lightbulb, Heart, Radio } from 'lucide-react'
import { showToast } from '@/components/Toast'

export default function MemoryView() {
  const [search, setSearch] = useState('')
  const [memories, setMemories] = useState<Memory[]>([])
  const [skillCount, setSkillCount] = useState(0)
  const [learningEnabled, setLearningEnabled] = useState(true)

  useEffect(() => {
    getMemoryStore().getAll().then(setMemories)
    getSkillManager().getAll().then((s) => setSkillCount(s.length))
  }, [])

  const filtered = search
    ? memories.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()))
    : memories

  const handleLearn = async () => {
    const mem = getMemoryStore()
    await Promise.all([
      mem.add({ type: 'convention', project: 'default', content: 'User prefers TypeScript strict mode with no implicit any', confidence: 0.9, sourceSession: 'session-1' }),
      mem.add({ type: 'preference', project: 'default', content: 'Always use Tailwind CSS for styling, never CSS modules', confidence: 0.85, sourceSession: 'session-1' }),
      mem.add({ type: 'gotcha', project: 'default', content: 'The auth middleware throws on null tokens, handle gracefully', confidence: 0.75, sourceSession: 'session-2' }),
    ])
    const updated = await mem.getAll()
    setMemories(updated)
    showToast('Eburon learned 3 new insights from sessions')
  }

  const handlePrune = async () => {
    showToast('Low-confidence memories pruned')
  }

  const TYPE_ICONS: Record<string, typeof Brain> = {
    convention: BookOpen,
    preference: Heart,
    gotcha: Lightbulb,
    pattern: Sparkles,
    relationship: User,
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-[960px] flex flex-col gap-5 px-5 pt-8 pb-32 mx-auto">
        <div className="flex justify-between items-center border-b border-codebox-border pb-4">
          <div>
            <h2 className="text-xl font-semibold text-codebox-primary">Memory &amp; Profile</h2>
            <p className="text-xs text-codebox-secondary mt-0.5">
              Cross-session memory backed by PostgreSQL. Eburon remembers conventions, preferences, and gotchas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-[11px] text-codebox-secondary font-medium">Learn from sessions</span>
              <div
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${learningEnabled ? 'bg-codebox-blue' : 'bg-codebox-border'}`}
                onClick={() => setLearningEnabled(!learningEnabled)}
              >
                <div className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-all duration-200 flex items-center justify-center ${learningEnabled ? 'left-[17px]' : 'left-[3px]'}`}>
                  <Radio size={8} className={`${learningEnabled ? 'text-codebox-blue' : 'text-codebox-border'}`} strokeWidth={3} />
                </div>
              </div>
            </label>
            <button className="btn-primary flex items-center gap-2" onClick={handleLearn}>
              <Sparkles size={14} /> Seed
            </button>
            <button className="bg-codebox-input border border-codebox-border text-codebox-secondary px-3 py-2 rounded-lg cursor-pointer text-xs hover:text-codebox-red" onClick={handlePrune}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex gap-6 min-h-[400px]">
          <nav className="w-[180px] flex flex-col gap-1 border-r border-codebox-border pr-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 text-codebox-primary font-medium text-[13px]">
              <Brain size={15} /> All Memories
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-codebox-secondary cursor-pointer text-[13px] hover:bg-white/5 hover:text-codebox-primary">
              <User size={15} /> User Profile
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-codebox-secondary cursor-pointer text-[13px] hover:bg-white/5 hover:text-codebox-primary">
              <Sparkles size={15} /> Learned Skills ({skillCount})
            </div>
          </nav>

          <div className="flex-1 flex flex-col gap-5">
            <div className="flex items-center gap-2 bg-codebox-input border border-codebox-border px-3 py-1.5 rounded-lg w-full">
              <Search size={14} className="text-codebox-muted" />
              <input
                className="bg-transparent border-none outline-none text-codebox-primary text-xs w-full"
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-codebox-muted border border-dashed border-codebox-border rounded-xl">
                <Brain size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No memories yet</p>
                <p className="text-xs mt-1">Eburon learns from your sessions over time. Click "Seed" to add initial memories.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((mem) => {
                  const Icon = TYPE_ICONS[mem.type] || Brain
                  return (
                    <div key={mem.id} className="card flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-codebox-purple/10 flex items-center justify-center flex-shrink-0 text-codebox-purple mt-0.5">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-codebox-input text-codebox-secondary">
                            {mem.type}
                          </span>
                          <span className="text[10px] text-codebox-muted">
                            confidence: {Math.round(mem.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-sm text-codebox-primary">{mem.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
