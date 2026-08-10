<script lang="ts" setup>
import { hasPermission } from '@/utils/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import { reactive, ref, computed, nextTick, onMounted } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { fetchGetProjectTeamInfo, fetchSaveProjectTeamInfo, fetchUpdateProjectTeamInfo, fetchGetAllUserDataList } from '@/service/index';

const form = ref();
const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const userShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    total: number;
    fuzzy: string;
    userDataList: any;
    allUserDataList: any;
    checkedUser: any;
}>({
    page: 1,
    total: 0,
    fuzzy: '',
    userDataList: [],
    allUserDataList: [],
    checkedUser: null
})

const model = reactive<{
	id: number;
    tname: string;
	uname: string;
}>({
    id: 0,
    tname: '',
	uname: ''
})

const rules: FormRules = {
    tname: [
        {
            required: true,
            message: '请输入组名',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入组名');
                }
            }
        },
    ],
    uname: [
        {
            required: true,
            message: '请选择组长',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择组长');
                }
            }
        },
    ],
};

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrjTeam'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 打开人员弹框
function handleLinkUserShowChange() {
    userShow.value = true;
}

// 清除
function handleClearUserFuzzyChange() {
    // model.page = 1;
    // getAlluserDataList();
    dataForm.userDataList = dataForm.allUserDataList;
}

// 搜索
function handleSearchUserFuzzyChange() {
    // model.page = 1;
    // getAlluserDataList();
    dataForm.userDataList = dataForm.allUserDataList.filter((item: any) => item.username.indexOf(dataForm.fuzzy) !== -1);
}

// 获取用户分页数据
async function getAlluserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            dataForm.userDataList = [];
            dataForm.allUserDataList = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: 100, usertypes: "2, 3, 9" });
        dataForm.total = Number(data.total);
        dataForm.userDataList = dataForm.userDataList.concat(data.list).filter((item: any) => item.status === 0);
        dataForm.allUserDataList = dataForm.allUserDataList.concat(data.list).filter((item: any) => item.status === 0);
    } catch (error) {
        console.error('获取用户分页数据失败', error);
    }
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.page = 1;
    getAlluserDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && dataForm.allUserDataList.length < dataForm.total) {
        dataForm.page++;
        getAlluserDataList();
    }
}

// 关闭弹出层
function handleUserCloseChange() {
    userShow.value = false;
}

// 选择用户
function handleRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    userShow.value = false;
    // 获取对应名称
    const names = dataForm.allUserDataList.find((item: any) => value === item.id);
    model.uname = names ? names.username : '';
}

// 清除选中的用户
function handleClearSelectUserChange() {
	model.uname = "";
	dataForm.checkedUser = null;
}

// 获取项目分组信息
async function getInfo() {
	try {
		const data = await fetchGetProjectTeamInfo({ id: model.id });
		model.tname = data.tname;
		dataForm.checkedUser = data.teamleader;
		const names = dataForm.allUserDataList.find((item: any) => dataForm.checkedUser === item.id);
		console.log('names', dataForm.allUserDataList);
		console.log('names', dataForm.checkedUser, typeof dataForm.checkedUser);
		console.log('names', names);
		model.uname = names ? names.username : '';
	} catch (error) {
		console.log('获取项目分组信息失败', error);
	}
}

async function handleSubmitChange() {
    if (!model.tname) {
        uni.showToast({
            icon: 'none',
            title: '请输入组名',
            duration: 1500
        })
        return false
    }
	if (!model.uname) {
	    uni.showToast({
	        icon: 'none',
	        title: '请选择组长',
	        duration: 1500
	    })
	    return false
	}
    // if (!hasPermission('project:team:insert')) {
    //     uni.showToast({
    //         icon: 'none',
    //         title: '暂无权限，请联系管理员',
    //         duration: 1500
    //     })
    //     return false
    // }
    loading.value = true;
    try {
        // 获取对应名称
        let queryParams = model.id ? [{
            id: model.id,
            tname: model.tname,
            teamleader: dataForm.checkedUser
        }] : [{
            tname: model.tname,
            teamleader: dataForm.checkedUser
        }];
        if (model.id) {
			const data = await fetchUpdateProjectTeamInfo(queryParams);
			uni.showToast({
			    title: '修改项目分组成功',
			    icon: 'none',
			    duration: 1500,
			    complete: () => {
			        loading.value = false;
			        handleClickLeft(true);
			    }
			});
		} else {
			const data = await fetchSaveProjectTeamInfo(queryParams);
			uni.showToast({
			    title: '新增项目分组成功',
			    icon: 'none',
			    duration: 1500,
			    complete: () => {
			        loading.value = false;
			        handleClickLeft(true);
			    }
			});
		}
    } catch (err) {
        console.error(model.id ? '修改项目分组失败' : '新增项目分组失败', err);
        loading.value = false;
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
                    console.log('topFixedHeight', topFixedHeight.value);
                }
            })
            .exec();
    } catch (err) {
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onReady(() => {
	recalcTopFixedHeight();
})

onLoad(async(options: any) => {
	await getAlluserDataList();
    if (options.id) {
        model.id = options.id;
        getInfo();
    }
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
		<!-- 占位：顶部固定区域高度（动态计算） -->
		<view :style="{ height: topFixedHeight + 'px' }"></view>
		
		<view class="topFixedWrap">
			<wd-navbar left-arrow title="项目分组信息" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
		</view>
       
	   <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
	       <view style="width: 5px; height: 15px; background: #0055FE;"></view>
	       <view style="margin-left: 10rpx; font-weight: bolder;">组名</view>
	   </view>
	   <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
	       <wd-textarea clearable v-model="model.tname" placeholder="请输入组名" no-border auto-height custom-class="tnameWrap"></wd-textarea>
	   </view>
	   
        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
            <view style="display: flex; align-items: center;">
                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                <view style="margin-left: 10rpx; font-weight: bolder;">组长</view>
            </view>
            <view>
                <wd-button icon="link" size="small"  @click="handleLinkUserShowChange">关联用户</wd-button>
            </view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 20rpx', borderRadius: '20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
            <wd-textarea clearable readonly v-model="model.uname" placeholder="请选择组长" no-border auto-height custom-class="dailyLinkedPrjWrap"></wd-textarea>
            <wd-button v-if="model.uname" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearSelectUserChange"></wd-button>
        </view>

        <view class="buttonWrap">
            <wd-button hairline type="primary" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" :loading="loading" @click="handleSubmitChange">提交</wd-button>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="userShow" position="left" @close="handleUserCloseChange">
            <wd-gap height="70rpx" />
        
            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchUserFuzzyChange" @cancel="handleSearchUserFuzzyChange" @clear="handleClearUserFuzzyChange" />
        
            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-radio-group v-model="dataForm.checkedUser" shape="dot" @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in dataForm.userDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.username }}</wd-radio>
                        </view>
                    </wd-cell>
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
	/* 保证内联元素正确换行 */
	box-sizing: border-box;
	/* 可选：微阴影让固定区更明显 */
	/* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
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

:deep(.wd-cell__left) {
    flex: 6 !important;
}

.dailyLinkedPrjWrap {
    width: calc(100% - 100rpx) !important;

    :deep(.wd-textarea__inner) {
        padding-left: 20rpx !important;
    }
}

.tnameWrap {
    width: calc(100% - 30rpx) !important;

    :deep(.wd-textarea__inner) {
        padding-left: 20rpx !important;
    }
}

.noticeBarWrap {
	border-radius: 0 !important;
}

.wot-theme-dark {
	:deep(.wd-notice-bar) {
		color: #F0F0F0 !important;
		background: #332b1f !important;
	}
}
</style>