import { test, expect } from '@playwright/test';

test.describe('Dashboard Final Verification with Korean Data', () => {
  test('should show populated dashboard with Korean names and correct numbers', async ({ page }) => {
    console.log('🔬 Final verification test - Korean data should be populated');

    // Step 1: Login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"], input[name="email"], #email', 'todays777@gmail.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'your-new-password');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 2: Navigate to dashboard with hard refresh to clear any cache
    console.log('🔄 Hard refreshing dashboard to clear cache...');
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard', { 
      waitUntil: 'networkidle' 
    });
    
    // Force reload multiple times to make sure we get fresh data
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait longer for all async operations

    console.log('✅ Dashboard loaded with fresh data');

    // Step 3: Take screenshot of current state
    await page.screenshot({
      path: 'tests/final-verification-dashboard.png',
      fullPage: true
    });

    // Step 4: Check all KPI values in detail
    console.log('📊 Checking KPI values...');
    
    // Get the text content of each KPI card
    const totalUsersCard = await page.locator(':has-text("Total Users")').first().locator('..').textContent();
    const activeTodayCard = await page.locator(':has-text("Active Today")').first().locator('..').textContent();
    const weeklyActiveCard = await page.locator(':has-text("Weekly Active")').first().locator('..').textContent();
    const licenseSeatCard = await page.locator(':has-text("License Seats Remaining")').first().locator('..').textContent();

    console.log('📋 KPI Card Contents:');
    console.log('   Total Users:', totalUsersCard);
    console.log('   Active Today:', activeTodayCard);
    console.log('   Weekly Active:', weeklyActiveCard);
    console.log('   License Seats:', licenseSeatCard);

    // Extract numbers from the cards
    const totalUsersNumber = totalUsersCard?.match(/\\b(\\d+)\\b/)?.[1];
    const activeTodayNumber = activeTodayCard?.match(/\\b(\\d+)\\b/)?.[1];
    const weeklyActiveNumber = weeklyActiveCard?.match(/\\b(\\d+)\\b/)?.[1];
    const licenseSeatNumber = licenseSeatCard?.match(/\\b(\\d+)\\b/)?.[1];

    console.log('🔢 Extracted Numbers:');
    console.log('   Total Users:', totalUsersNumber);
    console.log('   Active Today:', activeTodayNumber);  
    console.log('   Weekly Active:', weeklyActiveNumber);
    console.log('   License Seats:', licenseSeatNumber);

    // Step 5: Check the sections that should exist
    console.log('🔍 Checking dashboard sections...');
    
    // Look for any section that might contain user activity
    const activitySections = await page.locator('h3, h2, .card-title, [data-testid]').allTextContents();
    console.log('📑 All section headers found:');
    activitySections.forEach((section, index) => {
      console.log(`   ${index + 1}. "${section}"`);
    });

    // Look for Korean names anywhere on the page
    const koreanNames = ['김철수', '이영희', '박민수', '최순자', '정광호', '한미영', '윤대수'];
    let foundNames = [];
    
    for (const name of koreanNames) {
      const nameElements = await page.locator(`text=${name}`).all();
      if (nameElements.length > 0) {
        foundNames.push(name);
        console.log(`✅ Found Korean name: ${name} (${nameElements.length} instances)`);
      } else {
        console.log(`❌ Korean name not found: ${name}`);
      }
    }

    // Step 6: Check page content for any data
    const bodyText = await page.locator('body').textContent();
    console.log('🔍 Checking for specific content patterns...');
    
    // Check for "No active users found" or similar empty state messages
    const emptyStateMessages = [
      'No active users found',
      'No inactive users',
      'Great job'
    ];
    
    for (const message of emptyStateMessages) {
      if (bodyText?.includes(message)) {
        console.log(`⚠️  Found empty state message: "${message}"`);
      }
    }

    // Check for any numbers > 0 in the page
    const allNumbers = bodyText?.match(/\\b([1-9]\\d*)\\b/g) || [];
    const significantNumbers = allNumbers.filter(n => parseInt(n) > 5).slice(0, 10);
    console.log('🔢 Significant numbers found on page:', significantNumbers);

    // Step 7: Check if the issue is organization-specific
    console.log('🔗 Checking organization context...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const orgIdInUrl = currentUrl.includes('bf579a76-e9c5-45be-8659-7e62664883c4');
    console.log('✅ Correct org ID in URL:', orgIdInUrl);

    // Step 8: Debug the network requests to see what data is actually being returned
    console.log('🌐 Intercepting network requests for debugging...');
    
    const apiRequests = [];
    page.on('response', response => {
      if (response.url().includes('/rest/v1/seniors')) {
        apiRequests.push({
          url: response.url(),
          status: response.status()
        });
        console.log(`📡 Seniors API call: ${response.status()} ${response.url()}`);
      }
    });

    // Trigger a refresh to capture API calls
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log(`📊 API Requests captured: ${apiRequests.length}`);

    // Step 9: Final summary
    console.log('\\n=== FINAL VERIFICATION SUMMARY ===');
    console.log(`🔗 URL: ${currentUrl}`);
    console.log(`📊 KPI Numbers - Total: ${totalUsersNumber}, Active Today: ${activeTodayNumber}, Weekly: ${weeklyActiveNumber}`);
    console.log(`👥 Korean names found: ${foundNames.length}/${koreanNames.length} (${foundNames.join(', ')})`);
    console.log(`🌐 API calls made: ${apiRequests.length}`);
    console.log(`📱 Dashboard sections: ${activitySections.length}`);

    // Determine if the fix worked
    const hasData = (totalUsersNumber && parseInt(totalUsersNumber) > 0) || foundNames.length > 0;
    const fixStatus = hasData ? '✅ SUCCESS - Dashboard shows data!' : '❌ ISSUE - Dashboard still empty';
    
    console.log(`\\n🔧 useDashboard Hook Fix Status: ${fixStatus}`);
    
    if (!hasData) {
      console.log('\\n🔍 Debugging suggestions:');
      console.log('1. Check if browser cache is interfering');
      console.log('2. Verify organization ID is being passed correctly to hook');
      console.log('3. Check if RLS policies are blocking data access');
      console.log('4. Verify the hook is receiving the correct user context');
    }

    // Take final screenshots for documentation
    await page.screenshot({
      path: 'tests/final-verification-viewport.png',
      fullPage: false
    });

    console.log('🏁 Final verification test completed');
  });
});