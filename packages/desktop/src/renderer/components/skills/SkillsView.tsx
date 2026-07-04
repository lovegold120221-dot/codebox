import { useStore } from '@/store'
import { useState, useMemo, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'
import { Search, Plus, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-react'

const ICON_NAMES = Object.keys(LucideIcons).filter(
  (k) => k[0] === k[0].toUpperCase() && !k.endsWith('Icon') && typeof LucideIcons[k as keyof typeof LucideIcons] === 'object'
)

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getIconForSkill(name: string) {
  const iconName = ICON_NAMES[hashString(name) % ICON_NAMES.length]
  return LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const GRADIENT_PAIRS = [
  ['from-blue-500/20', 'to-purple-500/20', 'text-blue-400'],
  ['from-emerald-500/20', 'to-teal-500/20', 'text-emerald-400'],
  ['from-orange-500/20', 'to-rose-500/20', 'text-orange-400'],
  ['from-violet-500/20', 'to-fuchsia-500/20', 'text-violet-400'],
  ['from-cyan-500/20', 'to-blue-500/20', 'text-cyan-400'],
  ['from-pink-500/20', 'to-rose-500/20', 'text-pink-400'],
  ['from-amber-500/20', 'to-yellow-500/20', 'text-amber-400'],
  ['from-green-500/20', 'to-emerald-500/20', 'text-green-400'],
  ['from-indigo-500/20', 'to-violet-500/20', 'text-indigo-400'],
  ['from-red-500/20', 'to-orange-500/20', 'text-red-400'],
  ['from-teal-500/20', 'to-cyan-500/20', 'text-teal-400'],
  ['from-sky-500/20', 'to-indigo-500/20', 'text-sky-400'],
  ['from-lime-500/20', 'to-green-500/20', 'text-lime-400'],
  ['from-rose-500/20', 'to-pink-500/20', 'text-rose-400'],
  ['from-fuchsia-500/20', 'to-purple-500/20', 'text-fuchsia-400'],
]

function getGradient(name: string) {
  return GRADIENT_PAIRS[hashString(name) % GRADIENT_PAIRS.length]
}

export default function SkillsView() {
  const { skills, toggleSkill, loadSkills } = useStore()
  const [filter, setFilter] = useState<'all' | 'system' | 'custom'>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => { loadSkills() }, [loadSkills])

  const systemCount = skills.filter((s) => s.type === 'system').length
  const customCount = skills.filter((s) => s.type === 'custom').length

  const displayed = useMemo(() => {
    return skills
      .filter((s) => filter === 'all' || s.type === filter)
      .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))
  }, [skills, filter, search])

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderCard = (skill: typeof displayed[0], isList: boolean) => {
    const Icon = getIconForSkill(skill.name)
    const [from, to, textColor] = getGradient(skill.name)
    const isExpanded = expanded.has(skill.id)
    const descLong = skill.description.length > 100

    return (
      <div
        key={skill.id}
        className={`group relative overflow-hidden rounded-xl border border-codebox-border bg-codebox-card/80 backdrop-blur-sm transition-all duration-200 hover:border-codebox-border/60 hover:bg-codebox-card ${
          isList ? 'flex items-center gap-4 px-4 py-3.5' : 'flex flex-col gap-3 p-4'
        }`}
      >
        <div className={`flex items-start gap-3 ${isList ? 'flex-1 min-w-0' : ''}`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${from} ${to} ${textColor}`}>
            <Icon size={20} strokeWidth={1.8} />
          </div>
          <div className={`${isList ? 'flex items-center gap-3 flex-1 min-w-0' : 'flex-1'}`}>
            <div className={`${isList ? 'flex items-center gap-2 min-w-0' : ''}`}>
              <span className="font-semibold text-sm text-codebox-primary truncate">{skill.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase flex-shrink-0 ${
                skill.type === 'system'
                  ? 'bg-codebox-input text-codebox-secondary'
                  : 'text-codebox-purple bg-codebox-purple/10'
              }`}>
                {skill.type}
              </span>
            </div>
            {!isList && (
              <div className="mt-1.5">
                <p className={`text-[12.5px] text-codebox-secondary leading-relaxed transition-all duration-200 ${
                  isExpanded || !descLong ? '' : 'line-clamp-2'
                }`}>
                  {skill.description}
                </p>
                {descLong && (
                  <button
                    onClick={() => toggleExpanded(skill.id)}
                    className="mt-1 flex items-center gap-1 text-[11px] text-codebox-secondary/60 hover:text-codebox-blue transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}
          </div>
          {isList && (
            <p className={`text-[12.5px] text-codebox-secondary leading-relaxed flex-1 min-w-0 transition-all duration-200 ${
              isExpanded ? '' : 'line-clamp-1'
            }`}>
              {skill.description}
            </p>
          )}
          <label className="relative inline-block w-9 h-5 flex-shrink-0 cursor-pointer mt-1.5">
            <input
              type="checkbox"
              checked={skill.enabled}
              onChange={() => toggleSkill(skill.id)}
              className="opacity-0 w-0 h-0"
            />
            <span className={`absolute cursor-pointer inset-0 rounded-full transition-colors duration-200 ${skill.enabled ? 'bg-codebox-blue' : 'bg-codebox-border'}`}>
              <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-transform duration-200 ${skill.enabled ? 'left-[17px]' : 'left-[3px]'}`} />
            </span>
          </label>
        </div>
        {isList && (
          <div className="pl-[52px]">
            <p className={`text-[12.5px] text-codebox-secondary leading-relaxed transition-all duration-200 ${
              isExpanded || !descLong ? '' : 'line-clamp-1'
            }`}>
              {skill.description}
            </p>
            {descLong && (
              <button
                onClick={() => toggleExpanded(skill.id)}
                className="mt-0.5 flex items-center gap-1 text-[11px] text-codebox-secondary/60 hover:text-codebox-blue transition-colors"
              >
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-[960px] flex flex-col gap-5 px-5 pt-8 pb-32 mx-auto">
        <div className="flex justify-between items-center border-b border-codebox-border pb-4">
          <div>
            <h2 className="text-xl font-semibold text-codebox-primary">Skills &amp; Capabilities</h2>
            <p className="text-[12.5px] text-codebox-secondary mt-0.5">
              {skills.length} skills loaded — specialized instructions for your AI agent.
            </p>
          </div>
          <button className="btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            <span>Create Skill</span>
          </button>
        </div>

        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 bg-codebox-input border border-codebox-border px-3 py-1.5 rounded-lg w-[260px]">
            <Search size={14} className="text-codebox-secondary" />
            <input
              className="bg-transparent border-none outline-none text-codebox-primary text-[12.5px] w-full"
              placeholder="Filter skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span
                className={`px-3 py-1.5 rounded-full text-xs cursor-pointer border border-transparent transition-all ${
                  filter === 'all' ? 'bg-codebox-primary text-codebox-bg font-medium' : 'bg-codebox-input text-codebox-secondary hover:text-codebox-primary'
                }`}
                onClick={() => setFilter('all')}
              >
                All ({skills.length})
              </span>
              <span
                className={`px-3 py-1.5 rounded-full text-xs cursor-pointer border border-transparent transition-all ${
                  filter === 'system' ? 'bg-codebox-primary text-codebox-bg font-medium' : 'bg-codebox-input text-codebox-secondary hover:text-codebox-primary'
                }`}
                onClick={() => setFilter('system')}
              >
                System ({systemCount})
              </span>
              <span
                className={`px-3 py-1.5 rounded-full text-xs cursor-pointer border border-transparent transition-all ${
                  filter === 'custom' ? 'bg-codebox-primary text-codebox-bg font-medium' : 'bg-codebox-input text-codebox-secondary hover:text-codebox-primary'
                }`}
                onClick={() => setFilter('custom')}
              >
                Custom ({customCount})
              </span>
            </div>
            <div className="flex items-center gap-1 ml-3 bg-codebox-input border border-codebox-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-codebox-primary/10 text-codebox-primary' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-codebox-primary/10 text-codebox-primary' : 'text-codebox-secondary hover:text-codebox-primary'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-3.5">
            {displayed.map((skill) => renderCard(skill, false))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayed.map((skill) => renderCard(skill, true))}
          </div>
        )}

        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-codebox-secondary">
            <Search size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No skills match your filter</p>
          </div>
        )}
      </div>
    </div>
  )
}
