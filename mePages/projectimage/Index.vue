<script lang="ts" setup>
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { onReady, onLoad, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { useMessage } from 'wot-design-uni';
import { fetchGetPrjDataList } from '@/service/index';
import {
	fetchGetProjectImg,
	fetchRecordImageDownload,
	fetchInsertProjectFileEvaluation,
	fetchDeleteProjectFileEvaluation,
	fetchGetProjectFileEvaluationPage,
	fetchGetProjectFileDownloadPage,
} from '@/service/projectImage';

const message = useMessage();
const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const toast = { show: (title: string) => uni.showToast({ icon: 'none', title }) };

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
	page: number;
	limit: number;
	pid: number | undefined;
	fileType: string; // all=全部 image=图片 video=视频
	downloadFlag: number; // -1=全部 1=已下载 0=未下载
	startDate: any;
	endDate: any;
}>({
	page: 1,
	limit: 20,
	pid: undefined,
	fileType: 'all',
	downloadFlag: -1,
	startDate: null,
	endDate: null,
});

const fileTypeColumns = [
	{ value: 'all', label: '全部类型' },
	{ value: 'image', label: '图片' },
	{ value: 'video', label: '视频' },
];
const downloadColumns = [
	{ value: -1, label: '全部' },
	{ value: 1, label: '已下载' },
	{ value: 0, label: '未下载' },
];

// ===== 文件类型识别（对齐 web 端：接口混合返回图片、视频与压缩包） =====
const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
const videoExts = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'mkv', 'flv', '3gp', 'm4v', 'mpg'];
const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'tgz'];
const getFileExt = (item: any) => {
	// 查询串里可能带真实文件名（path?真实名.ext），先去掉
	const path = String(item?.filePath || '').split('?')[0];
	return path.toLowerCase().split('.').pop() || '';
};
const isImageItem = (item: any) => imageExts.includes(getFileExt(item));
const isVideoItem = (item: any) => videoExts.includes(getFileExt(item));
const isArchiveItem = (item: any) => archiveExts.includes(getFileExt(item));

// ===== 项目选择弹窗（项目分页接口 projectInfo/getPage.do + fuzzy，同 addtechnicalsupportdaily） =====
const projectPopup = ref(false);
const projectKeyword = ref('');
const projectLoading = ref(false);
const projectRawList = ref<any[]>([]);
const projectTotal = ref(0);
const pickedProjectName = ref('');
let projectSeq = 0;
let projectPage = 1;

const selectedProjectName = computed(() => {
	if (dataForm.pid === undefined) return '';
	const p = projectRawList.value.find((x: any) => String(x.id) === String(dataForm.pid));
	return p?.proname || p?.proName || pickedProjectName.value;
});

async function loadProjects(keyword?: string, showTip = false) {
	const seq = ++projectSeq;
	projectLoading.value = true;
	if (showTip) uni.showLoading({ title: '搜索中...' });
	let empty = false;
	let failed = false;
	try {
		const data: any = await fetchGetPrjDataList({ page: 1, limit: 50, fuzzy: keyword || undefined }, false);
		if (seq !== projectSeq) return;
		// 以后端 fuzzy 结果为准，不做前端二次过滤
		projectRawList.value = (data?.list || []).filter((p: any) => p && (p.proname || p.proName));
		projectPage = 1;
		projectTotal.value = Number(data?.total) || 0;
		empty = projectRawList.value.length === 0;
	} catch (e) {
		console.error('获取项目列表失败', e);
		if (seq === projectSeq) {
			projectRawList.value = [];
			failed = true;
		}
	} finally {
		if (showTip) uni.hideLoading();
		if (seq === projectSeq) {
			projectLoading.value = false;
			if (showTip && failed) toast.show('搜索失败');
			else if (showTip && empty) toast.show('未找到匹配项目');
		}
	}
}

// 弹层滚到底追加下一页（projectInfo/getPage.do 分页口径同 addtechnicalsupportdaily）
function loadMoreProjects() {
	if (projectLoading.value || projectRawList.value.length >= projectTotal.value) return;
	const seq = ++projectSeq;
	const page = projectPage + 1;
	projectLoading.value = true;
	fetchGetPrjDataList({ page, limit: 50, fuzzy: projectKeyword.value || undefined }, false)
		.then((data: any) => {
			if (seq !== projectSeq) return;
			const arr = (data?.list || []).filter((p: any) => p && (p.proname || p.proName));
			const old = projectRawList.value;
			projectRawList.value = old.concat(arr);
			projectPage = page;
			projectTotal.value = Number(data?.total) || 0;
		})
		.catch((e: any) => console.error('加载更多项目失败', e))
		.finally(() => {
			if (seq === projectSeq) projectLoading.value = false;
		});
}

function openProjectPopup() {
	projectPopup.value = true;
	if (!projectRawList.value.length) loadProjects();
}

// 选中项目后重置回第一页查询（与 web 端 handleProjectSelect 一致）
function selectProject(item: any) {
	dataForm.pid = item.id;
	pickedProjectName.value = item.proname || item.proName || '';
	projectPopup.value = false;
	handleSearchChange();
}

const listLoading = ref(false);
let pendingReload = false;

// 在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页
async function getDataList() {
	if (listLoading.value) {
		pendingReload = true;
		return;
	}
	listLoading.value = true;
	try {
		if (dataForm.page === 1) {
			dataList.value = [];
		}
		const data: any = await fetchGetProjectImg({
			page: dataForm.page,
			limit: dataForm.limit,
			pid: dataForm.pid,
			// 已下载筛选：-1=全部不传；类型筛选映射为 sort：4=现场照片 8=现场视频
			downloaded: dataForm.downloadFlag === -1 ? undefined : dataForm.downloadFlag === 1,
			sort: dataForm.fileType === 'all' ? undefined : dataForm.fileType === 'image' ? 4 : 8,
			startTime: fmtDate(dataForm.startDate),
			endTime: fmtDate(dataForm.endDate),
		});
		const rows = (Array.isArray(data) ? data : (data && (data.list || data.records))) || [];
		// 计数字段后端可能返回字符串（Long→String），统一转数字；evaluated 回显评价激活态
		const list = (Array.isArray(rows) ? rows : []).map((it: any) => ({
			...it,
			likeCount: Number(it.likeCount) || 0,
			notAdoptedCount: Number(it.notAdoptedCount) || 0,
			downloadCount: Number(it.downloadCount) || 0,
			likeFlag: it.evaluated === '点赞' ? 1 : 0,
			rejectFlag: it.evaluated === '不采纳' ? 1 : 0,
		}));
		if (dataForm.page === 1) {
			eagerKeys.value = [];
		}
		dataList.value = dataList.value.concat(list);
		promoteEagerImages();
		total.value = Number(data && data.total != null ? data.total : list.length);
		state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
	} catch (err) {
		console.error('获取现场文件失败', err);
		state.value = 'error';
	} finally {
		listLoading.value = false;
		if (pendingReload) {
			pendingReload = false;
			getDataList();
		}
	}
}

// ===== 瀑布流：两列均分（图片 widthFix 按真实宽高比撑开，自然错落成瀑布流） =====
const leftColumn = computed(() => dataList.value.filter((_: any, i: number) => i % 2 === 0));
const rightColumn = computed(() => dataList.value.filter((_: any, i: number) => i % 2 === 1));

function fmtDate(v: any) {
	if (v == null || v === '') return undefined;
	const d = new Date(v);
	if (isNaN(d.getTime())) return undefined;
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function handleClickLeft() {
	// #ifdef H5
	history.go(-1);
	// #endif

	// #ifndef H5
	uni.navigateBack();
	// #endif
}

function handleSearchChange() {
	dataForm.page = 1;
	getDataList();
}

function resetFilter() {
	dataForm.fileType = 'all';
	dataForm.downloadFlag = -1;
	dataForm.startDate = null;
	dataForm.endDate = null;
	dataForm.page = 1;
	getDataList();
}

// wd-picker 只 emit confirm/cancel，联动刷新用 @confirm
function onFileTypeConfirm({ value }: any) {
	dataForm.fileType = Array.isArray(value) ? value[0] : value;
	handleSearchChange();
}
function onDownloadConfirm({ value }: any) {
	dataForm.downloadFlag = Array.isArray(value) ? value[0] : value;
	handleSearchChange();
}
function onStartDateConfirm({ value }: any) {
	dataForm.startDate = value;
	handleSearchChange();
}
function onEndDateConfirm({ value }: any) {
	dataForm.endDate = value;
	handleSearchChange();
}

// ===== 图片懒加载：未放行的图片先渲染灰色骨架块，滚动时按批挂载真实 <image> =====
// 不用「占位图换 src」方案：App 端 webview 对节点换 src 不一定重新拉取（可视区白块、预览却有图），
// 且透明占位图的 load 事件会把宽高比污染成 1:1，容器被 aspect-ratio 撑成方形后图片下方留白
const imgRatioMap = ref<Record<string, { w: number; h: number }>>({});
// 当前已挂载真实图片的 key 集合：首屏先挂前 6 张，滚动/触底时按批递增
const eagerKeys = ref<string[]>([]);
// 已挂载集合放 computed：模板里频繁读取，computed 才能正确追踪并触发重渲染（普通 ref 在函数体内读 .value 不会建立依赖）
const eagerKeySet = computed(() => new Set(eagerKeys.value));
const EAGER_BATCH = 6;

const imgKey = (item: any) => String(item?.fileId ?? item?.filePath ?? '');
const isEager = (item: any) => eagerKeySet.value.has(imgKey(item));

function onImgLoad(item: any, e: any) {
	const k = imgKey(item);
	const w = Number(e?.detail?.width) || 0;
	const h = Number(e?.detail?.height) || 0;
	if (k && w > 0 && h > 0) {
		imgRatioMap.value = { ...imgRatioMap.value, [k]: { w, h } };
	}
}

// 列表更新后：按列表顺序补挂 EAGER_BATCH 张（已挂载的不动）
function promoteEagerImages() {
	const keys = dataList.value.filter((it: any) => isImageItem(it)).map((it: any) => imgKey(it));
	if (!keys.length) {
		eagerKeys.value = [];
		return;
	}
	const next = eagerKeys.value.filter((k) => keys.includes(k));
	const target = next.length + EAGER_BATCH;
	for (const k of keys) {
		if (next.length >= target) break;
		if (!next.includes(k)) next.push(k);
	}
	eagerKeys.value = next;
}

// 滚动时节流放行下一批：250ms 一批、不设上限，保证可视区内的图能及时挂载，不会一直白块
let lastPromoteAt = 0;
function onScrollLazy() {
	const now = Date.now();
	if (now - lastPromoteAt < 250) return;
	lastPromoteAt = now;
	promoteEagerImages();
}

// 容器高度：已知宽高比 → aspect-ratio 提前撑开；未知 → 最小高度，图片挂载后由内容自然撑开
function imgWrapStyle(item: any) {
	const r = imgRatioMap.value[imgKey(item)];
	if (r && r.w > 0 && r.h > 0) {
		return `aspect-ratio: ${r.w} / ${r.h};`;
	}
	return 'min-height: 200rpx;';
}

// ===== 图片预览（自绘遮罩 + 左右切换；仅图片进入轮播，视频/压缩包不混入） =====
const previewShow = ref(false);
const previewList = ref<any[]>([]);
const previewIndex = ref(0);
const currentPreviewItem = computed(() => previewList.value[previewIndex.value] || null);

function openPreview(item: any) {
	const images = dataList.value.filter((x: any) => isImageItem(x) && x.filePath);
	const pos = images.findIndex((x: any) => (x.fileId ?? x.filePath) === (item.fileId ?? item.filePath));
	if (pos < 0) return;
	previewList.value = images;
	previewIndex.value = pos;
	previewShow.value = true;
}

function previewPrev() {
	if (previewIndex.value > 0) previewIndex.value--;
}
function previewNext() {
	if (previewIndex.value < previewList.value.length - 1) previewIndex.value++;
}

// ===== 视频播放（点封面后才挂载 video 加载源，实现视频懒加载） =====
const videoShow = ref(false);
const videoItem = ref<any>(null);

function openVideo(item: any) {
	if (!item?.filePath) return;
	videoItem.value = item;
	videoShow.value = true;
}
function closeVideo() {
	videoShow.value = false;
	videoItem.value = null;
}

// 卡片点击分流：视频展开播放、压缩包直接下载、图片走大图预览（对齐 web 端）
function handleItemClick(item: any) {
	if (isVideoItem(item)) {
		openVideo(item);
	} else if (isArchiveItem(item)) {
		handleDownload(item);
	} else {
		openPreview(item);
	}
}

// ===== 下载（先调记录接口，成功后才开始下载，对齐 web 端 handleRecordDownload） =====
const downloadName = (it: any) => {
	const raw = String(it?.filePath || '');
	const qIndex = raw.indexOf('?');
	const qs = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
	const pathName = (qIndex >= 0 ? raw.slice(0, qIndex) : raw).split('/').pop() || '';
	const qsName = qs && !qs.includes('=') ? qs.split('&')[0] : '';
	let base = String(it?.fileName || qsName || pathName || 'file').split('/').pop() || 'file';
	try {
		base = decodeURIComponent(base);
	} catch (e) { /* 保持原样 */ }
	return base;
};

async function handleDownload(item: any) {
	if (!item?.filePath) return;
	if (item.fileId) {
		try {
			await fetchRecordImageDownload({ fileId: item.fileId });
		} catch (e) {
			console.error('下载记录失败', e);
			return;
		}
		item.downloadCount = (Number(item.downloadCount) || 0) + 1;
	}
	const url = String(item.filePath).split('?')[0];
	uni.showLoading({ title: '下载中...' });
	uni.downloadFile({
		url,
		success: (res) => {
			if (res.statusCode !== 200) {
				toast.show('下载失败');
				return;
			}
			const tmp = res.tempFilePath;
			if (isImageItem(item)) {
				uni.saveImageToPhotosAlbum({
					filePath: tmp,
					success: () => toast.show('已保存到相册'),
					fail: () => toast.show('保存相册失败'),
				});
			} else if (isVideoItem(item)) {
				uni.saveVideoToPhotosAlbum({
					filePath: tmp,
					success: () => toast.show('已保存到相册'),
					fail: () => toast.show('保存相册失败'),
				});
			} else {
				// 压缩包无法直接保存相册，落入应用目录并提示
				// #ifdef APP-PLUS
				try {
					const plusAny: any = (globalThis as any).plus;
					const target = `_downloads/${Date.now()}_${downloadName(item)}`;
					plusAny.io.resolveLocalFileSystemURL(tmp, (entry: any) => {
						entry.moveTo(plusAny.io.convertLocalFileSystemURL(target), undefined,
							() => toast.show('已下载到应用目录'),
							() => toast.show('下载完成'));
					}, () => toast.show('下载完成'));
				} catch (err) {
					toast.show('下载完成');
				}
				// #endif
				// #ifndef APP-PLUS
				toast.show('下载完成');
				// #endif
			}
		},
		fail: (err) => {
			console.error('下载失败', err);
			toast.show('下载失败');
		},
		complete: () => {
			uni.hideLoading();
		},
	});
}

// ===== 点赞 / 不采纳（对齐 web 端：点已激活→删除取消；切换→删旧加新；insert 报已评价→删旧加新兜底） =====
const toCount = (v: any) => Number(v) || 0;

const applyEvaluation = (item: any, evaluation: string) => {
	const wasLiked = item.likeFlag === 1;
	const wasRejected = item.rejectFlag === 1;
	item.likeFlag = evaluation === '点赞' ? 1 : 0;
	item.rejectFlag = evaluation === '不采纳' ? 1 : 0;
	if (evaluation === '点赞') {
		if (!wasLiked) item.likeCount = toCount(item.likeCount) + 1;
		if (wasRejected) item.notAdoptedCount = Math.max(toCount(item.notAdoptedCount) - 1, 0);
	} else {
		if (!wasRejected) item.notAdoptedCount = toCount(item.notAdoptedCount) + 1;
		if (wasLiked) item.likeCount = Math.max(toCount(item.likeCount) - 1, 0);
	}
};

const deleteEvaluation = async (fileId: number) => {
	try {
		await fetchDeleteProjectFileEvaluation({ fileId });
		return true;
	} catch (e) {
		console.error('删除评价失败', e);
		return false;
	}
};

const insertEvaluation = async (item: any, evaluation: string) => {
	try {
		await fetchInsertProjectFileEvaluation({ fileId: item.fileId, evaluation });
		return true;
	} catch (e: any) {
		// "文件不存在或当前用户已评价" → 服务端已有记录，删旧再加新
		const msg = String(e?.msg || e?.message || '');
		if (!msg.includes('已评价')) {
			console.error('新增评价失败', e);
			return false;
		}
		if (!(await deleteEvaluation(item.fileId))) return false;
		try {
			await fetchInsertProjectFileEvaluation({ fileId: item.fileId, evaluation });
			return true;
		} catch (e2) {
			console.error('新增评价失败', e2);
			return false;
		}
	}
};

const submitEvaluation = async (item: any, evaluation: string) => {
	if (!item?.fileId) return;
	const target = evaluation === '点赞' ? item.likeFlag === 1 : item.rejectFlag === 1;
	if (target) {
		if (!(await deleteEvaluation(item.fileId))) return;
		if (evaluation === '点赞') {
			item.likeCount = Math.max(toCount(item.likeCount) - 1, 0);
			item.likeFlag = 0;
		} else {
			item.notAdoptedCount = Math.max(toCount(item.notAdoptedCount) - 1, 0);
			item.rejectFlag = 0;
		}
		return;
	}
	const other = evaluation === '点赞' ? item.rejectFlag === 1 : item.likeFlag === 1;
	if (other && !(await deleteEvaluation(item.fileId))) return;
	if (!(await insertEvaluation(item, evaluation))) return;
	applyEvaluation(item, evaluation);
};

// ===== 评价 / 下载记录弹窗 =====
const logShow = ref(false);
const logLoading = ref(false);
const logList = ref<any[]>([]);
const dlShow = ref(false);
const dlLoading = ref(false);
const dlList = ref<any[]>([]);

async function openEvaluationLog(item: any) {
	if (!item?.fileId) return;
	logShow.value = true;
	logLoading.value = true;
	logList.value = [];
	try {
		const data: any = await fetchGetProjectFileEvaluationPage({ page: 1, limit: 100, fileId: item.fileId });
		logList.value = (data && (data.list || data.records)) || [];
	} catch (e) {
		console.error('评价记录加载失败', e);
	} finally {
		logLoading.value = false;
	}
}

async function openDownloadLog(item: any) {
	if (!item?.fileId) return;
	dlShow.value = true;
	dlLoading.value = true;
	dlList.value = [];
	try {
		const data: any = await fetchGetProjectFileDownloadPage({ page: 1, limit: 100, fileId: item.fileId });
		dlList.value = (data && (data.list || data.records)) || [];
	} catch (e) {
		console.error('下载记录加载失败', e);
	} finally {
		dlLoading.value = false;
	}
}

// ===== 顶部固定区域高度 =====
function recalcTopFixedHeight() {
	try {
		uni.createSelectorQuery()
			.select('.topFixedWrap')
			.boundingClientRect((rect: any) => {
				if (rect && rect.height !== undefined) {
					topFixedHeight.value = rect.height;
				}
			})
			.exec();
	} catch (err) {
		topFixedHeight.value = 200;
	}
}

onLoad(() => {
	getDataList();
	loadProjects();
});

onReady(() => {
	recalcTopFixedHeight();
});

onMounted(() => {
	nextTick(() => {
		setTimeout(() => {
			recalcTopFixedHeight();
		}, 80);
	});
});

onPageScroll((e) => {
	scrollTop.value = e.scrollTop;
	onScrollLazy();
});

onPullDownRefresh(() => {
	dataForm.page = 1;
	getDataList();
	setTimeout(() => {
		uni.hideNavigationBarLoading();
		uni.stopPullDownRefresh();
	}, 1000);
});

onReachBottom(() => {
	if (listLoading.value) return;
	// 触底先放行下一批图片（懒加载渐进加载），不够再翻页
	promoteEagerImages();
	if (dataList.value.length < total.value) {
		dataForm.page++;
		getDataList();
	} else if (dataList.value.length === total.value) {
		state.value = 'finished';
	}
});
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<!-- 占位：顶部固定区域高度（动态计算） -->
		<view :style="{ height: topFixedHeight + 'px' }"></view>

		<view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#323233' : '#FFFFFF' }">
			<wd-navbar left-arrow title="项目现场文件" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />

			<!-- 项目选择 + 筛选 -->
			<view class="filter-row" :style="{ background: isDark ? '#323233' : '#ffffff' }">
				<view class="filter-box project-box" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f5f5f5)' }" @click="openProjectPopup">
					<view class="picker-trigger">
						<text class="picker-value" :class="{ placeholder: !selectedProjectName, 'picker-value-dark': isDark && selectedProjectName }">{{ selectedProjectName || '全部项目' }}</text>
						<wd-icon name="arrow-down" size="20px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
					</view>
				</view>
				<view class="filter-box" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f5f5f5)' }">
					<wd-picker :columns="fileTypeColumns" v-model="dataForm.fileType" use-default-slot @confirm="onFileTypeConfirm">
						<view class="picker-trigger">
							<text class="picker-value" :class="{ 'picker-value-dark': isDark }">{{ fileTypeColumns.find(c => c.value === dataForm.fileType)?.label }}</text>
							<wd-icon name="arrow-down" size="20px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
						</view>
					</wd-picker>
				</view>
				<view class="filter-box" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f5f5f5)' }">
					<wd-picker :columns="downloadColumns" v-model="dataForm.downloadFlag" use-default-slot @confirm="onDownloadConfirm">
						<view class="picker-trigger">
							<text class="picker-value" :class="{ 'picker-value-dark': isDark }">{{ downloadColumns.find(c => c.value === dataForm.downloadFlag)?.label }}</text>
							<wd-icon name="arrow-down" size="20px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
						</view>
					</wd-picker>
				</view>
			</view>

			<!-- 日期范围 -->
			<view class="filter-row" :style="{ background: isDark ? '#323233' : '#ffffff' }">
				<view class="filter-box" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f5f5f5)' }">
					<wd-datetime-picker type="date" v-model="dataForm.startDate" :default-value="Date.now()" use-default-slot @confirm="onStartDateConfirm">
						<view class="picker-trigger">
							<text class="picker-value" :class="{ placeholder: !dataForm.startDate, 'picker-value-dark': isDark && dataForm.startDate }">{{ fmtDate(dataForm.startDate) || '开始日期' }}</text>
							<wd-icon name="arrow-down" size="14px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
						</view>
					</wd-datetime-picker>
				</view>
				<view class="filter-box" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f5f5f5)' }">
					<wd-datetime-picker type="date" v-model="dataForm.endDate" :default-value="Date.now()" use-default-slot @confirm="onEndDateConfirm">
						<view class="picker-trigger">
							<text class="picker-value" :class="{ placeholder: !dataForm.endDate, 'picker-value-dark': isDark && dataForm.endDate }">{{ fmtDate(dataForm.endDate) || '结束日期' }}</text>
							<wd-icon name="arrow-down" size="14px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
						</view>
					</wd-datetime-picker>
				</view>
				<view class="filter-reset" :class="{ dark: isDark }" @click="resetFilter">重置</view>
			</view>

			<!-- 数据总览 -->
			<view class="summary-bar" :style="{ background: isDark ? '#323233' : '#ffffff' }">
				<view class="summary-chip" :style="{ background: isDark ? '#2a2a2a' : 'var(--wd-bg-color-grey, #f7f8fa)' }">
					<text class="summary-dot"></text>
					<text class="summary-text" :style="{ color: isDark ? '#ffffff' : '#000000' }">已加载 <text class="summary-num">{{ dataList.length }}</text> / 共 <text class="summary-num">{{ total }}</text> 个文件</text>
				</view>
			</view>
		</view>

		<!-- 瀑布流两列 -->
		<view v-if="dataList.length > 0" class="waterfall-wrap">
			<view class="wf-column">
				<view v-for="item in leftColumn" :key="item.fileId ?? item.filePath" class="wf-card" :class="{ 'wf-card-dark': isDark }">
					<!-- 图片：占位图懒加载 + widthFix；按 load 回填的真实宽高比撑开占位，保证瀑布流错落不塌 -->
					<view v-if="isImageItem(item)" class="wf-media" :style="imgWrapStyle(item)" @click="handleItemClick(item)">
						<!-- 只在放行后挂载真实 image：节点一次性用真实地址创建，避免换 src 不触发加载 -->
						<image v-if="isEager(item)" class="wf-image" :src="item.filePath" mode="widthFix" :show-menu-by-longpress="false" @load="onImgLoad(item, $event)"></image>
						<view v-else class="wf-image-skeleton"></view>
					</view>
					<!-- 视频：只渲染封面占位，点击后才加载视频源（懒加载） -->
					<view v-else-if="isVideoItem(item)" class="wf-media wf-video-cover" @click="handleItemClick(item)">
						<view class="wf-video-inner" :style="{ background: isDark ? '#242424' : '#1a1a1a' }">
							<view class="wf-video-play">
								<wd-icon name="play" size="26px" color="#ffffff"></wd-icon>
							</view>
							<text class="wf-video-tip">点击播放</text>
						</view>
					</view>
					<!-- 压缩包 -->
					<view v-else class="wf-media wf-archive" :style="{ background: isDark ? '#242424' : '#f7f8fa' }" @click="handleItemClick(item)">
						<wd-icon name="file-unknown" size="30px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
						<text class="wf-archive-tip" :style="{ color: isDark ? '#8a9099' : '#86909c' }">点击下载</text>
					</view>

					<!-- 信息 -->
					<view class="wf-info">
						<view class="wf-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ downloadName(item) }}</view>
						<view v-if="item.projectName" class="wf-project" :style="{ color: isDark ? '#8a9099' : '#86909c' }">{{ item.projectName }}</view>

						<!-- 操作行：点赞 / 不采纳 / 下载 -->
						<view class="wf-actions">
							<view class="wf-action" :class="{ active: item.likeFlag === 1 }" @click.stop="submitEvaluation(item, '点赞')">
								<wd-icon name="thumb-up" size="20px" :color="item.likeFlag === 1 ? '#1677ff' : (isDark ? '#8a9099' : '#86909c')"></wd-icon>
								<text class="wf-action-num" :style="{ color: item.likeFlag === 1 ? '#1677ff' : (isDark ? '#8a9099' : '#86909c') }" @click.stop="openEvaluationLog(item)">{{ item.likeCount }}</text>
							</view>
							<view class="wf-action" :class="{ active: item.rejectFlag === 1 }" @click.stop="submitEvaluation(item, '不采纳')">
								<wd-icon name="thumb-down" size="20px" :color="item.rejectFlag === 1 ? '#dd524d' : (isDark ? '#8a9099' : '#86909c')"></wd-icon>
								<text class="wf-action-num" :style="{ color: item.rejectFlag === 1 ? '#dd524d' : (isDark ? '#8a9099' : '#86909c') }">{{ item.notAdoptedCount }}</text>
							</view>
							<view class="wf-action" @click.stop="handleDownload(item)">
								<wd-icon name="download" size="20px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
								<text class="wf-action-num" :style="{ color: isDark ? '#8a9099' : '#86909c' }" @click.stop="openDownloadLog(item)">{{ item.downloadCount }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view class="wf-column">
				<view v-for="item in rightColumn" :key="item.fileId ?? item.filePath" class="wf-card" :class="{ 'wf-card-dark': isDark }">
					<view v-if="isImageItem(item)" class="wf-media" :style="imgWrapStyle(item)" @click="handleItemClick(item)">
						<!-- 只在放行后挂载真实 image：节点一次性用真实地址创建，避免换 src 不触发加载 -->
						<image v-if="isEager(item)" class="wf-image" :src="item.filePath" mode="widthFix" :show-menu-by-longpress="false" @load="onImgLoad(item, $event)"></image>
						<view v-else class="wf-image-skeleton"></view>
					</view>
					<view v-else-if="isVideoItem(item)" class="wf-media wf-video-cover" @click="handleItemClick(item)">
						<view class="wf-video-inner" :style="{ background: isDark ? '#242424' : '#1a1a1a' }">
							<view class="wf-video-play">
								<wd-icon name="play" size="26px" color="#ffffff"></wd-icon>
							</view>
							<text class="wf-video-tip">点击播放</text>
						</view>
					</view>
					<view v-else class="wf-media wf-archive" :style="{ background: isDark ? '#242424' : '#f7f8fa' }" @click="handleItemClick(item)">
						<wd-icon name="file-unknown" size="30px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
						<text class="wf-archive-tip" :style="{ color: isDark ? '#8a9099' : '#86909c' }">点击下载</text>
					</view>

					<view class="wf-info">
						<view class="wf-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ downloadName(item) }}</view>
						<view v-if="item.projectName" class="wf-project" :style="{ color: isDark ? '#8a9099' : '#86909c' }">{{ item.projectName }}</view>
						<view class="wf-actions">
							<view class="wf-action" :class="{ active: item.likeFlag === 1 }" @click.stop="submitEvaluation(item, '点赞')">
								<wd-icon name="thumb-up" size="20px" :color="item.likeFlag === 1 ? '#1677ff' : (isDark ? '#8a9099' : '#86909c')"></wd-icon>
								<text class="wf-action-num" :style="{ color: item.likeFlag === 1 ? '#1677ff' : (isDark ? '#8a9099' : '#86909c') }" @click.stop="openEvaluationLog(item)">{{ item.likeCount }}</text>
							</view>
							<view class="wf-action" :class="{ active: item.rejectFlag === 1 }" @click.stop="submitEvaluation(item, '不采纳')">
								<wd-icon name="thumb-down" size="20px" :color="item.rejectFlag === 1 ? '#dd524d' : (isDark ? '#8a9099' : '#86909c')"></wd-icon>
								<text class="wf-action-num" :style="{ color: item.rejectFlag === 1 ? '#dd524d' : (isDark ? '#8a9099' : '#86909c') }">{{ item.notAdoptedCount }}</text>
							</view>
							<view class="wf-action" @click.stop="handleDownload(item)">
								<wd-icon name="download" size="20px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
								<text class="wf-action-num" :style="{ color: isDark ? '#8a9099' : '#86909c' }" @click.stop="openDownloadLog(item)">{{ item.downloadCount }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-else-if="state === 'loading'" class="empty-wrap" :class="{ 'empty-wrap-dark': isDark }">
			<wd-loading size="24px"></wd-loading>
			<text class="empty-loading-text">加载中...</text>
		</view>

		<view v-else class="empty-wrap" :class="{ 'empty-wrap-dark': isDark }">
			<wd-status-tip image="../../static/search.png" tip="暂无现场文件" />
		</view>

		<wd-loadmore v-if="dataList.length > 0" :state="state" @reload="getDataList" />
		<wd-backtop :bottom="105" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>

		<!-- 项目选择弹窗 -->
		<wd-popup v-model="projectPopup" position="bottom" :z-index="1000" :custom-style="isDark ? 'height: 70vh; background: #1b1b1b; border-radius: 24rpx 24rpx 0 0;' : 'height: 70vh; background: #ffffff; border-radius: 24rpx 24rpx 0 0;'">
			<view class="project-popup" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view class="project-popup-head">
					<text class="project-popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">选择项目</text>
					<wd-icon name="close" size="18px" :color="isDark ? '#8a9099' : '#86909c'" @click="projectPopup = false"></wd-icon>
				</view>
				<wd-search v-model="projectKeyword" placeholder="搜索项目名称" placeholder-left cancel-txt="搜索" @search="loadProjects(projectKeyword, true)" @cancel="loadProjects(projectKeyword, true)" @clear="loadProjects()" />
				<scroll-view scroll-y class="project-list" @scrolltolower="loadMoreProjects">
					<view class="project-item project-all" :class="{ dark: isDark }" @click="selectProject({ id: undefined, proname: '' })">
						<text :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">全部项目</text>
					</view>
					<view v-for="p in projectRawList" :key="p.id" class="project-item" :class="{ dark: isDark, active: String(p.id) === String(dataForm.pid) }" @click="selectProject(p)">
						<text class="project-item-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ p.proname || p.proName }}</text>
						<wd-icon v-if="String(p.id) === String(dataForm.pid)" name="check" size="16px" color="#1677ff"></wd-icon>
					</view>
					<view v-if="projectLoading && !projectRawList.length" class="project-loading">
						<wd-loading size="20px"></wd-loading>
					</view>
					<view v-else-if="projectLoading && projectRawList.length" class="project-loading" :style="{ color: isDark ? '#8a9099' : '#86909c' }">加载中...</view>
					<view v-else-if="!projectRawList.length" class="project-empty" :style="{ color: isDark ? '#8a9099' : '#c0c4cc' }">暂无项目</view>
				</scroll-view>
			</view>
		</wd-popup>

		<!-- 图片预览（自绘遮罩，层级高于页面与弹窗） -->
		<view v-if="previewShow && currentPreviewItem" class="preview-mask" @click="previewShow = false">
			<image class="preview-img" :src="currentPreviewItem.filePath" mode="aspectFit"></image>
			<view class="preview-count">{{ previewIndex + 1 }} / {{ previewList.length }}</view>
			<view v-if="previewIndex > 0" class="preview-nav preview-prev" @click.stop="previewPrev">
				<wd-icon name="arrow-left" size="22px" color="#ffffff"></wd-icon>
			</view>
			<view v-if="previewIndex < previewList.length - 1" class="preview-nav preview-next" @click.stop="previewNext">
				<wd-icon name="arrow-right" size="22px" color="#ffffff"></wd-icon>
			</view>
			<!-- 预览底部操作：点赞 / 不采纳 / 下载（对齐 web 端预览操作区） -->
			<view class="preview-actions" @click.stop>
				<view class="preview-action" @click.stop="submitEvaluation(currentPreviewItem, '点赞')">
					<wd-icon name="thumb-up" size="18px" :color="currentPreviewItem.likeFlag === 1 ? '#1677ff' : '#ffffff'"></wd-icon>
					<text>{{ currentPreviewItem.likeCount }}</text>
				</view>
				<view class="preview-action" @click.stop="submitEvaluation(currentPreviewItem, '不采纳')">
					<wd-icon name="thumb-down" size="18px" :color="currentPreviewItem.rejectFlag === 1 ? '#dd524d' : '#ffffff'"></wd-icon>
					<text>{{ currentPreviewItem.notAdoptedCount }}</text>
				</view>
				<view class="preview-action" @click.stop="handleDownload(currentPreviewItem)">
					<wd-icon name="download" size="18px" color="#ffffff"></wd-icon>
					<text>{{ currentPreviewItem.downloadCount }}</text>
				</view>
			</view>
		</view>

		<!-- 视频播放弹窗（打开时才挂载 video，关闭即销毁释放资源） -->
		<view v-if="videoShow && videoItem" class="preview-mask" @click="closeVideo">
			<video class="preview-video" :src="videoItem.filePath" :title="downloadName(videoItem)" controls autoplay :show-fullscreen-btn="true" object-fit="contain" @click.stop></video>
			<view class="preview-count">{{ downloadName(videoItem) }}</view>
		</view>

		<!-- 评价记录弹窗 -->
		<wd-popup v-model="logShow" position="bottom" :z-index="1100" :custom-style="isDark ? 'max-height: 60vh; background: #1b1b1b; border-radius: 24rpx 24rpx 0 0;' : 'max-height: 60vh; background: #ffffff; border-radius: 24rpx 24rpx 0 0;'">
			<view class="log-popup" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view class="project-popup-head">
					<text class="project-popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">评价记录</text>
					<wd-icon name="close" size="18px" :color="isDark ? '#8a9099' : '#86909c'" @click="logShow = false"></wd-icon>
				</view>
				<scroll-view scroll-y class="log-list">
					<view v-if="logLoading" class="project-loading"><wd-loading size="20px"></wd-loading></view>
					<view v-else-if="!logList.length" class="project-empty" :style="{ color: isDark ? '#8a9099' : '#c0c4cc' }">暂无评价</view>
					<view v-for="(log, i) in logList" :key="log.id ?? i" class="log-item" :class="{ dark: isDark }">
						<text class="log-user" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ log.username || log.userName || '-' }}</text>
						<text class="log-tag" :class="log.evaluation === '点赞' ? 'like' : 'reject'">{{ log.evaluation }}</text>
						<text class="log-time" :style="{ color: isDark ? '#8a9099' : '#c0c4cc' }">{{ log.dbtime || log.createTime || '' }}</text>
					</view>
				</scroll-view>
			</view>
		</wd-popup>

		<!-- 下载记录弹窗 -->
		<wd-popup v-model="dlShow" position="bottom" :z-index="1100" :custom-style="isDark ? 'max-height: 60vh; background: #1b1b1b; border-radius: 24rpx 24rpx 0 0;' : 'max-height: 60vh; background: #ffffff; border-radius: 24rpx 24rpx 0 0;'">
			<view class="log-popup" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view class="project-popup-head">
					<text class="project-popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">下载记录</text>
					<wd-icon name="close" size="18px" :color="isDark ? '#8a9099' : '#86909c'" @click="dlShow = false"></wd-icon>
				</view>
				<scroll-view scroll-y class="log-list">
					<view v-if="dlLoading" class="project-loading"><wd-loading size="20px"></wd-loading></view>
					<view v-else-if="!dlList.length" class="project-empty" :style="{ color: isDark ? '#8a9099' : '#c0c4cc' }">暂无下载记录</view>
					<view v-for="(log, i) in dlList" :key="log.id ?? i" class="log-item" :class="{ dark: isDark }">
						<text class="log-user" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ log.username || log.userName || '-' }}</text>
						<text class="log-time" :style="{ color: isDark ? '#8a9099' : '#c0c4cc' }">{{ log.dbtime || log.downloadTime || log.createTime || '' }}</text>
					</view>
				</scroll-view>
			</view>
		</wd-popup>

		<wd-message-box />
	</wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
	position: fixed;
	left: 0;
	top: 0;
	width: 100%;
	z-index: 99;
	background-color: #FFFFFF;
	box-sizing: border-box;
}

.filter-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 0 30rpx 16rpx;
}

.filter-box {
	flex: 1;
	min-width: 0;
	height: 60rpx;
	background: var(--wd-bg-color-grey, #f5f5f5);
	border-radius: 30rpx;
	box-sizing: border-box;
}

.project-box {
	flex: 0 0 300rpx;
}

.picker-trigger {
	height: 60rpx;
	padding: 0 20rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8rpx;
	box-sizing: border-box;
}

.picker-value {
	font-size: 28rpx;
	color: #262626;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.picker-value.placeholder {
	color: #bfbfbf;
}

.picker-value-dark {
	color: #e8e8e8 !important;
}

.filter-reset {
	flex-shrink: 0;
	font-size: 26rpx;
	color: #1677ff;
	padding: 8rpx 0;
}

.filter-reset.dark {
	color: #69b1ff;
}

.summary-bar {
	padding: 0 30rpx 16rpx;
}

.summary-chip {
	display: inline-flex;
	align-items: center;
	gap: 10rpx;
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	background: var(--wd-bg-color-grey, #f7f8fa);
	border: 1rpx solid var(--wd-border-color, #f0f1f3);
	font-size: 24rpx;
	color: var(--wd-text-color-secondary, #4e5969);
}

.summary-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}

.summary-num {
	font-weight: 600;
	color: #1677ff;
	margin: 0 4rpx;
}

/* 瀑布流 */
.waterfall-wrap {
	display: flex;
	align-items: flex-start;
	gap: 20rpx;
	padding: 8rpx 20rpx 20rpx;
}

.wf-column {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.wf-card {
	background: #ffffff;
	border-radius: 20rpx;
	overflow: hidden;
}

.wf-card-dark {
	background: #1b1b1b;
}

.wf-media {
	width: 100%;
}

.wf-image {
	width: 100%;
	display: block;
	background: rgba(0, 0, 0, 0.04);
}

/* 懒加载骨架块：已知宽高比时填满容器，未知时靠 min-height 撑起 */
.wf-image-skeleton {
	width: 100%;
	height: 100%;
	min-height: 200rpx;
	background: rgba(127, 127, 127, 0.15);
}

/* 视频封面占位：固定高度，点击后才加载视频 */
.wf-video-cover {
	height: 320rpx;
}

.wf-video-inner {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
}

.wf-video-play {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.18);
	display: flex;
	align-items: center;
	justify-content: center;
}

.wf-video-tip {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.7);
}

.wf-archive {
	height: 240rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
}

.wf-archive-tip {
	font-size: 22rpx;
}

.wf-info {
	padding: 16rpx 20rpx 20rpx;
}

.wf-name {
	font-size: 26rpx;
	font-weight: 600;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.wf-project {
	font-size: 22rpx;
	margin-top: 6rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.wf-actions {
	display: flex;
	align-items: center;
	gap: 24rpx;
	margin-top: 14rpx;
}

.wf-action {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
	padding: 6rpx 0;
}

.wf-action-num {
	font-size: 22rpx;
}

.empty-wrap {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16rpx;
	margin: 20rpx;
	border-radius: 20rpx;
	padding: 40rpx 0;
	background: #ffffff;
}

.empty-loading-text {
	font-size: 26rpx;
	color: var(--wd-text-color-tertiary, #86909c);
}

.empty-wrap-dark {
	background: #1b1b1b;
}

/* 项目选择弹窗 */
.project-popup {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.project-popup-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 30rpx 12rpx;
}

.project-popup-title {
	font-size: 32rpx;
	font-weight: 600;
}

.project-list {
	flex: 1;
	min-height: 0;
	padding: 0 30rpx 30rpx;
	box-sizing: border-box;
}

.project-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 16rpx;
	border-bottom: 1rpx solid var(--wd-border-color, #f5f6f8);
}

.project-item.dark {
	border-bottom-color: #2a2a2a;
}

.project-item.active .project-item-name {
	color: #1677ff;
}

.project-item-name {
	font-size: 28rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.project-all {
	font-weight: 600;
}

.project-loading {
	display: flex;
	justify-content: center;
	padding: 40rpx 0;
}

.project-empty {
	text-align: center;
	font-size: 26rpx;
	padding: 60rpx 0;
}

/* 预览遮罩 */
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

.preview-video {
	width: 100%;
	height: 70vh;
}

.preview-count {
	position: absolute;
	top: 60rpx;
	left: 0;
	right: 0;
	text-align: center;
	color: rgba(255, 255, 255, 0.85);
	font-size: 26rpx;
}

.preview-nav {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.16);
	display: flex;
	align-items: center;
	justify-content: center;
}

.preview-prev {
	left: 24rpx;
}

.preview-next {
	right: 24rpx;
}

.preview-actions {
	position: absolute;
	bottom: 80rpx;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
	gap: 80rpx;
}

.preview-action {
	display: flex;
	align-items: center;
	gap: 10rpx;
	color: #ffffff;
	font-size: 26rpx;
}

/* 记录弹窗 */
.log-popup {
	display: flex;
	flex-direction: column;
	max-height: 60vh;
}

.log-list {
	max-height: 46vh;
	padding: 0 30rpx 30rpx;
	box-sizing: border-box;
}

.log-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 8rpx;
	border-bottom: 1rpx solid var(--wd-border-color, #f5f6f8);
}

.log-item.dark {
	border-bottom-color: #2a2a2a;
}

.log-user {
	flex: 1;
	min-width: 0;
	font-size: 26rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.log-tag {
	font-size: 22rpx;
	padding: 2rpx 14rpx;
	border-radius: 6rpx;
}

.log-tag.like {
	color: #1677ff;
	background: #e6f4ff;
}

.log-tag.reject {
	color: #dd524d;
	background: #fff1f0;
}

.log-time {
	font-size: 22rpx;
}
</style>
