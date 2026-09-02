<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission } from '@/utils/index';
import { onReady, onLoad, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchDeleteUserInfo, fetchGetUserDataList } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const options = ref<any>(hasPermission('sys:user:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const userTypeMap = ref<Record<number, string>>({
    0: '超级管理员',
    1: '销售',
    2: '项目负责人',
    3: '技术工程师',
    4: '综合管理',
    5: '研发工程师',
    6: '生产技术工程师'
})

const dataForm = reactive<{
    page: number;
    limit: number;
    username: string;
}>({
    page: 1,
    limit: 50,
    username: '',
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
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    dataList.value = [];
    getDataList();
}

// 获取用户列表信息
async function getDataList() {
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetUserDataList({ page: dataForm.page, limit: dataForm.limit, fuzzy: dataForm.username });
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取用户列表失败', err);
        state.value = 'error';
    }
}

// 拨打电话
function handleMakePhoneNumber(phoneNumber: string) {
    if (phoneNumber) {
        uni.makePhoneCall({
            phoneNumber
        })
    }
}

// 删除用户
async function handleDeleteChange(item: any, index: number) {
    if (!hasPermission('sys:user:delete')) {
        return
    }
    try {
        message
            .confirm({
                msg: '确定要删除该用户吗？',
                title: '提示',
                confirmButtonProps: {
                    type: 'error',
                },
            })
            .then(async () => {
                const data = await fetchDeleteUserInfo(item.id);
                uni.showToast({
                    icon: "none",
                    title: "删除用户成功",
                    duration: 1500,
                    complete: async () => {
                        dataForm.page = 1;
                        getDataList();
                    }
                })
            })
            .catch(() => {
                console.log('点击了取消按钮');
            });
    } catch (error) {
        console.error('删除用户失败', error);
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

function handleAddOrUpdateMemberChange(url: string) {
    uni.navigateTo({
        url
    })
}

onLoad(() => {
    getDataList();
});

onReady(() => {
    recalcTopFixedHeight();
})

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    dataForm.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (dataList.value.length < total.value) {
        dataForm.page++;
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
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh;" :theme="theme">
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="用户管理" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <wd-search v-model="dataForm.username" placeholder="请输入用户名" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
        </view>

        <view style="margin: 20rpx;">
            <uni-swipe-action>
                <uni-swipe-action-item class="list-item" v-for="(item, index) in dataList" :key="index" :right-options="options" @click="handleDeleteChange(item, index)">
                    <wd-cell custom-title-class="wd-cell__title_else" center>
                        <template #title>
                            <view style="display: flex; align-items: center; gap: 0 10rpx;">
                                <wd-img :width="35" :height="35" :src="item.userimage || 'https://dingiiot.com/dingiiotTest/static/soybean.jpg'" :preview-src="item.userimage || 'https://dingiiot.com/dingiiotTest/static/soybean.jpg'" :enable-preview="true" round />
                                <view style="direction: inline-block;">{{ item.username }}</view>
                            </view>
                        </template>
                        <view style="display: flex; align-items: center; gap: 10rpx; justify-content: flex-end;">
                            <wd-tag type="primary" round>{{ userTypeMap[item.usertype] || '未知'  }}</wd-tag>
                            <wd-icon name="edit" size="22px" :color="isDark ? '#ffffff' : '#000000'" v-if="hasPermission('sys:user:update')" @click.stop="handleAddOrUpdateMemberChange('/mePages/addmember/Index?id=' + item.id)"></wd-icon>
                        </view>
                    </wd-cell>
                    <wd-cell v-if="item.phnum" title="手机号码" :value="item.phnum" custom-title-class="wd-cell__title_else">
                        <view style="display: flex; align-items: center; gap: 10rpx; justify-content: flex-end;">
                            <wd-text :text="item.phnum" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
                            <wd-icon name="call" size="22px" :color="isDark ? '#ffffff' : '#000000'" @click.stop="handleMakePhoneNumber(item.phnum)"></wd-icon>
                        </view>
                    </wd-cell>
					<wd-cell v-if="item.nickname" title="微信昵称" custom-title-class="wd-cell__title_else">
					    <view style="display: flex; align-items: center; gap: 10rpx; justify-content: flex-end;">
					        <wd-text bold :text="item.nickname" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
					    </view>
					</wd-cell>
					<wd-cell v-if="item.dbtime" title="绑定微信时间" custom-title-class="wd-cell__title_else">
					    <view style="display: flex; align-items: center; gap: 10rpx; justify-content: flex-end;">
					        <wd-text bold :text="item.dbtime" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
					    </view>
					</wd-cell>
                </uni-swipe-action-item>
            </uni-swipe-action>
        </view>

        <wd-loadmore :state="state" @reload="getDataList" />

        <wd-backtop :bottom="hasPermission('sys:user:insert') ? 110 : 30" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>

        <wd-fab v-if="hasPermission('sys:user:insert')" :zIndex="2" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleAddOrUpdateMemberChange('/mePages/addmember/Index')"></wd-fab>
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

.list-item {
    color: #464646;
    // border-bottom: 2rpx dashed #ccc;
	margin: 20rpx 0;
	border-radius: 20rpx;
}

.list-item:first-child {
	margin-top: 0 !important;
}

// .list-item:last-child {
//     border: none;
// }

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

:deep(.wd-cell__title) {
    font-weight: bolder !important;
}

:deep(.wd-cell__value) {
    color: dimgrey !important;
    font-size: 26rpx !important;
    font-weight: normal !important;
}
</style>
