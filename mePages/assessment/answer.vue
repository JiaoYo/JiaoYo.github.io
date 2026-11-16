<template>
	<wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
		<view class="page">
			<wd-navbar left-arrow :title="rowData?.aname || '答题'" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

			<!-- 顶部：倒计时 + 进度 -->
			<view class="header" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
				<view class="timer" :class="{ warn: warned }">
					<text class="timer-icon">⏱</text>
					<text class="timer-text">{{ timeText }}</text>
				</view>
				<view class="progress-row">
					<text class="progress-label" :style="{ color: subColor }">已答 {{ answeredCount }} / {{ questions.length }}</text>
					<view class="progress-bar" :style="{ background: isDark ? 'rgba(255,255,255,0.1)' : '#eef1f5' }">
						<view class="progress-inner" :style="{ width: progressPct + '%' }"></view>
					</view>
				</view>
			</view>

			<!-- 提示：倒计时结束前可随时修改答案 -->
			<!-- 时间不足五分钟提示 -->
			<view v-if="warned" class="time-warn">
				<text class="time-warn-icon">⚠️</text>
				<text>时间不足五分钟，请尽快答题，倒计时结束后将自动提交</text>
			</view>

			<view class="edit-hint" :style="{ color: subColor }">
				<text class="edit-hint-icon">✏️</text>
				<text>倒计时结束前，可随时修改答案</text>
			</view>

			<!-- 题号导航 -->
			<scroll-view scroll-x class="nav-scroll">
				<view class="nav-inner">
					<view v-for="(q, index) in questions" :key="q.aid" class="nav-box" :class="{ answered: q.answer, active: index === currentIndex }" @click="scrollToQuestion(index)">
						{{ index + 1 }}
					</view>
				</view>
			</scroll-view>

			<!-- 答题区 -->
			<scroll-view scroll-y class="answer-scroll" :scroll-into-view="scrollIntoId" scroll-with-animation @scrolltolower="() => {}">
				<view class="answer-inner">
					<view v-for="(q, index) in questions" :key="q.aid" :id="'question-' + index" class="question-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="q-header">
							<view class="q-index" :style="{ background: isDark ? 'rgba(102,126,234,0.2)' : '#eef2ff', color: '#667eea' }">{{ index + 1 }}</view>
							<view class="q-title" :style="{ color: textColor }">{{ q.title }}</view>
							<view class="q-score" :style="{ color: subColor }">({{ q.score ?? 10 }}分)</view>
						</view>

						<view class="q-answer">
							<wd-textarea v-model="q.answer" placeholder="请输入答案" :rows="4" />
						</view>

						<view class="q-files">
							<text class="q-files-label" :style="{ color: subColor }">附件：</text>
							<wd-upload accept="all" :limit="3" v-model:file-list="q.fileList" :upload-method="qiniuUploadMethod" />
						</view>
					</view>

					<view class="bottom-space"></view>
				</view>
			</scroll-view>

			<!-- 提交 -->
			<view class="footer">
				<wd-button type="primary" block :loading="submitting" @click="handleSubmit">提交答题</wd-button>
			</view>
		</view>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
import {
    fetchGetProjectProblemListByPage,
    fetchGetProjectProblemAnswerDataListByPage,
    fetchSaveProjectProblemInfo,
    fetchUpdateProjectProblemInfo,
} from '@/service/assessments'
import { qiniuUploadMethod, getFileNameFromUrl } from './modules/upload'
import type { UploadFile } from '@/uni_modules/wot-design-uni/components/wd-upload/types'

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

function handleBack() {
    // #ifdef H5
    history.go(-1)
    // #endif
    // #ifndef H5
    uni.navigateBack()
    // #endif
}

const rowData = ref<any>(null)
const pid = ref<number | undefined>(undefined)
const userId = uni.getStorageSync('userId')

onLoad(() => {
    const row = uni.getStorageSync('assessment_answer_row')
    rowData.value = row || null
    pid.value = row?.id
    startTime = parseTime(row?.starttime)
    durationMinutes = Number(row?.dura ?? 30)
    endTime = startTime.getTime() + durationMinutes * 60 * 1000
    initCountdown()
    loadQuestions()
})

// ===== 倒计时 =====
let startTime: Date = new Date()
let durationMinutes = 30
let endTime = 0
let timer: any = null
let autoSubmitted = false
const warned = ref(false)

const timeText = ref('00:00')

function parseTime(s: any): Date {
    if (!s) return new Date()
    return new Date(String(s).replace(/-/g, '/'))
}

function formatTime(ms: number) {
    const minutes = Math.floor(ms / 1000 / 60)
    const seconds = Math.floor((ms / 1000) % 60)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function initCountdown() {
    const tick = () => {
        const d = endTime - Date.now()
        if (d <= 0) {
            timeText.value = '00:00'
            clearInterval(timer)
            timer = null
            if (!autoSubmitted) {
                autoSubmitted = true
                handleAutoSubmit()
            }
            return
        }
        timeText.value = formatTime(d)
        if (d <= 5 * 60 * 1000 && !warned.value) {
            warned.value = true
        }
    }
    tick()
    timer = setInterval(tick, 1000)
}

onUnmounted(() => {
    if (timer) clearInterval(timer)
})

// ===== 题目 =====
const questions = ref<any[]>([])
const answeredCount = ref(0)
const progressPct = computed(() => {
    if (!questions.value.length) return 0
    return Math.round((answeredCount.value / questions.value.length) * 100)
})

// 已答数量联动
watch(
    () => questions.value,
    (val) => {
        answeredCount.value = val.filter((q: any) => q.answer && String(q.answer).trim()).length
    },
    { deep: true }
)

async function loadQuestions() {
    if (!pid.value) return
    try {
        const data = await fetchGetProjectProblemListByPage({ page: 1, limit: 100, pid: pid.value })
        const list = data.list || []
        if (!list.length) {
            uni.showToast({ title: '该考核没有问题，请先编辑问题', icon: 'none' })
            return
        }
        const store = list.map((item: any) => ({
            id: undefined,
            aid: item.id,
            title: item.aproblem,
            score: item.score ?? 10,
            answer: '',
            fileList: [] as UploadFile[],
        }))
        questions.value = JSON.parse(JSON.stringify(store))
        await loadAnswers(store)
    } catch (e) {
        console.error('加载题目失败', e)
    }
}

async function loadAnswers(store: any[]) {
    try {
        const data = await fetchGetProjectProblemAnswerDataListByPage({ page: 1, limit: 100, pid: pid.value, creater: userId })
        const list = data.list || []
        if (list.length) {
            questions.value = JSON.parse(JSON.stringify(store))
            list.forEach((item: any) => {
                const target = questions.value.find((q: any) => q.aid === item.aid)
                if (target) {
                    target.id = item.id
                    target.answer = item.answer || ''
                    target.fileList = [item.pfile1, item.pfile2, item.pfile3]
                        .filter(Boolean)
                        .map((url: string) => ({ name: getFileNameFromUrl(url), url, status: 'success' as const }))
                }
            })
        }
    } catch (e) {
        console.error('加载答案失败', e)
    }
}

// ===== 题号导航 =====
const currentIndex = ref(0)
const scrollIntoId = ref('')

function scrollToQuestion(index: number) {
    currentIndex.value = index
    scrollIntoId.value = `question-${index}`
    setTimeout(() => { scrollIntoId.value = '' }, 100)
}

// ===== 提交 =====
const submitting = ref(false)

function getFileUrl(f: UploadFile | undefined): string {
    if (!f) return ''
    return f.response || f.url || ''
}

async function doSubmit() {
    if (submitting.value) return
    // 校验全部作答
    const empty = questions.value.filter((q: any) => !q.answer || !String(q.answer).trim())
    if (empty.length) {
        uni.showToast({ title: `请填写第 ${questions.value.indexOf(empty[0]) + 1} 题的答案`, icon: 'none' })
        return
    }
    // 校验附件上传中
    const uploading = questions.value.some((q: any) =>
        q.fileList.some((f: any) => f.status === 'loading' || (f.url && !f.response && !String(f.url).startsWith('http')))
    )
    if (uploading) {
        uni.showToast({ title: '附件正在上传，请稍候再提交', icon: 'none' })
        return
    }

    submitting.value = true
    try {
        const params = questions.value.map((q: any) => ({
            id: q.id,
            pid: Number(pid.value),
            aid: Number(q.aid),
            answer: String(q.answer).trim(),
            pfile1: getFileUrl(q.fileList[0]),
            pfile2: getFileUrl(q.fileList[1]),
            pfile3: getFileUrl(q.fileList[2]),
        }))
        const isEdit = questions.value.some((q: any) => q.id)
        if (isEdit) {
            await fetchUpdateProjectProblemInfo(params)
        } else {
            await fetchSaveProjectProblemInfo(params)
        }
        uni.showToast({ title: '提交成功', icon: 'none' })
        setTimeout(() => handleBack(), 600)
    } catch (e) {
        console.error('提交答题失败', e)
    } finally {
        submitting.value = false
    }
}

function handleSubmit() {
    doSubmit()
}

async function handleAutoSubmit() {
    if (submitting.value) return
    uni.showToast({ title: '时间到，正在自动提交...', icon: 'none' })
    // 题目还没加载完成时，等待加载完成再提交，避免提交空答案
    const waitUntil = Date.now() + 8000
    while (questions.value.length === 0 && Date.now() < waitUntil) {
        await new Promise((r) => setTimeout(r, 300))
    }
    await doSubmit()
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	overflow: hidden;

	.header {
		flex-shrink: 0;
		padding: 20rpx 24rpx;
		display: flex;
		align-items: center;
		gap: 20rpx;

		.timer {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 10rpx 24rpx;
			border-radius: 16rpx;
			background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
			border: 2rpx solid #fecaca;
			color: #dc2626;
			font-weight: 700;
			font-size: 30rpx;
			font-variant-numeric: tabular-nums;
			flex-shrink: 0;

			&.warn {
				animation: warnPulse 1.5s ease-in-out infinite;
			}

			.timer-icon {
				font-size: 26rpx;
			}
		}

		.progress-row {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 10rpx;

			.progress-label {
				font-size: 22rpx;
			}

			.progress-bar {
				height: 12rpx;
				border-radius: 8rpx;
				overflow: hidden;

				.progress-inner {
					height: 100%;
					border-radius: 8rpx;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					transition: width 0.3s;
				}
			}
		}
	}

	.nav-scroll {
		flex-shrink: 0;
		padding: 12rpx 0;
		white-space: nowrap;

		.nav-inner {
			display: inline-flex;
			gap: 14rpx;
			padding: 4rpx 24rpx;

			.nav-box {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 56rpx;
				height: 56rpx;
				border-radius: 14rpx;
				font-size: 26rpx;
				font-weight: 600;
				color: #64748b;
				background: rgba(128, 128, 128, 0.1);

				&.answered {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: #ffffff;
				}

				&.active {
					box-shadow: 0 0 0 4rpx rgba(102, 126, 234, 0.25);
				}
			}
		}
	}

	.time-warn {
		flex-shrink: 0;
		margin: 10rpx 24rpx 0;
		padding: 12rpx 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		font-size: 24rpx;
		font-weight: 700;
		color: #dc2626;
		background: #fef2f2;
		border: 1rpx solid #fecaca;
		border-radius: 12rpx;

		.time-warn-icon {
			font-size: 22rpx;
		}
	}

	.edit-hint {
		flex-shrink: 0;
		margin: 10rpx 24rpx 0;
		padding: 8rpx 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		font-size: 22rpx;
		border-radius: 999rpx;
		background: rgba(102, 126, 234, 0.08);

		.edit-hint-icon {
			font-size: 20rpx;
		}
	}

	.answer-scroll {
		flex: 1;
		min-height: 0;
		margin-top: 8rpx;

		.answer-inner {
			padding: 0 20rpx;

			.question-card {
				border-radius: 20rpx;
				padding: 24rpx;
				margin-bottom: 20rpx;
				box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);

				.q-header {
					display: flex;
					align-items: center;
					gap: 12rpx;
					margin-bottom: 16rpx;

					.q-index {
						display: flex;
						align-items: center;
						justify-content: center;
						width: 40rpx;
						height: 40rpx;
						border-radius: 10rpx;
						font-size: 24rpx;
						font-weight: 600;
						flex-shrink: 0;
					}

					.q-title {
						flex: 1;
						min-width: 0;
						font-size: 28rpx;
						font-weight: 600;
						line-height: 1.5;
						word-break: break-all;
					}

					.q-score {
						flex-shrink: 0;
						font-size: 22rpx;
					}
				}

				.q-answer {
					margin-bottom: 16rpx;
				}

				.q-files {
					display: flex;
					align-items: flex-start;
					gap: 12rpx;

					.q-files-label {
						font-size: 24rpx;
						padding-top: 10rpx;
						flex-shrink: 0;
					}
				}
			}

			.bottom-space {
				height: 160rpx;
			}
		}
	}

	.footer {
		flex-shrink: 0;
		padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
		background: rgba(245, 246, 248, 0.92);
	}
}

@keyframes warnPulse {
	0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3); }
	50% { box-shadow: 0 0 0 8rpx rgba(220, 38, 38, 0); }
}

/* 暗黑模式适配 */
.wot-theme-dark {
    /* 倒计时框 */
    .timer {
        background: linear-gradient(135deg, #4c1d1d 0%, #3a1515 100%);
        border-color: #7f1d1d;
        color: #f87171;
    }
    /* 时间不足提示 */
    .time-warn {
        color: #f87171;
        background: #3a1515;
        border-color: #7f1d1d;
    }
    /* 底部提交栏 */
    .footer {
        background: rgba(27, 27, 27, 0.92);
    }
    /* 答题输入透出卡片色 */
    :deep(.wd-textarea) {
        background: transparent !important;
    }
    :deep(.wd-input) {
        background: transparent !important;
    }
}

</style>
