<script lang="ts" setup>
import { useToast } from 'wot-design-uni';
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjDispatchInfo } from '@/service/index';
import { getExtensionFromUrl, downloadFile, isImageUrl } from '@/utils/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

// 文件列表
const fileList = ref<any[]>([]);

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
    id: number | null;
    dname: string;
    dcon: string;
    provinceName: string;
    region: string;
    username: string;
    dbtime: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
}>({
    id: null,
    dname: '',
    dcon: '',
    provinceName: '',
    region: '',
    username: '',
    dbtime: '',
    fl1: '',
    fl2: '',
    fl3: '',
    fl4: '',
    re1: '',
    re2: '',
    re3: '',
    re4: ''
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取用户基本信息
async function getPrjDispatchInfo() {
    fileList.value = [];
    try {
        const data = await fetchGetPrjDispatchInfo((dataForm.id as number));
        dataForm.id = data.id;
        dataForm.dname  = data.dname;
        dataForm.dcon = data.dcon;
        dataForm.provinceName = data.provinceName;
        dataForm.username = data.username;
        dataForm.dbtime = data.dbtime;
        dataForm.fl1 = data.fl1;
        dataForm.fl2 = data.fl2;
        dataForm.fl3 = data.fl3;
        dataForm.fl4 = data.fl4;
        dataForm.re1 = data.re1;
        dataForm.re2 = data.re2;
        dataForm.re3 = data.re3;
        dataForm.re4 = data.re4;
        // 收集文件字段
        const files = [data.fl1, data.fl2, data.fl3, data.fl4].filter(Boolean),
            names = [data.re1, data.re2, data.re3, data.re4].filter(Boolean);
        files.forEach((item: any, index: number) => {
            fileList.value.push({ url: item, filename: names[index] });
        });
    } catch (err) {
        console.error('获取项目信息失败', err);
    }
}

// 预览
const handlePreviewFileChange = (url: string) => {
    if (!isImageUrl(url)) {
        // uni.navigateTo({
        //     url: '/projectPages/preview/Index?url=' + encodeURIComponent(url) + '&ext=' + getExtensionFromUrl(url).toLocaleLowerCase()
        // })
    }
}

onLoad((options: any) => {
    dataForm.id = options.id;
    getPrjDispatchInfo();
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="主站联系人详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <wd-gap :bg-color="isDark ? '#000000' : '#F8F9Fa'" height="20rpx"></wd-gap>

        <view style="display: flex; align-items: center; margin: 20rpx;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">主站联系人基本信息</view>
        </view>

        <view style="padding: 0 20rpx;">
            <wd-cell-group custom-style="padding: 5rpx; border-radius: 20rpx;">
                <wd-cell title="调度名称" title-width="110px" :value="dataForm.dname" />
                <wd-cell title="调度联系方式" title-width="110px" :value="dataForm.dcon"></wd-cell>
                <wd-cell title="省份" title-width="110px" :value="dataForm.provinceName" />
                <wd-cell title="地区" title-width="110px" :value="dataForm.region"></wd-cell>
                <wd-cell title="创建者" title-width="110px" :value="dataForm.username" />
                <wd-cell title="创建时间" title-width="110px" :value="dataForm.dbtime" />
            </wd-cell-group>
        </view>

        <view style="display: flex; align-items: center; margin: 20rpx;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">附件信息</view>
        </view>

        <view v-if="fileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
            <view v-for="(fileItem, fileIndex) in fileList" :key="fileIndex" style="padding: 20rpx;" @click="handlePreviewFileChange(fileItem.url)">
                <view class="prjInfoHeader">
                    <view class="left">
                        <wd-img :width="30" :height="30" :src="fileItem.url" v-if="isImageUrl(fileItem.url)" :preview-src="fileItem.url" :enable-preview="true" />
                        <wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(fileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(fileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />

                        <view class="filenameWrap">
                            {{ fileItem.filename }}
                            <!-- <wd-text bold :text="fileItem.filename + '1111111111111111111111111111111111111111111111111111111111111111111111'" :lines="1" size="15px" :color="isDark ? '#ffffff' : '#000000'" /> -->
                        </view>
                    </view>

                    <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(fileItem.url, null)">
                        <wd-icon name="cloud-download" size="22px"></wd-icon>
                    </view>
                </view>
            </view>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-status-tip image="../../static/search.png" tip="暂无附件信息" />
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.wd-progress__outer) {
    height: 7px !important;
    border-radius: 10px !important;
}

:deep(.wd-progress__inner) {
    border-radius: 10px !important;
}

.prjInfoHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 10rpx 0 !important;
    margin-bottom: 20rpx;

    .left {
        display: flex;
        align-items: center;
        gap: 0 20rpx;

        .filenameWrap {
            width: calc(100vw - 240rpx);
            overflow: hidden;      /* 隐藏溢出内容 */
            white-space: nowrap;   /* 强制文本不换行 */
            text-overflow: ellipsis; /* 超出部分显示省略号 */
            font-weight: bolder;
            font-size: 30rpx;
        }
    }
}
</style>
