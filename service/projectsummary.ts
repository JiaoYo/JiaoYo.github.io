// 项目总结
import request from '@/utils/request';

// 项目总结查询
export function fetchGetPrjSummaryList(data?: any) {
    return request({
        url: '/projectSummary/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 项目总结查询详情
export function fetchGetPrjSummaryInfo(id: number) {
    return request({
        url: '/projectSummary/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目总结新增
export function fetchSavePrjSummaryInfo(data?: any) {
    return request({
        url: '/projectSummary/insert.do',
        method: 'POST',
        data,
    });
}

// 项目总结修改
export function fetchUpdatePrjSummaryInfo(data?: any) {
    return request({
        url: '/projectSummary/update.do',
        method: 'PUT',
        data,
    });
}

// 项目总结删除
export function fetchDeletePrjSummaryInfo(id: number | string) {
    return request({
        url: `/projectSummary/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}