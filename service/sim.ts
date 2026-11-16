import request from '@/utils/request';
/**
 * 构建查询参数字符串（兼容旧版安卓）
 */
function buildQueryParams(params: Record<string, any>): string {
    const parts: string[] = [];
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            parts.push(key + '=' + encodeURIComponent(String(params[key])));
        }
    }
    return parts.length > 0 ? '?' + parts.join('&') : '';
}

/**
 * 电信卡设备在线通知
 */
export function fetchGetTelecomDeviceOnlineNotice(data:{
  iccid?: string,
  imsi?: string,
  msisdn?: string,
  upAreaCode: string,
  upTime: string,
}) {
    return request({
        url: '/telecom/deviceOnline.do',
        method: 'post',
        data
    })
}
/**
 *设备在线通知记录分页查询 
 */
export function fetchGetTelecomDeviceOnlineNoticePage(params:{
  page: number,
  limit: number,
  fuzzy?: string,
}) {
    return request({
        url: `/telecom/getPage.do${buildQueryParams(params)}`,
        method: 'get'
    })  
}
/**
 * 按照流水号查询订单
 */
export function fetchGetTelecomOrderInfoBySerialNumber(params:{
  id: string,
}) {
    return request({
        url: `/telecom/queryOrder.do${buildQueryParams(params)}`,
        method: 'get'
    })
}