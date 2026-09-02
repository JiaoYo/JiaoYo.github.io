// 调度联系人
import request from '@/utils/request';

// 获取省份
export function fetchGetProvinceInfo() {
    return request({
        url: '/projectDispatch/getProvinces.do',
        method: 'GET',
        data: {
            _t: new Date().getTime(),
        },
        header: {},
        showLoading: false
    });
}

// 获取市信息
export function fetchGetCityInfo(data: any) {
    return request({
        url: '/projectDispatch/getRegion.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    })
}

// 调度联系人查询
export function fetchGetPrjDispatchDataList(data?: any) {
    return request({
        url: '/projectDispatch/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 调度联系人详情
export function fetchGetPrjDispatchInfo(id: number | string) {
    return request({
        url: '/projectDispatch/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 查看调度联系人手机号码
export function fetchGetPhoneNumberInfo(data?: any) {
    return request({
        url: '/projectDispatch/getDconById.do',
        method: 'GET',
        data,
    });
}

// 调度联系人新增
export function fetchSavePrjDispatchInfo(data?: any) {
    return request({
        url: '/projectDispatch/insert.do',
        method: 'POST',
        data,
    });
}

// 调度联系人修改
export function fetchUpdatePrjDispatchInfo(data?: any) {
    return request({
        url: '/projectDispatch/update.do',
        method: 'PUT',
        data,
    });
}

// 调度联系人删除
export function fetchDeletePrjDispatchInfo(id: number | string) {
    return request({
        url: `/projectDispatch/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}