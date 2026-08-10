<script setup lang="ts">
import { hasPermission, getCenterPoint, generateHexColors } from '@/utils/index'
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { onReady, onLoad, onShow, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { useTabbar } from '@/composables/useTabbar';
import { fetchGetRealtimeTrajectoryInfo, fetchGetRealtimeTrajectoryDetailInfo, fetchGetMyDebugBusinessInfo } from '@/service/index';

const { theme } = useTheme();

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

const isDark = computed(() => theme.value === 'dark');

const mapId = ref<string>('myMap');

const colorsArr = ref<string[]>(generateHexColors());

const userType = ref<number>(Number(uni.getStorageSync('usertype')));

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

const model = reactive<{
    page: number;
    limit: number;
    pid: number;
    fuzzy: string;
}>({
    page: 1,
    limit: 50,
    pid: 0,
    fuzzy: ''
})

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
const optimizedMarkers = ref<any[]>([])
const optimizedPolyline = ref<any[]>([])

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
            getMemberRealtimeInfo();
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
        console.log('data', data);
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
					anchor: {
					    x: 0.5, // 图标水平中心
					    y: 0.5  // 图标垂直中心
					},
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
						content:
						      item.pid != -1
						        ? `　调试人员: ${item.username}\n\n　项目名称: ${item.proname}\n\n　打卡地址: ${item.address}\n\n　打卡时间: ${item.dbtime}`
						        : `　调试人员: ${item.username}\n\n　项目名称: 远程调试\n\n　打卡地址: ${item.address}\n\n　打卡时间: ${item.dbtime}`
                        // content: item.pid != -1 ? `调试人员: ${item.username}\n\n项目名称: ${item.proname}\n\n打卡地址: ${item.address}\n\n打卡时间: ${item.dbtime}` : `调试人员: ${item.username}\n\n项目名称: 远程调试\n\n打卡地址: ${item.address}\n\n打卡时间: ${item.dbtime}`
                    },
                    label: {
                        content: item.username,
                        padding: 5,
                        borderRadius: 5,
                        bgColor: '#FFFFFF',
                        color: colorsArr.value[index],
						anchorX: -30,
						// anchorY: -10
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
    } catch (error) {
        console.error('获取人员实时位置失败', error);
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

// 清除
function handleClearChange() {
    model.page = 1;
    dataList.value = [];
    getDataList();
}

// 搜索
function handleSearchChange() {
    model.page = 1;
    dataList.value = [];
    getDataList();
}

// 获取我的待办
async function getDataList() {
    if (!hasPermission('project:Week:select')) {
        return
    }
    try {
        if (model.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = { page: model.page, limit: model.limit };
        const data = await fetchGetMyDebugBusinessInfo(queryParams);
        dataList.value = dataList.value.concat(data.list.map((item: any) => {
            return {
                ...item,
                content1: item.content1 || '',
                content2: item.content2 || '',
                content3: item.content3 || '',
                commentList: [],
                isFold: item.hasOwnProperty('isFold') ? item.isFold : false,
                content: item.hasOwnProperty('content') ? item.content : '',
            }
        }));
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取我的待办列表失败', err);
        state.value = 'error';
    }
}

// 跳转
function handleJumpChange(url: string) {
    uni.navigateTo({
        url
    })
}

function handleTabbarChange({ value }: { value: string }) {
    setTabbarItemActive(value);
	uni.switchTab({
		url: '/pages/' + activeTabbar.value.name
	})
}

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onReady(() => {
	uni.hideTabBar();
})

onLoad(() => {
    if (userType.value === 2 || userType.value === 3) {
        getDataList();
		uni.setNavigationBarTitle({
			title: "待办"
		})
    } else {
		uni.setNavigationBarTitle({
			title: "轨迹"
		})
	}
})

onShow(() => {
    if (userType.value !== 2 && userType.value !== 3) {
       getCurrentLocation();
    }
});

onPullDownRefresh(() => {
    if (userType.value === 2 || userType.value === 3) {
        model.page = 1;
        getDataList();
    } else {
        getCurrentLocation();
    }
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (dataList.value.length < total.value) {
        model.page++;
        getDataList();
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});
</script>

<template>
    <view>
		<wd-navbar :title="userType === 2 || userType === 3 ? '待办' : '轨迹'" safe-area-inset-top placeholder fixed :bordered="false" />
		
        <view v-if="userType === 2 || userType === 3">
            <view v-if="dataList.length > 0">
                <view v-for="(item, index) in dataList" :key="index">
                    <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx' }">
                        <view style="padding: 20rpx;">
                            <view @click="handleJumpChange('/projectPages/projectdetail/Index?pid=' + item.pid + '&activeTab=2')">
                                <view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
                                <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ item.proname }}</view>
                                <view style="margin: 10rpx 0; font-size: 28rpx;">调试业务名称:</view>
                                <view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;">{{ item.debugname }}</view>
                            </view>
                        </view>
                    </view>
                </view>

                <wd-loadmore :state="state" @reload="getDataList" />

                <wd-backtop :bottom="70" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
            </view>
            <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
                <wd-status-tip image="../static/search.png" tip="暂无待办事项" />
            </view>
        </view>

        <view v-else>
			<!-- #ifdef H5 -->
			<map :id="mapId" :latitude="centerPonit.lat" :longitude="centerPonit.lng" enable-3D enable-zoom enable-rotate
			    :markers="optimizedMarkers" :polyline="optimizedPolyline" :scale="5"
			    @markertap="handleMarkerClick" @regionchange="handleMapMove"
			    style="width: 100%; height: calc(100vh - 180rpx)" />
			<!-- #endif -->
            
			<!-- #ifdef APP || APP-PLUS -->
			<map :id="mapId" :latitude="centerPonit.lat" :longitude="centerPonit.lng" enable-3D enable-zoom enable-rotate
			    :markers="optimizedMarkers" :polyline="optimizedPolyline" :scale="5"
			    @markertap="handleMarkerClick" @regionchange="handleMapMove"
			    style="width: 100%; height: calc(100vh - 320rpx);"></map>
			<!-- #endif -->
        </view>
		
		<wd-tabbar shape="round" model-value="map" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
			<wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
		</wd-tabbar>
    </view>
</template>