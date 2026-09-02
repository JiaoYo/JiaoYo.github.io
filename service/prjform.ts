// 工程调试单
import request from '@/utils/request';

// 工程调试单查询
export function fetchGetPrjFormDataList(data?: any) {
    return request({
        url: '/projectForm/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 工程调试单详情
export function fetchGetPrjFormInfo(id: number | string) {
    return request({
        url: '/projectForm/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 工程调试单新增
export function fetchSavePrjFormInfo(data?: any) {
    return request({
        url: '/projectForm/insert.do',
        method: 'POST',
        data
    });
}

// 工程调试单修改
export function fetchUpdatePrjFormInfo(data?: any) {
    return request({
        url: '/projectForm/update.do',
        method: 'PUT',
        data,
    });
}

// 工程调试单删除
export function fetchDeletePrjFormInfo(id: number | string) {
    return request({
        url: `/projectForm/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

// 查询销售项目列表
export function fetchGetPrjDataListBySelf(data: any) {
    return request({
        url: '/projectForm/getProjectPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 查询是否添加过工程调试单
export function fetchGetCommissioningsheetByProId(proId: number) {
    return request({
        url: '/projectForm/getIdByProId.do',
        method: 'GET',
        data: {
            proId,
            _t: new Date().getTime()
        }
    });
}