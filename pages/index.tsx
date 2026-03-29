import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [billing, setBilling] = useState<'monthly'|'annual'>('monthly')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scroll, setScroll] = useState(0)
  const [wh, setWh] = useState(800)
  const [typed, setTyped] = useState('')
  const [tab, setTab] = useState(0)
  const [counts, setCounts] = useState({ posts: 0, biz: 0, hours: 0 })
  const [counted, setCounted] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSent, setContactSent] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const afRef = useRef(0)
  const pRef = useRef(0); const cRef = useRef(0); const dRef = useRef(false)
  const phrases = ['Instagram.','TikTok.','Yelp Reviews.','Google Reviews.','X (Twitter).','all of it.']

  useEffect(() => {
    const onS = () => setScroll(window.scrollY)
    const onM = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
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
      const ph = phrases[pRef.current]
      if (!dRef.current) {
        if (cRef.current < ph.length) { setTyped(ph.substring(0, cRef.current + 1)); cRef.current++; t = setTimeout(type, 70) }
        else { t = setTimeout(() => { dRef.current = true; type() }, 2000) }
      } else {
        if (cRef.current > 0) { setTyped(ph.substring(0, cRef.current - 1)); cRef.current--; t = setTimeout(type, 35) }
        else { dRef.current = false; pRef.current = (pRef.current + 1) % phrases.length; t = setTimeout(type, 300) }
      }
    }
    t = setTimeout(type, 800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = document.getElementById('stats-el')
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !counted) {
        setCounted(true)
        const tgts = { posts: 18400, biz: 1240, hours: 6200 }
        const t0 = Date.now()
        const tick = () => {
          const p = Math.min((Date.now() - t0) / 2000, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setCounts({ posts: Math.floor(ease * tgts.posts), biz: Math.floor(ease * tgts.biz), hours: Math.floor(ease * tgts.hours) })
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [counted])

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const pts: {x:number;y:number;vx:number;vy:number;r:number;h:number}[] = []
    for (let i = 0; i < 45; i++) pts.push({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:Math.random()*1.5+.4,h:Math.random()*60+240})
    const draw = () => {
      ctx.clearRect(0,0,cv.width,cv.height)
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0||p.x>cv.width)p.vx*=-1; if(p.y<0||p.y>cv.height)p.vy*=-1
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`hsla(${p.h},70%,68%,0.28)`; ctx.fill()
      })
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y); if(d<100){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`hsla(265,60%,68%,${.04*(1-d/100)})`;ctx.lineWidth=.5;ctx.stroke()}}))
      afRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(afRef.current); window.removeEventListener('resize', resize) }
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try { const r = await fetch('/api/checkout', { method: 'POST' }); const { url } = await r.json(); window.location.href = url }
    catch { alert('Something went wrong.'); setLoading(false) }
  }

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
  }

  // Scroll math — clean and reliable
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
  const pct = (start: number, end: number) => clamp01((scroll - start) / (end - start))
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  // Hero exits over first 100vh of scroll (section is 200vh)
  const heroFade = pct(wh * 0.3, wh * 1.0)

  // How it works — section starts at scroll position 200vh
  // Each step occupies ~100vh of scroll
  const H = wh * 2  // where "how" section starts in scroll
  const step1 = {
    in:  pct(H,           H + wh * 0.35),   // enters
    out: pct(H + wh * 0.65, H + wh * 1.0),  // exits
  }
  const step2 = {
    in:  pct(H + wh * 0.9,  H + wh * 1.25),
    out: pct(H + wh * 1.65, H + wh * 2.0),
  }
  const step3 = {
    in:  pct(H + wh * 1.85, H + wh * 2.2),
    out: 0,
  }

  const s1 = Math.max(0, Math.min(step1.in, 1 - step1.out))
  const s2 = Math.max(0, Math.min(step2.in, 1 - step2.out))
  const s3 = step3.in

  const activeStep = s3 > 0.3 ? 2 : s2 > 0.3 ? 1 : 0
  const howProgress = Math.max(s1 * 0.33, s2 * 0.33 + 0.33, s3 * 0.34 + 0.66)

  const plans = [
    { name: 'Starter', mo: 29, yr: 19, color: '#8b5cf6',
      features: ['3 platforms (Instagram, Facebook, TikTok)', '30 AI posts/month', 'Basic analytics', 'Email support'] },
    { name: 'Growth', mo: 59, yr: 39, color: '#ec4899', popular: true,
      features: ['All 8 platforms', 'Unlimited AI posts', 'Yelp & Google review replies', 'Photo caption AI', 'Advanced analytics', 'Priority support'] },
    { name: 'Agency', mo: 129, yr: 89, color: '#f97316',
      features: ['Everything in Growth', 'Up to 5 business profiles', 'White-label reports', 'Bulk scheduling', 'Dedicated account manager'] },
  ]

  const demoTabs = [
    { l: '🍕 Restaurant', p: `Fresh from our kitchen tonight 🍕 Come taste why we've been Long Island's favorite for 12 years. Limited tables! Book now or order online. #longislandeats #italianfood #freshdaily #foodie` },
    { l: '✂️ Barbershop', p: `New week. Fresh cut. 💈 Walk-ins welcome all day — no appointment needed. Come look sharp, feel sharp. ✂️ #barbershop #freshcut #barberlife #mensgrooming #lookgood` },
    { l: '👗 Boutique', p: `New arrivals just landed 🛍️ Spring collection is in — pieces going fast. DM to reserve before it's gone! 💫 #boutique #newcollection #shoplocal #fashion #springvibes` },
    { l: '💪 Gym', p: `Your best workout is waiting 💪 Free drop-in class today 6PM — no experience needed. 🔥 Tag someone who needs to move! #fitness #gym #workout #getfit #motivation` },
  ]

  const platforms = [
    {n:'Instagram',i:'📸',c:'#E1306C'},{n:'TikTok',i:'🎵',c:'#69C9D0'},
    {n:'Facebook',i:'📘',c:'#1877F2'},{n:'X (Twitter)',i:'𝕏',c:'#555'},
    {n:'LinkedIn',i:'💼',c:'#0A66C2'},{n:'Pinterest',i:'📌',c:'#E60023'},
    {n:'Yelp',i:'⭐',c:'#D32323'},{n:'Google Reviews',i:'🔍',c:'#4285F4'},
  ]

  const steps = [
    { icon:'✏️', num:'01', color:'#8b5cf6',
      title:'Tell us about\nyour business',
      desc:'Name, industry, brand voice, which platforms. Takes 2 minutes. Done once, remembered forever.',
      bullets:['Business name, industry & location','Your brand tone — fun, bold, professional','Which of the 8 platforms to manage','Works for any local business or industry'],
    },
    { icon:'🤖', num:'02', color:'#ec4899',
      title:'AI writes all\nyour content',
      desc:'A full week of posts for every platform, captions for your photos, and professional replies to every review — all in your exact brand voice.',
      bullets:['7 days of posts generated every week automatically','Platform-specific captions — not copy-pasted across all','Review responses drafted and sent in under 30 seconds','Approve everything, edit anything, or let it fully auto-post'],
    },
    { icon:'🚀', num:'03', color:'#10b981',
      title:'Everything goes live\nautomatically',
      desc:'Posts publish at peak engagement times. Reviews get replies within seconds. Your entire online presence runs on autopilot, every single day.',
      bullets:['AI picks peak posting times for your audience','Reviews replied to in under 30 seconds — automatically','New content generated fresh every single week','Zero daily effort required from you — ever again'],
    },
  ]

  return (
    <>
      <Head>
        <title>PostWiz – AI Social Media & Review Manager</title>
        <meta name="description" content="PostWiz manages Instagram, TikTok, Facebook, X, Yelp, Google Reviews and more — automatically using AI." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:auto}
        body{background:#f8f7ff;color:#1a1035;font-family:'Inter',sans-serif;overflow-x:hidden;cursor:none}
        .S{font-family:'Syne',sans-serif}
        #cd{position:fixed;width:10px;height:10px;background:#8b5cf6;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:multiply}
        #cr{position:fixed;width:38px;height:38px;border:1.5px solid rgba(139,92,246,.4);border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:left .09s ease,top .09s ease,width .2s,height .2s}
        body:has(button:hover) #cr,body:has(a:hover) #cr{width:52px;height:52px;border-color:rgba(236,72,153,.6)}
        .gt{background:linear-gradient(135deg,#8b5cf6,#ec4899,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .gtd{background:linear-gradient(135deg,#7c3aed,#db2777);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 60px;display:flex;align-items:center;justify-content:space-between;transition:all .35s}
        .nav.on{background:rgba(248,247,255,.96);backdrop-filter:blur(20px);padding:14px 60px;border-bottom:1px solid rgba(139,92,246,.08);box-shadow:0 2px 20px rgba(139,92,246,.06)}
        .nl{color:rgba(26,16,53,.5);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s;cursor:none}
        .nl:hover{color:#8b5cf6}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter',sans-serif;font-weight:600;cursor:none;border:none;transition:all .25s}
        .bp{background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;padding:14px 32px;border-radius:50px;font-size:15px;box-shadow:0 8px 28px rgba(139,92,246,.28)}
        .bp:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(139,92,246,.4)}
        .bp:disabled{opacity:.6;transform:none}
        .bw{background:#fff;color:#1a1035;border:1.5px solid rgba(0,0,0,.1);padding:13px 28px;border-radius:50px;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,.05)}
        .bw:hover{box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-1px)}
        .card{background:#fff;border-radius:24px;border:1px solid rgba(139,92,246,.07);box-shadow:0 4px 24px rgba(139,92,246,.05)}
        .slabel{font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#8b5cf6;display:block;margin-bottom:14px}
        .tab-btn{padding:10px 20px;border-radius:50px;border:1.5px solid rgba(139,92,246,.14);background:transparent;color:rgba(26,16,53,.45);font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:none;transition:all .25s}
        .tab-btn.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent;color:#fff;box-shadow:0 6px 20px rgba(139,92,246,.26)}
        .tab-btn:hover:not(.on){border-color:rgba(139,92,246,.28);color:#8b5cf6}
        .inp{width:100%;background:#fff;border:1.5px solid rgba(139,92,246,.15);border-radius:12px;padding:14px 18px;font-family:'Inter',sans-serif;font-size:15px;color:#1a1035;outline:none;transition:border-color .2s}
        .inp:focus{border-color:#8b5cf6}
        .inp::placeholder{color:rgba(26,16,53,.3)}
        .toggle-track{width:52px;height:28px;background:rgba(139,92,246,.12);border:1.5px solid rgba(139,92,246,.18);border-radius:14px;position:relative;cursor:pointer;transition:background .3s}
        .toggle-track.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent}
        .toggle-thumb{position:absolute;top:3px;left:3px;width:20px;height:20px;background:#fff;border-radius:50%;transition:transform .3s;box-shadow:0 2px 8px rgba(0,0,0,.15)}
        .toggle-track.on .toggle-thumb{transform:translateX(24px)}
        .pcard{background:#fff;border-radius:28px;border:1.5px solid rgba(139,92,246,.08);box-shadow:0 4px 24px rgba(139,92,246,.06);padding:36px 32px;position:relative;overflow:hidden;transition:all .3s}
        .pcard:hover{transform:translateY(-8px);box-shadow:0 24px 70px rgba(139,92,246,.12)}
        .pcard.pop{border-color:rgba(236,72,153,.22);box-shadow:0 8px 40px rgba(236,72,153,.1)}
        .notif{background:rgba(255,255,255,.9);border:1px solid rgba(139,92,246,.12);border-radius:16px;padding:14px 18px;backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(139,92,246,.08)}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes floatb{0%,100%{transform:translateY(-7px) rotate(-1.5deg)}50%{transform:translateY(7px) rotate(-1.5deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,-40px)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,30px)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.82)}}
        @keyframes slide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes phone{0%,100%{transform:translateY(0) rotate(2deg)}50%{transform:translateY(-14px) rotate(2deg)}}
        .fa{animation:float 5s ease-in-out infinite}
        .fb{animation:floatb 4s ease-in-out infinite 1.2s}
        .pd{animation:pulse 2s ease-in-out infinite}
        .ph{animation:phone 6s ease-in-out infinite}
        .cur{display:inline-block;width:3px;height:.85em;background:#ec4899;margin-left:3px;border-radius:2px;animation:blink 1s step-end infinite;vertical-align:text-bottom}
        @media(max-width:768px){
          body{cursor:auto}#cd,#cr{display:none}
          .nav{padding:16px 20px}.nav.on{padding:12px 20px}
          .desk-links{display:none!important}
          .hero-cards{display:none!important}
          .steps-desk{display:none!important}
          .steps-mob{display:block!important}
          .pg{grid-template-columns:1fr!important}
          .tg{grid-template-columns:1fr!important}
          .fg{grid-template-columns:1fr!important}
          .platg{grid-template-columns:repeat(2,1fr)!important}
          .statg{grid-template-columns:1fr 1fr!important}
          .phone-row{flex-direction:column!important;text-align:center}
          .dash-grid{grid-template-columns:1fr!important}
        }
        .steps-mob{display:none}
      `}</style>

      <div id="cd" style={{left:mousePos.x,top:mousePos.y}} />
      <div id="cr" style={{left:mousePos.x,top:mousePos.y}} />
      <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',opacity:.16}} />

      {/* NAV */}
      <nav className={`nav ${scroll>60?'on':''}`}>
        <div className="S" style={{fontSize:24,fontWeight:800,color:'#1a1035'}}>Post<span className="gtd">Wiz</span></div>
        <div className="desk-links" style={{display:'flex',alignItems:'center',gap:36}}>
          <a href="#how-anchor" className="nl">How it works</a>
          <a href="#platforms" className="nl">Platforms</a>
          <a href="#pricing" className="nl">Pricing</a>
          <a href="#contact" className="nl">Contact</a>
          <a href="/studio" className="nl" style={{color:'#8b5cf6',fontWeight:600}}>🎨 Studio</a>
          <button onClick={subscribe} className="btn bp" style={{padding:'11px 26px',fontSize:14}}>Start Free →</button>
        </div>
        <button onClick={()=>setMobileNav(!mobileNav)} style={{display:'none',background:'none',border:'none',fontSize:24,cursor:'pointer',color:'#1a1035'}} className="mob-menu">☰</button>
      </nav>

      {mobileNav&&(
        <div style={{position:'fixed',top:60,left:0,right:0,background:'rgba(248,247,255,.98)',backdropFilter:'blur(20px)',zIndex:99,padding:'20px',borderBottom:'1px solid rgba(139,92,246,.1)',display:'flex',flexDirection:'column',gap:16}}>
          {['How it works','Platforms','Pricing','Contact'].map(l=>(
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} onClick={()=>setMobileNav(false)} style={{color:'rgba(26,16,53,.7)',textDecoration:'none',fontSize:16,fontWeight:500,paddingBottom:12,borderBottom:'1px solid rgba(139,92,246,.06)'}}>{l}</a>
          ))}
          <button onClick={()=>{setMobileNav(false);subscribe()}} className="btn bp" style={{width:'100%',padding:14,fontSize:15}}>Start 7-Day Free Trial →</button>
        </div>
      )}

      <main style={{position:'relative',zIndex:1}}>

        {/* ═══ HERO — 200vh sticky ═══ */}
        <section style={{height:'200vh',position:'relative'}}>
          <div style={{position:'sticky',top:0,height:'100vh',overflow:'hidden',background:'linear-gradient(160deg,#ede9ff 0%,#fdf4ff 45%,#fff5f8 100%)'}}>
            <div style={{position:'absolute',width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.16) 0%,transparent 65%)',top:'-20%',left:'-15%',animation:'orb1 18s ease-in-out infinite',pointerEvents:'none'}} />
            <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,.12) 0%,transparent 65%)',top:'10%',right:'-12%',animation:'orb2 22s ease-in-out infinite',pointerEvents:'none'}} />
            <div style={{position:'absolute',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(249,115,22,.09) 0%,transparent 65%)',bottom:'-10%',left:'35%',animation:'orb1 14s ease-in-out infinite 3s',pointerEvents:'none'}} />

            {/* Floating cards */}
            <div className="hero-cards">
              <div className="notif fa" style={{position:'absolute',left:'4%',top:'30%',width:210,opacity:Math.max(0,1-heroFade*2),transform:`translateY(${-heroFade*40}px)`}}>
                <div style={{fontSize:11,color:'rgba(26,16,53,.4)',marginBottom:6}}>📸 Posted to Instagram</div>
                <div style={{fontSize:13,fontWeight:600,color:'#1a1035',marginBottom:8}}>Your daily special is live! ✨</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{height:4,flex:1,borderRadius:2,background:'rgba(139,92,246,.1)',overflow:'hidden'}}><div style={{height:'100%',width:'73%',background:'linear-gradient(90deg,#8b5cf6,#ec4899)',borderRadius:2}} /></div>
                  <span style={{fontSize:11,color:'#8b5cf6'}}>↑ 247 likes</span>
                </div>
              </div>
              <div className="notif fb" style={{position:'absolute',right:'4%',top:'28%',width:215,opacity:Math.max(0,1-heroFade*2),transform:`translateY(${-heroFade*28}px)`}}>
                <div style={{fontSize:11,color:'rgba(26,16,53,.4)',marginBottom:6}}>⭐ Yelp Review Replied</div>
                <div style={{fontSize:13,fontWeight:500,color:'#1a1035',lineHeight:1.5}}>AI responded in 28 seconds</div>
                <div style={{fontSize:11,color:'#10b981',marginTop:6}}>✓ Review management active</div>
              </div>
              <div className="notif fa" style={{position:'absolute',left:'6%',bottom:'24%',width:190,animationDelay:'2s',opacity:Math.max(0,1-heroFade*2),transform:`translateY(${heroFade*28}px)`}}>
                <div style={{fontSize:11,color:'#10b981',display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'#10b981',display:'inline-block'}} />New customer</div>
                <div style={{fontSize:13,color:'#1a1035'}}>Found you via Google Review</div>
              </div>
              <div className="notif fb" style={{position:'absolute',right:'5%',bottom:'26%',width:210,opacity:Math.max(0,1-heroFade*2),transform:`translateY(${heroFade*22}px)`}}>
                <div style={{fontSize:11,color:'rgba(26,16,53,.4)',marginBottom:8}}>📊 This week — all platforms</div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  {[{v:'21',l:'posts',c:'#ec4899'},{v:'4.8k',l:'reach',c:'#8b5cf6'},{v:'+12',l:'reviews',c:'#10b981'}].map(s=>(
                    <div key={s.l} style={{textAlign:'center'}}>
                      <div style={{fontSize:20,fontWeight:700,color:s.c,fontFamily:'Syne,sans-serif'}}>{s.v}</div>
                      <div style={{fontSize:10,color:'rgba(26,16,53,.35)'}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero text */}
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px',opacity:Math.max(0,1-heroFade*1.4),transform:`scale(${lerp(1,.92,heroFade)}) translateY(${-heroFade*70}px)`}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:10,background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.18)',borderRadius:50,padding:'9px 22px',marginBottom:32}}>
                <span className="pd" style={{width:7,height:7,borderRadius:'50%',background:'#8b5cf6',display:'inline-block'}} />
                <span style={{fontSize:13,fontWeight:500,color:'#7c3aed'}}>8 platforms · Social + Reviews · AI-powered</span>
              </div>
              <h1 className="S" style={{fontSize:'clamp(48px,8vw,100px)',fontWeight:800,lineHeight:.98,letterSpacing:'-4px',color:'#1a1035',marginBottom:24}}>
                AI manages<br />your <span className="gt">{typed}<span className="cur"/></span>
              </h1>
              <p style={{fontSize:19,color:'rgba(26,16,53,.45)',maxWidth:540,margin:'0 auto 44px',lineHeight:1.8,fontWeight:300}}>
                PostWiz handles Instagram, TikTok, Facebook, X, LinkedIn, Pinterest, Yelp and Google Reviews — fully automated, every day.
              </p>
              <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:16}}>
                <button onClick={subscribe} disabled={loading} className="btn bp" style={{padding:'18px 48px',fontSize:17}}>{loading?'Loading...':'Start 7-Day Free Trial →'}</button>
                <button className="btn bw" onClick={()=>window.scrollTo({top:wh*2.1,behavior:'smooth'})}>See how it works</button>
              </div>
              <p style={{fontSize:13,color:'rgba(26,16,53,.25)'}}>No credit card · 2 min setup · Cancel anytime</p>
              <div style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,opacity:Math.max(0,1-heroFade*5)}}>
                <span style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,16,53,.3)'}}>Scroll to explore</span>
                <div style={{width:1,height:40,background:'linear-gradient(to bottom,rgba(139,92,246,.4),transparent)'}} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ MARQUEE ═══ */}
        <div style={{background:'#fff',borderTop:'1px solid rgba(139,92,246,.07)',borderBottom:'1px solid rgba(139,92,246,.07)',padding:'15px 0',overflow:'hidden'}}>
          <div style={{display:'flex',animation:'mq 20s linear infinite',whiteSpace:'nowrap'}}>
            {['Instagram','TikTok','Facebook','X Twitter','Yelp Reviews','Google Reviews','LinkedIn','Pinterest','AI Writing','Auto-Schedule','Review Management','Analytics',
              'Instagram','TikTok','Facebook','X Twitter','Yelp Reviews','Google Reviews','LinkedIn','Pinterest','AI Writing','Auto-Schedule','Review Management','Analytics'
            ].map((t,i)=>(
              <span key={i} style={{padding:'0 28px',fontSize:13,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:['#8b5cf6','#ec4899','#f97316','#10b981','rgba(26,16,53,.18)'][i%5]}}>✦ {t}</span>
            ))}
          </div>
        </div>

        {/* ═══ HOW IT WORKS — scroll storytelling ═══ */}
        <div id="how-anchor" style={{height:0}} />

        {/* Desktop: 300vh sticky scroll */}
        <section className="steps-desk" style={{height:'300vh',position:'relative'}}>
          <div style={{position:'sticky',top:0,height:'100vh',overflow:'hidden',background:'linear-gradient(160deg,#faf9ff,#f5f3ff,#fff8fe)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{position:'absolute',top:44,textAlign:'center',width:'100%'}}>
              <span className="slabel" style={{display:'block',textAlign:'center'}}>How it works</span>
            </div>

            {steps.map((step, i) => {
              const op = i===0?s1:i===1?s2:s3
              const ein = i===0?step1.in:i===1?step2.in:step3.in
              const ea = Math.min(1, ein * 2.8)
              const eout = i===0?step1.out:i===1?step2.out:0
              const ey = lerp(64, 0, ea)
              const er = lerp(i%2===0 ? 5 : -5, 0, ea)
              const es = lerp(0.88, 1, ea)
              const xy = lerp(0, -100, eout)
              return (
                <div key={i} style={{position:'absolute',width:'90%',maxWidth:920,zIndex:2,opacity:op,pointerEvents:op>.05?'auto':'none',transform:`translateY(${ey+xy}px) rotate(${er*(1-eout)}deg) scale(${es})`,display:'flex',alignItems:'center',gap:64,flexWrap:'wrap',justifyContent:'center'}}>

                  {/* LEFT — text + bullets */}
                  <div style={{flex:'1',minWidth:280,maxWidth:400,textAlign:'left'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:12,marginBottom:20}}>
                      <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                        <div style={{position:'absolute',width:80,height:80,borderRadius:'50%',background:step.color+'12',animation:'pulse 3s ease-out infinite',animationDelay:`${i*.5}s`}} />
                        <div style={{width:60,height:60,borderRadius:'50%',background:`linear-gradient(135deg,${step.color}22,${step.color}08)`,border:`2px solid ${step.color}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:`0 0 40px ${step.color}18`}}>{step.icon}</div>
                      </div>
                      <div style={{fontSize:11,fontWeight:700,letterSpacing:4,textTransform:'uppercase',color:step.color}}>Step {step.num}</div>
                    </div>
                    <h2 className="S" style={{fontSize:'clamp(30px,4vw,48px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.05,marginBottom:14,whiteSpace:'pre-line'}}>{step.title}</h2>
                    <p style={{fontSize:16,color:'rgba(26,16,53,.48)',lineHeight:1.8,marginBottom:20,fontWeight:300}}>{step.desc}</p>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {(step as any).bullets.map((b: string, bi: number) => (
                        <div key={bi} style={{display:'flex',alignItems:'flex-start',gap:10}}>
                          <div style={{width:20,height:20,borderRadius:'50%',background:step.color+'14',border:`1px solid ${step.color}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                            <span style={{color:step.color,fontSize:10,fontWeight:700}}>✓</span>
                          </div>
                          <span style={{fontSize:14,color:'rgba(26,16,53,.6)',lineHeight:1.55}}>{b}</span>
                        </div>
                      ))}
                    </div>
                    {i===2&&<button onClick={subscribe} className="btn bp" style={{marginTop:28,padding:'14px 36px',fontSize:15}}>Get Started Free →</button>}
                  </div>

                  {/* RIGHT — animated visual */}
                  <div style={{flexShrink:0,width:300}}>
                    {i===0&&(
                      /* Step 1 visual: onboarding form */
                      <div style={{background:'#fff',borderRadius:20,padding:'24px',boxShadow:'0 16px 60px rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.1)'}}>
                        <div style={{fontSize:13,fontWeight:700,color:'#1a1035',marginBottom:16,fontFamily:'Syne,sans-serif'}}>Tell us about your business</div>
                        {[
                          {label:'Business Name',val:"Mario's Pizza",done:true},
                          {label:'Industry',val:'Restaurant',done:true},
                          {label:'Brand Tone',val:'Friendly & Fun',done:true},
                          {label:'Platforms',val:'',done:false},
                        ].map((field,fi)=>(
                          <div key={fi} style={{marginBottom:12}}>
                            <div style={{fontSize:11,color:'rgba(26,16,53,.45)',marginBottom:4,fontWeight:500}}>{field.label}</div>
                            {field.done ? (
                              <div style={{background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.15)',borderRadius:8,padding:'8px 12px',fontSize:13,color:'#1a1035',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                {field.val}<span style={{color:'#10b981',fontSize:12}}>✓</span>
                              </div>
                            ) : (
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                {['📸','🎵','📘','⭐','🔍'].map((ic,ii)=>(
                                  <div key={ii} style={{width:32,height:32,borderRadius:8,background:ii<3?'linear-gradient(135deg,#8b5cf6,#ec4899)':'rgba(139,92,246,.08)',border:ii<3?'none':'1px solid rgba(139,92,246,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{ic}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        <div style={{background:'linear-gradient(135deg,#8b5cf6,#ec4899)',borderRadius:10,padding:'10px',textAlign:'center' as const,fontSize:13,color:'#fff',fontWeight:600,marginTop:8}}>Save & Continue →</div>
                      </div>
                    )}
                    {i===1&&(
                      /* Step 2 visual: AI writing posts */
                      <div style={{background:'#fff',borderRadius:20,padding:'20px',boxShadow:'0 16px 60px rgba(236,72,153,.1)',border:'1px solid rgba(236,72,153,.1)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,paddingBottom:12,borderBottom:'1px solid rgba(0,0,0,.06)'}}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#8b5cf6,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>🤖</div>
                          <div><div style={{fontSize:12,fontWeight:600,color:'#1a1035'}}>PostWiz AI</div><div style={{fontSize:10,color:'#10b981'}}>● Generating content...</div></div>
                        </div>
                        {[
                          {p:'📸',n:'Instagram',txt:"Fresh from our kitchen tonight 🍕 Come taste why we've been a favorite! #longislandeats #foodie",done:true,c:'#E1306C'},
                          {p:'🎵',n:'TikTok',txt:'POV: You just tried our garlic knots 🤯 Come see what the hype is about!',done:true,c:'#69C9D0'},
                          {p:'⭐',n:'Yelp Reply',txt:'Thank you Sarah! So glad you loved the garlic knots 🙏 Can't wait to see you again!',done:false,c:'#D32323'},
                        ].map((post,pi)=>(
                          <div key={pi} style={{marginBottom:10,padding:'10px 12px',background:post.done?'rgba(139,92,246,.04)':'rgba(236,72,153,.04)',borderRadius:12,border:`1px solid ${post.done?'rgba(139,92,246,.1)':'rgba(236,72,153,.1)'}`}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                              <span style={{fontSize:12}}>{post.p}</span>
                              <span style={{fontSize:10,fontWeight:600,color:post.c}}>{post.n}</span>
                              {post.done ? <span style={{marginLeft:'auto',fontSize:10,color:'#10b981',fontWeight:600}}>✓ Done</span> : <span style={{marginLeft:'auto',fontSize:10,color:'#ec4899',animation:'pulse 1.5s ease-in-out infinite'}}>Writing...</span>}
                            </div>
                            <p style={{fontSize:10,color:'rgba(26,16,53,.6)',lineHeight:1.5}}>{post.txt}{!post.done&&<span style={{animation:'blink 1s step-end infinite',marginLeft:2}}>|</span>}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {i===2&&(
                      /* Step 3 visual: posts going live */
                      <div style={{background:'#fff',borderRadius:20,padding:'20px',boxShadow:'0 16px 60px rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.1)'}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#1a1035',marginBottom:14,fontFamily:'Syne,sans-serif',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span>This week</span>
                          <span style={{fontSize:10,background:'rgba(16,185,129,.1)',color:'#10b981',padding:'3px 8px',borderRadius:50,fontWeight:600}}>● All systems live</span>
                        </div>
                        {[
                          {t:'Mon 9:00 AM',p:'📸 Instagram',txt:'Daily special post',status:'Posted',c:'#10b981'},
                          {t:'Mon 3:00 PM',p:'🎵 TikTok',txt:'Behind the scenes reel',status:'Posted',c:'#10b981'},
                          {t:'Tue 9:00 AM',p:'📘 Facebook',txt:'Weekly menu spotlight',status:'Scheduled',c:'#8b5cf6'},
                          {t:'Tue 11:32 AM',p:'⭐ Yelp',txt:'Review reply sent',status:'Auto-replied',c:'#f97316'},
                        ].map((item,ii)=>(
                          <div key={ii} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:ii<3?'1px solid rgba(0,0,0,.05)':'none'}}>
                            <div style={{flexShrink:0}}>
                              <div style={{fontSize:9,color:'rgba(26,16,53,.35)',marginBottom:1}}>{item.t}</div>
                              <div style={{fontSize:11,fontWeight:600,color:'#1a1035'}}>{item.p}</div>
                            </div>
                            <div style={{flex:1,fontSize:10,color:'rgba(26,16,53,.5)'}}>{item.txt}</div>
                            <span style={{fontSize:10,fontWeight:600,color:item.c,background:item.c+'12',padding:'2px 8px',borderRadius:50,flexShrink:0}}>{item.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Step dots */}
            <div style={{position:'absolute',bottom:44,display:'flex',alignItems:'center',gap:8}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{height:8,borderRadius:4,width:activeStep===i?28:8,background:activeStep===i?'linear-gradient(90deg,#8b5cf6,#ec4899)':'rgba(139,92,246,.2)',transition:'all .4s cubic-bezier(.16,1,.3,1)'}} />
              ))}
            </div>

            {/* Progress bar */}
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(139,92,246,.06)'}}>
              <div style={{height:'100%',width:`${howProgress*100}%`,background:'linear-gradient(90deg,#8b5cf6,#ec4899)',borderRadius:'0 2px 2px 0',transition:'width .08s linear'}} />
            </div>
          </div>
        </section>

        {/* Mobile steps */}
        <section className="steps-mob" style={{background:'linear-gradient(160deg,#faf9ff,#f5f3ff)',padding:'80px 20px'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <span className="slabel">How it works</span>
            <h2 className="S" style={{fontSize:36,fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.05}}>Three steps to <span className="gtd">autopilot.</span></h2>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:480,margin:'0 auto'}}>
            {steps.map((s,i)=>(
              <div key={i} className="card" style={{padding:'28px 24px'}}>
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
                  <div style={{width:52,height:52,borderRadius:'50%',background:`linear-gradient(135deg,${s.color}18,${s.color}08)`,border:`1.5px solid ${s.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{s.icon}</div>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:s.color}}>Step {s.num}</div>
                </div>
                <h3 className="S" style={{fontSize:22,fontWeight:700,color:'#1a1035',marginBottom:8,whiteSpace:'pre-line',letterSpacing:'-.5px'}}>{s.title}</h3>
                <p style={{fontSize:14,color:'rgba(26,16,53,.5)',lineHeight:1.75}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section id="stats-el" style={{background:'#fff',padding:'100px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:64}}>
              <span className="slabel">Results</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.1}}>PostWiz works while<br /><span className="gtd">you run your business.</span></h2>
            </div>
            <div className="statg" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
              {[{num:counts.posts.toLocaleString()+'+',label:'Posts Generated',sub:'Across all platforms',color:'#8b5cf6',icon:'✍️'},
                {num:counts.biz.toLocaleString()+'+',label:'Active Businesses',sub:'Every industry',color:'#ec4899',icon:'🏢'},
                {num:counts.hours.toLocaleString()+'h',label:'Hours Saved',sub:'Time back to owners',color:'#f97316',icon:'⚡'}
              ].map(s=>(
                <div key={s.label} className="card" style={{padding:'40px 32px',textAlign:'center',transition:'all .3s'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px)';el.style.boxShadow=`0 20px 60px rgba(0,0,0,.07),0 0 0 2px ${s.color}12`}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='none';el.style.boxShadow=''}}>
                  <div style={{fontSize:40,marginBottom:12}}>{s.icon}</div>
                  <div className="S" style={{fontSize:52,fontWeight:800,color:s.color,lineHeight:1,marginBottom:8}}>{s.num}</div>
                  <div style={{fontSize:16,fontWeight:600,color:'#1a1035',marginBottom:4}}>{s.label}</div>
                  <div style={{fontSize:13,color:'rgba(26,16,53,.4)'}}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ DASHBOARD SNIPPET ═══ */}
        <section style={{background:'linear-gradient(160deg,#faf9ff,#f0eeff)',padding:'120px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div className="phone-row" style={{display:'flex',alignItems:'center',gap:80,flexWrap:'wrap'}}>
              {/* Phone */}
              <div className="ph" style={{flexShrink:0,position:'relative'}}>
                <div style={{width:280,height:580,borderRadius:44,background:'#1a1035',padding:12,boxShadow:'0 40px 100px rgba(26,16,53,.22),0 0 0 1px rgba(255,255,255,.07)',position:'relative'}}>
                  <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',width:80,height:24,background:'#1a1035',borderRadius:12,zIndex:10}} />
                  <div style={{height:'100%',borderRadius:34,background:'linear-gradient(160deg,#f8f7ff,#fff5fb)',overflow:'hidden'}}>
                    <div style={{padding:'48px 14px 14px'}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#1a1035',marginBottom:14,fontFamily:'Syne,sans-serif',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span>PostWiz</span>
                        <span style={{fontSize:10,background:'rgba(139,92,246,.1)',color:'#8b5cf6',padding:'3px 8px',borderRadius:50,fontWeight:600}}>3 pending</span>
                      </div>
                      {[{p:'📸',n:'Instagram',t:'9:00 AM',txt:"Fresh from our kitchen tonight 🍕 Come taste why we've been a favorite for 12 years! #longislandeats",c:'#E1306C',bg:'rgba(225,48,108,.08)'},
                        {p:'🎵',n:'TikTok',t:'3:00 PM',txt:"POV: You just tried our garlic knots 🤯 Come see what everyone's talking about!",c:'#69C9D0',bg:'rgba(105,201,208,.08)'}
                      ].map((card,i)=>(
                        <div key={i} style={{background:'#fff',borderRadius:14,padding:'12px',marginBottom:10,boxShadow:'0 4px 16px rgba(139,92,246,.07)',border:'1px solid rgba(139,92,246,.06)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:7}}>
                            <span style={{fontSize:13}}>{card.p}</span>
                            <span style={{fontSize:10,fontWeight:600,color:card.c,background:card.bg,padding:'2px 7px',borderRadius:50}}>{card.n}</span>
                            <span style={{fontSize:10,color:'rgba(26,16,53,.3)',marginLeft:'auto'}}>{card.t}</span>
                          </div>
                          <p style={{fontSize:10,color:'rgba(26,16,53,.65)',lineHeight:1.55,marginBottom:8}}>{card.txt}</p>
                          <div style={{display:'flex',gap:5}}>
                            <div style={{flex:1,background:'linear-gradient(135deg,#8b5cf6,#ec4899)',borderRadius:7,padding:'5px',textAlign:'center' as const,fontSize:9,color:'#fff',fontWeight:700}}>✓ Approve</div>
                            <div style={{background:'rgba(139,92,246,.08)',borderRadius:7,padding:'5px 8px',fontSize:9,color:'#8b5cf6',fontWeight:600}}>Edit</div>
                          </div>
                        </div>
                      ))}
                      <div style={{background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.14)',borderRadius:12,padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:13}}>⭐</span>
                        <div><div style={{fontSize:10,fontWeight:600,color:'#10b981'}}>Yelp Review Replied</div><div style={{fontSize:9,color:'rgba(26,16,53,.4)'}}>AI responded · 28 sec ago</div></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{position:'absolute',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.18) 0%,transparent 70%)',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:-1,filter:'blur(20px)'}} />
              </div>

              {/* Text */}
              <div style={{flex:1,minWidth:300}}>
                <span className="slabel">The Dashboard</span>
                <h2 className="S" style={{fontSize:'clamp(32px,4vw,50px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.05,marginBottom:20}}>
                  One dashboard.<br /><span className="gt">Total control.</span>
                </h2>
                <p style={{fontSize:17,color:'rgba(26,16,53,.45)',lineHeight:1.8,marginBottom:28,fontWeight:300}}>
                  See all your upcoming posts across every platform, approve or edit with one click, and watch review replies go out automatically. Clean, simple, and built for busy business owners — not marketers.
                </p>
                <div className="dash-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:32}}>
                  {[{icon:'📋',t:'Unified post queue',d:'All platforms in one view'},
                    {icon:'✅',t:'One-click approval',d:'Or fully automatic'},
                    {icon:'⭐',t:'Review management',d:'Yelp & Google handled'},
                    {icon:'📊',t:'Live analytics',d:'See what\'s working'},
                  ].map(f=>(
                    <div key={f.t} style={{background:'rgba(139,92,246,.04)',border:'1px solid rgba(139,92,246,.1)',borderRadius:14,padding:'14px 16px'}}>
                      <div style={{fontSize:20,marginBottom:6}}>{f.icon}</div>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1035',marginBottom:2}}>{f.t}</div>
                      <div style={{fontSize:12,color:'rgba(26,16,53,.4)'}}>{f.d}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  <button onClick={subscribe} className="btn bp">Try Free for 7 Days →</button>
                  <a href="/dashboard" style={{textDecoration:'none'}} className="btn bw">View Dashboard</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PLATFORMS ═══ */}
        <section id="platforms" style={{background:'#fff',padding:'120px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:64}}>
              <span className="slabel">All Platforms</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4.5vw,56px)',fontWeight:800,color:'#1a1035',letterSpacing:'-2px',lineHeight:1.05,marginBottom:16}}>One tool. <span className="gt">Every platform.</span></h2>
              <p style={{fontSize:17,color:'rgba(26,16,53,.45)',maxWidth:460,margin:'0 auto'}}>Social media posting AND review management — everything your online presence needs.</p>
            </div>
            <div className="platg" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:48}}>
              {platforms.map(p=>(
                <div key={p.n} className="card" style={{padding:'24px 16px',textAlign:'center',transition:'all .3s',cursor:'default'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px)';el.style.borderColor=p.c+'28';el.style.boxShadow=`0 16px 48px ${p.c}10`}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='none';el.style.borderColor='rgba(139,92,246,.07)';el.style.boxShadow=''}}>
                  <div style={{fontSize:30,marginBottom:8}}>{p.i}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#1a1035',marginBottom:6}}>{p.n}</div>
                  <div style={{width:20,height:3,borderRadius:2,background:p.c,margin:'0 auto',opacity:.5}} />
                </div>
              ))}
            </div>
            <div className="card" style={{padding:'32px',maxWidth:660,margin:'0 auto'}}>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#8b5cf6',marginBottom:16}}>⭐ Example: AI-Generated Yelp Response</div>
              <div style={{background:'rgba(139,92,246,.04)',border:'1px solid rgba(139,92,246,.1)',borderRadius:12,padding:'14px 18px',marginBottom:14,fontSize:14,color:'rgba(26,16,53,.55)',fontStyle:'italic'}}>&ldquo;Amazing food! Garlic knots were incredible. Will definitely be back!&rdquo; — Sarah K. ★★★★★</div>
              <p style={{fontSize:15,color:'rgba(26,16,53,.7)',lineHeight:1.75}}>Thank you so much Sarah! 🙏 Our garlic knots are a fan favorite — so glad they hit the spot! Can&apos;t wait to welcome you back. Next time ask about our seasonal special!</p>
              <div style={{marginTop:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                <span style={{fontSize:12,background:'rgba(16,185,129,.07)',border:'1px solid rgba(16,185,129,.18)',color:'#10b981',padding:'4px 12px',borderRadius:50,fontWeight:600}}>✓ Auto-posted to Yelp</span>
                <span style={{fontSize:12,color:'rgba(26,16,53,.3)'}}>Responded in 28 seconds</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ LIVE DEMO ═══ */}
        <section style={{background:'linear-gradient(160deg,#faf9ff,#f5f3ff)',padding:'120px 40px'}}>
          <div style={{maxWidth:860,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:48}}>
              <span className="slabel">Live Demo</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4vw,50px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',marginBottom:14}}>See what AI writes <span className="gt">for you.</span></h2>
              <p style={{fontSize:16,color:'rgba(26,16,53,.45)',maxWidth:380,margin:'0 auto'}}>Click your industry and watch AI generate a real post.</p>
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:28,flexWrap:'wrap'}}>
              {demoTabs.map((t,i)=><button key={i} onClick={()=>setTab(i)} className={`tab-btn ${tab===i?'on':''}`}>{t.l}</button>)}
            </div>
            <div className="card" style={{padding:'32px',maxWidth:640,margin:'0 auto',animation:'slide .3s ease'}} key={tab}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,paddingBottom:16,borderBottom:'1px solid rgba(139,92,246,.07)'}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#8b5cf6,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>🤖</div>
                <div><div style={{fontSize:14,fontWeight:600,color:'#1a1035'}}>PostWiz AI</div><div style={{fontSize:12,color:'rgba(26,16,53,.35)'}}>Generated just now · Instagram</div></div>
                <div style={{marginLeft:'auto',background:'rgba(139,92,246,.07)',border:'1px solid rgba(139,92,246,.14)',color:'#8b5cf6',fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:50}}>📸 Ready</div>
              </div>
              <p style={{fontSize:15,lineHeight:1.8,color:'rgba(26,16,53,.7)',marginBottom:20}}>{demoTabs[tab].p}</p>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button style={{background:'linear-gradient(135deg,#8b5cf6,#ec4899)',border:'none',color:'#fff',padding:'10px 20px',borderRadius:10,fontFamily:'Inter,sans-serif',fontWeight:600,fontSize:14,cursor:'pointer',boxShadow:'0 6px 20px rgba(139,92,246,.22)'}}>✓ Approve & Schedule</button>
                <button style={{background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.14)',color:'#8b5cf6',padding:'10px 16px',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:14,cursor:'pointer'}}>✏️ Edit</button>
                <button style={{background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.14)',color:'#8b5cf6',padding:'10px 16px',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:14,cursor:'pointer'}}>↻ Regenerate</button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section style={{background:'#fff',padding:'120px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:64}}>
              <span className="slabel">Features</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.1}}>Everything included.<br /><span className="gtd">Zero extra fees.</span></h2>
            </div>
            <div className="fg" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              {[{icon:'🤖',title:'AI Post Writing',desc:'Platform-perfect posts in your brand voice for all 8 platforms, generated automatically every week.',color:'#8b5cf6'},
                {icon:'📸',title:'Photo Caption AI',desc:'Upload photos and AI analyzes them, writing tailored captions for every platform instantly.',color:'#ec4899'},
                {icon:'📅',title:'Smart Scheduling',desc:'Posts go live at peak engagement times for your specific audience. Zero manual scheduling.',color:'#f97316'},
                {icon:'⭐',title:'Review Management',desc:'AI responds to Yelp and Google reviews professionally within seconds. Never miss a review.',color:'#10b981'},
                {icon:'📊',title:'Analytics Dashboard',desc:'Clear data showing what\'s working across all platforms. Understand your audience at a glance.',color:'#0891b2'},
                {icon:'🎨',title:'Content Studio',desc:'Upload photos in bulk, AI generates captions for all platforms and queues everything automatically.',color:'#7c3aed'},
              ].map(f=>(
                <div key={f.title} className="card" style={{padding:'30px 26px',transition:'all .3s',cursor:'default'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px)';el.style.borderColor=f.color+'22';el.style.boxShadow=`0 20px 60px ${f.color}08`}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='none';el.style.borderColor='rgba(139,92,246,.07)';el.style.boxShadow=''}}>
                  <div style={{width:50,height:50,borderRadius:14,background:f.color+'0e',border:`1px solid ${f.color}16`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14}}>{f.icon}</div>
                  <h3 className="S" style={{fontSize:17,fontWeight:700,color:'#1a1035',marginBottom:8,letterSpacing:'-.3px'}}>{f.title}</h3>
                  <p style={{fontSize:14,color:'rgba(26,16,53,.48)',lineHeight:1.8}}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SOCIAL PROOF — no fake reviews ═══ */}
        <section style={{background:'linear-gradient(160deg,#faf9ff,#f5f3ff)',padding:'80px 40px'}}>
          <div style={{maxWidth:1000,margin:'0 auto',textAlign:'center'}}>
            <p style={{fontSize:13,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'rgba(26,16,53,.35)',marginBottom:40}}>Built for local businesses who have better things to do</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24,marginBottom:60}} className="statg">
              {[
                {icon:'🏪',stat:'Any Industry',sub:'Restaurants, gyms, salons, boutiques, barbershops & more'},
                {icon:'⚡',stat:'2 Min Setup',sub:'Tell us about your business once, never again'},
                {icon:'🔒',stat:'No Contract',sub:'Cancel anytime, no questions asked'},
                {icon:'🤖',stat:'Fully Automated',sub:'Posts and reviews handled while you sleep'},
              ].map(s=>(
                <div key={s.stat} className="card" style={{padding:'28px 20px',textAlign:'center'}}>
                  <div style={{fontSize:32,marginBottom:12}}>{s.icon}</div>
                  <div className="S" style={{fontSize:18,fontWeight:800,color:'#1a1035',marginBottom:6}}>{s.stat}</div>
                  <div style={{fontSize:13,color:'rgba(26,16,53,.45)',lineHeight:1.6}}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:20,padding:'32px 40px',border:'1px solid rgba(139,92,246,.08)',boxShadow:'0 4px 24px rgba(139,92,246,.05)'}}>
              <p style={{fontSize:13,color:'rgba(26,16,53,.4)',marginBottom:20,fontWeight:500}}>Works seamlessly with platforms you already use</p>
              <div style={{display:'flex',justifyContent:'center',gap:20,flexWrap:'wrap',alignItems:'center'}}>
                {[{n:'Instagram',i:'📸',c:'#E1306C'},{n:'TikTok',i:'🎵',c:'#69C9D0'},{n:'Facebook',i:'📘',c:'#1877F2'},{n:'X',i:'𝕏',c:'#555'},{n:'LinkedIn',i:'💼',c:'#0A66C2'},{n:'Pinterest',i:'📌',c:'#E60023'},{n:'Yelp',i:'⭐',c:'#D32323'},{n:'Google',i:'🔍',c:'#4285F4'}].map(p=>(
                  <div key={p.n} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:50,background:p.c+'0c',border:`1px solid ${p.c}20`}}>
                    <span style={{fontSize:16}}>{p.i}</span>
                    <span style={{fontSize:13,fontWeight:600,color:p.c}}>{p.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" style={{background:'#fff',padding:'120px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:52}}>
              <span className="slabel">Pricing</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',marginBottom:16}}>Simple, honest <span className="gt">pricing.</span></h2>
              <p style={{fontSize:17,color:'rgba(26,16,53,.45)',marginBottom:36}}>Start free. Scale as you grow. Cancel anytime.</p>
              {/* Toggle */}
              <div style={{display:'inline-flex',alignItems:'center',gap:14,background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.1)',borderRadius:50,padding:'8px 20px'}}>
                <span style={{fontSize:14,fontWeight:500,color:billing==='monthly'?'#1a1035':'rgba(26,16,53,.38)',transition:'color .2s'}}>Monthly</span>
                <div className={`toggle-track ${billing==='annual'?'on':''}`} onClick={()=>setBilling(b=>b==='monthly'?'annual':'monthly')}>
                  <div className="toggle-thumb" />
                </div>
                <span style={{fontSize:14,fontWeight:500,color:billing==='annual'?'#1a1035':'rgba(26,16,53,.38)',transition:'color .2s'}}>Annual</span>
                {billing==='annual'&&<span style={{background:'linear-gradient(135deg,#8b5cf6,#ec4899)',color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:50}}>Save 35%</span>}
              </div>
            </div>
            <div className="pg" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,alignItems:'start'}}>
              {plans.map(plan=>(
                <div key={plan.name} className={`pcard ${plan.popular?'pop':''}`} style={{paddingTop:plan.popular?'48px':'36px'}}>
                  {plan.popular&&<div style={{position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#8b5cf6,#ec4899)',color:'#fff',fontSize:11,fontWeight:700,padding:'6px 20px',borderRadius:'0 0 14px 14px',letterSpacing:1,textTransform:'uppercase'}}>Most Popular</div>}
                  <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:plan.popular?'linear-gradient(90deg,#8b5cf6,#ec4899)':plan.color,borderRadius:'28px 28px 0 0'}} />
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:13,fontWeight:700,color:plan.color,marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>{plan.name}</div>
                    <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
                      <span className="S" style={{fontSize:52,fontWeight:800,color:'#1a1035',lineHeight:1}}>${billing==='annual'?plan.yr:plan.mo}</span>
                      <span style={{fontSize:15,color:'rgba(26,16,53,.4)'}}>/mo</span>
                    </div>
                    {billing==='annual'&&<div style={{fontSize:13,color:'rgba(26,16,53,.35)',textDecoration:'line-through'}}>${plan.mo}/mo billed monthly</div>}
                    <div style={{fontSize:13,color:'rgba(26,16,53,.4)',marginTop:4}}>{billing==='annual'?'Billed annually':'Billed monthly'} · 7-day free trial</div>
                  </div>
                  <button onClick={subscribe} className="btn" style={{width:'100%',padding:'13px',borderRadius:14,marginBottom:28,fontSize:15,fontWeight:600,fontFamily:'Inter,sans-serif',cursor:'pointer',background:plan.popular?'linear-gradient(135deg,#8b5cf6,#ec4899)':'transparent',color:plan.popular?'#fff':'#1a1035',border:plan.popular?'none':`1.5px solid rgba(26,16,53,.14)`,boxShadow:plan.popular?'0 8px 28px rgba(139,92,246,.28)':'none',transition:'all .25s'}}>
                    {plan.name==='Starter'?'Start Free Trial →':plan.popular?'Get Started →':'Contact Sales →'}
                  </button>
                  <div>
                    {plan.features.map(f=>(
                      <div key={f} style={{display:'flex',alignItems:'flex-start',gap:12,fontSize:14,color:'rgba(26,16,53,.65)',lineHeight:1.5,marginBottom:12}}>
                        <div style={{width:20,height:20,borderRadius:'50%',background:plan.color+'12',border:`1px solid ${plan.color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                          <span style={{color:plan.color,fontSize:10,fontWeight:700}}>✓</span>
                        </div>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p style={{textAlign:'center',marginTop:28,fontSize:13,color:'rgba(26,16,53,.35)'}}>All plans include a 7-day free trial · No credit card required to start · Cancel anytime</p>
          </div>
        </section>

        {/* ═══ CONTACT ═══ */}
        <section id="contact" style={{background:'linear-gradient(160deg,#faf9ff,#f0eeff)',padding:'120px 40px'}}>
          <div style={{maxWidth:900,margin:'0 auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'start',flexWrap:'wrap'}} className="tg">
              {/* Left */}
              <div>
                <span className="slabel">Contact</span>
                <h2 className="S" style={{fontSize:'clamp(32px,4vw,48px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.05,marginBottom:20}}>
                  Got questions?<br /><span className="gtd">We&apos;d love to help.</span>
                </h2>
                <p style={{fontSize:16,color:'rgba(26,16,53,.45)',lineHeight:1.8,marginBottom:36,fontWeight:300}}>
                  Whether you&apos;re curious about features, pricing, or need help getting started — our team responds within a few hours.
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  {[{icon:'✉️',label:'Email us',val:'hello@postwiz.co'},
                    {icon:'💬',label:'Live chat',val:'Available in the dashboard'},
                    {icon:'📅',label:'Book a demo',val:'Free 20-minute walkthrough'},
                  ].map(c=>(
                    <div key={c.label} style={{display:'flex',alignItems:'center',gap:14}}>
                      <div style={{width:44,height:44,borderRadius:14,background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.14)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{c.icon}</div>
                      <div><div style={{fontSize:13,fontWeight:600,color:'#1a1035'}}>{c.label}</div><div style={{fontSize:13,color:'rgba(26,16,53,.45)'}}>{c.val}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — form */}
              <div className="card" style={{padding:'36px'}}>
                {contactSent ? (
                  <div style={{textAlign:'center',padding:'40px 0'}}>
                    <div style={{fontSize:48,marginBottom:16}}>🎉</div>
                    <h3 className="S" style={{fontSize:22,fontWeight:700,color:'#1a1035',marginBottom:8}}>Message sent!</h3>
                    <p style={{fontSize:15,color:'rgba(26,16,53,.45)'}}>We&apos;ll get back to you within a few hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContact} style={{display:'flex',flexDirection:'column',gap:16}}>
                    <div>
                      <label style={{fontSize:13,fontWeight:500,color:'rgba(26,16,53,.55)',display:'block',marginBottom:8}}>Your Name</label>
                      <input className="inp" value={contactForm.name} onChange={e=>setContactForm(f=>({...f,name:e.target.value}))} placeholder="Maria Garcia" required />
                    </div>
                    <div>
                      <label style={{fontSize:13,fontWeight:500,color:'rgba(26,16,53,.55)',display:'block',marginBottom:8}}>Email Address</label>
                      <input className="inp" type="email" value={contactForm.email} onChange={e=>setContactForm(f=>({...f,email:e.target.value}))} placeholder="maria@restaurant.com" required />
                    </div>
                    <div>
                      <label style={{fontSize:13,fontWeight:500,color:'rgba(26,16,53,.55)',display:'block',marginBottom:8}}>Message</label>
                      <textarea className="inp" rows={4} value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} placeholder="Tell us what you need..." required style={{resize:'vertical' as const}} />
                    </div>
                    <button type="submit" className="btn bp" style={{width:'100%',padding:'14px',fontSize:15}}>Send Message →</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section style={{background:'linear-gradient(135deg,#8b5cf6 0%,#ec4899 55%,#f97316 100%)',padding:'120px 40px',textAlign:'center'}}>
          <div style={{maxWidth:780,margin:'0 auto'}}>
            <h2 className="S" style={{fontSize:'clamp(38px,6vw,76px)',fontWeight:800,color:'#fff',letterSpacing:'-3px',lineHeight:1.0,marginBottom:20}}>Your entire online<br />presence, on autopilot.</h2>
            <p style={{fontSize:17,color:'rgba(255,255,255,.65)',marginBottom:44,fontWeight:300}}>Instagram · TikTok · Facebook · X · LinkedIn · Pinterest · Yelp · Google Reviews</p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={subscribe} disabled={loading} className="btn" style={{background:'#fff',color:'#7c3aed',padding:'18px 48px',borderRadius:50,fontSize:17,fontWeight:700,cursor:'pointer',boxShadow:'0 12px 40px rgba(0,0,0,.18)',border:'none'}}>
                {loading?'Loading...':'Get Started Free →'}
              </button>
              <a href="#contact" className="btn" style={{background:'rgba(255,255,255,.12)',color:'#fff',border:'1.5px solid rgba(255,255,255,.28)',padding:'18px 36px',borderRadius:50,fontSize:15,fontWeight:600,textDecoration:'none'}}>Talk to us</a>
            </div>
            <p style={{color:'rgba(255,255,255,.38)',fontSize:13,marginTop:18}}>No credit card required · 7-day free trial · Cancel anytime</p>
          </div>
        </section>

        {/* Footer */}
        <footer style={{background:'#1a1035',padding:'48px 60px 36px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:32}}>
          <div>
            <div className="S" style={{fontSize:22,fontWeight:800,color:'#fff',marginBottom:8}}>Post<span className="gtd">Wiz</span></div>
            <p style={{color:'rgba(255,255,255,.3)',fontSize:13,maxWidth:220,lineHeight:1.6}}>AI-powered social media & review management for small businesses.</p>
          </div>
          <div style={{display:'flex',gap:48,flexWrap:'wrap'}}>
            {[['Product',['Features','Pricing','Studio','Dashboard']],['Company',['Contact','Privacy','Terms']]].map(([cat,links])=>(
              <div key={cat as string}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(255,255,255,.28)',marginBottom:16}}>{cat}</div>
                {(links as string[]).map(l=><div key={l} style={{marginBottom:10}}><a href={l==='Contact'?'#contact':`/${l.toLowerCase()}`} style={{color:'rgba(255,255,255,.45)',textDecoration:'none',fontSize:14,transition:'color .2s'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#fff'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,.45)'}>{l}</a></div>)}
              </div>
            ))}
          </div>
          <div style={{textAlign:'right'}}>
            <p style={{color:'rgba(255,255,255,.18)',fontSize:13,marginBottom:8}}>© 2026 PostWiz. All rights reserved.</p>
            <p style={{color:'rgba(255,255,255,.15)',fontSize:12}}>Built with ❤️ for small businesses</p>
          </div>
        </footer>
      </main>
    </>
  )
}
