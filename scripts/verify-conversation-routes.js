/**
 * Test Script: Verify Conversation Routes Exist
 * 
 * Purpose: Verify that the missing conversation route pages now exist
 * Bug: BUG-015 - 404 error when navigating to /m/[modelId]/c/[conversationId]
 * 
 * Expected Results:
 * ✅ File exists: /app/m/[modelId]/c/[conversationId]/page.tsx
 * ✅ File exists: /app/c/[conversationId]/page.tsx
 * ✅ Both files export default function
 * ✅ Both files use useParams() to extract route params
 * 
 * Run: node scripts/verify-conversation-routes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Conversation Route Pages...\n');

const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

function test(description, assertion) {
  tests.total++;
  try {
    if (assertion()) {
      console.log(`✅ ${description}`);
      tests.passed++;
      return true;
    } else {
      console.log(`❌ ${description}`);
      tests.failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    tests.failed++;
    return false;
  }
}

// Test 1: Model conversation route page exists
const modelConvPath = path.join(__dirname, '../frontend-v2/app/m/[modelId]/c/[conversationId]/page.tsx');
test('Model conversation route page exists', () => {
  return fs.existsSync(modelConvPath);
});

// Test 2: General conversation route page exists
const generalConvPath = path.join(__dirname, '../frontend-v2/app/c/[conversationId]/page.tsx');
test('General conversation route page exists', () => {
  return fs.existsSync(generalConvPath);
});

// Test 3: Model conversation page has correct structure
if (fs.existsSync(modelConvPath)) {
  const modelConvContent = fs.readFileSync(modelConvPath, 'utf-8');
  
  test('Model conversation page exports default function', () => {
    return modelConvContent.includes('export default function');
  });
  
  test('Model conversation page uses useParams', () => {
    return modelConvContent.includes('useParams()');
  });
  
  test('Model conversation page extracts modelId param', () => {
    return modelConvContent.includes('params.modelId');
  });
  
  test('Model conversation page extracts conversationId param', () => {
    return modelConvContent.includes('params.conversationId');
  });
  
  test('Model conversation page passes selectedConversationId to ChatInterface', () => {
    return modelConvContent.includes('selectedConversationId={conversationId');
  });
  
  test('Model conversation page sets isEphemeral={false}', () => {
    return modelConvContent.includes('isEphemeral={false}');
  });
}

// Test 4: General conversation page has correct structure
if (fs.existsSync(generalConvPath)) {
  const generalConvContent = fs.readFileSync(generalConvPath, 'utf-8');
  
  test('General conversation page exports default function', () => {
    return generalConvContent.includes('export default function');
  });
  
  test('General conversation page uses useParams', () => {
    return generalConvContent.includes('useParams()');
  });
  
  test('General conversation page extracts conversationId param', () => {
    return generalConvContent.includes('params.conversationId');
  });
  
  test('General conversation page passes selectedConversationId to ChatInterface', () => {
    return generalConvContent.includes('selectedConversationId={conversationId');
  });
  
  test('General conversation page sets isEphemeral={false}', () => {
    return generalConvContent.includes('isEphemeral={false}');
  });
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`📊 Test Results: ${tests.passed}/${tests.total} passed`);
if (tests.failed > 0) {
  console.log(`❌ ${tests.failed} test(s) failed`);
  console.log('\n🔴 FIX INCOMPLETE - Routes not properly configured');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  console.log('\n🎉 SUCCESS - Conversation routes now exist and are properly configured');
  console.log('\n📝 Next Step: Test the actual navigation in the browser');
  console.log('   1. Start the Next.js dev server');
  console.log('   2. Create a new conversation');
  console.log('   3. Verify URL changes to /m/[modelId]/c/[id] without 404');
  process.exit(0);
}
