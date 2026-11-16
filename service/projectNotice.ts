// 项目注意事项（出发注意事项查看/已读/回复，只读不发布）
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

// 注意事项分页（status=1 已发布；unreadOnly=true 仅本人未读；全部视图包含已撤回）
export function fetchGetProjectNoticePage(params: {
    pid: number;
    page: number;
    limit: number;
    status?: number;
    unreadOnly?: boolean;
}) {
    return request({
        url: `/projectNotice/getPage.do${buildQueryParams(params)}`,
        method: 'GET'
    });
}

// 注意事项详情（含 canReply / activityVersion / unread）
export function fetchGetProjectNoticeById(params: { id: string }) {
    return request({
        url: `/projectNotice/getById.do${buildQueryParams(params)}`,
        method: 'GET'
    });
}

// 流程页摘要（totalCount 已发布 / unreadCount 未读）
export function fetchGetProjectNoticeSummary(params: { pid: number }) {
    return request({
        url: `/projectNotice/getSummary.do${buildQueryParams(params)}`,
        method: 'GET'
    });
}

// 个人已读（activityVersion 必须传用户实际打开详情获得的版本，不能拿后端当前版本一键全读）
export function fetchReadProjectNotice(data: { id: string; activityVersion: string }) {
    return request({
        url: '/projectNotice/read.do',
        method: 'POST',
        data
    });
}

// 创建并发布（保存即发布；发布人自己和超级管理员可撤回）
export function fetchInsertProjectNotice(data: { pid: number; title: string; content: string; priority?: number }) {
    return request({
        url: '/projectNotice/insert.do',
        method: 'POST',
        data
    });
}

// 撤回（创建人或超级管理员；幂等，保留审计）
export function fetchWithdrawProjectNotice(data: { id: string }) {
    return request({
        url: '/projectNotice/withdraw.do',
        method: 'PUT',
        data
    });
}

// 回复分页（按 ID 降序，最新在前）
export function fetchGetProjectNoticeReplyPage(params: { noticeId: string; page: number; limit: number }) {
    return request({
        url: `/projectNoticeReply/getPage.do${buildQueryParams(params)}`,
        method: 'GET'
    });
}

// 新增回复（项目参与人或事项创建人可回复）
export function fetchInsertProjectNoticeReply(data: { noticeId: string; content: string }) {
    return request({
        url: '/projectNoticeReply/insert.do',
        method: 'POST',
        data
    });
}
