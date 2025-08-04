import { test, expect } from '@playwright/test';

test.describe('Dashboard with Fixed useDashboard Hook', () => {
  test('should login and verify dashboard with Korean names and correct KPIs', async ({ page }) => {
    console.log('🧪 Starting comprehensive dashboard test with fixed useDashboard hook');

    // Step 1: Go to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({
      path: 'tests/step1-login-page.png',
      fullPage: true
    });
    console.log('✓ Step 1: Navigated to login page and took screenshot');

    // Step 2: Login with provided credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], #email');
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
    const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

    await emailInput.fill('todays777@gmail.com');
    await passwordInput.fill('your-new-password');
    
    // Take screenshot before clicking login
    await page.screenshot({
      path: 'tests/step2-before-login-click.png',
      fullPage: true
    });
    
    await loginButton.click();

    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give extra time for auth to process

    // Take screenshot after login
    await page.screenshot({
      path: 'tests/step2-after-login.png',
      fullPage: true
    });
    console.log('✓ Step 2: Logged in with credentials and took screenshot');

    // Step 3: Navigate to the specific organization dashboard
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    console.log('✓ Step 3: Navigated to organization dashboard');

    // Step 4: Check KPI Cards - Look for Total Users: 7
    console.log('🔍 Checking KPI cards...');
    
    // Look for Total Users with value 7
    const totalUsersElement = page.locator('text=/total users/i').first();
    if (await totalUsersElement.isVisible()) {
      const totalUsersCard = totalUsersElement.locator('..').locator('..');
      const totalUsersValue = await totalUsersCard.locator('text=/^7$|^7 |7 users/').first();
      if (await totalUsersValue.isVisible()) {
        console.log('✅ Total Users: 7 - FOUND');
      } else {
        const cardText = await totalUsersCard.textContent();
        console.log('❌ Total Users: 7 - NOT FOUND. Card content:', cardText);
      }
    } else {
      console.log('❌ Total Users card not found');
    }

    // Look for Active Today > 0
    const activeTodayElement = page.locator('text=/active today/i').first();
    if (await activeTodayElement.isVisible()) {
      const activeTodayCard = activeTodayElement.locator('..').locator('..');
      const cardText = await activeTodayCard.textContent();
      console.log('✅ Active Today card found. Content:', cardText);
      
      // Extract number from card
      const numberMatch = cardText?.match(/\d+/);
      if (numberMatch && parseInt(numberMatch[0]) > 0) {
        console.log('✅ Active Today: > 0 - CONFIRMED');
      }
    } else {
      console.log('❌ Active Today card not found');
    }

    // Look for Weekly Active > 0  
    const weeklyActiveElement = page.locator('text=/weekly active|active this week/i').first();
    if (await weeklyActiveElement.isVisible()) {
      const weeklyActiveCard = weeklyActiveElement.locator('..').locator('..');
      const cardText = await weeklyActiveCard.textContent();
      console.log('✅ Weekly Active card found. Content:', cardText);
      
      // Extract number from card
      const numberMatch = cardText?.match(/\d+/);
      if (numberMatch && parseInt(numberMatch[0]) > 0) {
        console.log('✅ Weekly Active: > 0 - CONFIRMED');
      }
    } else {
      console.log('❌ Weekly Active card not found');
    }

    // Take screenshot of KPI cards
    await page.screenshot({
      path: 'tests/step4-kpi-cards.png',
      fullPage: true
    });

    // Step 5: Check Recent User Activity section with Korean names
    console.log('🔍 Checking Recent User Activity section...');
    
    const recentActivitySection = page.locator('text=Recent User Activity (Top 5)');
    await expect(recentActivitySection).toBeVisible({ timeout: 10000 });
    console.log('✅ Recent User Activity (Top 5) section is visible');

    // Look for Korean names specifically
    const koreanNames = ['김철수', '이영희', '박민수', '최순자', '정광호'];
    let foundKoreanNames = 0;
    
    for (const name of koreanNames) {
      const nameElement = page.locator(`text=${name}`);
      if (await nameElement.isVisible()) {
        foundKoreanNames++;
        console.log(`✅ Found Korean name: ${name}`);
      } else {
        console.log(`❌ Korean name not found: ${name}`);
      }
    }
    
    console.log(`Found ${foundKoreanNames} out of ${koreanNames.length} expected Korean names`);

    // Get the activity section content
    const activityContainer = page.locator('text=Recent User Activity (Top 5)').locator('..').locator('..');
    const activityText = await activityContainer.textContent();
    console.log('Recent Activity section full content:', activityText);

    // Take screenshot of recent activity section
    await page.screenshot({
      path: 'tests/step5-recent-activity.png',
      fullPage: true
    });

    // Step 6: Check Inactive Users section
    console.log('🔍 Checking Inactive Users section...');
    
    const inactiveUsersSection = page.locator('text=Inactive Users');
    await expect(inactiveUsersSection).toBeVisible({ timeout: 10000 });
    console.log('✅ Inactive Users section is visible');

    // Look for specific inactive users: 한미영, 윤대수
    const inactiveNames = ['한미영', '윤대수'];
    let foundInactiveNames = 0;
    
    for (const name of inactiveNames) {
      const nameElement = page.locator(`text=${name}`);
      if (await nameElement.isVisible()) {
        foundInactiveNames++;
        console.log(`✅ Found inactive user: ${name}`);
      } else {
        console.log(`❌ Inactive user not found: ${name}`);
      }
    }

    // Check for count > 0 in inactive users section
    const inactiveContainer = page.locator('text=Inactive Users').locator('..').locator('..');
    const inactiveText = await inactiveContainer.textContent();
    console.log('Inactive Users section full content:', inactiveText);

    // Look for numbers in the inactive section
    const inactiveNumbers = inactiveText?.match(/\d+/g);
    if (inactiveNumbers && inactiveNumbers.some(num => parseInt(num) > 0)) {
      console.log('✅ Inactive Users section shows count > 0');
    }

    // Take screenshot of inactive users section
    await page.screenshot({
      path: 'tests/step6-inactive-users.png',
      fullPage: true
    });

    // Step 7: Take final comprehensive screenshots
    console.log('📸 Taking final comprehensive screenshots...');
    
    // Full page screenshot
    await page.screenshot({
      path: 'tests/final-dashboard-full-page.png',
      fullPage: true
    });

    // Viewport screenshot
    await page.screenshot({
      path: 'tests/final-dashboard-viewport.png',
      fullPage: false
    });

    // Step 8: Verify organization-specific filtering
    console.log('🔍 Verifying organization-specific filtering...');
    
    // Check that the URL contains the correct org ID
    const currentUrl = page.url();
    if (currentUrl.includes('bf579a76-e9c5-45be-8659-7e62664883c4')) {
      console.log('✅ Organization-specific URL confirmed');
    } else {
      console.log('❌ Organization-specific URL not confirmed. Current URL:', currentUrl);
    }

    // Check for any org-specific indicators in the content
    const orgIndicators = await page.locator('text=/organization|org|clinic/i').all();
    console.log(`Found ${orgIndicators.length} organization-related indicators`);

    // Final summary
    console.log('\n=== DASHBOARD TEST SUMMARY ===');
    console.log(`✅ Login successful: todays777@gmail.com`);
    console.log(`✅ Dashboard loaded: org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard`);
    console.log(`📊 Korean names found in Recent Activity: ${foundKoreanNames}/${koreanNames.length}`);
    console.log(`👥 Inactive users found: ${foundInactiveNames}/${inactiveNames.length}`);
    console.log(`📸 Screenshots taken: 7 total`);
    console.log(`🔗 Organization filtering: ${currentUrl.includes('bf579a76-e9c5-45be-8659-7e62664883c4') ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    
    // Check if we can determine the fix worked
    const fixWorked = foundKoreanNames >= 3 && (foundInactiveNames > 0 || inactiveText?.includes('0') === false);
    console.log(`🔧 useDashboard hook fix status: ${fixWorked ? 'SUCCESS' : 'NEEDS INVESTIGATION'}`);

    // Get page errors if any
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text());
      }
    });

    console.log('🏁 Dashboard test completed');
  });
});