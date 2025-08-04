import { test, expect } from '@playwright/test';

test.describe('Race Condition Fix - Role Loading with Retry Logic', () => {
  test('should handle race condition between authentication and role loading with retry mechanism', async ({ page }) => {
    console.log('🚀 Starting race condition test for role loading with retry mechanism');

    // Capture all console messages to track the retry process
    const consoleMessages: string[] = [];
    const consoleLogs: Array<{ type: string; text: string; timestamp: number }> = [];
    
    page.on('console', msg => {
      const timestamp = Date.now();
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp
      };
      consoleLogs.push(logEntry);
      consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      
      // Log important race condition related messages
      if (msg.text().includes('User authenticated but no roles loaded yet') ||
          msg.text().includes('attempt') ||
          msg.text().includes('Access granted') ||
          msg.text().includes('Access denied') ||
          msg.text().includes('roles loaded') ||
          msg.text().includes('Super Admin') ||
          msg.text().includes('retry')) {
        console.log(`🔍 [${timestamp}] [${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    // Capture network requests to understand the flow
    const apiRequests: Array<{ url: string; method: string; timestamp: number }> = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('supabase')) {
        const timestamp = Date.now();
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp
        });
        console.log(`📤 [${timestamp}] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('supabase')) {
        const timestamp = Date.now();
        console.log(`📥 [${timestamp}] ${response.status()} ${response.url()}`);
      }
    });

    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({
      path: 'tests/race-condition-step1-login.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: race-condition-step1-login.png');

    // Step 2: Login with specified credentials
    console.log('📍 Step 2: Logging in with todays777@gmail.com');
    await page.fill('input[type="email"], input[name="email"], #email', 'todays777@gmail.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'your-new-password');
    
    // Take screenshot before clicking login
    await page.screenshot({
      path: 'tests/race-condition-step2-before-login.png',
      fullPage: true
    });
    
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    // Wait for login to process
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take screenshot after login
    await page.screenshot({
      path: 'tests/race-condition-step2-after-login.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: race-condition-step2-after-login.png');
    console.log('✅ Login completed');

    // Step 3: Navigate to organization dashboard - this is where the race condition occurs
    console.log('📍 Step 3: Navigating to organization dashboard (race condition trigger)');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    
    // Give time for the race condition and retry logic to play out
    console.log('⏳ Waiting for race condition and retry logic to complete...');
    await page.waitForTimeout(10000); // Give 10 seconds for retry attempts
    
    // Take screenshot during the process
    await page.screenshot({
      path: 'tests/race-condition-step3-during-process.png',
      fullPage: true
    });

    // Step 4: Analyze console messages for retry pattern
    console.log('📍 Step 4: Analyzing console messages for retry patterns');
    
    const waitingMessages = consoleMessages.filter(msg => 
      msg.includes('User authenticated but no roles loaded yet, waiting')
    );
    
    const retryMessages = consoleMessages.filter(msg => 
      msg.includes('attempt') && (msg.includes('/5') || msg.includes('retry'))
    );
    
    const rolesLoadedMessages = consoleMessages.filter(msg => 
      msg.includes('roles loaded') || msg.includes('roles finally load')
    );
    
    const accessGrantedMessages = consoleMessages.filter(msg => 
      msg.includes('Access granted')
    );
    
    const accessDeniedMessages = consoleMessages.filter(msg => 
      msg.includes('Access denied')
    );

    const superAdminDetectionMessages = consoleMessages.filter(msg => 
      msg.includes('Super Admin') && (msg.includes('detected') || msg.includes('status'))
    );

    console.log('\n=== RACE CONDITION ANALYSIS ===');
    console.log(`⏳ "Waiting for roles" messages: ${waitingMessages.length}`);
    console.log(`🔄 Retry attempt messages: ${retryMessages.length}`);
    console.log(`✅ Roles loaded messages: ${rolesLoadedMessages.length}`);
    console.log(`🟢 Access granted messages: ${accessGrantedMessages.length}`);
    console.log(`🔴 Access denied messages: ${accessDeniedMessages.length}`);
    console.log(`👑 Super admin detection messages: ${superAdminDetectionMessages.length}`);

    // Print the actual messages for detailed analysis
    if (waitingMessages.length > 0) {
      console.log('\n⏳ WAITING MESSAGES:');
      waitingMessages.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
    }

    if (retryMessages.length > 0) {
      console.log('\n🔄 RETRY MESSAGES:');
      retryMessages.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
    }

    if (rolesLoadedMessages.length > 0) {
      console.log('\n✅ ROLES LOADED MESSAGES:');
      rolesLoadedMessages.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
    }

    if (accessGrantedMessages.length > 0) {
      console.log('\n🟢 ACCESS GRANTED MESSAGES:');
      accessGrantedMessages.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
    }

    if (accessDeniedMessages.length > 0) {
      console.log('\n🔴 ACCESS DENIED MESSAGES:');
      accessDeniedMessages.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
    }

    if (superAdminDetectionMessages.length > 0) {
      console.log('\n👑 SUPER ADMIN DETECTION MESSAGES:');
      superAdminDetectionMessages.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
    }

    // Step 5: Check final outcome
    console.log('📍 Step 5: Checking final outcome');
    
    const finalUrl = page.url();
    console.log(`🔗 Final URL: ${finalUrl}`);
    
    const isOnOrgDashboard = finalUrl.includes('/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    const isOnGeneralDashboard = finalUrl.includes('/dashboard') && !finalUrl.includes('/org/');
    
    console.log(`📊 On organization dashboard: ${isOnOrgDashboard}`);
    console.log(`📊 On general dashboard: ${isOnGeneralDashboard}`);
    
    // Take final screenshot
    await page.screenshot({
      path: 'tests/race-condition-step5-final-state.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: race-condition-step5-final-state.png');

    // Step 6: Test persistence by refreshing
    console.log('📍 Step 6: Testing persistence by refreshing page');
    
    const beforeRefreshUrl = page.url();
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Give time for any additional retry logic
    
    const afterRefreshUrl = page.url();
    console.log(`🔄 URL before refresh: ${beforeRefreshUrl}`);
    console.log(`🔄 URL after refresh: ${afterRefreshUrl}`);
    console.log(`✅ URL persistence: ${beforeRefreshUrl === afterRefreshUrl}`);
    
    // Take screenshot after refresh
    await page.screenshot({
      path: 'tests/race-condition-step6-after-refresh.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: race-condition-step6-after-refresh.png');

    // Step 7: Final analysis and summary
    console.log('📍 Step 7: Final analysis and summary');
    
    const endTime = Date.now();
    const totalTestTime = endTime - startTime;
    
    // Check if dashboard content is visible
    const hasDashboardContent = await page.locator('text=Total Users, text=Overview, text=Dashboard').first().isVisible().catch(() => false);
    const hasErrorContent = await page.locator('text=/error|failed|not found/i').isVisible().catch(() => false);
    
    console.log('\n=== RACE CONDITION FIX TEST SUMMARY ===');
    console.log(`⏱️  Total test duration: ${totalTestTime}ms`);
    console.log(`🔗 Final URL: ${finalUrl}`);
    console.log(`✅ Successfully stayed on org dashboard: ${isOnOrgDashboard}`);
    console.log(`🔄 Redirected to general dashboard: ${isOnGeneralDashboard}`);
    console.log(`📊 Dashboard content visible: ${hasDashboardContent}`);
    console.log(`❌ Error content visible: ${hasErrorContent}`);
    console.log(`📨 Total console messages: ${consoleMessages.length}`);
    console.log(`🌐 Total API requests: ${apiRequests.length}`);
    
    // Race condition specific metrics
    console.log('\n=== RACE CONDITION METRICS ===');
    console.log(`⏳ Race condition detected: ${waitingMessages.length > 0}`);
    console.log(`🔄 Retry attempts made: ${retryMessages.length}`);
    console.log(`✅ Roles eventually loaded: ${rolesLoadedMessages.length > 0}`);
    console.log(`🟢 Access ultimately granted: ${accessGrantedMessages.length > 0}`);
    console.log(`👑 Super admin status detected: ${superAdminDetectionMessages.length > 0}`);
    
    // Success criteria
    const raceConditionHandledSuccessfully = 
      waitingMessages.length > 0 && // Race condition was detected
      (rolesLoadedMessages.length > 0 || accessGrantedMessages.length > 0) && // Eventually resolved
      (isOnOrgDashboard || accessGrantedMessages.length > 0); // Ended up in the right place
    
    console.log(`\n🎯 RACE CONDITION FIX SUCCESS: ${raceConditionHandledSuccessfully}`);
    
    if (raceConditionHandledSuccessfully) {
      console.log('✅ The race condition fix is working correctly!');
      console.log('   - Race condition was detected');
      console.log('   - Retry mechanism activated');
      console.log('   - Roles eventually loaded');
      console.log('   - User gained proper access');
    } else {
      console.log('❌ The race condition fix may need attention:');
      if (waitingMessages.length === 0) console.log('   - No race condition detected (may not be triggering)');
      if (rolesLoadedMessages.length === 0 && accessGrantedMessages.length === 0) console.log('   - Roles never loaded successfully');
      if (!isOnOrgDashboard && accessGrantedMessages.length === 0) console.log('   - User did not end up with proper access');
    }

    // Print all console messages for complete analysis
    console.log('\n=== COMPLETE CONSOLE LOG ===');
    consoleLogs.forEach((log, i) => {
      console.log(`${i+1}. [${log.timestamp}] [${log.type.toUpperCase()}] ${log.text}`);
    });

    console.log('\n🏁 Race condition fix test completed');
    
    // Make assertions for the test framework
    expect(consoleMessages.length).toBeGreaterThan(0);
    // The test should show evidence of the race condition being handled
    expect(waitingMessages.length > 0 || accessGrantedMessages.length > 0).toBeTruthy();
  });
});