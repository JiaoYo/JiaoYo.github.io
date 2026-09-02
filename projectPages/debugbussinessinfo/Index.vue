<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetDebugBusinessInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';
// import { getExtensionFromUrl, downloadFile, isImageUrl } from '@/utils/index';
import { getExtensionFromUrl, downloadFile, isImageUrl, hasPermission, getFileType, isSupportedFileType } from '@/utils/index';
// #ifdef APP || APP-PLUS || H5 || MP-WEIXIN
import CjxPreviewOffice from '@/uni_modules/cjx-previewOffice/components/cjx-previewOffice/cjx-previewOffice.vue';
// #endif

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

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

const model = reactive<{
    id: number | null;
    debugname: string;
    docker: string;
    dockcharge: string;
    dockcontact: string;
    debugresult: string;
    status: number;
    notes: string;
    username: string;
    dbtime: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    dbusername: string;
    tname: string;
    starttime: string;
    endtime: string;
    ckusername: string;
    ckdbtime: string;
    dtype: number;
}>({
    id: null,
    debugname: '',
    docker: '',
    dockcharge: '',
    dockcontact: '',
    debugresult: '',
    status: 0,
    notes: '',
    username: '',
    dbtime: '',
    re1: '',
    re2: '',
    re3: '',
    re4: '',
    fl1: '',
    fl2: '',
    fl3: '',
    fl4: '',
    dbusername: '',
    tname: '',
    starttime: '',
    endtime: '',
    ckusername: '',
    ckdbtime: '',
    dtype: 0
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

async function getDebuggerBusinessInfo() {
    try {
        const data = await fetchGetDebugBusinessInfo((model.id as number));
        model.debugname = data.debugname;
        model.docker = data.docker;
        model.dockcharge = data.dockcharge;
        model.dockcontact = data.dockcontact;
        model.debugresult = data.debugresult;
        model.status = data.status;
        model.notes = data.notes;
        model.username = data.username;
        model.dbtime = data.dbtime;
        model.re1 = data.re1;
        model.re2 = data.re2;
        model.re3 = data.re3;
        model.re4 = data.re4;
        model.fl1 = data.fl1;
        model.fl2 = data.fl2;
        model.fl3 = data.fl3;
        model.fl4 = data.fl4;
        model.dbusername = data.dbusername;
        model.tname = data.tname;
        model.starttime = data.starttime;
        model.endtime = data.endtime;
        model.ckusername = data.ckusername || '';
        model.ckdbtime = data.ckdbtime || '';
        model.dtype = data.dtype;
    } catch (error) {
        console.error('获取调试业务失败:', error);
    }
}

// 预览
const handlePreviewFileChange = (url: string) => {
    // uni.navigateTo({
    //     url: '/projectPages/preview/Index?url=' + encodeURIComponent(url) + '&ext=' + getExtensionFromUrl(url).toLocaleLowerCase()
    // })
}

onLoad((options: any) => {
    model.id = options.id;
    getDebuggerBusinessInfo();
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="调试业务详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
            <view style="padding: 5rpx;">
                <wd-cell title="业务名称" :value="model.debugname" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="对接方" :value="model.docker" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="对接方负责人" :value="model.dockcharge" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="联系方式" :value="model.dockcontact" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="调试工程师" :value="model.dbusername" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="类型名称" :value="model.tname" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="权重" :value="model.dtype" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="起止时间" :value="model.starttime + '~' + model.endtime" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="调试结果" :value="model.debugresult" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="状态" custom-class="customCell" ellipsis>
                    <wd-tag :type="model.status === -1 ? 'warning' : model.status === 0 ? 'default' : model.status === 1 ? 'primary' : model.status === 2 ? 'warning' : model.status === 3 ? 'success' : 'default'" round>
                        {{ model.status === -1 ? '申请中' : model.status === 0 ? '待调试' : model.status === 1 ? '实施中' : model.status === 2 ? '待审核' : model.status === 3 ? '审核完成' : '未知' }}
                    </wd-tag>
                </wd-cell>
                <wd-cell v-if="model.status === 3" title="审核人" :value="model.ckusername" custom-class="customCell" ellipsis />
                <wd-cell v-if="model.status === 3" title="审核时间" :value="model.ckdbtime" custom-class="customCell" ellipsis />
                <wd-cell title="备注" :value="model.notes" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="创建者" :value="model.username" custom-class="customCell" ellipsis />
                <wd-cell title="创建时间" :value="model.dbtime" custom-class="customCell" ellipsis />
            </view>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;" v-if="model.fl1 || model.fl2 || model.fl3 || model.fl4">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">文件</view>
        </view>

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',margin: '0 20rpx 20rpx', borderRadius: '20rpx' }" v-if="model.fl1">
            <view style="padding: 20rpx;">
                <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;">
                    <view style="width: 200rpx;">附件1</view>
                    <view>
                        <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(model.fl1)">
                            <wd-img :width="30" :height="30" :src="model.fl1" :preview-src="model.fl1" :enable-preview="true" />
                            <view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ model.re1 ? model.re1 : model.fl1.split("?")[1] }}</view>
                        </view>

                        <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(model.fl1)">
                            <wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(model.fl1)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(model.fl1)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(model.fl1)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(model.fl1)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(model.fl1)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(model.fl1)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
                            <CjxPreviewOffice
                                ref="previewOfficeRef"
                                :value="model.fl1"
                                :name="model.fl1"
                                :type="getFileType(model.fl1)"
                            >
                                <view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ model.re1 ? model.re1 : model.fl1.split("?")[1] }}</view>
                            </CjxPreviewOffice>
                        </view>
                    </view>
                    <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(model.fl1, null)">
                        <wd-icon name="cloud-download" size="22px"></wd-icon>
                    </view>
                </view>
            </view>
        </view>

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',margin: '0 20rpx 20rpx', borderRadius: '20rpx' }" v-if="model.fl2">
            <view style="padding: 20rpx;">
                <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;">
                    <view style="width: 200rpx;">附件2</view>
                    <view>
                        <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(model.fl2)">
                            <wd-img :width="30" :height="30" :src="model.fl2" :preview-src="model.fl2" :enable-preview="true" />
                            <view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ model.re2 ? model.re2 : model.fl2.split("?")[1] }}</view>
                        </view>

                        <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(model.fl2)">
                            <wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(model.fl2)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(model.fl2)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(model.fl2)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(model.fl2)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(model.fl2)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(model.fl2)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
                            <CjxPreviewOffice
                                ref="previewOfficeRef"
                                :value="model.fl2"
                                :name="model.fl2"
                                :type="getFileType(model.fl2)"
                            >
                                <view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ model.re2 ? model.re2 : model.fl2.split("?")[1] }}</view>
                            </CjxPreviewOffice>
                        </view>
                    </view>
                    <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(model.fl2, null)">
                        <wd-icon name="cloud-download" size="22px"></wd-icon>
                    </view>
                </view>
            </view>
        </view>

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',margin: '0 20rpx 20rpx', borderRadius: '20rpx' }" v-if="model.fl3">
            <view style="padding: 20rpx;">
                <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;">
                    <view style="width: 200rpx;">附件3</view>
                    <view>
                        <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(model.fl3)">
                            <wd-img :width="30" :height="30" :src="model.fl3" :preview-src="model.fl3" :enable-preview="true" />
                            <view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ model.re3 ? model.re3 : model.fl3.split("?")[1] }}</view>
                        </view>

                        <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(model.fl3)">
                            <wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(model.fl3)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(model.fl3)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(model.fl3)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(model.fl3)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(model.fl3)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(model.fl3)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
                            <CjxPreviewOffice
                                ref="previewOfficeRef"
                                :value="model.fl3"
                                :name="model.fl3"
                                :type="getFileType(model.fl3)"
                            >
                                <view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ model.re3 ? model.re3 : model.fl3.split("?")[1] }}</view>
                            </CjxPreviewOffice>
                        </view>
                    </view>
                    <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(model.fl3, null)">
                        <wd-icon name="cloud-download" size="22px"></wd-icon>
                    </view>
                </view>
            </view>
        </view>

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',margin: '0 20rpx 20rpx', borderRadius: '20rpx' }" v-if="model.fl4">
            <view style="padding: 20rpx;">
                <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;">
                    <view style="width: 200rpx;">附件4</view>
                    <view>
                        <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;" v-if="isImageUrl(model.fl4)">
                            <wd-img :width="30" :height="30" :src="model.fl4" :preview-src="model.fl4" :enable-preview="true" />
                            <view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ model.re4 ? model.re4 : model.fl4.split("?")[1] }}</view>
                        </view>

                        <view style="display: flex; justify-content: center; align-items: center; gap: 0 20rpx;" v-if="isSupportedFileType(model.fl4)">
                            <wd-img :width="30" :height="30" :src="extIconMap[getExtensionFromUrl(model.fl4)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(model.fl4)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(model.fl4)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(model.fl4)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(model.fl4)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(model.fl4)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
                            <CjxPreviewOffice
                                ref="previewOfficeRef"
                                :value="model.fl4"
                                :name="model.fl4"
                                :type="getFileType(model.fl4)"
                            >
                                <view style="word-wrap: break-word; width: calc(100vw - 340rpx);">{{ model.re4 ? model.re4 : model.fl4.split("?")[1] }}</view>
                            </CjxPreviewOffice>
                        </view>
                    </view>
                    <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(model.fl4, null)">
                        <wd-icon name="cloud-download" size="22px"></wd-icon>
                    </view>
                </view>
            </view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20rpx 0 !important;
    width: calc(100vw - 80rpx);

    .left {
        width: 26px;
        height: 26px;
        margin-right: 20rpx;
    }

    .right {
        display: flex;
        flex-direction: column;
    }
}
</style>