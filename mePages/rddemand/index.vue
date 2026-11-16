<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow title="研发需求" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <view class="search-row">
                <view class="search-input-wrap" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5' }">
                    <input class="search-input" v-model="fuzzy" placeholder="搜索需求名称" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" @confirm="handleSearch" />
                    <text v-if="fuzzy" class="clear-btn" :style="{ color: isDark ? '#6a6a6a' : '#999' }" @click="handleClearFuzzy">×</text>
                </view>
                <view class="btn-group">
                    <wd-button size="small" type="primary" @click="handleSearch">查询</wd-button>
                    <wd-button size="small" type="info" plain @click="toggleMoreFilters">{{ showMoreFilters ? '收起' : '更多' }}</wd-button>
                </view>
            </view>
            <view v-if="showMoreFilters" class="filter-wrap">
                <view class="filter-row">
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">研发产品</text>
                        <picker mode="selector" :range="projectList" range-key="rdname" @change="handleProjectChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedProject?.rdname || '全部' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">评审人</text>
                        <picker mode="selector" :range="rdtypeOptions" range-key="label" @change="handleRdtypeChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedRdtype?.label || '全部' }}</view>
                        </picker>
                    </view>
                </view>
                <view class="filter-row">
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">状态</text>
                        <picker mode="selector" :range="statusOptions" range-key="label" @change="handleStatusChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedStatus?.label || '全部' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">优先级</text>
                        <picker mode="selector" :range="priorityOptions" range-key="label" @change="handlePriorityChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedPriority?.label || '全部' }}</view>
                        </picker>
                    </view>
                </view>
                <view class="filter-row">
                    <view v-if="userType === 0" class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">创建人</text>
                        <picker mode="selector" :range="creatorList" range-key="username" @change="handleCreatorChange">
                            <view class="filter-value" :style="{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ selectedCreator?.username || '全部' }}</view>
                        </picker>
                    </view>
                    <view class="filter-item">
                        <text class="filter-label" :style="{ color: isDark ? '#8a9099' : '#999' }">任务</text>
                        <view class="chip-row">
                            <view class="filter-chip" :style="chipStyle(model.hasTask === 0)" @click="setHasTask(0)">无任务</view>
                            <view class="filter-chip" :style="chipStyle(model.hasTask === 1)" @click="setHasTask(1)">有任务</view>
                        </view>
                    </view>
                </view>
            </view>
            <view class="summary-bar">
                <view class="summary-left">
                    <view class="summary-chip" :style="{ background: isDark ? '#3a3a3a' : '#f7f8fa', color: isDark ? '#8a9099' : '#4e5969' }">
                        <text class="summary-dot"></text>
                        <text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text>
                    </view>
                    <wd-button size="small" :type="myCreated ? 'primary' : 'info'" :plain="!myCreated" @click="toggleMyCreated">我创建的</wd-button>
                </view>
                <wd-button size="small" type="primary" @click="handleAddDemand">新增</wd-button>
            </view>
        </view>
        <view v-if="dataList.length > 0" style="margin: 20rpx;">
            <uni-swipe-action>
                <uni-swipe-action-item class="swipe-item" v-for="item in dataList" :key="item.id" :right-options="getDeleteOptions(item)" @click="handleSwipeDelete($event, item)">
                    <view class="list-item" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click="handleViewDetail(item)">
                        <view class="item-header">
                            <view class="item-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ item.dname || '-' }}</view>
                            <view class="status-tag" :style="{ background: getStatusStyle(item.dstatus).bg, color: getStatusStyle(item.dstatus).color }">{{ getStatusStyle(item.dstatus).text }}</view>
                        </view>
                        <view class="item-info" :style="{ background: isDark ? '#1b1b1b' : '#fafafa' }">
                            <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">所属产品：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.rdname || '-' }}</text></view>
                            <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">评审人：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ getRdtypeText(item.rdtype) }}</text></view>
                            <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">优先级：</text><view class="priority-tag" :style="{ background: getPriorityColor(item.priority) + '20', color: getPriorityColor(item.priority) }">{{ getPriorityLabel(item.priority) }}</view></view>
                            <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">需求来源：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.dsource === 1 ? '三方合同' : '内部需求' }}</text></view>
                            <view v-if="item.dsource === 1 && item.contractnum" class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">合同编号：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.contractnum }}</text><view v-if="item.paystatus != null" class="paystatus-tag" :style="getPayStatusStyle(item.paystatus)">{{ contractPayStatus[Number(item.paystatus)] || '待维护' }}</view></view>
                            <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">期望完成：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.ctime || '-' }}</text></view>
                            <view v-if="item.ckusername" class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">评审信息：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.ckusername }}{{ item.retime ? '  ' + item.retime : '' }}</text></view>
                            <view class="info-row"><text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">任务数：</text><text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.tasknum || 0 }}</text></view>
                        </view>
                        <view class="item-footer">
                            <view class="footer-left">
                                <text class="footer-text" :style="{ color: isDark ? '#8a9099' : '#999' }">创建人：{{ item.username || '-' }}</text>
                                <text class="footer-text" :style="{ color: isDark ? '#8a9099' : '#999' }">{{ item.dbtime || '-' }}</text>
                            </view>
                            <view class="footer-right">
                                <text class="footer-text" style="width: 150px;" :style="{ color: isDark ? '#8a9099' : '#999' }" v-if="item.filenum > 0">附件：{{ item.filenum || '-' }}个</text>
                                <!-- <wd-button v-if="item.filenum > 0" type="primary" size="small" plain @click.stop="handleViewDetail(item)">附件({{ item.filenum }})</wd-button> -->
                            </view>
                        </view>
                        <view v-if="item.label" class="item-tags" :style="{ borderTopColor: isDark ? '#3a3a3a' : '#eee' }">
                            <view v-for="(tag, idx) in item.label.split(',')" :key="idx" class="tag-item" :style="{ background: isDark ? '#1f3a5f' : '#e6f4ff', color: isDark ? '#69b1ff' : '#1677ff' }">{{ tag }}</view>
                        </view>
                    </view>
                </uni-swipe-action-item>
            </uni-swipe-action>
            <wd-loadmore :state="state" @reload="getDataList" />
        </view>
        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20rpx', padding: '80rpx 0', background: isDark ? '#2a2a2a' : '#fff', borderRadius: '20rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无数据" />
        </view>
        <wd-message-box />
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { onLoad, onReady, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { useMessage } from 'wot-design-uni';
import { fetchRdDemandPage, fetchRdProjectPage,fetchDeleteRdDemandInfo } from "@/service/rddemand";
import { fetchGetAllUserDataList } from "@/service/member";
import { rdprjStatusOptions, rdprjLevelOptions, rdprjTypeOptions1, getPriorityColor, getPriorityLabel, getStatusLabel, contractPayStatus } from "@/constants/rdPrj";
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';
import { hasPermission } from '@/utils/index';
const userId = ref<number>(uni.getStorageSync("userId"));
const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const message = useMessage();
const clickLock = ref<boolean>(false);
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const listLoading = ref<boolean>(false);
let pendingReload = false;
const topFixedHeight = ref<number>(200);
const showMoreFilters = ref<boolean>(false);
const fuzzy = ref<string>('');
const userType = ref<number>(uni.getStorageSync("usertype"));
// 口径同 web：非管理员默认只看我创建的
const myCreated = ref<boolean>(userType.value !== 0);
const projectList = ref<any[]>([]);
const selectedProject = ref<any>(null);
const rdtypeOptions = computed(() => [{ label: '全部', value: -1 }, ...rdprjTypeOptions1]);
const selectedRdtype = ref<any>(null);
const statusOptions = computed(() => [{ label: '全部', value: -1 }, ...rdprjStatusOptions]);
const selectedStatus = ref<any>(null);
const priorityOptions = computed(() => [{ label: '全部', value: -1 }, ...rdprjLevelOptions]);
const selectedPriority = ref<any>(null);
// 创建人筛选（仅管理员开放，口径同 web form-search）
const creatorList = ref<any[]>([{ id: null as any, username: '全部' }]);
const selectedCreator = ref<any>(null);
const model = ref({ page: 1, limit: 20, pid: null as number | null, fuzzy: '', rdtype: null as number | null, dstatus: null as number | null, priority: null as number | null, hasTask: null as number | null, creater: userType.value !== 0 ? userId.value as number | null : null as number | null });

// 左滑删除配置：管理员(usertype=0)可删除所有，普通用户只能删除自己创建的（口径同 web usertype==0 || creater==id）
function getDeleteOptions(item: any) {
    const isCreator = item.creater == userId.value || userType.value === 0;
    if (isCreator) {
        return [{
            text: '删除',
            style: {
                backgroundColor: '#dd524d'
            }
        }];
    }
    return [];
}

async function getProjectList() { try { const data = await fetchRdProjectPage({ page: 1, limit: 200 } as any); projectList.value = [{ id: null as any, rdname: '全部' }, ...(data.list || [])]; } catch (err) { console.error('获取项目列表失败', err); } }
async function getCreatorList() { try { const data = await fetchGetAllUserDataList({ page: 1, limit: 500, usertypes: '0,1,2,3,4,5,6,8,9,11,12' } as any); creatorList.value = [{ id: null as any, username: '全部' }, ...((data.list || []).filter((u: any) => u.status == 0))]; } catch (err) { console.error('获取人员列表失败', err); } }
function handleCreatorChange(e: any) { const u = creatorList.value[e.detail.value]; selectedCreator.value = u; model.value.creater = u?.id ?? null; model.value.page = 1; getDataList(); }
// 任务有无筛选：再点一次取消（回到默认全部，口径同 web radio-group 可清空）
function setHasTask(v: number) { model.value.hasTask = model.value.hasTask === v ? null : v; model.value.page = 1; getDataList(); }
function chipStyle(active: boolean) { return active ? { background: '#1677ff', color: '#ffffff', borderColor: '#1677ff' } : { background: isDark.value ? '#2a2a2a' : '#f5f5f5', color: isDark.value ? '#e8e8e8' : '#1a1a1a', borderColor: 'transparent' }; }
function getPayStatusStyle(ps: any) { const t = ps == null ? '#909399' : (({ 0: '#f5222d', 1: '#fa8c16', 2: '#52c41a' } as any)[Number(ps)] || '#909399'); return { background: t + '1a', color: t }; }
async function getDataList() { if (listLoading.value) { pendingReload = true; return; } listLoading.value = true; try { if (model.value.page === 1) dataList.value = []; const params: any = { page: model.value.page, limit: model.value.limit }; if (model.value.pid) params.pid = model.value.pid; if (model.value.fuzzy) params.fuzzy = model.value.fuzzy; if (model.value.rdtype !== null && model.value.rdtype !== -1) params.rdtype = model.value.rdtype; if (model.value.dstatus !== null && model.value.dstatus !== -1) params.dstatus = model.value.dstatus; if (model.value.priority !== null && model.value.priority !== -1) params.priority = model.value.priority; if (model.value.hasTask !== null) params.hasTask = model.value.hasTask; if (model.value.creater !== null) params.creater = model.value.creater; const data = await fetchRdDemandPage(params); dataList.value = dataList.value.concat(data.list || []); total.value = Number(data.total); state.value = dataList.value.length < total.value ? 'loadmore' : 'finished'; } catch (err) { console.error('获取列表失败', err); state.value = 'error'; } finally { listLoading.value = false; if (pendingReload) { pendingReload = false; getDataList(); } } }
function handleProjectChange(e: any) { const idx = e.detail.value; const project = projectList.value[idx]; selectedProject.value = project; model.value.pid = project?.id ?? null; model.value.page = 1; getDataList(); }
function handleRdtypeChange(e: any) { const idx = e.detail.value; selectedRdtype.value = rdtypeOptions.value[idx]; model.value.rdtype = selectedRdtype.value?.value ?? null; if (model.value.rdtype === -1) model.value.rdtype = null; model.value.page = 1; getDataList(); }
function handleStatusChange(e: any) { const idx = e.detail.value; selectedStatus.value = statusOptions.value[idx]; model.value.dstatus = selectedStatus.value?.value ?? null; if (model.value.dstatus === -1) model.value.dstatus = null; model.value.page = 1; getDataList(); }
function handlePriorityChange(e: any) { const idx = e.detail.value; selectedPriority.value = priorityOptions.value[idx]; model.value.priority = selectedPriority.value?.value ?? null; if (model.value.priority === -1) model.value.priority = null; model.value.page = 1; getDataList(); }
function toggleMyCreated() {
    myCreated.value = !myCreated.value;
    model.value.creater = myCreated.value ? userId.value : null;
    model.value.page = 1;
    getDataList();
}
function handleSearch() { model.value.fuzzy = fuzzy.value; model.value.page = 1; getDataList(); }
function handleClearFuzzy() { fuzzy.value = ''; model.value.fuzzy = ''; model.value.page = 1; getDataList(); }
function toggleMoreFilters() { showMoreFilters.value = !showMoreFilters.value; setTimeout(() => { recalcTopFixedHeight(); }, 50); }
function getStatusStyle(status: number) { const styleMap: any = { 0: { text: '待确认', bg: '#fff7e6', color: '#fa8c16' }, 1: { text: '已确认', bg: '#f6ffed', color: '#52c41a' }, 2: { text: '已拒绝', bg: '#fff1f0', color: '#f5222d' } }; return styleMap[status] || { text: '未知', bg: '#f4f4f5', color: '#909399' }; }
function getRdtypeText(rdtype: number) { const map: any = { 0: '李吉峰', 1: '孙东洪', 2: '徐顺乐' }; return map[rdtype] || '-'; }
function handleClickLeft() { uni.navigateBack(); }
function handleAddDemand() { if (clickLock.value) return; clickLock.value = true; uni.navigateTo({ url: '/mePages/rddemand/add/Index' }); setTimeout(() => { clickLock.value = false; }, 500); }
function handleViewDetail(row: any) { if (clickLock.value) return; clickLock.value = true; const rowData = encodeURIComponent(JSON.stringify(row)); uni.navigateTo({ url: '/mePages/rddemand/detail/Index?rowData=' + rowData }); setTimeout(() => { clickLock.value = false; }, 500); }
function handleViewFiles(row: any) { if (clickLock.value) return; clickLock.value = true; uni.showToast({ title: '查看附件功能开发中', icon: 'none' }); setTimeout(() => { clickLock.value = false; }, 500); }

// 左滑删除处理
async function handleSwipeDelete(e: any, item: any) {
    message
    .confirm({
        msg: `确定要删除需求"${item.dname}"吗？`,
        title: '提示',
        confirmButtonProps: {
            type: 'error',
        },
    })
    .then(async () => {
        try {
            uni.showLoading({ title: '删除中...' });
                    await fetchDeleteRdDemandInfo(item.id);
                    uni.hideLoading();
                    uni.showToast({ title: '删除成功', icon: 'success' });
                    const idx = dataList.value.findIndex((d: any) => d.id === item.id);
                    if (idx > -1) {
                        dataList.value.splice(idx, 1);
                        total.value--;
                    }
        } catch (err) {
        }
    })
    .catch(() => {
        console.log('点击了取消按钮');
    });
}

function recalcTopFixedHeight() { uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => { if (rect) topFixedHeight.value = rect.height; }).exec(); }
function refreshList() { model.value.page = 1; dataList.value = []; getDataList(); }
onMounted(() => { uni.$on('refreshRdDemandList', refreshList); });
onReady(() => { recalcTopFixedHeight(); });
onPullDownRefresh(() => { model.value.page = 1; getDataList(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (!listLoading.value && dataList.value.length < total.value) { model.value.page++; getDataList(); } else if (dataList.value.length === total.value) { state.value = 'finished'; } });
onLoad(() => { getProjectList(); if (userType.value === 0) getCreatorList(); getDataList(); });
</script>
<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    background-color: #fff;
    box-sizing: border-box;
}

.search-row {
    display: flex;
    align-items: center;
    padding: 12rpx 20rpx;
    gap: 12rpx;
}

.search-input-wrap {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 32rpx;
    padding: 0 20rpx;
    height: 64rpx;
}

.search-input {
    flex: 1;
    font-size: 28rpx;
}

.clear-btn {
    position: absolute;
    right: 24rpx;
    font-size: 36rpx;
    color: #999;
    line-height: 1;
}

.btn-group {
    display: flex;
    gap: 12rpx;
}

.filter-wrap {
    padding: 0 20rpx 12rpx;
}

.filter-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 12rpx;
}

.filter-row:last-child {
    margin-bottom: 0;
}

.filter-item {
    flex: 1;
}

.filter-label {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
}

.filter-value {
    padding: 16rpx 20rpx;
    background: #f5f5f5;
    border-radius: 16rpx;
    font-size: 26rpx;
}

.summary-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 24rpx 16rpx;
}

.summary-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.summary-chip {
    display: inline-flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 999rpx;
    background: #f7f8fa;
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

.swipe-item {
    margin-bottom: 20rpx;
}

.list-item {
    padding: 24rpx;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16rpx;
}

.item-title {
    font-size: 30rpx;
    font-weight: 600;
    flex: 1;
    margin-right: 16rpx;
    color: #1a1a1a;
}

.status-tag {
    padding: 6rpx 16rpx;
    border-radius: 16rpx;
    font-size: 22rpx;
    white-space: nowrap;
}

.item-info {
    margin-bottom: 16rpx;
    padding: 16rpx;
    background: #fafafa;
    border-radius: 12rpx;
}

.info-row {
    display: flex;
    align-items: center;
    margin-bottom: 10rpx;
    font-size: 26rpx;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-label {
    color: #999;
    min-width: 140rpx;
}

.priority-tag {
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
}

.paystatus-tag {
    margin-left: 12rpx;
    padding: 4rpx 12rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    flex-shrink: 0;
}

.chip-row {
    display: flex;
    gap: 12rpx;
}

.filter-chip {
    padding: 14rpx 24rpx;
    border-radius: 16rpx;
    font-size: 26rpx;
    border: 2rpx solid transparent;
}

.item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-left {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.footer-text {
    font-size: 22rpx;
    color: #999;
}

.footer-right {
    display: flex;
    gap: 12rpx;
}

.item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1rpx dashed #eee;
}

.tag-item {
    padding: 6rpx 16rpx;
    background: #e6f4ff;
    color: #1677ff;
    border-radius: 8rpx;
    font-size: 22rpx;
}

/* 暗黑模式组件背景强制覆盖 */
.wot-theme-dark {
    :deep(.wd-button) {
        background-color: transparent !important;
    }
}

</style>
