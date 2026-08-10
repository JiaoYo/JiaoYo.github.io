<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission } from '@/utils/index';
import { onLoad, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjdailyreportInfo, fetchGetDialyCommentDataList, fetchSaveDialyCommentInfo, fetchDeleteDialyCommentInfo } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const total = ref<number>(0);
const dataList = ref<any>([]);
const scrollTop = ref<number>(0);
const commentContent = ref<string>('');
const userId = ref<number>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));

const dataForm = reactive<{
    id: number;
    page: number;
    limit: number;
    username: string;
    context: any;
    dbtime: string;
    isObject: boolean;
    fuzzy: string;
	charctras: any;
}>({
    id: 0,
    page: 1,
    limit: 100,
    username: '',
    context: null,
    dbtime: '',
    isObject: false,
    fuzzy: '',
    charctras: null
});

function handleClickLeft() {
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
    dataList.value = [];
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 获取技术支持日报列表信息
async function getPrjdailyreportInfo() {
    if (!hasPermission('project:DailyReport:select')) {
        return
    }
    try {
        const data = await fetchGetPrjdailyreportInfo(dataForm.id);
        let context = data.context;
        try {
            const parsed = JSON.parse(data.context)
            context = parsed;
        } catch (e) {
            // 不是合法 JSON，就保持原样
        }
        dataForm.dbtime = data.dbtime;
        dataForm.context = context;
        dataForm.isObject = typeof context === 'string' ? false : true;
        dataForm.username = data.username;
		dataForm.charctras = data.hasOwnProperty('charctras') ? data.charctras : null;
        dataForm.page = 1;
        getDataList();
    } catch (err) {
        console.error('获取技术支持日报列表失败', err);
    }
}

// 获取评论日报数据源
async function getDataList() {
    if (!hasPermission('project:Comment:select')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetDialyCommentDataList({ page: dataForm.page, limit: dataForm.limit, pid: dataForm.id });
        if (dataForm.page === 1) {
            dataList.value = data.list;
        } else {
            dataList.value = dataList.value.concat(data.list);
        }
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取评论日报数据源失败', err);
        state.value = 'error';
    }
}

// 评论日报提交
async function handleCommentSubmit() {
    if (!commentContent.value) {
        uni.showToast({
            icon: 'none',
            title: '请输入评论内容',
            duration: 1500
        })
        return
    }
    if (!hasPermission('project:Comment:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无评论权限，请联系管理员',
            duration: 1500
        })
        return
    }
    loading.value = true;
    try {
        const data = await fetchSaveDialyCommentInfo([{ pid: dataForm.id, context: commentContent.value }]);
        uni.showToast({
            title: '评论成功',
            icon: 'none',
            duration: 1500,
            complete: () => {
                loading.value = false;
                commentContent.value = '';
                dataForm.page = 1;
                getDataList();
            }
        });
    } catch (error) {
        console.log('error', error);
        loading.value = false;
    }
}

// 删除日报评论
async function handleDeleteCommentChange(id: number) {
    if (!hasPermission('project:Comment:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除日报评论吗?',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeleteDialyCommentInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除日报评论成功",
                duration: 1500,
                complete: async () => {
                    dataForm.page = 1;
                    getDataList();
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('删除日报评论失败', error);
    }
}

onLoad((options: any) => {
    dataForm.id = options.id;
    getPrjdailyreportInfo();
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    dataForm.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (dataList.value.length < total.value) {
        dataForm.page++;
        getDataList();
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <wd-navbar left-arrow :title="dataForm.username + '的技术支持日报'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <!-- <wd-search v-model="dataForm.fuzzy" custom-class="wdSearchContainer" placeholder="请输入技术支持日报评论内容" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
            <view style="padding: 20rpx; ">
                <view v-if="!dataForm.isObject">
                    <view style="margin-top: 20rpx; font-size: 28rpx;">当天工作内容及成果描述:</view>
                    <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataForm.context }}</view>
                </view>
                <view v-else>
                    <view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
                    <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataForm.context.proname || '无' }}</view>
                    <view style="margin: 10rpx 0; font-size: 28rpx;" v-if="dataForm.context.notes">当天工作内容及成果描述:</view>
                    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                    <view v-if="dataForm.context.notes" style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.context.notes ? dataForm.context.notes.replace(/\n/g, '<br />') : '--'"></view>
                    <view v-if="dataForm.context.problem" style="margin: 10rpx 0; font-size: 28rpx;">遇到问题:</view>
                    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component
                    <view v-if="dataForm.context.problem" style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.context.problem ? dataForm.context.problem.replace(/\n/g, '<br />') : '--'"></view>
                    <view v-if="dataForm.context.solutions" style="margin: 10rpx 0; font-size: 28rpx;">解决措施:</view>
                    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                    <view v-if="dataForm.context.solutions" style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.context.solutions ? dataForm.context.solutions.replace(/\n/g, '<br />') : '--'"></view>
                    <view v-if="dataForm.context.feedback" style="margin: 10rpx 0; font-size: 28rpx;">建议意见反馈:</view>
                    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                    <view v-if="dataForm.context.feedback" style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.context.feedback ? dataForm.context.feedback.replace(/\n/g, '<br />') : '--'"></view>
                    <view v-if="dataForm.context.summarize" style="margin: 10rpx 0; font-size: 28rpx;">（总结）自己对一天工作的感受和体感:</view>
                    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                    <view v-if="dataForm.context.summarize" style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.context.summarize ? dataForm.context.summarize.replace(/\n/g, '<br />') : '--'"></view>
					<view v-if="dataForm.charctras" style="margin-top: 20rpx; font-size: 28rpx;">字符数:</view>
					<view v-if="dataForm.charctras" style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataForm.charctras }}</view>
				</view>
            </view>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">评论</view>
        </view>

        <view v-if="dataList.length > 0">
            <view v-for="(dataItem, index) in dataList" :key="index">
                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: index === total - 1 ? '20rpx 20rpx 140rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
                    <view style="padding: 5rpx; ">
                        <wd-cell :title="dataItem.username">
                            <view style="display: flex; align-items: center; justify-content: space-between;">
                                <view style="font-size: 13px;">{{ dataItem.dbtime }}</view>
                                <wd-icon name="delete1" size="20px" color="#ff0000" v-if="hasPermission('project:Comment:delete') && (userType === 0 || userId === dataItem.creater)" @click="handleDeleteCommentChange(dataItem.id)"></wd-icon>
                            </view>
                        </wd-cell>
                        <view style="font-size: 12px; color: #00000073; word-wrap: break-word; width: calc(100vw - 100rpx); padding: 0 30rpx 10rpx;">{{ dataItem.context }}</view>
                    </view>
                </view>
            </view>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '10rpx 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', marginBottom: '200rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无评论" />
        </view>

        <wd-gap height="5rpx" />

        <view v-if="hasPermission('project:Comment:insert')" :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 80rpx)', padding: '10rpx 20rpx', background: isDark ? '#1b1b1b' : '#ffffff', position: 'fixed', left: 0, bottom: 0, borderRadius: '40rpx', margin: '20rpx' }">
            <wd-textarea clearable v-model="commentContent" :placeholder="'评论' + dataForm.username + '的技术支持日报'" no-border auto-height custom-style="width: calc(100vw - 120px)"></wd-textarea>
            <wd-button type="primary" custom-style="margin-left: 10rpx" :loading="loading" @click="handleCommentSubmit">提交</wd-button>
        </view>

        <wd-backtop :bottom="70" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.button {
    display: inline-block;
    padding: 0 11px;
    height: 100%;
    color: white;
    line-height: 42px;
}

.footer {
    margin-top: 40rpx;
}

:deep(.wd-cell__title) {
    font-weight: bolder !important;
}
</style>
