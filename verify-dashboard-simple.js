const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyDashboard() {
  console.log('🚀 Starting Dashboard Verification Process...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const orgId = 'bf579a76-e9c5-45be-8659-7e62664883c4';
  const baseURL = 'http://localhost:3000';
  const dashboardURL = `${baseURL}/org/${orgId}/dashboard`;
  
  let results = {
    timestamp: new Date().toISOString(),
    dashboardURL,
    orgId,
    screenshots: [],
    apiData: null,
    dashboardData: null,
    verification: {
      apiWorking: false,
      dashboardAccessible: false,
      dataConsistent: false,
      expectedUsersFound: false
    }
  };
  
  try {
    // Step 1: First, verify API is working
    console.log('📡 Step 1: Testing API endpoint...');
    
    const apiResponse = await fetch(`${baseURL}/api/seniors?org_id=${orgId}`);
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      results.apiData = apiData;
      results.verification.apiWorking = true;
      
      console.log(`✅ API working - Found ${apiData.count} users:`);
      if (apiData.seniors) {
        apiData.seniors.forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.name} (ID: ${user.id})`);
        });
      }
    } else {
      console.log('❌ API not responding');
    }
    
    // Step 2: Try to access dashboard directly 
    console.log('\n🌐 Step 2: Accessing dashboard...');
    await page.goto(dashboardURL);
    await page.waitForLoadState('domcontentloaded');
    
    // Take initial screenshot
    const screenshotDir = path.join(__dirname, 'dashboard-verification-simple');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const initialScreenshot = path.join(screenshotDir, '01-initial-access.png');
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    results.screenshots.push(initialScreenshot);
    console.log(`📸 Initial screenshot: ${initialScreenshot}`);
    
    // Check if login is required
    const needsLogin = await page.locator('input[type="email"]').isVisible();
    
    if (needsLogin) {
      console.log('🔐 Login required - attempting authentication...');
      
      // Try different credentials
      const credentials = [
        { email: 'admin@andrewclinic.com', password: 'admin123' },
        { email: 'admin@example.com', password: 'admin123' },
        { email: 'test@example.com', password: 'password' }
      ];
      
      for (const cred of credentials) {
        try {
          await page.fill('input[type="email"]', cred.email);
          await page.fill('input[type="password"]', cred.password);
          
          const loginScreenshot = path.join(screenshotDir, `02-login-attempt-${cred.email.split('@')[0]}.png`);
          await page.screenshot({ path: loginScreenshot, fullPage: true });
          results.screenshots.push(loginScreenshot);
          
          await page.click('button[type="submit"]');
          await page.waitForTimeout(2000);
          
          // Check if login was successful
          const currentUrl = page.url();
          if (currentUrl.includes('dashboard')) {
            console.log(`✅ Login successful with ${cred.email}`);
            results.verification.dashboardAccessible = true;
            break;
          } else {
            console.log(`❌ Login failed with ${cred.email}`);
            // Clear fields for next attempt
            await page.fill('input[type="email"]', '');
            await page.fill('input[type="password"]', '');
          }
        } catch (error) {
          console.log(`❌ Login error with ${cred.email}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ No login required');
      results.verification.dashboardAccessible = true;
    }
    
    // Step 3: If we're on dashboard, extract data
    if (results.verification.dashboardAccessible) {
      console.log('\n📊 Step 3: Extracting dashboard data...');
      
      // Wait for dashboard to load
      await page.waitForTimeout(5000);
      
      // Take dashboard screenshot
      const dashboardScreenshot = path.join(screenshotDir, '03-dashboard-loaded.png');
      await page.screenshot({ path: dashboardScreenshot, fullPage: true });
      results.screenshots.push(dashboardScreenshot);
      console.log(`📸 Dashboard screenshot: ${dashboardScreenshot}`);
      
      // Try to extract KPI values
      try {
        const kpiValues = await page.locator('.text-xl.font-bold').allTextContents();
        const kpiTitles = await page.locator('.text-sm.font-medium').allTextContents();
        
        console.log('📈 Dashboard KPIs found:');
        for (let i = 0; i < Math.min(kpiTitles.length, kpiValues.length); i++) {
          console.log(`   ${kpiTitles[i]}: ${kpiValues[i]}`);
        }
        
        results.dashboardData = {
          kpiTitles,
          kpiValues
        };
        
      } catch (error) {
        console.log('❌ Could not extract KPI data:', error.message);
      }
      
      // Take a screenshot of just the KPI section if possible
      try {
        const kpiSection = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6.mb-8').first();
        if (await kpiSection.isVisible()) {
          const kpiScreenshot = path.join(screenshotDir, '04-kpi-section.png');
          await kpiSection.screenshot({ path: kpiScreenshot });
          results.screenshots.push(kpiScreenshot);
          console.log(`📸 KPI section screenshot: ${kpiScreenshot}`);
        }
      } catch (error) {
        console.log('Could not capture KPI section:', error.message);
      }
    }
    
    // Step 4: Compare data
    console.log('\n🔍 Step 4: Data Comparison...');
    
    if (results.apiData && results.apiData.success) {
      const expectedUsers = ['김영희', '박철수', '정할머니'];
      const actualUsers = results.apiData.seniors?.map(s => s.name) || [];
      
      console.log('Expected users:', expectedUsers);
      console.log('Actual users:', actualUsers);
      
      const allFound = expectedUsers.every(name => actualUsers.includes(name));
      results.verification.expectedUsersFound = allFound;
      
      console.log(`Expected users found: ${allFound ? '✅' : '❌'}`);
      
      if (results.dashboardData && results.dashboardData.kpiValues.length > 0) {
        // Try to find total users value
        const totalUsersIndex = results.dashboardData.kpiTitles.findIndex(title => 
          title.toLowerCase().includes('total users')
        );
        
        if (totalUsersIndex >= 0) {
          const dashboardTotal = parseInt(results.dashboardData.kpiValues[totalUsersIndex]) || 0;
          const apiTotal = results.apiData.count || 0;
          
          console.log(`Dashboard Total Users: ${dashboardTotal}`);
          console.log(`API Total Users: ${apiTotal}`);
          
          results.verification.dataConsistent = dashboardTotal === apiTotal;
          console.log(`Data consistent: ${results.verification.dataConsistent ? '✅' : '❌'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await browser.close();
  }
  
  // Save results
  const reportPath = path.join(__dirname, 'dashboard-verification-simple', 'verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n📄 Final Report:');
  console.log('='.repeat(50));
  Object.entries(results.verification).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✅' : '❌'}`);
  });
  
  console.log(`\n📁 Full report saved to: ${reportPath}`);
  console.log('📸 Screenshots saved to:', results.screenshots);
  
  return results;
}

// Run the verification
if (require.main === module) {
  verifyDashboard()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyDashboard };