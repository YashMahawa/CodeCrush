# 🚀 Vercel Deployment Guide

This guide walks you through deploying CodeCrush to Vercel with proper environment variable configuration.

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Vercel account (free tier is perfect)
- [x] API keys ready (Gemini + Judge0)

---

## Step 1: Push Code to GitHub (5 minutes)

### 1.1 Create a New GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository:
   - **Name:** `codecrush` (or any name you prefer)
   - **Visibility:** Public or Private (your choice)
   - **DO NOT** initialize with README (we already have one)
3. Click "Create repository"

### 1.2 Push Your Code

```bash
cd /home/yash/CodeCrush

# Add GitHub remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/codecrush.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**⚠️ IMPORTANT:** The `.env.local` file will NOT be pushed to GitHub because it's in `.gitignore`. This is correct and secure!

---

## Step 2: Connect Vercel to GitHub (3 minutes)

### 2.1 Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" (or "Log In")
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 2.2 Import Your Repository

1. On Vercel dashboard, click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find `codecrush` and click **"Import"**

---

## Step 3: Configure Environment Variables (CRITICAL - 5 minutes)

This is the most important step! Without these, your app won't work.

### 3.1 In the Vercel Import Screen

Before clicking "Deploy", scroll down to find **"Environment Variables"** section.

### 3.2 Add Each Variable

Click **"Add"** for each of the following:

#### Variable 1: GEMINI_API_KEY
- **Key:** `GEMINI_API_KEY`
- **Value:** `AIzaSyDNk28sjdjgvVWhSE-ayn_8i4xt9a1gmb8`
- **Environment:** Production, Preview, Development (select all three)

#### Variable 2: JUDGE0_API_KEY
- **Key:** `JUDGE0_API_KEY`
- **Value:** `2cb3da8c74msh204ef9ce17ae689p172370jsna6a2ec3a8359`
- **Environment:** Production, Preview, Development (select all three)

#### Variable 3: JUDGE0_API_HOST
- **Key:** `JUDGE0_API_HOST`
- **Value:** `judge0-ce.p.rapidapi.com`
- **Environment:** Production, Preview, Development (select all three)

### 3.3 Visual Guide

It should look like this:

```
Environment Variables
┌────────────────────────────────────────────────────────┐
│ Key: GEMINI_API_KEY                                    │
│ Value: AIzaSyDNk28sjdjgvVWhSE-ayn_8i4xt9a1gmb8        │
│ [x] Production  [x] Preview  [x] Development          │
├────────────────────────────────────────────────────────┤
│ Key: JUDGE0_API_KEY                                    │
│ Value: 2cb3da8c74msh204ef9ce17ae689p172370jsna6a2e... │
│ [x] Production  [x] Preview  [x] Development          │
├────────────────────────────────────────────────────────┤
│ Key: JUDGE0_API_HOST                                   │
│ Value: judge0-ce.p.rapidapi.com                        │
│ [x] Production  [x] Preview  [x] Development          │
└────────────────────────────────────────────────────────┘
```

---

## Step 4: Deploy! (2 minutes)

1. After adding all three environment variables, click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your Next.js app (`next build`)
   - Deploy to their global edge network
3. Wait 2-3 minutes for the build to complete
4. You'll see: **"Congratulations! Your project has been deployed."**

---

## Step 5: Test Your Deployment (2 minutes)

### 5.1 Open Your Live App

1. Click **"Visit"** or the deployment URL (looks like: `codecrush-xyz123.vercel.app`)
2. Your CodeCrush app should load with the beautiful holographic UI!

### 5.2 Test the Features

**Test 1: Generate Test Cases**
```
Problem: Write a program to add two numbers
Input: Two integers on one line
Output: Their sum
```
Click "Generate Test Cases" → Should see AI-generated test cases

**Test 2: Run Code**
```c
#include <stdio.h>
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\n", a + b);
    return 0;
}
```
Custom Input: `5 3`
Click "Run" → Should see output: `8`

**Test 3: Evaluate**
Click "Evaluate" → Should run all test cases and show results!

---

## 🎊 You're Live!

Your CodeCrush app is now:
- ✅ Deployed on Vercel's global CDN
- ✅ Accessible from anywhere in the world
- ✅ Automatically rebuilds on GitHub pushes
- ✅ Has HTTPS enabled by default
- ✅ Environment variables are secure (not in GitHub)

---

## 📝 Important Notes

### About Environment Variables

**✅ Correct (Secure):**
- Environment variables are stored in Vercel dashboard
- They are NOT visible in your GitHub repository
- They are encrypted and secure on Vercel's servers
- Only your deployed app can access them

**❌ Wrong (Insecure):**
- Never commit `.env.local` to GitHub
- Never hardcode API keys in your source code
- The `.gitignore` file already protects you from this

### Your Deployment URL

Vercel gives you a URL like: `codecrush-xyz123.vercel.app`

You can:
1. **Use this URL directly** (it works perfectly!)
2. **Add a custom domain** (go to Project Settings → Domains)
   - Example: `codecrush.yourdomain.com`
   - Vercel provides free SSL certificates

---

## 🔄 Updating Your App

Whenever you make changes:

```bash
# Make your code changes
git add .
git commit -m "Add new feature"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build the new version
3. Deploy it (takes ~2 minutes)
4. Your live site updates automatically!

---

## 🐛 Troubleshooting

### "Failed to generate test cases"

**Check:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `GEMINI_API_KEY` is set correctly
3. Click "Redeploy" after fixing

### "Failed to execute code"

**Check:**
1. Verify `JUDGE0_API_KEY` is set correctly
2. Check if you've exceeded Judge0 rate limits (50 requests/day on free tier)
3. Go to [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard) to check usage

### "Build failed"

**Check:**
1. Look at the build logs in Vercel dashboard
2. Make sure all dependencies are in `package.json`
3. Try running `npm run build` locally first

### Environment variables not working

**Solution:**
1. Go to Project Settings → Environment Variables
2. Delete and re-add the variables
3. Make sure to select all environments (Production, Preview, Development)
4. Click "Redeploy" at the top

---

## 📊 Monitoring & Analytics

### View Deployment Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Click on a deployment
4. View real-time logs and errors

### Check API Usage

**Gemini API:**
- Go to [Google AI Studio](https://aistudio.google.com/)
- Check your usage and quotas

**Judge0 API:**
- Go to [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
- Check your request count (50/day on free tier)

---

## 💰 Cost Breakdown

### Vercel (Hosting)
- **Free Tier:**
  - 100GB bandwidth/month
  - Unlimited deployments
  - Custom domains
  - **Cost: $0/month** ✅

### Gemini API
- **Free Tier:**
  - 15 requests/minute
  - 1,500 requests/day
  - **Cost: $0** (generous free tier) ✅

### Judge0 API (via RapidAPI)
- **Free Tier:**
  - 50 requests/day
  - **Cost: $0/month** ✅
  - **Upgrade if needed:** $5/month for 2,000 requests/day

**Total Cost to Run CodeCrush: $0/month** 🎉

---

## 🚀 Next Steps

Now that you're deployed:

1. **Share with friends!** Send them your Vercel URL
2. **Add to your portfolio** with screenshots
3. **Continue development:**
   - Implement AI Debugger (Phase 4)
   - Add confetti animations (Phase 3)
   - Create shareable session links
4. **Star your GitHub repo** and share on social media!

---

## 🎨 Optional: Custom Domain

Want `codecrush.com` instead of `codecrush-xyz.vercel.app`?

1. Buy a domain (e.g., from [Namecheap](https://www.namecheap.com/))
2. In Vercel Dashboard → Your Project → Settings → Domains
3. Add your custom domain
4. Follow Vercel's instructions to update DNS records
5. Vercel automatically provisions SSL certificate
6. Your app is live on your custom domain! 🎊

---

**Deployment Time:** ~15 minutes  
**Difficulty:** Easy  
**Cost:** $0  
**Result:** Production-ready app accessible worldwide! 🌍

---

*Congratulations! CodeCrush is now crushing it on the web! 🚀*
