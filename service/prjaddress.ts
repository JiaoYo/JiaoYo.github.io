// 项目地点绑定
import request from '@/utils/request';

// 项目地点分页列表
export function fetchGetPrjaddressDataList(data?: any) {
    return request({
        url: '/projectAddrs/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 项目地点详情
export function fetchGetPrjaddressInfo(id: number | string) {
    return request({
        url: '/projectAddrs/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目地点新增
export function fetchSavePrjaddressInfo(data: any) {
    return request({
        url: '/projectAddrs/insert.do',
        method: 'POST',
        data
    });
}

// 项目地点修改
export function fetchUpdatePrjaddressInfo(data: any) {
    return request({
        url: '/projectAddrs/update.do',
        method: 'PUT',
        data
    });
}

// 项目地点删除
export function fetchDeletePrjaddressInfo(id: number | string) {
    return request({
        url: `/projectAddrs/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
