<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { uploadFile } from '@/utils/uploadFile';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetUploadFileTokenInfo, fetchGetAllUserDataList, fetchGetPrjDevelopmentInfo, fetchSavePrjDevelopmentInfo, fetchUpdatePrjDevelopmentInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const form = ref();
const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const triggered = ref<boolean>(false);

const prjForm = reactive({
    id: null,
    needDevelopId: null
})

const userShow = ref<boolean>(false);

const userDataList = ref<any>([]);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    checkedUser: any;
}>({
    page: 1,
    limit: 100,
    total: 0,
    checkedUser: []
})

const model = reactive<{
    affectedbusiness: string;
    devname: string;
    apidocument: string;
    uid: number;
    uname: string;
    period: number;
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
    affectedbusiness: '',
    devname: '',
    apidocument: '',
    uid: 0,
    uname: '',
    period: 15,
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
    affectedbusiness: [
        {
            required: true,
            message: '请输入影响的业务',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入影响的业务');
                }
            }
        },
    ],
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
    uid: [
        {
            type: 'number',
            required: true,
            message: '请选择研发对接人',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择研发对接人');
                }
            }
        },
    ],
    period: [
        {
            type: 'number',
            required: true,
            message: '请输入研发周期',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入研发周期');
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
    const data = await fetchGetPrjDevelopmentInfo(Number(prjForm.needDevelopId));
    model.affectedbusiness = data.affectedbusiness;
    model.devname = data.devname;
    model.uid = data.uid;
    model.uname = data.uname;
    model.apidocument = data.apidocument;
    model.period = data.period;
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

// 清除
function handleClearChange() {
    dataForm.page = 1;
    getAllUserDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    getAllUserDataList();
}

// 获取全部研发对接人
async function getAllUserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            userDataList.value = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: dataForm.limit, usertypes: '2, 3, 9' });
        userDataList.value = userDataList.value.concat(data.list);
        dataForm.total = Number(data.total);
    } catch (error) {
        console.error('获取全部调试人员失败', error);
    }
}

// 打开研发对接人选择弹框
async function handleLinkMemberShowChange() {
    userShow.value = true;
}

// 研发对接人刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.page = 1;
    getAllUserDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && userDataList.value.length < dataForm.total) {
        dataForm.page++;
        getAllUserDataList();
    }
}

// 关闭选择人员弹框
function handleCloseChange() {
    userShow.value = false;
}

// 选择研发对接人
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const names = userDataList.value.filter((item: any) => dataForm.checkedUser.includes(item.id)).map((item: any) => item.username);
    model.uname = names.join(", ");
}

// 选择研发对接人(修改)
function handleRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    userShow.value = false;
    // 获取对应名称
    const names = userDataList.value.find((item: any) => value === item.id);
    model.uname = names ? names.username : '';
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                try {
                    if (prjForm.needDevelopId) {
                        let queryParams = [{
                            id: prjForm.needDevelopId,
                            pid: prjForm.id,
                            affectedbusiness: model.affectedbusiness,
                            devname: model.devname,
                            apidocument: model.apidocument,
                            period: model.period,
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
                        const data = await fetchUpdatePrjDevelopmentInfo(queryParams);
                        uni.showToast({
                            title: '修改需要开发成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            pid: prjForm.id,
                            affectedbusiness: model.affectedbusiness,
                            devname: model.devname,
                            apidocument: model.apidocument,
                            period: model.period,
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
                        const data = await fetchSavePrjDevelopmentInfo(queryParams);
                        uni.showToast({
                            title: '新增需要开发成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                handleClickLeft(true);
                            }
                        });
                    }
                } catch (err) {
                    if (prjForm.needDevelopId) {
                        console.error('修改需要开发失败', err);
                    } else {
                        console.error('新增需要开发失败', err);
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
    prjForm.needDevelopId = options.id;
    getAllUserDataList();
    if (prjForm.needDevelopId) {
        getDebugBusinessInfo();
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="prjForm.needDevelopId ? '修改需要开发' : '新增需要开发'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="影响的业务" label-width="100px" prop="affectedbusiness" required clearable v-model="model.affectedbusiness" placeholder="请输入影响的业务" />
                <wd-input label="设备名称" label-width="100px" prop="devname" required clearable v-model="model.devname" placeholder="请输入设备名称" />
                <wd-input label="接口文档" label-width="100px" prop="apidocument" clearable v-model="model.apidocument" placeholder="请输入接口文档" />
                <wd-input label="研发对接人" label-width="100px" prop="uname" required disabled v-model="model.uname" placeholder="请选择研发对接人">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkMemberShowChange">研发对接人</wd-button>
                    </template>
                </wd-input>
                <wd-input label="研发周期" label-width="100px" prop="period" required clearable v-model="model.period" placeholder="请输入研发周期" />
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

        <wd-popup closable custom-class="popupWrap" v-model="userShow" position="left" @close="handleCloseChange">
            <!-- <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="margin-top: 90rpx; height: calc(100vh - 90rpx);">
                <wd-cell-group border v-if="!prjForm.needDevelopId">
                    <wd-checkbox-group v-model="dataForm.checkedUser" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in userDataList" :key="index" :title="item.username" center>
                            <view class="custom-txt">
                                <wd-checkbox :modelValue="item.id" custom-style="margin: 0;"></wd-checkbox>
                            </view>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>

                <wd-radio-group v-model="model.uid" shape="dot" v-else @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in userDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.username }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}

.custom-txt {
    color: black;
    width: 40vw;
}

:deep(.radioCellWrap) {
    padding: 10rpx !important;
}
</style>