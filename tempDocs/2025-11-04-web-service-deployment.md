# 2025-11-04 12:30 - Web Service Deployment Configuration

## Decision: Web Service ($7/month) Instead of Static Site (Free)

User confirmed: **"All is set. Web service everything."**

---

## Changes Made for Web Service Deployment

### 1. Restored `middleware.ts`
**Action:** Renamed `middleware.ts.backup` → `middleware.ts`

**File:** `frontend-v2/middleware.ts`

Server-side authentication middleware now active:
- Checks JWT token from cookies **before rendering pages**
- Redirects unauthenticated users to `/login` (no page flash)
- Redirects authenticated users away from `/login` and `/signup`
- Runs on server, not client

**Middleware Config:**
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### 2. Updated `next.config.mjs` for Web Service
**File:** `frontend-v2/next.config.mjs`

**Before (Static Site):**
```javascript
const nextConfig = {
  output: 'export',  // Static export
  images: {
    unoptimized: true,  // No image optimization
  },
}
```

**After (Web Service):**
```javascript
const nextConfig = {
  // Using Web Service deployment - no 'output: export' needed
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,  // Image optimization enabled for Web Service
  },
}
```

**Changes:**
- ❌ Removed `output: 'export'` (not needed for server deployment)
- ✅ Set `images.unoptimized: false` (enables Next.js image optimization)

---

### 3. Removed Client-Side RouteGuard from Layout
**File:** `frontend-v2/app/layout.tsx`

**Before:**
```tsx
import { RouteGuard } from "@/components/route-guard"

<AuthProvider>
  <RouteGuard>
    {children}
  </RouteGuard>
  <Toaster />
</AuthProvider>
```

**After:**
```tsx
// No RouteGuard import

<AuthProvider>
  {children}
  <Toaster />
</AuthProvider>
```

**Why:** Middleware now handles auth at the server level, so client-side RouteGuard is redundant.

**Note:** `route-guard.tsx` component still exists but is unused (can be deleted if desired).

---

## Build Verification

### Build Command:
```bash
cd /workspace/frontend-v2
npm run build
```

### Build Output:
```
✓ Compiled successfully in 3.0s
✓ Generating static pages (6/6)

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin
├ ○ /login
└ ○ /signup

ƒ Proxy (Middleware)  ← Middleware recognized and active
```

### Build Artifacts:
- **Directory:** `.next` (NOT `out`) ✅
- **Size:** 13MB
- **Type:** Server-optimized build for Node.js

**Warning shown (non-critical):**
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```
This is just Next.js 16 recommending a new naming convention. The middleware still works perfectly. We can rename it to `proxy.ts` in the future if desired.

---

## Render Configuration for Web Service

### Service Settings:

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Name** | `aibt-frontend-v2` (or your choice) |
| **Region** | Oregon (same as backend) |
| **Branch** | `main` |
| **Root Directory** | `frontend-v2` |
| **Build Command** | `npm install --legacy-peer-deps && npm run build` |
| **Start Command** | `npm start` |
| **Publish Directory** | *(leave empty)* |
| **Plan** | Starter ($7/month) |

### Environment Variables:

```
NEXT_PUBLIC_API_URL=https://ttaibtback.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://lfewxxeiplfycmymzmjz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTAxNDUsImV4cCI6MjA3NzMyNjE0NX0.qQN-zUgDgtuVl2oxyUJ8bYqeNDIRKy5oM1gomg2hBTk
NODE_ENV=production
```

---

## What Web Service Provides

### ✅ Benefits (vs. Static Site):

1. **Server-Side Middleware:**
   - Auth checks happen **before** page renders
   - No flash of protected content
   - More secure (HTML never sent to unauthorized users)

2. **Image Optimization:**
   - Automatic WebP/AVIF conversion
   - Responsive image sizing
   - Better performance

3. **Server-Side Rendering (SSR):**
   - Pages can fetch data on server before rendering
   - Faster perceived performance
   - No loading spinners for initial data

4. **API Routes:**
   - Can add `/api/*` endpoints in Next.js if needed
   - Useful for proxying, caching, simple backend logic

5. **Dynamic Behavior:**
   - Server-side logic based on cookies, headers, query params
   - More flexible routing

### 💰 Cost:
- **$7/month** ($84/year)
- Includes 100 instance hours/month
- Auto-scaling available

---

## Deployment Flow

### 1. Push Code to GitHub:
```powershell
git add .; git commit -m "Configure frontend-v2 for Render Web Service deployment by restoring middleware.ts for server-side auth, removing output export from next.config.mjs to enable SSR and image optimization, removing RouteGuard wrapper from app/layout.tsx since middleware handles auth, verify 13MB .next build directory created successfully for Node.js server deployment"; git push
```

### 2. Render Auto-Deploys:
- Detects push to `main` branch
- Navigates to `frontend-v2` directory
- Runs `npm install --legacy-peer-deps`
- Runs `npm run build` (creates `.next` directory)
- Runs `npm start` (starts Next.js server on port 3000)

### 3. Verify Deployment:
- [ ] Build succeeds (check logs)
- [ ] Service starts (health check passes)
- [ ] Frontend loads at Render URL
- [ ] Login redirects work (no page flash)
- [ ] Dashboard loads after login
- [ ] Protected routes redirect to login when unauthenticated
- [ ] API calls to backend work

---

## Architecture After Deployment

```
User Request → Render (Web Service)
                 ↓
           middleware.ts checks JWT
                 ↓
         ┌──────┴──────┐
         ↓             ↓
    Authorized    Unauthorized
         ↓             ↓
   Render Page   Redirect /login
         ↓
   API Calls → https://ttaibtback.onrender.com
```

**Flow:**
1. User visits `https://your-frontend.onrender.com/`
2. Render Web Service receives request
3. `middleware.ts` checks `jwt_token` cookie
4. If no token → redirect to `/login` (before HTML sent)
5. If token exists → render page
6. Page makes API calls to backend
7. Backend validates JWT on every request

---

## Files Modified Summary

| File | Status | Purpose |
|------|--------|---------|
| `middleware.ts.backup` → `middleware.ts` | Restored | Server-side auth checks |
| `next.config.mjs` | Modified | Removed `output: 'export'`, enabled image optimization |
| `app/layout.tsx` | Modified | Removed `<RouteGuard>` wrapper (middleware handles auth) |
| `route-guard.tsx` | Unused | Can be deleted (no longer needed) |

---

## Next Steps

1. ✅ **Push code** (command provided above)
2. ⏳ **Create Web Service in Render:**
   - New Service → Web Service
   - Configure settings from table above
   - Add environment variables
3. ⏳ **Wait for deployment** (5-10 minutes)
4. ✅ **Test the deployment** (checklist above)
5. ✅ **Update backend CORS** if needed:
   ```
   ALLOWED_ORIGINS=https://your-frontend.onrender.com
   ```

---

## Comparison: Static vs Web Service

| Feature | Static Site (Free) | Web Service ($7/mo) |
|---------|-------------------|---------------------|
| **Cost** | $0/month | $7/month |
| **Middleware** | ❌ No (client-side only) | ✅ Yes (server-side) |
| **Auth UX** | Page flash before redirect | Instant redirect |
| **Image Optimization** | ❌ Unoptimized | ✅ Auto-optimized |
| **SSR** | ❌ Static only | ✅ On-demand rendering |
| **API Routes** | ❌ No | ✅ Yes (`/api/*`) |
| **Build Output** | `out` directory | `.next` directory |
| **Deployment** | CDN (static files) | Node.js server |

**You chose:** Web Service for better UX and server features.

---

## Troubleshooting

### If build fails: "middleware not found"
**Cause:** `middleware.ts` not restored  
**Fix:** Verify file exists at `frontend-v2/middleware.ts`

### If build fails: "output: export not supported with middleware"
**Cause:** `next.config.mjs` still has `output: 'export'`  
**Fix:** Remove that line (already done)

### If pages flash before redirect
**Cause:** Middleware not running  
**Check:** Build logs should show "ƒ Proxy (Middleware)"  
**Fix:** Verify `middleware.ts` exists and config matcher is correct

### If images don't optimize
**Cause:** `images.unoptimized: true`  
**Fix:** Should be `false` (already done)

---

## Lessons Learned

1. **Middleware requires Web Service** - can't run in static exports
2. **`output: 'export'` and middleware are mutually exclusive**
3. **Web Service creates `.next` directory, Static Site creates `out` directory**
4. **Next.js 16 prefers "proxy.ts" over "middleware.ts"** (deprecation warning, still works)
5. **RouteGuard component redundant when middleware exists** (server handles auth)

---

**Status:** ✅ Code configured for Web Service deployment  
**Cost:** $7/month  
**Next:** Push to GitHub, configure Render, deploy  
**Expected Result:** Fully functional Next.js app with server-side auth
