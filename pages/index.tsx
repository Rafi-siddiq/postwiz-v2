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
          const e2 = 1 - Math.pow(1 - p, 3)
          setCounts({ posts: Math.floor(e2 * tgts.posts), biz: Math.floor(e2 * tgts.biz), hours: Math.floor(e2 * tgts.hours) })
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
    for (let i = 0; i < 45; i++) pts.push({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.5+.4,h:Math.random()*60+240})
    const draw = () => {
      ctx.clearRect(0,0,cv.width,cv.height)
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0||p.x>cv.width)p.vx*=-1; if(p.y<0||p.y>cv.height)p.vy*=-1
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`hsla(${p.h},70%,68%,0.3)`; ctx.fill()
      })
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y); if(d<100){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`hsla(265,60%,68%,${.04*(1-d/100)})`;ctx.lineWidth=.5;ctx.stroke()}}))
      afRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(afRef.current); window.removeEventListener('resize', resize) }
  }, [])

  const subscribe = async (plan?: string) => {
    setLoading(true)
    try { const r = await fetch('/api/checkout', { method: 'POST' }); const { url } = await r.json(); window.location.href = url }
    catch { alert('Something went wrong.'); setLoading(false) }
  }

  const clamp = (v: number) => Math.max(0, Math.min(1, v))
  const pct = (a: number, b: number) => clamp((scroll - a) / (b - a))
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const heroFade = pct(wh * 0.35, wh * 1.0)
  const B = wh * 2
  const s1 = clamp(Math.min(pct(B, B+wh*.4), 1-clamp((scroll-(B+wh*.7))/(wh*.4))))
  const s2 = clamp(Math.min(pct(B+wh*.9, B+wh*1.3), 1-clamp((scroll-(B+wh*1.7))/(wh*.4))))
  const s3 = pct(B+wh*1.9, B+wh*2.4)
  const activeStep = s3>.3?2:s2>.3?1:0

  const plans = [
    { name: 'Starter', price: billing==='annual'?19:29, orig: 29, color: '#8b5cf6', popular: false,
      features: ['3 platforms (Instagram, Facebook, TikTok)','30 AI posts per month','Basic analytics','Email support','Cancel anytime'] },
    { name: 'Growth', price: billing==='annual'?39:59, orig: 59, color: '#ec4899', popular: true,
      features: ['All 8 platforms','Unlimited AI posts','Yelp & Google Review replies','Photo caption AI','Advanced analytics','Priority support'] },
    { name: 'Agency', price: billing==='annual'?89:129, orig: 129, color: '#f97316', popular: false,
      features: ['Everything in Growth','Up to 5 business profiles','White-label reports','Bulk content scheduling','Dedicated account manager','API access'] },
  ]

  const tabs = [
    { l: '🍕 Restaurant', p: `Fresh from our kitchen to your table tonight 🍕 Our chef just dropped something incredible — come taste why we've been Long Island's favorite for 12 years. Limited tables! Book now. #longislandeats #italianfood #freshdaily #foodie` },
    { l: '✂️ Barbershop', p: `New week. Fresh cut. 💈 Walk-ins welcome all day — no appointment needed. Come look sharp, feel sharp. ✂️ #barbershop #freshcut #barberlife #mensgrooming #lookgood` },
    { l: '👗 Boutique', p: `New arrivals just landed 🛍️ Spring 2026 collection is in — pieces going fast. DM to reserve before it's gone! 💫 #boutique #newcollection #shoplocal #fashion` },
    { l: '💪 Gym', p: `Your best workout is waiting 💪 Free drop-in class today 6PM — no experience needed. 🔥 Tag someone who needs to move! #fitness #gym #workout #getfit` },
  ]

  const platforms = [
    {n:'Instagram',i:'📸',c:'#E1306C'},{n:'TikTok',i:'🎵',c:'#69C9D0'},
    {n:'Facebook',i:'📘',c:'#1877F2'},{n:'X (Twitter)',i:'𝕏',c:'#555'},
    {n:'LinkedIn',i:'💼',c:'#0A66C2'},{n:'Pinterest',i:'📌',c:'#E60023'},
    {n:'Yelp',i:'⭐',c:'#D32323'},{n:'Google',i:'🔍',c:'#4285F4'},
  ]

  const steps = [
    {icon:'✏️',num:'01',color:'#8b5cf6',title:'Tell us about\nyour business',desc:'Name, industry, brand voice, which platforms. Takes 2 minutes. Done once, forever.'},
    {icon:'🤖',num:'02',color:'#ec4899',title:'AI writes all\nyour content',desc:'A full week of posts for every platform, photo captions, and review responses — in your exact brand voice.'},
    {icon:'🚀',num:'03',color:'#10b981',title:'Everything posts\nautomatically',desc:'Posts go live at peak times. Reviews get replied to instantly. Your entire presence runs itself.'},
  ]

  return (
    <>
      <Head>
        <title>PostWiz – AI Manages Your Social Media & Reviews</title>
        <meta name="description" content="PostWiz manages Instagram, TikTok, Facebook, X, Yelp, Google Reviews and more — automatically." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:auto}
        body{background:#f8f7ff;color:#1a1035;font-family:'Inter',sans-serif;overflow-x:hidden;cursor:none}
        .S{font-family:'Syne',sans-serif}
        #cd{position:fixed;width:10px;height:10px;background:#8b5cf6;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:multiply}
        #cr{position:fixed;width:38px;height:38px;border:1.5px solid rgba(139,92,246,.4);border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:left .09s ease,top .09s ease,width .2s,height .2s,border-color .2s}
        body:has(button:hover) #cr,body:has(a:hover) #cr{width:52px;height:52px;border-color:rgba(236,72,153,.65)}

        /* Nav */
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 60px;display:flex;align-items:center;justify-content:space-between;transition:all .35s}
        .nav.on{background:rgba(248,247,255,.95);backdrop-filter:blur(20px);padding:14px 60px;border-bottom:1px solid rgba(139,92,246,.08);box-shadow:0 2px 20px rgba(139,92,246,.06)}
        .nl{color:rgba(26,16,53,.5);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s;cursor:none}
        .nl:hover{color:#8b5cf6}

        /* Gradients */
        .gt{background:linear-gradient(135deg,#8b5cf6,#ec4899,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .gtd{background:linear-gradient(135deg,#7c3aed,#db2777);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

        /* Buttons */
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter',sans-serif;font-weight:600;cursor:none;border:none;transition:all .25s}
        .bp{background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;padding:14px 34px;border-radius:50px;font-size:15px;box-shadow:0 8px 28px rgba(139,92,246,.28)}
        .bp:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(139,92,246,.4)}
        .bp:disabled{opacity:.6;transform:none}
        .bw{background:#fff;color:#1a1035;border:1.5px solid rgba(0,0,0,.1);padding:13px 30px;border-radius:50px;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,.05)}
        .bw:hover{box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-1px)}
        .bpl{padding:18px 48px;font-size:17px}

        /* Cards */
        .card{background:#fff;border-radius:24px;border:1px solid rgba(139,92,246,.07);box-shadow:0 4px 24px rgba(139,92,246,.05)}

        /* Animations */
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes floatb{0%,100%{transform:translateY(-7px) rotate(-1.5deg)}50%{transform:translateY(7px) rotate(-1.5deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,-40px)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,30px)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.82)}}
        @keyframes slide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes phoner{0%,100%{transform:translateY(0) rotate(2deg)}50%{transform:translateY(-12px) rotate(2deg)}}

        .fa{animation:float 5s ease-in-out infinite}
        .fb{animation:floatb 4s ease-in-out infinite 1.2s}
        .pd{animation:pulse 2s ease-in-out infinite}
        .cur{display:inline-block;width:3px;height:.85em;background:#ec4899;margin-left:3px;border-radius:2px;animation:blink 1s step-end infinite;vertical-align:text-bottom}
        .notif{background:rgba(255,255,255,.88);border:1px solid rgba(139,92,246,.12);border-radius:16px;padding:14px 18px;backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(139,92,246,.08)}
        .slabel{font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#8b5cf6;display:block;margin-bottom:14px}
        .tab-btn{padding:10px 22px;border-radius:50px;border:1.5px solid rgba(139,92,246,.14);background:transparent;color:rgba(26,16,53,.45);font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:none;transition:all .25s}
        .tab-btn.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent;color:#fff;box-shadow:0 6px 20px rgba(139,92,246,.26)}
        .tab-btn:hover:not(.on){border-color:rgba(139,92,246,.28);color:#8b5cf6}

        /* Phone mockup */
        .phone{animation:phoner 6s ease-in-out infinite}

        /* Toggle */
        .toggle-track{width:52px;height:28px;background:rgba(139,92,246,.15);border:1.5px solid rgba(139,92,246,.2);border-radius:14px;position:relative;cursor:pointer;transition:background .3s}
        .toggle-track.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent}
        .toggle-thumb{position:absolute;top:3px;left:3px;width:20px;height:20px;background:#fff;border-radius:50%;transition:transform .3s;box-shadow:0 2px 8px rgba(0,0,0,.15)}
        .toggle-track.on .toggle-thumb{transform:translateX(24px)}

        /* Pricing card */
        .pcard{background:#fff;border-radius:28px;border:1.5px solid rgba(139,92,246,.08);box-shadow:0 4px 24px rgba(139,92,246,.06);padding:36px 32px;position:relative;overflow:hidden;transition:all .3s}
        .pcard:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(139,92,246,.1)}
        .pcard.popular{border-color:rgba(236,72,153,.25);box-shadow:0 8px 40px rgba(236,72,153,.1)}

        /* Feature check */
        .fcheck{display:flex;align-items:flex-start;gap:12px;font-size:14px;color:rgba(26,16,53,.65);line-height:1.5;margin-bottom:12px}
        .fcheck .ck{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}

        /* Mobile nav */
        .mnav{display:none}
        @media(max-width:768px){
          body{cursor:auto}#cd,#cr{display:none}
          .nav{padding:16px 20px}.nav.on{padding:12px 20px}
          .nav-links{display:none}
          .mnav{display:block}
          .hero-cards{display:none!important}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .plat-grid{grid-template-columns:repeat(2,1fr)!important}
          .feat-grid{grid-template-columns:1fr!important}
          .price-grid{grid-template-columns:1fr!important}
          .testi-grid{grid-template-columns:1fr!important}
          .steps-section{display:none!important}
          .steps-mobile{display:block!important}
          .phone-section{flex-direction:column!important;text-align:center!important}
        }
        .steps-mobile{display:none}
      `}</style>

      <div id="cd" style={{left:mousePos.x,top:mousePos.y}} />
      <div id="cr" style={{left:mousePos.x,top:mousePos.y}} />
      <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',opacity:.18}} />

      {/* NAV */}
      <nav className={`nav ${scroll>60?'on':''}`}>
        <div className="S" style={{fontSize:24,fontWeight:800,color:'#1a1035'}}>Post<span className="gtd">Wiz</span></div>
        <div className="nav-links" style={{display:'flex',alignItems:'center',gap:36}}>
          <a href="#platforms" className="nl">Platforms</a>
          <a href="#how-anchor" className="nl">How it works</a>
          <a href="#pricing" className="nl">Pricing</a>
          <a href="/studio" className="nl" style={{color:'#8b5cf6',fontWeight:600}}>🎨 Studio</a>
          <button onClick={()=>subscribe()} className="btn bp" style={{padding:'11px 26px',fontSize:14}}>Start Free →</button>
        </div>
        {/* Mobile hamburger */}
        <button className="mnav" onClick={()=>setMobileNav(!mobileNav)} style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:'#1a1035'}}>☰</button>
      </nav>

      {/* Mobile nav dropdown */}
      {mobileNav && (
        <div style={{position:'fixed',top:60,left:0,right:0,background:'rgba(248,247,255,.98)',backdropFilter:'blur(20px)',zIndex:99,padding:'20px',borderBottom:'1px solid rgba(139,92,246,.1)',display:'flex',flexDirection:'column',gap:16}}>
          {['Platforms','How it works','Pricing'].map(l=>(
            <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`} onClick={()=>setMobileNav(false)} style={{color:'rgba(26,16,53,.7)',textDecoration:'none',fontSize:16,fontWeight:500}}>{l}</a>
          ))}
          <button onClick={()=>subscribe()} className="btn bp" style={{width:'100%',padding:14,fontSize:15}}>Start 7-Day Free Trial →</button>
        </div>
      )}

      <main style={{position:'relative',zIndex:1}}>

        {/* ═══ HERO — 200vh sticky ═══ */}
        <section style={{height:'200vh',position:'relative'}}>
          <div style={{position:'sticky',top:0,height:'100vh',overflow:'hidden',background:'linear-gradient(160deg,#ede9ff 0%,#fdf4ff 45%,#fff5f8 100%)'}}>
            <div style={{position:'absolute',width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.15) 0%,transparent 65%)',top:'-20%',left:'-15%',animation:'orb1 18s ease-in-out infinite',pointerEvents:'none'}} />
            <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,.11) 0%,transparent 65%)',top:'10%',right:'-12%',animation:'orb2 22s ease-in-out infinite',pointerEvents:'none'}} />
            <div style={{position:'absolute',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(249,115,22,.08) 0%,transparent 65%)',bottom:'-10%',left:'35%',animation:'orb1 14s ease-in-out infinite 3s',pointerEvents:'none'}} />

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
              <div className="notif fb" style={{position:'absolute',right:'4%',top:'28%',width:210,opacity:Math.max(0,1-heroFade*2),transform:`translateY(${-heroFade*30}px)`}}>
                <div style={{fontSize:11,color:'rgba(26,16,53,.4)',marginBottom:6}}>⭐ Yelp Review Replied</div>
                <div style={{fontSize:13,fontWeight:500,color:'#1a1035',lineHeight:1.5}}>AI responded in 28 seconds</div>
                <div style={{fontSize:11,color:'#10b981',marginTop:6}}>✓ Review management active</div>
              </div>
              <div className="notif fa" style={{position:'absolute',left:'6%',bottom:'24%',width:190,animationDelay:'2s',opacity:Math.max(0,1-heroFade*2),transform:`translateY(${heroFade*30}px)`}}>
                <div style={{fontSize:11,color:'#10b981',display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'#10b981',display:'inline-block'}} />New customer</div>
                <div style={{fontSize:13,color:'#1a1035'}}>Found you via Google Review</div>
              </div>
              <div className="notif fb" style={{position:'absolute',right:'5%',bottom:'26%',width:205,opacity:Math.max(0,1-heroFade*2),transform:`translateY(${heroFade*25}px)`}}>
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

            {/* Hero content */}
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px',opacity:Math.max(0,1-heroFade*1.4),transform:`scale(${lerp(1,.92,heroFade)}) translateY(${-heroFade*70}px)`}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:10,background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.18)',borderRadius:50,padding:'9px 22px',marginBottom:32}}>
                <span className="pd" style={{width:7,height:7,borderRadius:'50%',background:'#8b5cf6',display:'inline-block'}} />
                <span style={{fontSize:13,fontWeight:500,color:'#7c3aed'}}>8 platforms · Social + Reviews · AI-powered</span>
              </div>
              <h1 className="S" style={{fontSize:'clamp(48px,8vw,100px)',fontWeight:800,lineHeight:.98,letterSpacing:'-4px',color:'#1a1035',marginBottom:24}}>
                AI manages<br />your <span className="gt">{typed}<span className="cur"/></span>
              </h1>
              <p style={{fontSize:19,color:'rgba(26,16,53,.45)',maxWidth:540,margin:'0 auto 44px',lineHeight:1.8,fontWeight:300}}>
                PostWiz handles Instagram, TikTok, Facebook, X, LinkedIn, Pinterest, Yelp and Google Reviews — all on autopilot.
              </p>
              <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:16}}>
                <button onClick={()=>subscribe()} disabled={loading} className="btn bp bpl">{loading?'Loading...':'Start 7-Day Free Trial →'}</button>
                <button className="btn bw" onClick={()=>window.scrollTo({top:wh*2.1,behavior:'smooth'})}>Watch how it works</button>
              </div>
              <p style={{fontSize:13,color:'rgba(26,16,53,.25)'}}>No credit card · 2 min setup · Cancel anytime</p>
              <div style={{position:'absolute',bottom:36,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,opacity:Math.max(0,1-heroFade*5)}}>
                <span style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'rgba(26,16,53,.3)'}}>Scroll</span>
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

        {/* ═══ HOW IT WORKS — Desktop sticky ═══ */}
        <div id="how-anchor" style={{height:0}} />

        {/* Desktop version */}
        <section className="steps-section" style={{height:'300vh',position:'relative'}}>
          <div style={{position:'sticky',top:0,height:'100vh',overflow:'hidden',background:'linear-gradient(160deg,#faf9ff,#f5f3ff,#fff8fe)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{position:'absolute',top:44,textAlign:'center'}}><span className="slabel">How it works</span></div>
            {steps.map((step,i)=>{
              const op = i===0?s1:i===1?s2:s3
              const ein = i===0?s1:i===1?s2:s3
              const ea = Math.min(1,ein*2.5)
              const sout = i===0?clamp((scroll-(B+wh*.7))/(wh*.4)):i===1?clamp((scroll-(B+wh*1.7))/(wh*.4)):0
              const ey = lerp(56,0,ea); const er = lerp(i%2===0?5:-5,0,ea); const es = lerp(.88,1,ea); const xy = lerp(0,-90,sout)
              return (
                <div key={i} style={{position:'absolute',maxWidth:600,width:'90%',textAlign:'center',zIndex:2,opacity:op,pointerEvents:op>.05?'auto':'none',transform:`translateY(${ey+xy}px) rotate(${er*(1-sout)}deg) scale(${es})`}}>
                  <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:28}}>
                    <div style={{position:'absolute',width:120,height:120,borderRadius:'50%',background:step.color+'10',animation:'pulse 3s ease-out infinite',animationDelay:`${i*.5}s`}} />
                    <div style={{width:90,height:90,borderRadius:'50%',background:`linear-gradient(135deg,${step.color}20,${step.color}08)`,border:`1.5px solid ${step.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,boxShadow:`0 0 40px ${step.color}18`}}>{step.icon}</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:4,textTransform:'uppercase',color:step.color,marginBottom:16}}>Step {step.num}</div>
                  <h2 className="S" style={{fontSize:'clamp(36px,5vw,60px)',fontWeight:800,color:'#1a1035',letterSpacing:'-2px',lineHeight:1.02,marginBottom:20,whiteSpace:'pre-line'}}>{step.title}</h2>
                  <p style={{fontSize:18,color:'rgba(26,16,53,.45)',lineHeight:1.85,maxWidth:460,margin:'0 auto',fontWeight:300}}>{step.desc}</p>
                  {i===2&&<button onClick={()=>subscribe()} className="btn bp" style={{marginTop:32,padding:'15px 40px',fontSize:16}}>Get Started Free →</button>}
                </div>
              )
            })}
            <div style={{position:'absolute',bottom:40,display:'flex',alignItems:'center',gap:8}}>
              {[0,1,2].map(i=><div key={i} style={{height:8,borderRadius:4,width:activeStep===i?28:8,background:activeStep===i?'linear-gradient(90deg,#8b5cf6,#ec4899)':'rgba(139,92,246,.2)',transition:'all .4s cubic-bezier(.16,1,.3,1)'}} />)}
            </div>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(139,92,246,.06)'}}>
              <div style={{height:'100%',width:`${Math.max(s1,s2*.67+.33,s3*.33+.67)*100}%`,background:'linear-gradient(90deg,#8b5cf6,#ec4899)',borderRadius:'0 2px 2px 0',transition:'width .1s linear'}} />
            </div>
          </div>
        </section>

        {/* Mobile steps — simple cards */}
        <section className="steps-mobile" style={{background:'linear-gradient(160deg,#faf9ff,#f5f3ff)',padding:'80px 20px'}}>
          <div style={{textAlign:'center',marginBottom:48}}><span className="slabel">How it works</span><h2 className="S" style={{fontSize:36,fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.05}}>Three steps to <span className="gtd">autopilot.</span></h2></div>
          <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:480,margin:'0 auto'}}>
            {steps.map((s,i)=>(
              <div key={i} className="card" style={{padding:'28px 24px'}}>
                <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
                  <div style={{width:52,height:52,borderRadius:'50%',background:`linear-gradient(135deg,${s.color}18,${s.color}08)`,border:`1.5px solid ${s.color}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{s.icon}</div>
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
            <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
              {[{num:counts.posts.toLocaleString()+'+',label:'Posts Generated',sub:'Across all platforms',color:'#8b5cf6',icon:'✍️'},
                {num:counts.biz.toLocaleString()+'+',label:'Active Businesses',sub:'Every industry',color:'#ec4899',icon:'🏢'},
                {num:counts.hours.toLocaleString()+'h',label:'Hours Saved',sub:'Time back to owners',color:'#f97316',icon:'⚡'}
              ].map(s=>(
                <div key={s.label} className="card" style={{padding:'40px 36px',textAlign:'center',transition:'all .3s'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px)';el.style.boxShadow=`0 20px 60px rgba(0,0,0,.07),0 0 0 2px ${s.color}15`}}
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

        {/* ═══ PHONE MOCKUP + DEMO ═══ */}
        <section style={{background:'linear-gradient(160deg,#faf9ff,#f0eeff)',padding:'120px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div className="phone-section" style={{display:'flex',alignItems:'center',gap:80,flexWrap:'wrap'}}>
              {/* Phone mockup */}
              <div className="phone" style={{flexShrink:0,position:'relative'}}>
                {/* Phone frame */}
                <div style={{width:280,height:580,borderRadius:44,background:'#1a1035',padding:12,boxShadow:'0 40px 100px rgba(26,16,53,.25),0 0 0 1px rgba(255,255,255,.08)',position:'relative'}}>
                  {/* Notch */}
                  <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',width:80,height:24,background:'#1a1035',borderRadius:12,zIndex:10}} />
                  {/* Screen */}
                  <div style={{height:'100%',borderRadius:34,background:'linear-gradient(160deg,#f8f7ff,#fff5fb)',overflow:'hidden',position:'relative'}}>
                    {/* App UI */}
                    <div style={{padding:'48px 16px 16px'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#1a1035',marginBottom:12,fontFamily:'Syne,sans-serif'}}>PostWiz</div>
                      {/* Post card */}
                      <div style={{background:'#fff',borderRadius:16,padding:'14px',marginBottom:10,boxShadow:'0 4px 16px rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.07)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{fontSize:14}}>📸</span>
                          <span style={{fontSize:11,fontWeight:600,color:'#E1306C',background:'rgba(225,48,108,.1)',padding:'2px 8px',borderRadius:50}}>Instagram</span>
                          <span style={{fontSize:10,color:'rgba(26,16,53,.35)',marginLeft:'auto'}}>9:00 AM</span>
                        </div>
                        <p style={{fontSize:11,color:'rgba(26,16,53,.7)',lineHeight:1.6}}>Fresh from our kitchen tonight 🍕 Come taste why we&apos;ve been a favorite for 12 years! #longislandeats #foodie</p>
                        <div style={{display:'flex',gap:6,marginTop:8}}>
                          <div style={{flex:1,background:'linear-gradient(135deg,#8b5cf6,#ec4899)',borderRadius:8,padding:'6px',textAlign:'center' as const,fontSize:10,color:'#fff',fontWeight:600}}>✓ Approve</div>
                          <div style={{background:'rgba(139,92,246,.08)',borderRadius:8,padding:'6px 10px',fontSize:10,color:'#8b5cf6',fontWeight:600}}>Edit</div>
                        </div>
                      </div>
                      <div style={{background:'#fff',borderRadius:16,padding:'14px',marginBottom:10,boxShadow:'0 4px 16px rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.07)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{fontSize:14}}>🎵</span>
                          <span style={{fontSize:11,fontWeight:600,color:'#69C9D0',background:'rgba(105,201,208,.1)',padding:'2px 8px',borderRadius:50}}>TikTok</span>
                          <span style={{fontSize:10,color:'rgba(26,16,53,.35)',marginLeft:'auto'}}>3:00 PM</span>
                        </div>
                        <p style={{fontSize:11,color:'rgba(26,16,53,.7)',lineHeight:1.6}}>POV: You just tried our garlic knots 🤯 Come see what everyone&apos;s talking about!</p>
                      </div>
                      <div style={{background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.15)',borderRadius:12,padding:'10px 14px',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:14}}>⭐</span>
                        <div><div style={{fontSize:10,fontWeight:600,color:'#10b981'}}>Yelp Review Replied</div><div style={{fontSize:10,color:'rgba(26,16,53,.4)'}}>AI responded · 28 sec ago</div></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow behind phone */}
                <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.2) 0%,transparent 70%)',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:-1,filter:'blur(20px)'}} />
              </div>

              {/* Text side */}
              <div style={{flex:1,minWidth:300}}>
                <span className="slabel">The Dashboard</span>
                <h2 className="S" style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.05,marginBottom:20}}>
                  Everything in one<br /><span className="gt">clean dashboard.</span>
                </h2>
                <p style={{fontSize:17,color:'rgba(26,16,53,.45)',lineHeight:1.8,marginBottom:32,fontWeight:300}}>
                  See all your upcoming posts, approve or edit with one tap, and watch reviews get handled automatically. Works beautifully on mobile and desktop.
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {['All posts across 8 platforms in one view','One-tap approval or edit before posting','Review replies sent automatically','Real-time analytics at a glance'].map(f=>(
                    <div key={f} style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{color:'#8b5cf6',fontSize:11,fontWeight:700}}>✓</span>
                      </div>
                      <span style={{fontSize:15,color:'rgba(26,16,53,.65)'}}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:12,marginTop:32,flexWrap:'wrap'}}>
                  <button onClick={()=>subscribe()} className="btn bp">Try Free for 7 Days →</button>
                  <a href="/dashboard" className="btn bw" style={{textDecoration:'none'}}>View Dashboard</a>
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
              <h2 className="S" style={{fontSize:'clamp(32px,4.5vw,58px)',fontWeight:800,color:'#1a1035',letterSpacing:'-2px',lineHeight:1.05,marginBottom:16}}>One tool. <span className="gt">Every platform.</span></h2>
              <p style={{fontSize:18,color:'rgba(26,16,53,.45)',maxWidth:480,margin:'0 auto'}}>Social media posting AND review management — everything your online presence needs.</p>
            </div>
            <div className="plat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:40}}>
              {platforms.map(p=>(
                <div key={p.n} className="card" style={{padding:'28px 20px',textAlign:'center',transition:'all .3s',cursor:'default'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px)';el.style.borderColor=p.c+'30';el.style.boxShadow=`0 16px 48px ${p.c}10`}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='none';el.style.borderColor='rgba(139,92,246,.07)';el.style.boxShadow=''}}>
                  <div style={{fontSize:32,marginBottom:10}}>{p.i}</div>
                  <div style={{fontSize:14,fontWeight:600,color:'#1a1035',marginBottom:6}}>{p.n}</div>
                  <div style={{width:24,height:3,borderRadius:2,background:p.c,margin:'0 auto',opacity:.5}} />
                </div>
              ))}
            </div>
            {/* Yelp demo */}
            <div className="card" style={{padding:'32px',maxWidth:680,margin:'0 auto'}}>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#8b5cf6',marginBottom:16}}>⭐ Example: AI-Generated Yelp Review Response</div>
              <div style={{background:'rgba(139,92,246,.04)',border:'1px solid rgba(139,92,246,.1)',borderRadius:12,padding:'14px 18px',marginBottom:14,fontSize:14,color:'rgba(26,16,53,.55)',fontStyle:'italic'}}>&ldquo;Amazing food! The garlic knots were incredible. Will definitely be back!&rdquo; — Sarah K. ★★★★★</div>
              <p style={{fontSize:15,color:'rgba(26,16,53,.7)',lineHeight:1.75}}>Thank you so much, Sarah! 🙏 Our garlic knots are a fan favorite — so glad they lived up to the hype! We can&apos;t wait to welcome you back soon!</p>
              <div style={{marginTop:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                <span style={{fontSize:12,background:'rgba(16,185,129,.07)',border:'1px solid rgba(16,185,129,.18)',color:'#10b981',padding:'4px 12px',borderRadius:50,fontWeight:600}}>✓ Posted to Yelp automatically</span>
                <span style={{fontSize:12,color:'rgba(26,16,53,.3)'}}>AI responded in 28 seconds</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ LIVE DEMO ═══ */}
        <section id="demo" style={{background:'linear-gradient(160deg,#faf9ff,#f5f3ff)',padding:'120px 40px'}}>
          <div style={{maxWidth:900,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:52}}>
              <span className="slabel">Live Demo</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',marginBottom:14}}>See what AI writes <span className="gt">for your business.</span></h2>
              <p style={{fontSize:17,color:'rgba(26,16,53,.45)',maxWidth:400,margin:'0 auto'}}>Click your industry. Watch AI generate a real post instantly.</p>
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:32,flexWrap:'wrap'}}>
              {tabs.map((t,i)=><button key={i} onClick={()=>setTab(i)} className={`tab-btn ${tab===i?'on':''}`}>{t.l}</button>)}
            </div>
            <div className="card" style={{padding:'36px',maxWidth:680,margin:'0 auto',animation:'slide .3s ease'}} key={tab}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingBottom:18,borderBottom:'1px solid rgba(139,92,246,.07)'}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#8b5cf6,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🤖</div>
                <div><div style={{fontSize:14,fontWeight:600,color:'#1a1035'}}>PostWiz AI</div><div style={{fontSize:12,color:'rgba(26,16,53,.35)'}}>Generated just now · Instagram</div></div>
                <div style={{marginLeft:'auto',background:'rgba(139,92,246,.07)',border:'1px solid rgba(139,92,246,.14)',color:'#8b5cf6',fontSize:12,fontWeight:600,padding:'5px 14px',borderRadius:50}}>📸 Ready to post</div>
              </div>
              <p style={{fontSize:16,lineHeight:1.8,color:'rgba(26,16,53,.7)',marginBottom:24}}>{tabs[tab].p}</p>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button style={{background:'linear-gradient(135deg,#8b5cf6,#ec4899)',border:'none',color:'#fff',padding:'11px 22px',borderRadius:10,fontFamily:'Inter,sans-serif',fontWeight:600,fontSize:14,cursor:'pointer',boxShadow:'0 6px 20px rgba(139,92,246,.22)'}}>✓ Approve & Schedule</button>
                <button style={{background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.14)',color:'#8b5cf6',padding:'11px 18px',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:14,cursor:'pointer'}}>✏️ Edit</button>
                <button style={{background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.14)',color:'#8b5cf6',padding:'11px 18px',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:14,cursor:'pointer'}}>↻ Regenerate</button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section style={{background:'#fff',padding:'120px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:72}}>
              <span className="slabel">Features</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',lineHeight:1.1}}>Everything included.<br /><span className="gtd">Zero extra fees.</span></h2>
            </div>
            <div className="feat-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              {[{icon:'🤖',title:'AI Post Writing',desc:'Claude AI writes platform-perfect posts in your brand voice for all 8 platforms simultaneously.',color:'#8b5cf6'},
                {icon:'📸',title:'Photo Caption AI',desc:'Upload a photo and AI analyzes it, writing captions for every platform automatically.',color:'#ec4899'},
                {icon:'📅',title:'Smart Scheduling',desc:'Posts go live at peak engagement times for your audience. Zero manual scheduling ever.',color:'#f97316'},
                {icon:'⭐',title:'Review Management',desc:'AI responds to Yelp and Google reviews professionally within seconds. Never miss one.',color:'#10b981'},
                {icon:'📊',title:'Analytics',desc:'Clear data on what\'s working. Understand your audience without being a data scientist.',color:'#0891b2'},
                {icon:'🎨',title:'Content Studio',desc:'Upload photos in bulk, AI generates captions for all platforms and queues everything up.',color:'#7c3aed'},
              ].map(f=>(
                <div key={f.title} className="card" style={{padding:'32px 28px',transition:'all .3s',cursor:'default'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px)';el.style.borderColor=f.color+'25';el.style.boxShadow=`0 20px 60px ${f.color}08`}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='none';el.style.borderColor='rgba(139,92,246,.07)';el.style.boxShadow=''}}>
                  <div style={{width:52,height:52,borderRadius:16,background:f.color+'0f',border:`1px solid ${f.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:16}}>{f.icon}</div>
                  <h3 className="S" style={{fontSize:18,fontWeight:700,color:'#1a1035',marginBottom:10,letterSpacing:'-.3px'}}>{f.title}</h3>
                  <p style={{fontSize:14,color:'rgba(26,16,53,.5)',lineHeight:1.8}}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" style={{background:'linear-gradient(160deg,#faf9ff,#f0eeff)',padding:'120px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:52}}>
              <span className="slabel">Pricing</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px',marginBottom:16}}>Simple, honest <span className="gt">pricing.</span></h2>
              <p style={{fontSize:17,color:'rgba(26,16,53,.45)',marginBottom:36}}>Start free. Scale as you grow. Cancel anytime.</p>

              {/* Billing toggle */}
              <div style={{display:'inline-flex',alignItems:'center',gap:14,background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.12)',borderRadius:50,padding:'8px 20px'}}>
                <span style={{fontSize:14,fontWeight:500,color:billing==='monthly'?'#1a1035':'rgba(26,16,53,.4)',transition:'color .2s'}}>Monthly</span>
                <div className={`toggle-track ${billing==='annual'?'on':''}`} onClick={()=>setBilling(b=>b==='monthly'?'annual':'monthly')}>
                  <div className="toggle-thumb" />
                </div>
                <span style={{fontSize:14,fontWeight:500,color:billing==='annual'?'#1a1035':'rgba(26,16,53,.4)',transition:'color .2s'}}>Annual</span>
                {billing==='annual'&&<span style={{background:'linear-gradient(135deg,#8b5cf6,#ec4899)',color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:50}}>Save 35%</span>}
              </div>
            </div>

            <div className="price-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,alignItems:'start'}}>
              {plans.map(plan=>(
                <div key={plan.name} className={`pcard ${plan.popular?'popular':''}`} style={{paddingTop: plan.popular?'48px':'36px'}}>
                  {plan.popular&&(
                    <div style={{position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#8b5cf6,#ec4899)',color:'#fff',fontSize:12,fontWeight:700,padding:'6px 20px',borderRadius:'0 0 14px 14px',letterSpacing:1,textTransform:'uppercase'}}>Most Popular</div>
                  )}
                  {/* Color bar */}
                  <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:plan.popular?'linear-gradient(90deg,#8b5cf6,#ec4899)':plan.color,borderRadius:'28px 28px 0 0'}} />

                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:14,fontWeight:700,color:plan.color,marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>{plan.name}</div>
                    <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
                      <span className="S" style={{fontSize:52,fontWeight:800,color:'#1a1035',lineHeight:1}}>${plan.price}</span>
                      <span style={{fontSize:15,color:'rgba(26,16,53,.4)'}}>/mo</span>
                    </div>
                    {billing==='annual'&&(
                      <div style={{fontSize:13,color:'rgba(26,16,53,.35)',textDecoration:'line-through'}}>${plan.orig}/mo billed monthly</div>
                    )}
                    <div style={{fontSize:13,color:'rgba(26,16,53,.4)',marginTop:4}}>{billing==='annual'?'Billed annually':'Billed monthly'}</div>
                  </div>

                  <button onClick={()=>subscribe(plan.name)} className="btn" style={{width:'100%',padding:'14px',borderRadius:14,marginBottom:28,fontSize:15,fontWeight:600,fontFamily:'Inter,sans-serif',cursor:'pointer',background:plan.popular?'linear-gradient(135deg,#8b5cf6,#ec4899)':'transparent',color:plan.popular?'#fff':'#1a1035',border:plan.popular?'none':`1.5px solid rgba(26,16,53,.15)`,boxShadow:plan.popular?'0 8px 28px rgba(139,92,246,.3)':'none',transition:'all .25s'}}
                    onMouseEnter={e=>{if(!plan.popular)(e.currentTarget as HTMLElement).style.borderColor='#8b5cf6'}}
                    onMouseLeave={e=>{if(!plan.popular)(e.currentTarget as HTMLElement).style.borderColor='rgba(26,16,53,.15)'}}>
                    {plan.name==='Starter'?'Start Free Trial':plan.popular?'Get Started →':'Contact Sales'}
                  </button>

                  <div>
                    {plan.features.map(f=>(
                      <div key={f} className="fcheck">
                        <div className="ck" style={{background:plan.color+'12',border:`1px solid ${plan.color}25`}}>
                          <span style={{color:plan.color,fontSize:11,fontWeight:700}}>✓</span>
                        </div>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p style={{textAlign:'center',marginTop:32,fontSize:14,color:'rgba(26,16,53,.35)'}}>All plans include a 7-day free trial · No credit card required · Cancel anytime</p>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section style={{background:'#fff',padding:'120px 40px'}}>
          <div style={{maxWidth:1100,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:64}}>
              <span className="slabel">Testimonials</span>
              <h2 className="S" style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#1a1035',letterSpacing:'-1.5px'}}>Real businesses.<br /><span className="gtd">Real results.</span></h2>
            </div>
            <div className="testi-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
              {[{n:'Maria G.',b:'Pizzeria · Long Island',q:'PostWiz posts every day and responds to my Yelp reviews automatically. I get 3x more customers finding me online. It pays for itself with one new customer.',stars:5,color:'#E1306C'},
                {n:'Jason T.',b:'Barbershop · Queens',q:'Set it up in 5 minutes. Posts to Instagram and TikTok daily, responds to Google reviews. Got 6 new clients this month just from online. Best thing I ever used.',stars:5,color:'#8b5cf6'},
                {n:'Sandra K.',b:'Boutique · Brooklyn',q:'Zero time on social media or reviews. PostWiz handles everything. Engagement up 200% and Google rating went from 4.1 to 4.8 stars.',stars:5,color:'#f97316'}
              ].map(t=>(
                <div key={t.n} className="card" style={{padding:'32px',transition:'all .3s'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-6px)';el.style.boxShadow='0 20px 60px rgba(0,0,0,.06)'}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='none';el.style.boxShadow=''}}>
                  <div style={{display:'flex',gap:2,marginBottom:16}}>{Array(t.stars).fill(0).map((_,i)=><span key={i} style={{color:t.color,fontSize:16}}>★</span>)}</div>
                  <p style={{fontSize:15,color:'rgba(26,16,53,.62)',lineHeight:1.9,marginBottom:24,fontStyle:'italic'}}>&ldquo;{t.q}&rdquo;</p>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:42,height:42,borderRadius:'50%',background:`linear-gradient(135deg,${t.color}18,${t.color}08)`,border:`1.5px solid ${t.color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:t.color,fontFamily:'Syne,sans-serif'}}>{t.n[0]}</div>
                    <div><div style={{fontSize:14,fontWeight:600,color:'#1a1035'}}>{t.n}</div><div style={{fontSize:12,color:'rgba(26,16,53,.4)',marginTop:2}}>{t.b}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section style={{background:'linear-gradient(135deg,#8b5cf6 0%,#ec4899 55%,#f97316 100%)',padding:'120px 40px',textAlign:'center'}}>
          <div style={{maxWidth:820,margin:'0 auto'}}>
            <h2 className="S" style={{fontSize:'clamp(40px,6vw,80px)',fontWeight:800,color:'#fff',letterSpacing:'-3px',lineHeight:1.0,marginBottom:20}}>Your entire online<br />presence, on autopilot.</h2>
            <p style={{fontSize:18,color:'rgba(255,255,255,.65)',marginBottom:48,fontWeight:300}}>Instagram · TikTok · Facebook · X · LinkedIn · Pinterest · Yelp · Google Reviews</p>
            <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>subscribe()} disabled={loading} className="btn" style={{background:'#fff',color:'#7c3aed',padding:'20px 52px',borderRadius:50,fontSize:18,fontWeight:700,cursor:'pointer',boxShadow:'0 12px 40px rgba(0,0,0,.18)',border:'none'}}>
                {loading?'Loading...':'Get Started Free →'}
              </button>
              <a href="#pricing" className="btn" style={{background:'rgba(255,255,255,.12)',color:'#fff',border:'1.5px solid rgba(255,255,255,.3)',padding:'20px 40px',borderRadius:50,fontSize:16,fontWeight:600,textDecoration:'none'}}>See Pricing</a>
            </div>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:13,marginTop:20}}>No credit card required · 7-day free trial · Cancel anytime</p>
          </div>
        </section>

        {/* Footer */}
        <footer style={{background:'#1a1035',padding:'40px 60px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
          <div>
            <div className="S" style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:6}}>Post<span className="gtd">Wiz</span></div>
            <p style={{color:'rgba(255,255,255,.25)',fontSize:13}}>AI-powered social media & review management</p>
          </div>
          <div style={{display:'flex',gap:32,flexWrap:'wrap'}}>
            {[['Product',['Features','Pricing','Studio','Dashboard']],['Legal',['Privacy','Terms']]].map(([cat,links])=>(
              <div key={cat as string}>
                <div style={{fontSize:12,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginBottom:12}}>{cat}</div>
                {(links as string[]).map(l=><div key={l} style={{marginBottom:8}}><a href={`/${l.toLowerCase()}`} style={{color:'rgba(255,255,255,.45)',textDecoration:'none',fontSize:14}}>{l}</a></div>)}
              </div>
            ))}
          </div>
          <p style={{color:'rgba(255,255,255,.18)',fontSize:13}}>© 2026 PostWiz. All rights reserved.</p>
        </footer>
      </main>
    </>
  )
}
