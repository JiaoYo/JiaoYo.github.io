// 项目信息
import request from '@/utils/request';

// 项目信息查询
export function fetchGetPrjDataList(data?: any, showLoading = true) {
    return request({
        url: '/projectInfo/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading
    });
}

// 查询新增的uuid信息
export function fetchGetPrjIdByuuid(uuid: string) {
    return request({
        url: '/projectInfo/getByUuid.do',
        method: 'GET',
        data: {
            uuid,
            _t: new Date().getTime()
        }
    })
}

// 项目信息查询详情
export function fetchGetPrjInfo(id: number) {
    return request({
        url: '/projectInfo/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目信息新增
export function fetchSavePrjInfo(data?: any) {
    return request({
        url: '/projectInfo/insert.do',
        method: 'POST',
        data,
    });
}

// 项目信息修改
export function fetchUpdatePrjInfo(data?: any) {
    return request({
        url: '/projectInfo/update.do',
        method: 'PUT',
        data,
    });
}

// 项目信息删除
export function fetchDeletePrjInfo(id: number | string) {
    return request({
        url: `/projectInfo/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

// 获取项目关联合同
export function fetchGetContractsPageByPrjId(data?: any) {
    return request({
        url: '/projectInfo/getContractsPage.do',
        method: 'GET',
        data
    })
}

// 查询项目合同设备出库信息
export function fetchGetContractsDevicesPageByPrjId(data?: any) {
    return request({
        url: '/projectEquipment/getOutInventoryById.do',
        method: 'GET',
        data
    })
}