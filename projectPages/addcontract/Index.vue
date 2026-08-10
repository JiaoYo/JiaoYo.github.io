<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { v4 as uuidv4 } from "uuid";
import { fetchGetPrjContractInfo, fetchSavePrjContractInfo, fetchUpdatePrjContractInfo, fetchGetPrjDataList } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';

const message = useMessage();

const loading = ref<boolean>(false);

const prjShow = ref<boolean>(false);

const prjDataList = ref<any>([]);

const triggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    fuzzy: string;
    checkedPrj: any;

}>({
    page: 1,
    limit: 50,
    total: 0,
    fuzzy: '',
    checkedPrj: []
})


const model = reactive<{
    id: number;
    contractname: string;
    contractnum: string;
    businesscon: string;
    businessinfo: string;
    precautions: string;
    prjname: string;
    notes: string;
    // paystatus: number;
    // shippingstatus: number;
    // estimatedCompletionTime: null | number;
}>({
    id: 0,
    contractname: '',
    contractnum: '',
    businesscon: '',
    businessinfo: '',
    precautions: '',
    prjname: '',
    notes: ''
    // paystatus: 1,
    // shippingstatus: 1,
    // estimatedCompletionTime: Number(getSystemDate(5, undefined, 60))
});

const rules: FormRules = {
    contractname: [
        {
            required: true,
            message: '请输入合同名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入合同名称');
                }
            }
        },
    ],
    contractnum: [
        {
            required: true,
            message: '请输入合同编号',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入合同编号');
                }
            }
        },
    ],
    businesscon: [
        {
            required: true,
            message: '请输入商务负责人',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入商务负责人');
                }
            }
        },
    ],
    businessinfo: [
        {
            required: true,
            message: '请输入商务负责人联系方式',
            validator: (value: string) => {
                if (value) {
                    // if (!/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(value)) {
                    //     return Promise.reject('请输入正确的商务负责人联系方式');
                    // } else {
                    //     return Promise.resolve();
                    // }
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入商务负责人联系方式');
                }
            }
        },
    ]
};

const statusList = ref<any[]>([
    {
        value: 1,
        label: '是'
    },
    {
        value: 0,
        label: '否',
    }
]);


const form = ref();
const { themeVars, theme } = useTheme();

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListContract'); // 通知列表页刷新
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
    getPrjDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    getPrjDataList();
}

// 获取项目信息
async function getPrjDataList() {
    if (!hasPermission('project:Info:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取项目信息权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    if (dataForm.page === 1) {
        prjDataList.value = [];
    }
    let queryParams: any = {
        page: dataForm.page,
        limit: dataForm.limit
    }
    if (dataForm.fuzzy) {
        queryParams['fuzzy'] = dataForm.fuzzy;
    }
    try {
        const data = await fetchGetPrjDataList(queryParams);
        prjDataList.value = prjDataList.value.concat(data.list);
        dataForm.total = Number(data.total);
    } catch (error) {
        console.log('获取项目信息错误', error);
    }
}

// 打开项目信息选择弹框
async function handlePrjLinkShowChange() {
    prjShow.value = true;
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.page = 1;
    getPrjDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && prjDataList.value.length < dataForm.total) {
        dataForm.page++;
        getPrjDataList();
    }
}

// 关闭项目息弹框
function handleCloseChange() {
    prjShow.value = false;
}

// 选择项目信息(获取对应名称)
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    const names = prjDataList.value.filter((item: any) => dataForm.checkedPrj.includes(item.id)).map((item: any) => item.proname);
    model.prjname = names.join(", ");
}

// 获取合同详情
async function getPrjContractInfo() {
    if (!hasPermission('project:Contract:select')) {
        uni.showToast({
            title: '暂无获取合同详情权限，请联系管理员',
            icon: 'none',
            duration: 1500
        });
        return
    }
    try {
        const data = await fetchGetPrjContractInfo(Number(model.id));
        console.log('获取合同详情成功', data);
        model.contractname = data.contractname;
        model.contractnum = data.contractnum;
        model.businesscon = data.businesscon;
        model.businessinfo = data.businessinfo;
        model.precautions = data.precautions;
        model.notes = data.notes;
    } catch (error) {
        console.error('获取合同详情失败', error);
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
                            contractname: model.contractname,
                            contractnum: model.contractnum,
                            businesscon: model.businesscon,
                            businessinfo: model.businessinfo,
                            precautions: model.precautions,
                            notes: model.notes
                        }];
                        message
                        .confirm({
                            msg: '确定要修改该合同吗？',
                            title: '提示',
                            confirmButtonProps: {
                                type: 'error',
                            },
                        })
                        .then(async () => {
                            const data = await fetchUpdatePrjContractInfo(queryParams);
                            uni.showToast({
                                title: '修改合同成功',
                                icon: 'none',
                                duration: 1500,
                                complete: () => {
                                    loading.value = false;
                                    handleClickLeft(true);
                                }
                            });
                        })
                        .catch(() => {
                            loading.value = false;
                            console.log('点击了取消按钮');
                        });
                    } else {
                        let queryParams = [{
                            contractname: model.contractname,
                            contractnum: model.contractnum,
                            businesscon: model.businesscon,
                            businessinfo: model.businessinfo,
                            precautions: model.precautions,
                            notes: model.notes,
                            uuid: uuidv4()
                        }];
                        const data = await fetchSavePrjContractInfo(queryParams);
                        uni.showToast({
                            title: '新增合同成功',
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
                        console.error('修改合同失败', err);
                    } else {
                        console.error('新增合同失败', err);
                    }
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

onLoad((options: any) => {
    model.id = options.id;
    getPrjDataList();
    if (model.id) {
        getPrjContractInfo();
    }
});

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
            <wd-navbar left-arrow :title="model.id ? '修改合同' : '新增合同'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="合同名称" label-width="100px" prop="contractname" required clearable v-model="model.contractname" placeholder="请输入合同名称" />
                <wd-input label="合同编号" label-width="100px" prop="contractnum" required clearable v-model="model.contractnum" placeholder="请输入合同编号" />
                <wd-input label="商务负责人" label-width="100px" prop="businesscon" required clearable v-model="model.businesscon" placeholder="请输入商务负责人" />
                <wd-input label="商务负责人联系方式" label-width="140px" prop="businessinfo" required clearable v-model="model.businessinfo" placeholder="请输入商务负责人联系方式" />
                <!-- <wd-input v-if="!model.id" label="项目信息" label-width="100px" prop="disname" clearable disabled v-model="model.prjname" placeholder="请选择项目">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handlePrjLinkShowChange">项目信息</wd-button>
                    </template>
                </wd-input> -->
                <wd-textarea label="注意事项" label-width="100px" type="textarea" v-model="model.precautions" placeholder="请输入注意事项" clearable prop="precautions" />
                <wd-textarea label="备注" label-width="100px" type="textarea" v-model="model.notes" placeholder="请输入备注" clearable prop="notes" />
                <view class="footer" v-if="hasPermission('project:Contract:insert') || hasPermission('project:Contract:update')">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>

            <wd-popup closable :custom-style="`width: 80vw; margin-top: ${topFixedHeight}px;`" v-model="prjShow" position="left" @close="handleCloseChange">
                <wd-gap height="50rpx" />

                <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

                <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 230rpx);">
                    <wd-cell-group border>
                        <wd-checkbox-group v-model="dataForm.checkedPrj" @change="handleCheckboxSelectChange">
                            <wd-cell v-for="(item, index) in prjDataList" :key="index" :title="item.proname" center>
                                <wd-checkbox :modelValue="item.id"></wd-checkbox>
                            </wd-cell>
                        </wd-checkbox-group>
                    </wd-cell-group>
                </scroll-view>
            </wd-popup>
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