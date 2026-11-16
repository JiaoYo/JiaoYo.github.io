<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page">
      <wd-navbar
        left-arrow
        title="出差推送"
        safe-area-inset-top
        placeholder
        :bordered="false"
        @click-left="handleBack"
      />

      <view class="filter-area" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#f5f6f8' }">
        <view class="chips-row">
          <view
            v-for="opt in statusOptions"
            :key="opt.value"
            class="chip"
            :class="{ active: filterStatus === opt.value }"
            @click="selectStatus(opt.value)"
          >
            {{ opt.label }}
          </view>
          <view @click="toggleSearchPanel" class="search-toggle" :class="{ active: showSearch || hasAdvancedFilter }">
            <wd-icon name="filter" size="14px" />
            <text>筛选</text>
          </view>
          <wd-button v-if="!showSearch" size="small" type="primary" @click="handleSearch">查询</wd-button>
        </view>

        <view v-if="showSearch" class="search-panel" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="prj-filter-cell" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
            <text class="prj-filter-label" :style="{ color: isDark ? '#8e8e93' : '#6b7280' }">出差项目</text>
            <view class="prj-filter-value" @click="openPrjPicker">
              <text
                class="prj-filter-text"
                :style="{ color: proFilterName ? (isDark ? '#e5e5e5' : '#1f2937') : isDark ? '#8e8e93' : '#9ca3af' }"
              >{{ proFilterName || '请选择出差项目' }}</text>
              <wd-icon v-if="proFilterName" name="close-circle" size="32rpx" :color="isDark ? '#666666' : '#c0c4cc'" @click.stop="clearPrjFilter"></wd-icon>
              <wd-icon name="chevron-down" size="28rpx" :color="isDark ? '#8e8e93' : '#c0c4cc'"></wd-icon>
            </view>
          </view>
          <wd-picker
            clearable
            label="出差人"
            label-width="140rpx"
            align-right
            :columns="userColumns"
            v-model="userValue"
            placeholder="请选择出差人"
            @confirm="handleSearch"
            @clear="handleSearch"
          />
          <wd-picker
            clearable
            label="总经理"
            label-width="140rpx"
            align-right
            :columns="pushStatusColumns"
            v-model="pushStatus1Value"
            placeholder="请选择阅读状态"
            @confirm="handleSearch"
            @clear="handleSearch"
          />
          <wd-picker
            clearable
            label="综合管理"
            label-width="140rpx"
            align-right
            :columns="pushStatusColumns"
            v-model="pushStatus2Value"
            placeholder="请选择阅读状态"
            @confirm="handleSearch"
            @clear="handleSearch"
          />
          <view class="date-row">
            <text class="date-label" :style="{ color: subColor }">出发日期</text>
            <view class="date-pickers">
              <wd-datetime-picker
                type="date"
                :z-index="9999"
                v-model="startDateValue"
                :default-value="todayTs"
                :max-date="endDateValue || undefined"
                placeholder="开始日期"
                @confirm="handleSearch"
              />
              <text class="date-sep">~</text>
              <wd-datetime-picker
                type="date"
                :z-index="9999"
                v-model="endDateValue"
                :default-value="todayTs"
                :min-date="startDateValue || undefined"
                placeholder="结束日期"
                @confirm="handleSearch"
              />
            </view>
          </view>
          <view class="search-btns">
            <wd-button size="small" plain @click="handleResetFilter">重置</wd-button>
            <wd-button size="small" type="primary" @click="handleSearch">查询</wd-button>
          </view>
        </view>
        <view
          class="summary-chip"
          :style="{
            background: isDark ? '#2a2a2a' : '#f7f8fa',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#f0f1f3',
            color: isDark ? '#8a9099' : '#4e5969',
          }"
        >
          <text class="summary-dot"></text>
          <text class="summary-text"
            >已加载
            <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text>
            / 共
            <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text>
            条推送</text
          >
        </view>
      </view>

      <scroll-view
        :scroll-y="true"
        :scroll-into-view="scrollIntoId"
        refresher-enabled
        :refresher-triggered="triggered"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
        class="list-scroll"
      >
        <view id="listTop" />
        <view class="list-inner">
          <view
            v-for="row in dataList"
            :key="row.id"
            class="card"
            :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }"
          >
            <view class="card-top">
              <view class="card-tags">
                <view
                  class="tag tag-status"
                  :style="{ backgroundColor: statusColor(row) + '20', color: statusColor(row) }"
                >
                  <view class="status-dot" :style="{ backgroundColor: statusColor(row) }"></view>
                  {{ row.status === 1 ? '已撤回' : '正常' }}
                </view>
                <view
                  class="tag"
                  :style="{ backgroundColor: pushStatusColor(row.pushStatus1) + '20', color: pushStatusColor(row.pushStatus1) }"
                >
                  总经理{{ row.pushStatus1 === 1 ? '已读' : '未读' }}
                </view>
                <view
                  class="tag"
                  :style="{ backgroundColor: pushStatusColor(row.pushStatus2) + '20', color: pushStatusColor(row.pushStatus2) }"
                >
                  综合管理{{ row.pushStatus2 === 1 ? '已读' : '未读' }}
                </view>
              </view>
              <text class="card-date" :style="{ color: subColor }">{{ row.dbtime || '-' }}</text>
            </view>

            <view class="card-title" :style="{ color: textColor }">
              <text class="title-label">出差人：</text><text>{{ row.travelerName || '-' }}</text>
            </view>

            <view class="card-subtitle" :style="{ color: subColor }">
              <text>项目：{{ row.proname || row.proName || '-' }}</text>
            </view>
            <view class="card-subtitle" :style="{ color: subColor }">
              <text>地址：{{ row.addr || '-' }}</text>
            </view>
            <view class="card-subtitle" :style="{ color: subColor }">
              <text>事由：{{ row.reason || '-' }}</text>
            </view>
            <view class="card-subtitle" :style="{ color: subColor }">
              <text>出发：{{ row.starttime || '-' }}</text>
              <text class="card-dot">·</text>
              <text>预计{{ row.expecteddays != null ? row.expecteddays + ' 天' : '-' }}</text>
            </view>

            <view class="card-actions">
              <wd-button
                v-if="String(loginUserId) === '1002' && row.pushStatus1 !== 1"
                size="small"
                type="info"
                plain
                @click="handleRead(row, 1)"
              >
                总经理已读
              </wd-button>
              <wd-button
                v-if="String(loginUserId) === '1022' && row.pushStatus2 !== 1"
                size="small"
                type="info"
                plain
                @click="handleRead(row, 2)"
              >
                综合管理已读
              </wd-button>
              <wd-button
                v-if="row.status === 0 && canAdd"
                size="small"
                type="warning"
                plain
                @click="handleWithdraw(row)"
              >
                撤回
              </wd-button>
              <wd-button v-if="canAdd" size="small" type="danger" plain @click="handleDelete(row)">
                删除
              </wd-button>
            </view>
          </view>

          <view v-if="!loading && dataList.length === 0" class="empty" :style="{ color: subColor }">
            {{ canAdd ? '暂无出差推送，点击右下角「+」新增' : '暂无出差推送' }}
          </view>
          <wd-loadmore :state="state" @reload="loadData" />
          <view class="bottom-space"></view>
        </view>
      </scroll-view>

      <wd-fab
        v-if="canAdd"
        :draggable="true"
        position="right-bottom"
        :z-index="2"
        :gap="{ bottom: 40 }"
        :expandable="false"
        @click="handleAdd"
      />

      <!-- 出差项目筛选弹窗（支持服务端搜索） -->
      <wd-popup v-model="prjShow" position="bottom" :z-index="500" custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
        <view class="picker-wrap" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="picker-header" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">选择出差项目</view>
          <wd-search v-model="prjFuzzy" placeholder="输入项目名称搜索" placeholder-left cancel-txt="搜索" @search="searchProject" @cancel="searchProject" @clear="clearProjectFuzzy" />
          <scroll-view scroll-y class="picker-list" @scrolltolower="loadMoreProject">
            <view
              v-for="item in prjList"
              :key="item.id"
              class="picker-item"
              :class="{ active: proFilterId === item.id }"
              @click="selectFilterProject(item)"
            >
              <text class="picker-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ item.proname || item.proName }}</text>
              <wd-icon v-if="proFilterId === item.id" name="check" size="36rpx" color="#3b82f6"></wd-icon>
            </view>
            <view v-if="!loadingProject && prjList.length === 0" class="picker-empty" :style="{ color: isDark ? '#6a6a6a' : '#9ca3af' }">暂无项目</view>
            <wd-loadmore :state="prjState" @reload="loadProject" />
          </scroll-view>
        </view>
      </wd-popup>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import {
  fetchGetProjectTripPushPage,
  fetchUpdateProjectTripPush,
  fetchDeleteProjectTripPush,
} from '@/service/tripPush'
import { fetchGetAllUserDataList, fetchGetPrjDataList } from '@/service/index'

const message = useMessage()
const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

const loginUserId = String(uni.getStorageSync('userId'))
const userType = uni.getStorageSync('usertype')
// 仅 usertype === 2（综合管理）可新增/撤回/删除
const canAdd = computed(() => Number(userType) === 2)

function handleBack() {
  // #ifdef H5
  history.go(-1)
  // #endif
  // #ifndef H5
  uni.navigateBack()
  // #endif
}

const statusOptions = [
  { label: '全部', value: -1 },
  { label: '正常', value: 0 },
  { label: '已撤回', value: 1 },
]
const filterStatus = ref(-1)

function selectStatus(v: number) {
  if (filterStatus.value === v) return
  filterStatus.value = v
  handleFilterChange()
}

// ----- 高级查询 -----
const showSearch = ref(false)
const proValue = ref<any>([])
const userValue = ref<any>([])
const pushStatus1Value = ref<any>([])
const pushStatus2Value = ref<any>([])
// wd-datetime-picker type="date" 用时间戳；0 表示未选（默认占位）
const startDateValue = ref<number>(0)
const endDateValue = ref<number>(0)
// 打开日历时默认落在今天
const todayTs = new Date(new Date().setHours(0, 0, 0, 0)).getTime()

const pushStatusColumns = [
  { label: '未读', value: 0 },
  { label: '已读', value: 1 },
]
const userColumns = ref<any[]>([])

// 出差项目筛选弹窗（服务端搜索 + 分页）
const prjShow = ref(false)
const prjFuzzy = ref('')
const prjList = ref<any[]>([])
const prjPage = ref(1)
const prjTotal = ref(0)
const loadingProject = ref(false)
const prjState = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore')
const proFilterName = ref('')
const proFilterId = computed(() => pickerValue(proValue.value))

// wd-picker 未选择时 modelValue 为 []，清除后为 ''，统一归一化
function pickerValue(v: any) {
  if (v === null || v === undefined) return undefined
  if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined
  if (v === '') return undefined
  return v
}

const hasAdvancedFilter = computed(() => {
  return (
    pickerValue(proValue.value) !== undefined ||
    pickerValue(userValue.value) !== undefined ||
    pickerValue(pushStatus1Value.value) !== undefined ||
    pickerValue(pushStatus2Value.value) !== undefined ||
    startDateValue.value > 0 ||
    endDateValue.value > 0
  )
})

function toggleSearchPanel() {
  showSearch.value = !showSearch.value
}

function handleResetFilter() {
  proValue.value = []
  proFilterName.value = ''
  userValue.value = []
  pushStatus1Value.value = []
  pushStatus2Value.value = []
  startDateValue.value = 0
  endDateValue.value = 0
  filterStatus.value = -1
  handleFilterChange()
}

async function loadPickerOptions() {
  try {
    const userRes: any = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2,3,9' })
    const toArr = (res: any) => (Array.isArray(res) ? res : res?.list || res?.data || [])
    // 过滤离职人员（status === 0 在职）
    userColumns.value = (toArr(userRes) || [])
      .filter((u: any) => u && u.username && u.status === 0)
      .map((u: any) => ({ label: u.username, value: u.id }))
  } catch (e) {
    console.error('获取筛选项失败', e)
  }
}

// ===== 出差项目筛选弹窗（服务端 fuzzy 搜索 + 分页，同 projectServiceSign 列表页） =====
function openPrjPicker() {
  prjShow.value = true
  if (prjList.value.length === 0) loadProject(true)
}

async function loadProject(reset = false) {
  if (reset) {
    prjPage.value = 1
    prjList.value = []
    prjTotal.value = 0
  }
  loadingProject.value = true
  prjState.value = 'loading'
  try {
    const data: any = await fetchGetPrjDataList({
      page: prjPage.value,
      limit: 20,
      ...(prjFuzzy.value ? { fuzzy: prjFuzzy.value } : {})
    })
    const arr = Array.isArray(data) ? data : data.list || []
    prjTotal.value = Array.isArray(data) ? arr.length : data.total || 0
    prjList.value = prjPage.value === 1 ? arr : [...prjList.value, ...arr]
    prjState.value = prjList.value.length >= prjTotal.value ? 'finished' : 'loadmore'
  } catch (e) {
    console.error('加载项目列表失败', e)
    prjState.value = 'error'
  } finally {
    loadingProject.value = false
  }
}

function searchProject() {
  loadProject(true)
}

function clearProjectFuzzy() {
  prjFuzzy.value = ''
  loadProject(true)
}

function loadMoreProject() {
  if (prjState.value === 'finished' || prjState.value === 'loading') return
  prjPage.value++
  loadProject()
}

function selectFilterProject(item: any) {
  proValue.value = item.id
  proFilterName.value = item.proname || item.proName || ''
  prjShow.value = false
  handleSearch()
}

function clearPrjFilter() {
  if (pickerValue(proValue.value) === undefined) return
  proValue.value = []
  proFilterName.value = ''
  handleSearch()
}
// -------------------------
// -------------------------

const loading = ref(false)
const triggered = ref(false)
const dataList = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore')
const scrollIntoId = ref('')

function fmtDate(ts: number) {
  const d = new Date(ts)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function buildQuery() {
  const q: any = {
    page: page.value,
    limit: 15,
    _t: new Date().getTime(),
  }
  if (filterStatus.value !== -1) q.status = filterStatus.value
  const proId = pickerValue(proValue.value)
  if (proId !== undefined) q.proId = proId
  const userId = pickerValue(userValue.value)
  if (userId !== undefined) q.userId = userId
  const ps1 = pickerValue(pushStatus1Value.value)
  if (ps1 !== undefined) q.pushStatus1 = ps1
  const ps2 = pickerValue(pushStatus2Value.value)
  if (ps2 !== undefined) q.pushStatus2 = ps2
  if (startDateValue.value > 0) q.startDate = fmtDate(startDateValue.value)
  if (endDateValue.value > 0) q.endDate = fmtDate(endDateValue.value)
  return q
}

async function loadData(reset = false) {
  if (reset) {
    page.value = 1
    dataList.value = []
    total.value = 0
  }
  loading.value = true
  state.value = 'loading'
  try {
    const res: any = await fetchGetProjectTripPushPage(buildQuery())
    const list = res.list || []
    total.value = res.total || 0
    dataList.value = page.value === 1 ? list : [...dataList.value, ...list]
    state.value = dataList.value.length >= total.value ? 'finished' : 'loadmore'
  } catch (e) {
    console.error('加载失败', e)
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
  scrollIntoId.value = 'listTop'
  setTimeout(() => {
    scrollIntoId.value = ''
  }, 100)
  loadData(true)
}

function onRefresh() {
  triggered.value = true
  loadData(true)
}

function handleSearch() {
  scrollIntoId.value = 'listTop'
  setTimeout(() => {
    scrollIntoId.value = ''
  }, 100)
  loadData(true)
}

onLoad(() => {
  loadPickerOptions()
  loadData(true)
})

onShow(() => {
  if (uni.getStorageSync('trippush_refresh')) {
    uni.removeStorageSync('trippush_refresh')
    loadData(true)
  }
})

onPullDownRefresh(() => {
  loadData(true)
})
onReachBottom(() => {
  loadMore()
})

function statusColor(row: any) {
  return row.status === 1 ? '#f5222d' : '#52c41a'
}
function pushStatusColor(v: any) {
  return v === 1 ? '#52c41a' : '#8e8e93'
}

function handleAdd() {
  uni.navigateTo({ url: '/mePages/tripPush/form?type=add' })
}

// 已读：channel 1 -> pushStatus1=1，channel 2 -> pushStatus2=1
function handleRead(row: any, channel: 1 | 2) {
  message
    .confirm({ msg: '确定标记为已读吗？', title: '已读确认' })
    .then(async () => {
      try {
        const patch = channel === 1 ? { pushStatus1: 1 } : { pushStatus2: 1 }
        await fetchUpdateProjectTripPush([{ ...row, ...patch }])
        uni.showToast({ title: '已标记为已读', icon: 'success' })
        loadData(true)
      } catch (e) {
        console.error('操作失败', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    })
    .catch(() => {})
}

// 撤回（只能一次：status 0 -> 1）
function handleWithdraw(row: any) {
  message
    .confirm({
      msg: '确定撤回该出差推送吗？撤回后不可再次操作！',
      title: '撤回确认',
      confirmButtonText: '确认撤回',
      confirmButtonProps: { type: 'warning' },
    })
    .then(async () => {
      try {
        await fetchUpdateProjectTripPush([{ ...row, status: 1 }])
        uni.showToast({ title: '撤回成功', icon: 'success' })
        loadData(true)
      } catch (e) {
        console.error('撤回失败', e)
        uni.showToast({ title: '撤回失败', icon: 'none' })
      }
    })
    .catch(() => {})
}

function handleDelete(row: any) {
  message
    .confirm({
      msg: '确定要删除该出差推送吗？',
      title: '删除确认',
      confirmButtonText: '确认删除',
      confirmButtonProps: { type: 'error' },
    })
    .then(async () => {
      try {
        await fetchDeleteProjectTripPush(String(row.id))
        uni.showToast({ title: '删除成功', icon: 'success' })
        loadData(true)
      } catch (e) {
        console.error('删除失败', e)
      }
    })
    .catch(() => {})
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
  background-color: #f5f6f8;
}
.filter-area .chips-row {
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
.date-row {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
}
.date-label {
  width: 140rpx;
  flex-shrink: 0;
  font-size: 28rpx;
}
.date-pickers {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.date-pickers :deep(.wd-datetime-picker) {
  flex: 1;
}
.date-sep {
  color: #9ca3af;
  flex-shrink: 0;
}
.search-btns {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  padding: 8rpx 24rpx 20rpx 0;
}
.prj-filter-cell {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid;

  .prj-filter-label {
    width: 140rpx;
    flex-shrink: 0;
    font-size: 28rpx;
  }

  .prj-filter-value {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8rpx;
    min-width: 0;
  }

  .prj-filter-text {
    font-size: 28rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 出差项目筛选弹窗
.picker-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .picker-header {
    font-size: 32rpx;
    font-weight: 600;
    text-align: center;
    padding: 30rpx 0 20rpx;
  }

  .picker-list {
    flex: 1;
    min-height: 0;

    .picker-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 26rpx 30rpx;
      border-bottom: 1rpx solid rgba(128, 128, 128, 0.12);

      &.active {
        background: rgba(59, 130, 246, 0.08);
      }

      .picker-name {
        font-size: 28rpx;
        color: #1f2937;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .picker-empty {
      text-align: center;
      padding: 60rpx 0;
      font-size: 26rpx;
      color: #9ca3af;
    }
  }
}
.summary-chip {
  margin-top: 12rpx;
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: #f7f8fa;
  border: 1rpx solid #f0f1f3;
  font-size: 24rpx;
  color: #4e5969;
}
.summary-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}
.summary-num {
  font-weight: 600;
  color: #1677ff;
  margin: 0 4rpx;
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
  align-items: flex-start;
  margin-bottom: 16rpx;
  gap: 12rpx;
}
.card-tags {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
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
.status-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
}
.card-date {
  font-size: 22rpx;
  flex-shrink: 0;
}
.card-title {
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.4;
}
.title-label {
  color: #64748b;
  font-weight: 500;
}
.card-subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.card-dot {
  color: #d9d9d9;
}
.card-actions {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.12);
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  flex-wrap: wrap;
}
.empty {
  text-align: center;
  padding: 100rpx 0;
  font-size: 26rpx;
}
.bottom-space {
  height: 160rpx;
}
</style>
