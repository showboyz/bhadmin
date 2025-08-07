const { chromium } = require('playwright');

async function tryLoginCombinations() {
  console.log('🚀 Testing multiple login combinations...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console logs and network responses
  page.on('console', msg => console.log('🔍 Console:', msg.text()));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('❌ HTTP Error:', response.status(), response.url());
    }
  });
  
  const loginCombinations = [
    { email: 'todays777@gmail.com', password: 'Password123!' },
    { email: 'todays777@gmail.com', password: 'your-new-password' },
    { email: 'todays777@gmail.com', password: 'test123' },
    { email: 'todays777@gmail.com', password: 'admin123' },
    { email: 'admin@andrewclinic.com', password: 'admin123' },
    { email: 'test@test.com', password: 'test123' },
    { email: 'admin@example.com', password: 'admin123' }
  ];
  
  try {
    for (let i = 0; i < loginCombinations.length; i++) {
      const { email, password } = loginCombinations[i];
      
      console.log(`\n📋 Attempt ${i + 1}: Trying ${email} / ${password}`);
      
      // Navigate to login
      await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
      
      // Clear and fill credentials
      await page.fill('input[type="email"]', '');
      await page.fill('input[type="password"]', '');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      
      // Submit login
      await page.click('button[type="submit"]');
      
      // Wait a moment for response
      await page.waitForTimeout(3000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('🔍 Current URL after login:', currentUrl);
      
      // Check if we're redirected away from login (success)
      if (!currentUrl.includes('/login')) {
        console.log('✅ LOGIN SUCCESS! Found working credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        
        // Navigate to dashboard
        await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
        await page.waitForTimeout(5000);
        
        // Take screenshot
        await page.screenshot({ path: 'successful-dashboard.png', fullPage: true });
        
        // Look for KPI data
        const bodyText = await page.textContent('body');
        
        // Search for KPI patterns
        const kpiPatterns = [
          /Total Users.*?(\d+)/gi,
          /New Users.*?(\d+)/gi,
          /License Seats.*?(\d+)/gi,
          /Remaining.*?(\d+)/gi,
          /(\d+).*?Total Users/gi,
          /(\d+).*?New Users/gi,
          /(\d+).*?License/gi
        ];
        
        console.log('\n📊 DASHBOARD KPI SEARCH:');
        console.log('========================');
        
        for (const pattern of kpiPatterns) {
          const matches = bodyText?.match(pattern);
          if (matches) {
            console.log(`✅ Found: ${matches[0]}`);
          }
        }
        
        // Look for specific numbers
        const numberPattern = /\b\d{1,3}\b/g;
        const numbers = bodyText?.match(numberPattern);
        if (numbers) {
          const uniqueNumbers = [...new Set(numbers)].sort((a, b) => parseInt(b) - parseInt(a));
          console.log('🔢 Top numbers found:', uniqueNumbers.slice(0, 10));
        }
        
        // Check for cards/metrics
        const cardSelectors = ['.card', '[class*="card"]', '[class*="metric"]', '[class*="kpi"]'];
        
        for (const selector of cardSelectors) {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            console.log(`📊 Found ${elements.length} elements with selector: ${selector}`);
            for (let j = 0; j < Math.min(elements.length, 3); j++) {
              const text = await elements[j].textContent();
              const cleanText = text?.trim();
              if (cleanText && cleanText.length > 0 && cleanText.length < 100) {
                console.log(`   - ${cleanText}`);
              }
            }
          }
        }
        
        break; // Success, exit loop
      } else {
        console.log('❌ Login failed - still on login page');
      }
    }
    
    // If we get here without success
    const finalUrl = page.url();
    if (finalUrl.includes('/login')) {
      console.log('\n❌ ALL LOGIN ATTEMPTS FAILED');
      console.log('The Supabase configuration appears to be invalid or the user doesn\'t exist.');
      console.log('You may need to:');
      console.log('1. Set up a new Supabase project');
      console.log('2. Create the test user in Supabase');
      console.log('3. Enable demo mode temporarily');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

tryLoginCombinations();