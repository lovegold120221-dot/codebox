import { useStore } from '@/store'
import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, Plus, ChevronDown, Check, X, Loader2, Sparkles,
} from 'lucide-react'

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const BADGE_COLORS = [
  'bg-blue-500/10 text-blue-400',
  'bg-emerald-500/10 text-emerald-400',
  'bg-orange-500/10 text-orange-400',
  'bg-violet-500/10 text-violet-400',
  'bg-pink-500/10 text-pink-400',
  'bg-amber-500/10 text-amber-400',
  'bg-cyan-500/10 text-cyan-400',
  'bg-rose-500/10 text-rose-400',
  'bg-indigo-500/10 text-indigo-400',
  'bg-teal-500/10 text-teal-400',
]

function getBadgeColor(name: string) {
  return BADGE_COLORS[hashString(name) % BADGE_COLORS.length]
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

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  opencode: { label: 'OpenCode', color: 'text-blue-400' },
  hermes: { label: 'Hermes', color: 'text-violet-400' },
  custom: { label: 'Custom', color: 'text-emerald-400' },
  other: { label: 'Other', color: 'text-amber-400' },
}

const CATEGORY_ORDER = ['opencode', 'hermes', 'custom', 'other']

export default function SkillsView() {
  const { skills, toggleSkill, loadSkills, createSkill, setActiveView, setComposerPrompt } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<'featured' | 'asc' | 'desc'>('featured')
  const [sortOpen, setSortOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<typeof displayed[0] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalPrompt, setModalPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadSkills() }, [loadSkills])

  useEffect(() => {
    if (showModal && modalTextareaRef.current) {
      modalTextareaRef.current.focus()
    }
  }, [showModal])

  const enabledCount = skills.filter((s) => s.enabled).length

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of skills) {
      counts[s.category] = (counts[s.category] || 0) + 1
    }
    return counts
  }, [skills])

  const displayed = useMemo(() => {
    let result = skills
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      )
    }
    if (filter === 'enabled') result = result.filter((s) => s.enabled)
    else if (filter === 'disabled') result = result.filter((s) => !s.enabled)
    if (categoryFilter) result = result.filter((s) => s.category === categoryFilter)
    if (sort === 'asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'desc') result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    else {
      result = [...result].sort((a, b) => {
        if (a.category === 'other' && b.category !== 'other') return 1
        if (b.category === 'other' && a.category !== 'other') return -1
        return 0
      })
    }
    return result
  }, [skills, search, filter, categoryFilter, sort])

  const closeAllDropdowns = () => { setSortOpen(false) }

  const handleGenerate = async () => {
    const prompt = modalPrompt.trim()
    if (!prompt) return
    setGenerating(true)
    const ok = await createSkill(prompt)
    setGenerating(false)
    if (ok) {
      setShowModal(false)
      setModalPrompt('')
    }
  }

  const handleSendToChat = () => {
    const prompt = modalPrompt.trim()
    if (!prompt) return
    setComposerPrompt(`Create a skill: ${prompt}`)
    setShowModal(false)
    setModalPrompt('')
    setActiveView('new-thread')
  }

  return (
    <div className="w-full min-h-screen flex flex-col" onClick={closeAllDropdowns}>
      <div className="flex-1 w-full max-w-[960px] flex flex-col px-5 pt-16 pb-32 mx-auto">
        <div className="flex items-center justify-between border-b border-codebox-border pb-3 mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-codebox-primary">Skills</h2>
            <span className="text-xs text-codebox-secondary">{enabledCount} of {skills.length} enabled</span>
          </div>
          <button
            className="flex items-center gap-1.5 text-xs bg-codebox-button border border-codebox-border rounded-lg px-3 py-2 text-codebox-primary hover:bg-codebox-button-hover transition-colors"
            onClick={() => setShowModal(true)}
          >
            <Plus size={13} />
            <span>Add</span>
          </button>
        </div>

        <div className="relative w-full mb-5">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-codebox-muted pointer-events-none" />
          <input
            type="text"
            className="w-full h-11 bg-codebox-input border border-codebox-border rounded-[10px] pl-11 pr-10 text-codebox-primary text-sm outline-none transition-all focus:bg-codebox-bg focus:border-codebox-border/20"
            placeholder="Search skills..."
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
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'all' && !categoryFilter ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => { setFilter('all'); setCategoryFilter(null) }}
            >
              All
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'enabled' ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => { setFilter('enabled'); setCategoryFilter(null) }}
            >
              Enabled ({enabledCount})
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${filter === 'disabled' ? 'bg-codebox-card text-codebox-primary shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              onClick={() => { setFilter('disabled'); setCategoryFilter(null) }}
            >
              Disabled ({skills.length - enabledCount})
            </button>
            <span className="w-px bg-codebox-border self-center mx-1 h-4" />
            {CATEGORY_ORDER.map((cat) => {
              const count = categoryCounts[cat] || 0
              if (count === 0) return null
              const meta = CATEGORY_META[cat] || { label: cat, color: 'text-codebox-muted' }
              return (
                <button
                  key={cat}
                  className={`px-4 py-1.5 rounded-lg text-[13.5px] font-medium transition-all ${categoryFilter === cat ? 'bg-codebox-card shadow-sm' : 'text-codebox-secondary hover:text-codebox-primary'}`}
                  onClick={() => { setCategoryFilter(categoryFilter === cat ? null : cat); setFilter('all') }}
                >
                  <span className={categoryFilter === cat ? meta.color : ''}>
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

        {showModal && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center"
              onClick={() => setShowModal(false)}
            >
              <div
                className="w-full max-w-[520px] bg-codebox-sidebar border border-codebox-border rounded-[16px] p-6 shadow-2xl"
                style={{ animation: 'modalIn 0.2s ease-out' }}
                onClick={(e) => e.stopPropagation()}
              >
                <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }`}</style>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-codebox-blue" />
                    <h3 className="text-base font-semibold text-codebox-primary">Add New Skill</h3>
                  </div>
                  <button
                    className="text-codebox-secondary hover:text-codebox-primary p-1 rounded-md hover:bg-white/5 transition-colors"
                    onClick={() => setShowModal(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-[12px] text-codebox-muted mb-3">
                  Describe what the skill should do. The AI will generate the name, description, and instructions — or send it to chat for a guided creation.
                </p>
                <textarea
                  ref={modalTextareaRef}
                  className="w-full bg-codebox-input border border-codebox-border rounded-[10px] p-3 text-codebox-primary text-sm outline-none resize-none min-h-[100px] transition-all focus:border-codebox-blue/40"
                  placeholder="e.g. A skill that helps with code review by analyzing diffs and suggesting improvements..."
                  value={modalPrompt}
                  onChange={(e) => setModalPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                />
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    className="bg-codebox-input border border-codebox-border text-codebox-secondary px-4 py-2 rounded-lg text-xs cursor-pointer hover:text-codebox-primary transition-colors"
                    onClick={() => { setShowModal(false); setModalPrompt('') }}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-codebox-button border border-codebox-border text-codebox-primary hover:bg-codebox-button-hover transition-colors cursor-pointer"
                    onClick={handleSendToChat}
                    disabled={!modalPrompt.trim()}
                  >
                    <Plus size={14} />
                    Send to Chat
                  </button>
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      generating
                        ? 'bg-codebox-blue/20 text-codebox-blue cursor-not-allowed'
                        : 'bg-codebox-blue text-white hover:bg-blue-600'
                    }`}
                    onClick={handleGenerate}
                    disabled={generating || !modalPrompt.trim()}
                  >
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {generating ? 'Generating...' : 'Generate Skill'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3.5 overflow-y-auto pb-5" style={{ alignContent: 'start' }}>
          {displayed.map((skill) => {
            const initials = getInitials(skill.name)
            const gradient = getInitialsGradient(skill.name)
            const catMeta = CATEGORY_META[skill.category] || { label: skill.category, color: 'text-codebox-muted' }
            return (
              <div
                key={skill.id}
                className="bg-codebox-card border border-codebox-border/60 rounded-[14px] p-5 flex flex-col min-h-[134px] cursor-pointer transition-all duration-200 hover:bg-codebox-card-hover hover:border-white/14 hover:-translate-y-px hover:shadow-lg"
                onClick={() => setSelectedSkill(skill)}
              >
                <div className="flex justify-between items-start mb-3.5">
                  <div className="flex gap-3.5 items-center">
                    <div className={`w-10 h-10 rounded-[10px] bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold`}>
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-[15px] font-semibold text-codebox-primary leading-tight mb-0.5 truncate max-w-[180px]">{skill.name}</div>
                      <div className={`text-[12.5px] font-medium ${catMeta.color}`}>{catMeta.label}</div>
                    </div>
                  </div>
                  <button
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                      skill.enabled
                        ? 'text-codebox-green bg-codebox-green/10 hover:bg-red-500/15 hover:text-red-400'
                        : 'text-codebox-secondary hover:bg-white/8 hover:text-codebox-primary'
                    }`}
                    onClick={(e) => { e.stopPropagation(); toggleSkill(skill.id) }}
                    title={skill.enabled ? 'Click to disable' : 'Click to enable'}
                  >
                    {skill.enabled ? <Check size={16} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2} />}
                  </button>
                </div>
                <p className="text-[13px] text-codebox-secondary/90 leading-relaxed line-clamp-2">{skill.description}</p>
              </div>
            )
          })}
        </div>

        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-codebox-muted">
            <Search size={44} className="mb-3 opacity-40" />
            <h3 className="text-base text-codebox-secondary font-medium mb-1">No skills found</h3>
            <p className="text-[13px]">Try searching for a different keyword or resetting your filters.</p>
          </div>
        )}
      </div>

      {selectedSkill && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setSelectedSkill(null)}
          />
          <div
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-codebox-sidebar border-l border-codebox-border z-30 p-8 flex flex-col justify-between shadow-2xl transition-transform duration-250"
            style={{ animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <style>{`@keyframes drawerSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
            <button
              className="absolute top-5 right-5 text-codebox-secondary hover:text-codebox-primary p-1.5 rounded-md hover:bg-white/5 transition-colors"
              onClick={() => setSelectedSkill(null)}
            >
              <X size={18} />
            </button>
            <div>
              <div className={`w-14 h-14 rounded-[12px] bg-gradient-to-br ${getInitialsGradient(selectedSkill.name)} flex items-center justify-center mb-4 text-white text-lg font-bold`}>
                {getInitials(selectedSkill.name)}
              </div>
              <h2 className="text-xl font-semibold text-codebox-primary mb-1">{selectedSkill.name}</h2>
              <div className="text-codebox-muted text-[13px] mb-4">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium uppercase ${getBadgeColor(selectedSkill.name)}`}>{selectedSkill.type}</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium uppercase ml-2 ${CATEGORY_META[selectedSkill.category]?.color || 'text-codebox-muted'}`}>
                  {CATEGORY_META[selectedSkill.category]?.label || selectedSkill.category}
                </span>
              </div>
              <div className="h-px bg-codebox-border mb-4" />
              <p className="text-codebox-secondary text-sm leading-relaxed mb-6">{selectedSkill.description}</p>
              <div className="bg-codebox-bg border border-codebox-border rounded-[10px] p-3.5 text-[13px] text-codebox-secondary">
                <div className="flex justify-between mb-2">
                  <span>Status</span>
                  <span className="text-codebox-primary">{selectedSkill.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Type</span>
                  <span className="text-codebox-primary capitalize">{selectedSkill.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category</span>
                  <span className="text-codebox-primary">{CATEGORY_META[selectedSkill.category]?.label || selectedSkill.category}</span>
                </div>
              </div>
            </div>
            <button
              className={`w-full py-3 rounded-[10px] font-semibold text-sm border-none cursor-pointer transition-colors ${
                selectedSkill.enabled
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-codebox-primary text-codebox-bg hover:opacity-90'
              }`}
              onClick={() => { toggleSkill(selectedSkill.id); setSelectedSkill({ ...selectedSkill, enabled: !selectedSkill.enabled }) }}
            >
              {selectedSkill.enabled ? 'Disable Skill' : 'Enable Skill'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
