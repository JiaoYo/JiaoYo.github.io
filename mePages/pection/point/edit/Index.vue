<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchAddPoint, fetchUpdatePoint, fetchPointManuPage, fetchPointModelPage, fetchPointProtypePage } from '@/service/point';
import { getFileNameFromUrl } from '../../common';
import { uploadFile } from '@/utils/uploadFile';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

let editId: number | null = null;
const pageTitle = ref('新增点表模板');
const submitting = ref(false);

const manuList = ref<any[]>([]);
const protypeList = ref<any[]>([]);
const modelList = ref<any[]>([]);

const manuOptions = computed(() => manuList.value.map(item => ({ label: item.manu, value: item.id })));
const modelOptions = computed(() => modelList.value.map(item => ({ label: item.model, value: item.id })));
const protypeOptions = computed(() => protypeList.value.map(item => ({ label: item.protype, value: item.id })));
const formStatusOptions = [{ label: '是', value: 1 }, { label: '否', value: 0 }];

const form = ref({ pname: '', fileurl: '', muid: '' as number | '', mdid: '' as number | '', ptid: '' as number | '', notes: '', status: 0 });

// 点表文件上传（参考 mePages/adddispatch 模式）
const fileList = ref<any[]>([]);
const fileDisplayName = ref('');
const uploading = ref(false);

function handleFileChange(data: any[]) {
    fileList.value = data.length > 0 ? [data[data.length - 1]] : [];
    fileDisplayName.value = fileList.value.length > 0 ? (fileList.value[0].name || '已选择文件') : fileDisplayName.value;
}

function handleRemoveFile() {
    fileList.value = [];
    form.value.fileurl = '';
    fileDisplayName.value = '';
}

// 上传新选择的点表文件，返回文件 URL；未选择新文件时沿用原 fileurl
function doUpload(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (fileList.value.length === 0) { resolve(form.value.fileurl || ''); return; }
        const file = fileList.value[0];
        if (file.url && file.url.startsWith('https://pictures.linkqi.cn')) { resolve(file.url); return; }
        uploading.value = true;
        uploadFile(
            file,
            '',
            (response: any) => {
                uploading.value = false;
                const url = response && (response.data || response.url || response);
                if (url) {
                    const urlStr = String(url);
                    fileList.value[0].url = urlStr;
                    fileDisplayName.value = getFileNameFromUrl(urlStr);
                    resolve(urlStr);
                }
                else { reject(new Error('上传失败')); }
            },
            () => { uploading.value = false; reject(new Error('上传失败')); }
        );
    });
}

function numOrEmpty(v: any): number | '' {
    if (v === undefined || v === null || v === '') return '';
    const n = Number(v);
    return Number.isNaN(n) ? '' : n;
}

async function loadFilterData() {
    try {
        const [manuData, protypeData] = await Promise.all([
            fetchPointManuPage({ page: 1, limit: 100 }),
            fetchPointProtypePage({ page: 1, limit: 100 })
        ]);
        manuList.value = manuData.list || [];
        protypeList.value = protypeData.list || [];
    } catch (err) { console.error('获取基础数据失败', err); }
}

async function loadModels(muid: number | '') {
    modelList.value = [];
    if (!muid) return;
    try {
        const data = await fetchPointModelPage({ page: 1, limit: 100, pid: muid });
        modelList.value = data.list || [];
    } catch (err) { console.error('获取型号列表失败', err); }
}

function handleManuChange(val: any) {
    form.value.muid = val;
    form.value.mdid = '';
    loadModels(val);
}

function handleClickLeft() { /* #ifdef H5 */ history.go(-1); /* #endif */ /* #ifndef H5 */ uni.navigateBack(); /* #endif */ }

async function handleSubmit() {
    if (submitting.value) return;
    if (!form.value.pname) { uni.showToast({ title: '请输入名称', icon: 'none' }); return; }
    if (!form.value.muid) { uni.showToast({ title: '请选择厂家', icon: 'none' }); return; }
    if (!form.value.mdid) { uni.showToast({ title: '请选择型号', icon: 'none' }); return; }
    if (!form.value.ptid) { uni.showToast({ title: '请选择协议类型', icon: 'none' }); return; }
    if (!form.value.fileurl && fileList.value.length === 0) { uni.showToast({ title: '请上传点表文件', icon: 'none' }); return; }
    submitting.value = true;
    try {
        let fileurl = form.value.fileurl;
        try { fileurl = await doUpload(); }
        catch (uploadErr) { uni.showToast({ title: '点表文件上传失败', icon: 'none' }); submitting.value = false; return; }
        const data = [{ ...form.value, fileurl }];
        if (editId !== null) { data[0].id = editId; await fetchUpdatePoint(data); }
        else { await fetchAddPoint(data); }
        uni.showToast({ title: editId !== null ? '修改成功' : '新增成功', icon: 'success' });
        uni.$emit('refreshPointList');
        setTimeout(() => { uni.navigateBack(); }, 600);
    } catch (err) {
        console.error('提交失败', err);
        uni.showToast({ title: '提交失败', icon: 'none' });
        submitting.value = false;
    }
}

onLoad((options: any) => {
    loadFilterData();
    if (options && options.id !== undefined && options.id !== '') {
        editId = Number(options.id);
        pageTitle.value = '编辑点表模板';
        uni.setNavigationBarTitle({ title: pageTitle.value });
        form.value = {
            pname: decodeURIComponent(options.pname || ''),
            fileurl: decodeURIComponent(options.fileurl || ''),
            muid: numOrEmpty(options.muid),
            mdid: numOrEmpty(options.mdid),
            ptid: numOrEmpty(options.ptid),
            notes: decodeURIComponent(options.notes || ''),
            status: numOrEmpty(options.status) === '' ? 0 : (numOrEmpty(options.status) as number)
        };
        if (form.value.muid !== '') { loadModels(form.value.muid); }
        fileDisplayName.value = form.value.fileurl ? getFileNameFromUrl(form.value.fileurl) : '';
    } else if (options && (options.muid !== undefined || options.mdid !== undefined || options.ptid !== undefined)) {
        // 新增模式：预填列表页当前筛选的厂家/型号/协议
        form.value.muid = numOrEmpty(options.muid);
        form.value.mdid = numOrEmpty(options.mdid);
        form.value.ptid = numOrEmpty(options.ptid);
        if (form.value.muid !== '') { loadModels(form.value.muid); }
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-navbar left-arrow :title="pageTitle" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        <view :style="{ margin: '20rpx', background: isDark ? '#1b1b1b' : '#f5f6f8', minHeight: '100vh' }">
            <wd-cell-group border>
                <wd-input label="名称" label-width="150rpx" v-model="form.pname" placeholder="请输入名称" :maxlength="64" />
                <wd-picker view-mode="cell" label="厂家" label-width="150rpx" v-model="form.muid" :columns="manuOptions" @confirm="({ value }) => handleManuChange(value)" placeholder="请选择厂家" />
                <wd-picker view-mode="cell" label="型号" label-width="150rpx" v-model="form.mdid" :columns="modelOptions" placeholder="请选择型号" />
                <wd-picker view-mode="cell" label="协议" label-width="150rpx" v-model="form.ptid" :columns="protypeOptions" placeholder="请选择协议类型" />
                <wd-picker view-mode="cell" label="内部模板" label-width="150rpx" v-model="form.status" :columns="formStatusOptions" placeholder="是否内部模板" />
                <view class="file-cell" :style="{ borderBottomColor: isDark ? '#3a3a3a' : '#ebeef5' }">
                    <view class="file-cell-label" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">点表文件</view>
                    <view class="file-cell-body">
                        <text class="file-cell-value" :class="{ 'file-cell-placeholder': !fileDisplayName }" :style="{ color: isDark ? (fileDisplayName ? '#e8e8e8' : '#6a6a6a') : (fileDisplayName ? '#323233' : '#c8c9cc') }">{{ fileDisplayName || '请选择点表文件' }}</text>
                        <CjxUpload v-if="!fileDisplayName" v-model="fileList" @change="handleFileChange">
                            <template #default>
                                <wd-button icon="cloud-upload" size="small" :loading="uploading">上传文件</wd-button>
                            </template>
                        </CjxUpload>
                        <view v-else style="padding: 14rpx; margin: -14rpx;" @click="handleRemoveFile">
                            <wd-icon name="close-circle" size="22px" color="#ff0000"></wd-icon>
                        </view>
                    </view>
                </view>
                <wd-input label="备注" label-width="150rpx" v-model="form.notes" placeholder="请输入备注" type="textarea" :maxlength="255" />
            </wd-cell-group>
            <view style="margin-top: 40rpx; padding-bottom: calc(40rpx + env(safe-area-inset-bottom));">
                <wd-button type="primary" block :loading="submitting" @click="handleSubmit">{{ editId !== null ? '保存' : '保存' }}</wd-button>
            </view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.file-cell { display: flex; align-items: center; padding: 20rpx 30rpx; border-bottom: 1px solid #ebeef5; }
.file-cell-label { width: 150rpx; flex-shrink: 0; margin-right: 30rpx; font-size: 28rpx; color: #323233; }
.file-cell-body { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12rpx; }
.file-cell-value { flex: 1; min-width: 0; font-size: 28rpx; color: #323233; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-cell-placeholder { color: #c8c9cc; }

/* 暗黑模式组件背景强制覆盖 */
.wot-theme-dark {
    :deep(.wd-search) {
        background: #2a2a2a !important;
    }
    :deep(.wd-search__input) {
        background: #2a2a2a !important;
    }
    :deep(.wd-picker) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell-group) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell-group__body) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell) {
        background: #2a2a2a !important;
    }
    :deep(.wd-input) {
        background: #2a2a2a !important;
    }
}

</style>
