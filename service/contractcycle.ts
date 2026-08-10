// 调试周期
import request from '@/utils/request';

// 项目周期分页列表
export function fetchGetPrjCycleDataList(data?: any) {
    return request({
        url: '/projectLifecycle/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 项目周期详情
export function fetchGetPrjCycleInfo(id: number | string) {
    return request({
        url: '/projectLifecycle/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 根据uuid获取项目新增的id
export function fetchGetPrjCycleIdInfoByuuid(uuid: string) {
    return request({
        url: '/projectLifecycle/getByUuid.do',
        method: 'GET',
        data: {
            uuid,
            _t: new Date().getTime(),
        },
    });
}

// 项目周期新增
export function fetchSavePrjCycleInfo(data: any) {
    return request({
        url: '/projectLifecycle/insert.do',
        method: 'POST',
        data
    });
}

// 项目周期修改
export function fetchUpdatePrjCycleInfo(data: any) {
    return request({
        url: '/projectLifecycle/update.do',
        method: 'PUT',
        data
    });
}

// 项目周期删除
export function fetchDeletePrjCycleInfo(id: number | string) {
    return request({
        url: `/projectLifecycle/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
