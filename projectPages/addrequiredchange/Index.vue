<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { uploadFile } from '@/utils/uploadFile';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetUploadFileTokenInfo, fetchGetPrjCustomerInfo, fetchSavePrjCustomerInfo, fetchUpdatePrjCustomerInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const form = ref();
const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const prjForm = reactive({
    id: null,
    requiredChangeId: null
})

const model = reactive<{
    reqcontent: string;
    customer: string;
    cstcontact: string;
    cstresult: string;
    notes: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    fileList: any;
    file2List: any;
    file3List: any;
    file4List: any;
}>({
    reqcontent: '',
    customer: '',
    cstcontact: '',
    cstresult: '',
    notes: '',
    re1: '',
    re2: '',
    re3: '',
    re4: '',
    fl1: '',
    fl2: '',
    fl3: '',
    fl4: '',
    fileList: [],
    file2List: [],
    file3List: [],
    file4List: []
});

const rules: FormRules = {
    reqcontent: [
        {
            required: true,
            message: '请输入需求内容',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入需求内容');
                }
            }
        },
    ],
    customer: [
        {
            required: true,
            message: '请输入客户联系人',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入客户联系人');
                }
            }
        },
    ],
    cstcontact: [
        {
            required: false,
            message: '请输入客户联系方式',
            validator: (value: string) => {
                if (value) {
                    // if (!/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(value)) {
                    //     return Promise.reject('请输入正确的联系方式');
                    // } else {
                    //     return Promise.resolve();
                    // }
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入客户联系方式');
                }
            }
        },
    ]
};

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshList'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取客户需求变更详情
async function getDebugBusinessInfo() {
    const data = await fetchGetPrjCustomerInfo(Number(prjForm.requiredChangeId));
    model.reqcontent = data.reqcontent;
    model.customer = data.customer;
    model.cstcontact = data.cstcontact;
    model.cstresult = data.cstresult;
    model.notes = data.notes;
    model.re1 = data.re1;
    model.re2 = data.re2;
    model.re3 = data.re3;
    model.re4 = data.re4;
    model.fl1 = data.fl1;
    model.fl2 = data.fl2;
    model.fl3 = data.fl3;
    model.fl4 = data.fl4;
}

// APP上传文件(附件1)
async function handleUploadFile1ClickChange(data: any) {
	model.fileList = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.fileList.length > 0) {
        let flag = true;
        for (let index = 0; index < model.fileList.length; index++) {
            if (model.fileList[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.fileList = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    model.fileList.forEach(async(file: any) => {
		model.re1 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl1 = response.data;
        //     model.re1 = file.name;
        //     model.fileList = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件1
async function handleRemoveFileClickChange() {
	model.re1 = "";
	model.fileList = [];
}

// APP上传文件(附件2)
async function handleUploadFile2ClickChange(data: any) {
	model.file2List = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.file2List.length > 0) {
        let flag = true;
        for (let index = 0; index < model.file2List.length; index++) {
            if (model.file2List[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.file2List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    model.file2List.forEach(async(file: any) => {
		model.re2 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl2 = response.data;
        //     model.re2 = file.name;
        //     model.file2List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件2
async function handleRemoveFile2ClickChange() {
	model.re2 = "";
	model.file2List = [];
}

// APP上传文件(附件3)
async function handleUploadFile3ClickChange(data: any) {
	model.file3List = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.file3List.length > 0) {
        let flag = true;
        for (let index = 0; index < model.file3List.length; index++) {
            if (model.file3List[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.file3List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    model.file3List.forEach(async(file: any) => {
		model.re3 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl3 = response.data;
        //     model.re3 = file.name;
        //     model.file3List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件3
async function handleRemoveFile3ClickChange() {
	model.re3 = "";
	model.file3List = [];
}

// APP上传文件(附件4)
async function handleUploadFile4ClickChange(data: any) {
	model.file4List = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.file4List.length > 0) {
        let flag = true;
        for (let index = 0; index < model.file4List.length; index++) {
            if (model.file4List[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.file4List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    model.file4List.forEach(async(file: any) => {
		model.re4 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl4 = response.data;
        //     model.re4 = file.name;
        //     model.file4List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件4
async function handleRemoveFile4ClickChange() {
	model.re4 = "";
	model.file4List = [];
}

/**
 * 上传一组文件，确保最终每个 file 都有 url
 */
function handleUploadFileListChange(fileList: any[]): Promise<any[]> {
	if (!fileList || fileList.length === 0) {
		return Promise.resolve([]);
	}

	const tasks = fileList.map(file => {
		// 跳过无效文件
		if (!file) return Promise.resolve(file);

		// 已是线上地址，直接跳过
		if (file.url && file.url.startsWith('https://pictures.linkqi.cn')) {
			return Promise.resolve(file);
		}

		// 需要上传
		return new Promise(resolve => {
			uploadFile(
				file,
				'',
				(response, f) => {
					f.url = response.data;
					resolve(f);
				},
				(error, f) => {
					console.error('上传失败:', error);
					resolve(f); // ⚠️ 不 reject，保证后续还能执行
				}
			);
		});
	});

	return Promise.all(tasks);
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
				const [res1, res2, res3, res4] = await Promise.all([
					handleUploadFileListChange(model.fileList),
					handleUploadFileListChange(model.file2List),
					handleUploadFileListChange(model.file3List),
					handleUploadFileListChange(model.file4List)
				]);
				model.fl1 = res1.length > 0 ? res1[0].url : '';
				model.fl2 = res2.length > 0 ? res2[0].url : '';
				model.fl3 = res3.length > 0 ? res3[0].url : '';
				model.fl4 = res4.length > 0 ? res4[0].url : '';
                loading.value = true;
                try {
                    if (prjForm.requiredChangeId) {
                        let queryParams = [{
                            id: prjForm.requiredChangeId,
                            pid: prjForm.id,
                            reqcontent: model.reqcontent,
                            customer: model.customer,
                            cstcontact: model.cstcontact,
                            cstresult: model.cstresult,
                            notes: model.notes,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4
                        }];
                        const data = await fetchUpdatePrjCustomerInfo(queryParams);
                        uni.showToast({
                            title: '修改客户需求变更成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
								model.fileList = [];
								model.file2List = [];
								model.file3List = [];
								model.file4List = [];
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            pid: prjForm.id,
                            reqcontent: model.reqcontent,
                            customer: model.customer,
                            cstcontact: model.cstcontact,
                            cstresult: model.cstresult,
                            notes: model.notes,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4
                        }];
                        const data = await fetchSavePrjCustomerInfo(queryParams);
                        uni.showToast({
                            title: '新增客户需求变更成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
								model.fileList = [];
								model.file2List = [];
								model.file3List = [];
								model.file4List = [];
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    }
                } catch (err) {
                    loading.value = false;
                    if (prjForm.requiredChangeId) {
                        console.error('修改客户需求变更失败', err);
                    } else {
                        console.error('新增客户需求变更失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

onLoad((options: any) => {
    prjForm.id = options.pid;
    prjForm.requiredChangeId = options.id;
    if (prjForm.requiredChangeId) {
        getDebugBusinessInfo();
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="prjForm.requiredChangeId ? '修改客户需求变更' : '新增客户需求变更'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="需求内容" label-width="100px" prop="reqcontent" required clearable v-model="model.reqcontent" placeholder="请输入需求内容" />
                <wd-input label="客户联系人" label-width="100px" prop="customer" clearable v-model="model.customer" placeholder="请输入客户联系人" />
                <wd-input label="客户联系方式" label-width="100px" prop="cstcontact" clearable v-model="model.cstcontact" placeholder="请输入客户联系方式" />
                <wd-input label="结果" label-width="100px" prop="cstresult" clearable v-model="model.cstresult" placeholder="请输入结果" />
                <wd-textarea label="备注" label-width="100px" type="textarea" prop="notes" clearable v-model="model.notes" placeholder="请输入备注" />
                <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
                    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                    <view style="margin-left: 10rpx; font-weight: bolder;">文件上传</view>
                </view>
                <wd-input type="text" label="附件1" label-width="40px" v-model="model.re1" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="model.fileList" @change="handleUploadFile1ClickChange">
								<template #default>
									<wd-button icon="cloud-upload" size="small">上传文件</wd-button>
								</template>
							</CjxUpload>
							
							<wd-icon v-if="model.re1" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFileClickChange"></wd-icon>
						</view>
                    </template>
                </wd-input>

                <wd-input type="text" label="附件2" label-width="40px" v-model="model.re2" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="model.file2List" @change="handleUploadFile2ClickChange">
								<template #default>
									<wd-button icon="cloud-upload" size="small">上传文件</wd-button>
								</template>
							</CjxUpload>
							
							<wd-icon v-if="model.re2" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile2ClickChange"></wd-icon>
						</view>	
                    </template>
                </wd-input>

                <wd-input type="text" label="附件3" label-width="40px" v-model="model.re3" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="model.file3List" @change="handleUploadFile3ClickChange">
								<template #default>
									<wd-button icon="cloud-upload" size="small">上传文件</wd-button>
								</template>
							</CjxUpload>
							
							<wd-icon v-if="model.re3" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile3ClickChange"></wd-icon>
						</view>
                    </template>
                </wd-input>

                <wd-input type="text" label="附件4" label-width="40px" v-model="model.re4" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="model.file4List" @change="handleUploadFile4ClickChange">
								<template #default>
									<wd-button icon="cloud-upload" size="small">上传文件</wd-button>
								</template>
							</CjxUpload>
							
							<wd-icon v-if="model.re4" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile4ClickChange"></wd-icon>
						</view>
                    </template>
                </wd-input>
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