<script lang="ts" setup>
import { throttle } from "@/utils/debounce";
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission, getSystemDate, getCurrentWeekDates } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetProjectTeamDataList, fetchDeleteProjectTeamInfo, fetchGetAllUserDataList } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const clickLock = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const options = ref<any>(hasPermission('project:team:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);
const selectedIndex = ref<number>(0);
const userId = ref<number>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));
const triggered = ref<boolean>(false);
const allUserDataList = ref<any>([]);
const participantsLoading = ref<boolean>(false);
const participantsShow = ref<boolean>(false);
const originSelectedParticipantsIdList = ref<any[]>([]);
const selectedParticipantsIdList = ref<any[]>([]);

const model = reactive<{
    page: number;
	limit: number;
    total: number;
    fuzzy: string;
}>({
    page: 1,
	limit: 20,
    total: 0,
    fuzzy: '',
})

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
    model.fuzzy = "";
    model.page = 1;
    getDataList();
}

// 搜索
function handleSearchChange() {
    model.fuzzy = "";
    model.page = 1;
    getDataList();
}

// 获取项目分组信息
const getDataList = throttle(async () => {
    try {
        if (model.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = { page: model.page, limit: model.limit };
		if (model.fuzzy) {
			queryParams['fuzzy'] = model.fuzzy;
		}
        const data = await fetchGetProjectTeamDataList(queryParams);
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取项目分组列表失败', err);
        state.value = 'error';
    }
}, 1000, { leading: true, trailing: true })

// 删除项目分组
async function handleDeleteChange(item: any, index: number) {
    console.log('item', item);
    console.log('index', index);
    try {
        message
        .confirm({
            msg: '确定要删除该项目分组吗?',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeleteProjectTeamInfo(item.id);
            model.page  = 1;
            getDataList();
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (err) {
        console.error('删除项目分组失败', err);
    }
}

// 项目分组
function handleAddProjectgroupChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false;
		}
    });
}

// 页面跳转
function handleJumpPageChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false;
		}
    })
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

onLoad(async() => {
	await getDataList();
	getAllUserDataList();
    uni.$on('refreshListPrjTeam', getDataList); // 监听刷新事件
});

onReady(() => {
    recalcTopFixedHeight();
})

onUnload(() => {
    uni.$off('refreshListPrjTeam', getDataList); // 页面销毁时解绑
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    model.page = 1;
    getDataList();
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

// 获取所有用户列表
async function getAllUserDataList() {
	const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
	allUserDataList.value = data.list.filter(item => item.status !== 1);
	console.log('allUserDataListallUserDataListallUserDataList', allUserDataList);
}

// 打开查看组员信息弹框
async function handleParticipantsPopupChange(item) {
	originSelectedParticipantsIdList.value = [];
	selectedParticipantsIdList.value = [];
	item.list.forEach((item: any) => {
		selectedParticipantsIdList.value.push(item.id);
		originSelectedParticipantsIdList.value.push(item.id);
	});
	// await getProjectParticipantDataList();
	participantsLoading.value = false;
	participantsShow.value = true;
}

// 打开项目参与人弹框
async function handleParticipantsSubmitChange() {
	const newIds = selectedParticipantsIdList.value || [];
	const oldIds = originSelectedParticipantsIdList.value || [];
	// 新增的用户
	const addIds = newIds.filter(id => !oldIds.includes(id));
	// 删除的用户
	const delIds = oldIds.filter(id => !newIds.includes(id));
	if (addIds.length === 0 && delIds.length === 0) {
		participantsShow.value = false;
		return
	}
	participantsLoading.value = true;
	try {
	    if (addIds.length > 0) {
			const data = await fetchSaveProjectParticipantInfo(addIds.map((item:any)=>({ pid: prjDetailInfo.id, participant:item })))
	    }
	    if (delIds.length > 0){
			const ids = prjDetailInfo.projectParticipantDataList.filter((item:any) => delIds.includes(item.participant)).map((row: any) => row.id).join(',');
			if (ids.length > 0) {
				const data1 = await fetchDeleteProjectParticipantInfo(ids);
			}
	    }
		participantsShow.value = false;
		participantsLoading.value = false;
		model.page = 1;
	    await getDataList();
	} catch (err) {
	    console.error(err);
		participantsLoading.value = false;
	}
}
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="项目分组列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

            <wd-search v-model="model.prjName" placeholder="请输入项目分组名称" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
        </view>

		<view style="margin: 20rpx;">
			<view v-if="dataList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item class="list-item" v-for="(item, index) in dataList" :key="index" :right-options="options" @click="handleDeleteChange(item, index)">
						<wd-cell custom-title-class="wd-cell__title_else" center>
							<template #title>
								<view style="display: flex; align-items: center; gap: 0 10rpx;">
									<view style="direction: inline-block; font-weight: bolder;">{{ item.tname }}</view>
								</view>
							</template>
							<view style="display: flex; align-items: center; gap: 10rpx; justify-content: flex-end;">
								<view style="direction: inline-block;">{{ item.dbtime }}</view>
								<wd-icon name="edit" size="22px" :color="isDark ? '#ffffff' : '#000000'" v-if="userType === 0 && hasPermission('project:team:update')" @click.stop="handleAddProjectgroupChange('/mePages/addprojectgroup/Index?id=' + item.id)"></wd-icon>
							</view>
						</wd-cell>
						<wd-cell v-if="item.leadername" title="组长" :value="item.phnum" custom-title-class="wd-cell__title_else">
							<view style="display: flex; align-items: center; gap: 10rpx; justify-content: flex-end;">
								<wd-text bold :text="item.leadername" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
							</view>
						</wd-cell>
						<wd-cell title="组成员数" :value="item.udesc" is-link clickable @click="handleParticipantsPopupChange(item)">
							<wd-text bold :text="item.list.length" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
						</wd-cell>
					</uni-swipe-action-item>
				</uni-swipe-action>

				<wd-loadmore :state="state" @reload="getDataList" />

				<wd-backtop :bottom="110" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', height: 'calc(100vh - 320rpx)' }">
				<wd-status-tip image="../../static/search.png" tip="暂无项目分组列表" />
			</view>

			<wd-fab v-if="hasPermission('project:team:insert')" :disabled="clickLock" draggable :zIndex="9" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleAddProjectgroupChange('/mePages/addprojectgroup/Index')"></wd-fab>
		</view>
		
		<wd-popup closable :z-index="99" v-model="participantsShow" custom-style="width: 90%; border-radius:32rpx; padding: 20rpx; min-height: 400rpx; max-height: 900rpx;" @close="participantsShow = false;">
			<wd-text bold text="项目组成员" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			
			<wd-gap height="20rpx"></wd-gap>
			
			<!-- <wd-row gutter="20">
				<wd-col :span="6" v-for="(item, index) in participantsUserDataList" :key="index" style="margin-bottom: 20rpx;">
					<wd-tag type="primary" round>
						{{ item.username }}
					</wd-tag>
				</wd-col>
			</wd-row> -->
			
			<wd-checkbox-group cell v-model="participantsUserDataList">
				<wd-checkbox v-for="(item, index) in allUserDataList" :key="index" :modelValue="item.id" shape="button">{{ item.username }}</wd-checkbox>
			</wd-checkbox-group>
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

.list-item {
    color: #464646;
    // border-bottom: 2rpx dashed #ccc;
	margin: 20rpx 0;
	border-radius: 20rpx;
}

.list-item:first-child {
	margin-top: 0 !important;
}

.action {
    height: 100%;
    display: flex;
    align-items: center;
}

.button {
    display: flex;
    padding: 0 11px;
    height: 100%;
    color: white;
    justify-content: center;
    align-items: center;
}

// :deep(.wd-cell__title) {
//     font-weight: bolder !important;
// }

:deep(.wd-cell__value) {
    color: dimgrey !important;
    font-size: 26rpx !important;
	font-weight: bold !important;
    // font-weight: normal !important;
}
</style>
