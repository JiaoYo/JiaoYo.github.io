<template>
  <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f5f5;'" :theme="theme">
    <wd-navbar left-arrow title="订单详情" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : 'background: #fff;'" @click-left="handleBack" />
    
    <view class="page-content" :class="isDark ? 'dark' : ''">
      <view v-if="loading" class="loading-wrap"><wd-loading type="ring" /></view>
      <view v-else-if="!orderDetail" class="empty-wrap"><wd-status-tip image="empty" content="暂无订单数据" /></view>
      <view v-else class="card">
        <view class="card-header">
          <view class="header-icon">📋</view>
          <text class="card-title">订单信息</text>
        </view>
        <view class="detail-list">
          <view class="detail-row">
            <text class="detail-label">接入号</text>
            <text class="detail-value">{{ orderDetail.msisdn || '-' }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">订单流水号</text>
            <text class="detail-value">{{ orderDetail.transactionId || '-' }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">订单类型</text>
            <text class="detail-value">{{ orderDetail.serviceType || '-' }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">状态</text>
            <text class="detail-value status">{{ orderDetail.status || '-' }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">创建时间</text>
            <text class="detail-value">{{ orderDetail.createTime || '-' }}</text>
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
import { fetchGetTelecomOrderInfoBySerialNumber } from '@/service/sim';

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

const loading = ref(false);
const orderDetail = ref<any>(null);

onLoad((options: any) => {
  if (options.id) {
    fetchOrderDetail(options.id);
  }
});

async function fetchOrderDetail(id: string) {
  loading.value = true;
  try {
    const res = await fetchGetTelecomOrderInfoBySerialNumber({ id });
    if (res.data && !res.error) {
      orderDetail.value = res.data;
    }
  } catch (e) {
    console.error('获取订单详情失败', e);
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page-content {
  padding: 20rpx;
}

.page-content.dark {
  background: #1b1b1b;
}

.loading-wrap,
.empty-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.dark .card {
  background: #2a2a2a;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.dark .card-header {
  border-bottom-color: #444;
}

.header-icon {
  font-size: 40rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2a44;
}

.dark .card-title {
  color: #e8e8e8;
}

.detail-list {
  padding: 0 24rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.dark .detail-row {
  border-bottom-color: #444;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
}

.dark .detail-label {
  color: #aaa;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.dark .detail-value {
  color: #e0e0e0;
}

.detail-value.status {
  color: #1890ff;
}
</style>
