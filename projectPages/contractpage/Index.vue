<script setup lang="ts">
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMessage } from 'wot-design-uni';
import { hasPermission } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjContractDataList, fetchDeletePrjContractInfo } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const options = ref<any>(hasPermission('project:Contract:delete') ? [
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

// 获取项目列表信息
async function getDataList() {
    if (!hasPermission('project:Contract:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无合同查询权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetPrjContractDataList({ page: dataForm.page, limit: dataForm.limit, fuzzy: dataForm.fuzzy });
        dataList.value = dataList.value.concat(data.list);
        dataForm.total = Number(data.total);
        if (dataList.value.length < dataForm.total) {
            dataForm.state = 'loadmore';
        } else {
            dataForm.state = 'finished';
        }
    } catch (err) {
        console.error('获取合同列表失败', err);
    }
}

// 拨打电话
function handleMakePhoneNumber(phoneNumber: string) {
    uni.makePhoneCall({
        phoneNumber
    })
}

// 新增、修改合同
const handleJumpChange = (url: string) => {
    uni.navigateTo({
        url
    });
}

// 删除合同
async function handleDeleteContractChange(id: number) {
    // if (!hasPermission('project:Contract:delete')) {
    //     uni.showToast({
    //         icon: 'none',
    //         title: '暂无合同删除权限, 请联系管理员',
    //         duration: 1500
    //     })
    //     return
    // }
    // try {
    //     message
    //     .confirm({
    //         msg: '确定要删除该合同吗？',
    //         title: '提示',
    //         confirmButtonProps: {
    //             type: 'error',
    //         },
    //     })
    //     .then(async () => {
    //         const data = await fetchDeletePrjContractInfo(id);
    //         uni.showToast({
    //             icon: "none",
    //             title: "删除合同成功",
    //             duration: 1500,
    //             complete: async () => {
    //                 await getDataList();
    //             }
    //         })
    //     })
    //     .catch(() => {
    //         console.log('点击了取消按钮');
    //     });
    // } catch (error) {
    //     console.error('删除合同失败', error);
    // }
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
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
    uni.$on('refreshListContract', getDataList); // 监听刷新事件
});

onReady(() => {
    recalcTopFixedHeight();
})

onUnload(() => {
    uni.$off('refreshListContract', getDataList); // 页面销毁时解绑
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
            <wd-navbar left-arrow title="合同列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
            <wd-search v-model="dataForm.fuzzy" placeholder="请输入合同名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
                cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
        </view>

        <view v-if="dataList.length > 0">
            <uni-swipe-action>
                <uni-swipe-action-item v-for="(dataItem, index) in dataList" :key="index" :right-options="options" @click="handleDeleteContractChange(dataItem.id)">
                    <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
                        <view style="padding: 20rpx;">
                            <view class="prjInfoHeader">
                                <view class="left">
                                    <wd-text bold :text="dataItem.contractname" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                </view>
                                <view class="right">
                                    <!-- <wd-icon v-if="hasPermission('project:Contract:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addcontract/Index?id=' + dataItem.id)"></wd-icon> -->
                                </view>
                            </view>

                            <view @click="handleJumpChange('/projectPages/contractdetail/Index?id=' + dataItem.id)">
                                <wd-cell title="合同编号" icon="list" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.contractnum" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="商务联系人" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                    <wd-text v-if="dataItem.businessinfo" :text="' ' + dataItem.businessinfo" type="warning" decoration="underline" @click.stop="handleMakePhoneNumber(dataItem.businessinfo)" />
                                </wd-cell>

                                <wd-cell title="项目数" icon="transfer" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.projectCount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>
								
								<wd-cell title="备注" icon="note" custom-class="cellClass" v-if="dataItem.notes">
								    <wd-text bold :text="dataItem.notes" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
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
                    </view>
                </uni-swipe-action-item>
            </uni-swipe-action>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)',  margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无合同列表" />
        </view>

        <!-- <wd-fab v-if="hasPermission('project:Contract:insert')" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleJumpChange('/projectPages/addcontract/Index')"></wd-fab> -->

        <wd-backtop :bottom="105" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
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

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}
</style>