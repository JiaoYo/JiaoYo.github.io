<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { onReady, onLoad } from '@dcloudio/uni-app';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission, countLength } from '@/utils/index';
import { uploadFile } from '@/utils/uploadFile';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { fetchGetUploadFileTokenInfo, fetchGetPrjInfo, fetchGetPrjDataList, fetchSavePrjSummaryInfo } from '@/service/index';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const totalCount = computed(() => countLength(model.content1 + model.content2 + model.content3 + model.content4 + model.content5))

const prjShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

const loading = ref<boolean>(false);

const prjIdNameObj: Record<number, string> = {};

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const model = reactive<{
    page: number;
    total: number;
    id: number | null;
    pid: number | null;
    fuzzy: string;
    prjName: string;
    content1: string;
    content2: string;
    content3: string;
    content4: string;
    content5: string;
    re1: string;
    re2: string;
    file1: string;
    file2: string;
    prjDataList: any;
    checkedPrj: any;
    fileList: any;
    file2List: any;
}>({
    page: 1,
    total: 0,
    id: null,
    pid: null,
    fuzzy: '',
    prjName: '',
    content1: '',
    content2: '',
    content3: '',
    content4: '',
    content5: '',
    re1: '',
    re2: '',
    file1: '',
    file2: '',
    prjDataList: [],
    checkedPrj: null,
    fileList: [],
    file2List: []
})

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrjSummary'); // 通知列表页刷新
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
    if (!hasPermission('project:Info:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取项目信息权限，请联系管理员',
            duration: 1500
        })
        return false
    }
    try {
        const data = await fetchGetPrjInfo((model.pid as number));
        model.prjName = data.proname;
        model.fuzzy = data.proname;
        model.page = 1;
        getPrjDataList();
    } catch (error) {
        console.error('获取项目合同信息失败', error);
    }
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
        uni.showToast({
            icon: 'none',
            title: '暂无获取项目权限，请联系管理员',
            duration: 1500
        })
        return false
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
        if (model.pid) {
            model.checkedPrj = model.pid;
        }
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
// function handleCheckboxSelectChange({ value }: { value: any }) {
//     console.log('value', value);
//     // 获取对应名称
//     // const names = model.prjDataList.filter((item: any) => model.checkedPrj.includes(item.id)).map((item: any) => item.proname);
//     // model.prjName = names.join(", ");

//     const names = model.checkedPrj.map((id: any) => prjIdNameObj[id]).filter(Boolean);
//     model.prjName = names.join(", ");
// }

// 选择项目(单选)
function handleRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    // const names = model.prjDataList.filter((item: any) => model.checkedPrj.includes(item.id)).map((item: any) => item.proname);
    // model.prjName = names.join(", ");

    console.log('value', value);
    // 获取对应名称
    const names = model.prjDataList.find((item: any) => model.checkedPrj === item.id);
    model.prjName = names ? names.proname : '';
    prjShow.value = false;
}

// APP上传文件(附件1)
async function handleUploadFile1ClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        // for (let index = 0; index < data.length; index++) {
        //     if (data[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            model.fileList = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.file1 = response.data;
            model.re1 = file.name;
            model.fileList = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件2)
async function handleUploadFile2ClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        // for (let index = 0; index < data.length; index++) {
        //     if (data[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            model.file2List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.file2 = response.data;
            model.re2 = file.name;
            model.file2List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// 提交项目总结
async function handleSubmitChange() {
    if (!hasPermission('project:Summary:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无提交项目总结权限，请联系管理员',
            duration: 1500
        })
        return false
    }
    try {
        if (!model.prjName) {
            uni.showToast({
                title: '请输入项目名称',
                icon: 'none',
                duration: 1500
            });
            return false
        }
        if (!model.content1 && !model.content2 && !model.content3 && !model.content4 && !model.content5) {
            uni.showToast({
                title: '请输入内容',
                icon: 'none',
                duration: 1500
            });
            return false
        }
        loading.value = true;
        // let queryParams = model.checkedPrj.map((item: any) => {
        //     return {
        //         pid: item,
        //         content1: model.content1,
        //         content2: model.content2,
        //         content3: model.content3,
        //         content4: model.content4,
        //         content5: model.content5
        //     }
        // })
        let queryParams = [{
            pid: model.checkedPrj,
            content1: model.content1,
            content2: model.content2,
            content3: model.content3,
            content4: model.content4,
            content5: model.content5,
			charctras: totalCount.value
            // file1: model.file1,
            // file2: model.file2
        }];
        const data = await fetchSavePrjSummaryInfo(queryParams);
        uni.showToast({
            title: '新增项目总结成功',
            icon: 'none',
            duration: 1500,
            complete: () => {
                loading.value = false;
                handleClickLeft(true);
            }
        });
    } catch (error) {
        console.error('新增项目总结失败', error);
        loading.value = false;
    }
    // uni.showToast({
    //     title: '提交成功',
    //     icon: 'none',
    //     duration: 2000,
    //     complete: () => {
    //         handleClickLeft();
    //     }
    // });
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
    model.pid = Number(options.pid);
    if (model.pid) {
        getPrjBaseInfo();
    } else {
        getPrjDataList();
    }
});

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
			<wd-navbar left-arrow title="新增项目总结" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
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
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx' }">
            <view style="padding: 5rpx 10rpx;">
                <wd-textarea clearable readonly v-model="model.prjName" placeholder="请选择项目名称" no-border auto-height></wd-textarea>
            </view>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">前期准备阶段描述</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.content1" placeholder="请输入前期准备阶段描述" no-border></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">遇到问题及对项目的影响</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.content2" placeholder="请输入遇到问题及对项目的影响"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">经验教训与改进方案或措施</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.content3" placeholder="请输入经验教训与改进方案或措施"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">项目完工确认描述(对于进度延期需具体说明原因及改进措施)</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.content4" placeholder="请输入项目完工确认描述(对于进度延期需具体说明原因及改进措施)"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">此次项目对你帮助最大的人，具体描述一下对你的帮助</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.content5" placeholder="请输入此次项目对你帮助最大的人，具体描述一下对你的帮助"></wd-textarea>
        </view>

        <!-- <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">图片</view>
        </view>

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-input type="text" label="图片" label-width="40px" v-model="model.re1" placeholder="请选择图片" center>
                <template #suffix>
                    <CjxUpload v-model="model.fileList" :limit="1" @change="handleUploadFile1ClickChange">
                        <template #default>
                            <wd-button icon="cloud-upload" size="small">上传图片</wd-button>
                        </template>
                    </CjxUpload>
                </template>
            </wd-input>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">附件</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-input type="text" label="附件" label-width="40px" v-model="model.re2" placeholder="请选择附件" center>
                <template #suffix>
                    <CjxUpload v-model="model.file2List" :limit="1" @change="handleUploadFile2ClickChange">
                        <template #default>
                            <wd-button icon="cloud-upload" size="small">上传附件</wd-button>
                        </template>
                    </CjxUpload>
                </template>
            </wd-input>
        </view> -->

        <view class="buttonWrap" v-if="hasPermission('project:Summary:insert')">
            <wd-button hairline type="primary" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" :loading="loading" @click="handleSubmitChange">提交</wd-button>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="prjShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="model.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 330rpx);">
                <wd-radio-group v-model="model.checkedPrj" shape="dot" @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in model.prjDataList" :key="index" custom-class="radioCellWrap">
                        <wd-radio :value="item.id">{{ item.proname }}</wd-radio>
                    </wd-cell>
                </wd-radio-group>
                <!-- <wd-cell-group border>
                    <wd-checkbox-group v-model="model.checkedPrj" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(prjItem, prjIndex) in model.prjDataList" :key="prjIndex" :title="prjItem.proname" center>
                            <wd-checkbox :modelValue="prjItem.id"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group> -->
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

:deep(.wd-upload__evoke) {
    margin-left: 20rpx !important;
    margin-top: 20rpx !important;
    margin-bottom: 20rpx !important;
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

.radioCellWrap {
    padding: 0 !important;

    :deep(.wd-cell__wrapper) {
        display: block !important;
        padding: 20rpx !important;
    }
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
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