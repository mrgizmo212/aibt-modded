/**
 * BUG-003: Navigation Sidebar Polling Spam
 * 
 * PROVES: API calls every 30 seconds regardless of changes
 * 
 * Expected: Only poll when needed or use SSE
 * Actual: setInterval fires every 30s making unnecessary API calls
 * 
 * Test Method:
 * 1. Open network tab
 * 2. Count API calls to /api/trading/status
 * 3. Wait 2 minutes
 * 4. If calls = ~4 (every 30s) → BUG CONFIRMED
 * 
 * Run: node verify-bug-polling-spam.js
 */

const puppeteer = require('puppeteer');

async function testPollingSpam() {
  console.log('🔍 BUG-003: Testing Navigation Polling Spam');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Track network requests
  const apiCalls = [];
  
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/trading/status') || url.includes('/api/models')) {
      apiCalls.push({
        url,
        timestamp: Date.now(),
        method: request.method()
      });
    }
  });
  
  try {
    // 1. Login
    console.log('\n📍 Step 1: Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'adam@truetradinggroup.com');
    await page.type('input[type="password"]', 'adminpass123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // 2. Wait for dashboard
    console.log('\n📊 Step 2: Dashboard loaded, starting monitoring...');
    await page.waitForSelector('input[placeholder*="Ask"]');
    
    // 3. Reset counter after initial load
    const initialCallCount = apiCalls.length;
    console.log(`   Initial API calls: ${initialCallCount} (during load)`);
    apiCalls.length = 0;  // Clear
    
    // 4. Monitor for 90 seconds (should see 3 polling calls if 30s interval)
    console.log('\n⏱️  Step 3: Monitoring for 90 seconds...');
    console.log('   Expected: 3 calls (30s, 60s, 90s)');
    
    for (let i = 0; i < 9; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));  // Check every 10 seconds
      console.log(`   ${(i+1)*10}s: ${apiCalls.length} polling calls so far`);
    }
    
    // 5. Analyze results
    console.log('\n📊 RESULTS:');
    console.log('=' .repeat(70));
    console.log(`Total Polling Calls (90s): ${apiCalls.length}`);
    
    if (apiCalls.length > 0) {
      console.log('\nCall Timeline:');
      const start = apiCalls[0].timestamp;
      apiCalls.forEach((call, i) => {
        const elapsed = ((call.timestamp - start) / 1000).toFixed(1);
        console.log(`   ${i+1}. ${elapsed}s - ${call.url.split('/api/')[1]}`);
      });
    }
    
    // 6. Verdict
    console.log('\n🎯 VERDICT:');
    console.log('=' .repeat(70));
    
    if (apiCalls.length >= 2) {
      console.log('❌ BUG CONFIRMED: Unnecessary polling detected!');
      console.log(`   Polling calls in 90s: ${apiCalls.length}`);
      console.log(`   Polling interval: ~${(90 / apiCalls.length).toFixed(0)}s`);
      console.log(`   Problem: Using setInterval instead of event-driven updates`);
      console.log(`   Impact: Wasted API calls, server load, battery drain`);
    } else {
      console.log('✅ NO BUG: No excessive polling detected');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\nPress Ctrl+C to close...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

// Check dependencies
try {
  require('puppeteer');
  testPollingSpam().catch(console.error);
} catch (e) {
  console.error('❌ Missing dependency: puppeteer');
  console.error('   Install: npm install puppeteer');
  console.error('');
  console.error('MANUAL TEST PROCEDURE:');
  console.log('=' .repeat(70));
  console.log('1. Open http://localhost:3000');
  console.log('2. Open DevTools → Network tab');
  console.log('3. Filter by "status" or "models"');
  console.log('4. Login and wait on dashboard');
  console.log('5. Watch for repeated API calls every 30 seconds');
  console.log('6. Count calls over 90 seconds');
  console.log('');
  console.log('EXPECTED: 0-1 calls (use SSE for updates)');
  console.log('ACTUAL BUG: 3+ calls (one every 30s via setInterval)');
}

