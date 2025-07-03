'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Plus, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react'
import { useSchedules } from '@/hooks/use-schedules'
import { useSeniors } from '@/hooks/use-seniors'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function SchedulesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    senior_id: '',
    start_date: '',
    end_date: '',
    sessions_per_week: 3,
    status: 'Active' as 'Active' | 'Completed' | 'Cancelled'
  })

  const { schedules, loading, error, createSchedule, updateSchedule, deleteSchedule } = useSchedules()
  const { seniors } = useSeniors()

  const resetForm = () => {
    setFormData({
      senior_id: '',
      start_date: '',
      end_date: '',
      sessions_per_week: 3,
      status: 'Active'
    })
  }

  const handleCreateSubmit = async () => {
    try {
      if (!formData.senior_id || !formData.start_date || !formData.end_date) {
        toast.error('Please fill in all required fields')
        return
      }

      const { error } = await createSchedule(formData)

      if (error) {
        toast.error(error)
      } else {
        toast.success('Schedule created successfully')
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      toast.error('Failed to create schedule')
    }
  }

  const handleEditSubmit = async () => {
    if (!editingSchedule) return

    try {
      const { error } = await updateSchedule(editingSchedule.id, formData)

      if (error) {
        toast.error(error)
      } else {
        toast.success('Schedule updated successfully')
        setIsEditing(false)
        setEditingSchedule(null)
        resetForm()
      }
    } catch (error) {
      toast.error('Failed to update schedule')
    }
  }

  const handleDelete = async (id: string, seniorName: string) => {
    if (!confirm(`Are you sure you want to delete the schedule for ${seniorName}?`)) return

    try {
      const { error } = await deleteSchedule(id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Schedule deleted successfully')
      }
    } catch (error) {
      toast.error('Failed to delete schedule')
    }
  }

  const openEditDialog = (schedule: any) => {
    setEditingSchedule(schedule)
    setFormData({
      senior_id: schedule.senior_id,
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      sessions_per_week: schedule.sessions_per_week,
      status: schedule.status
    })
    setIsEditing(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-[#333] text-white'
      case 'Completed':
        return 'bg-green-600 text-white'
      case 'Cancelled':
        return 'bg-red-600 text-white'
      default:
        return 'bg-[#777] text-white'
    }
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return `${diffWeeks} weeks`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111] mx-auto"></div>
          <p className="mt-2 text-[#555]">Loading schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#111]">Program Scheduler</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#111] hover:bg-[#222] text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="senior">Senior</Label>
                  <select
                    id="senior"
                    value={formData.senior_id}
                    onChange={(e) => setFormData({...formData, senior_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select a senior</option>
                    {seniors.map((senior) => (
                      <option key={senior.id} value={senior.id}>
                        {senior.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sessions_per_week">Sessions per Week</Label>
                  <select
                    id="sessions_per_week"
                    value={formData.sessions_per_week}
                    onChange={(e) => setFormData({...formData, sessions_per_week: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value={2}>2 sessions</option>
                    <option value={3}>3 sessions</option>
                    <option value={4}>4 sessions</option>
                    <option value={5}>5 sessions</option>
                  </select>
                </div>
                <Button 
                  onClick={handleCreateSubmit}
                  className="w-full bg-[#111] hover:bg-[#222] text-white"
                >
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error message */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Schedules Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#111] flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Training Schedules ({schedules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Senior</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Sessions/Week</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {schedule.seniors?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{format(new Date(schedule.start_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(schedule.end_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{calculateDuration(schedule.start_date, schedule.end_date)}</TableCell>
                      <TableCell>{schedule.sessions_per_week}x</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(schedule.id, schedule.seniors?.name || 'Unknown')}
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
            ) : (
              <div className="text-center py-8 text-[#555]">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-[#AAA]" />
                <p>No schedules created yet</p>
                <p className="text-sm">Create your first training schedule to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={(open) => {
          setIsEditing(open)
          if (!open) {
            setEditingSchedule(null)
            resetForm()
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-senior">Senior</Label>
                <select
                  id="edit-senior"
                  value={formData.senior_id}
                  onChange={(e) => setFormData({...formData, senior_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a senior</option>
                  {seniors.map((senior) => (
                    <option key={senior.id} value={senior.id}>
                      {senior.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="edit-start_date">Start Date</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-end_date">End Date</Label>
                <Input
                  id="edit-end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-sessions_per_week">Sessions per Week</Label>
                <select
                  id="edit-sessions_per_week"
                  value={formData.sessions_per_week}
                  onChange={(e) => setFormData({...formData, sessions_per_week: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value={2}>2 sessions</option>
                  <option value={3}>3 sessions</option>
                  <option value={4}>4 sessions</option>
                  <option value={5}>5 sessions</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'Completed' | 'Cancelled'})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <Button 
                onClick={handleEditSubmit}
                className="w-full bg-[#111] hover:bg-[#222] text-white"
              >
                Update Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}