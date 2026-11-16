<script setup lang="ts">
import { useMessage } from 'wot-design-uni';
import { hasPermission, getCenterPoint, generateHexColors } from '@/utils/index'
import { ref, computed, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { onReady, onLoad, onShow, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { useTabbar } from '@/composables/useTabbar';
import { useLargeArrayStore } from '@/store/useDataStore';
import { fetchGetRealtimeTrajectoryInfo, fetchGetRealtimeTrajectoryDetailInfo, fetchGetMyDebugBusinessInfo, fetchGetPrjFormDataList, fetchUpdatePrjFormInfo, fetchDeletePrjFormInfo } from '@/service/index';
import { Value } from 'sass';

const { theme, themeVars } = useTheme();

const message = useMessage();

const clickLock = ref<boolean>(false);

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

const store = useLargeArrayStore();

const isDark = computed(() => theme.value === 'dark');

const mapId = ref<string>('myMap');

const colorsArr = ref<string[]>(generateHexColors());

const userType = ref<number>(Number(uni.getStorageSync('usertype')));

// usertype 2 待办页 tabs 吸顶位置：状态栏高度 + 导航栏高度(44px)，即固定导航栏占位高度
const navStickyTop = ref((uni.getSystemInfoSync().statusBarHeight || 0) + 44);

const projectFormVisible = ref<boolean>(false);

const checkedAllProjectform = ref<boolean>(false);

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
// usertype 2 待办页 tabs：0 待调试任务 / 1 待审核事件
const activeTab = ref<number>(0);
// badge-props 必须绑定稳定的对象引用。wd-tabs 渲染时会重新执行默认插槽，
// 若直接内联 { modelValue: store.todoCount, ... }，每次插槽执行都会新建对象，
// badgeProps prop 引用变化 → 触发 wd-tabs 自身重渲染 → 再次执行插槽 → 死循环
// （Maximum recursive updates exceeded in component <wd-tabs>）。
// 用 computed 缓存对象引用，仅当 store 值真正变化时才产生新对象。
const debugBadgeProps = computed(() => ({ modelValue: store.todoCount, right: '-8px', showZero: false }));
const auditBadgeProps = computed(() => ({ modelValue: store.items.length, right: '-8px', showZero: false }));
const scrollTop = ref<number>(0);
// 固定头部
const topFixedWrap = ref<any>(null);
const topFixedHeight = ref<number>(0);
const scrollViewHeight = ref<number>(0);
const fixedScrollTop = ref<number>(0);
const allowScrollLoad = ref<boolean>(true);
// 销售
const prjState = ref<any>('loading');
const prjList = ref<any[]>([]);
const prjTotal = ref<number>(0);

const model = reactive<{
    page: number;
    limit: number;
    pid: number;
    fuzzy: string;
	prjPage: number;
	prjLimit: number;
	prjTotal: number;
	prjFuzzy: string;
}>({
    page: 1,
    limit: 20,
    pid: 0,
    fuzzy: '',
	prjPage: 1,
	prjLimit: 20,
	prjTotal: 0,
	prjFuzzy: ''
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
    getDataList();
}

// 搜索
function handleSearchChange() {
    model.page = 1;
    getDataList();
}

// 获取我的待办
const listLoading = ref(false);
let pendingReload = false;

// 获取我的待办（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
async function getDataList() {
    if (listLoading.value) {
        pendingReload = true;
        return;
    }
    listLoading.value = true;
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
        // 同步待调试任务数量（底部 tabbar 角标由 App.vue 汇总）
        store.todoCount = total.value;
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取我的待办列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) {
            pendingReload = false;
            getDataList();
        }
    }
}

// 请求待办数量：同步待办 tabs 角标（store.todoCount）与列表总数（total），每次 onShow 都刷新
const updateTodoBadge = async () => {
    try {
        const data = await fetchGetMyDebugBusinessInfo({ page: 1, limit: 1 });
        total.value = Number(data.total);
        store.todoCount = Number(data.total);
    } catch (err) {
        console.error('获取待办数量失败', err);
    }
}

// 切换待办 tabs 时回到页面顶部（原生页面滚动）
// 蓝标横杠改为纯 CSS 伪元素方案（见 .tabsFixedWrap :deep(.wd-tabs__nav-item::after)），
// 不再调用 wd-tabs 内部 updateLineStyle，避免 getRect 异步竞态导致蓝标落错 tab，也避免触发递归更新。
function handleTabsChange() {
	nextTick(() => {
		uni.pageScrollTo({
			scrollTop: 0,
			duration: 0
		});
	});
}

// 去审核（项目审核跳项目 tab，调试审核跳调试详情）
function handleAuditChange(item: any) {
	if (clickLock.value) return;
	clickLock.value = true;
	if (item.type === 0 || item.type === 2) {
		setTabbarItemActive('project');
		uni.setStorageSync('projectname', item.projectname);
		uni.switchTab({
			url: '/pages/project',
			complete: () => {
				clickLock.value = false;
			}
		})
	} else {
		uni.navigateTo({
			url: '/projectPages/projectdetail/Index?pid=' + item.proid + '&activeTab=2',
			complete: () => {
				clickLock.value = false;
			}
		})
	}
}

// 跳转
function handleJumpChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false;
		}
    })
}

function handleTabbarChange({ value }: { value: string }) {
	if (value !== 'map') {
		if (clickLock.value) return;
		clickLock.value = true;
		setTabbarItemActive(value);
		uni.switchTab({
			url: '/pages/' + activeTabbar.value.name,
			complete: () => {
				clickLock.value = false;
			}
		})
	}
}

// 清除
function handleClearPrjFuzzyChange() {
    scrollToTop();
    // 关键：禁止滚动加载
    allowScrollLoad.value = false;
    model.prjPage = 1;
    getPrjDataList();
}

// 搜索
function handleSearchPrjFuzzyChange() {
    scrollToTop();
    // 关键：禁止滚动加载
    allowScrollLoad.value = false;
    model.prjPage = 1;
    getPrjDataList();
}

// 获取我的项目调试单
const prjListLoading = ref(false);
let prjPendingReload = false;

// 获取我的项目调试单（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
async function getPrjDataList() {
    if (prjListLoading.value) {
        prjPendingReload = true;
        return;
    }
    prjListLoading.value = true;
    try {
        if (!hasPermission('project:form:select')) {
            // 请求完成后，延迟恢复（防止瞬间触发）
            setTimeout(() => {
                allowScrollLoad.value = true;
                scrollToTop();
            }, 300);
            return
        }
        if (model.prjPage === 1) {
            prjList.value = [];
        }
        let queryParams: any = { page: model.prjPage, limit: model.prjLimit, fuzzy: model.prjFuzzy };
        const data = await fetchGetPrjFormDataList(queryParams);
        prjList.value = prjList.value.concat(data.list);
        prjTotal.value = Number(data.total);
        if (prjList.value.length < prjTotal.value) {
            prjState.value = 'loadmore';
        } else {
            prjState.value = 'finished';
        }
        // 请求完成后，延迟恢复（防止瞬间触发）
        setTimeout(() => {
            allowScrollLoad.value = true;
            scrollToTop();
        }, 300);
    } catch (err) {
        console.error('获取我的项目调试单失败', err);
        prjState.value = 'error';
        // 请求完成后，延迟恢复（防止瞬间触发）
        setTimeout(() => {
            allowScrollLoad.value = true;
            scrollToTop();
        }, 300);
    } finally {
        prjListLoading.value = false;
        if (prjPendingReload) {
            prjPendingReload = false;
            getPrjDataList();
        }
    }
}

// 提交工程联系单
async function handleSubmitPrjChange(id: number, val: number) {
    // 提交联络单（status=1）时必须已有大于 0 的周期（自然日）
    const targetRow = prjList.value.find((item: any) => item.id === id);
    if (val === 1 && !(targetRow && Number(targetRow.period) > 0)) {
        uni.showToast({ icon: 'none', title: '该联络单未填写周期（自然日），请先修改联络单填写大于 0 的周期后再提交', duration: 2500 });
        return;
    }
    message
        .confirm({
            msg: '确认提交吗？提交后无法回滚，请确认是否提交。',
            title: '提示',
			zIndex: 999
        })
        .then(async () => {
            const data = await fetchUpdatePrjFormInfo([{ id: id, status: val }]);
            uni.showToast({
                icon: 'none',
                title: '提交成功',
                duration: 1500,
                complete: () => {
                    model.prjPage = 1;
                    getPrjDataList();
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
}

// 删除项目调试单
async function handleDeletePrjChange(id: number) {
    message
        .confirm({
            msg: '确认要删除该工程联系单吗？',
            title: '提示',
			zIndex: 999
        })
        .then(async () => {
            const data = await fetchDeletePrjFormInfo(id);
            uni.showToast({
                icon: 'none',
                title: '删除成功',
                duration: 1500,
                complete: () => {
                    model.prjPage = 1;
                    getPrjDataList();
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
}

// 新增、修改项目调试单
function handleAddPrjFormChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false;
		}
    })
}

function recalcTopFixedHeight() {
    if (!topFixedWrap.value) return;
    uni.createSelectorQuery()
        .select('.topFixedWrap')
        .boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) {
                topFixedHeight.value = rect.height;
                const sysInfo = uni.getSystemInfoSync();
				scrollViewHeight.value = sysInfo.windowHeight - topFixedHeight.value - 115;
            }
        })
        .exec();
}

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onLoad(() => {
    if (userType.value === 0 || userType.value === 1) {
        getPrjDataList();
        uni.$on('refreshListPrjSelf', getPrjDataList); // 监听刷新事件
    } else if (userType.value === 2 || userType.value === 3 || userType.value === 9) {
        getDataList();
    }
})

onUnload(() => {
    if (userType.value === 0 || userType.value === 1) {
        uni.$off('refreshListPrj', getPrjDataList); // 页面销毁时解绑
    }
});

onShow(() => {
    if (userType.value === 2 || userType.value === 3 || userType.value === 9) {
        updateTodoBadge(); // 进入待办页面重新请求待办角标
    } else if (userType.value !== 0 && userType.value !== 1) {
       getCurrentLocation();
    }
});

onPullDownRefresh(() => {
    if (userType.value === 0 || userType.value === 1) {
        model.prjPage = 1;
        getPrjDataList();
    } else if (userType.value === 2 || userType.value === 3 || userType.value === 9) {
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
    if (userType.value === 0 || userType.value === 1) {
        if (prjListLoading.value) return; // 在途请求未返回时不翻页，避免跳页
        if (prjList.value.length < prjTotal.value) {
            model.prjPage++;
            getPrjDataList();
        } else if (prjList.value.length === prjTotal.value) {
            prjState.value = 'finished';
        }
    } else if (userType.value === 2 || userType.value === 3 || userType.value === 9) {
        if (listLoading.value) return; // 在途请求未返回时不翻页，避免跳页
        if (dataList.value.length < total.value) {
            model.page++;
            getDataList();
        } else if (dataList.value.length === total.value) {
            state.value = 'finished';
        }
    }
});

function scrollToTop() {
    nextTick(() => {
        scrollTop.value = fixedScrollTop.value - 1;

        nextTick(() => {
            scrollTop.value = 0;
            fixedScrollTop.value = 0;
        });
    })
}

function handleScrollChange(e: any) {
    fixedScrollTop.value = e.detail.scrollTop;
};

// 滚动到顶部
function handleGotoTopChange() {
    scrollTop.value = fixedScrollTop.value;
    nextTick(() => {
        scrollTop.value = 0;
    })
}

// 上拉加载
async function handleScrollTolowerChange(e: any) {
    if (!allowScrollLoad.value) return;
    if (e.detail.direction === "bottom") {
		if (userType.value === 0 || userType.value === 1) {
			if (prjListLoading.value) return; // 在途请求未返回时不翻页，避免跳页
			if (prjList.value.length < prjTotal.value) {
			    model.prjPage++;
			    getPrjDataList();
			} else if (prjList.value.length === prjTotal.value) {
                prjState.value = 'finished';
			}
		}
    }
}

// 管理
function handleProjectFormChange() {
	if (prjList.value.length === 0) {
		return
	}
	projectFormVisible.value = !projectFormVisible.value;
	nextTick(() => {
		if (userType.value === 0 || userType.value === 1) {
			if (projectFormVisible.value) {
				scrollViewHeight.value = scrollViewHeight.value - 55;
			} else {
				scrollViewHeight.value = scrollViewHeight.value + 55;
			}
		}
	})
}

// 全选
function handleCheckAllChange({ value }: { value: boolean }) {
    if (value) {
        prjList.value.forEach((item: any)=>{
            item.checked = true;
        })
    } else {
        prjList.value.forEach((item: any)=>{
            item.checked = false;
        })
    }
}

// 一键提交工程联系单
async function handleInventoryProjectFormChange() {
    try {
        // 提交联络单（status=1）必须已填写大于 0 的周期（自然日），未填写的跳过并提示
        const candidates = checkedAllProjectform.value
            ? prjList.value.filter((item: any) => item.status === 0)
            : prjList.value.filter((item: any) => item.status === 0 && item.checked);
        const queryParams = candidates
            .filter((item: any) => Number(item.period) > 0)
            .map((item: any) => {
                return {
                    id: item.id,
                    status: 1
                }
            });
        const skippedCount = candidates.length - queryParams.length;
        if (queryParams.length === 0) {
            uni.showToast({
                title: skippedCount > 0 ? '所选联络单均未填写周期（自然日），请先修改填写大于 0 的周期后再提交' : '请选择待提交工程联系单',
                icon: 'none',
                duration: 2500
            });
            return false
        }
        message
            .confirm({
                msg: skippedCount > 0 ? ('确定要一键提交工程联系单吗？另有 ' + skippedCount + ' 条未填写周期（自然日）将被跳过') : '确定要一键提交工程联系单吗？',
                title: '提示',
                confirmButtonProps: {
                    type: 'error',
                },
				zIndex: 999
            })
            .then(async () => {
                const data = await fetchUpdatePrjFormInfo(queryParams);
                uni.showToast({
                    title: '一键提交工程联系单成功',
                    icon: 'none',
                    duration: 1500,
					complete: () => {
						model.prjPage = 1;
						getPrjDataList();
					}
                });
            })
            .catch(() => {
                console.log('点击了取消按钮');
            });
    } catch (err) {
        console.error('一键提交工程联系单失败', err);
    }
}

// 一键删除
async function handleDeleteProjectFormChange() {
    try {
        const queryParams = checkedAllProjectform.value ? prjList.value.map((item: any) => {
			return item.id
        }).filter((item: any) => item !== null) : prjList.value.map((item: any) => {
			return item.id
        }).filter((item: any) => item !== null);
		console.log('queryParams', queryParams);
        if (queryParams.length === 0) {
            uni.showToast({
                title: '请选择工程联系单',
                icon: 'none',
                duration: 1500
            });
            return false
        }
        message
            .confirm({
                msg: '确定要删除工程联系单吗？',
                title: '提示',
                confirmButtonProps: {
                    type: 'error',
                },
				zIndex: 999
            })
            .then(async () => {
                const data = await fetchDeletePrjFormInfo(queryParams.join(','));
                uni.showToast({
                    title: '删除工程联系单成功',
                    icon: 'none',
                    duration: 1500,
					complete: () => {
						model.prjPage = 1;
						getPrjDataList();
					}
                });
            })
            .catch(() => {
                console.log('点击了取消按钮');
            });
    } catch (err) {
        console.error('删除工程联系单失败', err);
    }
}

onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 50);
    });
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('resize', recalcTopFixedHeight);
    }
});

onReady(() => {
	// #ifdef APP || APP-PLUS
	uni.hideTabBar();
	// #endif
})

watch(
    () => prjList.value.map(item => item.checked),
    (checkedList) => {
        const checkedCount = checkedList.filter(Boolean).length;
        checkedAllProjectform.value = checkedCount === prjTotal.value
    },
    { deep: true }
)
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
		<wd-navbar :title="(userType === 2 || userType === 3 || userType === 9) ? '待办' : (userType === 0 || userType === 1) ? '工程联系单' : '轨迹'" safe-area-inset-top placeholder fixed :bordered="false">
			<template #right>
				<wd-button type="text" v-if="(userType === 0 || userType === 1) && (hasPermission('project:form:update') || hasPermission('project:form:delete'))" @click="handleProjectFormChange">管理</wd-button>
			</template>
		</wd-navbar>
		
		<view v-if="userType === 2 || userType === 3 || userType === 9">
			<!-- usertype 2：待调试任务 / 待审核事件 -->
			<view v-if="userType === 2" class="tabsFixedWrap" :style="{ top: navStickyTop + 'px', background: isDark ? '#1b1b1b' : '#F5F5F5' }">
				<wd-tabs v-model="activeTab" @change="handleTabsChange">
					<wd-tab title="待调试任务" :badge-props="debugBadgeProps"></wd-tab>
					<wd-tab title="待审核事件" :badge-props="auditBadgeProps"></wd-tab>
				</wd-tabs>
			</view>
			<view v-if="(userType !== 2 || activeTab === 0) && dataList.length > 0">
				<view v-for="(item, index) in dataList" :key="index">
					<view class="todo-card" :class="isDark ? 'dark' : ''" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
						<view class="todo-header">
							<view class="todo-header-left">
								<wd-icon name="list" size="16px" color="#0055FE"></wd-icon>
								<text class="todo-title">待调试业务</text>
							</view>
							<wd-tag v-if="Number(item.status) === 1" type="success" round size="small">正在调试</wd-tag>
							<wd-tag v-else type="warning" round size="small">待调试</wd-tag>
						</view>
						<view class="todo-row">
							<text class="todo-label">项目名称</text>
							<text class="todo-value">{{ item.proname }}</text>
						</view>
						<view class="todo-row">
							<text class="todo-label">调试业务名称</text>
							<text class="todo-value">{{ item.debugname }}</text>
						</view>
						<view class="todo-footer" @click="handleJumpChange('/projectPages/projectdetail/Index?pid=' + item.pid + '&activeTab=2')">
							<text class="todo-goto">{{ Number(item.status) === 1 ? '点击去结束' : '点击去调试' }}</text>
							<wd-icon name="arrow-right" size="14px" color="#909399"></wd-icon>
						</view>
					</view>
				</view>

				<wd-loadmore :state="state" @reload="getDataList" />

				<wd-backtop :bottom="70" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
			</view>
			<view v-else-if="userType !== 2 || activeTab === 0" :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
				<wd-status-tip image="../static/search.png" tip="暂无待办事项" />
			</view>

			<!-- 待审核事件（仅 usertype 2） -->
			<view v-if="userType === 2 && activeTab === 1">
				<view v-if="store.items.length > 0">
					<view v-for="(item, index) in store.items" :key="index" class="todo-card" :class="isDark ? 'dark' : ''" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
						<view class="todo-header">
							<view class="todo-header-left">
								<wd-icon name="list" size="16px" color="#0055FE"></wd-icon>
								<text class="todo-title">待审核事件</text>
							</view>
							<wd-tag :type="(item.type === 0 || item.type === 2) ? 'primary' : 'success'" round size="small">{{ (item.type === 0 || item.type === 2) ? '项目审核' : '调试审核' }}</wd-tag>
						</view>
						<view class="todo-row">
							<text class="todo-label">项目名称</text>
							<text class="todo-value">{{ item.projectname }}</text>
						</view>
						<view class="todo-row" v-if="item.type === 1 || item.type === 3 || item.type === 4">
							<text class="todo-label">调试业务名称</text>
							<text class="todo-value">{{ item.debugname }}</text>
						</view>
						<view class="todo-footer" @click="handleAuditChange(item)">
							<text class="todo-goto">去审核</text>
							<wd-icon name="arrow-right" size="14px" color="#909399"></wd-icon>
						</view>
					</view>
				</view>
				<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
					<wd-status-tip image="../static/search.png" tip="暂无待审核事件" />
				</view>
			</view>
		</view>
		
		<view v-else-if="userType === 0 || userType === 1">
			<view ref="topFixedWrap" class="topFixedWrap" :style="{backgroundColor:isDark ? '#333':'#f5f5f5'}">
				<!-- 搜索框 -->
				<wd-search v-model="model.prjFuzzy" placeholder="请输入项目名或客户名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
					cancel-txt="搜索" @search="handleSearchPrjFuzzyChange" @cancel="handleSearchPrjFuzzyChange" @clear="handleClearPrjFuzzyChange" />

				<scroll-view :scroll-y="true" :scroll-top="scrollTop" :style="{ height: scrollViewHeight + 'px' }" @scroll="handleScrollChange" @scrolltolower="handleScrollTolowerChange">
					<view v-if="prjList.length > 0">
						<view v-for="(dataItem, dataIndex) in prjList" :key="dataIndex" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: dataIndex === prjList.length - 1 ? '20rpx 20rpx 140rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
							<view style="padding: 0 0 0 20rpx;" v-if="(hasPermission('project:form:update') || hasPermission('project:form:delete')) && projectFormVisible">
								<wd-checkbox v-model="dataItem.checked"></wd-checkbox>
							</view>
							<view style="padding: 10rpx; width: calc(100% - 20rpx);">
								<view class="prjInfoHeader">
									<view class="left">
										<wd-text bold :text="dataItem.proname" size="14px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
										<!-- <wd-text v-if="dataItem.ptype === 0" bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
										<wd-text v-if="dataItem.ptype === 1" bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" type="error" :lines="5" /> -->
									</view>
									<view class="right">
										<wd-text bold :text="dataItem.status === 0 ? '未提交' : dataItem.status === 1 ? '已提交' : '未知'" size="14px" :type="dataItem.status === 0 ? 'primary' : dataItem.status === 1 ? 'success' : 'default'" />
										<wd-icon v-if="hasPermission('project:form:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addprjform/Index?id=' + dataItem.id)"></wd-icon>
									</view>
								</view>

								<view @click="handleAddPrjFormChange('/projectPages/prjformdetail/Index?pid=' + dataItem.id + '&proname=' + encodeURIComponent(dataItem.proname))">
									<wd-cell title="调度名称" icon="transfer" custom-class="cellClass">
										<wd-text bold :text="dataItem.dispatch" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>

									<wd-cell title="调试类型" icon="list" custom-class="cellClass">
										<wd-tag type="primary" round>
											{{ dataItem.dtype === 0 ? '现场调试' : dataItem.dtype === 1 ? '远程调试' : dataItem.dtype === 2 ? '无需调试' : '未知' }}
										</wd-tag>
									</wd-cell>

									<wd-cell title="计划调试时间" icon="time" custom-class="cellClass">
										<wd-text bold :text="dataItem.plantime || '--'" size="14px"
											:color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>

									<wd-cell title="周期(自然日)" icon="time" custom-class="cellClass">
										<wd-text bold :text="dataItem.period ? dataItem.period + ' 天' : '-'" size="14px"
											:color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>

									<wd-cell v-if="dataItem.status === 1" title="提交时间" icon="time" custom-class="cellClass">
										<wd-text bold :text="dataItem.sbtime" size="14px"
											:color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>

									<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
										<wd-text bold :text="dataItem.username" size="14px"
											:color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
									
									<wd-cell title="项目地址" icon="location" custom-class="cellClass">
										<wd-text bold :text="dataItem.proaddr" size="14px"
											:color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>

									<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
										<wd-text bold :text="dataItem.username" size="14px"
											:color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell> -->

									<wd-cell title="创建时间" icon="time" custom-class="cellClass">
										<wd-text bold :text="dataItem.dbtime" size="14px"
											:color="isDark ? '#ffffff' : '#000000'" />
									</wd-cell>
								</view>

								<wd-gap bg-color="#cccccc" height="2rpx" v-if="(hasPermission('project:form:update') || hasPermission('project:form:delete')) && (userType === 0 || userType === 1) && dataItem.status === 0"></wd-gap>

								<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', display: 'flex', justifyContent: 'flex-end', marginTop: '10rpx', gap: '0 10rpx' }" v-if="(hasPermission('project:form:update') || hasPermission('project:form:delete')) && (userType === 0 || userType === 1) && dataItem.status === 0">
									<wd-button v-if="hasPermission('project:form:delete') && dataItem.status === 0 && (userType === 0 || userType === 1)" size="small" type="error" @click.stop="handleDeletePrjChange(dataItem.id)">删除</wd-button>
									<wd-button v-if="hasPermission('project:form:update') && dataItem.status === 0 && (userType === 0 || userType === 1)" size="small" type="primary" @click.stop="handleSubmitPrjChange(dataItem.id, 1)">提交</wd-button>
								</view>
							</view>
						</view>

						<!-- <wd-loadmore :state="prjState" @reload="getPrjDataList" /> -->
					</view>
					<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx' }">
						<wd-status-tip image="../static/search.png" tip="暂无数据" />
					</view>

					<wd-fab draggable v-if="hasPermission('project:form:insert')" :disabled="clickLock" position="right-bottom" :gap="{ bottom: 70 }" :expandable="false" @click="handleAddPrjFormChange('/projectPages/addprjform/Index')"></wd-fab>

					<wd-backtop :bottom="135" :scrollTop="fixedScrollTop" :zIndex="99" customStyle="background: #007aff; color:white;" @click="handleGotoTopChange"></wd-backtop>
				</scroll-view>
				
				<view v-if="projectFormVisible" style="width: calc(100vw - 40rpx); padding: 10rpx 20rpx; position: fixed; left: 0; bottom: 130rpx; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center;">
					<wd-checkbox v-model="checkedAllProjectform" @change="handleCheckAllChange">全选</wd-checkbox>
					<view style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<wd-button v-if="hasPermission('project:form:delete')" type="error" @click="handleDeleteProjectFormChange">删除</wd-button>
						<wd-button v-if="hasPermission('project:form:update')" type="success" @click="handleInventoryProjectFormChange">一键提交调试单</wd-button>
					</view>
				</view>
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
	</wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    width: 100%;
    z-index: 99;
    box-sizing: border-box;
}

/* usertype 2 待办页 tabs 吸顶 */
.tabsFixedWrap {
    position: sticky;
    left: 0;
    width: 100%;
    z-index: 99;
    box-sizing: border-box;
}

.tabsFixedWrap :deep(.wd-tabs__container) {
    background: transparent !important;
}

/* 蓝标横杠：禁用 wd-tabs 内部靠 getRect 异步测量定位的横杠，改用跟随 .is-active 的伪元素。
   位置由 DOM 决定（始终在激活项内），不会因测量时序错位，也不会触发组件递归更新。 */
.tabsFixedWrap :deep(.wd-tabs__line) {
    display: none !important;
}

.tabsFixedWrap :deep(.wd-tabs__nav-item) {
    position: relative !important;
}

.tabsFixedWrap :deep(.wd-tabs__nav-item::after) {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    width: 40rpx;
    height: 4px;
    border-radius: 2px;
    background: #0055FE;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
}

.tabsFixedWrap :deep(.wd-tabs__nav-item.is-active::after) {
    opacity: 1;
}

.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 10rpx 0 !important;
    margin-bottom: 20rpx;

    .left {
        display: flex;
        word-break: break-all;
        align-items: center;
        margin-left: 10rpx;
        width: calc(100vw - 280rpx);
    }

    .right {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        gap: 0 10rpx;
    }
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}

.todo-card {
    width: calc(100vw - 40rpx);
    margin: 20rpx;
    border-radius: 20rpx;
    padding: 20rpx;
    box-sizing: border-box;
}

.todo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
}

.todo-header-left {
    display: flex;
    align-items: center;
    gap: 10rpx;
}

.todo-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
}

.todo-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    padding: 6rpx 0;
}

.todo-label {
    font-size: 26rpx;
    color: #909399;
    flex-shrink: 0;
}

.todo-value {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
    text-align: right;
    word-break: break-all;
    flex: 1;
}

.todo-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6rpx;
    margin-top: 10rpx;
    padding-top: 14rpx;
    border-top: 1rpx solid #ECECEC;
}

.todo-goto {
    font-size: 24rpx;
    color: #909399;
}

/* 暗色适配 */
.todo-card.dark .todo-title,
.todo-card.dark .todo-value {
    color: #e5e6eb;
}

.todo-card.dark .todo-label,
.todo-card.dark .todo-goto {
    color: #c0c4cc;
}

.todo-card.dark .todo-footer {
    border-top-color: #333333;
}
</style>