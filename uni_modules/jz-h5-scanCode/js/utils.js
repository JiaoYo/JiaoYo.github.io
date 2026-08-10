/**
 * 工具类模块
 * 提供调试、错误处理和通用功能
 */

class Utils {
    /**
     * 调试模式
     */
    static DEBUG = false;

    /**
     * 日志输出
     */
    static log(message, ...args) {
        if (this.DEBUG) {
            console.log(`[jz-h5-scanCode] ${message}`, ...args);
        }
    }

    /**
     * 错误日志
     */
    static error(message, error) {
        console.error(`[jz-h5-scanCode] ${message}`, error);
    }

    /**
     * 警告日志
     */
    static warn(message, ...args) {
        console.warn(`[jz-h5-scanCode] ${message}`, ...args);
    }

    /**
     * 检查是否为移动设备
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * 检查是否为iOS设备
     */
    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    /**
     * 检查是否为Android设备
     */
    static isAndroid() {
        return /Android/i.test(navigator.userAgent);
    }

    /**
     * 检查浏览器支持情况
     */
    static checkBrowserSupport() {
        const support = {
            getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            barcodeDetector: 'BarcodeDetector' in window,
            canvas: !!document.createElement('canvas').getContext,
            webGL: (() => {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                } catch (e) {
                    return false;
                }
            })(),
            requestAnimationFrame: 'requestAnimationFrame' in window,
            vibrate: 'vibrate' in navigator
        };

        return support;
    }

    /**
     * 创建错误对象
     */
    static createError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }

    /**
     * 错误代码常量
     */
    static ERROR_CODES = {
        CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
        CAMERA_NOT_FOUND: 'CAMERA_NOT_FOUND',
        DECODER_INIT_FAILED: 'DECODER_INIT_FAILED',
        SCAN_TIMEOUT: 'SCAN_TIMEOUT',
        BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
        USER_CANCELLED: 'USER_CANCELLED'
    };

    /**
     * 获取友好的错误信息
     */
    static getErrorMessage(error) {
        const messages = {
            [this.ERROR_CODES.CAMERA_PERMISSION_DENIED]: '请允许访问摄像头权限',
            [this.ERROR_CODES.CAMERA_NOT_FOUND]: '未检测到摄像头设备',
            [this.ERROR_CODES.DECODER_INIT_FAILED]: '扫码器初始化失败',
            [this.ERROR_CODES.SCAN_TIMEOUT]: '扫码超时',
            [this.ERROR_CODES.BROWSER_NOT_SUPPORTED]: '当前浏览器不支持扫码功能',
            [this.ERROR_CODES.USER_CANCELLED]: '用户取消扫码'
        };

        return messages[error.code] || error.message || '未知错误';
    }

    /**
     * 防抖函数
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * 节流函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 深度克隆对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * 生成唯一ID
     */
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * 格式化文件大小
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * 获取设备信息
     */
    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            isMobile: this.isMobile(),
            isIOS: this.isIOS(),
            isAndroid: this.isAndroid()
        };
    }

    /**
     * 性能监测
     */
    static performanceMonitor() {
        if (!performance || !performance.mark) {
            return {
                start: () => {},
                end: () => 0
            };
        }

        return {
            start: (name) => {
                performance.mark(`${name}-start`);
            },
            end: (name) => {
                performance.mark(`${name}-end`);
                performance.measure(name, `${name}-start`, `${name}-end`);
                const measure = performance.getEntriesByName(name)[0];
                return measure ? measure.duration : 0;
            }
        };
    }

    /**
     * 安全执行函数
     */
    static safeExecute(func, defaultValue = null) {
        try {
            return func();
        } catch (error) {
            this.error('Safe execute failed:', error);
            return defaultValue;
        }
    }

    /**
     * 异步安全执行
     */
    static async safeExecuteAsync(func, defaultValue = null) {
        try {
            return await func();
        } catch (error) {
            this.error('Safe execute async failed:', error);
            return defaultValue;
        }
    }

    /**
     * 简单的事件发射器
     */
    static createEventEmitter() {
        const events = {};

        return {
            on(event, callback) {
                if (!events[event]) {
                    events[event] = [];
                }
                events[event].push(callback);
            },
            off(event, callback) {
                if (events[event]) {
                    events[event] = events[event].filter(cb => cb !== callback);
                }
            },
            emit(event, ...args) {
                if (events[event]) {
                    events[event].forEach(callback => {
                        try {
                            callback(...args);
                        } catch (error) {
                            Utils.error(`Event callback error for ${event}:`, error);
                        }
                    });
                }
            }
        };
    }

    /**
     * URL参数解析
     */
    static parseUrlParams(url = window.location.href) {
        const params = {};
        const urlObj = new URL(url);
        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
        });
        return params;
    }

    /**
     * 检查网络连接状态
     */
    static checkNetworkStatus() {
        return {
            online: navigator.onLine,
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
        };
    }

    /**
     * 检查是否为安全环境（HTTPS或localhost）
     */
    static isSecureContext() {
        return location.protocol === 'https:' || 
               location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' ||
               location.hostname === '0.0.0.0';
    }

    /**
     * 获取当前协议和主机信息
     */
    static getLocationInfo() {
        return {
            protocol: location.protocol,
            hostname: location.hostname,
            port: location.port,
            isSecure: this.isSecureContext(),
            needsHTTPS: !this.isSecureContext()
        };
    }
}

export default Utils; 