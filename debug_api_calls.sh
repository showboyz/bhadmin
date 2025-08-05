#!/bin/bash

# Debug script for Andrew's Clinic Dashboard API calls
# Usage: ./debug_api_calls.sh

echo "=== Andrew's Clinic Dashboard API Debug Script ==="
echo "Organization ID: bf579a76-e9c5-45be-8659-7e62664883c4"
echo ""

# Base URL for API calls
BASE_URL="http://localhost:3001"
ORG_ID="bf579a76-e9c5-45be-8659-7e62664883c4"

# You'll need to replace these with actual values from your session
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
AUTH_TOKEN="your_auth_token"

echo "1. Testing /rest/v1/seniors endpoint..."
curl -v \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/rest/v1/seniors?select=*&organisation_id=eq.$ORG_ID" \
  2>&1 | tee seniors_response.log

echo ""
echo "2. Testing /rest/v1/organisations endpoint..."
curl -v \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/rest/v1/organisations?select=*&id=eq.$ORG_ID" \
  2>&1 | tee organisations_response.log

echo ""
echo "3. Testing /rest/v1/motor_results endpoint..."
curl -v \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/rest/v1/motor_results?select=*,schedules!inner(organisation_id)&schedules.organisation_id=eq.$ORG_ID" \
  2>&1 | tee motor_results_response.log

echo ""
echo "4. Testing /rest/v1/cognitive_results endpoint..."
curl -v \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/rest/v1/cognitive_results?select=*,schedules!inner(organisation_id)&schedules.organisation_id=eq.$ORG_ID" \
  2>&1 | tee cognitive_results_response.log

echo ""
echo "5. Testing schedules endpoint (to verify join relationship)..."
curl -v \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/rest/v1/schedules?select=*&organisation_id=eq.$ORG_ID" \
  2>&1 | tee schedules_response.log

echo ""
echo "=== Debug complete. Check the .log files for detailed responses ==="
echo ""
echo "To use this script:"
echo "1. Login to the dashboard in your browser"
echo "2. Open Developer Tools > Network tab"
echo "3. Find a request to Supabase and copy the Authorization header and apikey"
echo "4. Update the variables at the top of this script"
echo "5. Run: chmod +x debug_api_calls.sh && ./debug_api_calls.sh"