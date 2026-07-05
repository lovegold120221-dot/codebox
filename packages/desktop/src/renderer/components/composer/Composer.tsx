import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from '@/store'
import { Plus, ArrowUp, GitBranch, Terminal, Loader2, Mic, Folder, X, FileText, ImageIcon, AudioLines } from 'lucide-react'

const MODE_TABS = ['local', 'worktree', 'cloud'] as const

interface Attachment {
  path: string
  name: string
  size: number
  isImage: boolean
  dataUrl?: string
  content?: string
}

export default function Composer() {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [workDir, setWorkDir] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const baseTextRef = useRef('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const {
    activeMode, setActiveMode, addThread, addMessage, activeThreadId,
    setActiveView, setActiveThread, activeView, isStreaming, sendPrompt,
    toggleTerminal, isTerminalOpen, composerPrompt, setComposerPrompt,
  } = useStore()

  const hasText = text.trim().length > 0

  useEffect(() => {
    if (composerPrompt) {
      setText(composerPrompt)
      setComposerPrompt('')
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
      }
    }
  }, [composerPrompt, setComposerPrompt])

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error('mediaDevices.getUserMedia not available')
        alert('Microphone access not available in this context')
        return
      }
      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone access granted, starting recorder')
      streamRef.current = stream
      audioChunksRef.current = []
      baseTextRef.current = text

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
          console.log(`Audio chunk received: ${e.data.size} bytes`)
        }
      }
      recorder.onstop = async () => {
        // Stop all audio tracks
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        const totalSize = audioChunksRef.current.reduce((sum, c) => sum + c.size, 0)
        console.log(`Recording stopped, ${audioChunksRef.current.length} chunks, ${totalSize} bytes total`)

        if (audioChunksRef.current.length === 0) {
          setIsListening(false)
          return
        }

        setIsTranscribing(true)
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const arrayBuffer = await audioBlob.arrayBuffer()
        console.log(`Sending ${arrayBuffer.byteLength} bytes to whisper`)

        const api = (window as any).electronAPI
        if (!api?.transcribeAudio) {
          console.error('transcribeAudio IPC not available')
          setIsTranscribing(false)
          setIsListening(false)
          return
        }
        try {
          const result = await api.transcribeAudio(arrayBuffer)
          console.log('Whisper result:', result)
          if (result.success && result.transcript) {
            const base = baseTextRef.current
            const combined = base ? base + ' ' + result.transcript.trim() : result.transcript.trim()
            setText(combined)
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto'
              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
            }
          } else {
            console.warn('Transcription failed:', result.error)
          }
        } catch (err) {
          console.error('Transcription IPC error:', err)
        }
        setIsTranscribing(false)
        setIsListening(false)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsListening(true)
      console.log('MediaRecorder started')
    } catch (err: any) {
      console.error('Microphone access failed:', err.name, err.message)
      alert(`Microphone error: ${err.message}`)
      setIsListening(false)
    }
  }, [text])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isListening, startRecording, stopRecording])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const pickFolder = useCallback(async () => {
    const api = (window as any).electronAPI
    if (!api?.openDirectory) return
    const dir = await api.openDirectory()
    if (dir) setWorkDir(dir)
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const pickFiles = useCallback(async () => {
    const api = (window as any).electronAPI

    // Electron path: native file dialog + IPC file read
    if (api?.openFiles && api?.readFile) {
      try {
        const filePaths = await api.openFiles()
        if (!filePaths || filePaths.length === 0) return

        const results: Attachment[] = []
        for (const fp of filePaths) {
          const file = await api.readFile(fp)
          if (file && !file.error) {
            results.push({
              path: file.path,
              name: file.name,
              size: file.size,
              isImage: file.isImage,
              dataUrl: file.dataUrl,
              content: file.content,
            })
          }
        }
        setAttachments((prev) => [...prev, ...results])
        return
      } catch {
        // fall through to browser fallback
      }
    }

    // Browser/renderer fallback: hidden <input type="file">
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const results: Attachment[] = []
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/')
      if (isImage) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        results.push({
          path: file.name,
          name: file.name,
          size: file.size,
          isImage: true,
          dataUrl,
        })
      } else {
        const content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsText(file)
        })
        results.push({
          path: file.name,
          name: file.name,
          size: file.size,
          isImage: false,
          content,
        })
      }
    }

    setAttachments((prev) => [...prev, ...results])
    // Reset so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 150) + 'px'
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && text.trim() && !isStreaming) {
      e.preventDefault()
      send()
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow newline
    }
  }, [text, isStreaming])

  const send = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    let fullPrompt = trimmed

    if (attachments.length > 0) {
      const attachmentContext = attachments.map((a) => {
        if (a.isImage) {
          return `[Image: ${a.name}]`
        }
        return `[File: ${a.name}]\n\`\`\`\n${a.content || ''}\n\`\`\``
      }).join('\n\n')
      fullPrompt = `${attachmentContext}\n\n${trimmed}`
    }

    if (workDir) {
      fullPrompt = `[Working directory: ${workDir}]\n\n${fullPrompt}`
    }

    const threadId = activeThreadId || `thread-${Date.now()}`
    const shortTitle = trimmed.slice(0, 24) + (trimmed.length > 24 ? '...' : '')

    if (!activeThreadId) {
      addThread({
        id: threadId,
        title: shortTitle,
        mode: activeMode,
        projectId: 'default',
        createdAt: Date.now(),
      })
      setActiveThread(threadId)
    }

    const attachmentNames = attachments.length > 0
      ? attachments.map((a) => a.isImage ? `[image: ${a.name}]` : `[file: ${a.name}]`).join(' ')
      : ''

    addMessage(threadId, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: attachmentNames ? `${attachmentNames} ${trimmed}` : trimmed,
      timestamp: Date.now(),
    })

    setText('')
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    if (activeView === 'new-thread') {
      setActiveView('chat')
    }

    await sendPrompt(threadId, fullPrompt)
  }, [text, attachments, workDir, activeThreadId, activeMode, activeView, isStreaming])

  return (
    <footer className="absolute bottom-0 left-0 right-0 px-5 pb-4 bg-gradient-to-t from-codebox-bg from-65% to-transparent flex flex-col items-center pointer-events-none">
      {/* Input container matching reference */}
      <div className="w-full max-w-[720px] rounded-2xl border border-codebox-border shadow-[0_8px_30px_rgba(0,0,0,0.4)] bg-codebox-input pointer-events-auto focus-within:border-codebox-secondary transition-colors">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3.5 pt-3">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-codebox-bg border border-codebox-border rounded-lg px-2.5 py-1.5 max-w-[200px]"
              >
                {att.isImage ? (
                  <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                    {att.dataUrl && <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />}
                  </div>
                ) : (
                  <FileText size={16} className="text-codebox-secondary flex-shrink-0" />
                )}
                <span className="text-[11px] text-codebox-secondary truncate flex-1">{att.name}</span>
                <button
                  className="text-codebox-muted hover:text-codebox-red flex-shrink-0"
                  onClick={() => removeAttachment(i)}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Working directory indicator */}
        {workDir && (
          <div className="flex items-center gap-1.5 px-3.5 pt-2.5 text-[11px] text-codebox-secondary">
            <Folder size={12} className="text-codebox-blue" />
            <span className="truncate font-mono">{workDir}</span>
            <button className="text-codebox-muted hover:text-codebox-red ml-1" onClick={() => setWorkDir(null)}>
              <X size={12} />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="w-full bg-transparent border-none outline-none px-3.5 py-3 text-sm text-codebox-primary placeholder:text-codebox-muted resize-none"
          style={{ minHeight: 40 }}
          placeholder={isStreaming ? 'Waiting for response...' : isListening ? 'Recording... tap stop when done' : isTranscribing ? 'Transcribing audio...' : 'Ask anything or click mic for voice input...'}
          rows={1}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={isStreaming || isTranscribing}
        />
        {(isListening || isTranscribing) && (
          <div className="flex items-center gap-2 px-3.5 pb-1.5">
            {isListening && (
              <>
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 h-2 bg-codebox-red rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-3 bg-codebox-red rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                  <span className="w-0.5 h-1.5 bg-codebox-red rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="w-0.5 h-2.5 bg-codebox-red rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-[11px] text-codebox-red font-medium">Recording</span>
                <span className="text-[11px] text-codebox-muted">— tap stop when done, then edit or send</span>
              </>
            )}
            {isTranscribing && (
              <>
                <Loader2 size={12} className="text-codebox-blue animate-spin" />
                <span className="text-[11px] text-codebox-blue font-medium">Transcribing with Whisper...</span>
              </>
            )}
          </div>
        )}
        <div className="flex items-center justify-between px-3.5 pb-3 pt-1">
          <div className="flex items-center gap-0.5">
            <button
              className={`bg-transparent border-none cursor-pointer p-[6px] rounded-md hover:bg-white/5 hover:text-codebox-primary ${attachments.length > 0 ? 'text-codebox-blue' : 'text-codebox-secondary'}`}
              title="Attach files or images"
              onClick={pickFiles}
            >
              <Plus size={20} />
            </button>
            <button
              className={`bg-transparent border-none cursor-pointer p-[6px] rounded-md hover:bg-white/5 ${isTerminalOpen ? 'text-codebox-green' : 'text-codebox-secondary'} hover:text-codebox-primary`}
              title="Toggle terminal"
              onClick={() => toggleTerminal()}
            >
              <Terminal size={18} />
            </button>
            <button
              className={`bg-transparent border-none cursor-pointer p-[6px] rounded-md hover:bg-white/5 hover:text-codebox-primary ${workDir ? 'text-codebox-blue' : 'text-codebox-secondary'}`}
              title="Set local working directory"
              onClick={pickFolder}
            >
              <Folder size={18} />
            </button>
            <button
              className={`bg-transparent border-none cursor-pointer p-[6px] rounded-md transition-all ${
                isListening ? 'text-codebox-red bg-codebox-red/10'
                : isTranscribing ? 'text-codebox-blue'
                : 'text-codebox-secondary hover:text-codebox-primary hover:bg-white/5'
              }`}
              title={isListening ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Voice input (record + transcribe)'}
              onClick={toggleMic}
              disabled={isTranscribing}
            >
              {isListening ? (
                <span className="w-3.5 h-3.5 rounded-full bg-codebox-red inline-block animate-pulse" />
              ) : isTranscribing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Mic size={18} />
              )}
            </button>
          </div>

          {/* Mode tabs inline on the left */}
          <div className="flex gap-3 text-[11.5px]">
            {MODE_TABS.map((mode) => (
              <span
                key={mode}
                className={`cursor-pointer capitalize ${activeMode === mode ? 'text-codebox-primary font-medium' : 'text-codebox-secondary hover:text-codebox-primary'}`}
                onClick={() => setActiveMode(mode)}
              >
                {mode}
              </span>
            ))}
          </div>

          {/* Send button */}
          <button
            disabled={!hasText || isStreaming}
            className="w-7 h-7 rounded-full bg-codebox-primary text-codebox-bg border-none flex items-center justify-center cursor-pointer transition-transform disabled:bg-codebox-border disabled:text-codebox-muted disabled:cursor-default enabled:hover:scale-105"
            onClick={send}
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </div>

      {/* Branch info */}
      <div className="w-full max-w-[720px] flex items-center justify-between pt-2.5 px-1.5 text-[11.5px] text-codebox-secondary pointer-events-auto">
        <div></div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/5 hover:text-codebox-primary transition-colors px-1.5 py-0.5 rounded" onClick={() => navigator.clipboard?.writeText('eb/codebox-main')}>
          <GitBranch size={14} />
          <span>eb/codebox-main</span>
        </div>
      </div>

      {/* Hidden file input for browser/renderer fallback */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.txt,.md,.json,.csv,.xml,.yaml,.yml,.pdf,.js,.ts,.jsx,.tsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.css,.html,.sh"
        onChange={handleFileInputChange}
      />
    </footer>
  )
}