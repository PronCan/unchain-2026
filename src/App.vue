<script setup>
import { ref, computed } from 'vue'
import { showData } from './data.js'
import SeatingChart from './components/SeatingChart.vue'

const activeTab = ref('schedule') // 'schedule' | 'seat'

const schedules = ref(showData.schedules)
const roles = ref(showData.roles)

// 달력 상태 관리
const currentMonth = ref(new Date(2026, 6, 1)) // 2026년 7월 (언체인 2차 스케줄 기준)
const selectedDate = ref('2026-07-07')

// 내 일정(좌석) 상태 관리
const mySchedules = ref([]) // { date, time, seatRow, seatNum }
const showSeatModal = ref(false)
const selectedScheduleForSeat = ref(null)
const seatInputRow = ref('')
const seatInputNum = ref('')

const handleRowInput = (e) => {
  seatInputRow.value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase()
}

const handleNumInput = (e) => {
  let val = e.target.value.replace(/[^0-9]/g, '')
  // 0으로 시작하는 경우 0 제거 (양수만 허용)
  if (val.startsWith('0')) {
    val = val.replace(/^0+/, '')
  }
  seatInputNum.value = val
}

const openSeatModal = (schedule) => {
  selectedScheduleForSeat.value = schedule
  const existing = mySchedules.value.find(s => s.date === schedule.date && s.time === schedule.time)
  if (existing) {
    seatInputRow.value = existing.seatRow
    seatInputNum.value = existing.seatNum
  } else {
    seatInputRow.value = ''
    seatInputNum.value = ''
  }
  showSeatModal.value = true
}

const closeSeatModal = () => {
  showSeatModal.value = false
  selectedScheduleForSeat.value = null
}

const saveSeat = () => {
  if (!selectedScheduleForSeat.value) return
  const { date, time } = selectedScheduleForSeat.value
  
  // Remove existing
  mySchedules.value = mySchedules.value.filter(s => !(s.date === date && s.time === time))
  
  // Add new if not empty
  if (seatInputRow.value || seatInputNum.value) {
    mySchedules.value.push({
      date,
      time,
      seatRow: seatInputRow.value,
      seatNum: seatInputNum.value
    })
  }
  closeSeatModal()
}

const deleteSeat = () => {
  if (!selectedScheduleForSeat.value) return
  const { date, time } = selectedScheduleForSeat.value
  
  if (confirm('이 좌석 일정을 삭제하시겠습니까?')) {
    mySchedules.value = mySchedules.value.filter(s => !(s.date === date && s.time === time))
    closeSeatModal()
  }
}

const getMySeat = (date, time) => {
  return mySchedules.value.find(s => s.date === date && s.time === time)
}

const calendarYear = computed(() => currentMonth.value.getFullYear())
const calendarMonth = computed(() => currentMonth.value.getMonth())

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
})

const prevMonth = () => {
  currentMonth.value = new Date(calendarYear.value, calendarMonth.value - 1, 1)
}

const nextMonth = () => {
  currentMonth.value = new Date(calendarYear.value, calendarMonth.value + 1, 1)
}

const selectDate = (year, month, day) => {
  if (!day) return
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  selectedDate.value = dateStr
}

const hasMySchedule = (year, month, day) => {
  if (!day) return false
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return mySchedules.value.some(s => s.date === dateStr)
}

const schedulesForSelectedDate = computed(() => {
  return schedules.value.filter(s => s.date === selectedDate.value)
})

// 필터링 및 고정 상태 관리
const selectedActors = ref({}) // { roleId: [actorName1, actorName2] }
const pinnedActors = ref({})   // { roleId: actorName }

// 초기화
roles.value.forEach(role => {
  selectedActors.value[role.id] = []
})

const getDayOfWeek = (dateString) => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(dateString)
  return days[date.getDay()]
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

// 배우 선택/해제 토글
const toggleActor = (roleId, actor) => {
  const index = selectedActors.value[roleId].indexOf(actor)
  if (index > -1) {
    selectedActors.value[roleId].splice(index, 1)
  } else {
    selectedActors.value[roleId].push(actor)
  }
}

// 배우 고정/해제 토글
const togglePin = (roleId, actor) => {
  if (pinnedActors.value[roleId] === actor) {
    pinnedActors.value[roleId] = null // 고정 해제
  } else {
    pinnedActors.value[roleId] = actor // 고정
    // 고정 시 선택 목록에도 추가 (없다면)
    if (!selectedActors.value[roleId].includes(actor)) {
      selectedActors.value[roleId].push(actor)
    }
  }
}

// 필터링된 스케줄 계산
const filteredSchedules = computed(() => {
  return schedules.value.filter(schedule => {
    // 모든 역할에 대해 검사
    for (const role of roles.value) {
      const roleId = role.id
      const selectedForRole = selectedActors.value[roleId]
      const pinnedForRole = pinnedActors.value[roleId]
      
      // 1. 고정된 배우가 있다면, 해당 스케줄의 캐스팅이 고정된 배우와 일치해야 함
      if (pinnedForRole && schedule.cast[roleId] !== pinnedForRole) {
        return false
      }
      
      // 2. 고정된 배우가 없고 선택된 배우가 있다면, 해당 스케줄의 캐스팅이 선택된 배우 중 하나여야 함
      if (!pinnedForRole && selectedForRole.length > 0 && !selectedForRole.includes(schedule.cast[roleId])) {
        return false
      }
    }
    return true
  })
})

// 전체 보기 (필터 초기화)
const resetFilters = () => {
  roles.value.forEach(role => {
    selectedActors.value[role.id] = []
    pinnedActors.value[role.id] = null
  })
}

// 배우별 출연 횟수 계산
const actorStats = computed(() => {
  const stats = {}
  
  // 초기화
  roles.value.forEach(role => {
    stats[role.id] = {}
    role.actors.forEach(actor => {
      stats[role.id][actor] = 0
    })
  })
  
  // 카운트
  schedules.value.forEach(schedule => {
    roles.value.forEach(role => {
      const actor = schedule.cast[role.id]
      if (actor && stats[role.id][actor] !== undefined) {
        stats[role.id][actor]++
      }
    })
  })
  
  return stats
})

// 배우별 고유 색상 가져오기
const getActorColorClass = (roleId, actorName) => {
  const role = roles.value.find(r => r.id === roleId)
  if (!role) return 'bg-[#444444] text-gray-300'
  
  const index = role.actors.indexOf(actorName)
  if (index === -1) return 'bg-[#444444] text-gray-300'
  
  if (roleId === 'mark') {
    // 마크: 구분이 확실한 어두운 파란색 계열
    const colors = [
      'bg-blue-700 text-white',
      'bg-indigo-800 text-white',
      'bg-sky-600 text-white',
      'bg-cyan-800 text-white'
    ]
    return colors[index % colors.length]
  } else if (roleId === 'singer') {
    // 싱어: 구분이 확실한 어두운 초록색 계열
    const colors = [
      'bg-green-700 text-white',
      'bg-teal-800 text-white',
      'bg-emerald-600 text-white',
      'bg-lime-800 text-white'
    ]
    return colors[index % colors.length]
  }
  
  return 'bg-[#555555] text-gray-200'
}
</script>

<template>
  <div class="min-h-screen bg-[#222222] text-gray-100 p-4 md:p-8 font-sans">
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- Tab Navigation -->
      <div class="flex space-x-2 border-b border-[#444444] mb-6">
        <button
          @click="activeTab = 'schedule'"
          class="px-6 py-3 font-medium text-sm transition-colors relative"
          :class="activeTab === 'schedule' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'"
        >
          출연 일정
          <div v-if="activeTab === 'schedule'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
        </button>
        <button
          @click="activeTab = 'seat'"
          class="px-6 py-3 font-medium text-sm transition-colors relative"
          :class="activeTab === 'seat' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'"
        >
          일정/좌석 정산
          <div v-if="activeTab === 'seat'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
        </button>
        <button
          @click="activeTab = 'stats'"
          class="px-6 py-3 font-medium text-sm transition-colors relative"
          :class="activeTab === 'stats' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'"
        >
          통계
          <div v-if="activeTab === 'stats'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
        </button>
      </div>

      <!-- Tab 1: Schedule -->
      <div v-if="activeTab === 'schedule'" class="space-y-6">
        <!-- Filter Section -->
        <div class="bg-[#333333] rounded-xl shadow-md p-6 border border-[#444444]">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Cast Filter
            </h2>
            <button @click="resetFilters" class="text-sm text-gray-400 hover:text-blue-400 font-medium transition-colors">
              전체 보기 ↺
            </button>
          </div>
          
          <p class="text-xs text-gray-400 mb-4">배우를 선택하고 📌 고정하면 해당 배우의 공연만 볼 수 있어요.</p>
          
          <div class="space-y-4">
            <div v-for="role in roles" :key="role.id" class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div class="w-24 font-medium text-sm text-gray-300">{{ role.name }}</div>
              <div class="flex flex-wrap gap-2">
                <div v-for="actor in role.actors" :key="actor" 
                     class="relative inline-flex items-center rounded-full border transition-all duration-200 cursor-pointer overflow-hidden"
                     :class="[
                       pinnedActors[role.id] === actor ? 'border-blue-500 bg-blue-900/40 text-blue-200 ring-1 ring-blue-500' :
                       selectedActors[role.id].includes(actor) ? 'border-yellow-400 ring-1 ring-yellow-400 ' + getActorColorClass(role.id, actor) : 
                       'border-transparent hover:border-[#777777] ' + getActorColorClass(role.id, actor)
                     ]">
                  <button @click="toggleActor(role.id, actor)" class="px-3 py-1.5 text-sm font-medium focus:outline-none flex items-center gap-1.5">
                    <span>{{ actor }}</span>
                  </button>
                  <button @click.stop="togglePin(role.id, actor)" 
                          class="px-2 py-1.5 border-l border-white/20 hover:bg-white/10 focus:outline-none transition-colors"
                          :class="pinnedActors[role.id] === actor ? 'border-blue-700 text-blue-400' : 'text-gray-400 hover:text-white'"
                          title="이 배우 고정하기">
                    <span class="text-xs">{{ pinnedActors[role.id] === actor ? '📌' : '📍' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="bg-[#333333] rounded-xl shadow-md overflow-hidden border border-[#444444]">
          <!-- Header -->
          <div class="p-6 md:p-8 border-b border-[#444444] flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold text-white mb-2">{{ showData.title }} 출연 일정</h1>
              <div class="flex flex-wrap gap-4 text-sm text-gray-400">
                <span class="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ showData.period }}
                </span>
                <span class="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ showData.venue }}
                </span>
              </div>
            </div>
            <div class="bg-blue-900/30 text-blue-300 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 border border-blue-900/50">
              <span>검색 결과: {{ filteredSchedules.length }}건</span>
              <span class="text-blue-500/50">|</span>
              <span>전체 {{ schedules.length }}회</span>
            </div>
          </div>

          <!-- Schedule Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#2a2a2a] border-b border-[#444444] text-sm uppercase tracking-wider text-gray-400">
                  <th class="p-4 font-medium sticky left-0 bg-[#2a2a2a] z-10">날짜</th>
                  <th class="p-4 font-medium">시간</th>
                  <th v-for="role in roles" :key="role.id" class="p-4 font-medium text-center">
                    {{ role.name }}
                  </th>
                  <th class="p-4 font-medium text-center">일정 추가</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#444444]">
                <tr v-if="filteredSchedules.length === 0">
                  <td :colspan="roles.length + 3" class="p-12 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <span class="text-4xl">🎭</span>
                      <p>조건에 맞는 공연 일정이 없습니다.</p>
                      <button @click="resetFilters" class="mt-2 text-blue-400 hover:underline text-sm font-medium">필터 초기화하기</button>
                    </div>
                  </td>
                </tr>
                <tr v-for="(schedule, index) in filteredSchedules" :key="index" class="hover:bg-[#3a3a3a] transition-colors group" :class="{'bg-blue-900/10': schedule.round === 1}">
                  <td class="p-4 whitespace-nowrap sticky left-0 z-10 border-r border-[#444444] md:border-r-0 transition-colors" :class="schedule.round === 1 ? 'bg-[#333333] group-hover:bg-[#3a3a3a]' : 'bg-[#333333] group-hover:bg-[#3a3a3a]'">
                    <div class="flex items-center gap-2">
                      <div>
                        <div class="font-medium text-gray-100">{{ formatDate(schedule.date) }}</div>
                        <div class="text-xs text-gray-400">{{ getDayOfWeek(schedule.date) }}요일</div>
                      </div>
                    </div>
                  </td>
                  <td class="p-4 whitespace-nowrap text-gray-300 font-medium">
                    {{ schedule.time }}
                  </td>
                  <td v-for="role in roles" :key="role.id" class="p-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <span class="inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors" 
                            :class="[
                              pinnedActors[role.id] === schedule.cast[role.id] ? 'bg-blue-600 text-white shadow-sm' :
                              selectedActors[role.id].includes(schedule.cast[role.id]) ? 'ring-2 ring-yellow-400 ' + getActorColorClass(role.id, schedule.cast[role.id]) :
                              getActorColorClass(role.id, schedule.cast[role.id])
                            ]">
                        {{ schedule.cast[role.id] }}
                      </span>
                      <span v-if="schedule.remarks && schedule.remarks.includes(schedule.cast[role.id] + ' 첫공')" 
                            class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-900/30 text-orange-400 border border-orange-800/50 whitespace-nowrap">
                        첫공
                      </span>
                    </div>
                  </td>
                  <td class="p-4 text-center">
                    <div v-if="getMySeat(schedule.date, schedule.time)" 
                         @click="openSeatModal(schedule)"
                         class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/40 text-blue-300 border border-blue-800 rounded-lg cursor-pointer hover:bg-blue-800/50 transition-colors text-sm font-bold">
                      <span>{{ getMySeat(schedule.date, schedule.time).seatRow }}열 {{ getMySeat(schedule.date, schedule.time).seatNum }}번</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <button v-else @click="openSeatModal(schedule)" 
                            class="w-8 h-8 rounded-full bg-[#444444] text-gray-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 2: Seating Chart Section -->
      <div v-if="activeTab === 'seat'" class="space-y-6">
        <!-- Calendar Section -->
        <div class="bg-[#333333] rounded-xl shadow-md p-6 border border-[#444444]">
          <div class="flex justify-between items-center mb-6">
            <button @click="prevMonth" class="px-3 py-1 rounded bg-[#444444] text-gray-300 hover:bg-[#555555] transition-colors">&lt;</button>
            <div class="font-bold text-lg text-white">{{ calendarYear }}년 {{ calendarMonth + 1 }}월</div>
            <button @click="nextMonth" class="px-3 py-1 rounded bg-[#444444] text-gray-300 hover:bg-[#555555] transition-colors">&gt;</button>
          </div>
          
          <div class="grid grid-cols-7 gap-1 text-center mb-2">
            <div v-for="(day, i) in ['일', '월', '화', '수', '목', '금', '토']" :key="day" 
                 class="text-xs font-bold"
                 :class="i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'">
              {{ day }}
            </div>
          </div>
          
          <div class="grid grid-cols-7 gap-1">
            <div v-for="(day, i) in calendarDays" :key="i"
                 @click="selectDate(calendarYear, calendarMonth, day)"
                 class="h-12 flex flex-col items-center justify-start pt-1.5 rounded-lg transition-colors cursor-pointer border"
                 :class="[
                   !day ? 'cursor-default border-transparent' : 
                   `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === selectedDate 
                     ? 'bg-blue-600 text-white border-blue-500' 
                     : 'hover:bg-[#444444] border-transparent text-gray-300',
                   day && i % 7 === 0 && `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` !== selectedDate ? 'text-red-400' : '',
                   day && i % 7 === 6 && `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` !== selectedDate ? 'text-blue-400' : ''
                 ]">
              <span v-if="day" class="text-sm" :class="{'font-bold': `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === selectedDate}">
                {{ day }}
              </span>
              <div v-if="hasMySchedule(calendarYear, calendarMonth, day)" class="w-1.5 h-1.5 rounded-full mt-1"
                   :class="`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === selectedDate ? 'bg-white' : 'bg-blue-500'">
              </div>
            </div>
          </div>
        </div>

        <!-- My Schedules List -->
        <div v-if="mySchedules.length > 0" class="bg-[#333333] rounded-xl shadow-md p-6 border border-[#444444]">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            내 일정 목록
          </h3>
          <div class="space-y-3">
            <div v-for="(schedule, idx) in [...mySchedules].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))" :key="idx" 
                 class="bg-[#2a2a2a] border border-[#444444] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-bold text-gray-100">{{ schedule.date.replace(/-/g, '.') }}</span>
                  <span class="text-blue-400 font-bold">{{ schedule.time }}</span>
                </div>
                <div class="text-sm text-gray-400">
                  좌석: <span class="text-white font-medium">{{ schedule.seatRow }}열 {{ schedule.seatNum }}번</span>
                </div>
              </div>
              <button @click="() => {
                        selectedScheduleForSeat = schedules.find(s => s.date === schedule.date && s.time === schedule.time)
                        deleteSeat()
                      }" 
                      class="px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 transition-colors text-sm font-medium">
                삭제
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Date Schedules -->
        <div v-if="schedulesForSelectedDate.length > 0" class="bg-[#333333] rounded-xl shadow-md p-6 border border-[#444444]">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ selectedDate.replace(/-/g, '.') }} 캐스팅
          </h3>
          <div class="space-y-3">
            <div v-for="(schedule, idx) in schedulesForSelectedDate" :key="idx" 
                 class="bg-[#2a2a2a] border border-[#444444] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <span class="text-blue-400 font-bold text-lg">{{ schedule.time }}</span>
                <span v-if="schedule.round" class="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-900/40 text-blue-300 border border-blue-800">
                  {{ schedule.round }}차
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <div v-for="role in roles" :key="role.id" class="flex items-center gap-1.5">
                  <span class="text-xs text-gray-500">{{ role.name }}</span>
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getActorColorClass(role.id, schedule.cast[role.id])">
                    {{ schedule.cast[role.id] }}
                  </span>
                </div>
              </div>
              <div class="mt-3 sm:mt-0 flex-shrink-0">
                <div v-if="getMySeat(schedule.date, schedule.time)" 
                     @click="openSeatModal(schedule)"
                     class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/40 text-blue-300 border border-blue-800 rounded-lg cursor-pointer hover:bg-blue-800/50 transition-colors text-sm font-bold">
                  <span>{{ getMySeat(schedule.date, schedule.time).seatRow }}열 {{ getMySeat(schedule.date, schedule.time).seatNum }}번</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <button v-else @click="openSeatModal(schedule)" 
                        class="px-3 py-1.5 rounded-lg bg-[#444444] text-gray-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  내 일정 추가
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="bg-[#333333] rounded-xl shadow-md p-6 border border-[#444444] text-center text-gray-500">
          선택한 날짜에 공연 일정이 없습니다.
        </div>

        <SeatingChart />
      </div>

      <!-- Tab 3: Stats Section -->
      <div v-if="activeTab === 'stats'" class="space-y-6">
        <div class="bg-[#333333] rounded-xl shadow-md p-6 border border-[#444444]">
          <h2 class="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ showData.title }} 출연 통계
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="role in roles" :key="role.id" class="bg-[#2a2a2a] rounded-lg p-4 border border-[#444444]">
              <h3 class="font-bold text-gray-200 mb-3 border-b border-[#444444] pb-2">{{ role.name }}</h3>
              <ul class="space-y-2">
                <li v-for="actor in role.actors" :key="actor" class="flex justify-between items-center text-sm">
                  <span class="text-gray-300">{{ actor }}</span>
                  <div class="flex items-center gap-2">
                    <div class="relative group flex items-center">
                      <div class="w-24 bg-[#444444] rounded-full h-2 overflow-hidden cursor-help">
                        <div class="bg-blue-500 h-full rounded-full" :style="`width: ${(actorStats[role.id][actor] / schedules.length) * 100}%`"></div>
                      </div>
                      <!-- Tooltip -->
                      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10 pointer-events-none">
                        <div class="bg-black text-white text-[10px] font-bold rounded py-1 px-2 whitespace-nowrap shadow-lg">
                          {{ Math.round((actorStats[role.id][actor] / schedules.length) * 100) }}%
                        </div>
                        <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black absolute top-full left-1/2 -translate-x-1/2"></div>
                      </div>
                    </div>
                    <span class="font-medium text-gray-100 w-20 text-right">{{ actorStats[role.id][actor] }} / {{ schedules.length }} 회</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        <div class="mt-10">
          <h3 class="font-bold text-white mb-4 text-base flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            마크&싱어 페어 출연 통계
          </h3>
          <div class="overflow-auto">
            <table class="min-w-max w-full text-sm border-collapse mt-3">
              <thead>
                <tr>
                  <th class="px-3 py-2 border-b border-[#444444] bg-[#2c2c2c] text-gray-200 text-left">마크</th>
                  <th class="px-3 py-2 border-b border-[#444444] bg-[#2c2c2c] text-gray-200 text-left">싱어</th>
                  <th class="px-3 py-2 border-b border-[#444444] bg-[#2c2c2c] text-gray-200 text-left">횟수</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(count, key) in pairStats" :key="key" v-if="count > 0">
                  <td class="px-3 py-2 border-b border-[#444444] text-gray-100">
                    {{ key.split('|||')[0] }}
                  </td>
                  <td class="px-3 py-2 border-b border-[#444444] text-gray-100">
                    {{ key.split('|||')[1] }}
                  </td>
                  <td class="px-3 py-2 border-b border-[#444444] text-gray-100">
                    {{ count }}회
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>

    </div>

    <!-- Seat Input Modal -->
    <div v-if="showSeatModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" @click="closeSeatModal">
      <div class="bg-[#333333] rounded-xl p-6 w-full max-w-sm border border-[#444444] shadow-2xl" @click.stop>
        <h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          내 좌석 입력
        </h3>
        <div class="mb-6 text-sm text-gray-400 bg-[#222222] p-3 rounded-lg border border-[#444444]">
          <div class="font-bold text-gray-200 mb-1">{{ selectedScheduleForSeat.date.replace(/-/g, '.') }} {{ selectedScheduleForSeat.time }}</div>
          <div class="text-xs">
            마크: {{ selectedScheduleForSeat.cast.mark }} / 싱어: {{ selectedScheduleForSeat.cast.singer }}
          </div>
        </div>
        
        <div class="flex gap-3 mb-6">
          <div class="flex-1">
            <label class="block text-xs font-bold text-gray-400 mb-2">열 (Row)</label>
            <input :value="seatInputRow" @input="handleRowInput" type="text" placeholder="예: A" 
                   class="w-full bg-[#222222] border border-[#444444] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase">
          </div>
          <div class="flex-1">
            <label class="block text-xs font-bold text-gray-400 mb-2">번호 (Number)</label>
            <input :value="seatInputNum" @input="handleNumInput" type="text" inputmode="numeric" placeholder="예: 12" 
                   class="w-full bg-[#222222] border border-[#444444] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
          </div>
        </div>
        
        <div class="flex gap-3">
          <button v-if="getMySeat(selectedScheduleForSeat.date, selectedScheduleForSeat.time)" 
                  @click="deleteSeat" 
                  class="flex-1 py-2.5 rounded-lg bg-red-900/40 text-red-400 border border-red-800/50 hover:bg-red-900/60 font-medium transition-colors">
            삭제
          </button>
          <button v-else @click="closeSeatModal" class="flex-1 py-2.5 rounded-lg bg-[#444444] text-gray-200 hover:bg-[#555555] font-medium transition-colors">
            취소
          </button>
          <button @click="saveSeat" class="flex-1 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-900/20">저장</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* Add any custom styles here if needed, Tailwind handles most things */
</style>