import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Master account credentials
  const MASTER = { email: 'admin@postwiz.co', password: 'PostWiz2026!' }

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    await new Promise(r => setTimeout(r, 800)) // simulate network

    if (mode === 'login') {
      if (form.email === MASTER.email && form.password === MASTER.password) {
        localStorage.setItem('pw_user', JSON.stringify({ email: MASTER.email, name: 'Admin', plan: 'Agency', master: true }))
        router.push('/studio')
      } else if (form.email && form.password.length >= 6) {
        // Simulate any user login working for demo
        localStorage.setItem('pw_user', JSON.stringify({ email: form.email, name: form.email.split('@')[0], plan: 'Growth', master: false }))
        router.push('/studio')
      } else {
        setError('Invalid email or password.')
      }
    } else {
      if (!form.name || !form.email || form.password.length < 6) {
        setError('Please fill all fields. Password must be at least 6 characters.')
      } else {
        localStorage.setItem('pw_user', JSON.stringify({ email: form.email, name: form.name, plan: 'Starter', master: false }))
        router.push('/studio')
      }
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Log In' : 'Sign Up'} - PostWiz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f8f7ff;font-family:'Inter',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
        .S{font-family:'Syne',sans-serif}
        .gt{background:linear-gradient(135deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .gtd{background:linear-gradient(135deg,#7c3aed,#db2777);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .inp{width:100%;background:#fff;border:1.5px solid rgba(139,92,246,.15);border-radius:12px;padding:14px 18px;font-family:'Inter',sans-serif;font-size:15px;color:#1a1035;outline:none;transition:border-color .2s}
        .inp:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.08)}
        .inp::placeholder{color:rgba(26,16,53,.3)}
        @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,20px)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .card{animation:slideUp .4s ease}
      `}</style>

      {/* Background orbs */}
      <div style={{position:'fixed',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.14) 0%,transparent 65%)',top:'-10%',left:'-10%',animation:'orb1 18s ease-in-out infinite',pointerEvents:'none',zIndex:0}} />
      <div style={{position:'fixed',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,.1) 0%,transparent 65%)',bottom:'-10%',right:'-10%',animation:'orb2 22s ease-in-out infinite',pointerEvents:'none',zIndex:0}} />

      <div style={{width:'100%',maxWidth:440,position:'relative',zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <a href="/" style={{textDecoration:'none'}}>
            <div className="S" style={{fontSize:28,fontWeight:800,color:'#1a1035'}}>Post<span className="gtd">Wiz</span></div>
          </a>
          <p style={{fontSize:14,color:'rgba(26,16,53,.4)',marginTop:6}}>
            {mode==='login' ? 'Welcome back' : 'Start your free trial'}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{background:'#fff',borderRadius:28,border:'1px solid rgba(139,92,246,.08)',boxShadow:'0 8px 40px rgba(139,92,246,.08)',padding:'40px 36px'}}>

          {/* Tab switcher */}
          <div style={{display:'flex',background:'rgba(139,92,246,.06)',borderRadius:14,padding:4,marginBottom:28}}>
            {(['login','signup'] as const).map(m => (
              <button key={m} onClick={()=>{setMode(m);setError('')}} style={{flex:1,padding:'10px',borderRadius:10,border:'none',fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer',transition:'all .2s',background:mode===m?'#fff':'transparent',color:mode===m?'#1a1035':'rgba(26,16,53,.45)',boxShadow:mode===m?'0 2px 8px rgba(0,0,0,.06)':'none'}}>
                {m==='login'?'Log In':'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} style={{display:'flex',flexDirection:'column',gap:16}}>
            {mode==='signup' && (
              <div>
                <label style={{fontSize:13,fontWeight:500,color:'rgba(26,16,53,.55)',display:'block',marginBottom:8}}>Full Name</label>
                <input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Maria Garcia" required={mode==='signup'} />
              </div>
            )}
            <div>
              <label style={{fontSize:13,fontWeight:500,color:'rgba(26,16,53,.55)',display:'block',marginBottom:8}}>Email Address</label>
              <input className="inp" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@business.com" required />
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <label style={{fontSize:13,fontWeight:500,color:'rgba(26,16,53,.55)'}}>Password</label>
                {mode==='login' && <a href="#" style={{fontSize:12,color:'#8b5cf6',textDecoration:'none'}}>Forgot password?</a>}
              </div>
              <input className="inp" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder={mode==='login'?'Your password':'Min. 6 characters'} required />
            </div>

            {error && (
              <div style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#dc2626'}}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{background:'linear-gradient(135deg,#8b5cf6,#ec4899)',color:'#fff',border:'none',borderRadius:14,padding:'15px',fontSize:16,fontWeight:600,fontFamily:'Inter,sans-serif',cursor:loading?'not-allowed':'pointer',opacity:loading?.7:1,boxShadow:'0 8px 28px rgba(139,92,246,.28)',transition:'all .25s',marginTop:4}}>
              {loading ? 'Please wait...' : mode==='login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{display:'flex',alignItems:'center',gap:12,margin:'24px 0'}}>
            <div style={{flex:1,height:1,background:'rgba(139,92,246,.1)'}} />
            <span style={{fontSize:12,color:'rgba(26,16,53,.3)',fontWeight:500}}>or continue with</span>
            <div style={{flex:1,height:1,background:'rgba(139,92,246,.1)'}} />
          </div>

          {/* Social logins */}
          <div style={{display:'flex',gap:10}}>
            {[{icon:'G', label:'Google', color:'#4285F4'}, {icon:'f', label:'Facebook', color:'#1877F2'}].map(s => (
              <button key={s.label} onClick={()=>{
                localStorage.setItem('pw_user', JSON.stringify({ email: `user@${s.label.toLowerCase()}.com`, name: 'Demo User', plan: 'Growth', master: false }))
                router.push('/studio')
              }} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px',border:'1.5px solid rgba(139,92,246,.12)',borderRadius:12,background:'#fff',cursor:'pointer',fontSize:14,fontWeight:500,color:'#1a1035',fontFamily:'Inter,sans-serif',transition:'all .2s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(139,92,246,.3)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(139,92,246,.12)'}>
                <span style={{fontWeight:700,color:s.color}}>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          {mode==='signup' && (
            <p style={{fontSize:12,color:'rgba(26,16,53,.35)',textAlign:'center',marginTop:20,lineHeight:1.6}}>
              By signing up you agree to our <a href="/terms" style={{color:'#8b5cf6',textDecoration:'none'}}>Terms</a> and <a href="/privacy" style={{color:'#8b5cf6',textDecoration:'none'}}>Privacy Policy</a>
            </p>
          )}
        </div>

        {/* Master account hint */}
        <div style={{background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.15)',borderRadius:16,padding:'14px 18px',marginTop:16,textAlign:'center'}}>
          <p style={{fontSize:12,color:'rgba(26,16,53,.5)',marginBottom:6}}>Master account access</p>
          <p style={{fontSize:12,color:'#8b5cf6',fontWeight:600}}>admin@postwiz.co / PostWiz2026!</p>
        </div>

        <p style={{textAlign:'center',marginTop:20,fontSize:13,color:'rgba(26,16,53,.35)'}}>
          {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}} style={{background:'none',border:'none',color:'#8b5cf6',fontWeight:600,cursor:'pointer',fontSize:13,fontFamily:'Inter,sans-serif'}}>
            {mode==='login' ? 'Sign up free' : 'Log in'}
          </button>
        </p>
      </div>
    </>
  )
}
