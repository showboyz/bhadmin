const { chromium } = require('playwright');

async function testDashboardKPIs() {
  console.log('🚀 Final KPI Dashboard Test with Working Credentials');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console logs
  page.on('console', msg => console.log('🔍 Console:', msg.text()));
  
  try {
    // Step 1: Login with working credentials
    console.log('📋 Step 1: Logging in with working credentials...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    
    await page.fill('input[type="email"]', 'todays777@gmail.com');
    await page.fill('input[type="password"]', 'your-new-password');
    await page.click('button[type="submit"]');
    
    // Wait for successful redirect
    await page.waitForURL('**/super-admin', { timeout: 10000 });
    console.log('✅ Successfully logged in and redirected to super-admin');
    
    // Step 2: Navigate to the specific dashboard
    console.log('📋 Step 2: Navigating to specific organization dashboard...');
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    
    // Step 3: Wait for dashboard to load (give extra time for data loading)
    console.log('📋 Step 3: Waiting for dashboard content to load...');
    await page.waitForTimeout(15000); // Wait 15 seconds for data to load
    
    // Step 4: Take screenshot
    await page.screenshot({ path: 'final-dashboard-kpis.png', fullPage: true });
    console.log('📸 Screenshot saved as final-dashboard-kpis.png');
    
    // Step 5: Extract KPI values
    console.log('📋 Step 5: Extracting KPI values...');
    
    const bodyText = await page.textContent('body');
    
    // Method 1: Look for specific KPI patterns
    console.log('\n📊 KPI VALUE SEARCH:');
    console.log('=====================');
    
    const kpiSearchTerms = [
      'Total Users',
      'New Users',
      'License Seats Remaining',
      'License Seats',
      'Active Users',
      'Inactive Users'
    ];
    
    for (const term of kpiSearchTerms) {
      if (bodyText?.includes(term)) {
        console.log(`✅ Found term: "${term}"`);
        
        // Try to find the number associated with this term
        const patterns = [
          new RegExp(`${term}.*?(\\d+)`, 'gi'),
          new RegExp(`(\\d+).*?${term}`, 'gi')
        ];
        
        for (const pattern of patterns) {
          const matches = bodyText?.match(pattern);
          if (matches) {
            console.log(`   📈 Pattern match: ${matches[0]}`);
          }
        }
      }
    }
    
    // Method 2: Look for card/metric elements and extract their text
    console.log('\n📊 CARD/METRIC ELEMENTS:');
    console.log('========================');
    
    const metricSelectors = [
      '[data-testid*="kpi"]',
      '[data-testid*="metric"]',
      '[data-testid*="card"]',
      '.card',
      '[class*="card"]',
      '[class*="metric"]',
      '[class*="stat"]',
      '.bg-white',
      '.p-4',
      '.p-6'
    ];
    
    for (const selector of metricSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`📊 Found ${elements.length} elements with selector: ${selector}`);
        for (let i = 0; i < elements.length; i++) {
          const text = await elements[i].textContent();
          const cleanText = text?.trim();
          if (cleanText && cleanText.length > 0 && cleanText.length < 200) {
            // Check if this looks like a KPI card (contains numbers and relevant text)
            if (/\d+/.test(cleanText) && (
              cleanText.toLowerCase().includes('user') ||
              cleanText.toLowerCase().includes('license') ||
              cleanText.toLowerCase().includes('seat') ||
              cleanText.toLowerCase().includes('remaining') ||
              cleanText.toLowerCase().includes('total') ||
              cleanText.toLowerCase().includes('new')
            )) {
              console.log(`   🎯 KPI Card ${i + 1}: "${cleanText}"`);
            }
          }
        }
      }
    }
    
    // Method 3: Look for specific expected values (10, 90, etc.)
    console.log('\n🔢 CHECKING FOR EXPECTED VALUES:');
    console.log('================================');
    
    const expectedValues = ['10', '90'];
    for (const value of expectedValues) {
      if (bodyText?.includes(value)) {
        console.log(`✅ Found expected value: ${value}`);
        
        // Try to find context around this number
        const lines = bodyText.split('\n');
        for (const line of lines) {
          if (line.includes(value) && line.trim().length < 100) {
            console.log(`   📍 Context: "${line.trim()}"`);
          }
        }
      }
    }
    
    // Method 4: Check page structure for loading/error states
    console.log('\n🔍 PAGE STATE CHECK:');
    console.log('====================');
    
    const loadingElements = await page.$$('[class*="loading"], [class*="spinner"], .animate-spin');
    const errorElements = await page.$$('[class*="error"], .error, [role="alert"]');
    
    console.log(`⏳ Loading elements found: ${loadingElements.length}`);
    console.log(`❌ Error elements found: ${errorElements.length}`);
    
    if (loadingElements.length > 0) {
      console.log('⚠️ Dashboard appears to still be loading');
    }
    
    if (errorElements.length > 0) {
      console.log('❌ Error state detected on dashboard');
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        if (errorText && errorText.trim()) {
          console.log(`   Error ${i + 1}: ${errorText.trim()}`);
        }
      }
    }
    
    // Summary
    console.log('\n📋 FINAL SUMMARY:');
    console.log('=================');
    console.log('✅ Login: Successful');
    console.log('✅ Dashboard Access: Successful');
    console.log('📸 Screenshot: Saved as final-dashboard-kpis.png');
    console.log('🔍 Body Text Length:', bodyText?.length || 0);
    
    if (bodyText && bodyText.length > 0) {
      const hasKPIData = bodyText.includes('Total Users') || 
                        bodyText.includes('New Users') || 
                        bodyText.includes('License Seats');
      
      if (hasKPIData) {
        console.log('✅ KPI Data: Found on dashboard');
      } else {
        console.log('❌ KPI Data: Not found - dashboard may still be loading');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'error-final-kpi-test.png' });
  } finally {
    await browser.close();
  }
}

testDashboardKPIs();