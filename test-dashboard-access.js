const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDashboardAccess() {
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down operations for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Test credentials in the specified order
  const credentials = [
    { email: 'admin@example.com', password: 'password' },
    { email: 'test@test.com', password: 'test123' },
    { email: 'admin@admin.com', password: 'admin' },
    { email: 'demo@demo.com', password: 'demo' },
    { email: 'admin@andrewclinic.com', password: 'admin123' }
  ];
  
  let loginSuccessful = false;
  let successfulCredentials = null;
  
  try {
    console.log('🔍 Navigating to dashboard URL...');
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Check if we're redirected to login page
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      console.log('🔄 Redirected to login page, attempting authentication...');
      
      // Try each credential set
      for (const cred of credentials) {
        console.log(`🧪 Trying credentials: ${cred.email} / ${cred.password}`);
        
        try {
          // Clear any existing form data
          await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
          await page.fill('input[type="email"], input[name="email"]', '');
          await page.fill('input[type="password"], input[name="password"]', '');
          
          // Fill in credentials
          await page.fill('input[type="email"], input[name="email"]', cred.email);
          await page.fill('input[type="password"], input[name="password"]', cred.password);
          
          // Submit the form
          await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
          
          // Wait for navigation or error message
          await page.waitForTimeout(3000);
          
          const newUrl = page.url();
          console.log(`📍 After login attempt: ${newUrl}`);
          
          // Check if we successfully reached the dashboard
          if (newUrl.includes('/dashboard') && !newUrl.includes('/login')) {
            console.log(`✅ Login successful with: ${cred.email}`);
            loginSuccessful = true;
            successfulCredentials = cred;
            break;
          } else {
            console.log(`❌ Login failed for: ${cred.email}`);
            // Check for error messages
            const errorElements = await page.$$('[class*="error"], [role="alert"], .text-red-500, .text-destructive');
            if (errorElements.length > 0) {
              const errorText = await errorElements[0].textContent();
              console.log(`   Error message: ${errorText}`);
            }
          }
        } catch (error) {
          console.log(`❌ Error trying ${cred.email}: ${error.message}`);
        }
      }
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✅ Already authenticated, on dashboard page');
      loginSuccessful = true;
    }
    
    if (loginSuccessful) {
      console.log('📊 Capturing dashboard data...');
      
      // Wait for dashboard to load completely
      await page.waitForTimeout(5000);
      
      // Take screenshot
      const screenshotPath = path.join(__dirname, 'dashboard-screenshot.png');
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true
      });
      console.log(`📸 Screenshot saved to: ${screenshotPath}`);
      
      // Extract KPI values
      console.log('📈 Extracting KPI values...');
      
      const kpiData = {};
      
      try {
        // Look for various KPI card patterns
        const kpiSelectors = [
          '[data-testid*="kpi"]',
          '[class*="kpi"]',
          '[class*="stat"]',
          '[class*="card"]',
          '.bg-card',
          '.rounded-lg',
          'div:has(> h3)',
          'div:has(> p)'
        ];
        
        // Try to find KPI cards and extract their values
        for (const selector of kpiSelectors) {
          const elements = await page.$$(selector);
          for (const element of elements) {
            const text = await element.textContent();
            if (text && (text.includes('Total Users') || text.includes('Users') || text.includes('Revenue') || text.includes('Conversion'))) {
              const cardText = text.trim();
              console.log(`Found KPI card: ${cardText}`);
              
              // Try to extract the metric name and value
              const lines = cardText.split('\n').filter(line => line.trim());
              if (lines.length >= 2) {
                const label = lines[0].trim();
                const value = lines[1].trim();
                kpiData[label] = value;
              }
            }
          }
        }
        
        // Also try to find specific text patterns
        const pageContent = await page.textContent('body');
        
        // Look for "Total Users: X" patterns
        const userMatch = pageContent.match(/Total Users[:\s]*(\d+)/i);
        if (userMatch) {
          kpiData['Total Users'] = userMatch[1];
        }
        
        // Look for other numeric values that might be KPIs
        const numbers = pageContent.match(/\$?[\d,]+\.?\d*/g);
        if (numbers) {
          console.log('Numbers found on page:', numbers.slice(0, 10)); // Show first 10 numbers
        }
        
        console.log('📊 KPI Data extracted:', kpiData);
        
        // Try to get more specific data by looking at the DOM structure
        const dashboardInfo = await page.evaluate(() => {
          const result = {};
          
          // Look for cards with numbers
          const cards = document.querySelectorAll('div[class*="card"], div[class*="bg-"], .rounded-lg');
          cards.forEach((card, index) => {
            const text = card.textContent?.trim();
            if (text && text.length < 200) { // Avoid very long text blocks
              const hasNumber = /\d/.test(text);
              if (hasNumber) {
                result[`card_${index}`] = text;
              }
            }
          });
          
          // Look for headings with numbers
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          headings.forEach((heading, index) => {
            const text = heading.textContent?.trim();
            if (text && /\d/.test(text)) {
              result[`heading_${index}`] = text;
            }
          });
          
          return result;
        });
        
        console.log('📋 Dashboard DOM content:', dashboardInfo);
        
      } catch (error) {
        console.log('❌ Error extracting KPI data:', error.message);
      }
      
      // Return results
      return {
        success: true,
        credentials: successfulCredentials,
        screenshotPath: screenshotPath,
        kpiData: kpiData,
        dashboardInfo: dashboardInfo,
        url: page.url()
      };
      
    } else {
      console.log('❌ Could not access dashboard with any of the provided credentials');
      return {
        success: false,
        error: 'Authentication failed with all provided credentials',
        url: page.url()
      };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message,
      url: page.url()
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardAccess().then(result => {
  console.log('\n🏁 Test Results:');
  console.log('================');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log(`\n✅ Dashboard access successful!`);
    if (result.credentials) {
      console.log(`🔑 Working credentials: ${result.credentials.email} / ${result.credentials.password}`);
    }
    console.log(`📸 Screenshot: ${result.screenshotPath}`);
    console.log(`📊 KPI Data:`, result.kpiData);
  } else {
    console.log(`\n❌ Dashboard access failed: ${result.error}`);
  }
}).catch(error => {
  console.error('💥 Script error:', error);
});