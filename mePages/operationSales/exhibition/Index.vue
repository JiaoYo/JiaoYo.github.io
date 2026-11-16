<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow title="展会管理" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
            <view class="summary-bar">
                <view class="summary-left">
                    <view class="summary-chip" :style="{ background: isDark ? '#3a3a3a' : '#f7f8fa', color: isDark ? '#8a9099' : '#4e5969' }">
                        <text class="summary-dot"></text>
                        <text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text>
                    </view>
                </view>
                <wd-button v-if="canManage" size="small" type="primary" @click="handleCreate">新建展会</wd-button>
            </view>
        </view>

        <view v-if="dataList.length > 0" style="margin: 20rpx;">
            <view class="list-item" v-for="item in dataList" :key="item.id" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="item-header" @click="openMembers(item)">
                    <view class="item-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ item.exhibition_name || '-' }}</view>
                    <view class="status-tag" :style="{ background: statusColor(item.status) + '1A', color: statusColor(item.status) }">{{ statusLabel(item.status) }}</view>
                </view>
                <view class="item-info" :style="{ background: isDark ? '#1b1b1b' : '#fafafa' }" @click="openMembers(item)">
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">展会时间：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.start_date || '-' }} ~ {{ item.end_date || item.start_date || '-' }}</text>
                    </view>
                    <view class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">地点：</text>
                        <text :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.location || '-' }}</text>
                        <text class="info-label gap-left" :style="{ color: isDark ? '#8a9099' : '#999' }">参展人：</text>
                        <text class="member-link" @click.stop="openMembers(item)">{{ item.member_count ?? 0 }} 人</text>
                    </view>
                    <view v-if="item.remark" class="info-row">
                        <text class="info-label" :style="{ color: isDark ? '#8a9099' : '#999' }">备注：</text>
                        <text class="remark-text" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ item.remark }}</text>
                    </view>
                </view>
                <view class="item-footer">
                    <view class="footer-left">
                        <text class="footer-text" :style="{ color: isDark ? '#8a9099' : '#999' }">创建人：{{ nameOf(item.created_by) }}</text>
                        <text class="footer-text" :style="{ color: isDark ? '#8a9099' : '#999' }">{{ item.created_at || '-' }}</text>
                    </view>
                    <view v-if="canManage && item.status === 'ACTIVE'" class="footer-actions">
                        <text class="action-text" style="color: #1677ff;" @click="handleEdit(item)">修改</text>
                        <text class="action-text" style="color: #f5222d;" @click="handleCancelExhibition(item)">取消展会</text>
                    </view>
                </view>
            </view>
            <wd-loadmore :state="state" @reload="getDataList" />
        </view>
        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20rpx', padding: '80rpx 0', background: isDark ? '#2a2a2a' : '#fff', borderRadius: '20rpx' }">
            <wd-status-tip image="../../static/search.png" tip="暂无数据" />
        </view>

        <!-- 参展人查看 -->
        <wd-popup v-model="membersVisible" position="bottom" custom-class="op-popup" :safe-area-inset-bottom="true">
            <view class="popup-body" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">参展人 - {{ membersExhibitionName }}</view>
                <view v-if="!members.length" class="empty-line" :style="{ color: isDark ? '#6a6a6a' : '#bbb' }">暂无参展人</view>
                <view v-else class="member-tags">
                    <view v-for="m in members" :key="m.user_id" class="mini-tag member-tag"
                        :style="{ background: isDark ? 'rgba(22, 119, 255, 0.2)' : 'rgba(22, 119, 255, 0.1)', color: isDark ? '#69b1ff' : '#1677ff' }">{{ m.username }}</view>
                </view>
                <view class="popup-note" :style="{ color: isDark ? '#6a6a6a' : '#999' }">新建展会线索时，获客参展人只能从以上人员中选择</view>
            </view>
        </wd-popup>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { onReady, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { hasPermission } from "@/utils/index";
import { fetchExhibitionList, fetchExhibitionDetail, fetchExhibitionDelete } from "@/service/operationSales";
import { useOpUserMap } from "../user-map";
import { exhibitionStatusMap, exhibitionStatusColorMap } from "../constants";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const { nameOf, load: loadUserMap } = useOpUserMap();

// 新建/修改/取消展会：统一按权限 operation:exhibition:update 控制（2026-10-14 起不再按 usertype 判断）
const canManage = computed(() => hasPermission('operation:exhibition:update'));

function statusLabel(v: any) { return exhibitionStatusMap[v] || v || '-'; }
function statusColor(v: any) { return exhibitionStatusColorMap[v] || '#909399'; }

const topFixedHeight = ref(0);
const dataList = ref<any[]>([]);
const total = ref(0);
const listLoading = ref(false);
const state = ref<'loading' | 'finished' | 'error'>('loading');

async function getDataList() {
    if (listLoading.value) return;
    listLoading.value = true;
    state.value = 'loading';
    try {
        const res: any = await fetchExhibitionList({ pageNum: model.value.page, pageSize: 20 });
        const list = res?.list || [];
        if (model.value.page === 1) {
            dataList.value = [];
        }
        dataList.value = dataList.value.concat(list);
        total.value = Number(res?.total) || 0;
        state.value = dataList.value.length >= total.value ? 'finished' : 'loading';
    } catch (err) {
        console.error('获取展会列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
    }
}
const model = ref<any>({ page: 1 });

function handleClickLeft() { uni.navigateBack(); }
function handleCreate() { uni.navigateTo({ url: '/mePages/operationSales/exhibition/form' }); }
function handleEdit(row: any) { uni.navigateTo({ url: '/mePages/operationSales/exhibition/form?id=' + row.id }); }

/* ---------------- 参展人查看 ---------------- */
const membersVisible = ref(false);
const members = ref<any[]>([]);
const membersExhibitionName = ref('');
async function openMembers(row: any) {
    membersExhibitionName.value = row.exhibition_name;
    membersVisible.value = true;
    members.value = [];
    try {
        const res: any = await fetchExhibitionDetail(row.id);
        members.value = res?.members || [];
    } catch (err) {
        console.error('获取参展人失败', err);
    }
}

/* ---------------- 取消展会（软删除，提交前二次确认） ---------------- */
function handleCancelExhibition(row: any) {
    uni.showModal({
        title: '确认取消展会？',
        content: `「${row.exhibition_name}」取消后将从列表消失，不能再为该展会新建线索；参展人与历史线索仍保留，详情可供追溯。`,
        confirmText: '确认取消',
        cancelText: '再想想',
        success: async (r: any) => {
            if (!r.confirm) return;
            try {
                await fetchExhibitionDelete(row.id);
                uni.showToast({ title: '展会已取消', icon: 'none' });
                refreshList();
            } catch (err) {
                console.error('取消展会失败', err);
            }
        }
    });
}

function refreshList() { model.value.page = 1; getDataList(); }
// 固定头部（导航+汇总条）高度撑起占位，防止内容顶入头部之下
function recalcTopFixedHeight() { uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => { if (rect && rect.height !== undefined) topFixedHeight.value = rect.height; if (topFixedHeight.value === 0) topFixedHeight.value = 180; }).exec(); }
onReady(() => { recalcTopFixedHeight(); });
onPullDownRefresh(() => { refreshList(); setTimeout(() => { uni.stopPullDownRefresh(); }, 1000); });
onReachBottom(() => { if (!listLoading.value && dataList.value.length < total.value) { model.value.page++; getDataList(); } else if (dataList.value.length >= total.value) { state.value = 'finished'; } });
onMounted(() => {
    loadUserMap();
    getDataList();
    // 表单操作后刷新列表
    uni.$on('refreshOpExhibitionList', refreshList);
});
onUnmounted(() => { uni.$off('refreshOpExhibitionList', refreshList); });
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
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 24rpx;
}

.summary-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #52c41a;
}

.summary-text {
    font-size: 24rpx;
}

.summary-num {
    font-weight: 600;
}

.list-item {
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16rpx;
}

.item-title {
    flex: 1;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 42rpx;
}

.status-tag {
    padding: 6rpx 16rpx;
    border-radius: 16rpx;
    font-size: 22rpx;
    white-space: nowrap;
    flex-shrink: 0;
}

.item-info {
    border-radius: 12rpx;
    padding: 16rpx;
    margin-top: 16rpx;
}

.info-row {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    font-size: 26rpx;
    line-height: 40rpx;
    margin-bottom: 8rpx;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-label {
    color: #999;
    flex-shrink: 0;
}

.gap-left {
    margin-left: 24rpx;
}

.member-link {
    color: #1677ff;
    text-decoration: underline;
}

.remark-text {
    word-break: break-all;
    display: block;
    flex: 1;
    min-width: 0;
}

.item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;
    gap: 16rpx;
}

.footer-left {
    display: flex;
    gap: 24rpx;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
}

.footer-text {
    font-size: 24rpx;
}

.footer-actions {
    display: flex;
    gap: 24rpx;
    flex-shrink: 0;
}

.action-text {
    font-size: 26rpx;
}

.popup-body {
    padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
}

.popup-title {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 20rpx;
}

.popup-note {
    font-size: 24rpx;
    margin-top: 20rpx;
}

.member-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
}

.member-tag {
    padding: 8rpx 24rpx;
    border-radius: 24rpx;
    font-size: 25rpx;
}

.mini-tag {
    white-space: nowrap;
}

.empty-line {
    font-size: 26rpx;
    text-align: center;
    padding: 30rpx 0;
}
</style>
