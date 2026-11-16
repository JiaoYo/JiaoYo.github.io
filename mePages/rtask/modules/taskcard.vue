<template>
	<view class="task-card" :class="{ simple: simple }" :style="{ background: isDark ? '#1c1c1e' : '#ffffff', borderLeftColor: statusColor }">
		<!-- 头部：状态 + 调试人 + 操作 -->
		<view class="card-header">
			<view class="header-left" @click="handleStatusTap">
				<view class="status-tag" :style="{ backgroundColor: statusColor + '20', color: statusColor }">
					<view class="status-dot" :style="{ backgroundColor: statusColor }"></view>
					<text class="status-label">{{ statusLabel }}</text>
					<text v-if="isCreater && nextStatuses.length" class="status-arrow">▾</text>
				</view>
				<view v-if="isisdelayed" class="delay-tag" @click.stop="openDelayReason">延期</view>
				<text class="debugger" :style="{ color: subColor }">调试人：{{ task.username }}</text>
			</view>
			<view class="header-right">
				<text class="icon-btn" @click="logShow = true">📋</text>
				<text v-if="!isCreater && isManager" class="icon-btn" @click="handleSwitchUser">🔄</text>
				<text v-if="isCreater" class="icon-btn danger" @click="handleDelete">🗑️</text>
			</view>
		</view>

		<!-- 项目 / 微信群（今日任务精简卡片不展示，任务名称保留） -->
		<template v-if="!simple">
			<view class="row">
				<text class="label" :style="{ color: subColor }">项　目</text>
				<text class="value ellipsis" :style="{ color: textColor }">{{ task.proname || '-' }}</text>
			</view>
			<view class="row" @click="canEditField('weChatName') && handleFieldEdit('weChatName')">
				<text class="label" :style="{ color: subColor }">微信群</text>
				<text class="value ellipsis" :class="{ editable: canEditField('weChatName') }" :style="{ color: textColor }">{{ task.weChatName || '-' }}</text>
				<text v-if="task.weChatName" class="row-copy" :style="{ color: '#3b82f6' }" @click.stop="copyText(task.weChatName)">复制</text>
			</view>
		</template>

		<!-- 任务名称（精简卡片也展示） -->
		<view class="row task-name-row" @click="canEditField('taskName') && handleFieldEdit('taskName')">
			<text class="label" :style="{ color: subColor }">任务名称</text>
			<text class="value ellipsis" :class="{ editable: canEditField('taskName') }" :style="{ color: textColor }">{{ task.taskName }}</text>
			<text v-if="canEditField('taskName')" class="edit-icon">📝</text>
		</view>

		<!-- 进度 -->
		<view class="row progress-row" @click="canEditField('taskProgress') && handleFieldEdit('taskProgress')">
			<text class="label" :style="{ color: subColor }">最新进度</text>
			<view class="progress-wrap">
				<view class="progress-bar" :style="{ background: isDark ? 'rgba(255,255,255,0.1)' : '#eef1f5' }">
					<view class="progress-inner" :style="{ width: task.taskProgress + '%', backgroundColor: statusColor }"></view>
				</view>
				<text class="progress-text" :class="{ editable: canEditField('taskProgress') }" :style="{ color: textColor }">{{ task.taskProgress }}%</text>
			</view>
			<text v-if="canEditField('taskProgress')" class="edit-icon">📝</text>
		</view>

		<!-- 预计完成日期 -->
		<view class="row">
			<text class="label" :style="{ color: subColor }">预计完成</text>
			<text class="value ellipsis" :style="{ color: textColor }">{{ ecdText() }}</text>
		</view>

		<!-- 延期原因 -->
		<view v-if="delayRsn" class="row" @click="canEditDelayRsn() && openDelayReason()">
			<text class="label" :style="{ color: subColor }">延期原因</text>
			<text class="value ellipsis delay-rsn" :style="{ color: '#ef4444' }">{{ delayRsn }}</text>
		</view>

		<!-- 延期提示条 -->
		<view v-if="isisdelayed && !delayRsn && isCreater" class="delay-prompt" >
			<text class="delay-prompt-text" @click="openDelayReason">⚠ 该任务已延期，点击填写延期原因</text>
		</view>

		<!-- 更新时间 -->
		<view class="row">
			<text class="label" :style="{ color: subColor }">更新时间</text>
			<text class="value time-text" :style="{ color: subColor }">{{ task.dbtime }}</text>
		</view>

		<!-- 编辑弹窗 -->
		<wd-popup v-model="editShow" position="bottom" :z-index="300" custom-style="border-radius: 24rpx 24rpx 0 0;">
			<view class="edit-wrap">
				<view class="edit-title">{{ editTitle }}</view>
				<view class="edit-body">
					<wd-input v-if="editField !== 'taskProgress'" v-model="editValue" :placeholder="editTitle" />
					<wd-input v-else v-model="editValue" type="number" placeholder="请输入进度(0-100)" />
				</view>
				<view class="edit-btns">
					<wd-button size="medium" plain @click="editShow = false">取消</wd-button>
					<wd-button size="medium" type="primary" @click="handleEditSave">保存</wd-button>
				</view>
			</view>
		</wd-popup>

		<!-- 延期原因弹窗（创建人编辑 / 其他人只读查看） -->
		<wd-popup v-model="delayShow" position="bottom" :z-index="300" custom-style="border-radius: 24rpx 24rpx 0 0;">
			<view class="edit-wrap">
				<view class="edit-title">{{ isCreater ? '填写延期原因' : '延期原因' }}</view>
				<view class="edit-body delay-edit-body" :style="{ background: isDark ? '#2c2c2e' : '#f5f5f5' }">
					<wd-textarea v-if="isCreater" v-model="delayValue" placeholder="请输入延期原因" :maxlength="255" />
					<view v-else class="delay-view-text" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">{{ delayRsn }}</view>
				</view>
				<view class="edit-btns">
					<template v-if="isCreater">
						<wd-button size="medium" plain @click="delayShow = false">取消</wd-button>
						<wd-button size="medium" type="primary" @click="handleDelaySave">保存</wd-button>
					</template>
					<wd-button v-else size="medium" type="primary" @click="delayShow = false">关闭</wd-button>
				</view>
			</view>
		</wd-popup>

		<!-- 日志弹窗 -->
		<logmodal v-model="logShow" :row-data="task" />
    <wd-message-box />
	</view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import { getStatusConfig, getAvailableNextStatuses, MANAGE_USER_TYPES } from './constants'
import { fetchDeleteTasks, fetchUpdateTask, fetchUpdateTaskCreater, fetchUpdateTaskConfig } from '@/service/task'
import logmodal from './logmodal.vue'

const props = defineProps<{ task: any; simple?: boolean }>()
const emit = defineEmits<{ (e: 'reload'): void }>()

const message = useMessage()

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

const userId = uni.getStorageSync('userId')
const userType = Number(uni.getStorageSync('usertype'))
const isCreater = computed(() => String(props.task.creater) === String(userId))
const isManager = MANAGE_USER_TYPES.includes(userType)

const statusConfig = computed(() => getStatusConfig(Number(props.task.status)))
const statusLabel = computed(() => statusConfig.value.label)
const statusColor = computed(() => statusConfig.value.color)
const nextStatuses = computed(() => getAvailableNextStatuses(Number(props.task.status)))

// 可编辑条件：仅任务状态为 调试中(1) 且为创建人
function canEditField(field: 'weChatName' | 'taskName' | 'taskProgress') {
    if (String(props.task.status) !== '1') return false
    if (!isCreater.value) return false
    if (field === 'taskProgress' && Number(props.task.taskProgress) >= 100) return false
    return true
}

// ===== 延期检测 =====
function todayStr(): string {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}
// 预计完成日期已过 且 未完成 → 视为延期（或存储 isdelayed===1）
const isisdelayed = computed(() => Number(props.task.isdelayed) === 1)
const delayRsn = computed(() => props.task.delayRsn || '')
// 预计完成日期只展示年月日
function ecdText(): string {
    return props.task.ecd ? String(props.task.ecd).slice(0, 10) : '-'
}
function canEditDelayRsn() {
    return isisdelayed.value
}

// ===== 延期原因 =====
const delayShow = ref(false)
const delayValue = ref('')
function openDelayReason() {
    // 创建人 → 编辑模式；其他人 → 只读查看
    delayValue.value = delayRsn.value || ''
    delayShow.value = true
}
async function handleDelaySave() {
    const val = String(delayValue.value).trim()
    if (!val) {
        uni.showToast({ title: '请输入延期原因', icon: 'none' })
        return
    }
    try {
        await fetchUpdateTask({ id: props.task.id, isdelayed: 1, delayRsn: val })
        delayShow.value = false
        emit('reload')
        uni.showToast({ title: '保存成功', icon: 'none' })
    } catch (e) {
        console.error('保存延期原因失败', e)
    }
}

// ===== 状态切换 =====
function handleStatusTap() {
    if (!isCreater.value || !nextStatuses.value.length) return
    const itemList = nextStatuses.value.map((s) => getStatusConfig(s).label)
    uni.showActionSheet({
        itemList,
        success: async (res) => {
            const newStatus = nextStatuses.value[res.tapIndex]
            if (newStatus === 3 && Number(props.task.taskProgress) !== 100) {
                uni.showToast({ title: '任务进度未完成，无法完成', icon: 'none' })
                return
            }
            try {
                await fetchUpdateTask({ id: props.task.id, status: newStatus })
                emit('reload')
                uni.showToast({ title: '修改成功' })
            } catch (e) {
                console.error('更新状态失败', e)
            }
        },
    })
}

// ===== 删除任务 =====
function handleDelete() {
    message
        .confirm({
            msg: `确定要删除任务“${props.task.taskName}”吗？此操作不可恢复！`,
            title: '删除任务',
            confirmButtonText: '确认删除',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            try {
                await fetchDeleteTasks(props.task.id)
                emit('reload')
                uni.showToast({ title: '删除成功', icon: 'none' })
            } catch (e) {
                console.error('删除任务失败', e)
            }
        })
        .catch(() => {})
}

// ===== 切换负责人 =====
function handleSwitchUser() {
    message
        .confirm({
            msg: `确定要将任务“${props.task.taskName}”从 ${props.task.username || props.task.creater || '未知用户'} 转移给您自己吗？切换后您将成为该任务的负责人。`,
            title: '切换任务负责人',
            confirmButtonText: '确认接手',
            confirmButtonProps: {
                type: 'primary',
            },
        })
        .then(async () => {
            try {
                await fetchUpdateTaskCreater(props.task.id)
                emit('reload')
                uni.showToast({ title: '已成功接手任务', icon: 'none' })
            } catch (e) {
                console.error('切换用户失败', e)
            }
        })
        .catch(() => {})
}

// ===== 行内编辑 =====
const editShow = ref(false)
const editField = ref<'taskName' | 'taskProgress' | 'weChatName'>('taskName')
const editValue = ref<any>('')
const editTitle = computed(() => {
    if (editField.value === 'taskProgress') return '修改进度'
    if (editField.value === 'weChatName') return '修改微信群名'
    return '修改任务名称'
})

function handleFieldEdit(field: 'taskName' | 'taskProgress' | 'weChatName') {
    editField.value = field
    editValue.value = field === 'taskProgress' ? props.task.taskProgress : props.task[field] || ''
    editShow.value = true
}

async function handleEditSave() {
    const field = editField.value
    const newValue = field === 'taskProgress' ? Number(editValue.value) : String(editValue.value).trim()
    if (field === 'taskProgress' && (isNaN(newValue) || newValue < 0 || newValue > 100)) {
        uni.showToast({ title: '请输入 0-100 的进度', icon: 'none' })
        return
    }
    const oldValue = props.task[field]
    if (String(newValue) === String(oldValue)) {
        editShow.value = false
        return
    }
    try {
        if (field === 'weChatName') {
            await fetchUpdateTaskConfig({ id: props.task.realTimeId, weChatName: newValue })
        } else if (field === 'taskName') {
            await fetchUpdateTask({ id: props.task.id, taskName: newValue })
        } else {
            await fetchUpdateTask({ id: props.task.id, taskProgress: newValue })
        }
        editShow.value = false
        emit('reload')
        uni.showToast({ title: '修改成功', icon: 'none' })
    } catch (e) {
        console.error('更新失败', e)
    }
}

// ===== 复制 =====
function copyText(text: string) {
    if (!text) return
    uni.setClipboardData({
        data: text,
        success: () => uni.showToast({ title: '已复制', icon: 'none' }),
    })
}

// ===== 日志弹窗 =====
const logShow = ref(false)
</script>

<style lang="scss" scoped>
.task-card {
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    border-left: 8rpx solid;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16rpx;

        .header-left {
            display: flex;
            align-items: center;
            gap: 16rpx;

            .status-tag {
                display: flex;
                align-items: center;
                gap: 8rpx;
                padding: 6rpx 16rpx;
                border-radius: 12rpx;
                font-size: 24rpx;
                font-weight: 500;

                .status-dot {
                    width: 12rpx;
                    height: 12rpx;
                    border-radius: 50%;
                }
            }

            .debugger {
                font-size: 24rpx;
            }

            .delay-tag {
                display: inline-flex;
                align-items: center;
                padding: 4rpx 12rpx;
                border-radius: 10rpx;
                background: rgba(239, 68, 68, 0.12);
                color: #ef4444;
                font-size: 22rpx;
                font-weight: 600;
                flex-shrink: 0;
            }
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 20rpx;

            .icon-btn {
                font-size: 32rpx;
                padding: 4rpx;
                opacity: 0.85;

                &.danger {
                    opacity: 0.9;
                }
            }
        }
    }

    .row {
        display: flex;
        align-items: center;
        padding: 10rpx 0;
        font-size: 26rpx;

        .label {
            flex-shrink: 0;
            width: 120rpx;
            font-size: 24rpx;
        }

        .value {
            flex: 1;
            min-width: 0;
            font-weight: 500;
            text-align: right;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &.editable {
                color: #3b82f6 !important;
            }

            &.time-text {
                font-size: 22rpx;
                font-weight: 400;
            }

            &.delay-rsn {
                font-size: 24rpx;
            }
        }

        &.progress-row {
            .progress-wrap {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 16rpx;

                .progress-bar {
                    flex: 1;
                    height: 14rpx;
                    border-radius: 8rpx;
                    overflow: hidden;

                    .progress-inner {
                        height: 100%;
                        border-radius: 8rpx;
                        transition: width 0.3s;
                    }
                }

                .progress-text {
                    min-width: 80rpx;
                    text-align: right;
                    font-weight: 600;
                    font-size: 26rpx;
                }
            }
        }
    }

    .delay-prompt {
        display: flex;
        align-items: center;
        padding: 6rpx 16rpx;
        margin: 8rpx 0 12rpx;
        border-radius: 12rpx;
        background: rgba(239, 68, 68, 0.1);
        border: 1rpx solid rgba(239, 68, 68, 0.25);

        .delay-prompt-text {
            font-size: 24rpx;
            color: #ef4444;
        }
    }

    &.simple {
        padding-top: 16rpx;

        .card-header {
            margin-bottom: 8rpx;
        }

        .row {
            padding: 8rpx 0;
        }
    }
        .task-name-row {
            .value {
                font-weight: 600;
                font-size: 28rpx;
            }
        }
        .row-copy {
            font-size: 22rpx;
            flex-shrink: 0;
            margin-left: 12rpx;
            padding: 2rpx 12rpx;
            border-radius: 8rpx;
            background: rgba(59, 130, 246, 0.1);
        }
        .edit-icon {
            font-size: 26rpx;
            flex-shrink: 0;
            margin-left: 8rpx;
            opacity: 0.75;
        }
}

.edit-wrap {
    padding: 30rpx;
    box-sizing: border-box;

    .edit-title {
        font-size: 32rpx;
        font-weight: 600;
        text-align: center;
        margin-bottom: 30rpx;
    }

    .edit-btns {
        display: flex;
        justify-content: flex-end;
        gap: 20rpx;
        margin-top: 30rpx;
    }
}

.delay-edit-body {
    padding: 20rpx 24rpx;
    border-radius: 16rpx;
    box-sizing: border-box;

    :deep(.wd-textarea) {
        background: transparent;
        padding: 0;
    }
}

.delay-view-text {
    font-size: 28rpx;
    line-height: 1.6;
    word-break: break-all;
    white-space: pre-wrap;
    max-height: 40vh;
    overflow-y: auto;
}
</style>
