<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjCycleInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const model = reactive<{
    id: number | null;
    prophase: string;
    procontact: string;
    starttime: string;
    endtime: string;
    notes: string;
    username: string;
    dbtime: string;
}>({
    id: null,
    prophase: '',
    procontact: '',
    starttime: '',
    endtime: '',
    notes: '',
    username: '',
    dbtime: ''
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

async function getDebuggerBusinessInfo() {
    try {
        const data = await fetchGetPrjCycleInfo((model.id as number));
        model.prophase = data.prophase;
        model.procontact = data.procontact;
        model.starttime = data.starttime;
        model.endtime = data.endtime;
        model.notes = data.notes;
        model.username = data.username;
        model.dbtime = data.dbtime;
    } catch (error) {
        console.error('获取调试业务失败:', error);
    }
}

onLoad((options: any) => {
    model.id = options.id;
    getDebuggerBusinessInfo();
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="项目周期详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
            <view style="padding: 5rpx;">
                <wd-cell title="项目阶段" :value="model.prophase" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="联系方式" :value="model.procontact" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="计划起止时间" :value="model.starttime + ' ~ ' + model.endtime" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="备注" :value="model.notes" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="创建者" :value="model.username" custom-class="customCell" ellipsis />
                <wd-cell title="创建时间" :value="model.dbtime" custom-class="customCell" ellipsis />
            </view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20rpx 0 !important;
    width: calc(100vw - 80rpx);

    .left {
        width: 26px;
        height: 26px;
        margin-right: 20rpx;
    }

    .right {
        display: flex;
        flex-direction: column;
    }
}
</style>