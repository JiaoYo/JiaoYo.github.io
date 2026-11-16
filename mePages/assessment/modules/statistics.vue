<template>
	<wd-popup v-model="visible" position="bottom" :z-index="200" custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 82vh;">
		<view class="s-wrap">
			<view class="s-title" :style="{ color: textColor }">{{ props.rowData?.aname || '工程考核' }} · 成绩统计</view>

			<!-- 概览卡片 -->
			<view class="summary-grid">
				<view v-for="item in summaryCards" :key="item.label" class="summary-card" :style="{ background: item.bg }">
					<text class="summary-label" :style="{ color: subColor }">{{ item.label }}</text>
					<text class="summary-value" :style="{ color: textColor }">{{ item.value }}<text class="summary-unit">{{ item.suffix }}</text></text>
				</view>
			</view>

			<scroll-view scroll-y class="s-body">
				<!-- 已参与人员及成绩 -->
				<view class="s-section">
					<view class="s-section-head">
						<view class="s-mark mark-green"></view>
						<view>
							<view class="s-section-title" :style="{ color: textColor }">已参与人员及成绩</view>
							<view class="s-section-sub" :style="{ color: subColor }">共 {{ participatedUsers.length }} 人已提交答案，按得分降序排列</view>
						</view>
					</view>

					<view v-if="participatedUsers.length" class="score-list" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#edf1f5' }">
						<view class="score-row score-head">
							<text>排名</text>
							<text>姓名</text>
							<text>得分</text>
							<text>等级</text>
						</view>
						<view v-for="(user, index) in participatedUsers" :key="user.id" class="score-row">
							<view class="rank" :class="`rank-${index < 3 ? index + 1 : 'other'}`">{{ index + 1 }}</view>
							<text class="score-name" :style="{ color: textColor }">{{ user.username }}</text>
							<text class="score-num" :style="{ color: textColor }">{{ user.score }}<text class="score-total">/ {{ totalScore }} 分</text></text>
							<view class="grade" :style="{ backgroundColor: gradeColor(user.score) + '20', color: gradeColor(user.score) }">{{ gradeLevel(user.score) }}</view>
						</view>
					</view>
					<view v-else class="s-empty" :style="{ color: subColor }">暂无人员参与考核</view>
				</view>

				<!-- 成绩分布 -->
				<view class="s-section">
					<view class="s-section-head">
						<view class="s-mark"></view>
						<view>
							<view class="s-section-title" :style="{ color: textColor }">成绩分布</view>
							<view class="s-section-sub" :style="{ color: subColor }">以已参加人员为统计基数</view>
						</view>
					</view>
					<view class="perf-list">
						<view v-for="item in performanceLevels" :key="item.label" class="perf-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#edf1f5' }">
							<view class="perf-meta">
								<view>
									<text class="perf-label" :style="{ color: textColor }">{{ item.label }}</text>
									<text class="perf-desc" :style="{ color: subColor }">{{ item.description }}</text>
								</view>
								<text class="perf-count" :style="{ color: textColor }">{{ item.count }} 人 <text class="perf-rate" :style="{ color: subColor }">{{ item.rate }}%</text></text>
							</view>
							<view class="perf-bar" :style="{ background: isDark ? 'rgba(255,255,255,0.1)' : '#eef1f5' }">
								<view class="perf-inner" :style="{ width: item.rate + '%', background: item.color }"></view>
							</view>
						</view>
					</view>
				</view>

				<!-- 未参与人员 -->
				<view class="s-section">
					<view class="s-section-head">
						<view class="s-mark mark-orange"></view>
						<view>
							<view class="s-section-title" :style="{ color: textColor }">未参与人员</view>
							<view class="s-section-sub" :style="{ color: subColor }">共 {{ notParticipatedUsers.length }} 人尚未提交有效答案</view>
						</view>
					</view>
					<view v-if="notParticipatedUsers.length" class="user-tags">
						<view v-for="user in notParticipatedUsers" :key="user.parti" class="user-tag">{{ user.username }}</view>
					</view>
					<view v-else class="s-empty" :style="{ color: subColor }">全部人员均已参与考核</view>
				</view>
			</scroll-view>

			<view class="s-footer">
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
const participants = ref<any[]>([])

const statistics = computed(() => props.rowData?.statistics ?? {})
const totalScore = computed(() => Number(statistics.value.totalScore ?? 0))

const summaryCards = computed(() => [
    { label: '题目总分', value: statistics.value.totalScore ?? 0, suffix: '分', bg: 'rgba(59,130,246,0.08)' },
    { label: '应参加', value: statistics.value.assessmentCount ?? 0, suffix: '人', bg: 'rgba(100,116,139,0.08)' },
    { label: '已参加', value: statistics.value.participatedCount ?? 0, suffix: '人', bg: 'rgba(22,163,74,0.08)' },
    { label: '未参加', value: statistics.value.notParticipatedCount ?? 0, suffix: '人', bg: 'rgba(217,119,6,0.08)' },
])

const participatedUsers = computed(() =>
    participants.value.filter((u: any) => u.participated).sort((a: any, b: any) => b.score - a.score)
)
const notParticipatedUsers = computed(() => statistics.value.notParticipatedUsers ?? [])

function gradeLevel(score: number) {
    const rate = totalScore.value > 0 ? score / totalScore.value : 0
    if (rate >= 0.8) return '优'
    if (rate >= 0.6) return '良'
    return '差'
}
function gradeColor(score: number) {
    const level = gradeLevel(score)
    if (level === '优') return '#16a34a'
    if (level === '良') return '#d97706'
    return '#dc2626'
}

const performanceLevels = computed(() => [
    {
        label: '不合格',
        description: '得分率低于 60%',
        count: Number(statistics.value.unqualifiedCount ?? 0),
        rate: toPct(statistics.value.unqualifiedRate),
        color: '#dc2626',
    },
    {
        label: '良好',
        description: '得分率 60% - 79%',
        count: Number(statistics.value.goodCount ?? 0),
        rate: toPct(statistics.value.goodRate),
        color: '#d97706',
    },
    {
        label: '优秀',
        description: '得分率不低于 80%',
        count: Number(statistics.value.excellentCount ?? 0),
        rate: toPct(statistics.value.excellentRate),
        color: '#16a34a',
    },
])

function toPct(rate: unknown) {
    const v = Number(rate ?? 0)
    const p = v <= 1 ? v * 100 : v
    return Number(Math.min(Math.max(p, 0), 100).toFixed(1))
}

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

// 逐人拉取答案计算得分
async function loadScores(pid: number, ids: number[]): Promise<Record<string, number>> {
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
                /* 忽略单用户失败 */
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
        const users = await fetchParticipants()
        const scoreMap = await loadScores(pid, users.map((u: any) => u.id))
        participants.value = users.map((u: any) => {
            const score = scoreMap[String(u.id)]
            return { id: u.id, username: u.username, score: score ?? 0, participated: score !== undefined }
        })
    } catch (e) {
        console.error('加载成绩统计失败', e)
    } finally {
        loading.value = false
    }
}

watch(visible, (val) => {
    if (val) loadData()
})
</script>

<style lang="scss" scoped>
.s-wrap {
    padding: 30rpx 30rpx 20rpx;
    box-sizing: border-box;
    height: 82vh;
    max-height: 82vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .s-title {
        font-size: 32rpx;
        font-weight: 600;
        text-align: center;
        margin-bottom: 20rpx;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12rpx;
        margin-bottom: 20rpx;

        .summary-card {
            border-radius: 16rpx;
            padding: 18rpx 16rpx;
            display: flex;
            flex-direction: column;
            gap: 10rpx;

            .summary-label {
                font-size: 20rpx;
            }

            .summary-value {
                font-size: 32rpx;
                font-weight: 700;
                font-variant-numeric: tabular-nums;

                .summary-unit {
                    font-size: 20rpx;
                    font-weight: 400;
                    margin-left: 2rpx;
                }
            }
        }
    }

    .s-body {
        flex: 1;
        min-height: 0;
        overscroll-behavior: contain;

        .s-section {
            margin-bottom: 28rpx;

            .s-section-head {
                display: flex;
                align-items: center;
                gap: 12rpx;
                margin-bottom: 16rpx;

                .s-mark {
                    width: 6rpx;
                    height: 40rpx;
                    border-radius: 6rpx;
                    background: #4b7bec;

                    &.mark-green { background: #16a34a; }
                    &.mark-orange { background: #d97706; }
                }

                .s-section-title {
                    font-size: 28rpx;
                    font-weight: 600;
                }

                .s-section-sub {
                    font-size: 20rpx;
                    margin-top: 4rpx;
                }
            }

            .score-list {
                border: 1rpx solid;
                border-radius: 16rpx;
                overflow: hidden;

                .score-row {
                    display: grid;
                    grid-template-columns: 64rpx 1fr 150rpx 80rpx;
                    align-items: center;
                    gap: 8rpx;
                    padding: 14rpx 16rpx;
                    font-size: 24rpx;

                    &:nth-child(odd) {
                        background: rgba(128, 128, 128, 0.04);
                    }

                    &.score-head {
                        background: rgba(128, 128, 128, 0.08) !important;
                        color: #98a2b3;
                        font-size: 22rpx;
                        font-weight: 600;
                    }

                    .rank {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 36rpx;
                        height: 36rpx;
                        border-radius: 50%;
                        color: #fff;
                        font-size: 20rpx;
                        background: #94a3b8;

                        &.rank-1 { background: #f5a623; }
                        &.rank-2 { background: #94a3b8; }
                        &.rank-3 { background: #cd7f32; }
                        &.rank-other { background: #cbd5e1; }
                    }

                    .score-name {
                        font-weight: 500;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .score-num {
                        font-variant-numeric: tabular-nums;

                        .score-total {
                            font-size: 20rpx;
                            color: #98a2b3;
                        }
                    }

                    .grade {
                        text-align: center;
                        font-size: 22rpx;
                        font-weight: 600;
                        padding: 4rpx 0;
                        border-radius: 8rpx;
                    }
                }
            }

            .perf-list {
                display: flex;
                flex-direction: column;
                gap: 14rpx;

                .perf-item {
                    border: 1rpx solid;
                    border-radius: 16rpx;
                    padding: 16rpx 18rpx;

                    .perf-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 12rpx;

                        .perf-label {
                            display: block;
                            font-size: 26rpx;
                            font-weight: 600;
                        }

                        .perf-desc {
                            display: block;
                            font-size: 20rpx;
                            margin-top: 4rpx;
                        }

                        .perf-count {
                            font-size: 26rpx;
                            font-weight: 600;
                            text-align: right;
                            white-space: nowrap;

                            .perf-rate {
                                font-size: 20rpx;
                                font-weight: 400;
                            }
                        }
                    }

                    .perf-bar {
                        height: 12rpx;
                        border-radius: 8rpx;
                        overflow: hidden;

                        .perf-inner {
                            height: 100%;
                            border-radius: 8rpx;
                            transition: width 0.3s;
                        }
                    }
                }
            }

            .user-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 12rpx;
                padding: 16rpx;
                border: 1rpx dashed rgba(128, 128, 128, 0.3);
                border-radius: 16rpx;

                .user-tag {
                    padding: 6rpx 20rpx;
                    border-radius: 999rpx;
                    font-size: 22rpx;
                    color: #d97706;
                    background: rgba(217, 119, 6, 0.12);
                }
            }

            .s-empty {
                text-align: center;
                padding: 40rpx 0;
                font-size: 24rpx;
            }
        }
    }

    .s-footer {
        padding-top: 20rpx;
    }
}
</style>
