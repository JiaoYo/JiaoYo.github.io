<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { uploadFile } from '@/utils/uploadFile';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { fetchGetUploadFileTokenInfo, fetchGetProvinceInfo, fetchGetPrjDispatchInfo, fetchSavePrjDispatchInfo, fetchUpdatePrjDispatchInfo } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const form = ref();

const { themeVars, theme } = useTheme();

const provinceDataList = ref<any>([]);

const allProvinceDataList = ref<any>([]);

const dispatchShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

const loading = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    fuzzy: string;
    fileList: any;
    file2List: any;
    file3List: any;
    file4List: any;
}>({
    fuzzy: '',
    fileList: [],
    file2List: [],
    file3List: [],
    file4List: []
})

const model = reactive<{
    id: number | null;
    province: number;
    provinceName: string;
    region: string;
    dname: string;
    dcon: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
}>({
    id: null,
    province: 0,
    provinceName: '',
    region: '',
    dname: '',
    dcon: '',
    fl1: '',
    fl2: '',
    fl3: '',
    fl4: '',
    re1: '',
    re2: '',
    re3: '',
    re4: ''
});

const rules: FormRules = {
    provinceName: [
        {
            required: true,
            message: '请选择省份',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择省份');
                }
            }
        },
    ],
    // region: [
    //     {
    //         required: true,
    //         message: '请输入地区',
    //         validator: (value: string) => {
    //             if (value) {
    //                 return Promise.resolve();
    //             } else {
    //                 return Promise.reject('请输入地区');
    //             }
    //         }
    //     },
    // ],
    dname: [
        {
            required: true,
            message: '请输入地区',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入地区');
                }
            }
        },
    ],
    dcon: [
        {
            required: true,
            message: '请输入调度联系方式',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入调度联系方式');
                }
            }
        },
    ],
};

// 返回上个页面
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

// 清除
function handleClearChange() {
    getProvinceInfo();
}

// 搜索
function handleSearchChange() {
    getProvinceInfo();
}

// 获取省份
async function getProvinceInfo() {
    try {
        const data = await fetchGetProvinceInfo();
        if (dataForm.fuzzy) {
            provinceDataList.value = data.filter((item: any) => item.name.indexOf(dataForm.fuzzy) != -1);
        } else {
            provinceDataList.value = data;
        }
        allProvinceDataList.value = data;
    } catch (error) {
        console.log('获取省份错误', error);
    }
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    getProvinceInfo();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 打开调度信息选择弹框
async function handleLinkDispatchShowChange() {
    dispatchShow.value = true;
}

// 关闭调度信息弹框
function handleCloseChange() {
    dispatchShow.value = false;
}

// 选择调度信息(获取对应名称)
function handleRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    dispatchShow.value = false;
    // 获取对应名称
    const names = provinceDataList.value.find((item: any) => value === item.id);
    model.provinceName = names ? names.name : '';
}

// 获取主站联系人信息
async function getDispatchInfo() {
    if (!hasPermission('project:Dispatch:select')) {
        return
    }
    try {
        const data = await fetchGetPrjDispatchInfo(Number(model.id));
        model.province = data.province;
        model.provinceName = data.provinceName;
        model.dname = data.dname;
        model.dcon = data.dcon;
        model.fl1 = data.fl1;
        model.fl2 = data.fl2;
        model.fl3 = data.fl3;
        model.fl4 = data.fl4;
        model.re1 = data.re1;
        model.re2 = data.re2;
        model.re3 = data.re3;
        model.re4 = data.re4;
    } catch (error) {
        console.log('获取主站联系人信息错误', error);
    }
}

// APP上传文件(附件1)
async function handleUploadFile1ClickChange(data: any) {
	dataForm.fileList = data.length > 0 ? [data[data.length - 1]] : [];
    if (dataForm.fileList.length > 0) {
        let flag = true;
        // for (let index = 0; index < dataForm.fileList.length; index++) {
        //     if (dataForm.fileList[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            dataForm.fileList = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }
	
    dataForm.fileList.forEach(async(file: any) => {
		model.re1 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl1 = response.data;
        //     model.re1 = file.name;
        //     dataForm.fileList = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件1
async function handleRemoveFile1ClickChange() {
	model.re1 = "";
	dataForm.fileList = [];
}

// APP上传文件(附件2)
async function handleUploadFile2ClickChange(data: any) {
	dataForm.file2List = data.length > 0 ? [data[data.length - 1]] : [];
	console.log('dataForm.file2List', dataForm.file2List);
    if (dataForm.file2List.length > 0) {
        let flag = true;
        // for (let index = 0; index < dataForm.file2List.length; index++) {
        //     if (dataForm.file2List[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            dataForm.file2List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    dataForm.file2List.forEach(async(file: any) => {
		model.re2 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl2 = response.data;
        //     model.re2 = file.name;
        //     dataForm.file2List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件2
async function handleRemoveFile2ClickChange() {
	model.re2 = "";
	dataForm.file2List = [];
}

// APP上传文件(附件3)
async function handleUploadFile3ClickChange(data: any) {
	dataForm.file3List = data.length > 0 ? [data[data.length - 1]] : [];
    if (dataForm.file3List.length > 0) {
        let flag = true;
        // for (let index = 0; index < dataForm.file3List.length; index++) {
        //     if (dataForm.file3List[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            dataForm.file3List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    dataForm.file3List.forEach(async(file: any) => {
		model.re3 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl3 = response.data;
        //     model.re3 = file.name;
        //     dataForm.file3List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件3
async function handleRemoveFile3ClickChange() {
	model.re3 = "";
	dataForm.file3List = [];
}

// APP上传文件(附件4)
async function handleUploadFile4ClickChange(data: any) {
	dataForm.file4List = data.length > 0 ? [data[data.length - 1]] : [];
    if (dataForm.file4List.length > 0) {
        let flag = true;
        // for (let index = 0; index < dataForm.file4List.length; index++) {
        //     if (dataForm.file4List[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            dataForm.file4List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    dataForm.file4List.forEach(async(file: any) => {
		model.re4 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl4 = response.data;
        //     model.re4 = file.name;
        //     dataForm.file4List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件4
async function handleRemoveFile4ClickChange() {
	model.re4 = "";
	dataForm.file4List = [];
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

async function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                loading.value = true;
				const [res1, res2, res3, res4] = await Promise.all([
					handleUploadFileListChange(dataForm.fileList),
					handleUploadFileListChange(dataForm.file2List),
					handleUploadFileListChange(dataForm.file3List),
					handleUploadFileListChange(dataForm.file4List)
				]);
				model.fl1 = res1.length > 0 ? res1[0].url : '';
				model.fl2 = res2.length > 0 ? res2[0].url : '';
				model.fl3 = res3.length > 0 ? res3[0].url : '';
				model.fl4 = res4.length > 0 ? res4[0].url : '';
                try {
                    if (model.id) {
                        if (!hasPermission('project:Dispatch:update')) {
                            loading.value = false;
                            return
                        }
                        let queryParams = [{
                            id: model.id,
                            dname: model.dname,
                            dcon: model.dcon,
                            province: model.province,
                            region: model.region,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4
                        }];
                        const data = await fetchUpdatePrjDispatchInfo(queryParams);
                        uni.showToast({
                            title: '修改主站联系人成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
								dataForm.fileList = [];
								dataForm.file2List = [];
								dataForm.file3List = [];
								dataForm.file4List = [];
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        if (!hasPermission('project:Dispatch:insert')) {
                            loading.value = false;
                            return
                        }
                        let queryParams = [{
                            dname: model.dname,
                            dcon: model.dcon,
                            province: model.province,
                            region: model.region,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4
                        }];
                        const data = await fetchSavePrjDispatchInfo(queryParams);
                        uni.showToast({
                            title: '新增主站联系人成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
								dataForm.fileList = [];
								dataForm.file2List = [];
								dataForm.file3List = [];
								dataForm.file4List = [];
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    }
                } catch (err) {
                    loading.value = false;
                    if (model.id) {
                        console.error('修改主站联系人失败', err);
                    } else {
                        console.error('新增主站联系人失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    // use createSelectorQuery 获取真实高度（适配小程序/APP/H5）
    try {
        uni.createSelectorQuery()
            .select('.topFixedWrap')
            .boundingClientRect((rect: any) => {
                if (rect && rect.height !== undefined) {
                    topFixedHeight.value = rect.height;
                }
            })
            .exec();
    } catch (err) {
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad((options: any) => {
    model.id = options.id;
    getProvinceInfo();
    if (model.id) {
        getDispatchInfo();
    }
})

onReady(() => {
	recalcTopFixedHeight();
})

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
    // 可监听窗口尺寸变更（H5 情况），小屏旋转/resize 时重新计算
    try {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', recalcTopFixedHeight);
        }
    } catch (e) { /* ignore */ }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<!-- 占位：顶部固定区域高度（动态计算） -->
		<view :style="{ height: topFixedHeight + 'px' }"></view>
			
		<view class="topFixedWrap">	
			<wd-navbar left-arrow :title="model.id ? '修改主站联系人' : '新增主站联系人'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
		</view>
		
        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="调度名称" label-width="100px" prop="dname" required clearable v-model="model.dname" placeholder="请输入项目名称" />
                <wd-textarea label="调度联系方式" label-width="100px" type="textarea" prop="dcon" required clearable v-model="model.dcon" placeholder="请输入调度联系方式" />
                <wd-input label="省份" label-width="100px" prop="provinceName" required clearable disabled v-model="model.provinceName" placeholder="请选择省份">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkDispatchShowChange">省份</wd-button>
                    </template>
                </wd-input>
                <wd-textarea label="地区" label-width="100px" type="textarea" prop="region" clearable v-model="model.region" placeholder="请输入地区" />

                <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
                    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                    <view style="margin-left: 10rpx; font-weight: bolder;">文件上传</view>
                </view>

                <wd-input type="text" label="附件1" label-width="40px" v-model="model.re1" placeholder="请选择文件" center>
                    <template #suffix>
                        <view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="dataForm.fileList" @change="handleUploadFile1ClickChange">
							    <template #default>
							        <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							    </template>
							</CjxUpload>
							
							<wd-icon v-if="model.re1" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile1ClickChange"></wd-icon>
						</view>
                    </template>
                </wd-input>

                <wd-input type="text" label="附件2" label-width="40px" v-model="model.re2" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="dataForm.file2List" @change="handleUploadFile2ClickChange">
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
							<CjxUpload v-model="dataForm.file3List" @change="handleUploadFile3ClickChange">
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
							<CjxUpload v-model="dataForm.file4List" @change="handleUploadFile4ClickChange">
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

        <wd-popup closable :custom-style="`width: 80vw; margin-top: ${topFixedHeight}px;`" v-model="dispatchShow" position="left" @close="handleCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" style="height: calc(100vh - 240rpx);">
                <wd-radio-group v-model="model.province" shape="dot" @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in provinceDataList" :key="index">
                        <wd-radio :value="item.id">{{ item.name }}</wd-radio>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
	.topFixedWrap {
	    position: fixed;
	    left: 0;
	    top: 0;
	    width: 100%;
	    z-index: 999;
	    background-color: #FFFFFF;
	    /* 保证内联元素正确换行 */
	    box-sizing: border-box;
	    /* 可选：微阴影让固定区更明显 */
	    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
	}
	
	.footer {
		padding: 0 20rpx 40rpx 20rpx;
		margin-top: 40rpx;
	}

	:deep(.wd-cell__wrapper) {
		display: block !important;
	}
</style>