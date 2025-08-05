import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Quick Dashboard Status Check', () => {
  test('Quick assessment of dashboard state after auth improvements', async ({ page }) => {
    // Shorter timeout for this focused test
    test.setTimeout(60000);
    
    // Create screenshots directory
    const screenshotDir = path.join(__dirname, '..', 'test-screenshots', 'quick-status');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const loginUrl = 'http://localhost:3001/login';
    const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard';
    const credentials = {
      email: 'andrew@youngandx.com',
      password: 'RX3XJEemQAfw'
    };

    // Monitoring arrays
    const apiRequests = [];
    const consoleLogs = [];
    const authLogs = [];

    console.log('🚀 Quick Dashboard Status Check Started');

    // Monitor API requests
    page.on('request', req => {
      if (req.url().includes('supabase') || req.url().includes('/rest/v1/')) {
        apiRequests.push({
          method: req.method(),
          url: req.url(),
          timestamp: new Date().toISOString()
        });
        console.log(`📡 ${req.method()} ${req.url()}`);
      }
    });

    // Monitor responses
    page.on('response', async response => {
      if (response.url().includes('/rest/v1/seniors')) {
        try {
          if (response.ok()) {
            const data = await response.json();
            console.log(`📊 Seniors API response: ${Array.isArray(data) ? data.length : 'Invalid'} records`);
          } else {
            console.log(`❌ Seniors API error: ${response.status()}`);
          }
        } catch (e) {
          console.log(`⚠️ Error parsing seniors response: ${e.message}`);
        }
      }
    });

    // Monitor console logs
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      
      consoleLogs.push(logEntry);
      
      // Track auth-related logs
      if (msg.text().includes('auth') || msg.text().includes('role') || msg.text().includes('access')) {
        authLogs.push(logEntry);
        console.log(`[AUTH] ${msg.text()}`);
      }
      
      if (msg.type() === 'error') {
        console.log(`[ERROR] ${msg.text()}`);
      }
    });

    // LOGIN
    console.log('\n🔐 LOGGING IN...');
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', credentials.email);
    await page.fill('input[type="password"], input[name="password"]', credentials.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('✅ Login completed');

    // NAVIGATE TO DASHBOARD
    console.log('\n📊 NAVIGATING TO DASHBOARD...');
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
    
    // Wait 10 seconds to see initial state
    await page.waitForTimeout(10000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/dashboard-10s.png`,
      fullPage: true 
    });

    // Check current state
    const dashboardState = await page.evaluate(() => {
      // Look for KPI values
      const getTextContent = (selectors) => {
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent?.trim();
            if (text && text !== '0' && /\\d+/.test(text)) {
              return text;
            }
          }
        }
        return null;
      };

      // Extract all visible numbers that might be KPIs
      const allText = document.body.innerText;
      const numbers = allText.match(/\\b\\d+\\b/g) || [];
      const uniqueNumbers = [...new Set(numbers)].filter(n => n !== '0');

      // Look for specific KPI patterns
      const kpiSelectors = [
        '[data-testid*="total"], [data-testid*="users"]',
        '[data-testid*="active"]',
        '.metric-value, .kpi-value, .stat-value',
        'h1, h2, h3, .text-2xl, .text-3xl, .text-4xl'
      ];

      const totalUsersText = getTextContent(kpiSelectors);
      
      return {
        url: window.location.href,
        pageTitle: document.title,
        allNumbers: uniqueNumbers,
        kpisFound: uniqueNumbers.length > 0,
        hasCharts: document.querySelectorAll('canvas, svg').length > 0,
        hasTables: document.querySelectorAll('table').length > 0,
        hasLoadingSpinners: document.querySelectorAll('[data-testid*="loading"], .loading, .spinner').length > 0,
        visibleText: allText.substring(0, 1000)
      };
    });

    console.log(`📊 Dashboard state after 10s: KPIs found: ${dashboardState.kipsFound}, Charts: ${dashboardState.hasCharts}, Loading: ${dashboardState.hasLoadingSpinners}`);

    // Wait another 10 seconds to see if data loads
    console.log('\n⏳ WAITING ADDITIONAL 10 SECONDS...');
    await page.waitForTimeout(10000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/dashboard-20s.png`,
      fullPage: true 
    });

    // Final state check
    const finalState = await page.evaluate(() => {
      const allText = document.body.innerText;
      const kpiCards = document.querySelectorAll('[data-testid*="kpi"], .kpi-card, .metric-card, .stat-card');
      
      // Extract numbers from text
      const extractNumbers = (text) => {
        const matches = text.match(/\\d+/g);
        return matches ? matches.map(n => parseInt(n, 10)) : [];
      };
      
      // Look for KPI values in the page text
      const lines = allText.split('\\n').filter(line => line.trim());
      const kpiData = {};
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.includes('Total Users') || trimmed.includes('total users')) {
          const numbers = extractNumbers(trimmed);
          if (numbers.length > 0) kpiData.totalUsers = Math.max(...numbers);
        }
        if (trimmed.includes('Active Today') || trimmed.includes('active today')) {
          const numbers = extractNumbers(trimmed);
          if (numbers.length > 0) kpiData.activeToday = Math.max(...numbers);
        }
        if (trimmed.includes('Weekly Active') || trimmed.includes('weekly active')) {
          const numbers = extractNumbers(trimmed);
          if (numbers.length > 0) kpiData.weeklyActive = Math.max(...numbers);
        }
      });
      
      return {
        kpiData,
        hasRealData: Object.values(kpiData).some(val => val > 0),
        kpiCardsCount: kpiCards.length,
        hasLoadingSpinners: document.querySelectorAll('[data-testid*="loading"], .loading, .spinner').length > 0,
        pageContent: allText.substring(0, 2000)
      };
    });

    // Generate quick report
    const quickReport = {
      timestamp: new Date().toISOString(),
      testDuration: '20 seconds',
      
      results: {
        dashboardLoads: !dashboardState.hasLoadingSpinners,
        kpiCardsVisible: finalState.kpiCardsCount > 0,
        hasRealData: finalState.hasRealData,
        kpiData: finalState.kpiData,
        
        apiRequests: apiRequests.length,
        seniorsApiCalls: apiRequests.filter(req => req.url.includes('seniors')).length,
        authLogs: authLogs.length,
        consoleErrors: consoleLogs.filter(log => log.type === 'error').length,
        
        finalUrl: dashboardState.url,
        hasCharts: dashboardState.hasCharts,
        hasTables: dashboardState.hasTables
      },
      
      // Expected vs Actual
      expectedData: {
        totalUsers: 40,
        activeToday: 3,
        weeklyActive: 3
      },
      
      verdict: {
        authContextFixed: !authLogs.some(log => log.text.includes('waiting... (attempt')),
        dataLoading: finalState.hasRealData,
        dashboardFunctional: !dashboardState.hasLoadingSpinners && finalState.kpiCardsCount > 0,
        kpiMatches: {
          totalUsers: finalState.kpiData.totalUsers === 40,
          activeToday: finalState.kpiData.activeToday === 3,
          weeklyActive: (finalState.kpiData.weeklyActive || 0) >= 3
        }
      }
    };

    // Save report
    const reportPath = path.join(screenshotDir, 'quick-status-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(quickReport, null, 2));

    // Save raw logs
    const logsPath = path.join(screenshotDir, 'logs.json');
    fs.writeFileSync(logsPath, JSON.stringify({
      consoleLogs: consoleLogs.slice(-20),
      authLogs: authLogs,
      apiRequests: apiRequests
    }, null, 2));

    // SUMMARY REPORT
    console.log('\\n🎯 ============ QUICK STATUS SUMMARY ============');
    console.log(`📅 Test completed: ${quickReport.timestamp}`);
    console.log(`🔗 Final URL: ${quickReport.results.finalUrl}`);
    
    console.log(`\\n📊 DASHBOARD STATUS:`);
    console.log(`   ✅ Dashboard loads (no spinner): ${quickReport.results.dashboardLoads}`);
    console.log(`   📊 KPI cards visible: ${quickReport.results.kpiCardsVisible} (${quickReport.results.kpiCardsVisible ? quickReport.results.kpiCardsCount : 0} cards)`);
    console.log(`   💾 Has real data: ${quickReport.results.hasRealData}`);
    console.log(`   📈 Has charts: ${quickReport.results.hasCharts}`);
    console.log(`   📋 Has tables: ${quickReport.results.hasTables}`);
    
    console.log(`\\n📈 KPI VALUES:`);
    console.log(`   👥 Total Users: ${quickReport.results.kpiData.totalUsers || 0} (expected: 40) ${quickReport.verdict.kpiMatches.totalUsers ? '✅' : '❌'}`);
    console.log(`   🟢 Active Today: ${quickReport.results.kpiData.activeToday || 0} (expected: 3) ${quickReport.verdict.kpiMatches.activeToday ? '✅' : '❌'}`);
    console.log(`   📅 Weekly Active: ${quickReport.results.kpiData.weeklyActive || 0} (expected: ≥3) ${quickReport.verdict.kpiMatches.weeklyActive ? '✅' : '❌'}`);
    
    console.log(`\\n🌐 NETWORK ACTIVITY:`);
    console.log(`   📡 Total API requests: ${quickReport.results.apiRequests}`);
    console.log(`   👥 Seniors API calls: ${quickReport.results.seniorsApiCalls}`);
    console.log(`   🔐 Auth logs: ${quickReport.results.authLogs}`);
    console.log(`   ❌ Console errors: ${quickReport.results.consoleErrors}`);
    
    console.log(`\\n🎯 FINAL VERDICT:`);
    console.log(`   🔐 Auth context fixed: ${quickReport.verdict.authContextFixed}`);
    console.log(`   💾 Data loading: ${quickReport.verdict.dataLoading}`);
    console.log(`   📊 Dashboard functional: ${quickReport.verdict.dashboardFunctional}`);
    
    if (quickReport.verdict.authContextFixed && quickReport.verdict.dataLoading) {
      console.log(`\\n🟢 SUCCESS: Authentication context improvements working! Dashboard loads with real data.`);
    } else if (quickReport.verdict.dashboardFunctional && !quickReport.verdict.dataLoading) {
      console.log(`\\n🟡 PARTIAL: Dashboard loads but auth context still preventing data loading.`);
    } else {
      console.log(`\\n🔴 ISSUE: Dashboard has remaining problems - see report for details.`);
    }
    
    console.log(`\\n📁 Reports saved to: ${screenshotDir}/`);
    console.log(`🏁 ============ QUICK TEST COMPLETE ============\\n`);

    // Simple assertions
    expect(quickReport.results.dashboardLoads).toBe(true);
    expect(quickReport.results.kpiCardsVisible).toBe(true);
  });
});