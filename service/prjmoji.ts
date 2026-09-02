// 墨迹天气
import request from '@/utils/request';

// 墨迹天气分页列表
export function fetchGetPrjmojiDataList(data?: any) {
    return request({
        url: '/projectMoji/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 墨迹天气详情
export function fetchGetPrjmojiInfo(id: number | string) {
    return request({
        url: '/projectMoji/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 墨迹天气新增
export function fetchSavePrjmojiInfo(data: any) {
    return request({
        url: '/projectMoji/insert.do',
        method: 'POST',
        data
    });
}

// 墨迹天气修改
export function fetchUpdatePrjmojiInfo(data: any) {
    return request({
        url: '/projectMoji/update.do',
        method: 'PUT',
        data
    });
}

// 墨迹天气删除
export function fetchDeletePrjmojiInfo(id: number | string) {
    return request({
        url: `/projectMoji/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
