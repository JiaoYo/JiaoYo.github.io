/**
 * =========================
 * 运营—销售统一线索 常量定义（web operationSales 模块移植）
 * process_status 表示工作走到哪里，outcome_status 表示业务结果，二者不可合并。
 * =========================
 */

/** 线索来源 origin_type */
export const leadOriginTypeMap: Record<string, string> = {
    OPERATION: '运营提供',
    EXHIBITION: '展会',
    SALES_SELF: '销售自拓',
    OTHER: '其他'
};
// 来源颜色
export const leadOriginTypeColorMap: Record<string, string> = {
    OPERATION: '#1677ff',
    EXHIBITION: '#52c41a',
    SALES_SELF: '#1677ff',
    OTHER: '#909399'
};
export const leadOriginTypeOptions = Object.keys(leadOriginTypeMap).map(v => ({ label: leadOriginTypeMap[v], value: v }));

/** 流程状态 process_status */
export const leadProcessStatusMap: Record<string, string> = {
    NEW: '新线索',
    PENDING_RECEIVE: '待接收',
    FOLLOWING: '跟进中',
    FINISHED: '已结束'
};
// 流程状态颜色
export const leadProcessStatusColorMap: Record<string, string> = {
    NEW: '#909399',
    PENDING_RECEIVE: '#fa8c16',
    FOLLOWING: '#1677ff',
    FINISHED: '#52c41a'
};
export const leadProcessStatusOptions = Object.keys(leadProcessStatusMap).map(v => ({
    label: leadProcessStatusMap[v],
    value: v
}));

/** 线索结果 outcome_status：INVALID/DEAL/CLOSED_OTHER 为终结结果 */
export const leadOutcomeStatusMap: Record<string, string> = {
    UNASSESSED: '未评估',
    VALID: '有效',
    INVALID: '无效',
    DEAL: '成交',
    CLOSED_OTHER: '其他关闭'
};
// 结果颜色
export const leadOutcomeStatusColorMap: Record<string, string> = {
    UNASSESSED: '#909399',
    VALID: '#52c41a',
    INVALID: '#f5222d',
    DEAL: '#52c41a',
    CLOSED_OTHER: '#909399'
};
export const leadOutcomeStatusOptions = Object.keys(leadOutcomeStatusMap).map(v => ({
    label: leadOutcomeStatusMap[v],
    value: v
}));
/** 终结结果：提交后流程立即置为 FINISHED，提交前需二次确认 */
export const terminalOutcomeStatuses = ['INVALID', 'DEAL', 'CLOSED_OTHER'];

/** 交接状态 */
export const handoffStatusMap: Record<string, string> = {
    PENDING: '待处理',
    ACCEPTED: '已接收',
    REJECTED: '已拒绝',
    CANCELLED: '已取消'
};
// 交接状态颜色
export const handoffStatusColorMap: Record<string, string> = {
    PENDING: '#fa8c16',
    ACCEPTED: '#52c41a',
    REJECTED: '#f5222d',
    CANCELLED: '#909399'
};

/** 跟进方式（LEGACY 仅标识历史导入记录，不在新建表单中展示） */
export const followupTypeMap: Record<string, string> = {
    PHONE: '电话',
    WECHAT: '微信',
    VISIT: '拜访',
    EMAIL: '邮件',
    OTHER: '其他',
    LEGACY: '历史补录'
};
export const followupTypeOptions = ['PHONE', 'WECHAT', 'VISIT', 'EMAIL', 'OTHER'].map(v => ({
    label: followupTypeMap[v],
    value: v
}));

/** 列表范围页签（scope 不传默认 ALL；页签为筛选项非权限，所有人可见） */
export const leadScopeOptions = [
    { label: '全部线索', value: 'ALL' },
    { label: '我的线索', value: 'MINE' },
    { label: '我负责的', value: 'OWNED_BY_ME' },
    { label: '待我接收', value: 'PENDING_FOR_ME' }
];

/** 渠道预设（可自定义输入；2026-10-14 起新增 400 / 手机，不再提供 电话） */
export const channelPresetOptions = ['400', '抖音', '官网', '手机', '微信公众号', '微信视频号', '快手', '其他'].map(v => ({
    label: v,
    value: v
}));

/** 疑似重复审核状态（2026-10-14）：SUSPECTED 在列表/详情展示「疑似重复」标签，其余用于审核记录展示 */
export const leadDuplicateStatusMap: Record<string, string> = {
    SUSPECTED: '疑似重复',
    CONFIRMED_UNIQUE: '已确认非重复',
    CONFIRMED_DUPLICATE: '已确认重复'
};
// 疑似重复状态颜色
export const leadDuplicateStatusColorMap: Record<string, string> = {
    SUSPECTED: '#fa8c16',
    CONFIRMED_UNIQUE: '#52c41a',
    CONFIRMED_DUPLICATE: '#f5222d'
};
/** 重复匹配原因（详情 duplicate_matches.match_reason 枚举，未知值原样展示） */
export const leadDuplicateMatchReasonMap: Record<string, string> = {
    EXISTING_NAME_CONTAINS_NEW: '已有名称包含新名称',
    NEW_NAME_CONTAINS_EXISTING: '新名称包含已有名称',
    NORMALIZED_PHONE_MATCH: '规范化电话相同'
};

/** 展会状态 */
export const exhibitionStatusMap: Record<string, string> = {
    ACTIVE: '进行中',
    CLOSED: '已结束',
    CANCELLED: '已取消'
};
export const exhibitionStatusColorMap: Record<string, string> = {
    ACTIVE: '#52c41a',
    CLOSED: '#909399',
    CANCELLED: '#f5222d'
};

/**
 * 时间戳 → 'yyyy-MM-dd' / 'yyyy-MM-dd HH:mm:ss'（wd-datetime-picker confirm 值为时间戳）
 */
export function formatTs(ts: any, withTime = false): string {
    const n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return '';
    const d = new Date(n);
    const p = (v: number) => String(v).padStart(2, '0');
    const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    if (!withTime) return date;
    return `${date} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
