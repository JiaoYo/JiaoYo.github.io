<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-message-box />
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow title="销售线索" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <!-- 范围页签 -->
            <scroll-view scroll-x class="scope-row">
                <view class="scope-inner">
                    <view v-for="tab in scopeTabs" :key="tab.value" class="scope-chip" :class="{ active: model.scope === tab.value }"
                        :style="scopeChipStyle(model.scope === tab.value)" @click="handleTabChange(tab.value)">{{ tab.label }}</view>
                </view>
            </scroll-view>
            <view class="search-row">
                <view class="search-input-wrap" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5' }">
                    <input class="search-input" v-model="keyword" placeholder="搜索客户名称/咨询内容" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" @confirm="handleSearch" />
                    <text v-if="keyword" class="clear-btn" :style="{ color: isDark ? '#6a6a6a' : '#999' }" @click="handleClearKeyword">×</text>
                </view>
                <view class="btn-group">
                    <wd-button size="small" type="primary" @click="handleSearch">查询</wd-button>
                    <wd-button size="small" type="info" plain @click="toggleMoreFilters">{{ showMoreFilters ? '收起' : (filterCount > 0 ? `筛选(${filterCount})` : '筛选') }}</wd-button>
                </view>
            </view>
            <view v-if="showMoreFilters" class="filter-wrap">
                <!-- 发生时间：全部 / 年 / 月 + 选择器 + 箭头步进（与 web 线索查询一致，默认查今年，月不可选本月及以后） -->
                <view class="filter-block">
                    <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">发生时间</text>
                    <view class="time-row">
                        <view v-for="opt in timeModeOptions" :key="opt.value" class="scope-chip" :style="scopeChipStyle(model.timeMode === opt.value)" @click="handleTimeModeChange(opt.value)">{{ opt.label }}</view>
                        <view v-if="model.timeMode !== 'all'" class="time-stepper">
                            <view class="step-btn" :style="{ color: isDark ? '#8a9099' : '#909399' }" @click="stepDate(-1)">‹</view>
                            <picker mode="date" :fields="model.timeMode === 'year' ? 'year' : 'month'" :value="pickerDateValue" :start="pickerStart" :end="pickerEnd" @change="handleDatePick">
                                <view class="filter-value time-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ timeText }}</view>
                            </picker>
                            <view class="step-btn" :style="{ color: isDark ? '#8a9099' : '#909399' }" @click="stepDate(1)">›</view>
                        </view>
                    </view>
                </view>
                <view class="filter-row">
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">来源</text>
                        <picker mode="selector" :range="originTypeOptions" range-key="label" @change="handleOriginTypeFilterChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pickLabel(originTypeOptions, model.originType) || '全部' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">流程状态</text>
                        <picker mode="selector" :range="processStatusOptions" range-key="label" @change="handleProcessStatusFilterChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pickLabel(processStatusOptions, model.processStatus) || '全部' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">结果</text>
                        <picker mode="selector" :range="outcomeStatusOptions" range-key="label" @change="handleOutcomeStatusFilterChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pickLabel(outcomeStatusOptions, model.outcomeStatus) || '全部' }}</view>
                        </picker>
                    </view>
                </view>
                <!-- 交接人=线索提供/发起交接的当前负责人（运营/销售/超管均可能创建），接收人=当前负责人（业务上为销售） -->
                <view class="filter-row">
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">交接人</text>
                        <picker mode="selector" :range="handoffUserOptions" range-key="label" @change="handleHandoffUserFilterChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pickLabel(handoffUserOptions, model.handoffUserId) }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">接收人</text>
                        <picker mode="selector" :range="receiverUserOptions" range-key="label" @change="handleReceiverUserFilterChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pickLabel(receiverUserOptions, model.receiverUserId) }}</view>
                        </picker>
                    </view>
                </view>
                <!-- 运营=按创建运营筛选（usertype 12）；联系人模糊、联系电话精确（对齐 web FormSearch） -->
                <view class="filter-row">
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">运营</text>
                        <picker mode="selector" :range="operationUserOptions" range-key="label" @change="handleCreatedByFilterChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pickLabel(operationUserOptions, model.createdBy) || '全部' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">联系人</text>
                        <view class="filter-input-wrap" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5' }">
                            <input class="filter-input" v-model="contactName" placeholder="模糊查询" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" @confirm="handleSearch" />
                            <text v-if="contactName" class="filter-clear" :style="{ color: isDark ? '#6a6a6a' : '#999' }" @click="handleClearContactName">×</text>
                        </view>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">联系电话</text>
                        <view class="filter-input-wrap" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5' }">
                            <input class="filter-input" v-model="contactPhone" type="number" placeholder="精确查询" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" @confirm="handleSearch" />
                            <text v-if="contactPhone" class="filter-clear" :style="{ color: isDark ? '#6a6a6a' : '#999' }" @click="handleClearContactPhone">×</text>
                        </view>
                    </view>
                </view>
                <view class="filter-reset-row">
                    <wd-button size="small" type="info" plain @click="resetFilters">重置筛选</wd-button>
                </view>
            </view>
            <view class="summary-bar">
                <view class="summary-left">
                    <view class="summary-chip" :style="{ background: isDark ? '#3a3a3a' : '#f7f8fa', color: isDark ? '#8a9099' : '#4e5969' }">
                        <text class="summary-dot"></text>
                        <text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text>
                    </view>
                </view>
                <view class="summary-right">
                    <wd-button size="small" type="warning" plain @click="goDuplicatePage">疑似重复</wd-button>
                    <wd-button v-if="canCreateLead" size="small" type="primary" @click="handleCreate">新建</wd-button>
                </view>
            </view>
        </view>
        <view v-if="dataList.length > 0" style="margin: 20rpx;">
            <view class="list-item" v-for="item in dataList" :key="item.id" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click="handleViewDetail(item)">
                <view class="item-header">
                    <view class="item-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ item.customer_name || '-' }}</view>
                    <view class="item-tags">
                        <view v-if="item.duplicate_status === 'SUSPECTED'" class="status-tag" :style="{ background: leadDuplicateStatusColorMap.SUSPECTED + '1A', color: leadDuplicateStatusColorMap.SUSPECTED }">疑似重复</view>
                        <view class="status-tag" :style="{ background: processColor(item.process_status) + '1A', color: processColor(item.process_status) }">{{ processLabel(item.process_status) }}</view>
                    </view>
                </view>
                <!-- 卡片信息列对齐 web 表格：添加日期/运营/接受人/联系人/联系电话/咨询内容/老客户/微信/最新结果状态/最新跟踪结果 -->
                <view class="item-info" :style="{ background: isDark ? '#1b1b1b' : '#fafafa' }">
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">添加日期：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ String(item.created_at || '').slice(0, 10) || '-' }}</text>
                        <text class="info-label gap-left" :style="{ color: isDark ? '#8a9099' : '#999' }">运营：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.origin_user_name || '-' }}</text>
                    </view>
                    <!-- 接受人：交接进行中为待接收人（橙色+待角标），否则为当前负责人（web receive_user 列） -->
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">接受人：</text>
                        <view v-if="item.pending_receiver_user_id" class="receive-pair">
                            <text style="color: #fa8c16;">{{ nameOf(item.pending_receiver_user_id) }}</text>
                            <view class="pending-badge">待</view>
                        </view>
                        <text v-else :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.current_owner_user_name || nameOf(item.current_owner_user_id) }}</text>
                    </view>
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">联系人：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.contact_name || '-' }}</text>
                        <text class="info-label gap-left" :style="{ color: isDark ? '#8a9099' : '#999' }">联系电话：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.contact_phone || '-' }}</text>
                    </view>
                    <!-- 合同号（2026-10-14）：一键成交后保存 -->
                    <view v-if="item.contract_no" class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">合同号：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.contract_no }}</text>
                    </view>
                    <!-- 咨询内容（web 列） -->
                    <view v-if="item.consultation_content" class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">咨询内容：</text>
                        <text class="cell-text" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.consultation_content }}</text>
                    </view>
                    <view class="info-row">
                        <view class="mini-tag" :style="yesNoTagStyle(item.old_customer)">{{ yesNoOf(item.old_customer) === '-' ? '老客户：-' : '老客户：' + yesNoOf(item.old_customer) }}</view>
                        <view class="mini-tag gap-left" :style="wechatTagStyle(item.wechat_added)">{{ wechatTextOf(item.wechat_added) === '-' ? '微信：-' : '微信：' + wechatTextOf(item.wechat_added) }}</view>
                    </view>
                    <!-- 最新结果状态 / 最新跟踪结果（web 后两列） -->
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">最新结果状态：</text>
                        <view class="mini-tag" :style="{ background: outcomeColor(item.outcome_status) + '1A', color: outcomeColor(item.outcome_status) }">{{ outcomeLabel(item.outcome_status) }}</view>
                    </view>
                    <view v-if="item.tracking_result || item.latest_followup_summary" class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">最新跟踪结果：</text>
                        <text class="cell-text" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.tracking_result || item.latest_followup_summary }}</text>
                    </view>
                </view>
                <!-- 行级操作：与 web 列操作一致（详情=点卡片）；存在待接收交接时删除给提示不直接删 -->
                <view v-if="canEditRow(item) || canDeleteRow(item) || canAssignHandoffRow(item) || canCancelHandoffRow(item) || canDealRow(item)" class="item-actions" @click.stop>
                    <wd-button v-if="canAssignHandoffRow(item)" size="small" plain type="warning" @click="goHandoffPage(item)">指派</wd-button>
                    <wd-button v-if="canCancelHandoffRow(item)" size="small" plain type="warning" @click="openCancelHandoff(item)">取消交接</wd-button>
                    <wd-button v-if="canDealRow(item)" size="small" plain type="success" @click="openDeal(item)">一键成交</wd-button>
                    <wd-button v-if="canEditRow(item)" size="small" plain type="primary" @click="handleEditRow(item)">修改</wd-button>
                    <wd-button v-if="canDeleteRow(item)" size="small" plain type="error" @click="handleDeleteRow(item)">删除</wd-button>
                </view>
            </view>
            <wd-loadmore :state="state" @reload="getDataList" />
        </view>
        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20rpx', padding: '80rpx 0', background: isDark ? '#2a2a2a' : '#fff', borderRadius: '20rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无数据" />
        </view>
        <!-- 指派（发起交接）为独立整页 lead/handoff；取消交接弹层：取消原因必填（同 web） -->
        <wd-popup v-model="cancelVisible" position="bottom" :safe-area-inset-bottom="true">
            <view class="popup-body" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">取消交接</view>
                <view class="popup-tip" :style="{ background: isDark ? 'rgba(250, 140, 22, 0.12)' : '#fff7e6', color: isDark ? '#fa8c16' : '#d46b08' }">
                    取消后负责人保持不变，线索恢复到发起交接前的流程状态。
                </view>
                <textarea class="popup-textarea" v-model="cancelRemark" maxlength="500" placeholder="请填写取消原因（必填）" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" :style="{ background: isDark ? '#1b1b1b' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#333' }" />
                <view class="popup-btns">
                    <wd-button size="small" plain type="info" @click="cancelVisible = false">取消</wd-button>
                    <wd-button size="small" type="warning" @click="saveCancelHandoff">确认取消</wd-button>
                </view>
            </view>
        </wd-popup>
        <!-- 一键成交弹层（2026-10-14）：合同号必填（去空格 ≤100 字符），需与已签合同一致 -->
        <wd-popup v-model="dealVisible" position="bottom" :safe-area-inset-bottom="true">
            <view class="popup-body" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">一键成交</view>
                <view class="popup-tip" :style="{ background: isDark ? 'rgba(82, 196, 26, 0.12)' : '#f6ffed', color: isDark ? '#95de64' : '#389e0d' }">
                    确认后线索结果置为「成交」、流程置为「已结束」，并保存合同号。
                </view>
                <view class="popup-field-label" :style="{ color: isDark ? '#8a9099' : '#999' }">合同号（必填，需与已签合同一致）</view>
                <input class="popup-input" v-model="dealContractNumber" maxlength="100" placeholder="请输入合同号，如 HT20260315001" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" :style="{ background: isDark ? '#1b1b1b' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#333' }" />
                <view class="popup-btns">
                    <wd-button size="small" plain type="info" @click="dealVisible = false">取消</wd-button>
                    <wd-button size="small" type="success" :disabled="dealSubmitting" @click="saveDeal">{{ dealSubmitting ? '提交中…' : '确认成交' }}</wd-button>
                </view>
            </view>
        </wd-popup>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { onLoad, onReady, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { hasPermission } from "@/utils/index";
import { fetchLeadPage, fetchLeadDetail, fetchLeadDelete, fetchHandoffCancel, fetchLeadConfirmDeal } from "@/service/operationSales";
import { useOpUserMap, fetchActiveUsers } from "../user-map";
import {
    leadOriginTypeOptions,
    leadProcessStatusMap,
    leadProcessStatusColorMap,
    leadProcessStatusOptions,
    leadOutcomeStatusMap,
    leadOutcomeStatusColorMap,
    leadOutcomeStatusOptions,
    leadScopeOptions,
    leadDuplicateStatusColorMap
} from "../constants";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const { nameOf, load: loadUserMap } = useOpUserMap();

/* 2026-10-14 文档：页面与按钮只按接口 Shiro permission 控制，不再按 usertype/创建人/负责人/接收人
 * 增加业务权限判断；数据归属与操作资格由后端校验，越权请求会被后端拒绝并透出失败信息 */
const userType = computed(() => Number(uni.getStorageSync("usertype")));
const currentUserId = computed(() => String(uni.getStorageSync("userId")));
const isSuperAdmin = computed(() => userType.value === 0);
const canCreateLead = computed(() => hasPermission('operation:lead:update'));

// 范围页签：scope 是筛选项非权限，不传默认 ALL 全部线索
const scopeTabs = leadScopeOptions;

const topFixedHeight = ref(0);
const dataList = ref<any[]>([]);
const total = ref(0);
const listLoading = ref(false);
const state = ref<'loading' | 'finished' | 'error'>('loading');
const keyword = ref('');
// 联系人（模糊）/ 联系电话（精确）筛选，对齐 web FormSearch contactName/contactPhone
const contactName = ref('');
const contactPhone = ref('');
const showMoreFilters = ref(false);
const model = ref<any>({
    page: 1,
    // 默认全部线索（scope 不传时后端也按 ALL）；页签为筛选项非权限
    scope: 'ALL',
    // 发生时间：默认查今年（与 web 线索查询一致）；month 为 'yyyy-MM'，仅 month 模式提交
    timeMode: 'year',
    year: String(new Date().getFullYear()),
    month: '',
    originType: '',
    processStatus: '',
    outcomeStatus: '',
    handoffUserId: '',
    receiverUserId: '',
    // 按创建运营筛选（对齐 web FormSearch createdBy，运营 usertype=12）
    createdBy: ''
});

// 推送跳转待打开的线索 id（onLoad 传入，onMounted 列表就绪后打开详情）
const pendingOpenLeadId = ref('');

function processLabel(v: any) { return leadProcessStatusMap[v] || v || '-'; }
function processColor(v: any) { return leadProcessStatusColorMap[v] || '#909399'; }
function outcomeLabel(v: any) { return leadOutcomeStatusMap[v] || v || '-'; }
function outcomeColor(v: any) { return leadOutcomeStatusColorMap[v] || '#909399'; }
/** 是否类字段：null/'' → '-'；true/1 → 是（对齐 web yesNoOf） */
function yesNoOf(v: any) { return v == null || v === '' ? '-' : (v === true || Number(v) === 1 ? '是' : '否'); }
/** 是否添加微信：null/'' → '-'；true/1 → 已添加（对齐 web wechatTextOf） */
function wechatTextOf(v: any) { return v == null || v === '' ? '-' : (v === true || Number(v) === 1 ? '已添加' : '未添加'); }
/** 老客户标签：是=绿，否=灰（同 web success/default） */
function yesNoTagStyle(v: any) {
    const color = yesNoOf(v) === '是' ? '#52c41a' : (isDark.value ? '#8a9099' : '#909399');
    return { background: color + '1A', color };
}
/** 微信标签：已添加=绿，未添加=橙（同 web success/warning） */
function wechatTagStyle(v: any) {
    const color = wechatTextOf(v) === '已添加' ? '#52c41a' : '#fa8c16';
    return { background: color + '1A', color };
}
function pickLabel(options: any[], v: any) { return (options || []).find((o: any) => o.value === v)?.label || ''; }
/* 来源/流程状态/结果筛选项：从 constants 的 Options 取，补「全部」置首（对齐 web FormSearch） */
const ALL_OPTION = { label: '全部', value: '' };
const originTypeOptions = [ALL_OPTION, ...leadOriginTypeOptions];
const processStatusOptions = [ALL_OPTION, ...leadProcessStatusOptions];
const outcomeStatusOptions = [ALL_OPTION, ...leadOutcomeStatusOptions];
function scopeChipStyle(active: boolean) {
    if (active) return { background: isDark.value ? 'rgba(22, 119, 255, 0.3)' : '#e6f4ff', color: isDark.value ? '#69b1ff' : '#1677ff', borderColor: isDark.value ? '#69b1ff' : '#1677ff' };
    return { background: isDark.value ? '#2a2a2a' : '#f5f5f5', color: isDark.value ? '#c9cdd4' : '#4e5969', borderColor: 'transparent' };
}

/* ---------------- 发生时间（全部 / 年 / 月 + 选择器 + 箭头步进） ---------------- */
const timeModeOptions = [
    { label: '全部', value: 'all' },
    { label: '年', value: 'year' },
    { label: '月', value: 'month' }
];

function currentYear() { return String(new Date().getFullYear()); }
/** 解析 'yyyy-MM' 为当月 1 号 */
function parseMonth(s: string) { const [y, m] = String(s).split('-').map(Number); return new Date(y || new Date().getFullYear(), (m || 1) - 1, 1); }
/** Date → 'yyyy-MM' */
function formatMonth(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
/** 月序号（年*12+月），用于比较月份先后 */
function monthIndex(d: Date) { return d.getFullYear() * 12 + d.getMonth(); }
/** 上一个月 'yyyy-MM'（本月不可查，月模式基准即上月） */
function prevMonthStr() { const now = new Date(); return formatMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)); }

/** 选择器显示值：年模式 yyyy，月模式 yyyy-MM */
const timeText = computed(() => (model.value.timeMode === 'year' ? `${model.value.year}年` : model.value.month));
/** 原生 picker 的 value/start/end 需完整日期串；年模式不限未来年份（与 web 一致），月模式止于上月最后一天 */
const pickerDateValue = computed(() => (model.value.timeMode === 'year' ? `${model.value.year || currentYear()}-01-01` : `${model.value.month || prevMonthStr()}-01`));
const pickerStart = '2000-01-01';
const pickerEnd = computed(() => {
    if (model.value.timeMode === 'year') return '2099-12-31';
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth(), 0); // 上月最后一天
    return `${formatMonth(last)}-${String(last.getDate()).padStart(2, '0')}`;
});

/** 切换粒度：月模式落到上月并同步年份；年模式默认当前年份；全部清空年月但保留选择 */
function handleTimeModeChange(v: string) {
    if (model.value.timeMode === v) return;
    model.value.timeMode = v;
    if (v === 'month') {
        const existing = model.value.month ? parseMonth(model.value.month) : null;
        if (!existing || monthIndex(existing) >= monthIndex(new Date())) model.value.month = prevMonthStr();
        model.value.year = model.value.month.split('-')[0];
    } else {
        model.value.month = '';
    }
    if (v === 'year' && !model.value.year) model.value.year = currentYear();
    refreshList();
}

/** 年步进 */
function stepYear(step: number) {
    const next = (Number(model.value.year) || new Date().getFullYear()) + step;
    if (next < 2000) return;
    model.value.year = String(next);
    refreshList();
}
/** 月步进：不能步进到本月及以后 */
function stepMonth(step: number) {
    const now = new Date();
    const base = model.value.month ? parseMonth(model.value.month) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nd = new Date(base.getFullYear(), base.getMonth() + step, 1);
    if (monthIndex(nd) >= monthIndex(now)) { uni.showToast({ title: '月份只能查询本月之前', icon: 'none' }); return; }
    model.value.month = formatMonth(nd);
    model.value.year = model.value.month.split('-')[0];
    refreshList();
}
function stepDate(step: number) { if (model.value.timeMode === 'month') stepMonth(step); else stepYear(step); }

/** 原生日期选择器：年模式回 'yyyy'，月模式回 'yyyy-MM' */
function handleDatePick(e: any) {
    const v = String(e.detail.value || '');
    if (model.value.timeMode === 'year') {
        model.value.year = v || currentYear();
        refreshList();
        return;
    }
    if (v && monthIndex(parseMonth(v)) >= monthIndex(new Date())) { uni.showToast({ title: '月份只能查询本月之前', icon: 'none' }); return; }
    model.value.month = v || prevMonthStr();
    model.value.year = model.value.month.split('-')[0];
    refreshList();
}

/* ---------------- 交接人 / 接收人候选（交接人=创建人，接收人=有效销售） ---------------- */
const handoffUserOptions = ref<any[]>([ALL_OPTION]);
const receiverUserOptions = ref<any[]>([ALL_OPTION]);
// 运营筛选候选（创建运营，usertype=12，对齐 web operationOptions）
const operationUserOptions = ref<any[]>([ALL_OPTION]);
async function loadFilterUsers() {
    try {
        const [all, sales, operations] = await Promise.all([fetchActiveUsers('0,1,12'), fetchActiveUsers('1'), fetchActiveUsers('12')]);
        handoffUserOptions.value = [ALL_OPTION, ...all.map((u: any) => ({ label: u.username, value: u.id }))];
        receiverUserOptions.value = [ALL_OPTION, ...sales.map((u: any) => ({ label: u.username, value: u.id }))];
        operationUserOptions.value = [ALL_OPTION, ...operations.map((u: any) => ({ label: u.username, value: u.id }))];
    } catch (err) {
        console.error('获取筛选人员列表失败', err);
    }
}

/** 已生效的筛选条件数（页签/关键字不算），收起时提示用户当前仍有筛选 */
const filterCount = computed(() => {
    let n = 0;
    if (model.value.originType) n++;
    if (model.value.processStatus) n++;
    if (model.value.outcomeStatus) n++;
    if (model.value.handoffUserId) n++;
    if (model.value.receiverUserId) n++;
    if (model.value.createdBy) n++;
    if (contactName.value) n++;
    if (contactPhone.value) n++;
    if (model.value.timeMode !== 'all') n++;
    return n;
});

async function getDataList() {
    if (listLoading.value) return;
    listLoading.value = true;
    state.value = 'loading';
    try {
        const params: any = {
            pageNum: model.value.page,
            pageSize: 20,
            scope: model.value.scope,
            // 发生时间映射与 web 一致：全部不传；年只传年份；月传年份+月份数字
            year: model.value.timeMode === 'all' ? undefined : (model.value.year ? Number(model.value.year) : undefined),
            month: model.value.timeMode === 'month' && model.value.month ? Number(String(model.value.month).split('-')[1]) : undefined,
            originType: model.value.originType || undefined,
            processStatus: model.value.processStatus || undefined,
            outcomeStatus: model.value.outcomeStatus || undefined,
            handoffUserId: model.value.handoffUserId || undefined,
            receiverUserId: model.value.receiverUserId || undefined,
            // 创建运营（web 提交字段名为 created_by）、联系人模糊、联系电话精确
            created_by: model.value.createdBy || undefined,
            contactName: contactName.value || undefined,
            contactPhone: contactPhone.value || undefined,
            keyword: keyword.value || undefined
        };
        const res: any = await fetchLeadPage(params);
        const list = res?.list || [];
        // 分页追加；刷新（page=1）时先置空再赋值，规避 app 端嵌套结构整体替换渲染异常
        if (model.value.page === 1) {
            dataList.value = [];
        }
        dataList.value = dataList.value.concat(list);
        total.value = Number(res?.total) || 0;
        state.value = dataList.value.length >= total.value ? 'finished' : 'loading';
    } catch (err) {
        console.error('获取线索列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }
function handleTabChange(value: string) {
    if (model.value.scope === value) return;
    model.value.scope = value;
    refreshList();
}
function handleSearch() { refreshList(); }
function handleClearKeyword() { keyword.value = ''; refreshList(); }
function toggleMoreFilters() { showMoreFilters.value = !showMoreFilters.value; setTimeout(() => { recalcTopFixedHeight(); }, 50); }
// 原生 picker：e.detail.value 为选中项下标
function handlePickerChange(key: string, options: any[], e: any) {
    const idx = Number(e.detail.value);
    model.value[key] = options[idx]?.value ?? '';
    refreshList();
}
function handleOriginTypeFilterChange(e: any) { handlePickerChange('originType', originTypeOptions, e); }
function handleProcessStatusFilterChange(e: any) { handlePickerChange('processStatus', processStatusOptions, e); }
function handleOutcomeStatusFilterChange(e: any) { handlePickerChange('outcomeStatus', outcomeStatusOptions, e); }
function handleHandoffUserFilterChange(e: any) { handlePickerChange('handoffUserId', handoffUserOptions.value, e); }
function handleReceiverUserFilterChange(e: any) { handlePickerChange('receiverUserId', receiverUserOptions.value, e); }
function handleCreatedByFilterChange(e: any) { handlePickerChange('createdBy', operationUserOptions.value, e); }
function handleClearContactName() { contactName.value = ''; refreshList(); }
function handleClearContactPhone() { contactPhone.value = ''; refreshList(); }
/** 重置：发生时间回到默认的今年（与 web 一致），其余条件清空 */
function resetFilters() {
    model.value.timeMode = 'year';
    model.value.year = currentYear();
    model.value.month = '';
    model.value.originType = '';
    model.value.processStatus = '';
    model.value.outcomeStatus = '';
    model.value.handoffUserId = '';
    model.value.receiverUserId = '';
    model.value.createdBy = '';
    contactName.value = '';
    contactPhone.value = '';
    keyword.value = '';
    refreshList();
}
function handleCreate() { uni.navigateTo({ url: '/mePages/operationSales/lead/form' }); }
function handleViewDetail(row: any) { uni.navigateTo({ url: '/mePages/operationSales/lead/detail?id=' + row.id }); }

/* ---------------- 行级操作资格（对齐 web：只按 permission 控制显隐，业务状态条件保留，归属条件与 web canOwnRow 相同） ---------------- */
/** 操作资格：只按 operation:lead:update 权限控制（归属/资格由后端校验） */
function canOperateRow(_row: any) { return hasPermission('operation:lead:update'); }
/** 行上「接收人」列对应的人：交接进行中为待接收人，否则为当前负责人 */
function rowReceiverId(row: any) { return String(row.pending_receiver_user_id ?? row.current_owner_user_id ?? ''); }
/** 修改/删除归属条件：超管、本人创建（created_by 是自己）、或接收人列是自己（对齐 web canOwnRow） */
function canOwnRow(row: any) {
    return isSuperAdmin.value || String(row.created_by) === currentUserId.value || rowReceiverId(row) === currentUserId.value;
}
/** 发起交接（指派）：有 handoff 权限、未结束、无待接收交接，且仅超管或接收人列（当前负责人）本人可见 */
function canAssignHandoffRow(row: any) {
    return hasPermission('operation:lead:handoff')
        && row.process_status !== 'FINISHED' && !row.pending_receiver_user_id
        && (isSuperAdmin.value || rowReceiverId(row) === currentUserId.value);
}
/** 取消交接：存在待接收交接，仅交接发起人（待接收期间负责人不变）或超管可见 */
function canCancelHandoffRow(row: any) {
    return hasPermission('operation:lead:handoff')
        && !!row.pending_receiver_user_id
        && (String(row.current_owner_user_id) === currentUserId.value || isSuperAdmin.value);
}
/** 一键成交：有 update 权限、接收人列是自己或超管；待接收（存在待接收交接）或已成交时隐藏——须先处理交接 */
function canDealRow(row: any) {
    return canOperateRow(row) && row.outcome_status !== 'DEAL' && !row.pending_receiver_user_id
        && (isSuperAdmin.value || rowReceiverId(row) === currentUserId.value);
}
/** 已结束线索不能修改；存在待接收交接时一律不能修改——即使待接收人是自己 */
function canEditRow(row: any) {
    return canOperateRow(row) && canOwnRow(row) && row.process_status !== 'FINISHED' && !row.pending_receiver_user_id;
}
/** 删除资格同修改；存在待接收交接时须先接收/拒绝/取消交接才能删除 */
function canDeleteRow(row: any) { return canOperateRow(row) && canOwnRow(row) && !row.pending_receiver_user_id; }

function handleEditRow(row: any) { uni.navigateTo({ url: '/mePages/operationSales/lead/form?id=' + row.id }); }

function handleDeleteRow(row: any) {
    if (row.pending_receiver_user_id) {
        uni.showToast({ title: '存在待接收交接，请先取消/处理交接后再删除', icon: 'none' });
        return;
    }
    uni.showModal({
        title: '删除线索',
        content: `确定删除「${row.customer_name || '-'}」吗？`,
        success: async (res) => {
            if (!res.confirm) return;
            try {
                await fetchLeadDelete(row.id);
                uni.showToast({ title: '已删除', icon: 'none' });
                refreshList();
            } catch (err) {
                console.error('删除线索失败', err);
            }
        }
    });
}

/* ---------------- 指派（发起交接）→ 独立整页 lead/handoff ---------------- */
function goHandoffPage(row: any) {
    uni.navigateTo({
        url: '/mePages/operationSales/lead/handoff?id=' + row.id + '&name=' + encodeURIComponent(row.customer_name || '')
    });
}

/* ---------------- 取消交接弹层 ---------------- */
const cancelVisible = ref(false);
const cancelRow = ref<any>(null);
const cancelRemark = ref('');

function openCancelHandoff(row: any) {
    cancelRow.value = row;
    cancelRemark.value = '';
    cancelVisible.value = true;
}

/** 取消交接：web 同款两步——先查详情找 PENDING 交接单，再带原因取消（原因必填） */
async function saveCancelHandoff() {
    const remark = cancelRemark.value.trim();
    if (!remark) { uni.showToast({ title: '请填写取消原因（必填）', icon: 'none' }); return; }
    try {
        const detail: any = await fetchLeadDetail(cancelRow.value.id);
        const pending = (detail?.handoffs || []).find((h: any) => h.status === 'PENDING');
        if (!pending) {
            uni.showToast({ title: '未找到待接收的交接单', icon: 'none' });
            cancelVisible.value = false;
            refreshList();
            return;
        }
        await fetchHandoffCancel({ handoffId: pending.id, remark });
        uni.showToast({ title: '已取消交接', icon: 'none' });
        cancelVisible.value = false;
        refreshList();
    } catch (err) {
        console.error('取消交接失败', err);
    }
}

/* ---------------- 一键成交（2026-10-14）：合同号去空格必填 ≤100 字符，存在性由后端校验 ---------------- */
const dealVisible = ref(false);
const dealRow = ref<any>(null);
const dealContractNumber = ref('');
const dealSubmitting = ref(false);

function openDeal(row: any) {
    dealRow.value = row;
    // 回填已有合同号（已成交线索再提交同号按成功处理）
    dealContractNumber.value = String(row.contract_no || '');
    dealVisible.value = true;
}

async function saveDeal() {
    if (!dealRow.value || dealSubmitting.value) return;
    const contractNumber = String(dealContractNumber.value || '').replace(/\s/g, '');
    if (!contractNumber) { uni.showToast({ title: '请填写合同号（必填）', icon: 'none' }); return; }
    if (contractNumber.length > 100) { uni.showToast({ title: '合同号不能超过 100 个字符', icon: 'none' }); return; }
    dealSubmitting.value = true;
    try {
        await fetchLeadConfirmDeal({ leadId: Number(dealRow.value.id), contractNumber });
        uni.showToast({ title: '已成交', icon: 'none' });
        dealVisible.value = false;
        refreshList();
    } catch (err) {
        console.error('一键成交失败', err);
    } finally {
        dealSubmitting.value = false;
    }
}

/* ---------------- 疑似重复线索审核入口（2026-10-14） ---------------- */
function goDuplicatePage() { uni.navigateTo({ url: '/mePages/operationSales/lead/duplicate' }); }

function refreshList() { model.value.page = 1; getDataList(); }
// 固定头部（导航+页签+搜索+筛选）高度撑起占位，防止内容顶入头部之下
function recalcTopFixedHeight() { uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => { if (rect && rect.height !== undefined) topFixedHeight.value = rect.height; if (topFixedHeight.value === 0) topFixedHeight.value = 300; }).exec(); }
onLoad((options: any) => {
    // 推送/外部入口：scope 直切页签（如待我接收），openLeadId 进页面后自动打开该线索详情
    if (options?.scope && scopeTabs.some((t: any) => t.value === options.scope)) {
        model.value.scope = options.scope;
    }
    if (options?.openLeadId) pendingOpenLeadId.value = String(options.openLeadId);
});
onReady(() => { recalcTopFixedHeight(); });
onPullDownRefresh(() => { model.value.page = 1; getDataList(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (!listLoading.value && dataList.value.length < total.value) { model.value.page++; getDataList(); } else if (dataList.value.length >= total.value) { state.value = 'finished'; } });
onMounted(() => {
    loadUserMap();
    loadFilterUsers();
    getDataList();
    // 推送进入：自动打开指定线索详情
    if (pendingOpenLeadId.value) {
        const leadId = pendingOpenLeadId.value;
        pendingOpenLeadId.value = '';
        uni.navigateTo({ url: '/mePages/operationSales/lead/detail?id=' + leadId });
    }
    // 详情/表单操作后刷新列表
    uni.$on('refreshOpLeadList', refreshList);
});
onUnmounted(() => { uni.$off('refreshOpLeadList', refreshList); });
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

.scope-row {
    white-space: nowrap;
    padding: 12rpx 20rpx 0;
}

.scope-inner {
    display: inline-flex;
    gap: 16rpx;
}

.scope-chip {
    display: inline-block;
    padding: 8rpx 28rpx;
    border-radius: 28rpx;
    font-size: 26rpx;
    border: 2rpx solid transparent;
}

.search-row {
    display: flex;
    align-items: center;
    padding: 12rpx 20rpx;
    gap: 12rpx;
}

.search-input-wrap {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 32rpx;
    padding: 0 20rpx;
    height: 64rpx;
}

.search-input {
    flex: 1;
    font-size: 28rpx;
}

.clear-btn {
    position: absolute;
    right: 24rpx;
    font-size: 36rpx;
    color: #999;
    line-height: 1;
}

.btn-group {
    display: flex;
    gap: 12rpx;
}

.filter-wrap {
    padding: 0 20rpx 12rpx;
}

.filter-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 12rpx;
}

.filter-item {
    flex: 1;
}

.filter-label {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
}

.filter-value {
    padding: 16rpx 20rpx;
    background: #f5f5f5;
    border-radius: 16rpx;
    font-size: 26rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 筛选面板内文本输入（联系人/联系电话） */
.filter-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 20rpx;
    border-radius: 16rpx;
    height: 72rpx;
}

.filter-input {
    flex: 1;
    min-width: 0;
    font-size: 26rpx;
    height: 72rpx;
    line-height: 72rpx;
}

.filter-clear {
    flex-shrink: 0;
    padding-left: 12rpx;
    font-size: 32rpx;
    line-height: 1;
}

.filter-block {
    margin-bottom: 16rpx;
}

.time-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12rpx;
}

.time-stepper {
    display: flex;
    align-items: center;
    gap: 4rpx;
    margin-left: 4rpx;
}

.step-btn {
    width: 52rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    line-height: 1;
    border-radius: 12rpx;
}

.time-value {
    min-width: 150rpx;
    text-align: center;
    padding: 16rpx 12rpx;
}

.filter-reset-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12rpx;
}

.summary-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 24rpx 16rpx;
}

.summary-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.summary-right {
    display: flex;
    align-items: center;
    gap: 12rpx;
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
    background: #52c41a;
}

.summary-text {
    font-size: 24rpx;
}

.summary-num {
    font-weight: 600;
}

.list-item {
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
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
}

/* 标题右侧标签组：疑似重复 + 流程状态 */
.item-tags {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-shrink: 0;
}

.status-tag {
    padding: 6rpx 16rpx;
    border-radius: 16rpx;
    font-size: 22rpx;
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
    align-items: center;
    flex-wrap: wrap;
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

.gap-left {
    margin-left: 24rpx;
}

/* 接受人：待接收人 + 「待」角标（web NBadge 语义） */
.receive-pair {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
}

.pending-badge {
    min-width: 28rpx;
    height: 28rpx;
    padding: 0 6rpx;
    border-radius: 14rpx;
    background: #fa8c16;
    color: #fff;
    font-size: 18rpx;
    line-height: 28rpx;
    text-align: center;
}

/* 单元格文本：可换行（web 表格列值） */
.cell-text {
    flex: 1;
    min-width: 0;
    font-size: 26rpx;
    line-height: 38rpx;
    word-break: break-all;
}

.mini-tag {
    padding: 2rpx 14rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    white-space: nowrap;
}

/* 行级操作按钮区 */
.item-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 2rpx solid rgba(127, 127, 127, 0.18);
}

/* 取消交接 底部弹层 */
.popup-body {
    padding: 32rpx;
    border-radius: 24rpx 24rpx 0 0;
}

.popup-title {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
}

.popup-tip {
    padding: 16rpx 20rpx;
    border-radius: 12rpx;
    font-size: 24rpx;
    line-height: 34rpx;
    margin-bottom: 24rpx;
}

.popup-textarea {
    box-sizing: border-box;
    width: 100%;
    height: 160rpx;
    padding: 16rpx 20rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
    margin-bottom: 24rpx;
}

/* 一键成交弹层 */
.popup-field-label {
    display: block;
    font-size: 25rpx;
    margin-bottom: 10rpx;
}

.popup-input {
    box-sizing: border-box;
    width: 100%;
    height: 72rpx;
    padding: 0 20rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
    margin-bottom: 24rpx;
}

.popup-btns {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
}

:deep(.whiteClass) {
    color: #6a6a6a;
}

:deep(.greyClass) {
    color: #c0c4cc;
}
</style>
