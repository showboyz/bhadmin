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
    { href: '/users', label: 'Users', icon: Users },
    { href: '/schedules', label: 'Schedules', icon: Calendar },
    { href: '/monitoring', label: 'Monitoring', icon: AlertTriangle },
    { href: '/reports', label: 'Reports', icon: FileText },
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
    <nav className="bg-[#111] text-white h-screen w-64 fixed left-0 top-0 p-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src="https://github.com/showboyz/showboyz.github.io/blob/main/BHP_eng@3x.png?raw=true" 
            alt="Brain Health Playground" 
            className="h-8 w-auto"
          />
        </div>
        {user && (
          <p className="text-sm text-gray-300 truncate">
            {user.email}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-[#222] text-white' 
                  : 'text-gray-300 hover:bg-[#222] hover:text-white'
              }`}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
      
      <div className="absolute bottom-4 left-4 right-4">
        <Button 
          variant="ghost" 
          className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-[#222]"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </nav>
  )
}