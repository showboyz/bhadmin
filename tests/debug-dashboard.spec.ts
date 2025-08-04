import { test, expect } from '@playwright/test';

test('debug dashboard content', async ({ page }) => {
  // Navigate to the dashboard
  await page.goto('/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take a screenshot first
  await page.screenshot({
    path: 'tests/debug-screenshot.png',
    fullPage: true
  });

  // Log the page title and URL
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());

  // Get the page content text
  const bodyText = await page.locator('body').textContent();
  console.log('Page content (first 1000 chars):', bodyText?.substring(0, 1000));

  // Check if we can find any common dashboard elements
  const welcomeText = await page.locator('text=/Welcome to|Hello/i').first();
  if (await welcomeText.isVisible()) {
    console.log('Found welcome text:', await welcomeText.textContent());
  }

  // Check for loading states
  const loadingIndicators = await page.locator('text=/loading|Loading/i').all();
  console.log('Loading indicators found:', loadingIndicators.length);

  // Check for error messages
  const errorMessages = await page.locator('text=/error|Error|failed|Failed/i').all();
  console.log('Error messages found:', errorMessages.length);
  if (errorMessages.length > 0) {
    for (const error of errorMessages) {
      console.log('Error text:', await error.textContent());
    }
  }

  // Check if we're redirected to login
  if (page.url().includes('/login')) {
    console.log('⚠️  Redirected to login page - authentication required');
  }
});