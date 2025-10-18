# Vercel Deployment Checklist

## Before Deploying

1. ✅ API keys are NOT in source code
2. ✅ All API keys use `process.env.*`
3. ✅ `.env.local` is in `.gitignore`
4. ✅ Build passes locally: `npm run build`

## Vercel Environment Variables Setup

After deploying to Vercel, you MUST set these environment variables:

### Required Variables

1. **GEMINI_API_KEY**
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add new variable
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key (get from https://aistudio.google.com/app/apikey)
   - Environment: Production, Preview, Development (select all)

2. **JUDGE0_API_KEY**
   - Name: `JUDGE0_API_KEY`
   - Value: Your Judge0 API key (get from https://rapidapi.com/judge0-official/api/judge0-ce)
   - Environment: Production, Preview, Development (select all)

3. **JUDGE0_API_HOST**
   - Name: `JUDGE0_API_HOST`
   - Value: `judge0-ce.p.rapidapi.com`
   - Environment: Production, Preview, Development (select all)

## After Setting Environment Variables

1. Go to: Vercel Dashboard → Deployments
2. Click "..." on your latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache" is UNCHECKED (forces fresh build with new env vars)

## Verify Deployment

Once deployed, test the API endpoints:

1. **Health Check:**
   ```
   https://your-app.vercel.app/api/health
   ```
   Should show:
   ```json
   {
     "status": "ok",
     "apiKeys": {
       "gemini": true,
       "geminiLength": 39,
       "judge0": true,
       "judge0Length": 50
     }
   }
   ```

2. **Test Case Generation:**
   - Open your app
   - Enter a problem description
   - Click "Generate Test Cases"
   - Should work without errors

## Common Issues

### "GEMINI_API_KEY environment variable is not set"
- Environment variables weren't set in Vercel
- Solution: Add variables and redeploy

### "fetch failed" errors
- Network/firewall issue in Vercel region
- Solution: Usually resolves itself, or try redeploying

### Build succeeds but API fails
- Environment variables set AFTER deployment
- Solution: Redeploy after setting variables (uncheck cache)

## Security Notes

- Never commit API keys to git
- If keys are exposed, immediately:
  1. Revoke old keys
  2. Generate new keys
  3. Update Vercel environment variables
  4. Redeploy

## Need Help?

Check logs:
```
Vercel Dashboard → Your Project → Deployments → [Latest] → Functions → [API Route]
```
