import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface TestReport {
  timestamp: string;
  testType: 'Real Data Dashboard Test';
  loginCredentials: {
    email: string;
    success: boolean;
  };
  dashboardAccess: {
    url: string;
    success: boolean;
  };
  kpiValues: {
    totalUsers: string | null;
    licenseSeatsRemaining: string | null;
    genderDistribution: {
      male: string | null;
      female: string | null;
    };
    otherMetrics: Record<string, string>;
  };
  screenshots: string[];
  errors: string[];
  performance: {
    loadTime: number;
    dataFetchTime: number;
  };
  realVsMockComparison: {
    differences: string[];
    issues: string[];
  };
}

test.describe('Real Data Dashboard Test', () => {
  test('Test Andrew\'s Clinic dashboard with real Supabase data', async ({ page }) => {
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      testType: 'Real Data Dashboard Test',
      loginCredentials: {
        email: 'todays777@gmail.com',
        success: false
      },
      dashboardAccess: {
        url: 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard',
        success: false
      },
      kpiValues: {
        totalUsers: null,
        licenseSeatsRemaining: null,
        genderDistribution: {
          male: null,
          female: null
        },
        otherMetrics: {}
      },
      screenshots: [],
      errors: [],
      performance: {
        loadTime: 0,
        dataFetchTime: 0
      },
      realVsMockComparison: {
        differences: [],
        issues: []
      }
    };

    const screenshotDir = path.join(__dirname, '../test-screenshots/real-data-test');
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    try {
      // Step 1: Navigate to login page
      console.log('Step 1: Navigating to login page...');
      const startTime = Date.now();
      await page.goto('http://localhost:3001/login');
      await page.waitForLoadState('networkidle');
      
      const screenshot1Path = path.join(screenshotDir, '01-login-page.png');
      await page.screenshot({ path: screenshot1Path, fullPage: true });
      report.screenshots.push(screenshot1Path);
      console.log('✓ Login page loaded');

      // Step 2: Fill in login credentials
      console.log('Step 2: Filling in login credentials...');
      await page.fill('input[type="email"]', 'todays777@gmail.com');
      await page.fill('input[type="password"]', 'your-new-password');
      
      const screenshot2Path = path.join(screenshotDir, '02-login-filled.png');
      await page.screenshot({ path: screenshot2Path, fullPage: true });
      report.screenshots.push(screenshot2Path);
      console.log('✓ Credentials filled');

      // Step 3: Login
      console.log('Step 3: Attempting login...');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // Wait for potential redirect
      await page.waitForTimeout(3000);
      
      const screenshot3Path = path.join(screenshotDir, '03-after-login.png');
      await page.screenshot({ path: screenshot3Path, fullPage: true });
      report.screenshots.push(screenshot3Path);
      
      const currentUrl = page.url();
      console.log(`✓ Login attempted, current URL: ${currentUrl}`);
      
      if (!currentUrl.includes('/login')) {
        report.loginCredentials.success = true;
        console.log('✓ Login successful');
      } else {
        report.errors.push('Login failed - still on login page');
      }

      // Step 4: Navigate to Andrew's Clinic dashboard
      console.log('Step 4: Navigating to Andrew\'s Clinic dashboard...');
      const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard';
      await page.goto(dashboardUrl);
      
      // Wait for dashboard to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Give extra time for data to load
      
      const loadTime = Date.now() - startTime;
      report.performance.loadTime = loadTime;
      
      const screenshot4Path = path.join(screenshotDir, '04-dashboard-initial.png');
      await page.screenshot({ path: screenshot4Path, fullPage: true });
      report.screenshots.push(screenshot4Path);
      
      if (page.url().includes('/dashboard')) {
        report.dashboardAccess.success = true;
        console.log('✓ Dashboard access successful');
      } else {
        report.errors.push('Dashboard access failed - redirected away');
      }

      // Step 5: Wait for data to load and take comprehensive screenshots
      console.log('Step 5: Waiting for data to load...');
      const dataStartTime = Date.now();
      
      // Wait for KPI cards to load
      await page.waitForSelector('[data-testid="kpi-card"], .card, .bg-card', { timeout: 10000 });
      await page.waitForTimeout(3000); // Extra wait for data
      
      const dataFetchTime = Date.now() - dataStartTime;
      report.performance.dataFetchTime = dataFetchTime;
      
      // Take full page screenshot
      const screenshot5Path = path.join(screenshotDir, '05-dashboard-full-page.png');
      await page.screenshot({ path: screenshot5Path, fullPage: true });
      report.screenshots.push(screenshot5Path);
      
      // Take viewport screenshot
      const screenshot6Path = path.join(screenshotDir, '06-dashboard-viewport.png');
      await page.screenshot({ path: screenshot6Path });
      report.screenshots.push(screenshot6Path);

      // Step 6: Extract KPI values
      console.log('Step 6: Extracting KPI values...');
      
      try {
        // Look for Total Users
        const totalUsersSelectors = [
          'text="Total Users"',
          'text="Users"',
          '[data-testid="total-users"]',
          '.card:has-text("Users")',
          '.bg-card:has-text("Users")'
        ];
        
        for (const selector of totalUsersSelectors) {
          try {
            const element = await page.locator(selector).first();
            if (await element.isVisible()) {
              const parentCard = element.locator('..').first();
              const valueElement = await parentCard.locator('.text-2xl, .text-3xl, .text-4xl, .font-bold').first();
              if (await valueElement.isVisible()) {
                report.kpiValues.totalUsers = await valueElement.textContent();
                console.log(`✓ Total Users found: ${report.kpiValues.totalUsers}`);
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Look for License Seats
        const licenseSelectors = [
          'text="License Seats"',
          'text="Seats"',
          'text="Remaining"',
          '[data-testid="license-seats"]',
          '.card:has-text("License")',
          '.bg-card:has-text("Seats")'
        ];
        
        for (const selector of licenseSelectors) {
          try {
            const element = await page.locator(selector).first();
            if (await element.isVisible()) {
              const parentCard = element.locator('..').first();
              const valueElement = await parentCard.locator('.text-2xl, .text-3xl, .text-4xl, .font-bold').first();
              if (await valueElement.isVisible()) {
                report.kpiValues.licenseSeatsRemaining = await valueElement.textContent();
                console.log(`✓ License Seats found: ${report.kpiValues.licenseSeatsRemaining}`);
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Look for Gender Distribution
        const genderSelectors = [
          'text="Gender"',
          'text="Male"',
          'text="Female"',
          '[data-testid="gender-chart"]',
          '.chart-container'
        ];
        
        for (const selector of genderSelectors) {
          try {
            const element = await page.locator(selector).first();
            if (await element.isVisible()) {
              const chartContainer = element.locator('..').first();
              
              // Look for Male count
              const maleElement = await chartContainer.locator('text=/Male|M:/', { timeout: 2000 }).first();
              if (await maleElement.isVisible()) {
                report.kpiValues.genderDistribution.male = await maleElement.textContent();
              }
              
              // Look for Female count
              const femaleElement = await chartContainer.locator('text=/Female|F:/', { timeout: 2000 }).first();
              if (await femaleElement.isVisible()) {
                report.kpiValues.genderDistribution.female = await femaleElement.textContent();
              }
              
              console.log(`✓ Gender distribution found - Male: ${report.kpiValues.genderDistribution.male}, Female: ${report.kpiValues.genderDistribution.female}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Look for other metrics
        const allCards = await page.locator('.card, .bg-card').all();
        for (let i = 0; i < allCards.length; i++) {
          try {
            const card = allCards[i];
            const titleElement = await card.locator('.text-sm, .text-xs, .font-medium').first();
            const valueElement = await card.locator('.text-2xl, .text-3xl, .text-4xl, .font-bold').first();
            
            if (await titleElement.isVisible() && await valueElement.isVisible()) {
              const title = await titleElement.textContent();
              const value = await valueElement.textContent();
              
              if (title && value && !title.includes('Users') && !title.includes('License')) {
                report.kpiValues.otherMetrics[title] = value;
                console.log(`✓ Found metric: ${title} = ${value}`);
              }
            }
          } catch (e) {
            // Continue to next card
          }
        }
        
      } catch (error) {
        report.errors.push(`Error extracting KPI values: ${error}`);
        console.log(`✗ Error extracting KPI values: ${error}`);
      }

      // Step 7: Check for errors and performance issues
      console.log('Step 7: Checking for errors and performance issues...');
      
      // Check for console errors
      const logs = await page.evaluate(() => {
        return (window as any).__logs || [];
      });
      
      if (logs && logs.length > 0) {
        report.errors.push(`Console logs: ${JSON.stringify(logs)}`);
      }
      
      // Check for loading states
      const loadingElements = await page.locator('text=/Loading|Spinner|skeleton/', { timeout: 1000 }).all();
      if (loadingElements.length > 0) {
        report.realVsMockComparison.issues.push('Loading states still visible');
      }
      
      // Step 8: Compare with expected values for real data
      console.log('Step 8: Comparing with expected real data values...');
      
      if (report.kpiValues.totalUsers) {
        const totalUsersNum = parseInt(report.kpiValues.totalUsers.replace(/[^0-9]/g, ''));
        if (totalUsersNum === 40) {
          report.realVsMockComparison.differences.push('✓ Total Users shows 40 (expected for real data)');
        } else if (totalUsersNum === 10) {
          report.realVsMockComparison.differences.push('✗ Total Users still shows 10 (mock data - should be 40)');
          report.realVsMockComparison.issues.push('Still showing mock data instead of real data');
        } else {
          report.realVsMockComparison.differences.push(`? Total Users shows ${totalUsersNum} (unexpected value)`);
        }
      }
      
      if (report.kpiValues.licenseSeatsRemaining) {
        const seatsNum = parseInt(report.kpiValues.licenseSeatsRemaining.replace(/[^0-9]/g, ''));
        if (seatsNum === 10) {
          report.realVsMockComparison.differences.push('✓ License Seats shows 10 (expected: 50-40=10)');
        } else if (seatsNum === 40) {
          report.realVsMockComparison.differences.push('✗ License Seats shows 40 (mock data - should be 10)');
          report.realVsMockComparison.issues.push('License seats calculation using mock data');
        } else {
          report.realVsMockComparison.differences.push(`? License Seats shows ${seatsNum} (unexpected value)`);
        }
      }
      
      // Take final comprehensive screenshot
      const screenshot7Path = path.join(screenshotDir, '07-final-comprehensive.png');
      await page.screenshot({ path: screenshot7Path, fullPage: true });
      report.screenshots.push(screenshot7Path);
      
      console.log('Test completed successfully!');
      
    } catch (error) {
      report.errors.push(`Test execution error: ${error}`);
      console.error(`Test execution error: ${error}`);
      
      // Take error screenshot
      const errorScreenshotPath = path.join(screenshotDir, '99-error-state.png');
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      report.screenshots.push(errorScreenshotPath);
    }
    
    // Save test report
    const reportPath = path.join(screenshotDir, 'real-data-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Test report saved to: ${reportPath}`);
    
    // Output summary
    console.log('\n=== REAL DATA DASHBOARD TEST SUMMARY ===');
    console.log(`Login Success: ${report.loginCredentials.success}`);
    console.log(`Dashboard Access: ${report.dashboardAccess.success}`);
    console.log(`Total Users: ${report.kpiValues.totalUsers || 'Not found'}`);
    console.log(`License Seats Remaining: ${report.kpiValues.licenseSeatsRemaining || 'Not found'}`);
    console.log(`Gender Distribution - Male: ${report.kpiValues.genderDistribution.male || 'Not found'}`);
    console.log(`Gender Distribution - Female: ${report.kpiValues.genderDistribution.female || 'Not found'}`);
    console.log(`Load Time: ${report.performance.loadTime}ms`);
    console.log(`Data Fetch Time: ${report.performance.dataFetchTime}ms`);
    console.log(`Errors: ${report.errors.length}`);
    console.log(`Screenshots: ${report.screenshots.length}`);
    console.log('==========================================\n');
  });
});