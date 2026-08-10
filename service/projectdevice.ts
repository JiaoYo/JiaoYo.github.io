// 合同设备数据
import request from '@/utils/request';

// 合同设备查询
export function fetchGetPrjDeviceDataList(data?: any) {
    return request({
        url: '/projectDevice/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 合同设备详情
export function fetchGetPrjDeviceInfo(id: number | string) {
    return request({
        url: '/projectDevice/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 合同设备新增
export function fetchSavePrjDeviceInfo(data?: any) {
    return request({
        url: '/projectDevice/insert.do',
        method: 'POST',
        data,
    });
}

// 合同设备修改
export function fetchUpdatePrjDeviceInfo(data?: any) {
    return request({
        url: '/projectDevice/update.do',
        method: 'PUT',
        data,
    });
}

// 合同设备删除
export function fetchDeletePrjDeviceInfo(id: number | string) {
    return request({
        url: `/projectDevice/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}