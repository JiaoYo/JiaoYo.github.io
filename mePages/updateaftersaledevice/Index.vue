<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref, computed } from 'vue';
import { uploadFile } from '@/utils/uploadFile';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchGetAftersaleSnInfo, fetchUpdateAftersaleSnInfo } from '@/service/index';

const form = ref();
const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

// 设备二维码照片
const qrcodeFileList = ref<any[]>([]);

// 现场照片
const uploadFileList = ref<any[]>([]);

// 现场视频
const uploadVideoList = ref<any[]>([]);

const model = reactive<{
	id: any;
	sn: string;
	fault: string;
	details: number;
	accessory: string;
}>({
	id: null,
	sn: '',
	fault: '',
	details: 0,
	accessory: ''
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
	model.sn = data.sn;
	model.fault = data.fault;
	model.details = data.hasOwnProperty('details') ? data.details : 0;
	model.accessory = data.hasOwnProperty('accessory') ? data.accessory : '';
	qrcodeFileList.value = [data.qrcode].filter(src => src).map(imageItem => {
		return {
			url: imageItem
		}
	});
	uploadFileList.value = [data.devre1, data.devre2, data.devre3].filter(src => src).map(imageItem => {
		return {
			url: imageItem
		}
	});
	uploadVideoList.value = [data.devre4].filter(src => src).map(imageItem => {
		return {
			url: imageItem
		}
	});
}

// 上传设备二维码图片
const handleCustomQrcodeUploadChange : UploadMethod = (file : any, formData : any, options : any) => {
	// file.status = "success";
	// qrcodeFileList.value.push(file);
	options.onSuccess(file.url, file, formData);
}

// 删除设备二维码图片
const handleCustomQrcodeRemoveFileChange = (e : any) => {
	console.log('e', e);
	// qrcodeFileList.value = qrcodeFileList.value.filter((item : any) => item.uid !== e.file.uid);
}

// 上传分析图片
const handleCustomUploadChange : UploadMethod = (file : any, formData : any, options : any) => {
	// file.status = "success";
	// uploadFileList.value.push(file);
	options.onSuccess(file.url, file, formData);
}

// 删除文件
const handleRemoveFileChange = (e : any) => {
	console.log('e', e);
	// uploadFileList.value = uploadFileList.value.filter((item : any) => item.uid !== e.file.uid);
}

// 上传现场视频
const handleCustomVideoUploadChange : UploadMethod = (file : any, formData : any, options : any) => {
	// file.status = "success";
	// uploadVideoList.value = [file];
	options.onSuccess(file.url, file, formData);
}

// 删除视频
const handleRemoveVideoChange = (e : any) => {
	console.log('e', e);
	// uploadVideoList.value = [];
}

async function handleSubmitChange() {
	if (!hasPermission('aftermarket:update:permission.do')) {
	    uni.showToast({
	        icon: 'none',
	        title: '暂无权限，请联系管理员',
	        duration: 1500
	    })
	    return false
	}
    if (!model.fault) {
        uni.showToast({
            icon: 'none',
            title: '请输入故障现象',
            duration: 1500
        })
        return false
    }
    if (model.details === 1 && !model.accessory) {
        uni.showToast({
            icon: 'none',
            title: '请输入客户寄件配件详情',
            duration: 1500
        })
        return false
    }
	const uploadQrcodePromises = qrcodeFileList.value.map(async (file : any) => {
		// 跳过无效文件
		if (!file) return Promise.resolve(file);
	
		// 如果已经是有效线上地址，直接通过
		if (file.url && file.url.startsWith("https://pictures.linkqi.cn")) {
			return Promise.resolve(file);
		}
	
		return new Promise((resolve, reject) => {
			uploadFile(file, '', (response, f) => {
				f.url = response.data;
				resolve(f);
			}, (error, f) => {
				console.error('上传失败:', error);
				resolve(f); // 或根据需求决定是否继续
			});
		});
	});
	await Promise.all(uploadQrcodePromises);
	const uploadPromises = uploadFileList.value.map(async (file : any) => {
		// 跳过无效文件
		if (!file) return Promise.resolve(file);
	
		// 如果已经是有效线上地址，直接通过
		if (file.url && file.url.startsWith("https://pictures.linkqi.cn")) {
			return Promise.resolve(file);
		}
	
		return new Promise((resolve, reject) => {
			uploadFile(file, '', (response, f) => {
				f.url = response.data;
				resolve(f);
			}, (error, f) => {
				console.error('上传失败:', error);
				resolve(f); // 或根据需求决定是否继续
			});
		});
	});
	await Promise.all(uploadPromises);
	const uploadVideoPromises = uploadVideoList.value.map(async (file : any) => {
		// 跳过无效文件
		if (!file) return Promise.resolve(file);
	
		// 如果已经是有效线上地址，直接通过
		if (file.url && file.url.startsWith("https://pictures.linkqi.cn")) {
			return Promise.resolve(file);
		}
	
		return new Promise((resolve, reject) => {
			uploadFile(file, '', (response, f) => {
				f.url = response.data;
				resolve(f);
			}, (error, f) => {
				console.error('上传失败:', error);
				resolve(f); // 或根据需求决定是否继续
			});
		});
	});
	await Promise.all(uploadPromises);
	await Promise.all(uploadVideoPromises);
    loading.value = true;
    try {
        // 获取对应名称
        let queryParams = [{
			id: model.id,
			sn: model.sn,
			details: model.details,
			accessory: model.accessory,
			fault: model.fault,
			qrcode: qrcodeFileList.value.length > 0 ? qrcodeFileList.value[0].url : '',
			devre1: uploadFileList.value.length > 0 ? uploadFileList.value[0].url : '',
			devre2: uploadFileList.value.length > 1 ? uploadFileList.value[1].url : '',
			devre3: uploadFileList.value.length > 2 ? uploadFileList.value[2].url : '',
			devre4: uploadVideoList.value.length > 0 ? uploadVideoList.value[0].url : '',
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

		<wd-input disabled v-model="model.sn" label="设备编号" label-width="140rpx" placeholder="请输入设备编号" required></wd-input>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">故障现象</view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
		    <wd-textarea clearable v-model="model.fault" placeholder="请输入故障现象"></wd-textarea>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">设备二维码照片</view>
		</view>
		
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 60rpx)', margin: '0 20rpx', padding: '20rpx 0 0 20rpx', borderRadius: '20rpx' }">
		    <wd-upload accept="image" :limit="1"
		    	v-model:file-list="qrcodeFileList" image-mode="aspectFill" :upload-method="handleCustomQrcodeUploadChange"
		    	@remove="handleCustomQrcodeRemoveFileChange"></wd-upload>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">现场照片</view>
		</view>
		
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 60rpx)', margin: '0 20rpx', padding: '20rpx 0 0 20rpx', borderRadius: '20rpx' }">
		    <wd-upload accept="image" :limit="3" multiple
		    	v-model:file-list="uploadFileList" image-mode="aspectFill" :upload-method="handleCustomUploadChange"
		    	@remove="handleRemoveFileChange"></wd-upload>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">现场视频</view>
		</view>
		
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 60rpx)', margin: '0 20rpx', padding: '20rpx 0 0 20rpx', borderRadius: '20rpx' }">
		    <wd-upload accept="video" :limit="1"
		    	v-model:file-list="uploadVideoList" image-mode="aspectFill" :upload-method="handleCustomVideoUploadChange"
		    	@remove="handleRemoveVideoChange"></wd-upload>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">客户寄件类型</view>
		</view>
		
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 50rpx)', margin: '0 20rpx', padding: '5rpx', borderRadius: '20rpx' }">
			<wd-radio-group v-model="model.details" cell inline shape="dot">
				<wd-radio :value="0">仅裸机</wd-radio>
				<wd-radio :value="1">含配件</wd-radio>
			</wd-radio-group>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;" v-if="model.details === 1">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">客户寄件配件详情</view>
		</view>
		<view v-if="model.details === 1" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
		    <wd-textarea clearable v-model="model.accessory" placeholder="请输入客户寄件配件详情"></wd-textarea>
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