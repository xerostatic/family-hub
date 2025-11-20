'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, Database } from '@/lib/supabase'
import { Plus, Trash2, Check, BookOpen, Clock, Calendar, TrendingUp, Edit2, X } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay, startOfMonth, endOfMonth } from 'date-fns'
import { FamilyMember } from '@/types'

type HomeschoolActivity = Database['public']['Tables']['homeschool_activities']['Row']
type HomeschoolSubject = Database['public']['Tables']['homeschool_subjects']['Row']

type ActivityInsert = Database['public']['Tables']['homeschool_activities']['Insert']
type SubjectInsert = Database['public']['Tables']['homeschool_subjects']['Insert']

export default function HomeschoolSection({ familyMembers }: { familyMembers: FamilyMember[] }) {
  const [activities, setActivities] = useState<HomeschoolActivity[]>([])
  const [subjects, setSubjects] = useState<HomeschoolSubject[]>([])
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'subjects' | 'stats'>('calendar')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [activityFormData, setActivityFormData] = useState({
    student_id: '',
    subject: '',
    activity_description: '',
    activity_date: format(new Date(), 'yyyy-MM-dd'),
    hours_spent: '',
    completed: false,
    notes: ''
  })
  const [subjectFormData, setSubjectFormData] = useState({
    student_id: '',
    subject_name: '',
    grade_level: '',
    curriculum: '',
    hours_per_week: '',
    is_active: true
  })

  useEffect(() => {
    loadActivities()
    loadSubjects()
  }, [])

  const loadActivities = async () => {
    const { data, error } = await supabase
      .from('homeschool_activities')
      .select('*')
      .order('activity_date', { ascending: false })
    
    if (error) {
      console.error('Error loading activities:', error)
      return
    }
    
    if (data) setActivities(data)
  }

  const loadSubjects = async () => {
    const { data, error } = await supabase
      .from('homeschool_subjects')
      .select('*')
      .order('subject_name')
    
    if (error) {
      console.error('Error loading subjects:', error)
      return
    }
    
    if (data) setSubjects(data)
  }

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const insertData: ActivityInsert = {
      student_id: activityFormData.student_id || null,
      subject: activityFormData.subject,
      activity_description: activityFormData.activity_description,
      activity_date: activityFormData.activity_date,
      hours_spent: activityFormData.hours_spent ? parseFloat(activityFormData.hours_spent) : 0,
      completed: activityFormData.completed,
      notes: activityFormData.notes || null
    }

    if (editingActivityId) {
      const { error } = await supabase
        .from('homeschool_activities')
        .update(insertData)
        .eq('id', editingActivityId)
      
      if (error) {
        console.error('Error updating activity:', error)
        alert('Failed to update activity. Please try again.')
        return
      }
    } else {
      const { error } = await supabase
        .from('homeschool_activities')
        .insert([insertData])
      
      if (error) {
        console.error('Error creating activity:', error)
        alert('Failed to create activity. Please try again.')
        return
      }
    }
    
    resetActivityForm()
    loadActivities()
  }

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const insertData: SubjectInsert = {
      student_id: subjectFormData.student_id || null,
      subject_name: subjectFormData.subject_name,
      grade_level: subjectFormData.grade_level || null,
      curriculum: subjectFormData.curriculum || null,
      hours_per_week: subjectFormData.hours_per_week ? parseFloat(subjectFormData.hours_per_week) : 0,
      is_active: subjectFormData.is_active
    }

    if (editingSubjectId) {
      const { error } = await supabase
        .from('homeschool_subjects')
        .update(insertData)
        .eq('id', editingSubjectId)
      
      if (error) {
        console.error('Error updating subject:', error)
        alert('Failed to update subject. Please try again.')
        return
      }
    } else {
      const { error } = await supabase
        .from('homeschool_subjects')
        .insert([insertData])
      
      if (error) {
        console.error('Error creating subject:', error)
        alert('Failed to create subject. Please try again.')
        return
      }
    }
    
    resetSubjectForm()
    loadSubjects()
  }

  const resetActivityForm = () => {
    setEditingActivityId(null)
    setActivityFormData({
      student_id: '',
      subject: '',
      activity_description: '',
      activity_date: format(new Date(), 'yyyy-MM-dd'),
      hours_spent: '',
      completed: false,
      notes: ''
    })
    setShowActivityForm(false)
  }

  const resetSubjectForm = () => {
    setEditingSubjectId(null)
    setSubjectFormData({
      student_id: '',
      subject_name: '',
      grade_level: '',
      curriculum: '',
      hours_per_week: '',
      is_active: true
    })
    setShowSubjectForm(false)
  }

  const handleEditActivity = (activity: HomeschoolActivity) => {
    setEditingActivityId(activity.id)
    setActivityFormData({
      student_id: activity.student_id || '',
      subject: activity.subject,
      activity_description: activity.activity_description,
      activity_date: activity.activity_date,
      hours_spent: activity.hours_spent.toString(),
      completed: activity.completed,
      notes: activity.notes || ''
    })
    setShowActivityForm(true)
  }

  const handleEditSubject = (subject: HomeschoolSubject) => {
    setEditingSubjectId(subject.id)
    setSubjectFormData({
      student_id: subject.student_id || '',
      subject_name: subject.subject_name,
      grade_level: subject.grade_level || '',
      curriculum: subject.curriculum || '',
      hours_per_week: subject.hours_per_week.toString(),
      is_active: subject.is_active
    })
    setShowSubjectForm(true)
  }

  const deleteActivity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return
    
    const { error } = await supabase
      .from('homeschool_activities')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting activity:', error)
      alert('Failed to delete activity. Please try again.')
      return
    }
    
    loadActivities()
  }

  const deleteSubject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return
    
    const { error } = await supabase
      .from('homeschool_subjects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting subject:', error)
      alert('Failed to delete subject. Please try again.')
      return
    }
    
    loadSubjects()
  }

  const toggleActivityCompleted = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('homeschool_activities')
      .update({ completed: !completed })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating activity:', error)
      return
    }
    
    loadActivities()
  }

  // Get student name helper
  const getStudentName = (studentId: string | null) => {
    if (!studentId) return 'All Students'
    const member = familyMembers.find(m => m.id === studentId)
    return member?.name || 'Unknown'
  }

  // Statistics
  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    
    const monthActivities = activities.filter(a => {
      const activityDate = parseISO(a.activity_date)
      return activityDate >= monthStart && activityDate <= monthEnd
    })
    
    const totalHours = monthActivities.reduce((sum, a) => sum + parseFloat(a.hours_spent.toString()), 0)
    const completedCount = monthActivities.filter(a => a.completed).length
    const subjectBreakdown = new Map<string, number>()
    
    monthActivities.forEach(a => {
      const current = subjectBreakdown.get(a.subject) || 0
      subjectBreakdown.set(a.subject, current + parseFloat(a.hours_spent.toString()))
    })
    
    return {
      totalHours,
      completedCount,
      totalActivities: monthActivities.length,
      subjectBreakdown: Array.from(subjectBreakdown.entries()).map(([subject, hours]) => ({ subject, hours }))
    }
  }, [activities])

  // Calendar view - current week
  const weekDays = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [])

  const getActivitiesForDate = (date: Date) => {
    return activities.filter(a => isSameDay(parseISO(a.activity_date), date))
  }

  // Get unique subjects from activities and subject list
  const availableSubjects = useMemo(() => {
    const fromSubjects = subjects.map(s => s.subject_name)
    const fromActivities = activities.map(a => a.subject)
    return Array.from(new Set([...fromSubjects, ...fromActivities])).sort()
  }, [subjects, activities])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Homeschool Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track activities, subjects, and progress
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('subjects')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'subjects' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Subjects
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'stats' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Stats
            </button>
          </div>
          <button
            onClick={() => {
              resetActivityForm()
              setShowActivityForm(true)
            }}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
            <Clock className="w-4 h-4" />
            This Month Hours
          </div>
          <div className="text-2xl font-bold text-blue-700">{stats.totalHours.toFixed(1)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
            <Check className="w-4 h-4" />
            Completed
          </div>
          <div className="text-2xl font-bold text-green-700">{stats.completedCount}/{stats.totalActivities}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
            <BookOpen className="w-4 h-4" />
            Active Subjects
          </div>
          <div className="text-2xl font-bold text-purple-700">{subjects.filter(s => s.is_active).length}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 text-sm text-orange-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            Total Activities
          </div>
          <div className="text-2xl font-bold text-orange-700">{activities.length}</div>
        </div>
      </div>

      {/* Activity Form */}
      {showActivityForm && (
        <form onSubmit={handleActivitySubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                value={activityFormData.student_id}
                onChange={(e) => setActivityFormData({ ...activityFormData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Students</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                list="subjects-list"
                value={activityFormData.subject}
                onChange={(e) => setActivityFormData({ ...activityFormData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Math, Science, History..."
                required
              />
              <datalist id="subjects-list">
                {availableSubjects.map(subject => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Description</label>
              <input
                type="text"
                value={activityFormData.activity_description}
                onChange={(e) => setActivityFormData({ ...activityFormData, activity_description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Chapter 5, Lesson 3, etc."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={activityFormData.activity_date}
                onChange={(e) => setActivityFormData({ ...activityFormData, activity_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours Spent</label>
              <input
                type="number"
                step="0.25"
                value={activityFormData.hours_spent}
                onChange={(e) => setActivityFormData({ ...activityFormData, hours_spent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1.5"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activityFormData.completed}
                  onChange={(e) => setActivityFormData({ ...activityFormData, completed: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Completed</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={activityFormData.notes}
                onChange={(e) => setActivityFormData({ ...activityFormData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {editingActivityId ? 'Update Activity' : 'Add Activity'}
            </button>
            <button
              type="button"
              onClick={resetActivityForm}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Subject Form */}
      {showSubjectForm && (
        <form onSubmit={handleSubjectSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                value={subjectFormData.student_id}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Students</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
              <input
                type="text"
                value={subjectFormData.subject_name}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, subject_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Math, Science, History..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <input
                type="text"
                value={subjectFormData.grade_level}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, grade_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3rd Grade, High School, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum</label>
              <input
                type="text"
                value={subjectFormData.curriculum}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, curriculum: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Saxon Math, Apologia Science..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours Per Week</label>
              <input
                type="number"
                step="0.25"
                value={subjectFormData.hours_per_week}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, hours_per_week: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5.0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subjectFormData.is_active}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {editingSubjectId ? 'Update Subject' : 'Add Subject'}
            </button>
            <button
              type="button"
              onClick={resetSubjectForm}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const dayActivities = getActivitiesForDate(day)
                const isToday = isSameDay(day, new Date())
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 rounded-lg border-2 ${
                      isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-lg font-bold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayActivities.slice(0, 3).map(activity => (
                        <div
                          key={activity.id}
                          className={`text-xs p-1 rounded ${
                            activity.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                          title={activity.activity_description}
                        >
                          {activity.subject}: {activity.activity_description.substring(0, 15)}
                        </div>
                      ))}
                      {dayActivities.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayActivities.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activities yet. Click "Add Activity" to get started!
            </div>
          ) : (
            activities.map(activity => (
              <div
                key={activity.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  activity.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleActivityCompleted(activity.id, activity.completed)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      activity.completed
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {activity.completed && <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${activity.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {activity.subject}: {activity.activity_description}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {getStudentName(activity.student_id)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(activity.activity_date), 'MMM d, yyyy')}
                      </span>
                      {activity.hours_spent > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {activity.hours_spent} hours
                        </span>
                      )}
                    </div>
                    {activity.notes && (
                      <div className="text-sm text-gray-500 mt-1 italic">
                        {activity.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditActivity(activity)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Edit activity"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteActivity(activity.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete activity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Subjects View */}
      {viewMode === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Subjects</h3>
            <button
              onClick={() => {
                resetSubjectForm()
                setShowSubjectForm(true)
              }}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subjects yet. Click "Add Subject" to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map(subject => (
                <div
                  key={subject.id}
                  className={`p-4 rounded-lg border-2 ${
                    subject.is_active ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800">{subject.subject_name}</h4>
                    {!subject.is_active && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Inactive</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Student: {getStudentName(subject.student_id)}</div>
                    {subject.grade_level && <div>Grade: {subject.grade_level}</div>}
                    {subject.curriculum && <div>Curriculum: {subject.curriculum}</div>}
                    {subject.hours_per_week > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {subject.hours_per_week} hrs/week
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEditSubject(subject)}
                      className="flex-1 text-blue-500 hover:text-blue-700 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSubject(subject.id)}
                      className="flex-1 text-red-500 hover:text-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats View */}
      {viewMode === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">This Month's Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Total Hours</div>
                <div className="text-2xl font-bold text-blue-700">{stats.totalHours.toFixed(1)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 mb-1">Completed Activities</div>
                <div className="text-2xl font-bold text-green-700">{stats.completedCount}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Total Activities</div>
                <div className="text-2xl font-bold text-purple-700">{stats.totalActivities}</div>
              </div>
            </div>
          </div>
          {stats.subjectBreakdown.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hours by Subject</h3>
              <div className="space-y-2">
                {stats.subjectBreakdown.map(({ subject, hours }) => (
                  <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{subject}</span>
                    <span className="text-lg font-bold text-blue-600">{hours.toFixed(1)} hours</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

