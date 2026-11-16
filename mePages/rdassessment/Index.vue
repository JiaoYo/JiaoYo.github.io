<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow title="研发考核" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <view class="filter-bar">
                <view class="filter-item">
                    <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">考核周期</text>
                    <view class="cycle-wrap">
                        <view v-if="userType != 5 && userType != 8" class="cycle-step" :style="{ color: isDark ? '#8a9099' : '#909399' }" @click="handleStepCycle(-1)">◀</view>
                        <picker mode="date" :value="model.evaluationcycle" fields="month" @change="handleCycleChange" :disabled="userType == 5 || userType == 8" class="cycle-picker">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ model.evaluationcycle || '请选择' }}</view>
                        </picker>
                        <view v-if="userType != 5 && userType != 8" class="cycle-step" :style="{ color: isDark ? '#8a9099' : '#909399' }" @click="handleStepCycle(1)">▶</view>
                    </view>
                </view>
                <view class="filter-item" v-if="userType === 0 || userType === 4">
                    <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">部门</text>
                    <picker mode="selector" :range="deptList" range-key="label" @change="handleDeptChange">
                        <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ deptList.find(d => d.value === model.dept)?.label || '全部' }}</view>
                    </picker>
                </view>
            </view>
            <view class="search-bar" v-if="userType === 0 || userType === 4">
                <view class="filter-item" style="flex:1;">
                    <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">被考核人</text>
                    <picker mode="selector" :range="userList" range-key="username" @change="handleUserChange">
                        <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedUser?.username || '全部' }}</view>
                    </picker>
                </view>
            </view>
            <view class="summary-bar">
                <view class="summary-chip" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#f0f1f3', color: isDark ? '#8a9099' : '#4e5969' }">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</view>
                <view class="summary-right">
                    <view v-if="model.evaluationcycle && model.evaluationcycle < '2026-09'" class="old-data-tag" :style="{ background: isDark ? 'rgba(250, 140, 21, 0.16)' : '#fff7e6', color: isDark ? '#ffc53d' : '#fa8c16' }">旧版数据</view>
                    <wd-button size="small" type="primary" plain @click="handleSearch">查询</wd-button>
                </view>
            </view>
        </view>
        <view style="margin: 10rpx;" :style="listVars">
            <view v-if="dataList.length > 0">
                <view v-for="item in dataList" :key="item.id" class="list-item">
                    <view class="item-header">
                        <view class="header-main">
                            <view class="item-title">{{ item.username || '-' }}</view>
                            <view class="item-sub">{{ (getDeptName(item.dept) || '未分配部门') + ' · ' + (item.evaluationcycle || '-') }}</view>
                        </view>
                    </view>
                    <view class="status-bar" :style="{ background: getStatusStyle(item.status).bg }">
                        <text class="status-dot" :style="{ background: getStatusStyle(item.status).color }"></text>
                        <text class="status-text" :style="{ color: getStatusStyle(item.status).color }">{{ getStatusStyle(item.status).text }}</text>
                    </view>
                    <view class="score-panel">
                        <view class="score-cell self">
                            <text class="score-cell-label">自评分</text>
                            <view class="score-cell-value" :class="{ 'low-score': isLowScore(item.s0) }">{{ item.s0 ?? '-' }}</view>
                        </view>
                        <view class="score-cell dept">
                            <text class="score-cell-label">部门评分</text>
                            <view class="score-cell-value-row">
                                <view class="score-cell-value" :class="{ 'low-score': (item.d0 == 0 && item.d0 !== '') || isLowScore(item.d0) }">{{ d0Display(item) }}</view>
                                <text v-if="d0Level(item)" class="level-tag" :style="{ color: d0Level(item).color, background: d0Level(item).color + '1a' }">{{ d0Level(item).text }}</text>
                            </view>
                        </view>
                    </view>
                    <view v-if="item.notes" class="note-line">
                        <text class="note-label">备注</text>
                        <text class="note-text">{{ item.notes }}</text>
                    </view>
                    <view class="item-footer">
                        <wd-button v-if="canOperate(item)" type="success" size="small" plain @click.stop="handleViewDetail(item)"> {{ getOperateText(item) }} </wd-button>
                        <wd-button v-else-if="item.status != 0 && (item.status != 4 || userType == 0 || userType == 4)" type="primary" size="small" plain @click.stop="handleViewDetail(item)">考核详情</wd-button>
                    </view>
                </view>
                <wd-loadmore :state="state" @reload="getDataList" />
            </view>
            <view v-else style="display: flex; justify-content: center; align-items: center; padding: 80rpx 0;">
                <wd-status-tip image="../../static/search.png" tip="暂无数据" />
            </view>
        </view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { onLoad, onReady, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetProjectAssessmentListByPage, fetchGetProjectAssessmentNewListByPage } from '@/service/rdassessment';
import { fetchGetAllUserDataList } from '@/service/index';
import { hasPermission } from '@/utils/index';

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
const topFixedHeight = ref<number>(200);
const userList = ref<any[]>([]);
const selectedUser = ref<any>(null);

const model = ref({
    page: 1, limit: 20, evaluationcycle: '', dept: null as number | null, creater: null as number | null
});

// 考核版本: 默认先调新版接口，新版查不到数据自动回退 old（getDataList 内统一处理并切换 apiVersion，口径同 web）；
// 两版仅接口与低分阈值(80/70)不同，模板/详情接口跟随 apiVersion 走同一版本
const apiVersion = ref<'old' | 'new'>('new');
const scoreThreshold = computed(() => (apiVersion.value === 'new' ? 70 : 80));

function isLowScore(val: any): boolean {
    if (val === null || val === undefined || val === '') return false;
    const n = Number(val);
    return !Number.isNaN(n) && n < scoreThreshold.value;
}

// 考核等级（以部门评分为准，口径同 web getAssessLevel）：<70 不合格；70~78 有待改进；79~91 良；≥92 优
function getAssessLevel(score: number): { text: string; color: string } | null {
    // null/undefined/空串先排除：Number(null)=0 会误判不合格，非数值会落进默认分支
    if (score == null || Number.isNaN(Number(score))) return null;
    if (score < 70) return { text: '不合格', color: '#f5222d' };
    if (score < 79) return { text: '有待改进', color: '#fa8c16' };
    if (score < 92) return { text: '良', color: '#1890ff' };
    return { text: '优', color: '#52c41a' };
}

// d0 为 0/'0' 时列表已显示「不合格」，不再追加等级；空分数不追加（口径同 web 列渲染）
function d0Level(item: any) {
    if (item.d0 === null || item.d0 === undefined || item.d0 === '' || item.d0 === 0 || item.d0 === '0') return null;
    return getAssessLevel(Number(item.d0));
}

// 部门评分展示：0/'0' 显「不合格」，空显占位
function d0Display(item: any): string {
    return item.d0 == 0 && item.d0 !== '' ? '不合格' : (item.d0 ?? '-');
}

// 卡片配色 CSS 变量：暗黑换深底亮字（详情页 --rd-* 同款方案）
const listVars = computed<Record<string, string>>(() => isDark.value ? {
    '--li-card-bg': '#2a2a2a',
    '--li-title': '#e8e8e8',
    '--li-sub': '#8a9099',
    '--li-line': 'rgba(255, 255, 255, 0.08)',
    '--li-note-bg': 'rgba(255, 255, 255, 0.06)',
    '--li-note-text': '#a8b0bc',
    '--li-cell1': 'rgba(250, 140, 21, 0.14)',
    '--li-cell2': 'rgba(114, 46, 209, 0.16)',
    '--li-shadow': 'none'
} : {
    '--li-card-bg': '#ffffff',
    '--li-title': '#1a1a1a',
    '--li-sub': '#969799',
    '--li-line': '#f0f1f3',
    '--li-note-bg': '#f7f8fa',
    '--li-note-text': '#4e5969',
    '--li-cell1': 'rgba(250, 140, 21, 0.07)',
    '--li-cell2': 'rgba(114, 46, 209, 0.07)',
    '--li-shadow': '0 2rpx 8rpx rgba(0, 0, 0, 0.05)'
});

function getCurrentMonth(): string {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

// 考核周期按月步进，步进不能越过上个月（口径同 web stepMonth）；选择框禁用（5/8）时不可步进
function handleStepCycle(step: number) {
    if (userType.value == 5 || userType.value == 8) return;
    const cur = model.value.evaluationcycle || getCurrentMonth();
    const parts = String(cur).split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1 + step, 1);
    const target = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const max = last.getFullYear() + '-' + String(last.getMonth() + 1).padStart(2, '0');
    if (target > max) return;
    model.value.evaluationcycle = target;
    model.value.page = 1;
    getDataList();
}

const deptList = [
    { label: '全部', value: null as any },
    { label: '平台', value: 0 },
    { label: '数据通讯', value: 1 },
    { label: '网络安全', value: 2 }
];

// 状态标签：文案单份维护，配色按主题拆分（暗黑用半透明深底+亮字，浅色用浅底深字，口径同 web statusTagMap）
const statusMap: any = {
    0: {
        text: '被考核人未提交',
        light: { bg: '#f4f4f5', color: '#909399' },
        dark: { bg: 'rgba(255, 255, 255, 0.09)', color: '#a8b0bc' }
    },
    1: {
        text: '待部门负责人确认',
        light: { bg: '#fff7e6', color: '#fa8c16' },
        dark: { bg: 'rgba(212, 136, 6, 0.16)', color: '#ffc53d' }
    },
    2: {
        text: '待综合管理部确认',
        light: { bg: '#f9f0ff', color: '#722ed1' },
        dark: { bg: 'rgba(114, 46, 209, 0.22)', color: '#b37feb' }
    },
    3: {
        text: '待被考核人确认',
        light: { bg: '#e6f7ff', color: '#1890ff' },
        dark: { bg: 'rgba(24, 144, 255, 0.18)', color: '#69b1ff' }
    },
    4: {
        text: '完成',
        light: { bg: '#f6ffed', color: '#52c41a' },
        dark: { bg: 'rgba(82, 196, 26, 0.16)', color: '#73d13d' }
    },
    unknown: {
        text: '未知',
        light: { bg: '#f4f4f5', color: '#909399' },
        dark: { bg: 'rgba(255, 255, 255, 0.09)', color: '#a8b0bc' }
    }
};

function getLastMonth(): string {
    const date = new Date();
    const last = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return last.getFullYear() + '-' + String(last.getMonth() + 1).padStart(2, '0');
}

function getDeptName(dept: number): string {
    return { 0: '平台', 1: '数据通讯', 2: '网络安全' }[dept] || '';
}

function getStatusStyle(status: number) {
    const entry = statusMap[status] || statusMap.unknown;
    // text 挂在 entry 本层（light/dark 只有色值），须合并返回，否则 .text 为 undefined 渲染成空白
    const theme = isDark.value ? entry.dark : entry.light;
    return { text: entry.text, bg: theme.bg, color: theme.color };
}

function canOperate(row: any): boolean {
    // 操作按钮统一挂 project:rd:assessment:update 权限（口径同 web v-no-auth）
    if (!hasPermission('project:rd:assessment:update')) return false;
    if (row.status === 0 && userId.value == row.creater) return true;
    if (row.status === 1) {
        if (userId.value == 999 && row.dept == 0) return true;
        if (userId.value == 1036 && row.dept == 1) return true;
        if (userId.value == 1030 && row.dept == 2) return true;
    }
    if (row.status === 2 && userType.value == 4) return true;
    if (row.status === 3 && userId.value == row.creater) return true;
    return false;
}

function getOperateText(row: any): string {
    if (row.status === 0 && userId.value == row.creater) return '去自评';
    if (row.status === 1) {
        if ((userId.value == 999 && row.dept == 0) || (userId.value == 1036 && row.dept == 1) || (userId.value == 1030 && row.dept == 2)) return '去考核';
    }
    if (row.status === 2 && userType.value == 4) return '去考核';
    if (row.status === 3 && userId.value == row.creater) return '去确认';
    return '考核详情';
}

async function getDataList() {
    if (listLoading.value) { pendingReload = true; return; }
    listLoading.value = true;
    try {
        if (model.value.page === 1) dataList.value = [];
        let params: any = { page: model.value.page, limit: model.value.limit };
        if (model.value.evaluationcycle) params.evaluationcycle = model.value.evaluationcycle;
        if (model.value.dept !== null) params.dept = model.value.dept;
        if (model.value.creater !== null) params.creater = model.value.creater;
        // 默认走新版接口；新版查不到数据（历史月份未迁移）或报错时自动回退旧版并切换 apiVersion，
        // 低分阈值/考核详情模板接口跟随 apiVersion 走同一版本（口径同 web fetchAssessmentList）
        let data: any;
        try {
            data = await fetchGetProjectAssessmentNewListByPage(params);
            const newRows = Array.isArray(data) ? data : (data?.list || []);
            if (newRows.length === 0) {
                apiVersion.value = 'old';
                data = await fetchGetProjectAssessmentListByPage(params);
            } else {
                apiVersion.value = 'new';
            }
        } catch {
            apiVersion.value = 'old';
            data = await fetchGetProjectAssessmentListByPage(params);
        }
        const rows = Array.isArray(data) ? data : (data?.list || []);
        dataList.value = dataList.value.concat(rows);
        total.value = Number(data?.total ?? rows.length);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) { console.error('获取列表失败', err); state.value = 'error'; }
    finally { listLoading.value = false; if (pendingReload) { pendingReload = false; getDataList(); } }
}

function handleCycleChange(e: any) {
    const v = e.detail.value;
    // 考核周期最多只能查到上个月：本月及以后的月份禁选（口径同 web isCycleDateDisabled）
    if (v && v >= getCurrentMonth()) {
        uni.showToast({ title: '考核周期不能选当月及以后', icon: 'none' });
        return;
    }
    model.value.evaluationcycle = v;
    model.value.page = 1;
    getDataList();
}
function handleDeptChange(e: any) { model.value.dept = deptList[e.detail.value]?.value ?? null; model.value.page = 1; getDataList(); }
function handleUserChange(e: any) {
    const user = userList.value[e.detail.value];
    if (user) {
        model.value.creater = user.id;
        selectedUser.value = user;
    } else {
        model.value.creater = null;
        selectedUser.value = null;
    }
    model.value.page = 1;
    getDataList();
}
async function getUserList() {
    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '5,8' });
        userList.value = [{ id: null as any, username: '全部' }, ...(data.list || [])];
    } catch (err) {
        console.error('获取人员列表失败', err);
    }
}
function handleSearch() { model.value.page = 1; getDataList(); }
function handleClear() { model.value.creater = null; selectedUser.value = null; model.value.page = 1; getDataList(); }

function handleClickLeft() { uni.navigateBack(); }

function handleViewDetail(row: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    const rowData = encodeURIComponent(JSON.stringify(row));
    uni.navigateTo({ url: '/mePages/rdassessment/detail/Index?rowData=' + rowData + '&operateType=' + (canOperate(row) ? 'edit' : 'look') + '&isNew=' + (apiVersion.value === 'new' ? 1 : 0) });
    setTimeout(() => { clickLock.value = false; }, 500);
}

function recalcTopFixedHeight() {
    uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => {
        if (rect) topFixedHeight.value = rect.height;
    }).exec();
}

function refreshList() {
    model.value.page = 1;
    dataList.value = [];
    getDataList();
}

onMounted(() => {
    uni.$on('refreshRdAssessmentList', refreshList);
});

onBeforeUnmount(() => {
    uni.$off('refreshRdAssessmentList', refreshList);
});

onLoad(() => {
    if (userId.value == 999) model.value.dept = 0;
    else if (userId.value == 1036) model.value.dept = 1;
    else if (userId.value == 1030) model.value.dept = 2;
    model.value.evaluationcycle = getLastMonth();
    getUserList();
    getDataList();
});
onReady(() => { recalcTopFixedHeight(); });
onPullDownRefresh(() => { model.value.page = 1; getDataList(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (!listLoading.value && dataList.value.length < total.value) { model.value.page++; getDataList(); } else if (dataList.value.length === total.value) { state.value = 'finished'; } });
</script>

<style lang="scss" scoped>
.topFixedWrap { position: fixed; left: 0; top: 0; width: 100%; z-index: 99; background-color: #fff; }
.filter-bar { display: flex; padding: 16rpx 30rpx 12rpx; gap: 20rpx; }
.filter-item { flex: 1; }
.filter-label { display: block; font-size: 24rpx; color: #969799; margin-bottom: 8rpx; }
.filter-value { padding: 16rpx 20rpx; background: #f7f8fa; border-radius: 16rpx; font-size: 26rpx; }
.search-bar { padding: 0 30rpx 8rpx; }
.summary-bar { padding: 0 30rpx 10rpx; display: flex; align-items: center; justify-content: space-between; }
.summary-right { display: flex; align-items: center; gap: 16rpx; }
.cycle-wrap { display: flex; align-items: center; gap: 8rpx; }
.cycle-picker { flex: 1; min-width: 0; }
.cycle-step { flex: 0 0 44rpx; height: 64rpx; line-height: 64rpx; text-align: center; font-size: 20rpx; }
.old-data-tag { padding: 6rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 500; }
.summary-chip { display: inline-block; padding: 8rpx 20rpx; border-radius: 999rpx; background: #f7f8fa; font-size: 24rpx; }
.summary-num { font-weight: 600; color: #1677ff; }
.list-item { position: relative; overflow: hidden; margin-bottom: 16rpx; padding: 24rpx; background: var(--li-card-bg, #fff); border-radius: 20rpx; box-shadow: var(--li-shadow, 0 2rpx 8rpx rgba(0, 0, 0, 0.05)); }
.item-header { display: flex; align-items: center; margin-bottom: 20rpx; }
.header-main { flex: 1; min-width: 0; }
.item-title { font-size: 30rpx; font-weight: 600; color: var(--li-title, #1a1a1a); }
.item-sub { margin-top: 4rpx; font-size: 22rpx; color: var(--li-sub, #969799); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status-bar { display: flex; align-items: center; gap: 10rpx; padding: 12rpx 20rpx; margin-bottom: 16rpx; border-radius: 12rpx; font-size: 24rpx; font-weight: 500; }
.status-dot { flex-shrink: 0; width: 12rpx; height: 12rpx; border-radius: 50%; }
.status-text { font-size: 24rpx; font-weight: 500; }
.score-panel { display: flex; gap: 16rpx; margin-bottom: 16rpx; }
.score-cell { flex: 1; padding: 16rpx 20rpx; border-radius: 14rpx; }
.score-cell.self { background: var(--li-cell1, rgba(250, 140, 21, 0.07)); }
.score-cell.dept { background: var(--li-cell2, rgba(114, 46, 209, 0.07)); }
.score-cell-label { display: block; font-size: 20rpx; color: var(--li-sub, #969799); margin-bottom: 6rpx; }
.score-cell-value { font-size: 36rpx; font-weight: 700; line-height: 1.2; color: var(--li-title, #1a1a1a); }
.score-cell-value-row { display: flex; align-items: center; gap: 12rpx; }
.level-tag { padding: 4rpx 12rpx; border-radius: 999rpx; font-size: 20rpx; font-weight: 600; white-space: nowrap; }
.note-line { display: flex; align-items: flex-start; gap: 12rpx; padding: 14rpx 16rpx; margin-bottom: 16rpx; background: var(--li-note-bg, #f7f8fa); border-radius: 12rpx; }
.note-label { flex-shrink: 0; font-size: 20rpx; color: var(--li-sub, #969799); line-height: 1.7; }
.note-text { flex: 1; font-size: 22rpx; color: var(--li-note-text, #4e5969); line-height: 1.7; word-break: break-all; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.low-score { color: #f5222d !important; }
.item-footer { display: flex; justify-content: flex-end; gap: 12rpx; padding-top: 16rpx; border-top: 1rpx solid var(--li-line, #f0f1f3); }
</style>
