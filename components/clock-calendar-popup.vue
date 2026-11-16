<template>
    <wd-popup :z-index="99" closable v-model="visible" custom-style="width: 92%; border-radius: 32rpx; padding: 20rpx; max-height: 80vh; overflow-y: auto;" @close="handleCloseChange">
        <view class="clock-record-card">
            <!-- 头部：项目名 + 统计信息 -->
            <view class="clock-header">
                <view class="clock-header-title">
                    <text class="clock-proname" :class="dark ? 'dark' : ''">{{ row?.proname || '' }}</text>
                    <text class="clock-sub" :class="dark ? 'dark-sub' : ''">的项目打卡记录</text>
                </view>
                <view class="clock-header-stats">
                    <text v-if="multiUser" class="clock-warning">
                        <text>⚠️</text> 同一日期多个调试人员，工时已合并为单日计算
                    </text>
                    <text class="clock-total">总工时 {{ row?.actualtime ?? 0 }} 天</text>
                    <text v-if="calendarData.length" class="clock-range">
                        📅 {{ normalizeClockDate(calendarData[0].dbtime) }} 至 {{ normalizeClockDate(calendarData[calendarData.length - 1].dbtime) }}
                    </text>
                </view>
            </view>

            <!-- 加载中 -->
            <view v-if="loading" class="clock-loading">
                <wd-loading size="36px"></wd-loading>
                <text class="clock-loading-text" :class="dark ? 'dark-sub' : ''">正在加载打卡记录...</text>
            </view>

            <template v-else-if="calendarData.length">
                <!-- 月份切换 -->
                <view class="clock-month-nav">
                    <view class="clock-nav-btn" :class="[dark ? 'dark-nav' : '', { disabled: monthIndex === 0 }]" @click="prevMonth">
                        <text>◀</text>
                    </view>
                    <text class="clock-month-title" :class="dark ? 'dark' : ''">{{ displayMonth }}</text>
                    <view class="clock-nav-btn" :class="[dark ? 'dark-nav' : '', { disabled: monthIndex === months.length - 1 }]" @click="nextMonth">
                        <text>▶</text>
                    </view>
                </view>

                <!-- 星期表头 -->
                <view class="clock-week" :class="dark ? 'dark-week' : ''">
                    <text v-for="w in ['一', '二', '三', '四', '五', '六', '日']" :key="w" class="clock-week-item">{{ w }}</text>
                </view>

                <!-- 日历格 -->
                <view class="clock-days" :class="dark ? 'dark-days' : ''">
                    <view v-for="(day, index) in getMonthDays(currentMonth)" :key="index" class="clock-day" :class="[dark ? 'dark-day' : '', { 'is-empty': !day, 'is-today': day === todayStr }]">
                        <block v-if="day">
                            <text class="clock-day-num" :class="{ 'today': day === todayStr, 'darkCss': dark }">{{ Number(day.slice(-2)) }}</text>
                            <view class="clock-day-users">
                                <view v-for="u in getDayUsers(day)" :key="u.id ?? u.username" class="clock-user" :style="userStyle(u.dailyWorktime)">
                                    <text class="clock-user-name">{{ u.username || '未知人员' }}</text>
                                    <text class="clock-user-time">{{ formatWorktime(u.dailyWorktime) }}</text>
                                </view>
                            </view>
                        </block>
                    </view>
                </view>

                <!-- 图例 -->
                <view class="clock-legend" :class="dark ? 'dark-legend' : ''">
                    <text class="clock-legend-item"><text class="dot dot-red"></text>0 天</text>
                    <text class="clock-legend-item"><text class="dot dot-blue"></text>不足 1 天</text>
                    <text class="clock-legend-item"><text class="dot dot-green"></text>满 1 天</text>
                </view>
            </template>

            <!-- 空态（一般由 toast 提示后关闭弹框，这里兜底） -->
            <view v-else class="clock-empty" :class="dark ? 'dark-sub' : ''">
                该项目暂无打卡记录
            </view>
        </view>
    </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { fetchprojectTripHour } from '@/service/prj';

/**
 * 项目打卡记录日历弹窗（列表/详情共用）
 *
 * 打开时拉取 fetchprojectTripHour，无记录提示且不弹窗；有记录按月分格展示人员与工时。
 * 同一日期多个打卡人时提示工时已合并为单日计算。
 */
const props = defineProps<{
    modelValue: boolean;
    /** 项目行（需含 id / proname / actualtime） */
    row?: any;
    /** 暗色主题 */
    dark?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

const visible = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit('update:modelValue', val)
});

function handleCloseChange() {
    emit('update:modelValue', false);
}

const loading = ref(false);
const calendarData = ref<any[]>([]); // 打卡明细（按日期升序）
const dayUsersMap = ref<Map<string, any[]>>(new Map()); // 按天索引的打卡明细（日期 -> 明细列表）
const months = ref<string[]>([]);    // 打卡涉及的月份列表（YYYY-MM，升序）
const monthIndex = ref(0);           // 当前展示月份下标
const multiUser = ref(false);        // 同一天是否存在多个调试人员

// 归一化打卡日期为 YYYY-MM-DD
function normalizeClockDate(val: any): string {
    if (val === null || val === undefined || val === '') return '';
    return String(val).replace(/\//g, '-').slice(0, 10);
}

// 同一日期是否存在多个调试人员（工时需合并为单日计算）
function hasMultipleCreatersOnSameDay(list: any[]): boolean {
    if (!Array.isArray(list) || list.length === 0) return false;
    const dayMap: Record<string, number> = {};
    list.forEach((item: any) => {
        const d = normalizeClockDate(item && item.dbtime);
        if (d) dayMap[d] = (dayMap[d] || 0) + 1;
    });
    return Object.keys(dayMap).some((d) => dayMap[d] > 1);
}

// 构建打卡涉及的月份列表（YYYY-MM，升序）
function buildMonths(list: any[]): string[] {
    const monthSet = new Set<string>();
    (list || []).forEach((item: any) => {
        const d = normalizeClockDate(item && item.dbtime);
        if (d) monthSet.add(d.slice(0, 7));
    });
    return Array.from(monthSet).sort();
}

// 获取某个月的日历格（42 格、周一开头，非本月的格子为空字符串）
function getMonthDays(month: string): string[] {
    if (!month) return [];
    const [y, m] = month.split('-').map(Number);
    const firstWeekday = new Date(y, m - 1, 1).getDay(); // 0=周日
    const leading = firstWeekday === 0 ? 6 : firstWeekday - 1; // 周一为每周第一天
    const days: string[] = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(y, m - 1, 1 - leading + i);
        if (d.getMonth() === m - 1) {
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            days.push(`${y}-${mm}-${dd}`);
        } else {
            days.push('');
        }
    }
    return days;
}

// 某一天的打卡人员列表（load 时按天建索引，此处直接查表）
function getDayUsers(day: string): any[] {
    return dayUsersMap.value.get(day) || [];
}

// 上一个/下一个打卡月份
function prevMonth() {
    if (monthIndex.value > 0) monthIndex.value--;
}
function nextMonth() {
    if (monthIndex.value < months.value.length - 1) monthIndex.value++;
}

// 工时格式化：0.5 -> "0.5天"；1 -> "1天"；非法值按 0 处理（与配色口径一致）
function formatWorktime(val: any): string {
    const n = Number(val) || 0;
    return n + '天';
}

// 工时标签配色（与 web 端一致：0 红 / ≥1 绿 / 不足 1 蓝；非法值归一为 0 走红色）
function userStyle(val: any): Record<string, string> {
    const n = Number(val) || 0;
    if (n === 0) {
        return { color: '#cf1322', backgroundColor: '#fff1f0', border: '1px solid #ffa39e' };
    }
    if (n >= 1) {
        return { color: '#389e0d', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' };
    }
    return { color: '#1890ff', backgroundColor: '#e6f7ff', border: '1px solid #91caff' };
}

// 当前展示的月份（YYYY-MM）
const currentMonth = computed(() => months.value[monthIndex.value] || '');
// 展示用月份文案：2026-08 -> 2026年8月
const displayMonth = computed(() => {
    const m = currentMonth.value;
    if (!m) return '';
    const [y, mm] = m.split('-');
    return `${y}年${Number(mm)}月`;
});
// 今天的日期字符串（YYYY-MM-DD，用于高亮当天格子）
const todayStr = computed(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
});

/** 代际计数：弹窗每次开/关自增，弱网下快速切换项目时旧响应不再应用（防跨项目数据串扰） */
let gen = 0;

watch(
    () => props.modelValue,
    (open) => {
        gen += 1;
        if (open) load();
    }
);

async function load() {
    if (!props.row?.id) return;
    const g = gen;
    loading.value = true;
    calendarData.value = [];
    dayUsersMap.value = new Map();
    months.value = [];
    monthIndex.value = 0;
    multiUser.value = false;
    try {
        const res: any = await fetchprojectTripHour({ pid: props.row.id });
        if (g !== gen) return;
        // app 端 request 直接返回 payload；兼容可能包一层 {data}/{list} 的情况
        const list: any[] = Array.isArray(res)
            ? res
            : Array.isArray(res && res.data)
                ? res.data
                : Array.isArray(res && res.list)
                    ? res.list
                    : [];
        if (list.length === 0) {
            emit('update:modelValue', false);
            uni.showToast({ icon: 'none', title: '该项目暂无打卡记录', duration: 1500 });
            return;
        }
        const sorted = [...list].sort((a: any, b: any) =>
            normalizeClockDate(a && a.dbtime).localeCompare(normalizeClockDate(b && b.dbtime)));
        calendarData.value = sorted;
        // 按天建索引：日历格渲染直接查表，避免 42 格各自对全量数据 filter
        const byDay = new Map<string, any[]>();
        sorted.forEach((item: any) => {
            const d = normalizeClockDate(item && item.dbtime);
            if (!d) return;
            const arr = byDay.get(d);
            if (arr) arr.push(item);
            else byDay.set(d, [item]);
        });
        dayUsersMap.value = byDay;
        months.value = buildMonths(sorted);
        const firstMonth = normalizeClockDate(sorted[0] && sorted[0].dbtime).slice(0, 7);
        const idx = months.value.indexOf(firstMonth);
        monthIndex.value = idx === -1 ? 0 : idx;
        multiUser.value = hasMultipleCreatersOnSameDay(sorted);
    } catch (err) {
        if (g !== gen) return;
        console.error('获取打卡记录失败', err);
        emit('update:modelValue', false);
        uni.showToast({ icon: 'none', title: '获取打卡记录失败', duration: 1500 });
    } finally {
        if (g === gen) loading.value = false;
    }
}
</script>

<style lang="scss" scoped>
.clock-record-card {
	display: flex;
	flex-direction: column;
}

.clock-header {
	margin-bottom: 20rpx;
}

.clock-header-title {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	margin-bottom: 14rpx;
}

.clock-proname {
	font-size: 32rpx;
	font-weight: 600;
	color: #1f2937;
	max-width: 440rpx;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.clock-proname.dark {
	color: #ffffff;
}

.clock-sub {
	font-size: 24rpx;
	color: #9ca3af;
	margin-left: 6rpx;
}

.clock-sub.dark-sub,
.clock-loading-text.dark-sub,
.clock-empty.dark-sub {
	color: #c0c4cc;
}

.clock-header-stats {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8rpx 16rpx;
}

.clock-warning {
	display: inline-flex;
	align-items: center;
	gap: 4rpx;
	padding: 4rpx 16rpx;
	border-radius: 9999rpx;
	background-color: #fefce8;
	color: #a16207;
	border: 1px solid #fde68a;
	font-size: 22rpx;
	font-weight: 500;
}

.clock-total {
	background: #eff6ff;
	color: #1d4ed8;
	padding: 4rpx 16rpx;
	border-radius: 9999rpx;
	font-size: 22rpx;
	font-weight: 500;
}

.clock-range {
	color: #6b7280;
	font-size: 22rpx;
}

/* 加载中 */
.clock-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60rpx 0;
}

.clock-loading-text {
	margin-top: 20rpx;
	color: #909399;
	font-size: 26rpx;
}

/* 月份切换 */
.clock-month-nav {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 24rpx;
	margin: 10rpx 0 16rpx;
}

.clock-nav-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: #f5f5f5;
	color: #333333;
	font-size: 26rpx;
	transition: all 0.2s;
}

.clock-nav-btn.disabled {
	opacity: 0.35;
	pointer-events: none;
}

.clock-nav-btn:not(.disabled):active {
	background: #e0e0e0;
	transform: scale(0.92);
}

.clock-nav-btn.dark-nav {
	background: #2b2b2b;
	color: #ffffff;
}

.clock-month-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1f2937;
	min-width: 200rpx;
	text-align: center;
}

.clock-month-title.dark {
	color: #ffffff;
}

/* 星期表头 */
.clock-week {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	background: #f8fafc;
	border-radius: 12rpx 12rpx 0 0;
	border: 1px solid #eee;
	border-bottom: none;
}

.clock-week.dark-week {
	background: #1b1b1b;
	border-color: #333;
}

.clock-week-item {
	text-align: center;
	padding: 12rpx 0;
	font-size: 24rpx;
	color: #64748b;
}

/* 日历格 */
.clock-days {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	border: 1px solid #eee;
	border-top: none;
	border-radius: 0 0 12rpx 12rpx;
	overflow: hidden;
}

.clock-days.dark-days {
	border-color: #333;
}

.clock-day {
	min-height: 110rpx;
	padding: 6rpx;
	border-right: 1px solid #f3f3f3;
	border-bottom: 1px solid #f3f3f3;
	box-sizing: border-box;
}

.clock-day.dark-day {
	border-color: #333;
  background-color: #333 !important;
}

.clock-day:nth-child(7n) {
	border-right: none;
}

.clock-day.is-empty {
	background: #fafafa;
}

.clock-day.is-today {
	background: #f0f7ff;
}

.clock-day-num {
	display: inline-block;
	font-size: 24rpx;
	font-weight: 600;
	color: #374151;
	margin-bottom: 4rpx;
}
.darkCss{
  background-color: #333 !important;
  color: #fff !important;
}
.clock-day-num.today {
	color: #ffffff;
	background: #3a7afe;
	border-radius: 50%;
	min-width: 36rpx;
	height: 36rpx;
	line-height: 36rpx;
	text-align: center;
}

.clock-day-users {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.clock-user {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	border-radius: 8rpx;
	padding: 2rpx 8rpx;
	box-sizing: border-box;
}

.clock-user-name {
	font-size: 20rpx;
	line-height: 1.3;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	max-width: 100%;
}

.clock-user-time {
	font-size: 18rpx;
	font-weight: 600;
	line-height: 1.3;
}

/* 图例 */
.clock-legend {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8rpx 24rpx;
	margin-top: 20rpx;
	padding-top: 16rpx;
	border-top: 1px solid #f3f3f3;
}

.clock-legend.dark-legend {
	border-color: #333;
}

.clock-legend-item {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	font-size: 22rpx;
	color: #6b7280;
}

.clock-legend-item .dot {
	display: inline-block;
	width: 20rpx;
	height: 20rpx;
	border-radius: 50%;
}

.clock-legend-item .dot-red {
	background: #cf1322;
}

.clock-legend-item .dot-blue {
	background: #1890ff;
}

.clock-legend-item .dot-green {
	background: #389e0d;
}

/* 空态 */
.clock-empty {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 80rpx 0;
	color: #909399;
	font-size: 26rpx;
}
</style>
