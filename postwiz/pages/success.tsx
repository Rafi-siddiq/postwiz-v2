import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Success() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Welcome to PostWiz!</title>
      </Head>
      <main className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <div className="font-display font-bold text-3xl mb-2">
            Welcome to Post<span className="text-gradient">Wiz</span>!
          </div>
          <p className="text-gray-400 font-body text-lg mb-8">
            Your 7-day free trial has started. Let's set up your business and generate your first posts.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-brand-500 hover:bg-brand-600 text-white font-body font-semibold px-8 py-4 rounded-full text-lg transition-all duration-200"
          >
            Set Up My Account →
          </button>
        </div>
      </main>
    </>
  )
}
