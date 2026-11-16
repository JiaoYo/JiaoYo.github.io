<template>
  <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
    <view class="page" :class="{ dark: isDark }">
      <wd-navbar left-arrow title="日报报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <!-- 筛选卡（参考值班报表）：收起时一行（当前周期 + 筛选入口），展开后编辑维度/项目/人员 -->
      <view class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="filter-head">
          <view class="date-label" @click="openPeriodPicker">{{ periodLabelText }}</view>
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
          <!-- 统计维度：年 / 月 / ISO 周，‹›步进自动查询；周仅作为查询时间范围，不代表公司工作周 -->
          <view class="f-row">
            <text class="f-label">维度</text>
            <view class="f-controls">
              <view
                v-for="t in dimensionOptions"
                :key="t.value"
                class="chip"
                :class="{ active: dimension === t.value }"
                :style="dimension === t.value ? '' : { background: isDark ? '#383838' : '#f5f6f8' }"
                @click="handleDimensionChange(t.value)"
              >
                {{ t.label }}
              </view>
              <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepPeriod(-1)">
                <wd-icon name="arrow-left" size="14px" />
              </view>
              <view class="date-label small" @click="openPeriodPicker">{{ periodLabelText }}</view>
              <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepPeriod(1)">
                <wd-icon name="arrow-right" size="14px" />
              </view>
            </view>
          </view>

          <!-- 项目筛选：底部弹层 + 接口搜索（参考项目现场图片页） -->
          <view class="f-row">
            <text class="f-label">项目</text>
            <view class="f-controls">
              <view class="select-box proj-trigger" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="openProjectPopup">
                <text class="proj-value" :class="{ placeholder: !selectedProjectLabel }" :style="{ color: selectedProjectLabel ? textColor : subColor }">{{ selectedProjectLabel || '全部项目' }}</text>
                <wd-icon name="arrow-down" size="14px" :color="subColor" />
              </view>
            </view>
          </view>

          <!-- 人员筛选：单选（有效人员 usertypes 2,3,9，与统计口径一致） -->
          <view class="f-row">
            <text class="f-label">人员</text>
            <view class="f-controls">
              <view class="select-box" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
                <wd-select-picker v-model="userId" type="radio" :columns="userOptions" placeholder="全部人员" title="选择人员" @confirm="reSearch" @clear="reSearch" />
              </view>
            </view>
          </view>

          <view class="reset-row">
            <view style="flex: 1"></view>
            <view class="reset-btn" @click="handleReset">重置</view>
          </view>
        </view>
      </view>

      <!-- 年/月选择器（无 show prop，弹层通过暴露的 open() 打开；自带 cell 隐藏） -->
      <wd-datetime-picker
        v-if="dimension !== 'week'"
        ref="datePickerRef"
        v-model="datePickerValue"
        :type="dimension === 'year' ? 'year' : 'year-month'"
        title="选择周期"
        @confirm="handleDateConfirm"
      />

      <!-- 周选择器：ISO 自然周下拉（wd-picker 默认插槽占位，由日期标签触发 open()） -->
      <wd-picker v-if="dimension === 'week'" ref="weekPickerRef" v-model="weekSel" :columns="weekColumns" title="选择周" @confirm="reSearch">
        <view></view>
      </wd-picker>

      <!-- 项目选择弹层：接口搜索 -->
      <wd-popup v-model="projectPopup" position="bottom" :z-index="1000" custom-style="height: 70vh; background: transparent;">
        <view class="project-popup" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="project-popup-head">
            <text class="project-popup-title" :style="{ color: textColor }">选择项目</text>
            <wd-icon name="close" size="20px" :color="subColor" @click="projectPopup = false" />
          </view>
          <wd-search
            v-model="projectKeyword"
            placeholder="搜索项目名称"
            placeholder-left
            cancel-txt="搜索"
            @search="loadProjects(projectKeyword, true)"
            @cancel="loadProjects(projectKeyword, true)"
            @clear="loadProjects()"
          />
          <scroll-view :scroll-y="true" class="project-list" @scrolltolower="loadMoreProjects">
            <view class="project-item" @click="selectProject({ id: undefined, proname: '' })">
              <text class="project-item-name project-all" :style="{ color: textColor }">全部项目</text>
              <wd-icon v-if="!pid" name="check" size="16px" color="#1677ff" />
            </view>
            <view v-for="p in projectRawList" :key="String(p.id)" class="project-item" @click="selectProject(p)">
              <text class="project-item-name" :style="{ color: String(pid) === String(p.id) ? '#1677ff' : textColor }">{{ p.proname || p.proName }}</text>
              <wd-icon v-if="String(pid) === String(p.id)" name="check" size="16px" color="#1677ff" />
            </view>
            <view v-if="projectLoading && !projectRawList.length" class="project-loading">
              <wd-loading :size="20" color="#1677ff" />
            </view>
            <view v-if="projectLoading && projectRawList.length" class="project-loading">
              <text :style="{ color: subColor }">加载中...</text>
            </view>
            <view v-if="!projectLoading && !projectRawList.length" class="project-empty">
              <text :style="{ color: subColor }">暂无匹配项目</text>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <!-- 口径说明弹框 -->
      <wd-popup closable v-model="tipShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="tip-sheet" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="tip-head">
            <text class="tip-title" :style="{ color: textColor }">统计口径</text>
          </view>
          <scroll-view :scroll-y="true" class="tip-body">
            <view class="tip-item">
              <text class="tip-label">统计期</text>
              <text class="tip-value" :style="{ color: textColor }">{{ periodRangeText || '-' }}</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">指标口径</text>
              <text class="tip-value" :style="{ color: textColor }">{{ reportData?.metricDefinition || '仅统计实际发生的日报数据，不计算工作日、应填天数、缺报、填报率或达标状态' }}</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">补录口径</text>
              <text class="tip-value" :style="{ color: textColor }">补录计入日报总数，同时单独计入补录数量；同一天多份日报日报数累加、填报天数只加 1。</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">多项目日报</text>
              <text class="tip-value" :style="{ color: textColor }">同一日报关联多个项目时，日报数和图片数只计算一次；没有日报的有效人员显示零值。</text>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <scroll-view :scroll-y="true" class="content-scroll">
        <view class="content-inner">
          <!-- 汇总指标卡：只统计实际发生的数据，不做应填/缺报/完成率推导 -->
          <view class="kpi-grid">
            <view v-for="k in kpis" :key="k.label" class="kpi-card" :style="{ background: k.bg }">
              <view class="kpi-label" :style="{ color: subColor }">{{ k.label }}</view>
              <view class="kpi-value" :style="{ color: k.color }">{{ k.value }}</view>
            </view>
          </view>

          <!-- 人员日报排行：按所选指标取当前已加载人员前 8 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #f59e0b"></view>
              <text class="card-title" :style="{ color: textColor }">人员日报排行</text>
              <view style="flex: 1"></view>
              <view
                v-for="opt in rankMetricOptions"
                :key="opt.value"
                class="chip mini"
                :class="{ active: rankMetric === opt.value }"
                :style="rankMetric === opt.value ? '' : { background: isDark ? '#383838' : '#f5f6f8' }"
                @click="rankMetric = opt.value"
              >
                {{ opt.label }}
              </view>
            </view>
            <view v-if="rankList.length" class="rank-list">
              <view v-for="(p, i) in rankList" :key="p.userId" class="rank-row">
                <view class="rank-badge" :style="rankBadgeStyle(i)">{{ i + 1 }}</view>
                <text class="rank-name" :style="{ color: textColor }">{{ displayName(p) }}</text>
                <view class="rank-track" :style="{ background: isDark ? '#27272a' : '#f1f5f9' }">
                  <view class="rank-bar" :style="{ width: rankBarWidth(p[rankMetric]) }"></view>
                </view>
                <text class="rank-value" :style="{ color: textColor }">{{ fmtNum(p[rankMetric]) }}</text>
              </view>
            </view>
            <view v-else class="card-empty" :style="{ color: subColor }">当前筛选范围内暂无排行数据</view>
          </view>

          <!-- 日报实际趋势：日报数/补录数/图片数柱状 + 填报人数折线（双轴，右轴为人数） -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #2d8cf0"></view>
              <text class="card-title" :style="{ color: textColor }">日报实际趋势</text>
              <view style="flex: 1"></view>
              <text class="mode-tip">{{ trendGranularityText }}</text>
            </view>
            <view class="period-line" :style="{ color: subColor }">统计区间：{{ periodRangeText || '-' }}</view>
            <l-echart v-if="!chartFailed" ref="trendRef" lStyle="height: 440rpx; width: 100%;" />
            <view v-else class="chart-fallback" :style="{ color: subColor }">图表加载失败，数据请参考下方明细</view>
          </view>

          <!-- 人员日报情况：服务端分页只作用于本表，汇总与趋势始终基于全部命中数据 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <view class="title-bar" style="background: #22c55e"></view>
              <text class="card-title" :style="{ color: textColor }">人员日报情况</text>
              <view style="flex: 1"></view>
              <text class="mode-tip">共 {{ fmtNum(total) }} 人</text>
              <view class="info-link" :style="{ color: '#2d8cf0' }" @click="tipShow = true">口径说明</view>
            </view>
            <scroll-view :scroll-y="true" class="p-list" @scrolltolower="loadMore">
              <view v-for="(row, idx) in rows" :key="String(row.userId ?? idx)" class="p-card" :style="{ background: isDark ? '#333333' : '#fafbfc' }">
                <view class="p-head">
                  <view class="p-dot" :style="{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }"></view>
                  <text class="p-name" :style="{ color: textColor }">{{ displayName(row) }}</text>
                  <text class="p-count">日报 {{ fmtNum(row.reportCount) }}</text>
                </view>
                <view class="p-grid">
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">补录数量</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(row.supplementReportCount) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">填报天数</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(row.reportDayCount) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">有图日报</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(row.reportWithImageCount) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">日报图片</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(row.imageCount) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">平均图片/日报</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtAvg(row.averageImagesPerReport) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">关联项目</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(row.projectCount) }}</text>
                  </view>
                </view>
                <view class="p-times" :style="{ color: subColor }">
                  <text>首次填报时间： {{ fmtTimeShort(row.firstReportTime) }}</text>
                  <text>最近填报时间： {{ fmtTimeShort(row.latestReportTime) }}</text>
                </view>
                <view class="p-foot" @click.stop="openDetail(row)">
                  <text class="p-detail-link">查看详情</text>
                  <wd-icon name="arrow-right" size="12px" :color="'#2d8cf0'" />
                </view>
              </view>
              <view v-if="!rows.length && !listLoading" class="card-empty" :style="{ color: subColor }">当前条件下暂无人员日报数据</view>
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
import { fetchGetPersonDailyStatistics } from '@/service/personDailyReport'
import { fetchGetPrjDataList } from '@/service/index'
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
/** 平均图片/日报：接口返回两位小数字符串，空值展示 - */
function fmtAvg(v: any) {
  if (v === null || v === undefined || v === '') return '-'
  return String(v)
}

/** 人员候选 id → 姓名，供人名兜底（接口字段大小写差异时回退到候选表） */
const userNameMap = computed(() => {
  const m: Record<string, string> = {}
  userOptions.value.forEach((u: any) => {
    m[String(u.value)] = u.label
  })
  return m
})

/** 从行数据解析人员 id：接口字段名不确定（userId/userid/creater…），依次回退 */
function resolveUid(row: any) {
  const nested = row.user || row.userInfo || row.userVo || {}
  return row.userId ?? row.userid ?? row.userID ?? row.uid ?? row.creater ?? row.id ?? nested.userId ?? nested.id
}
/** 人名兜底链：字段大小写/嵌套变体依次回退 → 人员候选表按 userId 补 → 拿不到名字但有 id 时显示 #id（便于暴露字段缺失） */
function displayName(row: any) {
  const nested = row.user || row.userInfo || row.userVo || {}
  const uid = resolveUid(row)
  const direct =
    row.username ||
    row.userName ||
    row.user_name ||
    nested.username ||
    nested.userName ||
    nested.name ||
    row.name ||
    row.realname ||
    row.realName ||
    row.nickname ||
    row.uname ||
    userNameMap.value[String(uid)]
  const name = direct && String(direct).trim() !== '' && String(direct).trim() !== '-' ? String(direct).trim() : ''
  return name || (uid !== undefined && uid !== null ? `#${uid}` : '-')
}
/** 2026-10-21 12:00:00 → 2026-10-21 */
function fmtTimeShort(v: any) {
  if (!v) return '-'
  return String(v).slice(0, 10)
}
/** 2026-10-21 → 10/21；非日期格式原样返回 */
function fmtDateShort(date: string) {
  const m = /(\d{4})-?(\d{1,2})-?(\d{1,2})/.exec(date || '')
  return m ? `${Number(m[2])}/${Number(m[3])}` : date
}

/* ---------------- 统计维度与周期：年 yyyy / 月 yyyy-MM / 周 yyyy-Www（ISO 自然周） ---------------- */
type Dimension = 'year' | 'month' | 'week'
const dimensionOptions = [
  { label: '年', value: 'year' },
  { label: '月', value: 'month' },
  { label: '周', value: 'week' },
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** ISO 自然周（周一为一周开始）：返回 ISO 周年与周序号，与接口 yyyy-Www 口径一致 */
function isoWeekOf(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const isoYear = d.getUTCFullYear()
  const week = Math.ceil(((d.getTime() - Date.UTC(isoYear, 0, 1)) / 86400000 + 1) / 7)
  return { isoYear, week }
}

/** ISO 周字符串（yyyy-Www）转该周周一时间戳（用于周选择器回显） */
function isoWeekToMondayTs(period: string) {
  const [y, w] = String(period).split('-W').map(Number)
  if (!y || !w) return null
  const jan4 = new Date(Date.UTC(y, 0, 4))
  const day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (day - 1))
  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (w - 1) * 7)
  return monday.getTime()
}

/** 时间戳转 ISO 周字符串（yyyy-Www） */
function tsToIsoWeek(ts: number) {
  const { isoYear, week } = isoWeekOf(new Date(ts))
  return `${isoYear}-W${pad2(week)}`
}

/** ISO 年的全部周（该周周四落在 ISO 年内才算这一年的周），并给出日期范围供选择器展示 */
function isoWeekColumns(isoYear: number) {
  const cols: { label: string; value: string }[] = []
  const jan4 = new Date(Date.UTC(isoYear, 0, 4))
  const day = jan4.getUTCDay() || 7
  const monday0 = new Date(jan4)
  monday0.setUTCDate(jan4.getUTCDate() - (day - 1))
  for (let w = 1; w <= 53; w += 1) {
    const monday = new Date(monday0)
    monday.setUTCDate(monday0.getUTCDate() + (w - 1) * 7)
    const thursday = new Date(monday)
    thursday.setUTCDate(monday.getUTCDate() + 3)
    if (thursday.getUTCFullYear() !== isoYear) break
    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)
    const range = `${monday.getUTCMonth() + 1}/${monday.getUTCDate()} ~ ${sunday.getUTCMonth() + 1}/${sunday.getUTCDate()}`
    cols.push({ label: `第${pad2(w)}周（${range}）`, value: `${isoYear}-W${pad2(w)}` })
  }
  return cols
}

/** 各维度默认周期：当前年 / 当前月 / 当前 ISO 周 */
function defaultPeriod(dim: Dimension) {
  const now = new Date()
  if (dim === 'year') return String(now.getFullYear())
  if (dim === 'month') return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
  const { isoYear, week } = isoWeekOf(now)
  return `${isoYear}-W${pad2(week)}`
}

const dimension = ref<Dimension>('month')
const yearSel = ref<string>(defaultPeriod('year'))
const monthSel = ref<string>(defaultPeriod('month'))
const weekSel = ref<string>(defaultPeriod('week'))

const weekColumns = computed(() => isoWeekColumns(Number(String(weekSel.value).split('-W')[0]) || new Date().getFullYear()))

const periodLabelText = computed(() => {
  if (dimension.value === 'year') return `${yearSel.value}年`
  if (dimension.value === 'month') {
    const [y, m] = String(monthSel.value).split('-')
    return `${y}年${Number(m)}月`
  }
  const [y, w] = String(weekSel.value).split('-W')
  return `${y}年第${Number(w)}周`
})

/** 当前维度对应的周期字符串 */
function currentPeriod(): string {
  if (dimension.value === 'year') return yearSel.value
  if (dimension.value === 'month') return monthSel.value
  return weekSel.value
}

const datePickerRef = ref<any>(null)
const weekPickerRef = ref<any>(null)
const datePickerValue = ref(new Date().getTime())

function syncPickerValue() {
  if (dimension.value === 'year') {
    datePickerValue.value = new Date(Number(yearSel.value) || new Date().getFullYear(), 0, 1).getTime()
  } else if (dimension.value === 'month') {
    const [y, m] = String(monthSel.value).split('-').map(Number)
    datePickerValue.value = new Date(y || new Date().getFullYear(), (m || 1) - 1, 1).getTime()
  }
}

/** 顶部/筛选内的周期标签：年月走 datetime-picker 的 open()，周走 wd-picker 的 open() */
function openPeriodPicker() {
  if (dimension.value === 'week') {
    weekPickerRef.value?.open()
    return
  }
  syncPickerValue()
  datePickerRef.value?.open()
}

function handleDateConfirm({ value }: any) {
  const d = new Date(value)
  if (dimension.value === 'year') {
    yearSel.value = String(d.getFullYear())
  } else {
    monthSel.value = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
  }
  reSearch()
}

/** 切换维度：回填新维度默认周期并自动查询（与 web 一致） */
function handleDimensionChange(dim: Dimension) {
  if (dimension.value === dim) return
  dimension.value = dim
  const def = defaultPeriod(dim)
  yearSel.value = dim === 'year' ? def : yearSel.value
  monthSel.value = dim === 'month' ? def : monthSel.value
  weekSel.value = dim === 'week' ? def : weekSel.value
  reSearch()
}

/** 上一周期 / 下一周期 */
function stepPeriod(step: 1 | -1) {
  if (dimension.value === 'year') {
    const y = Number(yearSel.value)
    if (y) yearSel.value = String(y + step)
  } else if (dimension.value === 'month') {
    const [y, m] = String(monthSel.value).split('-').map(Number)
    if (y && m) {
      const d = new Date(y, m - 1 + step, 1)
      monthSel.value = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
    }
  } else {
    const ts = isoWeekToMondayTs(weekSel.value)
    if (ts != null) weekSel.value = tsToIsoWeek(ts + step * 7 * 86400000)
  }
  reSearch()
}

/* ---------------- 筛选：项目 / 人员（单选，确认即查询） ---------------- */
const filterExpanded = ref(false)
const tipShow = ref(false)
const filterCount = computed(() => (pid.value ? 1 : 0) + (userId.value ? 1 : 0))

const pid = ref<any>(null)
const userId = ref<any>(null)
const userOptions = ref<{ label: string; value: number }[]>([])

/* ---------------- 项目筛选弹层：项目分页接口（projectInfo/getPage.do + fuzzy），与技术服务日报页同源 ---------------- */
const projectPopup = ref(false)
const projectKeyword = ref('')
const projectLoading = ref(false)
const projectRawList = ref<any[]>([])
const projectTotal = ref(0)
const selectedProjectLabel = ref('')
let projectSeq = 0
let projectPage = 1

/** 首屏/搜索：fuzzy 走服务端模糊，page 重置为 1 */
async function loadProjects(keyword?: string, showTip = false) {
  const seq = ++projectSeq
  projectPage = 1
  projectLoading.value = true
  if (showTip) uni.showLoading({ title: '搜索中...' })
  try {
    const data: any = await fetchGetPrjDataList({ page: 1, limit: 50, fuzzy: keyword || undefined })
    if (seq !== projectSeq) return
    projectTotal.value = fmtCount(data?.total)
    const next = (data?.list || []).filter((p: any) => p && (p.proname || p.proName))
    // 先置空再赋值，规避嵌套 template 数组整体替换的渲染坑
    projectRawList.value = []
    projectRawList.value = next
  } catch (e) {
    console.error('获取项目列表失败', e)
  } finally {
    if (seq === projectSeq) {
      projectLoading.value = false
      uni.hideLoading()
    }
  }
}

/** 弹层滚到底：追加下一页（与服务端分页口径一致） */
async function loadMoreProjects() {
  if (projectLoading.value || projectRawList.value.length >= projectTotal.value) return
  const seq = ++projectSeq
  projectLoading.value = true
  try {
    const data: any = await fetchGetPrjDataList({ page: projectPage + 1, limit: 50, fuzzy: projectKeyword.value || undefined })
    if (seq !== projectSeq) return
    projectPage += 1
    projectTotal.value = fmtCount(data?.total)
    const arr = (data?.list || []).filter((p: any) => p && (p.proname || p.proName))
    projectRawList.value = projectRawList.value.concat(arr)
  } catch (e) {
    console.error('获取项目列表失败', e)
  } finally {
    if (seq === projectSeq) projectLoading.value = false
  }
}

function openProjectPopup() {
  projectPopup.value = true
  if (!projectRawList.value.length) loadProjects()
}

function selectProject(item: any) {
  pid.value = item.id ?? null
  selectedProjectLabel.value = item.proname || item.proName || ''
  projectPopup.value = false
  reSearch()
}

async function loadUserOptions() {
  try {
    const res: any = await fetchGetAllUserDataList({ page: 1, limit: 500, usertypes: '2,3,9', _t: Date.now() })
    const arr = Array.isArray(res) ? res : res?.list || res?.data || res?.records || res?.rows || []
    userOptions.value = (arr || [])
      .filter((u: any) => u && u.username && (u.status === undefined || u.status === null || Number(u.status) === 0))
      .map((u: any) => ({ label: u.username, value: u.id }))
    console.log('[日报报表] 人员候选表加载', userOptions.value.length, '条')
  } catch (e) {
    console.error('获取人员列表失败', e)
  }
}

function handleReset() {
  dimension.value = 'month'
  yearSel.value = defaultPeriod('year')
  monthSel.value = defaultPeriod('month')
  weekSel.value = defaultPeriod('week')
  pid.value = null
  userId.value = null
  reSearch()
}

/* ---------------- 报表加载：筛选变更重查，人员列表服务端分页滚动加载 ---------------- */
const PAGE_SIZE = 20
const reportData = ref<any | null>(null)
const rows = ref<any[]>([])
const total = ref(0)
const hasNextPage = ref(false)
const page = ref(1)
const listLoading = ref(false)
let reqSeq = 0

const periodRangeText = computed(() => {
  const d = reportData.value
  if (!d?.startTime || !d?.endTime) return ''
  return `${d.startTime} ~ ${d.endTime}`
})
const trendGranularityText = computed(() => (reportData.value?.granularity === 'MONTH' ? '按月趋势' : '按日趋势'))

function buildParams() {
  const params: any = {
    periodType: String(dimension.value).toUpperCase(),
    period: currentPeriod(),
  }
  if (pid.value) params.pid = pid.value
  if (userId.value) params.creater = userId.value
  return params
}

async function loadData(append = false) {
  const seq = ++reqSeq
  if (!append) page.value = 1
  listLoading.value = true
  if (!append) uni.showLoading({ title: '查询中...', mask: true })
  try {
    const data: any = await fetchGetPersonDailyStatistics({ ...buildParams(), page: page.value, limit: PAGE_SIZE })
    if (seq !== reqSeq) return // 已发出更新的查询，丢弃本次旧响应
    if (!append) reportData.value = data || null
    const list = data?.people || []
    const next = append ? rows.value.concat(list) : list
    // app 端嵌套 template 数组整体替换的渲染坑：先置空再赋值
    rows.value = []
    rows.value = next
    total.value = fmtCount(data?.total)
    hasNextPage.value = rows.value.length < total.value
    if (!append && rows.value.length) console.log('[日报报表] 人员首行字段:', JSON.stringify(rows.value[0]))
    updateCharts()
  } catch (e) {
    console.error('获取日报报表失败', e)
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

/* ---------------- 人员日报排行：接口人员列表已按日报数、图片数排序，这里按所选指标取前 8 ---------------- */
type RankMetric = 'reportCount' | 'imageCount' | 'supplementReportCount'
const rankMetricOptions: { label: string; value: RankMetric }[] = [
  { label: '日报数', value: 'reportCount' },
  { label: '图片数', value: 'imageCount' },
  { label: '补录数', value: 'supplementReportCount' },
]
const rankMetric = ref<RankMetric>('reportCount')

const rankList = computed(() =>
  rows.value
    .filter((p: any) => fmtCount(p[rankMetric.value]) > 0)
    .slice()
    .sort((a: any, b: any) => fmtCount(b[rankMetric.value]) - fmtCount(a[rankMetric.value]))
    .slice(0, 8)
)

const rankMax = computed(() => (rankList.value.length ? fmtCount(rankList.value[0][rankMetric.value]) : 0))

/** 前三名徽标：金 / 银 / 铜；其余浅灰 */
const RANK_BADGE_STYLES = [
  { background: '#f59e0b', color: '#ffffff' },
  { background: '#94a3b8', color: '#ffffff' },
  { background: '#fb923c', color: '#ffffff' },
]

function rankBadgeStyle(index: number) {
  return RANK_BADGE_STYLES[index] || { background: isDark.value ? '#3f3f46' : '#f1f5f9', color: isDark.value ? '#a1a1aa' : '#64748b' }
}

function rankBarWidth(value: any) {
  if (!rankMax.value) return '0%'
  return `${Math.max(2, (fmtCount(value) / rankMax.value) * 100)}%`
}

/* ---------------- 图表：日报数/补录数/图片数柱状 + 填报人数折线（双轴，右轴为人数） ---------------- */
const PALETTE = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e']
const trendRef = ref<any>(null)
const chartFailed = ref(false)
let trendChart: any = null
let chartsReady = false

function buildTrendOption() {
  const trend: any[] = reportData.value?.trend || []
  const isYear = String(reportData.value?.periodType || '').toUpperCase() === 'YEAR'
  return {
    color: PALETTE,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, itemWidth: 14, itemHeight: 10, itemGap: 12, textStyle: { fontSize: 10, color: c('#666', '#9aa6b8') } },
    grid: { left: 8, right: 8, top: 40, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: trend.map((t: any) => {
        const s = String(t.period || '')
        return isYear ? `${Number(s.slice(5, 7))}月` : fmtDateShort(s)
      }),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: c('#e0e3e9', '#3a3a48') } },
      axisLabel: { fontSize: 9, color: c('#666', '#9aa6b8') },
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        minInterval: 1,
        nameTextStyle: { color: c('#999', '#8a94a8'), fontSize: 10, align: 'right' },
        axisLabel: { fontSize: 10, color: c('#666', '#9aa6b8') },
        splitLine: { lineStyle: { color: c('#eef0f3', '#2e2e38') } },
      },
      {
        type: 'value',
        name: '人数',
        minInterval: 1,
        nameTextStyle: { color: c('#999', '#8a94a8'), fontSize: 10, align: 'right' },
        axisLabel: { fontSize: 10, color: c('#666', '#9aa6b8') },
        splitLine: { show: false },
      },
    ],
    series: [
      { name: '日报数', type: 'bar', barMaxWidth: 10, itemStyle: { borderRadius: [3, 3, 0, 0] }, data: trend.map((t: any) => fmtCount(t.reportCount)) },
      { name: '补录数', type: 'bar', barMaxWidth: 10, itemStyle: { borderRadius: [3, 3, 0, 0] }, data: trend.map((t: any) => fmtCount(t.supplementReportCount)) },
      { name: '图片数', type: 'bar', barMaxWidth: 10, itemStyle: { borderRadius: [3, 3, 0, 0] }, data: trend.map((t: any) => fmtCount(t.imageCount)) },
      {
        name: '填报人数',
        type: 'line',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: { borderWidth: 1 },
        data: trend.map((t: any) => fmtCount(t.reporterCount)),
      },
    ],
  }
}

async function initCharts() {
  if (chartFailed.value) return
  try {
    if (!trendChart && trendRef.value?.init) trendChart = await trendRef.value.init(echarts)
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
  } catch (e) {
    console.error('图表更新失败', e)
  }
}

watch(isDark, () => updateCharts())

/* ---------------- 汇总指标卡 ---------------- */
/** 人员卡片圆点调色板（与线索报表页一致） */
const AVATAR_COLORS = ['#1890ff', '#9254de', '#18a058', '#fa8c16', '#eb2f96', '#f5222d', '#14b8a6', '#faad14']
const kpis = computed(() => {
  const s = reportData.value?.summary || {}
  return [
    { label: '有日报人数', value: `${fmtNum(s.reporterCount)} 人`, color: '#3b82f6', bg: 'rgba(59,130,246,.10)' },
    { label: '日报总数', value: `${fmtNum(s.reportCount)} 份`, color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
    { label: '补录日报', value: `${fmtNum(s.supplementReportCount)} 份`, color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
    { label: '日报图片', value: `${fmtNum(s.imageCount)} 张`, color: '#f59e0b', bg: 'rgba(245,158,11,.14)' },
    { label: '填报日期数', value: `${fmtNum(s.reportDayCount)} 天`, color: '#2d8cf0', bg: 'rgba(45,140,240,.10)' },
  ]
})

/* ---------------- 查看详情：跳转日报明细页（复用现有日报分页接口，按人员 + 统计区间过滤） ---------------- */
function openDetail(row: any) {
  uni.navigateTo({
    url:
      `/mePages/personDailyReport/detail?userId=${resolveUid(row) ?? ''}` +
      `&username=${encodeURIComponent(displayName(row) === '-' ? '' : displayName(row))}` +
      `&startTime=${reportData.value?.startTime || ''}` +
      `&endTime=${reportData.value?.endTime || ''}` +
      `&period=${encodeURIComponent(reportData.value?.period || currentPeriod())}` +
      (pid.value ? `&pid=${pid.value}` : ''),
  })
}

onLoad(() => {
  console.log('[日报报表] Index 构建标记 20261021-B')
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
.chip.mini {
  padding: 6rpx 18rpx;
  font-size: 22rpx;
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
  flex: 1;
  border-radius: 12rpx;
  overflow: hidden;
}
.reset-row {
  display: flex;
  align-items: center;
}
.reset-btn {
  font-size: 24rpx;
  color: #4e5969;
  padding: 8rpx 24rpx;
  border-radius: 10rpx;
  background: rgba(128, 128, 128, 0.08);
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

/* 排行榜 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-top: 4rpx;
}
.rank-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.rank-badge {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 600;
  border-radius: 999rpx;
}
.rank-name {
  flex-shrink: 0;
  width: 110rpx;
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-track {
  flex: 1;
  min-width: 0;
  height: 16rpx;
  border-radius: 999rpx;
  overflow: hidden;
}
.rank-bar {
  height: 100%;
  border-radius: 999rpx;
  background: #3b82f6;
  transition: width 0.3s;
}
.rank-value {
  flex-shrink: 0;
  min-width: 64rpx;
  text-align: right;
  font-size: 24rpx;
  font-weight: 600;
}

/* 人员明细卡列表：固定高度内部滚动 */
.p-list {
  height: 960rpx;
}
.p-list .p-card {
  border-radius: 16rpx;
  border: 1rpx solid rgba(128, 128, 128, 0.12);
  padding: 20rpx;
  margin-bottom: 16rpx;
}
.p-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.p-count {
  flex-shrink: 0;
  font-size: 20rpx;
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.1);
  border-radius: 999rpx;
  padding: 6rpx 18rpx;
}
/* 指标网格：三列 */
.p-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx 8rpx;
}
.p-label {
  display: block;
  font-size: 20rpx;
  margin-bottom: 4rpx;
}
.p-value {
  display: block;
  font-size: 26rpx;
  font-weight: 500;
}
.p-times {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;
  font-size: 20rpx;
}
.p-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4rpx;
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.12);
}
.p-detail-link {
  font-size: 24rpx;
  color: #2d8cf0;
}
.list-foot {
  text-align: center;
  padding: 16rpx 0;
  font-size: 22rpx;
}

.bottom-space {
  height: 40rpx;
}

/* 项目筛选触发框 */
.proj-trigger {
  padding: 14rpx 20rpx;
}
.proj-value {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 项目选择弹层：接口搜索（参考项目现场图片页） */
.project-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
}
.project-popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 30rpx 12rpx;
}
.project-popup-title {
  font-size: 32rpx;
  font-weight: 600;
}
.project-list {
  flex: 1;
  min-height: 0;
  padding: 0 30rpx 30rpx;
  box-sizing: border-box;
}
.project-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 16rpx;
  border-bottom: 1rpx solid rgba(128, 128, 128, 0.12);
}
.project-item-name {
  font-size: 28rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-all {
  font-weight: 600;
}
.project-loading {
  display: flex;
  justify-content: center;
  padding: 24rpx 0;
}
.project-empty {
  display: flex;
  justify-content: center;
  padding: 48rpx 0;
  font-size: 24rpx;
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
.page.dark .p-list .p-card {
  border-color: rgba(255, 255, 255, 0.08);
}
.page.dark .p-foot {
  border-top-color: rgba(255, 255, 255, 0.1);
}
.page.dark .p-detail-link {
  color: #69b1ff;
}
.page.dark .tip-title {
  color: #e5e5e5;
}
</style>
