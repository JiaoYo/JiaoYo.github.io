<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjSummaryInfo, fetchGetPrjSummaryCommentList, fetchSavePrjSummaryCommentInfo, fetchDeletePrjSummaryCommentInfo } from '@/service/index';
import { getExtensionFromUrl, downloadFile, isImageUrl, hasPermission, getFileType, isSupportedFileType } from '@/utils/index';
import CjxPreviewOffice from '@/uni_modules/cjx-previewOffice/components/cjx-previewOffice/cjx-previewOffice.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const total = ref<number>(0);
const dataList = ref<any>([]);
const scrollTop = ref<number>(0);
const commentContent = ref<string>('');
const userId = ref<number>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));

const extIconMap: Record<string, number> = {
    "docx": 0,
    "DOCX": 0,
    "pdf": 1,
    "PDF": 1,
    "xlsx": 2,
    "XLSX": 2,
    'xls': 2,
    "XLS": 2,
    "rar":  3,
    "RAR":  3,
    "tar":  4,
    "TAR":  4,
    "tar.gz": 4,
    "TAR.GZ": 4,
    "gz": 4,
    "ppt": 5,
    "PPT": 5,
    "pptx": 5,
    "PPTX": 5,
    "txt": 6,
    "TXT": 6,
    "7z": 3,
    "7Z": 3,
};

const dataForm = reactive<{
    id: number;
    page: number;
    limit: number;
    proname: string;
    username: string;
    content1: any;
    content2: any;
    content3: any;
    content4: any;
    content5: any;
    file1: any;
    file2: any;
    dbtime: string;
    fuzzy: string;
	charctras: any;
}>({
    id: 0,
    page: 1,
    limit: 100,
    proname: '',
    username: '',
    content1: '',
    content2: '',
    content3: '',
    content4: '',
    content5: '',
    file1: '',
    file2: '',
    dbtime: '',
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

// 获取项目总结列表信息
async function getPrjSummryInfo() {
    if (!hasPermission('project:Summary:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取项目总结信息权限，请联系管理员',
            duration: 1500
        })
        return false
    }
    try {
        const data = await fetchGetPrjSummaryInfo(dataForm.id);
        dataForm.dbtime = data.dbtime;
        dataForm.content1 = data.content1 ? data.content1.replace(/\n/g, '<br />') : '';
        dataForm.content2 = data.content2 ? data.content2.replace(/\n/g, '<br />') : '';
        dataForm.content3 = data.content3 ? data.content3.replace(/\n/g, '<br />') : '';
        dataForm.content4 = data.content4 ? data.content4.replace(/\n/g, '<br />') : '';
        dataForm.content5 = data.content5 ? data.content5.replace(/\n/g, '<br />') : '';
        dataForm.file1 = data.file1 || '';
        dataForm.file2 = data.file2 || '';
        dataForm.username = data.username;
        dataForm.proname = data.proname ? data.proname : '';
		dataForm.charctras = data.hasOwnProperty('charctras') ? data.charctras : null;
        dataForm.page = 1;
        getDataList();
    } catch (err) {
        console.error('获取项目总结列表失败', err);
    }
}

// 获取评论项目总结数据源
async function getDataList() {
    if (!hasPermission('project:Summary:Comment:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取评论项目总结权限，请联系管理员',
            duration: 1500
        })
        return false
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetPrjSummaryCommentList({ page: dataForm.page, limit: dataForm.limit, pid: dataForm.id });
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取评论项目总结数据源失败', err);
        state.value = 'error';
    }
}

// 评论项目总结提交
async function handleCommentSubmit() {
    if (!hasPermission('project:Summary:Comment:insert')) {
        uni.showToast({
            title: '暂无评论项目总结权限，请联系管理员',
            icon: 'none',
            duration: 1500
        });
        return false
    }
    if (!commentContent.value) {
        uni.showToast({
            title: '请输入评论内容',
            icon: 'none',
            duration: 1500
        });
        return false
    }
    const data = await fetchSavePrjSummaryCommentInfo([{ pid: dataForm.id, content: commentContent.value }]);
    uni.showToast({
        title: '评论成功',
        icon: 'none',
        duration: 1500,
        complete: () => {
            commentContent.value = '';
            getDataList();
        }
    });
}

// 删除项目总结评论
async function handleDeleteCommentChange(id: number) {
    if (!hasPermission('project:Summary:Comment:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该项目总结评论吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjSummaryCommentInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除项目总结评论成功",
                duration: 1500,
                complete: async () => {
                    // dataForm.page = 1;
                    getDataList();
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('删除项目总结评论失败', error);
    }
}

onLoad((options: any) => {
    dataForm.id = options.id;
    getPrjSummryInfo();
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
		
        <wd-navbar left-arrow :title="dataForm.username + '的项目总结'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <!-- <wd-search v-model="dataForm.fuzzy" custom-class="wdSearchContainer" placeholder="请输入" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '20rpx' }">
			<view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
			<view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataForm.proname }}</view>
			<view style="margin-top: 20rpx; font-size: 28rpx;">前期准备阶段描述:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content1"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">遇到问题及对项目的影响:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content2"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">经验教训与改进方案或措施:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content3"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">项目完工确认描述(对于进度延期需具体说明原因及改进措施):</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content4"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">此次项目对你帮助最大的人，具体描述一下对你的帮助:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content5"></view>
			<view v-if="dataForm.charctras" style="margin-top: 20rpx; font-size: 28rpx;">字符数:</view>
			<view v-if="dataForm.charctras" style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataForm.charctras }}</view>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">评论</view>
        </view>

        <view v-if="dataList.length > 0">
            <view v-for="(dataItem, index) in dataList" :key="index">
                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: index === total - 1 ? '20rpx 20rpx 140rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
                    <view style="padding: 5rpx; ">
                        <wd-cell :title="dataItem.username" :value="dataItem.dbtime">
                            <view style="display: flex; align-items: center; justify-content: space-between;">
                                <view style="font-size: 13px;">{{ dataItem.dbtime }}</view>
                                <wd-icon name="delete1" size="20px" color="#ff0000" v-if="hasPermission('project:Comment:delete') && (userType === 0 || userId === dataItem.creater)" @click="handleDeleteCommentChange(dataItem.id)"></wd-icon>
                            </view>
                        </wd-cell>
                        <view style="font-size: 12px; color: #00000073; word-wrap: break-word; width: calc(100vw - 100rpx); padding: 0 30rpx 10rpx;">{{ dataItem.content }}</view>
                    </view>
                </view>
            </view>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '10rpx 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', marginBottom: '200rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无评论" />
        </view>

        <wd-gap height="5rpx" />

        <view v-if="hasPermission('project:Summary:Comment:insert')" :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 80rpx)', padding: '10rpx 20rpx', background: isDark ? '#1b1b1b' : '#ffffff', position: 'fixed', left: 0, bottom: 0, borderRadius: '40rpx', margin: '20rpx' }">
            <wd-textarea clearable v-model="commentContent" :placeholder="'评论' + dataForm.username + '的项目总结'" no-border auto-height custom-style="width: calc(100vw - 120px)"></wd-textarea>
            <wd-button type="primary" custom-style="margin-left: 10rpx" @click="handleCommentSubmit">提交</wd-button>
        </view>

        <wd-backtop :bottom="70" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.button {
    display: inline-block;
    padding: 0 20rpx;
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
