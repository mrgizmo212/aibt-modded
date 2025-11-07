/**
 * Run Route Verification Test
 * 
 * Purpose: Verify BUG-027 fix - dedicated run route exists and is properly configured
 * 
 * How to run:
 * node scripts/test-run-route-exists.js
 * 
 * Tests:
 * 1. /m/[modelId]/r/[runId]/page.tsx exists
 * 2. File exports default function
 * 3. File uses useParams to extract runId
 * 4. File passes runId to ContextPanel
 * 5. Context is set to "run"
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Run Route Verification Test')
console.log('═══════════════════════════════════════════════')
console.log('')

let passed = 0
let failed = 0

function test(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`)
    passed++
  } else {
    console.log(`❌ ${name}`)
    failed++
  }
}

// Test 1: File exists
const routePath = path.join(__dirname, '../frontend-v2/app/m/[modelId]/r/[runId]/page.tsx')
const fileExists = fs.existsSync(routePath)
test('Run route file exists', fileExists)

if (!fileExists) {
  console.log('')
  console.log(`❌ CRITICAL: File not found at ${routePath}`)
  console.log('Cannot continue tests without the file.')
  process.exit(1)
}

// Read file content
const content = fs.readFileSync(routePath, 'utf-8')

// Test 2: Exports default function
const hasDefaultExport = content.includes('export default function RunAnalysisPage')
test('File exports default function RunAnalysisPage', hasDefaultExport)

// Test 3: Uses useParams
const usesUseParams = content.includes('useParams()')
test('File uses useParams hook', usesUseParams)

// Test 4: Extracts runId param
const extractsRunId = content.includes('params.runId')
test('File extracts runId from params', extractsRunId)

// Test 5: Extracts modelId param
const extractsModelId = content.includes('params.modelId')
test('File extracts modelId from params', extractsModelId)

// Test 6: Passes runId to ContextPanel
const passesRunIdToContext = content.includes('selectedRunId={runId}') && content.includes('<ContextPanel')
test('File passes runId to ContextPanel', passesRunIdToContext)

// Test 7: Context is "run"
const contextIsRun = content.includes('context="run"') || content.includes('useState<"dashboard" | "model" | "run">("run")')
test('Context is set to "run"', contextIsRun)

// Test 8: Has NavigationSidebar
const hasNavSidebar = content.includes('<NavigationSidebar')
test('File includes NavigationSidebar', hasNavSidebar)

// Test 9: Has ChatInterface
const hasChatInterface = content.includes('<ChatInterface')
test('File includes ChatInterface', hasChatInterface)

// Test 10: Has mobile drawer
const hasMobileDrawer = content.includes('<MobileDrawer')
test('File includes MobileDrawer for mobile support', hasMobileDrawer)

// Test 11: Handles run click navigation
const handlesRunClick = content.includes('handleRunClick') && content.includes('router.push')
test('File handles run click with proper navigation', handlesRunClick)

console.log('')
console.log('═══════════════════════════════════════════════')
console.log(`📊 Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('✅ ALL TESTS PASSED!')
  console.log('✅ Run route is properly configured')
  console.log('')
  console.log('Next steps:')
  console.log('1. Test manually by clicking a run')
  console.log('2. Verify URL changes to /m/[modelId]/r/[runId]')
  console.log('3. Verify sidebar shows run details')
  console.log('4. Verify chat interface shows run context')
  process.exit(0)
} else {
  console.log(`❌ ${failed} test(s) failed`)
  console.log('Please review the run route implementation')
  process.exit(1)
}

