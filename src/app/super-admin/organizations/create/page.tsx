'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2, 
  User, 
  Settings, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Database,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface OrganizationFormData {
  // 기본 정보
  name: string
  org_type: 'clinic' | 'hospital' | 'care_center' | 'rehabilitation_center'
  contact_email: string
  contact_phone: string
  
  // 주소
  address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  
  // 설정
  subscription_plan: 'basic' | 'premium' | 'enterprise'
  license_limit: number
  
  // 관리자 정보
  admin_name: string
  admin_email: string
  admin_phone: string
  admin_id: string // 앱 로그인 ID
  admin_password: string // 임시 비밀번호
}

const initialFormData: OrganizationFormData = {
  name: '',
  org_type: 'care_center',
  contact_email: '',
  contact_phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: '대한민국'
  },
  subscription_plan: 'basic',
  license_limit: 50,
  admin_name: '',
  admin_email: '',
  admin_phone: '',
  admin_id: '',
  admin_password: ''
}

const steps = [
  { id: 1, name: '기본 정보', icon: Building2, description: '기관 정보 입력' },
  { id: 2, name: '설정 및 플랜', icon: Settings, description: '구독 및 라이선스' },
  { id: 3, name: '관리자 계정', icon: User, description: '관리자 생성' },
  { id: 4, name: '검토 및 생성', icon: CheckCircle, description: '최종 확인' },
]

const organizationTypes = [
  { value: 'care_center', label: '요양원', description: '노인 요양 시설' },
  { value: 'clinic', label: '클리닉', description: '의료 클리닉' },
  { value: 'hospital', label: '병원', description: '종합 병원' },
  { value: 'rehabilitation_center', label: '재활센터', description: '재활 치료 센터' }
]

const subscriptionPlans = [
  { 
    value: 'basic', 
    label: 'Basic', 
    price: '₩29,000/월',
    features: ['최대 50명', '기본 분석', '이메일 지원', '기본 운동 프로그램']
  },
  { 
    value: 'premium', 
    label: 'Premium', 
    price: '₩79,000/월',
    features: ['최대 200명', '고급 분석', '우선 지원', '맞춤 운동 프로그램', '진행률 리포트']
  },
  { 
    value: 'enterprise', 
    label: 'Enterprise', 
    price: '₩199,000/월',
    features: ['무제한', '전체 분석 스위트', '24/7 지원', '맞춤 통합', '전담 계정 매니저']
  }
]

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OrganizationFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creationResult, setCreationResult] = useState<any>(null)

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      }
      
      // 연락처 이메일이 변경되면 관리자 이메일도 자동으로 동일하게 설정
      if (field === 'contact_email') {
        updated.admin_email = value
      }
      
      return updated
    })
    
    // 오류 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const updateAddressField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }))
  }

  const formatPhoneNumber = (value: string) => {
    // '-' 문자를 모두 제거하고 숫자만 남김
    return value.replace(/[^0-9]/g, '')
  }

  const generateAdminId = () => {
    const orgPrefix = formData.name.slice(0, 3).toLowerCase().replace(/\s/g, '')
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

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = '기관명을 입력해주세요'
        if (!formData.contact_email.trim()) newErrors.contact_email = '연락처 이메일을 입력해주세요'
        if (!/\S+@\S+\.\S+/.test(formData.contact_email)) newErrors.contact_email = '올바른 이메일 형식을 입력해주세요'
        if (!formData.contact_phone.trim()) newErrors.contact_phone = '연락처 전화번호를 입력해주세요'
        if (!formData.address.street.trim()) newErrors.street = '주소를 입력해주세요'
        if (!formData.address.city.trim()) newErrors.city = '도시를 입력해주세요'
        break
      case 2:
        if (formData.license_limit < 1) newErrors.license_limit = '라이선스 제한은 최소 1개 이상이어야 합니다'
        break
      case 3:
        if (!formData.admin_name.trim()) newErrors.admin_name = '관리자 이름을 입력해주세요'
        // 관리자 이메일은 연락처 이메일과 동일하게 자동 설정되므로 별도 검증 불필요
        if (!formData.admin_id.trim()) newErrors.admin_id = '관리자 ID를 입력해주세요'
        if (!formData.admin_password.trim()) newErrors.admin_password = '임시 비밀번호를 입력해주세요'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setLoading(true)
    
    try {
      // Supabase 세션 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`
          })
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      console.log('API Response:', result) // 디버깅용 로그

      if (result.success) {
        setCreationResult(result.data)
        toast.success('기관이 성공적으로 생성되었습니다!')
        
        // 5초 후 기관 목록으로 이동
        setTimeout(() => {
          router.push('/super-admin/organizations')
        }, 5000)
      } else {
        console.error('API Error Details:', result) // 상세 오류 로그
        const errorMessage = result.details || result.error || 'Failed to create organization'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Organization creation error:', error)
      setErrors({ submit: error instanceof Error ? error.message : '기관 생성에 실패했습니다.' })
      toast.error('기관 생성 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
    } finally {
      setLoading(false)
    }
  }

  if (creationResult) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">기관 생성 완료!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Supabase 저장</h3>
                </div>
                <p className="text-sm text-gray-600">기관 ID: {creationResult.organization?.id}</p>
                <Badge variant="default" className="bg-green-100 text-green-800 mt-2">성공</Badge>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">DynamoDB 저장</h3>
                </div>
                <p className="text-sm text-gray-600">이중 백업 완료</p>
                <Badge variant="default" className="bg-green-100 text-green-800 mt-2">성공</Badge>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold mb-2">생성된 기관 정보</h3>
              <div className="text-sm space-y-1">
                <div><strong>기관명:</strong> {formData.name}</div>
                <div><strong>관리자 이메일:</strong> {formData.admin_email}</div>
                <div><strong>관리자 ID:</strong> {formData.admin_id}</div>
                <div><strong>임시 비밀번호:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{formData.admin_password}</code></div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">5초 후 기관 목록으로 자동 이동됩니다.</p>
              <Button 
                onClick={() => router.push('/super-admin/organizations')}
                className="mr-2"
              >
                기관 목록으로 이동
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setCreationResult(null)
                  setFormData(initialFormData)
                  setCurrentStep(1)
                }}
              >
                새 기관 생성
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">기관명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="기관명을 입력하세요"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="org_type">기관 유형</Label>
                  <select
                    id="org_type"
                    value={formData.org_type}
                    onChange={(e) => updateFormData('org_type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {organizationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">연락처 이메일 *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => updateFormData('contact_email', e.target.value)}
                      placeholder="contact@organization.com"
                      className={errors.contact_email ? 'border-red-500' : ''}
                    />
                    {errors.contact_email && <p className="text-sm text-red-600 mt-1">{errors.contact_email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="contact_phone">연락처 전화번호 *</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => updateFormData('contact_phone', formatPhoneNumber(e.target.value))}
                      placeholder="01012345678"
                      className={errors.contact_phone ? 'border-red-500' : ''}
                    />
                    {errors.contact_phone && <p className="text-sm text-red-600 mt-1">{errors.contact_phone}</p>}
                  </div>
                </div>

                <div>
                  <Label>주소</Label>
                  <div className="space-y-3">
                    <Input
                      value={formData.address.street}
                      onChange={(e) => updateAddressField('street', e.target.value)}
                      placeholder="도로명 주소 *"
                      className={errors.street ? 'border-red-500' : ''}
                    />
                    {errors.street && <p className="text-sm text-red-600 mt-1">{errors.street}</p>}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={formData.address.city}
                        onChange={(e) => updateAddressField('city', e.target.value)}
                        placeholder="도시 *"
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      <Input
                        value={formData.address.state}
                        onChange={(e) => updateAddressField('state', e.target.value)}
                        placeholder="시/도"
                      />
                    </div>
                    {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={formData.address.postal_code}
                        onChange={(e) => updateAddressField('postal_code', e.target.value)}
                        placeholder="우편번호"
                      />
                      <Select
                        value={formData.address.country}
                        onValueChange={(value) => updateAddressField('country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="국가 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="대한민국">대한민국</SelectItem>
                          <SelectItem value="미국">미국</SelectItem>
                          <SelectItem value="일본">일본</SelectItem>
                          <SelectItem value="중국">중국</SelectItem>
                          <SelectItem value="싱가포르">싱가포르</SelectItem>
                          <SelectItem value="캐나다">캐나다</SelectItem>
                          <SelectItem value="호주">호주</SelectItem>
                          <SelectItem value="영국">영국</SelectItem>
                          <SelectItem value="프랑스">프랑스</SelectItem>
                          <SelectItem value="독일">독일</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">설정 및 구독 플랜</h3>
              <div className="space-y-6">
                <div>
                  <Label>구독 플랜</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {subscriptionPlans.map(plan => (
                      <div
                        key={plan.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          formData.subscription_plan === plan.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => updateFormData('subscription_plan', plan.value)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{plan.label}</h4>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            formData.subscription_plan === plan.value 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`} />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2">{plan.price}</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="license_limit">라이선스 제한</Label>
                  <Input
                    id="license_limit"
                    type="number"
                    min="1"
                    value={formData.license_limit}
                    onChange={(e) => updateFormData('license_limit', parseInt(e.target.value))}
                    className={errors.license_limit ? 'border-red-500' : ''}
                  />
                  {errors.license_limit && <p className="text-sm text-red-600 mt-1">{errors.license_limit}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    등록 가능한 최대 어르신 수
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">관리자 계정 생성</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin_name">관리자 이름 *</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => updateFormData('admin_name', e.target.value)}
                    placeholder="관리자 이름을 입력하세요"
                    className={errors.admin_name ? 'border-red-500' : ''}
                  />
                  {errors.admin_name && <p className="text-sm text-red-600 mt-1">{errors.admin_name}</p>}
                </div>

                <div>
                  <Label htmlFor="admin_email">관리자 이메일 (어드민 페이지 로그인용)</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    disabled
                    placeholder="연락처 이메일과 동일하게 자동 설정됩니다"
                    className="bg-gray-100"
                  />
                  <p className="text-sm text-blue-600 mt-1">
                    💡 기관 연락처 이메일과 동일하게 자동 설정됩니다
                  </p>
                </div>

                <div>
                  <Label htmlFor="admin_phone">관리자 전화번호</Label>
                  <Input
                    id="admin_phone"
                    type="tel"
                    value={formData.admin_phone}
                    onChange={(e) => updateFormData('admin_phone', formatPhoneNumber(e.target.value))}
                    placeholder="01012345678"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">앱 로그인 계정 (어르신용 앱)</h4>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin_id">앱 로그인 ID *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateFormData('admin_id', generateAdminId())}
                      >
                        ID 자동 생성
                      </Button>
                    </div>
                    <Input
                      id="admin_id"
                      value={formData.admin_id}
                      onChange={(e) => updateFormData('admin_id', e.target.value)}
                      placeholder="앱 로그인용 ID"
                      className={errors.admin_id ? 'border-red-500' : ''}
                    />
                    {errors.admin_id && <p className="text-sm text-red-600 mt-1">{errors.admin_id}</p>}
                    <p className="text-sm text-gray-500 mt-1">
                      어르신용 앱에서 사용할 로그인 ID입니다
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin_password">임시 비밀번호 *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateFormData('admin_password', generateTempPassword())}
                      >
                        비밀번호 자동 생성
                      </Button>
                    </div>
                    <Input
                      id="admin_password"
                      type="text"
                      value={formData.admin_password}
                      onChange={(e) => updateFormData('admin_password', e.target.value)}
                      placeholder="임시 비밀번호"
                      className={errors.admin_password ? 'border-red-500' : ''}
                    />
                    {errors.admin_password && <p className="text-sm text-red-600 mt-1">{errors.admin_password}</p>}
                    <p className="text-sm text-gray-500 mt-1">
                      첫 로그인 시 변경하도록 안내해주세요
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">검토 및 생성</h3>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">기관 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><strong>기관명:</strong> {formData.name}</div>
                    <div><strong>유형:</strong> {organizationTypes.find(t => t.value === formData.org_type)?.label}</div>
                    <div><strong>이메일:</strong> {formData.contact_email}</div>
                    <div><strong>전화번호:</strong> {formData.contact_phone}</div>
                    <div><strong>주소:</strong> {formData.address.street}, {formData.address.city}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">구독 및 설정</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><strong>플랜:</strong> {subscriptionPlans.find(p => p.value === formData.subscription_plan)?.label}</div>
                    <div><strong>라이선스 제한:</strong> {formData.license_limit}명</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">관리자 계정</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><strong>이름:</strong> {formData.admin_name}</div>
                    <div><strong>어드민 이메일:</strong> {formData.admin_email}</div>
                    <div><strong>앱 로그인 ID:</strong> {formData.admin_id}</div>
                    <div><strong>임시 비밀번호:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{formData.admin_password}</code></div>
                  </CardContent>
                </Card>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          기관 목록으로 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">새 기관 생성</h1>
        <p className="text-gray-600 mt-1">Supabase와 DynamoDB에 동시 저장됩니다</p>
      </div>

      {/* 진행 단계 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center">
                <div className="text-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 mb-2 ${
                    isActive ? 'border-blue-500 bg-blue-500 text-white' :
                    isCompleted ? 'border-green-500 bg-green-500 text-white' :
                    'border-gray-300 bg-white text-gray-500'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="max-w-[120px]">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 폼 내용 */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전
            </Button>

            {currentStep < steps.length ? (
              <Button onClick={handleNext}>
                다음
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    기관 생성
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}