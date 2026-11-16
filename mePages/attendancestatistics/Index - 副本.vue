<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { transformData, getSystemDate, hasPermission } from '@/utils/index';
import ZsyCalendar from '@/components/zsy-calendar/zsy-calendar.vue';
import StatisticWeek from '@/components/statistic-week/statistic-week.vue';
import StatisticMonth from '@/components/statistic-month/statistic-month.vue';
import { fetchGetPrjClockinRecordInfo, fetchGetAllUserDataList } from '@/service/index';

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const selectMode = ref<string>('close');

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

// 选择用户
const userShow = ref<boolean>(false);
const triggered = ref<boolean>(false);
const userDataList = ref<any>([]);
const allUserDataList = ref<any>([]);

const dataList = ref<any>({});
const monthDataList = ref<any>({});
const yearDataList = ref<any>({});

const dataForm = ref<{
    selectDay: string;
    startDate: string;
    endDate: string;
    startMonth: string;
    page: number;
    limit: number;
    total: number;
    fuzzy: string;
    uname: string;
    checkedUser: any;
}>({
    selectDay: String(getSystemDate(0, new Date().getTime())),
    startDate: String(getSystemDate(0, new Date().getTime())),
    endDate: String(getSystemDate(0, new Date().getTime())),
    startMonth: String(getSystemDate(3, new Date().getTime())),
    page: 1,
    limit: 100,
    total: 0,
    fuzzy: '',
    uname: '',
    checkedUser: -1
});

const attendancestatisticsInfo = reactive({
    teamStatistics: {
        type: 1, // 1日统计 2周统计 3月统计
        field1: 0, // 外勤
        field2: 0, // 迟到
        field3: 4  // 未打卡
    },
    myStatistics: {
        type: 1, // 1日统计 2周统计 3月统计
        field1: 0, // 未开始
        field2: 0, // 已完成
        field3: 4  // 进行中
    }
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 打开弹出层
function handleLinkUserShowChange() {
    userShow.value = true;
}

// 清除
function handleClearChange() {
    // dataForm.page = 1;
    // getAllUserDataList();
    userDataList.value = allUserDataList.value;
}

// 搜索
function handleSearchChange() {
    // dataForm.page = 1;
    // getAllUserDataList();
    userDataList.value = allUserDataList.value.filter((item: any) => item.username.indexOf(dataForm.value.fuzzy) !== -1);
}

// 获取全部调试人员
async function getAllUserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (dataForm.value.page === 1) {
            userDataList.value = [];
            allUserDataList.value = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.value.page, limit: dataForm.value.limit, usertypes: '2, 3, 9' });
        // const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: dataForm.limit, usertypes: '2, 3, 9', fuzzy: dataForm.fuzzy });
        userDataList.value = userDataList.value.concat([{ id: -1, username: '全部' }]).concat(data.list);
        allUserDataList.value = allUserDataList.value.concat([{ id: -1, username: '全部' }]).concat(data.list);
        dataForm.value.total = Number(data.total);
    } catch (error) {
        console.error('获取全部调试人员失败', error);
    }
}

// 工程师刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.value.page = 1;
    getAllUserDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && allUserDataList.value.length - 1 < dataForm.value.total) {
        dataForm.value.page++;
        getAllUserDataList();
    }
}

// 关闭选择人员弹框
function handleCloseChange() {
    userShow.value = false;
}

// 选择调试工程师
function handleRadioSelectChange({ value }: { value: any }) {
    const names = userDataList.value.find((item: any) => value === item.id);
    dataForm.value.uname = value === -1 ? '' : names ? names.username : '';
    userShow.value = false;
    getClockinRecordDataList();
}

function handleZsycalendarChange(e: any) {
    console.log('选择的日期', e);
    dataForm.value.selectDay = e.selectedDate;
    dataList.value = [];
    getClockinRecordDataList();
}

function handeleCalendarModeChange(e: any) {
    console.log('选择的模式', e);
    selectMode.value = e.mode;
}

function handleWeekChange(e: any) {
    console.log('选择的周', e);
    let dateArray: any = e.weekDateRange.split('-');
    dataForm.value.startDate = e.MondayOfYear + '-' + dateArray[0].replace('.', '-');
    dataForm.value.endDate = e.MondayOfYear + '-' + dateArray[1].replace('.', '-');
    monthDataList.value = [];
    getClockinRecordDataList();
}

function handleMonthChange(e: any) {
    console.log('选择的月', e);
    dataForm.value.startMonth = e.selectedDate;
    yearDataList.value = [];
    getClockinRecordDataList();
}

function transArrayByMap(response: any) {
    const result: any[] = []
    Object.keys(response).forEach((key) => {
        result.push({
            name: key,
            avatarImage: response[key].length > 0 ? response[key][response[key].length - 1].userImage || 'https://pms.linkqi.cn:18443/soybean.jpg' : 'https://pms.linkqi.cn:18443/soybean.jpg',
            list: response[key]
        })
    })
    return result
}

// 日周月统计切换
function handleTypeChange() {
    setTimeout(() => {
        recalcTopFixedHeight();
    }, 100);
}

// 获取打卡报表
async function getClockinRecordDataList() {
    try {
        let dates: string = attendancestatisticsInfo.teamStatistics.type === 1 ? dataForm.value.selectDay : attendancestatisticsInfo.teamStatistics.type === 3 ? dataForm.value.startMonth : dataForm.value.selectDay;
        let queryParams: any = attendancestatisticsInfo.teamStatistics.type === 2 ? { startTime: dataForm.value.startDate, endTime: dataForm.value.endDate } : { dates };
        if (dataForm.value.checkedUser != -1) {
            queryParams['creater'] = dataForm.value.checkedUser;
        }
        const data = await fetchGetPrjClockinRecordInfo(queryParams);
        // const data = attendancestatisticsInfo.teamStatistics.type === 2 ? await fetchGetPrjClockinRecordInfo({ startTime: dataForm.value.startDate, endTime: dataForm.value.endDate }) : await fetchGetPrjClockinRecordInfo({ dates })
        if (attendancestatisticsInfo.teamStatistics.type === 1) {
            dataList.value = transArrayByMap(transformData(data));
        } else if (attendancestatisticsInfo.teamStatistics.type === 2) {
            monthDataList.value = transArrayByMap(transformData(data));
        } else if (attendancestatisticsInfo.teamStatistics.type === 3) {
            yearDataList.value = transArrayByMap(transformData(data));
        }
    } catch (error) {
        console.error('获取打卡报表失败', error);
    }
}

// 查看详情
function handleViewDetailInfoChange(row: any) {
    const userObj = userDataList.value.find((item: any) => row.username === item.username);
    if (row.startTime && row.pid && userObj && userObj.id) {
        uni.navigateTo({
            url: '/mePages/attendancestatisticsdetail/Index?pid=' + row.pid + '&startTime=' + row.startTime + '&endTime=' + (row.endTime || getSystemDate(0) + " 23:59:59") + '&uid=' + userObj.id + '&uname=' + encodeURIComponent(row.username) + '&projectName=' + encodeURIComponent(row.projectName) + '&address=' + encodeURIComponent(row.address) + '&duration=' + row.duration + '&status=' + row.status + '&dailyReport=' + row.dailyReport
        })
    } else {
        uni.showToast({
            icon: 'none',
            title: '缺少查询必要条件，请联系管理员重试',
            duration: 1500
        })
    }
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    // use createSelectorQuery 获取真实高度（适配小程序/APP/H5）
    try {
        uni.createSelectorQuery()
            .select('.topFixedWrap')
            .boundingClientRect((rect: any) => {
                if (rect && rect.height !== undefined) {
                    topFixedHeight.value = rect.height;
                }
            })
            .exec();
    } catch (err) {
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad(() => {
    getAllUserDataList();
    // getClockinRecordDataList();

    // 有些平台 onLoad -> DOM 还没渲染好，延后执行一次计算
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
});

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
    // 可监听窗口尺寸变更（H5 情况），小屏旋转/resize 时重新计算
    try {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', recalcTopFixedHeight);
        }
    } catch (e) { /* ignore */ }
});

onPullDownRefresh(() => {
    if (attendancestatisticsInfo.teamStatistics.type === 1) {
        getClockinRecordDataList();
    } else if (attendancestatisticsInfo.teamStatistics.type === 2) {
        getClockinRecordDataList();
    } else if (attendancestatisticsInfo.teamStatistics.type === 3) {
        getClockinRecordDataList();
    }
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="考勤统计" safe-area-inset-top :bordered="false" @click-left="handleClickLeft">
                <template #right  v-if="hasPermission('sys:user:get:list')">
                    <view style="display: flex; align-items: center; gap: 0 10rpx;">
                        <view>{{ dataForm.uname }}</view>
                        <wd-icon name="filter" @click.stop="handleLinkUserShowChange"></wd-icon>
                    </view>
                </template>
            </wd-navbar>

            <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
                <view style="padding: 40rpx; display: flex; justify-content: space-between; align-items: center; width: calc(100vw - 80rpx);">
                    <wd-radio-group v-model="attendancestatisticsInfo.teamStatistics.type" shape="button" custom-class="headerRadioWrap" @change="handleTypeChange">
                        <wd-radio :value="1">日统计</wd-radio>
                        <wd-radio :value="2">周统计</wd-radio>
                        <wd-radio :value="3">月统计</wd-radio>
                    </wd-radio-group>
                </view>

                <ZsyCalendar v-if="attendancestatisticsInfo.teamStatistics.type === 1" :sundayIndex="0" mode="close" @change="handleZsycalendarChange" @modeChange="handeleCalendarModeChange" />
                <StatisticWeek v-if="attendancestatisticsInfo.teamStatistics.type === 2" @change="handleWeekChange" />
                <StatisticMonth v-if="attendancestatisticsInfo.teamStatistics.type === 3" @change="handleMonthChange" />
            </view>
        </view>


        <view>
            <view v-if="attendancestatisticsInfo.teamStatistics.type === 1">
                <view v-if="dataList.length > 0">
                    <view v-for="(dataItem, dataIndex) in dataList" :key="dataIndex">
                        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
                            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                            <view style="margin-left: 10rpx; font-weight: bolder; display: flex; align-items: center; gap: 0 10rpx;">
                                <!-- <wd-img :width="30" :height="30" round :src="dataItem.avatarImage" :preview-src="dataItem.avatarImage" :enable-preview="true" /> -->
                                <view>{{ dataItem.name }}</view>
                            </view>
                        </view>

                        <view v-for="(listItem, listIndex) in dataItem.list" :key="listIndex" @click="handleViewDetailInfoChange(listItem)"
                            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: listIndex === dataItem.list.length - 1 ? '0 20rpx 40rpx 20rpx' : '0 20rpx 20rpx', borderRadius: '20rpx' }">
                            <view style="padding: 20rpx; ">
                                <!-- <view class="prjInfoHeader">
                                    <view class="left">
                                        <wd-text bold :text="listItem.username" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                    </view>

                                    <view class="right">
                                        <wd-tag round :type="listItem.status === 0 ? 'success' : listItem.status === 1 ? 'danger' : 'default'">
                                            {{ listItem.status === 0 ? '正常' : listItem.status === 1 ? '异常' : '未知'  }}
                                        </wd-tag>
                                    </view>
                                </view> -->
                                <wd-cell title="调试人员" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="listItem.username" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="项目名称" icon="layers" custom-class="cellClass">
                                    <wd-text bold :text="listItem.projectName" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="工时" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="listItem.duration + '小时'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="上班打卡地址" icon="location" custom-class="cellClass">
									<wd-text bold :text="listItem.startAddress" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="上班打卡时间" icon="calendar" custom-class="cellClass">
									<wd-text bold :text="listItem.startTime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="上班打卡误差值" icon="flag" custom-class="cellClass">
									<wd-text bold :text="listItem.startDistanse" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡地址" icon="location" custom-class="cellClass">
									<wd-text bold :text="listItem.address" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡时间" icon="calendar" custom-class="cellClass">
									<wd-text bold :text="listItem.endTime || '无'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡误差值" icon="flag" custom-class="cellClass">
									<wd-text bold :text="listItem.endDistanse" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>


                                <wd-cell title="打卡状态" icon="clock" custom-class="cellClass">
                                    <wd-tag round :type="listItem.status === 0 ? 'success' : listItem.status === 1 ? 'danger' : 'default'">
                                        {{ listItem.status === 0 ? '正常' : listItem.status === 1 ? '异常' : '未知' }}
                                    </wd-tag>
                                </wd-cell>

                                <wd-cell title="日报" icon="time" custom-class="cellClass">
                                    <wd-tag round :type="listItem.dailyReport === 0 ? 'danger' : listItem.dailyReport === 1 ? 'success' : 'default'">
                                        {{ listItem.dailyReport === 0 ? '未提交' : listItem.dailyReport === 1 ? '已提交' : '未知' }}
                                    </wd-tag>
                                    <!-- <wd-text bold :text="listItem.daytime" size="14px" :color="isDark ? '#ffffff' : '#000000'" /> -->
                                </wd-cell>
                            </view>
                        </view>
                    </view>
                </view>
                <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '60rpx 20rpx 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                    <wd-status-tip image="../../static/search.png" tip="暂无考勤数据" />
                </view>
            </view>

            <view v-if="attendancestatisticsInfo.teamStatistics.type === 2">
                <view v-if="monthDataList.length > 0">
                    <view v-for="(monthItem, monthIndex) in monthDataList" :key="monthIndex">
                        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
                            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                            <view style="margin-left: 10rpx; font-weight: bolder; display: flex; align-items: center; gap: 0 10rpx;">
                                <wd-img :width="30" :height="30" round :src="monthItem.avatarImage" :preview-src="monthItem.avatarImage" :enable-preview="true" />
                                <view>{{ monthItem.name }}</view>
                            </view>
                            <!-- <view style="margin-left: 10rpx; font-weight: bolder;">{{ monthItem.name }}</view> -->
                        </view>

                        <view v-for="(monthListItem, monthListIndex) in monthItem.list" :key="monthListIndex" @click="handleViewDetailInfoChange(monthListItem)"
                            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
                            <view style="padding: 20rpx; ">
                                <wd-cell title="调试人员" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="monthListItem.username" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="项目名称" icon="layers" custom-class="cellClass">
                                    <wd-text bold :text="monthListItem.projectName" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="工时" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="monthListItem.duration + '小时'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="上班打卡地址" icon="location" custom-class="cellClass">
									<wd-text bold :text="monthListItem.startAddress" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="上班打卡时间" icon="calendar" custom-class="cellClass">
									<wd-text bold :text="monthListItem.startTime || '无'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="上班打卡误差值" icon="flag" custom-class="cellClass">
									<wd-text bold :text="monthListItem.startDistanse" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡地址" icon="location" custom-class="cellClass">
									<wd-text bold :text="monthListItem.address" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡时间" icon="calendar" custom-class="cellClass">
									<wd-text bold :text="monthListItem.endTime || '无'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡误差值" icon="flag" custom-class="cellClass">
									<wd-text bold :text="monthListItem.endDistanse" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

                                <wd-cell title="打卡状态" icon="clock" custom-class="cellClass">
                                    <wd-tag round :type="monthListItem.status === 0 ? 'success' : monthListItem.status === 1 ? 'danger' : 'default'">
                                        {{ monthListItem.status === 0 ? '正常' : monthListItem.status === 1 ? '异常' : '未知' }}
                                    </wd-tag>
                                </wd-cell>

                                <wd-cell title="日报" icon="time" custom-class="cellClass">
                                    <wd-tag round :type="monthListItem.dailyReport === 0 ? 'danger' : monthListItem.dailyReport === 1 ? 'success' : 'default'">
                                        {{ monthListItem.dailyReport === 0 ? '未提交' : monthListItem.dailyReport === 1 ? '已提交' : '未知' }}
                                    </wd-tag>
                                </wd-cell>
                                <!-- <view class="prjInfoHeader">
                                    <view class="left">
                                        <wd-text bold :text="monthListItem.username" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                    </view>

                                    <view class="right">
                                        <wd-tag round :type="monthListItem.status === 0 ? 'success' : monthListItem.status === 1 ? 'danger' : 'default'">
                                            {{ monthListItem.status === 0 ? '正常' : monthListItem.status === 1 ? '异常' : '未知'  }}
                                        </wd-tag>
                                    </view>
                                </view>

                                <wd-cell title="时长" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="monthListItem.duration" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="打卡类型" icon="list" custom-class="cellClass">
                                    <wd-text bold :text="monthListItem.ctype === 0 ? '上班打卡 ' : monthListItem.ctype === 1 ? '下班打卡' : monthListItem.ctype === 2 ? '系统上报' : '未知'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="地址" icon="location" custom-class="cellClass">
                                    <wd-text bold :text="monthListItem.address" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="打卡人" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="monthListItem.username" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="时间" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="monthListItem.daytime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell> -->
                            </view>
                        </view>
                    </view>
                </view>
                <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '40rpx 20rpx 20rpx', padding: '40rpx 0', borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff' }">
                    <wd-status-tip image="../../static/search.png" tip="暂无考勤数据" />
                </view>
            </view>

            <view v-if="attendancestatisticsInfo.teamStatistics.type === 3">
                <view v-if="yearDataList.length > 0">
                    <view v-for="(yearItem, yearIndex) in yearDataList" :key="yearIndex">
                        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
                            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                            <view style="margin-left: 10rpx; font-weight: bolder; display: flex; align-items: center; gap: 0 10rpx;">
                                <wd-img :width="30" :height="30" round :src="yearItem.avatarImage" :preview-src="yearItem.avatarImage" :enable-preview="true" />
                                <view>{{ yearItem.name }}</view>
                            </view>
                            <!-- <view style="margin-left: 10rpx; font-weight: bolder;">{{ yearItem.name }}</view> -->
                        </view>

                        <view v-for="(yearListItem, yearListIndex) in yearItem.list" :key="yearListIndex" @click="handleViewDetailInfoChange(yearListItem)"
                            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
                            <view style="padding: 20rpx; ">
                                <wd-cell title="调试人员" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="yearListItem.username" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="项目名称" icon="layers" custom-class="cellClass">
                                    <wd-text bold :text="yearListItem.projectName" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="工时" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="yearListItem.duration + '小时'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>
								
								<wd-cell title="上班打卡地址" icon="location" custom-class="cellClass">
									<wd-text bold :text="yearListItem.startAddress" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="上班打卡时间" icon="calendar" custom-class="cellClass">
									<wd-text bold :text="yearListItem.startTime || '无'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="上班打卡误差值" icon="flag" custom-class="cellClass">
									<wd-text bold :text="yearListItem.startDistanse" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡地址" icon="location" custom-class="cellClass">
									<wd-text bold :text="yearListItem.address" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡时间" icon="calendar" custom-class="cellClass">
									<wd-text bold :text="yearListItem.endTime || '无'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="下班打卡误差值" icon="flag" custom-class="cellClass">
									<wd-text bold :text="yearListItem.endDistanse" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

                                <wd-cell title="打卡状态" icon="clock" custom-class="cellClass">
                                    <wd-tag round :type="yearListItem.status === 0 ? 'success' : yearListItem.status === 1 ? 'danger' : 'default'">
                                        {{ yearListItem.status === 0 ? '正常' : yearListItem.status === 1 ? '异常' : '未知' }}
                                    </wd-tag>
                                </wd-cell>

                                <wd-cell title="日报" icon="time" custom-class="cellClass">
                                    <wd-tag round :type="yearListItem.dailyReport === 0 ? 'danger' : yearListItem.dailyReport === 1 ? 'success' : 'default'">
                                        {{ yearListItem.dailyReport === 0 ? '未提交' : yearListItem.dailyReport === 1 ? '已提交' : '未知' }}
                                    </wd-tag>
                                </wd-cell>
                                <!-- <view class="prjInfoHeader">
                                    <view class="left">
                                        <wd-text bold :text="yearListItem.username" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                    </view>

                                    <view class="right">
                                        <wd-tag round :type="yearListItem.status === 0 ? 'success' : yearListItem.status === 1 ? 'danger' : 'default'">
                                            {{ yearListItem.status === 0 ? '正常' : yearListItem.status === 1 ? '异常' : '未知'  }}
                                        </wd-tag>
                                    </view>
                                </view>

                                <wd-cell title="时长" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="yearListItem.duration" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="打卡类型" icon="list" custom-class="cellClass">
                                    <wd-text bold :text="yearListItem.ctype === 0 ? '上班打卡 ' : yearListItem.ctype === 1 ? '下班打卡' : yearListItem.ctype === 2 ? '系统上报' : '未知'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="地址" icon="location" custom-class="cellClass">
                                    <wd-text bold :text="yearListItem.address" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="打卡人" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="yearListItem.username" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="时间" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="yearListItem.daytime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell> -->
                            </view>
                        </view>
                    </view>
                </view>
                <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '40rpx 20rpx 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                    <wd-status-tip image="../../static/search.png" tip="暂无考勤数据" />
                </view>
            </view>
        </view>

        <wd-popup closable custom-class="userPopupWrap" :custom-style="`width: 80vw; margin-top: ${topFixedHeight}px;`" :z-index="99" v-model="userShow" position="left" @close="handleCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 330rpx);">
                <wd-radio-group v-model="dataForm.checkedUser" shape="dot" @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in userDataList" :key="index" custom-class="radioCellWrap">
                        <wd-radio :value="item.id" custom-class="radioWrap">{{ item.username }}</wd-radio>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 999;
    background-color: #FFFFFF;
    /* 保证内联元素正确换行 */
    box-sizing: border-box;
    /* 可选：微阴影让固定区更明显 */
    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
}

.headerRadioWrap {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    background: #F5F5F5 !important;
    border-radius: 20px !important;

    .wd-radio {
        width: 33.33% !important;
        margin-right: 0 !important;
    }

    :deep(.wd-radio__label) {
        width: 100% !important;
        // text-align: center !important;
        background: transparent !important;
    }

    .wd-radio.is-button .wd-radio__label {
        background: transparent !important;
    }

    :deep(.wd-radio.is-checked.is-button .wd-radio__label) {
        background: #ffffff !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important; /* 添加阴影，浮起 */
        border: 1px solid #e0e0e0 !important; /* 添加边框，增强轮廓 */
        position: relative; /* 确保 z-index 有效（如果需要） */
        z-index: 1; /* 略高于周围内容 */
        transition: box-shadow 0.2s ease; /* 平滑动画 */
    }
}

.headerRadioWrap {
    .wd-radio-group {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
        background: #000000 !important;
        border-radius: 20px !important;
    }

    .wd-radio {
        width: 33.33% !important;
        margin-right: 0 !important;
    }

    .wd-radio__label {
        width: 100% !important;
        // text-align: center !important;
    }

    .wd-radio.is-button .wd-radio__label {
        background: transparent !important;
        border: none !important;
    }

    .wd-radio.is-checked.is-button .wd-radio__label {
        background: transparent !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important; /* 添加阴影，浮起 */
        border: 1px solid #e0e0e0 !important; /* 添加边框，增强轮廓 */
        position: relative; /* 确保 z-index 有效（如果需要） */
        z-index: 1; /* 略高于周围内容 */
        transition: box-shadow 0.2s ease; /* 平滑动画 */
    }
}

:deep(.prjRowClass) {
    padding-bottom: 20rpx;
}

:deep(.wd-circle__text) {
    z-index: 0 !important;
}

.calendar_container {
    // min-height: calc(100vh - var(--window-top));
    background-color: #f5f5f5;
    padding: 30rpx;
    box-sizing: border-box;
}

.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cellClass {
    margin-left: 0 !important;
    padding-left: 0 !important;
}

.userPopupWrap {
    .radioCellWrap {
        width: calc(100% - 40rpx) !important;

        :deep(.wd-cell__wrapper) {
            display: block !important;
        }
    }

    :deep(.wd-radio__label) {
        text-align: left !important;
        width: calc(100% - 80rpx) !important;
    }

    .radioWrap {
        width: 100% !important;

        .wd-radio__label {
            text-align: left !important;
            width: calc(100% - 80rpx) !important;
        }
    }
}
</style>