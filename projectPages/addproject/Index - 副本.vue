<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { v4 as uuidv4 } from "uuid";
import { fetchGetSystemconfigInfo, fetchGetPrjInfo, fetchGetPrjIdByuuid, fetchSavePrjInfo, fetchUpdatePrjInfo, fetchGetProvinceInfo, fetchGetPrjDispatchDataList, fetchSavePrjDispatchContractInfo, fetchGetPrjContractDataList, fetchSavePrjContractLinkInfo, fetchSavePrjaddressInfo, fetchUpdatePrjaddressInfo, fetchDeletePrjaddressInfo, fetchGetPrjaddressDataList } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import { getSystemDate, getProvinceIdByName, hasPermission } from '@/utils/index';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const message = useMessage();

const provinceDataList = ref<any>([]);

const dispatchShow = ref<boolean>(false);

const dispatchDataList = ref<any>([]);

const contractShow = ref<boolean>(false);

const contractDataList = ref<any>([]);

const uuid = ref<string>(uuidv4());

const triggered = ref<boolean>(false);

const contractTriggered = ref<boolean>(false);

const dispatchIdNameObj: Record<number, string> = {};

const contractIdNameObj: Record<number, string> = {};

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    province: string;
    fuzzy: string;
    checkedDispatch: any;
    contractPage: number;
    contractLimit: number;
    contractTotal: number;
    contractFuzzy: string;
    checkedContract: any;

}>({
    page: 1,
    limit: 50,
    total: 0,
    province: '',
    fuzzy: '',
    checkedDispatch: [],
    contractPage: 1,
    contractLimit: 100,
    contractTotal: 0,
    contractFuzzy: '',
    checkedContract: []
})

const model = reactive<{
    id: number;
    proname: string;
    dispatch: string;
    proaddr: string;
    prosite: string;
    status: number;
    // cpdbtime: null | number;
    longitude: number;
    latitude: number;
    disname: string;
    period: number;
    dtype: number;
    contractname: string;
    defaultPeriod: number;
    moreAddressList: any;
    pidadressMap: any;
}>({
    id: 0,
    proname: '',
    dispatch: '',
    proaddr: '',
    prosite: '',
    status: 0,
    // cpdbtime: Number(getSystemDate(5, undefined, 60)),
    longitude: 0,
    latitude: 0,
    disname: '',
    period: 30,
    dtype: 2,
    contractname: '',
    defaultPeriod: 0,
    moreAddressList: [],
    pidadressMap: {}
});

const statusList = ref<any[]>([
    {
        label: '未核准',
        value: -1
    },
    {
        label: '未开始',
        value: 0
    },
    {
        label: '进行中',
        value: 1
    },
    {
        label: '待审核',
        value: 2
    },
    {
        label: '完成',
        value: 3
    }
]);

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
    proaddr: [
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
    prosite: [
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
    period: [
        {
            required: true,
            message: '请输入周期',
            validator: (value: string) => {
                if (value) {
                    if (Number(value) === 0) {
                        return Promise.reject('周期不能为0, 请重新输入周期');
                    } else {
                        return Promise.resolve();
                    }
                } else {
                    return Promise.reject('请输入周期');
                }
            }
        },
    ],
};

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrj'); // 通知列表页刷新
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
    if (dataForm.province) {
        queryParams['province'] = getProvinceIdByName(provinceDataList.value, dataForm.province);
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
async function handleOpenLocationChange() {
    if (model.id) {
        uni.chooseLocation({
            latitude: model.latitude,
            longitude: model.longitude,
            useSecureNetwork: true,
            success: async function (res1) {
                console.log('res选择地址', res1);
                if (res1 && (res1.address || res1.name)) {
					model.latitude = res1.latitude;
					model.longitude = res1.longitude;
					model.prosite = res1.address || res1.name || '';
					model.proaddr = await getAddress(model.latitude, model.longitude);
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
		if (dataForm.province) {
			const sdkMapInfo: any = await getMapSdkInfo();
			uni.request({
			    url: `https://restapi.amap.com/v3/geocode/geo?key=${sdkMapInfo.sdkh5}&address=${dataForm.province}`,
			    success: (resGeo: any) => {
					console.log('resGeo', resGeo);
					if (resGeo.data.info === 'OK' && resGeo.data.geocodes.length > 0) {
						let latitudeInfo = model.latitude ? model.latitude : resGeo.data.geocodes[resGeo.data.geocodes.length - 1].location.split(',')[1],
							longitudeInfo = model.longitude ? model.longitude : resGeo.data.geocodes[resGeo.data.geocodes.length - 1].location.split(',')[0];
						uni.chooseLocation({
						    latitude: latitudeInfo,
						    longitude: longitudeInfo,
						    useSecureNetwork: true,
						    success: async function (res1) {
						        console.log('res选择地址', res1);
						        if (res1 && (res1.address || res1.name)) {
						            model.latitude = res1.latitude;
						            model.longitude = res1.longitude;
						            model.prosite = res1.address || res1.name || '';
						            model.proaddr = await getAddress(model.latitude, model.longitude);
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
						        uni.chooseLocation({
						            latitude: res.latitude,
						            longitude: res.longitude,
						            useSecureNetwork: true,
						            success: async function (res1) {
						                console.log('res选择地址', res1);
						                if (res1 && (res1.address || res1.name)) {
						                    model.latitude = res1.latitude;
						                    model.longitude = res1.longitude;
						                    model.prosite = res1.address || res1.name || '';
						                    model.proaddr = await getAddress(model.latitude, model.longitude);
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
						            message.confirm({
						                msg: '未授权定位权限，请在设置中开启后再试。',
						                title: '提示'
						            }).then(async () => {
						                uni.openSetting();
						            }).catch(() => {
						                console.log('点击了取消按钮');
						            });
						        }
						    },
						});
					}
			    },
			    fail: (error: any) => {
					console.log('error', error.errMsg);
					uni.showToast({
					    title: error.errMsg || '获取地址失败',
					    icon: 'none',
					    duration: 2000,
					});
				}
			});
		} else {
			if (model.latitude && model.longitude) {
				uni.chooseLocation({
				    latitude: model.latitude,
				    longitude: model.longitude,
				    useSecureNetwork: true,
				    success: async function (res1) {
				        console.log('res选择地址', res1);
				        if (res1 && (res1.address || res1.name)) {
							model.latitude = res1.latitude;
							model.longitude = res1.longitude;
							model.prosite = res1.address || res1.name || '';
							model.proaddr = await getAddress(model.latitude, model.longitude);
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
				        uni.chooseLocation({
				            latitude: res.latitude,
				            longitude: res.longitude,
				            useSecureNetwork: true,
				            success: async function (res1) {
				                console.log('res选择地址', res1);
				                if (res1 && (res1.address || res1.name)) {
				                    model.latitude = res1.latitude;
				                    model.longitude = res1.longitude;
				                    model.prosite = res1.address || res1.name || '';
				                    model.proaddr = await getAddress(model.latitude, model.longitude);
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
				            message.confirm({
				                msg: '未授权定位权限，请在设置中开启后再试。',
				                title: '提示'
				            }).then(async () => {
				                uni.openSetting();
				            }).catch(() => {
				                console.log('点击了取消按钮');
				            });
				        }
				    },
				});
			}
		}
    }
}

// 选择项目地址
function handleAddAddressInfoChange() {
    model.moreAddressList.push({
        id: '',
        addr: '',
        longitude: 0,
        latitude: 0
    })
}

// 打开内置地图
function handleOpenMoreLocationChange(index: number) {
    if (model.id) {
        if (model.moreAddressList[index].latitude === 0 || model.moreAddressList[index].longitude === 0) {
            uni.getLocation({
                type: 'gcj02',
                geocode: true,
                isHighAccuracy: true,
                highAccuracyExpireTime: 10000,
                success: async function (res) {
                    console.log('res当前位置', res);
                    uni.chooseLocation({
                        latitude: res.latitude,
                        longitude: res.longitude,
                        useSecureNetwork: true,
                        success: function (res1) {
                            if (res1 && (res1.address || res1.name)) {
                                model.moreAddressList[index].latitude = res1.latitude;
                                model.moreAddressList[index].longitude = res1.longitude;
                                model.moreAddressList[index].addr = res1.address || res1.name || '';
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
                        message.confirm({
                            msg: '未授权定位权限，请在设置中开启后再试。',
                            title: '提示'
                        }).then(async () => {
                            uni.openSetting();
                        }).catch(() => {
                            console.log('点击了取消按钮');
                        });
                    }
                },
            });
        } else {
            uni.chooseLocation({
                latitude: model.moreAddressList[index].latitude,
                longitude: model.moreAddressList[index].longitude,
                useSecureNetwork: true,
                success: function (res1) {
                    if (res1 && (res1.address || res1.name)) {
                        model.moreAddressList[index].latitude = res1.latitude;
                        model.moreAddressList[index].longitude = res1.longitude;
                        model.moreAddressList[index].addr = res1.address || res1.name || '';
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
        }
    } else {
		if (model.moreAddressList[index].latitude === 0 || model.moreAddressList[index].longitude === 0) {
			uni.getLocation({
			    type: 'gcj02',
			    geocode: true,
			    isHighAccuracy: true,
			    highAccuracyExpireTime: 10000,
			    success: async function (res) {
			        console.log('res当前位置', res);
			        uni.chooseLocation({
			            latitude: res.latitude,
			            longitude: res.longitude,
			            useSecureNetwork: true,
			            success: function (res1) {
			                if (res1 && (res1.address || res1.name)) {
			                    model.moreAddressList[index].latitude = res1.latitude;
			                    model.moreAddressList[index].longitude = res1.longitude;
			                    model.moreAddressList[index].addr = res1.address || res1.name || '';
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
		} else {
			uni.chooseLocation({
			    latitude: model.moreAddressList[index].latitude,
			    longitude: model.moreAddressList[index].longitude,
			    useSecureNetwork: true,
			    success: function (res1) {
			        if (res1 && (res1.address || res1.name)) {
			            model.moreAddressList[index].latitude = res1.latitude;
			            model.moreAddressList[index].longitude = res1.longitude;
			            model.moreAddressList[index].addr = res1.address || res1.name || '';
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
		}
    }
}

// 获取省份
async function getProvinceInfo() {
    try {
        const data = await fetchGetProvinceInfo();
        provinceDataList.value = data;
    } catch (error) {
        console.log('获取省份错误', error);
    }
}

// 打开调度信息选择弹框
async function handleLinkDispatchShowChange() {
    if (!model.prosite) {
        uni.showToast({
            icon: "none",
            duration: 1500,
            title: "请先选择项目地址"
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
    dataForm.contractPage = 1;
    getPrjContractDataList();
}

// 搜索(合同信息)
function handleSearchContractFuzzyChange() {
    dataForm.contractPage = 1;
    getPrjContractDataList();
}

// 获取合同信息
async function getPrjContractDataList() {
    if (!hasPermission('project:Contract:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取合同信息权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    if (dataForm.contractPage === 1) {
        contractDataList.value = [];
    }
    let queryParams: any = {
        page: dataForm.contractPage,
        limit: dataForm.contractLimit
    }
    if (dataForm.contractFuzzy) {
        queryParams['fuzzy'] = dataForm.contractFuzzy;
    }
    try {
        const data = await fetchGetPrjContractDataList(queryParams);
        contractDataList.value = contractDataList.value.concat(data.list);
        dataForm.contractTotal = Number(data.total);
        contractDataList.value.forEach((item: any) => {
            contractIdNameObj[item.id] = item.contractname;
        });
    } catch (error) {
        console.log('获取合同信息错误', error);
    }
}

// 打开合同信息选择弹框
async function handlePrjContractLinkShowChange() {
    if (!hasPermission('project:Contract:select')) {
        uni.showToast({
            icon: "none",
            duration: 1500,
            title: "暂无查询合同权限，请联系管理员"
        })
        return false
    }
    contractShow.value = true;
}

// 关闭合同信息弹框
function handleContractCloseChange() {
    contractShow.value = false;
}

// 选择合同信息(获取对应名称)
function handleContractCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // const names = contractDataList.value.filter((item: any) => dataForm.checkedContract.includes(item.id)).map((item: any) => item.contractname);
    // model.contractname = names.join(", ");
    const names = dataForm.checkedContract.map((id: any) => contractIdNameObj[id]).filter(Boolean);
    model.contractname = names.join(", ");
}

// 刷新(合同信息)
function handleScrollRefreshContractChange() {
    contractTriggered.value = true;
    dataForm.contractPage = 1;
    getPrjContractDataList();
    setTimeout(() => {
        contractTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(合同信息)
function handleScrolltolowerContractChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && contractDataList.value.length < dataForm.contractTotal) {
        dataForm.contractPage++;
        getPrjContractDataList();
    }
}

// 获取项目基本信息
async function getPrjInfo() {
    if (!hasPermission('project:Info:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无项目基本信息权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        const data = await fetchGetPrjInfo(model.id);
        console.log('获取项目基本信息成功', data);
        model.proname = data.proname;
        model.dispatch = data.dispatch;
        model.proaddr = data.proaddr;
        model.longitude = data.longitude;
        model.latitude = data.latitude;
        model.prosite = data.prosite;
        model.defaultPeriod = data.period;
        model.period = data.period;
        model.status = data.status;
        model.dtype = data.dtype;
        // model.cpdbtime = Number(getSystemDate(5, data.cpdbtime));
        getMorePrjaddressDataList();
    } catch (error) {
        console.log('获取项目基本信息错误', error);
    }
}

// 获取更多项目地址
async function getMorePrjaddressDataList() {
    const data = await fetchGetPrjaddressDataList({ page: 1, limit: 100, pid: model.id });
    model.moreAddressList = data.list;
    model.moreAddressList.forEach((item: any) => {
        model.pidadressMap[item.id] = item;
    });
}

function handleSubmit() {
    // handleSavePidAndAddressChange(model.id);
    // return
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                if (Number(model.period) === 0) {
                    uni.showToast({
                        icon: 'none',
                        title: '请输入周期',
                        duration: 1500
                    })
                    return
                }
                if (model.moreAddressList.length > 0) {
                    let flag = true;
                    for (let index = 0; index < model.moreAddressList.length; index++) {
                        const element = model.moreAddressList[index];
                        if (!element.addr || !element.latitude || !element.longitude) {
                            flag = false;
                            break;
                        }
                    }
                    if (!flag) {
                        uni.showToast({
                            icon: 'none',
                            title: '请输入项目地址',
                            duration: 1500
                        })
                        return
                    }
                }
                try {
                    if (model.id) {
                        if (!hasPermission('project:Info:update')) {
                            uni.showToast({
                                icon: 'none',
                                title: '暂无项目修改权限, 请联系管理员',
                                duration: 1500
                            })
                            return
                        }
                        loading.value = true;
                        let queryParams = model.defaultPeriod === Number(model.period) ? [{
                            id: model.id,
                            proname: model.proname,
                            dispatch: model.dispatch,
                            proaddr: model.proaddr,
                            prosite: model.prosite,
                            longitude: model.longitude,
                            latitude: model.latitude,
                            // status: model.status,
                            dtype: model.dtype
                            // cpdbtime: String(getSystemDate(0, (model.cpdbtime as any)))
                        }] : [{
                            id: model.id,
                            proname: model.proname,
                            dispatch: model.dispatch,
                            proaddr: model.proaddr,
                            prosite: model.prosite,
                            longitude: model.longitude,
                            latitude: model.latitude,
                            period: Number(model.period),
                            // status: model.status,
                            dtype: model.dtype
                            // cpdbtime: String(getSystemDate(0, (model.cpdbtime as any)))
                        }];
                        message
                        .confirm({
                            msg: '确定要修改项目吗？',
                            title: '提示',
                            confirmButtonProps: {
                                type: 'error',
                            },
                        })
                        .then(async () => {
                            const data = await fetchUpdatePrjInfo(queryParams);
                            if (model.moreAddressList.length > 0) {
                                handleSavePidAndAddressChange(model.id);
                            } else {
                                uni.showToast({
                                    title: '修改项目成功',
                                    icon: 'none',
                                    duration: 1500,
                                    complete: () => {
                                        loading.value = false;
                                        handleClickLeft(true);
                                    }
                                });
                            }
                        })
                        .catch(() => {
                            loading.value = false;
                            console.log('点击了取消按钮');
                        });
                    } else {
                        if (!hasPermission('project:Info:insert')) {
                            uni.showToast({
                                icon: 'none',
                                title: '暂无项目新增权限, 请联系管理员',
                                duration: 1500
                            })
                            return
                        }
                        loading.value = true;
                        let queryParams = [{
                            proname: model.proname,
                            dispatch: model.dispatch,
                            proaddr: model.proaddr,
                            prosite: model.prosite,
                            longitude: model.longitude,
                            latitude: model.latitude,
                            uuid: uuid.value,
                            period: Number(model.period),
                            dtype: model.dtype
                            // cpdbtime: String(getSystemDate(0, (model.cpdbtime as any)))
                        }];
                        const data = await fetchSavePrjInfo(queryParams);
                        if (model.disname || model.contractname || model.moreAddressList.length > 0) {
                            getPrjIdByuuid();
                        } else {
                            uni.showToast({
                                title: '新增项目成功',
                                icon: 'none',
                                duration: 1500,
                                complete: () => {
                                    loading.value = false;
                                    handleClickLeft(true);
                                }
                            });
                        }
                    }
                } catch (err) {
                    loading.value = false;
                    if (model.id) {
                        console.error('修改项目失败', err);
                    } else {
                        console.error('新增项目失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

// 获取项目id
async function getPrjIdByuuid() {
    if (!hasPermission('project:Info:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无项目查询权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        const data = await fetchGetPrjIdByuuid(uuid.value);
        console.log('获取项目Id成功', data);
        if (model.disname) {
            handleSavePidAndDispatcherChange(data);
        } else {
            handleSavePidAndContractChange(data);
        }
    } catch (error) {
        loading.value = false;
        console.error('获取项目Id失败', error);
    }
}

// 新增pid与did
async function handleSavePidAndDispatcherChange(pid: number) {
    if (!hasPermission('project:DispatchContact:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无项目调度新增权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        let queryParams = dataForm.checkedDispatch.map((item: any) => {
            return {
                pid: pid,
                did: item
            }
        });
        const data = await fetchSavePrjDispatchContractInfo(queryParams);
        console.log('新增pid与did成功', data);
        if (model.contractname) {
            handleSavePidAndContractChange(pid);
        } else {
            uni.showToast({
                title: '新增项目成功',
                icon: 'none',
                duration: 1500,
                complete: () => {
                    loading.value = false;
                    handleClickLeft(true);
                }
            });
        }
    } catch (error) {
        console.error('新增pid与did失败', error);
        if (model.contractname) {
            handleSavePidAndContractChange(pid);
        } else {
            uni.showToast({
                title: '新增项目成功',
                icon: 'none',
                duration: 1500,
                complete: () => {
                    loading.value = false;
                    handleClickLeft(true);
                }
            });
        }
    }
}

// 新增pid与cid
async function handleSavePidAndContractChange(pid: number) {
    if (!hasPermission('project:DispatchContact:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无项目合同新增权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        let queryParams = dataForm.checkedContract.map((item: any) => {
            return {
                proid: pid,
                conid: item
            }
        });
        const data = await fetchSavePrjContractLinkInfo(queryParams);
        console.log('新增pid与cid成功', data);
        if (model.moreAddressList.length > 0) {
            handleSavePidAndAddressChange(pid);
        } else {
            uni.showToast({
                title: '新增项目成功',
                icon: 'none',
                duration: 1500,
                complete: () => {
                    loading.value = false;
                    handleClickLeft(true);
                }
            });
        }
    } catch (error) {
        loading.value = false;
        console.error('新增pid与did失败', error);
    }
}

// 新增pid与地址选择
async function handleSavePidAndAddressChange(pid: number) {
    try {
        if (!model.id) {
            let queryParams = model.moreAddressList.map(({ id, ...rest }: any) => ({ proid: pid, ...rest }));
            const data = await fetchSavePrjaddressInfo(queryParams);
            console.log('新增项目地址成功', data);
            uni.showToast({
                title: '新增项目成功',
                icon: 'none',
                duration: 1500,
                complete: () => {
                    loading.value = false;
                    handleClickLeft(true);
                }
            });
        } else {
            console.log('model.moreAddressList', model.moreAddressList);
            let addArr: any = model.moreAddressList
                .filter((item: any) => !model.pidadressMap[item.id])
                .map(({ id, ...rest }: any) => ({ pid: pid, ...rest }));  // 去掉 id 字段
            let updateArr: any = model.moreAddressList.filter((addrItem: any) => {
                const oldItem = model.pidadressMap[addrItem.id];
                return oldItem && (oldItem.addr !== addrItem.addr || oldItem.latitude !== addrItem.latitude || oldItem.longitude !== addrItem.longitude);
            }).map((item: any) => ({ pid: pid, ...item }));
            let deleteArr: any = Object.keys(model.pidadressMap)
                .filter(id => !model.moreAddressList.some((item: any) => item.id == id));
            console.log('addArr', addArr);
            console.log('updateArr', updateArr);
            console.log('deleteArr', deleteArr);

            // 统一处理：调用接口
            if (addArr.length) {
                await handleSavePrjAndAddressChange(addArr);
                console.log('新增完成');
            }
            if (updateArr.length) {
                await handleUpdatePrjAndAddressChange(updateArr);
                console.log('更新完成');
            }
            if (deleteArr.length) {
                await handleDeletePrjAndAddressChange(deleteArr);
                console.log('删除完成');
            }

            uni.showToast({
                title: '操作完成',
                icon: 'none',
                duration: 1500,
                complete: () => {
                    loading.value = false;
                    handleClickLeft(true)
                }
            });
        }
    } catch (error) {
        loading.value = false;
        console.error('新增pid与项目地址失败', error);
    }
}

// 新增pid与地址选择
async function handleSavePrjAndAddressChange(addArr: any) {
    try {
        await fetchSavePrjaddressInfo(addArr);
    } catch (error) {
        loading.value = false;
        console.error('新增pid与项目地址失败', error);
    }
}

// 修改pid与地址选择
async function handleUpdatePrjAndAddressChange(updateArr: any) {
    try {
        await fetchUpdatePrjaddressInfo(updateArr);
    } catch (error) {
        loading.value = false;
        console.error('修改pid与项目地址失败', error);
    }
}

// 删除pid与地址选择
async function handleDeletePrjAndAddressChange(deleteArr: any) {
    try {
        await fetchDeletePrjaddressInfo(deleteArr);
    } catch (error) {
        loading.value = false;
        console.error('删除pid与项目地址失败', error);
    }
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
    model.pidadressMap = {};
    getProvinceInfo();
    getPrjContractDataList();
    if (model.id) {
        getPrjInfo();
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
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow :title="model.id ? '修改项目' : '新增项目'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="项目名称" label-width="100px" prop="proname" required clearable v-model="model.proname" placeholder="请输入项目名称" />
                <wd-input label="调度名称" label-width="100px" prop="dispatch" clearable v-model="model.dispatch" placeholder="请输入调度名称" />
                <wd-input label="项目地址" label-width="100px" prop="prosite" required readonly suffix-icon="arrow-right" clearable v-model="model.prosite" placeholder="请选择项目地址" @click="handleOpenLocationChange" />
                <wd-textarea label="项目详细地址" label-width="100px" type="textarea" prop="proaddr" clearable v-model="model.proaddr" placeholder="请输入项目详细地址" />
                <wd-input v-if="!model.id" label="调度信息" label-width="100px" prop="disname" clearable disabled v-model="model.disname" placeholder="请选择调度">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkDispatchShowChange">调度信息</wd-button>
                    </template>
                </wd-input>
                <wd-input clearable type="number" required label="周期(天)" label-width="100px" prop="period" v-model="model.period" placeholder="请输入周期" />
                <!-- <wd-select-picker v-if="model.id" label="项目状态" label-width="100px" prop="status" v-model="model.status" :show-confirm="false" :columns="statusList" type="radio" :z-index="100" placeholder="请选择项目状态" /> -->
                <!-- <wd-calendar label="预计完成时间" label-width="100px" placeholder="请选择预计完成时间" prop="cpdbtime" v-model="model.cpdbtime" /> -->
                <wd-input v-if="!model.id" label="合同信息" label-width="100px" prop="contractname" clearable disabled v-model="model.contractname" placeholder="请选择合同">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handlePrjContractLinkShowChange">合同信息</wd-button>
                    </template>
                </wd-input>
                <wd-select-picker label="调试类型" label-width="100px" prop="dtype" v-model="model.dtype" :show-confirm="false" :columns="typeList" type="radio" :z-index="100" placeholder="请选择调试类型" />

                <view style="display: flex; justify-content: space-between; align-items: center; padding: 20rpx;">
                    <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap;">
                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                        <view style="margin-left: 10rpx; font-weight: bolder;">更多地址</view>
                    </view>

                    <view>
                        <wd-icon name="add-circle" size="20px" @click="handleAddAddressInfoChange"></wd-icon>
                    </view>
                </view>

                <view :style="{ margin: index === 0 ? '0 0 20rpx' : '20rpx 0', overflow: 'hidden' }"
                    v-for="(item, index) in model.moreAddressList" :key="index">
                    <wd-input label="项目地址" label-width="100px" required readonly suffix-icon="arrow-right" clearable v-model="item.addr" placeholder="请选择项目地址" @click="handleOpenMoreLocationChange(index)" />

                    <view
                        style="display: flex; justify-content: flex-end; align-items: center; gap: 10rpx; margin-top: 20rpx; padding-right: 10rpx;">
                        <wd-button hairline type="error" @click="model.moreAddressList.splice(index, 1)">删除</wd-button>
                        <wd-button hairline type="primary" @click="handleAddAddressInfoChange">添加</wd-button>
                    </view>
                </view>

                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="dispatchShow" position="left" @close="handleCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 330rpx);">
                <wd-cell-group border>
                    <wd-checkbox-group v-model="dataForm.checkedDispatch" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in dispatchDataList" :key="index" :title="item.dname" center>
                            <wd-checkbox :modelValue="item.id"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>
            </scroll-view>
        </wd-popup>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="contractShow" position="left" @close="handleContractCloseChange">
            <wd-gap height="50rpx" />

            <wd-search v-model="dataForm.contractFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchContractFuzzyChange" @cancel="handleSearchContractFuzzyChange" @clear="handleClearContractFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="contractTriggered" @refresherrefresh="handleScrollRefreshContractChange" @scrolltolower="handleScrolltolowerContractChange" style="height: calc(100vh - 240rpx);">
                <wd-cell-group border>
                    <wd-checkbox-group v-model="dataForm.checkedContract" @change="handleContractCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in contractDataList" :key="index" :title="item.contractname" center>
                            <wd-checkbox :modelValue="item.id"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>
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
</style>