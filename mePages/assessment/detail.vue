<template>
	<wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
		<view class="page">
			<wd-navbar left-arrow :title="rowData?.aname || '考核详情'" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

			<!-- 汇总条（管理者可见） -->
			<view v-if="isManager && rowData?.statistics" class="summary-bar">
				<view class="sum-item">
					<text class="sum-label">题目总分</text>
					<text class="sum-value" style="color: #4b7bec">{{ Number(rowData.statistics.totalScore ?? 0) }} 分</text>
				</view>
				<view class="sum-item">
					<text class="sum-label">应参加</text>
					<text class="sum-value">{{ Number(rowData.statistics.assessmentCount ?? 0) }}</text>
				</view>
				<view class="sum-item">
					<text class="sum-label">已参加</text>
					<text class="sum-value" style="color: #16a34a">{{ Number(rowData.statistics.participatedCount ?? 0) }}</text>
				</view>
				<view class="sum-item">
					<text class="sum-label">未参加</text>
					<text class="sum-value" style="color: #d97706">{{ Number(rowData.statistics.notParticipatedCount ?? 0) }}</text>
				</view>
			</view>

			<!-- 参与人员（管理者可见） -->
			<template v-if="isManager">
				<view class="user-scroll-wrap">
					<scroll-view scroll-x class="user-scroll" :show-scrollbar="false" :scroll-left="userScrollLeft" @scroll="onUserScroll">
						<view class="user-inner">
							<view v-for="user in userList" :key="user.id" class="user-chip" :class="{ active: activeUserId === user.id }" @click="selectUser(user.id)">
								<view class="user-avatar" :style="{ background: avatarColor(user) }">{{ (user.username || '?').slice(0, 1) }}</view>
								<view class="user-meta">
									<text class="user-name">{{ user.username }}</text>
									<text class="user-status" :class="userStatusClass(user)">{{ userStatusText(user) }}</text>
								</view>
							</view>
							<view v-if="!userList.length" class="user-empty">暂无参与人员</view>
						</view>
					</scroll-view>
					<view v-if="userShowArrow" class="user-fade" :style="{ background: userFade }"></view>
					<view v-if="userShowArrow" class="user-arrow" :hover-class="'user-arrow-hover'" @click="onArrowTap">></view>
				</view>

				<!-- 当前评分条 -->
				<view class="grading-bar">
					<view class="grading-info">
						<text class="grading-label">{{ currentUserParticipated ? '当前评分：' : '当前查看：' }}</text>
						<text class="grading-name">{{ currentUserName }}</text>
					</view>
					<wd-button size="small" type="primary" :loading="saving" :disabled="!currentUserParticipated || !hasChanges" @click="handleSubmit">保存评分</wd-button>
				</view>

				<!-- 当前人统计 -->
				<view class="stats-row">
					<text>总问题 {{ stats.total }}</text>
					<text>已评 {{ stats.rated }}</text>
										<text>平均 {{ stats.avg }}</text>
				</view>
			</template>

			<!-- 个人得分汇总 -->
			<view v-if="!loading && questions.length" class="score-summary">
				<view class="score-item">
					<text class="score-label" :style="{ color: subColor }">总分</text>
					<text class="score-value" :style="{ color: textColor }">{{ stats.totalScore }} 分</text>
				</view>
				<view class="score-divider"></view>
				<view class="score-item">
					<text class="score-label" :style="{ color: subColor }">得分</text>
					<text class="score-value" :style="{ color: '#4b7bec' }">{{ stats.totalRating }} 分</text>
				</view>
			</view>
			<!-- 答题区 -->
			<scroll-view scroll-y class="answer-scroll">
				<view class="answer-inner">
					<!-- 无题提示 -->
					<view v-if="!loading && !questions.length" class="empty" :style="{ color: subColor }">暂无题目数据</view>

					<view v-for="(item, index) in questions" :key="item.aid" class="q-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="q-header">
							<view class="q-index" :style="{ background: isDark ? 'rgba(102,126,234,0.2)' : '#eef2ff', color: '#667eea' }">{{ index + 1 }}</view>
							<view class="q-title" :style="{ color: textColor }">{{ item.title }}</view>
							<view class="q-score" :style="{ color: subColor }">({{ item.score ?? 10 }}分)</view>
							<template v-if="isManager">
								<wd-input v-if="item.answer" :model-value="item.rating" @update:model-value="onRatingInput(item, $event)" type="digit" maxlength="2" placeholder="评分" class="rating-input" />
								<view v-else class="rating-placeholder" :style="{ color: subColor }">未答</view>
							</template>
							<!-- 参与者查看：每题得分 -->
							<template v-else>
								<view v-if="hasRating(item)" class="q-earn" :style="{ color: '#4b7bec' }">得分 {{ item.rating }} 分</view>
								<view v-else-if="item.answer" class="rating-placeholder" :style="{ color: subColor }">未评分</view>
								<view v-else class="rating-placeholder" :style="{ color: subColor }">未答</view>
							</template>
						</view>

						<view class="q-answer">
							<text class="q-answer-label" :style="{ color: subColor }">答案</text>
							<view class="q-answer-text" :style="{ color: textColor, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb' }">{{ item.answer || '暂无作答' }}</view>
						</view>

						<view v-if="item.fileList.length" class="q-files">
							<text class="q-files-label" :style="{ color: subColor }">附件</text>
							<view class="file-list">
								<view v-for="(f, fi) in item.fileList" :key="fi" class="file-item" @click="openFile(f)">
									<text class="file-icon">📎</text>
									<text class="file-name">{{ f.name || '附件' + (fi + 1) }}</text>
									<text class="file-open">预览</text>
								</view>
							</view>
						</view>
					</view>

					<view class="bottom-space"></view>
				</view>
			</scroll-view>
		</view>

		<wd-message-box />
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, ref } from 'vue'
import { onLoad, onReady } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import {
    fetchGetProjectProblemListByPage,
    fetchGetProjectProblemAnswerDataListByPage,
    fetchUpdateProjectProblemInfo,
    fetchAssessmentUserList,
} from '@/service/assessments'
import { fetchGetAllUserDataList } from '@/service/index'
import { getFileNameFromUrl } from './modules/upload'

const message = useMessage()

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

const userId = String(uni.getStorageSync('userId'))
const userType = Number(uni.getStorageSync('usertype'))
const isManager = computed(() => userType === 0 || userType === 2)

function handleBack() {
    // #ifdef H5
    history.go(-1)
    // #endif
    // #ifndef H5
    uni.navigateBack()
    // #endif
}

const instance = getCurrentInstance()

// ===== 参与人员横向滚动提示 =====
const userShowArrow = ref(false)
const userScrollLeft = ref(0)
// 当前滚动位置用非响应式变量记录：scroll-view 的 scroll-left 是受控属性，
// 若在 @scroll 里每帧改 ref 会触发重渲染并把 scrollLeft 写回组件，来回打架导致滚动卡顿。
let userScrollPos = 0
let userViewW = 0
let userContentW = 0
let userChipW = 0
const userFade = computed(() =>
    isDark.value
        ? 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)'
        : 'linear-gradient(90deg, rgba(248,249,250,0) 0%, rgba(248,249,250,1) 100%)'
)

function measureUserScroll() {
    if (!instance) return
    const query = uni.createSelectorQuery().in(instance)
    query.select('.user-scroll').boundingClientRect((rect: any) => {
        if (rect) userViewW = rect.width
    })
    query.select('.user-inner').boundingClientRect((rect: any) => {
        if (rect) {
            userContentW = rect.width
            userShowArrow.value = rect.width > userViewW + 1
        }
    })
    query.select('.user-chip').boundingClientRect((rect: any) => {
        if (rect) userChipW = rect.width
    })
    query.exec()
}

function onUserScroll(e: any) {
    const sw = e.detail?.scrollWidth || userContentW
    const sl = e.detail?.scrollLeft || 0
    userScrollPos = sl
    userShowArrow.value = sl + userViewW < sw - 2
}

// 点击右侧箭头，向右滚动一个用户元素的宽度
function onArrowTap() {
    const gap = uni.upx2px(14)
    const step = userChipW > 0 ? userChipW + gap : Math.max(Math.round(userViewW * 0.5), 60)
    const max = Math.max(userContentW - userViewW, 0)
    userScrollLeft.value = Math.min(userScrollPos + step, max)
}

onReady(() => {
    measureUserScroll()
})

const rowData = ref<any>(null)
const pid = ref<number | undefined>(undefined)

onLoad(() => {
    const row = uni.getStorageSync('assessment_detail_row')
    rowData.value = row || null
    pid.value = row?.id
    loadQuestions()
})

// ===== 题目 =====
const loading = ref(false)
const questions = ref<any[]>([]) // 当前展示列表
let storeQuestions: any[] = []   // 原始题目快照

async function loadQuestions() {
    if (!pid.value) return
    loading.value = true
    try {
        const data = await fetchGetProjectProblemListByPage({ page: 1, limit: 100, pid: pid.value })
        const list = data.list || []
        storeQuestions = list.map((item: any) => ({
            id: undefined,
            aid: item.id,
            title: item.aproblem,
            score: item.score ?? 10,
            answer: '',
            rating: '' as any,
            fileList: [] as any[],
        }))
        if (isManager.value) {
            await loadUserList()
            await loadGradeStatus()
            // 已参与（交卷）的人员排前面，未参与的排后面
            userList.value = sortUsersByParticipation()
            if (userList.value.length) {
                await selectUser(userList.value[0].id, true)
            } else {
                resetQuestions()
            }
        } else {
            await loadAnswers(userId)
        }
    } catch (e) {
        console.error('加载题目失败', e)
    } finally {
        loading.value = false
    }
}

function resetQuestions() {
    questions.value = JSON.parse(JSON.stringify(storeQuestions))
    ratingSnapshot.value = questions.value.map((item: any) => item.rating)
}

// ===== 参与人员 =====
const userList = ref<any[]>([])
const activeUserId = ref<number | undefined>(undefined)
const gradeStatus = ref<Record<string, { participated: boolean; graded: boolean; score: number }>>({})

async function loadUserList() {
    // 直接取参与表作为人员列表（全员/指定参与都会写入参与表，顺序以参与表为准）
    const data = await fetchAssessmentUserList({ page: 1, limit: 100, pid: pid.value })
    const partiIds = (data.list || []).map((i: any) => i.parti)
    // 用户列表仅用于补全姓名等信息（不过滤状态，参与表里的人全部保留）
    const all = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '3,9' }).catch(() => ({ list: [] }))
    const byId = new Map((all.list || []).map((u: any) => [u.id, u]))
    userList.value = partiIds.map((id: number) => byId.get(id) || { id, username: `用户${id}` })
    nextTick(() => measureUserScroll())
}

async function loadGradeStatus() {
    const map: Record<string, { participated: boolean; graded: boolean; score: number }> = {}
    await Promise.all(
        userList.value.map(async (user: any) => {
            const key = String(user.id)
            try {
                const data = await fetchGetProjectProblemAnswerDataListByPage({ page: 1, limit: 100, pid: pid.value, creater: user.id })
                const list = data.list || []
                if (!list.length) {
                    map[key] = { participated: false, graded: false, score: 0 }
                    return
                }
                const rated = list.filter((item: any) => item.rating != null && item.rating !== '').length
                map[key] = {
                    participated: true,
                    graded: rated >= list.length,
                    score: list.reduce((sum: number, item: any) => sum + (Number(item.rating) || 0), 0),
                }
            } catch {
                map[key] = { participated: false, graded: false, score: 0 }
            }
        })
    )
    gradeStatus.value = map
}

// ===== 用户选中 / 答案加载 =====
const ratingSnapshot = ref<any[]>([])

const currentUserName = computed(() => {
    const u = userList.value.find((item: any) => item.id === activeUserId.value)
    return u?.username || ''
})
const currentUserParticipated = computed(() => {
    if (activeUserId.value === undefined) return false
    return gradeStatus.value[String(activeUserId.value)]?.participated ?? false
})
const hasChanges = computed(() => {
    const norm = (v: any) => (v === null || v === undefined || v === '' ? '' : Number(v))
    return questions.value.some((item: any, index: number) => norm(item.rating) !== norm(ratingSnapshot.value[index]))
})

// 评分输入：只允许输入 0-10 的整数，超出范围自动截断
function onRatingInput(item: any, val: any) {
    const s = String(val ?? '').replace(/[^\d]/g, '').slice(0, 2)
    const max = Math.min(Number(item.score ?? 10) || 10, 10)
    item.rating = s === '' ? '' : Math.min(Number(s), max)
}


// 每题得分是否已评
function hasRating(item: any) {
    return item.rating !== '' && item.rating != null
}

function userGradeInfo(user: any) {
    return gradeStatus.value[String(user.id)] ?? { participated: false, graded: false, score: 0 }
}
// 参与（已交卷）的人员排前面，未参与的排后面，组内保持原顺序
function sortUsersByParticipation() {
    return [...userList.value].sort((a: any, b: any) => {
        const ia = userGradeInfo(a)
        const ib = userGradeInfo(b)
        return Number(ib.participated) - Number(ia.participated)
    })
}
function userStatusClass(user: any) {
    const info = userGradeInfo(user)
    if (!info.participated) return 'unrated'
    return info.graded ? 'rated' : 'pending'
}
function userStatusText(user: any) {
    const info = userGradeInfo(user)
    if (!info.participated) return '未参加'
    return info.graded ? `已评 ${info.score} 分` : '未评分'
}
function avatarColor(user: any) {
    const info = userGradeInfo(user)
    if (!info.participated) return '#94a3b8'
    return info.graded ? '#16a34a' : '#d97706'
}

async function selectUser(id: number, force = false) {
    if (!force && id === activeUserId.value) return
    activeUserId.value = id
    await loadAnswers(String(id))
}

async function loadAnswers(creater: string) {
    questions.value = JSON.parse(JSON.stringify(storeQuestions))
    try {
        const data = await fetchGetProjectProblemAnswerDataListByPage({ page: 1, limit: 100, pid: pid.value, creater })
        const list = data.list || []
        list.forEach((item: any) => {
            const target = questions.value.find((q: any) => q.aid === item.aid)
            if (target) {
                target.id = item.id
                target.answer = item.answer || ''
                target.rating = item.rating != null && item.rating !== '' ? Number(item.rating) : ''
                target.fileList = [item.pfile1, item.pfile2, item.pfile3].filter(Boolean).map((url: string) => ({
                    name: getFileNameFromUrl(url),
                    url,
                }))
            }
        })
    } catch (e) {
        console.error('加载答案失败', e)
    }
    ratingSnapshot.value = questions.value.map((item: any) => item.rating)
}

// ===== 当前人统计 =====
const stats = computed(() => {
    const arr = questions.value
    const total = arr.length
    const rated = arr.filter((item: any) => item.rating !== '' && item.rating != null).length
    const totalRating = arr.reduce((sum: number, item: any) => sum + (Number(item.rating) || 0), 0)
    const totalScore = arr.reduce((sum: number, item: any) => sum + Number(item.score ?? 10), 0)
    const avg = rated > 0 ? (totalRating / rated).toFixed(1) : '-'
    return { total, rated, totalRating, totalScore, avg }
})

// ===== 保存评分 =====
const saving = ref(false)

async function handleSubmit() {
    const unrated = questions.value.filter((item: any) => item.rating === '' || item.rating === null || item.rating === undefined)
    if (unrated.length) {
        const titles = unrated.map((item: any, idx: number) => `${idx + 1}. ${item.title || '未命名问题'}`).join('\n')
        message.alert({
            title: '尚未评分',
            msg: `有 ${unrated.length} 个问题尚未评分，请完善后再提交：\n${titles}`,
        })
        return
    }
    if (saving.value) return
    saving.value = true
    try {
        const params = questions.value.map((item: any) => ({
            id: item.id,
            pid: Number(pid.value),
            aid: Number(item.aid),
            answer: item.answer,
            rating: Number(item.rating),
            pfile1: item.fileList[0]?.url || '',
            pfile2: item.fileList[1]?.url || '',
            pfile3: item.fileList[2]?.url || '',
        }))
        await fetchUpdateProjectProblemInfo(params)
        uni.showToast({ title: '评分保存成功', icon: 'none' })
        // 更新左侧状态
        const info = gradeStatus.value[String(activeUserId.value)]
        if (info) {
            const answeredCount = questions.value.filter((item: any) => item.answer).length
            const ratedCount = questions.value.filter((item: any) => item.rating !== '' && item.rating != null).length
            info.participated = true
            info.graded = answeredCount > 0 && ratedCount >= answeredCount
            info.score = questions.value.reduce((sum: number, item: any) => sum + (Number(item.rating) || 0), 0)
        }
        ratingSnapshot.value = questions.value.map((item: any) => item.rating)
    } catch (e) {
        console.error('保存评分失败', e)
    } finally {
        saving.value = false
    }
}

// ===== 附件预览 =====
function openFile(file: any) {
    if (!file?.url) return
    const url = String(file.url)
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || ''
    const imgExt = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
    // #ifdef H5
    window.open(url.split('?')[0])
    // #endif
    // #ifndef H5
    if (imgExt.includes(ext)) {
        uni.previewImage({ urls: [url] })
        return
    }
    uni.showLoading({ title: '打开中...' })
    uni.downloadFile({
        url,
        success: (res) => {
            uni.hideLoading()
            uni.openDocument({
                filePath: res.tempFilePath,
                showMenu: true,
                fail: () => uni.showToast({ title: '暂不支持预览该类型', icon: 'none' }),
            })
        },
        fail: () => {
            uni.hideLoading()
            uni.showToast({ title: '下载失败', icon: 'none' })
        },
    })
    // #endif
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	overflow: hidden;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;

	.summary-bar {
		flex-shrink: 0;
		margin: 16rpx 20rpx 0;
		padding: 20rpx 12rpx;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8rpx;
		border-radius: 20rpx;
		border: 1rpx solid rgba(102, 126, 234, 0.25);
		background: rgba(102, 126, 234, 0.06);

		.sum-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 6rpx;

			.sum-label {
				font-size: 22rpx;
				color: #64748b;
			}

			.sum-value {
				font-size: 28rpx;
				font-weight: 700;
				color: #1f2937;
				font-variant-numeric: tabular-nums;
			}
		}
	}

	.user-scroll-wrap {
		position: relative;
		flex-shrink: 0;
		margin-top: 16rpx;

		.user-scroll {
			white-space: nowrap;

			.user-inner {
				display: inline-flex;
				gap: 14rpx;
				padding: 4rpx 20rpx 8rpx;

				.user-chip {
					display: flex;
					align-items: center;
					gap: 10rpx;
					padding: 10rpx 18rpx;
					border-radius: 16rpx;
					background: rgba(128, 128, 128, 0.06);
					border: 1rpx solid rgba(128, 128, 128, 0.14);
					transition: all 0.2s;

					&.active {
						background: rgba(102, 126, 234, 0.1);
						border-color: #667eea;
						box-shadow: 0 0 0 3rpx rgba(102, 126, 234, 0.18);
					}

					.user-avatar {
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

					.user-meta {
						display: flex;
						flex-direction: column;

						.user-name {
							font-size: 24rpx;
							font-weight: 600;
							color: #1f2937;
							max-width: 160rpx;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}

						.user-status {
							font-size: 20rpx;
							margin-top: 2rpx;
							white-space: nowrap;

							&.rated { color: #16a34a; }
							&.unrated { color: #94a3b8; }
							&.pending { color: #d97706; }
						}
					}
				}

				.user-empty {
					color: #98a2b3;
					font-size: 24rpx;
					padding: 20rpx 0;
				}
			}
		}

		.user-fade {
			position: absolute;
			right: 0;
			top: 0;
			bottom: 0;
			width: 64rpx;
			pointer-events: none;
		}

		.user-arrow {
			position: absolute;
			right: 10rpx;
			top: 50%;
			transform: translateY(-60%);
			display: flex;
			align-items: center;
			justify-content: center;
			width: 44rpx;
			height: 44rpx;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.94);
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.14);
			color: #667eea;
			font-size: 30rpx;
			font-weight: 700;
			letter-spacing: -2rpx;
		}

		.user-arrow-hover {
			background: rgba(230, 235, 255, 0.98) !important;
			transform: translateY(-60%) scale(0.9);
		}
	}

	.grading-bar {
		flex-shrink: 0;
		margin: 4rpx 20rpx 0;
		padding: 14rpx 20rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		border-radius: 16rpx;
		background: rgba(102, 126, 234, 0.08);
		border: 1rpx solid rgba(102, 126, 234, 0.18);

		.grading-info {
			display: flex;
			align-items: center;
			gap: 8rpx;
			min-width: 0;

			.grading-label {
				font-size: 24rpx;
				color: #64748b;
				flex-shrink: 0;
			}

			.grading-name {
				font-size: 26rpx;
				font-weight: 700;
				color: #4b7bec;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}

	.stats-row {
		flex-shrink: 0;
		margin: 12rpx 20rpx 0;
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx 28rpx;
		padding: 14rpx 20rpx;
		border-radius: 16rpx;
		background: rgba(128, 128, 128, 0.06);
		font-size: 22rpx;
		color: #64748b;

		b {
			color: #4b7bec;
			font-variant-numeric: tabular-nums;
		}
	}

	.score-summary {
		margin: 12rpx 20rpx 0;
		padding: 16rpx 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 12rpx;
		border-radius: 16rpx;
		background: rgba(102, 126, 234, 0.07);
		border: 1rpx solid rgba(102, 126, 234, 0.2);

		.score-item {
			display: flex;
			align-items: baseline;
			gap: 8rpx;

			.score-label {
				font-size: 22rpx;
				color: #64748b;
			}

			.score-value {
				font-size: 30rpx;
				font-weight: 700;
				font-variant-numeric: tabular-nums;
			}
		}

		.score-divider {
			width: 1rpx;
			height: 28rpx;
			background: rgba(102, 126, 234, 0.3);
		}
	}

	.answer-scroll {
		flex: 1;
		min-height: 0;
		margin-top: 16rpx;

		.answer-inner {
			padding: 0 20rpx;

			.empty {
				text-align: center;
				padding: 100rpx 0;
				font-size: 26rpx;
			}

			.q-card {
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

					.rating-input {
						flex-shrink: 0;
						width: 130rpx;
						margin-left: 8rpx;
					}

					.rating-placeholder {
						flex-shrink: 0;
						margin-left: 8rpx;
						font-size: 24rpx;
						background: rgba(128, 128, 128, 0.08);
						padding: 6rpx 18rpx;
						border-radius: 12rpx;
					}

					.q-earn {
						flex-shrink: 0;
						margin-left: 8rpx;
						font-size: 24rpx;
						font-weight: 700;
						color: #4b7bec;
						background: rgba(75, 123, 236, 0.1);
						padding: 6rpx 18rpx;
						border-radius: 12rpx;
						white-space: nowrap;
					}
				}

				.q-answer {
					margin-bottom: 16rpx;
					display: flex;
					gap: 12rpx;
					align-items: flex-start;

					.q-answer-label {
						font-size: 24rpx;
						flex-shrink: 0;
						padding-top: 10rpx;
					}

					.q-answer-text {
						flex: 1;
						min-width: 0;
						font-size: 26rpx;
						line-height: 1.6;
						border-radius: 12rpx;
						padding: 14rpx 18rpx;
						word-break: break-all;
						white-space: pre-wrap;
					}
				}

				.q-files {
					display: flex;
					gap: 12rpx;
					align-items: flex-start;

					.q-files-label {
						font-size: 24rpx;
						flex-shrink: 0;
						padding-top: 6rpx;
					}

					.file-list {
						flex: 1;
						display: flex;
						flex-wrap: wrap;
						gap: 12rpx;

						.file-item {
							display: flex;
							align-items: center;
							gap: 8rpx;
							padding: 6rpx 16rpx;
							border-radius: 999rpx;
							background: rgba(102, 126, 234, 0.1);
							font-size: 22rpx;
							color: #334155;

							.file-icon {
								font-size: 20rpx;
							}

							.file-name {
								max-width: 180rpx;
								overflow: hidden;
								text-overflow: ellipsis;
								white-space: nowrap;
							}

							.file-open {
								color: #667eea;
							}
						}
					}
				}
			}

			.bottom-space {
				height: 40rpx;
			}
		}
	}
}

/* 暗黑模式适配 */
.wot-theme-dark {
    /* 汇总条数值 */
    .sum-value {
        color: #e5e5e5;
    }
    /* 参与人姓名 */
    .user-name {
        color: #e5e5e5;
    }
    /* 右侧滚动箭头 */
    .user-arrow {
        background: rgba(40, 40, 40, 0.94);
    }
    /* 附件项文字 */
    .file-item {
        color: #cbd5e1;
    }
    /* 评分输入透出卡片色 */
    :deep(.wd-input) {
        background: transparent !important;
    }
}

</style>
