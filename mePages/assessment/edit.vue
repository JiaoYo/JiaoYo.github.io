<template>
	<wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
		<view class="page">
			<wd-navbar left-arrow :title="title" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

			<scroll-view scroll-y class="body">
				<!-- 基本信息 -->
				<view class="section">
					<view class="section-title" :style="{ color: subColor }">基本信息</view>
					<view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="form-item">
							<text class="form-label" :style="{ color: subColor }">考核名称</text>
							<view class="form-control">
								<wd-input v-model="form.aname" placeholder="请输入考核名称" :disabled="readonly" clearable />
							</view>
						</view>

						<view class="form-item">
							<text class="form-label" :style="{ color: subColor }">考核类型</text>
							<view class="form-control">
								<wd-picker :columns="atypeColumns" v-model="form.atype" placeholder="请选择考核类型" :disabled="readonly" />
							</view>
						</view>

						<view class="form-item">
							<text class="form-label" :style="{ color: subColor }">参与类型</text>
							<view class="form-control">
								<wd-picker :columns="apaticiColumns" v-model="form.apatici" placeholder="请选择参与类型" :disabled="readonly || isEdit" />
							</view>
						</view>

						<view class="form-item">
							<text class="form-label" :style="{ color: subColor }">时长(分钟)</text>
							<view class="form-control">
								<wd-input v-model="form.dura" type="number" placeholder="请输入考核时长" :disabled="readonly" />
							</view>
						</view>

						<!-- 参与人 -->
						<view v-if="Number(form.apatici) === 1" class="form-item">
							<text class="form-label" :style="{ color: subColor }">参与人</text>
							<view class="form-control">
								<view v-if="readonly" class="readonly-text" :style="{ color: textColor }">{{ selectedUserNames || '未指定' }}</view>
								<view v-else class="participant-picker" @click="openUserPicker">
									<text class="p-selected" :class="{ placeholder: !selectedUserNames }" :style="{ color: selectedUserNames ? textColor : subColor }">{{ selectedUserNames || '请选择参与人' }}</text>
									<text class="p-arrow" :style="{ color: subColor }">›</text>
								</view>
							</view>
						</view>

						<!-- 附件 -->
						<view class="form-item form-item-col">
							<text class="form-label" :style="{ color: subColor }">附件</text>
							<view class="form-control">
								<wd-upload v-if="!readonly" accept="all" :limit="3" v-model:file-list="fileList" :upload-method="qiniuUploadMethod" />
								<view v-else class="readonly-files">
									<view v-for="(f, i) in fileList" :key="i" class="rf-item">
										<text>📎 附件{{ i + 1 }}：{{ getFileNameFromUrl(f.url) }}</text>
									</view>
									<text v-if="!fileList.some((f) => f.url)" class="rf-empty" :style="{ color: subColor }">暂无附件</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- 考核问题 -->
				<view class="section">
					<view class="section-head">
						<view class="section-title" :style="{ color: subColor }">考核问题</view>
						<wd-button v-if="!readonly" size="small" type="primary" plain @click="addProblem">新增问题</wd-button>
					</view>
					<view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view v-if="questionList.length === 0" class="q-empty" :style="{ color: subColor }">暂无考核问题，点击右上角「新增问题」添加</view>
						<view v-for="(q, idx) in questionList" :key="q.id || q.tempId" class="q-item" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }">
							<view class="q-index" :style="{ background: isDark ? 'rgba(102,126,234,0.2)' : '#eef2ff', color: '#667eea' }">{{ idx + 1 }}</view>
							<view class="q-content">
								<view class="q-text" :style="{ color: textColor }">{{ q.aproblem }}</view>
								<view class="q-score" :style="{ color: subColor }">{{ q.score ?? 10 }} 分</view>
							</view>
							<view v-if="!readonly" class="q-actions">
								<text class="q-edit" @click="editProblem(q, idx)">编辑</text>
								<text class="q-del" @click="delProblem(q, idx)">删除</text>
							</view>
						</view>
					</view>
				</view>

				<view class="bottom-space"></view>
			</scroll-view>

			<!-- 底部保存 -->
			<view v-if="!readonly" class="footer">
				<wd-button type="primary" block :loading="saving" @click="handleSubmit">保存</wd-button>
			</view>

			<!-- 参与人选择弹窗 -->
			<wd-popup v-model="userPickerShow" position="bottom" :z-index="300" custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 80vh;">
				<view class="picker-wrap">
					<view class="picker-title" :style="{ color: textColor }">选择参与人</view>
					<scroll-view scroll-y class="picker-list" :style="{ height: '52vh' }">
						<view v-for="u in userList" :key="u.id" class="picker-item" @click="toggleUser(u.id)">
							<text class="picker-name" :style="{ color: textColor }">{{ u.username }}</text>
							<text class="picker-check" :style="{ color: form.users.includes(u.id) ? '#667eea' : 'transparent' }">✓</text>
						</view>
						<view v-if="userList.length === 0" class="picker-empty" :style="{ color: subColor }">暂无可选用户</view>
					</scroll-view>
					<view class="picker-footer">
						<wd-button size="medium" plain @click="userPickerShow = false">取消</wd-button>
						<wd-button size="medium" type="primary" @click="userPickerShow = false">确定（{{ form.users.length }}人）</wd-button>
					</view>
				</view>
			</wd-popup>

			<!-- 新增/编辑问题弹窗 -->
			<wd-popup v-model="problemShow" position="bottom" :duration="0"  :z-index="300" custom-style="bottom:45vh;border-radius: 24rpx 24rpx 24rpx 24rpx;">
				<view class="picker-wrap">
					<view class="picker-title" :style="{ color: textColor }">{{ problemType === 'add' ? '新增问题' : '编辑问题' }}</view>
					<view class="problem-form">
						<view class="form-item">
							<text class="form-label" :style="{ color: subColor }">题目分数</text>
							<view class="form-control">
								<wd-input v-model="problemForm.score" type="number" placeholder="请输入分数（默认 10）" />
							</view>
						</view>
						<view class="form-item form-item-col">
							<text class="form-label" :style="{ color: subColor }">考核问题</text>
							<view class="form-control">
								<view v-if="problemType === 'add'" class="problem-hint" :style="{ color: subColor }">每行输入一个问题，按回车换行可一次添加多条</view>
								<textarea
									class="q-textarea"
									v-model="problemForm.aproblem"
									:style="{ color: textColor, backgroundColor: inputBg }"
									:placeholder="problemType === 'add' ? '请输入考核问题，每行一条' : '请输入考核问题'"
									placeholder-style="color:#bfbfbf;"
									:show-confirm-bar="false"
									auto-height
								/>
							</view>
						</view>
					</view>
					<view class="picker-footer">
						<wd-button size="medium" plain @click="problemShow = false">取消</wd-button>
						<wd-button size="medium" type="primary" :loading="problemSaving" @click="submitProblem">确定</wd-button>
					</view>
				</view>
			</wd-popup>
		</view>

		<wd-message-box />
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import {
    fetchEditAssessment,
    fetchAddAssessment,
    fetchAssessmentUserList,
    fetchAddAssessmentUser,
    fetchDeleteAssessmentUser,
    fetchAssessmentQuestionList,
    fetchAddAssessmentQuestion,
    fetchEditAssessmentQuestion,
    fetchDeleteAssessmentQuestion,
} from '@/service/assessments'
import { fetchGetAllUserDataList } from '@/service/index'
import { ATYPE_OPTIONS, APATICI_OPTIONS } from './modules/constants'
import { qiniuUploadMethod, getFileNameFromUrl } from './modules/upload'
import type { UploadFile } from '@/uni_modules/wot-design-uni/components/wd-upload/types'

const message = useMessage()

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))
const inputBg = computed(() => (isDark.value ? 'rgba(255,255,255,0.06)' : '#f5f6f8'))

function handleBack() {
    // #ifdef H5
    history.go(-1)
    // #endif
    // #ifndef H5
    uni.navigateBack()
    // #endif
}

// ===== 路由参数 =====
const readonly = ref(false)
const rowData = ref<any>(null)
const isEdit = ref(false)

onLoad((options: any) => {
    readonly.value = String(options?.readonly) === '1'
    const row = uni.getStorageSync('assessment_edit_row')
    if (row && row.id) {
        rowData.value = row
        isEdit.value = true
        initForm(row)
    } else {
        isEdit.value = false
        initForm(null)
    }
    loadQuestions()
})

const title = computed(() => {
    if (readonly.value) return '查看考核'
    return isEdit.value ? '修改考核' : '新增考核'
})

// ===== 表单 =====
const form = ref<any>({
    id: undefined,
    aname: '',
    atype: undefined,
    apatici: undefined,
    dura: 30,
    users: [],
})
const fileList = ref<UploadFile[]>([])
const copyUsers = ref<number[]>([])

const atypeColumns = ATYPE_OPTIONS.map((i) => ({ value: i.value, label: i.label }))
const apaticiColumns = APATICI_OPTIONS.map((i) => ({ value: i.value, label: i.label }))

function initForm(row: any) {
    if (row) {
        form.value = {
            id: row.id,
            aname: row.aname || '',
            atype: row.atype ?? undefined,
            apatici: row.apatici ?? undefined,
            dura: row.dura ?? 30,
            users: [],
        }
        fileList.value = []
        for (let i = 1; i <= 3; i++) {
            const url = row[`fl${i}`] || ''
            if (url) {
                const name = row[`re${i}`] || getFileNameFromUrl(url)
                fileList.value.push({ name, url, status: 'success' })
            }
        }
    } else {
        form.value = { id: undefined, aname: '', atype: undefined, apatici: undefined, dura: 30, users: [] }
        fileList.value = []
    }
    // 加载参与人
    if (isEdit.value && form.value.id) {
        fetchParticipate()
    }
}

async function fetchParticipate() {
    try {
        const data = await fetchAssessmentUserList({ page: 1, limit: 100, pid: form.value.id })
        const list = data.list || []
        form.value.users = list.map((i: any) => i.parti)
        copyUsers.value = JSON.parse(JSON.stringify(form.value.users))
    } catch (e) {
        console.error('加载参与人失败', e)
    }
}

const selectedUserNames = computed(() => {
    const names = userList.value.filter((u: any) => form.value.users.includes(u.id)).map((u: any) => u.username)
    return names.join('、')
})

// ===== 参与人选择 =====
const userPickerShow = ref(false)
const userList = ref<any[]>([])

function openUserPicker() {
    loadUsers()
    userPickerShow.value = true
}

async function loadUsers() {
    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2,3,9' })
        userList.value = (data.list || []).filter((u: any) => u.status == 0)
    } catch (e) {
        console.error('加载用户列表失败', e)
    }
}

function toggleUser(id: number) {
    const idx = form.value.users.indexOf(id)
    if (idx > -1) {
        form.value.users.splice(idx, 1)
    } else {
        form.value.users.push(id)
    }
}

// ===== 考核问题 =====
const questionList = ref<any[]>([])
const questionTotal = ref(0)

// 已存在的考核问题 id 集合（用于删除回填判断）

async function loadQuestions() {
    if (!isEdit.value || !form.value.id) return
    try {
        const data = await fetchAssessmentQuestionList({ page: 1, limit: 100, pid: form.value.id })
        questionList.value = data.list || []
    } catch (e) {
        console.error('加载考核问题失败', e)
    }
}

// 新增/编辑问题
const problemShow = ref(false)
const problemType = ref<'add' | 'edit'>('add')
const problemForm = ref<any>({ id: undefined, aproblem: '', score: 10 })
const currentIndex = ref(0)
const problemSaving = ref(false)

function addProblem() {
    problemType.value = 'add'
    problemForm.value = { id: undefined, aproblem: '', score: 10 }
    problemShow.value = true
}
function editProblem(q: any, idx: number) {
    problemType.value = 'edit'
    problemForm.value = { id: q.id, aproblem: q.aproblem, score: q.score ?? 10 }
    currentIndex.value = idx
    problemShow.value = true
}

function splitToArray(str: string): string[] {
    if (!str) return []
    return str
        .split(/\r?\n/)
        .map((line) => line.trim().replace(/^\d+\.\s*/, ''))
        .filter(Boolean)
}

async function submitProblem() {
    const score = Number(problemForm.value.score)
    if (!problemForm.value.aproblem?.trim()) {
        uni.showToast({ title: '请输入考核问题', icon: 'none' })
        return
    }
    if (!score || score < 1) {
        uni.showToast({ title: '请输入题目分数', icon: 'none' })
        return
    }
    problemSaving.value = true
    try {
        if (isEdit.value) {
            // 已保存的考核：直接调接口
            if (problemType.value === 'add') {
                const arr = splitToArray(problemForm.value.aproblem).map((item) => ({
                    aproblem: item,
                    pid: form.value.id,
                    score,
                }))
                await fetchAddAssessmentQuestion(arr)
                uni.showToast({ title: '新增成功', icon: 'none' })
            } else {
                await fetchEditAssessmentQuestion([{ id: problemForm.value.id, pid: form.value.id, aproblem: problemForm.value.aproblem.trim(), score }])
                uni.showToast({ title: '修改成功', icon: 'none' })
            }
            loadQuestions()
        } else {
            // 新增中的考核：本地暂存
            if (problemType.value === 'add') {
                splitToArray(problemForm.value.aproblem).forEach((item) => {
                    questionList.value.push({ tempId: `t${Date.now()}${Math.random()}`, aproblem: item, score })
                })
            } else {
                questionList.value[currentIndex.value] = { ...questionList.value[currentIndex.value], aproblem: problemForm.value.aproblem.trim(), score }
            }
        }
        problemShow.value = false
    } catch (e) {
        console.error('保存问题失败', e)
    } finally {
        problemSaving.value = false
    }
}

function delProblem(q: any, idx: number) {
    const doDelete = async () => {
        try {
            if (isEdit.value && q.id) {
                await fetchDeleteAssessmentQuestion(q.id)
            }
            questionList.value.splice(idx, 1)
            uni.showToast({ title: '删除成功', icon: 'none' })
        } catch (e) {
            console.error('删除问题失败', e)
        }
    }
    message
        .confirm({
            msg: '确定要删除该考核问题吗？',
            title: '删除问题',
            confirmButtonText: '确认删除',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(() => doDelete())
        .catch(() => {})
}

// ===== 提交 =====
const saving = ref(false)

function buildAttachmentPayload() {
    const out: Record<string, string> = {}
    for (let i = 0; i < 3; i++) {
        const f = fileList.value[i]
        const url = f?.response || f?.url || ''
        out[`re${i + 1}`] = getFileNameFromUrl(url)
        out[`fl${i + 1}`] = url
    }
    return out
}

// 拉取全部在职用户（usertypes 3,9），全员参与时自动添加参与人
async function fetchAllUsers(): Promise<any[]> {
    const all: any[] = []
    let page = 1
    for (;;) {
        const data = await fetchGetAllUserDataList({ page, limit: 100, usertypes: '2,3,9' })
        const list = (data.list || []).filter((u: any) => u.status == 0)
        all.push(...list)
        if (!list.length || list.length < 100) break
        page++
    }
    return all
}

async function handleSubmit() {
    if (saving.value) return
    if (!form.value.aname?.trim()) {
        uni.showToast({ title: '请输入考核名称', icon: 'none' })
        return
    }
    if (form.value.atype === undefined || form.value.atype === null) {
        uni.showToast({ title: '请选择考核类型', icon: 'none' })
        return
    }
    if (form.value.apatici === undefined || form.value.apatici === null) {
        uni.showToast({ title: '请选择参与类型', icon: 'none' })
        return
    }
    const dura = Number(form.value.dura)
    if (!dura || dura < 1) {
        uni.showToast({ title: '请输入考核时长', icon: 'none' })
        return
    }
    if (Number(form.value.apatici) === 1 && form.value.users.length === 0) {
        uni.showToast({ title: '请选择参与人', icon: 'none' })
        return
    }

    const base = {
        aname: form.value.aname.trim(),
        atype: form.value.atype,
        apatici: form.value.apatici,
        dura,
        ...buildAttachmentPayload(),
    }

    saving.value = true
    try {
        if (isEdit.value) {
            await fetchEditAssessment([{ ...base, id: form.value.id }])
            // 参与人差集
            const newIds: number[] = form.value.users
            const oldIds: number[] = copyUsers.value
            const addIds = newIds.filter((id) => !oldIds.includes(id))
            const delIds = oldIds.filter((id) => !newIds.includes(id))
            const tasks: Promise<any>[] = []
            if (addIds.length) {
                tasks.push(fetchAddAssessmentUser(addIds.map((parti) => ({ pid: form.value.id, parti }))))
            }
            if (delIds.length) {
                const delArr = await fetchAssessmentUserList({ page: 1, limit: 100, pid: form.value.id })
                const delIdsOfUsers = (delArr.list || []).filter((i: any) => delIds.includes(i.parti)).map((i: any) => i.id)
                if (delIdsOfUsers.length) {
                    tasks.push(fetchDeleteAssessmentUser(delIdsOfUsers.join(',')))
                }
            }
            if (tasks.length) {
                await Promise.all(tasks)
            }
            uni.showToast({ title: '修改成功', icon: 'none' })
        } else {
            if (questionList.value.length === 0) {
                uni.showToast({ title: '考核问题不能为空', icon: 'none' })
                return
            }
            const pid = await fetchAddAssessment([{ ...base }])
            if (!pid || Number(pid) <= 0) {
                uni.showToast({ title: '新增考核失败', icon: 'none' })
                return
            }
            // 新增问题
            if (questionList.value.length) {
                const arr = questionList.value.map((item) => ({ aproblem: item.aproblem, pid, score: item.score ?? 10 }))
                await fetchAddAssessmentQuestion(arr)
            }
            // 参与人：指定参与用选中的用户；全员参与自动添加全部 3/9 在职用户
            let userArr: { pid: number; parti: any }[] = []
            if (form.value.users.length) {
                userArr = form.value.users.map((parti: any) => ({ pid, parti }))
            } else if (Number(form.value.apatici) === 0) {
                const allUsers = await fetchAllUsers()
                userArr = allUsers.map((u: any) => ({ pid, parti: u.id }))
            }
            if (userArr.length) {
                await fetchAddAssessmentUser(userArr)
            }
            uni.showToast({ title: '添加成功', icon: 'none' })
        }
        uni.setStorageSync('assessment_list_refresh', '1')
        // 返回
        setTimeout(() => handleBack(), 600)
    } catch (e) {
        console.error('保存考核失败', e)
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.body {
	flex: 1;
	min-height: 0;

	.section {
		padding: 20rpx 20rpx 0;

		.section-title {
			font-size: 26rpx;
			font-weight: 600;
			padding: 0 8rpx 14rpx;
		}

		.section-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 8rpx 14rpx;

			.section-title {
				padding: 0;
			}
		}

		.form-card {
			border-radius: 20rpx;
			padding: 8rpx 24rpx;
			box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);

			.form-item {
				display: flex;
				align-items: center;
				padding: 20rpx 0;
				border-bottom: 1rpx solid rgba(128, 128, 128, 0.1);

				&:last-child {
					border-bottom: none;
				}

				&.form-item-col {
					align-items: flex-start;
					flex-direction: column;
					gap: 16rpx;

					.form-label {
						width: auto;
						margin-bottom: 0;
					}
				}

				.form-label {
					width: 160rpx;
					flex-shrink: 0;
					font-size: 26rpx;
				}

				.form-control {
					flex: 1;
					min-width: 0;

					.readonly-text {
						font-size: 26rpx;
						line-height: 1.6;
					}

					.participant-picker {
						display: flex;
						align-items: center;
						justify-content: space-between;
						min-height: 64rpx;

						.p-selected {
							flex: 1;
							min-width: 0;
							font-size: 26rpx;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;

							&.placeholder {
								color: #98a2b3;
							}
						}

						.p-arrow {
							font-size: 30rpx;
							margin-left: 12rpx;
						}
					}

					.readonly-files {
						display: flex;
						flex-direction: column;
						gap: 8rpx;

						.rf-item {
							font-size: 24rpx;
							color: #4b7bec;
						}

						.rf-empty {
							font-size: 24rpx;
						}
					}
				}
			}
		}

		.q-empty {
			text-align: center;
			padding: 50rpx 0;
			font-size: 24rpx;
		}

		.q-item {
			display: flex;
			align-items: center;
			gap: 16rpx;
			padding: 22rpx 0;
			border-bottom: 1rpx solid;

			&:last-child {
				border-bottom: none;
			}

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

			.q-content {
				flex: 1;
				min-width: 0;

				.q-text {
					font-size: 28rpx;
					font-weight: 500;
					line-height: 1.5;
					word-break: break-all;
				}

				.q-score {
					font-size: 22rpx;
					margin-top: 6rpx;
				}
			}

			.q-actions {
				flex-shrink: 0;
				display: flex;
				gap: 20rpx;

				.q-edit {
					font-size: 24rpx;
					color: #667eea;
				}

				.q-del {
					font-size: 24rpx;
					color: #f5222d;
				}
			}
		}
	}

	.bottom-space {
		height: 160rpx;
	}
}

.footer {
	flex-shrink: 0;
	padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
	background: rgba(245, 246, 248, 0.92);
}

.picker-wrap {
	padding: 30rpx 30rpx 20rpx;
	box-sizing: border-box;
	max-height: 80vh;
	overflow: hidden;
	display: flex;
	flex-direction: column;

	.picker-title {
		font-size: 32rpx;
		font-weight: 600;
		text-align: center;
		margin-bottom: 20rpx;
	}

	.picker-list {
		flex: 1;
		min-height: 0;

		.picker-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 24rpx 10rpx;
			border-bottom: 1rpx solid rgba(128, 128, 128, 0.1);

			.picker-name {
				font-size: 28rpx;
			}

			.picker-check {
				font-size: 30rpx;
				font-weight: 700;
				color: #667eea;
			}
		}

		.picker-empty {
			text-align: center;
			padding: 60rpx 0;
			font-size: 26rpx;
		}
	}

	.picker-footer {
		display: flex;
		justify-content: flex-end;
		gap: 20rpx;
		margin-top: 20rpx;
	}

	.problem-form {
		.form-item {
			display: flex;
			align-items: center;
			padding: 16rpx 0;

			&.form-item-col {
				flex-direction: column;
				align-items: flex-start;
				gap: 12rpx;

				.form-label {
					width: auto;
				}

				// 列布局下 form-control 不会横向拉伸，需显式撑满宽度，否则内部输入框零宽度不显示
				.form-control {
					width: 100%;
				}
			}

			.form-label {
				width: 160rpx;
				flex-shrink: 0;
				font-size: 26rpx;
			}

			.form-control {
				flex: 1;
				min-width: 0;

				.problem-hint {
					font-size: 22rpx;
					margin-bottom: 8rpx;
				}

				.q-textarea {
					width: 100%;
					min-height: 160rpx;
					padding: 16rpx 20rpx;
					font-size: 28rpx;
					line-height: 1.6;
					background: #f5f6f8;
					border: 1rpx solid rgba(128, 128, 128, 0.15);
					border-radius: 12rpx;
					box-sizing: border-box;
				}
			}
		}
	}
}

/* 暗黑模式适配 */
.wot-theme-dark {
    /* 底部保存栏 */
    .footer {
        background: rgba(27, 27, 27, 0.92);
    }
    /* 表单控件透出卡片色 */
    :deep(.wd-search) {
        background: transparent !important;
    }
    :deep(.wd-picker) {
        background: transparent !important;
    }
    :deep(.wd-cell-group) {
        background: transparent !important;
    }
    :deep(.wd-cell-group__body) {
        background: transparent !important;
    }
    :deep(.wd-cell) {
        background: transparent !important;
    }
    :deep(.wd-input) {
        background: transparent !important;
    }
    :deep(.wd-textarea) {
        background: transparent !important;
    }
}

</style>
