<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#f5f6f8' }">
            <wd-navbar left-arrow title="工程考核中心" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <!-- 类别页签：经理/组长/阶梯奖金共用同一接口仅 assessmentType 不同；仅一个可见页签时不显示页签栏 -->
            <wd-tabs v-if="visibleTabs.length > 1" v-model="activeTab" @change="handleTabChange">
                <wd-tab v-for="t in visibleTabs" :key="t.type" :name="t.type" :title="t.title" />
            </wd-tabs>

            <!-- 开放窗口栏：窗口状态、剩余时间、DEFAULT/MANUAL 标识 + 管理操作（1022/管理员，且具备窗口/生成权限） -->
            <view class="window-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="win-row">
                    <text class="win-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pageTitle }}</text>
                    <view class="win-tag" :style="windowStateStyle">窗口{{ windowStateText }}</view>
                    <view v-if="remainParts" class="win-remain"
                        :style="remainParts.expired ? urgentRemainStyle : (remainParts.urgent ? urgentRemainStyle : normalRemainStyle)">
                        <text v-if="remainParts.expired">已截止</text>
                        <block v-else>
                            <text>剩余</text>
                            <text v-if="remainParts.d > 0" class="win-remain-num">{{ remainParts.d }}</text>
                            <text v-if="remainParts.d > 0">天</text>
                            <text class="win-remain-num">{{ String(remainParts.h).padStart(2, '0') }}</text><text>时</text>
                            <text class="win-remain-num">{{ String(remainParts.m).padStart(2, '0') }}</text><text>分</text>
                        </block>
                    </view>
                    <view class="win-tag" :style="sourceTagStyle">{{ windowInfo?.scheduleSource === 'MANUAL' ? '手工指定' : '默认日期' }}</view>
                    <view class="win-refresh" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click="handleRefreshWindow">↻ 刷新</view>
                </view>
                <view class="win-range" :style="{ color: isDark ? '#8a9099' : '#969799' }">开放时间：{{ winOpenAt || '-' }} ~ {{ winCloseAt || '-' }}</view>
                <view v-if="isManagerView && (canManageWindow || canGenerate)" class="win-ops">
                    <wd-button v-if="windowOpenNow && canManageWindow" type="warning" size="small" plain @click="openManage('close')">立即关闭</wd-button>
                    <wd-button v-if="(windowOpenNow || windowClosedNow) && canManageWindow" size="small" plain @click="openManage('adjust')">调整日期</wd-button>
                    <wd-button v-if="!windowOpenNow && canManageWindow" type="success" size="small" plain @click="openManage('open')">{{ windowClosedNow ? '重新开启' : '立即开启' }}</wd-button>
                    <wd-button v-if="canGenerate" type="info" size="small" plain @click="handleGenerate">补生成</wd-button>
                </view>
            </view>

            <!-- 筛选卡片：考核月份（可清空查全部）/ 状态 / 被考核人（管理视角且非经理表）+ 统计与查询/重置 -->
            <view class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                <view class="fc-row">
                    <view class="fc-field">
                        <picker mode="date" :value="model.evaluationCycle || ''" fields="month" class="fc-picker" @change="handleCycleChange">
                            <view class="fc-cell" :class="{ 'fc-cell--on': !!model.evaluationCycle }" :style="fcCellStyle(!!model.evaluationCycle)">
                                <wd-icon name="calendar" size="16px" :color="isDark ? '#69b1ff' : '#1677ff'" />
                                <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">考核月份</text>
                                <text class="fc-text" :style="{ color: model.evaluationCycle ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ model.evaluationCycle || '全部月份' }}</text>
                                <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </picker>
                        <view v-if="model.evaluationCycle" class="fc-clear" @click="handleCycleClear">
                            <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                        <view v-else class="fc-clear"></view>
                    </view>
                    <view class="fc-field">
                        <picker mode="selector" :range="statusOptions" range-key="label" class="fc-picker" @change="handleStatusChange">
                            <view class="fc-cell" :class="{ 'fc-cell--on': model.status !== null }" :style="fcCellStyle(model.status !== null)">
                                <wd-icon name="filter" size="16px" :color="isDark ? '#ffc53d' : '#fa8c16'" />
                                <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">状态</text>
                                <text class="fc-text" :style="{ color: model.status !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ statusOptions.find(s => s.value === model.status)?.label || '全部状态' }}</text>
                                <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </picker>
                        <view class="fc-clear"></view>
                    </view>
                </view>
                <view v-if="canFilterEmployee && activeTab !== 'MANAGER'" class="fc-row">
                    <view class="fc-field">
                        <picker mode="selector" :range="employeeOptions" range-key="label" class="fc-picker" @change="handleEmployeeChange">
                            <view class="fc-cell" :class="{ 'fc-cell--on': !!selectedEmployee }" :style="fcCellStyle(!!selectedEmployee)">
                                <wd-icon name="user" size="16px" :color="isDark ? '#73d13d' : '#52c41a'" />
                                <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">被考核人</text>
                                <text class="fc-text" :style="{ color: selectedEmployee ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ selectedEmployee?.label || '全部人员' }}</text>
                                <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </picker>
                        <view v-if="selectedEmployee" class="fc-clear" @click="handleEmployeeClear">
                            <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                        <view v-else class="fc-clear"></view>
                    </view>
                </view>
                <view class="fc-foot">
                    <view class="fc-count" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">已加载 <text class="fc-count-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="fc-count-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</view>
                    <view class="fc-actions">
                        <wd-button size="small" type="info" plain @click="handleResetFilter">重置</wd-button>
                        <wd-button size="small" type="primary" @click="handleSearch">查询</wd-button>
                    </view>
                </view>
            </view>
        </view>

        <view style="margin: 10rpx;" :style="listVars">
            <view v-if="dataList.length > 0">
                <view v-for="row in dataList" :key="row.id" class="list-item">
                    <view class="item-header">
                        <view class="header-main">
                            <view class="item-title">{{ row.employeeName || '-' }}</view>
                            <view class="item-sub">{{ row.evaluationCycle || '-' }}</view>
                        </view>
                        <view class="status-tag" :style="getStatusStyle(row.status)">{{ getStatusText(row.status) }}</view>
                    </view>
                    <view class="score-panel">
                        <view class="score-cell c1">
                            <text class="score-cell-label">自评分</text>
                            <view class="score-cell-value">{{ row.selfTotalScore ?? '-' }}</view>
                        </view>
                        <view class="score-cell c2">
                            <text class="score-cell-label">上级打分</text>
                            <view class="score-cell-value">{{ row.reviewTotalScore ?? '-' }}</view>
                        </view>
                        <view class="score-cell c3">
                            <text class="score-cell-label">最终得分</text>
                            <view class="score-cell-value" :class="{ 'low-score': isLowFinal(row) }">{{ row.finalScore ?? '-' }}</view>
                        </view>
                        <view v-if="activeTab === 'BONUS'" class="score-cell c4">
                            <text class="score-cell-label">系数</text>
                            <view class="score-cell-value">{{ row.coefficient ?? '-' }}</view>
                        </view>
                    </view>
                    <view v-if="activeTab === 'BONUS' || row.eligibilityStatus != null" class="meta-line">
                        <text class="meta-label">资格</text>
                        <view class="meta-body">
                            <view class="elig-tag" :style="Number(row.eligibilityStatus) === 1 ? eligOkStyle : eligNoStyle">{{ row.eligibilityStatus == null ? '-' : (Number(row.eligibilityStatus) === 1 ? '合格' : '已取消') }}</view>
                            <text v-if="row.eligibilityStatus != null && Number(row.eligibilityStatus) !== 1 && row.disqualifyReason" class="meta-text">{{ row.disqualifyReason }}</text>
                        </view>
                    </view>
                    <view v-if="activeTab !== 'BONUS' && row.warningCode" class="meta-line">
                        <text class="meta-label">预警</text>
                        <text class="meta-text meta-text--warn">{{ row.warningCode }}{{ row.warningMessage ? '：' + row.warningMessage : '' }}</text>
                    </view>
                    <view class="item-footer">
                        <wd-button v-for="op in rowOps(row)" :key="op.key" :type="op.type" size="small" plain @click.stop="handleOp(row, op)">{{ op.text }}</wd-button>
                    </view>
                </view>
                <wd-loadmore :state="state" @reload="getDataList" />
            </view>
            <view v-else style="display: flex; justify-content: center; align-items: center; padding: 80rpx 0;">
                <wd-status-tip image="../../static/search.png" tip="暂无数据" />
            </view>
        </view>

        <!-- 窗口管理弹层：调整日期/立即开启/立即关闭，均要求填写原因 -->
        <wd-popup closable v-model="manageShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="manageShow = false">
            <view class="sheet" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="sheet-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ manageTitle }}</view>
                <view v-if="manageMode === 'adjust'" class="sheet-field">
                    <text class="sheet-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">开启日期</text>
                    <view class="sheet-field-row">
                        <picker mode="date" :value="manageForm.openDate || todayStr()" class="sheet-picker" @change="(e) => (manageForm.openDate = e.detail.value)">
                            <view class="sheet-picker-val" :style="pickerValStyle">{{ manageForm.openDate || '当天 00:00:00 开启' }}</view>
                        </picker>
                        <view v-if="manageForm.openDate" class="sheet-clear" @click="manageForm.openDate = ''">
                            <wd-icon name="close-circle" size="22px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                    </view>
                </view>
                <view v-if="manageMode !== 'close'" class="sheet-field">
                    <text class="sheet-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">关闭日期</text>
                    <view class="sheet-field-row">
                        <picker mode="date" :value="manageForm.closeDate || todayStr()" class="sheet-picker" @change="(e) => (manageForm.closeDate = e.detail.value)">
                            <view class="sheet-picker-val" :style="pickerValStyle">{{ manageForm.closeDate || (manageMode === 'open' ? '留空则开放至当天 23:59:59' : '当天 23:59:59 关闭') }}</view>
                        </picker>
                        <view v-if="manageForm.closeDate" class="sheet-clear" @click="manageForm.closeDate = ''">
                            <wd-icon name="close-circle" size="22px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                    </view>
                </view>
                <view class="sheet-field">
                    <text class="sheet-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">操作原因</text>
                    <view class="sheet-area-wrap" :style="{ background: isDark ? '#1b1b1b' : '#f7f8fa', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#f0f1f3' }">
                        <textarea v-model="manageForm.reason" class="sheet-area" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" placeholder="请填写原因（必填）" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="200" />
                    </view>
                </view>
                <view v-if="manageTip" class="sheet-tip" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ manageTip }}</view>
                <view class="sheet-actions">
                    <wd-button block plain @click="manageShow = false">取消</wd-button>
                    <wd-button block type="primary" :loading="manageSubmitting" @click="confirmManage">确定</wd-button>
                </view>
            </view>
        </wd-popup>

        <wd-message-box />
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { onLoad, onReady, onShow, onHide, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import {
    fetchGetEngineeringAssessmentPage,
    fetchGetEngineeringAssessmentWindow,
    fetchSetEngineeringAssessmentWindow,
    fetchOpenEngineeringAssessment,
    fetchCloseEngineeringAssessment,
    fetchGenerateEngineeringAssessment,
    fetchResendEngineeringAssessmentNotification,
    type EngineeringAssessmentType
} from '@/service/engineeringAssessment';
import { fetchGetAllUserDataList } from '@/service/index';
import { hasPermission } from '@/utils/index';
import { useMessage } from 'wot-design-uni';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const message = useMessage();

const userIdStr = ref<string>(String(uni.getStorageSync('userId')));
const userType = ref<number>(Number(uni.getStorageSync('usertype')));

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const listLoading = ref(false);
let pendingReload = false;
const topFixedHeight = ref<number>(260);

const model = ref({
    page: 1, limit: 20, evaluationCycle: '', status: null as number | null, employeeId: null as number | null
});
const selectedEmployee = ref<any>(null);

/* ===== 页签可见性（口径同 web）：管理视角 usertype 0/4 全可见；被考核人 1024 见经理表；usertype 9 见组长表；usertype 3 见奖金表。
   页面只做入口收敛，自评/评分权限以后端 detail 的 canSelfScore/canReview 二次校验为准 ===== */
const visibleTabs = computed(() => {
    const admin = userType.value === 0 || userType.value === 4;
    return ([
        { type: 'MANAGER', title: '经理月度考核', show: admin || userIdStr.value === '1024' },
        { type: 'LEADER', title: '组长月度考核', show: admin || userType.value === 9 },
        { type: 'BONUS', title: '阶梯奖金考核', show: admin || userType.value === 3 }
    ] as Array<{ type: EngineeringAssessmentType; title: string; show: boolean }>).filter(t => t.show);
});

function defaultTabByRole(): EngineeringAssessmentType {
    if (userType.value === 9 && visibleTabs.value.some(t => t.type === 'LEADER')) return 'LEADER';
    if (userType.value === 3 && visibleTabs.value.some(t => t.type === 'BONUS')) return 'BONUS';
    return visibleTabs.value[0]?.type || 'MANAGER';
}

const activeTab = ref<EngineeringAssessmentType>('MANAGER');
const pageTitle = computed(() => visibleTabs.value.find(t => t.type === activeTab.value)?.title || '工程考核');

/** 窗口管理/上级评分视角：1022 或管理员（后端仍会二次校验） */
const isManagerView = computed(() => userIdStr.value === '1022' || userType.value === 0);
/** 上级评分操作人（列表按钮文案推导，权威以后端 detail.canReview 为准） */
const localCanReview = computed(() => userIdStr.value === '1022' || (activeTab.value === 'MANAGER' && userType.value === 0));
/** 人员筛选：仅管理视角可用（普通用户传 employeeId 会被后端强制改回本人） */
const canFilterEmployee = isManagerView;
const canManageWindow = computed(() => isManagerView.value && hasPermission('project:engineering:assessment:window'));
const canGenerate = computed(() => isManagerView.value && hasPermission('project:engineering:assessment:generate'));

/* ===== 窗口状态：30s 心跳，按 openAt/closeAt + 当前时间刷新按钮态，不只依赖 windowStatus ===== */
const windowInfo = ref<any>(null);
const nowTick = ref(Date.now());
let tickTimer: ReturnType<typeof setInterval> | null = null;
function startTick() {
    if (tickTimer) return;
    tickTimer = setInterval(() => { nowTick.value = Date.now(); }, 30000);
}
function stopTick() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
}

function toDate(str: string | null | undefined) {
    if (!str) return null;
    const d = new Date(String(str).replace(/-/g, '/'));
    return Number.isNaN(d.getTime()) ? null : d;
}
const winOpenAt = computed(() => windowInfo.value?.openAt || null);
const winCloseAt = computed(() => windowInfo.value?.closeAt || null);
const windowOpenNow = computed(() => {
    const open = toDate(winOpenAt.value);
    const close = toDate(winCloseAt.value);
    const now = nowTick.value;
    return Number(windowInfo.value?.windowStatus) === 1 && !!open && !!close && open.getTime() <= now && now <= close.getTime();
});
const windowClosedNow = computed(() => {
    const close = toDate(winCloseAt.value);
    const now = nowTick.value;
    return Number(windowInfo.value?.windowStatus) === 2 || (Number(windowInfo.value?.windowStatus) === 1 && !!close && now > close.getTime());
});
const windowStateText = computed(() => {
    if (windowOpenNow.value) return '已开启';
    if (windowClosedNow.value) return '已关闭';
    return '未开启';
});
const windowStateStyle = computed(() => {
    if (windowOpenNow.value) return isDark.value ? { background: 'rgba(82, 196, 26, 0.16)', color: '#73d13d' } : { background: '#f6ffed', color: '#52c41a' };
    if (windowClosedNow.value) return isDark.value ? { background: 'rgba(245, 34, 45, 0.16)', color: '#ff7875' } : { background: '#fff1f0', color: '#f5222d' };
    return isDark.value ? { background: 'rgba(255, 255, 255, 0.09)', color: '#a8b0bc' } : { background: '#f4f4f5', color: '#909399' };
});
const sourceTagStyle = computed(() => {
    if (windowInfo.value?.scheduleSource === 'MANUAL') return isDark.value ? { background: 'rgba(212, 136, 6, 0.16)', color: '#ffc53d' } : { background: '#fff7e6', color: '#fa8c16' };
    return isDark.value ? { background: 'rgba(24, 144, 255, 0.18)', color: '#69b1ff' } : { background: '#e6f7ff', color: '#1890ff' };
});
const normalRemainStyle = computed(() => isDark.value ? { background: 'rgba(240, 160, 32, 0.14)', color: '#f7ba2a' } : { background: 'rgba(240, 160, 32, 0.1)', color: '#f0a020' });
const urgentRemainStyle = computed(() => isDark.value ? { background: 'rgba(208, 48, 48, 0.16)', color: '#e88080' } : { background: 'rgba(208, 48, 48, 0.08)', color: '#d03050' });
/** 剩余时间拆段；≤24 小时 urgent 转红，过期兜底渲染已截止 */
const remainParts = computed<null | { d: number; h: number; m: number; urgent: boolean; expired: boolean }>(() => {
    const close = toDate(winCloseAt.value);
    if (!close || !windowOpenNow.value) return null;
    const diff = close.getTime() - nowTick.value;
    if (diff <= 0) return { d: 0, h: 0, m: 0, urgent: true, expired: true };
    return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        urgent: diff <= 86400000,
        expired: false
    };
});

async function getWindowInfo() {
    try {
        const data = await fetchGetEngineeringAssessmentWindow(activeTab.value);
        windowInfo.value = data || null;
        // 窗口栏异步加载后高度变化（管理操作行出现/消失），延迟重测占位高度
        setTimeout(recalcTopFixedHeight, 300);
    } catch (err) { console.error('获取考核窗口失败', err); }
}

/** 窗口栏刷新：重取开放窗口 + 刷新列表 */
const refreshing = ref(false);
async function handleRefreshWindow() {
    if (refreshing.value) return;
    refreshing.value = true;
    try {
        await Promise.all([getWindowInfo(), getDataList()]);
    } finally { refreshing.value = false; }
}

/* ===== 列表 ===== */
function lastCycle() {
    const d = new Date();
    const last = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`;
}

const statusOptions = [
    { label: '全部状态', value: null as any },
    { label: '待自评', value: 0 },
    { label: '待上级评分', value: 1 },
    { label: '待个人确认签名', value: 2 },
    { label: '已完成', value: 5 },
    { label: '已作废', value: 4 }
];

// 状态标签：文案单份维护，配色按主题拆分（口径同 web statusTagMap / rdassessment statusMap）
const statusMap: any = {
    0: {
        text: '待自评',
        light: { bg: '#e6f7ff', color: '#1890ff' },
        dark: { bg: 'rgba(24, 144, 255, 0.18)', color: '#69b1ff' }
    },
    1: {
        text: '待上级评分',
        light: { bg: '#fff7e6', color: '#fa8c16' },
        dark: { bg: 'rgba(212, 136, 6, 0.16)', color: '#ffc53d' }
    },
    2: {
        text: '待个人确认签名',
        light: { bg: '#e6fffb', color: '#13c2c2' },
        dark: { bg: 'rgba(19, 194, 194, 0.16)', color: '#36cfc9' }
    },
    3: {
        text: '已退回',
        light: { bg: '#f9f0ff', color: '#722ed1' },
        dark: { bg: 'rgba(114, 46, 209, 0.22)', color: '#b37feb' }
    },
    4: {
        text: '已作废',
        light: { bg: '#f4f4f5', color: '#909399' },
        dark: { bg: 'rgba(255, 255, 255, 0.09)', color: '#a8b0bc' }
    },
    5: {
        text: '已完成',
        light: { bg: '#f6ffed', color: '#52c41a' },
        dark: { bg: 'rgba(82, 196, 26, 0.16)', color: '#73d13d' }
    },
    unknown: {
        text: '未知',
        light: { bg: '#f4f4f5', color: '#909399' },
        dark: { bg: 'rgba(255, 255, 255, 0.09)', color: '#a8b0bc' }
    }
};
function getStatusText(status: number) {
    return (statusMap[Number(status)] || statusMap.unknown).text;
}
function getStatusStyle(status: number) {
    const entry = statusMap[Number(status)] || statusMap.unknown;
    const st = isDark.value ? entry.dark : entry.light;
    return { background: st.bg, color: st.color };
}

/** 最终得分标红：经理低于 80 分/组长低于 60 分（与后端预警阈值一致） */
function isLowFinal(row: any): boolean {
    if (row.finalScore == null || row.finalScore === '') return false;
    const n = Number(row.finalScore);
    if (Number.isNaN(n)) return false;
    if (activeTab.value === 'MANAGER') return n < 80;
    if (activeTab.value === 'LEADER') return n < 60;
    return false;
}

const eligOkStyle = computed(() => isDark.value ? { background: 'rgba(82, 196, 26, 0.16)', color: '#73d13d' } : { background: '#f6ffed', color: '#52c41a' });
const eligNoStyle = computed(() => isDark.value ? { background: 'rgba(245, 34, 45, 0.16)', color: '#ff7875' } : { background: '#fff1f0', color: '#f5222d' });

/** 卡片配色 CSS 变量：暗黑换深底亮字（口径同 rdassessment listVars） */
const listVars = computed<Record<string, string>>(() => isDark.value ? {
    '--li-card-bg': '#2a2a2a',
    '--li-title': '#e8e8e8',
    '--li-sub': '#8a9099',
    '--li-line': 'rgba(255, 255, 255, 0.08)',
    '--li-cell1': 'rgba(24, 144, 255, 0.12)',
    '--li-cell2': 'rgba(212, 136, 6, 0.14)',
    '--li-cell3': 'rgba(82, 196, 26, 0.14)',
    '--li-cell4': 'rgba(114, 46, 209, 0.16)',
    '--li-meta-bg': 'rgba(255, 255, 255, 0.06)',
    '--li-shadow': 'none'
} : {
    '--li-card-bg': '#ffffff',
    '--li-title': '#1a1a1a',
    '--li-sub': '#969799',
    '--li-line': '#f0f1f3',
    '--li-cell1': 'rgba(24, 144, 255, 0.07)',
    '--li-cell2': 'rgba(250, 140, 21, 0.07)',
    '--li-cell3': 'rgba(82, 196, 26, 0.07)',
    '--li-cell4': 'rgba(114, 46, 209, 0.07)',
    '--li-meta-bg': '#f7f8fa',
    '--li-shadow': '0 2rpx 8rpx rgba(0, 0, 0, 0.05)'
});

async function getDataList() {
    if (listLoading.value) { pendingReload = true; return; }
    listLoading.value = true;
    try {
        if (model.value.page === 1) dataList.value = [];
        const params: any = { page: model.value.page, limit: model.value.limit, assessmentType: activeTab.value, _t: new Date().getTime() };
        if (model.value.evaluationCycle) params.evaluationCycle = model.value.evaluationCycle;
        if (model.value.status !== null) params.status = model.value.status;
        if (model.value.employeeId !== null) params.employeeId = model.value.employeeId;
        const data: any = await fetchGetEngineeringAssessmentPage(params);
        const rows = Array.isArray(data) ? data : (data?.list || []);
        dataList.value = dataList.value.concat(rows);
        total.value = Number(data?.total ?? rows.length);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) { console.error('获取列表失败', err); state.value = 'error'; }
    finally {
        listLoading.value = false;
        if (pendingReload) { pendingReload = false; getDataList(); }
    }
}

/* ===== 行级窗口与操作（口径同 web 列 render） ===== */
/** 行级窗口是否开启（与详情页 openAt/closeAt 判断一致，用于状态 2 的操作按钮文案：关窗后评分只读只能查看） */
function isRowWindowOpen(row: any): boolean {
    const t = (v: any) => {
        const d = v ? new Date(String(v).replace(/-/g, '/')).getTime() : NaN;
        return Number.isNaN(d) ? NaN : d;
    };
    const o = t(row.openAt ?? row.batch?.openAt);
    const c = t(row.closeAt ?? row.batch?.closeAt);
    return !Number.isNaN(o) && !Number.isNaN(c) && o <= Date.now() && Date.now() <= c;
}

function rowOps(row: any): Array<{ key: string; text: string; type: any }> {
    const isSelf = String(row.employeeId) === userIdStr.value;
    const st = Number(row.status);
    const ops: Array<{ key: string; text: string; type: any }> = [];
    if (st === 0 && isSelf) ops.push({ key: 'self', text: '去自评', type: 'success' });
    if (st === 1 && localCanReview.value) ops.push({ key: 'review', text: '去评分', type: 'success' });
    if (st === 2 && localCanReview.value) {
        const open = isRowWindowOpen(row);
        ops.push({ key: 'review', text: open ? '修订评分' : '查看评分', type: open ? 'warning' : 'primary' });
    }
    if (st === 2 && isSelf) ops.push({ key: 'sign', text: '去签名', type: 'success' });
    if (!ops.some(o => o.key === 'self' || o.key === 'review')) ops.push({ key: 'detail', text: '考核详情', type: 'primary' });
    if (isManagerView.value && (st === 0 || st === 1)) ops.push({ key: 'resend', text: '重新通知', type: 'info' });
    return ops;
}

function handleOp(row: any, op: { key: string }) {
    if (op.key === 'resend') { handleResend(row); return; }
    openDetail(row);
}

const clickLock = ref<boolean>(false);
function openDetail(row: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    uni.navigateTo({ url: `/mePages/engineeringAssessment/detail/Index?instanceId=${row.id}&assessmentType=${activeTab.value}` });
    setTimeout(() => { clickLock.value = false; }, 500);
}

/* ===== 筛选交互 ===== */
function handleTabChange(e: any) {
    // wd-tabs 先 emit change 再 emit update:modelValue：进入本函数时 activeTab 仍是旧页签，
    // 必须先用事件带回的 name 同步，否则下方请求会按旧考核类别取数（人员下拉/列表/窗口全错）
    if (e && e.name != null) activeTab.value = e.name;
    // 切换考核类别：状态/人员筛选复位（人员范围随类别变化），月份保留
    model.value.page = 1;
    model.value.status = null;
    model.value.employeeId = null;
    selectedEmployee.value = null;
    dataList.value = [];
    getWindowInfo();
    getEmployeeOptions();
    getDataList();
}

function handleCycleChange(e: any) {
    model.value.evaluationCycle = e.detail.value || '';
    model.value.page = 1;
    getDataList();
}
function handleCycleClear() {
    model.value.evaluationCycle = '';
    model.value.page = 1;
    getDataList();
}
function handleStatusChange(e: any) {
    model.value.status = statusOptions[e.detail.value]?.value ?? null;
    model.value.page = 1;
    getDataList();
}
function handleEmployeeChange(e: any) {
    const opt = employeeOptions.value[e.detail.value];
    if (opt && opt.value !== null) {
        model.value.employeeId = opt.value;
        selectedEmployee.value = opt;
    } else {
        model.value.employeeId = null;
        selectedEmployee.value = null;
    }
    model.value.page = 1;
    getDataList();
}
function handleSearch() { model.value.page = 1; getDataList(); }

/** 筛选控件配色：选中淡蓝底描边、未选中灰底（颜色仅辅助，字段值文字为准） */
function fcCellStyle(active: boolean) {
    return active
        ? (isDark.value
            ? { background: 'rgba(22, 119, 255, 0.12)', borderColor: 'rgba(105, 177, 255, 0.45)' }
            : { background: 'rgba(22, 119, 255, 0.06)', borderColor: 'rgba(22, 119, 255, 0.35)' })
        : (isDark.value
            ? { background: '#383838', borderColor: 'rgba(255, 255, 255, 0.08)' }
            : { background: '#f7f8fa', borderColor: '#f0f1f3' });
}
/** 清除被考核人筛选 */
function handleEmployeeClear() {
    model.value.employeeId = null;
    selectedEmployee.value = null;
    model.value.page = 1;
    getDataList();
}
/** 重置筛选：状态/人员清空、月份回到默认上一自然月（口径同 web handleReset） */
function handleResetFilter() {
    model.value.status = null;
    model.value.employeeId = null;
    selectedEmployee.value = null;
    model.value.evaluationCycle = lastCycle();
    model.value.page = 1;
    getDataList();
}

/** 人员下拉：LEADER=usertype 9，BONUS=usertype 3（仅在职有效用户） */
const employeeOptions = ref<any[]>([]);
const employeeList = ref<any[]>([]);
async function getEmployeeOptions() {
    if (!canFilterEmployee.value || activeTab.value === 'MANAGER') { employeeOptions.value = []; return; }
    const usertypes = activeTab.value === 'LEADER' ? '9' : '3';
    try {
        const data: any = await fetchGetAllUserDataList({ page: 1, limit: 500, usertypes });
        const list = (data?.list || []).filter((u: any) => u.status == 0);
        employeeList.value = list;
        employeeOptions.value = [{ label: '全部', value: null as any }, ...list.map((u: any) => ({ label: u.username, value: Number(u.id) }))];
    } catch (err) { console.error('获取人员列表失败', err); }
}

function handleClickLeft() { uni.navigateBack(); }

/* ===== 窗口管理弹层 ===== */
const manageShow = ref(false);
const manageMode = ref<'open' | 'close' | 'adjust'>('open');
const manageForm = ref<{ openDate: string; closeDate: string; reason: string }>({ openDate: '', closeDate: '', reason: '' });
const manageSubmitting = ref(false);
const manageTitle = computed(() =>
    manageMode.value === 'adjust' ? '指定开启/关闭日期' : manageMode.value === 'open' ? '立即开启' : '立即关闭'
);
const manageTip = computed(() => {
    if (manageMode.value === 'adjust') return '手工日期只影响当前月份、当前考核类型，下个月恢复默认日期。';
    if (manageMode.value === 'open') return '重新开启不会重复发送「新考核」消息，需要提醒时请在列表中对对应人员点击「重新通知」。';
    return '';
});
const pickerValStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#f7f8fa', color: isDark.value ? '#e8e8e8' : '#1a1a1a' }));

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function openManage(mode: 'open' | 'close' | 'adjust') {
    manageMode.value = mode;
    manageForm.value = {
        openDate: mode === 'adjust' ? String(winOpenAt.value || '').slice(0, 10) || '' : '',
        closeDate: String(winCloseAt.value || '').slice(0, 10) || '',
        reason: ''
    };
    manageShow.value = true;
}

async function confirmManage() {
    const { openDate, closeDate, reason } = manageForm.value;
    if (!reason.trim()) {
        uni.showToast({ title: '请填写操作原因', icon: 'none' });
        return;
    }
    manageSubmitting.value = true;
    try {
        if (manageMode.value === 'adjust') {
            await fetchSetEngineeringAssessmentWindow({
                assessmentType: activeTab.value,
                openDate: openDate || undefined,
                closeDate: closeDate || undefined,
                reason: reason.trim()
            });
        } else if (manageMode.value === 'open') {
            await fetchOpenEngineeringAssessment({
                assessmentType: activeTab.value,
                closeDate: closeDate || undefined,
                reason: reason.trim()
            });
        } else {
            await fetchCloseEngineeringAssessment({
                assessmentType: activeTab.value,
                reason: reason.trim()
            });
        }
        uni.showToast({ title: '操作成功', icon: 'success' });
        manageShow.value = false;
        getWindowInfo();
        getDataList();
    } catch (err) { console.error('窗口管理操作失败', err); }
    finally { manageSubmitting.value = false; }
}

/** 补生成当期考核（幂等：已存在不重复创建、不重复发首次通知） */
async function handleGenerate() {
    try {
        await message.confirm({
            title: '补生成当期考核',
            msg: `将按模板生成本期（${lastCycle()}）${pageTitle.value}记录，已存在的考核不会重复创建，确定继续？`
        });
    } catch { return; }
    try {
        await fetchGenerateEngineeringAssessment(activeTab.value);
        uni.showToast({ title: '生成成功', icon: 'success' });
        getWindowInfo();
        getDataList();
    } catch (err) { console.error('补生成失败', err); }
}

/** 重新发送提醒：向指定被考核人重发 REMINDER（重新开启不会自动重复推送） */
async function handleResend(row: any) {
    try {
        await message.confirm({
            title: '重新发送提醒',
            msg: `将向 ${row.employeeName} 重新发送本期${pageTitle.value}提醒通知，确定继续？`
        });
    } catch { return; }
    try {
        await fetchResendEngineeringAssessmentNotification({ assessmentType: activeTab.value, employeeId: row.employeeId });
        uni.showToast({ title: '提醒已发送', icon: 'success' });
    } catch (err) { console.error('重新通知失败', err); }
}

function recalcTopFixedHeight() {
    uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => {
        if (rect) topFixedHeight.value = rect.height;
    }).exec();
}

function refreshList() {
    model.value.page = 1;
    dataList.value = [];
    getWindowInfo();
    getDataList();
}

onMounted(() => {
    uni.$on('refreshEngineeringAssessmentList', refreshList);
});
onBeforeUnmount(() => {
    uni.$off('refreshEngineeringAssessmentList', refreshList);
    stopTick();
});

onLoad((options: any) => {
    userIdStr.value = String(uni.getStorageSync('userId'));
    userType.value = Number(uni.getStorageSync('usertype'));
    // 深链参数（推送跳转预留）：assessmentType + evaluationCycle
    const qType = options?.assessmentType as EngineeringAssessmentType | undefined;
    if (qType && visibleTabs.value.some(t => t.type === qType)) activeTab.value = qType;
    else activeTab.value = defaultTabByRole();
    const qCycle = options?.evaluationCycle as string | undefined;
    if (qCycle && /^\d{4}-\d{2}$/.test(String(qCycle))) model.value.evaluationCycle = String(qCycle);
    else model.value.evaluationCycle = lastCycle();
    getWindowInfo();
    getEmployeeOptions();
    getDataList();
});

onReady(() => { recalcTopFixedHeight(); });
onShow(() => {
    // 切换账号后刷新视角与页签
    userIdStr.value = String(uni.getStorageSync('userId'));
    userType.value = Number(uni.getStorageSync('usertype'));
    startTick();
});
onHide(() => { stopTick(); });
onUnload(() => { stopTick(); });

onPullDownRefresh(() => {
    model.value.page = 1;
    getWindowInfo();
    getDataList();
    setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000);
});
onReachBottom(() => {
    if (!listLoading.value && dataList.value.length < total.value) { model.value.page++; getDataList(); }
    else if (dataList.value.length === total.value) { state.value = 'finished'; }
});
</script>

<style lang="scss" scoped>
.topFixedWrap { position: fixed; left: 0; top: 0; width: 100%; z-index: 99; }
.window-card { margin: 10rpx 20rpx 0; padding: 20rpx 24rpx; border-radius: 20rpx; }
.win-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12rpx; }
.win-title { font-size: 30rpx; font-weight: 600; margin-right: 4rpx; }
.win-tag { padding: 6rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 500; white-space: nowrap; }
.win-remain { display: inline-flex; align-items: center; gap: 4rpx; padding: 6rpx 16rpx; border-radius: 12rpx; font-size: 22rpx; }
.win-remain-num { font-weight: 700; font-size: 26rpx; }
.win-refresh { margin-left: auto; font-size: 24rpx; }
.win-range { margin-top: 10rpx; font-size: 22rpx; }
.win-ops { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 16rpx; }
/* ===== 筛选卡片 ===== */
.filter-card { margin: 16rpx 20rpx 0; padding: 20rpx; border-radius: 20rpx; display: flex; flex-direction: column; gap: 16rpx; }
.fc-row { display: flex; gap: 16rpx; }
.fc-field { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8rpx; }
.fc-picker { flex: 1; min-width: 0; }
.fc-cell { display: flex; align-items: center; gap: 10rpx; padding: 16rpx 18rpx; border-radius: 14rpx; border: 1rpx solid transparent; }
.fc-cap { flex-shrink: 0; font-size: 22rpx; }
.fc-text { flex: 1; min-width: 0; text-align: right; font-size: 24rpx; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fc-clear { flex: 0 0 40rpx; display: flex; align-items: center; justify-content: center; }
.fc-foot { display: flex; align-items: center; justify-content: space-between; }
.fc-count { font-size: 24rpx; }
.fc-count-num { font-weight: 600; }
.fc-actions { display: flex; gap: 16rpx; }
.list-item { position: relative; overflow: hidden; margin-bottom: 16rpx; padding: 24rpx; background: var(--li-card-bg, #fff); border-radius: 20rpx; box-shadow: var(--li-shadow, 0 2rpx 8rpx rgba(0, 0, 0, 0.05)); }
.item-header { display: flex; align-items: flex-start; margin-bottom: 20rpx; }
.header-main { flex: 1; min-width: 0; }
.item-title { font-size: 30rpx; font-weight: 600; color: var(--li-title, #1a1a1a); }
.item-sub { margin-top: 4rpx; font-size: 22rpx; color: var(--li-sub, #969799); }
.status-tag { flex-shrink: 0; margin-left: 12rpx; padding: 6rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 500; white-space: nowrap; }
.score-panel { display: flex; gap: 12rpx; margin-bottom: 16rpx; }
.score-cell { flex: 1; padding: 14rpx 16rpx; border-radius: 14rpx; min-width: 0; }
.score-cell.c1 { background: var(--li-cell1, rgba(24, 144, 255, 0.07)); }
.score-cell.c2 { background: var(--li-cell2, rgba(250, 140, 21, 0.07)); }
.score-cell.c3 { background: var(--li-cell3, rgba(82, 196, 26, 0.07)); }
.score-cell.c4 { background: var(--li-cell4, rgba(114, 46, 209, 0.07)); }
.score-cell-label { display: block; font-size: 20rpx; color: var(--li-sub, #969799); margin-bottom: 6rpx; white-space: nowrap; }
.score-cell-value { font-size: 34rpx; font-weight: 700; line-height: 1.2; color: var(--li-title, #1a1a1a); }
.low-score { color: #f5222d !important; }
.meta-line { display: flex; align-items: flex-start; gap: 12rpx; padding: 12rpx 16rpx; margin-bottom: 12rpx; background: var(--li-meta-bg, #f7f8fa); border-radius: 12rpx; }
.meta-label { flex-shrink: 0; font-size: 22rpx; color: var(--li-sub, #969799); line-height: 1.7; }
.meta-body { flex: 1; display: flex; align-items: center; gap: 12rpx; flex-wrap: wrap; }
.elig-tag { padding: 4rpx 14rpx; border-radius: 999rpx; font-size: 20rpx; font-weight: 600; white-space: nowrap; }
.meta-text { flex: 1; min-width: 0; font-size: 22rpx; color: var(--li-title, #1a1a1a); line-height: 1.7; word-break: break-all; }
.meta-text--warn { color: #fa8c16; }
.item-footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 12rpx; padding-top: 16rpx; border-top: 1rpx solid var(--li-line, #f0f1f3); }
.sheet { padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom)); border-radius: 24rpx 24rpx 0 0; }
.sheet-title { font-size: 32rpx; font-weight: 600; margin-bottom: 24rpx; }
.sheet-field { margin-bottom: 20rpx; }
.sheet-field-row { display: flex; align-items: center; gap: 12rpx; }
.sheet-picker { flex: 1; min-width: 0; }
.sheet-picker-val { padding: 16rpx 20rpx; border-radius: 14rpx; font-size: 26rpx; }
.sheet-clear { flex: 0 0 44rpx; display: flex; align-items: center; justify-content: center; }
.sheet-label { display: block; font-size: 24rpx; color: #969799; margin-bottom: 10rpx; }
.sheet-area-wrap { border: 1rpx solid #f0f1f3; border-radius: 14rpx; padding: 8rpx 20rpx; }
.sheet-area { width: 100%; min-height: 120rpx; font-size: 26rpx; }
.sheet-tip { font-size: 22rpx; line-height: 1.6; margin-bottom: 16rpx; }
.sheet-actions { display: flex; gap: 20rpx; margin-top: 8rpx; }
</style>
