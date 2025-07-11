'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  User,
  Plus,
  Edit,
  Trash2,
  Key,
  Shield,
  Building2,
  Users,
  Settings
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface OrganizationData {
  id: string
  name: string
  org_type: string
  contact_email: string
  contact_phone: string
  address: any
  is_active: boolean
  licence_seats: number
  created_at: string
}

interface AdminData {
  id: string
  org_id: string
  admin_name: string
  admin_email: string
  admin_phone: string
  admin_id: string
  admin_password: string
  is_active: boolean
  created_at: string
}

interface UserData {
  id: string
  email: string
  user_metadata: {
    name?: string
    phone?: string
  }
  created_at: string
  user_roles: Array<{
    role: string
    org_id: string
    created_at: string
  }>
}

export default function OrganizationManagePage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.id as string

  const [organization, setOrganization] = useState<OrganizationData | null>(null)
  const [admins, setAdmins] = useState<AdminData[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showUserCreateForm, setShowUserCreateForm] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_id: '',
    admin_password: ''
  })
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as 'org_admin' | 'staff' | 'viewer',
    password: ''
  })

  useEffect(() => {
    if (orgId) {
      fetchOrganizationData()
      fetchAdmins()
      fetchUsers()
    }
  }, [orgId])

  const fetchOrganizationData = async () => {
    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (error) throw error
      setOrganization(data)
    } catch (error) {
      console.error('Error fetching organization:', error)
      toast.error('조직 정보를 불러오는데 실패했습니다.')
    }
  }

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_admins')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error('Error fetching admins:', error)
      toast.error('관리자 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/users`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users')
      }

      setUsers(result.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('사용자 정보를 불러오는데 실패했습니다.')
    }
  }

  const generateAdminId = () => {
    if (!organization) return ''
    const orgPrefix = organization.name.slice(0, 3).toLowerCase().replace(/\s/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    return `${orgPrefix}${randomSuffix}`
  }

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleCreateAdmin = async () => {
    if (!newAdmin.admin_name || !newAdmin.admin_email) {
      toast.error('관리자 이름과 이메일은 필수입니다.')
      return
    }

    try {
      const adminData = {
        ...newAdmin,
        org_id: orgId,
        admin_id: newAdmin.admin_id || generateAdminId(),
        admin_password: newAdmin.admin_password || generateTempPassword(),
        is_active: true
      }

      const { error } = await supabase
        .from('organization_admins')
        .insert([adminData])

      if (error) throw error

      toast.success('관리자가 성공적으로 생성되었습니다.')
      setShowCreateForm(false)
      setNewAdmin({
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        admin_id: '',
        admin_password: ''
      })
      fetchAdmins()
    } catch (error: any) {
      console.error('Error creating admin:', error)
      if (error.code === '23505') {
        toast.error('이미 사용 중인 이메일 또는 ID입니다.')
      } else {
        toast.error('관리자 생성에 실패했습니다.')
      }
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('이름과 이메일은 필수입니다.')
      return
    }

    try {
      const password = newUser.password || generateTempPassword()
      
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          password: password,
          org_id: orgId
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user')
      }

      toast.success('사용자가 성공적으로 생성되었습니다.')
      setShowUserCreateForm(false)
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        password: ''
      })
      fetchUsers() // 사용자 목록 새로고침
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || '사용자 생성에 실패했습니다.')
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('정말로 이 관리자를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('organization_admins')
        .delete()
        .eq('id', adminId)

      if (error) throw error

      toast.success('관리자가 삭제되었습니다.')
      fetchAdmins()
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast.error('관리자 삭제에 실패했습니다.')
    }
  }

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_admins')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)

      if (error) throw error

      toast.success(`관리자 상태가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`)
      fetchAdmins()
    } catch (error) {
      console.error('Error updating admin status:', error)
      toast.error('상태 변경에 실패했습니다.')
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`정말로 사용자 '${userEmail}'을(를) 삭제하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user')
      }

      toast.success('사용자가 삭제되었습니다.')
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.message || '사용자 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">조직을 찾을 수 없습니다</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          조직 목록으로 돌아가기
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600">{organization.org_type} • 라이선스 {organization.licence_seats}개</p>
            </div>
          </div>
          <Badge variant={organization.is_active ? "default" : "secondary"}>
            {organization.is_active ? '활성' : '비활성'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 조직 정보 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                조직 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">조직명</Label>
                <p className="text-sm">{organization.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">유형</Label>
                <p className="text-sm">{organization.org_type}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">연락처 이메일</Label>
                <p className="text-sm">{organization.contact_email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">연락처 전화번호</Label>
                <p className="text-sm">{organization.contact_phone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">주소</Label>
                <p className="text-sm">{organization.address?.street || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">생성일</Label>
                <p className="text-sm">{new Date(organization.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 관리자 계정 관리 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  앱 로그인 계정 관리
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    앱 계정 생성
                  </Button>
                  <Button onClick={() => setShowUserCreateForm(true)} variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    새 계정 생성
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showUserCreateForm && (
                <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                  <h3 className="text-lg font-semibold mb-4">새 사용자 계정 생성</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="user_name">이름 *</Label>
                      <Input
                        id="user_name"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="사용자 이름"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_email">이메일 *</Label>
                      <Input
                        id="user_email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_phone">전화번호</Label>
                      <Input
                        id="user_phone"
                        value={newUser.phone}
                        onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="01012345678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_role">역할</Label>
                      <select
                        id="user_role"
                        value={newUser.role}
                        onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="org_admin">조직 관리자</option>
                        <option value="staff">직원</option>
                        <option value="viewer">조회자</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="user_password">비밀번호</Label>
                      <div className="flex gap-2">
                        <Input
                          id="user_password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="자동 생성됩니다"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewUser(prev => ({ ...prev, password: generateTempPassword() }))}
                        >
                          생성
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleCreateUser}>생성</Button>
                    <Button variant="outline" onClick={() => setShowUserCreateForm(false)}>취소</Button>
                  </div>
                </div>
              )}

              {showCreateForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4">새 앱 로그인 계정 생성</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="admin_name">관리자 이름 *</Label>
                      <Input
                        id="admin_name"
                        value={newAdmin.admin_name}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, admin_name: e.target.value }))}
                        placeholder="관리자 이름"
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin_email">이메일 *</Label>
                      <Input
                        id="admin_email"
                        type="email"
                        value={newAdmin.admin_email}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, admin_email: e.target.value }))}
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin_phone">전화번호</Label>
                      <Input
                        id="admin_phone"
                        value={newAdmin.admin_phone}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, admin_phone: e.target.value }))}
                        placeholder="01012345678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin_id">앱 로그인 ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="admin_id"
                          value={newAdmin.admin_id}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, admin_id: e.target.value }))}
                          placeholder="자동 생성됩니다"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewAdmin(prev => ({ ...prev, admin_id: generateAdminId() }))}
                        >
                          생성
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="admin_password">임시 비밀번호</Label>
                      <div className="flex gap-2">
                        <Input
                          id="admin_password"
                          value={newAdmin.admin_password}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, admin_password: e.target.value }))}
                          placeholder="자동 생성됩니다"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewAdmin(prev => ({ ...prev, admin_password: generateTempPassword() }))}
                        >
                          생성
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleCreateAdmin}>생성</Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>취소</Button>
                  </div>
                </div>
              )}

              {/* 관리자 목록 */}
              <div className="space-y-4">
                {admins.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    생성된 관리자 계정이 없습니다.
                  </div>
                ) : (
                  admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <User className="h-8 w-8 text-gray-400" />
                        <div>
                          <h4 className="font-medium">{admin.admin_name}</h4>
                          <p className="text-sm text-gray-600">{admin.admin_email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <Key className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">ID: {admin.admin_id}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">PW: ********</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 px-1 text-xs"
                                onClick={() => {
                                  navigator.clipboard.writeText(admin.admin_password)
                                  toast.success('비밀번호가 클립보드에 복사되었습니다')
                                }}
                              >
                                복사
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={admin.is_active ? "default" : "secondary"}>
                          {admin.is_active ? '활성' : '비활성'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                        >
                          {admin.is_active ? '비활성화' : '활성화'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 조직 사용자 관리 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                조직 소속 사용자 관리
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    등록된 사용자가 없습니다.
                  </div>
                ) : (
                  users.map((user) => {
                    const userRole = user.user_roles.find(role => role.org_id === orgId)
                    const roleName = userRole?.role === 'org_admin' ? '조직 관리자' : 
                                   userRole?.role === 'staff' ? '직원' : '조회자'
                    
                    return (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <User className="h-8 w-8 text-gray-400" />
                          <div>
                            <h4 className="font-medium">{user.user_metadata.name || '이름 없음'}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <Badge variant="outline">{roleName}</Badge>
                              {user.user_metadata.phone && (
                                <span className="text-xs text-gray-500">
                                  📞 {user.user_metadata.phone}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}