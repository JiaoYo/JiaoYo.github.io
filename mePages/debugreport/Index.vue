<script lang="ts" setup>
import { throttle } from "@/utils/debounce";
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSystemDate, hasPermission, getCurrentWeekDates } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetDebugReportInfo } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const state = ref<any>('loading');
const isDark = computed(() => theme.value === 'dark');
const activeTab = ref<number>(0);
const userIdNameObj = ref<any>({});
const userDatsList = ref<any[]>([]);
const allUserDataList = ref<any[]>([]);
const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
const type = ref<number>(2);
const topFixedWrap = ref<any>(null);
const selectMonth = ref<number>(Number(getSystemDate(5)));
const selectYear = ref<number>(Number(getSystemDate(5)));

const usernameTriggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

// 调试报表数据源
const model = ref<{
	page: number;
	total: number;
	userShow: boolean;
	checkUser: any;
	username: string;
	usernameFuzzy: string;
}>({
	page: 1,
	total: 0,
	userShow: false,
	checkUser: null,
	username: "",
	usernameFuzzy: ""
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 月选择
function handleYearMonthChange({ value }: { value: number }) {
	model.value.page = 1;
    getDataList();
}

// 年选择
function handleYearChange({ value }: { value: number }) {
	model.value.page = 1;
    getDataList();
}

// 清除关联调试人员
function handleClearUsernameChange() {
	model.value.username = "";
	model.value.checkUser = null;
	model.value.page = 1;
	getDataList();
}

// 关联调试人员
function handleLinkUserShowChange() {
	model.value.userShow = true;
}

// 关闭弹框
function handleCloseUsernameChange() {
	model.value.userShow = false;
}

// 清除搜索条件
function handleClearUsernameFuzzyChange() {
	userDatsList.value = allUserDataList.value;
}

// 搜索用户
function handleSearchUsernameFuzzyChange() {
	userDatsList.value = allUserDataList.value.filter((item: any) => item.username.toLocaleLowerCase().indexOf(model.value.usernameFuzzy) !== -1);
}

// 选择用户
function handleRadioUsernameSelectChange({ value }: { value: any }) {
	console.log('value', value);
	model.value.checkUser = value;
	model.value.username = allUserDataList.value.find((item: any) => item.id === value).username || '';
	model.value.userShow = false;
	model.value.page = 1;
	getDataList();
}

// 获取用户信息
async function getAllUserDataList() {
    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
        data.list.forEach((item: any) => {
            if (item.status !== 1) {
                userIdNameObj.value[String(item.id)] = {
                    username: item.username,
                    userimage: item.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'
                }
            }
        });
		userDatsList.value = data.list;
		allUserDataList.value = data.list;
    } catch (err) {
        console.error('获取列表失败', err);
    }
}

// 刷新(用户)
function handleScrollRefreshUsernameChange() {
	usernameTriggered.value = true;
	getAllUserDataList();
	setTimeout(() => {
		usernameTriggered.value = false;
		console.log('刷新完成');
	}, 1000)
}

// 获取列表信息
const getDataList = throttle(async () => {
    if (!hasPermission('project:debug')) {
        return
    }
    try {
		if (model.value.page === 1) {
			dataList.value = [];
		}
        let queryParams: any = {
			page: model.value.page,
			limit: 20,
			dates: type.value === 1 ? getSystemDate(3, selectMonth.value) : getSystemDate(4, selectYear.value),
			_t: new Date().getTime()
		};
        if (model.value.checkUser) {
            queryParams['userid'] = model.value.checkUser
        }
        const data = await fetchGetDebugReportInfo(queryParams);
        dataList.value = dataList.value.concat(data.list);
		model.value.total = Number(data.total);
		if (dataList.value.length < model.value.total) {
			state.value = 'loadmore';
		} else {
			state.value = 'finished';
		}
    } catch (err) {
        console.error('获取列表失败', err);
		state.value = 'error';
    }
}, 1000, { leading: true, trailing: true })

function formattedText(text: string) {
	if (!text) return '';
	return text.replace(/，/g, '<br />');
}

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
    getAllUserDataList();
	getDataList();
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
	model.value.page = 1;
    getAllUserDataList();
	getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
	if (dataList.value.length < model.value.total) {
		model.value.page++;
		getDataList();
	} else if (dataList.value.length === model.value.total) {
		state.value = 'finished';
	}
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
        <view class="topFixedWrap" ref="topFixedWrap" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-navbar left-arrow title="调试报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

			<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', border: '1px solid #cccccc', borderRadius: '40rpx', margin: '0 20rpx', padding: '5rpx 10rpx', width: 'calc(100vw - 60rpx)' }">
				<wd-input clearable disabled no-border v-model="model.username" placeholder="请选择调试人员" custom-style="padding-left: 10rpx;">
					<template #suffix>
						<view style="display: flex; align-items: center; gap: 0 10rpx;">
							<wd-icon v-if="model.username" name="close-circle" size="20px" @click="handleClearUsernameChange"></wd-icon>
							<wd-button icon="link" size="small" @click.stop="handleLinkUserShowChange">关联调试人员</wd-button>
						</view>
					</template>
				</wd-input>
			</view>
			
            <view :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'calc(100vw - 20rpx)', padding: '0 20rpx', background: isDark ? '#1b1b1b' : '#FFFFFF' }">
                <wd-radio-group size="small" v-model="type" shape="button" @change="getDataList">
                    <wd-radio :value="1">月</wd-radio>
                    <wd-radio :value="2">年</wd-radio>
                </wd-radio-group>
                <wd-datetime-picker v-if="type === 1" type="year-month" :z-index="999" v-model="selectMonth" @confirm="handleYearMonthChange" />
                <wd-datetime-picker v-if="type === 2" type="year" :z-index="999" v-model="selectYear" @confirm="handleYearChange" />
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
								<wd-text bold :text="dataItem.proname || '--'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
							</view>
						</view>
						<wd-cell title="项目调试任务数" custom-class="cellClass">
							<wd-text bold :text="dataItem.projectdebugcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
						</wd-cell>
						<wd-cell title="调试任务数" custom-class="cellClass" v-if="model.checkUser">
							<wd-text bold :text="dataItem.debugcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
						</wd-cell>
						<wd-cell title="调试占比" custom-class="cellClass" v-if="!model.checkUser">
							<view :style="{ color: isDark ? '#ffffff' : '#000000', fontWeight: 'bolder', whiteSpace: 'wrap' }" v-html="formattedText(dataItem.userstat)">
								
							</view>
							<!-- <wd-text bold :text="formattedText(dataItem.userstat)" size="14px" :color="isDark ? '#ffffff' : '#000000'" /> -->
						</wd-cell>
						<wd-cell title="调试占比" custom-class="cellClass" v-if="model.checkUser">
							<wd-text bold :text="dataItem.debugpercent" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
						</wd-cell>
					</view>
				</view>
			</view>
	
			<wd-gap height="30rpx"></wd-gap>
			
			<wd-loadmore :state="state" @reload="getDataList" />
		</view>
	
		<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-status-tip image="../../static/search.png" tip="暂无调试报表" />
		</view>
		
		<wd-backtop :bottom="40" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
		
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="model.userShow" position="left" @close="handleCloseUsernameChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="model.usernameFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchUsernameFuzzyChange" @cancel="handleSearchUsernameFuzzyChange" @clear="handleClearUsernameFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="usernameTriggered" @refresherrefresh="handleScrollRefreshUsernameChange" :style="{ height: 'calc(100vh - 400rpx)' }">
		        <wd-radio-group v-model="model.checkUser" shape="dot" @change="handleRadioUsernameSelectChange">
					<wd-radio v-for="(userItem, userIndex) in userDatsList" :key="userIndex" class="radioCellWrap" :value="userItem.id">{{ userItem.username }}</wd-radio>
				</wd-radio-group>
		    </scroll-view>
		</wd-popup>
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
