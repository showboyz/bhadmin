import { test, expect, ConsoleMessage } from '@playwright/test'
import fs from 'fs'
import path from 'path'

test.describe('Dashboard Console Logs Test', () => {
  let consoleLogs: ConsoleMessage[] = []
  
  test.beforeEach(async ({ page }) => {
    consoleLogs = []
    
    // Capture console messages
    page.on('console', msg => {
      consoleLogs.push(msg)
      console.log(`Console ${msg.type()}: ${msg.text()}`)
    })
  })

  test('Capture Dashboard Debug Logs', async ({ page }) => {
    console.log('🔍 Testing console debug logs specifically...')
    
    // Login
    await page.goto('/login')
    await page.waitForSelector('form', { timeout: 10000 })
    
    await page.fill('input[type="email"]', 'todays777@gmail.com')
    await page.fill('input[type="password"]', 'your-new-password')
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL(/\/(dashboard|org|super-admin)/, { timeout: 15000 })
    
    // Navigate to Andrew's Clinic dashboard
    const dashboardUrl = 'http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard'
    await page.goto(dashboardUrl)
    
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Welcome to")', { timeout: 15000 })
    
    // Wait a bit for all logs to accumulate
    await page.waitForTimeout(3000)
    
    // Click refresh multiple times to trigger manual refresh logs
    const refreshButton = await page.$('button:has-text("Refresh")')
    if (refreshButton) {
      for (let i = 0; i < 3; i++) {
        await refreshButton.click()
        await page.waitForTimeout(1000)
      }
    }
    
    // Wait for final logs
    await page.waitForTimeout(2000)
    
    // Filter and analyze logs
    const relevantLogs = consoleLogs
      .filter(msg => {
        const text = msg.text()
        return text.includes('🔄 Dashboard useEffect triggered') ||
               text.includes('🔄 Manual refresh triggered') ||
               text.includes('🔄 Fetching organization data') ||
               text.includes('🔍 Dashboard fetching seniors') ||
               text.includes('⚠️ Dashboard loading timeout') ||
               text.includes('✅ Dashboard loaded') ||
               text.includes('✅ Organization data loaded')
      })
      .map(msg => ({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text()
      }))
    
    console.log(`\n📋 Found ${relevantLogs.length} relevant debug logs:`)
    relevantLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.text}`)
    })
    
    // Verify specific debug logs are present
    const hasUseEffectLog = relevantLogs.some(log => log.text.includes('🔄 Dashboard useEffect triggered'))
    const hasManualRefreshLog = relevantLogs.some(log => log.text.includes('🔄 Manual refresh triggered'))
    const hasOrgDataLog = relevantLogs.some(log => log.text.includes('🔄 Fetching organization data'))
    const hasSeniorsLog = relevantLogs.some(log => log.text.includes('🔍 Dashboard fetching seniors'))
    
    console.log('\n✅ Debug Log Verification:')
    console.log(`   - Dashboard useEffect triggered: ${hasUseEffectLog ? '✅' : '❌'}`)
    console.log(`   - Manual refresh triggered: ${hasManualRefreshLog ? '✅' : '❌'}`)
    console.log(`   - Organization data fetch: ${hasOrgDataLog ? '✅' : '❌'}`)
    console.log(`   - Seniors data fetch: ${hasSeniorsLog ? '✅' : '❌'}`)
    
    // Save console logs to file
    const logReport = {
      timestamp: new Date().toISOString(),
      testUrl: dashboardUrl,
      totalLogs: consoleLogs.length,
      relevantLogs: relevantLogs.length,
      debugLogsFound: {
        useEffectTriggered: hasUseEffectLog,
        manualRefreshTriggered: hasManualRefreshLog,
        organizationDataFetch: hasOrgDataLog,
        seniorsDataFetch: hasSeniorsLog
      },
      allRelevantLogs: relevantLogs
    }
    
    const reportPath = path.join(__dirname, '../test-results/dashboard-console-logs-report.json')
    const reportDir = path.dirname(reportPath)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    fs.writeFileSync(reportPath, JSON.stringify(logReport, null, 2))
    
    console.log(`\n📄 Console logs report saved to: ${reportPath}`)
  })
})