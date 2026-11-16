<template>
	<!-- 组件根节点不占文档流高度（否则会把页面撑高出一整屏，列表底部出现空白）；弹窗本体是 fixed 不受影响 -->
	<wd-config-provider :custom-style="isDark ? 'height: 0; overflow: hidden; background: #1b1b1b;' : 'height: 0; overflow: hidden;'" :theme="theme">
	<wd-popup v-model="visible" position="right" :z-index="1000" :lock-scroll="false" :custom-style="isDark ? 'width: 100vw; height: 100vh; background: #1b1b1b;' : 'width: 100vw; height: 100vh; background: #f5f6f8;'">
		<view class="detail-page">
			<!-- 顶部 -->
			<view class="detail-header" :style="{ paddingTop: headerPad, background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view class="detail-header-left" @click="closePopup">
					<wd-icon name="arrow-left" size="20px" :color="isDark ? '#e8e8e8' : '#1a1a1a'"></wd-icon>
				</view>
				<text class="detail-header-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ title }}</text>
				<view class="detail-header-right"></view>
			</view>

			<!-- 内容 -->
			<scroll-view scroll-y class="detail-scroll">
				<view class="meta-row" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">共 {{ imgList.length }} 张图片</view>

				<view class="img-grid">
					<!-- 上传入口（uni 原生选图：cjx-upload 的 renderjs 隐藏 input 在弹窗内易失效） -->
					<view class="img-item img-add" :style="{ background: isDark ? '#242424' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e5e6eb' }" @click="handleChooseImage">
						<wd-icon v-if="!uploading" name="add" size="28px" :color="isDark ? '#6A7590' : '#c0c4cc'"></wd-icon>
						<text v-if="!uploading" class="img-add-text" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">上传图片</text>
						<text v-else class="img-add-text" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">上传中…</text>
					</view>

					<view v-for="(img, idx) in imgList" :key="img.id ?? ('new-' + idx)" class="img-item" :style="{ background: isDark ? '#242424' : '#ffffff' }">
						<image class="img-thumb" :src="img.url" mode="aspectFill" @click="previewImage(idx)"></image>
						<view class="img-del" :style="{ background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)' }" @click.stop="handleDelete(img)">
							<wd-icon name="close" size="14px" color="#ffffff"></wd-icon>
						</view>
						<view v-if="img.name" class="img-name" :style="{ color: isDark ? '#6A7590' : '#86909c' }">{{ img.name }}</view>
					</view>
				</view>

				<view v-if="!imgList.length" class="img-empty" :style="{ color: isDark ? '#6A7590' : '#c0c4cc' }">暂无图片，点击上方上传</view>
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
import { fetchDispatchContactList, fetchAddDispatchContact, fetchDeleteDispatchContact } from '@/service/dispatch';
import { pickRows, pickTotal } from './constants';

const { theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
// wot 的 toast 需要页面挂 <wd-toast/> 节点才生效（本页未挂会静默无效），改用 uni 原生 toast
const toast = { show: (title: string) => uni.showToast({ icon: 'none', title }) };
const message = useMessage();

const props = defineProps<{
	pid?: number | string;
	dname?: string;
}>();

const emit = defineEmits<{
	(e: 'changed', count: number): void;
}>();

const visible = defineModel<boolean>({ default: false });

const title = computed(() => `${props.dname || ''} - 主站IP图片`);

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

// 打开时拉取列表；同时监听 pid 切换，确保换调度行时也会刷新（避免上一次打开的图片残留）
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

// 上传中不允许关闭，避免列表与入库状态不一致
function closePopup() {
	if (uploading.value) return;
	visible.value = false;
}

// 主站IP图片：projectDispatchSub type=10 附件，url 存 contactInformation，名称取 url ? 后部分（兜底 contactPerson）
async function getImgList() {
	if (!props.pid) return;
	if (listLoading.value) return;
	listLoading.value = true;
	try {
		const data = await fetchDispatchContactList({ pid: props.pid, type: 10, page: 1, limit: 100, pageSize: 100 });
		const rows = pickRows(data);
		imgList.value = rows.map((it: any) => ({
			id: it.id,
			url: it.contactInformation || '',
			name: (it.contactInformation || '').split('?')[1] || it.contactPerson || '',
		}));
		imgList.value.sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));
		emit('changed', pickTotal(data, rows));
	} catch (e) {
		console.error('主站IP图片列表加载失败', e);
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
			const name = /\.(png|jpe?g|webp|gif|bmp)$/i.test(base) ? base : `主站IP图片_${Date.now()}.png`;
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
				await fetchAddDispatchContact([{
					pid: props.pid,
					type: 10,
					contactPerson: f?.name || name || `主站IP图片_${Date.now()}.png`,
					contactInformation: response.data,
					notes: '',
				}]);
				toast.show('上传成功');
				await getImgList();
			} catch (e) {
				console.error('主站IP图片保存失败', e);
				toast.show('图片保存失败');
			} finally {
				uploading.value = false;
			}
		},
		(error: any) => {
			console.error('主站IP图片上传失败', error);
			toast.show('图片上传失败');
			uploading.value = false;
		},
	);
}

function handleDelete(img: any) {
	if (!img.id) {
		toast.show('图片处理中，请稍后再删除');
		return;
	}
	// zIndex 高于全屏弹窗（1000），否则确认框会被遮挡
	message.confirm({ title: '删除确认', msg: '是否删除该图片？', zIndex: 10099 }).then(async () => {
		try {
			await fetchDeleteDispatchContact(img.id);
			toast.show('删除成功');
			await getImgList();
		} catch (e) {
			console.error('主站IP图片删除失败', e);
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
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.detail-scroll {
	flex: 1;
	/* 防止内容撑高 flex 项把页面顶出屏幕，保证顶部标题固定 */
	min-height: 0;
	box-sizing: border-box;
	padding: 24rpx;
}

.meta-row {
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
	width: 216rpx;
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

.img-name {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 4rpx 10rpx;
	font-size: 18rpx;
	background: rgba(255, 255, 255, 0.85);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
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
