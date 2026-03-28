import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [counters, setCounters] = useState({ posts: 0, businesses: 0, hours: 0 })
  const [countersStarted, setCountersStarted] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [navScrolled, setNavScrolled] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [activePlatform, setActivePlatform] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phraseRef = useRef(0)
  const charRef = useRef(0)
  const deletingRef = useRef(false)
  const animFrameRef = useRef(0)

  const phrases = ['Instagram.', 'TikTok.', 'Facebook.', 'X (Twitter).', 'Yelp reviews.', 'Google reviews.', 'your entire presence.']

  useEffect(() => {
    const onScroll = () => { setScrollY(window.scrollY); setNavScrolled(window.scrollY > 60) }
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouse)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse) }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id || entry.target.getAttribute('data-id') || ''
          setVisibleSections(prev => new Set([...prev, id]))
          if (id === 'stats-section' && !countersStarted) setCountersStarted(true)
        }
      })
    }, { threshold: 0.15 })
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [countersStarted])

  useEffect(() => {
    if (!countersStarted) return
    const targets = { posts: 18400, businesses: 1240, hours: 6200 }
    const duration = 2200
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setCounters({ posts: Math.floor(e * targets.posts), businesses: Math.floor(e * targets.businesses), hours: Math.floor(e * targets.hours) })
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [countersStarted])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const type = () => {
      const phrase = phrases[phraseRef.current]
      if (!deletingRef.current) {
        if (charRef.current < phrase.length) { setTypedText(phrase.substring(0, charRef.current + 1)); charRef.current++; t = setTimeout(type, 65) }
        else { t = setTimeout(() => { deletingRef.current = true; type() }, 2200) }
      } else {
        if (charRef.current > 0) { setTypedText(phrase.substring(0, charRef.current - 1)); charRef.current--; t = setTimeout(type, 28) }
        else { deletingRef.current = false; phraseRef.current = (phraseRef.current + 1) % phrases.length; t = setTimeout(type, 400) }
      }
    }
    t = setTimeout(type, 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const pts: { x: number; y: number; vx: number; vy: number; size: number; hue: number }[] = []
    for (let i = 0; i < 55; i++) pts.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, size: Math.random() * 2 + .5, hue: Math.random() * 60 + 250 })
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},80%,72%,0.45)`; ctx.fill()
      })
      pts.forEach((p, i) => pts.slice(i + 1).forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y)
        if (d < 110) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `hsla(270,70%,72%,${.07 * (1 - d / 110)})`; ctx.lineWidth = .5; ctx.stroke() }
      }))
      animFrameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animFrameRef.current); window.removeEventListener('resize', resize) }
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try { const res = await fetch('/api/checkout', { method: 'POST' }); const { url } = await res.json(); window.location.href = url }
    catch { alert('Something went wrong.'); setLoading(false) }
  }

  const isVisible = (id: string) => visibleSections.has(id)

  const platforms = [
    { name: 'Instagram', icon: '📸', color: '#E1306C', bg: '#fff0f5', desc: 'AI writes captions, hashtags, and schedules posts at peak times for your audience.' },
    { name: 'TikTok', icon: '🎵', color: '#010101', bg: '#f5f5f5', desc: 'Punchy hooks and trending sounds. AI writes scroll-stopping TikTok captions.' },
    { name: 'Facebook', icon: '📘', color: '#1877F2', bg: '#f0f5ff', desc: 'Long-form posts, event announcements, and community updates — all automated.' },
    { name: 'X (Twitter)', icon: '𝕏', color: '#14171A', bg: '#f5f8fa', desc: 'Witty, on-brand tweets with threads. Engage your audience in real time.' },
    { name: 'Yelp', icon: '⭐', color: '#D32323', bg: '#fff5f5', desc: 'AI responds to Yelp reviews professionally and promptly. Never miss a review.' },
    { name: 'Google Reviews', icon: '🔍', color: '#4285F4', bg: '#f0f5ff', desc: 'Auto-respond to Google reviews. Boost your local SEO with every reply.' },
    { name: 'LinkedIn', icon: '💼', color: '#0A66C2', bg: '#f0f5ff', desc: 'Professional thought leadership posts and company updates on autopilot.' },
    { name: 'Pinterest', icon: '📌', color: '#E60023', bg: '#fff5f5', desc: 'Pin descriptions and board content written by AI to drive discovery.' },
  ]

  const tabs = [
    { label: '🍕 Restaurant', post: `Fresh from our kitchen to your table tonight 🍕 Our chef just dropped something incredible — come taste why we've been Long Island's favorite for 12 years. Limited tables available! Book now or order online. #longislandeats #italianfood #freshdaily #foodie` },
    { label: '✂️ Barbershop', post: `New week. Fresh cut. 💈 Our chairs are open and ready for you. Walk-ins welcome all day — no appointment needed. Come look sharp, feel sharp. ✂️ #barbershop #freshcut #barberlife #mensgrooming #lookgood` },
    { label: '👗 Boutique', post: `New arrivals just landed and they are EVERYTHING 🛍️ Spring 2026 collection is in — pieces going fast. Come see us in store or DM to reserve your size before it's gone! 💫 #boutique #newcollection #shoplocal #fashion` },
    { label: '💪 Gym', post: `Your best workout is waiting for you 💪 Free drop-in class today at 6PM — no experience needed, just show up ready. 🔥 Tag someone who needs to move their body today. #fitness #gym #workout #getfit #healthylifestyle` },
  ]

  return (
    <>
      <Head>
        <title>PostWiz – AI Social Media & Review Manager</title>
        <meta name="description" content="PostWiz manages your Instagram, TikTok, Facebook, X, Yelp, Google Reviews and more — automatically using AI." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0d0d1f; color: #fff; font-family: 'Inter', sans-serif; overflow-x: hidden; cursor: none; }
        .syne { font-family: 'Syne', sans-serif; }

        #cursor-dot { position:fixed; width:8px; height:8px; background:#c084fc; border-radius:50%; pointer-events:none; z-index:9999; transform:translate(-50%,-50%); mix-blend-mode:difference; }
        #cursor-ring { position:fixed; width:38px; height:38px; border:1.5px solid rgba(192,132,252,0.5); border-radius:50%; pointer-events:none; z-index:9998; transform:translate(-50%,-50%); transition:left .1s ease,top .1s ease,width .2s,height .2s,border-color .2s; }
        body:has(button:hover) #cursor-ring, body:has(a:hover) #cursor-ring { width:52px; height:52px; border-color:rgba(244,114,182,0.7); background:rgba(244,114,182,0.04); }

        .gt { background:linear-gradient(135deg,#c084fc,#f472b6,#fb923c); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .gt2 { background:linear-gradient(90deg,#8b5cf6,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .gt-dark { background:linear-gradient(135deg,#7c3aed,#db2777); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        .nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:22px 60px; display:flex; align-items:center; justify-content:space-between; transition:all .4s; }
        .nav.scrolled { background:rgba(13,13,31,0.88); backdrop-filter:blur(24px); padding:14px 60px; border-bottom:1px solid rgba(255,255,255,0.07); }
        .nav-logo { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; }
        .nav-links { display:flex; align-items:center; gap:40px; }
        .nav-link { color:rgba(255,255,255,0.55); text-decoration:none; font-size:14px; font-weight:500; transition:color .2s; position:relative; }
        .nav-link::after { content:''; position:absolute; bottom:-4px; left:0; width:0; height:1.5px; background:linear-gradient(90deg,#8b5cf6,#ec4899); transition:width .3s; }
        .nav-link:hover { color:#fff; }
        .nav-link:hover::after { width:100%; }

        .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:'Inter',sans-serif; font-weight:600; cursor:none; border:none; transition:all .3s; }
        .btn-primary { background:linear-gradient(135deg,#8b5cf6,#ec4899); color:white; padding:14px 34px; border-radius:50px; font-size:15px; position:relative; overflow:hidden; box-shadow:0 0 30px rgba(139,92,246,0.35); }
        .btn-primary::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,#a78bfa,#f472b6); opacity:0; transition:opacity .3s; }
        .btn-primary:hover::after { opacity:1; }
        .btn-primary span { position:relative; z-index:1; }
        .btn-primary:disabled { opacity:.6; }
        .btn-lg { padding:19px 52px; font-size:18px; }
        .btn-ghost { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.12); padding:13px 30px; border-radius:50px; font-size:15px; }
        .btn-ghost:hover { background:rgba(255,255,255,0.12); color:#fff; border-color:rgba(255,255,255,0.22); }

        .reveal { opacity:0; transform:translateY(40px); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); }
        .reveal.from-left { transform:translateX(-50px); }
        .reveal.from-right { transform:translateX(50px); }
        .reveal.scale-up { transform:scale(0.93); }
        .reveal.visible { opacity:1; transform:none; }
        .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}.d5{transition-delay:.5s}.d6{transition-delay:.6s}

        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes floatB { 0%,100%{transform:translateY(-7px)} 50%{transform:translateY(7px)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-40px) scale(1.06)} 66%{transform:translate(-30px,25px) scale(.97)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,25px) scale(1.04)} 66%{transform:translate(35px,-45px) scale(.96)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.88)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
        @keyframes slideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

        .shimmer { background:linear-gradient(90deg,#c084fc,#f472b6,#fb923c,#c084fc); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
        .animate-float { animation:float 5s ease-in-out infinite; }
        .animate-floatB { animation:floatB 4s ease-in-out infinite 1s; }
        .animate-pulse { animation:pulse 2s ease-in-out infinite; }

        .section { max-width:1200px; margin:0 auto; padding:0 40px; }
        .section-label { font-size:12px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#c084fc; margin-bottom:16px; display:block; }

        .glass { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:24px; backdrop-filter:blur(16px); transition:all .35s; }
        .glass:hover { background:rgba(255,255,255,0.09); border-color:rgba(139,92,246,0.3); transform:translateY(-5px); box-shadow:0 20px 60px rgba(0,0,0,0.35),0 0 0 1px rgba(139,92,246,0.12); }

        .light-bg { background:#f6f5ff; color:#0d0d1f; }
        .light-bg2 { background:#fff; color:#0d0d1f; }

        .cursor-blink { display:inline-block; width:3px; height:.85em; background:#f472b6; margin-left:3px; border-radius:2px; animation:blink 1s step-end infinite; vertical-align:text-bottom; }

        .notif { background:rgba(255,255,255,0.09); border:1px solid rgba(255,255,255,0.13); border-radius:16px; padding:14px 18px; backdrop-filter:blur(24px); }

        .platform-pill { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:50px; border:1.5px solid; font-size:14px; font-weight:600; cursor:none; transition:all .25s; white-space:nowrap; }

        .marquee-wrap { overflow:hidden; }
        .marquee-track { display:flex; animation:marquee 20s linear infinite; white-space:nowrap; }
        .marquee-item { padding:0 28px; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; }

        .tab-btn { padding:10px 22px; border-radius:50px; border:1.5px solid rgba(255,255,255,0.12); background:transparent; color:rgba(255,255,255,0.5); font-family:'Inter',sans-serif; font-size:14px; font-weight:500; cursor:none; transition:all .25s; }
        .tab-btn.active { background:linear-gradient(135deg,#8b5cf6,#ec4899); border-color:transparent; color:white; box-shadow:0 0 24px rgba(139,92,246,0.4); }
        .tab-btn:hover:not(.active) { border-color:rgba(255,255,255,0.25); color:rgba(255,255,255,.75); }

        .feat-card { background:#fff; border-radius:20px; border:1.5px solid rgba(0,0,0,.06); padding:28px; transition:all .3s; cursor:default; }
        .feat-card:hover { transform:translateY(-6px); box-shadow:0 24px 60px rgba(0,0,0,.1); border-color:rgba(139,92,246,.2); }

        .pricing-border { position:absolute; inset:0; border-radius:28px; padding:1.5px; background:linear-gradient(135deg,rgba(139,92,246,.5),rgba(236,72,153,.5),rgba(251,146,60,.3)); -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0); -webkit-mask-composite:xor; pointer-events:none; }

        @media(max-width:900px){ .nav{padding:16px 24px;} .nav.scrolled{padding:12px 24px;} .nav-links{gap:20px;} .section{padding:0 20px;} body{cursor:auto;} #cursor-dot,#cursor-ring{display:none;} }
      `}</style>

      <div id="cursor-dot" style={{ left: mousePos.x, top: mousePos.y }} />
      <div id="cursor-ring" style={{ left: mousePos.x, top: mousePos.y }} />
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.45 }} />

      {/* NAV */}
      <nav className={`nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo syne">Post<span className="gt2">Wiz</span></div>
        <div className="nav-links">
          <a href="#platforms" className="nav-link">Platforms</a>
          <a href="/studio" style={{color:'rgba(255,255,255,0.55)',textDecoration:'none',fontSize:'14px',fontWeight:500}}>🎨 Studio</a>
          <a href="#demo" className="nav-link">Live Demo</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <button onClick={handleSubscribe} className="btn btn-primary" style={{ padding: '11px 28px', fontSize: '14px' }}><span>Start Free →</span></button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* ══════ HERO ══════ */}
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
          {/* Bright orbs */}
          <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.22) 0%,transparent 65%)', top: '-25%', left: '-20%', animation: 'orb1 16s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.18) 0%,transparent 65%)', top: '5%', right: '-18%', animation: 'orb2 20s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,146,60,.14) 0%,transparent 65%)', bottom: '-15%', left: '30%', animation: 'orb1 13s ease-in-out infinite 4s', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,153,.12) 0%,transparent 65%)', bottom: '10%', right: '10%', animation: 'orb2 11s ease-in-out infinite 2s', pointerEvents: 'none' }} />

          {/* Floating cards */}
          <div className="notif animate-float" style={{ position: 'absolute', left: '4%', top: '30%', width: 215, textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>📸 Posted to Instagram</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Your daily special is live! ✨</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ height: 4, flex: 1, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}><div style={{ height: '100%', width: '73%', background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', borderRadius: 2 }} /></div>
              <span style={{ fontSize: 11, color: '#c084fc' }}>↑ 247 likes</span>
            </div>
          </div>

          <div className="notif animate-floatB" style={{ position: 'absolute', right: '4%', top: '26%', width: 210, textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>⭐ New Yelp Review Reply</div>
            <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>AI replied professionally in 30 seconds</div>
            <div style={{ fontSize: 11, color: '#34d399', marginTop: 6 }}>✓ Review management active</div>
          </div>

          <div className="notif animate-float" style={{ position: 'absolute', left: '6%', bottom: '24%', width: 190, textAlign: 'left', animationDelay: '2s' }}>
            <div style={{ fontSize: 11, color: '#34d399', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />New customer</div>
            <div style={{ fontSize: 13 }}>Found you via Google Review</div>
          </div>

          <div className="notif animate-floatB" style={{ position: 'absolute', right: '5%', bottom: '26%', width: 205, textAlign: 'left', animationDelay: '1s' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>📊 This week across all platforms</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[{ v: '21', l: 'posts' }, { v: '4.8k', l: 'reach' }, { v: '+12', l: 'reviews' }].map(s => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.l === 'posts' ? '#f472b6' : s.l === 'reach' ? '#c084fc' : '#34d399' }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero text */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 860 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 50, padding: '9px 22px', marginBottom: 36 }}>
              <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#c084fc', display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#ddd6fe' }}>8 platforms managed · Social + Reviews · AI-powered</span>
            </div>

            <h1 className="syne" style={{ fontSize: 'clamp(48px,7.5vw,96px)', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-3px', marginBottom: 28 }}>
              AI manages your<br /><span className="gt">{typedText}<span className="cursor-blink" /></span>
            </h1>

            <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.5)', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.85, fontWeight: 300 }}>
              PostWiz handles Instagram, TikTok, Facebook, X, LinkedIn, Pinterest, Yelp, and Google Reviews — all automatically. Tell us about your business once. We do everything else.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary btn-lg"><span>{loading ? 'Loading...' : 'Start 7-Day Free Trial →'}</span></button>
                <button className="btn btn-ghost" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>Watch it work</button>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)' }}>No credit card · 2 minute setup · Cancel anytime</p>
            </div>

            {/* Platform icons row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 56, flexWrap: 'wrap' }}>
              {platforms.map(p => (
                <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.7, transition: 'opacity .2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.icon}</div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{p.name}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.3 }}>
              <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Scroll to explore</span>
              <div style={{ width: 1, height: 44, background: 'linear-gradient(to bottom,rgba(255,255,255,.5),transparent)' }} />
            </div>
          </div>
        </section>

        {/* ══════ MARQUEE ══════ */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 0', overflow: 'hidden' }}>
          <div className="marquee-track">
            {['Instagram', 'TikTok', 'Facebook', 'X Twitter', 'Yelp Reviews', 'Google Reviews', 'LinkedIn', 'Pinterest', 'AI Writing', 'Auto-Schedule', 'Brand Voice', 'Analytics', 'Instagram', 'TikTok', 'Facebook', 'X Twitter', 'Yelp Reviews', 'Google Reviews', 'LinkedIn', 'Pinterest', 'AI Writing', 'Auto-Schedule', 'Brand Voice', 'Analytics'].map((t, i) => (
              <span key={i} className="marquee-item" style={{ color: i % 5 === 0 ? '#c084fc' : i % 5 === 1 ? '#f472b6' : i % 5 === 2 ? '#fb923c' : i % 5 === 3 ? '#34d399' : 'rgba(255,255,255,0.2)' }}>✦ {t}</span>
            ))}
          </div>
        </div>

        {/* ══════ STATS — light ══════ */}
        <section id="stats-section" data-reveal data-id="stats-section" className="light-bg" style={{ padding: '100px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="section-label" style={{ color: '#8b5cf6' }}>By the numbers</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#0d0d1f', letterSpacing: '-1.5px', lineHeight: 1.1 }}>PostWiz works while<br /><span className="gt-dark">you run your business.</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { num: counters.posts.toLocaleString() + '+', label: 'Posts Generated', sub: 'Across all platforms', color: '#8b5cf6', icon: '✍️' },
                { num: counters.businesses.toLocaleString() + '+', label: 'Active Businesses', sub: 'Every industry', color: '#ec4899', icon: '🏢' },
                { num: counters.hours.toLocaleString() + 'h', label: 'Hours Saved', sub: 'Time back to owners', color: '#f59e0b', icon: '⚡' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 24, padding: '40px 36px', textAlign: 'center', boxShadow: '0 4px 30px rgba(0,0,0,0.05)', transition: 'all .3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = `0 20px 60px rgba(0,0,0,0.1),0 0 0 2px ${s.color}20` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 4px 30px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{s.icon}</div>
                  <div className="syne" style={{ fontSize: 52, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0d0d1f', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ PLATFORMS ══════ */}
        <section id="platforms" style={{ padding: '120px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="section-label">All Platforms</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4.5vw,58px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 16 }}>
                One tool. <span className="gt">Every platform.</span>
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', maxWidth: 520, margin: '0 auto' }}>Social media posting AND review management — everything your online presence needs, handled by AI.</p>
            </div>

            {/* Platform selector */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
              {platforms.map((p, i) => (
                <button key={p.name} onClick={() => setActivePlatform(i)} style={{ padding: '10px 20px', borderRadius: 50, border: `1.5px solid ${activePlatform === i ? p.color : 'rgba(255,255,255,0.1)'}`, background: activePlatform === i ? p.color + '18' : 'transparent', color: activePlatform === i ? p.color : 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all .25s', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span>{p.icon}</span>{p.name}
                </button>
              ))}
            </div>

            {/* Active platform detail */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${platforms[activePlatform].color}30`, borderRadius: 24, padding: '36px 40px', maxWidth: 700, margin: '0 auto', textAlign: 'center', transition: 'all .3s', animation: 'slideIn .3s ease' }} key={activePlatform}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{platforms[activePlatform].icon}</div>
              <h3 className="syne" style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: platforms[activePlatform].color }}>{platforms[activePlatform].name}</h3>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 480, margin: '0 auto 24px' }}>{platforms[activePlatform].desc}</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: platforms[activePlatform].color + '15', border: `1px solid ${platforms[activePlatform].color}30`, borderRadius: 50, padding: '8px 18px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, color: platforms[activePlatform].color, fontWeight: 600 }}>Fully automated by PostWiz</span>
              </div>
            </div>

            {/* Grid of all platforms */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 40 }}>
              {platforms.map((p, i) => (
                <div key={p.name} onClick={() => setActivePlatform(i)} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${i === activePlatform ? p.color + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: 18, padding: '24px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all .3s', transform: i === activePlatform ? 'scale(1.03)' : 'scale(1)' }}
                  onMouseEnter={e => { if (i !== activePlatform) (e.currentTarget as HTMLElement).style.borderColor = p.color + '30' }}
                  onMouseLeave={e => { if (i !== activePlatform) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: i === activePlatform ? p.color : 'rgba(255,255,255,0.6)' }}>{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ HOW IT WORKS — light ══════ */}
        <section id="how" className="light-bg" style={{ padding: '120px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <span className="section-label" style={{ color: '#8b5cf6' }}>How it works</span>
              <h2 className="syne" style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, letterSpacing: '-2px', color: '#0d0d1f', lineHeight: 1.05 }}>
                Three steps.<br /><span className="gt-dark">Then autopilot forever.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { n: '01', icon: '✏️', title: 'Tell us about your business', desc: 'Business name, industry, brand tone, which platforms you want. 2 minutes max. Only done once.', color: '#8b5cf6' },
                { n: '02', icon: '🤖', title: 'AI generates all your content', desc: 'We write a full week of posts for every platform plus draft review responses — calibrated to your exact brand voice.', color: '#ec4899' },
                { n: '03', icon: '🚀', title: 'Everything goes live automatically', desc: 'Posts publish at peak times. Review replies go out instantly. Your entire online presence runs itself.', color: '#f59e0b' },
              ].map((s, i) => (
                <div key={s.n} style={{ background: '#fff', border: `1px solid rgba(0,0,0,0.06)`, borderRadius: 24, padding: '40px 36px', boxShadow: '0 4px 30px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', transition: 'all .3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = `0 20px 60px rgba(0,0,0,0.1)` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 4px 30px rgba(0,0,0,0.05)' }}>
                  <div style={{ position: 'absolute', top: -12, right: 20, fontFamily: 'Syne,sans-serif', fontSize: 80, fontWeight: 800, color: s.color, opacity: 0.06, lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 36, marginBottom: 20 }}>{s.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: s.color, marginBottom: 10 }}>Step {s.n}</div>
                  <h3 className="syne" style={{ fontSize: 21, fontWeight: 700, marginBottom: 12, color: '#0d0d1f', letterSpacing: '-.3px' }}>{s.title}</h3>
                  <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.5)', lineHeight: 1.8 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ LIVE DEMO ══════ */}
        <section id="demo" style={{ padding: '120px 40px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="section-label">Live Demo</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16 }}>
                See what AI writes <span className="gt">for your business.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', maxWidth: 440, margin: '0 auto' }}>Click your industry and watch AI generate a real post in seconds.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
              {tabs.map((t, i) => <button key={i} onClick={() => setActiveTab(i)} className={`tab-btn ${activeTab === i ? 'active' : ''}`}>{t.label}</button>)}
            </div>

            {/* Post card — white */}
            <div style={{ background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 12px 60px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)', maxWidth: 680, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0d0d1f' }}>PostWiz AI</div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>Generated just now · Instagram</div>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 50 }}>📸 Ready to post</div>
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: '#333', marginBottom: 24 }}>{tabs[activeTab].post}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', padding: '11px 24px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>✓ Approve & Schedule</button>
                <button style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.55)', padding: '11px 18px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, cursor: 'pointer' }}>✏️ Edit</button>
                <button style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.55)', padding: '11px 18px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, cursor: 'pointer' }}>↻ Regenerate</button>
              </div>
            </div>

            {/* Review response example */}
            <div style={{ maxWidth: 680, margin: '24px auto 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '24px 28px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#c084fc', marginBottom: 14 }}>⭐ Yelp Review Response (AI-generated)</div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 18px', marginBottom: 12, fontSize: 14, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                  &ldquo;Amazing food as always! The garlic knots were incredible. Will definitely be back!&rdquo; — Sarah K. ★★★★★
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  Thank you so much, Sarah! 🙏 Our garlic knots are definitely a fan favorite — glad they lived up to the hype! We can&apos;t wait to welcome you back. Next time, make sure to try our new seasonal special!
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', padding: '4px 12px', borderRadius: 50, fontWeight: 600 }}>✓ Posted to Yelp</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Responded in 28 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ TESTIMONIALS — light ══════ */}
        <section className="light-bg2" style={{ padding: '120px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="section-label" style={{ color: '#8b5cf6' }}>Testimonials</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#0d0d1f', letterSpacing: '-1.5px' }}>Real businesses.<br /><span className="gt-dark">Real results.</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { n: 'Maria G.', b: 'Pizzeria · Long Island', q: 'I used to post once a week at best. PostWiz posts every day and responds to my Yelp reviews automatically. I get 3x more customers finding me online now.', stars: 5, color: '#E1306C' },
                { n: 'Jason T.', b: 'Barbershop · Queens', q: 'Set it up in 5 minutes, never touched it again. It posts to Instagram and TikTok daily, responds to Google reviews, and I\'ve got 6 new clients this month from it.', stars: 5, color: '#8b5cf6' },
                { n: 'Sandra K.', b: 'Boutique · Brooklyn', q: 'Zero time spent on social media or reviews. PostWiz handles everything across every platform. My engagement is up 200% and my Google rating went from 4.1 to 4.8.', stars: 5, color: '#f59e0b' },
              ].map(t => (
                <div key={t.n} style={{ background: '#fff', borderRadius: 24, padding: '32px', boxShadow: '0 4px 30px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', transition: 'all .3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 4px 30px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>{Array(t.stars).fill(0).map((_, i) => <span key={i} style={{ color: t.color, fontSize: 16 }}>★</span>)}</div>
                  <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.62)', lineHeight: 1.9, marginBottom: 24, fontStyle: 'italic' }}>&ldquo;{t.q}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${t.color}20,${t.color}10)`, border: `1.5px solid ${t.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: t.color, fontFamily: 'Syne,sans-serif' }}>{t.n[0]}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: '#0d0d1f' }}>{t.n}</div><div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>{t.b}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ PRICING ══════ */}
        <section id="pricing" style={{ padding: '120px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.15) 0%,transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.1) 0%,transparent 65%)', top: '20%', right: '10%', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="section-label">Pricing</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12 }}>One price. <span className="gt">Everything included.</span></h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)' }}>All 8 platforms. Social + Reviews. Cancel anytime.</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '48px 44px', position: 'relative', backdropFilter: 'blur(20px)' }}>
              <div className="pricing-border" />
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.28)', color: '#ddd6fe', padding: '6px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>All 8 Platforms Included</div>
                <div className="syne" style={{ fontSize: 88, fontWeight: 800, lineHeight: 1 }}><span className="gt">$29</span></div>
                <div style={{ color: 'rgba(255,255,255,0.3)', marginTop: 8, fontSize: 15 }}>per month · billed monthly</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {['Instagram, TikTok, Facebook & X', 'LinkedIn & Pinterest posting', 'Yelp review auto-responses', 'Google Review management', 'Unlimited AI-written content', 'Smart scheduling & analytics', 'Cancel anytime'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#34d399', fontSize: 12, fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.75)' }}>{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '19px', fontSize: '17px', borderRadius: 16 }}>
                <span>{loading ? 'Loading...' : 'Start 7-Day Free Trial →'}</span>
              </button>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 14 }}>7 days free · then $29/month · no contracts</p>
            </div>
          </div>
        </section>

        {/* ══════ FINAL CTA — light ══════ */}
        <section className="light-bg" style={{ padding: '120px 40px', textAlign: 'center' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 className="syne" style={{ fontSize: 'clamp(40px,6vw,80px)', fontWeight: 800, color: '#0d0d1f', letterSpacing: '-3px', lineHeight: 1.0, marginBottom: 20 }}>
              Your entire online presence,<br /><span className="gt-dark">on autopilot.</span>
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)', marginBottom: 48, fontWeight: 300 }}>Instagram, TikTok, Facebook, X, LinkedIn, Pinterest, Yelp, Google Reviews — all managed by AI for $29/month.</p>
            <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary btn-lg" style={{ fontSize: '18px', padding: '20px 56px' }}>
              <span>{loading ? 'Loading...' : 'Get Started Free — No Card Needed'}</span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: '#0d0d1f', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="syne" style={{ fontSize: 20, fontWeight: 800 }}>Post<span className="gt2">Wiz</span></div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>© 2026 PostWiz. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>{['Privacy', 'Terms'].map(l => <a key={l} href={`/${l.toLowerCase()}`} style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontSize: 13 }}>{l}</a>)}</div>
        </footer>
      </main>
    </>
  )
}
