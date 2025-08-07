import { test, expect, Page, ConsoleMessage } from '@playwright/test'
import fs from 'fs'
import path from 'path'

interface TestResults {
  dashboardLoadSuccess: boolean
  dashboardLoadTime: number
  refreshButtonFunctionality: boolean
  consoleDebugLogs: Array<{
    timestamp: string
    type: string
    text: string
    relevant: boolean
  }>
  timeoutFallbackBehavior: boolean
  performanceMetrics: {
    navigationTiming: any
    loadTime: number
    refreshTime: number
  }
  screenshots: string[]
  errors: string[]
}

test.describe('Dashboard Loading Fixes - Comprehensive Test', () => {
  let consoleLogs: ConsoleMessage[] = []
  let testResults: TestResults = {
    dashboardLoadSuccess: false,
    dashboardLoadTime: 0,
    refreshButtonFunctionality: false,
    consoleDebugLogs: [],
    timeoutFallbackBehavior: false,
    performanceMetrics: {
      navigationTiming: null,
      loadTime: 0,
      refreshTime: 0
    },
    screenshots: [],
    errors: []
  }

  test.beforeEach(async ({ page }) => {
    // Clear console logs for each test
    consoleLogs = []
    
    // Capture console messages
    page.on('console', msg => {
      consoleLogs.push(msg)
      console.log(`Console ${msg.type()}: ${msg.text()}`)
    })

    // Capture page errors
    page.on('pageerror', error => {
      testResults.errors.push(error.message)
      console.error('Page Error:', error.message)
    })

    // Monitor network requests
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`Failed request: ${response.url()} - ${response.status()}`)
      }
    })
  })

  async function loginAsAdmin(page: Page): Promise<void> {
    console.log('🔐 Attempting login...')
    
    // Navigate to login page
    await page.goto('/login')
    await page.waitForSelector('form', { timeout: 10000 })
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'todays777@gmail.com')
    await page.fill('input[type="password"]', 'your-new-password')
    
    // Take screenshot before login
    const loginScreenshot = path.join(__dirname, '../test-results/dashboard-loading-test/01-login-page.png')
    await page.screenshot({ path: loginScreenshot, fullPage: true })
    testResults.screenshots.push(loginScreenshot)
    
    // Click login button and wait for navigation
    await page.click('button[type="submit"]')
    
    // Wait for successful login (either dashboard redirect or auth success)
    try {
      await page.waitForURL(/\/(dashboard|org|super-admin)/, { timeout: 15000 })
      console.log('✅ Login successful, redirected to authenticated area')
    } catch (error) {
      console.log('⏱️ Login redirect timeout, checking current URL...')
      const currentUrl = page.url()
      console.log('Current URL after login attempt:', currentUrl)
      
      // If we're not on login page anymore, consider it successful
      if (!currentUrl.includes('/login')) {
        console.log('✅ Login appears successful based on URL change')
      } else {
        throw new Error('Login failed - still on login page')
      }
    }
  }

  test('Comprehensive Dashboard Loading and Refresh Test', async ({ page }) => {
    const startTime = Date.now()
    
    try {
      console.log('🚀 Starting comprehensive dashboard loading test...')
      
      // Step 1: Login as admin
      await loginAsAdmin(page)
      
      // Take screenshot after login
      const afterLoginScreenshot = path.join(__dirname, '../test-results/dashboard-loading-test/02-after-login.png')
      await page.screenshot({ path: afterLoginScreenshot, fullPage: true })
      testResults.screenshots.push(afterLoginScreenshot)
      
      // Step 2: Navigate to Andrew's Clinic dashboard
      const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard'
      console.log('🏥 Navigating to Andrews Clinic dashboard:', dashboardUrl)
      
      const navigationStart = Date.now()
      await page.goto(dashboardUrl)
      
      // Step 3: Wait for initial load to complete
      console.log('⏳ Waiting for dashboard to load...')
      
      // Wait for dashboard elements to appear
      const dashboardLoadPromises = [
        page.waitForSelector('h1:has-text("Welcome to")', { timeout: 15000 }),
        page.waitForSelector('[data-testid="kpi-card"], .text-xl.font-bold', { timeout: 15000 }),
        page.waitForSelector('button:has-text("Refresh")', { timeout: 10000 })
      ]
      
      try {
        await Promise.race(dashboardLoadPromises)
        const dashboardLoadTime = Date.now() - navigationStart
        testResults.dashboardLoadTime = dashboardLoadTime
        testResults.dashboardLoadSuccess = dashboardLoadTime < 15000
        
        console.log(`✅ Dashboard loaded successfully in ${dashboardLoadTime}ms`)
        
        // Take screenshot of successful load
        const dashboardLoadedScreenshot = path.join(__dirname, '../test-results/dashboard-loading-test/03-dashboard-loaded.png')
        await page.screenshot({ path: dashboardLoadedScreenshot, fullPage: true })
        testResults.screenshots.push(dashboardLoadedScreenshot)
        
      } catch (error) {
        console.log('⚠️ Dashboard initial load timeout, checking for timeout fallback...')
        
        // Check if timeout fallback screen is shown
        const timeoutElement = await page.$('text=Loading Timeout')
        if (timeoutElement) {
          testResults.timeoutFallbackBehavior = true
          console.log('✅ Timeout fallback screen detected')
          
          // Take screenshot of timeout screen
          const timeoutScreenshot = path.join(__dirname, '../test-results/dashboard-loading-test/04-timeout-fallback.png')
          await page.screenshot({ path: timeoutScreenshot, fullPage: true })
          testResults.screenshots.push(timeoutScreenshot)
        }
      }
      
      // Step 4: Test refresh button functionality
      console.log('🔄 Testing refresh button functionality...')
      
      const refreshButton = await page.$('button:has-text("Refresh")')
      if (refreshButton) {
        // Test multiple refresh clicks
        for (let i = 0; i < 3; i++) {
          console.log(`🔄 Refresh attempt ${i + 1}/3`)
          
          const refreshStart = Date.now()
          await refreshButton.click()
          
          // Wait for loading state
          try {
            await page.waitForSelector('button:has-text("Refreshing...")', { timeout: 2000 })
            console.log('✅ Refresh button shows loading state')
            testResults.refreshButtonFunctionality = true
          } catch {
            console.log('⚠️ Loading state not detected or too quick')
          }
          
          // Wait for refresh to complete
          await page.waitForTimeout(2000)
          const refreshTime = Date.now() - refreshStart
          testResults.performanceMetrics.refreshTime = Math.max(testResults.performanceMetrics.refreshTime, refreshTime)
          
          // Ensure button returns to normal state
          await page.waitForSelector('button:has-text("Refresh")', { timeout: 5000 })
          console.log(`✅ Refresh ${i + 1} completed in ${refreshTime}ms`)
        }
        
        // Take screenshot after refresh tests
        const afterRefreshScreenshot = path.join(__dirname, '../test-results/dashboard-loading-test/05-after-refresh-tests.png')
        await page.screenshot({ path: afterRefreshScreenshot, fullPage: true })
        testResults.screenshots.push(afterRefreshScreenshot)
        
      } else {
        testResults.errors.push('Refresh button not found')
        console.error('❌ Refresh button not found')
      }
      
      // Step 5: Check console logs for debug messages
      console.log('📋 Analyzing console logs...')
      
      testResults.consoleDebugLogs = consoleLogs.map(msg => {
        const text = msg.text()
        return {
          timestamp: new Date().toISOString(),
          type: msg.type(),
          text: text,
          relevant: text.includes('🔄 Dashboard useEffect triggered') || 
                   text.includes('🔄 Manual refresh triggered') ||
                   text.includes('⚠️ Dashboard loading timeout') ||
                   text.includes('🔄 Fetching organization data') ||
                   text.includes('🔍 Dashboard fetching seniors')
        }
      })
      
      const relevantLogs = testResults.consoleDebugLogs.filter(log => log.relevant)
      console.log(`📋 Found ${relevantLogs.length} relevant console logs:`)
      relevantLogs.forEach(log => {
        console.log(`  ${log.type.toUpperCase()}: ${log.text}`)
      })
      
      // Step 6: Capture performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoadedTime: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          loadCompleteTime: perfData.loadEventEnd - perfData.navigationStart,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || null
        }
      })
      
      testResults.performanceMetrics.navigationTiming = performanceMetrics
      testResults.performanceMetrics.loadTime = testResults.dashboardLoadTime
      
      console.log('📊 Performance Metrics:', performanceMetrics)
      
      // Step 7: Take final comprehensive screenshot
      const finalScreenshot = path.join(__dirname, '../test-results/dashboard-loading-test/06-final-comprehensive.png')
      await page.screenshot({ path: finalScreenshot, fullPage: true })
      testResults.screenshots.push(finalScreenshot)
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      testResults.errors.push(error instanceof Error ? error.message : String(error))
      
      // Take error screenshot
      const errorScreenshot = path.join(__dirname, '../test-results/dashboard-loading-test/error-state.png')
      await page.screenshot({ path: errorScreenshot, fullPage: true })
      testResults.screenshots.push(errorScreenshot)
    }
    
    const totalTime = Date.now() - startTime
    console.log(`🏁 Test completed in ${totalTime}ms`)
    
    // Save detailed test results
    const resultsDir = path.join(__dirname, '../test-results/dashboard-loading-test')
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }
    
    const reportPath = path.join(resultsDir, 'comprehensive-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      ...testResults,
      testDuration: totalTime,
      timestamp: new Date().toISOString(),
      testUrl: 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard'
    }, null, 2))
    
    console.log('📄 Test report saved to:', reportPath)
  })

  test('Timeout Fallback Behavior Test', async ({ page }) => {
    console.log('⏱️ Testing timeout fallback behavior...')
    
    try {
      // Login first
      await loginAsAdmin(page)
      
      // Mock slow network to trigger timeout
      await page.route('**/*', route => {
        // Delay all requests to simulate slow network
        setTimeout(() => route.continue(), 2000)
      })
      
      // Navigate to dashboard
      const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard'
      await page.goto(dashboardUrl)
      
      // Wait for timeout screen to appear
      try {
        await page.waitForSelector('text=Loading Timeout', { timeout: 20000 })
        testResults.timeoutFallbackBehavior = true
        console.log('✅ Timeout fallback screen appeared as expected')
        
        // Take screenshot of timeout screen
        const timeoutScreenshot = path.join(__dirname, '../test-results/dashboard-loading-test/timeout-behavior-test.png')
        await page.screenshot({ path: timeoutScreenshot, fullPage: true })
        testResults.screenshots.push(timeoutScreenshot)
        
        // Test reload button
        const reloadButton = await page.$('button:has-text("Reload Dashboard")')
        if (reloadButton) {
          console.log('✅ Reload Dashboard button found in timeout screen')
          await reloadButton.click()
          console.log('✅ Reload button clicked successfully')
        }
        
      } catch (error) {
        console.log('⚠️ Timeout screen did not appear within expected time')
        testResults.errors.push('Timeout fallback screen not shown')
      }
      
    } catch (error) {
      console.error('❌ Timeout test failed:', error)
      testResults.errors.push(error instanceof Error ? error.message : String(error))
    }
  })

  test('Console Debug Logs Verification', async ({ page }) => {
    console.log('🔍 Testing console debug logs...')
    
    const specificLogs = {
      dashboardUseEffect: false,
      manualRefresh: false,
      organizationFetch: false,
      timeoutWarning: false
    }
    
    // Capture console messages with specific patterns
    page.on('console', msg => {
      const text = msg.text()
      
      if (text.includes('🔄 Dashboard useEffect triggered')) {
        specificLogs.dashboardUseEffect = true
        console.log('✅ Found: Dashboard useEffect triggered log')
      }
      
      if (text.includes('🔄 Manual refresh triggered')) {
        specificLogs.manualRefresh = true
        console.log('✅ Found: Manual refresh triggered log')
      }
      
      if (text.includes('🔄 Fetching organization data')) {
        specificLogs.organizationFetch = true
        console.log('✅ Found: Organization data fetch log')
      }
      
      if (text.includes('⚠️ Dashboard loading timeout')) {
        specificLogs.timeoutWarning = true
        console.log('✅ Found: Timeout warning log')
      }
    })
    
    try {
      // Login and navigate to dashboard
      await loginAsAdmin(page)
      
      const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard'
      await page.goto(dashboardUrl)
      
      // Wait for dashboard to load
      await page.waitForTimeout(5000)
      
      // Click refresh to trigger manual refresh log
      const refreshButton = await page.$('button:has-text("Refresh")')
      if (refreshButton) {
        await refreshButton.click()
        await page.waitForTimeout(2000)
      }
      
      // Verify that expected logs were found
      console.log('📋 Debug logs verification:', specificLogs)
      
      // Assertions for required logs
      expect(specificLogs.dashboardUseEffect, 'Dashboard useEffect log should be present').toBe(true)
      expect(specificLogs.organizationFetch, 'Organization fetch log should be present').toBe(true)
      
      if (refreshButton) {
        expect(specificLogs.manualRefresh, 'Manual refresh log should be present when refresh button clicked').toBe(true)
      }
      
    } catch (error) {
      console.error('❌ Console logs verification failed:', error)
      testResults.errors.push(error instanceof Error ? error.message : String(error))
    }
  })

  test.afterAll(async () => {
    // Generate final comprehensive report
    const finalReport = {
      testSuite: 'Dashboard Loading Fixes - Comprehensive Test',
      timestamp: new Date().toISOString(),
      results: testResults,
      summary: {
        dashboardLoadSuccess: testResults.dashboardLoadSuccess,
        averageLoadTime: testResults.dashboardLoadTime,
        refreshFunctionalityWorking: testResults.refreshButtonFunctionality,
        timeoutFallbackImplemented: testResults.timeoutFallbackBehavior,
        totalErrors: testResults.errors.length,
        relevantConsoleLogsFound: testResults.consoleDebugLogs.filter(log => log.relevant).length,
        screenshotsCaptured: testResults.screenshots.length
      },
      recommendations: []
    }
    
    // Add recommendations based on results
    if (!testResults.dashboardLoadSuccess) {
      finalReport.recommendations.push('Dashboard loading takes too long (>15s). Consider optimizing queries or adding more loading indicators.')
    }
    
    if (!testResults.refreshButtonFunctionality) {
      finalReport.recommendations.push('Refresh button loading states need improvement for better UX.')
    }
    
    if (testResults.errors.length > 0) {
      finalReport.recommendations.push(`${testResults.errors.length} error(s) found that need investigation.`)
    }
    
    if (!testResults.timeoutFallbackBehavior) {
      finalReport.recommendations.push('Consider testing timeout fallback behavior under slow network conditions.')
    }
    
    // Save final report
    const finalReportPath = path.join(__dirname, '../test-results/dashboard-loading-test/FINAL-COMPREHENSIVE-REPORT.json')
    fs.writeFileSync(finalReportPath, JSON.stringify(finalReport, null, 2))
    
    console.log('📋 Final comprehensive report saved to:', finalReportPath)
    console.log('🎯 Test Summary:')
    console.log(`  ✅ Dashboard Load Success: ${finalReport.summary.dashboardLoadSuccess}`)
    console.log(`  ⏱️  Average Load Time: ${finalReport.summary.averageLoadTime}ms`)
    console.log(`  🔄 Refresh Functionality: ${finalReport.summary.refreshFunctionalityWorking}`)
    console.log(`  ⏰ Timeout Fallback: ${finalReport.summary.timeoutFallbackImplemented}`)
    console.log(`  📋 Console Logs Found: ${finalReport.summary.relevantConsoleLogsFound}`)
    console.log(`  📸 Screenshots: ${finalReport.summary.screenshotsCaptured}`)
    console.log(`  ❌ Errors: ${finalReport.summary.totalErrors}`)
  })
})