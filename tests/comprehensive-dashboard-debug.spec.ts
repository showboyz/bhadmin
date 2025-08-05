import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Comprehensive Dashboard Debug - Authentication & Data Analysis', () => {
  test('Deep debug of authentication and data flow issues', async ({ page }) => {
    // Create screenshots directory
    const screenshotDir = path.join(__dirname, '..', 'test-screenshots', 'comprehensive-debug');
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

    // Track all network requests for analysis
    const networkRequests = [];
    const supabaseRequests = [];
    const consoleLogs = [];
    const apiErrors = [];

    // Set up comprehensive monitoring
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
        console.log(`📡 Supabase Request: ${req.method()} ${req.url()}`);
      }
    });

    page.on('response', async response => {
      const responseInfo = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      };
      
      // Track Supabase responses specifically
      if (response.url().includes('supabase') || response.url().includes('/rest/v1/')) {
        try {
          const contentType = response.headers()['content-type'];
          let body = null;
          
          if (contentType?.includes('application/json')) {
            body = await response.text();
            // Try to parse JSON for better analysis
            try {
              const parsed = JSON.parse(body);
              responseInfo.data = parsed;
            } catch (e) {
              responseInfo.bodyText = body.substring(0, 500);
            }
          }
          
          supabaseRequests.push({
            type: 'response',
            ...responseInfo
          });
          
          console.log(`📊 Supabase Response: ${response.status()} ${response.url()}`);
          
          if (!response.ok()) {
            apiErrors.push({
              ...responseInfo,
              body: body?.substring(0, 1000)
            });
            console.log(`❌ Supabase Error: ${response.status()} ${response.url()}`);
          }
        } catch (e) {
          console.log(`⚠️ Error processing Supabase response: ${e.message}`);
        }
      }
    });

    // Set up console monitoring with enhanced filtering
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
        location: msg.location()
      };
      
      consoleLogs.push(logEntry);
      
      // Log important authentication and dashboard messages
      const importantKeywords = ['auth', 'role', 'access', 'dashboard', 'org', 'supabase', 'error', 'loading'];
      const isImportant = importantKeywords.some(keyword => 
        msg.text().toLowerCase().includes(keyword)
      );
      
      if (isImportant || msg.type() === 'error') {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    console.log('🚀 Starting Comprehensive Dashboard Debug Analysis');
    console.log('🎯 Focus: Authentication flow, user roles, and data retrieval');

    // Phase 1: Login Process Analysis
    console.log('\n📋 PHASE 1: LOGIN PROCESS ANALYSIS');
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/01-login-page.png`,
      fullPage: true 
    });

    // Monitor login submission
    console.log('🔐 Submitting login credentials...');
    await page.fill('input[type="email"], input[name="email"]', credentials.email);
    await page.fill('input[type="password"], input[name="password"]', credentials.password);
    
    await page.screenshot({ 
      path: `${screenshotDir}/02-credentials-filled.png`,
      fullPage: true 
    });

    // Clear previous logs to focus on login flow
    consoleLogs.length = 0;
    supabaseRequests.length = 0;
    
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: `${screenshotDir}/03-after-login.png`,
      fullPage: true 
    });

    console.log(`✅ Login phase completed. Supabase requests: ${supabaseRequests.length}`);

    // Phase 2: Navigation to Dashboard and Authorization Analysis
    console.log('\n📊 PHASE 2: DASHBOARD NAVIGATION & AUTHORIZATION');
    
    // Clear logs to focus on dashboard loading
    const loginSupabaseRequests = [...supabaseRequests];
    const loginConsoleLogs = [...consoleLogs];
    
    consoleLogs.length = 0;
    supabaseRequests.length = 0;
    
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Give extra time for auth checks
    
    await page.screenshot({ 
      path: `${screenshotDir}/04-dashboard-initial.png`,
      fullPage: true 
    });

    // Wait longer to see if roles eventually load
    console.log('⏳ Waiting for potential role loading (15 seconds)...');
    await page.waitForTimeout(15000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/05-dashboard-after-wait.png`,
      fullPage: true 
    });

    console.log(`📊 Dashboard phase completed. Supabase requests: ${supabaseRequests.length}`);

    // Phase 3: JavaScript Console State Analysis
    console.log('\n🔍 PHASE 3: JAVASCRIPT STATE ANALYSIS');
    
    // Inject JavaScript to examine the application state
    const authState = await page.evaluate(() => {
      try {
        // Try to access various auth-related data from the window object
        const result = {
          localStorage: {},
          sessionStorage: {},
          cookies: document.cookie,
          currentUrl: window.location.href,
          userAgent: navigator.userAgent,
          supabaseClient: null,
          authState: null,
          reactState: null
        };

        // Get localStorage data
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          try {
            const value = localStorage.getItem(key);
            result.localStorage[key] = value?.length > 200 ? value.substring(0, 200) + '...' : value;
          } catch (e) {
            result.localStorage[key] = `Error: ${e.message}`;
          }
        }

        // Get sessionStorage data
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          try {
            const value = sessionStorage.getItem(key);
            result.sessionStorage[key] = value?.length > 200 ? value.substring(0, 200) + '...' : value;
          } catch (e) {
            result.sessionStorage[key] = `Error: ${e.message}`;
          }
        }

        // Try to access Supabase client from window if exposed
        if (window.supabase) {
          result.supabaseClient = 'Found on window';
        }

        // Try to get React DevTools state if available
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          result.reactState = 'React DevTools detected';
        }

        return result;
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('💾 Browser state analysis completed');

    // Phase 4: Network Analysis and API Call Pattern Examination
    console.log('\n🌐 PHASE 4: NETWORK ANALYSIS');
    
    // Analyze Supabase request patterns
    const authRequests = supabaseRequests.filter(req => 
      req.url.includes('auth') || req.url.includes('session')
    );
    
    const roleRequests = supabaseRequests.filter(req => 
      req.url.includes('user_roles') || req.url.includes('roles')
    );
    
    const organizationRequests = supabaseRequests.filter(req => 
      req.url.includes('organisations')
    );
    
    const dataRequests = supabaseRequests.filter(req => 
      req.url.includes('seniors') || req.url.includes('motor_results') || req.url.includes('cognitive_results')
    );

    console.log(`🔐 Auth requests: ${authRequests.length}`);
    console.log(`👤 Role requests: ${roleRequests.length}`);
    console.log(`🏢 Organization requests: ${organizationRequests.length}`);
    console.log(`📊 Data requests: ${dataRequests.length}`);

    // Phase 5: Manual API Testing via Browser Console
    console.log('\n🧪 PHASE 5: MANUAL API TESTING');
    
    const apiTestResults = await page.evaluate(async () => {
      try {
        // Get the Supabase URL and key from the page if available
        const results = {
          supabaseTest: null,
          userTest: null,
          roleTest: null,
          orgTest: null,
          dataTest: null
        };

        // Try to access the Supabase client from the global scope or imports
        // This is a simplified test - in a real app, we'd need to import properly
        
        // Check if we can access localStorage auth data
        const authData = localStorage.getItem('sb-fgmcvnlvlsbnpyblmhsz-auth-token');
        if (authData) {
          results.authData = 'Found in localStorage';
          try {
            const parsed = JSON.parse(authData);
            results.accessToken = parsed.access_token ? 'Present' : 'Missing';
            results.userFromToken = parsed.user ? 'Present' : 'Missing';
          } catch (e) {
            results.authParseError = e.message;
          }
        } else {
          results.authData = 'Not found in localStorage';
        }

        return results;
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('🧪 API testing completed');

    // Phase 6: Generate Comprehensive Analysis Report
    console.log('\n📊 PHASE 6: GENERATING COMPREHENSIVE REPORT');

    const comprehensiveReport = {
      testInfo: {
        timestamp: new Date().toISOString(),
        testName: 'Comprehensive Dashboard Debug',
        dashboardUrl: page.url(),
        pageTitle: await page.title(),
        testDuration: '~45 seconds'
      },
      
      phases: {
        phase1_login: {
          successful: page.url().includes('org/'),
          supabaseRequests: loginSupabaseRequests.length,
          consoleLogs: loginConsoleLogs.length,
          authRequests: loginSupabaseRequests.filter(req => req.url.includes('auth')).length
        },
        
        phase2_dashboard: {
          loaded: !page.url().includes('login'),
          stuckInAuth: consoleLogs.some(log => log.text.includes('no roles loaded yet')),
          supabaseRequests: supabaseRequests.length,
          authLoopDetected: consoleLogs.filter(log => log.text.includes('waiting...')).length > 5
        }
      },

      authenticationAnalysis: {
        loginAttempted: true,
        loginSuccessful: page.url().includes('org/'),
        authLoopCount: consoleLogs.filter(log => log.text.includes('waiting...')).length,
        rolesLoadingIssue: consoleLogs.some(log => log.text.includes('rolesCount: 0')),
        maxRetriesReached: consoleLogs.some(log => log.text.includes('Max retries reached'))
      },

      networkAnalysis: {
        totalRequests: networkRequests.length,
        supabaseRequests: supabaseRequests.length,
        authRequests: authRequests.length,
        roleRequests: roleRequests.length,
        organizationRequests: organizationRequests.length,
        dataRequests: dataRequests.length,
        apiErrors: apiErrors.length,
        
        requestBreakdown: {
          login: loginSupabaseRequests.length,
          dashboard: supabaseRequests.length
        }
      },

      browserStateAnalysis: {
        localStorage: authState.localStorage,
        hasAuthToken: !!authState.localStorage['sb-fgmcvnlvlsbnpyblmhsz-auth-token'],
        currentUrl: authState.currentUrl,
        cookies: authState.cookies
      },

      consoleAnalysis: {
        totalLogs: consoleLogs.length,
        errorCount: consoleLogs.filter(log => log.type === 'error').length,
        authRelatedLogs: consoleLogs.filter(log => 
          log.text.toLowerCase().includes('auth') || 
          log.text.toLowerCase().includes('role') ||
          log.text.toLowerCase().includes('access')
        ).length,
        criticalMessages: consoleLogs
          .filter(log => 
            log.text.includes('no roles loaded') ||
            log.text.includes('Max retries') ||
            log.text.includes('Access denied') ||
            log.type === 'error'
          )
          .map(log => ({
            type: log.type,
            text: log.text.substring(0, 200),
            timestamp: log.timestamp
          }))
      },

      problemDiagnosis: {
        primaryIssue: null,
        secondaryIssues: [],
        likelihoodAssessment: {},
        recommendedActions: []
      }
    };

    // Diagnostic logic
    if (comprehensiveReport.authenticationAnalysis.authLoopCount > 5) {
      comprehensiveReport.problemDiagnosis.primaryIssue = 'Authentication loop - user roles not loading';
      comprehensiveReport.problemDiagnosis.likelihoodAssessment.roleLoadingIssue = 'HIGH';
      
      comprehensiveReport.problemDiagnosis.recommendedActions.push(
        'Check user_roles table for andrew@youngandx.com',
        'Verify RLS policies on user_roles table',
        'Check Supabase auth configuration',
        'Examine auth context implementation'
      );
    }

    if (comprehensiveReport.networkAnalysis.roleRequests === 0) {
      comprehensiveReport.problemDiagnosis.secondaryIssues.push('No role-related API requests detected');
      comprehensiveReport.problemDiagnosis.likelihoodAssessment.noRoleRequests = 'HIGH';
    }

    if (comprehensiveReport.networkAnalysis.dataRequests === 0 && comprehensiveReport.authenticationAnalysis.loginSuccessful) {
      comprehensiveReport.problemDiagnosis.secondaryIssues.push('No dashboard data requests made - likely blocked by auth');
      comprehensiveReport.problemDiagnosis.likelihoodAssessment.dataBlockedByAuth = 'HIGH';
    }

    // Assessment of INNER JOIN fix effectiveness
    if (comprehensiveReport.networkAnalysis.dataRequests > 0) {
      comprehensiveReport.problemDiagnosis.innerJoinFixStatus = 'Cannot assess - authentication blocking data requests';
    } else {
      comprehensiveReport.problemDiagnosis.innerJoinFixStatus = 'Not reached - authentication issue prevents data loading';
    }

    // Save the comprehensive report
    const reportPath = path.join(screenshotDir, 'comprehensive-debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(comprehensiveReport, null, 2));

    // Also save detailed logs for further analysis
    const logsPath = path.join(screenshotDir, 'detailed-logs.json');
    fs.writeFileSync(logsPath, JSON.stringify({
      consoleLogs: consoleLogs.slice(-50), // Last 50 console logs
      supabaseRequests: supabaseRequests,
      authState: authState,
      apiTestResults: apiTestResults
    }, null, 2));

    // Final screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/06-final-state.png`,
      fullPage: true 
    });

    // Phase 7: Console Summary Report
    console.log('\n🎯 ============ COMPREHENSIVE DEBUG SUMMARY ============');
    console.log(`📅 Analysis completed: ${comprehensiveReport.testInfo.timestamp}`);
    console.log(`🔗 Final URL: ${comprehensiveReport.testInfo.dashboardUrl}`);
    
    console.log(`\n🔐 AUTHENTICATION ANALYSIS:`);
    console.log(`   Login successful: ${comprehensiveReport.authenticationAnalysis.loginSuccessful}`);
    console.log(`   Auth loop detected: ${comprehensiveReport.authenticationAnalysis.authLoopCount > 5}`);
    console.log(`   Auth loop count: ${comprehensiveReport.authenticationAnalysis.authLoopCount}`);
    console.log(`   Roles loading issue: ${comprehensiveReport.authenticationAnalysis.rolesLoadingIssue}`);
    
    console.log(`\n🌐 NETWORK ANALYSIS:`);
    console.log(`   Total requests: ${comprehensiveReport.networkAnalysis.totalRequests}`);
    console.log(`   Supabase requests: ${comprehensiveReport.networkAnalysis.supabaseRequests}`);
    console.log(`   Auth requests: ${comprehensiveReport.networkAnalysis.authRequests}`);
    console.log(`   Role requests: ${comprehensiveReport.networkAnalysis.roleRequests}`);
    console.log(`   Data requests: ${comprehensiveReport.networkAnalysis.dataRequests}`);
    console.log(`   API errors: ${comprehensiveReport.networkAnalysis.apiErrors}`);
    
    console.log(`\n🧠 BROWSER STATE:`);
    console.log(`   Has auth token: ${comprehensiveReport.browserStateAnalysis.hasAuthToken}`);
    console.log(`   LocalStorage keys: ${Object.keys(comprehensiveReport.browserStateAnalysis.localStorage).length}`);
    
    console.log(`\n📋 CONSOLE ANALYSIS:`);
    console.log(`   Total logs: ${comprehensiveReport.consoleAnalysis.totalLogs}`);
    console.log(`   Error count: ${comprehensiveReport.consoleAnalysis.errorCount}`);
    console.log(`   Auth-related logs: ${comprehensiveReport.consoleAnalysis.authRelatedLogs}`);
    console.log(`   Critical messages: ${comprehensiveReport.consoleAnalysis.criticalMessages.length}`);
    
    console.log(`\n🔍 PROBLEM DIAGNOSIS:`);
    console.log(`   Primary issue: ${comprehensiveReport.problemDiagnosis.primaryIssue || 'To be determined'}`);
    console.log(`   Secondary issues: ${comprehensiveReport.problemDiagnosis.secondaryIssues.length}`);
    console.log(`   INNER JOIN fix status: ${comprehensiveReport.problemDiagnosis.innerJoinFixStatus}`);
    
    console.log(`\n💡 RECOMMENDED ACTIONS:`);
    comprehensiveReport.problemDiagnosis.recommendedActions.forEach((action, i) => {
      console.log(`   ${i + 1}. ${action}`);
    });
    
    console.log(`\n📁 ARTIFACTS:`);
    console.log(`   📊 Full report: ${reportPath}`);
    console.log(`   📋 Detailed logs: ${logsPath}`);
    console.log(`   📸 Screenshots: ${screenshotDir}/`);
    console.log(`\n🏁 ============ ANALYSIS COMPLETE ============\n`);

    // Test assertions
    expect(page.url()).toContain('dashboard');
    expect(comprehensiveReport.authenticationAnalysis.loginSuccessful).toBe(true);
    
    // Log final verdict
    if (comprehensiveReport.problemDiagnosis.primaryIssue?.includes('Authentication loop')) {
      console.log('🔴 VERDICT: Authentication issue preventing dashboard data loading - INNER JOIN fix cannot be evaluated');
    } else if (comprehensiveReport.networkAnalysis.dataRequests > 0) {
      console.log('🟡 VERDICT: Authentication working, can proceed to evaluate INNER JOIN fix');
    } else {
      console.log('🟠 VERDICT: Inconclusive - need to resolve authentication first');
    }
  });
});