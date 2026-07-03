import { useState } from 'react'
import { useStore, Thread } from '@/store'
import { History, Search, MessageSquare, Clock, Pin, Trash2, Tag } from 'lucide-react'

export default function HistoryView() {
  const { threads, setActiveThread, setActiveView, removeThread, pinThread, messages } = useStore()
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = Array.from(new Set(threads.flatMap((t) => t.tags || [])))

  const filtered = threads.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchTag = selectedTag === null || (t.tags || []).includes(selectedTag)
    return matchSearch && matchTag
  })

  const grouped = groupByDate(filtered)

  return (
    <div className="w-full max-w-[860px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Session History</h2>
        <p className="text-[13px] text-codebox-secondary mt-0.5">{threads.length} sessions across all projects</p>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-codebox-muted" />
        <input
          className="w-full bg-codebox-input border border-codebox-border text-codebox-primary pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted"
          placeholder="Search history..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            className={`px-2.5 py-1 rounded-full text-[12px] cursor-pointer border transition-all ${selectedTag === null ? 'bg-codebox-input border-codebox-border text-codebox-primary' : 'border-transparent text-codebox-secondary hover:text-codebox-primary bg-transparent'}`}
            onClick={() => setSelectedTag(null)}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] cursor-pointer border transition-all ${
                selectedTag === tag ? 'bg-codebox-blue/15 border-codebox-blue/40 text-codebox-blue' : 'border-codebox-border text-codebox-secondary bg-transparent'
              }`}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              <Tag size={10} /> {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <History size={36} className="text-codebox-border" strokeWidth={1.5} />
          <div className="text-codebox-muted text-sm">No sessions found.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="flex flex-col gap-2">
              <div className="text-[11px] font-medium text-codebox-muted uppercase tracking-wider px-1">{date}</div>
              {items.map((thread) => {
                const msgCount = (messages[thread.id] || []).length
                return (
                  <div
                    key={thread.id}
                    className="bg-codebox-card border border-codebox-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-codebox-secondary transition-colors cursor-pointer group"
                    onClick={() => { setActiveThread(thread.id); setActiveView('chat') }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-codebox-input flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={15} className="text-codebox-secondary" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {thread.pinned && <Pin size={11} className="text-codebox-blue flex-shrink-0" />}
                        <span className="text-sm font-medium text-codebox-primary truncate">{thread.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11.5px] text-codebox-secondary">
                        <span className="flex items-center gap-1"><MessageSquare size={10} /> {msgCount} messages</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {formatTime(thread.createdAt)}</span>
                        <span className="capitalize">{thread.mode}</span>
                        {(thread.tags || []).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded-full bg-codebox-input text-[10px]">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer bg-transparent border-none text-codebox-secondary hover:text-codebox-primary"
                        onClick={(e) => { e.stopPropagation(); pinThread(thread.id) }}
                        title={thread.pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin size={13} className={thread.pinned ? 'text-codebox-blue' : ''} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer bg-transparent border-none text-codebox-secondary hover:text-codebox-red"
                        onClick={(e) => { e.stopPropagation(); removeThread(thread.id) }}
                        title="Delete session"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupByDate(threads: Thread[]): Record<string, Thread[]> {
  const groups: Record<string, Thread[]> = {}
  for (const t of threads) {
    const label = getDateLabel(t.createdAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(t)
  }
  return groups
}

function getDateLabel(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  if (diff < 604800000) return 'This week'
  return 'Older'
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
