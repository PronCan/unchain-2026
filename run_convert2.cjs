const fs = require('fs');

const appVue = fs.readFileSync('src/App.vue', 'utf8');

// Extract script setup
const scriptMatch = appVue.match(/(<script setup>[\s\S]*?<\/script>)/);
if (!scriptMatch) {
    console.error("Could not find script setup");
    process.exit(1);
}

const scriptContent = scriptMatch[1];

const newTemplateAndStyle = `
<template>
  <div class="app-container">
    <div class="main-wrapper">
      
      <!-- Tab Navigation -->
      <div class="tab-nav-container">
        <div class="tab-nav-scroll">
          <button
            @click="activeTab = 'schedule'"
            class="tab-btn"
            :class="{ 'active': activeTab === 'schedule' }"
          >
            출연 일정
            <div v-if="activeTab === 'schedule'" class="tab-indicator"></div>
          </button>
          <button
            @click="activeTab = 'seat'"
            class="tab-btn"
            :class="{ 'active': activeTab === 'seat' }"
          >
            일정/좌석 정산
            <div v-if="activeTab === 'seat'" class="tab-indicator"></div>
          </button>
          <button
            @click="activeTab = 'stats'"
            class="tab-btn"
            :class="{ 'active': activeTab === 'stats' }"
          >
            통계
            <div v-if="activeTab === 'stats'" class="tab-indicator"></div>
          </button>
        </div>
        <button @click="showSettingsModal = true" class="settings-btn" title="설정 및 백업">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <!-- Tab 1: Schedule -->
      <div v-if="activeTab === 'schedule'" class="tab-content">
        <!-- Filter Section -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Cast Filter
            </h2>
            <button @click="resetFilters" class="btn-text">
              전체 보기 ↺
            </button>
          </div>
          
          <p class="help-text">배우를 선택하고 📌 고정하면 해당 배우의 공연만 볼 수 있어요.</p>
          
          <div class="filter-list">
            <div v-for="role in roles" :key="role.id" class="filter-row">
              <div class="role-name">{{ role.name }}</div>
              <div class="actor-list">
                <div v-for="actor in role.actors" :key="actor" 
                     class="actor-badge"
                     :class="[
                       pinnedActors[role.id] === actor ? 'pinned' :
                       selectedActors[role.id].includes(actor) ? 'selected ' + getActorColorClass(role.id, actor) : 
                       'default ' + getActorColorClass(role.id, actor)
                     ]">
                  <button @click="toggleActor(role.id, actor)" class="actor-btn">
                    <span>{{ actor }}</span>
                  </button>
                  <button @click.stop="togglePin(role.id, actor)" 
                          class="pin-btn"
                          :class="pinnedActors[role.id] === actor ? 'active' : ''"
                          title="이 배우 고정하기">
                    <span>{{ pinnedActors[role.id] === actor ? '📌' : '📍' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="card no-padding">
          <!-- Header -->
          <div class="schedule-header">
            <div>
              <h1 class="main-title">{{ showData.title }} 스케줄</h1>
              <div class="info-tags">
                <span class="info-tag">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ showData.period }}
                </span>
                <span class="info-tag">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ showData.venue }}
                </span>
              </div>
            </div>
            <div class="search-result">
              <span>검색 결과: {{ filteredSchedules.length }}건</span>
              <span class="divider">|</span>
              <span>전체 {{ schedules.length }}회</span>
            </div>
          </div>

          <!-- Schedule Table -->
          <div class="table-container">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="sticky-col">날짜/시간</th>
                  <th v-for="role in roles" :key="role.id" class="text-center">
                    {{ role.name }}
                  </th>
                  <th class="text-center">일정 추가</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredSchedules.length === 0">
                  <td :colspan="roles.length + 2" class="empty-state">
                    <div class="empty-content">
                      <span class="empty-icon">🎭</span>
                      <p>조건에 맞는 공연 일정이 없습니다.</p>
                      <button @click="resetFilters" class="btn-text">필터 초기화하기</button>
                    </div>
                  </td>
                </tr>
                <tr v-for="(schedule, index) in filteredSchedules" :key="index" :class="{'round-1': schedule.round === 1}">
                  <td class="sticky-col" :class="{'round-1-bg': schedule.round === 1}">
                    <div class="date-time-cell">
                      <div class="date-text">{{ formatDate(schedule.date) }}</div>
                      <div class="time-text">
                        <span>{{ getDayOfWeek(schedule.date) }}요일</span>
                        <span class="time-highlight">{{ schedule.time }}</span>
                      </div>
                    </div>
                  </td>
                  <td v-for="role in roles" :key="role.id" class="text-center">
                    <div class="cast-cell">
                      <span class="cast-badge" 
                            :class="[
                              pinnedActors[role.id] === schedule.cast[role.id] ? 'pinned' :
                              selectedActors[role.id].includes(schedule.cast[role.id]) ? 'selected ' + getActorColorClass(role.id, schedule.cast[role.id]) :
                              getActorColorClass(role.id, schedule.cast[role.id])
                            ]">
                        {{ schedule.cast[role.id] }}
                      </span>
                      <span v-if="schedule.remarks && schedule.remarks.includes(schedule.cast[role.id] + ' 첫공')" 
                            class="first-show-badge">
                        첫공
                      </span>
                    </div>
                  </td>
                  <td class="text-center">
                    <div v-if="getMySeat(schedule.date, schedule.time)" 
                         @click="openSeatModal(schedule)"
                         class="my-seat-badge">
                      <span>{{ getMySeat(schedule.date, schedule.time).seatRow }}열 {{ getMySeat(schedule.date, schedule.time).seatNum }}번</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="icon-tiny" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <button v-else @click="openSeatModal(schedule)" class="btn-add-seat">
                      <svg xmlns="http://www.w3.org/2000/svg" class="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div v-if="activeTab === 'seat'" class="tab-content">
        <!-- Calendar Section -->
        <div class="card">
          <div class="calendar-header">
            <button @click="prevMonth" class="btn-icon">&lt;</button>
            <div class="calendar-title">{{ calendarYear }}년 {{ calendarMonth + 1 }}월</div>
            <button @click="nextMonth" class="btn-icon">&gt;</button>
          </div>
          
          <div class="calendar-grid-header">
            <div v-for="(day, i) in ['일', '월', '화', '수', '목', '금', '토']" :key="day" 
                 class="calendar-day-name"
                 :class="i === 0 ? 'text-red' : i === 6 ? 'text-blue' : ''">
              {{ day }}
            </div>
          </div>
          
          <div class="calendar-grid">
            <div v-for="(day, i) in calendarDays" :key="i"
                 @click="selectDate(calendarYear, calendarMonth, day)"
                 class="calendar-day"
                 :class="[
                   !day ? 'empty' : '',
                   day && \`\${calendarYear}-\${String(calendarMonth + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\` === selectedDate ? 'selected' : '',
                   day && i % 7 === 0 && \`\${calendarYear}-\${String(calendarMonth + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\` !== selectedDate ? 'text-red' : '',
                   day && i % 7 === 6 && \`\${calendarYear}-\${String(calendarMonth + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\` !== selectedDate ? 'text-blue' : ''
                 ]">
              <span v-if="day" class="day-number">{{ day }}</span>
              <div v-if="hasMySchedule(calendarYear, calendarMonth, day)" class="schedule-dot"></div>
            </div>
          </div>
        </div>

        <!-- My Schedules List -->
        <div v-if="mySchedules.length > 0" class="card">
          <h3 class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            내 일정 목록
          </h3>
          <div class="schedule-list">
            <div v-for="(schedule, idx) in [...mySchedules].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))" :key="idx" 
                 class="schedule-item">
              <div class="schedule-info">
                <div class="schedule-datetime">
                  <span class="date">{{ schedule.date.replace(/-/g, '.') }}</span>
                  <span class="time">{{ schedule.time }}</span>
                </div>
                <div class="schedule-seat">
                  좌석: <span>{{ schedule.seatRow }}열 {{ schedule.seatNum }}번</span>
                </div>
              </div>
              <button @click="() => {
                        selectedScheduleForSeat = schedules.find(s => s.date === schedule.date && s.time === schedule.time)
                        deleteSeat()
                      }" 
                      class="btn-delete-small">
                삭제
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Date Schedules -->
        <div v-if="schedulesForSelectedDate.length > 0" class="card">
          <h3 class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ selectedDate.replace(/-/g, '.') }} 캐스팅
          </h3>
          <div class="schedule-list">
            <div v-for="(schedule, idx) in schedulesForSelectedDate" :key="idx" 
                 class="schedule-item">
              <div class="schedule-time-badge">
                <span class="time">{{ schedule.time }}</span>
                <span v-if="schedule.round" class="round-badge">{{ schedule.round }}차</span>
              </div>
              <div class="cast-list">
                <div v-for="role in roles" :key="role.id" class="cast-item">
                  <span class="role">{{ role.name }}</span>
                  <span class="actor" :class="getActorColorClass(role.id, schedule.cast[role.id])">
                    {{ schedule.cast[role.id] }}
                  </span>
                </div>
              </div>
              <div class="schedule-actions">
                <div v-if="getMySeat(schedule.date, schedule.time)" 
                     @click="openSeatModal(schedule)"
                     class="my-seat-badge">
                  <span>{{ getMySeat(schedule.date, schedule.time).seatRow }}열 {{ getMySeat(schedule.date, schedule.time).seatNum }}번</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon-tiny" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <button v-else @click="openSeatModal(schedule)" class="btn-add-schedule">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  일정 추가
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="card empty-card">
          선택한 날짜에 공연 일정이 없습니다.
        </div>

        <SeatingChart :seatCounts="mySeatCounts" />
      </div>

      <!-- Tab 3: Stats Section -->
      <div v-if="activeTab === 'stats'" class="tab-content">
        <div class="card">
          <h2 class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ showData.title }} 출연 통계
          </h2>
          
          <div class="stats-grid">
            <div v-for="role in roles" :key="role.id" class="stat-card">
              <h3 class="stat-role">{{ role.name }}</h3>
              <ul class="stat-list">
                <li v-for="actor in role.actors" :key="actor" class="stat-item">
                  <span class="actor-name">{{ actor }}</span>
                  <div class="stat-bar-container">
                    <div class="progress-wrapper">
                      <div class="progress-bg">
                        <div class="progress-fill" :style="\`width: \${(actorStats[role.id][actor] / schedules.length) * 100}%\`"></div>
                      </div>
                      <div class="tooltip">
                        <div class="tooltip-content">
                          {{ Math.round((actorStats[role.id][actor] / schedules.length) * 100) }}%
                        </div>
                        <div class="tooltip-arrow"></div>
                      </div>
                    </div>
                    <span class="stat-count">{{ actorStats[role.id][actor] }} / {{ schedules.length }} 회</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="pair-stats-section">
            <h3 class="card-subtitle">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              마크&싱어 페어 출연 통계
            </h3>
            <div class="table-container">
              <table class="pair-table">
                <thead>
                  <tr>
                    <th class="text-center">마크</th>
                    <th class="text-center">싱어</th>
                    <th class="text-center">관람 / 전체</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="mark in roles.find(r => r.id === 'mark')?.actors" :key="'mark-'+mark">
                    <tr v-for="(singer, index) in roles.find(r => r.id === 'singer')?.actors" :key="'singer-'+singer">
                      <td v-if="index === 0" :rowspan="roles.find(r => r.id === 'singer')?.actors.length" class="mark-cell">
                        {{ mark }}
                      </td>
                      <td>{{ singer }}</td>
                      <td :class="{'text-gray': !(pairStats[\`\${mark}|||\${singer}\`] > 0)}">
                        <span :class="{'highlight': myPairStats[\`\${mark}|||\${singer}\`] > 0}">{{ myPairStats[\`\${mark}|||\${singer}\`] || 0 }}</span>
                        <span class="divider">/</span>
                        <span>{{ pairStats[\`\${mark}|||\${singer}\`] || 0 }}회</span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Seat Input Modal -->
    <div v-if="showSeatModal" class="modal-overlay" @click="closeSeatModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          내 좌석 입력
        </h3>
        <div class="modal-info">
          <div class="info-datetime">{{ selectedScheduleForSeat.date.replace(/-/g, '.') }} {{ selectedScheduleForSeat.time }}</div>
          <div class="info-cast">
            마크: {{ selectedScheduleForSeat.cast.mark }} / 싱어: {{ selectedScheduleForSeat.cast.singer }}
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>열 (Row)</label>
            <input :value="seatInputRow" @input="handleRowInput" type="text" placeholder="예: A" class="uppercase">
          </div>
          <div class="form-group">
            <label>번호 (Number)</label>
            <input :value="seatInputNum" @input="handleNumInput" type="text" inputmode="numeric" placeholder="예: 12">
          </div>
        </div>
        
        <div class="modal-actions">
          <button v-if="getMySeat(selectedScheduleForSeat.date, selectedScheduleForSeat.time)" 
                  @click="deleteSeat" 
                  class="btn-danger">
            삭제
          </button>
          <button v-else @click="closeSeatModal" class="btn-secondary">
            취소
          </button>
          <button @click="saveSeat" class="btn-primary">저장</button>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="modal-overlay" @click="showSettingsModal = false">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          설정 및 백업
        </h3>
        
        <div class="settings-actions">
          <button @click="exportData" class="btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            데이터 백업 (JSON 저장)
          </button>
          
          <button @click="$refs.fileInputRef.click()" class="btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            데이터 불러오기 (JSON 열기)
          </button>
          <input type="file" ref="fileInputRef" accept=".json" class="hidden" @change="importData">
        </div>
        
        <button @click="showSettingsModal = false" class="btn-secondary">
          닫기
        </button>
      </div>
    </div>

  </div>
</template>

<style lang="scss">
/* SCSS Variables & Mixins */
$bg-main: #222222;
$bg-card: #333333;
$bg-card-hover: #3a3a3a;
$bg-dark: #2a2a2a;
$border-color: #444444;
$text-main: #f3f4f6;
$text-muted: #9ca3af;
$text-dark: #6b7280;
$blue-main: #60a5fa;
$blue-dark: #3b82f6;
$red-main: #f87171;
$green-main: #34d399;
$yellow-main: #facc15;

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Base Layout */
.app-container {
  min-height: 100vh;
  background-color: $bg-main;
  color: $text-main;
  padding: 1rem;
  font-family: sans-serif;

  @media (min-width: 768px) {
    padding: 2rem;
  }
}

.main-wrapper {
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Tab Navigation */
.tab-nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $border-color;
  margin-bottom: 1.5rem;
}

.tab-nav-scroll {
  display: flex;
  overflow-x: auto;
  gap: 0.25rem;
  width: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }

  @media (min-width: 640px) {
    gap: 0.5rem;
  }
}

.tab-btn {
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.2s;
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
  color: $text-muted;

  @media (min-width: 640px) {
    padding: 0.75rem 1.5rem;
  }

  &:hover { color: #e5e7eb; }
  &.active { color: $blue-main; }
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: $blue-dark;
}

.settings-btn {
  padding: 0.75rem;
  flex-shrink: 0;
  color: $text-muted;
  transition: color 0.2s;

  &:hover { color: #ffffff; }
  svg { width: 1.25rem; height: 1.25rem; }
}

/* Cards */
.card {
  background-color: $bg-card;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid $border-color;

  &.no-padding { padding: 0; }
  &.empty-card { text-align: center; color: $text-dark; }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-subtitle {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Icons */
.icon-blue { color: $blue-main; width: 1.25rem; height: 1.25rem; }
.icon-green { color: $green-main; width: 1rem; height: 1rem; }
.icon-gray { color: $text-muted; width: 1.25rem; height: 1.25rem; }
.icon-small { width: 1rem; height: 1rem; }
.icon-tiny { width: 0.75rem; height: 0.75rem; }

/* Buttons */
.btn-text {
  font-size: 0.875rem;
  color: $text-muted;
  font-weight: 500;
  transition: color 0.2s;
  &:hover { color: $blue-main; }
}

/* Filter Section */
.help-text {
  font-size: 0.75rem;
  color: $text-muted;
  margin-bottom: 1rem;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

.role-name {
  width: 5rem;
  flex-shrink: 0;
  font-weight: 500;
  font-size: 0.875rem;
  color: #d1d5db;

  @media (min-width: 640px) {
    width: 6rem;
  }
}

.actor-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.actor-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
  overflow: hidden;

  &.pinned {
    border-color: $blue-dark;
    background-color: rgba(30, 58, 138, 0.4);
    color: #bfdbfe;
    box-shadow: 0 0 0 1px $blue-dark;
  }
  &.selected {
    border-color: $yellow-main;
    box-shadow: 0 0 0 1px $yellow-main;
  }
  &.default {
    &:hover { border-color: #777777; }
  }
}

.actor-btn {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;

  @media (min-width: 640px) {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }
}

.pin-btn {
  padding: 0.25rem 0.375rem;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  transition: background-color 0.2s, color 0.2s;
  color: $text-muted;

  @media (min-width: 640px) {
    padding: 0.375rem 0.5rem;
  }

  &:hover { background-color: rgba(255, 255, 255, 0.1); color: #ffffff; }
  &.active { border-color: #1d4ed8; color: $blue-main; }
  span { font-size: 10px; @media (min-width: 640px) { font-size: 0.75rem; } }
}

/* Schedule Header */
.schedule-header {
  padding: 1.5rem;
  border-bottom: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.main-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: $text-muted;
}

.info-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.search-result {
  background-color: rgba(30, 58, 138, 0.3);
  color: #93c5fd;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(30, 58, 138, 0.5);

  .divider { color: rgba(59, 130, 246, 0.5); }
}

/* Table */
.table-container {
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.schedule-table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
  min-width: 450px;

  @media (min-width: 640px) {
    min-width: 600px;
  }

  thead tr {
    background-color: $bg-dark;
    border-bottom: 1px solid $border-color;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-muted;

    @media (min-width: 640px) { font-size: 0.875rem; }
  }

  th {
    padding: 0.5rem;
    font-weight: 500;

    @media (min-width: 640px) { padding: 1rem; }

    &.sticky-col {
      position: sticky;
      left: 0;
      background-color: $bg-dark;
      z-index: 10;
      width: 4rem;
      @media (min-width: 640px) { width: auto; }
    }
    &.text-center { text-align: center; width: 4rem; @media (min-width: 640px) { width: auto; } }
  }

  tbody {
    tr {
      transition: background-color 0.2s;
      border-bottom: 1px solid $border-color;
      &:hover { background-color: $bg-card-hover; }
      &.round-1 { background-color: rgba(30, 58, 138, 0.1); }
    }

    td {
      padding: 0.5rem;
      @media (min-width: 640px) { padding: 1rem; }

      &.sticky-col {
        white-space: nowrap;
        position: sticky;
        left: 0;
        z-index: 10;
        border-right: 1px solid $border-color;
        background-color: $bg-card;
        transition: background-color 0.2s;

        @media (min-width: 768px) { border-right: none; }
        
        &.round-1-bg { background-color: $bg-card; }
      }
      &.text-center { text-align: center; }
    }
  }
}

.schedule-table tbody tr:hover td.sticky-col {
  background-color: $bg-card-hover;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: $text-dark;

  @media (min-width: 640px) { padding: 3rem; }
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  .empty-icon { font-size: 1.875rem; @media (min-width: 640px) { font-size: 2.25rem; } }
  p { font-size: 0.875rem; @media (min-width: 640px) { font-size: 1rem; } }
}

.date-time-cell {
  display: flex;
  flex-direction: column;

  .date-text {
    font-weight: 500;
    color: #f3f4f6;
    font-size: 11px;
    @media (min-width: 640px) { font-size: 1rem; }
  }
  .time-text {
    font-size: 9px;
    color: $text-muted;
    margin-top: 0.125rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;

    @media (min-width: 640px) { font-size: 0.75rem; }
    
    .time-highlight { color: $blue-main; font-weight: 700; }
  }
}

.cast-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  @media (min-width: 640px) { flex-direction: row; gap: 0.375rem; }
}

.cast-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
  white-space: nowrap;

  @media (min-width: 640px) { padding: 0.25rem 0.75rem; font-size: 0.875rem; }

  &.pinned { background-color: #2563eb; color: #ffffff; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
  &.selected { box-shadow: 0 0 0 2px $yellow-main; }
}

.first-show-badge {
  padding: 0.125rem 0.375rem;
  font-size: 9px;
  font-weight: 700;
  border-radius: 0.25rem;
  background-color: rgba(124, 45, 18, 0.3);
  color: #fb923c;
  border: 1px solid rgba(154, 52, 18, 0.5);
  white-space: nowrap;

  @media (min-width: 640px) { font-size: 10px; }
}

.my-seat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.375rem;
  background-color: rgba(30, 58, 138, 0.4);
  color: #93c5fd;
  border: 1px solid #1e40af;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;

  @media (min-width: 640px) { gap: 0.375rem; padding: 0.375rem 0.75rem; font-size: 0.875rem; }
  &:hover { background-color: rgba(30, 58, 138, 0.5); }
}

.btn-add-seat {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background-color: $border-color;
  color: #d1d5db;
  transition: background-color 0.2s, color 0.2s;
  @include flex-center;
  margin: 0 auto;

  @media (min-width: 640px) { width: 2rem; height: 2rem; }
  &:hover { background-color: #2563eb; color: #ffffff; }
}

/* Calendar */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-icon {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  background-color: $border-color;
  color: #d1d5db;
  transition: background-color 0.2s;
  &:hover { background-color: #555555; }
}

.calendar-title {
  font-weight: 700;
  font-size: 1.125rem;
  color: #ffffff;
}

.calendar-grid-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.25rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.calendar-day-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: $text-muted;
  &.text-red { color: $red-main; }
  &.text-blue { color: $blue-main; }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.25rem;
}

.calendar-day {
  height: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 0.375rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
  color: #d1d5db;

  &.empty { cursor: default; border-color: transparent; }
  &:not(.empty):hover { background-color: $border-color; }
  &.selected { background-color: #2563eb; color: #ffffff; border-color: $blue-dark; }
  &.text-red { color: $red-main; }
  &.text-blue { color: $blue-main; }

  .day-number {
    font-size: 0.875rem;
  }
  &.selected .day-number { font-weight: 700; }
}

.schedule-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  margin-top: 0.25rem;
  background-color: $blue-dark;
}
.calendar-day.selected .schedule-dot { background-color: #ffffff; }

/* Schedule List */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  background-color: $bg-dark;
  border: 1px solid $border-color;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.schedule-info {
  .schedule-datetime {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    
    .date { font-weight: 700; color: #f3f4f6; }
    .time { color: $blue-main; font-weight: 700; }
  }
  .schedule-seat {
    font-size: 0.875rem;
    color: $text-muted;
    span { color: #ffffff; font-weight: 500; }
  }
}

.btn-delete-small {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(127, 29, 29, 0.2);
  color: $red-main;
  border: 1px solid rgba(127, 29, 29, 0.5);
  transition: background-color 0.2s;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover { background-color: rgba(127, 29, 29, 0.4); }
}

.schedule-time-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  .time { color: $blue-main; font-weight: 700; font-size: 1.125rem; }
  .round-badge {
    padding: 0.125rem 0.5rem;
    font-size: 10px;
    font-weight: 700;
    border-radius: 0.25rem;
    background-color: rgba(30, 58, 138, 0.4);
    color: #93c5fd;
    border: 1px solid #1e40af;
  }
}

.cast-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cast-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  
  .role { font-size: 0.75rem; color: $text-dark; }
  .actor {
    display: inline-block;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
}

.schedule-actions {
  margin-top: 0.75rem;
  flex-shrink: 0;

  @media (min-width: 640px) { margin-top: 0; }
}

.btn-add-schedule {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  background-color: $border-color;
  color: #d1d5db;
  transition: background-color 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover { background-color: #2563eb; color: #ffffff; }
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
}

.stat-card {
  background-color: $bg-dark;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid $border-color;
}

.stat-role {
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid $border-color;
  padding-bottom: 0.5rem;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.actor-name { color: #d1d5db; }

.stat-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  cursor: help;
  
  &:hover .tooltip { display: block; }
}

.progress-bg {
  width: 6rem;
  background-color: $border-color;
  border-radius: 9999px;
  height: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  background-color: $blue-dark;
  height: 100%;
  border-radius: 9999px;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.375rem;
  display: none;
  z-index: 10;
  pointer-events: none;
}

.tooltip-content {
  background-color: #000000;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  white-space: nowrap;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #000000;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.stat-count {
  font-weight: 500;
  color: #f3f4f6;
  width: 5rem;
  text-align: right;
}

.pair-stats-section {
  margin-top: 2.5rem;
}

.pair-table {
  width: 100%;
  min-width: max-content;
  font-size: 0.875rem;
  border-collapse: collapse;
  margin-top: 0.75rem;

  @media (min-width: 768px) { width: 66.666667%; }
  @media (min-width: 1024px) { width: 50%; }

  th {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid $border-color;
    background-color: #2c2c2c;
    color: #e5e7eb;
    text-align: center;
  }

  td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid $border-color;
    color: #f3f4f6;
    text-align: center;
  }

  tr {
    transition: background-color 0.2s;
    &:hover { background-color: $bg-card-hover; }
  }

  .mark-cell {
    vertical-align: middle;
    background-color: $bg-dark;
    font-weight: 700;
    border-right: 1px solid $border-color;
    width: 6rem;
  }

  .text-gray { color: $text-dark; }
  .highlight { color: $blue-main; font-weight: 700; }
  .divider { color: $text-dark; margin: 0 0.125rem; }
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: $bg-card;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 24rem;
  border: 1px solid $border-color;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-info {
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: $text-muted;
  background-color: $bg-main;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid $border-color;

  .info-datetime { font-weight: 700; color: #e5e7eb; margin-bottom: 0.25rem; }
  .info-cast { font-size: 0.75rem; }
}

.form-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.form-group {
  flex: 1;

  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: $text-muted;
    margin-bottom: 0.5rem;
  }

  input {
    width: 100%;
    background-color: $bg-main;
    border: 1px solid $border-color;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: #ffffff;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: $blue-dark;
      box-shadow: 0 0 0 1px $blue-dark;
    }
    &.uppercase { text-transform: uppercase; }
  }
}

.modal-actions {
  display: flex;
  gap: 0.75rem;

  button {
    flex: 1;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }
}

.btn-danger {
  background-color: rgba(127, 29, 29, 0.4);
  color: $red-main;
  border: 1px solid rgba(153, 27, 27, 0.5);
  &:hover { background-color: rgba(127, 29, 29, 0.6); }
}

.btn-secondary {
  background-color: $border-color;
  color: #e5e7eb;
  &:hover { background-color: #555555; }
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
  box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.2);
  &:hover { background-color: #1d4ed8; }
}

.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-outline {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: $bg-dark;
  color: #e5e7eb;
  border: 1px solid $border-color;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;

  &:hover { background-color: $bg-card-hover; }
}

/* Dynamic Colors */
.bg-blue-700 { background-color: #1d4ed8; color: #ffffff; }
.bg-indigo-800 { background-color: #3730a3; color: #ffffff; }
.bg-sky-600 { background-color: #0284c7; color: #ffffff; }
.bg-cyan-800 { background-color: #155e75; color: #ffffff; }
.bg-green-700 { background-color: #15803d; color: #ffffff; }
.bg-teal-800 { background-color: #115e59; color: #ffffff; }
.bg-emerald-600 { background-color: #059669; color: #ffffff; }
.bg-lime-800 { background-color: #3f6212; color: #ffffff; }
.bg-\\[\\#444444\\] { background-color: #444444; color: #d1d5db; }
.bg-\\[\\#555555\\] { background-color: #555555; color: #e5e7eb; }
</style>
`;

fs.writeFileSync('src/App.vue', scriptContent + "\n\n" + newTemplateAndStyle, 'utf8');
console.log("Successfully refactored App.vue");
