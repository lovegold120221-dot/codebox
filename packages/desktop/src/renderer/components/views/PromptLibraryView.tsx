import { useState } from 'react'
import { useStore, Prompt } from '@/store'
import { BookOpen, Star, StarOff, Plus, Search, Copy, Check, Play } from 'lucide-react'

const CATEGORIES = ['All', 'Understanding', 'Debugging', 'Testing', 'Refactoring', 'Generation', 'Security']

export default function PromptLibraryView() {
  const { prompts, togglePromptFavorite, addPrompt, setActiveView } = useStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('Understanding')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = prompts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || p.category === category
    return matchSearch && matchCat
  })

  const favorites = filtered.filter((p) => p.favorite)
  const others = filtered.filter((p) => !p.favorite)

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard?.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    addPrompt({ id: `prompt-${Date.now()}`, title: newTitle.trim(), content: newContent.trim(), category: newCategory, favorite: false })
    setNewTitle('')
    setNewContent('')
    setShowNew(false)
  }

  return (
    <div className="w-full max-w-[900px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Prompt Library</h2>
          <p className="text-[13px] text-codebox-secondary mt-0.5">{prompts.length} prompts · {prompts.filter((p) => p.favorite).length} favorites</p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-codebox-blue text-white px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer border-none hover:bg-blue-500 transition-colors"
          onClick={() => setShowNew(true)}
        >
          <Plus size={15} /> New Prompt
        </button>
      </div>

      {showNew && (
        <div className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex flex-col gap-3">
          <div className="text-sm font-medium text-codebox-primary">Create Prompt</div>
          <div className="flex gap-3">
            <input
              className="flex-1 bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted"
              placeholder="Prompt title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <select
              className="bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-codebox-secondary"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <textarea
            className="w-full bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted resize-none"
            placeholder="Prompt content..."
            rows={4}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button className="px-3 py-1.5 rounded-lg text-[13px] text-codebox-secondary hover:bg-white/5 cursor-pointer border-none" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="px-3.5 py-1.5 rounded-lg text-[13px] bg-codebox-blue text-white font-medium cursor-pointer border-none hover:bg-blue-500" onClick={handleCreate}>Save</button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-codebox-muted" />
          <input
            className="w-full bg-codebox-input border border-codebox-border text-codebox-primary pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer border transition-all ${
              category === cat
                ? 'bg-codebox-purple/15 border-codebox-purple/40 text-codebox-purple'
                : 'border-codebox-border text-codebox-secondary hover:border-codebox-secondary bg-transparent'
            }`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {favorites.length > 0 && (
        <PromptGroup title="Favorites" prompts={favorites} copiedId={copiedId} onCopy={handleCopy} onToggleFav={togglePromptFavorite} />
      )}
      {others.length > 0 && (
        <PromptGroup title={favorites.length > 0 ? 'All Prompts' : 'Prompts'} prompts={others} copiedId={copiedId} onCopy={handleCopy} onToggleFav={togglePromptFavorite} />
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-codebox-muted text-sm">No prompts found.</div>
      )}
    </div>
  )
}

function PromptGroup({ title, prompts, copiedId, onCopy, onToggleFav }: {
  title: string
  prompts: Prompt[]
  copiedId: string | null
  onCopy: (id: string, content: string) => void
  onToggleFav: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] font-medium text-codebox-muted uppercase tracking-wider px-1">{title}</div>
      {prompts.map((prompt) => (
        <div key={prompt.id} className="bg-codebox-card border border-codebox-border rounded-xl p-4 hover:border-codebox-secondary transition-colors group">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-codebox-primary">{prompt.title}</span>
              <span className="text-[10.5px] px-1.5 py-0.5 rounded-full border border-codebox-border text-codebox-muted">{prompt.category}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer bg-transparent border-none text-codebox-secondary hover:text-codebox-primary"
                onClick={() => onToggleFav(prompt.id)}
                title={prompt.favorite ? 'Unfavorite' : 'Favorite'}
              >
                {prompt.favorite ? <Star size={13} className="text-yellow-400" fill="currentColor" /> : <StarOff size={13} />}
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer bg-transparent border-none text-codebox-secondary hover:text-codebox-primary"
                onClick={() => onCopy(prompt.id, prompt.content)}
                title="Copy"
              >
                {copiedId === prompt.id ? <Check size={13} className="text-codebox-green" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <p className="text-[12.5px] text-codebox-secondary leading-relaxed line-clamp-2">{prompt.content}</p>
        </div>
      ))}
    </div>
  )
}
