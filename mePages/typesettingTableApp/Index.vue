<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { onLoad, onReady, onPullDownRefresh } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchGetAllUserDataList, fetchprojectScheduling } from "@/service/index";
import { getSystemDate } from "@/utils/index";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === "dark");
const state = ref("loading");
const projects = ref<any[]>([]);
const currentYearMonth = ref("");
const selectMonth = ref<number>(Number(getSystemDate(5)));
const selectedUserId = ref<number | null>(null);
const userList = ref<any[]>([]);
const showFilterPopup = ref(false);
const filterType = ref<"all" | "scheduling" | "none">("all");
const topFixedHeight = ref<number>(200);

function handleClickLeft() { uni.navigateBack(); }

function recalcTopFixedHeight() { uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => { if (rect) topFixedHeight.value = rect.height; }).exec(); }

function handleMonthChange({ value }: { value: number }) {
    selectMonth.value = value;
    const date = new Date(value);
    currentYearMonth.value = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
    fetchData();
}

async function getUserList() {
    try {
        const data: any = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: "2, 3, 9" });
        userList.value = data.list || [];
    } catch (err) { console.error(err); }
}

const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

const calcMonthTotal = (p: any) => {
    if (!p.days) return 0;
    return p.days.reduce((acc: number, day: any[]) => {
        if (!day || day.length === 0) return acc;
        return acc + (day.length > 1 ? 1 : Number(day[0]?.hours || 0));
    }, 0);
};

const formatRealTime = (p: any) => {
    const realHours = Number(p.realtime ?? 0) || 0;
    if (realHours <= 0) return "0";
    const days = Math.floor(realHours / 8);
    const hours = Number((realHours % 8).toFixed(1));
    return hours === 0 ? `${days}天` : `${days}天${hours}小时`;
};

const getProjectUsers = (p: any): string[] => {
    const users = new Set<string>();
    if (p.days) p.days.forEach((day: any[]) => day.forEach((e: any) => e.username && users.add(e.username)));
    return Array.from(users);
};

const getSchedulingDays = (p: any): number => p.days ? p.days.filter((d: any[]) => d && d.length > 0).length : 0;

const getScheduledDates = (p: any): { day: number; entries: any[] }[] => {
    if (!p.days) return [];
    const result: { day: number; entries: any[] }[] = [];
    p.days.forEach((entries: any[], i: number) => { if (entries && entries.length > 0) result.push({ day: i + 1, entries }); });
    return result;
};

const transformBackendData = (list: any[], y: number, m: number) => {
    const daysCount = getDaysInMonth(y, m);
    return list.map((item: any, idx: number) => {
        const days: any[][] = Array.from({ length: daysCount }, () => []);
        if (item.dailyWorktimes && typeof item.dailyWorktimes === "object") {
            Object.keys(item.dailyWorktimes).forEach(key => {
                const match = key.match(/^day(\d+)$/i);
                if (match) {
                    const idx2 = parseInt(match[1], 10) - 1;
                    if (idx2 >= 0 && idx2 < daysCount && Array.isArray(item.dailyWorktimes[key])) {
                        item.dailyWorktimes[key].forEach((e: any) => {
                            days[idx2].push({ username: e.username || "未知", hours: Math.round((parseFloat(e.totalWorktime) || 0) * 100) / 100 });
                        });
                    }
                }
            });
        }
        Object.keys(item).forEach(key => {
            const match = key.match(/^day(\d+)$/i);
            if (match) {
                const idx2 = parseInt(match[1], 10) - 1;
                if (idx2 >= 0 && idx2 < daysCount && days[idx2].length === 0) {
                    const v = item[key];
                    if (v && typeof v === "string" && v.trim()) {
                        v.split(",").map((s: string) => s.trim()).filter(Boolean).forEach((n: string) => days[idx2].push({ username: n, hours: 0 }));
                    }
                }
            }
        });
        return {
            id: item.id || Date.now() + idx,
            projectName: item.projectName || "",
            projectSite: item.projectSite || "",
            taskDays: item.taskDays || "",
            projectStatus: item.projectStatus || "进行中",
            actualtime: item.actualtime || "",
            realtime: item.realtime || "",
            dispatchName: item.dispatchName || "",
            projectProgress: item.projectProgress || "",
            contractName: item.contractName || "",
            debugMode: item.debugMode || "现场",
            days
        };
    });
};

const listLoading = ref(false);
let pendingReload = false;

async function fetchData() {
    if (listLoading.value) { pendingReload = true; return; }
    listLoading.value = true;
    state.value = "loading";
    try {
        const d = new Date(selectMonth.value);
        currentYearMonth.value = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        const params: any = { month: currentYearMonth.value };
        if (selectedUserId.value) params.creater = selectedUserId.value;
        const data: any = await fetchprojectScheduling(params);
        if (data && Array.isArray(data)) {
            const [y, m] = currentYearMonth.value.split("-").map(Number);
            projects.value = transformBackendData(data, y, m - 1);
            state.value = projects.value.length > 0 ? "success" : "empty";
        } else { state.value = "empty"; }
    } catch (err) { console.error(err); state.value = "error"; }
    finally { listLoading.value = false; if (pendingReload) { pendingReload = false; fetchData(); } }
}

const filteredProjects = computed(() => {
    if (filterType.value === "all") return projects.value;
    if (filterType.value === "scheduling") return projects.value.filter(p => getSchedulingDays(p) > 0);
    return projects.value.filter(p => getSchedulingDays(p) === 0);
});

const selectedUserName = computed(() => {
    if (!selectedUserId.value) return "全部人员";
    return userList.value.find((u: any) => u.id === selectedUserId.value)?.username || "全部人员";
});

function handleUserSelect(id: number | null) { selectedUserId.value = id; showFilterPopup.value = false; fetchData(); }

function handleProjectClick(p: any) {
    uni.navigateTo({ url: "/mePages/typesettingTableApp/detail?project=" + encodeURIComponent(JSON.stringify(p)) + "&month=" + currentYearMonth.value });
}

onLoad(() => {
    const now = new Date();
    currentYearMonth.value = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    selectMonth.value = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
});

onReady(() => { recalcTopFixedHeight(); });

onMounted(async () => { await getUserList(); await fetchData(); });

onPullDownRefresh(() => { fetchData().finally(() => setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 500)); });
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :class="isDark ? 'dark' : ''">
            <wd-navbar left-arrow title="工程项目排班" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
            <view class="filter-bar" :class="isDark ? 'dark' : ''">
                <wd-datetime-picker type="year-month" v-model="selectMonth" @confirm="handleMonthChange" />
                <view class="filter-right">
                    <view class="user-filter" :class="isDark ? 'dark' : ''" @click="showFilterPopup = true"><wd-icon name="filter" size="18px" /><text>{{ selectedUserName }}</text></view>
                    <view class="query-btn" :class="isDark ? 'dark' : ''" @click="fetchData"><wd-icon name="search" size="18px" /><text>查询</text></view>
                </view>
            </view>
        </view>
        <view class="stats-bar" :class="isDark ? 'dark' : ''">
            <view class="stat-item"><text class="stat-num">{{ filteredProjects.length }}</text><text class="stat-label">个项目</text></view>
            <view class="stat-divider"></view>
            <view class="stat-item"><text class="stat-num">{{ filteredProjects.reduce((s, p) => s + getSchedulingDays(p), 0) }}</text><text class="stat-label">天排班</text></view>
        </view>
        <view class="project-list" v-if="state === 'success' || filteredProjects.length > 0">
            <view class="project-card" :class="isDark ? 'dark' : ''" v-for="p in filteredProjects" :key="p.id" @click="handleProjectClick(p)">
                <view class="card-header">
                    <view class="project-name">{{ p.projectName }}</view>
                    <view class="project-status" :class="'status-' + (p.projectStatus === '进行中' ? 'info' : p.projectStatus === '已完成' ? 'success' : 'default')">{{ p.projectStatus }}</view>
                </view>
                <view class="project-location" v-if="p.projectSite"><wd-icon name="location" size="14px" color="#999" /><text>{{ p.projectSite }}</text></view>
                <view class="card-meta" v-if="p.dispatchName || p.projectProgress || p.contractName || p.debugMode || p.taskDays">
                    <view class="meta-item"><text class="meta-label">调度名称</text><text class="meta-value">{{ p.dispatchName || '—' }}</text></view>
                    <view class="meta-item"><text class="meta-label">项目进度</text><text class="meta-value">{{ p.projectProgress || '—' }}</text></view>
                    <view class="meta-item"><text class="meta-label">调试方式</text><text class="meta-value">{{ p.debugMode || '—' }}</text></view>
                    <view class="meta-item"><text class="meta-label">工期(天)</text><text class="meta-value">{{ p.taskDays || '—' }}</text></view>
                    <view class="meta-item full"><text class="meta-label">合同名称</text><text class="meta-value">{{ p.contractName || '—' }}</text></view>
                </view>
                <view class="time-info">
                    <view class="time-item"><text class="time-value">{{ p.actualtime || 0 }}</text><text class="time-label">实际(天)</text></view>
                    <view class="time-item highlight"><text class="time-value">{{ calcMonthTotal(p).toFixed(2) }}</text><text class="time-label">本月(天)</text></view>
                    <view class="time-item"><text class="time-value real">{{ formatRealTime(p) }}</text><text class="time-label">真实总工时</text></view>
                </view>
                <view class="user-list" v-if="getProjectUsers(p).length > 0">
                    <view class="user-avatars">
                        <!-- <view class="user-avatar" v-for="(u, i) in getProjectUsers(p).slice(0, 5)" :key="i">{{ u.slice(-3) }}</view> -->
                        <view class="user-more" v-if="getProjectUsers(p).length > 5">+{{ getProjectUsers(p).length - 5 }}</view>
                    </view>
                    <text class="user-names">{{ getProjectUsers(p).join('、') }}</text>
                </view>
                <view class="schedule-preview" v-if="getSchedulingDays(p) > 0">
                    <view class="schedule-dots">
                        <view class="schedule-dot" v-for="(s, i) in getScheduledDates(p).slice(0, 10)" :key="i">
                            <text class="dot-day">{{ s.day }}日</text><text class="dot-count">{{ s.entries.length }}人</text>
                        </view>
                        <view class="schedule-dot more" v-if="getScheduledDates(p).length > 10">等{{ getScheduledDates(p).length - 10 }}天</view>
                    </view>
                </view>
                <view class="no-schedule" v-else><wd-icon name="calendar" size="20px" color="#ccc" /><text>本月暂无排班</text></view>
                <view class="card-footer"><text>查看详情</text><wd-icon name="arrow-right" size="16px" /></view>
            </view>
        </view>
        <view class="empty-state" v-else-if="state === 'empty'"><wd-status-tip image="empty" tip="暂无排班数据" /></view>
        <view class="loading-state" v-else-if="state === 'loading'"><wd-loading /></view>
        <view class="error-state" v-else-if="state === 'error'"><wd-status-tip image="error" tip="加载失败" @errorclick="fetchData" /></view>
        <wd-popup v-model="showFilterPopup" position="bottom" :safe-area-inset-bottom="true">
            <view class="filter-popup" :class="isDark ? 'dark' : ''">
                <view class="popup-header"><text class="popup-title">选择人员</text><wd-icon name="close" size="20px" @click="showFilterPopup = false" /></view>
                <view class="popup-content">
                    <view class="filter-option" :class="{ active: selectedUserId === null }" @click="handleUserSelect(null)"><text>全部人员</text><wd-icon v-if="selectedUserId === null" name="check" size="18px" color="#007aff" /></view>
                    <view class="filter-option" :class="{ active: selectedUserId === u.id }" v-for="u in userList.filter((item:any)=>item.status==0)" :key="u.id" @click="handleUserSelect(u.id)">
                        <text>{{ u.username }}</text><wd-icon v-if="selectedUserId === u.id" name="check" size="18px" color="#007aff" />
                    </view>
                </view>
            </view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap { position: fixed; top: 0; left: 0; width: 100%; z-index: 99; background: #F5F5F5; }
.topFixedWrap.dark { background: #1b1b1b; }
.filter-bar { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 20rpx; background: #fff; border-bottom: 1px solid #eee; }
.filter-bar.dark { background: #1b1b1b; border-color: #333; }
.filter-right { display: flex; align-items: center; gap: 16rpx; }
.filter-type-tabs { display: flex; background: #f0f0f0; border-radius: 8rpx; overflow: hidden; }
.filter-type-tabs.dark { background: #333; }
.filter-tab { padding: 12rpx 20rpx; font-size: 24rpx; color: #666; }
.filter-tab.active { background: #007aff; color: #fff; }
.user-filter { display: flex; align-items: center; gap: 8rpx; padding: 12rpx 20rpx; background: #f0f0f0; border-radius: 8rpx; font-size: 24rpx; color: #333; }
.user-filter.dark { background: #333; color: #fff; }
.query-btn { display: flex; align-items: center; gap: 8rpx; padding: 12rpx 24rpx; background: #007aff; border-radius: 8rpx; font-size: 24rpx; color: #fff; }
.query-btn.dark { background: #0a62d9; }
.stats-bar { display: flex; align-items: center; justify-content: center; gap: 40rpx; padding: 24rpx; background: linear-gradient(135deg, #007aff 0%, #5856d6 100%); color: #fff; }
.stats-bar.dark { background: linear-gradient(135deg, #1a4a8a 0%, #2d2a5e 100%); }
.stat-item { display: flex; align-items: baseline; gap: 8rpx; }
.stat-num { font-size: 40rpx; font-weight: bold; }
.stat-label { font-size: 24rpx; opacity: 0.8; }
.stat-divider { width: 1px; height: 40rpx; background: rgba(255, 255, 255, 0.3); }
.project-list { padding: 20rpx; display: flex; flex-direction: column; gap: 20rpx; }
.project-card { background: #fff; border-radius: 20rpx; padding: 24rpx; box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05); }
.project-card.dark {
    background: #1b1b1b;
    .project-name { color: #fff; }
    .project-status.status-info { background: rgba(0, 122, 255, 0.2); color: #5aabff; }
    .project-status.status-success { background: rgba(0, 180, 42, 0.2); color: #36b353; }
    .project-status.status-default { background: #333; color: #999; }
    .project-location { color: #888; }
    .meta-label { color: #888; }
    .meta-value { color: #fff; }
    .time-item { background: #252525; }
    .time-item.highlight { background: linear-gradient(135deg, rgba(255, 180, 0, 0.16) 0%, rgba(255, 120, 0, 0.16) 100%); }
    .time-value { color: #fff; }
    .time-item.highlight .time-value { color: #ffb854; }
    .time-label { color: #888; }
    .user-more { background: #252525; border-color: #1b1b1b; color: #999; }
    .user-names { color: #999; }
    .schedule-dot { background: rgba(0, 122, 255, 0.15); }
    .schedule-dot.more { background: #252525; color: #999; }
    .dot-day { color: #5aabff; }
    .dot-count { color: #999; }
    .no-schedule { background: #252525; color: #888; }
    .card-footer { border-top-color: #333; }
}
.card-header { display: flex; justify-content: space-between; margin-bottom: 16rpx; }
.project-name { font-size: 30rpx; font-weight: 600; color: #333; flex: 1; margin-right: 16rpx; }
.project-name.dark { color: #fff; }
.project-status { align-self: flex-start; font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 20rpx; }
.project-status.status-info { background: #e6f2ff; color: #007aff; }
.project-status.status-success { background: #e6fff0; color: #00b42a; }
.project-status.status-default { background: #f0f0f0; color: #666; }
.project-location { display: flex; align-items: center; gap: 8rpx; font-size: 24rpx; color: #999; margin-bottom: 20rpx; }
.card-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx 20rpx; margin-bottom: 20rpx; }
.meta-item { min-width: 0; }
.meta-item.full { grid-column: 1 / -1; }
.meta-label { display: block; font-size: 20rpx; color: #999; margin-bottom: 4rpx; }
.meta-value { display: block; font-size: 24rpx; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time-info { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.time-item { flex: 1; background: #f8f8f8; border-radius: 12rpx; padding: 16rpx; text-align: center; }
.time-item.highlight { background: linear-gradient(135deg, #fff7e6 0%, #ffe6cc 100%); }
.time-item.dark { background: #252525; }
.time-value { display: block; font-size: 32rpx; font-weight: bold; color: #333; }
.time-value.real { font-size: 26rpx; }
.time-label { display: block; font-size: 20rpx; color: #999; margin-top: 4rpx; }
.user-list { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; }
.user-avatars { display: flex; }
.user-avatar { width: 48rpx; height: 48rpx; border-radius: 50%; background: linear-gradient(135deg, #007aff 0%, #5856d6 100%); color: #fff; font-size: 20rpx; display: flex; align-items: center; justify-content: center; margin-left: -12rpx; border: 4rpx solid #fff; }
.user-avatar:first-child { margin-left: 0; }
.user-more { width: 48rpx; height: 48rpx; border-radius: 50%; background: #f0f0f0; color: #666; font-size: 18rpx; display: flex; align-items: center; justify-content: center; margin-left: -12rpx; border: 4rpx solid #fff; }
.user-names { font-size: 24rpx; color: #666; flex: 1; }
.schedule-preview { margin-bottom: 20rpx; }
.schedule-dots { display: flex; flex-wrap: wrap; gap: 12rpx; }
.schedule-dot { display: flex; align-items: center; gap: 8rpx; padding: 8rpx 16rpx; background: #f0f7ff; border-radius: 8rpx; border-left: 4rpx solid #007aff; }
.schedule-dot.more { background: #f5f5f5; border-left: none; color: #999; font-size: 22rpx; }
.dot-day { font-size: 24rpx; color: #007aff; font-weight: 500; }
.dot-count { font-size: 22rpx; color: #666; }
.no-schedule { display: flex; align-items: center; justify-content: center; gap: 12rpx; padding: 24rpx; background: #f9f9f9; border-radius: 12rpx; margin-bottom: 20rpx; color: #ccc; }
.card-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8rpx; padding-top: 16rpx; border-top: 1px solid #f0f0f0; font-size: 26rpx; color: #007aff; }
.empty-state, .loading-state, .error-state { display: flex; align-items: center; justify-content: center; min-height: 50vh; }
.filter-popup { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 70vh; }
.filter-popup.dark {
    background: #1b1b1b;
    .popup-header { border-bottom-color: #333; }
    .popup-title { color: #fff; }
    .filter-option { color: #e8e8e8; }
    .filter-option.active { background: rgba(0, 122, 255, 0.2); color: #5aabff; }
}
.popup-header { display: flex; justify-content: space-between; align-items: center; padding: 32rpx; border-bottom: 1px solid #eee; }
.popup-title { font-size: 32rpx; font-weight: 600; color: #333; }
.popup-content { padding: 20rpx; max-height: 60vh; overflow-y: auto; }
.filter-option { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 20rpx; font-size: 28rpx; color: #333; border-radius: 12rpx; }
.filter-option.active { background: #e6f2ff; color: #007aff; }
</style>