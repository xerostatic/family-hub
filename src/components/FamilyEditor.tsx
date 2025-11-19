'use client'

import { useState, useEffect } from 'react'
import { supabase, Database } from '@/lib/supabase'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { FamilyMember } from '@/types'

type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert']
type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update']

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

export default function FamilyEditor({ onUpdate }: { onUpdate?: () => void }) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar_color: AVATAR_COLORS[0]
  })

  useEffect(() => {
    loadFamilyMembers()
  }, [])

  const loadFamilyMembers = async () => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error loading family members:', error)
      return
    }
    
    if (data) setFamilyMembers(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      // Update existing member
      const updateData: FamilyMemberUpdate = {
        name: formData.name,
        email: formData.email,
        avatar_color: formData.avatar_color
      }

      const { error } = await supabase
        .from('family_members')
        // @ts-expect-error - Supabase type inference issue with Database generic
        .update(updateData)
        .eq('id', editingId)
      
      if (error) {
        console.error('Error updating family member:', error)
        alert('Failed to update family member. Please try again.')
        return
      }
    } else {
      // Create new member
      const insertData: FamilyMemberInsert = {
        name: formData.name,
        email: formData.email,
        avatar_color: formData.avatar_color
      }

      const { error } = await supabase
        .from('family_members')
        // @ts-expect-error - Supabase type inference issue with Database generic
        .insert([insertData])
      
      if (error) {
        console.error('Error creating family member:', error)
        alert('Failed to create family member. Please try again.')
        return
      }
    }

    resetForm()
    loadFamilyMembers()
    if (onUpdate) onUpdate()
  }

  const handleEdit = (member: FamilyMember) => {
    setEditingId(member.id)
    setFormData({
      name: member.name,
      email: member.email,
      avatar_color: member.avatar_color
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this family member? This will also delete all their associated budget items, chores, and appointments.')) {
      return
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting family member:', error)
      alert('Failed to delete family member. Please try again.')
      return
    }
    
    loadFamilyMembers()
    if (onUpdate) onUpdate()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      avatar_color: AVATAR_COLORS[0]
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Family Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your family members
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar Color</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_color: color })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.avatar_color === color
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Add'} Member
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Family Members List */}
      <div className="space-y-3">
        {familyMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No family members yet. Click "Add Member" to get started!
          </div>
        ) : (
          familyMembers.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: member.avatar_color }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{member.name}</div>
                  <div className="text-sm text-gray-600">{member.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit member"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete member"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

