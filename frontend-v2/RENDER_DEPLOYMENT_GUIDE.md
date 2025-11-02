# 🚀 Render Deployment Guide - Frontend-v2 (Next.js)

**Created:** 2025-11-02  
**Frontend:** Next.js 16 (Turbopack)  
**Backend:** https://ttaibtback.onrender.com ✅

---

## 📋 Deployment Steps

### Step 1: Service Configuration

**When creating Static Site on Render:**

| Setting | Value |
|---------|-------|
| **Name** | `aibt-frontend-v2` (or your preferred name) |
| **Region** | Same as backend (Oregon recommended) |
| **Branch** | `main` |
| **Root Directory** | `frontend-v2` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `out` |

---

### Step 2: Add Build Environment Variables

**In Render Dashboard → Environment Tab, add these:**

```
NEXT_PUBLIC_API_URL=https://ttaibtback.onrender.com

NEXT_PUBLIC_SUPABASE_URL=https://lfewxxeiplfycmymzmjz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTAxNDUsImV4cCI6MjA3NzMyNjE0NX0.qQN-zUgDgtuVl2oxyUJ8bYqeNDIRKy5oM1gomg2hBTk

NODE_ENV=production
```

**⚠️ CRITICAL:**
- `NEXT_PUBLIC_API_URL` MUST point to your deployed backend: `https://ttaibtback.onrender.com`
- `NEXT_PUBLIC_*` variables are embedded in the build (client-side accessible)

---

### Step 3: Update next.config.ts for Static Export

**Check if `frontend-v2/next.config.ts` has:**

```typescript
const nextConfig: NextConfig = {
  output: 'export',  // ✅ Required for static export
  images: {
    unoptimized: true  // ✅ Required for static hosting
  }
}
```

**If missing, I'll add it!**

---

### Step 4: Deploy!

1. Click "Create Static Site"
2. Render will:
   - Clone repository
   - Run `npm install && npm run build`
   - Export static files to `out/` directory
   - Deploy to CDN

**Build takes 5-10 minutes** (Next.js build is slow)

---

### Step 5: Update Backend CORS

**Once frontend is deployed, update backend environment variable:**

**In backend Render service → Environment:**
```
ALLOWED_ORIGINS=https://your-frontend-v2.onrender.com
```

Or for multiple origins:
```
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-v2.onrender.com
```

**Then redeploy backend** (Manual Deploy → Deploy latest commit)

---

## ⚠️ Important Notes

### 1. Static Site vs Web Service

**We're using Static Site** because:
- ✅ Free tier available
- ✅ CDN-hosted (fast globally)
- ✅ No server needed (all API calls go to backend)
- ✅ Cheaper ($0 vs $7/month)

**Requires:**
- ✅ `output: 'export'` in next.config.ts
- ✅ No server-side rendering features
- ✅ All data from API calls

### 2. Environment Variables

**Next.js requires restart** to pick up env var changes:
- Update env var → Trigger manual deploy
- Changes don't apply until rebuild

### 3. API URL Must Be Absolute

**Your backend URL:**
```
https://ttaibtback.onrender.com
```

**NOT:**
- ❌ `/api` (relative paths don't work in static export)
- ❌ `localhost` (won't work in production)

---

## 🐛 Troubleshooting

### Build Failed: "Module not found"

**Check:**
- All dependencies in `package.json`
- `node_modules/` not in Git (should be .gitignored)

**Fix:**
```bash
npm install
npm run build  # Test locally first
```

### Build Failed: "output: 'export' not supported with..."

**Cause:** Using unsupported Next.js features

**Fix:**
- Remove server-side only features
- No `getServerSideProps`
- No API routes in `/app/api`
- No middleware requiring server

### Blank Page After Deploy

**Causes:**
1. API URL wrong
2. CORS not configured in backend
3. Supabase keys missing

**Fix:**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_API_URL=https://ttaibtback.onrender.com`
3. Verify backend `ALLOWED_ORIGINS` includes frontend URL
4. Check Supabase env vars

### CORS Errors

**Error:** `Access-Control-Allow-Origin`

**Fix:**
1. Update backend `ALLOWED_ORIGINS`
2. Include your frontend URL
3. Redeploy backend
4. Hard refresh frontend (Ctrl+Shift+R)

---

## 🎯 Post-Deployment Checklist

After deployment:

- [ ] Frontend loads at `https://your-frontend-v2.onrender.com`
- [ ] Login page works
- [ ] Can create account
- [ ] Can log in
- [ ] Dashboard loads
- [ ] Can create model
- [ ] Can start trading (modal shows with Daily/Intraday)
- [ ] SSE updates work
- [ ] Logs viewer shows data
- [ ] Mobile version works

---

## 🔗 URLs After Deployment

**Your Stack:**
- 🖥️ **Backend API:** https://ttaibtback.onrender.com
- 🌐 **Frontend v2:** https://your-frontend-v2.onrender.com (after deploy)
- 📊 **API Docs:** https://ttaibtback.onrender.com/docs
- 🗄️ **Database:** Supabase (already configured)

---

## 💰 Cost

**Static Site (Free Tier):**
- ✅ 100 GB bandwidth/month
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Custom domain support

**If you exceed free tier:**
- Upgrade to Starter ($0.20/GB beyond 100 GB)

---

**Ready to deploy! Want me to check/fix your next.config.ts first?** 🚀

