const { chromium } = require('playwright');
const fs = require('fs').promises;

async function testCurrentColumnFormatting() {
  console.log('\n=== CURRENT COLUMN FORMATTING TEST WITH AUTHENTICATION ===\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // Monitor console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp
    });
    console.log(`[${timestamp}] Console ${msg.type()}: ${msg.text()}`);
  });

  try {
    // Step 1: Navigate to login page first
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'test-screenshots/auth-01-login-page.png',
      fullPage: true 
    });
    console.log('✓ Login page screenshot taken');
    
    // Step 2: Fill in login credentials
    console.log('Step 2: Filling in login credentials...');
    
    // Look for email/username field
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="이메일" i]',
      '#email',
      '.email'
    ];
    
    let emailField = null;
    for (const selector of emailSelectors) {
      try {
        emailField = page.locator(selector).first();
        if (await emailField.isVisible()) {
          console.log(`✓ Found email field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Look for password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="비밀번호" i]',
      '#password',
      '.password'
    ];
    
    let passwordField = null;
    for (const selector of passwordSelectors) {
      try {
        passwordField = page.locator(selector).first();
        if (await passwordField.isVisible()) {
          console.log(`✓ Found password field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (emailField && passwordField) {
      // Try common admin credentials
      const credentials = [
        { email: 'admin@test.com', password: 'admin123' },
        { email: 'test@example.com', password: 'password123' },
        { email: 'admin@admin.com', password: 'admin' },
        { email: 'admin@brainhealth.com', password: 'admin123' }
      ];
      
      for (const cred of credentials) {
        console.log(`Trying credentials: ${cred.email}`);
        
        await emailField.fill(cred.email);
        await passwordField.fill(cred.password);
        
        // Take screenshot with filled credentials
        await page.screenshot({ 
          path: `test-screenshots/auth-02-credentials-${cred.email.split('@')[0]}.png`,
          fullPage: true 
        });
        
        // Look for login button
        const loginButtonSelectors = [
          'button[type="submit"]',
          'button:has-text("Login")',
          'button:has-text("로그인")',
          'button:has-text("Sign in")',
          '.login-button',
          '.btn-login'
        ];
        
        let loginButton = null;
        for (const selector of loginButtonSelectors) {
          try {
            loginButton = page.locator(selector).first();
            if (await loginButton.isVisible()) {
              console.log(`✓ Found login button with selector: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (loginButton) {
          await loginButton.click();
          console.log('✓ Login button clicked');
          
          // Wait for navigation or error
          await page.waitForTimeout(3000);
          
          const currentUrl = page.url();
          console.log(`Current URL after login attempt: ${currentUrl}`);
          
          // Check if we're still on login page (failed) or redirected (success)
          if (!currentUrl.includes('/login')) {
            console.log('✅ Login successful! Redirected away from login page');
            break;
          } else {
            console.log('❌ Login failed, trying next credentials...');
            await emailField.fill('');
            await passwordField.fill('');
            continue;
          }
        }
      }
    }
    
    // Step 3: Navigate to User Management page
    console.log('Step 3: Navigating to User Management page...');
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(5000); // Wait for data to load
    
    // Take screenshot of user management page
    await page.screenshot({ 
      path: 'test-screenshots/auth-03-user-management.png',
      fullPage: true 
    });
    console.log('✓ User management page screenshot taken');
    
    // Step 4: Examine page content for CURRENT column formatting
    console.log('Step 4: Examining page for CURRENT column formatting...');
    
    const pageText = await page.textContent('body');
    const pageHtml = await page.innerHTML('body');
    
    // Look for formatting patterns
    const patterns = {
      sessionFormat: /Session \d+/gi,
      weekWeekFormat: /Week \d+ week/gi,
      weekFormat: /Week \d+(?! week)/gi,
      currentLabel: /CURRENT|Current|현재/gi
    };
    
    const findings = {};
    Object.entries(patterns).forEach(([key, pattern]) => {
      const matches = pageText.match(pattern) || [];
      findings[key] = matches;
      
      if (matches.length > 0) {
        console.log(`✓ Found ${key}: ${matches.join(', ')}`);
      } else {
        console.log(`- No ${key} found`);
      }
    });
    
    // Step 5: Look specifically for table structure
    console.log('Step 5: Analyzing table structure...');
    
    const tables = await page.locator('table').all();
    console.log(`Found ${tables.length} tables on the page`);
    
    if (tables.length > 0) {
      for (let i = 0; i < tables.length; i++) {
        console.log(`\nAnalyzing table ${i + 1}:`);
        
        const tableText = await tables[i].textContent();
        console.log(`Table content preview: ${tableText.substring(0, 200)}...`);
        
        // Look for headers
        const headers = await tables[i].locator('th').all();
        const headerTexts = [];
        
        for (const header of headers) {
          const headerText = await header.textContent();
          headerTexts.push(headerText);
        }
        
        console.log(`Headers found: ${headerTexts.join(' | ')}`);
        
        // Check if this table contains CURRENT column
        const hasCurrent = headerTexts.some(h => /CURRENT|Current|현재/i.test(h));
        if (hasCurrent) {
          console.log('✅ Found table with CURRENT column!');
          
          // Get all table cells
          const cells = await tables[i].locator('td').all();
          console.log(`Found ${cells.length} table cells`);
          
          for (let j = 0; j < Math.min(cells.length, 20); j++) { // Limit to first 20 cells
            const cellText = await cells[j].textContent();
            if (cellText && cellText.trim()) {
              if (/Session \d+/i.test(cellText)) {
                console.log(`✅ CORRECT FORMAT in cell: "${cellText.trim()}"`);
              } else if (/Week \d+ week/i.test(cellText)) {
                console.log(`❌ PROBLEMATIC FORMAT in cell: "${cellText.trim()}"`);
              } else if (/Week \d+/i.test(cellText)) {
                console.log(`⚠ ALTERNATIVE FORMAT in cell: "${cellText.trim()}"`);
              }
            }
          }
        }
      }
    }
    
    // Step 6: Take focused screenshot of any table content
    console.log('Step 6: Taking focused screenshots...');
    
    if (tables.length > 0) {
      await tables[0].scrollIntoView();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'test-screenshots/auth-04-table-focus.png',
        fullPage: true 
      });
      console.log('✓ Table focus screenshot taken');
    }
    
    // Step 7: Generate comprehensive report
    console.log('Step 7: Generating comprehensive report...');
    
    const report = {
      testName: 'CURRENT Column Formatting Test with Authentication',
      url: page.url(),
      timestamp: new Date().toISOString(),
      loginAttempted: true,
      tablesFound: tables.length,
      findings: findings,
      consoleMessages: consoleMessages.slice(-50), // Last 50 messages
      verdict: {
        sessionFormatFound: (findings.sessionFormat || []).length > 0,
        problematicFormatFound: (findings.weekWeekFormat || []).length > 0,
        weekFormatFound: (findings.weekFormat || []).length > 0,
        currentColumnIdentified: (findings.currentLabel || []).length > 0
      },
      screenshots: [
        'auth-01-login-page.png',
        'auth-03-user-management.png',
        'auth-04-table-focus.png'
      ]
    };
    
    // Set recommendation
    if (report.verdict.problematicFormatFound) {
      report.recommendation = '❌ ISSUE FOUND: "Week X week" format detected - needs to be fixed';
    } else if (report.verdict.sessionFormatFound) {
      report.recommendation = '✅ SUCCESS: "Session X" format confirmed';
    } else if (report.verdict.weekFormatFound) {
      report.recommendation = '⚠ REVIEW NEEDED: "Week X" format found - may need conversion to "Session X"';
    } else {
      report.recommendation = '⚠ UNCLEAR: Unable to identify current status formatting';
    }
    
    // Save report
    await fs.writeFile(
      'test-screenshots/current-column-auth-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n=== FINAL TEST RESULTS ===');
    console.log(`URL: ${report.url}`);
    console.log(`Tables Found: ${report.tablesFound}`);
    console.log(`Session Format Matches: ${(findings.sessionFormat || []).length}`);
    console.log(`Week Week Format Matches: ${(findings.weekWeekFormat || []).length}`);
    console.log(`Week Format Matches: ${(findings.weekFormat || []).length}`);
    console.log(`CURRENT Column Identified: ${report.verdict.currentColumnIdentified}`);
    console.log(`\nRECOMMENDATION: ${report.recommendation}`);
    
    if (findings.sessionFormat && findings.sessionFormat.length > 0) {
      console.log(`\n✅ CORRECT FORMATS FOUND: ${findings.sessionFormat.join(', ')}`);
    }
    
    if (findings.weekWeekFormat && findings.weekWeekFormat.length > 0) {
      console.log(`\n❌ PROBLEMATIC FORMATS FOUND: ${findings.weekWeekFormat.join(', ')}`);
    }
    
    console.log('\n=== TEST COMPLETED ===\n');
    
  } catch (error) {
    console.error('Test error:', error);
    
    await page.screenshot({ 
      path: 'test-screenshots/auth-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testCurrentColumnFormatting().catch(console.error);