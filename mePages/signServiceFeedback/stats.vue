<template>
  <wd-config-provider :theme-vars="themeVars" :theme="theme">
    <view class="page" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
      <wd-navbar left-arrow title="评价统计" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-wrap">
        <wd-loading />
      </view>

      <scroll-view v-else :scroll-y="true" class="content-scroll">
        <!-- 概览卡片 -->
        <view class="summary-grid">
          <view class="summary-card summary-card--blue" :style="{ background: cardBg }">
            <text class="summary-label">评价总数</text>
            <text class="summary-value">{{ toNumber(stats.totalResponses) }}</text>
            <text class="summary-suffix">条</text>
          </view>
          <view class="summary-card summary-card--green" :style="{ background: cardBg }">
            <text class="summary-label">平均总体满意度</text>
            <text class="summary-value">{{ formatAvg(stats.overallSatisfactionAverage) }}</text>
            <text class="summary-suffix">/ 5分</text>
          </view>
          <view class="summary-card summary-card--slate" :style="{ background: cardBg }">
            <text class="summary-label">NPS 净推荐值</text>
            <text class="summary-value">{{ formatNps(stats.nps) }}</text>
          </view>
          <view class="summary-card summary-card--orange" :style="{ background: cardBg }">
            <text class="summary-label">有后续需求</text>
            <text class="summary-value">{{ toNumber(stats.otherDemandCount) }}</text>
            <text class="summary-suffix">条 · {{ formatRate(stats.otherDemandRate) }}%</text>
          </view>
        </view>

        <!-- 各维度平均分 -->
        <view class="section" :style="{ background: cardBg }">
          <view class="section-header">
            <view class="section-mark section-mark--green"></view>
            <view class="section-info">
              <text class="section-title">各维度平均分</text>
              <text class="section-desc">以 5 分制展示，分数越高表现越好</text>
            </view>
          </view>
          <view v-if="hasDimensionData" class="dimension-list">
            <view v-for="item in dimensionItems" :key="item.key" class="dimension-item">
              <view class="dimension-meta">
                <text>{{ item.label }}</text>
                <text class="dimension-score">{{ item.value }} 分</text>
              </view>
              <view class="dimension-progress">
                <view class="dimension-bar" :style="{ width: dimensionPercent(item.key) + '%', background: dimensionColor(item.key) }"></view>
              </view>
            </view>
          </view>
          <view v-else class="empty-tip">暂无统计数据</view>
        </view>

        <!-- 问题解决分布 -->
        <view class="section" :style="{ background: cardBg }">
          <view class="section-header">
            <view class="section-mark"></view>
            <view class="section-info">
              <text class="section-title">问题解决分布</text>
              <text class="section-desc">按评价提交时的解决状态统计</text>
            </view>
          </view>
          <view v-if="hasResolutionData" class="resolution-grid">
            <view v-for="item in resolutionList" :key="item.label" class="resolution-item" :style="{ background: isDark ? '#2a2a2a' : '#f8f9fa' }">
              <view class="resolution-meta">
                <text class="resolution-label" :style="{ color: resolutionColor(item.type) }">{{ item.label }}</text>
                <text class="resolution-count">{{ item.count }} 条 <text class="resolution-percent">{{ item.percent }}%</text></text>
              </view>
              <view class="resolution-progress">
                <view class="resolution-bar" :style="{ width: item.percent + '%', background: resolutionColor(item.type) }"></view>
              </view>
            </view>
          </view>
          <view v-else class="empty-tip">暂无统计数据</view>
        </view>

        <!-- 推荐意愿（NPS） -->
        <view class="section" :style="{ background: cardBg }">
          <view class="section-header">
            <view class="section-mark section-mark--orange"></view>
            <view class="section-info">
              <text class="section-title">推荐意愿（NPS 净推荐值）</text>
              <text class="section-desc">推荐者 9-10分 / 被动者 7-8分 / 贬损者 0-6分</text>
            </view>
            <wd-tag v-if="stats.nps != null" :type="npsStatus" round>{{ npsTagText }}</wd-tag>
          </view>
          <view v-if="hasNpsData" class="resolution-grid">
            <view v-for="item in npsItems" :key="item.label" class="resolution-item" :style="{ background: isDark ? '#2a2a2a' : '#f8f9fa' }">
              <view class="resolution-meta">
                <text class="resolution-label" :style="{ color: npsColor(item.type) }">{{ item.label }}</text>
                <text class="resolution-count">{{ item.count }} 条 <text class="resolution-percent">{{ item.percent }}%</text></text>
              </view>
              <view class="resolution-progress">
                <view class="resolution-bar" :style="{ width: item.percent + '%', background: npsColor(item.type) }"></view>
              </view>
            </view>
          </view>
          <view v-else class="empty-tip">暂无统计数据</view>
        </view>

        <view class="bottom-space"></view>
      </scroll-view>
    </view>
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetFeedbackStats } from '@/service/signServiceFeedback';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const cardBg = computed(() => isDark.value ? '#2a2a2a' : '#ffffff');

// 返回
function handleBack() {
  // #ifdef H5
  history.go(-1);
  // #endif
  // #ifndef H5
  uni.navigateBack();
  // #endif
}

const loading = ref(false);
const stats = ref<any>({});

async function loadData() {
  loading.value = true;
  try {
    const data = await fetchGetFeedbackStats();
    stats.value = data || {};
  } catch (err) {
    console.error('统计加载失败', err);
  } finally {
    loading.value = false;
  }
}

// 数字兼容
function toNumber(value: unknown): number {
  if (value == null || value === '') return 0;
  return Number(value);
}

function formatAvg(value: unknown) {
  if (value == null || value === '') return '-';
  return Number(value).toFixed(1);
}

function formatNps(value: unknown) {
  if (value == null || value === '') return '-';
  const v = Number(value);
  return v > 0 ? `+${v}` : String(v);
}

function formatRate(value: unknown) {
  if (value == null || value === '') return '0';
  return String(Number(value));
}

// 维度平均分
const dimensionItems = computed(() => [
  { key: 'responseTimelinessAverage', label: '响应及时性', value: formatAvg(stats.value?.responseTimelinessAverage) },
  { key: 'serviceAttitudeAverage', label: '服务态度', value: formatAvg(stats.value?.serviceAttitudeAverage) },
  { key: 'communicationClarityAverage', label: '沟通清晰度', value: formatAvg(stats.value?.communicationClarityAverage) },
  { key: 'technicalProfessionalismAverage', label: '技术专业度', value: formatAvg(stats.value?.technicalProfessionalismAverage) },
  { key: 'serviceEfficiencyAverage', label: '服务效率', value: formatAvg(stats.value?.serviceEfficiencyAverage) },
  { key: 'overallSatisfactionAverage', label: '总体满意度', value: formatAvg(stats.value?.overallSatisfactionAverage) }
]);

const hasDimensionData = computed(() => dimensionItems.value.some(item => item.value !== '-'));

function dimensionPercent(key: string) {
  const v = toNumber(stats.value?.[key]);
  if (!v) return 0;
  return Number(Math.min(Math.max((v / 5) * 100, 0), 100).toFixed(1));
}

function dimensionColor(key: string) {
  const p = dimensionPercent(key);
  if (p >= 80) return '#18a058';
  if (p >= 60) return '#faad14';
  return '#f5222d';
}

const totalCount = computed(() => toNumber(stats.value?.totalResponses));

// 问题解决分布
const resolutionList = computed(() => {
  const total = totalCount.value;
  return [
    { label: '未解决', count: toNumber(stats.value?.unresolvedCount), type: 'error' as const },
    { label: '部分解决', count: toNumber(stats.value?.partiallyResolvedCount), type: 'warning' as const },
    { label: '彻底解决', count: toNumber(stats.value?.fullyResolvedCount), type: 'success' as const }
  ].map(item => ({
    ...item,
    percent: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0
  }));
});

const hasResolutionData = computed(() => resolutionList.value.some(item => item.count > 0));

function resolutionColor(type: string) {
  switch (type) {
    case 'success': return '#18a058';
    case 'warning': return '#faad14';
    case 'error': return '#f5222d';
    default: return '#999';
  }
}

// NPS 分布
const npsItems = computed(() => {
  const total = totalCount.value;
  return [
    { label: '推荐者 (9-10分)', count: toNumber(stats.value?.promoterCount), type: 'success' as const },
    { label: '被动者 (7-8分)', count: toNumber(stats.value?.passiveCount), type: 'warning' as const },
    { label: '贬损者 (0-6分)', count: toNumber(stats.value?.detractorCount), type: 'error' as const }
  ].map(item => ({
    ...item,
    percent: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0
  }));
});

const hasNpsData = computed(() => npsItems.value.some(item => item.count > 0));

function npsColor(type: string) {
  switch (type) {
    case 'success': return '#18a058';
    case 'warning': return '#faad14';
    case 'error': return '#f5222d';
    default: return '#999';
  }
}

const npsStatus = computed(() => {
  const v = Number(stats.value?.nps);
  if (!Number.isFinite(v)) return 'default';
  if (v >= 50) return 'success';
  if (v >= 0) return 'warning';
  return 'danger';
});

const npsTagText = computed(() => `NPS ${formatNps(stats.value?.nps)}`);

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-scroll {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
}

// 概览卡片
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.summary-card {
  padding: 24rpx;
  border-radius: 16rpx;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60rpx;
    height: 60rpx;
    border-radius: 0 0 0 60rpx;
  }

  &--blue::after { background: rgba(45, 140, 240, 0.15); }
  &--slate::after { background: rgba(128, 128, 128, 0.1); }
  &--green::after { background: rgba(24, 160, 88, 0.12); }
  &--orange::after { background: rgba(250, 173, 20, 0.12); }
}

.summary-label {
  display: block;
  font-size: 24rpx;
  color: #667085;
  margin-bottom: 12rpx;
}

.summary-value {
  font-size: 44rpx;
  font-weight: 600;
  color: #172033;
  font-variant-numeric: tabular-nums;
}

.summary-suffix {
  font-size: 24rpx;
  color: #667085;
  margin-left: 8rpx;
}

// 区块
.section {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.section-mark {
  width: 8rpx;
  height: 56rpx;
  border-radius: 8rpx;
  background: #4b7bec;
  flex-shrink: 0;

  &--green { background: #16a34a; }
  &--orange { background: #f5a623; }
}

.section-info {
  flex: 1;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1d2939;
  margin-bottom: 8rpx;
}

.section-desc {
  display: block;
  font-size: 24rpx;
  color: #98a2b3;
}

// 维度列表
.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.dimension-item {
  .dimension-meta {
    display: flex;
    justify-content: space-between;
    font-size: 26rpx;
    color: #344054;
    margin-bottom: 12rpx;
  }

  .dimension-score {
    color: #667085;
    font-size: 24rpx;
  }

  .dimension-progress {
    height: 16rpx;
    background: #e5e7eb;
    border-radius: 8rpx;
    overflow: hidden;
  }

  .dimension-bar {
    height: 100%;
    border-radius: 8rpx;
    transition: width 0.3s;
  }
}

// 解决分布
.resolution-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.resolution-item {
  padding: 20rpx;
  border-radius: 12rpx;

  .resolution-meta {
    margin-bottom: 16rpx;
  }

  .resolution-label {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    margin-bottom: 8rpx;
  }

  .resolution-count {
    font-size: 24rpx;
    color: #344054;
  }

  .resolution-percent {
    color: #98a2b3;
    margin-left: 8rpx;
  }

  .resolution-progress {
    height: 12rpx;
    background: rgba(128, 128, 128, 0.2);
    border-radius: 6rpx;
    overflow: hidden;
  }

  .resolution-bar {
    height: 100%;
    border-radius: 6rpx;
    transition: width 0.3s;
  }
}

.empty-tip {
  text-align: center;
  padding: 40rpx;
  font-size: 26rpx;
  color: #999;
}

.bottom-space {
  height: 60rpx;
}

// 暗黑模式
.wot-theme-dark {
  .summary-label,
  .summary-value,
  .summary-suffix {
    color: #fff;
  }

  .section-title {
    color: #fff;
  }

  .section-desc {
    color: #8a9099;
  }

  .dimension-meta {
    color: #fff;
  }

  .dimension-progress {
    background: #3a3a3a;
  }

  .resolution-count {
    color: #fff;
  }

  .resolution-progress {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>