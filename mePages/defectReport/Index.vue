<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page" :class="{ dark: isDark }">
      <wd-navbar left-arrow title="研发质量驾驶舱" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <view class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="filter-head">
          <view class="date-label" @click="openDatePicker">{{ dateLabel }}</view>
          <view style="flex: 1"></view>
          <view class="filter-toggle" :style="{ color: filterCount ? '#2d8cf0' : subColor }" @click="filterExpanded = !filterExpanded">
            <text>筛选</text>
            <text v-if="filterCount" class="f-count">{{ filterCount }}</text>
            <view class="f-arrow" :class="{ open: filterExpanded }">
              <wd-icon name="arrow-down" size="12px" />
            </view>
          </view>
        </view>

        <view v-if="filterExpanded" class="filter-body">
          <!-- 查询日期：年=整年 / 月=单月，‹›步进自动查询 -->
          <view class="f-row">
            <text class="f-label">时间</text>
            <view class="f-controls">
              <view
                v-for="t in dateTypeOptions"
                :key="t.value"
                class="chip"
                :class="{ active: dateType === t.value }"
                :style="dateType === t.value ? '' : { background: isDark ? '#383838' : '#f5f6f8' }"
                @click="handleDateTypeChange(t.value)"
              >
                {{ t.label }}
              </view>
              <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepDate(-1)">
                <wd-icon name="arrow-left" size="14px" />
              </view>
              <view class="date-label small" @click="openDatePicker">{{ dateLabel }}</view>
              <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepDate(1)">
                <wd-icon name="arrow-right" size="14px" />
              </view>
            </view>
          </view>

          <!-- 产品筛选：多选选择框，确认即查询 -->
          <view class="select-box" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
            <wd-select-picker
              v-model="projectIds"
              type="checkbox"
              :columns="projectOptions"
              label="产品"
              label-width="100rpx"
              placeholder="全部产品"
              clearable
              title="选择产品"
              @confirm="reSearch"
              @clear="reSearch"
            />
          </view>

          <!-- 人员筛选：缺陷责任人（usertype=5）多选选择框 -->
          <view class="select-box" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
            <wd-select-picker
              v-model="userIds"
              type="checkbox"
              :columns="userOptions"
              label="人员"
              label-width="100rpx"
              placeholder="全部责任人"
              clearable
              title="选择人员"
              @confirm="reSearch"
              @clear="reSearch"
            />
          </view>

          <!-- 优先级：单选，再点取消 -->
          <view class="f-row">
            <text class="f-label">优先级</text>
            <view class="f-controls">
              <view
                v-for="p in priorityOptions"
                :key="p.value"
                class="chip"
                :class="{ active: priority === p.value }"
                :style="priority === p.value ? '' : { background: isDark ? '#383838' : '#f5f6f8' }"
                @click="togglePriority(p.value)"
              >
                {{ p.label }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 年/月选择器（无 show prop，弹层通过暴露的 open() 打开；自带 cell 隐藏） -->
      <wd-datetime-picker
        ref="datePickerRef"
        v-model="datePickerValue"
        :type="dateType === 'year' ? 'year' : 'year-month'"
        title="选择日期"
        @confirm="handleDateConfirm"
      />

      <!-- 口径说明弹框 -->
      <wd-popup closable v-model="tipShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="tip-sheet" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="tip-head">
            <text class="tip-title" :style="{ color: textColor }">口径说明</text>
          </view>
          <scroll-view :scroll-y="true" class="tip-body">
            <view class="tip-item">
              <text class="tip-label">统计期</text>
              <text class="tip-value" :style="{ color: textColor }">{{ periodText }}</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">数据截止</text>
              <text class="tip-value" :style="{ color: textColor }">{{ dashboard?.dataAsOf || '-' }}</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">统计范围</text>
              <text class="tip-value" :style="{ color: textColor }">{{ dashboard?.scope || '-' }}</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">指标定义</text>
              <text class="tip-value" :style="{ color: textColor }">{{ dashboard?.metricDefinition || '-' }}</text>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <scroll-view :scroll-y="true" class="content-scroll">
        <view class="content-inner">
          <!-- 顶部指标卡 -->
          <view class="kpi-grid">
            <view v-for="k in kpis" :key="k.label" class="kpi-card" :style="{ background: k.bg }">
              <view class="kpi-label" :style="{ color: subColor }">{{ k.label }}</view>
              <view class="kpi-value" :style="{ color: k.color }">{{ k.value }}</view>
            </view>
          </view>

          <!-- 缺陷收敛趋势 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #2d8cf0"></view>
              <text class="card-title" :style="{ color: textColor }">缺陷收敛趋势</text>
              <view style="flex: 1"></view>
              <view class="info-link" :style="{ color: '#2d8cf0' }" @click="tipShow = true">口径说明</view>
            </view>
            <l-echart v-if="!chartFailed" ref="trendRef" lStyle="height: 440rpx; width: 100%;" />
            <view v-else class="chart-fallback" :style="{ color: subColor }">图表加载失败，数据请参考下方指标</view>
          </view>

          <!-- 流程状态分布：环形图 + 自绘图例 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #2d8cf0"></view>
              <text class="card-title" :style="{ color: textColor }">流程状态分布</text>
            </view>
            <view v-if="!chartFailed" class="status-chart-wrap">
              <l-echart ref="statusRef" lStyle="height: 440rpx; width: 100%;" />
              <view class="status-center">
                <text class="sc-label" :style="{ color: subColor }">未关闭缺陷</text>
                <text class="sc-num" :style="{ color: textColor }">{{ statusCenter.unclosed }}</text>
                <text class="sc-total" :style="{ color: subColor }">共 {{ statusCenter.total }} 个</text>
              </view>
            </view>
            <view v-else class="chart-fallback" :style="{ color: subColor }">图表加载失败</view>
            <view class="legend-grid">
              <view v-for="s in statusLegend" :key="s.name" class="legend-item">
                <view class="legend-dot" :style="{ background: s.color }"></view>
                <text class="legend-name" :style="{ color: textColor }">{{ s.name }}</text>
                <text class="legend-count" :style="{ color: subColor }">{{ s.count }}（{{ s.pct }}）</text>
              </view>
            </view>
          </view>

          <!-- 产品质量洞察 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #2d8cf0"></view>
              <text class="card-title" :style="{ color: textColor }">产品质量洞察</text>
            </view>
            <view v-if="productQuality.length" class="pq-list">
              <view v-for="row in productQuality" :key="String(row.projectId)" class="pq-card" :style="{ background: isDark ? '#333333' : '#fafbfc' }">
                <view class="pq-head">
                  <text class="pq-name" :style="{ color: textColor }">{{ row.productName || '-' }}</text>
                  <text class="pq-count">{{ fmtNum(row.defectCount) }} 缺陷</text>
                </view>
                <view class="pq-grid">
                  <view class="pq-cell">
                    <text class="pq-label" :style="{ color: subColor }">未关闭</text>
                    <text class="pq-value" :style="{ color: Number(row.unclosedCount) > 0 ? '#faad14' : textColor, fontWeight: Number(row.unclosedCount) > 0 ? 700 : 500 }">
                      {{ fmtNum(row.unclosedCount) }}
                    </text>
                  </view>
                  <view class="pq-cell">
                    <text class="pq-label" :style="{ color: subColor }">平均处理时长</text>
                    <text class="pq-value" :style="{ color: textColor }">{{ fmtHours(row.averageProcessingHours) }}</text>
                  </view>
                  <view class="pq-cell">
                    <text class="pq-label" :style="{ color: subColor }">重开率</text>
                    <text class="pq-value" :style="{ color: Number(row.reopenRate) > 0 ? '#f5222d' : textColor, fontWeight: Number(row.reopenRate) > 0 ? 700 : 500 }">
                      {{ fmtPct(row.reopenRate) }}
                    </text>
                  </view>
                </view>
                <view class="pq-bar-row">
                  <text class="pq-label" :style="{ color: subColor }">首次通过率</text>
                  <view class="pq-track" :style="{ background: isDark ? '#4a4a4a' : '#eef1f6' }">
                    <view class="pq-fill" :style="{ width: passWidth(row.firstTestPassRate) }"></view>
                  </view>
                  <text class="pq-pct" style="color: #18a058">{{ fmtPct(row.firstTestPassRate) }}</text>
                </view>
              </view>
            </view>
            <view v-else class="card-empty" :style="{ color: subColor }">暂无产品数据</view>
          </view>

          <!-- 团队效能分析 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #2d8cf0"></view>
              <text class="card-title" :style="{ color: textColor }">团队效能分析</text>
            </view>
            <view v-if="teamEfficiency.length" class="pq-list">
              <view v-for="row in teamEfficiency" :key="String(row.userId)" class="pq-card" :style="{ background: isDark ? '#333333' : '#fafbfc' }">
                <view class="pq-head">
                  <text class="pq-name" :style="{ color: textColor }">{{ row.userName || '-' }}</text>
                  <text
                    v-if="row.reworkRate == null"
                    class="pq-count"
                    :style="{ color: '#999', background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(128,128,128,.1)' }"
                  >
                    返工率 --
                  </text>
                  <text
                    v-else
                    class="pq-count"
                    :style="Number(row.reworkRate) > 0 ? { color: '#f5222d', background: 'rgba(245,34,42,.1)' } : { color: '#18a058', background: 'rgba(24,160,88,.12)' }"
                  >
                    返工率 {{ row.reworkRate }}%
                  </text>
                </view>
                <view class="pq-grid">
                  <view class="pq-cell">
                    <text class="pq-label" :style="{ color: subColor }">参与数</text>
                    <text class="pq-value" :style="{ color: textColor }">{{ fmtNum(row.participationCount) }}</text>
                  </view>
                  <view class="pq-cell">
                    <text class="pq-label" :style="{ color: subColor }">完成数</text>
                    <text class="pq-value" :style="{ color: textColor }">{{ fmtNum(row.completedCount) }}</text>
                  </view>
                  <view class="pq-cell">
                    <text class="pq-label" :style="{ color: subColor }">当前待处理</text>
                    <text class="pq-value" :style="{ color: Number(row.currentPendingCount) > 0 ? '#faad14' : textColor, fontWeight: Number(row.currentPendingCount) > 0 ? 700 : 500 }">
                      {{ fmtNum(row.currentPendingCount) }}
                    </text>
                  </view>
                </view>
                <view class="pq-bar-row">
                  <text class="pq-label" :style="{ color: subColor }">平均处理时长</text>
                  <view style="flex: 1"></view>
                  <text class="pq-value" :style="{ color: textColor }">{{ fmtHours(row.averageProcessingHours) }}</text>
                </view>
              </view>
            </view>
            <view v-else class="card-empty" :style="{ color: subColor }">暂无人员数据</view>
            <view v-if="teamIncomplete" class="team-tip" :style="{ color: '#f0a020' }">
              返工率为“--”的人员：历史返工责任人明细不完整，仅统计当期可归属的返工。
            </view>
          </view>

          <!-- 存量风险分层：CSS 横向条 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #2d8cf0"></view>
              <text class="card-title" :style="{ color: textColor }">存量风险分层</text>
              <view style="flex: 1"></view>
              <text class="mode-tip">未关闭缺陷账龄</text>
            </view>
            <view class="aging-list">
              <view v-for="seg in agingRows" :key="seg.code" class="aging-row">
                <text class="aging-name" :style="{ color: textColor }">{{ seg.name }}</text>
                <view class="aging-track" :style="{ background: isDark ? '#3d3d3d' : '#eef1f6' }">
                  <view class="aging-fill" :style="{ width: seg.widthPct + '%' }"></view>
                </view>
                <text class="aging-count" :style="{ color: textColor }">{{ fmtNum(seg.count) }}</text>
              </view>
            </view>
          </view>

          <view class="bottom-space" />
        </view>
      </scroll-view>
    </view>
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { onLoad, onReady } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
// 项目未通过 npm 安装 echarts，使用 lime-echart 自带的 ESM 构建双端可用
import * as echarts from '@/uni_modules/lime-echart/static/web/echarts.esm.min.js'
import { fetchRdDefectDashboard } from '@/service/rdDefectReport'
import { fetchRdProjectListPage } from '@/service/rddefect'
import { fetchGetAllUserDataList } from '@/service/index'

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))
/** 按主题取色：c(浅色值, 深色值)，图表内文字/网格线用 */
const c = (light: string, dark: string) => (isDark.value ? dark : light)

function handleBack() {
  // #ifdef H5
  history.go(-1)
  // #endif
  // #ifndef H5
  uni.navigateBack()
  // #endif
}

/** 数值：千分位，空值 -- */
function fmtNum(v: any) {
  return v == null ? '--' : Number(v).toLocaleString('en-US')
}
/** 百分比：直接拼 %，空值 -- */
function fmtPct(v: any) {
  return v == null ? '--' : `${v}%`
}
/** 时长：拼“小时”，空值 -- */
function fmtHours(v: any) {
  return v == null ? '--' : `${v}小时`
}

/* ---------------- 查询日期：年=整年 / 月=单月 ---------------- */
const dateTypeOptions = [
  { label: '年', value: 'year' },
  { label: '月', value: 'month' },
]
const dateType = ref<'year' | 'month'>('month')
const yearNum = ref(new Date().getFullYear())
const monthSel = ref<string | null>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)

const datePickerRef = ref<any>(null)
const datePickerValue = ref(new Date().getTime())

function parseYM(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y || new Date().getFullYear(), (m || 1) - 1, 1)
}

const dateLabel = computed(() => {
  if (dateType.value === 'year') return `${yearNum.value}年全年`
  return monthSel.value ? `${monthSel.value.split('-')[0]}年${Number(monthSel.value.split('-')[1])}月` : `${yearNum.value}年全年`
})

function syncPickerValue() {
  datePickerValue.value =
    dateType.value === 'year'
      ? new Date(yearNum.value, 0, 1).getTime()
      : monthSel.value
        ? parseYM(monthSel.value).getTime()
        : new Date(yearNum.value, new Date().getMonth(), 1).getTime()
}
/** wd-datetime-picker 无 show prop，弹层只能通过暴露的 open() 打开 */
function openDatePicker() {
  syncPickerValue()
  datePickerRef.value?.open()
}

function handleDateConfirm({ value }: any) {
  const d = new Date(value)
  if (dateType.value === 'year') {
    yearNum.value = d.getFullYear()
    if (monthSel.value && Number(monthSel.value.split('-')[0]) !== yearNum.value) monthSel.value = null
  } else {
    monthSel.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    yearNum.value = d.getFullYear()
  }
  reSearch()
}

function handleDateTypeChange(t: 'year' | 'month') {
  if (dateType.value === t) return
  dateType.value = t
  if (t === 'month' && !monthSel.value) {
    monthSel.value = `${yearNum.value}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  }
  reSearch()
}

function stepDate(step: 1 | -1) {
  if (dateType.value === 'year') {
    yearNum.value += step
    if (monthSel.value && Number(monthSel.value.split('-')[0]) !== yearNum.value) monthSel.value = null
  } else {
    const base = monthSel.value ? parseYM(monthSel.value) : new Date()
    const nd = new Date(base.getFullYear(), base.getMonth() + step, 1)
    monthSel.value = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`
    yearNum.value = nd.getFullYear()
  }
  reSearch()
}

/* ---------------- 筛选：产品/人员多选、优先级单选 ---------------- */
const filterExpanded = ref(false)
const tipShow = ref(false)
const filterCount = computed(() => (projectIds.value.length ? 1 : 0) + (userIds.value.length ? 1 : 0) + (priority.value !== null ? 1 : 0))

const priorityOptions = [
  { label: '紧急(P0)', value: 0 },
  { label: '高(P1)', value: 1 },
  { label: '中(P2)', value: 2 },
  { label: '低(P3)', value: 3 },
]

const projectIds = ref<number[]>([])
const projectOptions = ref<{ label: string; value: number }[]>([])
async function loadProjectOptions() {
  try {
    const res: any = await fetchRdProjectListPage({ page: 1, limit: 200 })
    projectOptions.value = (res?.list || []).map((p: any) => ({ label: p.rdname, value: p.id }))
  } catch (e) {
    console.error('获取产品列表失败', e)
  }
}

const userIds = ref<number[]>([])
const userOptions = ref<{ label: string; value: number }[]>([])
async function loadUserOptions() {
  try {
    const res: any = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '5', _t: Date.now() })
    const arr = Array.isArray(res) ? res : res?.list || res?.data || []
    userOptions.value = (arr || [])
      .filter((u: any) => u && u.username && Number(u.status) === 0)
      .map((u: any) => ({ label: u.username, value: u.id }))
  } catch (e) {
    console.error('获取人员列表失败', e)
  }
}

const priority = ref<number | null>(null)

function togglePriority(v: number) {
  priority.value = priority.value === v ? null : v
  reSearch()
}

/* ---------------- 数据加载：一次请求返回整页 ---------------- */
const dashboard = ref<any | null>(null)
const listLoading = ref(false)
let reqSeq = 0

const periodText = computed(() => (dashboard.value?.periodStart ? `${dashboard.value.periodStart} ~ ${dashboard.value.periodEnd}` : '-'))

async function loadData() {
  const seq = ++reqSeq
  listLoading.value = true
  uni.showLoading({ title: '查询中...', mask: true })
  try {
    const params: any = { year: String(yearNum.value) }
    if (dateType.value === 'month' && monthSel.value) params.month = Number(monthSel.value.split('-')[1])
    if (projectIds.value.length) params.projectIds = projectIds.value.join(',')
    if (userIds.value.length) params.userIds = userIds.value.join(',')
    if (priority.value !== null) params.priority = priority.value
    const data: any = await fetchRdDefectDashboard(params)
    if (seq !== reqSeq) return
    dashboard.value = data || null
    updateCharts()
  } catch (e) {
    console.error('获取研发缺陷报表失败', e)
    if (seq === reqSeq) dashboard.value = null
  } finally {
    if (seq === reqSeq) {
      listLoading.value = false
      uni.hideLoading()
    }
  }
}

function reSearch() {
  loadData()
}

/* ---------------- 顶部指标卡 ---------------- */
const kpis = computed(() => {
  const s = dashboard.value?.summary || {}
  return [
    { label: '缺陷总数', value: fmtNum(s.totalCount), color: '#1890ff', bg: 'rgba(45,140,240,.10)' },
    { label: '新增缺陷', value: fmtNum(s.newCount), color: '#2d8cf0', bg: 'rgba(45,140,240,.10)' },
    { label: '关闭缺陷', value: fmtNum(s.closedCount), color: '#18a058', bg: 'rgba(24,160,88,.12)' },
    { label: '未关闭缺陷', value: fmtNum(s.unclosedCount), color: '#faad14', bg: 'rgba(250,173,20,.14)' },
    { label: '平均处理时长', value: fmtHours(s.averageProcessingHours), color: '#2d8cf0', bg: 'rgba(45,140,240,.10)' },
    { label: '首次测试通过率', value: fmtPct(s.firstTestPassRate), color: '#18a058', bg: 'rgba(24,160,88,.12)' },
    { label: '返工率', value: fmtPct(s.reworkRate), color: '#f5222d', bg: 'rgba(208,48,80,.10)' },
    { label: '重开率', value: fmtPct(s.reopenRate), color: '#f5222d', bg: 'rgba(208,48,80,.10)' },
  ]
})

/* ---------------- 图表：code 仅用于固定颜色映射 ---------------- */
const STATUS_COLORS: Record<string, string> = {
  PROCESSING: '#2d8cf0',
  WAIT_TEST: '#18a058',
  TEST_VERIFY: '#faad14',
  WAIT_ASSIGN_CONFIRM: '#d03050',
  PAUSED: '#9254de',
  REJECTED: '#909399',
}
const STATUS_ORDER = ['PROCESSING', 'WAIT_TEST', 'TEST_VERIFY', 'WAIT_ASSIGN_CONFIRM', 'PAUSED', 'REJECTED']
const AGING_ORDER = ['D0_3', 'D4_7', 'D8_30', 'D31_PLUS']

/** 收敛趋势：新增/关闭/未关闭三条折线 */
function buildTrendOption() {
  const trends: any[] = dashboard.value?.trends || []
  return {
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 12,
      textStyle: { fontSize: 10, color: c('#666', '#9aa6b8') },
    },
    grid: { left: 6, right: 16, top: 34, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: trends.map((t: any) => t.label),
      boundaryGap: false,
      axisLabel: { fontSize: 9, color: c('#666', '#9aa6b8') },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 9, color: c('#666', '#9aa6b8') },
      splitLine: { lineStyle: { color: c('#eef0f3', 'rgba(255,255,255,0.09)') } },
    },
    series: [
      { name: '新增', type: 'line', symbol: 'circle', symbolSize: 5, lineStyle: { width: 2 }, itemStyle: { color: '#2d8cf0' }, data: trends.map((t: any) => t.newCount) },
      { name: '关闭', type: 'line', symbol: 'circle', symbolSize: 5, lineStyle: { width: 2 }, itemStyle: { color: '#18a058' }, data: trends.map((t: any) => t.closedCount) },
      { name: '未关闭缺陷', type: 'line', symbol: 'circle', symbolSize: 5, lineStyle: { width: 2 }, itemStyle: { color: '#faad14' }, data: trends.map((t: any) => t.unclosedCount) },
    ],
  }
}

/** 流程状态环形图：按 code 顺序渲染、缺失补 0；圆角分段+间隙；环心文字用 HTML 覆盖层（canvas 内 title 多行富文本居中不可靠）；图例在图下方自绘 */
function buildStatusOption() {
  const dist: any[] = dashboard.value?.statusDistribution || []
  const byCode = new Map<string, any>(dist.map((s: any) => [s.code, s]))
  const data = STATUS_ORDER.map((code) => {
    const item = byCode.get(code)
    return { name: item?.name || code, value: item?.count || 0, itemStyle: { color: STATUS_COLORS[code] } }
  })
  const total = dist.reduce((sum, s: any) => sum + (s.count || 0), 0)
  // 全部为 0 时画灰色占位环，避免只剩环心数字、四周空白
  const chartData =
    total > 0
      ? data
      : [
          {
            name: '暂无数据',
            value: 1,
            itemStyle: { color: c('#eef1f6', '#3a3a48') },
            tooltip: { show: false },
            emphasis: { disabled: true },
          },
        ]
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['44%', '68%'],
        center: ['50%', '50%'],
        padAngle: 2,
        minAngle: 5,
        avoidLabelOverlap: true,
        itemStyle: { borderColor: c('#fff', '#1b1b1b'), borderWidth: 2, borderRadius: 8 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5, focus: 'self' },
        data: chartData,
      },
    ],
  }
}

/** 环形图下的自绘图例：固定顺序 + 固定配色 + 数量/占比 */
/** 环心覆盖层数值（原 title 富文本方案在 H5 上多行块居中测量有偏差，改 HTML 绝对定位） */
const statusCenter = computed(() => {
  const total = (dashboard.value?.statusDistribution || []).reduce((s: number, x: any) => s + (x.count || 0), 0)
  return {
    unclosed: Number(dashboard.value?.summary?.unclosedCount ?? 0).toLocaleString('en-US'),
    total: Number(total).toLocaleString('en-US'),
  }
})

const statusLegend = computed(() => {
  const dist: any[] = dashboard.value?.statusDistribution || []
  const byCode = new Map<string, any>(dist.map((s: any) => [s.code, s]))
  const total = dist.reduce((sum, s: any) => sum + (s.count || 0), 0)
  return STATUS_ORDER.map((code) => {
    const item = byCode.get(code)
    const count = item?.count || 0
    const pct = total ? ((count / total) * 100).toFixed(1) : '0.0'
    return { name: item?.name || code, count, pct: `${pct}%`, color: STATUS_COLORS[code] }
  })
})

/* ---------------- 图表初始化与更新 ---------------- */
const trendRef = ref<any>(null)
const statusRef = ref<any>(null)
const chartFailed = ref(false)
let trendChart: any = null
let statusChart: any = null
let chartsReady = false

async function initCharts() {
  if (chartFailed.value) return
  try {
    if (!trendChart && trendRef.value?.init) trendChart = await trendRef.value.init(echarts)
    if (!statusChart && statusRef.value?.init) statusChart = await statusRef.value.init(echarts)
    chartsReady = true
    updateCharts()
  } catch (e) {
    console.error('图表初始化失败', e)
    chartFailed.value = true
  }
}

function updateCharts() {
  if (!chartsReady) return
  try {
    trendChart?.setOption(buildTrendOption(), true)
    statusChart?.setOption(buildStatusOption(), true)
  } catch (e) {
    console.error('图表更新失败', e)
  }
}

watch(isDark, () => updateCharts())

/* ---------------- 表格与存量风险 ---------------- */
const productQuality = computed<any[]>(() => dashboard.value?.productQuality || [])
const teamEfficiency = computed<any[]>(() => dashboard.value?.teamEfficiency || [])
/** 历史返工归属不完整时该行返工率为 null，展示 -- 并提示 */
const teamIncomplete = computed(() => teamEfficiency.value.some((r: any) => r.reworkDataComplete === false))

/** 首次通过率进度条宽度 */
function passWidth(v: any) {
  const n = Number(v)
  if (v == null || Number.isNaN(n)) return '0%'
  return `${Math.min(100, Math.max(0, n))}%`
}

/** 账龄分段：固定顺序，条宽按最大数量归一 */
const agingRows = computed(() => {
  const map = new Map<string, any>((dashboard.value?.agingDistribution || []).map((a: any) => [a.code, a]))
  const rows = AGING_ORDER.map((code) => ({ code, name: map.get(code)?.name || code, count: map.get(code)?.count || 0 }))
  const max = Math.max(...rows.map((r) => Number(r.count) || 0), 1)
  return rows.map((r) => ({ ...r, widthPct: (Number(r.count) / max) * 100 }))
})

onLoad(() => {
  loadProjectOptions()
  loadUserOptions()
  loadData()
})

onReady(() => {
  initCharts()
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 筛选卡 */
.filter-card {
  flex-shrink: 0;
  margin: 16rpx 20rpx 0;
  border-radius: 20rpx;
  padding: 20rpx;
}
.filter-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.filter-toggle {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  padding: 10rpx 16rpx;
  border-radius: 10rpx;
  background: rgba(128, 128, 128, 0.08);
}
.f-count {
  min-width: 30rpx;
  height: 30rpx;
  line-height: 30rpx;
  text-align: center;
  border-radius: 999rpx;
  background: #2d8cf0;
  color: #ffffff;
  font-size: 18rpx;
  padding: 0 8rpx;
}
.f-arrow {
  display: flex;
  transition: transform 0.2s;
}
.f-arrow.open {
  transform: rotate(180deg);
}
.filter-body {
  margin-top: 18rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.12);
  padding-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.f-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}
.f-label {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #64748b;
  line-height: 52rpx;
  font-weight: 600;
}
.f-controls {
  flex: 1;
  min-width: 0;
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
  background: #f5f6f8;
  border: 1rpx solid rgba(128, 128, 128, 0.18);
  transition: all 0.2s;
}
.chip.active {
  color: #ffffff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  font-weight: 600;
}
.mode-tip {
  font-size: 20rpx;
  color: #999;
}
.clear-btn {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #2d8cf0;
  padding: 4rpx 12rpx;
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
.date-label {
  min-width: 160rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #1677ff;
  padding: 10rpx 20rpx;
  border-radius: 12rpx;
  background: rgba(22, 119, 255, 0.06);
}
.date-label.small {
  min-width: 150rpx;
  font-size: 26rpx;
  padding: 6rpx 16rpx;
}
.select-box {
  border-radius: 12rpx;
  overflow: hidden;
}

/* 隐藏 datetime-picker 自带的触发 cell */
:deep(.wd-datetime-picker__cell) {
  display: none;
}

.content-scroll {
  flex: 1;
  min-height: 0;
}
.content-inner {
  padding: 20rpx;
}

/* 指标卡 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.kpi-card {
  border-radius: 20rpx;
  padding: 24rpx;
}
.kpi-label {
  font-size: 24rpx;
  margin-bottom: 10rpx;
}
.kpi-value {
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.1;
}

/* 卡片 */
.card {
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 14rpx;
  flex-wrap: wrap;
}
.title-bar {
  width: 8rpx;
  height: 28rpx;
  border-radius: 4rpx;
}
.card-title {
  font-size: 30rpx;
  font-weight: 600;
}
.card-empty {
  text-align: center;
  padding: 50rpx 0;
  font-size: 26rpx;
}
.info-link {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
}
.chart-box {
  height: 440rpx;
  width: 100%;
}
.chart-fallback {
  text-align: center;
  padding: 60rpx 0;
  font-size: 24rpx;
}

/* 环形图自绘图例 */
.legend-grid {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx 16rpx;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}
.legend-dot {
  flex-shrink: 0;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}
.legend-name {
  font-size: 22rpx;
  flex-shrink: 0;
}
.legend-count {
  font-size: 20rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 环心文字覆盖层：绝对定位到容器中心，与 series center ['50%','50%'] 重合 */
.status-chart-wrap {
  position: relative;
}
.status-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.sc-label {
  font-size: 22rpx;
  line-height: 32rpx;
}
.sc-num {
  font-size: 48rpx;
  line-height: 56rpx;
  font-weight: 700;
}
.sc-total {
  font-size: 20rpx;
  line-height: 28rpx;
}

/* 产品/人员效能卡片 */
.pq-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.pq-card {
  border-radius: 16rpx;
  padding: 20rpx;
}
.pq-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.pq-name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.4;
}
.pq-count {
  flex-shrink: 0;
  font-size: 20rpx;
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.1);
  border-radius: 999rpx;
  padding: 6rpx 18rpx;
}
.pq-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}
.pq-label {
  font-size: 20rpx;
  display: block;
  margin-bottom: 4rpx;
}
.pq-value {
  font-size: 26rpx;
  font-weight: 500;
}
.pq-bar-row {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.pq-bar-row .pq-label {
  margin-bottom: 0;
  flex-shrink: 0;
}
.pq-track {
  flex: 1;
  height: 14rpx;
  border-radius: 999rpx;
  overflow: hidden;
}
.pq-fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #55d187 0%, #18a058 100%);
}
.pq-pct {
  flex-shrink: 0;
  font-size: 22rpx;
  font-weight: 600;
}
.team-tip {
  margin-top: 12rpx;
  font-size: 20rpx;
  line-height: 1.6;
}

/* 存量风险分层 */
.aging-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.aging-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.aging-name {
  flex-shrink: 0;
  width: 150rpx;
  font-size: 24rpx;
}
.aging-track {
  flex: 1;
  height: 22rpx;
  border-radius: 999rpx;
  overflow: hidden;
}
.aging-fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #5aabf5 0%, #2d8cf0 100%);
  min-width: 0;
}
.aging-count {
  flex-shrink: 0;
  min-width: 70rpx;
  text-align: right;
  font-size: 24rpx;
  font-weight: 600;
}

.bottom-space {
  height: 40rpx;
}

/* 口径说明弹框 */
.tip-sheet {
  border-radius: 24rpx 24rpx 0 0;
  padding: 40rpx 30rpx 40rpx;
}
.tip-head {
  margin-bottom: 24rpx;
}
.tip-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}
.tip-body {
  max-height: 56vh;
}
.tip-item {
  margin-bottom: 24rpx;
}
.tip-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
  margin-bottom: 6rpx;
}
.tip-value {
  font-size: 24rpx;
  color: #1f2937;
  line-height: 1.6;
}

/* ---------------- 暗黑模式 ---------------- */
.page.dark .chip:not(.active) {
  color: #a8b3c0;
}
.page.dark .date-label {
  color: #69b1ff;
  background: rgba(22, 119, 255, 0.16);
}
.page.dark .step-btn {
  color: #a8abb3;
}
.page.dark .card-title {
  color: #e5e5e5;
}
.page.dark .filter-toggle {
  background: rgba(255, 255, 255, 0.08);
}
.page.dark .f-label {
  color: #9aa0a8;
}
.page.dark .pq-count {
  color: #69b1ff;
  background: rgba(105, 177, 255, 0.12);
}
.page.dark .tip-title {
  color: #e5e5e5;
}
.page.dark .tip-value {
  color: #d0d5da;
}
</style>
