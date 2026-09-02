<template>
	<view class="container">
		<view @click="open">
			<slot></slot>
		</view>
		
		<view class="cjx-previewOffice-container" :style="{ height: pagesHeight }">
			<view class="cjx-previewOffice-header" v-if="!$slots.header">
				<view class="icon" ></view>
				<view class="name">
					{{ name }}
				</view>
				<icon class="icon" @click="close" type="cancel"></icon>
			</view>
			
			<view class="cjx-previewOffice-header" v-else>
				<slot name="header"></slot>
			</view>
			
			<view class="webview">
				<!-- #ifdef H5 -->
					<iframe
						class="cjx-previewOffice-iframe"
						:webview-styles="webviewStyles"
						:src="`${typeMapSrc[type]}${encodeURIComponent(props.value)}&safeBottom=${safeBottom}`"
					/>
				<!-- #endif -->
				
			</view>
		</view>
		
		<view class="cjx-previewOffice-mask"
			:style="{
				zIndex: pagesHeight !== '0' ? zIndex : '-1',
				opacity: pagesHeight !== '0' ? 1 : 0,
			}"
			@click="closeOnClickModalChange"
			>
			
		</view>
	</view>
	
</template>


<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { previewOfficeProps, FileType } from './interface'
// <!-- #ifdef H5 -->
// <!-- #endif -->
const props = defineProps(previewOfficeProps())

const showWebviewArr: FileType[] = ['excel', 'pdf', 'word', 'txt']

 
 const webviewStyles = ref<CSSProperties>({
	 zIndex: '9999',
 })
 
const typeMapSrc = {
	word: '/uni_modules/cjx-previewOffice/static/hybrid/word.html?file=',
	pdf: '/uni_modules/cjx-previewOffice/static/hybrid/pdf/web/viewer.html?file=',
	excel: '/uni_modules/cjx-previewOffice/static/hybrid/excel.html?file=',
	txt: '/uni_modules/cjx-previewOffice/static/hybrid/txt.html?file=',
}
	
const pagesHeight = ref<string>('0')


const safeBottom = ref<number>(0)
let webview: any = null


const open = () => {
	if (pagesHeight.value === '85vh') {
		return
	}
	
	// #ifdef H5
	setTimeout(() => {
		pagesHeight.value = '85vh'
	})
	// #endif
	
	// #ifdef APP-PLUS
	// console.log(11, uni.getSystemInfoSync())
	const { statusBarHeight, windowHeight, screenHeight } = uni.getSystemInfoSync()
	pagesHeight.value = Number(windowHeight) - 96 + 'px'
	webview = plus.webview.create(
		`${typeMapSrc[props.type]}${encodeURIComponent(props.value)}&safeBottom=${safeBottom.value}`,
		'id', 
		{ 
			bottom: 0,
			height: windowHeight - 140,
		},

	); 
	const pages = getCurrentPages();
	const page: any = pages[pages.length - 1];
	const currentWebview = page.$getAppWebview();
	
	currentWebview.append(webview);
	webview.show('id', 'slide-in-bottom')
	// #endif
}

const close = () => {
	
	pagesHeight.value = '0'

	// #ifdef APP-PLUS
	webview.setStyle({
		height: 0,
	})
	webview.close('slide-in-bottom')
	// #endif
}


const closeOnClickModalChange = () => {
	if (props.closeOnClickModal) {
		pagesHeight.value = '0'
		// #ifdef APP-PLUS
		webview.setStyle({
			height: 0,
		})
		webview.close('slide-in-bottom')
		// #endif
	}
}

defineExpose({
	open,
	close
})

onMounted(() => {
	safeBottom.value = 0
	// #ifdef H5
	
	// #endif
	
	// #ifdef APP-PLUS
	uni.getSystemInfo({
	  success: function (res) {
	    console.log(res.safeArea); // 输出安全区域信息
			safeBottom.value = res.screenHeight - res.safeArea.bottom; // 计算底部安全区域高度
	    console.log('底部安全区域高度:', safeBottom.value);
	  }
	});
	// #endif
	// if (props.type === 'image') {
	// 	uni.previewImage({
	// 		urls: ['https://img2.baidu.com/it/u=412966049,488862975&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=800'],
	// 	})
	// }
	
})

</script>

<style lang="scss" >
	iframe {
		// position: absolute;
	  // top: 44px !important;
	  // height: calc(100vh - 44px) !important;
		// position: absolute;
		z-index: 9999 !important;
		top: calc(15vh + 44px) !important;
		// height: calc(100% - 70rpx) !important;
	}
	.cjx-previewOffice-iframe {
		// z-index: 9999 !important;
		width: 100vw;
		top: 44px !important;
		height: calc(100% - 12px) !important;
	}
	.cjx-previewOffice-container {
		position: fixed;
		left: 0px;
		overflow: hidden;
		z-index: 998;
		// height: 100vh;
		width: 100vw;
		bottom: 0;
		transition: all ease 0.2s;
		background-color: #fff;
		// position: relative;
		.cjx-previewOffice-header {
			background-color: #fff;
			// position: fixed;
			// top: 0;
			height: 44px;
			z-index: 9999;
			display: flex;
			align-items: center;
			width: 100%;
			padding: 0 16rpx;
			box-sizing: border-box;
			.name {
				width: calc(100% - 80rpx);
				text-align: center;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				padding-right: 10rpx;
				box-sizing: border-box;
				
			}
			.icon {
				width: 40rpx;
			}
		}
	}
	
	.webview {
		// height: calc(100vh - 44px) !important;
		height: calc(100% - 70rpx) !important;
	}
	
	.cjx-previewOffice-mask {
		position: fixed;
		z-index: 990;
		background-color: rgba(0, 0, 0, 0.4);
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		opacity: 0;
		transition: all ease 0.2s;
	}
</style>
