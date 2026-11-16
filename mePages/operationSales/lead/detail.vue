<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow title="线索详情" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
                <template #right>
                    <text v-if="canEdit" class="nav-right-text" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click="handleEdit">编辑</text>
                </template>
            </wd-navbar>
        </view>

        <view v-if="detail" style="padding: 20rpx;">
            <!-- 顶部状态卡 -->
            <view class="status-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="cust-row">
                    <text class="cust-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ detail.customer_name || '-' }}</text>
                </view>
                <view class="tag-row">
                    <view class="mini-tag" :style="{ background: originColor(detail.origin_type) + '1A', color: originColor(detail.origin_type) }">{{ originLabel(detail.origin_type) }}</view>
                    <!-- 疑似重复标签（2026-10-14）：点击弹审核备注或默认提示（对齐 web NTag tooltip） -->
                    <view v-if="detail.duplicate_status === 'SUSPECTED'" class="mini-tag" :style="{ background: leadDuplicateStatusColorMap.SUSPECTED + '1A', color: leadDuplicateStatusColorMap.SUSPECTED }" @click="showDuplicateTip">{{ leadDuplicateStatusMap.SUSPECTED }}</view>
                    <view class="mini-tag" :style="{ background: processColor(detail.process_status) + '1A', color: processColor(detail.process_status) }">{{ processLabel(detail.process_status) }}</view>
                    <view class="mini-tag" :style="{ background: outcomeColor(detail.outcome_status) + '1A', color: outcomeColor(detail.outcome_status) }">{{ outcomeLabel(detail.outcome_status) }}</view>
                </view>
                <view class="owner-row" :style="{ color: isDark ? '#8a9099' : '#999' }">当前负责人：{{ nameOf(detail.current_owner_user_id) }}</view>
            </view>

            <!-- 待接收提示 -->
            <view v-if="detail.process_status === 'PENDING_RECEIVE' && detail.pending_receiver_user_id" class="pending-alert" :style="{ background: isDark ? 'rgba(250, 140, 22, 0.12)' : '#fff7e6' }">
                <view class="pending-text" :style="{ color: isDark ? '#e8e8e8' : '#333' }">
                    由「{{ nameOf(detail.current_owner_user_id) }}」交接给「{{ nameOf(detail.pending_receiver_user_id) }}」，{{ String(detail.pending_receiver_user_id) === currentUserId ? '等待您处理' : '等待对方处理' }}
                </view>
                <view v-if="canAccept || canReject || canCancelHandoff" class="pending-actions">
                    <wd-button v-if="canAccept" size="small" type="success" @click="handleAccept">接收</wd-button>
                    <wd-button v-if="canReject" size="small" type="error" plain @click="openActionModal('reject')">拒绝</wd-button>
                    <wd-button v-if="canCancelHandoff" size="small" type="info" plain @click="openActionModal('cancel')">取消交接</wd-button>
                </view>
            </view>

            <!-- 基础资料 -->
            <view class="section-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="section-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">基础资料</view>
                <view class="cell" v-for="cell in baseCells" :key="cell.label">
                    <text class="cell-label" :style="{ color: isDark ? '#8a9099' : '#999' }">{{ cell.label }}</text>
                    <view class="cell-value-wrap">
                        <!-- app 端 v-for 内不用嵌套 template/block 碎片，统一 view -->
                        <view v-if="cell.type === 'tag'" class="mini-tag" :style="{ background: cell.tagColor + '1A', color: cell.tagColor }">{{ cell.value }}</view>
                        <view v-else-if="cell.type === 'copy'" class="copy-wrap">
                            <text class="cell-value" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ cell.value || '-' }}</text>
                            <text v-if="cell.value" class="copy-btn" @click="copyText(cell.value)">复制</text>
                        </view>
                        <view v-else class="plain-wrap">
                            <text class="cell-value" :class="{ 'pre-line': cell.preLine }" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ cell.value || '-' }}</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 交接时间线 -->
            <view class="section-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="section-head">
                    <view class="section-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">交接时间线</view>
                    <wd-button v-if="canCreateHandoff" size="small" type="warning" plain @click="goHandoffPage">发起交接</wd-button>
                </view>
                <view v-if="!(detail.handoffs || []).length" class="empty-line" :style="{ color: isDark ? '#6a6a6a' : '#bbb' }">暂无交接记录</view>
                <view v-else class="tl">
                    <view class="tl-item" v-for="h in detail.handoffs" :key="h.id">
                        <view class="tl-dot" :style="{ background: handoffDotColor(h.status) }"></view>
                        <view class="tl-body">
                            <view class="tl-head">
                                <text class="tl-user" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ nameOf(h.from_user_id) }} → {{ nameOf(h.to_user_id) }}</text>
                                <view class="mini-tag" :style="{ background: handoffColor(h.status) + '1A', color: handoffColor(h.status) }">{{ handoffStatusLabel(h.status) }}</view>
                            </view>
                            <view v-if="h.request_remark" class="tl-line" :style="{ color: isDark ? '#a8adb5' : '#666' }">发起说明：{{ h.request_remark }}</view>
                            <view v-if="h.decision_remark" class="tl-line" :style="{ color: isDark ? '#a8adb5' : '#666' }">处理说明：{{ h.decision_remark }}</view>
                            <view class="tl-time">发起：{{ h.requested_at || '-' }}{{ h.decided_at ? '｜处理：' + h.decided_at : '' }}</view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 跟进时间线 -->
            <view class="section-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="section-head">
                    <view class="section-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">跟进时间线</view>
                    <view v-if="followupBlockedByHandoff" class="blocked-hint" :style="{ color: isDark ? '#fa8c16' : '#d46b08' }">待接收状态不能添加跟进</view>
                    <wd-button v-else-if="canAddFollowup" size="small" type="primary" plain @click="goFollowupPage">添加跟进</wd-button>
                </view>
                <view v-if="!(detail.followups || []).length" class="empty-line" :style="{ color: isDark ? '#6a6a6a' : '#bbb' }">暂无跟进记录</view>
                <view v-else class="tl">
                    <view class="tl-item" v-for="f in detail.followups" :key="f.id">
                        <view class="tl-dot" style="background: #1677ff;"></view>
                        <view class="tl-body">
                            <view class="tl-head">
                                <text class="tl-user" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ nameOf(f.follow_user_id) }}</text>
                                <view class="mini-tag" style="background: rgba(22, 119, 255, 0.1); color: #1677ff;">{{ followupTypeLabel(f.followup_type) }}</view>
                                <view class="mini-tag" :style="{ background: outcomeColor(f.outcome_status) + '1A', color: outcomeColor(f.outcome_status) }">{{ outcomeLabel(f.outcome_status) }}</view>
                            </view>
                            <view class="tl-line pre-line" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ f.content }}</view>
                            <!-- 跟进图片：ftype 11 登记在研发文件表，详情接口 followups[].list 回显；点击预览大图 -->
                            <view v-if="(f.list || []).length" class="tl-imgs">
                                <image v-for="(img, i) in f.list" :key="img.id" class="tl-img" :src="img.furl" mode="aspectFill" @click="previewFollowupImg(f.list, i)" />
                            </view>
                            <view class="tl-time">跟进：{{ f.followed_at || '-' }}{{ f.next_followup_at ? '｜下次：' + f.next_followup_at : '' }}</view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 一键成交（对齐 web 详情头部成交按钮）：确认后结果置为「成交」、流程置为「已结束」并保存合同号 -->
            <wd-button v-if="canDeal" block type="success" plain custom-style="margin-top: 20rpx;" @click="openDeal">一键成交</wd-button>

            <!-- 删除（资格同修改；存在待接收交接时后端拒绝） -->
            <wd-button v-if="canDelete" block type="error" plain custom-style="margin-top: 20rpx;" @click="handleDelete">删除线索</wd-button>
            <view style="height: 40rpx;"></view>
        </view>

        <!-- 拒绝 / 取消交接 弹窗 -->
        <wd-popup v-model="actionModalVisible" position="bottom" custom-class="op-popup" :safe-area-inset-bottom="true">
            <view class="popup-body" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ actionModalMode === 'reject' ? '拒绝交接' : '取消交接' }}</view>
                <view class="popup-tip" :style="{ background: isDark ? 'rgba(250, 140, 22, 0.12)' : '#fff7e6', color: isDark ? '#fa8c16' : '#d46b08' }">
                    {{ actionModalMode === 'reject' ? '拒绝后负责人保持不变，线索恢复到发起交接前的流程状态。' : '取消后负责人保持不变，线索恢复到发起交接前的流程状态。' }}
                </view>
                <textarea class="op-textarea" v-model="actionRemark" maxlength="500" :placeholder="actionModalMode === 'reject' ? '请填写拒绝原因（必填）' : '请填写取消原因（必填）'" />
                <view class="popup-footer">
                    <wd-button size="small" type="info" plain @click="actionModalVisible = false">取消</wd-button>
                    <wd-button size="small" :type="actionModalMode === 'reject' ? 'error' : 'warning'" :disabled="actionLoading" @click="submitActionModal">{{ actionModalMode === 'reject' ? '确认拒绝' : '确认取消' }}</wd-button>
                </view>
            </view>
        </wd-popup>

        <!-- 一键成交弹窗 -->
        <wd-popup v-model="dealVisible" position="bottom" custom-class="op-popup" :safe-area-inset-bottom="true">
            <view class="popup-body" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">一键成交</view>
                <view class="popup-tip" :style="{ background: isDark ? 'rgba(82, 196, 26, 0.12)' : '#f6ffed', color: isDark ? '#95de64' : '#389e0d' }">
                    确认后线索结果置为「成交」、流程置为「已结束」，并保存合同号。合同号需为系统中已存在的合同号。
                </view>
                <view class="popup-field-label" :style="{ color: isDark ? '#8a9099' : '#999' }">合同号（必填，需与已签合同一致）</view>
                <input class="op-input" v-model="dealContractNumber" maxlength="100" placeholder="请输入合同号，如 HT20260315001" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" :style="{ background: isDark ? '#1b1b1b' : 'rgba(128, 128, 128, 0.08)', color: isDark ? '#e8e8e8' : '#333' }" />
                <view class="popup-footer">
                    <wd-button size="small" type="info" plain @click="dealVisible = false">取消</wd-button>
                    <wd-button size="small" type="success" :disabled="dealSubmitting" @click="saveDeal">{{ dealSubmitting ? '提交中…' : '确认成交' }}</wd-button>
                </view>
            </view>
        </wd-popup>

        <!-- 添加跟进/发起交接为独立整页（lead/followup、lead/handoff），此处仅保留拒绝/取消交接弹窗 -->
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { onLoad, onShow, onUnload } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { hasPermission } from "@/utils/index";
import { fetchLeadDetail, fetchHandoffAccept, fetchHandoffReject, fetchHandoffCancel, fetchLeadConfirmDeal } from "@/service/operationSales";
import { useOpUserMap } from "../user-map";
import {
    leadOriginTypeMap,
    leadOriginTypeColorMap,
    leadProcessStatusMap,
    leadProcessStatusColorMap,
    leadOutcomeStatusMap,
    leadOutcomeStatusColorMap,
    handoffStatusMap,
    handoffStatusColorMap,
    followupTypeMap,
    leadDuplicateStatusMap,
    leadDuplicateStatusColorMap
} from "../constants";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const { nameOf, load: loadUserMap } = useOpUserMap();

const userType = computed(() => Number(uni.getStorageSync("usertype")));
const currentUserId = computed(() => String(uni.getStorageSync("userId")));
const isSuperAdmin = computed(() => userType.value === 0);
// 2026-10-14 文档：页面与按钮只按接口 Shiro permission 控制，不再按 usertype 判断；身份条件仅用于行级数据归属（对齐 web）
const hasUpdatePerm = computed(() => hasPermission('operation:lead:update'));
const hasHandoffPerm = computed(() => hasPermission('operation:lead:handoff'));
const hasFollowupPerm = computed(() => hasPermission('operation:lead:followup'));

const leadId = ref<number | ''>('');
const detail = ref<any>(null);
const fetchedAt = ref<number>(Date.now());

function originLabel(v: any) { return leadOriginTypeMap[v] || v || '-'; }
function originColor(v: any) { return leadOriginTypeColorMap[v] || '#909399'; }
function processLabel(v: any) { return leadProcessStatusMap[v] || v || '-'; }
function processColor(v: any) { return leadProcessStatusColorMap[v] || '#909399'; }
function outcomeLabel(v: any) { return leadOutcomeStatusMap[v] || v || '-'; }
function outcomeColor(v: any) { return leadOutcomeStatusColorMap[v] || '#909399'; }
function handoffStatusLabel(v: any) { return handoffStatusMap[v] || v || '-'; }
function handoffColor(v: any) { return handoffStatusColorMap[v] || '#909399'; }
function handoffDotColor(v: any) { return v === 'ACCEPTED' ? '#52c41a' : v === 'PENDING' ? '#fa8c16' : v === 'REJECTED' ? '#f5222d' : '#c9cdd4'; }
function followupTypeLabel(v: any) { return followupTypeMap[v] || v || '-'; }
function showBool(v: any) { return v === true || Number(v) === 1 ? '是' : '否'; }
/** 疑似重复标签点击：展示审核备注或默认提示（对齐 web NTag tooltip 文案） */
function showDuplicateTip() {
    uni.showModal({
        title: '疑似重复',
        content: String(detail.value?.duplicate_review_remark || '客户名称相似或电话相同，待人工审核'),
        showCancel: false,
        confirmText: '知道了'
    });
}

/* ---------------- 详情加载 ---------------- */
async function getDetail() {
    if (!leadId.value) return;
    try {
        const res: any = await fetchLeadDetail(leadId.value);
        detail.value = res ?? null;
        fetchedAt.value = Date.now();
    } catch (err) {
        console.error('获取线索详情失败', err);
        detail.value = null;
    }
}

/* ---------------- 基础资料 cells ---------------- */
const baseCells = computed(() => {
    const d = detail.value;
    if (!d) return [];
    const cells: any[] = [
        { label: '来源类型', type: 'tag', value: originLabel(d.origin_type), tagColor: originColor(d.origin_type) },
        { label: '渠道', value: d.channel_code },
        { label: '发生时间', value: d.occurred_at }
    ];
    if (d.origin_type === 'EXHIBITION') {
        cells.push({ label: '展会', value: d.exhibition_id ? `#${d.exhibition_id}` : '' });
    }
    cells.push({ label: '来源说明', value: d.source_remark, preLine: true });
    if (d.origin_type === 'EXHIBITION') {
        cells.push({ label: '获客参展人', value: nameOf(d.exhibition_member_user_id) });
    }
    cells.push(
        { label: '客户名称', value: d.customer_name },
        { label: '联系人', value: d.contact_name },
        { label: '联系电话', type: 'copy', value: d.contact_phone },
        { label: '联系微信', type: 'copy', value: d.contact_wechat }
    );
    // 合同号（2026-10-14 一键成交回写）：有值才展示
    if (d.contract_no) cells.push({ label: '合同号', type: 'copy', value: d.contract_no });
    cells.push(
        { label: '老客户', value: showBool(d.old_customer) },
        { label: '已加微信', value: showBool(d.wechat_added) },
        { label: '创建人', value: nameOf(d.created_by) },
        { label: '来源人', value: nameOf(d.origin_user_id) },
        { label: '当前负责人', value: nameOf(d.current_owner_user_id) },
        { label: '待接收人', value: d.pending_receiver_user_id ? nameOf(d.pending_receiver_user_id) : '' },
        { label: '创建时间', value: d.created_at },
        { label: '更新时间', value: d.updated_at },
        { label: '咨询内容', value: d.consultation_content, preLine: true },
        // 最新结果状态/最新跟踪结果：与列表两列对应（web 详情跟踪结果取 latest_followup_summary）
        { label: '最新结果状态', type: 'tag', value: outcomeLabel(d.outcome_status), tagColor: outcomeColor(d.outcome_status) },
        { label: '最新跟踪结果', value: d.latest_followup_summary, preLine: true }
    );
    return cells;
});

/* ---------------- 操作资格（权限只按 Shiro 串；身份条件对齐 web 详情抽屉，后端仍会二次校验） ---------------- */
const pendingHandoff = computed(() => (detail.value?.handoffs || []).find((h: any) => h.status === 'PENDING'));
// 接收人列：待接收时看待接收人，否则看当前负责人（对齐 web isReceiverOrAdmin 取值口径）
const rowReceiverId = computed(() => String(detail.value?.pending_receiver_user_id ?? detail.value?.current_owner_user_id ?? ''));
const isReceiverOrAdmin = computed(() => isSuperAdmin.value || rowReceiverId.value === currentUserId.value);
// 数据归属：超管 / 创建人 / 接收人列（对齐 web canOwnRow）
const canOwnRow = computed(() =>
    isSuperAdmin.value || String(detail.value?.created_by) === currentUserId.value || rowReceiverId.value === currentUserId.value);
const canOperate = computed(() => !!detail.value && hasUpdatePerm.value);
// 已结束线索不能修改；存在待接收交接时修改/删除均不可用（对齐 web canEditRow/canDeleteRow）
const canEdit = computed(() =>
    canOperate.value && canOwnRow.value &&
    detail.value?.process_status !== 'FINISHED' && !detail.value?.pending_receiver_user_id);
const canDelete = computed(() =>
    canOperate.value && canOwnRow.value && !detail.value?.pending_receiver_user_id);
const canCreateHandoff = computed(() =>
    !!detail.value && hasHandoffPerm.value && isReceiverOrAdmin.value &&
    detail.value.process_status !== 'FINISHED' && !pendingHandoff.value);
const canAccept = computed(() =>
    hasHandoffPerm.value && !!pendingHandoff.value &&
    String(pendingHandoff.value?.to_user_id ?? '') === currentUserId.value);
const canReject = computed(() => canAccept.value);
const canCancelHandoff = computed(() =>
    !!detail.value && hasHandoffPerm.value && !!pendingHandoff.value &&
    (String(pendingHandoff.value?.from_user_id ?? '') === currentUserId.value || isSuperAdmin.value));
// 跟进资格：跟进权限 + 接收人列是本人（或超管）；待接收状态阻断（对齐 web canAddFollowup）
const canAddFollowup = computed(() =>
    !!detail.value && hasFollowupPerm.value && isReceiverOrAdmin.value &&
    detail.value.process_status !== 'FINISHED' && !pendingHandoff.value);

/* ---------------- 复制 ---------------- */
function copyText(text: string) {
    if (!text) return;
    uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制', icon: 'none' }) });
}

/* ---------------- 接收 ---------------- */
const actionLoading = ref(false);
async function handleAccept() {
    if (!pendingHandoff.value || actionLoading.value) return;
    actionLoading.value = true;
    try {
        await fetchHandoffAccept({ handoffId: pendingHandoff.value.id });
        uni.showToast({ title: '已接收，你成为该线索的当前负责人', icon: 'none' });
        await getDetail();
        uni.$emit('refreshOpLeadList');
    } finally {
        actionLoading.value = false;
    }
}

/* ---------------- 拒绝 / 取消交接 ---------------- */
const actionModalVisible = ref(false);
const actionModalMode = ref<'reject' | 'cancel'>('reject');
const actionRemark = ref('');
function openActionModal(mode: 'reject' | 'cancel') {
    actionModalMode.value = mode;
    actionRemark.value = '';
    actionModalVisible.value = true;
}
async function submitActionModal() {
    if (!actionRemark.value.trim()) {
        uni.showToast({ title: actionModalMode.value === 'reject' ? '请填写拒绝原因' : '请填写取消原因', icon: 'none' });
        return;
    }
    if (!pendingHandoff.value || actionLoading.value) return;
    actionLoading.value = true;
    try {
        if (actionModalMode.value === 'reject') {
            await fetchHandoffReject({ handoffId: pendingHandoff.value.id, remark: actionRemark.value.trim() });
            uni.showToast({ title: '已拒绝，负责人保持不变', icon: 'none' });
        } else {
            await fetchHandoffCancel({ handoffId: pendingHandoff.value.id, remark: actionRemark.value.trim() });
            uni.showToast({ title: '已取消交接，负责人保持不变', icon: 'none' });
        }
        actionModalVisible.value = false;
        await getDetail();
        uni.$emit('refreshOpLeadList');
    } finally {
        actionLoading.value = false;
    }
}

/* ---------------- 一键成交（对齐 web 详情头部成交按钮 + 合同号弹窗） ---------------- */
const canDeal = computed(() =>
    !!detail.value && hasUpdatePerm.value && detail.value.outcome_status !== 'DEAL' &&
    !detail.value.pending_receiver_user_id &&
    (isSuperAdmin.value || String(detail.value.pending_receiver_user_id ?? detail.value.current_owner_user_id) === currentUserId.value));
const dealVisible = ref(false);
const dealContractNumber = ref('');
const dealSubmitting = ref(false);
function openDeal() {
    // 回填已有合同号，便于修改确认
    dealContractNumber.value = String(detail.value?.contract_no || '');
    dealVisible.value = true;
}
async function saveDeal() {
    if (!detail.value || dealSubmitting.value) return;
    const contractNumber = String(dealContractNumber.value || '').replace(/\s/g, '');
    if (!contractNumber) {
        uni.showToast({ title: '请填写合同号（必填）', icon: 'none' });
        return;
    }
    if (contractNumber.length > 100) {
        uni.showToast({ title: '合同号不能超过 100 个字符', icon: 'none' });
        return;
    }
    dealSubmitting.value = true;
    try {
        await fetchLeadConfirmDeal({ leadId: Number(leadId.value), contractNumber });
        uni.showToast({ title: '已成交', icon: 'none' });
        dealVisible.value = false;
        await getDetail();
        uni.$emit('refreshOpLeadList');
    } finally {
        dealSubmitting.value = false;
    }
}

/* ---------------- 发起交接（独立整页 lead/handoff） ---------------- */
function goHandoffPage() {
    uni.navigateTo({
        url: '/mePages/operationSales/lead/handoff?id=' + leadId.value + '&name=' + encodeURIComponent(detail.value?.customer_name || '')
    });
}

/* ---------------- 添加跟进（独立整页 lead/followup） ---------------- */
// 待接收状态阻断添加跟进（对齐 web followupBlockedByHandoff）
const followupBlockedByHandoff = computed(() =>
    !!detail.value && hasFollowupPerm.value && isReceiverOrAdmin.value &&
    detail.value.process_status !== 'FINISHED' && !!pendingHandoff.value);
function goFollowupPage() {
    uni.navigateTo({
        url: '/mePages/operationSales/lead/followup?id=' + leadId.value
    });
}
/** 时间线跟进图片预览（多图支持左右滑动） */
function previewFollowupImg(list: any[], index: number) {
    uni.previewImage({ urls: (list || []).map((img: any) => img.furl), current: index });
}

/* ---------------- 编辑 / 删除 ---------------- */
function handleEdit() { uni.navigateTo({ url: '/mePages/operationSales/lead/form?id=' + leadId.value + '&mode=edit' }); }
function handleDelete() {
    if (!detail.value) return;
    if (detail.value.pending_receiver_user_id) {
        uni.showToast({ title: '存在待接收交接，请先取消/处理交接后再删除', icon: 'none' });
        return;
    }
    uni.showModal({
        title: '确认删除线索？',
        content: `删除后「${detail.value.customer_name || '#' + leadId.value}」将从列表和详情中消失；交接与跟进历史仍在系统保留。该操作不可恢复，请谨慎确认。`,
        confirmText: '确认删除',
        cancelText: '再想想',
        success: async (r: any) => {
            if (!r.confirm) return;
            try {
                const { fetchLeadDelete } = await import('@/service/operationSales');
                await fetchLeadDelete(leadId.value);
                uni.showToast({ title: '线索已删除', icon: 'none' });
                uni.$emit('refreshOpLeadList');
                setTimeout(() => uni.navigateBack(), 600);
            } catch (err) {
                console.error('删除线索失败', err);
            }
        }
    });
}

function handleClickLeft() { uni.navigateBack(); }
onLoad((options: any) => { leadId.value = options?.id ? Number(options.id) : ''; });
onShow(() => { getDetail(); });
onMounted(() => { loadUserMap(); });
onUnload(() => { });
onUnmounted(() => { });
</script>
<style lang="scss" scoped>
.topFixedWrap {
    background-color: #fff;
}

.nav-right-text {
    font-size: 28rpx;
}

.status-card {
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.cust-row {
    display: flex;
    align-items: center;
}

.cust-name {
    font-size: 34rpx;
    font-weight: 600;
    line-height: 48rpx;
    word-break: break-all;
}

.tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 16rpx;
}

.owner-row {
    font-size: 26rpx;
    margin-top: 16rpx;
}

.pending-alert {
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.pending-text {
    font-size: 26rpx;
    line-height: 40rpx;
}

.pending-actions {
    display: flex;
    gap: 16rpx;
    margin-top: 16rpx;
}

.section-card {
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
}

.section-title {
    font-size: 30rpx;
    font-weight: 600;
    margin-bottom: 12rpx;
}

.section-head .section-title {
    margin-bottom: 0;
}

.cell {
    display: flex;
    padding: 14rpx 0;
    border-bottom: 2rpx solid rgba(128, 128, 128, 0.08);
}

.cell:last-child {
    border-bottom: none;
}

.cell-label {
    width: 170rpx;
    flex-shrink: 0;
    font-size: 26rpx;
    line-height: 40rpx;
}

.cell-value-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12rpx;
}

.cell-value {
    font-size: 26rpx;
    line-height: 40rpx;
    word-break: break-all;
}

.copy-wrap {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12rpx;
}

.plain-wrap {
    display: block;
    width: 100%;
}

.copy-btn {
    font-size: 24rpx;
    color: #1677ff;
    padding: 2rpx 16rpx;
    border: 2rpx solid #1677ff;
    border-radius: 20rpx;
}

.mini-tag {
    padding: 4rpx 14rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    white-space: nowrap;
}

.empty-line {
    font-size: 26rpx;
    text-align: center;
    padding: 30rpx 0;
}

.tl {
    padding-left: 6rpx;
}

.tl-item {
    position: relative;
    display: flex;
    padding-bottom: 28rpx;

    &:last-child {
        padding-bottom: 6rpx;
    }
}

.tl-dot {
    width: 18rpx;
    height: 18rpx;
    border-radius: 50%;
    margin-top: 8rpx;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

.tl-item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 7rpx;
    top: 26rpx;
    bottom: 0;
    width: 3rpx;
    background: rgba(128, 128, 128, 0.15);
}

.tl-body {
    flex: 1;
    min-width: 0;
    margin-left: 18rpx;
}

.tl-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12rpx;
}

.tl-user {
    font-size: 26rpx;
    font-weight: 500;
}

.tl-line {
    font-size: 25rpx;
    line-height: 38rpx;
    margin-top: 6rpx;
    word-break: break-all;
}

.tl-time {
    font-size: 22rpx;
    color: #999;
    margin-top: 6rpx;
}

/* 跟进时间线图片缩略：平铺展示，点击预览大图 */
.tl-imgs {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
    margin-top: 10rpx;
}

.tl-img {
    width: 128rpx;
    height: 128rpx;
    border-radius: 10rpx;
    display: block;
    border: 2rpx solid rgba(144, 144, 144, 0.25);
}

/* 待接收阻断添加跟进的提示文案 */
.blocked-hint {
    font-size: 24rpx;
    white-space: nowrap;
}

.pre-line {
    white-space: pre-line;
}

.popup-body {
    padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
}

.popup-title {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
}

.popup-tip {
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 24rpx;
    line-height: 36rpx;
    margin-bottom: 20rpx;
}

.op-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 140rpx;
    background: rgba(128, 128, 128, 0.08);
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 26rpx;
    margin-bottom: 20rpx;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    margin-top: 10rpx;
}

/* 一键成交弹窗：字段标签与合同号输入框 */
.popup-field-label {
    font-size: 25rpx;
    margin: 8rpx 0 10rpx;
}

.op-input {
    width: 100%;
    box-sizing: border-box;
    height: 72rpx;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
    margin-bottom: 20rpx;
}

:deep(.whiteClass) {
    color: #6a6a6a;
}

:deep(.greyClass) {
    color: #c0c4cc;
}
</style>
