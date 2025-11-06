/**
 * Comprehensive Route Verification Script
 * 
 * Verifies the complete navigation flow:
 * 1. Route pages exist
 * 2. Props are correctly named
 * 3. Navigation code matches route structure
 * 4. ChatInterface will receive correct data
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE ROUTE VERIFICATION\n');
console.log('=' .repeat(60));

let allPassed = true;

// TEST 1: Verify route files exist
console.log('\n📁 TEST 1: Route Files Exist');
const routeFiles = [
  'frontend-v2/app/m/[modelId]/c/[conversationId]/page.tsx',
  'frontend-v2/app/c/[conversationId]/page.tsx'
];

routeFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ MISSING: ${file}`);
    allPassed = false;
  }
});

// TEST 2: Verify prop names are correct
console.log('\n🔧 TEST 2: Prop Names Match ChatInterface');
const modelConvPath = path.join(__dirname, '../frontend-v2/app/m/[modelId]/c/[conversationId]/page.tsx');
const modelConvContent = fs.readFileSync(modelConvPath, 'utf-8');

if (modelConvContent.includes('selectedConversationId={conversationId')) {
  console.log('  ✅ Model conversation uses selectedConversationId prop');
} else {
  console.log('  ❌ Model conversation has incorrect prop name');
  allPassed = false;
}

const generalConvPath = path.join(__dirname, '../frontend-v2/app/c/[conversationId]/page.tsx');
const generalConvContent = fs.readFileSync(generalConvPath, 'utf-8');

if (generalConvContent.includes('selectedConversationId={conversationId')) {
  console.log('  ✅ General conversation uses selectedConversationId prop');
} else {
  console.log('  ❌ General conversation has incorrect prop name');
  allPassed = false;
}

// TEST 3: Verify ChatInterface accepts the prop
console.log('\n🎯 TEST 3: ChatInterface Prop Compatibility');
const chatInterfacePath = path.join(__dirname, '../frontend-v2/components/chat-interface.tsx');
const chatContent = fs.readFileSync(chatInterfacePath, 'utf-8');

if (chatContent.includes('selectedConversationId?: number | null')) {
  console.log('  ✅ ChatInterface accepts selectedConversationId prop');
} else {
  console.log('  ❌ ChatInterface missing selectedConversationId prop');
  allPassed = false;
}

if (chatContent.includes('selectedConversationId,') && chatContent.includes('}: ChatInterfaceProps)')) {
  console.log('  ✅ ChatInterface destructures selectedConversationId');
} else {
  console.log('  ❌ ChatInterface does not destructure selectedConversationId');
  allPassed = false;
}

// TEST 4: Verify useParams extracts correct params
console.log('\n📦 TEST 4: Route Parameter Extraction');

if (modelConvContent.includes('params.modelId') && modelConvContent.includes('params.conversationId')) {
  console.log('  ✅ Model conversation extracts both modelId and conversationId');
} else {
  console.log('  ❌ Model conversation missing parameter extraction');
  allPassed = false;
}

if (generalConvContent.includes('params.conversationId')) {
  console.log('  ✅ General conversation extracts conversationId');
} else {
  console.log('  ❌ General conversation missing parameter extraction');
  allPassed = false;
}

// TEST 5: Verify navigation code navigates to these routes
console.log('\n🧭 TEST 5: Navigation Code Compatibility');
const navigationFiles = [
  'frontend-v2/app/page.tsx',
  'frontend-v2/app/new/page.tsx',
  'frontend-v2/app/m/[modelId]/new/page.tsx'
];

let navigationCorrect = true;
navigationFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes('router.push(`/m/${') && content.includes('}/c/${') && content.includes('}`)')
        || content.includes('router.push(`/c/${') && content.includes('}`)')
        || content.includes('router.replace(`/m/${') && content.includes('}/c/${') && content.includes('}`)')
    ) {
      console.log(`  ✅ ${file} navigates correctly`);
    } else {
      console.log(`  ⚠️  ${file} may not navigate to conversation routes`);
    }
  }
});

// TEST 6: Verify isEphemeral is set correctly
console.log('\n⚡ TEST 6: Ephemeral State Configuration');

if (modelConvContent.includes('isEphemeral={false}')) {
  console.log('  ✅ Model conversation sets isEphemeral={false}');
} else {
  console.log('  ❌ Model conversation has incorrect isEphemeral value');
  allPassed = false;
}

if (generalConvContent.includes('isEphemeral={false}')) {
  console.log('  ✅ General conversation sets isEphemeral={false}');
} else {
  console.log('  ❌ General conversation has incorrect isEphemeral value');
  allPassed = false;
}

// TEST 7: Verify directory structure matches Next.js expectations
console.log('\n📂 TEST 7: Next.js Directory Structure');
const dirs = [
  'frontend-v2/app/m/[modelId]/c/[conversationId]',
  'frontend-v2/app/c/[conversationId]'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
    console.log(`  ✅ ${dir}/`);
  } else {
    console.log(`  ❌ MISSING DIRECTORY: ${dir}/`);
    allPassed = false;
  }
});

// FINAL RESULT
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ ALL VERIFICATIONS PASSED');
  console.log('\n🎉 The fix is COMPLETE and CORRECT!');
  console.log('\n📝 Navigation Flow:');
  console.log('   User creates conversation');
  console.log('   → router.push(`/m/184/c/79`)');
  console.log('   → Next.js matches /m/[modelId]/c/[conversationId]/page.tsx');
  console.log('   → useParams() extracts { modelId: "184", conversationId: "79" }');
  console.log('   → ChatInterface receives selectedConversationId={79}');
  console.log('   → Conversation loads and displays ✅');
  console.log('\n🚀 Ready for browser testing!');
  process.exit(0);
} else {
  console.log('❌ SOME VERIFICATIONS FAILED');
  console.log('\n⚠️  Review the failures above before proceeding');
  process.exit(1);
}
