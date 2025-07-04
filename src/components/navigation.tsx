'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, AlertTriangle, FileText, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/users', label: 'User', icon: Users },
    { href: '/reports', label: 'Report', icon: FileText },
    { href: '/schedules', label: 'Schedules', icon: Calendar },
    { href: '/monitoring', label: 'Monitoring', icon: AlertTriangle },
  ]

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <nav className="bg-white text-gray-800 h-screen w-64 fixed left-0 top-0 border-r border-gray-200">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img 
            src="https://github.com/showboyz/showboyz.github.io/blob/main/BHP_eng@3x.png?raw=true" 
            alt="Brain Health Playground" 
            className="h-16 w-auto"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <div className="px-4 py-6">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
        {user && (
          <div className="mb-3 px-3">
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm">Log out</span>
        </Button>
      </div>
    </nav>
  )
}