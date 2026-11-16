<script lang="ts" setup>
import { reactive, ref, computed, nextTick, onMounted } from "vue";
import { onReady, onPageScroll, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchRdReportPage } from "@/service/rdassessment";
import { fetchGetAllUserDataList } from "@/service/member";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === "dark");
const scrollTop = ref<number>(0);
const topFixedHeight = ref<number>(200);
const userType = ref<any>(uni.getStorageSync("usertype"));

const dataForm = reactive({
    page: 1, limit: 20, total: 0,
    state: "loading" as string,
    month: "",
    monthweek: null as number | null,
    rdtype: null as number | null,
});

const selectedMonth = ref<number | null>(null);
const selectedUser = ref<{ id: string | number; name: string } | null>(null);
const showUserPicker = ref(false);
const selectedMonthValue = ref<any>("");
const selectedWeekValue = ref<any>("");
const selectedDeptValue = ref<any>("");

const deptOptions = [
    { label: "平台", value: 0 },
    { label: "数据通讯", value: 1 },
    { label: "网络安全", value: 2 },
];

const deptTypeMap: Record<number, string> = {
    0: "primary", 1: "success", 2: "warning",
};

const weekOptions = ref<{ label: string; value: number }[]>([]);
const userList = ref<any[]>([]);
const userColumns = computed(() => {
    const cols = [{ label: "全部", value: "" }];
    userList.value.forEach((user: any) => {
        cols.push({ label: user.username || user.name || '未知', value: user.id });
    });
    return cols;
});
const selectedUserValue = ref<any>("");
const reportList = ref<any[]>([]);
const expandedIndex = ref<number | null>(null);
const listLoading = ref(false);
let pendingReload = false;

function toggleExpand(index: number) {
    expandedIndex.value = expandedIndex.value === index ? null : index;
}

function getWeeksInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let firstWeekday = firstDay.getDay();
    firstWeekday = firstWeekday === 0 ? 7 : firstWeekday;
    return Math.ceil((lastDay.getDate() + firstWeekday - 1) / 7);
}

function updateWeekOptions() {
    if (!dataForm.month) { weekOptions.value = []; return; }
    const [year, month] = dataForm.month.split("-").map(Number);
    const weeksCount = getWeeksInMonth(year, month - 1);
    weekOptions.value = [{ label: "请选择", value: "" }];
    for (let i = 1; i <= weeksCount; i++) {
        weekOptions.value.push({ label: "第" + i + "周", value: i });
    }
    if (dataForm.monthweek && dataForm.monthweek > weeksCount) { dataForm.monthweek = null; }
}

const monthColumns = computed(() => {
    const cols = [{ label: "请选择", value: "" }];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        cols.push({ label: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"), value: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") });
    }
    return cols;
});

function setLastWeek() {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let currentWeekday = currentDate.getDay();
    currentWeekday = currentWeekday === 0 ? 7 : currentWeekday;
    const lastSunday = new Date(currentDate);
    lastSunday.setDate(currentDate.getDate() - currentWeekday);
    const year = lastSunday.getFullYear();
    const month = lastSunday.getMonth();
    dataForm.month = year + "-" + String(month + 1).padStart(2, "0");
    dataForm.monthweek = Math.floor((lastSunday.getDate() - 1) / 7) + 1;
    selectedMonth.value = new Date(year, month, 1).getTime();
    selectedMonthValue.value = dataForm.month;
    selectedWeekValue.value = dataForm.monthweek;
    updateWeekOptions();
}

function handleMonthChange({ value }: any) {
    if (!value) { clearMonthFilter(); return; }
    dataForm.month = value;
    dataForm.monthweek = null;
    selectedWeekValue.value = "";
    updateWeekOptions();
    dataForm.page = 1; reportList.value = []; getReportList();
}

function handleWeekChange({ value }: any) {
    dataForm.monthweek = value || null;
    dataForm.page = 1; reportList.value = []; getReportList();
}

function handleDeptChange({ value }: any) {
    dataForm.rdtype = value;
    dataForm.page = 1; reportList.value = []; getReportList();
}


async function searchUserList() {
    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 200, usertypes: "5,8" });
        userList.value = Array.isArray(data.list) ? data.list : [];
        userList.value.unshift({ id: "999", username: "李吉峰" }, { id: "1030", username: "徐顺乐" }, { id: "1036", username: "孙东洪" });
        if (!userList.value.some((user: any) => user.id === "1024")) { userList.value.push({ username: "张豪", id: "1024" }); }
    } catch (err) { console.error("获取人员列表失败", err); userList.value = []; }
}



function handleUserChange({ value }: any) {
    if (!value) {
        selectedUser.value = null;
        selectedUserValue.value = "";
        dataForm.page = 1; reportList.value = []; getReportList();
        return;
    }
    const user = userList.value.find((u: any) => u.id == value);
    if (user) { selectedUser.value = { id: user.id, name: user.username || user.name }; selectedUserValue.value = value; }
    dataForm.page = 1; reportList.value = []; getReportList();
}

function clearUser() {
    selectedUser.value = null;
    selectedUserValue.value = "";
    dataForm.page = 1; reportList.value = []; getReportList();
}
function copyContent(content: string) {
    uni.setClipboardData({
        data: content,
        success: () => { uni.showToast({ title: "已复制", icon: "none" }); }
    });
}

function getDeptName(type: number): string {
    const map: Record<number, string> = { 0: "平台", 1: "数据通讯", 2: "网络安全" };
    return map[type] || "-";
}

function getDeptType(type: number): string { return deptTypeMap[type] || "default"; }

async function getReportList() {
    if (listLoading.value) { pendingReload = true; return; }
    listLoading.value = true;
    dataForm.state = "loading";
    try {
        if (dataForm.page === 1) { reportList.value = []; }
        const params: any = { page: dataForm.page, limit: dataForm.limit };
        if (dataForm.month) params.month = dataForm.month;
        if (dataForm.monthweek !== null) params.monthweek = dataForm.monthweek;
        if (dataForm.rdtype !== null) params.rdtype = dataForm.rdtype;
        if (selectedUser.value) params.creater = selectedUser.value.id;
        const data = await fetchRdReportPage(params);
        reportList.value = reportList.value.concat(data.list || []);
        dataForm.total = Number(data.total || 0);
        dataForm.state = reportList.value.length < dataForm.total ? "loadmore" : "finished";
    } catch (err) { console.error("获取研发周报列表失败", err); dataForm.state = "error"; }
    finally { listLoading.value = false; if (pendingReload) { pendingReload = false; getReportList(); } }
}

function handleClickLeft() {  uni.navigateBack(); }

function handleResetFilter() {
    selectedMonth.value = null; dataForm.month = ""; dataForm.monthweek = null; dataForm.rdtype = null; selectedUser.value = null;
    selectedMonthValue.value = ""; selectedWeekValue.value = ""; selectedDeptValue.value = ""; selectedUserValue.value = ""; weekOptions.value = [];
    dataForm.page = 1; reportList.value = []; getReportList();
    uni.showToast({ title: "已清除筛选", icon: "none" });
}

function clearMonthFilter() {
    selectedMonth.value = null; dataForm.month = ""; dataForm.monthweek = null;
    selectedMonthValue.value = ""; selectedWeekValue.value = ""; weekOptions.value = [];
    dataForm.page = 1; reportList.value = []; getReportList();
}

function clearWeekFilter() {
    dataForm.monthweek = null; selectedWeekValue.value = "";
    dataForm.page = 1; reportList.value = []; getReportList();
}

function clearDeptFilter() {
    dataForm.rdtype = null; selectedDeptValue.value = "";
    dataForm.page = 1; reportList.value = []; getReportList();
}

function recalcTopFixedHeight() {
    try {
        uni.createSelectorQuery().select(".topFixedWrap").boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) { topFixedHeight.value = rect.height; }
        }).exec();
    } catch (err) { topFixedHeight.value = 200; }
}

onReady(() => { setLastWeek(); getReportList(); });
onMounted(() => { searchUserList(); nextTick(() => { setTimeout(() => { recalcTopFixedHeight(); }, 80); }); });
onPageScroll((e) => { scrollTop.value = e.scrollTop; });
onPullDownRefresh(() => { dataForm.page = 1; getReportList(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (listLoading.value) return; if (reportList.value.length < dataForm.total) { dataForm.page++; getReportList(); } else { dataForm.state = "finished"; } });
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f5f5;'" :theme="theme">
    <div class="index-page" :class="{ dark: isDark }">
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="研发周报" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <view style="padding: 0 20rpx; margin-bottom: 6rpx;">
                <wd-row>
                    <wd-col :span="12">
                        <view class="filter-item">
                            <wd-picker view-mode="cell" label="月份" label-width="80rpx" ellipsis v-model="selectedMonthValue" :columns="monthColumns" @confirm="handleMonthChange" placeholder="选择月份" custom-style="flex: 1; min-width: 0;" />
                            <view v-if="dataForm.month" class="filter-clear" @click="clearMonthFilter"><wd-icon name="close-circle" size="16px" color="#c8c9cc"></wd-icon></view>
                        </view>
                    </wd-col>
                    <wd-col :span="12">
                        <view class="filter-item">
                            <wd-picker view-mode="cell" label="周次" label-width="80rpx" ellipsis v-model="selectedWeekValue" :columns="weekOptions" @confirm="handleWeekChange" placeholder="选择周次" custom-style="flex: 1; min-width: 0;" />
                            <view v-if="dataForm.monthweek !== null" class="filter-clear" @click="clearWeekFilter"><wd-icon name="close-circle" size="16px" color="#c8c9cc"></wd-icon></view>
                        </view>
                    </wd-col>
                </wd-row>
                <wd-row v-if="userType === 0 || userType === 4">
                    <wd-col :span="12">
                        <view class="filter-item">
                            <wd-picker view-mode="cell" label="部门" label-width="80rpx" ellipsis v-model="selectedDeptValue" :columns="deptOptions" @confirm="handleDeptChange" placeholder="选择部门" custom-style="flex: 1; min-width: 0;" />
                            <view v-if="dataForm.rdtype !== null" class="filter-clear" @click="clearDeptFilter"><wd-icon name="close-circle" size="16px" color="#c8c9cc"></wd-icon></view>
                        </view>
                    </wd-col>
                    <wd-col :span="12">
                        <view class="filter-item">
                            <wd-picker view-mode="cell" label="人员" label-width="80rpx" ellipsis v-model="selectedUserValue" :columns="userColumns" @confirm="handleUserChange" placeholder="选择人员" custom-style="flex: 1; min-width: 0;" />
                            <view v-if="selectedUser !== null" class="filter-clear" @click="clearUser"><wd-icon name="close-circle" size="16px" color="#c8c9cc"></wd-icon></view>
                        </view>
                    </wd-col>
                </wd-row>
            </view>
            <view class="summary-bar">
                <view class="summary-chip"><text class="summary-dot"></text><text class="summary-text">已加载 <text class="summary-num">{{ reportList.length }}</text> / 共 <text class="summary-num">{{ dataForm.total }}</text> 条</text></view>
                <view class="filter-reset" @click="handleResetFilter">
                    <wd-icon name="refresh" size="13px" color="#4e5969"></wd-icon>
                    <text class="filter-reset-text">清除筛选</text>
                </view>
            </view>
        </view>

        <div class="list-section">
            <div v-if="reportList.length === 0 && dataForm.state !== 'loading'" class="empty-tips">
                <wd-icon name="warning" size="48px" />
                <span>暂无数据</span>
            </div>

            <view v-for="(item, index) in reportList" :key="index" class="list-item">
                <view class="item-header" @click="toggleExpand(index)">
                    <text class="item-name">{{ item.createrName || item.username || '-' }}</text>
                    <wd-tag :type="getDeptType(item.rdtype)" >
                        {{ getDeptName(item.rdtype) }}
                    </wd-tag>
                    <wd-icon :name="expandedIndex === index ? 'arrow-up' : 'arrow-down'" size="14px" />
                </view>
                <view class="item-info">
                    <text class="item-time">{{ item.month || '-' }} 第{{ item.monthweek || '-' }}周</text>
                </view>
                <view v-if="expandedIndex === index" class="item-detail">
                  <view class="report-meta">
                    <view class="meta-row">
                      <text class="meta-label">统计周期：</text>
                      <text class="meta-value">{{ item.stratdate }} ~ {{ item.enddate }}</text>
                    </view>
                    <view class="meta-row">
                      <text class="meta-label">创建时间：</text>
                      <text class="meta-value">{{ item.dbtime }}</text>
                    </view>
                  </view>
                  <view class="report-content">
                    <view class="detail-copy" @click="copyContent(item.weekcontent)">复制</view>
                    {{ item.weekcontent }}
                    </view>
                </view>
            </view>

            <wd-loadmore :state="dataForm.state" />
        </div>
    </div>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.index-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: env(safe-area-inset-bottom);

    &.dark {
        background: #1a1a1a;
    }
}

.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    background-color: #FFFFFF;
    box-sizing: border-box;
}
.filter-item { display: flex; align-items: center; height: 80rpx; box-sizing: border-box; }
.filter-clear { padding: 10rpx 10rpx 10rpx 0; }
.summary-bar { padding: 16rpx 30rpx; display: flex; align-items: center; justify-content: space-between; }
.filter-reset { display: inline-flex; align-items: center; gap: 6rpx; padding: 8rpx 20rpx; border-radius: 999rpx; background: #f0f1f3; }
.filter-reset-text { font-size: 24rpx; color: #4e5969; }
.summary-chip { display: inline-flex; align-items: center; gap: 10rpx; padding: 8rpx 20rpx; border-radius: 999rpx; background: #f7f8fa; font-size: 24rpx; color: #4e5969; }
.summary-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%); }
.summary-num { font-weight: 600; color: #1677ff; margin: 0 4rpx; }
.custom-cell { display: flex; align-items: center; flex: 1; min-width: 0; height: 80rpx; box-sizing: border-box; padding-right: 10rpx; }
.cell-label { font-size: 28rpx; color: #646466; min-width: 80rpx; }
.cell-value { flex: 1; font-size: 28rpx; color: #323233; text-align: right; padding-right: 8rpx; }
.cell-value.placeholder { color: #999; }

.list-section {
    margin: 20rpx;

    .empty-tips {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 100rpx 0;
        color: #999;
        font-size: 28rpx;
        gap: 24rpx;
    }

    .list-item {
        background: #fff;
        border-radius: 20rpx;
        padding: 24rpx;
        margin-bottom: 20rpx;
        box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

        .dark & {
            background: #2d2d2d;
        }

        .item-header {
            display: flex;
            align-items: center;
            gap: 16rpx;
            margin-bottom: 16rpx;

            .item-name {
                font-size: 32rpx;
                font-weight: bold;
                color: #333;

                .dark & {
                    color: #fff;
                }
            }
        }

        .item-info {
            margin-bottom: 12rpx;

            .item-time {
                font-size: 28rpx;
                color: #666;

                .dark & {
                    color: #999;
                }
            }
        }

        .item-detail {
            margin-top: 24rpx;
            padding-top: 24rpx;
            border-top: 1rpx solid #eee;

            .dark & {
                border-top-color: #444;
            }

            .report-meta {
                margin-bottom: 16rpx;

                .meta-row {
                    display: flex;
                    font-size: 26rpx;
                    color: #666;
                    margin-bottom: 8rpx;

                    .dark & {
                        color: #999;
                    }

                    .meta-label {
                        font-weight: bold;
                        color: #333;

                        .dark & {
                            color: #ccc;
                        }
                    }

                    .meta-value {
                        flex: 1;
                    }
                }
            }

            .report-content {
                position: relative;
                background: #f8f8f8;
                padding: 24rpx;
                border-radius: 8rpx;
                font-size: 26rpx;
                color: #333;
                white-space: pre-wrap;
                word-break: break-all;
                line-height: 1.6;

                .dark & {
                    background: #252525;
                    color: #ddd;
                }

                .detail-copy {
                    position: absolute;
                    top: 12rpx;
                    right: 12rpx;
                    padding: 8rpx 16rpx;
                    font-size: 24rpx;
                    color: #1677ff;
                    background: #e6f4ff;
                    border-radius: 8rpx;

                    .dark & {
                        color: #69b1ff;
                        background: #1a1a2e;
                    }
                }
            }
        }
    }
}

.user-picker-popup {
    background: #fff;
    border-radius: 24rpx 24rpx 0 0;
    max-height: 60vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .dark & {
        background: #2d2d2d;
    }

    .popup-header {
        padding: 32rpx;
        text-align: center;
        font-size: 32rpx;
        font-weight: bold;
        border-bottom: 1rpx solid #eee;

        .dark & {
            border-bottom-color: #444;
        }
    }

    .user-list {
        flex: 1;
        overflow-y: auto;
        padding: 24rpx;

        .user-item {
            padding: 24rpx;
            text-align: center;
            font-size: 28rpx;
            border-bottom: 1rpx solid #f5f5f5;
            cursor: pointer;

            .dark & {
                border-bottom-color: #444;
            }

            &:active {
                background: #f5f5f5;
            }
        }
    }
}

/* 暗黑模式适配 */
.wot-theme-dark {
    .topFixedWrap {
        background-color: #1b1b1b !important;
    }

    .filter-item {
        :deep(.wd-cell__title) {
            color: #8a9099 !important;
        }
        :deep(.wd-cell__value) {
            color: #e8e8e8 !important;
        }
        :deep(.wd-cell__placeholder) {
            color: #6A7590 !important;
        }
    }

    .filter-clear {
        :deep(.wd-icon) {
            color: #6A7590 !important;
        }
    }

    .summary-bar {
        background: #1b1b1b;
    }

    .summary-chip {
        background: #2a2a2a;
        border-color: rgba(255,255,255,0.12);
        color: #8a9099;
    }

    .summary-dot {
        background: linear-gradient(135deg, #69b1ff 0%, #1677ff 100%);
    }

    .summary-num {
        color: #69b1ff;
    }

    .filter-reset {
        background: #2a2a2a;
        .filter-reset-text { color: #8a9099; }
        :deep(.wd-icon) { color: #8a9099 !important; }
    }

    /* 列表卡片 */
    .list-item {
        background: #2a2a2a !important;
        box-shadow: none !important;

        .item-header .item-name { color: #e8e8e8 !important; }
        .item-info .item-time { color: #999 !important; }
        .item-detail {
            border-top-color: #3a3a3a !important;
            .report-meta .meta-row {
                color: #999 !important;
                .meta-label { color: #ccc !important; }
            }
            .report-content {
                background: #1b1b1b !important;
                color: #ddd !important;
                .detail-copy {
                    color: #69b1ff !important;
                    background: rgba(24,144,255,0.18) !important;
                }
            }
        }
    }

    /* 空状态 */
    .empty-tips {
        background: #2a2a2a;
        color: #6A7590;
    }

    /* 按钮暗色透明 */
    :deep(.wd-button) {
        background-color: transparent !important;
    }
}
</style>
