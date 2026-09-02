<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref, onMounted, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetUploadFileTokenInfo, fetchGetDebugEquipmentInfo, fetchSaveDebugEquipmentInfo, fetchUpdateDebugEquipmentInfo, fetchGetContractsPageByPrjId, fetchGetPrjDeviceDataList } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';
import opCascader from '@/uni_modules/op-cascader/components/op-cascader/op-cascader.vue';

const form = ref();

const { themeVars, theme } = useTheme();

const message = useMessage();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const prjForm = reactive({
    id: null,
    debugEquipmentId: null
})

const deviceShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    total: number;
    fuzzy: string;
    checkedDev: any;
    deviceDataList: any;
}>({
    page: 1,
    total: 0,
    fuzzy: '',
    checkedDev: null,
    deviceDataList: []
})

const contractDataList = ref<any>([]);

const selectAll = ref<any>([]);

const props = { label: 'label', value: 'value', children: 'children'};

const statusList = ref<any[]>([
    {
        label: '未清点',
        value: 0
    },
    {
        label: '正常',
        value: 1
    },
    {
        label: '增补',
        value: 2
    },
    {
        label: '退货',
        value: 3
    },
    {
        label: '换货',
        value: 4
    }
]);

const devStatusList = ref<any[]>([
    {
        label: '正常',
        value: 0
    },
    {
        label: '异常',
        value: 1
    },
    {
        label: '未知',
        value: 2
    }
]);

const model = reactive<{
    devname: string;
    devname2: string;
    devmodel: string;
    devnum: number;
    devunit: string;
    notes: string;
    etype: number;
    devmanu: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    defaultStatus: number;
    status: number;
	install: number;
	connectionmode: string;
	devstatus: number;
	manucontact: string;
	manuinfo: string;
    fileList: any;
    file2List: any;
    file3List: any;
    file4List: any;
}>({
    devname: '',
    devname2: '',
    devmodel: '',
    devnum: 1,
    devunit: '',
    notes: '',
    etype: 0,
    devmanu: '',
    re1: '',
    re2: '',
    re3: '',
    re4: '',
    fl1: '',
    fl2: '',
    fl3: '',
    fl4: '',
    defaultStatus: 0,
    status: 0,
	install: 0,
	connectionmode: '',
	devstatus: 0,
	manucontact: '',
	manuinfo: '',
    fileList: [],
    file2List: [],
    file3List: [],
    file4List: []
});

const rules: FormRules = {
    devname: [
        {
            required: true,
            message: '请输入设备名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入设备名称');
                }
            }
        },
    ],
	devname2: [
        {
            required: true,
            message: '请输入合同设备名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入合同设备名称');
                }
            }
        },
    ],
    devnum: [
        {
            required: true,
            message: '请输入数量',
            type: 'number'
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

// 打开合同设备信息
function handleLinkDeviceShowChange() {
    deviceShow.value = true;
}

// 关闭合同设备信息
function handleDeviceCloseChange() {
    deviceShow.value = false;
}

// 获取合同数据源
async function getPrjContractDataList() {
    try {
        let queryParams: any = {
            page: 1,
            limit: 100,
            id: prjForm.id
        };
        const data = await fetchGetContractsPageByPrjId(queryParams);
        contractDataList.value = data.list.length > 0 ? data.list.map((item: any) => {
            return {
                label: item.contractname,
                value: item.id,
                children: []
            }
        }) : [];
        dataForm.page = 1;
        getPrjDeviceDataList();
    } catch (error) {
        console.log('获取合同设备数据源设备', error);
    }
}

// 获取合同设备数据源
async function getPrjDeviceDataList() {
    if (dataForm.page === 1) {
        dataForm.deviceDataList = [];
    }
    try {
        let queryParams: any = {
            page: dataForm.page,
            limit: 100
        };
        if (contractDataList.value.length > 0) {
            queryParams['pids'] = contractDataList.value.map((item: any) => item.value).filter((id: any) => id !== null && id !== undefined).join(',');
        }
        const data = await fetchGetPrjDeviceDataList(queryParams);
        dataForm.deviceDataList = dataForm.deviceDataList.concat(data.list);
        dataForm.total = Number(data.total);
        contractDataList.value.forEach((item: any) => {
            // 清空已有的 children
            item.children = [];
             // 查找所有 pid 等于当前 item.value 的子项
            dataForm.deviceDataList.forEach((child: any) => {
                if (child.pid === item.value) {
                    item.children.push({
                        label: child.devname,
                        value: child.id
                    });
                }
                if (prjForm.debugEquipmentId && dataForm.checkedDev == child.id) {
                    selectAll.value = [child.pid, dataForm.checkedDev];
                }
            });
        });
    } catch (error) {
        console.log('获取合同设备数据源设备', error);
    }
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    getPrjDeviceDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && dataForm.deviceDataList.length < dataForm.total) {
        dataForm.page++;
        getPrjDeviceDataList();
    }
}

// 选择合同设备
function handleRadioSelectChange(data: any) {
    if (data.length > 1) {
        dataForm.checkedDev = data[1];
        const deviceObj = dataForm.deviceDataList.find((item: any) => data[1] === item.id);
        model.devname = deviceObj ? deviceObj.devname : '';
        model.devname2 = deviceObj ? deviceObj.devname : '';
        model.devmodel = deviceObj ? deviceObj.devmodel : '';
        model.etype = deviceObj ? deviceObj.devtype : 0;
        model.devmanu = deviceObj ? deviceObj.devmanu : '';
        model.notes = deviceObj ? deviceObj.notes : '';
        model.devnum = deviceObj ? deviceObj.devcount || 1 : 1;
        model.devunit = deviceObj ? deviceObj.devunit || '' : '';
        deviceShow.value = false;
    } else {
        dataForm.checkedDev = null;
        const deviceObj: any = null;
        model.devname = deviceObj ? deviceObj.devname : '';
        model.devname2 = deviceObj ? deviceObj.devname : '';
        model.devmodel = deviceObj ? deviceObj.devmodel : '';
        model.etype = deviceObj ? deviceObj.devtype : 0;
        model.devmanu = deviceObj ? deviceObj.devmanu : '';
        model.notes = deviceObj ? deviceObj.notes : '';
        model.devnum = deviceObj ? deviceObj.devcount || 1 : 1;
        model.devunit = deviceObj ? deviceObj.devunit || '' : '';
    }
}
// function handleRadioSelectChange({ value }: { value: any }) {
//     const deviceObj = dataForm.deviceDataList.find((item: any) => value === item.id);
//     model.devname = deviceObj ? deviceObj.devname : '';
//     model.devname2 = deviceObj ? deviceObj.devname : '';
//     model.devmodel = deviceObj ? deviceObj.devmodel : '';
//     model.etype = deviceObj ? deviceObj.devtype : 0;
//     model.devmanu = deviceObj ? deviceObj.devmanu : '';
//     model.notes = deviceObj ? deviceObj.notes : '';
//     model.devnum = deviceObj ? deviceObj.devcount || 1 : 1;
//     model.devunit = deviceObj ? deviceObj.devunit || '' : '';
//     deviceShow.value = false;
// }

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

    model.file2List .forEach(async(file: any) => {
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

// 获取调试设备详细信息
async function getDebugEquipmentInfo() {
    try {
        const data = await fetchGetDebugEquipmentInfo(Number(prjForm.debugEquipmentId));
        model.devname = data.devname;
        model.devmodel = data.devmodel;
        model.devnum = data.devnum;
        model.devunit = data.devunit;
        model.notes = data.notes;
        model.etype = data.etype;
        model.devmanu = data.devmanu;
        model.status = data.status;
        model.defaultStatus = data.status;
        model.re1 = data.re1;
        model.re2 = data.re2;
        model.re3 = data.re3;
        model.re4 = data.re4;
        model.fl1 = data.fl1;
        model.fl2 = data.fl2;
        model.fl3 = data.fl3;
        model.fl4 = data.fl4;
        model.devname2 = data.devname2;
        dataForm.fuzzy = data.devname2;
        dataForm.checkedDev = data.cid;
		getPrjContractDataList();
    } catch (error) {
        console.error('获取调试设备详细信息失败', error);
    }
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
                    if (prjForm.debugEquipmentId) {
                        let queryParams = model.defaultStatus === Number(model.status) ? [{
                            id: prjForm.debugEquipmentId,
                            cid: dataForm.checkedDev,
                            pid: prjForm.id,
                            devname: model.devname,
                            devname2: model.devname2,
                            devmodel: model.devmodel,
                            devnum: model.devnum,
                            devunit: model.devunit,
                            notes: model.notes,
                            etype: model.etype,
                            devmanu: model.devmanu,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4
                        }] : [{
                            id: prjForm.debugEquipmentId,
                            pid: prjForm.id,
                            cid: dataForm.checkedDev,
                            devname: model.devname,
                            devname2: model.devname2,
                            devmodel: model.devmodel,
                            devnum: model.devnum,
                            devunit: model.devunit,
                            notes: model.notes,
                            etype: model.etype,
                            devmanu: model.devmanu,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4,
                            status: model.status
                        }];
                        message
                        .confirm({
                            msg: '确定要修改调试设备吗？',
                            title: '提示',
                            confirmButtonProps: {
                                type: 'error',
                            },
                        })
                        .then(async () => {
                            const data = await fetchUpdateDebugEquipmentInfo(queryParams);
                            uni.showToast({
                                title: '修改调试设备成功',
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
                        })
                        .catch(() => {
                            console.log('点击了取消按钮');
                            loading.value = false;
                        });
                    } else {
                        let queryParams = [{
                            pid: prjForm.id,
                            cid: dataForm.checkedDev,
                            devname: model.devname,
                            devname2: model.devname2,
                            devmodel: model.devmodel,
                            devnum: model.devnum,
                            devunit: model.devunit,
                            notes: model.notes,
                            etype: model.etype,
                            devmanu: model.devmanu,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4
                        }];
                        const data = await fetchSaveDebugEquipmentInfo(queryParams);
                        uni.showToast({
                            title: '新增调试设备成功',
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
                    if (prjForm.debugEquipmentId) {
                        console.error('修改调试设备失败', err);
                    } else {
                        console.error('新增调试设备失败', err);
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
    prjForm.id = options.pid;
    prjForm.debugEquipmentId = options.id;
    if (prjForm.debugEquipmentId) {
        getDebugEquipmentInfo();
    } else {
		getPrjContractDataList();
    }
});

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
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow :title="prjForm.debugEquipmentId ? '修改调试设备' : '新增调试设备'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="设备名称" label-width="100px" prop="devname" clearable v-model="model.devname" placeholder="请选择设备" center>
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkDeviceShowChange">设备信息</wd-button>
                    </template>
                </wd-input>
                <wd-input label="合同设备名称" label-width="100px" prop="devname2" required disabled v-model="model.devname2" placeholder="请输入合同设备名称" />
                <wd-input label="型号" label-width="100px" prop="docker" clearable disabled v-model="model.devmodel" placeholder="请输入型号" />
                <wd-input label="数量" label-width="100px" type="number" prop="devnum" required clearable v-model="model.devnum" placeholder="请输入数量" />
                <wd-input label="单位" label-width="100px" prop="devunit" clearable v-model="model.devunit" placeholder="请输入单位" />
                <wd-cell title="是否为我司设备" center>
                    <wd-radio-group inline v-model="model.etype" shape="dot" cell disabled>
                        <wd-radio :value="0">是</wd-radio>
                        <wd-radio :value="1">否</wd-radio>
                    </wd-radio-group>
                </wd-cell>
                <wd-input label="设备厂家" label-width="100px" prop="devmanu" clearable disabled v-model="model.devmanu" placeholder="请输入设备厂家" />
                <wd-select-picker v-if="prjForm.debugEquipmentId" label="清点状态" label-width="100px" prop="status" v-model="model.status" :show-confirm="false" :columns="statusList" type="radio" :z-index="100" placeholder="请选择项目类型" />
                <wd-cell title="是否安装就位" center>
					<wd-radio-group inline v-model="model.install" shape="dot" cell>
						<wd-radio :value="0">是</wd-radio>
						<wd-radio :value="1">否</wd-radio>
					</wd-radio-group>
				</wd-cell>
				<wd-input label="接线方式" label-width="100px" prop="connectionmode" clearable v-model="model.connectionmode" placeholder="请输入接线方式" />
				<wd-select-picker label="设备状态" label-width="100px" prop="devstatus" v-model="model.devstatus" :show-confirm="false" :columns="devStatusList" type="radio" :z-index="100" placeholder="请选择设备状态" />
				<wd-input label="厂家联系人" label-width="100px" prop="manucontact" clearable v-model="model.manucontact" placeholder="请输入厂家联系人" />
				<wd-input label="厂家联系方式" label-width="100px" prop="manuinfo" clearable v-model="model.manuinfo" placeholder="请输入厂家联系方式" />
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

        <!-- <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="deviceShow" position="left" @close="handleDeviceCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-radio-group v-model="dataForm.checkedDev" shape="dot" @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in dataForm.deviceDataList" :key="index" custom-class="radioCellWrap">
                        <wd-radio :value="item.id">{{ item.devname }}</wd-radio>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup> -->
		<wd-popup closable v-model="deviceShow" position="bottom" @close="handleDeviceCloseChange">
			<wd-gap height="70rpx" />

			<opCascader v-model="selectAll" :isDark="isDark" :option="contractDataList" :props="props" :iconShow="true" maxHeight="800rpx" @change="handleRadioSelectChange"></opCascader>
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

.radioCellWrap {
    :deep(.wd-cell__wrapper) {
        display: block !important;
    }
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

:deep(.wd-input__suffix) {
	display: flex !important;
	align-items: center !important;
	gap: 0 10rpx !important;
}
</style>