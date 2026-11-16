<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow :title="isEdit ? '修改缺陷' : '新增缺陷'" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <scroll-view scroll-y class="scroll-content" :scroll-into-view="scrollInto" scroll-with-animation>
            <view class="form-section">
                <view class="form-title">缺陷基础信息</view>
                <view id="fi-projectId" class="form-item">
                    <text class="form-label required">关联产品</text>
                    <picker mode="selector" :range="productList" range-key="rdname" :value="productIndex" @change="handleProductChange">
                        <view class="form-picker">{{ form.rdname || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
                <view id="fi-defect" class="form-item">
                    <text class="form-label required">缺陷标题</text>
                    <wd-input v-model="form.defect" placeholder="模块名-一句话现象" :maxlength="64" placeholder-class="placeholder-class" />
                </view>
                <view id="fi-priority" class="form-item">
                    <text class="form-label required">优先级</text>
                    <picker mode="selector" :range="priorityList" range-key="label" :value="priorityIndex" @change="handlePriorityChange">
                        <view class="form-picker">{{ priorityLabel || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
                <view class="form-item">
                    <text class="form-label">需要负责人验证</text>
                    <view class="option-chips">
                        <view v-for="item in responsibleverifyOptions" :key="item.value" class="option-chip" :class="{ active: form.responsibleverify === item.value }" @click="form.responsibleverify = item.value">{{ item.label }}</view>
                    </view>
                </view>
                <view v-if="isEdit" id="fi-tester" class="form-item">
                    <text class="form-label">测试人员</text>
                    <picker mode="selector" :range="testerList" range-key="username" :value="testerIndex" @change="handleTesterChange">
                        <view class="form-picker">
                            <text class="picker-text" :class="{ placeholder: !form.tester }">{{ testerName || '请选择测试验证人（可选）' }}</text>
                            <text v-if="form.tester" class="clear-btn" @click.stop="handleClearTester">×</text>
                            <text v-else class="arrow">›</text>
                        </view>
                    </picker>
                </view>
            </view>
            <view class="form-section">
                <view class="form-title">一、现场情况</view>
                <view id="fi-source" class="form-item">
                    <text class="form-label required">缺陷来源</text>
                    <picker mode="selector" :range="sourceList" range-key="label" :value="sourceIndex" @change="handleSourceChange">
                        <view class="form-picker">{{ sourceLabel || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
                <view id="fi-sendTime" class="form-item">
                    <text class="form-label required">发生时间</text>
                    <view class="datetime-row">
                        <picker class="datetime-item" mode="date" :value="sendDate" :end="todayStr" @change="handleSendDateChange">
                            <view class="form-picker">{{ sendDate || '选择日期' }} <text class="arrow">›</text></view>
                        </picker>
                        <picker class="datetime-item" mode="time" :value="sendTimePart" @change="handleSendTimeChange">
                            <view class="form-picker">{{ sendTimePart || '选择时间' }} <text class="arrow">›</text></view>
                        </picker>
                    </view>
                </view>
                <view id="fi-severity" class="form-item">
                    <text class="form-label required">影响程度</text>
                    <picker mode="selector" :range="severityList" range-key="label" :value="severityIndex" @change="handleSeverityChange">
                        <view class="form-picker">{{ severityLabel || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
                <view id="fi-actualResult" class="form-item">
                    <text class="form-label required">实际结果</text>
                    <RichEditor v-model="form.actualResult" placeholder="实际结果（看到什么）" height="200px" />
                </view>
                <view id="fi-expectedResult" class="form-item">
                    <text class="form-label required">期望结果</text>
                    <RichEditor v-model="form.expectedResult" placeholder="期望结果（应该是什么）" height="180px" />
                </view>
            </view>
            <view class="form-section">
                <view class="form-title">二、复现方式</view>
                <view id="fi-reproduceFrequency" class="form-item">
                    <text class="form-label required">复现频率</text>
                    <picker mode="selector" :range="frequencyList" range-key="label" :value="frequencyIndex" @change="handleFrequencyChange">
                        <view class="form-picker">{{ form.reproduceFrequency || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
                <view id="fi-precondition" class="form-item">
                    <text class="form-label required">前置条件</text>
                    <wd-input v-model="form.precondition" placeholder="数据、权限、配置、状态等信息" :maxlength="255" placeholder-class="placeholder-class" />
                </view>
                <view id="fi-reproduceStep" class="form-item">
                    <text class="form-label required">复现步骤</text>
                    <RichEditor v-model="form.reproduceStep" placeholder="1. 进入…页面&#10;2. 点击…按钮" height="220px" />
                </view>
            </view>
            <view class="form-section">
                <view class="form-title">三、补充信息</view>
                <view class="form-item">
                    <text class="form-label">客户/项目名称</text>
                    <wd-input v-model="form.proname" placeholder="请输入客户名称/项目名称" :maxlength="255" placeholder-class="placeholder-class" />
                </view>
                <view class="form-item">
                    <text class="form-label">备注</text>
                    <wd-input v-model="form.notes" placeholder="怀疑原因、相关现象等" :maxlength="255" placeholder-class="placeholder-class" />
                </view>
                <view class="form-item">
                    <text class="form-label">发现版本</text>
                    <wd-input v-model="form.softver" placeholder="请输入发现版本" :maxlength="64" placeholder-class="placeholder-class" />
                </view>
            </view>
            <view class="form-actions"><wd-button type="primary" size="large" :loading="submitting" @click="handleSubmit" style="width:100%">{{ isEdit ? '保存' : '提交' }}</wd-button></view>
        </scroll-view>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, nextTick } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchAddRdDefect, fetchUpdateRdDefect, fetchRdProjectListPage, fetchRdDefectInfo } from "@/service/rddefect";
import { fetchGetAllUserDataList } from "@/service/member";
import {
    defectPriorityOptions,
    defectSeverityOptions,
    defectSourceOptions,
    defectReproduceFrequencyOptions,
    defectResponsibleverifyOptions,
    isRichEmpty
} from "../constants";
import RichEditor from "./rich-editor.vue";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
// 暗黑模式：页面底色 + CSS 变量统一控制卡片/文字/输入底色（样式里用 var(--rd-*, 浅色默认) 取值）
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh';
    return 'min-height: 100vh; background: #1b1b1b; --rd-card-bg: #2a2a2a; --rd-card-shadow: none; --rd-title: #e8e8e8; --rd-label: #c9cdd4; --rd-field-bg: #333333; --rd-field-color: #e8e8e8; --rd-arrow: #6a6a6a; --rd-chip-bg: #3a3a3a; --rd-chip-color: #c9cdd4; --rd-chip-active-bg: rgba(22, 119, 255, 0.3); --rd-chip-active-color: #69b1ff; --rd-placeholder: #6a6a6a;';
});
const submitting = ref(false);
const scrollInto = ref('');
// 发生时间只能选今天及之前（picker end 属性）；用本地日期避免时区偏差
const todayStr = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();
const isEdit = ref(false);
const productList = ref<any[]>([]);
const priorityList = ref<any[]>(defectPriorityOptions);
const severityList = ref<any[]>(defectSeverityOptions);
const sourceList = ref<any[]>(defectSourceOptions);
const frequencyList = ref<any[]>(defectReproduceFrequencyOptions);
const responsibleverifyOptions = ref<any[]>(defectResponsibleverifyOptions);
const priorityLabel = ref('');
const severityLabel = ref('');
const sourceLabel = ref('');
const sendDate = ref('');
const sendTimePart = ref('09:00');
// 编辑模式以原行数据为基线，提交时只提交变更字段
const originRow = ref<any>({});

const form = ref<any>({
    id: undefined,
    projectId: null,
    rdname: '',
    defect: '',
    priority: null,
    responsibleverify: 0,
    tester: null,
    source: null,
    sendTime: '',
    severity: null,
    actualResult: '',
    expectedResult: '',
    reproduceFrequency: '',
    precondition: '',
    reproduceStep: '',
    proname: '',
    notes: '',
    softver: ''
});

// 测试人员（仅编辑模式展示）：usertypes=8；姓名显示优先从列表反查，列表未加载完时用行上带出的 testerName 兜底
const testerList = ref<any[]>([]);
const testerNameFallback = ref('');
const testerName = computed(() => testerList.value.find((u: any) => String(u.id) === String(form.value.tester))?.username || testerNameFallback.value || '');
const testerIndex = computed(() => { const idx = testerList.value.findIndex((u: any) => String(u.id) === String(form.value.tester)); return idx < 0 ? 0 : idx; });
function handleTesterChange(e: any) { const item = testerList.value[e.detail.value]; form.value.tester = item?.id ?? null; testerNameFallback.value = ''; }
function handleClearTester() { form.value.tester = null; testerNameFallback.value = ''; }
async function getTesterList() { try { const data: any = await fetchGetAllUserDataList({ page: 1, limit: 200, usertypes: '8' }); testerList.value = (data.list || []).filter((item: any) => item.status == 0); } catch (err) { console.error('获取测试人员失败', err); } }

// 各选择框当前选中下标：编辑时让滚轮默认停在已选值上（picker :value 是下标，找不到回落 0）
const productIndex = computed(() => { const idx = productList.value.findIndex((p: any) => String(p.id) === String(form.value.projectId)); return idx < 0 ? 0 : idx; });
const priorityIndex = computed(() => { const idx = priorityList.value.findIndex((p: any) => p.value === form.value.priority); return idx < 0 ? 0 : idx; });
const sourceIndex = computed(() => { const idx = sourceList.value.findIndex((p: any) => p.value === form.value.source); return idx < 0 ? 0 : idx; });
const severityIndex = computed(() => { const idx = severityList.value.findIndex((p: any) => p.value === form.value.severity); return idx < 0 ? 0 : idx; });
const frequencyIndex = computed(() => { const idx = frequencyList.value.findIndex((p: any) => p.value === form.value.reproduceFrequency); return idx < 0 ? 0 : idx; });

function handleClickLeft() { uni.navigateBack(); }
function handleProductChange(e: any) { const idx = e.detail.value; const item = productList.value[idx]; form.value.projectId = item?.id ?? null; form.value.rdname = item?.rdname ?? ''; }
function handlePriorityChange(e: any) { const idx = e.detail.value; const item = priorityList.value[idx]; form.value.priority = item?.value ?? null; priorityLabel.value = item?.label || ''; }
function handleSourceChange(e: any) { const idx = e.detail.value; const item = sourceList.value[idx]; form.value.source = item?.value ?? null; sourceLabel.value = item?.label || ''; }
function handleSeverityChange(e: any) { const idx = e.detail.value; const item = severityList.value[idx]; form.value.severity = item?.value ?? null; severityLabel.value = item?.label || ''; }
function handleFrequencyChange(e: any) { const idx = e.detail.value; const item = frequencyList.value[idx]; form.value.reproduceFrequency = item?.value ?? ''; }
function handleSendDateChange(e: any) { sendDate.value = e.detail.value; syncSendTime(); }
function handleSendTimeChange(e: any) { sendTimePart.value = e.detail.value; syncSendTime(); }
function syncSendTime() { form.value.sendTime = sendDate.value && sendTimePart.value ? `${sendDate.value} ${sendTimePart.value}:00` : ''; }

async function getProductList() { try { const data: any = await fetchRdProjectListPage({ page: 1, limit: 200 }); productList.value = data.list || []; } catch (err) { console.error('获取产品列表失败', err); } }

const RICH_FIELDS = ['actualResult', 'expectedResult', 'reproduceStep'];

function initEdit(row: any) {
    isEdit.value = true;
    originRow.value = row || {};
    form.value = {
        id: row.id,
        projectId: row.projectId ?? null,
        rdname: row.rdname || '',
        defect: row.defect || '',
        priority: row.priority ?? null,
        responsibleverify: row.responsibleverify ?? 0,
        tester: row.tester ?? null,
        source: row.source ?? null,
        sendTime: row.sendTime || '',
        severity: row.severity ?? null,
        actualResult: row.actualResult || '',
        expectedResult: row.expectedResult || '',
        reproduceFrequency: row.reproduceFrequency || '',
        precondition: row.precondition || '',
        reproduceStep: row.reproduceStep || '',
        proname: row.proname || '',
        notes: row.notes || '',
        softver: row.softver || ''
    };
    priorityLabel.value = (defectPriorityOptions.find(i => i.value === row.priority)?.label) || '';
    severityLabel.value = (defectSeverityOptions.find(i => i.value === row.severity)?.label) || '';
    sourceLabel.value = (defectSourceOptions.find(i => i.value === row.source)?.label) || '';
    // 空富文本（"<p><br></p>" 等）归一为空串，避免 diff 误判为有变更
    RICH_FIELDS.forEach(k => { if (isRichEmpty(form.value[k])) form.value[k] = ''; });
    if (isEdit.value) {
        testerNameFallback.value = row.testerName || '';
        getTesterList();
    }
    if (row.sendTime) {
        const parts = String(row.sendTime).split(' ');
        sendDate.value = parts[0] || '';
        sendTimePart.value = (parts[1] || '').slice(0, 5) || '09:00';
    }
}

// 必填校验按页面视觉顺序排列，未通过时 toast 提示并滚动到对应表单项
const requiredChecks = [
    { id: 'fi-projectId', msg: '请选择产品', ok: () => !!form.value.projectId },
    { id: 'fi-defect', msg: '请输入缺陷标题', ok: () => !!form.value.defect },
    { id: 'fi-priority', msg: '请选择优先级', ok: () => form.value.priority !== null },
    { id: 'fi-source', msg: '请选择缺陷来源', ok: () => form.value.source !== null },
    { id: 'fi-sendTime', msg: '请选择发生时间', ok: () => !!form.value.sendTime },
    { id: 'fi-severity', msg: '请选择影响程度', ok: () => form.value.severity !== null },
    { id: 'fi-actualResult', msg: '请输入实际结果', ok: () => !isRichEmpty(form.value.actualResult) },
    { id: 'fi-expectedResult', msg: '请输入期望结果', ok: () => !isRichEmpty(form.value.expectedResult) },
    { id: 'fi-reproduceFrequency', msg: '请选择复现频率', ok: () => !!form.value.reproduceFrequency },
    { id: 'fi-precondition', msg: '请输入前置条件', ok: () => !!form.value.precondition },
    { id: 'fi-reproduceStep', msg: '请输入复现步骤', ok: () => !isRichEmpty(form.value.reproduceStep) }
];

function scrollToError(id: string) {
    // 先置空再赋值，同一字段连续校验失败时也能重新触发滚动
    scrollInto.value = '';
    nextTick(() => { scrollInto.value = id; });
}

async function handleSubmit() {
    for (const check of requiredChecks) {
        if (!check.ok()) {
            uni.showToast({ title: check.msg, icon: 'none' });
            scrollToError(check.id);
            return;
        }
    }
    submitting.value = true;
    try {
        if (isEdit.value) {
            // 编辑只提交变更字段（+id），未变更的不提交
            const norm = (v: any) => (v === undefined || v === null || v === '' ? '' : v);
            const changed: any = { id: form.value.id };
            Object.keys(form.value).forEach((key) => {
                if (key === 'id' || key === 'rdname') return;
                if (String(norm(form.value[key])) !== String(norm(originRow.value[key]))) {
                    changed[key] = form.value[key];
                }
            });
            await fetchUpdateRdDefect(changed);
            uni.showToast({ title: '修改成功', icon: 'success' });
        } else {
            const params: any = { ...form.value, status: 0, productName: form.value.rdname }; // 新增默认待指派
            delete params.rdname;
            delete params.id;
            // 空富文本归一为空串，避免把 "<p><br></p>" 存库
            RICH_FIELDS.forEach(k => { if (isRichEmpty(params[k])) params[k] = ''; });
            await fetchAddRdDefect(params);
            uni.showToast({ title: '提交成功', icon: 'success' });
        }
        uni.$emit('refreshRdDefectList');
        setTimeout(() => { uni.navigateBack(); }, 1500);
    } catch (err: any) {
        console.error('提交失败', err);
        uni.showToast({ title: err || '提交失败', icon: 'none' });
    } finally {
        submitting.value = false;
    }
}

getProductList();

onLoad(async (options: any) => {
    // 编辑模式只传 id，进来后拉取 getById 权威数据（避免富文本内容走 URL 传参超长）
    if (options.id) {
        try {
            const data: any = await fetchRdDefectInfo(options.id);
            const rd: any = data;
            const defect: any = rd.defect ?? rd;
            initEdit({ ...defect, rdname: defect.productName || defect.rdname || '' });
        } catch (e) {
            console.error('获取缺陷详情失败', e);
            uni.showToast({ title: '获取缺陷详情失败', icon: 'none' });
        }
    } else if (options.rowData) {
        try {
            initEdit(JSON.parse(decodeURIComponent(options.rowData)));
        } catch (e) { console.error('解析数据失败', e); }
    }
});
</script>
<style lang="scss" scoped>
.scroll-content { height: calc(100vh - 88rpx); }
.form-section { background: var(--rd-card-bg, #fff); margin: 24rpx; border-radius: 16rpx; padding: 32rpx; box-shadow: var(--rd-card-shadow, 0 2rpx 12rpx rgba(0, 0, 0, 0.04)); }
.form-title { font-size: 32rpx; font-weight: 600; color: var(--rd-title, #1a1a1a); margin-bottom: 28rpx; padding-left: 16rpx; border-left: 6rpx solid #1677ff; }
.form-item { margin-bottom: 32rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { display: block; font-size: 28rpx; color: var(--rd-label, #323233); margin-bottom: 16rpx; }
.form-label.required::before { content: "*"; color: #f5222d; margin-right: 8rpx; }
.form-picker { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; background: var(--rd-field-bg, #f7f8fa); border-radius: 16rpx; font-size: 28rpx; color: var(--rd-field-color, #323233); }
.form-picker .arrow { font-size: 36rpx; color: var(--rd-arrow, #c8c9cc); }
.form-picker .picker-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.form-picker .picker-text.placeholder { color: var(--rd-placeholder, #c0c4cc); }
.form-picker .clear-btn { font-size: 36rpx; color: var(--rd-arrow, #c8c9cc); padding: 0 8rpx; line-height: 1; }
.placeholder-class { color: var(--rd-placeholder, #c0c4cc); }
.datetime-row { display: flex; gap: 16rpx; }
.datetime-item { flex: 1; min-width: 0; }
.option-chips { display: flex; gap: 16rpx; }
.option-chip { padding: 12rpx 32rpx; background: var(--rd-chip-bg, #f5f5f5); border-radius: 32rpx; font-size: 26rpx; color: var(--rd-chip-color, #666); border: 2rpx solid transparent; }
.option-chip.active { background: var(--rd-chip-active-bg, #e6f4ff); color: var(--rd-chip-active-color, #1677ff); border-color: var(--rd-chip-active-color, #1677ff); }
.form-actions { padding: 32rpx 24rpx; }
</style>
