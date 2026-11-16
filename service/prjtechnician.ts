// 调试工程师
import request from '@/utils/request';

// 调试工程师查询
export function fetchGetPrjTechnicianDataList(data: any) {
    return request({
        url: '/projectTechnician/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 调试工程师查询详情
export function fetchGetPrjTechnicianDetailInfo(id: number | string) {
    return request({
        url: '/projectTechnician/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}


// 调试工程师新增
export function fetchSavePrjTechnicianInfo(data?: any) {
    return request({
        url: '/projectTechnician/insert.do',
        method: 'POST',
        data,
    });
}

// 调试工程师修改
export function fetchUpdatePrjTechnicianInfo(data?: any) {
    return request({
        url: '/projectTechnician/update.do',
        method: 'PUT',
        data,
    });
}

// 调试工程师删除
export function fetchDeletePrjTechnicianInfo(id: number | string) {
    return request({
        url: `/projectTechnician/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
