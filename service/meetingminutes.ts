
// 会议纪要
import request from '@/utils/request';

// 会议纪要分页列表
export function fetchGetMeetingMinutesDataList(data?: any) {
    return request({
        url: '/projectMeeting/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 会议纪要详情
export function fetchGetMeetingMinutesInfo(id: number | string) {
    return request({
        url: '/projectMeeting/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 会议纪要新增
export function fetchSaveMeetingMinutesInfo(data: any) {
    return request({
        url: '/projectMeeting/insert.do',
        method: 'POST',
        data
    });
}

// 会议纪要修改
export function fetchUpdateMeetingMinutesInfo(data: any) {
    return request({
        url: '/projectMeeting/update.do',
        method: 'PUT',
        data
    });
}

// 会议纪要删除
export function fetchDeleteMeetingMinutesInfo(id: number | string) {
    return request({
        url: `/projectMeeting/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
