// 网安产品
import request from '@/utils/request';

// 网安产品分页查询（fuzzy 模糊查询产品名称）
export function fetchGetNetworkSecurityProductDataListByPage(data?: any) {
    return request({
        url: '/networkSecurityProduct/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 网安加固记录分页查询（pid 网安产品id，fuzzy 模糊查询）
export function fetchGetNetworkSecurityHardeningRecordDataListByPage(data?: any) {
    return request({
        url: '/networkSecurityHardeningRecord/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}
