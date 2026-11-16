import request from '@/utils/request';

/**
 * ==================== 确认单事项库（对齐 web projectStartConfirm library 部分）====================
 * 入口 usertype 0/1/2；分页查询 + 模糊/启用状态筛选；新增/修改（version 乐观锁）、
 * 启用停用、删除（仅未被项目选择过的条目可删除）。
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

/** 分页查询确认单库（enabled 不传查全部，可传 0/1；limit 范围 1～100） */
export function fetchStartConfirmLibraryPage(params: { page: number; limit: number; enabled?: number; fuzzy?: string }) {
    return request({
        url: `/projectStartConfirm/libraryPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/** 新增确认单库事项（成功时 data 为新增条目 ID） */
export function fetchStartConfirmLibraryInsert(data: { category: string; itemContent: string; itemDesc?: string; enabled: number; sortNo?: number }) {
    return request({
        url: '/projectStartConfirm/libraryInsert.do',
        method: 'post',
        data
    });
}

/** 修改确认单库事项（version 必传；并发修改时服务端提示刷新后重试） */
export function fetchStartConfirmLibraryUpdate(data: {
    id: number;
    category: string;
    itemContent: string;
    itemDesc?: string;
    enabled: number;
    sortNo?: number;
    version: number;
}) {
    return request({
        url: '/projectStartConfirm/libraryUpdate.do',
        method: 'put',
        data
    });
}

/** 启用或停用确认单库事项（停用后不出现在选择列表；已确认项目保存的是快照，不受影响） */
export function fetchStartConfirmLibraryEnabled(params: { id: number; enabled: number }) {
    return request({
        url: `/projectStartConfirm/libraryEnabled.do${buildQueryParams(params)}`,
        method: 'put',
        data: undefined
    });
}

/** 删除确认单库事项（仅从未被项目选择的条目可删除；已使用的条目必须改为停用） */
export function fetchStartConfirmLibraryDelete(params: { id: number }) {
    return request({
        url: `/projectStartConfirm/libraryDelete.do${buildQueryParams(params)}`,
        method: 'delete',
        data: undefined
    });
}
