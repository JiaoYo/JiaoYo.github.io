// export const BASE_URL = 'http://172.20.1.104:18905/project'; // 可根据平台设置不同 baseURL
// export const WS_URL = 'ws://172.20.1.104:18905/project';
export const BASE_URL = 'https://pms.linkqi.cn:18905/project';
export const WS_URL = 'wss://pms.linkqi.cn:18905/project';
export const WEB_URL = 'https://pms.linkqi.cn:18443';
export const QINIU_URL = 'https://pictures.linkqi.cn/';
export const QINIU_UPLOAD_URL = 'https://up-z2.qiniup.com';

let isRelogin = false;

interface RequestOptions {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    header?: any;
    showLoading?: boolean;
    responseType?: any
}

function cleanData<T>(data: T): T {
    if (Array.isArray(data)) {
        // 处理数组：清理每个元素，并过滤空项
        return data
            .map(item => cleanData(item))
            .filter(item => {
                if (item === undefined || item === null || item === '') return false;
                if (typeof item === 'object' && Object.keys(item).length === 0) return false;
                return true;
            }) as T;
    } else if (typeof data === 'object' && data !== null) {
        // 处理对象：递归清理每个字段
        const result: Record<string, any> = {};
        Object.entries(data).forEach(([key, value]) => {
            const cleaned = cleanData(value);
            if (
                cleaned !== undefined &&
                cleaned !== null &&
                cleaned !== '' &&
                !(typeof cleaned === 'object' && Object.keys(cleaned).length === 0)
            ) {
                result[key] = cleaned;
            }
        });
        return result as T;
    } else {
        // 原始值直接返回
        return data;
    }
}

function request(options: RequestOptions): Promise<any> {
    const { url, method = 'GET', data = {}, header = {}, showLoading = true } = options;

    const cleanedData = (url === '/aftermarketComp/update.do' || url === '/aftermarket/update.do' || url.includes('/aftermarketComp/insert.do') || url.includes('/aftermarket/insert.do')) ? data : cleanData(data); // 清理空值参数

    if (showLoading) {
        uni.showLoading({ title: '加载中...' });
    }

    return new Promise((resolve, reject) => {
        uni.request({
            url: BASE_URL + url,
            method,
            data: cleanedData,
            header: {
                'Content-Type': 'application/json',
                token: uni.getStorageSync('token'),
                ...header,
            },
            timeout: 180000,
            success: (res: any) => {
                if (res.statusCode === 200) {
                    if (Object.prototype.hasOwnProperty.call(res.data, 'code')) {
                        if (res.data.code === 0) {
                            resolve(res.data.data);
                        } else if (res.data.code === 401) {
                            if (showLoading) {
                                uni.hideLoading();
                            }
							
							// 已经在跳登录了，直接拦掉
							if (isRelogin) return;
							isRelogin = true;
                            uni.removeStorageSync('userId');
                            uni.removeStorageSync('token');
                            uni.removeStorageSync('usertype');
                            uni.removeStorageSync('permissionList');
                            uni.$emit('user-logout');
                            uni.reLaunch({
                                url: '/pages/login',
								complete: () => {
									setTimeout(() => {
										isRelogin = false;
									}, 500);
								}
                            });
                        } else {
                            if (!url.includes('/projectClockin/insert.do')) {
                                uni.showToast({ title: res.data.data || res.data.msg || '请求出错', icon: 'none' });
                            } else {
                                if (cleanedData && Array.isArray(cleanedData) && cleanedData.length > 0 && cleanedData[0].hasOwnProperty('ctype') && cleanedData[0].ctype === 2) {

                                } else {
                                    uni.showToast({ title: res.data.data || res.data.msg || '请求出错', icon: 'none' });
                                }
                            }
                            reject(res.data.data || res.data.msg);
                        }
                    } else {
                        resolve(res.data);
                    }
                } else {
                    if (!url.includes('/projectClockin/insert.do')) {
                        uni.showToast({ title: res.data.data || res.data.msg || '请求出错', icon: 'none' });
                    } else {
                        if (cleanedData && Array.isArray(cleanedData) && cleanedData.length > 0 && cleanedData[0].hasOwnProperty('ctype') && cleanedData[0].ctype === 2) {

                        } else {
                            uni.showToast({ title: res.data.data || res.data.msg || '请求出错', icon: 'none' });
                        }
                    }
                    reject(res);
                }
            },
            fail: (err) => {
                if (!url.includes('/projectClockin/insert.do')) {
                    uni.showToast({ title: err.errMsg || '网络错误', icon: 'none' });
                } else {
                    if (cleanedData && Array.isArray(cleanedData) && cleanedData.length > 0 && cleanedData[0].hasOwnProperty('ctype') && cleanedData[0].ctype === 2) {

                    } else {
                        uni.showToast({ title: err.errMsg || '网络错误', icon: 'none' });
                    }
                }
                reject(err);
            },
            complete: () => {
                if (showLoading) {
                    uni.hideLoading();
                }
            },
        });
    });
}

export default request;
