<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { BASE_URL, QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { ref, reactive, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { hasPermission, calcDistance } from '@/utils/index';
import { useI18n } from 'vue-i18n';
import { uploadFile } from '@/utils/uploadFile';
import { useTheme } from '@/composables/theme/theme';
import { onReady, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTabbar } from '@/composables/useTabbar';
import { blurDetector } from '@/utils/blurDetector.js';
import { fetchGetUserInfo, fetchGetPrjDataList, fetchGetSystemconfigInfo, fetchGetPrjClockinLastInfo, fetchCheckPrjClockinInfo, fetchSavePrjClockinInfo, fetchGetPrjaddressDataList, fetchGetRealtimeTrajectoryInfo, fetchGetAllUserDataList, fetchGetUploadFileTokenInfo } from '@/service/index';

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const { proxy } = getCurrentInstance();

const isCoolingDown = ref<boolean>(false);

const isCoolingDepartDown = ref<boolean>(false);

const isCoolingArriveDown = ref<boolean>(false);

function clearCooldown(type: 'clockin' | 'depart' | 'arrive') {
    if (type === 'clockin') isCoolingDown.value = false;
    if (type === 'depart') isCoolingDepartDown.value = false;
    if (type === 'arrive') isCoolingArriveDown.value = false;
}

const isDark = computed(() => theme.value === 'dark');

const isClockIn = ref<boolean>(false);

const prjShow = ref<boolean>(false);

const prjaddressShow = ref<boolean>(false);

const username = ref<string>(uni.getStorageSync('username'));

const userType = ref<number>(uni.getStorageSync('usertype'));

const avatarImage = ref<string>('');

// 保存当前时间
const currentTime = ref<string>('');

const triggered = ref<boolean>(false);

const prjaddressTriggered = ref<boolean>(false);

const requesting = ref<boolean>(false);

const currentPrjAddress = ref<string>('');

const activeTab = ref<number>(1);

const activeAttendanceTab = ref<number>(1);

const activeDepartArriveTab = ref<number>(0);

const isBlur = ref<boolean>(false);

const tabsList = ref<{ title: string, count: number, value: number }[]>([
    {
        title: '全部',
        count: 0,
        value: 0
    },
    {
        title: '外勤',
        count: 0,
        value: 1
    },
    {
        title: '公司',
        count: 0,
        value: 2
    },
    {
        title: '未知',
        count: 0,
        value: 3
    }
]);

const model = reactive<{
    page: number;
    total: number;
    fuzzy: string;
    prjDataList: any;
    checkedPrj: any;
    prjName: string;
    prjaddressPage: number;
    prjaddressTotal: number;
    prjaddressFuzzy: string;
    prjaddressDataList: any;
    checkedPrjaddressDataList: any;
    checkedPrjaddress: any;
    lastClockInInfo: any;
    systemCongfigInfo: any;
    allDataList: any;
    fieldworkDataList: any;
    companyDataList: any;
    unknownDataList: any;
}>({
    page: 1,
    total: 0,
    fuzzy: '',
    prjDataList: [],
    checkedPrj: '',
    prjName: '',
    prjaddressPage: 1,
    prjaddressTotal: 0,
    prjaddressFuzzy: '',
    prjaddressDataList: [],
    checkedPrjaddressDataList: [],
    checkedPrjaddress: -1,
    lastClockInInfo: {
        address: '',
        ctype: 0,
        duration: 0,
        dbtime: '',
        status: 0,
        distanse: 0,
		re1: ''
    },
    systemCongfigInfo: {
        id: 1,
        cputhreshold: 80,
        memthreshold: 95,
        captcha: 0,
        merror: 2000,
        errortime: 10000,
        sdkkey: "e037cc5248967fde6dedabc727d6a591",
        sdkh5: "82a2e36c3671ee597622397929ba0812",
        sdksecret: "5fd44c71fea26a391da96e87f0bbd29b",
        prosite: "杭州领祺科技有限公司（浙江省杭州市钱塘区）",
        longitude: 120.373885,
        latitude: 30.303899,
        ertoken: null,
        diserror: 100
    },
    allDataList: [] as any,
    fieldworkDataList: [] as any,
    companyDataList: [] as any,
    unknownDataList: [] as any
})

// 路程的「出发 / 到达」冷却按项目隔离：项目 A 的操作不阻塞项目 B。
const routeCooldownUntil = reactive<Record<string, number>>({});
const routeCooldownClock = ref(Date.now());
let routeCooldownTimer: ReturnType<typeof setInterval> | undefined;

const routeCooldownSeconds = computed(() => {
    routeCooldownClock.value;
    const projectId = model.checkedPrj;
    if (projectId === null || projectId === undefined || projectId === '') return 0;
    return Math.max(0, Math.ceil(((routeCooldownUntil[String(projectId)] || 0) - Date.now()) / 1000));
});
const isRouteCooling = computed(() => routeCooldownSeconds.value > 0);
const isRouteRequesting = computed(() => isCoolingDepartDown.value || isCoolingArriveDown.value);
// 同一项目的出发、到达共用 60 秒冷却；其他项目互不影响。
const isDepartLocked = computed(() => isRouteRequesting.value || isRouteCooling.value);
const isArriveLocked = computed(() => isRouteRequesting.value || isRouteCooling.value);

function startProjectRouteCooldown(projectId: any) {
    if (projectId === null || projectId === undefined || projectId === '') return;

    routeCooldownUntil[String(projectId)] = Date.now() + 60000;
    routeCooldownClock.value = Date.now();
    if (routeCooldownTimer) return;

    routeCooldownTimer = setInterval(() => {
        const now = Date.now();
        routeCooldownClock.value = now;
        Object.keys(routeCooldownUntil).forEach((key) => {
            if (routeCooldownUntil[key] <= now) delete routeCooldownUntil[key];
        });
        if (Object.keys(routeCooldownUntil).length === 0 && routeCooldownTimer) {
            clearInterval(routeCooldownTimer);
            routeCooldownTimer = undefined;
        }
    }, 250);
}

// 考勤打卡冷却同样按项目隔离，避免项目 A 的打卡锁住项目 B。
const clockinCooldownUntil = reactive<Record<string, number>>({});
const clockinCooldownClock = ref(Date.now());
let clockinCooldownTimer: ReturnType<typeof setInterval> | undefined;

const clockinCooldownSeconds = computed(() => {
    clockinCooldownClock.value;
    const projectId = model.checkedPrj;
    if (projectId === null || projectId === undefined || projectId === '') return 0;
    return Math.max(0, Math.ceil(((clockinCooldownUntil[String(projectId)] || 0) - Date.now()) / 1000));
});
const isClockinCooling = computed(() => clockinCooldownSeconds.value > 0);
const isClockinLocked = computed(() => isCoolingDown.value || isClockinCooling.value);

function startProjectClockinCooldown(projectId: any) {
    if (projectId === null || projectId === undefined || projectId === '') return;

    clockinCooldownUntil[String(projectId)] = Date.now() + 60000;
    clockinCooldownClock.value = Date.now();
    if (clockinCooldownTimer) return;

    clockinCooldownTimer = setInterval(() => {
        const now = Date.now();
        clockinCooldownClock.value = now;
        Object.keys(clockinCooldownUntil).forEach((key) => {
            if (clockinCooldownUntil[key] <= now) delete clockinCooldownUntil[key];
        });
        if (Object.keys(clockinCooldownUntil).length === 0 && clockinCooldownTimer) {
            clearInterval(clockinCooldownTimer);
            clockinCooldownTimer = undefined;
        }
    }, 250);
}

// 打卡按钮状态机：由最近一次打卡记录决定显示哪个按钮，不能点的位置显示上次打卡信息
// status: 2=出发未到达 3=已到达；0/1=上下班打卡（ctype: 0=上班 1=下班 2=系统上报）
const isDeparted = computed(() => !!model.lastClockInInfo.dbtime && Number(model.lastClockInInfo.status) === 2);
// 出发按钮：已出发未到达时只能到达；已打上班卡在岗时先下班才能出发
const canDepart = computed(() => !isDeparted.value && !isClockIn.value);
// 到达按钮：仅已出发未到达时可点
const canArrive = computed(() => isDeparted.value);
// 上下班打卡按钮：已出发未到达时不可点，其余状态均可点（上班/下班由 isClockIn 决定）
const canClockIn = computed(() => !isDeparted.value);

// 最近一次打卡类型文案
const lastClockTypeText = computed(() => {
    if (Number(model.lastClockInInfo.status) === 2) return '出发签到';
    if (Number(model.lastClockInInfo.status) === 3) return '到达签到';
    if (model.lastClockInInfo.ctype === 2) return '系统上报';
    return model.lastClockInInfo.ctype === 0 ? '上班打卡' : '下班打卡';
});
// 各按钮隐藏位置的提示文案
const departBlockTip = computed(() => isDeparted.value ? '您已出发签到，请先完成到达签到' : '您已打卡上班，请先下班打卡后再出发');
const arriveBlockTip = computed(() => {
    if (isClockIn.value) return '您已打卡上班，请先下班打卡后再操作';
    if (Number(model.lastClockInInfo.status) === 3) return '您已完成到达签到，请点击出发开始新的行程';
    return '暂无出发记录，请先完成出发签到';
});
const clockInBlockTip = computed(() => '您已出发还未到达，请先完成到达签到');

// 格式化函数：时:分:秒
function formatTime(date: Date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

const dataForm = reactive({
    longitude: 0,
    latitude: 0,
    prjLongitude: 0,
    prjLatitude: 0
})

let timer: ReturnType<typeof setInterval>;

function updateTime() {
    currentTime.value = formatTime(new Date());
}

// 获取用户基本信息
async function getUserDetailInfo() {
    try {
        const data = await fetchGetUserInfo();
        avatarImage.value = data.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg';
    } catch (err) {
        console.error('获取用户信息失败', err);
        avatarImage.value = 'https://pms.linkqi.cn:18443/soybean.jpg';
    }
}

function handleJumpChange() {
    uni.navigateTo({
        url: '/mePages/attendancestatistics/Index'
    })
}

async function getMapSdkInfo() {
    // const url = process.env.NODE_ENV === 'production' ? 'https://dingiiot.com/map-sdk.json' : '/dingiiotcom/map-sdk.json';

    // try {
    //     const response = await axios.get(`${url}?_t=${Date.now()}`);
    //     return response.data; // ✅ 正确返回 URL
    // } catch (error) {
    //     console.error('获取地图 SDK 配置失败:', error);
    //     throw error; // 让调用者处理错误
    // }
    try {
        const response = await fetchGetSystemconfigInfo();
        return response; // ✅ 正确返回 URL
    } catch (error) {
        console.error('获取地图 SDK 配置失败:', error);
        throw error; // 让调用者处理错误
    }
}

async function getAddress(lat: number, lng: number) {
    const sdkInfo: any = await getMapSdkInfo();
    Object.assign(model.systemCongfigInfo, sdkInfo);
    return new Promise((resolve, reject) => {
        uni.request({
            url: `https://restapi.amap.com/v3/geocode/regeo?key=${sdkInfo.sdkh5}&location=${lng},${lat}`,
            success: (res: any) => {
                resolve(res.data.regeocode?.formatted_address || '');
            },
            fail: reject
        });
    });
}

// 打开弹出层
function handleLinkPrjShowChange() {
    prjShow.value = true;
}

// 清除
function handleClearFuzzyChange() {
    model.page = 1;
    getPrjDataList();
}

// 搜索
function handleSearchFuzzyChange() {
    model.page = 1;
    getPrjDataList();
}

// 获取项目分页数据
async function getPrjDataList() {
    if (!hasPermission('project:Info:select')) {
        return
    }
    if (model.page === 1) {
        model.prjDataList = [];
    }
    try {
        const data = await fetchGetPrjDataList({ page: model.page, limit: 100, fuzzy: model.fuzzy }, false);
        model.total = Number(data.total);
        model.prjDataList = model.prjDataList.concat(data.list);
    } catch (error) {
        console.error('获取项目数据失败', error);
    }
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    model.page = 1;
    getPrjDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.prjDataList.length < model.total) {
        model.page++;
        getPrjDataList();
    }
}

// 关闭弹出层
function handleCloseChange() {
    prjShow.value = false;
}

// 清除选择项
function handleClearPrjChange() {
    model.prjName = '';
    model.checkedPrj = null;
    model.prjaddressDataList = [];
	currentPrjAddress.value = "";
    dataForm.prjLongitude = 0;
    dataForm.prjLatitude = 0;
	resetLastClockinInfo();
}

// 选择项目
function handleRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const names = model.prjDataList.find((item: any) => model.checkedPrj === item.id);
    model.prjName = names ? names.proname : '';
    dataForm.prjLongitude = names ? names.longitude : 0;
    dataForm.prjLatitude = names ? names.latitude : 0;
    currentPrjAddress.value = names.prosite || '';
    prjShow.value = false;
    // 先清空上一个项目的状态，避免在 B 项目上误用 A 项目的“已出发”状态。
    resetLastClockinInfo();
    handleGetClockinLastInfoChange(model.checkedPrj);
    model.prjaddressPage = 1;
    model.checkedPrjaddress = -1;
    model.checkedPrjaddressDataList = [
        {
            id: -1,
            pid: model.checkedPrj,
            addr: '默认项目地址',
            longitude: names.longitude,
            latitude: names.latitude
        }
    ];
}

// 打开项目地点弹出层
function handleLinkPrjaddressShowChange() {
    model.prjaddressPage = 1;
    getPrjAddressDataList();
    prjaddressShow.value = true;
}

// 关闭项目地点弹出层
function handlePrjaddressCloseChange() {
    prjaddressShow.value = false;
}

// 清除项目地点选择项
function handleClearPrjaddressFuzzyChange() {
    model.prjaddressFuzzy = '';
    model.prjaddressPage = 1;
    getPrjAddressDataList();
}

// 搜索项目地点
function handleSearchPrjaddressFuzzyChange() {
    model.prjaddressPage = 1;
    getPrjAddressDataList();
}

// 选择项目地点
async function getPrjAddressDataList() {
    // if (!hasPermission('project:Info:select')) {
    //     return
    // }
    if (model.prjaddressPage === 1) {
        model.prjaddressDataList = [].concat(model.checkedPrjaddressDataList);
    }
    try {
        let queryParams: any = {
            page: model.prjaddressPage,
            limit: 100,
            pid: model.checkedPrj
        }
        if (model.prjaddressFuzzy) {
            queryParams['fuzzy'] = model.prjaddressFuzzy;
        }
        const data = await fetchGetPrjaddressDataList(queryParams);
        model.prjaddressTotal = Number(data.total);
        model.prjaddressDataList = model.prjaddressDataList.concat(data.list);
    } catch (error) {
        console.error('获取项目数据失败', error);
    }
}

// 刷新
function handleScrollPrjaddressRefreshChange() {
    prjaddressTriggered.value = true;
    model.prjaddressPage = 1;
    getPrjAddressDataList();
    setTimeout(() => {
        prjaddressTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrollPrjaddresstolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.prjaddressDataList.length < model.prjaddressTotal) {
        model.prjaddressPage++;
        getPrjAddressDataList();
    }
}

// 选择项目地点
function handleRadioPrjaddressSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const names = model.prjaddressDataList.find((item: any) => model.checkedPrjaddress === item.id);
    dataForm.prjLongitude = names ? names.longitude : 0;
    dataForm.prjLatitude = names ? names.latitude : 0;
	currentPrjAddress.value = names.addr;
    prjaddressShow.value = false;
}

// 签到 出发 到达
const handleDepartOrArriveClockinChange = (val: string) => {
    if (!model.checkedPrj) {
        uni.showToast({
            icon: 'none',
            title: '请您先选择项目再签到',
            duration: 1500
        });
        return
    }
    if (!hasPermission('project:Clockin:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无签到权限，请联系管理员',
            duration: 1500
        });
        if (val === 'depart') {
            isCoolingDepartDown.value = false;
        } else {
            isCoolingArriveDown.value = false;
        }
        return;
    }
	// 上次无任何打卡信息（首次打卡/清空态）：只能点「出发」或考勤中的「上班打卡」，不能直接「到达」
	if (!model.lastClockInInfo.dbtime && val !== 'depart') {
		uni.showToast({
		    icon: 'none',
		    title: '您还没有出发记录，请先点击出发。',
		    duration: 1500
		});
		return;
	}

	// status=2 出发未到达 / status=3 已到达：出发到达签到专有状态，与上下班 ctype 无关，均需拦截重复操作
	if (model.lastClockInInfo.status === 2 && val === 'depart') {
		uni.showToast({
		    icon: 'none',
		    title: '您已点击出发，请先点击到达再操作。',
		    duration: 1500
		});
		return;
	}

	if (model.lastClockInInfo.status === 3 && val !== 'depart') {
		uni.showToast({
		    icon: 'none',
		    title: '您已点击到达，请先点击出发再操作。',
		    duration: 1500
		});
		return;
	}

	if (isClockIn.value && (model.lastClockInInfo.status === 0 || model.lastClockInInfo.status === 1) && model.lastClockInInfo.ctype === 0) {
		uni.showToast({
		    icon: 'none',
		    title: '您还未点击打卡，请先点击打卡再进行其余操作。',
		    duration: 1500
		});
		return;
	}

    // 当前项目完成出发或到达后，两个操作均需等待 60 秒。
    if (isRouteRequesting.value || isRouteCooling.value) {
        uni.showToast({
            icon: 'none',
            title: routeCooldownSeconds.value ? `请等待 ${routeCooldownSeconds.value} 秒后再操作` : '请稍候后再操作',
            duration: 1500
        });
        return;
    }

    // 执行实际的签到逻辑
    handleAttendanceDepartOrArriveClockinExecuteChange(val);
};

// 实际签到
const handleAttendanceDepartOrArriveClockinExecuteChange = async (val: string) => {
    if (val === 'depart') {
        isCoolingDepartDown.value = true;
    } else {
        isCoolingArriveDown.value = true;
    }
    uni.showLoading({ title: '定位中…', mask: true });
    uni.getLocation({
        type: 'gcj02',
        geocode: true,
        isHighAccuracy: true,
        highAccuracyExpireTime: 10000,
        success: async (res) => {
            try {
                dataForm.longitude = res.longitude;
                dataForm.latitude = res.latitude;
                const address: any = await getAddress(res.latitude, res.longitude);
                uni.showLoading({ title: val === 'depart' ? '出发签到中…' : '到达签到中…', mask: true });
                await fetchSavePrjClockinInfo({
                    list: [{
                        address,
                        pid: model.checkedPrj,
                        longitude: res.longitude,
                        latitude: res.latitude,
                        devtime: new Date().getTime(),
                    }],
                    check: false,
                    status: val === 'depart' ? 2 : 3
                });
                uni.hideLoading();
                uni.showToast({
                    title: val === 'depart' ? '出发签到成功' : '到达签到成功',
                    icon: 'none',
                    duration: 1500,
					success: () => {
						handleGetClockinLastInfoChange();
					}
                });
                clearCooldown(val === 'depart' ? 'depart' : 'arrive');
                startProjectRouteCooldown(model.checkedPrj);
            } catch(err: any) {
                // success 分支内部出错（接口、地址解析等） → 解除操作锁定
                console.error((val === 'depart' ? '出发' : '到达') + '签到失败', err);
                uni.hideLoading();
                uni.showToast({
                    icon: 'none',
                    title: err?.message || String(err) || '签到失败，请重试',
                    duration: 1500
                });
                if (val === 'depart') {
                    isCoolingDepartDown.value = false;
                } else {
                    isCoolingArriveDown.value = false;
                }
            }
        },
        fail: (error) => {
            console.log('error', error);
            uni.hideLoading();
            uni.showToast({
                icon: 'none',
                title: '获取位置失败，请检查定位权限',
                duration: 1500
            });
            if (val === 'depart') {
                isCoolingDepartDown.value = false;
            } else {
                isCoolingArriveDown.value = false;
            }
        }
    });
};

// 考勤打卡
const handleAttendanceClockinChange = () => {
    if (!model.checkedPrj) {
        uni.showToast({
            icon: 'none',
            title: '请您先选择项目再打卡',
            duration: 1500
        });
        return;
    }
    if (!hasPermission('project:Clockin:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无打卡权限，请联系管理员',
            duration: 1500
        });
        isCoolingDown.value = false;
        return;
    }
	
	if (model.lastClockInInfo.status === 2) {
		uni.showToast({
		    icon: 'none',
		    title: '您还未点击到达，请先点击到达再打卡。',
		    duration: 1500
		});
		return;
	}

    // 如果在冷却期，给提示并返回
    if (isClockinLocked.value) {
        uni.showToast({
            icon: 'none',
            title: clockinCooldownSeconds.value ? `请等待 ${clockinCooldownSeconds.value} 秒后再打卡` : '请稍候后再操作',
            duration: 1500
        });
        return;
    }

    // 从打开相机起就锁定本次打卡。此前只在图片上传完成、开始定位时才加锁，
    // 快速连续点击会同时发起多次拍照/上传；后一次上传完成后被节流函数丢弃，
    // 从而遗留“上传图片中…”遮罩。
    isCoolingDown.value = true;
    // 下班=1 上班=0：点击瞬间固定传值，防止拍照/定位期间 onShow 刷新把 isClockIn 翻转
    const punchCtype = isClockIn.value ? 1 : 0;
    console.log('[打卡调试] 点击瞬间固化 punchCtype =', punchCtype, '| isClockIn =', isClockIn.value, '| pid =', model.checkedPrj, '| lastClockInInfo =', JSON.stringify(model.lastClockInInfo));

	uni.chooseImage({
		count: 1,
		sourceType: ["camera"],
		success: async (res) => {
			try {
				// console.log(JSON.stringify(res.tempFilePaths));
				console.log('res', res);
				const path = res.tempFilePaths[0];
				const canvasOptions = {
					  canvasId: 'blurDetectCanvas'
				}
				const result = await blurDetector.detect(path, 1000, canvasOptions);
				console.log('resultresultresult', result);
				if (result.isBlur) {
				// 模糊重拍：复位冷却，否则 10s 内按钮被锁死且无提示
				isCoolingDown.value = false;
				uni.showModal({
					title: '提示',
					content: '图片不清晰，请重新拍摄',
					showCancel: false
				})
				return
			}
			const tokenInfo = await fetchGetUploadFileTokenInfo();
			// 截取最后一个 '/' 后面的内容
			const tempName = path.substring(path.lastIndexOf('/') + 1);
			let fileTransName = "";
			// 简单校验：如果截取出来的名字包含 '.' (有后缀)，通常可用
			// 小程序里有时截取出来是 wxfile://... 这种，没有后缀，就不太准
			if (tempName.includes('.')) {
				fileTransName = tempName;
			} else {
				// 3. 兜底方案：如果上述都拿不到，生成一个带时间戳的假名字
				// 或者提示用户手动输入
				fileTransName = 'image_' + Date.now() + '.jpg'; 
			}
	
			console.log('最终文件名:', fileTransName);
			const fileName = 'work-project/clockinImage/' + uuidv4() + '/' + fileTransName;
			uni.showLoading({ title: '上传图片中…', mask: true });
			uni.uploadFile({
				url: QINIU_UPLOAD_URL,
				// 直接将 tempFile 对象传给 filePath
				filePath: path,
				name: 'file',
				formData: { token: tokenInfo, key: fileName },
				success: (uploadRes) => {
					console.log('上传成功', uploadRes);
					try {
						let data = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
						if (data.key) {
							const dataRes = QINIU_URL + data.key + '?' + fileName;
							// 执行实际的打卡逻辑（内部会把 loading 切到「定位中…」）
							handleAttendanceClockinExecuteChange(dataRes, punchCtype);
						} else {
							throw new Error('上传返回缺少 key');
						}
					} catch (err) {
						console.error('上传处理失败', err);
						uni.hideLoading();
						isCoolingDown.value = false;
						uni.showToast({
							icon: 'none',
							title: '图片上传失败，请重试',
							duration: 1500
						});
					} finally {
						console.error('上传处理完成');
					}
				},
				fail: (err) => {
					console.error('上传失败', err);
					uni.hideLoading();
					isCoolingDown.value = false;
					uni.showToast({
						icon: 'none',
						title: '图片上传失败，请重试',
						duration: 1500
					});
				}
			});
			} catch (err) {
				console.error('拍照图片处理失败', err);
				uni.hideLoading();
				isCoolingDown.value = false;
				uni.showToast({
					icon: 'none',
					title: '图片处理失败，请重试',
					duration: 1500
				});
			}
		},
		fail: () => {
			isCoolingDown.value = false;
		}
	})

};

// 考勤打卡
// 入口处的 isCoolingDown 已覆盖拍照、上传、定位和提交整个生命周期，
// 这里不能再用节流丢弃调用，否则上传完成后没有后续定位流程，loading 会遗留。
const handleAttendanceClockinExecuteChange = async (fileUrl: string, punchCtype: number) => {
    isCoolingDown.value = true;
    uni.showLoading({ title: '定位中…', mask: true });
    uni.getLocation({
        type: 'gcj02',
        geocode: true,
        isHighAccuracy: true,
        highAccuracyExpireTime: 10000,
        success: async (res) => {
            try {
                dataForm.longitude = res.longitude;
                dataForm.latitude = res.latitude;
                console.log('res', res);
                if (!model.checkedPrj) {
                    // 上下班打卡必须绑定项目（入口 handleAttendanceClockinChange 已校验，这里兜底）
                    uni.hideLoading();
                    isCoolingDown.value = false;
                    uni.showToast({
                        icon: 'none',
                        title: '请您先选择项目再打卡',
                        duration: 1500
                    });
                    return;
                } else {
                    if (!dataForm.prjLatitude || !dataForm.prjLongitude) {
                        uni.hideLoading();
                        isCoolingDown.value = false;
                        uni.showToast({
                            title: '禁止打卡, 请联系管理员',
                            icon: 'none',
                            duration: 1500
                        });
                        return;
                    } else {
                        const checkResult = calcDistance(
                            dataForm.latitude,
                            dataForm.longitude,
                            dataForm.prjLatitude,
                            dataForm.prjLongitude,
                            model.systemCongfigInfo.merror
                        );
                        const address: any = await getAddress(dataForm.latitude, dataForm.longitude);
                        uni.showLoading({ title: (punchCtype === 1 ? '下班' : '上班') + '打卡中…', mask: true });
                        await fetchSavePrjClockinInfo(model.checkedPrjaddress === -1 ? {
                            list: [{
                                pid: model.checkedPrj,
                                // 打卡类型固定显式传值：下班=1 上班=0
                                ctype: punchCtype,
                                address,
                                longitude: dataForm.longitude,
                                latitude: dataForm.latitude,
                                devtime: new Date().getTime(),
								re1: fileUrl
                            }],
                            check: checkResult
                        } : {
                            list: [{
                                pid: model.checkedPrj,
                                // 打卡类型固定显式传值：下班=1 上班=0
                                ctype: punchCtype,
                                address,
                                addrid: model.checkedPrjaddress,
                                longitude: dataForm.longitude,
                                latitude: dataForm.latitude,
                                devtime: new Date().getTime()
                            }],
                            check: checkResult
                        });
                        if (punchCtype === 0) {
                            uni.$emit("locationPositionChange", {
                                pid: model.checkedPrj
                            });
                        } else {
                            uni.$emit("locationPositionCloseChange");
                        }
                        uni.hideLoading();
                        uni.showToast({
                            title: (punchCtype === 1 ? '下班' : '上班') + '打卡成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                handleGetClockinLastInfoChange();
                            }
                        });
                        clearCooldown('clockin');
                        startProjectClockinCooldown(model.checkedPrj);
                    }
                }
            } catch(err: any) {
                // success 分支内部出错（接口、地址解析等） → 解除操作锁定
                console.error((punchCtype === 1 ? '下班' : '上班') + '打卡失败', err);
                uni.hideLoading();
                uni.showToast({
                    icon: 'none',
                    title: err?.message || String(err) || '打卡失败，请重试',
                    duration: 1500
                });
                isCoolingDown.value = false;
            }
        },
        fail: (error) => {
            console.log('error', error);
            uni.hideLoading();
            uni.showToast({
                icon: 'none',
                title: '获取位置失败，请检查定位权限',
                duration: 1500
            });
            isCoolingDown.value = false;
        }
    });
};

// 获取上次打卡信息
function resetLastClockinInfo() {
    isClockIn.value = false;
    Object.assign(model.lastClockInInfo, {
        address: '',
        ctype: 0,
        dbtime: '',
        status: 0,
        duration: 0,
        distanse: 0,
        re1: ''
    });
}

async function handleGetClockinLastInfoChange(projectId = model.checkedPrj) {
    // 最近一次打卡必须以当前项目为范围；未选择项目时不查询全局记录。
    if (projectId === null || projectId === undefined || projectId === '') {
        resetLastClockinInfo();
        return;
    }
    if (!hasPermission('project:Clockin:select')) {
        return
    }
    try {
        let queryParams: any = {};
        if (projectId) {
            queryParams['pid'] = projectId;
        }
        const data = await fetchGetPrjClockinLastInfo(queryParams);
        // 切换项目期间旧请求可能后返回，不能覆盖当前项目的状态。
        if (String(projectId ?? '') !== String(model.checkedPrj ?? '')) return;
        if (!data) {
            resetLastClockinInfo();
        } else {
            isClockIn.value = data.status === 0 || data.status === 1 ? data.ctype === 0 ? true : false : false;
            model.lastClockInInfo.address = data.address;
            model.lastClockInInfo.ctype = data.ctype;
            model.lastClockInInfo.dbtime = data.dbtime;
            model.lastClockInInfo.status = data.status;
            model.lastClockInInfo.duration = data.duration || 0;
            model.lastClockInInfo.distanse = data.distanse || 0;
			model.lastClockInInfo.re1 = data.re1 || "";
        }
    } catch (error) {
        console.error('获取上次打卡信息失败', error);
    }
}

// 获取工程技术人员信息 && 实时轨迹
// status: 1 = 外勤, 2 = 公司, 3 = 未知
async function getDataList() {
    model.allDataList = [];
    model.fieldworkDataList = [];
    model.companyDataList = [];
    model.unknownDataList = [];

    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
        const realtimeTrajectoryData = await fetchGetRealtimeTrajectoryInfo();
        // 如果没有任何实时轨迹 → 全部未知
        if (!realtimeTrajectoryData || realtimeTrajectoryData.length === 0) {
            model.allDataList = data.list.map((item: any) => ({ ...item, status: 3 }));
            model.unknownDataList = [...model.allDataList];
            return;
        }

        // 建立 pid 映射表，便于快速查找
        const rtMap = new Map();
        realtimeTrajectoryData.forEach((rt: any) => {
            rtMap.set(rt.creater, rt); // 假设 realtimeTrajectoryData 里 userid 对应 dataItem.id
        });

        const allUserList = data.list.filter((item: any) => item.status === 0);

        allUserList.forEach((item: any) => {
            const rtInfo = rtMap.get(item.id); // 匹配是否有实时位置信息

            let status = 3;  // 默认未知
            let merged: any = { ...item };

            if (rtInfo) {
                // 合并轨迹信息
                merged = {
                    ...merged,
                    address: rtInfo.address,
                    pid: rtInfo.pid,
                    proname: rtInfo.proname,
                    userimage: rtInfo.userimage,
                    dbtime: rtInfo.dbtime,
                    longitude: rtInfo.longitude,
                    latitude: rtInfo.latitude
                };

                if (rtInfo.pid === -1) {
                    status = 2; // 公司
                } else {
                    status = 1; // 外勤
                }
            }

            merged.status = status;

            // 放入总列表
            model.allDataList.push(merged);

            // 分类
            if (status === 1) model.fieldworkDataList.push(merged);
            if (status === 2) model.companyDataList.push(merged);
            if (status === 3) model.unknownDataList.push(merged);
        });

        tabsList.value[0].count = model.allDataList.length;
        tabsList.value[1].count = model.fieldworkDataList.length;
        tabsList.value[2].count = model.companyDataList.length;
        tabsList.value[3].count = model.unknownDataList.length;
    } catch (err) {
        console.error('获取工程技术人员信息失败', err);
    }
}

function handleTabbarChange({ value }: { value: string }) {
	if (value !== 'attendance') {
		setTabbarItemActive(value);
		uni.switchTab({
			url: '/pages/' + activeTabbar.value.name
		})
	}
}

onMounted(async() => {
    if (userType.value !== 0 && userType.value !== 4) {
        // 初始赋值
        updateTime();

        // 每秒更新一次
        timer = setInterval(updateTime, 1000);
        model.page = 1;
        getPrjDataList();
    }
});

onUnmounted(() => {
    // 离开页面时清理定时器
    timer && clearInterval(timer);
    routeCooldownTimer && clearInterval(routeCooldownTimer);
    routeCooldownTimer = undefined;
    clockinCooldownTimer && clearInterval(clockinCooldownTimer);
    clockinCooldownTimer = undefined;
});

onReady(() => {
	// #ifdef APP || APP-PLUS
	uni.hideTabBar();
	// #endif
})

onShow(() => {
    if (userType.value === 0 || userType.value === 4) {
        getDataList();
    } else {
        getUserDetailInfo();
        handleGetClockinLastInfoChange();
        // uni.getLocation({
        //     type: 'gcj02',
        //     geocode: true,
        //     isHighAccuracy: true,
        //     highAccuracyExpireTime: 10000,
        //     success: (res) => {
        //         dataForm.longitude = res.longitude;
        //         dataForm.latitude = res.latitude;
        //     },
        //     fail: (error) => {
        //         console.log(error);
        //     }
        // });
    }
});

onPullDownRefresh(() => {
    if (userType.value === 0 || userType.value === 4) {
        getDataList();
    } else {
        getUserDetailInfo();
    }
	setTimeout(() => {
	    uni.hideNavigationBarLoading(); // 完成停止加载
	    uni.stopPullDownRefresh();
	}, 1000);
})
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-navbar title="考勤" safe-area-inset-top placeholder fixed :bordered="false" />
		
		<view v-if="userType === 0 || userType === 4">
			<wd-tabs class="overview-tabs" swipeable animated v-model="activeTab">
				<block v-for="(item, index) in tabsList" :key="index">
					<wd-tab :title="item.title + ' (' + item.count + ')'">
						<wd-gap height="110rpx"></wd-gap>

						<view v-if="activeTab === 0">
							<view v-if="model.allDataList.length > 0">
								<view v-for="(item, index) in model.allDataList" :key="index">
									<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: index === 0 ? '0 20rpx 20rpx 20rpx' : index === model.allDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
										<view style="padding: 5rpx;">
											<wd-cell :title="item.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
												<wd-tag round :type="item.status === 1 ? 'warning' : item.status === 2 ? 'success' : item.status === 3 ? 'default' : 'default'">
													{{ item.status === 1 ? '外勤' : item.status === 2 ? '公司' : item.status === 3 ? '未知' : '未知' }}
												</wd-tag>
											</wd-cell>
										</view>
									</view>
								</view>
							</view>

							<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
								<wd-status-tip image="../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
							</view>
						</view>

						<view v-if="activeTab === 1">
							<view v-if="model.fieldworkDataList.length > 0">
								<view v-for="(fieldworkItem, fieldworkIndex) in model.fieldworkDataList" :key="fieldworkIndex">
									<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: fieldworkIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
										<view style="padding: 5rpx;">
											<wd-cell custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
												<template #title>
													<view style="display: flex; align-items: center; gap: 10rpx;">
														<wd-img round :width="40" :height="40" :src="fieldworkItem.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'" :preview-src="fieldworkItem.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'" :enable-preview="true" />
														<wd-text bold :text="fieldworkItem.username" :color="isDark ? '#ffffff' : '#000'"></wd-text>
													</view>

													<!-- <view v-else>
														<wd-text bold :text="fieldworkItem.username" color="#000000"></wd-text>
													</view> -->
												</template>
												<wd-tag round :type="fieldworkItem.status === 1 ? 'warning' : fieldworkItem.status === 2 ? 'success' : fieldworkItem.status === 3 ? 'default' : 'default'">
													{{ fieldworkItem.status === 1 ? '外勤' : fieldworkItem.status === 2 ? '公司' : fieldworkItem.status === 3 ? '未知' : '未知' }}
												</wd-tag>
											</wd-cell>

											<wd-cell icon="layers" title="项目名称" :value="fieldworkItem.proname" custom-class="cellClass"></wd-cell>
											<wd-cell icon="time" title="打卡时间" :value="fieldworkItem.dbtime" custom-class="cellClass"></wd-cell>
											<wd-cell icon="location" title="打卡地点" :value="fieldworkItem.address" custom-class="cellClass"></wd-cell>
										</view>
									</view>
								</view>
							</view>

							<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
								<wd-status-tip image="../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
							</view>
						</view>

						<view v-if="activeTab === 2">
							<view v-if="model.companyDataList.length > 0">
								<view v-for="(companyItem, companyIndex) in model.unknownDataList" :key="companyIndex">
									<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: companyIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
										<view style="padding: 5rpx;">
											<wd-cell :title="companyItem.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
												<wd-tag round :type="companyItem.status === 1 ? 'warning' : companyItem.status === 2 ? 'success' : companyItem.status === 3 ? 'default' : 'default'">
													{{ companyItem.status === 1 ? '外勤' : companyItem.status === 2 ? '公司' : companyItem.status === 3 ? '未知' : '未知' }}
												</wd-tag>
											</wd-cell>
										</view>
									</view>
								</view>
							</view>

							<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
								<wd-status-tip image="../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
							</view>
						</view>

						<view v-if="activeTab === 3">
							<view v-if="model.unknownDataList.length > 0">
								<view v-for="(unknownItem, unknownIndex) in model.unknownDataList" :key="unknownIndex">
									<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: unknownIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
										<view style="padding: 5rpx;">
											<wd-cell :title="unknownItem.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
												<wd-tag round :type="unknownItem.status === 1 ? 'warning' : unknownItem.status === 2 ? 'success' : unknownItem.status === 3 ? 'default' : 'default'">
													{{ unknownItem.status === 1 ? '外勤' : unknownItem.status === 2 ? '公司' : unknownItem.status === 3 ? '未知' : '未知' }}
												</wd-tag>
											</wd-cell>
										</view>
									</view>
								</view>
							</view>

							<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
								<wd-status-tip image="../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
							</view>
						</view>
					</wd-tab>
				</block>
			</wd-tabs>
		</view>

		<view class="attendance-content" v-else>
			<view class="attendance-profile" :class="{ 'is-dark': isDark }">
				<view :style="{ borderRadius: '20rpx', display: 'flex', alignItems: 'center' }">
					<wd-img :width="50" :height="50" round :src="avatarImage" :preview-src="avatarImage" :enable-preview="true" />
					<view style="display: flex; justify-content: space-around; flex-direction: column; margin-left: 20rpx; line-height: 2">
						<wd-text bold :text="username" size="16px" :color="isDark ? '#ffffff' : '#1b1b1b'" />
						<wd-text text="工程中心人员打卡" size="12px" />
					</view>
				</view>

				<wd-icon v-if="hasPermission('project:Clockin:report:select')" name="calendar" size="26px" @click="handleJumpChange"></wd-icon>
			</view>

			<wd-gap height="20rpx" />

			<!-- 绑定项目 -->
			<view class="project-section-header">
				<view class="section-title">项目名称</view>
				<wd-button icon="link" size="small" @click="handleLinkPrjShowChange">关联项目</wd-button>
			</view>

			<view class="project-selector" :class="{ 'is-dark': isDark }">
				<wd-textarea clearable readonly v-model="model.prjName" placeholder="请选择项目" no-border auto-height custom-class="textareaWrap"></wd-textarea>
				<view class="project-selector-actions">
					<wd-button v-if="model.checkedPrj && activeAttendanceTab === 2" icon="location" size="small" @click="handleLinkPrjaddressShowChange">更多地址</wd-button>
					<wd-button v-if="model.prjName" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearPrjChange"></wd-button>
				</view>
			</view>

			<view v-if="model.checkedPrj && activeAttendanceTab === 2" class="project-address-card" :class="{ 'is-dark': isDark }">
				<view class="project-address-card__title"><wd-icon name="location" size="16px" /> 当前项目打卡地址</view>
				<wd-text bold :text="currentPrjAddress" size="14px" :color="isDark ? '#ffd9a8' : '#9a5b10'" />
				<view class="project-address-card__hint">位置有误请联系工程负责人修改</view>
			</view>

			<view class="attendance-switch" :class="{ 'is-dark': isDark }">
				<view class="attendance-switch__item" :class="{ 'is-active': activeAttendanceTab === 1 }" @click="activeAttendanceTab = 1">
					路程
				</view>

				<view class="attendance-switch__item" :class="{ 'is-active': activeAttendanceTab === 2 }" @click="activeAttendanceTab = 2">
					考勤
				</view>
			</view>
			
			<wd-gap height="20rpx" />

			<view v-if="model.checkedPrj && model.lastClockInInfo.address && activeAttendanceTab === 2 && (model.lastClockInInfo.status === 0 || model.lastClockInInfo.status === 1)" class="clockin-summary" :class="{ 'is-dark': isDark }">
				<view class="clockin-summary__header">
					<view class="clockin-summary__title"><wd-icon name="clock" size="18px" /> 最近一次打卡</view>
					<wd-tag round :type="model.lastClockInInfo.status === 0 ? 'success' : 'danger'">
						{{ model.lastClockInInfo.status === 0 ? '正常' : '异常' }}
					</wd-tag>
				</view>

				<view class="clockin-summary__grid">
					<view class="clockin-summary__item">
						<view class="clockin-summary__label"><wd-icon name="list" size="15px" /> 打卡类型</view>
						<view class="clockin-summary__value">{{ model.lastClockInInfo.ctype === 0 ? '上班打卡' : model.lastClockInInfo.ctype === 1 ? '下班打卡' : model.lastClockInInfo.ctype === 2 ? '系统上报' : '未知' }}</view>
					</view>
					<view class="clockin-summary__item">
						<view class="clockin-summary__label"><wd-icon name="time" size="15px" /> 打卡时长</view>
						<view class="clockin-summary__value">{{ model.lastClockInInfo.duration }} 小时</view>
					</view>
					<view class="clockin-summary__item">
						<view class="clockin-summary__label"><wd-icon name="flag" size="15px" /> 距离误差</view>
						<view class="clockin-summary__value">{{ model.lastClockInInfo.distanse }} 米</view>
					</view>
					<view class="clockin-summary__item">
						<view class="clockin-summary__label"><wd-icon name="clock" size="15px" /> 打卡时间</view>
						<view class="clockin-summary__value">{{ model.lastClockInInfo.dbtime }}</view>
					</view>
				</view>

				<view class="clockin-summary__address">
					<view class="clockin-summary__label"><wd-icon name="location" size="15px" /> 打卡地址</view>
					<view class="clockin-summary__address-text">{{ model.lastClockInInfo.address }}</view>
				</view>

				<view v-if="model.lastClockInInfo.re1" class="clockin-summary__photo">
					<view class="clockin-summary__label"><wd-icon name="picture" size="15px" /> {{ model.lastClockInInfo.ctype === 0 ? '上班打卡照片' : '下班打卡照片' }}</view>
					<wd-img :width="104" :height="104" :src="model.lastClockInInfo.re1" :enable-preview="true"></wd-img>
				</view>
			</view>

			<wd-gap height="20rpx" v-if="model.lastClockInInfo.address" />
			
			<view v-if="activeAttendanceTab === 1">
				<wd-tabs animated v-model="activeDepartArriveTab">
					<wd-tab title="出发">
						<view v-if="canDepart" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '24rpx 0', marginTop: '20rpx', marginBottom: '24rpx' }">
							<view :style="{ margin: '24rpx auto', background: isDepartLocked ? '#8fa0b6' : '#4169E1', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }" @click="handleDepartOrArriveClockinChange('depart')">
								<template v-if="isDepartLocked && routeCooldownSeconds">
									<wd-icon name="time" size="28px" color="#ffffff" />
									<wd-text bold text="操作冷却中" size="17px" lineHeight="28px" color="#ffffff" />
									<wd-text :text="'还需 ' + routeCooldownSeconds + ' 秒'" size="14px" lineHeight="22px" color="#e8eef7" />
								</template>
								<wd-text v-else bold :text="currentTime" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
							</view>
						</view>
						<view v-else class="route-empty-state" :class="{ 'is-dark': isDark }">
							<view class="route-empty-state__icon"><wd-icon name="location" size="26px" color="#2563eb" /></view>
							<view class="route-empty-state__title">暂不能出发</view>
							<wd-text :text="departBlockTip" size="14px" :color="isDark ? '#9ca3af' : '#718096'" />
							<view v-if="model.lastClockInInfo.dbtime" :style="{ marginTop: '16rpx' }">
								<wd-text :text="'最近打卡：' + lastClockTypeText + ' ' + model.lastClockInInfo.dbtime" size="13px" :color="isDark ? '#8a9099' : '#999999'" />
							</view>
							<view v-if="model.lastClockInInfo.address" :style="{ marginTop: '8rpx' }">
								<wd-text :text="model.lastClockInInfo.address" size="13px" :color="isDark ? '#8a9099' : '#999999'" />
							</view>
						</view>
					</wd-tab>
					<wd-tab title="到达">
						<view v-if="canArrive" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '24rpx 0', marginTop: '20rpx', marginBottom: '24rpx' }">
							<view :style="{ margin: '24rpx auto', background: isArriveLocked ? '#8fa0b6' : '#4169E1', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }" @click="handleDepartOrArriveClockinChange('arrive')">
								<template v-if="isArriveLocked && routeCooldownSeconds">
									<wd-icon name="time" size="28px" color="#ffffff" />
									<wd-text bold text="操作冷却中" size="17px" lineHeight="28px" color="#ffffff" />
									<wd-text :text="'还需 ' + routeCooldownSeconds + ' 秒'" size="14px" lineHeight="22px" color="#e8eef7" />
								</template>
								<wd-text v-else bold :text="currentTime" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
							</view>
						</view>
						<view v-else class="route-empty-state" :class="{ 'is-dark': isDark }">
							<view class="route-empty-state__icon"><wd-icon name="location" size="26px" color="#2563eb" /></view>
							<view class="route-empty-state__title">尚未开始行程</view>
							<wd-text :text="arriveBlockTip" size="14px" :color="isDark ? '#9ca3af' : '#718096'" />
							<view v-if="model.lastClockInInfo.dbtime" :style="{ marginTop: '16rpx' }">
								<wd-text :text="'最近打卡：' + lastClockTypeText + ' ' + model.lastClockInInfo.dbtime" size="13px" :color="isDark ? '#8a9099' : '#999999'" />
							</view>
							<view v-if="model.lastClockInInfo.address" :style="{ marginTop: '8rpx' }">
								<wd-text :text="model.lastClockInInfo.address" size="13px" :color="isDark ? '#8a9099' : '#999999'" />
							</view>
						</view>
					</wd-tab>
				</wd-tabs>
			</view>

			<view v-if="activeAttendanceTab === 2">
				<view v-if="canClockIn" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '40rpx 0', marginBottom: '40rpx' }">
					<view :style="{ margin: '60rpx auto', background: isClockinLocked ? '#8fa0b6' : '#4169E1', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }" @click="handleAttendanceClockinChange">
						<template v-if="clockinCooldownSeconds">
							<wd-icon name="time" size="28px" color="#ffffff" />
							<wd-text bold text="打卡成功" size="17px" lineHeight="28px" color="#ffffff" />
							<wd-text :text="'还需 ' + clockinCooldownSeconds + ' 秒'" size="14px" lineHeight="22px" color="#e8eef7" />
						</template>
						<template v-else>
							<wd-text bold v-if="model.checkedPrj" text="外勤" size="18px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
							<wd-text bold :text="(isClockIn ? '下班' : '上班') + '打卡'" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
							<wd-text bold :text="currentTime" size="18px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
						</template>
					</view>
				</view>
				<view v-else :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '40rpx 30rpx', marginBottom: '40rpx', display: 'flex', flexDirection: 'column', alignItems: 'center' }">
					<wd-text :text="clockInBlockTip" size="15px" :color="isDark ? '#8a9099' : '#999999'" />
					<view v-if="model.lastClockInInfo.dbtime" :style="{ marginTop: '16rpx' }">
						<wd-text :text="'最近打卡：' + lastClockTypeText + ' ' + model.lastClockInInfo.dbtime" size="13px" :color="isDark ? '#8a9099' : '#999999'" />
					</view>
					<view v-if="model.lastClockInInfo.address" :style="{ marginTop: '8rpx' }">
						<wd-text :text="model.lastClockInInfo.address" size="13px" :color="isDark ? '#8a9099' : '#999999'" />
					</view>
				</view>
			</view>

			<!-- <view v-if="!model.checkedPrj" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '20px 0', marginBottom: '40rpx' }">
				<view  :style="{ margin: '60rpx auto', background: '#cccccc', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }">
					<wd-text bold v-if="model.checkedPrj" text="外勤" size="18px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
					<wd-text bold :text="(isClockIn ? '下班' : '上班') + '打卡'" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
					<wd-text bold :text="currentTime" size="18px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
				</view>
			</view> -->

			<!-- #ifdef H5 -->
			<wd-popup closable custom-style="width: 80vw;" :z-index="999" v-model="prjShow" position="left" @close="handleCloseChange">
				<wd-gap height="70rpx" />

				<wd-search v-model="model.fuzzy" placeholder="请输入项目名称" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

				<scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 170rpx);">
					<wd-radio-group v-model="model.checkedPrj" shape="dot" @change="handleRadioSelectChange">
						<wd-cell v-for="(item, index) in model.prjDataList" :key="index" custom-class="radioCellWrap">
							<wd-radio :value="item.id">{{ item.proname }}</wd-radio>
						</wd-cell>
					</wd-radio-group>
				</scroll-view>
			</wd-popup>
			<!-- #endif -->

			<!-- #ifdef APP || APP-PLUS || MP-WEIXIN -->
			<wd-popup custom-style="width: 80vw; padding-top: 86rpx" :z-index="999" v-model="prjShow" position="left" @close="handleCloseChange">
				<wd-gap height="70rpx" />

				<wd-search v-model="model.fuzzy" placeholder="请输入项目名称" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

				<scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 240rpx);">
					<wd-radio-group v-model="model.checkedPrj" shape="dot" @change="handleRadioSelectChange">
						<wd-cell v-for="(item, index) in model.prjDataList" :key="index" custom-class="radioCellWrap">
							<wd-radio :value="item.id">{{ item.proname }}</wd-radio>
						</wd-cell>
					</wd-radio-group>
				</scroll-view>
			</wd-popup>
			<!-- #endif -->

			<!-- #ifdef H5 -->
			<wd-popup closable custom-style="width: 80vw;" :z-index="999" v-model="prjaddressShow" position="left" @close="handlePrjaddressCloseChange">
				<wd-gap height="70rpx" />

				<wd-search v-model="model.prjaddressFuzzy" placeholder="请输入项目地址名称" placeholder-left cancel-txt="搜索" @search="handleSearchPrjaddressFuzzyChange" @cancel="handleSearchPrjaddressFuzzyChange" @clear="handleClearPrjaddressFuzzyChange" />

				<scroll-view scroll-y refresher-enabled :refresher-triggered="prjaddressTriggered" @refresherrefresh="handleScrollPrjaddressRefreshChange" @scrolltolower="handleScrollPrjaddresstolowerChange" style="height: calc(100vh - 170rpx);">
					<wd-radio-group v-model="model.checkedPrjaddress" shape="dot" @change="handleRadioPrjaddressSelectChange">
						<wd-cell v-for="(item, index) in model.prjaddressDataList" :key="index" custom-class="radioCellWrap">
							<wd-radio :value="item.id">{{ item.addr }}</wd-radio>
						</wd-cell>
					</wd-radio-group>
				</scroll-view>
			</wd-popup>
			<!-- #endif -->

			<!-- #ifdef APP || APP-PLUS || MP-WEIXIN -->
			<wd-popup custom-style="width: 80vw; padding-top: 86rpx" :z-index="999" v-model="prjaddressShow" position="left" @close="handlePrjaddressCloseChange">
				<wd-gap height="70rpx" />

				<wd-search v-model="model.prjaddressFuzzy" placeholder="请输入项目地址名称" placeholder-left cancel-txt="搜索" @search="handleSearchPrjaddressFuzzyChange" @cancel="handleSearchPrjaddressFuzzyChange" @clear="handleClearPrjaddressFuzzyChange" />

				<scroll-view scroll-y refresher-enabled :refresher-triggered="prjaddressTriggered" @refresherrefresh="handleScrollPrjaddressRefreshChange" @scrolltolower="handleScrollPrjaddresstolowerChange" style="height: calc(100vh - 240rpx);">
					<wd-radio-group v-model="model.checkedPrjaddress" shape="dot" @change="handleRadioPrjaddressSelectChange">
						<wd-cell v-for="(item, index) in model.prjaddressDataList" :key="index" custom-class="radioCellWrap">
							<wd-radio :value="item.id">{{ item.addr }}</wd-radio>
						</wd-cell>
					</wd-radio-group>
				</scroll-view>
			</wd-popup>
			<!-- #endif -->
		</view>
		
		<canvas canvas-id="blurDetectCanvas" id="blurDetectCanvas" class="hidden-canvas"></canvas>
		
		<wd-tabbar shape="round" model-value="attendance" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
			<wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
		</wd-tabbar>
	</wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.wd-tabs) {
    background-color: transparent !important;
}

:deep(.overview-tabs .wd-tabs__nav) {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 99 !important;
}

:deep(.cellValueClass) {
    font-size: 16px !important;
    font-weight: bolder !important;
}

:deep(.cellLabelTitle) {
    font-weight: bolder !important;
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }

    .wd-cell__right {
        font-weight: bold !important;
    }
}

.statusText {
    margin-top: 10rpx;
}

:deep(.wd-cell-group__body) {
    overflow: hidden !important;
    border-radius: 40rpx !important;
}

.radioCellWrap {
    padding: 0 !important;

    :deep(.wd-cell__wrapper) {
        display: block !important;
        padding: 20rpx !important;
    }
}

.attendance-content {
	padding: 20rpx;
}

.attendance-profile,
.project-selector {
	display: flex;
	align-items: center;
	background: #ffffff;
	border: 1px solid #edf0f5;
	border-radius: 24rpx;
	box-sizing: border-box;
}

.attendance-profile {
	justify-content: space-between;
	padding: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(30, 57, 94, 0.04);
}

.attendance-profile.is-dark,
.project-selector.is-dark,
.attendance-switch.is-dark {
	background: #1b1b1b;
	border-color: #2a2a2a;
}

.project-section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 28rpx 4rpx 14rpx;
}

.section-title {
	position: relative;
	padding-left: 16rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #1f2937;
}

.section-title::before {
	position: absolute;
	left: 0;
	top: 5rpx;
	width: 6rpx;
	height: 30rpx;
	border-radius: 99rpx;
	background: #2563eb;
	content: '';
}

.project-selector {
	min-height: 88rpx;
	padding: 6rpx 12rpx 6rpx 20rpx;
	margin-bottom: 16rpx;
}

.project-selector-actions {
	display: flex;
	align-items: center;
	gap: 6rpx;
	flex-shrink: 0;
}

.textareaWrap {
	flex: 1;
	width: auto !important;
	min-width: 0;
}

.project-address-card {
	margin-bottom: 18rpx;
	padding: 20rpx 22rpx;
	border: 1px solid #fed7aa;
	border-radius: 20rpx;
	background: #fff7ed;
	box-sizing: border-box;
}

.project-address-card.is-dark {
	border-color: #5f4324;
	background: #2b2118;
}

.project-address-card__title {
	display: flex;
	align-items: center;
	gap: 8rpx;
	margin-bottom: 10rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #9a5b10;
}

.project-address-card__hint {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #b7791f;
}

.attendance-switch {
	display: flex;
	padding: 6rpx;
	border: 1px solid #edf0f5;
	border-radius: 22rpx;
	background: #f5f7fb;
	box-sizing: border-box;
}

.attendance-switch__item {
	width: 50%;
	padding: 16rpx 0;
	border-radius: 16rpx;
	text-align: center;
	font-size: 28rpx;
	font-weight: 600;
	color: #64748b;
	transition: all 0.2s ease;
}

.attendance-switch__item.is-active {
	background: #ffffff;
	box-shadow: 0 4rpx 12rpx rgba(30, 57, 94, 0.12);
	color: #2563eb;
}

.attendance-switch.is-dark .attendance-switch__item.is-active {
	background: #2a2a2a;
}

.clockin-summary {
	margin-top: 2rpx;
	padding: 24rpx;
	border: 1px solid #edf0f5;
	border-radius: 24rpx;
	background: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(30, 57, 94, 0.04);
	box-sizing: border-box;
}

.clockin-summary.is-dark {
	border-color: #2a2a2a;
	background: #1b1b1b;
}

.clockin-summary__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 18rpx;
	border-bottom: 1px solid #edf0f5;
}

.clockin-summary.is-dark .clockin-summary__header {
	border-color: #303030;
}

.clockin-summary__title {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #1f2937;
}

.clockin-summary.is-dark .clockin-summary__title,
.clockin-summary.is-dark .clockin-summary__value,
.clockin-summary.is-dark .clockin-summary__address-text {
	color: #f8fafc;
}

.clockin-summary__grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	padding: 20rpx 0;
}

.clockin-summary__item {
	min-width: 0;
	padding: 16rpx;
	border-radius: 16rpx;
	background: #f7f9fc;
}

.clockin-summary.is-dark .clockin-summary__item,
.clockin-summary.is-dark .clockin-summary__address,
.clockin-summary.is-dark .clockin-summary__photo {
	background: #252525;
}

.clockin-summary__label {
	display: flex;
	align-items: center;
	gap: 6rpx;
	margin-bottom: 8rpx;
	font-size: 22rpx;
	color: #7b8798;
}

.clockin-summary__value {
	overflow: hidden;
	font-size: 24rpx;
	font-weight: 700;
	line-height: 1.45;
	color: #1f2937;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.clockin-summary__address,
.clockin-summary__photo {
	padding: 18rpx;
	border-radius: 16rpx;
	background: #f7f9fc;
}

.clockin-summary__address-text {
	font-size: 25rpx;
	font-weight: 600;
	line-height: 1.6;
	color: #1f2937;
}

.clockin-summary__photo {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 16rpx;
}

.clockin-summary__photo .clockin-summary__label {
	margin: 0;
}

.route-empty-state {
	display: flex;
	min-height: 310rpx;
	padding: 36rpx 30rpx;
	margin: 32rpx 0 40rpx;
	border: 1px solid #edf0f5;
	border-radius: 24rpx;
	background: #ffffff;
	box-sizing: border-box;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
}

.route-empty-state.is-dark {
	border-color: #2a2a2a;
	background: #1b1b1b;
}

.route-empty-state__icon {
	display: flex;
	width: 76rpx;
	height: 76rpx;
	margin-bottom: 16rpx;
	border-radius: 50%;
	background: #eff6ff;
	align-items: center;
	justify-content: center;
}

.route-empty-state__title {
	margin-bottom: 10rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #334155;
}

.route-empty-state.is-dark .route-empty-state__title {
	color: #f8fafc;
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

.hidden-canvas {
	// width: 120px;
	// height: 120px;
	width: 400px;
	height: 400px;
	position: fixed;
	left: -9999px;
}
</style>
