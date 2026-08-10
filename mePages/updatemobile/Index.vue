<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchUpdateUserInfo } from '@/service/index';
import { hasPermission } from '@/utils/index';

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const model = reactive<{
    mobile: string;
}>({
    mobile: '',
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

const validatorPhone = (val: any) => {
    if (val) {
        if (/^((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)$/.test(val)) {
            return Promise.resolve();
        } else {
            return Promise.reject('联系方式格式错误');
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
                loading.value = true;
                async function handleUpdateUserInfoChange() {
                    try {
                        const data = await fetchUpdateUserInfo({ id: uni.getStorageSync('userId'), phnum: model.mobile });
                        loading.value = false;
                        handleClickLeft();
                    } catch (err) {
                        loading.value = false;
                        console.error('修改联系方式失败', err);
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
    model.mobile = options.mobile;
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="联系方式" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view class="loginContainer">
            <view class="loginWrap">
                <wd-form ref="form" :model="model" style="width: 100%">
                    <wd-cell-group border custom-class="cellGroupSpecial">
                        <wd-input
                            label="联系方式"
                            label-width="80px"
                            prefix-icon="mobile"
                            prop="mobile"
                            clearable
                            v-model="model.mobile"
                            placeholder="请输入联系方式"
                            :rules="[
                                {
                                    required: false,
                                    validator: validatorPhone,
                                    message: '请输入联系方式',
                                },
                            ]"
                        />
                    </wd-cell-group>

                    <view class="footer" v-if="hasPermission('sys:user:update')">
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
