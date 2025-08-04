import { test, expect } from '@playwright/test';

test.describe('Andrew\'s Clinic Dashboard', () => {
  test('should display dashboard sections with dummy data', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async data loading
    await page.waitForTimeout(2000);

    // Check that "Recent User Activity (Top 5)" section is visible
    const recentActivitySection = page.locator('text=Recent User Activity (Top 5)');
    await expect(recentActivitySection).toBeVisible({ timeout: 10000 });
    console.log('✓ Recent User Activity (Top 5) section is visible');

    // Check that "Inactive Users" section is visible
    const inactiveUsersSection = page.locator('text=Inactive Users');
    await expect(inactiveUsersSection).toBeVisible({ timeout: 10000 });
    console.log('✓ Inactive Users section is visible');

    // Capture details about Recent User Activity section
    const activityContainer = page.locator('[data-testid="recent-activity"], .recent-activity, .activity-section').first();
    if (await activityContainer.isVisible()) {
      const activityItems = await activityContainer.locator('tr, .activity-item, .user-item').count();
      console.log(`Found ${activityItems} activity items in Recent User Activity section`);
      
      // Get text content of activity items
      const activityText = await activityContainer.textContent();
      console.log('Recent Activity section content:', activityText?.substring(0, 500));
    } else {
      // Try alternative selectors for activity data
      const alternativeActivity = page.locator('text=/user|activity|patient/i').first();
      if (await alternativeActivity.isVisible()) {
        const contextText = await alternativeActivity.textContent();
        console.log('Found activity-related content:', contextText);
      }
    }

    // Capture details about Inactive Users section
    const inactiveContainer = page.locator('[data-testid="inactive-users"], .inactive-users, .inactive-section').first();
    if (await inactiveContainer.isVisible()) {
      const inactiveItems = await inactiveContainer.locator('tr, .user-item, .inactive-item').count();
      console.log(`Found ${inactiveItems} inactive users`);
      
      // Get text content of inactive users
      const inactiveText = await inactiveContainer.textContent();
      console.log('Inactive Users section content:', inactiveText?.substring(0, 500));
    } else {
      // Try alternative selectors for inactive users
      const alternativeInactive = page.locator('text=/inactive|last seen|days ago/i').first();
      if (await alternativeInactive.isVisible()) {
        const contextText = await alternativeInactive.textContent();
        console.log('Found inactive-related content:', contextText);
      }
    }

    // Look for user names and dates
    const userElements = await page.locator('text=/^[A-Z][a-z]+ [A-Z][a-z]+$|Dr\\. [A-Z][a-z]+/').all();
    console.log(`Found ${userElements.length} potential user names on the page`);

    const dateElements = await page.locator('text=/\\d{1,2}\/\\d{1,2}\/\\d{4}|\\d+ days? ago|today|yesterday/i').all();
    console.log(`Found ${dateElements.length} potential dates on the page`);

    // Check for any error messages
    const errorElements = await page.locator('.error, [role="alert"], .alert-error, text=/error|failed|not found/i').all();
    if (errorElements.length > 0) {
      console.log(`⚠️  Found ${errorElements.length} potential error indicators`);
      for (const error of errorElements) {
        const errorText = await error.textContent();
        console.log('Error text:', errorText);
      }
    } else {
      console.log('✓ No obvious error messages found');
    }

    // Take a screenshot of the entire dashboard
    await page.screenshot({
      path: 'tests/dashboard-screenshot.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved as tests/dashboard-screenshot.png');

    // Check for loading states
    const loadingElements = await page.locator('text=/loading|spinner|fetching/i').all();
    if (loadingElements.length > 0) {
      console.log('⚠️  Found loading indicators - data might still be loading');
    }

    // Verify that at least some data is displayed (not just empty sections)
    const hasDataIndicators = await page.locator('table tr, .data-row, .user-row, .activity-item').count();
    console.log(`Found ${hasDataIndicators} data rows/items across the dashboard`);

    // Check if the page title or heading indicates this is the correct dashboard
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    const mainHeading = await page.locator('h1, h2, .page-title').first().textContent();
    console.log('Main heading:', mainHeading);
  });
});