<template>
	<view class="modal-overlay" :class="{ active: visible }" @tap="closeOnMask" @touchmove.stop.prevent>
		<view class="certificate" :style="certificateStyle" @tap.stop>
			<!-- 动态光效背景 -->
			<view class="glow-bg" :style="glowBgStyle"></view>
			<view class="scan-line"></view>
			
			<!-- 证书头部 -->
			<view class="cert-header">
				<view class="title-icon">⚡🏆⚡</view>
				<text class="title">技术等级荣誉证书</text>
				<text class="sub-title">TECHNICAL LEVEL HONOR</text>
			</view>

			<!-- 证书主体 -->
			<view class="cert-body">
				<!-- 等级核心徽章 -->
				<view class="level-showcase">
					<view class="level-badge" :style="levelBadgeStyle">
						{{ level }}
					</view>
					<text class="level-desc" :style="{ color: levelColor, textShadow: `0 0 16rpx ${levelGlow}` }">
						{{ levelDesc }}
					</text>
				</view>

				<!-- 员工信息卡片 -->
				<view class="info-card" :style="infoCardStyle">
					<view class="info-row">
						<view class="info-item">
							<text class="info-label">👤 姓 名</text>
							<text class="info-value">{{ employeeName }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">🏢 部 门</text>
							<text class="info-value">{{ department }}</text>
						</view>
					</view>
					<!-- <view class="info-row">
						<view class="info-item">
							<text class="info-label">📅 评定日期</text>
							<text class="info-value">{{ assessDate }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">🔖 证书编号</text>
							<text class="info-value">{{ certNo }}</text>
						</view>
					</view> -->
				</view>

				<!-- 荣誉词区域 -->
				<!-- <view class="honor-quote" :style="quoteStyle">
					<text class="quote-mark">“</text>
					<text class="quote-text">{{ honorQuote }}</text>
					<text class="quote-mark">”</text>
				</view> -->
				
				<!-- 成就亮点 -->
				<!-- <view class="achievement" v-if="achievement" :style="achievementStyle">
					<text class="achievement-icon">✨</text>
					<text class="achievement-text">{{ achievement }}</text>
					<text class="achievement-icon">✨</text>
				</view> -->
			</view>

			<!-- 证书底部 -->
			<view class="cert-footer">
				<view class="seal-area">
					<text class="seal-icon" :style="{ filter: `drop-shadow(0 0 8rpx ${levelColor})` }">{{ levelSealIcon }}</text>
				</view>
				<!-- <view style="width: 0px;">
					<image src="/static/linkqi_108_108.png" mode="widthFix"></image>
				</view> -->
				<view style="display: flex; align-items: center; justify-content: space-between; flex-direction: row;">
					<view>
						<image src="/static/linkqi_108_108.png" mode="widthFix" style="width: 50px;"></image>
					</view>
					<view class="footer-text">
						<text class="company" :style="{ color: levelColor }">杭州领褀科技有限科技</text>
						<text class="valid">等级永久有效 ｜ 荣誉认证</text>
					</view>
				</view>
				<view class="close-btn" :style="closeBtnStyle" @tap="closeCertificate">
					<text class="close-text" :style="{ color: levelColor }">关 闭</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue'

// ==================== 指定配色方案 ====================
const levelColorMap = {
	T1: { 
		color: '#CCCCCC',      // 浅灰
		glow: '#AAAAAA', 
		desc: '入门 · 潜力新星 🌟',
		seal: '🌟'
	},
	T2: { 
		color: '#3399FF',      // 天蓝
		glow: '#2288EE', 
		desc: '基础 · 快速成长 ⚡',
		seal: '⚡'
	},
	T3: { 
		color: '#0066CC',      // 深蓝
		glow: '#0055AA', 
		desc: '进阶 · 独当一面 🔰',
		seal: '🔰'
	},
	T4: { 
		color: '#33CC66',      // 绿色
		glow: '#22BB55', 
		desc: '资深 · 项目核心 💎',
		seal: '💎'
	},
	T5: { 
		color: '#FFCC00',      // 橙黄
		glow: '#EEBB00', 
		desc: '专家 · 架构引领 🏅',
		seal: '🏅'
	},
	T6: { 
		color: '#FF6600',      // 橙色
		glow: '#EE5500', 
		desc: '高级专家 · 技术创新 🔥',
		seal: '🔥'
	},
	T7: { 
		color: '#CC0066',      // 紫红/品红
		glow: '#BB0055', 
		desc: '首席 · 技术权威 👑',
		seal: '👑'
	}
}

// Props 接收参数
const props = defineProps({
	visible: { type: Boolean, default: false },
	// level: { type: String, default: 'T5', validator: (val) => ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].includes(val) },
	level: { type: String, default: 'T1' },
	employeeName: { type: String, default: uni.getStorageSync('username') },
	department: { type: String, default: '工程中心' },
	assessDate: { type: String, default: () => {
		const date = new Date()
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
	}},
	certNo: { type: String, default: () => 'TECH-' + Math.random().toString(36).substr(2, 8).toUpperCase() },
	honorQuote: { type: String, default: '技术卓越，贡献突出，特授予此荣誉证书' },
	achievement: { type: String, default: '' }
})

const emit = defineEmits(['close', 'update:visible'])

// 当前等级配色
const levelConfig = computed(() => levelColorMap[props.level] || levelColorMap.T5)
const levelColor = computed(() => levelConfig.value.color)
const levelGlow = computed(() => levelConfig.value.glow)
const levelDesc = computed(() => levelConfig.value.desc)
const levelSealIcon = computed(() => levelConfig.value.seal)

// 证书整体边框光效
const certificateStyle = computed(() => ({
	borderColor: levelColor.value,
	boxShadow: `0 0 0 4rpx ${levelColor.value}, 0 0 30rpx ${levelColor.value}, inset 0 0 20rpx ${levelColor.value}30`
}))

// 光晕背景
const glowBgStyle = computed(() => ({
	background: `radial-gradient(circle at 30% 20%, ${levelColor.value}25, ${levelGlow.value}10, transparent 80%)`
}))

// 等级徽章样式
const levelBadgeStyle = computed(() => ({
	color: levelColor.value,
	textShadow: `0 0 20rpx ${levelGlow.value}`,
	border: `4rpx solid ${levelColor.value}`,
	boxShadow: `0 0 30rpx ${levelColor.value}, inset 0 0 10rpx ${levelColor.value}60`,
	background: `linear-gradient(135deg, ${levelColor.value}15, ${levelColor.value}05)`
}))

// 信息卡片样式
const infoCardStyle = computed(() => ({
	borderColor: `${levelColor.value}80`,
	background: `linear-gradient(135deg, ${levelColor.value}10, ${levelColor.value}03)`,
	boxShadow: `0 0 15rpx ${levelColor.value}30`
}))

// 荣誉词样式
const quoteStyle = computed(() => ({
	borderLeftColor: levelColor.value,
	borderRightColor: levelColor.value,
	color: levelColor.value,
	textShadow: `0 0 10rpx ${levelGlow.value}`,
	background: `linear-gradient(90deg, transparent, ${levelColor.value}15, transparent)`
}))

// 成就样式
const achievementStyle = computed(() => ({
	borderColor: levelColor.value,
	background: `${levelColor.value}15`,
	boxShadow: `0 0 15rpx ${levelColor.value}40`
}))

// 关闭按钮样式
const closeBtnStyle = computed(() => ({
	borderColor: levelColor.value,
	background: `${levelColor.value}25`,
	boxShadow: `0 0 10rpx ${levelColor.value}`
}))

// 关闭弹框
const closeCertificate = () => {
	emit('update:visible', false)
	emit('close')
}

const closeOnMask = () => {
	closeCertificate()
}
</script>

<style lang="scss" scoped>
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.85);
	backdrop-filter: blur(20rpx);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
	visibility: hidden;
	opacity: 0;
	transition: visibility 0.2s, opacity 0.3s ease;
	
	&.active {
		visibility: visible;
		opacity: 1;
	}
}

.certificate {
	position: relative;
	width: 650rpx;
	max-width: 90vw;
	background: linear-gradient(145deg, #0d0d1a, #060610);
	border-radius: 60rpx;
	border: 4rpx solid;
	overflow: hidden;
	transform: scale(0.92);
	transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.2);
	
	.modal-overlay.active & {
		transform: scale(1);
	}
}

.glow-bg {
	position: absolute;
	top: -30%;
	left: -30%;
	width: 160%;
	height: 160%;
	pointer-events: none;
	z-index: 0;
	animation: rotateBg 12s linear infinite;
}

@keyframes rotateBg {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.scan-line {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 4rpx;
	background: linear-gradient(90deg, transparent, #fff, transparent);
	animation: scan 3s ease-in-out infinite;
	z-index: 3;
}

@keyframes scan {
	0% { top: 0; opacity: 0; }
	50% { top: 100%; opacity: 1; }
	100% { top: 100%; opacity: 0; }
}

.cert-header {
	position: relative;
	z-index: 2;
	text-align: center;
	padding: 48rpx 40rpx 24rpx;
	border-bottom: 2rpx dashed rgba(255, 255, 255, 0.12);
}

.title-icon {
	font-size: 68rpx;
	filter: drop-shadow(0 0 12rpx #fff);
}

.title {
	font-size: 44rpx;
	font-weight: bold;
	background: linear-gradient(135deg, #fff, #FFCC00, #3399FF);
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
	letter-spacing: 6rpx;
	display: block;
	margin-top: 12rpx;
}

.sub-title {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.5);
	letter-spacing: 4rpx;
	margin-top: 12rpx;
	display: block;
}

.cert-body {
	position: relative;
	z-index: 2;
	padding: 32rpx 40rpx;
}

.level-showcase {
	text-align: center;
	margin-bottom: 32rpx;
}

.level-badge {
	display: inline-block;
	padding: 24rpx 56rpx;
	border-radius: 120rpx;
	font-size: 80rpx;
	font-weight: 900;
	font-family: monospace;
	letter-spacing: 10rpx;
	backdrop-filter: blur(8rpx);
}

.level-desc {
	font-size: 28rpx;
	margin-top: 20rpx;
	font-weight: 600;
	display: block;
}

.info-card {
	border-radius: 36rpx;
	padding: 28rpx 28rpx;
	margin: 24rpx 0;
	border: 2rpx solid;
}

.info-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: 24rpx;
	
	&:last-child {
		margin-bottom: 0;
	}
}

.info-item {
	flex: 1;
	text-align: center;
}

.info-label {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.55);
	letter-spacing: 2rpx;
	display: block;
	margin-bottom: 12rpx;
}

.info-value {
	font-size: 28rpx;
	font-weight: bold;
	color: #fff;
	display: block;
}

.honor-quote {
	padding: 28rpx;
	border-radius: 36rpx;
	text-align: center;
	margin: 20rpx 0;
	border-left: 4rpx solid;
	border-right: 4rpx solid;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	flex-wrap: wrap;
}

.quote-mark {
	font-size: 44rpx;
	font-weight: bold;
	opacity: 0.7;
}

.quote-text {
	font-size: 28rpx;
	font-style: italic;
	line-height: 1.5;
}

.achievement {
	margin-top: 24rpx;
	padding: 20rpx 24rpx;
	border-radius: 60rpx;
	text-align: center;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	border: 2rpx solid;
}

.achievement-icon {
	font-size: 32rpx;
	animation: twinkle 1s ease-in-out infinite;
}

@keyframes twinkle {
	0%, 100% { opacity: 0.6; transform: scale(1); }
	50% { opacity: 1; transform: scale(1.2); }
}

.achievement-text {
	font-size: 26rpx;
	font-weight: 500;
	color: #fff;
}

.cert-footer {
	position: relative;
	z-index: 2;
	padding: 28rpx 40rpx 40rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-top: 2rpx solid rgba(255, 255, 255, 0.08);
}

.seal-icon {
	font-size: 56rpx;
}

.footer-text {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	
	.company {
		font-size: 24rpx;
		font-weight: bold;
	}
	
	.valid {
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.45);
		margin-top: 8rpx;
	}
}

.close-btn {
	padding: 16rpx 36rpx;
	border-radius: 80rpx;
	border: 2rpx solid;
	
	.close-text {
		font-size: 28rpx;
		font-weight: bold;
	}
}
</style>