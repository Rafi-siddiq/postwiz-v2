import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useState, useRef, useCallback } from 'react'

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
}

const PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'X (Twitter)', 'LinkedIn', 'Pinterest']
const PLATFORM_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  'Instagram':   { color: '#E1306C', bg: '#fff0f5', emoji: '📸' },
  'TikTok':      { color: '#010101', bg: '#f5f5f5', emoji: '🎵' },
  'Facebook':    { color: '#1877F2', bg: '#f0f5ff', emoji: '📘' },
  'X (Twitter)': { color: '#14171A', bg: '#f5f8fa', emoji: '𝕏' },
  'LinkedIn':    { color: '#0A66C2', bg: '#f0f5ff', emoji: '💼' },
  'Pinterest':   { color: '#E60023', bg: '#fff5f5', emoji: '📌' },
}

const CONTENT_COLORS: Record<string, { color: string; bg: string }> = {
  promotional:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  lifestyle:    { color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  educational:  { color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
  engagement:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  product:      { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

export default function Studio() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [business, setBusiness] = useState({ name: '', industry: '', tone: 'friendly and professional', description: '' })
  const [setupDone, setSetupDone] = useState(false)
  const [activeTab, setActiveTab] = useState<'caption'|'schedule'|'batch'>('caption')
  const [topic, setTopic] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(PLATFORMS)
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const [user, setUser] = useState<{name:string;email:string;plan:string;master:boolean}|null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('pw_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
  }, [])


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
        id: Math.random().toString(36).slice(2),
        file, preview, base64, mediaType,
        status: 'pending',
        approvedPlatforms: [],
        copied: null,
      })
    }
    setImages(prev => [...prev, ...newImages])
    if (newImages.length > 0 && !activeImage) setActiveImage(newImages[0].id)
  }, [activeImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    addImages(files)
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
          imageBase64: img.base64,
          mediaType: img.mediaType,
          businessName: business.name || 'My Business',
          industry: business.industry || 'Small Business',
          tone: business.tone,
          description: business.description,
          platforms: selectedPlatforms,
          topic,
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setImages(prev => prev.map(i => i.id === imageId ? { ...i, status: 'done', result: data } : i))
    } catch (err) {
      setImages(prev => prev.map(i => i.id === imageId ? { ...i, status: 'error' } : i))
    }
  }

  const analyzeBulk = async () => {
    setBulkAnalyzing(true)
    const pending = images.filter(i => i.status === 'pending')
    for (const img of pending) await analyzeImage(img.id)
    setBulkAnalyzing(false)
  }

  const copyCaption = (imageId: string, platform: string) => {
    const img = images.find(i => i.id === imageId)
    if (!img?.result?.captions[platform]) return
    navigator.clipboard.writeText(img.result.captions[platform])
    setImages(prev => prev.map(i => i.id === imageId ? { ...i, copied: platform } : i))
    setTimeout(() => setImages(prev => prev.map(i => i.id === imageId ? { ...i, copied: null } : i)), 2000)
  }

  const approveForPlatform = (imageId: string, platform: string) => {
    setImages(prev => prev.map(i => {
      if (i.id !== imageId) return i
      const already = i.approvedPlatforms.includes(platform)
      return { ...i, approvedPlatforms: already ? i.approvedPlatforms.filter(p => p !== platform) : [...i.approvedPlatforms, platform] }
    }))
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(i => i.id !== id))
    if (activeImage === id) setImages(prev => { const remaining = prev.filter(i => i.id !== id); setActiveImage(remaining[0]?.id || null); return remaining })
  }

  const activeImg = images.find(i => i.id === activeImage)

  // SETUP SCREEN
  if (!setupDone) {
    return (
      <>
        <Head><title>PostWiz Studio – AI Content Creator</title></Head>
        <style>{studioStyles}</style>
        <div style={{ minHeight: '100vh', background: '#0d0d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 520 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <a href="/" style={{ textDecoration: 'none' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                  Post<span style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wiz</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa', marginLeft: 10, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', padding: '4px 12px', borderRadius: 50 }}>Studio</span>
                </div>
              </a>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>AI Content Studio</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Upload photos, AI generates captions for every platform.</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {[
                  { label: 'Business Name', key: 'name', placeholder: "e.g. Mario's Pizza", type: 'input' },
                  { label: 'Industry', key: 'industry', placeholder: 'e.g. Restaurant, Barbershop, Boutique...', type: 'input' },
                  { label: 'Brand Tone', key: 'tone', type: 'select', options: ['Friendly & Professional', 'Casual & Fun', 'Luxury & Premium', 'Bold & Energetic', 'Warm & Community-Focused'] },
                  { label: 'About Your Business (optional)', key: 'description', placeholder: 'What makes you special?', type: 'textarea' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="studio-label">{f.label}</label>
                    {f.type === 'input' && <input value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} placeholder={f.placeholder} className="studio-input" />}
                    {f.type === 'select' && <select value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} className="studio-select">{f.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>}
                    {f.type === 'textarea' && <textarea value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={2} className="studio-textarea" />}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="studio-label">Platforms to generate for</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PLATFORMS.map(p => {
                    const cfg = PLATFORM_CONFIG[p]
                    const selected = selectedPlatforms.includes(p)
                    return (
                      <button key={p} onClick={() => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                        style={{ padding: '7px 14px', borderRadius: 50, border: `1.5px solid ${selected ? cfg.color : 'rgba(255,255,255,0.1)'}`, background: selected ? cfg.color + '18' : 'transparent', color: selected ? cfg.color : 'rgba(255,255,255,0.45)', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>{cfg.emoji}</span>{p}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button onClick={() => setSetupDone(true)} disabled={!business.name} style={{ width: '100%', padding: 16, borderRadius: 12, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, cursor: 'pointer', opacity: !business.name ? 0.5 : 1 }}>
                Open Studio →
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // MAIN STUDIO
  return (
    <>
      <Head><title>PostWiz Studio – AI Content Creator</title></Head>
      <style>{studioStyles}</style>

      <div style={{ minHeight: '100vh', background: '#0d0d1f', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

        {/* Top bar */}
        <header style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#fff' }}>
              Post<span style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wiz</span>
            </a>
            <span style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 50 }}>Studio</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>· {business.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {images.filter(i => i.status === 'pending').length > 0 && (
              <button onClick={analyzeBulk} disabled={bulkAnalyzing} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 50, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                {bulkAnalyzing ? <><span className="spinner" />Analyzing all...</> : <>✨ Analyze All {images.filter(i => i.status === 'pending').length} Photos</>}
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: 50, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              + Add Photos
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => addImages(Array.from(e.target.files || []))} />
            {/* User info */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 50, padding: '8px 16px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{user.name[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{user.plan} {user.master ? '· Master' : ''}</div>
                </div>
                <button onClick={() => { localStorage.removeItem('pw_user'); router.push('/login') }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Log out</button>
              </div>
            )}
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* LEFT — Image gallery sidebar */}
          <aside style={{ width: 220, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Drop zone */}
            <div ref={dropRef} onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '20px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s', background: dragging ? 'rgba(139,92,246,0.06)' : 'transparent', marginBottom: 4 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Drop photos here or click to upload</div>
            </div>

            {images.map(img => (
              <div key={img.id} onClick={() => setActiveImage(img.id)} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${activeImage === img.id ? '#8b5cf6' : 'transparent'}`, transition: 'border-color .2s', flexShrink: 0 }}>
                <img src={img.preview} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                {/* Status overlay */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 8px 6px', background: 'linear-gradient(transparent,rgba(0,0,0,0.8))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: img.status === 'done' ? '#34d399' : img.status === 'analyzing' ? '#fbbf24' : img.status === 'error' ? '#f87171' : 'rgba(255,255,255,0.5)' }}>
                      {img.status === 'done' ? '✓ Done' : img.status === 'analyzing' ? '⏳ Analyzing...' : img.status === 'error' ? '✗ Error' : '● Pending'}
                    </span>
                    {img.approvedPlatforms.length > 0 && <span style={{ fontSize: 10, color: '#a78bfa' }}>{img.approvedPlatforms.length} approved</span>}
                  </div>
                </div>
                {/* Remove button */}
                <button onClick={e => { e.stopPropagation(); removeImage(img.id) }} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}

            {images.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 8px', color: 'rgba(255,255,255,0.2)', fontSize: 12, lineHeight: 1.6 }}>
                No photos yet.<br />Upload some to get started.
              </div>
            )}
          </aside>

          {/* CENTER — Main editor */}
          <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {!activeImg ? (
              /* Empty state */
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🖼️</div>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 10, color: '#fff' }}>Upload your photos</h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16, maxWidth: 420, lineHeight: 1.7, marginBottom: 32 }}>
                  Drop photos on the left or click below. AI will analyze each image and write captions for every platform automatically.
                </p>
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', padding: '16px 36px', borderRadius: 50, fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                  📁 Upload Photos
                </button>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 16 }}>Supports JPG, PNG, WebP · Up to 10MB each</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, height: '100%' }}>

                {/* Image preview + metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                    <img src={activeImg.preview} alt="" style={{ width: '100%', maxHeight: 340, objectFit: 'contain', display: 'block' }} />
                    {activeImg.status === 'analyzing' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,31,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                        <span style={{ fontSize: 14, color: '#c084fc', fontWeight: 600 }}>AI is analyzing your image...</span>
                      </div>
                    )}
                  </div>

                  {/* Topic input */}
                  <div>
                    <label className="studio-label">Campaign/Topic (optional)</label>
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Weekend special, new product launch..." className="studio-input" />
                  </div>

                  {/* Analyze button */}
                  {activeImg.status === 'pending' || activeImg.status === 'error' ? (
                    <button onClick={() => analyzeImage(activeImg.id)} style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', padding: '14px', borderRadius: 12, fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {activeImg.status === 'error' ? '↻ Try Again' : '✨ Generate Captions'}
                    </button>
                  ) : activeImg.status === 'analyzing' ? (
                    <button disabled style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '14px', borderRadius: 12, fontFamily: 'Inter,sans-serif', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="spinner" />Analyzing...
                    </button>
                  ) : (
                    <button onClick={() => analyzeImage(activeImg.id)} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#c084fc', padding: '12px', borderRadius: 12, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                      ↻ Regenerate Captions
                    </button>
                  )}

                  {/* Image metadata */}
                  {activeImg.result && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>
                        <strong style={{ color: '#a78bfa' }}>AI sees:</strong> {activeImg.result.imageDescription}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 50, ...CONTENT_COLORS[activeImg.result.contentType] || { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' } }}>
                          {activeImg.result.contentType}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 50, background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                          Engagement: {activeImg.result.engagementScore}/10
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                        <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Best times to post:</strong>
                        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {activeImg.result.bestTimes.map((t, i) => <span key={i}>🕐 {t}</span>)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT — Captions */}
                <div style={{ overflowY: 'auto' }}>
                  {!activeImg.result ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', textAlign: 'center', gap: 12 }}>
                      <div style={{ fontSize: 40 }}>✨</div>
                      <p style={{ fontSize: 15 }}>Click &ldquo;Generate Captions&rdquo; to create<br />platform-optimized captions for this photo.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700 }}>Generated Captions</h3>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{activeImg.approvedPlatforms.length} of {Object.keys(activeImg.result.captions).length} approved</span>
                      </div>

                      {selectedPlatforms.filter(p => activeImg.result!.captions[p]).map(platform => {
                        const cfg = PLATFORM_CONFIG[platform]
                        const caption = activeImg.result!.captions[platform]
                        const approved = activeImg.approvedPlatforms.includes(platform)
                        const copied = activeImg.copied === platform

                        return (
                          <div key={platform} style={{ background: approved ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${approved ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 18, padding: '20px 22px', transition: 'all .2s' }}>
                            {/* Platform header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 10, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{platform}</span>
                                </div>
                                {approved && <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '3px 10px', borderRadius: 50 }}>✓ Approved</span>}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => copyCaption(activeImg.id, platform)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#34d399' : 'rgba(255,255,255,0.55)', fontFamily: 'Inter,sans-serif', fontSize: 12, cursor: 'pointer', transition: 'all .2s' }}>
                                  {copied ? '✓ Copied!' : 'Copy'}
                                </button>
                                <button onClick={() => approveForPlatform(activeImg.id, platform)} style={{ padding: '6px 14px', borderRadius: 8, background: approved ? 'rgba(52,211,153,0.12)' : 'rgba(139,92,246,0.1)', border: `1px solid ${approved ? 'rgba(52,211,153,0.25)' : 'rgba(139,92,246,0.2)'}`, color: approved ? '#34d399' : '#c084fc', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all .2s' }}>
                                  {approved ? '✓ Approved' : 'Approve'}
                                </button>
                              </div>
                            </div>
                            {/* Caption text */}
                            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.7)' }}>{caption}</p>
                          </div>
                        )
                      })}

                      {/* Approve all */}
                      {activeImg.approvedPlatforms.length < selectedPlatforms.length && (
                        <button onClick={() => setImages(prev => prev.map(i => i.id === activeImg.id ? { ...i, approvedPlatforms: selectedPlatforms } : i))}
                          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', padding: '12px', borderRadius: 12, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'center' as const }}>
                          ✓ Approve All Platforms
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* RIGHT PANEL — Queue & coming soon */}
          <aside style={{ width: 260, background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Queue summary */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#fff' }}>Content Queue</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Uploaded', value: images.length, color: '#c084fc' },
                  { label: 'Analyzed', value: images.filter(i => i.status === 'done').length, color: '#a78bfa' },
                  { label: 'Approved', value: images.reduce((acc, i) => acc + i.approvedPlatforms.length, 0), color: '#34d399' },
                  { label: 'Pending', value: images.filter(i => i.status === 'pending').length, color: '#fbbf24' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
                    <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {activeImg?.result && (
              <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 16, padding: 16 }}>
                <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 10 }}>💡 AI Tips</h3>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                  <p style={{ marginBottom: 8 }}>This looks like a <strong style={{ color: '#c084fc' }}>{activeImg.result.contentType}</strong> post — great for {activeImg.result.contentType === 'lifestyle' ? 'Instagram Stories' : activeImg.result.contentType === 'promotional' ? 'Facebook and Instagram Feed' : 'all platforms'}.</p>
                  <p>Engagement score: <strong style={{ color: '#34d399' }}>{activeImg.result.engagementScore}/10</strong> — {activeImg.result.engagementScore >= 8 ? 'excellent! Post this one first.' : activeImg.result.engagementScore >= 6 ? 'solid performance expected.' : 'try adding more context in the topic field.'}</p>
                </div>
              </div>
            )}

            {/* Coming soon features */}
            <div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>Coming Soon</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🎬', title: 'AI Video Captions', sub: 'Upload video, AI adds subtitles' },
                  { icon: '✂️', title: 'Auto Video Trim', sub: 'AI picks the best moments' },
                  { icon: '🎨', title: 'AI Image Filters', sub: 'Brand-consistent editing' },
                  { icon: '🔤', title: 'Caption Overlay', sub: 'Add text to photos automatically' },
                  { icon: '📅', title: 'Direct Scheduling', sub: 'Post directly to all platforms' },
                  { icon: '📊', title: 'A/B Caption Testing', sub: 'Test which caption performs best' },
                ].map(f => (
                  <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{f.sub}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', color: '#fb923c', padding: '2px 8px', borderRadius: 50, fontWeight: 600, flexShrink: 0, alignSelf: 'flex-start' }}>Soon</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

const studioStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }

  .studio-label { display: block; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
  .studio-input {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 11px 15px; color: #fff; font-family: Inter,sans-serif;
    font-size: 14px; outline: none; transition: border-color .2s;
  }
  .studio-input:focus { border-color: rgba(139,92,246,0.5); }
  .studio-input::placeholder { color: rgba(255,255,255,0.2); }
  .studio-select {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 11px 15px; color: #fff; font-family: Inter,sans-serif;
    font-size: 14px; outline: none; cursor: pointer;
  }
  .studio-select option { background: #1a1a2e; }
  .studio-textarea {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 11px 15px; color: #fff; font-family: Inter,sans-serif;
    font-size: 14px; outline: none; resize: vertical; transition: border-color .2s;
  }
  .studio-textarea:focus { border-color: rgba(139,92,246,0.5); }
  .studio-textarea::placeholder { color: rgba(255,255,255,0.2); }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    display: inline-block; width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff;
    border-radius: 50%; animation: spin .7s linear infinite;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`
