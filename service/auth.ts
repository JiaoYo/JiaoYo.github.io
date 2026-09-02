import request from '@/utils/request';
import { getUUID, doSM2Sign, base64ToHex } from "@/utils/index";

// 登录
export function login(data: any) {
    return request({
        url: '/login',
        method: 'POST',
        data,
    });
}

// 获取当前用户信息
export function fetchGetUserInfo() {
    return request({
        url: '/user/get.do',
        method: 'GET',
        data: {
            _t: new Date().getTime(),
        },
        header: {},
        showLoading: false
    });
}

// 获取当前用户信息(带有微信信息)
export function fetchGetUserInfoWithWechat() {
    return request({
        url: '/user/getCurUser.do',
        method: 'GET',
        data: {
            _t: new Date().getTime(),
        },
        header: {},
        showLoading: false
    });
}

// 获取当前用户信息
export function fetchGetUserInfoById(id: number) {
    return request({
        url: '/user/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        }
    });
}

// 修改用户头像
export function fetchUpdateUserImageInfo(data: any) {
    return request({
        url: '/user/updateImage.do',
        method: 'POST',
        data,
        header: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });
}

// 新增用户头像
export function fetchSaveUserInfo(data: any) {
    return request({
        url: '/user/insert.do',
        method: 'POST',
        data
    });
}

// 修改用户基本信息
export function fetchUpdateUserInfo(data: any) {
    return request({
        url: '/user/update.do',
        method: 'POST',
        data,
    });
}

// 修改密码
export function fetchUpdateUserPasswordInfo(data: any) {
    return request({
        url: '/user/updateExpirePwd.do',
        method: 'POST',
        data
    });
}

// 登出
export function logout() {
    return request({
        url: '/logout',
        method: 'POST',
    });
}

// 获取手机验证码
export function fetchGetPhoneNumberCodeInfo(data: any) {
    const timestamp = Date.now();
    const nonce = getUUID();
    const se = doSM2Sign(`${nonce}${timestamp}${data.phoneNumber}`);
    const signature = base64ToHex(se);
    return request({
        url: '/sendMessageLogin.do',
        method: 'POST',
        data,
        header: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'signature': signature,
            'timestamp': timestamp,
            'nonce': nonce
        },
        showLoading: false
    });
}

// 手机验证码登录
export function fetchPhoneNumberCodeLoginInfo(data: any) {
    const timestamp = Date.now();
    const nonce = getUUID();
    const se = doSM2Sign(`${nonce}${timestamp}${data.phnum}${data.code}`);
    const signature = base64ToHex(se);
    return request({
        url: '/captchaLogin.do',
        method: 'POST',
        data,
        header: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'signature': signature,
            'timestamp': timestamp,
            'nonce': nonce
        }
    });
}

// 获取二维码URL(微信)
export function fetchGetQrcodeUrlInfo() {
    return request({
        url: '/wechat/getCodeUrl.do',
        method: 'GET',
        data: {
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    });
}

// 微信扫码登录(微信)
export function fetchQrcodeLoginInfo(data: any) {
    return request({
        url: '/wechat/blindUser.do',
        method: 'POST',
        data
    });
}

// 解绑微信
export function fetchUnbindwechatInfo(data: any) {
    return request({
        url: '/user/deleteWeChat.do',
        method: 'GET',
		data
    });
}