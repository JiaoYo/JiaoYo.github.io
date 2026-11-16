<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { nextTick, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAftersaleReasonInfo, fetchSaveAftersaleReasonInfo, fetchUpdateAftersaleReasonInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const model = reactive<{
    id: number | null;
    rs: string;
    rsdesc: string;
}>({
    id: null,
    rs: '',
    rsdesc: ''
});

const rules: FormRules = {
    rs: [
        {
            required: true,
            message: '请输入售后原因',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入售后原因');
                }
            }
        },
    ],
	rsdesc: [
		{
			required: true,
			message: '请输入描述'
		}
	]
};

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListAftersalereason', model); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取售后原因基本信息
async function getAftersaleReasonInfo() {
    try {
        const data = await fetchGetAftersaleReasonInfo(Number(model.id));
        model.rs = data.rs;
        model.rsdesc = data.rsdesc;
    } catch (error) {
        console.log('获取售后原因基本信息错误', error);
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
                    if (model.id) {
                        let queryParams = [{
                            id: model.id,
                            rs: model.rs,
                            rsdesc: model.rsdesc
                        }];
                        const data = await fetchUpdateAftersaleReasonInfo(queryParams);
                        uni.showToast({
                            title: '修改售后原因成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            rs: model.rs,
                            rsdesc: model.rsdesc
                        }];
                        const data = await fetchSaveAftersaleReasonInfo(queryParams);
                        uni.showToast({
                            title: '新增售后原因成功',
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
                        console.error('修改售后原因失败', err);
                    } else {
                        console.error('新增售后原因失败', err);
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
        getAftersaleReasonInfo();
    }
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="model.id ? '修改售后原因' : '新增售后原因'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-textarea label="售后原因" label-width="100px" prop="rs" required clearable v-model="model.rs" placeholder="请输入类型名称" />
				<wd-textarea label="描述" label-width="100px" prop="rsdesc" required clearable v-model="model.rsdesc" placeholder="请输入描述" />
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