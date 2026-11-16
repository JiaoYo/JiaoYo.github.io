// ===== 工程考核 - 共享常量与工具函数 =====

// 考核类型
export const ATYPE_OPTIONS: { label: string; value: number }[] = [
    { label: '培训考核', value: 0 },
    { label: 'T1', value: 1 },
    { label: 'T2', value: 2 },
    { label: 'T3', value: 3 },
    { label: 'T4', value: 4 },
    { label: 'T5', value: 5 },
    { label: 'T6', value: 6 },
    { label: 'T7', value: 7 },
]

export function getAtypeLabel(value: number | undefined | null) {
    return ATYPE_OPTIONS.find((item) => item.value === value)?.label || '未知'
}

// 参与类型
export const APATICI_OPTIONS: { label: string; value: number; color: string }[] = [
    { label: '全员参与', value: 0, color: '#22c55e' },
    { label: '指定参与', value: 1, color: '#3b82f6' },
]

export function getApaticiConfig(value: number | undefined | null) {
    return APATICI_OPTIONS.find((item) => item.value === value) || { label: '未知', value: -1, color: '#909399' }
}

// 考核状态
export const STATUS_OPTIONS: { label: string; value: number; color: string }[] = [
    { label: '未开始', value: 0, color: '#909399' },
    { label: '进行中', value: 1, color: '#22c55e' },
    { label: '结束', value: 2, color: '#f5222d' },
]

export function getStatusConfig(value: number | undefined | null) {
    return STATUS_OPTIONS.find((item) => item.value === value) || STATUS_OPTIONS[0]
}

// 考核管理/操作者（系统管理员 / 项目负责人）
export const MANAGER_USER_TYPES = [0, 2]
// 答题参与者（技术工程师 / 组长）
export const ANSWERER_USER_TYPES = [3, 9]

// 主题色（用于渐变色标题、强调）
export const THEME_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
