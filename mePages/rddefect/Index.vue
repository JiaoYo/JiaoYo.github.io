<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-message-box />
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow title="研发缺陷" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <view class="search-row">
                <view class="search-input-wrap" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5' }">
                    <input class="search-input" v-model="fuzzy" placeholder="搜索缺陷标题/产品/责任人" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" @confirm="handleSearch" />
                    <text v-if="fuzzy" class="clear-btn" :style="{ color: isDark ? '#6a6a6a' : '#999' }" @click="handleClearFuzzy">×</text>
                </view>
                <view class="btn-group">
                    <wd-button size="small" type="primary" @click="handleSearch">查询</wd-button>
                    <wd-button size="small" type="info" plain @click="toggleMoreFilters">{{ showMoreFilters ? '收起' : '更多' }}</wd-button>
                </view>
            </view>
            <view v-if="showMoreFilters" class="filter-wrap">
                <view class="filter-row">
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">研发产品</text>
                        <picker mode="selector" :range="projectList" range-key="rdname" @change="handleProjectChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedProject?.rdname || '全部' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">状态</text>
                        <picker mode="selector" :range="statusOptions" range-key="label" @change="handleStatusChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedStatus?.label || '全部' }}</view>
                        </picker>
                    </view>
                </view>
                <view class="filter-row">
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">责任人</text>
                        <picker mode="selector" :range="userOptions" range-key="username" @change="handleAssigneeChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedAssignee?.username || '全部' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">测试人员</text>
                        <picker mode="selector" :range="testerOptions" range-key="username" @change="handleTesterChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedTester?.username || '全部' }}</view>
                        </picker>
                    </view>
                </view>
                <view class="filter-row">
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">发生时间从</text>
                        <picker mode="date" :value="startDate" @change="handleStartDateChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ startDate || '不限' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">至</text>
                        <picker mode="date" :value="endDate" @change="handleEndDateChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ endDate || '不限' }}</view>
                        </picker>
                    </view>
                </view>
                <view class="filter-reset-row">
                    <wd-button size="small" type="info" plain @click="resetFilters">重置筛选</wd-button>
                </view>
            </view>
            <view class="summary-bar">
                <view class="summary-left">
                    <view class="summary-chip" :style="{ background: isDark ? '#3a3a3a' : '#f7f8fa', color: isDark ? '#8a9099' : '#4e5969' }">
                        <text class="summary-dot"></text>
                        <text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text>
                    </view>
                </view>
                <wd-button size="small" type="primary" @click="handleAddDefect">新增</wd-button>
            </view>
        </view>
        <view v-if="dataList.length > 0" style="margin: 20rpx;">
            <view class="list-item" v-for="item in dataList" :key="item.id" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click="handleViewDetail(item)">
                <view class="item-header">
                    <view class="item-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ item.defect || '-' }}</view>
                    <view class="status-tag" :style="{ background: getStatusColor(item.status) + '1A', color: getStatusColor(item.status) }">{{ getStatusLabel(item.status) }}</view>
                </view>
                <view class="item-info" :style="{ background: isDark ? '#1b1b1b' : '#fafafa' }">
                    <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">所属产品：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.productName || '-' }}</text></view>
                    <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">产品负责人：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ getRdtypeLabel(item.rdtype) }}</text></view>
                    <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">缺陷来源：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ getSourceLabel(item.source) }}</text></view>
                    <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">影响程度：</text><view class="severity-tag" :style="{ background: getSeverityColor(item.severity) + '1A', color: getSeverityColor(item.severity) }">{{ getSeverityLabel(item.severity) }}</view></view>
                    <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">优先级：</text><view class="priority-tag" :style="{ background: getPriorityColor(item.priority) + '1A', color: getPriorityColor(item.priority) }">{{ getPriorityLabel(item.priority) }}</view></view>
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">责任人：</text>
                        <view v-if="(item.assignees || []).length" class="assignee-list">
                            <view v-for="a in item.assignees" :key="a.id" class="assignee-chip" :style="{ background: getAssigneeStatusColor(a.status) + '1A', color: getAssigneeStatusColor(a.status) }">{{ a.assigneeName || a.assignee }}·{{ getAssigneeStatusLabel(a.status) }}</view>
                        </view>
                        <text v-else class="assignee-empty" :style="{ color: '#f5222d' }">待指派/认领</text>
                    </view>
                    <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">发生时间：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.sendTime || '-' }}</text></view>
                </view>
                <view class="item-footer">
                    <view class="footer-left">
                        <text class="footer-text" :style="{ color: isDark ? '#8a9099' : '#999' }">创建人：{{ item.createrName || '-' }}</text>
                        <text class="footer-text" :style="{ color: isDark ? '#8a9099' : '#999' }">{{ item.dbtime || '-' }}</text>
                    </view>
                    <view class="footer-right">
                        <text class="footer-text" :style="{ color: isDark ? '#8a9099' : '#999' }" v-if="item.testerName || item.tester">测试：{{ item.testerName || item.tester }}</text>
                    </view>
                </view>
            </view>
            <wd-loadmore :state="state" @reload="getDataList" />
        </view>
        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20rpx', padding: '80rpx 0', background: isDark ? '#2a2a2a' : '#fff', borderRadius: '20rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无数据" />
        </view>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { onReady, onPullDownRefresh, onReachBottom, onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { useMessage } from 'wot-design-uni';
import { fetchRdDefectPage, fetchRdProjectListPage } from "@/service/rddefect";
import { fetchGetAllUserDataList } from "@/service/member";
import {
    defectStatusMap,
    defectStatusOptions,
    defectStatusColorMap,
    defectPriorityMap,
    defectPriorityColorMap,
    defectSeverityMap,
    defectSeverityColorMap,
    defectSourceMap,
    defectRdtypeMap,
    defectAssigneeStatusMap,
    defectAssigneeStatusColorMap,
    mergeExtraUsers
} from "./constants";

const userId = ref<number>(uni.getStorageSync("userId"));
const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const message = useMessage();
const clickLock = ref<boolean>(false);
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const listLoading = ref<boolean>(false);
let pendingReload = false;
const topFixedHeight = ref<number>(200);
const showMoreFilters = ref<boolean>(false);
const fuzzy = ref<string>('');
const projectList = ref<any[]>([]);
const selectedProject = ref<any>(null);
const userOptions = ref<any[]>([]);
const selectedAssignee = ref<any>(null);
const testerOptions = ref<any[]>([]);
const selectedTester = ref<any>(null);
const statusOptions = computed(() => [{ label: '全部', value: -1 }, ...defectStatusOptions]);
const selectedStatus = ref<any>(null);
const startDate = ref<string>('');
const endDate = ref<string>('');
const model = ref({ page: 1, limit: 20, projectId: null as number | null, fuzzy: '', status: null as number | null, assignee: null as number | null, tester: null as number | null, startDate: '', endDate: '' });

async function getProjectList() { try { const data = await fetchRdProjectListPage({ page: 1, limit: 200 } as any); projectList.value = [{ id: null as any, rdname: '全部' }, ...(data.list || [])]; } catch (err) { console.error('获取产品列表失败', err); } }
async function getUserList() {
    try {
        const data: any = await fetchGetAllUserDataList({ page: 1, limit: 200, usertypes: '5' });
        const list = (data.list || []).filter((item: any) => item.status == 0);
        userOptions.value = [{ id: null as any, username: '全部' }, ...mergeExtraUsers(list)];
    } catch (err) { console.error('获取用户列表失败', err); }
}
async function getTesterList() {
    try {
        const data: any = await fetchGetAllUserDataList({ page: 1, limit: 200, usertypes: '8' });
        const list = (data.list || []).filter((item: any) => item.status == 0);
        testerOptions.value = [{ id: null as any, username: '全部' }, ...list];
    } catch (err) { console.error('获取测试人员列表失败', err); }
}

// 获取缺陷列表（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
async function getDataList() {
    if (listLoading.value) { pendingReload = true; return; }
    listLoading.value = true;
    try {
        if (model.value.page === 1) dataList.value = [];
        const params: any = { page: model.value.page, limit: model.value.limit };
        if (model.value.projectId) params.projectId = model.value.projectId;
        if (model.value.fuzzy) params.fuzzy = model.value.fuzzy;
        if (model.value.status !== null && model.value.status !== -1) params.status = model.value.status;
        if (model.value.assignee) params.assignee = model.value.assignee;
        if (model.value.tester) params.tester = model.value.tester;
        if (model.value.startDate) params.startDate = model.value.startDate;
        if (model.value.endDate) params.endDate = model.value.endDate;
        const data = await fetchRdDefectPage(params);
        dataList.value = dataList.value.concat(data.list || []);
        total.value = Number(data.total);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) { pendingReload = false; getDataList(); }
    }
}

function handleProjectChange(e: any) { const idx = e.detail.value; const project = projectList.value[idx]; selectedProject.value = project; model.value.projectId = project?.id ?? null; model.value.page = 1; getDataList(); }
function handleStatusChange(e: any) { const idx = e.detail.value; selectedStatus.value = statusOptions.value[idx]; model.value.status = selectedStatus.value?.value ?? null; if (model.value.status === -1) model.value.status = null; model.value.page = 1; getDataList(); }
function handleAssigneeChange(e: any) { const idx = e.detail.value; selectedAssignee.value = userOptions.value[idx]; model.value.assignee = selectedAssignee.value?.id ?? null; model.value.page = 1; getDataList(); }
function handleTesterChange(e: any) { const idx = e.detail.value; selectedTester.value = testerOptions.value[idx]; model.value.tester = selectedTester.value?.id ?? null; model.value.page = 1; getDataList(); }
function handleStartDateChange(e: any) { startDate.value = e.detail.value; model.value.startDate = e.detail.value; model.value.page = 1; getDataList(); }
function handleEndDateChange(e: any) { endDate.value = e.detail.value; model.value.endDate = e.detail.value; model.value.page = 1; getDataList(); }
function resetFilters() {
    selectedProject.value = null;
    selectedStatus.value = null;
    selectedAssignee.value = null;
    selectedTester.value = null;
    startDate.value = '';
    endDate.value = '';
    fuzzy.value = '';
    model.value = { page: 1, limit: 20, projectId: null, fuzzy: '', status: null, assignee: null, tester: null, startDate: '', endDate: '' };
    getDataList();
}
function handleSearch() { model.value.fuzzy = fuzzy.value; model.value.page = 1; getDataList(); }
function handleClearFuzzy() { fuzzy.value = ''; model.value.fuzzy = ''; model.value.page = 1; getDataList(); }
function toggleMoreFilters() { showMoreFilters.value = !showMoreFilters.value; setTimeout(() => { recalcTopFixedHeight(); }, 50); }
function getStatusLabel(status: number) { return defectStatusMap[status] ?? '未知'; }
function getStatusColor(status: number) { return defectStatusColorMap[status] ?? '#909399'; }
function getPriorityLabel(priority: number) { return defectPriorityMap[priority] ?? '-'; }
function getPriorityColor(priority: number) { return defectPriorityColorMap[priority] ?? '#909399'; }
function getSeverityLabel(severity: number) { return defectSeverityMap[severity] ?? '-'; }
function getSeverityColor(severity: number) { return defectSeverityColorMap[severity] ?? '#909399'; }
function getSourceLabel(source: number) { return defectSourceMap[source] ?? '-'; }
function getRdtypeLabel(rdtype: number) { return defectRdtypeMap[rdtype] ?? '-'; }
function getAssigneeStatusLabel(status: any) { return defectAssigneeStatusMap[Number(status)] ?? '-'; }
function getAssigneeStatusColor(status: any) { return defectAssigneeStatusColorMap[Number(status)] ?? '#909399'; }
function handleClickLeft() { uni.navigateBack(); }
function handleAddDefect() { if (clickLock.value) return; clickLock.value = true; uni.navigateTo({ url: '/mePages/rddefect/add/Index' }); setTimeout(() => { clickLock.value = false; }, 500); }
function handleViewDetail(row: any) { if (clickLock.value) return; clickLock.value = true; uni.navigateTo({ url: '/mePages/rddefect/detail/Index?id=' + row.id }); setTimeout(() => { clickLock.value = false; }, 500); }

function recalcTopFixedHeight() { uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => { if (rect && rect.height !== undefined) topFixedHeight.value = rect.height; if (topFixedHeight.value === 0) topFixedHeight.value = 220; }).exec(); }
function refreshList() { model.value.page = 1; dataList.value = []; getDataList(); }
onMounted(() => { uni.$on('refreshRdDefectList', refreshList); });
// 支持外部入口预置状态筛选（如研发首页缺陷统计胶囊 ?status=2 处理中 / ?status=5 测试中）
onLoad((options: any) => {
    const st = options?.status;
    if (st != null && st !== '') {
        const num = Number(st);
        const hit = statusOptions.value.find((s: any) => s.value === num);
        if (hit) selectedStatus.value = hit;
        model.value.status = num;
    }
});
onReady(() => { recalcTopFixedHeight(); });
onPullDownRefresh(() => { model.value.page = 1; getDataList(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (!listLoading.value && dataList.value.length < total.value) { model.value.page++; getDataList(); } else if (dataList.value.length === total.value) { state.value = 'finished'; } });
onMounted(() => { getProjectList(); getUserList(); getTesterList(); getDataList(); });
</script>
<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    background-color: #fff;
    box-sizing: border-box;
}

.search-row {
    display: flex;
    align-items: center;
    padding: 12rpx 20rpx;
    gap: 12rpx;
}

.search-input-wrap {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 32rpx;
    padding: 0 20rpx;
    height: 64rpx;
}

.search-input {
    flex: 1;
    font-size: 28rpx;
}

.clear-btn {
    position: absolute;
    right: 24rpx;
    font-size: 36rpx;
    color: #999;
    line-height: 1;
}

.btn-group {
    display: flex;
    gap: 12rpx;
}

.filter-wrap {
    padding: 0 20rpx 12rpx;
}

.filter-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 12rpx;
}

.filter-item {
    flex: 1;
}

.filter-label {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
}

.filter-value {
    padding: 16rpx 20rpx;
    background: #f5f5f5;
    border-radius: 16rpx;
    font-size: 26rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.filter-reset-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12rpx;
}

.summary-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 24rpx 16rpx;
}

.summary-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
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

.list-item {
    padding: 24rpx;
    margin-bottom: 20rpx;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16rpx;
}

.item-title {
    font-size: 30rpx;
    font-weight: 600;
    flex: 1;
    margin-right: 16rpx;
    color: #1a1a1a;
}

.status-tag {
    padding: 6rpx 16rpx;
    border-radius: 16rpx;
    font-size: 22rpx;
    white-space: nowrap;
}

.item-info {
    margin-bottom: 16rpx;
    padding: 16rpx;
    background: #fafafa;
    border-radius: 12rpx;
}

.info-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 10rpx;
    font-size: 26rpx;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-label {
    color: #999;
    min-width: 180rpx;
    flex-shrink: 0;
    line-height: 40rpx;
}

.assignee-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
}

.assignee-chip {
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    line-height: 32rpx;
}

.assignee-empty {
    font-size: 26rpx;
    line-height: 40rpx;
}

.priority-tag,
.severity-tag {
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    line-height: 32rpx;
}

.item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.footer-text {
    font-size: 22rpx;
    color: #999;
}

.footer-right {
    display: flex;
    gap: 12rpx;
}
</style>
