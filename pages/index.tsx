import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const phraseRef = useRef(0)
  const charRef = useRef(0)
  const deletingRef = useRef(false)
  const animFrameRef = useRef(0)

  const phrases = ['Instagram posts.', 'Facebook updates.', 'TikTok captions.', 'your social media.']

  // Scroll tracking
  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY)
      setNavScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mouse tracking
  useEffect(() => {
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMouse)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  // Intersection observer for scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set([...prev, entry.target.id]))
          if (entry.target.id === 'stats-section' && !countersStarted) {
            setCountersStarted(true)
          }
        }
      })
    }, { threshold: 0.2 })
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [countersStarted])

  // Counter animation
  useEffect(() => {
    if (!countersStarted) return
    const targets = { posts: 12847, businesses: 847, hours: 4230 }
    const duration = 2000
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCounters({
        posts: Math.floor(ease * targets.posts),
        businesses: Math.floor(ease * targets.businesses),
        hours: Math.floor(ease * targets.hours),
      })
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [countersStarted])

  // Typing effect
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const type = () => {
      const phrase = phrases[phraseRef.current]
      if (!deletingRef.current) {
        if (charRef.current < phrase.length) {
          setTypedText(phrase.substring(0, charRef.current + 1))
          charRef.current++
          timeout = setTimeout(type, 65)
        } else {
          timeout = setTimeout(() => { deletingRef.current = true; type() }, 2200)
        }
      } else {
        if (charRef.current > 0) {
          setTypedText(phrase.substring(0, charRef.current - 1))
          charRef.current--
          timeout = setTimeout(type, 28)
        } else {
          deletingRef.current = false
          phraseRef.current = (phraseRef.current + 1) % phrases.length
          timeout = setTimeout(type, 400)
        }
      }
    }
    timeout = setTimeout(type, 600)
    return () => clearTimeout(timeout)
  }, [])

  // Canvas particle field
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const pts: { x: number; y: number; vx: number; vy: number; size: number; hue: number }[] = []
    for (let i = 0; i < 60; i++) {
      pts.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 1.5 + 0.5, hue: Math.random() * 60 + 250 })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},70%,65%,0.4)`
        ctx.fill()
      })
      pts.forEach((p, i) => pts.slice(i + 1).forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y)
        if (d < 100) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
          ctx.strokeStyle = `hsla(270,60%,65%,${0.06 * (1 - d / 100)})`
          ctx.lineWidth = 0.5; ctx.stroke()
        }
      }))
      animFrameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animFrameRef.current); window.removeEventListener('resize', resize) }
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
    } catch { alert('Something went wrong.'); setLoading(false) }
  }

  const isVisible = (id: string) => visibleSections.has(id)

  const tabs = [
    { label: '🍕 Restaurant', post: `Fresh from our kitchen to your table tonight 🍕 Our chef just dropped something incredible — come taste why we've been Long Island's favorite for 12 years. Limited tables available! Book now or order online. #longislandeats #italianfood #freshdaily #foodie #localeats` },
    { label: '✂️ Barbershop', post: `New week. Fresh cut. 💈 Our chairs are open and ready for you. Walk-ins welcome all day — no appointment needed. Come look sharp, feel sharp. ✂️ #barbershop #freshcut #barberlife #mensgrooming #lookgood #brooklyn` },
    { label: '👗 Boutique', post: `New arrivals just landed and they are EVERYTHING 🛍️ Spring 2026 collection is in — pieces going fast. Come see us in store or DM to reserve your size before it's gone! 💫 #boutique #newcollection #shoplocal #fashion #springvibes` },
    { label: '💪 Gym', post: `Your best workout is waiting for you 💪 Free drop-in class today at 6PM — no experience needed, just show up ready. 🔥 Tag someone who needs to move their body today. #fitness #gym #workout #getfit #healthylifestyle #motivation` },
  ]

  const parallaxY = (speed: number) => scrollY * speed

  return (
    <>
      <Head>
        <title>PostWiz – AI Social Media Manager</title>
        <meta name="description" content="PostWiz writes and posts your social media automatically. Set it up once, then forget it." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #06060f; color: #fff; font-family: 'Inter', sans-serif; overflow-x: hidden; cursor: none; }
        .syne { font-family: 'Syne', sans-serif; }

        /* Custom cursor */
        #cursor-dot { position: fixed; width: 8px; height: 8px; background: #a78bfa; border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%, -50%); transition: transform 0.1s; mix-blend-mode: difference; }
        #cursor-ring { position: fixed; width: 40px; height: 40px; border: 1px solid rgba(167,139,250,0.4); border-radius: 50%; pointer-events: none; z-index: 9998; transform: translate(-50%, -50%); transition: left 0.12s ease, top 0.12s ease, width 0.2s, height 0.2s; }
        body:has(button:hover) #cursor-ring, body:has(a:hover) #cursor-ring { width: 56px; height: 56px; border-color: rgba(219,39,119,0.6); background: rgba(219,39,119,0.05); }

        /* Gradient text */
        .gt { background: linear-gradient(135deg, #a78bfa, #f472b6, #fb923c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .gt2 { background: linear-gradient(90deg, #7C3AED, #DB2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .gt3 { background: linear-gradient(135deg, #06060f, #1a1a3e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* Nav */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 24px 60px; display: flex; align-items: center; justify-content: space-between; transition: all 0.4s; }
        .nav.scrolled { background: rgba(6,6,15,0.85); backdrop-filter: blur(24px); padding: 16px 60px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .nav-logo { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
        .nav-links { display: flex; align-items: center; gap: 40px; }
        .nav-link { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.3px; transition: color 0.2s; position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px; background: linear-gradient(90deg, #7C3AED, #DB2777); transition: width 0.3s; }
        .nav-link:hover { color: #fff; }
        .nav-link:hover::after { width: 100%; }

        /* Buttons */
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Inter', sans-serif; font-weight: 600; cursor: none; border: none; transition: all 0.3s; }
        .btn-primary { background: linear-gradient(135deg, #7C3AED, #DB2777); color: white; padding: 15px 36px; border-radius: 50px; font-size: 16px; position: relative; overflow: hidden; }
        .btn-primary::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #9333ea, #ec4899); opacity: 0; transition: opacity 0.3s; }
        .btn-primary:hover::before { opacity: 1; }
        .btn-primary span { position: relative; z-index: 1; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-lg { padding: 20px 52px; font-size: 18px; }
        .btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); padding: 14px 32px; border-radius: 50px; font-size: 15px; backdrop-filter: blur(10px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #fff; }
        .btn-dark { background: #06060f; color: #fff; border: 1.5px solid rgba(255,255,255,0.15); padding: 15px 36px; border-radius: 50px; font-size: 15px; }
        .btn-dark:hover { border-color: #7C3AED; box-shadow: 0 0 30px rgba(124,58,237,0.2); }

        /* Scroll reveal */
        .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
        .reveal.from-left { transform: translateX(-60px); }
        .reveal.from-right { transform: translateX(60px); }
        .reveal.scale-in { transform: scale(0.92); }
        .reveal.visible { opacity: 1; transform: none; }
        .reveal.d1 { transition-delay: 0.1s; }
        .reveal.d2 { transition-delay: 0.2s; }
        .reveal.d3 { transition-delay: 0.3s; }
        .reveal.d4 { transition-delay: 0.4s; }
        .reveal.d5 { transition-delay: 0.5s; }

        /* Animations */
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes floatB { 0%,100%{transform:translateY(-7px)} 50%{transform:translateY(7px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.05)} 66%{transform:translate(-20px,20px) scale(0.97)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,20px) scale(1.03)} 66%{transform:translate(30px,-40px) scale(0.98)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.9)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-floatB { animation: floatB 4s ease-in-out infinite 1s; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .shimmer-text { background: linear-gradient(90deg, #a78bfa, #f472b6, #fb923c, #a78bfa); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }

        /* Sections */
        .section { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
        .section-label { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #a78bfa; margin-bottom: 16px; }

        /* Cards */
        .glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; backdrop-filter: blur(12px); transition: all 0.4s; }
        .glass:hover { background: rgba(255,255,255,0.07); border-color: rgba(124,58,237,0.25); transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.1); }

        /* Light section */
        .light-section { background: #f8f7ff; color: #06060f; }

        /* Cursor typing */
        .cursor { display: inline-block; width: 3px; height: 0.85em; background: #f472b6; margin-left: 3px; border-radius: 2px; animation: blink 1s step-end infinite; vertical-align: text-bottom; }

        /* Feature pill */
        .pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 500; }

        /* Notification cards */
        .notif { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px 18px; backdrop-filter: blur(20px); }

        /* Marquee */
        .marquee-wrap { overflow: hidden; }
        .marquee-track { display: flex; animation: marquee 18s linear infinite; white-space: nowrap; }
        .marquee-item { padding: 0 28px; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }

        /* Tab */
        .tab-btn { padding: 10px 22px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.45); font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: none; transition: all 0.25s; }
        .tab-btn.active { background: linear-gradient(135deg, #7C3AED, #DB2777); border-color: transparent; color: white; box-shadow: 0 0 24px rgba(124,58,237,0.35); }
        .tab-btn:hover:not(.active) { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }

        /* Post card */
        .post-card { background: #fff; border-radius: 20px; padding: 24px; color: #111; transition: all 0.3s; }
        .post-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.15); }

        @media (max-width: 900px) {
          .nav { padding: 16px 24px; }
          .nav.scrolled { padding: 12px 24px; }
          .nav-links { gap: 20px; }
          .section { padding: 0 20px; }
          body { cursor: auto; }
          #cursor-dot, #cursor-ring { display: none; }
        }
      `}</style>

      {/* Custom cursor */}
      <div id="cursor-dot" style={{ left: mousePos.x, top: mousePos.y }} />
      <div id="cursor-ring" style={{ left: mousePos.x, top: mousePos.y }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }} />

      {/* Nav */}
      <nav className={`nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo syne">Post<span className="gt2">Wiz</span></div>
        <div className="nav-links">
          <a href="#how" className="nav-link">How it works</a>
          <a href="#demo" className="nav-link">See it live</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <button onClick={handleSubscribe} className="btn btn-primary" style={{ padding: '11px 28px', fontSize: '14px' }}>
            <span>Start Free Trial</span>
          </button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══ HERO ═══ */}
        <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 60px', position: 'relative', overflow: 'hidden' }}>
          {/* Animated orbs */}
          <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', top: '-20%', left: '-20%', animation: 'orb1 15s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(219,39,119,0.14) 0%, transparent 70%)', top: '10%', right: '-15%', animation: 'orb2 18s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.1) 0%, transparent 70%)', bottom: '-10%', left: '35%', animation: 'orb1 12s ease-in-out infinite 3s', pointerEvents: 'none' }} />

          {/* Floating notification cards */}
          <div className="notif animate-float" style={{ position: 'absolute', left: '5%', top: '32%', width: 210, textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>📸 Posted to Instagram</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Your daily special is live! ✨</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ height: 4, flex: 1, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}><div style={{ height: '100%', width: '73%', background: 'linear-gradient(90deg, #7C3AED, #DB2777)', borderRadius: 2 }} /></div>
              <span style={{ fontSize: 11, color: '#a78bfa' }}>↑ 247 likes</span>
            </div>
          </div>

          <div className="notif animate-floatB" style={{ position: 'absolute', right: '5%', top: '28%', width: 200, textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>⚡ AI Generated</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>7 posts scheduled</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Next: Tomorrow 9:00 AM</div>
          </div>

          <div className="notif animate-float" style={{ position: 'absolute', left: '7%', bottom: '25%', width: 185, textAlign: 'left', animationDelay: '2s' }}>
            <div style={{ fontSize: 11, color: '#34d399', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />New customer</div>
            <div style={{ fontSize: 13 }}>Found you via Instagram</div>
          </div>

          <div className="notif animate-floatB" style={{ position: 'absolute', right: '6%', bottom: '28%', width: 195, textAlign: 'left', animationDelay: '1s' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>📊 This week</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: '#f472b6' }}>14</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>posts</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>3.2k</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>reach</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>+8</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>customers</div></div>
            </div>
          </div>

          {/* Hero content */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 820 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 50, padding: '9px 20px', marginBottom: 36 }}>
              <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#c4b5fd' }}>Trusted by 847+ small businesses</span>
            </div>

            <h1 className="syne" style={{ fontSize: 'clamp(50px, 7.5vw, 96px)', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-3px', marginBottom: 28 }}>
              AI writes your<br />
              <span className="gt">{typedText}<span className="cursor" /></span>
            </h1>

            <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.45)', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.85, fontWeight: 300 }}>
              PostWiz generates and posts to Instagram, Facebook, and TikTok automatically. Tell us about your business once — we handle everything else, every day.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary btn-lg">
                  <span>{loading ? 'Loading...' : 'Start 7-Day Free Trial →'}</span>
                </button>
                <button className="btn btn-ghost" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                  Watch it work
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)' }}>No credit card · 2 minute setup · Cancel anytime</p>
            </div>

            {/* Scroll indicator */}
            <div style={{ marginTop: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.35 }}>
              <span style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Scroll</span>
              <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }} />
            </div>
          </div>
        </section>

        {/* ═══ MARQUEE ═══ */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '18px 0', overflow: 'hidden' }}>
          <div className="marquee-track">
            {['Instagram Automation', 'AI Post Writing', 'Facebook Scheduling', 'TikTok Captions', 'Smart Hashtags', 'Auto-Posting', 'Brand Voice AI', 'Analytics Dashboard', 'Instagram Automation', 'AI Post Writing', 'Facebook Scheduling', 'TikTok Captions', 'Smart Hashtags', 'Auto-Posting', 'Brand Voice AI', 'Analytics Dashboard'].map((t, i) => (
              <span key={i} className="marquee-item" style={{ color: i % 4 === 0 ? '#a78bfa' : i % 4 === 1 ? '#f472b6' : i % 4 === 2 ? 'rgba(255,255,255,0.25)' : '#fb923c' }}>✦ {t}</span>
            ))}
          </div>
        </div>

        {/* ═══ STATS — light section ═══ */}
        <section id="stats-section" data-reveal className="light-section" style={{ padding: '100px 40px' }}>
          <div ref={statsRef} style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div className="section-label" style={{ color: '#7C3AED' }}>By the numbers</div>
              <h2 className="syne" style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#06060f', letterSpacing: '-1.5px' }}>
                PostWiz works while<br /><span style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>you run your business.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { num: counters.posts.toLocaleString(), label: 'Posts Generated', sub: 'And counting', color: '#7C3AED', icon: '✍️' },
                { num: counters.businesses.toLocaleString(), label: 'Active Businesses', sub: 'Across every industry', color: '#DB2777', icon: '🏢' },
                { num: counters.hours.toLocaleString() + 'h', label: 'Hours Saved', sub: 'Time back to owners', color: '#F59E0B', icon: '⚡' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: `1px solid rgba(0,0,0,0.06)`, borderRadius: 24, padding: '40px 36px', textAlign: 'center', boxShadow: '0 4px 30px rgba(0,0,0,0.05)', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px rgba(0,0,0,0.12)` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 30px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
                  <div className="syne" style={{ fontSize: 52, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#06060f', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how" style={{ padding: '120px 40px', position: 'relative' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <div className="section-label">How it works</div>
              <h2 className="syne" style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05 }}>
                Three steps.<br /><span className="gt">Then autopilot forever.</span>
              </h2>
            </div>

            {/* Steps with connecting line */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '50%', top: 60, bottom: 60, width: 1, background: 'linear-gradient(to bottom, rgba(124,58,237,0.3), rgba(219,39,119,0.3), rgba(251,146,60,0.3))', transform: 'translateX(-50%)', display: 'block' }} />

              {[
                { n: '01', icon: '✏️', title: 'Tell us about your business', desc: 'Business name, industry, brand tone, what makes you special. 2 minutes max. This is the only time you touch it.', color: '#7C3AED', side: 'left' },
                { n: '02', icon: '🤖', title: 'AI generates your content', desc: 'Our AI writes a full week of platform-perfect posts calibrated to your exact brand voice. Instagram, Facebook, TikTok — all handled.', color: '#DB2777', side: 'right' },
                { n: '03', icon: '🚀', title: 'Posts go live automatically', desc: 'One-click approval or fully automatic posting. Your social media is covered every single day without you lifting a finger.', color: '#F59E0B', side: 'left' },
              ].map((s, i) => (
                <div key={s.n} id={`step-${i}`} data-reveal style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 0, marginBottom: 48, alignItems: 'center' }}>
                  {s.side === 'left' ? (
                    <>
                      <div className={`glass reveal ${isVisible(`step-${i}`) ? 'visible' : ''} from-left d${i + 1}`} style={{ padding: '40px 44px', gridColumn: 1 }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>{s.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: s.color, marginBottom: 10 }}>Step {s.n}</div>
                        <h3 className="syne" style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.3px' }}>{s.title}</h3>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{s.desc}</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${s.color}30, ${s.color}10)`, border: `2px solid ${s.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'Syne, sans-serif' }}>{s.n}</div>
                      </div>
                      <div style={{ gridColumn: 3 }} />
                    </>
                  ) : (
                    <>
                      <div style={{ gridColumn: 1 }} />
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${s.color}30, ${s.color}10)`, border: `2px solid ${s.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'Syne, sans-serif' }}>{s.n}</div>
                      </div>
                      <div className={`glass reveal ${isVisible(`step-${i}`) ? 'visible' : ''} from-right d${i + 1}`} style={{ padding: '40px 44px', gridColumn: 3 }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>{s.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: s.color, marginBottom: 10 }}>Step {s.n}</div>
                        <h3 className="syne" style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{s.title}</h3>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{s.desc}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LIVE DEMO ═══ */}
        <section id="demo" className="light-section" style={{ padding: '120px 40px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div className="section-label" style={{ color: '#7C3AED' }}>Live demo</div>
              <h2 className="syne" style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#06060f', letterSpacing: '-1.5px', marginBottom: 16 }}>
                PostWiz writes for <span style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>every business.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(0,0,0,0.45)', maxWidth: 480, margin: '0 auto' }}>Click your industry and see exactly what AI writes for you.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
              {tabs.map((t, i) => (
                <button key={i} onClick={() => setActiveTab(i)} style={{ padding: '10px 22px', borderRadius: 50, border: `1px solid ${activeTab === i ? '#7C3AED' : 'rgba(0,0,0,0.12)'}`, background: activeTab === i ? 'linear-gradient(135deg, #7C3AED, #DB2777)' : '#fff', color: activeTab === i ? '#fff' : 'rgba(0,0,0,0.55)', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.25s', boxShadow: activeTab === i ? '0 6px 24px rgba(124,58,237,0.3)' : 'none' }}>{t.label}</button>
              ))}
            </div>

            {/* Post preview - white card */}
            <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 8px 60px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', maxWidth: 680, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #DB2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#06060f' }}>PostWiz AI</div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>Generated just now</div>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#7C3AED', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 50 }}>📸 Instagram</div>
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: '#333', marginBottom: 20 }}>{tabs[activeTab].post}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', border: 'none', color: '#fff', padding: '10px 22px', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>✓ Approve & Schedule</button>
                <button style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.55)', padding: '10px 18px', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, cursor: 'pointer' }}>✏️ Edit</button>
                <button style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.55)', padding: '10px 18px', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, cursor: 'pointer' }}>↻ Regenerate</button>
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(0,0,0,0.35)' }}>This is a real example of what PostWiz writes for you, every single day.</p>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section style={{ padding: '120px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', marginBottom: 80 }}>
              <div>
                <div className="section-label">Features</div>
                <h2 className="syne" style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20 }}>
                  Everything included.<br /><span className="gt">Zero extra fees.</span>
                </h2>
                <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>One subscription covers everything you need to run a full social media presence — from writing to posting to analytics.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { icon: '🤖', label: 'AI Writing' },
                  { icon: '📅', label: 'Auto-Schedule' },
                  { icon: '📱', label: 'Multi-Platform' },
                  { icon: '#️⃣', label: 'Smart Hashtags' },
                  { icon: '📊', label: 'Analytics' },
                  { icon: '✏️', label: 'Quick Editing' },
                ].map(f => (
                  <div key={f.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.25s', cursor: 'default' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                    <span style={{ fontSize: 22 }}>{f.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS — light section ═══ */}
        <section className="light-section" style={{ padding: '120px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div className="section-label" style={{ color: '#7C3AED' }}>Testimonials</div>
              <h2 className="syne" style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#06060f', letterSpacing: '-1.5px' }}>
                Real businesses.<br /><span style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Real results.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { n: 'Maria G.', b: 'Pizzeria · Long Island', q: 'I was posting once a week at best. PostWiz posts every day and I literally get 3x more customers finding me. It pays for itself in one new customer.', stars: 5, color: '#E1306C' },
                { n: 'Jason T.', b: 'Barbershop · Queens', q: 'I told it my shop name and what I do. Now it just posts for me. Got 4 new clients last week from TikTok alone. Best thing I\'ve ever used.', stars: 5, color: '#7C3AED' },
                { n: 'Sandra K.', b: 'Boutique · Brooklyn', q: 'Zero minutes spent on social media. PostWiz handles everything. My engagement is up 200% and I haven\'t posted manually in 3 months.', stars: 5, color: '#F59E0B' },
              ].map(t => (
                <div key={t.n} style={{ background: '#fff', borderRadius: 24, padding: '32px', boxShadow: '0 4px 30px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.3s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 30px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>{Array(t.stars).fill(0).map((_, i) => <span key={i} style={{ color: t.color, fontSize: 16 }}>★</span>)}</div>
                  <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.65)', lineHeight: 1.9, marginBottom: 24, fontStyle: 'italic' }}>&ldquo;{t.q}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${t.color}20, ${t.color}10)`, border: `1.5px solid ${t.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: t.color, fontFamily: 'Syne, sans-serif' }}>{t.n[0]}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: '#06060f' }}>{t.n}</div><div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 1 }}>{t.b}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" style={{ padding: '120px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div className="section-label">Pricing</div>
              <h2 className="syne" style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12 }}>
                One price. <span className="gt">Everything included.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)' }}>Less than one hour of a social media manager&apos;s time.</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '48px 44px', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 28, padding: 1, background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(219,39,119,0.4), rgba(251,146,60,0.2))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', pointerEvents: 'none' }} />

              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd', padding: '6px 18px', borderRadius: 50, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>All Inclusive</div>
                <div className="syne" style={{ fontSize: 88, fontWeight: 800, lineHeight: 1 }}>
                  <span className="gt">$29</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', marginTop: 8, fontSize: 15 }}>per month, billed monthly</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {['Unlimited AI-written posts', 'Auto-scheduling & publishing', 'Instagram, Facebook & TikTok', 'AI hashtag generation', 'Post performance analytics', 'One-click editing & approval', 'Cancel anytime, no contracts'].map(item => (
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
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 14 }}>7 days free · then $29/month · cancel anytime</p>
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="light-section" style={{ padding: '120px 40px', textAlign: 'center' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 className="syne" style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 800, color: '#06060f', letterSpacing: '-3px', lineHeight: 1.0, marginBottom: 20 }}>
              Ready to put social<br />media on <span style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>autopilot?</span>
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)', marginBottom: 48, fontWeight: 300 }}>Join hundreds of small businesses saving hours every week.</p>
            <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary btn-lg" style={{ fontSize: '18px', padding: '20px 56px' }}>
              <span>{loading ? 'Loading...' : 'Get Started Free — No Card Needed'}</span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: '#06060f', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="syne" style={{ fontSize: 20, fontWeight: 800 }}>Post<span className="gt2">Wiz</span></div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>© 2026 PostWiz. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms'].map(l => <a key={l} href={`/${l.toLowerCase()}`} style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontSize: 13 }}>{l}</a>)}
          </div>
        </footer>
      </main>
    </>
  )
}
