// 客户需求变更
import request from '@/utils/request';

// 客户需求变更查询
export function fetchGetPrjCustomerDataList(data?: any) {
    return request({
        url: '/projectCustomer/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 客户需求变更详情
export function fetchGetPrjCustomerInfo(id: number | string) {
    return request({
        url: '/projectCustomer/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 客户需求变更新增
export function fetchSavePrjCustomerInfo(data?: any) {
    return request({
        url: '/projectCustomer/insert.do',
        method: 'POST',
        data,
    });
}

// 客户需求变更修改
export function fetchUpdatePrjCustomerInfo(data?: any) {
    return request({
        url: '/projectCustomer/update.do',
        method: 'PUT',
        data,
    });
}

// 客户需求变更删除
export function fetchDeletePrjCustomerInfo(id: number | string) {
    return request({
        url: `/projectCustomer/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}