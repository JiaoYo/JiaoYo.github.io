<script lang="ts" setup>
import { hasPermission } from '@/utils/index';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { onReady, onLoad, onShow, onUnload, onPageScroll, onPullDownRefresh, onReachBottom, onBackPress } from '@dcloudio/uni-app';
import { useMessage } from 'wot-design-uni';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetProjectQaPage, fetchDeleteProjectQa } from '@/service/projectQa';
import { stripHtml } from './modules/qa-utils';
import qaDetail from './modules/qa-detail.vue';
import qaForm from './modules/qa-form.vue';

const message = useMessage();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const clickLock = ref<boolean>(false);

// 搜索表单
const dataForm = reactive<{
    page: number;
    limit: number;
    fuzzy: string;
}>({
    page: 1,
    limit: 20,
    fuzzy: ''
});

const userId = uni.getStorageSync('userId');
const usertype = Number(uni.getStorageSync('usertype'));

// 新增：管理员 或 拥有 insert 权限
// 用 ref + onShow 重查，避免权限异步加载（globalData/storage 未就绪）时添加按钮不显示
const canInsert = ref(usertype === 0 || hasPermission('project:Qa:insert'));
function refreshCanInsert() {
    canInsert.value = usertype === 0 || hasPermission('project:Qa:insert');
}

// 编辑：管理员 或 本人创建（tcreater/creater 均兼容）
function canUpdateRow(row: any): boolean {
    if (usertype === 0) return true;
    const creator = row.tcreater != null ? row.tcreater : row.creater;
    return creator != null && String(creator) === String(userId);
}

// 删除：仅管理员
function canDeleteRow(): boolean {
    return usertype === 0;
}

// 详情/编辑弹层
const detailShow = ref(false);
const activeRow = ref<any>(null);

const formShow = ref(false);
const editingRow = ref<any>(null);

// 打开弹层前的页面滚动位置（弹层开关可能重置页面滚动，关闭后恢复）
let savedScrollTop = 0;

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

const listLoading = ref(false);
let pendingReload = false;

// 获取知识库列表（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
async function getDataList() {
  console.log(456);
    if (listLoading.value) {
        pendingReload = true;
        return;
    }
    listLoading.value = true;
    try {
        if (dataForm.page === 1) {
            dataList.value = [];
            state.value = 'loading'; // 首屏/搜索/刷新显示骨架屏，避免空态闪烁
        }
        const data = await fetchGetProjectQaPage({
            page: dataForm.page,
            pageSize: dataForm.limit,
            limit: dataForm.limit,
            fuzzy: dataForm.fuzzy || undefined,
            _t: Date.now()
        });
        const rows = (Array.isArray(data) ? data : (data && (data.list || data.records))) || [];
        const list = Array.isArray(rows) ? rows : [];
        dataList.value = dataList.value.concat(list);
        total.value = Number(data && data.total != null ? data.total : list.length);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取知识库列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) {
            pendingReload = false;
            getDataList();
        }
    }
}

// 打开详情
function openDetail(row: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    savedScrollTop = scrollTop.value; // 打开前记录滚动位置
    activeRow.value = row;
    detailShow.value = true;
    setTimeout(() => { clickLock.value = false; }, 300);
}

// 详情内点击编辑
function onDetailEdit(row: any) {
    detailShow.value = false;
    editingRow.value = row;
    formShow.value = true;
}

// 新增
function openAdd() {
    if (clickLock.value) return;
    clickLock.value = true;
    savedScrollTop = 0; // 新增：保存后回到第一页，保持顶部
    editingRow.value = null;
    formShow.value = true;
    setTimeout(() => { clickLock.value = false; }, 300);
}

// 编辑
function openEdit(row: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    savedScrollTop = scrollTop.value; // 打开前记录滚动位置
    editingRow.value = row;
    formShow.value = true;
    setTimeout(() => { clickLock.value = false; }, 300);
}

// 表单保存后：编辑就地更新（保持滚动），新增回第一页
function onFormSaved(payload?: any) {
    if (payload && payload.id != null) {
        const idx = dataList.value.findIndex((it: any) => String(it.id) === String(payload.id));
        if (idx > -1) {
            dataList.value[idx].problem = payload.problem;
            dataList.value[idx].desc = payload.desc;
        }
        // 弹层关闭动画结束后恢复滚动位置（after-leave 兜底）
        nextTick(() => {
            setTimeout(restoreScroll, 400);
        });
    } else {
        dataForm.page = 1;
        getDataList();
    }
}

// 恢复页面滚动位置（弹层完全关闭后调用）
function restoreScroll() {
    uni.pageScrollTo({ scrollTop: savedScrollTop, duration: 0 });
}

// 详情弹层关闭后恢复滚动
function onDetailClosed() {
    restoreScroll();
}

// 表单弹层关闭后恢复滚动
function onFormClosed() {
    restoreScroll();
}

// 删除
function handleDelete(row: any) {
    if (!canDeleteRow()) return;
    message
    .confirm({
        msg: '确定要删除该条知识吗？',
        title: '提示',
        confirmButtonProps: {
            type: 'error',
        },
    })
    .then(async () => {
        try {
            await fetchDeleteProjectQa(row.id);
            uni.showToast({ icon: 'success', title: '删除成功' });
            // 就地移除，保持滚动位置
            dataList.value = dataList.value.filter((it: any) => String(it.id) !== String(row.id));
            total.value = Math.max(0, total.value - 1);
            if (dataList.value.length >= total.value) {
                state.value = 'finished';
            } else if (state.value !== 'loadmore') {
                state.value = 'loadmore';
            }
            // 当前已加载数据被删空但后端还有更多：回第一页
            if (dataList.value.length === 0 && total.value > 0) {
                dataForm.page = 1;
                getDataList();
            }
        } catch (err) {
            uni.showToast({ icon: 'none', title: '删除失败' });
        }
    })
    .catch(() => {
        console.log('点击了取消按钮');
    });
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
        topFixedHeight.value = 150;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad(() => {
    getDataList();
});

onShow(() => {
    refreshCanInsert(); // 返回页面时重查权限，修复添加按钮偶尔不显示
});

// Android 返回键：详情/编辑弹层打开时先关弹层，避免直接退回上一页
onBackPress(() => {
    if (detailShow.value || formShow.value) {
        detailShow.value = false;
        formShow.value = false;
        return true;
    }
    return false;
});

onReady(() => {
    recalcTopFixedHeight();
});

onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
});

onUnload(() => {
    // 无全局监听需要解绑
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    dataForm.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading();
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
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#FFFFFF' }">
            <wd-navbar left-arrow title="知识库" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <wd-search v-model="dataForm.fuzzy" placeholder="搜索问题关键字" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
            <view class="summary-bar">
                <view class="summary-chip" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#f0f1f3', color: isDark ? '#8a9099' : '#4e5969' }">
                    <text class="summary-dot"></text>
                    <text class="summary-text" :style="{color: isDark ? '#ffffff' : '#000000'}">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text>
                </view>
            </view>
        </view>

        <view v-if="dataList.length > 0" class="list-wrap">
            <view
                v-for="(item, index) in dataList"
                :key="item.id ?? index"
                class="card"
                :class="{ 'card-dark': isDark }"
                @click="openDetail(item)"
            >
                <!-- 问题 -->
                <view class="card-title">{{ item.problem }}</view>

                <!-- 答案预览 -->
                <view v-if="stripHtml(item.desc)" class="card-preview">{{ stripHtml(item.desc) }}</view>

                <!-- 创建人 / 时间 -->
                <view class="card-meta">
                    <text>{{ item.username || '-' }}</text>
                    <text>{{ item.dbtime || '' }}</text>
                </view>

                <!-- 操作 -->
                <view v-if="canUpdateRow(item) || canDeleteRow()" class="card-actions" @click.stop>
                    <text v-if="canUpdateRow(item)" class="action-link" @click="openEdit(item)">编辑</text>
                    <text v-if="canDeleteRow()" class="action-link danger" @click="handleDelete(item)">删除</text>
                </view>
            </view>

            <wd-loadmore :state="state" @reload="getDataList" />
        </view>

        <view v-else-if="state === 'loading'" class="skeleton-wrap" :class="{ 'skeleton-wrap-dark': isDark }">
            <view v-for="n in 4" :key="n" class="skeleton-card">
                <view class="skeleton-line skeleton-title"></view>
                <view class="skeleton-line skeleton-preview"></view>
                <view class="skeleton-line skeleton-preview short"></view>
                <view class="skeleton-meta">
                    <view class="skeleton-line skeleton-meta-line"></view>
                    <view class="skeleton-line skeleton-meta-line short"></view>
                </view>
            </view>
        </view>

        <view v-else class="empty-wrap" :class="{ 'empty-wrap-dark': isDark }">
            <wd-status-tip image="../../static/search.png" tip="暂无知识库数据" />
        </view>

        <!-- 详情弹层 -->
        <qa-detail v-model="detailShow" :row="activeRow" @edit="onDetailEdit" @closed="onDetailClosed" />
        <!-- 新增/编辑弹层 -->
        <qa-form v-model="formShow" :row="editingRow" @saved="onFormSaved" @closed="onFormClosed" />

        <wd-fab v-if="canInsert" :disabled="clickLock" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="openAdd"></wd-fab>

        <wd-backtop :bottom="105" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>

        <wd-message-box />
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    box-sizing: border-box;
    /* 背景色由模板内联 isDark 样式控制 */
}

/* 总数统计条（与主站调度统一样式） */
.summary-bar {
    padding: 10rpx 24rpx 14rpx;
}

.summary-chip {
    display: inline-flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 999rpx;
    border: 1rpx solid #f0f1f3;
    font-size: 24rpx;
    color: #4e5969;
}

.summary-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}

.summary-num {
    font-weight: 600;
    color: #1677ff;
    margin: 0 4rpx;
}

/* 列表 */
.list-wrap {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    padding: 8rpx 20rpx 20rpx;
}

.card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 24rpx;
}

.card-dark {
    background: rgba(255,255,255,0.06);
    box-shadow: none;

    .card-title { color: #e8e8e8; }
    .card-preview { color: #8a9099; }
    .card-meta { color: #6A7590; border-top-color: rgba(255,255,255,0.08); }
    .card-actions { border-top-color: rgba(255,255,255,0.08); }
    .action-link { color: #69b1ff; }
    .action-link.danger { color: #ff6b6b; }
}

.card-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

.card-preview {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: #86909c;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

.card-meta {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
    margin-top: 16rpx;
    font-size: 22rpx;
    color: #c0c4cc;
}

.card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 32rpx;
    margin-top: 12rpx;
    padding-top: 12rpx;
    border-top: 1rpx solid #f5f6f8;
}

.action-link {
    font-size: 26rpx;
    color: #1677ff;
}

.action-link.danger {
    color: #dd524d;
}

.empty-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20rpx;
    border-radius: 20rpx;
    padding: 40rpx 0;
    background: #ffffff;
}

.empty-wrap-dark {
    background: #1b1b1b;
}

/* 首屏/搜索加载骨架屏 */
.skeleton-wrap {
    padding: 8rpx 20rpx 20rpx;
}

.skeleton-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin: 20rpx 0 0;
}

.skeleton-wrap-dark .skeleton-card {
    background: #1b1b1b;
}

.skeleton-line {
    height: 28rpx;
    border-radius: 8rpx;
    background: linear-gradient(90deg, #f2f3f5 25%, #e9eaed 37%, #f2f3f5 63%);
    background-size: 400% 100%;
    animation: skeleton-shimmer 1.4s ease infinite;
}

.skeleton-wrap-dark .skeleton-line {
    background: linear-gradient(90deg, #2a2a2c 25%, #343437 37%, #2a2a2c 63%);
    background-size: 400% 100%;
    animation: skeleton-shimmer 1.4s ease infinite;
}

.skeleton-title {
    width: 70%;
    height: 34rpx;
}

.skeleton-preview {
    margin-top: 16rpx;
    width: 92%;
}

.skeleton-preview.short {
    width: 60%;
}

.skeleton-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 24rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f5f6f8;
}

.skeleton-meta-line {
    width: 30%;
}

.skeleton-meta-line.short {
    width: 20%;
}

@keyframes skeleton-shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
}

/* 暗黑模式适配 */
.wot-theme-dark {
    /* 页面背景 */
    :deep(.wd-config-provider) { background: #1b1b1b !important; }

    /* 搜索输入框：深色胶囊 */
    :deep(.wd-search) { background: transparent !important; }
    :deep(.wd-search__field) { background: #1f1f1f !important; border-radius: 999rpx !important; border: 1rpx solid rgba(255, 255, 255, 0.08) !important; }
    :deep(.wd-search__input) { color: #e5e5e5 !important; background: transparent !important; }
    :deep(.wd-search__placeholder-txt) { color: #8a9099 !important; }
    :deep(.wd-search__search-left-icon) { color: #8a9099 !important; }
    :deep(.wd-search__cancel) { color: #e5e5e5 !important; }
}
</style>
