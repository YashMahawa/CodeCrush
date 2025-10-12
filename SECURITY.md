# 🔐 Security Best Practices for CodeCrush

## ✅ What We Did Right

### 1. Environment Variables (Not Hardcoded)
```typescript
// ❌ NEVER do this:
const API_KEY = "AIzaSyDNk28sjdjgvVWhSE-ayn_8i4xt9a1gmb8";

// ✅ ALWAYS do this:
const API_KEY = process.env.GEMINI_API_KEY!;
```

**Why?** Hardcoded keys end up in GitHub history forever and can be stolen.

---

### 2. .gitignore Protection
```
# .gitignore includes:
.env*.local
.env
```

**Why?** This ensures `.env.local` with your real API keys never gets committed to GitHub.

---

### 3. API Keys Only on Server-Side
```typescript
// ✅ This is in an API route (server-side)
// File: src/app/api/generate-testcases/route.ts
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
```

**Why?** API routes run on the server (Vercel's backend), not in the browser. Keys are never exposed to users.

---

### 4. Environment Variables in Vercel Dashboard
- Stored securely in Vercel's encrypted vault
- Not visible in GitHub
- Not visible in browser DevTools
- Only accessible to your deployed backend

---

## 🚨 What Could Go Wrong (and How We Prevented It)

### Scenario 1: Accidental Commit of .env.local
**Risk:** API keys exposed in GitHub

**Prevention:**
- `.env.local` is in `.gitignore`
- Even if you try to commit it, Git will refuse

**If it happens anyway:**
1. **Immediately revoke the API keys:**
   - Gemini: Go to [AI Studio](https://aistudio.google.com/app/apikey) → Delete key → Create new one
   - Judge0: Go to [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard) → Regenerate key
2. Update keys in Vercel dashboard
3. Redeploy

---

### Scenario 2: Keys Exposed in Browser
**Risk:** Users inspect DevTools and find your API keys

**Prevention:**
- All API calls to Gemini/Judge0 happen in Next.js API routes (server-side)
- Frontend only calls `/api/generate-testcases` and `/api/run-code`
- Keys never reach the browser

**How to verify:**
1. Open your deployed site
2. Press F12 → Network tab
3. Trigger "Generate Test Cases"
4. You'll see request to `/api/generate-testcases` (your server)
5. You'll NOT see request to `generativelanguage.googleapis.com` (Gemini's server)

---

### Scenario 3: API Abuse / Rate Limiting
**Risk:** Someone spams your API endpoints and exhausts your quotas

**Prevention (Current):**
- Judge0 free tier: 50 requests/day (low enough to not be a huge issue)
- Gemini free tier: 1,500 requests/day (generous)
- If abuse happens, you'll just hit rate limits

**Prevention (If App Becomes Popular):**
Add rate limiting on YOUR API routes:

```typescript
// Future enhancement: Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per 15 minutes per IP
});
```

---

## 📚 API Key Management Best Practices

### For Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in your API keys
3. **Never** commit `.env.local`

### For Production (Vercel)
1. Add keys in Vercel Dashboard → Settings → Environment Variables
2. Keys are encrypted at rest
3. Keys are only accessible to your backend code

### For Team Collaboration
If you're working with others:
1. Share `.env.example` (template with no real keys)
2. Each team member creates their own `.env.local`
3. Use separate API keys for different team members (for tracking)

---

## 🔍 How to Audit Your Security

### Check 1: Search for Hardcoded Keys
```bash
cd /home/yash/CodeCrush
grep -r "AIzaSy" src/
grep -r "2cb3da8c" src/
```

**Expected result:** No matches (keys should only be in `.env.local`)

### Check 2: Verify .gitignore
```bash
cat .gitignore | grep ".env"
```

**Expected result:** Should see `.env*.local` and `.env`

### Check 3: Check Git History
```bash
git log --all --full-history --source -- .env.local
```

**Expected result:** No commits found (file was never tracked)

---

## 🛡️ Additional Security Measures (Optional)

### 1. API Key Rotation
**When to rotate:**
- Every 90 days (good practice)
- Immediately if you suspect compromise
- When a team member leaves

**How:**
1. Generate new keys from provider
2. Update Vercel environment variables
3. Redeploy
4. Delete old keys

### 2. IP Whitelisting (Advanced)
Some APIs allow restricting keys to specific IP addresses:
- Not practical for Vercel (dynamic IPs)
- More suitable for fixed-IP servers

### 3. Monitoring & Alerts
Set up alerts for unusual usage:

**Gemini API:**
- Check quota usage at [AI Studio](https://aistudio.google.com/)
- Set up Google Cloud monitoring (if using paid tier)

**Judge0 API:**
- Monitor usage at [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
- Receive email alerts when approaching limits

---

## 📋 Security Checklist

Before deploying to production, verify:

- [x] API keys are in environment variables (not hardcoded)
- [x] `.env.local` is in `.gitignore`
- [x] `.env.local` has never been committed to Git
- [x] API keys are added to Vercel dashboard
- [x] API calls to external services happen server-side only
- [x] Frontend never directly accesses Gemini or Judge0
- [x] Input validation is in place (problem description length, etc.)
- [x] Error messages don't expose sensitive information

---

## 🚨 What to Do If Keys Are Compromised

### Immediate Actions (Within 1 hour):
1. **Revoke compromised keys immediately**
2. **Generate new keys**
3. **Update Vercel environment variables**
4. **Redeploy application**

### Investigation (Within 24 hours):
1. Check API usage logs for suspicious activity
2. Review GitHub commit history
3. Check who had access to keys

### Prevention (Ongoing):
1. Rotate keys quarterly
2. Use separate keys for dev/staging/prod
3. Monitor API usage regularly

---

## 📖 Further Reading

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Vercel Environment Variables Best Practices](https://vercel.com/docs/projects/environment-variables)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## 🎓 Key Takeaways

1. **Never hardcode API keys** → Use environment variables
2. **Never commit .env files** → Use .gitignore
3. **Keep keys server-side** → Use Next.js API routes
4. **Monitor usage** → Set up alerts
5. **Rotate regularly** → Update keys quarterly

---

**Your API keys are currently secure because:**
- ✅ They're only in `.env.local` (ignored by Git)
- ✅ They're stored in Vercel's encrypted vault
- ✅ They're only used server-side (Next.js API routes)
- ✅ They're never exposed to the browser
- ✅ They're not hardcoded anywhere in the source code

**Keep it that way!** 🔒
