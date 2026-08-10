/**
 * Web Worker 管理器
 * 负责管理图片处理Worker的生命周期和通信
 */

class WorkerManager {
    constructor() {
        this.worker = null;
        this.tasks = new Map(); // 存储任务
        this.taskIdCounter = 0;
        this.isSupported = typeof Worker !== 'undefined';
        this.progressCallback = null;
    }

    /**
     * 检查浏览器是否支持Web Worker
     */
    checkWorkerSupport() {
        try {
            // 由于OffscreenCanvas兼容性问题，暂时禁用Worker
            // 将来可以考虑使用ImageBitmap等替代方案
            return false; // 暂时禁用Worker，使用主线程处理
        } catch (e) {
            return false;
        }
    }

    /**
     * 初始化Worker
     */
    async init() {
        if (!this.isSupported) {
            console.warn('不支持Web Worker，使用主线程处理');
            return false;
        }

        if (this.worker) return true;

        try {
            const workerCode = `
                self.onmessage = function(e) {
                    const { action, data, taskId } = e.data;
                    
                    if (action === 'compressImage') {
                        try {
                            const { imageData, maxSize, minSize } = data;
                            
                            self.postMessage({
                                taskId,
                                type: 'progress',
                                message: '正在压缩图片...',
                                progress: 20
                            });
                            
                            // 在Worker中不能使用OffscreenCanvas时的降级处理
                            self.postMessage({
                                taskId,
                                success: false,
                                error: '当前浏览器不支持OffscreenCanvas，将使用主线程处理'
                            });
                            
                        } catch (error) {
                            self.postMessage({
                                taskId,
                                success: false,
                                error: error.message
                            });
                        }
                    }
                };
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
            
            this.worker.onmessage = (e) => {
                this.handleWorkerMessage(e.data);
            };
            
            this.worker.onerror = (error) => {
                console.error('Worker错误:', error);
                this.handleWorkerError(error);
            };

            return true;
        } catch (error) {
            console.error('Worker初始化失败:', error);
            return false;
        }
    }

    /**
     * 处理Worker消息
     */
    handleWorkerMessage(data) {
        const { taskId, type, success, result, error, message, progress } = data;
        const task = this.tasks.get(taskId);
        
        if (!task) return;

        if (type === 'progress' && task.onProgress) {
            task.onProgress(message, progress);
        } else if (success !== undefined) {
            this.tasks.delete(taskId);
            if (success) {
                task.resolve(result);
            } else {
                task.reject(new Error(error));
            }
        }
    }

    /**
     * 处理Worker错误
     */
    handleWorkerError(error) {
        for (const [taskId, task] of this.tasks) {
            task.reject(new Error('Worker错误: ' + error.message));
        }
        this.tasks.clear();
        this.worker = null;
    }

    /**
     * 设置进度回调
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * 压缩图片
     */
    async compressImage(imageData, maxSize = 800, minSize = 400, quality = 0.6, onProgress = null) {
        // 由于浏览器兼容性问题，直接使用主线程处理
        return this.fallbackCompress(imageData, maxSize, minSize, quality, onProgress);
    }

    /**
     * 极限压缩
     */
    async extremeCompress(imageData, onProgress = null) {
        // 如果不支持Worker，使用主线程处理
        if (!this.isSupported || !this.worker) {
            return this.fallbackExtremeCompress(imageData, onProgress);
        }

        const taskId = ++this.taskIdCounter;
        
        return new Promise((resolve, reject) => {
            // 存储任务
            this.tasks.set(taskId, { resolve, reject, onProgress });
            
            // 发送任务到Worker
            this.worker.postMessage({
                action: 'extremeCompress',
                taskId,
                data: { imageData }
            });
            
            // 设置超时
            setTimeout(() => {
                if (this.tasks.has(taskId)) {
                    this.tasks.delete(taskId);
                    reject(new Error('极限压缩超时'));
                }
            }, 20000); // 20秒超时
        });
    }

    /**
     * 主线程降级处理 - 标准压缩
     */
    async fallbackCompress(imageData, maxSize, minSize, quality, onProgress) {
        try {
            if (onProgress) onProgress('开始处理图片...', 10);
            
            // 使用requestAnimationFrame确保UI更新
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            ctx.putImageData(imageData, 0, 0);
            
            if (onProgress) onProgress('计算压缩尺寸...', 30);
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const { width, height } = this.calculateOptimalSize(
                imageData.width, 
                imageData.height, 
                maxSize, 
                minSize
            );
            
            if (onProgress) onProgress(`压缩到 ${width}x${height}`, 50);
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const compressedCanvas = document.createElement('canvas');
            const compressedCtx = compressedCanvas.getContext('2d');
            
            compressedCanvas.width = width;
            compressedCanvas.height = height;
            
            compressedCtx.imageSmoothingEnabled = true;
            compressedCtx.imageSmoothingQuality = 'high';
            
            if (onProgress) onProgress('绘制压缩图片...', 80);
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            compressedCtx.drawImage(canvas, 0, 0, width, height);
            
            if (onProgress) onProgress('生成结果...', 95);
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const compressedImageData = compressedCtx.getImageData(0, 0, width, height);
            
            if (onProgress) onProgress('压缩完成', 100);
            
            return {
                imageData: compressedImageData,
                originalSize: imageData.width + 'x' + imageData.height,
                compressedSize: width + 'x' + height,
                compressionRatio: ((1 - (width * height) / (imageData.width * imageData.height)) * 100).toFixed(1) + '%'
            };
            
        } catch (error) {
            throw new Error('图片压缩失败: ' + error.message);
        }
    }

    /**
     * 主线程降级处理 - 极限压缩
     */
    async fallbackExtremeCompress(imageData, onProgress) {
        try {
            if (onProgress) onProgress('主线程极限压缩...', 10);
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            ctx.putImageData(imageData, 0, 0);
            
            if (onProgress) onProgress('生成400x400图片...', 50);
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const targetSize = 400;
            const compressedCanvas = document.createElement('canvas');
            const compressedCtx = compressedCanvas.getContext('2d');
            
            compressedCanvas.width = targetSize;
            compressedCanvas.height = targetSize;
            compressedCtx.imageSmoothingEnabled = false;
            
            if (onProgress) onProgress('绘制极限压缩图...', 80);
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            compressedCtx.drawImage(canvas, 0, 0, targetSize, targetSize);
            
            if (onProgress) onProgress('生成结果...', 95);
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const compressedImageData = compressedCtx.getImageData(0, 0, targetSize, targetSize);
            
            if (onProgress) onProgress('极限压缩完成', 100);
            
            return {
                imageData: compressedImageData,
                originalSize: imageData.width + 'x' + imageData.height,
                compressedSize: targetSize + 'x' + targetSize,
                compressionRatio: ((1 - (targetSize * targetSize) / (imageData.width * imageData.height)) * 100).toFixed(1) + '%'
            };
            
        } catch (error) {
            throw new Error('主线程极限压缩失败: ' + error.message);
        }
    }

    /**
     * 计算最优压缩尺寸
     */
    calculateOptimalSize(originalWidth, originalHeight, maxSize, minSize) {
        let width = originalWidth;
        let height = originalHeight;
        
        const ratio = Math.min(maxSize / width, maxSize / height);
        
        if (ratio < 1) {
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        
        if (width < minSize && height < minSize) {
            const minRatio = Math.max(minSize / width, minSize / height);
            width = Math.floor(width * minRatio);
            height = Math.floor(height * minRatio);
        }
        
        const avgSize = Math.floor((width + height) / 2);
        if (avgSize <= maxSize && avgSize >= minSize) {
            const squareSize = Math.min(avgSize, 600);
            return { width: squareSize, height: squareSize };
        }
        
        return { width, height };
    }

    /**
     * 销毁Worker
     */
    destroy() {
        if (this.worker) {
            for (const [taskId, task] of this.tasks) {
                task.reject(new Error('Worker被销毁'));
            }
            this.tasks.clear();
            this.worker.terminate();
            this.worker = null;
        }
    }

    /**
     * 获取Worker代码
     */
    getWorkerCode() {
        return `
// 图片处理Worker代码
self.onmessage = function(e) {
    const { action, data, taskId } = e.data;
    
    try {
        switch (action) {
            case 'compressImage':
                handleCompressImage(data, taskId);
                break;
            case 'extremeCompress':
                handleExtremeCompress(data, taskId);
                break;
            default:
                postMessage({
                    taskId,
                    success: false,
                    error: '未知的操作类型: ' + action
                });
        }
    } catch (error) {
        postMessage({
            taskId,
            success: false,
            error: error.message || '处理过程中发生未知错误'
        });
    }
};

function handleCompressImage(data, taskId) {
    try {
        const { imageData, maxSize, minSize, quality } = data;
        
        postMessage({
            taskId,
            type: 'progress',
            message: '正在压缩图片...',
            progress: 20
        });
        
        // 检查OffscreenCanvas支持
        if (typeof OffscreenCanvas === 'undefined') {
            throw new Error('当前浏览器不支持OffscreenCanvas');
        }
        
        // 使用canvas进行压缩
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        
        const { width, height } = calculateOptimalSize(imageData.width, imageData.height, maxSize, minSize);
        
        postMessage({
            taskId,
            type: 'progress',
            message: '压缩尺寸: ' + width + 'x' + height,
            progress: 50
        });
        
        const compressedCanvas = new OffscreenCanvas(width, height);
        const compressedCtx = compressedCanvas.getContext('2d');
        
        compressedCtx.imageSmoothingEnabled = true;
        compressedCtx.imageSmoothingQuality = 'high';
        compressedCtx.drawImage(canvas, 0, 0, width, height);
        
        postMessage({
            taskId,
            type: 'progress',
            message: '生成压缩结果...',
            progress: 80
        });
        
        const compressedImageData = compressedCtx.getImageData(0, 0, width, height);
        
        postMessage({
            taskId,
            success: true,
            result: {
                imageData: compressedImageData,
                originalSize: imageData.width + 'x' + imageData.height,
                compressedSize: width + 'x' + height,
                compressionRatio: ((1 - (width * height) / (imageData.width * imageData.height)) * 100).toFixed(1) + '%'
            },
            type: 'complete',
            progress: 100
        });
        
    } catch (error) {
        postMessage({
            taskId,
            success: false,
            error: '图片压缩失败: ' + error.message
        });
    }
}

function handleExtremeCompress(data, taskId) {
    try {
        const { imageData } = data;
        
        postMessage({
            taskId,
            type: 'progress',
            message: '正在极限压缩图片...',
            progress: 10
        });
        
        // 检查OffscreenCanvas支持
        if (typeof OffscreenCanvas === 'undefined') {
            throw new Error('当前浏览器不支持OffscreenCanvas');
        }
        
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        
        const targetSize = 400;
        const compressedCanvas = new OffscreenCanvas(targetSize, targetSize);
        const compressedCtx = compressedCanvas.getContext('2d');
        
        compressedCtx.imageSmoothingEnabled = false;
        
        postMessage({
            taskId,
            type: 'progress',
            message: '正在生成400x400压缩图...',
            progress: 60
        });
        
        compressedCtx.drawImage(canvas, 0, 0, targetSize, targetSize);
        
        postMessage({
            taskId,
            type: 'progress',
            message: '压缩完成，生成结果...',
            progress: 90
        });
        
        const compressedImageData = compressedCtx.getImageData(0, 0, targetSize, targetSize);
        
        postMessage({
            taskId,
            success: true,
            result: {
                imageData: compressedImageData,
                originalSize: imageData.width + 'x' + imageData.height,
                compressedSize: targetSize + 'x' + targetSize,
                compressionRatio: ((1 - (targetSize * targetSize) / (imageData.width * imageData.height)) * 100).toFixed(1) + '%'
            },
            type: 'complete',
            progress: 100
        });
        
    } catch (error) {
        postMessage({
            taskId,
            success: false,
            error: '极限压缩失败: ' + error.message
        });
    }
}

function calculateOptimalSize(originalWidth, originalHeight, maxSize, minSize) {
    let width = originalWidth;
    let height = originalHeight;
    
    const ratio = Math.min(maxSize / width, maxSize / height);
    
    if (ratio < 1) {
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
    }
    
    if (width < minSize && height < minSize) {
        const minRatio = Math.max(minSize / width, minSize / height);
        width = Math.floor(width * minRatio);
        height = Math.floor(height * minRatio);
    }
    
    const avgSize = Math.floor((width + height) / 2);
    if (avgSize <= maxSize && avgSize >= minSize) {
        const squareSize = Math.min(avgSize, 600);
        return { width: squareSize, height: squareSize };
    }
    
    return { width, height };
}

self.onerror = function(error) {
    postMessage({
        success: false,
        error: 'Worker发生错误: ' + error.message
    });
};

        // 图片处理Worker已启动
        `;
    }
}

// 导出管理器
export default WorkerManager; 