// 项目权重
import request from '@/utils/request';

// 项目权重查询
export function fetchGetPrjWeightDataList(data?: any) {
    return request({
        url: '/projectWeight/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 项目权重详情
export function fetchGetPrjWeightInfo(id: number | string) {
    return request({
        url: '/projectWeight/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目权重新增
export function fetchSavePrjWeightInfo(data?: any) {
    return request({
        url: '/projectWeight/insert.do',
        method: 'POST',
        data,
    });
}

// 项目权重修改
export function fetchUpdatePrjWeightInfo(data?: any) {
    return request({
        url: '/projectWeight/update.do',
        method: 'PUT',
        data,
    });
}

// 项目权重删除
export function fetchDeletePrjWeightInfo(id: number | string) {
    return request({
        url: `/projectWeight/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}