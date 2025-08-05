// Updated dashboard component to use real data from database
// Replace the hardcoded data in src/app/org/[org-id]/dashboard/page.tsx

// Add these new data fetching functions to the component:

const [genderData, setGenderData] = useState([
  { name: 'Male', value: 45, count: 156, fill: '#3D3D3D' },
  { name: 'Female', value: 55, count: 191, fill: '#D8D8D8' }
]);

const [dailyActivityData, setDailyActivityData] = useState([
  { day: 'Mon', sessions: 12 },
  { day: 'Tue', sessions: 19 },
  { day: 'Wed', sessions: 15 },
  { day: 'Thu', sessions: 22 },
  { day: 'Fri', sessions: 18 },
  { day: 'Sat', sessions: 25 },
  { day: 'Sun', sessions: 16 }
]);

const [healthStatusData, setHealthStatusData] = useState([
  { name: 'Excellent', value: 25, fill: '#111827' },
  { name: 'Good', value: 40, fill: '#374151' },
  { name: 'Fair', value: 25, fill: '#6b7280' },
  { name: 'Poor', value: 10, fill: '#9ca3af' }
]);

// Add this function to fetch real chart data:
const fetchChartData = async () => {
  try {
    // Fetch gender distribution
    const { data: seniorsGender, error: genderError } = await supabase
      .from('seniors')
      .select('gender_enum')
      .eq('org_id', orgId);

    if (!genderError && seniorsGender) {
      const maleCount = seniorsGender.filter(s => s.gender_enum === 'M').length;
      const femaleCount = seniorsGender.filter(s => s.gender_enum === 'F').length;
      const total = maleCount + femaleCount;
      
      if (total > 0) {
        setGenderData([
          { 
            name: 'Male', 
            value: Math.round((maleCount / total) * 100), 
            count: maleCount, 
            fill: '#3D3D3D' 
          },
          { 
            name: 'Female', 
            value: Math.round((femaleCount / total) * 100), 
            count: femaleCount, 
            fill: '#D8D8D8' 
          }
        ]);
      }
    }

    // Fetch daily activity data for the last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const { data: dailySessions, error: sessionsError } = await supabase
      .from('daily_sessions')
      .select(`
        session_date,
        completed,
        seniors!inner (org_id)
      `)
      .eq('seniors.org_id', orgId)
      .eq('completed', true)
      .gte('session_date', last7Days[0].toISOString().split('T')[0]);

    if (!sessionsError && dailySessions) {
      const activityByDay = last7Days.map(date => {
        const dayName = dayNames[date.getDay()];
        const dateStr = date.toISOString().split('T')[0];
        const sessionsCount = dailySessions.filter(s => s.session_date === dateStr).length;
        
        return {
          day: dayName,
          sessions: sessionsCount
        };
      });
      
      setDailyActivityData(activityByDay);
    }

    // Fetch health status distribution
    const { data: healthAssessments, error: healthError } = await supabase
      .from('health_assessments')
      .select(`
        overall_health_status,
        seniors!inner (org_id)
      `)
      .eq('seniors.org_id', orgId);

    if (!healthError && healthAssessments && healthAssessments.length > 0) {
      const statusCounts = healthAssessments.reduce((acc, assessment) => {
        const status = assessment.overall_health_status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const total = healthAssessments.length;
      const healthData = [
        { name: 'Excellent', value: Math.round(((statusCounts.Excellent || 0) / total) * 100), fill: '#111827' },
        { name: 'Good', value: Math.round(((statusCounts.Good || 0) / total) * 100), fill: '#374151' },
        { name: 'Fair', value: Math.round(((statusCounts.Fair || 0) / total) * 100), fill: '#6b7280' },
        { name: 'Poor', value: Math.round(((statusCounts.Poor || 0) / total) * 100), fill: '#9ca3af' }
      ];

      setHealthStatusData(healthData);
    }

  } catch (error) {
    console.error('Error fetching chart data:', error);
  }
};

// Update the useEffect to call fetchChartData:
useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch organization info
      const { data: orgData, error: orgError } = await supabase
        .from('organisations')
        .select('id, name, org_type, is_active')
        .eq('id', orgId)
        .single()

      if (orgError) throw orgError
      setOrganization(orgData)

      // Fetch chart data
      await fetchChartData();

    } catch (error) {
      console.error('Error fetching organization data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (orgId) {
    fetchData()
  }
}, [orgId]);

// Also update the refresh handler to include chart data:
const handleRefresh = async () => {
  await refetch();
  await fetchChartData();
};