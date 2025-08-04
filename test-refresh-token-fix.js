const { chromium } = require('playwright');

async function testRefreshTokenFix() {
  console.log('🧪 Testing refresh token error fix');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages for auth errors
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('AuthApiError') || 
        text.includes('Invalid Refresh Token') || 
        text.includes('Refresh Token Not Found') ||
        text.includes('Token refresh failed') ||
        text.includes('Global auth error detected')) {
      console.log(`[Console] ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`[Page Error] ${error.message}`);
  });

  try {
    // Step 1: Clear any existing auth state
    console.log('📍 Step 1: Clearing existing auth state');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Clear localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('✅ Auth state cleared');
    
    // Step 2: Login
    console.log('📍 Step 2: Logging in');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"]', 'your-new-password');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`✅ After login, current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/super-admin') || currentUrl.includes('/org/')) {
      console.log('✅ Successfully logged in');
      
      // Step 3: Wait and test normal operation
      console.log('📍 Step 3: Testing normal operation for 30 seconds');
      
      let errorCount = 0;
      const startTime = Date.now();
      
      // Monitor for auth errors for 30 seconds
      const monitorErrors = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= 30000) {
          clearInterval(monitorErrors);
          console.log(`✅ Monitoring completed. Errors detected: ${errorCount}`);
          return;
        }
        
        // Check current URL to see if we got redirected to login unexpectedly
        (async () => {
          try {
            const url = page.url();
            if (url.includes('/login') && !currentUrl.includes('/login')) {
              console.log('❌ Unexpected redirect to login detected');
              errorCount++;
            }
          } catch (e) {
            // Ignore errors during monitoring
          }
        })();
      }, 1000);
      
      // Wait for monitoring to complete
      await new Promise(resolve => setTimeout(resolve, 31000));
      
      // Final check
      const finalUrl = page.url();
      console.log(`🔍 Final URL: ${finalUrl}`);
      
      if (finalUrl.includes('/login') && !currentUrl.includes('/login')) {
        console.log('❌ FAILED: User was logged out due to auth errors');
        return false;
      } else {
        console.log('✅ SUCCESS: No unexpected logouts detected');
        return true;
      }
      
    } else {
      console.log(`❌ Login failed, unexpected URL: ${currentUrl}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testRefreshTokenFix().then(success => {
  if (success) {
    console.log('🎉 Refresh token fix test PASSED');
    process.exit(0);
  } else {
    console.log('💥 Refresh token fix test FAILED');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});