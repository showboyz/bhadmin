import { test, expect } from '@playwright/test';

test.describe('User Registration Functionality', () => {
  test('should navigate, login, and register a new user with Korean data', async ({ page }) => {
    // Enable console message logging
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Track network requests for API responses
    const apiResponses: any[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    console.log('Step 1: Navigating to users page...');
    
    // Step 1: Navigate to the users page
    await page.goto('/org/bf579a76-e9c5-45be-8659-7e62664883c4/users');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });

    console.log('Step 2: Attempting to login...');
    
    // Step 2: Login with provided credentials
    // Check if we're on a login page or if login form is present
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    if (await emailInput.isVisible({ timeout: 5000 })) {
      console.log('Login form detected, proceeding with login...');
      
      await emailInput.fill('andrew@youngandx.com');
      await passwordInput.fill('RX3XJEemQAfw');
      
      // Find and click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login"), button:has-text("Sign In")');
      await loginButton.click();
      
      // Wait for navigation after login
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/02-after-login.png', fullPage: true });
      
      // Navigate to users page after login if needed
      await page.goto('/org/bf579a76-e9c5-45be-8659-7e62664883c4/users');
      await page.waitForLoadState('networkidle');
    } else {
      console.log('Already logged in or no login form detected');
    }

    console.log('Step 3: Looking for Add User button...');
    
    // Step 3: Click the "Add User" button
    await page.screenshot({ path: 'test-results/03-users-page.png', fullPage: true });
    
    // Look for various possible "Add User" button variations
    const addUserButton = page.locator(
      'button:has-text("Add User"), ' +
      'button:has-text("사용자 추가"), ' +
      'button:has-text("추가"), ' +
      'button:has-text("New User"), ' +
      'a:has-text("Add User"), ' +
      'a:has-text("사용자 추가"), ' +
      '[data-testid="add-user"], ' +
      'button[aria-label*="add" i], ' +
      'button:has(svg), ' +
      '.add-user-btn, ' +
      '.btn-add-user'
    );
    
    await expect(addUserButton.first()).toBeVisible({ timeout: 10000 });
    await addUserButton.first().click();
    
    // Wait for form to load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/04-add-user-form.png', fullPage: true });

    console.log('Step 4: Filling out registration form...');
    
    // Step 4: Fill out the registration form with test data
    
    // Full Name: 테스트사용자
    const nameInput = page.locator(
      'input[name="name"], ' +
      'input[name="fullName"], ' +
      'input[name="fullname"], ' +
      'input[placeholder*="이름" i], ' +
      'input[placeholder*="name" i], ' +
      'input[label*="이름" i], ' +
      'input[label*="name" i]'
    );
    if (await nameInput.first().isVisible({ timeout: 5000 })) {
      await nameInput.first().fill('테스트사용자');
    }
    
    // Gender: Male
    const genderSelect = page.locator(
      'select[name="gender"], ' +
      'select[name="sex"], ' +
      'input[name="gender"][value="male"], ' +
      'input[name="gender"][value="Male"], ' +
      'input[name="sex"][value="male"]'
    );
    
    if (await genderSelect.first().isVisible({ timeout: 3000 })) {
      if (await genderSelect.first().evaluate(el => el.tagName) === 'SELECT') {
        await genderSelect.first().selectOption({ label: 'Male' });
      } else {
        // Try radio buttons
        const maleRadio = page.locator('input[type="radio"][value*="male" i], input[type="radio"][value="Male"]');
        if (await maleRadio.first().isVisible({ timeout: 2000 })) {
          await maleRadio.first().click();
        }
      }
    }
    
    // Birth Date: 1950-01-01
    const birthDateInput = page.locator(
      'input[name="birthDate"], ' +
      'input[name="birth_date"], ' +
      'input[name="dateOfBirth"], ' +
      'input[type="date"], ' +
      'input[placeholder*="생년월일" i], ' +
      'input[placeholder*="birth" i]'
    );
    if (await birthDateInput.first().isVisible({ timeout: 3000 })) {
      await birthDateInput.first().fill('1950-01-01');
    }
    
    // Phone: 010-1234-5678
    const phoneInput = page.locator(
      'input[name="phone"], ' +
      'input[name="phoneNumber"], ' +
      'input[name="mobile"], ' +
      'input[placeholder*="전화" i], ' +
      'input[placeholder*="phone" i], ' +
      'input[type="tel"]'
    );
    if (await phoneInput.first().isVisible({ timeout: 3000 })) {
      await phoneInput.first().fill('010-1234-5678');
    }
    
    // Grade: beginner
    const gradeSelect = page.locator(
      'select[name="grade"], ' +
      'select[name="level"], ' +
      'input[name="grade"][value="beginner"]'
    );
    if (await gradeSelect.first().isVisible({ timeout: 3000 })) {
      if (await gradeSelect.first().evaluate(el => el.tagName) === 'SELECT') {
        await gradeSelect.first().selectOption({ value: 'beginner' });
      }
    }
    
    // Guardian: 테스트보호자
    const guardianInput = page.locator(
      'input[name="guardian"], ' +
      'input[name="guardianName"], ' +
      'input[placeholder*="보호자" i], ' +
      'input[placeholder*="guardian" i]'
    );
    if (await guardianInput.first().isVisible({ timeout: 3000 })) {
      await guardianInput.first().fill('테스트보호자');
    }
    
    // Address: 서울시 강남구
    const addressInput = page.locator(
      'input[name="address"], ' +
      'textarea[name="address"], ' +
      'input[placeholder*="주소" i], ' +
      'input[placeholder*="address" i]'
    );
    if (await addressInput.first().isVisible({ timeout: 3000 })) {
      await addressInput.first().fill('서울시 강남구');
    }
    
    // Health Status: good
    const healthStatusSelect = page.locator(
      'select[name="healthStatus"], ' +
      'select[name="health_status"], ' +
      'select[name="health"], ' +
      'input[name="healthStatus"][value="good"]'
    );
    if (await healthStatusSelect.first().isVisible({ timeout: 3000 })) {
      if (await healthStatusSelect.first().evaluate(el => el.tagName) === 'SELECT') {
        await healthStatusSelect.first().selectOption({ value: 'good' });
      }
    }
    
    // Take screenshot after filling form
    await page.screenshot({ path: 'test-results/05-form-filled.png', fullPage: true });

    console.log('Step 5: Submitting the form...');
    
    // Step 5: Submit the form
    const submitButton = page.locator(
      'button[type="submit"], ' +
      'button:has-text("Submit"), ' +
      'button:has-text("등록"), ' +
      'button:has-text("저장"), ' +
      'button:has-text("Save"), ' +
      'button:has-text("Create"), ' +
      'input[type="submit"]'
    );
    
    await expect(submitButton.first()).toBeVisible({ timeout: 5000 });
    await submitButton.first().click();
    
    // Wait for submission to complete
    await page.waitForLoadState('networkidle');
    
    console.log('Step 6: Taking final screenshots...');
    
    // Step 6: Take screenshot of the result
    await page.screenshot({ path: 'test-results/06-registration-result.png', fullPage: true });
    
    // Wait a bit more to capture any delayed messages or redirects
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/07-final-result.png', fullPage: true });

    console.log('Step 7: Collecting results...');
    
    // Log all collected console messages
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg}`);
    });
    
    // Log all API responses
    console.log('\n=== API RESPONSES ===');
    apiResponses.forEach((response, index) => {
      console.log(`${index + 1}. ${response.status} ${response.statusText} - ${response.url}`);
    });
    
    // Verify registration success (look for success indicators)
    const successIndicators = page.locator(
      ':has-text("성공"), ' +
      ':has-text("Success"), ' +
      ':has-text("등록"), ' +
      ':has-text("Created"), ' +
      '.success, ' +
      '.alert-success, ' +
      '.notification-success'
    );
    
    const errorIndicators = page.locator(
      ':has-text("오류"), ' +
      ':has-text("Error"), ' +
      ':has-text("실패"), ' +
      ':has-text("Failed"), ' +
      '.error, ' +
      '.alert-error, ' +
      '.notification-error'
    );
    
    // Check final state
    const hasSuccess = await successIndicators.count() > 0;
    const hasError = await errorIndicators.count() > 0;
    
    console.log(`\n=== REGISTRATION RESULT ===`);
    console.log(`Success indicators found: ${hasSuccess}`);
    console.log(`Error indicators found: ${hasError}`);
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total API responses: ${apiResponses.length}`);
    
    // The test will continue regardless of success/failure to capture all information
    console.log('\nTest completed. Check screenshots in test-results/ directory.');
  });
});