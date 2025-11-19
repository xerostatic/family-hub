'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BudgetSection from '@/components/BudgetSection'
import ChoresSection from '@/components/ChoresSection'
import AppointmentsSection from '@/components/AppointmentsSection'
import FamilyEditor from '@/components/FamilyEditor'
import { CalendarDays, DollarSign, ListTodo, Users } from 'lucide-react'
import { FamilyMember } from '@/types'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'budget' | 'chores' | 'appointments' | 'family'>('budget')
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Family Hub</h1>
          <p className="text-gray-600">Managing your family's budget, chores, and appointments</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('budget')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'budget'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Budget
            </button>
            <button
              onClick={() => setActiveTab('chores')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'chores'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ListTodo className="w-5 h-5" />
              Chores
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'appointments'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'family'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              Family
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'budget' && <BudgetSection familyMembers={familyMembers} />}
          {activeTab === 'chores' && <ChoresSection familyMembers={familyMembers} />}
          {activeTab === 'appointments' && <AppointmentsSection familyMembers={familyMembers} />}
          {activeTab === 'family' && <FamilyEditor onUpdate={loadFamilyMembers} />}
        </div>
      </div>
    </main>
  )
}
