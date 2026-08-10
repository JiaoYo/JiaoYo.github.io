<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref, onMounted, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchGetPrjDeviceInfo, fetchGetPrjContractDataList, fetchSavePrjDeviceInfo, fetchUpdatePrjDeviceInfo } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const contractShow = ref<boolean>(false);

const contractDataList = ref<any>([]);

const contractTriggered = ref<boolean>(false);

const contractIdNameObj: Record<number, string> = {};

const loading = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    contractPage: number;
    contractLimit: number;
    contractTotal: number;
    contractFuzzy: string;
    checkedContract: any;
    selectedContract: any;
}>({
    contractPage: 1,
    contractLimit: 100,
    contractTotal: 0,
    contractFuzzy: '',
    checkedContract: [],
    selectedContract: null
})

const model = reactive<{
    id: number;
    pid: number;
    contractname: string;
    devname: string;
    devcount: number;
    devunit: string;
    notes: string;
    devtype: number;
    devmanu: string;
    defaultStatus: number;
    status: number;
}>({
    id: 0,
    pid: 0,
    contractname: '',
    devname: '',
    devcount: 1,
    devunit: '',
    notes: '',
    devtype: 0,
    devmanu: '',
    defaultStatus: 0,
    status: 0
});

const rules: FormRules = {
    contractname: [
        {
            required: true,
            message: '请选择合同',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择合同');
                }
            }
        },
    ],
    devname: [
        {
            required: true,
            message: '请输入设备名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入设备名称');
                }
            }
        },
    ],
    devcount: [
        {
            required: true,
            message: '请输入数量',
            type: 'number'
        },
    ]
};

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListDevice'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取设备详细信息
async function getDeviceInfo() {
    try {
        const data = await fetchGetPrjDeviceInfo(Number(model.id));
        model.pid = data.pid;
        model.contractname = data.contractname;
        model.devname = data.devname;
        model.devcount = data.devcount;
        model.devunit = data.devunit || '';
        model.notes = data.notes;
        model.devtype = data.devtype;
        model.devmanu = data.devmanu;
        model.status = data.status;
        model.defaultStatus = data.status;
        dataForm.contractFuzzy = data.contractname;
        dataForm.selectedContract = data.pid;
        dataForm.checkedContract = [data.pid];
        await getPrjContractDataList();
    } catch (error) {
        console.error('获取设备详细信息失败', error);
    }
}

// 清除(合同信息)
function handleClearContractFuzzyChange() {
    dataForm.contractPage = 1;
    getPrjContractDataList();
}

// 搜索(合同信息)
function handleSearchContractFuzzyChange() {
    dataForm.contractPage = 1;
    getPrjContractDataList();
}

// 获取合同信息
async function getPrjContractDataList() {
    if (!hasPermission('project:Contract:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取合同信息权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    if (dataForm.contractPage === 1) {
        contractDataList.value = [];
    }
    let queryParams: any = {
        page: dataForm.contractPage,
        limit: dataForm.contractLimit
    }
    if (dataForm.contractFuzzy) {
        queryParams['fuzzy'] = dataForm.contractFuzzy;
    }
    try {
        const data = await fetchGetPrjContractDataList(queryParams);
        contractDataList.value = contractDataList.value.concat(data.list);
        dataForm.contractTotal = Number(data.total);
        contractDataList.value.forEach((item: any) => {
            contractIdNameObj[item.id] = item.contractname;
        });
    } catch (error) {
        console.log('获取合同信息错误', error);
    }
}

// 打开合同信息选择弹框
async function handlePrjContractLinkShowChange() {
    if (!hasPermission('project:Contract:select')) {
        uni.showToast({
            icon: "none",
            duration: 1500,
            title: "暂无查询合同权限，请联系管理员"
        })
        return false
    }
    contractShow.value = true;
}

// 关闭合同信息弹框
function handleContractCloseChange() {
    contractShow.value = false;
}

// 选择合同信息(获取对应名称)
function handleContractCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // const names = contractDataList.value.filter((item: any) => dataForm.checkedContract.includes(item.id)).map((item: any) => item.contractname);
    // model.contractname = names.join(", ");
    const names = dataForm.checkedContract.map((id: any) => contractIdNameObj[id]).filter(Boolean);
    model.contractname = names.join(", ");
}

// 选择合同信息(修改单选)
function handleContractRadioChange({ value }: { value: any }) {
    console.log('value', value);
    // const names = contractDataList.value.filter((item: any) => dataForm.checkedContract.includes(item.id)).map((item: any) => item.contractname);
    // model.contractname = names.join(", ");
    model.contractname = contractIdNameObj[value];
    contractShow.value = false;
}

// 刷新(合同信息)
function handleScrollRefreshContractChange() {
    contractTriggered.value = true;
    dataForm.contractPage = 1;
    getPrjContractDataList();
    setTimeout(() => {
        contractTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(合同信息)
function handleScrolltolowerContractChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && contractDataList.value.length < dataForm.contractTotal) {
        dataForm.contractPage++;
        getPrjContractDataList();
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
                            pid: dataForm.selectedContract,
                            devname: model.devname,
                            devcount: model.devcount,
                            devunit: model.devunit,
                            notes: model.notes,
                            devtype: model.devtype,
                            devmanu: model.devmanu
                        }];
                        message
                        .confirm({
                            msg: '确定要修改设备吗？',
                            title: '提示',
                            confirmButtonProps: {
                                type: 'error',
                            },
                        })
                        .then(async () => {
                            const data = await fetchUpdatePrjDeviceInfo(queryParams);
                            uni.showToast({
                                title: '修改设备成功',
                                icon: 'none',
                                duration: 1500,
                                complete: () => {
                                    loading.value = false;
                                    handleClickLeft(true);
                                }
                            });
                        })
                        .catch(() => {
                            console.log('点击了取消按钮');
                            loading.value = false;
                        });
                    } else {
                        let queryParams = dataForm.checkedContract.map((item: any) => {
                            return {
                                pid: item,
                                devname: model.devname,
                                devcount: model.devcount,
                                devunit: model.devunit,
                                notes: model.notes,
                                devtype: model.devtype,
                                devmanu: model.devmanu
                            }
                        });
                        const data = await fetchSavePrjDeviceInfo(queryParams);
                        uni.showToast({
                            title: '新增设备成功',
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
                        console.error('修改设备失败', err);
                    } else {
                        console.error('新增设备失败', err);
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
    model.pid = options.pid;
    if (model.id) {
        getDeviceInfo();
    } else {
        getPrjContractDataList();
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
            <wd-navbar left-arrow :title="model.id ? '修改设备' : '新增设备'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="合同信息" label-width="100px" prop="contractname" clearable disabled required v-model="model.contractname" placeholder="请选择合同">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handlePrjContractLinkShowChange">合同信息</wd-button>
                    </template>
                </wd-input>
                <wd-input label="设备名称" label-width="100px" prop="devname" required clearable v-model="model.devname" placeholder="请输入设备名称" />
                <wd-input label="数量" label-width="100px" type="number" prop="devcount" required clearable v-model="model.devcount" placeholder="请输入数量" />
                <wd-input label="单位" label-width="100px" prop="devunit" required clearable v-model="model.devunit" placeholder="请输入单位" />
                <wd-cell title="是否为我司设备" center>
                    <wd-radio-group inline v-model="model.devtype" shape="dot" cell>
                        <wd-radio :value="0">是</wd-radio>
                        <wd-radio :value="1">否</wd-radio>
                    </wd-radio-group>
                </wd-cell>
                <wd-input label="设备厂家" label-width="100px" prop="devmanu" clearable v-model="model.devmanu" placeholder="请输入设备厂家" />
                <wd-textarea label="备注" label-width="100px" type="textarea" prop="notes" clearable v-model="model.notes" placeholder="请输入备注" />
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="contractShow" position="left" @close="handleContractCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.contractFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchContractFuzzyChange" @cancel="handleSearchContractFuzzyChange" @clear="handleClearContractFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="contractTriggered" @refresherrefresh="handleScrollRefreshContractChange" @scrolltolower="handleScrolltolowerContractChange" style="height: calc(100vh - 230rpx);">
                <wd-cell-group border v-if="!model.id">
                    <wd-checkbox-group v-model="dataForm.checkedContract" @change="handleContractCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in contractDataList" :key="index" :title="item.contractname" center class="checkboxCellWrap">
                            <wd-checkbox :modelValue="item.id"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>

                <wd-radio-group v-else v-model="dataForm.selectedContract" shape="dot" @change="handleContractRadioChange">
                    <wd-cell v-for="(item, index) in contractDataList" :key="index" custom-class="radioCellWrap">
                        <wd-radio :value="item.id">{{ item.contractname }}</wd-radio>
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

.checkboxCellWrap {
    :deep(.wd-cell__left) {
        flex: 6 !important;
    }
}

.radioCellWrap {
    padding: 0 !important;

    :deep(.wd-cell__wrapper) {
        display: block !important;
        padding: 20rpx !important;
    }
}
</style>