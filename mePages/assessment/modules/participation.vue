<template>
	<wd-popup v-model="visible" position="bottom" :z-index="200" custom-style="border-radius: 24rpx 24rpx 24rpx 24rpx; max-height: 80vh;">
		<view class="p-wrap">
			<view class="p-title" :style="{ color: textColor }">{{ props.rowData?.aname || '工程考核' }} · 参加情况</view>

			<view class="p-summary">
				<text class="p-summary-label">考核总分</text>
				<text class="p-summary-value">{{ totalScore }} 分</text>
			</view>

			<scroll-view scroll-y class="p-body">
				<!-- 已参加 -->
				<view class="p-section">
					<view class="p-section-head">
						<view class="dot dot-green"></view>
						<text class="p-section-title" :style="{ color: textColor }">已参加</text>
						<text class="p-section-count">{{ participatedUsers.length }} 人</text>
					</view>
					<view v-if="participatedUsers.length" class="p-user-list">
						<view v-for="user in participatedUsers" :key="user.id" class="p-user p-user-ok">
							<view class="p-avatar" :style="{ background: '#16a34a' }">{{ (user.username || '?').slice(0, 1) }}</view>
							<text class="p-name" :style="{ color: textColor }">{{ user.username }}</text>
							<text class="p-score">{{ user.score }} 分</text>
						</view>
					</view>
					<view v-else class="p-empty" :style="{ color: subColor }">暂无人员参加</view>
				</view>

				<!-- 未参加 -->
				<view class="p-section">
					<view class="p-section-head">
						<view class="dot dot-orange"></view>
						<text class="p-section-title" :style="{ color: textColor }">未参加</text>
						<text class="p-section-count">{{ notParticipatedUsers.length }} 人</text>
					</view>
					<view v-if="notParticipatedUsers.length" class="p-user-list">
						<view v-for="user in notParticipatedUsers" :key="user.parti" class="p-user p-user-no">
							<view class="p-avatar" :style="{ background: '#d97706' }">{{ (user.username || '?').slice(0, 1) }}</view>
							<text class="p-name" :style="{ color: textColor }">{{ user.username }}</text>
							<text class="p-no-tag">未参加</text>
						</view>
					</view>
					<view v-else class="p-empty" :style="{ color: subColor }">全部人员均已参加</view>
				</view>
			</scroll-view>

			<view class="p-footer">
				<wd-button size="medium" block @click="visible = false">关闭</wd-button>
			</view>
		</view>
	</wd-popup>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import { fetchAssessmentUserList, fetchGetProjectProblemAnswerDataListByPage } from '@/service/assessments'
import { fetchGetAllUserDataList } from '@/service/index'

const props = defineProps<{ modelValue: boolean; rowData?: any }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const rows = ref<any[]>([])

const totalScore = computed(() => {
    const s = props.rowData?.statistics
    return s?.totalScore != null ? Number(s.totalScore) : 0
})
const participatedUsers = computed(() => rows.value.filter((r) => r.participated).sort((a: any, b: any) => b.score - a.score))
const notParticipatedUsers = computed(() => props.rowData?.statistics?.notParticipatedUsers ?? [])

// 直接取参与表作为人员列表（与答题详情页一致）
async function fetchParticipants(): Promise<any[]> {
    const pid = props.rowData?.id
    if (!pid) return []
    const data = await fetchAssessmentUserList({ page: 1, limit: 100, pid })
    const partiIds = (data.list || []).map((i: any) => i.parti)
    // 用户列表仅用于补全姓名等信息（不过滤状态，参与表里的人全部保留）
    const all = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '3,9' }).catch(() => ({ list: [] }))
    const byId = new Map((all.list || []).map((u: any) => [u.id, u]))
    return partiIds.map((id: number) => byId.get(id) || { id, username: `用户${id}` })
}

// 逐人拉取答案，汇总得分
async function loadScoreMap(pid: number, ids: number[]): Promise<Record<string, number>> {
    const map: Record<string, number> = {}
    await Promise.all(
        ids.map(async (id: number) => {
            try {
                const data = await fetchGetProjectProblemAnswerDataListByPage({ page: 1, limit: 100, pid, creater: id })
                const list = data.list || []
                if (list.length) {
                    map[String(id)] = list.reduce((sum: number, item: any) => sum + (Number(item.rating) || 0), 0)
                }
            } catch {
                /* 单个用户失败忽略 */
            }
        })
    )
    return map
}

async function loadData() {
    const pid = props.rowData?.id
    if (!pid) return
    loading.value = true
    try {
        const participants = await fetchParticipants()
        const ids = participants.map((u: any) => u.id)
        const scoreMap = await loadScoreMap(pid, ids)

        rows.value = participants.map((u: any) => {
            const key = String(u.id)
            return {
                id: u.id,
                username: u.username,
                score: scoreMap[key] ?? 0,
                participated: scoreMap[key] !== undefined,
            }
        })
    } catch (e) {
        console.error('加载参加情况失败', e)
    } finally {
        loading.value = false
    }
}

watch(visible, (val) => {
    if (val) loadData()
})
</script>

<style lang="scss" scoped>
.p-wrap {
    padding: 30rpx 30rpx 20rpx;
    box-sizing: border-box;
    height: 80vh;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .p-title {
        font-size: 32rpx;
        font-weight: 600;
        text-align: center;
        margin-bottom: 20rpx;
    }

    .p-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16rpx 24rpx;
        border-radius: 16rpx;
        background: rgba(102, 126, 234, 0.08);
        border: 1rpx solid rgba(102, 126, 234, 0.2);
        margin-bottom: 20rpx;

        .p-summary-label {
            font-size: 24rpx;
            color: #64748b;
        }

        .p-summary-value {
            font-size: 28rpx;
            font-weight: 700;
            color: #4b7bec;
        }
    }

    .p-body {
        flex: 1;
        min-height: 0;
        overscroll-behavior: contain;

        .p-section {
            margin-bottom: 24rpx;

            .p-section-head {
                display: flex;
                align-items: center;
                gap: 12rpx;
                margin-bottom: 14rpx;

                .dot {
                    width: 14rpx;
                    height: 14rpx;
                    border-radius: 50%;

                    &.dot-green { background: #16a34a; }
                    &.dot-orange { background: #d97706; }
                }

                .p-section-title {
                    font-size: 28rpx;
                    font-weight: 600;
                }

                .p-section-count {
                    margin-left: auto;
                    font-size: 22rpx;
                    color: #98a2b3;
                }
            }

            .p-user-list {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12rpx;

                .p-user {
                    display: flex;
                    align-items: center;
                    gap: 12rpx;
                    padding: 14rpx 16rpx;
                    border-radius: 16rpx;
                    border: 1rpx solid rgba(128, 128, 128, 0.12);
                    background: rgba(128, 128, 128, 0.05);

                    .p-avatar {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 44rpx;
                        height: 44rpx;
                        border-radius: 50%;
                        color: #fff;
                        font-size: 22rpx;
                        flex-shrink: 0;
                    }

                    .p-name {
                        flex: 1;
                        min-width: 0;
                        font-size: 26rpx;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .p-score {
                        font-size: 24rpx;
                        font-weight: 600;
                        color: #16a34a;
                    }

                    .p-no-tag {
                        font-size: 22rpx;
                        color: #d97706;
                    }
                }
            }

            .p-empty {
                text-align: center;
                padding: 40rpx 0;
                font-size: 24rpx;
            }
        }
    }

    .p-footer {
        padding-top: 20rpx;
    }
}
</style>
