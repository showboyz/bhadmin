'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Download, Edit, Trash2, Eye } from 'lucide-react'
import { useSeniors } from '@/hooks/use-seniors'
import { toast } from 'sonner'

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSenior, setEditingSenior] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    gender_enum: 'M' as 'M' | 'F',
    birth: '',
    eduyear: null as any,
    phone: '',
    guardian_phone: '',
    address: '',
    note: ''
  })

  const { seniors, loading, error, createSenior, updateSenior, deleteSenior } = useSeniors()

  const resetForm = () => {
    setFormData({
      name: '',
      gender_enum: 'M',
      birth: '',
      eduyear: null,
      phone: '',
      guardian_phone: '',
      address: '',
      note: ''
    })
  }

  const handleCreateSubmit = async () => {
    try {
      // Get organization ID (for now, use the first org from sample data)
      const orgId = '550e8400-e29b-41d4-a716-446655440000'
      
      const { error } = await createSenior({
        ...formData,
        org_id: orgId,
        guardian_phone: formData.guardian_phone || null,
        phone: formData.phone || null,
        note: formData.note || null,
        eduyear: formData.eduyear || null
      })

      if (error) {
        toast.error(error)
      } else {
        toast.success('Senior created successfully')
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      toast.error('Failed to create senior')
    }
  }

  const handleEditSubmit = async () => {
    if (!editingSenior) return

    try {
      const { error } = await updateSenior(editingSenior.id, {
        ...formData,
        guardian_phone: formData.guardian_phone || null,
        phone: formData.phone || null,
        note: formData.note || null,
        eduyear: formData.eduyear || null
      })

      if (error) {
        toast.error(error)
      } else {
        toast.success('Senior updated successfully')
        setIsEditing(false)
        setEditingSenior(null)
        resetForm()
      }
    } catch (error) {
      toast.error('Failed to update senior')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const { error } = await deleteSenior(id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Senior deleted successfully')
      }
    } catch (error) {
      toast.error('Failed to delete senior')
    }
  }

  const openEditDialog = (senior: any) => {
    setEditingSenior(senior)
    setFormData({
      name: senior.name,
      gender_enum: senior.gender_enum,
      birth: senior.birth,
      eduyear: senior.eduyear,
      phone: senior.phone || '',
      guardian_phone: senior.guardian_phone || '',
      address: senior.address || '',
      note: senior.note || ''
    })
    setIsEditing(true)
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const filteredSeniors = seniors.filter(senior =>
    senior.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (senior.phone && senior.phone.includes(searchTerm))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111] mx-auto"></div>
          <p className="mt-2 text-[#555]">Loading seniors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#111]">User Management</h1>
          <div className="flex gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#111] hover:bg-[#222] text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Senior
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Senior</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={formData.gender_enum}
                      onChange={(e) => setFormData({...formData, gender_enum: e.target.value as 'M' | 'F'})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="birth">Birth Date</Label>
                    <Input
                      id="birth"
                      type="date"
                      value={formData.birth}
                      onChange={(e) => setFormData({...formData, birth: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="eduyear">Education Level</Label>
                    <select
                      id="eduyear"
                      value={formData.eduyear || ''}
                      onChange={(e) => setFormData({...formData, eduyear: e.target.value || null})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select level</option>
                      <option value="none">No formal education</option>
                      <option value="elementary">Elementary</option>
                      <option value="middle">Middle school</option>
                      <option value="high">High school</option>
                      <option value="college">College</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="010-XXXX-XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianPhone">Guardian Phone</Label>
                    <Input
                      id="guardianPhone"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({...formData, guardian_phone: e.target.value})}
                      placeholder="010-XXXX-XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="note">Note</Label>
                    <textarea
                      id="note"
                      value={formData.note}
                      onChange={(e) => setFormData({...formData, note: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <Button 
                    onClick={handleCreateSubmit}
                    className="w-full bg-[#111] hover:bg-[#222] text-white"
                  >
                    Create Senior
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#555]" />
              <Input
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#111]">Seniors ({filteredSeniors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Guardian Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeniors.map((senior) => (
                  <TableRow key={senior.id}>
                    <TableCell className="font-medium">{senior.name}</TableCell>
                    <TableCell>{calculateAge(senior.birth)}</TableCell>
                    <TableCell>{senior.gender_enum === 'M' ? 'Male' : 'Female'}</TableCell>
                    <TableCell>{senior.phone || '-'}</TableCell>
                    <TableCell>{senior.guardian_phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(senior)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(senior.id, senior.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={(open) => {
          setIsEditing(open)
          if (!open) {
            setEditingSenior(null)
            resetForm()
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Senior</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Gender</Label>
                <select
                  id="edit-gender"
                  value={formData.gender_enum}
                  onChange={(e) => setFormData({...formData, gender_enum: e.target.value as 'M' | 'F'})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-birth">Birth Date</Label>
                <Input
                  id="edit-birth"
                  type="date"
                  value={formData.birth}
                  onChange={(e) => setFormData({...formData, birth: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-eduyear">Education Level</Label>
                <select
                  id="edit-eduyear"
                  value={formData.eduyear || ''}
                  onChange={(e) => setFormData({...formData, eduyear: e.target.value || null})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select level</option>
                  <option value="none">No formal education</option>
                  <option value="elementary">Elementary</option>
                  <option value="middle">Middle school</option>
                  <option value="high">High school</option>
                  <option value="college">College</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="010-XXXX-XXXX"
                />
              </div>
              <div>
                <Label htmlFor="edit-guardianPhone">Guardian Phone</Label>
                <Input
                  id="edit-guardianPhone"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({...formData, guardian_phone: e.target.value})}
                  placeholder="010-XXXX-XXXX"
                />
              </div>
              <div>
                <Label htmlFor="edit-note">Note</Label>
                <textarea
                  id="edit-note"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <Button 
                onClick={handleEditSubmit}
                className="w-full bg-[#111] hover:bg-[#222] text-white"
              >
                Update Senior
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}