import Head from 'next/head'
import { useState } from 'react'

interface GeneratedPost {
  platform: string
  content: string
  scheduled: string
}

export default function Dashboard() {
  const [step, setStep] = useState<'setup' | 'dashboard'>('setup')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<GeneratedPost[]>([])
  const [copied, setCopied] = useState<number | null>(null)

  const [business, setBusiness] = useState({
    name: '',
    industry: '',
    tone: 'friendly and professional',
    description: '',
    topic: '',
  })

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business.name || !business.industry) return
    setLoading(true)
    await generatePosts()
    setStep('dashboard')
    setLoading(false)
  }

  const generatePosts = async () => {
    setGenerating(true)
    const platforms = ['Instagram', 'Facebook', 'Twitter']
    const days = ['Today 9:00 AM', 'Tomorrow 11:00 AM', 'In 2 days 3:00 PM']

    const generated: GeneratedPost[] = []

    for (let i = 0; i < platforms.length; i++) {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: business.name,
            industry: business.industry,
            tone: business.tone,
            description: business.description,
            platform: platforms[i],
            topic: business.topic,
          }),
        })
        const data = await res.json()
        generated.push({
          platform: platforms[i],
          content: data.post || 'Failed to generate post.',
          scheduled: days[i],
        })
      } catch {
        generated.push({
          platform: platforms[i],
          content: 'Error generating post. Please try again.',
          scheduled: days[i],
        })
      }
    }

    setPosts(generated)
    setGenerating(false)
  }

  const copyPost = (idx: number) => {
    navigator.clipboard.writeText(posts[idx].content)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  const platformEmoji: Record<string, string> = {
    Instagram: '📸',
    Facebook: '📘',
    Twitter: '🐦',
  }

  const platformColor: Record<string, string> = {
    Instagram: 'bg-pink-500',
    Facebook: 'bg-blue-600',
    Twitter: 'bg-sky-500',
  }

  if (step === 'setup') {
    return (
      <>
        <Head>
          <title>PostWiz – Setup Your Business</title>
        </Head>
        <main className="min-h-screen bg-dark flex items-center justify-center px-4">
          <div className="w-full max-w-lg">
            <div className="text-center mb-10">
              <div className="font-display font-bold text-3xl mb-2">
                Post<span className="text-gradient">Wiz</span>
              </div>
              <h1 className="font-display font-bold text-2xl mt-6 mb-2">Tell us about your business</h1>
              <p className="text-gray-400 font-body">Takes 2 minutes. Then AI handles everything.</p>
            </div>

            <form onSubmit={handleSetup} className="card-border rounded-2xl p-8 space-y-5">
              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">Business Name *</label>
                <input
                  type="text"
                  value={business.name}
                  onChange={e => setBusiness({ ...business, name: e.target.value })}
                  placeholder="e.g. Mario's Pizza"
                  className="w-full bg-dark border border-border rounded-xl px-4 py-3 text-white font-body placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">Industry *</label>
                <select
                  value={business.industry}
                  onChange={e => setBusiness({ ...business, industry: e.target.value })}
                  className="w-full bg-dark border border-border rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-brand-500 transition-colors"
                  required
                >
                  <option value="">Select your industry</option>
                  <option value="Restaurant / Food">Restaurant / Food</option>
                  <option value="Barbershop / Hair Salon">Barbershop / Hair Salon</option>
                  <option value="Retail / Boutique">Retail / Boutique</option>
                  <option value="Fitness / Gym">Fitness / Gym</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Healthcare / Medical">Healthcare / Medical</option>
                  <option value="Auto / Car Dealership">Auto / Car Dealership</option>
                  <option value="Law Firm">Law Firm</option>
                  <option value="Contractor / Home Services">Contractor / Home Services</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">Brand Tone</label>
                <select
                  value={business.tone}
                  onChange={e => setBusiness({ ...business, tone: e.target.value })}
                  className="w-full bg-dark border border-border rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="friendly and professional">Friendly & Professional</option>
                  <option value="casual and fun">Casual & Fun</option>
                  <option value="luxury and premium">Luxury & Premium</option>
                  <option value="bold and energetic">Bold & Energetic</option>
                  <option value="warm and community-focused">Warm & Community-Focused</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">About Your Business</label>
                <textarea
                  value={business.description}
                  onChange={e => setBusiness({ ...business, description: e.target.value })}
                  placeholder="e.g. Family-owned pizza place on Long Island, known for our garlic knots and fresh ingredients."
                  rows={3}
                  className="w-full bg-dark border border-border rounded-xl px-4 py-3 text-white font-body placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">What to post about? (optional)</label>
                <input
                  type="text"
                  value={business.topic}
                  onChange={e => setBusiness({ ...business, topic: e.target.value })}
                  placeholder="e.g. New menu item, sale, holiday promotion..."
                  className="w-full bg-dark border border-border rounded-xl px-4 py-3 text-white font-body placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-body font-semibold py-4 rounded-xl text-lg transition-all duration-200 disabled:opacity-50 mt-2"
              >
                {loading ? 'Generating your posts...' : 'Generate My Posts →'}
              </button>
            </form>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>PostWiz Dashboard</title>
      </Head>
      <main className="min-h-screen bg-dark">
        {/* Header */}
        <nav className="border-b border-border px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="font-display font-bold text-2xl">
              Post<span className="text-gradient">Wiz</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm font-body">{business.name}</span>
              <button
                onClick={generatePosts}
                disabled={generating}
                className="bg-brand-500 hover:bg-brand-600 text-white font-body font-semibold px-4 py-2 rounded-full text-sm transition-all duration-200 disabled:opacity-50"
              >
                {generating ? 'Generating...' : '+ Generate New Posts'}
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Posts This Week', value: posts.length.toString() },
              { label: 'Platforms Connected', value: '2' },
              { label: 'Hours Saved', value: '4.5' },
            ].map(s => (
              <div key={s.label} className="card-border rounded-xl p-5 text-center">
                <div className="font-display font-bold text-3xl text-brand-400 mb-1">{s.value}</div>
                <div className="text-gray-400 text-sm font-body">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Posts */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display font-bold text-2xl">Upcoming Posts</h2>
            {generating && (
              <div className="flex items-center gap-2 text-brand-400 text-sm font-body">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></div>
                AI is writing your posts...
              </div>
            )}
          </div>

          {posts.length === 0 && !generating ? (
            <div className="card-border rounded-2xl p-12 text-center">
              <p className="text-gray-500 font-body">No posts yet. Click "Generate New Posts" to start.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, idx) => (
                <div key={idx} className="card-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platformEmoji[post.platform]}</span>
                      <div>
                        <span className={`${platformColor[post.platform]} text-white text-xs font-body font-semibold px-2 py-1 rounded-full`}>
                          {post.platform}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm font-body">Scheduled: {post.scheduled}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyPost(idx)}
                        className="text-gray-400 hover:text-white text-sm font-body px-3 py-1.5 border border-border rounded-lg transition-colors"
                      >
                        {copied === idx ? '✓ Copied!' : 'Copy'}
                      </button>
                      <button className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-body px-3 py-1.5 rounded-lg transition-colors">
                        Approve & Schedule
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-200 font-body leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Generate more */}
          <div className="mt-8 card-border rounded-2xl p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Generate Posts on a New Topic</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={business.topic}
                onChange={e => setBusiness({ ...business, topic: e.target.value })}
                placeholder="e.g. Weekend special, new product, holiday sale..."
                className="flex-1 bg-dark border border-border rounded-xl px-4 py-3 text-white font-body placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                onClick={generatePosts}
                disabled={generating}
                className="bg-brand-500 hover:bg-brand-600 text-white font-body font-semibold px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
              >
                {generating ? 'Writing...' : 'Generate →'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
