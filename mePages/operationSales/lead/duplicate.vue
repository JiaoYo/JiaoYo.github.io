<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow title="疑似重复线索审核" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <view class="summary-bar">
                <view class="summary-chip" :style="{ background: isDark ? '#3a3a3a' : '#f7f8fa', color: isDark ? '#8a9099' : '#4e5969' }">
                    <text class="summary-dot"></text>
                    <text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#fa8c16' : '#d46b08' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#fa8c16' : '#d46b08' }">{{ total }}</text> 条</text>
                </view>
            </view>
        </view>

        <!-- 规则提示（对齐 web NAlert 文案） -->
        <view class="rule-tip" :style="{ background: isDark ? 'rgba(250, 140, 22, 0.12)' : '#fff7e6', color: isDark ? '#fa8c16' : '#d46b08' }">
            客户名称包含/被包含或规范化电话相同的新线索会被标记为疑似重复；请人工核对后审核：确认重复需选择目标线索（该疑似记录将被删除），确认非重复后恢复正常统计。
        </view>

        <view v-if="dataList.length > 0" style="margin: 0 20rpx 20rpx;">
            <view class="list-item" v-for="item in dataList" :key="item.id" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="item-header">
                    <view class="item-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">#{{ item.id }} {{ item.customer_name || '-' }}</view>
                    <view class="match-count" :style="{ color: matchCountColor(item), fontWeight: (Number(item.duplicate_match_count) || 0) > 1 ? '600' : '400' }">匹配 {{ matchCountText(item) }}</view>
                </view>
                <view class="item-info" :style="{ background: isDark ? '#1b1b1b' : '#fafafa' }">
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">发生日期：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ dateText(item.date) }}</text>
                    </view>
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">联系人：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.contact_name || '-' }}</text>
                    </view>
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">联系电话：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.contact_phone || '-' }}</text>
                    </view>
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">渠道：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.channel_code || '-' }}</text>
                    </view>
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">负责人：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ nameOf(item.current_owner_user_id) }}</text>
                    </view>
                </view>
                <view v-if="canReview" class="item-footer">
                    <wd-button size="small" type="primary" @click="openReview(item)">审核</wd-button>
                </view>
            </view>
            <wd-loadmore :state="state" @reload="getDataList" />
        </view>
        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20rpx', padding: '80rpx 0', background: isDark ? '#2a2a2a' : '#fff', borderRadius: '20rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无疑似重复线索" />
        </view>

        <!-- 人工审核弹窗 -->
        <wd-popup v-model="reviewVisible" position="bottom" custom-class="op-popup" :safe-area-inset-bottom="true">
            <view class="popup-body" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">疑似重复审核</view>
                <view v-if="reviewRow" class="review-line" :style="{ color: isDark ? '#8a9099' : '#999' }">
                    疑似线索：<text class="review-name" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ reviewRow.customer_name || '#' + reviewRow.id }}</text>
                    <text> {{ dateText(reviewRow.date) }} · {{ reviewRow.contact_phone || '无电话' }}</text>
                </view>
                <view class="chip-row">
                    <view class="chip" :style="reviewDuplicate ? activeErrorChipStyle : chipStyle" @click="reviewDuplicate = true">确认重复（该线索将被删除）</view>
                    <view class="chip" :style="!reviewDuplicate ? activeChipStyle : chipStyle" @click="reviewDuplicate = false">确认非重复（恢复正常统计）</view>
                </view>

                <!-- 确认重复：必须选择重复的目标线索（该疑似记录随后软删除） -->
                <block v-if="reviewDuplicate">
                    <view class="popup-field-label" :style="{ color: isDark ? '#8a9099' : '#999' }">重复的目标线索（必选）</view>
                    <view v-if="matchesLoading" class="empty-line" :style="{ color: isDark ? '#6a6a6a' : '#bbb' }">候选加载中…</view>
                    <view v-else-if="!normalizedMatches.length" class="info-tip" :style="{ background: isDark ? 'rgba(22, 119, 255, 0.12)' : '#e6f4ff', color: isDark ? '#69b1ff' : '#1677ff' }">
                        未取到匹配候选，无法确认重复；如确认无重复请改选「确认非重复」。
                    </view>
                    <view v-else class="match-list">
                        <view v-for="m in normalizedMatches" :key="m.id" class="match-item"
                            :style="{ background: targetLeadId === m.id ? (isDark ? 'rgba(22, 119, 255, 0.15)' : '#e6f4ff') : (isDark ? '#1b1b1b' : '#f7f8fa'), borderColor: targetLeadId === m.id ? '#1677ff' : 'transparent' }"
                            @click="targetLeadId = m.id">
                            <view class="radio-dot" :style="{ background: targetLeadId === m.id ? '#1677ff' : 'transparent', borderColor: targetLeadId === m.id ? '#1677ff' : (isDark ? '#6a6a6a' : '#c8c9cc') }"></view>
                            <view class="match-info">
                                <view class="match-name" :style="{ color: isDark ? '#e8e8e8' : '#333' }">#{{ m.id }} {{ m.customer_name || '-' }}</view>
                                <view class="match-sub" :style="{ color: isDark ? '#8a9099' : '#999' }">{{ m.contact_name ? m.contact_name + ' · ' : '' }}{{ m.contact_phone || '无电话' }}{{ matchReasonText(m.match_reason) ? '（' + matchReasonText(m.match_reason) + '）' : '' }}</view>
                            </view>
                        </view>
                    </view>
                </block>

                <view class="popup-field-label" :style="{ color: isDark ? '#8a9099' : '#999' }">审核备注（选填）</view>
                <textarea class="op-textarea" v-model="reviewRemark" maxlength="200" placeholder="如：客户名称相似或电话相同" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" :style="{ background: isDark ? '#1b1b1b' : 'rgba(128, 128, 128, 0.08)', color: isDark ? '#e8e8e8' : '#333' }" />

                <view class="popup-footer">
                    <wd-button size="small" type="info" plain @click="reviewVisible = false">取消</wd-button>
                    <wd-button size="small" :type="reviewDuplicate ? 'error' : 'primary'" :disabled="reviewSubmitting" @click="submitReview">{{ reviewDuplicate ? '确认重复' : '确认非重复' }}</wd-button>
                </view>
            </view>
        </wd-popup>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { onReady, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { hasPermission } from "@/utils/index";
import { fetchLeadDuplicateList, fetchLeadDuplicateReview, fetchLeadDetail } from "@/service/operationSales";
import { useOpUserMap } from "../user-map";
import { leadDuplicateMatchReasonMap } from "../constants";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const { nameOf, load: loadUserMap } = useOpUserMap();

/**
 * 疑似重复线索列表与人工审核（2026-10-14 文档，web lead-duplicate-modal 整页移植）
 * 列表 GET /operation/lead/duplicate/list.do（operation:lead:select）；
 * 审核 POST /operation/lead/duplicate/review.do（operation:lead:update）：
 * 确认重复必须选目标线索（疑似记录随后软删除）；确认非重复状态改 CONFIRMED_UNIQUE。
 */
const canReview = computed(() => hasPermission('operation:lead:update'));

/** 列表返回字段全为 string，date 取 yyyy-MM-dd 展示 */
function dateText(v: any) { return String(v || '').slice(0, 10) || '-'; }
function matchCountText(row: any) {
    const n = Number(row.duplicate_match_count) || 0;
    return n > 0 ? String(n) : '-';
}
function matchCountColor(row: any) {
    // 匹配数 >1 琥珀色提醒（对齐 web c-#f59e0b）
    return (Number(row.duplicate_match_count) || 0) > 1 ? '#f59e0b' : (isDark.value ? '#8a9099' : '#999');
}

/* ---------------- 疑似重复列表 ---------------- */
const topFixedHeight = ref(0);
const dataList = ref<any[]>([]);
const total = ref(0);
const listLoading = ref(false);
const state = ref<'loading' | 'finished' | 'error'>('loading');
const model = ref<any>({ page: 1 });

async function getDataList() {
    if (listLoading.value) return;
    listLoading.value = true;
    state.value = 'loading';
    try {
        const res: any = await fetchLeadDuplicateList({ pageNum: model.value.page, pageSize: 20 });
        const list = res?.list || res?.records || (Array.isArray(res) ? res : []);
        if (model.value.page === 1) {
            dataList.value = [];
        }
        dataList.value = dataList.value.concat(list);
        total.value = Number(res?.total ?? dataList.value.length) || 0;
        state.value = dataList.value.length >= total.value ? 'finished' : 'loading';
    } catch (err) {
        console.error('获取疑似重复列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }
function refreshList() { model.value.page = 1; getDataList(); }
// 固定头部（导航+汇总条）高度撑起占位，防止内容顶入头部之下
function recalcTopFixedHeight() { uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => { if (rect && rect.height !== undefined) topFixedHeight.value = rect.height; if (topFixedHeight.value === 0) topFixedHeight.value = 180; }).exec(); }
onReady(() => { recalcTopFixedHeight(); });
onPullDownRefresh(() => { refreshList(); setTimeout(() => { uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (!listLoading.value && dataList.value.length < total.value) { model.value.page++; getDataList(); } else if (dataList.value.length >= total.value) { state.value = 'finished'; } });
onMounted(() => {
    loadUserMap();
    getDataList();
});
onUnmounted(() => { });

/* ---------------- 人工审核 ---------------- */
const reviewVisible = ref(false);
const reviewSubmitting = ref(false);
const reviewRow = ref<any>(null);
const reviewDuplicate = ref(true);
const reviewRemark = ref('');
/** 匹配到的已有线索（确认重复时的目标候选）：列表行仅有 duplicate_match_count，打开审核时从详情 duplicate_matches 获取 */
const matches = ref<any[]>([]);
const matchesLoading = ref(false);
const targetLeadId = ref<number | null>(null);

const chipStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#f5f5f5', color: isDark.value ? '#c9cdd4' : '#4e5969' }));
const activeChipStyle = computed(() => ({ background: isDark.value ? 'rgba(22, 119, 255, 0.3)' : '#e6f4ff', color: isDark.value ? '#69b1ff' : '#1677ff', borderColor: isDark.value ? '#69b1ff' : '#1677ff' }));
const activeErrorChipStyle = computed(() => ({ background: isDark.value ? 'rgba(245, 34, 45, 0.25)' : '#fff1f0', color: isDark.value ? '#ff7875' : '#f5222d', borderColor: isDark.value ? '#ff7875' : '#f5222d' }));

/** 匹配项目标线索 ID 解析：详情 duplicate_matches 实际字段为 matched_lead_id，另兼容其他常见命名兜底；解析失败返回 null，绝不产生 NaN */
function matchLeadId(m: any): number | null {
    if (m == null) return null;
    const obj = typeof m === 'object' ? m : { id: m };
    const raw = obj.matched_lead_id ?? obj.lead_id ?? obj.target_lead_id ?? obj.match_lead_id ?? obj.leadId ?? obj?.lead?.id ?? obj.id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}
/** 匹配原因展示（后端 match_reason 枚举，未知值原样展示） */
function matchReasonText(v: any) { return v ? leadDuplicateMatchReasonMap[String(v)] || String(v) : ''; }
/** 归一化候选列表：仅保留能解析出 ID 的项；保证单选 value 必为有限数字（NaN 会使单选永远无法选中） */
const normalizedMatches = computed(() =>
    matches.value
        .map((m: any) => {
            const obj = typeof m === 'object' ? m : {};
            return {
                id: matchLeadId(m),
                customer_name: obj.customer_name || obj.customerName || '',
                contact_name: obj.contact_name || obj.contactName || '',
                contact_phone: obj.contact_phone || obj.contactPhone || '',
                match_reason: obj.match_reason || ''
            };
        })
        .filter((x: any) => x.id != null)
);

async function openReview(row: any) {
    reviewRow.value = row;
    reviewDuplicate.value = true;
    reviewRemark.value = '';
    matches.value = Array.isArray(row.duplicate_matches) ? row.duplicate_matches : [];
    targetLeadId.value = matchLeadId(matches.value[0]);
    reviewVisible.value = true;
    if (!matches.value.length) {
        matchesLoading.value = true;
        try {
            const res: any = await fetchLeadDetail(row.id);
            matches.value = res?.duplicate_matches || [];
            if (targetLeadId.value == null) {
                targetLeadId.value = matchLeadId(matches.value[0]);
            }
        } catch (err) {
            console.error('获取匹配候选失败', err);
        } finally {
            matchesLoading.value = false;
        }
    }
}

async function submitReview() {
    if (!reviewRow.value || reviewSubmitting.value) return;
    if (reviewDuplicate.value && !targetLeadId.value) {
        uni.showToast({ title: '确认重复必须选择重复的目标线索', icon: 'none' });
        return;
    }
    reviewSubmitting.value = true;
    try {
        await fetchLeadDuplicateReview({
            leadId: Number(reviewRow.value.id), // 列表返回的 id 为字符串，提交前转数字
            duplicate: reviewDuplicate.value,
            targetLeadId: reviewDuplicate.value ? Number(targetLeadId.value) : undefined,
            remark: reviewRemark.value.trim() || undefined
        });
        uni.showToast({ title: reviewDuplicate.value ? '已确认重复，该疑似记录已删除' : '已确认为非重复线索', icon: 'none' });
        reviewVisible.value = false;
        refreshList();
        // 成功后同步刷新普通列表（对齐 web emit reviewed）
        uni.$emit('refreshOpLeadList');
    } finally {
        reviewSubmitting.value = false;
    }
}
</script>
<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    background-color: #fff;
    box-sizing: border-box;
}

.summary-bar {
    display: flex;
    align-items: center;
    padding: 12rpx 24rpx 16rpx;
}

.summary-chip {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 24rpx;
}

.summary-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #fa8c16;
}

.summary-text {
    font-size: 24rpx;
}

.summary-num {
    font-weight: 600;
}

.rule-tip {
    margin: 20rpx 20rpx 0;
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 24rpx;
    line-height: 36rpx;
}

.list-item {
    border-radius: 20rpx;
    padding: 24rpx;
    margin-top: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16rpx;
}

.item-title {
    flex: 1;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 42rpx;
    word-break: break-all;
}

.match-count {
    font-size: 24rpx;
    white-space: nowrap;
    flex-shrink: 0;
}

.item-info {
    border-radius: 12rpx;
    padding: 16rpx;
    margin-top: 16rpx;
}

.info-row {
    display: flex;
    align-items: flex-start;
    font-size: 26rpx;
    line-height: 40rpx;
    margin-bottom: 8rpx;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-label {
    color: #999;
    flex-shrink: 0;
}

.item-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 16rpx;
}

.popup-body {
    padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
}

.popup-title {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
}

.review-line {
    font-size: 25rpx;
    line-height: 38rpx;
    margin-bottom: 16rpx;
}

.review-name {
    font-weight: 600;
}

.chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
    margin-bottom: 20rpx;
}

.chip {
    padding: 10rpx 26rpx;
    border-radius: 28rpx;
    font-size: 25rpx;
    border: 2rpx solid transparent;
}

.popup-field-label {
    font-size: 25rpx;
    margin: 8rpx 0 10rpx;
}

.info-tip {
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 24rpx;
    line-height: 36rpx;
    margin-bottom: 16rpx;
}

.match-list {
    max-height: 480rpx;
    overflow-y: auto;
    margin-bottom: 20rpx;
}

.match-item {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    padding: 18rpx 20rpx;
    border-radius: 12rpx;
    border: 2rpx solid transparent;
    margin-bottom: 12rpx;
}

.radio-dot {
    width: 28rpx;
    height: 28rpx;
    border-radius: 50%;
    border: 4rpx solid #c8c9cc;
    margin-top: 6rpx;
    flex-shrink: 0;
    box-sizing: border-box;
}

.match-info {
    flex: 1;
    min-width: 0;
}

.match-name {
    font-size: 26rpx;
    font-weight: 500;
    word-break: break-all;
}

.match-sub {
    font-size: 23rpx;
    line-height: 34rpx;
    margin-top: 4rpx;
    word-break: break-all;
}

.op-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 120rpx;
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

.empty-line {
    font-size: 26rpx;
    text-align: center;
    padding: 30rpx 0;
}

:deep(.whiteClass) {
    color: #6a6a6a;
}

:deep(.greyClass) {
    color: #c0c4cc;
}
</style>
