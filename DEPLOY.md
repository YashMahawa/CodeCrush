# 🚀 GitHub & Vercel Deployment Guide

## Step 1: Push to GitHub

### Create a new repository on GitHub
1. Go to https://github.com/new
2. Repository name: `codecrush` (or any name you prefer)
3. Make it **Public** or **Private**
4. **DO NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

### Push your code
Run these commands in your terminal:

```bash
cd /home/yash/CodeCrush

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/codecrush.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Website (Recommended)

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Click "Sign Up" or "Log In" (use your GitHub account)

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Find your `codecrush` repository and click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

4. **Add Environment Variables:**
   Click "Environment Variables" and add:
   
   ```
   Name: GEMINI_API_KEY
   Value: AIzaSyDNk28sjdjgvVWhSE-ayn_8i4xt9a1gmb8
   
   Name: JUDGE0_API_KEY
   Value: 2cb3da8c74msh204ef9ce17ae689p172370jsna6a2ec3a8359
   
   Name: JUDGE0_API_HOST
   Value: judge0-ce.p.rapidapi.com
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 1-2 minutes for build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? codecrush
# - Directory? ./ (press Enter)
# - Override settings? N

# Add environment variables
vercel env add GEMINI_API_KEY
# Paste: AIzaSyDNk28sjdjgvVWhSE-ayn_8i4xt9a1gmb8
# Environment: Production

vercel env add JUDGE0_API_KEY
# Paste: 2cb3da8c74msh204ef9ce17ae689p172370jsna6a2ec3a8359
# Environment: Production

vercel env add JUDGE0_API_HOST
# Type: judge0-ce.p.rapidapi.com
# Environment: Production

# Deploy to production
vercel --prod
```

---

## Step 3: Verify Deployment

1. Visit your Vercel URL (e.g., `https://codecrush.vercel.app`)
2. Test the features:
   - ✅ Generate test cases (tests Gemini API)
   - ✅ Run code (tests Judge0 API)
   - ✅ Evaluate against test cases

---

## Troubleshooting

### API Not Working
- Check environment variables in Vercel dashboard
- Ensure no extra spaces in API keys
- Check Vercel deployment logs for errors

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try redeploying

### 404 Errors
- Ensure you're using Next.js 14+ App Router structure
- Check that API routes are in `src/app/api/` directory

---

## Next Steps

### Custom Domain (Optional)
1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain and follow DNS instructions

### Auto-Deploy on Push
Vercel automatically redeploys when you push to GitHub:
```bash
# Make changes to your code
git add .
git commit -m "feat: Add new feature"
git push origin main

# Vercel will automatically rebuild and deploy
```

### Monitor Usage
- Check API usage at https://aistudio.google.com/app/apikey
- Monitor Judge0 usage at https://rapidapi.com/judge0-official/api/judge0-ce

---

## 🎉 You're Live!

Share your CodeCrush deployment with the world! 🚀

Your app: `https://your-project-name.vercel.app`
