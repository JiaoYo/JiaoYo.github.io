<script setup lang="ts">
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMessage } from 'wot-design-uni';
import { hasPermission } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjContractDataList, fetchGetPrjDeviceDataList, fetchDeletePrjDeviceInfo } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();
const { themeVars, theme } = useTheme();
const message = useMessage();

const contractShow = ref<boolean>(false);
const triggered = ref<boolean>(false);
const contractIdNameObj: Record<number, string> = {};
const isDark = computed(() => theme.value === 'dark');

const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const options = ref<any>(hasPermission('project:Device:delete') ? [
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

const model = reactive<{
    page: number;
    total: number;
    fuzzy: string;
    contractName: string;
    checkedPid: any;
    contractDataList: any;
}>({
    page: 1,
    total: 0,
    fuzzy: '',
    contractName: '',
    checkedPid: [],
    contractDataList: []
})

// 返回上个界面
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
    contractShow.value = true;
}

// 清除
function handleClearFuzzyChange() {
    model.page = 1;
    getContractDataList();
}

// 搜索
function handleSearchFuzzyChange() {
    model.page = 1;
    getContractDataList();
}

// 获取项目分页数据
async function getContractDataList() {
    if (!hasPermission('project:Info:select')) {
        return
    }
    if (model.page === 1) {
        model.contractDataList = [];
    }
    try {
        const data = await fetchGetPrjContractDataList({ page: model.page, limit: 100, fuzzy: model.fuzzy });
        model.total = Number(data.total);
        model.contractDataList = model.contractDataList.concat(data.list);
        model.contractDataList.forEach((item: any) => {
            contractIdNameObj[item.id] = item.contractname;
        });
    } catch (error) {
        console.error('获取项目分页数据失败', error);
    }
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    model.page = 1;
    getContractDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.contractDataList.length < model.total) {
        model.page++;
        getContractDataList();
    }
}

// 关闭弹出层
function handleCloseChange() {
    contractShow.value = false;
}

// 选择项目
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    const names = model.checkedPid.map((id: any) => contractIdNameObj[id]).filter(Boolean);
    model.contractName = names.join(", ");
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

// 清空选择的合同
function handleClearContractNameChange() {
    model.checkedPid = [];
    model.contractName = "";
    dataForm.page = 1;
    getDataList();
}

// 获取合同设备列表信息
async function getDataList() {
    if (!hasPermission('project:Device:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无合同设备查询权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = {
            page: dataForm.page,
            limit: dataForm.limit,
        };
        if (model.checkedPid.length > 0) {
            queryParams['pids'] = model.checkedPid.join(",");
        }
        if (dataForm.fuzzy) {
            queryParams['fuzzy'] = dataForm.fuzzy;
        }
        const data = await fetchGetPrjDeviceDataList(queryParams);
        dataList.value = dataList.value.concat(data.list);
        dataForm.total = Number(data.total);
        if (dataList.value.length < dataForm.total) {
            dataForm.state = 'loadmore';
        } else {
            dataForm.state = 'finished';
        }
        recalcTopFixedHeight();
    } catch (err) {
        console.error('获取合同设备列表失败', err);
    }
}

// 新增、修改合同设备
const handleJumpChange = (url: string) => {
    uni.navigateTo({
        url
    });
}

// 删除合同设备（注释掉了权限逻辑，保留函数）
async function handleDeleteContractChange(id: number) {
    // if (!hasPermission('project:Device:delete')) {
    //     uni.showToast({
    //         icon: 'none',
    //         title: '暂无合同设备删除权限, 请联系管理员',
    //         duration: 1500
    //     })
    //     return
    // }
    // try {
    //     message
    //     .confirm({
    //         msg: '确定要删除该合同设备吗？',
    //         title: '提示',
    //         confirmButtonProps: {
    //             type: 'error',
    //         },
    //     })
    //     .then(async () => {
    //         const data = await fetchDeletePrjDeviceInfo(id);
    //         uni.showToast({
    //             icon: "none",
    //             title: "删除合同设备成功",
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
    //     console.error('删除合同设备失败', error);
    // }
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
    getContractDataList();
    getDataList();
    // 监听页面自定义事件
    uni.$on('refreshListContractDevice', getDataList);
});

onReady(() => {
    recalcTopFixedHeight();
})

onUnload(() => {
    uni.$off('refreshListContractDevice', getDataList);
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

// pull down / reach bottom 事件（保留）
onPullDownRefresh(() => {
    dataForm.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading();
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

        <!-- 顶部固定区（真实渲染并固定在顶部） -->
        <view class="topFixedWrap">
            <wd-navbar left-arrow title="设备列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
                <!-- <template #right v-if="hasPermission('project:Device:select')">
                    <wd-icon name="filter" @click.stop="handleLinkPrjShowChange"></wd-icon>
                </template> -->
            </wd-navbar>

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入设备名称" placeholder-left
                :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" cancel-txt="搜索" @search="handleSearchChange"
                @cancel="handleSearchChange" @clear="handleClearChange" />

			<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '10rpx 20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0 10rpx' }">	
				<wd-input clearable disabled no-border v-model="model.contractName" placeholder="请选择合同" custom-style="width: calc(100vw - 40rpx)">
					<template #suffix>
						<wd-button icon="link" size="small" @click.stop="handleLinkPrjShowChange">合同信息</wd-button>
					</template>
				</wd-input>
				
				<wd-icon v-if="model.contractName" size="30rpx" name="close-circle" @click.stop="handleClearContractNameChange"></wd-icon>
            </view>
        </view>

        <!-- 正文内容区 -->
        <view v-if="dataList.length > 0">
			<uni-swipe-action>
				<uni-swipe-action-item v-for="(dataItem, dataIndex) in dataList" :key="dataIndex" :right-options="options" @click="handleDeleteContractChange(dataItem.id)">
					<view
					    :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
					    <view style="padding: 5rpx;">
					        <wd-cell :title="dataItem.devname" custom-class="cellClass" custom-title-class="cellLabelTitle"
					            ellipsis center>
					            <wd-icon v-if="hasPermission('project:Device:update')" name="edit-outline" size="18px"
					                @click.stop="handleJumpChange('/projectPages/addprojectdevice/Index?pid=' + dataItem.id + '&id=' + dataItem.id)"></wd-icon>
					        </wd-cell>
					        <view @click="handleJumpChange('/projectPages/contractdeviceinfo/Index?id=' + dataItem.id)">
					            <wd-cell title="设备型号" custom-class="cellClass">
					                <wd-text bold :text="dataItem.devmodel" size="14px"
					                    :color="isDark ? '#ffffff' : '#000000'" />
					            </wd-cell>
					
					            <wd-cell title="是否为我司设备" custom-class="cellClass">
					                <wd-tag plain round
					                    :type="dataItem.devtype === 0 ? 'success' : dataItem.devtype === 1 ? 'danger' : 'default'">
					                    {{ dataItem.devtype === 0 ? '是' : dataItem.devtype === 1 ? '否' : '未知' }}
					                </wd-tag>
					            </wd-cell>
					
					            <wd-cell title="设备数量" custom-class="cellClass">
					                <wd-text bold
					                    :text="dataItem.devunit ? dataItem.devcount + dataItem.devunit : dataItem.devcount"
					                    size="14px" :color="isDark ? '#ffffff' : '#000000'" />
					            </wd-cell>
					
					            <wd-cell title="设备厂家" custom-class="cellClass">
					                <wd-text bold :text="dataItem.devmanu" size="14px"
					                    :color="isDark ? '#ffffff' : '#000000'" />
					            </wd-cell>
					
					            <wd-cell title="创建者/时间" :value="dataItem.username" custom-class="cellClass" ellipsis>
					                <view style="display: flex; flex-direction: column; flex-wrap: wrap;">
					                    <view v-if="dataItem.username"
					                        style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
					                        {{ dataItem.username }}
					                    </view>
					                    <view v-if="dataItem.dbtime"
					                        style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
					                        {{ dataItem.dbtime }}
					                    </view>
					                </view>
					            </wd-cell>
					        </view>
					    </view>
					</view>
				</uni-swipe-action-item>
			</uni-swipe-action>
        </view>

        <view v-else
            :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无合同设备列表" />
        </view>

        <wd-fab v-if="hasPermission('project:Device:insert')" position="right-bottom" :gap="{ bottom: 40 }"
            :expandable="false" @click="handleJumpChange('/projectPages/addprojectdevice/Index')"></wd-fab>

        <wd-backtop :bottom="105" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" custom-class="popupWrap"
            v-model="contractShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="model.fuzzy" placeholder="请输入合同名称" placeholder-left cancel-txt="搜索"
                @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered"
                @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange"
                style="height: calc(100vh - 420rpx);">
                <wd-cell-group border>
                    <wd-checkbox-group v-model="model.checkedPid" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(contractItem, contractIndex) in model.contractDataList" :key="contractIndex"
                            :title="contractItem.contractname" center custom-class="checkboxCellWrap">
                            <wd-checkbox :modelValue="contractItem.id"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>
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

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}

:deep(.cellLabelTitle) {
    font-weight: bolder !important;
}

.radioCellWrap {
    padding: 10rpx 20rpx !important;
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

.checkboxCellWrap {
    :deep(.wd-cell__left) {
        flex: 6 !important;
    }
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}
</style>
