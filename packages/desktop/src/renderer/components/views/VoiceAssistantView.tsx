import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from '@/store'
import {
  Mic, MicOff, Volume2, VolumeX, Radio, Wifi, WifiOff,
  RefreshCw, Settings, Zap, MessageSquare, Activity,
} from 'lucide-react'

type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error'

const STATUS_COLORS: Record<VoiceStatus, string> = {
  idle: 'text-codebox-muted',
  connecting: 'text-codebox-blue',
  listening: 'text-codebox-green',
  thinking: 'text-codebox-purple',
  speaking: 'text-codebox-blue',
  error: 'text-codebox-red',
}

const STATUS_LABELS: Record<VoiceStatus, string> = {
  idle: 'Voice assistant idle',
  connecting: 'Connecting to Gemini Live...',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
  error: 'Connection error — tap to retry',
}

export default function VoiceAssistantView() {
  const { isOrbConnected, toggleOrbConnection, orbTranscript, setOrbTranscript, setOrbListening } = useStore()
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [muted, setMuted] = useState(false)
  const [outputMuted, setOutputMuted] = useState(false)
  const [transcript, setTranscript] = useState<{ role: 'user' | 'ai'; text: string; ts: number }[]>([])
  const [latency, setLatency] = useState<number | null>(null)
  const [pushToTalk, setPushToTalk] = useState(false)
  const waveformRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    drawWaveform()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [status])

  const drawWaveform = useCallback(() => {
    const canvas = waveformRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const bars = 40
    const barW = W / bars - 2
    const isActive = status === 'listening' || status === 'speaking' || status === 'thinking'

    for (let i = 0; i < bars; i++) {
      const seed = isActive ? Math.random() : 0.15
      const h = isActive ? 8 + seed * (H * 0.7) : H * 0.15
      const x = i * (barW + 2)
      const y = (H - h) / 2

      ctx.fillStyle = status === 'listening'
        ? `rgba(16, 185, 129, ${0.4 + seed * 0.6})`
        : status === 'speaking'
        ? `rgba(59, 130, 246, ${0.4 + seed * 0.6})`
        : status === 'thinking'
        ? `rgba(139, 92, 246, ${0.4 + seed * 0.6})`
        : 'rgba(92, 92, 97, 0.4)'
      ctx.beginPath()
      ctx.roundRect(x, y, barW, h, 2)
      ctx.fill()
    }

    if (isActive) {
      animFrameRef.current = requestAnimationFrame(drawWaveform)
    }
  }, [status])

  const handleConnect = useCallback(() => {
    if (status === 'idle' || status === 'error') {
      setStatus('connecting')
      setTimeout(() => {
        setStatus('listening')
        setLatency(42)
        toggleOrbConnection()
        setOrbListening(true)
        setTranscript((prev) => [
          ...prev,
          { role: 'ai', text: 'Eburon Voice is ready. How can I help you build?', ts: Date.now() },
        ])
      }, 1200)
    } else {
      setStatus('idle')
      setLatency(null)
      toggleOrbConnection()
      setOrbListening(false)
    }
  }, [status])

  const simulateVoiceRound = useCallback(() => {
    if (status !== 'listening') return
    const userUtterance = 'Create a TypeScript utility function to debounce async functions'
    setStatus('thinking')
    setTranscript((prev) => [...prev, { role: 'user', text: userUtterance, ts: Date.now() }])
    setTimeout(() => {
      setStatus('speaking')
      setTranscript((prev) => [
        ...prev,
        { role: 'ai', text: "Here's a debounce utility for async functions. I'll write the implementation and show you a diff preview.", ts: Date.now() },
      ])
      setTimeout(() => setStatus('listening'), 2500)
    }, 1800)
  }, [status])

  return (
    <div className="w-full max-w-[760px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Voice Assistant</h2>
          <p className="text-[13px] text-codebox-secondary mt-0.5">Gemini Live Audio · realtime voice-to-code</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg border ${
            status === 'idle' || status === 'error'
              ? 'border-codebox-border text-codebox-muted'
              : 'border-codebox-green/40 text-codebox-green bg-codebox-green/5'
          }`}>
            {status !== 'idle' && status !== 'error' ? <Wifi size={13} /> : <WifiOff size={13} />}
            {latency !== null ? `${latency}ms` : 'Disconnected'}
          </div>
          <button className="p-2 rounded-lg border border-codebox-border text-codebox-secondary hover:bg-white/5 cursor-pointer bg-transparent">
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Main orb / connection area */}
      <div className="bg-codebox-card border border-codebox-border rounded-2xl p-8 flex flex-col items-center gap-6">
        <button
          className={`relative w-28 h-28 rounded-full flex items-center justify-center cursor-pointer border-none transition-all duration-300 ${
            status === 'idle'
              ? 'bg-codebox-input hover:bg-codebox-border'
              : status === 'listening'
              ? 'bg-codebox-green/10 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
              : status === 'thinking'
              ? 'bg-codebox-purple/10 shadow-[0_0_40px_rgba(139,92,246,0.3)]'
              : status === 'speaking'
              ? 'bg-codebox-blue/10 shadow-[0_0_40px_rgba(59,130,246,0.3)]'
              : status === 'connecting'
              ? 'bg-codebox-blue/10 animate-pulse'
              : 'bg-red-500/10'
          }`}
          onClick={handleConnect}
          title={status === 'idle' || status === 'error' ? 'Start voice session' : 'End session'}
        >
          {status === 'connecting' ? (
            <RefreshCw size={36} className="text-codebox-blue animate-spin" strokeWidth={1.5} />
          ) : status === 'idle' || status === 'error' ? (
            <Mic size={36} className={STATUS_COLORS[status]} strokeWidth={1.5} />
          ) : (
            <Mic size={36} className={`${STATUS_COLORS[status]} animate-pulse`} strokeWidth={1.5} />
          )}

          {(status === 'listening' || status === 'speaking') && (
            <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-30" style={{ color: status === 'listening' ? '#10b981' : '#3b82f6' }} />
          )}
        </button>

        <div className="text-center">
          <div className={`text-sm font-medium ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</div>
          {status !== 'idle' && status !== 'error' && (
            <div className="text-[12px] text-codebox-muted mt-1">Click orb to end session</div>
          )}
        </div>

        {/* Waveform */}
        <canvas
          ref={waveformRef}
          width={600}
          height={64}
          className="w-full max-w-[500px] h-16 rounded-lg"
        />

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium cursor-pointer bg-transparent transition-all ${
              muted ? 'border-codebox-red text-codebox-red bg-red-500/10' : 'border-codebox-border text-codebox-secondary hover:border-codebox-secondary'
            }`}
            onClick={() => setMuted(!muted)}
          >
            {muted ? <MicOff size={15} /> : <Mic size={15} />}
            {muted ? 'Unmute' : 'Mute mic'}
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium cursor-pointer bg-transparent transition-all ${
              outputMuted ? 'border-codebox-red text-codebox-red bg-red-500/10' : 'border-codebox-border text-codebox-secondary hover:border-codebox-secondary'
            }`}
            onClick={() => setOutputMuted(!outputMuted)}
          >
            {outputMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {outputMuted ? 'Unmute output' : 'Mute output'}
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium cursor-pointer bg-transparent transition-all ${
              pushToTalk ? 'border-codebox-blue text-codebox-blue bg-codebox-blue/10' : 'border-codebox-border text-codebox-secondary hover:border-codebox-secondary'
            }`}
            onClick={() => setPushToTalk(!pushToTalk)}
          >
            <Radio size={15} />
            Push to talk
          </button>
        </div>

        {status === 'listening' && (
          <button
            className="flex items-center gap-2 text-[12.5px] text-codebox-secondary hover:text-codebox-primary border border-dashed border-codebox-border px-4 py-2 rounded-xl cursor-pointer bg-transparent hover:border-codebox-secondary transition-all"
            onClick={simulateVoiceRound}
          >
            <Activity size={14} /> Simulate voice round
          </button>
        )}
      </div>

      {/* Voice commands reference */}
      <div className="bg-codebox-card border border-codebox-border rounded-xl p-4">
        <div className="text-xs font-medium text-codebox-muted uppercase tracking-wider mb-3">Voice Commands</div>
        <div className="grid grid-cols-2 gap-2 text-[12.5px] text-codebox-secondary">
          {[
            'Open project', 'Create file', 'Rename file', 'Explain code',
            'Fix bug', 'Run tests', 'Commit changes', 'Generate docs',
            'Refactor', 'Review PR', 'Install dependency', 'Undo / Redo',
          ].map((cmd) => (
            <div key={cmd} className="flex items-center gap-2 py-1">
              <Zap size={11} className="text-codebox-blue flex-shrink-0" />
              <span>"{cmd}"</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-codebox-muted uppercase tracking-wider">Transcript</div>
            <button
              className="text-[11px] text-codebox-secondary hover:text-codebox-primary cursor-pointer bg-transparent border-none"
              onClick={() => setTranscript([])}
            >
              Clear
            </button>
          </div>
          <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto">
            {transcript.map((item, i) => (
              <div key={i} className={`flex gap-2.5 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {item.role === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-codebox-purple/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare size={12} className="text-codebox-purple" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[12.5px] leading-relaxed ${
                  item.role === 'user'
                    ? 'bg-codebox-input border border-codebox-border text-codebox-primary'
                    : 'bg-codebox-purple/10 border border-codebox-purple/20 text-codebox-primary'
                }`}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
