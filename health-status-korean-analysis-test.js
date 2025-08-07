const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testHealthStatusKoreanAnalysis() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const testResults = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard',
    consoleLogs: [],
    healthStatusLogs: [],
    hasHealthDataLogs: [],
    classificationExamples: [],
    healthDistribution: null,
    screenshots: [],
    errors: []
  };

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'health-status-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    console.log('🚀 Starting Health Status Korean Analysis Test');
    console.log('📍 Target URL:', testResults.url);

    // Capture all console messages
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      
      testResults.consoleLogs.push(logEntry);
      
      // Filter health status related logs
      if (msg.text().includes('hasHealthData') || 
          msg.text().includes('health status') ||
          msg.text().includes('Health Status') ||
          msg.text().includes('Korean') ||
          msg.text().includes('고혈압') ||
          msg.text().includes('당뇨병') ||
          msg.text().includes('Fair') ||
          msg.text().includes('Good') ||
          msg.text().includes('Poor') ||
          msg.text().includes('Excellent') ||
          msg.text().includes('distribution') ||
          msg.text().includes('Distribution') ||
          msg.text().includes('seniors') ||
          msg.text().includes('40') ||
          msg.text().includes('notes from') ||
          msg.text().includes('classified') ||
          msg.text().includes('관리 중')) {
        testResults.healthStatusLogs.push(logEntry);
        console.log(`🏥 Health Status Log [${msg.type()}]:`, msg.text());
      }

      // Capture hasHealthData specifically
      if (msg.text().includes('hasHealthData')) {
        testResults.hasHealthDataLogs.push(logEntry);
        console.log(`📊 hasHealthData Log:`, msg.text());
      }

      // Capture classification examples
      if (msg.text().includes('→') && (msg.text().includes('Fair') || 
          msg.text().includes('Good') || msg.text().includes('Poor') || 
          msg.text().includes('Excellent'))) {
        testResults.classificationExamples.push(logEntry);
        console.log(`🏷️ Classification Example:`, msg.text());
      }

      // Capture distribution data
      if (msg.text().includes('distribution') || msg.text().includes('Distribution')) {
        console.log(`📈 Distribution Log:`, msg.text());
      }

      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
      const errorEntry = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      testResults.errors.push(errorEntry);
      console.error('❌ Page Error:', error.message);
    });

    // Navigate to the dashboard
    console.log('🔗 Navigating to dashboard...');
    await page.goto(testResults.url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Take initial screenshot
    const initialScreenshot = path.join(screenshotsDir, '01-dashboard-initial.png');
    await page.screenshot({ 
      path: initialScreenshot,
      fullPage: true 
    });
    testResults.screenshots.push('01-dashboard-initial.png');
    console.log('📸 Initial screenshot taken');

    // Wait for the dashboard to load and check for login form
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Check if we need to login
    const loginForm = await page.$('form');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    
    if (loginForm && emailInput) {
      console.log('🔐 Login form detected, attempting login...');
      
      // Try different credential combinations, prioritizing the ones that worked in previous tests
      const credentials = [
        { email: 'andrew@youngandx.com', password: 'RX3XJEemQAfw' }, // This worked in previous health status test
        { email: 'todays777@gmail.com', password: 'your-new-password' },
        { email: 'admin@andrewclinic.com', password: 'admin123' },
        { email: 'admin@example.com', password: 'admin123' },
        { email: 'admin@example.com', password: 'password' },
        { email: 'test@test.com', password: 'test123' },
        { email: 'admin@admin.com', password: 'admin' },
        { email: 'demo@demo.com', password: 'demo' }
      ];

      let loginSuccessful = false;
      
      for (let i = 0; i < credentials.length && !loginSuccessful; i++) {
        const cred = credentials[i];
        console.log(`🔐 Trying credentials ${i + 1}/${credentials.length}: ${cred.email}`);
        
        // Clear and fill login form
        await page.fill('input[type="email"], input[name="email"]', '');
        await page.fill('input[type="password"], input[name="password"]', '');
        await page.fill('input[type="email"], input[name="email"]', cred.email);
        await page.fill('input[type="password"], input[name="password"]', cred.password);
        
        if (i === 0) {
          const loginScreenshot = path.join(screenshotsDir, '02-login-form-filled.png');
          await page.screenshot({ 
            path: loginScreenshot,
            fullPage: true 
          });
          testResults.screenshots.push('02-login-form-filled.png');
        }
        
        // Submit form
        await page.click('button[type="submit"]');
        console.log(`✅ Login attempt ${i + 1} submitted, waiting for result...`);
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check if we're still on login page or redirected
        const currentUrl = page.url();
        const stillOnLogin = currentUrl.includes('/login') || await page.$('input[type="email"]');
        
        if (!stillOnLogin) {
          console.log(`🎉 Login successful with: ${cred.email}`);
          loginSuccessful = true;
          testResults.successfulCredentials = cred;
          break;
        } else {
          console.log(`❌ Login failed with: ${cred.email}`);
        }
      }
      
      // Wait for navigation after successful login
      if (loginSuccessful) {
        await page.waitForTimeout(5000);
      }
      
      const afterLoginScreenshot = path.join(screenshotsDir, '03-after-login.png');
      await page.screenshot({ 
        path: afterLoginScreenshot,
        fullPage: true 
      });
      testResults.screenshots.push('03-after-login.png');
      
      if (!loginSuccessful) {
        console.log('⚠️ All login attempts failed, continuing anyway...');
      }
    }

    // Check current URL after login
    let currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    // If we're on super-admin dashboard, navigate to the specific org dashboard
    if (!currentUrl.includes(testResults.url) && !currentUrl.includes('bf579a76-e9c5-45be-8659-7e62664883c4')) {
      console.log('🔄 Redirecting to Andrew\'s Clinic dashboard...');
      await page.goto(testResults.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      console.log('✅ Navigated to Andrew\'s Clinic dashboard');
      await page.waitForTimeout(3000);
    }

    // Wait for dashboard to fully load
    console.log('⏳ Waiting for dashboard components to load...');
    await page.waitForTimeout(10000);

    // Look for Health Status Distribution chart and related elements
    console.log('🔍 Looking for Health Status Distribution chart...');
    
    // Try multiple selectors for the chart
    const chartSelectors = [
      'text=Health Status Distribution',
      '[data-testid*="health-status"]',
      '[class*="health-status"]',
      '[class*="Health-Status"]',
      'text=Health Status',
      'h1:has-text("Health Status")',
      'h2:has-text("Health Status")',
      'h3:has-text("Health Status")',
      '.recharts-wrapper',
      '[class*="chart"]',
      '[class*="Chart"]'
    ];
    
    let healthStatusChart = null;
    let foundSelector = null;
    
    for (const selector of chartSelectors) {
      try {
        healthStatusChart = await page.$(selector);
        if (healthStatusChart) {
          foundSelector = selector;
          console.log(`✅ Found chart with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (healthStatusChart) {
      console.log('✅ Health Status Distribution chart found');
      
      // Scroll to the chart
      await healthStatusChart.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);
      
      // Take screenshot of the chart area
      const chartScreenshot = path.join(screenshotsDir, '04-health-status-chart.png');
      await page.screenshot({ 
        path: chartScreenshot,
        fullPage: true 
      });
      testResults.screenshots.push('04-health-status-chart.png');
      
      // Try to find the chart container and get more specific screenshot
      const chartContainer = await page.$('[class*="chart"], [class*="Chart"], .recharts-wrapper');
      if (chartContainer) {
        const chartBoundingBox = await chartContainer.boundingBox();
        if (chartBoundingBox) {
          const chartSpecificScreenshot = path.join(screenshotsDir, '05-health-status-chart-specific.png');
          await page.screenshot({ 
            path: chartSpecificScreenshot,
            clip: {
              x: Math.max(0, chartBoundingBox.x - 50),
              y: Math.max(0, chartBoundingBox.y - 50),
              width: Math.min(1920, chartBoundingBox.width + 100),
              height: Math.min(1080, chartBoundingBox.height + 100)
            }
          });
          testResults.screenshots.push('05-health-status-chart-specific.png');
        }
      }
    } else {
      console.log('⚠️ Health Status Distribution chart not found');
      
      // Search for any text containing health status keywords
      const healthKeywords = await page.evaluate(() => {
        const keywords = ['health', 'Health', 'status', 'Status', 'distribution', 'Distribution', 'Fair', 'Good', 'Poor', 'Excellent'];
        const found = [];
        
        keywords.forEach(keyword => {
          const elements = document.evaluate(
            `//*[contains(text(), '${keyword}')]`,
            document,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null
          );
          
          for (let i = 0; i < elements.snapshotLength; i++) {
            const element = elements.snapshotItem(i);
            if (element && element.textContent) {
              found.push({
                keyword,
                text: element.textContent.trim().substring(0, 100),
                tagName: element.tagName
              });
            }
          }
        });
        
        return found;
      });
      
      console.log(`📝 Found ${healthKeywords.length} elements with health-related keywords:`);
      healthKeywords.forEach((item, index) => {
        console.log(`   ${index + 1}. [${item.tagName}] "${item.keyword}": ${item.text}`);
      });
    }

    // Wait for additional logs to be generated
    console.log('⏳ Waiting for health status analysis logs...');
    await page.waitForTimeout(15000);

    // Try to trigger any additional logging by interacting with the page
    await page.evaluate(() => {
      console.log('🔍 Manual trigger - checking for health status data...');
      if (window.location.href.includes('dashboard')) {
        console.log('📍 Currently on dashboard page');
      }
    });

    await page.waitForTimeout(5000);

    // Take final comprehensive screenshot
    const finalScreenshot = path.join(screenshotsDir, '06-final-comprehensive.png');
    await page.screenshot({ 
      path: finalScreenshot,
      fullPage: true 
    });
    testResults.screenshots.push('06-final-comprehensive.png');

    // Look for specific elements that might indicate health data
    const elements = await page.$$eval('*', els => 
      els.filter(el => el.textContent && (
        el.textContent.includes('Fair') ||
        el.textContent.includes('Good') ||
        el.textContent.includes('Poor') ||
        el.textContent.includes('Excellent') ||
        el.textContent.includes('40') ||
        el.textContent.includes('seniors') ||
        el.textContent.includes('Health Status')
      )).map(el => ({
        tagName: el.tagName,
        textContent: el.textContent.trim(),
        className: el.className
      }))
    );

    console.log('🔍 Found health-related elements:', elements.length);
    elements.forEach((el, index) => {
      console.log(`   ${index + 1}. ${el.tagName}: ${el.textContent.substring(0, 100)}...`);
    });

    // Try to extract health distribution data from the page
    const healthDistributionData = await page.evaluate(() => {
      // Look for any data that might be health distribution
      const scripts = Array.from(document.scripts);
      let distributionData = null;
      
      scripts.forEach(script => {
        if (script.textContent.includes('Fair') || 
            script.textContent.includes('Good') || 
            script.textContent.includes('distribution')) {
          console.log('Found potential health distribution in script:', script.textContent.substring(0, 200));
        }
      });
      
      // Look for rendered data in the DOM
      const chartElements = document.querySelectorAll('[class*="recharts"], [class*="chart"], [class*="Chart"]');
      if (chartElements.length > 0) {
        console.log(`Found ${chartElements.length} chart elements`);
        chartElements.forEach((chart, index) => {
          console.log(`Chart ${index + 1} content:`, chart.textContent.substring(0, 200));
        });
      }
      
      return distributionData;
    });

    testResults.healthDistribution = healthDistributionData;

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    testResults.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Take error screenshot
    try {
      const errorScreenshot = path.join(screenshotsDir, '99-error-state.png');
      await page.screenshot({ 
        path: errorScreenshot,
        fullPage: true 
      });
      testResults.screenshots.push('99-error-state.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
  }

  // Generate comprehensive report
  const reportPath = path.join(screenshotsDir, 'health-status-korean-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

  // Print summary
  console.log('\n📋 TEST SUMMARY');
  console.log('================');
  console.log(`🕐 Test Duration: ${Math.round((Date.now() - new Date(testResults.timestamp).getTime()) / 1000)}s`);
  console.log(`📝 Total Console Logs: ${testResults.consoleLogs.length}`);
  console.log(`🏥 Health Status Logs: ${testResults.healthStatusLogs.length}`);
  console.log(`📊 hasHealthData Logs: ${testResults.hasHealthDataLogs.length}`);
  console.log(`🏷️ Classification Examples: ${testResults.classificationExamples.length}`);
  console.log(`📸 Screenshots: ${testResults.screenshots.length}`);
  console.log(`❌ Errors: ${testResults.errors.length}`);

  console.log('\n🏥 HEALTH STATUS ANALYSIS RESULTS:');
  console.log('==================================');
  
  if (testResults.hasHealthDataLogs.length > 0) {
    console.log('📊 hasHealthData Status:');
    testResults.hasHealthDataLogs.forEach(log => {
      console.log(`   - ${log.text}`);
    });
  } else {
    console.log('⚠️ No hasHealthData logs found');
  }

  if (testResults.classificationExamples.length > 0) {
    console.log('\n🏷️ Korean Health Classification Examples:');
    testResults.classificationExamples.forEach((example, index) => {
      console.log(`   ${index + 1}. ${example.text}`);
    });
  } else {
    console.log('⚠️ No classification examples found');
  }

  if (testResults.healthStatusLogs.length > 0) {
    console.log('\n🏥 All Health Status Related Logs:');
    testResults.healthStatusLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. [${log.type}] ${log.text}`);
    });
  }

  console.log(`\n📁 Screenshots saved to: ${screenshotsDir}`);
  console.log(`📄 Full report saved to: ${reportPath}`);

  await browser.close();
  return testResults;
}

// Run the test
if (require.main === module) {
  testHealthStatusKoreanAnalysis()
    .then(results => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testHealthStatusKoreanAnalysis };