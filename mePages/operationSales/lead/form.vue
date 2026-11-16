<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow :title="isEdit ? '修改线索' : '新建线索'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view style="padding: 20rpx;">
            <!-- 运营提示 -->
            <view v-if="!isEdit && userType === 12" class="form-tip" :style="{ background: isDark ? 'rgba(22, 119, 255, 0.12)' : '#e6f4ff', color: isDark ? '#69b1ff' : '#1677ff' }">
                运营创建线索必须选择有效销售负责人，创建后线索进入「待接收」，由对方接收后负责跟进
            </view>
            <view v-else-if="isEdit" class="form-tip" :style="{ background: isDark ? 'rgba(22, 119, 255, 0.12)' : '#e6f4ff', color: isDark ? '#69b1ff' : '#1677ff' }">
                仅可修改客户资料与联系信息；来源类型、展会关联、创建人/来源人/负责人、流程状态和跟进历史不能在此修改，已结束线索不可修改。
            </view>

            <view class="section-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <!-- 来源类型：编辑态只读展示 -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">来源类型<span v-if="isEdit">（不可修改）</span></view>
                <view v-if="isEdit" class="readonly-row">
                    <view class="mini-tag" :style="{ background: originColor(form.originType) + '1A', color: originColor(form.originType) }">{{ originLabel(form.originType) }}</view>
                </view>
                <view v-else class="chip-row">
                    <view v-for="opt in originTypeOptions" :key="opt.value" class="chip" :class="{ active: form.originType === opt.value }"
                        :style="form.originType === opt.value ? activeChipStyle : chipStyle" @click="handleOriginTypeChange(opt.value)">{{ opt.label }}</view>
                </view>

                <block v-if="!isExhibition">
                    <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">渠道</view>
                    <input class="form-input" v-model="form.channelCode" maxlength="50" placeholder="抖音、官网、手机等（可自定义输入）" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />
                    <view class="chip-row">
                        <view v-for="opt in channelPresetOptions" :key="opt.value" class="chip small" :class="{ active: form.channelCode === opt.value }"
                            :style="form.channelCode === opt.value ? activeChipStyle : chipStyle" @click="form.channelCode = opt.value">{{ opt.label }}</view>
                    </view>

                    <block v-if="!isEdit">
                        <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">线索提供人</view>
                        <picker mode="selector" :range="originUserOptions" range-key="username" @change="handleOriginUserPick">
                            <view class="picker-value" :class="{ placeholder: !form.originUserId }" :style="pickerBgStyle">
                                {{ originUserName || '默认当前登录人' }}
                            </view>
                        </picker>
                    </block>
                </block>

                <block v-else-if="!isEdit">
                    <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">展会（必选）</view>
                    <picker mode="selector" :range="exhibitionOptions" range-key="exhibition_name" @change="handleExhibitionPick">
                        <view class="picker-value" :class="{ placeholder: !form.exhibitionId }" :style="pickerBgStyle">
                            {{ exhibitionName || '请选择展会' }}
                        </view>
                    </picker>
                    <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">获客参展人（必选）</view>
                    <picker mode="selector" :range="memberOptions" range-key="username" :disabled="!form.exhibitionId" @change="handleMemberPick">
                        <view class="picker-value" :class="{ placeholder: !form.exhibitionMemberUserId }" :style="pickerBgStyle">
                            {{ memberName || (form.exhibitionId ? '实际获客的参展人（仅该展会参展人可选）' : '请先选择展会') }}
                        </view>
                    </picker>
                </block>

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">客户名称（必填）</view>
                <input class="form-input" v-model="form.customerName" maxlength="255" placeholder="必填" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />

                <block v-if="!isEdit">
                    <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">期望负责人{{ ownerRequired ? '（必选：有效销售）' : '（默认本人，可选其他销售）' }}</view>
                    <picker mode="selector" :range="salesOptions" range-key="username" @change="handleOwnerPick">
                        <view class="picker-value" :class="{ placeholder: !form.desiredOwnerUserId }" :style="pickerBgStyle">
                            {{ ownerName || (ownerRequired ? '必选：有效销售' : '默认本人，可选其他销售') }}
                        </view>
                    </picker>
                </block>

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">联系人</view>
                <input class="form-input" v-model="form.contactName" maxlength="100" placeholder="选填" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">发生时间</view>
                <wd-datetime-picker type="datetime" v-model="occurredTs" :default-value="Date.now()" @confirm="onOccurredConfirm">
                    <view class="picker-value" :style="pickerBgStyle">
                        <text :class="{ placeholder: !form.occurredAt }">{{ form.occurredAt || '选填' }}</text>
                        <text v-if="form.occurredAt" class="clear-inline" @click.stop="clearOccurred">×</text>
                    </view>
                </wd-datetime-picker>

                <view class="half-row">
                    <view class="half-col">
                        <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">联系电话</view>
                        <input class="form-input" v-model="form.contactPhone" maxlength="100" placeholder="选填，仅详情页可见" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />
                    </view>
                    <view class="half-col">
                        <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">联系微信</view>
                        <input class="form-input" v-model="form.contactWechat" maxlength="100" placeholder="选填，仅详情页可见" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />
                    </view>
                </view>

                <view class="chip-row" style="margin-top: 16rpx;">
                    <view class="chip" :class="{ active: form.oldCustomer }" :style="form.oldCustomer ? activeChipStyle : chipStyle" @click="form.oldCustomer = !form.oldCustomer">是老客户</view>
                    <view class="chip" :class="{ active: form.wechatAdded }" :style="form.wechatAdded ? activeChipStyle : chipStyle" @click="form.wechatAdded = !form.wechatAdded">已添加微信</view>
                </view>

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">咨询内容</view>
                <textarea class="form-textarea" v-model="form.consultationContent" maxlength="2000" placeholder="客户需求描述（选填）" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />

                <block v-if="!isExhibition">
                    <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">来源说明</view>
                    <textarea class="form-textarea" v-model="form.sourceRemark" maxlength="500" placeholder="来源补充说明（选填）" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />
                </block>
            </view>

            <wd-button block type="primary" :disabled="submitting || editLoading" @click="handleSubmit">{{ isEdit ? '确认修改' : '确认创建' }}</wd-button>
            <view style="height: 40rpx;"></view>
        </view>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchExhibitionList, fetchExhibitionDetail, fetchLeadCreate, fetchLeadDetail, fetchLeadUpdate } from "@/service/operationSales";
import { useOpUserMap, fetchActiveUsers } from "../user-map";
import { formatTs } from "../constants";
import { leadOriginTypeMap, leadOriginTypeColorMap, channelPresetOptions } from "../constants";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const { nameOf, load: loadUserMap } = useOpUserMap();

const userType = computed(() => Number(uni.getStorageSync("usertype")));
const currentUserId = computed(() => String(uni.getStorageSync("userId")));

const isEdit = ref(false);
const editLoading = ref(false);
const submitting = ref(false);
const leadId = ref<number | ''>('');

function originLabel(v: any) { return leadOriginTypeMap[v] || v || '-'; }
function originColor(v: any) { return leadOriginTypeColorMap[v] || '#909399'; }
// 'yyyy-MM-dd HH:mm:ss' → 时间戳（iOS 需把 - 换成 /）
function parseTs(s: any): number {
    if (!s) return 0;
    const n = Date.parse(String(s).replace(/-/g, '/'));
    return Number.isFinite(n) ? n : 0;
}

/* ---------------- 表单 ---------------- */
const form = ref<any>({
    originType: 'OTHER',
    channelCode: '',
    sourceRemark: '',
    originUserId: null as any,
    desiredOwnerUserId: null as any,
    exhibitionId: null as any,
    exhibitionMemberUserId: null as any,
    customerName: '',
    contactName: '',
    contactPhone: '',
    contactWechat: '',
    consultationContent: '',
    oldCustomer: false,
    wechatAdded: false,
    occurredAt: ''
});
const occurredTs = ref<number>(Date.now());

const isExhibition = computed(() => form.value.originType === 'EXHIBITION');
/** 运营创建必须指定有效销售负责人，线索不能留在运营名下 */
const ownerRequired = computed(() => userType.value === 12);
// 可选来源按人员类型约束：运营不建销售自拓，销售不建运营提供
const originTypeOptions = computed(() => {
    const types =
        userType.value === 12
            ? ['OPERATION', 'EXHIBITION', 'OTHER']
            : userType.value === 1
                ? ['SALES_SELF', 'EXHIBITION', 'OTHER']
                : ['OPERATION', 'EXHIBITION', 'SALES_SELF', 'OTHER'];
    return types.map(v => ({ label: leadOriginTypeMap[v], value: v }));
});
const defaultOriginType = () => (userType.value === 12 ? 'OPERATION' : userType.value === 1 ? 'SALES_SELF' : 'OTHER');

const chipStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#f5f5f5', color: isDark.value ? '#c9cdd4' : '#4e5969' }));
const activeChipStyle = computed(() => ({ background: isDark.value ? 'rgba(22, 119, 255, 0.3)' : '#e6f4ff', color: isDark.value ? '#69b1ff' : '#1677ff', borderColor: isDark.value ? '#69b1ff' : '#1677ff' }));
const inputStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#f5f5f5', color: isDark.value ? '#e8e8e8' : '#333' }));
const pickerBgStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#f5f5f5' }));

/* ---------------- 候选数据 ---------------- */
const salesOptions = ref<any[]>([]);
const exhibitionOptions = ref<any[]>([]);
const memberOptions = ref<any[]>([]);
const originUserOptions = ref<any[]>([]);

async function loadSales() {
    try { salesOptions.value = await fetchActiveUsers('1'); } catch (err) { console.error('获取销售列表失败', err); }
}
async function loadOriginUsers() {
    try { originUserOptions.value = await fetchActiveUsers('0,1,12'); } catch (err) { console.error('获取人员列表失败', err); }
}
async function loadExhibitions() {
    try {
        const res: any = await fetchExhibitionList({ pageNum: 1, pageSize: 200 });
        exhibitionOptions.value = res?.list || [];
    } catch (err) { console.error('获取展会列表失败', err); }
}
async function loadMembers(exhibitionId: any) {
    memberOptions.value = [];
    if (!exhibitionId) return;
    try {
        const res: any = await fetchExhibitionDetail(exhibitionId);
        memberOptions.value = (res?.members || []).map((m: any) => ({ username: m.username, id: m.user_id }));
    } catch (err) { console.error('获取展会参展人失败', err); }
}

const originUserName = computed(() => {
    const id = form.value.originUserId;
    if (id == null || id === '') return '';
    return originUserOptions.value.find((u: any) => String(u.id) === String(id))?.username || nameOf(id);
});
const ownerName = computed(() => {
    const id = form.value.desiredOwnerUserId;
    if (id == null) return '';
    return salesOptions.value.find((u: any) => String(u.id) === String(id))?.username || nameOf(id);
});
const exhibitionName = computed(() => exhibitionOptions.value.find((e: any) => String(e.id) === String(form.value.exhibitionId))?.exhibition_name || '');
const memberName = computed(() => memberOptions.value.find((u: any) => String(u.id) === String(form.value.exhibitionMemberUserId))?.username || '');

// 原生 picker：e.detail.value 为选中项下标
function handleOriginUserPick(e: any) {
    const u = originUserOptions.value[Number(e.detail.value)];
    if (u) form.value.originUserId = u.id;
}
function handleOwnerPick(e: any) {
    const u = salesOptions.value[Number(e.detail.value)];
    if (u) form.value.desiredOwnerUserId = u.id;
}
function handleExhibitionPick(e: any) {
    const ex = exhibitionOptions.value[Number(e.detail.value)];
    if (!ex) return;
    // 展会切换：获客人重置并加载该展会参展人
    form.value.exhibitionId = ex.id;
    form.value.exhibitionMemberUserId = null;
    loadMembers(ex.id);
}
function handleMemberPick(e: any) {
    if (!form.value.exhibitionId) return;
    const u = memberOptions.value[Number(e.detail.value)];
    if (u) form.value.exhibitionMemberUserId = u.id;
}
// 来源切换：切到非展会时必须清空两个展会关联字段（后端会拒绝残留）
function handleOriginTypeChange(value: string) {
    form.value.originType = value;
    if (value !== 'EXHIBITION') {
        form.value.exhibitionId = null;
        form.value.exhibitionMemberUserId = null;
        memberOptions.value = [];
    }
}
function onOccurredConfirm({ value }: any) { form.value.occurredAt = formatTs(value, true); }
function clearOccurred() { form.value.occurredAt = ''; }

/* ---------------- 编辑回填 ---------------- */
async function initEdit(id: number) {
    editLoading.value = true;
    try {
        const d: any = await fetchLeadDetail(id);
        if (!d) {
            uni.navigateBack();
            return;
        }
        // 来源类型、展会关联、人员归属、状态和跟进历史不能修改，仅用于控制字段显隐
        form.value = {
            originType: d.origin_type,
            channelCode: d.channel_code || '',
            sourceRemark: d.source_remark || '',
            originUserId: d.origin_user_id ?? null,
            desiredOwnerUserId: d.current_owner_user_id ?? null,
            exhibitionId: d.exhibition_id ?? null,
            exhibitionMemberUserId: d.exhibition_member_user_id ?? null,
            customerName: d.customer_name || '',
            contactName: d.contact_name || '',
            contactPhone: d.contact_phone || '',
            contactWechat: d.contact_wechat || '',
            consultationContent: d.consultation_content || '',
            // 响应布尔可能为数据库数值 1/0
            oldCustomer: Number(d.old_customer) === 1 || d.old_customer === true,
            wechatAdded: Number(d.wechat_added) === 1 || d.wechat_added === true,
            occurredAt: d.occurred_at || ''
        };
        occurredTs.value = parseTs(d.occurred_at) || Date.now();
    } catch (err) {
        console.error('获取线索详情失败', err);
        uni.navigateBack();
    } finally {
        editLoading.value = false;
    }
}

/* ---------------- 提交 ---------------- */
async function handleSubmit() {
    if (submitting.value || editLoading.value) return;
    const m = form.value;
    if (!String(m.customerName || '').trim()) {
        uni.showToast({ title: '请填写客户名称', icon: 'none' });
        return;
    }
    if (!isEdit.value) {
        if (m.originType === 'EXHIBITION') {
            if (!m.exhibitionId) { uni.showToast({ title: '请选择展会', icon: 'none' }); return; }
            if (!m.exhibitionMemberUserId) { uni.showToast({ title: '请选择实际获客的参展人', icon: 'none' }); return; }
        }
        if (ownerRequired.value && !m.desiredOwnerUserId) {
            uni.showToast({ title: '运营创建必须选择有效销售负责人', icon: 'none' });
            return;
        }
    }
    submitting.value = true;
    try {
        if (isEdit.value) {
            /**
             * 修改线索为完整资料更新而非局部 PATCH：
             * 未传可选文本字段会被清空、未传布尔按 false 保存，因此先取详情回填全部字段后整体提交。
             */
            await fetchLeadUpdate({
                id: leadId.value,
                channelCode: isExhibition.value ? null : (m.channelCode || null),
                sourceRemark: isExhibition.value ? null : (m.sourceRemark || null),
                customerName: String(m.customerName).trim(),
                contactName: m.contactName || null,
                contactPhone: m.contactPhone || null,
                contactWechat: m.contactWechat || null,
                consultationContent: m.consultationContent || null,
                oldCustomer: !!m.oldCustomer,
                wechatAdded: !!m.wechatAdded,
                // occurredAt 不传时后端保留原值；清空日期等同不修改
                occurredAt: m.occurredAt || undefined
            });
            uni.showToast({ title: '线索已修改', icon: 'none' });
        } else {
            const payload: any = {
                originType: m.originType,
                sourceRemark: m.sourceRemark || undefined,
                customerName: String(m.customerName).trim(),
                contactName: m.contactName || undefined,
                contactPhone: m.contactPhone || undefined,
                contactWechat: m.contactWechat || undefined,
                consultationContent: m.consultationContent || undefined,
                oldCustomer: !!m.oldCustomer,
                wechatAdded: !!m.wechatAdded,
                occurredAt: m.occurredAt || undefined
            };
            if (m.originType === 'EXHIBITION') {
                // 展会来源：来源人由获客参展人自动带出，显式传值也必须一致
                payload.exhibitionId = m.exhibitionId;
                payload.exhibitionMemberUserId = m.exhibitionMemberUserId;
                payload.originUserId = m.exhibitionMemberUserId;
            } else {
                payload.channelCode = m.channelCode || undefined;
                payload.originUserId = m.originUserId ?? undefined;
            }
            if (m.desiredOwnerUserId) payload.desiredOwnerUserId = m.desiredOwnerUserId;
            await fetchLeadCreate(payload);
            // 指定负责人不是当前用户时提示等待接收，不能提示"已归属"
            if (m.desiredOwnerUserId && String(m.desiredOwnerUserId) !== currentUserId.value) {
                uni.showToast({ title: `已发送给「${ownerName.value}」，等待对方接收`, icon: 'none' });
            } else {
                uni.showToast({ title: '创建成功', icon: 'none' });
            }
        }
        uni.$emit('refreshOpLeadList');
        setTimeout(() => uni.navigateBack(), 600);
    } finally {
        submitting.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }
onLoad((options: any) => {
    loadUserMap();
    loadSales();
    loadOriginUsers();
    if (options?.id) {
        isEdit.value = true;
        leadId.value = Number(options.id);
        initEdit(leadId.value);
    } else {
        isEdit.value = false;
        form.value.originType = defaultOriginType();
        form.value.originUserId = uni.getStorageSync('userId') ?? null;
        // 销售默认负责人为本人，可改为其他有效销售；运营必选销售；超管默认不选
        form.value.desiredOwnerUserId = userType.value === 1 ? (uni.getStorageSync('userId') ?? null) : null;
        loadExhibitions();
    }
});
onMounted(() => { });
</script>
<style lang="scss" scoped>
.topFixedWrap {
    background-color: #fff;
}

.form-tip {
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 24rpx;
    line-height: 36rpx;
    margin-bottom: 20rpx;
}

.section-card {
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.form-label {
    font-size: 25rpx;
    margin: 16rpx 0 10rpx;

    &:first-child {
        margin-top: 0;
    }
}

.form-input {
    width: 100%;
    box-sizing: border-box;
    height: 76rpx;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
}

.form-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 120rpx;
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 26rpx;
}

.picker-value {
    position: relative;
    padding: 18rpx 20rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    word-break: break-all;
}

.readonly-row {
    display: flex;
}

.mini-tag {
    padding: 4rpx 14rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    white-space: nowrap;
}

.placeholder {
    color: #bbb;
}

.clear-inline {
    position: absolute;
    right: 24rpx;
    top: 50%;
    transform: translateY(-50%);
    font-size: 34rpx;
    color: #999;
    padding: 0 8rpx;
}

.chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
    margin-top: 12rpx;
}

.chip {
    padding: 10rpx 26rpx;
    border-radius: 28rpx;
    font-size: 25rpx;
    border: 2rpx solid transparent;

    &.small {
        padding: 6rpx 20rpx;
        font-size: 23rpx;
    }
}

.half-row {
    display: flex;
    gap: 20rpx;
}

.half-col {
    flex: 1;
    min-width: 0;
}
</style>
