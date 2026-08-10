<script lang="ts" setup>
import { useToast } from 'wot-design-uni';
import { reactive, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSystemDate, hasPermission } from '@/utils/index';
import { onReady, onLoad, onPageScroll, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetHistoryTrajectoryDataList } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const chartType = ref<string>('list');
const type = ref<number>(1);
const selectDate = ref<number>(Number(getSystemDate(5)));
const selectWeek = ref<number>(Date.now());
const selectMonth = ref<number>(Number(getSystemDate(5)));
const triggered = ref<boolean>(false);
const userShow = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const dataList = ref<any[]>([]);
const weekDataList = ref<any[]>([]);
const monthDataList = ref<any[]>([]);
const scrollTop = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
}>({
    page: 1,
    limit: 100,
});

const model = reactive<{
    page: number;
    total: number;
    uid: number;
    fuzzy: string;
    userName: string;
    userDataList: any;
    allUserDataList: any;
}>({
    page: 1,
    total: 0,
    uid: 0,
    fuzzy: '',
    userName: '',
    userDataList: [],
    allUserDataList: []
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 类型切换
const handleTypeChange = () => {
    getDataList();
}

// 项目日月年选择
function handleDateChange({ value }: { value: number }) {
    getDataList();
}

function handleWeekChange({ value }: { value: number }) {
    getDataList();
}

function handleMonthChange({ value }: { value: number }) {
    getDataList();
}

// 打开弹出层
function handleLinkUserShowChange() {
    userShow.value = true;
}

// 清除
function handleClearFuzzyChange() {
    // model.page = 1;
    // getAlluserDataList();
    model.userDataList = model.allUserDataList;
}

// 搜索
function handleSearchFuzzyChange() {
    // model.page = 1;
    // getAlluserDataList();
    model.userDataList = model.allUserDataList.filter((item: any) => item.username.indexOf(model.fuzzy) !== -1);
}

// 获取用户分页数据
async function getAlluserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (model.page === 1) {
            model.userDataList = [];
            model.allUserDataList = [];
        }
        const data = await fetchGetAllUserDataList({ page: model.page, limit: 100, usertypes: '2, 3, 9' });
        model.total = Number(data.total);
        model.userDataList = model.userDataList.concat(data.list);
        model.allUserDataList = model.allUserDataList.concat(data.list);
    } catch (error) {
        console.error('获取用户分页数据失败', error);
    }
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    model.page = 1;
    getAlluserDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.allUserDataList.length < model.total) {
        model.page++;
        getAlluserDataList();
    }
}

// 关闭弹出层
function handleCloseChange() {
    userShow.value = false;
}

// 选择用户
function handleCheckboxSelectChange({ value }: { value: any }) {
    const userObj = model.userDataList.find((item: any) => value === item.id);
    model.userName = userObj ? userObj.username : '';
    userShow.value = false;
    getDataList();
}

// 清除
function handleClearChange() {
    model.uid = 0;
    model.userName = "";
    model.fuzzy = "";
    getDataList();
}

// 搜索
function handleSearchChange() {
    getDataList();
}

function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function handleMonthTransChange(val: number) {
    const date = new Date(val); // 当前选中日期
    const day = date.getDay(); // 星期几（0=周日，1=周一，...）

    // 计算周一（first-day-of-week=1）
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    // 计算周日
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return [formatDate(monday), formatDate(sunday)]
}

// 获取历史轨迹列表信息列表
async function getDataList() {
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
            weekDataList.value = [];
            monthDataList.value = [];
        }
        let queryParams: any = {};
        if (type.value === 1) {
            queryParams['dates'] = String(getSystemDate(0, selectDate.value));
        } else if (type.value === 2) {
            const startAndEndRange = handleMonthTransChange(selectWeek.value);
            queryParams['startTime'] = startAndEndRange[0];
            queryParams['endTime'] = startAndEndRange[1];
        } else if (type.value === 3) {
            queryParams['dates'] = String(getSystemDate(3, selectMonth.value));
        }
        if (model.uid) {
            queryParams['creater'] = model.uid;
        }
        // 全部以人名作为key
        // const data = await fetchGetHistoryTrajectoryDataList(queryParams);
        // const result = Object.entries(data).flatMap(([key, value]: [key: string, value: any]) =>
        //     value.map((item: any) => ({ username: key, list: value }))
        // );
        // dataList.value = dataList.value.concat(result);

        // 日期以调试人员名称为key。周月以时间为key
        const data = await fetchGetHistoryTrajectoryDataList(queryParams);
        if (type.value === 1) {
            const result = data ? Object.entries(data).map(([key, value]: [key: string, value: any]) => ({ username: key, userimage: value.length > 0 ? value[0].userimage || '' : '', list: value })) : [];
            dataList.value = dataList.value.concat(result);

            if (dataList.value.length > 0 && chartType.value === 'map') {
                generateMockData();
            }
        } else if (type.value === 2) {
            const weekResult = data ? Object.entries(data).map(([key, value]: [key: string, value: any]) => ({ username: key, userimage: value.length > 0 ? value[0].userimage || '' : '', list: value })) : [];
            weekDataList.value = weekDataList.value.concat(weekResult);
            const result = data ? Object.entries(data).flatMap(([key, value]: [key: string, value: any]) =>
                value.map((item: any) => ({ ...item, debugusername: key }))
            ) : [];
            dataList.value = Object.values(
                result.reduce((acc: any, cur: any) => {
                    if (!acc[cur.daytime]) {
                        acc[cur.daytime] = { daytime: cur.daytime, list: [] };
                    }
                    acc[cur.daytime].list.push(cur);
                    return acc;
                }, {})
            );
            if (dataList.value.length > 0 && chartType.value === 'map') {
                generateMockData();
            }
        } else if (type.value === 3) {
            const monthResult = data ? Object.entries(data).map(([key, value]: [key: string, value: any]) => ({ username: key, userimage: value.length > 0 ? value[0].userimage || '' : '', list: value })) : [];
            monthDataList.value = monthDataList.value.concat(monthResult);
            const result = data ? Object.entries(data).flatMap(([key, value]: [key: string, value: any]) =>
                value.map((item: any) => ({ ...item, debugusername: key }))
            ) : [];
            dataList.value = Object.values(
                result.reduce((acc: any, cur: any) => {
                    if (!acc[cur.daytime]) {
                        acc[cur.daytime] = { daytime: cur.daytime, list: [] };
                    }
                    acc[cur.daytime].list.push(cur);
                    return acc;
                }, {})
            );
            if (dataList.value.length > 0 && chartType.value === 'map') {
                generateMockData();
            }
        }
    } catch (err) {
        console.error('获取历史轨迹列表信息列表失败', err);
    }
}

// 切换
function handleSwitchClick() {
    chartType.value = chartType.value === 'list' ? 'map' : 'list';
    if (chartType.value === 'list') {
        stopAllAnimations();
    } else {
        nextTick(() => {
            if (dataList.value.length > 0) {
                generateMockData();
            }
        })
    }
}

// 地图
const center = reactive({
    latitude: 0,
    longitude: 0
})

const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
    '#F9E79F', '#ABEBC6', '#FAD7A0', '#D2B4DE', '#A9CCE3',
    '#F5B7B1', '#AED6F1', '#A3E4D7', '#FDEBD0', '#E8DAEF',
    '#D5DBDB', '#FADBD8', '#D6EAF8', '#D1F2EB', '#FCF3CF',
    '#EBDEF0', '#D6EAF8', '#D1F2EB', '#FDEBD0', '#E8DAEF',
    '#FADBD8', '#D6EAF8', '#D1F2EB', '#FCF3CF', '#EBDEF0',
    '#D6EAF8', '#D1F2EB', '#FDEBD0', '#E8DAEF', '#FADBD8',
    '#D6EAF8', '#D1F2EB', '#FCF3CF', '#EBDEF0', '#D6EAF8'
]

// 动画配置
const animationConfig = reactive({
    preMarkAll: true,
    playSpeed: 3,
    pointInterval: 150,
    currentStep: 'ready',
    isPlaying: false
})

// 数据
const persons = ref<any>([]);
const temporaryMarkers = ref<any>([]);
const optimizedMarkers = ref<any>([]);
const optimizedPolyline = ref<any>([]);
const finallyDataList = ref<any>([]);

// 动画计时器
const animationTimers = ref<any>([]);

const scale = ref(14);

// 生成模拟数据
const generateMockData = () => {
    persons.value = [];
    temporaryMarkers.value = [];
    optimizedMarkers.value = [];
    optimizedPolyline.value = [];

    finallyDataList.value = type.value === 1 ? dataList.value : type.value === 2 ? weekDataList.value : type.value === 3 ? monthDataList.value : dataList.value;
    for (let i = 0; i < finallyDataList.value.length; i++) {
        const personPoints = generatePersonTrackPoints(i);

        const person = {
            id: i + 1,
            name: finallyDataList.value[i].username,
            color: colors[i % colors.length],
            currentPosition: { ...personPoints[0] },
            originalPoints: personPoints,
            isMoving: false,
            currentSegment: 0,
            segmentProgress: 0,
            startTime: 0
        };
        persons.value.push(person);
    }

    if (chartType.value === 'map') {
        // fitMapToTracks();
        startStagedAnimation();
    }
}

// 生成单人轨迹点
const generatePersonTrackPoints = (personIndex: number) => {
    const points = [];
    const personData = finallyDataList.value[personIndex];

    // 生成轨迹点
    for (let i = 0; i < personData.list.length; i++) {
        points.push({
            ...personData.list[i],
            latitude: personData.list[i].latitude,
            longitude: personData.list[i].longitude,
            ctype: personData.list[i].ctype,
            status: personData.list[i].status
        });
    }

    return points;
}

// 调整地图视野
const fitMapToTracks = () => {
    if (persons.value.length === 0) return;

    const allPoints = persons.value.flatMap((person: any) => person.originalPoints);
    const lats = allPoints.map((p: any) => p.latitude);
    const lngs = allPoints.map((p: any) => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    center.latitude = (minLat + maxLat) / 2;
    center.longitude = (minLng + maxLng) / 2;

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const maxSpan = Math.max(latSpan, lngSpan);

    if (maxSpan > 0.05) scale.value = 12;
    else if (maxSpan > 0.03) scale.value = 13;
    else if (maxSpan > 0.02) scale.value = 14;
    else scale.value = 15;
}

// 开始动画
const startStagedAnimation = async () => {
    if (animationConfig.isPlaying) {
        stopAllAnimations();
        await delay(300);
    }

    animationConfig.isPlaying = true;
    console.log('🎬 开始轨迹动画...');

    try {
        // 阶段1: 显示所有标记点
        animationConfig.currentStep = 'marks';
        await showAllMarkers();

        // 阶段2: 播放轨迹
        animationConfig.currentStep = 'lines';
        await playFastTracks();

        animationConfig.currentStep = 'finished';
        console.log('✅ 动画播放完成');
    } catch (error) {
        console.error('动画播放出错:', error);
    } finally {
        animationConfig.isPlaying = false;
    }
}

// 显示所有标记点
const showAllMarkers = () => {
    return new Promise((resolve) => {
        temporaryMarkers.value = [];

        const allMarkers: any = [];
        persons.value.forEach((person: any) => {
            person.originalPoints.forEach((point: any, pointIndex: number) => {
                allMarkers.push({ point, person, pointIndex });
            });
        });

        let currentIndex = 0;
        const batchSize = 12;

        const showNextBatch = () => {
            const batch = allMarkers.slice(currentIndex, currentIndex + batchSize);
            batch.forEach((marker: any) => {
                addTemporaryMarker(marker.point, marker.person, marker.pointIndex);
            });

            currentIndex += batchSize;

            if (currentIndex < allMarkers.length) {
                const timer: any = setTimeout(showNextBatch, animationConfig.pointInterval);
                animationTimers.value.push(timer);
            } else {
                console.log('✅ 标记点显示完成');
                const timer = setTimeout(resolve, 800);
                animationTimers.value.push(timer);
            }
        };

        showNextBatch();
    });
}

// 添加临时标记点
const addTemporaryMarker = (point: any, person: any, index: number) => {
    const marker = {
        id: `temp_${person.id}_${index}`,
        latitude: point.latitude,
        longitude: point.longitude,
        iconPath: '/static/marker.png',
        width: 20,
        height: 20,
        // label: {
        //     content: `${person.name}-${index + 1}`,
        //     color: '#FFFFFF',
        //     bgColor: person.color,
        //     borderRadius: 8,
        //     padding: 6,
        //     textAlign: 'center'
        // },
   //      callout: {
   //          // content: `${person.name}\n起点`,
			// content: `${person.name}\n${(point.status === 0 || point.status === 1) ? (point.ctype === 0 ? '起点' : point.ctype === 1 ? '终点' : point.ctype === 2 ? '定位' : '未知') : (point.status === 2 ? '出发' : point.status === 3 ? '到达' : '未知') }`,
   //          color: '#FFFFFF',
   //          bgColor: person.color,
   //          padding: 8,
   //          borderRadius: 8,
   //          display: 'ALWAYS'
   //      }
    };

    temporaryMarkers.value.push(marker);
}

// 播放轨迹动画 - 修复：使用setTimeout替代requestAnimationFrame
const playFastTracks = () => {
    return new Promise((resolve: any) => {
        console.log('🎯 开始播放轨迹...');

        // 初始化状态
        persons.value.forEach((person: any) => {
            person.isMoving = true;
            person.currentPosition = { ...person.originalPoints[0] };
            person.currentSegment = 0;
            person.segmentProgress = 0;
        });

        const startTime = Date.now();
        const totalDuration = getTotalDuration() / animationConfig.playSpeed;
        const frameInterval = 50; // 20fps，在小程序中足够流畅

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const totalProgress = Math.min(elapsed / totalDuration, 1);

            updateAllPersonsPosition(totalProgress);
            updateOptimizedPolyline();
            updateMapMarkers();

            if (totalProgress < 1) {
                const timer = setTimeout(animate, frameInterval);
                animationTimers.value.push(timer);
            } else {
                // 动画完成
                persons.value.forEach((person: any) => {
                    person.isMoving = false;
                });
                updateMapMarkers();
                updateOptimizedPolyline();
                resolve();
            }
        };

        const timer = setTimeout(animate, frameInterval);
        animationTimers.value.push(timer);
    });
}

// 更新所有人员位置
const updateAllPersonsPosition = (totalProgress: any) => {
    persons.value.forEach((person: any) => {
        if (!person.isMoving) return;

        const segmentCount = person.originalPoints.length - 1;
        const totalSegmentsProgress = totalProgress * segmentCount;
        const currentSegment = Math.floor(totalSegmentsProgress);
        const segmentProgress = totalSegmentsProgress - currentSegment;

        if (currentSegment < segmentCount) {
            const start = person.originalPoints[currentSegment];
            const end = person.originalPoints[currentSegment + 1];

            person.currentPosition = {
                latitude: start.latitude + (end.latitude - start.latitude) * segmentProgress,
                longitude: start.longitude + (end.longitude - start.longitude) * segmentProgress
            };

            person.currentSegment = currentSegment;
            person.segmentProgress = segmentProgress;
        } else {
            person.isMoving = false;
            person.currentPosition = { ...person.originalPoints[segmentCount] };
        }
    });
}

// 更新地图标记
const updateMapMarkers = () => {
    // 移动中的人员标记
    const movingMarkers = persons.value
        .filter((p: any) => p.isMoving)
        .map((person: any) => ({
			id: `moving_${person.id}`,
			latitude: person.currentPosition.latitude,
			longitude: person.currentPosition.longitude,
			iconPath: '/static/zhaogong.png',
			width: 20,
			height: 20,
            // id: `moving_${person.id}`,
            // latitude: person.currentPosition.latitude,
            // longitude: person.currentPosition.longitude,
            // iconPath: '/static/marker.png',
            // width: 20,
            // height: 20,
            // anchor: { x: 0.5, y: 0.5 },
            // label: {
            //     content: `🚶${person.name}`,
            //     color: '#FFFFFF',
            //     bgColor: person.color,
            //     borderRadius: 10,
            //     padding: 6,
            //     textAlign: 'center'
            // },
            // callout: {
            //     content: `${person.name}\n移动中...\n进度: ${Math.round(person.segmentProgress * 100)}%`,
            //     color: '#FFFFFF',
            //     bgColor: person.color,
            //     padding: 10,
            //     borderRadius: 8,
            //     display: 'ALWAYS'
            // }
        }));

    // 已完成的人员标记
    const finishedMarkers = persons.value
        .filter((p: any) => !p.isMoving && p.currentSegment > 0)
        .map((person: any) => ({
            id: `finished_${person.id}`,
            latitude: person.currentPosition.latitude,
            longitude: person.currentPosition.longitude,
            iconPath: '/static/marker.png',
            width: 20,
            height: 20,
            // label: {
            //     content: `${person.name}`,
            //     color: '#FFFFFF',
            //     bgColor: '#4CAF50',
            //     borderRadius: 8,
            //     padding: 4
            // },
            // callout: {
            //     content: `${person.name}\n终点`,
            //     color: '#FFFFFF',
            //     bgColor: person.color,
            //     // padding: 10,
            //     borderRadius: 8,
            //     display: 'ALWAYS'
            // }
        }));

    optimizedMarkers.value = [...temporaryMarkers.value, ...movingMarkers, ...finishedMarkers];
    fitMapToTracks();
}

// 更新轨迹线
const updateOptimizedPolyline = () => {
    optimizedPolyline.value = persons.value
        .filter((person: any) => person.isMoving || person.currentSegment > 0)
        .map((person: any) => {
            const passedPoints = person.originalPoints.slice(0, person.currentSegment + 1);
            if (passedPoints.length > 0 && person.isMoving) {
                passedPoints.push(person.currentPosition);
            }

            return {
                points: passedPoints.length > 0 ? passedPoints : [person.currentPosition],
                color: person.color,
                width: 4,
                arrowLine: true,
                borderColor: '#FFFFFF'
            };
        });
}

// 计算总时长
const getTotalDuration = () => {
    return Math.max(...persons.value.map((p: any) => p.originalPoints.length)) * 1000;
}

// 停止所有动画
const stopAllAnimations = () => {
    console.log('⏹️ 停止所有动画');
    animationConfig.isPlaying = false;
    animationConfig.currentStep = 'ready';

    // 清除所有计时器
    animationTimers.value.forEach((timer: any) => {
        clearTimeout(timer);
    });
    animationTimers.value = [];

    temporaryMarkers.value = [];
    optimizedMarkers.value = [];
    optimizedPolyline.value = [];

    persons.value.forEach((person: any) => {
        person.isMoving = false;
    });
}

// 工具函数
const delay = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 地图区域变化
const onRegionChange = (e: any) => {
    // 可添加视口变化逻辑
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

onUnmounted(() => {
    stopAllAnimations();
})

onLoad(() => {
    uni.getLocation({
        type: 'gcj02',
        geocode: true,
        isHighAccuracy: true,
        highAccuracyExpireTime: 10000,
        success: (res) => {
            console.log('获取当前位置成功', res);
            center.longitude = res.longitude;
            center.latitude = res.latitude;
            getAlluserDataList();
            getDataList();
        },
        fail: (error) => {
            console.log(error);
			center.longitude = 30.3;
			center.latitude = 120.2;
			getAlluserDataList();
			getDataList();
        }
    });
});

onReady(() => {
    recalcTopFixedHeight();
})

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading();
        uni.stopPullDownRefresh();
    }, 1000);
});

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
            <wd-navbar left-arrow title="历史轨迹" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
                <template #right v-if="hasPermission('project:Info:select')">
                    <wd-icon name="filter" @click.stop="handleLinkUserShowChange"></wd-icon>
                </template>
            </wd-navbar>

            <wd-search v-model="model.userName" disabled placeholder="请选择用户"
                :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索"
                @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <view class="filterControlWrap"
                :style="{ padding: '10rpx 20rpx', width: 'calc(100vw - 40rpx)', background: isDark ? '#000000' : '#ffffff' }">
                <wd-radio-group size="small" v-model="type" shape="button" @change="handleTypeChange">
                    <wd-radio :value="1">日</wd-radio>
                    <wd-radio :value="2">周</wd-radio>
                    <wd-radio :value="3">月</wd-radio>
                </wd-radio-group>

                <wd-datetime-picker v-if="type === 1" type="date" v-model="selectDate" @confirm="handleDateChange" />
                <wd-calendar type="week" v-if="type === 2" v-model="selectWeek" :first-day-of-week="1"
                    @confirm="handleWeekChange" />
                <wd-datetime-picker v-if="type === 3" type="year-month" v-model="selectMonth"
                    @confirm="handleMonthChange" />
            </view>
        </view>

        <view v-if="chartType === 'list'">
            <view v-if="dataList.length > 0">
                <view v-for="(dataItem, dataIndex) in dataList" :key="dataIndex" :style="{ paddingBottom: dataIndex === dataList.length - 1 ? '20rpx' : 0 }">
                    <view
                        style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; gap: 0 10rpx; padding: 10px 0 10px 10px;">
                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                        <wd-img v-if="type === 1" :width="30" :height="30" round
                            :src="dataItem.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'"
                            :preview-src="dataItem.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'"
                            :enable-preview="true" />
                        <view style="font-weight: bolder;">{{ type === 1 ? dataItem.username : dataItem.daytime }}
                        </view>
                    </view>

                    <view :style="{ width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
                        <view style="padding: 20rpx;" v-for="(item, index) in dataItem.list" :key="index"
                            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', marginBottom: '20rpx', borderRadius: '20rpx' }">
                            <view style="margin-top: 20rpx; font-size: 28rpx;" v-if="type !== 1">调试工程师:</view>
                            <view
                                style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder; display: flex; align-items: center; gap: 0 10rpx;"
                                v-if="type !== 1">
                                <wd-img :width="30" :height="30" round
                                    :src="item.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'"
                                    :preview-src="item.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'"
                                    :enable-preview="true" />
                                <view>{{ item.debugusername }}</view>
                            </view>
                            <view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ item.proname }}
                            </view>
							<view style="margin-top: 20rpx; font-size: 28rpx;">打卡类型:</view>
							<view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">
								<wd-tag v-if="item.status === 0 || item.status === 1" type="primary" round>{{ item.ctype === 0 ? '上班打卡' : item.ctype === 1 ? '下班打卡' : item.ctype === 2 ? '静默打卡' : '上班打卡' }}</wd-tag>
								<wd-tag v-if="item.status === 2 || item.status === 3" type="primary" round>{{ item.status === 2 ? '出发' : item.status === 3 ? '到达' : '出发' }}</wd-tag>
							</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx;">打卡时间:</view>
                            <view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ item.dbtime }}
                            </view>
                            <view style="margin: 10rpx 0; font-size: 28rpx;">打卡地点:</view>
                            <view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;">{{ item.address }}
                            </view>
                            <!-- <view style="margin: 10rpx 0; font-size: 28rpx;" v-if="item.hasOwnProperty('duration')">工时:
                            </view>
                            <view style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;"
                                v-if="item.hasOwnProperty('duration')">{{ item.hasOwnProperty('duration') ?
                                    item.duration + '小时'
                                    : '无' }}</view> -->
                        </view>
                    </view>
                </view>

                <wd-backtop :bottom="90" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
            </view>

            <view v-else
                :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                <wd-status-tip image="../../static/search.png" tip="暂无历史轨迹" />
            </view>
        </view>

        <view v-else>
            <map id="map" :latitude="center.latitude" :longitude="center.longitude" :scale="scale"
                :polyline="optimizedPolyline" :markers="optimizedMarkers" class="map" @regionchange="onRegionChange">
            </map>
        </view>

        <wd-fab draggable position="right-bottom" :expandable="false" :gap="{ bottom: 20 }" :zIndex="2">
            <template #trigger>
                <wd-button round @click="handleSwitchClick" icon="translate-bold" type="primary">切换</wd-button>
            </template>
        </wd-fab>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" custom-class="popupWrap" v-model="userShow"
            position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="model.fuzzy" placeholder="请输入用户名称" placeholder-left cancel-txt="搜索"
                @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered"
                @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange"
                style="height: calc(100vh - 460rpx);">
                <wd-radio-group v-model="model.uid" shape="dot" @change="handleCheckboxSelectChange">
                    <wd-radio v-for="(item, index) in model.userDataList" :key="index" :value="item.id"
                        class="radioCellWrap">
                        {{ item.username }}</wd-radio>
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
    z-index: 99;
    background-color: #FFFFFF;
    // 保证内联元素正确换行
    box-sizing: border-box;
    // 可选：微阴影让固定区更明显
    // box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}

.radioCellWrap {
    padding: 10rpx 20rpx !important;
}

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

.filterControlWrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.map {
    width: 100%;
    height: calc(100vh - 500rpx);
}

:deep(.wd-datetime-picker__cell) {
	background: transparent !important;
}

:deep(.wd-calendar__cell) {
	background: transparent !important;
}
</style>
