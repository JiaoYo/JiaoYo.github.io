<template>
	<wd-config-provider :theme-vars="{}" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh;'" :theme="theme">
	<wd-popup v-model="visible" position="right" :z-index="1000" :lock-scroll="false" :custom-style="isDark ? 'width: 100vw; height: 100vh; background: #1b1b1b;' : 'width: 100vw; height: 100vh; background: #f5f6f8;'" @after-leave="emit('closed')">
		<view class="detail-page">
			<!-- 顶部 -->
			<view class="detail-header" :style="{ paddingTop: headerPad, background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view class="detail-header-left" @click="visible = false">
					<wd-icon name="arrow-left" size="20px" :color="isDark ? '#e8e8e8' : '#1a1a1a'"></wd-icon>
				</view>
				<text class="detail-header-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">知识详情</text>
				<view class="detail-header-right">
					<text v-if="canOperateRow" class="header-action" @click="emit('edit', detailRow)">编辑</text>
				</view>
			</view>

			<!-- 内容 -->
			<scroll-view scroll-y class="detail-scroll">
				<view v-if="detailRow" class="detail-body">
					<!-- 问题卡片 -->
					<view class="problem-card" :style="{ background: isDark ? '#242424' : '#ffffff', borderLeftColor: isDark ? '#69b1ff' : '#1677ff' }">
						<text class="problem-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ detailRow.problem }}</text>
						<view class="problem-meta" :style="{ borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#f5f6f8', color: isDark ? '#6A7590' : '#c0c4cc' }">
							<text>{{ detailRow.username || '-' }}</text>
							<text>{{ detailRow.dbtime || '' }}</text>
						</view>
					</view>

					<!-- 答案卡片 -->
					<view class="answer-card" :style="{ background: isDark ? '#242424' : '#ffffff' }">
						<view class="answer-label-row">
							<view class="answer-label" :style="{ color: isDark ? '#e8e8e8' : '#4e5969' }">答案内容</view>
							<text v-if="plainDesc" class="copy-btn" @click="copyAnswer">复制</text>
						</view>
						<view v-if="safeHtml" class="answer-html" :style="{ color: isDark ? '#e8e8e8' : '#333' }">
							<rich-text :nodes="safeHtml"></rich-text>
						</view>
						<view v-else class="answer-empty" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">暂无答案内容</view>

						<!-- 图片预览条 -->
						<view v-if="images.length > 0" class="image-section" :style="{ borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#f5f6f8' }">
							<view class="image-label" :style="{ color: isDark ? '#e8e8e8' : '#4e5969' }">相关图片</view>
							<scroll-view scroll-x class="image-scroll">
								<image
									v-for="(img, idx) in images"
									:key="idx"
									class="thumb"
									:src="img"
									mode="aspectFill"
									@click="previewImage(idx)"
								></image>
							</scroll-view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</wd-popup>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { sanitizeHtml, extractImages } from './qa-utils';
import { useTheme } from '@/composables/theme/theme';

const { theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

const props = defineProps<{
	row?: any;
}>();

const emit = defineEmits<{
	(e: 'edit', row: any): void;
	(e: 'closed'): void;
}>();

const visible = defineModel<boolean>({ default: false });

const detailRow = ref<any>(null);

const safeHtml = computed(() => sanitizeHtml(detailRow.value ? detailRow.value.desc : ''));
const images = computed(() => extractImages(detailRow.value ? detailRow.value.desc : ''));
const plainDesc = computed(() => detailRow.value ? detailRow.value.desc?.replace(/<[^>]+>/g, '').trim() || '' : '');

// 复制答案
function copyAnswer() {
    const text = plainDesc.value;
    if (!text) { uni.showToast({ icon: 'none', title: '暂无答案可复制' }); return; }
    uni.setClipboardData({
        data: text,
        success: () => uni.showToast({ icon: 'success', title: '已复制到剪贴板' }),
        fail: () => uni.showToast({ icon: 'none', title: '复制失败' })
    });
}

const userId = uni.getStorageSync('userId');
const usertype = Number(uni.getStorageSync('usertype'));

// 编辑权限：管理员 或 本人创建
const canOperateRow = computed(() => {
	const row = detailRow.value;
	if (!row) return false;
	if (usertype === 0) return true;
	const creator = row.tcreater != null ? row.tcreater : row.creater;
	return creator != null && String(creator) === String(userId);
});

// 状态栏高度（自定义导航，弹层从屏幕顶端开始，需手动避让状态栏）
const statusBarHeight = ref(0);
const headerPad = computed(() => (statusBarHeight.value + 10) + 'px');

onMounted(() => {
	try {
		const info = uni.getSystemInfoSync();
		statusBarHeight.value = info.statusBarHeight || 0;
	} catch (e) { /* ignore */ }
});

// 打开时使用列表行数据（列表已含完整 desc，与 Web 端一致）
watch(visible, (v) => {
	if (!v) return;
	detailRow.value = props.row || null;
});

// 图片预览
function previewImage(index: number) {
	uni.previewImage({
		current: images.value[index],
		urls: images.value
	});
}
</script>

<style lang="scss" scoped>
.detail-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
}

/* 顶部 */
.detail-header {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	gap: 12rpx;
}

.detail-header-left,
.detail-header-right {
	width: 80rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
}

.detail-header-left {
	justify-content: flex-start;
}

.detail-header-right {
	justify-content: flex-end;
}

.detail-header-title {
	flex: 1;
	text-align: center;
	font-size: 32rpx;
	font-weight: 600;
}

.header-action {
	font-size: 28rpx;
	color: #1677ff;
}

/* 内容 */
.detail-scroll {
	flex: 1;
	min-height: 0;
	box-sizing: border-box;
}

.detail-body {
	padding: 20rpx 24rpx 40rpx;
}

/* 问题卡片 */
.problem-card {
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	border-left: 6rpx solid #1677ff;
}

.problem-title {
	display: block;
	font-size: 32rpx;
	font-weight: 600;
	line-height: 1.5;
}

.problem-meta {
	display: flex;
	justify-content: space-between;
	margin-top: 16rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #f5f6f8;
	font-size: 22rpx;
}

/* 答案卡片 */
.answer-card {
	border-radius: 16rpx;
	padding: 24rpx;
}

.answer-label,
.image-label {
	font-size: 26rpx;
	font-weight: 600;
	margin-bottom: 16rpx;
}

.answer-label-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.copy-btn {
	font-size: 26rpx;
	color: #69b1ff;
	padding: 4rpx 16rpx;
	background: rgba(105, 177, 255, 0.1);
	border-radius: 8rpx;
	flex-shrink: 0;
}

.answer-html {
	font-size: 28rpx;
	line-height: 1.7;
	word-break: break-word;
}

.answer-empty {
	font-size: 26rpx;
	padding: 20rpx 0;
}

/* 图片预览条 */
.image-section {
	margin-top: 24rpx;
	padding-top: 24rpx;
	border-top: 1rpx solid #f5f6f8;
}

.image-scroll {
	white-space: nowrap;
}

.thumb {
	display: inline-block;
	width: 180rpx;
	height: 180rpx;
	border-radius: 12rpx;
	margin-right: 16rpx;
	background: #f2f3f5;
}
</style>
