<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetMaterialWeightInfo, fetchSaveMaterialWeightInfo, fetchUpdateMaterialWeightInfo } from '@/service/projectMaterial';
import { fetchGetProjectMaterialPage } from '@/service/projectMaterial';
import { fetchGetPrjWeightDataList } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const model = reactive<{
    id: number | null;
    mid: any;
    midLabel: string;
    wid: any;
    widLabel: string;
}>({
    id: null,
    mid: null,
    midLabel: '',
    wid: null,
    widLabel: ''
});

const rules: FormRules = {
    midLabel: [
        {
            required: true,
            message: '请选择物料',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择物料');
                }
            }
        },
    ],
    widLabel: [
        {
            required: true,
            message: '请选择权重类型',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择权重类型');
                }
            }
        },
    ],
};

// ===== 物料选择弹框 =====
const materialShow = ref<boolean>(false);
const materialDataList = ref<any>([]);
const materialPage = ref<number>(1);
const materialTotal = ref<number>(0);
const materialFuzzy = ref<string>('');

// ===== 权重类型选择弹框 =====
const weightShow = ref<boolean>(false);
const weightDataList = ref<any>([]);
const weightPage = ref<number>(1);
const weightTotal = ref<number>(0);
const weightFuzzy = ref<string>('');

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListMaterialWeight', model); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取物料数据源
async function getAllMaterialDataList() {
    if (materialPage.value === 1) {
        materialDataList.value = [];
    }
    try {
        const data = await fetchGetProjectMaterialPage({ page: materialPage.value, limit: 50, fuzzy: materialFuzzy.value });
        materialDataList.value = materialDataList.value.concat(data.list);
        materialTotal.value = Number(data.total);
    } catch (error) {
        console.error('获取物料数据源失败', error);
    }
}

// 搜索/清除物料
function handleSearchMaterialFuzzyChange() {
    materialPage.value = 1;
    getAllMaterialDataList();
}

function handleClearMaterialFuzzyChange() {
    materialFuzzy.value = '';
    materialPage.value = 1;
    getAllMaterialDataList();
}

// 滚动到底部(物料)
function handleScrolltolowerMaterialChange(e: any) {
    if (e.detail.direction === 'bottom' && materialDataList.value.length < materialTotal.value) {
        materialPage.value++;
        getAllMaterialDataList();
    }
}

// 打开物料选择弹框
function handleLinkMaterialShowChange() {
    materialShow.value = true;
    if (materialDataList.value.length === 0) {
        getAllMaterialDataList();
    }
}

// 选择物料
function handleRadioSelectMaterialChange({ value }: { value: any }) {
    const names = materialDataList.value.find((item: any) => value === item.id);
    model.mid = value;
    model.midLabel = names ? `${names.devno} / ${names.devname}` : '';
    materialShow.value = false;
}

// 获取权重类型数据源
async function getAllWeightDataList() {
    if (weightPage.value === 1) {
        weightDataList.value = [];
    }
    try {
        const data = await fetchGetPrjWeightDataList({ page: weightPage.value, limit: 50, fuzzy: weightFuzzy.value });
        weightDataList.value = weightDataList.value.concat(data.list);
        weightTotal.value = Number(data.total);
    } catch (error) {
        console.error('获取权重类型数据源失败', error);
    }
}

// 搜索/清除权重类型
function handleSearchWeightFuzzyChange() {
    weightPage.value = 1;
    getAllWeightDataList();
}

function handleClearWeightFuzzyChange() {
    weightFuzzy.value = '';
    weightPage.value = 1;
    getAllWeightDataList();
}

// 滚动到底部(权重类型)
function handleScrolltolowerWeightChange(e: any) {
    if (e.detail.direction === 'bottom' && weightDataList.value.length < weightTotal.value) {
        weightPage.value++;
        getAllWeightDataList();
    }
}

// 打开权重类型选择弹框
function handleLinkWeightShowChange() {
    weightShow.value = true;
    if (weightDataList.value.length === 0) {
        getAllWeightDataList();
    }
}

// 选择权重类型
function handleRadioSelectWeightChange({ value }: { value: any }) {
    const names = weightDataList.value.find((item: any) => value === item.id);
    model.wid = value;
    model.widLabel = names ? `${names.tname}（${names.weight}）` : '';
    weightShow.value = false;
}

// 获取物料权重关系基本信息
async function getDispatchInfo() {
    try {
        const data = await fetchGetMaterialWeightInfo(Number(model.id));
        if (!data) {
            return;
        }
        model.mid = data.mid;
        model.midLabel = data.devno ? `${data.devno} / ${data.devname || ''}` : '';
        model.wid = data.wid;
        model.widLabel = data.tname ? `${data.tname}（${data.weight != null ? data.weight : '--'}）` : '';
    } catch (error) {
        console.error('获取物料权重信息错误', error);
    }
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            if (valid) {
                loading.value = true;
                try {
                    if (model.id) {
                        let queryParams = [{
                            id: model.id,
                            mid: model.mid,
                            wid: model.wid
                        }];
                        await fetchUpdateMaterialWeightInfo(queryParams);
                        uni.showToast({
                            title: '修改物料权重成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            mid: model.mid,
                            wid: model.wid
                        }];
                        await fetchSaveMaterialWeightInfo(queryParams);
                        uni.showToast({
                            title: '新增物料权重成功',
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
                        console.error('修改物料权重失败', err);
                    } else {
                        console.error('新增物料权重失败', err);
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
        <wd-navbar left-arrow :title="model.id ? '修改物料权重' : '新增物料权重'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="物料" label-width="100px" prop="midLabel" required disabled v-model="model.midLabel" placeholder="请选择物料">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkMaterialShowChange">物料</wd-button>
                    </template>
                </wd-input>
                <wd-input label="权重类型" label-width="100px" prop="widLabel" required disabled v-model="model.widLabel" placeholder="请选择权重类型">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkWeightShowChange">权重类型</wd-button>
                    </template>
                </wd-input>
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <!-- 物料选择弹框 -->
        <wd-popup closable custom-style="height: 70vh;" v-model="materialShow" position="bottom" @close="materialShow = false;">
            <wd-gap height="30rpx" />

            <wd-search v-model="materialFuzzy" placeholder="请输入物料编码/名称" placeholder-left cancel-txt="搜索" @search="handleSearchMaterialFuzzyChange" @cancel="handleSearchMaterialFuzzyChange" @clear="handleClearMaterialFuzzyChange" />

            <scroll-view scroll-y @scrolltolower="handleScrolltolowerMaterialChange" style="height: calc(70vh - 220rpx);">
                <wd-radio-group v-model="model.mid" shape="dot" @change="handleRadioSelectMaterialChange">
                    <wd-cell v-for="(item, index) in materialDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.devno }} / {{ item.devname }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>

        <!-- 权重类型选择弹框 -->
        <wd-popup closable custom-style="height: 70vh;" v-model="weightShow" position="bottom" @close="weightShow = false;">
            <wd-gap height="30rpx" />

            <wd-search v-model="weightFuzzy" placeholder="请输入权重类型名称" placeholder-left cancel-txt="搜索" @search="handleSearchWeightFuzzyChange" @cancel="handleSearchWeightFuzzyChange" @clear="handleClearWeightFuzzyChange" />

            <scroll-view scroll-y @scrolltolower="handleScrolltolowerWeightChange" style="height: calc(70vh - 220rpx);">
                <wd-radio-group v-model="model.wid" shape="dot" @change="handleRadioSelectWeightChange">
                    <wd-cell v-for="(item, index) in weightDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.tname }}（{{ item.weight }}）</wd-radio>
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
