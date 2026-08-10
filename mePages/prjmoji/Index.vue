<script lang="ts" setup>
import { throttle } from "@/utils/debounce";
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { copyText } from '@/utils/copyText';
import { hasPermission } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjDataList, fetchDeletePrjmojiInfo, fetchGetPrjmojiDataList } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const prjShow = ref<boolean>(false);

const clickLock = ref<boolean>(false);

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

const options = ref<any>(hasPermission('project:moji:delete') ? [
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
}>({
    page: 1,
    limit: 50,
});

const model = reactive<{
    page: number;
    total: number;
    pid: number;
    fuzzy: string;
    prjName: string;
    prjDataList: any;
}>({
    page: 1,
    total: 0,
    pid: 0,
    fuzzy: '',
    prjName: '',
    prjDataList: []
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
        const data = await fetchGetPrjDataList({ page: model.page, limit: 50, fuzzy: model.fuzzy });
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

// 获取气象信息列表信息
const getDataList =  throttle(async () => {
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = { page: dataForm.page, limit: dataForm.limit };
        if (model.pid) {
            queryParams['pid'] = model.pid;
        }
		if (model.fuzzy) {
		    queryParams['fuzzy'] = model.fuzzy;
		}
        const data = await fetchGetPrjmojiDataList(queryParams);
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取气象信息列表失败', err);
        state.value = 'error';
    }
}, 1000, { leading: true, trailing: true })

// 删除气象信息
async function handleDeleteChange(item: any, index: number) {
    console.log('item', item);
    console.log('index', index);
    try {
        message
        .confirm({
            msg: '确定要删除该气象信息吗?',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjmojiInfo(item.id);
            dataForm.page  = 1;
            getDataList();
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (err) {
        console.error('删除气象信息失败', err);
    }
}

// 气象信息
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

// 复制
async function handleCopyChange(val: string) {
    try {
        await copyText(val);
        uni.showToast({ title: '复制成功', icon: 'success' });
    } catch (err) {
        if (err instanceof Error) {
            uni.showToast({ title: err.message, icon: 'none' });
        }
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

onLoad(async(options: any) => {
    model.pid = options.pid;
	model.fuzzy = options.pname ? decodeURIComponent(options.pname) : '';
	await getPrjDataList();
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
            <wd-navbar left-arrow title="气象信息" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
                <template #right v-if="hasPermission('project:Info:select')">
                    <wd-icon name="filter" @click.stop="handleLinkPrjShowChange"></wd-icon>
                </template>
            </wd-navbar>

            <wd-search v-model="model.prjName" disabled placeholder="请选择项目" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <!-- <wd-search v-model="dataForm.username" custom-class="wdSearchContainer" placeholder="请输入技术支持日报内容" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->
        </view>

        <view v-if="dataList.length > 0">
			<uni-swipe-action>
				<uni-swipe-action-item v-for="(dataItem, dataIndex) in dataList" :key="dataIndex" :right-options="options" @click="handleDeleteChange(dataItem, dataIndex)">
					<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: dataIndex === dataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
						<view style="padding: 20rpx;">
							<view class="prjInfoHeader">
								<view class="left">
									<wd-text bold :text="dataItem.cusname" size="14px" :lines="5" :color="isDark ? '#ffffff' : '#000000'" />
								</view>

								<view class="right">
									<wd-icon v-if="hasPermission('project:moji:update')" name="edit-outline" size="18px" @click.stop="handleJumpPageChange('/mePages/addprjmoji/Index?id=' + dataItem.id)"></wd-icon>
								</view>
							</view>
							
							<view>
								<wd-cell title="气象信息token" custom-class="cellClass">
									<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 10rpx;">
										<wd-text bold :text="dataItem.token" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
										<wd-icon v-if="dataItem.token" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(dataItem.token)" />
									</view>
								</wd-cell>
								<wd-cell title="气象信息password" custom-class="cellClass">
									<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 10rpx;">
										<wd-text bold :text="dataItem.passward" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
										<wd-icon v-if="dataItem.passward" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(dataItem.passward)" />
									</view>
								</wd-cell>
								<wd-cell title="经/纬度" custom-class="cellClass">
									<wd-text bold :text="dataItem.longitude + ' / ' + dataItem.latitude" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>
								<wd-cell title="合同项目名称" custom-class="cellClass">
									<wd-text bold :text="dataItem.pro" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>
								<wd-cell title="过期时间" custom-class="cellClass">
									<wd-text bold :text="dataItem.expiare" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>
								<wd-cell title="是否过期" custom-class="cellClass">
									<wd-tag :type="dataItem.status === 0 ? 'success' : dataItem.status === 1 ? 'danger' : 'default'" round>
										{{ dataItem.status === 0 ? '正常' : dataItem.status === 1 ? '异常' : '未知' }}
									</wd-tag>
								</wd-cell>
								<wd-cell title="JSON格式" custom-class="cellClass">
									<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 10rpx;">
										<wd-text bold :text="dataItem.jsonfmt" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
										<wd-icon v-if="dataItem.jsonfmt" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(dataItem.jsonfmt)" />
									</view>
								</wd-cell>
								<wd-cell title="CSV格式" custom-class="cellClass">
									<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 10rpx;">
										<wd-text bold :text="dataItem.csvfmt" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
										<wd-icon v-if="dataItem.csvfmt" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(dataItem.csvfmt)" />
									</view>
								</wd-cell>
								<wd-cell title="备注" custom-class="cellClass">
									<wd-text bold :text="dataItem.notes" size="14px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
								</wd-cell>
							</view>
						</view>
					</view>
				</uni-swipe-action-item>
			</uni-swipe-action>

            <wd-loadmore :state="state" @reload="getDataList" />

            <wd-backtop :bottom="hasPermission('project:moji:insert') ? 110 : 40" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', height: 'calc(100vh - 400rpx)' }">
            <wd-status-tip image="../../static/search.png" tip="暂无气象信息数据" />
        </view>

        <wd-fab v-if="hasPermission('project:moji:insert')" :disabled="clickLock" draggable :zIndex="9" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleJumpPageChange('/mePages/addprjmoji/Index')"></wd-fab>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" custom-class="popupWrap" v-model="prjShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="model.fuzzy" placeholder="请输入项目名称" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 350rpx);">
                <wd-radio-group v-model="model.pid" shape="dot" @change="handleCheckboxSelectChange">
                    <wd-radio v-for="(item, index) in model.prjDataList" :key="index" :value="item.id" class="radioCellWrap">{{ item.proname }}</wd-radio>
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
	margin-bottom: 10rpx;
	padding-left: 10rpx;

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

:deep(.cellClass) {
    padding: 0 !important;
	
    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
	
	.wd-cell__body {
		overflow: hidden !important;
		word-break: break-all !important;
	}
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}
</style>
