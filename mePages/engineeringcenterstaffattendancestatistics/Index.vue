<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { onReady, onLoad, onShow, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { reactive, ref, nextTick, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchGetAllUserDataList, fetchGetRealtimeTrajectoryInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const message = useMessage();

const activeTab = ref<number>(0);

const isDark = computed(() => theme.value === 'dark');

const tabsList = ref<{ title: string, count: number, value: number }[]>([
    {
        title: '全部',
        count: 0,
        value: 0
    },
    {
        title: '外勤',
        count: 0,
        value: 1
    },
    {
        title: '公司',
        count: 0,
        value: 2
    },
    {
        title: '未知',
        count: 0,
        value: 3
    }
]);

const model = reactive({
    allDataList: [] as any,
    fieldworkDataList: [] as any,
    companyDataList: [] as any,
    unknownDataList: [] as any
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取工程技术人员信息 && 实时轨迹
// status: 1 = 外勤, 2 = 公司, 3 = 未知
async function getDataList() {
    model.allDataList = [];
    model.fieldworkDataList = [];
    model.companyDataList = [];
    model.unknownDataList = [];

    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
        const realtimeTrajectoryData = await fetchGetRealtimeTrajectoryInfo();
        // 如果没有任何实时轨迹 → 全部未知
        if (!realtimeTrajectoryData || realtimeTrajectoryData.length === 0) {
            model.allDataList = data.list.map((item: any) => ({ ...item, status: 3 }));
            model.unknownDataList = [...model.allDataList];
            return;
        }

        // 建立 pid 映射表，便于快速查找
        const rtMap = new Map();
        realtimeTrajectoryData.forEach((rt: any) => {
            rtMap.set(rt.creater, rt); // 假设 realtimeTrajectoryData 里 userid 对应 dataItem.id
        });

        const allUserList = data.list.filter((item: any) => item.status === 0);

        allUserList.forEach((item: any) => {
            const rtInfo = rtMap.get(item.id); // 匹配是否有实时位置信息

            let status = 3;  // 默认未知
            let merged: any = { ...item };

            if (rtInfo) {
                // 合并轨迹信息
                merged = {
                    ...merged,
                    address: rtInfo.address,
                    pid: rtInfo.pid,
                    proname: rtInfo.proname,
                    userimage: rtInfo.userimage,
                    dbtime: rtInfo.dbtime,
                    longitude: rtInfo.longitude,
                    latitude: rtInfo.latitude
                };

                if (rtInfo.pid === -1) {
                    status = 2; // 公司
                } else {
                    status = 1; // 外勤
                }
            }

            merged.status = status;

            // 放入总列表
            model.allDataList.push(merged);

            // 分类
            if (status === 1) model.fieldworkDataList.push(merged);
            if (status === 2) model.companyDataList.push(merged);
            if (status === 3) model.unknownDataList.push(merged);
        });

        tabsList.value[0].count = model.allDataList.length;
        tabsList.value[1].count = model.fieldworkDataList.length;
        tabsList.value[2].count = model.companyDataList.length;
        tabsList.value[3].count = model.unknownDataList.length;
    } catch (err) {
        console.error('获取工程技术人员信息失败', err);
    }
}

onShow(() => {
    getDataList();
});

onPullDownRefresh(() => {
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="工程中心人员实时考勤统计" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft"></wd-navbar>
        <wd-tabs swipeable animated v-model="activeTab">
            <block v-for="(item, index) in tabsList" :key="index">
                <wd-tab :title="item.title + ' (' + item.count + ')'">
                    <wd-gap :bg-color="isDark ? '#000000' : '#F5F5F5'"  height="110rpx" />

                    <view v-if="activeTab === 0">
                        <view v-if="model.allDataList.length > 0">
                            <view v-for="(item, index) in model.allDataList" :key="index">
                                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: index === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
                                    <view style="padding: 5rpx;">
                                        <wd-cell :title="item.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
                                            <wd-tag round :type="item.status === 1 ? 'warning' : item.status === 2 ? 'success' : item.status === 3 ? 'default' : 'default'">
                                                {{ item.status === 1 ? '外勤' : item.status === 2 ? '公司' : item.status === 3 ? '未知' : '未知' }}
                                            </wd-tag>
                                        </wd-cell>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip image="../../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
                        </view>
                    </view>

                    <view v-if="activeTab === 1">
                        <view v-if="model.fieldworkDataList.length > 0">
                            <view v-for="(fieldworkItem, fieldworkIndex) in model.fieldworkDataList" :key="fieldworkIndex">
                                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: fieldworkIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
                                    <view style="padding: 5rpx;">
                                        <wd-cell custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
                                            <template #title>
                                                <view style="display: flex; align-items: center; gap: 10rpx;">
                                                    <wd-img round :width="40" :height="40" :src="fieldworkItem.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'" :preview-src="fieldworkItem.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'" :enable-preview="true" />
                                                    <wd-text bold :text="fieldworkItem.username" color="#000000"></wd-text>
                                                </view>

                                                <!-- <view v-else>
                                                    <wd-text bold :text="fieldworkItem.username" color="#000000"></wd-text>
                                                </view> -->
                                            </template>
                                            <wd-tag round :type="fieldworkItem.status === 1 ? 'warning' : fieldworkItem.status === 2 ? 'success' : fieldworkItem.status === 3 ? 'default' : 'default'">
                                                {{ fieldworkItem.status === 1 ? '外勤' : fieldworkItem.status === 2 ? '公司' : fieldworkItem.status === 3 ? '未知' : '未知' }}
                                            </wd-tag>
                                        </wd-cell>

                                        <wd-cell icon="layers" title="项目名称" :value="fieldworkItem.proname" custom-class="cellClass"></wd-cell>
                                        <wd-cell icon="time" title="打卡时间" :value="fieldworkItem.dbtime" custom-class="cellClass"></wd-cell>
                                        <wd-cell icon="location" title="打卡地点" :value="fieldworkItem.address" custom-class="cellClass"></wd-cell>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip image="../../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
                        </view>
                    </view>

                    <view v-if="activeTab === 2">
                        <view v-if="model.companyDataList.length > 0">
                            <view v-for="(companyItem, companyIndex) in model.unknownDataList" :key="companyIndex">
                                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: companyIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
                                    <view style="padding: 5rpx;">
                                        <wd-cell :title="companyItem.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
                                            <wd-tag round :type="companyItem.status === 1 ? 'warning' : companyItem.status === 2 ? 'success' : companyItem.status === 3 ? 'default' : 'default'">
                                                {{ companyItem.status === 1 ? '外勤' : companyItem.status === 2 ? '公司' : companyItem.status === 3 ? '未知' : '未知' }}
                                            </wd-tag>
                                        </wd-cell>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip image="../../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
                        </view>
                    </view>

                    <view v-if="activeTab === 3">
                        <view v-if="model.unknownDataList.length > 0">
                            <view v-for="(unknownItem, unknownIndex) in model.unknownDataList" :key="unknownIndex">
                                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: unknownIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
                                    <view style="padding: 5rpx;">
                                        <wd-cell :title="unknownItem.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
                                            <wd-tag round :type="unknownItem.status === 1 ? 'warning' : unknownItem.status === 2 ? 'success' : unknownItem.status === 3 ? 'default' : 'default'">
                                                {{ unknownItem.status === 1 ? '外勤' : unknownItem.status === 2 ? '公司' : unknownItem.status === 3 ? '未知' : '未知' }}
                                            </wd-tag>
                                        </wd-cell>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip image="../../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
                        </view>
                    </view>
                </wd-tab>
            </block>
        </wd-tabs>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.wd-tabs) {
    background-color: transparent !important;
}

:deep(.wd-tabs__nav) {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 99 !important;
}

:deep(.cellValueClass) {
    font-size: 16px !important;
    font-weight: bolder !important;
}

:deep(.cellLabelTitle) {
    font-weight: bolder !important;
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }

    .wd-cell__right {
        font-weight: bold !important;
    }
}
</style>