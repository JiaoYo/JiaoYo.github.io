// 合同变更
import request from '@/utils/request';

// 合同变更分页列表
export function fetchGetContractchangeDataList(data?: any) {
    return request({
        url: '/projectChangeContract/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 合同变更新增
export function fetchSaveContractchangeInfo(data: any) {
    return request({
        url: '/projectChangeContract/insert.do',
        method: 'POST',
        data
    });
}

// 合同变更修改
export function fetchUpdateContractchangeInfo(data: any) {
    return request({
        url: '/projectChangeContract/update.do',
        method: 'PUT',
        data
    });
}

// 合同变更删除
export function fetchDeleteContractchangeInfo(id: number | string) {
    return request({
        url: `/projectChangeContract/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
