// 项目日报
import request from '@/utils/request';

// 项目日报查询
export function fetchGetPrjdailyreportList(data?: any) {
    return request({
        url: '/projectDailyReport/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 项目日报查询详情
export function fetchGetPrjdailyreportInfo(id: number) {
    return request({
        url: '/projectDailyReport/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目日报uuid查询当前id
export function fetchGetPrjdailyreportDetailInfo(uuid: string) {
    return request({
        url: '/projectDailyReport/getIdByUuid.do',
        method: 'GET',
        data: {
            uuid,
            _t: new Date().getTime()
        }
    });
}

// 项目日报新增
export function fetchSavePrjdailyreportInfo(data?: any) {
    return request({
        url: '/projectDailyReport/insert.do',
        method: 'POST',
        data,
    });
}

// 项目日报修改
export function fetchUpdatePrjdailyreportInfo(data?: any) {
    return request({
        url: '/projectDailyReport/update.do',
        method: 'PUT',
        data,
    });
}

// 项目日报删除
export function fetchDeletePrjdailyreportInfo(id: number | string) {
    return request({
        url: `/projectDailyReport/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}