<script lang="ts" setup>
	import { useToast, useMessage } from 'wot-design-uni';
	import { reactive, ref, onMounted, nextTick, computed, onUnmounted } from 'vue';
	import { useI18n } from 'vue-i18n';
	import { hasPermission } from '@/utils/index';
	import { onReady, onLoad, onShow, onPageScroll, onPullDownRefresh, onReachBottom, onUnload } from '@dcloudio/uni-app';
	import { useTheme } from '@/composables/theme/theme';
	import { useLargeArrayStore } from '@/store/useDataStore';
	import { useTabbar } from '@/composables/useTabbar';

	const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

	const { t } = useI18n();

	const store = useLargeArrayStore();

	const { themeVars, theme } = useTheme();

	const message = useMessage();

	const clickLock = ref<boolean>(false);

	const isDark = computed(() => theme.value === 'dark');

	const userType = ref<any>(uni.getStorageSync('usertype'));

	const activeTab = ref<number>(0);

	const tabsList = ref<{ title : string; badgeProps : any; }[]>([
		{
			title: '项目',
			badgeProps: {
				modelValue: 0,
				right: '-8px',
				showZero: false
			}
		},
		{
			title: '调试',
			badgeProps: {
				modelValue: 0,
				right: '-8px',
				showZero: false
			}
		}
	]);

	// 项目
	const projectDataList = ref<any[]>([]);
	const storeProjectDataList = ref<any[]>([]);
	// 调试
	const debugDataList = ref<any[]>([]);
	const storeDebugDataList = ref<any[]>([]);
	const scrollTop = ref<number>(0);

	// 顶部固定区域高度（px）
	const topFixedHeight = ref<number>(0);

	const dataForm = reactive<{
		fuzzy : string;
	}>({
		fuzzy: '',
	});

	function handleClickLeft() {
		// #ifdef H5
		history.go(-1);
		// #endif

		// #ifndef H5
		uni.navigateBack();
		// #endif
	}

	// 清除
	function handleClearChange() {
		// projectDataList.value = storeProjectDataList.value;
		// debugDataList.value = storeDebugDataList.value;
		// tabsList.value[0].badgeProps.modelValue = projectDataList.value.length;
		// tabsList.value[1].badgeProps.modelValue = debugDataList.value.length;
		dataForm.fuzzy = '';
		applySearchFilter();
		updateBadge();
	}

	// 搜索
	function handleSearchChange() {
		// if (activeTab.value === 0) {
		// 	if (dataForm.fuzzy) {
		// 		projectDataList.value = storeProjectDataList.value.filter((item : any) => item.projectname.toLocaleLowerCase().indexOf(dataForm.fuzzy) !== -1);
		// 	} else {
		// 		projectDataList.value = storeProjectDataList.value;
		// 	}
		// } else {
		// 	if (dataForm.fuzzy) {
		// 		debugDataList.value = storeDebugDataList.value.filter((item : any) => item.projectname.toLocaleLowerCase().indexOf(dataForm.fuzzy) !== -1 || (item.debugname && item.debugname.toLocaleLowerCase().indexOf(dataForm.fuzzy) !== -1));
		// 	} else {
		// 		debugDataList.value = storeDebugDataList.value;
		// 	}
		// }
		// tabsList.value[0].badgeProps.modelValue = projectDataList.value.length;
		// tabsList.value[1].badgeProps.modelValue = debugDataList.value.length;
		// fullSync();
		applySearchFilter();
		updateBadge();
	}

	// 监听 store 中的 action，精确更新本地数据（不整体刷新）
	const unsubscribe = store.$onAction(({ name, args, after }) => {
		if (name === 'addItem') {
			const newItem = args[0]
			// 根据新项类型，直接 push 到对应的 store 分类数组
			if (newItem.type === 0 || newItem.type === 2) {
				storeProjectDataList.value.push(newItem)
				if (!dataForm.fuzzy || newItem.projectname?.toLowerCase().includes(dataForm.fuzzy)) {
					projectDataList.value.push(newItem)
				}
			} else if (newItem.type === 1 || newItem.type === 3 || newItem.type === 4) {
				storeDebugDataList.value.push(newItem)
				if (!dataForm.fuzzy ||
					newItem.projectname?.toLowerCase().includes(dataForm.fuzzy) ||
					newItem.debugname?.toLowerCase().includes(dataForm.fuzzy)) {
					debugDataList.value.push(newItem)
				}
			}
			updateBadge();
		} else if (name === 'removeItemById') {
			const id = args[0]
			// 从所有本地数组中删除该 id 的项
			const removeFrom = (arr : any[]) => {
				const idx = arr.findIndex(i => i.id === id)
				if (idx !== -1) arr.splice(idx, 1)
			}
			removeFrom(storeProjectDataList.value)
			removeFrom(storeDebugDataList.value)
			removeFrom(projectDataList.value)
			removeFrom(debugDataList.value)
			updateBadge()
		} else if (name === 'removeItemByProname') {
			console.log('args', args);
			// const id = args[0]
			// // 从所有本地数组中删除该 id 的项
			// const removeFrom = (arr : any[]) => {
			// 	const idx = arr.findIndex(i => i.id === id)
			// 	if (idx !== -1) arr.splice(idx, 1)
			// }
			// removeFrom(storeProjectDataList.value)
			// removeFrom(storeDebugDataList.value)
			// removeFrom(projectDataList.value)
			// removeFrom(debugDataList.value)
			// updateBadge()
		} else if (name === 'clearList') {
			// 清空所有本地数据
			projectDataList.value = []
			debugDataList.value = []
			storeProjectDataList.value = []
			storeDebugDataList.value = []
			updateBadge();
		}
		else if (name === 'setList') {
			// 整体替换，需要全量刷新（这种情况较少，滚动会重置，可接受）
			fullSync();
		}
	})
	
	function updateBadge() {
		tabsList.value[0].badgeProps.modelValue = projectDataList.value.length;
		tabsList.value[1].badgeProps.modelValue = debugDataList.value.length;
	}

	// 从 store 全量同步（用于初始化或清空后的重置）
	function fullSync() {
		const list = store.items;
		console.log('listlistlist', list);
		storeProjectDataList.value = list.filter((item: any) => item.type === 0 || item.type === 2);
		storeDebugDataList.value = list.filter((item: any) => item.type === 1 || item.type === 3 || item.type === 4);
		applySearchFilter();
		updateBadge();
	}
	
	// 根据搜索词过滤
	function applySearchFilter() {
		projectDataList.value = dataForm.fuzzy
		  ? storeProjectDataList.value.filter(item => item.projectname?.toLowerCase().includes(dataForm.fuzzy))
		  : storeProjectDataList.value;
		debugDataList.value = dataForm.fuzzy
		  ? storeDebugDataList.value.filter(item => 
			  item.projectname?.toLowerCase().includes(dataForm.fuzzy) ||
			  item.debugname?.toLowerCase().includes(dataForm.fuzzy))
		  : storeDebugDataList.value;
		console.log('projectDataListprojectDataListprojectDataList', projectDataList.value);
		console.log('debugDataListdebugDataListdebugDataListdebugDataList', debugDataList.value);
		// if (activeTab.value === 0) {
		// 	projectDataList.value = dataForm.fuzzy
		// 	  ? storeProjectDataList.value.filter(item => item.projectname?.toLowerCase().includes(dataForm.fuzzy))
		// 	  : storeProjectDataList.value
		// } else {
		// 	debugDataList.value = dataForm.fuzzy
		// 	  ? storeDebugDataList.value.filter(item => 
		// 		  item.projectname?.toLowerCase().includes(dataForm.fuzzy) ||
		// 		  item.debugname?.toLowerCase().includes(dataForm.fuzzy))
		// 	  : storeDebugDataList.value
		// }
	}
	
	// 获取用户列表信息
	// const getDataList = () => {
	// 	try {
	// 		const list = store.getList();
	// 		if (list.length === 0) {
	// 			projectDataList.value = [];
	// 			storeProjectDataList.value = [];
	// 			debugDataList.value = [];
	// 			storeDebugDataList.value = [];
	// 		} else {
	// 			storeProjectDataList.value = list.filter((item : any) => item.type === 0 || item.type === 2);
	// 			if (dataForm.fuzzy) {
	// 				projectDataList.value = storeProjectDataList.value.filter((item : any) => item.projectname.toLocaleLowerCase().indexOf(dataForm.fuzzy) !== -1);
	// 			} else {
	// 				projectDataList.value = storeProjectDataList.value;
	// 			}
	// 			storeDebugDataList.value = list.filter((item : any) => item.type === 1 || item.type === 3 || item.type === 4);
	// 			if (dataForm.fuzzy) {
	// 				debugDataList.value = storeDebugDataList.value.filter((item : any) => item.projectname.toLocaleLowerCase().indexOf(dataForm.fuzzy) !== -1 || (item.debugname && item.debugname.toLocaleLowerCase().indexOf(dataForm.fuzzy) !== -1));
	// 			} else {
	// 				debugDataList.value = storeDebugDataList.value;
	// 			}
	// 			tabsList.value[0].badgeProps.modelValue = projectDataList.value.length;
	// 			tabsList.value[1].badgeProps.modelValue = debugDataList.value.length;
	// 		}
	// 	} catch (err) {
	// 		console.error('获取用户列表失败', err);
	// 	}
	// }

	// 去审核
	function handleAuditChange(item : any, type : string) {
		console.log('item', item);
		if (clickLock.value) return;
		clickLock.value = true;
		if (type === 'project') {
			setTabbarItemActive('project');
			uni.setStorageSync('projectname', item.projectname);
			uni.switchTab({
				url: '/pages/project',
				complete: () => {
					clickLock.value = false;
				}
			})
		} else {
			let url = '/projectPages/projectdetail/Index?pid=' + item.proid + '&activeTab=2';
			uni.navigateTo({
				url,
				complete: () => {
					clickLock.value = false;
				}
			})
		}
	}

	// 重新计算 .topFixedWrap 的真实高度（像素）
	function recalcTopFixedHeight() {
		// use createSelectorQuery 获取真实高度（适配小程序/APP/H5）
		try {
			uni.createSelectorQuery()
				.select('.topFixedWrap')
				.boundingClientRect((rect : any) => {
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

	onLoad(() => {
		fullSync();
	});

	onShow(() => {
		// getDataList();
		// fullSync();
	})

	onReady(() => {
		recalcTopFixedHeight();
	})

	onPageScroll((e) => {
		scrollTop.value = e.scrollTop;
	});

	onPullDownRefresh(() => {
		// getDataList();
		fullSync();
		setTimeout(() => {
			uni.hideNavigationBarLoading(); // 完成停止加载
			uni.stopPullDownRefresh();
		}, 1000);
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

	// 组件卸载时取消监听
	onUnmounted(() => {
		unsubscribe();
	})
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh;" :theme="theme">
		<wd-message-box />

		<!-- 占位：顶部固定区域高度（动态计算） -->
		<view :style="{ height: topFixedHeight + 'px' }"></view>

		<view class="topFixedWrap">
			<wd-navbar left-arrow title="待审核列表" safe-area-inset-top placeholder :bordered="false"
				@click-left="handleClickLeft" />
			<wd-search v-model="dataForm.fuzzy" placeholder="请输入要搜索的内容"
				:placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索"
				@search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
			<wd-tabs v-model="activeTab">
				<wd-tab v-for="(item, index) in tabsList" :key="index" :title="item.title"
					:badge-props="item.badgeProps"></wd-tab>
			</wd-tabs>
		</view>

		<view style="margin: 20rpx;">
			<scroll-view scroll-y>
				<view v-if="activeTab === 0">
					<view v-if="projectDataList.length > 0">
						<wd-cell-group>
							<wd-cell center custom-class="cellWrap" :title="item.projectname"
								v-for="(item, index) in projectDataList" :key="index">
								<template #default>
									<wd-button size="small" type="primary"
										@click="handleAuditChange(item, 'project')">去审核</wd-button>
								</template>
							</wd-cell>
						</wd-cell-group>
					</view>
				</view>

				<view v-if="activeTab === 1">
					<view v-if="debugDataList.length > 0">
						<view v-for="(item, index) in debugDataList" :key="index"
							:style="{ margin: index === 0 ? 0 : '20rpx 0' }" class="debugWrap">
							<wd-cell center title="项目名称" :value="item.projectname"></wd-cell>
							<wd-cell center title="调试任务名称" :value="item.debugname"></wd-cell>
							<wd-cell>
								<template #default>
									<wd-button size="small" type="primary"
										@click="handleAuditChange(item, 'debug')">去审核</wd-button>
								</template>
							</wd-cell>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<wd-backtop :bottom="110" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
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
		/* 保证内联元素正确换行 */
		box-sizing: border-box;
		/* 可选：微阴影让固定区更明显 */
		/* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
	}

	:deep(.wd-cell__title) {
		font-weight: bolder !important;
		width: calc(100vw - 240rpx);
	}

	:deep(.wd-cell__value) {
		// color: dimgrey !important;
		font-size: 26rpx !important;
		font-weight: bold !important;
	}

	.cellWrap {
		margin: 20rpx 0 !important;
	}

	.cellWrap:first-child {
		margin: 0 !important;
	}

	:deep(.wd-cell-group) {
		background: transparent !important;
	}

	:deep(.wd-cell-group__body) {
		background: transparent !important;
	}

	.debugWrap {
		:deep(.wd-cell__title) {
			font-weight: normal !important;
			width: 180rpx !important;
		}
	}
</style>