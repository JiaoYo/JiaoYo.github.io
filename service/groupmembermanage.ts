// 查询项目分组
import request from '@/utils/request';

// 查询项目分组列表
export function fetchGetProjectTeamMemBerDataList(data?: any) {
    return request({
        url: '/projectTeamMemBer/getPage.do',
        method: 'GET',
        data,
    });
}

// 查询项目分组信息
export function fetchGetProjectTeamMemBerInfo(data?: any) {
    return request({
        url: '/projectTeamMemBer/getById.do',
        method: 'GET',
        data,
    });
}

// 新增项目分组信息
export function fetchSaveProjectTeamMemBerInfo(data?: any) {
    return request({
        url: '/projectTeamMemBer/insert.do',
        method: 'POST',
        data,
    });
}

// 修改项目分组信息
export function fetchUpdateProjectTeamMemBerInfo(data?: any) {
    return request({
        url: '/projectTeamMemBer/update.do',
        method: 'PUT',
        data,
    });
}

// 删除项目分组
export function fetchDeleteProjectTeamMemBerInfo(id: number | string) {
    return request({
        url: `/projectTeamMemBer/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
