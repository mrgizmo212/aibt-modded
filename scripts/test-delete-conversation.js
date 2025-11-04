#!/usr/bin/env node
/**
 * DELETE CONVERSATION DEBUG TEST
 * 
 * Purpose: Reproduce and diagnose the 403 Forbidden error when deleting conversations
 * 
 * Test Flow:
 * 1. Login and get JWT token
 * 2. List existing conversations
 * 3. Query database directly to verify session exists
 * 4. Decode JWT to extract user_id
 * 5. Compare user_id values (JWT vs Database)
 * 6. Attempt DELETE operation
 * 7. Verify deletion status
 * 8. Generate diagnostic report
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}${'═'.repeat(63)}`),
  section: (msg) => console.log(`${colors.cyan}${colors.bright}  ${msg}${colors.reset}`),
  divider: () => console.log(`${colors.cyan}${'═'.repeat(63)}${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  data: (label, value) => console.log(`${colors.blue}📋 ${label}: ${colors.reset}${value}`),
  step: (num, total, msg) => console.log(`\n${colors.bright}[${num}/${total}] ${msg}${colors.reset}`),
};

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '../backend/.env');
  if (!fs.existsSync(envPath)) {
    log.error('.env file not found at backend/.env');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      env[key.trim()] = value.trim();
    }
  });

  return env;
}

// Decode JWT token (manual base64 decode)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Decode payload (middle part)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error.message}`);
  }
}

// Main test function
async function runTest() {
  log.header();
  log.section('🐛 DELETE CONVERSATION DEBUG TEST');
  log.divider();

  const env = loadEnv();
  const API_BASE = 'http://localhost:8080';
  const TEST_EMAIL = 'adam@truetradinggroup.com';
  const TEST_PASSWORD = 'adminpass123';

  let jwtToken = null;
  let userId = null;
  let sessionId = null;
  let dbSessionData = null;

  try {
    // ========================================================================
    // STEP 1: Load Environment
    // ========================================================================
    log.step(1, 10, 'Loading environment...');
    
    if (env.DATABASE_URL) {
      log.success('Loaded DATABASE_URL');
    } else {
      log.warning('DATABASE_URL not found in .env');
    }
    
    if (env.SUPABASE_URL) {
      log.success('Loaded SUPABASE_URL');
      log.data('Supabase URL', env.SUPABASE_URL);
    } else {
      log.error('SUPABASE_URL not found in .env');
      process.exit(1);
    }

    // ========================================================================
    // STEP 2: Login
    // ========================================================================
    log.step(2, 10, 'Logging in...');
    
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      log.error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      log.data('Response', errorText);
      process.exit(1);
    }

    const loginData = await loginResponse.json();
    jwtToken = loginData.session?.access_token || loginData.access_token;
    userId = loginData.user?.id;

    if (!jwtToken) {
      log.error('No access token in login response');
      log.data('Login response', JSON.stringify(loginData, null, 2));
      process.exit(1);
    }

    log.success('Login successful');
    log.data('User ID', userId);
    log.data('Token', `${jwtToken.substring(0, 20)}...`);

    // ========================================================================
    // STEP 3: List Conversations
    // ========================================================================
    log.step(3, 10, 'Fetching conversations...');
    
    const sessionsResponse = await fetch(`${API_BASE}/api/chat/sessions`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` },
    });

    if (!sessionsResponse.ok) {
      log.error(`Failed to fetch sessions: ${sessionsResponse.status}`);
      const errorText = await sessionsResponse.text();
      log.data('Error', errorText);
      process.exit(1);
    }

    const sessionsData = await sessionsResponse.json();
    const sessions = sessionsData.sessions || sessionsData;

    if (!sessions || sessions.length === 0) {
      log.warning('No conversations found');
      log.info('Creating a test session...');
      
      // Create test session
      const createResponse = await fetch(`${API_BASE}/api/chat/sessions/new`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_id: null }),
      });

      if (!createResponse.ok) {
        log.error(`Failed to create session: ${createResponse.status}`);
        process.exit(1);
      }

      const newSession = await createResponse.json();
      sessionId = newSession.session?.id || newSession.id;
      
      log.success('Test session created');
      log.data('Session ID', sessionId);
      
      // Wait for DB commit
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      sessionId = sessions[0].id;
      log.success(`Found ${sessions.length} conversation(s)`);
      log.data('Testing with session ID', sessionId);
    }

    // ========================================================================
    // STEP 4: Query Database Directly
    // ========================================================================
    log.step(4, 10, 'Verifying session in database...');
    
    // Use Supabase REST API to query database
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    
    const dbQueryResponse = await fetch(
      `${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!dbQueryResponse.ok) {
      log.error(`Database query failed: ${dbQueryResponse.status}`);
      const errorText = await dbQueryResponse.text();
      log.data('Error', errorText);
    } else {
      const dbData = await dbQueryResponse.json();
      
      if (dbData && dbData.length > 0) {
        dbSessionData = dbData[0];
        log.success('Session exists in database');
        log.data('DB Session ID', dbSessionData.id);
        log.data('DB User ID', dbSessionData.user_id || '(NULL)');
        log.data('DB Model ID', dbSessionData.model_id || '(NULL)');
        log.data('DB Title', dbSessionData.session_title || '(empty)');
        log.data('DB Created', dbSessionData.created_at);
      } else {
        log.error('Session NOT found in database');
      }
    }

    // ========================================================================
    // STEP 5: Decode JWT Token
    // ========================================================================
    log.step(5, 10, 'Decoding JWT token...');
    
    try {
      const jwtPayload = decodeJWT(jwtToken);
      log.success('JWT decoded successfully');
      log.data('JWT sub (user_id)', jwtPayload.sub);
      log.data('JWT email', jwtPayload.email);
      log.data('JWT role', jwtPayload.user_metadata?.role || '(not set)');
      log.data('JWT aud', jwtPayload.aud);
      log.data('JWT exp', new Date(jwtPayload.exp * 1000).toISOString());
    } catch (error) {
      log.error(`Failed to decode JWT: ${error.message}`);
    }

    // ========================================================================
    // STEP 6: Compare User IDs
    // ========================================================================
    log.step(6, 10, 'Comparing user IDs...');
    
    if (dbSessionData) {
      const jwtUserId = decodeJWT(jwtToken).sub;
      const dbUserId = dbSessionData.user_id;
      
      log.data('JWT user_id', `"${jwtUserId}" (type: ${typeof jwtUserId})`);
      log.data('DB user_id', dbUserId ? `"${dbUserId}" (type: ${typeof dbUserId})` : '(NULL)');
      
      if (!dbUserId) {
        log.error('Database user_id is NULL - This is the problem!');
      } else if (jwtUserId === dbUserId) {
        log.success('User IDs match exactly (===)');
      } else if (String(jwtUserId) === String(dbUserId)) {
        log.warning('User IDs match as strings but not exact types');
      } else {
        log.error('User IDs DO NOT match');
        log.data('JWT', jwtUserId);
        log.data('DB', dbUserId);
      }
    }

    // ========================================================================
    // STEP 7: Attempt DELETE
    // ========================================================================
    log.step(7, 10, 'Attempting DELETE...');
    
    log.info(`DELETE ${API_BASE}/api/chat/sessions/${sessionId}`);
    log.info(`Authorization: Bearer ${jwtToken.substring(0, 30)}...`);
    
    const deleteResponse = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
      },
    });

    log.data('HTTP Status', deleteResponse.status);
    log.data('Status Text', deleteResponse.statusText);
    
    const deleteResponseText = await deleteResponse.text();
    let deleteResponseData;
    try {
      deleteResponseData = JSON.parse(deleteResponseText);
    } catch {
      deleteResponseData = deleteResponseText;
    }

    if (deleteResponse.ok) {
      log.success('DELETE succeeded!');
      log.data('Response', JSON.stringify(deleteResponseData, null, 2));
    } else {
      log.error(`DELETE failed with ${deleteResponse.status}`);
      log.data('Response', JSON.stringify(deleteResponseData, null, 2));
    }

    // ========================================================================
    // STEP 8: Verify Deletion Status
    // ========================================================================
    log.step(8, 10, 'Checking if session still exists...');
    
    const verifyResponse = await fetch(
      `${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}&select=id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      if (verifyData && verifyData.length > 0) {
        log.warning('Session still exists (not deleted)');
      } else {
        log.success('Session was deleted successfully');
      }
    }

    // ========================================================================
    // STEP 9: Generate Diagnostic Summary
    // ========================================================================
    log.step(9, 10, 'Generating diagnostic summary...');
    
    log.header();
    log.section('📊 DIAGNOSTIC SUMMARY');
    log.divider();
    
    console.log(`${colors.bright}Issue:${colors.reset} DELETE operation returns ${deleteResponse.ok ? colors.green + '200 OK' : colors.red + '403 Forbidden'}${colors.reset}`);
    console.log(`${colors.bright}User IDs:${colors.reset} ${dbSessionData?.user_id ? colors.green + '✅ PRESENT' : colors.red + '❌ NULL'}${colors.reset}`);
    console.log(`${colors.bright}Session exists:${colors.reset} ${dbSessionData ? colors.green + '✅ YES' : colors.red + '❌ NO'}${colors.reset}`);
    console.log(`${colors.bright}JWT valid:${colors.reset} ${jwtToken ? colors.green + '✅ YES' : colors.red + '❌ NO'}${colors.reset}`);
    console.log(`${colors.bright}Permission check:${colors.reset} ${deleteResponse.ok ? colors.green + '✅ PASSING' : colors.red + '❌ FAILING'}${colors.reset}`);
    
    console.log(`\n${colors.bright}Root Cause Analysis:${colors.reset}`);
    if (!dbSessionData?.user_id) {
      console.log(`${colors.red}🔴 Session has NULL user_id in database${colors.reset}`);
      console.log(`   This causes the ownership check to fail:`);
      console.log(`   SELECT * FROM chat_sessions WHERE id = ${sessionId} AND user_id = '${userId}'`);
      console.log(`   Returns NO rows because user_id IS NULL`);
    } else if (deleteResponse.ok) {
      console.log(`${colors.green}✅ No issues detected - DELETE succeeded${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  User IDs present but DELETE still failed${colors.reset}`);
      console.log(`   This suggests another issue (RLS policy, type mismatch, etc.)`);
    }
    
    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    console.log(`1. Check if session was created by OLD code that doesn't set user_id`);
    console.log(`2. Verify all session creation code paths set user_id`);
    console.log(`3. Run migration to backfill NULL user_id values`);
    console.log(`4. Check RLS policies on chat_sessions table`);
    
    log.step(10, 10, 'Test complete!');
    log.divider();

  } catch (error) {
    log.error(`Test failed with exception: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
