const { chromium } = require('playwright');

async function testUserManagementPage() {
  console.log('Starting User Management page test...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to the URL
    console.log('Step 1: Navigating to User Management page...');
    await page.goto('http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Additional wait to ensure everything is rendered
    
    // Step 2: Take a screenshot of the full page
    console.log('Step 2: Taking full page screenshot...');
    await page.screenshot({ 
      path: 'full-page-screenshot.png', 
      fullPage: true 
    });
    
    // Step 3: Locate the CURRENT column in the user table
    console.log('Step 3: Locating CURRENT column...');
    
    // First, let's find the table and its headers
    const table = await page.locator('table').first();
    if (await table.count() === 0) {
      throw new Error('No table found on the page');
    }
    
    // Find the CURRENT column header
    const currentColumnHeader = await page.locator('th').filter({ hasText: /CURRENT/i }).first();
    if (await currentColumnHeader.count() === 0) {
      throw new Error('CURRENT column header not found');
    }
    
    const headerIndex = await currentColumnHeader.evaluate(el => {
      const tr = el.closest('tr');
      return Array.from(tr.children).indexOf(el);
    });
    
    console.log(`CURRENT column found at index: ${headerIndex}`);
    
    // Step 4: Check all entries in the CURRENT column
    console.log('Step 4: Checking CURRENT column entries...');
    
    // Get all rows in the table body
    const tableRows = await page.locator('tbody tr').all();
    const currentColumnData = [];
    
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      const cells = await row.locator('td').all();
      
      if (cells.length > headerIndex) {
        const cellText = await cells[headerIndex].textContent();
        currentColumnData.push({
          rowIndex: i + 1,
          content: cellText?.trim() || 'Empty'
        });
      }
    }
    
    console.log('CURRENT column entries:');
    currentColumnData.forEach(entry => {
      console.log(`Row ${entry.rowIndex}: "${entry.content}"`);
    });
    
    // Step 5: Look for entries that should show "Session X" format
    console.log('Step 5: Analyzing entry formats...');
    
    const analysisResults = {
      totalEntries: currentColumnData.length,
      sessionsWithWeek: [],
      sessionsWithoutWeek: [],
      otherFormats: []
    };
    
    currentColumnData.forEach(entry => {
      const content = entry.content;
      
      if (content.match(/Session\s+\d+\s+week/i)) {
        analysisResults.sessionsWithWeek.push(entry);
      } else if (content.match(/Session\s+\d+$/i)) {
        analysisResults.sessionsWithoutWeek.push(entry);
      } else if (content !== 'Empty' && content !== '') {
        analysisResults.otherFormats.push(entry);
      }
    });
    
    // Step 6: Take a focused screenshot of the CURRENT column
    console.log('Step 6: Taking focused screenshot of CURRENT column...');
    
    // Scroll the CURRENT column into view and take a screenshot
    await currentColumnHeader.scrollIntoViewIfNeeded();
    
    // Get the bounding box of the table to focus on it
    const tableBoundingBox = await table.boundingBox();
    
    if (tableBoundingBox) {
      await page.screenshot({
        path: 'current-column-focused.png',
        clip: {
          x: tableBoundingBox.x,
          y: tableBoundingBox.y,
          width: tableBoundingBox.width,
          height: tableBoundingBox.height
        }
      });
    }
    
    // Also take a screenshot of just the header and a few rows for clarity
    await page.screenshot({
      path: 'table-detail-screenshot.png',
      fullPage: false
    });
    
    // Step 7: Report findings
    console.log('\n=== TEST RESULTS ===');
    console.log(`Total entries in CURRENT column: ${analysisResults.totalEntries}`);
    console.log(`Entries with "week" text: ${analysisResults.sessionsWithWeek.length}`);
    console.log(`Entries without "week" text (Session X format): ${analysisResults.sessionsWithoutWeek.length}`);
    console.log(`Other formats: ${analysisResults.otherFormats.length}`);
    
    if (analysisResults.sessionsWithWeek.length > 0) {
      console.log('\nEntries still containing "week":');
      analysisResults.sessionsWithWeek.forEach(entry => {
        console.log(`  Row ${entry.rowIndex}: "${entry.content}"`);
      });
    }
    
    if (analysisResults.sessionsWithoutWeek.length > 0) {
      console.log('\nEntries with correct "Session X" format:');
      analysisResults.sessionsWithoutWeek.forEach(entry => {
        console.log(`  Row ${entry.rowIndex}: "${entry.content}"`);
      });
    }
    
    if (analysisResults.otherFormats.length > 0) {
      console.log('\nOther format entries:');
      analysisResults.otherFormats.forEach(entry => {
        console.log(`  Row ${entry.rowIndex}: "${entry.content}"`);
      });
    }
    
    // Determine success status
    const weekTextRemoved = analysisResults.sessionsWithWeek.length === 0;
    console.log(`\n*** WEEK TEXT REMOVAL STATUS: ${weekTextRemoved ? 'SUCCESS' : 'INCOMPLETE'} ***`);
    
    return {
      weekTextRemoved,
      analysisResults,
      screenshots: [
        'full-page-screenshot.png',
        'current-column-focused.png',
        'table-detail-screenshot.png'
      ]
    };
    
  } catch (error) {
    console.error('Test failed:', error.message);
    
    // Take an error screenshot
    await page.screenshot({ path: 'error-screenshot.png' });
    
    return {
      error: error.message,
      screenshots: ['error-screenshot.png']
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testUserManagementPage()
  .then(results => {
    console.log('\nTest completed successfully!');
    if (results.error) {
      console.log('Error occurred:', results.error);
    }
  })
  .catch(error => {
    console.error('Test execution failed:', error);
  });