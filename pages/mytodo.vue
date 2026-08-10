<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetMyDebugBusinessInfo } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

const model = reactive<{
    page: number;
    limit: number;
    pid: number;
    fuzzy: string;
}>({
    page: 1,
    limit: 50,
    pid: 0,
    fuzzy: ''
})

// 清除
function handleClearChange() {
    model.page = 1;
    dataList.value = [];
    getDataList();
}

// 搜索
function handleSearchChange() {
    model.page = 1;
    dataList.value = [];
    getDataList();
}

// 获取我的待办
async function getDataList() {
    if (!hasPermission('project:Week:select')) {
        return
    }
    try {
        if (model.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = { page: model.page, limit: model.limit };
        const data = await fetchGetMyDebugBusinessInfo(queryParams);
        dataList.value = dataList.value.concat(data.list.map((item: any) => {
            return {
                ...item,
                content1: item.content1 || '',
                content2: item.content2 || '',
                content3: item.content3 || '',
                commentList: [],
                isFold: item.hasOwnProperty('isFold') ? item.isFold : false,
                content: item.hasOwnProperty('content') ? item.content : '',
            }
        }));
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取我的待办列表失败', err);
        state.value = 'error';
    }
}

// 跳转
function handleJumpChange(url: string) {
    uni.navigateTo({
        url
    })
}

onReady(() => {
	// #ifdef APP || APP-PLUS
	uni.hideTabBar();
	// #endif
})

onLoad(() => {
    getDataList();
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    model.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (dataList.value.length < total.value) {
        model.page++;
        getDataList();
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});
</script>

<template>
    <view class="wraper">
        <view v-if="dataList.length > 0">
            <view v-for="(item, index) in dataList" :key="index">
                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
                    <view style="padding: 20rpx;">
                        <view @click="handleJumpChange('/projectPages/projectdetail/Index?pid=' + item.pid + '&activeTab=2')">
                            <view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ item.proname }}</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx;">调试业务名称:</view>
                            <view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;">{{ item.debugname }}</view>
                        </view>
                    </view>
                </view>
            </view>

            <wd-loadmore :state="state" @reload="getDataList" />

            <wd-backtop :bottom="70" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>
        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
            <wd-status-tip image="../static/search.png" tip="暂无待办事项" />
        </view>
    </view>
</template>
