<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { v4 as uuidv4 } from "uuid";
import { fetchGetSystemconfigInfo, fetchGetPrjDataListBySelf, fetchGetPrjFormInfo, fetchSavePrjFormInfo, fetchUpdatePrjFormInfo, fetchGetPrjDispatchDataList, fetchGetProvinceInfo, fetchGetCityInfo, fetchGetCommissioningsheetByProId } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import { hasPermission, getSystemDate, getProvinceIdByName } from '@/utils/index';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const message = useMessage();

const provinceDataList = ref<any>([]);

const allProvinceDataList = ref<any>([]);

const regionDataList = ref<any>([]);

const dispatchShow = ref<boolean>(false);

const dispatchDataList = ref<any>([]);

const prjShow = ref<boolean>(false);

const prjDataList = ref<any>([]);

const uuid = ref<string>(uuidv4());

const triggered = ref<boolean>(false);

const prjTriggered = ref<boolean>(false);

const dispatchIdNameObj: Record<number, string> = {};

const prjIdNameObj: Record<number, string> = {};

// 省份选择弹框
const proviceShow = ref<boolean>(false);

const proviceTriggered = ref<boolean>(false);

// 市选择弹框
const regionShow = ref<boolean>(false);

const regionTriggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    province: string;
    fuzzy: string;
    checkedDispatch: any;
    prjPage: number;
    prjLimit: number;
    prjTotal: number;
    prjFuzzy: string;
    checkedPrj: any;
    proviceFuzzy: string;
    regionFuzzy: string;
}>({
    page: 1,
    limit: 50,
    total: 0,
    province: '',
    fuzzy: '',
    checkedDispatch: [],
    prjPage: 1,
    prjLimit: 100,
    prjTotal: 0,
    prjFuzzy: '',
    checkedPrj: null,
    proviceFuzzy: '',
    regionFuzzy: ''
})

const model = reactive<{
    id: number;
    proname: string;
    plantime: null | number;
    proaddr: string;
    status: number;
    dispatch: string;
    disname: string;
    period: number;
    dtype: number;
    provice: any;
    provicename: string;
    region: any;
    regionname: '';
	prosite: string;
	longitude: number;
	latitude: number;
}>({
    id: 0,
    proname: '',
    proaddr: '',
    status: 0,
    plantime: Number(getSystemDate(5, undefined, 7)),
    dispatch: '',
    disname: '',
    period: 30,
    dtype: 2,
    provice: null,
    provicename: '',
    region: null,
    regionname: '',
	prosite: '',
	longitude: 0,
	latitude: 0,
});

const typeList = ref<any[]>([
    {
        label: '现场调试',
        value: 0
    },
    {
        label: '远程调试',
        value: 1
    },
    {
        label: '无需调试',
        value: 2
    }
]);

const rules: FormRules = {
    proname: [
        {
            required: true,
            message: '请输入项目名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入项目名称');
                }
            }
        },
    ],
	prosite: [
	    {
	        required: true,
	        message: '请输入项目地址',
	        validator: (value: string) => {
	            if (value) {
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入项目地址');
	            }
	        }
	    },
	],
    proaddr: [
        {
            required: true,
            message: '请输入项目详细地址',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入项目详细地址');
                }
            }
        },
    ],
    provicename: [
        {
            required: true,
            message: '请选择省份',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择省份');
                }
            }
        },
    ],
    regionname: [
        {
            required: true,
            message: '请选择市',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择市');
                }
            }
        },
    ],
};

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrjSelf'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取配置中的地图key
async function getMapSdkInfo() {
    try {
        const response = await fetchGetSystemconfigInfo();
        return response; // ✅ 正确返回 URL
    } catch (error) {
        console.error('获取地图 SDK 配置失败:', error);
        throw error; // 让调用者处理错误
    }
}

// 获取详细地址
async function getAddress(lat: number, lng: number) {
    const sdkInfo: any = await getMapSdkInfo();
    return new Promise((resolve, reject) => {
        uni.request({
            url: `https://restapi.amap.com/v3/geocode/regeo?key=${sdkInfo.sdkh5}&location=${lng},${lat}`,
            success: (res: any) => {
                dataForm.province = res.data.regeocode?.addressComponent.province || '';
                dataForm.page = 1;
                resolve(res.data.regeocode?.formatted_address || '');
            },
            fail: reject
        });
    });
}

// 清除
function handleClearChange() {
    dataForm.page = 1;
    getDispatchDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    getDispatchDataList();
}

// 获取调度信息
async function getDispatchDataList() {
    if (!hasPermission('project:Dispatch:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取调度信息权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    if (dataForm.page === 1) {
        dispatchDataList.value = [];
    }
    let queryParams: any = {
        page: dataForm.page,
        limit: dataForm.limit
    }
    if (model.provice) {
        queryParams['province'] = model.provice;
        // queryParams['province'] = getProvinceIdByName(provinceDataList.value, dataForm.province);
    }
    if (dataForm.fuzzy) {
        queryParams['fuzzy'] = dataForm.fuzzy;
    }
    try {
        const data = await fetchGetPrjDispatchDataList(queryParams);
        dispatchDataList.value = dispatchDataList.value.concat(data.list);
        dataForm.total = Number(data.total);
        dispatchDataList.value.forEach((item: any) => {
            dispatchIdNameObj[item.id] = item.dname;
        });
    } catch (error) {
        console.log('获取调度信息错误', error);
    }
}

// 打开内置地图
function handleOpenLocationChange() {
    if (model.id) {
        uni.chooseLocation({
            latitude: model.latitude,
            longitude: model.longitude,
            useSecureNetwork: true,
            success: function (res1) {
                console.log('res选择地址', res1);
                if (res1 && typeof res1.latitude === 'number' && typeof res1.longitude === 'number' && (res1.address || res1.name)) {
                    model.latitude = res1.latitude;
                    model.longitude = res1.longitude;
                    model.prosite = res1.address || res1.name || '';
                    getAddress(model.latitude, model.longitude);
                }
            },
            fail: function (err1) {
                console.error('获取地址失败', err1);
                if (err1.errMsg !== 'chooseLocation:fail cancel') {
                    uni.showToast({
                        title: '获取地址失败',
                        icon: 'error',
                        duration: 2000,
                    });
                }
            },
        });
    } else {
        uni.getLocation({
            type: 'gcj02',
            geocode: true,
            isHighAccuracy: true,
            highAccuracyExpireTime: 10000,
            success: async function (res) {
                console.log('res当前位置', res);
                model.latitude = res.latitude;
                model.longitude = res.longitude;
                const addr: any = await getAddress(res.latitude, res.longitude);
                model.prosite = addr;
                uni.chooseLocation({
                    latitude: model.latitude,
                    longitude: model.longitude,
                    useSecureNetwork: true,
                    success: function (res1) {
                        console.log('res选择地址', res1);
                        if (res1 && typeof res1.latitude === 'number' && typeof res1.longitude === 'number' && (res1.address || res1.name)) {
                            model.latitude = res1.latitude;
                            model.longitude = res1.longitude;
                            model.prosite = res1.address || res1.name || '';
                            getAddress(model.latitude, model.longitude);
                        }
                    },
                    fail: function (err1) {
                        console.error('获取地址失败', err1);
                        if (err1.errMsg !== 'chooseLocation:fail cancel') {
                            uni.showToast({
                                title: '获取地址失败',
                                icon: 'error',
                                duration: 2000,
                            });
                        }
                    },
                });
            },
            fail: function (err) {
                console.error('获取位置失败', err);
                if (err.errMsg !== 'getLocation:fail auth deny') {
                    uni.showToast({
                        title: '获取位置失败',
                        icon: 'error',
                        duration: 2000,
                    });
                } else {
                    message
                    .confirm({
                        msg: '未授权定位权限，请在设置中开启后再试。',
                        title: '提示'
                    })
                    .then(async () => {
                        uni.openSetting();
                    })
                    .catch(() => {
                        console.log('点击了取消按钮');
                    });
                }
            },
        });
    }
}

// 获取省份
async function getProvinceInfo() {
    try {
        const data = await fetchGetProvinceInfo();
        if (dataForm.fuzzy) {
            const fuzzy = dataForm.proviceFuzzy.toLowerCase();
            provinceDataList.value = data.filter((item: any) => item.name.toLowerCase().includes(fuzzy));
        } else {
            provinceDataList.value = data;
        }
        allProvinceDataList.value = data;
        if (model.id) {
            model.provicename = allProvinceDataList.value.find((item: any) => item.id === model.provice)?.name || '';
            getRegionInfoList();
        }
    } catch (error) {
        console.log('获取省份错误', error);
    }
}

// 打开省份选择弹框
async function handleLinkproviceShowChange() {
    proviceShow.value = true;
}

// 关闭省份弹框
function handleProviceCloseChange() {
    proviceShow.value = false;
}

// 清除
function handleProviceClearChange() {
    dataForm.proviceFuzzy = '';
    dataForm.page = 1;
    provinceDataList.value = allProvinceDataList.value;
}

// 搜索
function handleProviceSearchChange() {
    const fuzzy = dataForm.proviceFuzzy.toLowerCase();
    provinceDataList.value = allProvinceDataList.value.filter((item: any) => item.name.toLowerCase().includes(fuzzy));
}

// 选择省份(获取对应名称)
function handleRadioSelectProviceChange({ value }: { value: any }) {
    console.log('value', value);
    const selectedProvince = provinceDataList.value.find((item: any) => item.id === value);
    if (selectedProvince) {
        model.provicename = selectedProvince.name;
    } else {
        model.provicename = '';
    }
    proviceShow.value = false;
    model.regionname = '';
    model.region = null;
    getRegionInfoList();
}

// 下拉刷新
function handleScrollProviceRefreshChange() {
    proviceTriggered.value = true;
    dataForm.page = 1;
    getProvinceInfo();
    setTimeout(() => {
        proviceTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 打开选择市弹窗
function handleLinkRegionShowChange() {
    if (!model.provicename) {
        uni.showToast({
            icon: "none",
            duration: 1500,
            title: "请先选择省份"
        })
        return false
    }
    regionShow.value = true;
}

// 关闭市弹框
function handleRegionCloseChange() {
    regionShow.value = false;
}

// 清除
function handleRegionClearChange() {
    dataForm.regionFuzzy = '';
    dataForm.page = 1;
    getRegionInfoList();
}

// 搜索
function handleRegionSearchChange() {
    dataForm.page = 1;
    getRegionInfoList();
}

// 获取市列表
async function getRegionInfoList() {
    try {
        const data = await fetchGetCityInfo({ province: model.provice, fuzzy: dataForm.regionFuzzy });
        if (dataForm.regionFuzzy) {
            const fuzzy = dataForm.regionFuzzy.toLowerCase();
            regionDataList.value = data.filter((item: any) => item.name.toLowerCase().includes(fuzzy));
        } else {
            regionDataList.value = data;
        }
        if (model.id) {
            model.regionname = regionDataList.value.find((item: any) => item.id === model.region)?.name || '';
        }
    } catch (error) {
        console.log('获取市列表错误', error);
    }
}

// 选择市(获取对应名称)
function handleRegionRadioSelectChange({ value }: { value: any }) {
    const selectedRegion = regionDataList.value.find((item: any) => item.id === value);
    if (selectedRegion) {
        model.regionname = selectedRegion.name;
    } else {
        model.regionname = '';
        model.region = null;
    }
    regionShow.value = false;
}

// 下拉刷新 市列表
function handleScrollRegionRefreshChange() {
    regionTriggered.value = true;
    dataForm.page = 1;
    getRegionInfoList();
    setTimeout(() => {
        regionTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 打开调度信息选择弹框
async function handleLinkDispatchShowChange() {
    if (!model.provicename) {
        uni.showToast({
            icon: "none",
            duration: 1500,
            title: "请先选择省份"
        })
        return false
    }
    dataForm.page = 1;
    getDispatchDataList();
    dispatchShow.value = true;
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.page = 1;
    getDispatchDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && dispatchDataList.value.length < dataForm.total) {
        dataForm.page++;
        getDispatchDataList();
    }
}

// 关闭调度信息弹框
function handleCloseChange() {
    dispatchShow.value = false;
}

// 选择调度信息(获取对应名称)
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // const names = dispatchDataList.value.filter((item: any) => dataForm.checkedDispatch.includes(item.id)).map((item: any) => item.dname);
    // model.disname = names.join(", ");
    const names = dataForm.checkedDispatch.map((id: any) => dispatchIdNameObj[id]).filter(Boolean);
    model.disname = names.join(", ");
}

// 清除(合同信息)
function handleClearContractFuzzyChange() {
    dataForm.prjPage = 1;
    getPrjDataList();
}

// 搜索(合同信息)
function handleSearchContractFuzzyChange() {
    dataForm.prjPage = 1;
    getPrjDataList();
}

// 获取项目信息
async function getPrjDataList() {
    if (!hasPermission('project:Info:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取项目信息权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    if (dataForm.prjPage === 1) {
        prjDataList.value = [];
    }
    let queryParams: any = {
        page: dataForm.prjPage,
        limit: dataForm.prjLimit
    }
    if (dataForm.prjFuzzy) {
        queryParams['fuzzy'] = dataForm.prjFuzzy;
    }
    try {
        const data = await fetchGetPrjDataListBySelf(queryParams);
        prjDataList.value = prjDataList.value.concat(data.list);
        dataForm.prjTotal = Number(data.total);
        prjDataList.value.forEach((item: any) => {
            prjIdNameObj[item.id] = item.proname;
        });
    } catch (error) {
        console.log('获取项目信息错误', error);
    }
}

// 打开项目信息选择弹框
async function handleLinkPrjShowChange() {
    if (!hasPermission('project:Info:select')) {
        uni.showToast({
            icon: "none",
            duration: 1500,
            title: "暂无查询项目权限，请联系管理员"
        })
        return false
    }
    prjShow.value = true;
}

// 关闭项目信息弹框
function handleContractCloseChange() {
    prjShow.value = false;
}

// 选择项目信息(获取对应名称)
async function handlePrjRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    model.proname = prjIdNameObj[value];
	const data = await fetchGetCommissioningsheetByProId(value);
	if (data) {
		uni.showToast({
			icon: 'none',
			title: '该项目已存在工程调试单，请重新选择',
			duration: 1500
		})
	} else {
		prjShow.value = false;
	}
}

// 刷新(项目信息)
function handleScrollRefreshPrjChange() {
    prjTriggered.value = true;
    dataForm.prjPage = 1;
    getPrjDataList();
    setTimeout(() => {
        prjTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(项目信息)
function handleScrolltolowerPrjChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && prjDataList.value.length < dataForm.prjTotal) {
        dataForm.prjPage++;
        getPrjDataList();
    }
}

// 获取工程调试单基本信息
async function getPrjInfo() {
    if (!hasPermission('project:form:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无工程调试单基本信息权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        const data = await fetchGetPrjFormInfo(model.id);
        console.log('获取工程调试单基本信息成功', data);
        model.proname = data.proname;
        model.dispatch = data.dispatch;
        model.proaddr = data.proaddr;
        model.period = data.period;
        model.status = data.status;
        model.dtype = data.dtype;
        model.provice = data.provice;
        model.region = data.region;
        model.plantime = Number(getSystemDate(5, data.plantime));
		model.prosite = data.prosite;
		model.longitude = data.longitude;
		model.latitude = data.latitude;
        getProvinceInfo();
    } catch (error) {
        console.log('获取工程调试单基本信息错误', error);
    }
}

async function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                try {
                    if (model.id) {
                        if (!hasPermission('project:form:update')) {
                            uni.showToast({
                                icon: 'none',
                                title: '暂无工程调试单修改权限, 请联系管理员',
                                duration: 1500
                            })
                            return
                        }
                        loading.value = true;
                        let queryParams = [{
                            id: model.id,
                            proid: dataForm.checkedPrj,
                            dispatch: model.dispatch,
                            proaddr: model.proaddr,
                            status: model.status,
                            dtype: model.dtype,
                            provice: model.provice,
                            region: model.region,
                            plantime: String(getSystemDate(0, (model.plantime as any))),
							prosite: model.prosite,
							longitude: model.longitude,
							latitude: model.latitude
                        }];
                        message
                        .confirm({
                            msg: '确定要修改工程调试单吗？',
                            title: '提示',
                            confirmButtonProps: {
                                type: 'error',
                            },
                        })
                        .then(async () => {
                            const data = await fetchUpdatePrjFormInfo(queryParams);
                            uni.showToast({
                                title: '修改工程调试单成功',
                                icon: 'none',
                                duration: 1500,
                                complete: () => {
                                    loading.value = false;
                                    handleClickLeft(true);
                                }
                            });
                        })
                        .catch(() => {
                            loading.value = false;
                            console.log('点击了取消按钮');
                        });
                    } else {
                        if (!hasPermission('project:form:insert')) {
                            uni.showToast({
                                icon: 'none',
                                title: '暂无工程调试单新增权限, 请联系管理员',
                                duration: 1500
                            })
                            return
                        }
                        loading.value = true;
                        let queryParams = {
							projectFormPojo: {
								proid: dataForm.checkedPrj,
								dispatch: model.dispatch,
								proaddr: model.proaddr,
								dtype: model.dtype,
								provice: model.provice,
								region: model.region,
								plantime: String(getSystemDate(0, (model.plantime as any))),
								prosite: model.prosite,
								longitude: model.longitude,
								latitude: model.latitude
							},
							projectFormContactPojoList: [],
							projectFormDebugPojos: [],
							projectFormEquipmentPojoList: [],
							projectFormFilePojos: []
						};
                        const data = await fetchSavePrjFormInfo(queryParams);
                        uni.showToast({
                            title: '新增工程调试单成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    }
                } catch (err) {
                    loading.value = false;
                    if (model.id) {
                        console.error('修改工程调试单失败', err);
                    } else {
                        console.error('新增工程调试单失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
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
                }
            })
            .exec();
    } catch (err) {
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad((options: any) => {
    model.id = options.id;
    getPrjDataList();
    if (model.id) {
        getPrjInfo();
    } else {
        getProvinceInfo();
    }
})

onReady(() => {
    recalcTopFixedHeight();
})

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
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow :title="model.id ? '修改工程调试单' : '新增工程调试单'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="项目名称" disabled label-width="100px" prop="proname" required clearable v-model="model.proname" placeholder="请输入项目名称">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkPrjShowChange">项目信息</wd-button>
                    </template>
                </wd-input>
                <wd-input label="调度名称" label-width="100px" prop="dispatch" clearable v-model="model.dispatch" placeholder="请输入调度名称" />
                <wd-datetime-picker label="计划调试时间" label-width="100px" type="date" prop="plantime" v-model="model.plantime" placeholder="请选择计划调试时间" />
				<!-- <wd-calendar label="计划调试时间" label-width="100px" placeholder="请选择预计完成时间" prop="plantime" v-model="model.plantime" /> -->
                <wd-input label="省份" label-width="100px" prop="provicename" required clearable disabled v-model="model.provicename" placeholder="请选择省份">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkproviceShowChange">省份信息</wd-button>
                    </template>
                </wd-input>
                <wd-input label="市" label-width="100px" prop="regionname" required clearable disabled v-model="model.regionname" placeholder="请选择市">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkRegionShowChange">市信息</wd-button>
                    </template>
                </wd-input>
				<wd-input label="项目地址" label-width="100px" prop="prosite" required readonly suffix-icon="arrow-right" clearable v-model="model.prosite" placeholder="请选择项目地址" @click="handleOpenLocationChange" />
                <wd-textarea label="项目详细地址" label-width="100px" type="textarea" prop="proaddr" clearable v-model="model.proaddr" placeholder="请输入项目地址" />
                <!-- <wd-input v-if="!model.id" label="调度信息" label-width="100px" prop="disname" clearable disabled v-model="model.disname" placeholder="请选择调度">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkDispatchShowChange">调度信息</wd-button>
                    </template>
                </wd-input> -->
                <wd-select-picker label="调试类型" label-width="100px" prop="dtype" v-model="model.dtype" :show-confirm="false" :columns="typeList" type="radio" :z-index="100" placeholder="请选择调试类型" />

                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="dispatchShow" position="left" @close="handleCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-cell-group border>
                    <wd-checkbox-group v-model="dataForm.checkedDispatch" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in dispatchDataList" :key="index" :title="item.dname" center>
                            <wd-checkbox :modelValue="item.id"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>
            </scroll-view>
        </wd-popup>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="prjShow" position="left" @close="handleContractCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.prjFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchContractFuzzyChange" @cancel="handleSearchContractFuzzyChange" @clear="handleClearContractFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="prjTriggered" @refresherrefresh="handleScrollRefreshPrjChange" @scrolltolower="handleScrolltolowerPrjChange" style="height: calc(100vh - 260rpx);">
                <wd-cell-group border>
                    <wd-radio-group v-model="dataForm.checkedPrj" shape="dot" @change="handlePrjRadioSelectChange">
                        <wd-cell v-for="(item, index) in prjDataList" :key="index" custom-class="radioCellWrap">
                            <view class="custom-txt">
                                <wd-radio :value="item.id">{{ item.proname }}</wd-radio>
                            </view>
                        </wd-cell>
                    </wd-radio-group>
                </wd-cell-group>
            </scroll-view>
        </wd-popup>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="proviceShow" position="left" @close="handleProviceCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.proviceFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleProviceSearchChange" @cancel="handleProviceSearchChange" @clear="handleProviceClearChange" />

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="proviceTriggered" @refresherrefresh="handleScrollProviceRefreshChange" style="height: calc(100vh - 280rpx);">
                <wd-radio-group v-model="model.provice" shape="dot" @change="handleRadioSelectProviceChange">
                    <wd-cell v-for="(item, index) in provinceDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.name }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="regionShow" position="left" @close="handleRegionCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.regionFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleRegionSearchChange" @cancel="handleRegionSearchChange" @clear="handleRegionClearChange" />

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="regionTriggered" @refresherrefresh="handleScrollRegionRefreshChange" style="height: calc(100vh - 280rpx);">
                <wd-radio-group v-model="model.region" shape="dot" @change="handleRegionRadioSelectChange">
                    <wd-cell v-for="(item, index) in regionDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.name }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
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
    z-index: 999;
    background-color: #FFFFFF;
    /* 保证内联元素正确换行 */
    box-sizing: border-box;
    /* 可选：微阴影让固定区更明显 */
    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
}

.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}

:deep(.wd-cell__left) {
    flex: 6 !important;
}

.radioCellWrap {
    :deep(.wd-cell__wrapper) {
        display: block !important;
    }
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}
</style>