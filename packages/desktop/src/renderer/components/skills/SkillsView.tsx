import { useStore } from '@/store'
import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, ChevronDown } from 'lucide-react'

export default function SkillsView() {
  const { skills, toggleSkill, loadSkills } = useStore()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => { loadSkills() }, [loadSkills])

  const enabledCount = skills.filter((s) => s.enabled).length

  const displayed = useMemo(() => {
    return skills
      .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))
  }, [skills, search])

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-[720px] flex flex-col gap-4 px-5 pt-8 pb-32 mx-auto">
        <div className="flex items-center justify-between border-b border-codebox-border pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-codebox-primary">Skills</h2>
            <span className="text-xs text-codebox-secondary">{enabledCount} of {skills.length} enabled</span>
          </div>
          <button className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} />
            <span>Create Skill</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-codebox-input border border-codebox-border px-3 py-1.5 rounded-lg w-full">
          <Search size={14} className="text-codebox-secondary flex-shrink-0" />
          <input
            className="bg-transparent border-none outline-none text-codebox-primary text-[13px] w-full"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          {displayed.map((skill) => {
            const isExpanded = expanded.has(skill.id)
            return (
              <div key={skill.id} className="border-b border-codebox-border/40 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between py-2.5 px-1 cursor-pointer" onClick={() => toggleExpanded(skill.id)}>
                  <div className="min-w-0 flex-1 pr-2">
                    <span className={`text-sm truncate block ${skill.enabled ? 'text-codebox-primary' : 'text-codebox-secondary'}`}>
                      {skill.name}
                    </span>
                    {!isExpanded && skill.description && (
                      <span className="text-[11px] text-codebox-secondary/60 truncate block mt-0.5">{skill.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ChevronDown size={14} className={`text-codebox-secondary/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    <label className="relative inline-block w-8 h-4 flex-shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={skill.enabled}
                        onChange={() => toggleSkill(skill.id)}
                        className="opacity-0 w-0 h-0"
                      />
                      <span className={`absolute cursor-pointer inset-0 rounded-full transition-colors duration-200 ${skill.enabled ? 'bg-codebox-blue' : 'bg-codebox-border'}`}>
                        <span className={`absolute w-3 h-3 bg-white rounded-full top-0.5 transition-all duration-200 ${skill.enabled ? 'left-[17px]' : 'left-[3px]'}`} />
                      </span>
                    </label>
                  </div>
                </div>
                {isExpanded && skill.description && (
                  <p className="text-[12.5px] text-codebox-secondary leading-relaxed pb-3 px-1">{skill.description}</p>
                )}
              </div>
            )
          })}
        </div>

        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-codebox-secondary">
            <Search size={28} className="mb-2 opacity-40" />
            <p className="text-sm">No skills match your search</p>
          </div>
        )}
      </div>
    </div>
  )
}
