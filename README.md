# PostWiz — AI Social Media Manager

## What This Is
A full SaaS app that generates and schedules social media posts for small businesses using AI.
- Landing page with Stripe checkout
- Dashboard where users generate posts
- AI post generation via Claude API
- $29/month subscription with 7-day free trial

## Deploy to Vercel (10 minutes)

### Step 1: Install Git (if you don't have it)
Download from: https://git-scm.com/downloads

### Step 2: Create a GitHub repo
1. Go to github.com → New Repository
2. Name it "postwiz"
3. Keep it private
4. Click "Create repository"

### Step 3: Push this code to GitHub
Open Terminal (Mac) or Command Prompt (Windows) in this folder and run:

```bash
git init
git add .
git commit -m "Initial PostWiz build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/postwiz.git
git push -u origin main
```

### Step 4: Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your postwiz GitHub repo
3. Click Deploy (Vercel auto-detects Next.js)

### Step 5: Add Environment Variables on Vercel
In your Vercel project → Settings → Environment Variables, add:

```
ANTHROPIC_API_KEY=your_key_here
STRIPE_SECRET_KEY=your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key_here
NEXT_PUBLIC_URL=https://postwiz.co
```

### Step 6: Connect your domain
1. In Vercel → Project → Settings → Domains
2. Add: postwiz.co
3. Vercel gives you DNS records
4. Go to Namecheap → postwiz.co → Advanced DNS
5. Add the records Vercel gives you
6. Wait 10-30 minutes for DNS to propagate

### Step 7: Set up Stripe Webhook (important for subscriptions)
1. Go to stripe.com → Developers → Webhooks
2. Add endpoint: https://postwiz.co/api/webhook
3. Select events: customer.subscription.created, customer.subscription.deleted
4. Copy the webhook secret and add it to Vercel env vars as STRIPE_WEBHOOK_SECRET

## That's it! Your app is live at postwiz.co

## What to do next
1. Test the checkout flow with a real card
2. Set up Google Analytics on the landing page
3. Run Facebook/Instagram ads targeting small business owners
4. Post about it on Reddit r/smallbusiness

## Monthly Costs
- Vercel: Free (up to 100GB bandwidth)
- Domain: $12/year (already paid)
- Anthropic API: ~$0.01 per post generation, ~$20/month at scale
- Stripe: 2.9% + 30¢ per transaction

## Revenue Math
- 50 customers = $1,450/month
- 100 customers = $2,900/month
- 200 customers = $5,800/month
