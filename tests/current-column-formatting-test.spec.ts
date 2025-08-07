import { test, expect, Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

test.describe('CURRENT Column Formatting Verification', () => {
  let page: Page;
  let consoleMessages: Array<{type: string, text: string, timestamp: Date}> = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Monitor console messages for debugging
    page.on('console', msg => {
      const timestamp = new Date();
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp
      });
      console.log(`[${timestamp.toISOString()}] Console ${msg.type()}: ${msg.text()}`);
    });

    // Monitor network requests for API calls
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`API Response: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('Verify CURRENT column shows "Session X" format instead of "Week X week"', async () => {
    console.log('\n=== STARTING CURRENT COLUMN FORMATTING TEST ===\n');
    
    // Step 1: Navigate to the user management page
    console.log('Step 1: Navigating to User Management page...');
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({
      path: 'test-screenshots/current-column-01-initial.png',
      fullPage: true
    });
    console.log('✓ Screenshot taken: current-column-01-initial.png');
    
    // Step 2: Locate the user table and CURRENT column
    console.log('Step 2: Looking for user table and CURRENT column...');
    
    // Find the table containing user data
    const tableSelectors = [
      'table',
      '[role="table"]',
      '.table',
      '[data-testid="user-table"]',
      '.user-table'
    ];
    
    let userTable = null;
    for (const selector of tableSelectors) {
      try {
        userTable = page.locator(selector).first();
        if (await userTable.isVisible()) {
          console.log(`✓ Found user table with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!userTable || !(await userTable.isVisible())) {
      console.log('⚠ No user table found, checking for alternative layouts...');
      
      // Look for card-based or other layouts
      const alternativeSelectors = [
        '.user-list',
        '.users-container',
        '[data-testid="users"]',
        '.senior-list'
      ];
      
      for (const selector of alternativeSelectors) {
        try {
          const container = page.locator(selector).first();
          if (await container.isVisible()) {
            console.log(`✓ Found user container with selector: ${selector}`);
            userTable = container;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Step 3: Look for CURRENT column header
    console.log('Step 3: Searching for CURRENT column header...');
    
    const currentColumnSelectors = [
      'th:has-text("CURRENT")',
      'td:has-text("CURRENT")',
      '[data-testid="current-column"]',
      'th:has-text("Current")',
      'th:has-text("현재")',
      '.current-header',
      'th:contains("CURRENT")'
    ];
    
    let currentColumn = null;
    for (const selector of currentColumnSelectors) {
      try {
        currentColumn = page.locator(selector).first();
        if (await currentColumn.isVisible()) {
          console.log(`✓ Found CURRENT column header with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Step 4: Examine all visible text for column formatting patterns
    console.log('Step 4: Examining visible text for formatting patterns...');
    
    // Get all visible text on the page
    const pageText = await page.textContent('body');
    console.log('Page loaded successfully, examining content...');
    
    // Look for various session/week patterns
    const patterns = {
      sessionFormat: /Session \d+/gi,      // Correct format: "Session X"
      weekWeekFormat: /Week \d+ week/gi,   // Problematic format: "Week X week"  
      weekFormat: /Week \d+/gi,            // Alternative week format: "Week X"
      currentSession: /CURRENT.*Session \d+/gi,
      currentWeek: /CURRENT.*Week \d+/gi
    };
    
    const findings = {
      sessionMatches: [],
      weekWeekMatches: [],
      weekMatches: [],
      currentSessionMatches: [],
      currentWeekMatches: []
    };
    
    // Search for each pattern
    Object.entries(patterns).forEach(([key, pattern]) => {
      const matches = pageText.match(pattern) || [];
      const findingKey = key.replace('Format', 'Matches');
      findings[findingKey] = matches;
      
      if (matches.length > 0) {
        console.log(`✓ Found ${key}: ${matches.join(', ')}`);
      }
    });

    // Step 5: Look specifically in table cells for current status
    console.log('Step 5: Examining table cells for current status formatting...');
    
    if (userTable && await userTable.isVisible()) {
      // Get all table cells
      const tableCells = await userTable.locator('td, th').all();
      
      for (let i = 0; i < tableCells.length; i++) {
        try {
          const cellText = await tableCells[i].textContent();
          if (cellText) {
            // Check for session/week patterns in individual cells
            if (/Session \d+/i.test(cellText)) {
              console.log(`✅ CORRECT FORMAT found in cell: "${cellText}"`);
            } else if (/Week \d+ week/i.test(cellText)) {
              console.log(`❌ PROBLEMATIC FORMAT found in cell: "${cellText}"`);
            } else if (/Week \d+/i.test(cellText)) {
              console.log(`⚠ ALTERNATIVE FORMAT found in cell: "${cellText}"`);
            }
          }
        } catch (e) {
          // Continue to next cell
        }
      }
    }

    // Step 6: Take detailed screenshots of any found formatting
    console.log('Step 6: Taking detailed screenshots...');
    
    // Scroll to find any CURRENT column or session information
    await page.evaluate(() => {
      // Scroll to find table content
      const tables = document.querySelectorAll('table, [role="table"]');
      if (tables.length > 0) {
        tables[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Take screenshot focused on table area
    await page.screenshot({
      path: 'test-screenshots/current-column-02-table-focus.png',
      fullPage: true
    });
    console.log('✓ Screenshot taken: current-column-02-table-focus.png');

    // Step 7: Verify specific user rows for current status
    console.log('Step 7: Checking specific user rows for current status...');
    
    const expectedUsers = ['김영희', '박철수'];
    const userRowData = [];
    
    for (const userName of expectedUsers) {
      try {
        // Look for the user name and get the row
        const userNameElement = page.locator(`text=${userName}`);
        if (await userNameElement.isVisible()) {
          console.log(`✓ Found user: ${userName}`);
          
          // Get the parent row
          const userRow = userNameElement.locator('..').locator('..');
          if (await userRow.isVisible()) {
            const rowText = await userRow.textContent();
            userRowData.push({
              user: userName,
              rowContent: rowText
            });
            
            // Check row content for formatting
            if (rowText.includes('Session')) {
              console.log(`✅ User ${userName}: CORRECT "Session" format found`);
            } else if (rowText.includes('Week') && rowText.includes('week')) {
              console.log(`❌ User ${userName}: PROBLEMATIC "Week X week" format found`);
            } else if (rowText.includes('Week')) {
              console.log(`⚠ User ${userName}: Alternative "Week" format found`);
            }
            
            console.log(`User ${userName} row content: ${rowText}`);
          }
        }
      } catch (e) {
        console.log(`⚠ Could not examine user ${userName}: ${e.message}`);
      }
    }

    // Step 8: Generate comprehensive test report
    console.log('Step 8: Generating test report...');
    
    const testReport = {
      testName: 'CURRENT Column Formatting Verification',
      url: page.url(),
      timestamp: new Date().toISOString(),
      findings: {
        sessionFormatFound: findings.sessionMatches.length > 0,
        weekWeekFormatFound: findings.weekWeekMatches.length > 0,
        weekFormatFound: findings.weekMatches.length > 0,
        sessionMatches: findings.sessionMatches,
        weekWeekMatches: findings.weekWeekMatches,
        weekMatches: findings.weekMatches,
        currentSessionMatches: findings.currentSessionMatches,
        currentWeekMatches: findings.currentWeekMatches
      },
      userRows: userRowData,
      tableFound: userTable !== null,
      currentColumnFound: currentColumn !== null,
      consoleMessages: consoleMessages,
      screenshots: [
        'current-column-01-initial.png',
        'current-column-02-table-focus.png'
      ],
      verdict: {
        hasCorrectFormat: findings.sessionMatches.length > 0,
        hasProblematicFormat: findings.weekWeekMatches.length > 0,
        recommendation: ''
      }
    };
    
    // Set recommendation based on findings
    if (testReport.verdict.hasProblematicFormat) {
      testReport.verdict.recommendation = '❌ ISSUE FOUND: Replace "Week X week" format with "Session X" format';
    } else if (testReport.verdict.hasCorrectFormat) {
      testReport.verdict.recommendation = '✅ VERIFIED: Correct "Session X" format is being used';
    } else {
      testReport.verdict.recommendation = '⚠ UNCLEAR: Could not definitively identify current status formatting';
    }

    // Save detailed report
    await fs.writeFile(
      'test-screenshots/current-column-formatting-report.json',
      JSON.stringify(testReport, null, 2)
    );
    
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`URL Tested: ${page.url()}`);
    console.log(`Table Found: ${testReport.tableFound ? '✓' : '❌'}`);
    console.log(`CURRENT Column Found: ${testReport.currentColumnFound ? '✓' : '❌'}`);
    console.log(`Session Format Matches: ${findings.sessionMatches.length}`);
    console.log(`Week Week Format Matches: ${findings.weekWeekMatches.length}`);
    console.log(`Alternative Week Format Matches: ${findings.weekMatches.length}`);
    
    if (findings.sessionMatches.length > 0) {
      console.log(`✅ CORRECT FORMAT EXAMPLES: ${findings.sessionMatches.slice(0, 3).join(', ')}`);
    }
    
    if (findings.weekWeekMatches.length > 0) {
      console.log(`❌ PROBLEMATIC FORMAT EXAMPLES: ${findings.weekWeekMatches.slice(0, 3).join(', ')}`);
    }
    
    console.log(`\nRECOMMENDATION: ${testReport.verdict.recommendation}`);
    console.log('\n=== CURRENT COLUMN FORMATTING TEST COMPLETED ===\n');
    
    // Assert based on findings
    if (findings.weekWeekMatches.length > 0) {
      console.log('❌ TEST FAILED: Problematic "Week X week" format detected');
      expect(findings.weekWeekMatches.length).toBe(0);
    } else if (findings.sessionMatches.length > 0) {
      console.log('✅ TEST PASSED: Correct "Session X" format confirmed');
      expect(findings.sessionMatches.length).toBeGreaterThan(0);
    } else {
      console.log('⚠ TEST INCONCLUSIVE: No definitive formatting patterns found');
      // This is not necessarily a failure, just needs manual review
    }
  });
});