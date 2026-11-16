<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow :title="isEdit ? '编辑事项' : '新增事项'" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <scroll-view scroll-y class="page-scroll">
            <view class="page-inner">
                <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <view class="form-item">
                        <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">类别 <text class="required">*</text></text>
                        <wd-input v-model="form.category" placeholder="如：开工条件 / 人员 / 物料" />
                    </view>
                    <view class="form-item">
                        <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">事项内容 <text class="required">*</text></text>
                        <wd-textarea v-model="form.itemContent" placeholder="勾选时展示的事项文本" :maxlength="200" />
                    </view>
                    <view class="form-item">
                        <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">事项说明</text>
                        <wd-textarea v-model="form.itemDesc" placeholder="补充说明，可空" :maxlength="500" />
                    </view>
                    <view class="form-item form-inline">
                        <view class="inline-field">
                            <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">排序号</text>
                            <wd-input v-model="form.sortNo" type="number" placeholder="越小越靠前" />
                        </view>
                        <view class="inline-field inline-switch">
                            <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">启用</text>
                            <wd-switch v-model="form.enabled" size="22px" />
                        </view>
                    </view>
                </view>
                <view class="submit-wrap">
                    <wd-button type="primary" size="large" :loading="saving" custom-style="width:100%" @click="saveItem">{{ isEdit ? '保存修改' : '确认新增' }}</wd-button>
                </view>
            </view>
        </scroll-view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import {
    fetchStartConfirmLibraryPage,
    fetchStartConfirmLibraryInsert,
    fetchStartConfirmLibraryUpdate
} from '@/service/confirmLibrary';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh; background: #f5f6f8;';
    return 'min-height: 100vh; background: #1b1b1b;';
});

const isEdit = ref(false);
const editingId = ref<number | null>(null);
const editingVersion = ref<number>(0);
const saving = ref(false);
const form = ref<any>({ category: '', itemContent: '', itemDesc: '', sortNo: '', enabled: true });

function onRow(item: any) {
    if (!item) return;
    isEdit.value = true;
    editingId.value = item.id;
    editingVersion.value = item.version ?? 0;
    form.value = {
        category: item.category || '',
        itemContent: item.itemContent || '',
        itemDesc: item.itemDesc || '',
        sortNo: item.sortNo ?? '',
        enabled: item.enabled === 1
    };
}

async function saveItem() {
    const f = form.value;
    if (!f.category?.trim()) { uni.showToast({ title: '请填写类别', icon: 'none' }); return; }
    if (!f.itemContent?.trim()) { uni.showToast({ title: '请填写事项内容', icon: 'none' }); return; }
    if (saving.value) return;
    saving.value = true;
    try {
        const sortNo = f.sortNo === '' || f.sortNo === null || f.sortNo === undefined ? undefined : Number(f.sortNo);
        if (isEdit.value) {
            await fetchStartConfirmLibraryUpdate({
                id: editingId.value!,
                category: f.category.trim(),
                itemContent: f.itemContent.trim(),
                itemDesc: f.itemDesc?.trim() || undefined,
                enabled: f.enabled ? 1 : 0,
                sortNo,
                version: editingVersion.value
            });
        } else {
            await fetchStartConfirmLibraryInsert({
                category: f.category.trim(),
                itemContent: f.itemContent.trim(),
                itemDesc: f.itemDesc?.trim() || undefined,
                enabled: f.enabled ? 1 : 0,
                sortNo
            });
        }
        uni.showToast({ title: isEdit.value ? '已保存' : '已新增', icon: 'success' });
        uni.$emit('confirmLibrary_refresh');
        setTimeout(() => uni.navigateBack(), 400);
    } catch (err: any) {
        // version 乐观锁冲突：重新拉取回填 version，提示重新提交
        const msg = err?.msg || '保存失败';
        if (isEdit.value && /版本|version|刷新/i.test(msg)) {
            try {
                const data: any = await fetchStartConfirmLibraryPage({ page: 1, limit: 100 });
                const fresh = (data.list || []).find((x: any) => x.id === editingId.value);
                if (fresh) editingVersion.value = fresh.version;
            } catch (e) { /* ignore */ }
            uni.showToast({ title: '数据已被他人修改，已刷新版本，请重新提交', icon: 'none' });
        } else {
            uni.showToast({ title: msg, icon: 'none' });
        }
    } finally {
        saving.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }

onLoad(() => {
    const ut = Number(uni.getStorageSync('usertype'));
    if (![0, 1, 2].includes(ut)) { uni.showToast({ title: '无权限访问', icon: 'none' }); return; }
    uni.$on('confirmLibrary_row', onRow);
});
onUnload(() => {
    uni.$off('confirmLibrary_row', onRow);
});
</script>

<style lang="scss" scoped>
.page-scroll { height: calc(100vh - 88rpx); }
.page-inner { padding: 20rpx; }
.form-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.form-item { margin-bottom: 24rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { display: block; font-size: 26rpx; margin-bottom: 12rpx; }
.required { color: #ff4d4f; }
.form-inline { display: flex; gap: 24rpx; }
.inline-field { flex: 1; }
.inline-switch { display: flex; flex-direction: column; }
.submit-wrap { padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); }
</style>
