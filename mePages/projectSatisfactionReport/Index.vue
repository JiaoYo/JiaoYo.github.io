<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page">
      <wd-navbar left-arrow title="满意度报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />
      
      <view class="filter-area" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
        <!-- 月份范围选择器 -->
        <view class="date-range-wrap">
          <view class="month-picker-item">
            <text class="picker-label">开始月份</text>
            <wd-datetime-picker
              type="year-month"
              v-model="selectStartMonth"
              :max-date="maxDate"
              @confirm="handleConfirmStartMonth"
            />
          </view>
          <text class="range-separator">至</text>
          <view class="month-picker-item">
            <text class="picker-label">结束月份</text>
            <wd-datetime-picker
              type="year-month"
              v-model="selectEndMonth"
              :min-date="selectStartMonth"
              :max-date="maxDate"
              @confirm="handleConfirmEndMonth"
            />
          </view>
          <view class="filter-right">
            <wd-button size="small" type="primary" class="search-btn-text" @click="handleSearch">查询</wd-button>
            <wd-icon name="search" size="20px" color="#1677ff" class="search-btn-icon" @click="handleSearch" />
          </view>
        </view>

        <!-- 调查类型筛选：1 个人、2 小组，不选查全部 -->
        <view class="type-filter-row">
          <wd-picker
            clearable
            label="调查类型"
            label-width="140rpx"
            align-right
            :columns="typeColumns"
            v-model="typeValue"
            placeholder="全部类型"
            @confirm="handleSearch"
            @clear="handleSearch"
          />
        </view>

      </view>
      <scroll-view
        :scroll-y="true"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        class="content-scroll"
      >
        <view class="content-inner">
          <!-- 统计卡片 -->
          <view class="stat-cards">
            <view class="stat-card" :style="{ background: cardBg }">
              <view class="stat-icon" :style="{ background: 'rgba(45, 140, 240, 0.1)', color: '#2d8cf0' }">
                <wd-icon name="user" size="22px" />
              </view>
              <view class="stat-info">
                <text class="stat-label">调查人数</text>
                <text class="stat-value">{{ totalSurveyors }}</text>
              </view>
            </view>

            <view class="stat-card" :style="{ background: cardBg }">
              <view class="stat-icon" :style="{ background: 'rgba(146, 84, 222, 0.1)', color: '#9254de' }">
                <wd-icon name="user" size="22px" />
              </view>
              <view class="stat-info">
                <text class="stat-label">参评总人次</text>
                <text class="stat-value">{{ totalEvaluators }}</text>
              </view>
            </view>

            <view class="stat-card" :style="{ background: cardBg }">
              <view class="stat-icon" :style="{ background: 'rgba(24, 160, 88, 0.1)', color: '#18a058' }">
                <wd-icon name="star" size="22px" />
              </view>
              <view class="stat-info">
                <text class="stat-label">平均综合评分</text>
                <view class="stat-score">
                  <text class="stat-value" :style="{ color: avgOverall !== null ? scoreColor(avgOverall) : subColor }">
                    {{ avgOverall !== null ? avgOverall.toFixed(2) : '-' }}
                  </text>
                  <view v-if="avgOverall !== null" class="score-tag" :style="scoreTagStyle(avgOverall)">
                    {{ avgOverallLevel.text }}
                  </view>
                </view>
              </view>
            </view>

            <view class="stat-card" :style="{ background: cardBg }">
              <view class="stat-icon" :style="{ background: 'rgba(250, 173, 20, 0.12)', color: '#faad14' }">
                <wd-icon name="thumb-up" size="22px" />
              </view>
              <view class="stat-info">
                <text class="stat-label">满意及以上占比</text>
                <text class="stat-value" :style="{ color: satisfiedRatio !== null && satisfiedRatio < 80 ? '#f0a020' : '' }">
                  {{ satisfiedRatio !== null ? satisfiedRatio + '%' : '-' }}
                </text>
              </view>
            </view>
          </view>

          <!-- 满意度分布 -->
          <view class="section" :style="{ background: cardBg }">
            <view class="section-header">
              <wd-icon name="chart" size="16px" color="#18a058" />
              <text class="section-title">满意度分布</text>
              <text class="section-subtitle">{{ formatMonthLabel(searchParams.startMonth) }} ~ {{ formatMonthLabel(searchParams.endMonth) }}</text>
            </view>
            <view class="dist-legend">
              <view v-for="item in distList" :key="item.key" class="legend-item">
                <view class="legend-dot" :style="{ background: item.color }" />
                <text class="legend-label">{{ item.label }}</text>
                <text class="legend-value">{{ item.value }} 人</text>
                <text class="legend-percent">{{ item.percent }}%</text>
              </view>
            </view>
          </view>

          <!-- 按月汇总表 -->
          <view class="section" :style="{ background: cardBg }">
            <view class="section-header">
              <wd-icon name="calendar" size="16px" color="#18a058" />
              <text class="section-title">满意度汇总（按月）</text>
            </view>
            <view v-if="reportData.summary && reportData.summary.length > 0" class="table-wrapper">
              <view class="table-header">
                <text class="th" style="width: 90px">调查人</text>
                <text class="th" style="width: 52px">类型</text>
                <text class="th" style="width: 80px">月份</text>
                <text class="th" style="width: 60px">参评数</text>
                <text class="th" style="flex: 1">评分</text>
              </view>
              <view v-for="(row, idx) in reportData.summary" :key="idx" class="table-row">
                <text class="td" style="width: 90px; font-weight: 600" :class="{ 'td-ellipsis': true }">{{ row.surveyName || '-' }}</text>
                <text class="td" style="width: 52px">
                  <text class="type-tag" :style="row.surveyType === 2 ? 'color:#d48806;background:rgba(250,173,20,.12)' : 'color:#1677ff;background:rgba(22,119,255,.08)'">
                    {{ row.surveyType === 2 ? '小组' : '个人' }}
                  </text>
                </text>
                <text class="td" style="width: 80px">{{ formatMonthLabel(row.surveyMonth) }}</text>
                <text class="td" style="width: 60px">{{ row.evaluatorCount || 0 }}</text>
                <text class="td" style="flex: 1; color: #18a058; font-weight: 600">
                  {{ row.avgOverallScore ? Number(row.avgOverallScore).toFixed(2) : '-' }}
                </text>
              </view>
            </view>
            <view v-else class="empty-section">暂无数据</view>
          </view>

          <!-- 区间总计 -->
          <view class="section" :style="{ background: cardBg }">
            <view class="section-header">
              <wd-icon name="calendar" size="16px" color="#18a058" />
              <text class="section-title">满意度汇总（区间总计平均值）</text>
            </view>
            <view v-if="reportData.intervalTotal && reportData.intervalTotal.length > 0" class="table-wrapper">
              <view class="table-header">
                <text class="th" style="width: 80px">调查人</text>
                <text class="th" style="width: 52px">类型</text>
                <text class="th" style="width: 70px">总人次</text>
                <text class="th" style="flex: 1">评分</text>
              </view>
              <view v-for="(row, idx) in reportData.intervalTotal" :key="idx" class="table-row">
                <text class="td td-ellipsis" style="width: 80px; font-weight: 600">{{ row.surveyName || '-' }}</text>
                <text class="td" style="width: 52px">
                  <text class="type-tag" :style="row.surveyType === 2 ? 'color:#d48806;background:rgba(250,173,20,.12)' : 'color:#1677ff;background:rgba(22,119,255,.08)'">
                    {{ row.surveyType === 2 ? '小组' : '个人' }}
                  </text>
                </text>
                <text class="td" style="width: 70px">{{ row.evaluatorCount || 0 }}</text>
                <text class="td" style="flex: 1; color: #18a058; font-weight: 600">
                  {{ row.avgOverallScore ? Number(row.avgOverallScore).toFixed(2) : '-' }}
                </text>
              </view>
            </view>
            <view v-else class="empty-section">暂无数据</view>
          </view>

          <!-- 评价明细矩阵 -->
          <view class="section" :style="{ background: cardBg }">
            <view class="section-header">
              <wd-icon name="calendar" size="16px" color="#18a058" />
              <text class="section-title">评价明细矩阵</text>
            </view>
            <view v-if="reportData.matrix && reportData.matrix.length > 0">
              <view
                v-for="(row, idx) in reportData.matrix"
                :key="`${row.surveyType || 1}_${row.surveyId}`"
                class="matrix-item"
                @click="toggleExpand(idx)"
              >
                <view class="matrix-header">
                  <view class="matrix-left">
                    <wd-icon :name="expandedIndex === idx ? 'arrow-down' : 'arrow-right'" size="14px" :color="subColor" />
                    <text class="matrix-name">{{ row.surveyName || '-' }}</text>
                    <text
                      class="type-tag"
                      :style="row.surveyType === 2 ? 'color:#d48806;background:rgba(250,173,20,.12)' : 'color:#1677ff;background:rgba(22,119,255,.08)'"
                    >
                      {{ row.surveyType === 2 ? '小组' : '个人' }}
                    </text>
                  </view>
                  <view class="matrix-right">
                    <text class="matrix-count">参评 {{ row.scores ? row.scores.length : 0 }} 次</text>
                    <text class="matrix-avg">
                      均分
                      <span :style="{ color: scoreColor(calcMatrixAvg(row.scores)), fontWeight: 600 }">
                        {{ calcMatrixAvg(row.scores) ? calcMatrixAvg(row.scores).toFixed(2) : "-" }}
                      </span>
                    </text>
                  </view>
                </view>
                <view v-if="expandedIndex === idx && row.scores && row.scores.length > 0" class="matrix-detail">
                  <view v-for="(score, sIdx) in row.scores" :key="sIdx" class="detail-row">
                    <text class="detail-text">{{ score.createrName || '-' }}</text>
                    <text class="detail-text">{{ formatMonthLabel(score.surveyMonth) }}</text>
                    <text class="detail-text">{{ score.surveyDate || '-' }}</text>
                    <text class="detail-score" :style="{ color: scoreColor(score.overallScore) }">
                      {{ score.overallScore ? Number(score.overallScore).toFixed(2) : '-' }}
                    </text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="empty-section">暂无数据</view>
          </view>

          <view class="bottom-space" />
        </view>
      </scroll-view>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import { getSystemDate } from '@/utils/index'
import { fetchGetProjectSatisfactReport } from '@/service/projectSatisfaction'

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const subColor = computed(() => isDark.value ? '#8e8e93' : '#6b7280')
const cardBg = computed(() => isDark.value ? '#2a2a2a' : '#ffffff')

function handleBack() {
  // #ifdef H5
  history.go(-1)
  // #endif
  // #ifndef H5
  uni.navigateBack()
  // #endif
}

function currentMonthNum() {
  const d = new Date()
  return d.getFullYear() * 100 + d.getMonth() + 1
}

function formatMonthLabel(month: string | number) {
  if (!month) return '-'
  const s = String(month)
  return s.length === 6 ? s.slice(0, 4) + '-' + s.slice(4, 6) : String(month)
}

function scoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) return '#999'
  const s = Number(score)
  if (s >= 4.5) return '#18a058'
  if (s >= 3.5) return '#18a058'
  if (s >= 2.5) return '#faad14'
  if (s >= 1.5) return '#fa8c16'
  return '#f5222d'
}

function scoreTagStyle(score: number | null | undefined) {
  const level = scoreLevel(score)
  const colors: Record<string, string> = {
    '非常满意': 'background: rgba(24,160,88,.15); color: #18a058;',
    '满意': 'background: rgba(24,160,88,.15); color: #18a058;',
    '一般': 'background: rgba(250,173,20,.15); color: #faad14;',
    '不满意': 'background: rgba(250,173,20,.15); color: #fa8c16;',
    '非常不满意': 'background: rgba(245,34,45,.15); color: #f5222d;',
  }
  return colors[level.text] || colors['一般']
}

function scoreLevel(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return { text: '-', type: 'default' }
  const s = Number(score)
  if (s >= 4.5) return { text: '非常满意', type: 'success' }
  if (s >= 3.5) return { text: '满意', type: 'success' }
  if (s >= 2.5) return { text: '一般', type: 'warning' }
  if (s >= 1.5) return { text: '不满意', type: 'warning' }
  return { text: '非常不满意', type: 'error' }
}

// 查询参数
const searchParams = reactive({
  startMonth: currentMonthNum(),
  endMonth: currentMonthNum()
})

// 调查类型筛选：1 个人、2 小组，不选查全部
const typeColumns = [
  { label: '个人', value: 1 },
  { label: '小组', value: 2 },
]
const typeValue = ref<any>([])

function pickerSurveyType() {
  if (Array.isArray(typeValue.value)) return typeValue.value.length > 0 ? typeValue.value[0] : undefined
  return typeValue.value === null || typeValue.value === undefined || typeValue.value === '' ? undefined : typeValue.value
}

// 月份选择器 - 使用时间戳
const now = new Date()
const selectStartMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1).getTime())
const selectEndMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1).getTime())
// 最大可选日期：本月最后一天
const maxDate = ref(new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime())

function timestampToMonth(ts: number) {
  const d = new Date(ts)
  return d.getFullYear() * 100 + d.getMonth() + 1
}

function handleConfirmStartMonth({ value }: { value: number }) {
  selectStartMonth.value = value
  searchParams.startMonth = timestampToMonth(value)
}

function handleConfirmEndMonth({ value }: { value: number }) {
  selectEndMonth.value = value
  searchParams.endMonth = timestampToMonth(value)
}

// 报表数据
const reportData = ref<any>({})
const refreshing = ref(false)
const expandedIndex = ref<number | null>(null)

async function fetchReport() {
  try {
    const queryData: any = {}
      queryData.startMonth = searchParams.startMonth
      queryData.endMonth = searchParams.endMonth
    const stype = pickerSurveyType()
    if (stype !== undefined) queryData.surveyType = stype
    const data: any = await fetchGetProjectSatisfactReport(queryData)
    if (data) {
      reportData.value = data || {}
    }
  } catch (e) {
    console.error('获取报表数据失败', e)
  }
}

function handleSearch() {
  fetchReport()
}

function onRefresh() {
  refreshing.value = true
  fetchReport().finally(() => {
    refreshing.value = false
  })
}

function toggleExpand(idx: number) {
  expandedIndex.value = expandedIndex.value === idx ? null : idx
}

// 统计指标
const totalSurveyors = computed(() => (reportData.value.intervalTotal || []).length)

const totalEvaluators = computed(() =>
  (reportData.value.intervalTotal || []).reduce((sum: number, r: any) => sum + Number(r.evaluatorCount || 0), 0)
)

const avgOverall = computed(() => {
  const list = reportData.value.intervalTotal || []
  const count = list.reduce((sum: number, r: any) => sum + Number(r.evaluatorCount || 0), 0)
  if (!count) return null
  const weighted = list.reduce((sum: number, r: any) =>
    sum + Number(r.avgOverallScore || 0) * Number(r.evaluatorCount || 0), 0)
  return Number((weighted / count).toFixed(2))
})

const avgOverallLevel = computed(() => scoreLevel(avgOverall.value))

const satisfiedRatio = computed(() => {
  const list = reportData.value.intervalTotal || []
  const count = list.reduce((sum: number, r: any) => sum + Number(r.evaluatorCount || 0), 0)
  if (!count) return null
  const satisfied = list.reduce((sum: number, r: any) =>
    sum + Number(r.verySatisfied || 0) + Number(r.satisfied || 0), 0)
  return Number(((satisfied / count) * 100).toFixed(1))
})

// 满意度分布
const DIST_CONFIG = [
  { key: 'verySatisfied', label: '非常满意', color: '#18a058' },
  { key: 'satisfied', label: '满意', color: '#73d13d' },
  { key: 'normal', label: '一般', color: '#faad14' },
  { key: 'unsatisfied', label: '不满意', color: '#ff7a45' },
  { key: 'veryUnsatisfied', label: '非常不满意', color: '#e02d2d' }
]

const distList = computed(() => {
  const list = reportData.value.intervalTotal || []
  const items = DIST_CONFIG.map(d => ({
    ...d,
    value: list.reduce((sum: number, r: any) => sum + Number(r[d.key] || 0), 0)
  }))
  const total = items.reduce((sum: number, item: any) => sum + item.value, 0) || 1
  return items.map((item: any) => ({
    ...item,
    percent: Number(((item.value / total) * 100).toFixed(1))
  }))
})

function calcMatrixAvg(scores: any[]) {
  if (!scores || scores.length === 0) return null
  const total = scores.reduce((sum: number, s: any) => sum + Number(s.overallScore || 0), 0)
  return Number((total / scores.length).toFixed(2))
}

onMounted(() => {
  fetchReport()
})
</script>

<style lang="scss" scoped>
:deep(.wd-cell__wrapper){
  padding: 2rpx 15rpx !important;
}
:deep(.wd-cell){
  padding-left:0px !important;
}
.page {
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.filter-area {
  flex-shrink: 0;
  padding: 20rpx 20rpx 0 20rpx;
}

.date-range-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.month-picker-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.picker-label {
  font-size: 24rpx;
  color: #64748b;
  white-space: nowrap;
}

.date-range-wrap.dark {
  .picker-label {
    color: #8e8e93;
  }
}

.month-range {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.month-picker {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  border: 1rpx solid rgba(128, 128, 128, 0.15);
  flex: 1;
  min-width: 120rpx;
  justify-content: space-between;
}

.month-picker .label {
  font-size: 24rpx;
  color: #64748b;
}

.month-picker .picker-value {
  font-size: 28rpx;
  color: #1f2937;
  font-weight: 500;
}

.range-separator {
  color: #999;
  font-size: 26rpx;
}

.filter-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.search-btn-text {
  flex-shrink: 0;
}

.search-btn-icon {
  display: none;
  padding: 8rpx;
}

@media screen and (max-width: 600px) {
  .search-btn-text {
    display: none;
  }
  .search-btn-icon {
    display: flex;
  }
}

.content-scroll {
  flex: 1;
  min-height: 0;
}

.content-inner {
  padding: 20rpx;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;
}

.stat-card:active {
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 84rpx;
  height: 84rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1;
}

.stat-score {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.score-tag {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 500;
}

.section {
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
}

.section-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-left: 12rpx;
}

.dist-bar {
  display: flex;
  height: 28rpx;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.dist-segment {
  height: 100%;
  transition: width 0.3s;
}

.dist-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx 32rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
}

.legend-label {
  font-size: 26rpx;
  color: #64748b;
}

.legend-value {
  font-size: 26rpx;
  font-weight: 600;
}

.legend-percent {
  font-size: 24rpx;
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

.type-filter-row {
  margin-top: 8rpx;
}

.type-tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  line-height: 1.4;
  white-space: nowrap;
}

.td-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.empty-section {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}

.matrix-item {
  border-radius: 12rpx;
  border: 1rpx solid rgba(128, 128, 128, 0.15);
  margin-bottom: 16rpx;
  overflow: hidden;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f8fafc;
}

.matrix-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.matrix-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.matrix-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.matrix-count {
  font-size: 24rpx;
  color: #64748b;
}

.matrix-avg {
  font-size: 24rpx;
  color: #64748b;
}

.matrix-detail {
  border-top: 1rpx solid rgba(128, 128, 128, 0.1);
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid rgba(128, 128, 128, 0.08);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-text {
  flex: 1;
  font-size: 24rpx;
  color: #64748b;
  text-align: center;
}

.detail-score {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
}

.bottom-space {
  height: 100rpx;
}

/* 暗黑模式适配 */
.wot-theme-dark {
  :deep(.wd-datetime-picker) {
    background: transparent !important;
  }
  :deep(.wd-datetime-picker__cell) {
    background: transparent !important;
  }
  :deep(.wd-cell-group) {
    background: transparent !important;
  }
  :deep(.wd-cell-group__body) {
    background: transparent !important;
  }
  :deep(.wd-cell) {
    background: transparent !important;
  }
  :deep(.wd-input) {
    background: transparent !important;
  }
  .month-picker {
    background: #2a2a2a;
    border: 1rpx solid rgba(128, 128, 128, 0.3);
  }
  .month-picker .label {
    color: #8e8e93;
  }
  .month-picker .picker-value {
    color: #ffffff;
  }
  .table-header {
    background: #3a3a3a;
  }
  .th {
    color: #8e8e93;
  }
  .table-row {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  .td {
    color: #ffffff;
  }
  .matrix-header {
    background: #3a3a3a;
  }
  .matrix-name {
    color: #ffffff;
  }
  .matrix-count,
  .matrix-avg {
    color: #8e8e93;
  }
  .detail-row {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  .detail-text {
    color: #8e8e93;
  }
}

:deep(.wd-datetime-picker__cell) {
  .wd-cell__wrapper {
    padding-right: 0 !important;
  }
}
</style>