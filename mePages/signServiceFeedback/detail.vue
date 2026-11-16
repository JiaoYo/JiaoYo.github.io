<template>
  <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
    <view class="page">
      <wd-navbar left-arrow title="评价详情" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <view class="detail-content">
        <view class="detail-section">
          <view class="section-title">基本信息</view>
          <wd-cell-group :bordered="false" :custom-style="isDark ? 'background: #2a2a2a;' : ''">
            <wd-cell title="项目名称" :value="pick(detailData, 'projectName') || '-'" />
            <wd-cell title="调试工程师" :value="pick(detailData, 'debugEngineerName') || '-'" />
            <wd-cell title="评价时间" :value="pick(detailData, 'submittedTime') || '-'" />
            <wd-cell title="问题解决">
              <text class="status-tag" :style="getResolutionStyle(num(detailData, 'resolutionStatus'))">{{ getResolutionLabel(num(detailData, 'resolutionStatus')) }}</text>
            </wd-cell>
          </wd-cell-group>
        </view>

        <view class="detail-section">
          <view class="section-title">评分</view>
          <view class="rating-list">
            <view class="rating-item">
              <text class="rating-label">响应及时性</text>
              <wd-rate readonly :model-value="num(detailData, 'responseTimeliness')" size="14px" />
            </view>
            <view class="rating-item">
              <text class="rating-label">服务态度</text>
              <wd-rate readonly :model-value="num(detailData, 'serviceAttitude')" size="14px" />
            </view>
            <view class="rating-item">
              <text class="rating-label">沟通清晰度</text>
              <wd-rate readonly :model-value="num(detailData, 'communicationClarity')" size="14px" />
            </view>
            <view class="rating-item">
              <text class="rating-label">技术专业度</text>
              <wd-rate readonly :model-value="num(detailData, 'technicalProfessionalism')" size="14px" />
            </view>
            <view class="rating-item">
              <text class="rating-label">服务效率</text>
              <wd-rate readonly :model-value="num(detailData, 'serviceEfficiency')" size="14px" />
            </view>
            <view class="rating-item">
              <text class="rating-label">总体满意度</text>
              <wd-rate readonly :model-value="num(detailData, 'overallSatisfaction')" size="14px" />
            </view>
            <view class="rating-item">
              <text class="rating-label">推荐意愿</text>
              <text class="rating-score">{{ pick(detailData, 'recommendScore') ?? '-' }}/10</text>
            </view>
          </view>
        </view>

        <view v-if="hasTextFeedback" class="detail-section">
          <view class="section-title">文字反馈</view>
          <view class="feedback-list">
            <view v-if="pick(detailData, 'mostSatisfied')" class="feedback-item">
              <text class="feedback-label">最满意的地方</text>
              <text class="feedback-content">{{ pick(detailData, 'mostSatisfied') }}</text>
            </view>
            <view v-if="pick(detailData, 'leastSatisfied')" class="feedback-item">
              <text class="feedback-label">最不满意的地方</text>
              <text class="feedback-content">{{ pick(detailData, 'leastSatisfied') }}</text>
            </view>
            <view v-if="pick(detailData, 'otherSuggestion')" class="feedback-item">
              <text class="feedback-label">其他建议</text>
              <text class="feedback-content">{{ pick(detailData, 'otherSuggestion') }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { onLoad } from '@dcloudio/uni-app';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

function handleBack() {
  // #ifdef H5
  history.go(-1);
  // #endif
  // #ifndef H5
  uni.navigateBack();
  // #endif
}

const detailData = ref<any>({});

function pick(row: any, key: string) {
  if (!row) return undefined;
  const snake = key.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
  return row?.[key] ?? row?.[snake];
}

function num(row: any, key: string) {
  const v = pick(row, key);
  return v != null && v !== '' ? Number(v) : 0;
}

const RESOLUTION_MAP: Record<number, { label: string; type: string }> = {
  1: { label: '未解决', type: 'danger' },
  2: { label: '部分解决', type: 'warning' },
  3: { label: '彻底解决', type: 'success' }
};

const RESOLUTION_STYLE_MAP: Record<number, { bg: string; color: string }> = {
  1: { bg: '#fff1f0', color: '#f5222d' },
  2: { bg: '#fff7e6', color: '#fa8c16' },
  3: { bg: '#f6ffed', color: '#52c41a' }
};

function getResolutionLabel(status?: number) {
  if (!status) return '-';
  return RESOLUTION_MAP[status]?.label || String(status);
}

function getResolutionStyle(status?: number) {
  const s = RESOLUTION_STYLE_MAP[status || 0] || { bg: '#f4f4f5', color: '#909399' };
  return { background: s.bg, color: s.color };
}

const hasTextFeedback = computed(() => {
  return pick(detailData.value, 'mostSatisfied') || pick(detailData.value, 'leastSatisfied') || pick(detailData.value, 'otherSuggestion');
});

onLoad((options: any) => {
  if (options.data) {
    try {
      detailData.value = JSON.parse(decodeURIComponent(options.data));
    } catch (e) {
      console.error('解析评价数据失败', e);
    }
  }
});
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; box-sizing: border-box; }
.detail-content { padding: 20rpx; }
.detail-section { margin-bottom: 32rpx; }
.section-title { font-size: 28rpx; font-weight: 600; color: #333; margin-bottom: 16rpx; padding-left: 16rpx; border-left: 4rpx solid #18a058; }
.status-tag { padding: 6rpx 16rpx; border-radius: 16rpx; font-size: 22rpx; white-space: nowrap; }
.rating-list { display: flex; flex-direction: column; gap: 20rpx; }
.rating-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx; background: #fff; border-radius: 12rpx; }
.rating-label { font-size: 28rpx; color: #666; }
.rating-score { font-size: 32rpx; font-weight: 600; color: #18a058; }
.feedback-list { display: flex; flex-direction: column; gap: 20rpx; }
.feedback-item { padding: 20rpx; background: #fff; border-radius: 12rpx; }
.feedback-label { display: block; font-size: 24rpx; color: #999; margin-bottom: 12rpx; }
.feedback-content { display: block; font-size: 28rpx; color: #333; line-height: 1.6; white-space: pre-wrap; }
.wot-theme-dark {
  .section-title { color: #fff; }
  .rating-item, .feedback-item { background: #2a2a2a; }
  .rating-label, .feedback-content { color: #fff; }
}
</style>
