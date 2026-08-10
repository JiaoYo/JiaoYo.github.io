/**
 * 图片处理Web Worker
 * 用于异步处理图片压缩，避免阻塞主线程
 */

// 监听主线程消息
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

/**
 * 处理标准图片压缩
 */
async function handleCompressImage(data, taskId) {
    try {
        const { imageData, maxSize, minSize, quality } = data;
        
        // 发送进度更新
        postMessage({
            taskId,
            type: 'progress',
            message: '正在压缩图片...',
            progress: 20
        });
        
        // 创建canvas进行压缩
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext('2d');
        
        // 将ImageData绘制到canvas
        ctx.putImageData(imageData, 0, 0);
        
        // 计算压缩尺寸
        const { width, height } = calculateOptimalSize(
            imageData.width, 
            imageData.height, 
            maxSize, 
            minSize
        );
        
        postMessage({
            taskId,
            type: 'progress',
            message: `压缩尺寸: ${width}x${height}`,
            progress: 50
        });
        
        // 创建压缩后的canvas
        const compressedCanvas = new OffscreenCanvas(width, height);
        const compressedCtx = compressedCanvas.getContext('2d');
        
        // 使用高质量缩放
        compressedCtx.imageSmoothingEnabled = true;
        compressedCtx.imageSmoothingQuality = 'high';
        
        // 绘制压缩后的图片
        compressedCtx.drawImage(canvas, 0, 0, width, height);
        
        postMessage({
            taskId,
            type: 'progress',
            message: '生成压缩结果...',
            progress: 80
        });
        
        // 获取压缩后的ImageData
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

/**
 * 处理极限压缩
 */
async function handleExtremeCompress(data, taskId) {
    try {
        const { imageData } = data;
        
        postMessage({
            taskId,
            type: 'progress',
            message: '正在极限压缩图片...',
            progress: 10
        });
        
        // 创建canvas
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext('2d');
        
        // 将ImageData绘制到canvas
        ctx.putImageData(imageData, 0, 0);
        
        postMessage({
            taskId,
            type: 'progress',
            message: '应用极限压缩算法...',
            progress: 30
        });
        
        // 极限压缩：固定400px正方形
        const targetSize = 400;
        const compressedCanvas = new OffscreenCanvas(targetSize, targetSize);
        const compressedCtx = compressedCanvas.getContext('2d');
        
        // 关闭图片平滑，提高速度
        compressedCtx.imageSmoothingEnabled = false;
        
        postMessage({
            taskId,
            type: 'progress',
            message: '正在生成400x400压缩图...',
            progress: 60
        });
        
        // 分块处理，避免一次性处理大图
        await drawImageInChunks(compressedCtx, canvas, targetSize, targetSize, taskId);
        
        postMessage({
            taskId,
            type: 'progress',
            message: '压缩完成，生成结果...',
            progress: 90
        });
        
        // 获取压缩后的ImageData
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

/**
 * 分块绘制图片
 */
async function drawImageInChunks(ctx, sourceCanvas, targetWidth, targetHeight, taskId) {
    return new Promise((resolve, reject) => {
        try {
            const chunkSize = 100; // 每次处理100px的区块
            let currentY = 0;
            
            const drawChunk = () => {
                if (currentY >= targetHeight) {
                    resolve();
                    return;
                }
                
                const chunkHeight = Math.min(chunkSize, targetHeight - currentY);
                const sourceY = (currentY / targetHeight) * sourceCanvas.height;
                const sourceHeight = (chunkHeight / targetHeight) * sourceCanvas.height;
                
                try {
                    // 绘制当前区块
                    ctx.drawImage(
                        sourceCanvas,
                        0, sourceY, sourceCanvas.width, sourceHeight,
                        0, currentY, targetWidth, chunkHeight
                    );
                    
                    currentY += chunkHeight;
                    
                    // 更新进度
                    const progress = 60 + Math.floor((currentY / targetHeight) * 25);
                    postMessage({
                        taskId,
                        type: 'progress',
                        message: `处理进度: ${Math.floor((currentY / targetHeight) * 100)}%`,
                        progress
                    });
                    
                    // 异步处理下一个区块
                    setTimeout(drawChunk, 5);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            drawChunk();
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 计算最优压缩尺寸
 */
function calculateOptimalSize(originalWidth, originalHeight, maxSize, minSize) {
    let width = originalWidth;
    let height = originalHeight;
    
    // 计算压缩比例
    const ratio = Math.min(maxSize / width, maxSize / height);
    
    if (ratio < 1) {
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
    }
    
    // 确保不小于最小尺寸
    if (width < minSize && height < minSize) {
        const minRatio = Math.max(minSize / width, minSize / height);
        width = Math.floor(width * minRatio);
        height = Math.floor(height * minRatio);
    }
    
    // 针对扫码场景，优先正方形比例
    const avgSize = Math.floor((width + height) / 2);
    if (avgSize <= maxSize && avgSize >= minSize) {
        const squareSize = Math.min(avgSize, 600);
        return { width: squareSize, height: squareSize };
    }
    
    return { width, height };
}

// 错误处理
self.onerror = function(error) {
    postMessage({
        success: false,
        error: 'Worker发生错误: ' + error.message
    });
};

// 图片处理Worker已启动 