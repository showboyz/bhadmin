const { chromium } = require('playwright');

async function inspectLoginForm() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🔍 Navigating to dashboard to trigger login redirect...');
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`📍 Current URL: ${page.url()}`);
    
    // Take a screenshot of the login page
    await page.screenshot({ path: 'login-page-screenshot.png', fullPage: true });
    console.log('📸 Login page screenshot saved as login-page-screenshot.png');
    
    // Inspect the login form
    console.log('🔍 Inspecting login form structure...');
    
    const formInfo = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input');
      const buttons = document.querySelectorAll('button');
      
      const result = {
        forms: [],
        inputs: [],
        buttons: [],
        pageText: document.body.textContent.substring(0, 1000) // First 1000 chars
      };
      
      forms.forEach((form, i) => {
        result.forms.push({
          index: i,
          action: form.action,
          method: form.method,
          innerHTML: form.innerHTML.substring(0, 500)
        });
      });
      
      inputs.forEach((input, i) => {
        result.inputs.push({
          index: i,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          required: input.required,
          className: input.className
        });
      });
      
      buttons.forEach((button, i) => {
        result.buttons.push({
          index: i,
          type: button.type,
          textContent: button.textContent?.trim(),
          className: button.className,
          disabled: button.disabled
        });
      });
      
      return result;
    });
    
    console.log('📋 Form Analysis:');
    console.log('=================');
    console.log('Forms found:', formInfo.forms.length);
    formInfo.forms.forEach(form => {
      console.log(`  Form ${form.index}: action="${form.action}", method="${form.method}"`);
    });
    
    console.log('\nInputs found:', formInfo.inputs.length);
    formInfo.inputs.forEach(input => {
      console.log(`  Input ${input.index}: type="${input.type}", name="${input.name}", id="${input.id}", placeholder="${input.placeholder}"`);
    });
    
    console.log('\nButtons found:', formInfo.buttons.length);
    formInfo.buttons.forEach(button => {
      console.log(`  Button ${button.index}: type="${button.type}", text="${button.textContent}"`);
    });
    
    console.log('\nPage text preview:');
    console.log(formInfo.pageText);
    
    // Try to understand if this is a custom auth or using a service like Supabase
    const hasSupabaseAuth = await page.evaluate(() => {
      return document.body.innerHTML.includes('supabase') || 
             document.body.innerHTML.includes('auth0') ||
             document.body.innerHTML.includes('nextauth');
    });
    
    console.log('\nAuth service detected:', hasSupabaseAuth ? 'Yes' : 'No');
    
    // Check for any existing users or demo accounts mentioned in the UI
    const pageContent = await page.textContent('body');
    const demoAccountMentions = [
      'demo', 'test', 'admin', 'example', 'default',
      'username', 'password', 'credentials', 'login'
    ].filter(term => pageContent.toLowerCase().includes(term));
    
    console.log('\nDemo account keywords found:', demoAccountMentions);
    
    return {
      success: true,
      formInfo,
      hasSupabaseAuth,
      pageContent: pageContent.substring(0, 2000),
      url: page.url()
    };
    
  } catch (error) {
    console.error('❌ Error inspecting login form:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Keep browser open for manual inspection
    console.log('\n⏳ Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close the browser and exit');
    
    // Wait indefinitely until user cancels
    await new Promise(() => {});
  }
}

// Run the inspection
inspectLoginForm().catch(error => {
  console.error('💥 Script error:', error);
});