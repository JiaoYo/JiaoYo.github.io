<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetDebugTaskTemplateInfo, fetchSaveDebugTaskTemplateInfo, fetchUpdateDebugTaskTemplateInfo } from '@/service/debugTask';
import { fetchGetPrjWeightDataList } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const loading = ref<boolean>(false);

const prjForm = reactive({
    id: null as any
})

// ===== 调试类型（权重）选择弹框 =====
const weightShow = ref<boolean>(false);
const weightDataList = ref<any>([]);
const weightPage = ref<number>(1);
const weightTotal = ref<number>(0);
const weightFuzzy = ref<string>('');

const model = reactive<{
    id: number | null;
    pid: any;
    tname: string;
    taskName: string;
    weight: any;
    notes: string;
}>({
    id: null,
    pid: null,
    tname: '',
    taskName: '',
    weight: '',
    notes: ''
});

const rules: FormRules = {
    tname: [
        {
            required: true,
            message: '请选择调试类型',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择调试类型');
                }
            }
        },
    ],
    taskName: [
        {
            required: true,
            message: '请输入任务名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入任务名称');
                }
            }
        },
    ],
};

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListDebugTaskTemplate', model); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取调试类型（权重）数据源
async function getAllWeightDataList() {
    if (weightPage.value === 1) {
        weightDataList.value = [];
    }
    try {
        const data = await fetchGetPrjWeightDataList({ page: weightPage.value, limit: 50, fuzzy: weightFuzzy.value });
        weightDataList.value = weightDataList.value.concat(data.list);
        weightTotal.value = Number(data.total);
    } catch (error) {
        console.error('获取调试类型数据源失败', error);
    }
}

// 搜索/清除调试类型
function handleSearchWeightFuzzyChange() {
    weightPage.value = 1;
    getAllWeightDataList();
}

function handleClearWeightFuzzyChange() {
    weightFuzzy.value = '';
    weightPage.value = 1;
    getAllWeightDataList();
}

// 滚动到底部(调试类型)
function handleScrolltolowerWeightChange(e: any) {
    if (e.detail.direction === 'bottom' && weightDataList.value.length < weightTotal.value) {
        weightPage.value++;
        getAllWeightDataList();
    }
}

// 打开调试类型选择弹框
function handleLinkWeightShowChange() {
    weightShow.value = true;
    if (weightDataList.value.length === 0) {
        getAllWeightDataList();
    }
}

// 选择调试类型
function handleRadioSelectWeightChange({ value }: { value: any }) {
    const names = weightDataList.value.find((item: any) => value === item.id);
    model.pid = value;
    model.tname = names ? names.tname : '';
    weightShow.value = false;
}

// 限制权重 1-100
function handleWeightInputChange(val: any) {
    let purified = String(val.value).replace(/[^\d]/g, "");
    let n = Number(purified);
    if (isNaN(n)) {
        n = 1;
    } else {
        if (n < 1) n = 1;
        if (n > 100) n = 100;
    }
    nextTick(() => {
        model.weight = purified === '' ? '' : Number(n);
    })
}

// 获取调试任务模板基本信息
async function getDispatchInfo() {
    try {
        const data = await fetchGetDebugTaskTemplateInfo(Number(model.id));
        if (!data) {
            return;
        }
        model.pid = data.pid;
        model.tname = data.tname || '';
        model.taskName = data.taskName || '';
        model.weight = data.weight != null ? data.weight : '';
        model.notes = data.notes || '';
    } catch (error) {
        console.error('获取调试任务模板信息错误', error);
    }
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            if (valid) {
                loading.value = true;
                try {
                    // 权重为空时不提交该字段（表示不修改/不设置）
                    const weightField = model.weight !== '' && model.weight != null ? { weight: Number(model.weight) } : {};
                    if (model.id) {
                        let queryParams = [{
                            id: model.id,
                            pid: model.pid,
                            taskName: model.taskName,
                            notes: model.notes,
                            ...weightField
                        }];
                        await fetchUpdateDebugTaskTemplateInfo(queryParams);
                        uni.showToast({
                            title: '修改调试任务模板成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            pid: model.pid,
                            taskName: model.taskName,
                            notes: model.notes,
                            ...weightField
                        }];
                        await fetchSaveDebugTaskTemplateInfo(queryParams);
                        uni.showToast({
                            title: '新增调试任务模板成功',
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
                        console.error('修改调试任务模板失败', err);
                    } else {
                        console.error('新增调试任务模板失败', err);
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
        <wd-navbar left-arrow :title="model.id ? '修改调试任务模板' : '新增调试任务模板'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="调试类型" label-width="100px" prop="tname" required disabled v-model="model.tname" placeholder="请选择调试类型">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkWeightShowChange">调试类型</wd-button>
                    </template>
                </wd-input>
                <wd-input label="任务名称" label-width="100px" prop="taskName" required clearable :maxlength="64" v-model="model.taskName" placeholder="请输入任务名称（同一调试类型下唯一）" />
                <wd-input label="权重" label-width="100px" type="number" prop="weight" clearable v-model="model.weight" placeholder="请输入权重（1-100，选填）" @input="handleWeightInputChange" />
                <wd-textarea label="备注" label-width="100px" type="textarea" prop="notes" clearable :maxlength="255" v-model="model.notes" placeholder="请输入备注" />
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <!-- 调试类型选择弹框 -->
        <wd-popup closable custom-style="height: 70vh;" v-model="weightShow" position="bottom" @close="weightShow = false;">
            <wd-gap height="30rpx" />

            <wd-search v-model="weightFuzzy" placeholder="请输入调试类型名称" placeholder-left cancel-txt="搜索" @search="handleSearchWeightFuzzyChange" @cancel="handleSearchWeightFuzzyChange" @clear="handleClearWeightFuzzyChange" />

            <scroll-view scroll-y @scrolltolower="handleScrolltolowerWeightChange" style="height: calc(70vh - 220rpx);">
                <wd-radio-group v-model="model.pid" shape="dot" @change="handleRadioSelectWeightChange">
                    <wd-cell v-for="(item, index) in weightDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.tname }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}

.radioCellWrap {
    :deep(.wd-cell__wrapper) {
        display: block !important;
    }
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}
</style>
