<template>
	<view class="tasklist-wrap">
		<!-- 筛选 -->
		<view class="filter-wrap">
			<view class="filter-row">
				<text class="filter-label" :style="{ color: subColor }">状态</text>
				<view class="segment">
					<view v-for="opt in statusOptions" :key="opt.value" class="segment-item" :style="segmentItemStyle(filterStatus === opt.value)" @click="selectStatus(opt.value)">{{ opt.label }}</view>
				</view>
			</view>
			<view class="filter-row">
				<text class="filter-label" :style="{ color: subColor }">延期</text>
				<view class="segment">
					<view v-for="opt in delayedOptions" :key="opt.value" class="segment-item" :style="segmentItemStyle(filterDelayed === opt.value)" @click="selectDelayed(opt.value)">{{ opt.label }}</view>
				</view>
			</view>
			<view class="search-row">
				<wd-search v-model="fuzzy" placeholder="搜索任务名称或微信群名" placeholder-left cancel-txt="搜索" @search="handleFilterChange" @cancel="handleFilterChange" @clear="handleFilterChange" />
			</view>
			<view class="summary-bar">
				<view class="summary-chip">
					<text class="summary-dot"></text>
					<text class="summary-text">已加载 <text class="summary-num">{{ taskList.length }}</text> / 共 <text class="summary-num">{{ total }}</text> 条</text>
				</view>
			</view>
		</view>

		<!-- 列表 -->
		<scroll-view :scroll-y="true" :scroll-into-view="scrollIntoId" refresher-enabled :refresher-triggered="triggered" @refresherrefresh="onRefresh" @scrolltolower="loadMore" class="list-scroll">
			<view id="listTop" />
			<view class="list-inner">
				<taskcard v-for="task in taskList" :key="task.id" :task="task" @reload="reload" />
				<view v-if="!loading && taskList.length === 0" class="empty">暂无任务数据，点击右下角「新增任务」创建吧</view>
				<wd-loadmore :state="state" @reload="loadData" />
				<view class="bottom-space"></view>
			</view>
		</scroll-view>

		<!-- 新增任务 -->
		<wd-fab v-if="isManager" :disabled="clickLock" :draggable="true" position="right-bottom" :z-index="2" :gap="{ bottom: 40 }" :expandable="false" @click="openAdd"></wd-fab>
	</view>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import { fetchGetTaskPage } from '@/service/index'
import { MANAGE_USER_TYPES } from './constants'
import taskcard from './taskcard.vue'

const props = defineProps<{ contentHeight: number }>()

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

const userType = Number(uni.getStorageSync('usertype'))
const isManager = MANAGE_USER_TYPES.includes(userType)

const clickLock = ref(false)

// ===== 筛选 =====
const statusOptions = [
    { label: '全部', value: -1 },
    { label: '调试中', value: 1 },
    { label: '暂停', value: 2 },
    { label: '已完成', value: 3 },
]
// 是否延期：0 否、1 是；不传不限制
const delayedOptions = [
    { label: '全部', value: -1 },
    { label: '否', value: 0 },
    { label: '是', value: 1 },
]
const filterStatus = ref<number>(-1)
const filterDelayed = ref<number>(-1)
const fuzzy = ref('')

// ===== 分段控件 =====
function segmentItemStyle(active: boolean) {
    if (active) {
        return { background: isDark.value ? '#3d3d3f' : '#ffffff', color: '#3b82f6', fontWeight: '600' }
    }
    return { color: subColor.value }
}
function selectStatus(v: number) {
    if (filterStatus.value === v) return
    filterStatus.value = v
    handleFilterChange()
}
function selectDelayed(v: number) {
    if (filterDelayed.value === v) return
    filterDelayed.value = v
    handleFilterChange()
}

// ===== 列表 =====
const loading = ref(false)
const triggered = ref(false)
const taskList = ref<any[]>([])
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
        taskList.value = []
        total.value = 0
    }
    loading.value = true
    state.value = 'loading'
    try {
        const data = await fetchGetTaskPage({
            page: page.value,
            limit: 15,
            ...(filterStatus.value !== -1 ? { status: filterStatus.value } : {}),
            ...(filterDelayed.value !== -1 ? { isdelayed: filterDelayed.value } : {}),
            ...(fuzzy.value ? { fuzzy: fuzzy.value } : {}),
        })
        if (seq !== loadSeq) return // 已有更新的请求在途，丢弃本次过期响应
        const list = data.list || []
        total.value = data.total || 0
        taskList.value = page.value === 1 ? list : [...taskList.value, ...list]
        state.value = taskList.value.length >= total.value ? 'finished' : 'loadmore'
    } catch (e) {
        if (seq !== loadSeq) return
        console.error('加载任务列表失败', e)
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

function reload() {
    handleFilterChange()
}

function onRefresh() {
    triggered.value = true
    loadData(true)
}

// ===== 新增任务 =====
function openAdd() {
    if (clickLock.value) return
    clickLock.value = true
    setTimeout(() => { clickLock.value = false }, 500)
    uni.navigateTo({ url: '/mePages/rtask/addtask/Index' })
}

onMounted(() => {
    loadData(true)
    uni.$on('refreshRealtimeTask', reload) // 新增任务页保存后刷新
})
onBeforeUnmount(() => {
    uni.$off('refreshRealtimeTask', reload)
})
</script>

<style lang="scss" scoped>
.tasklist-wrap {
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
            padding: 0 0 16rpx;

            .filter-label {
                font-size: 24rpx;
                flex-shrink: 0;
                width: 64rpx;
            }
        }

        .segment {
            flex: 1;
            min-width: 0;
            display: flex;
            background: rgba(128, 128, 128, 0.12);
            border-radius: 14rpx;
            padding: 4rpx;

            .segment-item {
                flex: 1;
                text-align: center;
                padding: 10rpx 0;
                font-size: 24rpx;
                line-height: 1.2;
                border-radius: 11rpx;
                transition: all 0.15s;
            }
        }

        .search-row {
            padding: 6rpx 0 12rpx;
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
    }

    .list-scroll {
        flex: 1;
        min-height: 0;
        margin-top: 10rpx;

        .list-inner {
            padding: 0 20rpx;
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
