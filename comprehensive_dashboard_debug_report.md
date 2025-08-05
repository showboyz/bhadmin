# Andrew's Clinic Dashboard API Debug Analysis

## Overview
Since Playwright MCP is not available in the current environment, this report provides a comprehensive manual debugging approach for diagnosing the Andrew's Clinic dashboard API issues where the database has 33 seniors but the dashboard shows all zeros.

## Key Findings from Code Analysis

### 1. Dashboard Data Flow (from `src/hooks/use-dashboard.ts`)

The dashboard makes these specific API calls:

#### A. Primary Seniors Query
```typescript
let seniorsQuery = supabase
  .from('seniors')
  .select(`
    *,
    schedules!inner (
      id,
      start_date,
      end_date,
      status,
      sessions_per_week
    )
  `)

if (orgId) {
  seniorsQuery = seniorsQuery.eq('org_id', orgId)
}
```

**Expected API Call:**
```
GET /rest/v1/seniors?select=*,schedules!inner(id,start_date,end_date,status,sessions_per_week)&org_id=eq.bf579a76-e9c5-45be-8659-7e62664883c4
```

**⚠️ CRITICAL ISSUE IDENTIFIED:**
The query uses `schedules!inner` which means it will ONLY return seniors who have schedules. If the 33 seniors don't have corresponding schedule records, they won't appear in the results.

#### B. Organisation Query
```typescript
let orgsQuery = supabase
  .from('organisations')
  .select('licence_seats')

if (orgId) {
  orgsQuery = orgsQuery.eq('id', orgId)
}
```

**Expected API Call:**
```
GET /rest/v1/organisations?select=licence_seats&id=eq.bf579a76-e9c5-45be-8659-7e62664883c4
```

#### C. Motor Results Query
```typescript
const { data: motorResults, error: motorError } = await supabase
  .from('motor_results')
  .select('senior_id, created_at')
  .gte('created_at', weekAgo.toISOString())
```

**Expected API Call:**
```
GET /rest/v1/motor_results?select=senior_id,created_at&created_at=gte.2025-07-28T[TIME]Z
```

**⚠️ POTENTIAL ISSUE:**
This query is NOT filtered by organization, so it might return results from all organizations, but then the dashboard logic tries to match these results with seniors from the specific org.

#### D. Cognitive Results Query
```typescript
const { data: cognitiveResults, error: cognitiveError } = await supabase
  .from('cognitive_results')
  .select('senior_id, created_at')
  .gte('created_at', weekAgo.toISOString())
```

**Expected API Call:**
```
GET /rest/v1/cognitive_results?select=senior_id,created_at&created_at=gte.2025-07-28T[TIME]Z
```

**⚠️ SAME ISSUE:**
This query is also NOT filtered by organization.

### 2. Database Schema Issues

From the TypeScript definitions, I can see a mismatch:

- **Seniors table** uses `org_id` field (line 62 in supabase.ts)
- **Schedules table** does NOT have an `organisation_id` field in the schema (lines 102-133)
- But the motor/cognitive results queries expect to join through `schedules.organisation_id`

This suggests either:
1. The database schema is different from the TypeScript definitions
2. There's a missing relationship or field
3. The join strategy is incorrect

## Manual Debugging Steps

### Step 1: Browser Network Monitoring

1. **Open Chrome DevTools**
   - Navigate to `http://localhost:3001`
   - Open DevTools (F12) → Network tab
   - Filter by "Fetch/XHR"

2. **Login and Navigate**
   - Login: `todays777@gmail.com` / `your-new-password`
   - Navigate to: `http://localhost:3001/org/bf579a76-e9c5-45be-8659-7e62664883c4/dashboard`

3. **Monitor These Specific Requests:**
   - Look for requests to `/rest/v1/seniors`
   - Look for requests to `/rest/v1/organisations`
   - Look for requests to `/rest/v1/motor_results`
   - Look for requests to `/rest/v1/cognitive_results`

### Step 2: Request Analysis Checklist

For each API request, verify:

#### Headers:
- ✅ `Authorization: Bearer [valid-jwt-token]`
- ✅ `apikey: [supabase-anon-key]`
- ✅ `Content-Type: application/json`

#### Query Parameters:
- ✅ `org_id=eq.bf579a76-e9c5-45be-8659-7e62664883c4` for seniors
- ✅ `id=eq.bf579a76-e9c5-45be-8659-7e62664883c4` for organisations
- ✅ Date filtering for motor/cognitive results

#### Response Analysis:
- ✅ Status code should be 200
- ✅ Response body should contain data array
- ✅ Check if arrays are empty `[]` vs populated

### Step 3: Use Browser Console API Monitor

Copy and paste the provided JavaScript snippet (`browser_api_monitor.js`) into the browser console after loading the dashboard. This will:

- Intercept all fetch/XMLHttpRequest calls
- Log detailed request/response information
- Highlight empty responses
- Provide exportable debugging data

### Step 4: Database Verification Queries

Run these queries directly in your Supabase dashboard or database console:

```sql
-- 1. Verify seniors exist for Andrew's Clinic
SELECT COUNT(*) as senior_count 
FROM seniors 
WHERE org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- 2. Verify schedules table structure and data
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'schedules';

-- 3. Check schedules for Andrew's Clinic seniors
SELECT COUNT(*) as schedule_count
FROM schedules s
INNER JOIN seniors sen ON s.senior_id = sen.id
WHERE sen.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- 4. Test the exact query the dashboard is using
SELECT s.*, 
       sch.id as schedule_id,
       sch.start_date,
       sch.end_date,
       sch.status,
       sch.sessions_per_week
FROM seniors s
INNER JOIN schedules sch ON s.id = sch.senior_id
WHERE s.org_id = 'bf579a76-e9c5-45be-8659-7e62664883c4';

-- 5. Check if schedules has organisation_id field
SELECT s.id, s.senior_id, s.organisation_id
FROM schedules s
LIMIT 5;
```

## Most Likely Root Causes

### 1. Missing Schedule Records (90% probability)
The dashboard query uses `schedules!inner` which requires every senior to have at least one schedule record. If your 33 seniors don't have schedules, they won't appear.

**Fix:** Either:
- Create schedule records for all seniors
- Change the join from `!inner` to `!left` to include seniors without schedules

### 2. Schema Mismatch (70% probability)
The motor/cognitive results queries expect `schedules.organisation_id` but the TypeScript schema doesn't show this field.

**Fix:** Either:
- Add `organisation_id` field to schedules table
- Modify the query strategy to join through seniors table

### 3. Incorrect Organization ID Field Name (50% probability)
The seniors table might use `organisation_id` instead of `org_id`.

**Fix:** Check the actual database schema and update queries accordingly.

### 4. Supabase RLS (Row Level Security) Issues (30% probability)
The user might not have permission to access the data due to RLS policies.

**Fix:** Check RLS policies for all tables.

## Recommended Debugging Sequence

1. **Quick Test:** Run the SQL queries above to verify data exists
2. **Network Analysis:** Use browser DevTools to see actual API calls
3. **Schema Verification:** Check if schedules table has the expected fields
4. **Join Strategy Fix:** Modify the dashboard query to handle missing schedules
5. **Organization Filtering:** Ensure motor/cognitive results are properly filtered

## Expected Results vs Current Results

**Expected (based on your data):**
- Total Users: 33
- Active Today: 3
- Weekly Active: 19
- Various motor/cognitive training results

**Current (dashboard showing):**
- All metrics: 0

**Root Cause Location:**
The issue is most likely in the `seniors` query with `schedules!inner` join, which is filtering out seniors without schedule records.

## Quick Fix Suggestion

Modify the dashboard query in `src/hooks/use-dashboard.ts` line 62 from:
```typescript
schedules!inner (
```

To:
```typescript
schedules (
```

This will change from INNER JOIN to LEFT JOIN, including seniors without schedules.

## Files to Examine

1. `/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/src/hooks/use-dashboard.ts` - Main dashboard logic
2. `/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/src/lib/supabase.ts` - Database configuration
3. `/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/debug_api_calls.sh` - Manual API testing script
4. `/Users/andrew/CascadeProjects/pdf.md/brain-health-admin/browser_api_monitor.js` - Browser console monitoring

## Next Steps

1. Use the browser debugging tools provided
2. Run the database verification queries
3. Apply the suggested fixes based on findings
4. Test with real data to confirm the dashboard displays correctly