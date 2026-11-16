<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchUpdateUserInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const model = reactive<{
    realName: string;
}>({
    realName: '',
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

function handleSubmit() {
    form.value
        .validate()
        .then(({ valid, errors }: { valid: any; errors: any }) => {
            console.log('valid', valid);
            console.log('errors', errors);
            if (valid) {
                async function handleUpdateUserInfoChange() {
                    try {
                        const data = await fetchUpdateUserInfo({ id: uni.getStorageSync('userId'), realName: model.realName });
                        handleClickLeft();
                    } catch (err) {
                        console.error('修改姓名失败', err);
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
    model.realName = options.name;
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="姓名" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view class="loginContainer">
            <view class="loginWrap">
                <wd-form ref="form" :model="model" style="width: 100%">
                    <wd-cell-group border custom-class="cellGroupSpecial">
                        <wd-input label="姓名" label-width="80px" prefix-icon="user-circle" prop="realName" clearable v-model="model.realName" placeholder="请输入姓名" />
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
