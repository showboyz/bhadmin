const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testHealthStatusChart() {
  console.log('🚀 Starting Health Status Distribution Chart Test');
  
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
  
  try {
    console.log('📱 Navigating to dashboard...');
    
    // Navigate to the dashboard URL
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for page to fully load...');
    
    // Wait for the page to fully load and console logs to appear
    await page.waitForTimeout(5000);
    
    // Wait for specific elements that indicate the chart is loaded
    try {
      await page.waitForSelector('[data-testid="health-status-chart"], .health-status-distribution, canvas, svg', {
        timeout: 10000
      });
      console.log('✅ Chart container found');
    } catch (e) {
      console.log('⚠️  Chart container not found with standard selectors, continuing...');
    }
    
    // Additional wait for any lazy-loaded data
    await page.waitForTimeout(3000);
    
    console.log('📊 Taking initial screenshot...');
    await page.screenshot({
      path: path.join(screenshotDir, '1-initial-dashboard.png'),
      fullPage: true
    });
    
    // Open developer console if not already open
    console.log('🔧 Opening developer console...');
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);
    
    // Take screenshot with dev tools open
    console.log('📸 Taking screenshot with dev tools...');
    await page.screenshot({
      path: path.join(screenshotDir, '2-dashboard-with-devtools.png'),
      fullPage: true
    });
    
    // Try to focus on console tab
    try {
      await page.click('text=Console', { timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️  Could not click Console tab, continuing...');
    }
    
    // Look for health-related elements and data
    console.log('🔍 Searching for health status elements...');
    
    // Check for chart elements
    const chartElements = await page.$$('canvas, svg, [class*="chart"], [class*="health"]');
    console.log(`📊 Found ${chartElements.length} potential chart elements`);
    
    // Try to find text related to health status
    const healthStatusText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const healthRelatedElements = [];
      
      for (let element of elements) {
        const text = element.textContent || '';
        if (text.includes('Health Status') || 
            text.includes('health') || 
            text.includes('distribution') ||
            text.includes('고혈압') ||
            text.includes('당뇨병') ||
            text.includes('Fair') ||
            text.includes('Good') ||
            text.includes('Poor')) {
          healthRelatedElements.push({
            tag: element.tagName,
            text: text.slice(0, 200),
            className: element.className
          });
        }
      }
      return healthRelatedElements;
    });
    
    console.log('🏥 Found health-related elements:', healthStatusText.length);
    healthStatusText.forEach((element, i) => {
      console.log(`  ${i + 1}. ${element.tag}.${element.className}: ${element.text}`);
    });
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(3000);
    
    // Take final screenshots
    console.log('📸 Taking final screenshots...');
    await page.screenshot({
      path: path.join(screenshotDir, '3-final-dashboard.png'),
      fullPage: true
    });
    
    // Try to screenshot just the console area if dev tools are open
    try {
      const consolePanel = await page.$('[aria-label*="Console"], [data-tab="console"], .console-view');
      if (consolePanel) {
        await consolePanel.screenshot({
          path: path.join(screenshotDir, '4-console-logs.png')
        });
        console.log('📋 Console screenshot taken');
      }
    } catch (e) {
      console.log('⚠️  Could not screenshot console panel specifically');
    }
    
    // Analyze console logs for health-related data
    console.log('\n🔍 ANALYZING CONSOLE LOGS FOR HEALTH DATA:');
    console.log('=' .repeat(50));
    
    let hasHealthDataFound = false;
    let koreanHealthAnalysis = [];
    let healthDistributionData = [];
    let healthStatusClassifications = [];
    
    consoleLogs.forEach((log, index) => {
      const text = log.text.toLowerCase();
      
      // Check for hasHealthData
      if (text.includes('hashealthdata')) {
        hasHealthDataFound = true;
        console.log(`✅ Found hasHealthData log: ${log.text}`);
      }
      
      // Look for Korean health conditions
      if (log.text.includes('고혈압') || log.text.includes('당뇨병') || 
          log.text.includes('관리 중') || log.text.includes('건강')) {
        koreanHealthAnalysis.push(log.text);
        console.log(`🇰🇷 Korean health analysis: ${log.text}`);
      }
      
      // Look for health status classifications
      if (text.includes('fair') || text.includes('good') || text.includes('poor') ||
          text.includes('excellent') || text.includes('classification')) {
        healthStatusClassifications.push(log.text);
        console.log(`📊 Health classification: ${log.text}`);
      }
      
      // Look for distribution data
      if (text.includes('distribution') || text.includes('count') || 
          text.includes('seniors') || text.includes('40')) {
        healthDistributionData.push(log.text);
        console.log(`📈 Distribution data: ${log.text}`);
      }
    });
    
    // Generate test report
    const testReport = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard',
      results: {
        hasHealthDataFound,
        koreanHealthAnalysisCount: koreanHealthAnalysis.length,
        healthStatusClassificationsCount: healthStatusClassifications.length,
        healthDistributionDataCount: healthDistributionData.length,
        totalConsoleLogs: consoleLogs.length,
        chartElementsFound: chartElements.length,
        healthRelatedElementsFound: healthStatusText.length
      },
      evidence: {
        koreanHealthAnalysis: koreanHealthAnalysis.slice(0, 5), // First 5
        healthStatusClassifications: healthStatusClassifications.slice(0, 5),
        healthDistributionData: healthDistributionData.slice(0, 5)
      },
      allConsoleLogs: consoleLogs,
      networkRequests: networkLogs.slice(0, 20) // First 20 requests
    };
    
    // Save test report
    fs.writeFileSync(
      path.join(screenshotDir, 'test-report.json'), 
      JSON.stringify(testReport, null, 2)
    );
    
    console.log('\n📋 TEST SUMMARY:');
    console.log('=' .repeat(30));
    console.log(`✅ hasHealthData found: ${hasHealthDataFound}`);
    console.log(`🇰🇷 Korean health analysis logs: ${koreanHealthAnalysis.length}`);
    console.log(`📊 Health status classifications: ${healthStatusClassifications.length}`);
    console.log(`📈 Distribution data logs: ${healthDistributionData.length}`);
    console.log(`📊 Chart elements found: ${chartElements.length}`);
    console.log(`🏥 Health-related elements: ${healthStatusText.length}`);
    console.log(`📝 Total console logs: ${consoleLogs.length}`);
    console.log(`\n📁 Screenshots and report saved to: ${screenshotDir}`);
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for manual inspection...');
    console.log('Press Ctrl+C to close when done reviewing');
    
    // Wait for user to manually close
    await new Promise(() => {}); // Infinite wait
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'error-screenshot.png'),
      fullPage: true
    });
    
    throw error;
  } finally {
    // Uncomment to auto-close browser
    // await browser.close();
  }
}

// Run the test
testHealthStatusChart().catch(console.error);