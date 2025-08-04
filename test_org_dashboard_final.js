const { chromium } = require('playwright');

async function testOrgDashboard() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Final org dashboard test with multiple navigation attempts...');

    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    console.log('2. Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"]', 'your-new-password');
    await page.click('button[type="submit"]');
    
    // Wait for initial redirect
    await page.waitForTimeout(3000);
    console.log('After login URL:', page.url());

    console.log('3. Multiple attempts to reach org dashboard...');
    
    // Attempt 1: Direct navigation
    console.log('Attempt 1: Direct navigation to org dashboard...');
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    await page.waitForTimeout(5000);
    console.log('After direct navigation URL:', page.url());
    
    // Take screenshot of attempt 1
    await page.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/attempt1_direct.png', fullPage: true });
    
    // Check if we see organization-specific content
    const orgNameElement = await page.locator('text=/Welcome to.*andrew.*clinic/i').first();
    if (await orgNameElement.isVisible()) {
      console.log('✅ SUCCESS: Found organization-specific welcome message!');
      
      // Check for Korean names in Recent User Activity
      console.log('Checking for Korean names...');
      const koreanNames = ['김철수', '이영희', '박민수', '최순자', '정광호'];
      let foundNames = [];
      
      for (const name of koreanNames) {
        const element = await page.locator(`text=${name}`).first();
        if (await element.isVisible()) {
          foundNames.push(name);
          console.log(`✅ Found Korean name: ${name}`);
        }
      }
      
      // Check for inactive users  
      const inactiveNames = ['한미영', '윤대수'];
      let foundInactive = [];
      
      for (const name of inactiveNames) {
        const element = await page.locator(`text=${name}`).first();
        if (await element.isVisible()) {
          foundInactive.push(name);
          console.log(`✅ Found inactive user: ${name}`);
        }
      }
      
      // Check metrics
      const totalUsersElement = await page.locator('text=/7/').first();
      const hasCorrectTotal = await totalUsersElement.isVisible();
      
      console.log(`📊 Results Summary:`);
      console.log(`   - Organization dashboard: ✅ Accessed`);
      console.log(`   - Korean names found: ${foundNames.length}/5 (${foundNames.join(', ')})`);
      console.log(`   - Inactive users found: ${foundInactive.length}/2 (${foundInactive.join(', ')})`);
      console.log(`   - Total users shows 7: ${hasCorrectTotal ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ Still not on organization dashboard');
      
      // Attempt 2: Navigate through user interface
      console.log('Attempt 2: Looking for navigation options...');
      
      // Look for organization links or navigation
      const orgLinks = await page.locator('a[href*="/org/"]').all();
      if (orgLinks.length > 0) {
        console.log(`Found ${orgLinks.length} org links, clicking first one...`);
        await orgLinks[0].click();
        await page.waitForTimeout(3000);
        console.log('After clicking org link URL:', page.url());
        await page.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/attempt2_nav.png', fullPage: true });
      }
      
      // Attempt 3: Check if there's a user context issue
      console.log('Attempt 3: Checking user context and permissions...');
      
      // Try to access the API directly from browser
      const apiTestResult = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/organizations/bf579a76-e9c5-45be-8659-7e62664883c4/users');
          if (response.ok) {
            const data = await response.json();
            return { success: true, data };
          } else {
            return { success: false, status: response.status, statusText: response.statusText };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log('API test result:', apiTestResult);
    }
    
    // Final screenshot
    await page.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/final_dashboard_state.png', fullPage: true });
    
    // Get final page analysis
    const bodyText = await page.locator('body').textContent();
    const koreanRegex = /[가-힣]+/g;
    const koreanWords = bodyText.match(koreanRegex);
    const hasKoreanContent = koreanWords && koreanWords.length > 0;
    
    console.log('\n🎯 FINAL ANALYSIS:');
    console.log(`Current URL: ${page.url()}`);
    console.log(`Korean content detected: ${hasKoreanContent ? '✅' : '❌'}`);
    if (hasKoreanContent) {
      console.log(`Korean words: ${[...new Set(koreanWords)].join(', ')}`);
    }
    
    // Check for specific UI elements
    const recentActivityFound = await page.locator('text=/Recent User Activity/').isVisible();
    const inactiveUsersFound = await page.locator('text=/Inactive Users/').isVisible();
    const totalUsersFound = await page.locator('text=/Total Users/').isVisible();
    
    console.log(`UI Elements Found:`);
    console.log(`   - Recent User Activity section: ${recentActivityFound ? '✅' : '❌'}`);
    console.log(`   - Inactive Users section: ${inactiveUsersFound ? '✅' : '❌'}`);
    console.log(`   - Total Users section: ${totalUsersFound ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('💥 Error during testing:', error);
    await page.screenshot({ path: '/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/error_final_test.png' });
  } finally {
    await browser.close();
  }
}

testOrgDashboard();