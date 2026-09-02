<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchUpdateUserInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const model = reactive<{
    email: string;
}>({
    email: '',
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

const validatorEmail = (val: any) => {
    if (val) {
        if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(val)) {
            return Promise.resolve();
        } else {
            return Promise.reject('电子邮箱格式错误');
        }
    } else {
        return Promise.resolve();
    }
};

function handleSubmit() {
    form.value
        .validate()
        .then(({ valid, errors }: { valid: any; errors: any }) => {
            console.log('valid', valid);
            console.log('errors', errors);
            if (valid) {
                async function handleUpdateUserInfoChange() {
                    try {
                        const data = await fetchUpdateUserInfo({ id: uni.getStorageSync('userId'), email: model.email });
                        handleClickLeft();
                    } catch (err) {
                        console.error('修改电子邮箱失败', err);
                    }
                }
                handleUpdateUserInfoChange();
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

onLoad((options: any) => {
    model.email = options.email;
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="电子邮箱" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view class="loginContainer">
            <view class="loginWrap">
                <wd-form ref="form" :model="model" style="width: 100%">
                    <wd-cell-group border custom-class="cellGroupSpecial">
                        <wd-input
                            label="电子邮箱"
                            label-width="80px"
                            prefix-icon="mail"
                            clearable
                            v-model="model.email"
                            placeholder="请输入电子邮箱"
                            :rules="[
                                {
                                    required: false,
                                    validator: validatorEmail,
                                    message: '请输入电子邮箱',
                                },
                            ]"
                        />
                    </wd-cell-group>

                    <view class="footer">
                        <wd-button hairline type="primary" @click="handleSubmit" block>确定</wd-button>
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
