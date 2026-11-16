<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view class="page" :class="{ dark: isDark }">
            <wd-navbar left-arrow title="运营线索报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

            <!-- 筛选卡（参考值班报表）：收起时一行（当前周期 + 筛选入口），展开后编辑周期/创建人 -->
            <view class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                <view class="filter-head">
                    <view class="date-label" @click="handleHeadLabelTap">{{ dateLabel }}</view>
                    <view style="flex: 1"></view>
                    <view class="filter-toggle" :style="{ color: filterCount ? '#1677ff' : subColor }" @click="filterExpanded = !filterExpanded">
                        <text>筛选</text>
                        <text v-if="filterCount" class="f-count">{{ filterCount }}</text>
                        <view class="f-arrow" :class="{ open: filterExpanded }">
                            <wd-icon name="arrow-down" size="12px" />
                        </view>
                    </view>
                </view>

                <view v-if="filterExpanded" class="filter-body">
                    <!-- 统计周期：全部/年度/月度，‹›步进自动查询（按线索发生日期，本月可查） -->
                    <view class="f-row">
                        <text class="f-label">周期</text>
                        <view class="f-controls">
                            <view v-for="opt in timeModeOptions" :key="opt.value" class="chip" :class="{ active: timeMode === opt.value }" @click="handleTimeModeChange(opt.value)">{{ opt.label }}</view>
                            <view v-if="timeMode !== 'all'" class="time-stepper">
                                <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepDate(-1)">
                                    <wd-icon name="arrow-left" size="14px" />
                                </view>
                                <view class="date-label small" @click="openDatePicker">{{ dateLabel }}</view>
                                <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepDate(1)">
                                    <wd-icon name="arrow-right" size="14px" />
                                </view>
                            </view>
                        </view>
                    </view>
                    <!-- 创建人（运营 usertype=12）：单选，确认即查询；label 外置与「周期」同列对齐 -->
                    <view class="f-row">
                        <text class="f-label">创建人</text>
                        <view class="f-controls">
                            <view class="select-box" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
                                <wd-select-picker v-model="createdBy" type="radio" :columns="creatorOptions" placeholder="全部创建人" title="选择创建人" @confirm="handleCreatorConfirm" />
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
                ref="datePickerRef"
                v-model="datePickerValue"
                :type="timeMode === 'year' ? 'year' : 'year-month'"
                :max-date="datePickerMax"
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
                            <text class="tip-value" :style="{ color: textColor }">{{ periodLabel }}</text>
                        </view>
                        <view class="tip-item">
                            <text class="tip-label">统计口径</text>
                            <text class="tip-value" :style="{ color: textColor }">按创建人分组，按线索发生日期（date）落入统计期筛选，排除已删除线索。</text>
                        </view>
                        <view class="tip-item">
                            <text class="tip-label">结果状态</text>
                            <text class="tip-value" :style="{ color: textColor }">各结果状态统计的是线索「当前」的最新结果状态，无历史快照。</text>
                        </view>
                        <view class="tip-item">
                            <text class="tip-label">有效＋成交</text>
                            <text class="tip-value" :style="{ color: textColor }">= 有效数＋成交数，仅为汇总指标，不重复计入总线索数。</text>
                        </view>
                    </scroll-view>
                </view>
            </wd-popup>

            <scroll-view :scroll-y="true" class="content-scroll">
                <view class="content-inner">
                    <!-- 线索汇总：总量 + 结果状态构成（比例条 + 图例） + 有效＋成交 -->
                    <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                        <view class="card-header">
                            <view class="title-bar" style="background: #1890ff"></view>
                            <text class="card-title" :style="{ color: textColor }">线索汇总</text>
                            <view style="flex: 1"></view>
                            <text class="card-sub" :style="{ color: subColor }">共 {{ summary.creator_count ?? creators.length }} 位创建人</text>
                        </view>
                        <view class="sum-hero">
                            <view class="sum-hero-item">
                                <text class="sum-hero-label" :style="{ color: subColor }">总线索数</text>
                                <text class="sum-hero-value" :style="{ color: '#1890ff' }">{{ fmtNum(summary.total_count) }}</text>
                            </view>
                            <view class="sum-hero-split"></view>
                            <view class="sum-hero-item">
                                <text class="sum-hero-label" :style="{ color: subColor }">有效＋成交</text>
                                <view class="sum-hero-value-row">
                                    <text class="sum-hero-value" :style="{ color: '#14b8a6' }">{{ fmtNum(summary.valid_plus_deal_count) }}</text>
                                    <text class="sum-hero-pct" :style="{ color: subColor }">{{ fmtPct(summary.valid_plus_deal_count, summary.total_count) }}</text>
                                </view>
                            </view>
                        </view>
                        <view v-if="statusSegments.length" class="sum-bar">
                            <view v-for="seg in statusSegments" :key="seg.key" class="sum-bar-seg" :style="{ width: seg.width, background: seg.color }"></view>
                        </view>
                        <view class="sum-legend">
                            <view v-for="s in STATUS_METRICS" :key="s.key" class="sum-legend-row">
                                <view class="sum-dot" :style="{ background: s.color }"></view>
                                <text class="sum-legend-name" :style="{ color: textColor }">{{ s.label }}</text>
                                <view style="flex: 1"></view>
                                <text class="sum-legend-count" :style="{ color: textColor }">{{ fmtNum(summary[s.key]) }}</text>
                                <text class="sum-legend-pct" :style="{ color: subColor }">{{ fmtPct(summary[s.key], summary.total_count) }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 创建人线索统计：按总线索数倒序；前五格状态之和=总线索数（占比可相加），有效＋成交为衍生指标高亮区分 -->
                    <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                        <view class="card-header">
                            <view class="title-bar" style="background: #1890ff"></view>
                            <text class="card-title" :style="{ color: textColor }">创建人线索统计</text>
                            <view style="flex: 1"></view>
                            <view class="info-link" @click="tipShow = true">口径说明</view>
                        </view>
                        <view v-if="creators.length" class="cr-list">
                            <view v-for="(row, idx) in creators" :key="String(row.created_by)" class="cr-card" :style="{ background: isDark ? '#333333' : '#fafbfc' }">
                                <view class="cr-head">
                                    <view class="cr-avatar" :style="{ background: avatarColor(idx) }">{{ avatarText(row.created_by_name) }}</view>
                                    <view class="cr-name-wrap">
                                        <text class="cr-name" :style="{ color: textColor }">{{ row.created_by_name || `ID:${row.created_by}` }}</text>
                                        <text v-if="creators.length > 1" class="cr-rank" :style="{ color: subColor }">No.{{ idx + 1 }}</text>
                                    </view>
                                    <view style="flex: 1"></view>
                                    <view class="cr-total">
                                        <text class="cr-total-num" :style="{ color: '#1890ff' }">{{ fmtNum(row.total_count) }}</text>
                                        <text class="cr-total-label" :style="{ color: subColor }">总线索数</text>
                                    </view>
                                </view>
                                <view class="cr-bar">
                                    <view v-for="seg in rowSegments(row)" :key="seg.key" class="cr-bar-seg" :style="{ width: seg.width, background: seg.color }"></view>
                                </view>
                                <view class="cr-grid">
                                    <view v-for="m in creatorMetrics" :key="m.key" class="cr-cell" :class="{ hl: m.hl }">
                                        <view class="cr-cell-label">
                                            <view class="cr-dot" :style="{ background: m.color }"></view>
                                            <text :style="{ color: subColor }">{{ m.label }}</text>
                                        </view>
                                        <text class="cr-cell-value" :style="{ color: m.color, fontWeight: m.hl ? 700 : 500 }">{{ fmtNum(row[m.key]) }}</text>
                                        <text class="cr-cell-pct" :style="{ color: subColor }">{{ fmtPct(row[m.key], row.total_count) }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>
                        <view v-else class="card-empty" :style="{ color: subColor }">暂无数据</view>
                    </view>

                    <!-- 创建人有效＋成交数量对比（横向条形图，条目数随创建人增长） -->
                    <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                        <view class="card-header">
                            <view class="title-bar" style="background: #14b8a6"></view>
                            <text class="card-title" :style="{ color: textColor }">创建人有效＋成交数量对比</text>
                        </view>
                        <l-echart v-if="!chartFailed && creators.length" :key="barKey" ref="barRef" :lStyle="barStyle" />
                        <view v-else-if="chartFailed" class="chart-fallback" :style="{ color: subColor }">图表加载失败，数据请参考上方统计</view>
                        <view v-else class="chart-fallback" :style="{ color: subColor }">暂无创建人数据</view>
                    </view>

                    <!-- 渠道来源统计：空渠道显示「未填写」；后端只统计 NORMAL/CONFIRMED_UNIQUE（2026-10-14） -->
                    <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                        <view class="card-header">
                            <view class="title-bar" style="background: #409cff"></view>
                            <text class="card-title" :style="{ color: textColor }">渠道来源统计</text>
                            <view style="flex: 1"></view>
                            <text class="card-sub" :style="{ color: subColor }">共 {{ summary.channel_count ?? channels.length }} 个渠道</text>
                        </view>
                        <view v-if="channels.length" class="cr-list">
                            <view v-for="(row, idx) in channels" :key="String(row.channel_code || 'none')" class="cr-card" :style="{ background: isDark ? '#333333' : '#fafbfc' }">
                                <view class="cr-head">
                                    <view class="cr-avatar" :style="{ background: avatarColor(idx) }">{{ avatarText(channelName(row)) }}</view>
                                    <view class="cr-name-wrap">
                                        <text class="cr-name" :style="{ color: textColor }">{{ channelName(row) }}</text>
                                        <text v-if="channels.length > 1" class="cr-rank" :style="{ color: subColor }">No.{{ idx + 1 }}</text>
                                    </view>
                                    <view style="flex: 1"></view>
                                    <view class="cr-total">
                                        <text class="cr-total-num" :style="{ color: '#409cff' }">{{ fmtNum(row.total_count) }}</text>
                                        <text class="cr-total-label" :style="{ color: subColor }">总线索数</text>
                                    </view>
                                </view>
                                <view class="cr-bar">
                                    <view v-for="seg in rowSegments(row)" :key="seg.key" class="cr-bar-seg" :style="{ width: seg.width, background: seg.color }"></view>
                                </view>
                                <view class="cr-grid">
                                    <view v-for="m in creatorMetrics" :key="m.key" class="cr-cell" :class="{ hl: m.hl }">
                                        <view class="cr-cell-label">
                                            <view class="cr-dot" :style="{ background: m.color }"></view>
                                            <text :style="{ color: subColor }">{{ m.label }}</text>
                                        </view>
                                        <text class="cr-cell-value" :style="{ color: m.color, fontWeight: m.hl ? 700 : 500 }">{{ fmtNum(row[m.key]) }}</text>
                                        <text class="cr-cell-pct" :style="{ color: subColor }">{{ fmtPct(row[m.key], row.total_count) }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>
                        <view v-else class="card-empty" :style="{ color: subColor }">暂无数据</view>
                    </view>

                    <!-- 渠道数量对比：总线索数 + 有效＋成交 双系列横向条形图 -->
                    <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                        <view class="card-header">
                            <view class="title-bar" style="background: #14b8a6"></view>
                            <text class="card-title" :style="{ color: textColor }">渠道数量对比</text>
                        </view>
                        <l-echart v-if="!chartFailed && channels.length" :key="chBarKey" ref="chBarRef" :lStyle="chBarStyle" />
                        <view v-else-if="chartFailed" class="chart-fallback" :style="{ color: subColor }">图表加载失败，数据请参考上方统计</view>
                        <view v-else class="chart-fallback" :style="{ color: subColor }">暂无渠道数据</view>
                    </view>

                    <!-- 页脚口径说明 -->
                    <view class="foot-note" :style="{ color: subColor }">
                        统计口径：按创建人分组，按线索发生日期筛选，统计当前结果状态。｜有效＋成交 = 有效数＋成交数，仅为汇总指标，不重复计入总线索数。｜渠道来源只统计正常与已确认非重复线索，空渠道显示为「未填写」。
                    </view>

                    <view class="bottom-space" />
                </view>
            </scroll-view>
        </view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { onLoad, onReady } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
// 项目未通过 npm 安装 echarts，使用 lime-echart 自带的 ESM 构建双端可用
import * as echarts from '@/uni_modules/lime-echart/static/web/echarts.esm.min.js'
import { fetchLeadReport } from '@/service/leadReport'
import { fetchActiveUsers } from '../user-map'

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
/** 占比：分母为总线索数；总数为 0 时显示 --，不显示误导性的 0.0% */
function fmtPct(count: any, total: any) {
    const t = Number(total)
    if (!t) return '--'
    return `${((Number(count || 0) / t) * 100).toFixed(1)}%`
}

/* ---------------- 统计周期：全部 / 年度 / 月度（按线索发生日期，本月可查） ---------------- */
const timeModeOptions = [
    { label: '全部', value: 'all' },
    { label: '年度', value: 'year' },
    { label: '月度', value: 'month' }
]
const timeMode = ref<'all' | 'year' | 'month'>('month')
const yearNum = ref(new Date().getFullYear())
// 默认查本月（对齐 web leadReport：月模式不禁本月，仅禁未来月）
const monthSel = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)

/** 解析 'yyyy-MM' 为当月 1 号 */
function parseMonth(s: string) {
    const [y, m] = String(s).split('-').map(Number)
    return new Date(y || new Date().getFullYear(), (m || 1) - 1, 1)
}
/** Date → 'yyyy-MM' */
function formatMonth(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
/** 月序号（年*12+月），用于比较月份先后 */
function monthIndex(d: Date) {
    return d.getFullYear() * 12 + d.getMonth()
}
function currentMonthStr() {
    return formatMonth(new Date())
}

/* ---------------- 筛选展开/收起 + 周期标签（参考值班报表：收起一行，展开编辑） ---------------- */
const filterExpanded = ref(false)
const tipShow = ref(false)

/** 周期显示值：全部时间 / yyyy年 / yyyy年M月 */
const dateLabel = computed(() => {
    if (timeMode.value === 'all') return '全部时间'
    if (timeMode.value === 'year') return `${yearNum.value}年`
    const [y, m] = monthSel.value.split('-')
    return `${y}年${Number(m)}月`
})

const datePickerRef = ref<any>(null)
const datePickerValue = ref(new Date().getTime())
/** 月模式止于本月（本月可查），年度模式不限未来年份 */
const datePickerMax = computed(() => {
    if (timeMode.value === 'year') return new Date(2099, 11, 31).getTime()
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime()
})
/** wd-datetime-picker 无 show prop，弹层只能通过暴露的 open() 打开 */
function openDatePicker() {
    datePickerValue.value =
        timeMode.value === 'year' ? new Date(yearNum.value, 0, 1).getTime() : parseMonth(monthSel.value || currentMonthStr()).getTime()
    datePickerRef.value?.open()
}
/** 收起态点周期标签：全部模式引导展开筛选，其余直接打开日期弹层 */
function handleHeadLabelTap() {
    if (timeMode.value === 'all') {
        filterExpanded.value = true
    } else {
        openDatePicker()
    }
}
function handleDateConfirm({ value }: any) {
    const d = new Date(value)
    if (timeMode.value === 'year') {
        yearNum.value = d.getFullYear()
    } else {
        monthSel.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        yearNum.value = d.getFullYear()
    }
    loadData()
}

/** 切换周期并立即查询：月模式若已选月份在未来则回落到本月 */
function handleTimeModeChange(v: 'all' | 'year' | 'month') {
    if (timeMode.value === v) return
    timeMode.value = v
    if (v === 'month') {
        if (!monthSel.value || monthIndex(parseMonth(monthSel.value)) > monthIndex(new Date())) {
            monthSel.value = currentMonthStr()
        }
        yearNum.value = Number(monthSel.value.split('-')[0]) || yearNum.value
    }
    loadData()
}

/** 箭头按当前粒度步进（全部模式不展示箭头）；月份不能步进到本月之后 */
function stepDate(step: 1 | -1) {
    if (timeMode.value === 'year') {
        yearNum.value += step
        loadData()
        return
    }
    const base = monthSel.value ? parseMonth(monthSel.value) : new Date()
    const nd = new Date(base.getFullYear(), base.getMonth() + step, 1)
    if (monthIndex(nd) > monthIndex(new Date())) {
        uni.showToast({ title: '月份只能查询本月及以前', icon: 'none' })
        return
    }
    monthSel.value = formatMonth(nd)
    yearNum.value = nd.getFullYear()
    loadData()
}

/* ---------------- 创建人筛选（运营人员，与线索列表创建人筛选同口径：usertype=12） ---------------- */
const ALL_CREATOR = { label: '全部创建人', value: 0 }
const createdBy = ref(0)
const creatorOptions = ref<any[]>([ALL_CREATOR])
/** 头部筛选角标：仅统计创建人（周期恒有值不计入） */
const filterCount = computed(() => (createdBy.value > 0 ? 1 : 0))
async function loadCreatorOptions() {
    try {
        const operations: any[] = (await fetchActiveUsers('12')) || []
        creatorOptions.value = [ALL_CREATOR, ...operations.map((u: any) => ({ label: u.username, value: u.id }))]
    } catch (e) {
        console.error('获取创建人列表失败', e)
    }
}
/** wd-select-picker 确认时 v-model 已更新，这里只需重查 */
function handleCreatorConfirm() {
    loadData()
}

/** 重置：回到默认（本月 + 全部创建人）并查询 */
function handleReset() {
    timeMode.value = 'month'
    yearNum.value = new Date().getFullYear()
    monthSel.value = currentMonthStr()
    createdBy.value = 0
    loadData()
}

/* ---------------- 数据加载：一次请求返回整页（summary + creators + filters） ---------------- */
const report = ref<any | null>(null)
const listLoading = ref(false)
let reqSeq = 0

async function loadData() {
    const seq = ++reqSeq
    listLoading.value = true
    uni.showLoading({ title: '查询中...', mask: true })
    try {
        const params: any = { scope: 'ALL' }
        if (timeMode.value !== 'all') {
            const y = Number(yearNum.value)
            if (Number.isInteger(y) && y >= 1900 && y <= 2100) params.year = y
        }
        if (timeMode.value === 'month' && monthSel.value) params.month = Number(monthSel.value.split('-')[1])
        if (createdBy.value > 0) params.created_by = createdBy.value
        const data: any = await fetchLeadReport(params)
        if (seq !== reqSeq) return
        report.value = data || null
        // 创建人数量变化会触发图表重挂载（:key），等渲染完成后再初始化
        await nextTick()
        initCharts()
    } catch (e) {
        console.error('获取运营线索报表失败', e)
        if (seq === reqSeq) report.value = null
    } finally {
        if (seq === reqSeq) {
            listLoading.value = false
            uni.hideLoading()
        }
    }
}

/* ---------------- 展示数据 ---------------- */
const summary = computed<any>(() => report.value?.summary || {})
/** 创建人按总线索数倒序，明细列表与图表共用同一顺序 */
const creators = computed<any[]>(() => {
    const list = [...(report.value?.creators || [])]
    list.sort((a: any, b: any) => (Number(b.total_count) || 0) - (Number(a.total_count) || 0))
    return list
})

/** 渠道按总线索数倒序、渠道名升序（对齐 web）；只统计 NORMAL/CONFIRMED_UNIQUE（后端口径） */
const channels = computed<any[]>(() => {
    const list = [...(report.value?.channels || [])]
    list.sort((a: any, b: any) => (Number(b.total_count) || 0) - (Number(a.total_count) || 0) || String(a.channel_code || '').localeCompare(String(b.channel_code || '')))
    return list
})
/** 渠道名：channel_code 为空显示「未填写」 */
function channelName(row: any) {
    return row.channel_code || '未填写'
}

/** 统计时间描述（按后端实际生效的 filters 生成） */
const periodLabel = computed(() => {
    const f = report.value?.filters
    if (!f || !f.year) return '全部时间'
    if (!f.month) return `${f.year}-01-01 至 ${f.year}-12-31`
    const last = new Date(f.year, f.month, 0).getDate()
    const mm = String(f.month).padStart(2, '0')
    return `${f.year}-${mm}-01 至 ${f.year}-${mm}-${String(last).padStart(2, '0')}`
})

/* ---------------- 结果状态构成：比例条 + 图例（五类状态之和 = 总线索数） ---------------- */
const STATUS_METRICS = [
    { key: 'valid_count', label: '有效', color: '#18a058' },
    { key: 'deal_count', label: '成交', color: '#9254de' },
    { key: 'unassessed_count', label: '未评估', color: '#faad14' },
    { key: 'invalid_count', label: '无效', color: '#f5222d' },
    { key: 'other_count', label: '其他', color: '#909399' }
]
/** 汇总比例条：仅渲染占比 > 0 的分段 */
const statusSegments = computed(() => {
    const total = Number(summary.value.total_count) || 0
    if (!total) return []
    return STATUS_METRICS.map((s) => ({ key: s.key, color: s.color, width: `${((Number(summary.value[s.key]) || 0) / total) * 100}%` })).filter((s) => parseFloat(s.width) > 0)
})
/** 单个创建人的构成比例条 */
function rowSegments(row: any) {
    const total = Number(row?.total_count) || 0
    if (!total) return []
    return STATUS_METRICS.map((s) => ({ key: s.key, color: s.color, width: `${((Number(row[s.key]) || 0) / total) * 100}%` })).filter((s) => parseFloat(s.width) > 0)
}

/* ---------------- 创建人统计：前五类状态之和=总线索数，有效＋成交为衍生指标（hl 高亮区分） ---------------- */
const creatorMetrics = [
    { key: 'valid_count', label: '有效', color: '#18a058' },
    { key: 'deal_count', label: '成交', color: '#9254de' },
    { key: 'unassessed_count', label: '未评估', color: '#faad14' },
    { key: 'invalid_count', label: '无效', color: '#f5222d' },
    { key: 'other_count', label: '其他', color: '#909399' },
    { key: 'valid_plus_deal_count', label: '有效＋成交', color: '#14b8a6', hl: true }
]

/** 头像底色按名次取色 */
const AVATAR_COLORS = ['#1890ff', '#9254de', '#18a058', '#fa8c16', '#eb2f96', '#f5222d', '#14b8a6', '#faad14']
function avatarColor(idx: number) {
    return AVATAR_COLORS[Math.abs(idx) % AVATAR_COLORS.length]
}
/** 头像字：取姓名首字符 */
function avatarText(name: any) {
    return String(name || '?').trim().charAt(0) || '?'
}

/* ---------------- 图表：创建人有效＋成交数量对比（横向条形图） ---------------- */
const barRef = ref<any>(null)
const chartFailed = ref(false)
let barChart: any = null
/** 已初始化图表对应的创建人数量（数量变化 → :key 重挂载 → 需重新 init） */
let barChartKey = -1
const barKey = computed(() => creators.value.length)
/** 图表高度随创建人数量增长，保证条目不挤压（px 对齐 web：max(280, n*46+60)） */
const barStyle = computed(() => `height: ${Math.max(280, creators.value.length * 46 + 60)}px; width: 100%;`)

function buildBarOption() {
    // category 轴自下而上绘制，倒序使第 1 名显示在最上方
    const ordered = [...creators.value].reverse()
    return {
        grid: { left: 8, right: 46, top: 30, bottom: 0, containLabel: true },
        legend: {
            data: ['有效＋成交'],
            right: 8,
            top: 0,
            itemWidth: 12,
            itemHeight: 12,
            textStyle: { fontSize: 11, color: c('#666', '#9aa6b8') }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
                const p = Array.isArray(params) ? params[0] : params
                const row = ordered[p.dataIndex]
                return `${p.name}：${fmtNum(p.value)}（占比 ${fmtPct(p.value, row?.total_count)}）`
            }
        },
        xAxis: {
            type: 'value',
            minInterval: 1,
            name: '数量',
            nameTextStyle: { fontSize: 10, color: c('#999', '#8a94a8') },
            axisLabel: { fontSize: 10, color: c('#666', '#9aa6b8') },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: c('#eef0f3', 'rgba(255,255,255,0.09)') } }
        },
        yAxis: {
            type: 'category',
            data: ordered.map((r: any) => r.created_by_name || `ID:${r.created_by}`),
            axisTick: { show: false },
            axisLine: { lineStyle: { color: c('#e5e7eb', '#3a3a48') } },
            axisLabel: { fontSize: 13, color: c('#33415c', '#b3bdcc') }
        },
        series: [
            {
                name: '有效＋成交',
                type: 'bar',
                barWidth: 14,
                itemStyle: {
                    borderRadius: [0, 6, 6, 0],
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: [
                            { offset: 0, color: '#2dd4bf' },
                            { offset: 1, color: '#0d9488' }
                        ]
                    }
                },
                label: { show: true, position: 'right', color: c('#1f2d3d', '#e2e8f0'), fontWeight: 600, fontSize: 11 },
                data: ordered.map((r: any) => Number(r.valid_plus_deal_count) || 0)
            }
        ]
    }
}

/* ---------------- 图表：渠道数量对比（横向条形图，总线索数 + 有效＋成交 双系列） ---------------- */
const chBarRef = ref<any>(null)
let chBarChart: any = null
/** 已初始化图表对应的渠道数量（数量变化 → :key 重挂载 → 需重新 init） */
let chBarChartKey = -1
const chBarKey = computed(() => channels.value.length)
/** 双系列每渠道占两条条形，高度随渠道数量增长 */
const chBarStyle = computed(() => `height: ${Math.max(300, channels.value.length * 56 + 60)}px; width: 100%;`)

function buildChBarOption() {
    // category 轴自下而上绘制，倒序使第 1 名显示在最上方
    const ordered = [...channels.value].reverse()
    const seriesColor = (from: string, to: string) => ({
        type: 'linear',
        x: 0,
        y: 0,
        x2: 1,
        y2: 0,
        colorStops: [
            { offset: 0, color: from },
            { offset: 1, color: to }
        ]
    })
    return {
        grid: { left: 8, right: 46, top: 30, bottom: 0, containLabel: true },
        legend: {
            data: ['总线索数', '有效＋成交'],
            right: 8,
            top: 0,
            itemWidth: 12,
            itemHeight: 12,
            textStyle: { fontSize: 11, color: c('#666', '#9aa6b8') }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        xAxis: {
            type: 'value',
            minInterval: 1,
            name: '数量',
            nameTextStyle: { fontSize: 10, color: c('#999', '#8a94a8') },
            axisLabel: { fontSize: 10, color: c('#666', '#9aa6b8') },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: c('#eef0f3', 'rgba(255,255,255,0.09)') } }
        },
        yAxis: {
            type: 'category',
            data: ordered.map((r: any) => channelName(r)),
            axisTick: { show: false },
            axisLine: { lineStyle: { color: c('#e5e7eb', '#3a3a48') } },
            axisLabel: { fontSize: 13, color: c('#33415c', '#b3bdcc') }
        },
        series: [
            {
                name: '总线索数',
                type: 'bar',
                barWidth: 12,
                itemStyle: { borderRadius: [0, 6, 6, 0], color: seriesColor('#409cff', '#1668dc') },
                label: { show: true, position: 'right', color: c('#1f2d3d', '#e2e8f0'), fontWeight: 600, fontSize: 11 },
                data: ordered.map((r: any) => Number(r.total_count) || 0)
            },
            {
                name: '有效＋成交',
                type: 'bar',
                barWidth: 12,
                itemStyle: { borderRadius: [0, 6, 6, 0], color: seriesColor('#2dd4bf', '#0d9488') },
                label: { show: true, position: 'right', color: c('#1f2d3d', '#e2e8f0'), fontWeight: 600, fontSize: 11 },
                data: ordered.map((r: any) => Number(r.valid_plus_deal_count) || 0)
            }
        ]
    }
}

async function initCharts() {
    if (chartFailed.value) return
    try {
        if ((!barChart || barChartKey !== barKey.value) && barRef.value?.init) {
            barChart = await barRef.value.init(echarts)
            barChartKey = barKey.value
        }
        barChart?.setOption(buildBarOption(), true)
        if ((!chBarChart || chBarChartKey !== chBarKey.value) && chBarRef.value?.init) {
            chBarChart = await chBarRef.value.init(echarts)
            chBarChartKey = chBarKey.value
        }
        chBarChart?.setOption(buildChBarOption(), true)
    } catch (e) {
        console.error('图表初始化失败', e)
        chartFailed.value = true
    }
}

/** 暗黑切换后仅重推含主题色的配置（数量未变无需重建实例） */
watch(isDark, () => {
    try {
        barChart?.setOption(buildBarOption(), true)
        chBarChart?.setOption(buildChBarOption(), true)
    } catch (e) {
        console.error('图表更新失败', e)
    }
})

onLoad(() => {
    loadCreatorOptions()
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
    height: 56rpx;
    font-size: 24rpx;
    padding: 0 16rpx;
    box-sizing: border-box;
    border-radius: 10rpx;
    background: rgba(128, 128, 128, 0.08);
}
.f-count {
    min-width: 30rpx;
    height: 30rpx;
    line-height: 30rpx;
    text-align: center;
    border-radius: 999rpx;
    background: #1677ff;
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
    width: 112rpx;
    font-size: 24rpx;
    color: #64748b;
    line-height: 56rpx;
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
    height: 56rpx;
    padding: 0 24rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
.time-stepper {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
}
.step-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4e5969;
}
.date-label {
    min-width: 160rpx;
    height: 56rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0 20rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #1677ff;
    border-radius: 12rpx;
    background: rgba(22, 119, 255, 0.06);
}
.date-label.small {
    min-width: 150rpx;
    font-size: 26rpx;
    padding: 0 16rpx;
}
.select-box {
    flex: 1;
    min-width: 0;
    height: 56rpx;
    border-radius: 12rpx;
    overflow: hidden;
}
/* 选择框高度与 chip/步进器统一为 56rpx，内容垂直居中 */
.select-box :deep(.wd-select-picker__cell) {
    height: 56rpx;
    padding: 0 20rpx;
    display: flex;
    align-items: center;
}
.reset-row {
    display: flex;
    align-items: center;
}
.reset-btn {
    font-size: 24rpx;
    color: #1677ff;
    padding: 8rpx 24rpx;
    border-radius: 999rpx;
    background: rgba(22, 119, 255, 0.08);
}

/* 隐藏 datetime-picker 自带的触发 cell */
:deep(.wd-datetime-picker__cell) {
    display: none;
}
.info-link {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #1677ff;
    padding: 4rpx 12rpx;
}
.page.dark .info-link {
    color: #69b1ff;
}
.page.dark .filter-toggle {
    background: rgba(255, 255, 255, 0.08);
}
.page.dark .chip:not(.active) {
    color: #a8b3c0;
}
.page.dark .f-label {
    color: #9aa0a8;
}
.page.dark .step-btn {
    color: #a8abb3;
}
.page.dark .date-label {
    color: #69b1ff;
    background: rgba(22, 119, 255, 0.16);
}

.content-scroll {
    flex: 1;
    min-height: 0;
}
.content-inner {
    padding: 20rpx;
}

/* 线索汇总：双指标 + 构成比例条 + 图例 */
.sum-hero {
    display: flex;
    align-items: stretch;
}
.sum-hero-item {
    flex: 1;
    min-width: 0;
}
.sum-hero-split {
    flex-shrink: 0;
    width: 1rpx;
    background: rgba(128, 128, 128, 0.15);
    margin: 6rpx 24rpx;
}
.sum-hero-label {
    display: block;
    font-size: 24rpx;
    margin-bottom: 8rpx;
}
.sum-hero-value-row {
    display: flex;
    align-items: baseline;
    gap: 10rpx;
}
.sum-hero-value {
    font-size: 44rpx;
    font-weight: 700;
    line-height: 1.1;
}
.sum-hero-pct {
    font-size: 24rpx;
}
.sum-bar {
    margin-top: 20rpx;
    height: 16rpx;
    border-radius: 999rpx;
    overflow: hidden;
    display: flex;
    gap: 2rpx;
    background: rgba(128, 128, 128, 0.1);
}
.sum-bar-seg {
    height: 100%;
}
.sum-legend {
    margin-top: 18rpx;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14rpx 20rpx;
}
.sum-legend-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    min-width: 0;
}
.sum-dot {
    flex-shrink: 0;
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
}
.sum-legend-name {
    flex-shrink: 0;
    font-size: 26rpx;
}
.sum-legend-count {
    font-size: 26rpx;
    font-weight: 600;
}
.sum-legend-pct {
    font-size: 24rpx;
    min-width: 88rpx;
    text-align: right;
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
.card-sub {
    font-size: 24rpx;
}
.card-empty {
    text-align: center;
    padding: 50rpx 0;
    font-size: 26rpx;
}
.chart-fallback {
    text-align: center;
    padding: 60rpx 0;
    font-size: 24rpx;
}

/* 创建人统计卡 */
.cr-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}
.cr-card {
    border-radius: 16rpx;
    padding: 20rpx;
}
.cr-head {
    display: flex;
    align-items: center;
    gap: 14rpx;
}
.cr-avatar {
    flex-shrink: 0;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    color: #ffffff;
    font-size: 24rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
}
.cr-name-wrap {
    display: flex;
    align-items: baseline;
    gap: 10rpx;
    min-width: 0;
}
.cr-name {
    min-width: 0;
    font-size: 30rpx;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.cr-rank {
    flex-shrink: 0;
    font-size: 22rpx;
}
.cr-total {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}
.cr-total-num {
    font-size: 34rpx;
    font-weight: 700;
    line-height: 1.2;
}
.cr-total-label {
    font-size: 22rpx;
}
.cr-bar {
    margin-top: 14rpx;
    height: 12rpx;
    border-radius: 999rpx;
    overflow: hidden;
    display: flex;
    gap: 2rpx;
    background: rgba(128, 128, 128, 0.1);
}
.cr-bar-seg {
    height: 100%;
}
.cr-grid {
    margin-top: 16rpx;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14rpx 12rpx;
}
.cr-cell {
    min-width: 0;
}
/* 衍生指标（有效＋成交）高亮底色；padding+负 margin 保持与邻格等宽不破坏网格 */
.cr-cell.hl {
    background: rgba(20, 184, 166, 0.1);
    border-radius: 12rpx;
    padding: 8rpx 10rpx;
    margin: -8rpx -10rpx;
}
.cr-cell-label {
    display: flex;
    align-items: center;
    gap: 6rpx;
    font-size: 22rpx;
    margin-bottom: 4rpx;
}
.cr-dot {
    flex-shrink: 0;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
}
.cr-cell-value {
    display: block;
    font-size: 30rpx;
    font-weight: 500;
}
.cr-cell-pct {
    display: block;
    font-size: 22rpx;
    margin-top: 2rpx;
}

/* 页脚口径说明 */
.foot-note {
    font-size: 22rpx;
    line-height: 1.6;
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
</style>
