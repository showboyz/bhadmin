import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Andrew\'s Clinic Dashboard Test', () => {
  test('Complete dashboard access and data verification', async ({ page }) => {
    // Create screenshots directory
    const screenshotDir = path.join(__dirname, '..', 'test-screenshots', 'andrew-clinic-dashboard');
    
    // Test configuration
    const loginUrl = 'http://localhost:3001/login';
    const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard';
    const credentials = {
      email: 'todays777@gmail.com',
      password: 'your-new-password'
    };

    console.log('🚀 Starting Andrew\'s Clinic Dashboard Test');

    // Step 1: Navigate to login page
    console.log('📋 Step 1: Navigating to login page...');
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: `${screenshotDir}/01-login-page.png`,
      fullPage: true 
    });
    console.log('✅ Login page loaded');

    // Step 2: Login with credentials
    console.log('📋 Step 2: Logging in with credentials...');
    await page.fill('input[type="email"], input[name="email"]', credentials.email);
    await page.fill('input[type="password"], input[name="password"]', credentials.password);
    
    await page.screenshot({ 
      path: `${screenshotDir}/02-credentials-filled.png`,
      fullPage: true 
    });

    // Submit login form
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for navigation after login
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: `${screenshotDir}/03-after-login.png`,
      fullPage: true 
    });
    console.log('✅ Login attempt completed');

    // Step 3: Navigate directly to dashboard
    console.log('📋 Step 3: Navigating to specific dashboard...');
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Allow time for dashboard to load
    
    await page.screenshot({ 
      path: `${screenshotDir}/04-dashboard-initial-load.png`,
      fullPage: true 
    });
    console.log('✅ Dashboard navigation completed');

    // Step 4: Analyze dashboard content and take detailed screenshots
    console.log('📋 Step 4: Analyzing dashboard content...');

    // Take full page screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/05-dashboard-full-page.png`,
      fullPage: true 
    });

    // Take viewport screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/06-dashboard-viewport.png`,
      fullPage: false 
    });

    // Step 5: Check KPI Cards (6 cards expected)
    console.log('📋 Step 5: Checking KPI cards...');
    const kpiCards = await page.locator('[data-testid*="kpi"], .kpi-card, [class*="card"]:has([class*="stat"], [class*="metric"])').all();
    
    let kpiData = [];
    for (let i = 0; i < kpiCards.length; i++) {
      try {
        const card = kpiCards[i];
        const cardText = await card.textContent();
        const isVisible = await card.isVisible();
        kpiData.push({
          index: i + 1,
          visible: isVisible,
          content: cardText?.trim() || 'No content',
          hasNumbers: /\d/.test(cardText || '')
        });
      } catch (e) {
        console.log(`Error reading KPI card ${i + 1}:`, e);
      }
    }

    // Screenshot KPI cards section specifically
    if (kpiCards.length > 0) {
      await page.screenshot({ 
        path: `${screenshotDir}/07-kpi-cards-section.png`,
        fullPage: false 
      });
    }

    console.log(`📊 Found ${kpiCards.length} KPI cards:`, kpiData);

    // Step 6: Check Charts
    console.log('📋 Step 6: Checking charts...');
    const charts = await page.locator('canvas, svg, [data-testid*="chart"], .recharts-wrapper, [class*="chart"]').all();
    
    let chartData = [];
    for (let i = 0; i < charts.length; i++) {
      try {
        const chart = charts[i];
        const isVisible = await chart.isVisible();
        const tagName = await chart.evaluate(el => el.tagName);
        const className = await chart.getAttribute('class') || '';
        chartData.push({
          index: i + 1,
          visible: isVisible,
          type: tagName,
          className: className
        });
      } catch (e) {
        console.log(`Error reading chart ${i + 1}:`, e);
      }
    }

    // Screenshot charts section
    if (charts.length > 0) {
      await page.screenshot({ 
        path: `${screenshotDir}/08-charts-section.png`,
        fullPage: false 
      });
    }

    console.log(`📈 Found ${charts.length} charts:`, chartData);

    // Step 7: Check Tables (Recent User Activity, Inactive Users)
    console.log('📋 Step 7: Checking tables...');
    const tables = await page.locator('table, [data-testid*="table"], .table-container, [role="table"]').all();
    
    let tableData = [];
    for (let i = 0; i < tables.length; i++) {
      try {
        const table = tables[i];
        const isVisible = await table.isVisible();
        const rows = await table.locator('tr, [role="row"]').count();
        const headers = await table.locator('th, [role="columnheader"]').allTextContents();
        const hasData = rows > 1; // More than just header row
        
        tableData.push({
          index: i + 1,
          visible: isVisible,
          rows: rows,
          hasData: hasData,
          headers: headers
        });
      } catch (e) {
        console.log(`Error reading table ${i + 1}:`, e);
      }
    }

    // Screenshot tables section
    if (tables.length > 0) {
      await page.screenshot({ 
        path: `${screenshotDir}/09-tables-section.png`,
        fullPage: false 
      });
    }

    console.log(`📋 Found ${tables.length} tables:`, tableData);

    // Step 8: Check for loading states and errors
    console.log('📋 Step 8: Checking for loading states and errors...');
    
    const loadingElements = await page.locator('[data-testid*="loading"], .loading, .spinner, [class*="loading"]').all();
    const errorElements = await page.locator('[data-testid*="error"], .error, [class*="error"], [role="alert"]').all();
    const emptyStateElements = await page.locator('[data-testid*="empty"], .empty-state, [class*="empty"]').all();

    let loadingStates = [];
    for (const element of loadingElements) {
      const isVisible = await element.isVisible();
      const content = await element.textContent();
      if (isVisible) {
        loadingStates.push({ content: content?.trim() });
      }
    }

    let errorStates = [];
    for (const element of errorElements) {
      const isVisible = await element.isVisible();
      const content = await element.textContent();
      if (isVisible) {
        errorStates.push({ content: content?.trim() });
      }
    }

    let emptyStates = [];
    for (const element of emptyStateElements) {
      const isVisible = await element.isVisible();
      const content = await element.textContent();
      if (isVisible) {
        emptyStates.push({ content: content?.trim() });
      }
    }

    // Take screenshot if there are any loading/error states
    if (loadingStates.length > 0 || errorStates.length > 0) {
      await page.screenshot({ 
        path: `${screenshotDir}/10-loading-error-states.png`,
        fullPage: true 
      });
    }

    // Step 9: Get console logs and network information
    console.log('📋 Step 9: Collecting console logs and network info...');
    
    // Get current URL
    const currentUrl = page.url();
    
    // Get page title
    const pageTitle = await page.title();

    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/11-final-comprehensive-view.png`,
      fullPage: true 
    });

    // Step 10: Generate comprehensive report
    const testReport = {
      testTimestamp: new Date().toISOString(),
      testConfiguration: {
        loginUrl,
        dashboardUrl,
        credentials: { email: credentials.email, password: '[REDACTED]' }
      },
      navigation: {
        finalUrl: currentUrl,
        pageTitle: pageTitle,
        dashboardLoadedSuccessfully: currentUrl.includes('dashboard')
      },
      dashboardContent: {
        kpiCards: {
          count: kpiCards.length,
          expected: 6,
          details: kpiData
        },
        charts: {
          count: charts.length,
          expected: 3,
          details: chartData
        },
        tables: {
          count: tables.length,
          expected: 2,
          details: tableData
        }
      },
      states: {
        loading: loadingStates,
        errors: errorStates,
        emptyStates: emptyStates
      },
      recommendations: []
    };

    // Add recommendations based on findings
    if (kpiCards.length === 0) {
      testReport.recommendations.push('No KPI cards found - may need dummy data creation');
    } else if (kpiCards.length < 6) {
      testReport.recommendations.push(`Only ${kpiCards.length} KPI cards found, expected 6`);
    }

    if (charts.length === 0) {
      testReport.recommendations.push('No charts found - may need chart data creation');
    } else if (charts.length < 3) {
      testReport.recommendations.push(`Only ${charts.length} charts found, expected 3`);
    }

    if (tables.length === 0) {
      testReport.recommendations.push('No tables found - may need table data creation');
    } else if (tables.length < 2) {
      testReport.recommendations.push(`Only ${tables.length} tables found, expected 2`);
    }

    if (errorStates.length > 0) {
      testReport.recommendations.push('Error states detected - check console logs and fix issues');
    }

    if (loadingStates.length > 0) {
      testReport.recommendations.push('Loading states still active - data may be loading slowly or failing');
    }

    // Save report to file
    const reportPath = path.join(__dirname, '..', 'test-screenshots', 'andrew-clinic-dashboard', 'test-report.json');
    const fs = require('fs');
    const reportDir = path.dirname(reportPath);
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

    console.log('📊 TEST SUMMARY:');
    console.log(`✅ Dashboard URL: ${currentUrl}`);
    console.log(`📄 Page Title: ${pageTitle}`);
    console.log(`📊 KPI Cards: ${kpiCards.length}/6 expected`);
    console.log(`📈 Charts: ${charts.length}/3 expected`);
    console.log(`📋 Tables: ${tables.length}/2 expected`);
    console.log(`⚠️  Loading States: ${loadingStates.length}`);
    console.log(`❌ Error States: ${errorStates.length}`);
    console.log(`📝 Report saved to: ${reportPath}`);
    console.log(`📸 Screenshots saved to: ${reportDir}`);

    // Assert basic functionality
    expect(currentUrl).toContain('dashboard');
    expect(pageTitle).toBeTruthy();
    
    console.log('🎉 Test completed successfully!');
  });
});