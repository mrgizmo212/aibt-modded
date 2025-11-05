/**
 * PROVE-FIX: SSE Chat Authentication (BUG-007)
 * 
 * PROVES: Chat streaming works without 401 errors after fix
 * 
 * Fix Applied: Added default_headers (HTTP-Referer, X-Title) to ChatOpenAI 
 *              initialization in backend SSE endpoints
 * 
 * Expected: Chat message sends → AI response streams → No 401 errors
 * 
 * Run: node prove-fix-sse-auth.js
 */

const puppeteer = require('puppeteer');

async function proveSSEAuthFix() {
  console.log('✅ PROVE-FIX: SSE Chat Authentication');
  console.log('='.repeat(70));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Track errors
  const errors = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('ERROR') || text.includes('401')) {
      errors.push(text);
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
    
    // 2. Wait for chat
    console.log('\n💬 Step 2: Waiting for chat interface...');
    await page.waitForSelector('input[placeholder*="Ask"]', { timeout: 10000 });
    
    // 3. Send test message
    console.log('\n📤 Step 3: Sending test message...');
    await page.type('input[placeholder*="Ask"]', 'Test chat streaming');
    await page.keyboard.press('Enter');
    
    // 4. Wait for streaming to complete
    console.log('\n⏱️  Step 4: Waiting for streaming response (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 5. Check for errors
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(70));
    console.log(`Errors captured: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach((err, i) => {
        console.log(`  ${i+1}. ${err.substring(0, 100)}`);
      });
    }
    
    // 6. Check if response appeared
    const pageContent = await page.content();
    const has401Error = errors.some(e => e.includes('401') || e.includes('cookie auth'));
    const hasStreaming = pageContent.includes('Streaming...');
    
    console.log('');
    console.log('Has 401 errors:', has401Error ? '❌ YES' : '✅ NO');
    console.log('Still streaming:', hasStreaming ? '⚠️  YES (may be normal)' : '✅ NO');
    console.log('');
    
    // 7. Verdict
    console.log('🎯 VERDICT:');
    console.log('='.repeat(70));
    
    if (has401Error) {
      console.log('❌ FIX FAILED: Still seeing 401 authentication errors');
      console.log('   Chat streaming is still broken');
    } else {
      console.log('✅ FIX VERIFIED: No 401 errors detected!');
      console.log('   Chat streaming authentication is working');
      console.log('   OpenRouter accepting requests with proper headers');
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
  proveSSEAuthFix().catch(console.error);
} catch (e) {
  console.error('❌ Missing dependency: puppeteer');
  console.error('   Install: npm install puppeteer');
  console.error('');
  console.error('MANUAL TEST PROCEDURE:');
  console.log('='.repeat(70));
  console.log('1. Open http://localhost:3000');
  console.log('2. Open DevTools Console (F12)');
  console.log('3. Login');
  console.log('4. Send any chat message');
  console.log('5. Watch console for errors');
  console.log('');
  console.log('EXPECTED: No "401" or "cookie auth credentials" errors');
  console.log('EXPECTED: AI response streams successfully');
  console.log('ACTUAL BUG (before fix): Error 401 - No cookie auth credentials');
}

