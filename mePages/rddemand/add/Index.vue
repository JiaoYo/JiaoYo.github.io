<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow :title="isEdit ? '编辑需求' : '新增需求'" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <scroll-view scroll-y class="scroll-content">
            <view class="form-section">
                <view class="form-title">基本信息</view>
                <view class="form-item">
                    <text class="form-label required">需求名称</text>
                    <wd-input v-model="form.dname" placeholder="请输入需求名称" placeholder-class="placeholder-class" />
                </view>
                <view class="form-item">
                    <text class="form-label">所属产品</text>
                    <picker mode="selector" :range="productList" range-key="rdname" @change="handleProductChange">
                        <view class="form-picker">{{ form.rdname || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
                <view class="form-item">
                    <text class="form-label required">评审人</text>
                    <picker mode="selector" :range="reviewerList" range-key="label" @change="handleReviewerChange">
                        <view class="form-picker">{{ form.reviewerName || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
                <view class="form-item">
                    <text class="form-label required">优先级</text>
                    <picker mode="selector" :range="priorityList" range-key="label" @change="handlePriorityChange">
                        <view class="form-picker">{{ form.priorityLabel || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
                <view class="form-item">
                    <text class="form-label">需求来源</text>
                    <view class="radio-row">
                        <view class="radio-item" :class="{ active: form.dsource === 0 }" @click="handleDsourceChange(0)">内部需求</view>
                        <view class="radio-item" :class="{ active: form.dsource === 1 }" @click="handleDsourceChange(1)">三方合同</view>
                    </view>
                </view>
                <view v-if="form.dsource === 1" class="form-item">
                    <text class="form-label required">合同编号</text>
                    <view class="form-picker" @click="openContractPicker">{{ form.contractnum || '请选择合同（编号/名称可搜索）' }} <text class="arrow">›</text></view>
                    <view v-if="selectedContract" class="contract-info">
                        <text class="contract-name">{{ selectedContract.contractname || '-' }}</text>
                        <view class="paystatus-tag" :style="payStatusStyle(selectedContract.paystatus)">{{ selectedContract.paystatus == null ? '待维护' : (contractPayStatus[selectedContract.paystatus] ?? '待维护') }}</view>
                    </view>
                    <view v-if="selectedContract && selectedContractUnpaid" class="unpaid-tip">{{ unpaidTip }}</view>
                </view>
                <view class="form-item">
                    <text class="form-label">期望完成时间</text>
                    <picker mode="date" :value="form.ctime" :start="dateStart" @change="handleDateChange">
                        <view class="form-picker">{{ form.ctime || '请选择' }} <text class="arrow">›</text></view>
                    </picker>
                </view>
            </view>
            <view class="form-section">
                <view class="form-title">需求描述</view>
                <wd-textarea v-model="form.ddesc" placeholder="请输入需求描述" :maxlength="2000" />
            </view>
            <view class="form-section">
                <view class="form-title">验收标准</view>
                <wd-textarea v-model="form.dnotes" placeholder="请输入验收标准" :maxlength="2000" />
            </view>
            <view class="form-section">
                <view class="form-title">附件 <text class="title-tip">(最多5个)</text></view>
                <view v-if="existFiles.length > 0" class="file-list">
                    <view v-for="(item, index) in existFiles" :key="item.id" class="file-item">
                        <text class="file-name">{{ item.fname }}</text>
                        <text class="file-remove" @click.stop="handleRemoveExistFile(index)">×</text>
                    </view>
                </view>
                <CjxUpload v-model="fileList" :limit="5" :multiple="true" @change="handleFileChange">
                    <view class="upload-area">
                        <view class="upload-icon"><wd-icon name="upload" size="24px" color="#1677ff"></wd-icon></view>
                        <view class="upload-info"><text class="upload-name">点击选择文件</text><text class="upload-tip">支持 PDF/Word/Excel/图片等</text></view>
                    </view>
                </CjxUpload>
                <view v-if="fileList.length > 0" class="file-list">
                    <view v-for="(item, index) in fileList" :key="index" class="file-item">
                        <text class="file-name">{{ item.name }}</text>
                        <text class="file-remove" @click.stop="handleRemoveFile(index)">×</text>
                    </view>
                </view>
            </view>
            <view class="form-section">
                <view class="form-title">标签</view>
                <wd-input v-model="form.label" placeholder="多个标签用逗号分隔，单个不超过6个字" placeholder-class="placeholder-class" />
            </view>
            <view class="form-section">
                <view class="form-title">抄送人 <text class="title-tip">(可多选)</text></view>
                <view class="cc-tags">
                    <view v-for="user in userList" :key="user.id" class="cc-tag" :class="{ active: selectedCcIds.includes(user.id) }" @click="toggleCc(user)">{{ user.username }}</view>
                </view>
                <view v-if="selectedCcNames.length > 0" class="selected-cc"><text class="selected-label">已选：</text><text class="selected-names">{{ selectedCcNames.join('、') }}</text></view>
            </view>
            <view class="form-actions"><wd-button type="primary" size="large" :loading="submitting" @click="handleSubmit" style="width:100%">{{ isEdit ? '保存' : '提交' }}</wd-button></view>
        </scroll-view>
        <!-- 合同选择弹层：搜索 + 触底翻页（口径同 web，limit 100） -->
        <wd-popup v-model="contractPickerOpen" position="bottom" :z-index="1000" custom-style="height: 70vh; background: transparent;">
            <view class="contract-popup" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                <view class="popup-head">
                    <text class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">选择合同</text>
                    <wd-icon name="close" size="20px" :color="isDark ? '#8a9099' : '#999'" @click="contractPickerOpen = false" />
                </view>
                <wd-search v-model="contractKeyword" placeholder="搜索合同编号或名称" placeholder-left cancel-txt="搜索" @search="searchContracts" @cancel="searchContracts" @clear="clearContractSearch" />
                <scroll-view :scroll-y="true" class="popup-list" @scrolltolower="loadNextContracts">
                    <view v-for="c in contractOptions" :key="c.contractnum" class="popup-item" @click="pickContract(c)">
                        <text class="popup-item-name" :style="{ color: c.contractnum === form.contractnum ? '#1677ff' : (isDark ? '#c9cdd4' : '#323233') }">{{ c.contractnum }} - {{ c.contractname }}</text>
                        <wd-icon v-if="c.contractnum === form.contractnum" name="check" size="16px" color="#1677ff" />
                    </view>
                    <view v-if="contractLoading && !contractList.length" class="popup-tip"><wd-loading :size="20" color="#1677ff" /></view>
                    <view v-else-if="!contractLoading && !contractOptions.length" class="popup-tip"><text :style="{ color: isDark ? '#8a9099' : '#999' }">暂无匹配合同</text></view>
                    <wd-loadmore v-else :state="contractState" />
                </scroll-view>
            </view>
        </wd-popup>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchAddRdDemand, fetchUpdateRdDemand, fetchRdDemandInfo, fetchRdProjectPage, fetchAddRdFile, fetchDeleteRdFile, fetchRdFilePage, fetchRdCopy, fetchAddRdCopy, fetchDeleteRdCopy, fetchGetContractList } from "@/service/rddemand";
import { fetchGetAllUserDataList } from "@/service/member";
import { rdprjTypeOptions1, rdprjLevelOptions, contractPayStatus } from "@/constants/rdPrj";
import { uploadFile } from '@/utils/uploadFile';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
// 暗黑模式：页面底色 + CSS 变量统一控制卡片/输入/标签底色（样式里用 var(--rd-*, 浅色默认) 取值，方案同 rddemand 详情页）
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh';
    return 'min-height: 100vh; background: #1b1b1b; --rd-card-bg: #2a2a2a; --rd-title: #e8e8e8; --rd-text: #c9cdd4; --rd-secondary: #8a9099; --rd-line: rgba(255, 255, 255, 0.12); --rd-field-bg: #333333; --rd-link: #69b1ff; --rd-file-bg: rgba(22, 119, 255, 0.15); --rd-file-line: rgba(22, 119, 255, 0.35); --rd-chip-color: #69b1ff;';
});
const submitting = ref(false);
const uploading = ref(false);
const isEdit = ref(false);
const demandId = ref<number | null>(null);
const oldRdtype = ref<any>(null);
const productList = ref<any[]>([]);
const reviewerList = ref<any[]>(rdprjTypeOptions1);
const priorityList = ref<any[]>(rdprjLevelOptions);
const userList = ref<any[]>([]);
const selectedCcIds = ref<string[]>([]);
const selectedCcNames = computed(() => userList.value.filter(u => selectedCcIds.value.includes(u.id)).map(u => u.username));
const fileList = ref<any[]>([]);
// 编辑态已有附件（提交时与加载快照 oldFileIds 做 diff，被移除的调删除接口）
const existFiles = ref<any[]>([]);
const oldFileIds = ref<number[]>([]);
// 抄送人 diff 用：编辑打开时的原始抄送行
const oldCcRows = ref<any[]>([]);
const contractList = ref<any[]>([]);
// 编辑回显：当前合同可能不在第一页，按编号补查置顶（口径同 web pinnedContract）
const pinnedContract = ref<any>(null);
// detail 接口原始行：编辑提交整体 spread（口径同 web Object.assign(model, rowData)）
const rawRow = ref<any>(null);

// 合同选择弹层：搜索（含中文按名称 fuzzy 查，否则按编号查）+ 触底翻页，limit 100（口径同 web）
const contractPickerOpen = ref(false);
const contractKeyword = ref('');
const contractSearch = ref<{ fuzzy?: string; contractnum?: string }>({});
const contractPage = ref(1);
const contractTotal = ref(0);
const contractState = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore');
let contractLoading = false;
let contractPendingReload = false;

const contractOptions = computed(() => {
    const opts = contractList.value.map((c: any) => ({ ...c, label: (c.contractnum ?? '') + ' - ' + (c.contractname ?? '') }));
    if (pinnedContract.value && !contractList.value.some((c: any) => c.contractnum === pinnedContract.value.contractnum)) {
        opts.unshift({ ...pinnedContract.value, label: (pinnedContract.value.contractnum ?? '') + ' - ' + (pinnedContract.value.contractname ?? '') });
    }
    return opts;
});
const selectedContract = computed(() => {
    if (!form.value.contractnum) return null;
    if (pinnedContract.value?.contractnum === form.value.contractnum) return pinnedContract.value;
    return contractList.value.find((c: any) => c.contractnum === form.value.contractnum) || { contractnum: form.value.contractnum };
});
// 合同未付款（含存量 paystatus 缺失，按未付款处理，口径同 web）
const selectedContractUnpaid = computed(() => {
    const ps = selectedContract.value?.paystatus;
    return ps === 0 || ps === '0' || ps == null;
});
// 未付款提示：告知创建人后果与处理路径（文案同 web unpaidTip）
const unpaidTip = computed(() => {
    const c = selectedContract.value;
    const state = c?.paystatus == null ? '付款状态未维护' : '未付款';
    const who = c?.businesscon ? `请联系商务负责人 ${c.businesscon}${c.businessinfo ? `（${c.businessinfo}）` : ''}` : '请联系商务负责人';
    return `该合同${state}，研发任务需待合同付款后才能创建，${who}确认付款状态`;
});
function payStatusStyle(ps: any) {
    const t = ps == null ? '#909399' : (({ 0: '#f5222d', 1: '#fa8c16', 2: '#52c41a' } as any)[Number(ps)] || '#909399');
    return { background: t + '1a', color: t };
}
// 新增时限选今天及以后（口径同 web isDateDisabled 仅 add 生效，编辑不限制）
const dateStart = computed(() => {
    if (isEdit.value) return '';
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
});

const form = ref<any>({ pid: null, dname: "", rdtype: null, rdname: "", reviewer: null, reviewerName: "", priority: null, priorityLabel: "", ctime: "", ddesc: "", dnotes: "", label: "", dsource: 0, contractnum: null as string | null });

async function getProductList() { try { const data: any = await fetchRdProjectPage({ page: 1, limit: 200 }); productList.value = data.list || []; } catch (err) { console.error('获取产品列表失败', err); } }
async function getUserList() { try { const data: any = await fetchGetAllUserDataList({ page: 1, limit: 200, usertypes: '5,8' }); const list = data.list.filter((item: any) => item.status == 0) || []; list.unshift({ id: '999', username: '李吉峰' }); if (!list.some((u: any) => u.id === '1030')) list.splice(1, 0, { id: '1030', username: '徐顺乐' }); if (!list.some((u: any) => u.id === '1036')) list.splice(2, 0, { id: '1036', username: '孙东洪' }); userList.value = list; } catch (err) { console.error('获取用户列表失败', err); } }
async function loadContracts(page: number) {
    if (contractLoading) { contractPendingReload = true; return; }
    contractLoading = true;
    contractState.value = 'loading';
    try {
        const params: any = { page, limit: 100 };
        if (contractSearch.value.fuzzy) params.fuzzy = contractSearch.value.fuzzy;
        if (contractSearch.value.contractnum) params.contractnum = contractSearch.value.contractnum;
        const data: any = await fetchGetContractList(params);
        const list = data.list || [];
        contractList.value = page === 1 ? list : contractList.value.concat(list);
        contractTotal.value = Number(data.total) || 0;
        contractPage.value = page;
        contractState.value = contractList.value.length < contractTotal.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取合同列表失败', err);
        contractState.value = 'error';
    } finally {
        contractLoading = false;
        if (contractPendingReload) { contractPendingReload = false; loadContracts(contractPage.value); }
    }
}

function openContractPicker() {
    contractPickerOpen.value = true;
    if (!contractList.value.length) loadContracts(1);
}

// 输入含中文按合同名称(fuzzy)查，否则按合同编号(contractnum)查（口径同 web）
function searchContracts() {
    const kw = contractKeyword.value.trim();
    contractSearch.value = /[一-龥]/.test(kw) ? { fuzzy: kw } : (kw ? { contractnum: kw } : {});
    loadContracts(1);
}

function clearContractSearch() {
    contractKeyword.value = '';
    contractSearch.value = {};
    loadContracts(1);
}

// 触底加载下一页
function loadNextContracts() {
    if (!contractLoading && contractList.value.length < contractTotal.value) loadContracts(contractPage.value + 1);
}

function pickContract(c: any) {
    form.value.contractnum = c.contractnum ?? null;
    // 所选合同置顶：清空搜索/翻页后仍能显示合同名与付款状态
    pinnedContract.value = c;
    contractPickerOpen.value = false;
    if (contractKeyword.value || contractSearch.value.fuzzy || contractSearch.value.contractnum) {
        contractKeyword.value = '';
        contractSearch.value = {};
        loadContracts(1);
    }
}

function handleDsourceChange(v: number) {
    form.value.dsource = v;
    // 切回内部需求清空合同编号（后端同样会清空）；切到三方合同按需拉取合同列表（口径同 web watch dsource）
    if (v === 0) { form.value.contractnum = null; pinnedContract.value = null; }
    else if (!contractList.value.length) loadContracts(1);
}

// 编辑回显时当前合同不在第一页则按编号精确补查置顶（口径同 web initContractList）
async function ensureContractPinned(contractnum: string | null) {
    if (!contractnum) return;
    pinnedContract.value = null;
    if (!contractList.value.length) await loadContracts(1);
    if (contractList.value.some((c: any) => c.contractnum === contractnum)) return;
    try {
        const data: any = await fetchGetContractList({ page: 1, limit: 50, contractnum });
        const hit = (data.list || []).find((c: any) => c.contractnum === contractnum);
        if (hit) pinnedContract.value = hit;
    } catch (err) { console.error('合同补查失败', err); }
}

// 编辑态加载：需求详情 + 抄送人 + 附件
async function loadDetail(id: number) {
    try {
        uni.showLoading({ title: '加载中...' });
        const row: any = await fetchRdDemandInfo(id);
        rawRow.value = row;
        form.value.pid = row.pid ?? null;
        form.value.dname = row.dname || '';
        form.value.rdtype = row.rdtype ?? null;
        oldRdtype.value = row.rdtype ?? null;
        form.value.rdname = row.rdname || '';
        form.value.reviewerName = rdprjTypeOptions1.find((o: any) => o.value === row.rdtype)?.label || '';
        form.value.priority = row.priority ?? null;
        form.value.priorityLabel = priorityList.value.find((o: any) => o.value === row.priority)?.label || '';
        form.value.ctime = row.ctime || '';
        form.value.ddesc = row.ddesc || '';
        form.value.dnotes = row.dnotes || '';
        form.value.label = row.label || '';
        // 存量数据可能没有 dsource/contractnum，按内部需求兜底（口径同 web handleInitModel）
        form.value.dsource = row.dsource ?? 0;
        form.value.contractnum = row.contractnum ?? null;
        const ccRes: any = await fetchRdCopy({ pid: id, page: 1, limit: 100 });
        const ccList = ccRes.list || [];
        oldCcRows.value = ccList;
        selectedCcIds.value = ccList.map((item: any) => String(item.cc));
        const fileRes: any = await fetchRdFilePage({ proid: row.pid, pid: id, page: 1, limit: 100, ftype: 0 });
        existFiles.value = (fileRes.list || []).map((item: any) => ({ id: item.id, fname: item.fname, furl: item.furl }));
        oldFileIds.value = existFiles.value.map((f: any) => f.id);
        if (form.value.dsource === 1) await ensureContractPinned(form.value.contractnum);
        uni.hideLoading();
    } catch (err) { uni.hideLoading(); console.error('加载需求详情失败', err); }
}

function toggleCc(user: any) { const idx = selectedCcIds.value.indexOf(user.id); if (idx > -1) selectedCcIds.value.splice(idx, 1); else selectedCcIds.value.push(user.id); }

function handleFileChange(list: any[]) { console.log('文件列表已更新:', list); }
function handleRemoveFile(index: number) { fileList.value.splice(index, 1); }
function handleRemoveExistFile(index: number) { existFiles.value.splice(index, 1); }

function handleClickLeft() { uni.navigateBack(); }
function handleProductChange(e: any) { const idx = e.detail.value; const item = productList.value[idx]; form.value.pid = item?.id ?? null; form.value.rdname = item?.rdname ?? ""; }
function handleReviewerChange(e: any) { const idx = e.detail.value; const item = reviewerList.value[idx]; form.value.rdtype = item?.value ?? null; form.value.reviewerName = item?.label || ""; }
function handlePriorityChange(e: any) { const idx = e.detail.value; const item = priorityList.value[idx]; form.value.priority = item?.value ?? null; form.value.priorityLabel = item?.label || ""; }
function handleDateChange(e: any) { form.value.ctime = e.detail.value; }

// 单个文件上传 → 返回服务器路径
function uploadOne(file: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        uploading.value = true;
        uploadFile(
            file,
            '',
            (response: any) => {
                uploading.value = false;
                const url = response && (response.data || response.url || response);
                if (url) resolve(String(url));
                else reject(new Error('上传失败'));
            },
            () => { uploading.value = false; reject(new Error('上传失败')); }
        );
    });
}

// 新附件上传后落库（pid=需求 id，proid=所属产品 id，ftype 0=研发需求文件；口径同 web fetchAddRdFile 映射）
async function saveNewFiles(demandPid: number) {
    if (fileList.value.length === 0) return;
    const results: any[] = [];
    for (const file of fileList.value) {
        const url = await uploadOne(file);
        results.push({ furl: url, fname: file.name, pid: demandPid, proid: form.value.pid, ftype: 0 });
    }
    await fetchAddRdFile(results);
}

async function handleSubmit() {
    if (submitting.value) return;
    if (!form.value.dname) { uni.showToast({ title: "请输入需求名称", icon: "none" }); return; }
    if (form.value.rdtype === null) { uni.showToast({ title: "请选择评审人", icon: "none" }); return; }
    if (form.value.priority === null) { uni.showToast({ title: "请选择优先级", icon: "none" }); return; }
    if (form.value.dsource === 1 && !form.value.contractnum) { uni.showToast({ title: "请选择合同编号", icon: "none" }); return; }
    submitting.value = true;
    try {
        if (isEdit.value && demandId.value) {
            const pid = demandId.value;
            // 附件 diff：新增上传落库、被移除的删除（口径同 web 编辑分支顺序：传文件→加文件→更新需求→删文件）
            await saveNewFiles(pid);
            const keptIds = existFiles.value.map((f: any) => f.id);
            const deletedIds = oldFileIds.value.filter((id: number) => !keptIds.includes(id));
            // 抄送人 diff：新增/删除（口径同 web oldCcList/newCcList 比对）
            const oldCc = oldCcRows.value.map((r: any) => String(r.cc));
            const newCc = selectedCcIds.value.map(String);
            const addList = newCc.filter((cc: string) => !oldCc.includes(cc));
            const delRows = oldCcRows.value.filter((r: any) => !newCc.includes(String(r.cc)));
            // 需求更新：原始行 spread + 覆盖编辑字段；评审人只有真正改动才提交（口径同 web rdtype !== oldRdtype）
            const params: any = JSON.parse(JSON.stringify(rawRow.value || {}));
            delete params.rdFilePojoList;
            params.id = pid;
            params.dname = form.value.dname;
            params.pid = form.value.pid;
            params.priority = form.value.priority;
            params.ctime = form.value.ctime;
            params.ddesc = form.value.ddesc;
            params.dnotes = form.value.dnotes;
            params.label = form.value.label;
            params.dsource = form.value.dsource;
            params.contractnum = form.value.dsource === 1 ? form.value.contractnum : null;
            params.rdtype = form.value.rdtype !== oldRdtype.value ? form.value.rdtype : undefined;
            await fetchUpdateRdDemand(params);
            if (deletedIds.length > 0) await fetchDeleteRdFile(deletedIds.join(','));
            if (addList.length > 0) await fetchAddRdCopy(addList.map((cc: string) => ({ cc, pid })));
            if (delRows.length > 0) await fetchDeleteRdCopy(delRows.map((r: any) => r.id).join(','));
            uni.showToast({ title: "保存成功", icon: "success" });
        } else {
            const params: any = { dname: form.value.dname, rdtype: form.value.rdtype, priority: form.value.priority, dsource: form.value.dsource };
            if (form.value.pid !== null) params.pid = form.value.pid;
            if (form.value.ctime) params.ctime = form.value.ctime;
            if (form.value.ddesc) params.ddesc = form.value.ddesc;
            if (form.value.dnotes) params.dnotes = form.value.dnotes;
            if (form.value.label) params.label = form.value.label;
            if (form.value.dsource === 1) params.contractnum = form.value.contractnum;
            // 抄送人随需求一起新增（口径同 web rdDemandCcPojoList）
            if (selectedCcIds.value.length > 0) params.rdDemandCcPojoList = selectedCcIds.value.map((cc: string) => ({ cc }));
            const res: any = await fetchAddRdDemand(params);
            if (fileList.value.length > 0) await saveNewFiles(Number(res));
            uni.showToast({ title: "提交成功", icon: "success" });
        }
        uni.$emit("refreshRdDemandList");
        setTimeout(() => { uni.navigateBack(); }, 1500);
    } catch (err: any) {
        console.error('提交失败', err);
        uni.showToast({ title: err?.msg || (isEdit.value ? "保存失败" : "提交失败"), icon: "none" });
    } finally {
        submitting.value = false;
    }
}

onLoad((options: any) => {
    if (options.id) {
        isEdit.value = true;
        demandId.value = Number(options.id);
        loadDetail(demandId.value);
    }
});
getProductList(); getUserList();
</script>
<style lang="scss" scoped>
.scroll-content { height: calc(100vh - 88rpx); }
.form-section { background: var(--rd-card-bg, #fff); margin: 24rpx; border-radius: 16rpx; padding: 32rpx; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04); }
.form-title { font-size: 32rpx; font-weight: 600; color: var(--rd-title, #1a1a1a); margin-bottom: 28rpx; padding-left: 16rpx; border-left: 6rpx solid #1677ff; }
.title-tip { font-size: 24rpx; font-weight: 400; color: var(--rd-secondary, #999); margin-left: 12rpx; }
.form-item { margin-bottom: 32rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { display: block; font-size: 28rpx; color: var(--rd-text, #323233); margin-bottom: 16rpx; }
.form-label.required::before { content: "*"; color: #f5222d; margin-right: 8rpx; }
.form-picker { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; background: var(--rd-field-bg, #f7f8fa); border-radius: 16rpx; font-size: 28rpx; color: var(--rd-text, #323233); }
.form-picker .arrow { font-size: 36rpx; color: var(--rd-secondary, #c8c9cc); }
.placeholder-class { color: #c0c4cc; }
.radio-row { display: flex; gap: 16rpx; }
.radio-item { padding: 16rpx 40rpx; background: var(--rd-field-bg, #f5f5f5); border-radius: 32rpx; font-size: 26rpx; color: var(--rd-secondary, #666); border: 2rpx solid transparent; }
.radio-item.active { background: rgba(22, 119, 255, 0.12); color: var(--rd-chip-color, #1677ff); border-color: var(--rd-chip-color, #1677ff); }
.contract-info { display: flex; align-items: center; gap: 16rpx; margin-top: 16rpx; }
.contract-name { font-size: 26rpx; color: var(--rd-text, #333); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.paystatus-tag { flex-shrink: 0; padding: 4rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; }
.unpaid-tip { margin-top: 12rpx; font-size: 24rpx; color: #d03050; line-height: 1.5; }
.form-actions { padding: 32rpx 24rpx; }
.upload-area { display: flex; align-items: center; gap: 20rpx; padding: 24rpx; border-radius: 16rpx; border: 2rpx dashed var(--rd-line, #c1c9d6); background: var(--rd-field-bg, #f8fafc); }
.upload-icon { width: 72rpx; height: 72rpx; border-radius: 16rpx; background: rgba(22, 119, 255, 0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.upload-info { display: flex; flex-direction: column; gap: 4rpx; min-width: 0; }
.upload-name { font-size: 28rpx; color: var(--rd-title, #1a1a1a); }
.upload-tip { font-size: 22rpx; color: var(--rd-secondary, #86909c); }
.file-list { margin-top: 16rpx; }
.file-item { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 20rpx; margin-bottom: 12rpx; background: var(--rd-file-bg, #f0f7ff); border-radius: 12rpx; border: 1px solid var(--rd-file-line, #d9e8ff); }
.file-name { font-size: 26rpx; color: var(--rd-link, #1677ff); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-remove { font-size: 40rpx; color: var(--rd-secondary, #999); padding-left: 16rpx; line-height: 1; }
.cc-tags { display: flex; flex-wrap: wrap; gap: 16rpx; }
.cc-tag { padding: 12rpx 24rpx; background: var(--rd-field-bg, #f5f5f5); border-radius: 32rpx; font-size: 26rpx; color: var(--rd-secondary, #666); border: 2rpx solid transparent; }
.cc-tag.active { background: rgba(22, 119, 255, 0.12); color: var(--rd-chip-color, #1677ff); border-color: var(--rd-chip-color, #1677ff); }
.selected-cc { margin-top: 20rpx; padding: 16rpx 20rpx; background: var(--rd-file-bg, #f0f7ff); border-radius: 12rpx; }
.selected-label { font-size: 24rpx; color: var(--rd-secondary, #999); }
.selected-names { font-size: 26rpx; color: var(--rd-link, #1677ff); }
.contract-popup { display: flex; flex-direction: column; height: 100%; border-radius: 24rpx 24rpx 0 0; overflow: hidden; }
.popup-head { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 32rpx 16rpx; }
.popup-title { font-size: 32rpx; font-weight: 600; }
.popup-list { flex: 1; min-height: 0; padding: 0 24rpx 24rpx; box-sizing: border-box; }
.popup-item { display: flex; align-items: center; justify-content: space-between; padding: 22rpx 16rpx; border-bottom: 1rpx solid var(--rd-line, #f0f0f0); }
.popup-item-name { font-size: 26rpx; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 16rpx; }
.popup-tip { display: flex; justify-content: center; padding: 40rpx 0; }
</style>
