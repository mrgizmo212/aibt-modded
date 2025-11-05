/**
 * PROVE-FIX: useEffect Infinite Loops (BUG-013)
 * 
 * PROVES: No more useEffect spam in console
 * 
 * Fix Applied: Removed 'enabled' from useEffect dependencies
 *              Only modelId triggers re-connection now
 * 
 * Expected: Minimal useEffect triggers (only on model selection change)
 * Before Fix: Continuous "[SSE Hook] useEffect triggered" spam
 * 
 * Run: node prove-fix-useeffect-loops.js
 */

const puppeteer = require('puppeteer');

async function proveUseEffectLoopsFix() {
  console.log('✅ PROVE-FIX: useEffect Infinite Loops');
  console.log('='.repeat(70));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Track useEffect triggers
  const useEffectTriggers = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[SSE Hook] useEffect triggered')) {
      useEffectTriggers.push({
        message: text,
        timestamp: Date.now()
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
    console.log('\n📊 Step 2: Dashboard loaded...');
    await page.waitForSelector('input[placeholder*="Ask"]');
    
    // 3. Clear initial triggers from page load
    await new Promise(resolve => setTimeout(resolve, 2000));
    const initialTriggers = useEffectTriggers.length;
    console.log(`   Initial useEffect triggers during load: ${initialTriggers}`);
    useEffectTriggers.length = 0;  // Reset
    
    // 4. Monitor for continuous triggers (should be minimal)
    console.log('\n⏱️  Step 3: Monitoring for 30 seconds...');
    console.log('   (Looking for continuous re-triggering)');
    
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log(`   ${(i+1)*10}s: ${useEffectTriggers.length} useEffect triggers`);
    }
    
    // 5. Analyze results
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(70));
    console.log(`useEffect Triggers (30s): ${useEffectTriggers.length}`);
    console.log(`Average: ${(useEffectTriggers.length / 30 * 60).toFixed(1)} triggers/minute`);
    
    // 6. Verdict
    console.log('\n🎯 VERDICT:');
    console.log('='.repeat(70));
    
    if (useEffectTriggers.length > 20) {
      console.log('❌ FIX FAILED: useEffect still triggering excessively');
      console.log(`   Expected: <5 triggers in 30s`);
      console.log(`   Actual: ${useEffectTriggers.length} triggers in 30s`);
      console.log('   Issue: Circular dependencies still exist');
    } else if (useEffectTriggers.length > 5) {
      console.log('⚠️  PARTIAL FIX: Triggers reduced but still higher than ideal');
      console.log(`   Triggers in 30s: ${useEffectTriggers.length}`);
      console.log('   Status: Better but could be optimized');
    } else {
      console.log('✅ FIX VERIFIED 100%: useEffect loops eliminated!');
      console.log(`   Triggers in 30s: ${useEffectTriggers.length} (normal)`);
      console.log('   No infinite re-rendering detected');
      console.log('   Dependency optimization successful');
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
  proveUseEffectLoopsFix().catch(console.error);
} catch (e) {
  console.error('❌ Missing dependency: puppeteer');
  console.error('   Install: npm install puppeteer');
  console.error('');
  console.error('MANUAL TEST PROCEDURE:');
  console.log('='.repeat(70));
  console.log('1. Open http://localhost:3000');
  console.log('2. Open DevTools Console (F12)');
  console.log('3. Login and wait on dashboard');
  console.log('4. Watch console for "[SSE Hook] useEffect triggered" messages');
  console.log('5. Count messages over 30 seconds');
  console.log('');
  console.log('EXPECTED: <5 triggers (only during model selection)');
  console.log('BEFORE FIX: Dozens of triggers per minute (infinite loop)');
}

