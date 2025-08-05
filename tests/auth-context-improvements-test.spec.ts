import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Andrew\'s Clinic Dashboard - Authentication Context Improvements Test', () => {
  test('Comprehensive dashboard test after auth context improvements', async ({ page }) => {
    // Create screenshots directory
    const screenshotDir = path.join(__dirname, '..', 'test-screenshots', 'auth-context-improvements');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    // Test configuration
    const loginUrl = 'http://localhost:3001/login';
    const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard';
    const credentials = {
      email: 'andrew@youngandx.com',
      password: 'RX3XJEemQAfw'
    };

    // Expected data from backend
    const expectedData = {
      totalUsers: 40,
      activeToday: 3,
      weeklyActiveMinimum: 3,
      orgId: 'bf579a76-e9c5-45be-8659-7e62664883c4'
    };

    // Monitoring arrays
    const networkRequests = [];
    const supabaseRequests = [];
    const consoleLogs = [];
    const apiErrors = [];
    const authContextLogs = [];

    console.log('🚀 Starting Authentication Context Improvements Test');
    console.log('🎯 Testing dashboard loading, KPI data, and auth context fixes');

    // Enhanced network monitoring with focus on API calls
    page.on('request', req => {
      const requestInfo = {
        url: req.url(),
        method: req.method(),
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(Object.entries(req.headers()).filter(([key]) => 
          ['authorization', 'apikey', 'content-type'].includes(key.toLowerCase())
        ))
      };
      
      networkRequests.push(requestInfo);
      
      // Track Supabase requests specifically
      if (req.url().includes('supabase') || req.url().includes('/rest/v1/')) {
        supabaseRequests.push(requestInfo);
        console.log(`📡 API Request: ${req.method()} ${req.url()}`);
      }
    });

    page.on('response', async response => {
      // Focus on Supabase API responses
      if (response.url().includes('supabase') || response.url().includes('/rest/v1/')) {
        try {
          const responseInfo = {
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            timestamp: new Date().toISOString()
          };

          // Capture response data for analysis
          const contentType = response.headers()['content-type'];
          if (contentType?.includes('application/json')) {
            const bodyText = await response.text();
            try {
              const data = JSON.parse(bodyText);
              responseInfo.data = data;
              
              // Log important data requests
              if (response.url().includes('seniors')) {
                console.log(`📊 Seniors data: ${Array.isArray(data) ? data.length : 'Invalid'} records`);
              }
            } catch (e) {
              responseInfo.bodyText = bodyText.substring(0, 500);
            }
          }
          
          supabaseRequests.push({
            type: 'response',
            ...responseInfo
          });
          
          console.log(`📊 API Response: ${response.status()} ${response.url()}`);
          
          if (!response.ok()) {
            apiErrors.push(responseInfo);
            console.log(`❌ API Error: ${response.status()} ${response.url()}`);
          }
        } catch (e) {
          console.log(`⚠️ Error processing API response: ${e.message}`);
        }
      }
    });

    // Enhanced console monitoring with focus on auth context
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
        location: msg.location()
      };
      
      consoleLogs.push(logEntry);
      
      // Track auth context specific messages
      const authContextKeywords = ['auth context', 'role', 'access', 'org_admin', 'permissions'];
      const isAuthContext = authContextKeywords.some(keyword => 
        msg.text().toLowerCase().includes(keyword)
      );
      
      if (isAuthContext) {
        authContextLogs.push(logEntry);
        console.log(`[AUTH CONTEXT] ${msg.text()}`);
      }
      
      // Log errors and important messages
      if (msg.type() === 'error' || msg.text().includes('dashboard') || msg.text().includes('loading')) {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    // PHASE 1: Login
    console.log('\n📋 PHASE 1: LOGIN PROCESS');
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/01-login-page.png`,
      fullPage: true 
    });

    // Fill and submit login form
    await page.fill('input[type="email"], input[name="email"]', credentials.email);
    await page.fill('input[type="password"], input[name="password"]', credentials.password);
    
    await page.screenshot({ 
      path: `${screenshotDir}/02-credentials-filled.png`,
      fullPage: true 
    });

    // Clear logs to focus on login flow
    consoleLogs.length = 0;
    supabaseRequests.length = 0;
    
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/03-after-login.png`,
      fullPage: true 
    });

    console.log(`✅ Login completed. API requests: ${supabaseRequests.length}`);

    // PHASE 2: Dashboard Navigation and Loading
    console.log('\n📊 PHASE 2: DASHBOARD NAVIGATION AND LOADING');
    
    // Store login requests for analysis
    const loginRequests = [...supabaseRequests];
    
    // Clear logs to focus on dashboard loading
    consoleLogs.length = 0;
    supabaseRequests.length = 0;
    authContextLogs.length = 0;
    
    // Navigate to dashboard
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/04-dashboard-initial.png`,
      fullPage: true 
    });

    // Wait for dashboard to load completely (up to 30 seconds as specified)
    console.log('⏳ Waiting for dashboard to load completely (up to 30 seconds)...');
    
    let dashboardFullyLoaded = false;
    let waitAttempts = 0;
    const maxWaitAttempts = 6; // 30 seconds in 5-second intervals
    
    while (!dashboardFullyLoaded && waitAttempts < maxWaitAttempts) {
      await page.waitForTimeout(5000);
      waitAttempts++;
      
      // Check if loading spinner is gone and KPI cards are visible
      const loadingState = await page.evaluate(() => {
        // Check for loading indicators
        const loadingSpinners = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
        const hasLoadingSpinners = loadingSpinners.length > 0;
        
        // Check for KPI cards with actual data
        const kpiCards = document.querySelectorAll('[data-testid*="kpi"], .kpi-card, .metric-card');
        const kpiCardsVisible = kpiCards.length > 0;
        
        // Check for dashboard content
        const dashboardContent = document.querySelector('[data-testid="dashboard"], .dashboard, main');
        const hasDashboardContent = !!dashboardContent;
        
        return {
          hasLoadingSpinners,
          kpiCardsVisible,
          kpiCardsCount: kpiCards.length,
          hasDashboardContent,
          currentUrl: window.location.href
        };
      });
      
      console.log(`⏳ Wait attempt ${waitAttempts}/${maxWaitAttempts}: Loading spinners: ${loadingState.hasLoadingSpinners}, KPI cards: ${loadingState.kpiCardsCount}`);
      
      if (!loadingState.hasLoadingSpinners && loadingState.kpiCardsVisible) {
        dashboardFullyLoaded = true;
        console.log('✅ Dashboard appears to be fully loaded');
      }
      
      // Take progress screenshot
      await page.screenshot({ 
        path: `${screenshotDir}/05-dashboard-wait-${waitAttempts}.png`,
        fullPage: true 
      });
    }

    // PHASE 3: KPI Data Verification
    console.log('\n🔍 PHASE 3: KPI DATA VERIFICATION');
    
    // Extract KPI data from the dashboard
    const kpiData = await page.evaluate(() => {
      const extractNumber = (text) => {
        if (!text) return 0;
        const matches = text.match(/(\d+)/);
        return matches ? parseInt(matches[1], 10) : 0;
      };
      
      const kpiCards = {};
      
      // Try multiple selectors to find KPI cards
      const selectors = [
        '[data-testid*="total-users"], [data-testid*="total_users"]',
        '[data-testid*="active-today"], [data-testid*="active_today"]',
        '[data-testid*="weekly-active"], [data-testid*="weekly_active"]',
        '[data-testid*="kpi"]',
        '.kpi-card',
        '.metric-card',
        '.stat-card'
      ];
      
      // Look for text patterns that might indicate KPI values
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(line => line.trim());
      
      // Try to find patterns like "Total Users: 40" or similar
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('Total Users') || trimmedLine.includes('total users')) {
          kpiCards.totalUsers = extractNumber(trimmedLine);
        }
        if (trimmedLine.includes('Active Today') || trimmedLine.includes('active today')) {
          kpiCards.activeToday = extractNumber(trimmedLine);
        }
        if (trimmedLine.includes('Weekly Active') || trimmedLine.includes('weekly active')) {
          kpiCards.weeklyActive = extractNumber(trimmedLine);
        }
      });
      
      // Also try to find specific elements
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element, index) => {
            const text = element.textContent || element.innerText || '';
            const key = `${selector.replace(/[\[\]"'.,\s]/g, '_')}_${index}`;
            kpiCards[key] = {
              text: text.trim(),
              number: extractNumber(text)
            };
          });
        } catch (e) {
          // Selector might not be valid, skip
        }
      });
      
      return {
        kpiCards,
        allVisibleText: allText.substring(0, 2000), // First 2000 chars for debugging
        url: window.location.href
      };
    });

    console.log('📊 KPI Data extracted:');
    console.log(`   Total Users: ${kpiData.kpiCards.totalUsers || 'Not found'}`);
    console.log(`   Active Today: ${kpiData.kpiCards.activeToday || 'Not found'}`);
    console.log(`   Weekly Active: ${kpiData.kpiCards.weeklyActive || 'Not found'}`);

    // PHASE 4: Charts and Tables Verification
    console.log('\n📈 PHASE 4: CHARTS AND TABLES VERIFICATION');
    
    const chartsAndTables = await page.evaluate(() => {
      const charts = document.querySelectorAll('canvas, svg, .chart, [data-testid*="chart"]');
      const tables = document.querySelectorAll('table, .table, [data-testid*="table"]');
      
      return {
        chartsCount: charts.length,
        tablesCount: tables.length,
        hasVisualData: charts.length > 0 || tables.length > 0
      };
    });

    console.log(`📈 Found ${chartsAndTables.chartsCount} charts and ${chartsAndTables.tablesCount} tables`);

    // PHASE 5: Network Analysis
    console.log('\n🌐 PHASE 5: NETWORK ANALYSIS');
    
    const seniorsRequests = supabaseRequests.filter(req => 
      req.url.includes('seniors') || req.url.includes('/rest/v1/seniors')
    );
    
    const successfulDataRequests = supabaseRequests.filter(req => 
      req.type === 'response' && req.status === 200 && 
      (req.url.includes('seniors') || req.url.includes('motor_results') || req.url.includes('cognitive_results'))
    );

    console.log(`🔗 Total API requests: ${supabaseRequests.length}`);
    console.log(`👥 Seniors API requests: ${seniorsRequests.length}`);
    console.log(`✅ Successful data requests: ${successfulDataRequests.length}`);
    console.log(`❌ API errors: ${apiErrors.length}`);

    // PHASE 6: Authentication Context Analysis
    console.log('\n🔐 PHASE 6: AUTHENTICATION CONTEXT ANALYSIS');
    
    const authState = await page.evaluate(() => {
      try {
        const authToken = localStorage.getItem('sb-fgmcvnlvlsbnpyblmhsz-auth-token');
        let userInfo = null;
        
        if (authToken) {
          try {
            const parsed = JSON.parse(authToken);
            userInfo = {
              hasAccessToken: !!parsed.access_token,
              hasUser: !!parsed.user,
              userEmail: parsed.user?.email,
              userRole: parsed.user?.role
            };
          } catch (e) {
            userInfo = { parseError: e.message };
          }
        }
        
        return {
          hasAuthToken: !!authToken,
          userInfo: userInfo,
          currentUrl: window.location.href,
          isOnDashboard: window.location.href.includes('dashboard')
        };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log(`🔐 Has auth token: ${authState.hasAuthToken}`);
    console.log(`👤 User email: ${authState.userInfo?.userEmail || 'Not found'}`);
    console.log(`🎯 On dashboard: ${authState.isOnDashboard}`);

    // Final comprehensive screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/06-final-dashboard-state.png`,
      fullPage: true 
    });

    // PHASE 7: Generate Test Report
    console.log('\n📊 PHASE 7: GENERATING TEST REPORT');

    const testReport = {
      timestamp: new Date().toISOString(),
      testName: 'Authentication Context Improvements Test',
      
      dashboardLoadingStatus: {
        fullyLoaded: dashboardFullyLoaded,
        waitAttempts: waitAttempts,
        maxWaitReached: waitAttempts >= maxWaitAttempts,
        finalUrl: page.url()
      },
      
      kpiVerification: {
        totalUsers: {
          expected: expectedData.totalUsers,
          actual: kpiData.kpiCards.totalUsers,
          matches: kpiData.kpiCards.totalUsers === expectedData.totalUsers,
          found: !!kpiData.kpiCards.totalUsers
        },
        activeToday: {
          expected: expectedData.activeToday,
          actual: kpiData.kpiCards.activeToday,
          matches: kpiData.kpiCards.activeToday === expectedData.activeToday,
          found: !!kpiData.kpiCards.activeToday
        },
        weeklyActive: {
          expected: `> ${expectedData.weeklyActiveMinimum}`,
          actual: kpiData.kpiCards.weeklyActive,
          meetsMinimum: (kpiData.kpiCards.weeklyActive || 0) > expectedData.weeklyActiveMinimum,
          found: !!kpiData.kpiCards.weeklyActive
        }
      },
      
      dataVisualization: {
        hasCharts: chartsAndTables.chartsCount > 0,
        hasTable: chartsAndTables.tablesCount > 0,
        chartsCount: chartsAndTables.chartsCount,
        tablesCount: chartsAndTables.tablesCount
      },
      
      networkAnalysis: {
        totalRequests: networkRequests.length,
        apiRequests: supabaseRequests.length,
        seniorsRequests: seniorsRequests.length,
        successfulDataRequests: successfulDataRequests.length,
        apiErrors: apiErrors.length,
        seniorsApiWorking: seniorsRequests.length > 0 && apiErrors.length === 0
      },
      
      authenticationContext: {
        loginSuccessful: authState.isOnDashboard,
        hasValidToken: authState.hasAuthToken,
        userIdentified: !!authState.userInfo?.userEmail,
        correctUser: authState.userInfo?.userEmail === credentials.email,
        authContextLogs: authContextLogs.length,
        noAuthLoops: !consoleLogs.some(log => log.text.includes('waiting...') && log.text.includes('roles'))
      },
      
      consoleAnalysis: {
        totalLogs: consoleLogs.length,
        errorLogs: consoleLogs.filter(log => log.type === 'error').length,
        authContextLogs: authContextLogs.length,
        hasAuthContextErrors: authContextLogs.some(log => log.type === 'error')
      },
      
      overallAssessment: {
        dashboardLoads: dashboardFullyLoaded,
        kpisPopulated: !!(kpiData.kpiCards.totalUsers || kpiData.kpiCards.activeToday),
        dataRequestsSucceed: successfulDataRequests.length > 0,
        noInfiniteSpinner: dashboardFullyLoaded,
        authContextFixed: authState.hasAuthToken && authState.isOnDashboard && !authContextLogs.some(log => log.type === 'error')
      }
    };

    // Save detailed report
    const reportPath = path.join(screenshotDir, 'auth-context-improvements-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

    // Save raw data for debugging
    const debugDataPath = path.join(screenshotDir, 'debug-data.json');
    fs.writeFileSync(debugDataPath, JSON.stringify({
      kpiData: kpiData,
      authState: authState,
      consoleLogs: consoleLogs.slice(-30),
      supabaseRequests: supabaseRequests,
      authContextLogs: authContextLogs
    }, null, 2));

    // FINAL SUMMARY REPORT
    console.log('\n🎯 ============ AUTHENTICATION CONTEXT IMPROVEMENTS TEST SUMMARY ============');
    console.log(`📅 Test completed: ${testReport.timestamp}`);
    console.log(`🔗 Final URL: ${testReport.dashboardLoadingStatus.finalUrl}`);
    
    console.log(`\n📊 DASHBOARD LOADING:`);
    console.log(`   ✅ Dashboard fully loaded: ${testReport.dashboardLoadingStatus.fullyLoaded}`);
    console.log(`   ⏱️  Wait attempts used: ${testReport.dashboardLoadingStatus.waitAttempts}/${maxWaitAttempts}`);
    console.log(`   🚫 No infinite spinner: ${testReport.overallAssessment.noInfiniteSpinner}`);
    
    console.log(`\n📈 KPI DATA VERIFICATION:`);
    console.log(`   👥 Total Users: ${testReport.kpiVerification.totalUsers.actual} (expected: ${testReport.kpiVerification.totalUsers.expected}) ✅${testReport.kpiVerification.totalUsers.matches ? ' MATCH' : ' NO MATCH'}`);
    console.log(`   🟢 Active Today: ${testReport.kpiVerification.activeToday.actual} (expected: ${testReport.kpiVerification.activeToday.expected}) ✅${testReport.kpiVerification.activeToday.matches ? ' MATCH' : ' NO MATCH'}`);
    console.log(`   📅 Weekly Active: ${testReport.kpiVerification.weeklyActive.actual} (expected: ${testReport.kpiVerification.weeklyActive.expected}) ✅${testReport.kpiVerification.weeklyActive.meetsMinimum ? ' MEETS MINIMUM' : ' BELOW MINIMUM'}`);
    
    console.log(`\n📊 DATA VISUALIZATION:`);
    console.log(`   📈 Charts found: ${testReport.dataVisualization.chartsCount}`);
    console.log(`   📋 Tables found: ${testReport.dataVisualization.tablesCount}`);
    console.log(`   📊 Has visual data: ${testReport.dataVisualization.hasCharts || testReport.dataVisualization.hasTable}`);
    
    console.log(`\n🌐 NETWORK ANALYSIS:`);
    console.log(`   🔗 Total requests: ${testReport.networkAnalysis.totalRequests}`);
    console.log(`   📡 API requests: ${testReport.networkAnalysis.apiRequests}`);
    console.log(`   👥 Seniors API calls: ${testReport.networkAnalysis.seniorsRequests}`);
    console.log(`   ✅ Successful data requests: ${testReport.networkAnalysis.successfulDataRequests}`);
    console.log(`   ❌ API errors: ${testReport.networkAnalysis.apiErrors}`);
    console.log(`   🎯 Seniors API working: ${testReport.networkAnalysis.seniorsApiWorking}`);
    
    console.log(`\n🔐 AUTHENTICATION CONTEXT:`);
    console.log(`   🔑 Login successful: ${testReport.authenticationContext.loginSuccessful}`);
    console.log(`   🎫 Valid auth token: ${testReport.authenticationContext.hasValidToken}`);
    console.log(`   👤 User identified: ${testReport.authenticationContext.userIdentified}`);
    console.log(`   ✅ Correct user: ${testReport.authenticationContext.correctUser}`);
    console.log(`   🔄 No auth loops: ${testReport.authenticationContext.noAuthLoops}`);
    console.log(`   📋 Auth context logs: ${testReport.authenticationContext.authContextLogs}`);
    
    console.log(`\n🎯 OVERALL ASSESSMENT:`);
    console.log(`   ✅ Dashboard loads: ${testReport.overallAssessment.dashboardLoads}`);
    console.log(`   📊 KPIs populated: ${testReport.overallAssessment.kpisPopulated}`);
    console.log(`   🔗 Data requests succeed: ${testReport.overallAssessment.dataRequestsSucceed}`);
    console.log(`   🚫 No infinite spinner: ${testReport.overallAssessment.noInfiniteSpinner}`);
    console.log(`   🔐 Auth context fixed: ${testReport.overallAssessment.authContextFixed}`);
    
    console.log(`\n📁 ARTIFACTS GENERATED:`);
    console.log(`   📊 Test report: ${reportPath}`);
    console.log(`   🐛 Debug data: ${debugDataPath}`);
    console.log(`   📸 Screenshots: ${screenshotDir}/`);
    
    // FINAL VERDICT
    console.log(`\n🏁 ============ FINAL VERDICT ============`);
    
    if (testReport.overallAssessment.authContextFixed && testReport.overallAssessment.dashboardLoads && testReport.overallAssessment.kpisPopulated) {
      console.log('🟢 SUCCESS: Authentication context improvements are working! Dashboard loads with real data.');
    } else if (testReport.overallAssessment.dashboardLoads && !testReport.overallAssessment.kipsPopulated) {
      console.log('🟡 PARTIAL: Dashboard loads but KPI data is missing - check data queries.');
    } else if (!testReport.overallAssessment.dashboardLoads) {
      console.log('🔴 FAILED: Dashboard not loading properly - authentication context issues persist.');
    } else {
      console.log('🟠 MIXED RESULTS: Some improvements visible but issues remain.');
    }
    
    console.log(`🏁 ============ TEST COMPLETE ============\n`);

    // Playwright test assertions
    expect(testReport.authenticationContext.loginSuccessful).toBe(true);
    expect(testReport.dashboardLoadingStatus.fullyLoaded).toBe(true);
    expect(testReport.networkAnalysis.apiErrors).toBe(0);
  });
});