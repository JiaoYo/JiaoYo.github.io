<script lang="ts" setup>
	import { useToast, useMessage } from 'wot-design-uni';
	import { FormRules } from 'wot-design-uni/components/wd-form/types';
	import { reactive, ref, onMounted, computed, nextTick } from 'vue';
	import { useI18n } from 'vue-i18n';
	import { hasPermission } from '@/utils/index';
	import { onReady, onLoad, onUnload } from '@dcloudio/uni-app';
	import { useTheme } from '@/composables/theme/theme';
	import { fetchGetAftersaleMiddleDataList, fetchGetAftersaleReasonDataList, fetchSaveAftersaleMiddleInfo, fetchDeleteAftersaleMiddleInfo } from '@/service/index';

	const { t } = useI18n();

	const { themeVars, theme } = useTheme();

	const message = useMessage();

	const isDark = computed(() => theme.value === 'dark');

	const userId = ref<number>(uni.getStorageSync('userId'));
	
	const userType = ref<number>(uni.getStorageSync('usertype'));
	
	// 顶部固定区域高度（px）
	const topFixedHeight = ref<number>(0);
	
	const loading = ref<boolean>(false);
	
	// 售后原因弹框
	const reidShow = ref<boolean>(false);
	const reidTriggered = ref<boolean>(false);

	const model = reactive<{
		sid: any;
		reidPage: number;
		reidLimit: number;
		reidTotal: number;
		reidFuzzy: string;
		checkedReidNames: string;
		checkedReid: any;
		reidDataList: any;
		storeCheckedReid: any;
		storeReMap: any;
	}>({
		sid: [],
		reidPage: 1,
		reidLimit: 100,
		reidTotal: 0,
		reidFuzzy: '',
		checkedReidNames: '',
		checkedReid: [],
		reidDataList: [],
		storeCheckedReid: [],
		storeReMap: {}
	})

	function handleClickLeft() {
		// #ifdef H5
		history.go(-1);
		// #endif

		// #ifndef H5
		uni.navigateBack();
		// #endif
	}
	
	// 打开弹出层(售后原因)
	function handleLinkShowChange() {
	    reidShow.value = true;
	}
	
	// 清除(售后原因)
	function handleClearFuzzyChange() {
		model.reidPage = 1;
		getReDataList();
	}
	
	// 搜索(售后原因)
	function handleSearchFuzzyChange() {
		model.reidDataList = 1;
		getReDataList();
	}
	
	// 获取分页数据(售后原因)
	async function getReDataList() {
	    if (model.reidPage === 1) {
	        model.reidDataList = [];
	    }
	    try {
	        const data = await fetchGetAftersaleReasonDataList({ page: model.reidPage, limit: model.reidLimit, fuzzy: model.reidFuzzy });
	        model.reidTotal = Number(data.total);
	        model.reidDataList = model.reidDataList.concat(data.list);
	    } catch (error) {
	        console.error('获取售后原因数据失败', error);
	    }
	}
	
	// 刷新(售后原因)
	function handleScrollRefreshChange() {
	    reidTriggered.value = true;
	    model.reidPage = 1;
	    getReDataList();
	    setTimeout(() => {
	        reidTriggered.value = false;
	        console.log('刷新完成');
	    }, 1000)
	}
	
	// 滚动到底部(售后原因)
	function handleScrolltolowerChange(e: any) {
	    console.log('e', e);
	    if (e.detail.direction === 'bottom' && model.reidDataList.length < model.reidTotal) {
	        model.reidPage++;
	        getReDataList();
	    }
	}
	
	// 关闭弹出层(售后原因)
	function handleCloseReChange() {
	    reidShow.value = false;
	}
	
	// 选择售后原因
	function handleCheckSelectChange({ value }: { value: any }) {
	    console.log('value', value);
		const names = model.reidDataList
		  .filter((item: any) => value.includes(item.id) && item.rs)
		  .map((item: any) => item.rs);
		model.checkedReidNames = names.length > 0 ? names.join(",") : "";
	}
	
	// 格式化售后原因
	function formatReNames(list: any) {
		let renames: string = '';
		if (list.length === 0) {
			return renames
		}
		list.forEach((item: any) => {
			renames+=item.rs + ','
		});
		return renames.substring(0, renames.length - 1)
	}
	
	/**
	 * 对比两个数组，找出新增和删除的ID
	 * @param {Array} previousArr - 之前的数组
	 * @param {Array} currentArr - 当前的数组
	 * @returns {Object} 包含新增和删除的ID的对象
	 */
	function compareArrays(previousArr, currentArr) {
	    // 使用Set提高查找性能
	    const previousSet = new Set(previousArr);
	    const currentSet = new Set(currentArr);
	    
	    // 找出新增的ID（在当前数组中存在，但在之前数组中不存在）
	    const addedIds = currentArr.filter(id => !previousSet.has(id));
	    
	    // 找出删除的ID（在之前数组中存在，但在当前数组中不存在）
	    const removedIds = previousArr.filter(id => !currentSet.has(id));
	    
	    return {
	        added: addedIds,
	        removed: removedIds
	    };
	}
	
	// 提交
	async function handleSubmitChange() {
		// 假设这是你的数据
		const previousIds = model.storeCheckedReid; // 之前的ID数组
		const currentIds = model.checkedReid; // 当前选中的ID数组
		// 使用方法
		const result = compareArrays(previousIds, currentIds);
		if (result.added.length > 0) {
			let queryAddParams = result.added.map(item => {
				return {
					afid: model.sid,
					reid: item
				}
			})
			await fetchSaveAftersaleMiddleInfo(queryAddParams);
		}
		
		if (result.removed.length > 0) {
			let queryDeleteParams = result.removed.map(item => {
				return model.storeReMap[item]
			})
			
			await fetchDeleteAftersaleMiddleInfo(queryDeleteParams.join(","));
		}
		
		uni.showToast({
			icon: "none",
			title: "修改成功",
			duration: 1500
		})
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

	onLoad(async (options: any) => {
		if (JSON.stringify(options) !== '{}') {
			model.sid = Number(options.sid);
			model.checkedReid = [];
			model.storeCheckedReid = [];
			model.storeReMap = {};
			if (!hasPermission('aftermarket:middle:select')) {
				return
			}
			const data = await fetchGetAftersaleMiddleDataList({ page: 1, limit: 500, afid: model.sid });
			if (data.hasOwnProperty('list')) {
				data.list.forEach((item: any) => {
					model.checkedReid.push(item.reid);
					model.storeCheckedReid.push(item.reid);
					model.checkedReidNames += item.rs + ',';
					model.storeReMap[item.reid] = item.id;
				});
				model.checkedReidNames = model.checkedReidNames.substring(0, model.checkedReidNames.length - 1);
			}
		}
		await getReDataList();
	});

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

		<view class="topFixedWrap" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-navbar left-arrow title="售后原因" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
		    <view style="display: flex; align-items: center;">
		        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		        <view style="margin-left: 10rpx; font-weight: bolder;">售后原因</view>
		    </view>
		    <view>
		        <wd-button icon="link" size="small"  @click="handleLinkShowChange">关联售后原因</wd-button>
		    </view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 20rpx', borderRadius: '20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: isDark ? '#FFFFFF' : '#000000' }">
		    <wd-textarea readonly v-model="model.checkedReidNames" placeholder="请输入售后原因" no-border custom-class="reLinkedWrap"></wd-textarea>
		</view>
		
		<view class="buttonWrap" v-if="hasPermission('aftermarket:middle:insert') || hasPermission('aftermarket:middle:delete')">
		    <wd-button hairline type="primary" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" :loading="loading" @click="handleSubmitChange">提交</wd-button>
		</view>
		
		<!-- 网关型号 -->
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="reidShow" position="left" @close="handleCloseReChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="model.reidFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="reidTriggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" :style="{ height: 'calc(100vh - 260rpx)' }">
				<wd-cell-group border>
				    <wd-checkbox-group v-model="model.checkedReid" @change="handleCheckSelectChange">
				        <wd-cell v-for="(item, index) in model.reidDataList" :key="index" :title="item.rs" center>
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
		z-index: 98;
		background-color: #FFFFFF;
		// 保证内联元素正确换行
		box-sizing: border-box;
		// 可选：微阴影让固定区更明显
		// box-shadow: 0 1px 6px rgba(0,0,0,0.06);
	}
	
	.reLinkedWrap {
	    width: calc(100% - 100rpx) !important;
	
	    :deep(.wd-textarea__inner) {
			padding-left: 0rpx !important;
	    }
	}
	
	.buttonWrap {
	    display: flex;
	    justify-content: center;
	    align-items: center;
	    width: calc(100vw - 40rpx);
	    margin: 30rpx 40rpx 30rpx 0;
	    padding: 0 0 40rpx 20rpx;
	}
	
	.darkButtonWrap {
	    width: 100% !important;
	}
	
	.lightButtonWrap {
	    width: 100% !important;
	}
</style>