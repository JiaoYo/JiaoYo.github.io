<script setup lang="ts">
import { useMessage } from 'wot-design-uni';
import { reactive, ref, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { onReady, onLoad, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchDeletePrjDispatchContractInfo, fetchGetPrjDispatchContractDataList } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();

const message = useMessage();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const prjForm = reactive({
    id: null
})
const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const options = ref<any>(hasPermission('project:DispatchContact:delete') ? [
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
    total: number;
    state: string;
    fuzzy: string;
}>({
    page: 1,
    limit: 100,
    total: 0,
    state: 'loading',
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

// 获取项目调度联系人列表信息
async function getDataList() {
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetPrjDispatchContractDataList({ page: dataForm.page, limit: dataForm.limit, pid: prjForm.id, fuzzy: dataForm.fuzzy });
        dataList.value = dataList.value.concat(data.list);
        dataForm.total = Number(data.total);
        if (dataList.value.length < dataForm.total) {
            dataForm.state = 'loadmore';
        } else {
            dataForm.state = 'finished';
        }
    } catch (err) {
        console.error('获取项目调度联系人列表失败', err);
    }
}

// 拨打电话
function handleMakePhoneNumber(phoneNumber: string) {
    uni.makePhoneCall({
        phoneNumber
    })
}

// 新增调度联系人
const handleAddPrjDispatchChange = () => {
    uni.navigateTo({
        url: `/projectPages/adddiapatcher/Index?pid=${prjForm.id}`
    });
}

// 修改调度联系人
const handleJumpChange = (url: string) => {
    uni.navigateTo({
        url
    });
}

// 删除项目调度联系人
async function handleDeletePrjDispatcherChange(id: number) {
    if (!hasPermission('project:DispatchContact:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该项目调度联系人吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjDispatchContractInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除项目项目调度联系人成功",
                duration: 1500,
                complete: async () => {
                    dataForm.page = 1;
                    await getDataList();
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('删除项目调度联系人失败', error);
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

onLoad((options: any) => {
    prjForm.id = options.pid;
    getDataList();
});

onReady(() => {
    recalcTopFixedHeight();
})

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
    if (dataList.value.length < dataForm.total) {
        dataForm.page++;
        getDataList();
    } else if (dataList.value.length === dataForm.total) {
        dataForm.state = 'finished';
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="调度联系人" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
        </view>
        <view class="wraper">
            <!-- <wd-search custom-class="wdSearchContainer" v-model="dataForm.fuzzy" placeholder="请输入调度联系人" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
                cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->

            <!-- <wd-gap :bg-color="isDark ? '#000000' : '#F8F9Fa'" height="100rpx" /> -->
            <view v-if="dataList.length > 0">
                <uni-swipe-action>
                    <uni-swipe-action-item class="list-item" v-for="(dataItem, dataIndex) in dataList" :key="dataIndex" :right-options="options" @click="handleDeletePrjDispatcherChange(dataItem.id)">
                        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: dataIndex === dataList.length ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
                            <view style="padding: 20rpx; ">
                                <view class="prjInfoHeader">
                                    <view class="left">
                                        <wd-text bold :text="dataItem.dname" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                    </view>
                                    <view class="right">
                                        <wd-icon v-if="hasPermission('project:DispatchContact:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/adddiapatcher/Index?pid=' + prjForm.id + '&id=' + dataItem.id)"></wd-icon>
                                    </view>
                                </view>
                                <!-- <wd-cell :title="dataItem.dname" custom-class="cellClass">
                                    <wd-icon name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + dataItem.id)"></wd-icon>
                                </wd-cell> -->

                                <wd-cell title="联系方式" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.dcon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="创建者" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.username" size="14px"
                                        :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="创建时间" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.dbtime" size="14px"
                                        :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>
                            </view>
                        </view>
                    </uni-swipe-action-item>
                </uni-swipe-action>
            </view>
            <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
                <wd-status-tip image="../../static/search.png" tip="暂无调度联系人列表" />
            </view>

            <!-- <wd-gap :height="85" /> -->

            <wd-fab draggable position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleAddPrjDispatchChange"></wd-fab>

            <wd-backtop :bottom="105" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
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
        margin-left: 10rpx;
        width: calc(100vw - 190px);
    }

    .right {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0 20rpx;
    }
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}

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

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}
</style>