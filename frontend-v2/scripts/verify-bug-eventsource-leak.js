/**
 * BUG-002: EventSource Memory Leak
 * 
 * PROVES: New EventSource created without closing previous one
 * 
 * Expected: Old connection closed before creating new
 * Actual: Multiple EventSource instances pile up
 * 
 * Test Method:
 * 1. Send chat message (creates EventSource)
 * 2. Send another message before first completes
 * 3. Check if old EventSource was closed
 * 4. Count active EventSource connections
 * 
 * Run: node verify-bug-eventsource-leak.js
 */

const puppeteer = require('puppeteer');

async function testEventSourceLeak() {
  console.log('🔍 BUG-002: Testing EventSource Memory Leak');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Inject EventSource tracker
  await page.evaluateOnNewDocument(() => {
    window.__eventSources = [];
    window.__eventSourcesClosed = 0;
    
    // Hook into EventSource constructor
    const OriginalEventSource = window.EventSource;
    
    window.EventSource = function(...args) {
      const es = new OriginalEventSource(...args);
      const esId = window.__eventSources.length;
      
      console.log(`[EventSource] Created #${esId}:`, args[0]);
      window.__eventSources.push({
        id: esId,
        url: args[0],
        instance: es,
        createdAt: Date.now(),
        closed: false
      });
      
      // Hook close method
      const originalClose = es.close.bind(es);
      es.close = function() {
        console.log(`[EventSource] Closed #${esId}`);
        window.__eventSources[esId].closed = true;
        window.__eventSourcesClosed++;
        return originalClose();
      };
      
      return es;
    };
    
    // Copy prototype
    window.EventSource.prototype = OriginalEventSource.prototype;
    window.EventSource.CONNECTING = OriginalEventSource.CONNECTING;
    window.EventSource.OPEN = OriginalEventSource.OPEN;
    window.EventSource.CLOSED = OriginalEventSource.CLOSED;
  });
  
  try {
    // 1. Navigate and login
    console.log('\n📍 Step 1: Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'adam@truetradinggroup.com');
    await page.type('input[type="password"]', 'adminpass123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // 2. Wait for chat
    console.log('\n💬 Step 2: Waiting for chat interface...');
    await page.waitForSelector('input[placeholder*="Ask"]', { timeout: 10000 });
    
    // 3. Send FIRST message
    console.log('\n📤 Step 3: Sending first message...');
    await page.type('input[placeholder*="Ask"]', 'Tell me about trading strategies');
    await page.click('button:has(svg)');
    
    await new Promise(resolve => setTimeout(resolve, 2000));  // Wait 2 seconds
    
    // 4. Check EventSource count
    let status1 = await page.evaluate(() => ({
      total: window.__eventSources.length,
      active: window.__eventSources.filter(es => !es.closed).length,
      closed: window.__eventSourcesClosed
    }));
    
    console.log('\n📊 After First Message:');
    console.log(`   Total EventSources Created: ${status1.total}`);
    console.log(`   Currently Active: ${status1.active}`);
    console.log(`   Closed: ${status1.closed}`);
    
    // 5. Send SECOND message (before first finishes)
    console.log('\n📤 Step 5: Sending second message (interrupting first)...');
    
    // Clear input and type new message
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Ask"]');
      if (input) input.value = '';
    });
    
    await page.type('input[placeholder*="Ask"]', 'What about risk management?');
    await page.click('button:has(svg)');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Check if old EventSource was closed
    let status2 = await page.evaluate(() => ({
      total: window.__eventSources.length,
      active: window.__eventSources.filter(es => !es.closed).length,
      closed: window.__eventSourcesClosed,
      details: window.__eventSources.map(es => ({
        id: es.id,
        closed: es.closed,
        age: Date.now() - es.createdAt
      }))
    }));
    
    console.log('\n📊 After Second Message:');
    console.log(`   Total EventSources Created: ${status2.total}`);
    console.log(`   Currently Active: ${status2.active}`);
    console.log(`   Closed: ${status2.closed}`);
    console.log('\n   Details:');
    status2.details.forEach(d => {
      console.log(`     #${d.id}: ${d.closed ? '✅ CLOSED' : '❌ STILL OPEN'} (age: ${(d.age/1000).toFixed(1)}s)`);
    });
    
    // 7. Verdict
    console.log('\n🎯 VERDICT:');
    console.log('=' .repeat(70));
    
    if (status2.active > 1) {
      console.log('❌ BUG CONFIRMED: EventSource memory leak detected!');
      console.log(`   Expected: 1 active EventSource`);
      console.log(`   Actual: ${status2.active} active EventSource(s)`);
      console.log(`   Problem: Old connections not closed before creating new ones`);
      console.log(`   Impact: Memory leak + duplicate SSE streams + performance degradation`);
    } else {
      console.log('✅ NO BUG: EventSource properly cleaned up');
      console.log(`   Only ${status2.active} active connection (as expected)`);
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
  testEventSourceLeak().catch(console.error);
} catch (e) {
  console.error('❌ Missing dependency: puppeteer');
  console.error('   Install: npm install puppeteer');
  console.error('   Or run manually:');
  console.error('');
  console.error('MANUAL TEST PROCEDURE:');
  console.log('=' .repeat(70));
  console.log('1. Open http://localhost:3000 in browser');
  console.log('2. Open DevTools Console (F12)');
  console.log('3. Paste this into console:');
  console.log('');
  console.log('   window.__eventSources = [];');
  console.log('   const OrigES = window.EventSource;');
  console.log('   window.EventSource = function(...args) {');
  console.log('     const es = new OrigES(...args);');
  console.log('     window.__eventSources.push({ url: args[0], closed: false, es });');
  console.log('     const origClose = es.close.bind(es);');
  console.log('     es.close = function() {');
  console.log('       window.__eventSources[window.__eventSources.length-1].closed = true;');
  console.log('       return origClose();');
  console.log('     };');
  console.log('     return es;');
  console.log('   };');
  console.log('');
  console.log('4. Login to app');
  console.log('5. Send chat message');
  console.log('6. Send another message before first completes');
  console.log('7. Run: window.__eventSources');
  console.log('8. Check if multiple connections are OPEN (closed: false)');
  console.log('');
  console.log('EXPECTED: 1 open, others closed');
  console.log('ACTUAL BUG: Multiple open connections');
}

