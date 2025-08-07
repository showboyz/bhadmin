import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Dashboard Data Refresh Test', () => {
  const orgId = 'bf579a76-e9c5-45be-8659-7e62664883c4';
  const baseURL = 'http://localhost:3000';
  const dashboardURL = `${baseURL}/org/${orgId}/dashboard`;
  
  let consoleLogs: any[] = [];
  let screenshotPaths: string[] = [];

  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(process.cwd(), 'test-results', 'dashboard-refresh-test');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Dashboard Data Refresh Investigation', async ({ page }) => {
    // Set up console log capturing
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    console.log('🚀 Starting Dashboard Refresh Test');
    console.log(`📍 Dashboard URL: ${dashboardURL}`);

    // Step 1: Navigate to dashboard
    await page.goto(dashboardURL);
    await page.waitForLoadState('networkidle');

    // Check if login is required
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('🔐 Login required - attempting to login...');
      
      await page.fill('input[type="email"]', 'admin@andrewclinic.com');
      await page.fill('input[type="password"]', 'admin123');
      
      // Take screenshot before login
      const loginScreenshotPath = path.join('test-results', 'dashboard-refresh-test', '01-login-page.png');
      await page.screenshot({ path: loginScreenshotPath, fullPage: true });
      screenshotPaths.push(loginScreenshotPath);
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    }

    // Step 2: Wait for dashboard to load and capture initial state
    await page.waitForSelector('.text-xl.font-bold', { timeout: 15000 });
    await page.waitForTimeout(3000); // Wait for dynamic content

    // Take initial screenshot
    const initialScreenshotPath = path.join('test-results', 'dashboard-refresh-test', '02-dashboard-initial.png');
    await page.screenshot({ path: initialScreenshotPath, fullPage: true });
    screenshotPaths.push(initialScreenshotPath);

    // Step 3: Extract initial Total Users value
    const kpiTitles = await page.locator('.text-sm.font-medium.text-\\[\\#555\\]').allTextContents();
    const kpiValues = await page.locator('.text-xl.font-bold').allTextContents();
    
    let initialTotalUsers = 0;
    for (let i = 0; i < kpiTitles.length && i < kpiValues.length; i++) {
      if (kpiTitles[i] === 'Total Users') {
        initialTotalUsers = parseInt(kpiValues[i]) || 0;
        break;
      }
    }

    console.log(`📊 Initial Total Users: ${initialTotalUsers}`);

    // Step 4: Check API data for comparison
    const apiResponse = await page.request.get(`${baseURL}/api/seniors?org_id=${orgId}`);
    const apiData = await apiResponse.json();
    const apiTotalUsers = apiData.count || 0;
    
    console.log(`🔌 API Total Users: ${apiTotalUsers}`);
    console.log(`📊 Dashboard vs API: ${initialTotalUsers} vs ${apiTotalUsers}`);

    // Step 5: Browser refresh (F5)
    console.log('🔄 Performing browser refresh (F5)...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.text-xl.font-bold', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Take screenshot after browser refresh
    const afterRefreshScreenshotPath = path.join('test-results', 'dashboard-refresh-test', '03-after-browser-refresh.png');
    await page.screenshot({ path: afterRefreshScreenshotPath, fullPage: true });
    screenshotPaths.push(afterRefreshScreenshotPath);

    // Extract Total Users value after browser refresh
    const afterRefreshTitles = await page.locator('.text-sm.font-medium.text-\\[\\#555\\]').allTextContents();
    const afterRefreshValues = await page.locator('.text-xl.font-bold').allTextContents();
    
    let afterRefreshTotalUsers = 0;
    for (let i = 0; i < afterRefreshTitles.length && i < afterRefreshValues.length; i++) {
      if (afterRefreshTitles[i] === 'Total Users') {
        afterRefreshTotalUsers = parseInt(afterRefreshValues[i]) || 0;
        break;
      }
    }

    console.log(`📊 After Browser Refresh - Total Users: ${afterRefreshTotalUsers}`);

    // Step 6: Try the Refresh button if values still don't match
    if (afterRefreshTotalUsers !== apiTotalUsers) {
      console.log('🔄 Browser refresh didn\'t update data. Trying Refresh button...');
      
      // Look for the refresh button
      const refreshButton = page.locator('button:has-text("Refresh")');
      const refreshButtonExists = await refreshButton.isVisible();
      
      if (refreshButtonExists) {
        await refreshButton.click();
        console.log('✅ Clicked Refresh button');
        
        // Wait for data to potentially update
        await page.waitForTimeout(5000);
        
        // Take screenshot after refresh button click
        const afterRefreshButtonScreenshotPath = path.join('test-results', 'dashboard-refresh-test', '04-after-refresh-button.png');
        await page.screenshot({ path: afterRefreshButtonScreenshotPath, fullPage: true });
        screenshotPaths.push(afterRefreshButtonScreenshotPath);

        // Extract Total Users value after refresh button
        const afterButtonTitles = await page.locator('.text-sm.font-medium.text-\\[\\#555\\]').allTextContents();
        const afterButtonValues = await page.locator('.text-xl.font-bold').allTextContents();
        
        let afterButtonTotalUsers = 0;
        for (let i = 0; i < afterButtonTitles.length && i < afterButtonValues.length; i++) {
          if (afterButtonTitles[i] === 'Total Users') {
            afterButtonTotalUsers = parseInt(afterButtonValues[i]) || 0;
            break;
          }
        }

        console.log(`📊 After Refresh Button - Total Users: ${afterButtonTotalUsers}`);
      } else {
        console.log('❌ Refresh button not found');
      }
    }

    // Step 7: Open browser developer tools and capture console logs
    console.log('🛠️ Opening developer tools to check console...');
    
    // Open dev tools (F12)
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);

    // Take screenshot with dev tools open
    const devToolsScreenshotPath = path.join('test-results', 'dashboard-refresh-test', '05-with-dev-tools.png');
    await page.screenshot({ path: devToolsScreenshotPath, fullPage: true });
    screenshotPaths.push(devToolsScreenshotPath);

    // Wait a bit more to see if any console messages appear
    await page.waitForTimeout(3000);

    // Step 8: Force another data refresh to see console logs
    console.log('🔄 Forcing another refresh to capture console logs...');
    const refreshButton = page.locator('button:has-text("Refresh")');
    const refreshButtonExists = await refreshButton.isVisible();
    
    if (refreshButtonExists) {
      await refreshButton.click();
      await page.waitForTimeout(5000);
    }

    // Final screenshot
    const finalScreenshotPath = path.join('test-results', 'dashboard-refresh-test', '06-final-state.png');
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    screenshotPaths.push(finalScreenshotPath);

    // Extract final Total Users value
    const finalTitles = await page.locator('.text-sm.font-medium.text-\\[\\#555\\]').allTextContents();
    const finalValues = await page.locator('.text-xl.font-bold').allTextContents();
    
    let finalTotalUsers = 0;
    for (let i = 0; i < finalTitles.length && i < finalValues.length; i++) {
      if (finalTitles[i] === 'Total Users') {
        finalTotalUsers = parseInt(finalValues[i]) || 0;
        break;
      }
    }

    // Analyze console logs for dashboard hook messages
    const dashboardLogs = consoleLogs.filter(log => 
      log.text.includes('Dashboard') || 
      log.text.includes('🔍') || 
      log.text.includes('seniors') ||
      log.text.includes('useDashboard') ||
      log.text.includes('fetch')
    );

    console.log('\n🔍 DASHBOARD REFRESH TEST RESULTS:');
    console.log('='.repeat(60));
    console.log(`📊 Initial Total Users: ${initialTotalUsers}`);
    console.log(`🔄 After Browser Refresh: ${afterRefreshTotalUsers}`);
    console.log(`📊 Final Total Users: ${finalTotalUsers}`);
    console.log(`🔌 API Total Users: ${apiTotalUsers}`);
    console.log(`✅ Data Consistency: ${finalTotalUsers === apiTotalUsers ? 'CONSISTENT' : 'INCONSISTENT'}`);
    
    console.log('\n📝 Dashboard Hook Console Logs:');
    if (dashboardLogs.length > 0) {
      dashboardLogs.forEach(log => {
        console.log(`   [${log.type.toUpperCase()}] ${log.text}`);
      });
    } else {
      console.log('   ❌ No dashboard hook console logs found');
    }

    console.log('\n📝 All Console Logs:');
    consoleLogs.forEach(log => {
      console.log(`   [${log.type.toUpperCase()}] ${log.text}`);
    });

    // Create detailed test report
    const testReport = {
      timestamp: new Date().toISOString(),
      testDescription: 'Dashboard Data Refresh Investigation',
      dashboardURL,
      orgId,
      results: {
        initialTotalUsers,
        afterBrowserRefresh: afterRefreshTotalUsers,
        finalTotalUsers,
        apiTotalUsers,
        dataConsistent: finalTotalUsers === apiTotalUsers
      },
      refreshActions: [
        'Browser refresh (F5)',
        'Refresh button click'
      ],
      consoleLogs: dashboardLogs,
      allConsoleLogs: consoleLogs,
      screenshotPaths,
      analysis: {
        expectedBehavior: 'Dashboard should show 10 users to match API',
        actualBehavior: `Dashboard shows ${finalTotalUsers} users`,
        possibleCauses: [
          'Caching issue in browser or Supabase client',
          'State management issue in React hooks',
          'Race condition in data fetching',
          'RLS (Row Level Security) policy filtering data',
          'Database connection or query issues'
        ],
        recommendations: [
          'Check dashboard hook console logs for fetch operations',
          'Verify Supabase client configuration',
          'Check if org_id filter is working correctly',
          'Investigate RLS policies on seniors table',
          'Add more detailed logging to use-dashboard.ts hook'
        ]
      }
    };

    // Save test report
    const reportPath = path.join('test-results', 'dashboard-refresh-test', 'refresh-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

    console.log(`\n📄 Detailed test report saved to: ${reportPath}`);
    console.log('\n📸 Screenshots saved:');
    screenshotPaths.forEach((path, index) => {
      console.log(`   ${index + 1}. ${path}`);
    });

    // Assertions
    expect(apiTotalUsers).toBeGreaterThan(0);
    // Note: We don't assert data consistency here since we're investigating the issue
    // expect(finalTotalUsers).toBe(apiTotalUsers);
    
    console.log('\n🎯 Test completed! Check the report and screenshots for detailed analysis.');
  });

  test.afterAll(async () => {
    console.log('\n📋 SUMMARY:');
    console.log('This test investigated dashboard data refresh behavior');
    console.log('Check the generated report and screenshots for detailed findings');
    console.log('Focus on console logs from the dashboard hook (use-dashboard.ts)');
  });
});