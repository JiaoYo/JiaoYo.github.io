// 项目联络单联系人
import request from '@/utils/request';

// 项目联络单分页列表
export function fetchGetPrjformMemberDataList(data?: any) {
    return request({
        url: '/projectFormContact/getPage.do',
        method: 'GET',
        data,
    });
}

// 项目联络单详情
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

// 项目联络单新增
export function fetchSavePrjformMemberInfo(data: any) {
    return request({
        url: '/projectFormContact/insert.do',
        method: 'POST',
        data
    });
}

// 项目联络单修改
export function fetchUpdatePrjformMemberInfo(data: any) {
    return request({
        url: '/projectFormContact/update.do',
        method: 'PUT',
        data
    });
}

// 项目联络单删除
export function fetchDeletePrjformMemberInfo(id: number | string) {
    return request({
        url: `/projectFormContact/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
