import Head from 'next/head'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'

interface GeneratedCaptions {
  imageDescription: string
  contentType: string
  engagementScore: number
  bestTimes: string[]
  captions: Record<string, string>
}

interface UploadedImage {
  id: string
  file: File
  preview: string
  base64: string
  mediaType: string
  status: 'pending' | 'analyzing' | 'done' | 'error'
  result?: GeneratedCaptions
  approvedPlatforms: string[]
  copied: string | null
  scheduledDate?: string
  scheduledTime?: string
  filterBrightness?: number
  filterContrast?: number
  filterSaturate?: number
  captionB?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface User {
  name: string
  email: string
  plan: string
  master: boolean
}

const PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'X (Twitter)', 'LinkedIn', 'Pinterest']

const PCFG: Record<string, { color: string; light: string; emoji: string; grad: string }> = {
  'Instagram':   { color: '#E1306C', light: 'rgba(225,48,108,.1)',  emoji: '📸', grad: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' },
  'TikTok':      { color: '#555',    light: 'rgba(0,0,0,.06)',      emoji: '🎵', grad: 'linear-gradient(135deg,#010101,#69C9D0)' },
  'Facebook':    { color: '#1877F2', light: 'rgba(24,119,242,.1)',  emoji: '📘', grad: 'linear-gradient(135deg,#1877F2,#42a5f5)' },
  'X (Twitter)': { color: '#444',   light: 'rgba(0,0,0,.06)',      emoji: '𝕏',  grad: 'linear-gradient(135deg,#333,#666)' },
  'LinkedIn':    { color: '#0A66C2', light: 'rgba(10,102,194,.1)', emoji: '💼', grad: 'linear-gradient(135deg,#0A66C2,#0e86f8)' },
  'Pinterest':   { color: '#E60023', light: 'rgba(230,0,35,.1)',   emoji: '📌', grad: 'linear-gradient(135deg,#E60023,#ff4d6d)' },
}

type ActiveTab = 'captions' | 'chat' | 'schedule' | 'filters' | 'ab'

export default function Studio() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [business, setBusiness] = useState({ name: '', industry: '', tone: 'Friendly & Professional', description: '' })
  const [setupDone, setSetupDone] = useState(false)
  const [topic, setTopic] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(PLATFORMS)
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false)
  const [activePlatform, setActivePlatform] = useState<string>('Instagram')
  const [sidebarTab, setSidebarTab] = useState<'queue' | 'settings'>('queue')
  const [activeTab, setActiveTab] = useState<ActiveTab>('captions')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your PostWiz AI assistant. I can write captions, suggest content ideas for the week, help you respond to reviews, or answer questions about your performance. What do you need?", timestamp: new Date() }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [abLoading, setAbLoading] = useState(false)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('pw_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const toBase64 = (file: File): Promise<{ base64: string; mediaType: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const [header, base64] = result.split(',')
        const mediaType = header.match(/data:(.*);base64/)?.[1] || 'image/jpeg'
        resolve({ base64, mediaType })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const addImages = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    const newImages: UploadedImage[] = []
    for (const file of imageFiles) {
      const preview = URL.createObjectURL(file)
      const { base64, mediaType } = await toBase64(file)
      newImages.push({
        id: Math.random().toString(36).slice(2), file, preview, base64, mediaType,
        status: 'pending', approvedPlatforms: [], copied: null,
        filterBrightness: 100, filterContrast: 100, filterSaturate: 100
      })
    }
    setImages(prev => {
      const updated = [...prev, ...newImages]
      if (newImages.length > 0 && !activeImage) setActiveImage(newImages[0].id)
      return updated
    })
  }, [activeImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    addImages(Array.from(e.dataTransfer.files))
  }, [addImages])

  const analyzeImage = async (imageId: string) => {
    const img = images.find(i => i.id === imageId)
    if (!img || img.status === 'analyzing') return
    setImages(prev => prev.map(i => i.id === imageId ? { ...i, status: 'analyzing' } : i))
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: img.base64, mediaType: img.mediaType,
          businessName: business.name || 'My Business',
          industry: business.industry || 'Small Business',
          tone: business.tone, description: business.description,
          platforms: selectedPlatforms, topic
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setImages(prev => prev.map(i => i.id === imageId ? { ...i, status: 'done', result: data } : i))
      setActivePlatform(selectedPlatforms[0])
      setActiveTab('captions')
    } catch {
      setImages(prev => prev.map(i => i.id === imageId ? { ...i, status: 'error' } : i))
    }
  }

  const analyzeBulk = async () => {
    setBulkAnalyzing(true)
    for (const img of images.filter(i => i.status === 'pending')) await analyzeImage(img.id)
    setBulkAnalyzing(false)
  }

  const generateAbCaption = async () => {
    if (!activeImg?.result?.captions[activePlatform]) return
    setAbLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: business.name, industry: business.industry, tone: business.tone,
          platform: activePlatform, topic: topic || activeImg.result.imageDescription,
          description: 'Write a DIFFERENT version than this: ' + activeImg.result.captions[activePlatform]
        })
      })
      const data = await res.json()
      setImages(prev => prev.map(i => i.id === activeImage ? { ...i, captionB: data.post } : i))
    } catch {}
    setAbLoading(false)
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim(), timestamp: new Date() }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are PostWiz AI, a social media assistant for small businesses. 
Business: ${business.name || 'Unknown'}, Industry: ${business.industry || 'Small Business'}, Tone: ${business.tone}.
Platforms: ${selectedPlatforms.join(', ')}.
Images uploaded: ${images.length}. Approved posts: ${images.reduce((a, i) => a + i.approvedPlatforms.length, 0)}.

You can: write captions/posts, suggest weekly content ideas, draft review responses, answer analytics questions.
Keep responses concise and actionable. Use emojis naturally. Format lists cleanly.

User message: ${chatInput.trim()}`
            }
          ]
        })
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || "I couldn't process that. Try again!"
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again!", timestamp: new Date() }])
    }
    setChatLoading(false)
  }

  const copyCaption = (imageId: string, platform: string) => {
    const img = images.find(i => i.id === imageId)
    if (!img?.result?.captions[platform]) return
    navigator.clipboard.writeText(img.result.captions[platform])
    setImages(prev => prev.map(i => i.id === imageId ? { ...i, copied: platform } : i))
    setTimeout(() => setImages(prev => prev.map(i => i.id === imageId ? { ...i, copied: null } : i)), 2000)
  }

  const toggleApprove = (imageId: string, platform: string) => {
    setImages(prev => prev.map(i => {
      if (i.id !== imageId) return i
      const has = i.approvedPlatforms.includes(platform)
      return { ...i, approvedPlatforms: has ? i.approvedPlatforms.filter(p => p !== platform) : [...i.approvedPlatforms, platform] }
    }))
  }

  const approveAll = (imageId: string) => setImages(prev => prev.map(i => i.id === imageId ? { ...i, approvedPlatforms: [...selectedPlatforms] } : i))

  const removeImage = (id: string) => {
    setImages(prev => {
      const remaining = prev.filter(i => i.id !== id)
      if (activeImage === id) setActiveImage(remaining[0]?.id || null)
      return remaining
    })
  }

  const updateFilter = (key: 'filterBrightness' | 'filterContrast' | 'filterSaturate', value: number) => {
    setImages(prev => prev.map(i => i.id === activeImage ? { ...i, [key]: value } : i))
  }

  const resetFilters = () => {
    setImages(prev => prev.map(i => i.id === activeImage ? { ...i, filterBrightness: 100, filterContrast: 100, filterSaturate: 100 } : i))
  }

  const schedulePost = () => {
    const img = images.find(i => i.id === activeImage)
    if (!img?.scheduledDate || !img?.scheduledTime) return
    setScheduleLoading(true)
    setTimeout(() => {
      setImages(prev => prev.map(i => i.id === activeImage ? { ...i, approvedPlatforms: [...selectedPlatforms] } : i))
      setScheduleLoading(false)
      alert(`Scheduled for ${img.scheduledDate} at ${img.scheduledTime}!`)
    }, 1200)
  }

  const activeImg = images.find(i => i.id === activeImage)
  const doneCount = images.filter(i => i.status === 'done').length
  const approvedCount = images.reduce((a, i) => a + i.approvedPlatforms.length, 0)
  const pendingCount = images.filter(i => i.status === 'pending').length

  const filterStyle = activeImg ? {
    filter: `brightness(${activeImg.filterBrightness || 100}%) contrast(${activeImg.filterContrast || 100}%) saturate(${activeImg.filterSaturate || 100}%)`
  } : {}

  const TABS: { id: ActiveTab; label: string; emoji: string }[] = [
    { id: 'captions', label: 'Captions', emoji: '✍️' },
    { id: 'chat', label: 'AI Chat', emoji: '💬' },
    { id: 'ab', label: 'A/B Test', emoji: '🧪' },
    { id: 'schedule', label: 'Schedule', emoji: '📅' },
    { id: 'filters', label: 'Filters', emoji: '🎨' },
  ]

  const quickPrompts = [
    '💡 Give me 5 content ideas for this week',
    '⭐ Help me respond to a 1-star review',
    '📊 How is my content performing?',
    '🎯 Write a caption for a weekend special',
  ]

  // SETUP SCREEN
  if (!setupDone) {
    return (
      <>
        <Head><title>PostWiz Studio</title></Head>
        <style>{CSS}</style>
        <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f0eeff,#fdf4ff,#fff5f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 560 }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <a href="/" style={{ textDecoration: 'none' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#1a1035', marginBottom: 6 }}>
                  Post<span style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wiz</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6', background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.2)', padding: '3px 12px', borderRadius: 50, marginLeft: 10 }}>Studio</span>
                </div>
              </a>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#1a1035', marginBottom: 6 }}>Set up your business</h1>
              <p style={{ color: 'rgba(26,16,53,.45)', fontSize: 15 }}>Takes 2 minutes. Done once, remembered forever.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 28, border: '1px solid rgba(139,92,246,.1)', boxShadow: '0 8px 40px rgba(139,92,246,.08)', padding: '36px 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
                {[
                  { label: 'Business Name', key: 'name', placeholder: "Mario's Pizza", type: 'input' },
                  { label: 'Industry', key: 'industry', placeholder: 'Restaurant, Barbershop, Boutique, Gym...', type: 'input' },
                  { label: 'Brand Tone', key: 'tone', type: 'select', options: ['Friendly & Professional', 'Casual & Fun', 'Luxury & Premium', 'Bold & Energetic', 'Warm & Community-Focused'] },
                  { label: 'About Your Business (optional)', key: 'description', placeholder: 'What makes you special?', type: 'textarea' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(26,16,53,.6)', display: 'block', marginBottom: 8 }}>{f.label}</label>
                    {f.type === 'input' && <input value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} placeholder={f.placeholder} className="sinp" />}
                    {f.type === 'select' && <select value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} className="sinp" style={{ appearance: 'none' as const }}>{f.options?.map(o => <option key={o}>{o}</option>)}</select>}
                    {f.type === 'textarea' && <textarea value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={2} className="sinp" style={{ resize: 'vertical' as const }} />}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(26,16,53,.6)', display: 'block', marginBottom: 12 }}>Platforms to generate for</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PLATFORMS.map(p => {
                    const cfg = PCFG[p]; const sel = selectedPlatforms.includes(p)
                    return (
                      <button key={p} onClick={() => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                        style={{ padding: '8px 16px', borderRadius: 50, border: `1.5px solid ${sel ? cfg.color : 'rgba(139,92,246,.15)'}`, background: sel ? cfg.color + '12' : '#fff', color: sel ? cfg.color : 'rgba(26,16,53,.5)', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {cfg.emoji} {p}
                      </button>
                    )
                  })}
                </div>
              </div>
              <button onClick={() => setSetupDone(true)} disabled={!business.name}
                style={{ width: '100%', padding: 16, borderRadius: 14, background: business.name ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(139,92,246,.2)', border: 'none', color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, cursor: business.name ? 'pointer' : 'not-allowed', boxShadow: business.name ? '0 8px 28px rgba(139,92,246,.28)' : 'none', transition: 'all .3s' }}>
                Open Studio →
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>PostWiz Studio — {business.name}</title></Head>
      <style>{CSS}</style>

      <div style={{ minHeight: '100vh', background: '#f8f7ff', display: 'flex', flexDirection: 'column', fontFamily: 'Inter,sans-serif' }}>

        {/* TOP BAR */}
        <header style={{ background: '#fff', borderBottom: '1px solid rgba(139,92,246,.08)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(139,92,246,.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#1a1035' }}>
              Post<span style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wiz</span>
            </a>
            <div style={{ width: 1, height: 20, background: 'rgba(139,92,246,.15)' }} />
            <span style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)', color: '#8b5cf6', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 50 }}>Studio</span>
            {business.name && <span style={{ fontSize: 14, color: 'rgba(26,16,53,.4)' }}>· {business.name}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {pendingCount > 0 && (
              <button onClick={analyzeBulk} disabled={bulkAnalyzing}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 50, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 16px rgba(139,92,246,.3)' }}>
                {bulkAnalyzing ? <><span className="spin" /> Analyzing...</> : <>✨ Analyze All ({pendingCount})</>}
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1.5px solid rgba(139,92,246,.2)', color: '#8b5cf6', padding: '9px 18px', borderRadius: 50, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              + Add Photos
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => addImages(Array.from(e.target.files || []))} />
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,.05)', border: '1px solid rgba(139,92,246,.12)', borderRadius: 50, padding: '6px 14px 6px 8px' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{user.name[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1035' }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: '#8b5cf6' }}>{user.plan}{user.master ? ' · Master' : ''}</div>
                </div>
                <button onClick={() => { localStorage.removeItem('pw_user'); router.push('/login') }}
                  style={{ background: 'rgba(139,92,246,.1)', border: 'none', color: '#8b5cf6', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginLeft: 4 }}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 60px)' }}>

          {/* LEFT — Image gallery */}
          <aside style={{ width: 192, background: '#fff', borderRight: '1px solid rgba(139,92,246,.08)', overflowY: 'auto', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div ref={dropRef} onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onClick={() => fileInputRef.current?.click()}
              style={{ margin: '10px 10px 8px', border: `2px dashed ${dragging ? '#8b5cf6' : 'rgba(139,92,246,.2)'}`, borderRadius: 14, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(139,92,246,.04)' : 'rgba(139,92,246,.01)', transition: 'all .2s' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>📁</div>
              <div style={{ fontSize: 11, color: 'rgba(26,16,53,.4)', fontWeight: 500, lineHeight: 1.4 }}>Drop or click<br />to upload</div>
            </div>
            <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {images.map(img => (
                <div key={img.id} onClick={() => { setActiveImage(img.id); setActiveTab('captions') }}
                  style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${activeImage === img.id ? '#8b5cf6' : 'transparent'}`, boxShadow: activeImage === img.id ? '0 4px 16px rgba(139,92,246,.2)' : 'none', transition: 'all .2s' }}>
                  <img src={img.preview} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block', filter: `brightness(${img.filterBrightness||100}%) contrast(${img.filterContrast||100}%) saturate(${img.filterSaturate||100}%)` }} />
                  <div style={{ position: 'absolute', top: 5, right: 5, background: img.status === 'done' ? '#10b981' : img.status === 'analyzing' ? '#f59e0b' : img.status === 'error' ? '#ef4444' : 'rgba(0,0,0,.4)', borderRadius: 50, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>
                    {img.status === 'done' ? '✓' : img.status === 'analyzing' ? '·' : img.status === 'error' ? '!' : '○'}
                  </div>
                  {img.scheduledDate && <div style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(139,92,246,.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 50 }}>📅</div>}
                  {img.approvedPlatforms.length > 0 && <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(16,185,129,.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 50 }}>{img.approvedPlatforms.length}✓</div>}
                  <button onClick={e => { e.stopPropagation(); removeImage(img.id) }} className="rmv-btn"
                    style={{ position: 'absolute', top: 5, left: 5, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.55)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s' }}>×</button>
                </div>
              ))}
              {images.length === 0 && <div style={{ textAlign: 'center', padding: '16px 6px', color: 'rgba(26,16,53,.3)', fontSize: 11, lineHeight: 1.7 }}>No photos yet.<br />Add some above.</div>}
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8f7ff' }}>
            {!activeImg ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
                <div style={{ width: 96, height: 96, borderRadius: 28, background: 'rgba(139,92,246,.08)', border: '2px dashed rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 20 }}>🖼️</div>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#1a1035', marginBottom: 10 }}>Upload your first photo</h2>
                <p style={{ color: 'rgba(26,16,53,.45)', fontSize: 15, maxWidth: 360, lineHeight: 1.7, marginBottom: 24 }}>AI will analyze each image and write captions for every platform automatically.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', padding: '13px 28px', borderRadius: 50, fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 28px rgba(139,92,246,.28)' }}>
                    📁 Upload Photos
                  </button>
                  <button onClick={() => setActiveTab('chat')}
                    style={{ background: '#fff', border: '1.5px solid rgba(139,92,246,.2)', color: '#8b5cf6', padding: '13px 24px', borderRadius: 50, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    💬 Open AI Chat
                  </button>
                </div>
                <p style={{ color: 'rgba(26,16,53,.3)', fontSize: 12, marginTop: 14 }}>JPG, PNG, WebP · Up to 10MB each</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Image panel */}
                <div style={{ width: 320, flexShrink: 0, background: '#fff', borderRight: '1px solid rgba(139,92,246,.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                  <div style={{ position: 'relative', background: '#f0eeff', flexShrink: 0 }}>
                    <img src={activeImg.preview} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block', ...filterStyle }} />
                    {activeImg.status === 'analyzing' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(248,247,255,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div className="spin" style={{ width: 32, height: 32, borderWidth: 3 }} />
                        <span style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 600 }}>Analyzing with AI...</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(26,16,53,.45)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Campaign / Topic</label>
                      <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Weekend special, new arrival..." className="sinp" style={{ fontSize: 13 }} />
                    </div>
                    {activeImg.status !== 'analyzing' && (
                      <button onClick={() => analyzeImage(activeImg.id)}
                        style={{ background: activeImg.status === 'done' ? 'rgba(139,92,246,.08)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: activeImg.status === 'done' ? '1.5px solid rgba(139,92,246,.2)' : 'none', color: activeImg.status === 'done' ? '#8b5cf6' : '#fff', padding: '12px', borderRadius: 12, fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%', boxShadow: activeImg.status === 'done' ? 'none' : '0 6px 20px rgba(139,92,246,.25)', transition: 'all .25s' }}>
                        {activeImg.status === 'done' ? '↻ Regenerate' : activeImg.status === 'error' ? '↻ Try Again' : '✨ Generate Captions'}
                      </button>
                    )}
                    {activeImg.result && (
                      <div style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.06),rgba(236,72,153,.04))', border: '1px solid rgba(139,92,246,.12)', borderRadius: 14, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>AI Insights</div>
                        <p style={{ fontSize: 11, color: 'rgba(26,16,53,.55)', lineHeight: 1.6, marginBottom: 10 }}>{activeImg.result.imageDescription}</p>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 50, background: 'rgba(139,92,246,.1)', color: '#8b5cf6' }}>{activeImg.result.contentType}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 50, background: activeImg.result.engagementScore >= 8 ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: activeImg.result.engagementScore >= 8 ? '#10b981' : '#f59e0b' }}>Score: {activeImg.result.engagementScore}/10</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(26,16,53,.4)', lineHeight: 1.7 }}>
                          {activeImg.result.bestTimes.map((t, i) => <div key={i}>🕐 {t}</div>)}
                        </div>
                      </div>
                    )}
                    {activeImg.result && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => approveAll(activeImg.id)}
                          style={{ flex: 1, background: 'rgba(16,185,129,.08)', border: '1.5px solid rgba(16,185,129,.2)', color: '#10b981', padding: '10px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                          ✓ Approve All
                        </button>
                        {activeImg.approvedPlatforms.length > 0 && (
                          <div style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap' as const }}>
                            {activeImg.approvedPlatforms.length} ✓
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* TABS + CONTENT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Tab bar */}
                  <div style={{ background: '#fff', borderBottom: '1px solid rgba(139,92,246,.08)', padding: '0 20px', display: 'flex', gap: 4, flexShrink: 0 }}>
                    {TABS.map(t => (
                      <button key={t.id} onClick={() => setActiveTab(t.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px', border: 'none', borderBottom: `2px solid ${activeTab === t.id ? '#8b5cf6' : 'transparent'}`, background: 'transparent', color: activeTab === t.id ? '#8b5cf6' : 'rgba(26,16,53,.45)', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, cursor: 'pointer', transition: 'all .2s', marginBottom: -1 }}>
                        <span>{t.emoji}</span> {t.label}
                        {t.id === 'chat' && <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 50, marginLeft: 2 }}>AI</span>}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                    {/* CAPTIONS TAB */}
                    {activeTab === 'captions' && (
                      <>
                        {!activeImg.result ? (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'rgba(26,16,53,.35)', textAlign: 'center' }}>
                            <div style={{ fontSize: 44 }}>✨</div>
                            <p style={{ fontSize: 15 }}>Click Generate Captions to create<br />platform-optimized content.</p>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                              {selectedPlatforms.filter(p => activeImg.result?.captions[p]).map(p => {
                                const cfg = PCFG[p]; const isActive = activePlatform === p; const isApproved = activeImg.approvedPlatforms.includes(p)
                                return (
                                  <button key={p} onClick={() => setActivePlatform(p)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 50, border: `1.5px solid ${isActive ? cfg.color : 'rgba(139,92,246,.12)'}`, background: isActive ? cfg.color + '12' : '#fff', color: isActive ? cfg.color : 'rgba(26,16,53,.5)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: isActive ? 700 : 400, cursor: 'pointer', transition: 'all .2s' }}>
                                    {cfg.emoji} {p} {isApproved && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />}
                                  </button>
                                )
                              })}
                            </div>
                            {activePlatform && activeImg.result.captions[activePlatform] && (
                              <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${PCFG[activePlatform]?.color}22`, boxShadow: `0 4px 24px ${PCFG[activePlatform]?.color}08`, overflow: 'hidden', marginBottom: 16 }}>
                                <div style={{ background: PCFG[activePlatform]?.grad, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontSize: 20 }}>{PCFG[activePlatform]?.emoji}</span>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Syne,sans-serif' }}>{activePlatform}</span>
                                  {activeImg.approvedPlatforms.includes(activePlatform) && <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 50 }}>✓ Approved</span>}
                                </div>
                                <div style={{ padding: 18 }}>
                                  <p style={{ fontSize: 14, lineHeight: 1.85, color: 'rgba(26,16,53,.75)', marginBottom: 16, whiteSpace: 'pre-wrap' as const }}>{activeImg.result.captions[activePlatform]}</p>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button onClick={() => copyCaption(activeImg.id, activePlatform)}
                                      style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid rgba(139,92,246,.2)', background: activeImg.copied === activePlatform ? 'rgba(16,185,129,.08)' : '#fff', color: activeImg.copied === activePlatform ? '#10b981' : '#8b5cf6', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                      {activeImg.copied === activePlatform ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                    <button onClick={() => toggleApprove(activeImg.id, activePlatform)}
                                      style={{ padding: '9px 16px', borderRadius: 9, border: `1.5px solid ${activeImg.approvedPlatforms.includes(activePlatform) ? 'rgba(16,185,129,.3)' : 'rgba(139,92,246,.2)'}`, background: activeImg.approvedPlatforms.includes(activePlatform) ? 'rgba(16,185,129,.08)' : 'rgba(139,92,246,.06)', color: activeImg.approvedPlatforms.includes(activePlatform) ? '#10b981' : '#8b5cf6', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                      {activeImg.approvedPlatforms.includes(activePlatform) ? '✓ Approved' : 'Approve'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              {selectedPlatforms.filter(p => activeImg.result?.captions[p] && p !== activePlatform).map(p => {
                                const cfg = PCFG[p]; const isApproved = activeImg.approvedPlatforms.includes(p)
                                return (
                                  <div key={p} onClick={() => setActivePlatform(p)}
                                    style={{ background: '#fff', borderRadius: 14, border: `1px solid ${isApproved ? 'rgba(16,185,129,.2)' : 'rgba(139,92,246,.08)'}`, padding: '12px 14px', cursor: 'pointer', transition: 'all .2s' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = cfg.color + '30'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = isApproved ? 'rgba(16,185,129,.2)' : 'rgba(139,92,246,.08)'}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                      <span style={{ fontSize: 13 }}>{cfg.emoji}</span>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{p}</span>
                                      {isApproved && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#10b981', fontWeight: 700 }}>✓</span>}
                                    </div>
                                    <p style={{ fontSize: 11, color: 'rgba(26,16,53,.55)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{activeImg.result?.captions[p]}</p>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* AI CHAT TAB */}
                    {activeTab === 'chat' && (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
                        {/* Quick prompts */}
                        {chatMessages.length <= 1 && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                            {quickPrompts.map(p => (
                              <button key={p} onClick={() => { setChatInput(p.slice(3)); }}
                                style={{ padding: '8px 14px', borderRadius: 50, border: '1.5px solid rgba(139,92,246,.15)', background: '#fff', color: 'rgba(26,16,53,.6)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#8b5cf6'; el.style.color = '#8b5cf6' }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(139,92,246,.15)'; el.style.color = 'rgba(26,16,53,.6)' }}>
                                {p}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 12 }}>
                          {chatMessages.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                              {msg.role === 'assistant' && (
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
                              )}
                              <div style={{ maxWidth: '75%', background: msg.role === 'user' ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : '#fff', color: msg.role === 'user' ? '#fff' : '#1a1035', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px', fontSize: 14, lineHeight: 1.7, boxShadow: msg.role === 'assistant' ? '0 2px 12px rgba(139,92,246,.08)' : '0 4px 16px rgba(139,92,246,.25)', border: msg.role === 'assistant' ? '1px solid rgba(139,92,246,.08)' : 'none', whiteSpace: 'pre-wrap' as const }}>
                                {msg.content}
                              </div>
                              {msg.role === 'user' && (
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,92,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#8b5cf6', flexShrink: 0 }}>{user?.name[0] || 'U'}</div>
                              )}
                            </div>
                          ))}
                          {chatLoading && (
                            <div style={{ display: 'flex', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                              <div style={{ background: '#fff', borderRadius: '18px 18px 18px 4px', padding: '14px 18px', border: '1px solid rgba(139,92,246,.08)', boxShadow: '0 2px 12px rgba(139,92,246,.08)' }}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                  {[0,1,2].map(i => <div key={i} className="dot-pulse" style={{ animationDelay: `${i*.15}s` }} />)}
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid rgba(139,92,246,.08)', flexShrink: 0 }}>
                          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} placeholder="Ask anything — write a caption, get ideas, draft a review response..." className="sinp" style={{ flex: 1, borderRadius: 50, fontSize: 14 }} />
                          <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                            style={{ background: chatInput.trim() ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(139,92,246,.15)', border: 'none', color: chatInput.trim() ? '#fff' : 'rgba(139,92,246,.4)', width: 44, height: 44, borderRadius: '50%', fontSize: 18, cursor: chatInput.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: chatInput.trim() ? '0 4px 16px rgba(139,92,246,.3)' : 'none', transition: 'all .2s' }}>
                            →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* A/B TEST TAB */}
                    {activeTab === 'ab' && (
                      <div>
                        {!activeImg.result ? (
                          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(26,16,53,.4)' }}>
                            <div style={{ fontSize: 44, marginBottom: 12 }}>🧪</div>
                            <p>Generate captions first, then run an A/B test.</p>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                              <div>
                                <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#1a1035', marginBottom: 4 }}>A/B Caption Test</h3>
                                <p style={{ fontSize: 13, color: 'rgba(26,16,53,.45)' }}>Compare two versions to see which performs better</p>
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {selectedPlatforms.filter(p => activeImg.result?.captions[p]).map(p => (
                                  <button key={p} onClick={() => setActivePlatform(p)}
                                    style={{ padding: '6px 12px', borderRadius: 50, border: `1.5px solid ${activePlatform === p ? PCFG[p].color : 'rgba(139,92,246,.15)'}`, background: activePlatform === p ? PCFG[p].color + '12' : '#fff', color: activePlatform === p ? PCFG[p].color : 'rgba(26,16,53,.5)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: activePlatform === p ? 700 : 400, cursor: 'pointer' }}>
                                    {PCFG[p].emoji} {p}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                              {/* Version A */}
                              <div style={{ background: '#fff', borderRadius: 18, border: '2px solid rgba(139,92,246,.2)', overflow: 'hidden' }}>
                                <div style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Syne,sans-serif' }}>Version A</span>
                                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,.2)', color: '#fff', padding: '2px 8px', borderRadius: 50, fontWeight: 600 }}>Original</span>
                                </div>
                                <div style={{ padding: 16 }}>
                                  <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(26,16,53,.7)', marginBottom: 14, minHeight: 80 }}>{activeImg.result.captions[activePlatform]}</p>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => navigator.clipboard.writeText(activeImg.result!.captions[activePlatform])}
                                      style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid rgba(139,92,246,.2)', background: 'rgba(139,92,246,.06)', color: '#8b5cf6', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Copy A</button>
                                    <button onClick={() => toggleApprove(activeImg.id, activePlatform)}
                                      style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid rgba(16,185,129,.25)', background: 'rgba(16,185,129,.08)', color: '#10b981', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Use A ✓</button>
                                  </div>
                                </div>
                              </div>

                              {/* Version B */}
                              <div style={{ background: '#fff', borderRadius: 18, border: '2px solid rgba(236,72,153,.2)', overflow: 'hidden' }}>
                                <div style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Syne,sans-serif' }}>Version B</span>
                                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,.2)', color: '#fff', padding: '2px 8px', borderRadius: 50, fontWeight: 600 }}>AI Alternative</span>
                                </div>
                                <div style={{ padding: 16 }}>
                                  {activeImg.captionB ? (
                                    <>
                                      <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(26,16,53,.7)', marginBottom: 14, minHeight: 80 }}>{activeImg.captionB}</p>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => navigator.clipboard.writeText(activeImg.captionB!)}
                                          style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid rgba(236,72,153,.2)', background: 'rgba(236,72,153,.06)', color: '#ec4899', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Copy B</button>
                                        <button onClick={() => setImages(prev => prev.map(i => i.id === activeImage ? { ...i, result: i.result ? { ...i.result, captions: { ...i.result.captions, [activePlatform]: i.captionB! } } : i.result, captionB: i.result?.captions[activePlatform] } : i))}
                                          style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid rgba(16,185,129,.25)', background: 'rgba(16,185,129,.08)', color: '#10b981', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Use B ✓</button>
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80, flexDirection: 'column', gap: 10 }}>
                                      {abLoading ? (
                                        <><div className="spin" /><span style={{ fontSize: 12, color: '#ec4899' }}>Generating...</span></>
                                      ) : (
                                        <button onClick={generateAbCaption}
                                          style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 50, fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 16px rgba(236,72,153,.3)' }}>
                                          ✨ Generate Version B
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {activeImg.captionB && (
                              <div style={{ background: 'rgba(139,92,246,.04)', border: '1px solid rgba(139,92,246,.12)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 20 }}>💡</span>
                                <p style={{ fontSize: 13, color: 'rgba(26,16,53,.55)', lineHeight: 1.6 }}>Post both versions at different times and check your analytics to see which drives more engagement. Shorter captions typically work better on TikTok and X; longer ones on LinkedIn and Facebook.</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* SCHEDULE TAB */}
                    {activeTab === 'schedule' && (
                      <div>
                        <div style={{ marginBottom: 24 }}>
                          <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#1a1035', marginBottom: 4 }}>Schedule Posts</h3>
                          <p style={{ fontSize: 13, color: 'rgba(26,16,53,.45)' }}>Choose when your posts go live across platforms</p>
                        </div>

                        {/* Best times suggestion */}
                        {activeImg.result && (
                          <div style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.06),rgba(236,72,153,.04))', border: '1px solid rgba(139,92,246,.12)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>AI Recommended Times</div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {activeImg.result.bestTimes.map((t, i) => (
                                <button key={i} onClick={() => {
                                  const parts = t.match(/(\w+)\s+(\d+(?:-\d+)?)\s*(AM|PM)/i)
                                  if (parts) {
                                    const today = new Date()
                                    today.setDate(today.getDate() + i + 1)
                                    const dateStr = today.toISOString().split('T')[0]
                                    const hour = parseInt(parts[2]) + (parts[3].toUpperCase() === 'PM' && parseInt(parts[2]) !== 12 ? 12 : 0)
                                    setImages(prev => prev.map(img => img.id === activeImage ? { ...img, scheduledDate: dateStr, scheduledTime: `${hour.toString().padStart(2,'0')}:00` } : img))
                                  }
                                }}
                                  style={{ padding: '8px 16px', borderRadius: 50, border: '1.5px solid rgba(139,92,246,.2)', background: '#fff', color: '#8b5cf6', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}
                                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(139,92,246,.06)' }}
                                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff' }}>
                                  🕐 {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Date/time picker */}
                        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(139,92,246,.1)', padding: 24, marginBottom: 16 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,16,53,.5)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Date</label>
                              <input type="date" value={activeImg.scheduledDate || ''} onChange={e => setImages(prev => prev.map(i => i.id === activeImage ? { ...i, scheduledDate: e.target.value } : i))} className="sinp" min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,16,53,.5)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Time</label>
                              <input type="time" value={activeImg.scheduledTime || ''} onChange={e => setImages(prev => prev.map(i => i.id === activeImage ? { ...i, scheduledTime: e.target.value } : i))} className="sinp" />
                            </div>
                          </div>

                          <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,16,53,.5)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Post to platforms</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {selectedPlatforms.map(p => {
                                const cfg = PCFG[p]; const approved = activeImg.approvedPlatforms.includes(p)
                                return (
                                  <button key={p} onClick={() => toggleApprove(activeImg.id, p)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 50, border: `1.5px solid ${approved ? cfg.color : 'rgba(139,92,246,.12)'}`, background: approved ? cfg.color + '12' : '#fff', color: approved ? cfg.color : 'rgba(26,16,53,.5)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: approved ? 700 : 400, cursor: 'pointer', transition: 'all .2s' }}>
                                    {cfg.emoji} {p} {approved && '✓'}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <button onClick={schedulePost} disabled={!activeImg.scheduledDate || !activeImg.scheduledTime || scheduleLoading || activeImg.approvedPlatforms.length === 0}
                            style={{ width: '100%', padding: '14px', borderRadius: 12, background: (activeImg.scheduledDate && activeImg.scheduledTime && activeImg.approvedPlatforms.length > 0) ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(139,92,246,.15)', border: 'none', color: (activeImg.scheduledDate && activeImg.scheduledTime && activeImg.approvedPlatforms.length > 0) ? '#fff' : 'rgba(139,92,246,.4)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, cursor: (activeImg.scheduledDate && activeImg.scheduledTime && activeImg.approvedPlatforms.length > 0) ? 'pointer' : 'not-allowed', boxShadow: (activeImg.scheduledDate && activeImg.scheduledTime && activeImg.approvedPlatforms.length > 0) ? '0 6px 20px rgba(139,92,246,.25)' : 'none', transition: 'all .3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {scheduleLoading ? <><span className="spin" /> Scheduling...</> : activeImg.scheduledDate && activeImg.scheduledTime ? `📅 Schedule for ${activeImg.scheduledDate} at ${activeImg.scheduledTime}` : '📅 Pick a date and time above'}
                          </button>
                        </div>

                        {activeImg.scheduledDate && (
                          <div style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>✅</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Scheduled</div>
                              <div style={{ fontSize: 12, color: 'rgba(26,16,53,.45)' }}>{activeImg.scheduledDate} at {activeImg.scheduledTime} · {activeImg.approvedPlatforms.length} platform{activeImg.approvedPlatforms.length !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FILTERS TAB */}
                    {activeTab === 'filters' && (
                      <div>
                        <div style={{ marginBottom: 20 }}>
                          <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#1a1035', marginBottom: 4 }}>Image Filters</h3>
                          <p style={{ fontSize: 13, color: 'rgba(26,16,53,.45)' }}>Adjust your photo before posting</p>
                        </div>

                        {/* Live preview */}
                        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(139,92,246,.1)', overflow: 'hidden', marginBottom: 20 }}>
                          <div style={{ background: '#f0eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                            <img src={activeImg.preview} alt="" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', display: 'block', ...filterStyle, transition: 'filter .1s' }} />
                          </div>
                          <div style={{ padding: 20 }}>
                            {[
                              { key: 'filterBrightness' as const, label: '☀️ Brightness', min: 50, max: 180, step: 5 },
                              { key: 'filterContrast' as const, label: '◑ Contrast', min: 50, max: 180, step: 5 },
                              { key: 'filterSaturate' as const, label: '🎨 Saturation', min: 0, max: 200, step: 5 },
                            ].map(f => (
                              <div key={f.key} style={{ marginBottom: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(26,16,53,.6)' }}>{f.label}</label>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,.08)', padding: '2px 10px', borderRadius: 50 }}>{activeImg[f.key] || 100}%</span>
                                </div>
                                <input type="range" min={f.min} max={f.max} step={f.step} value={activeImg[f.key] || 100} onChange={e => updateFilter(f.key, parseInt(e.target.value))} className="slider" style={{ width: '100%' }} />
                              </div>
                            ))}

                            {/* Filter presets */}
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,16,53,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Presets</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {[
                                  { name: 'Vivid', b: 110, c: 115, s: 140 },
                                  { name: 'Warm', b: 108, c: 105, s: 120 },
                                  { name: 'Cool', b: 100, c: 110, s: 80 },
                                  { name: 'Faded', b: 115, c: 85, s: 70 },
                                  { name: 'Bold', b: 100, c: 130, s: 150 },
                                  { name: 'B&W', b: 100, c: 110, s: 0 },
                                ].map(preset => (
                                  <button key={preset.name} onClick={() => { updateFilter('filterBrightness', preset.b); updateFilter('filterContrast', preset.c); updateFilter('filterSaturate', preset.s) }}
                                    style={{ padding: '6px 14px', borderRadius: 50, border: '1.5px solid rgba(139,92,246,.15)', background: '#fff', color: 'rgba(26,16,53,.6)', fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}
                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#8b5cf6'; el.style.color = '#8b5cf6'; el.style.background = 'rgba(139,92,246,.06)' }}
                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(139,92,246,.15)'; el.style.color = 'rgba(26,16,53,.6)'; el.style.background = '#fff' }}>
                                    {preset.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button onClick={resetFilters}
                              style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid rgba(139,92,246,.15)', background: '#fff', color: 'rgba(26,16,53,.5)', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                              ↺ Reset to Original
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR */}
          <aside style={{ width: 228, background: '#fff', borderLeft: '1px solid rgba(139,92,246,.08)', overflowY: 'auto', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ display: 'flex', padding: '10px 10px 0', gap: 4 }}>
              {(['queue','settings'] as const).map(t => (
                <button key={t} onClick={() => setSidebarTab(t)}
                  style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: sidebarTab === t ? 'rgba(139,92,246,.1)' : 'transparent', color: sidebarTab === t ? '#8b5cf6' : 'rgba(26,16,53,.4)', transition: 'all .2s', textTransform: 'capitalize' as const }}>
                  {t === 'queue' ? '📋 Queue' : '⚙️ Settings'}
                </button>
              ))}
            </div>
            <div style={{ padding: 12, flex: 1 }}>
              {sidebarTab === 'queue' ? (
                <>
                  <div style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.06),rgba(236,72,153,.04))', border: '1px solid rgba(139,92,246,.1)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Content Queue</div>
                    {[{ label: 'Uploaded', value: images.length, color: '#8b5cf6' }, { label: 'Analyzed', value: doneCount, color: '#ec4899' }, { label: 'Approved', value: approvedCount, color: '#10b981' }, { label: 'Pending', value: pendingCount, color: '#f59e0b' }].map(s => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'rgba(26,16,53,.5)' }}>{s.label}</span>
                        <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  {activeImg?.result && (
                    <div style={{ background: 'rgba(139,92,246,.05)', border: '1px solid rgba(139,92,246,.12)', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', marginBottom: 7 }}>💡 AI Tip</div>
                      <p style={{ fontSize: 11, color: 'rgba(26,16,53,.5)', lineHeight: 1.6 }}>
                        {activeImg.result.engagementScore >= 8 ? 'High engagement predicted! Post during peak hours for best results.' : activeImg.result.engagementScore >= 6 ? 'Solid post. Add a strong call-to-action for better results.' : 'Try adding more context in the topic field to improve the caption.'}
                      </p>
                    </div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(26,16,53,.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Quick Actions</div>
                  {[{ icon: '💬', label: 'Ask AI anything', action: () => setActiveTab('chat') }, { icon: '🧪', label: 'A/B test captions', action: () => setActiveTab('ab') }, { icon: '📅', label: 'Schedule a post', action: () => setActiveTab('schedule') }, { icon: '🎨', label: 'Edit filters', action: () => setActiveTab('filters') }].map(a => (
                    <button key={a.label} onClick={a.action}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 10, border: '1px solid rgba(139,92,246,.08)', background: 'rgba(139,92,246,.02)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 12, color: 'rgba(26,16,53,.6)', fontWeight: 500, marginBottom: 6, transition: 'all .2s', textAlign: 'left' as const }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(139,92,246,.06)'; el.style.color = '#8b5cf6'; el.style.borderColor = 'rgba(139,92,246,.2)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(139,92,246,.02)'; el.style.color = 'rgba(26,16,53,.6)'; el.style.borderColor = 'rgba(139,92,246,.08)' }}>
                      <span style={{ fontSize: 15 }}>{a.icon}</span> {a.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(26,16,53,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Business</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    <div><label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,16,53,.5)', display: 'block', marginBottom: 5 }}>Name</label><input value={business.name} onChange={e => setBusiness(b => ({ ...b, name: e.target.value }))} className="sinp" style={{ fontSize: 12 }} /></div>
                    <div><label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,16,53,.5)', display: 'block', marginBottom: 5 }}>Industry</label><input value={business.industry} onChange={e => setBusiness(b => ({ ...b, industry: e.target.value }))} className="sinp" style={{ fontSize: 12 }} /></div>
                    <div><label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,16,53,.5)', display: 'block', marginBottom: 5 }}>Tone</label>
                      <select value={business.tone} onChange={e => setBusiness(b => ({ ...b, tone: e.target.value }))} className="sinp" style={{ fontSize: 12, appearance: 'none' as const }}>
                        {['Friendly & Professional','Casual & Fun','Luxury & Premium','Bold & Energetic','Warm & Community-Focused'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(26,16,53,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Platforms</div>
                  {PLATFORMS.map(p => {
                    const cfg = PCFG[p]; const sel = selectedPlatforms.includes(p)
                    return (
                      <div key={p} onClick={() => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, border: `1px solid ${sel ? cfg.color + '25' : 'rgba(139,92,246,.07)'}`, background: sel ? cfg.color + '05' : '#fff', cursor: 'pointer', transition: 'all .2s', marginBottom: 5 }}>
                        <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: sel ? cfg.color : 'rgba(26,16,53,.5)', flex: 1 }}>{p}</span>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: sel ? cfg.color : 'rgba(139,92,246,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {sel && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0}
  .sinp{width:100%;background:#fff;border:1.5px solid rgba(139,92,246,.15);border-radius:10px;padding:10px 13px;font-family:'Inter',sans-serif;font-size:13px;color:#1a1035;outline:none;transition:border-color .2s;display:block}
  .sinp:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.08)}
  .sinp::placeholder{color:rgba(26,16,53,.3)}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes dotpulse{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
  .spin{display:inline-block;width:20px;height:20px;border:2.5px solid rgba(139,92,246,.2);border-top-color:#8b5cf6;border-radius:50%;animation:spin .7s linear infinite}
  .dot-pulse{width:7px;height:7px;border-radius:50%;background:#8b5cf6;display:inline-block;animation:dotpulse 1.2s ease-in-out infinite}
  .rmv-btn:hover{opacity:1!important}
  .slider{-webkit-appearance:none;appearance:none;height:5px;border-radius:3px;background:linear-gradient(90deg,#8b5cf6,#ec4899);outline:none;cursor:pointer}
  .slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:#8b5cf6;cursor:pointer;box-shadow:0 2px 8px rgba(139,92,246,.4)}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(139,92,246,.15);border-radius:2px}
`
