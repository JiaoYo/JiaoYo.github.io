// 项目合同
import request from '@/utils/request';

// 项目合同查询
export function fetchGetPrjContractDataList(data?: any) {
    return request({
        url: '/projectContract/getPage.do',
        method: 'GET',
        data,
    });
}

// 项目合同查询详情
export function fetchGetPrjContractInfo(id: number | string) {
    return request({
        url: '/projectContract/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目合同新增
export function fetchSavePrjContractInfo(data?: any) {
    return request({
        url: '/projectContract/insert.do',
        method: 'POST',
        data,
    });
}

// 项目合同修改
export function fetchUpdatePrjContractInfo(data?: any) {
    return request({
        url: '/projectContract/update.do?proid=' + data[0].pid,
        method: 'PUT',
        data,
    });
}

// 项目合同审核
export function fetchUpdatePrjContractStatusInfo(data?: any) {
    return request({
        url: '/projectContract/updateCheck.do',
        method: 'PUT',
        data,
        header: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });
}

// 项目合同删除
export function fetchDeletePrjContractInfo(id: number | string) {
    return request({
        url: `/projectContract/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}