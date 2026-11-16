// 项目联络单调试业务
import request from '@/utils/request';

// 项目联络单调试业务分页列表
export function fetchGetPrjformDebugBusinessDataList(data?: any) {
    return request({
        url: '/projectFormDebug/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 项目联络单调试业务详情
export function fetchGetPrjformDebugBusinessInfo(id: number) {
    return request({
        url: '/projectFormDebug/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目联络单调试业务新增
export function fetchSavePrjformDebugBusinessInfo(data: any) {
    return request({
        url: '/projectFormDebug/insert.do',
        method: 'POST',
        data
    });
}

// 项目联络单调试业务修改
export function fetchUpdatePrjformDebugBusinessInfo(data: any) {
    return request({
        url: '/projectFormDebug/update.do',
        method: 'PUT',
        data
    });
}

// 项目联络单调试业务删除
export function fetchDeletePrjformDebugBusinessInfo(id: number, pid: number) {
    return request({
        url: `/projectFormDebug/delete.do?arrIds=${id}&pid=${pid}`,
        method: 'DELETE',
    });
}