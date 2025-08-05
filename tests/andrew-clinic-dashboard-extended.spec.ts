import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Andrew\'s Clinic Dashboard Extended Analysis', () => {
  test('Extended dashboard analysis with longer wait times', async ({ page }) => {
    // Create screenshots directory
    const screenshotDir = path.join(__dirname, '..', 'test-screenshots', 'andrew-clinic-extended');
    
    // Test configuration
    const loginUrl = 'http://localhost:3001/login';
    const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard';
    const credentials = {
      email: 'todays777@gmail.com',
      password: 'your-new-password'
    };

    console.log('🚀 Starting Extended Andrew\'s Clinic Dashboard Analysis');

    // Step 1: Navigate and login
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', credentials.email);
    await page.fill('input[type="password"], input[name="password"]', credentials.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Step 2: Navigate to dashboard and wait extensively
    console.log('📋 Navigating to dashboard and waiting for content...');
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
    
    // Take immediate screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/01-dashboard-immediate.png`,
      fullPage: true 
    });

    // Wait 10 seconds for data to load
    console.log('⏳ Waiting 10 seconds for data to load...');
    await page.waitForTimeout(10000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/02-dashboard-after-10s.png`,
      fullPage: true 
    });

    // Wait another 10 seconds
    console.log('⏳ Waiting another 10 seconds...');
    await page.waitForTimeout(10000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/03-dashboard-after-20s.png`,
      fullPage: true 
    });

    // Try to wait for specific elements to appear
    console.log('🔍 Looking for specific dashboard elements...');
    
    // Check for any cards or stats
    const possibleCardSelectors = [
      '[data-testid*="card"]',
      '[data-testid*="kpi"]',
      '[data-testid*="stat"]',
      '.card',
      '.kpi-card',
      '.stat-card',
      '[class*="card"]',
      '[class*="stat"]',
      '[class*="metric"]',
      'div:has(h1, h2, h3)',
      'div:has(span:text-matches("\\\\d+"))',
      'div:has(p:text-matches("\\\\d+"))'
    ];

    let foundElements = [];
    for (const selector of possibleCardSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const isVisible = await element.isVisible();
            if (isVisible) {
              const text = await element.textContent();
              const boundingBox = await element.boundingBox();
              foundElements.push({
                selector,
                index: i,
                text: text?.trim(),
                position: boundingBox
              });
            }
          }
        }
      } catch (e) {
        // Continue if selector fails
      }
    }

    console.log('📊 Found elements:', foundElements.length);
    
    // Check for loading spinners
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[class*="loading"]',
      '[class*="spin"]',
      'svg[class*="animate"]'
    ];

    let loadingElements = [];
    for (const selector of loadingSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            loadingElements.push({ selector, visible: true });
          }
        }
      } catch (e) {
        // Continue
      }
    }

    console.log('⏳ Loading elements still visible:', loadingElements.length);

    // Get page HTML content to analyze structure
    const htmlContent = await page.content();
    
    // Look for text patterns that might indicate data sections
    const textPatterns = [
      /Total Users/gi,
      /Active Today/gi,
      /Gender Distribution/gi,
      /Daily Activity/gi,
      /Health Status/gi,
      /Recent User Activity/gi,
      /Inactive Users/gi,
      /\d+\s*(users?|patients?|members?)/gi,
      /\d+%/gi
    ];

    let foundPatterns = [];
    for (const pattern of textPatterns) {
      const matches = htmlContent.match(pattern);
      if (matches) {
        foundPatterns.push({
          pattern: pattern.source,
          matches: matches.length,
          examples: matches.slice(0, 5)
        });
      }
    }

    console.log('🔍 Text patterns found:', foundPatterns);

    // Check the browser console for errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // Wait a bit more and check console logs
    await page.waitForTimeout(5000);

    // Take final screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/04-dashboard-final.png`,
      fullPage: true 
    });

    // Get network requests
    const requests = [];
    page.on('request', req => {
      requests.push({
        url: req.url(),
        method: req.method(),
        timestamp: new Date().toISOString()
      });
    });

    // Generate detailed report
    const detailedReport = {
      testTimestamp: new Date().toISOString(),
      dashboardUrl: page.url(),
      pageTitle: await page.title(),
      waitTime: '25 seconds',
      analysis: {
        foundElements: foundElements,
        loadingElements: loadingElements,
        textPatterns: foundPatterns,
        consoleLogs: consoleLogs.slice(-20), // Last 20 logs
        recentRequests: requests.slice(-10) // Last 10 requests
      },
      htmlAnalysis: {
        totalLength: htmlContent.length,
        hasReactComponents: htmlContent.includes('react'),
        hasLoadingSpinner: htmlContent.includes('loading') || htmlContent.includes('spinner'),
        hasChartLibrary: htmlContent.includes('recharts') || htmlContent.includes('chart'),
        hasTableElements: htmlContent.includes('<table') || htmlContent.includes('role="table"')
      },
      recommendations: []
    };

    // Add specific recommendations
    if (loadingElements.length > 0) {
      detailedReport.recommendations.push('Dashboard still showing loading states after 25 seconds - likely data fetching issue');
    }

    if (foundElements.length === 0) {
      detailedReport.recommendations.push('No dashboard elements detected - components may not be rendering');
    }

    if (foundPatterns.length === 0) {
      detailedReport.recommendations.push('No expected dashboard text patterns found - data may not be populated');
    }

    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'test-screenshots', 'andrew-clinic-extended', 'detailed-analysis.json');
    const fs = require('fs');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));

    console.log('📊 EXTENDED ANALYSIS SUMMARY:');
    console.log(`📄 Page Title: ${await page.title()}`);
    console.log(`🔍 Elements Found: ${foundElements.length}`);
    console.log(`⏳ Loading Elements: ${loadingElements.length}`);
    console.log(`📝 Text Patterns: ${foundPatterns.length}`);
    console.log(`📝 Report saved to: ${reportPath}`);

    // Basic assertions
    expect(page.url()).toContain('dashboard');
    
    console.log('🎉 Extended analysis completed!');
  });
});