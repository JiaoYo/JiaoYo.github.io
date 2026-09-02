<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchUpdateUserPasswordInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const model = reactive<{
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
});

const form = ref();

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

const validator = (val: any) => {
    if (!val) {
        return Promise.reject('请输入密码');
    } else if (String(val).length < 6) {
        return Promise.reject('长度不得小于6位');
    } else if (String(val).length > 18) {
        return Promise.reject('长度不得大于18位');
    } else {
        if (val.toLocaleLowerCase().includes(uni.getStorageSync('username').toLocaleLowerCase())) {
            return Promise.reject('密码不能包含用户名');
        } else {
            const regex: string = "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{6,18}$";
            const regexPattern = new RegExp(regex);
            if (!regexPattern.test(val)) {
                return Promise.reject('密码必须包含 数字、大写字母、小写字母、特殊字符');
            } else {
                return Promise.resolve();
            }
        }
    }
    // if (String(val).length >= 6) {
    //     return Promise.resolve();
    // } else {
    //     return Promise.reject('长度不得小于6位');
    // }
};

const validatorPassword = (val: string) => {
    if (!val) {
        return Promise.reject('请输入密码');
    } else if (String(val).length < 6) {
        return Promise.reject('长度不得小于6位');
    } else if (String(val).length > 18) {
        return Promise.reject('长度不得大于18位');
    } else {
        if (val.toLocaleLowerCase().includes(uni.getStorageSync('username').toLocaleLowerCase())) {
            return Promise.reject('密码不能包含用户名');
        } else if (model.newPassword !== val) {
            return Promise.reject('密码不一致');
        } else {
            const regex: string = "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{6,18}$";
            const regexPattern = new RegExp(regex);
            if (!regexPattern.test(val)) {
                return Promise.reject('密码必须包含 数字、大写字母、小写字母、特殊字符');
            } else {
                return Promise.resolve();
            }
        }
    }
    // if (String(val).length >= 6) {
    //     if (model.newPassword === val) {
    //         return Promise.resolve();
    //     } else {
    //         return Promise.reject('密码不一致');
    //     }
    // } else {
    //     return Promise.reject('长度不得小于6位');
    // }
};

function handleSubmit() {
    form.value
        .validate()
        .then(({ valid, errors }: { valid: any; errors: any }) => {
            console.log('valid', valid);
            console.log('errors', errors);
            if (valid) {
                loading.value = true;
                async function handleUpdateUserPasswordChange() {
                    try {
                        const data = await fetchUpdateUserPasswordInfo({ id: uni.getStorageSync('userId'), username: uni.getStorageSync('username'), oripwd: model.oldPassword, password: model.newPassword });
                        uni.showToast({
                            title: data,
                            complete: () => {
                                setTimeout(() => {
                                    uni.hideToast();
                                    loading.value = false;
                                    uni.removeStorageSync('token');
                                    uni.removeStorageSync('userId');
                                    uni.removeStorageSync('usertype');
                                    uni.removeStorageSync('permissionList');
                                    uni.reLaunch({
                                        url: '/pages/login',
                                    });
                                }, 500);
                            },
                        });
                    } catch (err) {
                        console.error('修改密码失败', err);
                        loading.value = false;
                    }
                }
                handleUpdateUserPasswordChange();
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="修改密码" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view class="loginContainer">
            <view class="loginWrap">
                <wd-form ref="form" :model="model" style="width: 100%">
                    <wd-cell-group border custom-class="cellGroupSpecial">
                        <wd-input show-password label="旧密码" label-width="100px" prefix-icon="view" prop="oldPassword" clearable v-model="model.oldPassword" placeholder="请输入旧密码" :rules="[{ required: false, message: '请输入旧密码', validator: validator }]" />
                        <wd-input
                            label="新密码"
                            show-password
                            label-width="100px"
                            prefix-icon="view"
                            prop="newPassword"
                            clearable
                            :maxlength="18"
                            v-model="model.newPassword"
                            placeholder="请输入新密码"
                            :rules="[
                                {
                                    required: false,
                                    validator: validator,
                                    message: '请输入新密码',
                                },
                            ]"
                        />
                        <wd-input
                            label="确认密码"
                            show-password
                            label-width="100px"
                            prefix-icon="view"
                            prop="confirmPassword"
                            clearable
                            :maxlength="18"
                            v-model="model.confirmPassword"
                            placeholder="请输入确认密码"
                            :rules="[
                                {
                                    required: false,
                                    validator: validatorPassword,
                                    message: '请输入确认密码',
                                },
                            ]"
                        />
                    </wd-cell-group>

                    <view class="footer">
                        <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>确定</wd-button>
                    </view>
                </wd-form>
            </view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.loginContainer {
    padding: 40rpx 20rpx;

    .footer {
        padding-top: 40rpx;
    }
}
</style>
