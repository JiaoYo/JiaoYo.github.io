<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow title="研发满意度" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <scroll-view scroll-y class="scroll-content" @scrolltolower="loadMore">
            <view class="page-inner">
                <!-- 角色提示 -->
                <view class="role-tip" :style="{ background: isDark ? '#2a2a2a' : '#f0f7ff', color: isDark ? '#8a9099' : '#646566' }">{{ roleTip }}</view>

                <!-- 月份步进 + 筛选 -->
                <view class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <view class="month-row">
                        <view class="month-arrow" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click="stepMonth(-1)">◀</view>
                        <picker mode="date" fields="month" :value="monthText" @change="handleMonthPick">
                            <view class="month-text" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ monthText || '全部月份' }}</view>
                        </picker>
                        <view class="month-arrow" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click="stepMonth(1)">▶</view>
                        <view v-if="surveyMonth" class="month-clear" :style="{ color: isDark ? '#8a9099' : '#999' }" @click="clearMonth">清除</view>
                    </view>
                    <view class="filter-row">
                        <picker v-if="!isRd" mode="selector" :range="rdOptions" range-key="username" @change="handleRdChange">
                            <view class="filter-picker" :style="{ background: isDark ? '#333' : '#f5f5f5', color: isDark ? '#c9cdd4' : '#323233' }">研发：{{ selectedRdName || '全部' }} <text class="arrow">›</text></view>
                        </picker>
                        <picker mode="selector" :range="statusOptions" range-key="label" @change="handleStatusChange">
                            <view class="filter-picker" :style="{ background: isDark ? '#333' : '#f5f5f5', color: isDark ? '#c9cdd4' : '#323233' }">{{ statusLabel }} <text class="arrow">›</text></view>
                        </picker>
                    </view>
                </view>

                <!-- 统计卡片 -->
                <view class="stats-row">
                    <view v-for="tile in statTiles" :key="tile.label" class="stat-tile" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                        <view class="stat-icon" :style="{ background: tile.bg, color: tile.color }">{{ tile.icon }}</view>
                        <view>
                            <view class="stat-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ tile.label }}</view>
                            <view class="stat-value" :style="{ color: tile.color }">{{ tile.value }}</view>
                            <view class="stat-sub" :style="{ color: isDark ? '#6a6a6a' : '#999' }">{{ tile.subtitle }}</view>
                        </view>
                    </view>
                </view>
                <!-- 五维均分 -->
                <view class="dims-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <view class="dims-title" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">五维均分</view>
                    <view class="dims-row">
                        <view v-for="dim in DIMENSIONS" :key="dim.field" class="dim-inline">
                            <text class="dim-name" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ dim.label }}</text>
                            <text class="dim-val" :style="{ color: dimColor(dim.avgField) }">{{ dimScore(dim.avgField) }}</text>
                        </view>
                    </view>
                </view>

                <!-- 列表 -->
                <view v-if="dataList.length > 0" class="list-wrap">
                    <view v-for="item in dataList" :key="item.id" class="list-item" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click="canScore ? openScore(item) : openView(item)">
                        <view class="item-head">
                            <text class="item-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ item.rdUserName || '-' }}</text>
                            <view class="status-tag" :style="item.status === 1 ? { background: 'rgba(82,196,26,0.15)', color: '#52c41a' } : { background: 'rgba(250,140,22,0.15)', color: '#fa8c16' }">{{ item.status === 1 ? '已人工评价' : '待评价' }}</view>
                        </view>
                        <view class="item-meta" :style="{ color: isDark ? '#8a9099' : '#969799' }">
                            <text>调查月份：{{ formatSurveyMonth(item.surveyMonth) }}</text>
                            <text v-if="isRd || isAdmin">评价人：{{ isRd ? '匿名' : (item.evaluatorName || '-') }}</text>
                        </view>
                        <view v-if="item.overallScore !== null && item.overallScore !== undefined" class="item-score">
                            <text class="score-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">综合得分</text>
                            <text class="score-num" :style="{ color: scoreColor(item.overallScore) }">{{ Number(item.overallScore).toFixed(2) }}</text>
                        </view>
                        <view v-if="item.feedback" class="item-feedback" :style="{ color: isDark ? '#c9cdd4' : '#646566', background: isDark ? '#1b1b1b' : '#fafafa' }">{{ item.feedback }}</view>
                        <view class="item-foot">
                            <text class="foot-time" :style="{ color: isDark ? '#6a6a6a' : '#999' }">{{ item.dbtime || '' }}</text>
                            <view class="foot-btn" :style="{ color: '#1677ff' }">{{ canScore ? '去评价 ›' : '查看 ›' }}</view>
                        </view>
                    </view>
                    <wd-loadmore :state="listState" />
                </view>
                <view v-else-if="!listLoading" class="empty-wrap" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <wd-status-tip image="../../static/search.png" tip="暂无评价记录" />
                </view>
            </view>
        </scroll-view>

    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetRdSatisfactionPage, fetchGetRdSatisfactionStats } from '@/service/rdSatisfaction';
import { fetchGetAllUserDataList } from '@/service/member';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh; background: #f5f6f8;';
    return 'min-height: 100vh; background: #1b1b1b;';
});

const userType = ref<number>(Number(uni.getStorageSync('usertype')));
// 角色规则：1/2/3/9 评价人；5 研发（匿名查看）；0/4 管理岗（看全部）
const isEvaluator = computed(() => [1, 2, 3, 9].includes(userType.value));
const isRd = computed(() => userType.value === 5);
const isAdmin = computed(() => userType.value === 0 || userType.value === 4);
const hasAccess = computed(() => isEvaluator.value || isRd.value || isAdmin.value);
const canScore = computed(() => isEvaluator.value);

const roleTip = computed(() => {
    if (isEvaluator.value) return '默认展示全部记录，可按研发和状态筛选；调查默认各项均为5分，如无调整可不填写、直接跳过即可。';
    if (isRd.value) return '以下为其他同事对您的评价，评价人已匿名；记录未填写时按默认满分5分计入汇总。';
    return '管理岗可查看全部人员的调查数据；均分统计包含默认满分记录。';
});

/** 五个评分维度，顺序与接口字段/统计字段一致 */
const DIMENSIONS = [
    { field: 'responseSpeed', avgField: 'averageResponseSpeed', label: '响应速度', desc: '需求/问题响应是否及时，反馈速度是否满足预期' },
    { field: 'communicationEfficiency', avgField: 'averageCommunicationEfficiency', label: '沟通效率', desc: '沟通是否顺畅高效，信息传递是否清晰准确' },
    { field: 'problemSolvingEfficiency', avgField: 'averageProblemSolvingEfficiency', label: '问题解决效率', desc: '问题定位与解决的速度和效果，是否闭环' },
    { field: 'productUsability', avgField: 'averageProductUsability', label: '产品易用性', desc: '功能设计是否合理，操作是否便捷易上手' },
    { field: 'productStability', avgField: 'averageProductStability', label: '产品稳定性', desc: '系统运行是否稳定，是否存在频繁异常或数据错误' }
];

function formatSurveyMonth(month: number | null | undefined) {
    if (month === null || month === undefined || !String(month).match(/^\d{6}$/)) return month ? String(month) : '-';
    const s = String(month);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}`;
}
function lastMonthYm() {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return Number(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
}
function shiftMonth(fromYm: number | undefined, delta: number) {
    const base = fromYm && /^\d{6}$/.test(String(fromYm)) ? String(fromYm) : String(new Date().getFullYear()) + String(new Date().getMonth() + 1).padStart(2, '0');
    const target = new Date(Number(base.slice(0, 4)), Number(base.slice(4, 6)) - 1 + delta, 1);
    return Number(`${target.getFullYear()}${String(target.getMonth() + 1).padStart(2, '0')}`);
}

// ==================== 筛选状态 ====================
const surveyMonth = ref<number | undefined>(lastMonthYm());
const monthText = computed(() => surveyMonth.value ? formatSurveyMonth(surveyMonth.value) : '');
const selectedRd = ref<number | null>(null);
const selectedRdName = ref('');
const statusVal = ref<number | null>(null);
const statusOptions = [{ label: '全部状态', value: null as any }, { label: '待评价', value: 0 }, { label: '已人工评价', value: 1 }];
const statusLabel = computed(() => statusOptions.find(o => o.value === statusVal.value)?.label || '全部状态');
const rdOptions = ref<any[]>([]);

function handleMonthPick(e: any) {
    const v = e.detail.value; // yyyy-MM
    surveyMonth.value = v ? Number(v.replace('-', '')) : undefined;
    reload();
}
function stepMonth(delta: number) {
    surveyMonth.value = shiftMonth(surveyMonth.value, delta);
    reload();
}
function clearMonth() { surveyMonth.value = undefined; reload(); }
function handleRdChange(e: any) {
    const u = rdOptions.value[e.detail.value];
    selectedRd.value = u?.id ?? null;
    selectedRdName.value = u?.username || '';
    reload();
}
function handleStatusChange(e: any) {
    statusVal.value = statusOptions[e.detail.value]?.value ?? null;
    reload();
}

async function getRdUsers() {
    if (isRd.value) return;
    try {
        const data: any = await fetchGetAllUserDataList({ page: 1, limit: 500, usertypes: '5' } as any);
        rdOptions.value = [{ id: null, username: '全部研发' }, ...((data.list || []).filter((u: any) => u.status == 0))];
    } catch (err) { console.error('获取研发列表失败', err); }
}

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
        if (surveyMonth.value) params.surveyMonth = surveyMonth.value;
        if (!isRd.value && selectedRd.value) params.rdUserId = selectedRd.value;
        if (statusVal.value !== null) params.status = statusVal.value;
        const data: any = await fetchGetRdSatisfactionPage(params);
        dataList.value = dataList.value.concat(data.list || []);
        total.value = Number(data.total) || 0;
        listState.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取满意度列表失败', err);
        listState.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) { pendingReload = false; getDataList(); }
    }
}
function reload() { page.value = 1; getDataList(); getStats(); }
function loadMore() { if (!listLoading.value && dataList.value.length < total.value) { page.value++; getDataList(); } }

// ==================== 统计 ====================
const stats = ref<any>(null);
async function getStats() {
    try {
        const params: any = {};
        if (surveyMonth.value) params.surveyMonth = surveyMonth.value;
        if (!isRd.value && selectedRd.value) params.rdUserId = selectedRd.value;
        stats.value = await fetchGetRdSatisfactionStats(params);
    } catch (err) { console.error('获取满意度统计失败', err); }
}
const statTiles = computed(() => {
    const t = stats.value?.totalCount ?? 0;
    const m = stats.value?.modifiedCount ?? 0;
    const rate = t > 0 ? Math.round((m / t) * 100) : 0;
    return [
        { label: '评价任务', value: stats.value?.totalCount ?? '-', color: '#2080f0', bg: 'rgba(32,128,240,0.12)', icon: '📋', subtitle: '当月生成' },
        { label: '默认满分', value: stats.value?.defaultCount ?? '-', color: '#f0a020', bg: 'rgba(240,160,32,0.12)', icon: '⭐', subtitle: '未人工调整' },
        { label: '已人工评价', value: stats.value?.modifiedCount ?? '-', color: '#18a058', bg: 'rgba(24,160,88,0.12)', icon: '✅', subtitle: `完成率 ${rate}%` },
        { label: '综合均分', value: stats.value?.averageOverallScore != null ? Number(stats.value.averageOverallScore).toFixed(2) : '-', color: '#d03050', bg: 'rgba(208,48,80,0.12)', icon: '📊', subtitle: '五维平均' }
    ];
});
function dimScore(avgField: string) {
    const v = stats.value?.[avgField];
    return v !== null && v !== undefined ? Number(v).toFixed(2) : '-';
}
function dimColor(avgField: string) {
    const v = stats.value?.[avgField];
    if (v === null || v === undefined) return '#ccc';
    const n = Number(v);
    if (n >= 4.5) return '#18a058';
    if (n >= 4) return '#2080f0';
    if (n >= 3) return '#f0a020';
    return '#d03050';
}
function scoreColor(v: number) {
    const n = Number(v);
    if (n >= 4.5) return '#18a058';
    if (n >= 4) return '#2080f0';
    if (n >= 3) return '#f0a020';
    return '#d03050';
}

// ==================== 评价/查看（跳独立页面） ====================
function openScore(row: any) {
    uni.navigateTo({ url: '/mePages/rdSatisfaction/edit/Index' });
    setTimeout(() => uni.$emit('rdSatisfaction_row', { row, view: false }), 100);
}
function openView(row: any) {
    uni.navigateTo({ url: '/mePages/rdSatisfaction/edit/Index' });
    setTimeout(() => uni.$emit('rdSatisfaction_row', { row, view: true }), 100);
}

function handleClickLeft() { uni.navigateBack(); }

function onRefresh() { reload(); }

onLoad(() => {
    if (!hasAccess.value) { uni.showToast({ title: '当前账号无需参与研发满意度调查', icon: 'none' }); return; }
    getDataList();
    getStats();
    getRdUsers();
    uni.$on('rdSatisfaction_refresh', onRefresh);
});
onUnload(() => {
    uni.$off('rdSatisfaction_refresh', onRefresh);
});
</script>

<style lang="scss" scoped>
.scroll-content { height: calc(100vh - 88rpx); }
.page-inner { padding: 20rpx; }
.role-tip { padding: 20rpx 24rpx; border-radius: 12rpx; font-size: 24rpx; line-height: 1.6; margin-bottom: 20rpx; }
.filter-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.month-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.month-arrow { font-size: 30rpx; padding: 6rpx 14rpx; }
.month-text { font-size: 30rpx; font-weight: 600; }
.month-clear { font-size: 24rpx; margin-left: auto; }
.filter-row { display: flex; gap: 16rpx; }
.filter-picker { flex: 1; padding: 16rpx 20rpx; border-radius: 12rpx; font-size: 26rpx; display: flex; justify-content: space-between; align-items: center; }
.filter-picker .arrow { color: #c8c9cc; }
.stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; margin-bottom: 20rpx; }
.stat-tile { display: flex; align-items: center; gap: 16rpx; border-radius: 16rpx; padding: 20rpx; }
.stat-icon { width: 72rpx; height: 72rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 36rpx; flex-shrink: 0; }
.stat-label { font-size: 22rpx; }
.stat-value { font-size: 34rpx; font-weight: 700; line-height: 1.2; }
.stat-sub { font-size: 20rpx; }
.dims-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.dims-title { font-size: 28rpx; font-weight: 600; margin-bottom: 16rpx; }
.dims-row { display: flex; justify-content: space-between; }
.dim-inline { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.dim-name { font-size: 22rpx; }
.dim-val { font-size: 30rpx; font-weight: 700; }
.list-item { border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.item-name { font-size: 30rpx; font-weight: 600; }
.status-tag { padding: 4rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; }
.item-meta { display: flex; gap: 24rpx; font-size: 24rpx; margin-bottom: 12rpx; flex-wrap: wrap; }
.item-score { display: flex; align-items: baseline; gap: 12rpx; margin-bottom: 12rpx; }
.score-label { font-size: 24rpx; }
.score-num { font-size: 36rpx; font-weight: 700; }
.item-feedback { font-size: 26rpx; border-radius: 12rpx; padding: 16rpx; margin-bottom: 12rpx; line-height: 1.5; }
.item-foot { display: flex; justify-content: space-between; align-items: center; }
.foot-time { font-size: 22rpx; }
.foot-btn { font-size: 26rpx; }
.empty-wrap { border-radius: 16rpx; padding: 80rpx 0; }
</style>
