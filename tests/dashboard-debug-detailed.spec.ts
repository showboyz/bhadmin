import { test, expect } from '@playwright/test';

test.describe('Dashboard Debug - Detailed Analysis', () => {
  test('should analyze what data is actually being returned', async ({ page }) => {
    console.log('🔍 Starting detailed dashboard debug analysis');

    // Step 1: Login first
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"], input[name="email"], #email', 'todays777@gmail.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'your-new-password');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 2: Navigate to dashboard
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully navigated to dashboard');

    // Step 3: Intercept and log network requests to understand what data is being fetched
    const requests = [];
    const responses = [];

    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('supabase')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
        });
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('supabase')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
        console.log(`📥 API Response: ${response.status()} ${response.url()}`);
      }
    });

    // Step 4: Refresh to trigger data fetching
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait longer for all async operations

    console.log(`\n📊 Network Activity Summary:`);
    console.log(`Total API requests: ${requests.length}`);
    console.log(`Total API responses: ${responses.length}`);

    // Step 5: Check for any JavaScript errors in console
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
        console.log(`🚨 JS Error: ${msg.text()}`);
      }
    });

    // Step 6: Analyze the dashboard content in detail
    console.log('\n🔍 Analyzing dashboard content...');

    // Get all text content to see what's actually rendered
    const bodyText = await page.locator('body').textContent();
    
    // Check for specific sections
    const hasDashboardTitle = bodyText.includes('Dashboard');
    const hasOverview = bodyText.includes('Overview');
    const hasUserMetrics = bodyText.includes('Total Users');
    
    console.log(`✅ Dashboard title present: ${hasDashboardTitle}`);
    console.log(`✅ Overview text present: ${hasOverview}`);
    console.log(`✅ User metrics present: ${hasUserMetrics}`);

    // Step 7: Check for specific data sections
    const sections = [
      'Total Users',
      'Active Today', 
      'Weekly Active',
      'New Users This Month',
      'Inactive Users This Week',
      'License Seats Remaining',
      'User Progress',
      'Inactive Users'
    ];

    for (const section of sections) {
      const sectionElement = page.locator(`text=${section}`);
      const isVisible = await sectionElement.isVisible();
      console.log(`📋 Section "${section}": ${isVisible ? 'VISIBLE' : 'NOT VISIBLE'}`);
      
      if (isVisible) {
        // Try to get the value associated with this section
        const sectionContainer = sectionElement.locator('..').locator('..');
        const sectionText = await sectionContainer.textContent();
        const numbers = sectionText.match(/\d+/g);
        console.log(`   Values: ${numbers ? numbers.join(', ') : 'none found'}`);
        console.log(`   Full text: ${sectionText.substring(0, 100)}...`);
      }
    }

    // Step 8: Look for any error messages or loading states
    const errorSelectors = [
      '.error',
      '[role="alert"]',
      '.alert-error',
      'text=/error|failed|not found/i',
      'text=/loading|spinner|fetching/i'
    ];

    for (const selector of errorSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`⚠️  Found ${elements.length} elements matching "${selector}"`);
        for (const element of elements) {
          const text = await element.textContent();
          console.log(`   Content: ${text}`);
        }
      }
    }

    // Step 9: Check if we're actually on the correct organization
    const currentUrl = page.url();
    console.log(`\n🔗 Current URL: ${currentUrl}`);
    console.log(`✅ Correct org ID in URL: ${currentUrl.includes('bf579a76-e9c5-45be-8659-7e62664883c4')}`);

    // Step 10: Take comprehensive screenshots
    await page.screenshot({
      path: 'tests/debug-dashboard-full.png',
      fullPage: true
    });

    await page.screenshot({
      path: 'tests/debug-dashboard-viewport.png',
      fullPage: false
    });

    // Step 11: Check if the user has proper permissions
    const userInfo = await page.locator('.user-info, .profile-info, text=/todays777@gmail.com/i').first();
    if (await userInfo.isVisible()) {
      const userText = await userInfo.textContent();
      console.log(`👤 User info: ${userText}`);
    }

    // Check for super admin indicator
    const superAdminIndicator = await page.locator('text=/super admin/i').first();
    if (await superAdminIndicator.isVisible()) {
      console.log('👑 User is logged in as Super Admin');
    }

    // Step 12: Check browser storage for any relevant data
    const localStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storage[key] = localStorage.getItem(key);
      }
      return storage;
    });

    console.log('\n💾 Local Storage contents:');
    Object.entries(localStorage).forEach(([key, value]) => {
      console.log(`   ${key}: ${typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value}`);
    });

    // Final summary
    console.log('\n=== DETAILED DASHBOARD DEBUG SUMMARY ===');
    console.log(`🔗 URL: ${currentUrl}`);
    console.log(`👤 User: todays777@gmail.com (Super Admin)`);
    console.log(`📱 Sections visible: ${sections.filter(async s => await page.locator(`text=${s}`).isVisible()).length}/${sections.length}`);
    console.log(`🌐 API requests made: ${requests.length}`);
    console.log(`❌ JavaScript errors: ${jsErrors.length}`);
    console.log(`📸 Screenshots: debug-dashboard-full.png, debug-dashboard-viewport.png`);

    // Check what the actual numbers are showing
    const totalUsers = await page.locator('text=Total Users').locator('..').locator('..').locator('text=/^\\d+$/').first().textContent().catch(() => 'N/A');
    const activeToday = await page.locator('text=Active Today').locator('..').locator('..').locator('text=/^\\d+$/').first().textContent().catch(() => 'N/A');
    const weeklyActive = await page.locator('text=Weekly Active').locator('..').locator('..').locator('text=/^\\d+$/').first().textContent().catch(() => 'N/A');

    console.log(`📊 Current KPI Values:`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Active Today: ${activeToday}`);
    console.log(`   Weekly Active: ${weeklyActive}`);

    console.log('🏁 Detailed debug analysis completed');
  });
});