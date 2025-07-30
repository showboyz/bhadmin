'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function DemoModeBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const checkDemoMode = () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const isDemo = supabaseUrl?.includes('demo.supabase.co') || supabaseKey === 'demo-anon-key'
      setIsDemoMode(isDemo)
    }

    checkDemoMode()
  }, [])

  if (!isDemoMode || !isVisible) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 relative">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <strong>Demo Mode Active:</strong> Supabase functionality is mocked. 
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-yellow-800 ml-1"
            >
              Create a Supabase project
            </a> 
            and update your environment variables to enable full functionality.
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 ml-3 text-yellow-400 hover:text-yellow-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}