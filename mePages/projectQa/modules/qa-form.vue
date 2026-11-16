<template>
	<wd-config-provider :theme-vars="{}" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh;'" :theme="theme">
	<wd-popup v-model="visible" position="right" :z-index="1000" :lock-scroll="false" :custom-style="isDark ? 'width: 100vw; height: 100vh; background: #1b1b1b;' : 'width: 100vw; height: 100vh; background: #f5f6f8;'" @after-leave="emit('closed')">
		<view class="form-page">
			<!-- 顶部 -->
			<view class="form-header" :style="{ paddingTop: headerPad, background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view class="form-header-left" @click="visible = false">
					<wd-icon name="arrow-left" size="20px" :color="isDark ? '#e8e8e8' : '#1a1a1a'"></wd-icon>
				</view>
				<text class="form-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ isEdit ? '修改问题' : '新增问题' }}</text>
				<view class="form-header-right"></view>
			</view>

			<!-- 表单主体 -->
			<scroll-view scroll-y class="form-scroll">
				<view class="form-card" :style="{ background: isDark ? '#242424' : '#ffffff' }">
					<view class="form-label" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">问题 <text class="required">*</text></view>
					<textarea
						class="problem-input"
						v-model="form.problem"
						:maxlength="200"
						placeholder="请输入问题"
						:placeholder-style="isDark ? 'color:#6A7590;' : 'color:#bfbfbf;'"
						:show-confirm-bar="false"
					/>
				</view>

				<view class="form-card" :style="{ background: isDark ? '#242424' : '#ffffff' }">
					<view class="form-label" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">答案</view>
					<textarea
						class="answer-input"
						v-model="form.desc"
						placeholder="请输入答案内容"
						:placeholder-style="isDark ? 'color:#6A7590;' : 'color:#bfbfbf;'"
						:show-confirm-bar="false"
						auto-height
					/>
					<view class="form-tip" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">移动端仅支持纯文本编辑，保存后原有格式与图片将被清理。</view>
				</view>
			</scroll-view>

			<!-- 底部保存 -->
			<view class="form-footer" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-button block type="primary" :loading="saving" @click="handleSave">保存</wd-button>
			</view>
		</view>
	</wd-popup>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { fetchInsertProjectQa, fetchUpdateProjectQa } from '@/service/projectQa';
import { stripHtml, textToHtml } from './qa-utils';
import { useTheme } from '@/composables/theme/theme';

const { theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

const props = defineProps<{
	row?: any;
}>();

const emit = defineEmits<{
	(e: 'saved', payload?: { id?: any; problem: string; desc: string }): void;
	(e: 'closed'): void;
}>();

const visible = defineModel<boolean>({ default: false });

const isEdit = computed(() => !!(props.row && props.row.id != null));

const form = ref<{ problem: string; desc: string }>({ problem: '', desc: '' });
const saving = ref(false);

// 状态栏高度（自定义导航，弹层从屏幕顶端开始，需手动避让状态栏）
const statusBarHeight = ref(0);
const headerPad = computed(() => (statusBarHeight.value + 10) + 'px');

onMounted(() => {
	try {
		const info = uni.getSystemInfoSync();
		statusBarHeight.value = info.statusBarHeight || 0;
	} catch (e) { /* ignore */ }
});

// 打开时初始化
watch(visible, (v) => {
	if (!v) return;
	saving.value = false;
	if (isEdit.value && props.row) {
		form.value = {
			problem: props.row.problem || '',
			desc: stripHtml(props.row.desc)
		};
	} else {
		form.value = { problem: '', desc: '' };
	}
});

// 保存
async function handleSave() {
	const problem = (form.value.problem || '').trim();
	if (!problem) {
		uni.showToast({ icon: 'none', title: '请输入问题' });
		return;
	}
	const desc = textToHtml(form.value.desc || '');

	saving.value = true;
	try {
		if (isEdit.value) {
			await fetchUpdateProjectQa([{ id: props.row.id, problem, desc }] as any);
		} else {
			await fetchInsertProjectQa([{ problem, desc }] as any);
		}
		visible.value = false;
		emit('saved', isEdit.value ? { id: props.row.id, problem, desc } : { problem, desc });
		uni.showToast({ icon: 'success', title: isEdit.value ? '编辑成功' : '添加成功' });
	} catch (e) {
		uni.showToast({ icon: 'none', title: isEdit.value ? '编辑失败' : '添加失败' });
	} finally {
		saving.value = false;
	}
}
</script>

<style lang="scss" scoped>
.form-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
}

/* 顶部 */
.form-header {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	gap: 12rpx;
}

.form-header-left,
.form-header-right {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
}

.form-title {
	flex: 1;
	text-align: center;
	font-size: 32rpx;
	font-weight: 600;
}

/* 表单 */
.form-scroll {
	flex: 1;
	min-height: 0;
	box-sizing: border-box;
	padding: 20rpx 24rpx;
}

.form-card {
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.form-label {
	font-size: 28rpx;
	font-weight: 600;
	margin-bottom: 16rpx;
}

.required {
	color: #dd524d;
}

.problem-input,
.answer-input {
	width: 100%;
	font-size: 28rpx;
	line-height: 1.6;
	box-sizing: border-box;
}

.problem-input {
	min-height: 120rpx;
}

.answer-input {
	min-height: 300rpx;
	line-height: 1.7;
}

.form-tip {
	font-size: 22rpx;
	margin-top: 12rpx;
	line-height: 1.5;
}

/* 底部 */
.form-footer {
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);
}

/* 暗黑模式 */
.wot-theme-dark {
	.problem-input,
	.answer-input {
		color: #e8e8e8;
		background: transparent;
	}
}
</style>
