const { chromium } = require('playwright');

async function testCurrentColumnFormat() {
  console.log('Starting User Management CURRENT column test...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to the User Management URL
    console.log('Step 1: Navigating to User Management page...');
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to login (which we expect)
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('Redirected to login page as expected. Proceeding with authentication...');
      
      // Take screenshot of login page
      await page.screenshot({ path: '01-login-page.png' });
      
      // Fill in login credentials (using common test credentials)
      console.log('Filling login credentials...');
      await page.fill('input[type="email"], input[name="email"]', 'admin@andrewsclinic.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      
      // Take screenshot of filled form
      await page.screenshot({ path: '02-login-filled.png' });
      
      // Click sign in button
      console.log('Clicking sign in button...');
      await page.click('button[type="submit"], button:has-text("Sign in")');
      
      // Wait for navigation or authentication
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Give time for authentication to complete
      
      // Take screenshot after login attempt
      await page.screenshot({ path: '03-after-login.png' });
      
      // Check if we're now authenticated and try to navigate to users page
      const afterLoginUrl = page.url();
      console.log('URL after login attempt:', afterLoginUrl);
      
      if (!afterLoginUrl.includes('/users')) {
        // Navigate to the users page directly
        console.log('Navigating directly to User Management page...');
        await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }
    }
    
    // Step 2: Take a screenshot of the User Management page
    console.log('Step 2: Taking full page screenshot of User Management...');
    await page.screenshot({ 
      path: '04-user-management-full.png', 
      fullPage: true 
    });
    
    // Step 3: Look for the CURRENT column and table structure
    console.log('Step 3: Looking for CURRENT column...');
    
    // Try multiple selectors to find tables
    let table = null;
    let tableFound = false;
    
    const tableSelectors = [
      'table',
      '[role="table"]',
      'div[class*="table"]',
      '.table',
      '[data-testid*="table"]'
    ];
    
    for (const selector of tableSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        console.log(`Found ${elements} elements with selector: ${selector}`);
        table = page.locator(selector).first();
        tableFound = true;
        break;
      }
    }
    
    if (!tableFound) {
      console.log('No standard table found. Looking for any data structure...');
      
      // Look for column headers
      const headerPatterns = [
        ':has-text("CURRENT")',
        ':has-text("Current")', 
        ':has-text("current")',
        'th:has-text("CURRENT")',
        'div:has-text("CURRENT")',
        '[class*="header"]:has-text("CURRENT")'
      ];
      
      for (const pattern of headerPatterns) {
        const elements = await page.locator(pattern).count();
        if (elements > 0) {
          console.log(`Found CURRENT header with pattern: ${pattern}`);
          const headerElement = page.locator(pattern).first();
          await headerElement.screenshot({ path: '05-current-header.png' });
          break;
        }
      }
    }
    
    // Step 4: Check all entries in the CURRENT column
    console.log('Step 4: Analyzing CURRENT column entries...');
    
    const analysisResults = {
      totalEntries: 0,
      sessionsWithWeek: [],
      sessionsWithoutWeek: [],
      otherFormats: [],
      allEntries: []
    };
    
    if (tableFound && table) {
      try {
        // Look for CURRENT column header
        const headers = await table.locator('th, [role="columnheader"]').all();
        let currentColumnIndex = -1;
        
        for (let i = 0; i < headers.length; i++) {
          const headerText = await headers[i].textContent();
          console.log(`Header ${i}: "${headerText}"`);
          if (headerText && headerText.toUpperCase().includes('CURRENT')) {
            currentColumnIndex = i;
            console.log(`CURRENT column found at index: ${currentColumnIndex}`);
            break;
          }
        }
        
        if (currentColumnIndex >= 0) {
          // Get all data rows
          const rows = await table.locator('tbody tr, tr:not(:first-child)').all();
          console.log(`Found ${rows.length} data rows`);
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = await row.locator('td, [role="cell"]').all();
            
            if (cells.length > currentColumnIndex) {
              const cellText = await cells[currentColumnIndex].textContent();
              const cleanText = cellText?.trim() || '';
              
              analysisResults.allEntries.push({
                rowIndex: i + 1,
                content: cleanText
              });
              
              // Analyze the format
              if (cleanText.match(/Session\s+\d+\s+week/i)) {
                analysisResults.sessionsWithWeek.push({
                  rowIndex: i + 1,
                  content: cleanText
                });
              } else if (cleanText.match(/Session\s+\d+$/i)) {
                analysisResults.sessionsWithoutWeek.push({
                  rowIndex: i + 1,
                  content: cleanText
                });
              } else if (cleanText && cleanText !== '') {
                analysisResults.otherFormats.push({
                  rowIndex: i + 1,
                  content: cleanText
                });
              }
            }
          }
          
          analysisResults.totalEntries = analysisResults.allEntries.length;
        }
      } catch (error) {
        console.log('Error analyzing table:', error.message);
      }
    }
    
    // Alternative: Look for any text containing "Session" on the page
    console.log('Step 5: Looking for any Session-related text on page...');
    const sessionElements = await page.locator(':has-text("Session")').all();
    
    for (let i = 0; i < Math.min(sessionElements.length, 20); i++) {
      const element = sessionElements[i];
      const text = await element.textContent();
      const cleanText = text?.trim();
      
      if (cleanText && cleanText.match(/Session\s+\d+/i)) {
        console.log(`Session element ${i + 1}: "${cleanText}"`);
        
        // Add to analysis if not already captured
        const alreadyCaptured = analysisResults.allEntries.some(entry => 
          entry.content === cleanText
        );
        
        if (!alreadyCaptured) {
          if (cleanText.match(/Session\s+\d+\s+week/i)) {
            analysisResults.sessionsWithWeek.push({
              rowIndex: `element-${i + 1}`,
              content: cleanText
            });
          } else if (cleanText.match(/Session\s+\d+$/i)) {
            analysisResults.sessionsWithoutWeek.push({
              rowIndex: `element-${i + 1}`,
              content: cleanText
            });
          }
        }
      }
    }
    
    // Step 6: Take focused screenshots
    console.log('Step 6: Taking focused screenshots...');
    
    if (table) {
      try {
        await table.screenshot({ path: '06-table-focused.png' });
      } catch (error) {
        console.log('Could not take table screenshot:', error.message);
      }
    }
    
    // Take a screenshot of any visible session data
    if (sessionElements.length > 0) {
      try {
        await sessionElements[0].screenshot({ path: '07-session-data-focused.png' });
      } catch (error) {
        console.log('Could not take session data screenshot:', error.message);
      }
    }
    
    // Final comprehensive screenshot
    await page.screenshot({ 
      path: '08-final-comprehensive.png', 
      fullPage: true 
    });
    
    // Step 7: Report findings
    console.log('\n=== USER MANAGEMENT CURRENT COLUMN TEST RESULTS ===');
    console.log(`Current URL: ${page.url()}`);
    console.log(`Total entries found: ${analysisResults.totalEntries}`);
    console.log(`Entries with "week" text: ${analysisResults.sessionsWithWeek.length}`);
    console.log(`Entries without "week" text (Session X format): ${analysisResults.sessionsWithoutWeek.length}`);
    console.log(`Other format entries: ${analysisResults.otherFormats.length}`);
    
    if (analysisResults.allEntries.length > 0) {
      console.log('\nAll CURRENT column entries:');
      analysisResults.allEntries.forEach(entry => {
        console.log(`  Row ${entry.rowIndex}: "${entry.content}"`);
      });
    }
    
    if (analysisResults.sessionsWithWeek.length > 0) {
      console.log('\n❌ Entries still containing "week":');
      analysisResults.sessionsWithWeek.forEach(entry => {
        console.log(`  Row ${entry.rowIndex}: "${entry.content}"`);
      });
    }
    
    if (analysisResults.sessionsWithoutWeek.length > 0) {
      console.log('\n✅ Entries with correct "Session X" format:');
      analysisResults.sessionsWithoutWeek.forEach(entry => {
        console.log(`  Row ${entry.rowIndex}: "${entry.content}"`);
      });
    }
    
    if (analysisResults.otherFormats.length > 0) {
      console.log('\n📝 Other format entries:');
      analysisResults.otherFormats.forEach(entry => {
        console.log(`  Row ${entry.rowIndex}: "${entry.content}"`);
      });
    }
    
    // Final assessment
    const weekTextRemoved = analysisResults.sessionsWithWeek.length === 0;
    const hasSessionData = analysisResults.sessionsWithoutWeek.length > 0 || analysisResults.sessionsWithWeek.length > 0;
    
    console.log(`\n=== FINAL ASSESSMENT ===`);
    console.log(`Has session data: ${hasSessionData ? 'YES' : 'NO'}`);
    console.log(`Week text removal status: ${weekTextRemoved ? '✅ SUCCESS' : '❌ INCOMPLETE'}`);
    
    if (!hasSessionData) {
      console.log(`⚠️  No session data found - this could indicate:`);
      console.log(`   - No users are currently enrolled in sessions`);
      console.log(`   - The page structure has changed`);
      console.log(`   - Authentication issues preventing data display`);
      console.log(`   - The CURRENT column may be named differently`);
    }
    
    return {
      weekTextRemoved,
      hasSessionData,
      analysisResults,
      screenshots: [
        '01-login-page.png',
        '02-login-filled.png', 
        '03-after-login.png',
        '04-user-management-full.png',
        '05-current-header.png',
        '06-table-focused.png',
        '07-session-data-focused.png',
        '08-final-comprehensive.png'
      ]
    };
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
    
    // Take an error screenshot
    await page.screenshot({ path: '99-error-screenshot.png' });
    
    return {
      error: error.message,
      screenshots: ['99-error-screenshot.png']
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testCurrentColumnFormat()
  .then(results => {
    console.log('\n🏁 Test completed!');
    if (results.error) {
      console.log('❌ Error occurred:', results.error);
    } else {
      console.log(`📸 Screenshots saved: ${results.screenshots?.join(', ')}`);
      
      if (results.hasSessionData) {
        if (results.weekTextRemoved) {
          console.log('🎉 SUCCESS: Week text has been successfully removed from CURRENT column!');
        } else {
          console.log('⚠️  INCOMPLETE: Some entries still contain "week" text');
        }
      } else {
        console.log('ℹ️  No session data found to verify week text removal');
      }
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  });