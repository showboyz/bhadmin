# Browser-Based API Debugging Instructions

Since Playwright MCP is not available, here's how to manually debug the Andrew's Clinic dashboard API calls:

## Step-by-Step Browser Debugging

### 1. Setup Browser for Debugging
1. Open Chrome or Firefox
2. Navigate to `http://localhost:3001`
3. Open Developer Tools (F12)
4. Go to **Network** tab
5. Check "Preserve log" to keep requests across page navigation
6. Filter by "XHR" or "Fetch" to see only API calls

### 2. Login and Navigate
1. Login with credentials: `todays777@gmail.com` / `your-new-password`
2. Navigate to: `http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard`
3. Watch the Network tab for API requests

### 3. Key API Endpoints to Monitor

Look for these specific requests:

#### A. Seniors Data
```
URL Pattern: /rest/v1/seniors
Expected Query: ?select=*&organisation_id=eq.bf579a76-e9c5-45be-8659-7e62664883c4
```

#### B. Organisation Data  
```
URL Pattern: /rest/v1/organisations
Expected Query: ?select=*&id=eq.bf579a76-e9c5-45be-8659-7e62664883c4
```

#### C. Motor Results
```
URL Pattern: /rest/v1/motor_results
Expected Query: ?select=*,schedules!inner(organisation_id)&schedules.organisation_id=eq.bf579a76-e9c5-45be-8659-7e62664883c4
```

#### D. Cognitive Results
```
URL Pattern: /rest/v1/cognitive_results  
Expected Query: ?select=*,schedules!inner(organisation_id)&schedules.organisation_id=eq.bf579a76-e9c5-45be-8659-7e62664883c4
```

### 4. What to Check for Each Request

For each API call, examine:

#### Request Details:
- ✅ **URL**: Is the orgId parameter correct?
- ✅ **Method**: Should be GET for data retrieval
- ✅ **Headers**: 
  - `Authorization: Bearer [token]`
  - `apikey: [supabase-anon-key]`
  - `Content-Type: application/json`

#### Response Analysis:
- ✅ **Status Code**: Should be 200 for success
- ✅ **Response Body**: Check if data array is empty `[]` or has content
- ✅ **Response Headers**: Check for CORS issues or rate limiting

### 5. Common Issues to Look For

#### A. Empty Data Arrays
If you see responses like `[]` (empty array), check:
- Is the `organisation_id` filter working correctly?
- Are there actual records in the database for this org?

#### B. 4xx Status Codes
- **401 Unauthorized**: Token expired or invalid
- **403 Forbidden**: Permission issues
- **404 Not Found**: Endpoint doesn't exist

#### C. 5xx Status Codes  
- **500 Internal Server Error**: Database or server issues
- **502 Bad Gateway**: Connection issues

#### D. Join Issues (schedules!inner)
For motor_results and cognitive_results, verify:
- The `schedules!inner` join is working
- The `schedules.organisation_id=eq.[orgId]` filter is applied correctly

### 6. Console Errors
Check the **Console** tab for JavaScript errors that might indicate:
- Failed API calls
- Data processing errors
- Component rendering issues

### 7. Database Verification Queries

If API calls are successful but returning empty data, run these queries directly in your database:

```sql
-- Check seniors count for Andrew's Clinic
SELECT COUNT(*) FROM seniors WHERE organisation_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- Check schedules for this org
SELECT COUNT(*) FROM schedules WHERE organisation_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- Check motor results with join
SELECT COUNT(*) 
FROM motor_results mr
INNER JOIN schedules s ON mr.schedule_id = s.id
WHERE s.organisation_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- Check cognitive results with join  
SELECT COUNT(*)
FROM cognitive_results cr
INNER JOIN schedules s ON cr.schedule_id = s.id
WHERE s.organisation_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';
```

### 8. Expected Results
Based on your database having:
- 33 seniors for Andrew's Clinic
- 3 active today  
- 19 active this week

You should see:
- `/seniors` endpoint returning 33 records
- Dashboard showing 3 active today, 19 active this week
- Motor/cognitive results based on actual test completions

### 9. Reporting Issues
Document any findings:
- Screenshot failed requests
- Copy request/response headers and bodies
- Note exact error messages
- Record the sequence of API calls made

## Quick Test Script Alternative

If you prefer command line testing, use the generated `debug_api_calls.sh` script:

1. Login to dashboard in browser
2. Copy Authorization token and apikey from Network tab
3. Update script variables
4. Run: `chmod +x debug_api_calls.sh && ./debug_api_calls.sh`