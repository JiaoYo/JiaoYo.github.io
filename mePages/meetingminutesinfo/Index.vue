<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetMeetingMinutesInfo } from '@/service/index';
import { getExtensionFromUrl, downloadFile, isImageUrl, hasPermission, getFileType, isSupportedFileType } from '@/utils/index';
import CjxPreviewOffice from '@/uni_modules/cjx-previewOffice/components/cjx-previewOffice/cjx-previewOffice.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const mettingminutesInfo: Record<number, string> = {
    0: '技术部每日例会',
    1: '技术部周例会',
    2: '研发周例会(网络安全)',
    3: '研发周例会(数据通讯)',
    4: '生产部周例会',
    5: '销售周例会',
    6: '管理层周例会'
};

const extIconMap: Record<string, number> = {
    "docx": 0,
    "DOCX": 0,
    "pdf": 1,
    "PDF": 1,
    "xlsx": 2,
    "XLSX": 2,
    'xls': 2,
    "XLS": 2,
    "rar": 3,
    "RAR": 3,
    "tar": 4,
    "TAR": 4,
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
    username: string;
    mtopic: string;
    con1: string;
    con2: any;
    con3: string;
    mdbtime: string;
    mtype: number;
    musers: string;
    fl1: any;
    fl2: any;
    fl3: any;
    dbtime: string;
}>({
    id: 0,
    username: '',
    mtopic: '',
    con1: '',
    con2: [],
    con3: '',
    mdbtime: '',
    mtype: 0,
    musers: '',
    fl1: '',
    fl2: '',
    fl3: '',
    dbtime: ''
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取会议纪要列表信息
async function getPrjMettingminutesInfo() {
    if (!hasPermission('project:Meeting:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取会议纪要详情权限，请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        const data = await fetchGetMeetingMinutesInfo(dataForm.id);
        dataForm.mtopic = data.mtopic;
        dataForm.dbtime = data.dbtime;
        dataForm.con1 = data.con1 || '';
        dataForm.con2 = data.mtype === 0 ? data.con2 ? JSON.parse(data.con2) || {} : '' : data.con2;
        dataForm.con3 = data.con3 || '';
        dataForm.mdbtime = data.mdbtime || '';
        dataForm.mtype = data.mtype;
        dataForm.musers = data.musers || '';
        dataForm.fl1 = data.fl1 || '';
        dataForm.fl2 = data.fl2 || '';
        dataForm.fl3 = data.fl3 || '';
        dataForm.username = data.username;
    } catch (err) {
        console.error('获取会议纪要列表失败', err);
    }
}

onLoad((options: any) => {
    dataForm.id = options.id;
    getPrjMettingminutesInfo();
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="会议纪要详情" safe-area-inset-top placeholder fixed :bordered="false"
            @click-left="handleClickLeft" />

        <view
            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
            <view style="padding: 20rpx; ">
                <view>
                    <view style="margin-top: 20rpx; font-size: 28rpx;">标题:</view>
                    <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataForm.mtopic }}</view>
                    <view style="margin-top: 20rpx; font-size: 28rpx;">会议时间:</view>
                    <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataForm.mdbtime }}</view>
                    <view style="margin: 10rpx 0; font-size: 28rpx;">会议类型:</view>
                    <view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;">{{ mettingminutesInfo[dataForm.mtype] }}</view>
                    <view style="margin: 10rpx 0; font-size: 28rpx;">参会人员:</view>
                    <view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;">{{ dataForm.musers }}</view>
                    <view style="margin: 10rpx 0; font-size: 28rpx;">会议内容:</view>

                    <view v-if="dataForm.mtype === 0">
                        <view
                            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 120rpx)', marginBottom: '20rpx', padding: '0 20rpx 10rpx', border: '1px dashed #cccccc', borderRadius: '20rpx', overflow: 'hidden' }"
                            v-for="(item, index) in dataForm.con2" :key="index">
                            <view style="margin-top: 20rpx; font-size: 28rpx;">调试人员:</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ item.person }}</view>
                            <view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ item.proname }}</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx;">工作描述:</view>
                            <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;" v-html="item.desc.replace(/\n/g, '<br />')"></view>
                            <view style="margin: 10rpx 0; font-size: 28rpx;">遇到的问题:</view>
                            <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;" v-html="item.problem.replace(/\n/g, '<br />')"></view>
                        </view>
                    </view>

                    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
                    <view v-else :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 120rpx)', marginBottom: '20rpx', padding: '20rpx', border: '1px dashed #cccccc', borderRadius: '20rpx', overflow: 'hidden' }" v-html="dataForm.con2.replace(/\n/g, '<br />')"></view>

					<!-- <view style="margin: 10rpx 0; font-size: 28rpx;">备注:</view>
					<view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;">{{ dataForm.con1 || '无' }}</view> -->

                    <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;" v-if="dataForm.fl1">
                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                        <view style="margin-left: 10rpx; font-weight: bolder;">附件1</view>
                    </view>

                    <view
                        :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 100rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx', padding: '20rpx 0' }"
                        v-if="dataForm.fl1">
						<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 20rpx;">
							<view>
								<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(dataForm.fl1)">
									<wd-img :width="30" :height="30" :src="dataForm.fl1" :preview-src="dataForm.fl1" :enable-preview="true" />
									<view style="word-wrap: break-word; width: calc(100vw - 300rpx);">{{ dataForm.fl1.split("?")[1] }}</view>
								</view>

								<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(dataForm.fl1)">
									<wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(dataForm.fl1)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(dataForm.fl1)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(dataForm.fl1)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png' : extIconMap[getExtensionFromUrl(dataForm.fl1)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(dataForm.fl1)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(dataForm.fl1)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
									<CjxPreviewOffice ref="previewOfficeRef" :value="dataForm.fl1"
										:name="dataForm.fl1.split('?')[1]" :type="getFileType(dataForm.fl1)">
										<view style="word-wrap: break-word; width: calc(100vw - 300rpx);">{{ dataForm.fl1.split("?")[1] }}</view>
									</CjxPreviewOffice>
								</view>
							</view>
							<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(dataForm.fl1, null)">
								<wd-icon name="cloud-download" size="22px"></wd-icon>
							</view>
						</view>
                    </view>

                    <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;" v-if="dataForm.fl2">
                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                        <view style="margin-left: 10rpx; font-weight: bolder;">附件2</view>
                    </view>

                    <view
                        :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 100rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx', padding: '20rpx 0' }"
                        v-if="dataForm.fl2">
						<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 20rpx;">
							<view>
								<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(dataForm.fl2)">
									<wd-img :width="30" :height="30" :src="dataForm.fl2" :preview-src="dataForm.fl2" :enable-preview="true" />
									<view style="word-wrap: break-word; width: calc(100vw - 300rpx);">{{ dataForm.fl2.split("?")[1] }}</view>
								</view>

								<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(dataForm.fl2)">
									<wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(dataForm.fl2)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(dataForm.fl2)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(dataForm.fl2)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png' : extIconMap[getExtensionFromUrl(dataForm.fl2)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(dataForm.fl2)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(dataForm.fl2)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
									<CjxPreviewOffice ref="previewOfficeRef" :value="dataForm.fl2"
										:name="dataForm.fl2.split('?')[1]" :type="getFileType(dataForm.fl2)">
										<view style="word-wrap: break-word; width: calc(100vw - 300rpx);">{{
											dataForm.fl2.split("?")[1] }}</view>
									</CjxPreviewOffice>
								</view>
							</view>
							<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(dataForm.fl2, null)">
								<wd-icon name="cloud-download" size="22px"></wd-icon>
							</view>
						</view>
                    </view>

                    <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;" v-if="dataForm.fl3">
                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                        <view style="margin-left: 10rpx; font-weight: bolder;">附件3</view>
                    </view>

                    <view
                        :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 100rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx', padding: '20rpx 0' }"
                        v-if="dataForm.fl3">
						<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 20rpx;">
							<view>
								<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(dataForm.fl3)">
									<wd-img :width="30" :height="30" :src="dataForm.fl3" :preview-src="dataForm.fl3" :enable-preview="true" />
									<view style="word-wrap: break-word; width: calc(100vw - 300rpx);">{{ dataForm.fl3.split("?")[1] }}</view>
								</view>

								<view style="display: flex; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(dataForm.fl3)">
									<wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(dataForm.fl3)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(dataForm.fl3)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(dataForm.fl3)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png' : extIconMap[getExtensionFromUrl(dataForm.fl3)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(dataForm.fl3)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(dataForm.fl3)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
									<CjxPreviewOffice ref="previewOfficeRef" :value="dataForm.fl3"
										:name="dataForm.fl3.split('?')[1]" :type="getFileType(dataForm.fl3)">
										<view style="word-wrap: break-word; width: calc(100vw - 300rpx);">{{
											dataForm.fl3.split("?")[1] }}</view>
									</CjxPreviewOffice>
								</view>
							</view>
							<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(dataForm.fl3, null)">
								<wd-icon name="cloud-download" size="22px"></wd-icon>
							</view>
						</view>
                    </view>
                </view>
            </view>
        </view>

        <wd-gap height="20rpx"></wd-gap>
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
