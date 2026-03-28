import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [scroll, setScroll] = useState(0)
  const [wh, setWh] = useState(800)
  const [typed, setTyped] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [ctrs, setCtrs] = useState({ p: 0, b: 0, h: 0 })
  const [ctrsOn, setCtrsOn] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const af = useRef(0)
  const pi = useRef(0), ci = useRef(0), del = useRef(false)
  const phrases = ['Instagram.', 'TikTok.', 'Yelp Reviews.', 'Google.', 'X (Twitter).', 'all of it.']

  useEffect(() => {
    const onS = () => setScroll(window.scrollY)
    const onM = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY })
      setGlowPos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 })
    }
    const onR = () => setWh(window.innerHeight)
    setWh(window.innerHeight)
    window.addEventListener('scroll', onS, { passive: true })
    window.addEventListener('mousemove', onM)
    window.addEventListener('resize', onR)
    return () => { window.removeEventListener('scroll', onS); window.removeEventListener('mousemove', onM); window.removeEventListener('resize', onR) }
  }, [])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const type = () => {
      const ph = phrases[pi.current]
      if (!del.current) {
        if (ci.current < ph.length) { setTyped(ph.slice(0, ci.current + 1)); ci.current++; t = setTimeout(type, 72) }
        else { t = setTimeout(() => { del.current = true; type() }, 2200) }
      } else {
        if (ci.current > 0) { setTyped(ph.slice(0, ci.current - 1)); ci.current--; t = setTimeout(type, 32) }
        else { del.current = false; pi.current = (pi.current + 1) % phrases.length; t = setTimeout(type, 350) }
      }
    }
    t = setTimeout(type, 900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = document.getElementById('ctr-t')
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ctrsOn) {
        setCtrsOn(true)
        const targets = { p: 18400, b: 1240, h: 6200 }
        const t0 = Date.now()
        const tick = () => {
          const p = Math.min((Date.now() - t0) / 2200, 1)
          const e2 = 1 - Math.pow(1 - p, 3)
          setCtrs({ p: Math.floor(e2 * targets.p), b: Math.floor(e2 * targets.b), h: Math.floor(e2 * targets.h) })
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ctrsOn])

  // Animated grid canvas
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    // Grid dots + flowing lines
    const cols = Math.ceil(cv.width / 60) + 1
    const rows = Math.ceil(cv.height / 60) + 1
    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number }[] = []

    const spawnParticle = () => {
      const edge = Math.floor(Math.random() * 4)
      let x = 0, y = 0
      if (edge === 0) { x = Math.random() * cv.width; y = 0 }
      else if (edge === 1) { x = cv.width; y = Math.random() * cv.height }
      else if (edge === 2) { x = Math.random() * cv.width; y = cv.height }
      else { x = 0; y = Math.random() * cv.height }
      const angle = Math.atan2(cv.height / 2 - y, cv.width / 2 - x) + (Math.random() - .5) * 1.2
      const speed = .4 + Math.random() * .6
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, maxLife: 120 + Math.random() * 80, hue: 260 + Math.random() * 80 })
    }

    let frame = 0
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)

      // Grid dots
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * 60, y = r * 60
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(139,92,246,0.18)'
          ctx.fill()
        }
      }

      // Spawn particles
      if (frame % 8 === 0 && particles.length < 25) spawnParticle()
      frame++

      // Draw particles as flowing lines
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy; p.life++
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.55
        if (alpha <= 0 || p.life >= p.maxLife) { particles.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},80%,70%,${alpha})`
        ctx.fill()
        // Trail
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 20, p.y - p.vy * 20)
        ctx.strokeStyle = `hsla(${p.hue},80%,70%,${alpha * 0.3})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      af.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(af.current); window.removeEventListener('resize', resize) }
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try { const r = await fetch('/api/checkout', { method: 'POST' }); const { url } = await r.json(); window.location.href = url }
    catch { alert('Something went wrong.'); setLoading(false) }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) { setSubmitted(true); handleSubscribe() }
  }

  const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
  const pct = (a: number, b: number) => clamp((scroll - a) / (b - a))
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  // Hero: 0–200vh
  const heroFade = pct(wh * 0.4, wh * 1.1)

  // How it works: starts at 200vh, 300vh long
  const B = wh * 2
  const s1 = clamp(Math.min(pct(B, B + wh * .4), 1 - pct(B + wh * .7, B + wh * 1.1)))
  const s2 = clamp(Math.min(pct(B + wh * .9, B + wh * 1.3), 1 - pct(B + wh * 1.7, B + wh * 2.1)))
  const s3 = pct(B + wh * 1.9, B + wh * 2.4)
  const activeStep = s3 > .3 ? 2 : s2 > .3 ? 1 : 0

  const tabs = [
    { l: '🍕 Restaurant', p: `Fresh from our kitchen to your table tonight 🍕 Our chef just dropped something incredible — come taste why we've been Long Island's favorite for 12 years. Limited tables! Book now. #longislandeats #italianfood #freshdaily #foodie` },
    { l: '✂️ Barbershop', p: `New week. Fresh cut. 💈 Our chairs are open — walk-ins welcome all day. Come look sharp, feel sharp. ✂️ #barbershop #freshcut #barberlife #mensgrooming #lookgood` },
    { l: '👗 Boutique', p: `New arrivals just landed 🛍️ Spring collection is in — pieces going fast. DM to reserve before it's gone! 💫 #boutique #newcollection #shoplocal #fashion #springvibes` },
    { l: '💪 Gym', p: `Your best workout is waiting 💪 Free drop-in class today 6PM — no experience needed, just show up. 🔥 Tag someone who needs to move! #fitness #gym #workout #getfit` },
  ]

  const platforms = [
    { n: 'Instagram', i: '📸', c: '#E1306C' }, { n: 'TikTok', i: '🎵', c: '#69C9D0' },
    { n: 'Facebook', i: '📘', c: '#1877F2' }, { n: 'X (Twitter)', i: '𝕏', c: '#555' },
    { n: 'LinkedIn', i: '💼', c: '#0A66C2' }, { n: 'Pinterest', i: '📌', c: '#E60023' },
    { n: 'Yelp', i: '⭐', c: '#D32323' }, { n: 'Google', i: '🔍', c: '#4285F4' },
  ]

  const steps = [
    { icon: '✏️', num: '01', color: '#8b5cf6', title: 'Tell us about\nyour business', desc: 'Business name, industry, brand voice, which platforms. Takes 2 minutes. Done once, forever.' },
    { icon: '🤖', num: '02', color: '#ec4899', title: 'AI writes all\nyour content', desc: 'A full week of posts for every platform, photo captions, and review responses — in your exact brand voice.' },
    { icon: '🚀', num: '03', color: '#10b981', title: 'Everything posts\nautomatically', desc: 'Posts publish at peak times. Reviews get replied to instantly. Your entire online presence runs itself.' },
  ]

  return (
    <>
      <Head>
        <title>PostWiz – AI Manages Your Social Media & Reviews</title>
        <meta name="description" content="PostWiz manages Instagram, TikTok, Facebook, X, Yelp, Google Reviews and more — automatically using AI." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: auto; }
        body { background: #06040f; color: #fff; font-family: 'Inter', sans-serif; overflow-x: hidden; cursor: none; }
        .S { font-family: 'Syne', sans-serif; }

        /* Custom cursor */
        #CD { position:fixed;width:12px;height:12px;background:#a78bfa;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:difference;transition:transform .1s; }
        #CR { position:fixed;width:40px;height:40px;border:1.5px solid rgba(167,139,250,.5);border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:left .09s,top .09s,width .25s,height .25s,border-color .25s; }
        body:has(button:hover) #CR,body:has(a:hover) #CR { width:58px;height:58px;border-color:rgba(244,114,182,.8);background:rgba(244,114,182,.04); }
        body:has(input:focus) #CR { width:24px;height:24px;border-color:rgba(167,139,250,.8); }

        /* Nav */
        .nav { position:fixed;top:0;left:0;right:0;z-index:100;padding:22px 60px;display:flex;align-items:center;justify-content:space-between;transition:all .4s; }
        .nav.on { background:rgba(6,4,15,.9);backdrop-filter:blur(24px);padding:14px 60px;border-bottom:1px solid rgba(167,139,250,.1); }
        .nl { color:rgba(255,255,255,.45);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s;position:relative; }
        .nl::after { content:'';position:absolute;bottom:-3px;left:0;width:0;height:1px;background:linear-gradient(90deg,#8b5cf6,#ec4899);transition:width .3s; }
        .nl:hover { color:#fff; }
        .nl:hover::after { width:100%; }

        /* Gradient text */
        .G1 { background:linear-gradient(135deg,#a78bfa,#f472b6,#fb923c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .G2 { background:linear-gradient(135deg,#7c3aed,#db2777);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .G3 { background:linear-gradient(135deg,#c4b5fd,#f9a8d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }

        /* Buttons */
        .B { display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter',sans-serif;font-weight:600;cursor:none;border:none;transition:all .3s; }
        .BP { background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;padding:15px 36px;border-radius:50px;font-size:16px;box-shadow:0 0 0 0 rgba(139,92,246,.4),0 8px 32px rgba(139,92,246,.3);animation:glow-pulse 3s ease-in-out infinite; }
        .BP:hover { transform:translateY(-2px) scale(1.02);box-shadow:0 0 40px rgba(139,92,246,.6),0 16px 48px rgba(139,92,246,.4); }
        .BP:disabled { opacity:.6;transform:none;animation:none; }
        .BL { padding:20px 54px;font-size:19px; }
        .BG { background:rgba(255,255,255,.06);color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.12);padding:14px 32px;border-radius:50px;font-size:15px;backdrop-filter:blur(10px); }
        .BG:hover { background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.2); }

        /* Cards */
        .GC { background:rgba(255,255,255,.04);border:1px solid rgba(167,139,250,.12);border-radius:24px;backdrop-filter:blur(12px);transition:all .35s; }
        .GC:hover { background:rgba(255,255,255,.07);border-color:rgba(139,92,246,.3);transform:translateY(-6px);box-shadow:0 24px 64px rgba(0,0,0,.4),0 0 0 1px rgba(139,92,246,.15),inset 0 1px 0 rgba(255,255,255,.08); }

        /* Animations */
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes floatR { 0%,100%{transform:translateY(-7px) rotate(-2deg)} 50%{transform:translateY(7px) rotate(-2deg)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes marquee{ from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.4),0 8px 32px rgba(139,92,246,.3)} 50%{box-shadow:0 0 30px rgba(139,92,246,.6),0 8px 48px rgba(139,92,246,.5)} }
        @keyframes scan { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(70px,-50px) scale(1.08)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-60px,35px) scale(.95)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
        @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
        @keyframes grid-in { from{opacity:0} to{opacity:1} }

        .fa { animation:float 5s ease-in-out infinite; }
        .fb { animation:floatR 4s ease-in-out infinite 1.2s; }
        .cur { display:inline-block;width:3px;height:.88em;background:#f472b6;margin-left:2px;border-radius:2px;animation:blink 1s step-end infinite;vertical-align:text-bottom; }
        .sh { background:linear-gradient(90deg,#a78bfa,#f472b6,#fb923c,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite; }

        .SL { font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#a78bfa;display:block;margin-bottom:16px; }

        .notif { background:rgba(255,255,255,.06);border:1px solid rgba(167,139,250,.18);border-radius:16px;padding:14px 18px;backdrop-filter:blur(24px);box-shadow:0 8px 32px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.08); }

        .tab-btn { padding:10px 22px;border-radius:50px;border:1px solid rgba(167,139,250,.2);background:transparent;color:rgba(255,255,255,.4);font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:none;transition:all .25s; }
        .tab-btn.on { background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent;color:#fff;box-shadow:0 0 24px rgba(139,92,246,.4); }
        .tab-btn:hover:not(.on) { border-color:rgba(167,139,250,.4);color:rgba(255,255,255,.75); }

        /* Scanline effect */
        .scanline { position:fixed;inset:0;pointer-events:none;z-index:1;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.015) 2px,rgba(0,0,0,.015) 4px); }

        /* Email input */
        .email-wrap { display:flex;gap:0;max-width:480px;margin:0 auto;border-radius:50px;overflow:hidden;border:1px solid rgba(167,139,250,.3);background:rgba(255,255,255,.06);backdrop-filter:blur(12px); }
        .email-input { flex:1;background:transparent;border:none;padding:16px 24px;color:#fff;font-family:'Inter',sans-serif;font-size:15px;outline:none; }
        .email-input::placeholder { color:rgba(255,255,255,.3); }

        @media(max-width:900px){ .nav{padding:16px 24px;}.nav.on{padding:12px 24px;} body{cursor:auto;} #CD,#CR{display:none;} }
      `}</style>

      <div id="CD" style={{ left: mouse.x, top: mouse.y }} />
      <div id="CR" style={{ left: mouse.x, top: mouse.y }} />
      <div className="scanline" />
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Mouse-tracked radial glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, rgba(139,92,246,.07) 0%, transparent 60%)`, transition: 'background .1s' }} />

      {/* NAV */}
      <nav className={`nav ${scroll > 60 ? 'on' : ''}`}>
        <div className="S" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px' }}>Post<span className="G2">Wiz</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <a href="#platforms" className="nl">Platforms</a>
          <a href="#how-anchor" className="nl">How it works</a>
          <a href="/studio" className="nl" style={{ color: '#a78bfa', fontWeight: 600 }}>🎨 Studio</a>
          <a href="#pricing" className="nl">Pricing</a>
          <button onClick={handleSubscribe} className="B BP" style={{ padding: '11px 28px', fontSize: '14px' }}>Start Free →</button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══════════════════════════
            HERO — dark, futuristic
        ═══════════════════════════ */}
        <section style={{ height: '200vh', position: 'relative' }}>
          <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#06040f' }}>

            {/* Large glowing orbs */}
            <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.18) 0%,transparent 65%)', top: '-25%', left: '-20%', animation: 'orb1 20s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.14) 0%,transparent 65%)', top: '5%', right: '-15%', animation: 'orb2 24s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(249,115,22,.1) 0%,transparent 65%)', bottom: '-15%', left: '30%', animation: 'orb1 16s ease-in-out infinite 4s', pointerEvents: 'none' }} />

            {/* Floating notification cards */}
            <div className="notif fa" style={{ position: 'absolute', left: '4%', top: '30%', width: 220, opacity: Math.max(0, 1 - heroFade * 2), transform: `translateY(${-heroFade * 50}px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'glow-pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>LIVE · Instagram</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>Your daily special just posted ✨</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                <span style={{ color: '#a78bfa' }}>↑ 247 likes</span>
                <span style={{ color: 'rgba(255,255,255,.3)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,.4)' }}>2min ago</span>
              </div>
            </div>

            <div className="notif fb" style={{ position: 'absolute', right: '4%', top: '26%', width: 215, opacity: Math.max(0, 1 - heroFade * 2), transform: `translateY(${-heroFade * 35}px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>⭐</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>YELP REVIEW REPLY</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, marginBottom: 6 }}>AI replied professionally in 12 seconds</div>
              <div style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 5 }}><span>✓</span> Review management active</div>
            </div>

            <div className="notif fa" style={{ position: 'absolute', left: '6%', bottom: '22%', width: 195, animationDelay: '2s', opacity: Math.max(0, 1 - heroFade * 2), transform: `translateY(${heroFade * 30}px)` }}>
              <div style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />New customer arrived
              </div>
              <div style={{ fontSize: 13 }}>Found you via <strong style={{ color: '#a78bfa' }}>Google Review</strong></div>
            </div>

            <div className="notif fb" style={{ position: 'absolute', right: '5%', bottom: '24%', width: 210, opacity: Math.max(0, 1 - heroFade * 2), transform: `translateY(${heroFade * 25}px)` }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>This week · all platforms</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[{ v: '21', l: 'posts', c: '#f472b6' }, { v: '4.8k', l: 'reach', c: '#a78bfa' }, { v: '+12', l: 'reviews', c: '#34d399' }].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div className="S" style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero content */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px',
              opacity: Math.max(0, 1 - heroFade * 1.6),
              transform: `scale(${lerp(1, .88, heroFade)}) translateY(${-heroFade * 90}px)`,
            }}>
              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,.1)', border: '1px solid rgba(167,139,250,.25)', borderRadius: 50, padding: '9px 22px', marginBottom: 36 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', boxShadow: '0 0 8px #a78bfa', animation: 'glow-pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#c4b5fd' }}>8 platforms · Social + Reviews · AI-powered</span>
              </div>

              {/* Main heading */}
              <h1 className="S" style={{ fontSize: 'clamp(50px,8.5vw,108px)', fontWeight: 800, lineHeight: .95, letterSpacing: '-5px', marginBottom: 28 }}>
                <span style={{ color: 'rgba(255,255,255,.92)' }}>AI manages</span><br />
                <span style={{ color: 'rgba(255,255,255,.92)' }}>your </span>
                <span className="G1">{typed}<span className="cur" /></span>
              </h1>

              {/* Subtext */}
              <p style={{ fontSize: 20, color: 'rgba(255,255,255,.4)', maxWidth: 560, margin: '0 auto 52px', lineHeight: 1.85, fontWeight: 300 }}>
                PostWiz handles Instagram, TikTok, Facebook, X, LinkedIn, Pinterest, Yelp and Google Reviews — completely on autopilot.
              </p>

              {/* Email CTA — the conversion weapon */}
              {!submitted ? (
                <form onSubmit={handleEmailSubmit} style={{ marginBottom: 20, width: '100%', maxWidth: 480 }}>
                  <div className="email-wrap">
                    <input className="email-input" type="email" placeholder="Enter your email to start free →" value={email} onChange={e => setEmail(e.target.value)} required />
                    <button type="submit" className="B BP" style={{ borderRadius: '0 50px 50px 0', padding: '16px 28px', fontSize: 15, animation: 'none', margin: 0 }}>
                      Start Free
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', marginTop: 10, textAlign: 'center' }}>7-day free trial · No credit card · Cancel anytime</p>
                </form>
              ) : (
                <div style={{ marginBottom: 20, padding: '16px 32px', borderRadius: 50, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.3)', color: '#34d399', fontSize: 15, fontWeight: 500 }}>
                  ✓ Redirecting you to start your trial...
                </div>
              )}

              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <button className="B BG" onClick={() => window.scrollTo({ top: wh * 2.1, behavior: 'smooth' })}>Watch how it works ↓</button>
                <a href="/studio" className="B BG" style={{ textDecoration: 'none' }}>🎨 Try Content Studio</a>
              </div>

              {/* Platform icons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 48, flexWrap: 'wrap', opacity: .7 }}>
                {platforms.map(p => (
                  <div key={p.n} title={p.n} style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, transition: 'all .2s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = p.c + '20'; el.style.borderColor = p.c + '40'; el.style.transform = 'scale(1.15)'; el.style.opacity = '1' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,.05)'; el.style.borderColor = 'rgba(255,255,255,.08)'; el.style.transform = 'scale(1)'; el.style.opacity = '0.7' }}>
                    {p.i}
                  </div>
                ))}
              </div>

              {/* Scroll cue */}
              <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: Math.max(0, 1 - heroFade * 5) }}>
                <span style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>Scroll to explore</span>
                <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom,rgba(167,139,250,.5),transparent)' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            MARQUEE
        ═══════════════════════════ */}
        <div style={{ background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(167,139,250,.08)', borderBottom: '1px solid rgba(167,139,250,.08)', padding: '14px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', animation: 'marquee 22s linear infinite', whiteSpace: 'nowrap' }}>
            {['Instagram','TikTok','Facebook','X Twitter','Yelp Reviews','Google Reviews','LinkedIn','Pinterest','AI Writing','Auto-Schedule','Brand Voice','Photo Captions','Analytics','Review Manager',
              'Instagram','TikTok','Facebook','X Twitter','Yelp Reviews','Google Reviews','LinkedIn','Pinterest','AI Writing','Auto-Schedule','Brand Voice','Photo Captions','Analytics','Review Manager'
            ].map((t, i) => (
              <span key={i} style={{ padding: '0 26px', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: ['#a78bfa','#f472b6','#fb923c','#34d399','rgba(255,255,255,.15)'][i % 5] }}>✦ {t}</span>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════
            HOW IT WORKS — scroll storytelling
        ═══════════════════════════ */}
        <div id="how-anchor" style={{ height: 0 }} />
        <section style={{ height: '300vh', position: 'relative' }}>
          <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#06040f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

            {/* Subtle bg for this section */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(139,92,246,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'absolute', top: 44, textAlign: 'center' }}>
              <span className="SL">How PostWiz works</span>
            </div>

            {/* Steps */}
            {steps.map((step, i) => {
              const op = i === 0 ? s1 : i === 1 ? s2 : s3
              const ein = i === 0 ? s1 : i === 1 ? s2 : s3
              const enterAmt = Math.min(1, ein * 2.5)
              const exitAmt = i === 0 ? s1out : i === 1 ? s2out : 0

              // These are defined inline to avoid TS errors
              const s1out2 = clamp((scroll - (B + wh * .7)) / (wh * .4))
              const s2out2 = clamp((scroll - (B + wh * 1.7)) / (wh * .4))
              const exitVal = i === 0 ? s1out2 : i === 1 ? s2out2 : 0

              const ey = lerp(56, 0, enterAmt)
              const er = lerp(i % 2 === 0 ? 5 : -5, 0, enterAmt)
              const es = lerp(.88, 1, enterAmt)
              const xY = lerp(0, -90, exitVal)

              return (
                <div key={i} style={{
                  position: 'absolute', maxWidth: 600, width: '90%', textAlign: 'center', zIndex: 2,
                  opacity: op, pointerEvents: op > .05 ? 'auto' : 'none',
                  transform: `translateY(${ey + xY}px) rotate(${er * (1 - exitVal)}deg) scale(${es})`,
                }}>
                  {/* Glow ring around icon */}
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                    <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: step.color + '12', animation: 'pulse-ring 3s ease-out infinite', animationDelay: `${i * 0.5}s` }} />
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: `linear-gradient(135deg,${step.color}20,${step.color}08)`, border: `1.5px solid ${step.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, boxShadow: `0 0 40px ${step.color}20,inset 0 1px 0 rgba(255,255,255,.1)` }}>
                      {step.icon}
                    </div>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: step.color, marginBottom: 16, textShadow: `0 0 20px ${step.color}` }}>Step {step.num}</div>

                  <h2 className="S" style={{ fontSize: 'clamp(36px,5vw,62px)', fontWeight: 800, color: '#fff', letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 22, whiteSpace: 'pre-line', textShadow: '0 0 60px rgba(167,139,250,.2)' }}>
                    {step.title}
                  </h2>

                  <p style={{ fontSize: 18, color: 'rgba(255,255,255,.42)', lineHeight: 1.85, maxWidth: 460, margin: '0 auto', fontWeight: 300 }}>
                    {step.desc}
                  </p>

                  {i === 2 && (
                    <button onClick={handleSubscribe} className="B BP" style={{ marginTop: 40, padding: '16px 44px', fontSize: 17 }}>
                      Get Started Free →
                    </button>
                  )}
                </div>
              )
            })}

            {/* Step dots */}
            <div style={{ position: 'absolute', bottom: 44, display: 'flex', alignItems: 'center', gap: 10 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: 8, borderRadius: 4, width: activeStep === i ? 32 : 8, background: activeStep === i ? `linear-gradient(90deg,#8b5cf6,#ec4899)` : 'rgba(167,139,250,.2)', transition: 'all .5s cubic-bezier(.16,1,.3,1)', boxShadow: activeStep === i ? '0 0 12px rgba(139,92,246,.5)' : 'none' }} />
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(167,139,250,.08)' }}>
              <div style={{ height: '100%', width: `${Math.max(s1, Math.min(1, s2 * .67 + .33), Math.min(1, s3 * .33 + .67)) * 100}%`, background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', transition: 'width .1s', boxShadow: '0 0 8px rgba(139,92,246,.6)' }} />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            STATS
        ═══════════════════════════ */}
        <section id="ctr-t" style={{ background: 'linear-gradient(180deg,#06040f,#0a0618)', padding: '100px 40px', borderTop: '1px solid rgba(167,139,250,.08)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="SL">By the numbers</span>
              <h2 className="S" style={{ fontSize: 'clamp(32px,4vw,54px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05 }}>
                PostWiz works while<br /><span className="G1">you run your business.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { num: ctrs.p.toLocaleString() + '+', label: 'Posts Generated', sub: 'Across all platforms', color: '#a78bfa', icon: '✍️' },
                { num: ctrs.b.toLocaleString() + '+', label: 'Active Businesses', sub: 'Every industry', color: '#f472b6', icon: '🏢' },
                { num: ctrs.h.toLocaleString() + 'h', label: 'Hours Saved', sub: 'Time back to owners', color: '#fb923c', icon: '⚡' },
              ].map(s => (
                <div key={s.label} className="GC" style={{ padding: '40px 36px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = s.color + '40'; el.style.boxShadow = `0 24px 64px rgba(0,0,0,.4),0 0 40px ${s.color}15` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(167,139,250,.12)'; el.style.boxShadow = '' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${s.color},transparent)`, opacity: .6 }} />
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{s.icon}</div>
                  <div className="S" style={{ fontSize: 54, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 8, textShadow: `0 0 30px ${s.color}40` }}>{s.num}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            PLATFORMS
        ═══════════════════════════ */}
        <section id="platforms" style={{ background: '#0a0618', padding: '120px 40px', borderTop: '1px solid rgba(167,139,250,.06)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="SL">All Platforms</span>
              <h2 className="S" style={{ fontSize: 'clamp(32px,4.5vw,58px)', fontWeight: 800, color: '#fff', letterSpacing: '-2.5px', lineHeight: 1.02, marginBottom: 16 }}>
                One tool. <span className="G1">Every platform.</span>
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,.35)', maxWidth: 480, margin: '0 auto' }}>Social media posting AND review management — everything your online presence needs.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>
              {platforms.map(p => (
                <div key={p.n} className="GC" style={{ padding: '28px 20px', textAlign: 'center' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = p.c + '40'; el.style.boxShadow = `0 16px 48px ${p.c}12,0 0 0 1px ${p.c}20` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(167,139,250,.12)'; el.style.boxShadow = '' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{p.i}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.75)', marginBottom: 8 }}>{p.n}</div>
                  <div style={{ width: 28, height: 2.5, borderRadius: 2, background: p.c, margin: '0 auto', opacity: .6, boxShadow: `0 0 8px ${p.c}` }} />
                </div>
              ))}
            </div>

            {/* Yelp demo */}
            <div className="GC" style={{ padding: '32px', maxWidth: 700, margin: '0 auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#a78bfa', marginBottom: 16 }}>⭐ Example · AI-Generated Yelp Reply</div>
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 18px', marginBottom: 14, fontSize: 14, color: 'rgba(255,255,255,.45)', fontStyle: 'italic' }}>
                &ldquo;Amazing food! The garlic knots were incredible. Will definitely be back!&rdquo; — Sarah K. ★★★★★
              </div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.65)', lineHeight: 1.75 }}>
                Thank you so much, Sarah! 🙏 Our garlic knots are a fan favorite — so glad they hit the spot! We can&apos;t wait to welcome you back. Next time try our new seasonal special!
              </p>
              <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)', color: '#34d399', padding: '4px 12px', borderRadius: 50, fontWeight: 600 }}>✓ Posted to Yelp automatically</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>Responded in 12 seconds</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            FEATURES
        ═══════════════════════════ */}
        <section style={{ background: '#06040f', padding: '120px 40px', borderTop: '1px solid rgba(167,139,250,.06)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <span className="SL">Features</span>
              <h2 className="S" style={{ fontSize: 'clamp(32px,4vw,54px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05 }}>
                Everything included.<br /><span className="G1">Zero extra fees.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                { icon: '🤖', title: 'AI Post Writing', desc: 'Claude AI writes platform-perfect posts in your brand voice for all 8 platforms simultaneously.', color: '#8b5cf6' },
                { icon: '📸', title: 'Photo Caption AI', desc: 'Upload a photo and AI analyzes the image, then writes tailored captions for every platform.', color: '#ec4899' },
                { icon: '📅', title: 'Smart Scheduling', desc: 'Posts publish at peak engagement times for your audience. Zero manual scheduling needed.', color: '#f97316' },
                { icon: '⭐', title: 'Review Management', desc: 'AI responds to Yelp and Google reviews within seconds. Never miss a review again.', color: '#10b981' },
                { icon: '📊', title: 'Analytics', desc: 'Clear data on what posts are working. Understand your audience without being a data scientist.', color: '#0891b2' },
                { icon: '🎨', title: 'Content Studio', desc: 'Upload photos in bulk. AI generates captions for every platform and queues it all up.', color: '#7c3aed' },
              ].map(f => (
                <div key={f.title} className="GC" style={{ padding: '32px 28px' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = f.color + '30'; el.style.boxShadow = `0 20px 60px rgba(0,0,0,.4),0 0 30px ${f.color}10` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(167,139,250,.12)'; el.style.boxShadow = '' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: f.color + '12', border: `1px solid ${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18, boxShadow: `inset 0 1px 0 rgba(255,255,255,.05)` }}>{f.icon}</div>
                  <h3 className="S" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-.4px' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,.38)', lineHeight: 1.82 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            LIVE DEMO
        ═══════════════════════════ */}
        <section id="demo" style={{ background: '#0a0618', padding: '120px 40px', borderTop: '1px solid rgba(167,139,250,.06)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="SL">Live Demo</span>
              <h2 className="S" style={{ fontSize: 'clamp(32px,4vw,54px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 14 }}>
                See what AI writes <span className="G1">for your business.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,.35)', maxWidth: 420, margin: '0 auto' }}>Click your industry. Watch AI generate a real post instantly.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
              {tabs.map((t, i) => <button key={i} onClick={() => setActiveTab(i)} className={`tab-btn ${activeTab === i ? 'on' : ''}`}>{t.l}</button>)}
            </div>

            <div className="GC" style={{ padding: '36px', maxWidth: 680, margin: '0 auto', position: 'relative', overflow: 'hidden' }} key={activeTab}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,#8b5cf6,#ec4899,transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid rgba(167,139,250,.08)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 20px rgba(139,92,246,.4)' }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>PostWiz AI</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>Generated just now · Instagram</div>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)', color: '#a78bfa', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 50 }}>📸 Ready to post</div>
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,.7)', marginBottom: 24, animation: 'fadeUp .3s ease' }}>{tabs[activeTab].p}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', color: '#fff', padding: '11px 22px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 0 20px rgba(139,92,246,.3)' }}>✓ Approve & Schedule</button>
                <button style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(167,139,250,.2)', color: 'rgba(255,255,255,.6)', padding: '11px 18px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, cursor: 'pointer' }}>✏️ Edit</button>
                <button style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(167,139,250,.2)', color: 'rgba(255,255,255,.6)', padding: '11px 18px', borderRadius: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, cursor: 'pointer' }}>↻ Regenerate</button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            TESTIMONIALS
        ═══════════════════════════ */}
        <section style={{ background: '#06040f', padding: '120px 40px', borderTop: '1px solid rgba(167,139,250,.06)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="SL">Testimonials</span>
              <h2 className="S" style={{ fontSize: 'clamp(32px,4vw,54px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05 }}>
                Real businesses.<br /><span className="G1">Real results.</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { n: 'Maria G.', b: 'Pizzeria · Long Island', q: 'PostWiz posts every day and responds to my Yelp reviews automatically. I get 3x more customers finding me online. It pays for itself with one new customer.', stars: 5, color: '#E1306C' },
                { n: 'Jason T.', b: 'Barbershop · Queens', q: 'Set it up in 5 minutes. Posts to Instagram and TikTok daily, responds to Google reviews. Got 6 new clients this month from online alone. Best thing I ever used.', stars: 5, color: '#8b5cf6' },
                { n: 'Sandra K.', b: 'Boutique · Brooklyn', q: 'Zero time on social media or reviews. My engagement is up 200% and my Google rating went from 4.1 to 4.8 stars. Insane ROI for $29/month.', stars: 5, color: '#f97316' },
              ].map(t => (
                <div key={t.n} className="GC" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = t.color + '30'; el.style.boxShadow = `0 20px 60px rgba(0,0,0,.4),0 0 30px ${t.color}10` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(167,139,250,.12)'; el.style.boxShadow = '' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.color, opacity: .6 }} />
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>{Array(t.stars).fill(0).map((_, i) => <span key={i} style={{ color: t.color, fontSize: 16, textShadow: `0 0 8px ${t.color}` }}>★</span>)}</div>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.9, marginBottom: 24, fontStyle: 'italic' }}>&ldquo;{t.q}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${t.color}20,${t.color}08)`, border: `1.5px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: t.color, fontFamily: 'Syne,sans-serif', boxShadow: `0 0 16px ${t.color}20` }}>{t.n[0]}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 600 }}>{t.n}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{t.b}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            PRICING
        ═══════════════════════════ */}
        <section id="pricing" style={{ background: '#0a0618', padding: '120px 40px', borderTop: '1px solid rgba(167,139,250,.06)' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="SL">Pricing</span>
              <h2 className="S" style={{ fontSize: 'clamp(32px,4vw,54px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 12 }}>
                One price. <span className="G1">Everything included.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,.35)' }}>All 8 platforms. Social + Reviews. Cancel anytime.</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 28, padding: '48px 44px', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#8b5cf6,#ec4899,#f97316)', boxShadow: '0 0 20px rgba(139,92,246,.5)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

              <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative' }}>
                <div style={{ display: 'inline-block', background: 'rgba(139,92,246,.12)', border: '1px solid rgba(167,139,250,.25)', color: '#c4b5fd', padding: '6px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>All 8 Platforms Included</div>
                <div className="S" style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}><span className="G1">$29</span></div>
                <div style={{ color: 'rgba(255,255,255,.3)', marginTop: 8, fontSize: 15 }}>per month · billed monthly</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36, position: 'relative' }}>
                {['Instagram, TikTok, Facebook & X','LinkedIn & Pinterest posting','Yelp review auto-responses','Google Review management','Unlimited AI-written content','Photo caption AI (Content Studio)','Smart scheduling & analytics','Cancel anytime, no contracts'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#34d399', fontSize: 12, fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,.65)' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Email CTA in pricing too */}
              <form onSubmit={handleEmailSubmit} style={{ position: 'relative' }}>
                <div className="email-wrap" style={{ border: '1px solid rgba(139,92,246,.3)' }}>
                  <input className="email-input" type="email" placeholder="Enter email to start free trial" value={email} onChange={e => setEmail(e.target.value)} required />
                  <button type="submit" className="B BP" style={{ borderRadius: '0 50px 50px 0', padding: '16px 24px', fontSize: 14, animation: 'none', margin: 0 }}>
                    {loading ? '...' : 'Start Free'}
                  </button>
                </div>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 12, marginTop: 14 }}>7 days free · then $29/month · no contracts</p>
              </form>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            FINAL CTA — immersive gradient
        ═══════════════════════════ */}
        <section style={{ background: 'linear-gradient(135deg,#4c1d95 0%,#831843 45%,#7c2d12 100%)', padding: '140px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(167,139,250,.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
          {/* Grid overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>
            <h2 className="S" style={{ fontSize: 'clamp(42px,6.5vw,88px)', fontWeight: 800, color: '#fff', letterSpacing: '-4px', lineHeight: .95, marginBottom: 24, textShadow: '0 0 80px rgba(167,139,250,.3)' }}>
              Your entire online<br />presence, on autopilot.
            </h2>
            <p style={{ fontSize: 19, color: 'rgba(255,255,255,.5)', marginBottom: 52, fontWeight: 300, letterSpacing: '.2px' }}>
              Instagram · TikTok · Facebook · X · LinkedIn · Pinterest · Yelp · Google
            </p>
            <form onSubmit={handleEmailSubmit} style={{ maxWidth: 480, margin: '0 auto 20px' }}>
              <div className="email-wrap" style={{ border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)' }}>
                <input className="email-input" type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required style={{ color: '#fff' }} />
                <button type="submit" style={{ background: '#fff', color: '#7c3aed', border: 'none', borderRadius: '0 50px 50px 0', padding: '16px 28px', fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(255,255,255,.2)' }}>
                  Get Started Free →
                </button>
              </div>
            </form>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>No credit card required · 7-day free trial · Cancel anytime</p>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: '#06040f', borderTop: '1px solid rgba(167,139,250,.07)', padding: '32px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="S" style={{ fontSize: 20, fontWeight: 800 }}>Post<span className="G2">Wiz</span></div>
          <p style={{ color: 'rgba(255,255,255,.18)', fontSize: 13 }}>© 2026 PostWiz. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>{['Privacy','Terms'].map(l => <a key={l} href={`/${l.toLowerCase()}`} style={{ color: 'rgba(255,255,255,.22)', textDecoration: 'none', fontSize: 13 }}>{l}</a>)}</div>
        </footer>
      </main>
    </>
  )
}
