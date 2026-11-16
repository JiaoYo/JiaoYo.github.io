<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === "dark");

// 项目数据
const project = ref<any>(null);
const currentMonth = ref("");

// 计算属性
const monthDisplay = computed(() => {
    if (!currentMonth.value) return "";
    const [year, month] = currentMonth.value.split("-");
    return `${year}年${parseInt(month)}月`;
});

const monthShort = computed(() => {
    if (!currentMonth.value) return "本月";
    const [, month] = currentMonth.value.split("-");
    return `${parseInt(month)}月`;
});

// 获取有排班的日期列表
const getScheduledDays = (p: any): number => {
    if (!p.days) return 0;
    return p.days.filter((d: any[]) => d && d.length > 0).length;
};

// 获取所有排班人员及工时
const getAllUsers = computed(() => {
    if (!project.value || !project.value.days) return [];
    const userMap = new Map<string, { name: string; days: number; hours: number }>();
    
    project.value.days.forEach((entries: any[], dayIndex: number) => {
        if (entries && entries.length > 0) {
            entries.forEach((entry: any) => {
                const name = entry.username || "未知";
                if (!userMap.has(name)) {
                    userMap.set(name, { name, days: 0, hours: 0 });
                }
                const user = userMap.get(name)!;
                user.days++;
                user.hours += entry.hours || 0;
            });
        }
    });
    
    return Array.from(userMap.values()).sort((a, b) => b.hours - a.hours);
});

// 获取每日排班详情
const getDailySchedule = computed(() => {
    if (!project.value || !project.value.days) return [];
    const result: { date: string; day: number; weekday: string; entries: any[] }[] = [];
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    
    project.value.days.forEach((entries: any[], dayIndex: number) => {
        if (entries && entries.length > 0) {
            const [year, month] = currentMonth.value.split("-").map(Number);
            const date = new Date(year, month - 1, dayIndex + 1);
            result.push({
                date: `${month}月${dayIndex + 1}日`,
                day: dayIndex + 1,
                weekday: weekdays[date.getDay()],
                entries: entries.sort((a: any, b: any) => b.hours - a.hours)
            });
        }
    });
    
    return result;
});

// 计算本月总工时
const calcMonthTotal = computed(() => {
    if (!project.value || !project.value.days) return 0;
    return project.value.days.reduce((acc: number, day: any[]) => {
        if (!day || day.length === 0) return acc;
        return acc + (day.length > 1 ? 1 : Number(day[0]?.hours || 0));
    }, 0);
});

const formatRealTime = (p: any) => {
    const realHours = Number(p.realtime ?? 0) || 0;
    if (realHours <= 0) return "0";
    const days = Math.floor(realHours / 8);
    const hours = Number((realHours % 8).toFixed(1));
    return hours === 0 ? `${days}天` : `${days}天${hours}小时`;
};
function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif
    // #ifndef H5
    uni.navigateBack();
    // #endif
}

onLoad((options: any) => {
    if (options.project) {
        // H5 等平台路由会先解码一次查询参数；编码态的 JSON 含 %XX 不可能是合法 JSON，
        // 先按明文 parse，失败再解码 parse，可避免二次解码遇到数据里的 % 抛 URIError
        try {
            project.value = JSON.parse(options.project);
        } catch (e1) {
            try {
                project.value = JSON.parse(decodeURIComponent(options.project));
            } catch (e2) {
                console.error("解析项目数据失败", e2);
            }
        }
    }
    if (options.month) {
        currentMonth.value = options.month;
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <!-- 顶部导航 -->
        <wd-navbar left-arrow :title="monthDisplay ? monthDisplay + '排班' : '排班详情'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

        <view class="page-content" v-if="project">
            <!-- 项目信息卡片 -->
            <view class="project-header" :class="isDark ? 'dark' : ''">
                <view class="header-top">
                    <view class="project-name">{{ project.projectName }}</view>
                    <!-- ✅ 修复点1：状态动态类名，使用单引号包裹整个表达式 -->
                    <view class="project-status" :class="'status-' + (project.projectStatus === '进行中' ? 'info' : project.projectStatus === '已完成' ? 'success' : 'default')">
                        {{ project.projectStatus }}
                    </view>
                </view>
                <view class="project-location" v-if="project.projectSite">
                    <wd-icon name="location" size="14px" color="#999" />
                    <text>{{ project.projectSite }}</text>
                </view>
                <view class="project-meta" v-if="project.dispatchName || project.projectProgress || project.contractName || project.debugMode || project.taskDays">
                    <view class="meta-item"><text class="meta-label">调度名称</text><text class="meta-value">{{ project.dispatchName || '—' }}</text></view>
                    <view class="meta-item"><text class="meta-label">项目进度</text><text class="meta-value">{{ project.projectProgress || '—' }}</text></view>
                    <view class="meta-item"><text class="meta-label">调试方式</text><text class="meta-value">{{ project.debugMode || '—' }}</text></view>
                    <view class="meta-item"><text class="meta-label">工期(天)</text><text class="meta-value">{{ project.taskDays || '—' }}</text></view>
                    <view class="meta-item full"><text class="meta-label">合同名称</text><text class="meta-value">{{ project.contractName || '—' }}</text></view>
                </view>
                <view class="time-stats">
                    <view class="stat-item">
                        <text class="stat-value">{{ project.actualtime || 0 }}</text>
                        <text class="stat-label">实际(天)</text>
                    </view>
                    <view class="stat-divider"></view>
                    <view class="stat-item">
                        <text class="stat-value">{{ calcMonthTotal.toFixed(2) }}</text>
                        <text class="stat-label">{{ monthShort }}(天)</text>
                    </view>
                    <view class="stat-divider"></view>
                    <view class="stat-item">
                        <text class="stat-value real">{{ formatRealTime(project) }}</text>
                        <text class="stat-label">真实总工时</text>
                    </view>
                </view>
            </view>

            <!-- 排班人员 -->
            <!-- ✅ 修复点2：所有 isDark 双引号改为单引号 -->
            <view class="section" :class="isDark ? 'dark' : ''">
                <view class="section-title">
                    <wd-icon name="user" size="18px" color="#007aff" />
                    <text>排班人员 ({{ getAllUsers.length }}人)</text>
                </view>
                <view class="user-list">
                    <view class="user-card" :class="isDark ? 'dark' : ''" v-for="(user, idx) in getAllUsers" :key="idx">
                        <view class="user-avatar">{{ user.name.slice(-2) }}</view>
                        <view class="user-info">
                            <text class="user-name">{{ user.name }}</text>
                            <text class="user-stats">排班 {{ user.days }}天 · 工时 {{ user.hours.toFixed(2) }}天</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 每日排班时间轴 -->
            <view class="section" :class="isDark ? 'dark' : ''">
                <view class="section-title">
                    <wd-icon name="calendar" size="18px" color="#007aff" />
                    <text>每日排班 ({{ getScheduledDays(project) }}天有排班)</text>
                </view>
                <view class="timeline">
                    <view class="timeline-item" v-for="(day, idx) in getDailySchedule" :key="idx">
                        <view class="timeline-date">
                            <!-- ✅ 修复点2 -->
                            <view class="date-badge" :class="isDark ? 'dark' : ''">
                                <text class="date-day">{{ day.day }}日</text>
                                <text class="date-weekday">{{ day.weekday }}</text>
                            </view>
                            <view class="timeline-line" v-if="idx < getDailySchedule.length - 1"></view>
                        </view>
                        <view class="timeline-content">
                            <view class="schedule-entry" v-for="(entry, eIdx) in day.entries" :key="eIdx">
                                <!-- ✅ 修复点3：对象键名不需要引号，或改为单引号 -->
                                <view class="entry-dot" :class="{ multi: day.entries.length > 1 }"></view>
                                <view class="entry-info">
                                    <text class="entry-name">{{ entry.username }}</text>
                                    <text class="entry-hours" :class="{ zero: entry.hours === 0 }">
                                        {{ entry.hours > 0 ? entry.hours + "天" : "0天" }}
                                    </text>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 无数据 -->
        <view class="empty-state" v-else>
            <wd-status-tip image="empty" tip="暂无项目数据" />
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.page-content { padding: 20rpx; }

.project-header {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

    &.dark { background: #1b1b1b; box-shadow: none; }
}

.header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16rpx; }

.project-name { font-size: 32rpx; font-weight: 600; color: #333; flex: 1; margin-right: 16rpx; .dark & { color: #fff; } }

.project-status {
    font-size: 22rpx;
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    flex-shrink: 0;

    &.status-info { background: #e6f2ff; color: #007aff; }
    &.status-success { background: #e6fff0; color: #00b42a; }
    &.status-default { background: #f0f0f0; color: #666; }

    .dark & {
        &.status-info { background: rgba(0, 122, 255, 0.2); color: #5aabff; }
        &.status-success { background: rgba(0, 180, 42, 0.2); color: #36b353; }
        &.status-default { background: #333; }
    }
}

.project-location { display: flex; align-items: center; gap: 8rpx; font-size: 24rpx; color: #999; margin-bottom: 20rpx; .dark & { color: #888; } }

.project-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx 20rpx; margin-bottom: 20rpx; }
.meta-item { min-width: 0; }
.meta-item.full { grid-column: 1 / -1; }
.meta-label { display: block; font-size: 20rpx; color: #999; margin-bottom: 4rpx; .dark & { color: #888; } }
.meta-value { display: block; font-size: 24rpx; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; .dark & { color: #fff; } }

.time-stats { display: flex; align-items: center; gap: 16rpx; }
.stat-item { flex: 1; background: #f8f8f8; border-radius: 12rpx; padding: 16rpx; text-align: center; &.highlight { background: linear-gradient(135deg, #fff7e6 0%, #ffe6cc 100%); } .dark & { background: #252525; } }
.stat-divider { width: 1px; height: 40rpx; background: #eee; .dark & { background: #333; } }
.stat-value { display: block; font-size: 32rpx; font-weight: bold; color: #333; .dark & { color: #fff; } }
.stat-value.real { font-size: 24rpx; }
.stat-label { display: block; font-size: 20rpx; color: #999; margin-top: 4rpx; .dark & { color: #888; } }

.section {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

    &.dark { background: #1b1b1b; box-shadow: none; }
}

.section-title { display: flex; align-items: center; gap: 12rpx; font-size: 28rpx; font-weight: 600; color: #333; margin-bottom: 20rpx; .dark & { color: #fff; } }

.user-list { display: flex; flex-direction: column; gap: 16rpx; }

.user-card {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx;
    background: #f8f8f8;
    border-radius: 12rpx;

    &.dark { background: #252525; }
}

.user-avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
    color: #fff;
    font-size: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.user-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.user-name { font-size: 28rpx; font-weight: 500; color: #333; .dark & { color: #fff; } }
.user-stats { font-size: 22rpx; color: #999; .dark & { color: #888; } }

.timeline { display: flex; flex-direction: column; }

.timeline-item { display: flex; gap: 20rpx; }

.timeline-date { display: flex; flex-direction: column; align-items: center; }

.date-badge {
    width: 80rpx;
    background: #f0f7ff;
    border-radius: 12rpx;
    padding: 12rpx 8rpx;
    text-align: center;

    &.dark { background: rgba(0, 122, 255, 0.15); }
}

.date-day { display: block; font-size: 28rpx; font-weight: 600; color: #007aff; .dark & { color: #5aabff; } }
.date-weekday { display: block; font-size: 20rpx; color: #666; .dark & { color: #888; } margin-top: 4rpx; }

.timeline-line { width: 4rpx; flex: 1; min-height: 40rpx; background: linear-gradient(180deg, #007aff 0%, #e6f2ff 100%); margin-top: 8rpx; .dark & { background: linear-gradient(180deg, #5aabff 0%, rgba(0, 122, 255, 0.15) 100%); } }

.timeline-content { flex: 1; display: flex; flex-direction: column; gap: 16rpx; padding-bottom: 32rpx; }

.schedule-entry { display: flex; align-items: center; gap: 16rpx; padding: 16rpx; background: #f8f8f8; border-radius: 12rpx; margin-top: 8rpx; .dark & { background: #252525; } }

.entry-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: #00b42a;
    flex-shrink: 0;

    &.multi { background: #007aff; }
}

.entry-info { flex: 1; display: flex; justify-content: space-between; align-items: center; }
.entry-name { font-size: 28rpx; font-weight: 500; color: #333; .dark & { color: #fff; } }
.entry-hours { font-size: 24rpx; color: #00b42a; font-weight: 500; &.zero { color: #ff4d4f; } .dark & { &.zero { color: #ff7875; } } }

.empty-state { display: flex; align-items: center; justify-content: center; min-height: 50vh; }
</style>