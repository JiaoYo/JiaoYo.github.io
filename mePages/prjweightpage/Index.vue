<script lang="ts" setup>
import { throttle } from "@/utils/debounce";
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchDeletePrjWeightInfo, fetchGetPrjWeightDataList } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const clickLock = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const options = ref<any>(hasPermission('project:Weight:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const dataForm = reactive<{
    page: number;
    limit: number;
    prjName: string;
}>({
    page: 1,
    limit: 50,
    prjName: '',
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
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    getDataList();
}

// 获取项目权重
const getDataList =  throttle(async () => {
    if (!hasPermission('project:Weight:select')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetPrjWeightDataList({ page: dataForm.page, limit: dataForm.limit, fuzzy: dataForm.prjName });
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取项目权重失败', err);
        state.value = 'error';
    }
}, 1000, { leading: true, trailing: true })

// 项目权重详情
function handleJumpChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false
		}
    });
}

// 删除项目权重
async function handleDeleteChange(id: number) {
    if (!hasPermission('project:Weight:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该项目权重吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjWeightInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除项目权重成功",
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
    } catch (err) {
        console.error('删除项目权重失败', err);
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

onLoad(() => {
    getDataList();
	uni.$on('refreshListPrjweight', (model: any) => {
		if (model.id) {
			const index = dataList.value.findIndex((item) => item.id === Number(model.id))
			if (index !== -1) {
				dataList.value[index].tname = model.tname;
				dataList.value[index].weight = model.weight;
			}
		} else {
			getDataList();
		}
	}); // 监听刷新事件
    // uni.$on('refreshListPrjweight', getDataList); // 监听刷新事件
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

onUnload(() => {
    uni.$off('refreshListPrjweight', getDataList); // 页面销毁时解绑
});

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
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="项目权重管理" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <wd-search v-model="dataForm.prjName" placeholder="请输入类型名称" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
        </view>

        <view v-if="dataList.length > 0">
            <uni-swipe-action>
                <uni-swipe-action-item v-for="(item, index) in dataList" :key="index" :right-options="options" @click="handleDeleteChange(item.id)">
                    <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
                        <view style="padding: 5rpx;">
                            <wd-cell :title="item.tname" custom-class="customCell" custom-title-class="cellLabelTitle" ellipsis center>
                                <wd-icon v-if="hasPermission('project:Weight:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/mePages/addprjweight/Index?id=' + item.id)"></wd-icon>
                            </wd-cell>
                            <wd-cell title="权重" custom-class="customCell" ellipsis center :value="item.weight + ' 分'"></wd-cell>
                            <wd-cell title="创建者/时间" :value="item.username" custom-class="customCell" ellipsis>
                                <view style="display: flex; flex-direction: column; flex-wrap: wrap;">
                                    <view v-if="item.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                                        {{ item.username }}
                                    </view>
                                    <view v-if="item.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                                        {{ item.dbtime }}
                                    </view>
                                </view>
                            </wd-cell>
                        </view>
                    </view>
                </uni-swipe-action-item>
            </uni-swipe-action>

            <wd-loadmore :state="state" @reload="getDataList" />
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-status-tip image="../../static/search.png" tip="暂无项目权重数据" />
        </view>

        <wd-fab draggable v-if="hasPermission('project:Weight:insert')" :disabled="clickLock" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleJumpChange('/mePages/addprjweight/Index')"></wd-fab>

        <wd-backtop :bottom="hasPermission('project:Weight:insert') ? 105 : 30" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
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

:deep(.cellLabelTitle) {
    font-weight: bolder !important;
}

:deep(.wd-cell__value) {
    font-weight: bolder !important;
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}
</style>
