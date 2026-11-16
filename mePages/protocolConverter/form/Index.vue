<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-navbar :title="editId ? '编辑规约转换器' : '新增规约转换器'" left-arrow safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />

        <view class="form-wrap">
            <!-- 基本信息 -->
            <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="card-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">基本信息</view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }"><text class="req">*</text>电网类型</view>
                    <view class="chip-row">
                        <view v-for="g in gridChips" :key="g.value" class="chip" :class="{ 'chip--on': form.gridType === g.value }" :style="chipStyle(form.gridType === g.value)" @click="form.gridType = g.value">
                            <text class="chip-text" :style="{ color: form.gridType === g.value ? (isDark ? '#69b1ff' : '#1677ff') : (isDark ? '#8a9099' : '#4e5969') }">{{ g.label }}</text>
                            <wd-icon v-if="form.gridType === g.value" name="check-circle-filled" size="16px" :color="isDark ? '#69b1ff' : '#1677ff'" />
                        </view>
                    </view>
                </view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }"><text class="req">*</text>逆变器品牌</view>
                    <view class="form-picker" @click="brandPickerShow = true">
                        <view class="form-value" :style="{ background: isDark ? '#383838' : '#f7f8fa', color: form.brandId !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#6b7075' : '#bfbfbf') }">
                            <text class="form-value-text">{{ selectedBrand.label || '请选择逆变器品牌' }}</text>
                            <wd-icon name="arrow-down" size="14px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                    </view>
                    <view v-if="selectedBrand.disabled" class="warn-line" :style="{ color: isDark ? '#ffa940' : '#fa8c16' }">逆变器品牌已停用，请重选</view>
                </view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }"><text class="req">*</text>逆变器型号</view>
                    <view class="form-input" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                        <input class="form-input-core" v-model="form.inverterModel" type="text" placeholder="请输入逆变器型号（必填，≤128字）" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="128" />
                    </view>
                </view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }"><text class="req">*</text>项目地</view>
                    <view class="half-row">
                        <picker mode="selector" :range="provinceOptions" range-key="label" class="half-picker" @change="handleProvinceChange">
                            <view class="form-value" :style="{ background: isDark ? '#383838' : '#f7f8fa', color: form.provinceId !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#6b7075' : '#bfbfbf') }">
                                <text class="form-value-text">{{ provinceLabel || '请选择省份' }}</text>
                                <wd-icon name="arrow-down" size="14px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </picker>
                        <picker mode="selector" :range="cityOptions" range-key="label" class="half-picker" @change="handleCityChange">
                            <view class="form-value" :style="{ background: isDark ? '#383838' : '#f7f8fa', color: form.cityId !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#6b7075' : '#bfbfbf') }">
                                <text class="form-value-text">{{ cityLabel || '请选择城市' }}</text>
                                <wd-icon name="arrow-down" size="14px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </picker>
                    </view>
                </view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }">线束物料编码</view>
                    <view class="form-input" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                        <input class="form-input-core" v-model="form.harnessMaterialCode" type="text" placeholder="请输入线束物料编码（≤128字）" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="128" />
                    </view>
                </view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }">线束名称</view>
                    <view class="form-input" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                        <input class="form-input-core" v-model="form.harnessName" type="text" placeholder="请输入线束名称（≤128字）" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="128" />
                    </view>
                </view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }">备注说明</view>
                    <view class="form-textarea" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                        <textarea class="form-textarea-core" v-model="form.notes" placeholder="请输入备注说明（≤500字）" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="500" :auto-height="false" />
                    </view>
                </view>
            </view>

            <!-- 图片三组：ftype 12接口/13铭牌/14线束，存 projectRdFile，pid=规约id，每组最多10张 -->
            <view v-for="group in imgGroups" :key="group.ftype" class="card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="card-title-row">
                    <view class="card-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ group.label }}</view>
                    <text class="card-title-num" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ group.items.length }}/5</text>
                </view>
                <view class="img-grid">
                    <view v-for="(item, index) in group.items" :key="index" class="img-cell">
                        <image class="img-thumb" :src="displaySrc(item)" mode="aspectFill" @click="previewImage(group, index)" />
                        <view class="img-remove" @click.stop="removeImage(group, index)">
                            <wd-icon name="close-circle" size="20px" color="#ffffff" />
                        </view>
                    </view>
                    <view v-if="group.items.length < 5" class="img-cell img-add" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(128,128,128,0.45)', color: isDark ? '#8a9099' : '#969799' }" @click="chooseImage(group)">
                        <wd-icon name="camera" size="26px" />
                    </view>
                </view>
            </view>

            <view style="height: 160rpx;"></view>
        </view>

        <!-- 底部保存 -->
        <view class="bottom-bar" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
            <wd-button block type="primary" :loading="saving" @click="handleSubmit">保存</wd-button>
        </view>

        <wd-message-box />

        <!-- 逆变器品牌选择弹层：搜索 + 分页 + 触底加载（表单场景无「全部品牌」） -->
        <protocol-brand-picker v-model="brandPickerShow" :selected-id="form.brandId" @confirm="handleBrandPicked" />
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
    fetchAddProtocolRdFile,
    fetchDeleteProtocolRdFile,
    fetchProtocolConverterBrandDetail,
    fetchProtocolConverterCities,
    fetchProtocolConverterDetail,
    fetchProtocolConverterInsert,
    fetchProtocolConverterProvinces,
    fetchProtocolConverterUpdate,
    fetchProtocolRdFilePage,
    fetchUpdateProtocolRdFile
} from '@/service/protocolConverter';
import ProtocolBrandPicker from '@/components/protocol-brand-picker.vue';
import { uploadFile } from '@/utils/uploadFile';

const isDark = computed(() => uni.getStorageSync('isDark') == 1);
const theme = computed(() => (isDark.value ? 'dark' : 'light'));
const themeVars = computed(() => ({ colorTheme: '#1677ff' }));

function handleClickLeft() { uni.navigateBack(); }

const editId = ref<string>('');

/* ===== 表单（web operate-drawer 口径：gridType 默认0；新增不提交销售负责人/日期） ===== */
const form = ref({
    gridType: 0 as 0 | 1,
    brandId: null as number | null,
    inverterModel: '',
    provinceId: null as number | null,
    cityId: null as number | null,
    harnessMaterialCode: '',
    harnessName: '',
    notes: ''
});
const gridChips = [
    { label: '南网', value: 0 as const },
    { label: '国网', value: 1 as const }
];

/* ===== 下拉数据 ===== */
const brandPickerShow = ref(false);
/** 选中品牌显示名与停用态（弹层只回 id+名称；停用与否以详情接口为准） */
const selectedBrand = ref({ label: '', disabled: false });
const provinceOptions = ref<any[]>([]);
const cityOptions = ref<any[]>([]);

const provinceLabel = computed(() => provinceOptions.value.find(p => p.value === form.value.provinceId)?.label || '');
const cityLabel = computed(() => cityOptions.value.find(c => c.value === form.value.cityId)?.label || '');

async function loadProvinceOptions() {
    try {
        const data: any = await fetchProtocolConverterProvinces();
        const list = Array.isArray(data) ? data : [];
        provinceOptions.value = list.map((p: any) => ({ label: p.name, value: Number(p.id) }));
    } catch (err) { console.error('获取省份失败', err); }
}
async function loadCityOptions(provinceId: number) {
    try {
        const data: any = await fetchProtocolConverterCities(provinceId);
        const list = Array.isArray(data) ? data : [];
        cityOptions.value = list.map((c: any) => ({ label: c.name, value: Number(c.id) }));
    } catch (err) { console.error('获取城市失败', err); }
}

function handleBrandPicked(row: any) {
    form.value.brandId = row.id;
    selectedBrand.value = { label: row.label || '', disabled: false };
}
function handleProvinceChange(e: any) {
    const opt = provinceOptions.value[e.detail.value];
    form.value.provinceId = opt ? opt.value : null;
    form.value.cityId = null;
    cityOptions.value = [];
    if (form.value.provinceId !== null) loadCityOptions(form.value.provinceId);
}
function handleCityChange(e: any) {
    const opt = cityOptions.value[e.detail.value];
    form.value.cityId = opt ? opt.value : null;
}

/** 控件配色：选中淡蓝底描边（颜色仅辅助，文字为准） */
function chipStyle(active: boolean) {
    return active
        ? (isDark.value
            ? { background: 'rgba(22, 119, 255, 0.12)', borderColor: 'rgba(105, 177, 255, 0.45)' }
            : { background: 'rgba(22, 119, 255, 0.06)', borderColor: 'rgba(22, 119, 255, 0.35)' })
        : (isDark.value
            ? { background: '#383838', borderColor: 'rgba(255, 255, 255, 0.08)' }
            : { background: '#f7f8fa', borderColor: '#f0f1f3' });
}

/* ===== 图片三组 ===== */
const imgGroups = ref([
    { ftype: 12, label: '逆变器接口图片', items: [] as any[], old: [] as any[] },
    { ftype: 13, label: '逆变器铭牌图片', items: [] as any[], old: [] as any[] },
    { ftype: 14, label: '线束图片', items: [] as any[], old: [] as any[] }
]);

function displaySrc(item: any) {
    if (item.url) return `${String(item.url).split('?')[0]}?imageView2/1/w/180/h/180/q/75`;
    return item.tempPath || '';
}
function previewImage(group: any, index: number) {
    const urls = group.items.map((i: any) => (i.url ? String(i.url).split('?')[0] : i.tempPath));
    uni.previewImage({ urls, current: index });
}
function chooseImage(group: any) {
    const remain = 5 - group.items.length;
    if (remain <= 0) { uni.showToast({ title: '最多上传5张', icon: 'none' }); return; }
    uni.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        success: (res: any) => {
            const files = res.tempFiles || [];
            const paths = res.tempFilePaths || [];
            files.forEach((tf: any, i: number) => {
                if (group.items.length >= 5) return;
                group.items.push({
                    tempPath: tf.path || paths[i],
                    fname: tf.name || ('img_' + new Date().getTime() + '.png')
                });
            });
        }
    });
}
function removeImage(group: any, index: number) {
    group.items.splice(index, 1);
}

/** 编辑回显：拉已有图片入组（old 快照用于 diff） */
async function loadGroupImages(pid: string) {
    for (const group of imgGroups.value) {
        try {
            const data: any = await fetchProtocolRdFilePage({ pid, ftype: group.ftype, page: 1, limit: 100, _t: new Date().getTime() });
            const list = ((Array.isArray(data) ? data : data?.list) || []).map((item: any) => ({ id: item.id, url: item.furl, fname: item.fname }));
            group.items = list;
            group.old = list.map((item: any) => ({ ...item }));
        } catch (err) { console.error('获取图片失败', err); }
    }
}

/** 单组图片 diff 保存：上传新图 → 新增/改别名 → 删除被移除的（同 web syncFiles）；失败抛错由外层计部分失败 */
async function syncGroupFiles(pid: string | number, group: any) {
    // 1. 上传新增图片
    const toUpload = group.items.filter((item: any) => item.tempPath && !item.url);
    for (const item of toUpload) {
        const url = await new Promise<string>((resolve, reject) => {
            uploadFile(
                { name: item.fname, url: item.tempPath, tempFilePath: item.tempPath },
                'qiniu',
                (res: any) => resolve(res.data),
                () => reject(new Error('upload fail'))
            );
        });
        item.url = url;
    }
    // 2. 新增记录 / 更新别名
    for (const item of group.items) {
        const payload = { furl: item.url, fname: item.fname, pid, ftype: group.ftype };
        if (item.id) {
            const old = group.old.find((o: any) => o.id === item.id);
            if (old && old.fname !== item.fname) {
                await fetchUpdateProtocolRdFile([{ id: item.id, ...payload }]);
            }
        } else if (item.url) {
            const res: any = await fetchAddProtocolRdFile([payload]);
            const saved = Array.isArray(res) ? res[0] : res;
            if (saved?.id) item.id = saved.id;
        }
    }
    // 3. 删除被移除的图片
    const deletedIds = group.old
        .filter((o: any) => !group.items.some((n: any) => n.id === o.id))
        .map((o: any) => o.id);
    if (deletedIds.length > 0) {
        await fetchDeleteProtocolRdFile(deletedIds.join(','));
    }
}

/* ===== 编辑回显 ===== */
async function loadDetail() {
    try {
        uni.showLoading({ title: '加载中' });
        const data: any = await fetchProtocolConverterDetail(editId.value);
        uni.hideLoading();
        if (!data) return;
        form.value.gridType = (Number(data.gridType) === 1 ? 1 : 0) as 0 | 1;
        form.value.brandId = data.brandId != null ? Number(data.brandId) : null;
        form.value.inverterModel = data.inverterModel || '';
        form.value.provinceId = data.provinceId != null ? Number(data.provinceId) : null;
        form.value.harnessMaterialCode = data.harnessMaterialCode || '';
        form.value.harnessName = data.harnessName || '';
        form.value.notes = data.notes || '';
        // 城市：先按省份拉列表再回显 cityId
        if (form.value.provinceId !== null) {
            await loadCityOptions(form.value.provinceId);
            form.value.cityId = data.cityId != null ? Number(data.cityId) : null;
        }
        // 品牌回显：拉详情取显示名，停用品牌标注「（已停用，请重选）」并拦截提交，同 web
        if (form.value.brandId !== null) {
            try {
                const d: any = await fetchProtocolConverterBrandDetail(form.value.brandId);
                selectedBrand.value = {
                    label: (d?.brandName || '该品牌') + (Number(d?.status) === 0 ? '（已停用，请重选）' : ''),
                    disabled: Number(d?.status) === 0
                };
            } catch {
                selectedBrand.value = { label: '该品牌（已停用，请重选）', disabled: true };
            }
        }
        await loadGroupImages(editId.value);
    } catch (err) {
        uni.hideLoading();
        console.error('获取详情失败', err);
    }
}

/* ===== 提交 ===== */
const saving = ref(false);
async function handleSubmit() {
    if (saving.value) return;
    // 校验同 web rules：gridType/brandId/inverterModel/provinceId/cityId 必填，停用品牌须重选
    if (!form.value.inverterModel.trim()) { uni.showToast({ title: '请输入逆变器型号', icon: 'none' }); return; }
    if (form.value.brandId === null) { uni.showToast({ title: '请选择逆变器品牌', icon: 'none' }); return; }
    if (selectedBrand.value.disabled) { uni.showToast({ title: '逆变器品牌已停用，请重选', icon: 'none' }); return; }
    if (form.value.provinceId === null) { uni.showToast({ title: '请选择省份', icon: 'none' }); return; }
    if (form.value.cityId === null) { uni.showToast({ title: '请选择城市', icon: 'none' }); return; }
    saving.value = true;
    try {
        const payload = {
            gridType: form.value.gridType,
            brandId: form.value.brandId,
            inverterModel: form.value.inverterModel.trim(),
            provinceId: form.value.provinceId,
            cityId: form.value.cityId,
            harnessMaterialCode: form.value.harnessMaterialCode.trim(),
            harnessName: form.value.harnessName.trim(),
            notes: form.value.notes.trim()
        };
        if (!editId.value) {
            const res: any = await fetchProtocolConverterInsert(payload);
            const newId = Number(Array.isArray(res) ? res[0] : res);
            if (!newId) throw new Error('insert no id');
            // 图片随新增一起保存；部分失败时引导去列表图片入口补传（同 web 提示）
            let failed = 0;
            for (const group of imgGroups.value) {
                try { await syncGroupFiles(newId, group); } catch (err) { failed++; console.error('图片保存失败', err); }
            }
            if (failed > 0) uni.showToast({ title: '保存成功，但部分图片保存失败，可在列表图片入口重新上传', icon: 'none', duration: 3000 });
            else uni.showToast({ title: '保存成功', icon: 'success' });
        } else {
            await fetchProtocolConverterUpdate({ id: editId.value, ...payload });
            let failed = 0;
            for (const group of imgGroups.value) {
                try { await syncGroupFiles(editId.value, group); } catch (err) { failed++; console.error('图片保存失败', err); }
            }
            if (failed > 0) uni.showToast({ title: '保存成功，但部分图片保存失败，可在列表图片入口重新上传', icon: 'none', duration: 3000 });
            else uni.showToast({ title: '保存成功', icon: 'success' });
        }
        uni.$emit('refreshProtocolConverterList');
        setTimeout(() => { uni.navigateBack(); }, 800);
    } catch (err) {
        console.error('保存失败', err);
        uni.showToast({ title: '保存失败', icon: 'none' });
    } finally {
        saving.value = false;
    }
}

onLoad(async (options: any) => {
    await loadProvinceOptions();
    if (options && options.id) {
        editId.value = String(options.id);
        await loadDetail();
    }
});
</script>

<style lang="scss" scoped>
.form-wrap { padding: 20rpx; }
.card { border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; }
.card-title { font-size: 30rpx; font-weight: 600; margin-bottom: 24rpx; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.card-title-row .card-title { margin-bottom: 0; }
.card-title-num { font-size: 24rpx; }

.form-item { margin-bottom: 24rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { font-size: 26rpx; margin-bottom: 12rpx; }
.req { color: #ff4d4f; margin-right: 4rpx; }

.chip-row { display: flex; gap: 16rpx; }
.chip { display: flex; align-items: center; justify-content: center; gap: 8rpx; padding: 16rpx 0; border-radius: 14rpx; border: 1rpx solid transparent; flex: 1; }
.chip-text { font-size: 26rpx; font-weight: 500; }

.form-picker { display: block; }
.form-value { display: flex; align-items: center; gap: 12rpx; padding: 16rpx 18rpx; border-radius: 14rpx; }
.form-value-text { flex: 1; min-width: 0; font-size: 26rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.warn-line { margin-top: 8rpx; font-size: 22rpx; }

.half-row { display: flex; gap: 16rpx; }
.half-picker { flex: 1; min-width: 0; display: block; }
.half-picker .form-value-text { max-width: 180rpx; }

.form-input { display: flex; align-items: center; padding: 16rpx 18rpx; border-radius: 14rpx; }
.form-input-core { flex: 1; min-width: 0; height: 40rpx; font-size: 26rpx; }
.form-textarea { padding: 16rpx 18rpx; border-radius: 14rpx; }
.form-textarea-core { width: 100%; height: 100rpx; font-size: 26rpx; line-height: 1.5; }
.pc-grey { color: #bfbfbf; }

.img-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.img-cell { position: relative; width: 150rpx; height: 150rpx; border-radius: 12rpx; overflow: hidden; border: 1rpx solid rgba(128, 128, 128, 0.25); }
.img-thumb { width: 100%; height: 100%; display: block; }
.img-remove { position: absolute; top: 4rpx; right: 4rpx; width: 44rpx; height: 44rpx; border-radius: 50%; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; }
.img-add { display: flex; align-items: center; justify-content: center; border-style: dashed; }

.bottom-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06); }
</style>
