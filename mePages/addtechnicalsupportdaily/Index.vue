<script lang="ts" setup>
import { onReady, onLoad } from '@dcloudio/uni-app';
import { reactive, ref, computed, nextTick, onMounted } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { v4 as uuidv4 } from "uuid";
import { hasPermission, countLength, getSystemDate } from '@/utils/index';
import { fetchGetPrjInfo, fetchGetPrjDataList, fetchSavePrjdailyreportInfo,fetchGetPrjdailyreportInfo, fetchSavePrjdailyreportSupInfo, fetchUpdatePrjdailyreportInfo, fetchGetPrjdailyreportDetailInfo, fetchSavePrjDialyInfo } from '@/service/index';

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

// 是否补录模式（从列表页「补录」按钮进入）
const isMakeup = ref<boolean>(false);

// 补录日期选择器值（时间戳，初始为昨天）
const dbtimePicker = ref<number>(getSystemDate(5, getSystemDate(0, null, -1)));

// 补录日期范围：前7天内（不含今天）
const dbtimeMinDate = computed(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 7);
    return d.getTime();
});
const dbtimeMaxDate = computed(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 1);
    return d.getTime() + 24 * 60 * 60 * 1000 - 1;
});

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const model = reactive<{
    id: number;
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
    dbtime: string;
    // 编辑时 context 为数组（补录多项目等历史数据）：项目名称变选择器，可切换项目，工作内容随之变化
    prjList: any[];
    prjIndex: number;
}>({
    id: 0,
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
    summarize: '',
    dbtime: '',
    prjList: [],
    prjIndex: 0
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

// 补录日期确认
function handleDbtimeConfirm({ value }: { value: any }) {
    const ts = Array.isArray(value) ? value[0] : value;
    model.dbtime = String(getSystemDate(0, ts ?? dbtimePicker.value));
}

// 获取项目信息
async function getPrjBaseInfo() {
    const data = await fetchGetPrjInfo((prjForm.id as number));
    model.prjName = data.proname;
    model.fuzzy = data.proname;
    model.page = 1;
    getPrjDataList();
}

// 编辑模式：加载日报详情并回填表单（项目名称锁定，不可修改）
async function getPrjDailyReportInfo() {
    try {
        const data = await fetchGetPrjdailyreportInfo(model.id);
        let context = data.context;
        try {
            const parsed = JSON.parse(data.context);
            context = parsed;
        } catch (e) {
            // 不是合法 JSON，就保持原样
        }
        // context 可能是字符串 / 单个对象 / 对象数组（补录多项目等历史数据）
        // 数组形式：项目名称变选择器，可选各项目并切换工作内容；其他字段（问题/措施/反馈/总结）默认取第一个项目的值
        if (Array.isArray(context) && context.length) {
            model.prjList = context;
            model.prjIndex = 0;
            const first = context[0] || {};
            model.prjName = first.proname || '';
            model.content = Array.isArray(first.notes) ? (first.notes[0] || '') : (first.notes || '');
            model.problem = Array.isArray(first.problem) ? (first.problem[0] || '') : (first.problem || '');
            model.precautions = Array.isArray(first.solutions) ? (first.solutions[0] || '') : (first.solutions || '');
            model.feedback = Array.isArray(first.feedback) ? (first.feedback[0] || '') : (first.feedback || '');
            model.summarize = Array.isArray(first.summarize) ? (first.summarize[0] || '') : (first.summarize || '');
            return;
        }
        model.prjList = [];
        model.prjIndex = 0;
        if (context && typeof context === 'object') {
            model.prjName = context.proname || '';
            model.content = Array.isArray(context.notes) ? (context.notes[0] || '') : (context.notes || '');
            model.problem = Array.isArray(context.problem) ? (context.problem[0] || '') : (context.problem || '');
            model.precautions = Array.isArray(context.solutions) ? (context.solutions[0] || '') : (context.solutions || '');
            model.feedback = Array.isArray(context.feedback) ? (context.feedback[0] || '') : (context.feedback || '');
            model.summarize = Array.isArray(context.summarize) ? (context.summarize[0] || '') : (context.summarize || '');
        } else {
            model.content = String(context || '');
        }
    } catch (err) {
        console.error('获取日报详情失败', err);
    }
}

// context 为数组时的项目选择器列：每项即一个项目名称
const prjColumns = computed(() =>
    model.prjList.map((p: any, i: number) => ({
        value: i,
        label: (p && p.proname) ? p.proname : ('项目' + (i + 1)),
    }))
);

// 切换项目：项目名称 + 工作内容成果描述跟随所选项目，其他字段保持取第一个项目的值
function handlePrjChange({ value }: { value: any }) {
    const idx = Number(value);
    const item = model.prjList[idx];
    if (!item) return;
    model.prjIndex = idx;
    model.prjName = item.proname || '';
    model.content = Array.isArray(item.notes) ? (item.notes[0] || '') : (item.notes || '');
}

// 当天工作内容绑定：prjList 命中当前项目时读写该项 notes，其余情况（新增/单项目历史数据/详情未返回）读写 model.content，
// 避免 prjList 为空时模板取 prjList[prjIndex].notes 报 undefined（v-model 不支持 ?. 写法，用 computed 兜底）
const contentModel = computed({
    get: () => {
        const item = model.prjList[model.prjIndex];
        if (!item) return model.content;
        const n = item.notes;
        return Array.isArray(n) ? (n[0] || '') : (n || '');
    },
    set: (v: string) => {
        const item = model.prjList[model.prjIndex];
        if (item) item.notes = v;
        model.content = v;
    }
});

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
    // 必填校验：每一项都需要填写
    const requiredFields: Array<{ value: string; title: string }> = [
        { value: model.content, title: '请输入当天工作内容及成果描述' },
        { value: model.problem, title: '请输入遇到问题' },
        { value: model.precautions, title: '请输入解决措施' },
        // { value: model.feedback, title: '请输入建议意见反馈' },
        // { value: model.summarize, title: '请输入（总结）自己对一天工作的感受和体感' },
    ];
    for (const item of requiredFields) {
        if (!item.value) {
            uni.showToast({
                icon: 'none',
                title: item.title,
                duration: 1500
            })
            return false
        }
    }
        if (totalCount.value < 30) {
            uni.showToast({
                icon: 'none',
                title: '总字数不能少于30字，请继续填写',
                duration: 1500
            })
            return false
        }
    // // 建议意见反馈、（总结）自己对一天工作的感受和体感 至少输入 10 个字符
    // const minLengthFields: Array<{ value: string; title: string }> = [
    //     { value: model.feedback, title: '建议意见反馈输入长度不够' },
    //     { value: model.summarize, title: '总结输入长度不够' },
    // ];
    // for (const item of minLengthFields) {
    //     if (countLength(item.value) < 10) {
    //         uni.showToast({
    //             icon: 'none',
    //             title: item.title,
    //             duration: 1500
    //         })
    //         return false
    //     }
    // }
    // 补录模式：补录日期必填（未点确认时取选择器当前选中值，默认昨天）
    if (isMakeup.value && !model.dbtime) {
        model.dbtime = String(getSystemDate(0, dbtimePicker.value));
    }
    if (isMakeup.value && !model.dbtime) {
        uni.showToast({
            icon: 'none',
            title: '请选择补录日期',
            duration: 1500
        })
        return false
    }
    // 补录模式：补录日期仅限前7天内（不含今天）
    if (isMakeup.value) {
        // 按本地时间解析 YYYY-MM-DD，避免 new Date('YYYY-MM-DD') 按 UTC 解析导致边界日期判断错位
        const parts = String(model.dbtime).split('-').map(Number);
        const dbtimeTs = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        if (dbtimeTs < dbtimeMinDate.value || dbtimeTs > dbtimeMaxDate.value) {
            uni.showToast({
                icon: 'none',
                title: '补录日期只能选择前7天内的日期（不含今天）',
                duration: 1500
            })
            return false
        }
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
    if (isMakeup.value) {
        // 补录：直接调补录接口，projectIds 传项目id数组，多传 dbtime，不走 getPrjdailyreportIdByUUID
        try {
            const queryParams = {
                projectIds: model.checkedPrj,
                context: JSON.stringify({
                    proname: model.prjName,
                    notes: model.content,
                    problem: model.problem,
                    solutions: model.precautions,
                    feedback: model.feedback,
                    summarize: model.summarize,
                }),
                uuid: uuid.value,
                charctras: totalCount.value,
                // 后端按年月日时分秒接收，补录日期补充时分秒 00:00:00
                dbtime: model.dbtime + ' 00:00:00',
            };
            await fetchSavePrjdailyreportSupInfo(queryParams);
            uni.showToast({
                title: '补录技术支持日报成功',
                icon: 'none',
                duration: 1500,
                complete: () => {
                    loading.value = false;
                    handleClickLeft(true);
                }
            });
        } catch (err) {
            console.error('补录技术支持日报失败', err);
            loading.value = false;
        }
        return;
    }
    if (model.id) {
        // 编辑模式：仅更新日报内容，项目关联保持不变
        try {
            const queryParams = [{
                id: model.id,
                context: JSON.stringify(model.prjList.length > 0 ? model.prjList.map((item:any) => ( {
                    proname: item.proname,
                    notes: item.notes,
                    problem: model.problem,
                    solutions: model.precautions,
                    feedback: model.feedback,
                    summarize: model.summarize,
                })
                ):
                {
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
            await fetchUpdatePrjdailyreportInfo(queryParams);
            uni.showToast({
                title: '修改技术支持日报成功',
                icon: 'none',
                duration: 1500,
                complete: () => {
                    loading.value = false;
                    handleClickLeft(true);
                }
            });
        } catch (err) {
            console.error('修改技术支持日报失败', err);
            loading.value = false;
        }
        return;
    }
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

onLoad(async (options: any) => {
  console.log(options,'options')
    // dtype === 2（无需调试）项目禁止所有子项的增删改
    if (options.pid) {
        try {
            const prjData = await fetchGetPrjInfo(Number(options.pid));
            if (Number(prjData.dtype) === 2) {
                uni.showToast({ title: '无需调试项目禁止子项操作', icon: 'none' });
                setTimeout(() => { uni.navigateBack(); }, 800);
                return;
            }
        } catch (error) {
            console.error('获取项目信息失败', error);
        }
    }
    if (options.id) {
        // 编辑模式：加载日报详情回填，项目不可修改
        model.id = Number(options.id);
        getPrjDailyReportInfo();
    }
    if (options.makeup) {
        isMakeup.value = true;
        // 默认已选中昨天的补录日期，同步到 model.dbtime，避免未点确认直接提交时提示「请选择补录日期」
        model.dbtime = String(getSystemDate(0, dbtimePicker.value));
    }
    if (options.pid) {
        prjForm.id = options.pid;
        model.checkedPrj = [Number(prjForm.id)];
        getPrjBaseInfo();
    } else if (!model.id) {
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
			<wd-navbar left-arrow :title="model.id ? '编辑技术支持日报' : (isMakeup ? '补录技术支持日报' : '技术支持日报')" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
			<wd-notice-bar custom-class="noticeBarWrap" :scrollable="false" :text="'您当前已输入 ' + totalCount + '个字符'" prefix="check-outline" type="info" />
		</view>
       
        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
            <view style="display: flex; align-items: center;">
                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                <view style="margin-left: 10rpx; font-weight: bolder;">项目名称</view>
            </view>
            <view>
                <wd-button v-if="!model.id" icon="link" size="small"  @click="handleLinkPrjShowChange">关联项目</wd-button>
            </view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 20rpx', borderRadius: '20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
            <!-- context 为数组（补录多项目）：项目名称变下拉选择器，切换后工作内容成果描述随之变化 -->
            <wd-select-picker v-if="model.prjList.length > 1" :columns="prjColumns" v-model="model.prjIndex" @confirm="handlePrjChange" :show-confirm="false" type="radio" :z-index="100" placeholder="请选择项目名称" custom-style="flex: 1; min-width: 0;">
                <template #default>
                    <view class="prjSelectorCell">
                        <text class="prjSelectorName">{{ model.prjName || '请选择项目名称' }}</text>
                        <text class="prjSelectorIndex">{{ (model.prjIndex + 1) + '/' + model.prjList.length }}</text>
                        <wd-icon name="arrow-right" size="16px" color="#999999" />
                    </view>
                </template>
            </wd-select-picker>
            <wd-textarea v-else clearable readonly v-model="model.prjName" placeholder="请选择项目名称" no-border auto-height custom-class="dailyLinkedPrjWrap"></wd-textarea>
            <wd-button v-if="model.prjName && !model.id" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearPrjChange"></wd-button>
        </view>

        <view v-if="isMakeup" style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;"><text class="requiredStar">*</text>补录日期</view>
        </view>
        <view v-if="isMakeup" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-datetime-picker v-model="dbtimePicker" type="date" :min-date="dbtimeMinDate" :max-date="dbtimeMaxDate" custom-style="padding: 5rpx 20rpx;" @confirm="handleDbtimeConfirm" />
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;"><text class="requiredStar">*</text>当天工作内容及成果描述</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="contentModel" placeholder="请输入当天工作内容及成果描述"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;"><text class="requiredStar">*</text>遇到问题</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.problem" placeholder="请输入遇到问题"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;"><text class="requiredStar">*</text>解决措施</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.precautions" placeholder="请输入解决措施"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">
            建议意见反馈</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.feedback" placeholder="请输入建议意见反馈"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">
            （总结）自己对一天工作的感受和体感</view>
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

.requiredStar {
    color: #ff4d4f;
    margin-right: 4rpx;
    font-size: 28rpx;
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

/* 编辑多项目日报：项目下拉选择器 cell 内容 */
.prjSelectorCell {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    padding: 16rpx 0;
}

.prjSelectorIndex {
    flex-shrink: 0;
    margin-left: 12rpx;
    font-size: 28rpx;
    font-weight: bolder;
    color: #0055FE;
}

.prjSelectorName {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 28rpx;
    color: v-bind("isDark ? '#ffffff' : '#333333'");
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