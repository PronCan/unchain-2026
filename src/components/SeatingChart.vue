<script setup>
import { computed } from 'vue'

const props = defineProps({
  seatCounts: {
    type: Object,
    default: () => ({})
  }
})

const SEAT_LAYOUT_YES24_2 = [
  { row: 'A', groups: [[1, 3], [4, 14], [15, 18]] },
  { row: 'B', groups: [[1, 4], [5, 16], [17, 20]] },
  { row: 'C', groups: [[1, 4], [5, 15], [16, 19]] },
  { row: 'D', groups: [[1, 4], [5, 16], [17, 20]] },
  { row: 'E', groups: [[1, 4], [5, 15], [16, 19]] },
  { row: 'F', groups: [[1, 4], [5, 16], [17, 20]] },
  { row: 'G', groups: [[1, 4], [5, 16], [17, 20]] },
  { row: 'H', groups: [[1, 4], [5, 16], [17, 20]] },
  { row: 'I', groups: [[1, 4], [5, 16], [17, 20]] },
  { row: 'J', groups: [[1, 15], [16, 19]] },
  { row: 'K', groups: [[1, 7], [8, 10], [11, 14]] },
  { row: 'L', groups: [[1, 8], [9, 17]] },
  { row: 'M', groups: [[1, 17]] },
  { row: 'N', groups: [[1, 16]] },
  { row: 'O', groups: [[1, 18]] },
]

const getRowLabelStyle = (rowId) => {
  switch (rowId) {
    case 'A': return { marginRight: '10px' }
    case 'J': return { marginRight: '42px' }
    case 'K': return { marginRight: '35px' }
    default: return {}
  }
}

const getBlockStyle = (rowId, gIdx) => {
  if (rowId === 'K' && gIdx === 0) {
    return { right: '15px', position: 'relative' }
  }
  return {}
}

const getAisleStyle = (rowId, gIdx) => {
  switch (rowId) {
    case 'A':
    case 'C':
    case 'E':
      return { width: '28px' }
    case 'K':
      return gIdx === 0 ? { width: '122px' } : {}
    case 'L':
      return gIdx === 0 ? { width: '100px' } : {}
    default:
      return {}
  }
}

const generateSeats = (start, end) => {
  const step = start <= end ? 1 : -1
  const length = Math.abs(end - start) + 1
  return Array.from({ length }, (_, i) => start + i * step)
}

const getSeatStyle = (row, num) => {
  const count = props.seatCounts[`${row}-${num}`] || 0
  
  if (count === 0) {
    return {} // Default style defined in CSS
  } else if (count === 1) {
    return {
      background: '#1e3a8a', // blue-900
      borderColor: '#3b82f6', // blue-500
      color: '#bfdbfe', // blue-200
    }
  } else if (count === 2) {
    return {
      background: '#2563eb', // blue-500
      borderColor: '#60a5fa', // blue-400
      color: '#ffffff',
      fontWeight: '900'
    }
  } else {
    return {
      background: '#3b82f6', // blue-500
      borderColor: '#93c5fd', // blue-300
      color: '#ffffff',
      fontWeight: '900',
      boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)'
    }
  }
}
</script>

<template>
  <div class="seating-chart-card">
    <h2 class="card-title">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      예스24 스테이지 2관 좌석 배치도
    </h2>
    
    <p class="mobile-scroll-hint">👆 좌우로 스크롤하여 전체 좌석을 확인하세요</p>
    
    <div class="chart-scroll-container">
      <div class="hm-outer" style="--hm-seat: 20px; --hm-gap: 3px; --hm-lbl: 20px; --hm-aisle: 16px; --hm-font: 8px;">
        <div class="hm-inner">
          <div class="hm-stage-bar">S T A G E</div>
          <div class="hm-stage-foot"></div>
          
          <template v-for="row in SEAT_LAYOUT_YES24_2" :key="row.row">
            <div class="hm-row" style="position: relative;">
              <div class="hm-lbl" :style="getRowLabelStyle(row.row)">{{ row.row }}</div>
              <div v-if="row.row === 'A'" class="hm-center-aisle"></div>
              
              <template v-for="(group, gIdx) in row.groups" :key="gIdx">
                <div class="hm-block" :style="getBlockStyle(row.row, gIdx)">
                  <div style="display: flex; gap: var(--hm-gap, 2px);">
                    <div v-for="num in generateSeats(group[0], group[1])" :key="num" 
                         class="hm-seat"
                         :style="getSeatStyle(row.row, num)">
                      {{ num }}
                      <!-- Custom Tooltip -->
                      <div class="seat-tooltip">
                        <div class="tooltip-content">
                          {{ row.row }}열 {{ num }}번
                          <template v-if="props.seatCounts[`${row.row}-${num}`]">
                            <br/><span class="highlight-text">{{ props.seatCounts[`${row.row}-${num}`] }}회 관람</span>
                          </template>
                        </div>
                        <div class="tooltip-arrow"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="gIdx < row.groups.length - 1" class="hm-center-aisle" :style="getAisleStyle(row.row, gIdx)"></div>
              </template>
            </div>
            <div v-if="row.row === 'L'" class="hm-divider"></div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.seating-chart-card {
  background-color: #333333;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1rem;
  border: 1px solid #444444;
  overflow: hidden;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    margin-bottom: 1.5rem;
  }
}

.icon-blue {
  height: 1.25rem;
  width: 1.25rem;
  color: #60a5fa;
}

.mobile-scroll-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 1rem;
  text-align: center;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @media (min-width: 768px) {
    display: none;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

.chart-scroll-container {
  overflow-x: auto;
  padding-bottom: 1rem;
  display: flex;

  @media (min-width: 768px) {
    justify-content: center;
  }
}

.hm-outer {
  background: #2a2a2a;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  display: inline-block;
}
.hm-inner {
  min-width: max-content;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hm-stage-bar {
  width: 100%;
  height: 24px;
  background: #444444;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #9ca3af;
  letter-spacing: 4px;
  margin-bottom: 4px;
}
.hm-stage-foot {
  width: 80%;
  height: 4px;
  background: #555555;
  border-radius: 0 0 4px 4px;
  margin-bottom: 24px;
}
.hm-row {
  display: flex;
  align-items: center;
  margin-bottom: var(--hm-gap, 2px);
}
.hm-lbl {
  width: var(--hm-lbl, 18px);
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-align: center;
  margin-right: 4px;
}
.hm-block {
  display: flex;
}
.hm-center-aisle {
  width: var(--hm-aisle, 14px);
}
.hm-seat {
  width: var(--hm-seat, 16px);
  height: var(--hm-seat, 16px);
  border-radius: 4px 4px 2px 2px;
  border: 1px solid #555555;
  background: #333333;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--hm-font, 6px);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.hm-seat:hover {
  background: #3b82f6;
  border-color: #60a5fa;
  color: #ffffff;
}
.hm-divider {
  height: 1px;
  width: 100%;
  background: #555555;
  margin: 8px 0;
}

/* Tooltip Styles */
.seat-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.375rem;
  display: none;
  z-index: 50;
  pointer-events: none;
}

.hm-seat:hover .seat-tooltip {
  display: block;
}

.tooltip-content {
  background-color: #000000;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 0.25rem;
  padding: 0.375rem 0.625rem;
  white-space: nowrap;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  text-align: center;
  line-height: 1.25;
}

.highlight-text {
  color: #93c5fd;
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
</style>