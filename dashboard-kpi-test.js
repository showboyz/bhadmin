const { chromium } = require('playwright');

async function testDashboardKPIs() {
  console.log('🚀 Starting KPI dashboard test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console logs and network requests
  page.on('console', msg => console.log('🔍 Console:', msg.text()));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('❌ HTTP Error:', response.status(), response.url());
    }
  });
  
  try {
    // Navigate to login
    console.log('📋 Step 1: Navigate to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'step1-login.png' });
    
    // Fill login form
    console.log('📋 Step 2: Fill login credentials...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.screenshot({ path: 'step2-credentials.png' });
    
    // Submit login
    console.log('📋 Step 3: Submit login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    console.log('📋 Step 4: Wait for login redirect...');
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Successfully redirected to dashboard');
    } catch (e) {
      console.log('⚠️ No automatic redirect to dashboard, navigating manually...');
      await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    }
    
    await page.screenshot({ path: 'step4-after-login.png' });
    
    // Wait for dashboard content
    console.log('📋 Step 5: Wait for dashboard content to load...');
    await page.waitForTimeout(5000);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'step5-dashboard-loaded.png', fullPage: true });
    
    // Check if we're actually on the dashboard
    const currentUrl = page.url();
    console.log('🔍 Current URL:', currentUrl);
    
    const pageTitle = await page.title();
    console.log('🔍 Page title:', pageTitle);
    
    // Try multiple approaches to find KPI data
    console.log('📋 Step 6: Search for KPI data...');
    
    // Method 1: Look for specific text patterns
    const bodyText = await page.textContent('body');
    console.log('📄 Body text length:', bodyText?.length);
    
    // Search for KPI-related text
    const kpiPatterns = [
      /Total Users.*?(\d+)/gi,
      /New Users.*?(\d+)/gi,
      /License Seats.*?(\d+)/gi,
      /Remaining.*?(\d+)/gi,
      /(\d+).*?Total Users/gi,
      /(\d+).*?New Users/gi,
      /(\d+).*?License/gi
    ];
    
    const foundKPIs = {};
    for (const pattern of kpiPatterns) {
      const matches = bodyText?.match(pattern);
      if (matches) {
        console.log('✅ Found KPI pattern:', matches);
        foundKPIs[pattern.source] = matches;
      }
    }
    
    // Method 2: Look for common card/metric selectors
    const cardSelectors = [
      '.card',
      '[class*="card"]',
      '[class*="metric"]',
      '[class*="kpi"]',
      '[class*="stat"]',
      '[data-testid*="kpi"]',
      '[data-testid*="metric"]',
      '.bg-white',
      '.p-4',
      '.p-6',
      '[class*="border"]'
    ];
    
    for (const selector of cardSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`📊 Found ${elements.length} elements with selector: ${selector}`);
        for (let i = 0; i < Math.min(elements.length, 5); i++) {
          const text = await elements[i].textContent();
          const cleanText = text?.trim();
          if (cleanText && cleanText.length > 0 && cleanText.length < 200) {
            console.log(`   - Element ${i}: "${cleanText}"`);
          }
        }
      }
    }
    
    // Method 3: Look for numbers that might be KPIs
    const numberPattern = /\b\d{1,3}\b/g;
    const numbers = bodyText?.match(numberPattern);
    if (numbers) {
      const uniqueNumbers = [...new Set(numbers)].sort((a, b) => parseInt(b) - parseInt(a));
      console.log('🔢 Numbers found on page:', uniqueNumbers.slice(0, 10));
    }
    
    // Check for loading states
    const loadingSelectors = [
      '[class*="loading"]',
      '[class*="spinner"]',
      '.animate-spin',
      '[data-testid*="loading"]'
    ];
    
    for (const selector of loadingSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`⏳ Found ${elements.length} loading elements with selector: ${selector}`);
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-dashboard-state.png', fullPage: true });
    
    // Summary
    console.log('\n📊 KPI TEST SUMMARY:');
    console.log('====================');
    console.log('Current URL:', currentUrl);
    console.log('Page Title:', pageTitle);
    console.log('KPI Patterns Found:', Object.keys(foundKPIs).length);
    console.log('Body Text Length:', bodyText?.length);
    console.log('Screenshots saved: step1-login.png, step2-credentials.png, step4-after-login.png, step5-dashboard-loaded.png, final-dashboard-state.png');
    
    if (Object.keys(foundKPIs).length > 0) {
      console.log('\n✅ FOUND KPI DATA:');
      for (const [pattern, matches] of Object.entries(foundKPIs)) {
        console.log(`${pattern}: ${matches}`);
      }
    } else {
      console.log('\n❌ NO KPI DATA FOUND');
      console.log('This suggests the dashboard may be:');
      console.log('- Still loading');
      console.log('- Not properly authenticated');
      console.log('- Missing data from Supabase');
      console.log('- Using different HTML structure than expected');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
  }
}

testDashboardKPIs();