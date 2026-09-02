// 调试业务
import request from '@/utils/request';

// 调试业务分页列表
export function fetchGetDebugBusinessDataList(data?: any) {
    return request({
        url: '/projectDebug/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 调试业务详情
export function fetchGetDebugBusinessInfo(id: number) {
    return request({
        url: '/projectDebug/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 调试业务新增
export function fetchSaveDebugBusinessInfo(data: any) {
    return request({
        url: '/projectDebug/insert.do',
        method: 'POST',
        data
    });
}

// 调试业务修改
export function fetchUpdateDebugBusinessInfo(data: any) {
    return request({
        url: '/projectDebug/update.do',
        method: 'PUT',
        data
    });
}

// 调试业务删除
export function fetchDeleteDebugBusinessInfo(id: number) {
    return request({
        url: `/projectDebug/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

// 我的待调试业务(我的待办)
export function fetchGetMyDebugBusinessInfo(data: any) {
    return request({
        url: '/projectDebug/selectTodoPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}