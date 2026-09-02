// @ts-ignore
import { sm2 } from 'sm-crypto';
import { globalData } from './global';

let publicKey: any = {
    "publicKey": "0406c9f361efe92e051c7aa0528326f92a64043e3ceade7cf7129bc9d6a4cf13609319ce731c7d7803540aa9261b4f04ad7ed7139459fa8cac22b91285b681424f",
    "privateKey": "9b68559acec3c26a48d99667d40e136a6506e22d5668880916c62fd7084d9951"
};

/**
 * 获取uuid
 * @returns
 */
export function getUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 获取url中的参数
 * @param path 完整路径
 * @returns
 */
export function getUrlParams(path: string) {
    const params: Record<string, string> = {};
    const pathArray: string[] = path.split('?'); // 路径根据？拆分为2部分
    let paramString: string = ''; // 参数字符串
    let paramArrary: string[] = []; // 参数数组
    if (pathArray.length > 1) {
        paramString = pathArray[1];
    }
    paramArrary = paramString.split('&');
    for (let index = 0; index < paramArrary.length; index++) {
        if (paramArrary[index].split('=').length === 2) {
            params[paramArrary[index].split('=')[0]] = paramArrary[index].split('=')[1];
        }
    }
    return params;
}

/**
 * 设置参数
 * @param path 路径（无参数）
 * @param params （参数）
 * @returns
 */
export function setUrlParams(path: string, params: Record<string, string>) {
    for (const key in params) {
        if (path.includes('?')) {
            path = `${path}&${key}=${params[key]}`;
        } else {
            path = `${path}?${key}=${params[key]}`;
        }
    }
    return path;
}

/**
 * 全量替换url中的字符
 * @param str 原始字符串
 * @param find 要查找的字符串
 * @param replace 要替换的字符串
 * @returns
 */
function replaceAll(str: string, find: string, replace: string) {
    return str.replace(new RegExp(find, 'g'), replace);
}

/**
 * 去除拼接url产生的多余的/
 * @param url 目标路径
 */
export function beautifyUrl(url: string) {
    url = replaceAll(url, '//', '/'); // 先替换所有'//'为'/'
    url = replaceAll(url, 'https:/', 'https://'); // 再将https补全'//'
    url = replaceAll(url, 'http:/', 'http://'); // 再将http补全'//'
    return url;
}
/**
 * url查询参数序列化
 * @param query url查询参数
 * @returns
 */
export function queryStringify(query: Record<string, string>) {
    const result: Record<string, string> = {};
    if (query) {
        for (const key in query) {
            let value: any = query[key];
            if (value === undefined) {
                value = '';
            }
            result[key] = value;
        }
    }
    return result;
}

/**
 * 判断query或params是否为空或者undefined
 * @param obj 待判断对象
 * @returns
 */
export function isEmptyObject(obj: undefined | null | Record<string, any>): boolean {
    return obj === undefined || obj === null || Object.keys(obj).length === 0;
}

/**
 * Get system date
 * @param param: number,
 * @param dateVal: string | number | null | undefined
 * @returns
 */
export function getSystemDate(param: number, dateVal?: string | number, offsetDays = 0) {
    const baseDate = dateVal ? new Date(dateVal) : new Date();
    // 加天
    baseDate.setDate(baseDate.getDate() + offsetDays);

    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const date = String(baseDate.getDate()).padStart(2, '0');
    const hours = String(baseDate.getHours()).padStart(2, '0');
    const minutes = String(baseDate.getMinutes()).padStart(2, '0');
    const seconds = String(baseDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(baseDate.getMilliseconds()).padStart(3, '0');

    switch (param) {
        case 0: return `${year}-${month}-${date}`;
        case 1: return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
        case 2: return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${milliseconds}`;
        case 3: return `${year}-${month}`;
        case 4: return year;
        case 5: return baseDate.getTime();
        case 6: return `${year}-${month}-${date} ${hours}:${minutes}`;
		case 7: return hours;
        default: return '';
    }
}

/**
 * 获取当前周周一到周日的日期（返回年月日字符串）
 * @param date 可选，指定日期，默认当天
 * @returns 包含周一到周日日期的字符串数组，格式：YYYY-MM-DD
 */
export function getCurrentWeekDates(date?: Date | number): string[] {
    let currentDate: Date;

    if (!date) {
        currentDate = new Date(); // 不传用当前时间
    } else if (typeof date === 'number') {
        currentDate = new Date(date); // 时间戳转Date
    } else {
        currentDate = date; // 已经是Date对象
    }

    const dayOfWeek = currentDate.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const monday = new Date(currentDate);

    // 计算周一的日期
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(currentDate.getDate() + diffToMonday);

    // 生成一周的日期（字符串格式）
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);

        // 格式化为 YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份补0
        const day = String(date.getDate()).padStart(2, '0'); // 日期补0

        weekDates.push(`${year}-${month}-${day}`);
    }

    return weekDates;
}

// sm2加密
export function doSM2Encrypt(str: string) {
    if (!str) return str
    const text = sm2.doEncrypt(str, publicKey.publicKey, 1);
    return '04' + text
}

// sm2生成签名
export function doSM2Sign(str: string) {
    try {
        if (!str) return str
        const signatureHex = sm2.doSignature(str, publicKey.privateKey, {
            hash: true,  // 使用 SM3 哈希
            der: true    // 输出 ASN.1 DER 格式
        });
        return signatureHex
    } catch (error) {
        console.error('sm2签名失败', error);
    }
}

// base64转16进制
export function base64ToHex(str: string) {
    try {
        // 将字符串转为 UTF-8 字节序列
        const utf8 = unescape(encodeURIComponent(str));

        let hexString = '';
        for (let i = 0; i < utf8.length; i++) {
            let hex = utf8.charCodeAt(i).toString(16);
            if (hex.length === 1) {
                hex = '0' + hex;
            }
            hexString += hex;
        }
        return hexString.toUpperCase();
    } catch (e) {
        console.error('base64ToHex 转换失败:', e);
        return '';
    }
}

/**
 * 计算两点之间的距离（单位：米）
 * 短距离精度更高，适合几公里内
 * @param lon1 第一个点经度
 * @param lat1 第一个点纬度
 * @param lon2 第二个点经度
 * @param lat2 第二个点纬度
 * @returns 距离（米）
 */
// export function getDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
//     const toRadians = (deg: number) => deg * Math.PI / 180;

//     const R = 6371000; // 地球平均半径，单位米
//     const φ1 = toRadians(lat1);
//     const φ2 = toRadians(lat2);
//     const Δφ = toRadians(lat2 - lat1);
//     const Δλ = toRadians(lon2 - lon1);

//     const a = Math.sin(Δφ / 2) ** 2 +
//               Math.cos(φ1) * Math.cos(φ2) *
//               Math.sin(Δλ / 2) ** 2;

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
// }

// WGS-84 椭球参数
// export function getPreciseDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
//     // WGS-84 椭球参数
//     const a = 6378137.0; // 长半轴
//     const f = 1 / 298.257223563; // 扁率
//     const b = a * (1 - f); // 短半轴

//     const toRadians = (deg: number) => deg * Math.PI / 180;

//     const φ1 = toRadians(lat1);
//     const φ2 = toRadians(lat2);
//     const L = toRadians(lon2 - lon1);

//     const U1 = Math.atan((1 - f) * Math.tan(φ1));
//     const U2 = Math.atan((1 - f) * Math.tan(φ2));

//     const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
//     const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

//     let λ = L;
//     let λPrev: number;
//     let iterLimit = 100;
//     let sinSigma: number, cosSigma: number, sigma: number;
//     let sinAlpha: number, cos2Alpha: number, cos2SigmaM: number;
//     let C: number;

//     do {
//         const sinλ = Math.sin(λ);
//         const cosλ = Math.cos(λ);
//         sinSigma = Math.sqrt(
//             (cosU2 * sinλ) ** 2 +
//             (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) ** 2
//         );
//         if (sinSigma === 0) return 0; // 同一点
//         cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
//         sigma = Math.atan2(sinSigma, cosSigma);
//         sinAlpha = cosU1 * cosU2 * sinλ / sinSigma;
//         cos2Alpha = 1 - sinAlpha ** 2;
//         cos2SigmaM = cos2Alpha !== 0 ? cosSigma - 2 * sinU1 * sinU2 / cos2Alpha : 0;
//         C = f / 16 * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
//         λPrev = λ;
//         λ = L + (1 - C) * f * sinAlpha * (
//             sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2))
//         );
//     } while (Math.abs(λ - λPrev) > 1e-12 && --iterLimit > 0);

//     const u2 = cos2Alpha * (a ** 2 - b ** 2) / (b ** 2);
//     const A = 1 + u2 / 16384 * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
//     const B = u2 / 1024 * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
//     const deltaSigma = B * sinSigma * (
//         cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
//         B / 6 * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2))
//     );

//     const s = b * A * (sigma - deltaSigma);

//     return s; // 米
// }

/**
 * GCJ-02（火星坐标）下的精确距离计算
 * 内部先转换为 WGS-84 再用 Vincenty 公式计算
 */
export function getPreciseDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
    // 🔹 GCJ-02 → WGS-84
    const [wgsLon1, wgsLat1] = gcj02ToWgs84(lon1, lat1);
    const [wgsLon2, wgsLat2] = gcj02ToWgs84(lon2, lat2);

    // WGS-84 椭球参数
    const a = 6378137.0; // 长半轴
    const f = 1 / 298.257223563; // 扁率
    const b = a * (1 - f); // 短半轴

    const toRadians = (deg: number) => deg * Math.PI / 180;

    const φ1 = toRadians(wgsLat1);
    const φ2 = toRadians(wgsLat2);
    const L = toRadians(wgsLon2 - wgsLon1);

    const U1 = Math.atan((1 - f) * Math.tan(φ1));
    const U2 = Math.atan((1 - f) * Math.tan(φ2));

    const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
    const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

    let λ = L;
    let λPrev: number;
    let iterLimit = 100;
    let sinSigma: number, cosSigma: number, sigma: number;
    let sinAlpha: number, cos2Alpha: number, cos2SigmaM: number;
    let C: number;

    do {
        const sinλ = Math.sin(λ);
        const cosλ = Math.cos(λ);
        sinSigma = Math.sqrt(
            (cosU2 * sinλ) ** 2 +
            (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) ** 2
        );
        if (sinSigma === 0) return 0; // 同一点
        cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
        sigma = Math.atan2(sinSigma, cosSigma);
        sinAlpha = cosU1 * cosU2 * sinλ / sinSigma;
        cos2Alpha = 1 - sinAlpha ** 2;
        cos2SigmaM = cos2Alpha !== 0 ? cosSigma - 2 * sinU1 * sinU2 / cos2Alpha : 0;
        C = f / 16 * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
        λPrev = λ;
        λ = L + (1 - C) * f * sinAlpha * (
            sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2))
        );
    } while (Math.abs(λ - λPrev) > 1e-12 && --iterLimit > 0);

    const u2 = cos2Alpha * (a ** 2 - b ** 2) / (b ** 2);
    const A = 1 + u2 / 16384 * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
    const B = u2 / 1024 * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
    const deltaSigma = B * sinSigma * (
        cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
            B / 6 * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2))
    );

    const s = b * A * (sigma - deltaSigma);
    return s; // 单位：米
}

/**
 * 🔹 GCJ-02 → WGS-84 坐标转换
 * @returns [lon, lat]
 */
function gcj02ToWgs84(lon: number, lat: number): [number, number] {
    if (outOfChina(lon, lat)) return [lon, lat];

    const d = delta(lon, lat);
    return [lon * 2 - (lon + d.lon), lat * 2 - (lat + d.lat)];
}

function delta(lon: number, lat: number) {
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    const dLat = transformLat(lon - 105.0, lat - 35.0);
    const dLon = transformLon(lon - 105.0, lat - 35.0);
    const radLat = lat / 180.0 * Math.PI;
    const magic = Math.sin(radLat);
    const magic2 = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic2);
    return {
        lon: (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI),
        lat: (dLat * 180.0) / ((a * (1 - ee)) / (magic2 * sqrtMagic) * Math.PI)
    };
}

function transformLat(x: number, y: number): number {
    return -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y +
        0.2 * Math.sqrt(Math.abs(x)) + (20.0 * Math.sin(6.0 * x * Math.PI)
            + 20.0 * Math.sin(2.0 * x * Math.PI)
            + 20.0 * Math.sin(y * Math.PI)
            + 40.0 * Math.sin(y / 3.0 * Math.PI)
            + 160.0 * Math.sin(y / 12.0 * Math.PI)
            + 320 * Math.sin(y * Math.PI / 30.0)) / 3.0;
}

function transformLon(x: number, y: number): number {
    return 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y +
        0.1 * Math.sqrt(Math.abs(x)) + (20.0 * Math.sin(6.0 * x * Math.PI)
            + 20.0 * Math.sin(2.0 * x * Math.PI)
            + 20.0 * Math.sin(x * Math.PI)
            + 40.0 * Math.sin(x / 3.0 * Math.PI)
            + 150.0 * Math.sin(x / 12.0 * Math.PI)
            + 300.0 * Math.sin(x / 30.0 * Math.PI)) / 3.0;
}

function outOfChina(lon: number, lat: number): boolean {
    return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

/**
 * 从 URL 中提取标准化扩展名（去掉 ?/#，支持 .tar.gz 等）
 * @param url 文件链接
 * @returns 扩展名（如 "xlsx", "pdf", "tar.gz", ""）
 */
export function getExtensionFromUrl(url: string): string {
    if (!url) return '';

    try {
        // 去除 query / hash
        const clean = url.split('#')[0].split('?')[0].trim();

        // 取最后一段文件名
        const filename = clean.replace(/\/+$/, '').split('/').pop() ?? '';

        if (!filename.includes('.')) return '';

        const lower = filename.toLowerCase();

        // 处理复合扩展名
        const compositeExts = ['tar.gz', 'tar.bz2', 'tar.xz', 'tgz', '.7z'];
        for (const comp of compositeExts) {
            if (lower.endsWith('.' + comp)) {
                return comp;
            }
        }

        // 普通扩展名
        const idx = lower.lastIndexOf('.');
        return idx === -1 ? '' : lower.slice(idx + 1);
    } catch {
        return '';
    }
}

// 下载单文件
export async function downloadFile(url: string, fileName: string | null) {
    // 获取文件名
    if (!fileName) {
        fileName = url.split('?')[1];
    }

    // #ifdef APP-PLUS
    // App 端下载文件
    const downloadTask = uni.downloadFile({
        url,
        success: (res) => {
            if (res.statusCode === 200) {
                uni.saveFile({
                    tempFilePath: res.tempFilePath,
                    success: (saveRes) => {
                        uni.showToast({ title: '下载成功', icon: 'success' });
                        console.log('文件保存在：', saveRes.savedFilePath);
                    },
                    fail: (err) => {
                        console.error('保存失败', err);
                        uni.showToast({ title: '保存失败', icon: 'none' });
                    },
                });
            } else {
                uni.showToast({ title: '下载失败', icon: 'none' });
            }
        },
        fail: (err) => {
            console.error('下载失败', err);
            uni.showToast({ title: '下载失败', icon: 'none' });
        },
    });
    // 可选监听下载进度
    downloadTask.onProgressUpdate((res) => {
        console.log('下载进度', res.progress);
    });
    // #endif

    // #ifdef H5
    // H5 端直接用 a 标签触发下载
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName || '未命名文件';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // 释放内存
    // #endif

    // #ifdef MP-WEIXIN
    // 微信小程序下载
    uni.downloadFile({
        url,
        success(res) {
            if (res.statusCode === 200) {
                wx.openDocument({
                    filePath: res.tempFilePath,
                    showMenu: true, // 可预览和保存
                    success: () => uni.showToast({ title: '打开成功' }),
                    fail: (err) => {
                        console.error(err);
                        uni.showToast({ title: '打开失败', icon: 'none' });
                    },
                });
            }
        },
    });
    // #endif
}

// 判断是否为图片
export function isImageUrl(url: string): boolean {
    return url ? url.includes("?") ? /\.(png|jpe?g|gif|bmp|webp|svg|tiff?|ico)$/i.test(url.split('?')[0]) : /\.(png|jpe?g|gif|bmp|webp|svg|tiff?|ico)$/i.test(url) : false;
}

// 保留指定位数（不四舍五入）
export function noRoundDivide(a: number, b: number, decimals = 0) {
    const val: any = (a / b) * 100
    if (decimals === 0) {
        return parseInt(val)
    } else {
        return parseInt((val * 10 ** decimals as any)) / 10 ** decimals
    }
}

// 获取省份的id
export function getProvinceIdByName(data: any, rawName: string) {
    if (!rawName) return null;

    // 去掉常见后缀
    const cleanedName = rawName
        .replace(/省|市|特别行政区|自治区|壮族|回族|维吾尔/g, '')
        .trim();

    // 模糊匹配（比如“广西壮族自治区” => “广西”）
    const target = data.find((item: any) => rawName.includes(item.name) || item.name.includes(cleanedName));

    return target ? target.id : null;
}

// 获取类型
export function getType(value: unknown): string {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

// 是否存在该权限
export function hasPermission(permission: string): boolean {
    let permissionList = globalData.permissionList.length > 0 ? globalData.permissionList : uni.getStorageSync('permissionList');
    return permissionList.indexOf(permission) !== -1;
}

// 毫秒值计算为分钟
export function secondsToMinutes(seconds: number, keepDecimal = false): number | string {
    const minutes = seconds / 1000 / 60;
    return keepDecimal ? minutes.toFixed(2) : Math.floor(minutes);
}

// 分钟计算为毫秒值
export function minutesToMilliseconds(minutes: number): number {
    return minutes * 60 * 1000;
};

// 提取所有指定 ptype 且 permissions 有值的权限字符串
export function extractPermissionsByPtype(data: any, targetPtype: number): string[] {
    const permissions: string[] = [];

    function extract(node: any): void {
		if (targetPtype === 0 && node.permissions !== 'project:reviewDebug:websocket') {
		    permissions.push(node.permissions);
		} else {
			if (node.ptype === targetPtype && node.permissions) {
			    permissions.push(node.permissions);
			}
		}

        if (node.children) {
            node.children.forEach(extract);
        }
    }

    data.forEach(extract);
    return permissions;
}

// 获取一批经纬度的中间点、自动根据点的分布范围选择算法
interface LatLng {
    lat: number;
    lng: number;
}

export function getCenterPoint(points: LatLng[]): LatLng | null {
    if (!points.length) return null;

    // 计算最大最小纬度差，判断是否跨区域（超过2度认为点较分散）
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const maxLatDiff = Math.max(...lats) - Math.min(...lats);
    const maxLngDiff = Math.max(...lngs) - Math.min(...lngs);

    // 若跨度较小（如城市内），使用简单平均
    if (maxLatDiff < 2 && maxLngDiff < 2) {
        return averageCenter(points);
    }

    // 否则使用球面平均（更精准）
    return sphericalCenter(points);
}

/**
 * 简单平均法（适用于点较近的情况）
 */
function averageCenter(points: LatLng[]): LatLng {
    const sum = points.reduce(
        (acc, { lat, lng }) => {
            acc.lat += lat;
            acc.lng += lng;
            return acc;
        },
        { lat: 0, lng: 0 }
    );

    return {
        lat: sum.lat / points.length,
        lng: sum.lng / points.length,
    };
}

/**
 * 球面平均法（适用于点分布较广）
 */
function sphericalCenter(points: LatLng[]): LatLng {
    let x = 0, y = 0, z = 0;

    for (const { lat, lng } of points) {
        const latRad = (lat * Math.PI) / 180;
        const lngRad = (lng * Math.PI) / 180;
        x += Math.cos(latRad) * Math.cos(lngRad);
        y += Math.cos(latRad) * Math.sin(lngRad);
        z += Math.sin(latRad);
    }

    const total = points.length;
    x /= total;
    y /= total;
    z /= total;

    const hyp = Math.sqrt(x * x + y * y);
    const centerLat = Math.atan2(z, hyp);
    const centerLng = Math.atan2(y, x);

    return {
        lat: (centerLat * 180) / Math.PI,
        lng: (centerLng * 180) / Math.PI,
    };
}

// 生成随机颜色
function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return `#${f(0).toString(16).padStart(2, '0')}${f(8)
        .toString(16)
        .padStart(2, '0')}${f(4).toString(16).padStart(2, '0')}`;
}

export function generateHexColors(length: number = 100): string[] {
    const colors: string[] = [];

    for (let i = 0; i < length; i++) {
        const hue = Math.round((360 / length) * i);
        colors.push(hslToHex(hue, 70, 60)); // 色相均匀分布
    }

    return colors;
}

/**
 * 支持的文件类型
 */
export type SupportedFileType = 'txt' | 'word' | 'excel' | 'pdf';

/**
 * 提取文件类型，只返回 txt、word、excel、pdf 四种，其它返回空字符串
 * @param url 文件链接或文件名
 * @returns 'txt' | 'word' | 'excel' | 'pdf' | ''
 */
export function getFileType(url: string): SupportedFileType | '' {
    if (!url) return '';

    try {
        const clean = url.split('#')[0].split('?')[0].trim();
        const filename = clean.replace(/\/+$/, '').split('/').pop() ?? '';
        if (!filename.includes('.')) return '';

        const ext = filename.toLowerCase().split('.').pop();

        const typeMap: Record<string, SupportedFileType> = {
            txt: 'txt',
            pdf: 'pdf',
            doc: 'word',
            docx: 'word',
            xls: 'excel',
            xlsx: 'excel',
            csv: 'excel',
        };

        return typeMap[ext!] || '';
    } catch {
        return '';
    }
}

/**
 * 判断是否为支持的文件类型（txt、word、excel、pdf）
 * @param url 文件链接或文件名
 * @returns true / false
 */
export function isSupportedFileType(url: string): boolean {
    if (!url) return false;

    try {
        const clean = url.split('#')[0].split('?')[0].trim();
        const filename = clean.replace(/\/+$/, '').split('/').pop() ?? '';
        if (!filename.includes('.')) return false;

        const ext = filename.toLowerCase().split('.').pop();

        const supported = ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'];
        return supported.includes(ext!);
    } catch {
        return false;
    }
}

/**
 * 手机号脱敏，例如 13812345678 → 138****5678
 * @param phone 手机号字符串
 * @returns 脱敏后的手机号
 */
export function maskPhone(phone: string): string {
    if (!/^1\d{10}$/.test(phone)) {
        // 不是标准 11 位手机号，直接返回原值
        return phone;
    }
    return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

export function transformData(dataObj: any) {
    const resultObj: any = {};

	Object.keys(dataObj).forEach(username => {
		const recordsList = dataObj[username];
		const formatted = formatRecords(recordsList);
		resultObj[username] = formatted;
	});

	return resultObj;
}

// ====== 原始 formatRecords 函数保持不变 ======
export function formatRecords(recordsList: any) {
	const result: any = [];
	if (!Array.isArray(recordsList)) return result;
  
	// 按时间排序
	const records = recordsList.slice().sort((a: any, b: any) => 
		(new Date(a.dbtime) as any) - (new Date(b.dbtime) as any)
	);
  
	// 按 pid 分组
	const pidMap: any = {};
	records.forEach(r => {
		if (!pidMap[r.pid]) pidMap[r.pid] = [];
		pidMap[r.pid].push(r);
	});
  
	Object.values(pidMap).forEach((list: any) => {
		const used = new Set();
    
		// 第一步：匹配所有status为2和3的配对（可以跨着匹配）
		// 先找出所有status 2和3的记录
		const status23Records = list.map((item: any, index: number) => ({ ...item, originalIndex: index })).filter((item: any) => item.status === 2 || item.status === 3);
    
		// 按时间排序status 2和3的记录
		status23Records.sort((a: any, b: any) => (new Date(a.dbtime) as any) - (new Date(b.dbtime) as any));
    
		// 配对status 2和3：每个status 2找后面最近的status 3
		const paired23: any[] = [];
    
		for (let i = 0; i < status23Records.length; i++) {
			if (status23Records[i].processed) continue;
      
			const current = status23Records[i];
      
			if (current.status === 2) {
				// 找后面最近的status 3
				let matchIndex = -1;
				let minTimeDiff = Infinity;
			
				for (let j = i + 1; j < status23Records.length; j++) {
					if (status23Records[j].processed) continue;
					if (status23Records[j].status === 3) {
						const timeDiff = Math.abs(new Date(status23Records[j].dbtime) as any - new Date(current.dbtime) as any);
						if (timeDiff < minTimeDiff) {
							minTimeDiff = timeDiff;
							matchIndex = j;
						}
					}
				}
			
				if (matchIndex !== -1) {
					const match = status23Records[matchIndex];
					paired23.push({
						start: current,
						end: match,
						type: 'status23'
					});
					current.processed = true;
					match.processed = true;
				}
			}
		}
    
		// 处理配对成功的status 2和3
		paired23.forEach(pair => {
			used.add(pair.start.originalIndex);
			used.add(pair.end.originalIndex);
      
			result.push({
				startAddress: pair.start.address || '无',
				endAddress: pair.end.address || '无',
				startTime: pair.start.dbtime || '',
				endTime: pair.end.dbtime || '',
				status: pair.end.status,
				duration: pair.end.duration || 0,
				dailyReport: pair.end.dailyReport ?? pair.start.dailyReport,
				username: pair.start.username,
				daytime: pair.start.daytime,
				projectName: pair.start.proname,
				userImage: pair.start.userimage || '',
				ctype: pair.end.ctype,
				pid: pair.start.pid,
				startDistanse: pair.start.distanse ? pair.start.distanse + '米' : '无',
				endDistanse: pair.end.distanse ? pair.end.distanse + '米' : '无'
			});
		});
    
		// 第二步：处理剩余的记录（非status 2/3或未匹配的status 2/3）
		const remaining: any[] = [];
		list.forEach((item: any, idx: number) => {
			if (!used.has(idx)) {
				remaining.push({ ...item, originalIndex: idx });
			}
		});
    
		// 按时间排序
		remaining.sort((a: any, b: any) => (new Date(a.dbtime) as any) - (new Date(b.dbtime) as any));
    
		// 处理ctype配对
		for (let i = 0; i < remaining.length; i++) {
			if (remaining[i].processed) continue;
      
			const current = remaining[i];
      
			// 如果是ctype 0
			if (current.ctype === 0 && (current.status === 0 || current.status === 1)) {
				// 检查是否连续两个ctype 0
				if (i + 1 < remaining.length && remaining[i + 1].ctype === 0 && !remaining[i + 1].processed) {
					// 连续两个ctype 0，当前是单独的
					result.push({
						startAddress: current.address || '无',
						endAddress: '无',
						startTime: current.dbtime || '',
						endTime: '',
						status: current.status,
						duration: 0,
						dailyReport: current.dailyReport,
						username: current.username,
						daytime: current.daytime,
						projectName: current.proname,
						userImage: current.userimage || '',
						ctype: current.ctype,
						pid: current.pid,
						startDistanse: current.distanse ? current.distanse + '米' : '无',
						endDistanse: '无'
					});
					current.processed = true;
				} else {
					// 找最近的ctype 1
					let matchIndex = -1;
					let minTimeDiff = Infinity;
					
					for (let j = i + 1; j < remaining.length; j++) {
						if (remaining[j].processed) continue;
						if (remaining[j].ctype === 1) {
							const timeDiff = Math.abs(new Date(remaining[j].dbtime) as any - new Date(current.dbtime) as any);
							if (timeDiff < minTimeDiff) {
								minTimeDiff = timeDiff;
								matchIndex = j;
							}
						}
					}
			  
					if (matchIndex !== -1) {
						const match = remaining[matchIndex];
						result.push({
							startAddress: current.address || '无',
							endAddress: match.address || '无',
							startTime: current.dbtime || '',
							endTime: match.dbtime || '',
							status: match.status,
							duration: match.duration || 0,
							dailyReport: match.dailyReport ?? current.dailyReport,
							username: current.username,
							daytime: current.daytime,
							projectName: current.proname,
							userImage: current.userimage || '',
							ctype: match.ctype,
							pid: current.pid,
							startDistanse: current.distanse ? current.distanse + '米' : '无',
							endDistanse: match.distanse ? match.distanse + '米' : '无'
						});
				
						current.processed = true;
						match.processed = true;
					} else {
						// 没找到匹配，作为单独的
						result.push({
							startAddress: current.address || '无',
							endAddress: '无',
							startTime: current.dbtime || '',
							endTime: '',
							status: current.status,
							duration: 0,
							dailyReport: current.dailyReport,
							username: current.username,
							daytime: current.daytime,
							projectName: current.proname,
							userImage: current.userimage || '',
							ctype: current.ctype,
							pid: current.pid,
							startDistanse: current.distanse ? current.distanse + '米' : '无',
							endDistanse: '无'
						});
						current.processed = true;
					}
				}
			}
		}
    
		// 处理剩余的ctype 1记录
		for (let i = 0; i < remaining.length; i++) {
			if (remaining[i].processed) continue;
      
			const current = remaining[i];
			
			if (current.ctype === 1 && (current.status === 0 || current.status === 1)) {
				// 检查是否连续两个ctype 1
				let isAlone = false;
				if (i > 0 && remaining[i - 1].ctype === 1 && remaining[i - 1].processed) {
				  isAlone = true;
				}
				
				result.push({
					startAddress: '无',
					endAddress: current.address || '无',
					startTime: '',
					endTime: current.dbtime || '',
					status: current.status,
					duration: current.duration || 0,
					dailyReport: current.dailyReport,
					username: current.username,
					daytime: current.daytime,
					projectName: current.proname,
					userImage: current.userimage || '',
					ctype: current.ctype,
					pid: current.pid,
					startDistanse: '无',
					endDistanse: current.distanse ? current.distanse + '米' : '无'
				});
				current.processed = true;
			}
		}
    
		// 第三步：处理未匹配的status 2和3（单独显示）
		for (let i = 0; i < status23Records.length; i++) {
			if (status23Records[i].processed) continue;
      
			const current = status23Records[i];
			
			if (current.status === 2) {
				result.push({
					startAddress: current.address || '无',
					endAddress: '无',
					startTime: current.dbtime || '',
					endTime: '',
					status: current.status,
					duration: 0,
					dailyReport: current.dailyReport,
					username: current.username,
					daytime: current.daytime,
					projectName: current.proname,
					userImage: current.userimage || '',
					ctype: current.ctype,
					pid: current.pid,
					startDistanse: current.distanse ? current.distanse + '米' : '无',
					endDistanse: '无'
				});
			} else if (current.status === 3) {
				result.push({
					startAddress: '无',
					endAddress: current.address || '无',
					startTime: '',
					endTime: current.dbtime || '',
					status: current.status,
					duration: current.duration || 0,
					dailyReport: current.dailyReport,
					username: current.username,
					daytime: current.daytime,
					projectName: current.proname,
					userImage: current.userimage || '',
					ctype: current.ctype,
					pid: current.pid,
					startDistanse: '无',
					endDistanse: current.distanse ? current.distanse + '米' : '无'
				});
			}
		}
	});
  
	// 按开始时间排序结果
	return result.sort((a: any, b: any) => {
		const timeA = a.startTime || a.endTime || '';
		const timeB = b.startTime || b.endTime || '';
		return (new Date(timeA) as any) - (new Date(timeB) as any);
	});
}

// export function formatRecords(recordsList: any) {
//     const result: any = [];
//     if (!Array.isArray(recordsList)) return result;

//     // 按时间排序
//     const records = recordsList.slice().sort((a: any, b: any) => (new Date(a.dbtime) as any) - (new Date(b.dbtime) as any));

//     // 按 pid 分组
//     const pidMap: any = {};
//     records.forEach(r => {
//         if (!pidMap[r.pid]) pidMap[r.pid] = [];
//         pidMap[r.pid].push(r);
//     });

//     Object.values(pidMap).forEach((list: any) => {
//         const used = new Set();
		
// 		console.log('list', list);

//         for (let i = 0; i < list.length; i++) {
//             if (used.has(i)) continue;
//             const start = list[i];

//             // 判定 start
//             const isStart = ((start.status === 0 || start.status === 1) && start.ctype === 0)
//                             || (start.status === 2);

//             if (!isStart) continue;

//             // 找对应 end
//             let endIndex = -1;
//             for (let j = i + 1; j < list.length; j++) {
//                 if (used.has(j)) continue;
//                 const end = list[j];
//                 const isEnd = ((end.status === 0 || end.status === 1) && end.ctype === 1)
//                             || (end.status === 3);
//                 if (isEnd) {
//                     endIndex = j;
//                     break;
//                 }
//             }

//             if (endIndex !== -1) {
//                 const end = list[endIndex];
//                 used.add(i);
//                 used.add(endIndex);

//                 result.push({
//                     startAddress: start.address || '无',
//                     endAddress: end.address || '无',
//                     startTime: start.dbtime || '',
//                     endTime: end.dbtime || '',
//                     status: end.status,
//                     duration: end.duration || 0,
//                     dailyReport: end.dailyReport ?? start.dailyReport,
//                     username: start.username,
//                     daytime: start.daytime,
//                     projectName: start.proname,
//                     userImage: start.userimage || '',
//                     ctype: end.ctype,
//                     pid: start.pid,
//                     startDistanse: start.distanse ? start.distanse + '米' : '无',
//                     endDistanse: end.distanse ? end.distanse + '米' : '无'
//                 });
//             } else {
//                 // 单条 start
//                 used.add(i);
//                 result.push({
//                     startAddress: start.address || '无',
//                     endAddress: '无',
//                     startTime: start.dbtime || '',
//                     endTime: '',
//                     status: start.status,
//                     duration: 0,
//                     dailyReport: start.dailyReport,
//                     username: start.username,
//                     daytime: start.daytime,
//                     projectName: start.proname,
//                     userImage: start.userimage || '',
//                     ctype: start.ctype,
//                     pid: start.pid,
//                     startDistanse: start.distanse ? start.distanse + '米' : '无',
//                     endDistanse: '无'
//                 });
//             }
//         }

//         // 剩余孤立 end
//         list.forEach((it: any, idx: number) => {
//             if (used.has(idx)) return;
//             const isEnd = ((it.status === 0 || it.status === 1) && it.ctype === 1) || (it.status === 3);
//             if (!isEnd) return;

//             used.add(idx);
//             result.push({
//                 startAddress: '无',
//                 endAddress: it.address || '无',
//                 startTime: '',
//                 endTime: it.dbtime || '',
//                 status: it.status,
//                 duration: it.duration || 0,
//                 dailyReport: it.dailyReport,
//                 username: it.username,
//                 daytime: it.daytime,
//                 projectName: it.proname,
//                 userImage: it.userimage || '',
//                 ctype: it.ctype,
//                 pid: it.pid,
//                 startDistanse: '无',
//                 endDistanse: it.distanse ? it.distanse + '米' : '无'
//             });
//         });
//     });

//     return result;
// }

// 计算两个经纬度的距离
export function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number, radiusMeters: number): boolean {
    const EARTH_RADIUS = 6371e3;

    const radLat1 = Math.PI * lat1 / 180;
    const radLat2 = Math.PI * lat2 / 180;
    const deltaLat = Math.PI * (lat2 - lat1) / 180;
    const deltaLon = Math.PI * (lon2 - lon1) / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(radLat1) * Math.cos(radLat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (EARTH_RADIUS * c) <= radiusMeters;
}

// ⭐ WGS-84 → GCJ-02
export function wgs84ToGcj02(lat: number, lon: number) {
    if (outOfChina(lat, lon)) return { lat, lon }; // 国外不偏移

    const a = 6378245.0;
    const ee = 0.00669342162296594323;

    let dLat = transformLat(lon - 105.0, lat - 35.0);
    let dLon = transformLon(lon - 105.0, lat - 35.0);
    let radLat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    let sqrtMagic = Math.sqrt(magic);

    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);

    return {
        lat: lat + dLat,
        lon: lon + dLon
    };
}

interface Coordinate {
	lng: number; // 经度
	lat: number; // 纬度
}

export function getSphericalCenter(coordinates: Coordinate[]): Coordinate {
	if (coordinates.length === 0) {
		throw new Error('坐标数组不能为空');
	}

	// 将经纬度转换为弧度
	const coordsInRadians = coordinates.map(coord => ({
	  lng: coord.lng * Math.PI / 180,
	  lat: coord.lat * Math.PI / 180
	}));

	// 转换为笛卡尔坐标
	const cartesianCoords = coordsInRadians.map(coord => {
		const cosLat = Math.cos(coord.lat);
		return {
			x: cosLat * Math.cos(coord.lng),
			y: cosLat * Math.sin(coord.lng),
			z: Math.sin(coord.lat)
		};
	});

	  // 计算平均向量
	const sum = cartesianCoords.reduce(
		(acc, point) => ({
			x: acc.x + point.x,
			y: acc.y + point.y,
			z: acc.z + point.z
		}),
		{ x: 0, y: 0, z: 0 }
	);

	const avgX = sum.x / coordinates.length;
	const avgY = sum.y / coordinates.length;
	const avgZ = sum.z / coordinates.length;

	// 将平均向量转换回经纬度
	const centerLng = Math.atan2(avgY, avgX);
	const centerLat = Math.atan2(avgZ, Math.sqrt(avgX * avgX + avgY * avgY));

	return {
		lng: centerLng * 180 / Math.PI,
		lat: centerLat * 180 / Math.PI
	};
}

/**
 * 计算字符串长度（不包含换行符）
 * @param str 原字符串
 * @returns number 长度
 */
export function countLength(str: string): number {
    if (!str) return 0
    // 去除 \n 和 \r 再计算长度
    return str.replace(/[\n\r]/g, '').length
}

// 字符串替换转换
export function replaceByMap(str: any, map = { '[': '@', ']': '$', '{': '&', '}': '^', '/': '!' }) {
    // if (typeof str !== "string") str = String(str);

    // // 对 key 做正则转义，避免特殊字符冲突
    // const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // // 按 key 长度排序，保证长的先匹配（防止子串冲突）
    // const keys = Object.keys(map).sort((a, b) => b.length - a.length);

    // const pattern = new RegExp(keys.map(escapeRegExp).join('|'), 'g');

    // return str.replace(pattern, m => Object.prototype.hasOwnProperty.call(map, m) ? map[m] : m);
    let newStr = '';
    for (let item of str) {
        if (item == '[') {
            newStr += '@';
        } else if (item == ']') {
            newStr += '$';
        } else if (item == '{') {
            newStr += '&';
        } else if (item == '}') {
            newStr += '^';
        } else if (item == '/') {
            newStr += '!';
        } else {
            newStr += item; // 保留其他字符
        }
    }
    return newStr
}

// 字符串转换为hex
export function stringToHex(str: any) {
    var re = /[\u4E00-\u9FA5]/;
    var ar = [];
    for (var i = 0; i < str.length; i++) {
        var a = '';
        if (re.test(str.charAt(i))) {
            // 中文
            a = encodeURI(str.charAt(i)).replace(/%/g, '');
        } else {
            a = str.charCodeAt(i).toString(16);
        }
        ar.push(a);
    }
    str = ar.join('');
    return str;
}

// 校验快递单号
export function validateExpressCode(code: string) {
    // 快递单号正则集合
    const expressPatterns: any = {
        SF: /^\d{12}$|^[A-Za-z]\d{12}$/,     // 顺丰: 12位纯数字 或 1字母+12位数字
        ZTO: /^\d{12}$/,                     // 中通: 12位数字
        STO: /^\d{12}$/,                     // 申通: 12位数字
        YTO: /^\d{10,12}$/,                  // 圆通: 10-12位数字
        YD: /^\d{13}$/,                      // 韵达: 13位数字
        EMS: /^[A-Z]{2}\d{9}[A-Z]{2}$/,      // EMS: 2字母+9数字+2字母
        COMMON: /^[A-Za-z0-9]{8,20}$/        // 兜底: 8-20位字母数字
    };
    code = code.trim();

    for (let company in expressPatterns) {
        if (expressPatterns[company].test(code)) {
            return true;
        }
    }

    return false;
}