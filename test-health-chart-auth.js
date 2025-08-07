const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testHealthStatusChartWithAuth() {
  console.log('🚀 Starting Health Status Distribution Chart Test with Auth Handling');
  
  // Launch browser with developer tools
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: null // Use full screen
  });
  
  const page = await context.newPage();
  
  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }
  
  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  // Collect network requests for debugging
  const networkLogs = [];
  page.on('request', request => {
    networkLogs.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle dialog boxes
  page.on('dialog', async dialog => {
    console.log(`Dialog: ${dialog.message()}`);
    await dialog.accept();
  });
  
  try {
    console.log('📱 First, checking if we need to login...');
    
    // Navigate to the dashboard URL
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Check if we're on a login page
    const currentUrl = page.url();
    const hasLoginForm = await page.$('form[action*="login"], input[type="email"], input[name="email"], button[type="submit"]:has-text("Login"), button[type="submit"]:has-text("Sign")');
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Has login form: ${!!hasLoginForm}`);
    
    if (hasLoginForm || currentUrl.includes('login') || currentUrl.includes('auth')) {
      console.log('🔐 Detected login page, attempting to login...');
      
      // Take screenshot of login page
      await page.screenshot({
        path: path.join(screenshotDir, '0-login-page.png'),
        fullPage: true
      });
      
      // Try to find and fill login form
      // Look for common email/username fields
      const emailField = await page.$('input[type="email"], input[name="email"], input[name="username"], input[placeholder*="email"], input[placeholder*="Email"]');
      const passwordField = await page.$('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]');
      
      if (emailField && passwordField) {
        console.log('📝 Found email and password fields, attempting login...');
        
        // Try some common test credentials
        await emailField.fill('test@example.com');
        await passwordField.fill('password');
        
        // Look for submit button
        const submitButton = await page.$('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign")');
        if (submitButton) {
          await submitButton.click();
          await page.waitForTimeout(5000);
          
          // Check if login was successful by looking at URL change
          const newUrl = page.url();
          if (newUrl !== currentUrl) {
            console.log('✅ Login appeared successful, new URL:', newUrl);
          } else {
            console.log('⚠️  Login may not have worked, same URL');
          }
        }
      } else {
        console.log('⚠️  Could not find standard login fields, trying to navigate directly...');
      }
    }
    
    // Try to navigate to dashboard again if we're not there
    if (!page.url().includes('dashboard')) {
      console.log('🔄 Navigating to dashboard again...');
      await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
    }
    
    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);
    
    // Open developer console
    console.log('🔧 Opening developer console...');
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);
    
    // Try to click Console tab in DevTools
    try {
      await page.click('[aria-label="Console"], [data-tab="console"], text=Console', { timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️  Could not click Console tab, continuing...');
    }
    
    // Wait for any chart elements to load
    try {
      await page.waitForSelector('[data-testid="health-status-chart"], .health-status-distribution, canvas, svg, [class*="chart"], [class*="Chart"]', {
        timeout: 15000
      });
      console.log('✅ Chart-related element found');
    } catch (e) {
      console.log('⚠️  No chart elements found with standard selectors');
    }
    
    // Additional wait for any async operations and Korean health analysis
    console.log('⏳ Waiting for Korean health analysis to complete...');
    await page.waitForTimeout(8000);
    
    // Take comprehensive screenshots
    console.log('📸 Taking screenshots...');
    await page.screenshot({
      path: path.join(screenshotDir, '1-dashboard-full.png'),
      fullPage: true
    });
    
    await page.screenshot({
      path: path.join(screenshotDir, '2-dashboard-with-devtools.png'),
      fullPage: false
    });
    
    // Try to find and screenshot specific chart areas
    const chartElements = await page.$$('canvas, svg, [class*="chart"], [class*="Chart"], [data-testid*="chart"]');
    console.log(`📊 Found ${chartElements.length} potential chart elements`);
    
    for (let i = 0; i < Math.min(chartElements.length, 3); i++) {
      try {
        await chartElements[i].screenshot({
          path: path.join(screenshotDir, `3-chart-element-${i + 1}.png`)
        });
      } catch (e) {
        console.log(`⚠️  Could not screenshot chart element ${i + 1}`);
      }
    }
    
    // Search for health-related content on the page
    const pageContent = await page.evaluate(() => {
      const healthKeywords = ['hasHealthData', '고혈압', '당뇨병', 'Fair', 'Good', 'Poor', 'Excellent', 'distribution', 'seniors', 'Korean', 'health'];
      const results = [];
      
      // Search in all text content
      const allText = document.body.innerText || '';
      healthKeywords.forEach(keyword => {
        if (allText.includes(keyword)) {
          results.push(`Found "${keyword}" in page text`);
        }
      });
      
      // Search for specific elements
      const healthElements = document.querySelectorAll('[class*="health"], [data-testid*="health"], [id*="health"]');
      results.push(`Found ${healthElements.length} elements with 'health' in their attributes`);
      
      return results;
    });
    
    console.log('🔍 Page content analysis:');
    pageContent.forEach(result => console.log(`  - ${result}`));
    
    // Inject a script to trigger any missing health analysis
    console.log('💉 Injecting script to trigger health analysis...');
    await page.evaluate(() => {
      // Try to trigger any health data loading
      if (window.location.pathname.includes('dashboard')) {
        console.log('🔄 Dashboard detected, triggering health analysis...');
        
        // Simulate clicking on health-related elements
        const healthElements = document.querySelectorAll('[class*="health"], [data-testid*="health"], button, [role="button"]');
        healthElements.forEach((element, index) => {
          if (index < 5) { // Don't click too many elements
            try {
              element.click();
              console.log(`Clicked health element ${index + 1}`);
            } catch (e) {
              // Ignore click errors
            }
          }
        });
      }
    });
    
    // Wait for any triggered operations
    await page.waitForTimeout(5000);
    
    // Final comprehensive analysis
    console.log('\n🔍 ANALYZING CONSOLE LOGS FOR HEALTH DATA:');
    console.log('=' .repeat(60));
    
    let hasHealthDataFound = false;
    let koreanHealthAnalysis = [];
    let healthDistributionData = [];
    let healthStatusClassifications = [];
    let koreanTextExamples = [];
    
    consoleLogs.forEach((log, index) => {
      const text = log.text;
      const lowerText = text.toLowerCase();
      
      // Check for hasHealthData
      if (lowerText.includes('hashealthdata')) {
        hasHealthDataFound = true;
        console.log(`✅ [${log.type}] hasHealthData found: ${text}`);
      }
      
      // Look for Korean health conditions
      if (text.includes('고혈압') || text.includes('당뇨병') || 
          text.includes('관리 중') || text.includes('건강') ||
          text.includes('혈당') || text.includes('혈압')) {
        koreanHealthAnalysis.push(text);
        console.log(`🇰🇷 [${log.type}] Korean health: ${text}`);
      }
      
      // Look for health status classifications
      if (lowerText.includes('fair') || lowerText.includes('good') || 
          lowerText.includes('poor') || lowerText.includes('excellent') || 
          lowerText.includes('classification') || lowerText.includes('status')) {
        healthStatusClassifications.push(text);
        console.log(`📊 [${log.type}] Classification: ${text}`);
      }
      
      // Look for distribution data
      if (lowerText.includes('distribution') || lowerText.includes('count') || 
          lowerText.includes('seniors') || lowerText.includes('40') ||
          lowerText.includes('analyzed') || lowerText.includes('sample')) {
        healthDistributionData.push(text);
        console.log(`📈 [${log.type}] Distribution: ${text}`);
      }
      
      // Look for specific Korean examples like "고혈압, 당뇨병 관리 중"
      if (text.includes('고혈압, 당뇨병 관리 중') || 
          (text.includes('고혈압') && text.includes('당뇨병') && text.includes('관리'))) {
        koreanTextExamples.push(text);
        console.log(`🎯 [${log.type}] Korean example: ${text}`);
      }
    });
    
    // Generate comprehensive test report
    const testReport = {
      timestamp: new Date().toISOString(),
      testUrl: 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard',
      finalUrl: page.url(),
      testResults: {
        hasHealthDataFound,
        koreanHealthAnalysisCount: koreanHealthAnalysis.length,
        healthStatusClassificationsCount: healthStatusClassifications.length,
        healthDistributionDataCount: healthDistributionData.length,
        koreanTextExamplesCount: koreanTextExamples.length,
        totalConsoleLogs: consoleLogs.length,
        chartElementsFound: chartElements.length
      },
      evidence: {
        hasHealthDataLogs: consoleLogs.filter(log => log.text.toLowerCase().includes('hashealthdata')),
        koreanHealthAnalysis: koreanHealthAnalysis.slice(0, 10),
        healthStatusClassifications: healthStatusClassifications.slice(0, 10),
        healthDistributionData: healthDistributionData.slice(0, 10),
        koreanTextExamples: koreanTextExamples
      },
      pageContent,
      allConsoleLogs: consoleLogs,
      networkRequests: networkLogs
    };
    
    // Save detailed test report
    fs.writeFileSync(
      path.join(screenshotDir, 'detailed-test-report.json'), 
      JSON.stringify(testReport, null, 2)
    );
    
    // Generate readable summary report
    const summaryReport = `
HEALTH STATUS DISTRIBUTION CHART TEST RESULTS
=============================================
Test Date: ${new Date().toISOString()}
Target URL: http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard
Final URL: ${page.url()}

KEY FINDINGS:
=============
✅ hasHealthData Status: ${hasHealthDataFound ? 'FOUND' : 'NOT FOUND'}
🇰🇷 Korean Health Analysis Logs: ${koreanHealthAnalysis.length}
📊 Health Status Classifications: ${healthStatusClassifications.length}
📈 Distribution Data Logs: ${healthDistributionData.length}
🎯 Korean Text Examples: ${koreanTextExamples.length}
📊 Chart Elements Found: ${chartElements.length}
📝 Total Console Logs: ${consoleLogs.length}

SPECIFIC EVIDENCE:
==================
${hasHealthDataFound ? '✅ hasHealthData confirmation found in console logs' : '❌ hasHealthData not found in console logs'}
${koreanHealthAnalysis.length > 0 ? `✅ ${koreanHealthAnalysis.length} Korean health analysis logs detected` : '❌ No Korean health analysis logs found'}
${koreanTextExamples.length > 0 ? `✅ ${koreanTextExamples.length} Korean text examples found (e.g., "고혈압, 당뇨병 관리 중")` : '❌ No specific Korean text examples found'}
${healthStatusClassifications.length > 0 ? `✅ ${healthStatusClassifications.length} health status classification logs found` : '❌ No health status classification logs found'}
${chartElements.length > 0 ? `✅ ${chartElements.length} chart elements detected on page` : '❌ No chart elements found'}

KOREAN HEALTH ANALYSIS SAMPLES:
===============================
${koreanHealthAnalysis.slice(0, 3).map((log, i) => `${i + 1}. ${log}`).join('\n')}

HEALTH STATUS CLASSIFICATION SAMPLES:
====================================
${healthStatusClassifications.slice(0, 3).map((log, i) => `${i + 1}. ${log}`).join('\n')}

SCREENSHOTS SAVED:
==================
- 0-login-page.png (if login was required)
- 1-dashboard-full.png (full page screenshot)
- 2-dashboard-with-devtools.png (with dev tools open)
- 3-chart-element-*.png (individual chart elements)

FILES GENERATED:
================
- detailed-test-report.json (complete technical data)
- test-summary.txt (this file)
`;
    
    fs.writeFileSync(
      path.join(screenshotDir, 'test-summary.txt'), 
      summaryReport
    );
    
    console.log('\n📋 FINAL TEST SUMMARY:');
    console.log('=' .repeat(40));
    console.log(`✅ hasHealthData found: ${hasHealthDataFound}`);
    console.log(`🇰🇷 Korean health analysis logs: ${koreanHealthAnalysis.length}`);
    console.log(`📊 Health status classifications: ${healthStatusClassifications.length}`);
    console.log(`📈 Distribution data logs: ${healthDistributionData.length}`);
    console.log(`🎯 Korean text examples: ${koreanTextExamples.length}`);
    console.log(`📊 Chart elements found: ${chartElements.length}`);
    console.log(`📝 Total console logs: ${consoleLogs.length}`);
    console.log(`\n📁 All results saved to: ${screenshotDir}`);
    
    if (hasHealthDataFound && koreanHealthAnalysis.length > 0) {
      console.log('\n🎉 SUCCESS: Korean health analysis appears to be working!');
    } else if (consoleLogs.length === 0) {
      console.log('\n⚠️  WARNING: No console logs captured - may need to check console access');
    } else {
      console.log('\n❌ Korean health analysis may not be working as expected');
    }
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for manual inspection...');
    console.log('Check the console logs manually and press Ctrl+C when done');
    
    // Wait for manual inspection
    await new Promise(resolve => {
      console.log('Press Enter to close browser and exit...');
      process.stdin.once('data', resolve);
    });
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Take error screenshot
    try {
      await page.screenshot({
        path: path.join(screenshotDir, 'error-screenshot.png'),
        fullPage: true
      });
      console.log('📸 Error screenshot saved');
    } catch (e) {
      console.log('Could not take error screenshot');
    }
    
    // Save error details
    const errorReport = {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      consoleLogs: consoleLogs,
      url: page.url()
    };
    
    fs.writeFileSync(
      path.join(screenshotDir, 'error-report.json'),
      JSON.stringify(errorReport, null, 2)
    );
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Add graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Run the test
testHealthStatusChartWithAuth().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});