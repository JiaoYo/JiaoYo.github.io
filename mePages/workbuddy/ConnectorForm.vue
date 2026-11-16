<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow :title="editingSource ? '编辑 source' : '新增 source'" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <scroll-view scroll-y class="form-scroll">
            <view class="page-inner">
                <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <view class="form-item">
                        <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">source 标识 <text class="required">*</text></text>
                        <wd-input v-model="form.source" placeholder="小写字母/数字/连字符，如 openai-codex" :disabled="!!editingSource" />
                        <view class="form-tip" :style="{ color: isDark ? '#6a6a6a' : '#999' }">必须与专家包中的 source 完全一致，只允许小写字母、数字和连字符</view>
                    </view>
                    <view class="form-item">
                        <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">展示名称 <text class="required">*</text></text>
                        <wd-input v-model="form.display_name" placeholder="市场展示名称，如 OpenAI Codex" />
                    </view>
                    <view class="form-item">
                        <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">允许的能力范围 scopes</text>
                        <wd-input v-model="form.allowed_scopes" placeholder="留空表示不限制" />
                    </view>
                </view>
                <view class="submit-wrap">
                    <wd-button type="primary" size="large" :loading="saving" custom-style="width:100%" @click="save">{{ editingSource ? '保存修改' : '确认新增' }}</wd-button>
                </view>
            </view>
        </scroll-view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import {
    fetchGetWorkbuddyConnectors,
    fetchSaveWorkbuddyConnector,
    fetchUpdateWorkbuddyConnector,
    type WorkbuddyConnector
} from '@/service/workbuddy';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh; background: #f5f6f8;';
    return 'min-height: 100vh; background: #1b1b1b;';
});

const editingSource = ref('');
const saving = ref(false);
const form = ref({ source: '', display_name: '', allowed_scopes: '' });

async function prefill() {
    try {
        const list = await fetchGetWorkbuddyConnectors();
        const c: WorkbuddyConnector | undefined = list.find(item => item.source === editingSource.value);
        if (!c) {
            uni.showToast({ title: '未找到该 source', icon: 'none' });
            setTimeout(() => uni.navigateBack(), 600);
            return;
        }
        form.value = { source: c.source, display_name: c.display_name || '', allowed_scopes: c.allowed_scopes || '' };
    } catch (err) {
        console.error('获取专家来源失败', err);
        uni.showToast({ title: '加载失败', icon: 'none' });
    }
}

async function save() {
    const f = form.value;
    if (!editingSource.value && !/^[a-z0-9-]+$/.test(f.source || '')) {
        uni.showToast({ title: 'source 只允许小写字母、数字和连字符', icon: 'none' });
        return;
    }
    if (!f.display_name?.trim()) {
        uni.showToast({ title: '请填写展示名称', icon: 'none' });
        return;
    }
    if (saving.value) return;
    saving.value = true;
    try {
        if (editingSource.value) {
            const list = await fetchGetWorkbuddyConnectors();
            const c = list.find(item => item.source === editingSource.value);
            await fetchUpdateWorkbuddyConnector(editingSource.value, {
                display_name: f.display_name.trim(),
                status: c?.status || 'ACTIVE',
                allowed_scopes: f.allowed_scopes?.trim() || ''
            });
        } else {
            await fetchSaveWorkbuddyConnector({
                source: f.source.trim(),
                display_name: f.display_name.trim(),
                status: 'ACTIVE',
                allowed_scopes: f.allowed_scopes?.trim() || ''
            });
        }
        uni.showToast({ title: editingSource.value ? '已保存' : '已新增', icon: 'success' });
        uni.$emit('wb_connector_refresh');
        setTimeout(() => uni.navigateBack(), 600);
    } catch (err: any) {
        uni.showToast({ title: err?.msg || '保存失败', icon: 'none' });
    } finally {
        saving.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }

onLoad((options: Record<string, string>) => {
    const ut = Number(uni.getStorageSync('usertype'));
    if (![0, 12].includes(ut)) { uni.showToast({ title: '无权限访问', icon: 'none' }); return; }
    editingSource.value = options?.source ? decodeURIComponent(options.source) : '';
    if (editingSource.value) prefill();
});
</script>

<style lang="scss" scoped>
.form-scroll { height: 100vh; }
.page-inner { display: flex; flex-direction: column; padding: 20rpx; }
.form-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.form-item { margin-bottom: 24rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { display: block; font-size: 26rpx; margin-bottom: 12rpx; }
.required { color: #ff4d4f; }
.form-tip { font-size: 22rpx; margin-top: 8rpx; line-height: 1.5; }
.submit-wrap { padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); }
</style>
