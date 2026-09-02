<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjformMemberInfo, fetchSavePrjformMemberInfo, fetchUpdatePrjformMemberInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const loading = ref<boolean>(false);

const memberForm = reactive({
    id: null
})

const model = reactive<{
    pid: number | null;
    docker: string;
    pname: string;
    pcontact: string;
    proposition: string;
}>({
    pid: null,
    docker: '',
    pname: '',
    pcontact: '',
    proposition: ''
});

const rules: FormRules = {
    docker: [
        {
            required: true,
            message: '请输入对接方',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入对接方');
                }
            }
        },
    ],
    pname: [
        {
            required: true,
            message: '请输入姓名',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入姓名');
                }
            }
        },
    ],
    pcontact: [
        {
            required: true,
            message: '请输入联系方式',
            validator: (value: string) => {
                if (value) {
                    // if (!/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(value)) {
                    //     return Promise.reject('请输入正确的联系方式');
                    // } else {
                    //     return Promise.resolve();
                    // }
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入联系方式');
                }
            }
        },
    ]
};

const form = ref();
const { themeVars, theme } = useTheme();

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshPrjFormMemberList'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取工程调试单联系人基本信息
async function getPrjMemberInfo() {
    try {
        const data = await fetchGetPrjformMemberInfo(Number(memberForm.id));
        console.log('data获取工程调试单联系人基本信息', data);
        model.docker = data.docker;
        model.pname = data.pname;
        model.pcontact = data.pcontact;
        model.proposition = data.proposition;
    } catch (error) {
        console.error('获取工程调试单联系人基本信息失败', error);
    }
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                loading.value = true;
                try {
                    if (memberForm.id) {
                        let queryParams = [{
                            id: memberForm.id,
                            pid: model.pid,
                            docker: model.docker,
                            pname: model.pname,
                            pcontact: model.pcontact,
                            proposition: model.proposition
                        }];
                        const data = await fetchUpdatePrjformMemberInfo(queryParams);
                        uni.showToast({
                            title: '修改工程调试单联系人成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            pid: model.pid,
                            docker: model.docker,
                            pname: model.pname,
                            pcontact: model.pcontact,
                            proposition: model.proposition
                        }];
                        const data = await fetchSavePrjformMemberInfo(queryParams);
                        uni.showToast({
                            title: '新增工程调试单联系人成功',
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
                    if (memberForm.id) {
                        console.error('修改工程调试单联系人失败', err);
                    } else {
                        console.error('新增工程调试单联系人失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

onLoad((options: any) => {
    model.pid = options.pid;
    memberForm.id = options.id;
    if (memberForm.id) {
        getPrjMemberInfo();
    }
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="memberForm.id ? '修改工程调试单联系人' : '新增工程调试单联系人'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="对接方" label-width="80px" prop="docker" clearable v-model="model.docker" placeholder="请输入对接方" />
                <wd-input label="姓名" label-width="80px" prop="pname" required clearable v-model="model.pname" placeholder="请输入姓名" />
                <wd-input label="联系方式" label-width="80px" prop="pcontact" required clearable v-model="model.pcontact" placeholder="请输入联系方式" />
                <wd-textarea label="备注" label-width="80px" type="textarea" v-model="model.proposition" placeholder="请输入备注" clearable prop="proposition" />
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