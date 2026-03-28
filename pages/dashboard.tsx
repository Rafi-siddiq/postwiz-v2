import Head from 'next/head'
import { useState } from 'react'

interface Post { platform: string; content: string; scheduled: string; status: 'pending' | 'approved' | 'posted' }

const PLATFORM_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  Instagram: { color: '#E1306C', bg: 'rgba(225,48,108,0.12)', emoji: '📸' },
  Facebook:  { color: '#1877F2', bg: 'rgba(24,119,242,0.12)', emoji: '📘' },
  TikTok:    { color: '#ffffff', bg: 'rgba(255,255,255,0.08)', emoji: '🎵' },
}

const INDUSTRIES = ['Restaurant / Food','Barbershop / Hair Salon','Retail / Boutique','Fitness / Gym','Real Estate','Healthcare / Medical','Auto / Car Dealership','Law Firm','Contractor / Home Services','E-commerce','Other']
const TONES = ['Friendly & Professional','Casual & Fun','Luxury & Premium','Bold & Energetic','Warm & Community-Focused']

export default function Dashboard() {
  const [view, setView] = useState<'onboard'|'main'>('onboard')
  const [activeNav, setActiveNav] = useState<'posts'|'calendar'|'analytics'|'settings'>('posts')
  const [onboardStep, setOnboardStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [copied, setCopied] = useState<number|null>(null)
  const [editIdx, setEditIdx] = useState<number|null>(null)
  const [editText, setEditText] = useState('')
  const [topic, setTopic] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Instagram','Facebook','TikTok'])
  const [business, setBusiness] = useState({ name:'', industry:'', tone:'Friendly & Professional', description:'', website:'' })

  const generatePosts = async (customTopic?: string) => {
    setGenerating(true)
    const platforms = selectedPlatforms
    const times = ['Today 9:00 AM', 'Tomorrow 11:00 AM', 'In 2 days 3:00 PM']
    const generated: Post[] = []
    for (let i = 0; i < platforms.length; i++) {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessName: business.name, industry: business.industry, tone: business.tone, description: business.description, platform: platforms[i], topic: customTopic || topic }),
        })
        const data = await res.json()
        generated.push({ platform: platforms[i], content: data.post || 'Could not generate post.', scheduled: times[i % times.length], status: 'pending' })
      } catch { generated.push({ platform: platforms[i], content: 'Error generating. Please try again.', scheduled: times[i % times.length], status: 'pending' }) }
    }
    setPosts(prev => [...generated, ...prev])
    setGenerating(false)
  }

  const approvePost = (idx: number) => setPosts(p => p.map((post, i) => i === idx ? { ...post, status: 'approved' } : post))
  const deletePost = (idx: number) => setPosts(p => p.filter((_, i) => i !== idx))
  const copyPost = (idx: number) => { navigator.clipboard.writeText(posts[idx].content); setCopied(idx); setTimeout(() => setCopied(null), 2000) }
  const startEdit = (idx: number) => { setEditIdx(idx); setEditText(posts[idx].content) }
  const saveEdit = () => { if (editIdx === null) return; setPosts(p => p.map((post, i) => i === editIdx ? { ...post, content: editText } : post)); setEditIdx(null) }
  const togglePlatform = (p: string) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const stats = {
    total: posts.length,
    approved: posts.filter(p => p.status === 'approved').length,
    pending: posts.filter(p => p.status === 'pending').length,
    hoursSaved: Math.round(posts.length * 0.5 * 10) / 10,
  }

  // ONBOARDING
  if (view === 'onboard') {
    const steps = [
      { title: 'Welcome to PostWiz!', sub: "Let's get your social media set up in 2 minutes." },
      { title: 'Your Business', sub: 'Tell us the basics so AI can write in your voice.' },
      { title: 'Choose Platforms', sub: 'Which platforms do you want to post on?' },
      { title: "You're all set!", sub: 'Your first posts are being generated right now.' },
    ]
    return (
      <>
        <Head><title>PostWiz – Setup</title></Head>
        <style>{dashStyles}</style>
        <div style={{ minHeight: '100vh', background: '#02020a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
          {/* Progress */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)', zIndex: 10 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #7C3AED, #DB2777)', width: `${((onboardStep + 1) / steps.length) * 100}%`, transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
          </div>

          <div style={{ width: '100%', maxWidth: 520 }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff' }}>Post<span style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wiz</span></div>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
              {steps.map((_, i) => (
                <div key={i} style={{ width: i === onboardStep ? 24 : 8, height: 8, borderRadius: 4, background: i <= onboardStep ? 'linear-gradient(90deg, #7C3AED, #DB2777)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 36px' }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{steps[onboardStep].title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>{steps[onboardStep].sub}</p>

              {onboardStep === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[['🤖', 'AI writes every post', 'Perfectly tailored to your brand'],['📅', 'Auto-schedules everything', 'Posts at the best times automatically'],['📊', 'Tracks performance', 'See what works for your audience']].map(([icon, title, sub]) => (
                    <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 20px' }}>
                      <span style={{ fontSize: 24 }}>{icon}</span>
                      <div><div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div></div>
                    </div>
                  ))}
                </div>
              )}

              {onboardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Business Name *', key: 'name', placeholder: "e.g. Mario's Pizza", type: 'input' },
                    { label: 'Website (optional)', key: 'website', placeholder: 'e.g. marios-pizza.com', type: 'input' },
                    { label: 'Industry *', key: 'industry', type: 'select', options: INDUSTRIES },
                    { label: 'Brand Tone', key: 'tone', type: 'select', options: TONES },
                    { label: 'About Your Business', key: 'description', placeholder: 'What makes your business special? Who are your customers?', type: 'textarea' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 8 }}>{f.label}</label>
                      {f.type === 'input' && <input value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} placeholder={f.placeholder} className="dash-input" />}
                      {f.type === 'select' && <select value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} className="dash-select">
                        <option value="">Select...</option>
                        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>}
                      {f.type === 'textarea' && <textarea value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3} className="dash-textarea" />}
                    </div>
                  ))}
                </div>
              )}

              {onboardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => (
                    <div key={platform} onClick={() => togglePlatform(platform)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedPlatforms.includes(platform) ? config.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedPlatforms.includes(platform) ? config.color + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 24 }}>{config.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{platform}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>AI-optimized posts for {platform}</div>
                        </div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: selectedPlatforms.includes(platform) ? config.color : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        {selectedPlatforms.includes(platform) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {onboardStep === 3 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
                    PostWiz is generating your first {selectedPlatforms.length} posts right now. They&apos;ll be ready in your dashboard in seconds.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <span style={{ fontSize: 13, color: '#34d399' }}>AI is writing your posts...</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                {onboardStep > 0 && onboardStep < 3 && (
                  <button onClick={() => setOnboardStep(s => s - 1)} style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', fontSize: 15, cursor: 'pointer' }}>← Back</button>
                )}
                <button
                  onClick={async () => {
                    if (onboardStep < 2) { setOnboardStep(s => s + 1) }
                    else if (onboardStep === 2) { setOnboardStep(3); await generatePosts(); setView('main') }
                  }}
                  disabled={onboardStep === 1 && (!business.name || !business.industry)}
                  style={{ flex: 2, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #DB2777)', border: 'none', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer', opacity: (onboardStep === 1 && (!business.name || !business.industry)) ? 0.5 : 1 }}
                >
                  {onboardStep === 0 ? 'Get Started →' : onboardStep === 2 ? '🚀 Generate My Posts' : 'Continue →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // MAIN DASHBOARD
  return (
    <>
      <Head><title>PostWiz – Dashboard</title></Head>
      <style>{dashStyles}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#02020a', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

        {/* Sidebar */}
        <aside style={{ width: 240, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 20 }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}>Post<span style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wiz</span></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{business.name}</div>
          </div>

          {/* Nav items */}
          <nav style={{ padding: '16px 12px', flex: 1 }}>
            {[
              { id: 'posts', icon: '✍️', label: 'My Posts', badge: stats.pending > 0 ? stats.pending : null },
              { id: 'calendar', icon: '📅', label: 'Calendar' },
              { id: 'analytics', icon: '📊', label: 'Analytics' },
              { id: 'settings', icon: '⚙️', label: 'Settings' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveNav(item.id as any)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: activeNav === item.id ? 'rgba(124,58,237,0.15)' : 'transparent', border: activeNav === item.id ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent', color: activeNav === item.id ? '#a78bfa' : 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: activeNav === item.id ? 600 : 400, cursor: 'pointer', marginBottom: 4, transition: 'all 0.2s', textAlign: 'left' }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span style={{ background: '#DB2777', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 50 }}>{item.badge}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(219,39,119,0.1))', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Plan: Starter</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>$29/month</div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh' }}>
          {/* Top bar */}
          <header style={{ position: 'sticky', top: 0, background: 'rgba(2,2,10,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700 }}>
                {activeNav === 'posts' && 'My Posts'}
                {activeNav === 'calendar' && 'Content Calendar'}
                {activeNav === 'analytics' && 'Analytics'}
                {activeNav === 'settings' && 'Settings'}
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button onClick={() => { setTopic(''); generatePosts() }} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #7C3AED, #DB2777)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 50, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: generating ? 0.7 : 1, boxShadow: '0 0 30px rgba(124,58,237,0.3)' }}>
              {generating ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Generating...</> : <>✨ Generate Posts</>}
            </button>
          </header>

          <div style={{ padding: '32px' }}>

            {/* POSTS VIEW */}
            {activeNav === 'posts' && (
              <>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                  {[
                    { label: 'Total Posts', value: stats.total, icon: '📝', color: '#7C3AED' },
                    { label: 'Pending Review', value: stats.pending, icon: '⏳', color: '#F59E0B' },
                    { label: 'Approved', value: stats.approved, icon: '✅', color: '#10B981' },
                    { label: 'Hours Saved', value: stats.hoursSaved + 'h', icon: '⚡', color: '#DB2777' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 20 }}>{s.icon}</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                      </div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Quick generate */}
                <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generatePosts(topic)} placeholder="What should AI post about? e.g. Weekend special, new product, holiday sale..." className="dash-input" style={{ flex: 1 }} />
                  <button onClick={() => generatePosts(topic)} disabled={generating} style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', opacity: generating ? 0.7 : 1 }}>
                    {generating ? 'Writing...' : '✨ Write Posts'}
                  </button>
                </div>

                {/* Platform filter */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', alignSelf: 'center', marginRight: 4 }}>Filter:</span>
                  {['All', ...Object.keys(PLATFORM_CONFIG)].map(p => (
                    <button key={p} style={{ padding: '6px 14px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer' }}>{p}</button>
                  ))}
                </div>

                {/* Posts list */}
                {generating && posts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>AI is writing your posts...</p>
                  </div>
                )}

                {posts.length === 0 && !generating && (
                  <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No posts yet</h3>
                    <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Click &ldquo;Generate Posts&rdquo; or type a topic above to get started</p>
                    <button onClick={() => generatePosts()} style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: 50, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>✨ Generate My First Posts</button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {posts.map((post, idx) => {
                    const cfg = PLATFORM_CONFIG[post.platform] || { color: '#fff', bg: 'rgba(255,255,255,0.05)', emoji: '📱' }
                    return (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${post.status === 'approved' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 18, padding: '24px', transition: 'all 0.2s' }}>
                        {/* Post header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{post.platform}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12 }}>🕐</span>
                              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{post.scheduled}</span>
                            </div>
                            {post.status === 'approved' && <span style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 50 }}>✓ Approved</span>}
                            {post.status === 'pending' && <span style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 50 }}>Pending Review</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => copyPost(idx)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer' }}>{copied === idx ? '✓ Copied' : 'Copy'}</button>
                            <button onClick={() => startEdit(idx)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer' }}>✏️ Edit</button>
                            {post.status === 'pending' && <button onClick={() => approvePost(idx)} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>✓ Approve</button>}
                            <button onClick={() => deletePost(idx)} style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.6)', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer' }}>🗑</button>
                          </div>
                        </div>

                        {/* Post content */}
                        {editIdx === idx ? (
                          <div>
                            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4} className="dash-textarea" style={{ marginBottom: 12 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={saveEdit} style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #DB2777)', border: 'none', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Save Changes</button>
                              <button onClick={() => setEditIdx(null)} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.75)' }}>{post.content}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* CALENDAR VIEW */}
            {activeNav === 'calendar' && (
              <div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 32 }}>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', padding: '8px 0' }}>{d}</div>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1
                      const isToday = day === new Date().getDate()
                      const hasPosts = posts.length > 0 && [1, 3, 5, 8, 10, 12, 15, 17, 19, 22].includes(day)
                      return (
                        <div key={i} style={{ aspectRatio: '1', borderRadius: 10, background: isToday ? 'rgba(124,58,237,0.2)' : day > 0 && day <= 31 ? 'rgba(255,255,255,0.02)' : 'transparent', border: isToday ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4, cursor: day > 0 ? 'pointer' : 'default' }}>
                          {day > 0 && day <= 31 && <>
                            <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#a78bfa' : 'rgba(255,255,255,0.6)' }}>{day}</span>
                            {hasPosts && <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#E1306C' }} />
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1877F2' }} />
                            </div>}
                          </>}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 24, display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E1306C' }} /> Instagram</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1877F2' }} /> Facebook</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> TikTok</div>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS VIEW */}
            {activeNav === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {[
                    { label: 'Est. Reach This Week', value: `${(posts.length * 247).toLocaleString()}`, sub: '+12% vs last week', color: '#7C3AED' },
                    { label: 'Posts Published', value: stats.approved.toString(), sub: 'This month', color: '#10B981' },
                    { label: 'Hours Saved', value: `${stats.hoursSaved}h`, sub: 'AI did the work', color: '#DB2777' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Detailed Analytics Coming Soon</h3>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Connect your Instagram and Facebook accounts to see real engagement data, follower growth, and best-performing posts.</p>
                </div>
              </div>
            )}

            {/* SETTINGS VIEW */}
            {activeNav === 'settings' && (
              <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px' }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Business Profile</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { label: 'Business Name', key: 'name', type: 'input', placeholder: "Your business name" },
                      { label: 'Industry', key: 'industry', type: 'select', options: INDUSTRIES },
                      { label: 'Brand Tone', key: 'tone', type: 'select', options: TONES },
                      { label: 'About Your Business', key: 'description', type: 'textarea', placeholder: 'Describe your business...' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}>{f.label}</label>
                        {f.type === 'input' && <input value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} placeholder={f.placeholder} className="dash-input" />}
                        {f.type === 'select' && <select value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} className="dash-select">
                          {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>}
                        {f.type === 'textarea' && <textarea value={(business as any)[f.key]} onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))} rows={3} placeholder={f.placeholder} className="dash-textarea" />}
                      </div>
                    ))}
                    <button style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start' }}>Save Changes</button>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px' }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Connected Platforms</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Connect your accounts for direct posting (coming soon)</p>
                  {Object.entries(PLATFORM_CONFIG).map(([platform, cfg]) => (
                    <div key={platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{platform}</span>
                      </div>
                      <button style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'not-allowed' }}>Coming Soon</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

const dashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .dash-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 12px 16px;
    color: #fff;
    font-family: Inter, sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .dash-input:focus { border-color: rgba(124,58,237,0.5); }
  .dash-input::placeholder { color: rgba(255,255,255,0.2); }
  .dash-select {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 12px 16px;
    color: #fff;
    font-family: Inter, sans-serif;
    font-size: 14px;
    outline: none;
    cursor: pointer;
  }
  .dash-select option { background: #1a1a2e; }
  .dash-textarea {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 12px 16px;
    color: #fff;
    font-family: Inter, sans-serif;
    font-size: 14px;
    outline: none;
    resize: vertical;
    transition: border-color 0.2s;
  }
  .dash-textarea:focus { border-color: rgba(124,58,237,0.5); }
  .dash-textarea::placeholder { color: rgba(255,255,255,0.2); }
`
