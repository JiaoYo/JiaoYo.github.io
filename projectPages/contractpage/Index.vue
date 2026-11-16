<script setup lang="ts">
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjContractDataList, fetchDeletePrjContractInfo, fetchUpdateContractPaystatus, fetchApproveContractAudit, fetchContractDeviceDataList, fetchGetPrjDataList } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    state: string;
    projectKeyword: string;
    deviceTypes: string[];
    auditStatus: string;
    startTime: string;
    endTime: string;
}>({
    page: 1,
    limit: 20,
    total: 0,
    state: 'loading',
    projectKeyword: '',
    deviceTypes: [],
    auditStatus: '全部',
    startTime: '',
    endTime: '',
});

// 顶部搜索：前置选择器决定按 合同名称(fuzzy) 或 合同编号(contractnum) 查询，二者互斥只传其一
const searchFieldOptions = ['合同名称', '合同编号'];
const searchFieldIndex = ref(0);
const searchKeyword = ref('');

// 日期起止（native picker mode=date，YYYY-MM-DD 直传后端；空串不参与查询）与审核状态/输入清除等筛选交互
const auditOptions = ['全部', '无需审核', '待审核', '审核通过'];
function handleDateChange(key: 'startTime' | 'endTime', e: any) {
    dataForm[key] = e.detail.value || '';
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}
function handleDateClear(key: 'startTime' | 'endTime') {
    dataForm[key] = '';
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}
function handleAuditPickChange(e: any) {
    dataForm.auditStatus = auditOptions[Number(e.detail.value)] || '全部';
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}
function handleAuditClearChange() {
    dataForm.auditStatus = '全部';
    handleSearchChange();
}
function handleClearProjectKeywordChange() {
    dataForm.projectKeyword = '';
    handleSearchChange();
}
// 字段下拉展开态：点击名称直接在下方展示选项（非系统弹窗）
const fieldDropVisible = ref(false);
function handleToggleFieldDropChange() {
    fieldDropVisible.value = !fieldDropVisible.value;
}
// 切换搜索字段（合同名称/合同编号）：同项仅收起；换项旧关键词语义失效，清空后按新字段重查
function handlePickSearchFieldChange(idx: number) {
    fieldDropVisible.value = false;
    if (idx === searchFieldIndex.value) return;
    searchFieldIndex.value = idx;
    searchKeyword.value = '';
    handleSearchChange();
}
// 重置全部筛选（关键词/日期/关联项目/项目关键字/设备类型/审核状态），回到第1页
function handleResetFiltersChange() {
    searchKeyword.value = '';
    dataForm.startTime = '';
    dataForm.endTime = '';
    dataForm.projectKeyword = '';
    selectedProjectId.value = null;
    selectedProjectName.value = '';
    dataForm.deviceTypes = [];
    dataForm.auditStatus = '全部';
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}
// 筛选控件配色：选中淡蓝底描边、未选中灰底（颜色仅辅助，字段值文字为准）
function fcCellStyle(active: boolean) {
    return active
        ? (isDark.value
            ? { background: 'rgba(22, 119, 255, 0.12)', borderColor: 'rgba(105, 177, 255, 0.45)' }
            : { background: 'rgba(22, 119, 255, 0.06)', borderColor: 'rgba(22, 119, 255, 0.35)' })
        : (isDark.value
            ? { background: '#383838', borderColor: 'rgba(255, 255, 255, 0.08)' }
            : { background: '#f7f8fa', borderColor: '#f0f1f3' });
}

// ===== 关联项目选择弹层（口径同 web form-search：projectInfo/getPage.do 分页 + fuzzy 搜索，选中 projectId 精确查询） =====
const projectPopup = ref(false);
const prjKeyword = ref('');
const prjLoading = ref(false);
const prjList = ref<any[]>([]);
const prjTotal = ref(0);
const selectedProjectId = ref<number | null>(null);
const selectedProjectName = ref('');
let prjPage = 1;
let prjSeq = 0;

// 首屏/搜索：fuzzy 走服务端模糊，page 重置为 1（seq 防竞态）
async function loadProjectOptions(keyword?: string, showTip = false) {
    const seq = ++prjSeq;
    prjPage = 1;
    prjLoading.value = true;
    if (showTip) uni.showLoading({ title: '搜索中...' });
    try {
        const data: any = await fetchGetPrjDataList({ page: 1, limit: 50, fuzzy: keyword || undefined, _t: new Date().getTime() });
        if (seq !== prjSeq) return;
        prjTotal.value = Number(data?.total) || 0;
        const next = (data?.list || []).filter((p: any) => p && p.proname);
        // 先置空再赋值，规避嵌套 template 数组整体替换的渲染坑
        prjList.value = [];
        prjList.value = next;
    } catch (err) {
        console.error('获取项目列表失败', err);
    } finally {
        if (seq === prjSeq) {
            prjLoading.value = false;
            uni.hideLoading();
        }
    }
}

// 弹层滚到底：追加下一页
async function loadMoreProjectOptions() {
    if (prjLoading.value || prjList.value.length >= prjTotal.value) return;
    const seq = ++prjSeq;
    prjLoading.value = true;
    try {
        const data: any = await fetchGetPrjDataList({ page: prjPage + 1, limit: 50, fuzzy: prjKeyword.value || undefined, _t: new Date().getTime() });
        if (seq !== prjSeq) return;
        prjPage += 1;
        prjTotal.value = Number(data?.total) || 0;
        prjList.value = prjList.value.concat((data?.list || []).filter((p: any) => p && p.proname));
    } catch (err) {
        console.error('获取项目列表失败', err);
    } finally {
        if (seq === prjSeq) prjLoading.value = false;
    }
}

function openProjectPopupChange() {
    projectPopup.value = true;
    if (!prjList.value.length) loadProjectOptions();
}

// 选中/清空即查询（web handleProjectIdChange 同口径：全部项目=清空 projectId）
function handleSelectProjectChange(p: any) {
    selectedProjectId.value = p && p.id != null ? p.id : null;
    selectedProjectName.value = (p && p.proname) || '';
    projectPopup.value = false;
    handleSearchChange();
}

function handleClearProjectSelectChange() {
    selectedProjectId.value = null;
    selectedProjectName.value = '';
    handleSearchChange();
}

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 清除
function handleClearChange() {
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 筛选区展开/收起（默认收起只留查询日期行，降低顶部固定区占用；切换后重算固定区高度）
const filterExpanded = ref(false);
// 收起状态下已生效的筛选项数量（日期/关联项目/关键字/重点设备/审核状态；顶部关键词常驻不计数）
const activeFilterCount = computed(() => {
    let n = 0;
    if (dataForm.startTime || dataForm.endTime) n++;
    if (selectedProjectId.value != null) n++;
    if (dataForm.projectKeyword) n++;
    if (dataForm.deviceTypes.length) n++;
    if (dataForm.auditStatus !== '全部') n++;
    return n;
});
function handleToggleFilterExpandChange() {
    filterExpanded.value = !filterExpanded.value;
    // v-show 渲染在 app 端可能滞后于 nextTick，延时重测避免列表顶部被遮挡
    nextTick(() => { setTimeout(() => { recalcTopFixedHeight(); }, 80); });
}

// 获取项目列表信息
async function getDataList() {
    if (!hasPermission('project:Contract:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无合同查询权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        // 关键词按顶部搜索所选字段路由：合同名称→fuzzy，合同编号→contractnum（互斥只传其一）
        const params: any = { page: dataForm.page, limit: dataForm.limit, projectKeyword: dataForm.projectKeyword };
        if (searchKeyword.value) {
            if (searchFieldIndex.value === 0) {
                params.fuzzy = searchKeyword.value;
            } else {
                params.contractnum = searchKeyword.value;
            }
        }
        if (selectedProjectId.value != null) {
            params.projectId = selectedProjectId.value;
        }
        if (dataForm.deviceTypes.length) {
            params.deviceTypes = dataForm.deviceTypes.join(',');
        }
        if (dataForm.auditStatus !== '全部') {
            params.auditStatus = ({ '无需审核': 0, '待审核': 1, '审核通过': 2 } as Record<string, number>)[dataForm.auditStatus];
        }
        params.startTime = dataForm.startTime;
        params.endTime = dataForm.endTime;
        const data = await fetchGetPrjContractDataList(params);
        dataList.value = dataList.value.concat(data.list);
        dataForm.total = Number(data.total);
        if (dataList.value.length < dataForm.total) {
            dataForm.state = 'loadmore';
        } else {
            dataForm.state = 'finished';
        }
    } catch (err) {
        console.error('获取合同列表失败', err);
    } finally {
        nextTick(() => { recalcTopFixedHeight(); });
    }
}

// 拨打电话
function handleMakePhoneNumber(phoneNumber: string) {
    uni.makePhoneCall({
        phoneNumber
    })
}

// 关联项目点击 → 项目详情（参数口径与项目列表页一致：pid + proname）
function handleJumpProjectChange(p: any) {
    if (!p || !p.id) return;
    uni.navigateTo({
        url: '/projectPages/projectdetail/Index?pid=' + p.id + (p.proname ? '&proname=' + encodeURIComponent(p.proname) : '')
    });
}

// ===== 重点设备/付款状态/审核状态（口径同 web 端 contractlist，2026-11） =====
// 五类重点设备编码与短名（数量取分页行字段，合计徽标口径同 web：当前页求和）
const deviceDefs = [
    { key: 'probeCount', code: 'RJ00013', label: '探针' },
    { key: 'firewallCount', code: 'WC00295', label: '防火墙' },
    { key: 'intrusionDetectionCount', code: 'WC00296', label: '入侵监测' },
    { key: 'bastionHostCount', code: 'ZZ00138', label: '堡垒机' },
    { key: 'securityMonitorType2Count', code: 'ZZ00125', label: '安监Ⅱ型' }
];
// 网安四类（防火墙/入侵监测/堡垒机/网络安全监测装置Ⅱ型，探针不在网安组内），一键全选/反选
const WANAN_CODES = ['WC00295', 'WC00296', 'ZZ00138', 'ZZ00125'];

// 筛选 chip 配色（选中蓝 / 未选中灰，暗色适配）
function chipStyle(active: boolean) {
    return {
        background: active ? 'rgba(0, 122, 255, 0.15)' : (isDark.value ? '#2c2c2c' : '#f2f3f5'),
        color: active ? '#007aff' : (isDark.value ? '#cccccc' : '#4e5969')
    };
}

// 网安勾选态：四类全勾视为选中
const wananActive = computed(() => WANAN_CODES.every((c) => dataForm.deviceTypes.includes(c)));

// 切换单个重点设备类型筛选（改动即查询，口径同 web autoSearch）
function handleToggleDeviceTypeChange(code: string) {
    const idx = dataForm.deviceTypes.indexOf(code);
    if (idx >= 0) {
        dataForm.deviceTypes.splice(idx, 1);
    } else {
        dataForm.deviceTypes.push(code);
    }
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 网安一键全选/反选（保留非网安已选项）
function handleToggleWananChange() {
    const allIn = WANAN_CODES.every((c) => dataForm.deviceTypes.includes(c));
    const rest = dataForm.deviceTypes.filter((c) => !WANAN_CODES.includes(c));
    dataForm.deviceTypes = allIn ? rest : rest.concat(WANAN_CODES);
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 当前页重点设备合计（后端仅返回分页行，全量合计需后端另行支持，口径同 web deviceTotals）
const deviceTotals = computed(() => {
    const totals: Record<string, number> = {};
    deviceDefs.forEach((d) => { totals[d.key] = 0; });
    dataList.value.forEach((row: any) => {
        deviceDefs.forEach((d) => {
            totals[d.key] += Number(row[d.key] ?? 0) || 0;
        });
    });
    return totals;
});

// 付款状态文案与配色（存量数据 paystatus 为空按「待维护」兜底；未付款红/部分付款橙/已付清绿）
const PAY_STATUS_MAP: Record<number, { label: string, color: string }> = {
    0: { label: '未付款', color: '#ee0a24' },
    1: { label: '部分付款', color: '#e6a23c' },
    2: { label: '已付清', color: '#07c160' }
};
function getPayStatusText(item: any) {
    if (item.paystatus == null) return '待维护';
    return PAY_STATUS_MAP[Number(item.paystatus)]?.label || '待维护';
}
function getPayStatusColor(item: any) {
    if (item.paystatus == null) return '#909399';
    return PAY_STATUS_MAP[Number(item.paystatus)]?.color || '#909399';
}

// 重点设备审核状态文案与配色（0 无需审核灰 / 1 待审核橙 / 2 审核通过绿）
const AUDIT_STATUS_MAP: Record<number, { label: string, color: string }> = {
    0: { label: '无需审核', color: '#909399' },
    1: { label: '待审核', color: '#e6a23c' },
    2: { label: '审核通过', color: '#07c160' }
};
function getAuditStatusText(item: any) {
    const s = Number(item.auditStatus ?? 0);
    return AUDIT_STATUS_MAP[s]?.label || '无需审核';
}
function getAuditStatusColor(item: any) {
    const s = Number(item.auditStatus ?? 0);
    return AUDIT_STATUS_MAP[s]?.color || '#909399';
}

// 设置付款状态弹窗（独立接口 updatePaystatus.do，权限 project:Contract:paystatus:update）
const payOptions = [
    { value: 0, label: '未付款' },
    { value: 1, label: '部分付款' },
    { value: 2, label: '已付清' }
];
const paystatusVisible = ref(false);
const paystatusSubmitting = ref(false);
const paystatusRow = ref<any>(null);
const paystatusValue = ref<number | null>(null);
function handleOpenPaystatusChange(item: any) {
    paystatusRow.value = item;
    paystatusValue.value = item.paystatus == null ? null : Number(item.paystatus);
    paystatusVisible.value = true;
}
async function handleSubmitPaystatusChange() {
    if (paystatusValue.value == null) {
        uni.showToast({ icon: 'none', title: '请选择付款状态' });
        return;
    }
    if (paystatusSubmitting.value) return;
    paystatusSubmitting.value = true;
    try {
        await fetchUpdateContractPaystatus({ id: paystatusRow.value.id, paystatus: paystatusValue.value });
        uni.showToast({ icon: 'none', title: '付款状态已更新', duration: 1500 });
        paystatusVisible.value = false;
        dataForm.page = 1;
        dataList.value = [];
        getDataList();
    } catch (err) {
        console.error('更新付款状态失败', err);
    } finally {
        paystatusSubmitting.value = false;
    }
}

// 重点设备审核通过（仅待审核且有权时展示；确认文案口径同 web，设备后续变更会重新进入待审核）
function handleApproveAuditChange(item: any) {
    uni.showModal({
        title: '合同审核确认',
        content: '确认将合同「' + (item.contractname || '') + '」的重点设备审核置为审核通过？设备后续新增、修改、删除或ERP同步后会重新进入待审核。',
        success: async (res) => {
            if (!res.confirm) return;
            try {
                await fetchApproveContractAudit(item.id);
                uni.showToast({ icon: 'none', title: '审核通过', duration: 1500 });
                dataForm.page = 1;
                dataList.value = [];
                getDataList();
            } catch (err) {
                console.error('合同审核失败', err);
            }
        }
    });
}

// 合同设备列表弹窗（projectDevice/getPage.do pids=合同 id，分页加载）
const deviceVisible = ref(false);
const deviceRow = ref<any>(null);
const deviceList = ref<any[]>([]);
const devicePage = ref(1);
const deviceTotal = ref(0);
const deviceState = ref<'loading' | 'loadmore' | 'finished'>('loading');
async function getDeviceDataList() {
    if (!deviceRow.value) return;
    if (devicePage.value === 1) {
        deviceList.value = [];
    }
    deviceState.value = 'loading';
    try {
        const data = await fetchContractDeviceDataList({ page: devicePage.value, limit: 20, pids: deviceRow.value.id, fuzzy: '', _t: new Date().getTime() });
        deviceTotal.value = Number(data.total);
        deviceList.value = deviceList.value.concat(data.list || []);
        deviceState.value = deviceList.value.length < deviceTotal.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取合同设备失败', err);
        deviceState.value = 'loadmore';
    }
}
function handleOpenDeviceChange(item: any) {
    deviceRow.value = item;
    devicePage.value = 1;
    deviceVisible.value = true;
    getDeviceDataList();
}
function handleDeviceScrollToLower() {
    if (deviceState.value !== 'loadmore') return;
    devicePage.value++;
    getDeviceDataList();
}

// 新增、修改合同
const handleJumpChange = (url: string) => {
    uni.navigateTo({
        url
    });
}

// 删除合同（口径同 web：确认后调 /projectContract/delete.do，后端级联删除该合同下所有设备；权限 project:Contract:delete）
function handleDeleteContractChange(item: any) {
    if (!item || !item.id) return;
    uni.showModal({
        title: '删除合同确认',
        content: '确认删除合同「' + (item.contractname || '') + '」？删除合同将删除该合同下所有设备。',
        confirmText: '删除',
        success: async (res) => {
            if (!res.confirm) return;
            try {
                await fetchDeletePrjContractInfo(item.id);
                uni.showToast({ icon: 'none', title: '删除成功', duration: 1500 });
                dataForm.page = 1;
                dataList.value = [];
                getDataList();
            } catch (err) {
                console.error('删除合同失败', err);
            }
        }
    });
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    try {
        uni.createSelectorQuery()
            .select('.topFixedWrap')
            .boundingClientRect((rect: any) => {
                if (rect && rect.height > 0) {
                    topFixedHeight.value = rect.height;
                }
            })
            .exec();
    } catch (err) {
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad(() => {
    getDataList();
    uni.$on('refreshListContract', getDataList); // 监听刷新事件
});

onReady(() => {
    getDataList();
})

onUnload(() => {
    uni.$off('refreshListContract', getDataList); // 页面销毁时解绑
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    dataForm.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (dataList.value.length < dataForm.total) {
        dataForm.page++;
        getDataList();
    } else if (dataList.value.length === dataForm.total) {
        dataForm.state = 'finished';
    }
});

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
    // 可监听窗口尺寸变更（H5 情况），小屏旋转/resize 时重新计算
    try {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', recalcTopFixedHeight);
        }
    } catch (e) { /* ignore */ }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">

        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#f5f6f8' }">
            <wd-navbar left-arrow title="合同列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
            <wd-search v-model="searchKeyword" :placeholder="searchFieldIndex === 0 ? '请输入合同名称' : '请输入合同编号'" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
                cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange">
                <!-- 前置字段选择器（wd-search prefix 插槽，位于搜索胶囊内输入框之前）：合同名称/合同编号切换 -->
                <template #prefix>
                    <view class="searchFieldWrap">
                        <view class="searchFieldTag" @click="handleToggleFieldDropChange">
                            <text class="searchFieldTagText" :style="{ color: isDark ? '#d8d8d8' : '#4e5969' }">{{ searchFieldOptions[searchFieldIndex] }}</text>
                            <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                        <!-- 点击面板外任意处收起（透明遮罩） -->
                        <view v-if="fieldDropVisible" class="fieldDropMask" @click="fieldDropVisible = false"></view>
                        <!-- 字段下拉：直接展示在名称下方（非系统弹窗） -->
                        <view v-if="fieldDropVisible" class="fieldDrop" :style="{ background: isDark ? '#383838' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f1f3' }">
                            <view v-for="(opt, fi) in searchFieldOptions" :key="opt" class="fieldDropItem" @click="handlePickSearchFieldChange(fi)">
                                <text :style="{ color: fi === searchFieldIndex ? '#1677ff' : (isDark ? '#e8e8e8' : '#4e5969'), fontWeight: fi === searchFieldIndex ? '600' : '400' }">{{ opt }}</text>
                                <wd-icon v-if="fi === searchFieldIndex" name="check" size="14px" color="#1677ff" />
                            </view>
                        </view>
                    </view>
                </template>
            </wd-search>
            <!-- 筛选卡片：默认收起整体隐藏（关键词搜索已并入顶部搜索框），展开后日期/关联项目/审核状态/设备类型（样式同规约转换器 fc-cell 设计语言） -->
            <view v-show="filterExpanded" class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                    <view class="fc-row">
                        <view class="fc-field">
                            <picker mode="date" :value="dataForm.startTime || ''" class="fc-picker" @change="(e) => handleDateChange('startTime', e)">
                                <view class="fc-cell" :style="fcCellStyle(!!dataForm.startTime)">
                                    <wd-icon name="calendar" size="16px" :color="isDark ? '#b37feb' : '#722ed1'" />
                                    <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">开始</text>
                                    <text class="fc-text" :style="{ color: dataForm.startTime ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ dataForm.startTime || '查询日期起' }}</text>
                                </view>
                            </picker>
                            <view v-if="dataForm.startTime" class="fc-clear" @click="handleDateClear('startTime')">
                                <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                            <view v-else class="fc-clear"></view>
                        </view>
                        <view class="fc-field">
                            <picker mode="date" :value="dataForm.endTime || ''" class="fc-picker" @change="(e) => handleDateChange('endTime', e)">
                                <view class="fc-cell" :style="fcCellStyle(!!dataForm.endTime)">
                                    <text class="fc-cap fc-cap--lead" :style="{ color: isDark ? '#8a9099' : '#969799' }">结束</text>
                                    <text class="fc-text" :style="{ color: dataForm.endTime ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ dataForm.endTime || '查询日期止' }}</text>
                                </view>
                            </picker>
                            <view v-if="dataForm.endTime" class="fc-clear" @click="handleDateClear('endTime')">
                                <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                            <view v-else class="fc-clear"></view>
                        </view>
                    </view>
                    <!-- 关联项目：选择弹层触发（口径同 web form-search 下拉，projectId 精确查询；web 端此处是分页选择器不是输入框） -->
                    <view class="fc-row">
                        <view class="fc-field">
                            <view class="fc-picker" @click="openProjectPopupChange">
                                <view class="fc-cell" :style="fcCellStyle(selectedProjectId != null)">
                                    <wd-icon name="transfer" size="16px" :color="isDark ? '#69b1ff' : '#1677ff'" />
                                    <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">关联项目</text>
                                    <text class="fc-text" :style="{ color: selectedProjectId != null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ selectedProjectName || '全部项目' }}</text>
                                    <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                                </view>
                            </view>
                            <view v-if="selectedProjectId != null" class="fc-clear" @click="handleClearProjectSelectChange">
                                <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                            <view v-else class="fc-clear"></view>
                        </view>
                    </view>
                    <view class="fc-input" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                        <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">项目关键字</text>
                        <input class="fc-input-core" v-model="dataForm.projectKeyword" type="text" placeholder="项目名称或编号模糊查询" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" confirm-type="search" @confirm="handleSearchChange" />
                        <wd-icon v-if="dataForm.projectKeyword" name="close-circle" size="18px" :color="isDark ? '#8a9099' : '#969799'" @click="handleClearProjectKeywordChange" />
                    </view>
                    <view class="fc-row">
                        <view class="fc-field">
                            <picker mode="selector" :range="auditOptions" class="fc-picker" @change="handleAuditPickChange">
                                <view class="fc-cell" :style="fcCellStyle(dataForm.auditStatus !== '全部')">
                                    <wd-icon name="check-circle" size="16px" :color="isDark ? '#69b1ff' : '#1677ff'" />
                                    <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">审核状态</text>
                                    <text class="fc-text" :style="{ color: dataForm.auditStatus !== '全部' ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ dataForm.auditStatus }}</text>
                                    <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                                </view>
                            </picker>
                            <view v-if="dataForm.auditStatus !== '全部'" class="fc-clear" @click="handleAuditClearChange">
                                <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                            <view v-else class="fc-clear"></view>
                        </view>
                    </view>
                    <!-- 重点设备类型筛选（多选 chip，改动即查询；网安=防火墙/入侵监测/堡垒机/安监Ⅱ型四类一键全选反选，口径同 web） -->
                    <view class="devTypeWrap">
                        <text class="devTypeChip" :class="{ devTypeChipActive: wananActive }" :style="chipStyle(wananActive)" @click="handleToggleWananChange">网安</text>
                        <text v-for="d in deviceDefs" :key="d.code" class="devTypeChip" :class="{ devTypeChipActive: dataForm.deviceTypes.indexOf(d.code) >= 0 }" :style="chipStyle(dataForm.deviceTypes.indexOf(d.code) >= 0)" @click="handleToggleDeviceTypeChange(d.code)">{{ d.label }}</text>
                    </view>
                    <view class="fc-foot">
                        <wd-button size="small" type="info" plain @click="handleResetFiltersChange">重置</wd-button>
                    </view>
            </view>
            <!-- 汇总条：左侧已加载/设备合计，右侧筛选展开收起切换 -->
            <view class="summary-bar" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#f5f6f8' }">
                <view v-if="dataList.length > 0" class="summary-chip" :style="{ background: isDark ? '#323233' : '#f7f8fa' }">
                    <text class="summary-dot"></text>
                    <text class="summary-text" :style="{color: isDark ? '#ffffff' : '#000000'}">已加载 <text class="summary-num">{{ dataList.length }}</text> / 共 <text class="summary-num">{{ dataForm.total }}</text> 条</text>
                </view>
                <!-- 已加载行重点设备合计：每类独立小胶囊（数字>0 蓝色、=0 置灰），替代单枚长胶囊 -->
                <view v-for="d in deviceDefs" :key="'sum-' + d.key" class="summary-chip summary-chip--mini" :style="{ background: isDark ? '#323233' : '#f7f8fa' }">
                    <text class="summary-text" :style="{ color: isDark ? '#ffffff' : '#000000' }">{{ d.label }}</text>
                    <text class="summary-num" :style="{ color: deviceTotals[d.key] ? '#007aff' : (isDark ? '#8a9099' : '#c0c4cc') }">{{ deviceTotals[d.key] }}</text>
                </view>
                <view class="filterToggle summaryToggle" @click="handleToggleFilterExpandChange">
                    <text class="filterToggleText">{{ filterExpanded ? '收起筛选' : '展开更多筛选' }}<text v-if="!filterExpanded && activeFilterCount > 0">（{{ activeFilterCount }}）</text></text>
                    <text class="filterToggleArrow">{{ filterExpanded ? '▲' : '▼' }}</text>
                </view>
            </view>
        </view>

        <view v-if="dataList.length > 0">
            <view v-for="dataItem in dataList" :key="dataItem.id" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
                        <view style="padding: 20rpx;">
                            <view class="prjInfoHeader">
                                <view class="left">
                                    <wd-text bold :text="dataItem.contractname" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                </view>
                                <view class="right">
                                    <text v-if="hasPermission('project:Contract:delete')" class="cardDelBtn" @click.stop="handleDeleteContractChange(dataItem)">删除</text>
                                    <!-- <wd-icon v-if="hasPermission('project:Contract:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addcontract/Index?id=' + dataItem.id)"></wd-icon> -->
                                </view>
                            </view>

                            <view @click="handleJumpChange('/projectPages/contractdetail/Index?id=' + dataItem.id)">
                                <wd-cell title="合同编号" icon="list" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.contractnum" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="商务联系人" icon="user" custom-class="cellClass" custom-value-class="cellValueCss">
                                    <wd-text bold :text="dataItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                    <view v-if="dataItem.businessinfo" @click.stop="handleMakePhoneNumber(dataItem.businessinfo)">
                                        <wd-text :text="' ' + dataItem.businessinfo" type="warning" decoration="underline" />
                                    </view>
                                </wd-cell>

                                <wd-cell title="关联项目" icon="transfer" custom-class="cellClass" center>
                                    <view v-if="(dataItem.projectInfoPojoList || []).length" class="relatedPrjWrap">
                                        <text v-for="(p, pi) in dataItem.projectInfoPojoList" :key="pi" class="relatedPrjItem" @click.stop="handleJumpProjectChange(p)">{{ p.proname }}</text>
                                    </view>
                                    <wd-text v-else bold text="未关联" size="14px" color="#cccccc" />
                                </wd-cell>

								<wd-cell title="付款状态" custom-class="cellClass" custom-value-class="cellValueCss" center>
								    <view style="display: flex; align-items: center; gap: 12rpx;">
								        <text class="statusPill" :style="{ color: getPayStatusColor(dataItem), background: getPayStatusColor(dataItem) + '1a' }">{{ getPayStatusText(dataItem) }}</text>
								        <text v-if="hasPermission('project:Contract:paystatus:update')" style="color: #007aff; font-size: 24rpx;" @click.stop="handleOpenPaystatusChange(dataItem)">设置</text>
								    </view>
								</wd-cell>
								<wd-cell title="审核状态" custom-class="cellClass" custom-value-class="cellValueCss" center>
								    <view style="display: flex; align-items: center; gap: 12rpx;">
								        <text class="statusPill" :style="{ color: getAuditStatusColor(dataItem), background: getAuditStatusColor(dataItem) + '1a' }">{{ getAuditStatusText(dataItem) }}</text>
								        <text v-if="Number(dataItem.auditStatus) === 1 && hasPermission('project:Contract:audit')" style="color: #007aff; font-size: 24rpx;" @click.stop="handleApproveAuditChange(dataItem)">审核通过</text>
								    </view>
								</wd-cell>
								<view @click.stop="handleOpenDeviceChange(dataItem)">
								    <wd-cell title="重点设备" custom-class="cellClass" center is-link>
								        <view class="devCountWrap">
								            <text v-for="d in deviceDefs" :key="d.key" class="devCountItem" :style="{ color: dataItem[d.key] ? '#007aff' : (isDark ? '#666666' : '#c8c9cc') }">{{ d.label }}×{{ dataItem[d.key] || 0 }}</text>
								        </view>
								    </wd-cell>
								</view>
								<wd-cell title="注意事项" custom-class="cellClass" v-if="dataItem.precautions">
								    <wd-text bold :text="dataItem.precautions" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>
								<wd-cell title="备注" icon="note" custom-class="cellClass" v-if="dataItem.notes">
								    <wd-text bold :text="dataItem.notes" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

                                <wd-cell title="创建者" icon="user" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.username" size="14px"
                                        :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="创建时间" icon="time" custom-class="cellClass">
                                    <wd-text bold :text="dataItem.dbtime" size="14px"
                                        :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>
                            </view>
                        </view>
            </view>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)',  margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无合同列表" />
        </view>

        <!-- <wd-fab v-if="hasPermission('project:Contract:insert')" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleJumpChange('/projectPages/addcontract/Index')"></wd-fab> -->

        <!-- 设置付款状态弹窗（独立接口 updatePaystatus.do，权限 project:Contract:paystatus:update，口径同 web 端） -->
        <wd-popup v-model="paystatusVisible" position="bottom" :z-index="1000" :safe-area-inset-bottom="true" custom-style="border-radius: 24rpx 24rpx 0 0;">
            <view class="sheetWrap">
                <view class="sheetTitle">设置付款状态</view>
                <view class="sheetSub">{{ paystatusRow?.contractname }}（{{ paystatusRow?.contractnum }}）</view>
                <view class="payOptWrap">
                    <text v-for="opt in payOptions" :key="opt.value" class="payOptItem" :class="{ payOptActive: paystatusValue === opt.value }" @click="paystatusValue = opt.value">{{ opt.label }}</text>
                </view>
                <view class="sheetBtnWrap">
                    <wd-button size="small" plain @click="paystatusVisible = false">取消</wd-button>
                    <wd-button size="small" type="primary" :loading="paystatusSubmitting" @click="handleSubmitPaystatusChange">确定</wd-button>
                </view>
            </view>
        </wd-popup>

        <!-- 合同设备列表弹窗（projectDevice/getPage.do pids=合同 id，分页加载，口径同 web 端 lookDevice） -->
        <wd-popup v-model="deviceVisible" position="bottom" :z-index="1000" :safe-area-inset-bottom="true" custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0;">
            <view class="sheetWrap" style="height: 100%; display: flex; flex-direction: column;">
                <view class="sheetTitle">{{ deviceRow?.contractname }}的设备</view>
                <scroll-view scroll-y class="deviceScroll" @scrolltolower="handleDeviceScrollToLower">
                    <view v-for="(devItem, devIndex) in deviceList" :key="devItem.id || devIndex" class="deviceItem" :style="{ background: isDark ? '#1b1b1b' : '#f7f8fa' }">
                        <view style="display: flex; justify-content: space-between; align-items: center;">
                            <text style="font-weight: 600; font-size: 28rpx;">{{ devItem.devname }}</text>
                            <text style="color: #007aff; font-weight: 600; font-size: 26rpx;">×{{ devItem.devcount ?? 0 }}</text>
                        </view>
                        <view class="deviceMeta">
                            <text v-if="devItem.devmodel">型号：{{ devItem.devmodel }}</text>
                            <text v-if="devItem.devunit">单位：{{ devItem.devunit }}</text>
                        </view>
                        <view class="deviceMeta">
                            <text v-if="devItem.devmanu">厂家：{{ devItem.devmanu }}</text>
                            <text :style="{ color: Number(devItem.devtype) === 0 ? '#07c160' : '#3a7afe' }">{{ Number(devItem.devtype) === 0 ? '我司厂家' : '非我司厂家' }}</text>
                        </view>
                        <view class="deviceMeta" v-if="devItem.notes">
                            <text>备注：{{ devItem.notes }}</text>
                        </view>
                        <view class="deviceMeta">
                            <text style="opacity: 0.6;">{{ devItem.username }} {{ devItem.dbtime }}</text>
                        </view>
                    </view>
                    <view v-if="deviceState === 'finished' && deviceList.length" class="deviceLoadTip">没有更多了</view>
                    <view v-if="!deviceList.length && deviceState === 'finished'" class="deviceLoadTip">暂无设备数据</view>
                </scroll-view>
            </view>
        </wd-popup>

        <!-- 关联项目选择弹层：projectInfo/getPage.do 分页 + fuzzy 搜索，选中 projectId 精确查询（口径同 web form-search 关联项目下拉） -->
        <wd-popup v-model="projectPopup" position="bottom" :z-index="1000" :safe-area-inset-bottom="true" custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
            <view class="sheetWrap" style="height: 100%; display: flex; flex-direction: column;">
                <view style="display: flex; align-items: center; justify-content: space-between;">
                    <view class="sheetTitle" style="flex: 1;">选择关联项目</view>
                    <wd-icon name="close" size="20px" :color="isDark ? '#8a9099' : '#969799'" @click="projectPopup = false" />
                </view>
                <wd-search v-model="prjKeyword" placeholder="搜索项目名称" placeholder-left cancel-txt="搜索"
                    @search="loadProjectOptions(prjKeyword, true)" @cancel="loadProjectOptions(prjKeyword, true)" @clear="loadProjectOptions()" />
                <scroll-view scroll-y class="prjPopupScroll" @scrolltolower="loadMoreProjectOptions">
                    <view class="prjPopupItem" :style="{ background: isDark ? '#1b1b1b' : '#f7f8fa' }" @click="handleSelectProjectChange({ id: null, proname: '' })">
                        <text :style="{ color: selectedProjectId == null ? '#1677ff' : (isDark ? '#e8e8e8' : '#1a1a1a') }">全部项目</text>
                        <wd-icon v-if="selectedProjectId == null" name="check" size="16px" color="#1677ff" />
                    </view>
                    <view v-for="p in prjList" :key="String(p.id)" class="prjPopupItem" :style="{ background: isDark ? '#1b1b1b' : '#f7f8fa' }" @click="handleSelectProjectChange(p)">
                        <text :style="{ color: String(selectedProjectId) === String(p.id) ? '#1677ff' : (isDark ? '#e8e8e8' : '#1a1a1a') }">{{ p.proname }}</text>
                        <wd-icon v-if="String(selectedProjectId) === String(p.id)" name="check" size="16px" color="#1677ff" />
                    </view>
                    <view v-if="prjLoading && prjList.length" class="deviceLoadTip">加载中...</view>
                    <view v-if="!prjLoading && !prjList.length" class="deviceLoadTip">暂无匹配项目</view>
                </scroll-view>
            </view>
        </wd-popup>

        <wd-backtop :bottom="105" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    /* 保证内联元素正确换行 */
    box-sizing: border-box;
    /* 可选：微阴影让固定区更明显 */
    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
}

/* ===== 筛选卡片（同规约转换器 fc-cell 设计语言：选中淡蓝描边，未选中灰底） ===== */
.filter-card {
    margin: 4rpx 20rpx 0;
    padding: 20rpx;
    border-radius: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.fc-row {
    display: flex;
    gap: 16rpx;
}

.fc-field {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.fc-picker {
    flex: 1;
    min-width: 0;
}

.fc-cell {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 16rpx 18rpx;
    border-radius: 14rpx;
    border: 1rpx solid transparent;
}

.fc-cap {
    flex-shrink: 0;
    font-size: 22rpx;
}

.fc-cap--lead {
    width: 58rpx;
}

.fc-text {
    flex: 1;
    min-width: 0;
    text-align: right;
    font-size: 24rpx;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.fc-clear {
    flex: 0 0 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.fc-input {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 16rpx 18rpx;
    border-radius: 14rpx;
}

.fc-input-core {
    flex: 1;
    min-width: 0;
    height: 40rpx;
    font-size: 26rpx;
}

.pc-grey {
    color: #bfbfbf;
}

/* 搜索框前置字段下拉（点击名称直接在下方展示选项，非系统弹窗） */
.searchFieldWrap {
    position: relative;
    flex-shrink: 0;
}

.searchFieldTag {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 0 14rpx 0 6rpx;
}

.searchFieldTagText {
    font-size: 26rpx;
    font-weight: 600;
    white-space: nowrap;
}

/* 点外部收起的透明遮罩（fixed 全屏，位于面板之下） */
.fieldDropMask {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 998;
}

.fieldDrop {
    position: absolute;
    top: calc(100% + 10rpx);
    left: 0;
    min-width: 200rpx;
    padding: 8rpx 0;
    border-radius: 12rpx;
    border: 1rpx solid #f0f1f3;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.12);
    z-index: 999;
}

.fieldDropItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rpx;
    padding: 16rpx 24rpx;
    font-size: 26rpx;
    white-space: nowrap;
}

.fc-foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

/* 筛选区展开/收起切换行 */
.filterToggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 14rpx 0 16rpx;
}

.filterToggleText {
    font-size: 24rpx;
    color: #007aff;
}

.filterToggleArrow {
    font-size: 20rpx;
    color: #007aff;
}

/* 切换入口移入汇总条右侧（窄屏 chips 换行时自动落到下一行右对齐） */
.summaryToggle {
    margin-left: auto;
    padding: 8rpx 0;
}

.summary-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8rpx;
    padding: 0 24rpx 14rpx;
}

.summary-chip {
    display: inline-flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 999rpx;
    background: #f7f8fa;
    border: 1rpx solid #f0f1f3;
    font-size: 24rpx;
    color: #4e5969;
}

.summary-dot {
    width: 8rpx;
    height: 8rpx;
    border-radius: 50%;
    background: #007aff;
}

.summary-num {
    color: #007aff;
    font-weight: 600;
}

/* 已加载合计拆分后的单类小胶囊 */
.summary-chip--mini {
    padding: 8rpx 16rpx;
    gap: 8rpx;
}

/* 关联项目：卡片内右对齐的可点项目名胶囊（同 web 端合同列表关联项目列，后端 20261103 起分页行返回 projectInfoPojoList） */
.relatedPrjWrap {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8rpx;
}

.relatedPrjItem {
    max-width: 420rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 26rpx;
    font-weight: 600;
    color: #007aff;
    background: rgba(0, 122, 255, 0.12);
    border-radius: 8rpx;
    padding: 4rpx 12rpx;
}

.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10rpx 0 !important;
    margin-bottom: 20rpx;

    .left {
        display: flex;
        align-items: center;
        margin-left: 10rpx;
        width: calc(100vw - 190px);
    }

    .right {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0 20rpx;
    }
}

/* 卡片头删除按钮（描边胶囊，文字承载语义） */
.cardDelBtn {
    flex: none;
    color: #ee0a24;
    font-size: 24rpx;
    line-height: 1;
    padding: 8rpx 22rpx;
    border: 1rpx solid rgba(238, 10, 36, 0.45);
    border-radius: 999rpx;
}

:deep(.cellClass) {
    padding: 0 !important;
    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}
:deep(.cellValueCss) {
    display: flex;
    align-items: center;
    gap: 0 10rpx;
    justify-content:flex-end;
}
/* 重点设备类型筛选 chips（多选，改动即查询；网安=四类一键全选反选；置于筛选卡片内，间距由卡片 gap 提供） */
.devTypeWrap {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.devTypeChip {
    font-size: 24rpx;
    padding: 8rpx 24rpx;
    border-radius: 999rpx;
}

.devTypeChipActive {
    font-weight: 600;
}

/* 付款状态/审核状态胶囊（底色由行内 style 按 8 位 hex 透明度生成） */
.statusPill {
    font-size: 24rpx;
    padding: 4rpx 16rpx;
    border-radius: 999rpx;
    font-weight: 600;
}

/* 重点设备数量 chips（卡片行内，0 时置灰） */
.devCountWrap {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8rpx 16rpx;
}

.devCountItem {
    font-size: 24rpx;
    font-weight: 600;
}

/* 底部弹窗通用 */
.sheetWrap {
    padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
}

.sheetTitle {
    font-size: 32rpx;
    font-weight: 600;
    text-align: center;
}

.sheetSub {
    font-size: 24rpx;
    opacity: 0.7;
    text-align: center;
    margin-top: 12rpx;
}

.payOptWrap {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    justify-content: center;
    margin: 30rpx 0;
}

.payOptItem {
    font-size: 26rpx;
    padding: 12rpx 32rpx;
    border-radius: 999rpx;
    background: #f2f3f5;
    color: #4e5969;
}

.payOptActive {
    background: rgba(0, 122, 255, 0.15);
    color: #007aff;
    font-weight: 600;
}

.sheetBtnWrap {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
}

.deviceScroll {
    flex: 1;
    min-height: 0; /* 弹窗内 scroll-view 必须，同日报报表页弹窗 */
    margin-top: 20rpx;
}

.deviceItem {
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
}

.deviceMeta {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
    font-size: 24rpx;
    opacity: 0.75;
    margin-top: 8rpx;
}

.deviceLoadTip {
    text-align: center;
    font-size: 24rpx;
    opacity: 0.6;
    padding: 16rpx 0 30rpx;
}

/* 关联项目选择弹层（分页+fuzzy，选中即查） */
.prjPopupScroll {
    flex: 1;
    min-height: 0; /* 弹窗内 scroll-view 必须，同日报报表页弹窗 */
    margin-top: 20rpx;
}

.prjPopupItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16rpx;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
    font-size: 28rpx;
}

.prjPopupItem text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}
</style>