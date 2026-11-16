<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="发布注意事项" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft"></wd-navbar>

        <scroll-view scroll-y :style="{ height: '100vh', background: isDark ? '#000000' : '#F5F5F5' }">
            <view style="height: 20rpx;"></view>
            <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 40rpx', borderRadius: '20rpx', padding: '20rpx' }">
                <view class="anp-form-label" :class="isDark ? 'anp-dark-value' : ''">标题<text style="color: #e54d42;">*</text></view>
                <wd-input v-model="form.title" clearable maxlength="100" placeholder="一句话说明注意事项（100 字以内）" :placeholder-style="isDark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" />

                <view class="anp-form-label" :class="isDark ? 'anp-dark-value' : ''">重要程度</view>
                <view class="anp-chips">
                    <view class="anp-chip" :style="chipStyle(form.priority === 0)" @click="form.priority = 0">普通</view>
                    <view class="anp-chip" :style="chipStyle(form.priority === 1)" @click="form.priority = 1">重要（列表靠前强调展示）</view>
                </view>

                <view class="anp-form-label" :class="isDark ? 'anp-dark-value' : ''">内容<text style="color: #e54d42;">*</text></view>
                <textarea class="anp-form-textarea" :class="isDark ? 'anp-dark-textarea' : ''" v-model="form.content" maxlength="5000" placeholder="具体要求、现场风险、执行口径等（5000 字以内，纯文本）" :placeholder-style="isDark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height></textarea>

                <view class="anp-form-hint" :class="isDark ? 'anp-dark-hint' : ''">保存即发布，项目内可见；发布人自己和超级管理员可撤回。</view>

                <wd-button block type="primary" :loading="submitting" :disabled="submitting" custom-style="margin-top: 32rpx;" @click="submitPublish">发布</wd-button>
            </view>
        </scroll-view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { reactive, ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchInsertProjectNotice } from '@/service/projectNotice';

/**
 * 发布注意事项独立页（保存即发布；从联络单详情「注意事项」面板跳入）
 * 发布成功后通知面板刷新并返回上一页。
 */
const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const pid = ref<number>(0);

const submitting = ref(false);

const form = reactive({ title: '', content: '', priority: 0 });

onLoad((options: any) => {
    pid.value = Number(options?.pid) || 0;
});

function handleClickLeft() {
    uni.navigateBack();
}

function chipStyle(active: boolean) {
    if (active) return { background: isDark.value ? 'rgba(22, 119, 255, 0.3)' : '#e6f4ff', color: isDark.value ? '#69b1ff' : '#1677ff', borderColor: isDark.value ? '#69b1ff' : '#1677ff' };
    return { background: isDark.value ? '#2a2a2a' : '#f5f5f5', color: isDark.value ? '#c9cdd4' : '#4e5969', borderColor: 'transparent' };
}

async function submitPublish() {
    if (submitting.value || !pid.value) return;
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) {
        uni.showToast({ icon: 'none', title: '请输入标题', duration: 1500 });
        return;
    }
    if (title.length > 100) {
        uni.showToast({ icon: 'none', title: '标题最多 100 字', duration: 1500 });
        return;
    }
    if (!content) {
        uni.showToast({ icon: 'none', title: '请输入内容', duration: 1500 });
        return;
    }
    if (content.length > 5000) {
        uni.showToast({ icon: 'none', title: '内容最多 5000 字', duration: 1500 });
        return;
    }
    submitting.value = true;
    try {
        await fetchInsertProjectNotice({ pid: pid.value, title, content, priority: form.priority });
        uni.showToast({ icon: 'success', title: '发布成功', duration: 1500 });
        uni.$emit('refreshProjectNotice');
        setTimeout(() => {
            uni.navigateBack();
        }, 800);
    } catch (err) {
        console.error('发布失败', err);
    } finally {
        submitting.value = false;
    }
}
</script>

<style lang="scss" scoped>
.anp-form-label {
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
    margin: 20rpx 0 12rpx;
}

.anp-chips {
    display: flex;
    gap: 12rpx;
}

.anp-chip {
    display: inline-block;
    padding: 6rpx 26rpx;
    border-radius: 28rpx;
    font-size: 24rpx;
    border: 2rpx solid transparent;
}

.anp-form-textarea {
    width: 100%;
    min-height: 240rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    color: #333;
    box-sizing: border-box;
}

.anp-form-hint {
    margin-top: 20rpx;
    font-size: 22rpx;
    line-height: 1.6;
    color: #999;
    background: #f5f7fa;
    border-radius: 12rpx;
    padding: 14rpx 20rpx;
}

.anp-dark-hint {
    background: #2a2a2a;
}

.anp-dark-value {
    color: #e8e8e8 !important;
}

.anp-dark-textarea {
    color: #e8e8e8;
}
</style>
