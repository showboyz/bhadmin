const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debugOrganizationAccess() {
  console.log('🎭 Starting Playwright organization access debugging...\n');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'debug-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch({ 
    headless: false, // Keep browser visible for debugging
    slowMo: 1000 // Slow down actions for better observation
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
    
    // Real-time console output with highlighting for debug messages
    if (msg.text().includes('🔍') || msg.text().includes('🏢') || msg.text().includes('isSuperAdmin') || msg.text().includes('Access check')) {
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

  // Listen to network requests for additional context
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('auth')) {
      console.log(`🌐 Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/') || response.url().includes('auth')) {
      console.log(`📡 Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log('\n🚀 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png') });
    console.log(`📸 Screenshot saved: 01-login-page.png`);
    console.log(`Current URL: ${page.url()}`);

    // Step 2: Login with credentials
    console.log('\n🔐 Step 2: Logging in with credentials...');
    
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

    // Step 3: Navigate directly to organization dashboard
    console.log('\n🏢 Step 3: Navigating to organization dashboard...');
    const orgUrl = 'http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard';
    console.log(`Navigating to: ${orgUrl}`);
    
    // Clear console messages before navigation to focus on access check
    consoleMessages.length = 0;
    console.log('\n🔍 === STARTING ACCESS CHECK MONITORING ===');
    
    await page.goto(orgUrl, { waitUntil: 'networkidle' });
    
    // Wait a bit more to catch all console messages
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(screenshotsDir, '04-org-dashboard-attempt.png') });
    console.log(`📸 Screenshot saved: 04-org-dashboard-attempt.png`);
    console.log(`URL after org navigation: ${page.url()}`);

    // Step 4: Check if we stayed or were redirected
    const currentUrl = page.url();
    const stayedOnOrgDashboard = currentUrl.includes('/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    const redirectedToDashboard = currentUrl.includes('/dashboard') && !currentUrl.includes('/org/');
    
    console.log('\n📊 Navigation Result Analysis:');
    console.log(`Final URL: ${currentUrl}`);
    console.log(`Stayed on org dashboard: ${stayedOnOrgDashboard}`);
    console.log(`Redirected to main dashboard: ${redirectedToDashboard}`);

    // Step 5: If redirected, try refreshing
    if (redirectedToDashboard) {
      console.log('\n🔄 Step 5: Detected redirect - attempting refresh...');
      
      // Navigate back to org dashboard
      await page.goto(orgUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Refresh the page
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: path.join(screenshotsDir, '05-after-refresh.png') });
      console.log(`📸 Screenshot saved: 05-after-refresh.png`);
      console.log(`URL after refresh: ${page.url()}`);
    }

    // Step 6: Capture final console state
    console.log('\n📋 Final Console Analysis:');
    
    // Filter for important debug messages
    const debugMessages = consoleMessages.filter(msg => 
      msg.text.includes('🔍') || 
      msg.text.includes('🏢') || 
      msg.text.includes('isSuperAdmin') || 
      msg.text.includes('Access check') ||
      msg.text.includes('Loading states') ||
      msg.text.includes('Organization access check') ||
      msg.text.includes('roles')
    );

    console.log('\n🎯 Key Debug Messages Found:');
    debugMessages.forEach(msg => {
      console.log(`  [${msg.timestamp}] [${msg.type}] ${msg.text}`);
    });

    // Look for super admin status
    const superAdminMessages = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('issuperadmin') || 
      msg.text.toLowerCase().includes('super admin')
    );

    console.log('\n👑 Super Admin Status Messages:');
    if (superAdminMessages.length > 0) {
      superAdminMessages.forEach(msg => {
        console.log(`  [${msg.timestamp}] ${msg.text}`);
      });
    } else {
      console.log('  ❌ No super admin status messages found');
    }

    // Look for role-related messages
    const roleMessages = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('role') || 
      msg.text.toLowerCase().includes('permission')
    );

    console.log('\n🎭 Role/Permission Messages:');
    if (roleMessages.length > 0) {
      roleMessages.forEach(msg => {
        console.log(`  [${msg.timestamp}] ${msg.text}`);
      });
    } else {
      console.log('  ❌ No role/permission messages found');
    }

    // Save detailed console log to file
    const logData = {
      testRun: new Date().toISOString(),
      finalUrl: page.url(),
      stayedOnOrgDashboard,
      redirectedToDashboard,
      allConsoleMessages: consoleMessages,
      debugMessages,
      superAdminMessages,
      roleMessages
    };

    fs.writeFileSync(
      path.join(screenshotsDir, 'console-debug-log.json'), 
      JSON.stringify(logData, null, 2)
    );
    console.log(`📄 Detailed log saved: console-debug-log.json`);

    // Final screenshot with console open
    await page.keyboard.press('F12'); // Open dev tools
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '06-final-with-console.png') });
    console.log(`📸 Screenshot saved: 06-final-with-console.png`);

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
    console.log('\n🎭 Test completed. Check the debug-screenshots folder for all captures.');
    console.log(`📁 Screenshots location: ${screenshotsDir}`);
    
    // Keep browser open for manual inspection
    console.log('\n⏳ Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
    await browser.close();
  }
}

// Run the debug test
debugOrganizationAccess().catch(console.error);