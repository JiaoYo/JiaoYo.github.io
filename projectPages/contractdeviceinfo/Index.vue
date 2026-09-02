<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { onReady, onLoad, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { reactive, ref, nextTick, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchGetPrjDeviceInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const contractDeviceInfo = reactive<{
    id: number;
    devname: string;
    devmodel: string;
    devtype: number;
    devmanu: string;
    devcount: number;
    devunit: string;
    notes: string;
    dbtime: string;
    username: string;
}>({
    id: 0,
    devname: '',
    devmodel: '',
    devtype: 0,
    devmanu: '',
    devcount: 1,
    devunit: '',
    notes: '',
    dbtime: '',
    username: ''
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取合同设备详情
async function getContractDeviceDetailInfo() {
    try {
        const data = await fetchGetPrjDeviceInfo((contractDeviceInfo.id as any));
        console.log('data合同设备详情', data);
        contractDeviceInfo.devname = data.devname;
        contractDeviceInfo.devmodel = data.devmodel;
        contractDeviceInfo.devcount = data.devcount;
        contractDeviceInfo.devunit = data.devunit;
        contractDeviceInfo.devtype = data.devtype;
        contractDeviceInfo.devmanu = data.devmanu;
        contractDeviceInfo.notes = data.notes;
        contractDeviceInfo.username = data.username;
        contractDeviceInfo.dbtime = data.dbtime;
    } catch (err) {
        console.error('获取合同设备信息失败', err);
    }
}

onLoad((options: any) => {
    contractDeviceInfo.id = options.id;
    getContractDeviceDetailInfo();
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="设备详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft"></wd-navbar>
        <wd-gap :bg-color="isDark ? '#000000' : '#F5F5F5'"  height="30rpx" />

        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx' }">
            <view style="padding: 5rpx;">
                <wd-cell title="设备名称" :value="contractDeviceInfo.devname" custom-class="customCell" />
                <wd-cell title="设备型号" :value="contractDeviceInfo.devmodel" custom-class="customCell" />
                <wd-cell title="设备数量" :value="contractDeviceInfo.devunit ? contractDeviceInfo.devcount + contractDeviceInfo.devunit : contractDeviceInfo.devcount" custom-class="customCell" />
                <wd-cell title="是否为我司设备" custom-class="customCell">
                    <wd-tag plain round :type="contractDeviceInfo.devtype === 0 ? 'success' : contractDeviceInfo.devtype === 1 ? 'danger' : 'default'">
                        {{ contractDeviceInfo.devtype === 0 ? '是' : contractDeviceInfo.devtype === 1 ? '否' : '未知' }}
                    </wd-tag>
                </wd-cell>
                <wd-cell title="设备厂家" :value="contractDeviceInfo.devmanu" custom-class="customCell" />
                <wd-cell title="创建者" :value="contractDeviceInfo.username" custom-class="customCell" />
                <wd-cell title="创建时间" :value="contractDeviceInfo.dbtime" custom-class="customCell" />
                <wd-cell title="备注" title-width="100px" :value="contractDeviceInfo.notes ? contractDeviceInfo.notes : '无'" custom-class="customCell" />
            </view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped></style>