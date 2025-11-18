'use client'

import { useState, useEffect } from 'react'
import { supabase, Database } from '@/lib/supabase'
import { Plus, Trash2, MapPin, Clock, Bell, BellOff } from 'lucide-react'
import { format } from 'date-fns'

type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']

interface Appointment {
  id: string
  title: string
  description: string
  family_member_id: string
  appointment_date: string
  appointment_time: string
  location: string
  reminder_sent: boolean
}

export default function AppointmentsSection({ familyMembers }: { familyMembers: any[] }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    family_member_id: familyMembers[0]?.id || '',
    appointment_date: '',
    appointment_time: '',
    location: ''
  })

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    if (familyMembers.length > 0 && !formData.family_member_id) {
      setFormData(prev => ({ ...prev, family_member_id: familyMembers[0].id }))
    }
  }, [familyMembers])

  const loadAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date')
      .order('appointment_time')
    
    if (data) setAppointments(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const insertData: AppointmentInsert = {
      title: formData.title,
      description: formData.description || undefined,
      family_member_id: String(formData.family_member_id),
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      location: formData.location || undefined,
    }

    const { error } = await supabase
      .from('appointments')
      // @ts-expect-error - Supabase type inference issue with Database generic
      .insert([insertData])
    
    if (!error) {
      setFormData({
        title: '',
        description: '',
        family_member_id: familyMembers[0]?.id || '',
        appointment_date: '',
        appointment_time: '',
        location: ''
      })
      setShowForm(false)
      loadAppointments()
    }
  }

  const toggleReminder = async (id: string, reminderSent: boolean) => {
    await supabase
      .from('appointments')
      .update({ reminder_sent: !reminderSent })
      .eq('id', id)
    
    loadAppointments()
  }

  const deleteAppointment = async (id: string) => {
    await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
    
    loadAppointments()
  }

  const upcomingCount = appointments.filter(apt => 
    new Date(`${apt.appointment_date}T${apt.appointment_time}`) >= new Date()
  ).length

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
          <p className="text-sm text-gray-600 mt-1">
            {upcomingCount} upcoming appointment{upcomingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Appointment
        </button>
      </div>

      {/* Add Appointment Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
              <select
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select type...</option>
                <option value="Doctor Visit">Doctor Visit</option>
                <option value="Dentist">Dentist</option>
                <option value="Eye Doctor">Eye Doctor</option>
                <option value="Specialist">Specialist</option>
                <option value="Therapy">Therapy</option>
                <option value="Vaccine">Vaccine</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Family Member</label>
              <select
                value={formData.family_member_id}
                onChange={(e) => setFormData({ ...formData, family_member_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doctor's office, clinic, hospital..."
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Reason for visit, things to remember, etc."
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Appointment
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Appointments List */}
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled. Click "Add Appointment" to get started!
          </div>
        ) : (
          appointments.map(apt => {
            const member = familyMembers.find(m => m.id === apt.family_member_id)
            const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`)
            const isPast = appointmentDateTime < new Date()
            const isToday = format(appointmentDateTime, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            
            return (
              <div
                key={apt.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isPast
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : isToday
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-semibold text-gray-800">{apt.title}</span>
                      {isToday && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-medium">
                          TODAY
                        </span>
                      )}
                      {isPast && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Past
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: member?.avatar_color }}
                        >
                          {member?.name.charAt(0)}
                        </div>
                        <span className="font-medium">{member?.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(appointmentDateTime, 'EEEE, MMM d, yyyy')} at{' '}
                          {format(appointmentDateTime, 'h:mm a')}
                        </span>
                      </div>
                      
                      {apt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{apt.location}</span>
                        </div>
                      )}
                      
                      {apt.description && (
                        <p className="mt-2 text-gray-700">{apt.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleReminder(apt.id, apt.reminder_sent)}
                      className={`p-2 rounded-lg transition-colors ${
                        apt.reminder_sent
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={apt.reminder_sent ? 'Reminder sent' : 'Send reminder'}
                    >
                      {apt.reminder_sent ? (
                        <Bell className="w-5 h-5" />
                      ) : (
                        <BellOff className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteAppointment(apt.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
