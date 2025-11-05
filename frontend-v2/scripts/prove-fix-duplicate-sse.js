/**
 * PROVE-FIX: Duplicate SSE Connections (BUG-011)
 * 
 * PROVES: Only 1 SSE connection per model after fix
 * 
 * Fix Applied: Removed 'enabled' from useEffect dependencies in use-trading-stream.ts
 *              Now only triggers on modelId change
 * 
 * Expected: Console shows "[SSE] Connected" only ONCE per model
 * Before Fix: Console shows "[SSE] Connected" 2-3 times per model
 * 
 * Run: node prove-fix-duplicate-sse.js
 */

const puppeteer = require('puppeteer');

async function proveDuplicateSSEFix() {
  console.log('✅ PROVE-FIX: Duplicate SSE Connections');
  console.log('='.repeat(70));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Track SSE connections
  const sseConnections = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[SSE] Connected to trading stream')) {
      sseConnections.push({
        message: text,
        timestamp: Date.now()
      });
      console.log(`  🔗 SSE Connection #${sseConnections.length}: ${text}`);
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
    console.log('\n📊 Step 2: Dashboard loaded...');
    await page.waitForSelector('input[placeholder*="Ask"]');
    
    // 3. Select MODEL 212 (will trigger SSE connection)
    console.log('\n🤖 Step 3: Selecting model (triggers SSE)...');
    console.log('   Watching for duplicate connections...');
    
    // Click on model in sidebar (this will trigger SSE hook)
    // Wait a bit to let page fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to click model element
    try {
      await page.evaluate(() => {
        // Find and click the model element
        const modelElement = Array.from(document.querySelectorAll('span, div'))
          .find(el => el.textContent?.includes('MODEL 212'));
        if (modelElement) {
          modelElement.click();
        }
      });
    } catch (e) {
      console.log('   ⚠️  Could not auto-click model, please click manually');
    }
    
    // 4. Wait for connections to establish
    console.log('\n⏱️  Step 4: Waiting for SSE connections (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Analyze results
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(70));
    console.log(`SSE Connections Detected: ${sseConnections.length}`);
    
    if (sseConnections.length > 0) {
      console.log('\nConnection Timeline:');
      const start = sseConnections[0].timestamp;
      sseConnections.forEach((conn, i) => {
        const elapsed = ((conn.timestamp - start) / 1000).toFixed(2);
        console.log(`  ${i+1}. ${elapsed}s - ${conn.message}`);
      });
    }
    
    // 6. Verdict
    console.log('\n🎯 VERDICT:');
    console.log('='.repeat(70));
    
    if (sseConnections.length === 0) {
      console.log('⚠️  NO CONNECTIONS: Model may not be selected or SSE not triggered');
      console.log('   Try manually clicking a model and re-run test');
    } else if (sseConnections.length === 1) {
      console.log('✅ FIX VERIFIED 100%: Only 1 SSE connection created!');
      console.log('   Duplicate connection bug eliminated');
      console.log('   useEffect dependencies fixed');
    } else {
      console.log(`❌ FIX FAILED: ${sseConnections.length} duplicate connections detected`);
      console.log('   Expected: 1 connection');
      console.log(`   Actual: ${sseConnections.length} connections`);
      console.log('   Issue: useEffect still triggering multiple times');
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    console.log('\nPress Ctrl+C to close...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

// Check dependencies
try {
  require('puppeteer');
  proveDuplicateSSEFix().catch(console.error);
} catch (e) {
  console.error('❌ Missing dependency: puppeteer');
  console.error('   Install: npm install puppeteer');
  console.error('');
  console.error('MANUAL TEST PROCEDURE:');
  console.log('='.repeat(70));
  console.log('1. Open http://localhost:3000');
  console.log('2. Open DevTools Console (F12)');
  console.log('3. Login');
  console.log('4. Click on a model (MODEL 212)');
  console.log('5. Watch console for "[SSE] Connected" messages');
  console.log('');
  console.log('EXPECTED: Exactly 1 "[SSE] Connected" message');
  console.log('BEFORE FIX: 2-3 "[SSE] Connected" messages (duplicates)');
}

