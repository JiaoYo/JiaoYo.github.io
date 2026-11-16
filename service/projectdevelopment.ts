// 需要开发
import request from '@/utils/request';

// 需要开发查询
export function fetchGetPrjDevelopmentDataList(data?: any) {
    return request({
        url: '/projectDevelopment/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 需要开发详情
export function fetchGetPrjDevelopmentInfo(id: number | string) {
    return request({
        url: '/projectDevelopment/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 需要开发新增
export function fetchSavePrjDevelopmentInfo(data?: any) {
    return request({
        url: '/projectDevelopment/insert.do',
        method: 'POST',
        data,
    });
}

// 需要开发修改
export function fetchUpdatePrjDevelopmentInfo(data?: any) {
    return request({
        url: '/projectDevelopment/update.do',
        method: 'PUT',
        data,
    });
}

// 需要开发删除
export function fetchDeletePrjDevelopmentInfo(id: number | string) {
    return request({
        url: `/projectDevelopment/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}