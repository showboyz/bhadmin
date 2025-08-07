const { chromium } = require('playwright');

async function finalCurrentColumnTest() {
  console.log('=== FINAL CURRENT COLUMN "WEEK" TEXT REMOVAL TEST ===\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to app and set up demo authentication
    console.log('Step 1: Setting up demo authentication...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    // Inject demo authentication to bypass login
    await page.evaluate(() => {
      localStorage.setItem('sb-localhost-auth-token', JSON.stringify({
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        user: {
          id: 'demo-user-123',
          email: 'demo@andrewclinic.com',
          user_metadata: { role: 'org_admin' }
        }
      }));
    });
    
    console.log('✅ Demo authentication set up successfully');
    
    // Step 2: Navigate directly to the User Management page
    console.log('Step 2: Navigating to User Management page...');
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/users', {
      waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(3000); // Give time for page to fully load
    
    // Step 3: Take full page screenshot
    console.log('Step 3: Taking full page screenshot...');
    await page.screenshot({
      path: 'final-01-user-management-page.png',
      fullPage: true
    });
    
    // Step 4: Locate and analyze the CURRENT column
    console.log('Step 4: Analyzing CURRENT column entries...');
    
    const currentColumnAnalysis = await page.evaluate(() => {
      const results = {
        tableFound: false,
        currentColumnFound: false,
        currentColumnIndex: -1,
        allEntries: [],
        sessionsWithWeek: [],
        sessionsWithoutWeek: [],
        otherFormats: []
      };
      
      // Find the table
      const table = document.querySelector('table');
      if (!table) {
        return results;
      }
      results.tableFound = true;
      
      // Find CURRENT column header
      const headers = table.querySelectorAll('th');
      for (let i = 0; i < headers.length; i++) {
        const headerText = headers[i].textContent?.trim().toUpperCase();
        if (headerText === 'CURRENT') {
          results.currentColumnFound = true;
          results.currentColumnIndex = i;
          break;
        }
      }
      
      if (!results.currentColumnFound) {
        return results;
      }
      
      // Get all data rows and extract CURRENT column values
      const dataRows = table.querySelectorAll('tbody tr');
      dataRows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > results.currentColumnIndex) {
          const cellText = cells[results.currentColumnIndex].textContent?.trim() || '';
          
          if (cellText) {
            results.allEntries.push({
              rowIndex: rowIndex + 1,
              content: cellText
            });
            
            // Analyze the format
            if (cellText.match(/Week\s+\d+\s+week/i)) {
              results.sessionsWithWeek.push({
                rowIndex: rowIndex + 1,
                content: cellText,
                issue: 'Contains "week" text - should be "Session X" format'
              });
            } else if (cellText.match(/Session\s+\d+$/i)) {
              results.sessionsWithoutWeek.push({
                rowIndex: rowIndex + 1,
                content: cellText
              });
            } else if (cellText.match(/Week\s+\d+$/i)) {
              results.sessionsWithoutWeek.push({
                rowIndex: rowIndex + 1,
                content: cellText,
                note: 'Week X format (without extra "week")'
              });
            } else {
              results.otherFormats.push({
                rowIndex: rowIndex + 1,
                content: cellText
              });
            }
          }
        }
      });
      
      return results;
    });
    
    // Step 5: Take focused screenshot of the table
    console.log('Step 5: Taking focused screenshot of user table...');
    try {
      await page.locator('table').screenshot({
        path: 'final-02-user-table-focused.png'
      });
    } catch (error) {
      console.log('Could not take table screenshot:', error.message);
    }
    
    // Step 6: Take screenshot of CURRENT column specifically
    console.log('Step 6: Highlighting CURRENT column...');
    if (currentColumnAnalysis.currentColumnFound) {
      await page.evaluate((columnIndex) => {
        const table = document.querySelector('table');
        if (table) {
          // Highlight the CURRENT column header
          const header = table.querySelector(`th:nth-child(${columnIndex + 1})`);
          if (header) {
            header.style.backgroundColor = '#ffeb3b';
            header.style.border = '3px solid #f44336';
          }
          
          // Highlight all CURRENT column cells
          const cells = table.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
          cells.forEach(cell => {
            cell.style.backgroundColor = '#fff3e0';
            cell.style.border = '2px solid #ff9800';
          });
        }
      }, currentColumnAnalysis.currentColumnIndex);
      
      await page.screenshot({
        path: 'final-03-current-column-highlighted.png',
        fullPage: true
      });
    }
    
    // Step 7: Generate detailed report
    console.log('Step 7: Generating detailed findings report...\n');
    
    console.log('=== DETAILED ANALYSIS RESULTS ===');
    console.log(`Table found: ${currentColumnAnalysis.tableFound ? '✅ YES' : '❌ NO'}`);
    console.log(`CURRENT column found: ${currentColumnAnalysis.currentColumnFound ? '✅ YES' : '❌ NO'}`);
    
    if (currentColumnAnalysis.currentColumnFound) {
      console.log(`CURRENT column index: ${currentColumnAnalysis.currentColumnIndex}`);
      console.log(`Total entries in CURRENT column: ${currentColumnAnalysis.allEntries.length}`);
      
      console.log('\n=== ALL CURRENT COLUMN ENTRIES ===');
      currentColumnAnalysis.allEntries.forEach(entry => {
        console.log(`Row ${entry.rowIndex}: "${entry.content}"`);
      });
      
      console.log('\n=== ENTRIES WITH "WEEK" TEXT (ISSUES) ===');
      if (currentColumnAnalysis.sessionsWithWeek.length > 0) {
        console.log(`❌ Found ${currentColumnAnalysis.sessionsWithWeek.length} entries with "week" text:`);
        currentColumnAnalysis.sessionsWithWeek.forEach(entry => {
          console.log(`   Row ${entry.rowIndex}: "${entry.content}" - ${entry.issue}`);
        });
      } else {
        console.log('✅ No entries found with "week" text');
      }
      
      console.log('\n=== ENTRIES WITH CORRECT FORMAT ===');
      if (currentColumnAnalysis.sessionsWithoutWeek.length > 0) {
        console.log(`✅ Found ${currentColumnAnalysis.sessionsWithoutWeek.length} entries with correct format:`);
        currentColumnAnalysis.sessionsWithoutWeek.forEach(entry => {
          console.log(`   Row ${entry.rowIndex}: "${entry.content}"${entry.note ? ` - ${entry.note}` : ''}`);
        });
      } else {
        console.log('❌ No entries found with correct format');
      }
      
      console.log('\n=== OTHER FORMAT ENTRIES ===');
      if (currentColumnAnalysis.otherFormats.length > 0) {
        console.log(`ℹ️  Found ${currentColumnAnalysis.otherFormats.length} entries with other formats:`);
        currentColumnAnalysis.otherFormats.forEach(entry => {
          console.log(`   Row ${entry.rowIndex}: "${entry.content}"`);
        });
      } else {
        console.log('No other format entries found');
      }
    }
    
    // Final assessment
    const weekTextRemoved = currentColumnAnalysis.sessionsWithWeek.length === 0;
    const hasData = currentColumnAnalysis.allEntries.length > 0;
    
    console.log('\n=== FINAL ASSESSMENT ===');
    console.log(`Has CURRENT column data: ${hasData ? '✅ YES' : '❌ NO'}`);
    console.log(`Week text removal completed: ${weekTextRemoved ? '✅ YES' : '❌ NO'}`);
    
    if (!weekTextRemoved && hasData) {
      console.log('\n🚨 WEEK TEXT REMOVAL NOT COMPLETED');
      console.log('The CURRENT column still contains entries with "week" text.');
      console.log('Expected format: "Session 1", "Session 2", etc.');
      console.log('Current format: "Week 1 week", "Week 2 week", etc.');
      console.log('\nAction required: Remove the duplicate "week" text from CURRENT column entries.');
    } else if (weekTextRemoved && hasData) {
      console.log('\n🎉 WEEK TEXT REMOVAL SUCCESSFUL');
      console.log('All entries in the CURRENT column have the correct format.');
    } else if (!hasData) {
      console.log('\n⚠️  NO DATA TO VERIFY');
      console.log('The CURRENT column contains no data to analyze.');
    }
    
    // Return results for further processing
    return {
      success: true,
      tableFound: currentColumnAnalysis.tableFound,
      currentColumnFound: currentColumnAnalysis.currentColumnFound,
      weekTextRemoved,
      hasData,
      totalEntries: currentColumnAnalysis.allEntries.length,
      entriesWithWeek: currentColumnAnalysis.sessionsWithWeek.length,
      entriesWithoutWeek: currentColumnAnalysis.sessionsWithoutWeek.length,
      analysisResults: currentColumnAnalysis,
      screenshots: [
        'final-01-user-management-page.png',
        'final-02-user-table-focused.png', 
        'final-03-current-column-highlighted.png'
      ]
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'final-99-error-screenshot.png' });
    
    return {
      success: false,
      error: error.message,
      screenshots: ['final-99-error-screenshot.png']
    };
  } finally {
    await browser.close();
  }
}

// Run the final test
finalCurrentColumnTest()
  .then(results => {
    console.log('\n🏁 FINAL TEST COMPLETED');
    console.log(`📸 Screenshots saved: ${results.screenshots?.join(', ')}`);
    
    if (results.success) {
      if (results.hasData) {
        if (results.weekTextRemoved) {
          console.log('🎉 RESULT: Week text removal has been SUCCESSFULLY completed!');
        } else {
          console.log(`⚠️  RESULT: Week text removal is INCOMPLETE (${results.entriesWithWeek} entries still have "week" text)`);
        }
      } else {
        console.log('ℹ️  RESULT: No data available to verify week text removal');
      }
    } else {
      console.log('❌ RESULT: Test failed with error:', results.error);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  });