/**
 * Master Test Suite Runner for ByteCraft Backend
 * 
 * WHY:
 * 1. Automatically ensures test server (port 5001, DB: bytecraft_test) is up and healthy.
 * 2. Runs all Phase 1-7 test suites sequentially in isolated child processes.
 * 3. Provides clean execution summaries and ensures proper server cleanup.
 */

const { spawn, fork } = require('child_process');
const path = require('path');

const PORT = 5001;
const HEALTH_URL = `http://localhost:${PORT}/api/health`;

const TEST_SUITES = [
  { name: 'Phase 1: Foundation, Auth & Settings', file: 'phase1.test.js' },
  { name: 'Phase 2: Image Uploads & Catalog (Categories/Projects)', file: 'phase2.test.js' },
  { name: 'Phase 3: Service Plans, Tax-Free Pricing & Coupons', file: 'phase3.test.js' },
  { name: 'Phase 4: Orders, Transactions & Manual Payments', file: 'phase4.test.js' },
  { name: 'Phase 5: Paymob Gateway Integration & Webhooks', file: 'phase5.test.js' },
  { name: 'Phase 6: Reviews, Inquiries & Aggregations', file: 'phase6.test.js' },
  { name: 'Phase 7: Hardening, Allow-lists & Privacy Protections', file: 'phase7.test.js' },
];

async function isServerRunning() {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(1500) });
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

async function waitForServer(maxWaitMs = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (await isServerRunning()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function runSuite(file) {
  return new Promise((resolve) => {
    const suitePath = path.resolve(__dirname, file);
    const child = fork(suitePath, [], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', (err) => {
      console.error(`Error executing suite ${file}:`, err.message);
      resolve(false);
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('🚀 ByteCraft Master Test Runner');
  console.log(`📡 Target Test Port: ${PORT} (Database: bytecraft_test)`);
  console.log('====================================================\n');

  let testServerProcess = null;
  const alreadyRunning = await isServerRunning();

  if (alreadyRunning) {
    console.log('✅ Found existing test server running on port 5001.\n');
  } else {
    console.log('⏳ Spawning test server on port 5001 (src/testServer.js)...');
    testServerProcess = spawn('node', ['src/testServer.js'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });

    const ready = await waitForServer(30000);
    if (!ready) {
      console.error('❌ Failed to launch test server on port 5001 within 30s.');
      if (testServerProcess) testServerProcess.kill();
      process.exit(1);
    }
    console.log('✅ Test server is up and responsive on port 5001.\n');
  }

  const results = [];

  for (const suite of TEST_SUITES) {
    console.log(`\n====================================================`);
    console.log(`▶️ Running: ${suite.name} (${suite.file})`);
    console.log(`====================================================\n`);

    const passed = await runSuite(suite.file);
    results.push({ name: suite.name, file: suite.file, passed });

    if (!passed) {
      console.error(`\n⚠️ Suite "${suite.name}" reported failures.\n`);
    }
  }

  // Teardown spawned server if we started it
  if (testServerProcess) {
    console.log('\n🛑 Shutting down spawned test server...');
    testServerProcess.kill('SIGTERM');
  }

  console.log('\n====================================================');
  console.log('📊 FINAL TEST SUITE RESULTS:');
  console.log('====================================================');

  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${symbol} | ${r.name}`);
    if (!r.passed) allPassed = false;
  }
  console.log('====================================================\n');

  if (!allPassed) {
    console.error('❌ One or more test suites failed.');
    process.exit(1);
  } else {
    console.log('🎉 ALL 7 TEST SUITES PASSED CLEANLY (100% OK)!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
