// Mock Supabase client for demo mode
export const createMockSupabase = () => {
  const mockAuth = {
    getSession: async () => ({
      data: { session: null },
      error: null
    }),
    signInWithPassword: async (credentials: any) => ({
      data: { user: null, session: null },
      error: { message: 'Demo mode - authentication disabled' }
    }),
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
      data: { session: null, user: null },
      error: { message: 'Demo mode - refresh disabled' }
    }),
    onAuthStateChange: (callback: Function) => ({
      data: { subscription: { unsubscribe: () => {} } }
    })
  }

  const mockDatabase = {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => ({
            data: null,
            error: { message: `Demo mode - ${table} query disabled` }
          }),
          then: async (callback: Function) => callback({
            data: [],
            error: { message: `Demo mode - ${table} query disabled` }
          })
        }),
        then: async (callback: Function) => callback({
          data: [],
          error: { message: `Demo mode - ${table} query disabled` }
        })
      }),
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: async () => ({
            data: null,
            error: { message: `Demo mode - ${table} insert disabled` }
          })
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) => ({
            single: async () => ({
              data: null,
              error: { message: `Demo mode - ${table} update disabled` }
            })
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: async (callback: Function) => callback({
            data: null,
            error: { message: `Demo mode - ${table} delete disabled` }
          })
        })
      })
    })
  }

  return {
    auth: mockAuth,
    ...mockDatabase
  }
}