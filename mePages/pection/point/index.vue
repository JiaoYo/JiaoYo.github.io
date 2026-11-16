<script lang="ts" setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { onLoad, onReady, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { useMessage } from 'wot-design-uni';
import { fetchPointPage, fetchDeletePoint, fetchPointProtypePage, fetchPointModelPage, fetchPointManuPage } from '@/service/point';
import { showFileActions, getFileNameFromUrl } from '../common';

const message = useMessage();

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const userId = ref<number>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));
const clickLock = ref<boolean>(false);

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const listLoading = ref(false);
let pendingReload = false;

// 顶部固定区域高度（px）- 初始值设为200作为占位
const topFixedHeight = ref<number>(200);

const model = ref({
    page: 1, limit: 20, fuzzy: '',
    muid: '' as number | '', mdid: '' as number | '',
    ptid: '' as number | '', status: '' as number | '',
});

const manuList = ref<any[]>([]);
const modelList = ref<any[]>([]);
const protypeList = ref<any[]>([]);

const manuOptions = computed(() => [{ label: '全部', value: '' }, ...manuList.value.map(item => ({ label: item.manu, value: item.id }))]);
const modelOptions = computed(() => [{ label: '全部', value: '' }, ...modelList.value.map(item => ({ label: item.model, value: item.id }))]);
const protypeOptions = computed(() => [{ label: '全部', value: '' }, ...protypeList.value.map(item => ({ label: item.protype, value: item.id }))]);
const statusOptions = [{ label: '全部', value: '' }, { label: '是', value: 1 }, { label: '否', value: 0 }];

async function getFilterData() {
    try {
        const [manuData, protypeData] = await Promise.all([
            fetchPointManuPage({ page: 1, limit: 100 }),
            fetchPointProtypePage({ page: 1, limit: 100 })
        ]);
        manuList.value = manuData.list || [];
        protypeList.value = protypeData.list || [];
    } catch (err) { console.error('获取筛选数据失败', err); }
}

async function handleManuChange(val: any) {
    model.value.muid = val;
    model.value.mdid = '';
    modelList.value = [];
    if (val) {
        try {
            const data = await fetchPointModelPage({ page: 1, limit: 100, pid: val });
            modelList.value = data.list || [];
        } catch (err) { console.error('获取型号列表失败', err); }
    }
    model.value.page = 1;
    dataList.value = [];
    getDataList();
}

function handleModelChange(val: any) { model.value.mdid = val; model.value.page = 1; dataList.value = []; getDataList(); }
function handleProtypeChange(val: any) { model.value.ptid = val; model.value.page = 1; dataList.value = []; getDataList(); }
function handleStatusChange(val: any) { model.value.status = val; model.value.page = 1; dataList.value = []; getDataList(); }

async function getDataList() {
    if (listLoading.value) { pendingReload = true; return; }
    listLoading.value = true;
    try {
        if (model.value.page === 1) dataList.value = [];
        let queryParams: any = { page: model.value.page, limit: model.value.limit };
        if (model.value.fuzzy) queryParams.fuzzy = model.value.fuzzy;
        if (model.value.muid) queryParams.muid = model.value.muid;
        if (model.value.mdid) queryParams.mdid = model.value.mdid;
        if (model.value.ptid) queryParams.ptid = model.value.ptid;
        if (model.value.status !== '' && model.value.status !== null) queryParams.status = model.value.status;
        const data = await fetchPointPage(queryParams);
        dataList.value = dataList.value.concat(data.list || []);
        total.value = Number(data.total);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) { console.error('获取点表模板列表失败', err); state.value = 'error'; }
    finally { listLoading.value = false; if (pendingReload) { pendingReload = false; getDataList(); } }
}

function handleSearchChange() { model.value.page = 1; getDataList(); }
function handleClearChange() { model.value.fuzzy = ''; model.value.page = 1; getDataList(); }

// 清除全部筛选条件并刷新列表
function handleResetFilter() {
    model.value.fuzzy = '';
    model.value.muid = '';
    model.value.mdid = '';
    model.value.ptid = '';
    model.value.status = '';
    modelList.value = [];
    model.value.page = 1;
    dataList.value = [];
    getDataList();
    uni.showToast({ title: '已清除筛选', icon: 'none' });
}
function handleClickLeft() { /* #ifdef H5 */ history.go(-1); /* #endif */ /* #ifndef H5 */ uni.navigateBack(); /* #endif */ }

// 单个筛选项清除
function clearManuFilter() {
    model.value.muid = '';
    model.value.mdid = '';
    modelList.value = [];
    model.value.page = 1; dataList.value = []; getDataList();
}
function clearModelFilter() { model.value.mdid = ''; model.value.page = 1; dataList.value = []; getDataList(); }
function clearProtypeFilter() { model.value.ptid = ''; model.value.page = 1; dataList.value = []; getDataList(); }
function clearStatusFilter() { model.value.status = ''; model.value.page = 1; dataList.value = []; getDataList(); }

function handleAdd() {
    if (clickLock.value) return;
    clickLock.value = true;
    const q: string[] = [];
    if (model.value.muid !== '') q.push(`muid=${model.value.muid}`);
    if (model.value.mdid !== '') q.push(`mdid=${model.value.mdid}`);
    if (model.value.ptid !== '') q.push(`ptid=${model.value.ptid}`);
    uni.navigateTo({ url: `/mePages/pection/point/edit/Index${q.length ? '?' + q.join('&') : ''}` });
    setTimeout(() => { clickLock.value = false; }, 500);
}

function handleEdit(item: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    const q: string[] = [`id=${item.id}`];
    if (item.pname) q.push(`pname=${encodeURIComponent(item.pname)}`);
    if (item.fileurl) q.push(`fileurl=${encodeURIComponent(item.fileurl)}`);
    if (item.muid != null && item.muid !== '') q.push(`muid=${item.muid}`);
    if (item.mdid != null && item.mdid !== '') q.push(`mdid=${item.mdid}`);
    if (item.ptid != null && item.ptid !== '') q.push(`ptid=${item.ptid}`);
    if (item.notes) q.push(`notes=${encodeURIComponent(item.notes)}`);
    q.push(`status=${item.status ?? 0}`);
    uni.navigateTo({ url: `/mePages/pection/point/edit/Index?${q.join('&')}` });
    setTimeout(() => { clickLock.value = false; }, 500);
}
// 提取文件名(截断显示)
function getFileNameS(url: string): string {
    if (!url) return '';
    let name = String(url).split('/').pop() || url;
    if (name.includes('?')) name = name.split('?')[0];
    return name.length > 22 ? name.slice(0, 22) + '...' : name;
}
async function handleDelete(item: any) {
    message
    .confirm({
        msg: '确定要删除该点表模板吗？',
        title: '提示',
        confirmButtonProps: {
            type: 'error',
        },
    })
    .then(async () => {
        try {
            await fetchDeletePoint(String(item.id));
            uni.showToast({ title: '删除成功', icon: 'success' });
            model.value.page = 1;
            getDataList();
        } catch (err) {
            uni.showToast({ icon: 'none', title: '删除失败' });
        }
    })
    .catch(() => {
        console.log('点击了取消按钮');
    });
}

function handleFileClick(url: string) { if (!url) { uni.showToast({ title: '文件不存在', icon: 'none' }); return; } showFileActions({ url, name: getFileNameFromUrl(url) }); }
function getFileName(url: string) { return getFileNameFromUrl(url); }

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
    }
}

function refreshFromEdit() {
    model.value.page = 1;
    dataList.value = [];
    getDataList();
}

onLoad(async () => { await getFilterData(); getDataList(); });
onReady(() => { recalcTopFixedHeight(); });
onMounted(() => {
    nextTick(() => {
        setTimeout(() => { recalcTopFixedHeight(); }, 80);
    });
    uni.$on('refreshPointList', refreshFromEdit);
});
onBeforeUnmount(() => {
    uni.$off('refreshPointList', refreshFromEdit);
});
onPullDownRefresh(() => { model.value.page = 1; getDataList(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (listLoading.value) return; if (dataList.value.length < total.value) { model.value.page++; getDataList(); } else if (dataList.value.length === total.value) { state.value = 'finished'; } });
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#FFFFFF' }">
            <wd-navbar left-arrow title="点表模板" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <view style="padding: 0 20rpx; margin-bottom: 6rpx;">
                <wd-row>
                    <wd-col :span="12">
                        <view class="filter-item">
                            <wd-picker view-mode="cell" label="厂家" label-width="60rpx" ellipsis v-model="model.muid" :columns="manuOptions" @confirm="({ value }) => handleManuChange(value)" placeholder="选择厂家" custom-style="flex: 1; min-width: 0;" />
                            <view v-if="model.muid !== ''" class="filter-clear" @click="clearManuFilter"><wd-icon name="close-circle" size="16px" :color="isDark ? '#6a6a6a' : '#c8c9cc'"></wd-icon></view>
                        </view>
                    </wd-col>
                    <wd-col :span="12">
                        <view class="filter-item">
                            <wd-picker view-mode="cell" label="型号" label-width="60rpx" ellipsis v-model="model.mdid" :columns="modelOptions" @confirm="({ value }) => handleModelChange(value)" placeholder="选择型号" custom-style="flex: 1; min-width: 0;" />
                            <view v-if="model.mdid !== ''" class="filter-clear" @click="clearModelFilter"><wd-icon name="close-circle" size="16px" :color="isDark ? '#6a6a6a' : '#c8c9cc'"></wd-icon></view>
                        </view>
                    </wd-col>
                </wd-row>
                <wd-row>
                    <wd-col :span="12">
                        <view class="filter-item">
                            <wd-picker view-mode="cell" label="协议" label-width="60rpx" ellipsis v-model="model.ptid" :columns="protypeOptions" @confirm="({ value }) => handleProtypeChange(value)" placeholder="选择协议" custom-style="flex: 1; min-width: 0;" />
                            <view v-if="model.ptid !== ''" class="filter-clear" @click="clearProtypeFilter"><wd-icon name="close-circle" size="16px" :color="isDark ? '#6a6a6a' : '#c8c9cc'"></wd-icon></view>
                        </view>
                    </wd-col>
                    <wd-col :span="12">
                        <view class="filter-item">
                            <wd-picker view-mode="cell" label="内部" label-width="60rpx" ellipsis v-model="model.status" :columns="statusOptions" @confirm="({ value }) => handleStatusChange(value)" placeholder="是否内部" custom-style="flex: 1; min-width: 0;" />
                            <view v-if="model.status !== ''" class="filter-clear" @click="clearStatusFilter"><wd-icon name="close-circle" size="16px" :color="isDark ? '#6a6a6a' : '#c8c9cc'"></wd-icon></view>
                        </view>
                    </wd-col>
                </wd-row>
            </view>
            <wd-search v-model="model.fuzzy" placeholder="请输入名称" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
            <view class="summary-bar">
                <view class="summary-chip" :style="{ background: isDark ? '#3a3a3a' : '#f7f8fa', color: isDark ? '#8a9099' : '#4e5969' }"><text class="summary-dot"></text><text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text></view>
                <view class="filter-reset" :style="{ background: isDark ? '#3a3a3a' : '#f0f1f3' }" @click="handleResetFilter">
                    <wd-icon name="refresh" size="13px" :color="isDark ? '#8a9099' : '#4e5969'"></wd-icon>
                    <text class="filter-reset-text" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">清除筛选</text>
                </view>
            </view>
        </view>

        <view :style="{ margin: '20rpx', background: isDark ? '#1b1b1b' : '#f5f6f8' }">
            <view v-if="dataList.length > 0">
                <view v-for="(item, index) in dataList" :key="index" class="list-item" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                    <view class="item-content">
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">名称：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.pname || '-' }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">厂家：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.manu || '-' }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">型号：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.model || '-' }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">协议：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.protype || '-' }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">文件：</text><text v-if="item.fileurl" class="item-value file-name" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click="handleFileClick(item.fileurl)">{{ getFileNameS(item.fileurl) }}</text><text v-else class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">-</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">内部模板：</text><text class="item-value" :style="{ color: (item.status ?? 0) === 1 ? '#18a058' : (isDark ? '#8a9099' : '#969799') }">{{ (item.status ?? 0) === 1 ? '是' : '否' }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">备注：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.notes || '-' }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">创建人：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.username || '-' }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">创建时间：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.dbtime || '-' }}</text></view>
                    </view>
                    <view class="item-actions">
                        <wd-icon v-if="userType === 0 || userId === item.creater" name="edit" size="22px" color="#f39c12" @click="handleEdit(item)"></wd-icon>
                        <wd-icon v-if="userType === 0" name="delete"  @click.stop="handleDelete(item)" size="22px" color="#e74c3c" ></wd-icon>
                    </view>
                </view>
                <wd-loadmore :state="state" @reload="getDataList" />
            </view>
            <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', minHeight: 'calc(100vh - 450rpx)' }">
                <wd-status-tip image="../../static/search.png" tip="暂无数据" />
            </view>
            <wd-fab :disabled="clickLock" draggable :zIndex="9" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleAdd"></wd-fab>
        </view>
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
    box-sizing: border-box;
}
.filter-item { display: flex; align-items: center; }
.filter-clear { padding: 10rpx 10rpx 10rpx 0; }
.summary-bar { padding: 16rpx 30rpx; display: flex; align-items: center; justify-content: space-between; }
.filter-reset { display: inline-flex; align-items: center; gap: 6rpx; padding: 8rpx 20rpx; border-radius: 999rpx; background: #f0f1f3; }
.filter-reset-text { font-size: 24rpx; color: #4e5969; }
.summary-chip { display: inline-flex; align-items: center; gap: 10rpx; padding: 8rpx 20rpx; border-radius: 999rpx; background: #f7f8fa; font-size: 24rpx; color: #4e5969; }
.summary-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%); }
.summary-num { font-weight: 600; color: #1677ff; margin: 0 4rpx; }
.list-item { display: flex; justify-content: space-between; padding: 24rpx; margin-bottom: 20rpx; border-radius: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05); }
.item-content { flex: 1; }
.item-row { display: flex; align-items: center; margin-bottom: 12rpx; font-size: 26rpx; }
.item-label { color: #969799; min-width: 140rpx; }
.item-value { color: #323233; flex: 1; }
.file-name { color: #1677ff; text-decoration: underline; }
.item-actions { display: flex; flex-direction: column; gap: 16rpx; justify-content: center; }

/* 暗黑模式组件背景强制覆盖 */
.wot-theme-dark {
    :deep(.wd-search) {
        background: #2a2a2a !important;
    }
    :deep(.wd-search__input) {
        background: #2a2a2a !important;
    }
    :deep(.wd-picker) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell-group) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell-group__body) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell) {
        background: #2a2a2a !important;
    }
    :deep(.wd-input) {
        background: #2a2a2a !important;
    }

    /* 白色卡片面兜底：不依赖内联样式，避免 app 端首帧/旧包渲染成白色 */
    .topFixedWrap {
        background-color: #1b1b1b !important;
    }
    .list-item {
        background: #2a2a2a !important;
    }
    .summary-chip,
    .filter-reset {
        background: #3a3a3a !important;
    }
}

</style>
