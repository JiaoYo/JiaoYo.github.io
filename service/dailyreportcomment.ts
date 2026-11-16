// 日报评论
import request from '@/utils/request';

// 日报评论分页列表
export function fetchGetDialyCommentDataList(data?: any) {
    return request({
        url: '/projectComment/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 日报评论详情
export function fetchGetDialyCommentInfo(id: number) {
    return request({
        url: '/projectComment/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 日报评论新增
export function fetchSaveDialyCommentInfo(data: any) {
    return request({
        url: '/projectComment/insert.do',
        method: 'POST',
        data
    });
}

// 日报评论修改
export function fetchUpdateDialyCommentInfo(data: any) {
    return request({
        url: '/projectComment/update.do',
        method: 'PUT',
        data
    });
}

// 日报评论删除
export function fetchDeleteDialyCommentInfo(id: number | string) {
    return request({
        url: `/projectComment/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
