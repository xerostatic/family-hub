'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, Database } from '@/lib/supabase'
import { Check, Play, Circle, Star, Trophy, Sparkles } from 'lucide-react'
import { format, isToday, isPast, startOfDay } from 'date-fns'
import { FamilyMember, Chore } from '@/types'

type DailyChoreStatus = Database['public']['Tables']['daily_chore_status']['Row']
type DailyChoreStatusInsert = Database['public']['Tables']['daily_chore_status']['Insert']
type DailyChoreStatusUpdate = Database['public']['Tables']['daily_chore_status']['Update']

type ChoreWithStatus = Chore & {
  todayStatus?: DailyChoreStatus
}

export default function KidsChoreView({ 
  familyMembers, 
  selectedMemberId 
}: { 
  familyMembers: FamilyMember[]
  selectedMemberId?: string | null
}) {
  const [chores, setChores] = useState<Chore[]>([])
  const [dailyStatuses, setDailyStatuses] = useState<DailyChoreStatus[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedMember, setSelectedMember] = useState<string | null>(selectedMemberId || null)
  const [celebrating, setCelebrating] = useState<string | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    loadChores()
    loadDailyStatuses()
  }, [selectedDate])

  useEffect(() => {
    if (selectedMemberId) {
      setSelectedMember(selectedMemberId)
    }
  }, [selectedMemberId])

  const loadChores = async () => {
    const { data, error } = await supabase
      .from('chores')
      .select('*')
      .order('title')
    
    if (error) {
      console.error('Error loading chores:', error)
      return
    }
    
    if (data) setChores(data)
  }

  const loadDailyStatuses = async () => {
    const { data, error } = await supabase
      .from('daily_chore_status')
      .select('*')
      .eq('status_date', selectedDate)
    
    if (error) {
      console.error('Error loading daily statuses:', error)
      return
    }
    
    if (data) setDailyStatuses(data)
  }

  const updateChoreStatus = async (choreId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    const existingStatus = dailyStatuses.find(s => s.chore_id === choreId && s.status_date === selectedDate)
    const now = new Date().toISOString()

    // Optimistically update local state immediately
    if (existingStatus) {
      setDailyStatuses(prev => 
        prev.map(s => 
          s.id === existingStatus.id 
            ? { ...s, status: newStatus, updated_at: now }
            : s
        )
      )
    } else {
      // Create optimistic new status entry
      const optimisticStatus: DailyChoreStatus = {
        id: `temp-${choreId}-${selectedDate}`, // Temporary ID
        chore_id: choreId,
        status_date: selectedDate,
        status: newStatus,
        updated_at: now
      }
      setDailyStatuses(prev => [...prev, optimisticStatus])
    }

    // Celebrate completion!
    if (newStatus === 'completed') {
      setCelebrating(choreId)
      setTimeout(() => setCelebrating(null), 2000)
    }

    // Update in database
    if (existingStatus) {
      // Update existing status
      const { error } = await supabase
        .from('daily_chore_status')
        // @ts-expect-error - Supabase type inference issue
        .update({ status: newStatus, updated_at: now } as DailyChoreStatusUpdate)
        .eq('id', existingStatus.id)
      
      if (error) {
        console.error('Error updating status:', error)
        // Revert on error
        loadDailyStatuses()
        return
      }
    } else {
      // Create new status
      const insertData: DailyChoreStatusInsert = {
        chore_id: choreId,
        status_date: selectedDate,
        status: newStatus
      }

      const { error, data } = await supabase
        .from('daily_chore_status')
        // @ts-expect-error - Supabase type inference issue
        .insert([insertData])
        .select()
      
      if (error) {
        console.error('Error creating status:', error)
        // Revert on error
        loadDailyStatuses()
        return
      }

      // Replace optimistic entry with real one
      if (data && data[0]) {
        setDailyStatuses(prev => 
          prev.map(s => 
            s.id === `temp-${choreId}-${selectedDate}`
              ? data[0]
              : s
          )
        )
      }
    }

    // Still refresh to ensure sync
    loadDailyStatuses()
  }

  const getChoreStatus = (choreId: string): 'not_started' | 'in_progress' | 'completed' => {
    const status = dailyStatuses.find(s => s.chore_id === choreId && s.status_date === selectedDate)
    return status?.status || 'not_started'
  }

  const choresWithStatus: ChoreWithStatus[] = useMemo(() => {
    return chores.map(chore => ({
      ...chore,
      todayStatus: dailyStatuses.find(s => s.chore_id === chore.id && s.status_date === selectedDate)
    }))
  }, [chores, dailyStatuses, selectedDate])

  const filteredChores = useMemo(() => {
    let filtered = choresWithStatus
    
    // Filter by selected member (include Everyone chores - assigned_to === null)
    if (selectedMember) {
      filtered = filtered.filter(chore => 
        chore.assigned_to === selectedMember || chore.assigned_to === null
      )
    }
    
    return filtered
  }, [choresWithStatus, selectedMember])

  const todayStats = useMemo(() => {
    const total = filteredChores.length
    const completed = filteredChores.filter(c => getChoreStatus(c.id) === 'completed').length
    const inProgress = filteredChores.filter(c => getChoreStatus(c.id) === 'in_progress').length
    const notStarted = total - completed - inProgress
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, notStarted, percentage }
  }, [filteredChores, dailyStatuses, selectedDate])

  const selectedMemberData = familyMembers.find(m => m.id === selectedMember)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600 border-green-600'
      case 'in_progress':
        return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600'
      default:
        return 'bg-gray-300 hover:bg-gray-400 border-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-6 h-6" />
      case 'in_progress':
        return <Play className="w-6 h-6" />
      default:
        return <Circle className="w-6 h-6" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {selectedMemberData ? `${selectedMemberData.name}'s Chores` : 'My Chores'}
            </h2>
            <p className="text-purple-100 text-lg">
              {isToday(new Date(selectedDate)) ? "Today" : format(new Date(selectedDate), 'EEEE, MMMM d')}
            </p>
          </div>
          <div className="text-right">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/20 border-2 border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold">{todayStats.total}</div>
            <div className="text-sm text-purple-100">Total</div>
          </div>
          <div className="bg-green-500/30 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold">{todayStats.completed}</div>
            <div className="text-sm text-green-100">Done!</div>
          </div>
          <div className="bg-yellow-500/30 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold">{todayStats.inProgress}</div>
            <div className="text-sm text-yellow-100">Working</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold">{todayStats.percentage}%</div>
            <div className="text-sm text-purple-100">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        {todayStats.total > 0 && (
          <div className="mt-4">
            <div className="bg-white/20 rounded-full h-6 overflow-hidden backdrop-blur-sm">
              <div
                className="bg-green-400 h-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${todayStats.percentage}%` }}
              >
                {todayStats.percentage > 10 && (
                  <span className="text-white text-sm font-bold">{todayStats.percentage}%</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Celebration for 100% */}
        {todayStats.percentage === 100 && todayStats.total > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-yellow-300 animate-bounce">
            <Trophy className="w-6 h-6" />
            <span className="text-xl font-bold">All Done! Great Job! 🎉</span>
            <Trophy className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Member Selector */}
      {!selectedMemberId && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedMember(null)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedMember === null
                ? 'bg-blue-500 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Everyone
          </button>
          {familyMembers.map(member => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member.id)}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedMember === member.id
                  ? 'text-white shadow-lg scale-105'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={selectedMember === member.id ? { backgroundColor: member.avatar_color } : {}}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: member.avatar_color }}
              >
                {member.name.charAt(0)}
              </div>
              {member.name}
            </button>
          ))}
        </div>
      )}

      {/* Chores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChores.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl">
            <Circle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">No chores for this day!</p>
            <p className="text-gray-400 mt-2">Great job! 🎉</p>
          </div>
        ) : (
          filteredChores.map(chore => {
            const status = getChoreStatus(chore.id)
            const member = familyMembers.find(m => m.id === chore.assigned_to)
            const isCelebrating = celebrating === chore.id

            return (
              <div
                key={chore.id}
                className={`bg-white rounded-2xl p-6 shadow-lg border-4 transition-all duration-300 transform hover:scale-105 ${
                  status === 'completed'
                    ? 'border-green-400 bg-green-50'
                    : status === 'in_progress'
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-blue-300'
                } ${isCelebrating ? 'animate-pulse ring-4 ring-green-300' : ''}`}
              >
                {/* Chore Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-1 ${
                      status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'
                    }`}>
                      {chore.title}
                    </h3>
                    {chore.description && (
                      <p className="text-sm text-gray-600">{chore.description}</p>
                    )}
                  </div>
                  {isCelebrating && (
                    <div className="animate-bounce">
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                    </div>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button
                    onClick={() => updateChoreStatus(chore.id, 'not_started')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      status === 'not_started'
                        ? 'bg-gray-400 text-white border-gray-500 shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <Circle className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">Not Started</span>
                  </button>
                  <button
                    onClick={() => updateChoreStatus(chore.id, 'in_progress')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      status === 'in_progress'
                        ? 'bg-yellow-400 text-white border-yellow-500 shadow-lg scale-105'
                        : 'bg-yellow-50 text-yellow-600 border-yellow-300 hover:bg-yellow-100'
                    }`}
                  >
                    <Play className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">Working</span>
                  </button>
                  <button
                    onClick={() => updateChoreStatus(chore.id, 'completed')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      status === 'completed'
                        ? 'bg-green-400 text-white border-green-500 shadow-lg scale-105'
                        : 'bg-green-50 text-green-600 border-green-300 hover:bg-green-100'
                    }`}
                  >
                    <Check className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">Done!</span>
                  </button>
                </div>

                {/* Assigned To */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                  {chore.assigned_to === null ? (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500">
                        👥
                      </div>
                      <span className="text-sm text-gray-600">Assigned to Everyone</span>
                    </>
                  ) : member ? (
                    <>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: member.avatar_color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600">Assigned to {member.name}</span>
                    </>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

