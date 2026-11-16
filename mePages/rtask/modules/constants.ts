// ===== 实时任务 - 共享常量与工具函数 =====

// 任务状态
export const STATUS_OPTIONS: { label: string; value: number; color: string }[] = [
    { label: '调试中', value: 1, color: '#3b82f6' },
    { label: '暂停', value: 2, color: '#facc15' },
    { label: '已完成', value: 3, color: '#22c55e' },
]

// 状态允许的下一步流转
const STATUS_NEXT: Record<number, number[]> = {
    1: [2, 3], // 调试中 -> 暂停 / 已完成
    2: [1], // 暂停 -> 调试中
    3: [], // 已完成 不可再变更
}

// 管理者用户类型（项目负责人 / 技术工程师 / 组长）
export const MANAGE_USER_TYPES = [2, 3, 9]

// 获取状态展示配置
export function getStatusConfig(status: number | undefined) {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
}

// 获取当前状态可切换的目标状态
export function getAvailableNextStatuses(currentStatus: number): number[] {
    return STATUS_NEXT[currentStatus] || []
}

// 操作日志类型
export const LOG_TYPE_MAP: Record<number, { label: string; color: string }> = {
    0: { label: '新增', color: '#22c55e' },
    1: { label: '切换用户', color: '#3b82f6' },
    2: { label: '更新进度', color: '#f59e0b' },
    3: { label: '暂停', color: '#facc15' },
    4: { label: '恢复调试', color: '#8b5cf6' },
    5: { label: '完成', color: '#22c55e' },
}

// 获取日志类型展示配置
export function getLogTypeConfig(type: number | undefined) {
    return LOG_TYPE_MAP[type] || { label: '未知', color: '#909399' }
}
