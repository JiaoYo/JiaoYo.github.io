<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-navbar :title="editId ? '编辑品牌' : '新增品牌'" left-arrow safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />

        <view class="form-wrap">
            <view class="card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }"><text class="req">*</text>品牌名称</view>
                    <view class="form-input" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                        <input class="form-input-core" v-model="brandForm.brandName" type="text" placeholder="请输入品牌名称（必填，≤50字）" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="50" />
                    </view>
                </view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }"><text class="req">*</text>状态</view>
                    <view class="chip-row">
                        <view class="chip" :class="{ 'chip--on': brandForm.status === 1 }" :style="chipStyle(brandForm.status === 1)" @click="brandForm.status = 1">
                            <text class="chip-text" :style="{ color: brandForm.status === 1 ? (isDark ? '#73d13d' : '#52c41a') : (isDark ? '#8a9099' : '#4e5969') }">启用</text>
                            <wd-icon v-if="brandForm.status === 1" name="check-circle-filled" size="16px" :color="isDark ? '#73d13d' : '#52c41a'" />
                        </view>
                        <view class="chip" :class="{ 'chip--on': brandForm.status === 0 }" :style="chipStyle(brandForm.status === 0)" @click="brandForm.status = 0">
                            <text class="chip-text" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">停用（不在业务表单下拉中出现）</text>
                            <wd-icon v-if="brandForm.status === 0" name="circle" size="16px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                    </view>
                </view>
                <view class="form-item">
                    <view class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }"><text class="req">*</text>排序号</view>
                    <view class="form-input" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                        <input class="form-input-core" v-model="brandForm.sortNo" type="number" placeholder="请输入排序号（≥0，默认0）" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" />
                    </view>
                </view>
            </view>
            <view style="height: 160rpx;"></view>
        </view>

        <!-- 底部保存 -->
        <view class="bottom-bar" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
            <wd-button block type="primary" :loading="saving" @click="handleSave">保存</wd-button>
        </view>

        <wd-message-box />
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
    fetchProtocolConverterBrandDetail,
    fetchProtocolConverterBrandInsert,
    fetchProtocolConverterBrandUpdate
} from '@/service/protocolConverter';

const isDark = computed(() => uni.getStorageSync('isDark') == 1);
const theme = computed(() => (isDark.value ? 'dark' : 'light'));
const themeVars = computed(() => ({ colorTheme: '#1677ff' }));

function handleClickLeft() { uni.navigateBack(); }

const editId = ref<string>('');
const brandForm = ref({ brandName: '', status: 1, sortNo: '0' });
const saving = ref(false);

/** 状态 chip 配色：启用淡绿、停用灰（颜色仅辅助，文字为准） */
function chipStyle(active: boolean) {
    return active
        ? (isDark.value
            ? { background: 'rgba(82, 196, 26, 0.16)', borderColor: 'rgba(115, 209, 61, 0.45)' }
            : { background: 'rgba(82, 196, 26, 0.08)', borderColor: 'rgba(82, 196, 26, 0.4)' })
        : (isDark.value
            ? { background: '#383838', borderColor: 'rgba(255, 255, 255, 0.08)' }
            : { background: '#f7f8fa', borderColor: '#f0f1f3' });
}

async function handleSave() {
    if (saving.value) return;
    const name = brandForm.value.brandName.trim();
    if (!name) { uni.showToast({ title: '请输入品牌名称', icon: 'none' }); return; }
    const sortNoNum = Number(brandForm.value.sortNo);
    if (!Number.isFinite(sortNoNum) || sortNoNum < 0) { uni.showToast({ title: '排序号须为不小于0的数字', icon: 'none' }); return; }
    saving.value = true;
    try {
        if (editId.value) {
            await fetchProtocolConverterBrandUpdate({ id: editId.value, brandName: name, status: brandForm.value.status, sortNo: sortNoNum });
        } else {
            await fetchProtocolConverterBrandInsert({ brandName: name, status: brandForm.value.status, sortNo: sortNoNum });
        }
        uni.showToast({ title: '保存成功', icon: 'success' });
        uni.$emit('refreshProtocolBrandList');
        setTimeout(() => { uni.navigateBack(); }, 800);
    } catch (err) {
        console.error('保存品牌失败', err);
    } finally {
        saving.value = false;
    }
}

onLoad(async (options: any) => {
    if (options && options.id) {
        editId.value = String(options.id);
        try {
            uni.showLoading({ title: '加载中' });
            const d: any = await fetchProtocolConverterBrandDetail(editId.value);
            uni.hideLoading();
            if (d) {
                brandForm.value = {
                    brandName: d.brandName || '',
                    status: Number(d.status) === 0 ? 0 : 1,
                    sortNo: String(d.sortNo ?? 0)
                };
            }
        } catch (err) {
            uni.hideLoading();
            console.error('获取品牌详情失败', err);
        }
    }
});
</script>

<style lang="scss" scoped>
.form-wrap { padding: 20rpx; }
.card { border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; }

.form-item { margin-bottom: 24rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { font-size: 26rpx; margin-bottom: 12rpx; }
.req { color: #ff4d4f; margin-right: 4rpx; }
.chip-row { display: flex; flex-direction: column; gap: 16rpx; }
.chip { display: flex; align-items: center; justify-content: flex-start; gap: 12rpx; padding: 16rpx 18rpx; border-radius: 14rpx; border: 1rpx solid transparent; }
.chip-text { font-size: 26rpx; font-weight: 500; }
.form-input { display: flex; align-items: center; padding: 16rpx 18rpx; border-radius: 14rpx; }
.form-input-core { flex: 1; min-width: 0; height: 40rpx; font-size: 26rpx; }
.pc-grey { color: #bfbfbf; }

.bottom-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06); }
</style>
