<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission, getSystemDate, getCurrentWeekDates } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjDataList, fetchDeletePrjdailyreportInfo, fetchGetPrjdailyreportList, fetchGetDialyCommentDataList, fetchSaveDialyCommentInfo, fetchDeleteDialyCommentInfo, fetchGetAllUserDataList } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const prjShow = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);
const selectedIndex = ref<number>(0);
const userId = ref<number>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));
const triggered = ref<boolean>(false);

// 日周月全部切换
const selectedType = ref<number>(1);
const selectDate = ref<number>(Number(getSystemDate(7, null)) < 18 ? Number(getSystemDate(5, null, -1)) : Number(getSystemDate(5, null)));
const selectWeek = ref<number>(Number(getSystemDate(5)));
const selectMonth = ref<number>(Number(getSystemDate(5)));

// 用户选择弹框
const userShow = ref<boolean>(false);
const userTriggered = ref<boolean>(false);
const userIdNameObj: Record<number, string> = {};

const dataForm = reactive<{
    page: number;
    limit: number;
}>({
    page: 1,
    limit: 100,
});

const model = reactive<{
    page: number;
    total: number;
    pid: number;
    fuzzy: string;
    prjName: string;
    prjDataList: any;
	username: string;
	userPage: number;
	userLimit: number;
	userTotal: number;
	userFuzzy: string;
	userDataList: any;
	deleteUserList: any;
	allUserDataList: any;
	checkedUser: any;
}>({
    page: 1,
    total: 0,
    pid: 0,
    fuzzy: '',
    prjName: '',
    prjDataList: [],
	username: '',
	userPage: 1,
	userLimit: 100,
	userTotal: 0,
	userFuzzy: '',
	userDataList: [],
	deleteUserList: [],
	allUserDataList: [],
	checkedUser: null
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 打开弹出层
function handleLinkPrjShowChange() {
    prjShow.value = true;
}

// 清除
function handleClearFuzzyChange() {
	model.pid = 0;
	model.prjName = "";
    model.page = 1;
    getPrjDataList();
}

// 搜索
function handleSearchFuzzyChange() {
    model.page = 1;
    getPrjDataList();
}

// 获取项目分页数据
async function getPrjDataList() {
    if (!hasPermission('project:Info:select')) {
        return
    }
    if (model.page === 1) {
        model.prjDataList = [];
    }
    try {
        const data = await fetchGetPrjDataList({ page: model.page, limit: 100, fuzzy: model.fuzzy });
        model.total = Number(data.total);
        model.prjDataList = model.prjDataList.concat(data.list);
        if (model.pid) {
            let prjIndex: number = model.prjDataList.findIndex((item: any) => item.id === Number(model.pid));
            model.prjDataList[prjIndex].disabled = true;
        }
    } catch (error) {
        console.error('获取项目分页数据失败', error);
    }
}

// 项目刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    model.page = 1;
    getPrjDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.prjDataList.length < model.total) {
        model.page++;
        getPrjDataList();
    }
}

// 关闭弹出层
function handleCloseChange() {
    prjShow.value = false;
}

// 选择项目
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const prjObj = model.prjDataList.find((item: any) => value === item.id);
    model.prjName = prjObj ? prjObj.proname : '';
    prjShow.value = false;
    dataForm.page = 1;
    selectedIndex.value = 0;
    getDataList();
}

// 清除
function handleClearChange() {
    model.pid = 0;
    model.prjName = "";
    dataForm.page = 1;
    selectedIndex.value = 0;
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    selectedIndex.value = 0;
    getDataList();
}

// 日周月全部切换
const handleSelectedTypeChange = () => {
	dataForm.page = 1;
	getDataList();
}

// 日选择
function handleDateChange({ value }: { value: number }) {
	dataForm.page = 1;
	getDataList();
}

// 周选择
function handleWeekChange({ value }: { value: number }) {
	dataForm.page = 1;
	getDataList();
}

// 月选择
function handleMonthChange({ value }: { value: number }) {
	dataForm.page = 1;
	getDataList();
}

// 打开人员弹框
function handleLinkUserShowChange() {
    userShow.value = true;
}

// 清除
function handleClearUserFuzzyChange() {
    model.userDataList = model.allUserDataList;
}

// 搜索
function handleSearchUserFuzzyChange() {
    model.userDataList = model.allUserDataList.filter((item: any) => item.username.indexOf(model.userFuzzy) !== -1);
}

// 获取用户分页数据
async function getAlluserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (model.userPage === 1) {
            model.userDataList = [];
            model.allUserDataList = [];
			model.deleteUserList = [];
        }
        const data = await fetchGetAllUserDataList({ page: model.userPage, limit: model.userLimit, usertypes: '2, 3' });
        model.userTotal = Number(data.total);
        model.userDataList = model.userDataList.concat(data.list).filter((item: any) => item.status === 0);
        model.allUserDataList = model.allUserDataList.concat(data.list).filter((item: any) => item.status === 0);
		model.deleteUserList = model.deleteUserList.concat(data.list).filter((item: any) => item.status === 1);
        model.allUserDataList.forEach((item: any) => {
            userIdNameObj[item.id] = item.username;
        });
    } catch (error) {
        console.error('获取用户分页数据失败', error);
    }
}

// 刷新
function handleScrollUserRefreshChange() {
    userTriggered.value = true;
    model.userPage = 1;
    getAlluserDataList();
    setTimeout(() => {
        userTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerUserChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.allUserDataList.length + model.deleteUserList.length < model.userTotal) {
        model.userPage++;
        getAlluserDataList();
    }
}

// 关闭弹出层
function handleUserCloseChange() {
    userShow.value = false;
}

// 选择用户
function handleRadioSelectUserChange({ value }: { value: any }) {
    // const names = dataForm.checkedUser.map((id: any) => userIdNameObj[id]).filter(Boolean);
    // model.musers = names.join(", ");
    // model.musers = value.join(",");
	model.username = userIdNameObj[value];
	userShow.value = false;
	dataForm.page = 1;
	getDataList();
}

// 清除用户
function handleClearUserChange() {
	model.checkedUser = null;
	model.username = "";
	dataForm.page = 1;
	getDataList();
}

// 获取技术支持日报列表信息
async function getDataList() {
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = { page: dataForm.page, limit: dataForm.limit };
        if (model.pid) {
            queryParams['pid'] = model.pid;
        }
		if (selectedType.value === 1) {
		    queryParams['statrtTime'] = String(getSystemDate(0, selectDate.value) + ' 00:00:00');
			queryParams['endTime'] = String(getSystemDate(0, selectDate.value, 1) + ' 00:00:00');
		}
		if (selectedType.value === 2) {
			let datesArr = getCurrentWeekDates(selectWeek.value);
			queryParams['startTime'] = datesArr[0];
			queryParams['endTime'] = String(getSystemDate(0, new Date(datesArr[datesArr.length - 1]).getTime(), 1));
		}
		if (selectedType.value === 3) {
			const monthStr = getSystemDate(3, selectMonth.value);
			const startDate = `${monthStr}-01`;
			const endDate = getSystemDate(3, new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1));
			queryParams['statrtTime'] = startDate;
			queryParams['endTime'] = endDate + '-01';
		}
		if (model.username) {
			queryParams['creater'] = model.checkedUser;
		}
        const data = await fetchGetPrjdailyreportList(queryParams);
        dataList.value = dataList.value.concat(data.list.map((item: any) => {
            let context = item.context
            try {
                const parsed = JSON.parse(item.context)
                context = parsed;
            } catch (e) {
                // 不是合法 JSON，就保持原样
            }
            return {
                ...item,
                context,
                commentList: [],
                isObject: typeof context === 'string' ? false : true,
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
        console.error('获取技术支持日报列表失败', err);
        state.value = 'error';
    }
}

// 删除日报
async function handleDeleteChange(item: any, index: number) {
    console.log('item', item);
    console.log('index', index);
    try {
        message
        .confirm({
            msg: '确定要删除该日报吗?',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjdailyreportInfo(item.id);
            dataForm.page  = 1;
            getDataList();
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (err) {
        console.error('删除日报失败', err);
    }
}

// 技术支持日报
function handleAddTechnicalsupportdailyChange(url: string) {
    uni.navigateTo({
        url,
    });
}

// 评论日报
function handleCommentFoldChange(index: number) {
    selectedIndex.value = index;
    dataList.value.forEach((item: any, dataIndex: number) => {
        if (selectedIndex.value !== dataIndex) {
            item.isFold = false;
            item.content = "";
        }
    });
    dataList.value[index].isFold = !dataList.value[index].isFold;
    if (dataList.value[index].isFold) {
        handleGetCommentDataList();
    }
}

// 获取评论日报数据源
async function handleGetCommentDataList() {
    const data = await fetchGetDialyCommentDataList({ page: 1, limit: 100, pid: dataList.value[selectedIndex.value].id });
    dataList.value[selectedIndex.value].commentList = data.list;
}

// 评论日报提交
async function handleCommentSubmit() {
    if (!dataList.value[selectedIndex.value].content) {
        uni.showToast({
            icon: 'none',
            title: '请输入评论内容',
            duration: 1500
        })
        return
    }
    if (!hasPermission('project:Comment:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无评论权限，请联系管理员',
            duration: 1500
        })
        return
    }
    const data = await fetchSaveDialyCommentInfo([{ pid: dataList.value[selectedIndex.value].id, context: dataList.value[selectedIndex.value].content }]);
    uni.showToast({
        title: '评论成功',
        icon: 'none',
        duration: 1500,
        complete: () => {
            // dataList.value[selectedIndex.value].isFold = false;
            dataList.value[selectedIndex.value].content = '';
            handleGetCommentDataList();
            dataList.value[selectedIndex.value].num++;
        }
    });
}

// 删除日报评论
async function handleDeleteCommentChange(id: number) {
    if (!hasPermission('project:Comment:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该日报评论吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeleteDialyCommentInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除日报评论成功",
                duration: 1500,
                complete: () => {
                    // dataForm.page = 1;
                    // getDataList();
                    handleGetCommentDataList();
                    if (dataList.value[selectedIndex.value].num > 0) {
                        dataList.value[selectedIndex.value].num--;
                    }
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('删除日报评论失败', error);
    }
}

// 页面跳转
function handleJumpPageChange(url: string) {
    uni.navigateTo({
        url
    })
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

onLoad(async(options: any) => {
    model.pid = options.pid;
	model.fuzzy = options.pname ? decodeURIComponent(options.pname) : '';
	await getPrjDataList();
	await getAlluserDataList();
	await getDataList();
    uni.$on('refreshListPrjDaily', getDataList); // 监听刷新事件
});

onReady(() => {
    recalcTopFixedHeight();
})

onUnload(() => {
    uni.$off('refreshListPrjDaily', getDataList); // 页面销毁时解绑
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    dataForm.page = 1;
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
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="技术支持日报列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
                <template #right v-if="hasPermission('project:Info:select')">
                    <wd-icon name="filter" @click.stop="handleLinkPrjShowChange"></wd-icon>
                </template>
            </wd-navbar>

            <wd-search v-model="model.prjName" disabled placeholder="请选择项目" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

			<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '10rpx 20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0 10rpx' }">
				<wd-input clearable disabled no-border v-model="model.username" placeholder="请选择用户" custom-style="width: calc(100vw - 40rpx)">
					<template #suffix>
						<wd-button icon="link" size="small" @click.stop="handleLinkUserShowChange">用户信息</wd-button>
					</template>
				</wd-input>
				
				<wd-icon v-if="model.username" size="30rpx" name="close-circle" @click.stop="handleClearUserChange"></wd-icon>
				<!-- <wd-button v-if="model.username" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearUserChange"></wd-button> -->
			</view>
			<view class="canvasHeader" :style="{ padding: '20rpx', width: 'calc(100vw - 40rpx)', background: isDark ? '#000000' : '#ffffff' }">
			    <wd-radio-group size="small" v-model="selectedType" shape="button" @change="handleSelectedTypeChange">
			        <wd-radio :value="1">日</wd-radio>
			        <wd-radio :value="2">周</wd-radio>
			        <wd-radio :value="3">月</wd-radio>
			        <wd-radio :value="4">全部</wd-radio>
			    </wd-radio-group>
			
			    <wd-datetime-picker v-if="selectedType === 1" type="date" v-model="selectDate" @confirm="handleDateChange" />
				<wd-calendar v-if="selectedType === 2" type="week" v-model="selectWeek" @confirm="handleWeekChange" />
			    <wd-datetime-picker v-if="selectedType === 3" type="year-month" v-model="selectMonth" @confirm="handleMonthChange" />
			</view>
            <!-- <wd-search v-model="dataForm.username" custom-class="wdSearchContainer" placeholder="请输入技术支持日报内容" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->
        </view>

        <view v-if="dataList.length > 0">
            <view v-for="(dataItem, index) in dataList" :key="index">
                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
                    <view style="padding: 20rpx;" @click="handleJumpPageChange('/mePages/dailyreportinfo/Index?id=' + dataItem.id)">
                        <view class="prjInfoHeader">
                            <view class="left">
                                <wd-text bold :text="dataItem.username + '的技术支持日报'" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
                            </view>

                            <view class="right">
                                <wd-text :text="dataItem.dbtime" size="14px" :lines="1" />
                            </view>
                        </view>
                        <view v-if="!dataItem.isObject">
                            <view style="margin-top: 20rpx; font-size: 28rpx;">当天工作内容及成果描述:</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataItem.context }}</view>
                        </view>
                        <view v-else>
                            <view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataItem.context.proname || '无' }}</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx;" v-if="dataItem.context.notes">当天工作内容及成果描述:</view>
                            <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                            <view v-if="dataItem.context.notes" style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataItem.context.notes ? dataItem.context.notes.replace(/\n/g, '<br />') : ''"></view>
                        </view>
						<view v-if="dataItem.charctras" style="margin-top: 20rpx; font-size: 28rpx;">字符数:</view>
						<view v-if="dataItem.charctras" style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataItem.charctras }}</view>
                    </view>

                    <view style="padding: 20rpx;" v-if="hasPermission('project:Comment:select')">
                        <view style="height: 20rpx;"></view>
                        <wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
                        <view style="display: flex; justify-content: flex-end; align-items: center; margin-top: 10rpx;">
                            <view style="width: 60px; padding: 5rpx; border-radius: 50rpx; border: 2rpx solid #ccc; text-align: center; display: flex; justify-content: center; align-items: center;" @click="handleCommentFoldChange(index)">
                                <image class="content-top" style="width: 24px; height: 24px;" :src="isDark ? '../../static/commentswhite.png' : '../../static/comments.png'" />
                                <wd-text bold :text=" '(' + dataItem.num + ')'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                            </view>
                        </view>

                        <view v-if="dataItem.isFold">
                            <view style="height: 10rpx;"></view>
                            <wd-steps :active="dataItem.commentList.length" vertical dot>
                                <view v-for="(commentItem, commentIndex) in dataItem.commentList" :key="commentIndex" style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <wd-step :title="commentItem.username + ' ' + commentItem.dbtime" :description="commentItem.context" />
                                    <wd-icon name="delete1" size="22px" color="#ff0000" v-if="hasPermission('project:Comment:delete') && (userType === 0 || userId === commentItem.creater)" @click="handleDeleteCommentChange(commentItem.id)"></wd-icon>
                                </view>
                            </wd-steps>
                            <wd-textarea v-if="hasPermission('project:Comment:insert')" type="textarea" prop="summarize" clearable no-border auto-height v-model="dataItem.content" :placeholder="'评论' + dataItem.username + '的技术支持日报'" />
                            <view class="footer" v-if="hasPermission('project:Comment:insert')">
                                <wd-button type="primary" size="small" @click="handleCommentSubmit" block>提交</wd-button>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <wd-loadmore :state="state" @reload="getDataList" />

            <wd-backtop :bottom="110" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', height: 'calc(100vh - 400rpx)' }">
            <wd-status-tip image="../../static/search.png" tip="暂无技术支持日报" />
        </view>

        <wd-fab v-if="hasPermission('project:DailyReport:insert')" draggable :zIndex="9" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleAddTechnicalsupportdailyChange('/mePages/addtechnicalsupportdaily/Index')"></wd-fab>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" custom-class="popupWrap" v-model="prjShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="model.fuzzy" placeholder="请输入项目名称" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 520rpx);">
                <wd-radio-group v-model="model.pid" shape="dot" @change="handleCheckboxSelectChange">
                    <wd-radio v-for="(item, index) in model.prjDataList" :key="index" :value="item.id" class="radioCellWrap">{{ item.proname }}</wd-radio>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
		
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" custom-class="popupWrap" v-model="userShow" position="left" @close="handleUserCloseChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="model.userFuzzy" placeholder="请输入用户名称" placeholder-left cancel-txt="搜索" @search="handleSearchUserFuzzyChange" @cancel="handleSearchUserFuzzyChange" @clear="handleClearUserFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled :refresher-triggered="userTriggered" @refresherrefresh="handleScrollUserRefreshChange" @scrolltolower="handleScrolltolowerUserChange" style="height: calc(100vh - 510rpx);">
		        <wd-radio-group v-model="model.checkedUser" shape="dot" @change="handleRadioSelectUserChange">
		            <wd-radio v-for="(item, index) in model.userDataList" :key="index" :value="item.id" class="radioCellWrap">{{ item.username }}</wd-radio>
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
    z-index: 99;
    background-color: #FFFFFF;
    // 保证内联元素正确换行
    box-sizing: border-box;
    // 可选：微阴影让固定区更明显
    // box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}

.footer {
    margin-top: 40rpx;
}

.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left{
        width: calc(100% - 270rpx);
    }
}

.radioCellWrap {
    padding: 10rpx 20rpx !important;
}

:deep(.wd-step) {
    width: calc(100% - 44rpx) !important;
}

// :deep(.wd-step__description) {
//     width: calc(100% - 40rpx) !important;
//     word-wrap: break-word !important;
// }

:deep(.wd-step__description) {
    word-wrap: break-word !important;
    width: calc(100vw - 260rpx) !important;
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

.canvasHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
	
	:deep(.wd-radio__label) {
		text-align: center !important;
	}
	
	:deep(.wd-cell__wrapper) {
		padding: 0 !important;
	}
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

:deep(.wd-datetime-picker__cell) {
	background: transparent !important;
}
</style>
