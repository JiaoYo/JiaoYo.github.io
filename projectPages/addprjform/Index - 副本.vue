<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { v4 as uuidv4 } from "uuid";
import { fetchGetSystemconfigInfo, fetchGetPrjDataListBySelf, fetchGetPrjFormInfo, fetchSavePrjFormInfo, fetchUpdatePrjFormInfo, fetchGetPrjDispatchDataList, fetchGetProvinceInfo, fetchGetCityInfo, fetchGetCommissioningsheetByProId, fetchGetContractsPageByPrjId, fetchGetPrjDeviceDataList, fetchGetPrjWeightDataList, fetchGetPrjformMemberDataList, fetchGetPrjformDebugEquipmentDataList, fetchGetAllUserDataList, fetchGetPrjformDebugBusinessDataList, fetchSavePrjformFileInfo, fetchGetPrjformFileDataList } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import { hasPermission, getSystemDate, getProvinceIdByName, getFileType, isSupportedFileType, getExtensionFromUrl, downloadFile, isImageUrl } from '@/utils/index';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';
import CjxPreviewOffice from '@/uni_modules/cjx-previewOffice/components/cjx-previewOffice/cjx-previewOffice.vue';
import opCascader from '@/uni_modules/op-cascader/components/op-cascader/op-cascader.vue';

const form = ref();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

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

// 折叠面板
const collapseValue = ref<string>(['item1']);

// 调试设备选择框
const deviceShow = ref<boolean>(false);
const deviceTriggered = ref<boolean>(false);

// 调试业务选择框
const weightShow = ref<boolean>(false);
const weightDataList = ref<any>([]);
const weightTriggered = ref<boolean>(false);
const contactShow = ref<boolean>(false);
const contactDataList = ref<any>([]);
const allContactDataList = ref<any>([]);
const contactTriggered = ref<boolean>(false);
const userShow = ref<boolean>(false);
const userDataList = ref<any>([]);
const allUserDataList = ref<any>([]);
const userTriggered = ref<boolean>(false);
const debugEquipmentShow = ref<boolean>(false);
const debugEquipmentDataList = ref<any>([]);
const allDebugEquipmentDataList = ref<any>([]);
const debuggerEquipmentTriggered = ref<boolean>(false);

const userId = ref<number>(uni.getStorageSync('userId'));

// 项目图纸列表
const projectDrawingsFileList = ref<any[]>([]);

// 项目文件
const ipAddressList = ref<any[]>([]);

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
	devicePage: number;
	deviceTotal: number;
	deviceFuzzy: string;
	checkedDev: any;
	deviceDataList: any;
	selectedEquipmentIndex: number;
	weightPage: number;
	weightLimit: number;
	weightTotal: number;
	weightFuzzy: string;
	checkedWeight: any;
	contactPage: number;
	contactLimit: number;
	contactTotal: number;
	contactFuzzy: string;
	checkedContact: any;
	debugEquipmentPage: number;
	debugEquipmentLimit: number;
	debugEquipmentTotal: number;
	debugEquipmentFuzzy: string;
	checkedDebugEquipment: any;
	userPage: number;
	userLimit: number;
	userTotal: number;
	userFuzzy: string;
	checkedUser: any;
	selectedBusinessIndex: number;
	debugPage: number;
	debugLimit: number;
	debugTotal: number;
	selectedDebuggerIndex: number;
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
    regionFuzzy: '',
	devicePage: 1,
	deviceTotal: 0,
	deviceFuzzy: '',
	checkedDev: null,
	deviceDataList: [],
	selectedEquipmentIndex: 0,
	weightPage: 1,
	weightLimit: 100,
	weightTotal: 0,
	weightFuzzy: '',
	checkedWeight: null,
	contactPage: 1,
	contactLimit: 100,
	contactTotal: 0,
	contactFuzzy: '',
	checkedContact: null,
	debugEquipmentPage: 1,
	debugEquipmentLimit: 100,
	debugEquipmentTotal: 0,
	debugEquipmentFuzzy: '',
	checkedDebugEquipment: null,
	userPage: 1,
	userLimit: 100,
	userTotal: 0,
	userFuzzy: '',
	checkedUser: null,
	debugPage: 1,
	debugLimit: 100,
	debugTotal: 0,
	selectedDebuggerIndex: 0
})

const contractDataList = ref<any>([]);

const selectAll = ref<any>([]);

const props = { label: 'label', value: 'value', children: 'children'};

const devStatusList = ref<any[]>([
    {
        label: '正常',
        value: 0
    },
    {
        label: '异常',
        value: 1
    },
    {
        label: '未知',
        value: 2
    }
]);

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
	projectFormContactPojoList: any;
	allProjectFormContactPojoList: any;
	projectFormDebugPojos: any;
	projectFormEquipmentPojoList: any;
	allProjectFormEquipmentPojoList: any;
	projectFormFilePojos: any;
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
	projectFormContactPojoList: [],
	projectFormDebugPojos: [],
	projectFormEquipmentPojoList: [],
	projectFormFilePojos: []
});

const prjDetailInfo = reactive({
	file1List: [],
	file2List: []
})

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

function generateSecureDigitId() {
	// 生成 10 位纯数字，基于加密安全随机数
	let id = '';
	while (id.length < 9) {
		// 生成 0-9 的安全随机整数
		const array = new Uint8Array(1);
		crypto.getRandomValues(array);
		const digit = array[0] % 10; // 取 0-9
		id += digit;
	}
	return Number(id);
}

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
		getPrjContractDataList();
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

// 新增联系人
function handleAddContractChange() {
	model.projectFormContactPojoList.push({
		id: model.projectFormContactPojoList.length + 1,
		docker: model.docker,
		pname: model.pname,
		pcontact: model.pcontact,
		proposition: model.proposition
	})
}

// 删除调试设备
function handleDeleteProjectFormEquipmentChange(index: number) {
	// const toDelete = model.projectFormDebugPojos.length > 0 ? model.projectFormDebugPojos.filter(item2 => model.projectFormEquipmentPojoList.some(item1 => item1.eqmid === item2.eqmid)) : [];
	const equipmentEqmIds = new Set(model.projectFormEquipmentPojoList.map((e: any) => e.eqmid));
	const toDelete = model.projectFormDebugPojos.filter((item2: any) => !equipmentEqmIds.has(item2.eqmid));
	console.log('toDelete', toDelete, toDelete.length);
	if (toDelete.length > 0) {
		message
			.confirm({
				msg: '系统检测到待调试业务存在该调试设备，删除将会同步删除待调试业务，确定要删除吗？',
				title: '提示',
				confirmButtonProps: {
					type: 'error',
				},
			})
			.then(async () => {
				model.projectFormDebugPojos = model.projectFormDebugPojos.filter((item: any) => equipmentEqmIds.has(item.eqmid));
				console.log('model.projectFormDebugPojos', model.projectFormDebugPojos);
				// model.projectFormDebugPojos = model.projectFormDebugPojos.filter(item2 => !model.projectFormEquipmentPojoList.some(item1 => item1.eqmid === item2.eqmid));
				model.projectFormEquipmentPojoList.splice(index, 1);
			})
			.catch(() => {
				console.log('点击了取消按钮');
			});
	} else {
		model.projectFormEquipmentPojoList.splice(index, 1);
	}
}

// 新增调试设备
function handleAddProjectFormEquipmentChange() {
	selectAll.value = [];
	model.projectFormEquipmentPojoList.push({
		id: model.projectFormEquipmentPojoList.length + 1,
		cid: null,
		devname: '',
		devname2: '',
		devmodel: '',
		devnum: 1,
		devunit: '',
		notes: '',
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
		install: 0,
		connectionmode: '',
		devstatus: 0,
		manucontact: '',
		manuinfo: '',
		eqmid: generateSecureDigitId(),
		fileList: [],
		file2List: [],
		file3List: [],
		file4List: []
	})
}

// 打开合同设备信息
function handleLinkDeviceShowChange(index: number) {
	if (!dataForm.checkedPrj) {
		uni.showToast({
			icon: 'none',
			title: '请先选择项目',
			duration: 1500
		})
		return
	}
	if (contractDataList.value.length === 0) {
		uni.showToast({
			icon: 'none',
			title: '暂无合同设备信息',
			duration: 1500
		})
		return
	}
	selectAll.value = [];
	if (model.id) {
		contractDataList.value.forEach((item: any) => {
		    item.children.forEach((childrenItem: any) => {
				if (childrenItem.value === debugEquipmentDataList.value[dataForm.selectedEquipmentIndex].cid) {
					selectAll.value = [item.value, debugEquipmentDataList.value[dataForm.selectedEquipmentIndex].cid];
				}
		    });
		});
	}
	dataForm.selectedEquipmentIndex = index;
    deviceShow.value = true;
}

// 关闭合同设备信息
function handleDeviceCloseChange() {
    deviceShow.value = false;
}

// 获取合同数据源
async function getPrjContractDataList() {
    try {
        let queryParams: any = {
            page: 1,
            limit: 100,
            id: dataForm.checkedPrj
        };
        const data = await fetchGetContractsPageByPrjId(queryParams);
        contractDataList.value = data.list.length > 0 ? data.list.map((item: any) => {
            return {
                label: item.contractname,
                value: item.id,
                children: []
            }
        }) : [];
        dataForm.devicePage = 1;
        getPrjDeviceDataList();
    } catch (error) {
        console.log('获取合同设备数据源设备', error);
    }
}

// 获取合同设备数据源
async function getPrjDeviceDataList() {
    if (dataForm.devicePage === 1) {
        dataForm.deviceDataList = [];
    }
    try {
        let queryParams: any = {
            page: dataForm.devicePage,
            limit: 100
        };
        if (contractDataList.value.length > 0) {
            queryParams['pids'] = contractDataList.value.map((item: any) => item.value).filter((id: any) => id !== null && id !== undefined).join(',');
        }
        const data = await fetchGetPrjDeviceDataList(queryParams);
        dataForm.deviceDataList = dataForm.deviceDataList.concat(data.list);
        dataForm.deviceTotal = Number(data.total);
        contractDataList.value.forEach((item: any) => {
            // 清空已有的 children
            item.children = [];
             // 查找所有 pid 等于当前 item.value 的子项
            dataForm.deviceDataList.forEach((child: any) => {
                if (child.pid === item.value) {
                    item.children.push({
                        label: child.devname,
                        value: child.id
                    });
                }
                // if (prjForm.debugEquipmentId && dataForm.checkedDev == child.id) {
                //     selectAll.value = [child.pid, dataForm.checkedDev];
                // }
            });
        });
    } catch (error) {
        console.log('获取合同设备数据源设备', error);
    }
}

// 刷新
function handleScrollDeviceRefreshChange() {
    deviceTriggered.value = true;
    getPrjDeviceDataList();
    setTimeout(() => {
        deviceTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrollDevicetolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && dataForm.deviceDataList.length < dataForm.deviceTotal) {
        dataForm.devicePage++;
        getPrjDeviceDataList();
    }
}

// 选择合同设备
function handleRadioSelectChange(data: any) {
    if (data.length > 1) {
        dataForm.checkedDev = data[1];
        const deviceObj = dataForm.deviceDataList.find((item: any) => data[1] === item.id);
		model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].cid = dataForm.checkedDev;
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devname = deviceObj ? deviceObj.devname : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devname2 = deviceObj ? deviceObj.devname : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devmodel = deviceObj ? deviceObj.devmodel : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].etype = deviceObj ? deviceObj.devtype : 0;
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devmanu = deviceObj ? deviceObj.devmanu : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].notes = deviceObj ? deviceObj.notes : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devnum = deviceObj ? deviceObj.devcount || 1 : 1;
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devunit = deviceObj ? deviceObj.devunit || '' : '';
        deviceShow.value = false;
    } else {
        dataForm.checkedDev = null;
        const deviceObj: any = null;
		model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].cid = null;
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devname = deviceObj ? deviceObj.devname : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devname2 = deviceObj ? deviceObj.devname : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devmodel = deviceObj ? deviceObj.devmodel : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].etype = deviceObj ? deviceObj.devtype : 0;
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devmanu = deviceObj ? deviceObj.devmanu : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].notes = deviceObj ? deviceObj.notes : '';
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devnum = deviceObj ? deviceObj.devcount || 1 : 1;
        model.projectFormEquipmentPojoList[dataForm.selectedEquipmentIndex].devunit = deviceObj ? deviceObj.devunit || '' : '';
    }
}

// APP上传文件(附件1)
async function handleUploadFile1ClickChange(data: any, fileIndex: number) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.projectFormEquipmentPojoList[fileIndex].fileList = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.projectFormEquipmentPojoList[fileIndex].fl1 = response.data;
            model.projectFormEquipmentPojoList[fileIndex].re1 = file.name;
            model.projectFormEquipmentPojoList[fileIndex].fileList = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件2)
async function handleUploadFile2ClickChange(data: any, fileIndex: number) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.projectFormEquipmentPojoList[fileIndex].file2List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.projectFormEquipmentPojoList[fileIndex].fl2 = response.data;
            model.projectFormEquipmentPojoList[fileIndex].re2 = file.name;
            model.projectFormEquipmentPojoList[fileIndex].file2List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件3)
async function handleUploadFile3ClickChange(data: any, fileIndex: number) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.projectFormEquipmentPojoList[fileIndex].file3List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.projectFormEquipmentPojoList[fileIndex].fl3 = response.data;
            model.projectFormEquipmentPojoList[fileIndex].re3 = file.name;
            model.projectFormEquipmentPojoList[fileIndex].file3List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件4)
async function handleUploadFile4ClickChange(data: any, fileIndex: number) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.projectFormEquipmentPojoList[fileIndex].file4List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.projectFormEquipmentPojoList[fileIndex].fl4 = response.data;
            model.projectFormEquipmentPojoList[fileIndex].re4 = file.name;
            model.projectFormEquipmentPojoList[fileIndex].file4List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// 新增待调试业务
function handleAddProjectFormDebugbuinessChange() {
	model.projectFormDebugPojos.push({
		debugname: '',
		docker: '',
		dockcharge: '',
		dockcontact: '',
		notes: '',
		re1: '',
		re2: '',
		re3: '',
		re4: '',
		fl1: '',
		fl2: '',
		fl3: '',
		fl4: '',
		dtype: null,
		dtypename: '',
		eqmid: null,
		equipmentName: '',
		dbcreater: null,
		uname: '',
		rangeTime: [],
		fileList: [],
		file2List: [],
		file3List: [],
		file4List: [],
		// rangeTime: [Date.now(), Date.now() + 90 * 24 * 60 * 60 * 1000]
	})
}

// 清除
function handleClearUserChange() {
    userDataList.value = allUserDataList.value;
}

// 搜索
function handleSearchUserChange() {
    userDataList.value = allUserDataList.value.filter((item: any) => item.username.indexOf(dataForm.fuzzy) !== -1);
}

// 获取全部调试人员
async function getAllUserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (dataForm.userPage === 1) {
            userDataList.value = [];
            allUserDataList.value = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.userPage, limit: dataForm.userLimit, usertypes: '2, 3' });
        userDataList.value = userDataList.value.concat(data.list);
        allUserDataList.value = allUserDataList.value.concat(data.list);
        dataForm.userTotal = Number(data.total);
    } catch (error) {
        console.error('获取全部调试人员失败', error);
    }
}

// 打开工程师选择弹框
async function handleLinkMemberShowChange(index: number) {
	dataForm.selectedDebuggerIndex = index;
	dataForm.userFuzzy = model.projectFormDebugPojos[index].uname || '';
	dataForm.checkedUser = model.projectFormDebugPojos[index].dbcreater || null;
    userShow.value = true;
}

// 工程师刷新
function handleScrollUserRefreshChange() {
    userTriggered.value = true;
    dataForm.page = 1;
    getAllUserDataList();
    setTimeout(() => {
        userTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerUserChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && allUserDataList.value.length < dataForm.userTotal) {
        dataForm.userPage++;
        getAllUserDataList();
    }
}

// 关闭选择人员弹框
function handleCloseUserChange() {
    userShow.value = false;
}

// 选择调试工程师
function handleRadioUserSelectChange({ value }: { value: any }) {
    const names = userDataList.value.find((item: any) => value === item.id);
	model.projectFormDebugPojos[dataForm.selectedDebuggerIndex].uname = names ? names.username : '';
	model.projectFormDebugPojos[dataForm.selectedDebuggerIndex].dbcreater = value;
    userShow.value = false;
}

// 清除工程调试单权重
function handleClearWeightFuzzyChange() {
    dataForm.weightPage = 1;
    getAllWeightDataList();
}

// 搜索工程调试单权重
function handleSearchWeightFuzzyChange() {
    dataForm.weightPage = 1;
    getAllWeightDataList();
}

// 获取全部工程调试单权重
async function getAllWeightDataList() {
    if (dataForm.weightPage === 1) {
        weightDataList.value = [];
    }
    try {
        const data = await fetchGetPrjWeightDataList({ page: dataForm.weightPage, limit: dataForm.weightLimit, fuzzy: dataForm.weightFuzzy });
        weightDataList.value = weightDataList.value.concat(data.list);
        dataForm.weightTotal = Number(data.total);
    } catch (error) {
        console.error('获取全部权重失败', error);
    }
}

// 打开工程调试单权重选择弹框
async function handleLinkWeightShowChange(index: number) {
	dataForm.selectedBusinessIndex = index;
	dataForm.weightFuzzy = model.projectFormDebugPojos[index].dtypename || '';
	dataForm.checkedWeight = model.projectFormDebugPojos[index].dtype || null;
    weightShow.value = true;
}

// 刷新(工程调试单权重)
function handleScrollRefreshWeightChange() {
    triggered.value = true;
    dataForm.weightPage = 1;
    getAllWeightDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(工程调试单权重)
function handleScrolltolowerWeightChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && weightDataList.value.length < dataForm.weightTotal) {
        dataForm.weightPage++;
        getAllWeightDataList();
    }
}

// 关闭工程调试单权重弹框
function handleCloseWeightChange() {
    weightShow.value = false;
}

// 选择工程调试单权重
function handleRadioSelectWeightChange({ value }: { value: any }) {
    const names = weightDataList.value.find((item: any) => value === item.id);
	model.projectFormDebugPojos[dataForm.selectedBusinessIndex].dtype = value;
    model.projectFormDebugPojos[dataForm.selectedBusinessIndex].dtypename = names ? names.tname : null;
    model.projectFormDebugPojos[dataForm.selectedBusinessIndex].debugname = names ? names.tname : '';
    weightShow.value = false;
}

// 清除工程调试单对接人
function handleClearContactFuzzyChange() {
    dataForm.contactPage = 1;
	contactDataList.value = allContactDataList.value;
}

// 搜索工程调试单对接人
function handleSearchContactFuzzyChange() {
    dataForm.contactPage = 1;
	if (dataForm.userFuzzy) {
		contactDataList.value = allContactDataList.value.filter((item: any) => item.pname.toLocaleLowerCase().indexOf(dataForm.userFuzzy.toLocaleLowerCase()) !== -1);
	} else {
		contactDataList.value = allContactDataList.value;
	}
}

// 获取工程调试单全部对接人
async function getAllContactDataList() {
    if (dataForm.contactPage === 1) {
        contactDataList.value = [];
		model.allProjectFormContactPojoList = [];
    }
    try {
        const data = await fetchGetPrjformMemberDataList({ page: dataForm.contactPage, limit: dataForm.contactLimit, pid: model.id, fuzzy: dataForm.contactFuzzy });
        contactDataList.value = contactDataList.value.concat(data.list);
		model.projectFormContactPojoList = model.projectFormContactPojoList.concat(data.list);
        dataForm.contactTotal = Number(data.total);
		console.log('获取工程调试单全部对接人成功', contactDataList.value);
    } catch (error) {
        console.error('获取工程调试单全部对接人失败', error);
    }
}

// 打开工程调试单对接人选择弹框
async function handleLinkContactShowChange(index: number) {
	if (model.projectFormContactPojoList.length === 0) {
		uni.showToast({
			icon: 'none',
			title: '暂无联系人可进行选择，请先添加联系人',
			duration: 1500
		})
		return
	}
	dataForm.selectedBusinessIndex = index;
	allContactDataList.value = model.projectFormContactPojoList;
	if (dataForm.contactFuzzy) {
		contactDataList.value = allContactDataList.value.filter((item: any) => item.pname.toLocaleLowerCase().indexOf(dataForm.contactFuzzy.toLocaleLowerCase()) !== -1);
	} else {
		contactDataList.value = allContactDataList.value;
	}
	if (model.projectFormDebugPojos[index].docker || model.projectFormDebugPojos[index].dockcharge || model.projectFormDebugPojos[index].dockcontact) {
		dataForm.checkedContact = contactDataList.value.find((item: any) => item.docker === model.projectFormDebugPojos[index].docker).id || null;
		dataForm.contactFuzzy = model.projectFormDebugPojos[index].docker || '';
	} else {
		dataForm.checkedContact = null;
		dataForm.contactFuzzy = '';
	}
    contactShow.value = true;
}

// 刷新(工程调试单对接人)
function handleScrollContactRefreshChange() {
    contactTriggered.value = true;
    dataForm.contactPage = 1;
    getAllContactDataList();
    setTimeout(() => {
        contactTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(工程调试单对接人)
function handleScrollContacttolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && contactDataList.value.length < dataForm.contactTotal) {
        dataForm.contactPage++;
        getAllContactDataList();
    }
}

// 关闭工程调试单对接人弹框
function handleCloseContactChange() {
    contactShow.value = false;
}

// 选择工程调试单对接人
function handleRadioSelectContactChange({ value }: { value: any }) {
    const names = contactDataList.value.find((item: any) => value === item.id);
    model.projectFormDebugPojos[dataForm.selectedBusinessIndex].docker = names ? names.docker : null;
    model.projectFormDebugPojos[dataForm.selectedBusinessIndex].dockcharge = names ? names.pname : '';
    model.projectFormDebugPojos[dataForm.selectedBusinessIndex].dockcontact = names ? names.pcontact : '';
    contactShow.value = false;
}

// 清除工程调试单待调试设备
function handleDebugEquipmentClearChange() {
    dataForm.debugEquipmentPage = 1;
	debugEquipmentDataList.value = allDebugEquipmentDataList.value;
}

// 搜索工程调试单待调试设备
function handleDebugEquipmentSearchChange() {
    dataForm.debugEquipmentPage = 1;
	if (dataForm.debugEquipmentFuzzy) {
		debugEquipmentDataList.value = allDebugEquipmentDataList.value.filter((item: any) => item.devname.toLocaleLowerCase().indexOf(dataForm.debugEquipmentFuzzy.toLocaleLowerCase()) !== -1);
	} else {
		debugEquipmentDataList.value = allDebugEquipmentDataList.value;
	}
}

// 获取工程调试单待调试设备
async function getAllDebugEquipmentDataList() {
    if (dataForm.debugEquipmentPage === 1) {
        debugEquipmentDataList.value = [];
		model.projectFormEquipmentPojoList = [];
    }
    try {
        const data = await fetchGetPrjformDebugEquipmentDataList({ page: dataForm.debugEquipmentPage, limit: dataForm.debugEquipmentLimit, fuzzy: dataForm.debugEquipmentFuzzy, pid: model.id });
        debugEquipmentDataList.value = debugEquipmentDataList.value.concat(data.list);
		model.projectFormEquipmentPojoList = model.projectFormEquipmentPojoList.concat(data.list);
        dataForm.debugEquipmentTotal = Number(data.total);
    } catch (error) {
        console.error('获取工程调试单待调试设备失败', error);
    }
}

// 打开工程调试单待调试设备选择弹框
async function handleLinkDebugEquipmentShowChange(index: number) {
	if (model.projectFormEquipmentPojoList.length === 0) {
		uni.showToast({
			icon: 'none',
			title: '暂无调试设备可进行选择，请先添加调试设备',
			duration: 1500
		})
		return
	}
	dataForm.selectedBusinessIndex = index;
	allDebugEquipmentDataList.value = model.projectFormEquipmentPojoList;
	if (dataForm.debugEquipmentFuzzy) {
		debugEquipmentDataList.value = allDebugEquipmentDataList.value.filter((item: any) => item.pname.toLocaleLowerCase().indexOf(dataForm.userFuzzy.toLocaleLowerCase()) !== -1);
	} else {
		debugEquipmentDataList.value = allDebugEquipmentDataList.value;
	}
	dataForm.checkedDebugEquipment = model.projectFormDebugPojos[index].eqmid || null;
	dataForm.debugEquipmentFuzzy = model.projectFormDebugPojos[index].equipmentName || '';
    debugEquipmentShow.value = true;
}

// 刷新工程调试单待调试设备
function handleScrollDebugEquipmentRefreshChange() {
    debuggerEquipmentTriggered.value = true;
    dataForm.debugEquipmentPage = 1;
	
    setTimeout(() => {
        debuggerEquipmentTriggered.value = false;
    }, 1000)
}

// 关闭工程调试单待调试设备弹框
function handleDebugEquipmentCloseChange() {
    debugEquipmentShow.value = false;
}

// 选择工程调试单待调试设备
function handleRadioSelectDebugEquipmentChange({ value }: { value: any }) {
    const names = debugEquipmentDataList.value.find((item: any) => value === item.eqmid);
    model.projectFormDebugPojos[dataForm.selectedBusinessIndex].eqmid = value;
    model.projectFormDebugPojos[dataForm.selectedBusinessIndex].equipmentName = names ? names.devname : null;
    debugEquipmentShow.value = false;
}

// 获取工程调试单待调试业务
async function getAllDebugDataList() {
    if (dataForm.debugPage === 1) {
		model.projectFormDebugPojos = [];
    }
    try {
        const data = await fetchGetPrjformDebugBusinessDataList({ page: dataForm.debugPage, limit: dataForm.debugLimit, pid: model.id, creater: 1001 || Number(userId.value) });
		model.projectFormDebugPojos = model.projectFormDebugPojos.concat(data.list.map((item: any) => {
			return {
				...item,
				dtypename: item.tname,
				equipmentName: item.eqmname,
				uname: item.dbusername,
				rangeTime: [getSystemDate(5, item.starttime), getSystemDate(5, item.endtime)]
			}
		}));
        dataForm.debugTotal = Number(data.total);
    } catch (error) {
        console.error('获取工程调试单待调试设备失败', error);
    }
}

// APP上传文件(附件1)
async function handleUploadFileBusiness1ClickChange(data: any, fileIndex: number) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
			model.projectFormDebugPojos[fileIndex].file1List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.projectFormDebugPojos[fileIndex].fl1 = response.data;
            model.projectFormDebugPojos[fileIndex].re1 = file.name;
			model.projectFormDebugPojos[fileIndex].file1List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件2)
async function handleUploadFileBusiness2ClickChange(data: any, fileIndex: number) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
			model.projectFormDebugPojos[fileIndex].file2List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.projectFormDebugPojos[fileIndex].fl2 = response.data;
            model.projectFormDebugPojos[fileIndex].re2 = file.name;
			model.projectFormDebugPojos[fileIndex].file2List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件3)
async function handleUploadFileBusiness3ClickChange(data: any, fileIndex: number) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
			model.projectFormDebugPojos[fileIndex].file3List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.projectFormDebugPojos[fileIndex].fl3 = response.data;
            model.projectFormDebugPojos[fileIndex].re3 = file.name;
			model.projectFormDebugPojos[fileIndex].file3List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(附件4)
async function handleUploadFileBusiness4ClickChange(data: any, fileIndex: number) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
			model.projectFormDebugPojos[fileIndex].file4List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        await uploadFile(file, '', (response, file) => {
            model.projectFormDebugPojos[fileIndex].fl4 = response.data;
            model.projectFormDebugPojos[fileIndex].re4 = file.name;
			model.projectFormDebugPojos[fileIndex].file4List = [];
        },
        (error, file) => {
            console.error('上传失败:', error);
        })
    });
}

// APP上传文件(项目图纸)
async function handleUploadClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                file.url = response.data;
                // 同步更新 model
                // handleUpdateFileInsertChange(fileUrl, (file.name as string), 1);
				projectDrawingsFileList.value.push({
					file: fileUrl,
					url: fileUrl,
					filename: (file.name as string),
					sort: 1
				})
				console.log('projectDrawingsFileList', projectDrawingsFileList.value);
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// APP上传文件(项目文件)
async function handleUploadIpaddressClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                // 同步更新 model
                // handleUpdateFileInsertChange(fileUrl, (file.name as string), 2);
				ipAddressList.value.push({
					file: fileUrl,
					url: fileUrl,
					filename: (file.name as string),
					sort: 2
				})
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// 删除项目文件
async function handleDeleteFileChange(url: string, index: number, type: number) {
    message
    .confirm({
        msg: '确定要删除该文件吗？',
        title: '提示',
        confirmButtonProps: {
            type: 'error',
        },
    })
    .then(async () => {
        if (!hasPermission('project:form:File:delete')) {
            uni.showToast({
                icon: 'none',
                title: '暂无删除文件权限，请联系管理员',
                duration: 1500
            })
            return
        }
        try {
            const data = await fetchDeletePrjFileDetailInfo(url.includes("?") ? url.split("?")[0] : url);
            uni.showToast({
                icon: "none",
                title: "删除成功",
                duration: 1500,
                complete: async () => {
					if (type === 1) {
						projectDrawingsFileList.value.splice(index, 1);
					} else {
						ipAddressList.value.splice(index, 1);
					}
                }
            })
        } catch (error) {
            console.error('删除失败', error);
        }
    })
    .catch(() => {
        console.log('点击了取消按钮');
    });
}

// 预览
const handlePreviewFileChange = (url: string) => {
    if (!isSupportedFileType(url) && !isImageUrl(url)) {
        uni.showToast({
            icon: 'none',
            duration: 1500,
            title: '该文件无法预览，请下载至本地进行查看'
        })
        // uni.navigateTo({
        //     url: '/projectPages/preview/Index?url=' + encodeURIComponent(url) + '&ext=' + getExtensionFromUrl(url).toLocaleLowerCase()
        // })
    } else {
        // uni.showToast({
        //     icon: 'none',
        //     duration: 1500,
        //     title: '该文件无法预览，请下载至本地进行查看'
        // })
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
		dataForm.prjFuzzy = data.proname;
		dataForm.checkedPrj = data.proid;
		// await getPrjContractDataList();
		await getProvinceInfo();
		await getPrjDataList();
		// await getAllWeightDataList();
		// await getAllContactDataList();
		// await getAllDebugEquipmentDataList();
		// await getAllUserDataList();
		// await getAllDebugDataList();
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
					let flag: boolean = true;
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
						if (model.projectFormContactPojoList.length > 0) {
							for (var i = 0; i < model.projectFormContactPojoList.length; i++) {
								if (!model.projectFormContactPojoList[i].docker) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入对接方',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormContactPojoList[i].pname) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入姓名',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormContactPojoList[i].pcontact) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入联系方式',
									    duration: 1500
									})
									break;
								}
							}
						}
						
						if (model.projectFormEquipmentPojoList.length > 0) {
							for (var i = 0; i < model.projectFormEquipmentPojoList.length; i++) {
								if (!model.projectFormEquipmentPojoList[i].devname) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入设备名称',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormEquipmentPojoList[i].devnum) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入设备数量',
									    duration: 1500
									})
									break;
								}
							}
						}
						
						if (model.projectFormDebugPojos.length > 0) {
							for (var i = 0; i < model.projectFormDebugPojos.length; i++) {
								if (!model.projectFormDebugPojos[i].dtypename) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请选择权重',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormDebugPojos[i].debugname) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入业务名称',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormDebugPojos[i].docker) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入对接方',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormDebugPojos[i].dockcharge) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入对接方负责人',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormDebugPojos[i].dockcontact) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请输入联系方式',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormDebugPojos[i].equipmentName) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请选择调试设备',
									    duration: 1500
									})
									break;
								}
								if (!model.projectFormDebugPojos[i].uname) {
									flag = false;
									uni.showToast({
									    icon: 'none',
									    title: '请选择调试工程师',
									    duration: 1500
									})
									break;
								}
							}
						}
						if (!flag) {
							return
						}
						
						if (model.projectFormEquipmentPojoList.length === 0) {
							if (model.projectFormDebugPojos.length > 0) {
								message
								.confirm({
								    msg: '系统检测到暂无待调试设备，继续提交将删除待调试业务，确定要提交吗？',
								    title: '提示',
								    confirmButtonProps: {
								        type: 'error',
								    },
								})
								.then(async () => {
									model.projectFormDebugPojos = [];
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
										projectFormContactPojoList: model.projectFormContactPojoList.map((item: any) => {
											return {
												docker: item.docker,
												pcontact: item.pcontact,
												pname: item.pname,
												proposition: item.proposition,
												pid: dataForm.checkedPrj
											}
										}),
										projectFormDebugPojos: model.projectFormDebugPojos.map((item: any) => {
											return {
												...item,
												dbcreater: item.dbcreater,
												debugname: item.debugname,
												dockcharge: item.dockcharge,
												dockcontact: item.dockcontact,
												docker: item.docker,
												dtype: item.dtype,
												eqmid: item.eqmid,
												pid: dataForm.checkedPrj,
												fl1: item.fl1,
												fl2: item.fl2,
												fl3: item.fl3,
												fl4: item.fl4,
												notes: item.notes,
												re1: item.re1,
												re2: item.re2,
												re3: item.re3,
												re4: item.re4
											}
										}),
										projectFormEquipmentPojoList: model.projectFormEquipmentPojoList.map((item: any) => {
											return {
												cid: item.cid,
												connectionmode: item.connectionmode,
												devmanu: item.devmanu,
												devmodel: item.devmodel,
												devname: item.devname,
												devnum: item.devnum,
												devstatus: item.devstatus,
												devunit: item.devunit,
												eqmid: item.eqmid,
												etype: item.etype,
												fl1: item.fl1,
												fl2: item.fl2,
												fl3: item.fl3,
												fl4: item.fl4,
												install: item.install,
												manucontact: item.manucontact,
												manuinfo: item.manuinfo,
												notes: item.notes,
												re1: item.re1,
												re2: item.re2,
												re3: item.re3,
												re4: item.re4,
												pid: dataForm.checkedPrj
											}
										}),
										projectFormFilePojos: projectDrawingsFileList.value.concat(ipAddressList.value).map((item: any) => {
											return {
												file: item.file,
												filename: item.filename,
												sort: item.sort,
												pid: dataForm.checkedPrj
											}
										}),
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
								})
								.catch(() => {
								    console.log('点击了取消按钮');
								});
							} else {
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
									projectFormContactPojoList: model.projectFormContactPojoList.map((item: any) => {
										return {
											docker: item.docker,
											pcontact: item.pcontact,
											pname: item.pname,
											proposition: item.proposition,
											pid: dataForm.checkedPrj
										}
									}),
									projectFormDebugPojos: model.projectFormDebugPojos.map((item: any) => {
										return {
											...item,
											dbcreater: item.dbcreater,
											debugname: item.debugname,
											dockcharge: item.dockcharge,
											dockcontact: item.dockcontact,
											docker: item.docker,
											dtype: item.dtype,
											eqmid: item.eqmid,
											pid: dataForm.checkedPrj,
											fl1: item.fl1,
											fl2: item.fl2,
											fl3: item.fl3,
											fl4: item.fl4,
											notes: item.notes,
											re1: item.re1,
											re2: item.re2,
											re3: item.re3,
											re4: item.re4
										}
									}),
									projectFormEquipmentPojoList: model.projectFormEquipmentPojoList.map((item: any) => {
										return {
											cid: item.cid,
											connectionmode: item.connectionmode,
											devmanu: item.devmanu,
											devmodel: item.devmodel,
											devname: item.devname,
											devnum: item.devnum,
											devstatus: item.devstatus,
											devunit: item.devunit,
											eqmid: item.eqmid,
											etype: item.etype,
											fl1: item.fl1,
											fl2: item.fl2,
											fl3: item.fl3,
											fl4: item.fl4,
											install: item.install,
											manucontact: item.manucontact,
											manuinfo: item.manuinfo,
											notes: item.notes,
											re1: item.re1,
											re2: item.re2,
											re3: item.re3,
											re4: item.re4,
											pid: dataForm.checkedPrj
										}
									}),
									projectFormFilePojos: projectDrawingsFileList.value.concat(ipAddressList.value).map((item: any) => {
										return {
											file: item.file,
											filename: item.filename,
											sort: item.sort,
											pid: dataForm.checkedPrj
										}
									}),
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
						} else {
							if (model.projectFormDebugPojos.length > 0) {
								const toDelete = model.projectFormDebugPojos.filter(item2 => !model.projectFormEquipmentPojoList.some(item1 => item1.eqmid === item2.eqmid));
								if (toDelete.length === 0) {
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
										projectFormContactPojoList: model.projectFormContactPojoList.map((item: any) => {
											return {
												docker: item.docker,
												pcontact: item.pcontact,
												pname: item.pname,
												proposition: item.proposition,
												pid: dataForm.checkedPrj
											}
										}),
										projectFormDebugPojos: model.projectFormDebugPojos.map((item: any) => {
											return {
												...item,
												dbcreater: item.dbcreater,
												debugname: item.debugname,
												dockcharge: item.dockcharge,
												dockcontact: item.dockcontact,
												docker: item.docker,
												dtype: item.dtype,
												eqmid: item.eqmid,
												pid: dataForm.checkedPrj,
												fl1: item.fl1,
												fl2: item.fl2,
												fl3: item.fl3,
												fl4: item.fl4,
												notes: item.notes,
												re1: item.re1,
												re2: item.re2,
												re3: item.re3,
												re4: item.re4
											}
										}),
										projectFormEquipmentPojoList: model.projectFormEquipmentPojoList.map((item: any) => {
											return {
												cid: item.cid,
												connectionmode: item.connectionmode,
												devmanu: item.devmanu,
												devmodel: item.devmodel,
												devname: item.devname,
												devnum: item.devnum,
												devstatus: item.devstatus,
												devunit: item.devunit,
												eqmid: item.eqmid,
												etype: item.etype,
												fl1: item.fl1,
												fl2: item.fl2,
												fl3: item.fl3,
												fl4: item.fl4,
												install: item.install,
												manucontact: item.manucontact,
												manuinfo: item.manuinfo,
												notes: item.notes,
												re1: item.re1,
												re2: item.re2,
												re3: item.re3,
												re4: item.re4,
												pid: dataForm.checkedPrj
											}
										}),
										projectFormFilePojos: projectDrawingsFileList.value.concat(ipAddressList.value).map((item: any) => {
											return {
												file: item.file,
												filename: item.filename,
												sort: item.sort,
												pid: dataForm.checkedPrj
											}
										}),
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
								} else {
									message
									.confirm({
									    msg: '系统检测到待调试业务中存在不存在的调试设备，继续提交将删除待调试业务，确定要提交吗？',
									    title: '提示',
									    confirmButtonProps: {
									        type: 'error',
									    },
									})
									.then(async () => {
										model.projectFormDebugPojos = model.projectFormDebugPojos.filter(item2 => model.projectFormEquipmentPojoList.some(item1 => item1.eqmid === item2.eqmid));
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
											projectFormContactPojoList: model.projectFormContactPojoList.map((item: any) => {
												return {
													docker: item.docker,
													pcontact: item.pcontact,
													pname: item.pname,
													proposition: item.proposition,
													pid: dataForm.checkedPrj
												}
											}),
											projectFormDebugPojos: model.projectFormDebugPojos.map((item: any) => {
												return {
													...item,
													dbcreater: item.dbcreater,
													debugname: item.debugname,
													dockcharge: item.dockcharge,
													dockcontact: item.dockcontact,
													docker: item.docker,
													dtype: item.dtype,
													eqmid: item.eqmid,
													pid: dataForm.checkedPrj,
													fl1: item.fl1,
													fl2: item.fl2,
													fl3: item.fl3,
													fl4: item.fl4,
													notes: item.notes,
													re1: item.re1,
													re2: item.re2,
													re3: item.re3,
													re4: item.re4
												}
											}),
											projectFormEquipmentPojoList: model.projectFormEquipmentPojoList.map((item: any) => {
												return {
													cid: item.cid,
													connectionmode: item.connectionmode,
													devmanu: item.devmanu,
													devmodel: item.devmodel,
													devname: item.devname,
													devnum: item.devnum,
													devstatus: item.devstatus,
													devunit: item.devunit,
													eqmid: item.eqmid,
													etype: item.etype,
													fl1: item.fl1,
													fl2: item.fl2,
													fl3: item.fl3,
													fl4: item.fl4,
													install: item.install,
													manucontact: item.manucontact,
													manuinfo: item.manuinfo,
													notes: item.notes,
													re1: item.re1,
													re2: item.re2,
													re3: item.re3,
													re4: item.re4,
													pid: dataForm.checkedPrj
												}
											}),
											projectFormFilePojos: projectDrawingsFileList.value.concat(ipAddressList.value).map((item: any) => {
												return {
													file: item.file,
													filename: item.filename,
													sort: item.sort,
													pid: dataForm.checkedPrj
												}
											}),
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
									})
									.catch(() => {
									    console.log('点击了取消按钮');
									});
								}
							} else {
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
									projectFormContactPojoList: model.projectFormContactPojoList.map((item: any) => {
										return {
											docker: item.docker,
											pcontact: item.pcontact,
											pname: item.pname,
											proposition: item.proposition,
											pid: dataForm.checkedPrj
										}
									}),
									projectFormDebugPojos: model.projectFormDebugPojos.map((item: any) => {
										return {
											...item,
											dbcreater: item.dbcreater,
											debugname: item.debugname,
											dockcharge: item.dockcharge,
											dockcontact: item.dockcontact,
											docker: item.docker,
											dtype: item.dtype,
											eqmid: item.eqmid,
											pid: dataForm.checkedPrj,
											fl1: item.fl1,
											fl2: item.fl2,
											fl3: item.fl3,
											fl4: item.fl4,
											notes: item.notes,
											re1: item.re1,
											re2: item.re2,
											re3: item.re3,
											re4: item.re4
										}
									}),
									projectFormEquipmentPojoList: model.projectFormEquipmentPojoList.map((item: any) => {
										return {
											cid: item.cid,
											connectionmode: item.connectionmode,
											devmanu: item.devmanu,
											devmodel: item.devmodel,
											devname: item.devname,
											devnum: item.devnum,
											devstatus: item.devstatus,
											devunit: item.devunit,
											eqmid: item.eqmid,
											etype: item.etype,
											fl1: item.fl1,
											fl2: item.fl2,
											fl3: item.fl3,
											fl4: item.fl4,
											install: item.install,
											manucontact: item.manucontact,
											manuinfo: item.manuinfo,
											notes: item.notes,
											re1: item.re1,
											re2: item.re2,
											re3: item.re3,
											re4: item.re4,
											pid: dataForm.checkedPrj
										}
									}),
									projectFormFilePojos: projectDrawingsFileList.value.concat(ipAddressList.value).map((item: any) => {
										return {
											file: item.file,
											filename: item.filename,
											sort: item.sort,
											pid: dataForm.checkedPrj
										}
									}),
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
						}
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

onLoad(async (options: any) => {
    model.id = options.id;
    if (model.id) {
        await getPrjInfo();
    } else {
		await getPrjDataList();
		await getAllWeightDataList();
		await getAllUserDataList();
        await getProvinceInfo();
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


				<wd-collapse v-model="collapseValue" v-if="!model.id">
					<wd-collapse-item name="item1">
						<template #title="{ expanded, disabled, isFirst }">
							<view style="display: flex; justify-content: space-between; align-items: center;">
								<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
								    <view style="display: flex; align-items: center;">
								        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
								        <view style="margin-left: 10rpx; font-weight: bolder;">联系人</view>
								    </view>
								    <view>
								        <wd-button icon="link" size="small"  @click.stop="handleAddContractChange">新增联系人</wd-button>
								    </view>
								</view>
								<wd-icon :name="expanded ? 'arrow-down' : 'arrow-up'" size="18px" color="#d8d8d8"></wd-icon>
							</view>
						</template>
						
						<view v-for="(projectFormContactItem, projectFormContactIndex) in model.projectFormContactPojoList" :key="projectFormContactIndex">
							<wd-input label="对接方" label-width="80px" prop="projectFormContactItem.docker" required clearable v-model="projectFormContactItem.docker" placeholder="请输入对接方" />
							<wd-input label="姓名" label-width="80px" prop="projectFormContactItem.pname" required clearable v-model="projectFormContactItem.pname" placeholder="请输入姓名" />
							<wd-input label="联系方式" label-width="80px" prop="projectFormContactItem.pcontact" required clearable v-model="projectFormContactItem.pcontact" placeholder="请输入联系方式" />
							<wd-textarea label="备注" label-width="80px" type="projectFormContactItem.textarea" v-model="projectFormContactItem.proposition" placeholder="请输入备注" clearable prop="proposition" />
							<wd-gap height="10rpx"></wd-gap>
							<view style="display: flex; justify-content: flex-end; align-items: center; margin: 10rpx 0 20rpx; padding: 0 10rpx 0 0; gap: 0 10rpx;">
								<wd-button type="error" size="small" @click="model.projectFormContactPojoList.splice(projectFormContactIndex, 1);">删除</wd-button>
								<wd-button icon="link" size="small"  @click.stop="handleAddContractChange">新增联系人</wd-button>
							</view>
						</view>
					</wd-collapse-item>
					<wd-collapse-item name="item2">
						<template #title="{ expanded, disabled, isFirst }">
							<view style="display: flex; justify-content: space-between; align-items: center;">
								<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
								    <view style="display: flex; align-items: center;">
								        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
								        <view style="margin-left: 10rpx; font-weight: bolder;">调试设备</view>
								    </view>
								    <view>
								        <wd-button icon="link" size="small"  @click.stop="handleAddProjectFormEquipmentChange">新增调试设备</wd-button>
								    </view>
								</view>
								<wd-icon :name="expanded ? 'arrow-down' : 'arrow-up'" size="18px" color="#d8d8d8"></wd-icon>
							</view>
						</template>
						<view v-for="(projectFormEquipmentItem, projectFormEquipmentIndex) in model.projectFormEquipmentPojoList" :key="projectFormEquipmentIndex">
							<wd-input label="设备名称" label-width="100px" prop="projectFormEquipmentItem.devname"  required clearable v-model="projectFormEquipmentItem.devname" placeholder="请选择设备" center>
							    <template #suffix>
							        <wd-button icon="link" size="small" @click.stop="handleLinkDeviceShowChange(projectFormEquipmentIndex)">设备信息</wd-button>
							    </template>
							</wd-input>
							<wd-input label="合同设备名称" label-width="100px" prop="projectFormEquipmentItem.devname2" required disabled v-model="projectFormEquipmentItem.devname2" placeholder="请输入合同设备名称" />
							<wd-input label="型号" label-width="100px" prop="projectFormEquipmentItem.devmodel" clearable disabled v-model="projectFormEquipmentItem.devmodel" placeholder="请输入型号" />
							<wd-input label="数量" label-width="100px" type="number" prop="projectFormEquipmentItem.devnum" required clearable v-model="projectFormEquipmentItem.devnum" placeholder="请输入数量" />
							<wd-input label="单位" label-width="100px" prop="projectFormEquipmentItem.devunit" clearable v-model="projectFormEquipmentItem.devunit" placeholder="请输入单位" />
							<wd-cell title="是否为我司设备" center>
							    <wd-radio-group inline v-model="projectFormEquipmentItem.etype" shape="dot" cell disabled>
							        <wd-radio :value="0">是</wd-radio>
							        <wd-radio :value="1">否</wd-radio>
							    </wd-radio-group>
							</wd-cell>
							<wd-input label="设备厂家" label-width="100px" prop="projectFormEquipmentItem.devmanu" clearable disabled v-model="projectFormEquipmentItem.devmanu" placeholder="请输入设备厂家" />
							<wd-cell title="是否安装就位" center>
							    <wd-radio-group inline v-model="projectFormEquipmentItem.install" shape="dot" cell>
							        <wd-radio :value="0">是</wd-radio>
							        <wd-radio :value="1">否</wd-radio>
							    </wd-radio-group>
							</wd-cell>
							<wd-input label="接线方式" label-width="100px" prop="projectFormEquipmentItem.connectionmode" clearable v-model="projectFormEquipmentItem.connectionmode" placeholder="请输入接线方式" />
							<wd-input label="厂家联系人" label-width="100px" prop="projectFormEquipmentItem.manucontact" clearable v-model="projectFormEquipmentItem.manucontact" placeholder="请输入厂家联系人" />
							<wd-input label="厂家联系方式" label-width="100px" prop="projectFormEquipmentItem.manuinfo" clearable v-model="projectFormEquipmentItem.manuinfo" placeholder="请输入厂家联系方式" />
							<wd-textarea label="备注" label-width="100px" type="textarea" prop="projectFormEquipmentItem.notes" clearable v-model="projectFormEquipmentItem.notes" placeholder="请输入备注" />
							<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
							    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
							    <view style="margin-left: 10rpx; font-weight: bolder;">文件上传</view>
							</view>
							
							<wd-input type="text" label="附件1" label-width="40px" v-model="projectFormEquipmentItem.re1" placeholder="请选择文件" center>
							    <template #suffix>
							        <CjxUpload v-model="projectFormEquipmentItem.fileList" :limit="1" @change="handleUploadFile1ClickChange($event, projectFormEquipmentIndex)">
							            <template #default>
							                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							            </template>
							        </CjxUpload>
							    </template>
							</wd-input>
							
							<wd-input type="text" label="附件2" label-width="40px" v-model="projectFormEquipmentItem.re2" placeholder="请选择文件" center>
							    <template #suffix>
							        <CjxUpload v-model="projectFormEquipmentItem.file2List" :limit="1" @change="handleUploadFile2ClickChange($event, projectFormEquipmentIndex)">
							            <template #default>
							                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							            </template>
							        </CjxUpload>
							    </template>
							</wd-input>
							
							<wd-input type="text" label="附件3" label-width="40px" v-model="projectFormEquipmentItem.re3" placeholder="请选择文件" center>
							    <template #suffix>
							        <CjxUpload v-model="projectFormEquipmentItem.file3List" :limit="1" @change="handleUploadFile3ClickChange($event, projectFormEquipmentIndex)">
							            <template #default>
							                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							            </template>
							        </CjxUpload>
							    </template>
							</wd-input>
							
							<wd-input type="text" label="附件4" label-width="40px" v-model="projectFormEquipmentItem.re4" placeholder="请选择文件" center>
							    <template #suffix>
							        <CjxUpload v-model="projectFormEquipmentItem.file4List" :limit="1" @change="handleUploadFile4ClickChange($event, projectFormEquipmentIndex)">
							            <template #default>
							                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							            </template>
							        </CjxUpload>
							    </template>
							</wd-input>
							<wd-gap height="10rpx"></wd-gap>
							<view style="display: flex; justify-content: flex-end; align-items: center; margin: 10rpx 0 20rpx; padding: 0 10rpx 0 0; gap: 0 10rpx;">
								<wd-button type="error" size="small" @click="handleDeleteProjectFormEquipmentChange(projectFormEquipmentIndex)">删除</wd-button>
								<wd-button icon="link" size="small"  @click.stop="handleAddProjectFormEquipmentChange">新增调试设备</wd-button>
							</view>
						</view>
					</wd-collapse-item>
					<wd-collapse-item name="item3">
						<template #title="{ expanded, disabled, isFirst }">
							<view style="display: flex; justify-content: space-between; align-items: center;">
								<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
								    <view style="display: flex; align-items: center;">
								        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
								        <view style="margin-left: 10rpx; font-weight: bolder;">调试业务</view>
								    </view>
								    <view>
								        <wd-button icon="link" size="small" @click.stop="handleAddProjectFormDebugbuinessChange">新增调试业务</wd-button>
								    </view>
								</view>
								<wd-icon :name="expanded ? 'arrow-down' : 'arrow-up'" size="18px" color="#d8d8d8"></wd-icon>
							</view>
						</template>
						
						<view v-for="(projectFormDebugbusinessItem, projectFormDebugbusinessIndex) in model.projectFormDebugPojos" :key="projectFormDebugbusinessIndex">
							<wd-input label="权重" label-width="100px" prop="projectFormDebugbusinessItem.dtypename" required disabled v-model="projectFormDebugbusinessItem.dtypename" placeholder="请选择权重">
							    <template #suffix>
							        <wd-button icon="link" size="small" @click.stop="handleLinkWeightShowChange(projectFormDebugbusinessIndex)">权重</wd-button>
							    </template>
							</wd-input>
							<wd-input label="业务名称" label-width="100px" prop="projectFormDebugbusinessItem.debugname" required clearable v-model="projectFormDebugbusinessItem.debugname" placeholder="请输入业务名称" />
							<wd-input label="对接方" label-width="100px" prop="projectFormDebugbusinessItem.docker" required clearable v-model="projectFormDebugbusinessItem.docker" placeholder="请输入对接方" @clear="dataForm.checkedContact = null;">
							    <template #suffix>
							        <wd-button icon="link" size="small" @click.stop="handleLinkContactShowChange(projectFormDebugbusinessIndex)">对接方</wd-button>
							    </template>
							</wd-input>
							<wd-input label="对接方负责人" label-width="100px" prop="projectFormDebugbusinessItem.dockcharge" required clearable v-model="projectFormDebugbusinessItem.dockcharge" placeholder="请输入对接方负责人" />
							<wd-input label="联系方式" label-width="100px" prop="projectFormDebugbusinessItem.dockcontact" required clearable v-model="projectFormDebugbusinessItem.dockcontact" placeholder="请输入联系方式" />
							<wd-input label="调试设备" label-width="100px" prop="projectFormDebugbusinessItem.equipmentName" required disabled v-model="projectFormDebugbusinessItem.equipmentName" placeholder="请选择调试设备">
							    <template #suffix>
							        <wd-button icon="link" size="small" @click.stop="handleLinkDebugEquipmentShowChange(projectFormDebugbusinessIndex)">调试设备</wd-button>
							    </template>
							</wd-input>
							<wd-input label="调试工程师" label-width="100px" prop="projectFormDebugbusinessItem.uname" required disabled v-model="projectFormDebugbusinessItem.uname" placeholder="请选择调试工程师">
							    <template #suffix>
							        <wd-button icon="link" size="small" @click.stop="handleLinkMemberShowChange(projectFormDebugbusinessIndex)">调试工程师</wd-button>
							    </template>
							</wd-input>
							<wd-datetime-picker label="起止时间" label-width="100px" type="date" v-model="projectFormDebugbusinessItem.rangeTime" :default-value="[Date.now(), Date.now() + 90 * 24 * 60 * 60 * 1000]" />
							<wd-textarea label="备注" label-width="100px" type="textarea" prop="projectFormDebugbusinessItem.notes" clearable v-model="projectFormDebugbusinessItem.notes" placeholder="请输入备注" />
							<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
							    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
							    <view style="margin-left: 10rpx; font-weight: bolder;">文件上传</view>
							</view>
							<wd-input type="text" label="附件1" label-width="40px" v-model="projectFormDebugbusinessItem.re1" placeholder="请选择文件" center>
							    <template #suffix>
							        <CjxUpload v-model="projectFormDebugbusinessItem.fileList" :limit="1" @change="handleUploadFileBusiness1ClickChange($event, projectFormDebugbusinessIndex)">
							            <template #default>
							                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							            </template>
							        </CjxUpload>
							    </template>
							</wd-input>
							
							<wd-input type="text" label="附件2" label-width="40px" v-model="projectFormDebugbusinessItem.re2" placeholder="请选择文件" center>
							    <template #suffix>
							        <CjxUpload v-model="projectFormDebugbusinessItem.file2List" :limit="1" @change="handleUploadFileBusiness2ClickChange($event, projectFormDebugbusinessIndex)">
							            <template #default>
							                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							            </template>
							        </CjxUpload>
							    </template>
							</wd-input>
							
							<wd-input type="text" label="附件3" label-width="40px" v-model="projectFormDebugbusinessItem.re3" placeholder="请选择文件" center>
							    <template #suffix>
							        <CjxUpload v-model="projectFormDebugbusinessItem.file3List" :limit="1" @change="handleUploadFileBusiness3ClickChange($event, projectFormDebugbusinessIndex)">
							            <template #default>
							                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							            </template>
							        </CjxUpload>
							    </template>
							</wd-input>
							
							<wd-input type="text" label="附件4" label-width="40px" v-model="projectFormDebugbusinessItem.re4" placeholder="请选择文件" center>
							    <template #suffix>
							        <CjxUpload v-model="projectFormDebugbusinessItem.file4List" :limit="1" @change="handleUploadFileBusiness4ClickChange($event, projectFormDebugbusinessIndex)">
							            <template #default>
							                <wd-button icon="cloud-upload" size="small">上传文件</wd-button>
							            </template>
							        </CjxUpload>
							    </template>
							</wd-input>
							<wd-gap height="10rpx"></wd-gap>
							<view style="display: flex; justify-content: flex-end; align-items: center; margin: 10rpx 0 20rpx; padding: 0 10rpx 0 0; gap: 0 10rpx;">
								<wd-button type="error" size="small" @click="model.projectFormDebugPojos.splice(projectFormDebugbusinessIndex, 1);">删除</wd-button>
								<wd-button icon="link" size="small" @click.stop="handleAddProjectFormDebugbuinessChange">新增调试业务</wd-button>
							</view>
						</view>
					</wd-collapse-item>
				</wd-collapse>
				
				<view v-if="!model.id" style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10rpx 0 10rpx 10px; width: calc(100vw - 60rpx);">
				    <view style="display: flex; align-items: center;">
				        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
				        <view style="margin-left: 10rpx; font-weight: bolder;">项目图纸</view>
				    </view>
				    <view v-if="hasPermission('project:form:File:insert')">
				        <CjxUpload v-model="prjDetailInfo.file1List" multiple @change="handleUploadClickChange">
				            <template #default>
				                <wd-icon name="cloud-upload" size="22px"></wd-icon>
				            </template>
				        </CjxUpload>
				    </view>
				</view>
				
				<view v-if="projectDrawingsFileList.length > 0 && !model.id" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
				    <view v-for="(projectDrawingsFileItem, projectDrawingsFileIndex) in projectDrawingsFileList" :key="projectDrawingsFileIndex">
				        <view style="padding: 20rpx;">
				            <view class="prjInfoHeader">
				                <view class="left">
				                    <wd-img :width="30" :height="30" :src="projectDrawingsFileItem.url" v-if="isImageUrl(projectDrawingsFileItem.url)" :preview-src="projectDrawingsFileItem.url" :enable-preview="true" />
				                    <wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
				                </view>
				
				                <view class="right" v-if="isSupportedFileType(projectDrawingsFileItem.url)">
				                    <CjxPreviewOffice
				                        ref="previewOfficeRef"
				                        :value="projectDrawingsFileItem.url"
				                        :name="projectDrawingsFileItem.filename"
				                        :type="getFileType(projectDrawingsFileItem.url)"
				                    >
				                        <span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ projectDrawingsFileItem.filename }}</span>
				                    </CjxPreviewOffice>
				                    <view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
				                        <wd-text bold :text="projectDrawingsFileItem.username" />
				                        <wd-text bold :text="projectDrawingsFileItem.dbtime" />
				                    </view>
				                </view>
				
				                <view class="right" v-else @click="handlePreviewFileChange(projectDrawingsFileItem.url)">
				                    <wd-text bold :text="projectDrawingsFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
				                    <view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
				                        <wd-text bold :text="projectDrawingsFileItem.username" />
				                        <wd-text bold :text="projectDrawingsFileItem.dbtime" />
				                    </view>
				                </view>
				
				                <view style="display: flex; flex-direction: column; gap: 10rpx; width: 22px; margin-left: 18px;">
				                    <wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(projectDrawingsFileItem.url, null)"></wd-icon>
				                    <wd-icon v-if="hasPermission('project:File:delete')" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(projectDrawingsFileItem.url, projectDrawingsFileIndex, 1)"></wd-icon>
				                </view>
				            </view>
				        </view>
				    </view>
				</view>
				
				<view v-if="projectDrawingsFileList.length === 0 && !model.id" :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
					<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目图纸" />
				</view>
				
				<view v-if="!model.id" style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
					<view style="display: flex; align-items: center;">
						<view style="width: 5px; height: 15px; background: #0055FE;"></view>
						<view style="margin-left: 10rpx; font-weight: bolder;">项目文件</view>
					</view>
					<view v-if="hasPermission('project:form:File:insert')">
						<CjxUpload v-model="prjDetailInfo.file2List" :limit="1" multiple @change="handleUploadIpaddressClickChange">
							<template #default>
								<wd-icon name="cloud-upload" size="22px"></wd-icon>
							</template>
						</CjxUpload>
					</view>
				</view>
				
				<view v-if="ipAddressList.length > 0 && !model.id" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
					<view v-for="(ipAddressItem, ipAddressIndex) in ipAddressList" :key="ipAddressIndex">
						<view style="padding: 20rpx;">
							<view class="prjInfoHeader">
								<view class="left">
									<wd-img :width="30" :height="30" :src="ipAddressItem.url" v-if="isImageUrl(ipAddressItem.url)" :preview-src="ipAddressItem.url" :enable-preview="true" />
									<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
								</view>
								<view class="right" v-if="isSupportedFileType(ipAddressItem.url)">
									<CjxPreviewOffice
										ref="previewOfficeRef"
										:value="ipAddressItem.url"
										:name="ipAddressItem.filename"
										:type="getFileType(ipAddressItem.url)"
									>
										<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ ipAddressItem.filename }}</span>
									</CjxPreviewOffice>
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="ipAddressItem.username" />
										<wd-text bold :text="ipAddressItem.dbtime" />
									</view>
								</view>
				
								<view class="right" v-else @click="handlePreviewFileChange(ipAddressItem.url)">
									<wd-text bold :text="ipAddressItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="ipAddressItem.username" />
										<wd-text bold :text="ipAddressItem.dbtime" />
									</view>
								</view>
				
								<view style="display: flex; flex-direction: column; gap: 10rpx; width: 22px; margin-left: 18px;">
									<wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(ipAddressItem.url, null)"></wd-icon>
									<wd-icon v-if="hasPermission('project:form:File:delete')" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(ipAddressItem.url, ipAddressIndex, 2)"></wd-icon>
								</view>
							</view>
						</view>
					</view>
				</view>
				
				<view v-if="ipAddressList.length === 0 && !model.id" :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
					<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目文件" />
				</view>
				
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

		<!-- 选择调度 -->
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

		<!-- 选择项目 -->
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

		<!-- 选择省份 -->
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

		<!-- 选择市区 -->
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
		
		<!-- 待调试设备的设备选择 -->
		<wd-popup closable v-model="deviceShow" position="bottom" @close="handleDeviceCloseChange">
		    <wd-gap height="60rpx" />
		
		    <opCascader v-model="selectAll" :option="contractDataList" :props="props" :iconShow="true" maxHeight="800rpx" @change="handleRadioSelectChange"></opCascader>
		</wd-popup>
		
		<!-- 待调试业务的权重选择 -->
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="weightShow" position="left" @close="handleCloseWeightChange">
		    <wd-gap height="50rpx" />
		
		    <wd-search v-model="dataForm.weightFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchWeightFuzzyChange" @cancel="handleSearchWeightFuzzyChange" @clear="handleClearWeightFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshWeightChange" @scrolltolower="handleScrolltolowerWeightChange" style="height: calc(100vh - 330rpx);">
		        <wd-radio-group v-model="dataForm.checkedWeight" shape="dot" @change="handleRadioSelectWeightChange">
		            <wd-cell v-for="(item, index) in weightDataList" :key="index" custom-class="radioCellWrap">
		                <view class="custom-txt">
		                    <wd-radio :value="item.id">{{ item.tname }}</wd-radio>
		                </view>
		            </wd-cell>
		        </wd-radio-group>
		    </scroll-view>
		</wd-popup>
		
		<!-- 待调试业务的联系人选择 -->
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="contactShow" position="left" @close="handleCloseContactChange">
		    <wd-gap height="50rpx" />
		
		    <wd-search v-model="dataForm.contactFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchContactFuzzyChange" @cancel="handleSearchContactFuzzyChange" @clear="handleClearContactFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled :refresher-triggered="contactTriggered" @refresherrefresh="handleScrollContactRefreshChange" @scrolltolower="handleScrollContacttolowerChange" style="height: calc(100vh - 330rpx);">
		        <wd-radio-group v-model="dataForm.checkedContact" shape="dot" @change="handleRadioSelectContactChange">
		            <wd-cell v-for="(item, index) in contactDataList" :key="index" custom-class="radioCellWrap">
		                <view class="custom-txt">
		                    <wd-radio :value="item.id">{{ item.docker }}</wd-radio>
		                </view>
		            </wd-cell>
		        </wd-radio-group>
		    </scroll-view>
		</wd-popup>
		
		<!-- 待调试业务的用户选择 -->
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="userShow" position="left" @close="handleCloseUserChange">
		    <wd-gap height="50rpx" />
		
		    <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchUserChange" @cancel="handleSearchUserChange" @clear="handleClearUserChange" />
		
		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="userTriggered" @refresherrefresh="handleScrollUserRefreshChange" @scrolltolower="handleScrolltolowerUserChange" style="height: calc(100vh - 260rpx);">
		        <wd-radio-group v-model="dataForm.checkedUser" shape="dot" @change="handleRadioUserSelectChange">
		            <wd-cell v-for="(item, index) in userDataList" :key="index" custom-class="radioCellWrap">
		                <view class="custom-txt">
		                    <wd-radio :value="item.id">{{ item.username }}</wd-radio>
		                </view>
		            </wd-cell>
		        </wd-radio-group>
		    </scroll-view>
		</wd-popup>
		
		<!-- 待调试业务的调试设备选择 -->
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="debugEquipmentShow" position="left" @close="handleDebugEquipmentCloseChange">
		    <wd-gap height="50rpx" />
		
		    <wd-search v-model="dataForm.debugEquipmentFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleDebugEquipmentSearchChange" @cancel="handleDebugEquipmentSearchChange" @clear="handleDebugEquipmentClearChange" />
		
		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="debuggerEquipmentTriggered" @refresherrefresh="handleScrollDebugEquipmentRefreshChange" style="height: calc(100vh - 280rpx);">
		        <wd-radio-group v-model="dataForm.checkedDebugEquipment" shape="dot" @change="handleRadioSelectDebugEquipmentChange">
		            <wd-cell v-for="(item, index) in debugEquipmentDataList" :key="index" custom-class="radioCellWrap">
		                <view class="custom-txt">
		                    <wd-radio :value="item.eqmid">{{ item.devname }}</wd-radio>
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

.radioCellWrap {
    :deep(.wd-cell__wrapper) {
        display: block !important;
    }
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

:deep(.wd-collapse-item__header) {
	padding: 0 !important;
	padding-right: 10rpx !important;
}

:deep(.wd-collapse-item__body) {
	padding: 0 !important;
}

.prjInfoHeader {
    display: flex;
    align-items: center;
    margin: 10rpx 0 !important;
    margin-bottom: 20rpx;

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