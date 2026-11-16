<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<view class="page" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
			<wd-navbar left-arrow title="服务单详情" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

			<template v-if="loading">
				<view class="loading-tip"><wd-loading size="30px" /> 加载中...</view>
			</template>

			<template v-else-if="detail">
				<scroll-view :scroll-y="true" refresher-enabled :refresher-triggered="triggered" @refresherrefresh="onRefresh" class="detail-scroll">
					<!-- 状态提示 -->
					<view class="status-banner" :style="bannerStyle">
						<view class="status-tag" :style="tagStyle">{{ statusInfo(detail.status).label }}</view>
						<view class="status-hint">{{ statusHint(detail.status) }}</view>
					</view>

					<!-- 基本信息 -->
					<view class="section card" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">基本信息</text></view>
						<view class="info-rows">
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">任务编号</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.taskNo || '-' }}</text></view>
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">客户名称</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.customerName || '-' }}</text></view>
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">合同编号</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.contractNo || '-' }}</text></view>
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">调试方</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.debugCompany || '-' }}</text></view>
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">项目名称</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.projectName || '-' }}</text></view>
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">项目地址</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.projectAddress || '-' }}</text></view>
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">项目负责人</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.projectManager || '-' }}</text></view>
							<view class="info-row"><text class="lbl">现场联系人</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.siteContact || '-' }}</text></view>
							<view class="info-row"><text class="lbl">调试工程师</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.debugEngineerName || '-' }}</text></view>
							<view class="info-row"><text class="lbl">创建时间</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.dbtime || '-' }}</text></view>
							<view class="info-row"><text class="lbl">到期时间</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.expireTime || '-' }}</text></view>
						</view>
					</view>

					<!-- 服务内容快照 -->
					<view v-if="serviceItems.length" class="section card" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">服务内容</text></view>
						<view v-for="(item, idx) in serviceItems" :key="idx" class="snapshot-item" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa' }">
							<text class="snapshot-idx">{{ idx + 1 }}.</text>
							<text class="snapshot-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ item.serviceName || '-' }}</text>
							<text v-if="item.manualFlag" class="mini-tag tag-manual">手工</text>
							<text class="mini-tag" :class="item.passed ? 'tag-pass' : 'tag-fail'">{{ item.passed ? '通过' : '未通过' }}</text>
						</view>
					</view>

					<!-- 提供设备快照 -->
					<view v-if="devices.length" class="section card" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">提供设备</text></view>
						<view v-for="(d, idx) in devices" :key="idx" class="device-snap" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa' }">
							<view class="device-head">
								<text class="device-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ d.deviceName || d.devname || `设备#${d.id}` }}</text>
								<text class="device-qty">×{{ d.quantity != null ? d.quantity : '-' }}{{ d.unit || '' }}</text>
								<text v-if="d.model" class="device-model">型号：{{ d.model }}</text>
							</view>
							<view v-if="d.deviceNo || d.notes" class="device-foot">
								<text v-if="d.deviceNo">设备编号：{{ d.deviceNo }}</text>
								<text v-if="d.notes">备注：{{ d.notes }}</text>
							</view>
						</view>
					</view>

					<!-- 待签名：签名链接仅在生成时展示一次 -->
					<view v-if="detail.status === 0" class="section card" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">客户签名链接</text></view>
						<view v-if="!detail.signUrl" class="warn-box">签名链接仅在生成服务单时展示一次，列表/详情查询不会返回；如需再次获取，可在列表撤销后重新生成。</view>
						<template v-else>
							<view class="link-box" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', color: isDark ? '#69b1ff' : '#1677ff' }">{{ detail.signUrl }}</view>
							<view class="btn-row">
								<wd-button size="small" type="primary" @click="copySignText(detail.signUrl, '签名链接不存在')">复制签名链接</wd-button>
							</view>
						</template>
					</view>

					<!-- 已签名：签名信息 + 签名图片 -->
					<view v-if="detail.status === 1" class="section card" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">签名信息</text></view>
						<view class="info-rows">
							<view class="info-row"><text class="lbl">签名人</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.signerName || '-' }}</text></view>
							<view class="info-row"><text class="lbl">签署时间</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.signedTime || '-' }}</text></view>
							<view class="info-row"><text class="lbl">服务意见</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detailOpinion }}</text></view>
							<view class="info-row"><text class="lbl">签署IP</text><text class="val" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ detail.clientIp || '-' }}</text></view>
						</view>
						<view v-if="detail.signatureUrl" class="sign-img-wrap">
							<text class="sign-img-label">签名图片</text>
							<image class="sign-img" :src="normalizeFileUrl(detail.signatureUrl)" mode="widthFix" @click="previewSignature" />
						</view>
					</view>
					<view class="bottom-space"></view>
				</scroll-view>

				<!-- 底部操作 -->
				<view class="bottom-bar" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
					<template v-if="detail.status === 0">
						<wd-button v-if="detail.unsignedDocUrl" size="small" plain block :class="{ 'btn-dark': isDark }" @click="openFileSheet(false)">文件</wd-button>
						<wd-button v-if="detail.signUrl" size="small" plain block @click="copySignText(detail.signUrl, '签名链接不存在')">复制签名链接</wd-button>
						<wd-button v-if="canOperate" size="small" block type="danger" plain :class="{ 'btn-dark': isDark }" @click="handleRevoke">撤销</wd-button>
					</template>
					<template v-else-if="detail.status === 1">
						<wd-button v-if="detail.signedDocUrl" size="small" plain block :class="{ 'btn-dark': isDark }" @click="openFileSheet(true)">文件</wd-button>
						<wd-button v-if="canOperate" size="small" plain block :class="{ 'btn-dark': isDark }" @click="handleExport">导出证据包</wd-button>
					</template>
					<template v-else>
						<wd-button size="small" plain block :class="{ 'btn-dark': isDark }" @click="regenerate">重新生成</wd-button>
					</template>
				</view>
			</template>

			<template v-else>
				<view class="loading-tip">未查询到服务单信息</view>
			</template>

			<wd-message-box />
		</view>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
import { useMessage } from 'wot-design-uni'
import { fetchGetSignTaskById, fetchRevokeSignTask } from '@/service/projectServiceSign'
import {
	statusInfo,
	statusHint,
	opinionText,
	buildDocName,
	buildEvidenceZipName,
	showFileActions,
	showEvidenceActions,
	copySignText,
	normalizeFileUrl
} from '../common'

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === "dark")
const message = useMessage()

const userId = String(uni.getStorageSync('userId'))
const userType = Number(uni.getStorageSync('usertype'))

const detail = ref<any>(null)
const loading = ref(false)
const triggered = ref(false)

const serviceItems = computed(() => {
	const arr = detail.value?.serviceItems || detail.value?.items || []
	return Array.isArray(arr) ? arr : []
})
const devices = computed(() => {
	const arr = detail.value?.devices || detail.value?.deviceList || []
	return Array.isArray(arr) ? arr : []
})
const detailOpinion = computed(() => opinionText(detail.value?.serviceOpinion))
const canOperate = computed(() => String(detail.value?.creater) === userId || userType === 0)

const statusColorMap: Record<number, string> = {
	0: '#1677ff',
	1: '#18a058',
	2: '#d03050',
	3: '#f0a020'
}
const bannerStyle = computed(() => ({
	background: `${statusColorMap[detail.value?.status] || '#8a8f99'}15`
}))
const tagStyle = computed(() => ({
	background: statusColorMap[detail.value?.status] || '#8a8f99',
	color: '#ffffff'
}))

async function loadDetail(showLoading = true) {
	if (showLoading) loading.value = true
	try {
		const data = await fetchGetSignTaskById(Number(detailId))
		if (data) detail.value = data
	} catch (e) {
		console.error('加载详情失败', e)
	} finally {
		loading.value = false
		triggered.value = false
	}
}

// ===== 文件操作 =====
function openFileSheet(signed: boolean) {
	showFileActions({
		url: signed ? detail.value?.signedDocUrl : detail.value?.unsignedDocUrl,
		name: buildDocName(detail.value, signed)
	})
}
function handleExport() {
	if (!canOperate.value) return
	showEvidenceActions(detail.value)
}

// ===== 签名图片预览 =====
function previewSignature() {
	const url = normalizeFileUrl(detail.value?.signatureUrl)
	if (!url) return
	uni.previewImage({ urls: [url] })
}

// ===== 撤销 =====
function handleRevoke() {
	message
		.confirm({
			title: '提示',
			msg: '确定要撤销该签名链接吗？撤销后客户将无法继续签名。'
		})
		.then(async () => {
			try {
				await fetchRevokeSignTask(detail.value?.id)
				uni.showToast({ title: '签名链接已撤销', icon: 'none' })
				loadDetail(false)
			} catch (e) {
				console.error('撤销失败', e)
			}
		})
		.catch(() => {})
}

// ===== 重新生成 =====
function regenerate() {
	const row = detail.value || {}
	const q: string[] = []
	if (row.projectName) q.push(`projectName=${encodeURIComponent(row.projectName)}`)
	if (row.contractNo) q.push(`contractNo=${encodeURIComponent(row.contractNo)}`)
	if (row.contractName) q.push(`contractName=${encodeURIComponent(row.contractName)}`)
	const query = q.length ? `?${q.join('&')}` : ''
	uni.navigateTo({ url: `/mePages/projectServiceSign/add/Index${query}` })
}

// ===== 刷新 =====
function onRefresh() {
	triggered.value = true
	loadDetail(false)
}

function handleClickLeft() {
	// #ifdef H5
	history.go(-1)
	// #endif
	// #ifndef H5
	uni.navigateBack()
	// #endif
}

let detailId = 0
let pollTimer: ReturnType<typeof setInterval> | null = null

onLoad((options: any) => {
	detailId = Number(options?.id || 0)
	loadDetail()
	// 待签名状态下轮询最新状态，签名完成后自动停止
	if (pollTimer) clearInterval(pollTimer)
	pollTimer = setInterval(() => {
		if (detail.value?.status === 0) {
			loadDetail(false)
		} else if (pollTimer) {
			clearInterval(pollTimer)
			pollTimer = null
		}
	}, 30000)
})

onUnload(() => {
	if (pollTimer) {
		clearInterval(pollTimer)
		pollTimer = null
	}
})
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--wd-bg-color-grey, #f5f6f8);
	box-sizing: border-box;
	overflow: hidden;
}

.loading-tip {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	padding: 160rpx 0;
	font-size: 28rpx;
	color: var(--wd-text-color-tertiary, #8a8f99);
}

.detail-scroll {
	flex: 1;
	min-height: 0;
	padding: 20rpx;
	box-sizing: border-box;
}

.status-banner {
	border-radius: 20rpx;
	padding: 28rpx;
	margin-bottom: 20rpx;

	.status-tag {
		display: inline-block;
		font-size: 24rpx;
		font-weight: 600;
		padding: 8rpx 24rpx;
		border-radius: 999rpx;
	}

	.status-hint {
		font-size: 24rpx;
		color: var(--wd-text-color-secondary, #4e5969);
		line-height: 1.6;
		margin-top: 16rpx;
	}
}

.section.card {
	background: var(--wd-bg-color, #ffffff);
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 6rpx 20rpx rgba(58, 111, 255, 0.04);

	.section-title {
		font-size: 30rpx;
		font-weight: 600;
		color: var(--wd-text-color, #1f2937);
		margin-bottom: 8rpx;
	}
}

.info-rows {
	.info-row {
		display: flex;
		align-items: flex-start;
		padding: 12rpx 0;
		font-size: 26rpx;
		border-bottom: 1rpx solid var(--wd-border-color, #f5f6f8);

		&:last-child {
			border-bottom: none;
		}

		.lbl {
			flex-shrink: 0;
			width: 160rpx;
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

// 服务内容快照
.snapshot-item {
	display: flex;
	align-items: center;
	padding: 18rpx 16rpx;
	border-radius: 12rpx;
	background: var(--wd-bg-color-grey, #f7f8fa);
	margin-top: 12rpx;
	gap: 12rpx;

	.snapshot-idx { font-size: 24rpx; color: var(--wd-text-color-tertiary, #8a8f99); flex-shrink: 0; }
	.snapshot-name { flex: 1; min-width: 0; font-size: 26rpx; color: var(--wd-text-color, #1f2937); word-break: break-all; }

	.mini-tag {
		flex-shrink: 0;
		font-size: 20rpx;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
	}

	.tag-manual { color: var(--wd-text-color-secondary, #6b7280); background: rgba(128, 128, 128, 0.12); }
	.tag-pass { color: #18a058; background: rgba(24, 160, 88, 0.12); }
	.tag-fail { color: #d03050; background: rgba(208, 48, 80, 0.12); }
}

// 提供设备快照
.device-snap {
	padding: 18rpx 16rpx;
	border-radius: 12rpx;
	background: var(--wd-bg-color-grey, #f7f8fa);
	margin-top: 12rpx;

	.device-head {
		display: flex;
		align-items: center;
		gap: 12rpx;

		.device-name { font-size: 26rpx; font-weight: 500; color: var(--wd-text-color, #1f2937); }
		.device-qty { font-size: 22rpx; color: var(--wd-text-color-secondary, #4e5969); }
		.device-model { font-size: 22rpx; color: var(--wd-text-color-tertiary, #8a8f99); }
	}

	.device-foot {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: var(--wd-text-color-tertiary, #8a8f99);
		word-break: break-all;
	}
}

.warn-box {
	background: #fff7e6;
	border: 1rpx solid #ffe7ba;
	color: #d48806;
	font-size: 24rpx;
	line-height: 1.6;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 12rpx;
}

.link-box {
	background: var(--wd-bg-color-grey, #f7f8fa);
	border-radius: 12rpx;
	padding: 20rpx;
	font-size: 24rpx;
	color: var(--wd-text-color, #1f2937);
	margin-top: 12rpx;
	word-break: break-all;
}

.btn-row {
	display: flex;
	margin-top: 16rpx;
}

// 签名图片
.sign-img-wrap {
	margin-top: 16rpx;

	.sign-img-label {
		font-size: 24rpx;
		color: var(--wd-text-color-tertiary, #8a8f99);
	}

	.sign-img {
		display: block;
		margin-top: 12rpx;
		max-width: 480rpx;
		border: 1rpx solid #e5e7eb;
		border-radius: 12rpx;
	}
}

.bottom-bar {
	flex-shrink: 0;
	display: flex;
	gap: 16rpx;
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: transparent;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.bottom-space {
	height: 20rpx;
}


/* 暗黑模式按钮 */
:deep(.btn-dark) {
    background-color: #2a2a2a !important;
    border-color: #3a3a3a !important;
    color: #e8e8e8 !important;
}
:deep(.btn-dark:hover) {
    background-color: #3a3a3a !important;
}


.card-dark {
    background-color: #1b1b1b !important;
}
.card-dark .lbl,
.card-dark .val {
    color: #e8e8e8 !important;
}
.card-dark .info-row {
    border-bottom-color: #3a3a3a !important;
}


.snap-dark {
    background-color: #2a2a2a !important;
}
.snap-dark .val {
    color: #e8e8e8 !important;
}


.link-dark {
    background-color: #2a2a2a !important;
    color: #69b1ff !important;
}
</style>
