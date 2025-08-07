const { chromium } = require('playwright');
const path = require('path');

async function finalDashboardVerification() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const results = {
    testStartTime: new Date().toISOString(),
    authenticationAttempts: [],
    dashboardAccess: {
      successful: false,
      url: null,
      screenshot: null,
      kpiValues: {}
    },
    credentials: [
      { email: 'admin@example.com', password: 'password' },
      { email: 'test@test.com', password: 'test123' },
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'demo@demo.com', password: 'demo' },
      { email: 'admin@andrewclinic.com', password: 'admin123' },
      { email: 'admin@demo.com', password: 'anypassword' }  // Should work with mock auth
    ]
  };
  
  try {
    console.log('🎯 Final Dashboard Verification Test');
    console.log('===================================');
    
    // Try each credential set
    for (const cred of results.credentials) {
      console.log(`\n🔐 Testing credentials: ${cred.email} / ${cred.password}`);
      
      const attemptResult = {
        email: cred.email,
        password: cred.password,
        success: false,
        redirect: null,
        error: null
      };
      
      try {
        // Navigate to login
        await page.goto('http://localhost:3000/login', {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        // Fill credentials
        await page.fill('input[type="email"], input[id="email"]', cred.email);
        await page.fill('input[type="password"], input[id="password"]', cred.password);
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for redirect
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        attemptResult.redirect = currentUrl;
        
        if (currentUrl.includes('/dashboard') && !currentUrl.includes('/login')) {
          console.log(`   ✅ SUCCESS: Redirected to ${currentUrl}`);
          attemptResult.success = true;
          
          // We found working credentials, extract dashboard data
          results.dashboardAccess.successful = true;
          results.dashboardAccess.url = currentUrl;
          
          // Take screenshot
          const screenshotPath = path.join(__dirname, 'final-dashboard-verification.png');
          await page.screenshot({ 
            path: screenshotPath,
            fullPage: true
          });
          results.dashboardAccess.screenshot = screenshotPath;
          console.log(`   📸 Screenshot saved: ${screenshotPath}`);
          
          // Extract KPI values
          console.log('   📊 Extracting KPI data...');
          
          const kpiData = await page.evaluate(() => {
            const kpis = {};
            
            // Look for KPI cards with specific patterns
            const kpiCards = document.querySelectorAll('[class*="card"], .bg-card, div:has(> h3)');
            
            kpiCards.forEach((card, index) => {
              const text = card.textContent?.trim();
              if (text && text.length < 300) {
                // Look for specific patterns
                if (text.includes('Total Users')) {
                  const match = text.match(/Total Users\s*(\d+)/i);
                  if (match) kpis.totalUsers = match[1];
                }
                if (text.includes('Active Today')) {
                  const match = text.match(/Active Today\s*(\d+)/i);
                  if (match) kpis.activeToday = match[1];
                }
                if (text.includes('Weekly Active')) {
                  const match = text.match(/Weekly Active\s*(\d+)/i);
                  if (match) kpis.weeklyActive = match[1];
                }
                if (text.includes('New Users')) {
                  const match = text.match(/New Users.*?(\d+)/i);
                  if (match) kpis.newUsers = match[1];
                }
                if (text.includes('Inactive Users') && text.includes('Week')) {
                  const match = text.match(/Inactive Users.*?(\d+)/i);
                  if (match) kpis.inactiveUsers = match[1];
                }
                if (text.includes('License Seats')) {
                  const match = text.match(/License Seats.*?(\d+)/i);
                  if (match) kpis.licenseSeats = match[1];
                }
              }
            });
            
            // Look for Korean names in user sections
            const bodyText = document.body.textContent || '';
            const koreanNames = ['김영희', '박철수', '정할머니'];
            kpis.foundUsers = koreanNames.filter(name => bodyText.includes(name));
            
            return kpis;
          });
          
          results.dashboardAccess.kpiValues = kpiData;
          
          console.log('   📈 KPI Values extracted:');
          Object.entries(kpiData).forEach(([key, value]) => {
            console.log(`     ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
          });
          
          // Stop testing other credentials since we found working ones
          results.authenticationAttempts.push(attemptResult);
          break;
          
        } else {
          console.log(`   ❌ FAILED: Still on ${currentUrl}`);
          attemptResult.error = 'Redirected back to login or other page';
        }
        
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
        attemptResult.error = error.message;
      }
      
      results.authenticationAttempts.push(attemptResult);
    }
    
    // Final verification
    if (results.dashboardAccess.successful) {
      console.log('\n🎉 FINAL VERIFICATION RESULTS:');
      console.log('============================');
      console.log(`✅ Dashboard access: SUCCESS`);
      console.log(`🔗 URL: ${results.dashboardAccess.url}`);
      console.log(`📸 Screenshot: ${results.dashboardAccess.screenshot}`);
      
      const kpis = results.dashboardAccess.kpiValues;
      
      console.log('\n📊 KPI VERIFICATION:');
      console.log(`   Total Users: ${kpis.totalUsers || 'Not detected'}`);
      console.log(`   Active Today: ${kpis.activeToday || 'Not detected'}`);
      console.log(`   Weekly Active: ${kpis.weeklyActive || 'Not detected'}`);
      console.log(`   New Users: ${kpis.newUsers || 'Not detected'}`);
      console.log(`   Inactive Users: ${kpis.inactiveUsers || 'Not detected'}`);
      console.log(`   License Seats: ${kpis.licenseSeats || 'Not detected'}`);
      
      console.log('\n👥 USER VERIFICATION:');
      if (kpis.foundUsers && kpis.foundUsers.length > 0) {
        console.log(`   Found users: ${kpis.foundUsers.join(', ')}`);
        console.log(`   Expected users: 김영희, 박철수, 정할머니`);
        console.log(`   Match status: ${kpis.foundUsers.length === 3 ? '✅ PERFECT MATCH' : '⚠️ PARTIAL MATCH'}`);
      } else {
        console.log(`   ❌ No Korean user names detected`);
      }
      
      // Verify expected values
      console.log('\n🎯 EXPECTATION CHECK:');
      const totalUsersMatch = kpis.totalUsers === '3';
      console.log(`   Total Users should be 3: ${totalUsersMatch ? '✅ PASS' : '❌ FAIL'} (Got: ${kpis.totalUsers || 'undefined'})`);
      
      const allUsersFound = kpis.foundUsers && kpis.foundUsers.length === 3;
      console.log(`   All 3 users present: ${allUsersFound ? '✅ PASS' : '❌ FAIL'} (Found: ${kpis.foundUsers?.length || 0})`);
      
      results.verification = {
        totalUsersCorrect: totalUsersMatch,
        allUsersFound: allUsersFound,
        overallSuccess: totalUsersMatch && allUsersFound
      };
      
    } else {
      console.log('\n❌ FINAL VERIFICATION: FAILED');
      console.log('Could not authenticate with any of the provided credentials');
      results.verification = {
        totalUsersCorrect: false,
        allUsersFound: false,
        overallSuccess: false
      };
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    results.error = error.message;
  } finally {
    await browser.close();
  }
  
  return results;
}

// Run the final verification
finalDashboardVerification().then(results => {
  console.log('\n📋 COMPLETE TEST REPORT:');
  console.log('=======================');
  
  // Save results to file
  const fs = require('fs');
  const reportPath = path.join(__dirname, 'dashboard-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}`);
  
  // Summary
  if (results.verification?.overallSuccess) {
    console.log('\n🏆 TEST RESULT: COMPLETE SUCCESS!');
    console.log('   ✅ Dashboard accessed successfully');
    console.log('   ✅ Total Users KPI shows 3');
    console.log('   ✅ All expected Korean users found (김영희, 박철수, 정할머니)');
    console.log('   ✅ KPI cards populated with data');
  } else {
    console.log('\n⚠️ TEST RESULT: PARTIAL SUCCESS');
    console.log(`   Dashboard access: ${results.dashboardAccess.successful ? '✅' : '❌'}`);
    console.log(`   Total Users KPI: ${results.verification?.totalUsersCorrect ? '✅' : '❌'}`);
    console.log(`   All users found: ${results.verification?.allUsersFound ? '✅' : '❌'}`);
  }
  
}).catch(error => {
  console.error('💥 Final test error:', error);
});