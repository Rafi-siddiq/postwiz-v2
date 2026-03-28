import Head from 'next/head'
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Home() {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
    } catch (e) {
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>PostWiz – AI Social Media Manager for Small Businesses</title>
        <meta name="description" content="PostWiz writes and schedules your social media posts automatically. Powered by AI. Built for small businesses." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-dark">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <div className="font-display font-bold text-2xl">
            Post<span className="text-gradient">Wiz</span>
          </div>
          <button
            onClick={handleSubscribe}
            className="bg-brand-500 hover:bg-brand-600 text-white font-body font-semibold px-5 py-2.5 rounded-full text-sm transition-all duration-200"
          >
            Start Free Trial
          </button>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-900 border border-brand-600 text-brand-400 text-xs font-body font-semibold px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse-green inline-block"></span>
            AI-Powered · Fully Automated · $29/month
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6">
            Your social media,<br />
            <span className="text-gradient">run by AI.</span>
          </h1>

          <p className="font-body text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            PostWiz writes, schedules, and posts to Instagram, Facebook, and more — automatically.
            Tell us about your business once. We handle the rest.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 glow text-white font-body font-semibold px-8 py-4 rounded-full text-lg transition-all duration-200 disabled:opacity-50 w-full sm:w-auto"
            >
              {loading ? 'Loading...' : 'Start 7-Day Free Trial →'}
            </button>
            <p className="text-gray-500 text-sm font-body">No credit card required to start</p>
          </div>

          {/* Mock UI Preview */}
          <div className="mt-20 card-border rounded-2xl p-6 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-500 text-xs font-body ml-2">postwiz.co/dashboard</span>
            </div>
            <div className="space-y-3">
              <div className="bg-dark rounded-xl p-4 border border-border">
                <p className="text-xs text-gray-500 font-body mb-1">📸 Instagram · Scheduled for Tomorrow 9am</p>
                <p className="text-white font-body text-sm">Fresh ingredients. Better pizza. Stop in today and try our new garlic knot special — your taste buds will thank you. 🍕 #pizzanight #longislandeats #freshdaily</p>
              </div>
              <div className="bg-dark rounded-xl p-4 border border-border">
                <p className="text-xs text-gray-500 font-body mb-1">📘 Facebook · Scheduled for Tomorrow 11am</p>
                <p className="text-white font-body text-sm">It's that time of year again — our famous garlic knot special is back and better than ever. Come taste the difference fresh makes. Order online or stop by!</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></div>
                <p className="text-brand-400 text-xs font-body">AI generating next week's posts...</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-24 border-t border-border">
          <h2 className="font-display font-bold text-4xl text-center mb-4">How PostWiz works</h2>
          <p className="text-gray-400 text-center font-body mb-16 text-lg">Three steps. Then it runs itself.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Tell us about your business', desc: 'Your name, industry, tone, and what you sell. Takes 2 minutes.' },
              { step: '02', title: 'AI writes your posts', desc: 'PostWiz generates a full week of platform-optimized content automatically.' },
              { step: '03', title: 'Posts go live automatically', desc: 'Approve with one click or let it post fully on autopilot. You\'re done.' },
            ].map((item) => (
              <div key={item.step} className="card-border rounded-2xl p-8">
                <div className="text-brand-500 font-display font-bold text-5xl mb-4 opacity-40">{item.step}</div>
                <h3 className="font-display font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-gray-400 font-body leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-24 border-t border-border">
          <h2 className="font-display font-bold text-4xl text-center mb-16">Everything you need. Nothing you don't.</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '🤖', title: 'AI-Written Posts', desc: 'Claude AI writes engaging captions tailored to your brand voice and industry.' },
              { icon: '📅', title: 'Auto-Scheduling', desc: 'Posts go live at the best times for your audience. Set it and forget it.' },
              { icon: '📱', title: 'Multi-Platform', desc: 'Instagram, Facebook, and more — all managed from one simple dashboard.' },
              { icon: '🏷️', title: 'Smart Hashtags', desc: 'AI picks the best hashtags for reach and discoverability automatically.' },
              { icon: '📊', title: 'Post Analytics', desc: 'See what\'s working and what\'s not with simple, clear performance data.' },
              { icon: '✏️', title: 'One-Click Edit', desc: 'Not happy with a post? Edit it in seconds before it goes live.' },
            ].map((f) => (
              <div key={f.title} className="card-border rounded-xl p-6 flex gap-4 items-start">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-display font-semibold text-lg mb-1">{f.title}</h3>
                  <p className="text-gray-400 font-body text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-6xl mx-auto px-6 py-24 border-t border-border">
          <h2 className="font-display font-bold text-4xl text-center mb-4">Simple pricing</h2>
          <p className="text-gray-400 text-center font-body mb-16 text-lg">Less than one hour of a social media manager's time.</p>

          <div className="max-w-md mx-auto card-border rounded-2xl p-8 glow">
            <div className="text-center mb-8">
              <div className="text-brand-400 font-body font-semibold text-sm mb-2 uppercase tracking-widest">Everything Included</div>
              <div className="font-display font-extrabold text-6xl mb-1">$29</div>
              <div className="text-gray-400 font-body">per month</div>
            </div>

            <ul className="space-y-4 mb-8 font-body">
              {[
                'Unlimited AI-generated posts',
                'Auto-scheduling & publishing',
                'Instagram + Facebook',
                'Smart hashtag suggestions',
                'Post performance analytics',
                'Cancel anytime',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-gray-300">
                  <span className="text-brand-400 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-body font-semibold py-4 rounded-xl text-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Start 7-Day Free Trial'}
            </button>
            <p className="text-center text-gray-500 text-xs font-body mt-3">7 days free · then $29/month · cancel anytime</p>
          </div>
        </section>

        {/* Social proof */}
        <section className="max-w-6xl mx-auto px-6 py-24 border-t border-border">
          <h2 className="font-display font-bold text-4xl text-center mb-16">Small businesses love PostWiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Maria G.', biz: 'Pizza Restaurant, NY', quote: 'I was posting maybe once a week. Now PostWiz posts every day and I get way more customers finding me online.' },
              { name: 'Jason T.', biz: 'Barbershop Owner', quote: 'This thing is insane. I told it about my shop and it just... posts for me. Got 3 new clients this week from Instagram.' },
              { name: 'Sandra K.', biz: 'Boutique Owner', quote: 'I used to spend hours trying to think of what to post. Now I spend zero minutes. Honestly best $29 I spend all month.' },
            ].map((t) => (
              <div key={t.name} className="card-border rounded-xl p-6">
                <p className="text-gray-300 font-body leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-display font-semibold">{t.name}</p>
                  <p className="text-gray-500 text-sm font-body">{t.biz}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-24 border-t border-border text-center">
          <h2 className="font-display font-extrabold text-5xl mb-6">
            Ready to put social media<br />
            <span className="text-gradient">on autopilot?</span>
          </h2>
          <p className="text-gray-400 font-body text-xl mb-10">Join hundreds of small businesses saving hours every week.</p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-600 glow text-white font-body font-semibold px-10 py-5 rounded-full text-xl transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Start Free Trial — No Credit Card Needed'}
          </button>
        </section>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-display font-bold text-xl">
            Post<span className="text-gradient">Wiz</span>
          </div>
          <p className="text-gray-500 text-sm font-body">© 2026 PostWiz. All rights reserved.</p>
          <div className="flex gap-6 text-gray-500 text-sm font-body">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
        </footer>
      </main>
    </>
  )
}
