const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testLoginPersistence() {
  console.log('Starting login persistence test...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Set to true if you don't want to see the browser
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  try {
    console.log('Step 1: Navigate to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '1-login-page.png') });
    
    console.log('Step 2: Fill in login credentials...');
    await page.fill('input[type="email"], input[name="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'your-new-password');
    await page.screenshot({ path: path.join(screenshotsDir, '2-credentials-filled.png') });
    
    console.log('Step 3: Submit login form...');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    
    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Additional wait for any redirects
    
    console.log('Step 4: Verify successful login and redirect to super-admin dashboard...');
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    await page.screenshot({ path: path.join(screenshotsDir, '3-after-login.png') });
    
    // Check for any auth tokens or user info in localStorage/sessionStorage
    const authData = await page.evaluate(() => {
      return {
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
        cookies: document.cookie
      };
    });
    console.log('Auth data after login:', JSON.stringify(authData, null, 2));
    
    console.log('Step 5: Navigate to organization dashboard...');
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const orgDashboardUrl = page.url();
    console.log(`URL after navigating to org dashboard: ${orgDashboardUrl}`);
    await page.screenshot({ path: path.join(screenshotsDir, '4-org-dashboard-before-refresh.png') });
    
    console.log('Step 6: Capture console messages before refresh...');
    const consoleMessagesBefore = [];
    page.on('console', msg => consoleMessagesBefore.push(`${msg.type()}: ${msg.text()}`));
    
    console.log('Step 7: REFRESH THE PAGE...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for any redirects or auth checks
    
    const urlAfterRefresh = page.url();
    console.log(`URL after refresh: ${urlAfterRefresh}`);
    await page.screenshot({ path: path.join(screenshotsDir, '5-after-refresh.png') });
    
    console.log('Step 8: Check authentication state after refresh...');
    const authDataAfterRefresh = await page.evaluate(() => {
      return {
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
        cookies: document.cookie,
        currentPath: window.location.pathname,
        currentUrl: window.location.href
      };
    });
    
    // Capture any console errors or auth-related messages
    const consoleMessagesAfter = [];
    page.on('console', msg => consoleMessagesAfter.push(`${msg.type()}: ${msg.text()}`));
    
    // Wait a bit more to catch any delayed redirects
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    
    console.log('Step 9: Final verification...');
    await page.screenshot({ path: path.join(screenshotsDir, '6-final-state.png') });
    
    // Test Results Summary
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`Original URL before refresh: ${orgDashboardUrl}`);
    console.log(`URL immediately after refresh: ${urlAfterRefresh}`);
    console.log(`Final URL after waiting: ${finalUrl}`);
    
    const wasRedirectedToLogin = finalUrl.includes('/login');
    const stayedOnOrgDashboard = finalUrl.includes('/org/') && finalUrl.includes('/dashboard');
    
    console.log(`\nAuthentication Status:`);
    console.log(`- Redirected to login page: ${wasRedirectedToLogin}`);
    console.log(`- Stayed on org dashboard: ${stayedOnOrgDashboard}`);
    console.log(`- Session persisted: ${!wasRedirectedToLogin}`);
    
    console.log(`\nAuth data before refresh:`, JSON.stringify(authData, null, 2));
    console.log(`\nAuth data after refresh:`, JSON.stringify(authDataAfterRefresh, null, 2));
    
    console.log(`\nConsole messages before refresh:`, consoleMessagesBefore);
    console.log(`\nConsole messages after refresh:`, consoleMessagesAfter);
    
    // Check for specific auth-related items in storage
    const hasAuthToken = authDataAfterRefresh.localStorage.token || 
                        authDataAfterRefresh.localStorage.authToken || 
                        authDataAfterRefresh.localStorage.accessToken ||
                        authDataAfterRefresh.sessionStorage.token ||
                        authDataAfterRefresh.sessionStorage.authToken ||
                        authDataAfterRefresh.sessionStorage.accessToken;
    
    console.log(`\nAuth token present after refresh: ${!!hasAuthToken}`);
    
    if (hasAuthToken) {
      console.log(`Auth token value: ${hasAuthToken}`);
    }
    
    // Final assessment
    if (wasRedirectedToLogin) {
      console.log('\n❌ LOGIN PERSISTENCE FAILED: User was redirected to login page after refresh');
    } else if (stayedOnOrgDashboard) {
      console.log('\n✅ LOGIN PERSISTENCE SUCCESS: User remained on org dashboard after refresh');
    } else {
      console.log('\n⚠️ UNCLEAR RESULT: User was not redirected to login but also not on expected page');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-screenshot.png') });
  } finally {
    await browser.close();
    console.log(`\nScreenshots saved to: ${screenshotsDir}`);
  }
}

// Run the test
testLoginPersistence().catch(console.error);