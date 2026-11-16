<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { onLoad, onUnload, onPullDownRefresh, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { reactive, ref, nextTick, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import {
    fetchGetPrjContractInfo,
    fetchGetPrjByContractInfo,
    fetchGetContractInfoDevice,
} from '@/service/index';

const { themeVars, theme } = useTheme();
const message = useMessage();
const isDark = computed(() => theme.value === 'dark');
const activeTab = ref(0);
const scrollTop = ref(0);
const projectLoading = ref(false);
const deviceLoading = ref(false);

const tabsList = computed(() => [
    { title: '合同概览', value: 0 },
    { title: '关联项目(' + contractInfo.projectInfoPojoList.length + ')', value: 1 },
    { title: '设备列表(' + contractInfo.deviceDataList.length + ')', value: 2 },
]);

const dataForm = reactive({
    projectPage: 1,
    projectTotal: 0,
    devicePage: 1,
    deviceTotal: 0,
});

interface DeviceItem {
    id?: number;
    devname?: string;
    devmodel?: string;
    devtype?: number;
    devmanu?: string;
    devcount?: number | string;
    devunit?: string;
    notes?: string;
    dbtime?: string;
    username?: string;
}

const contractInfo = reactive({
    id: 0,
    contractname: '',
    contractnum: '',
    businesscon: '',
    businessinfo: '',
    precautions: '',
    notes: '',
    username: '',
    dbtime: '',
    projectInfoPojoList: [] as any[],
    deviceDataList: [] as DeviceItem[],
});

function text(value: any) {
    return value === undefined || value === null || value === '' ? '--' : String(value);
}

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif
    // #ifndef H5
    uni.navigateBack();
    // #endif
}

function handleTabsChange({ index }: { index: number }) {
    activeTab.value = Number(index);
    nextTick(() => uni.pageScrollTo({ scrollTop: 0, duration: 0 }));
}

async function getContractDetailInfo() {
    try {
        const data = await fetchGetPrjContractInfo(contractInfo.id);
        Object.assign(contractInfo, {
            contractname: data?.contractname || '',
            contractnum: data?.contractnum || '',
            businesscon: data?.businesscon || '',
            businessinfo: data?.businessinfo || '',
            precautions: data?.precautions || '',
            notes: data?.notes || '',
            username: data?.username || '',
            dbtime: data?.dbtime || '',
        });
    } catch (err) {
        console.error('获取合同详情失败', err);
    }
}

async function getProjectList(reset = false) {
    if (!hasPermission('project:Info:select') || projectLoading.value) return;
    if (reset) {
        dataForm.projectPage = 1;
        contractInfo.projectInfoPojoList = [];
    }
    projectLoading.value = true;
    try {
        const data = await fetchGetPrjByContractInfo({
            page: dataForm.projectPage,
            pageSize: 20,
            limit: 20,
            conid: contractInfo.id,
            id: contractInfo.id,
        });
        const list = Array.isArray(data?.list) ? data.list : [];
        contractInfo.projectInfoPojoList = dataForm.projectPage === 1
            ? list
            : contractInfo.projectInfoPojoList.concat(list);
        dataForm.projectTotal = Number(data?.total || 0);
    } catch (err) {
        console.error('获取合同关联项目失败', err);
    } finally {
        projectLoading.value = false;
    }
}

async function getDeviceList(reset = false) {
    if (!hasPermission('project:Device:select') || deviceLoading.value) return;
    if (reset) {
        dataForm.devicePage = 1;
        contractInfo.deviceDataList = [];
    }
    deviceLoading.value = true;
    try {
        const data = await fetchGetContractInfoDevice({
            page: dataForm.devicePage,
            pageSize: 20,
            limit: 20,
            pids: contractInfo.id,
            pid: contractInfo.id,
        });
        const list = Array.isArray(data?.list) ? data.list : [];
        contractInfo.deviceDataList = dataForm.devicePage === 1
            ? list
            : contractInfo.deviceDataList.concat(list);
        dataForm.deviceTotal = Number(data?.total || 0);
    } catch (err) {
        console.error('获取合同设备失败', err);
    } finally {
        deviceLoading.value = false;
    }
}

function handleMakePhoneNumber(phoneNumber: string) {
    if (phoneNumber) uni.makePhoneCall({ phoneNumber });
}

function handleJumpChange(url: string) {
    uni.navigateTo({ url });
}


onLoad((options: any) => {
    contractInfo.id = Number(options?.id || 0);
    getContractDetailInfo();
    getProjectList(true);
    getDeviceList(true);
    uni.$on('refreshListDevice', getDeviceList);
});

onUnload(() => uni.$off('refreshListDevice', getDeviceList));
onPageScroll((e: any) => { scrollTop.value = e.scrollTop; });

onPullDownRefresh(() => {
    const task = activeTab.value === 0
        ? getContractDetailInfo()
        : activeTab.value === 1 ? getProjectList(true) : getDeviceList(true);
    task.finally(() => uni.stopPullDownRefresh());
});

onReachBottom(() => {
    if (activeTab.value === 1 && contractInfo.projectInfoPojoList.length < dataForm.projectTotal) {
        dataForm.projectPage += 1;
        getProjectList();
    }
    if (activeTab.value === 2 && contractInfo.deviceDataList.length < dataForm.deviceTotal) {
        dataForm.devicePage += 1;
        getDeviceList();
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-message-box />
        <wd-navbar left-arrow title="合同详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft">
            <template #right>
                <wd-button v-if="activeTab === 2 && hasPermission('project:Device:insert')" type="icon" icon="add-circle" size="large" @click="handleJumpChange('/projectPages/addprojectdevice/Index?pid=' + contractInfo.id)" />
            </template>
        </wd-navbar>
        <wd-tabs v-model="activeTab" animated @change="handleTabsChange">
            <wd-tab v-for="item in tabsList" :key="item.value" :name="item.value" :title="item.title">
                <wd-gap :bg-color="isDark ? '#000' : '#f5f5f5'" height="110rpx" />

                <view v-if="activeTab === 0" class="card" :style="{ background: isDark ? '#1b1b1b' : '#fff' }">
                    <wd-cell title="合同名称" :value="text(contractInfo.contractname)" custom-class="customCell" />
                    <wd-cell title="合同编号" :value="text(contractInfo.contractnum)" custom-class="customCell" />
                    <wd-cell title="商务负责人" :value="text(contractInfo.businesscon)" custom-class="customCell" />
                    <wd-cell title="商务联系方式" custom-class="customCell">
                        <wd-text v-if="contractInfo.businessinfo" :text="contractInfo.businessinfo" type="warning" decoration="underline" @click="handleMakePhoneNumber(contractInfo.businessinfo)" />
                        <wd-text v-else text="--" />
                    </wd-cell>
                    <wd-cell title="创建者" :value="text(contractInfo.username)" custom-class="customCell" />
                    <wd-cell title="创建时间" :value="text(contractInfo.dbtime)" custom-class="customCell" />
                    <wd-cell v-if="contractInfo.precautions" title="注意事项" :value="contractInfo.precautions" custom-class="customCell" />
                    <wd-cell title="备注" :value="text(contractInfo.notes)" custom-class="customCell" />
                </view>

                <view v-if="activeTab === 1">
                    <view v-for="(item, index) in contractInfo.projectInfoPojoList" :key="item.id || index" class="card" :style="{ background: isDark ? '#1b1b1b' : '#fff' }">
                        <wd-text bold :text="text(item.proname)" size="15px" :color="isDark ? '#fff' : '#000'" />
                        <wd-cell title="创建者" :value="text(item.username)" custom-class="cellClass" />
                        <wd-cell title="创建时间" :value="text(item.dbtime)" custom-class="cellClass" />
                    </view>
                    <view v-if="!contractInfo.projectInfoPojoList.length" class="empty-wrap"><wd-status-tip image="../../static/search.png" tip="暂无关联项目列表" /></view>
                </view>

                <view v-if="activeTab === 2">
                    <view v-for="(item, index) in contractInfo.deviceDataList" :key="item.id || index" class="card" :style="{ background: isDark ? '#1b1b1b' : '#fff' }">
                        <wd-cell :title="text(item.devname)" custom-class="cellClass" />
                        <wd-cell title="设备型号" :value="text(item.devmodel)" custom-class="cellClass" />
                        <wd-cell title="数量" :value="text(item.devcount) + (item.devunit || '')" custom-class="cellClass" />
                        <wd-cell title="是否为我司厂家" :value="item.devtype === 0 ? '是' : '否'" :value-class="item.devtype === 0 ? 'text-success' : 'text-info'" custom-class="cellClass" />
                        <wd-cell title="设备厂家" :value="text(item.devmanu)" custom-class="cellClass" />
                        <wd-cell v-if="item.notes" title="备注" :value="item.notes" custom-class="cellClass" />
                        <wd-cell title="创建者" :value="text(item.username)" custom-class="cellClass" />
                        <wd-cell title="创建时间" :value="text(item.dbtime)" custom-class="cellClass" />
                    </view>
                    <view v-if="!contractInfo.deviceDataList.length" class="empty-wrap"><wd-status-tip image="../../static/search.png" tip="暂无合同设备列表信息" /></view>
                </view>
            </wd-tab>
        </wd-tabs>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.wd-tabs) { background-color: transparent !important; }
:deep(.wd-tabs__nav) { position: fixed !important; left: 0 !important; right: 0 !important; z-index: 99 !important; }
.card { width: calc(100vw - 40rpx); margin: 0 20rpx 20rpx; padding: 12rpx 20rpx; box-sizing: border-box; border-radius: 20rpx; }
.card-actions { display: flex; justify-content: flex-end; padding-top: 12rpx; }
.empty-wrap { display: flex; justify-content: center; margin: 20rpx; padding: 40rpx 0; border-radius: 20rpx; background: #fff; }
:deep(.cellClass), :deep(.customCell) { padding: 0 !important; .wd-cell__wrapper { padding: 10rpx !important; } }
.text-success { color: #34c759 !important; }
.text-info { color: #8e8e93 !important; }
</style>
