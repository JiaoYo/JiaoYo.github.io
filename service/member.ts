// 查询用户
import request from '@/utils/request';

// 查询用户列表
export function fetchGetUserDataList(data?: any) {
    return request({
        url: '/user/getPage.do',
        method: 'GET',
        data,
    });
}

// 查询用户列表(根据usertypes)
export function fetchGetAllUserDataList(data?: any) {
    return request({
        url: '/user/getList.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    });
}

// 删除用户
export function fetchDeleteUserInfo(id: number | string) {
    return request({
        url: `/user/delete.do?ids=${id}`,
        method: 'GET',
    });
}
