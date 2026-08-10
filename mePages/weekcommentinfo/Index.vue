<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjWeekreportInfo, fetchGetPrjWeekCommentList, fetchSavePrjWeekCommentInfo, fetchDeletePrjWeekCommentInfo } from '@/service/index';
import { getExtensionFromUrl, downloadFile, isImageUrl, hasPermission, getFileType, isSupportedFileType } from '@/utils/index';
// #ifdef APP || APP-PLUS || H5 || MP-WEIXIN
import CjxPreviewOffice from '@/uni_modules/cjx-previewOffice/components/cjx-previewOffice/cjx-previewOffice.vue';
// #endif

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const loading = ref<boolean>(false);

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

// 获取技术支持周报列表信息
async function getPrjWeeklyreportInfo() {
    if (!hasPermission('project:Week:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取技术支持周报详情权限，请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        const data = await fetchGetPrjWeekreportInfo(dataForm.id);
        dataForm.dbtime = data.dbtime;
        dataForm.content1 = data.content1 ? data.content1.replace(/\n/g, '<br />') : '--';
        dataForm.content2 = data.content2 ? data.content2.replace(/\n/g, '<br />') : '--';
        dataForm.content3 = data.content3 ? data.content3.replace(/\n/g, '<br />') : '--';
        dataForm.content4 = data.content4 ? data.content4.replace(/\n/g, '<br />') : '--';
        dataForm.content5 = data.content5 ? data.content5.replace(/\n/g, '<br />') : '--';
		dataForm.content6 = data.content6 ? data.content6.replace(/\n/g, '<br />') : '--';
		dataForm.content7 = data.content7 ? data.content7.replace(/\n/g, '<br />') : '--';
		dataForm.content8 = data.content8 ? data.content8.replace(/\n/g, '<br />') : '--';
        dataForm.file1 = data.file1 || '';
        dataForm.file2 = data.file2 || '';
        dataForm.username = data.username;
		dataForm.charctras = data.hasOwnProperty('charctras') ? data.charctras : null;
        dataForm.page = 1;
        getDataList();
    } catch (err) {
        console.error('获取技术支持周报列表失败', err);
    }
}

// 获取评论周报数据源
async function getDataList() {
    if (!hasPermission('project:Week:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取技术支持周报评论权限，请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetPrjWeekCommentList({ page: dataForm.page, limit: dataForm.limit, pid: dataForm.id });
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取评论周报数据源失败', err);
        state.value = 'error';
    }
}

// 评论周报提交
async function handleCommentSubmit() {
    if (!commentContent.value) {
        uni.showToast({
            icon: 'none',
            title: '请输入评论内容',
            duration: 1500
        })
        return false
    }
    if (!hasPermission('project:Week:Comment:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无技术支持周报评论权限, 请联系管理员',
            duration: 1500
        })
        return false
    }
    loading.value = true;
    try {
        const data = await fetchSavePrjWeekCommentInfo([{ pid: dataForm.id, content: commentContent.value }]);
        uni.showToast({
            title: '评论成功',
            icon: 'none',
            duration: 1500,
            complete: () => {
                loading.value = false;
                commentContent.value = '';
                getDataList();
            }
        });
    } catch (error) {
        console.log('error', error);
        loading.value = false;
    }
}

// 删除周报评论
async function handleDeleteCommentChange(id: number) {
    if (!hasPermission('project:Week:Comment:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该周报评论吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjWeekCommentInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除周报评论成功",
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
        console.error('删除周报评论失败', error);
    }
}

onLoad((options: any) => {
    dataForm.id = options.id;
    getPrjWeeklyreportInfo();
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
		
        <wd-navbar left-arrow :title="dataForm.username + '的技术支持周报'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <!-- <wd-search v-model="dataForm.fuzzy" custom-class="wdSearchContainer" placeholder="请输入技术支持周报评论内容" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '20rpx' }">
			<view style="margin-top: 20rpx; font-size: 28rpx;">本周完成:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content1"></view>
			<view style="margin-top: 20rpx; font-size: 28rpx;">本周对比帮助最大的人，具体描述一下对你的帮助:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content2"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">未完成项目:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content3"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">下周计划:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content4"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">需协调与帮助:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content5"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">本周做的比较好的:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content6"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">自己哪些需要提升:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content7"></view>
			<view style="margin: 10rpx 0; font-size: 28rpx;">下个阶段的目标:</view>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
			<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="dataForm.content8"></view>
			<view v-if="dataForm.charctras" style="margin-top: 20rpx; font-size: 28rpx;">字符数:</view>
			<view v-if="dataForm.charctras" style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataForm.charctras }}</view>
			
			<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; margin-top: 20rpx;" v-if="dataForm.file1">
				<view style="width: 5px; height: 15px; background: #0055FE;"></view>
				<view style="margin-left: 10rpx; font-weight: bolder;">图片</view>
			</view>

			<view v-if="dataForm.file1" style="padding: 20rpx 0;">
				<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 20rpx;">
					<view>
						<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(dataForm.file1)">
							<wd-img :width="30" :height="30" :src="dataForm.file1" :preview-src="dataForm.file1" :enable-preview="true" />
							<view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ dataForm.file1.split("?")[1] }}</view>
						</view>

						<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(dataForm.file1)">
							<wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(dataForm.file1)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(dataForm.file1)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(dataForm.file1)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(dataForm.file1)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(dataForm.file1)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(dataForm.file1)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							<CjxPreviewOffice
								ref="previewOfficeRef"
								:value="dataForm.file1"
								:name="dataForm.file1.split('?')[1]"
								:type="getFileType(dataForm.file1)"
							>
								<view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ dataForm.file1.split("?")[1] }}</view>
							</CjxPreviewOffice>
						</view>
					</view>
					<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(dataForm.file1, null)">
						<wd-icon name="cloud-download" size="22px"></wd-icon>
					</view>
				</view>
			</view>

			<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; margin-top: 20rpx;" v-if="dataForm.file2">
				<view style="width: 5px; height: 15px; background: #0055FE;"></view>
				<view style="margin-left: 10rpx; font-weight: bolder;">附件</view>
			</view>

			<view v-if="dataForm.file2" style="padding: 20rpx 0;">
				<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 20rpx;">
					<view>
						<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(dataForm.file2)">
							<wd-img :width="30" :height="30" :src="dataForm.file2" :preview-src="dataForm.file2" :enable-preview="true" />
							<view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ dataForm.file2.split("?")[1] }}</view>
						</view>

						<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(dataForm.file2)">
							<wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(dataForm.file2)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(dataForm.file2)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(dataForm.file2)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(dataForm.file2)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(dataForm.file2)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(dataForm.file2)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							<CjxPreviewOffice
								ref="previewOfficeRef"
								:value="dataForm.file2"
								:name="dataForm.file2.split('?')[1]"
								:type="getFileType(dataForm.file2)"
							>
								<view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ dataForm.file2.split("?")[1] }}</view>
							</CjxPreviewOffice>
						</view>
					</view>
					<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(dataForm.file2, null)">
						<wd-icon name="cloud-download" size="22px"></wd-icon>
					</view>
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

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '10rpx 20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', marginBottom: '200rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无评论" />
        </view>

        <wd-gap height="5rpx" />

        <view v-if="hasPermission('project:Week:Comment:insert')" :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 80rpx)', padding: '10rpx 20rpx', background: isDark ? '#1b1b1b' : '#ffffff', position: 'fixed', left: 0, bottom: 0, borderRadius: '40rpx', margin: '20rpx' }">
            <wd-textarea clearable v-model="commentContent" :placeholder="'评论' + dataForm.username + '的技术支持周报'" no-border auto-height custom-style="width: calc(100vw - 120px)"></wd-textarea>
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
