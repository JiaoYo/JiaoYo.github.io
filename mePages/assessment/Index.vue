<template>
	<!-- 弹窗打开时锁死页面滚动，防止弹窗内滚动穿透到父界面 -->
	<page-meta :disable-scroll="popupOpen" />
	<wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
		<view class="page" :class="{ 'page-locked': popupOpen }">
			<wd-navbar left-arrow title="工程考核" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

			<!-- 筛选区 -->
			<view class="filter-area" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#f5f6f8' }">
				<wd-search v-model="fuzzy" placeholder="搜索考核名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" cancel-txt="搜索" @search="handleFilterChange" @cancel="handleFilterChange" @clear="handleFilterChange" />

				<!-- 考核类型 -->
				<scroll-view scroll-x class="chips-scroll">
					<view class="chips">
						<view v-for="opt in typeOptions" :key="opt.value" class="chip" :class="{ active: filterType === opt.value }" @click="selectType(opt.value)">
							{{ opt.label }}
						</view>
					</view>
				</scroll-view>

				<!-- 参与类型 / 关于我的 -->
				<view class="chips-row">
					<view v-for="opt in apaticiOptions" :key="opt.value" class="chip" :class="{ active: filterApatici === opt.value }" @click="selectApatici(opt.value)">
						{{ opt.label }}
					</view>
					<view class="chip-divider"></view>
					<view class="chip chip-mine" :class="{ active: aboutMe }" @click="toggleAboutMe">
						关于我的
					</view>
				</view>

				<!-- 状态 -->
				<view class="chips-row">
					<view v-for="opt in statusOptions" :key="opt.value" class="chip" :class="{ active: filterStatus === opt.value }" @click="selectStatus(opt.value)">
						{{ opt.label }}
					</view>
					<view class="summary-chip" :style="{ background: isDark ? '#2a2a2a' : '#f7f8fa', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#f0f1f3', color: isDark ? '#8a9099' : '#4e5969' }">
					<text class="summary-dot"></text>
					<text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 个考核</text>
				</view>
				</view>
			</view>

			<!-- 列表 -->
			<scroll-view :scroll-y="!popupOpen" :scroll-into-view="scrollIntoId" refresher-enabled :refresher-triggered="triggered" @refresherrefresh="onRefresh" @scrolltolower="loadMore" class="list-scroll">
				<view id="listTop" />
				<view class="list-inner">
					<view v-for="row in dataList" :key="row.id" class="card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						
						<!-- 顶部标签 -->
						<view class="card-top">
							<view class="card-tags">
								<view class="tag tag-type" :style="{ backgroundColor: typeBg, color: '#667eea' }">{{ getAtypeLabel(row.atype) }}</view>
								<view class="tag tag-apatici" :style="{ backgroundColor: apaticiConfig(row).color + '20', color: apaticiConfig(row).color }">{{ apaticiConfig(row).label }}</view>
							</view>
							<view class="tag tag-status" :style="{ backgroundColor: statusColor(row) + '20', color: statusColor(row) }">
								<view class="status-dot" :style="{ backgroundColor: statusColor(row) }"></view>
								{{ getStatusConfig(row.status).label }}
							</view>
						</view>

						<!-- 名称 -->
						<view class="card-title" :style="{ color: textColor }">{{ row.aname || '未命名考核' }}</view>

						<!-- 元信息 -->
						<view class="card-meta">
							<view class="meta-item">
								<text class="meta-icon">⏱</text>
								<text class="meta-label">时长</text>
								<text class="meta-value" :style="{ color: textColor }">{{ row.dura ?? 30 }} 分钟</text>
							</view>
							<view class="meta-item">
								<text class="meta-icon">🕐</text>
								<text class="meta-label">开始</text>
								<text class="meta-value" :style="{ color: textColor }">{{ row.starttime || '-' }}</text>
							</view>
							<view class="meta-item">
								<text class="meta-icon">👤</text>
								<text class="meta-label">创建人</text>
								<text class="meta-value" :style="{ color: textColor }">{{ row.username || '-' }}</text>
								<text class="meta-ctime" :style="{ color: subColor }">📅 {{ row.dbtime || '-' }}</text>
							</view>
						</view>

						<!-- 参加情况 / 成绩分布（管理者可见，结束后展示） -->
						<template v-if="canManage && Number(row.status) === 2 && row.statistics">
							<view class="stats-block" :style="{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }">
								<view class="stat-line" @click="openParticipation(row)">
									<text class="stat-item">应参加 <b>{{ Number(row.statistics.assessmentCount ?? 0) }}</b></text>
									<text class="stat-item ok">已参加 <b>{{ Number(row.statistics.participatedCount ?? 0) }}</b></text>
									<text class="stat-item warn">未参加 <b>{{ Number(row.statistics.notParticipatedCount ?? 0) }}</b></text>
									<text class="stat-more">详情 ›</text>
								</view>
								<view class="stat-line" @click="openStatistics(row)">
									<text class="stat-item good">优 {{ toPct(row.statistics.excellentRate) }}%（{{ Number(row.statistics.excellentCount ?? 0) }}人）</text>
									<text class="stat-item mid">良 {{ toPct(row.statistics.goodRate) }}%（{{ Number(row.statistics.goodCount ?? 0) }}人）</text>
									<text class="stat-item bad">差 {{ toPct(row.statistics.unqualifiedRate) }}%（{{ Number(row.statistics.unqualifiedCount ?? 0) }}人）</text>
									<text class="stat-more">统计 ›</text>
								</view>
							</view>
						</template>

						<!-- 操作 -->
						<view v-if="getActions(row).length" class="card-actions">
							<template v-for="act in getActions(row)" :key="act.key">
								<wd-button v-if="act.key === 'delete'" size="small" plain type="danger" @click="handleDelete(row)">删除</wd-button>
								<wd-button v-else-if="act.key === 'start'" size="small" type="success" @click="handleStart(row)">开启考核</wd-button>
								<wd-button v-else size="small" :plain="act.key !== 'answer'" :type="act.type" @click="runAction(act, row)">{{ act.label }}</wd-button>
							</template>
						</view>
					</view>

					<view v-if="!loading && dataList.length === 0" class="empty" :style="{ color: subColor }">暂无考核数据{{ canManage ? '，点击右下角「+」新增考核' : '' }}</view>
					<wd-loadmore :state="state" @reload="loadData" />
					<view class="bottom-space"></view>
				</view>
			</scroll-view>

			<!-- 新增 -->
			<wd-fab v-if="canManage" :draggable="true" position="right-bottom" :z-index="2" :gap="{ bottom: 40 }" :expandable="false" @click="goAdd" />

			<!-- 参加情况 / 成绩统计 -->
			<participation v-model="participationVisible" :row-data="currentRow" />
			<statistics v-model="statisticsVisible" :row-data="currentRow" />
		</view>

		<wd-message-box />
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import { fetchAssessmentList, fetchDeleteAssessment, fetchStartAssessment } from '@/service/assessments'
import { ATYPE_OPTIONS, APATICI_OPTIONS, STATUS_OPTIONS, getAtypeLabel, getStatusConfig, getApaticiConfig, MANAGER_USER_TYPES } from './modules/constants'
import participation from './modules/participation.vue'
import statistics from './modules/statistics.vue'

const message = useMessage()

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))
const typeBg = computed(() => (isDark.value ? 'rgba(102,126,234,0.18)' : '#eef2ff'))

const userId = String(uni.getStorageSync('userId'))
const userType = Number(uni.getStorageSync('usertype'))
const canManage = computed(() => MANAGER_USER_TYPES.includes(userType))

function handleBack() {
    // #ifdef H5
    history.go(-1)
    // #endif
    // #ifndef H5
    uni.navigateBack()
    // #endif
}

// ===== 筛选 =====
const typeOptions = [{ label: '全部', value: -1 }, ...ATYPE_OPTIONS]
const apaticiOptions = [{ label: '全部', value: -1 }, ...APATICI_OPTIONS]
const statusOptions = [{ label: '全部', value: -1 }, ...STATUS_OPTIONS]

const fuzzy = ref('')
const filterType = ref(-1)
const filterApatici = ref(-1)
const filterStatus = ref(-1)
const aboutMe = ref(false)

function selectType(v: number) {
    if (filterType.value === v) return
    filterType.value = v
    handleFilterChange()
}
function selectApatici(v: number) {
    if (filterApatici.value === v) return
    filterApatici.value = v
    handleFilterChange()
}
function selectStatus(v: number) {
    if (filterStatus.value === v) return
    filterStatus.value = v
    handleFilterChange()
}
function toggleAboutMe() {
    aboutMe.value = !aboutMe.value
    handleFilterChange()
}

// ===== 列表 =====
const loading = ref(false)
const triggered = ref(false)
const dataList = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore')
const scrollIntoId = ref('')

function buildQuery() {
    return {
        page: page.value,
        limit: 15,
        ...(filterType.value !== -1 ? { atype: filterType.value } : {}),
        ...(filterApatici.value !== -1 ? { apatici: filterApatici.value } : {}),
        ...(filterStatus.value !== -1 ? { status: filterStatus.value } : {}),
        ...(fuzzy.value ? { fuzzy: fuzzy.value } : {}),
        ...(aboutMe.value ? { parti: Number(userId) } : {}),
    }
}

async function loadData(reset = false) {
    if (reset) {
        page.value = 1
        dataList.value = []
        total.value = 0
    }
    loading.value = true
    state.value = 'loading'
    try {
        const data = await fetchAssessmentList(buildQuery())
        const list = data.list || []
        total.value = data.total || 0
        dataList.value = page.value === 1 ? list : [...dataList.value, ...list]
        state.value = dataList.value.length >= total.value ? 'finished' : 'loadmore'
    } catch (e) {
        console.error('加载考核列表失败', e)
        state.value = 'error'
    } finally {
        loading.value = false
        triggered.value = false
    }
}

function loadMore() {
    if (state.value === 'finished' || state.value === 'loading') return
    page.value++
    loadData()
}

function handleFilterChange() {
    scrollIntoId.value = 'listTop'
    setTimeout(() => { scrollIntoId.value = '' }, 100)
    loadData(true)
}

function onRefresh() {
    triggered.value = true
    loadData(true)
}

onLoad(() => {
    loadData(true)
})

onShow(() => {
    if (uni.getStorageSync('assessment_list_refresh')) {
        uni.removeStorageSync('assessment_list_refresh')
        loadData(true)
    }
})

onPullDownRefresh(() => {
    loadData(true)
})

onReachBottom(() => {
    loadMore()
})

// ===== 展示辅助 =====
function statusColor(row: any) {
    return getStatusConfig(Number(row.status)).color
}
function apaticiConfig(row: any) {
    return getApaticiConfig(Number(row.apatici))
}
function toPct(rate: any) {
    const v = Number(rate ?? 0)
    const p = v <= 1 ? v * 100 : v
    return Math.min(Math.max(p, 0), 100).toFixed(0)
}

// ===== 操作 =====
interface ActionItem {
    key: string
    label: string
    type: 'primary' | 'success' | 'warning' | 'info'
}

function getActions(row: any): ActionItem[] {
    const status = Number(row.status)
    const acts: ActionItem[] = []
    if (status === 0 && canManage.value) {
        acts.push({ key: 'start', label: '开启考核', type: 'success' })
        acts.push({ key: 'edit', label: '编辑', type: 'warning' })
        acts.push({ key: 'delete', label: '删除', type: 'danger' })
    } else if (status === 1 && !canManage.value) {
        acts.push({ key: 'answer', label: '开始答题', type: 'primary' })
    } else if (status === 1 && canManage.value) {
        acts.push({ key: 'view', label: '考核信息', type: 'primary' })
    } else if (status === 2) {
        acts.push({ key: 'detail', label: '答题详情', type: 'primary' })
        if (canManage.value && row.statistics) {
            acts.push({ key: 'statistics', label: '成绩统计', type: 'info' })
            acts.push({ key: 'delete', label: '删除', type: 'danger' })
        }
    }
    return acts
}

function runAction(act: ActionItem, row: any) {
    if (act.key === 'edit') goEdit(row, false)
    else if (act.key === 'view') goEdit(row, true)
    else if (act.key === 'answer') goAnswer(row)
    else if (act.key === 'detail') goDetail(row)
    else if (act.key === 'statistics') openStatistics(row)
}

// 导航辅助（子页面通过 storage 读取当前考核行数据）
function goAdd() {
    uni.removeStorageSync('assessment_edit_row')
    uni.navigateTo({ url: '/mePages/assessment/edit' })
}
function goEdit(row: any, readonly: boolean) {
    uni.setStorageSync('assessment_edit_row', row)
    uni.navigateTo({ url: `/mePages/assessment/edit?readonly=${readonly ? 1 : 0}` })
}
function goAnswer(row: any) {
    uni.setStorageSync('assessment_answer_row', row)
    uni.navigateTo({ url: '/mePages/assessment/answer' })
}
function goDetail(row: any) {
    uni.setStorageSync('assessment_detail_row', row)
    uni.navigateTo({ url: '/mePages/assessment/detail' })
}

// ===== 开启 / 删除 =====
function handleStart(row: any) {
    message
        .confirm({
            msg: `确定要开始考核「${row.aname}」吗？开启后参与者即可开始答题。`,
            title: '开启考核',
        })
        .then(async () => {
            try {
                await fetchStartAssessment(row.id)
                await loadData(true)
                uni.showToast({ title: '开启考核成功', icon: 'none' })
            } catch (e) {
                console.error('开启考核失败', e)
            }
        })
        .catch(() => {})
}

function handleDelete(row: any) {
    message
        .confirm({
            msg: `确定要删除考核「${row.aname}」吗？\n删除后该考核将无法恢复，请谨慎操作！`,
            title: '删除考核',
            confirmButtonText: '确认删除',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            try {
                await fetchDeleteAssessment(row.id)
                await loadData(true)
                uni.showToast({ title: '删除成功', icon: 'success' })
            } catch (e) {
                console.error('删除考核失败', e)
            }
        })
        .catch(() => {})
}

// ===== 弹窗 =====
const participationVisible = ref(false)
const statisticsVisible = ref(false)
const currentRow = ref<any>(null)

// 弹窗打开时锁定底层列表滚动，防止滚动穿透
const popupOpen = computed(() => participationVisible.value || statisticsVisible.value)

function openParticipation(row: any) {
    currentRow.value = row
    participationVisible.value = true
}
function openStatistics(row: any) {
    currentRow.value = row
    statisticsVisible.value = true
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;

	&.page-locked {
		height: 100vh;
		overflow: hidden;
	}

	.filter-area {
		flex-shrink: 0;
		padding: 16rpx 20rpx 0;
		background-color: #f5f6f8;

		.chips-scroll {
			margin-top: 12rpx;
			white-space: nowrap;

			.chips {
				display: inline-flex;
				gap: 12rpx;
				padding: 4rpx 2rpx;
			}
		}

		.chips-row {
			display: flex;
			flex-wrap: wrap;
			gap: 12rpx;
			margin-top: 12rpx;
			padding-bottom: 4rpx;
		}

		.chip-divider {
			width: 1rpx;
			height: 28rpx;
			background: rgba(128, 128, 128, 0.35);
			align-self: center;
		}

		.chip {
			flex-shrink: 0;
			padding: 8rpx 24rpx;
			border-radius: 999rpx;
			font-size: 24rpx;
			color: #64748b;
			background: #ffffff;
			border: 1rpx solid rgba(128, 128, 128, 0.18);
			transition: all 0.2s;

			&.active {
				color: #ffffff;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				border-color: transparent;
				font-weight: 600;
			}

			&.chip-mine.active {
				background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
			}
		}

		.summary-chip {
			margin-left: auto;
			align-self: center;
			flex-shrink: 0;
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
	}

	.list-scroll {
		flex: 1;
		min-height: 0;
		margin-top: 12rpx;

		.list-inner {
			padding: 0 20rpx;

			.card {
				position: relative;
				border-radius: 24rpx;
				padding: 24rpx 24rpx 20rpx;
				margin-bottom: 20rpx;
				box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
				overflow: hidden;


				.card-top {
					display: flex;
					justify-content: space-between;
					align-items: center;

					.card-tags {
						display: flex;
						align-items: center;
						gap: 12rpx;
					}

					.tag {
						display: flex;
						align-items: center;
						gap: 6rpx;
						padding: 4rpx 16rpx;
						border-radius: 999rpx;
						font-size: 22rpx;
						font-weight: 500;

						.status-dot {
							width: 10rpx;
							height: 10rpx;
							border-radius: 50%;
						}
					}
				}

				.card-title {
					margin-top: 16rpx;
					font-size: 32rpx;
					font-weight: 700;
					line-height: 1.4;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				.card-meta {
					margin-top: 12rpx;
					display: flex;
					flex-direction: column;
					gap: 8rpx;

					.meta-item {
						display: flex;
						align-items: center;
						font-size: 24rpx;

						.meta-icon {
							display: flex;
							align-items: center;
							justify-content: center;
							width: 28rpx;
							height: 28rpx;
							flex-shrink: 0;
							margin-right: 8rpx;
							font-size: 24rpx;
							line-height: 1;
						}

						.meta-label {
							width: 80rpx;
							color: #8a8f99;
							flex-shrink: 0;
						}

						.meta-value {
							flex: 1;
							min-width: 0;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}
						.meta-ctime {
							margin-left: auto;
							flex-shrink: 0;
							font-size: 22rpx;
							white-space: nowrap;
						}
					}
				}

				.stats-block {
					margin-top: 16rpx;
					border-radius: 16rpx;
					padding: 14rpx 18rpx;

					.stat-line {
						display: flex;
						align-items: center;
						flex-wrap: wrap;
						gap: 18rpx;
						padding: 6rpx 0;
						font-size: 22rpx;

						.stat-item {
							color: #64748b;

							b { font-weight: 600; }

							&.ok { color: #16a34a; }
							&.warn { color: #d97706; }
							&.good { color: #16a34a; }
							&.mid { color: #d97706; }
							&.bad { color: #dc2626; }
						}

						.stat-more {
							margin-left: auto;
							color: #667eea;
							font-size: 22rpx;
						}
					}
				}

				.card-actions {
					margin-top: 16rpx;
					padding-top: 16rpx;
					border-top: 1rpx solid rgba(128, 128, 128, 0.12);
					display: flex;
					justify-content: flex-end;
					gap: 16rpx;
				}
			}

			.empty {
				text-align: center;
				padding: 100rpx 0;
				font-size: 26rpx;
			}

			.bottom-space {
				height: 160rpx;
			}
		}
	}
}
   /* 删除按钮：暗色下更清晰的红色 */
    :deep(.wd-button.is-danger.is-plain) {
        color: #ff6b6b !important;
        background: rgba(250, 67, 80, 0.12) !important;
        border-color: rgba(250, 67, 80, 0.45) !important;
    }
/* 暗黑模式适配 */
.wot-theme-dark {
    /* 搜索输入框：深色胶囊 */
    :deep(.wd-search) {
        background: transparent !important;
    }
    :deep(.wd-search__field) {
        background: #1f1f1f !important;
        border-radius: 999rpx !important;
        border: 1rpx solid rgba(255, 255, 255, 0.08) !important;
    }
    :deep(.wd-search__input) {
        color: #e5e5e5 !important;
        background: transparent !important;
    }
    :deep(.wd-search__placeholder-txt) {
        color: #8a9099 !important;
    }
    :deep(.wd-search__search-left-icon) {
        color: #8a9099 !important;
    }
    :deep(.wd-search__cancel) {
        color: #e5e5e5 !important;
    }

    /* 筛选 chip：暗色底 */
    .chip {
        color: #a0a3ab!important;
        background: transparent!important;
        border-color: rgba(255, 255, 255, 0.12)!important;
    }
    .chip.active {
        color: #ffffff !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border-color: transparent !important;
    }
    .chip-mine.active {
        background: linear-gradient(135deg, #16a34a 0%, #059669 100%) !important;
    }

    /* 已加载统计条 */
    .summary-chip {
        background: #2a2a2a;
        border-color: rgba(255, 255, 255, 0.12);
        color: #8a9099;
    }
    .summary-num {
        color: #69b1ff;
    }

    /* 删除按钮：暗色下更清晰的红色 */
    :deep(.wd-button.is-danger.is-plain) {
        color: #ff6b6b !important;
        background: rgba(250, 67, 80, 0.12) !important;
        border-color: rgba(250, 67, 80, 0.45) !important;
    }
}

</style>
