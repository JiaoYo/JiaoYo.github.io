// export const BASE_URL = 'http://172.20.1.104:18905/project'; // 可根据平台设置不同 baseURL
// export const WS_URL = 'ws://172.20.1.104:18905/project';
// #ifdef H5
// 浏览器直连后端会有 CORS（后端 Spring CORS 白名单未登记 localhost 来源，请求直接报 CORS error）：
// 开发态走 vite 同源代理（vite.config.ts server.proxy，^/project(?!Pages) → 172.20.1.104:18905，转发前剥 Origin/Referer）
// 发行态 H5 保持线上域名直连（后端已放行 18443 页面来源）
export const BASE_URL = import.meta.env.DEV ? '/project' : 'https://pms.linkqi.cn:18905/project';
export const WS_URL = import.meta.env.DEV ? 'ws://' + location.host + '/project' : 'wss://pms.linkqi.cn:18905/project';
// #endif
// #ifndef H5
export const BASE_URL = 'https://pms.linkqi.cn:18905/project'; // 可根据平台设置不同 baseURL
export const WS_URL = 'wss://pms.linkqi.cn:18905/project';
// #endif
export const WEB_URL = 'https://pms.linkqi.cn:18443';
export const QINIU_URL = 'https://pictures.linkqi.cn/';
export const QINIU_UPLOAD_URL = 'https://up-z2.qiniup.com';

let isRelogin = false;

// 全局 loading 计数器：并发请求只显示一次、最后一个完成后才隐藏，避免 loading 闪烁
let loadingCount = 0;
let loadingTimer: any = null;
let loadingShown = false;
const LOADING_DELAY = 200;

// 请求开始：计数 +1，延迟 LOADING_DELAY 后才真正显示，快速请求不闪 loading
function openLoading() {
    loadingCount++;
    if (loadingTimer || loadingShown) return;
    loadingTimer = setTimeout(() => {
        loadingTimer = null;
        if (loadingCount > 0) {
            uni.showLoading({ title: '加载中...' });
            loadingShown = true;
        }
    }, LOADING_DELAY);
}

// 请求结束：计数 -1，全部结束后才隐藏
function closeLoading() {
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) {
        if (loadingTimer) {
            clearTimeout(loadingTimer);
            loadingTimer = null;
        } else if (loadingShown) {
            uni.hideLoading();
            loadingShown = false;
        }
    }
}

// 强制清空（如 401 触发重登）
function clearLoading() {
    if (loadingTimer) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
    }
    loadingCount = 0;
    if (loadingShown) {
        uni.hideLoading();
        loadingShown = false;
    }
}

interface RequestOptions {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    header?: any;
    showLoading?: boolean;
    /** 跳过统一错误 toast，把完整响应体抛给调用方自行处理（如报销日期冲突确认） */
    silentError?: boolean;
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
    const { url, method = 'GET', data = {}, header = {}, showLoading = true, silentError = false } = options;

    const cleanedData = (url === '/aftermarketComp/update.do' || url === '/aftermarket/update.do' || url.includes('/aftermarketComp/insert.do') || url.includes('/aftermarket/insert.do')) ? data : cleanData(data); // 清理空值参数

    if (showLoading) {
        openLoading();
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
                                clearLoading();
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
                            if (silentError) {
                                reject(res.data);
                                return;
                            }
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
                    closeLoading();
                }
            },
        });
    });
}

export default request;
