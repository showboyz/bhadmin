const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testKoreanHealthAnalysis() {
  console.log('🚀 Korean Health Status Analysis Test');
  console.log('=====================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: null
  });
  
  const page = await context.newPage();
  
  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'korean-health-test-results');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }
  
  // Console log collection
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    
    // Real-time filtering for Korean health analysis
    const text = msg.text();
    if (text.includes('hasHealthData') || 
        text.includes('고혈압') || text.includes('당뇨병') || 
        text.includes('Fair') || text.includes('Good') || text.includes('Poor') ||
        text.includes('classification') || text.includes('distribution') ||
        text.includes('Korean') || text.includes('seniors')) {
      console.log(`🎯 [${msg.type().toUpperCase()}] ${text}`);
    }
  });
  
  const testResults = {
    timestamp: new Date().toISOString(),
    testUrl: 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard',
    credentials: 'todays777@gmail.com',
    steps: [],
    koreanAnalysisFindings: {
      hasHealthDataFound: false,
      koreanTextExamples: [],
      healthStatusClassifications: [],
      distributionDataLogs: [],
      chartElementsFound: 0
    },
    screenshots: [],
    allConsoleLogs: []
  };
  
  try {
    // Step 1: Login with working credentials
    console.log('\n🔐 Step 1: Authenticating with known working credentials...');
    testResults.steps.push('Authentication started');
    
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotDir, '01-login-page.png'),
      fullPage: true
    });
    testResults.screenshots.push('01-login-page.png');
    
    // Fill credentials
    await page.fill('input[type="email"], input[name="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'your-new-password');
    
    await page.screenshot({
      path: path.join(screenshotDir, '02-credentials-filled.png'),
      fullPage: true
    });
    testResults.screenshots.push('02-credentials-filled.png');
    
    // Submit login
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const loginUrl = page.url();
    console.log(`✅ Login completed, current URL: ${loginUrl}`);
    testResults.steps.push(`Login completed - URL: ${loginUrl}`);
    
    // Step 2: Navigate to dashboard
    console.log('\n📊 Step 2: Navigating to dashboard...');
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for any auth checks
    await page.waitForTimeout(5000);
    
    const dashboardUrl = page.url();
    console.log(`📍 Dashboard loaded: ${dashboardUrl}`);
    testResults.steps.push(`Dashboard navigation - URL: ${dashboardUrl}`);
    
    if (dashboardUrl.includes('login')) {
      throw new Error('Still redirected to login - authentication may have failed');
    }
    
    // Step 3: Open Developer Tools and wait for Korean analysis
    console.log('\n🛠️ Step 3: Opening Developer Tools and waiting for Korean health analysis...');
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);
    
    // Try to focus console
    try {
      await page.click('[aria-label*="Console"], text=Console', { timeout: 3000 });
    } catch (e) {
      console.log('Could not click Console tab, continuing...');
    }
    
    await page.screenshot({
      path: path.join(screenshotDir, '03-dashboard-with-devtools.png'),
      fullPage: true
    });
    testResults.screenshots.push('03-dashboard-with-devtools.png');
    
    // Step 4: Wait for Korean health analysis to complete
    console.log('\n⏳ Step 4: Waiting for Korean health analysis to complete (15 seconds)...');
    console.log('Looking for logs containing:');
    console.log('- hasHealthData status');
    console.log('- Korean text like "고혈압, 당뇨병 관리 중"');
    console.log('- Health status classifications (Fair, Good, Poor)');
    console.log('- Distribution data from 40 seniors');
    
    // Extended wait with progress indicators
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1000);
      process.stdout.write('.');
    }
    console.log(' Done!\n');
    
    testResults.steps.push('Completed extended wait for Korean health analysis');
    
    // Step 5: Capture final state
    console.log('📸 Step 5: Capturing final dashboard state...');
    
    await page.screenshot({
      path: path.join(screenshotDir, '04-final-dashboard-state.png'),
      fullPage: true
    });
    testResults.screenshots.push('04-final-dashboard-state.png');
    
    // Look for chart elements
    const chartElements = await page.$$('canvas, svg, [class*="chart"], [class*="Chart"], [data-testid*="chart"]');
    testResults.koreanAnalysisFindings.chartElementsFound = chartElements.length;
    console.log(`📊 Found ${chartElements.length} chart elements on page`);
    
    // Screenshot individual charts if found
    for (let i = 0; i < Math.min(chartElements.length, 3); i++) {
      try {
        await chartElements[i].screenshot({
          path: path.join(screenshotDir, `05-chart-${i + 1}.png`)
        });
        testResults.screenshots.push(`05-chart-${i + 1}.png`);
      } catch (e) {
        console.log(`Could not screenshot chart ${i + 1}`);
      }
    }
    
    // Step 6: Analyze collected console logs for Korean health analysis
    console.log('\n🔍 Step 6: Analyzing console logs for Korean health analysis evidence...');
    console.log('=' .repeat(60));
    
    testResults.allConsoleLogs = consoleLogs;
    
    consoleLogs.forEach((log, index) => {
      const text = log.text;
      const lowerText = text.toLowerCase();
      
      // Check for hasHealthData
      if (lowerText.includes('hashealthdata')) {
        testResults.koreanAnalysisFindings.hasHealthDataFound = true;
        console.log(`✅ hasHealthData found: ${text}`);
      }
      
      // Korean health conditions
      if (text.includes('고혈압') || text.includes('당뇨병') || 
          text.includes('관리 중') || text.includes('건강') ||
          text.includes('혈당') || text.includes('혈압')) {
        testResults.koreanAnalysisFindings.koreanTextExamples.push(text);
        console.log(`🇰🇷 Korean health text: ${text}`);
      }
      
      // Health status classifications
      if (lowerText.includes('fair') || lowerText.includes('good') || 
          lowerText.includes('poor') || lowerText.includes('excellent') || 
          lowerText.includes('classification')) {
        testResults.koreanAnalysisFindings.healthStatusClassifications.push(text);
        console.log(`📊 Health classification: ${text}`);
      }
      
      // Distribution data
      if (lowerText.includes('distribution') || lowerText.includes('count') || 
          lowerText.includes('seniors') || lowerText.includes('40') ||
          lowerText.includes('analyzed')) {
        testResults.koreanAnalysisFindings.distributionDataLogs.push(text);
        console.log(`📈 Distribution data: ${text}`);
      }
    });
    
    // Step 7: Generate comprehensive report
    console.log('\n📋 Step 7: Generating test report...');
    
    const summary = `
KOREAN HEALTH STATUS ANALYSIS TEST RESULTS
==========================================
Test Date: ${new Date().toISOString()}
Target URL: http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard
Credentials Used: todays777@gmail.com
Final Dashboard URL: ${page.url()}

KEY FINDINGS:
=============
✅ hasHealthData Status: ${testResults.koreanAnalysisFindings.hasHealthDataFound ? 'FOUND ✓' : 'NOT FOUND ✗'}
🇰🇷 Korean Text Examples: ${testResults.koreanAnalysisFindings.koreanTextExamples.length}
📊 Health Classifications: ${testResults.koreanAnalysisFindings.healthStatusClassifications.length}
📈 Distribution Data Logs: ${testResults.koreanAnalysisFindings.distributionDataLogs.length}
📊 Chart Elements: ${testResults.koreanAnalysisFindings.chartElementsFound}
📝 Total Console Logs: ${consoleLogs.length}

EVIDENCE SUMMARY:
================
${testResults.koreanAnalysisFindings.hasHealthDataFound ? '✅ hasHealthData confirmation detected' : '❌ No hasHealthData confirmation'}
${testResults.koreanAnalysisFindings.koreanTextExamples.length > 0 ? `✅ Korean health text found (${testResults.koreanAnalysisFindings.koreanTextExamples.length} examples)` : '❌ No Korean health text detected'}
${testResults.koreanAnalysisFindings.healthStatusClassifications.length > 0 ? `✅ Health classifications found (${testResults.koreanAnalysisFindings.healthStatusClassifications.length} logs)` : '❌ No health classifications detected'}
${testResults.koreanAnalysisFindings.chartElementsFound > 0 ? `✅ Chart visualization found (${testResults.koreanAnalysisFindings.chartElementsFound} elements)` : '❌ No chart elements detected'}

KOREAN TEXT EXAMPLES:
=====================
${testResults.koreanAnalysisFindings.koreanTextExamples.slice(0, 5).map((text, i) => `${i + 1}. ${text}`).join('\n')}

HEALTH CLASSIFICATION EXAMPLES:
===============================
${testResults.koreanAnalysisFindings.healthStatusClassifications.slice(0, 5).map((text, i) => `${i + 1}. ${text}`).join('\n')}

DISTRIBUTION DATA EXAMPLES:
===========================
${testResults.koreanAnalysisFindings.distributionDataLogs.slice(0, 5).map((text, i) => `${i + 1}. ${text}`).join('\n')}

OVERALL ASSESSMENT:
==================
${getOverallAssessment(testResults.koreanAnalysisFindings)}
`;
    
    // Save files
    fs.writeFileSync(path.join(screenshotDir, 'test-summary.txt'), summary);
    fs.writeFileSync(path.join(screenshotDir, 'detailed-results.json'), JSON.stringify(testResults, null, 2));
    
    console.log(summary);
    console.log(`\n📁 All results saved to: ${screenshotDir}`);
    
    // Step 8: Keep browser open for manual inspection
    console.log('\n🔍 Step 8: Browser remains open for manual inspection');
    console.log('💡 Check the Developer Console for additional Korean health analysis logs');
    console.log('💡 Look for the Health Status Distribution chart on the dashboard');
    console.log('Press Enter to close browser and complete test...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    await page.screenshot({
      path: path.join(screenshotDir, '99-error-state.png'),
      fullPage: true
    });
    
    testResults.error = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(screenshotDir, 'error-details.json'), 
      JSON.stringify(testResults, null, 2)
    );
    
    throw error;
    
  } finally {
    await browser.close();
  }
  
  return testResults;
}

function getOverallAssessment(findings) {
  const { hasHealthDataFound, koreanTextExamples, healthStatusClassifications, chartElementsFound } = findings;
  
  if (hasHealthDataFound && koreanTextExamples.length > 0 && healthStatusClassifications.length > 0) {
    return '🎉 SUCCESS: Korean health analysis appears to be working correctly!\n✅ All key indicators present: hasHealthData, Korean text processing, and health classifications.';
  } else if (hasHealthDataFound && (koreanTextExamples.length > 0 || healthStatusClassifications.length > 0)) {
    return '⚠️ PARTIAL SUCCESS: Some Korean health analysis detected, but not all expected elements found.\n📝 Review console logs for missing components.';
  } else if (chartElementsFound > 0) {
    return '⚠️ CHART PRESENT: Chart visualization detected but Korean analysis logs missing.\n❓ Chart may be showing fallback data instead of real Korean analysis.';
  } else {
    return '❌ FAILURE: Korean health analysis not working as expected.\n🔍 No evidence of hasHealthData, Korean text processing, or health classifications.';
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  process.exit(0);
});

// Run the test
console.log('Starting Korean Health Status Analysis Test...\n');
testKoreanHealthAnalysis()
  .then(results => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });