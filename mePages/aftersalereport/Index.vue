<script lang="ts" setup>
import { throttle } from "@/utils/debounce";
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSystemDate, hasPermission, getCurrentWeekDates } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetAftersalesReportInfo } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const activeTab = ref<number>(0);
const userIdNameObj = ref<any>([]);
const dataList = ref<any[]>([]);
const allDataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
const type = ref<number>(3);
const topFixedWrap = ref<any>(null);
const tableHeight = ref<any>(null);
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
    if (!hasPermission('project:aftermarket')) {
        return
    }
    try {
        dataList.value = [];
		allDataList.value = [];
        let queryParams: any = { _t: new Date().getTime() };
        if (type.value === 1) {
            queryParams['dates'] = getSystemDate(0, selectDate.value);
        } else if (type.value === 2) {
            queryParams['dates'] = getSystemDate(3, selectMonth.value);
        } else {
            queryParams['dates'] = getSystemDate(4, selectMonth.value);
        }
        const data = await fetchGetAftersalesReportInfo(queryParams);
        dataList.value = data;
		allDataList.value = data;
    } catch (err) {
        console.error('获取列表失败', err);
    }
}, 1000, { leading: true, trailing: true })

// 排序
function handleSortChange(TableColumn: any) {
	console.log(TableColumn);
	const { prop, sortDirection } = TableColumn
	if (!prop || dataList.value.length === 0) return
	if (sortDirection === 0) {
		dataList.value = allDataList.value;
		return
	}
	dataList.value = [...dataList.value].sort((a, b) => {
		const valA = a[prop]
		const valB = b[prop]

		// 空值处理（很重要）
		if (valA == null && valB == null) return 0
		if (valA == null) return sortDirection === 1 ? -1 : 1
		if (valB == null) return sortDirection === 1 ? 1 : -1

		// 数字
		if (typeof valA === 'number' && typeof valB === 'number') {
			return sortDirection === 1 ? valB - valA : valA - valB
		}

		return sortDirection === 1 ? String(valA).localeCompare(String(valB), 'zh') : String(valB).localeCompare(String(valA), 'zh')
	})
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    if (!topFixedWrap.value) return;
    uni.createSelectorQuery()
        .select('.topFixedWrap')
        .boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) {
                topFixedHeight.value = rect.height;
				const systemInfo = uni.getSystemInfoSync();
				tableHeight.value = systemInfo.screenHeight - rect.height;
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
            <wd-navbar left-arrow title="售后报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

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
			<wd-table size="small" :data="dataList" style="width: 100vw; overflow-x: hidden;" @sort-method="handleSortChange">
				<wd-table-col prop="name" label="型号" width="60%" align="center">
					<template #value="{row}">
						<wd-text bold :text="row.model || '未知'" :color="isDark ? '#FFFFFF' : '#000000'"></wd-text>
				    </template>
				</wd-table-col>
				<wd-table-col prop="modelcount" label="数量" width="40%" align="center" sortable>
					<template #value="{row}">
						<wd-text bold :text="row.modelcount || 0" :color="isDark ? '#FFFFFF' : '#000000'"></wd-text>
					</template>
				</wd-table-col>
			</wd-table>
			
			<wd-gap height="30rpx"></wd-gap>
		</view>
	
		<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-status-tip image="../../static/search.png" tip="暂无售后报表" />
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
