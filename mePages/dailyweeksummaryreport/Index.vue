<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSystemDate, hasPermission, getCurrentWeekDates } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetDailyweeksummaryInfo } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const activeTab = ref<number>(0);
const scrollViewHeight = ref<number>(0);
const userIdNameObj = ref<any>([]);
const dailyList = ref<any[]>([]);
const weekList = ref<any[]>([]);
const sumaryList = ref<any[]>([]);
const clockInList = ref<any[]>([]);
const processList = ref<any[]>([]);
const scrollTop = ref<number>(0);
const type = ref<number>(3);
const topFixedWrap = ref<any>(null);
const selectDate = ref<number>(Number(getSystemDate(5)));
const selectWeek = ref<number>(Date.now());
const selectMonth = ref<number>(Number(getSystemDate(5)));
const selectYear = ref<number>(Number(getSystemDate(5)));

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const tabsList = ref<{ title: string, value: number }[]>([
    {
        title: '日报',
        value: 0
    },
    {
        title: '周报',
        value: 1
    },
    {
        title: '项目总结',
        value: 2
    },
    {
        title: '打卡',
        value: 3
    },
    {
        title: '项目流程',
        value: 4
    }
]);

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

// 周选择
function handleWeekConfirmChange({ value }: { value: number }) {
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

// /**
//  * 获取当前周周一到周日的日期（返回年月日字符串）
//  * @param date 可选，指定日期，默认当天
//  * @returns 包含周一到周日日期的字符串数组，格式：YYYY-MM-DD
//  */
// function getCurrentWeekDates(date?: Date | number): string[] {
//     let currentDate: Date;

//     if (!date) {
//         currentDate = new Date(); // 不传用当前时间
//     } else if (typeof date === 'number') {
//         currentDate = new Date(date); // 时间戳转Date
//     } else {
//         currentDate = date; // 已经是Date对象
//     }

//     const dayOfWeek = currentDate.getDay(); // 0=周日, 1=周一, ..., 6=周六
//     const monday = new Date(currentDate);

//     // 计算周一的日期
//     const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
//     monday.setDate(currentDate.getDate() + diffToMonday);

//     // 生成一周的日期（字符串格式）
//     const weekDates: string[] = [];
//     for (let i = 0; i < 7; i++) {
//         const date = new Date(monday);
//         date.setDate(monday.getDate() + i);

//         // 格式化为 YYYY-MM-DD
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份补0
//         const day = String(date.getDate()).padStart(2, '0'); // 日期补0

//         weekDates.push(`${year}-${month}-${day}`);
//     }

//     return weekDates;
// }

// 获取列表信息
async function getDataList() {
    if (!hasPermission('project:Meeting:select')) {
        return
    }
    try {
        dailyList.value = [];
        weekList.value = [];
        sumaryList.value = [];
        clockInList.value = [];
        processList.value = [];
        let queryParams: any = { _t: new Date().getTime() };
        if (type.value === 1) {
            // queryParams['startTime'] = getSystemDate(0, selectDate.value);
            // queryParams['endTime'] = getSystemDate(0, selectDate.value);
			queryParams['dates'] = getSystemDate(0, selectDate.value);
        } else if (type.value === 2) {
            let datesArr = getCurrentWeekDates(selectWeek.value);
            queryParams['startTime'] = datesArr[0];
            queryParams['endTime'] = datesArr[datesArr.length - 1];
        } else if (type.value === 3) {
            queryParams['dates'] = getSystemDate(3, selectMonth.value);
        } else {
            queryParams['dates'] = getSystemDate(4, selectMonth.value);
        }
        const data = await fetchGetDailyweeksummaryInfo(queryParams);

        for (const key in userIdNameObj.value) {
            if (data.daily) {
                const userDailyInfo = data.daily.find((d: any) => d.creater === key) || {};

                dailyList.value.push({
                    username: userIdNameObj.value[key].username,
                    userimage: userIdNameObj.value[key].userimage,
                    avgcharctras: userDailyInfo.avgcharctras || 0,
                    avgscore: userDailyInfo.avgscore || 0,
                    highcount: userDailyInfo.highcount || 0,
                    lowcount: userDailyInfo.lowcount || 0,
                    mediumcount: userDailyInfo.mediumcount || 0,
                    reportcount: userDailyInfo.reportcount || 0,
                    totalscore: userDailyInfo.totalscore || 0,
                })
            }

            if (data.weekly) {
                const userWeeklyInfo = data.weekly.find((d: any) => d.creater === key) || {};

                weekList.value.push({
                    username: userIdNameObj.value[key].username,
                    userimage: userIdNameObj.value[key].userimage,
                    avgcharctras: userWeeklyInfo.avgcharctras || 0,
                    avgscore: userWeeklyInfo.avgscore || 0,
                    highcount: userWeeklyInfo.highcount || 0,
                    lowcount: userWeeklyInfo.lowcount || 0,
                    mediumcount: userWeeklyInfo.mediumcount || 0,
                    reportcount: userWeeklyInfo.reportcount || 0,
                    totalscore: userWeeklyInfo.totalscore || 0,
                })
            }

            if (data.project) {
                const userProjectInfo = data.project.find((d: any) => d.creater === key) || {};

                sumaryList.value.push({
                    username: userIdNameObj.value[key].username,
                    userimage: userIdNameObj.value[key].userimage,
                    avgcharctras: userProjectInfo.avgcharctras || 0,
                    avgscore: userProjectInfo.avgscore || 0,
                    highcount: userProjectInfo.highcount || 0,
                    lowcount: userProjectInfo.lowcount || 0,
                    mediumcount: userProjectInfo.mediumcount || 0,
                    reportcount: userProjectInfo.reportcount || 0,
                    totalscore: userProjectInfo.totalscore || 0,
                })
            }

            if (data.clockin) {
                const userClockinInfo = data.clockin.find((d: any) => d.creater === key) || {};

                clockInList.value.push({
                    username: userIdNameObj.value[key].username,
                    userimage: userIdNameObj.value[key].userimage,
                    clockinnormal: userClockinInfo.clockinnormal || 0,
                    clockinabnormal: userClockinInfo.clockinabnormal || 0,
                    normalscore: userClockinInfo.normalscore || 0,
                    abnormalscore: userClockinInfo.abnormalscore || 0,
                    clockindepart: userClockinInfo.clockindepart || 0,
                    clockinarrive: userClockinInfo.clockinarrive || 0,
                    departscore: userClockinInfo.departscore || 0,
                    arrivescore: userClockinInfo.arrivescore || 0,
                    totalscore: Number((userClockinInfo.normalscore || 0) + (userClockinInfo.abnormalscore || 0) + (userClockinInfo.departscore || 0) + (userClockinInfo.arrivescore || 0))
                })
            }

            if (data.process) {
                const userProcessInfo = data.process.find((d: any) => d.creater === key) || {};

                processList.value.push({
                    username: userIdNameObj.value[key].username,
                    userimage: userIdNameObj.value[key].userimage,
                    file1count: userProcessInfo.file1count || 0,
                    file2count: userProcessInfo.file2count || 0,
                    file3count: userProcessInfo.file3count || 0,
                    file4count: userProcessInfo.file4count || 0,
                    file5count: userProcessInfo.file5count || 0,
                    file6count: userProcessInfo.file6count || 0,
                    file7count: userProcessInfo.file7count || 0,
                    file1score: userProcessInfo.file1score || 0,
                    file2score: userProcessInfo.file2score || 0,
                    file3score: userProcessInfo.file3score || 0,
                    file4score: userProcessInfo.file4score || 0,
                    file5score: userProcessInfo.file5score || 0,
                    file6score: userProcessInfo.file6score || 0,
                    file7score: userProcessInfo.file7score || 0,
                    totalfilecount: userProcessInfo.totalfilecount || 0,
                    totalfilescore: userProcessInfo.totalfilescore || 0,
                    equipmentscore: userProcessInfo.equipmentscore || 0,
                    checkedcount: userProcessInfo.checkedcount || 0,
                    totalscore: Number((userProcessInfo.totalfilescore || 0) + (userProcessInfo.equipmentscore || 0))
                })
            }
        }

        dailyList.value = dailyList.value.sort((a: any, b: any) => b.totalscore - a.totalscore);
        weekList.value = weekList.value.sort((a: any, b: any) => b.totalscore - a.totalscore);
        sumaryList.value = sumaryList.value.sort((a: any, b: any) => b.totalscore - a.totalscore);
        clockInList.value = clockInList.value.sort((a: any, b: any) => b.totalscore - a.totalscore);
        processList.value = processList.value.sort((a: any, b: any) => b.totalscore - a.totalscore);

        // if (data.daily) {
        //     data.daily.forEach((item: any) => {
        //         dailyList.value.push({
        //             ...item,
        //             username: userIdNameObj.value[item.creater].username,
        //             userimage: userIdNameObj.value[item.creater].userimage,
        //         })
        //     });
        // }

        // if (data.weekly) {
        //     data.weekly.forEach((item: any) => {
        //         weekList.value.push({
        //             ...item,
        //             username: userIdNameObj.value[item.creater].username,
        //             userimage: userIdNameObj.value[item.creater].userimage,
        //         })
        //     });
        // }

        // if (data.project) {
        //     data.project.forEach((item: any) => {
        //         sumaryList.value.push({
        //             ...item,
        //             username: userIdNameObj.value[item.creater].username,
        //             userimage: userIdNameObj.value[item.creater].userimage,
        //         })
        //     });
        // }

        // if (data.clockin) {
        //     data.clockin.forEach((item: any) => {
        //         clockInList.value.push({
        //             ...item,
        //             username: userIdNameObj.value[item.creater].username,
        //             userimage: userIdNameObj.value[item.creater].userimage,
        //         })
        //     });
        // }
    } catch (err) {
        console.error('获取列表失败', err);
    }
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    if (!topFixedWrap.value) return;
    uni.createSelectorQuery()
        .select('.topFixedWrap')
        .boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) {
                topFixedHeight.value = rect.height;
                const sysInfo = uni.getSystemInfoSync();
                scrollViewHeight.value = sysInfo.windowHeight - topFixedHeight.value;
            }
        })
        .exec();
}

onLoad(() => {
    getAllUserDataList();
    uni.$on('refreshListPrjMettingmunutes', getDataList); // 监听刷新事件
});

onUnload(() => {
    uni.$off('refreshListPrjMettingmunutes', getDataList); // 页面销毁时解绑
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    getAllUserDataList();
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
            <wd-navbar left-arrow title="行为规范报表统计" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

            <view :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'calc(100vw - 20rpx)', padding: '0 20rpx', background: isDark ? '#1b1b1b' : '#FFFFFF' }">
                <wd-radio-group size="small" v-model="type" shape="button" @change="getDataList">
                    <wd-radio :value="1">日</wd-radio>
                    <wd-radio :value="2">周</wd-radio>
                    <wd-radio :value="3">月</wd-radio>
                    <wd-radio :value="4">年</wd-radio>
                </wd-radio-group>
                <wd-datetime-picker v-if="type === 1" type="date" :z-index="999" v-model="selectDate" @confirm="handleDateChange" />
                <wd-calendar type="week" v-if="type === 2" :first-day-of-week="1" v-model="selectWeek" @confirm="handleWeekConfirmChange" />
                <wd-datetime-picker v-if="type === 3" type="year-month" :z-index="999" v-model="selectMonth" @confirm="handleYearMonthChange" />
                <wd-datetime-picker v-if="type === 4" type="year" :z-index="999" v-model="selectYear" @confirm="handleYearChange" />
            </view>

            <wd-tabs v-model="activeTab" animated>
				<wd-tab v-for="(tabsPrjItem, tabsPrjIndex) in tabsList" :key="tabsPrjIndex" :title="tabsPrjItem.title"></wd-tab>
			</wd-tabs>
			
			<scroll-view :scroll-y="true" :scroll-top="scrollTop" :style="{ height: scrollViewHeight + 'px' }">
				<view v-if="activeTab === 0">
					<view v-if="dailyList.length > 0">
						<view class="list-item" v-for="(dataItem, index) in dailyList" :key="index">
							<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
								<view style="padding: 20rpx;">
									<view class="prjInfoHeader">
										<view class="left">
											<wd-img round :width="35" :height="35" :src="dataItem.userimage" :preview-src="dataItem.userimage" :enable-preview="true" />
											<wd-text bold :text="dataItem.username" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>

										<view class="right">
											<wd-text bold :text="'总得分：' + dataItem.totalscore" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>
									</view>
									<wd-cell title="日报总数" custom-class="cellClass">
										<wd-text bold :text="dataItem.reportcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="合格数" custom-class="cellClass">
										<wd-text bold :text="dataItem.lowcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="良好数" custom-class="cellClass">
										<wd-text bold :text="dataItem.mediumcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="优秀数" custom-class="cellClass">
										<wd-text bold :text="dataItem.highcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="平均分" custom-class="cellClass">
										<wd-text bold :text="dataItem.avgscore" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="平均字符数" custom-class="cellClass">
										<wd-text bold :text="dataItem.avgcharctras" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
								</view>
							</view>
						</view>

						<wd-gap height="30rpx"></wd-gap>
					</view>

					<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
						<wd-status-tip image="../../static/search.png" tip="暂无日常行为规范统计" />
					</view>
				</view>

				<view v-if="activeTab === 1">
					<view v-if="weekList.length > 0">
						<view class="list-item" v-for="(weekItem, weekIndex) in weekList" :key="weekIndex">
							<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
								<view style="padding: 20rpx;">
									<view class="prjInfoHeader">
										<view class="left">
											<wd-img round :width="35" :height="35" :src="weekItem.userimage" :preview-src="weekItem.userimage" :enable-preview="true" />
											<wd-text bold :text="weekItem.username" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>

										<view class="right">
											<wd-text bold :text="'总得分：' + weekItem.totalscore" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>
									</view>
									<wd-cell title="周报总数" custom-class="cellClass">
										<wd-text bold :text="weekItem.reportcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="合格数" custom-class="cellClass">
										<wd-text bold :text="weekItem.lowcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="良好数" custom-class="cellClass">
										<wd-text bold :text="weekItem.mediumcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="优秀数" custom-class="cellClass">
										<wd-text bold :text="weekItem.highcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="平均分" custom-class="cellClass">
										<wd-text bold :text="weekItem.avgscore" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="平均字符数" custom-class="cellClass">
										<wd-text bold :text="weekItem.avgcharctras" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
								</view>
							</view>
						</view>
						<wd-gap height="30rpx"></wd-gap>
					</view>

					<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
						<wd-status-tip image="../../static/search.png" tip="暂无日常行为规范统计" />
					</view>
				</view>

				<view v-if="activeTab === 2">
					<view v-if="sumaryList.length > 0">
						<view class="list-item" v-for="(sumaryItem, sumaryIndex) in sumaryList" :key="sumaryIndex">
							<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
								<view style="padding: 20rpx;">
									<view class="prjInfoHeader">
										<view class="left">
											<wd-img round :width="35" :height="35" :src="sumaryItem.userimage" :preview-src="sumaryItem.userimage" :enable-preview="true" />
											<wd-text bold :text="sumaryItem.username" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>

										<view class="right">
											<wd-text bold :text="'总得分：' + sumaryItem.totalscore" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>
									</view>
									<wd-cell title="项目总结总数" custom-class="cellClass">
										<wd-text bold :text="sumaryItem.reportcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="合格数" custom-class="cellClass">
										<wd-text bold :text="sumaryItem.lowcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="良好数" custom-class="cellClass">
										<wd-text bold :text="sumaryItem.mediumcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="优秀数" custom-class="cellClass">
										<wd-text bold :text="sumaryItem.highcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="平均分" custom-class="cellClass">
										<wd-text bold :text="sumaryItem.avgscore" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="平均字符数" custom-class="cellClass">
										<wd-text bold :text="sumaryItem.avgcharctras" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
								</view>
							</view>
						</view>
						<wd-gap height="30rpx"></wd-gap>
					</view>

					<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
						<wd-status-tip image="../../static/search.png" tip="暂无日常行为规范统计" />
					</view>
				</view>

				<view v-if="activeTab === 3">
					<view v-if="clockInList.length > 0">
						<view class="list-item" v-for="(clockInItem, clockInIndex) in clockInList" :key="clockInIndex">
							<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
								<view style="padding: 20rpx;">
									<view class="prjInfoHeader">
										<view class="left">
											<wd-img round :width="35" :height="35" :src="clockInItem.userimage" :preview-src="clockInItem.userimage" :enable-preview="true" />
											<wd-text bold :text="clockInItem.username" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>

										<view class="right">
											<wd-text bold :text="'总得分：' + clockInItem.totalscore" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>
									</view>
									<wd-cell title="正常打卡数" custom-class="cellClass">
										<wd-text bold :text="clockInItem.clockinnormal" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="异常打卡数" custom-class="cellClass">
										<wd-text bold :text="clockInItem.clockinabnormal" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="出发打卡数" custom-class="cellClass">
										<wd-text bold :text="clockInItem.clockindepart" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="到达打卡数" custom-class="cellClass">
										<wd-text bold :text="clockInItem.clockinarrive" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="正常打卡得分" custom-class="cellClass">
										<wd-text bold :text="clockInItem.normalscore" size="14px" color="#00FF00" />
									</wd-cell>
									<wd-cell title="异常打卡得分" custom-class="cellClass">
										<wd-text bold :text="clockInItem.abnormalscore" size="14px" color="#FF0000" />
									</wd-cell>
									<wd-cell title="出发打卡得分" custom-class="cellClass">
										<wd-text bold :text="clockInItem.departscore" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="到达打卡得分" custom-class="cellClass">
										<wd-text bold :text="clockInItem.arrivescore" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
								</view>
							</view>
						</view>
						<wd-gap height="30rpx"></wd-gap>
					</view>

					<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
						<wd-status-tip image="../../static/search.png" tip="暂无日常行为规范统计" />
					</view>
				</view>

				<view v-if="activeTab === 4">
					<view v-if="processList.length > 0">
						<view class="list-item" v-for="(processItem, processIndex) in processList" :key="processIndex">
							<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
								<view style="padding: 20rpx;">
									<view class="prjInfoHeader">
										<view class="left">
											<wd-img round :width="35" :height="35" :src="processItem.userimage" :preview-src="processItem.userimage" :enable-preview="true" />
											<wd-text bold :text="processItem.username" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>

										<view class="right">
											<wd-text bold :text="'总得分：' + processItem.totalscore" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
										</view>
									</view>
									<wd-cell title="设备清点次数 / 分值" custom-class="cellClass">
										<wd-text bold :text="processItem.equipmentscore + ' / ' + processItem.equipmentscore" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="总数量 / 总得分" custom-class="cellClass">
										<wd-text bold :text="processItem.totalfilecount + ' / ' + processItem.totalfilescore" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="项目图纸数量 / 分值" custom-class="cellClass">
										<wd-text bold :text="processItem.file1count + ' / ' + processItem.file1score" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="IP规划表数量 / 分值" custom-class="cellClass">
										<wd-text bold :text="processItem.file2count + ' / ' + processItem.file2score" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="工程文件数量 / 分值" custom-class="cellClass">
										<wd-text bold :text="processItem.file3count + ' / ' + processItem.file3score" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="现场照片数量 / 分值" custom-class="cellClass">
										<wd-text bold :text="processItem.file4count + ' / ' + processItem.file4score" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="网络通讯图数量 / 分值" custom-class="cellClass">
										<wd-text bold :text="processItem.file5count + ' / ' + processItem.file5score" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="组态画面工程备份数量 / 分值" custom-class="cellClass">
										<wd-text bold :text="processItem.file6count + ' / ' + processItem.file6score" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									<wd-cell title="验收文件数量 / 分值" custom-class="cellClass">
										<wd-text bold :text="processItem.file7count + ' / ' + processItem.file7score" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
								</view>
							</view>
						</view>
						<wd-gap height="30rpx"></wd-gap>
					</view>

					<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
						<wd-status-tip image="../../static/search.png" tip="暂无日常行为规范统计" />
					</view>
				</view>
			</scroll-view>

            <wd-backtop :bottom="40" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>
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
        width: calc(100% - 300rpx);
        display: flex;
        align-items: center;
        gap: 0 10rpx;
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
