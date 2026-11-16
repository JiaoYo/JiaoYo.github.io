// 项目周报
import request from '@/utils/request';

// 项目周报查询
export function fetchGetPrjWeekreportList(data?: any) {
    return request({
        url: '/projectWeek/getPage.do',
        method: 'GET',
        data,
    });
}

// 项目周报查询详情
export function fetchGetPrjWeekreportInfo(id: number) {
    return request({
        url: '/projectWeek/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目周报新增
export function fetchSavePrjWeekreportInfo(data?: any) {
    return request({
        url: '/projectWeek/insert.do',
        method: 'POST',
        data,
    });
}

// 项目周报修改
export function fetchUpdatePrjWeekreportInfo(data?: any) {
    return request({
        url: '/projectWeek/update.do',
        method: 'PUT',
        data,
    });
}

// 项目周报删除
export function fetchDeletePrjWeekreportInfo(id: number | string) {
    return request({
        url: `/projectWeek/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}