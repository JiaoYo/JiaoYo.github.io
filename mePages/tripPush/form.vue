<template>
  <wd-config-provider :theme-vars="themeVars" :theme="theme">
    <view class="page" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
      <wd-navbar left-arrow title="新增出差推送" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />
      <scroll-view :scroll-y="true" class="form-scroll">
        <view class="form-content">
          <!-- 基本信息 -->
          <view class="form-section">
            <view class="section-title" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">基本信息</view>
            <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
              <!-- 出差项目：自定义弹窗，支持搜索 -->
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }" @click="openProjectPopup">
                <text class="form-label"><text class="required">*</text>出差项目</text>
                <view class="form-value">
                  <text v-if="selectedProjectName" class="value-text" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">{{ selectedProjectName }}</text>
                  <text v-else class="value-placeholder">请选择出差项目</text>
                  <wd-icon name="chevron-right" size="28rpx" :color="isDark ? '#6a6a6a' : '#c0c4cc'"></wd-icon>
                </view>
              </view>
              <!-- 出差人 -->
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label"><text class="required">*</text>出差人</text>
                <wd-picker
                  v-model="formData.userValue"
                  :columns="userColumns"
                  placeholder="请选择出差人"
                />
              </view>
              <!-- 出差地址 -->
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label"><text class="required">*</text>出差地址</text>
                <input
                  v-model="formData.addr"
                  class="form-input"
                  :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }"
                  placeholder="请输入出差地址"
                  placeholder-class="ph"
                  maxlength="255"
                />
              </view>
              <!-- 出发日期 -->
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label"><text class="required">*</text>出发日期</text>
                <wd-datetime-picker
                  :model-value="starttime"
                  type="date"
                  :min-date="todayStartTs"
                  placeholder="请选择出发日期"
                  @confirm="onDateConfirm"
                />
              </view>
              <!-- 预计天数 -->
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label"><text class="required">*</text>预计天数</text>
                <input
                  v-model="formData.expecteddays"
                  class="form-input"
                  :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }"
                  type="number"
                  placeholder="请输入预计天数"
                  placeholder-class="ph"
                />
              </view>
              <!-- 出差事由 -->
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label"><text class="required">*</text>出差事由</text>
                <input
                  v-model="formData.reason"
                  class="form-input"
                  :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }"
                  placeholder="请输入出差事由"
                  placeholder-class="ph"
                  maxlength="255"
                />
              </view>
            </view>
          </view>

          <view class="submit-area">
            <wd-button type="primary" size="large" style="width: 100%;" @click="handleSave">保存</wd-button>
          </view>
        </view>
        <view class="bottom-space"></view>
      </scroll-view>

      <!-- ============ 出差项目选择弹窗（支持搜索） ============ -->
      <wd-popup v-model="projectPopup" position="bottom" :z-index="500" custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
        <view class="picker-wrap" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="picker-header" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">选择出差项目</view>
          <wd-search v-model="projectKeyword" placeholder="输入项目名称搜索" placeholder-left cancel-txt="搜索" @search="searchProjects" @cancel="searchProjects" @clear="clearProjects" />
          <scroll-view scroll-y class="picker-list">
            <view
              v-for="item in projectRawList"
              :key="item.id"
              class="picker-item"
              :class="{ active: formData.proId === item.id }"
              @click="selectProject(item)"
            >
              <text class="picker-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ item.proname || item.proName }}</text>
              <wd-icon v-if="formData.proId === item.id" name="check" size="36rpx" color="#3b82f6"></wd-icon>
            </view>
            <view v-if="!projectLoading && projectRawList.length === 0" class="picker-empty" :style="{ color: isDark ? '#6a6a6a' : '#9ca3af' }">暂无匹配项目</view>
          </scroll-view>
        </view>
      </wd-popup>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import { fetchAddProjectTripPush } from '@/service/tripPush'
import { fetchQueryProjects } from '@/service/projectServiceSign'
import { fetchGetAllUserDataList } from '@/service/index'

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

// 出发日期时间戳（wd-datetime-picker type="date" 绑定时间戳）
const starttime = ref(0)
const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)
const todayStartTs = todayStart.getTime()

const formData = ref({
  proId: undefined as number | undefined,
  userValue: [] as any,
  addr: '',
  reason: '',
  expecteddays: '' as any
})

// 选项数据
const userColumns = ref<any[]>([])
// 原始项目列表（搜索过滤 + 选中后带出地址用）
const projectRawList = ref<any[]>([])

// ===== 出差项目（搜索弹窗，参考 projectServiceSign/add） =====
const projectPopup = ref(false)
const projectKeyword = ref('')
const projectLoading = ref(false)
let projectSeq = 0

const selectedProjectName = computed(() => {
  if (formData.value.proId === undefined) return ''
  const p = projectRawList.value.find((x: any) => x.id === formData.value.proId)
  return p?.proname || p?.proName || ''
})

// 服务端搜索（与 projectServiceSign/add 完全一致：projects.do 支持 fuzzy）
async function loadProjects(keyword?: string, showTip = false) {
  const seq = ++projectSeq
  projectLoading.value = true
  if (showTip) uni.showLoading({ title: '搜索中...' })
  let empty = false
  let failed = false
  try {
    const data: any = await fetchQueryProjects(keyword || undefined)
    if (seq !== projectSeq) return
    const arr = Array.isArray(data) ? data : data?.list || []
    // 服务端已按 fuzzy 查询；这里再兜底过滤一次，保证列表里不含关键词的项目不出现
    const kw = (keyword || '').trim().toLowerCase()
    const hit = kw
      ? arr.filter((p: any) => `${p.proname || ''}${p.proName || ''}`.toLowerCase().includes(kw))
      : arr
    projectRawList.value = hit.filter((p: any) => p && (p.proname || p.proName))
    console.log('[tripPush] 项目搜索完成:', keyword || '(全部)', '共', projectRawList.value.length, '条')
    empty = projectRawList.value.length === 0
  } catch (e) {
    console.error('获取项目列表失败', e)
    if (seq === projectSeq) {
      projectRawList.value = []
      failed = true
    }
  } finally {
    if (showTip) uni.hideLoading()
    if (seq === projectSeq) {
      projectLoading.value = false
      if (showTip && failed) uni.showToast({ title: '搜索失败', icon: 'none' })
      else if (showTip && empty) uni.showToast({ title: '未找到匹配项目', icon: 'none' })
    }
  }
}

function searchProjects() {
  loadProjects(projectKeyword.value, true)
}

function clearProjects() {
  projectKeyword.value = ''
  loadProjects()
}

function openProjectPopup() {
  projectPopup.value = true
}

// 选中项目：自动带出项目地址到出差地址
function selectProject(item: any) {
  formData.value.proId = item.id
  const proaddr = item.proaddr ?? item.proAddr
  if (proaddr) formData.value.addr = proaddr
  projectPopup.value = false
}

function pickerValue(v: any) {
  if (v === null || v === undefined) return undefined
  if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined
  if (v === '') return undefined
  return v
}

onMounted(async () => {
  // 1. 项目列表
  loadProjects()

  // 2. 出差人列表（在职：status === 0）
  try {
    const uRes: any = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2,3,9' })
    const uArr = Array.isArray(uRes) ? uRes : uRes.list || uRes.data || []
    userColumns.value = uArr
      .filter((u: any) => u && u.username && u.status === 0)
      .map((u: any) => ({ label: u.username, value: u.id }))
  } catch (e) {
    console.error('获取出差人列表失败', e)
  }
})

function onDateConfirm({ value }: any) {
  starttime.value = value
}

function fmtDate(ts: number) {
  const d = new Date(ts)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function handleBack() {
  uni.navigateBack()
}

async function handleSave() {
  const proId = formData.value.proId
  const userId = pickerValue(formData.value.userValue)

  if (proId === undefined) {
    uni.showToast({ title: '请选择出差项目', icon: 'none' })
    return
  }
  if (userId === undefined) {
    uni.showToast({ title: '请选择出差人', icon: 'none' })
    return
  }
  if (!formData.value.addr || !formData.value.addr.trim()) {
    uni.showToast({ title: '请输入出差地址', icon: 'none' })
    return
  }
  if (!starttime.value || starttime.value <= 0) {
    uni.showToast({ title: '请选择出发日期', icon: 'none' })
    return
  }
  const days = parseInt(String(formData.value.expecteddays), 10)
  if (!days || days < 1) {
    uni.showToast({ title: '请输入预计天数（不小于 1 的整数）', icon: 'none' })
    return
  }
  if (!formData.value.reason || !formData.value.reason.trim()) {
    uni.showToast({ title: '请输入出差事由', icon: 'none' })
    return
  }

  try {
    const params: any = {
      id: undefined,
      proId,
      userId: String(userId),
      addr: formData.value.addr.trim(),
      reason: formData.value.reason.trim(),
      starttime: fmtDate(starttime.value),
      expecteddays: days,
      status: 0,
      travelerName: userColumns.value.find((o: any) => o.value === userId)?.label,
      proname: selectedProjectName.value
    }
    await fetchAddProjectTripPush(params)
    uni.showToast({ title: '创建成功', icon: 'success' })
    uni.setStorageSync('trippush_refresh', '1')
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (e: any) {
    console.error('保存失败', e)
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.form-scroll {
  flex: 1;
  min-height: 0;
}
.form-content {
  padding: 20rpx;
}
.form-section {
  margin-bottom: 24rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 600;
  padding: 16rpx 0;
}
.form-card {
  border-radius: 20rpx;
  overflow: hidden;
}
.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0rpx 20rpx;
  border-bottom: 1rpx solid;
}
.form-item:last-child {
  border-bottom: none;
}
.form-label {
  font-size: 28rpx;
  color: #64748b;
  flex-shrink: 0;
}
.required {
  color: #f5222d;
  margin-right: 4rpx;
}
.form-input {
  flex: 1;
  height: 88rpx;
  text-align: right;
  font-size: 28rpx;
}
.form-value {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  min-width: 0;
}
.value-text {
  font-size: 28rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.value-placeholder {
  font-size: 28rpx;
  color: #9ca3af;
}
.submit-area {
  width: 100%;
  padding: 40rpx 0;
}
.bottom-space {
  height: 60rpx;
}
.ph {
  color: #9ca3af;
}

// 项目搜索弹窗（参考 projectServiceSign/add）
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
</style>
