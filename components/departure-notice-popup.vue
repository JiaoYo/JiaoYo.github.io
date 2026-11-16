<template>
    <wd-popup :z-index="99" closable :close-on-click-modal="false" :modelValue="modelValue" custom-style="width: 94%; border-radius: 32rpx; padding: 20rpx;" @update:modelValue="handleVisibleChange">
        <view style="margin-bottom: 16rpx; padding-right: 80rpx; display: flex; align-items: center; gap: 12rpx;">
            <wd-text :text="modalTitle" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
            <view style="flex: 1;"></view>
            <wd-button v-if="canCreate" size="small" type="primary" @click="openPublish">发布</wd-button>
        </view>

        <!-- ========== 列表视图 ========== -->
        <view v-if="!detail" class="dn-body">
            <view class="dn-toolbar" :class="dark ? 'dark' : ''">
                <view class="dn-chips">
                    <view v-for="f in filterOptions" :key="f.value" class="dn-chip" :class="{ active: filter === f.value }" :style="chipStyle(filter === f.value)" @click="handleFilterChange(f.value)">{{ f.label }}</view>
                </view>
                <text class="dn-stat" :class="dark ? 'dark-sub' : ''">
                    已发布 {{ publishedTotal }} 条 · 未读 <text :style="{ color: unreadCount === 0 ? '' : '#1677ff', fontWeight: unreadCount === 0 ? 400 : 600 }">{{ unreadCount }}</text> 条
                </text>
            </view>

            <scroll-view scroll-y class="dn-list-scroll" :class="dark ? 'dark' : ''">
                <view v-if="!list.length && !listLoading" style="padding: 60rpx 0;">
                    <wd-status-tip image="../static/search.png" tip="暂无注意事项" />
                </view>
                <view v-for="row in list" :key="String(row.id)" class="dn-item" :class="dark ? 'dark' : ''" :style="row.status === 2 ? withdrawnItemStyle : {}" @click="openDetail(row)">
                    <view class="dn-item-main">
                        <text v-if="row.priority === 1" class="dn-pill prio">重要</text>
                        <text class="dn-title" :class="[dark ? 'dark-value' : '', { unread: row.unread }]">{{ row.title }}</text>
                        <text v-if="row.status === 2" class="dn-pill withdrawn">已撤回</text>
                        <text v-if="row.unread" class="dn-pill unread">未读</text>
                        <text v-if="row.canWithdraw && row.status === 1" class="dn-withdraw-btn" @click.stop="handleWithdrawClick(row)">撤回</text>
                    </view>
                    <view class="dn-item-meta" :class="dark ? 'dark-sub' : ''">
                        <text>{{ row.creatorName || '-' }}</text>
                        <text>{{ fmtTime(row.dbtime) }}</text>
                        <text>回复 {{ Number(row.replyCount) || 0 }}</text>
                    </view>
                </view>
                <view v-if="hasMoreList" style="display: flex; justify-content: center; padding: 16rpx 0;">
                    <wd-button size="small" type="primary" plain :disabled="listLoading" @click="fetchListPage('more')">加载更多</wd-button>
                </view>
            </scroll-view>
        </view>

        <!-- ========== 详情视图（点击查看即自动已读） ========== -->
        <view v-else class="dn-body">
            <view style="padding: 0 0 12rpx;">
                <wd-button size="small" type="primary" plain @click="backToList">← 返回列表</wd-button>
            </view>

            <scroll-view scroll-y class="dn-detail-scroll" :class="dark ? 'dark' : ''">
                <view v-if="detailLoading" style="display: flex; justify-content: center; align-items: center; padding: 60rpx 0;">
                    <wd-loading size="36px"></wd-loading>
                </view>
                <view v-else class="dn-detail-wrap">
                    <view class="dn-detail-card" :class="dark ? 'dark' : ''">
                        <view class="dn-item-main">
                            <text v-if="detail.priority === 1" class="dn-pill prio">重要</text>
                            <text v-if="detail.status === 2" class="dn-pill withdrawn">已撤回</text>
                            <text class="dn-detail-title" :class="dark ? 'dark-value' : ''">{{ detail.title }}</text>
                            <text v-if="detail.canWithdraw && detail.status === 1" class="dn-withdraw-btn" @click.stop="handleWithdrawClick(detail)">撤回</text>
                        </view>
                        <view class="dn-item-meta" :class="dark ? 'dark-sub' : ''">
                            <text>{{ detail.creatorName || '-' }} · {{ fmtTime(detail.dbtime) }} · 回复 {{ Number(detail.replyCount) || 0 }} 条</text>
                        </view>
                        <view v-if="detail.status === 2" class="dn-withdrawn-tip" :class="dark ? 'dark-sub' : ''">该事项已被创建人或管理员撤回，仅供查看。</view>
                        <view class="dn-content" :class="dark ? 'dark-value' : ''">{{ detail.content }}</view>
                    </view>

                    <view class="dn-replies-head" :class="[dark ? 'dark-value' : '', dark ? 'dark-border' : '']">回复（{{ Number(detail.replyCount) || 0 }}）</view>
                    <view v-if="!replies.length" class="dn-replies-empty" :class="dark ? 'dark-sub' : ''">暂无回复</view>
                    <view v-for="r in replies" :key="String(r.id)" class="dn-reply-item" :class="dark ? 'dark-border' : ''">
                        <view class="dn-reply-meta" :class="dark ? 'dark-sub' : ''">
                            <text class="dn-reply-name" :class="dark ? 'dark-value' : ''">{{ r.creatorName || '-' }}</text>
                            <text>{{ fmtTime(r.dbtime) }}</text>
                        </view>
                        <view class="dn-reply-content" :class="dark ? 'dark-value' : ''">{{ r.content }}</view>
                    </view>
                    <view v-if="hasMoreReplies" style="display: flex; justify-content: center; padding: 16rpx 0;">
                        <wd-button size="small" type="primary" plain @click="loadMoreReplies">加载更早的回复</wd-button>
                    </view>
                </view>
            </scroll-view>

            <view class="dn-reply-box" :class="dark ? 'dark' : ''">
                <view v-if="detail.canReply && detail.status === 1">
                    <textarea class="dn-reply-input" :class="dark ? 'dark' : ''" v-model="replyContent" maxlength="2000" placeholder="输入回复…（项目参与人或事项创建人可回复）" :placeholder-style="dark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height />
                    <view style="display: flex; justify-content: flex-end; margin-top: 12rpx;">
                        <wd-button size="small" type="primary" :loading="replySubmitting" :disabled="replySubmitting" @click="submitReply">回复</wd-button>
                    </view>
                </view>
                <view v-else class="dn-reply-disabled" :class="dark ? 'dark-sub' : ''">
                    {{ detail.status === 2 ? '已撤回的事项不可回复' : '当前身份不可回复（需为项目参与人或注意事项创建人）' }}
                </view>
            </view>
        </view>

        <!-- 发布弹框 -->
        <wd-popup :z-index="101" closable :close-on-click-modal="false" :model-value="publishVisible" custom-style="width: 86%; border-radius: 32rpx; padding: 24rpx;" position="center" @update:model-value="publishVisible = $event">
            <view style="margin-bottom: 20rpx; padding-right: 80rpx;">
                <wd-text text="发布注意事项" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
            </view>
            <scroll-view scroll-y style="max-height: 56vh;">
                <view class="dn-form-label" :class="dark ? 'dark-value' : ''">标题<text style="color: #e54d42;">*</text></view>
                <wd-input v-model="publishForm.title" clearable maxlength="100" placeholder="一句话说明注意事项（100 字以内）" :placeholder-style="dark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" />

                <view class="dn-form-label" :class="dark ? 'dark-value' : ''">重要程度</view>
                <view class="dn-chips">
                    <view class="dn-chip" :style="chipStyle(publishForm.priority === 0)" @click="publishForm.priority = 0">普通</view>
                    <view class="dn-chip" :style="chipStyle(publishForm.priority === 1)" @click="publishForm.priority = 1">重要（列表靠前强调展示）</view>
                </view>

                <view class="dn-form-label" :class="dark ? 'dark-value' : ''">内容<text style="color: #e54d42;">*</text></view>
                <textarea class="dn-form-textarea" :class="dark ? 'dark' : ''" v-model="publishForm.content" maxlength="5000" placeholder="具体要求、现场风险、执行口径等（5000 字以内，纯文本）" :placeholder-style="dark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height></textarea>

                <view class="dn-form-hint" :class="dark ? 'dark-sub' : ''">保存即发布，项目内可见；发布人自己和超级管理员可撤回。</view>
            </scroll-view>
            <view style="display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx;">
                <wd-button size="small" @click="publishVisible = false">取消</wd-button>
                <wd-button size="small" type="primary" :loading="publishSubmitting" :disabled="publishSubmitting" @click="submitPublish">发布</wd-button>
            </view>
        </wd-popup>
    </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import {
    fetchGetProjectNoticePage,
    fetchGetProjectNoticeById,
    fetchGetProjectNoticeSummary,
    fetchReadProjectNotice,
    fetchInsertProjectNotice,
    fetchWithdrawProjectNotice,
    fetchInsertProjectNoticeReply,
    fetchGetProjectNoticeReplyPage
} from '@/service/projectNotice';

/**
 * 出发注意事项弹窗（项目列表/详情共用）
 *
 * 查询与已读逻辑复用项目注意事项接口：getSummary 统计 + getPage 列表（全部/未读）
 * + getById 详情，点击查看即按本次打开得到的 activityVersion 提交个人已读；
 * 发布与撤回能力与服务端一致：保存即发布（canCreate 由后端返回）、
 * 发布人自己和超级管理员可撤回（canWithdraw 由后端返回），已撤回事项不可回复；
 * 回复能力：项目参与人或事项创建人可回复（canReply 由后端返回）。
 * 数值契约：ID/版本按字符串原样使用，仅显示计数转 Number。
 */
const props = defineProps<{
    modelValue: boolean;
    /** 项目 ID */
    pid?: number | string;
    /** 项目名称（弹窗标题展示） */
    name?: string;
    /** 暗色主题 */
    dark?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

function handleVisibleChange(val: boolean) {
    emit('update:modelValue', val);
}

const modalTitle = computed(() => (props.name ? props.name + '的出发注意事项' : '出发注意事项'));

/** 代际计数：弹窗关闭/pid 变化时自增，晚到的旧响应不再应用 */
let gen = 0;

/* ---------------- 摘要与统计 ---------------- */
const summary = ref<any>(null);
const unreadCount = computed(() => Number(summary.value?.unreadCount ?? 0) || 0);
const publishedTotal = computed(() => Number(summary.value?.totalCount ?? 0) || 0);
/** 发布资格由后端 summary 返回（超级管理员等） */
const canCreate = computed(() => !!summary.value?.canCreate);

async function refreshSummary() {
    if (!props.pid) {
        summary.value = null;
        return;
    }
    const g = gen;
    try {
        const data: any = await fetchGetProjectNoticeSummary({ pid: Number(props.pid) });
        if (g !== gen) return;
        summary.value = data || null;
    } catch (err) {
        if (g === gen) summary.value = null;
    }
}

/* ---------------- 列表 ---------------- */
const filterOptions = [
    { label: '全部', value: 'all' },
    { label: '未读', value: 'unread' }
];
const listLoading = ref(false);
const list = ref<any[]>([]);
const pagination = ref({ page: 1, limit: 20, total: 0 });
const filter = ref<'all' | 'unread'>('all');
const hasMoreList = computed(() => list.value.length < pagination.value.total);

async function fetchListPage(mode: 'reset' | 'more') {
    if (!props.pid) {
        list.value = [];
        pagination.value.total = 0;
        return;
    }
    if (mode === 'reset') pagination.value.page = 1;
    if (mode === 'more') pagination.value.page += 1;
    const g = gen;
    listLoading.value = true;
    try {
        const params: any = {
            pid: Number(props.pid),
            page: pagination.value.page,
            limit: pagination.value.limit
        };
        // 未读视图只看已发布且本人未读；全部视图包含已撤回
        if (filter.value === 'unread') {
            params.status = 1;
            params.unreadOnly = true;
        }
        const data: any = await fetchGetProjectNoticePage(params);
        if (g !== gen) return;
        // pageNum 回滚保护：并发翻页时以后端实际页为准
        if (mode === 'more' && Number(data?.pageNum ?? pagination.value.page) !== pagination.value.page) {
            pagination.value.page -= 1;
            return;
        }
        const rows = data?.list || [];
        pagination.value.total = Number(data?.total ?? 0) || 0;
        list.value = mode === 'more' ? list.value.concat(rows) : rows;
    } catch (err) {
        if (g === gen) {
            // 加载更多失败保留已加载内容，仅回滚页码；重置失败才清空（错误原因已由 request 统一 toast）
            if (mode === 'more') {
                pagination.value.page -= 1;
            } else {
                list.value = [];
                pagination.value.total = 0;
            }
        }
    } finally {
        if (g === gen) listLoading.value = false;
    }
}

function handleFilterChange(value: 'all' | 'unread') {
    if (filter.value === value) return;
    filter.value = value;
    fetchListPage('reset');
}

function chipStyle(active: boolean) {
    if (active) return { background: props.dark ? 'rgba(22, 119, 255, 0.3)' : '#e6f4ff', color: props.dark ? '#69b1ff' : '#1677ff', borderColor: props.dark ? '#69b1ff' : '#1677ff' };
    return { background: props.dark ? '#2a2a2a' : '#f5f5f5', color: props.dark ? '#c9cdd4' : '#4e5969', borderColor: 'transparent' };
}

const withdrawnItemStyle = computed(() => (props.dark ? { background: 'rgba(255,255,255,0.03)', borderStyle: 'dashed' } : { background: '#fafbfc', borderStyle: 'dashed' }));

/* ---------------- 详情与已读 ---------------- */
const detail = ref<any>(null);
const detailLoading = ref(false);
const replies = ref<any[]>([]);
const replyPagination = ref({ page: 1, limit: 20, total: 0 });
const hasMoreReplies = computed(() => replies.value.length < replyPagination.value.total);
const replyContent = ref('');
const replySubmitting = ref(false);

async function loadDetail(id: string, markRead: boolean) {
    const g = gen;
    detailLoading.value = true;
    try {
        const data: any = await fetchGetProjectNoticeById({ id });
        if (g !== gen) return;
        if (!data) return;
        detail.value = data;
        loadReplies(true);
        if (markRead && data.unread) {
            // 用本次实际加载到的版本提交已读；版本已推进时提交失败则忽略，下次打开再标
            try {
                await fetchReadProjectNotice({ id, activityVersion: String(data.activityVersion) });
                if (g !== gen) return;
                // 已读提交在途时可能已点「返回列表」（detail 已置空），行更新与统计刷新仍需执行
                if (detail.value) detail.value.unread = false;
                const row = list.value.find((r: any) => String(r.id) === id);
                if (row) row.unread = false;
                refreshSummary();
            } catch (err) {
                console.error('提交已读失败', err);
            }
        }
    } catch (err) {
        console.error('获取注意事项详情失败', err);
    } finally {
        if (g === gen) detailLoading.value = false;
    }
}

function openDetail(row: any) {
    loadDetail(String(row.id), true);
}

function backToList() {
    detail.value = null;
    replies.value = [];
    // 未读视图里刚读过的条目应消失
    if (filter.value === 'unread') fetchListPage('reset');
}

/* ---------------- 回复 ---------------- */
async function loadReplies(reset: boolean) {
    if (!detail.value) return;
    if (reset) replyPagination.value.page = 1;
    const g = gen;
    try {
        const data: any = await fetchGetProjectNoticeReplyPage({
            noticeId: String(detail.value.id),
            page: replyPagination.value.page,
            limit: replyPagination.value.limit
        });
        if (g !== gen) return;
        replyPagination.value.total = Number(data?.total ?? 0) || 0;
        const rows = data?.list || [];
        // 接口按 ID 降序（最新在前）：重置替换，加载更多时追加更早在底部
        replies.value = reset ? rows : replies.value.concat(rows);
    } catch (err) {
        if (g === gen && reset) replies.value = [];
    }
}

function loadMoreReplies() {
    replyPagination.value.page += 1;
    loadReplies(false);
}

/** 回复成功后重载最新详情（拿到新版本与回复数）并按实际查看版本提交已读，列表计数同步 */
async function submitReply() {
    if (!detail.value || replySubmitting.value) return;
    const content = replyContent.value.trim();
    if (!content) {
        uni.showToast({ icon: 'none', title: '请输入回复内容', duration: 1500 });
        return;
    }
    replySubmitting.value = true;
    try {
        await fetchInsertProjectNoticeReply({ noticeId: String(detail.value.id), content });
        uni.showToast({ icon: 'success', title: '回复成功', duration: 1500 });
        replyContent.value = '';
        await loadDetail(String(detail.value.id), true);
        const row = list.value.find((r: any) => String(r.id) === String(detail.value?.id));
        if (row && detail.value) row.replyCount = detail.value.replyCount;
        refreshSummary();
    } catch (err) {
        console.error('回复失败', err);
    } finally {
        replySubmitting.value = false;
    }
}

/* ---------------- 撤回（列表与详情共用，资格 canWithdraw 由后端返回） ---------------- */
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
        // 详情打开中则重载最新状态（不再标已读）；列表与统计同步
        if (detail.value && String(detail.value.id) === id) await loadDetail(id, false);
        fetchListPage('reset');
        refreshSummary();
    } catch (err) {
        console.error('撤回失败', err);
    } finally {
        withdrawing.value = false;
    }
}

/* ---------------- 发布（保存即发布，资格 canCreate 由后端返回） ---------------- */
const publishVisible = ref(false);
const publishSubmitting = ref(false);
const publishForm = ref<{ title: string; content: string; priority: number }>({ title: '', content: '', priority: 0 });

function openPublish() {
    publishForm.value = { title: '', content: '', priority: 0 };
    publishVisible.value = true;
}

async function submitPublish() {
    if (publishSubmitting.value || !props.pid) return;
    const title = publishForm.value.title.trim();
    const content = publishForm.value.content.trim();
    if (!title) {
        uni.showToast({ icon: 'none', title: '请输入标题', duration: 1500 });
        return;
    }
    if (title.length > 100) {
        uni.showToast({ icon: 'none', title: '标题最多 100 字', duration: 1500 });
        return;
    }
    if (!content) {
        uni.showToast({ icon: 'none', title: '请输入内容', duration: 1500 });
        return;
    }
    if (content.length > 5000) {
        uni.showToast({ icon: 'none', title: '内容最多 5000 字', duration: 1500 });
        return;
    }
    publishSubmitting.value = true;
    try {
        await fetchInsertProjectNotice({ pid: Number(props.pid), title, content, priority: publishForm.value.priority });
        uni.showToast({ icon: 'success', title: '发布成功', duration: 1500 });
        publishVisible.value = false;
        fetchListPage('reset');
        refreshSummary();
    } catch (err) {
        console.error('发布失败', err);
    } finally {
        publishSubmitting.value = false;
    }
}

/* ---------------- 弹窗联动 ---------------- */
function resetState() {
    gen += 1;
    summary.value = null;
    list.value = [];
    detail.value = null;
    replies.value = [];
    detailLoading.value = false;
    filter.value = 'all';
    pagination.value.page = 1;
    pagination.value.total = 0;
    replyPagination.value.page = 1;
    replyPagination.value.total = 0;
    replyContent.value = '';
    publishVisible.value = false;
}

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            resetState();
            refreshSummary();
            fetchListPage('reset');
        } else {
            // 仅退出详情视图，保留列表便于再次打开快速续看
            detail.value = null;
            replies.value = [];
        }
    }
);

watch(
    () => props.pid,
    () => {
        if (props.modelValue) {
            resetState();
            refreshSummary();
            fetchListPage('reset');
        }
    }
);

/* ---------------- 展示辅助 ---------------- */
/** 正文与回复均为纯文本渲染（white-space: pre-wrap），禁止富文本 */
function fmtTime(t?: string) {
    const s = String(t || '');
    return s ? s.replace('T', ' ').slice(0, 16) : '-';
}
</script>

<style lang="scss" scoped>
.dn-body {
    height: 62vh;
    display: flex;
    flex-direction: column;
    min-height: 400rpx;
}

.dn-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10rpx;
    padding: 0 0 14rpx;
    border-bottom: 2rpx solid #efeff5;
    flex-shrink: 0;
}

.dark.dn-toolbar {
    border-bottom-color: #333;
}

.dn-chips {
    display: flex;
    gap: 12rpx;
}

.dn-chip {
    display: inline-block;
    padding: 6rpx 26rpx;
    border-radius: 28rpx;
    font-size: 24rpx;
    border: 2rpx solid transparent;
}

.dn-stat {
    font-size: 22rpx;
    color: #999;
    flex-shrink: 0;
}

.dn-list-scroll {
    flex: 1;
    min-height: 0;
    padding: 16rpx 2rpx;
    box-sizing: border-box;
}

.dn-item {
    position: relative;
    padding: 20rpx 24rpx 18rpx;
    border: 2rpx solid #eef0f4;
    border-radius: 16rpx;
    margin-bottom: 16rpx;
    background: #fff;
}

.dark.dn-item {
    background: #1b1b1b;
    border-color: #333;
}

.dn-item-main {
    display: flex;
    align-items: center;
    gap: 12rpx;
    min-width: 0;
}

.dn-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 26rpx;
    color: #333;
}

.dn-title.unread {
    font-weight: 600;
}

.dn-pill {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    font-size: 20rpx;
    line-height: 1;
    padding: 5rpx 14rpx;
    border-radius: 999rpx;
    font-weight: 500;
}

.dn-pill.prio {
    color: #e4183d;
    background: rgba(224, 48, 80, 0.06);
    border: 2rpx solid rgba(224, 48, 80, 0.18);
}

.dn-pill.unread {
    color: #1677ff;
    background: rgba(24, 144, 255, 0.07);
    border: 2rpx solid rgba(24, 144, 255, 0.2);
}

.dn-pill.withdrawn {
    color: #909399;
    background: #f2f3f5;
    border: 2rpx solid #e8eaee;
}

.dn-withdraw-btn {
    flex-shrink: 0;
    font-size: 20rpx;
    line-height: 1;
    padding: 6rpx 18rpx;
    border-radius: 999rpx;
    color: #e54d42;
    border: 2rpx solid rgba(229, 77, 66, 0.4);
    background: rgba(229, 77, 66, 0.04);
}

.dn-form-label {
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
    margin: 20rpx 0 12rpx;
}

.dn-form-textarea {
    width: 100%;
    min-height: 160rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    color: #333;
    box-sizing: border-box;
}

.dn-form-textarea.dark {
    color: #e8e8e8;
}

.dn-form-hint {
    margin-top: 20rpx;
    font-size: 22rpx;
    line-height: 1.6;
    color: #999;
    background: #f5f7fa;
    border-radius: 12rpx;
    padding: 14rpx 20rpx;
}

.dn-form-hint.dark {
    background: #2a2a2a;
}

.dn-item-meta {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-top: 12rpx;
    font-size: 22rpx;
    color: #a3aab4;
}

.dn-detail-scroll {
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
}

.dn-detail-wrap {
    padding-bottom: 8rpx;
}

.dn-detail-card {
    padding: 22rpx 24rpx;
    border: 2rpx solid #eef0f4;
    border-radius: 16rpx;
    background: #fff;
}

.dark.dn-detail-card {
    background: #1b1b1b;
    border-color: #333;
}

.dn-detail-title {
    flex: 1;
    min-width: 0;
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
    word-break: break-all;
}

.dn-withdrawn-tip {
    margin-top: 12rpx;
    font-size: 22rpx;
    color: #999;
}

.dn-content {
    margin-top: 16rpx;
    font-size: 26rpx;
    line-height: 1.8;
    color: #444;
    white-space: pre-wrap;
    word-break: break-word;
}

.dn-replies-head {
    margin-top: 20rpx;
    padding: 12rpx 0 10rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: #606266;
    border-bottom: 2rpx solid #f0f0f5;
}

.dark-border {
    border-bottom-color: #333 !important;
}

.dn-replies-empty {
    padding: 30rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: #999;
}

.dn-reply-item {
    padding: 16rpx 0;
    border-bottom: 2rpx dashed #f0f0f5;
}

.dn-reply-meta {
    display: flex;
    align-items: baseline;
    gap: 16rpx;
    font-size: 22rpx;
    color: #999;
}

.dn-reply-name {
    font-size: 24rpx;
    font-weight: 500;
    color: #606266;
}

.dn-reply-content {
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: #444;
    white-space: pre-wrap;
    word-break: break-word;
}

.dn-reply-box {
    flex-shrink: 0;
    margin-top: 16rpx;
    padding: 16rpx 20rpx 20rpx;
    border: 2rpx solid #ebeef5;
    border-radius: 16rpx;
    background: #fafbfc;
}

.dark.dn-reply-box {
    background: #1b1b1b;
    border-color: #333;
}

.dn-reply-input {
    width: 100%;
    min-height: 72rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    color: #333;
    box-sizing: border-box;
}

.dark.dn-reply-input {
    color: #e8e8e8;
}

.dn-reply-disabled {
    font-size: 22rpx;
    color: #999;
    text-align: center;
    padding: 10rpx 0;
}
</style>
