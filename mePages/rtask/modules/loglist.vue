<template>
	<view class="loglist-wrap">
		<!-- 筛选 -->
		<view class="filter-wrap">
			<view class="filter-row">
				<text class="filter-label" :style="{ color: subColor }">类型</text>
				<view class="segment">
					<view v-for="opt in typeOptions" :key="opt.value" class="segment-item" :style="segmentItemStyle(filterType === opt.value)" @click="selectType(opt.value)">{{ opt.label }}</view>
				</view>
			</view>
			<view class="summary-bar">
				<view class="summary-chip">
					<text class="summary-dot"></text>
					<text class="summary-text">已加载 <text class="summary-num">{{ logList.length }}</text> / 共 <text class="summary-num">{{ total }}</text> 条</text>
				</view>
			</view>
		</view>

		<!-- 列表 -->
		<scroll-view :scroll-y="true" :scroll-into-view="scrollIntoId" refresher-enabled :refresher-triggered="triggered" @refresherrefresh="onRefresh" @scrolltolower="loadMore" class="list-scroll">
			<view id="listTop" />
			<view class="list-inner">
				<view v-for="(log, index) in logList" :key="log.id || index" class="log-item" :style="{ background: isDark ? '#1c1c1e' : '#ffffff' }">
					<view class="log-item-top">
						<view class="type-tag" :style="{ backgroundColor: typeColor(log.type) + '20', color: typeColor(log.type) }">{{ typeLabel(log.type) }}</view>
						<text class="log-time" :style="{ color: subColor }">{{ log.dbtime }}</text>
					</view>
					<view class="log-item-body">
						<view class="log-line">
							<text class="log-key" :style="{ color: subColor }">任务</text>
							<text class="log-val" :style="{ color: textColor }">{{ log.taskName || '-' }}</text>
						</view>
						<view class="log-line">
							<text class="log-key" :style="{ color: subColor }">操作人</text>
							<text class="log-val" :style="{ color: textColor }">{{ log.operator || log.username || log.creater || '-' }}</text>
						</view>
						<view v-if="log.weChatName" class="log-line">
							<text class="log-key" :style="{ color: subColor }">微信群</text>
							<text class="log-val" :style="{ color: textColor }">{{ log.weChatName }}</text>
						</view>
					</view>
				</view>

				<view v-if="!loading && logList.length === 0" class="empty">暂无操作日志</view>
				<wd-loadmore :state="state" @reload="loadData" />
				<view class="bottom-space"></view>
			</view>
		</scroll-view>
	</view>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import { fetchGetTaskLogPage } from '@/service/task'
import { getLogTypeConfig } from './constants'

const props = defineProps<{ contentHeight: number }>()

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

// ===== 筛选 =====
const typeOptions = [
    { label: '全部', value: -1 },
    { label: '新增', value: 0 },
    { label: '切换用户', value: 1 },
    { label: '更新进度', value: 2 },
    { label: '暂停', value: 3 },
    { label: '恢复调试', value: 4 },
    { label: '完成', value: 5 },
]
const filterType = ref<number>(-1)

// ===== 分段控件 =====
function segmentItemStyle(active: boolean) {
    if (active) {
        return { background: isDark.value ? '#3d3d3f' : '#ffffff', color: '#3b82f6', fontWeight: '600' }
    }
    return { color: subColor.value }
}
function selectType(v: number) {
    if (filterType.value === v) return
    filterType.value = v
    handleFilterChange()
}

function typeLabel(type: number | undefined) {
    return getLogTypeConfig(type).label
}
function typeColor(type: number | undefined) {
    return getLogTypeConfig(type).color
}

// ===== 列表 =====
const loading = ref(false)
const triggered = ref(false)
const logList = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore')
const scrollIntoId = ref('')
let loadSeq = 0 // 请求序号：快速切换筛选时，只采纳最新一次请求的响应，丢弃过期响应
let filterTimer: ReturnType<typeof setTimeout> | null = null // 筛选防抖定时器

async function loadData(reset = false) {
    const seq = ++loadSeq
    if (reset) {
        page.value = 1
        logList.value = []
        total.value = 0
    }
    loading.value = true
    state.value = 'loading'
    try {
        const data = await fetchGetTaskLogPage({
            page: page.value,
            limit: 15,
            ...(filterType.value !== -1 ? { type: filterType.value } : {}),
        })
        if (seq !== loadSeq) return // 已有更新的请求在途，丢弃本次过期响应
        const list = data.list || []
        total.value = data.total || 0
        logList.value = page.value === 1 ? list : [...logList.value, ...list]
        state.value = logList.value.length >= total.value ? 'finished' : 'loadmore'
    } catch (e) {
        if (seq !== loadSeq) return
        console.error('加载日志失败', e)
        state.value = 'error'
    } finally {
        if (seq === loadSeq) {
            loading.value = false
            triggered.value = false
        }
    }
}

function loadMore() {
    if (state.value === 'finished' || state.value === 'loading') return
    page.value++
    loadData()
}

// 筛选变化：防抖合并（快速连续切换只发最后一次请求），避免并发请求导致卡顿/列表错乱
function handleFilterChange() {
    scrollIntoId.value = 'listTop'
    setTimeout(() => { scrollIntoId.value = '' }, 100)
    if (filterTimer) clearTimeout(filterTimer)
    filterTimer = setTimeout(() => {
        filterTimer = null
        loadData(true)
    }, 200)
}

function onRefresh() {
    triggered.value = true
    loadData(true)
}

onMounted(() => {
    loadData(true)
})
</script>

<style lang="scss" scoped>
.loglist-wrap {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .filter-wrap {
        flex-shrink: 0;
        padding: 20rpx 20rpx 0;

        .filter-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            padding: 0 0 8rpx;

            .filter-label {
                font-size: 24rpx;
                flex-shrink: 0;
                width: 64rpx;
            }
        }

        .summary-bar {
            padding: 2rpx 0 16rpx;
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

        .segment {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 12rpx;

            .segment-item {
                padding: 10rpx 26rpx;
                font-size: 24rpx;
                line-height: 1.2;
                border-radius: 24rpx;
                background: rgba(128, 128, 128, 0.12);
                transition: all 0.15s;
            }
        }
    }

    .list-scroll {
        flex: 1;
        min-height: 0;
        margin-top: 10rpx;

        .list-inner {
            padding: 0 20rpx;

            .log-item {
                border-radius: 16rpx;
                padding: 20rpx;
                margin-bottom: 20rpx;
                box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

                .log-item-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .type-tag {
                        font-size: 22rpx;
                        font-weight: 500;
                        padding: 4rpx 16rpx;
                        border-radius: 12rpx;
                    }

                    .log-time {
                        font-size: 22rpx;
                    }
                }

                .log-item-body {
                    margin-top: 12rpx;

                    .log-line {
                        display: flex;
                        align-items: center;
                        padding: 6rpx 0;
                        font-size: 26rpx;

                        .log-key {
                            flex-shrink: 0;
                            width: 110rpx;
                            font-size: 24rpx;
                        }

                        .log-val {
                            flex: 1;
                            min-width: 0;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                    }
                }
            }
        }

        .empty {
            text-align: center;
            padding: 100rpx 0;
            font-size: 26rpx;
            color: v-bind(subColor);
        }

        .bottom-space {
            height: 160rpx;
        }
    }
}
</style>
