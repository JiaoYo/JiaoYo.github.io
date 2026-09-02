// 工程调试单联系人
import request from '@/utils/request';

// 工程调试单分页列表
export function fetchGetPrjformMemberDataList(data?: any) {
    return request({
        url: '/projectFormContact/getPage.do',
        method: 'GET',
        data,
    });
}

// 工程调试单详情
export function fetchGetPrjformMemberInfo(id: number | string) {
    return request({
        url: '/projectFormContact/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 工程调试单新增
export function fetchSavePrjformMemberInfo(data: any) {
    return request({
        url: '/projectFormContact/insert.do',
        method: 'POST',
        data
    });
}

// 工程调试单修改
export function fetchUpdatePrjformMemberInfo(data: any) {
    return request({
        url: '/projectFormContact/update.do',
        method: 'PUT',
        data
    });
}

// 工程调试单删除
export function fetchDeletePrjformMemberInfo(id: number | string) {
    return request({
        url: `/projectFormContact/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
