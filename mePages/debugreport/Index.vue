<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { getSystemDate, hasPermission } from '@/utils/index';
import { onLoad, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetDebugReportInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const message = useMessage();

const state = ref<any>('loading');
const isDark = computed(() => theme.value === 'dark');
const activeTab = ref<number>(0);
const userIdNameObj = ref<any>({});
const userDatsList = ref<any[]>([]);
const allUserDataList = ref<any[]>([]);
const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
const type = ref<number>(2);
const topFixedWrap = ref<any>(null);
const selectMonth = ref<number>(Number(getSystemDate(5)));
const selectYear = ref<number>(Number(getSystemDate(5)));

const usernameTriggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

// 调试报表数据源
const model = ref<{
	page: number;
	total: number;
	userShow: boolean;
	checkUser: any;
	username: string;
	usernameFuzzy: string;
}>({
	page: 1,
	total: 0,
	userShow: false,
	checkUser: null,
	username: "",
	usernameFuzzy: ""
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 月选择
function handleYearMonthChange({ value }: { value: number }) {
	model.value.page = 1;
    getDataList();
}

// 年选择
function handleYearChange({ value }: { value: number }) {
	model.value.page = 1;
    getDataList();
}

// 查询按钮
function handleSearchChange() {
	model.value.page = 1;
	getDataList();
}

// 清除关联调试人员
function handleClearUsernameChange() {
	model.value.username = "";
	model.value.checkUser = null;
	model.value.page = 1;
	getDataList();
}

// 关联调试人员
function handleLinkUserShowChange() {
	model.value.userShow = true;
}

// 关闭弹框
function handleCloseUsernameChange() {
	model.value.userShow = false;
}

// 清除搜索条件
function handleClearUsernameFuzzyChange() {
	userDatsList.value = allUserDataList.value;
}

// 搜索用户
function handleSearchUsernameFuzzyChange() {
	userDatsList.value = allUserDataList.value.filter((item: any) => item.username.toLocaleLowerCase().indexOf(model.value.usernameFuzzy) !== -1);
}

// 选择用户
function handleRadioUsernameSelectChange({ value }: { value: any }) {
	model.value.checkUser = value;
	model.value.username = allUserDataList.value.find((item: any) => item.id === value)?.username || '';
	model.value.userShow = false;
	model.value.page = 1;
	getDataList();
}

// 获取用户信息
async function getAllUserDataList() {
    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
        (data.list || []).forEach((item: any) => {
            if (item.status !== 1) {
                userIdNameObj.value[String(item.id)] = {
                    username: item.username,
                    userimage: item.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'
                }
            }
        });
		userDatsList.value = data.list || [];
		allUserDataList.value = data.list || [];
    } catch (err) {
        console.error('获取列表失败', err);
    }
}

// 刷新(用户)
function handleScrollRefreshUsernameChange() {
	usernameTriggered.value = true;
	getAllUserDataList();
	setTimeout(() => {
		usernameTriggered.value = false;
		console.log('刷新完成');
	}, 1000)
}

// ==================== 报表表格（对齐 web 端字段结构） ====================

// 参与报表统计的用户（web 端剔除 1024）
const groupUsers = computed(() => allUserDataList.value.filter((u: any) => String(u.id) !== '1024'));

// 解析 userstat（JSON 字符串 -> 数组 [{uid,totalcnt,finishcnt,finishcntRate,finishWeight,finishWeightRate}]）
function parseUserstat(raw: any): any[] {
	if (!raw) return [];
	try {
		const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
		return Array.isArray(p) ? p : [];
	} catch (e) {
		return [];
	}
}

// 取某用户在某个项目里的统计对象
function userStat(row: any, uid: string | number): any {
	const arr = row.userstat || [];
	return arr.find((s: any) => String(s.uid) === String(uid)) || {};
}

// 单元格文本；percent=true 时拼 '%'
function statText(row: any, uid: string | number, field: string, percent = false): string {
	const v = userStat(row, uid)[field];
	if (v === undefined || v === null || v === '') return '';
	return percent ? String(v) + '%' : String(v);
}

// 该用户在该项目是否有任务（userstat 中存在且有任务数）
function userHasTask(row: any, uid: string | number): boolean {
	const s = userStat(row, uid);
	return !!(s && Number(s.totalcnt) > 0);
}

// 有任务人员（只展示有任务的）
function usersWithTask(row: any): any[] {
	return groupUsers.value.filter((u: any) => userHasTask(row, u.id));
}

// 调试类型
function dtypeLabel(d: any): string {
	return d === 0 ? '现场调试' : d === 1 ? '远程调试' : d === 2 ? '无需调试' : '未知';
}

// 进度百分比（0-100 截断）
function clampPercent(v: any): string {
	const n = Number(v);
	if (isNaN(n)) return '0%';
	return Math.max(0, Math.min(100, n)) + '%';
}

// 获取列表信息（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
const listLoading = ref(false);
let pendingReload = false;

async function getDataList() {
    if (listLoading.value) {
        pendingReload = true;
        return;
    }
    listLoading.value = true;
    try {
        if (!hasPermission('project:debug')) {
            return
        }
		if (model.value.page === 1) {
			dataList.value = [];
		}
        let queryParams: any = {
			page: model.value.page,
			limit: 20,
			dates: type.value === 1 ? getSystemDate(3, selectMonth.value) : getSystemDate(4, selectYear.value),
			_t: new Date().getTime()
		};
        if (model.value.checkUser) {
            queryParams['userid'] = model.value.checkUser
        }
        const data = await fetchGetDebugReportInfo(queryParams);
        const newList = (data.list || []).map((item: any) => ({
            ...item,
            userstat: model.value.checkUser ? null : parseUserstat(item.userstat)
        }));
        dataList.value = dataList.value.concat(newList);
		model.value.total = Number(data.total);
		if (dataList.value.length < model.value.total) {
			state.value = 'loadmore';
		} else {
			state.value = 'finished';
		}
    } catch (err) {
        console.error('获取列表失败', err);
		state.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) {
            pendingReload = false;
            getDataList();
        }
    }
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    if (!topFixedWrap.value) return;
    uni.createSelectorQuery()
        .select('.topFixedWrap')
        .boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) {
                topFixedHeight.value = rect.height;
            }
        })
        .exec();
}

onLoad(() => {
    getAllUserDataList();
	getDataList();
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
	model.value.page = 1;
    getAllUserDataList();
	getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
	if (listLoading.value) {
		// 请求仍在途：不翻页，底部展示加载中
		state.value = 'loading';
		return;
	}
	if (dataList.value.length < model.value.total) {
		model.value.page++;
		getDataList();
	} else if (dataList.value.length === model.value.total) {
		state.value = 'finished';
	}
});

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 50);
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
        <view class="topFixedWrap" ref="topFixedWrap" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-navbar left-arrow title="调试报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

			<view class="query-area">
				<view class="query-input-wrap" :class="isDark ? 'query-input-dark' : ''">
					<wd-input clearable disabled no-border v-model="model.username" placeholder="请选择调试人员" custom-style="padding-left: 16rpx; font-size: 28rpx;">
						<template #suffix>
							<view class="query-input-suffix">
								<wd-icon v-if="model.username" name="close-circle" size="20px" @click="handleClearUsernameChange"></wd-icon>
								<view class="query-link" @click.stop="handleLinkUserShowChange">
									<wd-icon name="link" size="14px"></wd-icon>
									<text>关联调试人员</text>
								</view>
							</view>
						</template>
					</wd-input>
				</view>

				<view class="query-filter">
					<view class="query-filter-left">
						<wd-radio-group size="small" v-model="type" shape="button" @change="getDataList">
							<wd-radio :value="1">月</wd-radio>
							<wd-radio :value="2">年</wd-radio>
						</wd-radio-group>
						<view class="filter-right">
							<wd-datetime-picker v-if="type === 1" type="year-month" :z-index="999" v-model="selectMonth" @confirm="handleYearMonthChange" />
							<wd-datetime-picker v-if="type === 2" type="year" :z-index="999" v-model="selectYear" @confirm="handleYearChange" />
						</view>
					</view>
					<wd-button type="primary" size="small" @click="handleSearchChange">查询</wd-button>
				</view>
			</view>
			<view class="summary-bar">
				<view class="summary-chip" :style="{ background: isDark ? '#323233' : '#ffffff' }">
					<text class="summary-dot"></text>
					<text class="summary-text" :style="{color: isDark ? '#ffffff' : '#000000'}">已加载 <text class="summary-num">{{ dataList.length }}</text> / 共 <text class="summary-num">{{ model.total }}</text> 条</text>
				</view>
			</view>
		</view>

		<!-- 占位：顶部固定区域高度（动态计算） -->
		<view :style="{ height: topFixedHeight + 'px' }"></view>

		<view v-if="dataList.length > 0" class="table-wrap" :class="isDark ? 'table-dark' : ''">
			<!-- 未筛选人员：项目卡片 + 人员竖排明细 -->
			<template v-if="!model.checkUser">
				<view v-for="(row, ri) in dataList" :key="ri" class="card">
					<view class="card-head">
						<text class="card-name">{{ row.proname || '--' }}</text>
						<text class="card-type" :class="'type-' + (row.dtype ?? 'x')">{{ dtypeLabel(row.dtype) }}</text>
					</view>
					<view class="card-stats">
						<view class="stat-chip">
							<text class="stat-label">总权重分</text>
							<text class="stat-val">{{ row.totalweight ?? 0 }}</text>
						</view>
						<view class="stat-chip stat-chip-progress">
							<text class="stat-label">进度</text>
							<view class="progress-cell">
								<view class="progress-track"><view class="progress-fill" :style="{ width: clampPercent(row.progess) }"></view></view>
								<text class="progress-num">{{ Number(row.progess) || 0 }}%</text>
							</view>
						</view>
						<view class="stat-chip">
							<text class="stat-label">调试任务数</text>
							<text class="stat-val">{{ row.projectdebugcount ?? 0 }}</text>
						</view>
					</view>
					<view class="sub-table">
						<view class="sub-head">
							<text class="sub-c sub-user">人员</text>
							<text class="sub-c">全部</text>
							<text class="sub-c">完成</text>
							<text class="sub-c">完成率</text>
							<text class="sub-c">权重分</text>
							<text class="sub-c">权重率</text>
							<text class="sub-c">得分</text>
						</view>
						<template v-for="u in usersWithTask(row)" :key="u.id">
							<view class="sub-row">
								<text class="sub-c sub-user">{{ u.username }}</text>
								<text class="sub-c">{{ statText(row, u.id, 'totalcnt') }}</text>
								<text class="sub-c">{{ statText(row, u.id, 'finishcnt') }}</text>
								<text class="sub-c">{{ statText(row, u.id, 'finishcntRate', true) }}</text>
								<text class="sub-c">{{ statText(row, u.id, 'finishWeight') }}</text>
								<text class="sub-c">{{ statText(row, u.id, 'finishWeightRate', true) }}</text>
								<text class="sub-c">{{ statText(row, u.id, 'score') }}</text>
							</view>
						</template>
					</view>
				</view>
			</template>
			<!-- 筛选了具体人员：精简卡片 -->
			<template v-else>
				<view v-for="(row, ri) in dataList" :key="ri" class="card">
					<view class="card-head">
						<text class="card-name">{{ row.proname || '--' }}</text>
						<text class="card-type" :class="'type-' + (row.dtype ?? 'x')">{{ dtypeLabel(row.dtype) }}</text>
					</view>
					<view class="card-stats">
						<view class="stat-chip stat-chip-progress">
							<text class="stat-label">进度</text>
							<view class="progress-cell">
								<view class="progress-track"><view class="progress-fill" :style="{ width: clampPercent(row.progess) }"></view></view>
								<text class="progress-num">{{ Number(row.progess) || 0 }}%</text>
							</view>
						</view>
						<view class="stat-chip">
							<text class="stat-label">总权重分</text>
							<text class="stat-val">{{ row.totalweight ?? 0 }}</text>
						</view>
					</view>
					<view class="card-stats">
						<view class="stat-chip">
							<text class="stat-label">调试任务数</text>
							<text class="stat-val">{{ row.projectdebugcount ?? 0 }}</text>
						</view>
						<view class="stat-chip">
							<text class="stat-label">调试数量</text>
							<text class="stat-val">{{ row.debugcount ?? 0 }}</text>
						</view>
						<view class="stat-chip">
							<text class="stat-label">调试占比</text>
							<text class="stat-val">{{ row.debugpercent }}</text>
						</view>
					</view>
				</view>
			</template>

			<wd-gap height="30rpx"></wd-gap>

			<wd-loadmore :state="state" loading-text="正在加载内容" @reload="getDataList" />
		</view>

		<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-status-tip image="../../static/search.png" tip="暂无调试报表" />
		</view>

		<wd-backtop :bottom="40" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>

		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="model.userShow" position="left" @close="handleCloseUsernameChange">
		    <wd-gap height="70rpx" />

		    <wd-search v-model="model.usernameFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchUsernameFuzzyChange" @cancel="handleSearchUsernameFuzzyChange" @clear="handleClearUsernameFuzzyChange" />

		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="usernameTriggered" @refresherrefresh="handleScrollRefreshUsernameChange" :style="{ height: 'calc(100vh - 400rpx)' }">
		        <wd-radio-group v-model="model.checkUser" shape="dot" @change="handleRadioUsernameSelectChange">
					<wd-radio v-for="(userItem, userIndex) in userDatsList" :key="userIndex" class="radioCellWrap" :value="userItem.id">{{ userItem.username }}</wd-radio>
				</wd-radio-group>
		    </scroll-view>
		</wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    width: 100%;
    z-index: 99;
    background-color: #F5F5F5;
    box-sizing: border-box;
}

.query-area {
    padding: 16rpx 20rpx 0;
}

.query-input-wrap {
    border-radius: 16rpx;
    background: #f5f6f8;
    overflow: hidden;
    margin-bottom: 12rpx;
}

.query-input-wrap.query-input-dark {
    background: #2a2a2a;
}

.query-input-suffix {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding-right: 12rpx;
}

.query-link {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 8rpx 18rpx;
    border-radius: 999rpx;
    background: #1677ff;
    color: #ffffff;
    font-size: 22rpx;
    line-height: 1;
    flex-shrink: 0;
}

.query-link text {
    color: #ffffff;
}

.query-filter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rpx;
}

.query-filter-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
    min-width: 0;
}

.filter-right {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

/* 已加载/总数统计条（与主站调度统一样式） */
.summary-bar {
    padding: 4rpx 20rpx 12rpx;
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

/* ==================== 报表卡片 ==================== */
.table-wrap {
    padding-top: 16rpx;
}

.card {
    margin: 0 20rpx 20rpx;
    border-radius: 20rpx;
    background: #ffffff;
    padding: 20rpx 22rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin-bottom: 16rpx;
}

.card-name {
    flex: 1;
    min-width: 0;
    font-size: 30rpx;
    font-weight: 600;
    color: #1a1a1a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-type {
    flex-shrink: 0;
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: 999rpx;
    border: 1rpx solid transparent;
}

.type-0 {
    color: #d46b08;
    background: #fff7e6;
    border-color: #ffd591;
}

.type-1 {
    color: #389e0d;
    background: #f6ffed;
    border-color: #b7eb8f;
}

.type-2 {
    color: #1677ff;
    background: #e6f4ff;
    border-color: #91caff;
}

.type-x {
    color: #8c8c8c;
    background: #fafafa;
    border-color: #d9d9d9;
}

.card-stats {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
}

.card-stats:last-child {
    margin-bottom: 0;
}

.stat-chip {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: #f7f8fa;
    border-radius: 12rpx;
    padding: 10rpx 14rpx;
}

.stat-chip-progress {
    flex: 1.6;
}

.stat-label {
    flex-shrink: 0;
    font-size: 20rpx;
    color: #86909c;
}

.stat-val {
    font-size: 26rpx;
    font-weight: 600;
    color: #1a1a1a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 人员竖排明细 */
.sub-table {
    margin-top: 4rpx;
    border-top: 1rpx solid #f0f1f3;
    border-left: 1rpx solid #f0f1f3;
    border-radius: 8rpx;
    overflow: hidden;
}

.sub-head,
.sub-row {
    display: grid;
    grid-template-columns: 1.4fr repeat(6, 1fr);
}

.sub-head {
    background: #f7f8fa;
    border-bottom: 1rpx solid #f0f1f3;
}

.sub-row {
    background: #ffffff;
    border-bottom: 1rpx solid #f0f1f3;
}

.sub-row:last-child {
    border-bottom: none;
}

.sub-c {
    padding: 12rpx 6rpx;
    font-size: 20rpx;
    color: #1a1a1a;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-right: 1rpx solid #f0f1f3;
}

.sub-c:last-child {
    border-right: none;
}

.sub-user {
    text-align: left;
    font-weight: 500;
}

.sub-head .sub-c {
    color: #86909c;
    font-weight: 600;
}

/* 进度条 */
.progress-cell {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.progress-track {
    flex: 1;
    height: 12rpx;
    border-radius: 999rpx;
    background: #eef0f3;
    overflow: hidden;
    min-width: 30rpx;
}

.progress-fill {
    height: 100%;
    border-radius: 999rpx;
    background: linear-gradient(135deg, #1677ff, #69b1ff);
}

.progress-num {
    font-size: 20rpx;
    color: #1677ff;
    font-weight: 600;
    flex-shrink: 0;
}

/* 暗色模式 */
.table-wrap.table-dark {
    .card {
        background: #1c1c1c;
        box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.2);
    }

    .card-name {
        color: #e5e7eb;
    }

    .type-0 {
        color: #ffb65d;
        background: rgba(214, 107, 8, 0.18);
        border-color: rgba(255, 182, 93, 0.35);
    }

    .type-1 {
        color: #7fd77a;
        background: rgba(56, 158, 13, 0.18);
        border-color: rgba(127, 215, 122, 0.35);
    }

    .type-2 {
        color: #6ea1ff;
        background: rgba(22, 119, 255, 0.18);
        border-color: rgba(110, 161, 255, 0.35);
    }

    .type-x {
        color: #a0a0a0;
        background: #2a2a2a;
        border-color: #444444;
    }

    .stat-chip {
        background: #2a2a2a;
    }

    .stat-label {
        color: #9ca3af;
    }

    .stat-val {
        color: #e5e7eb;
    }

    .sub-head {
        background: #2a2a2a;
    }

    .sub-head .sub-c {
        color: #9ca3af;
    }

    .sub-row {
        background: #1c1c1c;
    }

    .sub-c {
        color: #e5e7eb;
        border-color: #2c2c2c;
    }

    .sub-table,
    .sub-head,
    .sub-row {
        border-color: #2c2c2c;
    }

    .progress-track {
        background: #333333;
    }
}

:deep(.wd-tabs__container) {
    background: #F5F5F5 !important;
}

.radioCellWrap {
    padding: 10rpx 20rpx !important;
}

:deep(.wd-radio) {
    margin-right: 0 !important;
}

:deep(.wd-radio.is-button .wd-radio__label) {
    width: 40px !important;
    height: 30px !important;
    line-height: 30px !important;
    padding: 0 !important;
    border-radius: 0 !important;
    min-width: 40px !important;
    margin: 0 !important;
}

:deep(.wd-radio-group) {
    background-color: v-bind("isDark ? '#000000' : '#ffffff'") !important;
}
</style>
