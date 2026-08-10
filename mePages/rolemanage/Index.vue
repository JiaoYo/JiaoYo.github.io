<script lang="ts" setup>
import { useToast } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { onReady, onLoad, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchDeleteRoleInfo, fetchGetRoleDataList } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    name: string;
}>({
    page: 1,
    limit: 50,
    name: '',
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
        const data = await fetchGetRoleDataList({ page: dataForm.page, limit: dataForm.limit, name: dataForm.name });
        dataList.value = dataList.value.concat(data.list);
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取角色列表失败', err);
        state.value = 'error';
    }
}

// 删除角色
async function handleDeleteChange(item: any, index: number) {
    console.log('item', item);
    console.log('index', index);
    try {
        const data = await fetchDeleteRoleInfo(item.id);
        dataForm.page = 1;
        getDataList();
    } catch (err) {
        console.error('删除角色失败', err);
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
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="角色管理" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <wd-search v-model="dataForm.name" placeholder="请输入角色名" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
        </view>

        <view>
            <view v-for="(item, index) in dataList" :key="index" class="list-item">
                <wd-swipe-action>
                    <wd-cell :title="item.name" title-width="100%" custom-title-class="wd-cell__title_else" />
                    <template #right>
                        <view class="action">
                            <view class="button" style="background: #e2231a" @click="handleDeleteChange(item, index)"> 删除 </view>
                        </view>
                    </template>
                </wd-swipe-action>
            </view>

            <wd-loadmore :state="state" @reload="getDataList" />

            <wd-backtop :bottom="30" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 999;
    background-color: #FFFFFF;
    /* 保证内联元素正确换行 */
    box-sizing: border-box;
    /* 可选：微阴影让固定区更明显 */
    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
}

.list-item {
    // padding: 5rpx;
    color: #464646;
    border-bottom: 2rpx dashed #ccc;
}

.action {
    height: 100%;
}

.button {
    display: inline-block;
    padding: 0 11px;
    height: 100%;
    color: white;
    line-height: 42px;
}
</style>
