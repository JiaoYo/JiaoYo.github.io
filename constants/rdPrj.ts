/**
 * ==================== 研发项目常量 ====================
 */

/**
 * 需求状态
 */
export const rdprjStatus = {
    0: '待确认',
    1: '已确认',
    2: '已拒绝'
};

export const rdprjStatusOptions = [
    { label: '待确认', value: 0 },
    { label: '已确认', value: 1 },
    { label: '已拒绝', value: 2 }
];

/**
 * 需求优先级
 */
export const rdprjLevelOptions = [
    { label: '紧急', value: 0 },
    { label: '重要', value: 1 },
    { label: '一般', value: 2 },
    { label: '优化', value: 3 }
];

/**
 * 评审人类型
 */
export const rdprjType1 = {
    0: '李吉峰',
    1: '孙东洪',
    2: '徐顺乐'
};

export const rdprjTypeOptions1 = [
    { label: '李吉峰', value: 0 },
    { label: '孙东洪', value: 1 },
    { label: '徐顺乐', value: 2 }
];

/**
 * 任务状态
 */
export const rdprjTaskStatus:any = {
  0:'待确认',
  2:'待审核规划',
  3:'审核拒绝',
  4:'审核通过',
  5:'开发中',
  6:'待测试',
  7:'测试中',
  8:'结项',
};
export const rdprjTaskStatusOptions = rdprjTaskStatus? Object.keys(rdprjTaskStatus).map((key) => ({
    label: rdprjTaskStatus[key],
    value: Number(key)
})):[]
/**
 * 任务状态颜色映射
 */
export const rdprjTaskStatusColorMap: Record<number, { color: string; textColor: string; borderColor: string }> = {
    0: {
            color: '#fff7e6',
            textColor: '#d48806',
            borderColor: '#ffd591'
          },

          2: {
            color: '#e6f4ff',
            textColor: '#1677ff',
            borderColor: '#91caff'
          },

          3: {
            color: '#fff1f0',
            textColor: '#cf1322',
            borderColor: '#ffa39e'
          },

          4: {
            color: '#f6ffed',
            textColor: '#389e0d',
            borderColor: '#b7eb8f'
          },

          5: {
            color: '#f0f5ff',
            textColor: '#2f54eb',
            borderColor: '#adc6ff'
          },

          6: {
            color: '#fffbe6',
            textColor: '#d4b106',
            borderColor: '#ffe58f'
          },

          7: {
            color: '#e6fffb',
            textColor: '#08979c',
            borderColor: '#87e8de'
          },

          8: {
            color: '#f6ffed',
            textColor: '#237804',
            borderColor: '#237804'
          }
};

/**
 * 优先级颜色
 */
export const rdprjPriorityColors = ['#ff4d4f', '#fa8c16', '#1677ff', '#52c41a'];

/**
 * 获取优先级对应的颜色
 */
export function getPriorityColor(priority: number): string {
    return rdprjPriorityColors[priority] || '#999999';
}

/**
 * 获取优先级标签
 */
export function getPriorityLabel(priority: number): string {
    const option = rdprjLevelOptions.find(item => item.value === priority);
    return option?.label || '-';
}

/**
 * 获取状态标签
 */
export function getStatusLabel(status: number): string {
    return rdprjStatus[status] || '-';
}

/**
 * 获取任务状态标签
 */
export function getTaskStatusLabel(status: number): string {
    return rdprjTaskStatus[status] || '未知';
}

/**
 * 需求来源
 */
export const rdDemandSource: Record<number, string> = { 0: '内部需求', 1: '三方合同' };

/**
 * 合同付款状态（存量数据 paystatus 可能为空，展示时按"待维护"兜底）
 */
export const contractPayStatus: Record<number, string> = { 0: '未付款', 1: '部分付款', 2: '已付清' };

/**
 * 付款状态标签颜色：未付款红/部分付款橙/已付清绿
 */
export const contractPayStatusType: Record<number, string> = { 0: 'error', 1: 'warning', 2: 'success' };
