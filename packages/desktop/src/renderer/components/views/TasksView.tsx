import { useState } from 'react'
import { useStore, Task } from '@/store'
import { Plus, CheckCircle2, Circle, Loader2, XCircle, Bot, Filter } from 'lucide-react'

type Filter = 'all' | 'pending' | 'in_progress' | 'done' | 'failed'

const STATUS_ICONS: Record<Task['status'], React.ElementType> = {
  pending: Circle,
  in_progress: Loader2,
  done: CheckCircle2,
  failed: XCircle,
}

const STATUS_COLORS: Record<Task['status'], string> = {
  pending: 'text-codebox-muted',
  in_progress: 'text-codebox-blue animate-spin',
  done: 'text-codebox-green',
  failed: 'text-codebox-red',
}

const STATUS_LABELS: Record<Task['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  failed: 'Failed',
}

export default function TasksView() {
  const { tasks, addTask, updateTask, agents } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [newTitle, setNewTitle] = useState('')
  const [showNew, setShowNew] = useState(false)

  const filtered = tasks.filter((t) => filter === 'all' || t.status === filter)

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  }

  const handleCreate = () => {
    if (!newTitle.trim()) return
    addTask({
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      status: 'pending',
      createdAt: Date.now(),
    })
    setNewTitle('')
    setShowNew(false)
  }

  const cycleStatus = (task: Task) => {
    const cycle: Task['status'][] = ['pending', 'in_progress', 'done']
    const idx = cycle.indexOf(task.status)
    const next = cycle[(idx + 1) % cycle.length]
    updateTask(task.id, { status: next })
  }

  return (
    <div className="w-full max-w-[860px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Tasks</h2>
          <p className="text-[13px] text-codebox-secondary mt-0.5">{tasks.length} total tasks across all sessions</p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-codebox-blue text-white px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer border-none hover:bg-blue-500 transition-colors"
          onClick={() => setShowNew(true)}
        >
          <Plus size={15} /> New Task
        </button>
      </div>

      {showNew && (
        <div className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex gap-3">
          <input
            className="flex-1 bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted"
            placeholder="Task description..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button className="px-3 py-2 rounded-lg text-[13px] text-codebox-secondary hover:bg-white/5 cursor-pointer border-none" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="px-3.5 py-2 rounded-lg text-[13px] bg-codebox-blue text-white font-medium cursor-pointer border-none" onClick={handleCreate}>Add</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        <Filter size={13} className="text-codebox-muted mr-1" />
        {(['all', 'pending', 'in_progress', 'done', 'failed'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium cursor-pointer border-none transition-all capitalize ${
              filter === f
                ? 'bg-codebox-input text-codebox-primary border border-codebox-border'
                : 'text-codebox-secondary hover:text-codebox-primary bg-transparent'
            }`}
            onClick={() => setFilter(f)}
          >
            {f === 'in_progress' ? 'In progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] > 0 && (
              <span className="ml-1.5 text-[10px] text-codebox-muted">({counts[f]})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <CheckCircle2 size={36} className="text-codebox-border" strokeWidth={1.5} />
          <div className="text-codebox-muted text-sm">
            {filter === 'all' ? 'No tasks yet.' : `No ${filter.replace('_', ' ')} tasks.`}
          </div>
          {filter === 'all' && (
            <button className="text-codebox-blue text-[13px] cursor-pointer bg-transparent border-none hover:underline" onClick={() => setShowNew(true)}>
              Create your first task
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((task) => {
            const Icon = STATUS_ICONS[task.status]
            const agent = task.agentId ? agents.find((a) => a.id === task.agentId) : null
            return (
              <div
                key={task.id}
                className="bg-codebox-card border border-codebox-border rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-codebox-secondary transition-colors group"
              >
                <button
                  className="bg-transparent border-none cursor-pointer p-0 flex-shrink-0"
                  onClick={() => cycleStatus(task)}
                  title="Cycle status"
                >
                  <Icon size={18} className={STATUS_COLORS[task.status]} />
                </button>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm text-codebox-primary ${task.status === 'done' ? 'line-through text-codebox-muted' : ''}`}>
                    {task.title}
                  </div>
                  {agent && (
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-codebox-secondary">
                      <Bot size={11} /> {agent.name}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[11px] font-medium ${
                    task.status === 'done' ? 'text-codebox-green'
                    : task.status === 'failed' ? 'text-codebox-red'
                    : task.status === 'in_progress' ? 'text-codebox-blue'
                    : 'text-codebox-muted'
                  }`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span className="text-[11px] text-codebox-muted">
                    {formatRelativeTime(task.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}
