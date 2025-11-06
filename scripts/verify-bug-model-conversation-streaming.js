/**
 * BUG VERIFICATION: Model Conversation Streaming Not Working
 * 
 * Issue: When on /m/184/c/80, sending a message doesn't get a reply
 * 
 * Expected Behavior:
 * - User navigates to /m/184/c/80
 * - User sends message "Hello"
 * - Backend receives model_id=184 in query params
 * - Backend saves message with model_id=184 to conversation 80
 * - Backend streams AI response
 * - Backend saves AI response with model_id=184 to conversation 80
 * 
 * Actual Behavior:
 * - User sends message "Hello"
 * - Backend receives model_id=184 in query params ✅
 * - Backend SAVES message with model_id=NULL to DIFFERENT conversation ❌
 * - Backend streams AI response (maybe)
 * - Backend SAVES AI response with model_id=NULL to DIFFERENT conversation ❌
 * - User sees "streaming..." forever because messages go to wrong conversation
 * 
 * Root Cause:
 * In backend/main.py line 1918 (@app.get("/api/chat/general-stream")):
 * - Lines 2018-2022: Creates session with model_id=None (hardcoded)
 * - Lines 2161-2166: Saves user message with model_id=None (hardcoded)
 * - Lines 2170-2176: Saves AI response with model_id=None (hardcoded)
 * 
 * Even though model_id IS passed in query params (line 1922), it's NOT being used
 * when saving messages - it's ONLY used for loading model context (lines 2044-2093)
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 BUG VERIFICATION: Model Conversation Streaming\n');

// Read the backend file
const backendPath = path.join(__dirname, '../backend/main.py');
const backendCode = fs.readFileSync(backendPath, 'utf8');

// Test 1: Check if endpoint accepts model_id parameter
const test1 = backendCode.includes('model_id: Optional[int] = None  # ← NEW: Optional model context');
console.log(`Test 1: Endpoint accepts model_id parameter: ${test1 ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Check if model_id is used when creating session (THIS SHOULD FAIL - proving the bug)
const sessionCreationRegex = /await get_or_create_session_v2\([^)]*model_id=None/;
const test2Fails = sessionCreationRegex.test(backendCode);
console.log(`Test 2: Session created with model_id=None (BUG): ${test2Fails ? '❌ BUG CONFIRMED' : '✅ FIXED'}`);

// Test 3: Check if model_id is used when saving user message (THIS SHOULD FAIL - proving the bug)
const userMessageSaveRegex = /await save_chat_message_v2\([^)]*user[^)]*model_id=None/s;
const test3Fails = userMessageSaveRegex.test(backendCode);
console.log(`Test 3: User message saved with model_id=None (BUG): ${test3Fails ? '❌ BUG CONFIRMED' : '✅ FIXED'}`);

// Test 4: Check if model_id is used when saving AI response (THIS SHOULD FAIL - proving the bug)
const aiMessageSaveRegex = /await save_chat_message_v2\([^)]*assistant[^)]*model_id=None/s;
const test4Fails = aiMessageSaveRegex.test(backendCode);
console.log(`Test 4: AI response saved with model_id=None (BUG): ${test4Fails ? '❌ BUG CONFIRMED' : '✅ FIXED'}`);

// Test 5: Check if model_id IS being used for context loading (should pass)
const contextLoadingRegex = /if model_id:[^}]*model_data = supabase\.table\("models"\)/s;
const test5 = contextLoadingRegex.test(backendCode);
console.log(`Test 5: model_id used for loading context: ${test5 ? '✅ PASS' : '❌ FAIL'}`);

// Summary
console.log('\n📊 SUMMARY:');
if (test2Fails && test3Fails && test4Fails) {
  console.log('❌ BUG CONFIRMED: Messages are being saved to general conversation (model_id=None)');
  console.log('   even though model_id IS being passed in the request.');
  console.log('\n💡 FIX REQUIRED:');
  console.log('   Change lines 2019-2021, 2165, and 2174 in backend/main.py');
  console.log('   from: model_id=None');
  console.log('   to: model_id=model_id  (use the parameter value)');
  process.exit(1);  // Exit with error to indicate bug exists
} else {
  console.log('✅ BUG FIXED: model_id is being used correctly');
  process.exit(0);  // Exit success
}
