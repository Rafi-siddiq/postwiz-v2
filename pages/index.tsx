import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const phrases = ['Instagram posts.', 'Facebook updates.', 'TikTok captions.', 'your entire feed.']
  const phraseRef = useRef(0)
  const charRef = useRef(0)
  const deletingRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouse)
    return () => { window.removeEventListener('scroll', handleScroll); window.removeEventListener('mousemove', handleMouse) }
  }, [])

  // Typing effect
  useEffect(() => {
    const type = () => {
      const phrase = phrases[phraseRef.current]
      if (!deletingRef.current) {
        if (charRef.current < phrase.length) {
          setTypedText(phrase.substring(0, charRef.current + 1))
          charRef.current++
          setTimeout(type, 60)
        } else {
          setTimeout(() => { deletingRef.current = true; type() }, 2000)
        }
      } else {
        if (charRef.current > 0) {
          setTypedText(phrase.substring(0, charRef.current - 1))
          charRef.current--
          setTimeout(type, 30)
        } else {
          deletingRef.current = false
          phraseRef.current = (phraseRef.current + 1) % phrases.length
          setTimeout(type, 300)
        }
      }
    }
    const t = setTimeout(type, 500)
    return () => clearTimeout(t)
  }, [])

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[] = []
    const colors = ['#7C3AED', '#DB2777', '#F59E0B', '#10B981', '#3B82F6']

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })
      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(124,58,237,${0.08 * (1 - d / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      alert('Something went wrong.')
      setLoading(false)
    }
  }

  const tabs = [
    {
      label: 'Restaurants', icon: '🍕',
      post: `Fresh from our kitchen to your table 🍕 Tonight's special: wood-fired margherita with locally-sourced basil. Limited availability — book your table now! ✨ #italianfood #localeats #freshingredients #dinnertonight #foodie #longisland`,
      platform: 'Instagram', time: '7:00 PM'
    },
    {
      label: 'Barbershops', icon: '✂️',
      post: `Look sharp, feel sharp. 💈 New week, fresh cuts. Walk-ins welcome or book online. Our crew is ready for you. ✂️ #barbershop #freshcut #mensgrooming #barberlife #lookgood #longislandbarber`,
      platform: 'Instagram', time: '10:00 AM'
    },
    {
      label: 'Boutiques', icon: '👗',
      post: `New arrivals just dropped and they're EVERYTHING 🛍️ Spring collection is in — come see what everyone's talking about. Shop in-store or DM us to reserve! 💫 #boutique #newcollection #springfashion #shoplocal #ootd`,
      platform: 'Instagram', time: '12:00 PM'
    },
    {
      label: 'Gyms', icon: '💪',
      post: `Your goals don't take days off. Neither do we. 💪 Drop-in classes available this week — no commitment required. Come try us out. 🔥 #gym #fitness #workout #getfit #localfitness #gymmotivation`,
      platform: 'Instagram', time: '6:00 AM'
    },
  ]

  return (
    <>
      <Head>
        <title>PostWiz – AI Social Media Manager for Small Businesses</title>
        <meta name="description" content="PostWiz writes, schedules, and posts your social media automatically using AI. Set it up once — then forget it." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #02020a; color: #fff; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .syne { font-family: 'Syne', sans-serif; }

        /* Gradient text */
        .gt { background: linear-gradient(135deg, #a78bfa 0%, #f472b6 40%, #fbbf24 80%, #34d399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .gt2 { background: linear-gradient(90deg, #7C3AED, #DB2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* Animated gradient border */
        @keyframes borderSpin { to { --angle: 360deg; } }
        @property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        .grad-border {
          background: linear-gradient(#02020a, #02020a) padding-box,
            conic-gradient(from var(--angle), #7C3AED, #DB2777, #F59E0B, #10B981, #7C3AED) border-box;
          border: 1px solid transparent;
          animation: borderSpin 4s linear infinite;
        }

        /* Nav */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; transition: all 0.3s; padding: 20px 48px; display: flex; align-items: center; justify-content: space-between; }
        .nav.scrolled { background: rgba(2,2,10,0.9); backdrop-filter: blur(20px); padding: 14px 48px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .nav-logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .nav-links { display: flex; align-items: center; gap: 36px; }
        .nav-link { color: rgba(255,255,255,0.55); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #fff; }

        /* Buttons */
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Inter', sans-serif; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: linear-gradient(135deg, #7C3AED, #DB2777); color: white; padding: 14px 32px; border-radius: 50px; font-size: 15px; box-shadow: 0 0 40px rgba(124,58,237,0.4); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 60px rgba(124,58,237,0.6); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-lg { padding: 18px 44px; font-size: 17px; }
        .btn-outline { background: transparent; color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15); padding: 12px 28px; border-radius: 50px; font-size: 14px; }
        .btn-outline:hover { border-color: rgba(255,255,255,0.4); color: #fff; background: rgba(255,255,255,0.05); }

        /* Hero */
        .hero { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 140px 24px 80px; overflow: hidden; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.3); color: #c4b5fd; padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 500; margin-bottom: 32px; }
        .hero-title { font-family: 'Syne', sans-serif; font-size: clamp(52px, 8vw, 96px); font-weight: 800; line-height: 1.0; letter-spacing: -2px; margin-bottom: 24px; }
        .cursor { display: inline-block; width: 3px; height: 0.85em; background: #DB2777; border-radius: 2px; margin-left: 2px; animation: blink 1s step-end infinite; vertical-align: text-bottom; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .hero-sub { font-size: 18px; color: rgba(255,255,255,0.45); max-width: 520px; margin: 0 auto 48px; line-height: 1.8; font-weight: 300; }
        .hero-ctas { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 64px; flex-wrap: wrap; }
        .hero-note { font-size: 13px; color: rgba(255,255,255,0.25); }

        /* Floating cards */
        .float-card { position: absolute; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; backdrop-filter: blur(20px); padding: 16px 20px; }
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-16px) rotate(-2deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(2deg)} 50%{transform:translateY(-12px) rotate(2deg)} }
        @keyframes floatC { 0%,100%{transform:translateY(-8px) rotate(1deg)} 50%{transform:translateY(8px) rotate(1deg)} }
        .fa { animation: floatA 5s ease-in-out infinite; }
        .fb { animation: floatB 6s ease-in-out infinite 1s; }
        .fc { animation: floatC 4s ease-in-out infinite 0.5s; }

        /* Stats bar */
        .stats-bar { display: flex; justify-content: center; gap: 64px; padding: 48px 24px; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .stat { text-align: center; }
        .stat-n { font-family: 'Syne', sans-serif; font-size: 40px; font-weight: 800; }
        .stat-l { font-size: 14px; color: rgba(255,255,255,0.35); margin-top: 4px; }

        /* Section */
        .section { max-width: 1100px; margin: 0 auto; padding: 100px 24px; }
        .section-tag { display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #a78bfa; margin-bottom: 16px; }
        .section-title { font-family: 'Syne', sans-serif; font-size: clamp(32px, 5vw, 52px); font-weight: 800; letter-spacing: -1px; margin-bottom: 16px; line-height: 1.1; }
        .section-sub { font-size: 18px; color: rgba(255,255,255,0.4); font-weight: 300; line-height: 1.7; }

        /* Cards */
        .glass-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; transition: all 0.3s; }
        .glass-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); transform: translateY(-4px); }

        /* Tabs */
        .tab-btn { padding: 10px 20px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.5); font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: linear-gradient(135deg, #7C3AED, #DB2777); border-color: transparent; color: white; }

        /* Post preview */
        .post-preview { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; position: relative; overflow: hidden; }
        .post-preview::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(124,58,237,0.05), rgba(219,39,119,0.05)); }

        /* Pricing */
        .price-card { background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(219,39,119,0.08)); border: 1px solid rgba(124,58,237,0.3); border-radius: 28px; padding: 48px; text-align: center; position: relative; overflow: hidden; }
        .price-card::before { content: ''; position: absolute; top: -60%; left: -30%; width: 200%; height: 200%; background: radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 60%); pointer-events: none; }

        /* Glow orbs */
        .orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px); }
        
        /* Scroll reveal */
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.7s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        /* Steps */
        .step-num { font-family: 'Syne', sans-serif; font-size: 72px; font-weight: 800; opacity: 0.06; position: absolute; top: -10px; right: 20px; line-height: 1; }

        /* Marquee */
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-track { display: flex; animation: marquee 20s linear infinite; white-space: nowrap; }
        .marquee-item { padding: 0 32px; font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.12); text-transform: uppercase; letter-spacing: 2px; }

        /* Cursor glow follow */
        .cursor-glow { position: fixed; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%); pointer-events: none; z-index: 0; transform: translate(-50%, -50%); transition: left 0.1s, top 0.1s; }

        @media (max-width: 768px) {
          .nav { padding: 16px 24px; }
          .nav-links { display: none; }
          .hero-title { font-size: 42px; letter-spacing: -1px; }
          .stats-bar { gap: 32px; flex-wrap: wrap; }
          .float-card { display: none; }
        }
      `}</style>

      {/* Cursor glow */}
      <div className="cursor-glow" style={{ left: mousePos.x, top: mousePos.y }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.6 }} />

      {/* Nav */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">Post<span className="gt2">Wiz</span></div>
        <div className="nav-links">
          <a href="#how" className="nav-link">How it works</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <button onClick={handleSubscribe} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>Start Free →</button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <section className="hero">
          {/* Orbs */}
          <div className="orb" style={{ width: 600, height: 600, background: 'rgba(124,58,237,0.12)', top: '-20%', left: '-15%' }} />
          <div className="orb" style={{ width: 400, height: 400, background: 'rgba(219,39,119,0.1)', top: '20%', right: '-10%' }} />
          <div className="orb" style={{ width: 300, height: 300, background: 'rgba(245,158,11,0.08)', bottom: '-10%', left: '40%' }} />

          {/* Floating cards */}
          <div className="float-card fa" style={{ left: '4%', top: '30%', width: 200 }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>📸 Posted to Instagram</div>
            <div style={{ fontSize: '13px', lineHeight: 1.5 }}>Your daily special is live ✨</div>
            <div style={{ fontSize: '11px', color: '#34d399', marginTop: '8px' }}>↑ 247 likes in 1 hour</div>
          </div>
          <div className="float-card fb" style={{ right: '4%', top: '35%', width: 190 }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>⚡ Auto-scheduled</div>
            <div style={{ fontSize: '13px', lineHeight: 1.5 }}>Next 7 days planned</div>
            <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '8px' }}>→ 21 posts ready</div>
          </div>
          <div className="float-card fc" style={{ left: '6%', bottom: '22%', width: 180 }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>💰 New customer</div>
            <div style={{ fontSize: '13px' }}>Found you via Instagram</div>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="hero-badge">
              <span style={{ width: 8, height: 8, background: '#34d399', borderRadius: '50%', display: 'inline-block', animation: 'blink 2s ease-in-out infinite' }} />
              Trusted by 847+ small businesses
            </div>

            <h1 className="hero-title">
              AI writes your<br />
              <span className="gt">{typedText}<span className="cursor" /></span>
            </h1>

            <p className="hero-sub">
              PostWiz generates and posts to Instagram, Facebook, and TikTok automatically. Tell us about your business once — AI handles everything else, forever.
            </p>

            <div className="hero-ctas">
              <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary btn-lg">
                {loading ? 'Loading...' : 'Start 7-Day Free Trial →'}
              </button>
              <button className="btn btn-outline" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
                See how it works
              </button>
            </div>
            <p className="hero-note">No credit card required · 2 minute setup · Cancel anytime</p>
          </div>
        </section>

        {/* Stats */}
        <div className="stats-bar" style={{ position: 'relative', zIndex: 1 }}>
          {[
            { n: '2,847+', l: 'Posts Generated Today' },
            { n: '847+', l: 'Active Businesses' },
            { n: '$0', l: 'Dev Cost to Start' },
            { n: '4.9★', l: 'Average Rating' },
          ].map(s => (
            <div className="stat" key={s.l}>
              <div className="stat-n gt">{s.n}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Marquee */}
        <div style={{ overflow: 'hidden', padding: '32px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
          <div className="marquee-track">
            {['Instagram', 'Facebook', 'TikTok', 'Auto-Schedule', 'AI Writing', 'Smart Hashtags', 'Analytics', 'One-Click Edit', 'Instagram', 'Facebook', 'TikTok', 'Auto-Schedule', 'AI Writing', 'Smart Hashtags', 'Analytics', 'One-Click Edit'].map((t, i) => (
              <span key={i} className="marquee-item">✦ {t}</span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <section id="how" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section">
            <div style={{ textAlign: 'center', marginBottom: '72px' }}>
              <div className="section-tag">How it works</div>
              <h2 className="section-title">Three steps. <span className="gt">Then autopilot.</span></h2>
              <p className="section-sub" style={{ maxWidth: 480, margin: '0 auto' }}>Set up once in 2 minutes. PostWiz handles your social media every single day after that.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {[
                { n: '01', icon: '✏️', title: 'Tell us about your business', desc: 'Name, industry, tone, what you sell. Takes less than 2 minutes. That\'s it.', color: '#7C3AED' },
                { n: '02', icon: '🤖', title: 'AI generates your content', desc: 'We create a full week of platform-perfect posts tailored to your brand voice.', color: '#DB2777' },
                { n: '03', icon: '🚀', title: 'Posts go live automatically', desc: 'One-click approval or fully automatic. Your social media runs itself.', color: '#F59E0B' },
              ].map(s => (
                <div key={s.n} className="glass-card" style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
                  <div className="step-num">{s.n}</div>
                  <div style={{ fontSize: '36px', marginBottom: '20px' }}>{s.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: s.color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Step {s.n}</div>
                  <h3 className="syne" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.3px' }}>{s.title}</h3>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live post demo */}
        <section style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div className="section-tag">See it in action</div>
              <h2 className="section-title">PostWiz writes for <span className="gt">every business.</span></h2>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
              {tabs.map((t, i) => (
                <button key={i} className={`tab-btn ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div className="post-preview" style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                <span style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>postwiz.co/dashboard</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#E1306C', background: 'rgba(225,48,108,0.15)', padding: '4px 12px', borderRadius: '50px' }}>📸 {tabs[activeTab].platform}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>🕐 {tabs[activeTab].time}</span>
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', minHeight: '80px', transition: 'all 0.3s' }}>{tabs[activeTab].post}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button className="btn" style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>✓ Approve & Post</button>
                  <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}>✏️ Edit</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '4px 0' }}>
                <span style={{ width: 8, height: 8, background: '#34d399', borderRadius: '50%', display: 'inline-block', animation: 'blink 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '13px', color: '#34d399' }}>AI is preparing next week&apos;s posts automatically...</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '72px' }}>
              <div className="section-tag">Features</div>
              <h2 className="section-title">Everything you need. <span className="gt">Nothing you don&apos;t.</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[
                { icon: '🤖', title: 'AI Post Writing', desc: 'Claude AI writes engaging posts perfectly calibrated to your brand voice, industry, and audience.', color: '#7C3AED' },
                { icon: '📅', title: 'Smart Auto-Scheduling', desc: 'Posts automatically at peak times for your specific audience. No manual scheduling ever.', color: '#DB2777' },
                { icon: '📱', title: 'Multi-Platform', desc: 'Instagram, Facebook, and TikTok all managed from one clean dashboard.', color: '#059669' },
                { icon: '#️⃣', title: 'AI Hashtag Engine', desc: 'Generates the best hashtags for your post automatically to maximize reach and discovery.', color: '#D97706' },
                { icon: '📊', title: 'Performance Analytics', desc: 'Clear data on what posts are working. Understand your audience without being a data scientist.', color: '#0891B2' },
                { icon: '✏️', title: 'One-Click Editing', desc: 'Full control. Review any post before it goes live and edit it in seconds.', color: '#7C3AED' },
              ].map(f => (
                <div key={f.title} className="glass-card" style={{ padding: '28px' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = f.color + '40'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}>
                  <div style={{ fontSize: '28px', marginBottom: '14px' }}>{f.icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <div className="section-tag">Testimonials</div>
              <h2 className="section-title">Real businesses. <span className="gt">Real results.</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {[
                { n: 'Maria G.', b: 'Pizzeria Owner, Long Island', q: 'I was barely posting once a week. PostWiz posts every single day now and I get 3x more customers finding me on Instagram. It literally pays for itself.', c: '#E1306C' },
                { n: 'Jason T.', b: 'Barbershop Owner, Queens', q: 'I told it my shop name and what I do. Now it just... posts for me. Got 4 new clients last week from TikTok alone. Wish I found this sooner.', c: '#7C3AED' },
                { n: 'Sandra K.', b: 'Boutique Owner, Brooklyn', q: 'Best $29 I spend every month. Used to waste hours thinking of what to post. Now I spend literally zero minutes on social media. Just check the results.', c: '#F59E0B' },
              ].map(t => (
                <div key={t.n} className="glass-card" style={{ padding: '32px' }}>
                  <div style={{ fontSize: '18px', letterSpacing: '2px', color: t.c, marginBottom: '20px' }}>★★★★★</div>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, marginBottom: '24px', fontStyle: 'italic' }}>&ldquo;{t.q}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${t.c}40, ${t.c}20)`, border: `1px solid ${t.c}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: t.c }}>{t.n[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.n}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{t.b}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div className="section-tag">Pricing</div>
              <h2 className="section-title">Simple, <span className="gt">honest</span> pricing.</h2>
              <p className="section-sub">Less than one coffee a day. Less than one hour of a social media manager&apos;s time.</p>
            </div>
            <div className="price-card">
              <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#c4b5fd', padding: '6px 18px', borderRadius: '50px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '28px' }}>All Inclusive</div>
              <div className="syne" style={{ fontSize: '80px', fontWeight: 800, lineHeight: 1 }}>
                <span className="gt">$29</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '36px', marginTop: '8px', fontSize: '15px' }}>per month · billed monthly</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px', textAlign: 'left' }}>
                {['Unlimited AI-written posts', 'Auto-scheduling & publishing', 'Instagram, Facebook & TikTok', 'AI hashtag generation', 'Post performance analytics', 'One-click editing', 'Priority support', 'Cancel anytime'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '15px' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.75)' }}>{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '16px', borderRadius: '14px' }}>
                {loading ? 'Loading...' : 'Start 7-Day Free Trial →'}
              </button>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '14px' }}>7 days free · then $29/month · no contracts</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px 140px', textAlign: 'center' }}>
          <div className="orb" style={{ width: 500, height: 500, background: 'rgba(124,58,237,0.1)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="syne" style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: '20px', lineHeight: 1.05 }}>
              Ready to put social media<br /><span className="gt">on autopilot?</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', marginBottom: '48px', fontWeight: 300 }}>Join hundreds of small businesses saving hours every single week.</p>
            <button onClick={handleSubscribe} disabled={loading} className="btn btn-primary btn-lg">
              {loading ? 'Loading...' : 'Get Started Free — No Card Needed'}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div className="syne" style={{ fontSize: '20px', fontWeight: 800 }}>Post<span className="gt2">Wiz</span></div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>© 2026 PostWiz. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontSize: '13px' }}>Privacy</a>
            <a href="/terms" style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontSize: '13px' }}>Terms</a>
          </div>
        </footer>
      </main>
    </>
  )
}
