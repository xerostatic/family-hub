'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, Database } from '@/lib/supabase'
import { Plus, Trash2, Check, Repeat, BarChart3, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { FamilyMember, Chore } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import KidsChoreView from './KidsChoreView'

type ChoreInsert = Database['public']['Tables']['chores']['Insert']

export default function ChoresSection({ familyMembers }: { familyMembers: FamilyMember[] }) {
  const [chores, setChores] = useState<Chore[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'chart' | 'kids'>('list')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: familyMembers[0]?.id || '',
    due_date: '',
    recurrence: 'none'
  })

  useEffect(() => {
    loadChores()
  }, [])

  useEffect(() => {
    if (familyMembers.length > 0 && !formData.assigned_to) {
      setFormData(prev => ({ ...prev, assigned_to: familyMembers[0].id }))
    }
  }, [familyMembers])

  const loadChores = async () => {
    const { data, error } = await supabase
      .from('chores')
      .select('*')
      .order('due_date', { nullsFirst: false })
    
    if (error) {
      console.error('Error loading chores:', error)
      return
    }
    
    if (data) setChores(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const insertData: ChoreInsert = {
      title: formData.title,
      description: formData.description || undefined,
      assigned_to: String(formData.assigned_to),
      due_date: formData.recurrence !== 'none' ? null : (formData.due_date || null),
      recurrence: formData.recurrence === 'none' ? null : formData.recurrence,
    }

    const { error } = await supabase
      .from('chores')
      // @ts-expect-error - Supabase type inference issue with Database generic
      .insert([insertData])
    
    if (error) {
      console.error('Error creating chore:', error)
      alert('Failed to create chore. Please try again.')
      return
    }
    
    setFormData({
      title: '',
      description: '',
      assigned_to: familyMembers[0]?.id || '',
      due_date: '',
      recurrence: 'none'
    })
    setShowForm(false)
    loadChores()
  }

  const toggleCompleted = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('chores')
      // @ts-expect-error - Supabase type inference issue with Database generic
      .update({ completed: !completed })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating chore:', error)
      return
    }
    
    loadChores()
  }

  const deleteChore = async (id: string) => {
    const { error } = await supabase
      .from('chores')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting chore:', error)
      alert('Failed to delete chore. Please try again.')
      return
    }
    
    loadChores()
  }

  const completedCount = chores.filter(c => c.completed).length
  const totalCount = chores.length

  // Chart data by person
  const chartData = useMemo(() => {
    const memberStats = familyMembers.map(member => {
      const memberChores = chores.filter(c => c.assigned_to === member.id)
      const completed = memberChores.filter(c => c.completed).length
      const total = memberChores.length
      return {
        name: member.name,
        completed,
        pending: total - completed,
        total,
        color: member.avatar_color
      }
    })
    return memberStats.filter(stat => stat.total > 0)
  }, [chores, familyMembers])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chores</h2>
          <p className="text-sm text-gray-600 mt-1">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'chart' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Chart
            </button>
            <button
              onClick={() => setViewMode('kids')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'kids' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              Kids View
            </button>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Chore
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Chore Form */}
      {showForm && viewMode !== 'kids' && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chore Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Take out trash, vacuum, etc."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional details..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date {formData.recurrence !== 'none' && '(Not required for recurring)'}
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={formData.recurrence === 'none'}
                disabled={formData.recurrence !== 'none'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
              <select
                value={formData.recurrence}
                onChange={(e) => {
                  const newRecurrence = e.target.value
                  setFormData({ 
                    ...formData, 
                    recurrence: newRecurrence,
                    due_date: newRecurrence !== 'none' ? '' : formData.due_date
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Chore
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

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="space-y-6 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Chores by Person</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
                <Bar dataKey="pending" fill="#EF4444" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Completion Rate by Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chartData.map((member, index) => {
                const percentage = member.total > 0 ? (member.completed / member.total) * 100 : 0
                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-semibold">{member.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {member.completed} of {member.total} completed
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Kids View */}
      {viewMode === 'kids' && (
        <KidsChoreView familyMembers={familyMembers} />
      )}

      {/* Chores List */}
      {viewMode === 'list' && (
      <div className="space-y-3">
        {chores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No chores yet. Click "Add Chore" to get started!
          </div>
        ) : (
          chores.map(chore => {
            const member = familyMembers.find(m => m.id === chore.assigned_to)
            const isOverdue = chore.due_date && new Date(chore.due_date) < new Date() && !chore.completed
            
            return (
              <div
                key={chore.id}
                className={`flex items-start justify-between p-4 rounded-lg border-2 transition-all ${
                  chore.completed
                    ? 'bg-green-50 border-green-200'
                    : isOverdue
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <button
                    onClick={() => toggleCompleted(chore.id, chore.completed)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors mt-1 flex-shrink-0 ${
                      chore.completed
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {chore.completed && <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${chore.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {chore.title}
                      </span>
                      {chore.recurrence && chore.recurrence !== 'none' && (
                        <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          <Repeat className="w-3 h-3" />
                          {chore.recurrence}
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                    {chore.description && (
                      <p className="text-sm text-gray-600 mb-2">{chore.description}</p>
                    )}
                    <div className="text-sm text-gray-600">
                      {chore.due_date ? (
                        <>Due: {format(new Date(chore.due_date), 'MMM d, yyyy')} • </>
                      ) : null}
                      Assigned to: {member?.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteChore(chore.id)}
                  className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )
          })
        )}
      </div>
      )}
    </div>
  )
}
