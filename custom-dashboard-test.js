const { chromium } = require('playwright');

async function testDashboard() {
  console.log('🚀 Starting custom dashboard test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login
    console.log('📋 Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    
    // Login
    console.log('📋 Logging in...');
    await page.fill('input[type="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect and navigate to dashboard
    await page.waitForTimeout(3000);
    console.log('📋 Navigating to dashboard...');
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    
    // Wait longer for dashboard to load
    console.log('📋 Waiting for dashboard content to load...');
    await page.waitForTimeout(10000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'dashboard-current-state.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as dashboard-current-state.png');
    
    // Try to find KPI cards with different selectors
    const kpiSelectors = [
      '[data-testid*="kpi"]',
      '.kpi-card',
      '[class*="kpi"]',
      '[class*="metric"]',
      '[class*="stat"]',
      '.card',
      '[data-testid*="metric"]',
      '[data-testid*="stat"]'
    ];
    
    let kpiCards = [];
    for (const selector of kpiSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`📊 Found ${elements.length} elements with selector: ${selector}`);
        for (let i = 0; i < elements.length; i++) {
          const text = await elements[i].textContent();
          kpiCards.push({ selector, index: i, text: text?.trim() });
        }
      }
    }
    
    // Also try to get all text content to see what's actually on the page
    const bodyText = await page.textContent('body');
    console.log('📄 Page body text (first 500 chars):', bodyText?.substring(0, 500));
    
    // Look for specific KPI values
    const searchTerms = ['Total Users', 'New Users', 'License Seats', 'Users', 'Seats'];
    const foundTerms = [];
    
    for (const term of searchTerms) {
      if (bodyText?.includes(term)) {
        foundTerms.push(term);
        console.log(`✅ Found term: ${term}`);
      }
    }
    
    console.log('📊 KPI Cards found:', kpiCards);
    console.log('📄 Search terms found:', foundTerms);
    
    // Check for loading or error states
    const loadingElements = await page.$$('[class*="loading"], [class*="spinner"], .loading, .spinner');
    const errorElements = await page.$$('[class*="error"], .error, [role="alert"]');
    
    console.log(`⏳ Loading elements: ${loadingElements.length}`);
    console.log(`❌ Error elements: ${errorElements.length}`);
    
    // Check console logs
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    console.log('📝 Console logs:', logs);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

testDashboard();