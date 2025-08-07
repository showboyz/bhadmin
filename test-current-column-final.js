const { chromium } = require('playwright');
const fs = require('fs').promises;

async function testCurrentColumnFormat() {
  console.log('\n=== FINAL CURRENT COLUMN FORMAT VERIFICATION ===\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-web-security']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  let consoleMessages = [];
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
    console.log('Step 1: Attempting to navigate directly to User Management page...');
    
    // First try to access the users page directly
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Take screenshot of current state
    await page.screenshot({
      path: 'test-screenshots/current-column-verification-01.png',
      fullPage: true
    });
    console.log('✓ Screenshot taken: current-column-verification-01.png');
    
    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('Step 2: Login required, attempting authentication...');
      
      // Fill login form
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'admin123');
      
      await page.screenshot({
        path: 'test-screenshots/current-column-verification-02-login.png',
        fullPage: true
      });
      
      // Click login
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      // Navigate to users page after login
      await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      await page.waitForTimeout(5000);
    }
    
    console.log('Step 3: Examining the current page state...');
    
    // Take final screenshot
    await page.screenshot({
      path: 'test-screenshots/current-column-verification-03-final.png',
      fullPage: true
    });
    console.log('✓ Final screenshot taken: current-column-verification-03-final.png');
    
    // Get page content for analysis
    const pageText = await page.textContent('body');
    const pageTitle = await page.title();
    const currentUrl = page.url();
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Page Title: ${pageTitle}`);
    
    // Check for table structure
    const tables = await page.locator('table').count();
    console.log(`Tables found: ${tables}`);
    
    // Look for CURRENT column header
    const currentColumnVisible = await page.locator('th:has-text("CURRENT")').isVisible().catch(() => false);
    console.log(`CURRENT column header visible: ${currentColumnVisible}`);
    
    // Search for formatting patterns in page text
    const patterns = {
      sessionFormat: (pageText.match(/Session \d+/gi) || []),
      weekWeekFormat: (pageText.match(/Week \d+ week/gi) || []),
      weekFormat: (pageText.match(/Week \d+(?! week)/gi) || []),
      numberWeekFormat: (pageText.match(/\d+ week(?!s)/gi) || [])
    };
    
    console.log('\n=== PATTERN ANALYSIS ===');
    Object.entries(patterns).forEach(([key, matches]) => {
      console.log(`${key}: ${matches.length} matches`);
      if (matches.length > 0) {
        console.log(`  Examples: ${matches.slice(0, 3).join(', ')}`);
      }
    });
    
    // Check individual table cells if table exists
    if (tables > 0 && currentColumnVisible) {
      console.log('\n=== TABLE CELL ANALYSIS ===');
      const tableCells = await page.locator('table td').all();
      console.log(`Found ${tableCells.length} table cells`);
      
      let cellsExamined = 0;
      for (let i = 0; i < Math.min(tableCells.length, 50); i++) {
        try {
          const cellText = await tableCells[i].textContent();
          if (cellText && cellText.trim()) {
            cellsExamined++;
            const trimmedText = cellText.trim();
            
            // Check for various patterns
            if (/Session \d+/i.test(trimmedText)) {
              console.log(`✅ CORRECT FORMAT in cell ${i}: "${trimmedText}"`);
            } else if (/Week \d+ week/i.test(trimmedText)) {
              console.log(`❌ PROBLEMATIC FORMAT in cell ${i}: "${trimmedText}"`);
            } else if (/\d+ week/i.test(trimmedText)) {
              console.log(`⚠ POTENTIAL ISSUE in cell ${i}: "${trimmedText}"`);
            }
          }
        } catch (e) {
          // Continue to next cell
        }
      }
      
      console.log(`Examined ${cellsExamined} cells with content`);
    }
    
    // Look for specific Korean user names from the screenshot
    const koreanUsers = ['김영희', '박철수', '정화미'];
    console.log('\n=== SPECIFIC USER ANALYSIS ===');
    
    for (const userName of koreanUsers) {
      try {
        const userVisible = await page.locator(`text=${userName}`).isVisible();
        if (userVisible) {
          console.log(`✓ Found user: ${userName}`);
          
          // Try to get the row data for this user
          const userRow = page.locator(`tr:has(td:has-text("${userName}"))`);
          const rowVisible = await userRow.isVisible();
          
          if (rowVisible) {
            const rowText = await userRow.textContent();
            console.log(`  Row content: ${rowText}`);
            
            // Check for formatting in this specific row
            if (/Session \d+/i.test(rowText)) {
              console.log(`  ✅ ${userName}: CORRECT "Session X" format`);
            } else if (/Week \d+ week/i.test(rowText)) {
              console.log(`  ❌ ${userName}: PROBLEMATIC "Week X week" format`);
            } else if (/\d+ week/i.test(rowText)) {
              console.log(`  ⚠ ${userName}: Numbers with "week" suffix`);
            }
          }
        } else {
          console.log(`- User ${userName} not found on current page`);
        }
      } catch (e) {
        console.log(`- Error checking user ${userName}: ${e.message}`);
      }
    }
    
    // Generate comprehensive report
    const report = {
      testName: 'CURRENT Column Format Verification',
      timestamp: new Date().toISOString(),
      url: currentUrl,
      pageTitle: pageTitle,
      tablesFound: tables,
      currentColumnVisible: currentColumnVisible,
      patterns: patterns,
      verdict: {
        hasCorrectSessionFormat: patterns.sessionFormat.length > 0,
        hasProblematicWeekWeekFormat: patterns.weekWeekFormat.length > 0,
        hasNumberWeekFormat: patterns.numberWeekFormat.length > 0,
        recommendation: ''
      },
      consoleMessages: consoleMessages.slice(-20),
      screenshots: [
        'current-column-verification-01.png',
        'current-column-verification-02-login.png',
        'current-column-verification-03-final.png'
      ]
    };
    
    // Set recommendation based on findings
    if (report.verdict.hasProblematicWeekWeekFormat) {
      report.verdict.recommendation = '❌ ISSUE FOUND: "Week X week" format detected - needs immediate fix';
    } else if (report.verdict.hasCorrectSessionFormat) {
      report.verdict.recommendation = '✅ SUCCESS: Correct "Session X" format confirmed';
    } else if (report.verdict.hasNumberWeekFormat) {
      report.verdict.recommendation = '⚠ REVIEW NEEDED: Number + "week" format found - may need to change to "Session X"';
    } else if (!currentColumnVisible) {
      report.verdict.recommendation = '⚠ NO ACCESS: Could not access CURRENT column - authentication or permission issue';
    } else {
      report.verdict.recommendation = '⚠ UNCLEAR: Unable to determine current status formatting';
    }
    
    // Save report
    await fs.writeFile(
      'test-screenshots/current-column-verification-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n=== FINAL TEST RESULTS ===');
    console.log(`URL: ${report.url}`);
    console.log(`Page Title: ${report.pageTitle}`);
    console.log(`Tables Found: ${report.tablesFound}`);
    console.log(`CURRENT Column Visible: ${report.currentColumnVisible}`);
    console.log(`Session Format Instances: ${patterns.sessionFormat.length}`);
    console.log(`Problematic Week+Week Format: ${patterns.weekWeekFormat.length}`);
    console.log(`Number+Week Format: ${patterns.numberWeekFormat.length}`);
    
    if (patterns.sessionFormat.length > 0) {
      console.log(`\n✅ CORRECT FORMATS FOUND: ${patterns.sessionFormat.join(', ')}`);
    }
    
    if (patterns.weekWeekFormat.length > 0) {
      console.log(`\n❌ PROBLEMATIC FORMATS FOUND: ${patterns.weekWeekFormat.join(', ')}`);
    }
    
    if (patterns.numberWeekFormat.length > 0) {
      console.log(`\n⚠ NUMBER+WEEK FORMATS FOUND: ${patterns.numberWeekFormat.join(', ')}`);
    }
    
    console.log(`\nRECOMMENDATION: ${report.verdict.recommendation}`);
    console.log('\n=== TEST COMPLETED ===\n');
    
  } catch (error) {
    console.error('Test error:', error);
    
    await page.screenshot({
      path: 'test-screenshots/current-column-verification-error.png',
      fullPage: true
    });
    
    console.log('Error screenshot saved: current-column-verification-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testCurrentColumnFormat().catch(console.error);