// 项目总结评论
import request from '@/utils/request';

// 项目总结评论查询
export function fetchGetPrjSummaryCommentList(data?: any) {
    return request({
        url: '/projectSummaryComment/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 项目总结评论查询详情
export function fetchGetPrjSummaryCommentInfo(id: number) {
    return request({
        url: '/projectSummaryComment/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目总结评论新增
export function fetchSavePrjSummaryCommentInfo(data?: any) {
    return request({
        url: '/projectSummaryComment/insert.do',
        method: 'POST',
        data,
    });
}

// 项目总结评论修改
export function fetchUpdatePrjSummaryCommentInfo(data?: any) {
    return request({
        url: '/projectSummaryComment/update.do',
        method: 'PUT',
        data,
    });
}

// 项目总结评论删除
export function fetchDeletePrjSummaryCommentInfo(id: number | string) {
    return request({
        url: `/projectSummaryComment/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}