<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjTechnicianDataList } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const prjForm = reactive({
    id: null,
    bid: null
})
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    fuzzy: string;
}>({
    page: 1,
    limit: 20,
    fuzzy: '',
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 清除
function handleClearChange() {
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 获取调试工程师列表信息
async function getDataList() {
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetPrjTechnicianDataList({ page: dataForm.page, limit: dataForm.limit, pid: prjForm.id, fuzzy: dataForm.fuzzy });
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        console.log('dataList.value', dataList.value);

        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取调试工程师列表失败', err);
    }
}

// 修改调试工程师
function handleJumpPageChange(url: string) {
    uni.navigateTo({
        url
    });
}

// 新增调试人
const handleAddContractChange = () => {
    uni.navigateTo({
        url: `/projectPages/addprjdebugmemberpage/Index?pid=${prjForm.id}`
    });
}

onLoad((options: any) => {
    prjForm.id = options.pid;
    getDataList();
    uni.$on('refreshListPrjdebug', getDataList); // 监听刷新事件
});

onUnload(() => {
    uni.$off('refreshListPrjdebug', getDataList); // 页面销毁时解绑
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (dataList.value.length < total.value) {
        dataForm.page++;
        getDataList();
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});

onPullDownRefresh(() => {
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="调试工程师列表" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft">
            <!-- <template #right>
                <wd-icon name="add-circle" size="20px"></wd-icon>
            </template> -->
        </wd-navbar>
        <view class="wraper">
            <wd-search custom-class="wdSearchContainer" v-model="dataForm.fuzzy" placeholder="请输入调试人员名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
                cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <wd-gap :bg-color="isDark ? '#000000' : '#F8F9Fa'" height="100rpx" />

            <view v-if="dataList.length > 0">
                <view v-for="(dataItem, dataIndex) in dataList" :key="dataIndex">
                    <view
                        :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: dataIndex === dataList.length ? '20rpx 20rpx 40rpx 20rpx' : '20rpx', borderRadius: '20rpx' }"
                        @click="handleJumpPageChange(dataItem.id)">
                        <view style="padding: 20rpx; ">
                            <view class="prjInfoHeader">
                                <view class="left">
                                    <wd-text bold :text="dataItem.uname" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                </view>
                                <view class="right">
                                    <wd-icon name="edit-outline" size="18px" @click.stop="handleJumpPageChange('/projectPages/addprjdebugmemberpage/Index?pid=' + prjForm.id + '&did=' + dataItem.id)"></wd-icon>
                                </view>
                            </view>

                            <wd-cell title="创建者" icon="user" custom-class="cellClass">
                                <wd-text bold :text="dataItem.username" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                            </wd-cell>

                            <wd-cell title="创建时间" icon="time" custom-class="cellClass">
                                <wd-text bold :text="dataItem.dbtime" size="14px"
                                    :color="isDark ? '#ffffff' : '#000000'" />
                            </wd-cell>
                        </view>
                    </view>
                </view>
            </view>
            <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', height: 'calc(100vh - 320rpx)', background: isDark ? '#1b1b1b' : '#ffffff' }">
                <wd-status-tip image="search" tip="暂无调试工程师数据" />
            </view>

            <wd-fab position="right-bottom" :gap="{ bottom: 70 }" :expandable="false" @click="handleAddContractChange"></wd-fab>

            <wd-backtop :bottom="135" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10rpx 0 !important;
    margin-bottom: 20rpx;

    .left {
        display: flex;
        align-items: center;
        width: calc(100vw - 180px);
    }
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}

:deep(.wd-progress__outer) {
    height: 7px !important;
    border-radius: 10px !important;
}

:deep(.wd-progress__inner) {
    border-radius: 10px !important;
}
</style>