<script lang="ts" setup>
import { throttle } from "@/utils/debounce";
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSystemDate, hasPermission, getCurrentWeekDates } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetPrjReportInfo } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const activeTab = ref<number>(0);
const userIdNameObj = ref<any>([]);
const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
const type = ref<number>(3);
const topFixedWrap = ref<any>(null);
const selectDate = ref<number>(Number(getSystemDate(5)));
const selectMonth = ref<number>(Number(getSystemDate(5)));
const selectYear = ref<number>(Number(getSystemDate(5)));

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 日选择
function handleDateChange({ value }: { value: number }) {
    getDataList();
}

// 月选择
function handleYearMonthChange({ value }: { value: number }) {
    getDataList();
}

// 年选择
function handleYearChange({ value }: { value: number }) {
    getDataList();
}

// 获取列表信息
async function getAllUserDataList() {
    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
        console.log('data', data);
        data.list.forEach((item: any) => {
            if (item.status !== 1) {
                userIdNameObj.value[String(item.id)] = {
                    username: item.username,
                    userimage: item.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'
                }
            }
        });
        await getDataList();
    } catch (err) {
        console.error('获取列表失败', err);
    }
}

// 获取列表信息
const getDataList = throttle(async () => {
    if (!hasPermission('project:report')) {
        return
    }
    try {
        dataList.value = [];
        let queryParams: any = { _t: new Date().getTime() };
        if (type.value === 1) {
            queryParams['dates'] = getSystemDate(0, selectDate.value);
        } else if (type.value === 2) {
            queryParams['dates'] = getSystemDate(3, selectMonth.value);
        } else {
            queryParams['dates'] = getSystemDate(4, selectMonth.value);
        }
        const data = await fetchGetPrjReportInfo(queryParams);
        dataList.value = data;
    } catch (err) {
        console.error('获取列表失败', err);
    }
}, 1000, { leading: true, trailing: true })

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    if (!topFixedWrap.value) return;
    uni.createSelectorQuery()
        .select('.topFixedWrap')
        .boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) {
                topFixedHeight.value = rect.height;
            }
        })
        .exec();
}

onLoad(() => {
    // getAllUserDataList();
	getDataList();
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    // getAllUserDataList();
	getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 50);
    });
    // 可监听窗口尺寸变更（H5 情况），小屏旋转/resize 时重新计算
    try {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', recalcTopFixedHeight);
        }
    } catch (e) { /* ignore */ }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <view class="topFixedWrap" ref="topFixedWrap">
            <wd-navbar left-arrow title="项目报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

            <view :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'calc(100vw - 20rpx)', padding: '0 20rpx', background: isDark ? '#1b1b1b' : '#FFFFFF' }">
                <wd-radio-group size="small" v-model="type" shape="button" @change="getDataList">
                    <wd-radio :value="1">日</wd-radio>
                    <wd-radio :value="2">月</wd-radio>
                    <wd-radio :value="3">年</wd-radio>
                </wd-radio-group>
                <wd-datetime-picker v-if="type === 1" type="date" :z-index="999" v-model="selectDate" @confirm="handleDateChange" />
                <wd-datetime-picker v-if="type === 2" type="year-month" :z-index="999" v-model="selectMonth" @confirm="handleYearMonthChange" />
                <wd-datetime-picker v-if="type === 3" type="year" :z-index="999" v-model="selectYear" @confirm="handleYearChange" />
            </view>
		</view>
		
		<!-- 占位：顶部固定区域高度（动态计算） -->
		<view :style="{ height: topFixedHeight + 'px' }"></view>
		
		<view v-if="dataList.length > 0">
			<view class="list-item" v-for="(dataItem, index) in dataList" :key="index">
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
					<view style="padding: 20rpx;">
						<view class="prjInfoHeader">
							<view class="left">
								<!-- <wd-img round :width="35" :height="35" :src="dataItem.userimage" :preview-src="dataItem.userimage" :enable-preview="true" /> -->
								<wd-text bold :text="dataItem.username || '--'" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
							</view>
						</view>
						<wd-cell title="参与项目数量" custom-class="cellClass">
							<wd-text bold :text="dataItem.projectcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
						</wd-cell>
						<wd-cell title="调试任务数量" custom-class="cellClass">
							<wd-text bold :text="dataItem.debugcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
						</wd-cell>
					</view>
				</view>
			</view>
	
			<wd-gap height="30rpx"></wd-gap>
		</view>
	
		<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-status-tip image="../../static/search.png" tip="暂无项目报表" />
		</view>
		
		<wd-backtop :bottom="40" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    width: 100%;
    z-index: 99;
    background-color: #F5F5F5;
    box-sizing: border-box;
}

:deep(.wd-tabs__container) {
    background: #F5F5F5 !important;
}

.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10rpx;

    .left{
        // width: calc(100% - 300rpx);
        // display: flex;
        // align-items: center;
        // gap: 0 10rpx;
		padding-left: 15rpx;
    }
}

.radioCellWrap {
    padding: 10rpx 20rpx !important;
}

:deep(.wd-radio) {
    margin-right: 0 !important;
}

:deep(.wd-radio.is-button .wd-radio__label) {
    width: 40px !important;
    height: 30px !important;
    line-height: 30px !important;
    padding: 0 !important;
    border-radius: 0 !important;
    min-width: 40px !important;
    margin: 0 !important;
}

:deep(.wd-radio-group) {
    background-color: v-bind("isDark ? '#000000' : '#ffffff'") !important;
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}
</style>
