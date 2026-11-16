<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow title="财务报表变更" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <view class="page-inner">
            <view class="tip-bar" :style="{ background: isDark ? '#2a2a2a' : '#f0f7ff', color: isDark ? '#8a9099' : '#646566' }">
                选择项目后执行补齐，系统会按项目 ID 重新补全该项目的财务与出差数据；用于财务报表数据修复。请选择项目后操作，操作过程可能需要几秒到几十秒。
            </view>

            <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">目标项目 <text class="required">*</text></text>
                <view class="form-picker" :style="{ background: isDark ? '#333' : '#f5f5f5', color: selectedProject ? (isDark ? '#e8e8e8' : '#1a1a1a') : '#c8c9cc' }" @click="openProjectPicker">
                    {{ selectedProject ? selectedProject.proname : '请选择项目（名称可搜索）' }}
                    <text class="arrow">›</text>
                </view>
                <wd-button type="primary" size="large" :loading="repairing" :disabled="!selectedProject" custom-style="margin-top: 24rpx;" @click="handleRepair">
                    {{ repairing ? '补齐中，请稍候…' : '执行财务与出差数据补齐' }}
                </wd-button>
            </view>

            <!-- 结果 -->
            <view v-if="repairResult" class="result-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="result-head">
                    <text class="result-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">补齐结果</text>
                    <view class="status-tag" :style="{ background: 'rgba(82,196,26,0.15)', color: '#52c41a' }">已执行</view>
                </view>
                <view v-for="row in resultRows" :key="row.label" class="detail-row">
                    <text class="detail-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ row.label }}</text>
                    <text class="detail-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ row.value }}</text>
                </view>
                <view class="result-tip" :style="{ color: isDark ? '#6a6a6a' : '#999' }">财务记录与出差数据已按项目重新补全，可前往项目财务报表核对。</view>
            </view>
        </view>

        <!-- 项目选择弹层 -->
        <wd-popup v-model="projectPickerOpen" position="bottom" :z-index="1000" custom-style="height: 70vh; background: transparent;">
            <view class="picker-popup" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                <view class="popup-head">
                    <text class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">选择项目</text>
                    <wd-icon name="close" size="20px" :color="isDark ? '#8a9099' : '#999'" @click="projectPickerOpen = false" />
                </view>
                <wd-search v-model="projectKeyword" placeholder="搜索项目名称" placeholder-left cancel-txt="搜索" @search="searchProjects" @cancel="searchProjects" @clear="clearProjectSearch" />
                <scroll-view :scroll-y="true" class="popup-list" @scrolltolower="loadNextProjects">
                    <view v-for="p in projectOptions" :key="p.id" class="popup-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }" @click="pickProject(p)">
                        <view class="popup-item-main" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ p.proname || '-' }}</view>
                        <view class="popup-item-sub" :style="{ color: isDark ? '#8a9099' : '#969799' }">ID：{{ p.id }}<text v-if="p.prjno">　编号：{{ p.prjno }}</text></view>
                    </view>
                    <view v-if="projectOptions.length === 0 && !projectLoading" class="popup-tip" :style="{ color: isDark ? '#6a6a6a' : '#999' }">未找到相关项目</view>
                    <wd-loadmore v-if="projectOptions.length > 0" :state="projectState" />
                </scroll-view>
            </view>
        </wd-popup>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjDataList, fetchRepairFinanceTrip } from '@/service/prj';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh; background: #f5f6f8;';
    return 'min-height: 100vh; background: #1b1b1b;';
});

// ==================== 项目选择 ====================
const selectedProject = ref<any>(null);
const projectPickerOpen = ref(false);
const projectKeyword = ref('');
const projectOptions = ref<any[]>([]);
const projectPage = ref(1);
const projectTotal = ref(0);
const projectState = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore');
let projectLoading = false;
let projectPendingReload = false;

async function loadProjects(page: number) {
    if (projectLoading) { projectPendingReload = true; return; }
    projectLoading = true;
    try {
        if (page === 1) projectOptions.value = [];
        const kw = projectKeyword.value.trim();
        const params: any = { page, limit: 20 };
        if (kw) params.fuzzy = kw;
        const data: any = await fetchGetPrjDataList(params, false);
        projectOptions.value = projectOptions.value.concat(data.list || []);
        projectTotal.value = Number(data.total) || 0;
        projectPage.value = page;
        projectState.value = projectOptions.value.length < projectTotal.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取项目列表失败', err);
        projectState.value = 'error';
    } finally {
        projectLoading = false;
        if (projectPendingReload) { projectPendingReload = false; loadProjects(projectPage.value); }
    }
}
function openProjectPicker() {
    projectPickerOpen.value = true;
    if (projectOptions.value.length === 0) loadProjects(1);
}
function searchProjects() { loadProjects(1); }
function clearProjectSearch() { projectKeyword.value = ''; loadProjects(1); }
function loadNextProjects() {
    if (projectLoading || projectOptions.value.length >= projectTotal.value) return;
    loadProjects(projectPage.value + 1);
}
function pickProject(p: any) {
    selectedProject.value = p;
    projectPickerOpen.value = false;
    repairResult.value = null;
}

// ==================== 补齐 ====================
const repairing = ref(false);
const repairResult = ref<any>(null);
const resultRows = computed(() => {
    const r = repairResult.value;
    if (!r) return [];
    return [
        { label: '项目名称', value: r.proname || selectedProject.value?.proname || '-' },
        { label: '项目 ID', value: r.projectId ?? selectedProject.value?.id ?? '-' },
        { label: '财务补齐条数', value: r.financeInserted ?? 0 },
        { label: '出差补齐条数', value: r.tripInserted ?? 0 },
        { label: '执行耗时', value: r.time ? `${r.time}ms` : '-' }
    ];
});

function handleRepair() {
    if (!selectedProject.value || repairing.value) return;
    uni.showModal({
        title: '确认补齐',
        content: `系统会按项目 ID 重新补全「${selectedProject.value.proname}」的财务与出差数据，确认执行？`,
        success: async (res) => {
            if (!res.confirm) return;
            repairing.value = true;
            repairResult.value = null;
            try {
                repairResult.value = await fetchRepairFinanceTrip({ id: selectedProject.value.id });
                uni.showToast({ title: '补齐完成', icon: 'success' });
            } catch (err: any) {
                uni.showToast({ title: err?.msg || '补齐失败', icon: 'none' });
            } finally {
                repairing.value = false;
            }
        }
    });
}

function handleClickLeft() { uni.navigateBack(); }

onLoad(() => {
    const ut = Number(uni.getStorageSync('usertype'));
    if (![0, 4].includes(ut)) { uni.showToast({ title: '无权限访问', icon: 'none' }); }
});
</script>

<style lang="scss" scoped>
.page-inner { padding: 20rpx; }
.tip-bar { padding: 20rpx 24rpx; border-radius: 12rpx; font-size: 24rpx; line-height: 1.6; margin-bottom: 20rpx; }
.form-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.form-label { display: block; font-size: 26rpx; margin-bottom: 12rpx; }
.required { color: #ff4d4f; }
.form-picker { padding: 20rpx 24rpx; border-radius: 12rpx; font-size: 28rpx; display: flex; justify-content: space-between; align-items: center; }
.form-picker .arrow { color: #c8c9cc; font-size: 32rpx; }
.result-card { border-radius: 16rpx; padding: 24rpx; }
.result-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.result-title { font-size: 30rpx; font-weight: 600; }
.status-tag { padding: 4rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; }
.detail-row { display: flex; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx solid rgba(128,128,128,0.15); }
.detail-row:last-of-type { border-bottom: none; }
.detail-label { font-size: 26rpx; }
.detail-value { font-size: 26rpx; }
.result-tip { font-size: 22rpx; line-height: 1.6; margin-top: 16rpx; }
.picker-popup { display: flex; flex-direction: column; height: 100%; border-radius: 24rpx 24rpx 0 0; overflow: hidden; }
.popup-head { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 32rpx 12rpx; }
.popup-title { font-size: 32rpx; font-weight: 600; }
.popup-list { flex: 1; min-height: 0; padding: 0 24rpx; box-sizing: border-box; }
.popup-item { padding: 20rpx 8rpx; border-bottom: 1rpx solid; }
.popup-item-main { font-size: 28rpx; margin-bottom: 6rpx; }
.popup-item-sub { font-size: 22rpx; }
.popup-tip { text-align: center; font-size: 24rpx; padding: 60rpx 0; }
</style>
