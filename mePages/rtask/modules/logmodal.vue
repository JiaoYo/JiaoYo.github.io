<template>
	<wd-popup v-model="visible" position="bottom" :z-index="200" custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 80vh;">
		<view class="log-wrap">
			<view class="log-title">操作日志</view>
			<view class="log-info">
				<text class="log-info-sub">项目名称：{{ rowData?.proname || '-' }}</text>
				<text class="log-info-name">任务名称：{{ rowData?.taskName || '-' }}</text>
			</view>

			<scroll-view scroll-y class="log-list" :style="{ height: '50vh' }" @scrolltolower="loadMore">
				<view v-for="(log, index) in logList" :key="log.id || index" class="log-item">
					<view class="log-item-top">
						<view class="type-tag" :style="{ backgroundColor: typeColor(log.type) + '20', color: typeColor(log.type) }">
							{{ typeLabel(log.type) }}
						</view>
						<text class="log-op">{{ log.operator || log.username || log.creater || '-' }}</text>
					</view>
					<text class="log-time">{{ log.dbtime }}</text>
				</view>

				<view v-if="!loading && logList.length === 0" class="log-empty">暂无操作日志</view>
				<wd-loadmore :state="state" @reload="loadLogs" />
			</scroll-view>
		</view>
	</wd-popup>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import { fetchGetTaskLogPage } from '@/service/task'
import { getLogTypeConfig } from './constants'

const props = defineProps<{ modelValue: boolean; rowData?: any }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const titleColor = computed(() => (isDark.value ? '#ffffff' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const timeColor = computed(() => (isDark.value ? '#8e8e93' : '#9ca3af'))
const borderColor = computed(() => (isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'))

const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const logList = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore')

function typeLabel(type: number | undefined) {
    return getLogTypeConfig(type).label
}
function typeColor(type: number | undefined) {
    return getLogTypeConfig(type).color
}

async function loadLogs(reset = false) {
    if (reset) {
        page.value = 1
        logList.value = []
        total.value = 0
    }
    if (!props.rowData?.id) return
    loading.value = true
    state.value = 'loading'
    try {
        const data = await fetchGetTaskLogPage({ page: page.value, limit: 20, pid: props.rowData.id })
        const list = data.list || []
        total.value = data.total || 0
        logList.value = page.value === 1 ? list : [...logList.value, ...list]
        state.value = logList.value.length >= total.value ? 'finished' : 'loadmore'
    } catch (e) {
        console.error('加载日志失败', e)
        state.value = 'error'
    } finally {
        loading.value = false
    }
}

function loadMore() {
    if (state.value === 'finished' || state.value === 'loading') return
    page.value++
    loadLogs()
}

watch(visible, (val) => {
    if (val) {
        loadLogs(true)
    }
})
</script>

<style lang="scss" scoped>
.log-wrap {
    padding: 30rpx 30rpx 20rpx;
    box-sizing: border-box;
    max-height: 80vh;
    overflow: hidden;

    .log-title {
        font-size: 32rpx;
        font-weight: 600;
        text-align: center;
        margin-bottom: 20rpx;
    }

    .log-info {
        display: flex;
        flex-direction: column;
        background: rgba(128, 128, 128, 0.08);
        border-radius: 16rpx;
        padding: 20rpx;
        margin-bottom: 20rpx;

        .log-info-name {
            font-size: 28rpx;
            font-weight: 500;
            color: v-bind(titleColor);
        }

        .log-info-sub {
            font-size: 24rpx;
            color: v-bind(subColor);
            margin-top: 8rpx;
        }
    }

    .log-list {
        .log-item {
            padding: 20rpx 0;
            border-bottom: 1rpx solid v-bind(borderColor);

            .log-item-top {
                display: flex;
                align-items: center;
                justify-content: space-between;

                .type-tag {
                    font-size: 22rpx;
                    font-weight: 500;
                    padding: 4rpx 16rpx;
                    border-radius: 12rpx;
                }

                .log-op {
                    font-size: 26rpx;
                    color: v-bind(textColor);
                }
            }

            .log-time {
                display: block;
                font-size: 22rpx;
                color: v-bind(timeColor);
                margin-top: 10rpx;
            }
        }

        .log-empty {
            text-align: center;
            padding: 60rpx 0;
            font-size: 26rpx;
            color: v-bind(timeColor);
        }
    }
}
</style>
