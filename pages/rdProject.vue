<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { useTabbar } from '@/composables/useTabbar';
import { fetchRdProjectPage } from '@/service/rddemand';

const { theme, themeVars } = useTheme();
const isDark = computed(() => theme.value === 'dark');

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();
const clickLock = ref<boolean>(false);

const dataList = ref<any[]>([]);
const total = ref<number>(0);
const model = ref({
    page: 1,
    limit: 20
});
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loading');
const listLoading = ref<boolean>(false);
let pendingReload = false;

function handleTabbarChange({ value }: { value: string }) {
    if (value !== 'rdProject') {
        if (clickLock.value) return;
        clickLock.value = true;
        setTabbarItemActive(value);
        uni.switchTab({
            url: '/pages/' + activeTabbar.value.name,
            complete: () => {
                clickLock.value = false;
            }
        })
    }
}

async function getDataList() {
    if (listLoading.value) {
        pendingReload = true;
        return;
    }
    listLoading.value = true;
    try {
        if (model.value.page === 1) dataList.value = [];
        const data = await fetchRdProjectPage(model.value);
        dataList.value = dataList.value.concat(data.list || []);
        total.value = Number(data.total);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取研发产品列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) {
            pendingReload = false;
            getDataList();
        }
    }
}

function handleGotoRdDemand() {
    if (clickLock.value) return;
    clickLock.value = true;
    uni.navigateTo({
        url: '/mePages/rddemand/Index'
    });
    setTimeout(() => { clickLock.value = false; }, 500);
}

function handleGotoRdAssessment() {
    if (clickLock.value) return;
    clickLock.value = true;
    uni.navigateTo({
        url: '/mePages/rdassessment/Index'
    });
    setTimeout(() => { clickLock.value = false; }, 500);
}

onMounted(() => {
    getDataList();
});

onPullDownRefresh(() => {
    model.value.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading();
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (!listLoading.value && dataList.value.length < total.value) {
        model.value.page++;
        getDataList();
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar title="研发产品" safe-area-inset-top placeholder fixed :bordered="false" />

        <view class="page-content">
            <!-- 功能入口 -->
            <view class="feature-section">
                <view class="section-title">功能入口</view>
                <view class="feature-grid">
                    <view class="feature-item" @click="handleGotoRdDemand">
                        <view class="feature-icon" style="background: #e6f4ff;">
                            <text style="font-size: 40rpx;">📋</text>
                        </view>
                        <view class="feature-name">研发需求</view>
                        <view class="feature-desc">管理研发需求</view>
                    </view>
                    <view class="feature-item" @click="handleGotoRdAssessment">
                        <view class="feature-icon" style="background: #f6ffed;">
                            <text style="font-size: 40rpx;">📊</text>
                        </view>
                        <view class="feature-name">研发考核</view>
                        <view class="feature-desc">研发人员考核</view>
                    </view>
                </view>
            </view>

            <!-- 研发产品列表 -->
            <view class="product-section">
                <view class="section-title">研发产品</view>
                <view v-if="dataList.length > 0" class="product-list">
                    <view v-for="item in dataList" :key="item.id" class="product-item">
                        <view class="product-icon" :style="{ background: item.color || '#e6f4ff' }">
                            <text style="font-size: 36rpx;">{{ item.icon || '📦' }}</text>
                        </view>
                        <view class="product-info">
                            <view class="product-name">{{ item.rdname }}</view>
                            <view class="product-meta">{{ item.typename || '研发产品' }}</view>
                        </view>
                    </view>
                </view>
                <view v-else-if="state !== 'loading'" class="empty-tip">
                    暂无研发产品
                </view>
                <wd-loadmore :state="state" @reload="getDataList" />
            </view>
        </view>

        <wd-tabbar shape="round" model-value="rdProject" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
            <wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
        </wd-tabbar>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.page-content {
    padding: 24rpx;
    padding-bottom: 140rpx;
}

.feature-section {
    margin-bottom: 32rpx;
}

.section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #323233;
    margin-bottom: 20rpx;
    padding-left: 16rpx;
    border-left: 6rpx solid #1677ff;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
}

.feature-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.feature-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12rpx;
}

.feature-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #323233;
    margin-bottom: 4rpx;
}

.feature-desc {
    font-size: 22rpx;
    color: #969799;
}

.product-section {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.product-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.product-item {
    display: flex;
    align-items: center;
    padding: 16rpx;
    background: #f7f8fa;
    border-radius: 12rpx;
}

.product-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16rpx;
}

.product-info {
    flex: 1;
}

.product-name {
    font-size: 28rpx;
    font-weight: 500;
    color: #323233;
    margin-bottom: 4rpx;
}

.product-meta {
    font-size: 24rpx;
    color: #969799;
}

.empty-tip {
    text-align: center;
    padding: 40rpx;
    color: #969799;
    font-size: 26rpx;
}
</style>
