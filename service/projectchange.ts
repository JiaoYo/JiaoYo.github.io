// 项目变更
import request from '@/utils/request';

// 项目变更分页列表
export function fetchGetProjectChangeDataList(data?: any) {
    return request({
        url: '/projectChange/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 项目变更新增
export function fetchSaveProjectchangeInfo(data: any) {
    return request({
        url: '/projectChange/insert.do',
        method: 'POST',
        data
    });
}

// 项目变更修改
export function fetchUpdateProjectchangeInfo(data: any) {
    return request({
        url: '/projectChange/update.do',
        method: 'PUT',
        data
    });
}

// 项目变更删除
export function fetchDeleteProjectchangeInfo(id: number | string) {
    return request({
        url: `/projectChange/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
