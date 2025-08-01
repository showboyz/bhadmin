const { chromium } = require('playwright');

async function testRefreshFix() {
  console.log('🧪 Testing refresh fix for login redirect issue');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    if (msg.text().includes('Organization access check') || 
        msg.text().includes('Access granted') ||
        msg.text().includes('Access denied') ||
        msg.text().includes('User authenticated but no roles') ||
        msg.text().includes('Max retries reached')) {
      console.log(`[Console] ${msg.text()}`);
    }
  });

  try {
    // Step 1: Login
    console.log('📍 Step 1: Logging in');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"]', 'your-new-password');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`✅ After login, current URL: ${currentUrl}`);
    
    // Check if we're on an org dashboard
    if (currentUrl.includes('/org/') && currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully logged in and redirected to org dashboard');
      
      // Step 2: Test refresh
      console.log('📍 Step 2: Testing page refresh');
      console.log('🔄 Refreshing page...');
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Give time for role loading and retry logic
      
      const afterRefreshUrl = page.url();
      console.log(`🔍 After refresh, current URL: ${afterRefreshUrl}`);
      
      if (afterRefreshUrl === currentUrl) {
        console.log('✅ SUCCESS: Page refresh worked correctly, stayed on org dashboard');
        return true;
      } else if (afterRefreshUrl.includes('/login')) {
        console.log('❌ FAILED: Page refresh redirected to login');
        return false;
      } else if (afterRefreshUrl.includes('/super-admin')) {
        console.log('⚠️  Page refresh redirected to super-admin (might be correct for super admin user)');
        return true;
      } else {
        console.log(`❓ Unexpected redirect after refresh: ${afterRefreshUrl}`);
        return false;
      }
    } else if (currentUrl.includes('/super-admin')) {
      console.log('✅ Successfully logged in as super admin');
      
      // Test super admin refresh
      console.log('📍 Step 2: Testing super admin page refresh');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const afterRefreshUrl = page.url();
      console.log(`🔍 After refresh, current URL: ${afterRefreshUrl}`);
      
      if (afterRefreshUrl.includes('/super-admin')) {
        console.log('✅ SUCCESS: Super admin page refresh worked correctly');
        return true;
      } else {
        console.log('❌ FAILED: Super admin page refresh failed');
        return false;
      }
    } else {
      console.log(`❌ Unexpected URL after login: ${currentUrl}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testRefreshFix().then(success => {
  if (success) {
    console.log('🎉 Refresh fix test PASSED');
    process.exit(0);
  } else {
    console.log('💥 Refresh fix test FAILED');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});