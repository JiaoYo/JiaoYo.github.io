<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow title="确认单事项" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <view class="page-inner">
            <view class="tip-bar" :style="{ background: isDark ? '#2a2a2a' : '#f0f7ff', color: isDark ? '#8a9099' : '#646566' }">维护项目启动确认单的勾选事项库；停用后不出现在选择列表，已确认项目保存的是快照不受影响；仅从未被项目选择的条目可删除。</view>

            <!-- 筛选 + 新增 -->
            <view class="tool-row">
                <wd-search v-model="fuzzy" placeholder="搜索类别或事项内容" placeholder-left cancel-txt="搜索" @search="reload" @cancel="reload" @clear="clearFuzzy" />
                <wd-button size="small" type="primary" @click="openEditModal(null)">新增事项</wd-button>
            </view>
            <view class="filter-row">
                <view v-for="opt in enabledOptions" :key="opt.label" class="filter-chip" :style="enabledVal === opt.value ? { background: 'rgba(22,119,255,0.15)', color: '#1677ff' } : { background: isDark ? '#333' : '#f5f5f5', color: isDark ? '#c9cdd4' : '#646566' }" @click="changeEnabled(opt.value)">{{ opt.label }}</view>
            </view>

            <!-- 列表 -->
            <scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
                <view v-if="dataList.length > 0" class="card-list">
                    <view v-for="item in dataList" :key="item.id" class="card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click="openEditModal(item)">
                        <view class="card-head">
                            <text class="card-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ item.itemContent || '-' }}</text>
                            <view class="head-right" @click.stop>
                                <wd-switch :model-value="item.enabled === 1" size="20px" @change="toggleEnabled(item)" />
                            </view>
                        </view>
                        <view class="card-row" :style="{ color: isDark ? '#8a9099' : '#969799' }">
                            <text>类别：{{ item.category || '-' }}</text>
                            <text>排序：{{ item.sortNo ?? '-' }}</text>
                        </view>
                        <view v-if="item.itemDesc" class="card-desc" :style="{ color: isDark ? '#c9cdd4' : '#646566', background: isDark ? '#1b1b1b' : '#fafafa' }">{{ item.itemDesc }}</view>
                        <view class="card-foot">
                            <text class="foot-time" :style="{ color: isDark ? '#6a6a6a' : '#999' }">{{ item.enabled === 1 ? '已启用' : '已停用' }}</text>
                            <view class="foot-ops" @click.stop>
                                <text class="op-link" @click.stop="openEditModal(item)">编辑</text>
                                <text class="op-link danger" @click.stop="handleDelete(item)">删除</text>
                            </view>
                        </view>
                    </view>
                    <wd-loadmore :state="listState" />
                </view>
                <view v-else-if="!listLoading" class="empty-wrap" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <wd-status-tip image="../../static/search.png" tip="暂无确认单事项" />
                </view>
            </scroll-view>
        </view>

    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import {
    fetchStartConfirmLibraryPage,
    fetchStartConfirmLibraryEnabled,
    fetchStartConfirmLibraryDelete
} from '@/service/confirmLibrary';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh; background: #f5f6f8; display: flex; flex-direction: column;';
    return 'min-height: 100vh; background: #1b1b1b; display: flex; flex-direction: column;';
});

// ==================== 筛选 ====================
const fuzzy = ref('');
const enabledVal = ref<number | undefined>(undefined);
const enabledOptions = [
    { label: '全部', value: undefined as any },
    { label: '已启用', value: 1 },
    { label: '已停用', value: 0 }
];
function changeEnabled(v: number | undefined) { enabledVal.value = v; reload(); }
function clearFuzzy() { fuzzy.value = ''; reload(); }

// ==================== 列表 ====================
const dataList = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const listLoading = ref(false);
const listState = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore');
let pendingReload = false;

async function getDataList() {
    if (listLoading.value) { pendingReload = true; return; }
    listLoading.value = true;
    try {
        if (page.value === 1) dataList.value = [];
        const params: any = { page: page.value, limit: 20 };
        if (fuzzy.value.trim()) params.fuzzy = fuzzy.value.trim();
        if (enabledVal.value !== undefined) params.enabled = enabledVal.value;
        const data: any = await fetchStartConfirmLibraryPage(params);
        dataList.value = dataList.value.concat(data.list || []);
        total.value = Number(data.total) || 0;
        listState.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取确认单事项失败', err);
        listState.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) { pendingReload = false; getDataList(); }
    }
}
function reload() { page.value = 1; getDataList(); }
function loadMore() { if (!listLoading.value && dataList.value.length < total.value) { page.value++; getDataList(); } }

// ==================== 新增/编辑（跳独立页面） ====================
function openEditModal(item: any) {
    uni.navigateTo({ url: '/mePages/confirmLibrary/edit/Index' });
    if (item) {
        // 页面 onLoad 注册监听后再 emit 传行数据
        setTimeout(() => uni.$emit('confirmLibrary_row', item), 100);
    }
}

// ==================== 启用/停用 ====================
async function toggleEnabled(item: any) {
    const next = item.enabled === 1 ? 0 : 1;
    try {
        await fetchStartConfirmLibraryEnabled({ id: item.id, enabled: next });
        item.enabled = next;
        uni.showToast({ title: next === 1 ? '已启用' : '已停用', icon: 'success' });
    } catch (err: any) {
        uni.showToast({ title: err?.msg || '操作失败', icon: 'none' });
    }
}

// ==================== 删除 ====================
function handleDelete(item: any) {
    uni.showModal({
        title: '确认删除',
        content: `仅未被项目选择过的条目可删除。确认删除「${item.itemContent}」？`,
        success: async (res) => {
            if (!res.confirm) return;
            try {
                await fetchStartConfirmLibraryDelete({ id: item.id });
                uni.showToast({ title: '已删除', icon: 'success' });
                reload();
            } catch (err: any) {
                uni.showToast({ title: err?.msg || '删除失败，已被项目使用的条目请改为停用', icon: 'none' });
            }
        }
    });
}

function handleClickLeft() { uni.navigateBack(); }

function onRefresh() { reload(); }

onLoad(() => {
    const ut = Number(uni.getStorageSync('usertype'));
    if (![0, 1, 2].includes(ut)) { uni.showToast({ title: '无权限访问', icon: 'none' }); return; }
    getDataList();
    uni.$on('confirmLibrary_refresh', onRefresh);
});
onUnload(() => {
    uni.$off('confirmLibrary_refresh', onRefresh);
});
</script>

<style lang="scss" scoped>
.page-inner { display: flex; flex-direction: column; padding: 20rpx; flex: 1; min-height: 0; box-sizing: border-box; }
.tip-bar { padding: 20rpx 24rpx; border-radius: 12rpx; font-size: 24rpx; line-height: 1.6; margin-bottom: 20rpx; }
.tool-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.tool-row :deep(.wd-search) { flex: 1; }
.filter-row { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.filter-chip { padding: 10rpx 28rpx; border-radius: 999rpx; font-size: 24rpx; }
.list-scroll { flex: 1; min-height: 0; }
.card-list { display: flex; flex-direction: column; gap: 20rpx; padding-bottom: 20rpx; }
.card { border-radius: 16rpx; padding: 24rpx; }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; gap: 16rpx; }
.card-title { font-size: 28rpx; font-weight: 600; flex: 1; }
.card-row { display: flex; gap: 24rpx; font-size: 24rpx; margin-bottom: 8rpx; flex-wrap: wrap; }
.card-desc { font-size: 24rpx; border-radius: 12rpx; padding: 16rpx; margin-bottom: 12rpx; line-height: 1.5; }
.card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; }
.foot-time { font-size: 22rpx; }
.foot-ops { display: flex; gap: 24rpx; }
.op-link { font-size: 26rpx; color: #1677ff; }
.op-link.danger { color: #ff4d4f; }
.empty-wrap { border-radius: 16rpx; padding: 80rpx 0; }
</style>
