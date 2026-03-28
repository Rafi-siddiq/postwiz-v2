import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [winH, setWinH] = useState(800)
  const [typedText, setTypedText] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [counters, setCounters] = useState({ posts: 0, businesses: 0, hours: 0 })
  const [countersStarted, setCountersStarted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const phraseRef = useRef(0)
  const charRef = useRef(0)
  const deletingRef = useRef(false)

  const phrases = ['Instagram.', 'TikTok.', 'Yelp Reviews.', 'Google Reviews.', 'X (Twitter).', 'all of it.']

  // scroll + mouse
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    const onResize = () => setWinH(window.innerHeight)
    setWinH(window.innerHeight)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize) }
  }, [])

  // typing
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const type = () => {
      const phrase = phrases[phraseRef.current]
      if (!deletingRef.current) {
        if (charRef.current < phrase.length) { setTypedText(phrase.substring(0, charRef.current + 1)); charRef.current++; t = setTimeout(type, 70) }
        else { t = setTimeout(() => { deletingRef.current = true; type() }, 2000) }
      } else {
        if (charRef.current > 0) { setTypedText(phrase.substring(0, charRef.current - 1)); charRef.current--; t = setTimeout(type, 35) }
        else { deletingRef.current = false; phraseRef.current = (phraseRef.current + 1) % phrases.length; t = setTimeout(type, 300) }
      }
    }
    t = setTimeout(type, 800)
    return () => clearTimeout(t)
  }, [])

  // counters
  useEffect(() => {
    const el = document.getElementById('stats-trigger')
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !countersStarted) {
        setCountersStarted(true)
        const targets = { posts: 18400, businesses: 1240, hours: 6200 }
        const start = Date.now()
        const tick = () => {
          const p = Math.min((Date.now() - start) / 2000, 1)
          const e = 1 - Math.pow(1 - p, 3)
          setCounters({ posts: Math.floor(e * targets.posts), businesses: Math.floor(e * targets.businesses), hours: Math.floor(e * targets.hours) })
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [countersStarted])

  // canvas particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const pts: { x: number; y: number; vx: number; vy: number; r: number; h: number }[] = []
    for (let i = 0; i < 50; i++) pts.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.8 + .4, h: Math.random() * 60 + 240 })
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.h},75%,70%,0.4)`; ctx.fill()
      })
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < 100) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `hsla(265,65%,70%,${.06 * (1 - d / 100)})`; ctx.lineWidth = .5; ctx.stroke() }
      }))
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try { const res = await fetch('/api/checkout', { method: 'POST' }); const { url } = await res.json(); window.location.href = url }
    catch { alert('Something went wrong.'); setLoading(false) }
  }

  // Scroll math helpers
  const s = (start: number, end: number, val: number) => Math.max(0, Math.min(1, (val - start) / (end - start)))
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  // Section scroll progress values
  const heroProgress = s(0, winH * 0.8, scrollY)              // 0-1 as hero exits
  const step1Progress = s(winH * 0.5, winH * 1.2, scrollY)   // step 1 enters
  const step2Progress = s(winH * 1.0, winH * 1.8, scrollY)   // step 2 enters
  const step3Progress = s(winH * 1.5, winH * 2.3, scrollY)   // step 3 enters
  const featProgress = s(winH * 2.2, winH * 3.0, scrollY)    // features section
  const demoProgress = s(winH * 3.2, winH * 4.0, scrollY)    // demo section

  const tabs = [
    { label: '🍕 Restaurant', post: `Fresh from our kitchen to your table tonight 🍕 Our chef just dropped something incredible — come taste why we've been Long Island's favorite for 12 years. Limited tables tonight! Book now or order online. #longislandeats #italianfood #freshdaily #foodie` },
    { label: '✂️ Barbershop', post: `New week. Fresh cut. 💈 Our chairs are open and ready for you. Walk-ins welcome all day — no appointment needed. Come look sharp, feel sharp. ✂️ #barbershop #freshcut #barberlife #mensgrooming #lookgood` },
    { label: '👗 Boutique', post: `New arrivals just landed 🛍️ Spring collection is in — pieces going fast. Come see us or DM to reserve your size before it's gone! 💫 #boutique #newcollection #shoplocal #fashion #springvibes` },
    { label: '💪 Gym', post: `Your best workout is waiting 💪 Free drop-in class today at 6PM — no experience needed, just show up. 🔥 Tag someone who needs to move their body today. #fitness #gym #workout #getfit #motivation` },
  ]

  const platforms = [
    { name: 'Instagram', icon: '📸', color: '#E1306C' },
    { name: 'TikTok', icon: '🎵', color: '#69C9D0' },
    { name: 'Facebook', icon: '📘', color: '#1877F2' },
    { name: 'X (Twitter)', icon: '𝕏', color: '#14171A' },
    { name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    { name: 'Pinterest', icon: '📌', color: '#E60023' },
    { name: 'Yelp', icon: '⭐', color: '#D32323' },
    { name: 'Google Reviews', icon: '🔍', color: '#4285F4' },
  ]

  return (
    <>
      <Head>
        <title>PostWiz – AI Social Media & Review Manager</title>
        <meta name="description" content="PostWiz manages Instagram, TikTok, Facebook, X, Yelp, Google Reviews and more — automatically." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: auto; }
        body { background: #f5f3ff; color: #1a1035; font-family: 'Inter', sans-serif; overflow-x: hidden; cursor: none; }
        .syne { font-family: 'Syne', sans-serif; }

        /* Custom cursor */
        #cdot { position:fixed; width:10px; height:10px; background:#8b5cf6; border-radius:50%; pointer-events:none; z-index:9999; transform:translate(-50%,-50%); mix-blend-mode:multiply; transition:transform .1s; }
        #cring { position:fixed; width:40px; height:40px; border:1.5px solid rgba(139,92,246,.45); border-radius:50%; pointer-events:none; z-index:9998; transform:translate(-50%,-50%); transition:left .08s ease,top .08s ease,width .2s,height .2s,border-color .2s; }
        body:has(button:hover) #cring { width:56px; height:56px; border-color:rgba(236,72,153,.7); }

        /* Nav */
        .nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:22px 60px; display:flex; align-items:center; justify-content:space-between; transition:all .4s; }
        .nav.on { background:rgba(245,243,255,.92); backdrop-filter:blur(24px); padding:14px 60px; border-bottom:1px solid rgba(139,92,246,.1); box-shadow:0 2px 20px rgba(139,92,246,.08); }
        .nav-logo { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; color:#1a1035; }
        .nav-link { color:rgba(26,16,53,.5); text-decoration:none; font-size:14px; font-weight:500; transition:color .2s; }
        .nav-link:hover { color:#8b5cf6; }
        .gt { background:linear-gradient(135deg,#8b5cf6,#ec4899,#f97316); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .gt-dark { background:linear-gradient(135deg,#7c3aed,#db2777); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        /* Buttons */
        .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:'Inter',sans-serif; font-weight:600; cursor:none; border:none; transition:all .3s; }
        .btn-primary { background:linear-gradient(135deg,#8b5cf6,#ec4899); color:white; padding:15px 36px; border-radius:50px; font-size:16px; box-shadow:0 8px 32px rgba(139,92,246,.35); }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(139,92,246,.5); }
        .btn-primary:disabled { opacity:.6; transform:none; }
        .btn-lg { padding:20px 52px; font-size:18px; }
        .btn-soft { background:rgba(139,92,246,.08); color:#8b5cf6; border:1.5px solid rgba(139,92,246,.2); padding:14px 32px; border-radius:50px; font-size:15px; }
        .btn-soft:hover { background:rgba(139,92,246,.14); }
        .btn-white { background:#fff; color:#1a1035; border:1.5px solid rgba(0,0,0,.08); padding:14px 32px; border-radius:50px; font-size:15px; box-shadow:0 4px 16px rgba(0,0,0,.06); }
        .btn-white:hover { box-shadow:0 8px 32px rgba(0,0,0,.1); transform:translateY(-1px); }

        /* Animations */
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes floatB { 0%,100%{transform:translateY(-8px) rotate(-2deg)} 50%{transform:translateY(8px) rotate(-2deg)} }
        @keyframes blink  { 0%,100%{opacity:1}50%{opacity:0} }
        @keyframes marquee{ from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes orb1   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,-40px)} }
        @keyframes orb2   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-50px,30px)} }
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes slideIn{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes shimmer{ from{background-position:-200% center} to{background-position:200% center} }

        .float-a { animation:float 5s ease-in-out infinite; }
        .float-b { animation:floatB 4s ease-in-out infinite 1.2s; }
        .pulse-dot { animation:pulse 2s ease-in-out infinite; }
        .cursor-blink { display:inline-block; width:3px; height:.85em; background:#ec4899; margin-left:3px; border-radius:2px; animation:blink 1s step-end infinite; vertical-align:text-bottom; }
        .shimmer { background:linear-gradient(90deg,#8b5cf6,#ec4899,#f97316,#8b5cf6); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }

        .card { background:#fff; border-radius:24px; border:1px solid rgba(139,92,246,.08); box-shadow:0 4px 24px rgba(139,92,246,.06); }
        .glass-light { background:rgba(255,255,255,.7); border:1px solid rgba(139,92,246,.1); border-radius:20px; backdrop-filter:blur(20px); }
        .notif { background:rgba(255,255,255,.85); border:1px solid rgba(139,92,246,.12); border-radius:16px; padding:14px 18px; backdrop-filter:blur(20px); box-shadow:0 8px 32px rgba(139,92,246,.08); }

        .tab-btn { padding:10px 22px; border-radius:50px; border:1.5px solid rgba(139,92,246,.15); background:transparent; color:rgba(26,16,53,.45); font-family:'Inter',sans-serif; font-size:14px; font-weight:500; cursor:none; transition:all .25s; }
        .tab-btn.active { background:linear-gradient(135deg,#8b5cf6,#ec4899); border-color:transparent; color:white; box-shadow:0 6px 20px rgba(139,92,246,.3); }
        .tab-btn:hover:not(.active) { border-color:rgba(139,92,246,.3); color:#8b5cf6; }

        .section-label { font-size:12px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#8b5cf6; display:block; margin-bottom:14px; }

        @media(max-width:900px){ .nav{padding:16px 24px;}.nav.on{padding:12px 24px;} body{cursor:auto;} #cdot,#cring{display:none;} }
      `}</style>

      {/* Cursor */}
      <div id="cdot" style={{ left: mousePos.x, top: mousePos.y }} />
      <div id="cring" style={{ left: mousePos.x, top: mousePos.y }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.25 }} />

      {/* Nav */}
      <nav className={`nav ${scrollY > 60 ? 'on' : ''}`}>
        <div className="nav-logo syne">Post<span className="gt-dark">Wiz</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <a href="#platforms" className="nav-link">Platforms</a>
          <a href="#how" className="nav-link">How it works</a>
          <a href="/studio" className="nav-link" style={{ color: '#8b5cf6', fontWeight: 600 }}>🎨 Studio</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <button onClick={handleSubscribe} className="btn btn-primary" style={{ padding: '11px 28px', fontSize: '14px' }}>Start Free →</button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* ════════════════════════════════════
            HERO — scroll-pinned, elements exit as you scroll
        ════════════════════════════════════ */}
        <section style={{ height: '180vh', position: 'relative' }}>
          <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: 'linear-gradient(160deg, #f0eeff 0%, #fdf4ff 40%, #fff5f8 100%)' }}>

            {/* BG orbs */}
            <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.14) 0%,transparent 65%)', top: '-20%', left: '-15%', animation: 'orb1 18s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.1) 0%,transparent 65%)', top: '10%', right: '-12%', animation: 'orb2 22s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(249,115,22,.08) 0%,transparent 65%)', bottom: '-10%', left: '35%', animation: 'orb1 14s ease-in-out infinite 3s', pointerEvents: 'none' }} />

            {/* Floating notification cards — move up as you scroll */}
            <div className="notif float-a" style={{ position: 'absolute', left: '4%', top: `calc(32% - ${scrollY * 0.15}px)`, width: 210, opacity: Math.max(0, 1 - heroProgress * 2), transition: 'opacity .1s' }}>
              <div style={{ fontSize: 11, color: 'rgba(26,16,53,.4)', marginBottom: 6 }}>📸 Posted to Instagram</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1035', marginBottom: 8 }}>Your daily special is live! ✨</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ height: 4, flex: 1, borderRadius: 2, background: 'rgba(139,92,246,.1)', overflow: 'hidden' }}><div style={{ height: '100%', width: '73%', background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', borderRadius: 2 }} /></div>
                <span style={{ fontSize: 11, color: '#8b5cf6' }}>↑ 247 likes</span>
              </div>
            </div>

            <div className="notif float-b" style={{ position: 'absolute', right: '4%', top: `calc(28% - ${scrollY * 0.12}px)`, width: 210, opacity: Math.max(0, 1 - heroProgress * 2), transition: 'opacity .1s' }}>
              <div style={{ fontSize: 11, color: 'rgba(26,16,53,.4)', marginBottom: 6 }}>⭐ Yelp Review Replied</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1035', lineHeight: 1.5 }}>AI responded in 28 seconds</div>
              <div style={{ fontSize: 11, color: '#10b981', marginTop: 6 }}>✓ Review management active</div>
            </div>

            <div className="notif float-a" style={{ position: 'absolute', left: '6%', bottom: `calc(24% + ${scrollY * 0.1}px)`, width: 190, opacity: Math.max(0, 1 - heroProgress * 2), animationDelay: '2s', transition: 'opacity .1s' }}>
              <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />New customer</div>
              <div style={{ fontSize: 13, color: '#1a1035' }}>Found you via Google Review</div>
            </div>

            <div className="notif float-b" style={{ position: 'absolute', right: '5%', bottom: `calc(26% + ${scrollY * 0.08}px)`, width: 205, opacity: Math.max(0, 1 - heroProgress * 2), transition: 'opacity .1s' }}>
              <div style={{ fontSize: 11, color: 'rgba(26,16,53,.4)', marginBottom: 8 }}>📊 This week — all platforms</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[{ v: '21', l: 'posts', c: '#ec4899' }, { v: '4.8k', l: 'reach', c: '#8b5cf6' }, { v: '+12', l: 'reviews', c: '#10b981' }].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.c, fontFamily: 'Syne,sans-serif' }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(26,16,53,.35)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* HERO TEXT — scales down and fades as you scroll */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px',
              opacity: Math.max(0, 1 - heroProgress * 1.4),
              transform: `scale(${lerp(1, 0.88, heroProgress)}) translateY(${-heroProgress * 60}px)`,
              transition: 'none'
            }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)', borderRadius: 50, padding: '9px 22px', marginBottom: 32 }}>
                <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#7c3aed' }}>8 platforms · Social + Reviews · AI-powered</span>
              </div>

              <h1 className="syne" style={{ fontSize: 'clamp(52px,8vw,102px)', fontWeight: 800, lineHeight: .98, letterSpacing: '-4px', color: '#1a1035', marginBottom: 24 }}>
                AI manages<br />your <span className="gt">{typedText}<span className="cursor-blink" /></span>
              </h1>

              <p style={{ fontSize: 20, color: 'rgba(26,16,53,.45)', maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.8, fontWeight: 300 }}>
                PostWiz handles Instagram, TikTok, Facebook, X, LinkedIn, Pinterest, Yelp and Google Reviews — all on autopilot.
              </p>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary btn-lg">{loading ? 'Loading...' : 'Start 7-Day Free Trial →'}</button>
                <button className="btn btn-white" onClick={() => window.scrollTo({ top: winH * 1.8, behavior: 'smooth' })}>Watch it work</button>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(26,16,53,.25)' }}>No credit card · 2 min setup · Cancel anytime</p>

              {/* Scroll cue */}
              <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: Math.max(0, 1 - heroProgress * 4) }}>
                <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,53,.3)' }}>Scroll to explore</span>
                <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(139,92,246,.4), transparent)' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            MARQUEE
        ════════════════════════════════════ */}
        <div style={{ background: '#fff', borderTop: '1px solid rgba(139,92,246,.08)', borderBottom: '1px solid rgba(139,92,246,.08)', padding: '16px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', animation: 'marquee 18s linear infinite', whiteSpace: 'nowrap' }}>
            {['Instagram', 'TikTok', 'Facebook', 'X Twitter', 'Yelp Reviews', 'Google Reviews', 'LinkedIn', 'Pinterest', 'AI Writing', 'Auto-Schedule', 'Brand Voice', 'Analytics', 'Instagram', 'TikTok', 'Facebook', 'X Twitter', 'Yelp Reviews', 'Google Reviews', 'LinkedIn', 'Pinterest', 'AI Writing', 'Auto-Schedule', 'Brand Voice', 'Analytics'].map((t, i) => (
              <span key={i} style={{ padding: '0 28px', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: i % 5 === 0 ? '#8b5cf6' : i % 5 === 1 ? '#ec4899' : i % 5 === 2 ? '#f97316' : i % 5 === 3 ? '#10b981' : 'rgba(26,16,53,.18)' }}>✦ {t}</span>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════
            HOW IT WORKS — scroll-pinned storytelling
            Each step spins/slides in as you scroll
        ════════════════════════════════════ */}
        <section id="how" style={{ height: '320vh', position: 'relative' }}>
          <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: 'linear-gradient(160deg,#faf9ff,#f5f3ff,#fff5fb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Section label */}
            <div style={{ position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <span className="section-label">How it works</span>
            </div>

            {/* STEP 1 — enters spinning from right */}
            <div style={{
              position: 'absolute', maxWidth: 560, width: '90%', textAlign: 'center',
              opacity: step1Progress < .1 ? step1Progress * 10 : step1Progress > .85 ? Math.max(0, 1 - (step1Progress - .85) * 7) : 1,
              transform: `
                translateY(${step1Progress < .5 ? lerp(60, 0, step1Progress * 2) : lerp(0, -80, (step1Progress - .5) * 2)}px)
                rotate(${step1Progress < .5 ? lerp(8, 0, step1Progress * 2) : 0}deg)
                scale(${step1Progress < .1 ? lerp(0.85, 1, step1Progress * 10) : 1})
              `,
              transition: 'none',
              display: step1Progress <= 0 || step1Progress >= 1 ? 'none' : 'block'
            }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(139,92,246,.12),rgba(139,92,246,.06))', border: '2px solid rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>✏️</div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#8b5cf6', marginBottom: 12 }}>Step 01</div>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 16 }}>Tell us about<br />your business</h2>
              <p style={{ fontSize: 17, color: 'rgba(26,16,53,.45)', lineHeight: 1.8 }}>Name, industry, brand tone, which platforms. Takes 2 minutes. You only ever do this once.</p>
            </div>

            {/* STEP 2 — enters spinning from left */}
            <div style={{
              position: 'absolute', maxWidth: 560, width: '90%', textAlign: 'center',
              opacity: step2Progress < .1 ? step2Progress * 10 : step2Progress > .85 ? Math.max(0, 1 - (step2Progress - .85) * 7) : 1,
              transform: `
                translateY(${step2Progress < .5 ? lerp(60, 0, step2Progress * 2) : lerp(0, -80, (step2Progress - .5) * 2)}px)
                rotate(${step2Progress < .5 ? lerp(-8, 0, step2Progress * 2) : 0}deg)
                scale(${step2Progress < .1 ? lerp(0.85, 1, step2Progress * 10) : 1})
              `,
              transition: 'none',
              display: step2Progress <= 0 || step2Progress >= 1 ? 'none' : 'block'
            }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(236,72,153,.12),rgba(236,72,153,.06))', border: '2px solid rgba(236,72,153,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>🤖</div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#ec4899', marginBottom: 12 }}>Step 02</div>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 16 }}>AI generates all<br />your content</h2>
              <p style={{ fontSize: 17, color: 'rgba(26,16,53,.45)', lineHeight: 1.8 }}>A full week of posts for every platform, captions for your photos, and responses to every review — written in your brand voice.</p>
            </div>

            {/* STEP 3 — enters scaling up */}
            <div style={{
              position: 'absolute', maxWidth: 560, width: '90%', textAlign: 'center',
              opacity: step3Progress < .1 ? step3Progress * 10 : Math.min(1, step3Progress),
              transform: `
                translateY(${step3Progress < .5 ? lerp(60, 0, step3Progress * 2) : 0}px)
                scale(${step3Progress < .1 ? lerp(0.8, 1, step3Progress * 10) : 1})
              `,
              transition: 'none',
              display: step3Progress <= 0 ? 'none' : 'block'
            }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(16,185,129,.12),rgba(16,185,129,.06))', border: '2px solid rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>🚀</div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#10b981', marginBottom: 12 }}>Step 03</div>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 16 }}>Everything goes live<br />automatically</h2>
              <p style={{ fontSize: 17, color: 'rgba(26,16,53,.45)', lineHeight: 1.8 }}>Posts publish at peak times. Reviews get replies instantly. Your entire online presence runs itself — every single day.</p>
              <button onClick={handleSubscribe} className="btn btn-primary" style={{ marginTop: 32 }}>Get Started Free →</button>
            </div>

            {/* Step progress dots */}
            <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
              {[step1Progress, step2Progress, step3Progress].map((p, i) => (
                <div key={i} style={{ width: p > 0.05 && p < 0.95 ? 24 : 8, height: 8, borderRadius: 4, background: p > 0.05 && p < 0.95 ? 'linear-gradient(90deg,#8b5cf6,#ec4899)' : 'rgba(139,92,246,.2)', transition: 'all .4s' }} />
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            STATS — light section
        ════════════════════════════════════ */}
        <section id="stats-trigger" style={{ background: '#fff', padding: '100px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="section-label">Results</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                PostWiz works while<br /><span className="gt-dark">you run your business.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { num: counters.posts.toLocaleString() + '+', label: 'Posts Generated', sub: 'Across all platforms', color: '#8b5cf6', icon: '✍️' },
                { num: counters.businesses.toLocaleString() + '+', label: 'Active Businesses', sub: 'Every industry', color: '#ec4899', icon: '🏢' },
                { num: counters.hours.toLocaleString() + 'h', label: 'Hours Saved', sub: 'Time back to owners', color: '#f97316', icon: '⚡' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '40px 36px', textAlign: 'center', transition: 'all .3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = `0 20px 60px rgba(0,0,0,.08),0 0 0 2px ${s.color}18` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{s.icon}</div>
                  <div className="syne" style={{ fontSize: 52, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1035', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(26,16,53,.4)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            PLATFORMS — scroll-driven reveal
        ════════════════════════════════════ */}
        <section id="platforms" style={{ background: 'linear-gradient(160deg,#faf9ff,#f5f3ff)', padding: '120px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="section-label">All Platforms</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4.5vw,58px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 16 }}>
                One tool. <span className="gt">Every platform.</span>
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(26,16,53,.45)', maxWidth: 480, margin: '0 auto' }}>Social media + review management — everything your online presence needs.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
              {platforms.map((p, i) => (
                <div key={p.name} className="card" style={{ padding: '28px 20px', textAlign: 'center', transition: 'all .3s', cursor: 'default' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-6px)'; el.style.borderColor = p.color + '40'; el.style.boxShadow = `0 16px 48px ${p.color}14` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.borderColor = 'rgba(139,92,246,.08)'; el.style.boxShadow = '' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{p.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1035', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ width: 24, height: 3, borderRadius: 2, background: p.color, margin: '8px auto 0', opacity: .6 }} />
                </div>
              ))}
            </div>

            {/* Review response demo */}
            <div className="card" style={{ padding: '32px', maxWidth: 700, margin: '0 auto' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8b5cf6', marginBottom: 16 }}>⭐ Example: Yelp Review Response (AI-generated)</div>
              <div style={{ background: 'rgba(139,92,246,.04)', border: '1px solid rgba(139,92,246,.1)', borderRadius: 12, padding: '14px 18px', marginBottom: 14, fontSize: 14, color: 'rgba(26,16,53,.55)', fontStyle: 'italic' }}>
                &ldquo;Amazing food as always! The garlic knots were incredible. Will definitely be back!&rdquo; — Sarah K. ★★★★★
              </div>
              <p style={{ fontSize: 15, color: 'rgba(26,16,53,.7)', lineHeight: 1.75 }}>
                Thank you so much, Sarah! 🙏 Our garlic knots are definitely a fan favorite — glad they lived up to the hype! We can&apos;t wait to welcome you back. Next time, make sure to try our new seasonal special!
              </p>
              <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', color: '#10b981', padding: '4px 12px', borderRadius: 50, fontWeight: 600 }}>✓ Posted to Yelp</span>
                <span style={{ fontSize: 12, color: 'rgba(26,16,53,.3)' }}>AI responded in 28 seconds</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            FEATURES — scroll-driven cards fly in
        ════════════════════════════════════ */}
        <section style={{ background: '#fff', padding: '120px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <span className="section-label">Features</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                Everything included.<br /><span className="gt-dark">Zero extra fees.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                { icon: '🤖', title: 'AI Post Writing', desc: 'Claude AI writes platform-perfect posts in your brand voice for all 8 platforms simultaneously.', color: '#8b5cf6' },
                { icon: '📸', title: 'Photo Caption AI', desc: 'Upload a photo and AI analyzes it, then writes tailored captions for every platform automatically.', color: '#ec4899' },
                { icon: '📅', title: 'Smart Scheduling', desc: 'Posts go live at peak engagement times for your specific audience. Zero manual scheduling.', color: '#f97316' },
                { icon: '⭐', title: 'Review Management', desc: 'AI responds to Yelp and Google reviews professionally within seconds. Never miss one again.', color: '#10b981' },
                { icon: '📊', title: 'Analytics', desc: 'Clear data on what posts are working. Understand your audience without being a data scientist.', color: '#0891b2' },
                { icon: '🎨', title: 'Content Studio', desc: 'Upload photos in bulk, AI generates captions for all platforms and queues everything up.', color: '#7c3aed' },
              ].map((f, i) => (
                <div key={f.title} className="card" style={{ padding: '32px 28px', transition: 'all .3s', cursor: 'default' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-6px)'; el.style.borderColor = f.color + '30'; el.style.boxShadow = `0 20px 60px ${f.color}10` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.borderColor = 'rgba(139,92,246,.08)'; el.style.boxShadow = '' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: f.color + '12', border: `1px solid ${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
                  <h3 className="syne" style={{ fontSize: 18, fontWeight: 700, color: '#1a1035', marginBottom: 10, letterSpacing: '-.3px' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(26,16,53,.5)', lineHeight: 1.8 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            LIVE DEMO
        ════════════════════════════════════ */}
        <section id="demo" style={{ background: 'linear-gradient(160deg,#faf9ff,#f5f3ff)', padding: '120px 40px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="section-label">Live Demo</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-1.5px', marginBottom: 14 }}>
                See what AI writes <span className="gt">for your business.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(26,16,53,.45)', maxWidth: 420, margin: '0 auto' }}>Click your industry. Watch AI generate a real post instantly.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
              {tabs.map((t, i) => <button key={i} onClick={() => setActiveTab(i)} className={`tab-btn ${activeTab === i ? 'active' : ''}`}>{t.label}</button>)}
            </div>

            <div className="card" style={{ padding: '36px', maxWidth: 680, margin: '0 auto' }} key={activeTab}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid rgba(139,92,246,.07)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1035' }}>PostWiz AI</div>
                  <div style={{ fontSize: 12, color: 'rgba(26,16,53,.35)' }}>Generated just now · Instagram</div>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.15)', color: '#8b5cf6', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 50 }}>📸 Ready to post</div>
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(26,16,53,.7)', marginBottom: 24, animation: 'slideIn .3s ease' }}>{tabs[activeTab].post}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', padding: '11px 22px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(139,92,246,.25)' }}>✓ Approve & Schedule</button>
                <button style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.15)', color: '#8b5cf6', padding: '11px 18px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, cursor: 'pointer' }}>✏️ Edit</button>
                <button style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.15)', color: '#8b5cf6', padding: '11px 18px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, cursor: 'pointer' }}>↻ Regenerate</button>
              </div>
            </div>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(26,16,53,.3)' }}>This is exactly what PostWiz writes for you, every single day — for free during your trial.</p>
          </div>
        </section>

        {/* ════════════════════════════════════
            TESTIMONIALS
        ════════════════════════════════════ */}
        <section style={{ background: '#fff', padding: '120px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="section-label">Testimonials</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-1.5px' }}>
                Real businesses.<br /><span className="gt-dark">Real results.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { n: 'Maria G.', b: 'Pizzeria · Long Island', q: 'PostWiz posts every day and responds to my Yelp reviews automatically. I get 3x more customers finding me online. It literally pays for itself with one new customer.', stars: 5, color: '#E1306C' },
                { n: 'Jason T.', b: 'Barbershop · Queens', q: 'Set it up in 5 minutes. It posts to Instagram and TikTok daily, responds to Google reviews, and I\'ve got 6 new clients this month just from online. Best thing ever.', stars: 5, color: '#8b5cf6' },
                { n: 'Sandra K.', b: 'Boutique · Brooklyn', q: 'Zero time on social media or reviews. PostWiz handles everything. My engagement is up 200% and my Google rating went from 4.1 to 4.8 stars. Insane.', stars: 5, color: '#f97316' },
              ].map(t => (
                <div key={t.n} className="card" style={{ padding: '32px', transition: 'all .3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 20px 60px rgba(0,0,0,.08)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>{Array(t.stars).fill(0).map((_, i) => <span key={i} style={{ color: t.color, fontSize: 16 }}>★</span>)}</div>
                  <p style={{ fontSize: 15, color: 'rgba(26,16,53,.62)', lineHeight: 1.9, marginBottom: 24, fontStyle: 'italic' }}>&ldquo;{t.q}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${t.color}18,${t.color}08)`, border: `1.5px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: t.color, fontFamily: 'Syne,sans-serif' }}>{t.n[0]}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: '#1a1035' }}>{t.n}</div><div style={{ fontSize: 12, color: 'rgba(26,16,53,.4)', marginTop: 2 }}>{t.b}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            PRICING
        ════════════════════════════════════ */}
        <section id="pricing" style={{ background: 'linear-gradient(160deg,#faf9ff,#f0eeff)', padding: '120px 40px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="section-label">Pricing</span>
              <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#1a1035', letterSpacing: '-1.5px', marginBottom: 12 }}>
                One price. <span className="gt">Everything included.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(26,16,53,.45)' }}>All 8 platforms. Social + Reviews. Cancel anytime.</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 28, padding: '48px 44px', boxShadow: '0 20px 80px rgba(139,92,246,.12)', border: '1.5px solid rgba(139,92,246,.12)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#8b5cf6,#ec4899,#f97316)' }} />
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ display: 'inline-block', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)', color: '#7c3aed', padding: '6px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>All 8 Platforms Included</div>
                <div className="syne" style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, color: '#1a1035' }}>
                  <span className="gt">$29</span>
                </div>
                <div style={{ color: 'rgba(26,16,53,.35)', marginTop: 8, fontSize: 15 }}>per month · billed monthly</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {['Instagram, TikTok, Facebook & X', 'LinkedIn & Pinterest posting', 'Yelp review auto-responses', 'Google Review management', 'Unlimited AI-written content', 'Photo caption AI (Content Studio)', 'Smart scheduling & analytics', 'Cancel anytime, no contracts'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ color: 'rgba(26,16,53,.7)' }}>{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '19px', fontSize: '17px', borderRadius: 16 }}>
                {loading ? 'Loading...' : 'Start 7-Day Free Trial →'}
              </button>
              <p style={{ textAlign: 'center', color: 'rgba(26,16,53,.25)', fontSize: 12, marginTop: 14 }}>7 days free · then $29/month · no contracts</p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════ */}
        <section style={{ background: 'linear-gradient(135deg,#8b5cf6 0%,#ec4899 50%,#f97316 100%)', padding: '120px 40px', textAlign: 'center' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 className="syne" style={{ fontSize: 'clamp(40px,6vw,80px)', fontWeight: 800, color: '#fff', letterSpacing: '-3px', lineHeight: 1.0, marginBottom: 20 }}>
              Your entire online presence,<br />on autopilot.
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.65)', marginBottom: 48, fontWeight: 300 }}>Instagram · TikTok · Facebook · X · LinkedIn · Pinterest · Yelp · Google Reviews</p>
            <button onClick={handleSubscribe} disabled={loading} className="btn" style={{ background: '#fff', color: '#7c3aed', padding: '20px 56px', borderRadius: 50, fontSize: 18, fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 40px rgba(0,0,0,.2)' }}>
              {loading ? 'Loading...' : 'Get Started Free — No Card Needed'}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: '#1a1035', padding: '32px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="syne" style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Post<span className="gt-dark">Wiz</span></div>
          <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13 }}>© 2026 PostWiz. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>{['Privacy', 'Terms'].map(l => <a key={l} href={`/${l.toLowerCase()}`} style={{ color: 'rgba(255,255,255,.25)', textDecoration: 'none', fontSize: 13 }}>{l}</a>)}</div>
        </footer>
      </main>
    </>
  )
}
