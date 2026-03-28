import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const target = 2847
    const duration = 2000
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 16)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % 4), 3000)
    return () => clearInterval(t)
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const features = [
    { icon: '🤖', title: 'AI writes every post', color: '#7C3AED' },
    { icon: '📅', title: 'Auto-schedules for you', color: '#DB2777' },
    { icon: '📈', title: 'Tracks what works', color: '#059669' },
    { icon: '⚡', title: 'Posts while you sleep', color: '#D97706' },
  ]

  const posts = [
    { platform: 'Instagram', emoji: '📸', color: '#E1306C', text: '✨ Fresh ingredients = better flavor. Our new garlic knot special is HERE and it\'s everything. Stop in today! 🍕 #longislandeats #pizzalovers #freshdaily #localeats #foodie', time: '9:00 AM Today' },
    { platform: 'Facebook', emoji: '📘', color: '#1877F2', text: 'The wait is over! Our famous garlic knot special is back — made fresh daily with locally-sourced ingredients. Order online or come see us. We\'d love to have you! 🍕', time: '11:00 AM Today' },
    { platform: 'TikTok', emoji: '🎵', color: '#000000', text: 'POV: You just tried our garlic knots for the first time 🤯🍕 Come see what everyone\'s talking about. Link in bio for our menu!', time: '3:00 PM Today' },
  ]

  return (
    <>
      <Head>
        <title>PostWiz – AI Social Media Manager</title>
        <meta name="description" content="PostWiz writes and posts your social media automatically. Set it up once, then forget it." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050508; color: #fff; font-family: 'Inter', sans-serif; }
        .display { font-family: 'Syne', sans-serif; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slide { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .grad-text {
          background: linear-gradient(135deg, #a78bfa, #ec4899, #f59e0b, #34d399);
          background-size: 300% 300%;
          animation: gradMove 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .btn-main {
          background: linear-gradient(135deg, #7C3AED, #DB2777);
          border: none;
          color: white;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          padding: 16px 36px;
          border-radius: 50px;
          font-size: 17px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 40px rgba(124,58,237,0.5);
        }
        .btn-main:hover { transform: scale(1.03); box-shadow: 0 0 60px rgba(124,58,237,0.7); }
        .btn-main:disabled { opacity: 0.6; cursor: not-allowed; }
        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .glow-purple { box-shadow: 0 0 80px rgba(124,58,237,0.3); }
        .glow-pink { box-shadow: 0 0 80px rgba(219,39,119,0.3); }
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.4);
          color: #a78bfa;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 500;
        }
        .dot { width: 8px; height: 8px; background: #a78bfa; border-radius: 50%; }
        .section { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .stat-num { font-family: 'Syne', sans-serif; font-size: 52px; font-weight: 800; }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#050508', overflow: 'hidden' }}>

        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '30%', right: '-15%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(219,39,119,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '30%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>

        {/* Nav */}
        <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="display" style={{ fontSize: '24px', fontWeight: 800 }}>
            Post<span className="grad-text">Wiz</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#how" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>How it works</a>
            <a href="#pricing" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Pricing</a>
            <button onClick={handleSubscribe} className="btn-main" style={{ padding: '10px 24px', fontSize: '14px' }}>
              Start Free Trial
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '100px 24px 80px' }}>
          <div style={{ marginBottom: '24px' }}>
            <span className="tag">
              <span className="dot pulse" />
              AI-Powered · $29/month · Cancel anytime
            </span>
          </div>

          <h1 className="display" style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 800, lineHeight: 1.05, marginBottom: '24px' }}>
            Your social media,<br />
            <span className="grad-text">on autopilot.</span>
          </h1>

          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.55)', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            PostWiz uses AI to write, schedule, and post to Instagram, Facebook, and TikTok automatically. Tell us about your business once — we handle everything else.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleSubscribe} disabled={loading} className="btn-main">
              {loading ? 'Loading...' : 'Start 7-Day Free Trial →'}
            </button>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No credit card required · Setup in 2 minutes</p>
          </div>

          {/* Live counter */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '64px' }}>
            {[
              { num: `${count.toLocaleString()}+`, label: 'Posts Generated' },
              { num: '847+', label: 'Active Businesses' },
              { num: '4.9★', label: 'Average Rating' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div className="display" style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Animated post preview */}
        <section style={{ position: 'relative', zIndex: 1, padding: '20px 24px 80px' }}>
          <div className="section">
            <div className="card glow-purple" style={{ padding: '32px', maxWidth: '760px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                <span style={{ marginLeft: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>postwiz.co/dashboard</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {posts.map((post, i) => (
                  <div key={i} className="card" style={{ padding: '16px', borderColor: i === 0 ? 'rgba(124,58,237,0.4)' : undefined, transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{post.emoji}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: post.color, background: `${post.color}20`, padding: '3px 10px', borderRadius: '50px' }}>{post.platform}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>🕐 {post.time}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{post.text}</p>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
                  <span className="pulse" style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', display: 'inline-block' }} />
                  <span style={{ fontSize: '13px', color: '#34d399' }}>AI generating next week&apos;s posts...</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
          <div className="section">
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 className="display" style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px' }}>How PostWiz works</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px' }}>Three steps. Then it runs itself forever.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {[
                { n: '01', title: 'Tell us your business', desc: 'Name, industry, tone, what you sell. Takes 2 minutes.', color: '#7C3AED', icon: '✏️' },
                { n: '02', title: 'AI writes your posts', desc: 'We generate a full week of platform-perfect content automatically.', color: '#DB2777', icon: '🤖' },
                { n: '03', title: 'Posts go live on autopilot', desc: 'Approve with one click or let it run fully automatic. Done.', color: '#D97706', icon: '🚀' },
              ].map(s => (
                <div key={s.n} className="card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-10px', fontSize: '80px', opacity: 0.06, fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>{s.n}</div>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>{s.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: s.color, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>Step {s.n}</div>
                  <h3 className="display" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>{s.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontSize: '15px' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
          <div className="section">
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 className="display" style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px' }}>Everything included.</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px' }}>No hidden fees. No complicated setup. Just results.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[
                { icon: '🤖', title: 'AI Post Writing', desc: 'Claude AI writes posts tailored to your exact brand voice and industry niche.', color: '#7C3AED' },
                { icon: '📅', title: 'Smart Scheduling', desc: 'Automatically posts at peak engagement times for your audience.', color: '#DB2777' },
                { icon: '📱', title: 'Multi-Platform', desc: 'Instagram, Facebook, TikTok — all from one dead-simple dashboard.', color: '#059669' },
                { icon: '🏷️', title: 'Hashtag AI', desc: 'Picks the best hashtags for maximum reach and discoverability.', color: '#D97706' },
                { icon: '📊', title: 'Performance Analytics', desc: 'Clear, simple data on what\'s working and what to improve.', color: '#0891B2' },
                { icon: '✏️', title: 'One-Click Editing', desc: 'Review and tweak any AI post before it goes live. Total control.', color: '#7C3AED' },
              ].map(f => (
                <div key={f.title} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s', cursor: 'default' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = f.color + '60'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                  <div style={{ fontSize: '28px' }}>{f.icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
          <div className="section">
            <h2 className="display" style={{ fontSize: '42px', fontWeight: 800, textAlign: 'center', marginBottom: '48px' }}>Real businesses. Real results.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {[
                { name: 'Maria G.', biz: 'Pizzeria Owner, Long Island', quote: 'I was posting once a week max. Now PostWiz posts every single day and I get 3x more customers finding me on Instagram.', stars: '★★★★★', color: '#E1306C' },
                { name: 'Jason T.', biz: 'Barbershop Owner', quote: 'This thing is actually insane. I told it about my shop and it just... posts for me. Got 4 new clients this week from TikTok alone.', stars: '★★★★★', color: '#7C3AED' },
                { name: 'Sandra K.', biz: 'Boutique Owner', quote: 'Best $29 I spend every month. I used to waste hours thinking about what to post. Now I spend zero minutes on it.', stars: '★★★★★', color: '#D97706' },
              ].map(t => (
                <div key={t.name} className="card" style={{ padding: '28px' }}>
                  <div style={{ color: t.color, fontSize: '16px', marginBottom: '16px', letterSpacing: '2px' }}>{t.stars}</div>
                  <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, fontSize: '15px', marginBottom: '20px' }}>&quot;{t.quote}&quot;</p>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '2px' }}>{t.biz}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
          <div className="section">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 className="display" style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px' }}>Simple, honest pricing</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px' }}>Less than one hour of a social media manager&apos;s time.</p>
            </div>
            <div style={{ maxWidth: '440px', margin: '0 auto' }}>
              <div className="card glow-pink" style={{ padding: '40px', textAlign: 'center', border: '1px solid rgba(219,39,119,0.3)' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(219,39,119,0.2))', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', display: 'inline-block', marginBottom: '24px', textTransform: 'uppercase' }}>
                  Everything Included
                </div>
                <div className="display" style={{ fontSize: '72px', fontWeight: 800, lineHeight: 1 }}>
                  <span className="grad-text">$29</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '32px', marginTop: '8px' }}>per month</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px', textAlign: 'left' }}>
                  {['Unlimited AI-written posts', 'Auto-scheduling & publishing', 'Instagram, Facebook & TikTok', 'Smart hashtag generation', 'Post performance analytics', 'One-click post editing', 'Cancel anytime'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: 'rgba(255,255,255,0.8)' }}>
                      <span style={{ color: '#34d399', fontWeight: 700, fontSize: '16px' }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
                <button onClick={handleSubscribe} disabled={loading} className="btn-main" style={{ width: '100%', padding: '18px' }}>
                  {loading ? 'Loading...' : 'Start 7-Day Free Trial'}
                </button>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '12px' }}>7 days free · then $29/month · cancel anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px 120px', textAlign: 'center' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 className="display" style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1 }}>
              Stop wasting time on<br /><span className="grad-text">social media.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px', marginBottom: '40px' }}>
              Hundreds of small businesses already let PostWiz handle it. Join them today.
            </p>
            <button onClick={handleSubscribe} disabled={loading} className="btn-main" style={{ padding: '20px 48px', fontSize: '18px' }}>
              {loading ? 'Loading...' : 'Get Started Free — No Card Needed'}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="display" style={{ fontSize: '20px', fontWeight: 800 }}>Post<span className="grad-text">Wiz</span></div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>© 2026 PostWiz. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '13px' }}>Privacy</a>
            <a href="/terms" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '13px' }}>Terms</a>
          </div>
        </footer>

      </main>
    </>
  )
}
