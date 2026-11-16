
import request from '@/utils/request';

/**
 * 调度表
 */
export function fetchDispatchList(params: any) {
    return request<any>({
        url: '/projectDispatch/getPage.do',
        method: 'get',
        data:params
    });
}
/**
 * 查询调度详情
 */
export function fetchMainStationContact(params: any) {
    return request({
        url: '/projectDispatch/getDconById.do',
        method: 'get',
        data:params
    });
}
// 新增调度表(单个返回ID)
export function fetchOneAddDispatch(data:any) {
    return request({
        url: '/projectDispatch/insertOne.do',
        method: 'post',
        data
    });
}
// 编辑调度表
export function fetchEditDispatch(data: any) {
    return request({
        url: '/projectDispatch/update.do',
        method: 'put',
        data
    })
}
// 删除调度表
export function fetchDeleteDispatch(id: number | string) {
    return request({
        url: `/projectDispatch/delete.do?arrIds=${id}`,
        method: 'DELETE'
    });
}
// 查询省份
export function fetchProvinceList() {
    return request({
        url: '/projectDispatch/getProvinces.do',
        method: 'get',
    });
}

// 查询城市
export function fetchCityList(params: any) {
    return request({
        url: '/projectDispatch/getRegion.do',
        method: 'get',
        data: params
    });
}



/**
 * 调度表副表联系方式
 */
export function fetchDispatchContactList(params: any) {
    return request({
        url: '/projectDispatchSub/getPage.do',
        method: 'get',
        data: params
    });
}

/**
 * 新增调度表副表联系方式
 */
export function fetchAddDispatchContact(data: any) {
    return request({
        url: '/projectDispatchSub/insert.do',
        method: 'post',
        data
    });
}
/**
 * 修改调度表副表联系方式
 */
export function fetchEditDispatchContact(data: any) {
    return request({
        url: '/projectDispatchSub/update.do',
        method: 'put',
        data
    })
}
/**
 * 删除调度表副表联系方式
 */
export function fetchDeleteDispatchContact(id: number | string) {
    return request({
        url: `/projectDispatchSub/delete.do?arrIds=${id}`,
        method: 'DELETE'
    });
}
// 发送联系方式查询手机验证码
export function fetchSendCode() {
    return request({
        url: '/projectDispatchSub/sendContactVerificationCode.do',
        method: 'post',
    });
}
/**
 * 获取微信二维码
 */
export function fetchGetWechatCode() {
    return request({
        url: '/projectDispatchSub/getWeChatVerificationUrl.do',
        method: 'get',
    });
}
/**
 * 查询微信二维码状态
 */
export function fetchGetWechatCodeStatus(params: any) {
    return request({
        url: '/projectDispatchSub/getWeChatVerificationStatus.do',
        method: 'get',
        data: params
    });
}

/**
 * 明文联系方式查询
 */
export function fetchDispatchContactDecrypt(params: any) {
    return request({
        url: '/projectDispatchSub/getContactInformationById.do',
        method: 'get',
        data: params
    });
}

// 项目绑定调度
export function fetchProjectBindDispatch(data: any) {
    return request({
        url: '/projectDispatchContact/insert.do',
        method: 'post',
        data
    });
}

/**
 * 查询项目调度
 */
export function fetchProjectDispatchList(params: any) {
    return request<any>({
        url: '/projectDispatchContact/getPage.do',
        method: 'get',
        data: params
    });
}
// 删除项目调度
export function fetchDeleteProjectDispatch(id: number | string) {
    return request({
        url: `/projectDispatchContact/delete.do?arrIds=${id}`,
        method: 'DELETE'
    });
}
