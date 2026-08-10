<script lang="ts" setup>
import { onReady, onLoad } from '@dcloudio/uni-app';
import { reactive, ref, computed, nextTick, onMounted } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { v4 as uuidv4 } from "uuid";
import { hasPermission, countLength } from '@/utils/index';
import { fetchGetPrjInfo, fetchGetPrjDataList, fetchSavePrjdailyreportInfo, fetchGetPrjdailyreportDetailInfo, fetchSavePrjDialyInfo } from '@/service/index';

const form = ref();
const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const totalCount = computed(() => countLength(model.content + model.problem + model.precautions + model.feedback + model.summarize));

const prjIdNameObj: Record<number, string> = {};

const prjForm = reactive({
    id: 0
})

const prjShow = ref<boolean>(false);

const uuid = ref<string>(uuidv4());

const triggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const model = reactive<{
    page: number;
    total: number;
    fuzzy: string;
    prjDataList: any;
    checkedPrj: any;
    prjName: string;
    content: string;
    problem: string;
    precautions: string;
    feedback: string;
    summarize: string;
}>({
    page: 1,
    total: 0,
    fuzzy: '',
    prjDataList: [],
    checkedPrj: [],
    prjName: '',
    content: '',
    problem: '',
    precautions: '',
    feedback: '',
    summarize: ''
})

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

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrjDaily'); // 通知列表页刷新
    }
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
    model.prjName = data.proname;
    model.fuzzy = data.proname;
    model.page = 1;
    getPrjDataList();
}

// 打开弹出层
function handleLinkPrjShowChange() {
    prjShow.value = true;
}

// 清除
function handleClearChange() {
    model.page = 1;
    getPrjDataList();
}

// 搜索
function handleSearchChange() {
    model.page = 1;
    getPrjDataList();
}

// 获取项目分页数据
async function getPrjDataList() {
    if (!hasPermission('project:Info:select')) {
        return
    }
    if (model.page === 1) {
        model.prjDataList = [];
    }
    try {
        const data = await fetchGetPrjDataList({ page: model.page, limit: 50, fuzzy: model.fuzzy });
        model.total = Number(data.total);
        model.prjDataList = model.prjDataList.concat(data.list);
        model.prjDataList.forEach((item: any) => {
            prjIdNameObj[item.id] = item.proname;
        });
    } catch (error) {
        console.error('获取项目分页数据失败', error);
    }
}

// 刷新
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

// 选择项目
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    // const names = model.prjDataList.filter((item: any) => model.checkedPrj.includes(item.id)).map((item: any) => item.proname);
    // model.prjName = names.join(", ");
    const names = model.checkedPrj.map((id: any) => prjIdNameObj[id]).filter(Boolean);
    model.prjName = names.join(", ");
}

// 清除选择项
function handleClearPrjChange() {
    model.prjName = '';
    model.checkedPrj = [];
}

async function handleSubmitChange() {
    // if (!model.prjName) {
    //     uni.showToast({
    //         icon: 'none',
    //         title: '请输入项目名称',
    //         duration: 1500
    //     })
    //     return false
    // }
    if (!model.content) {
        uni.showToast({
            icon: 'none',
            title: '请输入当天工作内容及成果描述',
            duration: 1500
        })
        return false
    }
    if (!hasPermission('project:DailyReport:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无权限，请联系管理员',
            duration: 1500
        })
        return false
    }
    loading.value = true;
    try {
        // 获取对应名称
        let queryParams = prjForm.id ? [{
            pid: prjForm.id,
            context: JSON.stringify({
                proname: model.prjName,
                notes: model.content,
                problem: model.problem,
                solutions: model.precautions,
                feedback: model.feedback,
                summarize: model.summarize,
            }),
            uuid: uuid.value,
            charctras: totalCount.value
        }] : [{
            context: JSON.stringify({
                proname: model.prjName,
                notes: model.content,
                problem: model.problem,
                solutions: model.precautions,
                feedback: model.feedback,
                summarize: model.summarize,
            }),
            uuid: uuid.value,
            charctras: totalCount.value
        }];
        const data = await fetchSavePrjdailyreportInfo(queryParams);
        if (model.checkedPrj && model.checkedPrj.length > 0) {
            getPrjdailyreportIdByUUID();
        } else {
            uni.showToast({
                title: '新增技术支持日报成功',
                icon: 'none',
                duration: 1500,
                complete: () => {
                    loading.value = false;
                    handleClickLeft(true);
                }
            });
        }
    } catch (err) {
        console.error('新增技术支持日报失败', err);
        loading.value = false;
    }
}

// 根据uuid获取最新增加的id
async function getPrjdailyreportIdByUUID() {
    const data = await fetchGetPrjdailyreportDetailInfo(uuid.value);
    handleSavePrjdailyInfo(data);
}

// 保存pid与日报id
async function handleSavePrjdailyInfo(did: number) {
    let queryParams = model.checkedPrj.map((item: any) => {
        return {
            did,
            pid: item
        }
    })
    const data = await fetchSavePrjDialyInfo(queryParams);
    uni.showToast({
        title: '新增技术支持日报成功',
        icon: 'none',
        duration: 1500,
        complete: () => {
            loading.value = false;
            handleClickLeft(true);
        }
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
                    console.log('topFixedHeight', topFixedHeight.value);
                }
            })
            .exec();
    } catch (err) {
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onReady(() => {
	recalcTopFixedHeight();
})

onLoad((options: any) => {
    if (options.pid) {
        prjForm.id = options.pid;
        model.checkedPrj = [Number(prjForm.id)];
        getPrjBaseInfo();
    } else {
        getPrjDataList();
    }
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
			<wd-navbar left-arrow title="技术支持日报" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
			<wd-notice-bar custom-class="noticeBarWrap" :scrollable="false" :text="'您当前已输入 ' + totalCount + '个字符'" prefix="check-outline" type="info" />
		</view>
       
        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
            <view style="display: flex; align-items: center;">
                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                <view style="margin-left: 10rpx; font-weight: bolder;">项目名称</view>
            </view>
            <view>
                <wd-button icon="link" size="small"  @click="handleLinkPrjShowChange">关联项目</wd-button>
            </view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 20rpx', borderRadius: '20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
            <wd-textarea clearable readonly v-model="model.prjName" placeholder="请选择项目名称" no-border auto-height custom-class="dailyLinkedPrjWrap"></wd-textarea>
            <wd-button v-if="model.prjName" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearPrjChange"></wd-button>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">当天工作内容及成果描述</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.content" placeholder="请输入当天工作内容及成果描述"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">遇到问题</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.problem" placeholder="请输入遇到问题"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">解决措施</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.precautions" placeholder="请输入解决措施"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">建议意见反馈</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.feedback" placeholder="请输入建议意见反馈"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">（总结）自己对一天工作的感受和体感</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.summarize" placeholder="请输入（总结）自己对一天工作的感受和体感"></wd-textarea>
        </view>

        <view class="buttonWrap">
            <wd-button hairline type="primary" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" :loading="loading" @click="handleSubmitChange">提交</wd-button>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="prjShow" position="left" @close="handleCloseChange">
            <!-- <view v-for="(item, index) in model.prjDataList" :key="index" class="custom-txt">
                {{ item.proname }}
            </view> -->
            <wd-gap height="70rpx" />

            <wd-search v-model="model.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 330rpx);">
                <wd-cell-group border>
                    <wd-checkbox-group v-model="model.checkedPrj" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(prjItem, prjIndex) in model.prjDataList" :key="prjIndex" :title="prjItem.proname" center>
                            <wd-checkbox :modelValue="prjItem.id"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>
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
	z-index: 99;
	background-color: #FFFFFF;
	/* 保证内联元素正确换行 */
	box-sizing: border-box;
	/* 可选：微阴影让固定区更明显 */
	/* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
}
	
.buttonWrap {
    display: flex;
    justify-content: center;
    align-items: center;
    width: calc(100vw - 40rpx);
    margin: 30rpx 40rpx 30rpx 0;
    padding: 0 0 40rpx 20rpx;
}

.darkButtonWrap {
    width: 100% !important;
}

.lightButtonWrap {
    width: 100% !important;
}

:deep(.wd-cell__left) {
    flex: 6 !important;
}

.dailyLinkedPrjWrap {
    width: calc(100% - 100rpx) !important;

    :deep(.wd-textarea__inner) {
        padding-left: 20rpx !important;
    }
}

.noticeBarWrap {
	border-radius: 0 !important;
}

.wot-theme-dark {
	:deep(.wd-notice-bar) {
		color: #F0F0F0 !important;
		background: #332b1f !important;
	}
}
</style>