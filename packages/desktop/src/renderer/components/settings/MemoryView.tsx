import { useState, useEffect, useMemo } from 'react'
import { getMemoryStore, Memory } from '@/lib/memory'
import { getSkillManager } from '@/lib/skills'
import { Brain, Search, Trash2, Sparkles, X, ChevronDown, Radio, Check } from 'lucide-react'
import { showToast } from '@/components/Toast'

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

const TYPE_META: Record<string, { label: string; color: string }> = {
  convention: { label: 'Convention', color: 'text-blue-400' },
  preference: { label: 'Preference', color: 'text-violet-400' },
  gotcha: { label: 'Gotcha', color: 'text-amber-400' },
  pattern: { label: 'Pattern', color: 'text-emerald-400' },
  relationship: { label: 'Relationship', color: 'text-rose-400' },
}

const TYPE_ORDER = ['convention', 'preference', 'gotcha', 'pattern', 'relationship']

export default function MemoryView() {
  const [search, setSearch] = useState('')
  const [memories, setMemories] = useState<Memory[]>([])
  const [skillCount, setSkillCount] = useState(0)
  const [learningEnabled, setLearningEnabled] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<'featured' | 'asc' | 'desc'>('featured')
  const [sortOpen, setSortOpen] = useState(false)
  const [selectedMem, setSelectedMem] = useState<Memory | null>(null)

  useEffect(() => {
    getMemoryStore().getAll().then(setMemories)
    getSkillManager().getAll().then((s) => setSkillCount(s.length))
  }, [])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of memories) {
      counts[m.type] = (counts[m.type] || 0) + 1
    }
    return counts
  }, [memories])

  const displayed = useMemo(() => {
    let result = memories
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((m) => m.content.toLowerCase().includes(q))
    }
    if (filter === 'high') result = result.filter((m) => m.confidence >= 0.75)
    else if (filter === 'low') result = result.filter((m) => m.confidence < 0.5)
    if (typeFilter) result = result.filter((m) => m.type === typeFilter)
    if (sort === 'asc') result = [...result].sort((a, b) => a.content.localeCompare(b.content))
    else if (sort === 'desc') result = [...result].sort((a, b) => b.content.localeCompare(a.content))
    return result
  }, [memories, search, filter, typeFilter, sort])

  const closeAllDropdowns = () => { setSortOpen(false) }

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

  return (
    <div className="w-full min-h-screen flex flex-col" onClick={closeAllDropdowns}>
      <div className="flex-1 w-full max-w-[960px] flex flex-col px-5 pt-8 pb-32 mx-auto">
        <div className="flex items-center justify-between border-b border-codebox-border pb-3 mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-codebox-primary">Memory &amp; Profile</h2>
            <span className="text-xs text-codebox-secondary">{memories.length} memories · {skillCount} skills</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-[11px] text-codebox-secondary font-medium">Learn</span>
              <div
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${learningEnabled ? 'bg-codebox-blue' : 'bg-codebox-border'}`}
                onClick={() => setLearningEnabled(!learningEnabled)}
              >
                <div className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-all duration-200 flex items-center justify-center ${learningEnabled ? 'left-[17px]' : 'left-[3px]'}`}>
                  <Radio size={8} className={`${learningEnabled ? 'text-codebox-blue' : 'text-codebox-border'}`} strokeWidth={3} />
                </div>
              </div>
            </label>
            <button className="flex items-center gap-1.5 text-xs bg-codebox-button border border-codebox-border rounded-lg px-3 py-2 text-codebox-primary hover:bg-codebox-button-hover transition-colors" onClick={handleLearn}>
              <Sparkles size={13} /> Seed
            </button>
          </div>
        </div>

        <div className="relative w-full mb-5">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-codebox-muted pointer-events-none" />
          <input
            type="text"
            className="w-full h-11 bg-codebox-input border border-codebox-border rounded-[10px] pl-11 pr-10 text-codebox-primary text-sm outline-none transition-all focus:bg-codebox-bg focus:border-codebox-border/20"
            placeholder="Search memories..."
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
          <div className="flex gap-1 bg-black/15 p-[3px] rounded-[10px] border border-white/[0.03] flex-wrap">
            <button
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'all' && !typeFilter ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => { setFilter('all'); setTypeFilter(null) }}
            >
              All
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'high' ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => { setFilter('high'); setTypeFilter(null) }}
            >
              High ({memories.filter((m) => m.confidence >= 0.75).length})
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'low' ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => { setFilter('low'); setTypeFilter(null) }}
            >
              Low ({memories.filter((m) => m.confidence < 0.5).length})
            </button>
            <span className="w-px bg-codebox-border self-center mx-1 h-4" />
            {TYPE_ORDER.map((type) => {
              const count = typeCounts[type] || 0
              if (count === 0) return null
              const meta = TYPE_META[type] || { label: type, color: 'text-codebox-muted' }
              return (
                <button
                  key={type}
                  className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${typeFilter === type ? 'bg-codebox-card shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
                  onClick={() => { setTypeFilter(typeFilter === type ? null : type); setFilter('all') }}
                >
                  <span className={typeFilter === type ? meta.color : ''}>
                    {meta.label} ({count})
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2.5 relative">
            <div className="relative">
              <button
                className="flex items-center gap-2 bg-codebox-button border border-codebox-border rounded-lg px-3.5 py-1.5 text-codebox-primary text-[13px] font-medium hover:bg-codebox-button-hover transition-colors"
                onClick={(e) => { e.stopPropagation(); setSortOpen(!sortOpen) }}
              >
                <span>{sort === 'asc' ? 'Content (A-Z)' : sort === 'desc' ? 'Content (Z-A)' : 'Sort by'}</span>
                <ChevronDown size={14} className="text-codebox-secondary" />
              </button>
              {sortOpen && (
                <div className="absolute top-10 right-0 bg-codebox-sidebar border border-codebox-border/50 rounded-[10px] shadow-xl py-1.5 w-44 z-50 flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                  {[
                    { val: 'featured', label: 'Featured' },
                    { val: 'asc', label: 'Content (A-Z)' },
                    { val: 'desc', label: 'Content (Z-A)' },
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

        <div className="grid grid-cols-2 gap-3.5 overflow-y-auto pb-5" style={{ alignContent: 'start' }}>
          {displayed.map((mem) => {
            const meta = TYPE_META[mem.type] || { label: mem.type, color: 'text-codebox-muted' }
            const preview = mem.content.length > 80 ? mem.content.slice(0, 80) + '...' : mem.content
            const initials = getInitials(mem.type)
            const gradient = getInitialsGradient(mem.type)
            return (
              <div
                key={mem.id}
                className="bg-codebox-card border border-codebox-border/60 rounded-[14px] p-5 flex flex-col min-h-[134px] cursor-pointer transition-all duration-200 hover:bg-codebox-card-hover hover:border-white/14 hover:-translate-y-px hover:shadow-lg"
                onClick={() => setSelectedMem(mem)}
              >
                <div className="flex justify-between items-start mb-3.5">
                  <div className="flex gap-3.5 items-center">
                    <div className={`w-10 h-10 rounded-[10px] bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold`}>
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-[15px] font-semibold text-codebox-primary leading-tight mb-0.5 truncate max-w-[180px]">{meta.label}</div>
                      <span className={`text-[12.5px] font-medium ${meta.color}`}>
                        {Math.round(mem.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                    mem.confidence >= 0.75
                      ? 'text-codebox-green bg-codebox-green/10'
                      : 'text-codebox-secondary bg-codebox-input'
                  }`}>
                    {mem.confidence >= 0.75 ? <Check size={16} strokeWidth={2.5} /> : <Brain size={16} />}
                  </div>
                </div>
                <p className="text-[13px] text-codebox-secondary/90 leading-relaxed line-clamp-2">{preview}</p>
              </div>
            )
          })}
        </div>

        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-codebox-muted">
            <Brain size={44} className="mb-3 opacity-40" />
            <h3 className="text-base text-codebox-secondary font-medium mb-1">No memories found</h3>
            <p className="text-[13px]">
              {search ? 'Try searching for a different keyword.' : 'Eburon learns from your sessions over time. Click "Seed" to add initial memories.'}
            </p>
          </div>
        )}
      </div>

      {selectedMem && (
        <>
          <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setSelectedMem(null)} />
          <div
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-codebox-sidebar border-l border-codebox-border z-30 p-8 flex flex-col justify-between shadow-2xl"
            style={{ animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <style>{`@keyframes drawerSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
            <button
              className="absolute top-5 right-5 text-codebox-secondary hover:text-codebox-primary p-1.5 rounded-md hover:bg-white/5 transition-colors"
              onClick={() => setSelectedMem(null)}
            >
              <X size={18} />
            </button>
            <div>
              <div className={`w-14 h-14 rounded-[12px] bg-gradient-to-br ${getInitialsGradient(selectedMem.type)} flex items-center justify-center mb-4 text-white text-lg font-bold`}>
                {getInitials(selectedMem.type)}
              </div>
              <h2 className="text-xl font-semibold text-codebox-primary mb-1">{TYPE_META[selectedMem.type]?.label || selectedMem.type}</h2>
              <div className="text-codebox-muted text-[13px] mb-4">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium uppercase ${TYPE_META[selectedMem.type]?.color || 'text-codebox-muted'}`}>
                  {Math.round(selectedMem.confidence * 100)}% confidence
                </span>
              </div>
              <div className="h-px bg-codebox-border mb-4" />
              <p className="text-codebox-secondary text-sm leading-relaxed mb-6">{selectedMem.content}</p>
              <div className="bg-codebox-bg border border-codebox-border rounded-[10px] p-3.5 text-[13px] text-codebox-secondary">
                <div className="flex justify-between mb-2">
                  <span>Type</span>
                  <span className="text-codebox-primary capitalize">{selectedMem.type}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Project</span>
                  <span className="text-codebox-primary">{selectedMem.project}</span>
                </div>
                {selectedMem.sourceSession && (
                  <div className="flex justify-between mb-2">
                    <span>Source</span>
                    <span className="text-codebox-primary">{selectedMem.sourceSession}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="text-codebox-primary">{new Date(selectedMem.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button
              className="w-full py-3 rounded-[10px] font-semibold text-sm border-none cursor-pointer transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30"
              onClick={() => {
                setSelectedMem(null)
                showToast('Memory deleted')
              }}
            >
              <Trash2 size={16} className="inline mr-1.5" /> Delete Memory
            </button>
          </div>
        </>
      )}
    </div>
  )
}