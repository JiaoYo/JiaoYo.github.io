<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjDispatchDataList, fetchGetPrjDispatchContractInfo, fetchSavePrjDispatchContractInfo, fetchDeletePrjDispatchContractInfo, fetchUpdatePrjDispatchContractInfo } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';

const form = ref();
const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const triggered = ref<boolean>(false);

const dispatchShow = ref<boolean>(false);

const dispatchDataList = ref<any>([]);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    fuzzy: string;
    checkedDispatch: any;
}>({
    page: 1,
    limit: 20,
    total: 0,
    fuzzy: '',
    checkedDispatch: []
})

const model = reactive<{
    id: number;
    pid: number;
    disname: string;
    did: any;
}>({
    id: 0,
    pid: 0,
    disname: '',
    did: null
});

const rules: FormRules = {
    disname: [
        {
            required: true,
            message: '请选择调度',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择调度');
                }
            }
        },
    ]
};

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListDispatch'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 清除
function handleClearChange() {
    dataForm.page = 1;
    getDispatchDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    getDispatchDataList();
}

// 获取调度信息
async function getDispatchDataList() {
    if (dataForm.page === 1) {
        dispatchDataList.value = [];
    }
    let queryParams: any = {
        page: dataForm.page,
        limit: dataForm.limit
    }
    if (dataForm.fuzzy) {
        queryParams['fuzzy'] = dataForm.fuzzy;
    }
    try {
        const data = await fetchGetPrjDispatchDataList(queryParams);
        console.log('data获取调度信息', data);
        dispatchDataList.value = dispatchDataList.value.concat(data.list);
        dataForm.total = Number(data.total);
    } catch (error) {
        console.log('获取省份错误', error);
    }
}

// 打开调度信息选择弹框
async function handleLinkDispatchShowChange() {
    dispatchShow.value = true;
}

// 调度信息刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.page = 1;
    getDispatchDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && dispatchDataList.value.length < dataForm.total) {
        dataForm.page++;
        getDispatchDataList();
    }
}

// 关闭调度信息弹框
function handleCloseChange() {
    dispatchShow.value = false;
}

// 选择调度信息
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const names = dispatchDataList.value.filter((item: any) => dataForm.checkedDispatch.includes(item.id)).map((item: any) => item.dname);
    model.disname = names.join(", ");
}

// 选择调度信息(单选)
function handleRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const nameObj = dispatchDataList.value.find((item: any) => value === item.id);
    model.disname = nameObj ? nameObj.dname : '';
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
                            pid: model.pid,
                            did: model.did
                        }];
                        const data = await fetchUpdatePrjDispatchContractInfo(queryParams);
                        uni.showToast({
                            title: '修改项目调度联系人成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = dataForm.checkedDispatch.map((item: any) => {
                            return {
                                pid: model.pid,
                                did: item
                            }
                        });
                        const data = await fetchSavePrjDispatchContractInfo(queryParams);
                        uni.showToast({
                            title: '新增项目调度联系人成功',
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
                        console.error('修改项目调度联系人失败', err);
                    } else {
                        console.error('新增项目调度联系人失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

// 获取项目调度联系人详情
async function getPrjDispatchContractInfoById() {
    try {
        const data = await fetchGetPrjDispatchContractInfo(model.id);
        console.log('获取项目调度联系人详情成功', data);
        model.disname = data.dname;
        dataForm.fuzzy = data.dname;
        model.did = Number(data.did);
        dataForm.checkedDispatch = [];
        getDispatchDataList();
    } catch (error) {
        console.error('获取项目调度联系人失败', error);
    }
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

onLoad((options: any) => {
    model.pid = options.pid;
    model.id = options.id;
    if (model.id) {
        getPrjDispatchContractInfoById();
    } else {
        getDispatchDataList();
    }
})

onReady(() => {
    recalcTopFixedHeight();
})

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
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow :title="model.id ? '修改项目调度联系人' : '新增项目调度联系人'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>
        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="调度信息" label-width="100px" prop="disname" clearable disabled v-model="model.disname" placeholder="请选择调度">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkDispatchShowChange">调度信息</wd-button>
                    </template>
                </wd-input>
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" custom-class="popupWrap" v-model="dispatchShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-cell-group border v-if="!model.id">
                    <wd-checkbox-group v-model="dataForm.checkedDispatch" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in dispatchDataList" :key="index" :title="item.dname" center>
                            <wd-checkbox :modelValue="item.id"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>

                <wd-radio-group v-model="model.did" shape="dot" v-else @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in dispatchDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.dname }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
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