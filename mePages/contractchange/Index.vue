<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission, getSystemDate } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetContractchangeDataList, fetchDeleteContractchangeInfo } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const activeTab = ref<number>(-1);

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

const defaultValue = ref<any>([Date.now() - 1000 * 60 * 60 * 24 * 7, Date.now()])

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

// const options = ref<any>(hasPermission('project:Meeting:delete') ? [
//     {
//         text: '删除',
//         style: {
//             backgroundColor: '#dd524d'
//         }
//     }
// ] : []);

const options = ref<any>([]);

const dataForm = reactive<{
    page: number;
    limit: number;
    fuzzy: string;
    dates: any;
}>({
    page: 1,
    limit: 100,
    fuzzy: '',
    dates: [],
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
    getDataList();
}

// 选择时间
function handleConfirmDatesChange({ value }: { value: any }) {
    console.log('value', value);
    dataForm.page = 1;
    getDataList();
}

// 清除时间
function handleClearDateChange({ value }: { value: any }) {
	console.log('value', value);
    dataForm.dates = [];
    dataForm.page = 1;
    getDataList();
}

// 获取合同变更列表信息
async function getDataList() {
    if (!hasPermission('project:Change:Contract:select')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = { page: dataForm.page, limit: dataForm.limit };
		if (activeTab.value !== -1) {
		    queryParams['execute'] = activeTab.value;
		}
		if (dataForm.fuzzy) {
		    queryParams['fuzzy'] = dataForm.fuzzy.trim();
		}
        if (dataForm.dates && dataForm.dates.length > 0) {
            queryParams['startTime'] = getSystemDate(0, dataForm.dates[0]);
			queryParams['endTime'] = getSystemDate(0, dataForm.dates[1]);
        }
        const data = await fetchGetContractchangeDataList(queryParams);
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取合同变更列表失败', err);
        state.value = 'error';
    }
}

// 删除合同变更
async function handleDeleteChange(id: number) {
    if (!hasPermission('project:Meeting:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该合同变更吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeleteContractchangeInfo(id);
            dataForm.page = 1;
            getDataList();
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (err) {
        console.error('删除合同变更失败', err);
    }
}

// 合同变更
function handleAddContractchangeChange(url: string) {
    uni.navigateTo({
        url,
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
    uni.$on('refreshContractchangeList', getDataList); // 监听刷新事件
});

onReady(() => {
    recalcTopFixedHeight();
})

onUnload(() => {
    uni.$off('refreshContractchangeList', getDataList); // 页面销毁时解绑
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
            <wd-navbar left-arrow title="合同变更列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
			<wd-search v-model="dataForm.fuzzy" placeholder="请输入名称" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
			
			<view :style="{ background: isDark ? '#323233' : '#ffffff', padding: '15rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100vw - 30rpx)' }">
				<wd-radio-group v-model="activeTab" shape="button" custom-class="headerRadioWrap" @change="handleSearchChange">
					<wd-radio :value="-1">全部</wd-radio>
					<wd-radio :value="0">未执行</wd-radio>
					<wd-radio :value="1">执行成功</wd-radio>
					<wd-radio :value="2">执行失败</wd-radio>
				</wd-radio-group>
			</view>
            <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100vw' }">
                <wd-datetime-picker type="date" :z-index="9999" v-model="dataForm.dates" :default-value="defaultValue" align-right label="查询日期" label-width="80px" custom-style="width: calc(100vw - 40rpx);" @confirm="handleConfirmDatesChange" />
				<wd-button v-if="dataForm.dates && dataForm.dates.length > 0" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearDateChange"></wd-button>
			</view>
        </view>

        <view v-if="dataList.length > 0">
            <uni-swipe-action>
                <uni-swipe-action-item class="list-item" v-for="(dataItem, index) in dataList" :key="index" :right-options="options" @click="handleDeleteChange(dataItem.id)">
                    <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
                        <view style="padding: 20rpx;">
							<wd-cell title="合同编号" custom-class="cellClass">
							    <wd-text bold :text="dataItem.connum" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
							</wd-cell>
							<wd-cell title="执行状态" custom-class="cellClass">
								<wd-tag :type="dataItem.execute === 0 ? 'primary' : dataItem.execute === 1 ? 'success' : dataItem.execute === 2 ? 'danger' : 'default'" round>
									{{ dataItem.execute === 0 ? '未执行' : dataItem.execute === 1 ? '执行成功' : dataItem.execute === 2 ? '执行失败' : '未知' }}
								</wd-tag>
							</wd-cell>
							<wd-cell title="执行时间" custom-class="cellClass">
							    <wd-text bold :text="dataItem.edbtime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
							</wd-cell>
							<wd-cell title="创建人" custom-class="cellClass">
							    <wd-text bold :text="dataItem.username" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
							</wd-cell>
							<wd-cell title="创建时间" custom-class="cellClass">
							    <wd-text bold :text="dataItem.dbtime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
							</wd-cell>
                        </view>
                    </view>
                </uni-swipe-action-item>
            </uni-swipe-action>

            <wd-loadmore :state="state" @reload="getDataList" />

            <wd-backtop :bottom="110" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-status-tip image="../../static/search.png" tip="暂无合同变更" />
        </view>

        <wd-fab draggable v-if="hasPermission('project:Change:Contract:insert')" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleAddContractchangeChange('/mePages/addcontractchange/Index')"></wd-fab>
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

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}

.wot-theme-dark {
	.headerRadioWrap {
	    display: flex !important;
	    justify-content: space-between !important;
	    align-items: center !important;
	    width: 100% !important;
	    background: #323233 !important;
	    border-radius: 20px !important;
	
	    .wd-radio {
	        width: 25% !important;
	        margin-right: 0 !important;
	    }
	
	    :deep(.wd-radio__label) {
	        width: 100% !important;
	        text-align: center !important;
	        // background: transparent !important;
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
}

.wot-theme-light {
	.headerRadioWrap {
	    display: flex !important;
	    justify-content: space-between !important;
	    align-items: center !important;
	    width: 100% !important;
	    background: #F5F5F5 !important;
	    border-radius: 20px !important;
	
	    .wd-radio {
	        width: 25% !important;
	        margin-right: 0 !important;
	    }
	
	    :deep(.wd-radio__label) {
	        width: 100% !important;
	        text-align: center !important;
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
}
</style>
