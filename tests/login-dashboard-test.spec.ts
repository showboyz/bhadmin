import { test, expect } from '@playwright/test';

test.describe('Dashboard Test with Specific Credentials', () => {
  test('should login with todays777@gmail.com and check dashboard data', async ({ page }) => {
    // Step 1: Go to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take screenshot of login page
    await page.screenshot({
      path: 'tests/step1-login-page.png',
      fullPage: true
    });
    console.log('✓ Login page screenshot taken');

    // Step 2: Login with specified credentials
    console.log('Step 2: Logging in with todays777@gmail.com...');
    
    // Find and fill email field
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('todays777@gmail.com');
    
    // Find and fill password field
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('your-new-password');
    
    // Click sign in button
    const signInButton = page.locator('button:has-text("Sign in"), input[type="submit"], button[type="submit"]');
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Wait for redirect
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // Check if login was successful (should redirect to super-admin)
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      // Login failed, take screenshot and show error
      await page.screenshot({
        path: 'tests/login-failed.png',
        fullPage: true
      });
      
      // Look for error messages
      const errorElements = await page.locator('.error, [role="alert"], .alert, .text-red-500, .text-destructive').all();
      for (const error of errorElements) {
        const errorText = await error.textContent();
        if (errorText && errorText.trim()) {
          console.log('❌ Login error:', errorText.trim());
        }
      }
      throw new Error('Login failed - still on login page');
    }
    
    console.log('✓ Login successful, redirected from login page');
    
    // Take screenshot after login
    await page.screenshot({
      path: 'tests/step2-after-login.png',
      fullPage: true
    });

    // Step 3: Navigate to the specific dashboard
    console.log('Step 3: Navigating to organization dashboard...');
    await page.goto('http://localhost:3000/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot of dashboard
    await page.screenshot({
      path: 'tests/step3-dashboard-full.png',
      fullPage: true
    });
    console.log('✓ Dashboard screenshot taken');

    // Step 4: Check for "Recent User Activity (Top 5)" section
    console.log('Step 4: Checking Recent User Activity section...');
    
    const recentActivitySection = page.locator('text=Recent User Activity (Top 5)');
    const recentActivityExists = await recentActivitySection.isVisible();
    
    if (recentActivityExists) {
      console.log('✓ Recent User Activity (Top 5) section found');
      
      // Take screenshot of this section
      await recentActivitySection.screenshot({
        path: 'tests/recent-user-activity-section.png'
      });
      
      // Look for the table/data in this section
      const activityContainer = page.locator('text=Recent User Activity (Top 5)').locator('..').locator('..');
      const activityTable = activityContainer.locator('table').first();
      
      if (await activityTable.isVisible()) {
        const rowCount = await activityTable.locator('tbody tr').count();
        console.log(`✓ Found ${rowCount} rows in Recent User Activity table`);
        
        // Get user data and check for Korean names
        const userNames = [];
        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const row = activityTable.locator('tbody tr').nth(i);
          const rowText = await row.textContent();
          console.log(`Activity row ${i + 1}: ${rowText?.trim()}`);
          
          // Extract name from row (assuming it's in the first column)
          const nameCell = row.locator('td').first();
          const name = await nameCell.textContent();
          if (name) {
            userNames.push(name.trim());
          }
        }
        
        // Check for Korean names
        const koreanNames = ['김철수', '이영희', '박민수'];
        const foundKoreanNames = userNames.filter(name => 
          koreanNames.some(koreanName => name.includes(koreanName))
        );
        
        if (foundKoreanNames.length > 0) {
          console.log('✓ Found Korean names in user data:', foundKoreanNames);
        } else {
          console.log('⚠️  No specific Korean names (김철수, 이영희, 박민수) found in user data');
          console.log('User names found:', userNames);
        }
      } else {
        console.log('⚠️  No table found in Recent User Activity section');
      }
    } else {
      console.log('❌ Recent User Activity (Top 5) section not found');
    }

    // Step 5: Check for "Inactive Users" section
    console.log('Step 5: Checking Inactive Users section...');
    
    const inactiveUsersSection = page.locator('text=Inactive Users').first();
    const inactiveUsersExists = await inactiveUsersSection.isVisible();
    
    if (inactiveUsersExists) {
      console.log('✓ Inactive Users section found');
      
      // Take screenshot of inactive users section
      await inactiveUsersSection.screenshot({
        path: 'tests/inactive-users-section.png'
      });
      
      // Get the section title to see count
      const inactiveTitle = await inactiveUsersSection.textContent();
      console.log('Inactive users section title:', inactiveTitle);
      
      // Look for table data
      const inactiveContainer = page.locator('text=Inactive Users').locator('..').locator('..');
      const inactiveTable = inactiveContainer.locator('table').first();
      
      if (await inactiveTable.isVisible()) {
        const inactiveRowCount = await inactiveTable.locator('tbody tr').count();
        console.log(`✓ Found ${inactiveRowCount} inactive users`);
        
        // Get inactive user data
        const inactiveUserNames = [];
        for (let i = 0; i < Math.min(inactiveRowCount, 5); i++) {
          const row = inactiveTable.locator('tbody tr').nth(i);
          const rowText = await row.textContent();
          console.log(`Inactive user ${i + 1}: ${rowText?.trim()}`);
          
          // Extract name from row
          const nameCell = row.locator('td').first();
          const name = await nameCell.textContent();
          if (name) {
            inactiveUserNames.push(name.trim());
          }
        }
        
        // Check for Korean names in inactive users
        const koreanNames = ['김철수', '이영희', '박민수'];
        const foundKoreanNamesInactive = inactiveUserNames.filter(name => 
          koreanNames.some(koreanName => name.includes(koreanName))
        );
        
        if (foundKoreanNamesInactive.length > 0) {
          console.log('✓ Found Korean names in inactive users:', foundKoreanNamesInactive);
        } else {
          console.log('⚠️  No specific Korean names found in inactive users');
          console.log('Inactive user names found:', inactiveUserNames);
        }
      } else {
        console.log('⚠️  No table found in Inactive Users section');
      }
    } else {
      console.log('❌ Inactive Users section not found');
    }

    // Step 6: Take final comprehensive screenshots
    console.log('Step 6: Taking final screenshots...');
    
    // Full page screenshot
    await page.screenshot({
      path: 'tests/final-dashboard-full-page.png',
      fullPage: true
    });
    
    // Viewport screenshot
    await page.screenshot({
      path: 'tests/final-dashboard-viewport.png'
    });

    // Summary
    console.log('\n=== DASHBOARD TEST SUMMARY ===');
    console.log('✓ Successfully logged in with todays777@gmail.com');
    console.log('✓ Navigated to organization dashboard');
    console.log(`✓ Recent User Activity section: ${recentActivityExists ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`✓ Inactive Users section: ${inactiveUsersExists ? 'FOUND' : 'NOT FOUND'}`);
    console.log('✓ Screenshots captured for all sections');
    console.log('====================================');
  });
});