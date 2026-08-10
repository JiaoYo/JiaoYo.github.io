// 项目联系人
import request from '@/utils/request';

// 项目联系人分页列表
export function fetchGetPrjMemberDataList(data?: any) {
    return request({
        url: '/projectContact/getPage.do',
        method: 'GET',
        data,
    });
}

// 项目联系人详情
export function fetchGetPrjMemberInfo(id: number | string) {
    return request({
        url: '/projectContact/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目联系人新增
export function fetchSavePrjMemberInfo(data: any) {
    return request({
        url: '/projectContact/insert.do',
        method: 'POST',
        data
    });
}

// 项目联系人修改
export function fetchUpdatePrjMemberInfo(data: any) {
    return request({
        url: '/projectContact/update.do',
        method: 'PUT',
        data
    });
}

// 项目联系人删除
export function fetchDeletePrjMemberInfo(id: number | string) {
    return request({
        url: `/projectContact/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
