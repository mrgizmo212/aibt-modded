/**
 * CHECK SERVICES
 * 
 * Verifies frontend and backend are running before tests
 */

async function checkServices() {
  console.log('🔍 Checking if services are running...');
  console.log('='.repeat(70));
  
  let frontendOk = false;
  let backendOk = false;
  
  // Check frontend (Next.js)
  try {
    const response = await fetch('http://localhost:3000');
    frontendOk = response.ok || response.status === 404; // 404 is OK (page exists but route not found)
    console.log(`✅ Frontend: Running on http://localhost:3000`);
  } catch (e) {
    console.log(`❌ Frontend: NOT running on http://localhost:3000`);
    console.log(`   Error: ${e.message}`);
  }
  
  // Check backend (FastAPI)
  try {
    const response = await fetch('http://localhost:8080/api/health');
    backendOk = response.ok;
    console.log(`✅ Backend: Running on http://localhost:8080`);
  } catch (e) {
    console.log(`❌ Backend: NOT running on http://localhost:8080`);
    console.log(`   Error: ${e.message}`);
  }
  
  console.log('');
  console.log('='.repeat(70));
  
  if (frontendOk && backendOk) {
    console.log('✅ ALL SERVICES RUNNING - Ready to test!');
    console.log('');
    console.log('Run tests with:');
    console.log('  npm run verify:rerender-storm');
    console.log('  npm run verify:eventsource-leak');
    console.log('  npm run verify:polling-spam');
    console.log('  npm run verify:all');
    return true;
  } else {
    console.log('❌ SERVICES NOT READY');
    console.log('');
    console.log('Start missing services:');
    
    if (!frontendOk) {
      console.log('');
      console.log('Frontend:');
      console.log('  cd frontend-v2');
      console.log('  npm run dev');
    }
    
    if (!backendOk) {
      console.log('');
      console.log('Backend:');
      console.log('  cd backend');
      console.log('  python main.py');
    }
    
    console.log('');
    console.log('Then run: npm run verify:all');
    return false;
  }
}

checkServices().catch(console.error);

