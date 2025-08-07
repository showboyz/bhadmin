import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface HealthStatusTestReport {
  timestamp: string;
  testType: 'Health Status Distribution Chart Analysis';
  login: {
    credentials: { email: string; password: string };
    success: boolean;
    redirectUrl?: string;
  };
  dashboard: {
    url: string;
    loaded: boolean;
    healthStatusChart: {
      visible: boolean;
      isEmpty: boolean;
      errorMessage?: string;
      dataPoints: any[];
      svgElements: number;
    };
    genderDistributionChart: {
      visible: boolean;
      isEmpty: boolean;
      errorMessage?: string;
      dataPoints: any[];
      svgElements: number;
    };
    chartComparison: {
      bothVisible: boolean;
      healthStatusWorking: boolean;
      genderDistributionWorking: boolean;
      differences: string[];
      issues: string[];
    };
  };
  consoleErrors: {
    healthStatusErrors: string[];
    generalErrors: string[];
    allLogs: any[];
  };
  networkRequests: {
    apiCalls: string[];
    failedRequests: string[];
    dashboardDataCalls: string[];
  };
  screenshots: string[];
  errors: string[];
}

test.describe('Health Status Distribution Chart Analysis', () => {
  test('Comprehensive test of Health Status Distribution chart vs Gender Distribution chart', async ({ page }) => {
    const report: HealthStatusTestReport = {
      timestamp: new Date().toISOString(),
      testType: 'Health Status Distribution Chart Analysis',
      login: {
        credentials: { email: 'andrew@youngandx.com', password: 'RX3XJEemQAfw' },
        success: false
      },
      dashboard: {
        url: 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard',
        loaded: false,
        healthStatusChart: {
          visible: false,
          isEmpty: true,
          dataPoints: [],
          svgElements: 0
        },
        genderDistributionChart: {
          visible: false,
          isEmpty: true,
          dataPoints: [],
          svgElements: 0
        },
        chartComparison: {
          bothVisible: false,
          healthStatusWorking: false,
          genderDistributionWorking: false,
          differences: [],
          issues: []
        }
      },
      consoleErrors: {
        healthStatusErrors: [],
        generalErrors: [],
        allLogs: []
      },
      networkRequests: {
        apiCalls: [],
        failedRequests: [],
        dashboardDataCalls: []
      },
      screenshots: [],
      errors: []
    };

    const screenshotDir = path.join(__dirname, '../test-screenshots/health-status-comprehensive');
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Monitor console logs
    const consoleLogs: any[] = [];
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      consoleLogs.push(logEntry);
      report.consoleErrors.allLogs.push(logEntry);
      
      // Check for health_status related errors
      if (msg.text().toLowerCase().includes('health_status') || 
          msg.text().toLowerCase().includes('health status')) {
        report.consoleErrors.healthStatusErrors.push(msg.text());
      }
      
      if (msg.type() === 'error') {
        report.consoleErrors.generalErrors.push(msg.text());
      }
      
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Monitor network requests
    page.on('request', request => {
      const url = request.url();
      report.networkRequests.apiCalls.push(url);
      
      // Track dashboard-related API calls
      if (url.includes('/api/') || url.includes('dashboard') || url.includes('users') || url.includes('seniors')) {
        report.networkRequests.dashboardDataCalls.push(url);
      }
    });

    page.on('response', response => {
      if (!response.ok()) {
        report.networkRequests.failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    try {
      console.log('🔐 Step 1: Navigating to login page...');
      await page.goto('http://localhost:3001/login');
      await page.waitForLoadState('networkidle');
      
      const loginScreenshot = path.join(screenshotDir, '01-login-page.png');
      await page.screenshot({ path: loginScreenshot, fullPage: true });
      report.screenshots.push(loginScreenshot);
      
      console.log('🔐 Step 2: Logging in with credentials...');
      await page.fill('input[type="email"]', report.login.credentials.email);
      await page.fill('input[type="password"]', report.login.credentials.password);
      
      const filledScreenshot = path.join(screenshotDir, '02-login-filled.png');
      await page.screenshot({ path: filledScreenshot, fullPage: true });
      report.screenshots.push(filledScreenshot);
      
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const afterLoginScreenshot = path.join(screenshotDir, '03-after-login.png');
      await page.screenshot({ path: afterLoginScreenshot, fullPage: true });
      report.screenshots.push(afterLoginScreenshot);
      
      const currentUrl = page.url();
      report.login.redirectUrl = currentUrl;
      
      if (!currentUrl.includes('/login')) {
        report.login.success = true;
        console.log('✅ Login successful');
      } else {
        console.log('❌ Login failed - still on login page');
        report.errors.push('Login failed - redirected back to login page');
      }
      
      console.log('📊 Step 3: Navigating to Andrew\'s Clinic dashboard...');
      await page.goto(report.dashboard.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Wait for charts to load
      
      const dashboardInitialScreenshot = path.join(screenshotDir, '04-dashboard-initial.png');
      await page.screenshot({ path: dashboardInitialScreenshot, fullPage: true });
      report.screenshots.push(dashboardInitialScreenshot);
      
      if (page.url().includes('/dashboard')) {
        report.dashboard.loaded = true;
        console.log('✅ Dashboard loaded');
      }
      
      console.log('📈 Step 4: Analyzing Health Status Distribution chart...');
      
      // Look for Health Status Distribution chart
      try {
        const healthStatusText = await page.locator('text="Health Status Distribution"').first();
        if (await healthStatusText.isVisible()) {
          report.dashboard.healthStatusChart.visible = true;
          console.log('✅ Health Status Distribution chart title found');
          
          // Get the chart container
          const chartContainer = healthStatusText.locator('..').locator('..');
          
          // Check for SVG elements in the chart
          const svgElements = await chartContainer.locator('svg').count();
          report.dashboard.healthStatusChart.svgElements = svgElements;
          console.log(`Health Status chart SVG elements: ${svgElements}`);
          
          // Check for chart data elements
          const chartPaths = await chartContainer.locator('path').count();
          const chartCircles = await chartContainer.locator('circle').count();
          const chartRects = await chartContainer.locator('rect').count();
          
          console.log(`Health Status chart elements - Paths: ${chartPaths}, Circles: ${chartCircles}, Rects: ${chartRects}`);
          
          // Check if chart appears empty
          if (svgElements === 0 || (chartPaths === 0 && chartCircles === 0 && chartRects <= 1)) {
            report.dashboard.healthStatusChart.isEmpty = true;
            report.dashboard.chartComparison.issues.push('Health Status Distribution chart appears to be empty or not rendering data');
          } else {
            report.dashboard.healthStatusChart.isEmpty = false;
            report.dashboard.chartComparison.healthStatusWorking = true;
          }
          
          // Look for error messages near the chart
          try {
            const errorTexts = await chartContainer.locator('text*="error", text*="Error", text*="failed", text*="Failed"').allTextContents();
            if (errorTexts.length > 0) {
              report.dashboard.healthStatusChart.errorMessage = errorTexts.join('; ');
            }
          } catch (e) {
            // No error messages found
          }
          
        } else {
          console.log('❌ Health Status Distribution chart not found');
          report.dashboard.chartComparison.issues.push('Health Status Distribution chart title not visible');
        }
      } catch (e) {
        report.errors.push(`Error analyzing Health Status chart: ${e}`);
      }
      
      console.log('📊 Step 5: Analyzing Gender Distribution chart for comparison...');
      
      // Look for Gender Distribution chart
      try {
        const genderDistText = await page.locator('text="Gender Distribution"').first();
        if (await genderDistText.isVisible()) {
          report.dashboard.genderDistributionChart.visible = true;
          console.log('✅ Gender Distribution chart title found');
          
          // Get the chart container
          const chartContainer = genderDistText.locator('..').locator('..');
          
          // Check for SVG elements in the chart
          const svgElements = await chartContainer.locator('svg').count();
          report.dashboard.genderDistributionChart.svgElements = svgElements;
          console.log(`Gender Distribution chart SVG elements: ${svgElements}`);
          
          // Check for chart data elements
          const chartPaths = await chartContainer.locator('path').count();
          const chartCircles = await chartContainer.locator('circle').count();
          const chartRects = await chartContainer.locator('rect').count();
          
          console.log(`Gender Distribution chart elements - Paths: ${chartPaths}, Circles: ${chartCircles}, Rects: ${chartRects}`);
          
          // Check if chart appears empty
          if (svgElements === 0 || (chartPaths === 0 && chartCircles === 0 && chartRects <= 1)) {
            report.dashboard.genderDistributionChart.isEmpty = true;
            report.dashboard.chartComparison.issues.push('Gender Distribution chart appears to be empty or not rendering data');
          } else {
            report.dashboard.genderDistributionChart.isEmpty = false;
            report.dashboard.chartComparison.genderDistributionWorking = true;
          }
          
          // Look for error messages near the chart
          try {
            const errorTexts = await chartContainer.locator('text*="error", text*="Error", text*="failed", text*="Failed"').allTextContents();
            if (errorTexts.length > 0) {
              report.dashboard.genderDistributionChart.errorMessage = errorTexts.join('; ');
            }
          } catch (e) {
            // No error messages found
          }
          
        } else {
          console.log('❌ Gender Distribution chart not found');
          report.dashboard.chartComparison.issues.push('Gender Distribution chart title not visible');
        }
      } catch (e) {
        report.errors.push(`Error analyzing Gender Distribution chart: ${e}`);
      }
      
      console.log('🔍 Step 6: Taking focused screenshots of charts...');
      
      // Screenshot focused on Health Status Distribution
      try {
        const healthStatusSection = await page.locator('text="Health Status Distribution"').locator('..');
        if (await healthStatusSection.isVisible()) {
          const healthStatusScreenshot = path.join(screenshotDir, '05-health-status-chart.png');
          await healthStatusSection.screenshot({ path: healthStatusScreenshot });
          report.screenshots.push(healthStatusScreenshot);
        }
      } catch (e) {
        console.log('Could not capture Health Status chart screenshot');
      }
      
      // Screenshot focused on Gender Distribution
      try {
        const genderDistSection = await page.locator('text="Gender Distribution"').locator('..');
        if (await genderDistSection.isVisible()) {
          const genderDistScreenshot = path.join(screenshotDir, '06-gender-distribution-chart.png');
          await genderDistSection.screenshot({ path: genderDistScreenshot });
          report.screenshots.push(genderDistScreenshot);
        }
      } catch (e) {
        console.log('Could not capture Gender Distribution chart screenshot');
      }
      
      console.log('🌐 Step 7: Checking browser console for health_status related errors...');
      
      // Wait a bit more for any delayed console errors
      await page.waitForTimeout(3000);
      
      console.log('📊 Step 8: Performing chart comparison analysis...');
      
      // Compare the charts
      report.dashboard.chartComparison.bothVisible = 
        report.dashboard.healthStatusChart.visible && report.dashboard.genderDistributionChart.visible;
      
      if (report.dashboard.chartComparison.bothVisible) {
        console.log('✅ Both charts are visible');
        
        // Compare functionality
        if (report.dashboard.chartComparison.healthStatusWorking && report.dashboard.chartComparison.genderDistributionWorking) {
          console.log('✅ Both charts appear to be working');
        } else if (report.dashboard.chartComparison.genderDistributionWorking && !report.dashboard.chartComparison.healthStatusWorking) {
          report.dashboard.chartComparison.differences.push('Gender Distribution chart is working but Health Status Distribution chart is empty/broken');
          console.log('⚠️ Gender Distribution works but Health Status Distribution is broken');
        } else if (!report.dashboard.chartComparison.genderDistributionWorking && report.dashboard.chartComparison.healthStatusWorking) {
          report.dashboard.chartComparison.differences.push('Health Status Distribution chart is working but Gender Distribution chart is empty/broken');
        } else {
          report.dashboard.chartComparison.differences.push('Both charts appear to be empty or broken');
        }
        
        // Compare SVG element counts
        const svgDifference = Math.abs(
          report.dashboard.healthStatusChart.svgElements - report.dashboard.genderDistributionChart.svgElements
        );
        if (svgDifference > 0) {
          report.dashboard.chartComparison.differences.push(
            `Different SVG element counts - Health Status: ${report.dashboard.healthStatusChart.svgElements}, Gender: ${report.dashboard.genderDistributionChart.svgElements}`
          );
        }
      }
      
      console.log('📸 Step 9: Taking final comprehensive screenshots...');
      
      // Final full page screenshot
      const finalScreenshot = path.join(screenshotDir, '07-final-comprehensive.png');
      await page.screenshot({ path: finalScreenshot, fullPage: true });
      report.screenshots.push(finalScreenshot);
      
      // Take screenshot of just the charts section if possible
      try {
        const chartsSection = await page.locator('.grid').first(); // Assuming charts are in a grid
        const chartsSectionScreenshot = path.join(screenshotDir, '08-charts-section.png');
        await chartsSection.screenshot({ path: chartsSectionScreenshot });
        report.screenshots.push(chartsSectionScreenshot);
      } catch (e) {
        console.log('Could not capture charts section');
      }
      
      console.log('✅ Test completed successfully!');
      
    } catch (error) {
      report.errors.push(`Test execution error: ${error}`);
      console.error(`Test execution error: ${error}`);
      
      const errorScreenshot = path.join(screenshotDir, '99-error.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      report.screenshots.push(errorScreenshot);
    }
    
    // Save comprehensive report
    const reportPath = path.join(screenshotDir, 'health-status-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print detailed summary
    console.log('\\n=== HEALTH STATUS DISTRIBUTION CHART ANALYSIS ===');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Login Success: ${report.login.success}`);
    console.log(`Dashboard Loaded: ${report.dashboard.loaded}`);
    
    console.log('\\n--- HEALTH STATUS DISTRIBUTION CHART ---');
    console.log(`Visible: ${report.dashboard.healthStatusChart.visible}`);
    console.log(`Empty: ${report.dashboard.healthStatusChart.isEmpty}`);
    console.log(`SVG Elements: ${report.dashboard.healthStatusChart.svgElements}`);
    if (report.dashboard.healthStatusChart.errorMessage) {
      console.log(`Error Message: ${report.dashboard.healthStatusChart.errorMessage}`);
    }
    
    console.log('\\n--- GENDER DISTRIBUTION CHART (COMPARISON) ---');
    console.log(`Visible: ${report.dashboard.genderDistributionChart.visible}`);
    console.log(`Empty: ${report.dashboard.genderDistributionChart.isEmpty}`);
    console.log(`SVG Elements: ${report.dashboard.genderDistributionChart.svgElements}`);
    if (report.dashboard.genderDistributionChart.errorMessage) {
      console.log(`Error Message: ${report.dashboard.genderDistributionChart.errorMessage}`);
    }
    
    console.log('\\n--- CHART COMPARISON ---');
    console.log(`Both Visible: ${report.dashboard.chartComparison.bothVisible}`);
    console.log(`Health Status Working: ${report.dashboard.chartComparison.healthStatusWorking}`);
    console.log(`Gender Distribution Working: ${report.dashboard.chartComparison.genderDistributionWorking}`);
    
    if (report.dashboard.chartComparison.differences.length > 0) {
      console.log('\\nDifferences:');
      report.dashboard.chartComparison.differences.forEach(diff => console.log(`  - ${diff}`));
    }
    
    if (report.dashboard.chartComparison.issues.length > 0) {
      console.log('\\nIssues:');
      report.dashboard.chartComparison.issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
    }
    
    console.log('\\n--- CONSOLE ERRORS ---');
    console.log(`Health Status Related Errors: ${report.consoleErrors.healthStatusErrors.length}`);
    if (report.consoleErrors.healthStatusErrors.length > 0) {
      report.consoleErrors.healthStatusErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log(`General Console Errors: ${report.consoleErrors.generalErrors.length}`);
    if (report.consoleErrors.generalErrors.length > 0) {
      report.consoleErrors.generalErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\\n--- NETWORK REQUESTS ---');
    console.log(`Total API Calls: ${report.networkRequests.apiCalls.length}`);
    console.log(`Dashboard Data Calls: ${report.networkRequests.dashboardDataCalls.length}`);
    console.log(`Failed Requests: ${report.networkRequests.failedRequests.length}`);
    
    if (report.networkRequests.dashboardDataCalls.length > 0) {
      console.log('\\nDashboard API Calls:');
      report.networkRequests.dashboardDataCalls.forEach(call => console.log(`  - ${call}`));
    }
    
    if (report.networkRequests.failedRequests.length > 0) {
      console.log('\\nFailed Requests:');
      report.networkRequests.failedRequests.forEach(req => console.log(`  ❌ ${req}`));
    }
    
    console.log('\\n--- SCREENSHOTS ---');
    console.log(`Screenshots captured: ${report.screenshots.length}`);
    report.screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));
    
    console.log(`\\n--- REPORT ---`);
    console.log(`Full report saved: ${reportPath}`);
    console.log('================================================\\n');
    
    // Assertions for the test
    expect(report.login.success).toBe(true);
    expect(report.dashboard.loaded).toBe(true);
    
    // Log final status
    if (report.dashboard.chartComparison.healthStatusWorking) {
      console.log('🎉 Health Status Distribution chart is working properly!');
    } else {
      console.log('⚠️ Health Status Distribution chart has issues that need investigation');
    }
  });
});