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
				<text class="detail-header-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">日报图片</text>
				<view class="detail-header-right"></view>
			</view>

			<!-- 内容 -->
			<scroll-view scroll-y class="detail-scroll">
				<view class="meta-row" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">
					<text>{{ username || '-' }}</text>
					<text>{{ (dbtime || '').slice(0, 10) }}</text>
				</view>

				<view class="img-grid">
					<view v-for="(img, idx) in imgList" :key="img.id" class="img-item">
						<image class="img-thumb" :src="img.url" mode="aspectFit" @click="previewImage(idx)"></image>
						<view v-if="canEdit" class="img-del" :style="{ background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)' }" @click.stop="handleDelete(img)">
							<wd-icon name="close" size="14px" color="#ffffff"></wd-icon>
						</view>
					</view>

					<!-- 上传入口（uni 原生选图：cjx-upload 的 renderjs 隐藏 input 在弹窗内易失效） -->
					<view v-if="canEdit" class="img-item img-add" :style="{ background: isDark ? '#242424' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e5e6eb' }" @click="handleChooseImage">
						<wd-icon v-if="!uploading" name="add" size="28px" :color="isDark ? '#6A7590' : '#c0c4cc'"></wd-icon>
						<text v-if="!uploading" class="img-add-text" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">上传图片</text>
						<text v-else class="img-add-text" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">上传中…</text>
					</view>
				</view>

				<view v-if="!imgList.length && !canEdit" class="img-empty" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">暂无图片</view>
			</scroll-view>

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
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { fetchGetPrjRdFileList, fetchAddPrjRdFile, fetchDeletePrjRdFile } from '@/service/prjRdFile';

const { theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
// wot 的 toast 需要页面挂 <wd-toast/> 节点才生效（本页未挂会静默无效），改用 uni 原生 toast
const toast = { show: (title: string) => uni.showToast({ icon: 'none', title }) };
const message = useMessage();

const props = defineProps<{
	pid?: number | string;
	proid?: number | string;
	canEdit?: boolean;
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
const uploading = ref(false);

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

async function getImgList() {
	if (!props.pid) return;
	if (listLoading.value) return;
	listLoading.value = true;
	try {
		const res: any = await fetchGetPrjRdFileList({ proid: props.proid, pid: props.pid, page: 1, limit: 100, ftype: 10 });
		const rows = res?.list || res?.rows || [];
		imgList.value = rows.map((item: any) => ({
			id: item.id,
			url: item.furl,
			fname: item.fname || (item.furl || '').split('?')[1] || '',
		}));
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

// 选择图片后上传（APP 相册/拍照只能选图片；Android 压缩临时文件常被转成 .jpg，后缀不可靠，故不强限 png）
function handleChooseImage() {
	if (uploading.value) return;
	uni.chooseImage({
		count: 1,
		success: (res) => {
			const path = res.tempFilePaths?.[0] || '';
			if (!path) return;
			const base = path.split('/').pop() || '';
			const name = /\.(png|jpe?g|webp|gif|bmp)$/i.test(base) ? base : `粘贴图片_${Date.now()}.png`;
			startUpload(path, name);
		},
		fail: (err) => {
			console.error('选择图片失败', err);
		},
	});
}

function startUpload(path: string, name: string) {
	uploading.value = true;
	uploadFile(
		{ tempFilePath: path, name },
		'',
		async (response: any, f: any) => {
			try {
				await fetchAddPrjRdFile({
					furl: response.data,
					fname: f?.name || name || `粘贴图片_${Date.now()}.png`,
					pid: props.pid,
					proid: props.proid,
					ftype: 10,
				});
				toast.show('上传成功');
				await getImgList();
				emit('submitted');
			} catch (e) {
				console.error('日报图片保存失败', e);
				toast.show('图片保存失败');
			} finally {
				uploading.value = false;
			}
		},
		(error: any) => {
			console.error('日报图片上传失败', error);
			toast.show('图片上传失败');
			uploading.value = false;
		},
	);
}

function handleDelete(img: any) {
	// zIndex 高于全屏弹窗（1000），否则确认框会被遮挡
	message.confirm({ title: '提示', msg: '确认删除该图片吗？', zIndex: 10099 }).then(async () => {
		try {
			await fetchDeletePrjRdFile(props.pid as any, img.id);
			toast.show('删除成功');
			await getImgList();
			emit('submitted');
		} catch (e) {
			console.error('日报图片删除失败', e);
			toast.show('删除失败');
		}
	}).catch(() => { /* 取消 */ });
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

.img-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.img-item {
	position: relative;
	width: 100%;
	height: 216rpx;
	border-radius: 12rpx;
	overflow: hidden;
}

.img-thumb {
	width: 100%;
	height: 100%;
	display: block;
	background: rgba(0, 0, 0, 0.04);
}

.img-del {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.img-add {
	border: 2rpx dashed #e5e6eb;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
}

.img-add-text {
	font-size: 12px;
}

.img-empty {
	text-align: center;
	font-size: 13px;
	padding: 60rpx 0;
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
