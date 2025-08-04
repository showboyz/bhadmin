const { chromium } = require('playwright');

async function testDashboard() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    console.log('2. Logging in with provided credentials...');
    
    // Wait for the login form to be fully loaded
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    // Clear fields first and then fill
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="email"]', 'todays777@gmail.com');
    
    await page.fill('input[type="password"]', '');
    await page.fill('input[type="password"]', 'your-new-password');
    
    console.log('Email filled:', await page.getAttribute('input[type="email"]', 'value'));
    
    // Take screenshot before clicking submit
    await page.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/before_login.png' });
    
    await page.click('button[type="submit"]');
    console.log('Login button clicked, waiting for response...');
    
    // Wait for either success or error
    try {
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      console.log('✓ Login successful - redirected to dashboard');
    } catch (e) {
      console.log('Login might have failed or redirect issue, checking current URL...');
      console.log('Current URL:', page.url());
      
      // Check for error messages
      const errorElement = await page.locator('text=/error|invalid|incorrect/i').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('Error message found:', errorText);
      }
      
      // Take screenshot of login result
      await page.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/after_login_attempt.png' });
    }
    
    await page.waitForLoadState('networkidle');

    console.log('3. Navigating to org dashboard...');
    console.log('Current URL before navigation:', page.url());
    
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL after navigation:', page.url());
    
    // Wait a bit more for any API calls to complete
    await page.waitForTimeout(5000);
    
    // Check if we're actually on the org dashboard
    const orgDashboardTitle = await page.locator('h1, h2').first();
    if (await orgDashboardTitle.isVisible()) {
      const titleText = await orgDashboardTitle.textContent();
      console.log('Dashboard title:', titleText);
    }
    
    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(3000);

    console.log('4. Taking screenshot of full dashboard...');
    await page.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/dashboard_full.png', fullPage: true });

    console.log('5. Checking Recent User Activity section...');
    const recentActivitySection = await page.locator('text=Recent User Activity').first();
    if (await recentActivitySection.isVisible()) {
      console.log('✓ Recent User Activity section found');
      
      // Look for Korean names
      const koreanNames = ['김철수', '이영희', '박민수', '최순자', '정광호'];
      let foundKoreanNames = [];
      
      for (const name of koreanNames) {
        const element = await page.locator(`text=${name}`).first();
        if (await element.isVisible()) {
          foundKoreanNames.push(name);
          console.log(`✓ Found Korean name: ${name}`);
        }
      }
      
      console.log(`Found ${foundKoreanNames.length}/5 expected Korean names in Recent Activity`);
    } else {
      console.log('✗ Recent User Activity section not found');
    }

    console.log('6. Checking Inactive Users section...');
    const inactiveUsersSection = await page.locator('text=Inactive Users').first();
    if (await inactiveUsersSection.isVisible()) {
      console.log('✓ Inactive Users section found');
      
      // Look for specific inactive users
      const inactiveNames = ['한미영', '윤대수'];
      let foundInactiveNames = [];
      
      for (const name of inactiveNames) {
        const element = await page.locator(`text=${name}`).first();
        if (await element.isVisible()) {
          foundInactiveNames.push(name);
          console.log(`✓ Found inactive user: ${name}`);
        }
      }
      
      console.log(`Found ${foundInactiveNames.length}/2 expected inactive users`);
    } else {
      console.log('✗ Inactive Users section not found');
    }

    console.log('7. Checking user counts and metrics...');
    
    // Look for Total Users count
    const totalUsersElement = await page.locator('text=/Total Users?/').first();
    if (await totalUsersElement.isVisible()) {
      const totalUsersText = await totalUsersElement.textContent();
      console.log(`Total Users section: ${totalUsersText}`);
      
      // Try to find the number 7
      const sevenElement = await page.locator('text=7').first();
      if (await sevenElement.isVisible()) {
        console.log('✓ Found number 7 (expected total users)');
      }
    }

    // Look for Active Today
    const activeTodayElement = await page.locator('text=/Active Today/').first();
    if (await activeTodayElement.isVisible()) {
      const activeTodayText = await activeTodayElement.textContent();
      console.log(`Active Today: ${activeTodayText}`);
    }

    // Look for Weekly Active
    const weeklyActiveElement = await page.locator('text=/Weekly Active/').first();
    if (await weeklyActiveElement.isVisible()) {
      const weeklyActiveText = await weeklyActiveElement.textContent();
      console.log(`Weekly Active: ${weeklyActiveText}`);
    }

    console.log('8. Taking specific screenshots of data sections...');
    
    // Try to screenshot specific sections
    try {
      const recentActivityCard = await page.locator('text=Recent User Activity').locator('..').first();
      if (await recentActivityCard.isVisible()) {
        await recentActivityCard.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/recent_activity.png' });
        console.log('✓ Recent Activity section screenshot saved');
      }
    } catch (e) {
      console.log('Could not capture Recent Activity section separately');
    }

    try {
      const inactiveUsersCard = await page.locator('text=Inactive Users').locator('..').first();
      if (await inactiveUsersCard.isVisible()) {
        await inactiveUsersCard.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/inactive_users.png' });
        console.log('✓ Inactive Users section screenshot saved');
      }
    } catch (e) {
      console.log('Could not capture Inactive Users section separately');
    }

    console.log('9. Manual API check for dummy data...');
    // Let's directly check if the dummy data exists by making API calls
    const apiCheck = await page.evaluate(async () => {
      try {
        // Check seniors for the specific org
        const response = await fetch('/api/organizations/bf579a76-e9c5-45be-8659-7e62664883c4/users');
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          return { success: false, error: `API call failed with status ${response.status}` };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('API check result:', apiCheck);

    // Also check if we can access Supabase directly from the browser
    console.log('Checking if Supabase data exists directly...');
    const supabaseCheck = await page.evaluate(async () => {
      try {
        // Try to access window.supabase if it exists or create a connection
        const supabaseUrl = 'http://127.0.0.1:54321';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
        
        // Simple fetch to check if seniors exist
        const response = await fetch(`${supabaseUrl}/rest/v1/seniors?org_id=eq.bf579a76-e9c5-45be-8659-7e62664883c4&select=id,name`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, seniors: data };
        } else {
          return { success: false, error: `Supabase call failed with status ${response.status}` };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('Supabase check result:', supabaseCheck);

    console.log('10. Getting all visible text for analysis...');
    const bodyText = await page.locator('body').textContent();
    console.log('\n=== PAGE CONTENT ANALYSIS ===');
    
    // Check for Korean characters
    const koreanRegex = /[가-힣]/g;
    const koreanMatches = bodyText.match(koreanRegex);
    if (koreanMatches) {
      console.log(`✓ Korean characters detected: ${koreanMatches.length} characters`);
      
      // Extract Korean words/names
      const koreanWords = bodyText.match(/[가-힣]+/g);
      if (koreanWords) {
        console.log(`Korean words found: ${[...new Set(koreanWords)].join(', ')}`);
      }
    } else {
      console.log('✗ No Korean characters found');
    }

    // Check for numbers that might indicate user counts
    const numbers = bodyText.match(/\b\d+\b/g);
    if (numbers) {
      console.log(`Numbers found on page: ${numbers.join(', ')}`);
    }

    console.log('\n=== SUMMARY ===');
    console.log('Dashboard testing completed. Check the screenshots for visual verification.');
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/error_screenshot.png' });
  } finally {
    await browser.close();
  }
}

testDashboard();