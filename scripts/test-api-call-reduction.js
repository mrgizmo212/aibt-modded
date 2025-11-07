/**
 * API Call Counter Test Script
 * 
 * Purpose: Verify BUG-028 fix reduced duplicate API calls by 60-75%
 * 
 * How to use:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire script
 * 4. Press Enter
 * 5. Navigate through the app (click model, run, conversation)
 * 6. After ~30 seconds, check console for results
 * 
 * Expected Results (After Fix):
 * - /api/models: ≤4 calls (2 instances × React Strict Mode)
 * - /api/trading/status: ≤4 calls
 * - /api/models/186/logs: ≤4 calls
 * - /api/chat/sessions: ≤4 calls
 * - /api/models/186/runs: ≤4 calls
 * 
 * Before Fix:
 * - Each endpoint: 8-20 calls
 */

(function() {
  console.log('🧪 API Call Counter - Starting...')
  console.log('📊 Monitoring all fetch requests...')
  console.log('')
  
  // Store original fetch
  const originalFetch = window.fetch
  
  // API call tracking
  const apiCalls = new Map()
  const callTimestamps = []
  let startTime = Date.now()
  
  // Override fetch
  window.fetch = function(...args) {
    const url = args[0]
    const options = args[1] || {}
    const method = options.method || 'GET'
    
    // Only track our API calls
    if (typeof url === 'string' && url.includes('/api/')) {
      // Extract endpoint (remove base URL and query params)
      const endpoint = url
        .replace(/^https?:\/\/[^/]+/, '')  // Remove base URL
        .split('?')[0]  // Remove query params
      
      const key = `${method} ${endpoint}`
      
      // Increment counter
      const current = apiCalls.get(key) || { count: 0, calls: [] }
      current.count++
      current.calls.push({
        timestamp: Date.now() - startTime,
        url: url,
        method: method
      })
      apiCalls.set(key, current)
      
      // Track timestamp
      callTimestamps.push({
        time: Date.now() - startTime,
        endpoint: key
      })
      
      console.log(`📡 [${current.count}x] ${key}`)
    }
    
    // Call original fetch
    return originalFetch.apply(this, args)
  }
  
  // Report function
  window.reportAPICalls = function() {
    console.clear()
    console.log('═══════════════════════════════════════════════')
    console.log('📊 API CALL REPORT')
    console.log('═══════════════════════════════════════════════')
    console.log('')
    
    // Convert to array and sort by count
    const sorted = Array.from(apiCalls.entries())
      .sort((a, b) => b[1].count - a[1].count)
    
    let totalCalls = 0
    
    console.log('📈 CALL COUNTS BY ENDPOINT:')
    console.log('───────────────────────────────────────────────')
    
    sorted.forEach(([endpoint, data]) => {
      const status = data.count <= 2 ? '✅' : 
                     data.count <= 4 ? '⚠️' :
                     '❌'
      
      console.log(`${status} ${endpoint}`)
      console.log(`   Count: ${data.count}x`)
      console.log(`   First call: ${data.calls[0].timestamp}ms`)
      console.log(`   Last call: ${data.calls[data.calls.length - 1].timestamp}ms`)
      console.log('')
      
      totalCalls += data.count
    })
    
    console.log('───────────────────────────────────────────────')
    console.log(`📊 TOTAL API CALLS: ${totalCalls}`)
    console.log(`⏱️  TIME ELAPSED: ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
    console.log('')
    
    // Expected vs Actual
    console.log('📋 ASSESSMENT:')
    console.log('───────────────────────────────────────────────')
    
    const excessive = sorted.filter(([_, data]) => data.count > 4)
    
    if (excessive.length === 0) {
      console.log('✅ PASS: All endpoints called ≤4 times')
      console.log('✅ Mobile component fix working correctly!')
      console.log('✅ React Strict Mode double-mount is expected (2x)')
    } else {
      console.log('❌ FAIL: Some endpoints called >4 times:')
      excessive.forEach(([endpoint, data]) => {
        console.log(`   ❌ ${endpoint}: ${data.count}x`)
      })
      console.log('')
      console.log('💡 Expected in dev: 2-4 calls max per endpoint')
      console.log('💡 If seeing 5+, there may still be duplicate mounts')
    }
    
    console.log('')
    console.log('═══════════════════════════════════════════════')
    
    return {
      endpoints: Object.fromEntries(apiCalls),
      totalCalls,
      timeElapsed: (Date.now() - startTime) / 1000
    }
  }
  
  // Auto-report every 30 seconds
  setInterval(() => {
    if (apiCalls.size > 0) {
      console.log('')
      console.log('🔄 Auto-report (30s interval)')
      window.reportAPICalls()
    }
  }, 30000)
  
  console.log('✅ API Call Counter installed!')
  console.log('📝 Navigate through the app...')
  console.log('📊 Call window.reportAPICalls() anytime to see results')
  console.log('🔄 Auto-report every 30 seconds')
  console.log('')
})()

