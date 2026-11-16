<template>
	<!-- 组件根节点不占文档流高度（否则会把页面撑高出一整屏，列表底部出现空白）；弹窗本体是 fixed 不受影响 -->
	<wd-config-provider :theme-vars="{}" :custom-style="isDark ? 'height: 0; overflow: hidden; background: #1b1b1b;' : 'height: 0; overflow: hidden;'" :theme="theme">
	<wd-popup v-model="visible" position="right" :z-index="1000" :lock-scroll="false" :custom-style="isDark ? 'width: 100vw; height: 100vh; background: #1b1b1b;' : 'width: 100vw; height: 100vh; background: #f5f6f8;'" @after-leave="emit('closed')">
		<view class="detail-page">
			<!-- 顶部 -->
			<view class="detail-header" :style="{ paddingTop: headerPad, background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view class="detail-header-left" @click="visible = false">
					<wd-icon name="arrow-left" size="20px" :color="isDark ? '#e8e8e8' : '#1a1a1a'"></wd-icon>
				</view>
				<text class="detail-header-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">阶段实施成果</text>
				<view class="detail-header-right"></view>
			</view>

			<!-- 内容 -->
			<scroll-view scroll-y class="detail-scroll">
				<view class="meta-row" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">
					<text>{{ username || '-' }}</text>
					<text>{{ (dbtime || '').slice(0, 10) }}</text>
				</view>

				<view v-for="(img, idx) in imgList" :key="img.id" class="img-card" :style="{ background: isDark ? '#242424' : '#ffffff', border: isDark ? '1rpx solid rgba(255,255,255,0.14)' : '1rpx solid #e5e6eb' }">
					<image class="img-thumb img-thumb-bordered" :src="img.url" mode="aspectFit" :style="{ borderBottomColor: isDark ? 'rgba(255,255,255,0.12)' : '#e5e6eb' }" @click="previewImage(idx)"></image>
					<view class="img-body">
						<view class="img-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">该图片的识别内容</view>
						<wd-textarea
							v-model="img.text"
							placeholder="请输入识别内容"
							:maxlength="-1"
							auto-height
							:custom-style="isDark ? 'background: #1b1b1b; border: 1rpx solid rgba(255,255,255,0.14); border-radius: 12rpx;' : 'background: #f7f8fa; border: 1rpx solid #dcdfe6; border-radius: 12rpx;padding: 12rpx;'"
						></wd-textarea>
					</view>
				</view>

				<view v-if="!imgList.length" class="img-empty" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">暂无图片</view>
			</scroll-view>

			<!-- 底部保存 -->
			<view class="detail-footer" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#f5f6f8' }">
				<wd-button type="primary" block :loading="saving" @click="handleSaveTexts">保存识别内容</wd-button>
			</view>

			<!-- 图片预览（层级高于弹窗，避免被全屏弹窗遮挡） -->
			<view v-if="previewVisible" class="preview-mask" @click="previewVisible = false">
				<image class="preview-img" :src="previewUrl" mode="aspectFit"></image>
			</view>
		</view>
	</wd-popup>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjRdFileList } from '@/service/prjRdFile';
import { fetchUpdatePrjdailyreportInfo } from '@/service/projectdailyreport';

const { theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
// wot 的 toast 需要页面挂 <wd-toast/> 节点才生效（本页未挂会静默无效），改用 uni 原生 toast
const toast = { show: (title: string) => uni.showToast({ icon: 'none', title }) };

const props = defineProps<{
	pid?: number | string;
	proid?: number | string;
	reportcon?: string;
	username?: string;
	dbtime?: string;
}>();

const emit = defineEmits<{
	(e: 'submitted'): void;
	(e: 'closed'): void;
}>();

const visible = defineModel<boolean>({ default: false });

// 图片预览（自绘遮罩，z-index 高于全屏弹窗）
const previewVisible = ref(false);
const previewUrl = ref('');

const imgList = ref<any[]>([]);
const listLoading = ref(false);
const saving = ref(false);

const statusBarHeight = ref(0);
const headerPad = computed(() => (statusBarHeight.value + 10) + 'px');

onMounted(() => {
	try {
		const info = uni.getSystemInfoSync();
		statusBarHeight.value = info.statusBarHeight || 0;
	} catch (e) { /* ignore */ }
});

// 打开时拉取列表；同时监听 pid 切换，确保换日报时也会刷新（避免上一次打开的图片残留）
watch(
	[visible, () => props.pid],
	([v, pid], [, oldPid]) => {
		if (!v) return;
		if (pid !== oldPid) {
			imgList.value = [];
		}
		getImgList();
	}
);

// 弹窗隐藏时同步关闭预览遮罩（fixed 定位，不随 wd-popup 位移，漏关会整屏盖在后续页面上）；同时停止图片渲染并释放缓存
watch(visible, (v) => {
	if (!v) {
		previewVisible.value = false;
		previewUrl.value = '';
	}
});

function parseReportcon(): any[] {
	try {
		const arr = JSON.parse(props.reportcon || '[]');
		return Array.isArray(arr) ? arr : [];
	} catch (e) {
		return [];
	}
}

async function getImgList() {
	if (!props.pid) return;
	if (listLoading.value) return;
	listLoading.value = true;
	try {
		const cons = parseReportcon();
		const res: any = await fetchGetPrjRdFileList({ proid: props.proid, pid: props.pid, page: 1, limit: 100, ftype: 10 });
		const rows = res?.list || res?.rows || [];
		imgList.value = rows.map((item: any) => {
			const matched = cons.find((c: any) => String(c.id) === String(item.id));
			const content = matched ? (matched.content ?? '') : '';
			return {
				id: item.id,
				url: item.furl,
				fname: item.fname || (item.furl || '').split('?')[1] || '',
				text: content,
				oldText: content,
			};
		});
	} catch (e) {
		console.error('日报图片列表加载失败', e);
	} finally {
		listLoading.value = false;
	}
}

function previewImage(idx: number) {
	previewUrl.value = imgList.value[idx]?.url || '';
	if (previewUrl.value) previewVisible.value = true;
}

async function handleSaveTexts() {
	const changed = imgList.value.filter((i) => (i.text || '') !== (i.oldText || ''));
	if (!changed.length) {
		toast.show('内容未发生变化');
		return;
	}
	if (saving.value) return;
	saving.value = true;
	try {
		// 与 web 端一致：全量回写所有图片的 {id, content}
		const newCons = imgList.value.map((i) => ({ id: i.id, content: i.text || '' }));
		await fetchUpdatePrjdailyreportInfo([{ id: props.pid, reportcon: JSON.stringify(newCons) }]);
		imgList.value.forEach((i) => { i.oldText = i.text || ''; });
		toast.show('保存成功');
		emit('submitted');
		// 保存成功后返回（延时关闭，留出提示展示时间）
		setTimeout(() => { visible.value = false; }, 500);
	} catch (e) {
		console.error('识别内容保存失败', e);
		toast.show('保存失败');
	} finally {
		saving.value = false;
	}
}
</script>

<style scoped lang="scss">
.detail-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
}

.detail-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 24rpx 12px;
	box-sizing: border-box;
}

.detail-header-left,
.detail-header-right {
	width: 80rpx;
}

.detail-header-title {
	font-size: 17px;
	font-weight: 600;
}

.detail-scroll {
	flex: 1;
	/* 防止内容撑高 flex 项把页面顶出屏幕，保证顶部标题固定 */
	min-height: 0;
	box-sizing: border-box;
	padding: 24rpx;
}

.meta-row {
	display: flex;
	justify-content: space-between;
	font-size: 13px;
	margin-bottom: 24rpx;
}

.img-card {
	border-radius: 12rpx;
	overflow: hidden;
	margin-bottom: 24rpx;
}

.img-thumb {
	width: 100%;
	height: 360rpx;
	display: block;
	background: rgba(0, 0, 0, 0.04);
}

/* 图片底部边框：与下方内容区域分隔，提示可点击预览 */
.img-thumb-bordered {
	border-bottom: 1rpx solid #e5e6eb;
	box-sizing: border-box;
}

.img-body {
	padding: 12rpx;
}

.img-title {
	font-size: 14px;
	font-weight: 600;
	margin-bottom: 16rpx;
}

.img-empty {
	text-align: center;
	font-size: 13px;
	padding: 60rpx 0;
}

.detail-footer {
	padding: 16rpx 24rpx calc(16rpx + constant(safe-area-inset-bottom)) 24rpx;
	padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)) 24rpx;
	border-top: 1rpx solid #f5f6f8;
}

/* 图片预览遮罩（覆盖在 z-index:1000 的全屏弹窗之上） */
.preview-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 1200;
	background: rgba(0, 0, 0, 0.95);
	display: flex;
	align-items: center;
	justify-content: center;
}

.preview-img {
	width: 100%;
	height: 100%;
}
</style>
