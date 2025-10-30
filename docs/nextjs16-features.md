# Next.js 16 LTS Features Usage Guide

**Date:** 2025-10-29  
**Next.js Version:** 16 (LTS - Released October 2025)

---

## 🚀 Next.js 16 Features We'll Leverage

### 1. **Turbopack (Default Bundler)**

**What it is:** Rust-based bundler replacing Webpack, ~10x faster builds

**How we use it:**
```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbo",        // ← Turbopack in dev
    "build": "next build --turbo",     // ← Turbopack in build
    "start": "next start"
  }
}
```

**Benefits for AIBT:**
- ⚡ Fast Refresh < 100ms (instant UI updates during development)
- 📦 Faster builds (production build ~60% faster)
- 🔄 Better HMR (Hot Module Replacement)

---

### 2. **Cache Components with Partial Pre-Rendering (PPR)**

**What it is:** Hybrid rendering - static shell + dynamic data

**How we use it:**
```tsx
// frontend/app/page.tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      {/* Static shell (cached) */}
      <h1>AI-Trader Dashboard</h1>
      
      {/* Dynamic data (streamed) */}
      <Suspense fallback={<LoadingLeaderboard />}>
        <Leaderboard />  {/* Server Component - fetches live data */}
      </Suspense>
    </div>
  )
}
```

**Benefits for AIBT:**
- 📊 Static UI shell loads instantly
- 🔄 Live trading data streams in progressively
- ⚡ Perceived performance boost (UI interactive immediately)
- 💾 Reduced server load (static parts cached at edge)

**Implementation:**
```tsx
// Enable PPR in next.config.ts
export default {
  experimental: {
    ppr: true  // ← Enable Partial Pre-Rendering
  }
}

// Mark dynamic sections
import { unstable_noStore as noStore } from 'next/cache'

async function Leaderboard() {
  noStore()  // ← This data is always fresh, never cached
  const data = await fetchLeaderboard()
  return <LeaderboardTable data={data} />
}
```

---

### 3. **React 19.2 Integration**

**New React 19.2 features available:**

**A) Server Actions (for future interactivity):**
```tsx
'use server'

async function refreshModelData(model: string) {
  // Could trigger data refresh in future
  revalidatePath(`/models/${model}`)
}
```

**B) use() Hook for Async Data:**
```tsx
import { use } from 'react'

function ModelCard({ dataPromise }) {
  const data = use(dataPromise)  // ← Unwrap Promise in component
  return <Card data={data} />
}
```

**C) Optimistic Updates (for future write operations):**
```tsx
import { useOptimistic } from 'react'

// If we add user interactions later
const [optimisticData, addOptimistic] = useOptimistic(data)
```

**Benefits for AIBT:**
- 🔄 Cleaner async data handling
- ⚡ Better streaming support
- 🎯 Simpler component code

---

### 4. **New Proxy for Middleware**

**What it is:** Enhanced middleware with proxy capabilities

**How we might use it:**
```tsx
// frontend/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Could proxy API requests to FastAPI backend
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone()
    url.host = 'localhost:8080'
    return NextResponse.rewrite(url)
  }
}

export const config = {
  matcher: '/api/:path*'
}
```

**Benefits for AIBT:**
- 🔗 Unified domain (frontend proxies to backend)
- 🛡️ Hide backend URL from client
- 🔧 Easier CORS configuration

---

## 📝 Next.js 16 Config Template

**File:** `frontend/next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ✅ Turbopack enabled by default in Next.js 16
  
  // ✅ Enable Partial Pre-Rendering
  experimental: {
    ppr: true,
  },
  
  // Dark mode configuration
  reactStrictMode: true,
  
  // API proxy to FastAPI backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
}

export default nextConfig
```

---

## 🎯 Performance Optimizations with Next.js 16

### 1. **Static Shell, Dynamic Data (PPR)**

```tsx
// app/page.tsx - PPR optimized
export default function DashboardPage() {
  return (
    <>
      {/* Static (cached at edge) */}
      <Header />
      <StatsGrid />
      
      {/* Dynamic (streamed from server) */}
      <Suspense fallback={<ChartSkeleton />}>
        <PerformanceChart />  {/* Fetches live data */}
      </Suspense>
      
      <Suspense fallback={<TableSkeleton />}>
        <Leaderboard />  {/* Fetches live data */}
      </Suspense>
    </>
  )
}
```

### 2. **Streaming with React 19.2**

```tsx
// Automatic streaming with Server Components
async function Leaderboard() {
  const data = await fetchLeaderboard()  // ← Streams as data arrives
  return <LeaderboardTable data={data} />
}
```

### 3. **Turbopack Fast Refresh**

**Development experience:**
- Save file → See changes in < 100ms
- No full page reload needed
- State preserved across updates

---

## 🔧 Package.json Scripts (Next.js 16)

```json
{
  "scripts": {
    "dev": "next dev --turbo",           // ← Turbopack dev server
    "build": "next build --turbo",       // ← Turbopack build
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.0.0",                   // ← Next.js 16 LTS
    "react": "^19.2.0",                  // ← React 19.2
    "react-dom": "^19.2.0"
  }
}
```

---

## 📊 Expected Performance Improvements

**With Next.js 16 vs Next.js 14:**

| Metric | Next.js 14 | Next.js 16 | Improvement |
|--------|------------|------------|-------------|
| Dev server startup | ~2s | ~800ms | 60% faster |
| Fast Refresh | ~300ms | < 100ms | 66% faster |
| Production build | ~45s | ~18s | 60% faster |
| Initial page load | ~1.5s | ~800ms | 47% faster (PPR) |

**For AIBT:**
- Dashboard loads in < 1 second
- Chart updates feel instant
- Mobile experience is buttery smooth
- Development iteration is lightning fast

---

## 🎨 React 19.2 Patterns for AIBT

### Server Components (Default)

```tsx
// app/page.tsx - Server Component (no 'use client')
export default async function DashboardPage() {
  // Fetch on server, no client JS needed for this
  const leaderboard = await fetchLeaderboard()
  
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Server-rendered, no hydration needed */}
      <StaticLeaderboard data={leaderboard} />
      
      {/* Client component for interactivity */}
      <InteractiveChart />
    </div>
  )
}
```

### Client Components (Only When Needed)

```tsx
// components/PerformanceChart.tsx
'use client'  // ← Only client components need this

import { useState } from 'react'

export function PerformanceChart() {
  const [timeRange, setTimeRange] = useState('7d')
  
  // Interactive chart with client-side state
  return <Recharts config={...} />
}
```

**Rule:** Server Components by default, Client Components only for:
- Interactivity (onClick, onChange)
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect)

---

## 🚀 Migration Notes

**From old docs/index.html to Next.js 16:**

**OLD (Vanilla JS):**
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  fetch('/data.json').then(r => r.json()).then(data => {
    // Render chart
  })
</script>
```

**NEW (Next.js 16 + React 19.2):**
```tsx
// Server Component - no client JS needed
export default async function ChartPage() {
  const data = await fetchChartData()  // ← Fetches on server
  return <PerformanceChart data={data} />  // ← Streams to client
}
```

**Benefits:**
- ✅ No client-side data fetching (faster initial load)
- ✅ SEO friendly (server-rendered)
- ✅ Automatic code splitting
- ✅ Streaming (progressive enhancement)

---

## 📦 Updated Dependencies

**frontend/package.json:**
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "typescript": "^5.3.0",
    "@radix-ui/react-*": "latest",  // Shadcn UI dependencies
    "tailwindcss": "^3.4.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^8",
    "eslint-config-next": "^16.0.0",
    "typescript": "^5"
  }
}
```

---

**END OF NEXT.JS 16 FEATURES GUIDE**

*Updated for October 2025 Next.js 16 LTS release with Turbopack, PPR, and React 19.2*

