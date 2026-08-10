<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { nextTick, reactive, ref, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAftersaleCompInfo, fetchUpdateAftersaleCompInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';
import district from '@/json/china.json';
import { uploadFile } from '@/utils/uploadFile';
import { CodeToText, TextToCode } from 'element-china-area-data';
import type { UploadMethod, UploadFile } from '@/uni_modules/wot-design-uni/components/wd-upload/types';

const form = ref();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const loading = ref<boolean>(false);

const uploadFileList = ref<any[]>([]);

const uploadSendFileList = ref<any[]>([]);

const cascaderVisible = ref<boolean>(true);

// const regionProvinceCityAreaDataList = ref([district[0], district[district[0][0].value], district[district[district[0][0].value][0].value]]);
const regionProvinceCityAreaDataList = ref([]);

const model = reactive<{
    id: number | null;
	comp: string;
	contact: string;
	contactinfo: string;
	project: string;
	dock: string;
	notes: string;
	rcontact: string;
	rcontactinfo: string;
	receipt: string;
	raddress: string;
	regionValue: any;
}>({
    id: null,
	comp: '',
	contact: '',
	contactinfo: '',
	project: '',
	dock: '',
	notes: '',
	rcontact: '',
	rcontactinfo: '',
	receipt: '',
	raddress: '',
	regionValue: []
});

const rules: FormRules = {
    comp: [
        {
            required: true,
            message: '请输入贵司名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入贵司名称');
                }
            }
        },
    ],
	contact: [
	    {
	        required: true,
	        message: '请输入联系人',
	        validator: (value: string) => {
	            if (value) {
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入联系人');
	            }
	        }
	    },
	],
	contactinfo: [
	    {
	        required: true,
	        message: '请输入联系方式',
	        validator: (value: string) => {
	            if (value) {
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入联系方式');
	            }
	        }
	    },
	],
	project: [
	    {
	        required: true,
	        message: '请输入项目名称',
	        validator: (value: string) => {
	            if (value) {
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入项目名称');
	            }
	        }
	    },
	],
	dock: [
	    {
	        required: true,
	        message: '请输入对接工程师',
	        validator: (value: string) => {
	            if (value) {
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入对接工程师');
	            }
	        }
	    },
	],
};

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListAftersale', model); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取售后基本信息
async function getAfterSalesCompInfo() {
    try {
        const data = await fetchGetAftersaleCompInfo(Number(model.id));
        model.comp = data.comp;
        model.contact = data.contact;
		model.contactinfo = data.contactinfo;
		model.project = data.project;
		model.dock = data.dock;
		model.notes = data.notes;
		model.rcontact = data.rcontact;
		model.rcontactinfo = data.rcontactinfo;
		uploadFileList.value = [data.re1, data.re2, data.re3].filter(src => src).map(imageItem => {
			return {
				url: imageItem
			}
		});
		uploadSendFileList.value = [data.re4, data.re5, data.re6].filter(src => src).map(imageItem => {
			return {
				url: imageItem
			}
		});
		try {
			let raddressInfo = JSON.parse(data.raddress),
				cC = raddressInfo.pC === "810000" ? "819999" : raddressInfo.pC === "820000" ? "829999" : raddressInfo.cC,
				dC = raddressInfo.pC === "810000" || raddressInfo.pC === "820000" ? raddressInfo.cC : raddressInfo.dC;
			model.raddress = raddressInfo.raddress;
			model.regionValue = raddressInfo.pC && cC && dC ? [raddressInfo.pC, cC, dC] : [];
			if (model.regionValue.length > 0) {
				regionProvinceCityAreaDataList.value = [district[0], district[raddressInfo.pC], district[cC]];
			} else {
				regionProvinceCityAreaDataList.value = [district[0], district[district[0][0].value], district[district[district[0][0].value][0].value]];
			}
		} catch (error1) {
			//TODO handle the exception
			console.log('error1', error1);
			model.raddress = data.raddress;
			model.regionValue = [];
			regionProvinceCityAreaDataList.value = [district[0], district[district[0][0].value], district[district[district[0][0].value][0].value]];
		}
    } catch (error) {
        console.log('获取售后基本信息错误', error);
    }
}

const onChangeDistrict = (pickerView: any, value: any, columnIndex: any, resolve: any) => {
	console.log('value', value);
	const item = value[columnIndex];
	if (columnIndex === 0) {
		pickerView.setColumnData(1, district[item.value])
		pickerView.setColumnData(2, district[district[item.value][0].value])
	} else if (columnIndex === 1) {
		pickerView.setColumnData(2, district[item.value])
	}
	resolve()
}

// 确定省市区
function handleConfirmChange({ value }) {
	console.log('value', value);
	console.log(CodeToText[value[0]]);
} 

const handleCustomUploadChange: UploadMethod = (file: any, formData: any, options: any) => {
	// file.status = "success";
	// uploadFileList.value.push(file);
	options.onSuccess(file.url, file, formData);
}

const handleRemoveFileChange = (e: any) => {
	console.log('e', e);
	// uploadFileList.value = uploadFileList.value.filter((item: any) => item.uid !== e.file.uid);
}

const handleCustomUploadSendFileChange: UploadMethod = (file: any, formData: any, options: any) => {
	// file.status = "success";
	// uploadSendFileList.value.push(file);
	options.onSuccess(file.url, file, formData);
}

const handleRemoveSendFileChange = (e: any) => {
	console.log('e', e);
	// uploadSendFileList.value = uploadSendFileList.value.filter((item: any) => item.uid !== e.file.uid);
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
				if (model.regionValue.length === 0) {
					uni.showToast({
						icon: "none",
						title: "请选择省市区",
						duration: 1500
					})
					return false
				}
				loading.value = true;
				const uploadPromises = uploadFileList.value.map(async(file: any) => {
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
				
				const uploadSendPromises = uploadSendFileList.value.map(async(file: any) => {
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
				
				try {
					await Promise.all(uploadPromises, uploadSendPromises);
					let regionValueJson = {
						pC: model.regionValue[0],
						pN: CodeToText[model.regionValue[0]],
						cC: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? model.regionValue[2] : model.regionValue[1],
						cN: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? CodeToText[model.regionValue[2]] : CodeToText[model.regionValue[1]],
						dC: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? '' : model.regionValue[2],
						dN: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? '' : CodeToText[model.regionValue[2]],
					};
					let queryParams = [{
						id: model.id,
						comp: model.comp,
						contact: model.contact,
						contactinfo: model.contactinfo,
						dock: model.dock,
						project: model.project,
						raddress: JSON.stringify({...regionValueJson, raddress:model.raddress}),
						rcontact: model.rcontact,
						rcontactinfo: model.rcontactinfo,
						receipt: model.receipt,
						notes: model.notes,
						re1: uploadFileList.value.length > 0 ? uploadFileList.value[0].url : null,
						re2: uploadFileList.value.length > 1 ? uploadFileList.value[1].url : null,
						re3: uploadFileList.value.length > 2 ? uploadFileList.value[2].url : null,
						re4: uploadSendFileList.value.length > 0 ? uploadSendFileList.value[0].url : null,
						re5: uploadSendFileList.value.length > 1 ? uploadSendFileList.value[1].url : null,
						re6: uploadSendFileList.value.length > 2 ? uploadSendFileList.value[2].url : null
					}];
					const data = await fetchUpdateAftersaleCompInfo(queryParams);
					uni.showToast({
						title: '修改售后信息成功',
						icon: 'none',
						duration: 1500,
						complete: () => {
							loading.value = false;
							handleClickLeft(true);
						}
					});
				} catch (err) {
					loading.value = false;
					console.error('修改售后信息失败', err);
				}
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

onLoad((options: any) => {
    model.id = options.id;
	getAfterSalesCompInfo();
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="修改" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="贵司名称" label-width="100px" prop="comp" required clearable v-model="model.comp" placeholder="请输入贵司名称" />
				<wd-input label="联系人" label-width="100px" prop="contact" required clearable v-model="model.contact" placeholder="请输入联系人" />
				<wd-input label="联系方式" label-width="100px" prop="contactinfo" required clearable v-model="model.contactinfo" placeholder="请输入联系方式" />
				<wd-input label="项目名称" label-width="100px" prop="project" required clearable v-model="model.project" placeholder="请输入项目名称" />
                <wd-input label="对接工程师" label-width="100px" prop="dock" required clearable v-model="model.dock" placeholder="请输入对接的厂家工程师, 例如林工" />
				<wd-textarea label="备注" label-width="100px" type="textarea" prop="notes" clearable v-model="model.notes" placeholder="请输入备注" />
				<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
				    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
				    <view style="margin-left: 10rpx; font-weight: bolder;">客户寄出照片</view>
				</view>
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '20rpx 0 0 20rpx' }">
				    <wd-upload accept="image" :limit="3" multiple
				    	v-model:file-list="uploadFileList" image-mode="aspectFill" :upload-method="handleCustomUploadChange"
				    	@remove="handleRemoveFileChange"></wd-upload>
				</view>
				<wd-input label="客户寄出信息" label-width="100px" prop="receipt" clearable v-model="model.receipt" placeholder="请输入客户寄出信息" />
				<wd-gap height="2rpx"></wd-gap>
				<view style="margin: 10rpx 0 10rpx 10rpx;">
					<wd-text bold text="* 您的收件信息(售后完成时的回寄地址)" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</view>
				<wd-input label="联系人" label-width="100px" prop="rcontact" required clearable v-model="model.rcontact" placeholder="请输入联系人" :rules="[{ required: true, message: '请输入联系人' }]" />
				<wd-input label="联系方式" label-width="100px" prop="rcontactinfo" required clearable v-model="model.rcontactinfo" placeholder="请输入联系方式" :rules="[{ required: true, message: '请输入联系方式' }]" />
				<wd-picker required :columns="regionProvinceCityAreaDataList" label="省市区" label-width="100px" v-model="model.regionValue" :column-change="onChangeDistrict" @confirm="handleConfirmChange" :rules="[{ required: true, message: '请选择省市区' }]" />
				<wd-textarea label="详细地址" label-width="100px" type="textarea" prop="raddress" clearable v-model="model.raddress" placeholder="请输入详细地址" :rules="[{ required: true, message: '请输入详细地址' }]" />
				<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
				    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
				    <view style="margin-left: 10rpx; font-weight: bolder;">寄出照片</view>
				</view>
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '20rpx 0 0 20rpx' }">
				    <wd-upload accept="image" :limit="3" multiple
				    	v-model:file-list="uploadSendFileList" image-mode="aspectFill" :upload-method="handleCustomUploadSendFileChange"
				    	@remove="handleRemoveSendFileChange"></wd-upload>
				</view>
				<view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}
</style>