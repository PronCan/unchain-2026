<script setup>
import { computed } from 'vue'

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
    case 'A': return { marginRight: '8px' }
    case 'J': return { marginRight: '34px' }
    case 'K': return { marginRight: '28px' }
    default: return {}
  }
}

const getBlockStyle = (rowId, gIdx) => {
  if (rowId === 'K' && gIdx === 0) {
    return { right: '12px', position: 'relative' }
  }
  return {}
}

const getAisleStyle = (rowId, gIdx) => {
  switch (rowId) {
    case 'A':
    case 'C':
    case 'E':
      return { width: '23px' }
    case 'K':
      return gIdx === 0 ? { width: '98px' } : {}
    case 'L':
      return gIdx === 0 ? { width: '80px' } : {}
    default:
      return {}
  }
}

const generateSeats = (start, end) => {
  const step = start <= end ? 1 : -1
  const length = Math.abs(end - start) + 1
  return Array.from({ length }, (_, i) => start + i * step)
}
</script>

<template>
  <div class="bg-[#333333] rounded-xl shadow-md p-6 border border-[#444444] overflow-hidden">
    <h2 class="text-lg font-bold text-white flex items-center gap-2 mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      예스24 스테이지 2관 좌석 배치도
    </h2>
    
    <div class="overflow-x-auto pb-4 flex justify-center">
      <div class="hm-outer" style="--hm-seat: 16px; --hm-gap: 2px; --hm-lbl: 18px; --hm-aisle: 14px; --hm-font: 6px;">
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
                         :title="`${row.row}열 ${num}번`">
                      {{ num }}
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

<style scoped>
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
</style>