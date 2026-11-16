// 项目返工（发起/修改/完成/取消/历史分页）
import request from '@/utils/request';

/**
 * 构建查询参数字符串（兼容旧版安卓）
 */
function buildQueryParams(params: Record<string, any>): string {
    const parts: string[] = [];
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            parts.push(key + '=' + encodeURIComponent(String(params[key])));
        }
    }
    return parts.length > 0 ? '?' + parts.join('&') : '';
}

/** 发起返工（项目状态待审核/已完成且无进行中返工时允许，服务端最终校验） */
export function fetchStartRework(data: { pid: number; responsibleId: number; reason: string; requirement?: string; deadline: string }) {
    return request({
        url: '/projectInfo/rework/start.do',
        method: 'POST',
        data
    });
}

/** 修改进行中的返工 */
export function fetchUpdateRework(data: { id: number; responsibleId: number; reason: string; requirement?: string; deadline: string }) {
    return request({
        url: '/projectInfo/rework/update.do',
        method: 'PUT',
        data
    });
}

/** 完成返工（项目直接进入已完成状态，无需审核） */
export function fetchFinishRework(data: { id: number; completionNote: string }) {
    return request({
        url: '/projectInfo/rework/finish.do',
        method: 'PUT',
        data
    });
}

/** 取消返工（项目恢复至返工前状态） */
export function fetchCancelRework(data: { id: number; cancelReason: string }) {
    return request({
        url: '/projectInfo/rework/cancel.do',
        method: 'PUT',
        data
    });
}

/** 返工记录分页（status: 0 进行中、1 已完成、2 已取消；overdue=1 仅查已逾期；responsibleIds 逗号分隔多责任人） */
export function fetchGetReworkPage(params: {
    pid?: number;
    status?: number;
    overdue?: number;
    responsibleIds?: string;
    year?: number;
    month?: number;
    page: number;
    limit: number;
}) {
    return request({
        url: `/projectInfo/rework/page.do${buildQueryParams(params)}`,
        method: 'GET'
    });
}

/** 返工统计（项目总数/返工项目数/返工中/累计次数/完成/取消/逾期/返工率） */
export function fetchGetReworkStatistics() {
    return request({
        url: '/projectInfo/rework/statistics.do',
        method: 'GET'
    });
}
