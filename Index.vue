<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref } from 'vue';
import { onHide, onLoad, onReady, onShow, onUnload } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { openDeviceWorkspace, type DeviceScanType } from '@/utils/deviceScan';

const { theme, themeVars } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const scanType = ref<DeviceScanType>('qrCode');
const torchEnabled = ref(false);
const pageInstance = getCurrentInstance();
let scanResultHandled = false;
let startTimer: ReturnType<typeof setTimeout> | null = null;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let stream: MediaStream | null = null;
let scanTimer: ReturnType<typeof setInterval> | null = null;

// #ifdef H5
const barcodeDetector = ref<any>(null);
const videoRef = ref<any>(null);

let browserScanStarting = false;
let browserScanStopping = false;
let browserScanActive = false;
let detectionPending = false;

async function startBrowserScan() {
    if (browserScanStarting || browserScanActive) return;
    if (!('BarcodeDetector' in window)) {
        uni.showToast({ title: '当前浏览器暂不支持扫码识别', icon: 'none' });
        return;
    }
    browserScanStarting = true;
    browserScanActive = true;
    browserScanStopping = false;
    try {
        const Detector = (window as any).BarcodeDetector;
        const supportedFormats = await Detector.getSupportedFormats();
        const formats = ['qr_code', 'code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar'].filter(format => supportedFormats.includes(format));
        if (!formats.length) {
            uni.showToast({ title: '当前浏览器暂不支持扫码识别', icon: 'none' });
            return;
        }
        barcodeDetector.value = new Detector({ formats });
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (browserScanStopping) {
            mediaStream.getTracks().forEach(track => track.stop());
            return;
        }
        stream = mediaStream;
        const video = (videoRef.value?.$el?.querySelector('video') || document.querySelector('.browser-scan-video video')) as HTMLVideoElement | null;
        if (!video) throw new Error('扫码视频元素尚未就绪');
        video.srcObject = mediaStream;
        await video.play();
        scanTimer = setInterval(async () => {
            if (scanResultHandled || detectionPending || !barcodeDetector.value || video.readyState < 2) return;
            detectionPending = true;
            try {
                const codes = await barcodeDetector.value.detect(video);
                if (codes.length) {
                    stopBrowserScan();
                    handleMarked({ code: codes[0].rawValue, type: codes[0].format === 'qr_code' ? 'qrCode' : 'barCode' });
                }
            } catch {
                // 视频帧尚未就绪时继续下一帧
            } finally {
                detectionPending = false;
            }
        }, 400);
    } catch (error) {
        stopBrowserScan();
        console.error('浏览器摄像头启动失败', error);
        uni.showToast({ title: '摄像头启动失败，请检查权限', icon: 'none' });
    } finally {
        browserScanStarting = false;
    }
}

function stopBrowserScan() {
    browserScanStopping = true;
    browserScanActive = false;
    detectionPending = false;
    if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = null;
    }
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
}
// #endif

// #ifdef APP-PLUS
function getPreview() {
    return uni.getSubNVueById('device-camera-preview') as any;
}

function updatePreview() {
    nextTick(() => {
        uni.createSelectorQuery().in(pageInstance).select('.scan-region').boundingClientRect((rect) => {
            if (!rect || Array.isArray(rect) || !rect.width || !rect.height) return;
            const preview = getPreview();
            if (!preview) return;
            const { top, left, width, height } = rect;
            preview.show('none', 0, () => {
                preview.setStyle({
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                });
                uni.$emit('device-scan-config', { type: scanType.value, action: 'start' });
            });
        }).exec();
    });
}

function stopPreview() {
    if (startTimer) {
        clearTimeout(startTimer);
        startTimer = null;
    }
    if (resizeTimer) {
        clearTimeout(resizeTimer);
        resizeTimer = null;
    }
    uni.$emit('device-scan-config', { action: 'stop' });
    getPreview()?.hide('none', 0);
    torchEnabled.value = false;
}

// #endif

function handleMarked(data: { code: string; type: DeviceScanType }) {
    if (scanResultHandled || !data.code) return;
    scanResultHandled = true;
    uni.redirectTo({
        url: `/projectPages/deviceworkspace/Index?code=${encodeURIComponent(data.code)}&type=${data.type}`,
        fail: () => openDeviceWorkspace(data.code, data.type),
    });
}

function handleClickLeft() {
    // #ifdef APP-PLUS
    stopPreview();
    // #endif
    // #ifdef H5
    stopBrowserScan();
    history.go(-1);
    // #endif
    // #ifndef H5
    uni.navigateBack();
    // #endif
}

function handleToggleTorch() {
    // #ifdef APP-PLUS
    torchEnabled.value = !torchEnabled.value;
    uni.$emit('device-scan-config', { action: 'flash', enabled: torchEnabled.value });
    // #endif
    // #ifndef APP-PLUS
    uni.showToast({ title: '请在 App 中使用照明', icon: 'none' });
    // #endif
}

onLoad((options: Record<string, string>) => {
    scanType.value = options?.type === 'barCode' ? 'barCode' : 'qrCode';
    // #ifdef APP-PLUS
    uni.$on('device-scan-marked', handleMarked);
    // #endif
    // #ifdef H5
    nextTick(startBrowserScan);
    // #endif
});

onReady(() => {
    // #ifdef APP-PLUS
    startTimer = setTimeout(() => {
        updatePreview();
        resizeTimer = setTimeout(updatePreview, 800);
    }, 300);
    // #endif
});

onShow(() => {
    // #ifdef APP-PLUS
    plus.device.setWakelock(true);
    updatePreview();
    // #endif
    // #ifdef H5
    if (!stream) nextTick(startBrowserScan);
    // #endif
});

onHide(() => {
    // #ifdef APP-PLUS
    plus.device.setWakelock(false);
    stopPreview();
    // #endif
    // #ifdef H5
    stopBrowserScan();
    // #endif
});

onUnload(() => {
    // #ifdef APP-PLUS
    plus.device.setWakelock(false);
    stopPreview();
    uni.$off('device-scan-marked', handleMarked);
    // #endif
    // #ifdef H5
    stopBrowserScan();
    // #endif
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <view class="page-root" :class="{ dark: isDark }">
            <wd-navbar title="扫一扫" left-arrow safe-area-inset-top placeholder fixed :bordered="false"
                :custom-style="`background:${isDark ? '#0F1524' : '#F4F8FF'}; color:${isDark ? '#E8ECF8' : '#1F2A44'};`" @click-left="handleClickLeft" />
            <view class="scan-page">
                <view class="scan-intro">
                    <text class="scan-title">识别设备，继续调试</text>
                    <text class="scan-description">将设备条形码或二维码置于取景框内，自动识别</text>
                </view>
                <view class="scan-stage">
                    <!-- #ifdef H5 -->
                    <video ref="videoRef" class="browser-scan-video" autoplay muted playsinline></video>
                    <!-- #endif -->
                    <view class="scan-region"></view>
                    <!-- #ifdef H5 -->
                    <view class="scan-guide" aria-hidden="true">
                        <view class="guide-corner top-left"></view>
                        <view class="guide-corner top-right"></view>
                        <view class="guide-corner bottom-left"></view>
                        <view class="guide-corner bottom-right"></view>
                        <view class="guide-line"></view>
                    </view>
                    <!-- #endif -->
                    <text class="scan-stage-note">自动识别条形码和二维码</text>
                </view>
                <view class="torch-button" :class="{ enabled: torchEnabled }" @click="handleToggleTorch">
                    <wd-icon name="fill-camera" size="19px" />
                    <text>{{ torchEnabled ? '轻触关闭照明' : '轻触照亮' }}</text>
                </view>
            </view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.page-root { min-height: 100vh; background: #F4F8FF; }
.page-root.dark { background: #0F1524; }
.scan-page { padding: 32rpx 32rpx 56rpx; }
.scan-intro { margin-bottom: 32rpx; }
.scan-title { display: block; font-size: 40rpx; line-height: 1.4; font-weight: 600; }
.scan-description { display: block; margin-top: 14rpx; color: #68768D; font-size: 27rpx; line-height: 1.7; }
.scan-stage { position: relative; display: flex; flex-direction: column; align-items: center; border-radius: 24rpx; background: #142236; overflow: hidden; }
.scan-region { width: 100%; height: 280rpx; background: #000000; }
.browser-scan-video { position: absolute; top: 0; left: 0; width: 100%; height: 280rpx; object-fit: cover; background: #000000; }
.scan-guide { position: absolute; top: 24rpx; left: 24rpx; right: 24rpx; height: 232rpx; pointer-events: none; }
.guide-corner { position: absolute; width: 42rpx; height: 42rpx; border-color: #78A9FF; border-style: solid; }
.top-left { top: 0; left: 0; border-width: 5rpx 0 0 5rpx; }
.top-right { top: 0; right: 0; border-width: 5rpx 5rpx 0 0; }
.bottom-left { bottom: 0; left: 0; border-width: 0 0 5rpx 5rpx; }
.bottom-right { bottom: 0; right: 0; border-width: 0 5rpx 5rpx 0; }
.guide-line { position: absolute; left: 24rpx; right: 24rpx; top: 50%; height: 3rpx; background: #5D9BFF; }
.scan-stage-note { padding: 26rpx 0; color: #C0CDDD; font-size: 26rpx; }
.torch-button { display: flex; align-items: center; justify-content: center; gap: 12rpx; width: fit-content; min-height: 88rpx; margin: 20rpx auto 0; padding: 0 28rpx; color: #0055FE; font-size: 27rpx; }
.dark .torch-button { color: #80B4FF; }
.torch-button.enabled { color: #16875A; }
</style>
