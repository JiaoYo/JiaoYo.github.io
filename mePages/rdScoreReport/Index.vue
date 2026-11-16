<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page" :class="{ dark: isDark }">
      <wd-navbar left-arrow title="研发积分报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <view class="filter-area" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
        <view class="chips-row">
          <view
            v-for="t in timeOptions"
            :key="t.value"
            class="chip"
            :class="{ active: timeMode === t.value }"
            :style="timeMode === t.value ? '' : { background: isDark ? '#2a2a2a' : '#ffffff' }"
            @click="handleTimeModeChange(t.value)"
          >
            {{ t.label }}
          </view>
          <template v-if="timeMode !== 'all'">
            <view class="step-btn" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }" @click="stepDate(-1)">
              <wd-icon name="arrow-left" size="14px" />
            </view>
            <view class="time-label" @click="showTimePicker = true">{{ timeLabel }}</view>
            <view class="step-btn" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }" @click="stepDate(1)">
              <wd-icon name="arrow-right" size="14px" />
            </view>
          </template>
          <wd-button size="small" type="primary" @click="fetchData">查询</wd-button>
        </view>

        <!-- 人员筛选（调试人员 usertype=5 固定只查自己，隐藏） -->
        <view v-if="!selfOnly" class="user-row">
          <wd-picker
            clearable
            label="人员"
            label-width="140rpx"
            align-right
            :columns="userColumns"
            v-model="userValue"
            placeholder="全部人员"
            @confirm="handleUserConfirm"
            @clear="handleUserClear"
          />
        </view>

        <wd-datetime-picker
          v-if="timeMode !== 'all'"
          v-model="timePickerValue"
          v-model:show="showTimePicker"
          :type="timeMode === 'year' ? 'year' : 'year-month'"
          @confirm="handleTimePickerConfirm"
        />

        <!-- 口径说明 -->
        <view class="rule-tip" :style="{ background: isDark ? '#2a2a2a' : '#ffffff', color: subColor }">
          <text class="rule-icon">ℹ</text>
          <text>{{ ruleTip }}</text>
        </view>
      </view>

      <scroll-view :scroll-y="true" class="content-scroll">
        <view class="content-inner">
          <view class="section" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="section-header">
              <wd-icon name="chart" size="16px" color="#2d8cf0" />
              <text class="section-title">研发积分</text>
              <text class="section-subtitle">{{ scopeText }}</text>
              <view style="flex: 1"></view>
              <wd-button
                v-if="canSettle && timeMode === 'month'"
                size="small"
                type="warning"
                plain
                :loading="settleLoading"
                @click="showSettleModal = true"
              >
                结算该月
              </wd-button>
            </view>

            <!-- 年度透视：人员 × 已结算月份 -->
            <scroll-view v-if="isYearPivot && pivotRows.length" :scroll-x="true" class="pivot-scroll">
              <view class="table-wrapper" :style="{ width: pivotTableWidth + 'px' }">
                <view class="table-header">
                  <text class="th" style="width: 90px">人员</text>
                  <text v-for="m in pivotMonths" :key="m" class="th" style="width: 64px">{{ m }}月</text>
                </view>
                <view v-for="row in pivotRows" :key="String(row.userId)" class="table-row">
                  <text class="td" style="width: 90px; font-weight: 600">{{ row.username || '-' }}</text>
                  <text v-for="m in pivotMonths" :key="m" class="td" style="width: 64px">
                    {{ row.months[m] === undefined ? '-' : fmtScore(row.months[m]) }}
                  </text>
                </view>
              </view>
            </scroll-view>

            <!-- 月度 / 全历史明细 -->
            <view v-else-if="reportData.length" class="table-wrapper">
              <view class="table-header">
                <text class="th" style="width: 90px">人员</text>
                <text v-if="isMonthlyQuery" class="th" style="width: 80px">月份</text>
                <text class="th" style="flex: 1">研发积分</text>
              </view>
              <view v-for="row in reportData" :key="String(row.userId)" class="table-row">
                <text class="td" style="width: 90px; font-weight: 600">{{ row.username || '-' }}</text>
                <text v-if="isMonthlyQuery" class="td" style="width: 80px">{{ row.period || '-' }}</text>
                <text class="td" style="flex: 1; color: #2d8cf0; font-weight: 600">{{ fmtScore(row.totalScore) }}</text>
              </view>
            </view>
            <view v-else class="empty-section" :style="{ color: subColor }">暂无研发积分数据</view>

            <view v-if="isYearPivot && pivotRows.length" class="pivot-tip" :style="{ color: subColor }">
              年度逐人逐月数据，展示各已结算月份的积分明细
            </view>
          </view>

          <view class="bottom-space" />
        </view>
      </scroll-view>

      <!-- 月度结算：选择工时季节 + 二次确认 -->
      <wd-popup
        :z-index="99"
        closable
        :close-on-click-modal="false"
        :model-value="showSettleModal"
        custom-style="width: 86%; border-radius: 32rpx; padding: 24rpx;"
        @update:model-value="showSettleModal = $event"
      >
        <view style="margin-bottom: 20rpx; padding-right: 80rpx;">
          <text class="popup-title" :style="{ color: textColor }">研发积分月度结算</text>
        </view>
        <view class="settle-desc" :style="{ color: subColor }">
          结算将按指定季节的工时规则重新计算并
          <text :style="{ color: '#f0a020', fontWeight: 600 }">覆盖 {{ settleTarget.year }}年{{ String(settleTarget.month).padStart(2, '0') }}月</text>
          的全员积分快照（整月全量执行）。
        </view>
        <view class="settle-seasons">
          <view class="settle-season" :class="{ active: settleSeason === 'summer' }" @click="settleSeason = 'summer'">
            <text class="settle-season-name">夏令时</text>
            <text class="settle-season-time">08:30-12:00、13:30-18:00</text>
          </view>
          <view class="settle-season" :class="{ active: settleSeason === 'winter' }" @click="settleSeason = 'winter'">
            <text class="settle-season-name">冬令时</text>
            <text class="settle-season-time">08:30-12:00、13:00-17:30</text>
          </view>
        </view>
        <view style="display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx;">
          <wd-button size="small" @click="showSettleModal = false">取消</wd-button>
          <wd-button size="small" type="warning" :loading="settleLoading" :disabled="settleLoading" @click="confirmSettle">下一步</wd-button>
        </view>
      </wd-popup>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import { hasPermission } from '@/utils/index'
import { fetchGetRdScoreReport, fetchSettleRdScore } from '@/service/rdScore'
import { fetchGetAllUserDataList } from '@/service/index'

const message = useMessage()
const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

function handleBack() {
  // #ifdef H5
  history.go(-1)
  // #endif
  // #ifndef H5
  uni.navigateBack()
  // #endif
}

/** 调试人员（usertype=5）只能查自己的积分：隐藏人员筛选，userIds 固定为本人 */
const selfOnly = Number(uni.getStorageSync('usertype')) === 5
const ownUserId = String(uni.getStorageSync('userId') || '')

const canSettle = hasPermission('project:rd:settle')

/** 计分规则说明（与后端口径一致，前端不做任何计算） */
const ruleTip =
  '工作日为周一至周六，周日不生成工作时间片；夏令时 08:30-12:00、13:30-18:00，冬令时 08:30-12:00、13:00-17:30；一个工作时间片 1 分钟，每天积分上限 288 分；延期任务只计算至原计划结束日（含当天）。'

/* ---------------- 查询范围：全部 / 年 / 月 ---------------- */
const timeOptions = [
  { label: '全部', value: 'all' },
  { label: '年', value: 'year' },
  { label: '月', value: 'month' },
]

/** 上一个月份 yyyy-MM（本月不可查，默认查上月） */
function initialMonth(): { year: number; month: number } {
  const d = new Date()
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 }
}

const init = initialMonth()
const timeMode = ref<'all' | 'year' | 'month'>('month')
const yearNum = ref(init.year)
const monthNum = ref(init.month) // 1~12
const showTimePicker = ref(false)
const timePickerValue = ref(new Date(init.year, init.month - 1, 1).getTime())

const timeLabel = computed(() => (timeMode.value === 'year' ? `${yearNum.value}年` : `${yearNum.value}-${String(monthNum.value).padStart(2, '0')}`))

/** 月序号（年*12+月），用于比较月份先后 */
function monthIndex(y: number, m: number) {
  return y * 12 + m
}

function handleTimeModeChange(mode: 'all' | 'year' | 'month') {
  if (timeMode.value === mode) return
  timeMode.value = mode
  if (mode === 'year') {
    timePickerValue.value = new Date(yearNum.value, 0, 1).getTime()
  } else if (mode === 'month') {
    timePickerValue.value = new Date(yearNum.value, monthNum.value - 1, 1).getTime()
  }
  fetchData()
}

function handleTimePickerConfirm({ value }: any) {
  const d = new Date(value)
  if (timeMode.value === 'year') {
    yearNum.value = d.getFullYear()
  } else {
    yearNum.value = d.getFullYear()
    monthNum.value = d.getMonth() + 1
  }
  fetchData()
}

/** 步进：月份不能步进到本月及以后 */
function stepDate(step: 1 | -1) {
  if (timeMode.value === 'year') {
    yearNum.value = Number(yearNum.value) + step
  } else if (timeMode.value === 'month') {
    const now = new Date()
    const ni = monthIndex(yearNum.value + Math.floor((monthNum.value - 1 + step) / 12), ((monthNum.value - 1 + step + 12) % 12) + 1)
    if (ni >= monthIndex(now.getFullYear(), now.getMonth() + 1)) {
      uni.showToast({ title: '月份只能查询本月之前', icon: 'none' })
      return
    }
    // monthIndex = y*12 + m（m 为 1~12），解码需先减 1，否则跨年/回显全错（左箭头看似无效）
    yearNum.value = Math.floor((ni - 1) / 12)
    monthNum.value = ((ni - 1) % 12) + 1
  } else {
    return
  }
  fetchData()
}

/* ---------------- 人员筛选 ---------------- */
const userValue = ref<any>([])
const userColumns = ref<any[]>([])

async function loadUserOptions() {
  try {
    const res: any = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '5' })
    const arr = Array.isArray(res) ? res : res?.list || res?.data || []
    const options = (arr || []).filter((u: any) => u && u.username && Number(u.status) === 0).map((u: any) => ({ label: u.username, value: u.id }))
    const exists = options.some((u: any) => String(u.value) === '1024')
    if (!exists) options.unshift({ label: '张豪', value: 1024 })
    userColumns.value = options
  } catch (e) {
    console.error('获取人员列表失败', e)
    userColumns.value = [{ label: '张豪', value: 1024 }]
  }
}

function pickValue(v: any) {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined
  return v === null || v === undefined || v === '' ? undefined : v
}

function handleUserConfirm({ value }: any) {
  const v = pickValue(value)
  userValue.value = v === undefined ? [] : [v]
  fetchData()
}
function handleUserClear() {
  userValue.value = []
  fetchData()
}

/* ---------------- 报表查询 ---------------- */
const reportData = ref<any[]>([])
/** 最近一次成功查询参数快照，用于决定展示形态 */
const lastQuery = ref<{ year?: number; month?: number; userIds?: string }>({})

function buildParams() {
  const params: any = {}
  if (timeMode.value === 'year' || timeMode.value === 'month') params.year = Number(yearNum.value)
  if (timeMode.value === 'month') params.month = Number(monthNum.value)
  const uid = selfOnly ? ownUserId : pickValue(userValue.value)
  if (uid !== undefined) params.userIds = String(uid)
  return params
}

async function fetchData() {
  try {
    const params = buildParams()
    const data: any = await fetchGetRdScoreReport(params)
    lastQuery.value = { ...params }
    reportData.value = data || []
  } catch (e) {
    console.error('获取研发积分报表失败', e)
    reportData.value = []
    uni.showToast({ title: '无数据或未结算', icon: 'none' })
  }
}

/* ---------------- 展示辅助 ---------------- */
function fmtScore(value: any) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  return Number.isNaN(n) ? String(value) : n.toFixed(2)
}

const scopeText = computed(() => {
  const q = lastQuery.value
  let text = '全历史'
  if (q.year) {
    text = `${q.year}年`
    if (q.month) text += `${String(q.month).padStart(2, '0')}月`
  }
  return `${text} · ${q.userIds ? '按人员筛选' : '全部人员'}`
})

/** 月度查询（year+month）返回的行带 period，报表展示月份列 */
const isMonthlyQuery = computed(() => Boolean(lastQuery.value.year && lastQuery.value.month))

/** 年度报表（仅 year）：逐人逐月数据透视为人行 × 月列 */
const isYearPivot = computed(() => Boolean(lastQuery.value.year && !lastQuery.value.month))

const pivotRows = computed(() => {
  if (!isYearPivot.value) return []
  const map = new Map<number, { userId: number; username: string; months: Record<number, number> }>()
  reportData.value.forEach((r: any) => {
    let row = map.get(Number(r.userId))
    if (!row) {
      row = { userId: Number(r.userId), username: r.username, months: {} }
      map.set(Number(r.userId), row)
    }
    const m = r.period ? Number(String(r.period).split('-')[1]) : 0
    if (m >= 1 && m <= 12) row.months[m] = r.totalScore
  })
  return Array.from(map.values())
})

const pivotMonths = computed(() => {
  const set = new Set<number>()
  pivotRows.value.forEach((r) => Object.keys(r.months).forEach((k) => set.add(Number(k))))
  return Array.from(set).sort((a, b) => a - b)
})

const pivotTableWidth = computed(() => 90 + pivotMonths.value.length * 64)

/* ---------------- 月度结算（project:rd:settle） ---------------- */
const showSettleModal = ref(false)
const settleSeason = ref<'summer' | 'winter'>('summer')
const settleLoading = ref(false)
const settleTarget = computed(() => ({ year: Number(yearNum.value), month: Number(monthNum.value) }))

/** 二次确认后执行结算，成功后刷新当前报表 */
function confirmSettle() {
  const { year, month } = settleTarget.value
  if (!year || !month) return
  message
    .confirm({
      msg: `将按${settleSeason.value === 'summer' ? '夏令时' : '冬令时'}工时规则重新计算并覆盖 ${year}年${String(month).padStart(2, '0')}月全员积分快照，该月已有数据会被覆盖，确定继续？`,
      title: '确认结算',
    })
    .then(async () => {
      settleLoading.value = true
      try {
        await fetchSettleRdScore(year, month, settleSeason.value)
        uni.showToast({ title: '结算完成', icon: 'success' })
        showSettleModal.value = false
        fetchData()
      } catch (e) {
        console.error('结算失败', e)
      } finally {
        settleLoading.value = false
      }
    })
    .catch(() => {})
}

onLoad(() => {
  if (selfOnly) userValue.value = [Number(ownUserId)]
  loadUserOptions()
  fetchData()
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.filter-area {
  flex-shrink: 0;
  padding: 16rpx 20rpx;
}
.chips-row {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  align-items: center;
}
.chip {
  flex-shrink: 0;
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #64748b;
  background: #ffffff;
  border: 1rpx solid rgba(128, 128, 128, 0.18);
  transition: all 0.2s;
}
.chip.active {
  color: #ffffff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  font-weight: 600;
}
.step-btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4e5969;
}
.time-label {
  min-width: 160rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #1677ff;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  background: rgba(22, 119, 255, 0.06);
}
.user-row {
  margin-top: 8rpx;
}
.rule-tip {
  margin-top: 16rpx;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  font-size: 22rpx;
  line-height: 1.6;
  display: flex;
  gap: 10rpx;
}
.rule-icon {
  flex-shrink: 0;
}
.content-scroll {
  flex: 1;
  min-height: 0;
}
.content-inner {
  padding: 20rpx;
}
.section {
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
  flex-wrap: wrap;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}
.section-subtitle {
  font-size: 22rpx;
  color: #999;
}
.table-wrapper {
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid rgba(128, 128, 128, 0.1);
}
.table-header {
  display: flex;
  background: #f8fafc;
  padding: 16rpx 20rpx;
}
.th {
  font-size: 24rpx;
  color: #64748b;
  font-weight: 600;
  text-align: center;
}
.table-row {
  display: flex;
  padding: 16rpx 20rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.1);
}
.td {
  font-size: 26rpx;
  color: #1f2937;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pivot-scroll {
  white-space: nowrap;
}
.pivot-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
}
.empty-section {
  text-align: center;
  padding: 60rpx 0;
  font-size: 28rpx;
}
.bottom-space {
  height: 60rpx;
}
.popup-title {
  font-size: 32rpx;
  font-weight: 700;
}
.settle-desc {
  font-size: 26rpx;
  line-height: 1.7;
  margin-bottom: 20rpx;
}
.settle-seasons {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.settle-season {
  border: 2rpx solid rgba(128, 128, 128, 0.2);
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.settle-season.active {
  border-color: #f0a020;
  background: rgba(250, 173, 20, 0.08);
}
.settle-season-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
}
.settle-season-time {
  font-size: 22rpx;
  color: #999;
}

/* ---------------- 暗黑模式 ---------------- */
.page.dark .chip:not(.active) {
  color: #a8b3c0;
}
.page.dark .time-label {
  color: #69b1ff;
  background: rgba(22, 119, 255, 0.16);
}
.page.dark .step-btn {
  color: #a8abb3;
}
.page.dark .section-title {
  color: #e5e5e5;
}
.page.dark .section-subtitle {
  color: #777;
}
.page.dark .table-wrapper {
  border-color: rgba(255, 255, 255, 0.08);
}
.page.dark .table-header {
  background: #383838;
}
.page.dark .th {
  color: #9aa0a8;
}
.page.dark .table-row {
  border-top-color: rgba(255, 255, 255, 0.08);
}
.page.dark .td {
  color: #e5e5e5;
}
.page.dark .settle-season {
  border-color: rgba(255, 255, 255, 0.14);
}
.page.dark .settle-season-name {
  color: #e5e5e5;
}
.page.dark .settle-season-time {
  color: #8e8e93;
}
</style>
