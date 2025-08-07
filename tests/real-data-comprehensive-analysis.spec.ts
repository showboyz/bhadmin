import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface ComprehensiveReport {
  timestamp: string;
  testType: 'Real Data Comprehensive Analysis';
  demoModeStatus: 'disabled';
  login: {
    credentials: { email: string; password: string };
    success: boolean;
    redirectUrl?: string;
  };
  dashboard: {
    url: string;
    loaded: boolean;
    dataVisible: boolean;
    kpis: {
      totalUsers: { value: string | null; expected: number; matches: boolean };
      activeToday: { value: string | null; expected: number; matches: boolean };
      weeklyActive: { value: string | null; expected: number; matches: boolean };
      newUsersMonth: { value: string | null; expected: number; matches: boolean };
      inactiveUsersWeek: { value: string | null; expected: number; matches: boolean };
      licenseSeatsRemaining: { value: string | null; expected: number; matches: boolean };
    };
    genderDistribution: {
      visible: boolean;
      maleCount?: number;
      femaleCount?: number;
      totalFromChart?: number;
    };
    userTables: {
      recentActivity: { visible: boolean; userCount: number; users: string[] };
      inactiveUsers: { visible: boolean; userCount: number; users: string[] };
    };
  };
  performance: {
    loadTime: number;
    dataRenderTime: number;
  };
  realVsMockComparison: {
    status: 'showing_real_data' | 'showing_mock_data' | 'mixed' | 'unknown';
    evidence: string[];
    differences: string[];
    issues: string[];
  };
  screenshots: string[];
  errors: string[];
}

test.describe('Real Data Comprehensive Analysis', () => {
  test('Complete analysis of Andrew\'s Clinic dashboard with real data', async ({ page }) => {
    const report: ComprehensiveReport = {
      timestamp: new Date().toISOString(),
      testType: 'Real Data Comprehensive Analysis',
      demoModeStatus: 'disabled',
      login: {
        credentials: { email: 'todays777@gmail.com', password: 'your-new-password' },
        success: false
      },
      dashboard: {
        url: 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard',
        loaded: false,
        dataVisible: false,
        kpis: {
          totalUsers: { value: null, expected: 40, matches: false },
          activeToday: { value: null, expected: 0, matches: false },
          weeklyActive: { value: null, expected: 16, matches: false },
          newUsersMonth: { value: null, expected: 1, matches: false },
          inactiveUsersWeek: { value: null, expected: 24, matches: false },
          licenseSeatsRemaining: { value: null, expected: 10, matches: false }
        },
        genderDistribution: { visible: false },
        userTables: {
          recentActivity: { visible: false, userCount: 0, users: [] },
          inactiveUsers: { visible: false, userCount: 0, users: [] }
        }
      },
      performance: { loadTime: 0, dataRenderTime: 0 },
      realVsMockComparison: {
        status: 'unknown',
        evidence: [],
        differences: [],
        issues: []
      },
      screenshots: [],
      errors: []
    };

    const screenshotDir = path.join(__dirname, '../test-screenshots/comprehensive-real-data');
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    try {
      const startTime = Date.now();
      
      // Step 1: Login
      console.log('🔐 Step 1: Logging in...');
      await page.goto('http://localhost:3001/login');
      await page.waitForLoadState('networkidle');
      
      const loginScreenshot = path.join(screenshotDir, '01-login-page.png');
      await page.screenshot({ path: loginScreenshot, fullPage: true });
      report.screenshots.push(loginScreenshot);
      
      await page.fill('input[type="email"]', report.login.credentials.email);
      await page.fill('input[type="password"]', report.login.credentials.password);
      
      const filledScreenshot = path.join(screenshotDir, '02-login-filled.png');
      await page.screenshot({ path: filledScreenshot, fullPage: true });
      report.screenshots.push(filledScreenshot);
      
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const afterLoginScreenshot = path.join(screenshotDir, '03-after-login.png');
      await page.screenshot({ path: afterLoginScreenshot, fullPage: true });
      report.screenshots.push(afterLoginScreenshot);
      
      const currentUrl = page.url();
      report.login.redirectUrl = currentUrl;
      
      if (!currentUrl.includes('/login')) {
        report.login.success = true;
        console.log('✅ Login successful');
      }
      
      // Step 2: Navigate to dashboard
      console.log('📊 Step 2: Navigating to dashboard...');
      await page.goto(report.dashboard.url);
      await page.waitForLoadState('networkidle');
      
      // Wait for content to load
      await page.waitForTimeout(5000);
      
      const dashboardInitialScreenshot = path.join(screenshotDir, '04-dashboard-initial.png');
      await page.screenshot({ path: dashboardInitialScreenshot, fullPage: true });
      report.screenshots.push(dashboardInitialScreenshot);
      
      if (page.url().includes('/dashboard')) {
        report.dashboard.loaded = true;
        console.log('✅ Dashboard loaded');
      }
      
      // Step 3: Wait for data to render
      console.log('⏳ Step 3: Waiting for data to render...');
      const dataStartTime = Date.now();
      
      // Wait for KPI cards to appear
      try {
        await page.waitForSelector('.card, .bg-card', { timeout: 10000 });
        await page.waitForTimeout(3000); // Extra wait for data
        console.log('✅ KPI cards found');
      } catch (e) {
        report.errors.push('KPI cards not found within timeout');
      }
      
      const dataRenderTime = Date.now() - dataStartTime;
      report.performance.dataRenderTime = dataRenderTime;
      
      const dashboardLoadedScreenshot = path.join(screenshotDir, '05-dashboard-loaded.png');
      await page.screenshot({ path: dashboardLoadedScreenshot, fullPage: true });
      report.screenshots.push(dashboardLoadedScreenshot);
      
      // Step 4: Extract KPI values with more sophisticated parsing
      console.log('🔍 Step 4: Extracting KPI values...');
      
      // Get all text content from the page for analysis
      const pageText = await page.textContent('body');
      console.log('Page contains text:', pageText?.substring(0, 500));
      
      // Total Users
      try {
        const totalUsersCard = await page.locator('text="Total Users"').first();
        if (await totalUsersCard.isVisible()) {
          const parentCard = totalUsersCard.locator('..').first();
          const allText = await parentCard.textContent();
          console.log('Total Users card text:', allText);
          
          // Extract number from the card
          const numberMatch = allText?.match(/\\b(\\d+)\\b/);
          if (numberMatch) {
            report.dashboard.kpis.totalUsers.value = numberMatch[1];
            const numValue = parseInt(numberMatch[1]);
            report.dashboard.kpis.totalUsers.matches = numValue === report.dashboard.kpis.totalUsers.expected;
            console.log(`✅ Total Users: ${report.dashboard.kpis.totalUsers.value}`);
          }
        }
      } catch (e) {
        console.log('Error extracting Total Users:', e);
      }
      
      // Active Today
      try {
        const activeTodayCard = await page.locator('text="Active Today"').first();
        if (await activeTodayCard.isVisible()) {
          const parentCard = activeTodayCard.locator('..').first();
          const allText = await parentCard.textContent();
          console.log('Active Today card text:', allText);
          
          const numberMatch = allText?.match(/\\b(\\d+)\\b/);
          if (numberMatch) {
            report.dashboard.kpis.activeToday.value = numberMatch[1];
            const numValue = parseInt(numberMatch[1]);
            report.dashboard.kpis.activeToday.matches = numValue === report.dashboard.kpis.activeToday.expected;
            console.log(`✅ Active Today: ${report.dashboard.kpis.activeToday.value}`);
          }
        }
      } catch (e) {
        console.log('Error extracting Active Today:', e);
      }
      
      // Weekly Active
      try {
        const weeklyActiveCard = await page.locator('text="Weekly Active"').first();
        if (await weeklyActiveCard.isVisible()) {
          const parentCard = weeklyActiveCard.locator('..').first();
          const allText = await parentCard.textContent();
          console.log('Weekly Active card text:', allText);
          
          const numberMatch = allText?.match(/\\b(\\d+)\\b/);
          if (numberMatch) {
            report.dashboard.kpis.weeklyActive.value = numberMatch[1];
            const numValue = parseInt(numberMatch[1]);
            report.dashboard.kpis.weeklyActive.matches = numValue === report.dashboard.kpis.weeklyActive.expected;
            console.log(`✅ Weekly Active: ${report.dashboard.kpis.weeklyActive.value}`);
          }
        }
      } catch (e) {
        console.log('Error extracting Weekly Active:', e);
      }
      
      // License Seats Remaining
      try {
        const licenseCard = await page.locator('text="License Seats Remaining"').first();
        if (await licenseCard.isVisible()) {
          const parentCard = licenseCard.locator('..').first();
          const allText = await parentCard.textContent();
          console.log('License Seats card text:', allText);
          
          const numberMatch = allText?.match(/\\b(\\d+)\\b/);
          if (numberMatch) {
            report.dashboard.kpis.licenseSeatsRemaining.value = numberMatch[1];
            const numValue = parseInt(numberMatch[1]);
            report.dashboard.kpis.licenseSeatsRemaining.matches = numValue === report.dashboard.kpis.licenseSeatsRemaining.expected;
            console.log(`✅ License Seats Remaining: ${report.dashboard.kpis.licenseSeatsRemaining.value}`);
          }
        }
      } catch (e) {
        console.log('Error extracting License Seats:', e);
      }
      
      // New Users This Month
      try {
        const newUsersCard = await page.locator('text="New Users (This Month)"').first();
        if (await newUsersCard.isVisible()) {
          const parentCard = newUsersCard.locator('..').first();
          const allText = await parentCard.textContent();
          console.log('New Users card text:', allText);
          
          const numberMatch = allText?.match(/\\b(\\d+)\\b/);
          if (numberMatch) {
            report.dashboard.kpis.newUsersMonth.value = numberMatch[1];
            const numValue = parseInt(numberMatch[1]);
            report.dashboard.kpis.newUsersMonth.matches = numValue === report.dashboard.kpis.newUsersMonth.expected;
            console.log(`✅ New Users This Month: ${report.dashboard.kpis.newUsersMonth.value}`);
          }
        }
      } catch (e) {
        console.log('Error extracting New Users:', e);
      }
      
      // Inactive Users This Week
      try {
        const inactiveCard = await page.locator('text="Inactive Users (This Week)"').first();
        if (await inactiveCard.isVisible()) {
          const parentCard = inactiveCard.locator('..').first();
          const allText = await parentCard.textContent();
          console.log('Inactive Users card text:', allText);
          
          const numberMatch = allText?.match(/\\b(\\d+)\\b/);
          if (numberMatch) {
            report.dashboard.kpis.inactiveUsersWeek.value = numberMatch[1];
            const numValue = parseInt(numberMatch[1]);
            report.dashboard.kpis.inactiveUsersWeek.matches = numValue === report.dashboard.kpis.inactiveUsersWeek.expected;
            console.log(`✅ Inactive Users This Week: ${report.dashboard.kpis.inactiveUsersWeek.value}`);
          }
        }
      } catch (e) {
        console.log('Error extracting Inactive Users:', e);
      }
      
      // Step 5: Analyze Gender Distribution
      console.log('👥 Step 5: Analyzing gender distribution...');
      try {
        const genderChart = await page.locator('text="Gender Distribution"');
        if (await genderChart.isVisible()) {
          report.dashboard.genderDistribution.visible = true;
          console.log('✅ Gender Distribution chart found');
        }
      } catch (e) {
        console.log('Gender distribution chart not found');
      }
      
      // Step 6: Analyze User Tables
      console.log('📋 Step 6: Analyzing user tables...');
      
      // Recent User Activity
      try {
        const recentActivitySection = await page.locator('text="Recent User Activity"');
        if (await recentActivitySection.isVisible()) {
          report.dashboard.userTables.recentActivity.visible = true;
          
          // Count users in the table
          const userRows = await page.locator('table tbody tr').all();
          report.dashboard.userTables.recentActivity.userCount = userRows.length;
          
          // Get user names
          for (let i = 0; i < Math.min(userRows.length, 5); i++) {
            const nameCell = await userRows[i].locator('td').first();
            const name = await nameCell.textContent();
            if (name) {
              report.dashboard.userTables.recentActivity.users.push(name.trim());
            }
          }
          
          console.log(`✅ Recent Activity: ${report.dashboard.userTables.recentActivity.userCount} users`);
        }
      } catch (e) {
        console.log('Recent activity table not found');
      }
      
      // Inactive Users
      try {
        const inactiveSection = await page.locator('text="Inactive Users"');
        if (await inactiveSection.isVisible()) {
          report.dashboard.userTables.inactiveUsers.visible = true;
          console.log('✅ Inactive Users section found');
        }
      } catch (e) {
        console.log('Inactive users section not found');
      }
      
      // Step 7: Determine if showing real vs mock data
      console.log('🔍 Step 7: Analyzing real vs mock data status...');
      
      const totalUsersValue = parseInt(report.dashboard.kpis.totalUsers.value || '0');
      const activeUsers = parseInt(report.dashboard.kpis.activeToday.value || '0');
      const weeklyUsers = parseInt(report.dashboard.kpis.weeklyActive.value || '0');
      
      // Evidence for real data (40 users, 0 active today, 16 weekly active)
      if (totalUsersValue === 40) {
        report.realVsMockComparison.evidence.push('Total Users = 40 (matches expected real data)');
        report.realVsMockComparison.status = 'showing_real_data';
      } else if (totalUsersValue === 10) {
        report.realVsMockComparison.evidence.push('Total Users = 10 (indicates mock data)');
        report.realVsMockComparison.status = 'showing_mock_data';
        report.realVsMockComparison.issues.push('Dashboard still showing mock data instead of real Supabase data');
      } else if (totalUsersValue > 0) {
        report.realVsMockComparison.evidence.push(`Total Users = ${totalUsersValue} (unexpected value)`);
        report.realVsMockComparison.status = 'unknown';
      }
      
      if (activeUsers === 0) {
        report.realVsMockComparison.evidence.push('Active Today = 0 (matches expected real data)');
      }
      
      if (weeklyUsers === 16) {
        report.realVsMockComparison.evidence.push('Weekly Active = 16 (matches expected real data)');
      }
      
      // Check license seats calculation
      const licenseSeats = parseInt(report.dashboard.kpis.licenseSeatsRemaining.value || '0');
      if (licenseSeats === 10 && totalUsersValue === 40) {
        report.realVsMockComparison.evidence.push('License Seats = 10 (correct calculation: 50-40=10)');
      } else if (licenseSeats === 40 && totalUsersValue === 10) {
        report.realVsMockComparison.evidence.push('License Seats = 40 (mock calculation: 50-10=40)');
      }
      
      // Check for Korean names (evidence of real data)
      const koreanNamePattern = /[가-힣]/;
      const hasKoreanNames = report.dashboard.userTables.recentActivity.users.some(name => 
        koreanNamePattern.test(name)
      );
      if (hasKoreanNames) {
        report.realVsMockComparison.evidence.push('Korean names found in user list (indicates real data)');
      }
      
      const loadTime = Date.now() - startTime;
      report.performance.loadTime = loadTime;
      
      // Mark data as visible if we extracted any values
      report.dashboard.dataVisible = Object.values(report.dashboard.kpis).some(kpi => kpi.value !== null);
      
      // Final comprehensive screenshot
      const finalScreenshot = path.join(screenshotDir, '06-final-analysis.png');
      await page.screenshot({ path: finalScreenshot, fullPage: true });
      report.screenshots.push(finalScreenshot);
      
      console.log('✅ Analysis completed successfully!');
      
    } catch (error) {
      report.errors.push(`Analysis error: ${error}`);
      console.error(`Analysis error: ${error}`);
      
      const errorScreenshot = path.join(screenshotDir, '99-error.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      report.screenshots.push(errorScreenshot);
    }
    
    // Save comprehensive report
    const reportPath = path.join(screenshotDir, 'comprehensive-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print detailed summary
    console.log('\\n=== COMPREHENSIVE REAL DATA ANALYSIS ===');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Demo Mode: ${report.demoModeStatus}`);
    console.log(`Login Success: ${report.login.success}`);
    console.log(`Dashboard Loaded: ${report.dashboard.loaded}`);
    console.log(`Data Visible: ${report.dashboard.dataVisible}`);
    console.log('\\n--- KPI VALUES ---');
    console.log(`Total Users: ${report.dashboard.kpis.totalUsers.value} (expected: ${report.dashboard.kpis.totalUsers.expected}, matches: ${report.dashboard.kpis.totalUsers.matches})`);
    console.log(`Active Today: ${report.dashboard.kpis.activeToday.value} (expected: ${report.dashboard.kpis.activeToday.expected}, matches: ${report.dashboard.kpis.activeToday.matches})`);
    console.log(`Weekly Active: ${report.dashboard.kpis.weeklyActive.value} (expected: ${report.dashboard.kpis.weeklyActive.expected}, matches: ${report.dashboard.kpis.weeklyActive.matches})`);
    console.log(`New Users (Month): ${report.dashboard.kpis.newUsersMonth.value} (expected: ${report.dashboard.kpis.newUsersMonth.expected}, matches: ${report.dashboard.kpis.newUsersMonth.matches})`);
    console.log(`Inactive Users (Week): ${report.dashboard.kpis.inactiveUsersWeek.value} (expected: ${report.dashboard.kpis.inactiveUsersWeek.expected}, matches: ${report.dashboard.kpis.inactiveUsersWeek.matches})`);
    console.log(`License Seats Remaining: ${report.dashboard.kpis.licenseSeatsRemaining.value} (expected: ${report.dashboard.kpis.licenseSeatsRemaining.expected}, matches: ${report.dashboard.kpis.licenseSeatsRemaining.matches})`);
    console.log('\\n--- REAL vs MOCK DATA STATUS ---');
    console.log(`Status: ${report.realVsMockComparison.status}`);
    console.log('Evidence:');
    report.realVsMockComparison.evidence.forEach(evidence => console.log(`  - ${evidence}`));
    if (report.realVsMockComparison.issues.length > 0) {
      console.log('Issues:');
      report.realVsMockComparison.issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
    }
    console.log('\\n--- PERFORMANCE ---');
    console.log(`Load Time: ${report.performance.loadTime}ms`);
    console.log(`Data Render Time: ${report.performance.dataRenderTime}ms`);
    console.log('\\n--- USER TABLES ---');
    console.log(`Recent Activity: ${report.dashboard.userTables.recentActivity.visible ? 'visible' : 'not found'} (${report.dashboard.userTables.recentActivity.userCount} users)`);
    console.log(`Inactive Users: ${report.dashboard.userTables.inactiveUsers.visible ? 'visible' : 'not found'}`);
    console.log('\\n--- SCREENSHOTS ---');
    console.log(`Screenshots saved: ${report.screenshots.length}`);
    console.log(`Report saved: ${reportPath}`);
    console.log('==========================================\\n');
  });
});