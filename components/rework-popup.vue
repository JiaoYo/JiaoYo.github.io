<template>
    <wd-popup :z-index="99" closable :close-on-click-modal="false" :modelValue="modelValue" custom-style="width: 94%; border-radius: 32rpx; padding: 20rpx;" @update:modelValue="handleVisibleChange">
        <view style="margin-bottom: 16rpx; padding-right: 80rpx; display: flex; align-items: center; gap: 12rpx; flex-wrap: wrap;">
            <wd-text text="项目返工" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
            <text v-if="project && project.proname" class="rw-tag" :class="dark ? 'dark' : ''">{{ project.proname }}</text>
            <text v-if="project && project.reworkCount" class="rw-tag warn" :class="dark ? 'dark' : ''">累计返工 {{ project.reworkCount }} 次</text>
        </view>

        <!-- 发起返工入口 -->
        <view v-if="canStartRework" style="display: flex; justify-content: flex-end; margin-bottom: 16rpx;">
            <wd-button size="small" type="primary" @click="openStartModal">发起返工</wd-button>
        </view>

        <!-- 当前返工快照 -->
        <view v-if="activeRework" class="rw-banner warn" :class="dark ? 'dark' : ''">
            <view style="font-weight: 600;">当前返工（第{{ activeRework.reworkNo }}次）</view>
            <view>责任人：{{ activeRework.responsibleName || '-' }}</view>
            <view>截止日期：{{ activeRework.deadline || '-' }}<text v-if="isOverdue(activeRework)" style="color: #ef4444; margin-left: 8rpx;">（已逾期）</text></view>
            <view style="word-break: break-all;">原因：{{ activeRework.reason || '-' }}</view>
        </view>
        <view v-else-if="!listLoading" class="rw-banner info" :class="dark ? 'dark' : ''">当前项目没有进行中的返工</view>

        <!-- 历史记录 -->
        <scroll-view scroll-y class="rw-list-scroll" :class="dark ? 'dark' : ''">
            <view v-if="!list.length && !listLoading" style="padding: 60rpx 0;">
                <wd-status-tip image="../static/search.png" tip="暂无返工记录" />
            </view>
            <view v-for="row in list" :key="String(row.id)" class="rw-item" :class="dark ? 'dark' : ''">
                <view class="rw-item-head">
                    <text class="rw-round">第{{ row.reworkNo }}次</text>
                    <wd-tag :type="statusTagType(row.status)" size="small" round>{{ statusText(row.status) }}</wd-tag>
                    <text v-if="isOverdue(row)" class="rw-pill overdue">已逾期</text>
                    <view style="flex: 1;"></view>
                    <template v-if="row.status === 0 && canOperateRework">
                        <text class="rw-action" @click.stop="openEditModal(row)">修改</text>
                        <text class="rw-action success" @click.stop="openFinishModal(row)">完成</text>
                        <text class="rw-action danger" @click.stop="openCancelModal(row)">取消</text>
                    </template>
                </view>
                <view class="rw-item-row"><text class="rw-label">责任人</text><text :class="dark ? 'dark-value' : ''">{{ row.responsibleName || '-' }}</text></view>
                <view class="rw-item-row"><text class="rw-label">截止日期</text><text :class="dark ? 'dark-value' : ''">{{ row.deadline || '-' }}</text></view>
                <view class="rw-item-row"><text class="rw-label">返工原因</text><text class="rw-text" :class="dark ? 'dark-value' : ''">{{ row.reason || '-' }}</text></view>
                <view class="rw-item-row"><text class="rw-label">返工要求</text><text class="rw-text" :class="dark ? 'dark-value' : ''">{{ row.requirement || '-' }}</text></view>
                <view class="rw-item-row"><text class="rw-label">发起人</text><text :class="dark ? 'dark-value' : ''">{{ row.creatorName || '-' }}（{{ fmtTime(row.createdAt) }}）</text></view>
                <view v-if="row.status === 1" class="rw-item-row"><text class="rw-label">结果</text><text class="rw-text" :class="dark ? 'dark-value' : ''">完成：{{ row.completionNote || '-' }}（{{ row.completedByName || '' }} {{ fmtTime(row.completedAt) }}）</text></view>
                <view v-if="row.status === 2" class="rw-item-row"><text class="rw-label">结果</text><text class="rw-text" :class="dark ? 'dark-value' : ''">取消：{{ row.cancelReason || '-' }}（{{ row.cancelledByName || '' }} {{ fmtTime(row.cancelledAt) }}）</text></view>
            </view>
            <view v-if="hasMore" style="display: flex; justify-content: center; padding: 16rpx 0;">
                <wd-button size="small" type="primary" plain :disabled="listLoading" @click="getHistory('more')">加载更多</wd-button>
            </view>
        </scroll-view>

        <!-- 发起 / 修改 弹框 -->
        <wd-popup :z-index="101" closable :close-on-click-modal="false" :model-value="formVisible" custom-style="width: 86%; border-radius: 32rpx; padding: 24rpx; max-height: 80vh;" position="center" @update:model-value="formVisible = $event">
            <view style="margin-bottom: 20rpx; padding-right: 80rpx;">
                <wd-text :text="formMode === 'start' ? '发起返工' : '修改返工信息'" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
            </view>
            <scroll-view scroll-y style="max-height: 56vh;">
                <view class="rw-form-label">责任人<text style="color: #e54d42;">*</text></view>
                <view v-if="participantList.length" class="rw-person-list" :class="dark ? 'dark' : ''">
                    <view v-for="p in participantList" :key="String(p.participant)" class="rw-person" :class="{ active: form.responsibleId === p.participant }" @click="form.responsibleId = p.participant">{{ p.prtcname || p.username || '-' }}</view>
                </view>
                <view v-else class="rw-person-empty" :class="dark ? 'dark-sub' : ''">暂无项目参与人，请先在项目中添加参与人</view>

                <view class="rw-form-label">返工原因<text style="color: #e54d42;">*</text></view>
                <textarea class="rw-form-textarea" :class="dark ? 'dark' : ''" v-model="form.reason" maxlength="500" placeholder="为什么需要返工（必填，500字以内）" :placeholder-style="dark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height></textarea>

                <view class="rw-form-label">返工要求</view>
                <textarea class="rw-form-textarea" :class="dark ? 'dark' : ''" v-model="form.requirement" maxlength="1000" placeholder="本轮返工需要达到的处理要求（选填）" :placeholder-style="dark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height></textarea>

                <view class="rw-form-label">截止日期<text style="color: #e54d42;">*</text></view>
                <wd-datetime-picker :key="pickerResetKey" v-model="form.deadline" type="date" :min-date="minDeadline" custom-class="rw-date-picker" @confirm="({ value }) => (form.deadline = value)"></wd-datetime-picker>
            </scroll-view>
            <view style="display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx;">
                <wd-button size="small" @click="formVisible = false">取消</wd-button>
                <wd-button size="small" type="primary" :loading="submitting" :disabled="submitting" @click="submitForm">{{ formMode === 'start' ? '确认发起' : '保存修改' }}</wd-button>
            </view>
        </wd-popup>

        <!-- 完成弹框 -->
        <wd-popup :z-index="101" closable :close-on-click-modal="false" :model-value="finishVisible" custom-style="width: 86%; border-radius: 32rpx; padding: 24rpx;" position="center" @update:model-value="finishVisible = $event">
            <view style="margin-bottom: 20rpx; padding-right: 80rpx;">
                <wd-text text="完成返工" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
            </view>
            <view class="rw-banner info" :class="dark ? 'dark' : ''" style="margin-bottom: 16rpx;">完成后项目直接进入「已完成」状态（进度 100%），无需审核。</view>
            <textarea class="rw-form-textarea" :class="dark ? 'dark' : ''" v-model="finishNote" maxlength="1000" placeholder="请填写完成说明（必填）" :placeholder-style="dark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height></textarea>
            <view style="display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx;">
                <wd-button size="small" @click="finishVisible = false">取消</wd-button>
                <wd-button size="small" type="success" :loading="submitting" :disabled="submitting" @click="submitFinish">确认完成</wd-button>
            </view>
        </wd-popup>

        <!-- 取消弹框 -->
        <wd-popup :z-index="101" closable :close-on-click-modal="false" :model-value="cancelVisible" custom-style="width: 86%; border-radius: 32rpx; padding: 24rpx;" position="center" @update:model-value="cancelVisible = $event">
            <view style="margin-bottom: 20rpx; padding-right: 80rpx;">
                <wd-text text="取消返工" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
            </view>
            <view class="rw-banner warn" :class="dark ? 'dark' : ''" style="margin-bottom: 16rpx;">取消后项目恢复为返工前状态，返工记录保留在历史中。</view>
            <textarea class="rw-form-textarea" :class="dark ? 'dark' : ''" v-model="cancelReason" maxlength="500" placeholder="请填写取消原因（必填）" :placeholder-style="dark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height></textarea>
            <view style="display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx;">
                <wd-button size="small" @click="cancelVisible = false">再想想</wd-button>
                <wd-button size="small" type="error" :loading="submitting" :disabled="submitting" @click="submitCancel">确认取消</wd-button>
            </view>
        </wd-popup>
    </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { hasPermission } from '@/utils/index';
import { fetchStartRework, fetchUpdateRework, fetchFinishRework, fetchCancelRework, fetchGetReworkPage } from '@/service/prjRework';
import { fetchGetProjectParticipantDataList } from '@/service/projectParticipant';

/**
 * 项目返工弹窗（参考 web 端 orderdetail rework-drawer）
 *
 * 能力对齐 web：发起 / 修改（进行中）/ 完成（项目直接进入已完成）/ 取消（恢复返工前状态）+ 历史分页；
 * 操作资格与服务端一致：usertype 0/2 且有 project:Info:update 权限；
 * 发起条件：项目状态待审核(2)/已完成(3)、未暂停、非作废、且无进行中的返工（currentReworkId 为空）。
 */
const props = defineProps<{
    modelValue: boolean;
    /** 项目 ID */
    pid?: number | string;
    /** 项目详情快照（proname / reworkCount / status / pause / ptype / currentReworkId） */
    project?: any;
    /** 暗色主题 */
    dark?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    /** 写操作成功后通知父级刷新项目详情 */
    (e: 'refresh'): void;
}>();

function handleVisibleChange(val: boolean) {
    emit('update:modelValue', val);
}

const userType = ref<number>(uni.getStorageSync('usertype'));

/** 代际计数：弹窗关闭/pid 变化时自增，晚到的旧响应不再应用 */
let gen = 0;

/* ---------------- 权限 ---------------- */
const canOperateRework = computed(() => (userType.value === 0 || userType.value === 2) && hasPermission('project:Info:update'));

const canStartRework = computed(() => {
    const p = props.project || {};
    return (
        canOperateRework.value &&
        (p.status === 2 || p.status === 3) &&
        Number(p.pause) !== 1 &&
        Number(p.ptype) !== 2 &&
        (p.currentReworkId === null || p.currentReworkId === undefined)
    );
});

/* ---------------- 状态展示 ---------------- */
function statusText(status: number) {
    return status === 0 ? '进行中' : status === 1 ? '已完成' : status === 2 ? '已取消' : '未知';
}
function statusTagType(status: number): 'warning' | 'success' | 'default' {
    return status === 0 ? 'warning' : status === 1 ? 'success' : 'default';
}
/** 截止日期早于今天且进行中 => 已逾期（仅展示，不修改数据） */
function isOverdue(row: any) {
    if (Number(row.status) !== 0 || !row.deadline) return false;
    const today = new Date();
    const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return String(row.deadline).slice(0, 10) < t;
}

function fmtTime(t?: string) {
    const s = String(t || '');
    return s ? s.replace('T', ' ').slice(0, 16) : '-';
}

/* ---------------- 历史分页 ---------------- */
const listLoading = ref(false);
const list = ref<any[]>([]);
const pagination = ref({ page: 1, limit: 10, total: 0 });
const hasMore = computed(() => list.value.length < pagination.value.total);
/** 当前进行中的返工记录（历史列表中 status=0 的那一条） */
const activeRework = computed(() => list.value.find((r: any) => Number(r.status) === 0));

async function getHistory(mode: 'reset' | 'more' = 'reset') {
    if (!props.pid) {
        list.value = [];
        return;
    }
    if (mode === 'reset') pagination.value.page = 1;
    if (mode === 'more') pagination.value.page += 1;
    const g = gen;
    listLoading.value = true;
    try {
        const data: any = await fetchGetReworkPage({ pid: Number(props.pid), page: pagination.value.page, limit: pagination.value.limit });
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

/* ---------------- 返工责任人候选：项目参与人 ---------------- */
const participantList = ref<any[]>([]);
async function getParticipants() {
    if (!props.pid) {
        participantList.value = [];
        return;
    }
    try {
        const data: any = await fetchGetProjectParticipantDataList({ pid: Number(props.pid), page: 1, limit: 100 }, false);
        participantList.value = data?.list || [];
    } catch (err) {
        participantList.value = [];
    }
}

/* ---------------- 发起 / 修改 表单 ---------------- */
const formVisible = ref(false);
const formMode = ref<'start' | 'edit'>('start');
const submitting = ref(false);
/** datetime-picker 重渲key：切换 start/edit 时让选择器按新初值重建（避开 v-model 空值首开坑） */
const pickerResetKey = ref(0);
const minDeadline = new Date().getTime();
const form = ref<{ id?: number; responsibleId: any; reason: string; requirement: string; deadline: number }>({
    id: undefined,
    responsibleId: '',
    reason: '',
    requirement: '',
    deadline: Date.now()
});

function openStartModal() {
    formMode.value = 'start';
    form.value = { id: undefined, responsibleId: '', reason: '', requirement: '', deadline: Date.now() };
    pickerResetKey.value += 1;
    formVisible.value = true;
}

function openEditModal(row: any) {
    formMode.value = 'edit';
    form.value = {
        id: row.id,
        responsibleId: row.responsibleId ?? '',
        reason: row.reason || '',
        requirement: row.requirement || '',
        deadline: row.deadline ? new Date(`${String(row.deadline).slice(0, 10)}T00:00:00`).getTime() : Date.now()
    };
    pickerResetKey.value += 1;
    formVisible.value = true;
}

function fmtDate(ts: number) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function submitForm() {
    if (!form.value.responsibleId) {
        uni.showToast({ icon: 'none', title: '请选择返工责任人', duration: 1500 });
        return;
    }
    if (!form.value.reason.trim()) {
        uni.showToast({ icon: 'none', title: '请填写返工原因', duration: 1500 });
        return;
    }
    if (!form.value.deadline) {
        uni.showToast({ icon: 'none', title: '请选择截止日期', duration: 1500 });
        return;
    }
    const d = new Date(form.value.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() < today.getTime()) {
        uni.showToast({ icon: 'none', title: '截止日期不能早于当天', duration: 1500 });
        return;
    }
    submitting.value = true;
    try {
        const payload = {
            responsibleId: form.value.responsibleId,
            reason: form.value.reason.trim(),
            requirement: form.value.requirement.trim() || undefined,
            deadline: fmtDate(form.value.deadline)
        };
        if (formMode.value === 'start') {
            await fetchStartRework({ pid: Number(props.pid), ...payload });
            uni.showToast({ icon: 'success', title: '返工已发起', duration: 1500 });
        } else {
            await fetchUpdateRework({ id: form.value.id!, ...payload });
            uni.showToast({ icon: 'success', title: '修改成功', duration: 1500 });
        }
        formVisible.value = false;
        await reloadAll();
    } catch (err) {
        console.error('提交返工失败', err);
    } finally {
        submitting.value = false;
    }
}

/* ---------------- 完成 / 取消 ---------------- */
const finishVisible = ref(false);
const finishNote = ref('');
const finishTargetId = ref<number>();
function openFinishModal(row: any) {
    finishTargetId.value = row.id;
    finishNote.value = '';
    finishVisible.value = true;
}
async function submitFinish() {
    if (!finishNote.value.trim()) {
        uni.showToast({ icon: 'none', title: '请填写完成说明', duration: 1500 });
        return;
    }
    submitting.value = true;
    try {
        await fetchFinishRework({ id: finishTargetId.value!, completionNote: finishNote.value.trim() });
        uni.showToast({ icon: 'success', title: '返工已完成', duration: 1500 });
        finishVisible.value = false;
        await reloadAll();
    } catch (err) {
        console.error('完成返工失败', err);
    } finally {
        submitting.value = false;
    }
}

const cancelVisible = ref(false);
const cancelReason = ref('');
const cancelTargetId = ref<number>();
function openCancelModal(row: any) {
    cancelTargetId.value = row.id;
    cancelReason.value = '';
    cancelVisible.value = true;
}
async function submitCancel() {
    if (!cancelReason.value.trim()) {
        uni.showToast({ icon: 'none', title: '请填写取消原因', duration: 1500 });
        return;
    }
    submitting.value = true;
    try {
        await fetchCancelRework({ id: cancelTargetId.value!, cancelReason: cancelReason.value.trim() });
        uni.showToast({ icon: 'success', title: '返工已取消', duration: 1500 });
        cancelVisible.value = false;
        await reloadAll();
    } catch (err) {
        console.error('取消返工失败', err);
    } finally {
        submitting.value = false;
    }
}

/* ---------------- 汇总刷新 ---------------- */
async function reloadAll() {
    await getHistory('reset');
    emit('refresh'); // 通知父级刷新项目详情，currentReworkId/reworkCount 以服务端数据为准
}

/* ---------------- 弹窗联动 ---------------- */
function resetState() {
    gen += 1;
    list.value = [];
    pagination.value.page = 1;
    pagination.value.total = 0;
    formVisible.value = false;
    finishVisible.value = false;
    cancelVisible.value = false;
}

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            resetState();
            getHistory('reset');
            getParticipants();
        }
    }
);

watch(
    () => props.pid,
    () => {
        if (props.modelValue) {
            resetState();
            getHistory('reset');
            getParticipants();
        }
    }
);
</script>

<style lang="scss" scoped>
.rw-tag {
    display: inline-block;
    padding: 4rpx 18rpx;
    border-radius: 999rpx;
    font-size: 22rpx;
    color: #1677ff;
    background: rgba(22, 119, 255, 0.08);
}

.rw-tag.warn {
    color: #d48806;
    background: rgba(250, 173, 20, 0.1);
}

.rw-tag.dark {
    background: rgba(22, 119, 255, 0.25);
    color: #69b1ff;
}

.rw-tag.warn.dark {
    color: #ffc53d;
    background: rgba(250, 173, 20, 0.2);
}

.rw-banner {
    border-radius: 16rpx;
    padding: 18rpx 22rpx;
    font-size: 24rpx;
    line-height: 1.7;
    margin-bottom: 16rpx;
}

.rw-banner.warn {
    color: #ad6800;
    background: #fffbe6;
}

.rw-banner.info {
    color: #666;
    background: #f5f7fa;
}

.rw-banner.dark {
    background: rgba(250, 173, 20, 0.12);
    color: #ffc53d;
}

.rw-banner.info.dark {
    background: #2a2a2a;
    color: #c9cdd4;
}

.rw-list-scroll {
    height: 56vh;
    min-height: 360rpx;
}

.rw-item {
    border: 2rpx solid #eef0f4;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    margin-bottom: 16rpx;
    background: #fff;
}

.rw-item.dark {
    background: #1b1b1b;
    border-color: #333;
}

.rw-item-head {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
}

.rw-round {
    font-weight: 600;
    font-size: 26rpx;
    color: #333;
}

.rw-item.dark .rw-round {
    color: #e8e8e8;
}

.rw-pill {
    display: inline-block;
    padding: 4rpx 14rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    color: #e54d42;
    background: rgba(229, 77, 66, 0.08);
}

.rw-action {
    font-size: 24rpx;
    color: #1677ff;
    padding: 0 8rpx;
}

.rw-action.success {
    color: #52c41a;
}

.rw-action.danger {
    color: #e54d42;
}

.rw-item-row {
    display: flex;
    gap: 16rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: #666;
}

.rw-item-row .rw-label {
    flex: none;
    color: #999;
}

.rw-item.dark .rw-label {
    color: #8a8a8a;
}

.rw-text {
    word-break: break-all;
}

.dark-value {
    color: #e8e8e8 !important;
}

.rw-form-label {
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
    margin: 20rpx 0 12rpx;
}

.rw-form-label.dark {
    color: #e8e8e8;
}

.rw-person-list {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
}

.rw-person {
    padding: 10rpx 26rpx;
    border-radius: 999rpx;
    font-size: 24rpx;
    background: #f5f5f5;
    color: #4e5969;
    border: 2rpx solid transparent;
}

.rw-person.dark {
    background: #2a2a2a;
    color: #c9cdd4;
}

.rw-person.active {
    background: #e6f4ff;
    color: #1677ff;
    border-color: #1677ff;
}

.rw-person.active.dark {
    background: rgba(22, 119, 255, 0.3);
    color: #69b1ff;
    border-color: #69b1ff;
}

.rw-person-empty {
    font-size: 24rpx;
    color: #999;
    padding: 8rpx 0;
}

.rw-form-textarea {
    width: 100%;
    min-height: 120rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    color: #333;
    box-sizing: border-box;
}

.rw-form-textarea.dark {
    color: #e8e8e8;
}

:deep(.rw-date-picker) {
    width: 100%;
}
</style>
