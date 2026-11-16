// 项目日报与项目id关联
import request from '@/utils/request';

// 项目日报与项目id关联分页列表
export function fetchGetPrjDialyDataList(data?: any) {
    return request({
        url: '/projectDaily/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 项目日报与项目id关联详情
export function fetchGetPrjDialyInfo(id: number) {
    return request({
        url: '/projectDaily/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目日报与项目id关联新增
export function fetchSavePrjDialyInfo(data: any) {
    return request({
        url: '/projectDaily/insert.do',
        method: 'POST',
        data
    });
}

// 项目日报与项目id关联修改
export function fetchUpdatePrjDialyInfo(data: any) {
    return request({
        url: '/projectDaily/update.do',
        method: 'PUT',
        data
    });
}

// 项目日报与项目id关联删除
export function fetchDeletePrjDialyInfo(id: number | string) {
    return request({
        url: `/projectDaily/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
