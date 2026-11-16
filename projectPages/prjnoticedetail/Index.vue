<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="注意事项" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft"></wd-navbar>

        <scroll-view scroll-y :style="{ height: '100vh', background: isDark ? '#000000' : '#F5F5F5' }">
            <view v-if="loading" style="display: flex; justify-content: center; align-items: center; padding: 120rpx 0;">
                <wd-loading size="36px"></wd-loading>
            </view>
            <view v-else-if="!detail" style="padding: 120rpx 0;">
                <wd-status-tip :image-size="{ height: 100, width: 100 }" image="../static/search.png" tip="注意事项不存在或已删除" />
            </view>
            <view v-else :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 40rpx', borderRadius: '20rpx', padding: '24rpx' }">
                <view style="display: flex; align-items: center; gap: 12rpx; min-width: 0;">
                    <text v-if="detail.priority === 1" class="pnd-pill pnd-prio">重要</text>
                    <text v-if="detail.status === 2" class="pnd-pill pnd-withdrawn">已撤回</text>
                    <text class="pnd-title" :class="isDark ? 'pnd-dark-value' : ''">{{ detail.title }}</text>
                </view>
                <view class="pnd-meta" :class="isDark ? 'pnd-dark-sub' : ''">{{ detail.creatorName || '-' }} · {{ fmtTime(detail.dbtime) }} · 回复 {{ Number(detail.replyCount) || 0 }} 条</view>
                <view v-if="detail.status === 2" class="pnd-withdrawn-tip" :class="isDark ? 'pnd-dark-sub' : ''">该事项已被创建人或管理员撤回，仅供查看。</view>
                <view class="pnd-content" :class="isDark ? 'pnd-dark-content' : ''">{{ detail.content }}</view>

                <view class="pnd-replies-head" :class="[isDark ? 'pnd-dark-value' : '', isDark ? 'pnd-dark-border' : '']">
                    <text>回复（{{ Number(detail.replyCount) || 0 }}）</text>
                    <text v-if="hasMoreReplies" class="pnd-replies-more" @click="loadMoreReplies">加载更早的回复</text>
                </view>
                <view v-if="!replies.length" class="pnd-replies-empty" :class="isDark ? 'pnd-dark-sub' : ''">暂无回复</view>
                <view v-for="r in replies" :key="String(r.id)" class="pnd-reply-item" :class="isDark ? 'pnd-dark-border' : ''">
                    <view class="pnd-reply-meta" :class="isDark ? 'pnd-dark-sub' : ''">
                        <text class="pnd-reply-name" :class="isDark ? 'pnd-dark-value' : ''">{{ r.creatorName || '-' }}</text>
                        <text>{{ fmtTime(r.dbtime) }}</text>
                    </view>
                    <view class="pnd-reply-content" :class="isDark ? 'pnd-dark-value' : ''">{{ r.content }}</view>
                </view>

                <view class="pnd-reply-box" :class="isDark ? 'pnd-dark-reply-box' : ''">
                    <view v-if="!disabled && detail.canReply && detail.status === 1">
                        <textarea class="pnd-reply-input" :class="isDark ? 'pnd-dark-textarea' : ''" v-model="replyContent" maxlength="2000" placeholder="输入回复…（项目参与人或事项创建人可回复）" :placeholder-style="isDark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height />
                        <view style="display: flex; justify-content: flex-end; margin-top: 12rpx;">
                            <wd-button size="small" type="primary" :loading="replySubmitting" :disabled="replySubmitting" @click="submitReply">回复</wd-button>
                        </view>
                    </view>
                    <view v-else class="pnd-reply-disabled" :class="isDark ? 'pnd-dark-sub' : ''">
                        {{ disabled ? '项目已暂停，仅可查看' : detail.status === 2 ? '已撤回的事项不可回复' : '当前身份不可回复（需为项目参与人或事项创建人）' }}
                    </view>
                </view>
            </view>
            <view style="height: 40rpx;"></view>
        </scroll-view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { reactive, ref, computed } from 'vue';
import { onLoad, onUnload, onBackPress } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetProjectNoticeById, fetchGetProjectNoticeReplyPage, fetchInsertProjectNoticeReply } from '@/service/projectNotice';

/**
 * 注意事项查看页（从联络单详情「注意事项」面板跳入）
 * 查看即标已读：面板按打开时的 activityVersion 提交；本页返回时通知面板（含回复后列表计数刷新）。
 */
const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const noticeId = ref('');
const disabled = ref(false);

const loading = ref(true);
const detail = ref<any>(null);

const replies = ref<any[]>([]);
const replyPagination = reactive({ page: 1, limit: 20, total: 0 });
const hasMoreReplies = computed(() => replies.value.length < replyPagination.total);
const replyContent = ref('');
const replySubmitting = ref(false);

onLoad((options: any) => {
    noticeId.value = String(options?.id || '');
    disabled.value = String(options?.disabled || '') === '1';
    if (noticeId.value) {
        init();
    } else {
        loading.value = false;
    }
});

async function init() {
    loading.value = true;
    try {
        const data: any = await fetchGetProjectNoticeById({ id: noticeId.value });
        detail.value = data || null;
        if (data) loadReplies(true);
    } catch (err) {
        console.error('获取注意事项详情失败', err);
        detail.value = null;
    } finally {
        loading.value = false;
    }
}

/** 后端按 ID 降序（最新在前）；界面按时间正序展示，加载更早的回复往前插 */
async function loadReplies(reset: boolean) {
    if (!noticeId.value) return;
    if (reset) replyPagination.page = 1;
    try {
        const data: any = await fetchGetProjectNoticeReplyPage({
            noticeId: noticeId.value,
            page: replyPagination.page,
            limit: replyPagination.limit
        });
        const rows = (data?.list || []).slice().reverse();
        replyPagination.total = Number(data?.total ?? 0) || 0;
        replies.value = reset ? rows : rows.concat(replies.value);
    } catch (err) {
        console.error('获取回复列表失败', err);
    }
}

function loadMoreReplies() {
    replyPagination.page += 1;
    loadReplies(false);
}

async function submitReply() {
    if (replySubmitting.value || !detail.value) return;
    const content = replyContent.value.trim();
    if (!content) {
        uni.showToast({ icon: 'none', title: '请输入回复内容', duration: 1500 });
        return;
    }
    replySubmitting.value = true;
    try {
        await fetchInsertProjectNoticeReply({ noticeId: noticeId.value, content });
        uni.showToast({ icon: 'success', title: '回复成功', duration: 1500 });
        replyContent.value = '';
        detail.value.replyCount = String(Number(detail.value.replyCount || 0) + 1);
        loadReplies(true);
    } catch (err) {
        console.error('回复失败', err);
    } finally {
        replySubmitting.value = false;
    }
}

function notifyPanel() {
    uni.$emit('projectNoticeDetailBack');
}

function handleClickLeft() {
    notifyPanel();
    uni.navigateBack();
}

onBackPress(() => {
    notifyPanel();
});

onUnload(() => {
    notifyPanel();
});

/** 正文按纯文本渲染（white-space: pre-wrap），禁止 v-html */
function fmtTime(t?: string) {
    const s = String(t || '');
    return s ? s.replace('T', ' ').slice(0, 16) : '-';
}
</script>

<style lang="scss" scoped>
/* 状态小标签：胶囊 + 细描边（与 project-notice-panel 一致） */
.pnd-pill {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    font-size: 20rpx;
    line-height: 1;
    padding: 5rpx 14rpx;
    border-radius: 999rpx;
    font-weight: 500;
}

.pnd-pill.pnd-prio {
    color: #e03050;
    background: rgba(224, 48, 80, 0.06);
    border: 2rpx solid rgba(224, 48, 80, 0.18);
}

.pnd-pill.pnd-withdrawn {
    color: #909399;
    background: #f2f3f5;
    border: 2rpx solid #e8eaee;
}

.pnd-title {
    flex: 1;
    min-width: 0;
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
    word-break: break-all;
}

.pnd-meta {
    margin-top: 12rpx;
    font-size: 22rpx;
    color: #a3aab4;
}

.pnd-withdrawn-tip {
    margin-top: 12rpx;
    padding: 12rpx 16rpx;
    border-radius: 12rpx;
    background: #f4f4f5;
    color: #909399;
    font-size: 22rpx;
}

.pnd-content {
    margin-top: 16rpx;
    padding: 20rpx 24rpx;
    background: #f7f9fc;
    border-radius: 16rpx;
    font-size: 26rpx;
    line-height: 1.8;
    color: #444;
    white-space: pre-wrap;
    word-break: break-word;
}

.pnd-dark-content {
    background: #2a2a2a;
    color: #e8e8e8;
}

.pnd-replies-head {
    margin-top: 20rpx;
    padding: 12rpx 0 10rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 24rpx;
    font-weight: 600;
    color: #606266;
    border-bottom: 2rpx solid #f0f0f5;
}

.pnd-dark-border {
    border-bottom-color: #333 !important;
}

.pnd-replies-more {
    font-size: 22rpx;
    font-weight: 400;
    color: #1890ff;
}

.pnd-replies-empty {
    padding: 30rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: #999;
}

.pnd-reply-item {
    padding: 16rpx 0;
    border-bottom: 2rpx dashed #f0f0f5;
}

.pnd-reply-meta {
    display: flex;
    align-items: baseline;
    gap: 16rpx;
    font-size: 22rpx;
    color: #999;
}

.pnd-reply-name {
    font-size: 24rpx;
    font-weight: 500;
    color: #606266;
}

.pnd-reply-content {
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: #444;
    white-space: pre-wrap;
    word-break: break-word;
}

.pnd-reply-box {
    margin-top: 16rpx;
    padding: 16rpx 20rpx 20rpx;
    border: 2rpx solid #ebeef5;
    border-radius: 16rpx;
    background: #fafbfc;
}

.pnd-dark-reply-box {
    background: #1b1b1b;
    border-color: #333;
}

.pnd-reply-input {
    width: 100%;
    min-height: 72rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    color: #333;
    box-sizing: border-box;
}

.pnd-dark-textarea {
    color: #e8e8e8;
}

.pnd-reply-disabled {
    font-size: 22rpx;
    color: #999;
    text-align: center;
    padding: 10rpx 0;
}

.pnd-dark-value {
    color: #e8e8e8 !important;
}

.pnd-dark-sub {
    color: #888 !important;
}
</style>
