<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page">
      <wd-navbar left-arrow :title="pageTitle" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <scroll-view :scroll-y="true" class="form-scroll">
        <view class="form-inner">
          <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <!-- 项目（仅发起时可选，修改时只读展示） -->
            <template v-if="pageType === 'start'">
              <view class="section-label" :style="{ color: textColor }">返工项目<text class="required">*</text></view>
              <wd-search
                v-model="projectFuzzy"
                placeholder="搜索项目名称"
                hide-cancel
                custom-class="rw-search"
                @search="handleProjectSearch"
                @clear="handleProjectClear"
              />
              <wd-picker
                label="项目"
                label-width="140rpx"
                align-right
                :columns="projectColumns"
                v-model="form.pid"
                placeholder="请选择项目（待审核/已完成且无进行中返工）"
                @confirm="handleProjectConfirm"
              />
            </template>
            <view v-else class="ro-row">
              <text class="ro-label" :style="{ color: subColor }">项目</text>
              <text class="ro-value" :style="{ color: textColor }">{{ editProjectName || '-' }}</text>
            </view>

            <view class="section-label" :style="{ color: textColor }">责任人<text class="required">*</text></view>
            <view v-if="participantList.length" class="person-list">
              <view
                v-for="p in participantList"
                :key="String(p.participant)"
                class="person-chip"
                :class="{ active: form.responsibleId === p.participant, dark: isDark }"
                @click="form.responsibleId = p.participant"
              >
                {{ p.prtcname || p.username || '-' }}
              </view>
            </view>
            <view v-else class="person-empty" :style="{ color: subColor }">
              {{ form.pid ? '暂无项目参与人，请先在项目中添加参与人' : '请先选择项目' }}
            </view>

            <view class="section-label" :style="{ color: textColor }">返工原因<text class="required">*</text></view>
            <textarea
              class="rw-textarea"
              :class="{ dark: isDark }"
              v-model="form.reason"
              maxlength="500"
              placeholder="为什么需要返工（必填，500字以内）"
              :placeholder-style="isDark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'"
              auto-height
            />

            <view class="section-label" :style="{ color: textColor }">返工要求</view>
            <textarea
              class="rw-textarea"
              :class="{ dark: isDark }"
              v-model="form.requirement"
              maxlength="1000"
              placeholder="本轮返工需要达到的处理要求（选填）"
              :placeholder-style="isDark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'"
              auto-height
            />

            <view class="section-label" :style="{ color: textColor }">截止日期<text class="required">*</text></view>
            <wd-datetime-picker
              :key="pickerResetKey"
              v-model="form.deadline"
              type="date"
              :min-date="minDeadline"
              custom-class="rw-date-picker"
              @confirm="({ value }) => (form.deadline = value)"
            />
          </view>

          <view class="submit-area">
            <wd-button block type="primary" :loading="submitting" :disabled="submitting" @click="submitForm">
              {{ pageType === 'start' ? '确认发起' : '保存修改' }}
            </wd-button>
          </view>
          <view class="bottom-space" />
        </view>
      </scroll-view>
    </view>
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
import { fetchStartRework, fetchUpdateRework } from '@/service/prjRework'
import { fetchGetPrjDataList } from '@/service/prj'
import { fetchGetProjectParticipantDataList } from '@/service/projectParticipant'

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

/* ---------------- 页面类型：start 发起 / edit 修改；再次返工=start+rerework ---------------- */
const pageType = ref<'start' | 'edit'>('start')
const isRerework = ref(false)
const editProjectName = ref('')
const pageTitle = computed(() => (pageType.value === 'edit' ? '修改返工信息' : isRerework.value ? '再次返工' : '发起返工'))

const submitting = ref(false)
const pickerResetKey = ref(0)
const minDeadline = new Date().getTime()
const form = ref<{ id?: number; pid?: number; responsibleId: any; reason: string; requirement: string; deadline: number }>({
  id: undefined,
  pid: undefined,
  responsibleId: '',
  reason: '',
  requirement: '',
  deadline: Date.now(),
})

/* ---------------- 项目候选（发起）：待审核(2)/已完成(3)、非暂停、非作废、无进行中返工 ---------------- */
const projectFuzzy = ref('')
const projectColumns = ref<any[]>([])
const projectList = ref<any[]>([])

async function loadProjects(fuzzy = '') {
  try {
    const limit = 50
    const [r2, r3]: any[] = await Promise.all([
      fetchGetPrjDataList({ page: 1, limit, status: 2, pause: 0, fuzzy }, false),
      fetchGetPrjDataList({ page: 1, limit, status: 3, pause: 0, fuzzy }, false),
    ])
    const pick = (res: any) => (res?.list || []).filter((p: any) => Number(p.ptype) !== 2 && !p.currentReworkId)
    const map = new Map<number, any>()
    ;[...pick(r2), ...pick(r3)].forEach((p: any) => map.set(p.id, p))
    projectList.value = Array.from(map.values())
    projectColumns.value = projectList.value.map((p: any) => ({
      label: p.proname || p.projectName || `项目#${p.id}`,
      value: p.id,
    }))
  } catch (e) {
    console.error('获取项目候选失败', e)
  }
}

function pickValue(v: any) {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined
  return v === null || v === undefined || v === '' ? undefined : v
}

function handleProjectSearch() {
  if (projectFuzzy.value) loadProjects(projectFuzzy.value)
}
function handleProjectClear() {
  projectFuzzy.value = ''
  form.value.pid = undefined
  participantList.value = []
  loadProjects('')
}
function handleProjectConfirm({ value }: any) {
  const v = pickValue(value)
  if (v !== undefined) {
    form.value.pid = v
    form.value.responsibleId = ''
    getParticipants(v)
  }
}

/** 责任人候选 = 所选项目的参与人 */
const participantList = ref<any[]>([])
async function getParticipants(pid?: number) {
  if (!pid) {
    participantList.value = []
    return
  }
  try {
    const data: any = await fetchGetProjectParticipantDataList({ pid: Number(pid), page: 1, limit: 100 }, false)
    participantList.value = data?.list || []
  } catch (e) {
    participantList.value = []
  }
}

function rowProjectName(r: any) {
  return r.projectName || r.proname || `项目#${r.pid}`
}

function fmtDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ---------------- 提交 ---------------- */
async function submitForm() {
  if (pageType.value === 'start' && !form.value.pid) {
    uni.showToast({ icon: 'none', title: '请选择项目', duration: 1500 })
    return
  }
  if (!form.value.responsibleId) {
    uni.showToast({ icon: 'none', title: '请选择返工责任人', duration: 1500 })
    return
  }
  if (!form.value.reason.trim()) {
    uni.showToast({ icon: 'none', title: '请填写返工原因', duration: 1500 })
    return
  }
  const d = new Date(form.value.deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (!form.value.deadline || d.getTime() < today.getTime()) {
    uni.showToast({ icon: 'none', title: '截止日期不能早于当天', duration: 1500 })
    return
  }
  submitting.value = true
  try {
    const payload: any = {
      responsibleId: form.value.responsibleId,
      reason: form.value.reason.trim(),
      requirement: form.value.requirement.trim() || undefined,
      deadline: fmtDate(form.value.deadline),
    }
    if (pageType.value === 'start') {
      await fetchStartRework({ pid: Number(form.value.pid), ...payload })
      uni.showToast({ icon: 'success', title: '返工已发起', duration: 1500 })
    } else {
      await fetchUpdateRework({ id: form.value.id!, ...payload })
      uni.showToast({ icon: 'success', title: '修改成功', duration: 1500 })
    }
    // 通知列表页刷新
    uni.setStorageSync('rework_refresh', Date.now())
    setTimeout(() => {
      uni.navigateBack()
    }, 600)
  } catch (e) {
    console.error('提交返工失败', e)
  } finally {
    submitting.value = false
  }
}

onLoad((query: any) => {
  pageType.value = query.type === 'edit' ? 'edit' : 'start'
  isRerework.value = query.rerework === '1'
  const row = uni.getStorageSync('rework_row')
  if (pageType.value === 'edit' && row && row.id) {
    form.value = {
      id: row.id,
      pid: row.pid,
      responsibleId: row.responsibleId ?? '',
      reason: row.reason || '',
      requirement: row.requirement || '',
      deadline: row.deadline ? new Date(`${String(row.deadline).slice(0, 10)}T00:00:00`).getTime() : Date.now(),
    }
    editProjectName.value = rowProjectName(row)
    getParticipants(row.pid)
  } else if (isRerework.value && row && row.pid) {
    // 再次返工：用行项目名称搜候选，命中则预选
    projectFuzzy.value = rowProjectName(row)
    loadProjects(projectFuzzy.value).then(() => {
      const hit = projectList.value.find((p: any) => Number(p.id) === Number(row.pid))
      if (hit) {
        form.value.pid = hit.id
        projectColumns.value = [{ label: hit.proname || hit.projectName || `项目#${hit.id}`, value: hit.id }]
        getParticipants(hit.id)
      } else {
        uni.showToast({ title: '该项目当前不满足再次返工条件', icon: 'none' })
      }
    })
  } else if (pageType.value === 'start') {
    loadProjects('')
  }
  // 行数据只用一次，避免下次普通新增误读
  uni.removeStorageSync('rework_row')
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.form-scroll {
  flex: 1;
  min-height: 0;
}
.form-inner {
  padding: 20rpx;
}
.form-card {
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}
.section-label {
  font-size: 26rpx;
  font-weight: 600;
  margin: 20rpx 0 12rpx;
}
.required {
  color: #e54d42;
  margin-left: 4rpx;
}
.ro-row {
  display: flex;
  gap: 16rpx;
  font-size: 26rpx;
  line-height: 1.7;
  margin: 20rpx 0 12rpx;
}
.ro-label {
  flex: none;
  width: 100rpx;
}
.ro-value {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  font-weight: 600;
}
.person-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  padding: 0 8rpx;
}
.person-chip {
  padding: 10rpx 26rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  background: #f5f5f5;
  color: #4e5969;
  border: 2rpx solid transparent;
}
.person-chip.dark {
  background: #1f1f1f;
  color: #c9cdd4;
}
.person-chip.active {
  background: #e6f4ff;
  color: #1677ff;
  border-color: #1677ff;
}
.person-chip.active.dark {
  background: rgba(22, 119, 255, 0.3);
  color: #69b1ff;
  border-color: #69b1ff;
}
.person-empty {
  font-size: 24rpx;
  padding: 8rpx;
}
.rw-textarea {
  width: 100%;
  min-height: 140rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #333;
  box-sizing: border-box;
}
.rw-textarea.dark {
  color: #e8e8e8;
}
:deep(.rw-search) {
  background: transparent;
  margin-bottom: 8rpx;
}
:deep(.rw-date-picker) {
  width: 100%;
}
.submit-area {
  margin-top: 32rpx;
}
.bottom-space {
  height: 60rpx;
}
</style>
