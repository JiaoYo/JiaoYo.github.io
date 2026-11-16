<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page">
      <wd-navbar left-arrow title="返工列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <view class="filter-area" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
        <!-- 状态 chips -->
        <view class="chips-row">
          <view
            v-for="opt in statusOptions"
            :key="String(opt.value)"
            class="chip"
            :class="{ active: filterStatus === opt.value }"
            :style="filterStatus === opt.value ? '' : { background: isDark ? '#2a2a2a' : '#ffffff' }"
            @click="selectStatus(opt.value)"
          >
            {{ opt.label }}
          </view>
          <view class="search-toggle" :class="{ active: showSearch || hasAdvancedFilter }" @click="toggleSearchPanel">
            <wd-icon name="filter" size="14px" />
            <text>筛选</text>
          </view>
          <wd-button v-if="!showSearch" size="small" type="primary" @click="handleSearch">查询</wd-button>
        </view>

        <!-- 高级筛选 -->
        <view v-if="showSearch" class="search-panel" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <wd-search
            v-model="projectFuzzy"
            placeholder="搜索项目名称"
            hide-cancel
            custom-class="rw-search"
            @search="handleFilterProjectSearch"
            @clear="handleFilterProjectClear"
          />
          <wd-picker
            clearable
            label="项目"
            label-width="140rpx"
            align-right
            :columns="filterProjectColumns"
            v-model="filterProjectValue"
            placeholder="按项目筛选"
            @confirm="handleFilterProjectConfirm"
            @clear="handleFilterProjectClear"
          />
          <!-- 责任人 / 组 模式 -->
          <view class="mode-row">
            <view
              v-for="m in modeOptions"
              :key="m.value"
              class="mode-chip"
              :class="{ active: responsibleMode === m.value }"
              @click="handleModeChange(m.value)"
            >
              {{ m.label }}
            </view>
          </view>
          <wd-picker
            v-if="responsibleMode === 'user'"
            clearable
            label="责任人"
            label-width="140rpx"
            align-right
            :columns="responsibleColumns"
            v-model="responsibleValue"
            placeholder="按责任人筛选"
            @confirm="handleResponsibleConfirm"
            @clear="handleResponsibleClear"
          />
          <template v-else>
            <wd-picker
              clearable
              label="分组"
              label-width="140rpx"
              align-right
              :columns="groupColumns"
              v-model="groupValue"
              placeholder="按组筛选"
              @confirm="handleGroupConfirm"
              @clear="handleGroupClear"
            />
            <view v-if="groupMemberText" class="group-members" :style="{ color: subColor }">
              组长+组员：{{ groupMemberText }}
            </view>
          </template>
          <!-- 时间：全部 / 年 / 月 + 箭头步进 -->
          <view class="mode-row">
            <view
              v-for="t in timeOptions"
              :key="t.value"
              class="mode-chip"
              :class="{ active: timeMode === t.value }"
              @click="handleTimeModeChange(t.value)"
            >
              {{ t.label }}
            </view>
            <template v-if="timeMode !== 'all'">
              <view class="step-btn" @click="stepDate(-1)">
                <wd-icon name="arrow-left" size="14px" />
              </view>
              <view class="time-label" @click="showTimePicker = true">{{ timeLabel }}</view>
              <view class="step-btn" @click="stepDate(1)">
                <wd-icon name="arrow-right" size="14px" />
              </view>
            </template>
          </view>
          <wd-datetime-picker
            v-if="timeMode !== 'all'"
            v-model="timePickerValue"
            v-model:show="showTimePicker"
            :type="timeMode === 'year' ? 'year' : 'year-month'"
            @confirm="handleTimePickerConfirm"
          />
          <view class="search-btns">
            <wd-button size="small" plain @click="handleResetFilter">重置</wd-button>
            <wd-button size="small" type="primary" @click="handleSearch">查询</wd-button>
          </view>
        </view>

        <!-- 统计卡片 -->
        <view v-if="canViewStatistics && statistics" class="stat-grid" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view v-for="item in statCards" :key="item.label" class="stat-cell">
            <text class="stat-num" :style="{ color: item.color }">{{ item.value }}</text>
            <text class="stat-label" :style="{ color: subColor }">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <scroll-view
        :scroll-y="true"
        refresher-enabled
        :refresher-triggered="triggered"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
        class="list-scroll"
      >
        <view class="list-inner">
          <view v-for="row in displayList" :key="String(row.id)" class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-top">
              <view class="card-tags">
                <text class="rw-round">第{{ row.reworkNo }}次</text>
                <view class="tag" :style="{ backgroundColor: statusBg(row.status), color: statusColor(row.status) }">
                  {{ statusText(row.status) }}
                </view>
                <view v-if="isOverdue(row)" class="tag overdue-tag">已逾期</view>
              </view>
            </view>
            <view class="card-title" :style="{ color: textColor }">{{ rowProjectName(row) }}</view>
            <view class="item-rows">
              <view class="item-row"><text class="row-label">责任人</text><text class="row-value">{{ row.responsibleName || '-' }}</text></view>
              <view class="item-row">
                <text class="row-label">截止日期</text>
                <text class="row-value" :style="isOverdue(row) ? 'color:#ef4444;font-weight:600' : ''">{{ row.deadline || '-' }}</text>
              </view>
              <view class="item-row"><text class="row-label">返工原因</text><text class="row-value wrap">{{ row.reason || '-' }}</text></view>
              <view v-if="row.requirement" class="item-row"><text class="row-label">返工要求</text><text class="row-value wrap">{{ row.requirement }}</text></view>
              <view class="item-row"><text class="row-label">发起人</text><text class="row-value">{{ row.creatorName || '-' }}（{{ fmtTime(row.createdAt) }}）</text></view>
              <view v-if="row.status === 1" class="item-row">
                <text class="row-label">完成</text>
                <text class="row-value wrap">{{ row.completionNote || '-' }}（{{ row.completedByName || '' }} {{ fmtTime(row.completedAt) }}）</text>
              </view>
              <view v-if="row.status === 2" class="item-row">
                <text class="row-label">取消</text>
                <text class="row-value wrap">{{ row.cancelReason || row.cancelNote || '-' }}（{{ row.cancelledByName || row.canceledByName || '' }} {{ fmtTime(row.cancelledAt || row.canceledAt) }}）</text>
              </view>
            </view>
            <view v-if="canOperateRework" class="card-actions">
              <template v-if="row.status === 0">
                <wd-button size="small" type="primary" plain @click="openEditPage(row)">修改</wd-button>
                <wd-button size="small" type="success" plain @click="openFinishModal(row)">完成</wd-button>
                <wd-button size="small" type="error" plain @click="openCancelModal(row)">取消</wd-button>
              </template>
              <wd-button v-else size="small" type="warning" plain @click="openStartPage(row)">再次返工</wd-button>
            </view>
          </view>

          <view v-if="!loading && dataList.length === 0" class="empty" :style="{ color: subColor }">暂无返工记录</view>
          <wd-loadmore :state="state" @reload="loadData" />
          <view class="bottom-space"></view>
        </view>
      </scroll-view>

      <wd-fab
        v-if="canOperateRework"
        :draggable="true"
        position="right-bottom"
        :z-index="2"
        :gap="{ bottom: 40 }"
        :expandable="false"
        @click="openStartPage()"
      >
        <wd-icon name="add" size="22px" color="#ffffff" />
      </wd-fab>

      <!-- 完成 弹框 -->
      <wd-popup
        :z-index="99"
        closable
        :close-on-click-modal="false"
        :model-value="finishVisible"
        custom-style="width: 86%; border-radius: 32rpx; padding: 24rpx;"
        @update:model-value="finishVisible = $event"
      >
        <view style="margin-bottom: 20rpx; padding-right: 80rpx;">
          <text class="popup-title" :style="{ color: textColor }">完成返工</text>
        </view>
        <view class="tip-banner" :style="{ background: isDark ? 'rgba(22,119,255,0.15)' : '#f0f7ff', color: isDark ? '#69b1ff' : '#1677ff' }">
          完成后项目直接进入「已完成」状态（进度 100%），无需审核。
        </view>
        <textarea
          class="rw-textarea"
          :class="{ dark: isDark }"
          v-model="finishNote"
          maxlength="1000"
          placeholder="请填写完成说明（必填）"
          :placeholder-style="isDark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'"
          auto-height
        />
        <view style="display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx;">
          <wd-button size="small" @click="finishVisible = false">取消</wd-button>
          <wd-button size="small" type="success" :loading="submitting" :disabled="submitting" @click="submitFinish">确认完成</wd-button>
        </view>
      </wd-popup>

      <!-- 取消 弹框 -->
      <wd-popup
        :z-index="99"
        closable
        :close-on-click-modal="false"
        :model-value="cancelVisible"
        custom-style="width: 86%; border-radius: 32rpx; padding: 24rpx;"
        @update:model-value="cancelVisible = $event"
      >
        <view style="margin-bottom: 20rpx; padding-right: 80rpx;">
          <text class="popup-title" :style="{ color: textColor }">取消返工</text>
        </view>
        <view class="tip-banner warn" :style="{ background: isDark ? 'rgba(250,173,20,0.12)' : '#fffbe6', color: isDark ? '#ffc53d' : '#ad6800' }">
          取消后项目恢复为返工前状态，返工记录保留在历史中。
        </view>
        <textarea
          class="rw-textarea"
          :class="{ dark: isDark }"
          v-model="cancelReason"
          maxlength="500"
          placeholder="请填写取消原因（必填）"
          :placeholder-style="isDark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'"
          auto-height
        />
        <view style="display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx;">
          <wd-button size="small" @click="cancelVisible = false">再想想</wd-button>
          <wd-button size="small" type="error" :loading="submitting" :disabled="submitting" @click="submitCancel">确认取消</wd-button>
        </view>
      </wd-popup>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
import { hasPermission } from '@/utils/index'
import { fetchGetReworkPage, fetchGetReworkStatistics, fetchFinishRework, fetchCancelRework } from '@/service/prjRework'
import { fetchGetPrjDataList } from '@/service/prj'
import { fetchGetAllUserDataList } from '@/service/index'
import { fetchGetProjectTeamDataList } from '@/service/groupmanage'

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))
const userType = Number(uni.getStorageSync('usertype'))

function handleBack() {
  // #ifdef H5
  history.go(-1)
  // #endif
  // #ifndef H5
  uni.navigateBack()
  // #endif
}

/* ---------------- 权限（与 web 端口径一致） ---------------- */
const canOperateRework = computed(() => [0, 2].includes(userType) && hasPermission('project:Info:update'))
const canViewStatistics = computed(() => [0, 2].includes(userType) && hasPermission('project:Info:select'))

/* ---------------- 统计卡片 ---------------- */
const statistics = ref<any>(null)
async function getStatistics() {
  if (!canViewStatistics.value) return
  try {
    statistics.value = await fetchGetReworkStatistics()
  } catch (e) {
    console.error('获取返工统计失败', e)
  }
}
const statCards = computed(() => {
  const s = statistics.value || {}
  // reworkRate 单位已是百分比（12.50 => 12.50%），不能再乘 100
  const rate = s.reworkRate == null ? '0' : Number(s.reworkRate).toFixed(2)
  return [
    { label: '项目总数', value: s.totalProjects ?? 0, color: '#0ea5e9' },
    { label: '返工项目', value: s.reworkedProjects ?? 0, color: '#3b82f6' },
    { label: '返工中', value: s.activeReworkProjects ?? 0, color: '#f59e0b' },
    { label: '累计次数', value: s.totalReworkTimes ?? 0, color: '#8b5cf6' },
    { label: '已完成', value: s.completedReworkTimes ?? 0, color: '#22c55e' },
    { label: '已取消', value: s.cancelledReworkTimes ?? 0, color: '#9ca3af' },
    { label: '已逾期', value: s.overdueReworkProjects ?? 0, color: '#ef4444' },
    { label: '返工率', value: `${rate}%`, color: '#10b981' },
  ]
})

/* ---------------- 状态 ---------------- */
const statusOptions = [
  { label: '全部', value: -1 },
  { label: '进行中', value: 0 },
  { label: '已完成', value: 1 },
  { label: '已取消', value: 2 },
  { label: '已逾期', value: 'overdue' as any },
]
const filterStatus = ref<number | string>(-1)

function selectStatus(v: number | string) {
  if (filterStatus.value === v) return
  filterStatus.value = v
  handleFilterChange()
}

function statusText(status: number) {
  return status === 0 ? '进行中' : status === 1 ? '已完成' : status === 2 ? '已取消' : '未知'
}
function statusColor(status: number) {
  return status === 0 ? '#faad14' : status === 1 ? '#22c55e' : '#9ca3af'
}
function statusBg(status: number) {
  return status === 0 ? 'rgba(250, 173, 20, 0.12)' : status === 1 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(156, 163, 175, 0.12)'
}

/** 截止日期早于今天且进行中 => 已逾期（仅展示，不修改数据） */
function isOverdue(row: any) {
  if (Number(row.status) !== 0 || !row.deadline) return false
  const today = new Date()
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return String(row.deadline).slice(0, 10) < t
}

function rowProjectName(r: any) {
  return r.projectName || r.proname || `项目#${r.pid}`
}

function fmtTime(t?: string) {
  const s = String(t || '')
  return s ? s.replace('T', ' ').slice(0, 16) : '-'
}

/* ---------------- 高级筛选 ---------------- */
const showSearch = ref(false)
const modeOptions = [
  { label: '责任人', value: 'user' },
  { label: '组', value: 'group' },
]
const timeOptions = [
  { label: '全部', value: 'all' },
  { label: '年', value: 'year' },
  { label: '月', value: 'month' },
]

const projectFuzzy = ref('')
const filterProjectValue = ref<any>([])
const filterProjectColumns = ref<any[]>([])
const responsibleValue = ref<any>([])
const responsibleColumns = ref<any[]>([])
const responsibleMode = ref<'user' | 'group'>('user')
const groupValue = ref<any>([])
const groupColumns = ref<any[]>([])
const groupList = ref<any[]>([])

const timeMode = ref<'all' | 'year' | 'month'>('all')
const now0 = new Date()
const yearValue = ref(now0.getFullYear())
const monthValue = ref(now0.getFullYear() * 100 + now0.getMonth() + 1)
const showTimePicker = ref(false)
const timePickerValue = ref(Date.now())

const timeLabel = computed(() => (timeMode.value === 'year' ? `${yearValue.value}年` : `${String(monthValue.value).slice(0, 4)}-${String(monthValue.value).slice(4, 6)}`))

function toggleSearchPanel() {
  showSearch.value = !showSearch.value
}

const hasAdvancedFilter = computed(() => {
  const pick = (v: any) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== '')
  return pick(filterProjectValue.value) || pick(responsibleValue.value) || pick(groupValue.value) || timeMode.value !== 'all'
})

/** 项目候选：getPage.do fuzzy 搜索，取前 50 条供选择 */
async function loadFilterProjects(fuzzy = '') {
  try {
    const data: any = await fetchGetPrjDataList({ page: 1, limit: 50, fuzzy })
    const list = data?.list || []
    filterProjectColumns.value = list.map((p: any) => ({ label: p.proname || p.projectName || `项目#${p.id}`, value: p.id }))
  } catch (e) {
    console.error('获取项目候选失败', e)
  }
}

function handleFilterProjectSearch() {
  if (projectFuzzy.value) loadFilterProjects(projectFuzzy.value)
}
function handleFilterProjectClear() {
  projectFuzzy.value = ''
  filterProjectValue.value = []
  loadFilterProjects('')
  handleFilterChange()
}
function handleFilterProjectConfirm({ value }: any) {
  const v = Array.isArray(value) ? value[0] : value
  if (v === undefined || v === null) {
    handleFilterProjectClear()
    return
  }
  filterProjectValue.value = [v]
  handleFilterChange()
}

async function loadResponsibleUsers() {
  try {
    const res: any = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2,3,9' })
    const arr = Array.isArray(res) ? res : res?.list || res?.data || []
    responsibleColumns.value = (arr || [])
      .filter((u: any) => u && u.username && Number(u.status) === 0)
      .map((u: any) => ({ label: u.username, value: u.id }))
  } catch (e) {
    console.error('获取责任人列表失败', e)
  }
}

async function loadGroupList() {
  if (groupList.value.length) return
  try {
    const res: any = await fetchGetProjectTeamDataList({ page: 1, limit: 100 })
    const arr = Array.isArray(res) ? res : res?.list || res?.data || []
    groupList.value = arr || []
    groupColumns.value = groupList.value.map((g: any) => ({ label: g.tname, value: g.id }))
  } catch (e) {
    console.error('获取分组列表失败', e)
  }
}

/** 选中组的组长+组员（组长可能同时在组员里，按 ID 去重） */
const selectedGroupMembers = computed(() => {
  const g = groupList.value.find((item: any) => item.id === (Array.isArray(groupValue.value) ? groupValue.value[0] : groupValue.value))
  if (!g) return [] as { id: number; name: string }[]
  const map = new Map<number, string>()
  if (g.teamleader) map.set(Number(g.teamleader), g.leadername || `用户${g.teamleader}`)
  ;(g.list || g.members || []).forEach((m: any) => {
    if (m.teammember) map.set(Number(m.teammember), m.membername || `用户${m.teammember}`)
  })
  return Array.from(map, ([id, name]) => ({ id, name }))
})
const groupMemberText = computed(() => selectedGroupMembers.value.map((m) => m.name).join('、'))

function handleModeChange(mode: 'user' | 'group') {
  if (responsibleMode.value === mode) return
  responsibleMode.value = mode
  responsibleValue.value = []
  groupValue.value = []
  if (mode === 'group') loadGroupList()
  handleFilterChange()
}

function pickValue(v: any) {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined
  return v === null || v === undefined || v === '' ? undefined : v
}

function handleResponsibleConfirm({ value }: any) {
  const v = pickValue(value)
  responsibleValue.value = v === undefined ? [] : [v]
  handleFilterChange()
}
function handleResponsibleClear() {
  responsibleValue.value = []
  handleFilterChange()
}
function handleGroupConfirm({ value }: any) {
  const v = pickValue(value)
  groupValue.value = v === undefined ? [] : [v]
  handleFilterChange()
}
function handleGroupClear() {
  groupValue.value = []
  handleFilterChange()
}

function handleTimeModeChange(mode: 'all' | 'year' | 'month') {
  if (timeMode.value === mode) return
  timeMode.value = mode
  const now = new Date()
  if (mode === 'year') {
    yearValue.value = now.getFullYear()
    timePickerValue.value = new Date(now.getFullYear(), 0, 1).getTime()
  } else if (mode === 'month') {
    monthValue.value = now.getFullYear() * 100 + now.getMonth() + 1
    timePickerValue.value = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  }
  handleFilterChange()
}

function handleTimePickerConfirm({ value }: any) {
  const d = new Date(value)
  if (timeMode.value === 'year') {
    yearValue.value = d.getFullYear()
  } else {
    monthValue.value = d.getFullYear() * 100 + d.getMonth() + 1
  }
  handleFilterChange()
}

/** 上/下一年、上/下一月（步进后立即查询） */
function stepDate(step: 1 | -1) {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (timeMode.value === 'year') {
    yearValue.value = Number(yearValue.value) + step
  } else if (timeMode.value === 'month') {
    const y = Math.floor(Number(monthValue.value) / 100)
    const m = Number(monthValue.value) % 100
    const dt = new Date(y, m - 1 + step, 1)
    monthValue.value = dt.getFullYear() * 100 + dt.getMonth() + 1
  } else {
    return
  }
  handleFilterChange()
}

function handleResetFilter() {
  projectFuzzy.value = ''
  filterProjectValue.value = []
  responsibleValue.value = []
  groupValue.value = []
  responsibleMode.value = 'user'
  timeMode.value = 'all'
  filterStatus.value = -1
  loadFilterProjects('')
  handleFilterChange()
}

/* ---------------- 列表 ---------------- */
const loading = ref(false)
const triggered = ref(false)
const dataList = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const state = ref('loadmore')

function buildQuery() {
  const q: any = { page: page.value, limit: 15 }
  // 已逾期是前端伪状态：接口发 status=0&overdue=1，拿到列表后再前端过滤
  if (filterStatus.value === 'overdue') {
    q.status = 0
    q.overdue = 1
  } else if (filterStatus.value !== -1) {
    q.status = filterStatus.value
  }
  const pid = pickValue(filterProjectValue.value)
  if (pid !== undefined) q.pid = pid
  if (responsibleMode.value === 'user') {
    const uid = pickValue(responsibleValue.value)
    if (uid !== undefined) q.responsibleIds = String(uid)
  } else {
    const ids = selectedGroupMembers.value.map((m) => m.id).join(',')
    if (ids) q.responsibleIds = ids
  }
  if (timeMode.value === 'year') {
    q.year = yearValue.value
  } else if (timeMode.value === 'month') {
    q.year = Math.floor(Number(monthValue.value) / 100)
    q.month = Number(monthValue.value) % 100
  }
  return q
}

/** 已逾期筛选时在前端再过滤一次，保证展示的都真逾期 */
const displayList = computed(() => (filterStatus.value === 'overdue' ? dataList.value.filter((r: any) => isOverdue(r)) : dataList.value))

async function loadData(reset = false) {
  if (reset) {
    page.value = 1
    dataList.value = []
    total.value = 0
  }
  loading.value = true
  state.value = 'loading'
  try {
    const res: any = await fetchGetReworkPage(buildQuery())
    const list = res?.list || []
    total.value = Number(res?.total ?? 0) || 0
    dataList.value = page.value === 1 ? list : [...dataList.value, ...list]
    state.value = dataList.value.length >= total.value ? 'finished' : 'loadmore'
  } catch (e) {
    console.error('加载返工列表失败', e)
    state.value = 'error'
  } finally {
    loading.value = false
    triggered.value = false
  }
}

function loadMore() {
  if (state.value === 'finished' || state.value === 'loading') return
  page.value++
  loadData()
}

function handleFilterChange() {
  loadData(true)
}

function handleSearch() {
  loadData(true)
}

function onRefresh() {
  triggered.value = true
  getStatistics()
  loadData(true)
}

/** 表单页保存成功后置 rework_refresh，返回列表时据此刷新 */
let lastReworkRefresh = ''
onLoad(() => {
  lastReworkRefresh = String(uni.getStorageSync('rework_refresh') || '')
  getStatistics()
  loadResponsibleUsers()
  loadFilterProjects('')
  loadData(true)
})

onShow(() => {
  const stamp = String(uni.getStorageSync('rework_refresh') || '')
  if (stamp && stamp !== lastReworkRefresh) {
    lastReworkRefresh = stamp
    reloadAll()
  }
})

/* ---------------- 发起 / 修改：跳转独立表单页 ---------------- */
const submitting = ref(false)

function openStartPage(row?: any) {
  if (row) {
    uni.setStorageSync('rework_row', row)
    uni.navigateTo({ url: '/mePages/rework/form?type=start&rerework=1' })
  } else {
    uni.navigateTo({ url: '/mePages/rework/form?type=start' })
  }
}

function openEditPage(row: any) {
  uni.setStorageSync('rework_row', row)
  uni.navigateTo({ url: '/mePages/rework/form?type=edit' })
}

/* ---------------- 完成 / 取消 ---------------- */
const finishVisible = ref(false)
const finishNote = ref('')
const finishTargetId = ref<number>()
function openFinishModal(row: any) {
  finishTargetId.value = row.id
  finishNote.value = ''
  finishVisible.value = true
}
async function submitFinish() {
  if (!finishNote.value.trim()) {
    uni.showToast({ icon: 'none', title: '请填写完成说明', duration: 1500 })
    return
  }
  submitting.value = true
  try {
    await fetchFinishRework({ id: finishTargetId.value!, completionNote: finishNote.value.trim() })
    uni.showToast({ icon: 'success', title: '返工已完成', duration: 1500 })
    finishVisible.value = false
    await reloadAll()
  } catch (e) {
    console.error('完成返工失败', e)
  } finally {
    submitting.value = false
  }
}

const cancelVisible = ref(false)
const cancelReason = ref('')
const cancelTargetId = ref<number>()
function openCancelModal(row: any) {
  cancelTargetId.value = row.id
  cancelReason.value = ''
  cancelVisible.value = true
}
async function submitCancel() {
  if (!cancelReason.value.trim()) {
    uni.showToast({ icon: 'none', title: '请填写取消原因', duration: 1500 })
    return
  }
  submitting.value = true
  try {
    await fetchCancelRework({ id: cancelTargetId.value!, cancelReason: cancelReason.value.trim() })
    uni.showToast({ icon: 'success', title: '返工已取消', duration: 1500 })
    cancelVisible.value = false
    await reloadAll()
  } catch (e) {
    console.error('取消返工失败', e)
  } finally {
    submitting.value = false
  }
}

async function reloadAll() {
  await Promise.all([loadData(true), getStatistics()])
}
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
  gap: 12rpx;
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
.search-toggle {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 0 20rpx;
  color: #1677ff;
  font-size: 28rpx;
  font-weight: 500;
}
.search-toggle.active {
  color: #0b57d0;
}
.search-panel {
  margin-top: 16rpx;
  padding: 8rpx 0 0;
  border-radius: 16rpx;
  overflow: hidden;
}
.search-btns {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  padding: 8rpx 24rpx 20rpx 0;
}
.mode-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  padding: 8rpx 24rpx;
}
.mode-chip {
  padding: 6rpx 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #64748b;
  background: rgba(128, 128, 128, 0.08);
  border: 1rpx solid transparent;
}
.mode-chip.active {
  color: #1677ff;
  background: rgba(22, 119, 255, 0.08);
  border-color: rgba(22, 119, 255, 0.4);
  font-weight: 600;
}
.step-btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(128, 128, 128, 0.08);
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
.group-members {
  padding: 4rpx 24rpx 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
}
:deep(.rw-search) {
  background: transparent;
  margin-bottom: 8rpx;
}
.stat-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx 0;
  border-radius: 20rpx;
  padding: 20rpx 0 8rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}
.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.stat-num {
  font-size: 32rpx;
  font-weight: 700;
}
.stat-label {
  font-size: 20rpx;
}
.list-scroll {
  flex: 1;
  min-height: 0;
  margin-top: 12rpx;
}
.list-inner {
  padding: 0 20rpx;
}
.card {
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.card-tags {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}
.rw-round {
  font-size: 26rpx;
  font-weight: 700;
  color: #1677ff;
}
.tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 500;
}
.overdue-tag {
  color: #e54d42;
  background: rgba(229, 77, 66, 0.08);
}
.card-title {
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 12rpx;
}
.item-rows {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.item-row {
  display: flex;
  gap: 16rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #666;
}
.row-label {
  flex: none;
  width: 120rpx;
  color: #999;
}
.row-value {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}
.card-actions {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.12);
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}
.empty {
  text-align: center;
  padding: 100rpx 0;
  font-size: 26rpx;
}
.bottom-space {
  height: 160rpx;
}
.popup-title {
  font-size: 32rpx;
  font-weight: 700;
}
.tip-banner {
  border-radius: 16rpx;
  padding: 18rpx 22rpx;
  font-size: 24rpx;
  line-height: 1.7;
  margin-bottom: 16rpx;
}
.rw-textarea {
  width: 100%;
  min-height: 120rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #333;
  box-sizing: border-box;
}
.rw-textarea.dark {
  color: #e8e8e8;
}
</style>
