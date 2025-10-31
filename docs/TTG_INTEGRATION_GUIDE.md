# TTG Authentication & AI Agent Integration Guide

**Version:** 1.0  
**Last Updated:** October 31, 2025  
**Status:** Production-Ready Reference

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start Checklist](#quick-start-checklist)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Core Components](#core-components)
7. [Advanced Features](#advanced-features)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)
10. [Production Deployment](#production-deployment)
11. [Complete Code Examples](#complete-code-examples)

---

## Overview

This guide provides a complete blueprint for integrating **True Trading Group's authentication system** and **TTG AI Agents** into your application. It's based on the production-tested implementation from AICharts and includes all necessary code, patterns, and best practices.

### What You'll Get

✅ **Dual-Token Authentication**
- App-level JWT authentication
- TTG service token with automatic refresh
- Secure token storage and management

✅ **TTG AI Agent Integration**
- Real-time streaming chat responses (SSE)
- Structured command parsing
- Conversation threading and context
- Automatic error recovery

✅ **Production-Ready Patterns**
- Token refresh with retry logic
- Conversation access error handling
- User synchronization
- Event-driven architecture

### Use Cases

This integration is ideal for:
- Trading applications requiring TTG member authentication
- AI-powered chart analysis tools
- Applications needing conversational AI with command execution
- Multi-user platforms requiring secure token management

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR APPLICATION                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Frontend (Next.js/React)                 │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌─────────────────────────────┐  │   │
│  │  │   Auth UI    │  │   TTGAgentsService          │  │   │
│  │  │ (Login Page) │  │ • Token management          │  │   │
│  │  └──────────────┘  │ • Auto-refresh              │  │   │
│  │         │          │ • SSE streaming              │  │   │
│  │         │          └─────────────────────────────┘  │   │
│  │         │                        │                   │   │
│  │         ▼                        ▼                   │   │
│  │  ┌──────────────┐  ┌─────────────────────────────┐  │   │
│  │  │  Chat UI     │  │   API Routes (Next.js)      │  │   │
│  │  │ (AI Chat)    │  │  • /api/auth                │  │   │
│  │  └──────────────┘  │  • /api/ttg/exchange        │  │   │
│  │                    │  • /api/ttg/sync-user        │  │   │
│  │                    └─────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬─────────────────────────────┬──────────────────┘
             │                             │
             │ JWT Auth                    │ Token Refresh
             │                             │
     ┌───────▼────────┐          ┌─────────▼──────────┐
     │  TTG Dashboard │          │  TTG Dashboard     │
     │  (Login/Auth)  │          │  (Token Exchange)  │
     └───────┬────────┘          └─────────┬──────────┘
             │                             │
             │ Returns tokens              │ Returns fresh ttg_token
             │                             │
     ┌───────▼────────────────────────────▼──────────┐
     │            TTG AI Agents Backend               │
     │  ┌──────────────────────────────────────────┐ │
     │  │  /api/agents/chat (SSE streaming)        │ │
     │  │  /api/convos (conversation management)   │ │
     │  │  /api/auth/refresh (token refresh)       │ │
     │  └──────────────────────────────────────────┘ │
     └────────────────────────────────────────────────┘
```

### Dual-Token System Explained

**Token 1: App Token (`auth_token`)**
- JWT for your application authentication
- Contains user info (name, email, permissions)
- Stored in httpOnly cookie + localStorage
- Lifetime: 24 hours
- Used to: Authenticate app routes, exchange for TTG token

**Token 2: TTG Token (`ttg_token`)**
- Access token for TTG AI services
- Short-lived (15 minutes typical)
- Stored in localStorage only
- Auto-refreshed via exchange endpoint
- Used to: Call TTG AI agent APIs

### Authentication Flow

```
1. User logs into TTG Dashboard
   ↓
2. Dashboard redirects to your app with tokens:
   https://yourapp.com/auth?tok={appToken}&ttg_tok={ttgToken}
   ↓
3. Your app validates tokens
   ↓
4. Store app_token in httpOnly cookie
   ↓
5. Store ttg_token in localStorage
   ↓
6. Redirect to main app interface
   ↓
7. TTGAgentsService monitors ttg_token expiry
   ↓
8. Auto-refresh before expiration via /api/ttg/exchange
   ↓
9. Exchange endpoint proxies to TTG Dashboard
   ↓
10. Dashboard returns fresh ttg_token
    ↓
11. Continue using app seamlessly
```

---

## Prerequisites

### Required Accounts & Credentials

1. **TTG API Access**
   - TTG member account
   - Agent ID (obtain from TTG support)
   - Access to TTG Dashboard API

2. **Development Environment**
   - Node.js 20+ (for Next.js apps)
   - npm or yarn
   - TypeScript knowledge (recommended)

3. **Environment Variables You'll Need**
   ```bash
   # Authentication
   JWT_SECRET=your_jwt_secret_here
   
   # TTG Configuration
   NEXT_PUBLIC_TTG_SERVER=https://ai.truetradinggroup.com
   NEXT_PUBLIC_TTG_AGENT_ID=your_agent_id_here
   TTG_DASHBOARD_URL=https://ai.truetradinggroup.com
   
   # Optional: Conversation Settings
   NEXT_PUBLIC_TTG_CONVO_TEMPORARY=true
   NEXT_PUBLIC_TTG_CONVO_HIDDEN=false
   ```

### Tech Stack Compatibility

This guide uses **Next.js 15** with **App Router**, but the patterns work with:
- ✅ Next.js (Pages Router or App Router)
- ✅ React + Express
- ✅ React + FastAPI
- ✅ Any JavaScript/TypeScript framework with fetch support

---

## Quick Start Checklist

### Phase 1: Basic Authentication
- [ ] Create `.env.local` with required variables
- [ ] Copy `AuthService` class to your project
- [ ] Create `/api/auth` route
- [ ] Create auth page with token handling
- [ ] Test login flow with TTG Dashboard

### Phase 2: TTG Agent Integration
- [ ] Copy `TTGAgentsService` class
- [ ] Create `/api/ttg/exchange` route
- [ ] Create `/api/ttg/sync-user` route
- [ ] Implement basic chat UI
- [ ] Test message sending and streaming

### Phase 3: Advanced Features
- [ ] Implement auto token refresh
- [ ] Add conversation threading
- [ ] Handle conversation access errors
- [ ] Add command parsing (if needed)
- [ ] Implement error recovery patterns

### Phase 4: Production Hardening
- [ ] Add proper error handling
- [ ] Implement logging
- [ ] Test token refresh failures
- [ ] Test network failures
- [ ] Add monitoring

---

## Step-by-Step Implementation

### Step 1: Environment Setup

Create `.env.local` in your project root:

```bash
# JWT Secret for app authentication
JWT_SECRET=your_shared_secret_with_ttg_dashboard

# TTG Configuration
NEXT_PUBLIC_TTG_SERVER=https://ai.truetradinggroup.com
NEXT_PUBLIC_TTG_AGENT_ID=your_agent_id_here
TTG_DASHBOARD_URL=https://ai.truetradinggroup.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000

# Optional: Conversation Settings
NEXT_PUBLIC_TTG_CONVO_TEMPORARY=true
NEXT_PUBLIC_TTG_CONVO_HIDDEN=false
```

**🔒 Security Note:** Never commit `.env.local` to git. Add to `.gitignore`.

---

### Step 2: Install Dependencies

```bash
npm install jose jwt-decode eventemitter3 socket.io-client

# If using TypeScript
npm install -D @types/node
```

**Dependencies Explained:**
- `jose` - JWT verification and signing
- `jwt-decode` - Client-side JWT decoding
- `eventemitter3` - Event bus for inter-component communication
- `socket.io-client` - WebSocket client (if using pattern detection or other real-time features)

---

### Step 3: Create Authentication Service

**File:** `lib/services/auth.service.ts`

```typescript
import { jwtVerify } from 'jose';

export interface DecodedToken {
  name: string;
  email: string;
  type: string;
  perms?: string;
  sessionID?: string;
  roomUID?: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  // 🔴 CRITICAL: Move this to environment variable in production
  private JWT_SECRET = process.env.JWT_SECRET || '556347a7381948fd560aed456f58e769a926378cddfe319aec46b8b5403bcd4d';
  
  /**
   * Validate JWT token using jose library
   */
  async validateToken(token: string): Promise<DecodedToken | null> {
    try {
      const secret = new TextEncoder().encode(this.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      // Check expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.error('[Auth] Token has expired');
        return null;
      }
      
      // Validate required fields
      if (!payload.name || !payload.email || !payload.type) {
        console.error('[Auth] Token missing required fields');
        return null;
      }
      
      // Validate token type
      if (payload.type !== 'session') {
        console.error('[Auth] Invalid token type:', payload.type);
        return null;
      }
      
      return payload as unknown as DecodedToken;
    } catch (error) {
      console.error('[Auth] Token validation error:', error);
      return null;
    }
  }
  
  /**
   * Authenticate user with token
   */
  async authenticate(token: string): Promise<DecodedToken | null> {
    const decoded = await this.validateToken(token);
    
    if (!decoded) {
      return null;
    }
    
    // Store in localStorage for client access
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(decoded));
    }
    
    return decoded;
  }
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }
    
    const decoded = await this.validateToken(token);
    return decoded !== null;
  }
  
  /**
   * Get current user data
   */
  getCurrentUser(): DecodedToken | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      return null;
    }
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  
  /**
   * Logout user
   */
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('ttg_token');
      localStorage.removeItem('ttg_convo_id');
      localStorage.removeItem('ttg_parent_id');
      
      // Redirect to dashboard
      window.location.href = process.env.NEXT_PUBLIC_TTG_SERVER || 'https://ai.truetradinggroup.com';
    }
  }
}
```

---

### Step 4: Create TTG Agents Service

**File:** `lib/services/ttg-agents.service.ts`

This is a **complete, production-ready** implementation with all features:

```typescript
export interface TtgAgentsSendParams {
  text: string;
  agentId: string;
  conversationId?: string | null;
  parentMessageId?: string | null;
  isTemporary?: boolean;
}

export interface ParsedEnvelope {
  commands: Array<{ command: string; parameters: any; confidence: number }>;
  naturalResponse: string;
  confidence: number;
  conversationId?: string | null;
  parentMessageId?: string | null;
}

/**
 * TTG Agents Service - Complete Implementation
 * 
 * Features:
 * - Automatic token refresh (every 30 seconds check)
 * - Retry logic with exponential backoff
 * - SSE streaming support
 * - Conversation threading
 * - Error recovery
 * - Queue management for concurrent refresh requests
 */
export class TTGAgentsService {
  private static instance: TTGAgentsService | null = null;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing: boolean = false;
  private refreshRetryCount: number = 0;
  private readonly MAX_REFRESH_RETRIES = 3;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshQueue: Array<{ resolve: (value: boolean) => void; reject: (error: any) => void }> = [];
  private consecutiveFailures: number = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(baseUrl?: string): TTGAgentsService {
    if (!TTGAgentsService.instance) {
      if (!baseUrl) {
        throw new Error('TTGAgentsService: baseUrl required for first initialization');
      }
      TTGAgentsService.instance = new TTGAgentsService(baseUrl);
      
      // Load tokens from storage if available
      try {
        const storedToken = localStorage.getItem('ttg_token');
        if (storedToken) {
          const expiry = TTGAgentsService.instance.parseTokenExpiry(storedToken);
          if (expiry && expiry > Date.now() / 1000) {
            TTGAgentsService.instance.token = storedToken;
            TTGAgentsService.instance.tokenExpiry = expiry;
            TTGAgentsService.instance.startBackgroundRefresh();
          } else {
            localStorage.removeItem('ttg_token');
          }
        }
        
        // If no valid token, try to refresh
        if (!TTGAgentsService.instance.token) {
          TTGAgentsService.instance.refreshAuthToken().catch(error => {
            console.error('[TTG] Initial refresh failed:', error);
          });
        }
      } catch {}
    }
    return TTGAgentsService.instance;
  }
  
  /**
   * Parse JWT token to extract expiration time
   */
  private parseTokenExpiry(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Check if token is expiring soon (within 5 minutes)
   */
  private isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiry) return true;
    const now = Date.now() / 1000;
    const bufferTime = 300; // 5 minutes
    return now >= (this.tokenExpiry - bufferTime);
  }
  
  /**
   * Ensure we have a valid token before making API calls
   */
  private async ensureValidToken(): Promise<boolean> {
    if (!this.token || this.isTokenExpiringSoon()) {
      console.log('[TTG] Token missing or expiring soon, refreshing...');
      return await this.refreshAuthToken();
    }
    return true;
  }
  
  /**
   * Start background timer to refresh token periodically
   */
  private startBackgroundRefresh(): void {
    if (typeof window === 'undefined') return;
    if (this.refreshTimer) return; // Don't start multiple timers
    
    console.log('[TTG] Starting background refresh timer');
    
    // Check every 30 seconds
    this.refreshTimer = setInterval(async () => {
      if (!this.token || !this.tokenExpiry || this.refreshPromise) {
        return;
      }
      
      const now = Date.now() / 1000;
      const timeUntilExpiry = this.tokenExpiry - now;
      
      // Refresh if expires within 5 minutes
      if (timeUntilExpiry <= 300 && timeUntilExpiry > 0) {
        console.log('[TTG] Background refresh: token expires in', Math.round(timeUntilExpiry), 'seconds');
        try {
          await this.refreshAuthToken();
        } catch (error) {
          console.error('[TTG] Background refresh error:', error);
        }
      }
    }, 30000);
  }
  
  /**
   * Stop background refresh timer
   */
  private stopBackgroundRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  /**
   * Clear all stored tokens
   */
  private clearTokens(): void {
    this.token = null;
    this.tokenExpiry = null;
    try {
      localStorage.removeItem('ttg_token');
    } catch {}
  }
  
  /**
   * Main refresh method with retry logic and queue management
   */
  private async refreshAuthToken(): Promise<boolean> {
    // If a refresh is already in progress, queue this request
    if (this.refreshPromise) {
      return new Promise<boolean>((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }
    
    this.refreshPromise = this._doRefreshToken();
    
    try {
      const result = await this.refreshPromise;
      
      // Resolve all queued requests
      this.refreshQueue.forEach(({ resolve }) => resolve(result));
      this.refreshQueue = [];
      
      if (result) {
        this.consecutiveFailures = 0;
      } else {
        this.handleRefreshFailure();
      }
      
      return result;
    } catch (error) {
      this.refreshQueue.forEach(({ reject }) => reject(error));
      this.refreshQueue = [];
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  /**
   * Internal method that actually performs the token refresh
   */
  private async _doRefreshToken(): Promise<boolean> {
    this.isRefreshing = true;
    
    try {
      const exchangeSuccess = await this.refreshTokenViaExchange();
      if (exchangeSuccess) {
        this.refreshRetryCount = 0;
        return true;
      }
      
      // Retry with exponential backoff
      if (this.refreshRetryCount < this.MAX_REFRESH_RETRIES) {
        this.refreshRetryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.refreshRetryCount - 1), 30000);
        console.log(`[TTG] Refresh failed, retry ${this.refreshRetryCount}/${this.MAX_REFRESH_RETRIES} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        const retrySuccess = await this.refreshTokenViaExchange();
        
        if (retrySuccess) {
          this.refreshRetryCount = 0;
          return true;
        }
      }
      
      console.error('[TTG] All token refresh attempts failed');
      
      // Emit event for UI to handle re-authentication
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ttg-auth-failed', { 
          detail: { reason: 'token_refresh_failed' } 
        }));
      }
      
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }
  
  /**
   * Try to refresh TTG token via local exchange endpoint
   */
  private async refreshTokenViaExchange(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      
      const appToken = localStorage.getItem('auth_token');
      if (!appToken) {
        console.log('[TTG] No app token found for exchange');
        return false;
      }
      
      const res = await fetch('/api/ttg/exchange', {
        method: 'POST',
        headers: { Authorization: `Bearer ${appToken}` },
      });
      
      if (!res.ok) {
        console.log('[TTG] Exchange endpoint returned:', res.status);
        return false;
      }
      
      const json = await res.json();
      const token = json?.token || json?.access_token || null;
      if (!token) {
        console.log('[TTG] No token in exchange response');
        return false;
      }
      
      // Store new token
      this.token = token;
      this.tokenExpiry = this.parseTokenExpiry(token);
      
      try { 
        localStorage.setItem('ttg_token', token);
        if (this.tokenExpiry) {
          console.log('[TTG] Token refreshed, expires at:', new Date(this.tokenExpiry * 1000).toLocaleString());
        }
      } catch {}
      
      this.startBackgroundRefresh();
      return true;
    } catch (error) {
      console.error('[TTG] Exchange error:', error);
      return false;
    }
  }
  
  /**
   * Handle refresh failures
   */
  private handleRefreshFailure(): void {
    this.consecutiveFailures++;
    
    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      console.error('[TTG] Max consecutive refresh failures reached');
      this.clearTokens();
      this.stopBackgroundRefresh();
      this.consecutiveFailures = 0;
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ttg-auth-required', { 
          detail: { 
            reason: 'max_refresh_failures',
            message: 'Authentication expired. Please log in again.'
          } 
        }));
      }
    }
  }
  
  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    this.tokenExpiry = this.parseTokenExpiry(token);
    
    if (this.tokenExpiry) {
      console.log('[TTG] Token set, expires at:', new Date(this.tokenExpiry * 1000).toLocaleString());
    }
    
    this.startBackgroundRefresh();
  }
  
  /**
   * Check if service has token
   */
  hasToken(): boolean {
    return !!this.token;
  }
  
  /**
   * Send message to TTG agent with SSE streaming
   */
  async sendMessage(params: TtgAgentsSendParams): Promise<ParsedEnvelope> {
    await this.ensureValidToken();
    
    if (!this.token) {
      throw new Error('TTGAgentsService: missing token');
    }
    
    const body: Record<string, any> = {
      text: params.text,
      endpoint: 'agents',
      agent_id: params.agentId,
    };
    
    if (params.conversationId) body.conversationId = params.conversationId;
    if (params.parentMessageId) body.parentMessageId = params.parentMessageId;
    if (typeof params.isTemporary !== 'undefined') body.isTemporary = !!params.isTemporary;
    
    let res = await fetch(`${this.baseUrl}/api/agents/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });
    
    // Handle 401 with automatic retry
    if (res.status === 401) {
      console.log('[TTG] Got 401, attempting token refresh...');
      const refreshed = await this.refreshAuthToken();
      if (refreshed) {
        res = await fetch(`${this.baseUrl}/api/agents/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
          body: JSON.stringify(body),
        });
      }
    }
    
    if (!res.ok || !res.body) {
      throw new Error(`TTG chat failed: ${res.status}`);
    }
    
    // Process SSE stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalText = '';
    let conversationId: string | null = params.conversationId ?? null;
    let parentMessageId: string | null = params.parentMessageId ?? null;
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const eventBlock = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);
        
        const jsonText = eventBlock
          .split(/\r?\n/)
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('');
        
        if (!jsonText) continue;
        
        try {
          const payload = JSON.parse(jsonText);
          
          // Extract text deltas
          if (payload?.event === 'on_message_delta') {
            const delta = payload.data?.delta?.content?.[0]?.text || '';
            if (delta) finalText += delta;
          }
          
          // Extract conversation metadata
          if (payload?.responseMessage?.messageId) {
            parentMessageId = payload.responseMessage.messageId;
          }
          if (payload?.conversation?.conversationId) {
            conversationId = payload.conversation.conversationId;
          }
          
          // Handle final message
          if (payload?.final) {
            const finalContent = (payload.responseMessage?.content || [])
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text || '')
              .join('');
            if (finalContent && finalContent !== finalText) {
              finalText = finalContent;
            }
          }
        } catch {
          // Ignore broken event blocks
        }
      }
    }
    
    // Check for conversation access errors
    const lowerText = finalText.toLowerCase();
    if (finalText.includes('convo_access') && 
        finalText.includes('User not authorized for this conversation')) {
      console.error('[TTG] Conversation access error detected');
      
      try {
        localStorage.removeItem('ttg_convo_id');
        localStorage.removeItem('ttg_parent_id');
      } catch {}
      
      const error = new Error('CONVERSATION_ACCESS_ERROR');
      (error as any).type = 'convo_access';
      throw error;
    }
    
    const envelope = this.parseEnvelope(finalText);
    envelope.conversationId = conversationId;
    envelope.parentMessageId = parentMessageId;
    return envelope;
  }
  
  /**
   * Parse agent response into structured envelope
   */
  private parseEnvelope(text: string): ParsedEnvelope {
    try {
      const trimmed = text.trim();
      const jsonStart = trimmed.indexOf('{');
      const jsonEnd = trimmed.lastIndexOf('}');
      const candidate = jsonStart !== -1 && jsonEnd !== -1 ? trimmed.slice(jsonStart, jsonEnd + 1) : trimmed;
      const parsed = JSON.parse(candidate);
      
      return {
        commands: Array.isArray(parsed.commands) ? parsed.commands : [],
        naturalResponse: typeof parsed.naturalResponse === 'string' ? parsed.naturalResponse : '',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      };
    } catch {
      return { 
        commands: [], 
        naturalResponse: text, 
        confidence: 0.8 
      };
    }
  }
  
  /**
   * Sync user with TTG (ensures correct user logged in)
   */
  async syncUser(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      
      const appToken = localStorage.getItem('auth_token');
      if (!appToken) return false;
      
      // Clear conversation state before sync
      try {
        localStorage.removeItem('ttg_convo_id');
        localStorage.removeItem('ttg_parent_id');
      } catch {}
      
      const res = await fetch('/api/ttg/sync-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${appToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) return false;
      
      const data = await res.json();
      if (data.token) {
        this.setToken(data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[TTG] User sync error:', error);
      return false;
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopBackgroundRefresh();
  }
}
```

---

### Step 5: Create API Routes

#### A. Authentication Route

**File:** `app/api/auth/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appToken = searchParams.get('tok');
  const ttgToken = searchParams.get('ttg_tok');
  
  try {
    // Handle TTG-only authentication
    if (!appToken && ttgToken) {
      const response = NextResponse.redirect(
        new URL(`/chat?ttg_tok=${encodeURIComponent(ttgToken)}`, request.url)
      );
      response.cookies.delete('auth_token');
      return response;
    }
    
    // Validate app token
    if (appToken) {
      const authService = new AuthService();
      const decoded = await authService.validateToken(appToken);
      
      if (!decoded) {
        return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
      }
      
      // Create redirect URL
      const redirectUrl = new URL('/chat', request.url);
      if (ttgToken) {
        redirectUrl.searchParams.set('ttg_tok', ttgToken);
      }
      
      const response = NextResponse.redirect(redirectUrl);
      
      // Set secure httpOnly cookie
      response.cookies.set('auth_token', appToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/'
      });
      
      return response;
    }
    
    return NextResponse.redirect(new URL('/?error=no_token', request.url));
    
  } catch (error) {
    console.error('[Auth] Error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
```

#### B. Token Exchange Route

**File:** `app/api/ttg/exchange/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization' }, { status: 401 });
    }
    
    const cookieHeader = req.headers.get('cookie') || '';
    const dashboardUrl = process.env.TTG_DASHBOARD_URL || 'https://ai.truetradinggroup.com';
    
    // Forward to TTG dashboard refresh endpoint
    const res = await fetch(`${dashboardUrl}/api/charts/refresh`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      return new NextResponse(error, { 
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await res.json();
    
    return NextResponse.json({
      token: data.ttg_tok,
      expiresIn: data.ttgTokenExpiresIn,
      user: data.user
    });
    
  } catch (error) {
    console.error('[Exchange] Error:', error);
    return NextResponse.json({ error: 'Exchange failed' }, { status: 500 });
  }
}
```

#### C. User Sync Route

**File:** `app/api/ttg/sync-user/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }
    
    const appToken = authHeader.replace('Bearer ', '');
    const authService = new AuthService();
    const decodedToken = await authService.validateToken(appToken);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid app token' }, { status: 401 });
    }
    
    // Logout from TTG to clear existing session
    await fetch(`${req.nextUrl.origin}/api/ttg/logout`, {
      method: 'POST',
      headers: { 'Authorization': authHeader }
    });
    
    // Login with correct user
    const loginRes = await fetch(`${req.nextUrl.origin}/api/ttg/login`, {
      method: 'POST',
      headers: { 'Authorization': authHeader }
    });
    
    if (!loginRes.ok) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: loginRes.status });
    }
    
    const loginData = await loginRes.json();
    
    return NextResponse.json({
      success: true,
      user: {
        email: decodedToken.email,
        name: decodedToken.name
      },
      token: loginData.token,
      cleared: true
    });
    
  } catch (error) {
    console.error('[TTG Sync] Error:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}
```

---

### Step 6: Create Chat UI Component

**File:** `components/Chat.tsx`

```typescript
'use client';

import { useEffect, useState, useRef } from 'react';
import { TTGAgentsService } from '@/lib/services/ttg-agents.service';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const ttgServiceRef = useRef<TTGAgentsService>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize TTG service
    const ttgService = TTGAgentsService.getInstance(
      process.env.NEXT_PUBLIC_TTG_SERVER || 'https://ai.truetradinggroup.com'
    );
    ttgServiceRef.current = ttgService;
    
    // Get TTG token from URL if present
    const params = new URLSearchParams(window.location.search);
    const ttgToken = params.get('ttg_tok');
    
    if (ttgToken) {
      ttgService.setToken(ttgToken);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Sync user on mount
    ttgService.syncUser().then(success => {
      if (success) {
        console.log('[Chat] User synced successfully');
      }
    });
    
    // Listen for auth failures
    const handleAuthFailure = () => {
      alert('Authentication expired. Please log in again.');
      window.location.href = process.env.NEXT_PUBLIC_TTG_SERVER || '/';
    };
    
    window.addEventListener('ttg-auth-failed', handleAuthFailure);
    
    return () => {
      window.removeEventListener('ttg-auth-failed', handleAuthFailure);
      ttgService.destroy();
    };
  }, []);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading || !ttgServiceRef.current) {
      return;
    }
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const agentId = process.env.NEXT_PUBLIC_TTG_AGENT_ID || 'default-agent';
      const conversationId = localStorage.getItem('ttg_convo_id');
      const parentMessageId = localStorage.getItem('ttg_parent_id');
      
      const response = await ttgServiceRef.current.sendMessage({
        text: userMessage.text,
        agentId,
        conversationId,
        parentMessageId,
        isTemporary: process.env.NEXT_PUBLIC_TTG_CONVO_TEMPORARY === 'true',
      });
      
      // Store conversation threading
      if (response.conversationId) {
        localStorage.setItem('ttg_convo_id', response.conversationId);
      }
      if (response.parentMessageId) {
        localStorage.setItem('ttg_parent_id', response.parentMessageId);
      }
      
      // Add AI response
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        text: response.naturalResponse || 'No response received',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Handle commands if present
      if (response.commands && response.commands.length > 0) {
        console.log('Received commands:', response.commands);
        // Execute commands here (e.g., emit to event bus, call APIs, etc.)
      }
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Handle conversation access errors
      if (error.type === 'convo_access') {
        localStorage.removeItem('ttg_convo_id');
        localStorage.removeItem('ttg_parent_id');
        // Retry
        return sendMessage();
      }
      
      // Show error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Core Components

### Token Management Architecture

The TTG integration uses a sophisticated token management system with several key features:

#### 1. Automatic Background Refresh

```typescript
// Runs every 30 seconds
this.refreshTimer = setInterval(async () => {
  const timeUntilExpiry = this.tokenExpiry - Date.now() / 1000;
  
  // Refresh if expires within 5 minutes
  if (timeUntilExpiry <= 300) {
    await this.refreshAuthToken();
  }
}, 30000);
```

#### 2. Request Queue Management

Prevents multiple concurrent refresh requests:

```typescript
if (this.refreshPromise) {
  // Queue this request
  return new Promise((resolve, reject) => {
    this.refreshQueue.push({ resolve, reject });
  });
}
```

#### 3. Retry Logic with Exponential Backoff

```typescript
if (this.refreshRetryCount < this.MAX_REFRESH_RETRIES) {
  this.refreshRetryCount++;
  const delay = Math.min(1000 * Math.pow(2, this.refreshRetryCount - 1), 30000);
  await new Promise(resolve => setTimeout(resolve, delay));
  return this.refreshTokenViaExchange(); // Retry
}
```

#### 4. Consecutive Failure Detection

```typescript
if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
  // Clear tokens and emit auth-required event
  this.clearTokens();
  this.stopBackgroundRefresh();
  window.dispatchEvent(new CustomEvent('ttg-auth-required'));
}
```

---

### Conversation Threading

The system maintains conversation context across multiple messages:

```typescript
// Store after each message
if (response.conversationId) {
  localStorage.setItem('ttg_convo_id', response.conversationId);
}
if (response.parentMessageId) {
  localStorage.setItem('ttg_parent_id', response.parentMessageId);
}

// Include in next message
const response = await ttgService.sendMessage({
  text: 'Follow-up question',
  agentId: 'your-agent-id',
  conversationId: localStorage.getItem('ttg_convo_id'),
  parentMessageId: localStorage.getItem('ttg_parent_id'),
});
```

---

### SSE Stream Processing

Server-Sent Events provide real-time streaming responses:

```typescript
// Process SSE stream
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let finalText = '';

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  
  // Process complete events (separated by \n\n)
  let idx: number;
  while ((idx = buffer.indexOf('\n\n')) !== -1) {
    const eventBlock = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 2);
    
    // Extract data lines
    const jsonText = eventBlock
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .join('');
    
    if (!jsonText) continue;
    
    try {
      const payload = JSON.parse(jsonText);
      
      // Handle different event types
      if (payload?.event === 'on_message_delta') {
        const delta = payload.data?.delta?.content?.[0]?.text || '';
        finalText += delta;
        // Optionally emit for real-time display
      }
    } catch {
      // Ignore malformed events
    }
  }
}
```

---

## Advanced Features

### Feature 1: Conversation Access Error Recovery

Handle cases where conversation access is denied:

```typescript
// In TTGAgentsService.sendMessage()
const lowerText = finalText.toLowerCase();
if (finalText.includes('convo_access') && 
    finalText.includes('User not authorized for this conversation')) {
  
  // Clear stale conversation state
  localStorage.removeItem('ttg_convo_id');
  localStorage.removeItem('ttg_parent_id');
  
  // Throw specific error
  const error = new Error('CONVERSATION_ACCESS_ERROR');
  (error as any).type = 'convo_access';
  throw error;
}

// In your chat component
try {
  const response = await ttgService.sendMessage(...);
} catch (error: any) {
  if (error.type === 'convo_access') {
    // Clear and retry
    localStorage.removeItem('ttg_convo_id');
    localStorage.removeItem('ttg_parent_id');
    return sendMessage(); // Retry
  }
}
```

---

### Feature 2: Temporary Conversations

Mark conversations as temporary for auto-cleanup:

```typescript
// Set via environment variable
NEXT_PUBLIC_TTG_CONVO_TEMPORARY=true

// Apply in sendMessage
const response = await ttgService.sendMessage({
  text: 'Hello',
  agentId: 'your-agent-id',
  isTemporary: process.env.NEXT_PUBLIC_TTG_CONVO_TEMPORARY === 'true',
});
```

**Benefits:**
- Conversations auto-expire (backend managed)
- Don't clutter user's history
- Ideal for demos, testing, one-off queries

---

### Feature 3: Command Parsing

Parse structured commands from AI responses:

```typescript
interface Command {
  command: string;
  parameters: any;
  confidence: number;
}

// AI returns structured JSON
const response = await ttgService.sendMessage({ ... });

if (response.commands && response.commands.length > 0) {
  for (const cmd of response.commands) {
    switch (cmd.command) {
      case 'changeSymbol':
        // Update chart to cmd.parameters.symbol
        break;
      case 'addIndicator':
        // Add indicator cmd.parameters.indicator
        break;
      case 'none':
        // No action needed
        break;
      default:
        console.warn('Unknown command:', cmd.command);
    }
  }
}
```

**Example AI Response:**
```json
{
  "commands": [
    {
      "command": "changeSymbol",
      "parameters": { "symbol": "AAPL" },
      "confidence": 0.95
    }
  ],
  "naturalResponse": "I've changed the chart to show AAPL.",
  "confidence": 0.95
}
```

---

### Feature 4: Event-Driven Architecture

Use events for decoupled communication:

```typescript
// Create event bus
import EventEmitter from 'eventemitter3';
const eventBus = new EventEmitter();

// Emit command from AI chat
eventBus.emit('executeCommand', {
  command: 'changeSymbol',
  parameters: { symbol: 'AAPL' }
});

// Listen in chart component
eventBus.on('executeCommand', (payload) => {
  const { command, parameters } = payload;
  // Execute command on chart
});
```

---

## Testing & Verification

### Manual Testing Checklist

#### Phase 1: Authentication
- [ ] Visit app without tokens → redirects to auth page
- [ ] Visit with `?tok={appToken}` → sets cookie, redirects to app
- [ ] Visit with `?tok={appToken}&ttg_tok={ttgToken}` → both tokens stored
- [ ] Check localStorage for `ttg_token` after successful auth
- [ ] Check browser cookies for `auth_token` (httpOnly)
- [ ] Verify token validation rejects expired tokens
- [ ] Verify token validation rejects malformed tokens

#### Phase 2: Token Refresh
- [ ] Token auto-refreshes 5 minutes before expiry
- [ ] Background timer runs every 30 seconds
- [ ] Failed refresh triggers retry with backoff
- [ ] 3 consecutive failures emit `ttg-auth-required` event
- [ ] Queue prevents concurrent refresh requests
- [ ] Token expiry updates after successful refresh

#### Phase 3: Messaging
- [ ] Send message → receives AI response
- [ ] SSE streaming works (partial responses appear)
- [ ] `conversationId` persists in localStorage
- [ ] `parentMessageId` persists in localStorage
- [ ] Follow-up messages maintain conversation context
- [ ] Commands parsed correctly from response
- [ ] Natural response displays in UI

#### Phase 4: Error Handling
- [ ] Conversation access error clears state and retries
- [ ] 401 error triggers token refresh and retry
- [ ] Network errors display error message
- [ ] Auth failure event redirects to login

---

### Automated Tests (Example with Jest)

```typescript
// __tests__/ttg-agents.service.test.ts

import { TTGAgentsService } from '@/lib/services/ttg-agents.service';

describe('TTGAgentsService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset singleton
    (TTGAgentsService as any).instance = null;
  });
  
  it('should initialize with stored token', () => {
    localStorage.setItem('ttg_token', 'valid.jwt.token');
    const service = TTGAgentsService.getInstance('https://ttg.ai');
    expect(service.hasToken()).toBe(true);
  });
  
  it('should parse token expiry correctly', () => {
    const service = TTGAgentsService.getInstance('https://ttg.ai');
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NDA' +
                 'wODY0MDB9.signature'; // exp: 1640086400
    const expiry = (service as any).parseTokenExpiry(token);
    expect(expiry).toBe(1640086400);
  });
  
  it('should queue concurrent refresh requests', async () => {
    const service = TTGAgentsService.getInstance('https://ttg.ai');
    
    const promise1 = (service as any).refreshAuthToken();
    const promise2 = (service as any).refreshAuthToken();
    const promise3 = (service as any).refreshAuthToken();
    
    // All should resolve to same result
    const results = await Promise.all([promise1, promise2, promise3]);
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
  });
});
```

---

## Troubleshooting

### Issue 1: "Token has expired" Loop

**Symptoms:** Constant redirects, token refresh fails

**Solutions:**
1. Check `JWT_SECRET` matches between app and TTG Dashboard
2. Verify token is not already expired when received
3. Check `/api/ttg/exchange` endpoint is accessible
4. Verify `TTG_DASHBOARD_URL` is correct
5. Check browser console for refresh errors

**Debug:**
```typescript
// Add to your component
useEffect(() => {
  const token = localStorage.getItem('ttg_token');
  if (token) {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token expires:', new Date(payload.exp * 1000));
    console.log('Time remaining:', payload.exp - Date.now() / 1000, 'seconds');
  }
}, []);
```

---

### Issue 2: SSE Stream Not Working

**Symptoms:** No AI response, connection hangs

**Solutions:**
1. Check TTG server URL is correct
2. Verify token is valid
3. Check browser Network tab → Filter by "EventStream"
4. Ensure no proxy buffering SSE responses
5. Check CORS if calling from different domain

**Debug:**
```typescript
// Log SSE events
const reader = res.body.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  console.log('[SSE]', text); // Log raw SSE data
}
```

---

### Issue 3: Conversation Access Error

**Symptoms:** "User not authorized for this conversation"

**Solutions:**
1. Clear conversation state:
   ```typescript
   localStorage.removeItem('ttg_convo_id');
   localStorage.removeItem('ttg_parent_id');
   ```
2. Call `ttgService.syncUser()` to re-sync user
3. Start new conversation (send message without IDs)

**Prevention:**
- Always sync user on app mount
- Handle conversation access errors automatically
- Clear state when switching users

---

### Issue 4: No Commands in Response

**Symptoms:** AI responds but no commands parsed

**Solutions:**
1. Check AI agent instructions include command format
2. Verify response contains JSON structure
3. Check `parseEnvelope()` function is working
4. Log raw response text before parsing

**Debug:**
```typescript
// In TTGAgentsService
console.log('[TTG] Raw response:', finalText);
const envelope = this.parseEnvelope(finalText);
console.log('[TTG] Parsed envelope:', envelope);
```

---

### Issue 5: Auth Endpoint Returns 401

**Symptoms:** `/api/auth` rejects token

**Solutions:**
1. Verify `JWT_SECRET` is set correctly
2. Check token format is valid JWT
3. Ensure token hasn't expired
4. Verify required fields (name, email, type)
5. Check token type is "session"

**Debug:**
```typescript
// In AuthService
console.log('[Auth] Token payload:', payload);
console.log('[Auth] Required fields present:', {
  name: !!payload.name,
  email: !!payload.email,
  type: !!payload.type
});
```

---

## Production Deployment

### Pre-Deployment Checklist

#### Security
- [ ] Move `JWT_SECRET` to environment variable
- [ ] Enable HTTPS in production
- [ ] Set `secure: true` on cookies
- [ ] Use `sameSite: 'strict'` on cookies
- [ ] Rotate JWT secret after moving to env
- [ ] Never log tokens in production
- [ ] Implement rate limiting on auth endpoints

#### Configuration
- [ ] Set all required environment variables
- [ ] Configure CORS if needed
- [ ] Set correct `TTG_DASHBOARD_URL`
- [ ] Set correct `NEXT_PUBLIC_TTG_SERVER`
- [ ] Verify `NEXT_PUBLIC_TTG_AGENT_ID`
- [ ] Test in staging environment first

#### Monitoring
- [ ] Add error tracking (Sentry, etc.)
- [ ] Monitor auth failure events
- [ ] Monitor token refresh failures
- [ ] Track conversation access errors
- [ ] Monitor API response times
- [ ] Set up alerts for auth issues

#### Testing
- [ ] Test full auth flow
- [ ] Test token refresh
- [ ] Test conversation threading
- [ ] Test error recovery
- [ ] Test with multiple users
- [ ] Load test with concurrent requests

---

### Deployment Platforms

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_TTG_SERVER
vercel env add NEXT_PUBLIC_TTG_AGENT_ID
vercel env add TTG_DASHBOARD_URL
```

#### Render.com

1. Connect GitHub repository
2. Select "Web Service"
3. Set build command: `npm run build`
4. Set start command: `npm run start`
5. Add environment variables in dashboard
6. Enable auto-deploy from main branch

#### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
```

```bash
# Build and run
docker build -t myapp .
docker run -p 3000:3000 --env-file .env.local myapp
```

---

### Environment Variable Management

**Development (`.env.local`):**
```bash
JWT_SECRET=dev_secret_not_for_production
NEXT_PUBLIC_TTG_SERVER=https://ai.truetradinggroup.com
NEXT_PUBLIC_TTG_AGENT_ID=dev_agent_id
TTG_DASHBOARD_URL=https://ai.truetradinggroup.com
```

**Production (Platform Dashboard):**
```bash
JWT_SECRET=<secure_production_secret>
NEXT_PUBLIC_TTG_SERVER=https://ai.truetradinggroup.com
NEXT_PUBLIC_TTG_AGENT_ID=<production_agent_id>
TTG_DASHBOARD_URL=https://ai.truetradinggroup.com
NODE_ENV=production
```

**Security Best Practices:**
- Use different secrets per environment
- Rotate secrets periodically
- Use secret management service (AWS Secrets Manager, etc.)
- Never commit secrets to git
- Limit access to production secrets

---

## Complete Code Examples

### Example 1: Minimal Chat Application

Complete Next.js app with TTG integration in 3 files:

**1. `app/page.tsx`** (Landing page)
```typescript
'use client';

export default function Home() {
  const handleLogin = () => {
    // Redirect to TTG Dashboard for authentication
    window.location.href = `${process.env.NEXT_PUBLIC_TTG_SERVER}/member-dashboard`;
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <button
        onClick={handleLogin}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg"
      >
        Login with TTG
      </button>
    </div>
  );
}
```

**2. `app/chat/page.tsx`** (Chat interface)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { TTGAgentsService } from '@/lib/services/ttg-agents.service';
import Chat from '@/components/Chat';

export default function ChatPage() {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      const service = TTGAgentsService.getInstance(
        process.env.NEXT_PUBLIC_TTG_SERVER!
      );
      
      // Get token from URL
      const params = new URLSearchParams(window.location.search);
      const ttgToken = params.get('ttg_tok');
      
      if (ttgToken) {
        service.setToken(ttgToken);
        window.history.replaceState({}, '', '/chat');
      }
      
      // Sync user
      await service.syncUser();
      setIsReady(true);
    };
    
    init();
  }, []);
  
  if (!isReady) {
    return <div>Loading...</div>;
  }
  
  return <Chat />;
}
```

**3. `.env.local`**
```bash
JWT_SECRET=your_secret_here
NEXT_PUBLIC_TTG_SERVER=https://ai.truetradinggroup.com
NEXT_PUBLIC_TTG_AGENT_ID=your_agent_id
TTG_DASHBOARD_URL=https://ai.truetradinggroup.com
```

---

### Example 2: Trading App with Commands

Chat that executes trading commands:

```typescript
// components/TradingChat.tsx
'use client';

import { useEffect, useState } from 'react';
import { TTGAgentsService } from '@/lib/services/ttg-agents.service';

export default function TradingChat({ onCommand }: { onCommand: (cmd: any) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const service = TTGAgentsService.getInstance(
      process.env.NEXT_PUBLIC_TTG_SERVER!
    );
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await service.sendMessage({
        text: input,
        agentId: process.env.NEXT_PUBLIC_TTG_AGENT_ID!,
        conversationId: localStorage.getItem('ttg_convo_id'),
        parentMessageId: localStorage.getItem('ttg_parent_id'),
      });
      
      // Store conversation IDs
      if (response.conversationId) {
        localStorage.setItem('ttg_convo_id', response.conversationId);
      }
      if (response.parentMessageId) {
        localStorage.setItem('ttg_parent_id', response.parentMessageId);
      }
      
      // Add AI response
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: response.naturalResponse 
      }]);
      
      // Execute commands
      if (response.commands) {
        for (const cmd of response.commands) {
          if (cmd.command !== 'none') {
            onCommand(cmd); // Callback to parent
          }
        }
      }
      
    } catch (error: any) {
      if (error.type === 'convo_access') {
        localStorage.removeItem('ttg_convo_id');
        localStorage.removeItem('ttg_parent_id');
        return sendMessage(); // Retry
      }
      
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Error: Failed to get response' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : ''}`}>
            <span className={`inline-block p-2 rounded ${
              msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything..."
          className="w-full p-2 border rounded"
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

// Usage in parent component
export function TradingApp() {
  const handleCommand = (cmd: any) => {
    switch (cmd.command) {
      case 'changeSymbol':
        console.log('Change chart to:', cmd.parameters.symbol);
        // Update chart symbol
        break;
      case 'setTimeframe':
        console.log('Change timeframe to:', cmd.parameters.timeframe);
        // Update chart timeframe
        break;
      case 'addIndicator':
        console.log('Add indicator:', cmd.parameters.indicator);
        // Add indicator to chart
        break;
      default:
        console.log('Unknown command:', cmd);
    }
  };
  
  return (
    <div className="flex h-screen">
      <div className="flex-1">
        {/* Your chart component */}
      </div>
      <div className="w-96 border-l">
        <TradingChat onCommand={handleCommand} />
      </div>
    </div>
  );
}
```

---

## Summary

You now have everything you need to integrate TTG authentication and AI agents into any application:

✅ **Complete authentication flow** with dual-token system  
✅ **Production-ready service classes** with auto-refresh  
✅ **API routes** for token exchange and user sync  
✅ **Chat UI components** with streaming support  
✅ **Error handling** and recovery patterns  
✅ **Testing strategies** and troubleshooting guides  
✅ **Deployment instructions** for multiple platforms  

### Next Steps

1. **Start with Quick Start Checklist** (Phase 1-2)
2. **Copy core service classes** to your project
3. **Create API routes** for authentication
4. **Build basic chat UI** to test integration
5. **Add advanced features** as needed
6. **Test thoroughly** before production
7. **Deploy** with proper monitoring

### Support & Resources

- **AICharts Source Code:** Reference implementation at `aicharts-next/`
- **Documentation:** See other guides in `/docs` folder
- **TTG Dashboard:** https://ai.truetradinggroup.com
- **Issues:** Check `bugs-and-fixes.md` for known issues

---

**Last Updated:** October 31, 2025  
**Based on:** AICharts Production Implementation (Verified)  
**Status:** Production-Ready ✅


