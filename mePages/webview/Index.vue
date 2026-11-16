<script lang="ts" setup>
import { useToast } from 'wot-design-uni';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onReady } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const webviewSrc = ref<string>('');

const webviewTitle = ref<string>('');

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// #ifdef APP-PLUS
onReady(() => {
    setTimeout(() => {
        const pages: any = getCurrentPages();
        const page: any = pages[pages.length - 1];
        const currentWebview = page.$getAppWebview();

        // WebView 是 currentWebview 的子组件
        const webview = currentWebview.children()[0];

        if (webview) {
            console.log('成功获取webview对象:', webview);
            webview.setStyle({
                top: '80px',
                bottom: '0px',
                left: '0px',
                right: '0px',
            });
        } else {
            console.warn('未找到webview对象');
        }
    }, 300); // 加一点延迟确保WebView已创建
});
// #endif

onLoad((options: any) => {
    // #ifdef H5 || MP-WEIXIN || APP || APP-PLUS
    webviewSrc.value = JSON.stringify(options) !== '{}' ? options.url : 'http://linkqi.cn/';
	webviewTitle.value = JSON.stringify(options) !== '{}' ? decodeURIComponent(options.title) : '关于我们';
	// webviewSrc.value = 'http://linkqi.cn/';
    // webviewSrc.value = 'https://www.hzlingqi.cn/';
    // #endif
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<!-- #ifdef H5 -->
		<wd-navbar left-arrow :title="webviewTitle" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />
		<web-view :src="webviewSrc" style="margin-top: 48px" />
		<!-- #endif -->
		
		<!-- #ifdef MP-WEIXIN -->
		<web-view :src="webviewSrc" />
		<!-- #endif -->
        
		<!-- #ifdef APP || APP-PLUS -->
		<wd-navbar left-arrow :title="webviewTitle" safe-area-inset-top placeholder fixed :bordered="false" custom-style="touch-action: none;" @click-left="handleClickLeft" />
		<web-view :src="webviewSrc" />
		<!-- #endif -->
    </wd-config-provider>
</template>
