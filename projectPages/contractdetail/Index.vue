<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { onReady, onLoad, onUnload, onPullDownRefresh, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { reactive, ref, nextTick, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchGetPrjContractInfo, fetchGetPrjDeviceDataList, fetchDeletePrjDeviceInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const message = useMessage();

const activeTab = ref<number>(0);

const isDark = computed(() => theme.value === 'dark');

const scrollTop = ref<number>(0);

const tabsList = ref<{ title: string, value: number }[]>([
    {
        title: '合同概览',
        value: 0
    },
    {
        title: '设备列表',
        value: 1
    }
]);

const dataForm = reactive<{
    page: number;
    total: number;
}>({
    page: 1,
    total: 1
})

interface DeviceItem {
    id: number;
    pid: number;
    devname: string;
    devmodel: string;
    devtype: number;
    devmanu: string;
    devcount: number;
    devunit: string;
    notes: string;
    dbtime: string;
    username: string;
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
    projectInfoPojoList: [] as any,
    deviceDataList: [] as DeviceItem[]
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

const handleTabsChange = ({ index, name }: { index: number, name: number }) => {
	nextTick(() => {
		uni.pageScrollTo({
			scrollTop: activeTab.value === 0 ? 0 : scrollTop.value,
			duration: 0
		});
	})
}

// 获取合同详情
async function getContractDetailInfo() {
    try {
        const data = await fetchGetPrjContractInfo((contractInfo.id as any));
        console.log('data合同详情', data);
        contractInfo.businesscon = data.businesscon;
        contractInfo.businessinfo = data.businessinfo;
        contractInfo.contractname = data.contractname;
        contractInfo.contractnum = data.contractnum;
        contractInfo.precautions = data.precautions;
        contractInfo.notes = data.notes;
        contractInfo.username = data.username;
        contractInfo.dbtime = data.dbtime;
        contractInfo.projectInfoPojoList = data.projectInfoPojoList || [];
    } catch (err) {
        console.error('获取项目信息失败', err);
    }
}

// 拨打电话
function handleMakePhoneNumber(phoneNumber: string) {
    uni.makePhoneCall({
        phoneNumber
    })
}

// 获取合同设备
async function getDataList() {
    if (!hasPermission('project:Device:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无合同设备查询权限，请联系管理员',
            duration: 1500
        })
        return
    }
    if (dataForm.page === 1) {
        contractInfo.deviceDataList = [];
    }
    try {
        const data = await fetchGetPrjDeviceDataList({ page: dataForm.page, limit: 100, pids: contractInfo.id });
        console.log('data合同设备', data);
        dataForm.total = Number(data.total);
        contractInfo.deviceDataList = contractInfo.deviceDataList.concat(data.list);
    } catch (err) {
        console.error('获取合同设备失败', err);
    }
}

// 添加项目成员
function handleJumpChange(url: string) {
    uni.navigateTo({
        url
    })
}

// 删除操作
async function handleDeleteDeviceChange(id: number) {
    if (!hasPermission('project:Device:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该设备吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjDeviceInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除成功",
                duration: 1500,
                complete: async () => {
                    if (activeTab.value === 1) {
                        dataForm.page = 1;
						uni.pageScrollTo({
							offsetTop: 0,
							duration: 0
						})
                        getDataList();
                    }
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('删除失败', error);
    }
}

onLoad((options: any) => {
    contractInfo.id = options.id;
    getContractDetailInfo();
    getDataList();
    uni.$on('refreshListDevice', getDataList); // 监听刷新事件
});

onPageScroll((e: any) => {
	if (activeTab.value === 1) {
		scrollTop.value = e.scrollTop;
	}
})

onUnload(() => {
    uni.$off('refreshListDevice', getDataList); // 页面销毁时解绑
});

onPullDownRefresh(() => {
    if (activeTab.value === 0) {
        getContractDetailInfo();
    } else if (activeTab.value === 1) {
        dataForm.page = 1;
        getDataList();
    }
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    console.log('触发上拉加载');
    if (activeTab.value === 1) {
        if (contractInfo.deviceDataList.length < dataForm.total) {
            dataForm.page++;
            getDataList();
        }
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <wd-navbar left-arrow title="合同详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft">
            <template #right>
                <wd-button v-if="activeTab === 1 && hasPermission('project:Device:insert')" type="icon" icon="add-circle" size="large" @click="handleJumpChange('/projectPages/addprojectdevice/Index?pid=' + contractInfo.id)"></wd-button>
            </template>
        </wd-navbar>
        <wd-tabs animated v-model="activeTab" @change="handleTabsChange">
            <block v-for="(item, index) in tabsList" :key="index">
                <wd-tab :title="item.title">
                    <wd-gap :bg-color="isDark ? '#000000' : '#F5F5F5'"  height="110rpx" />

                    <view v-if="activeTab === 0">
                        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx' }">
                            <view style="padding: 5rpx;">
                                <wd-cell title="合同名称" :value="contractInfo.contractname" custom-class="customCell" />
                                <wd-cell title="合同编号" :value="contractInfo.contractnum" custom-class="customCell" />
                                <wd-cell title="商务负责人" :value="contractInfo.businesscon" custom-class="customCell" />
                                <wd-cell title="商务联系方式" :value="contractInfo.businessinfo" custom-class="customCell">
                                    <wd-text v-if="contractInfo.businessinfo" :text="contractInfo.businessinfo" type="warning" decoration="underline" @click="handleMakePhoneNumber(contractInfo.businessinfo)" />
                                </wd-cell>
                                 <wd-cell title="创建者" :value="contractInfo.username" custom-class="customCell" />
                                <wd-cell title="创建时间" :value="contractInfo.dbtime" custom-class="customCell" />
                                <wd-cell v-if="contractInfo.precautions" title="注意事项" title-width="100px" :value="contractInfo.precautions ? contractInfo.precautions : '无'" custom-class="customCell" />
                                <wd-cell title="备注" title-width="100px" :value="contractInfo.notes ? contractInfo.notes : '无'" custom-class="customCell" />
                            </view>
                        </view>

                        <!-- <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 20rpx;">
                            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                            <view style="margin-left: 10rpx; font-weight: bolder;">关联项目</view>
                        </view>

                        <view v-if="contractInfo.projectInfoPojoList.length > 0">
                            <view v-for="(prjItem, prjIndex) in contractInfo.projectInfoPojoList" :key="prjIndex">
                                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: prjIndex === 0 ? '0 20rpx 20rpx' : prjIndex === contractInfo.projectInfoPojoList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
                                    <view style="padding: 20rpx; ">
                                        <view class="prjInfoHeader">
                                            <view class="left">
                                                <wd-text bold :text="prjItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                            </view>
                                            <view class="right">
                                                <wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + prjItem.id)"></wd-icon>
                                            </view>
                                        </view>

                                        <view>
                                            <wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
                                                <wd-text bold :text="prjItem.period" size="14px"
                                                    :color="isDark ? '#ffffff' : '#000000'" />
                                            </wd-cell>

                                            <wd-cell title="调试类型" icon="list" custom-class="cellClass">
                                                <wd-tag type="primary" round>
                                                    {{ prjItem.dtype === 0 ? '现场调试' : prjItem.dtype === 1 ? '远程调试' : prjItem.dtype === 2 ? '无需调试' : '未知' }}
                                                </wd-tag>
                                            </wd-cell>

                                            <wd-cell title="开始时间" icon="time" custom-class="cellClass">
                                                <wd-text bold :text="prjItem.sdbtime || '--'" size="14px"
                                                    :color="isDark ? '#ffffff' : '#000000'" />
                                            </wd-cell>

                                            <wd-cell title="创建者" icon="user" custom-class="cellClass">
                                                <wd-text bold :text="prjItem.username" size="14px"
                                                    :color="isDark ? '#ffffff' : '#000000'" />
                                            </wd-cell>

                                            <wd-cell title="创建时间" icon="time" custom-class="cellClass">
                                                <wd-text bold :text="prjItem.dbtime" size="14px"
                                                    :color="isDark ? '#ffffff' : '#000000'" />
                                            </wd-cell>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
                            <wd-status-tip image="../../static/search.png" tip="暂无关联项目列表" />
                        </view> -->
                    </view>

                    <view v-if="activeTab === 1">
                        <view v-if="contractInfo.deviceDataList.length > 0">
                            <view v-for="(deviceItem, deviceIndex) in contractInfo.deviceDataList" :key="deviceIndex">
                                <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: deviceIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
                                    <view style="padding: 5rpx;">
                                        <wd-cell :title="deviceItem.devname" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
                                            <wd-icon v-if="hasPermission('project:Device:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addprojectdevice/Index?pid=' + contractInfo.id + '&id=' + deviceItem.id)"></wd-icon>
                                        </wd-cell>
                                        <view @click="handleJumpChange('/projectPages/contractdeviceinfo/Index?id=' + deviceItem.id)">
                                            <wd-cell title="设备型号" custom-class="cellClass">
                                                <wd-text bold :text="deviceItem.devmodel" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                            </wd-cell>

                                            <wd-cell title="是否为我司设备" custom-class="cellClass">
                                                <wd-tag plain round :type="deviceItem.devtype === 0 ? 'success' : deviceItem.devtype === 1 ? 'danger' : 'default'">
                                                    {{ deviceItem.devtype === 0 ? '是' : deviceItem.devtype === 1 ? '否' : '未知' }}
                                                </wd-tag>
                                            </wd-cell>

                                            <wd-cell title="设备数量" custom-class="cellClass">
                                                <wd-text bold :text="deviceItem.devunit ? deviceItem.devcount + deviceItem.devunit : deviceItem.devcount" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                            </wd-cell>

                                            <wd-cell title="设备厂家" custom-class="cellClass">
                                                <wd-text bold :text="deviceItem.devmanu" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                            </wd-cell>

                                            <wd-cell title="创建者/时间" :value="deviceItem.username" custom-class="cellClass" ellipsis>
                                                <view style="display: flex; flex-direction: column; flex-wrap: wrap;">
                                                    <view v-if="deviceItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; font-weight: bolder;">
                                                        {{ deviceItem.username }}
                                                    </view>
                                                    <view v-if="deviceItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; font-weight: bolder;">
                                                        {{ deviceItem.dbtime }}
                                                    </view>
                                                </view>
                                            </wd-cell>
                                        </view>
										
										<wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Device:delete')"></wd-gap>
										
										<view :style="{ display: 'flex', justifyContent: 'flex-end', padding: '10rpx 30rpx 15rpx 0', gap: '0 10rpx', background: isDark ? '#1b1b1b' : '#ffffff' }" v-if="hasPermission('project:Device:delete')">
											<wd-button v-if="hasPermission('project:Device:delete')" size="small" type="error" @click.stop="handleDeleteDeviceChange(deviceItem.id)">删除</wd-button>
										</view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip image="../../static/search.png" tip="暂无合同设备列表信息" />
                        </view>
                    </view>
                </wd-tab>
            </block>
        </wd-tabs>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.wd-tabs) {
    background-color: transparent !important;
}

:deep(.wd-tabs__nav) {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 99 !important;
}

.rowGridClass {
    padding: 20rpx;
    width: calc(100vw - 80rpx);
    margin: 0 20rpx;
    border-radius: 20rpx;
}

.colGridClass {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 10rpx;
}

:deep(.wd-progress__outer) {
    height: 7px !important;
    border-radius: 10px !important;
}

:deep(.wd-progress__inner) {
    border-radius: 10px !important;
}

:deep(.cellValueClass) {
    font-size: 16px !important;
    font-weight: bolder !important;
}

:deep(.dividerRootClass) {
    height: 100px !important;
}

.buttonWrap {
    display: flex;
    justify-content: center;
    align-items: center;
    width: calc(100vw - 40rpx);
    margin: 30rpx 40rpx 30rpx 0;
    padding: 0 0 0 20rpx;
}

.darkButtonWrap {
    width: 100% !important;
}

.lightButtonWrap {
    width: 100% !important;
}

:deep(.cellLabelTitle) {
    font-weight: bolder !important;
}

.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10rpx 0 !important;
    margin-bottom: 20rpx;

    .left {
        display: flex;
        align-items: center;
        margin-left: 10rpx;
        width: calc(100vw - 190px);
    }

    .right {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0 20rpx;
    }
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}

.customCell {
	:deep(.wd-cell__value) {
		font-weight: bolder !important;
	}
}
</style>