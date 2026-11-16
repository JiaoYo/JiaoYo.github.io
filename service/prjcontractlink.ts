// 项目合同关联表
import request from '@/utils/request';

// 项目合同关联查询
export function fetchGetPrjContractLinkDataList(data?: any) {
    return request({
        url: '/projectContractCorrelation/getPage.do',
        method: 'GET',
        data,
    });
}

// 项目合同关联查询详情
export function fetchGetPrjContractLinkInfo(id: number | string) {
    return request({
        url: '/projectContractCorrelation/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目合同关联新增
export function fetchSavePrjContractLinkInfo(data?: any) {
    return request({
        url: '/projectContractCorrelation/insert.do',
        method: 'POST',
        data,
    });
}

// 项目合同关联修改
export function fetchUpdatePrjContractLinkInfo(data?: any) {
    return request({
        url: '/projectContractCorrelation/update.do?proid=' + data[0].pid,
        method: 'PUT',
        data,
    });
}

// 项目合同关联删除
export function fetchDeletePrjContractLinkInfo(id: number | string) {
    return request({
        url: `/projectContractCorrelation/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}