<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<view class="page" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
			<wd-navbar left-arrow title="服务验收单" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

			<view class="filter-area" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
				<!-- 状态筛选 -->
				<view class="filter-row">
					<text class="filter-label" :style="{ color: subColor }">状态</text>
					<view class="segment">
						<view v-for="opt in statusOptions" :key="opt.value" class="segment-item" :style="segmentItemStyle(filterStatus === opt.value)" @click="selectStatus(opt.value)">{{ opt.label }}</view>
					</view>
				</view>

				<!-- 项目 + 关键词 -->
				<view class="filter-row">
					<view class="prj-cell" :class="{ 'prj-cell-dark': isDark }" :style="{ color: projectId ? textColor : placeholderColor }" @click="openPrjPicker">
						<text class="prj-text">{{ projectId ? projectName : '全部项目' }}</text>
						<wd-icon v-if="projectId" name="close-circle" size="32rpx" :color="isDark ? '#666666' : '#c0c4cc'" @click.stop="clearProject"></wd-icon>
						<wd-icon name="chevron-down" size="30rpx" :color="subColor"></wd-icon>
					</view>
					<view class="mine-cell">
						<text class="mine-label" :style="{ color: subColor }">仅看我的</text>
						<wd-switch v-model="mineOnly" size="22px" @change="onMineChange"></wd-switch>
					</view>
				</view>
				<view class="search-row" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#ffffff' }">
					<wd-search v-model="fuzzy" placeholder="任务编号/客户/合同/项目名称" placeholder-left cancel-txt="搜索" @search="handleFilterChange" @cancel="handleFilterChange" @clear="handleFilterChange" />
				</view>

				<view class="summary-bar" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#ffffff' }">
                <view class="summary-chip" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa' }">
                    <text class="summary-dot"></text>
                    <text class="summary-text"  :style="{color: isDark ? '#ffffff' : '#000000'}">已加载 <text class="summary-num">{{ list.length }}</text> / 共 <text class="summary-num">{{ total }}</text> 条数据</text>
                </view>
            </view>
			</view>

			<!-- 列表 -->
			<scroll-view :scroll-y="true" refresher-enabled :refresher-triggered="triggered" @refresherrefresh="onRefresh" @scrolltolower="loadMore" class="list-scroll">
				<view class="list-inner">
					<view v-for="row in list" :key="row.id" class="card" :class="{ 'card-dark': isDark }" @click="goDetail(row)">
						<view class="card-head">
							<text class="task-no">{{ row.taskNo || `#${row.id}` }}</text>
							<wd-tag :type="statusInfo(row.status).type" size="small" round>{{ statusInfo(row.status).label }}</wd-tag>
						</view>
						<view class="card-body">
							<view class="body-row"><text class="lbl">客户名称</text><text class="val">{{ row.customerName || '-' }}</text></view>
							<view class="body-row"><text class="lbl">项目名称</text><text class="val">{{ row.projectName || '-' }}</text></view>
							<view class="body-row"><text class="lbl">合同编号</text><text class="val">{{ row.contractNo || '-' }}</text></view>
							<view class="body-row"><text class="lbl">调试工程师</text><text class="val">{{ row.debugEngineerName || '-' }}</text></view>
							<view class="body-row"><text class="lbl">创建时间</text><text class="val">{{ row.dbtime || '-' }}</text></view>
							<view class="body-row"><text class="lbl">到期时间</text><text class="val">{{ row.expireTime || '-' }}</text></view>
							<view v-if="row.status === 1" class="body-row"><text class="lbl">签名信息</text><text class="val">{{ row.signerName || '-' }}{{ row.signedTime ? ' · ' + row.signedTime : '' }}</text></view>
						</view>
						<view class="card-actions" @click.stop>
							<!-- 待签名：详情 / 服务单 / 撤销 -->
							<template v-if="row.status === 0">
								<view class="act-btn act-detail" :class="{ 'act-detail-dark': isDark }" @click="goDetail(row)">详情</view>
								<view class="act-btn act-info" @click="openFileSheet(row, false)">文件</view>
								<view v-if="canOperate(row)" class="act-btn act-danger" @click="handleRevoke(row)">撤销</view>
							</template>
							<!-- 已签名：详情 / 服务单 / 下载 / 导出 -->
							<template v-else-if="row.status === 1">
								<view class="act-btn act-detail" :class="{ 'act-detail-dark': isDark }" @click="goDetail(row)">详情</view>
								<view class="act-btn act-info" @click="openFileSheet(row, true)">服务单详情</view>
								<view v-if="canOperate(row)" class="act-btn act-primary" @click="handleExport(row)">导出证据包</view>
							</template>
							<!-- 过期/撤销：详情 / 重新生成 -->
							<template v-else>
								<view class="act-btn act-detail" :class="{ 'act-detail-dark': isDark }" @click="goDetail(row)">详情</view>
								<view v-if="canOperate(row)" class="act-btn act-success" @click="regenerate(row)">重新生成</view>
							</template>
						</view>
					</view>

					<view v-if="!loading && list.length === 0" class="empty">暂无签名服务单，点击右下角「新建」创建吧</view>
					<wd-loadmore :state="state" @reload="reloadList" />
					<view class="bottom-space"></view>
				</view>
			</scroll-view>

			<!-- 新建 -->
			<wd-fab v-if="canCreate" :disabled="clickLock" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="openAdd"></wd-fab>

			<!-- 项目选择弹窗 -->
			<wd-popup v-model="prjShow" position="bottom" :z-index="500" custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
				<view class="prj-picker">
					<view class="prj-header">选择项目</view>
					<wd-search v-model="prjFuzzy" placeholder="搜索项目名称" placeholder-left cancel-txt="搜索" @search="searchProject" @cancel="searchProject" @clear="clearProjectFuzzy" />
					<scroll-view scroll-y class="prj-list" @scrolltolower="loadMoreProject">
						<view v-for="item in prjList" :key="item.id" class="prj-item" :class="{ active: projectId === item.id }" @click="selectProject(item)">
							<text class="prj-name">{{ item.proname }}</text>
							<wd-icon v-if="projectId === item.id" name="check" size="36rpx" :color="isDark ? '#69b1ff' : '#3b82f6'"></wd-icon>
						</view>
						<view v-if="!loadingProject && prjList.length === 0" class="prj-empty">暂无项目</view>
						<wd-loadmore :state="prjState" @reload="loadProject" />
					</scroll-view>
				</view>
			</wd-popup>

			<wd-message-box />
		</view>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import { hasPermission } from '@/utils/index'
import { fetchGetSignTaskPage, fetchRevokeSignTask } from '@/service/projectServiceSign'
import { fetchGetPrjDataList } from '@/service/index'
import { statusInfo, buildDocName, buildEvidenceZipName, showFileActions, showEvidenceActions } from './common'
import { useMessage } from 'wot-design-uni'

const message = useMessage()
const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))
const placeholderColor = computed(() => (isDark.value ? '#8e8e93' : '#9ca3af'))

const userId = String(uni.getStorageSync('userId'))
const userType = Number(uni.getStorageSync('usertype'))

const clickLock = ref(false)

// ===== 权限 =====
const canCreate = hasPermission('project:ServiceSign:insert')
function canOperate(row: any) {
	return String(row.creater) === userId || userType === 0
}

// ===== 状态筛选 =====
const statusOptions = [
	{ label: '全部', value: -1 },
	{ label: '待签名', value: 0 },
	{ label: '已签名', value: 1 },
	{ label: '已过期', value: 2 },
	{ label: '已撤销', value: 3 }
]
const filterStatus = ref<number>(-1)

function segmentItemStyle(active: boolean) {
	if (active) {
		return { background: isDark.value ? '#3d3d3f' : '#ffffff', color: '#3b82f6', fontWeight: '600' }
	}
	return { color: subColor.value }
}
function selectStatus(v: number) {
	if (filterStatus.value === v) return
	filterStatus.value = v
	handleFilterChange()
}

// ===== 项目 / 关键词 / 仅看我的 =====
const projectId = ref<number | null>(null)
const projectName = ref('')
const fuzzy = ref('')
const mineOnly = ref(false)
const mineLoading = ref(false)

function onMineChange() {
	if (mineLoading.value) return
	mineLoading.value = true
	handleFilterChange()
	setTimeout(() => { mineLoading.value = false }, 300)
}

// ===== 列表 =====
const loading = ref(false)
const triggered = ref(false)
const list = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore')
let loadSeq = 0
let filterTimer: ReturnType<typeof setTimeout> | null = null

async function loadData(reset = false) {
	const seq = ++loadSeq
	if (reset) {
		page.value = 1
		list.value = []
		total.value = 0
	}
	loading.value = true
	state.value = 'loading'
	try {
		const params: any = {
			page: page.value,
			limit: 15,
			...(filterStatus.value !== -1 ? { status: filterStatus.value } : {}),
			...(projectId.value != null ? { projectId: projectId.value } : {}),
			...(fuzzy.value ? { fuzzy: fuzzy.value } : {}),
			...(mineOnly.value ? { creater: Number(userId) } : {})
		}
		const data = await fetchGetSignTaskPage(params)
		if (seq !== loadSeq) return
		const arr = data.list || []
		total.value = data.total || 0
		list.value = page.value === 1 ? arr : [...list.value, ...arr]
		state.value = list.value.length >= total.value ? 'finished' : 'loadmore'
	} catch (e) {
		if (seq !== loadSeq) return
		console.error('加载服务验收单列表失败', e)
		state.value = 'error'
	} finally {
		if (seq === loadSeq) {
			loading.value = false
			triggered.value = false
		}
	}
}

function loadMore() {
	if (state.value === 'finished' || state.value === 'loading') return
	page.value++
	loadData()
}

function reloadList() {
	handleFilterChange()
}

// 筛选变化：防抖合并
function handleFilterChange() {
	if (filterTimer) clearTimeout(filterTimer)
	filterTimer = setTimeout(() => {
		filterTimer = null
		loadData(true)
	}, 200)
}

function onRefresh() {
	triggered.value = true
	loadData(true)
}

// ===== 项目选择弹窗 =====
const prjShow = ref(false)
const prjFuzzy = ref('')
const prjList = ref<any[]>([])
const prjPage = ref(1)
const prjTotal = ref(0)
const loadingProject = ref(false)
const prjState = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore')

function openPrjPicker() {
	if (clickLock.value) return
	prjShow.value = true
	if (prjList.value.length === 0) loadProject(true)
}

async function loadProject(reset = false) {
	if (reset) {
		prjPage.value = 1
		prjList.value = []
		prjTotal.value = 0
	}
	loadingProject.value = true
	prjState.value = 'loading'
	try {
		const data = await fetchGetPrjDataList({
			page: prjPage.value,
			limit: 20,
			...(prjFuzzy.value ? { fuzzy: prjFuzzy.value } : {})
		})
		const arr = data.list || []
		prjTotal.value = data.total || 0
		prjList.value = prjPage.value === 1 ? arr : [...prjList.value, ...arr]
		prjState.value = prjList.value.length >= prjTotal.value ? 'finished' : 'loadmore'
	} catch (e) {
		console.error('加载项目列表失败', e)
		prjState.value = 'error'
	} finally {
		loadingProject.value = false
	}
}

function searchProject() {
	loadProject(true)
}
function clearProjectFuzzy() {
	prjFuzzy.value = ''
	loadProject(true)
}
function loadMoreProject() {
	if (prjState.value === 'finished' || prjState.value === 'loading') return
	prjPage.value++
	loadProject()
}
function selectProject(item: any) {
	projectId.value = item.id
	projectName.value = item.proname || ''
	prjShow.value = false
	handleFilterChange()
}

function clearProject() {
	if (!projectId.value) return
	projectId.value = null
	projectName.value = ''
	handleFilterChange()
}

// ===== 行操作 =====
function openFileSheet(row: any, signed: boolean) {
	showFileActions({
		url: signed ? row.signedDocUrl : row.unsignedDocUrl,
		name: buildDocName(row, signed)
	})
}

function handleRevoke(row: any) {
	message
		.confirm({
			title: '提示',
			msg: '确定要撤销该签名链接吗？撤销后客户将无法继续签名。'
		})
		.then(async () => {
			try {
				await fetchRevokeSignTask(row.id)
				uni.showToast({ title: '签名链接已撤销', icon: 'none' })
				loadData(true)
			} catch (e) {
				console.error('撤销失败', e)
			}
		})
		.catch(() => {})
}

function handleExport(row: any) {
	if (clickLock.value) return
	clickLock.value = true
	setTimeout(() => { clickLock.value = false }, 1200)
	showEvidenceActions(row)
}

// ===== 跳转 =====
function guardNav() {
	if (clickLock.value) return false
	clickLock.value = true
	setTimeout(() => { clickLock.value = false }, 500)
	return true
}

function goDetail(row: any) {
	if (!guardNav()) return
	uni.navigateTo({ url: `/mePages/projectServiceSign/detail/Index?id=${row.id}` })
}

function openAdd() {
	if (!guardNav()) return
	uni.navigateTo({ url: '/mePages/projectServiceSign/add/Index' })
}

// 重新生成：带原项目/合同预填
function regenerate(row: any) {
	if (!guardNav()) return
	const q: string[] = []
	if (row.projectName) q.push(`projectName=${encodeURIComponent(row.projectName)}`)
	if (row.contractNo) q.push(`contractNo=${encodeURIComponent(row.contractNo)}`)
	if (row.contractName) q.push(`contractName=${encodeURIComponent(row.contractName)}`)
	const query = q.length ? `?${q.join('&')}` : ''
	uni.navigateTo({ url: `/mePages/projectServiceSign/add/Index${query}` })
}

function handleClickLeft() {
	// #ifdef H5
	history.go(-1)
	// #endif
	// #ifndef H5
	uni.navigateBack()
	// #endif
}

// ===== 生命周期 =====
function reload() {
	loadData(true)
}

onMounted(() => {
	loadData(true)
	uni.$on('refreshServiceSign', reload)
})
onBeforeUnmount(() => {
	uni.$off('refreshServiceSign', reload)
})
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: var(--wd-bg-color-grey, #f5f6f8);
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	height: 100vh;
	overflow: hidden;
}

.filter-area {
	flex-shrink: 0;
	background: var(--wd-bg-color-grey, #f5f6f8);
	padding: 20rpx 20rpx 0;
	box-sizing: border-box;

	.filter-row {
		display: flex;
		align-items: center;
		padding: 0 0 16rpx;

		.filter-label {
			font-size: 24rpx;
			flex-shrink: 0;
			width: 64rpx;
		}

		.segment {
			flex: 1;
			min-width: 0;
			display: flex;
			background: rgba(128, 128, 128, 0.12);
			border-radius: 14rpx;
			padding: 4rpx;

			.segment-item {
				flex: 1;
				text-align: center;
				padding: 10rpx 0;
				font-size: 24rpx;
				line-height: 1.2;
				border-radius: 11rpx;
				transition: all 0.15s;
			}
		}

		.prj-cell {
			flex: 1;
			min-width: 0;
			display: flex;
			align-items: center;
			gap: 8rpx;
			background: var(--wd-bg-color, #ffffff);
			border-radius: 12rpx;
			padding: 14rpx 20rpx;
			font-size: 26rpx;

			.prj-text {
				flex: 1;
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.mine-cell {
			margin-left: 16rpx;
			display: flex;
			align-items: center;
			gap: 10rpx;

			.mine-label {
				font-size: 24rpx;
			}
		}
	}

	.search-row {
		padding: 6rpx 0 12rpx;
	}

	.summary-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2rpx 0 16rpx;

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
		}

	}
}

.list-scroll {
	flex: 1;
	min-height: 0;

	.list-inner {
		padding: 0 20rpx;
	}

	.card {
		background: var(--wd-bg-color, #ffffff);
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(58, 111, 255, 0.05);

		.card-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 16rpx;

			.task-no {
				font-size: 28rpx;
				font-weight: 600;
				color: var(--wd-text-color, #1f2937);
			}
		}

		.card-body {
			.body-row {
				display: flex;
				align-items: flex-start;
				padding: 6rpx 0;
				font-size: 24rpx;

				.lbl {
					flex-shrink: 0;
					width: 140rpx;
					color: var(--wd-text-color-tertiary, #8a8f99);
				}

				.val {
					flex: 1;
					min-width: 0;
					color: var(--wd-text-color, #333);
					word-break: break-all;
				}
			}
		}

		.card-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;
			margin-top: 16rpx;
			padding-top: 16rpx;
			border-top: 1rpx solid var(--wd-border-color, #f0f1f3);

			.act-btn {
				font-size: 24rpx;
				padding: 10rpx 24rpx;
				border-radius: 999rpx;
				border: 1rpx solid;
			}

			.act-detail { color: var(--wd-text-color, #1f2937); border-color: var(--wd-border-color, #d8dce3); }

		.act-detail-dark { color: #e8e8e8; border-color: #3a3a3a; }
			.act-info { color: #1677ff; border-color: #9ec5ff; }
			.act-success { color: #18a058; border-color: #9fd8b8; }
			.act-danger { color: #d03050; border-color: #f0a1b4; }
			.act-primary { color: #1677ff; border-color: #9ec5ff; }
		}
	}

	.empty {
		text-align: center;
		padding: 100rpx 0;
		font-size: 26rpx;
		color: var(--wd-text-color-disabled, #9ca3af);
	}

	.bottom-space {
		height: 160rpx;
	}
}

.prj-picker {
	height: 70vh;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;

	.prj-header {
		font-size: 32rpx;
		font-weight: 600;
		text-align: center;
		padding: 30rpx 0 20rpx;
	}

	.prj-list {
		flex: 1;

		.prj-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 26rpx 30rpx;
			border-bottom: 1rpx solid rgba(128, 128, 128, 0.12);

			.prj-name {
				font-size: 28rpx;
				flex: 1;
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			&.active {
				background: rgba(59, 130, 246, 0.08);
			}
		}

		.prj-empty {
			text-align: center;
			padding: 60rpx 0;
			font-size: 26rpx;
			color: var(--wd-text-color-disabled, #9ca3af);
		}
	}
}





/* 暗黑模式样式 */
:global(.card-dark),
.card-dark {
    background-color: #1b1b1b !important;
}
:global(.prj-cell-dark),
.prj-cell-dark {
    background-color: #2a2a2a !important;
}
.card-dark .task-no,
.card-dark .lbl,
.card-dark .val {
    color: #e8e8e8 !important;
}
.card-dark .body-row {
    border-bottom-color: #3a3a3a !important;
}
</style>
