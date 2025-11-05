/**
 * PROVE-FIX: Duplicate Event Listeners (BUG-008)
 * 
 * PROVES: conversation-created event fires only ONCE after fix
 * 
 * Fix Applied: Added isHidden check to prevent multiple instances from registering listeners
 *              Only visible navigation-sidebar instance registers listener
 * 
 * Expected: Event fires 1x per conversation created
 * Before Fix: Event fires 4x (once per NavigationSidebar instance)
 * 
 * Run: node prove-fix-duplicate-listeners.js
 */

const puppeteer = require('puppeteer');

async function proveDuplicateListenersFix() {
  console.log('✅ PROVE-FIX: Duplicate Event Listeners');
  console.log('='.repeat(70));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Track event occurrences
  const eventOccurrences = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[Nav] Conversation created event received')) {
      eventOccurrences.push({
        message: text,
        timestamp: Date.now()
      });
      console.log(`  📡 Event #${eventOccurrences.length}: ${text}`);
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
    await page.waitForSelector('input[placeholder*="Ask"]');
    
    // 3. Send message (creates conversation, triggers event)
    console.log('\n📤 Step 3: Sending message to create conversation...');
    console.log('   Watching for duplicate event firings...');
    
    await page.type('input[placeholder*="Ask"]', 'Test message for event tracking');
    await page.keyboard.press('Enter');
    
    // 4. Wait for event to propagate
    console.log('\n⏱️  Step 4: Waiting for events (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Analyze results
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(70));
    console.log(`Event Firings Detected: ${eventOccurrences.length}`);
    
    if (eventOccurrences.length > 1) {
      console.log('\nEvent Timeline:');
      const start = eventOccurrences[0].timestamp;
      eventOccurrences.forEach((evt, i) => {
        const elapsed = ((evt.timestamp - start)).toFixed(0);
        console.log(`  ${i+1}. +${elapsed}ms - ${evt.message.substring(0, 80)}`);
      });
    }
    
    // 6. Verdict
    console.log('\n🎯 VERDICT:');
    console.log('='.repeat(70));
    
    if (eventOccurrences.length === 0) {
      console.log('⚠️  NO EVENTS: Conversation may not have been created');
      console.log('   Check if message was sent and session created');
    } else if (eventOccurrences.length === 1) {
      console.log('✅ FIX VERIFIED 100%: Event fires only ONCE!');
      console.log('   Duplicate listener bug eliminated');
      console.log('   No redundant API calls from duplicate handlers');
    } else {
      console.log(`❌ FIX FAILED: Event still firing ${eventOccurrences.length} times`);
      console.log('   Expected: 1 event firing');
      console.log(`   Actual: ${eventOccurrences.length} event firings`);
      console.log('   Issue: Multiple NavigationSidebar instances still registering listeners');
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
  proveDuplicateListenersFix().catch(console.error);
} catch (e) {
  console.error('❌ Missing dependency: puppeteer');
  console.error('   Install: npm install puppeteer');
  console.error('');
  console.error('MANUAL TEST PROCEDURE:');
  console.log('='.repeat(70));
  console.log('1. Open http://localhost:3000');
  console.log('2. Open DevTools Console (F12)');
  console.log('3. Login');
  console.log('4. Send a chat message (creates conversation)');
  console.log('5. Count "[Nav] Conversation created event received" messages');
  console.log('');
  console.log('EXPECTED: Exactly 1 message');
  console.log('BEFORE FIX: 4 messages (4x duplicate)');
}

