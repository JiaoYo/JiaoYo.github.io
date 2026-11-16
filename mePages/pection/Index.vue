<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission } from '@/utils/index';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';

const { t } = useI18n();
const { themeVars, theme } = useTheme();
const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

// 点击返回
function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 跳转到对应模块
function goToPage(url: string, title: string) {
    uni.navigateTo({
        url: `${url}?title=${encodeURIComponent(title)}`
    });
}

// 模块列表
const modules = [
    { title: '点表模板', desc: '管理点表模板信息', url: '/mePages/pection/point/Index', icon: 'document-outline' },
    { title: '点表协议', desc: '管理点表协议类型', url: '/mePages/pection/protype/Index', icon: 'file-outline' },
    { title: '点表厂家', desc: '管理点表厂家信息', url: '/mePages/pection/manu/Index', icon: 'setting-outline' },
    { title: '点表型号', desc: '管理点表型号信息', url: '/mePages/pection/model/Index', icon: 'list-outline' },
];

onLoad((options: any) => {
    console.log('点表管理页面加载', options);
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <!-- 占位：顶部固定区域高度 -->
        <view :style="{ height: '0px' }"></view>

        <wd-navbar left-arrow title="点表管理" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

        <view :style="{ margin: '20rpx', background: isDark ? '#1b1b1b' : '#f5f6f8' }">
            <view v-for="(item, index) in modules" :key="index"
                  class="module-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }"
                  @click="goToPage(item.url, item.title)">
                <view class="module-content">
                    <view class="module-title" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.title }}</view>
                    <view class="module-desc" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ item.desc }}</view>
                </view>
                <wd-icon name="arrow-right" size="20px" :color="isDark ? '#ffffff80' : '#00000080'"></wd-icon>
            </view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.module-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    margin-bottom: 20rpx;
    background: #ffffff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.module-content {
    flex: 1;
}

.module-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #323233;
    margin-bottom: 8rpx;
}

.module-desc {
    font-size: 24rpx;
    color: #969799;
}
</style>
