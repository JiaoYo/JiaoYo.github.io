<script setup lang="ts">
import { useTheme } from '@/composables/theme/theme';
import { hasPermission, getCenterPoint, generateHexColors, getSphericalCenter } from '@/utils/index'
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { onReady, onLoad, onShow, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { fetchGetRealtimeTrajectoryInfo, fetchGetRealtimeTrajectoryDetailInfo, fetchGetSystemReportDataList } from '@/service/index';

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const mapId = ref<string>('myMap');

// 为不同的pid生成颜色
const pidColors = ref<Record<number, string>>({});

const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const model = reactive<{
    pid: number;
    startTime: string;
    endTime: string;
    creator: any;
    username: string;
    type: number;
    projectName: string;
    address: string;
    duration: number;
    status: number;
    dailyReport: number;
}>({
    pid: 0,
    startTime: '',
    endTime: '',
    creator: '',
    username: '',
    type: 1,
    projectName: '',
    address: '',
    duration: 0,
    status: 0,
    dailyReport: 0
})

let mapCtx: UniApp.MapContext;

const centerPonit = ref<{
    lat: number;
    lng: number;
}>({
    lat: 0,
    lng: 0
});

// 地图渲染数据
const optimizedMarkers = ref<any[]>([])
const optimizedPolyline = ref<any[]>([])

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 按pid分组的数据
const groupedData = computed(() => {
    const groups: Record<number, any[]> = {};

    dataList.value.forEach(item => {
        if (!groups[item.pid]) {
            groups[item.pid] = [];
        }
        groups[item.pid].push(item);
    });

    return groups;
});

// 初始化pid颜色
function initPidColors() {
    const pids = Object.keys(groupedData.value).map(pid => parseInt(pid));
    const colors = generateHexColors(pids.length);

    pids.forEach((pid, index) => {
        pidColors.value[pid] = colors[index];
    });
}

// Tabs切换
function handleTabsChange(value: any) {
    if (value.value === 2) {
        getMemberRealtimeInfo();
    }
}

// 线段中点
function getMidPoint(lat1: number, lng1: number, lat2: number, lng2: number) {
    return { latitude: (lat1 + lat2) / 2, longitude: (lng1 + lng2) / 2 };
}

// 获取人员实时位置
async function getMemberRealtimeInfo() {
    try {
		let clongitude = 0;
		let clatitude = 0;
        optimizedMarkers.value = [];
        optimizedPolyline.value = [];

        // 初始化pid颜色
        initPidColors();

        dataList.value.forEach((item: any, index: number) => {
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
                label: {
                    content: model.username,
                    borderRadius: 5,
                    bgColor: '#FFFFFF',
                    color: pidColors.value[item.pid] || '#000000'
                }
            })
        });

         // 为每个pid创建一条折线
        Object.keys(groupedData.value).forEach(pid => {
            const pidNum = parseInt(pid);
            const groupData = groupedData.value[pidNum];

            if (groupData && groupData.length > 0) {
				clongitude = groupData[0].clongitude;
				clatitude = groupData[0].clatitude;
				
                optimizedPolyline.value.push({
                    points: groupData.map(item => ({
                        latitude: item.latitude,
                        longitude: item.longitude
                    })),
                    color: pidColors.value[pidNum] + 'DD',  // 添加透明度
                    width: 4,
                    dottedLine: false,
                    arrowLine: true
                });
				
				groupData.forEach(groupItem => {
					// d) 虚线中点 label (透明 marker)
					const mid = getMidPoint(groupItem.latitude, groupItem.longitude, clatitude, clongitude);
					optimizedMarkers.value.push({
						id: groupItem.id,
						latitude: mid.latitude,
						longitude: mid.longitude,
						iconPath: "/static/marker.png", // 透明图片
						width: 1,
						height: 1,
						label: {
							content: groupItem.distanse + '米',
							color: "#ff6600",
							bgColor: "#ffffff",
							padding: 4,
							fontSize: 12,
							borderRadius: 4,
							anchorX: -20,
							anchorY: -30 // label 在虚线上方
						}
					})

					optimizedPolyline.value.push({
						points: [
							{ latitude: groupItem.latitude, longitude: groupItem.longitude },
							{ latitude: clatitude, longitude: clongitude }
						],
						color: '#ff6600AA',  // 添加透明度
						width: 3,
						dottedLine: true,
						label: {
							content: groupItem.distanse + '米',
							color: "#ff6600",
							bgColor: "#ffffff",
							padding: 4,
							fontSize: 12,
							borderRadius: 4,
							anchorX: -20,
							anchorY: -30 // label 在虚线上方
						}
					})
				})
				
				optimizedMarkers.value.push({
					id: -1,
					latitude: clatitude,
					longitude: clongitude,
					iconPath: '/static/marker.png',
					width: 24,
					height: 24
				})
            }
        });

        let centerObj = getSphericalCenter(dataList.value.map(item => ({
            lng: item.longitude,
            lat: item.latitude,
        })).concat([{ lng: clongitude, lat: clatitude }]));

        console.log('centerObj', centerObj);
        centerPonit.value.lng = centerObj.lng;
        centerPonit.value.lat = centerObj.lat;
    } catch (error) {
        console.error('失败', error);
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

// 获取历史轨迹
async function getDataList() {
    if (!hasPermission('project:Week:select')) {
        return
    }
    try {
        let queryParams: any = { pid: model.pid, startTime: model.startTime, endTime: model.endTime, creater: model.creator };
        const data = await fetchGetSystemReportDataList(queryParams);
        dataList.value = data;
    } catch (err) {
        console.error('获取历史轨迹列表', err);
    }
}

// 异常考勤
function handleOpenMapChange(status: number, longitude: number, latitude: number) {
    if (status === 1) {
        uni.openLocation({
            longitude,
            latitude
        })
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

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onLoad((options: any) => {
    model.pid = options.pid;
    model.startTime = options.startTime;
    model.endTime = options.endTime;
    model.creator = options.uid;
    model.username = decodeURIComponent(options.uname);
    model.projectName = decodeURIComponent(options.projectName);
    model.address = decodeURIComponent(options.address);
    model.duration = Number(options.duration);
    model.status = Number(options.status);
    model.dailyReport = Number(options.dailyReport);

    getDataList();
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

onPullDownRefresh(() => {
    getDataList();

    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="考勤详情" safe-area-inset-top :bordered="false" @click-left="handleClickLeft"></wd-navbar>

            <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
                <view style="padding: 40rpx 100rpx; display: flex; justify-content: space-between; align-items: center; width: calc(100vw - 200rpx);">
                    <wd-radio-group v-model="model.type" shape="button" custom-class="headerRadioWrap" @change="handleTabsChange">
                        <wd-radio :value="1">表格</wd-radio>
                        <wd-radio :value="2">地图</wd-radio>
                    </wd-radio-group>
                </view>
            </view>
        </view>

        <view>
            <wd-gap height="20rpx" />

            <wd-cell title="项目名称" icon="layers">
                <wd-text bold :text="model.projectName" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
            </wd-cell>

            <wd-cell title="上班打卡时间" icon="calendar">
                <wd-text bold :text="model.startTime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
            </wd-cell>

            <wd-cell title="下班打卡时间" icon="calendar">
                <wd-text bold :text="model.endTime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
            </wd-cell>

            <wd-cell title="地址" icon="location">
                <wd-text bold :text="model.address" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
            </wd-cell>

            <wd-cell title="工时" icon="list">
                <wd-text bold :text="model.duration + '小时'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
            </wd-cell>

            <wd-cell title="打卡状态" icon="clock" center>
                <wd-tag round :type="model.status === 0 ? 'success' : model.status === 1 ? 'danger' : 'default'">
                    {{ model.status === 0 ? '正常' : model.status === 1 ? '异常' : '未知'  }}
                </wd-tag>
            </wd-cell>

            <wd-cell title="日报" icon="time" custom-class="cellClass">
                <wd-tag round :type="model.dailyReport === 0 ? 'danger' : model.dailyReport === 1 ? 'success' : 'default'">
                    {{ model.dailyReport === 0 ? '未提交' : model.dailyReport === 1 ? '已提交' : '未知' }}
                </wd-tag>
            </wd-cell>

            <view v-if="model.type === 1">
                <view v-if="dataList.length > 0">
                    <view v-for="(item, index) in dataList" :key="index">
                        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
                            <view style="padding: 5rpx;">
                                <wd-cell title="打卡类型" icon="list">
                                    <wd-text bold :text="item.ctype === 0 ? '上班打卡 ' : item.ctype === 1 ? '下班打卡' : item.ctype === 2 ? '系统上报' : '未知'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="打卡状态" icon="clock" center clickable @click="handleOpenMapChange(item.status, item.longitude, item.latitude)">
                                    <wd-tag round :type="item.status === 0 ? 'success' : item.status === 1 ? 'danger' : 'default'">
                                        {{ item.status === 0 ? '正常' : item.status === 1 ? '异常' : '未知'  }}
                                    </wd-tag>
                                </wd-cell>

                                <wd-cell title="地址" icon="location">
                                    <wd-text bold :text="item.address" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="打卡时间" icon="time">
                                    <wd-text bold :text="item.dbtime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>

                                <wd-cell title="打卡误差值" icon="flag" v-if="item.hasOwnProperty('distanse')">
                                    <wd-text bold :text="item.distanse + '米'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
                                </wd-cell>
                            </view>
                        </view>
                    </view>

                    <wd-backtop :bottom="70" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>

                    <wd-gap height="20rpx" />
                </view>
                <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
                    <wd-status-tip image="../../static/search.png" tip="暂无待办事项" />
                </view>
            </view>

            <view v-else>
				<!-- #ifdef H5 -->
				<map :id="mapId" :latitude="centerPonit.lat" :longitude="centerPonit.lng" :include-points="optimizedPolyline.length > 0 ? optimizedPolyline[0].points : []"
				    :markers="optimizedMarkers" :polyline="optimizedPolyline"
				    @markertap="handleMarkerClick" @regionchange="handleMapMove"
				    style="width: 100%; height: 1000rpx; margin-top: 20rpx;" />
				<!-- #endif -->
				
				<!-- #ifdef APP || APP-PLUS -->
				<map :id="mapId" :latitude="centerPonit.lat" :longitude="centerPonit.lng" :include-points="optimizedPolyline.length > 0 ? optimizedPolyline[0].points : []"
				    :markers="optimizedMarkers" :polyline="optimizedPolyline" :scale="12"
				    @markertap="handleMarkerClick" @regionchange="handleMapMove"
				    style="width: 100%; height: 1000rpx; margin-top: 20rpx;"></map>
				<!-- #endif -->
            </view>
        </view>
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

.headerRadioWrap {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    background: #F5F5F5 !important;
    border-radius: 20px !important;

    .wd-radio {
        width: 50% !important;
        margin-right: 0 !important;
    }

    :deep(.wd-radio__label) {
        padding-left: 0 !important;
        padding-right: 0 !important;
        width: 100% !important;
        // text-align: center !important;
        background: transparent !important;
    }

    .wd-radio.is-button {
        display: flex !important;
    }

    .wd-radio.is-button .wd-radio__label {
        background: transparent !important;
    }

    :deep(.wd-radio.is-checked.is-button .wd-radio__label) {
        background: #ffffff !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important; /* 添加阴影，浮起 */
        border: 1px solid #e0e0e0 !important; /* 添加边框，增强轮廓 */
        position: relative; /* 确保 z-index 有效（如果需要） */
        z-index: 1; /* 略高于周围内容 */
        transition: box-shadow 0.2s ease; /* 平滑动画 */
    }
}
</style>