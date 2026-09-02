<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue';
import uCharts from '@/utils/u-charts.js';
import { getSystemDate, hasPermission, generateHexColors } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { noRoundDivide } from '@/utils/index';
import { useTabbar } from '@/composables/useTabbar';
import { fetchGetSystemHomePageInfo, fetchGetDebugHomePageInfo, fetchGetRealtimeTrajectoryInfo, fetchGetAllUserDataList, fetchGetRealtimeTrajectoryDetailInfo } from '@/service/index';

const { theme, themeVars } = useTheme();

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

const isDark = computed(() => theme.value === 'dark');

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

const isDetailInfo = ref<boolean>(false);
const scrollTop = ref<number>(0);
const prjType = ref<number>(4);
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
const allUserDataList = ref<any>([]);
const rankList = ref<any>([]);
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
                    // iconPath: item.userimage || '/static/marker.png',
                    // width: item.userimage ? 40 : 24,
                    // height: item.userimage ? 40 : 24,
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
                        padding: 5,
                        borderRadius: 5,
						color: '#000000'
                        // bgColor: '#FFFFFF',
                        // color: colorsArr.value[index]
                    }
                })
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
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2,3' });
        allUserDataList.value = data.list.filter((item: any) => item.status !== 1);
        allUserDataList.value.forEach((item: any) => {
            userIdNameObj.value[String(item.id)] = {
                username: item.username,
                userimage: item.userimage || 'https://dingiiot.com/dingiiotTest/static/soybean.jpg'
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
	uni.hideTabBar();
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

onUnload(() => {
    if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
    }
})

onPullDownRefresh(async () => {
    if (scrollTop.value === 0) {
		getCurrentLocation();
        setTimeout(() => {
            uni.hideNavigationBarLoading(); // 完成停止加载
            uni.stopPullDownRefresh();
        }, 1000);
    } else {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }
})
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh"  :theme="theme">
		<view>
			<wd-navbar title="首页" safe-area-inset-top placeholder fixed :bordered="false" />
			
			<wd-gap :bg-color="isDark ? '#000000' : '#F8F9Fa'" height="20rpx" />
			
			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10rpx 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">实时轨迹</view>
				</view>
				<view @click="handleJumpPageChange">
					<wd-icon name="enter" size="22px"></wd-icon>
				</view>
				<!-- <view v-if="userType === 0 || userType === 4" @click="handleJumpPageChange">
					<wd-icon name="enter" size="22px"></wd-icon>
				</view> -->
			</view>
			
			<view :style="{ margin: '10rpx', padding: '10rpx 20rpx', fontSize: '28rpx', fontWeight: 'bolder', background: isDark ? '#323232' : '#FFFFFF', borderRadius: '20rpx', width: 'calc(100% - 60rpx)', marginBottom: '20rpx', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
				<view :style="{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }">
					<view>共</view>
					<view style="color: #1890FF; font-size: 40rpx; margin: 0 10rpx;">{{ model.allDataList.length }}</view>
					<view> 人 今日外勤人数</view>
					<view style="color: #52C41A; font-size: 40rpx; margin: 0 10rpx;">{{ model.fieldworkDataList.length }}</view>
					<view> 人 公司人数 </view>
					<view style="color: #FAAD14; font-size: 40rpx; margin: 0 10rpx;">{{ model.companyDataList.length }}</view>
					<view>人 未知 </view>
					<view style="color: #8A8886; font-size: 40rpx; margin: 0 10rpx;">{{ model.unknownDataList.length }}</view>
					<view>人</view>
				</view>
				<view @click="isDetailInfo = !isDetailInfo;">
					<wd-icon :name="isDetailInfo ? 'caret-up-small' : 'caret-down-small'" size="22px"></wd-icon>
				</view>
			</view>
			
			<view v-if="isDetailInfo" :style="{ background: isDark ? '#323232' : '#FFFFFF', margin: '0 20rpx 20rpx', width: 'calc(100% - 40rpx)', borderRadius: '20rpx' }">
				<wd-row :gutter="10">
					<wd-col :span="6" v-for="(allItem, allIndex) in model.fieldworkDataList.concat(model.companyDataList).concat(model.unknownDataList)" :key="allIndex">
						<view :style="{ background: allItem.status === 1 ? '#53C41A6B' : '#8A88864F', width: '100%', height: '60rpx', lineHeight: '60rpx', fontWeight: 'bolder', textAlign: 'center', margin: '10rpx 0', borderRadius: '40rpx' }">
							{{ allItem.username }}
						</view>
					</wd-col>
				</wd-row>
			</view>
			
			<!-- #ifdef H5 -->
			<map :id="mapId" :latitude="centerPonit.lat" :longitude="centerPonit.lng" enable-3D enable-zoom enable-rotate
				:markers="optimizedMarkers" :polyline="optimizedPolyline" :scale="3"
				@markertap="handleMarkerClick" @regionchange="handleMapMove"
				style="width: 100%; height: 600rpx" />
			<!-- #endif -->
			
			<!-- #ifdef APP || APP-PLUS -->
			<map :id="mapId" :latitude="centerPonit.lat" :longitude="centerPonit.lng" enable-3D enable-zoom enable-rotate
				:markers="optimizedMarkers" :polyline="optimizedPolyline" :scale="3"
				@markertap="handleMarkerClick" @regionchange="handleMapMove"
				style="width: 100%; height: 600rpx;"></map>
			<!-- #endif -->
			
			<wd-gap :bg-color="isDark ? '#000000' : '#F8F9Fa'" height="20rpx" />

			<view style="padding: 0 20rpx;" v-if="hasPermission('system:homePage:select')">
				<scroll-view scroll-x>
					<view style="display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; gap: 20rpx;">
						<wd-card title="项目总数" custom-class="customCardWrap">
							<view style="display: flex; align-items: center; justify-content: space-between; width: 360rpx;">
								<wd-icon name="chart" size="22px"></wd-icon>
								<wd-text bold :text="projectAndContractForm.projects" size="16px" :color="isDark ? '#ffffff' : '#000000'" />
							</view>
						</wd-card>
						<wd-card title="合同总数" custom-class="customCardWrap1">
							<view style="display: flex; align-items: center; justify-content: space-between; width: 360rpx;">
								<wd-icon name="chart" size="22px"></wd-icon>
								<wd-text bold :text="projectAndContractForm.contracts" size="16px" :color="isDark ? '#ffffff' : '#000000'" />
							</view>
						</wd-card>
						<wd-card title="调试总数" custom-class="customCardWrap2">
							<view style="display: flex; align-items: center; justify-content: space-between; width: 360rpx; padding-right: 10rpx;">
								<wd-icon name="chart" size="22px"></wd-icon>
								<wd-text bold :text="projectAndContractForm.debugs" size="16px" :color="isDark ? '#ffffff' : '#000000'" />
							</view>
						</wd-card>
					</view>
				</scroll-view>
			</view>

			<view :style="{ background: isDark ? '#000000' : '#F8F9Fa' }" v-if="hasPermission('project:Debug:homePage:select') || hasPermission('project:Debug:homePage:select')">
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx 20rpx', width: 'calc(100vw - 40rpx)', borderRadius: '20rpx', overflow: 'hidden' }" v-if="hasPermission('project:Debug:homePage:select')">
					<view class="canvasHeader" :style="{ padding: '20rpx', width: 'calc(100vw - 40rpx)', background: isDark ? '#000000' : '#ffffff' }">
						<wd-radio-group size="small" v-model="prjType" shape="button" @change="handlePrjTypeChange">
							<wd-radio :value="1">日</wd-radio>
							<wd-radio :value="2">月</wd-radio>
							<wd-radio :value="3">年</wd-radio>
							<wd-radio :value="4">累计</wd-radio>
						</wd-radio-group>

						<wd-datetime-picker v-if="prjType === 1" type="date" v-model="selectPrjDate" @confirm="handlePrjDateChange" />
						<wd-datetime-picker v-if="prjType === 2" type="year-month" v-model="selectPrjMonth" @confirm="handlePrjYearMonthChange" />
						<wd-datetime-picker v-if="prjType === 3" type="year" v-model="selectPrjYear" @confirm="handlePrjYearChange" />
					</view>

					<view style="padding: 30rpx 10rpx;">
						<canvas canvas-id="prjCanvas" id="prjCanvas" class="charts" @touchend="tap"></canvas>
					</view>

					<wd-row :gutter="20" custom-class="prjRowClass">
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.projectn1" size="16px" color="#FFA500" />
								<wd-text text="未核准" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.project0" size="16px" />
								<wd-text text="未开始" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.project1" size="16px" type="primary" />
								<wd-text text="进行中" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.project2" size="16px" type="warning" />
								<wd-text text="待审核" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.project3" size="16px" type="success" />
								<wd-text text="已完成" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
					</wd-row>

					<wd-gap bg-color="#cccccc" height="2rpx" />

					<view style="padding: 30rpx 10rpx;">
						<canvas canvas-id="prjStatusCanvas" id="prjStatusCanvas" class="charts" @touchend="tap"></canvas>
					</view>

					<wd-row :gutter="20" custom-class="prjRowClass">
						<wd-col :span="12">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.protype0" size="16px" type="primary" />
								<wd-text text="正常" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="12">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.protype1" size="16px" type="warning" />
								<wd-text text="延期" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<!-- <wd-col :span="8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.protype2" size="16px" type="error" />
								<wd-text text="作废" size="14px" color="#C0C0C0" />
							</view>
						</wd-col> -->
					</wd-row>

					<wd-gap bg-color="#cccccc" height="2rpx" />

					<view style="padding: 30rpx 10rpx;">
						<canvas canvas-id="prjTypeCanvas" id="prjTypeCanvas" class="charts"></canvas>
					</view>

					<wd-row :gutter="20" custom-class="prjRowClass">
						<wd-col :span="8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.ptype0" size="16px" color="#409EFF" />
								<wd-text text="现场调试" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.ptype1" size="16px" color="#FF9F43" />
								<wd-text text="远程调试" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.ptype2" size="16px" color="#00C9A7" />
								<wd-text text="无需调试" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
					</wd-row>
				</view>
				
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx 40rpx', width: 'calc(100vw - 40rpx)', borderRadius: '20rpx', overflow: 'hidden' }" v-if="hasPermission('project:Debug:homePage:select')">
					<view class="canvasHeader" :style="{ padding: '20rpx', width: 'calc(100vw - 40rpx)', background: isDark ? '#000000' : '#ffffff' }">
						<wd-radio-group size="small" v-model="debugType" shape="button" @change="handleDebugTypeChange">
							<wd-radio :value="1">日</wd-radio>
							<wd-radio :value="2">月</wd-radio>
							<wd-radio :value="3">年</wd-radio>
							<wd-radio :value="4">累计</wd-radio>
						</wd-radio-group>

						<wd-datetime-picker v-if="debugType === 1" type="date" v-model="selectDebugDate" @confirm="handleDebugDateChange" />
						<wd-datetime-picker v-if="debugType === 2" type="year-month" v-model="selectDebugMonth" @confirm="handleDebugYearMonthChange" />
						<wd-datetime-picker v-if="debugType === 3" type="year" v-model="selectDebugYear" @confirm="handleDebugYearChange" />
					</view>

					<view style="padding: 30rpx 10rpx;">
						<canvas canvas-id="debugCanvas" id="debugCanvas" class="charts"></canvas>
					</view>

					<wd-row :gutter="20" custom-class="prjRowClass">
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.debugn1" size="16px" color="#FFA500" />
								<wd-text text="申请中 " size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.debug0" size="16px" />
								<wd-text text="待调试 " size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.debug1" size="16px" type="primary" />
								<wd-text text="调试中" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.debug2" size="16px" type="warning" />
								<wd-text text="待审核" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
						<wd-col :span="4.8">
							<view style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10rpx;">
								<wd-text bold :text="projectAndContractForm.debug3" size="16px" type="success" />
								<wd-text text="审核完成" size="14px" color="#C0C0C0" />
							</view>
						</wd-col>
					</wd-row>
				</view>
			</view>

			<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 0 0 20rpx 20rpx;" v-if="hasPermission('system:homePage:select')">
				<view style="width: 5px; height: 15px; background: #0055FE;"></view>
				<view style="margin-left: 10rpx; font-weight: bolder;">项目调试积分排行榜</view>
			</view>

			<view class="canvasHeader" :style="{ margin: '0 20rpx 10rpx', padding: '0 0 0 20rpx', width: 'calc(100vw - 60rpx)', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-radio-group size="small" v-model="prjDebugType" shape="button" @change="handlePrjDebugTypeChange">
					<wd-radio :value="1">日</wd-radio>
					<wd-radio :value="2">月</wd-radio>
					<wd-radio :value="3">年</wd-radio>
					<wd-radio :value="4">累计</wd-radio>
				</wd-radio-group>

				<wd-datetime-picker v-if="prjDebugType === 1" type="date" v-model="selectPrjDebugDate" @confirm="handlePrjDebugDateChange" />
				<wd-datetime-picker v-if="prjDebugType === 2" type="year-month" v-model="selectPrjDebugMonth" @confirm="handlePrjDebugYearMonthChange" />
				<wd-datetime-picker v-if="prjDebugType === 3" type="year" v-model="selectPrjDebugYear" @confirm="handlePrjDebugYearChange" />
			</view>

			<view v-if="rankList.length > 0 && hasPermission('system:homePage:select')" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', borderRadius: '20rpx', overflow: 'hidden', marginLeft: '20rpx', marginBottom: '40rpx' }">
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

			<view v-if="rankList.length === 0 && hasPermission('system:homePage:select')" :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 40rpx 20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../static/search.png" tip="暂无项目调试积分排行榜信息" />
			</view>

			<wd-backtop :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
			
			<wd-tabbar shape="round" model-value="index" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
				<wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
			</wd-tabbar>
		</view>
	</wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.wd-radio) {
    margin-right: 0 !important;
}

:deep(.wd-radio.is-button .wd-radio__label) {
    width: 40px !important;
    height: 30px !important;
    line-height: 30px !important;
    padding: 0 !important;
    border-radius: 0 !important;
    min-width: 40px !important;
    margin: 0 !important;
}

:deep(.wd-radio-group) {
    background-color: v-bind("isDark ? '#000000' : '#ffffff'") !important;
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
        margin-left: 20rpx;
        width: calc(100vw - 100px);
    }
}

.customCell {
    padding: 0 !important;

    :deep(.wd-cell__wrapper) {
        padding: 5rpx 0 !important;
    }
}

:deep(.wd-progress__outer) {
    height: 7px !important;
    border-radius: 10px !important;
}

:deep(.wd-progress__inner) {
    border-radius: 10px !important;
}

:deep(.prjRowClass) {
    padding-bottom: 20rpx;
}

:deep(.wd-circle__text) {
    z-index: 0 !important;
}

:deep(.customCardWrap),
:deep(.customCardWrap1),
:deep(.customCardWrap2) {
    padding: 0 20rpx !important;
    margin: 0 !important;
    margin-bottom: 20rpx !important;
}

.customCardWrap {
    background: linear-gradient(to bottom right, #ec4786, #b955a4) !important;
}

.customCardWrap1 {
    background: linear-gradient(to bottom right, #865ec0, #5144b4) !important;
}

.customCardWrap2 {
    background: linear-gradient(to bottom right, #56cdf3, #719de3) !important;
}

.charts {
    width: 100%;
    height: 500rpx;
}

.canvasHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cellClass {
    padding-left: 15rpx !important;

    :deep(.wd-cell__wrapper) {
        padding: 0 !important;
    }
}

:deep(.wd-cell__value) {
    font-weight: bolder !important;
}

:deep(.wd-sort-button__right) {
    font-size: 34rpx !important;
}
</style>
