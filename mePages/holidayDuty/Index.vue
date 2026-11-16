<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page" :class="{ dark: isDark }">
      <wd-navbar left-arrow title="值班表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <!-- 月份切换 -->
      <view class="month-bar" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="step-btn" :class="{ disabled: !canGoPrevMonth }" @click="stepMonth(-1)">
          <wd-icon name="arrow-left" size="16px" />
        </view>
        <view class="month-label" @click="openMonthPicker">
          <text>{{ year }}年{{ month }}月</text>
          <wd-icon name="arrow-down" size="12px" :color="isDark ? '#69b1ff' : '#1677ff'" />
        </view>
        <view class="step-btn" :class="{ disabled: !canGoNextMonth }" @click="stepMonth(1)">
          <wd-icon name="arrow-right" size="16px" />
        </view>
        <view v-if="!monthInViewRange(todayYear, todayMonth)" class="this-month-btn" @click="warnViewLimit">本月</view>
        <view v-else-if="year !== todayYear || month !== todayMonth" class="this-month-btn" @click="goThisMonth">本月</view>
      </view>

      <!-- 年月自由选择（wd-datetime-picker 无 show prop，只能通过暴露的 open() 打开弹层） -->
      <wd-datetime-picker
        ref="monthPickerRef"
        v-model="monthPickerValue"
        type="year-month"
        title="选择年月"
        @confirm="handleMonthPickerConfirm"
      />

      <!-- 统计条 -->
      <view class="stats-row">
        <view class="stat-card next-card" @click="jumpToNextDuty">
          <view class="stat-label light">下个值班日</view>
          <view v-if="nextDuty" class="stat-value light">{{ fmtMonthDay(nextDuty.dutyDate) }}</view>
          <view v-else class="stat-value light" style="font-size: 30rpx">暂无安排</view>
          <view v-if="nextDuty" class="stat-sub light single-line">
            {{ nextDuty.week || weekLabelOf(nextDuty.dutyDate) }} · {{ userNamesOf(nextDuty.users) }}
          </view>
          <view v-if="nextDuty" class="next-arrow">›</view>
        </view>
        <view class="stat-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="stat-label" :style="{ color: subColor }">本月值班天数</view>
          <view class="stat-value" :style="{ color: textColor }">{{ calendar?.dutyDays ?? 0 }}<text class="stat-unit">天</text></view>
          <view class="stat-sub" :style="{ color: subColor }">周末 {{ calendar?.weekendDays ?? 0 }} · 节假日 {{ calendar?.holidayDays ?? 0 }}</view>
        </view>
        <view class="stat-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="stat-label" :style="{ color: subColor }">参与值班人员</view>
          <view class="stat-value" :style="{ color: textColor }">{{ calendar?.userCount ?? 0 }}<text class="stat-unit">人</text></view>
          <view class="stat-sub" :style="{ color: subColor }">{{ year }}年{{ month }}月</view>
        </view>
      </view>

      <!-- 日历 -->
      <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="week-header">
          <text v-for="w in WEEK_HEADERS" :key="w" class="week-cell">{{ w }}</text>
        </view>
        <view class="cal-grid">
          <view
            v-for="cell in cells"
            :key="cell.date"
            class="cal-cell"
            :class="cellCls(cell)"
            @click="selectCell(cell)"
          >
            <view class="cell-top">
              <text class="day-num" :class="{ today: cell.date === todayStr }">{{ cell.day }}</text>
              <text v-if="cell.info && cell.info.dayType === 2" class="day-badge holiday-badge">{{ cell.info.holidayName || '休' }}</text>
              <text v-else-if="cell.info && isMakeupCell(cell)" class="day-badge makeup-badge">{{ cell.info.holidayName || '补班' }}</text>
            </view>
            <view v-if="cell.info && cell.info.users.length" class="cell-users">
              <text v-for="u in cell.info.users.slice(0, 2)" :key="u.userId" class="cell-user single-line">{{ u.username }}</text>
              <text v-if="cell.info.users.length > 2" class="cell-user more">+{{ cell.info.users.length - 2 }}</text>
            </view>
          </view>
        </view>
        <view class="cal-tip" :style="{ color: subColor }">仅显示周末和法定节假日的值班安排，点击日期查看详情</view>
      </view>

      <!-- 当日详情 -->
      <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="detail-header">
          <text class="detail-title" :style="{ color: textColor }">{{ detailTitle }}</text>
          <text v-if="detailWeek" class="detail-week">{{ detailWeek }}</text>
          <text v-if="detail && detail.dayType === 2" class="day-badge holiday-badge">{{ detail.holidayName || '节假日' }}</text>
        </view>

        <view v-if="detail && detail.hasDuty">
          <view v-for="u in detail.users" :key="u.userId" class="duty-user">
            <view class="user-avatar" :style="{ background: avatarGradient(u.userId) }">{{ (u.username || '?').slice(0, 1) }}</view>
            <view class="user-main">
              <view class="user-name-row">
                <text class="user-name" :style="{ color: textColor }">{{ u.username }}</text>
                <text v-if="u.roleName" class="user-role">{{ u.roleName }}</text>
              </view>
              <view v-if="u.phone" class="user-phone" @click="callPhone(u.phone)">
                <text class="phone-text">{{ u.phone }}</text>
                <wd-icon name="phone" size="14px" color="#2d8cf0" />
              </view>
            </view>
            <view v-if="canOperateDuty" class="user-remove" @click.stop="removeUser(u)">
              <wd-icon name="close-circle" size="18px" color="#e54d42" />
            </view>
          </view>

          <view v-if="detail.description" class="meta-row">
            <text class="meta-label" :style="{ color: subColor }">值班说明</text>
            <text class="meta-value" :style="{ color: textColor }">{{ detail.description }}</text>
          </view>
          <view v-if="detail.remark" class="meta-row">
            <text class="meta-label" :style="{ color: subColor }">备注</text>
            <text class="meta-value" :style="{ color: textColor }">{{ detail.remark }}</text>
          </view>
          <view v-if="detail.emergencyPhone" class="meta-row">
            <text class="meta-label" :style="{ color: subColor }">应急电话</text>
            <text class="meta-value link" @click="callPhone(detail.emergencyPhone)">{{ detail.emergencyPhone }}</text>
          </view>

          <view v-if="canOperateDuty" class="action-row">
            <wd-button v-if="detail.canDuty && canAddDuty" size="small" plain @click="openForm('add')">追加人员</wd-button>
            <wd-button v-if="canEditDuty" size="small" type="primary" plain @click="openForm('edit')">编辑</wd-button>
            <wd-button v-if="canDeleteDuty" size="small" type="error" plain @click="deleteDay">删除当日</wd-button>
          </view>
        </view>

        <view v-else-if="detail" class="detail-empty" :style="{ color: subColor }">
          {{ detail.message || (detail.canDuty ? '当天暂无值班安排' : '该日期不支持安排值班') }}
          <view v-if="detail.canDuty && canOperateDuty && canAddDuty" class="empty-action">
            <wd-button size="small" type="primary" @click="openForm('add')">新增值班</wd-button>
          </view>
        </view>
        <view v-else class="detail-empty" :style="{ color: subColor }">加载中…</view>
      </view>

      <!-- 紧急联系人 -->
      <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="card-title" :style="{ color: textColor }">紧急联系人</view>
        <view v-for="(c, i) in CONTACTS" :key="i" class="contact-row" @click="callPhone(c.phone)">
          <text class="contact-group">{{ c.group }}</text>
          <text class="contact-name" :style="{ color: textColor }">{{ c.name }}</text>
          <view style="flex: 1"></view>
          <text class="contact-phone">{{ c.phone }}</text>
          <wd-icon name="phone" size="14px" color="#2d8cf0" />
        </view>
      </view>

      <!-- 近期值班 -->
      <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="card-title" :style="{ color: textColor }">近期值班</view>
        <view v-if="recentList.length">
          <view
            v-for="(item, i) in recentList"
            :key="item.dutyDate"
            class="recent-row"
            :class="{ next: i === 0 }"
            @click="jumpToDate(item.dutyDate)"
          >
            <view class="recent-dot" :class="{ next: i === 0 }"></view>
            <text class="recent-date" :style="{ color: i === 0 ? '#e54d42' : textColor }">{{ fmtMonthDay(item.dutyDate) }}</text>
            <text class="recent-week" :style="{ color: subColor }">{{ item.week || weekLabelOf(item.dutyDate) }}</text>
            <text v-if="item.dayType === 2" class="day-badge holiday-badge">{{ item.holidayName || '休' }}</text>
            <view style="flex: 1"></view>
            <text class="recent-users single-line" :style="{ color: subColor }">{{ userNamesOf(item.users) }}</text>
          </view>
        </view>
        <view v-else class="card-empty" :style="{ color: subColor }">暂无近期值班安排</view>
      </view>

      <!-- 本月值班人员统计 -->
      <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
        <view class="card-title" :style="{ color: textColor }">本月值班人员统计</view>
        <view v-if="statistics.length">
          <view v-for="row in statistics" :key="row.userId" class="stat-row-item">
            <view class="stat-user">
              <view class="user-avatar small" :style="{ background: avatarGradient(row.userId) }">{{ (row.username || '?').slice(0, 1) }}</view>
              <text class="stat-user-name" :style="{ color: textColor }">{{ row.username }}</text>
            </view>
            <text class="stat-dates" :style="{ color: subColor }">{{ (row.dutyDates || []).map(fmtSlashDate).join('、') || '-' }}</text>
            <text class="stat-count">{{ row.dutyCount }}天</text>
          </view>
        </view>
        <view v-else class="card-empty" :style="{ color: subColor }">本月暂无值班数据</view>
      </view>

      <view class="bottom-space" />

      <!-- 新增/追加/编辑 弹窗 -->
      <wd-popup
        :z-index="99"
        position="bottom"
        :safe-area-inset-bottom="true"
        :model-value="formShow"
        custom-style="border-radius: 32rpx 32rpx 0 0;"
        @update:model-value="formShow = $event"
      >
        <view class="form-wrap" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="form-title" :style="{ color: textColor }">{{ formTitle }}</view>
          <view class="form-date-row">
            <text class="form-date" :style="{ color: textColor }">{{ selectedDate }} {{ detailWeek }}</text>
            <text v-if="detail && detail.dayType === 2" class="day-badge holiday-badge">{{ detail.holidayName || '节假日' }}</text>
          </view>

          <view class="form-label">值班人员 <text class="required">*</text></view>
          <view class="mode-chips">
            <view class="mode-chip" :class="{ active: personMode === 'user' }" @click="handlePersonModeChange('user')">按人员</view>
            <view class="mode-chip" :class="{ active: personMode === 'group' }" @click="handlePersonModeChange('group')">按组</view>
          </view>

          <view v-if="personMode === 'user'" class="person-scroll">
            <view class="person-list">
              <view
                v-for="u in userOptions"
                :key="u.value"
                class="person-chip"
                :class="{ active: form.userIds.includes(u.value) }"
                @click="toggleUser(u.value)"
              >
                {{ u.label }}
              </view>
            </view>
            <view v-if="!userOptions.length" class="card-empty" :style="{ color: subColor }">人员列表加载中或为空</view>
          </view>

          <view v-else>
            <wd-picker
              clearable
              label="选择组"
              label-width="140rpx"
              align-right
              :columns="groupColumns"
              v-model="groupValue"
              placeholder="选择组后自动填入组长与组员"
              @confirm="handleGroupConfirm"
              @clear="handleGroupClear"
            />
            <view v-if="selectedGroupMembers.length" class="person-list readonly">
              <view v-for="m in selectedGroupMembers" :key="m.id" class="person-chip active readonly">{{ m.name }}</view>
            </view>
          </view>

          <view v-if="isAppend" class="form-tip">当天已有值班安排，本次仅向该日追加人员；如需修改值班时间、说明等公共信息，请使用「编辑」</view>
          <view v-else-if="formType === 'edit'" class="form-tip">保存后的人员名单为最终名单，未勾选的原值班人员将被移除</view>

          <view v-if="!isAppend">
            <view class="form-label">应急电话</view>
            <input
              class="f-input"
              :style="{ background: isDark ? '#383838' : '#f7f8fa', color: textColor }"
              v-model="form.emergencyPhone"
              :maxlength="50"
              placeholder="请输入应急电话（选填，50字以内）"
              placeholder-class="f-placeholder"
            />
            <view class="form-label">值班说明</view>
            <textarea
              class="f-textarea"
              :style="{ background: isDark ? '#383838' : '#f7f8fa', color: textColor }"
              v-model="form.description"
              :maxlength="500"
              auto-height
              placeholder="请输入值班说明（选填，500字以内）"
              placeholder-class="f-placeholder"
            />
            <view class="form-label">备注</view>
            <textarea
              class="f-textarea"
              :style="{ background: isDark ? '#383838' : '#f7f8fa', color: textColor }"
              v-model="form.remark"
              :maxlength="500"
              auto-height
              placeholder="请输入备注（选填，500字以内）"
              placeholder-class="f-placeholder"
            />
          </view>

          <view class="form-footer">
            <wd-button size="small" @click="formShow = false">取消</wd-button>
            <wd-button size="small" type="primary" :loading="submitting" :disabled="submitting" @click="submitForm">确定</wd-button>
          </view>
        </view>
      </wd-popup>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import { hasPermission } from '@/utils/index'
import {
  fetchGetDutyCalendar,
  fetchGetDutyDetail,
  fetchCreateDuty,
  fetchUpdateDuty,
  fetchDeleteDutyUser,
  fetchDeleteDutyDate,
  fetchGetRecentDuty,
  fetchGetDutyStatistics,
} from '@/service/holidayDuty'
import type { DutyCalendarMonth, DutySaveRequest, DutySchedule, DutyStatistic, DutyUser } from '@/service/holidayDuty'
import { fetchGetAllUserDataList } from '@/service/index'
import { fetchGetProjectTeamDataList } from '@/service/groupmanage'

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

function toast(title: string) {
  uni.showToast({ title, icon: 'none' })
}

/* ---------------- 权限 ---------------- */
const userType = Number(uni.getStorageSync('usertype'))
const canOperateDuty = userType === 0 || userType === 2
const canAddDuty = hasPermission('duty:add')
const canEditDuty = hasPermission('duty:update')
const canDeleteDuty = hasPermission('duty:delete')

/**
 * 月份查看范围（与 web 端一致）：
 * 管理员(0)/项目负责人(2)/综合管理(4) 不限；销售(1) 本月+下月；其余仅本月
 */
function viewMonthOffsetRange(): [number, number] | null {
  if ([0, 2, 4].includes(userType)) return null
  if (userType === 1) return [0, 1]
  return [0, 0]
}
const todayYear = new Date().getFullYear()
const todayMonth = new Date().getMonth() + 1
function currentOffset() {
  return year.value * 12 + month.value - 1 - (todayYear * 12 + todayMonth - 1)
}
function monthInViewRange(y: number, m: number) {
  const range = viewMonthOffsetRange()
  if (!range) return true
  const offset = y * 12 + m - 1 - (todayYear * 12 + todayMonth - 1)
  return offset >= range[0] && offset <= range[1]
}
function warnViewLimit() {
  const range = viewMonthOffsetRange()
  if (!range) return
  if (range[0] === 0 && range[1] === 1) toast('销售仅可查看本月和下月的值班安排')
  else toast('仅可查看本月的值班安排')
}

/* ---------------- 数据 ---------------- */
const WEEK_HEADERS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const RECENT_COUNT = 15
/** 紧急联系人（与 web 端一致） */
const CONTACTS = [
  { group: '研发平台', name: '李吉峰', phone: '13219920127' },
  { group: '网络安全', name: '徐顺乐', phone: '15168782145' },
  { group: '数据通讯', name: '孙东洪', phone: '15858172663' },
]

const year = ref(todayYear)
const month = ref(todayMonth)
const calendar = ref<DutyCalendarMonth | null>(null)
const detail = ref<DutySchedule | null>(null)
const recentList = ref<DutySchedule[]>([])
const statistics = ref<DutyStatistic[]>([])
const nextDuty = computed(() => recentList.value[0] || null)

function fmtDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
const todayStr = fmtDate(new Date())
const selectedDate = ref(todayStr)

function parseDate(dateStr: string) {
  return new Date(String(dateStr || '').replace(/-/g, '/'))
}
const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
function weekLabelOf(dateStr: string) {
  const d = parseDate(dateStr)
  return Number.isNaN(d.getTime()) ? '' : WEEK_LABELS[d.getDay()]
}
/** 10月4日 */
function fmtMonthDay(dateStr: string) {
  const d = parseDate(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
/** 10/4 */
function fmtSlashDate(dateStr: string) {
  const parts = dateStr.split('-')
  return parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : dateStr
}
function userNamesOf(users?: DutyUser[]) {
  return (users || []).map((u) => u.username).join('、') || '待安排'
}

const canGoPrevMonth = computed(() => {
  const range = viewMonthOffsetRange()
  return !range || currentOffset() > range[0]
})
const canGoNextMonth = computed(() => {
  const range = viewMonthOffsetRange()
  return !range || currentOffset() < range[1]
})

function stepMonth(step: 1 | -1) {
  if (step === -1 && !canGoPrevMonth.value) return warnViewLimit()
  if (step === 1 && !canGoNextMonth.value) return warnViewLimit()
  const ni = year.value * 12 + month.value - 1 + step
  year.value = Math.floor(ni / 12)
  month.value = (ni % 12) + 1
  loadData()
}
function goThisMonth() {
  year.value = todayYear
  month.value = todayMonth
  loadData()
}

/* ---------------- 年月自由选择 ---------------- */
const monthPickerRef = ref<any>(null)
const monthPickerValue = ref(new Date(todayYear, todayMonth - 1, 1).getTime())
function openMonthPicker() {
  // 打开时同步为当前查看月份
  monthPickerValue.value = new Date(year.value, month.value - 1, 1).getTime()
  monthPickerRef.value?.open()
}
function handleMonthPickerConfirm({ value }: any) {
  const d = new Date(value)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  if (y === year.value && m === month.value) return
  if (!monthInViewRange(y, m)) return warnViewLimit()
  year.value = y
  month.value = m
  loadData()
}

async function loadData() {
  uni.showLoading({ title: '加载中...', mask: true })
  try {
    const [cal, recent, stat] = await Promise.all([
      fetchGetDutyCalendar({ year: year.value, month: month.value }).catch(() => null),
      fetchGetRecentDuty(RECENT_COUNT).catch(() => null),
      fetchGetDutyStatistics({ year: year.value, month: month.value }).catch(() => null),
    ])
    calendar.value = cal || null
    recentList.value = recent || []
    statistics.value = stat || []
    // 当前选中日期不在本月时，重置为默认选中日（今天 > 本月首个有值班的日期 > 1号）
    const dayDates = (calendar.value?.days || []).map((d) => d.date)
    if (!dayDates.includes(selectedDate.value)) selectedDate.value = defaultSelectedDate(dayDates)
    await loadDetail()
  } finally {
    uni.hideLoading()
  }
}

function defaultSelectedDate(dayDates: string[]) {
  if (!dayDates.length) return fmtDate(new Date(year.value, month.value - 1, 1))
  if (dayDates.includes(todayStr)) return todayStr
  const firstDuty = (calendar.value?.days || []).find((d) => d.hasDuty)
  return firstDuty ? firstDuty.date : dayDates[0]
}

async function loadDetail() {
  try {
    detail.value = await fetchGetDutyDetail({ date: selectedDate.value })
  } catch (e) {
    console.error('获取值班详情失败', e)
    detail.value = null
  }
}

/* ---------------- 日历格子 ---------------- */
interface CalendarCell {
  date: string
  day: number
  inMonth: boolean
  info: DutyCalendarMonth['days'][number] | null
}
const cells = computed<CalendarCell[]>(() => {
  const list: CalendarCell[] = []
  const first = new Date(year.value, month.value - 1, 1)
  // 周一开头，补上月占位
  const offset = (first.getDay() + 6) % 7
  for (let i = offset; i > 0; i--) {
    const date = new Date(year.value, month.value - 1, 1 - i)
    list.push({ date: fmtDate(date), day: date.getDate(), inMonth: false, info: null })
  }
  for (const info of calendar.value?.days || []) {
    list.push({ date: info.date, day: Number(info.date.split('-')[2]), inMonth: true, info })
  }
  // 补齐 7 列整行
  const rest = (7 - (list.length % 7)) % 7
  const last = list.length ? parseDate(list[list.length - 1].date) : first
  for (let i = 1; i <= rest; i++) {
    const date = new Date(last)
    date.setDate(date.getDate() + i)
    list.push({ date: fmtDate(date), day: date.getDate(), inMonth: false, info: null })
  }
  return list
})

/** 补班日：落在周六/周日、但 dayType=0 且 isWorkday=1 */
function isMakeupCell(cell: CalendarCell) {
  const day = parseDate(cell.date).getDay()
  const onWeekend = day === 0 || day === 6
  return onWeekend && cell.info?.dayType === 0 && cell.info?.isWorkday === 1
}

function cellCls(cell: CalendarCell) {
  const info = cell.info
  return {
    'is-other': !cell.inMonth,
    'is-weekend': !!info && info.dayType === 1,
    'is-holiday': !!info && info.dayType === 2,
    'is-makeup': !!info && isMakeupCell(cell),
    'is-duty': !!info && info.hasDuty,
    'is-today': cell.date === todayStr,
    'is-selected': cell.date === selectedDate.value,
    'is-next': !!nextDuty.value && cell.date === nextDuty.value.dutyDate,
  }
}

function selectCell(cell: CalendarCell) {
  const cy = Number(cell.date.split('-')[0])
  const cm = Number(cell.date.split('-')[1])
  if (cy !== year.value || cm !== month.value) {
    // 点击其他月份的日期，切换到对应月份
    if (!monthInViewRange(cy, cm)) return warnViewLimit()
    year.value = cy
    month.value = cm
    selectedDate.value = cell.date
    loadData()
    return
  }
  selectedDate.value = cell.date
  loadDetail()
}

/* ---------------- 当日详情 ---------------- */
const detailTitle = computed(() => {
  const d = parseDate(selectedDate.value)
  if (Number.isNaN(d.getTime())) return selectedDate.value
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})
const detailWeek = computed(() => (detail.value?.week || weekLabelOf(selectedDate.value)) ?? '')

function callPhone(phone?: string) {
  if (!phone) return
  uni.makePhoneCall({ phoneNumber: String(phone) })
}

/** 头像底色：按 userId 取 8 组渐变循环 */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
]
function avatarGradient(userId: number) {
  return AVATAR_GRADIENTS[Math.abs(Number(userId)) % 8]
}

function jumpToNextDuty() {
  if (nextDuty.value) jumpToDate(nextDuty.value.dutyDate)
}

async function jumpToDate(date: string) {
  const cy = Number(date.split('-')[0])
  const cm = Number(date.split('-')[1])
  if (cy !== year.value || cm !== month.value) {
    if (!monthInViewRange(cy, cm)) return warnViewLimit()
    year.value = cy
    month.value = cm
    selectedDate.value = date
    await loadData()
    return
  }
  selectedDate.value = date
  loadDetail()
}

/* ---------------- 删除（人员 / 当日） ---------------- */
function removeUser(user: DutyUser) {
  message
    .confirm({ title: '移除确认', msg: `确认移除值班人员「${user.username}」？` })
    .then(async () => {
      await fetchDeleteDutyUser(selectedDate.value, user.userId)
      toast('已移除')
      await loadData()
    })
    .catch(() => {})
}

function deleteDay() {
  const count = detail.value?.users?.length || 0
  message
    .confirm({ title: '删除确认', msg: `确认删除 ${selectedDate.value} 当天的全部值班安排（${count} 人）？` })
    .then(async () => {
      await fetchDeleteDutyDate(selectedDate.value)
      toast('已删除当日全部值班安排')
      await loadData()
    })
    .catch(() => {})
}

/* ---------------- 新增/追加/编辑 弹窗 ---------------- */
const formShow = ref(false)
const formType = ref<'add' | 'edit'>('add')
const isAppend = computed(() => formType.value === 'add' && !!detail.value?.hasDuty)
const formTitle = computed(() => (isAppend.value ? '追加值班人员' : formType.value === 'edit' ? '修改值班安排' : '新增值班安排'))
const form = reactive({ emergencyPhone: '', description: '', remark: '', userIds: [] as number[] })
const submitting = ref(false)

type PersonMode = 'user' | 'group'
const personMode = ref<PersonMode>('user')

const userOptions = ref<{ label: string; value: number }[]>([])
const userStatusMap = ref<Map<number, number>>(new Map())
async function loadUserOptions() {
  try {
    const res: any = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2,3,9', _t: Date.now() })
    const arr = Array.isArray(res) ? res : res?.list || res?.data || []
    userOptions.value = (arr || [])
      .filter((u: any) => u && u.username && Number(u.status) === 0)
      .map((u: any) => ({ label: u.nickname || u.username, value: u.id }))
    userStatusMap.value = new Map((arr || []).map((u: any) => [Number(u.id), Number(u.status)]))
  } catch (e) {
    console.error('获取人员列表失败', e)
  }
}

/** 组候选：tname 组名 / teamleader 组长ID / leadername 组长名 / list 组员[{teammember, membername}] */
const groupList = ref<any[]>([])
const groupValue = ref<any>([])
const groupColumns = computed(() => groupList.value.map((g) => ({ label: g.tname, value: g.id })))

async function loadGroups() {
  if (groupList.value.length) return
  try {
    const res: any = await fetchGetProjectTeamDataList({ page: 1, limit: 100 })
    groupList.value = res?.list || (Array.isArray(res) ? res : [])
  } catch (e) {
    console.error('获取项目组列表失败', e)
  }
}

/** 选中组的组长+组员（按 ID 去重），对照用户表剔除 status=1 的离职人员 */
const selectedGroupMembers = computed(() => {
  const group = groupList.value.find((g) => g.id === pickValue(groupValue.value))
  if (!group) return []
  const isActive = (id: number) => {
    const status = userStatusMap.value.get(id)
    return status === undefined || status === 0
  }
  const map = new Map<number, string>()
  for (const member of group.list || []) {
    if (!member.teammember) continue
    const id = Number(member.teammember)
    if (!isActive(id)) continue
    map.set(id, member.membername || `用户${member.teammember}`)
  }
  if (group.teamleader) {
    const leaderId = Number(group.teamleader)
    if (!map.has(leaderId) && isActive(leaderId)) map.set(leaderId, group.leadername || `用户${group.teamleader}`)
  }
  return Array.from(map, ([id, name]) => ({ id, name }))
})

function pickValue(v: any) {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined
  return v === null || v === undefined || v === '' ? undefined : v
}

function handlePersonModeChange(mode: PersonMode) {
  if (personMode.value === mode) return
  personMode.value = mode
  form.userIds = []
  groupValue.value = []
  if (mode === 'group') loadGroups()
}

/** wd-picker 无 change 事件，联动填充走 confirm */
function handleGroupConfirm({ value }: any) {
  const v = pickValue(value)
  groupValue.value = v === undefined ? [] : [v]
  form.userIds = v === undefined ? [] : selectedGroupMembers.value.map((m) => m.id)
}
function handleGroupClear() {
  groupValue.value = []
  form.userIds = []
}

function toggleUser(id: number) {
  const idx = form.userIds.indexOf(id)
  if (idx === -1) form.userIds.push(id)
  else form.userIds.splice(idx, 1)
}

function fillFromDetail() {
  form.emergencyPhone = detail.value?.emergencyPhone ?? ''
  form.description = detail.value?.description ?? ''
  form.remark = detail.value?.remark ?? ''
}

function openForm(type: 'add' | 'edit') {
  formType.value = type
  personMode.value = 'user'
  groupValue.value = []
  if (type === 'edit' && detail.value?.hasDuty) {
    fillFromDetail()
    form.userIds = (detail.value.users || []).map((u) => u.userId)
  } else if (isAppend.value) {
    fillFromDetail()
    form.userIds = []
  } else {
    form.emergencyPhone = ''
    form.description = ''
    form.remark = ''
    form.userIds = []
  }
  formShow.value = true
}

async function submitForm() {
  if (!form.userIds.length) {
    toast('请选择值班人员')
    return
  }
  submitting.value = true
  uni.showLoading({ title: '提交中...', mask: true })
  try {
    const editId = formType.value === 'edit' ? detail.value?.id : undefined
    const payload: DutySaveRequest = isAppend.value
      ? { dutyDate: selectedDate.value, userIds: form.userIds }
      : {
          dutyDate: selectedDate.value,
          emergencyPhone: form.emergencyPhone || undefined,
          description: form.description || undefined,
          remark: form.remark || undefined,
          userIds: form.userIds,
        }
    if (editId) await fetchUpdateDuty(editId, payload)
    else await fetchCreateDuty(payload)
    uni.hideLoading()
    formShow.value = false
    toast(editId ? '修改成功' : isAppend.value ? '追加成功' : '新增成功')
    await loadData()
  } catch (e) {
    // 失败时 request 层已 toast 错误信息
    uni.hideLoading()
  } finally {
    submitting.value = false
  }
}

onLoad(() => {
  loadData()
  loadUserOptions()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
}
.single-line {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 月份切换 */
.month-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
}
.step-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4e5969;
  background: rgba(128, 128, 128, 0.08);
}
.step-btn.disabled {
  opacity: 0.35;
}
.month-label {
  min-width: 220rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #1677ff;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  background: rgba(22, 119, 255, 0.06);
}
.this-month-btn {
  margin-left: auto;
  font-size: 24rpx;
  color: #2d8cf0;
  border: 1rpx solid rgba(45, 140, 240, 0.4);
  border-radius: 999rpx;
  padding: 6rpx 24rpx;
}

/* 隐藏 datetime-picker 自带的触发 cell，弹层统一由顶部月份标签触发 */
:deep(.wd-datetime-picker__cell) {
  display: none;
}

/* 统计条 */
.stats-row {
  display: flex;
  gap: 16rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
}
.stat-card {
  position: relative;
  flex: 1;
  min-width: 0;
  border-radius: 20rpx;
  padding: 20rpx;
  overflow: hidden;
}
.next-card {
  background: linear-gradient(135deg, #36cfc9 0%, #2d8cf0 100%);
}
.stat-label {
  font-size: 22rpx;
  margin-bottom: 8rpx;
}
.stat-label.light {
  color: rgba(255, 255, 255, 0.85);
}
.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.2;
}
.stat-value.light {
  color: #ffffff;
}
.stat-unit {
  font-size: 22rpx;
  font-weight: 400;
  margin-left: 6rpx;
}
.stat-sub {
  margin-top: 8rpx;
  font-size: 20rpx;
}
.stat-sub.light {
  color: rgba(255, 255, 255, 0.85);
}
.next-arrow {
  position: absolute;
  right: 16rpx;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.9);
  font-size: 40rpx;
  font-weight: 700;
}

/* 卡片 */
.card {
  margin: 0 20rpx 20rpx;
  border-radius: 20rpx;
  padding: 24rpx;
}
.card-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}
.card-empty {
  text-align: center;
  padding: 40rpx 0;
  font-size: 26rpx;
}

/* 日历 */
.week-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 8rpx;
}
.week-cell {
  text-align: center;
  font-size: 22rpx;
  color: #64748b;
  font-weight: 600;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6rpx;
}
.cal-cell {
  min-height: 108rpx;
  border-radius: 10rpx;
  border: 2rpx solid transparent;
  padding: 8rpx 6rpx;
  box-sizing: border-box;
  overflow: hidden;
}
.cell-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rpx;
}
.day-num {
  font-size: 26rpx;
  color: #1f2937;
  font-weight: 500;
  min-width: 36rpx;
  min-height: 36rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 999rpx;
}
.day-num.today {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-weight: 700;
}
.day-badge {
  font-size: 16rpx;
  line-height: 1.2;
  padding: 2rpx 6rpx;
  border-radius: 6rpx;
  color: #ffffff;
  max-width: 72rpx;
  overflow: hidden;
  white-space: nowrap;
}
.holiday-badge {
  background: linear-gradient(135deg, #43c93e 0%, #2f9e63 100%);
}
.makeup-badge {
  background: linear-gradient(135deg, #ffa940 0%, #f2820a 100%);
}
.cell-users {
  margin-top: 6rpx;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.cell-user {
  font-size: 18rpx;
  color: #2d8cf0;
  line-height: 1.3;
}
.cell-user.more {
  color: #999;
}
.cal-tip {
  margin-top: 16rpx;
  font-size: 20rpx;
  text-align: center;
}
.cal-cell.is-other .day-num {
  color: #c2c7cc;
}
.cal-cell.is-weekend {
  background: #eff6fe;
}
.cal-cell.is-holiday {
  background: #ebf9f0;
}
.cal-cell.is-makeup {
  background: #fef3e8;
}
.cal-cell.is-next {
  background: #fdeeed;
  border-color: #f5a6a0;
}
.cal-cell.is-selected {
  border-color: #4f8ef7;
  box-shadow: inset 0 0 0 2rpx #4f8ef7;
}

/* 当日详情 */
.detail-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}
.detail-title {
  font-size: 30rpx;
  font-weight: 600;
}
.detail-week {
  font-size: 24rpx;
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.08);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}
.duty-user {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(128, 128, 128, 0.1);
}
.user-avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 999rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-avatar.small {
  width: 52rpx;
  height: 52rpx;
  font-size: 24rpx;
}
.user-main {
  flex: 1;
  min-width: 0;
}
.user-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.user-name {
  font-size: 28rpx;
  font-weight: 600;
}
.user-role {
  font-size: 20rpx;
  color: #ffffff;
  background: #2d8cf0;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}
.user-phone {
  margin-top: 6rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.phone-text {
  font-size: 24rpx;
  color: #2d8cf0;
}
.user-remove {
  padding: 8rpx;
}
.meta-row {
  display: flex;
  gap: 16rpx;
  padding: 14rpx 0;
  font-size: 26rpx;
  border-bottom: 1rpx solid rgba(128, 128, 128, 0.08);
}
.meta-label {
  flex-shrink: 0;
  width: 130rpx;
}
.meta-value {
  flex: 1;
  word-break: break-all;
}
.meta-value.link {
  color: #2d8cf0;
  text-decoration: underline;
}
.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 20rpx;
  flex-wrap: wrap;
}
.detail-empty {
  text-align: center;
  padding: 50rpx 0;
  font-size: 26rpx;
}
.empty-action {
  margin-top: 20rpx;
}

/* 紧急联系人 / 近期值班 */
.contact-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid rgba(128, 128, 128, 0.08);
}
.contact-row:last-child {
  border-bottom: none;
}
.contact-group {
  font-size: 22rpx;
  color: #ffffff;
  background: #7c8399;
  border-radius: 6rpx;
  padding: 4rpx 12rpx;
  flex-shrink: 0;
}
.contact-name {
  font-size: 28rpx;
  font-weight: 500;
}
.contact-phone {
  font-size: 26rpx;
  color: #2d8cf0;
}
.recent-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid rgba(128, 128, 128, 0.08);
}
.recent-row:last-child {
  border-bottom: none;
}
.recent-row.next {
  background: rgba(229, 77, 66, 0.04);
  border-radius: 12rpx;
  padding-left: 12rpx;
  padding-right: 12rpx;
}
.recent-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: #2d8cf0;
  flex-shrink: 0;
}
.recent-dot.next {
  background: #e54d42;
}
.recent-date {
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.recent-week {
  font-size: 24rpx;
  flex-shrink: 0;
}
.recent-users {
  font-size: 22rpx;
  max-width: 300rpx;
  text-align: right;
}

/* 人员统计 */
.stat-row-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(128, 128, 128, 0.08);
}
.stat-row-item:last-child {
  border-bottom: none;
}
.stat-user {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
  width: 170rpx;
}
.stat-user-name {
  font-size: 26rpx;
  font-weight: 500;
}
.stat-dates {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  line-height: 1.5;
  word-break: break-all;
}
.stat-count {
  flex-shrink: 0;
  font-size: 26rpx;
  color: #2d8cf0;
  font-weight: 600;
}

/* 表单弹窗 */
.form-wrap {
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  max-height: 82vh;
  overflow-y: auto;
}
.form-title {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.form-date-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.form-date {
  font-size: 28rpx;
  font-weight: 500;
}
.form-label {
  font-size: 26rpx;
  color: #64748b;
  margin: 20rpx 0 12rpx;
}
.required {
  color: #e54d42;
}
.mode-chips {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.mode-chip {
  font-size: 24rpx;
  color: #64748b;
  background: rgba(128, 128, 128, 0.08);
  border-radius: 999rpx;
  padding: 10rpx 32rpx;
}
.mode-chip.active {
  color: #ffffff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 600;
}
.person-scroll {
  max-height: 420rpx;
  overflow-y: auto;
  border: 1rpx solid rgba(128, 128, 128, 0.12);
  border-radius: 16rpx;
  padding: 16rpx;
}
.person-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}
.person-list.readonly {
  margin-top: 16rpx;
}
.person-chip {
  font-size: 24rpx;
  color: #4e5969;
  background: rgba(128, 128, 128, 0.08);
  border: 1rpx solid transparent;
  border-radius: 999rpx;
  padding: 10rpx 26rpx;
}
.person-chip.active {
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.08);
  border-color: #2d8cf0;
  font-weight: 600;
}
.person-chip.readonly {
  color: #4e5969;
  background: rgba(128, 128, 128, 0.08);
  border-color: transparent;
}
.form-tip {
  margin-top: 16rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #f0a020;
}
.f-input {
  height: 72rpx;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
}
.f-textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 100rpx;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
}
.f-placeholder {
  color: #b0b6bf;
}
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 28rpx;
}

/* ---------------- 暗黑模式 ---------------- */
.page.dark .step-btn {
  color: #a8abb3;
  background: rgba(255, 255, 255, 0.08);
}
.page.dark .month-label {
  color: #69b1ff;
  background: rgba(22, 119, 255, 0.16);
}
.page.dark .this-month-btn {
  color: #69b1ff;
  border-color: rgba(105, 177, 255, 0.4);
}
.page.dark .week-cell {
  color: #9aa0a8;
}
.page.dark .day-num {
  color: #e5e5e5;
}
.page.dark .cal-cell.is-other .day-num {
  color: #5c636e;
}
.page.dark .cal-cell.is-weekend {
  background: #223144;
}
.page.dark .cal-cell.is-holiday {
  background: #1f3a2c;
}
.page.dark .cal-cell.is-makeup {
  background: #3c2f1e;
}
.page.dark .cal-cell.is-next {
  background: #3a2422;
  border-color: #7a403c;
}
.page.dark .cal-cell.is-selected {
  border-color: #69b1ff;
  box-shadow: inset 0 0 0 2rpx #69b1ff;
}
.page.dark .cell-user {
  color: #69b1ff;
}
.page.dark .duty-user,
.page.dark .meta-row,
.page.dark .contact-row,
.page.dark .recent-row,
.page.dark .stat-row-item {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
.page.dark .detail-week {
  color: #69b1ff;
  background: rgba(105, 177, 255, 0.14);
}
.page.dark .phone-text,
.page.dark .contact-phone,
.page.dark .stat-count {
  color: #69b1ff;
}
.page.dark .user-role {
  background: #1f6fbf;
}
.page.dark .contact-group {
  background: #555b66;
}
.page.dark .mode-chip,
.page.dark .person-chip,
.page.dark .person-chip.readonly {
  color: #a8b3c0;
  background: rgba(255, 255, 255, 0.08);
}
.page.dark .mode-chip.active {
  color: #ffffff;
}
.page.dark .person-chip.active {
  color: #69b1ff;
  background: rgba(105, 177, 255, 0.12);
  border-color: #69b1ff;
}
.page.dark .form-label {
  color: #9aa0a8;
}
.page.dark .f-placeholder {
  color: #6b7280;
}

.bottom-space {
  height: 40rpx;
}
</style>
