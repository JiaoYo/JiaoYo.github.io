<script lang="ts" setup>
import { throttle } from "@/utils/debounce";
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission, getSystemDate } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetMeetingMinutesDataList, fetchDeleteMeetingMinutesInfo } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const clickLock = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const mtypeShow = ref<boolean>(false);

const userId = ref<number>(uni.getStorageSync('userId'));

const userType = ref<number>(uni.getStorageSync('usertype'));

const mettingminutesInfo: Record<number, string> = {
    0: '技术部每日例会',
    1: '技术部周例会',
    2: '研发周例会(网络安全)',
    3: '研发周例会(数据通讯)',
    4: '生产部周例会',
    5: '销售周例会',
    6: '管理层周例会'
};

const getFilteredMeetingTypes = (type: number): { label: string, value: number }[] => {
    const allTypes = [
        { value: -1, label: '全部' },
        { value: 0, label: '技术部每日例会' },
        { value: 1, label: '技术部周例会' },
        { value: 2, label: '研发周例会(网络安全)' },
        { value: 3, label: '研发周例会(数据通讯)' },
        { value: 4, label: '生产部周例会' },
        { value: 5, label: '销售周例会' },
        { value: 6, label: '管理层周例会' }
    ];

    if (type === 0 || type === 4) return allTypes; // 全部

    const filterMap: any = {
        0: [0, 1, 2, 3, 4, 5, 6],
        1: [5],
        2: [0, 1],
        3: [1],
        4: [0, 1, 2, 3, 4, 5, 6],
        5: [2, 3],
        6: [4]
    };

    return type === 0 || type === 4 ? allTypes.filter(item => item.value === -1 || (filterMap[type]?.includes(item.value))) : allTypes.filter(item => (filterMap[type]?.includes(item.value)));
};

const mettingminutesColumns = ref<{ label: string, value: number }[]>(getFilteredMeetingTypes(userType.value))

const allMettingminutesColumns = ref<{ label: string, value: number }[]>((getFilteredMeetingTypes(userType.value)))

console.log('mettingminutesColumns', mettingminutesColumns.value);

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

const defaultValue = ref<number>(Date.now())

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const options = ref<any>(hasPermission('project:Meeting:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const dataForm = reactive<{
    page: number;
    limit: number;
    fuzzy: string;
    dates: any;
    mtype: number;
    mtypeName: string;
}>({
    page: 1,
    limit: 50,
    fuzzy: '',
    dates: '',
    mtype: userType.value === 0 || userType === 4 ? -1 : mettingminutesColumns.value[0].value,
    mtypeName: ''
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

// 选择时间
function handleConfirmDatesChange({ value }: { value: any }) {
    console.log('value', value);
    dataForm.page = 1;
    getDataList();
}

// 清除时间
function handleClearDateChange() {
    dataForm.dates = '';
    dataForm.page = 1;
    getDataList();
}

// 打开弹出框
function handleLinkTypeShowChange() {
    mtypeShow.value = true;
}

// 关闭弹出层
function handleCloseChange() {
    mtypeShow.value = false;
}

// 选择项目
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const mettingminutesObj = mettingminutesColumns.value.find((item: any) => value === item.value);
    mtypeShow.value = false;
    dataForm.page = 1;
    getDataList();
}

// 清除
function handleClearFuzzyChange() {
    dataForm.mtypeName = "";
    mettingminutesColumns.value = allMettingminutesColumns.value;
}

// 搜索
function handleSearchFuzzyChange() {
    if (dataForm.mtypeName) {
        mettingminutesColumns.value = allMettingminutesColumns.value.filter((item: any) => item.label.toLocaleLowerCase().includes(dataForm.mtypeName.toLocaleLowerCase()));
    } else {
        mettingminutesColumns.value = allMettingminutesColumns.value;
    }
}

// 获取会议纪要列表信息
const getDataList =  throttle(async () => {
    if (!hasPermission('project:Meeting:select')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = { page: dataForm.page, limit: dataForm.limit };
        if (dataForm.mtype !== -1) {
            queryParams['mtype'] = dataForm.mtype;
        }
        if (dataForm.dates) {
            queryParams['dates'] = getSystemDate(0, dataForm.dates);
        }
        const data = await fetchGetMeetingMinutesDataList(queryParams);
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取会议纪要列表失败', err);
        state.value = 'error';
    }
}, 1000, { leading: true, trailing: true })

// 删除会议纪要
async function handleDeleteChange(id: number) {
    if (!hasPermission('project:Meeting:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该会议纪要吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeleteMeetingMinutesInfo(id);
            dataForm.page = 1;
            getDataList();
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (err) {
        console.error('删除会议纪要失败', err);
    }
}

// 会议纪要
function handleAddMeetingminutesChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false;
		}
    });
}

// 会议纪要详情
function handleJumpPageChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false;
		}
    });
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
    getDataList();
    uni.$on('refreshListPrjMettingmunutes', getDataList); // 监听刷新事件
});

onReady(() => {
    recalcTopFixedHeight();
})

onUnload(() => {
    uni.$off('refreshListPrjMettingmunutes', getDataList); // 页面销毁时解绑
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
            <wd-navbar left-arrow title="会议纪要列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
                <template #right v-if="hasPermission('project:Meeting:select')">
                    <wd-icon name="filter" @click.stop="handleLinkTypeShowChange"></wd-icon>
                </template>
            </wd-navbar>

            <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100vw' }">
                <wd-datetime-picker type="date" :z-index="9999" v-model="dataForm.dates" :default-value="defaultValue" align-right label="日期选择" label-width="80px" @confirm="handleConfirmDatesChange" custom-style="width: calc(100vw - 40rpx)" />
                <wd-button v-if="dataForm.dates" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearDateChange"></wd-button>
            </view>
        </view>

        <!-- <wd-search v-model="model.prjName" custom-class="wdSearchContainer" disabled placeholder="请选择项目" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->

        <!-- <wd-search v-model="model.prjName" custom-class="wdSearchContainer" placeholder="请输入会议纪要内容" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->

        <view v-if="dataList.length > 0">
            <uni-swipe-action>
                <uni-swipe-action-item class="list-item" v-for="(dataItem, index) in dataList" :key="index" :right-options="options" @click="handleDeleteChange(dataItem.id)">
                    <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
                        <view style="padding: 20rpx;">
                            <view class="prjInfoHeader">
                                <view class="left">
                                    <wd-text bold :text="dataItem.mtopic" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
                                    <!-- <wd-text bold :text="dataItem.mdbtime.substring(0, 10) + '会议纪要'" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" /> -->
                                </view>
                                <view class="right">
                                    <wd-icon v-if="hasPermission('project:Meeting:update') && userId === dataItem.creater" name="edit-outline" size="18px" @click.stop="handleAddMeetingminutesChange('/mePages/addmeetingminutes/Index?id=' + dataItem.id)"></wd-icon>
                                    <!-- <wd-text :text="dataItem.dbtime" size="14px" :lines="1" /> -->
                                </view>
                            </view>
                            <view @click="handleJumpPageChange('/mePages/meetingminutesinfo/Index?id=' + dataItem.id)">
                                <!-- <view style="margin-top: 20rpx; font-size: 28rpx;">标题:</view> -->
                                <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                                <!-- <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataItem.mtopic }}</view> -->
                                <view style="margin: 10rpx 0; font-size: 28rpx;">会议类型:</view>
                                <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ mettingminutesInfo[dataItem.mtype] }}</view>
                                <view style="margin: 10rpx 0; font-size: 28rpx;">会议时间:</view>
                                <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                                <view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;">{{ dataItem.mdbtime }}</view>
                                <view style="margin-top: 20rpx; font-size: 28rpx;">创建者 / 时间:</view>
                                <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                                <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataItem.username + ' / ' + dataItem.dates }}</view>
                                <!-- <view style="margin-top: 20rpx; font-size: 28rpx;">创建时间:</view> -->
                                <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                                <!-- <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataItem.dates }}</view> -->
                                <!-- <view style="margin: 10rpx 0; font-size: 28rpx;">下周计划:</view>
                                <view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataItem.content3.replace(/\n/g, '<br />')"></view> -->
                            </view>
                        </view>
                    </view>
                </uni-swipe-action-item>
            </uni-swipe-action>

            <wd-loadmore :state="state" @reload="getDataList" />

            <wd-backtop :bottom="hasPermission('project:Meeting:insert') ? 110 : 40" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-status-tip image="../../static/search.png" tip="暂无会议纪要" />
        </view>

        <wd-fab v-if="hasPermission('project:Meeting:insert')" :disabled="clickLock" position="right-bottom" draggable :gap="{ bottom: 40 }" :z-index="9" :expandable="false" @click="handleAddMeetingminutesChange('/mePages/addmeetingminutes/Index')"></wd-fab>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" custom-class="popupWrap" v-model="mtypeShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.mtypeName" placeholder="请输入会议类型" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

            <scroll-view scroll-y style="height: calc(100vh - 340rpx);">
                <wd-radio-group v-model="dataForm.mtype" shape="dot" @change="handleCheckboxSelectChange">
                    <wd-radio v-for="(item, index) in mettingminutesColumns" :key="index" :value="item.value" class="radioCellWrap">{{ item.label }}</wd-radio>
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
    /* 保证内联元素正确换行 */
    box-sizing: border-box;
    /* 可选：微阴影让固定区更明显 */
    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
}

.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left{
        width: calc(100% - 100rpx);
    }
}

.radioCellWrap {
    padding: 10rpx 20rpx !important;
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}

:deep(.wd-datetime-picker__cell) {
	.wd-cell__wrapper {
		padding-right: 0 !important;
	}
}
</style>
