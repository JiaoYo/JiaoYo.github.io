<script lang="ts" setup>
import { hasPermission } from '@/utils/index';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { onReady, onLoad, onShow, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { useMessage } from 'wot-design-uni';
import { fetchDispatchList, fetchProvinceList, fetchDeleteDispatch } from '@/service/dispatch';
import { CONTACT_TYPES, COUNT_KEY_OF_TYPE } from './modules/constants';
import ipImagePopup from './modules/ip-image-popup.vue';

const message = useMessage();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const clickLock = ref<boolean>(false);

// 搜索表单
const dataForm = reactive<{
    page: number;
    limit: number;
    fuzzy: string;
    province: any;
    region: string;
}>({
    page: 1,
    limit: 10,
    fuzzy: '',
    province: [],
    region: '',
});

// 省份（沿用原 fetchProvinceList 接口）
const provinceList = ref<any[]>([]);
const provinceColumns = computed(() => provinceList.value.map((p: any) => ({ value: p.id, label: p.name })));
const provinceName = computed(() => {
    if (dataForm.province == null) return '';
    const p = provinceList.value.find((x: any) => String(x.id) === String(dataForm.province));
    return p ? p.name : '';
});

// 用 ref + onShow 重查，避免权限异步加载时添加按钮不显示
const canInsert = ref(hasPermission('project:Dispatch:insert'));
function refreshCanInsert() {
    canInsert.value = hasPermission('project:Dispatch:insert');
}
const canUpdate = hasPermission('project:Dispatch:update');

// 权限/身份缓存（避免每行渲染时重复读本地存储）
const canDeleteGlobal = hasPermission('project:Dispatch:delete');
const isAdminUser = Number(uni.getStorageSync('usertype')) === 0;
const myUserId = String(uni.getStorageSync('userId') ?? '');
function canOperateCached(creater: any): boolean {
    if (creater == null || creater === '') return true;
    return isAdminUser || String(creater) === myUserId;
}

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
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    getDataList();
}

// 重置筛选
function resetFilter() {
    dataForm.fuzzy = '';
    dataForm.province = [];
    dataForm.region = '';
    dataForm.page = 1;
    getDataList();
}

const listLoading = ref(false);
let pendingReload = false;

// 获取主站调度列表（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
async function getDataList() {
    if (listLoading.value) {
        pendingReload = true;
        return;
    }
    listLoading.value = true;
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchDispatchList({
            page: dataForm.page,
            pageSize: dataForm.limit,
            limit: dataForm.limit,
            fuzzy: dataForm.fuzzy,
            province: (dataForm.province == null || (Array.isArray(dataForm.province) && dataForm.province.length === 0)) ? undefined : dataForm.province,
            region: dataForm.region,
            _t: Date.now()
        });
        const rows = (Array.isArray(data) ? data : (data && (data.list || data.records))) || [];
        const list = Array.isArray(rows) ? rows : [];
        dataList.value = dataList.value.concat(list);
        total.value = Number(data && data.total != null ? data.total : list.length);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取主站调度列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) {
            pendingReload = false;
            getDataList();
        }
    }
}

// 省份
async function loadProvinces() {
    try {
        const data = await fetchProvinceList();
        provinceList.value = Array.isArray(data) ? data : (data.list || []);
    } catch (e) {
        provinceList.value = [];
    }
}

// 刷新列表（事件通知：调度表保存 / 联系人子表增删改后，回到列表页重查，同步卡片角标数量）
function refreshList() {
    dataForm.page = 1;
    getDataList();
}

// 打开详情（默认定位到调度联系人）
function openDetail(row: any) {
    openContact(row, 1);
}

// ========== 主站IP图片弹窗（type=10 附件：查询/上传/删除，参照 web 端 dispatch） ==========
const ipImageShow = ref(false);
const ipImagePid = ref<number | string>('');
const ipImageDname = ref('');

function openIpImage(row: any) {
    if (!row?.id) return;
    ipImagePid.value = row.id;
    ipImageDname.value = row.dname || '';
    ipImageShow.value = true;
}

// 图片增删后同步当前行角标数量（不整页刷新，避免列表跳动）
function onIpImageChanged(count: number) {
    const row = dataList.value.find((it: any) => String(it.id) === String(ipImagePid.value));
    if (row) row.type10Count = count;
}

// 跳转联系人管理页（row 序列化到 query，子页通过 onLoad options.row 解析）
function openContact(row: any, type: number) {
    uni.navigateTo({
        url: '/mePages/dispatchmanage/contact/Index?row=' + encodeURIComponent(JSON.stringify(row)) + '&type=' + type
    });
}

// 新增：跳转调度表表单页
function openAdd() {
    if (clickLock.value) return;
    clickLock.value = true;
    uni.navigateTo({ url: '/mePages/dispatchmanage/form/Index' });
    setTimeout(() => { clickLock.value = false; }, 300);
}

// 编辑：跳转调度表表单页（携带当前行数据）
function openEdit(row: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    uni.navigateTo({
        url: '/mePages/dispatchmanage/form/Index?row=' + encodeURIComponent(JSON.stringify(row))
    });
    setTimeout(() => { clickLock.value = false; }, 300);
}

// 删除主站调度
function handleDeleteChange(row: any) {
    if (!hasPermission('project:Dispatch:delete')) return;
    message
    .confirm({
        msg: '确定要删除该调度表吗？',
        title: '提示',
        confirmButtonProps: {
            type: 'error',
        },
    })
    .then(async () => {
        try {
            await fetchDeleteDispatch(row.id);
            dataForm.page = 1;
            await getDataList();
            uni.showToast({ icon: 'success', title: '删除成功' });
        } catch (err) {
            uni.showToast({ icon: 'none', title: '删除失败' });
        }
    })
    .catch(() => {
        console.log('点击了取消按钮');
    });
}

// 各类型数量
function countOf(item: any, type: number): number {
    return Number(item[COUNT_KEY_OF_TYPE[type]] || 0);
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
    loadProvinces();
    uni.$on('refreshListDispatch', refreshList); // 监听刷新事件（调度表保存 / 联系人子表变化）
});

onShow(() => {
    refreshCanInsert(); // 返回页面时重查权限，避免添加按钮偶尔不显示
});

onReady(() => {
    recalcTopFixedHeight();
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

onUnload(() => {
    uni.$off('refreshListDispatch', refreshList); // 页面销毁时解绑
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
    if (listLoading.value) return; // 在途请求未返回时不翻页，避免跳页
    if (dataList.value.length < total.value) {
        dataForm.page++;
        getDataList();
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#323233' : '#FFFFFF' }">
            <wd-navbar left-arrow title="主站调度管理" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <wd-search v-model="dataForm.fuzzy" placeholder="搜索调度名称/联系人" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <!-- 筛选：省份 + 地区 -->
            <view class="filter-row" :style="{ background: isDark ? '#323233' : '#ffffff' }">
                <view class="filter-box province-box" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f5f5f5)' }">
                    <wd-picker :columns="provinceColumns" v-model="dataForm.province" use-default-slot @confirm="handleSearchChange">
                        <view class="picker-trigger">
                            <text class="picker-value" :class="{ placeholder: !provinceName }">{{ provinceName || '省份' }}</text>
                            <wd-icon name="arrow-down" size="14px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
                        </view>
                    </wd-picker>
                </view>
                <view class="filter-box region-box" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f5f5f5)' }">
                    <input class="region-input" :class="{ dark: isDark }" v-model="dataForm.region" placeholder="地区" :placeholder-style="isDark ? 'color:#666666' : 'color:#bfbfbf'" @confirm="handleSearchChange" @blur="handleSearchChange" />
                </view>
                <view class="filter-reset" :class="{ dark: isDark }" @click="resetFilter">重置</view>
            </view>

            <!-- 数据总览（固定头部，不随列表滚动） -->
            <view class="summary-bar" :style="{ background: isDark ? '#323233' : '#ffffff' }">
                <view class="summary-chip" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f7f8fa)' }">
                    <text class="summary-dot"></text>
                    <text class="summary-text" :style="{color: isDark ? '#ffffff' : '#000000'}">已加载 <text class="summary-num">{{ dataList.length }}</text> / 共 <text class="summary-num">{{ total }}</text> 条调度数据</text>
                </view>
            </view>
        </view>

        <view v-if="dataList.length > 0" class="list-wrap">
            <view v-for="(item, index) in dataList" :key="item.id ?? index" class="card" :class="{ 'card-dark': isDark }">
                <!-- 标题 + 编辑/删除 -->
                <view class="card-top">
                    <view class="card-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" @click="openDetail(item)">{{ item.dname }}</view>
                    <view class="card-top-actions">
                        <wd-icon v-if="canUpdate && canOperateCached(item.creater)" name="edit-outline" size="20px" color="#1677ff" @click.stop="openEdit(item)"></wd-icon>
                        <wd-icon v-if="canDeleteGlobal && canOperateCached(item.creater)" name="delete" size="20px" color="#dd524d" @click.stop="handleDeleteChange(item)"></wd-icon>
                    </view>
                </view>

                <!-- 省份 / 地区 -->
                <view v-if="item.provinceName || item.region" class="card-tags">
                    <text v-if="item.provinceName" class="tag" :class="{ dark: isDark }">{{ item.provinceName }}</text>
                    <text v-if="item.region" class="tag" :class="{ dark: isDark }">{{ item.region }}</text>
                </view>

                <!-- 各类型数量 -->
                <view class="card-badges">
                    <view v-for="t in CONTACT_TYPES" :key="t.type" class="badge" :class="{ dark: isDark }" @click.stop="openContact(item, t.type)">
                        <view class="badge-dot" :style="{ background: t.color }"></view>
                        <text class="badge-label">{{ t.label }}</text>
                        <text class="badge-count" :class="{ zero: !countOf(item, t.type) }">{{ countOf(item, t.type) }}</text>
                        <!-- 主站IP图片入口（type=10 附件，角标为图片数量，参照 web 端调度页） -->
                        <view v-if="t.type === 0" class="badge-img" @click.stop="openIpImage(item)">
                            <wd-icon name="image" size="15px" :color="isDark ? '#b37feb' : '#722ed1'"></wd-icon>
                            <text class="badge-img-count" :class="{ zero: !Number(item.type10Count || 0) }">{{ Number(item.type10Count || 0) > 99 ? '99+' : Number(item.type10Count || 0) }}</text>
                        </view>
                    </view>
                </view>

                <!-- 创建人 / 时间 -->
                <view class="card-meta">
                    <text>创建人：{{ item.username || '-' }}</text>
                    <text>{{ item.dbtime || '' }}</text>
                </view>
            </view>

            <wd-loadmore :state="state" @reload="getDataList" />
        </view>

        <view v-else-if="state === 'loading'" class="empty-wrap" :class="{ 'empty-wrap-dark': isDark }">
            <wd-loading size="24px"></wd-loading>
            <text class="empty-loading-text">加载中...</text>
        </view>

        <view v-else class="empty-wrap" :class="{ 'empty-wrap-dark': isDark }">
            <wd-status-tip image="../../static/search.png" tip="暂无主站调度数据" />
        </view>

        <wd-fab v-if="canInsert" :disabled="clickLock" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="openAdd"></wd-fab>

        <wd-backtop :bottom="105" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>

        <!-- 主站IP图片弹窗 -->
        <ip-image-popup v-model="ipImageShow" :pid="ipImagePid" :dname="ipImageDname" @changed="onIpImageChanged" />

        <wd-message-box />
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    background-color: #FFFFFF; /* 将被内联样式覆盖 */
    box-sizing: border-box;
}

/* 筛选行 */
.filter-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 0 30rpx 16rpx;
    /* 背景色通过内联样式设置 */
}

.filter-box {
    flex: 1;
    min-width: 0;
    height: 60rpx;
    background: var(--wd-bg-color-grey, #f5f5f5);
    border-radius: 30rpx;
    box-sizing: border-box;
}

.province-box {
    flex: 0 0 220rpx;
}

.picker-trigger {
    height: 60rpx;
    padding: 0 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8rpx;
    box-sizing: border-box;
}

.picker-value {
    font-size: 28rpx;
    color: #262626;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.picker-value.placeholder {
    color: #bfbfbf;
}

.region-box {
    height: 60rpx;
    display: flex;
    align-items: center;
}

.region-input {
    width: 100%;
    height: 100%;
    padding: 0 20rpx;
    font-size: 28rpx;
    color: #262626;
    box-sizing: border-box;
}

.filter-reset {
    flex-shrink: 0;
    font-size: 26rpx;
    color: #1677ff;
    padding: 8rpx 0;
}

/* 数据总览 */
.summary-bar {
    padding: 0 30rpx 16rpx;
    /* 背景色通过内联样式设置 */
}

.summary-chip {
    display: inline-flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 999rpx;
    background: var(--wd-bg-color-grey, #f7f8fa);
    border: 1rpx solid var(--wd-border-color, #f0f1f3);
    font-size: 24rpx;
    color: var(--wd-text-color-secondary, #4e5969);
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

/* 列表 */
.list-wrap {
    padding: 8rpx 20rpx 20rpx;
}

.card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin: 20rpx 0 0;
}

.card-dark {
    background: #1b1b1b;
}

.card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}

.card-title {
    flex: 1;
    min-width: 0;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--wd-text-color, #1a1a1a);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 12rpx;
}

.tag {
    font-size: 22rpx;
    color: #1677ff;
    background: #e6f4ff;
    border-radius: 6rpx;
    padding: 4rpx 12rpx;
}

.card-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 16rpx;
}

.badge {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 14rpx;
    border-radius: 999rpx;
    background: var(--wd-bg-color-grey, #f7f8fa);
    border: 1rpx solid var(--wd-border-color, #f0f1f3);
}

.badge-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    flex-shrink: 0;
}

.badge-label {
    font-size: 22rpx;
    color: var(--wd-text-color-secondary, #4e5969);
    white-space: nowrap;
}

.badge-count {
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 8rpx;
    border-radius: 999rpx;
    background: var(--wd-border-color, #e5e6eb);
    color: var(--wd-text-color-tertiary, #86909c);
    font-size: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.badge-count.zero {
    background: var(--wd-bg-color-grey, #f2f3f5);
    color: var(--wd-text-color-disabled, #c0c4cc);
}

/* 主站IP图片入口：与联系人角标同排，左分隔线区分 */
.badge-img {
    display: inline-flex;
    align-items: center;
    gap: 4rpx;
    margin-left: 6rpx;
    padding-left: 10rpx;
    border-left: 1rpx solid var(--wd-border-color, #e5e6eb);
}

.badge-img-count {
    font-size: 20rpx;
    color: #722ed1;
}

.badge-img-count.zero {
    color: var(--wd-text-color-disabled, #c0c4cc);
}

.card-meta {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid var(--wd-border-color, #f5f6f8);
    font-size: 22rpx;
    color: var(--wd-text-color-tertiary, #c0c4cc);
}

/* 卡片右上角 编辑/删除 */
.card-top-actions {
    display: flex;
    align-items: center;
    gap: 24rpx;
    flex-shrink: 0;
}

.empty-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16rpx;
    margin: 20rpx;
    border-radius: 20rpx;
    padding: 40rpx 0;
    background: #ffffff;
}

.empty-loading-text {
    font-size: 26rpx;
    color: var(--wd-text-color-tertiary, #86909c);
}

.empty-wrap-dark {
    background: #1b1b1b;
}


/* 暗黑模式样式 */
.picker-value-dark {
    color: #e8e8e8 !important;
}
.region-input.dark {
    background: #2a2a2a !important;
    color: #e8e8e8 !important;
}
input.region-input.dark::placeholder {
    color: #666666 !important;
}
.tag.dark {
    background: #1a3a5c;
    color: #69b1ff;
}
.filter-reset.dark {
    color: #69b1ff;
}


.badge.dark {
    background: #2a2a2a;
    border-color: #3a3a3a;
}
.badge.dark .badge-label {
    color: #8a9099;
}
.badge.dark .badge-count {
    background: #3a3a3a;
    color: #8a9099;
}
.badge.dark .badge-count.zero {
    background: #2a2a2a;
}

.badge.dark .badge-img {
    border-left-color: #3a3a3a;
}

.badge.dark .badge-img-count {
    color: #b37feb;
}

.badge.dark .badge-img-count.zero {
    color: #5a5f66;
}
</style>
