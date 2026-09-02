<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetDebugEquipmentInfo } from '@/service/index';
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
    devname: string;
    devmodel: string;
    devnum: number;
    notes: string;
    username: string;
    dbtime: string;
    etype: number;
    devmanu: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    status: number;
    dusername: string;
    ddbtime: string;
}>({
    id: null,
    devname: '',
    devmodel: '',
    devnum: 1,
    notes: '',
    username: '',
    dbtime: '',
    etype: 0,
    devmanu: '',
    re1: '',
    re2: '',
    re3: '',
    re4: '',
    fl1: '',
    fl2: '',
    fl3: '',
    fl4: '',
    status: 0,
    dusername: '',
    ddbtime: ''
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
        const data = await fetchGetDebugEquipmentInfo((model.id as number));
        console.log('data调试设备详情', data);
        model.devname = data.devname;
        model.devmodel = data.devmodel;
        model.devnum = data.devnum;
        model.notes = data.notes;
        model.username = data.username;
        model.dbtime = data.dbtime;
        model.etype = data.etype;
        model.devmanu = data.devmanu;
        model.re1 = data.re1;
        model.re2 = data.re2;
        model.re3 = data.re3;
        model.re4 = data.re4;
        model.fl1 = data.fl1;
        model.fl2 = data.fl2;
        model.fl3 = data.fl3;
        model.fl4 = data.fl4;
        model.status = data.status;
        model.dusername = data.dusername;
        model.ddbtime = data.ddbtime;
    } catch (error) {
        console.error('获取调试设备失败:', error);
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
        <wd-navbar left-arrow title="调试设备详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
            <view style="padding: 5rpx;">
                <wd-cell title="设备名称" :value="model.devname" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="型号" :value="model.devmodel" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="数量" :value="model.devnum" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="备注" :value="model.notes" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="是否为我司设备" custom-class="customCell" ellipsis>
                    <wd-tag :type="model.etype === 0 ? 'success' : model.status === 1 ? 'danger' : 'success'" round>
                        {{ model.etype === 0 ? '是' : model.status === 1 ? '否' : '是' }}
                    </wd-tag>
                </wd-cell>
                <wd-cell title="设备厂家" :value="model.devmanu" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="清点状态" custom-class="customCell" ellipsis>
                    <wd-tag :type="model.status === 3 || model.status === 4 ? 'danger' : model.status === 2 ? 'warning' : 'primary'" round>
                        {{ model.status === 0 ? '未清点' : model.status === 1 ? '正常' : model.status === 2 ? '增补' : model.status === 3 ? '退货' : model.status === 4 ? '换货' : '未清点' }}
                    </wd-tag>
                </wd-cell>
                <wd-cell title="备注" :value="model.notes" custom-class="customCell" ellipsis></wd-cell>
                <wd-cell title="创建者" :value="model.username" custom-class="customCell" ellipsis />
                <wd-cell title="创建时间" :value="model.dbtime" custom-class="customCell" ellipsis />
                <wd-cell title="清点人" :value="model.dusername" custom-class="customCell" ellipsis />
                <wd-cell title="清点时间" :value="model.ddbtime" custom-class="customCell" ellipsis />
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