<script lang="ts" setup>
import { ref, computed, nextTick, onMounted, watch } from "vue";
import { onLoad, onReady, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { useMessage } from "wot-design-uni";
import { fetchPointManuPage, fetchPointModelPage, fetchAddPointModel, fetchUpdatePointModel, fetchDeletePointModel } from "@/service/point";

const message = useMessage();

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === "dark");
const userId = ref<number>(uni.getStorageSync("userId"));
const userType = ref<number>(uni.getStorageSync("usertype"));
const clickLock = ref<boolean>(false);

const state = ref<any>("loading");
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const listLoading = ref(false);
let pendingReload = false;

const topFixedHeight = ref<number>(200);

const manuList = ref<any[]>([]);
const manuOptions = computed(() => manuList.value.map(item => ({ label: item.manu, value: item.id })));

const model = ref({
    page: 1, limit: 20, fuzzy: "",
    pid: null as number | null,
});

// 监听厂家选择变化，用于刷新列表
let isInitialized = false;
watch(() => model.value.pid, (newVal, oldVal) => {
    if (isInitialized && newVal !== oldVal) {
        console.log("厂家切换", newVal);
        model.value.page = 1;
        dataList.value = [];
        getDataList();
    }
});

async function getManuList() {
    try {
        const data = await fetchPointManuPage({ page: 1, limit: 100 });
        manuList.value = data.list || [];
        if (manuList.value.length > 0 && !model.value.pid) {
            model.value.pid = manuList.value[0].id;
        }
        isInitialized = true;
    } catch (err) { console.error("获取厂家列表失败", err); }
}

async function getDataList() {
    if (listLoading.value) { pendingReload = true; return; }
    listLoading.value = true;
    try {
        if (model.value.page === 1) dataList.value = [];
        let queryParams: any = { page: model.value.page, limit: model.value.limit };
        if (model.value.fuzzy) queryParams.fuzzy = model.value.fuzzy;
        if (model.value.pid) queryParams.pid = model.value.pid;
        const data = await fetchPointModelPage(queryParams);
        dataList.value = dataList.value.concat(data.list || []);
        total.value = Number(data.total);
        state.value = dataList.value.length < total.value ? "loadmore" : "finished";
    } catch (err) { console.error("获取点表型号列表失败", err); state.value = "error"; }
    finally { listLoading.value = false; if (pendingReload) { pendingReload = false; getDataList(); } }
}

function handleSearchChange() { model.value.page = 1; getDataList(); }
function handleClearChange() { model.value.fuzzy = ""; model.value.page = 1; getDataList(); }
function handleClickLeft() { /* #ifdef H5 */ history.go(-1); /* #endif */ /* #ifndef H5 */ uni.navigateBack(); /* #endif */ }

function handleAdd() {
    if (clickLock.value) return;
    clickLock.value = true;
    operateType.value = "add";
    editingData.value = null;
    operateForm.value = { model: "", pid: model.value.pid, notes: "" };
    showOperate.value = true;
    setTimeout(() => { clickLock.value = false; }, 500);
}

function handleEdit(item: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    operateType.value = "edit";
    editingData.value = item;
    operateForm.value = { model: item.model || "", pid: item.pid, notes: item.notes || "" };
    showOperate.value = true;
    setTimeout(() => { clickLock.value = false; }, 500);
}

async function handleDelete(item: any) {
    try {
        await message.confirm({ msg: "确定要删除该型号吗？", title: "提示", confirmButtonProps: { type: "error" } });
        await fetchDeletePointModel(String(item.id));
        uni.showToast({ title: "删除成功", icon: "success" });
        model.value.page = 1;
        getDataList();
    } catch (err) { console.error("删除失败", err); }
}

async function handleSubmit() {
    if (!operateForm.value.model) { uni.showToast({ title: "请输入型号", icon: "none" }); return; }
    if (!operateForm.value.pid) { uni.showToast({ title: "请选择厂家", icon: "none" }); return; }
    try {
        const data = [{ ...operateForm.value }];
        if (operateType.value === "edit") { data[0].id = editingData.value.id; await fetchUpdatePointModel(data); }
        else { await fetchAddPointModel(data); }
        showOperate.value = false;
        uni.showToast({ title: operateType.value === "add" ? "新增成功" : "修改成功", icon: "success" });
        model.value.page = 1;
        getDataList();
    } catch (err) { console.error("提交失败", err); }
}

const showOperate = ref(false);
const operateType = ref<"add" | "edit">("add");
const editingData = ref<any>(null);
const operateForm = ref({ model: "", pid: null as number | null, notes: "" });

function recalcTopFixedHeight() {
    try {
        uni.createSelectorQuery()
            .select(".topFixedWrap")
            .boundingClientRect((rect: any) => {
                if (rect && rect.height !== undefined) {
                    topFixedHeight.value = rect.height;
                }
            })
            .exec();
    } catch (err) {
        topFixedHeight.value = 200;
    }
}

onLoad(async () => { await getManuList(); getDataList(); });
onReady(() => { recalcTopFixedHeight(); });
onMounted(() => {
    nextTick(() => {
        setTimeout(() => { recalcTopFixedHeight(); }, 80);
    });
});
onPullDownRefresh(() => { model.value.page = 1; getDataList(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (listLoading.value) return; if (dataList.value.length < total.value) { model.value.page++; getDataList(); } else if (dataList.value.length === total.value) { state.value = "finished"; } });
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#FFFFFF' }">
            <wd-navbar left-arrow title="点表型号" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <view style="padding: 0 30rpx 16rpx;">
                <wd-picker view-mode="cell" label="厂家" label-width="80rpx" v-model="model.pid" :columns="manuOptions" placeholder="选择厂家" />
            </view>
            <wd-search v-model="model.fuzzy" placeholder="请输入型号" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
            <view class="summary-bar">
                <view class="summary-chip" :style="{ background: isDark ? '#3a3a3a' : '#f7f8fa', color: isDark ? '#8a9099' : '#4e5969' }"><text class="summary-dot"></text><text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text></view>
            </view>
        </view>

        <view :style="{ margin: '20rpx', background: isDark ? '#1b1b1b' : '#f5f6f8' }">
            <view v-if="dataList.length > 0">
                <view v-for="(item, index) in dataList" :key="index" class="list-item" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                    <view class="item-content">
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">型号：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.model || "-" }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">厂家：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.manu || "-" }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">备注：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.notes || "-" }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">创建人：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.username || "-" }}</text></view>
                        <view class="item-row"><text class="item-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">创建时间：</text><text class="item-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ item.dbtime || "-" }}</text></view>
                    </view>
                    <view class="item-actions">
                        <wd-icon v-if="userType === 0 || userId === item.creater" name="edit" size="22px" color="#f39c12" @click="handleEdit(item)"></wd-icon>
                        <wd-icon v-if="userType === 0" name="delete" size="22px" color="#ff4d4f" @click="handleDelete(item)"></wd-icon>
                    </view>
                </view>
                <wd-loadmore :state="state" @reload="getDataList" />
            </view>
            <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', minHeight: 'calc(100vh - 400rpx)' }">
                <wd-status-tip image="../../static/search.png" tip="暂无数据" />
            </view>
            <wd-fab :disabled="clickLock" draggable :zIndex="9" position="right-bottom" :gap="{ bottom: 40 }" :expandable="false" @click="handleAdd"></wd-fab>
        </view>

        <wd-popup closable :z-index="99" v-model="showOperate" custom-style="width: 90%; border-radius: 32rpx; padding: 20rpx;" @close="showOperate = false;">
            <view style="margin-bottom: 20rpx;"><wd-text bold :text="operateType === 'add' ? '新增型号' : '编辑型号'" :color="isDark ? '#ffffff' : '#000000'"></wd-text></view>
            <wd-cell-group border>
                <wd-picker view-mode="cell" label="厂家" label-width="120rpx" v-model="operateForm.pid" :columns="manuOptions" placeholder="请选择厂家" />
                <wd-input label="型号" :maxlength="64" label-width="120rpx" v-model="operateForm.model" placeholder="请输入型号" />
                <wd-input label="备注" :maxlength="255" label-width="120rpx" v-model="operateForm.notes" placeholder="请输入备注" type="textarea" />
            </wd-cell-group>
            <view style="display: flex; justify-content: flex-end; gap: 20rpx; margin-top: 30rpx;">
                <wd-button @click="showOperate = false;">取消</wd-button>
                <wd-button type="primary" @click="handleSubmit">确定</wd-button>
            </view>
        </wd-popup>
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
    background-color: #FFFFFF;
    box-sizing: border-box;
}
.summary-bar { padding: 16rpx 30rpx; }
.summary-chip { display: inline-flex; align-items: center; gap: 10rpx; padding: 8rpx 20rpx; border-radius: 999rpx; background: #f7f8fa; font-size: 24rpx; color: #4e5969; }
.summary-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%); }
.summary-num { font-weight: 600; color: #1677ff; margin: 0 4rpx; }
.list-item { display: flex; justify-content: space-between; padding: 24rpx; margin-bottom: 20rpx; background: #ffffff; border-radius: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05); }
.item-content { flex: 1; }
.item-row { display: flex; align-items: center; margin-bottom: 12rpx; font-size: 26rpx; }
.item-label { color: #969799; min-width: 140rpx; }
.item-value { color: #323233; flex: 1; }
.item-actions { display: flex; flex-direction: column; gap: 16rpx; justify-content: center; }

/* 暗黑模式组件背景强制覆盖 */
.wot-theme-dark {
    :deep(.wd-search) {
        background: #2a2a2a !important;
    }
    :deep(.wd-search__input) {
        background: #2a2a2a !important;
    }
    :deep(.wd-picker) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell-group) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell-group__body) {
        background: #2a2a2a !important;
    }
    :deep(.wd-cell) {
        background: #2a2a2a !important;
    }
    :deep(.wd-input) {
        background: #2a2a2a !important;
    }
}

</style>
