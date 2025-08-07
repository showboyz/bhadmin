# CURRENT Column Formatting Test Guide

## Overview
This guide explains how to use the Playwright test to verify that the CURRENT column in the User Management page shows "Session X" format instead of the problematic "Week X week" format.

## Test Location
- **URL being tested**: `http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/users`
- **Test file**: `tests/current-column-formatting-test.spec.ts`
- **Screenshot directory**: `test-screenshots/`

## Prerequisites
1. **Application must be running** on `http://localhost:3001`
   ```bash
   npm run dev
   ```

2. **Playwright must be installed** (already installed based on package.json)
   ```bash
   npm install
   ```

## Running the Test

### Option 1: Using the shell script (Recommended)
```bash
./run-current-column-test.sh
```

### Option 2: Using npm scripts
```bash
# Run just the CURRENT column test
npm run test:current-column

# Run all Playwright tests
npm run test:playwright

# Run with UI mode for interactive testing
npm run test:playwright:ui

# Run in debug mode with browser visible
npm run test:playwright:debug
```

### Option 3: Direct Playwright command
```bash
npx playwright test current-column-formatting-test.spec.ts
```

## What the Test Does

### 1. Page Navigation
- Navigates to the User Management page
- Waits for full page load and network idle
- Takes initial screenshot

### 2. Table Detection
- Searches for user data table using multiple selectors
- Identifies table headers and structure
- Locates CURRENT column if present

### 3. Format Pattern Analysis
- Scans all page content for formatting patterns:
  - ✅ **Correct**: `Session X` format
  - ❌ **Problematic**: `Week X week` format  
  - ⚠️ **Alternative**: `Week X` format
- Examines individual table cells for current status

### 4. User Row Examination
- Specifically checks rows for users: 김영희, 박철수
- Analyzes current status formatting in user rows
- Records row content for detailed analysis

### 5. Screenshot Documentation
- Takes comprehensive screenshots of:
  - Initial page load
  - Table focus view
  - Any formatting issues found

### 6. Report Generation
- Creates detailed JSON report: `test-screenshots/current-column-formatting-report.json`
- Includes findings, recommendations, and evidence
- Provides clear verdict on formatting compliance

## Test Results Interpretation

### ✅ Test Passes When:
- Only "Session X" format is found
- No "Week X week" problematic format detected
- Correct formatting confirmed in user rows

### ❌ Test Fails When:
- "Week X week" problematic format is detected
- Evidence of incorrect formatting in table cells

### ⚠️ Test Inconclusive When:
- No definitive formatting patterns found
- Table structure different than expected
- Manual review recommended

## Output Files

### Screenshots (in `test-screenshots/`)
- `current-column-01-initial.png` - Initial page load
- `current-column-02-table-focus.png` - Table focused view

### Reports
- `current-column-formatting-report.json` - Detailed test findings

## Troubleshooting

### App Not Running
If you see "App is not running on localhost:3001":
```bash
npm run dev
# Ensure it starts on port 3001, not 3000
```

### No Table Found
If test reports "No user table found":
- Check if users page loads correctly in browser
- Verify authentication/permissions for the org
- Table structure may have changed (update selectors)

### Authentication Issues
If the page redirects or shows login:
- Ensure proper authentication is set up
- Check if user has access to the specific organization
- May need to run login flow first

### No Formatting Patterns Found
If test shows "No definitive formatting patterns found":
- Manually check the page in browser
- Look for alternative text or column structures
- Update test selectors if UI has changed

## Advanced Usage

### Running with Specific Browser
```bash
npx playwright test current-column-formatting-test.spec.ts --project=chromium
```

### Generating HTML Report
```bash
npm run test:current-column
npx playwright show-report
```

### Debugging with Browser Visible
```bash
npx playwright test current-column-formatting-test.spec.ts --headed --debug
```

## Integration with CI/CD
The test can be integrated into automated pipelines:
```bash
# Example CI script
npm install
npm run build
npm start &
sleep 10  # Wait for server to start
npm run test:current-column
```

## Expected Test Behavior
1. ✅ Navigate to user management page successfully
2. ✅ Find and examine user table structure  
3. ✅ Scan for "Session X" format (should find matches)
4. ❌ Scan for "Week X week" format (should find none)
5. ✅ Generate comprehensive report with evidence
6. ✅ Take screenshots for visual verification

## Contact
If you encounter issues or need to modify the test:
- Test file: `tests/current-column-formatting-test.spec.ts`
- Configuration: `playwright.config.ts`
- Script: `run-current-column-test.sh`