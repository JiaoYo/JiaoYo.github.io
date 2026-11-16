<template>
    <view :style="{ background: dark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 40rpx', borderRadius: '20rpx' }">
        <!-- 面板头：标题 + 统计 + 发布 -->
        <view style="display: flex; align-items: center; padding: 20rpx 20rpx 0;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;" :style="{ color: dark ? '#ffffff' : '#333333' }">注意事项</view>
            <view class="np-head-stat" :class="dark ? 'np-dark-sub' : ''">已发布 {{ publishedTotal }} 条</view>
            <view v-if="unreadTotal > 0" class="np-head-unread">
                <view class="np-head-unread-dot"></view>
                未读 {{ unreadTotal }} 条
            </view>
            <view style="flex: 1;"></view>
            <wd-button v-if="canCreate && !disabled" size="small" type="primary" @click="openPublish">发布</wd-button>
        </view>

        <!-- 列表（直显，加载更多翻页） -->
        <view style="padding: 20rpx;">
            <view v-if="!list.length && !listLoading" style="padding: 40rpx 0;">
                <wd-status-tip :image-size="{ height: 80, width: 80 }" image="../static/search.png" tip="暂无注意事项" />
            </view>
            <view
                v-for="row in list"
                :key="String(row.id)"
                class="np-item"
                :class="[dark ? 'np-dark-item' : '', { 'np-is-unread': row.unread, 'np-is-withdrawn': row.status === 2 }]"
                @click="openDetail(row)"
            >
                <view class="np-item-main">
                    <text v-if="row.priority === 1" class="np-pill np-prio">重要</text>
                    <text class="np-title" :class="dark ? 'np-dark-value' : ''">{{ row.title }}</text>
                    <text v-if="row.status === 2" class="np-pill np-withdrawn">已撤回</text>
                    <text v-if="!disabled && row.canWithdraw && row.status === 1" class="np-withdraw-btn" @click.stop="handleWithdrawClick(row)">撤回</text>
                </view>
                <view class="np-item-meta" :class="dark ? 'np-dark-sub' : ''">
                    <text>{{ row.creatorName || '-' }}</text>
                    <text>·</text>
                    <text>{{ fmtTime(row.dbtime) }}</text>
                    <text>·</text>
                    <text>回复 {{ Number(row.replyCount) || 0 }}</text>
                </view>
            </view>
            <view v-if="hasMore" style="display: flex; justify-content: center; padding-top: 8rpx;">
                <wd-button size="small" type="primary" plain :disabled="listLoading" @click="fetchList('more')">加载更多</wd-button>
            </view>
        </view>

    </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
    fetchGetProjectNoticePage,
    fetchGetProjectNoticeById,
    fetchGetProjectNoticeSummary,
    fetchReadProjectNotice,
    fetchWithdrawProjectNotice
} from '@/service/projectNotice';

/**
 * 项目联络单 - 项目注意事项内嵌面板（对齐 web 端 noticePanel）
 *
 * 嵌在「项目概览」基本信息下方：列表直显、可发布、可撤回、可回复；
 * 查看未读事项时按本次实际打开详情获得的 activityVersion 提交个人已读，
 * 提交失败忽略，下次打开再标；不做一键全读。
 * 页面下拉刷新/返回页面时由父页调用 refresh() 兜底刷新（面板不建轮询）。
 * 数值契约：ID/版本为字符串原样使用，仅显示计数转 Number。
 */
const props = defineProps<{
    /** 关联项目 ID（联络单的 proid） */
    pid?: number;
    /** 暗色主题 */
    dark?: boolean;
    /** 项目已暂停：仅可查看，隐藏发布/撤回/回复 */
    disabled?: boolean;
}>();

/** 代际计数：pid 切换/卸载时让在途响应失效 */
let gen = 0;

/* ---------------- 摘要 ---------------- */
const summary = ref<any>(null);
const publishedTotal = computed(() => Number(summary.value?.totalCount ?? 0) || 0);
const unreadTotal = computed(() => Number(summary.value?.unreadCount ?? 0) || 0);
/** 发布资格由后端 summary 返回 */
const canCreate = computed(() => !!summary.value?.canCreate);

async function refreshSummary() {
    if (!props.pid) {
        summary.value = null;
        return;
    }
    const g = gen;
    try {
        const data: any = await fetchGetProjectNoticeSummary({ pid: props.pid });
        if (g !== gen) return;
        summary.value = data || null;
    } catch (err) {
        if (g === gen) summary.value = null;
    }
}

/* ---------------- 列表 ---------------- */
const listLoading = ref(false);
const list = ref<any[]>([]);
const pagination = reactive({ page: 1, limit: 10, total: 0 });
const hasMore = computed(() => list.value.length < pagination.total);

async function fetchList(mode: 'reset' | 'more') {
    if (!props.pid) {
        list.value = [];
        return;
    }
    if (mode === 'reset') pagination.page = 1;
    if (mode === 'more') pagination.page += 1;
    const g = gen;
    listLoading.value = true;
    try {
        const data: any = await fetchGetProjectNoticePage({
            pid: props.pid,
            page: pagination.page,
            limit: pagination.limit
        });
        if (g !== gen) return;
        // pageNum 回滚保护：并发翻页时以后端实际页为准
        if (mode === 'more' && Number(data?.pageNum ?? pagination.page) !== pagination.page) {
            pagination.page -= 1;
            return;
        }
        const rows = data?.list || [];
        pagination.total = Number(data?.total ?? 0) || 0;
        list.value = mode === 'more' ? list.value.concat(rows) : rows;
    } catch (err) {
        if (g === gen) {
            // 加载更多失败保留已加载内容，仅回滚页码；重置失败才清空（错误原因已由 request 统一 toast）
            if (mode === 'more') {
                pagination.page -= 1;
            } else {
                list.value = [];
                pagination.total = 0;
            }
        }
    } finally {
        if (g === gen) listLoading.value = false;
    }
}

/* ---------------- 详情（查看/回复均在独立页，查看未读返回后此处标已读） ---------------- */
async function openDetail(row: any) {
    if (!row?.id) return;
    let version = '';
    if (row.unread) {
        // 未读事项预取版本号，返回后按打开时的版本提交已读；预取失败仍正常查看
        try {
            const data: any = await fetchGetProjectNoticeById({ id: String(row.id) });
            version = String(data?.activityVersion || '');
        } catch (err) {
            console.error('预取注意事项版本失败', err);
        }
    }
    pendingReadNoticeId = String(row.id);
    pendingReadVersion = version;
    const pidParam = props.pid ? `&pid=${props.pid}` : '';
    const disabledParam = props.disabled ? '&disabled=1' : '';
    uni.navigateTo({
        url: `/projectPages/prjnoticedetail/Index?id=${String(row.id)}${pidParam}${disabledParam}`
    });
}

/** 从详情页返回时提交已读：按打开时的 activityVersion，失败忽略下次再标 */
let pendingReadNoticeId = '';
let pendingReadVersion = '';
async function markPendingRead() {
    if (!pendingReadNoticeId) return;
    const id = pendingReadNoticeId;
    const version = pendingReadVersion;
    pendingReadNoticeId = '';
    pendingReadVersion = '';
    if (!version) return;
    try {
        await fetchReadProjectNotice({ id, activityVersion: version });
        const row = list.value.find((r: any) => String(r.id) === id);
        if (row) row.unread = false;
        refreshSummary();
    } catch (err) {
        console.error('提交已读失败', err);
    }
}

/* ---------------- 撤回（资格 canWithdraw 由后端返回） ---------------- */
const withdrawing = ref(false);

function handleWithdrawClick(row: any) {
    uni.showModal({
        title: '撤回注意事项',
        content: '撤回后该事项停止提醒与回复，历史保留供查看，确定撤回吗？',
        confirmColor: '#e54d42',
        success: (res) => {
            if (res.confirm) withdrawNotice(String(row.id));
        }
    });
}

async function withdrawNotice(id: string) {
    if (withdrawing.value) return;
    withdrawing.value = true;
    try {
        await fetchWithdrawProjectNotice({ id });
        uni.showToast({ icon: 'none', title: '已撤回，该事项停止提醒与回复，历史保留', duration: 2000 });
        fetchList('reset');
        refreshSummary();
    } catch (err) {
        console.error('撤回失败', err);
    } finally {
        withdrawing.value = false;
    }
}

/* ---------------- 发布（跳转独立页 projectPages/addprjnotice） ---------------- */
function openPublish() {
    if (!props.pid) return;
    uni.navigateTo({ url: '/projectPages/addprjnotice/Index?pid=' + props.pid });
}

/* ---------------- 生命周期 ---------------- */
function resetState() {
    gen += 1;
    list.value = [];
    pagination.page = 1;
    pagination.total = 0;
    summary.value = null;
    pendingReadNoticeId = '';
    pendingReadVersion = '';
}

/** 父页下拉刷新/返回页面时兜底刷新（面板不建轮询） */
function refresh() {
    if (!props.pid) return;
    refreshSummary();
    if (pagination.page === 1 && !listLoading.value) fetchList('reset');
}

defineExpose({ refresh });

watch(
    () => props.pid,
    () => {
        resetState();
        if (props.pid) {
            refreshSummary();
            fetchList('reset');
        }
    }
);

// 发布页发布成功后刷新列表与统计；从详情页返回时提交查看已读
uni.$on('refreshProjectNotice', handlePublished);
uni.$on('projectNoticeDetailBack', handleDetailBack);

function handlePublished() {
    fetchList('reset');
    refreshSummary();
}

function handleDetailBack() {
    markPendingRead();
    if (!listLoading.value) fetchList('reset');
}

onMounted(() => {
    if (props.pid) {
        refreshSummary();
        fetchList('reset');
    }
});

onBeforeUnmount(() => {
    gen += 1;
    uni.$off('refreshProjectNotice', handlePublished);
    uni.$off('projectNoticeDetailBack', handleDetailBack);
});

/* ---------------- 展示辅助 ---------------- */
/** 正文按纯文本渲染（white-space: pre-wrap），禁止 v-html */
function fmtTime(t?: string) {
    const s = String(t || '');
    return s ? s.replace('T', ' ').slice(0, 16) : '-';
}
</script>

<style lang="scss" scoped>
.np-head-stat {
    margin-left: 16rpx;
    font-size: 22rpx;
    color: #999;
}

.np-head-unread {
    display: flex;
    align-items: center;
    margin-left: 12rpx;
    font-size: 22rpx;
    color: #d03050;
}

.np-head-unread-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #d03050;
    margin-right: 8rpx;
}

/* 状态小标签：胶囊 + 细描边（详情页 prjnoticedetail 共用相同样式） */
.np-pill {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    font-size: 20rpx;
    line-height: 1;
    padding: 5rpx 14rpx;
    border-radius: 999rpx;
    font-weight: 500;
}

.np-pill.np-prio {
    color: #e03050;
    background: rgba(224, 48, 80, 0.06);
    border: 2rpx solid rgba(224, 48, 80, 0.18);
}

.np-pill.np-withdrawn {
    color: #909399;
    background: #f2f3f5;
    border: 2rpx solid #e8eaee;
}

.np-item {
    position: relative;
    padding: 20rpx 24rpx 18rpx;
    margin-bottom: 16rpx;
    background: #fff;
    border: 2rpx solid #eef0f4;
    border-radius: 16rpx;
}

.np-item.np-is-unread::before {
    content: '';
    position: absolute;
    left: 0;
    top: 16rpx;
    bottom: 16rpx;
    width: 6rpx;
    border-radius: 0 6rpx 6rpx 0;
    background: linear-gradient(180deg, #54b0ff 0%, #1890ff 100%);
}

.np-item.np-is-unread .np-title {
    font-weight: 600;
}

.np-item.np-is-withdrawn {
    background: #fafbfc;
    border-style: dashed;
    border-color: #e4e7ec;
}

.np-item.np-is-withdrawn .np-title {
    color: #a8abb2;
}

.np-dark-item {
    background: #2a2a2a;
    border-color: #333;
}

.np-dark-item.np-is-withdrawn {
    background: rgba(255, 255, 255, 0.03);
}

.np-item-main {
    display: flex;
    align-items: center;
    gap: 12rpx;
    min-width: 0;
}

.np-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 26rpx;
    color: #333;
}

.np-withdraw-btn {
    flex-shrink: 0;
    font-size: 20rpx;
    line-height: 1;
    padding: 6rpx 18rpx;
    border-radius: 999rpx;
    color: #e54d42;
    border: 2rpx solid rgba(229, 77, 66, 0.4);
    background: rgba(229, 77, 66, 0.04);
}

.np-item-meta {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 12rpx;
    font-size: 22rpx;
    color: #a3aab4;
}

.np-dark-value {
    color: #e8e8e8 !important;
}

.np-dark-sub {
    color: #888 !important;
}
</style>
