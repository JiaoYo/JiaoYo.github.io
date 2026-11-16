<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page" :class="{ dark: isDark }">
      <wd-navbar left-arrow title="值班报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

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
          <!-- 统计周期：月=单月 / 年=整年，‹›步进自动查询 -->
          <view class="f-row">
            <text class="f-label">周期</text>
            <view class="f-controls">
              <view
                v-for="t in periodOptions"
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

          <!-- 值班人员：多选选择框，确认即查询，清空表示全部人员 -->
          <view class="select-box" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
            <wd-select-picker
              v-model="userIds"
              type="checkbox"
              :columns="userOptions"
              label="人员"
              label-width="100rpx"
              placeholder="全部值班人员"
              clearable
              title="选择值班人员"
              @confirm="reSearch"
              @clear="reSearch"
            />
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
            <text class="tip-title">统计口径</text>
          </view>
          <scroll-view :scroll-y="true" class="tip-body">
            <view class="tip-item">
              <text class="tip-label">统计期</text>
              <text class="tip-value">{{ periodText }}</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">值班天数</text>
              <text class="tip-value">按值班日期去重统计，同一天多人值班仍计 1 天。</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">值班人次</text>
              <text class="tip-value">按当天值班人数累计，同一天 3 人值班计 3 人次。</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">类型分布</text>
              <text class="tip-value">按值班人次统计：节假日/周末为对应类型的值班人次，工作日 = 总人次 - 周末人次 - 节假日人次。</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">值班时长</text>
              <text class="tip-value">本期不统计。</text>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <scroll-view :scroll-y="true" class="content-scroll">
        <view class="content-inner">
          <!-- 汇总指标卡 -->
          <view class="kpi-grid">
            <view v-for="k in kpis" :key="k.label" class="kpi-card" :style="{ background: k.bg }">
              <view class="kpi-label" :style="{ color: subColor }">{{ k.label }}</view>
              <view class="kpi-value" :style="{ color: k.color }">{{ k.value }}</view>
            </view>
          </view>

          <!-- 值班人次趋势 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #2d8cf0"></view>
              <text class="card-title" :style="{ color: textColor }">{{ trendTitle }}</text>
            </view>
            <view class="period-line" :style="{ color: subColor }">
              {{ periodLabel }}<template v-if="periodRangeText">（{{ periodRangeText }}）</template>
            </view>
            <l-echart v-if="!chartFailed" ref="trendRef" lStyle="height: 440rpx; width: 100%;" />
            <view v-else class="chart-fallback" :style="{ color: subColor }">图表加载失败，数据请参考下方明细</view>
          </view>

          <!-- 值班类型分布：环心文字用 HTML 覆盖层（canvas 内 title 多行富文本居中不可靠） -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #ff9f43"></view>
              <text class="card-title" :style="{ color: textColor }">值班类型分布</text>
              <view style="flex: 1"></view>
              <view class="info-link" :style="{ color: '#2d8cf0' }" @click="tipShow = true">口径说明</view>
            </view>
            <view v-if="!chartFailed" class="donut-wrap">
              <l-echart ref="typeRef" lStyle="height: 440rpx; width: 100%;" />
              <view class="donut-center">
                <text class="dc-num" :style="{ color: textColor }">{{ typeTotal }}次</text>
                <text class="dc-label" :style="{ color: subColor }">值班人次</text>
              </view>
            </view>
            <view v-else class="chart-fallback" :style="{ color: subColor }">图表加载失败</view>
            <view class="legend-grid">
              <view v-for="item in typeItems" :key="item.name" class="legend-item">
                <view class="legend-dot" :style="{ background: item.color }"></view>
                <text class="legend-name" :style="{ color: textColor }">{{ item.name }}</text>
                <text class="legend-count" :style="{ color: subColor }">
                  {{ typeTotal ? Math.round((item.value / typeTotal) * 100) : 0 }}%（{{ item.value }}次）
                </text>
              </view>
            </view>
          </view>

          <!-- 人员值班明细：服务端分页，滚动到底加载下一页 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #2d8cf0"></view>
              <text class="card-title" :style="{ color: textColor }">人员值班明细</text>
              <view style="flex: 1"></view>
              <text class="mode-tip">共 {{ fmtNum(total) }} 人</text>
            </view>
            <scroll-view :scroll-y="true" class="p-list" @scrolltolower="loadMore">
              <view v-for="(row, idx) in rows" :key="String(row.userId)" class="p-card" :style="{ background: isDark ? '#333333' : '#fafbfc' }">
                <view class="p-head">
                  <view class="p-dot" :style="{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }"></view>
                  <text class="p-name" :style="{ color: textColor }">{{ row.username || '-' }}</text>
                  <text class="p-count">{{ dateType === 'year' ? '全年' : '值班' }} {{ fmtNum(row.dutyCount) }} 次</text>
                </view>
                <view class="p-grid">
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">周末值班</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(row.weekendCount) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">节假日值班</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(row.holidayCount) }}</text>
                  </view>
                </view>
                <!-- 月度：值班日期碎片；年度：1-12 月计数格 -->
                <view v-if="dateType === 'month'" class="date-chips">
                  <template v-if="row.dutyDates && row.dutyDates.length">
                    <text v-for="d in row.dutyDates" :key="d" class="d-chip">{{ fmtDateShort(d) }}</text>
                  </template>
                  <text v-else class="p-label" :style="{ color: subColor }">-</text>
                </view>
                <view v-else class="m-grid">
                  <view v-for="m in MONTH_KEYS" :key="m" class="m-cell">
                    <text class="m-label" :style="{ color: subColor }">{{ m }}月</text>
                    <text
                      class="m-value"
                      :style="Number(row.monthlyCounts?.[m]) > 0 ? { color: textColor, fontWeight: 700 } : { color: isDark ? '#5a5a66' : '#c0c4cc' }"
                    >
                      {{ fmtNum(row.monthlyCounts?.[m]) }}
                    </text>
                  </view>
                </view>
              </view>
              <view v-if="!rows.length && !listLoading" class="card-empty" :style="{ color: subColor }">当前条件下暂无值班记录</view>
              <view v-if="listLoading && rows.length" class="list-foot" :style="{ color: subColor }">加载中...</view>
              <view v-else-if="rows.length && !hasNextPage" class="list-foot" :style="{ color: subColor }">没有更多了</view>
              <view style="height: 8rpx"></view>
            </scroll-view>
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
import { fetchQueryDutyReport } from '@/service/holidayDuty'
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

/** 计数：null/undefined 视为 0 */
function fmtCount(v: any) {
  return v == null ? 0 : Number(v) || 0
}
/** 千分位计数 */
function fmtNum(v: any) {
  return fmtCount(v).toLocaleString('en-US')
}
/** 2026-09-06 → 9/6，与设计稿日期碎片一致；非日期格式原样返回 */
function fmtDateShort(date: string) {
  const m = /(\d{4})-?(\d{1,2})-?(\d{1,2})/.exec(date || '')
  return m ? `${Number(m[2])}/${Number(m[3])}` : date
}

/* ---------------- 查询周期：月=单月 / 年=整年 ---------------- */
const periodOptions = [
  { label: '月度', value: 'month' },
  { label: '年度', value: 'year' },
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

/* ---------------- 筛选：值班人员多选（复用值班管理同款候选 usertypes 2,3,9） ---------------- */
const filterExpanded = ref(false)
const tipShow = ref(false)
const filterCount = computed(() => (userIds.value.length ? 1 : 0))

const userIds = ref<number[]>([])
const userOptions = ref<{ label: string; value: number }[]>([])
async function loadUserOptions() {
  try {
    const res: any = await fetchGetAllUserDataList({ page: 1, limit: 500, usertypes: '2,3,9', _t: Date.now() })
    const arr = Array.isArray(res) ? res : res?.list || res?.data || []
    userOptions.value = (arr || [])
      .filter((u: any) => u && u.username && Number(u.status) === 0)
      .map((u: any) => ({ label: u.username, value: u.id }))
  } catch (e) {
    console.error('获取人员列表失败', e)
  }
}

/* ---------------- 报表加载：筛选变更重查，明细服务端分页滚动加载 ---------------- */
const PAGE_SIZE = 10
const reportData = ref<any | null>(null)
const rows = ref<any[]>([])
const total = ref(0)
const hasNextPage = ref(false)
const page = ref(1)
const listLoading = ref(false)
let reqSeq = 0

const periodLabel = computed(() => reportData.value?.period?.label || '-')
const periodRangeText = computed(() =>
  reportData.value?.period?.startDate ? `${reportData.value.period.startDate} ~ ${reportData.value.period.endDate}` : ''
)
const periodText = computed(() => periodRangeText.value || '-')

function buildParams() {
  const params: any = {
    periodType: dateType.value === 'year' ? 'YEAR' : 'MONTH',
    year: Number(yearNum.value),
  }
  if (dateType.value === 'month' && monthSel.value) params.month = Number(monthSel.value.split('-')[1])
  if (userIds.value.length) params.userIds = userIds.value
  return params
}

async function loadData(append = false) {
  const seq = ++reqSeq
  if (!append) page.value = 1
  listLoading.value = true
  if (!append) uni.showLoading({ title: '查询中...', mask: true })
  try {
    const data: any = await fetchQueryDutyReport({ ...buildParams(), page: page.value, limit: PAGE_SIZE })
    if (seq !== reqSeq) return // 已发出更新的查询，丢弃本次旧响应
    reportData.value = data || null
    const list = data?.page?.list || []
    const next = append ? rows.value.concat(list) : list
    // app 端嵌套 template 数组整体替换的渲染坑：先置空再赋值
    rows.value = []
    rows.value = next
    total.value = fmtCount(data?.page?.total)
    hasNextPage.value = !!data?.page?.hasNextPage
    if (!append) loadTypeDistribution()
    updateCharts()
  } catch (e) {
    console.error('获取值班报表失败', e)
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

/** 滚动到底：在途保护 + 无下一页直接跳过 */
function loadMore() {
  if (listLoading.value || !hasNextPage.value) return
  page.value += 1
  loadData(true)
}

/* ---------------- 类型分布（人次口径）：明细按人分页，合计需跨页求和；工作日 = 总人次 - 周末 - 节假日 ---------------- */
const typeData = ref({ duty: 0, weekend: 0, holiday: 0 })
let typeSeq = 0

async function loadTypeDistribution() {
  const seq = ++typeSeq
  const base = buildParams()
  let duty = 0
  let weekend = 0
  let holiday = 0
  let p = 1
  // 单页上限 300，正常人员规模一页取完；翻页次数上限防御异常总量
  for (let i = 0; i < 5; i += 1) {
    try {
      const data: any = await fetchQueryDutyReport({ ...base, page: p, limit: 300 })
      if (seq !== typeSeq) return // 条件已变化，丢弃本次结果
      ;(data?.page?.list || []).forEach((r: any) => {
        duty += fmtCount(r.dutyCount)
        weekend += fmtCount(r.weekendCount)
        holiday += fmtCount(r.holidayCount)
      })
      if (!data?.page?.hasNextPage) break
      p += 1
    } catch (e) {
      console.error('获取类型分布失败', e)
      return
    }
  }
  typeData.value = { duty, weekend, holiday }
  updateCharts()
}

const typeItems = computed(() => {
  const weekend = typeData.value.weekend
  const holiday = typeData.value.holiday
  const ordinary = Math.max(typeData.value.duty - weekend - holiday, 0)
  return [
    { name: '工作日', value: ordinary, color: '#ff9f43' },
    { name: '周末', value: weekend, color: '#2d8cf0' },
    { name: '节假日', value: holiday, color: '#f0485a' },
  ].filter((i) => i.value > 0)
})

const typeTotal = computed(() => typeItems.value.reduce((acc, cur) => acc + cur.value, 0))

/* ---------------- 图表 ---------------- */
const trendRef = ref<any>(null)
const typeRef = ref<any>(null)
const chartFailed = ref(false)
let trendChart: any = null
let typeChart: any = null
let chartsReady = false

const trendTitle = computed(() => (dateType.value === 'year' ? '每月值班人次趋势' : '每日值班人次趋势'))

/** 趋势柱状图：月度为当月每个自然日（后端已补零，横轴完整），年度固定 12 个月 */
function buildTrendOption() {
  const trend: any[] = reportData.value?.trend || []
  const isYearMode = dateType.value === 'year'
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 10, right: 16, top: 34, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: trend.map((t: any) => (isYearMode ? t.label : fmtDateShort(t.label))),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: c('#e0e3e9', '#3a3a48') } },
      axisLabel: { fontSize: 9, color: c('#666', '#9aa6b8') },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      name: '人次',
      nameTextStyle: { color: c('#999', '#8a94a8'), fontSize: 10, align: 'right' },
      axisLabel: { fontSize: 10, color: c('#666', '#9aa6b8') },
      splitLine: { lineStyle: { color: c('#eef0f3', '#2e2e38') } },
    },
    series: [
      {
        name: '值班人次',
        type: 'bar',
        barMaxWidth: 14,
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#4a92f5' },
              { offset: 1, color: c('#c9defb', '#1c3d6e') },
            ],
          },
        },
        // 月度 31 个柱顶标签放不下，仅年度（12 个点）展示
        label: isYearMode ? { show: true, position: 'top', fontSize: 10, color: c('#666', '#9aa6b8') } : { show: false },
        data: trend.map((t: any) => fmtCount(t.assignmentCount)),
      },
    ],
  }
}

/** 类型分布环图：全为 0 时画灰色占位环，避免空白 */
function buildTypeOption() {
  const items = typeItems.value
  const data = items.length
    ? items.map((i) => ({ name: i.name, value: i.value, itemStyle: { color: i.color } }))
    : [{ name: '暂无数据', value: 1, itemStyle: { color: c('#eef1f6', '#3a3a48') }, tooltip: { show: false }, emphasis: { disabled: true } }]
  return {
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}：${p.value}次（${p.percent}%）` },
    series: [
      {
        type: 'pie',
        radius: ['40%', '66%'],
        center: ['50%', '50%'],
        padAngle: 2,
        minAngle: 4,
        avoidLabelOverlap: true,
        itemStyle: { borderColor: c('#fff', '#1b1b1b'), borderWidth: 2, borderRadius: 8 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5, focus: 'self' },
        data,
      },
    ],
  }
}

async function initCharts() {
  if (chartFailed.value) return
  try {
    if (!trendChart && trendRef.value?.init) trendChart = await trendRef.value.init(echarts)
    if (!typeChart && typeRef.value?.init) typeChart = await typeRef.value.init(echarts)
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
    typeChart?.setOption(buildTypeOption(), true)
  } catch (e) {
    console.error('图表更新失败', e)
  }
}

watch(isDark, () => updateCharts())

/* ---------------- 人员明细 ---------------- */
const MONTH_KEYS = Array.from({ length: 12 }, (_, i) => String(i + 1))
/** 姓名圆点调色板：按行序循环取色 */
const AVATAR_COLORS = ['#2d8cf0', '#18a058', '#ff9f43', '#9254de', '#f0485a', '#13c2c2']

/* ---------------- 汇总指标卡 ---------------- */
const kpis = computed(() => {
  const s = reportData.value?.summary || {}
  return [
    { label: '值班天数', value: `${fmtNum(s.dutyDays)} 天`, color: '#2d8cf0', bg: 'rgba(45,140,240,.10)' },
    { label: '值班人次', value: `${fmtNum(s.assignmentCount)} 次`, color: '#18a058', bg: 'rgba(24,160,88,.12)' },
    { label: '参与人数', value: `${fmtNum(s.userCount)} 人`, color: '#ff9f43', bg: 'rgba(255,159,67,.14)' },
    { label: '周末值班', value: `${fmtNum(s.weekendDays)} 天`, color: '#9254de', bg: 'rgba(146,84,222,.12)' },
    { label: '节假日值班', value: `${fmtNum(s.holidayDays)} 天`, color: '#f0485a', bg: 'rgba(240,72,90,.12)' },
  ]
})

onLoad(() => {
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
.chart-fallback {
  text-align: center;
  padding: 60rpx 0;
  font-size: 24rpx;
}
.period-line {
  font-size: 22rpx;
  margin-bottom: 8rpx;
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
.donut-wrap {
  position: relative;
}
.donut-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.dc-num {
  font-size: 44rpx;
  line-height: 52rpx;
  font-weight: 700;
}
.dc-label {
  font-size: 22rpx;
  line-height: 30rpx;
}

/* 人员明细卡列表：固定高度内部滚动 */
.p-list {
  height: 960rpx;
}
.p-list .p-card {
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}
.p-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.p-dot {
  flex-shrink: 0;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}
.p-name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.4;
}
.p-count {
  flex-shrink: 0;
  font-size: 20rpx;
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.1);
  border-radius: 999rpx;
  padding: 6rpx 18rpx;
}
.p-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}
.p-label {
  font-size: 20rpx;
  display: block;
  margin-bottom: 4rpx;
}
.p-value {
  font-size: 26rpx;
  font-weight: 500;
}
.date-chips {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}
.d-chip {
  display: inline-block;
  padding: 4rpx 16rpx;
  background: #e8f3fe;
  color: #2d8cf0;
  font-size: 22rpx;
  line-height: 34rpx;
  border-radius: 8rpx;
}
.m-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12rpx 8rpx;
}
.m-cell {
  text-align: center;
}
.m-label {
  display: block;
  font-size: 18rpx;
  margin-bottom: 2rpx;
}
.m-value {
  font-size: 24rpx;
  font-weight: 500;
}
.list-foot {
  text-align: center;
  padding: 16rpx 0;
  font-size: 22rpx;
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
.page.dark .p-count {
  color: #69b1ff;
  background: rgba(105, 177, 255, 0.12);
}
.page.dark .d-chip {
  background: rgba(45, 140, 240, 0.16);
  color: #69b1ff;
}
.page.dark .tip-title {
  color: #e5e5e5;
}
.page.dark .tip-value {
  color: #d0d5da;
}
</style>
