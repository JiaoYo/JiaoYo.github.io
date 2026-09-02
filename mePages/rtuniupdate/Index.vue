<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBackPress, onHide, onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { updateClose } from '../../static/updateclose';
import { updateBg } from '../../static/updatebg';

const { t } = useI18n();

const platform = ref<string>('');
const version = ref<any>('');
const percent = ref<number>(0);
const updateBtn = ref<boolean>(true);
const cancleBtn = ref<boolean>(false);
const downloadedSize = ref<number>(0);
const packageFileSize = ref<number>(0);
const data = ref<any>({});

onHide(() => {
    // 解决应用切换到后台再次打开更新弹窗叠加多个的问题
    uni.navigateBack({
        delta: 1,
    });
});

onLoad((obj: any) => {
    platform.value = uni.getSystemInfoSync().platform;
    data.value = JSON.parse(obj.obj);
    if (data.value[platform.value].edition_force_update === 0) {
        cancleBtn.value = true;
    }
    plus.runtime.getProperty((plus.runtime as any).appid, (inf) => {
        version.value = inf.version;
    });
});

onBackPress(() => {
    // 强制更新不允许返回
    if (data.value[platform.value] && data.value[platform.value].edition_force_update === 1) {
        return true;
    }
});

function cancel() {
    // 强制更新不允许返回
    if (data.value[platform.value] && data.value[platform.value].edition_force_update === 1) {
        return true;
    }
    // 取消升级 返回上一页
    uni.navigateBack({
        delta: 1,
    });
}

function confirm() {
    // apk整包升级 下载地址必须以.apk结尾
    if (data.value[platform.value].edition_url.includes('.apk')) {
        // updateBtn.value = false;
        // cancleBtn.value = false;
        // download();
        // 外部下载 一般是手机应用市场或者其他h5页面
        uni.navigateBack();
        plus.runtime.openURL(data.value[platform.value].edition_url);
        // uni.navigateBack({
        //     delta: 1
        // });
    } else {
        // 外部下载 一般是手机应用市场或者其他h5页面
        uni.navigateBack();
        plus.runtime.openURL(data.value[platform.value].edition_url);
        // uni.navigateBack({
        //     delta: 1
        // });
    }
}
</script>

<template>
    <view class="update-mask flex-center">
        <view class="content botton-radius">
            <view class="content-top">
                <view class="content-top-text">
                    <text class="findNewVersion"> 发现新版本 <br />v{{ data[platform].edition_name }} </text>
                    <text class="version" style="font-size: 33rpx; font-weight: bold; color: #3da7ff; margin-top: 20px"> 当前版本：v{{ version }} </text>
                </view>
                <image class="content-top" style="top: 0" width="100%" height="100%" :src="updateBg" />
            </view>
            <view class="content-header" />
            <view class="content-body">
                <view class="title" style="margin-top: 10px">
                    <text>更新内容</text>
                </view>
                <view class="body">
                    <scroll-view class="box-des-scroll" scroll-y style="max-height: 240px">
                        <rich-text :nodes="data.describe" />
                    </scroll-view>
                </view>

                <view class="footer flex-center">
                    <view v-if="!updateBtn" class="progress-box flex-column">
                        <progress class="progress" border-radius="35" :percent="percent" activeColor="#3DA7FF" show-info :stroke-width="10" />
                        <!-- <u-line-progress :striped="true" :percent="percent" :striped-active="true"></u-line-progress> -->
                        <view>
                            <text class="fs24"> {{ $t('newVersion.downloading') }} ({{ downloadedSize }}/{{ packageFileSize }}M) </text>
                        </view>
                    </view>

                    <button v-if="updateBtn" class="content-button" style="border: none; color: #fff" plain @click="confirm">立即升级</button>
                </view>
            </view>

            <image v-if="cancleBtn" class="close-img" :src="updateClose" @click.stop="cancel" />
        </view>
    </view>
</template>

<style lang="scss" scoped>
page {
    background: transparent;
}

.flex-center {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    justify-content: center;
    align-items: center;
}

.update-mask {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.65);
}

.botton-radius {
    border-bottom-left-radius: 30rpx;
    border-bottom-right-radius: 30rpx;
}

.content {
    position: relative;
    top: 0;
    width: 600rpx;
    background-color: #fff;
    box-sizing: border-box;
    padding: 0 50rpx;
    font-family: Source Han Sans CN;
}

.text {
    /* #ifndef APP-NVUE */
    display: block;
    /* #endif */
    line-height: 200px;
    text-align: center;
    color: #ffffff;
}

.content-top {
    position: absolute;
    top: -195rpx;
    left: 0;
    width: 600rpx;
    height: 270rpx;
}

.content-top-text {
    font-size: 40rpx;
    font-weight: bold;
    color: #f8f8fa;
    position: absolute;
    top: 120rpx;
    left: 50rpx;
    z-index: 1;
    display: flex;
    flex-direction: column;
}

.content-header {
    height: 90rpx;
}

.title {
    font-size: 33rpx;
    font-weight: bold;
    color: #3da7ff;
    line-height: 38px;
}

.footer {
    height: 150rpx;
    display: flex;
    align-items: center;
    justify-content: space-around;
}

.box-des-scroll {
    box-sizing: border-box;
    padding: 0 40rpx;
    text-align: left;
}

.box-des {
    font-size: 26rpx;
    color: #000000;
    line-height: 50rpx;
}

.progress-box {
    width: 100%;
}

.progress {
    width: 83%;
    height: 40rpx;
    border-radius: 35px;
}

.close-img {
    width: 70rpx;
    height: 70rpx;
    z-index: 1000;
    position: absolute;
    bottom: -120rpx;
    left: calc(50% - 70rpx / 2);
}

.content-button {
    text-align: center;
    flex: 1;
    font-size: 30rpx;
    font-weight: 400;
    color: #ffffff;
    border-radius: 40rpx;
    margin: 0 18rpx;

    height: 80rpx;
    line-height: 80rpx;

    background: linear-gradient(to right, #1785ff, #3da7ff);
}

.flex-column {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.fs24 {
    font-size: 24rpx;
}

.version {
    font-size: 24rpx;
    margin-top: 10rpx;
    color: #eeeeee;
    text-decoration: underline;
}
</style>
