<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchGetPrjInfo, fetchGetPrjDataList, fetchSavePrjdailyreportInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const prjForm = reactive({
    id: 0
})

const prjShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

const model = reactive<{
    page: number;
    total: number;
    prjDataList: any;
    checkedPrj: any;
    proname: string;
    percent: string;
    notes: string;
    problem: string;
    solutions: string;
    feedback: string;
    summarize: string;
}>({
    page: 1,
    total: 0,
    prjDataList: [],
    checkedPrj: [],
    proname: '',
    percent: '',
    notes: '',
    problem: '',
    solutions: '',
    feedback: '',
    summarize: ''
});

const rules: FormRules = {
    proname: [
        {
            required: true,
            message: '请输入项目名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入项目名称');
                }
            }
        },
    ],
    percent: [
        {
            required: true,
            message: '请输入当前项目进度百分比',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入当前项目进度百分比');
                }
            }
        },
    ],
    notes: [
        {
            required: true,
            message: '请输入当天工作内容及成果描述',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入当天工作内容及成果描述');
                }
            }
        },
    ],
};

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取项目信息
async function getPrjBaseInfo() {
    const data = await fetchGetPrjInfo((prjForm.id as number));
    model.proname = data.proname;
}

// 打开弹出层
function handleLinkPrjShowChange() {
    model.page = 1;
    getPrjDataList();
}

// 获取项目分页数据
async function getPrjDataList() {
    try {
        if (!hasPermission('project:Info:select')) {
            uni.showToast({
                icon: 'none',
                title: '暂无项目插叙权限, 请联系管理员',
                duration: 1500
            })
            return
        }
        if (model.page === 1) {
            model.prjDataList = [];
        }
        const data = await fetchGetPrjDataList({ page: model.page, limit: 100 });
        model.total = Number(data.total);
        model.prjDataList = model.prjDataList.concat(data.list);
        prjShow.value = true;
    } catch (error) {
        console.error('获取项目列表数据失败', error);
    }
}

// 项目刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    model.page = 1;
    getPrjDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.prjDataList.length < model.total) {
        model.page++;
        getPrjDataList();
    }
}

// 关闭弹出层
function handleCloseChange() {
    prjShow.value = false;
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                try {
                    loading.value = true;
                    // 获取对应名称
                    const names = model.prjDataList.filter((item: any) => model.checkedPrj.includes(item.id)).map((item: any) => item.proname);
                    let queryParams = [{
                        pid: prjForm.id,
                        context: JSON.stringify({
                            proname: model.proname,
                            percent: model.percent,
                            notes: model.notes,
                            problem: model.problem,
                            solutions: model.solutions,
                            feedback: model.feedback,
                            summarize: model.summarize
                        })
                    }];
                    const data = await fetchSavePrjdailyreportInfo(queryParams);
                    uni.showToast({
                        title: '新增项目周期成功',
                        icon: 'none',
                        duration: 1500,
                        complete: () => {
                            loading.value = false;
                            handleClickLeft();
                        }
                    });
                } catch (err) {
                    loading.value = false;
                    console.error('新增项目周期失败', err);
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

onLoad((options: any) => {
    prjForm.id = options.pid;
    model.checkedPrj = [Number((prjForm.id))];
    getPrjBaseInfo();
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="技术支持日报" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="项目名称" label-width="100px" prop="proname" required disabled v-model="model.proname" placeholder="请选择项目">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkPrjShowChange">关联项目</wd-button>
                    </template>
                </wd-input>
                <wd-input label="当前项目进度百分比" label-width="100px" type="number" prop="percent" clearable v-model="model.percent" placeholder="请输入当前项目进度百分比" />
                <wd-textarea label="当天工作内容及成果描述" label-width="100px" type="textarea" prop="notes" clearable v-model="model.notes" placeholder="请输入当天工作内容及成果描述" />
                <wd-textarea label="遇到问题" label-width="100px" type="textarea" prop="problem" clearable v-model="model.problem" placeholder="请输入遇到的问题" />
                <wd-textarea label="解决措施" label-width="100px" type="textarea" prop="solutions" clearable v-model="model.solutions" placeholder="请输入解决措施" />
                <wd-textarea label="建议意见反馈" label-width="100px" type="textarea" prop="feedback" clearable v-model="model.feedback" placeholder="请输入建议意见反馈" />
                <wd-textarea label="（总结）自己对一天工作的感受和体感" label-width="100px" type="textarea" prop="summarize" clearable v-model="model.summarize" placeholder="请输入（总结）自己对一天工作的感受和体感" />
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup v-model="prjShow" position="left" @close="handleCloseChange">
            <scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="margin-top: 90rpx;">
                <!-- <view v-for="(item, index) in model.prjDataList" :key="index" class="custom-txt">
                    {{ item.proname }}
                </view> -->
                <wd-cell-group border>
                    <wd-checkbox-group v-model="model.checkedPrj">
                        <wd-cell v-for="(prjItem, prjIndex) in model.prjDataList" :key="prjIndex" :title="prjItem.proname" center>
                            <view class="custom-txt">
                                <wd-checkbox :modelValue="prjItem.id" custom-style="margin: 0;"></wd-checkbox>
                            </view>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>
            </scroll-view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}

.custom-txt {
    color: black;
    width: 40vw;
}
</style>