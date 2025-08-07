import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface KPIData {
  totalUsers: number;
  activeToday: number;
  weeklyActive: number;
  newUsersThisMonth: number;
  inactiveUsersThisWeek: number;
  licenseSeatRemaining: number;
}

interface APIResponse {
  success: boolean;
  seniors: any[];
  count: number;
}

test.describe('Dashboard Data Verification', () => {
  const orgId = 'bf579a76-e9c5-45be-8659-7e62664883c4';
  const baseURL = 'http://localhost:3000';
  const dashboardURL = `${baseURL}/org/${orgId}/dashboard`;
  
  // Store results for comparison
  let dashboardKPIs: Partial<KPIData> = {};
  let apiData: any = null;
  let screenshotPaths: string[] = [];

  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(process.cwd(), 'test-results', 'dashboard-verification');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Step 1: Navigate to dashboard and take initial screenshot', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(dashboardURL);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    const screenshotPath = path.join('test-results', 'dashboard-verification', '01-dashboard-initial.png');
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    screenshotPaths.push(screenshotPath);
    
    // Check if we need to login
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('Login required - attempting to login...');
      
      // Fill login form (you may need to update these credentials)
      await page.fill('input[type="email"]', 'admin@andrewclinic.com');
      await page.fill('input[type="password"]', 'admin123');
      
      // Take screenshot before login
      const loginScreenshotPath = path.join('test-results', 'dashboard-verification', '00-login-page.png');
      await page.screenshot({ 
        path: loginScreenshotPath, 
        fullPage: true 
      });
      screenshotPaths.push(loginScreenshotPath);
      
      // Submit login
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      
      // Take screenshot after login
      const postLoginScreenshotPath = path.join('test-results', 'dashboard-verification', '01-post-login-dashboard.png');
      await page.screenshot({ 
        path: postLoginScreenshotPath, 
        fullPage: true 
      });
      screenshotPaths.push(postLoginScreenshotPath);
    }
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(new RegExp(`.*${orgId}/dashboard`));
    
    console.log(`✅ Successfully navigated to dashboard: ${dashboardURL}`);
  });

  test('Step 2: Wait for dashboard data to load and take comprehensive screenshot', async ({ page }) => {
    await page.goto(dashboardURL);
    await page.waitForLoadState('networkidle');
    
    // Wait for KPI cards to load (look for specific KPI values)
    await page.waitForSelector('[data-testid="kpi-card"], .text-xl.font-bold', { timeout: 15000 });
    
    // Wait a bit more for any dynamic content
    await page.waitForTimeout(3000);
    
    // Take comprehensive dashboard screenshot
    const fullScreenshotPath = path.join('test-results', 'dashboard-verification', '02-dashboard-loaded.png');
    await page.screenshot({ 
      path: fullScreenshotPath, 
      fullPage: true 
    });
    screenshotPaths.push(fullScreenshotPath);
    
    // Take viewport screenshot for better KPI visibility
    const viewportScreenshotPath = path.join('test-results', 'dashboard-verification', '03-dashboard-viewport.png');
    await page.screenshot({ 
      path: viewportScreenshotPath, 
      fullPage: false 
    });
    screenshotPaths.push(viewportScreenshotPath);
    
    console.log('✅ Dashboard loaded and screenshots captured');
  });

  test('Step 3: Extract KPI values from dashboard', async ({ page }) => {
    await page.goto(dashboardURL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.text-xl.font-bold', { timeout: 15000 });
    
    // Extract KPI card values
    const kpiCards = await page.locator('.text-xl.font-bold').allTextContents();
    const kpiTitles = await page.locator('.text-sm.font-medium.text-\\[\\#555\\]').allTextContents();
    
    console.log('KPI Titles found:', kpiTitles);
    console.log('KPI Values found:', kpiCards);
    
    // Map titles to values
    for (let i = 0; i < kpiTitles.length && i < kpiCards.length; i++) {
      const title = kpiTitles[i];
      const value = parseInt(kpiCards[i]) || 0;
      
      switch (title) {
        case 'Total Users':
          dashboardKPIs.totalUsers = value;
          break;
        case 'Active Today':
          dashboardKPIs.activeToday = value;
          break;
        case 'Weekly Active':
          dashboardKPIs.weeklyActive = value;
          break;
        case 'New Users (This Month)':
          dashboardKPIs.newUsersThisMonth = value;
          break;
        case 'Inactive Users (This Week)':
          dashboardKPIs.inactiveUsersThisWeek = value;
          break;
        case 'License Seats Remaining':
          dashboardKPIs.licenseSeatRemaining = value;
          break;
      }
    }
    
    // Take screenshot highlighting KPI section
    const kpiScreenshotPath = path.join('test-results', 'dashboard-verification', '04-kpi-cards.png');
    await page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6.mb-8').screenshot({ 
      path: kpiScreenshotPath 
    });
    screenshotPaths.push(kpiScreenshotPath);
    
    console.log('📊 Dashboard KPIs extracted:', dashboardKPIs);
  });

  test('Step 4: Make API call to get actual seniors data', async ({ request }) => {
    // Make API call to seniors endpoint
    const apiResponse = await request.get(`${baseURL}/api/seniors?org_id=${orgId}`);
    
    expect(apiResponse.ok()).toBeTruthy();
    
    const responseData: APIResponse = await apiResponse.json();
    apiData = responseData;
    
    console.log('🔌 API Response received:');
    console.log(`- Success: ${responseData.success}`);
    console.log(`- Total seniors count: ${responseData.count}`);
    console.log(`- Seniors data length: ${responseData.seniors?.length || 0}`);
    
    // Log individual senior details
    if (responseData.seniors && responseData.seniors.length > 0) {
      console.log('👥 Senior users found:');
      responseData.seniors.forEach((senior, index) => {
        console.log(`  ${index + 1}. ${senior.name} (ID: ${senior.id})`);
        console.log(`     - Gender: ${senior.gender_enum}`);
        console.log(`     - Birth: ${senior.birth}`);
        console.log(`     - Created: ${senior.created_at}`);
      });
    }
    
    expect(responseData.success).toBe(true);
    expect(responseData.seniors).toBeDefined();
  });

  test('Step 5: Compare dashboard data with API data', async ({ page }) => {
    // Take final screenshot for comparison
    await page.goto(dashboardURL);
    await page.waitForLoadState('networkidle');
    
    const finalScreenshotPath = path.join('test-results', 'dashboard-verification', '05-final-comparison.png');
    await page.screenshot({ 
      path: finalScreenshotPath, 
      fullPage: true 
    });
    screenshotPaths.push(finalScreenshotPath);
    
    // Perform data comparison
    console.log('\n🔍 DATA COMPARISON ANALYSIS:');
    console.log('='.repeat(50));
    
    // Total Users comparison
    const apiTotalUsers = apiData?.count || 0;
    const dashboardTotalUsers = dashboardKPIs.totalUsers || 0;
    
    console.log(`📊 Total Users:`);
    console.log(`   Dashboard: ${dashboardTotalUsers}`);
    console.log(`   API: ${apiTotalUsers}`);
    console.log(`   Match: ${dashboardTotalUsers === apiTotalUsers ? '✅' : '❌'}`);
    
    // Expected users check
    const expectedUsers = ['김영희', '박철수', '정할머니'];
    const actualUserNames = apiData?.seniors?.map((s: any) => s.name) || [];
    
    console.log(`\n👥 Expected Users Check:`);
    expectedUsers.forEach(expectedName => {
      const found = actualUserNames.includes(expectedName);
      console.log(`   ${expectedName}: ${found ? '✅ Found' : '❌ Missing'}`);
    });
    
    console.log(`\n📋 All Registered Users:`);
    actualUserNames.forEach((name: string, index: number) => {
      console.log(`   ${index + 1}. ${name}`);
    });
    
    // Create comprehensive comparison report
    const comparisonReport = {
      timestamp: new Date().toISOString(),
      dashboardURL,
      orgId,
      screenshotPaths,
      dashboardKPIs,
      apiData: {
        totalCount: apiData?.count || 0,
        usersFound: actualUserNames,
        success: apiData?.success || false
      },
      expectedUsers,
      comparison: {
        totalUsersMatch: dashboardTotalUsers === apiTotalUsers,
        expectedUsersFound: expectedUsers.filter(name => actualUserNames.includes(name)),
        unexpectedUsers: actualUserNames.filter((name: string) => !expectedUsers.includes(name))
      },
      verification: {
        dashboardAccessible: true,
        apiResponding: apiData?.success || false,
        dataConsistency: dashboardTotalUsers === apiTotalUsers,
        expectedUsersPresent: expectedUsers.every(name => actualUserNames.includes(name))
      }
    };
    
    // Save comparison report
    const reportPath = path.join('test-results', 'dashboard-verification', 'comparison-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(comparisonReport, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n🎯 VERIFICATION SUMMARY:');
    console.log(`   Dashboard accessible: ${comparisonReport.verification.dashboardAccessible ? '✅' : '❌'}`);
    console.log(`   API responding: ${comparisonReport.verification.apiResponding ? '✅' : '❌'}`);
    console.log(`   Data consistency: ${comparisonReport.verification.dataConsistency ? '✅' : '❌'}`);
    console.log(`   Expected users present: ${comparisonReport.verification.expectedUsersPresent ? '✅' : '❌'}`);
    
    // Add assertions for the test
    expect(apiTotalUsers).toBeGreaterThan(0);
    expect(dashboardTotalUsers).toBe(apiTotalUsers);
    
    // Check for expected users
    expectedUsers.forEach(expectedName => {
      expect(actualUserNames).toContain(expectedName);
    });
  });

  test.afterAll(async () => {
    console.log('\n📸 Screenshots captured:');
    screenshotPaths.forEach((path, index) => {
      console.log(`   ${index + 1}. ${path}`);
    });
  });
});