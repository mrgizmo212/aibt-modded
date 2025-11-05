/**
 * BUG-001: Chat Re-Render Storm During Streaming
 * 
 * PROVES: Every SSE token causes full message array re-render
 * 
 * Expected: Streaming should update incrementally
 * Actual: Every token triggers setMessages() → all messages re-render
 * 
 * Test Method:
 * 1. Inject render counter into chat component
 * 2. Send message and start streaming
 * 3. Count renders during streaming
 * 4. If renders = token count → BUG CONFIRMED
 * 
 * Run: node verify-bug-chat-rerender-storm.js
 */

const puppeteer = require('puppeteer');

async function testChatRerenderStorm() {
  console.log('🔍 BUG-001: Testing Chat Re-Render Storm');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true  // Open DevTools automatically
  });
  
  const page = await browser.newPage();
  
  // Inject performance monitoring
  await page.evaluateOnNewDocument(() => {
    window.__renderCounts = {};
    window.__tokenCounts = 0;
    
    // Hook into React DevTools or console
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      // Count streaming tokens
      if (args[0] && args[0].includes('[Chat Stream] Token added')) {
        window.__tokenCounts++;
      }
      
      // Count message updates
      if (args[0] && args[0].includes('[Chat] Updating streamed content')) {
        window.__renderCounts.messageUpdate = (window.__renderCounts.messageUpdate || 0) + 1;
      }
      
      originalConsoleLog.apply(console, args);
    };
  });
  
  try {
    // 1. Navigate to app
    console.log('\n📍 Step 1: Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // 2. Login (assume credentials)
    console.log('\n🔑 Step 2: Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'adam@truetradinggroup.com');
    await page.type('input[type="password"]', 'adminpass123');
    await page.click('button[type="submit"]');
    
    // 3. Wait for chat interface
    console.log('\n💬 Step 3: Waiting for chat interface...');
    await page.waitForSelector('input[placeholder*="Ask"]', { timeout: 10000 });
    
    // 4. Send message to trigger streaming
    console.log('\n📤 Step 4: Sending test message...');
    const chatInput = await page.$('input[placeholder*="Ask"]');
    await chatInput.type('Explain how AI trading works in detail');
    
    // Click send button
    await page.click('button[aria-label*="Send"], button:has(svg)');
    
    // 5. Monitor renders during streaming
    console.log('\n⏱️  Step 5: Monitoring renders during streaming (15 seconds)...');
    console.log('   (Watch DevTools Console for render/token counts)');
    
    await new Promise(resolve => setTimeout(resolve, 15000));  // Wait 15 seconds for streaming
    
    // 6. Get final counts
    const results = await page.evaluate(() => {
      return {
        tokenCount: window.__tokenCounts,
        renderCount: window.__renderCounts.messageUpdate || 0
      };
    });
    
    console.log('\n📊 RESULTS:');
    console.log('=' .repeat(70));
    console.log(`Tokens Received: ${results.tokenCount}`);
    console.log(`Message Updates: ${results.renderCount}`);
    console.log(`Render:Token Ratio: ${(results.renderCount / results.tokenCount * 100).toFixed(0)}%`);
    console.log('');
    
    // 7. Verdict
    if (results.renderCount >= results.tokenCount * 0.9) {
      console.log('❌ BUG CONFIRMED: Re-render storm detected!');
      console.log(`   Every token causes message array update (${results.renderCount} updates for ${results.tokenCount} tokens)`);
      console.log(`   Expected: 1-2 updates total`);
      console.log(`   Actual: ${results.renderCount} updates (one per token)`);
      console.log(`   Performance Impact: ${results.renderCount} full message list re-renders`);
    } else {
      console.log('✅ NO BUG: Renders are batched/optimized');
      console.log(`   Only ${results.renderCount} updates for ${results.tokenCount} tokens`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\n📋 Manual Verification:');
    console.log('   1. Check DevTools Console for "[Chat] Updating streamed content" spam');
    console.log('   2. Watch React DevTools for component re-renders');
    console.log('   3. Check Performance tab for excessive render times');
    console.log('');
    console.log('Press Ctrl+C to close browser...');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 60000));
    await browser.close();
  }
}

// Run test
testChatRerenderStorm().catch(console.error);

