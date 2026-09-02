// 工程调试单调试设备
import request from '@/utils/request';

// 工程调试单调试设备分页列表
export function fetchGetPrjformDebugEquipmentDataList(data?: any) {
    return request({
        url: '/projectFormEquipment/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 工程调试单调试设备详情
export function fetchGetPrjformDebugEquipmentInfo(id: number | string) {
    return request({
        url: '/projectFormEquipment/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 工程调试单调试设备新增
export function fetchSavePrjformDebugEquipmentInfo(data: any) {
    return request({
        url: '/projectFormEquipment/insert.do',
        method: 'POST',
        data
    });
}

// 工程调试单调试设备修改
export function fetchUpdatePrjformDebugEquipmentInfo(data: any) {
    return request({
        url: '/projectFormEquipment/update.do',
        method: 'PUT',
        data
    });
}

// 工程调试单调试设备删除
export function fetchDeletePrjformDebugEquipmentInfo(id: number | string) {
    return request({
        url: `/projectFormEquipment/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
