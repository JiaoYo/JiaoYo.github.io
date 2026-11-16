<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page" :class="{ dark: isDark }">
      <wd-navbar left-arrow title="周期完成率报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <!-- 统计口径：项目送审 / 项目完成，切换重新查询 -->
      <view class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="filter-head">
          <view class="seg">
            <view
              v-for="m in reportTypeOptions"
              :key="m.value"
              class="seg-item"
              :class="{ active: reportType === m.value }"
              @click="handleReportTypeChange(m.value)"
            >
              {{ m.label }}
            </view>
          </view>
          <view style="flex: 1"></view>
          <view class="filter-toggle" :style="{ color: filterCount ? '#2d8cf0' : subColor }" @click="filterExpanded = !filterExpanded">
            <text>筛选</text>
            <text v-if="filterCount" class="f-count">{{ filterCount }}</text>
            <view class="f-arrow" :class="{ open: filterExpanded }">
              <wd-icon name="arrow-down" size="12px" />
            </view>
          </view>
        </view>
        <view class="mode-tip-line" :style="{ color: subColor }">{{ modeTip }}</view>
        <view v-if="isReviewMode && reviewedEmpty" class="review-tip" :style="{ color: '#f0a020' }">
          当前筛选范围内暂无送审项目：项目送审时间落在查询区间才会纳入该口径
        </view>

        <!-- 查询区间：年/月粒度 + 箭头步进 + 自定义起止月（始终显示，不折叠） -->
        <view class="f-row time-row">
          <text class="f-label">时间</text>
          <view class="f-controls time-controls">
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
            <view v-if="dateType !== 'custom'" class="date-step-group">
              <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepDate(-1)">
                <wd-icon name="arrow-left" size="14px" />
              </view>
              <view class="date-label" @click="openDatePicker">{{ dateLabel }}</view>
              <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepDate(1)">
                <wd-icon name="arrow-right" size="14px" />
              </view>
            </view>
          </view>
        </view>
        <!-- 自定义起止月 -->
        <view v-if="dateType === 'custom'" class="f-row">
          <text class="f-label">起止</text>
          <view class="f-controls">
            <view class="date-label" @click="openRangePicker('start')">{{ startMonth || '开始月' }}</view>
            <text :style="{ color: subColor }">~</text>
            <view class="date-label" @click="openRangePicker('end')">{{ endMonth || '结束月' }}</view>
          </view>
        </view>

        <view v-if="filterExpanded" class="filter-body">
          <!-- 调试类型 -->
          <view class="f-row">
            <text class="f-label">类型</text>
            <view class="f-controls">
              <view
                v-for="t in debugTypeOptions"
                :key="t.value"
                class="chip"
                :class="{ active: selectedDebugTypes.includes(t.value) }"
                :style="selectedDebugTypes.includes(t.value) ? '' : { background: isDark ? '#383838' : '#f5f6f8' }"
                @click="toggleDebugType(t.value)"
              >
                {{ t.label }}
              </view>
            </view>
          </view>

          <!-- 人员筛选：责任人多选 -->
          <view class="f-row">
            <text class="f-label">人员</text>
            <view class="f-controls">
              <text class="mode-tip">{{ selectedText }}</text>
              <view v-if="selectedUserIds.length" class="clear-btn" @click="handleClearUsers">清空</view>
            </view>
          </view>
          <view class="person-scroll">
            <view class="person-list">
              <view
                v-for="u in userOptions"
                :key="u.value"
                class="person-chip"
                :class="{ active: selectedUserIds.includes(u.value) }"
                @click="toggleUser(u.value)"
              >
                {{ u.label }}
              </view>
            </view>
            <view v-if="!userOptions.length" class="person-empty" :style="{ color: subColor }">人员列表加载中或为空</view>
          </view>
        </view>
      </view>

      <!-- 年/月选择器 -->
      <wd-datetime-picker
        ref="datePickerRef"
        v-model="datePickerValue"
        :type="dateType === 'year' ? 'year' : 'year-month'"
        title="选择日期"
        @confirm="handleDateConfirm"
      />
      <!-- 起止月选择器 -->
      <wd-datetime-picker ref="rangePickerRef" v-model="rangePickerValue" type="year-month" title="选择月份" @confirm="handleRangeConfirm" />

      <!-- 口径说明弹框 -->
      <wd-popup closable v-model="tipShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="tip-sheet" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="tip-head">
            <text class="tip-title" :style="{ color: textColor }">口径说明</text>
          </view>
          <scroll-view :scroll-y="true" class="tip-body">
            <view class="tip-item">
              <text class="tip-label">统计口径</text>
              <text class="tip-value" :style="{ color: textColor }">{{ modeLabel }}——{{ modeTip }}</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">按期率</text>
              <text class="tip-value" :style="{ color: textColor }">按期项目 ÷ 本次按事件时间查出的全部项目 × 100%；「计划数据不完整」指计划完成日期缺失或非法，无法判断是否按期</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">平均延期</text>
              <text class="tip-value" :style="{ color: textColor }">延期项目超出计划完成天数的平均值；实际投入人天按现场/远程调试记录累计，≠任务权重</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">周期效率</text>
              <text class="tip-value" :style="{ color: textColor }">计划工期合计 ÷ 实际投入人天合计 × 100%，大于 100% 表示工期有富余；任务权重只统计已完成调试任务，贡献率 = 个人任务权重 ÷ 项目总任务权重</text>
            </view>
            <view class="tip-item">
              <text class="tip-label">说明</text>
              <text class="tip-value" :style="{ color: textColor }">汇总与人员统计基于全部命中项目，与明细分页无关；延期天数/投入人天/贡献率为空表示数据不足，显示"-"，不按 0 处理</text>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <scroll-view :scroll-y="true" class="content-scroll">
        <view class="content-inner">
          <!-- 核心指标 -->
          <view class="kpi-grid">
            <view v-for="(k, i) in kpis" :key="k.label" class="kpi-card" :class="{ wide: i === kpis.length - 1 }" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
              <view class="kpi-label" :style="{ color: subColor }">{{ k.label }}</view>
              <view class="kpi-value" :style="{ color: k.color }">{{ k.value }}</view>
            </view>
          </view>

          <!-- 完成情况汇总 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <text class="card-title" :style="{ color: textColor }">完成情况汇总</text>
              <text class="mode-tag" :class="{ review: isReviewMode }">{{ modeLabel }}</text>
              <view style="flex: 1"></view>
              <view class="info-link" :style="{ color: '#2d8cf0' }" @click="tipShow = true">口径说明</view>
            </view>
            <view class="meta-line" :style="{ color: subColor }">统计区间：{{ periodText }}</view>
            <view class="sum-grid">
              <view v-for="item in summaryItems" :key="item.label" class="sum-item" :style="{ background: isDark ? '#383838' : '#f8fafc' }">
                <view class="sum-label" :style="{ color: subColor }">{{ item.label }}</view>
                <view class="sum-value" :style="{ color: item.color || textColor, fontWeight: item.bold ? 700 : 600 }">{{ item.value }}</view>
              </view>
            </view>
          </view>

          <!-- 人员统计 -->
          <view v-if="currentPersonStats.length" class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <text class="card-title" :style="{ color: textColor }">人员统计</text>
              <text class="mode-tag" :class="{ review: isReviewMode }">{{ modeLabel }}</text>
            </view>
            <view class="meta-line" :style="{ color: subColor }">项目按负责人/参与人归属，同一项目对同一人只计一次</view>
            <scroll-view :scroll-x="true" class="pivot-scroll">
              <view class="table-wrapper" :style="{ width: personTableWidth + 'px' }">
                <view class="table-header" :style="{ background: isDark ? '#383838' : '#f8fafc' }">
                  <text class="th" style="width: 90px">人员</text>
                  <text class="th" style="width: 56px">项目数</text>
                  <text class="th" style="width: 76px">负责/协作</text>
                  <text class="th" style="width: 100px">按期/延期/缺失</text>
                  <text class="th" style="width: 84px">按期率</text>
                  <text class="th" style="width: 70px">平均延期</text>
                  <text class="th" style="width: 84px">有效权重</text>
                  <text class="th" style="width: 70px">任务权重</text>
                  <text class="th" style="width: 60px">异常</text>
                </view>
                <scroll-view :scroll-y="true" class="table-body">
                  <view v-for="row in currentPersonStats" :key="String(row.userId)" class="table-row">
                    <text class="td" style="width: 90px; font-weight: 600; justify-content: flex-start" :style="isDimPerson(row) ? { color: '#a8b3c4' } : {}">{{ personName(row) }}</text>
                    <text class="td" style="width: 56px">{{ fmtNum(row.projectCount) }}</text>
                    <text class="td" style="width: 76px">{{ fmtNum(row.responsibleProjectCount ?? 0) }}/{{ fmtNum(row.collaborationProjectCount ?? 0) }}</text>
                    <text class="td" style="width: 100px">{{ fmtNum(row.onTimeProjectCount ?? 0) }}/{{ fmtNum(row.lateProjectCount ?? 0) }}/{{ fmtNum(row.scheduleDataIncompleteProjectCount ?? 0) }}</text>
                    <text class="td" style="width: 84px; color: #2d8cf0; font-weight: 600">{{ fmtPct(row.onTimeRate) }}</text>
                    <text class="td" style="width: 70px">{{ row.averageDelayDays !== null && row.averageDelayDays !== undefined ? fmtNum(row.averageDelayDays) + '天' : '-' }}</text>
                    <text class="td" style="width: 84px">{{ fmtNum(row.effectiveWeightProjectCount ?? 0) }}/{{ fmtNum(row.projectCount ?? 0) }}</text>
                    <text class="td" style="width: 70px; font-weight: 600">{{ fmtNum(row.taskWeight ?? 0) }}</text>
                    <text class="td" style="width: 60px" :style="Number(row.dataIssueProjectCount) > 0 ? { color: '#f0a020', fontWeight: 700 } : {}">{{ fmtNum(row.dataIssueProjectCount ?? 0) }}</text>
                  </view>
                </scroll-view>
              </view>
            </scroll-view>
          </view>

          <!-- 项目明细 -->
          <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-header">
              <text class="card-title" :style="{ color: textColor }">项目明细</text>
              <text class="mode-tag" :class="{ review: isReviewMode }">{{ modeLabel }}</text>
              <view style="flex: 1"></view>
              <text class="meta-line" :style="{ color: subColor }">共 {{ total }} 个项目</text>
            </view>

            <scroll-view v-if="currentProjects.length" :scroll-y="true" class="p-list" @scrolltolower="loadMore">
              <view v-for="p in currentProjects" :key="String(p.projectId)" class="p-card" :style="{ background: isDark ? '#333333' : '#fafbfc' }">
                <view class="p-head">
                  <text class="p-name" :style="{ color: '#2d8cf0' }">{{ p.projectName || '-' }}</text>
                  <view class="p-tags">
                    <text class="p-tag info">{{ dtypeText(p.dtype) }}</text>
                    <text v-if="onTimeInfo(p)" class="p-tag" :class="onTimeInfo(p)!.cls">{{ onTimeInfo(p)!.label }}</text>
                  </view>
                </view>
                <view class="p-people" :style="{ color: subColor }">负责人：{{ p.responsible?.userName || '-' }}{{ rateChip(p.responsible?.contributionRate) }}</view>
                <view v-if="participantsText(p)" class="p-people" :style="{ color: subColor }">参与人：{{ participantsText(p) }}</view>
                <view class="p-grid">
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">实际开始</text>
                    <text class="p-value" :style="{ color: textColor }">{{ p.actualStartDate || '-' }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">计划完成</text>
                    <text class="p-value" :style="{ color: textColor }">{{ p.plannedEndDate || '-' }}</text>
                  </view>
                  <view class="p-cell wide">
                    <text class="p-label" :style="{ color: subColor }">{{ isReviewMode ? '送审时间' : '完成时间' }}</text>
                    <text class="p-value" :style="{ color: p.onTime === false ? '#e02d2d' : textColor, fontWeight: p.onTime === false ? 700 : 500 }">{{ p.eventTime || '-' }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">延期(天)</text>
                    <text class="p-value" :style="{ color: Number(p.delayDays) > 0 ? '#e02d2d' : textColor, fontWeight: Number(p.delayDays) > 0 ? 700 : 500 }">{{ fmtNum(p.delayDays) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">计划(天)</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(p.plannedDays) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">投入(人天)</text>
                    <text class="p-value" :style="{ color: textColor }">{{ fmtNum(p.actualEffortDays) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">投入时间(天)</text>
                    <view class="clock-link" @click.stop="openClockModal(p)">
                      <text class="p-value" style="color: #2d8cf0">{{ fmtNum(p.investtime ?? p.actualEffortDays) }}</text>
                      <wd-icon name="calendar" size="14px" color="#2d8cf0" />
                    </view>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">出差(次/天)</text>
                    <text class="p-value" :style="{ color: textColor }">{{ travelText(p) }}</text>
                  </view>
                  <view class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">质保到期</text>
                    <text class="p-value" :style="{ color: textColor }">{{ p.warrantyEndDate || '-' }}</text>
                  </view>
                  <view v-if="canUpdateProject" class="p-cell">
                    <text class="p-label" :style="{ color: subColor }">奖金发放</text>
                    <view class="bonus-row">
                      <wd-switch :model-value="Boolean(p.bonusIssued)" size="18px" :disabled="bonusUpdatingId === p.projectId" @change="(v: boolean) => handleBonusUpdate(p, v)" />
                      <text v-if="p.bonusIssued" class="bonus-meta" :style="{ color: subColor }">{{ p.bonusIssuedByName || '' }} {{ p.bonusIssuedTime || '' }}</text>
                    </view>
                  </view>
                  <view v-if="p.dataIssue" class="p-cell wide">
                    <text class="p-label" :style="{ color: subColor }">数据提示</text>
                    <view class="cycle-row">
                      <text v-for="(issue, i) in dataIssueList(p)" :key="i" class="p-tag warning">{{ issue }}</text>
                    </view>
                  </view>
                </view>
              </view>
              <view class="load-more" :style="{ color: subColor }">
                {{ listLoading ? '加载中…' : hasMore ? '上拉加载更多' : '已全部加载' }}
              </view>
            </scroll-view>
            <view v-else class="card-empty" :style="{ color: subColor }">{{ listLoading ? '加载中…' : '暂无项目数据' }}</view>
          </view>

          <view class="bottom-space" />
        </view>
      </scroll-view>

      <!-- 打卡记录弹框（参考 pages/project.vue） -->
      <wd-popup :z-index="99" closable v-model="clockRecordShow" custom-style="width: 92%; border-radius: 32rpx; padding: 20rpx; max-height: 80vh; overflow-y: auto;" @close="handleCloseClockRecordChange">
        <view class="clock-record-card">
          <view class="clock-header">
            <view class="clock-header-title">
              <text class="clock-proname" :class="isDark ? 'dark' : ''">{{ clockRecordItem?.projectName || '' }}</text>
              <text class="clock-sub" :class="isDark ? 'dark-sub' : ''">的项目打卡记录</text>
            </view>
            <view class="clock-header-stats">
              <text v-if="clockMultiUser" class="clock-warning">
                <text>⚠️</text> 同一日期多个调试人员，工时已合并为单日计算
              </text>
              <text class="clock-total">总工时 {{ clockRecordItem?.actualtime ?? clockRecordItem?.actualEffortDays ?? 0 }} 天</text>
              <text v-if="clockCalendarData.length" class="clock-range">
                📅 {{ normalizeClockDate(clockCalendarData[0].dbtime) }} 至 {{ normalizeClockDate(clockCalendarData[clockCalendarData.length - 1].dbtime) }}
              </text>
            </view>
          </view>

          <view v-if="clockRecordLoading" class="clock-loading">
            <wd-loading size="36px"></wd-loading>
            <text class="clock-loading-text" :class="isDark ? 'dark-sub' : ''">正在加载打卡记录...</text>
          </view>

          <template v-else-if="clockCalendarData.length">
            <view class="clock-month-nav">
              <view class="clock-nav-btn" :class="[isDark ? 'dark-nav' : '', { disabled: clockMonthIndex === 0 }]" @click="prevClockMonth">
                <text>◀</text>
              </view>
              <text class="clock-month-title" :class="isDark ? 'dark' : ''">{{ displayClockMonth }}</text>
              <view class="clock-nav-btn" :class="[isDark ? 'dark-nav' : '', { disabled: clockMonthIndex === clockMonths.length - 1 }]" @click="nextClockMonth">
                <text>▶</text>
              </view>
            </view>

            <view class="clock-week" :class="isDark ? 'dark-week' : ''">
              <text v-for="w in ['一', '二', '三', '四', '五', '六', '日']" :key="w" class="clock-week-item">{{ w }}</text>
            </view>

            <view class="clock-days" :class="isDark ? 'dark-days' : ''">
              <view v-for="(day, index) in getClockMonthDays(clockCurrentMonth)" :key="index" class="clock-day" :class="[isDark ? 'dark-day' : '', { 'is-empty': !day, 'is-today': day === clockTodayStr }]">
                <template v-if="day">
                  <text class="clock-day-num" :class="{ 'today': day === clockTodayStr, 'darkCss': isDark }">{{ Number(day.slice(-2)) }}</text>
                  <view class="clock-day-users">
                    <view v-for="u in getClockDayUsers(day)" :key="u.id ?? u.username" class="clock-user" :style="clockUserStyle(u.dailyWorktime)">
                      <text class="clock-user-name">{{ u.username || '未知人员' }}</text>
                      <text class="clock-user-time">{{ formatClockWorktime(u.dailyWorktime) }}</text>
                    </view>
                  </view>
                </template>
              </view>
            </view>

            <view class="clock-legend" :class="isDark ? 'dark-legend' : ''">
              <text class="clock-legend-item"><text class="dot dot-red"></text>0 天</text>
              <text class="clock-legend-item"><text class="dot dot-blue"></text>不足 1 天</text>
              <text class="clock-legend-item"><text class="dot dot-green"></text>满 1 天</text>
            </view>
          </template>

          <view v-else class="clock-empty" :class="isDark ? 'dark-sub' : ''">
            该项目暂无打卡记录
          </view>
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
import { fetchGetProjectCycleCompletionV2, fetchUpdateProjectBonusIssued } from '@/service/projectCycleReport'
import type { ProjectCycleReportType, CycleProjectV2Item } from '@/service/projectCycleReport'
import { fetchGetAllUserDataList, fetchprojectTripHour } from '@/service/index'

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

/** 百分比：50.00 -> 50%，空值 - */
function fmtPct(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  return `${Number(value)}%`
}
/** 数值：2.50 -> 2.5，空值 - */
function fmtNum(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  return Number.isNaN(n) ? String(value) : String(n)
}

/* ---------------- 统计口径：切换重新查询 ---------------- */
const reportTypeOptions: Array<{ label: string; value: ProjectCycleReportType; tip: string }> = [
  { label: '项目送审', value: 'REVIEWED', tip: '送审时间落在查询区间的项目纳入统计' },
  { label: '项目完成', value: 'COMPLETED', tip: '实际完成时间落在查询区间的项目纳入统计' },
]
const reportType = ref<ProjectCycleReportType>('REVIEWED')
/** 回显的规范化口径：请求返回前沿用当前选择 */
const canonicalType = computed<ProjectCycleReportType>(() => reportData.value?.reportType || reportType.value)
const isReviewMode = computed(() => canonicalType.value === 'REVIEWED')
const modeLabel = computed(() => reportTypeOptions.find((m) => m.value === canonicalType.value)?.label || '')
const modeTip = computed(() => reportTypeOptions.find((m) => m.value === canonicalType.value)?.tip || '')

function handleReportTypeChange(v: ProjectCycleReportType) {
  if (reportType.value === v) return
  reportType.value = v
  reSearch()
}

const filterExpanded = ref(false)
const tipShow = ref(false)
/** 激活筛选数：选了人员 +1，改了调试类型 +1（时间已常驻，不计入折叠筛选角标） */
const filterCount = computed(() => (selectedUserIds.value.length ? 1 : 0) + (selectedDebugTypes.value.length !== 2 ? 1 : 0))

/* ---------------- 查询区间：年/月粒度 + 步进 + 自定义起止月，统一换算 startMonth/endMonth ---------------- */
function pad2(n: number) { return String(n).padStart(2, '0') }
function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}
function parseMonth(ym: string) {
  const [y, m] = String(ym).split('-').map(Number)
  return new Date(y || new Date().getFullYear(), (m || 1) - 1, 1)
}

type DateType = 'year' | 'month' | 'custom'
const dateTypeOptions = [
  { label: '年', value: 'year' },
  { label: '月', value: 'month' },
  { label: '自定义', value: 'custom' },
]
const dateType = ref<DateType>('month')
const yearNum = ref(new Date().getFullYear())
const monthSel = ref<string>(currentMonth()) // yyyy-MM
const startMonth = ref<string>(currentMonth())
const endMonth = ref<string>(currentMonth())

const datePickerRef = ref<any>(null)
const datePickerValue = ref(new Date().getTime())
const rangePickerRef = ref<any>(null)
const rangePickerValue = ref(new Date().getTime())
const rangeTarget = ref<'start' | 'end'>('start')

const dateLabel = computed(() => {
  if (dateType.value === 'year') return `${yearNum.value}年`
  return monthSel.value ? `${monthSel.value.split('-')[0]}年${Number(monthSel.value.split('-')[1])}月` : `${yearNum.value}年`
})

function applyRange() {
  if (dateType.value === 'year') {
    startMonth.value = `${yearNum.value}-01`
    endMonth.value = `${yearNum.value}-12`
  } else if (dateType.value === 'month') {
    startMonth.value = monthSel.value
    endMonth.value = monthSel.value
  }
  // custom 模式由起止月选择器直接写 startMonth/endMonth
}

function syncPickerValue() {
  datePickerValue.value = dateType.value === 'year' ? new Date(yearNum.value, 0, 1).getTime() : parseMonth(monthSel.value).getTime()
}
function openDatePicker() {
  syncPickerValue()
  datePickerRef.value?.open()
}
function handleDateConfirm({ value }: any) {
  const d = new Date(value)
  if (dateType.value === 'year') {
    yearNum.value = d.getFullYear()
  } else {
    monthSel.value = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
    yearNum.value = d.getFullYear()
  }
  applyRange()
  reSearch()
}
function handleDateTypeChange(t: DateType) {
  if (dateType.value === t) return
  dateType.value = t
  applyRange()
  reSearch()
}
function stepDate(step: 1 | -1) {
  if (dateType.value === 'year') {
    yearNum.value += step
  } else if (dateType.value === 'month') {
    const base = monthSel.value ? parseMonth(monthSel.value) : new Date()
    const nd = new Date(base.getFullYear(), base.getMonth() + step, 1)
    monthSel.value = `${nd.getFullYear()}-${pad2(nd.getMonth() + 1)}`
    yearNum.value = nd.getFullYear()
  }
  applyRange()
  reSearch()
}
function openRangePicker(target: 'start' | 'end') {
  rangeTarget.value = target
  const base = target === 'start' ? startMonth.value : endMonth.value
  rangePickerValue.value = base ? parseMonth(base).getTime() : new Date().getTime()
  rangePickerRef.value?.open()
}
function handleRangeConfirm({ value }: any) {
  const d = new Date(value)
  const ym = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
  if (rangeTarget.value === 'start') startMonth.value = ym
  else endMonth.value = ym
  reSearch()
}

/* ---------------- 调试类型：0 现场 / 1 远程 / 2 无需调试，默认 [0,1] ---------------- */
const debugTypeOptions = [
  { label: '现场', value: 0 },
  { label: '远程', value: 1 },
  { label: '无需调试', value: 2 },
]
const selectedDebugTypes = ref<number[]>([0, 1])
function toggleDebugType(v: number) {
  const idx = selectedDebugTypes.value.indexOf(v)
  if (idx === -1) selectedDebugTypes.value.push(v)
  else selectedDebugTypes.value.splice(idx, 1)
  reSearch()
}
function dtypeText(dtype: number | null | undefined) {
  if (dtype === 0) return '现场'
  if (dtype === 1) return '远程'
  if (dtype === 2) return '无需调试'
  return '未设置'
}

/* ---------------- 人员筛选：责任人多选 ---------------- */
const selectedUserIds = ref<number[]>([])
const userOptions = ref<{ label: string; value: number }[]>([])
async function loadUserOptions() {
  try {
    const res: any = await fetchGetAllUserDataList({ page: 1, limit: 200, usertypes: '2,3,9', _t: Date.now() })
    const arr = Array.isArray(res) ? res : res?.list || res?.data || []
    userOptions.value = (arr || [])
      .filter((u: any) => u && u.username && Number(u.status) === 0)
      .map((u: any) => ({ label: u.nickname || u.username, value: u.id }))
  } catch (e) {
    console.error('获取人员列表失败', e)
  }
}
const selectedText = computed(() => (selectedUserIds.value.length ? `已选 ${selectedUserIds.value.length} 人` : '不限（匹配负责人/参与人）'))
function toggleUser(id: number) {
  const idx = selectedUserIds.value.indexOf(id)
  if (idx === -1) selectedUserIds.value.push(id)
  else selectedUserIds.value.splice(idx, 1)
  reSearch()
}
function handleClearUsers() {
  if (!selectedUserIds.value.length) return
  selectedUserIds.value = []
  reSearch()
}

/* ---------------- 报表查询 ---------------- */
const reportData = ref<any>(null)
const rawProjects = ref<CycleProjectV2Item[]>([])
const total = ref(0)
const page = ref(1)
const LIMIT = 20
const listLoading = ref(false)
let reqSeq = 0

const hasMore = computed(() => rawProjects.value.length < total.value)

function buildParams() {
  const params: any = {
    reportType: reportType.value,
    startMonth: startMonth.value,
    endMonth: endMonth.value,
    page: page.value,
    limit: LIMIT,
  }
  if (selectedUserIds.value.length) params.userIds = selectedUserIds.value.join(',')
  if (selectedDebugTypes.value.length) params.debugTypes = selectedDebugTypes.value.join(',')
  return params
}

async function getReport(append = false) {
  if (listLoading.value) return
  listLoading.value = true
  const seq = ++reqSeq
  if (!append) uni.showLoading({ title: '查询中...', mask: true })
  try {
    const data: any = await fetchGetProjectCycleCompletionV2(buildParams())
    if (seq !== reqSeq) return // 过期响应丢弃
    reportData.value = data || {}
    total.value = Number(data?.total || 0)
    const items: CycleProjectV2Item[] = data?.projects || []
    if (append) {
      const old = rawProjects.value
      rawProjects.value = []
      rawProjects.value = old.concat(items)
    } else {
      rawProjects.value = []
      rawProjects.value = items
    }
  } catch (e) {
    console.error('获取周期完成率报表失败', e)
    if (seq === reqSeq && !append) {
      reportData.value = null
      rawProjects.value = []
      total.value = 0
    }
  } finally {
    listLoading.value = false
    uni.hideLoading()
  }
}

function reSearch() {
  page.value = 1
  getReport(false)
}
function loadMore() {
  if (!hasMore.value || listLoading.value) return
  page.value++
  getReport(true)
}

/* ---------------- 数据投影 ---------------- */
const currentSummary = computed<any>(() => reportData.value?.summary || {})
const currentPersonStats = computed<any[]>(() => reportData.value?.personStats || [])
const currentProjects = computed<any[]>(() => rawProjects.value || [])

/** 送审口径下区间内暂无项目时的提示 */
const reviewedEmpty = computed(() => isReviewMode.value && !listLoading.value && Number(currentSummary.value.totalProjects || 0) === 0)

const periodText = computed(() => {
  if (!reportData.value?.startMonth) return '-'
  const range = `${reportData.value.startMonth} ~ ${reportData.value.endMonth}`
  return reportData.value.periodStart ? `${range}（${reportData.value.periodStart} ~ ${reportData.value.periodEnd}）` : range
})

/* ---------------- KPI / 汇总 ---------------- */
const kpis = computed(() => [
  { label: '项目总数', value: fmtNum(currentSummary.value.totalProjects ?? 0), color: '#2d8cf0' },
  { label: isReviewMode.value ? '按期送审率' : '按期完成率', value: fmtPct(currentSummary.value.onTimeRate), color: '#18a058' },
  { label: isReviewMode.value ? '延期送审' : '延期完成', value: fmtNum(currentSummary.value.lateProjects ?? 0), color: '#faad14' },
  { label: '平均延期(天)', value: fmtNum(currentSummary.value.averageDelayDays), color: '#9254de' },
  { label: '周期效率', value: fmtPct(currentSummary.value.cycleEfficiencyRate), color: '#13c2c2' },
])

const summaryItems = computed(() => {
  const s = currentSummary.value
  return [
    { label: isReviewMode.value ? '按期送审' : '按期完成', value: fmtNum(s.onTimeProjects), color: '#18a058', bold: true },
    { label: isReviewMode.value ? '延期送审' : '延期完成', value: fmtNum(s.lateProjects), color: Number(s.lateProjects) > 0 ? '#f0a020' : '', bold: Number(s.lateProjects) > 0 },
    { label: '计划数据不完整', value: fmtNum(s.scheduleDataIncompleteProjects), color: Number(s.scheduleDataIncompleteProjects) > 0 ? '#f0a020' : '', bold: false },
    { label: '按期率', value: fmtPct(s.onTimeRate), color: '#2d8cf0', bold: true },
    { label: '平均延期(天)', value: fmtNum(s.averageDelayDays), color: '', bold: false },
    { label: '计划工期合计(天)', value: fmtNum(s.plannedDaysTotal), color: '', bold: false },
    { label: '实际投入人天合计(天)', value: fmtNum(s.actualEffortDaysTotal), color: '', bold: false },
    { label: '任务权重合计', value: fmtNum(s.taskWeightTotal), color: '', bold: false },
    { label: '周期效率', value: fmtPct(s.cycleEfficiencyRate), color: '', bold: true },
  ]
})

/* ---------------- 人员统计辅助 ---------------- */
function personName(member: any) {
  if (!member) return '-'
  return member.userName || (member.userId !== null && member.userId !== undefined ? `用户${member.userId}` : '-')
}
/** 已交接人员整行置灰：后端在姓名中标注"(已交接)" */
function isDimPerson(row: any) {
  return String(row?.userName || '').includes('已交接')
}
const personTableWidth = computed(() => 90 + 56 + 76 + 100 + 84 + 70 + 84 + 70 + 60)

/* ---------------- 项目明细辅助 ---------------- */
/** 贡献率胶囊：两位小数，0 也显示 0.00% */
function rateChip(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return ` ${n.toFixed(2)}%`
}
function participantsText(p: CycleProjectV2Item) {
  const list = p.participants || []
  if (!list.length) return ''
  return list.map((x) => x.userName + rateChip(x.contributionRate)).join('、')
}
function onTimeInfo(p: CycleProjectV2Item) {
  if (p.onTime === null || p.onTime === undefined) return null
  return p.onTime ? { label: '按期', cls: 'success' } : { label: '延期', cls: 'warning' }
}
function travelText(p: CycleProjectV2Item) {
  const count = Number(p.travelCountTotal ?? 0)
  const days = Number(p.travelDaysTotal ?? 0)
  if (!count && !days) return '-'
  return `${count}次/${days}天`
}
function dataIssueList(p: CycleProjectV2Item) {
  if (!p.dataIssue) return []
  return String(p.dataIssue).split(/；|;/).map((s) => s.trim()).filter(Boolean)
}

/* ---------------- 奖金发放标识 ---------------- */
const canUpdateProject = computed(() => {
  const permissions = uni.getStorageSync('permissions') || []
  return Array.isArray(permissions) && permissions.includes('project:Info:update')
})
const bonusUpdatingId = ref<number | null>(null)
async function handleBonusUpdate(row: CycleProjectV2Item, value: boolean) {
  if (bonusUpdatingId.value !== null) return
  bonusUpdatingId.value = row.projectId
  try {
    await fetchUpdateProjectBonusIssued({ projectId: row.projectId, bonusIssued: value })
    message.success(value ? '已标记奖金发放' : '已取消奖金发放标记')
    getReport(false) // 回读操作人/操作时间
  } catch (e: any) {
    message.error(e?.msg || '操作失败')
  } finally {
    bonusUpdatingId.value = null
  }
}

/* ---------------- 打卡日历（参考 pages/project.vue） ---------------- */
const clockRecordShow = ref(false)
const clockRecordLoading = ref(false)
const clockRecordItem = ref<any>(null)
const clockCalendarData = ref<any[]>([])
const clockMonths = ref<string[]>([])
const clockMonthIndex = ref(0)
const clockMultiUser = ref(false)

function normalizeClockDate(val: any): string {
  if (val === null || val === undefined || val === '') return ''
  return String(val).replace(/\//g, '-').slice(0, 10)
}
function hasMultipleCreatersOnSameDay(list: any[]): boolean {
  if (!Array.isArray(list) || list.length === 0) return false
  const dayMap: Record<string, number> = {}
  list.forEach((item: any) => {
    const d = normalizeClockDate(item && item.dbtime)
    if (d) dayMap[d] = (dayMap[d] || 0) + 1
  })
  return Object.keys(dayMap).some((d) => dayMap[d] > 1)
}
function buildClockMonths(list: any[]): string[] {
  const monthSet = new Set<string>()
  ;(list || []).forEach((item: any) => {
    const d = normalizeClockDate(item && item.dbtime)
    if (d) monthSet.add(d.slice(0, 7))
  })
  return Array.from(monthSet).sort()
}
/** 某个月的日历格（42 格、周一开头，非本月的格子为空字符串） */
function getClockMonthDays(month: string): string[] {
  if (!month) return []
  const [y, m] = month.split('-').map(Number)
  const firstWeekday = new Date(y, m - 1, 1).getDay() // 0=周日
  const leading = firstWeekday === 0 ? 6 : firstWeekday - 1 // 周一为每周第一天
  const days: string[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m - 1, 1 - leading + i)
    if (d.getMonth() === m - 1) {
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      days.push(`${y}-${mm}-${dd}`)
    } else {
      days.push('')
    }
  }
  return days
}
function getClockDayUsers(day: string): any[] {
  if (!day) return []
  return clockCalendarData.value.filter((item: any) => normalizeClockDate(item && item.dbtime) === day)
}
function prevClockMonth() {
  if (clockMonthIndex.value > 0) clockMonthIndex.value--
}
function nextClockMonth() {
  if (clockMonthIndex.value < clockMonths.value.length - 1) clockMonthIndex.value++
}
function formatClockWorktime(val: any): string {
  const n = Number(val)
  if (isNaN(n)) return '0天'
  return n + '天'
}
/** 工时标签配色（与 web 端一致：0 红 / ≥1 绿 / 不足 1 蓝） */
function clockUserStyle(val: any): Record<string, string> {
  const n = Number(val)
  if (n === 0) return { color: '#cf1322', backgroundColor: '#fff1f0', border: '1px solid #ffa39e' }
  if (n >= 1) return { color: '#389e0d', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }
  return { color: '#1890ff', backgroundColor: '#e6f7ff', border: '1px solid #91caff' }
}
const clockCurrentMonth = computed(() => clockMonths.value[clockMonthIndex.value] || '')
const displayClockMonth = computed(() => {
  const m = clockCurrentMonth.value
  if (!m) return ''
  const [y, mm] = m.split('-')
  return `${y}年${Number(mm)}月`
})
const clockTodayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function openClockModal(row: CycleProjectV2Item) {
  // 报表行字段名不同（projectId/projectName），fetchprojectTripHour 用 pid；无 investtime 不弹
  clockRecordItem.value = { id: row.projectId, projectName: row.projectName, actualtime: row.actualEffortDays }
  handleLookPrjClockChange(clockRecordItem.value)
}
async function handleLookPrjClockChange(item: any) {
  clockRecordLoading.value = true
  clockCalendarData.value = []
  clockMonths.value = []
  clockMonthIndex.value = 0
  clockMultiUser.value = false
  clockRecordShow.value = true
  try {
    const res: any = await fetchprojectTripHour({ pid: item.id })
    // app 端 request 直接返回 payload；兼容可能包一层 {data}/{list} 的情况
    const list: any[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.list) ? res.list : []
    if (list.length === 0) {
      clockRecordShow.value = false
      uni.showToast({ icon: 'none', title: '该项目暂无打卡记录', duration: 1500 })
      return
    }
    const sorted = [...list].sort((a: any, b: any) => normalizeClockDate(a && a.dbtime).localeCompare(normalizeClockDate(b && b.dbtime)))
    clockCalendarData.value = sorted
    clockMonths.value = buildClockMonths(sorted)
    const firstMonth = normalizeClockDate(sorted[0] && sorted[0].dbtime).slice(0, 7)
    const idx = clockMonths.value.indexOf(firstMonth)
    clockMonthIndex.value = idx === -1 ? 0 : idx
    clockMultiUser.value = hasMultipleCreatersOnSameDay(sorted)
  } catch (err) {
    console.error('获取打卡记录失败', err)
    clockRecordShow.value = false
    uni.showToast({ icon: 'none', title: '获取打卡记录失败', duration: 1500 })
  } finally {
    clockRecordLoading.value = false
  }
}
function handleCloseClockRecordChange() {
  clockRecordShow.value = false
  // 不清空日历数据：wd-popup 关闭有退场动画，置空会闪现空态；下次打开会重新初始化
}

onLoad(() => {
  applyRange()
  loadUserOptions()
  getReport(false)
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
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
.seg {
  display: flex;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 12rpx;
  padding: 4rpx;
}
.seg-item {
  padding: 8rpx 26rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #64748b;
  transition: all 0.2s;
}
.seg-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-weight: 600;
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
.mode-tip-line {
  margin-top: 10rpx;
  font-size: 20rpx;
}
.review-tip {
  margin-top: 10rpx;
  font-size: 20rpx;
  line-height: 1.5;
}
.filter-body {
  margin-top: 18rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.12);
  padding-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
/* 时间行常驻：与下方折叠区（或卡片尾）保持同样的纵向节奏 */
.time-row {
  margin-top: 18rpx;
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
/* 时间行不换行：chips + ‹日期› 组一行放下，整体超出才允许收缩 */
.time-controls {
  flex-wrap: nowrap;
  gap: 8rpx;
  overflow: hidden;
}
.time-controls .chip {
  padding: 8rpx 16rpx;
  font-size: 22rpx;
}
/* ‹日期› 组整体不拆 */
.date-step-group {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}
.date-step-group .step-btn {
  width: 44rpx;
  height: 44rpx;
}
.date-step-group .date-label {
  min-width: 0;
  padding: 6rpx 10rpx;
  font-size: 24rpx;
  white-space: nowrap;
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
  min-width: 150rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #1677ff;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  background: rgba(22, 119, 255, 0.06);
}
.person-scroll {
  margin-top: 12rpx;
  max-height: 320rpx;
  overflow-y: auto;
  border: 1rpx solid rgba(128, 128, 128, 0.12);
  border-radius: 16rpx;
  padding: 14rpx;
}
.person-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.person-chip {
  font-size: 22rpx;
  color: #4e5969;
  background: rgba(128, 128, 128, 0.08);
  border: 1rpx solid transparent;
  border-radius: 999rpx;
  padding: 8rpx 22rpx;
}
.person-chip.active {
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.08);
  border-color: #2d8cf0;
  font-weight: 600;
}
.person-empty {
  text-align: center;
  font-size: 22rpx;
  padding: 8rpx 0;
}
.content-scroll {
  flex: 1;
  min-height: 0;
}
.content-inner {
  padding: 20rpx;
}

/* KPI */
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
.kpi-card.wide {
  grid-column: 1 / -1;
}
.kpi-label {
  font-size: 24rpx;
  margin-bottom: 10rpx;
}
.kpi-value {
  font-size: 44rpx;
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
.card-title {
  font-size: 30rpx;
  font-weight: 600;
}
.card-empty {
  text-align: center;
  padding: 50rpx 0;
  font-size: 26rpx;
}
.mode-tag {
  font-size: 20rpx;
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.1);
  border-radius: 6rpx;
  padding: 4rpx 12rpx;
}
.mode-tag.review {
  color: #f0a020;
  background: rgba(240, 160, 32, 0.12);
}
.meta-line {
  font-size: 22rpx;
  margin-bottom: 14rpx;
}

/* 汇总 */
.sum-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}
.sum-item {
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}
.sum-label {
  font-size: 22rpx;
  margin-bottom: 6rpx;
}
.sum-value {
  font-size: 32rpx;
  font-weight: 600;
}
.info-link {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
}
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

/* 人员统计横滚表 */
.pivot-scroll {
  white-space: nowrap;
}
.table-body {
  max-height: 440rpx;
}
.table-wrapper {
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid rgba(128, 128, 128, 0.1);
}
.table-header {
  display: flex;
  padding: 14rpx 16rpx;
}
.th {
  font-size: 22rpx;
  color: #64748b;
  font-weight: 600;
  text-align: center;
}
.table-row {
  display: flex;
  padding: 14rpx 16rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.1);
}
.td {
  font-size: 24rpx;
  color: #1f2937;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 项目明细卡片 */
.p-list {
  max-height: 960rpx;
}
.p-card {
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}
.p-card:last-child {
  margin-bottom: 0;
}
.p-head {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}
.p-name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.4;
}
.p-tags {
  display: flex;
  gap: 8rpx;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.p-tag {
  font-size: 18rpx;
  border-radius: 6rpx;
  padding: 4rpx 10rpx;
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.1);
}
.p-tag.success {
  color: #18a058;
  background: rgba(24, 160, 88, 0.1);
}
.p-tag.info {
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.1);
}
.p-tag.warning {
  color: #f0a020;
  background: rgba(240, 160, 32, 0.12);
}
.p-people {
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.5;
}
.p-grid {
  margin-top: 14rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx 16rpx;
}
.p-cell.wide {
  grid-column: 1 / -1;
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
.bonus-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.bonus-meta {
  font-size: 20rpx;
}
.clock-link {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
}

/* ---------------- 打卡日历 ---------------- */
.clock-record-card {
  display: flex;
  flex-direction: column;
}
.clock-header {
  margin-bottom: 20rpx;
}
.clock-header-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14rpx;
}
.clock-proname {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  max-width: 440rpx;
}
.clock-proname.dark {
  color: #ffffff;
}
.clock-sub {
  font-size: 24rpx;
  color: #9ca3af;
  margin-left: 6rpx;
}
.clock-sub.dark-sub,
.clock-loading-text.dark-sub,
.clock-empty.dark-sub {
  color: #c0c4cc;
}
.clock-header-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx 16rpx;
}
.clock-warning {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  padding: 4rpx 16rpx;
  font-size: 20rpx;
  color: #d48806;
  background: #fffbe6;
  border-radius: 9999rpx;
}
.clock-total {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 4rpx 16rpx;
  border-radius: 9999rpx;
  font-size: 22rpx;
}
.clock-range {
  color: #6b7280;
  font-size: 22rpx;
}
.clock-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}
.clock-loading-text {
  margin-top: 20rpx;
  color: #909399;
  font-size: 26rpx;
}
.clock-month-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 16rpx;
}
.clock-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f0f0f0;
  color: #1f2937;
}
.clock-nav-btn.disabled {
  opacity: 0.35;
  pointer-events: none;
}
.clock-nav-btn:not(.disabled):active {
  background: #e0e0e0;
  transform: scale(0.92);
}
.clock-nav-btn.dark-nav {
  background: #2b2b2b;
  color: #ffffff;
}
.clock-month-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  min-width: 200rpx;
  text-align: center;
}
.clock-month-title.dark {
  color: #ffffff;
}
.clock-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-radius: 12rpx 12rpx 0 0;
}
.clock-week-item {
  text-align: center;
  padding: 12rpx 0;
  font-size: 24rpx;
  color: #64748b;
}
.clock-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid #eee;
  border-top: none;
  border-radius: 0 0 12rpx 12rpx;
  overflow: hidden;
}
.clock-day {
  min-height: 110rpx;
  padding: 6rpx;
  border-right: 1px solid #f3f3f3;
  border-bottom: 1px solid #f3f3f3;
  box-sizing: border-box;
}
.clock-day.is-empty {
  background: #fafafa;
}
.clock-day.is-today {
  background: #f0f7ff;
}
.clock-day-num {
  display: inline-block;
  font-size: 24rpx;
  font-weight: 600;
  color: #374151;
}
.clock-day-num.today {
  color: #ffffff;
  background: #3a7afe;
  border-radius: 50%;
  min-width: 36rpx;
  text-align: center;
}
.clock-day-users {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin-top: 4rpx;
}
.clock-user {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-radius: 8rpx;
  padding: 2rpx 6rpx;
}
.clock-user-name {
  font-size: 20rpx;
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
}
.clock-user-time {
  font-size: 18rpx;
  font-weight: 600;
  line-height: 1.3;
}
.clock-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx 24rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1px solid #eee;
}
.clock-legend.dark-legend {
  border-color: #333;
}
.clock-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
}
.clock-legend-item .dot {
  display: inline-block;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
}
.clock-legend-item .dot-red {
  background: #cf1322;
}
.clock-legend-item .dot-blue {
  background: #1890ff;
}
.clock-legend-item .dot-green {
  background: #389e0d;
}
.clock-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80rpx 0;
}
.cycle-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-wrap: wrap;
}
.load-more {
  text-align: center;
  font-size: 22rpx;
  padding: 16rpx 0 0;
}
.bottom-space {
  height: 40rpx;
}

/* 隐藏 datetime-picker 自带的触发 cell，弹层统一由日期标签触发 */
:deep(.wd-datetime-picker__cell) {
  display: none;
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
.page.dark .seg-item {
  color: #a8b3c0;
}
.page.dark .f-label {
  color: #9aa0a8;
}
.page.dark .filter-toggle {
  background: rgba(255, 255, 255, 0.08);
}
.page.dark .tip-title {
  color: #e5e5e5;
}
.page.dark .tip-value {
  color: #d0d5da;
}
.page.dark .card-title {
  color: #e5e5e5;
}
.page.dark .table-wrapper {
  border-color: rgba(255, 255, 255, 0.08);
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
.page.dark .p-card {
  background: #333333;
}
.page.dark .p-value {
  color: #e5e5e5;
}
.page.dark .person-chip {
  color: #a8b3c0;
  background: rgba(255, 255, 255, 0.08);
}
.page.dark .person-chip.active {
  color: #69b1ff;
  background: rgba(105, 177, 255, 0.12);
  border-color: #69b1ff;
}

/* 打卡日历暗色覆盖 */
.page.dark .clock-week {
  background: #2b2b2b;
}
.page.dark .clock-week-item {
  color: #9aa0a8;
}
.page.dark .clock-days {
  border-color: #333;
}
.page.dark .clock-day {
  border-right-color: #333;
  border-bottom-color: #333;
}
.page.dark .clock-day.is-empty {
  background: #242424;
}
.page.dark .clock-day.is-today {
  background: rgba(22, 119, 255, 0.16);
}
.page.dark .clock-day-num {
  color: #d0d5da;
}
.page.dark .clock-day-num.today {
  color: #ffffff;
}
.page.dark .clock-legend {
  border-top-color: #333;
}
.page.dark .clock-legend-item {
  color: #9aa0a8;
}
</style>
