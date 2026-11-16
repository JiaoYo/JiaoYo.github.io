// 项目参与人信息
import request from '@/utils/request';

// 项目参与人信息查询
export function fetchGetProjectParticipantDataList(data?: any, showLoading = true) {
    return request({
        url: '/projectParticipant/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading
    });
}

// 项目参与人查询详情
export function fetchGetProjectParticipantInfo(id: number) {
    return request({
        url: '/projectParticipant/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目参与人新增
export function fetchSaveProjectParticipantInfo(data?: any) {
    return request({
        url: '/projectParticipant/insert.do',
        method: 'POST',
        data,
    });
}

// 项目参与人修改
export function fetchUpdateProjectParticipantInfo(data?: any) {
    return request({
        url: '/projectParticipant/update.do',
        method: 'PUT',
        data,
    });
}

// 项目参与人删除
export function fetchDeleteProjectParticipantInfo(id: number | string) {
    return request({
        url: `/projectParticipant/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}