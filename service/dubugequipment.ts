// 调试设备
import request from '@/utils/request';

// 调试设备分页列表
export function fetchGetDebugEquipmentDataList(data?: any) {
    return request({
        url: '/projectEquipment/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 调试设备详情
export function fetchGetDebugEquipmentInfo(id: number | string) {
    return request({
        url: '/projectEquipment/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 调试设备新增
export function fetchSaveDebugEquipmentInfo(data: any) {
    return request({
        url: '/projectEquipment/insert.do',
        method: 'POST',
        data
    });
}

// 调试设备修改
export function fetchUpdateDebugEquipmentInfo(data: any) {
    return request({
        url: '/projectEquipment/update.do',
        method: 'PUT',
        data
    });
}

// 调试设备删除
export function fetchDeleteDebugEquipmentInfo(id: number | string) {
    return request({
        url: `/projectEquipment/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
