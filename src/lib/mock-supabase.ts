// Mock data storage for demo mode
let mockSeniors: any[] = [
  {
    id: 'demo-senior-existing-1',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '김영희',
    gender_enum: 'F',
    birth: '1958-05-20',
    phone: '010-1234-5678',
    health_status: 'Good',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    id: 'demo-senior-existing-2', 
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '박철수',
    gender_enum: 'M',
    birth: '1952-12-03',
    phone: '010-2345-6789',
    health_status: 'Fair',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: 'demo-senior-existing-3',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4', 
    name: '정할머니',
    gender_enum: 'F',
    birth: '1945-08-15',
    phone: '010-3456-7890',
    health_status: 'Excellent',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: 'demo-senior-existing-4',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '이순신',
    gender_enum: 'M',
    birth: '1950-01-15',
    phone: '010-4567-8901',
    health_status: 'Good',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  },
  {
    id: 'demo-senior-existing-5',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '김민수',
    gender_enum: 'M',
    birth: '1955-03-22',
    phone: '010-5678-9012',
    health_status: 'Poor',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
  },
  {
    id: 'demo-senior-existing-6',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '최영자',
    gender_enum: 'F',
    birth: '1948-07-11',
    phone: '010-6789-0123',
    health_status: 'Fair',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() // 12 days ago
  },
  {
    id: 'demo-senior-existing-7',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '한영수',
    gender_enum: 'M',
    birth: '1953-09-30',
    phone: '010-7890-1234',
    health_status: 'Good',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  },
  {
    id: 'demo-senior-existing-8',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '윤희정',
    gender_enum: 'F',
    birth: '1957-12-05',
    phone: '010-8901-2345',
    health_status: 'Excellent',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: 'demo-senior-existing-9',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '강철민',
    gender_enum: 'M',
    birth: '1951-04-18',
    phone: '010-9012-3456',
    health_status: 'Fair',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
  },
  {
    id: 'demo-senior-existing-10',
    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
    name: '송미영',
    gender_enum: 'F',
    birth: '1956-11-25',
    phone: '010-0123-4567',
    health_status: 'Good',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  }
]

// Mock Supabase client for demo mode
export const createMockSupabase = () => {
  // Create mock users for demo purposes  
  const mockAndrewUser = {
    id: 'andrew-user-456',
    email: 'andrew@youngandx.com',
    user_metadata: {
      full_name: 'Andrew Young'
    },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockSuperAdminUser = {
    id: 'super-admin-777',
    email: 'todays777@gmail.com',
    user_metadata: {
      full_name: 'Super Admin'
    },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Default to super admin for demo
  const mockUser = mockSuperAdminUser;

  const mockSession = {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: mockUser
  };

  const mockAuth = {
    getSession: async () => ({
      data: { session: mockSession },
      error: null
    }),
    signInWithPassword: async (credentials: any) => {
      // Return appropriate user based on email
      let user = mockUser; // Default to super admin
      if (credentials.email === 'andrew@youngandx.com') {
        user = mockAndrewUser;
      } else if (credentials.email === 'todays777@gmail.com') {
        user = mockSuperAdminUser;
      }
      
      const session = {
        ...mockSession,
        user: user
      };
      
      return {
        data: { user: user, session: session },
        error: null
      }
    },
    signInWithOtp: async (options: any) => ({
      data: null,
      error: { message: 'Demo mode - OTP disabled' }
    }),
    verifyOtp: async (options: any) => ({
      data: { user: null, session: null },
      error: { message: 'Demo mode - OTP verification disabled' }
    }),
    signOut: async () => ({
      error: null
    }),
    refreshSession: async () => ({
      data: { session: mockSession, user: mockUser },
      error: null
    }),
    getUser: async () => ({
      data: { user: mockUser },
      error: null
    }),
    onAuthStateChange: (callback: Function) => {
      // Simulate signed in state
      setTimeout(() => {
        callback('SIGNED_IN', mockSession);
      }, 100);
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  }

  const mockDatabase = {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (table === 'organisations') {
              return {
                data: { 
                  id: value, 
                  name: 'Andrew\'s Clinic', 
                  licence_seats: 100,
                  is_active: true
                },
                error: null
              }
            }
            if (table === 'user_roles') {
              // Return mock user roles for demo user
              if (column === 'user_id' && value === 'demo-user-123') {
                return {
                  data: {
                    id: 'demo-role-123',
                    user_id: 'demo-user-123',
                    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
                    role: 'org_admin',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: null
                  },
                  error: null
                }
              }
            }
            if (table === 'user_roles') {
              // Return andrew's roles
              if (column === 'user_id' && value === 'andrew-user-456') {
                return {
                  data: {
                    id: 'role-1',
                    user_id: 'andrew-user-456',
                    org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
                    role: 'org_admin',
                    created_at: new Date().toISOString()
                  },
                  error: null
                }
              }
              // Return super admin roles for todays777@gmail.com
              if (column === 'user_id' && value === 'super-admin-777') {
                return {
                  data: {
                    id: 'super-role-777',
                    user_id: 'super-admin-777',
                    org_id: null,
                    role: 'super_admin',
                    created_at: new Date().toISOString()
                  },
                  error: null
                }
              }
            }
            if (table === 'seniors') {
              const filtered = mockSeniors.filter((s: any) => s[column] === value)
              return {
                data: filtered[0] || null,
                error: null
              }
            }
            return { data: null, error: null }
          },
          then: async (callback: Function) => {
            if (table === 'seniors') {
              const filtered = mockSeniors.filter((s: any) => s[column] === value)
              console.log('🔍 Mock Supabase eq().then(): Filtering seniors by', column, '=', value)
              console.log('🔍 Mock Supabase eq().then(): Total seniors in array:', mockSeniors.length)
              console.log('🔍 Mock Supabase eq().then(): Found', filtered.length, 'seniors')
              console.log('🔍 Mock Supabase eq().then(): Sample senior org_ids:', mockSeniors.slice(0, 3).map(s => s.org_id))
              return callback({
                data: filtered,
                error: null
              })
            }
            if (table === 'user_roles' && column === 'user_id' && value === 'andrew-user-456') {
              return callback({
                data: [{
                  id: 'andrew-role-456',
                  user_id: 'andrew-user-456',
                  org_id: 'bf579a76-e9c5-45be-8659-7e62664883c4',
                  role: 'org_admin',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  created_by: null
                }],
                error: null
              })
            }
            if (table === 'user_roles' && column === 'user_id' && value === 'super-admin-777') {
              return callback({
                data: [{
                  id: 'super-role-777',
                  user_id: 'super-admin-777',
                  org_id: null,
                  role: 'super_admin',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  created_by: null
                }],
                error: null
              })
            }
            return callback({
              data: [],
              error: null
            })
          }
        }),
        gte: (column: string, value: any) => ({
          then: async (callback: Function) => callback({
            data: [],
            error: null
          })
        }),
        then: async (callback: Function) => {
          if (table === 'seniors') {
            console.log('🔍 Mock Supabase: Returning all seniors for dashboard:', mockSeniors.length)
            return callback({
              data: mockSeniors,
              error: null
            })
          }
          console.log('🔍 Mock Supabase: Table not seniors, returning empty:', table)
          return callback({
            data: [],
            error: null
          })
        }
      }),
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: async () => {
            if (table === 'seniors') {
              const mockSenior = {
                id: `demo-senior-${Date.now()}`,
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              // Add to mock storage
              mockSeniors.push(mockSenior)
              console.log('✅ Mock senior created and stored:', mockSenior)
              console.log('✅ Total seniors in array now:', mockSeniors.length)
              return {
                data: mockSenior,
                error: null
              }
            }
            return {
              data: { id: `demo-${table}-${Date.now()}` },
              error: null
            }
          }
        })
      })
    })
  }

  return {
    auth: mockAuth,
    ...mockDatabase
  }
}