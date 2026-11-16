<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page">
      <!-- 导航栏：左侧返回，中间标题，右侧新增“查询”按钮 -->
      <wd-navbar
        left-arrow
        title="满意度评价"
        safe-area-inset-top
        placeholder
        :bordered="false"
        @click-left="handleBack"
      >
    </wd-navbar>
    
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
          <wd-picker
            clearable
            label="调查月份"
            label-width="140rpx"
            align-right
            :columns="monthColumns"
            v-model="monthValue"
            placeholder="请选择调查月份"
            @confirm="handleSearch"
            @clear="handleSearch"
          />
          <wd-picker
            clearable
            label="调查人"
            label-width="140rpx"
            align-right
            :columns="surveyUserColumns"
            v-model="surveyUserValue"
            placeholder="请选择调查人"
            @confirm="handleSearch"
            @clear="handleSearch"
          />
          <wd-picker
            clearable
            label="填写人"
            label-width="140rpx"
            align-right
            :columns="createrUserColumns"
            v-model="createrUserValue"
            placeholder="请选择填写人"
            @confirm="handleSearch"
            @clear="handleSearch"
          />
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
            个答卷</text
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
                <view class="tag tag-status" :style="{ backgroundColor: statusColor(row) + '20', color: statusColor(row) }">
                  <view class="status-dot" :style="{ backgroundColor: statusColor(row) }"></view>
                  {{ row.status === 1 ? '已提交' : '未提交' }}
                </view>
                <view
                  class="tag tag-type"
                  :style="{ backgroundColor: row.surveyType === 2 ? 'rgba(250, 173, 20, 0.15)' : 'rgba(22, 119, 255, 0.10)', color: row.surveyType === 2 ? '#d48806' : '#1677ff' }"
                >
                  {{ row.surveyType === 2 ? '小组' : '个人' }}
                </view>
                <view
                  v-if="row.overallScore !== null && row.overallScore !== undefined"
                  class="tag tag-score"
                  :style="{ backgroundColor: scoreTagBg(row.overallScore), color: scoreTagColor(row.overallScore) }"
                >
                  {{ getScoreLevel(row.overallScore) }}
                </view>
              </view>
              <text class="card-date" :style="{ color: subColor }">{{ formatMonth(row.surveyMonth) }}</text>
            </view>

            <view class="card-title" :style="{ color: textColor }">
              <text class="title-label">被调查人：</text><text>{{ row.surveyName || '-' }}</text>
            </view>

            <view v-if="row.surveyType === 2 && row.surveyTeam" class="team-line" :style="{ color: subColor }">
              <text>组长：{{ row.surveyTeam.leadername || '-' }}</text>
              <text class="team-members">组员：{{ teamMemberNames(row.surveyTeam) || '无' }}</text>
            </view>

            <view class="card-subtitle" :style="{ color: subColor }">
              <text>填写人：{{ row.createrName || '-' }}</text>
              <text class="card-dot">·</text>
              <text>调查日期：{{ row.surveyDate || '-' }}</text>
            </view>

            <view
              v-if="row.overallScore !== null && row.overallScore !== undefined"
              class="score-display"
              :style="{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }"
            >
              <text class="score-label">综合评分</text>
              <text class="score-value" :style="{ color: scoreColor(row.overallScore) }">
                {{ Number(row.overallScore).toFixed(2) }}
              </text>
              <view class="score-stars">
                <text
                  v-for="i in 5"
                  :key="i"
                  class="star"
                  :style="{ color: i <= Math.round(row.overallScore) ? scoreColor(row.overallScore) : '#d9d9d9' }"
                >
                  ★
                </text>
              </view>
            </view>

            <view class="card-actions">
              <wd-button
                v-if="row.status === 0 && row.creater == userId"
                size="small"
                type="success"
                plain
                @click="handleSubmit(row)"
              >
                提交
              </wd-button>
              <wd-button size="small" type="primary" plain @click="handleView(row)">查看</wd-button>
              <wd-button
                v-if="row.status === 0 && row.creater == userId"
                size="small"
                type="warning"
                plain
                @click="handleEdit(row)"
              >
                编辑
              </wd-button>
            </view>
          </view>

          <view v-if="!loading && dataList.length === 0" class="empty" :style="{ color: subColor }">
            暂无答卷数据
          </view>
          <wd-loadmore :state="state" @reload="loadData" />
          <view class="bottom-space"></view>
        </view>
      </scroll-view>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import { fetchGetProjectSatisfactAnswerPage, fetchUpdateProjectSatisfactAnswer } from '@/service/projectSatisfaction'
import { fetchGetAllUserDataList } from '@/service/index'

const message = useMessage()
const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))
const userId = String(uni.getStorageSync('userId'))

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
  { label: '未提交', value: 0 },
  { label: '已提交', value: 1 },
]
const filterStatus = ref(-1)

function selectStatus(v) {
  if (filterStatus.value === v) return
  filterStatus.value = v
  handleFilterChange()
}

// ----- 高级查询 -----
const showSearch = ref(false)
const typeColumns = [
  { label: '个人', value: 1 },
  { label: '小组', value: 2 },
]
const typeValue = ref<any>([])
const monthColumns = ref<any[]>([])
const monthValue = ref<any>([])
const surveyUserColumns = ref<any[]>([])
const surveyUserValue = ref<any>([])
const createrUserColumns = ref<any[]>([])
const createrUserValue = ref<any>([])

function buildMonthColumns() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const cols: any[] = []
  // 范围：近 5 年（含当月），截止到本月；倒序（最新在前），
  // 避免默认选中项（上个月）落在列表末尾导致弹层滚动定位失败
  for (let year = y; year >= y - 5; year--) {
    const startM = year === y ? m : 12
    const endM = year === y - 5 ? m : 1
    for (let mo = startM; mo >= endM; mo--) {
      cols.push({ label: year + '-' + String(mo).padStart(2, '0'), value: year * 100 + mo })
    }
  }
  monthColumns.value = cols
}

// wd-picker 未选择时 modelValue 为 []，清除后为 ''，统一归一化
function pickerValue(v: any) {
  if (v === null || v === undefined) return undefined
  if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined
  if (v === '') return undefined
  return v
}

const hasAdvancedFilter = computed(() => {
  return (
    pickerValue(typeValue.value) !== undefined ||
    pickerValue(monthValue.value) !== undefined ||
    pickerValue(surveyUserValue.value) !== undefined ||
    pickerValue(createrUserValue.value) !== undefined
  )
})

function toggleSearchPanel() {
  showSearch.value = !showSearch.value
}

function handleResetFilter() {
  typeValue.value = []
  monthValue.value = []
  surveyUserValue.value = []
  createrUserValue.value = []
  filterStatus.value = -1
  handleFilterChange()
}

async function loadUserOptions() {
  try {
    const [surveyRes, createrRes]: any[] = await Promise.all([
      fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2,3,9' }),
      fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '0,1' }),
    ])
    const toArr = (res: any) => (Array.isArray(res) ? res : res?.list || res?.data || [])
    // 过滤离职人员（status === 1 表示离职，仅保留在职 status === 0）
    const surveyList = (toArr(surveyRes) || []).filter((u: any) => u && u.username && u.status === 0)
    const createrList = (toArr(createrRes) || []).filter((u: any) => u && u.username && u.status === 0)
    surveyUserColumns.value = surveyList.map((u: any) => ({ label: u.username, value: u.id }))
    createrUserColumns.value = createrList.map((u: any) => ({ label: u.username, value: u.id }))
  } catch (e) {
    console.error('获取用户列表失败', e)
  }
}
// -------------------------

const loading = ref(false)
const triggered = ref(false)
const dataList = ref([])
const page = ref(1)
const total = ref(0)
const state = ref('loadmore')
const scrollIntoId = ref('')

function buildQuery() {
  const q: any = {
    page: page.value,
    limit: 15,
  }
  if (filterStatus.value !== -1) q.status = filterStatus.value
  const stype = pickerValue(typeValue.value)
  if (stype !== undefined) q.surveyType = stype
  const month = pickerValue(monthValue.value)
  if (month !== undefined) q.surveyMonth = month
  const surveyId = pickerValue(surveyUserValue.value)
  if (surveyId !== undefined) q.surveyId = surveyId
  const creater = pickerValue(createrUserValue.value)
  if (creater !== undefined) q.creater = creater
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
    const res = await fetchGetProjectSatisfactAnswerPage(buildQuery())
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

// ----- 新增的查询方法 -----
function handleSearch() {
  // 滚动到顶部并刷新数据
  scrollIntoId.value = 'listTop'
  setTimeout(() => {
    scrollIntoId.value = ''
  }, 100)
  loadData(true)
}
// -------------------------

onLoad(() => {
  buildMonthColumns()
  loadUserOptions()
  loadData(true)
})

onShow(() => {
  if (uni.getStorageSync('satisfact_refresh')) {
    uni.removeStorageSync('satisfact_refresh')
    loadData(true)
  }
})

onPullDownRefresh(() => {
  loadData(true)
})
onReachBottom(() => {
  loadMore()
})

function statusColor(row) {
  return row.status === 1 ? '#52c41a' : '#faad14'
}
function scoreColor(score) {
  if (score >= 4.5) return '#52c41a'
  if (score >= 3.5) return '#18a058'
  if (score >= 2.5) return '#faad14'
  if (score >= 1.5) return '#fa8c16'
  return '#f5222d'
}
function scoreTagBg(score) {
  if (score >= 4.5) return 'rgba(82, 196, 26, 0.15)'
  if (score >= 3.5) return 'rgba(24, 160, 88, 0.15)'
  if (score >= 2.5) return 'rgba(250, 173, 20, 0.15)'
  if (score >= 1.5) return 'rgba(250, 140, 22, 0.15)'
  return 'rgba(245, 34, 45, 0.15)'
}
function scoreTagColor(score) {
  return scoreColor(score)
}
function getScoreLevel(score) {
  if (score >= 4.5) return '非常满意'
  if (score >= 3.5) return '满意'
  if (score >= 2.5) return '一般'
  if (score >= 1.5) return '不满意'
  return '非常不满意'
}
function formatMonth(month) {
  if (month === null || month === undefined) return '-'
  const s = String(month)
  if (s.length === 6) return s.slice(0, 4) + '-' + s.slice(4, 6)
  return String(month)
}

/** 小组的组员名列表（排除组长，与 web 端口径一致） */
function teamMemberNames(team: any) {
  const members = (team?.list || [])
    .filter((m: any) => m && m.teammember && String(m.teammember) !== String(team.teamleader))
    .map((m: any) => m.membername || `用户${m.teammember}`)
  return members.join('、')
}

function handleView(row) {
  uni.setStorageSync('satisfact_row', row)
  uni.navigateTo({ url: '/mePages/projectSatisfaction/form?type=view' })
}
function handleEdit(row) {
  uni.setStorageSync('satisfact_row', row)
  uni.navigateTo({ url: '/mePages/projectSatisfaction/form?type=edit' })
}

function handleSubmit(row) {
  message
    .confirm({ msg: '确定提交该答卷吗？提交后不可再修改', title: '提交确认' })
    .then(async () => {
      try {
        const RATE_FIELDS = [
          'responseTimeliness',
          'technicalProfessionalism',
          'problemSolvingAbility',
          'communicationClarity',
          'supportCooperation',
          'demandUnderstanding',
          'technicalSolutionSupport',
          'issueFollowUp',
          'workResponsibility',
          'onsitePerformance',
          'technicalDocumentSupport',
          'overallSatisfaction',
        ]
        const scores = RATE_FIELDS.map((f) => Number(row[f])).filter((v) => v > 0)
        if (scores.length !== RATE_FIELDS.length) {
          uni.showToast({ title: '存在未完成的评分项', icon: 'none' })
          return
        }
        const overallScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        const payload = { ...row, status: 1, overallScore }
        payload.surveyMonth = Number(payload.surveyMonth)
        payload.surveyId = Number(payload.surveyId)
        payload.surveyType = Number(payload.surveyType || 1)
        delete payload.surveyTeam
        await fetchUpdateProjectSatisfactAnswer(payload)
        uni.showToast({ title: '提交成功', icon: 'success' })
        loadData(true)
      } catch (e) {
        console.error('提交失败', e)
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
  align-items: center;
  margin-bottom: 16rpx;
}
.card-tags {
  display: flex;
  align-items: center;
  gap: 12rpx;
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
  font-size: 24rpx;
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
.team-line {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.card-dot {
  color: #d9d9d9;
}
.score-display {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.score-label {
  font-size: 24rpx;
  color: #64748b;
}
.score-value {
  font-size: 40rpx;
  font-weight: 700;
}
.score-stars {
  display: flex;
  gap: 4rpx;
  margin-left: 8rpx;
}
.star {
  font-size: 28rpx;
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
</style>