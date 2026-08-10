<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetUploadFileTokenInfo, fetchGetDebugEquipmentInfo, fetchSaveDebugEquipmentInfo, fetchUpdateDebugEquipmentInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const form = ref();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const prjForm = reactive({
    id: null,
    debugEquipmentId: null
})

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

const model = reactive<{
    devname: string;
    devmodel: string;
    devnum: number;
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
    fileList: any;
    file2List: any;
    file3List: any;
    file4List: any;
}>({
    devname: '',
    devmodel: '',
    devnum: 1,
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

// APP上传文件(附件1)
async function handleUploadFile1ClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        // for (let index = 0; index < data.length; index++) {
        //     if (data[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
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

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.fl1 = response.data;
            model.re1 = file.name;
            model.fileList = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件2)
async function handleUploadFile2ClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        // for (let index = 0; index < data.length; index++) {
        //     if (data[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
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

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.fl2 = response.data;
            model.re2 = file.name;
            model.file2List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件3)
async function handleUploadFile3ClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        // for (let index = 0; index < data.length; index++) {
        //     if (data[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
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

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.fl3 = response.data;
            model.re3 = file.name;
            model.file3List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件4)
async function handleUploadFile4ClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        // for (let index = 0; index < data.length; index++) {
        //     if (data[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
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

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.fl4 = response.data;
            model.re4 = file.name;
            model.file4List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// 获取调试设备详细信息
async function getDebugEquipmentInfo() {
    try {
        const data = await fetchGetDebugEquipmentInfo(Number(prjForm.debugEquipmentId));
        model.devname = data.devname;
        model.devmodel = data.devmodel;
        model.devnum = data.devnum;
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
                try {
                    if (prjForm.debugEquipmentId) {
                        let queryParams = model.defaultStatus === Number(model.status) ? [{
                            id: prjForm.debugEquipmentId,
                            pid: prjForm.id,
                            devname: model.devname,
                            devmodel: model.devmodel,
                            devnum: model.devnum,
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
                            devname: model.devname,
                            devmodel: model.devmodel,
                            devnum: model.devnum,
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
                                    handleClickLeft(true);
                                }
                            });
                        })
                        .catch(() => {
                            console.log('点击了取消按钮');
                        });
                    } else {
                        let queryParams = [{
                            pid: prjForm.id,
                            devname: model.devname,
                            devmodel: model.devmodel,
                            devnum: model.devnum,
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
                                handleClickLeft(true);
                            }
                        });
                    }
                } catch (err) {
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

onLoad((options: any) => {
    prjForm.id = options.pid;
    prjForm.debugEquipmentId = options.id;
    if (prjForm.debugEquipmentId) {
        getDebugEquipmentInfo();
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="prjForm.debugEquipmentId ? '修改调试设备' : '新增调试设备'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="设备名称" label-width="100px" prop="devname" required clearable v-model="model.devname" placeholder="请输入设备名称" />
                <wd-input label="型号" label-width="100px" prop="docker" clearable v-model="model.devmodel" placeholder="请输入型号" />
                <wd-input label="数量" label-width="100px" type="number" prop="devnum" required clearable v-model="model.devnum" placeholder="请输入数量" />
                <wd-cell title="是否为我司设备" center>
                    <wd-radio-group inline v-model="model.etype" shape="dot" cell>
                        <wd-radio :value="0">是</wd-radio>
                        <wd-radio :value="1">否</wd-radio>
                    </wd-radio-group>
                </wd-cell>
                <wd-input label="设备厂家" label-width="100px" prop="devmanu" clearable v-model="model.devmanu" placeholder="请输入设备厂家" />
                <wd-select-picker v-if="prjForm.debugEquipmentId" label="清点状态" label-width="100px" prop="status" v-model="model.status" :show-confirm="false" :columns="statusList" type="radio" :z-index="100" placeholder="请选择项目类型" />
                <wd-textarea label="备注" label-width="100px" type="textarea" prop="notes" clearable v-model="model.notes" placeholder="请输入备注" />
                <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
                    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                    <view style="margin-left: 10rpx; font-weight: bolder;">文件上传</view>
                </view>

                <wd-input type="text" label="附件1" label-width="40px" v-model="model.re1" placeholder="请选择文件" center>
                    <template #suffix>
                        <CjxUpload v-model="model.fileList" :limit="1" @change="handleUploadFile1ClickChange">
                            <template #default>
                                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
                            </template>
                        </CjxUpload>
                    </template>
                </wd-input>

                <wd-input type="text" label="附件2" label-width="40px" v-model="model.re2" placeholder="请选择文件" center>
                    <template #suffix>
                        <CjxUpload v-model="model.file2List" :limit="1" @change="handleUploadFile2ClickChange">
                            <template #default>
                                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
                            </template>
                        </CjxUpload>
                    </template>
                </wd-input>

                <wd-input type="text" label="附件3" label-width="40px" v-model="model.re3" placeholder="请选择文件" center>
                    <template #suffix>
                        <CjxUpload v-model="model.file3List" :limit="1" @change="handleUploadFile3ClickChange">
                            <template #default>
                                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
                            </template>
                        </CjxUpload>
                    </template>
                </wd-input>

                <wd-input type="text" label="附件4" label-width="40px" v-model="model.re4" placeholder="请选择文件" center>
                    <template #suffix>
                        <CjxUpload v-model="model.file4List" :limit="1" @change="handleUploadFile4ClickChange">
                            <template #default>
                                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
                            </template>
                        </CjxUpload>
                    </template>
                </wd-input>

                <view class="footer">
                    <wd-button hairline type="primary" @click="handleSubmit" block>提交</wd-button>
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