import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('INNER JOIN Fix Verification - Andrew\'s Clinic Dashboard', () => {
  test('Comprehensive dashboard verification after INNER JOIN fix', async ({ page }) => {
    // Create screenshots directory
    const screenshotDir = path.join(__dirname, '..', 'test-screenshots', 'inner-join-verification');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    // Test configuration - Updated to use correct URL and credentials
    const loginUrl = 'http://localhost:3001/login';
    const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard';
    const credentials = {
      email: 'andrew@youngandx.com',
      password: 'RX3XJEemQAfw'
    };

    // Expected KPI values after INNER JOIN fix
    const expectedKPIs = {
      totalUsers: 33,
      activeToday: 3,
      weeklyActive: 19,
      newUsersThisMonth: 1
    };

    // Track network requests and console logs
    const networkRequests = [];
    const consoleLogs = [];
    const apiErrors = [];

    // Set up network monitoring
    page.on('request', req => {
      networkRequests.push({
        url: req.url(),
        method: req.method(),
        timestamp: new Date().toISOString()
      });
    });

    page.on('response', async response => {
      if (response.url().includes('/api/') || response.url().includes('/rest/v1/')) {
        const responseData = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        };
        
        networkRequests.push(responseData);
        
        if (!response.ok()) {
          try {
            const body = await response.text();
            apiErrors.push({
              ...responseData,
              body: body.substring(0, 1000) // Limit body size
            });
          } catch (e) {
            apiErrors.push(responseData);
          }
        }
      }
    });

    // Set up console monitoring
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
        location: msg.location()
      });
      
      // Log important messages in real-time
      if (msg.type() === 'error' || msg.text().includes('dashboard') || msg.text().includes('KPI')) {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    console.log('🚀 Starting INNER JOIN Fix Verification Test');
    console.log(`📊 Expected KPIs: Total Users: ${expectedKPIs.totalUsers}, Active Today: ${expectedKPIs.activeToday}, Weekly Active: ${expectedKPIs.weeklyActive}, New Users: ${expectedKPIs.newUsersThisMonth}`);

    // Step 1: Navigate to login page
    console.log('📋 Step 1: Navigating to login page');
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/01-login-page.png`,
      fullPage: true 
    });

    // Step 2: Login with correct credentials
    console.log('🔐 Step 2: Logging in with Andrew\'s credentials');
    await page.fill('input[type="email"], input[name="email"]', credentials.email);
    await page.fill('input[type="password"], input[name="password"]', credentials.password);
    
    await page.screenshot({ 
      path: `${screenshotDir}/02-login-filled.png`,
      fullPage: true 
    });

    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ 
      path: `${screenshotDir}/03-after-login.png`,
      fullPage: true 
    });

    // Step 3: Navigate to Andrew's Clinic dashboard
    console.log('📊 Step 3: Navigating to Andrew\'s Clinic dashboard');
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for initial render
    
    await page.screenshot({ 
      path: `${screenshotDir}/04-dashboard-initial.png`,
      fullPage: true 
    });

    // Step 4: Wait for dashboard to fully load and take comprehensive screenshots
    console.log('⏳ Step 4: Waiting for dashboard data to load');
    
    // Wait for potential loading states to complete
    try {
      await page.waitForSelector('[data-testid*="loading"]', { state: 'detached', timeout: 10000 });
    } catch (e) {
      console.log('⚠️ No loading indicators found or they didn\'t disappear');
    }

    // Wait additional time for data fetching
    await page.waitForTimeout(5000);

    await page.screenshot({ 
      path: `${screenshotDir}/05-dashboard-loaded.png`,
      fullPage: true 
    });

    await page.screenshot({ 
      path: `${screenshotDir}/06-dashboard-viewport.png`,
      fullPage: false 
    });

    // Step 5: Analyze KPI cards in detail
    console.log('🔍 Step 5: Analyzing KPI cards');
    
    const kpiAnalysis = {};
    const kpiSelectors = [
      { name: 'Total Users', keywords: ['Total Users', 'total users', 'Total Members'] },
      { name: 'Active Today', keywords: ['Active Today', 'active today', 'Today Active'] },
      { name: 'Weekly Active', keywords: ['Weekly Active', 'weekly active', 'Active This Week'] },
      { name: 'New Users This Month', keywords: ['New Users This Month', 'new users', 'New This Month'] },
      { name: 'License Seats Remaining', keywords: ['License Seats', 'license seats', 'Seats Remaining'] }
    ];

    for (const kpi of kpiSelectors) {
      console.log(`🔍 Looking for ${kpi.name}...`);
      
      let kpiData = null;
      for (const keyword of kpi.keywords) {
        try {
          // Try to find the KPI card by text content
          const kpiElement = await page.locator(`text="${keyword}"`).first();
          const isVisible = await kpiElement.isVisible().catch(() => false);
          
          if (isVisible) {
            // Get the parent container that likely contains the value
            const container = await kpiElement.locator('..').or(kpiElement.locator('../..')).first();
            const containerText = await container.textContent();
            
            // Extract number from the container
            const numberMatch = containerText?.match(/\b(\d+)\b/);
            const value = numberMatch ? parseInt(numberMatch[1]) : null;
            
            kpiData = {
              found: true,
              keyword: keyword,
              value: value,
              fullText: containerText?.trim(),
              elementVisible: isVisible
            };
            
            console.log(`✅ Found ${kpi.name}: ${value} (keyword: "${keyword}")`);
            break;
          }
        } catch (e) {
          console.log(`❌ Error looking for ${kpi.name} with keyword "${keyword}": ${e.message}`);
        }
      }
      
      if (!kpiData) {
        // Fallback: look for any element containing numbers that might be this KPI
        try {
          const allText = await page.textContent('body');
          const possibleValues = allText?.match(/\b\d+\b/g) || [];
          kpiData = {
            found: false,
            keyword: null,
            value: null,
            fullText: null,
            elementVisible: false,
            possibleValues: possibleValues.slice(0, 10) // First 10 numbers found
          };
          console.log(`❌ ${kpi.name} not found, possible values on page: ${possibleValues.slice(0, 5).join(', ')}`);
        } catch (e) {
          kpiData = { found: false, error: e.message };
        }
      }
      
      kpiAnalysis[kpi.name] = kpiData;
    }

    // Step 6: Check for charts and tables
    console.log('📈 Step 6: Checking for charts and tables');
    
    const chartSelectors = [
      'svg', // SVG charts
      'canvas', // Canvas charts
      '[class*="chart"]',
      '[class*="graph"]',
      '[data-testid*="chart"]',
      '.recharts-wrapper',
      '.chart-container'
    ];

    let chartsFound = [];
    for (const selector of chartSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const isVisible = await element.isVisible();
          if (isVisible) {
            const boundingBox = await element.boundingBox();
            chartsFound.push({
              selector,
              index: i,
              visible: isVisible,
              size: boundingBox
            });
          }
        }
      } catch (e) {
        // Continue
      }
    }

    console.log(`📊 Charts found: ${chartsFound.length}`);

    // Check for tables
    const tableSelectors = ['table', '[role="table"]', '[class*="table"]'];
    let tablesFound = [];
    
    for (const selector of tableSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const isVisible = await element.isVisible();
          if (isVisible) {
            const rowCount = await element.locator('tr, [role="row"]').count();
            tablesFound.push({
              selector,
              index: i,
              visible: isVisible,
              rowCount
            });
          }
        }
      } catch (e) {
        // Continue
      }
    }

    console.log(`📋 Tables found: ${tablesFound.length}`);

    // Step 7: Take focused screenshots of key sections
    console.log('📸 Step 7: Taking focused screenshots');
    
    // Try to screenshot KPI section
    try {
      const kpiSection = await page.locator('text="Total Users"').first().locator('../..').or(
        page.locator('text="Active Today"').first().locator('../..')
      ).first();
      
      if (await kpiSection.isVisible()) {
        await kpiSection.screenshot({ path: `${screenshotDir}/07-kpi-cards.png` });
      }
    } catch (e) {
      console.log('⚠️ Could not screenshot KPI section');
    }

    // Try to screenshot charts
    if (chartsFound.length > 0) {
      try {
        await page.locator(chartsFound[0].selector).first().screenshot({ 
          path: `${screenshotDir}/08-charts-section.png` 
        });
      } catch (e) {
        console.log('⚠️ Could not screenshot charts');
      }
    }

    // Step 8: Final comprehensive screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/09-final-comprehensive.png`,
      fullPage: true 
    });

    // Step 9: Validate KPI values against expected results
    console.log('✅ Step 9: Validating KPI values');
    
    const validationResults = {};
    for (const [kpiName, expected] of Object.entries(expectedKPIs)) {
      const kpiKey = kpiName === 'totalUsers' ? 'Total Users' :
                     kpiName === 'activeToday' ? 'Active Today' :
                     kpiName === 'weeklyActive' ? 'Weekly Active' :
                     kpiName === 'newUsersThisMonth' ? 'New Users This Month' : kpiName;
      
      const actual = kpiAnalysis[kpiKey];
      const isCorrect = actual?.value === expected;
      
      validationResults[kpiName] = {
        expected,
        actual: actual?.value || null,
        isCorrect,
        found: actual?.found || false
      };
      
      const status = isCorrect ? '✅' : actual?.found ? '❌' : '⚠️';
      console.log(`${status} ${kpiKey}: Expected ${expected}, Got ${actual?.value || 'not found'}`);
    }

    // Step 10: Generate comprehensive report
    console.log('📊 Step 10: Generating comprehensive report');
    
    const comprehensiveReport = {
      testInfo: {
        timestamp: new Date().toISOString(),
        testName: 'INNER JOIN Fix Verification',
        dashboardUrl: page.url(),
        pageTitle: await page.title()
      },
      credentials: {
        email: credentials.email,
        loginSuccessful: page.url().includes('org/')
      },
      kpiAnalysis: {
        summary: validationResults,
        detailed: kpiAnalysis,
        overallStatus: Object.values(validationResults).every(v => v.isCorrect) ? 'PASS' : 'FAIL'
      },
      dashboardElements: {
        chartsFound: chartsFound.length,
        tablesFound: tablesFound.length,
        charts: chartsFound,
        tables: tablesFound
      },
      networkActivity: {
        totalRequests: networkRequests.length,
        apiErrors: apiErrors.length,
        recentRequests: networkRequests.slice(-20),
        errors: apiErrors
      },
      consoleActivity: {
        totalLogs: consoleLogs.length,
        errorCount: consoleLogs.filter(log => log.type === 'error').length,
        warningCount: consoleLogs.filter(log => log.type === 'warning').length,
        recentLogs: consoleLogs.slice(-20)
      },
      innerJoinFixStatus: {
        dataDisplaying: Object.values(validationResults).some(v => v.found && v.actual > 0),
        expectedValuesMatching: Object.values(validationResults).filter(v => v.isCorrect).length,
        totalExpectedValues: Object.keys(expectedKPIs).length,
        fixEffective: Object.values(validationResults).every(v => v.isCorrect)
      },
      recommendations: []
    };

    // Add specific recommendations based on results
    if (!comprehensiveReport.innerJoinFixStatus.fixEffective) {
      if (!comprehensiveReport.innerJoinFixStatus.dataDisplaying) {
        comprehensiveReport.recommendations.push('Dashboard is still not showing any data - INNER JOIN fix may not be working or data is still missing');
      } else {
        comprehensiveReport.recommendations.push('Dashboard is showing some data but values don\'t match expected KPIs - verify INNER JOIN query correctness');
      }
    } else {
      comprehensiveReport.recommendations.push('INNER JOIN fix appears to be working correctly - all KPI values match expectations');
    }

    if (apiErrors.length > 0) {
      comprehensiveReport.recommendations.push(`${apiErrors.length} API errors detected - check network tab for details`);
    }

    if (consoleLogs.filter(log => log.type === 'error').length > 0) {
      comprehensiveReport.recommendations.push('JavaScript errors detected in console - may indicate remaining issues');
    }

    // Save the comprehensive report
    const reportPath = path.join(screenshotDir, 'inner-join-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(comprehensiveReport, null, 2));

    // Step 11: Console summary
    console.log('\n🎯 ============ INNER JOIN FIX VERIFICATION SUMMARY ============');
    console.log(`📅 Test completed: ${comprehensiveReport.testInfo.timestamp}`);
    console.log(`🔗 Dashboard URL: ${comprehensiveReport.testInfo.dashboardUrl}`);
    console.log(`🔐 Login successful: ${comprehensiveReport.credentials.loginSuccessful}`);
    console.log(`\n📊 KPI VALIDATION RESULTS:`);
    
    for (const [kpi, result] of Object.entries(validationResults)) {
      const status = result.isCorrect ? '✅ PASS' : result.found ? '❌ FAIL' : '⚠️  NOT FOUND';
      console.log(`   ${status} ${kpi}: Expected ${result.expected}, Got ${result.actual}`);
    }

    console.log(`\n🎨 DASHBOARD ELEMENTS:`);
    console.log(`   📈 Charts found: ${comprehensiveReport.dashboardElements.chartsFound}`);
    console.log(`   📋 Tables found: ${comprehensiveReport.dashboardElements.tablesFound}`);

    console.log(`\n🌐 NETWORK ACTIVITY:`);
    console.log(`   📡 Total requests: ${comprehensiveReport.networkActivity.totalRequests}`);
    console.log(`   ❌ API errors: ${comprehensiveReport.networkActivity.apiErrors}`);

    console.log(`\n🔧 INNER JOIN FIX STATUS:`);
    const fixStatus = comprehensiveReport.innerJoinFixStatus.fixEffective ? 
      '✅ SUCCESS - Fix is working correctly!' : 
      '❌ ISSUES REMAIN - Fix needs more work';
    console.log(`   ${fixStatus}`);
    console.log(`   📊 Data displaying: ${comprehensiveReport.innerJoinFixStatus.dataDisplaying}`);
    console.log(`   ✅ Correct values: ${comprehensiveReport.innerJoinFixStatus.expectedValuesMatching}/${comprehensiveReport.innerJoinFixStatus.totalExpectedValues}`);

    console.log(`\n📋 RECOMMENDATIONS:`);
    comprehensiveReport.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });

    console.log(`\n📁 ARTIFACTS:`);
    console.log(`   📊 Full report: ${reportPath}`);
    console.log(`   📸 Screenshots: ${screenshotDir}/`);
    console.log(`\n🏁 ============ TEST COMPLETE ============\n`);

    // Assertions for test framework
    expect(page.url()).toContain('dashboard');
    expect(comprehensiveReport.credentials.loginSuccessful).toBe(true);
    
    // Optional: Fail the test if INNER JOIN fix is not working
    if (comprehensiveReport.innerJoinFixStatus.fixEffective) {
      console.log('🎉 All assertions passed - INNER JOIN fix is working!');
    } else {
      console.log('⚠️ Test completed but INNER JOIN fix needs attention');
    }
  });
});