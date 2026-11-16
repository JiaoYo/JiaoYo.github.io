<template>
	<sp-html2canvas-render
	  domId="pagePoster"
	  ref="renderRef"
	  @renderOver="renderOver"
	></sp-html2canvas-render>
	
	<wd-popup :z-index="9999" v-model="rewardShow" custom-style="border-radius:32rpx;">
		<!-- 排行榜弹窗 -->
		<view class="rank-modal" id="pagePoster">
			<!-- 喜庆背景装饰 -->
			<view class="celebration-background">
				<!-- 飘落的彩带 -->
				<!-- <view class="confetti confetti1"></view>
				<view class="confetti confetti2"></view>
				<view class="confetti confetti3"></view>
				<view class="confetti confetti4"></view>
				<view class="confetti confetti5"></view> -->
				<view class="confetti confetti1"></view>
				<view class="confetti confetti2"></view>
				<view class="confetti confetti3"></view>
				<view class="confetti confetti4"></view>
				<view class="confetti confetti5"></view>
				<view class="confetti confetti6"></view>
				<view class="confetti confetti7"></view>
				<view class="confetti confetti8"></view>
				<view class="confetti confetti9"></view>
				<view class="confetti confetti10"></view>
				<view class="confetti confetti11"></view>
				<view class="confetti confetti12"></view>
				<view class="confetti confetti13"></view>
				<view class="confetti confetti14"></view>
				<view class="confetti confetti15"></view>
			
				<!-- 闪烁的星星 -->
				<view class="star star1">✨</view>
				<view class="star star2">✨</view>
				<view class="star star3">✨</view>
				<view class="star star4">✨</view>
			
				<!-- 喜庆花纹边框 -->
				<view class="border-pattern top-left">🎉</view>
				<view class="border-pattern top-right">🎉</view>
				<view class="border-pattern bottom-left">🎉</view>
				<view class="border-pattern bottom-right">🎉</view>
			
				<!-- 金色彩带装饰 -->
				<view class="gold-ribbon left-ribbon"></view>
				<view class="gold-ribbon right-ribbon"></view>
			</view>
			
			<!-- 主要内容区域 -->
			<view class="content-wrapper">
				<!-- 大皇冠 -->
				<view class="big-crown">
					<text class="crown-text">👑</text>
				</view>
			
				<!-- 标题区域 -->
				<view class="title-section">
					<view class="title-main">恭 喜 大 佬</view>
					<view class="title-sub">热烈祝贺🎉🎉🎉</view>
					<view class="title-deco">你的努力与实力实至名归!</view>
					<!-- <view class="title-deco">🏆 🏆 🏆</view> -->
				</view>
			
				<!-- 前三名展示 -->
				<view class="top-three-container">
					<!-- 第一名 -->
					<view class="rank-item rank-first" v-if="props.topList[0]">
						<view class="user-card">
							<view class="medal gold-medal">{{ props.topList[0].sort == 1 ? '🥇' : props.topList[0].sort == 2 ? '🥈' : '🥉' }}</view>
							<image :src="avataImage" class="avatar" mode="aspectFill"></image>
							<view class="user-info">
								<text class="name">{{ props.topList[0].username }}</text>
								<view class="score-section">
									<text class="score-label">积分</text>
									<text class="score-value">{{ props.topList[0].totalCount }}</text>
									<!-- <text class="score-value">{{ props.topList[0].totalscore }}</text> -->
								</view>
							</view>
							<view class="champion-badge">🏆 {{ props.topList[0].sort == 1 ? '冠军' : props.topList[0].sort == 2 ? '亚军' : '季军' }} 🏆</view>
						</view>
					</view>
				</view>
			
				<!-- 祝贺语 -->
				<!-- <view class="congrats-section">
					<view class="congrats-text">
						<text>热烈祝贺🎉🎉🎉 \n你的努力与实力实至名归！</text>
					</view>
					<view class="fireworks">🎇 🎆 🎇</view>
				</view> -->
			
				<!-- 底部装饰 -->
				<view class="bottom-decorations">
					<text class="deco-text">{{ props.topList[0].sort == 1 ? '继续努力，下一个冠军还是你！' : '继续努力，下一个冠军就是你！' }}</text>
					<view class="deco-icons">💪 🚀 💪</view>
				</view>
			</view>
			
			<!-- 按钮区域 -->
			<view class="action-buttons">
				<button class="share-btn" @click.stop="handleShare" hover-class="btn-hover" :disabled="!locImageBase">
					<text class="btn-icon">📢</text>
					<text class="btn-text">分享喜讯</text>
				</button>
			</view>
			
			<view class="closeDialog">
				<image class="close-img" :src="updateCloseImage" @click="handleClosePopupChange" />
			</view>
		</view>
	</wd-popup>
</template>

<script lang="ts" setup>
	// import confetti from 'canvas-confetti';
	import {
		Confetti,
	    ConfettiEjector,
	    CanvasRender,
	    CustomShape
	} from 'confetti-ts-canvas';
	import { nextTick, ref, onMounted, onBeforeUnmount } from 'vue';
	// import updateCloseImage from '../static/updateclose.png';
	import { urlToBase64, pathToBase64, base64ToPath } from '@/uni_modules/sp-html2canvas-render/utils/index.js';
	
	let g, canvasRender;
	
	const avataImage = ref<any>(null);
	
	const updateCloseImage = ref<any>(null);
	
	const locImageBase = ref<string>('');
	
	const renderRef = ref<any>(null);
	
	const rewardShow = ref<boolean>(false);
	
	const confettiTimer = ref<number | null>(null);
	
	const isShowDom = ref<boolean>(false);

	const props = defineProps({
		topList: {
			type: Array,
			default: () => []
		}
	})

	// const emit = defineEmits(['close', 'share']);
	const emit = defineEmits(['share'])

	// 显示弹窗
	const showModal = () => {
		urlToBase64(props.topList[0].userimage).then((res) => {
			avataImage.value = res;
		})
		
		urlToBase64('../static/updateclose.png').then((res) => {
			updateCloseImage.value = res;
		})
		
		rewardShow.value = true;
		
		// 清除可能残留的旧定时器（防止多次打开重复创建）
		if (confettiTimer.value) {
			clearInterval(confettiTimer.value);
		}
		
		nextTick(() => {
			setTimeout(() => {
				renderRef.value.h2cRenderDom();
			}, 1000)
			
			// 立即触发一次
			// fireConfetti();
			
			// 每隔500毫秒再触发一次
			// confettiTimer.value = setInterval(() => {
			// 	fireConfetti();
			// }, 500);
		})
	}
	
	// 烟花
	const fireConfetti = () => {
		// 随机选择发射位置：左、中、右
		// const origins = [
		// 	{ x: 0.2, y: 0.8 },
		// 	{ x: 0.5, y: 0.7 },
		// 	{ x: 0.8, y: 0.8 }
		// ];
		// const origin = origins[Math.floor(Math.random() * origins.length)];
				
		// confetti({
		// 	particleCount: Math.floor(Math.random() * 30) + 20, // 20~50 粒子
		// 	angle: 90 + (Math.random() - 0.5) * 60, // 60°~120°
		// 	spread: 40 + Math.random() * 40, // 40~80
		// 	startVelocity: 20 + Math.random() * 20, // 20~40
		// 	decay: 0.9 + Math.random() * 0.05,
		// 	gravity: 1 + Math.random() * 0.5,
		// 	origin: origin,
		// 	colors: ['#ff5252', '#ff4081', '#e040fb', '#7c4dff', '#448aff', '#40c4ff', '#18ffff', '#69f0ae'],
		// 	shapes: ['circle', 'square'],
		// 	zIndex: 999999
		// });
		
		// new Confetti({
		//      paint: g,
		//      canvasWidth: 375,
		//      canvasHeight: 600,
		// }).run();
		// const pao = new ConfettiEjector(canvasRender, {
		//     limitAngle: [225, 315],//喷发角度区间[-∞,+∞]
		//     count: 100,//喷发纸片数量
		// });
		// const boom = pao.create({
		//     x: Math.random()*(375*.5),
		//     y: Math.random()*(60*.5),//喷发位置
		//     clampforce: [20, 60],//喷发力度
		//     radius: 10,//纸片大小
		// });
		// pao.fire(boom);
	}

	// 关闭弹窗
	const handleClosePopupChange = () => {
		rewardShow.value = false;
		// 清除定时器
		if (confettiTimer.value) {
			clearInterval(confettiTimer.value);
			confettiTimer.value = null;
		}
		// emit('close');
	}
	
	function renderOver(e) {
		try {
			// isShowDom.value = false;
			base64ToPath(e).then((res) => {
				locImageBase.value = res;
			})
		} catch (error) {
			locImageBase.value = "123";
		}
	}

	// 分享
	const handleShare = () => {
		if (!locImageBase.value) {
			return
		}
		emit('share', {
			data: props.topList,
			imgUrl: locImageBase.value == "123" ? '' : locImageBase.value
		});
	}
	
	onMounted(() => {
		// g=uni.createCanvasContext("myCanvas");
		// canvasRender = new CanvasRender();
		// canvasRender.init(
		// 	//必填 CanvasContext
		// 	g,
		// 	//以下参数全部可选填入
		// 	{
		// 		onFinished(){
		// 			console.log("完成")
		// 		},
		// 		displayFps:true,
		// 		grivaty:.5,
		// 	}
		// );
	})
	
	// 👇 组件卸载前清理（重要！）
	onBeforeUnmount(() => {
		if (confettiTimer.value) {
			clearInterval(confettiTimer.value);
			confettiTimer.value = null;
		}
	});

	// 暴露方法给父组件
	defineExpose({
		showModal
	})
</script>

<style scoped>
	/* 主弹窗样式 */
	.rank-modal {
		width: 700rpx;
		border-radius: 40rpx;
		overflow: hidden;
		position: relative;
		background: linear-gradient(45deg,
				#ff3366 0%,
				#ff6600 25%,
				#ffcc00 50%,
				#33cc33 75%,
				#3366ff 100%);
		background-size: 300% 300%;
		animation: gradientBG 8s ease infinite;
		box-shadow:
			0 20rpx 60rpx rgba(255, 51, 102, 0.5),
			0 0 100rpx rgba(255, 204, 0, 0.3),
			inset 0 0 50rpx rgba(255, 255, 255, 0.2);
	}

	/* 喜庆背景装饰 */
	.celebration-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
		pointer-events: none;
	}

	/* 动画背景渐变 */
	@keyframes gradientBG {
		0% {
			background-position: 0% 50%;
		}

		50% {
			background-position: 100% 50%;
		}

		100% {
			background-position: 0% 50%;
		}
	}
	
	/* 彩带基础样式 */
	.confetti {
	    position: absolute;
	    width: 24rpx;
	    height: 24rpx;
	    background: var(--color);
	    animation: launch linear infinite;
	    z-index: 9999;
	    bottom: 0; /* 从底部开始 */
	    opacity: 0;
	}
	
	/* 从下往上发射的动画 */
	@keyframes launch {
	    0% {
	        transform: translateY(0) rotate(0deg) scale(0.5);
	        opacity: 0;
	    }
	    10% {
	        opacity: 1;
	    }
	    50% {
	        opacity: 1;
	        transform: translateY(-600rpx) rotate(180deg) scale(1);
	    }
	    80% {
	        opacity: 0.5;
	    }
	    100% {
	        transform: translateY(-1200rpx) rotate(720deg) scale(0.8);
	        opacity: 0;
	    }
	}
	
	/* 更快的发射动画 */
	@keyframes fastLaunch {
	    0% {
	        transform: translateY(0) rotate(0deg) scale(0.5);
	        opacity: 0;
	    }
	    15% {
	        opacity: 1;
	    }
	    60% {
	        opacity: 1;
	        transform: translateY(-800rpx) rotate(540deg) scale(1);
	    }
	    100% {
	        transform: translateY(-1200rpx) rotate(1080deg) scale(0.8);
	        opacity: 0;
	    }
	}
	
	/* 彩带配置 - 分散发射位置和不同速度 */
	.confetti1 { --color: #ff3366; left: 10%; animation: fastLaunch 2s linear infinite; }
	.confetti2 { --color: #ffcc00; left: 20%; animation: launch 2.5s linear infinite 0.2s; }
	.confetti3 { --color: #33cc33; left: 30%; animation: fastLaunch 1.8s linear infinite 0.1s; }
	.confetti4 { --color: #3366ff; left: 40%; animation: launch 2.2s linear infinite 0.3s; }
	.confetti5 { --color: #cc33ff; left: 50%; animation: fastLaunch 2.3s linear infinite; }
	.confetti6 { --color: #ff6633; left: 60%; animation: launch 1.9s linear infinite 0.15s; }
	.confetti7 { --color: #00ccff; left: 70%; animation: fastLaunch 2.1s linear infinite 0.25s; }
	.confetti8 { --color: #ff33cc; left: 80%; animation: launch 2.4s linear infinite 0.1s; }
	.confetti9 { --color: #33ffcc; left: 90%; animation: fastLaunch 2s linear infinite; }
	.confetti10 { --color: #ffff33; left: 5%; animation: launch 2.6s linear infinite 0.2s; }
	.confetti11 { --color: #ff6666; left: 15%; animation: fastLaunch 1.7s linear infinite 0.3s; }
	.confetti12 { --color: #66ff66; left: 25%; animation: launch 2.3s linear infinite; }
	.confetti13 { --color: #6666ff; left: 35%; animation: fastLaunch 2.2s linear infinite 0.15s; }
	.confetti14 { --color: #ff66ff; left: 45%; animation: launch 1.8s linear infinite 0.25s; }
	.confetti15 { --color: #66ffff; left: 55%; animation: fastLaunch 2.5s linear infinite; }
	
	/* 不同形状的彩带 */
	.confetti1, .confetti4, .confetti7, .confetti10, .confetti13 {
	    border-radius: 50%; /* 圆形 */
	    width: 28rpx;
	    height: 28rpx;
	}
	
	.confetti2, .confetti5, .confetti8, .confetti11, .confetti14 {
	    border-radius: 0; /* 方形 */
	    width: 20rpx;
	    height: 20rpx;
	}
	
	.confetti3, .confetti6, .confetti9, .confetti12, .confetti15 {
	    border-radius: 50% 0 50% 0; /* 菱形效果 */
	    transform: rotate(45deg);
	}
	
	/* 添加发射轨迹动画（可选） */
	@keyframes launchWithArc {
	    0% {
	        transform: translateY(0) translateX(0) rotate(0deg) scale(0.5);
	        opacity: 0;
	    }
	    20% {
	        opacity: 1;
	        transform: translateY(-300rpx) translateX(20rpx) rotate(180deg) scale(1);
	    }
	    40% {
	        transform: translateY(-600rpx) translateX(-20rpx) rotate(360deg) scale(1);
	    }
	    60% {
	        transform: translateY(-800rpx) translateX(10rpx) rotate(540deg) scale(0.9);
	    }
	    80% {
	        opacity: 0.6;
	    }
	    100% {
	        transform: translateY(-1200rpx) translateX(-10rpx) rotate(720deg) scale(0.7);
	        opacity: 0;
	    }
	}
	
	/* 可选：添加一些带有弧线轨迹的彩带 */
	.confetti2, .confetti7, .confetti12 {
	    animation: launchWithArc 2.8s linear infinite;
	}

	/* 飘落彩带 - 增强版 */
	/* .confetti {
	    position: absolute;
	    width: 20rpx;
	    height: 20rpx;
	    background: var(--color);
	    animation: fall linear infinite;
	    z-index: 9999;
	    opacity: 0.8;
	} */
	
	/* 彩带颜色和动画设置 */
	/* .confetti1 { --color: #ff3366; top: -20rpx; left: 5%; animation: fall 1.8s linear infinite; }
	.confetti2 { --color: #ffcc00; top: -30rpx; left: 15%; animation: fall 2.2s linear infinite; }
	.confetti3 { --color: #33cc33; top: -40rpx; left: 25%; animation: fall 1.6s linear infinite; }
	.confetti4 { --color: #3366ff; top: -20rpx; left: 35%; animation: fall 2.4s linear infinite; }
	.confetti5 { --color: #cc33ff; top: -30rpx; left: 45%; animation: fall 1.9s linear infinite; }
	.confetti6 { --color: #ff6633; top: -40rpx; left: 55%; animation: fall 2.1s linear infinite; }
	.confetti7 { --color: #00ccff; top: -20rpx; left: 65%; animation: fall 1.7s linear infinite; }
	.confetti8 { --color: #ff33cc; top: -30rpx; left: 75%; animation: fall 2.3s linear infinite; }
	.confetti9 { --color: #33ffcc; top: -40rpx; left: 85%; animation: fall 1.5s linear infinite; }
	.confetti10 { --color: #ffff33; top: -20rpx; left: 95%; animation: fall 2.0s linear infinite; }
	.confetti11 { --color: #ff6666; top: -50rpx; left: 10%; animation: fall 2.5s linear infinite; }
	.confetti12 { --color: #66ff66; top: -60rpx; left: 20%; animation: fall 1.4s linear infinite; }
	.confetti13 { --color: #6666ff; top: -50rpx; left: 40%; animation: fall 1.9s linear infinite; }
	.confetti14 { --color: #ff66ff; top: -60rpx; left: 60%; animation: fall 2.2s linear infinite; }
	.confetti15 { --color: #66ffff; top: -50rpx; left: 80%; animation: fall 1.7s linear infinite; } */
	
	/* 更快的下落动画 */
	/* @keyframes fall {
	    0% {
	        transform: translateY(0) rotate(0deg) scale(1);
	        opacity: 0.9;
	    }
	    50% {
	        opacity: 0.8;
	    }
	    100% {
	        transform: translateY(1200rpx) rotate(720deg) scale(0.8);
	        opacity: 0;
	    }
	}
	
	.confetti1, .confetti3, .confetti5, .confetti7, .confetti9,
	.confetti11, .confetti13, .confetti15 {
	    border-radius: 50%;
	}
	
	.confetti2, .confetti4, .confetti6, .confetti8, .confetti10,
	.confetti12, .confetti14 {
	    border-radius: 0;
	    transform: rotate(45deg);
	} */
	
	/* 飘落彩带 */
	/* .confetti {
		position: absolute;
		width: 20rpx;
		height: 20rpx;
		background: var(--color);
		animation: fall linear infinite;
	}

	.confetti1 {
		--color: #ff3366;
		top: -20rpx;
		left: 10%;
		animation-duration: 3s;
	}

	.confetti2 {
		--color: #ffcc00;
		top: -20rpx;
		left: 30%;
		animation-duration: 4s;
	}

	.confetti3 {
		--color: #33cc33;
		top: -20rpx;
		left: 50%;
		animation-duration: 3.5s;
	}

	.confetti4 {
		--color: #3366ff;
		top: -20rpx;
		left: 70%;
		animation-duration: 4.5s;
	}

	.confetti5 {
		--color: #cc33ff;
		top: -20rpx;
		left: 90%;
		animation-duration: 3.8s;
	}

	@keyframes fall {
		to {
			transform: translateY(1200rpx) rotate(360deg);
			opacity: 0;
		}
	} */

	/* 闪烁星星 */
	.star {
		position: absolute;
		font-size: 40rpx;
		animation: twinkle 1.5s ease-in-out infinite alternate;
	}

	.star1 {
		top: 10%;
		left: 15%;
		animation-delay: 0s;
	}

	.star2 {
		top: 20%;
		right: 20%;
		animation-delay: 0.3s;
	}

	.star3 {
		bottom: 30%;
		left: 25%;
		animation-delay: 0.6s;
	}

	.star4 {
		bottom: 20%;
		right: 15%;
		animation-delay: 0.9s;
	}

	@keyframes twinkle {
		from {
			opacity: 0.3;
			transform: scale(0.8);
		}

		to {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	/* 喜庆花纹边框 */
	.border-pattern {
		position: absolute;
		font-size: 50rpx;
		animation: rotate 4s linear infinite;
	}

	.top-left {
		top: 20rpx;
		left: 20rpx;
	}

	.top-right {
		top: 20rpx;
		right: 20rpx;
		animation-direction: reverse;
	}

	.bottom-left {
		bottom: 20rpx;
		left: 20rpx;
		animation-delay: 2s;
	}

	.bottom-right {
		bottom: 20rpx;
		right: 20rpx;
		animation-delay: 2s;
		animation-direction: reverse;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}

		to {
			transform: rotate(360deg);
		}
	}

	/* 金色彩带 */
	.gold-ribbon {
		position: absolute;
		top: 50%;
		width: 100rpx;
		height: 20rpx;
		background: linear-gradient(90deg,
				transparent 0%,
				#FFD700 20%,
				#FFEC8B 50%,
				#FFD700 80%,
				transparent 100%);
		animation: shine 2s ease-in-out infinite;
	}

	.left-ribbon {
		left: 0;
		transform: translateY(-50%) rotate(-45deg);
		transform-origin: left center;
	}

	.right-ribbon {
		right: 0;
		transform: translateY(-50%) rotate(45deg);
		transform-origin: right center;
		animation-delay: 1s;
	}

	@keyframes shine {

		0%,
		100% {
			opacity: 0.5;
		}

		50% {
			opacity: 1;
		}
	}

	/* 主要内容包装 */
	.content-wrapper {
		position: relative;
		z-index: 1;
		padding: 60rpx 40rpx 40rpx;
		background: rgba(255, 255, 255, 0.95);
		margin: 80rpx 40rpx 40rpx;
		border-radius: 30rpx;
		box-shadow:
			0 10rpx 40rpx rgba(0, 0, 0, 0.1),
			inset 0 0 20rpx rgba(255, 215, 0, 0.2);
	}

	/* 大皇冠 */
	.big-crown {
		position: absolute;
		top: -60rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(45deg, #FFD700, #FFA500);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 10rpx 30rpx rgba(255, 215, 0, 0.5),
			inset 0 -5rpx 10rpx rgba(255, 140, 0, 0.3);
		border: 8rpx solid #FF8C00;
		z-index: 10;
	}

	.crown-text {
		font-size: 60rpx;
		animation: bounce 2s ease-in-out infinite;
	}

	@keyframes bounce {

		0%,
		100% {
			transform: translateY(0) scale(1);
		}

		50% {
			transform: translateY(-20rpx) scale(1.1);
		}
	}

	/* 标题区域 */
	.title-section {
		text-align: center;
		margin-bottom: 60rpx;
	}

	.title-main {
		font-size: 48rpx;
		font-weight: bold;
		color: #ff3366;
		text-shadow: 3rpx 3rpx 0 #ffcc00;
		margin: 16rpx 0;
		/* background: linear-gradient(45deg, #ff3366, #ff6600); */
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: colorChange 3s ease-in-out infinite;
		/* 后加的 */
		position: relative;
	}
	
	/* 通过伪元素实现渐变效果（兼容性更好） */
	.title-main::before {
		/* content: ''; */
	    position: absolute;
	    left: 0;
	    top: 0;
		width: 100%;
		height: 100%;
	    background: linear-gradient(45deg, #ff3366, #ff6600);
		mix-blend-mode: overlay; /* 或使用其他混合模式 */
		z-index: 1;
		pointer-events: none;
	}

	.title-sub {
		font-size: 32rpx;
		color: #ff6600;
		margin-bottom: 24rpx;
		font-weight: bold;
	}

	/* .title-deco {
		font-size: 36rpx;
		font-weight: bold;
		background: linear-gradient(45deg, #d4af37, #f9d71c, #ffd700, #daa520);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		background-size: 300% 300%;
		animation: pulse 2s ease-in-out infinite;
	} */
	.title-deco {
	    font-size: 36rpx;
	    font-weight: bold;
	    color: #d4af37; /* 基础颜色 */
	    position: relative;
	    display: inline-block;
	    text-shadow: 
	        0 0 1px rgba(212, 175, 55, 0.5),
	        0 0 2px rgba(212, 175, 55, 0.3);
		animation: pulse 2s ease-in-out infinite;	
	    
	    /* 第一层：基础黄金色 */
	    &::before {
	        position: absolute;
	        top: 0;
	        left: 0;
	        background: linear-gradient(45deg, #d4af37, #daa520);
	        -webkit-background-clip: text;
	        background-clip: text;
	        color: transparent;
	        z-index: 1;
	    }
	    
	    /* 第二层：高光效果 */
	    &::after {
	        position: absolute;
	        top: 0;
	        left: 0;
	        background: linear-gradient(45deg, 
	            transparent 30%, 
	            rgba(255, 255, 255, 0.6) 50%, 
	            transparent 70%);
	        -webkit-background-clip: text;
	        background-clip: text;
	        color: transparent;
	        z-index: 2;
	        animation: shine 3s ease-in-out infinite;
	    }
	}

	@keyframes colorChange {

		0%,
		100% {
			filter: hue-rotate(0deg);
		}

		50% {
			filter: hue-rotate(180deg);
		}
	}

	@keyframes pulse {

		0%,
		100% {
			opacity: 0.7;
			transform: scale(1);
		}

		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}

	/* 前三名容器 */
	.top-three-container {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 30rpx;
		margin-bottom: 60rpx;
	}

	.rank-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
	}

	/* 领奖台 */
	.podium {
		width: 100%;
		height: 200rpx;
		border-radius: 20rpx 20rpx 0 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20rpx;
		box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.2);
	}

	.podium-first {
		height: 240rpx;
		background: linear-gradient(180deg, #FFD700, #FFA500);
	}

	.podium-second {
		height: 180rpx;
		background: linear-gradient(180deg, #C0C0C0, #A0A0A0);
	}

	.podium-third {
		height: 150rpx;
		background: linear-gradient(180deg, #CD7F32, #8B4513);
	}

	.rank-number {
		font-size: 60rpx;
		font-weight: bold;
		text-shadow: 3rpx 3rpx 0 rgba(0, 0, 0, 0.2);
	}

	.gold {
		color: #FFD700;
	}

	.silver {
		color: #C0C0C0;
	}

	.bronze {
		color: #CD7F32;
	}

	/* 用户卡片 */
	.user-card {
		background: white;
		border-radius: 30rpx;
		padding: 30rpx;
		width: 100%;
		box-shadow:
			0 15rpx 30rpx rgba(0, 0, 0, 0.15),
			inset 0 0 20rpx rgba(255, 255, 255, 0.5);
		position: relative;
		border: 4rpx solid;
		text-align: center;
	}

	.rank-first .user-card {
		border-color: #FFD700;
		background: linear-gradient(145deg, #ffffff, #FFF9C4);
	}

	.rank-second .user-card {
		border-color: #C0C0C0;
	}

	.rank-third .user-card {
		border-color: #CD7F32;
	}

	.medal {
		position: absolute;
		top: -30rpx;
		left: 50%;
		transform: translateX(-50%);
		font-size: 60rpx;
		background: white;
		border-radius: 50%;
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.2);
		border: 6rpx solid;
	}

	.gold-medal {
		border-color: #FFD700;
	}

	.silver-medal {
		border-color: #C0C0C0;
	}

	.bronze-medal {
		border-color: #CD7F32;
	}

	.avatar {
		width: 140rpx;
		height: 140rpx;
		border-radius: 50%;
		border: 8rpx solid;
		margin: 20rpx auto;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
	}

	.rank-first .avatar {
		border-color: #FFD700;
	}

	.rank-second .avatar {
		border-color: #C0C0C0;
	}

	.rank-third .avatar {
		border-color: #CD7F32;
	}

	.user-info {
		margin-top: 20rpx;
	}

	.name {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 16rpx;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.score-section {
		/* #ifdef H5 */
		background: linear-gradient(45deg, #f8f9fa, #e9ecef);
		/* #endif */
		/* #ifndef H5 */
		/* background: #e9ecef; */
		/* #endif */
		padding: 16rpx;
		border-radius: 20rpx;
		display: inline-flex;
		align-items: center;
		gap: 12rpx;
		margin-bottom: 20rpx;
	}

	.score-label {
		font-size: 24rpx;
		color: #666;
	}

	.score-value {
		font-size: 36rpx;
		font-weight: bold;
		color: #ff3366;
		text-shadow: 1rpx 1rpx 0 rgba(0, 0, 0, 0.1);
	}

	.champion-badge {
		position: absolute;
		bottom: -20rpx;
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(45deg, #FFD700, #FFA500);
		color: #8B4513;
		font-weight: bold;
		padding: 10rpx 30rpx;
		border-radius: 50rpx;
		font-size: 24rpx;
		white-space: nowrap;
		box-shadow: 0 5rpx 15rpx rgba(255, 140, 0, 0.3);
		animation: blink 1.5s ease-in-out infinite;
	}

	@keyframes blink {

		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.7;
		}
	}

	/* 祝贺区域 */
	.congrats-section {
		text-align: center;
		margin: 40rpx 0;
	}

	.congrats-text {
		font-size: 30rpx;
		color: #ff6600;
		line-height: 1.6;
		margin-bottom: 24rpx;
		font-weight: bold;
		padding: 30rpx;
		background: linear-gradient(45deg,
				rgba(255, 102, 0, 0.1),
				rgba(255, 204, 0, 0.1));
		border-radius: 20rpx;
		border-left: 8rpx solid #ff6600;
	}

	.fireworks {
		font-size: 40rpx;
		letter-spacing: 20rpx;
		animation: fireworks 2s ease-in-out infinite;
	}

	@keyframes fireworks {

		0%,
		100% {
			opacity: 0.7;
		}

		50% {
			opacity: 1;
		}
	}

	/* 按钮区域 */
	.action-buttons {
		display: flex;
		gap: 30rpx;
		margin: 40rpx 0;
		padding: 0 80rpx;
	}

	.share-btn,
	.confirm-btn {
		flex: 1;
		height: 100rpx;
		border-radius: 50rpx;
		font-size: 32rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15rpx;
		transition: all 0.3s;
		border: none;
		font-weight: bold;
	}

	.share-btn {
		background: linear-gradient(45deg, #36d1dc, #5b86e5);
		color: white;
		box-shadow: 0 10rpx 30rpx rgba(54, 209, 220, 0.4);
	}

	.confirm-btn {
		background: linear-gradient(45deg, #ff3366, #ff6600);
		color: white;
		box-shadow: 0 10rpx 30rpx rgba(255, 51, 102, 0.4);
	}

	.btn-hover {
		transform: translateY(-5rpx);
		box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.3);
	}

	.btn-icon {
		font-size: 40rpx;
	}

	.btn-text {
		font-weight: bold;
	}

	/* 底部装饰 */
	.bottom-decorations {
		text-align: center;
		margin-top: 40rpx;
		padding-top: 30rpx;
		border-top: 4rpx dashed #ffcc00;
	}

	.deco-text {
		display: block;
		font-size: 28rpx;
		color: #ff6600;
		margin-bottom: 20rpx;
		font-weight: bold;
	}

	.deco-icons {
		font-size: 40rpx;
		animation: bounceIcons 2s ease-in-out infinite;
	}

	@keyframes bounceIcons {

		0%,
		100% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-20rpx);
		}
	}
	
	.closeDialog {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 40rpx;
		
		.close-img {
		    width: 70rpx;
		    height: 70rpx;
		}
	}
</style>