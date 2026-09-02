<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { uploadFile } from '@/utils/uploadFile';
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { fetchGetUploadFileTokenInfo, fetchSavePrjWeekreportInfo } from '@/service/index';
import { hasPermission, countLength } from '@/utils/index';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const totalCount = computed(() => countLength(prjTechnicalsupportweeklyInfo.content1 + prjTechnicalsupportweeklyInfo.content2 + prjTechnicalsupportweeklyInfo.content3 + prjTechnicalsupportweeklyInfo.content4 + prjTechnicalsupportweeklyInfo.content5));

const prjTechnicalsupportweeklyInfo = reactive({
    content1: '',
    content2: '',
    content3: '',
    content4: '',
    content5: '',
    re1: '',
    re2: '',
    file1: '',
    file2: '',
    fileList: [],
    file2List: []
})

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrjWeekly'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// APP上传文件(附件1)
async function handleUploadFile1ClickChange(data: any) {
	prjTechnicalsupportweeklyInfo.fileList = data.length > 0 ? [data[data.length - 1]] : [];
    if (prjTechnicalsupportweeklyInfo.fileList > 0) {
        let flag = true;
        for (let index = 0; index < prjTechnicalsupportweeklyInfo.fileList.length; index++) {
            if (prjTechnicalsupportweeklyInfo.fileList[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            prjTechnicalsupportweeklyInfo.fileList = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    prjTechnicalsupportweeklyInfo.fileList.forEach(async(file: any) => {
		prjTechnicalsupportweeklyInfo.re1 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     prjTechnicalsupportweeklyInfo.file1 = response.data;
        //     prjTechnicalsupportweeklyInfo.re1 = file.name;
        //     prjTechnicalsupportweeklyInfo.fileList = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除图片
async function handleRemoveFileClickChange() {
	prjTechnicalsupportweeklyInfo.re1 = "";
	prjTechnicalsupportweeklyInfo.fileList = [];
}

// APP上传文件(附件2)
async function handleUploadFile2ClickChange(data: any) {
	prjTechnicalsupportweeklyInfo.file2List = data.length > 0 ? [data[data.length - 1]] : [];
    if (prjTechnicalsupportweeklyInfo.file2List.length > 0) {
        let flag = true;
        for (let index = 0; index < prjTechnicalsupportweeklyInfo.file2List.length; index++) {
            if (prjTechnicalsupportweeklyInfo.file2List[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            prjTechnicalsupportweeklyInfo.file2List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    prjTechnicalsupportweeklyInfo.file2List.forEach(async(file: any) => {
		prjTechnicalsupportweeklyInfo.re2 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     prjTechnicalsupportweeklyInfo.file2 = response.data;
        //     prjTechnicalsupportweeklyInfo.re2 = file.name;
        //     prjTechnicalsupportweeklyInfo.file2List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件
async function handleRemoveFile2ClickChange() {
	prjTechnicalsupportweeklyInfo.re2 = "";
	prjTechnicalsupportweeklyInfo.file2List = [];
}

/**
 * 上传一组文件，确保最终每个 file 都有 url
 */
function handleUploadFileListChange(fileList: any[]): Promise<any[]> {
	if (!fileList || fileList.length === 0) {
		return Promise.resolve([]);
	}

	const tasks = fileList.map(file => {
		// 跳过无效文件
		if (!file) return Promise.resolve(file);

		// 已是线上地址，直接跳过
		if (file.url && file.url.startsWith('https://pictures.linkqi.cn')) {
			return Promise.resolve(file);
		}

		// 需要上传
		return new Promise(resolve => {
			uploadFile(
				file,
				'',
				(response, f) => {
					f.url = response.data;
					resolve(f);
				},
				(error, f) => {
					console.error('上传失败:', error);
					resolve(f); // ⚠️ 不 reject，保证后续还能执行
				}
			);
		});
	});

	return Promise.all(tasks);
}

async function handleSubmitChange() {
    try {
        if (!prjTechnicalsupportweeklyInfo.content1 && !prjTechnicalsupportweeklyInfo.content2 && !prjTechnicalsupportweeklyInfo.content3 && !prjTechnicalsupportweeklyInfo.content4 && !prjTechnicalsupportweeklyInfo.content5) {
            uni.showToast({
                title: '请输入内容',
                icon: 'none',
                duration: 1500
            });
            return false
        }
        if (!hasPermission('project:Week:insert')) {
            uni.showToast({
                title: '暂无技术支持周报权限，请联系管理员',
                icon: 'none',
                duration: 1500
            });
            return false
        }
		const [res1, res2] = await Promise.all([
			handleUploadFileListChange(prjTechnicalsupportweeklyInfo.fileList),
			handleUploadFileListChange(prjTechnicalsupportweeklyInfo.file2List)
		]);
		prjTechnicalsupportweeklyInfo.file1 = res1.length > 0 ? res1[0].url : '';
		prjTechnicalsupportweeklyInfo.file2 = res2.length > 0 ? res2[0].url : '';
        loading.value = true;
        const data = await fetchSavePrjWeekreportInfo([{ content1: prjTechnicalsupportweeklyInfo.content1, content2: prjTechnicalsupportweeklyInfo.content2, content3: prjTechnicalsupportweeklyInfo.content3, content4: prjTechnicalsupportweeklyInfo.content4, content5: prjTechnicalsupportweeklyInfo.content5, file1: prjTechnicalsupportweeklyInfo.file1, file2: prjTechnicalsupportweeklyInfo.file2, charctras: totalCount.value }]);
        uni.showToast({
            title: '提交成功',
            icon: 'none',
            duration: 2000,
            complete: () => {
                loading.value = false;
                handleClickLeft(true);
            }
        });
    } catch (error) {
        console.error('新增技术支持周报失败', error);
        loading.value = false;
    }
}

onLoad(() => {

});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="技术支持周报" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft"></wd-navbar>
        <wd-notice-bar custom-class="noticeBarWrap" :scrollable="false" :text="'您当前已输入 ' + totalCount + '个字符'" prefix="check-outline" type="info" />

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">本周完成</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="prjTechnicalsupportweeklyInfo.content1" placeholder="请输入本周完成的项目" no-border></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">本周对你帮助最大的人，具体描述一下对你的帮助</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="prjTechnicalsupportweeklyInfo.content2" placeholder="请输入本周对你帮助最大的人，具体描述一下对你的帮助"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">未完成项目</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="prjTechnicalsupportweeklyInfo.content3" placeholder="请输入未完成项目"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">下周计划</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="prjTechnicalsupportweeklyInfo.content4" placeholder="请输入下周计划"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">需协调与帮助</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="prjTechnicalsupportweeklyInfo.content5" placeholder="请输入需协调与帮助"></wd-textarea>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">图片</view>
        </view>

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-input type="text" label="图片" label-width="40px" v-model="prjTechnicalsupportweeklyInfo.re1" placeholder="请选择图片" center>
                <template #suffix>
                    <view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
						<CjxUpload v-model="prjTechnicalsupportweeklyInfo.fileList" @change="handleUploadFile1ClickChange">
							<template #default>
								<wd-button icon="cloud-upload" size="small">上传图片</wd-button>
							</template>
						</CjxUpload>
						
						<wd-icon v-if="prjTechnicalsupportweeklyInfo.re1" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFileClickChange"></wd-icon>
					</view>
                </template>
            </wd-input>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">附件</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-input type="text" label="附件" label-width="40px" v-model="prjTechnicalsupportweeklyInfo.re2" placeholder="请选择附件" center>
                <template #suffix>
					<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
						<CjxUpload v-model="prjTechnicalsupportweeklyInfo.file2List" @change="handleUploadFile2ClickChange">
							<template #default>
								<wd-button icon="cloud-upload" size="small">上传附件</wd-button>
							</template>
						</CjxUpload>
						
						<wd-icon v-if="prjTechnicalsupportweeklyInfo.re2" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile2ClickChange"></wd-icon>
					</view>	
                </template>
            </wd-input>
        </view>

        <view class="buttonWrap" v-if="hasPermission('project:Week:insert')">
            <wd-button hairline type="primary" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" :loading="loading" @click="handleSubmitChange">提交</wd-button>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
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