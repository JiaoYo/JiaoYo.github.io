<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow title="需求详情" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <scroll-view scroll-y class="scroll-content">
            <view class="status-card">
                <view class="status-header">
                    <view class="status-name">{{ detailData.dname || '-' }}</view>
                    <view class="status-badge" :style="{ background: isDark ? statusStyle.color + '1f' : statusStyle.bg, color: statusStyle.color }">{{ statusStyle.text }}</view>
                </view>
                <view class="status-info">
                    <view class="info-item"><text class="info-label">所属产品：</text><text>{{ detailData.rdname || '-' }}</text></view>
                    <view class="info-item"><text class="info-label">评审人：</text><text>{{ getRdtypeText(detailData.rdtype) }}</text></view>
                </view>
            </view>
            <view class="detail-section">
                <view class="section-title">基本信息</view>
                <view class="info-grid">
                    <view class="grid-item"><view class="grid-label">优先级</view><view class="grid-value"><view class="priority-tag" :style="{ background: getPriorityColor(detailData.priority) + '20', color: getPriorityColor(detailData.priority) }">{{ getPriorityLabel(detailData.priority) }}</view></view></view>
                    <view class="grid-item"><view class="grid-label">期望完成</view><view class="grid-value">{{ detailData.ctime || '-' }}</view></view>
                    <view class="grid-item"><view class="grid-label">创建人</view><view class="grid-value">{{ detailData.username || '-' }}</view></view>
                    <view class="grid-item"><view class="grid-label">创建时间</view><view class="grid-value">{{ detailData.dbtime || '-' }}</view></view>
                    <view class="grid-item"><view class="grid-label">需求来源</view><view class="grid-value">{{ detailData.dsource === 1 ? '三方合同' : '内部需求' }}</view></view>
                    <view v-if="detailData.dsource === 1" class="grid-item"><view class="grid-label">合同编号</view><view class="grid-value contract-value">{{ detailData.contractnum || '-' }}<view v-if="detailData.paystatus != null" class="paystatus-tag" :style="getPayStatusStyle(detailData.paystatus)">{{ contractPayStatus[Number(detailData.paystatus)] || '待维护' }}</view></view></view>
                </view>
                <view v-if="demandccList.length > 0" class="cc-line"><text class="grid-label">抄送人：</text><text class="cc-names">{{ demandccList.map((i: any) => i.cname || i.username || i.cc).join('、') }}</text></view>
            </view>
            <view class="detail-section"><view class="section-title">需求描述</view><view class="content-text" v-html="detailData.ddesc"></view></view>
            <view class="detail-section"><view class="section-title">验收标准</view><view class="content-text" v-html="detailData.dnotes"></view></view>
            <view v-if="detailData.label" class="detail-section"><view class="section-title">标签</view><view class="tags-wrap"><view v-for="(tag, idx) in detailData.label.split(',')" :key="idx" class="tag-item" :style="{ background: isDark ? '#1f3a5f' : '#e6f4ff', color: isDark ? '#69b1ff' : '#1890ff' }">{{ tag }}</view></view></view>
            <view class="detail-section">
                <view class="section-title">流程记录</view>
                <view class="flow-list">
                    <view class="flow-item">
                        <view class="flow-dot start"></view>
                        <view class="flow-body">
                            <view class="flow-title">创建需求</view>
                            <view class="flow-meta">{{ detailData.username || '-' }}{{ detailData.dbtime ? '　' + detailData.dbtime : '' }}</view>
                        </view>
                    </view>
                    <view v-if="detailData.dstatus === 1 || detailData.dstatus === 2" class="flow-item">
                        <view class="flow-dot" :class="detailData.dstatus === 1 ? 'pass' : 'reject'"></view>
                        <view class="flow-body">
                            <view class="flow-title" :style="{ color: detailData.dstatus === 1 ? '#52c41a' : '#f5222d' }">{{ detailData.dstatus === 1 ? '评审通过' : '评审拒绝' }}</view>
                            <view v-if="detailData.renotes" class="flow-note" v-html="detailData.renotes"></view>
                            <view class="flow-meta">{{ detailData.ckusername || '-' }}{{ detailData.retime ? '　' + detailData.retime : '' }}</view>
                        </view>
                    </view>
                </view>
            </view>
            <view v-if="canViewTask" class="detail-section">
                <view class="section-title">需求下任务进度</view>
                <view v-if="taskList.length > 0">
                    <view v-for="item in taskList" :key="item.id" class="task-item">
                        <view class="task-header">
                            <view class="task-name-row"><view class="task-dot" :style="{ background: getTaskStatusColor(item.cstatus).textColor }"></view><text class="task-name">{{ item.tname || '-' }}</text></view>
                            <view class="task-tags">
                                <view class="task-status-tag" :style="{ background: getTaskStatusColor(item.cstatus).color, color: getTaskStatusColor(item.cstatus).textColor, borderColor: getTaskStatusColor(item.cstatus).borderColor }">{{ getTaskStatusLabel(item.cstatus) }}</view>
                                <view class="task-delay-tag" :style="{ color: item.rdelay == 0 ? '#52c41a' : '#f5222d' }">{{ item.rdelay == 0 ? '未延期' : '已延期' }}</view>
                            </view>
                        </view>
                        <view class="task-info-row"><text class="task-info-text">指派人：{{ item.username || '未分配' }}</text><text v-if="item.end" class="task-info-text">计划结束：{{ item.end }}</text></view>
                        <view class="task-progress-wrap">
                            <view class="progress-item"><text class="progress-label">时间进度</text><view class="progress-bar-bg"><view class="progress-bar" :style="{ width: (item.timeprogress || 0) + '%', background: getProgressColor(item.timeprogress) }"></view></view><text class="progress-text">{{ item.timeprogress || 0 }}%</text></view>
                            <view class="progress-item"><text class="progress-label">任务进度</text><view class="progress-bar-bg"><view class="progress-bar" :style="{ width: (item.taskprogress || 0) + '%', background: getProgressColor(item.taskprogress) }"></view></view><text class="progress-text">{{ item.taskprogress || 0 }}%</text></view>
                        </view>
                    </view>
                </view>
                <view v-else class="no-task-tip">需求下暂无任务</view>
            </view>
            <view v-if="fileList.length > 0" class="detail-section"><view class="section-title">附件 ({{ fileList.length }})</view><view v-for="file in fileList" :key="file.id" class="file-item" @click="handleDownloadFile(file)"><view class="file-icon">📎</view><view class="file-info"><view class="file-name">{{ file.fname }}</view><view class="file-size">{{ formatFileSize(file.fsize) }}</view></view></view></view>
            <view v-if="canOperate" class="action-section">
                <wd-button v-if="canEdit" type="warning" size="large" plain custom-style="flex:1" @click="handleEdit">编辑</wd-button>
                <wd-button v-if="canDelete" type="error" size="large" plain custom-style="flex:1" @click="handleDelete">删除</wd-button>
            </view>
        </scroll-view>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchRdDemandInfo, fetchRdTaskStatus, fetchRdFilePage, fetchDeleteRdDemandInfo, fetchRdCopy } from "@/service/rddemand";
import { rdprjType1, rdprjTaskStatusColorMap, getPriorityColor, getPriorityLabel, getTaskStatusLabel, contractPayStatus } from "@/constants/rdPrj";
import { hasPermission } from '@/utils/index';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
// 暗黑模式：页面底色 + CSS 变量统一控制卡片/文字底色（样式里用 var(--rd-*, 浅色默认) 取值，方案同 rdassessment 详情）
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh';
    return 'min-height: 100vh; background: #1b1b1b; --rd-page-bg: #1b1b1b; --rd-card-bg: #2a2a2a; --rd-title: #e8e8e8; --rd-text: #c9cdd4; --rd-secondary: #8a9099; --rd-line: rgba(255, 255, 255, 0.08); --rd-line-soft: rgba(255, 255, 255, 0.06); --rd-field-bg: #333333; --rd-track: rgba(255, 255, 255, 0.12); --rd-link: #69b1ff;';
});
const userId = ref<number>(uni.getStorageSync("userId"));
const userType = ref<number>(uni.getStorageSync("usertype"));
const detailData = ref<any>({});
const taskStats = ref({ total: 0, completed: 0, inProgress: 0, pending: 0 });
const taskList = ref<any[]>([]);
const fileList = ref<any[]>([]);
const demandccList = ref<any[]>([]);

const statusStyle = computed(() => {
    const status = detailData.value.dstatus;
    const styleMap: any = { 0: { text: "待确认", bg: "#fff7e6", color: "#fa8c16" }, 1: { text: "已确认", bg: "#f6ffed", color: "#52c41a" }, 2: { text: "已拒绝", bg: "#fff1f0", color: "#f5222d" } };
    return styleMap[status] || { text: "未知", bg: "#f4f4f5", color: "#909399" };
});

const canViewTask = computed(() => {
    if (detailData.value.dstatus !== 1) return false;
    if (detailData.value.creater === userId.value) return true;
    if (userType.value === 0) return true;
    return demandccList.value.some((item: any) => item.cc == userId.value);
});

const canOperate = computed(() => canEdit.value || canDelete.value);
// 编辑/删除权限：创建人或管理员（口径同 web，删除另需 rd:demand:delete）
const canEdit = computed(() => hasPermission('rd:demand:update') && (userType.value === 0 || detailData.value.creater === userId.value));
const canDelete = computed(() => hasPermission('rd:demand:delete') && (userType.value === 0 || detailData.value.creater === userId.value));

function getPayStatusStyle(ps: any) { const t = ps == null ? '#909399' : (({ 0: '#f5222d', 1: '#fa8c16', 2: '#52c41a' } as any)[Number(ps)] || '#909399'); return { background: t + '1a', color: t }; }

function getRdtypeText(rdtype: number) { return rdprjType1[rdtype] || "-"; }
function formatFileSize(size: number) { if (!size) return "-"; if (size < 1024) return size + "B"; if (size < 1024 * 1024) return (size / 1024).toFixed(1) + "KB"; return (size / (1024 * 1024)).toFixed(1) + "MB"; }
function getTaskStatusColor(status: number) { return rdprjTaskStatusColorMap[status] || { color: "#f4f4f5", textColor: "#909399", borderColor: "#dcdfe6" }; }
function getProgressColor(percentage: number) { if (percentage >= 100) return "#52c41a"; if (percentage >= 70) return "#1677ff"; if (percentage >= 30) return "#fa8c16"; return "#f5222d"; }

async function getDetailData(id: number) { try { detailData.value = await fetchRdDemandInfo(id); } catch (err) { console.error("获取详情失败", err); } }

async function getTaskStats(proid: number, pid: number) {
    try {
        const data = await fetchRdTaskStatus({ proid, pid });
        if (data ) {
          taskList.value = data || [];
        }
    } catch (err) { console.error("获取任务状态失败", err); }
}

async function getFileList(proid: number, pid: number) { try { const data = await fetchRdFilePage({ proid, pid, page: 1, limit: 100 ,ftype:0}); fileList.value = data.list || []; } catch (err) { console.error("获取文件列表失败", err); } }
async function getDemandCcList(pid: number) { try { const data = await fetchRdCopy({ pid, page: 1, limit: 100 }); demandccList.value = data.list || []; } catch (err) { console.error("获取抄送人列表失败", err); } }

function handleClickLeft() { uni.navigateBack(); }
function handleEdit() { uni.navigateTo({ url: "/mePages/rddemand/add/Index?id=" + detailData.value.id }); }

function handleDelete() {
    uni.showModal({ title: "提示", content: "确定删除该需求吗？", success: async (res) => {
        if (res.confirm) {
            try {
                await fetchDeleteRdDemandInfo(detailData.value.id);
                uni.showToast({ title: "删除成功", icon: "success" });
                uni.$emit("refreshRdDemandList");
                setTimeout(() => { uni.navigateBack(); }, 1500);
            } catch (err: any) { console.error("删除失败", err); uni.showToast({ title: err?.msg || "删除失败", icon: "none" }); }
        }
    }});
}

function handleDownloadFile(file: any) {
    if (!file.furl) { uni.showToast({ title: "文件地址无效", icon: "none" }); return; }
    uni.showLoading({ title: "正在打开..." });
    uni.downloadFile({ url: file.furl, success: (res) => { uni.hideLoading(); if (res.statusCode === 200) { uni.openDocument({ filePath: res.tempFilePath, success: () => {}, fail: () => { uni.showToast({ title: "无法打开该文件", icon: "none" }); } }); } else { uni.showToast({ title: "下载失败", icon: "none" }); } }, fail: () => { uni.hideLoading(); uni.showToast({ title: "下载失败", icon: "none" }); } });
}

onLoad((options: any) => {
    if (options.rowData) {
        try {
            detailData.value = JSON.parse(decodeURIComponent(options.rowData));
            if (detailData.value.pid && detailData.value.id) { getTaskStats(detailData.value.pid, detailData.value.id); getFileList(detailData.value.pid, detailData.value.id); getDemandCcList(detailData.value.id); }
        } catch (e) { console.error("解析数据失败", e); }
    }
    if (options.id) {
        const id = Number(options.id);
        // 直连进入：重新拉详情并补齐任务/附件/抄送数据
        getDetailData(id);
        getDemandCcList(id);
        if (detailData.value.pid) { getTaskStats(detailData.value.pid, id); getFileList(detailData.value.pid, id); }
    }
});
</script>
<style lang="scss" scoped>
.scroll-content { height: calc(100vh - 88rpx); }
.status-card { margin: 24rpx; padding: 24rpx; background: var(--rd-card-bg, #fff); border-radius: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05); }
.status-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16rpx; }
.status-name { font-size: 32rpx; font-weight: 600; flex: 1; margin-right: 16rpx; color: var(--rd-title, #1a1a1a); }
.status-badge { padding: 8rpx 20rpx; border-radius: 16rpx; font-size: 24rpx; }
.status-info { display: flex; flex-direction: column; gap: 8rpx; }
.info-item { font-size: 26rpx; color: var(--rd-text, #646566); }
.info-label { color: var(--rd-secondary, #969799); }
.detail-section { margin: 0 24rpx 24rpx; padding: 24rpx; background: var(--rd-card-bg, #fff); border-radius: 16rpx; }
.section-title { font-size: 28rpx; font-weight: 600; color: var(--rd-title, #323233); margin-bottom: 20rpx; }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24rpx; }
.grid-item { .grid-label { font-size: 24rpx; color: var(--rd-secondary, #969799); margin-bottom: 8rpx; } .grid-value { font-size: 28rpx; color: var(--rd-text, #323233); } }
.priority-tag { display: inline-block; padding: 6rpx 16rpx; border-radius: 8rpx; font-size: 24rpx; }
.contract-value { display: flex; align-items: center; gap: 12rpx; flex-wrap: wrap; word-break: break-all; }
.paystatus-tag { padding: 4rpx 12rpx; border-radius: 999rpx; font-size: 20rpx; flex-shrink: 0; }
.cc-line { margin-top: 20rpx; font-size: 26rpx; color: var(--rd-text, #323233); }
.cc-line .grid-label { color: var(--rd-secondary, #969799); }
.cc-names { color: var(--rd-link, #1677ff); }
.flow-list { display: flex; flex-direction: column; gap: 24rpx; }
.flow-item { display: flex; align-items: flex-start; gap: 16rpx; }
.flow-dot { width: 16rpx; height: 16rpx; border-radius: 50%; margin-top: 10rpx; flex-shrink: 0; background: #fa8c16; }
.flow-dot.start { background: #1677ff; }
.flow-dot.pass { background: #52c41a; }
.flow-dot.reject { background: #f5222d; }
.flow-body { flex: 1; min-width: 0; }
.flow-title { font-size: 28rpx; font-weight: 500; color: var(--rd-title, #323233); }
.flow-meta { margin-top: 6rpx; font-size: 24rpx; color: var(--rd-secondary, #969799); }
.flow-note { margin-top: 8rpx; font-size: 26rpx; color: var(--rd-text, #646566); line-height: 1.6; word-break: break-all; }
.content-text { font-size: 28rpx; color: var(--rd-text, #646566); line-height: 1.6; white-space: pre-wrap; }
::v-deep .content-text img {
    width: 100% !important;
}
.tags-wrap { display: flex; flex-wrap: wrap; gap: 12rpx; }
.tag-item { padding: 8rpx 16rpx; border-radius: 8rpx; font-size: 24rpx; }

.task-item { padding: 20rpx; background: var(--rd-field-bg, #f7f8fa); border-radius: 12rpx; margin-bottom: 16rpx; }
.task-item:last-child { margin-bottom: 0; }
.task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12rpx; }
.task-name-row { display: flex; align-items: center; flex: 1; margin-right: 16rpx; min-width: 0; }
.task-dot { width: 12rpx; height: 12rpx; border-radius: 50%; margin-right: 12rpx; flex-shrink: 0; }
.task-name { font-size: 28rpx; font-weight: 500; color: var(--rd-text, #323233); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-tags { display: flex; gap: 8rpx; flex-shrink: 0; }
.task-status-tag { padding: 4rpx 12rpx; border-radius: 16rpx; font-size: 22rpx; border: 1rpx solid; }
.task-delay-tag { padding: 4rpx 12rpx; border-radius: 16rpx; font-size: 22rpx; }
.task-info-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; flex-wrap: wrap; gap: 8rpx; }
.task-info-text { font-size: 24rpx; color: var(--rd-secondary, #969799); }
.task-progress-wrap { display: flex; flex-direction: column; gap: 12rpx; }
.progress-item { display: flex; align-items: center; gap: 12rpx; }
.progress-label { font-size: 24rpx; color: var(--rd-secondary, #969799); width: 120rpx; flex-shrink: 0; }
.progress-bar-bg { flex: 1; height: 16rpx; background: var(--rd-track, #e6e6e6); border-radius: 8rpx; overflow: hidden; }
.progress-bar { height: 100%; border-radius: 8rpx; transition: width 0.3s ease; }
.progress-text { font-size: 24rpx; color: var(--rd-text, #646566); width: 80rpx; text-align: right; flex-shrink: 0; }
.no-task-tip { text-align: center; padding: 40rpx 0; color: var(--rd-secondary, #94a3b8); font-size: 26rpx; }

.task-summary { display: flex; justify-content: space-around; padding: 16rpx 0; }
.task-stat { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.stat-num { font-size: 40rpx; font-weight: 600; }
.stat-label { font-size: 24rpx; color: #969799; }
.file-item { display: flex; align-items: center; padding: 20rpx; background: var(--rd-field-bg, #f7f8fa); border-radius: 12rpx; margin-bottom: 12rpx; }
.file-item:last-child { margin-bottom: 0; }
.file-icon { font-size: 40rpx; margin-right: 16rpx; }
.file-info { flex: 1; }
.file-name { font-size: 28rpx; color: var(--rd-text, #323233); margin-bottom: 4rpx; }
.file-size { font-size: 24rpx; color: var(--rd-secondary, #969799); }
.action-section { display: flex; gap: 24rpx; padding: 40rpx 24rpx; }
</style>
