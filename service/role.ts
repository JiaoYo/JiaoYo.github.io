import request from '@/utils/request';

export function fetchGetRoleDataList(data?: any) {
    return request({
        url: '/sys/role/page.do',
        method: 'GET',
        data,
    });
}

export function fetchDeleteRoleInfo(id: number | string) {
    return request({
        url: '/sys/role/delete.do',
        method: 'GET',
        data: {
            ids: id
        }
    });
}
