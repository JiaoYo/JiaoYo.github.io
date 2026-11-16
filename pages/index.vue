<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue';
import uCharts from '@/utils/u-charts.js';
import { getSystemDate, hasPermission, generateHexColors } from '@/utils/index';
import { onReady, onLoad, onUnload, onShow, onHide, onPageScroll, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { noRoundDivide } from '@/utils/index';
import { useTabbar } from '@/composables/useTabbar';
import { fetchGetSystemHomePageInfo, fetchGetDebugHomePageInfo, fetchGetRealtimeTrajectoryInfo, fetchGetAllUserDataList, fetchGetRealtimeTrajectoryDetailInfo } from '@/service/index';
import RdHome from './rdhome/Index.vue';
import { startDeviceScan } from '@/utils/deviceScan';

const { theme, themeVars } = useTheme();

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

const isDark = computed(() => theme.value === 'dark');

// 卡片背景（亮/暗色）
const cardStyle = computed(() => ({ background: isDark.value ? '#171F31' : '#ffffff' }));

const memberType = ref<boolean>(true);

const timer = ref<any>(null);
const mapId = ref<string>('myMap');
const colorsArr = ref<string[]>([]);
let mapCtx: UniApp.MapContext;
const currentLocationPonit = ref<{
    lat: number;
    lng: number;
}>({
    lat: 0,
    lng: 0
});

const centerPonit = ref<{
    lat: number;
    lng: number;
}>({
    lat: 0,
    lng: 0
});

// 地图渲染数据
const optimizedMarkers = ref<any[]>([]);
const optimizedPolyline = ref<any[]>([]);

const userType = ref<number>(uni.getStorageSync('usertype'));

// 设备扫码入口仅对指定用户开放（999 管理员 / 1001 / 1031）
const DEVICE_SCAN_USER_IDS = [999,1001, 1031];
const canDeviceScan = ref<boolean>(DEVICE_SCAN_USER_IDS.includes(Number(uni.getStorageSync('userId'))));
// 设备扫码入口仅对指定用户开放（999 管理员 / 1000 / 1031）
// 顶部tabs：工程中心(0) / 研发中心(1)
// 角色显示规则：0、4 显示tabs；5、8 只显示研发中心；其他角色显示工程中心
const activeTab = ref<number>(0);
const userTypeVal = computed(() => Number(userType.value));
const showTabs = computed(() => userTypeVal.value === 0 || userTypeVal.value === 4);
const isRdUser = computed(() => userTypeVal.value === 5 || userTypeVal.value === 8);
const currentHome = computed(() => {
    if (isRdUser.value) return 1;
    return showTabs.value ? activeTab.value : 0;
});
const navbarTitle = computed(() => (isRdUser.value ? '研发中心' : '首页'));

// 切回工程中心时，图表重绘
watch(activeTab, (val) => {
    if (val === 0) {
        nextTick(() => {
            getServerData();
            getPrjStatusServerData();
            getContractTypeServerData();
            getDebugServerData();
        });
    }
});

const isDetailInfo = ref<boolean>(false);
const scrollTop = ref<number>(0);
const rdHomeRef = ref<any>(null);
const prjType = ref<number>(3);
const selectPrjDate = ref<number>(Number(getSystemDate(5)));
const selectPrjMonth = ref<number>(Number(getSystemDate(5)));
const selectPrjYear = ref<number>(Number(getSystemDate(5)));
const contractType = ref<number>(4);
const selectContractDate = ref<number>(Number(getSystemDate(5)));
const selectContractMonth = ref<number>(Number(getSystemDate(5)));
const selectContractYear = ref<number>(Number(getSystemDate(5)));
const debugType = ref<number>(4);
const selectDebugDate = ref<number>(Number(getSystemDate(5)));
const selectDebugMonth = ref<number>(Number(getSystemDate(5)));
const selectDebugYear = ref<number>(Number(getSystemDate(5)));
const prjDebugType = ref<number>(3);
const selectPrjDebugDate = ref<number>(Number(getSystemDate(5)));
const selectPrjDebugMonth = ref<number>(Number(getSystemDate(5)));
const selectPrjDebugYear = ref<number>(Number(getSystemDate(5)));
// 日期/月/年选择上限：今天（到今日 23:59:59，工程中心各统计区不允许选未来）
const maxDateTs = new Date().setHours(23, 59, 59, 999);
const allUserDataList = ref<any>([]);
const rankList = ref<any>([]);
const teamRankList = ref<any>([]);
const userIdNameObj = ref<any>({});

var uChartsInstance: any = {};
const cWidth = ref<number>(750);
const cHeight = ref<number>(500);

const projectAndContractForm = reactive<{
    projects: number;
    projectn1: number;
    project0: number;
    project1: number;
    project2: number;
    project3: number;
    protype0: number;
	protype1: number;
    // protype2: number;
    contracts: number;
    ptype0: number;
    ptype1: number;
    ptype2: number;
    debugs: number;
    debug0: number;
    debug1: number;
    debug2: number;
    debug3: number;
    debugn1: number;
}>({
    projects: 0,
    projectn1: 0,
    project0: 0,
    project1: 0,
    project2: 0,
    project3: 0,
    protype0: 0,
	protype1: 0,
    // protype2: 0,
    contracts: 0,
    ptype0: 0,
    ptype1: 0,
    ptype2: 0,
    debugs: 0,
    debug0: 0,
    debug1: 0,
    debug2: 0,
    debug3: 0,
    debugn1: 0
});

const model = reactive<{
    allDataList: any;
    fieldworkDataList: any;
    companyDataList: any;
    unknownDataList: any;
}>({
    allDataList: [] as any,
    fieldworkDataList: [] as any,
    companyDataList: [] as any,
    unknownDataList: [] as any
})

// 项目切换
const handlePrjTypeChange = () => {
    getHomePagePrjStatisticsInfo();
}

// 项目日月年选择
function handlePrjDateChange({ value }: { value: number }) {
    getHomePagePrjStatisticsInfo();
}

function handlePrjYearMonthChange({ value }: { value: number }) {
    getHomePagePrjStatisticsInfo();
}

function handlePrjYearChange({ value }: { value: number }) {
    getHomePagePrjStatisticsInfo();
}

// 获取系统项目首页数据源
async function getHomePagePrjStatisticsInfo() {
    if (!hasPermission('system:homePage:select')) {
        return
    }
    let queryParams: any = {};
    try {
        if (prjType.value === 1 || prjType.value === 2 || prjType.value === 3) {
            queryParams['s'] = prjType.value === 1 ? String(getSystemDate(0, selectPrjDate.value)) : prjType.value === 2 ? String(getSystemDate(3, selectPrjMonth.value)) : prjType.value === 3 ? String(getSystemDate(4, selectPrjYear.value)) : '';
        }
        const data = await fetchGetSystemHomePageInfo(queryParams);
        projectAndContractForm.projects = data.project ? data.project.projects || 0 : 0;
        projectAndContractForm.projectn1 = data.project ? data.project.projectn1 || 0 : 0;
        projectAndContractForm.project0 = data.project ? data.project.project0 || 0 : 0;
        projectAndContractForm.project1 = data.project ? data.project.project1 || 0 : 0;
        projectAndContractForm.project2 = data.project ? data.project.project2 || 0 : 0;
        projectAndContractForm.project3 = data.project ? data.project.project3 || 0 : 0;
        projectAndContractForm.protype0 = data.project ? data.project.proPtype0 || 0 : 0;
		projectAndContractForm.protype1 = data.project ? data.project.proPtype1 || 0 : 0;
        // projectAndContractForm.protype2 = data.project ? data.project.proPtype2 || 0 : 0;
        projectAndContractForm.contracts = data.project ? data.project.contracts || 0 : 0;
        projectAndContractForm.ptype0 = data.project ? data.project.proDtype0 || 0 : 0;
        projectAndContractForm.ptype1 = data.project ? data.project.proDtype1 || 0 : 0;
        projectAndContractForm.ptype2 = data.project ? data.project.proDtype2 || 0 : 0;
        nextTick(() => {
            getServerData();
            getPrjStatusServerData();
            getContractTypeServerData();
        })
    } catch (error) {
        console.error('获取系统首页数据源失败', error);
    }
}

// 调试切换
const handleDebugTypeChange = () => {
    getHomePageDebugStatisticsInfo();
}

// 调试日月年选择
function handleDebugDateChange({ value }: { value: number }) {
    getHomePageDebugStatisticsInfo();
}

function handleDebugYearMonthChange({ value }: { value: number }) {
    getHomePageDebugStatisticsInfo();
}

function handleDebugYearChange({ value }: { value: number }) {
    getHomePageDebugStatisticsInfo();
}

// 获取系统调试数据源
async function getHomePageDebugStatisticsInfo() {
    if (!hasPermission('project:Debug:homePage:select')) {
        return
    }
    let queryParams: any = {};
    try {
        if (debugType.value === 1 || debugType.value === 2 || debugType.value === 3) {
            queryParams['s'] = debugType.value === 1 ? String(getSystemDate(0, selectDebugDate.value)) : debugType.value === 2 ? String(getSystemDate(3, selectDebugMonth.value)) : debugType.value === 3 ? String(getSystemDate(4, selectDebugYear.value)) : '';
        }
        const data = await fetchGetDebugHomePageInfo();
        projectAndContractForm.debugs = data.debugs || 0;
        projectAndContractForm.debug0 = data.debug0 || 0;
        projectAndContractForm.debug1 = data.debug1 || 0;
        projectAndContractForm.debug2 = data.debug2 || 0;
        projectAndContractForm.debug3 = data.debug3 || 0;
        projectAndContractForm.debugn1 = data.debugn1 || 0;
        nextTick(() => {
            getDebugServerData();
        })
    } catch (error) {
        console.error('获取系统调试数据源失败', error);
    }
}

// 项目调试积分选择
function handlePrjDebugTypeChange({ value }: { value: number }) {
    getHomePagePrjDebugIntegralInfo();
}

// 项目调试积分日月年选择
function handlePrjDebugDateChange({ value }: { value: number }) {
    getHomePagePrjDebugIntegralInfo();
}

function handlePrjDebugYearMonthChange({ value }: { value: number }) {
    getHomePagePrjDebugIntegralInfo();
}

function handlePrjDebugYearChange({ value }: { value: number }) {
    getHomePagePrjDebugIntegralInfo();
}

// 获取系统项目首页数据源
async function getHomePagePrjDebugIntegralInfo() {
    if (!hasPermission('system:homePage:select')) {
        return
    }
    let queryParams: any = {};
    rankList.value = [];
    try {
        if (prjDebugType.value === 1 || prjDebugType.value === 2 || prjDebugType.value === 3) {
            queryParams['s'] = prjDebugType.value === 1 ? String(getSystemDate(0, selectPrjDebugDate.value)) : prjDebugType.value === 2 ? String(getSystemDate(3, selectPrjDebugMonth.value)) : prjDebugType.value === 3 ? String(getSystemDate(4, selectPrjDebugYear.value)) : '';
        }
        const data = await fetchGetSystemHomePageInfo(queryParams);
        // 用Map存储所有creater
        const map: any = new Map();

        // 先处理debug数组
        data.debug.forEach((item: any) => {
            map.set(item.creater, { ...item, totalscore: 0 }); // 默认totalscore为0
        });

        // 再处理norms数组
		if (data.norms) {
			data.norms.forEach((item: any) => {
			    if (map.has(item.creater)) {
			        map.set(item.creater, { ...map.get(item.creater), totalscore: item.totalscore }); // 合并totalscore
			    } else {
			        map.set(item.creater, { debugs: 0, username: null, userimage: null, ...item }); // debug缺失则补默认值
			    }
			});
		}

        for (const key in userIdNameObj.value) {
            rankList.value.push({
                username: userIdNameObj.value[key].username,
                debugs: map.get(key) ? map.get(key).debugs : 0,
                totalscore: map.get(key) ? map.get(key).totalscore : 0,
                totalCount: (map.get(key) ? map.get(key).debugs : 0) + (map.get(key) ? map.get(key).totalscore : 0),
                userimage: userIdNameObj.value[key].userimage,
            })
        }
		if (userType.value === 3) {
			rankList.value = rankList.value.sort((a: any, b: any) => b.debugs - a.debugs);
		} else {
			rankList.value = rankList.value.sort((a: any, b: any) => b.totalCount - a.totalCount);
		}
		
		teamRankList.value = data.team.sort((a: any, b: any) => b.totalCount - a.totalCount);
    } catch (error) {
        console.error('获取系统首页数据源失败', error);
    }
}

// 排序
function handleSortChange(e: any) {
    console.log('any', e);
    if (e.sortDirection === 1) {
        rankList.value = rankList.value.sort((a: any, b: any) => b[e.prop] - a[e.prop]);
    } else {
        rankList.value = rankList.value.sort((a: any, b: any) => a[e.prop] - b[e.prop]);
    }
}

// 分组排序
function handleGroupSortChange(e: any) {
    console.log('any', e);
    if (e.sortDirection === 1) {
        teamRankList.value = teamRankList.value.sort((a: any, b: any) => b[e.prop] - a[e.prop]);
    } else {
        teamRankList.value = teamRankList.value.sort((a: any, b: any) => a[e.prop] - b[e.prop]);
    }
}

const drawCharts = (id: string, data: any) => {
    // if (uChartsInstance[id]) {
    //     uChartsInstance[id].destroy(); // 可选：销毁旧实例
    // }
    const ctx = uni.createCanvasContext(id);
    uChartsInstance[id] = new uCharts({
        type: "ring",
        context: ctx,
        width: cWidth.value,
        height: cHeight.value,
        series: data.series,
        rotate: false,
        rotateLock: false,
        animation: true,
        inScrollView: true,
        background: "#FFFFFF",
        color: id === 'prjCanvas' ? ["#FFA500", "#909399", '#0055FE', '#F0883A', '#34D19D'] : id === 'debugCanvas' ? ["#FFA500", "#909399", '#0055FE', '#F0883A', '#34D19D'] : ['#409EFF', '#FF9F43', '#00C9A7'],
        // color: ["#00ffff", "#00cfff", "#006ced", "#ffe000", "#ffa800", "#ff5b00", "#ff3000"],
        padding: [5,5,5,5],
        dataLabel: true,
        enableScroll: false,
        legend: {
            show: true,
            position: 'bottom',
            fontSize: 10
        },
        title: {
            name: (id === 'prjCanvas' || id === 'prjStatusCanvas') ? "项目总数" : id === 'debugCanvas' ? '调试总数' : '项目总数',
            fontSize: 15,
            color: "#666666"
        },
        subtitle: {
            name: id === 'prjCanvas' ? String(projectAndContractForm.projects) : id === 'debugCanvas' ? String(projectAndContractForm.debugs) : String(projectAndContractForm.projects),
            fontSize: 25,
            color: "#7cb5ec"
        },
        extra: {
            ring: {
                ringWidth: 15,
                activeOpacity: 0.5,
                activeRadius: 10,
                offsetAngle: 0,
                labelWidth: 15,
                border: true,
                borderWidth: 3,
                borderColor: "#FFFFFF",
                linearType: "custom",
            }
        }
    });
};

const tap = (e: any) => {
    console.log('e', e);
    uChartsInstance[e.target.id].touchLegend(e);
    uChartsInstance[e.target.id].showToolTip(e);
};

const getServerData = () => {
    //模拟从服务器获取数据时的延时
    setTimeout(() => {
        //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
        let res = {
            series: [
                {
                    data: [
                        { name: "未核准", value: projectAndContractForm.projectn1 },
                        { name: "未开始", value: projectAndContractForm.project0 },
                        { name: "进行中", value: projectAndContractForm.project1 },
                        { name: "待审核", value: projectAndContractForm.project2 },
                        { name: "已完成", value: projectAndContractForm.project3 }
                    ]
                }
            ]
        };
        drawCharts('prjCanvas', res);
    }, 500);
};

const getPrjStatusServerData = () => {
    //模拟从服务器获取数据时的延时
    setTimeout(() => {
        //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
        let res = {
            series: [
                {
                    data: [
                        { name: "正常", value: projectAndContractForm.protype0 },
						{ name: "延期", value: projectAndContractForm.protype1 },
                        // { name: "作废", value: projectAndContractForm.protype2 },
                    ]
                }
            ]
        };
        drawStatusCharts('prjStatusCanvas', res);
    }, 500);
};

const drawStatusCharts = (id: string, data: any) => {
    // if (uChartsInstance[id]) {
    //     uChartsInstance[id].destroy(); // 可选：销毁旧实例
    // }
    const ctx = uni.createCanvasContext(id);
    uChartsInstance[id] = new uCharts({
        type: "ring",
        context: ctx,
        width: cWidth.value,
        height: cHeight.value,
        series: data.series,
        rotate: false,
        rotateLock: false,
        animation: true,
        inScrollView: true,
        background: "#FFFFFF",
        color: ["#006ced", "#FF9F43", "#ff3000"],
        padding: [5,5,5,5],
        dataLabel: true,
        enableScroll: false,
        legend: {
            show: true,
            position: 'bottom'
        },
        title: {
            name: "项目总数",
            fontSize: 15,
            color: "#666666"
        },
        subtitle: {
            name: String(projectAndContractForm.projects),
            fontSize: 25,
            color: "#7cb5ec"
        },
        extra: {
            ring: {
                ringWidth: 15,
                activeOpacity: 0.5,
                activeRadius: 10,
                offsetAngle: 0,
                labelWidth: 15,
                border: true,
                borderWidth: 3,
                borderColor: "#FFFFFF",
                linearType: "custom",
            }
        }
    });
};

const getContractTypeServerData = () => {
    //模拟从服务器获取数据时的延时
    setTimeout(() => {
        //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
        let res = {
            series: [
                {
                    data: [
                        { name: "现场调试", value: projectAndContractForm.ptype0 },
                        { name: "远程调试", value: projectAndContractForm.ptype1 },
                        { name: "无需调试", value: projectAndContractForm.ptype2 }
                    ]
                }
            ]
        };
        drawCharts('prjTypeCanvas', res);
    }, 500);
};

const getDebugServerData = () => {
    //模拟从服务器获取数据时的延时
    setTimeout(() => {
        //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
        let res = {
            series: [
                {
                    data: [
                        { name: "申请中", value: projectAndContractForm.debugn1 },
                        { name: "待调试", value: projectAndContractForm.debug0 },
                        { name: "调试中", value: projectAndContractForm.debug1 },
                        { name: "待审核", value: projectAndContractForm.debug2 },
                        { name: "审核完成", value: projectAndContractForm.debug3 }
                    ]
                }
            ]
        };
        drawCharts('debugCanvas', res);
    }, 500);
};

// 跳转项目详情
const handleJumpChange = (url: string) => {
    uni.navigateTo({
        url
    });
};

// Tabbar切换
function handleTabbarChange({ value }: { value: string }) {
    if (value !== 'index') {
		setTabbarItemActive(value);
		uni.switchTab({
			url: '/pages/' + activeTabbar.value.name
		})
	}
}

// 获取当前位置坐标
function getCurrentLocation() {
    uni.getLocation({
        type: 'gcj02',
        geocode: true,
        isHighAccuracy: true,
        highAccuracyExpireTime: 10000,
        success: (res) => {
            console.log('res', res);
            currentLocationPonit.value.lng = res.longitude;
            currentLocationPonit.value.lat = res.latitude;
			getAllUserDataList();
        },
        fail: (error) => {
            console.log(error);
        }
    });
}

// 人员头像兜底图（统计 chips 列表用）
const DEFAULT_AVATAR = 'https://pms.linkqi.cn:18443/soybean.jpg';

// 获取人员实时位置
async function getMemberRealtimeInfo() {
    if (!hasPermission('system:Real:Time:Trajectory:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取人员实时位置权限，请联系管理员',
            duration: 1500
        })
        return false
    }
    try {
        const data = await fetchGetRealtimeTrajectoryInfo();
        if (data) {
            optimizedMarkers.value = [];
            let pointsArr = [{ lat: currentLocationPonit.value.lat, lng: currentLocationPonit.value.lng }]
            data.forEach((item: any, index: number) => {
                pointsArr.push({
                    lat: item.latitude,
                    lng: item.longitude
                });
                optimizedMarkers.value.push({
                    id: item.id,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    title: item.proname,
                    iconPath: '/static/marker.png',
                    width: 24,
                    height: 24,
                    pid: item.pid,
                    creater: item.creater,
                    callout: {
                        fontSize: 14,
                        borderRadius: 4,
                        bgColor: '#FFFFFF',
                        padding: 8,
                        display: 'BYCLICK',
                        width: 160,
                        content: item.pid != -1 ? `调试人员: ${item.username}\n\n项目名称: ${item.proname}\n\n经度: ${item.longitude}\n\n纬度: ${item.latitude}\n\n地址: ${item.address}\n\n时间: ${item.dbtime}` : `调试人员: ${item.username}\n\n项目名称: 远程调试\n\n经度: ${item.longitude}\n\n纬度: ${item.latitude}\n\n地址: ${item.address}\n\n时间: ${item.dbtime}`
                    },
                    label: {
                        content: item.username,
                        padding: 6,
                        borderRadius: 14,
                        bgColor: '#FFFFFF',
						color: '#1F2A44',
                        fontSize: 11,
                        borderWidth: 1,
                        borderColor: 'rgba(0, 0, 0, 0.08)'
                    }
                });
            });
            // const lnglatObj = getCenterPoint(pointsArr);
            // centerPonit.value.lat = lnglatObj ? lnglatObj.lat : 0;
            // centerPonit.value.lng = lnglatObj ? lnglatObj?.lng : 0;
            centerPonit.value.lng = currentLocationPonit.value.lng;
            centerPonit.value.lat = currentLocationPonit.value.lat;
        } else {
            centerPonit.value.lng = currentLocationPonit.value.lng;
            centerPonit.value.lat = currentLocationPonit.value.lat;
        }
		getDataList(data);
    } catch (error) {
        console.error('获取人员实时位置失败', error);
    }
}

// 获取所有的人员
async function getAllUserDataList() {
    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
        allUserDataList.value = data.list.filter((item: any) => item.status !== 1);
        allUserDataList.value.forEach((item: any) => {
            userIdNameObj.value[String(item.id)] = {
                username: item.username,
                userimage: item.userimage || DEFAULT_AVATAR
            };
        });
        await getMemberRealtimeInfo();
        await getHomePagePrjStatisticsInfo();
        await getHomePageDebugStatisticsInfo();
        await getHomePagePrjDebugIntegralInfo();
    } catch (err) {
        console.error('获取工程技术人员信息失败', err);
    }
}

// 获取工程技术人员信息 && 实时轨迹
// status: 1 = 外勤, 2 = 公司, 3 = 未知
async function getDataList(realtimeTrajectoryData: any) {
    model.allDataList = [];
    model.fieldworkDataList = [];
    model.companyDataList = [];
    model.unknownDataList = [];

    try {
        // 如果没有任何实时轨迹 → 全部未知
        if (!realtimeTrajectoryData || realtimeTrajectoryData.length === 0) {
            model.allDataList = allUserDataList.value.map((item: any) => ({ ...item, status: 3 }));
            model.unknownDataList = [...model.allDataList];
            return;
        }

        // 建立 pid 映射表，便于快速查找
        const rtMap = new Map();
        realtimeTrajectoryData.forEach((rt: any) => {
            rtMap.set(rt.creater, rt); // 假设 realtimeTrajectoryData 里 userid 对应 dataItem.id
        });

        const allUserList = allUserDataList.value.filter((item: any) => item.status === 0);

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
                    userimage: rtInfo.userimage || merged.userimage,
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
    } catch (err) {
        console.error('获取工程技术人员信息失败', err);
    }
}

// 标记点点击事件
async function handleMarkerClick(e: any) {
    // const markerId = e.detail.markerId;
    // const markerIndex = optimizedMarkers.value.findIndex((item: any) => item.id === markerId);
    // if (markerIndex != -1) {
    //     const data = await fetchGetRealtimeTrajectoryDetailInfo({ creater: optimizedMarkers.value[markerIndex].creater, pid: optimizedMarkers.value[markerIndex].pid })
    //     optimizedMarkers.value[markerIndex].callout.content += `\n\n合同名称: ${data.contractname || ''}\n\n调度名称: ${data.dispatch || ''}\n\n调试业务名称 : ${data.debugname || ''}\n\n调试时间: ${data.dbdbtime || ''}`;
    // }
}

// 地图视野变化监听
function handleMapMove(e: any) {
    // if (e.type === 'end') {
    //     mapCtx = uni.createMapContext(mapId.value);
    //     mapCtx.getCenterLocation({
    //         success: (res) => {
    //             console.log('当前中心点:', res.latitude, res.longitude)
    //             // 可触发周边POI加载
    //         }
    //     })
    // }
}

// 返回排名数量
const getRankCount = (num: number) => {
    return num += 1
};

// 跳转
function handleJumpPageChange() {
	if (userType.value === 0 || userType.value === 4) {
		uni.switchTab({
			url: '/pages/attendance'
		})
	} else {
		uni.navigateTo({
			url: '/mePages/engineeringcenterstaffattendancestatistics/Index'
		})
	}
	// uni.switchTab({
	// 	url: '/pages/attendance'
	// })
}

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onReady(() => {
	// #ifdef APP || APP-PLUS
	uni.hideTabBar();
	// #endif
    cWidth.value = uni.upx2px(700);
    cHeight.value = uni.upx2px(500);
});

onLoad(async() => {
	getCurrentLocation();
	if (timer.value) {
		clearInterval(timer.value);
		timer.value = null;
	}
	timer.value = setInterval(() => {
		getCurrentLocation();
	}, 180000)
});

// 切换账号回到首页时刷新扫码入口可见性
// 离开首页（跳其他页面/切底部 tab/切后台）即停掉研发中心与定位轮询，回来再续——修复离开页面后仍在发请求
let homeHiddenAt = 0;
onHide(() => {
	homeHiddenAt = Date.now();
	rdHomeRef.value?.stopPolling?.();
	if (timer.value) {
		clearInterval(timer.value);
		timer.value = null;
	}
});
onShow(() => {
	canDeviceScan.value = DEVICE_SCAN_USER_IDS.includes(Number(uni.getStorageSync('userId')));
	if (homeHiddenAt) {
		// 回到首页：定位立即刷一次；研发数据离开超 30s 才重拉（短暂切走不打扰服务端）
		if (Date.now() - homeHiddenAt > 30 * 1000) {
			rdHomeRef.value?.refresh?.();
		}
		rdHomeRef.value?.startPolling?.();
		getCurrentLocation();
	}
	if (!timer.value) {
		timer.value = setInterval(() => {
			getCurrentLocation();
		}, 180000);
	}
});

onUnload(() => {
    if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
    }
})

onPullDownRefresh(async () => {
    if (scrollTop.value === 0) {
        if (currentHome.value === 1) {
            await rdHomeRef.value?.refresh();
        } else {
            getCurrentLocation();
        }
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    } else {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }
})
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<view class="page-root" :class="isDark ? 'dark' : ''" :style="{ background: isDark ? '#0F1524' : '#F4F8FF' }">
			<view class="home-nav">
				<wd-navbar :title="navbarTitle" safe-area-inset-top placeholder fixed :bordered="false" :custom-style="`background:${isDark ? '#0F1524' : '#F4F8FF'}; color:${isDark ? '#E8ECF8' : '#1F2A44'};`" />
				<view v-if="canDeviceScan" class="scan-entry" :class="{ dark: isDark }" role="button" aria-label="扫描设备条形码" @click="startDeviceScan()">
					<wd-icon name="scan" size="24px" />
				</view>
			</view>

			<!-- 顶部tabs：工程中心 / 研发中心（仅 0、4 角色显示） -->
			<view v-if="showTabs" class="home-tabs">
				<wd-tabs v-model="activeTab" animated>
					<wd-tab title="工程中心"></wd-tab>
					<wd-tab title="研发中心"></wd-tab>
				</wd-tabs>
			</view>

			<!-- 研发中心 -->
			<template v-if="currentHome === 1">
				<rd-home ref="rdHomeRef" />
			</template>

			<!-- 工程中心 -->
			<template v-else>
				<view class="page-content">

					<!-- 实时轨迹 -->
					<view class="section-header">
						<view class="section-header-left">
							<view class="section-dot"></view>
							<text class="section-title" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">实时轨迹</text>
						</view>
						<view class="section-header-right" @click="handleJumpPageChange">
							<text class="section-link">查看</text>
							<wd-icon name="enter" size="16px" color="#B9BCC3"></wd-icon>
						</view>
					</view>
			
				<!-- 今日人员统计 -->
					<view class="stat-card" :style="cardStyle">
						<view class="stat-item">
							<text class="stat-num" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">{{ model.allDataList.length }}</text>
							<text class="stat-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">总人数</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item">
							<text class="stat-num" style="color: #34C77B;">{{ model.fieldworkDataList.length }}</text>
							<text class="stat-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">外勤</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item">
							<text class="stat-num" style="color: #5B8FF9;">{{ model.companyDataList.length }}</text>
							<text class="stat-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">公司</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item">
							<text class="stat-num" style="color: #F5A623;">{{ model.unknownDataList.length }}</text>
							<text class="stat-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">未知</text>
						</view>
						<view class="stat-toggle" @click="isDetailInfo = !isDetailInfo;">
							<wd-icon :name="isDetailInfo ? 'caret-up-small' : 'caret-down-small'" size="16px" color="#B9BCC3"></wd-icon>
						</view>
					</view>

					<!-- 人员明细 -->
					<view v-if="isDetailInfo" class="detail-card" :style="cardStyle">
						<view class="detail-grid">
							<view v-for="(allItem, allIndex) in model.fieldworkDataList.concat(model.companyDataList).concat(model.unknownDataList)" :key="allIndex" class="detail-chip"
								:style="{ background: allItem.status === 1 ? 'rgba(52, 199, 123, 0.12)' : allItem.status === 2 ? 'rgba(91, 143, 249, 0.12)' : 'rgba(139, 145, 153, 0.12)', color: allItem.status === 1 ? '#1F9D63' : allItem.status === 2 ? '#3D6FE0' : '#6B7076' }">
								<wd-img :width="22" :height="22" :src="allItem.userimage || DEFAULT_AVATAR" round />
								<text class="detail-name">{{ allItem.username }}</text>
							</view>
						</view>
					</view>

					<!-- 实时地图 -->
					<view class="map-card" :style="cardStyle">
						<!-- #ifdef H5 -->
						<map :id="mapId" :latitude="centerPonit.lat" :longitude="centerPonit.lng" enable-3D enable-zoom enable-rotate
							:markers="optimizedMarkers" :polyline="optimizedPolyline" :scale="3"
							@markertap="handleMarkerClick" @regionchange="handleMapMove"
							class="home-map" />
						<!-- #endif -->
						<!-- #ifdef APP || APP-PLUS -->
						<map :id="mapId" :latitude="centerPonit.lat" :longitude="centerPonit.lng" enable-3D enable-zoom enable-rotate
							:markers="optimizedMarkers" :polyline="optimizedPolyline" :scale="3"
							@markertap="handleMarkerClick" @regionchange="handleMapMove"
							class="home-map"></map>
						<!-- #endif -->
					</view>

					<!-- 项目/合同/调试 概览 -->
					<view v-if="hasPermission('system:homePage:select')" class="mini-cards">
						<scroll-view scroll-x class="mini-cards-scroll">
							<view class="mini-cards-row">
								<view class="mini-card" :style="cardStyle">
									<view class="mini-icon" style="background: rgba(0, 85, 254, 0.10);">
										<wd-icon name="chart" size="22px" color="#0055FE"></wd-icon>
									</view>
									<view class="mini-info">
										<text class="mini-num" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">{{ projectAndContractForm.projects }}</text>
										<text class="mini-label">项目总数</text>
									</view>
								</view>
								<view class="mini-card" :style="cardStyle">
									<view class="mini-icon" style="background: rgba(91, 143, 249, 0.10);">
										<wd-icon name="list" size="22px" color="#5B8FF9"></wd-icon>
									</view>
									<view class="mini-info">
										<text class="mini-num" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">{{ projectAndContractForm.contracts }}</text>
										<text class="mini-label">合同总数</text>
									</view>
								</view>
								<view class="mini-card" :style="cardStyle">
									<view class="mini-icon" style="background: rgba(245, 166, 35, 0.12);">
										<wd-icon name="setting" size="22px" color="#F5A623"></wd-icon>
									</view>
									<view class="mini-info">
										<text class="mini-num" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">{{ projectAndContractForm.debugs }}</text>
										<text class="mini-label">调试总数</text>
									</view>
								</view>
							</view>
						</scroll-view>
					</view>

				<!-- 项目分析 -->
					<view class="chart-card" :style="cardStyle" v-if="hasPermission('project:Debug:homePage:select')">
						<view class="chart-card-header">
							<wd-radio-group size="small" v-model="prjType" shape="button" @change="handlePrjTypeChange">
								<wd-radio :value="1">日</wd-radio>
								<wd-radio :value="2">月</wd-radio>
								<wd-radio :value="3">年</wd-radio>
								<wd-radio :value="4">累计</wd-radio>
							</wd-radio-group>
							<view class="chart-picker">
								<wd-datetime-picker v-if="prjType === 1" type="date" :max-date="maxDateTs" v-model="selectPrjDate" @confirm="handlePrjDateChange" />
								<wd-datetime-picker v-if="prjType === 2" type="year-month" :max-date="maxDateTs" v-model="selectPrjMonth" @confirm="handlePrjYearMonthChange" />
								<wd-datetime-picker v-if="prjType === 3" type="year" :max-date="maxDateTs" v-model="selectPrjYear" @confirm="handlePrjYearChange" />
							</view>
						</view>

						<view class="chart-canvas">
							<canvas canvas-id="prjCanvas" id="prjCanvas" class="charts" @touchend="tap"></canvas>
						</view>

						<view class="legend-grid">
							<view class="legend-item">
								<text class="legend-num" style="color: #FFA500;">{{ projectAndContractForm.projectn1 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">未核准</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">{{ projectAndContractForm.project0 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">未开始</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #0055FE;">{{ projectAndContractForm.project1 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">进行中</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #F5A623;">{{ projectAndContractForm.project2 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">待审核</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #34C77B;">{{ projectAndContractForm.project3 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">已完成</text>
							</view>
						</view>

						<view class="chart-divider"></view>

						<view class="chart-canvas">
							<canvas canvas-id="prjStatusCanvas" id="prjStatusCanvas" class="charts" @touchend="tap"></canvas>
						</view>

						<view class="legend-grid">
							<view class="legend-item">
								<text class="legend-num" style="color: #0055FE;">{{ projectAndContractForm.protype0 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">正常</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #F5A623;">{{ projectAndContractForm.protype1 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">延期</text>
							</view>
						</view>

						<view class="chart-divider"></view>

						<view class="chart-canvas">
							<canvas canvas-id="prjTypeCanvas" id="prjTypeCanvas" class="charts"></canvas>
						</view>

						<view class="legend-grid">
							<view class="legend-item">
								<text class="legend-num" style="color: #5B8FF9;">{{ projectAndContractForm.ptype0 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">现场调试</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #F5A623;">{{ projectAndContractForm.ptype1 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">远程调试</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #34C77B;">{{ projectAndContractForm.ptype2 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">无需调试</text>
							</view>
						</view>
					</view>
				
				<!-- 调试分析 -->
					<view class="chart-card" :style="cardStyle" v-if="hasPermission('project:Debug:homePage:select')">
						<view class="chart-card-header">
							<wd-radio-group size="small" v-model="debugType" shape="button" @change="handleDebugTypeChange">
								<wd-radio :value="1">日</wd-radio>
								<wd-radio :value="2">月</wd-radio>
								<wd-radio :value="3">年</wd-radio>
								<wd-radio :value="4">累计</wd-radio>
							</wd-radio-group>
							<view class="chart-picker">
								<wd-datetime-picker v-if="debugType === 1" type="date" :max-date="maxDateTs" v-model="selectDebugDate" @confirm="handleDebugDateChange" />
								<wd-datetime-picker v-if="debugType === 2" type="year-month" :max-date="maxDateTs" v-model="selectDebugMonth" @confirm="handleDebugYearMonthChange" />
								<wd-datetime-picker v-if="debugType === 3" type="year" :max-date="maxDateTs" v-model="selectDebugYear" @confirm="handleDebugYearChange" />
							</view>
						</view>

						<view class="chart-canvas">
							<canvas canvas-id="debugCanvas" id="debugCanvas" class="charts"></canvas>
						</view>

						<view class="legend-grid">
							<view class="legend-item">
								<text class="legend-num" style="color: #FFA500;">{{ projectAndContractForm.debugn1 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">申请中</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">{{ projectAndContractForm.debug0 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">待调试</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #0055FE;">{{ projectAndContractForm.debug1 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">调试中</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #F5A623;">{{ projectAndContractForm.debug2 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">待审核</text>
							</view>
							<view class="legend-item">
								<text class="legend-num" style="color: #34C77B;">{{ projectAndContractForm.debug3 }}</text>
								<text class="legend-label" :style="{ color: isDark ? '#8A9099' : '#8A9099' }">审核完成</text>
							</view>
						</view>
					</view>
			</view>

			<view class="rank-header">
				<view class="rank-header-title" v-if="hasPermission('system:homePage:select')">
					<view class="section-dot"></view>
					<text class="section-title" :style="{ color: isDark ? '#E8ECF8' : '#1F2A44' }">项目调试积分排行榜</text>
				</view>
				
				<view class="rank-actions">
					<wd-checkbox shape="square" v-model="memberType">查看分组</wd-checkbox>
				</view>
			</view>

			<view class="rank-filter" :style="cardStyle">
				<wd-radio-group size="small" v-model="prjDebugType" shape="button" @change="handlePrjDebugTypeChange">
					<wd-radio :value="1">日</wd-radio>
					<wd-radio :value="2">月</wd-radio>
					<wd-radio :value="3">年</wd-radio>
					<wd-radio :value="4">累计</wd-radio>
				</wd-radio-group>

				<view class="chart-picker">
					<wd-datetime-picker v-if="prjDebugType === 1" type="date" :max-date="maxDateTs" v-model="selectPrjDebugDate" @confirm="handlePrjDebugDateChange" />
					<wd-datetime-picker v-if="prjDebugType === 2" type="year-month" :max-date="maxDateTs" v-model="selectPrjDebugMonth" @confirm="handlePrjDebugYearMonthChange" />
					<wd-datetime-picker v-if="prjDebugType === 3" type="year" :max-date="maxDateTs" v-model="selectPrjDebugYear" @confirm="handlePrjDebugYearChange" />
				</view>
			</view>

			<view v-if="!memberType">
				<view v-if="rankList.length > 0 && hasPermission('system:homePage:select')" class="rank-card" :style="cardStyle">
					<!-- <wd-table :data="rankList" @sort-method="handleSortChange">
						<wd-table-col prop="username" label="用户名" :width="95" fixed>
							<template #value="{row, index}">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view :style="{ width: '50rpx', height: '50rpx', background: index === 0 ? '#FFAE00' : index === 1 ? '#A1A1A1' : index === 2 ? '#CD7F32' : '#DCDFDC', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10rpx' }">{{ getRankCount(index) }}</view>
									<view>{{ row.username }}</view>
								</view>
							</template>
						</wd-table-col>
						<wd-table-col prop="debugs" label="调试任务权重" sortable align="center" :width="120"></wd-table-col>
						<wd-table-col prop="totalscore" label="行为规范权重" sortable align="center" :width="120"></wd-table-col>
						<wd-table-col prop="totalCount" label="总计" sortable align="center"></wd-table-col>
					</wd-table> -->
					<wd-table :data="rankList" @sort-method="handleSortChange" v-if="userType === 3 && prjDebugType === 1">
						<wd-table-col prop="username" label="排名" align="center" :width="50" fixed>
							<template #value="{ index }">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view :style="{ width: '50rpx', height: '50rpx', color: index < 3 ? '#fff' : '#000000', background: index === 0 ? '#FFAE00' : index === 1 ? '#A1A1A1' : index === 2 ? '#CD7F32' : '#DCDFE6', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10rpx' }">{{ getRankCount(index) }}</view>
								</view>
							</template>
						</wd-table-col>
						<wd-table-col prop="username" label="调试人" align="center" fixed>
							<template #value="{row}">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view>{{ row.username }}</view>
								</view>
							</template>
						</wd-table-col>
						<!-- <wd-table-col prop="username" label="用户名" width="33%" fixed>
							<template #value="{row, index}">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view :style="{ width: '50rpx', height: '50rpx', background: index === 0 ? '#FFAE00' : index === 1 ? '#A1A1A1' : index === 2 ? '#CD7F32' : '#DCDFDC', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10rpx' }">{{ getRankCount(index) }}</view>
									<wd-img :width="30" :height="30" :src="row.userimage" :preview-src="row.userimage" :enable-preview="true" round />
									<view>{{ row.username }}</view>
								</view>
							</template>
						</wd-table-col> -->
						<wd-table-col prop="debugs" label="调试积分" sortable align="center" width="33%"></wd-table-col>
						<wd-table-col prop="totalCount" label="总得分" sortable align="center" width="33%"></wd-table-col>
					</wd-table>
				
					<wd-table :data="rankList" @sort-method="handleSortChange" v-else>
						<wd-table-col prop="username" label="排名" align="center" :width="50" fixed>
							<template #value="{ index }">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view :style="{ width: '50rpx', height: '50rpx', color: index < 3 ? '#fff' : '#000000', background: index === 0 ? '#FFAE00' : index === 1 ? '#A1A1A1' : index === 2 ? '#CD7F32' : '#DCDFE6', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10rpx' }">{{ getRankCount(index) }}</view>
								</view>
							</template>
						</wd-table-col>
						<wd-table-col prop="username" label="调试人" align="center" :width="100" fixed>
							<template #value="{row}">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view>{{ row.username }}</view>
								</view>
							</template>
						</wd-table-col>
						<!-- <wd-table-col prop="username" label="用户名" :width="95" fixed>
							<template #value="{row, index}">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view :style="{ width: '50rpx', height: '50rpx', background: index === 0 ? '#FFAE00' : index === 1 ? '#A1A1A1' : index === 2 ? '#CD7F32' : '#DCDFDC', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10rpx' }">{{ getRankCount(index) }}</view>
									<wd-img :width="30" :height="30" :src="row.userimage" :preview-src="row.userimage" :enable-preview="true" round />
									<view>{{ row.username }}</view>
								</view>
							</template>
						</wd-table-col> -->
						<wd-table-col prop="debugs" label="调试积分" sortable align="center" :width="100"></wd-table-col>
						<wd-table-col prop="totalscore" label="行为得分" sortable align="center" :width="100"></wd-table-col>
						<wd-table-col prop="totalCount" label="总得分" sortable align="center"></wd-table-col>
					</wd-table>
					<!-- <wd-cell-group>
						<wd-cell v-for="(rankItem, rankIndex) in rankList" :key="rankIndex" :value="rankItem.debugs">
							<template #title>
								<view style="display: flex; align-items: center;">
									<view :style="{ width: '50rpx', height: '50rpx', background: rankIndex === 0 ? '#FFAE00' : rankIndex === 1 ? '#A1A1A1' : rankIndex === 2 ? '#CD7F32' : '#DCDFDC', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10rpx' }">{{ getRankCount(rankIndex) }}</view>
									<view>{{ rankItem.username }}</view>
								</view>
							</template>
						</wd-cell>
					</wd-cell-group> -->
				</view>
				
				<view v-if="rankList.length === 0 && hasPermission('system:homePage:select')" class="rank-empty" :style="cardStyle">
					<wd-status-tip image="../static/search.png" tip="暂无项目调试积分排行榜信息" />
				</view>
			</view>
			
			<view v-else>
				<view v-if="teamRankList.length > 0 && hasPermission('system:homePage:select')" class="rank-card" :style="cardStyle">
					<wd-table :data="teamRankList" @sort-method="handleGroupSortChange">
						<wd-table-col prop="username" label="排名" align="center" :width="50" fixed>
							<template #value="{ index }">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view :style="{ width: '50rpx', height: '50rpx', color: index < 3 ? '#fff' : '#000000', background: index === 0 ? '#FFAE00' : index === 1 ? '#A1A1A1' : index === 2 ? '#CD7F32' : '#DCDFE6', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10rpx' }">{{ getRankCount(index) }}</view>
								</view>
							</template>
						</wd-table-col>
						<wd-table-col prop="username" label="调试小组" align="center" :width="80" fixed>
							<template #value="{row}">
								<view style="display: flex; justify-content: flex-start; align-items: center;">
									<view>{{ row.tname }}</view>
								</view>
							</template>
						</wd-table-col>
						<wd-table-col prop="leadername" label="组长" align="center" :width="70"></wd-table-col>
						<wd-table-col prop="debugs" label="调试积分" sortable align="center" :width="100"></wd-table-col>
						<wd-table-col prop="totalScore" label="总得分" sortable align="center"></wd-table-col>
					</wd-table>
					<!-- <wd-cell-group>
						<wd-cell v-for="(rankItem, rankIndex) in rankList" :key="rankIndex" :value="rankItem.debugs">
							<template #title>
								<view style="display: flex; align-items: center;">
									<view :style="{ width: '50rpx', height: '50rpx', background: rankIndex === 0 ? '#FFAE00' : rankIndex === 1 ? '#A1A1A1' : rankIndex === 2 ? '#CD7F32' : '#DCDFDC', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10rpx' }">{{ getRankCount(rankIndex) }}</view>
									<view>{{ rankItem.username }}</view>
								</view>
							</template>
						</wd-cell>
					</wd-cell-group> -->
				</view>
				
				<view v-if="teamRankList.length === 0 && hasPermission('system:homePage:select')" class="rank-empty" :style="cardStyle">
					<wd-status-tip image="../static/search.png" tip="暂无项目调试积分排行榜信息" />
				</view>
			</view>
			
			</template>

			<wd-backtop :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
			
			<wd-tabbar shape="round" model-value="index" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
				<wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
			</wd-tabbar>
		</view>
	</wd-config-provider>
</template>

<style lang="scss" scoped>
.scan-entry {
	position: fixed;
	z-index: 600;
	top: var(--status-bar-height);
	right: 0;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	height: 44px;
	padding: 0 24rpx;
	color: #0055FE;
	font-size: 26rpx;
	white-space: nowrap;
}
.scan-entry.dark {
	color: #69B1FF;
}
:deep(.wd-radio) {
    margin-right: 0 !important;
}

:deep(.wd-radio.is-button .wd-radio__label) {
    width: 40px !important;
    height: 30px !important;
    line-height: 30px !important;
    padding: 0 !important;
    border-radius: 999rpx !important;
    min-width: 40px !important;
    margin: 0 3px !important;
}

:deep(.wd-radio-group) {
    background-color: transparent !important;
}

/* 顶部tabs */
.home-tabs {
    padding: 8rpx 24rpx 0;
}

.home-tabs :deep(.wd-tabs),
.home-tabs :deep(.wd-tabs__nav),
.home-tabs :deep(.wd-tabs__nav--wrap) {
    background: transparent;
}

/* 工程中心内容 */
.page-content {
    padding: 0 24rpx 24rpx;
}

/* 区块标题 */
.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 4rpx 20rpx;
}

.section-header-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.section-dot {
    width: 10rpx;
    height: 28rpx;
    border-radius: 6rpx;
    background: linear-gradient(180deg, #5B9BFF, #2E6BFF);
    box-shadow: 0 4rpx 10rpx rgba(46, 107, 255, 0.35);
    flex-shrink: 0;
}

.section-title {
    font-size: 32rpx;
    font-weight: 600;
    line-height: 1;
}

.section-header-right {
    display: flex;
    align-items: center;
    gap: 4rpx;
}

.section-link {
    font-size: 26rpx;
    color: #B9BCC3;
}

/* 今日人员统计 */
.stat-card {
    display: flex;
    align-items: center;
    border-radius: 28rpx;
    padding: 30rpx 16rpx 30rpx 8rpx;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
}

.stat-num {
    font-size: 40rpx;
    font-weight: 700;
    line-height: 1.2;
}

.stat-label {
    font-size: 24rpx;
    color: #8A9099;
}

.stat-divider {
    width: 2rpx;
    height: 40rpx;
    background: #EEF0F3;
    flex-shrink: 0;
}

.stat-toggle {
    width: 48rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 人员明细 */
.detail-card {
    border-radius: 28rpx;
    padding: 24rpx;
    margin-top: 20rpx;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.detail-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.detail-chip {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 20rpx;
    border-radius: 30rpx;
    font-size: 26rpx;
}

.detail-name {
    max-width: 160rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 实时地图 */
.map-card {
    border-radius: 28rpx;
    overflow: hidden;
    margin-top: 20rpx;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.home-map {
    width: 100%;
    height: 560rpx;
}

/* 项目/合同/调试 概览 */
.mini-cards {
    margin-top: 20rpx;
}

.mini-cards-scroll {
    width: 100%;
}

.mini-cards-row {
    display: flex;
    gap: 16rpx;
}

.mini-card {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    border-radius: 20rpx;
    padding: 20rpx 12rpx;
}

.mini-icon {
    width: 56rpx;
    height: 56rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12rpx;
    flex-shrink: 0;
}

.mini-info {
    display: flex;
    flex-direction: column;
    gap: 2rpx;
    overflow: hidden;
}

.mini-num {
    font-size: 32rpx;
    font-weight: 700;
    line-height: 1.2;
}

.mini-label {
    font-size: 22rpx;
    color: #8A9099;
}

/* 图表卡片（项目分析 / 调试分析） */
.chart-card {
    border-radius: 28rpx;
    padding: 28rpx 28rpx 32rpx;
    margin-top: 20rpx;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.chart-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8rpx;
}

.chart-picker {
    display: flex;
    align-items: center;
}

.chart-canvas {
    padding: 16rpx 0;
}

.chart-divider {
    height: 2rpx;
    background: #EEF0F3;
    margin: 4rpx 0;
}

.legend-grid {
    display: flex;
}

.legend-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
}

.legend-num {
    font-size: 32rpx;
    font-weight: 700;
    line-height: 1.2;
}

.legend-label {
    font-size: 24rpx;
    color: #8A9099;
}

/* 项目调试积分排行榜 */
.rank-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 24rpx;
    padding: 32rpx 4rpx 20rpx;
}

.rank-header-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.rank-actions {
    display: flex;
    align-items: center;
}

.rank-filter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 24rpx 20rpx;
    border-radius: 28rpx;
    padding: 20rpx 24rpx;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.rank-card {
    margin: 0 24rpx 24rpx;
    border-radius: 28rpx;
    overflow: hidden;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.rank-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 24rpx 24rpx;
    padding: 40rpx 0;
    border-radius: 28rpx;
    box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.charts {
    width: 100%;
    height: 500rpx;
}

/* 暗色卡片描边 */
.page-root.dark .stat-card,
.page-root.dark .detail-card,
.page-root.dark .map-card,
.page-root.dark .mini-card,
.page-root.dark .chart-card,
.page-root.dark .rank-filter,
.page-root.dark .rank-card,
.page-root.dark .rank-empty {
    border: 1rpx solid rgba(255, 255, 255, 0.04);
    box-shadow: none;
}
</style>
