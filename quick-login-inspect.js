const { chromium } = require('playwright');

async function quickInspectLogin() {
  const browser = await chromium.launch({ 
    headless: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ path: 'login-form.png', fullPage: true });
    console.log('📸 Login form screenshot saved');
    
    // Inspect form structure
    const formData = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className
      }));
      
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        type: btn.type,
        text: btn.textContent?.trim(),
        className: btn.className
      }));
      
      const pageText = document.body.textContent;
      
      return { inputs, buttons, pageText };
    });
    
    console.log('📋 Login Form Structure:');
    console.log('Inputs:', JSON.stringify(formData.inputs, null, 2));
    console.log('Buttons:', JSON.stringify(formData.buttons, null, 2));
    
    // Check if there are any demo credentials shown on the page
    const demoCredentials = formData.pageText.match(/(demo|test|admin|example)[@\w\.\-]+/gi);
    if (demoCredentials) {
      console.log('🔑 Potential demo credentials found:', demoCredentials);
    }
    
    await browser.close();
    return formData;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
    throw error;
  }
}

quickInspectLogin().catch(console.error);