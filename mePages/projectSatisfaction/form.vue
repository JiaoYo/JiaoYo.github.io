<template>
  <wd-config-provider :theme-vars="themeVars" :theme="theme">
    <view class="page" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
      <wd-navbar left-arrow :title="pageTitle" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />
      <scroll-view :scroll-y="true" class="form-scroll">
        <view class="form-content">
          <!-- 调查信息 -->
          <view class="form-section">
            <view class="section-title" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">调查信息</view>
            <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label">调查类型</text>
                <text class="form-value" :style="{ color: formData.surveyType === 2 ? '#d48806' : '#1677ff' }">
                  {{ formData.surveyType === 2 ? '小组' : '个人' }}
                </text>
              </view>
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label">调查月份</text>
                <text class="form-value" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">{{ formatSurveyMonth(formData.surveyMonth) }}</text>
              </view>
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label">调查日期</text>
                <text class="form-value" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">{{ formData.surveyDate || '-' }}</text>
              </view>
              <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                <text class="form-label">被调查人</text>
                <text class="form-value" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">{{ formData.surveyName || '-' }}</text>
              </view>
              <template v-if="formData.surveyType === 2 && surveyTeam">
                <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                  <text class="form-label">组长</text>
                  <text class="form-value" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">{{ surveyTeam.leadername || '-' }}</text>
                </view>
                <view class="form-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }">
                  <text class="form-label">组员</text>
                  <text class="form-value team-members" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">{{ teamMemberNames(surveyTeam) || '无' }}</text>
                </view>
              </template>
            </view>
          </view>

          <!-- 满意度评分（动态） -->
          <view class="form-section">
            <view class="section-title" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">满意度评分</view>
            <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
              <view
                v-for="(item, index) in questionList"
                :key="item.id"
                class="rating-item"
                :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }"
              >
                <view class="rating-header">
                  <text class="rating-number">{{ index + 1 }}.</text>
                  <text class="rating-title" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">
                    {{ item.surveyItem }}
                  </text>
                </view>
                <!-- 显示问题描述 -->
                <view class="rating-desc" :style="{ color: isDark ? '#8e8e93' : '#6b7280' }">
                  {{ item.surveyContent }}
                </view>
                <view class="rating-stars">
                  <view v-for="score in 5" :key="score" class="star-btn" @click="!isView && setScore(item.field, score)">
                    <text class="star-icon" :style="{ color: getScore(item.field) >= score ? scoreColor(getScore(item.field)) : '#d9d9d9' }">★</text>
                  </view>
                  <text class="score-text" :style="{ color: scoreColor(getScore(item.field)) }">{{ getScoreText(getScore(item.field)) }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 意见与建议（动态） -->
          <view class="form-section">
            <view class="section-title" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">意见与建议</view>
            <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
              <view
                v-for="(item, idx) in textQuestions"
                :key="item.id"
                class="textarea-item"
                :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }"
              >
                <text class="textarea-label">{{ item.surveyContent }}</text>
                <textarea
                  v-if="!isView"
                  v-model="textAnswers[item.field]"
                  placeholder="请输入..."
                  class="textarea-input"
                  :style="{ background: isDark ? '#1b1b1b' : '#f8f9fa', color: isDark ? '#e5e5e5' : '#1f2937' }"
                />
                <text v-else class="textarea-text" :style="{ color: isDark ? '#8e8e93' : '#6b7280',backgroundColor: isDark ? '#1f2937' : '#f5f5f5'}">
                  {{ textAnswers[item.field] || '无' }}
                </text>
              </view>
            </view>
          </view>

          <!-- 综合评分（仅查看） -->
          <view v-if="isView && formData.overallScore !== null" class="score-summary" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <text class="summary-label">综合评分</text>
            <text class="summary-value" :style="{ color: scoreColor(formData.overallScore) }">{{ Number(formData.overallScore).toFixed(2) }}</text>
            <view class="summary-stars">
              <text v-for="i in 5" :key="i" :style="{ color: i <= Math.round(formData.overallScore) ? scoreColor(formData.overallScore) : '#d9d9d9' }">★</text>
            </view>
            <text class="summary-level" :style="{ color: scoreColor(formData.overallScore) }">{{ getScoreLevel(formData.overallScore) }}</text>
          </view>

          <view v-if="!isView" class="submit-area">
            <wd-button type="primary" size="large" style="width: 100%;" @click="handleSave">保存</wd-button>
          </view>
        </view>
        <view class="bottom-space"></view>
      </scroll-view>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import { fetchUpdateProjectSatisfactAnswer } from '@/service/projectSatisfaction'
import { fetchGetProjectSatisfactQuestionList } from '@/service/projectSatisfaction'

const message = useMessage()
const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

const pageType = ref('edit')
const isView = computed(() => pageType.value === 'view')
const pageTitle = computed(() => (pageType.value === 'view' ? '查看调查' : '编辑调查'))

/** 表单数据（调查信息由系统月度任务生成，仅可填写评分与建议） */
const formData = ref({
  surveyMonth: null as number | null,
  surveyDate: null as string | null,
  surveyId: null as number | null,
  surveyName: '',
  surveyType: 1 as number,
  surveyTeam: null as any,
  // 评分字段（固定名称，由接口顺序映射）
  responseTimeliness: 0,
  technicalProfessionalism: 0,
  problemSolvingAbility: 0,
  communicationClarity: 0,
  supportCooperation: 0,
  demandUnderstanding: 0,
  technicalSolutionSupport: 0,
  issueFollowUp: 0,
  workResponsibility: 0,
  onsitePerformance: 0,
  technicalDocumentSupport: 0,
  overallSatisfaction: 0,
  // 文本字段（固定名称）
  mostSatisfiedAspect: '',
  improvementAspect: '',
  suggestion: '',
  overallScore: null as number | null
})

// 文本答案的便捷绑定（与 formData 中的三个字段对应）
const textAnswers = computed({
  get: () => ({
    mostSatisfiedAspect: formData.value.mostSatisfiedAspect,
    improvementAspect: formData.value.improvementAspect,
    suggestion: formData.value.suggestion
  }),
  set: (val: any) => {
    formData.value.mostSatisfiedAspect = val.mostSatisfiedAspect
    formData.value.improvementAspect = val.improvementAspect
    formData.value.suggestion = val.suggestion
  }
})

// 动态问题列表
const questionList = ref<any[]>([])        // 评分项
const textQuestions = ref<any[]>([])       // 文本项

// 固定字段名顺序（必须与接口返回的 type=0 顺序一致）
const scoreFieldNames = [
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
  'overallSatisfaction'
]

// 小组信息（surveyType=2 时展示组长/组员）
const surveyTeam = computed(() => formData.value.surveyTeam)

/** yyyyMM 数值 → yyyy-MM 文本 */
function formatSurveyMonth(month: number | null) {
  if (month === null || month === undefined) return '-'
  const s = String(month)
  return s.length === 6 ? s.slice(0, 4) + '-' + s.slice(4, 6) : String(month)
}

/** 组员名列表（排除组长，与 web 端口径一致） */
function teamMemberNames(team: any) {
  const members = (team?.list || [])
    .filter((m: any) => m && m.teammember && String(m.teammember) !== String(team.teamleader))
    .map((m: any) => m.membername || `用户${m.teammember}`)
  return members.join('、')
}

onMounted(async () => {
  // 获取调查问题列表（动态）
  try {
    const qRes: any = await fetchGetProjectSatisfactQuestionList()
    const items = Array.isArray(qRes) ? qRes : (qRes.list || qRes.data || [])
    // 评分项 (type=0)
    const scoreItems = items.filter((item: any) => item.type === 0)
    questionList.value = scoreItems.map((item: any, index: number) => ({
      ...item,
      field: scoreFieldNames[index] || `score_${index}` // 确保有 field
    }))
    // 文本项 (type=1)
    const textItems = items.filter((item: any) => item.type === 1)
    // 假设顺序固定：最满意、改进、建议
    const textFields = ['mostSatisfiedAspect', 'improvementAspect', 'suggestion']
    textQuestions.value = textItems.map((item: any, index: number) => ({
      ...item,
      field: textFields[index] || `text_${index}`
    }))
  } catch (e) {
    console.error('获取问题列表失败', e)
    // 降级方案：使用硬编码（略）
  }
})

onLoad((query: any) => {
  pageType.value = query.type === 'view' ? 'view' : 'edit'
  const row = uni.getStorageSync('satisfact_row')
  if (row) {
    formData.value = { ...formData.value, ...row }
    if (row.surveyMonth) formData.value.surveyMonth = Number(row.surveyMonth)
    formData.value.surveyType = Number(row.surveyType || 1)
    uni.removeStorageSync('satisfact_row')
  }
})

function handleBack() {
  uni.setStorageSync('satisfact_refresh', '1')
  uni.navigateBack()
}

function getScore(field: string) {
  return formData.value[field as keyof typeof formData.value] as number
}

function setScore(field: string, score: number) {
  ;(formData.value as any)[field] = score
}

function scoreColor(score: number) {
  if (score >= 4.5) return '#52c41a'
  if (score >= 3.5) return '#18a058'
  if (score >= 2.5) return '#faad14'
  if (score >= 1.5) return '#fa8c16'
  return '#f5222d'
}

function getScoreText(score: number) {
  const map: Record<number, string> = { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' }
  return map[score] || ''
}

function getScoreLevel(score: number) {
  if (score >= 4.5) return '非常满意'
  if (score >= 3.5) return '满意'
  if (score >= 2.5) return '一般'
  if (score >= 1.5) return '不满意'
  return '非常不满意'
}

async function handleSave() {
  if (!formData.value.surveyId) {
    uni.showToast({ title: '缺少被调查人信息', icon: 'none' })
    return
  }
  const fields = questionList.value.map((q) => q.field)
  const unfilled = fields.filter((f) => !formData.value[f as keyof typeof formData.value])
  if (unfilled.length > 0) {
    uni.showToast({ title: '请完成所有评分项', icon: 'none' })
    return
  }
  try {
    const payload: any = { ...formData.value }
    payload.surveyMonth = Number(payload.surveyMonth)
    payload.surveyId = Number(payload.surveyId)
    payload.surveyType = Number(payload.surveyType || 1)
    delete payload.surveyTeam
    payload.status = 0
    const scores = fields.map((f) => Number(payload[f])).filter((v) => v > 0)
    payload.overallScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    await fetchUpdateProjectSatisfactAnswer(payload)
    uni.showToast({ title: '保存成功', icon: 'success' })
    uni.setStorageSync('satisfact_refresh', '1')
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (e: any) {
    console.error('保存失败', e)
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
:deep( .wd-picker__cell.is-disabled .wd-cell__value){
  color: #64748b !important;
}
:deep( .wd-datetime-picker__cell.is-disabled .wd-cell__value){
  color: #64748b !important;
}



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
.form-label {
  font-size: 28rpx;
  color: #64748b;
}
.form-value {
  font-size: 28rpx;
  text-align: right;
}
.team-members {
  max-width: 480rpx;
  line-height: 1.5;
}
.rating-item {
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid;
}
.rating-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8rpx;
}
.rating-number {
  font-size: 28rpx;
  color: #64748b;
  margin-right: 8rpx;
}
.rating-title {
  font-size: 28rpx;
  line-height: 1.4;
}
.rating-desc {
  font-size: 24rpx;
  color: #8e8e93;
  margin-bottom: 12rpx;
  padding-left: 36rpx;
}
.rating-stars {
  display: flex;
  align-items: center;
  padding-left: 36rpx;
}
.star-btn {
  padding: 8rpx;
}
.star-icon {
  font-size: 44rpx;
}
.score-text {
  font-size: 24rpx;
  margin-left: 16rpx;
  min-width: 120rpx;
}
.textarea-item {
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid;
}
.textarea-label {
  font-size: 28rpx;
  color: #64748b;
  display: block;
  margin-bottom: 16rpx;
}
.textarea-input {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}
.textarea-text {
  font-size: 28rpx;
  line-height: 1.6;
  display: inline-block;
  width: 100%;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  color: #64748b;
  resize: none;
  outline: none;
  border: none;
  margin-bottom: 16rpx;
}
.score-summary {
  margin-top: 24rpx;
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.summary-label {
  font-size: 28rpx;
  color: #64748b;
}
.summary-value {
  font-size: 48rpx;
  font-weight: 700;
}
.summary-stars {
  display: flex;
  gap: 4rpx;
  font-size: 28rpx;
}
.summary-level {
  font-size: 28rpx;
  font-weight: 500;
}
.submit-area {
  width: 100%;
  padding: 40rpx 0;
}
.bottom-space {
  height: 60rpx;
}
</style>