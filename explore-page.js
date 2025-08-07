const { chromium } = require('playwright');

async function explorePage() {
  console.log('Starting page exploration...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the URL
    console.log('Navigating to User Management page...');
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Give extra time for any dynamic content
    
    // Take a full page screenshot first
    console.log('Taking initial screenshot...');
    await page.screenshot({ 
      path: 'initial-page-screenshot.png', 
      fullPage: true 
    });
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get page URL
    const url = page.url();
    console.log('Current URL:', url);
    
    // Check for any error messages or loading indicators
    const bodyText = await page.locator('body').textContent();
    console.log('Page contains text:', bodyText?.substring(0, 500) + '...');
    
    // Look for different types of tables and data containers
    console.log('\nLooking for data containers...');
    
    const tables = await page.locator('table').count();
    console.log('Number of table elements:', tables);
    
    const divs = await page.locator('div[class*="table"], div[class*="grid"], div[class*="list"]').count();
    console.log('Number of potential data container divs:', divs);
    
    // Look for any elements that might contain "CURRENT"
    const currentElements = await page.locator(':has-text("CURRENT")').count();
    console.log('Elements containing "CURRENT":', currentElements);
    
    if (currentElements > 0) {
      const currentTexts = await page.locator(':has-text("CURRENT")').all();
      for (let i = 0; i < currentTexts.length; i++) {
        const text = await currentTexts[i].textContent();
        console.log(`CURRENT element ${i + 1}:`, text);
      }
    }
    
    // Look for session-related text
    const sessionElements = await page.locator(':has-text("Session")').count();
    console.log('Elements containing "Session":', sessionElements);
    
    if (sessionElements > 0) {
      const sessionTexts = await page.locator(':has-text("Session")').all();
      for (let i = 0; i < Math.min(sessionTexts.length, 10); i++) {
        const text = await sessionTexts[i].textContent();
        console.log(`Session element ${i + 1}:`, text?.substring(0, 100));
      }
    }
    
    // Check for any authentication or loading issues
    const loginElements = await page.locator(':has-text("login"), :has-text("Login"), :has-text("Sign in")').count();
    if (loginElements > 0) {
      console.log('WARNING: Login elements detected - may need authentication');
    }
    
    const loadingElements = await page.locator(':has-text("loading"), :has-text("Loading"), [class*="loading"], [class*="spinner"]').count();
    if (loadingElements > 0) {
      console.log('WARNING: Loading elements detected - page may still be loading');
      // Wait a bit more
      await page.waitForTimeout(5000);
      
      // Take another screenshot
      await page.screenshot({ 
        path: 'after-loading-wait-screenshot.png', 
        fullPage: true 
      });
    }
    
    // Get the HTML structure to understand the page layout
    const mainContent = await page.locator('main, [role="main"], .main-content, #main').first().innerHTML().catch(() => null);
    if (mainContent) {
      console.log('\nMain content structure (first 1000 chars):');
      console.log(mainContent.substring(0, 1000));
    } else {
      // Fallback to body content
      const bodyContent = await page.locator('body').innerHTML();
      console.log('\nBody content structure (first 1000 chars):');
      console.log(bodyContent.substring(0, 1000));
    }
    
  } catch (error) {
    console.error('Exploration failed:', error.message);
    await page.screenshot({ path: 'exploration-error-screenshot.png' });
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
}

// Run the exploration
explorePage()
  .then(() => {
    console.log('Exploration completed!');
  })
  .catch(error => {
    console.error('Exploration execution failed:', error);
  });