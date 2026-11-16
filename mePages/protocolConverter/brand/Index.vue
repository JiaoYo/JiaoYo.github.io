<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-navbar left-arrow title="逆变器品牌维护" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        <view v-if="canInsert" class="head-actions">
            <wd-button size="small" type="primary" @click="openForm()">
                <view class="btn-ico"><wd-icon name="add" size="14px" /></view>新增品牌
            </wd-button>
        </view>

        <!-- 查询：品牌名称 + 状态 -->
        <view class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="fc-row">
                <view class="model-input" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                    <wd-icon name="search" size="16px" :color="isDark ? '#8a9099' : '#969799'" />
                    <input class="model-input-core" v-model="model.brandName" type="text" placeholder="品牌名称" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="50" confirm-type="search" @confirm="handleSearch" />
                    <wd-icon v-if="model.brandName" name="close-circle" size="18px" :color="isDark ? '#8a9099' : '#969799'" @click="handleNameClear" />
                </view>
                <picker mode="selector" :range="statusOptions" range-key="label" class="status-picker" @change="handleStatusChange">
                    <view class="fc-cell" :class="{ 'fc-cell--on': model.status !== null }" :style="fcCellStyle(model.status !== null)">
                        <text class="fc-text" :style="{ color: model.status !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ statusOptions.find(s => s.value === model.status)?.label || '全部状态' }}</text>
                        <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                    </view>
                </picker>
            </view>
            <view class="fc-foot">
                <view class="fc-count" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">已加载 <text class="fc-count-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="fc-count-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</view>
                <view class="fc-actions">
                    <wd-button size="small" type="info" plain @click="handleReset">重置</wd-button>
                    <wd-button size="small" type="primary" @click="handleSearch">查询</wd-button>
                </view>
            </view>
        </view>

        <view style="margin: 10rpx;">
            <view v-if="dataList.length > 0">
                <view v-for="row in dataList" :key="row.id" class="list-item" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <view class="item-header">
                        <view class="item-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row.brandName || '-' }}</view>
                        <view class="status-tag" :style="statusTagStyle(Number(row.status))">{{ Number(row.status) === 1 ? '启用' : '停用' }}</view>
                    </view>
                    <view class="meta-grid">
                        <view class="meta-item"><text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">排序号</text><text class="meta-val" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row.sortNo ?? 0 }}</text></view>
                        <view class="meta-item"><text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">创建人</text><text class="meta-val" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row.username || '-' }}</text></view>
                        <view class="meta-item"><text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">创建时间</text><text class="meta-val" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row.dbtime || '-' }}</text></view>
                    </view>
                    <view v-if="canUpdate || canDelete" class="item-footer">
                        <wd-button v-if="canUpdate" size="small" type="primary" plain @click="openForm(row)">编辑</wd-button>
                        <wd-button v-if="canDelete" size="small" type="error" plain @click="handleRowDelete(row)">删除</wd-button>
                    </view>
                </view>
                <wd-loadmore :state="state" @reload="getDataList" />
            </view>
            <view v-else style="display: flex; justify-content: center; align-items: center; padding: 80rpx 0;">
                <wd-status-tip image="../../../static/search.png" tip="暂无数据" />
            </view>
        </view>

        <wd-message-box />
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useMessage } from 'wot-design-uni';
import {
    fetchProtocolConverterBrandDelete,
    fetchProtocolConverterBrandPage
} from '@/service/protocolConverter';
import { hasPermission } from '@/utils/index';

const message = useMessage();
const isDark = computed(() => uni.getStorageSync('isDark') == 1);
const theme = computed(() => (isDark.value ? 'dark' : 'light'));
const themeVars = computed(() => ({ colorTheme: '#1677ff' }));

/* ===== 权限（web v-no-auth 同名键） ===== */
const canInsert = hasPermission('protocol:converterBrand:insert');
const canUpdate = hasPermission('protocol:converterBrand:update');
const canDelete = hasPermission('protocol:converterBrand:delete');

function handleClickLeft() { uni.navigateBack(); }

/* ===== 列表 ===== */
const model = ref({ page: 1, limit: 20, brandName: '', status: null as number | null });
const dataList = ref<any[]>([]);
const total = ref(0);
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('finished');
let listLoading = false;
let pendingReload = false;

async function getDataList() {
    if (listLoading) { pendingReload = true; return; }
    listLoading = true;
    try {
        if (model.value.page === 1) dataList.value = [];
        const params: any = { page: model.value.page, limit: model.value.limit, _t: new Date().getTime() };
        if (model.value.brandName) params.brandName = model.value.brandName;
        if (model.value.status !== null) params.status = model.value.status;
        const data: any = await fetchProtocolConverterBrandPage(params);
        const rows = Array.isArray(data) ? data : (data?.list || []);
        dataList.value = dataList.value.concat(rows);
        total.value = Number(data?.total ?? rows.length);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) { console.error('获取品牌列表失败', err); state.value = 'error'; }
    finally {
        listLoading = false;
        if (pendingReload) { pendingReload = false; getDataList(); }
    }
}
function reload() { model.value.page = 1; dataList.value = []; getDataList(); }
function handleSearch() { reload(); }
function handleReset() {
    model.value.brandName = '';
    model.value.status = null;
    reload();
}
function handleNameClear() { model.value.brandName = ''; reload(); }

const statusOptions = [{ label: '全部状态', value: null as any }, { label: '启用', value: 1 }, { label: '停用', value: 0 }];
function handleStatusChange(e: any) {
    const opt = statusOptions[e.detail.value];
    model.value.status = opt && opt.value !== null ? opt.value : null;
    reload();
}

/** 状态标签配色：启用绿、停用灰（文字为主，颜色辅助） */
function statusTagStyle(status: number) {
    if (status === 1) {
        return isDark.value
            ? { background: 'rgba(82, 196, 26, 0.16)', color: '#73d13d' }
            : { background: '#f6ffed', color: '#52c41a' };
    }
    return isDark.value
        ? { background: 'rgba(255, 255, 255, 0.1)', color: '#8a9099' }
        : { background: '#f2f3f5', color: '#969799' };
}

/** 筛选控件配色 */
function fcCellStyle(active: boolean) {
    return active
        ? (isDark.value
            ? { background: 'rgba(22, 119, 255, 0.12)', borderColor: 'rgba(105, 177, 255, 0.45)' }
            : { background: 'rgba(22, 119, 255, 0.06)', borderColor: 'rgba(22, 119, 255, 0.35)' })
        : (isDark.value
            ? { background: '#383838', borderColor: 'rgba(255, 255, 255, 0.08)' }
            : { background: '#f7f8fa', borderColor: '#f0f1f3' });
}

/* ===== 新增/编辑品牌：独立表单页（WorkBuddy 模式），编辑传 id ===== */
const clickLock = ref(false);
function openForm(row?: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    const url = row ? `/mePages/protocolConverter/brandForm/Index?id=${row.id}` : '/mePages/protocolConverter/brandForm/Index';
    uni.navigateTo({ url });
    setTimeout(() => { clickLock.value = false; }, 500);
}

/* ===== 删除（被引用时后端拒绝，提示改用停用） ===== */
function handleRowDelete(row: any) {
    message
        .confirm({ title: '提示', msg: '品牌被规约转换器引用时无法删除（需改用停用），确定删除吗？' })
        .then(async () => {
            try {
                await fetchProtocolConverterBrandDelete(String(row.id));
                uni.showToast({ title: '删除成功', icon: 'success' });
                reload();
            } catch (err) { console.error('删除品牌失败', err); }
        })
        .catch(() => {});
}

onMounted(() => {
    reload();
    uni.$on('refreshProtocolBrandList', reload);
});
onBeforeUnmount(() => {
    uni.$off('refreshProtocolBrandList', reload);
});
onPullDownRefresh(() => {
    reload();
    setTimeout(() => { uni.stopPullDownRefresh(); }, 600);
});
onReachBottom(() => {
    if (state.value === 'loadmore' && !listLoading) {
        model.value.page += 1;
        getDataList();
    }
});
</script>

<style lang="scss" scoped>
.head-actions { display: flex; justify-content: flex-end; gap: 12rpx; padding: 0 20rpx 12rpx; align-items: center; }
.btn-ico { display: inline-flex; align-items: center; margin-right: 6rpx; }

.filter-card { margin: 4rpx 20rpx 0; padding: 20rpx; border-radius: 20rpx; display: flex; flex-direction: column; gap: 16rpx; }
.fc-row { display: flex; gap: 16rpx; }
.fc-cell { display: flex; align-items: center; gap: 10rpx; padding: 16rpx 18rpx; border-radius: 14rpx; border: 1rpx solid transparent; }
.fc-text { flex: 1; min-width: 0; text-align: right; font-size: 24rpx; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fc-foot { display: flex; align-items: center; justify-content: space-between; }
.fc-count { font-size: 24rpx; }
.fc-count-num { font-weight: 600; }
.fc-actions { display: flex; gap: 16rpx; }

.status-picker { flex: 0 0 220rpx; display: block; }
.model-input { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12rpx; padding: 16rpx 18rpx; border-radius: 14rpx; }
.model-input-core { flex: 1; min-width: 0; height: 40rpx; font-size: 26rpx; }
.pc-grey { color: #bfbfbf; }

.list-item { border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; }
.item-header { display: flex; align-items: center; gap: 16rpx; }
.item-title { flex: 1; min-width: 0; font-size: 30rpx; font-weight: 600; word-break: break-all; }
.status-tag { flex-shrink: 0; padding: 6rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 500; white-space: nowrap; }
.meta-grid { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid rgba(128, 128, 128, 0.15); display: flex; flex-direction: column; gap: 10rpx; }
.meta-item { display: flex; align-items: baseline; gap: 16rpx; }
.meta-label { flex: 0 0 130rpx; font-size: 24rpx; }
.meta-val { flex: 1; min-width: 0; font-size: 25rpx; word-break: break-all; }
.item-footer { display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid rgba(128, 128, 128, 0.15); }
</style>
