// 查询项目分组
import request from '@/utils/request';

// 查询项目分组列表
export function fetchGetProjectTeamDataList(data?: any) {
    return request({
        url: '/projectTeam/getPage.do',
        method: 'GET',
        data,
    });
}

// 查询项目分组信息
export function fetchGetProjectTeamInfo(data?: any) {
    return request({
        url: '/projectTeam/getById.do',
        method: 'GET',
        data,
    });
}

// 新增项目分组信息
export function fetchSaveProjectTeamInfo(data?: any) {
    return request({
        url: '/projectTeam/insert.do',
        method: 'POST',
        data,
    });
}

// 修改项目分组信息
export function fetchUpdateProjectTeamInfo(data?: any) {
    return request({
        url: '/projectTeam/update.do',
        method: 'PUT',
        data,
    });
}

// 删除项目分组
export function fetchDeleteProjectTeamInfo(id: number | string) {
    return request({
        url: `/projectTeam/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
