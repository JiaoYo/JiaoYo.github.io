// 项目周报评论
import request from '@/utils/request';

// 项目周报评论查询
export function fetchGetPrjWeekCommentList(data?: any) {
    return request({
        url: '/projectWeekComment/getPage.do',
        method: 'GET',
        data,
    });
}

// 项目周报评论查询详情
export function fetchGetPrjWeekCommentInfo(id: number) {
    return request({
        url: '/projectWeekComment/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目周报评论新增
export function fetchSavePrjWeekCommentInfo(data?: any) {
    return request({
        url: '/projectWeekComment/insert.do',
        method: 'POST',
        data,
    });
}

// 项目周报评论修改
export function fetchUpdatePrjWeekCommentInfo(data?: any) {
    return request({
        url: '/projectWeekComment/update.do',
        method: 'PUT',
        data,
    });
}

// 项目周报评论删除
export function fetchDeletePrjWeekCommentInfo(id: number | string) {
    return request({
        url: `/projectWeekComment/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}