<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchSaveContractchangeInfo } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import { hasPermission } from '@/utils/index';

const message = useMessage();

const loading = ref<boolean>(false);

const topFixedWrap = ref<any>(null);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const model = reactive<{
    connum: string;
}>({
    connum: ''
});

const rules: FormRules = {
    connum: [
    	{
    		required: true,
    		message: '请输入合同编号',
    		validator: (value: string) => {
    			if (value) {
    				return Promise.resolve();
    			} else {
    				return Promise.reject('请输入合同编号');
    			}
    		},
    	},
    ]
};


const form = ref();
const { themeVars, theme } = useTheme();

function handleClickLeft(hasNewData = false) {
	if (hasNewData) {
	    uni.$emit('refreshContractchangeList'); // 通知列表页刷新
	}
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
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                loading.value = true;
                try {
					let queryParams = {
						connum: model.connum.trim()
					};
					const data = await fetchSaveContractchangeInfo(queryParams);
					uni.showToast({
						title: '新增合同变更成功',
						icon: 'none',
						duration: 1500,
						complete: () => {
							loading.value = false;
							handleClickLeft(true);
						}
					});
                } catch (err) {
                    console.error('新增合同变更失败', err);
                    loading.value = false;
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    // use createSelectorQuery 获取真实高度（适配小程序/APP/H5）
    try {
        uni.createSelectorQuery()
            .select('.topFixedWrap')
            .boundingClientRect((rect: any) => {
                if (rect && rect.height !== undefined) {
                    topFixedHeight.value = rect.height;
                }
            })
            .exec();
    } catch (err) {
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
    // 可监听窗口尺寸变更（H5 情况），小屏旋转/resize 时重新计算
    try {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', recalcTopFixedHeight);
        }
    } catch (e) { /* ignore */ }
});

onReady(() => {
	recalcTopFixedHeight();
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
		<!-- 占位：顶部固定区域高度（动态计算） -->
		<view :style="{ height: topFixedHeight + 'px' }"></view>
		
		<view class="topFixedWrap">
			<wd-navbar left-arrow title="新增合同变更" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
		</view>
		
		<view>
			<wd-form ref="form" :model="model" :rules="rules">
				<wd-input label="合同编号" label-width="80px" prop="connum" required clearable v-model="model.connum" placeholder="请输入合同编号" />
			
				<view class="footer">
					<wd-button v-if="hasPermission('project:Change:Contract:insert')" hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
				</view>
			</wd-form>
		</view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
	.topFixedWrap {
	    position: fixed;
	    left: 0;
	    top: 0;
	    width: 100%;
	    z-index: 999;
	    background-color: #FFFFFF;
	    /* 保证内联元素正确换行 */
	    box-sizing: border-box;
	    /* 可选：微阴影让固定区更明显 */
	    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
	}

	.footer {
		padding: 0 20rpx 40rpx 20rpx;
		margin-top: 40rpx;
	}
</style>