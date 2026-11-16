<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchGetAftersaleSnInfo, fetchUpdateAftersaleSnInfo } from '@/service/index';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const model = reactive<{
	id: any;
	diagnosis: string;
	tphand: string;
	impv: string;
}>({
	id: null,
	diagnosis: '',
	tphand: '',
	impv: ''
})

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListUpdateAftersaleSn'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取项目信息
async function getBaseInfo() {
    const data = await fetchGetAftersaleSnInfo((model.id as number));
	model.diagnosis = data.hasOwnProperty('diagnosis') ? data.diagnosis : '';
	model.tphand = data.hasOwnProperty('tphand') ? data.tphand : '';
	model.impv = data.hasOwnProperty('impv') ? data.impv : '';
}

// 提交
async function handleSubmitChange() {
	if (!hasPermission('aftermarket:update:permission.do')) {
	    uni.showToast({
	        icon: 'none',
	        title: '暂无权限，请联系管理员',
	        duration: 1500
	    })
	    return false
	}
    if (!model.diagnosis) {
        uni.showToast({
            icon: 'none',
            title: '请输入诊断结论',
            duration: 1500
        })
        return false
    }
	if (!model.tphand) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入临时处理',
	        duration: 1500
	    })
	    return false
	}
	if (!model.impv) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入长期改善',
	        duration: 1500
	    })
	    return false
	}
    loading.value = true;
    try {
        // 获取对应名称
        let queryParams = [{
			id: model.id,
			diagnosis: model.diagnosis,
			tphand: model.tphand,
			impv: model.impv
        }];
        const data = await fetchUpdateAftersaleSnInfo(queryParams);
		uni.showToast({
			title: '修改售后设备成功',
			icon: 'none',
			duration: 1500,
			complete: () => {
				loading.value = false;
				handleClickLeft(true);
			}
		});
    } catch (err) {
        console.error('修改售后设备失败', err);
        loading.value = false;
    }
}

onLoad((options: any) => {
	model.id = options.id;
	getBaseInfo();
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="修改售后设备" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft"></wd-navbar>

		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">诊断结论</view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
		    <wd-textarea clearable v-model.trim="model.diagnosis" placeholder="请输入诊断结论"></wd-textarea>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">临时处理</view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
		    <wd-textarea clearable v-model.trim="model.tphand" placeholder="请输入临时处理"></wd-textarea>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">长期改善</view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
		    <wd-textarea clearable v-model.trim="model.impv" placeholder="请输入长期改善"></wd-textarea>
		</view>
		
        <view class="buttonWrap">
            <wd-button hairline type="primary" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" :loading="loading" @click="handleSubmitChange">提交</wd-button>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.buttonWrap {
    display: flex;
    justify-content: center;
    align-items: center;
    width: calc(100vw - 40rpx);
    margin: 30rpx 40rpx 30rpx 0;
    padding: 0 0 40rpx 20rpx;
}

.darkButtonWrap {
    width: 100% !important;
}

.lightButtonWrap {
    width: 100% !important;
}
</style>