<script lang="ts" setup>
import { reactive, ref, computed, nextTick, onMounted } from 'vue';
import { onReady, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { showFileActions, getFileNameFromUrl } from '../pection/common';
import { getSystemDate } from '@/utils/index';
import {
    fetchGetNetworkSecurityProductDataListByPage,
    fetchGetNetworkSecurityHardeningRecordDataListByPage,
} from '@/service/networksecurity';

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

// 查询日期默认值（近 7 天）
const defaultValue = ref<any>([Date.now() - 1000 * 60 * 60 * 24 * 7, Date.now()]);

// 升级方式选项 0:直接升级 1:逐级升级
const upgradeTypeOptions = [
    { label: '直接升级', value: 0 },
    { label: '逐级升级', value: 1 }
];

// 已选中的网安产品
const selectedProduct = ref<{ id: number | string | null; name: string }>({ id: null, name: '' });

// 产品选择弹层
const showProductPicker = ref<boolean>(false);
const productKeyword = ref<string>('');
const productList = ref<any[]>([]);
const productLoading = ref<boolean>(false);
const productState = ref<string>('finished');

// 加固记录
const recordList = ref<any[]>([]);
const recordTotal = ref<number>(0);
const recordState = ref<string>('loading');
const recordForm = reactive<{ page: number; limit: number; pid: number | string | null; fuzzy: string; dates: any; upgradeType: any }>({
    page: 1,
    limit: 15,
    pid: null,
    fuzzy: '',
    dates: [],
    // wd-picker 未选择时用 [] 占位，避免 null 导致弹层不初始化选中索引
    upgradeType: [],
});

// 操作步骤详情弹层
const showDetail = ref<boolean>(false);
const detailOperator = ref<string>('');

const topFixedHeight = ref<number>(0);
const scrollTop = ref<number>(0);

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 打开产品选择弹层
function openProductPicker() {
    showProductPicker.value = true;
    if (productList.value.length === 0) {
        searchProductList();
    }
}

// 网安产品模糊查询
async function searchProductList() {
    productLoading.value = true;
    productState.value = 'loading';
    try {
        const data = await fetchGetNetworkSecurityProductDataListByPage({
            page: 1,
            limit: 100,
            fuzzy: productKeyword.value || undefined,
        });
        productList.value = data.list;
        productState.value = 'finished';
    } catch (err) {
        console.error('获取网安产品失败', err);
        productState.value = 'error';
    } finally {
        productLoading.value = false;
    }
}

// 选中网安产品
function selectProduct(item: any) {
    selectedProduct.value = { id: item.id, name: item.pname || item.productName || item.productname || '' };
    showProductPicker.value = false;
    recordForm.pid = selectedProduct.value.id;
    recordForm.page = 1;
    recordForm.fuzzy = '';
    getRecordList();
}

// 清除已选产品
function clearProduct() {
    selectedProduct.value = { id: null, name: '' };
    recordForm.pid = null;
    recordForm.fuzzy = '';
    recordList.value = [];
    recordTotal.value = 0;
    recordState.value = 'loading';
    getRecordList();
}

// 记录模糊搜索
function handleRecordSearch() {
    recordForm.page = 1;
    recordList.value = [];
    getRecordList();
}

// wd-picker 未选择/清除后 modelValue 可能为 [] 或 ''，统一归一化为 undefined
function pickerValue(v: any) {
    if (v === null || v === undefined) return undefined;
    if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined;
    if (v === '') return undefined;
    return v;
}

// 选择/清除升级方式后刷新
function handleUpgradeTypeChange() {
    recordForm.page = 1;
    getRecordList();
}

// 选择查询日期（起止时间）
function handleConfirmDates() {
    recordForm.page = 1;
    getRecordList();
}

// 清除查询日期
function handleClearDates() {
    recordForm.dates = [];
    recordForm.page = 1;
    getRecordList();
}

// 获取网安加固记录
const recordListLoading = ref(false);
let recordPendingReload = false;

// 获取网安加固记录（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
async function getRecordList() {
    if (recordListLoading.value) {
        recordPendingReload = true;
        return;
    }
    recordListLoading.value = true;
    try {
        if (recordForm.page === 1) {
            recordList.value = [];
        }
        const queryParams: any = {
            page: recordForm.page,
            limit: recordForm.limit,
            pid: recordForm.pid || undefined,
            fuzzy: recordForm.fuzzy || undefined,
        };
        if (recordForm.dates && recordForm.dates.length > 0) {
            queryParams['startTime'] = getSystemDate(0, recordForm.dates[0]);
            queryParams['endTime'] = getSystemDate(0, recordForm.dates[1]);
        }
        const upgradeType = pickerValue(recordForm.upgradeType);
        if (upgradeType !== undefined) {
            queryParams['upgradeType'] = upgradeType;
        }
        const data = await fetchGetNetworkSecurityHardeningRecordDataListByPage(queryParams);
        recordList.value = recordList.value.concat(data.list);
        recordTotal.value = Number(data.total);
        if (recordList.value.length < recordTotal.value) {
            recordState.value = 'loadmore';
        } else {
            recordState.value = 'finished';
        }
    } catch (err) {
        console.error('获取网安加固记录失败', err);
        recordState.value = 'error';
    } finally {
        recordListLoading.value = false;
        if (recordPendingReload) {
            recordPendingReload = false;
            getRecordList();
        }
    }
}

// 操作步骤详情
function openDetail(operator: string) {
    detailOperator.value = operator || '';
    showDetail.value = true;
}

// 点击下载文件
function handleFileClick(url: string) {
    if (!url) { uni.showToast({ title: '文件不存在', icon: 'none' }); return; }
    showFileActions({ url, name: getFileNameFromUrl(url) });
}

// 提取文件名(截断显示)
function getFileName(url: string): string {
    if (!url) return '';
    let name = String(url).split('/').pop() || url;
    if (name.includes('?')) name = name.split('?')[0];
    return name.length > 22 ? name.slice(0, 22) + '...' : name;
}

// 格式化时间
function formatDateTime(val: any): string {
    if (!val) return '';
    return String(val).replace('T', ' ').slice(0, 19);
}

// 格式化升级方式
function formatUpgradeType(val: any): string {
    return val == 0 ? '直接升级' : val == 1 ? '逐级升级' : '-';
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
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
    // 兜底：测量失败或高度为 0 时给个保守高度，避免固定搜索栏遮挡列表
    if (topFixedHeight.value === 0) {
        topFixedHeight.value = 220;
    }
}
// 复制操作步骤内容
function copyDetail() {
    const content = detailOperator.value;
    if (!content) {
        uni.showToast({ title: '无内容可复制', icon: 'none' });
        return;
    }
    uni.setClipboardData({
        data: content,
        success: () => {
            uni.showToast({ title: '复制成功', icon: 'success' });
        },
        fail: () => {
            uni.showToast({ title: '复制失败，请手动复制', icon: 'none' });
        }
    });
}
onReady(() => {
    recalcTopFixedHeight();
    getRecordList();
});

// onMounted 再次确保计算一次（兼容 H5 / 搜索框渲染完成后再量高度）
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
    recordForm.page = 1;
    getRecordList();
    setTimeout(() => {
        uni.hideNavigationBarLoading();
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (recordListLoading.value) return; // 在途请求未返回时不翻页，避免跳页
    if (recordList.value.length < recordTotal.value) {
        recordForm.page++;
        getRecordList();
    } else {
        recordState.value = 'finished';
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-message-box />

        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#FFFFFF' }">
            <wd-navbar left-arrow title="网安加固记录" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />

            <!-- 网安产品 查询条件 -->
            <view class="product-select-row" :style="{ background: isDark ? '#1b1b1b' : '#FFFFFF' }" @click="openProductPicker">
                <text class="product-select-label" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">网安产品</text>
                <text class="product-select-value" :class="{ 'is-placeholder': !selectedProduct.name }" :style="{ color: !selectedProduct.name ? (isDark ? '#6A7590' : '#A0AAC2') : (isDark ? '#E8ECF8' : '#1F2A44') }">
                    {{ selectedProduct.name || '全部产品' }}
                </text>
                <text v-if="selectedProduct.id" class="product-select-clear" :style="{ background: isDark ? 'rgba(255,255,255,0.12)' : '#E6EAF2', color: isDark ? '#8a9099' : '#6A7590' }" @click.stop="clearProduct">✕</text>
                <wd-icon name="arrow-right" size="18px" color="#A0AAC2"></wd-icon>
            </view>

            <view class="record-search-wrap" :style="{ background: isDark ? '#1b1b1b' : '#FFFFFF' }">
                <wd-search v-model="recordForm.fuzzy" placeholder="请输入备注和产品名称关键字" cancel-txt="搜索"
                    :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" @search="handleRecordSearch" @cancel="handleRecordSearch" @clear="handleRecordSearch" />
            </view>

            <!-- 查询日期 起止时间 -->
            <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100vw' }">
                <wd-datetime-picker type="date" :z-index="9999" v-model="recordForm.dates" :default-value="defaultValue" align-right label="查询日期" label-width="80px" custom-style="width: calc(100vw - 40rpx);" @confirm="handleConfirmDates" />
                <wd-button v-if="recordForm.dates && recordForm.dates.length > 0" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearDates"></wd-button>
            </view>

            <!-- 升级方式 查询条件 -->
            <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: '100vw' }">
                <wd-picker v-model="recordForm.upgradeType" :columns="upgradeTypeOptions" title="升级方式" label="升级方式" label-width="80px" align-right clearable placeholder="全部方式" :z-index="9999" custom-style="width: calc(100vw - 40rpx);" @confirm="handleUpgradeTypeChange" @clear="handleUpgradeTypeChange" />
            </view>

            <view class="summary-bar">
                <view class="summary-chip" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#f0f1f3', color: isDark ? '#8a9099' : '#4e5969' }">
                    <text class="summary-dot"></text>
                    <text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ recordList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ recordTotal }}</text> 条</text>
                </view>
            </view>
        </view>

        <!-- 加固记录列表 -->
        <view class="page-content">
            <view v-if="recordList.length > 0" class="record-list">
                <view v-for="(item, index) in recordList" :key="index" class="record-card" :class="isDark ? 'dark' : ''">
                    <view class="record-header">
                        <text class="record-name">{{ item.pname || item.productName || item.productname }}</text>
                        <text class="record-time">{{ formatDateTime(item.dbtime) }}</text>
                    </view>
                    <view class="record-body">
                        <view v-if="item.upgradeType !== undefined && item.upgradeType !== null && item.upgradeType !== ''" class="record-row">
                            <text class="row-label">升级方式</text>
                            <text class="row-value">{{ formatUpgradeType(item.upgradeType) }}</text>
                        </view>
                        <view v-if="item.operator" class="record-row" @click="openDetail(item.operator)">
                            <text class="row-label">操作步骤</text>
                            <text class="row-value row-link">点击查看</text>
                        </view>
                        <view v-if="item.downurl" class="record-row" @click="handleFileClick(item.downurl)">
                            <text class="row-label">固件包</text>
                            <view class="row-value row-link">
                                <text class="row-file">{{ getFileName(item.downurl) }}</text>
                                <text class="file-icon">⬇</text>
                            </view>
                        </view>
                        <view v-if="item.vulnscan" class="record-row" @click="handleFileClick(item.vulnscan)">
                            <text class="row-label">漏扫报告</text>
                            <view class="row-value row-link">
                                <text class="row-file">{{ getFileName(item.vulnscan) }}</text>
                                <text class="file-icon">⬇</text>
                            </view>
                        </view>
                        <view v-if="item.username" class="record-row">
                            <text class="row-label">发布人</text>
                            <text class="row-value">{{ item.username }}</text>
                        </view>
                        <view v-if="item.notes" class="record-row">
                            <text class="row-label">备注</text>
                            <text class="row-value">{{ item.notes }}</text>
                        </view>
                    </view>
                </view>
                <wd-loadmore :state="recordState" @reload="getRecordList" />
                <wd-backtop :bottom="110" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
            </view>
            <view v-else class="empty-wrap" :class="isDark ? 'dark' : ''">
                <wd-status-tip image="../../static/search.png" tip="暂无加固记录" />
            </view>
        </view>

        <!-- 产品选择弹层 -->
        <wd-popup :z-index="99" position="bottom" v-model="showProductPicker" custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0; display: flex; flex-direction: column;">
            <view class="popup-header">
                <text class="popup-title">选择网安产品</text>
                <text class="popup-close" @click="showProductPicker = false">✕</text>
            </view>
            <view class="popup-search">
                <wd-search v-model="productKeyword" placeholder="输入产品名称模糊搜索" cancel-txt="搜索"
                    :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" @search="searchProductList" @cancel="searchProductList" @clear="searchProductList" />
            </view>
            <scroll-view scroll-y class="popup-list">
                <view v-if="productList.length > 0">
                    <view v-for="item in productList" :key="item.id" class="product-item" :class="{ active: selectedProduct.id === item.id }" @click="selectProduct(item)">
                        <text class="product-item-name">{{ item.pname || item.productName || item.productname }}</text>
                        <wd-icon v-if="selectedProduct.id === item.id" name="check" size="18px" color="#1890ff"></wd-icon>
                    </view>
                    <wd-loadmore :state="productState" @reload="searchProductList" />
                </view>
                <view v-else class="popup-empty">
                    <text v-if="productLoading">加载中...</text>
                    <text v-else>暂无产品</text>
                </view>
            </scroll-view>
        </wd-popup>

        <!-- 操作步骤详情弹层 -->
        <wd-popup :z-index="100" v-model="showDetail" custom-style="width: 84vw; border-radius: 24rpx; padding: 32rpx 24rpx;">
            <view class="detail-header">
                <text class="detail-title">操作步骤</text>
                <view class="detail-actions">
                    <text class="detail-copy" @click="copyDetail">复制</text>
                    <text class="popup-close" @click="showDetail = false">✕</text>
                </view>
            </view>
            <scroll-view scroll-y class="detail-content">
                <text class="detail-text">{{ detailOperator }}</text>
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
    box-sizing: border-box;
}

/* 已加载/总数统计条（与主站调度统一样式） */
.summary-bar {
    padding: 10rpx 24rpx 14rpx;
}

.summary-chip {
    display: inline-flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 999rpx;
    background: #f7f8fa;
    border: 1rpx solid #f0f1f3;
    font-size: 24rpx;
    color: #4e5969;
}

.summary-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}

.summary-num {
    font-weight: 600;
    color: #1677ff;
    margin: 0 4rpx;
}

/* 产品查询条件 */
.product-select-row {
    display: flex;
    align-items: center;
    padding: 22rpx 24rpx;
    background: #FFFFFF;
    border-bottom: 1rpx solid #F0F3F9;
}

.product-select-label {
    flex-shrink: 0;
    font-size: 28rpx;
    font-weight: 600;
    color: #1F2A44;
    margin-right: 20rpx;
}

.product-select-value {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    color: #1F2A44;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.product-select-value.is-placeholder {
    color: #A0AAC2;
}

.product-select-clear {
    flex-shrink: 0;
    width: 36rpx;
    height: 36rpx;
    line-height: 32rpx;
    text-align: center;
    border-radius: 50%;
    background: #E6EAF2;
    color: #6A7590;
    font-size: 22rpx;
    margin-right: 12rpx;
}

.record-search-wrap {
    background: #FFFFFF;
}

/* 页面内容 */
.page-content {
    padding: 20rpx 24rpx;
    min-height: 60vh;
    box-sizing: border-box;
}

/* 记录卡片 */
.record-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.record-card {
    border-radius: 24rpx;
    background: #FFFFFF;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
    overflow: hidden;
}

.record-card.dark {
    background: #171F31;
    border: 1rpx solid rgba(255, 255, 255, 0.04);
    box-shadow: none;
}

.record-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22rpx 24rpx;
    background: linear-gradient(180deg, #EDF4FF, #D9E8FF);
}

.record-card.dark .record-header {
    background: rgba(46, 107, 255, 0.2);
}

.record-name {
    flex: 1;
    min-width: 0;
    font-size: 30rpx;
    font-weight: 600;
    color: #1F2A44;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.record-card.dark .record-name {
    color: #E8ECF8;
}

.record-time {
    flex-shrink: 0;
    margin-left: 16rpx;
    font-size: 22rpx;
    color: #A0AAC2;
}

.record-body {
    padding: 8rpx 24rpx 20rpx;
}

.record-row {
    display: flex;
    align-items: flex-start;
    padding: 14rpx 0;
    border-bottom: 1rpx dashed #EEF1F6;
}

.record-row:last-child {
    border-bottom: none;
}

.record-card.dark .record-row {
    border-bottom-color: rgba(255, 255, 255, 0.06);
}

.row-label {
    flex-shrink: 0;
    width: 140rpx;
    font-size: 26rpx;
    color: #6A7590;
}

.row-value {
    flex: 1;
    min-width: 0;
    font-size: 26rpx;
    color: #2A3550;
    word-break: break-all;
    line-height: 1.5;
}

.record-card.dark .row-value {
    color: #C6CDE0;
}

.record-card.dark .row-link {
    color: #69b1ff;
}

.row-link {
    color: #1890ff;
    display: flex;
    align-items: center;
}

.row-file {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-icon {
    flex-shrink: 0;
    margin-left: 8rpx;
    font-size: 22rpx;
}

/* 空状态 */
.empty-wrap {
    margin: 40rpx 24rpx;
    padding: 60rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 24rpx;
    background: #FFFFFF;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.empty-wrap.dark {
    background: #171F31;
    border: 1rpx solid rgba(255, 255, 255, 0.04);
    box-shadow: none;
}

.empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
}

.empty-tip {
    font-size: 26rpx;
    color: #A0AAC2;
}

/* 产品选择弹层 */
.popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 32rpx 8rpx;
}

.popup-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1F2A44;
}

.popup-close {
    width: 44rpx;
    height: 44rpx;
    line-height: 40rpx;
    text-align: center;
    border-radius: 50%;
    background: #E6EAF2;
    color: #6A7590;
    font-size: 26rpx;
}

.popup-search {
    padding: 8rpx 16rpx 16rpx;
}

.popup-list {
    flex: 1;
    min-height: 0;
    padding: 0 24rpx;
    box-sizing: border-box;
}

.product-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 16rpx;
    border-bottom: 1rpx solid #EEF1F6;
}

.product-item.active .product-item-name {
    color: #1890ff;
    font-weight: 600;
}

.product-item-name {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    color: #2A3550;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.popup-empty {
    padding: 60rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: #A0AAC2;
}

/* 操作步骤详情弹层 */
.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
}

.detail-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1F2A44;
}

.detail-content {
    max-height: 50vh;
}

.detail-text {
    font-size: 28rpx;
    line-height: 1.7;
    color: #2A3550;
    word-break: break-all;
    white-space: pre-wrap;
}
.detail-actions {
    display: flex;
    align-items: center;
    gap: 36rpx;
}

.detail-copy {
    font-size: 26rpx;
    color: #1890ff;
    padding: 4rpx 12rpx;
    border-radius: 6rpx;
    background: rgba(24, 144, 255, 0.08);
    cursor: pointer;
}

.detail-copy:active {
    opacity: 0.6;
}

/* 暗黑模式适配 */
.wot-theme-dark {
    /* 搜索输入框：深色胶囊 */
    :deep(.wd-search) { background: transparent !important; }
    :deep(.wd-search__field) { background: #1f1f1f !important; border-radius: 999rpx !important; border: 1rpx solid rgba(255, 255, 255, 0.08) !important; }
    :deep(.wd-search__input) { color: #e5e5e5 !important; background: transparent !important; }
    :deep(.wd-search__placeholder-txt) { color: #8a9099 !important; }
    :deep(.wd-search__search-left-icon) { color: #8a9099 !important; }
    :deep(.wd-search__cancel) { color: #e5e5e5 !important; }

    /* 查询日期选择器：透明背景适配暗色 */
    :deep(.wd-datetime-picker) { background: transparent !important; }
    :deep(.wd-datetime-picker__cell) { background: transparent !important; }
    :deep(.wd-datetime-picker__cell .wd-cell__label) { color: #8a9099 !important; }

    /* 升级方式选择器：透明背景适配暗色 */
    :deep(.wd-picker) { background: transparent !important; }
    :deep(.wd-picker__cell) { background: transparent !important; }
    :deep(.wd-picker__cell .wd-cell__label) { color: #8a9099 !important; }

    /* 产品选择弹层 */
    .popup-title { color: #E8ECF8; }
    .popup-close { background: rgba(255,255,255,0.12); color: #8a9099; }
    .product-item { border-bottom-color: rgba(255,255,255,0.08); }
    .product-item-name { color: #C6CDE0; }
    .popup-empty { color: #6A7590; }

    /* 操作步骤详情弹层 */
    .detail-title { color: #E8ECF8; }
    .detail-text { color: #C6CDE0; }
    .detail-copy { color: #69b1ff; background: rgba(24,144,255,0.18); }
}
</style>
