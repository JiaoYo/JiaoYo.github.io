<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetProjectMaterialInfo, fetchSaveProjectMaterialInfo, fetchUpdateProjectMaterialInfo } from '@/service/projectMaterial';
import { onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const model = reactive<{
    id: number | null;
    devno: string;
    devname: string;
    devtype: number;
    devmanu: string;
    devmodel: string;
    devunit: string;
}>({
    id: null,
    devno: '',
    devname: '',
    devtype: 0,
    devmanu: '',
    devmodel: '',
    devunit: ''
});

const rules: FormRules = {
    devno: [
        {
            required: true,
            message: '请输入物料编码',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入物料编码');
                }
            }
        },
    ],
    devname: [
        {
            required: true,
            message: '请输入物料名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入物料名称');
                }
            }
        },
    ],
};

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListMaterialLibrary', model); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取物料基本信息
async function getDispatchInfo() {
    try {
        const data = await fetchGetProjectMaterialInfo(Number(model.id));
        if (!data) {
            return;
        }
        model.devno = data.devno || '';
        model.devname = data.devname || '';
        model.devtype = data.devtype != null ? data.devtype : 0;
        model.devmanu = data.devmanu || '';
        model.devmodel = data.devmodel || '';
        model.devunit = data.devunit || '';
    } catch (error) {
        console.error('获取物料信息错误', error);
    }
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            if (valid) {
                loading.value = true;
                try {
                    if (model.id) {
                        let queryParams = [{
                            id: model.id,
                            devno: model.devno,
                            devname: model.devname,
                            devtype: model.devtype,
                            devmanu: model.devmanu,
                            devmodel: model.devmodel,
                            devunit: model.devunit
                        }];
                        await fetchUpdateProjectMaterialInfo(queryParams);
                        uni.showToast({
                            title: '修改物料成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            devno: model.devno,
                            devname: model.devname,
                            devtype: model.devtype,
                            devmanu: model.devmanu,
                            devmodel: model.devmodel,
                            devunit: model.devunit
                        }];
                        await fetchSaveProjectMaterialInfo(queryParams);
                        uni.showToast({
                            title: '新增物料成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    }
                } catch (err) {
                    loading.value = false;
                    if (model.id) {
                        console.error('修改物料失败', err);
                    } else {
                        console.error('新增物料失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

onLoad((options: any) => {
    model.id = options.id;
    if (model.id) {
        getDispatchInfo();
    }
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="model.id ? '修改物料' : '新增物料'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="物料编码" label-width="100px" prop="devno" required clearable :maxlength="32" v-model="model.devno" placeholder="请输入物料编码（全表唯一）" />
                <wd-input label="物料名称" label-width="100px" prop="devname" required clearable :maxlength="64" v-model="model.devname" placeholder="请输入物料名称" />
                <wd-cell title="设备类型" center>
                    <wd-radio-group inline v-model="model.devtype" shape="dot" cell>
                        <wd-radio :value="0">我司设备</wd-radio>
                        <wd-radio :value="1">非我司设备</wd-radio>
                    </wd-radio-group>
                </wd-cell>
                <wd-input label="设备厂家" label-width="100px" prop="devmanu" clearable :maxlength="64" v-model="model.devmanu" placeholder="请输入设备厂家" />
                <wd-input label="设备型号" label-width="100px" prop="devmodel" clearable :maxlength="255" v-model="model.devmodel" placeholder="请输入设备型号" />
                <wd-input label="设备单位" label-width="100px" prop="devunit" clearable :maxlength="32" v-model="model.devunit" placeholder="请输入设备单位" />
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
