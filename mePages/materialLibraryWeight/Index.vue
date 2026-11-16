<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetMaterialWeightPage, fetchDeleteMaterialWeightInfo } from '@/service/projectMaterial';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';

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

const options = ref<any>([
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
]);

const dataForm = reactive<{
    page: number;
    limit: number;
    fuzzy: string;
}>({
    page: 1,
    limit: 50,
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
    dataForm.page = 1;
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    getDataList();
}

// 获取物料权重关系（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
const listLoading = ref(false);
let pendingReload = false;

async function getDataList() {
    if (listLoading.value) {
        pendingReload = true;
        return;
    }
    listLoading.value = true;
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
        }
        const data = await fetchGetMaterialWeightPage({ page: dataForm.page, limit: dataForm.limit, fuzzy: dataForm.fuzzy });
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取物料权重失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) {
            pendingReload = false;
            getDataList();
        }
    }
}

// 跳转
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

// 删除物料权重关系
async function handleDeleteChange(id: number) {
    try {
        message
        .confirm({
            msg: '确定要删除该物料权重关系吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeleteMaterialWeightInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除物料权重成功",
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
        console.error('删除物料权重失败', err);
    }
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
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
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad(() => {
    getDataList();
	uni.$on('refreshListMaterialWeight', (model: any) => {
		if (model.id) {
			const index = dataList.value.findIndex((item) => item.id === Number(model.id))
			if (index !== -1) {
				dataList.value[index].mid = model.mid;
				dataList.value[index].wid = model.wid;
				dataList.value[index].devno = model.devno;
				dataList.value[index].devname = model.devname;
				dataList.value[index].tname = model.tname;
				dataList.value[index].weight = model.weight;
			}
		} else {
			getDataList();
		}
	}); // 监听刷新事件
});

onReady(() => {
    recalcTopFixedHeight();
})

onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
    try {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', recalcTopFixedHeight);
        }
    } catch (e) { /* ignore */ }
});

onUnload(() => {
    uni.$off('refreshListMaterialWeight'); // 页面销毁时解绑
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
    if (listLoading.value) return; // 在途请求未返回时不翻页，避免跳页
    if (dataList.value.length < total.value) {
        dataForm.page++;
        getDataList();
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh;'" :theme="theme">
		<wd-message-box />

        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="物料权重" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <wd-search v-model="dataForm.fuzzy" placeholder="请输入物料名称/编码/权重类型" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
            <view class="summary-bar" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
                <view class="summary-chip" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#f0f1f3', color: isDark ? '#8a9099' : '#4e5969' }">
                    <text class="summary-dot"></text>
                    <text class="summary-text" :style="{color: isDark ? '#ffffff' : '#000000'}">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text>
                </view>
            </view>
        </view>

        <view v-if="dataList.length > 0">
            <uni-swipe-action>
                <uni-swipe-action-item v-for="(item, index) in dataList" :key="index" :right-options="options" @click="handleDeleteChange(item.id)">
                    <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '20rpx 20rpx 0', borderRadius: '20rpx' }">
                        <view style="padding: 5rpx;">
                            <wd-cell :title="(item.devno || '') + ' / ' + (item.devname || '')" custom-class="customCell" custom-title-class="cellLabelTitle" ellipsis center>
                                <wd-icon name="edit-outline" size="18px" @click.stop="handleJumpChange('/mePages/addmaterialweight/Index?id=' + item.id)"></wd-icon>
                            </wd-cell>
                            <wd-cell title="权重类型" :value="item.tname ? item.tname + '（' + (item.weight != null ? item.weight : '--') + '）' : '--'" custom-class="customCell" ellipsis center></wd-cell>
                        </view>
                    </view>
                </uni-swipe-action-item>
            </uni-swipe-action>

            <wd-loadmore :state="state" @reload="getDataList" />
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-status-tip image="../../static/search.png" tip="暂无物料权重数据" />
        </view>

        <wd-fab draggable :disabled="clickLock" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleJumpChange('/mePages/addmaterialweight/Index')"></wd-fab>

        <wd-backtop :bottom="105" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    /* 背景色由模板内联 isDark 样式控制 */
    box-sizing: border-box;
}

/* 已加载/总数统计条（与主站调度统一样式） */
.summary-bar {
    padding: 10rpx 24rpx 14rpx;
}

.summary-chip {
    display: inline-flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 999rpx;
    border: 1rpx solid;
    font-size: 24rpx;
    /* 颜色由模板内联 isDark 样式控制 */
}

.summary-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}

.summary-num {
    font-weight: 600;
    margin: 0 4rpx;
    /* 颜色由模板内联 isDark 样式控制 */
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
