<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { nextTick, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjWeightInfo, fetchSavePrjWeightInfo, fetchUpdatePrjWeightInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const weightColumns = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const model = reactive<{
    id: number | null;
    tname: string;
    weight: number;
}>({
    id: null,
    tname: '',
    weight: 1
});

const rules: FormRules = {
    tname: [
        {
            required: true,
            message: '请输入类型名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入类型名称');
                }
            }
        },
    ],
	weight: [
		{
			required: true,
			message: '请输入权重'
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

// 获取权重基本信息
async function getDispatchInfo() {
    try {
        const data = await fetchGetPrjWeightInfo(Number(model.id));
        model.tname = data.tname;
        model.weight = data.weight;
    } catch (error) {
        console.log('获取权重基本信息错误', error);
    }
}

// 限制权重
function handleWeightInputChange(val: any) {
	// console.log('val', val);
	// let n = Number(val.value);
	// if (isNaN(n)) {
	// 	 n = 1;
	// } else {
	// 	if (n < 1) n = 1;
	// 	if (n > 100) n = 100;
	// }
	
	// nextTick(() => {
	// 	model.weight = Number(n);
	// })
	console.log('val', val);
	// 1. 去除非数字字符（禁止小数点、字母、特殊符号）
	let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 1;
	} else {
		if (n < 1) n = 1;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.weight = Number(n);
	})
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
                            tname: model.tname,
                            weight: model.weight
                        }];
                        const data = await fetchUpdatePrjWeightInfo(queryParams);
                        uni.showToast({
                            title: '修改项目权重成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            tname: model.tname,
                            weight: model.weight
                        }];
                        const data = await fetchSavePrjWeightInfo(queryParams);
                        uni.showToast({
                            title: '新增项目权重成功',
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
                        console.error('修改项目权重失败', err);
                    } else {
                        console.error('新增项目权重失败', err);
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
        <wd-navbar left-arrow :title="model.id ? '修改项目权重' : '新增项目权重'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="类型名称" label-width="100px" prop="tname" required clearable v-model="model.tname" placeholder="请输入类型名称" />
				<wd-input label="权重" label-width="100px" type="number" prop="weight" required clearable v-model="model.weight" placeholder="请输入权重（1-100）" @input="handleWeightInputChange" />
				<!-- <wd-picker :columns="weightColumns" label="权重" v-model="model.weight" /> -->
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