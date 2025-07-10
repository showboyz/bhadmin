'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { 
  Building2, 
  User, 
  Settings, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  X
} from 'lucide-react'

interface OrganizationFormData {
  // Basic info
  name: string
  org_type: 'clinic' | 'hospital' | 'care_center'
  contact_email: string
  contact_phone: string
  
  // Address
  address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  
  // Settings
  subscription_plan: 'basic' | 'premium' | 'enterprise'
  license_limit: number
  
  // Admin user
  admin_name: string
  admin_email: string
  admin_phone: string
}

const initialFormData: OrganizationFormData = {
  name: '',
  org_type: 'clinic',
  contact_email: '',
  contact_phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'South Korea'
  },
  subscription_plan: 'basic',
  license_limit: 50,
  admin_name: '',
  admin_email: '',
  admin_phone: ''
}

const steps = [
  { id: 1, name: 'Basic Information', icon: Building2 },
  { id: 2, name: 'Settings & Billing', icon: Settings },
  { id: 3, name: 'Admin User', icon: User },
  { id: 4, name: 'Review & Create', icon: CheckCircle },
]

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OrganizationFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
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

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Organization name is required'
        if (!formData.contact_email.trim()) newErrors.contact_email = 'Contact email is required'
        if (!formData.contact_phone.trim()) newErrors.contact_phone = 'Contact phone is required'
        if (!formData.address.street.trim()) newErrors.street = 'Street address is required'
        if (!formData.address.city.trim()) newErrors.city = 'City is required'
        break
      case 2:
        if (formData.license_limit < 1) newErrors.license_limit = 'License limit must be at least 1'
        break
      case 3:
        if (!formData.admin_name.trim()) newErrors.admin_name = 'Admin name is required'
        if (!formData.admin_email.trim()) newErrors.admin_email = 'Admin email is required'
        if (!/\S+@\S+\.\S+/.test(formData.admin_email)) newErrors.admin_email = 'Please enter a valid email'
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
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert([{
          name: formData.name,
          licence_seats: formData.license_limit,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          address: formData.address,
          is_active: true
        }])
        .select()
        .single()

      if (orgError) throw orgError

      // Create organization settings
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .insert([{
          org_id: org.id,
          subscription_plan: formData.subscription_plan,
          license_limit: formData.license_limit,
          org_type: formData.org_type,
          is_active: true
        }])

      if (settingsError) throw settingsError

      // Create admin user account (this would typically involve sending an invitation email)
      // For now, we'll just create a user role entry that can be activated later
      
      // Log the creation
      await supabase
        .from('system_audit_log')
        .insert([{
          user_id: user?.id || '',
          action: 'create_organization',
          resource_type: 'organization',
          resource_id: org.id,
          new_values: {
            name: formData.name,
            org_type: formData.org_type,
            subscription_plan: formData.subscription_plan,
            license_limit: formData.license_limit,
            admin_email: formData.admin_email
          }
        }])

      // Redirect to organization detail page
      router.push(`/super-admin/organizations/${org.id}`)
    } catch (error) {
      console.error('Error creating organization:', error)
      setErrors({ submit: 'Failed to create organization. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter organization name"
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Type
                  </label>
                  <select
                    value={formData.org_type}
                    onChange={(e) => updateFormData('org_type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="clinic">Clinic</option>
                    <option value="hospital">Hospital</option>
                    <option value="care_center">Care Center</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => updateFormData('contact_email', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="contact@organization.com"
                    />
                    {errors.contact_email && <p className="text-sm text-red-600 mt-1">{errors.contact_email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => updateFormData('contact_phone', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="010-1234-5678"
                    />
                    {errors.contact_phone && <p className="text-sm text-red-600 mt-1">{errors.contact_phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => updateAddressField('street', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Street address *"
                    />
                    {errors.street && <p className="text-sm text-red-600 mt-1">{errors.street}</p>}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => updateAddressField('city', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="City *"
                      />
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => updateAddressField('state', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="State/Province"
                      />
                    </div>
                    {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.address.postal_code}
                        onChange={(e) => updateAddressField('postal_code', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Postal Code"
                      />
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => updateAddressField('country', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Country"
                      />
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings & Billing</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={formData.subscription_plan}
                    onChange={(e) => updateFormData('subscription_plan', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="basic">Basic - $29/month</option>
                    <option value="premium">Premium - $79/month</option>
                    <option value="enterprise">Enterprise - $199/month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.license_limit}
                    onChange={(e) => updateFormData('license_limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.license_limit && <p className="text-sm text-red-600 mt-1">{errors.license_limit}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum number of seniors that can be enrolled
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Plan Features</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {formData.subscription_plan === 'basic' && (
                      <>
                        <div>• Up to 50 seniors</div>
                        <div>• Basic analytics</div>
                        <div>• Email support</div>
                      </>
                    )}
                    {formData.subscription_plan === 'premium' && (
                      <>
                        <div>• Up to 200 seniors</div>
                        <div>• Advanced analytics</div>
                        <div>• Priority support</div>
                        <div>• Custom reports</div>
                      </>
                    )}
                    {formData.subscription_plan === 'enterprise' && (
                      <>
                        <div>• Unlimited seniors</div>
                        <div>• Full analytics suite</div>
                        <div>• 24/7 support</div>
                        <div>• Custom integrations</div>
                        <div>• Dedicated account manager</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Admin User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administrator Name *
                  </label>
                  <input
                    type="text"
                    value={formData.admin_name}
                    onChange={(e) => updateFormData('admin_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter admin name"
                  />
                  {errors.admin_name && <p className="text-sm text-red-600 mt-1">{errors.admin_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administrator Email *
                  </label>
                  <input
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => updateFormData('admin_email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin@organization.com"
                  />
                  {errors.admin_email && <p className="text-sm text-red-600 mt-1">{errors.admin_email}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    An invitation email will be sent to this address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administrator Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.admin_phone}
                    onChange={(e) => updateFormData('admin_phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Create</h3>
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Organization Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Name:</strong> {formData.name}</div>
                    <div><strong>Type:</strong> {formData.org_type}</div>
                    <div><strong>Email:</strong> {formData.contact_email}</div>
                    <div><strong>Phone:</strong> {formData.contact_phone}</div>
                    <div><strong>Address:</strong> {formData.address.street}, {formData.address.city}</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Subscription & Settings</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Plan:</strong> {formData.subscription_plan}</div>
                    <div><strong>License Limit:</strong> {formData.license_limit} seniors</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Administrator</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Name:</strong> {formData.admin_name}</div>
                    <div><strong>Email:</strong> {formData.admin_email}</div>
                    {formData.admin_phone && <div><strong>Phone:</strong> {formData.admin_phone}</div>}
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Organization</h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive ? 'border-blue-500 bg-blue-500 text-white' :
                  isCompleted ? 'border-green-500 bg-green-500 text-white' :
                  'border-gray-300 bg-white text-gray-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    {step.name}
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

      {/* Form Content */}
      <div className="bg-white rounded-lg border p-6">
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              currentStep === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Organization'}
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}