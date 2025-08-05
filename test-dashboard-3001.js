const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDashboard3001() {
  console.log('🎭 Starting Playwright dashboard test on port 3001...\n');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'dashboard-test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch({ 
    headless: false, // Keep browser visible for debugging
    slowMo: 500 // Slow down actions for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Array to collect all console messages
  const consoleMessages = [];
  
  // Listen to all console events
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: msg.type(),
      text: msg.text(),
      args: msg.args().map(arg => arg.toString())
    };
    
    consoleMessages.push(logEntry);
    
    // Highlight important messages
    if (msg.text().includes('role') || msg.text().includes('auth') || msg.text().includes('dashboard') || msg.text().includes('error')) {
      console.log(`🔥 [${timestamp}] [${msg.type().toUpperCase()}] ${msg.text()}`);
    } else {
      console.log(`📝 [${timestamp}] [${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
    consoleMessages.push({
      timestamp: new Date().toISOString(),
      type: 'error',
      text: `Page Error: ${error.message}`,
      args: []
    });
  });

  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('auth') || request.url().includes('dashboard')) {
      console.log(`🌐 Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/') || response.url().includes('auth') || response.url().includes('dashboard')) {
      console.log(`📡 Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // Step 1: Navigate to login page on port 3001
    console.log('\n🚀 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png') });
    console.log(`📸 Screenshot saved: 01-login-page.png`);
    console.log(`Current URL: ${page.url()}`);

    // Step 2: Login with specified credentials
    console.log('\n🔐 Step 2: Logging in with todays777@gmail.com...');
    
    // Wait for login form elements
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    // Fill login credentials
    await page.fill('input[type="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"]', 'your-new-password');
    
    await page.screenshot({ path: path.join(screenshotsDir, '02-login-filled.png') });
    console.log(`📸 Screenshot saved: 02-login-filled.png`);
    
    // Submit login form
    await page.click('button[type="submit"]');
    console.log('🔑 Login form submitted...');
    
    // Wait for login to complete
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '03-after-login.png') });
    console.log(`📸 Screenshot saved: 03-after-login.png`);
    console.log(`URL after login: ${page.url()}`);

    // Step 3: Navigate to the specific dashboard URL
    console.log('\n🏢 Step 3: Navigating to organization dashboard...');
    const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard';
    console.log(`Navigating to: ${dashboardUrl}`);
    
    // Clear previous console messages to focus on dashboard loading
    consoleMessages.length = 0;
    console.log('\n🔍 === MONITORING DASHBOARD LOADING ===');
    
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
    
    // Wait for dashboard to load and capture any dynamic content
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: path.join(screenshotsDir, '04-dashboard-initial.png') });
    console.log(`📸 Screenshot saved: 04-dashboard-initial.png`);
    console.log(`Current URL: ${page.url()}`);

    // Step 4: Check for dashboard elements and data loading
    console.log('\n📊 Step 4: Analyzing dashboard content...');
    
    // Look for common dashboard elements
    const dashboardElements = await page.evaluate(() => {
      const elements = {
        hasHeader: !!document.querySelector('header, [role="banner"], nav'),
        hasSidebar: !!document.querySelector('[role="navigation"], .sidebar, nav'),
        hasMainContent: !!document.querySelector('main, [role="main"], .main-content'),
        hasDataTables: !!document.querySelector('table, .table, [role="table"]'),
        hasCharts: !!document.querySelector('.recharts-wrapper, canvas, svg'),
        hasCards: !!document.querySelector('.card, [data-testid*="card"]'),
        hasLoadingStates: !!document.querySelector('[data-loading], .loading, .spinner'),
        totalElements: document.querySelectorAll('*').length,
        bodyText: document.body.innerText.substring(0, 500), // First 500 chars
        hasErrorMessages: !!document.querySelector('[role="alert"], .error, .alert-error')
      };
      return elements;
    });

    console.log('\n🔍 Dashboard Elements Analysis:');
    Object.entries(dashboardElements).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Step 5: Check console logs for role assignment issues
    console.log('\n📋 Step 5: Console Log Analysis:');
    
    // Filter for authentication/role related messages
    const authMessages = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('role') ||
      msg.text.toLowerCase().includes('auth') ||
      msg.text.toLowerCase().includes('permission') ||
      msg.text.toLowerCase().includes('admin') ||
      msg.text.toLowerCase().includes('access')
    );

    console.log('\n🎭 Authentication/Role Messages:');
    if (authMessages.length > 0) {
      authMessages.forEach(msg => {
        console.log(`  [${msg.timestamp}] [${msg.type}] ${msg.text}`);
      });
    } else {
      console.log('  ✅ No authentication/role error messages found');
    }

    // Filter for error messages
    const errorMessages = consoleMessages.filter(msg => 
      msg.type === 'error' || 
      msg.text.toLowerCase().includes('error') ||
      msg.text.toLowerCase().includes('failed')
    );

    console.log('\n❌ Error Messages:');
    if (errorMessages.length > 0) {
      errorMessages.forEach(msg => {
        console.log(`  [${msg.timestamp}] [${msg.type}] ${msg.text}`);
      });
    } else {
      console.log('  ✅ No error messages found');
    }

    // Step 6: Take final screenshot with developer tools open
    console.log('\n📸 Step 6: Taking final screenshots...');
    
    // Open developer tools to show console
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);
    
    // Click on Console tab if not already selected
    try {
      await page.click('text=Console', { timeout: 2000 });
    } catch (e) {
      // Console tab might already be selected or have different text
    }
    
    await page.screenshot({ path: path.join(screenshotsDir, '05-final-with-console.png') });
    console.log(`📸 Screenshot saved: 05-final-with-console.png`);

    // Take a screenshot with network tab too
    try {
      await page.click('text=Network', { timeout: 2000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '06-network-tab.png') });
      console.log(`📸 Screenshot saved: 06-network-tab.png`);
    } catch (e) {
      console.log('Could not access Network tab');
    }

    // Step 7: Generate comprehensive report
    const testReport = {
      testRun: new Date().toISOString(),
      testUrl: dashboardUrl,
      finalUrl: page.url(),
      accessGranted: page.url().includes('/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard'),
      dashboardElements,
      authMessages,
      errorMessages,
      allConsoleMessages: consoleMessages,
      summary: {
        loginSuccessful: !page.url().includes('/login'),
        reachedDashboard: page.url().includes('/dashboard'),
        hasAuthErrors: errorMessages.some(msg => 
          msg.text.toLowerCase().includes('auth') || 
          msg.text.toLowerCase().includes('permission')
        ),
        hasDataLoaded: dashboardElements.totalElements > 50, // Basic heuristic
        roleIssueResolved: !consoleMessages.some(msg => 
          msg.text.toLowerCase().includes('role') && 
          msg.text.toLowerCase().includes('error')
        )
      }
    };

    // Save detailed report
    fs.writeFileSync(
      path.join(screenshotsDir, 'dashboard-test-report.json'), 
      JSON.stringify(testReport, null, 2)
    );
    console.log(`📄 Test report saved: dashboard-test-report.json`);

    // Print summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('================');
    Object.entries(testReport.summary).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      console.log(`${icon} ${key}: ${value}`);
    });

  } catch (error) {
    console.error(`❌ Test Error: ${error.message}`);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-screenshot.png') });
    
    // Save error details
    const errorData = {
      error: error.message,
      stack: error.stack,
      url: page.url(),
      consoleMessages
    };
    fs.writeFileSync(
      path.join(screenshotsDir, 'error-log.json'), 
      JSON.stringify(errorData, null, 2)
    );
  } finally {
    console.log('\n🎭 Test completed. Check the dashboard-test-screenshots folder for all captures.');
    console.log(`📁 Screenshots location: ${screenshotsDir}`);
    
    // Keep browser open for manual inspection
    console.log('\n⏳ Browser will remain open for 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);
    
    await browser.close();
  }
}

// Run the dashboard test
testDashboard3001().catch(console.error);