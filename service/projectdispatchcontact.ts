// 项目调度联系人
import request from '@/utils/request';

// 项目调度联系人查询
export function fetchGetPrjDispatchContractDataList(data?: any) {
    return request({
        url: '/projectDispatchContact/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 项目调度联系人查询详情
export function fetchGetPrjDispatchContractInfo(id: number | string) {
    return request({
        url: '/projectDispatchContact/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目调度联系人新增
export function fetchSavePrjDispatchContractInfo(data?: any) {
    return request({
        url: '/projectDispatchContact/insert.do',
        method: 'POST',
        data,
    });
}

// 项目调度联系人修改
export function fetchUpdatePrjDispatchContractInfo(data?: any) {
    return request({
        url: '/projectDispatchContact/update.do',
        method: 'PUT',
        data,
    });
}

// 项目调度联系人删除
export function fetchDeletePrjDispatchContractInfo(id: number | string) {
    return request({
        url: `/projectDispatchContact/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}