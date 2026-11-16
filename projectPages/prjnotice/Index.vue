<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="注意事项" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft"></wd-navbar>

        <scroll-view scroll-y :style="{ height: '100vh', background: isDark ? '#000000' : '#F5F5F5' }">
            <view style="height: 20rpx;"></view>
            <ProjectNoticePanel v-if="pid" :pid="pid" :dark="isDark" :disabled="disabled" />
        </scroll-view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import ProjectNoticePanel from '@/components/project-notice-panel.vue';

/**
 * 项目注意事项独立页（从项目详情「注意事项」入口跳入，替代原 DepartureNoticePopup 弹窗）
 * 复用内嵌面板组件：列表直显、发布/查看/撤回均跳独立页；disabled=1 时仅可查看（暂停项目）。
 */
const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const pid = ref<number>(0);
const disabled = ref(false);

onLoad((options: any) => {
    pid.value = Number(options?.pid) || 0;
    disabled.value = String(options?.disabled || '') === '1';
});

function handleClickLeft() {
    uni.navigateBack();
}
</script>
