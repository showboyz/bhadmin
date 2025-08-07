#!/bin/bash

# Run Current Column Formatting Test
# This script will test the User Management page to verify CURRENT column formatting

echo "🎭 Starting CURRENT Column Formatting Test..."
echo "=========================================="

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Check if the app is running on localhost:3001
echo "🔍 Checking if app is running on localhost:3001..."
if curl -s --connect-timeout 5 http://localhost:3001 > /dev/null; then
    echo "✅ App is running on localhost:3001"
else
    echo "❌ App is not running on localhost:3001"
    echo "Please start the app with: npm run dev"
    echo "Make sure it's running on port 3001"
    exit 1
fi

# Create screenshots directory if it doesn't exist
mkdir -p test-screenshots

# Run the specific test
echo "🚀 Running CURRENT column formatting test..."
npm run test:current-column

# Check if test results are available
if [ -f "test-screenshots/current-column-formatting-report.json" ]; then
    echo ""
    echo "📊 Test Report Generated:"
    echo "========================"
    
    # Extract key findings from the JSON report
    if command -v jq > /dev/null; then
        echo "🎯 Key Findings:"
        jq -r '.verdict.recommendation' test-screenshots/current-column-formatting-report.json 2>/dev/null || echo "Could not parse recommendation"
        
        echo ""
        echo "📈 Format Counts:"
        echo "  Session Format: $(jq -r '.findings.sessionMatches | length' test-screenshots/current-column-formatting-report.json 2>/dev/null || echo 'N/A')"
        echo "  Week Week Format: $(jq -r '.findings.weekWeekMatches | length' test-screenshots/current-column-formatting-report.json 2>/dev/null || echo 'N/A')"
        echo "  Alternative Week Format: $(jq -r '.findings.weekMatches | length' test-screenshots/current-column-formatting-report.json 2>/dev/null || echo 'N/A')"
    else
        echo "📋 Full test report available at: test-screenshots/current-column-formatting-report.json"
        echo "Install 'jq' for formatted output: brew install jq"
    fi
else
    echo "⚠️  Test report not generated. Check test output above for details."
fi

# Show screenshots location
echo ""
echo "📸 Screenshots saved in: test-screenshots/"
ls -la test-screenshots/current-column-*.png 2>/dev/null || echo "No screenshots found"

echo ""
echo "🎭 CURRENT Column Formatting Test Completed!"
echo "============================================="