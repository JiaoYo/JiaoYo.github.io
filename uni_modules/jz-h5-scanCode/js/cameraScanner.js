/**
 * 摄像头扫描器模块
 * 负责处理摄像头访问、视频流管理和图像数据获取
 */

class CameraScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.stream = null;
        this.drawFrameId = null; // 添加绘制帧ID
        this.lastDrawTime = 0; // 上次绘制时间
        this.drawInterval = 33; // 绘制间隔约30fps
        this.config = {
            width: 640,
            height: 480,
            facingMode: 'environment' // 后置摄像头
        };
    }

    /**
     * 检测设备类型
     * @returns {string} 'mobile' | 'tablet' | 'desktop'
     */
    detectDeviceType() {
        const userAgent = navigator.userAgent;
        const screenWidth = window.innerWidth;
        
        // 检测移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        
        // 更精确的判断
        if (isMobile) {
            // iPad或大屏手机视为平板
            if (/iPad/i.test(userAgent) || screenWidth >= 768) {
                return 'tablet';
            }
            return 'mobile';
        }
        
        // PC端
        return 'desktop';
    }

    /**
     * 判断是否为手机设备
     */
    isMobileDevice() {
        return this.detectDeviceType() === 'mobile';
    }

    /**
     * 初始化摄像头
     * @param {HTMLCanvasElement} canvasElement - canvas元素
     * @param {Object} config - 配置选项
     * @param {Function} onVideoSizeReady - 视频尺寸确定后的回调函数
     */
    async init(canvasElement, config = {}, onVideoSizeReady = null) {
        try {
            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext('2d');
            this.config = { ...this.config, ...config };
            this.onVideoSizeReady = onVideoSizeReady;

            // 获取video元素（由UIManager创建）
            this.video = document.querySelector('.jz-scanner-video');
            if (!this.video) {
                throw new Error('Video元素未找到');
            }

            // 获取摄像头流
            await this.startCamera();
            
            // 摄像头初始化成功
        } catch (error) {
            console.error('摄像头初始化失败:', error);
            throw error;
        }
    }

    /**
     * 启动摄像头
     */
    async startCamera() {
        try {
            const constraints = {
                video: {
                    width: { ideal: this.config.width },
                    height: { ideal: this.config.height },
                    facingMode: { ideal: this.config.facingMode }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // 等待视频开始播放
            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    this.video.play().then(resolve).catch(reject);
                };
                this.video.onerror = reject;
            });

            // 设置canvas尺寸，根据设备类型采用不同策略
            const videoWidth = this.video.videoWidth;
            const videoHeight = this.video.videoHeight;
            
            if (videoWidth > 0 && videoHeight > 0) {
                // 计算合适的canvas尺寸
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight - 60; // 减去导航栏高度
                const isMobile = this.isMobileDevice();
                const videoAspectRatio = videoWidth / videoHeight;
                
                let canvasWidth, canvasHeight;
                
                if (isMobile) {
                    // 手机端：全屏显示，保持视频比例填充
                    const screenAspectRatio = screenWidth / screenHeight;
                    
                    if (videoAspectRatio > screenAspectRatio) {
                        // 视频更宽，以高度为准
                        canvasHeight = screenHeight;
                        canvasWidth = canvasHeight * videoAspectRatio;
                    } else {
                        // 视频更高，以宽度为准
                        canvasWidth = screenWidth;
                        canvasHeight = canvasWidth / videoAspectRatio;
                    }
                } else {
                    // PC/平板端：高度铺满，宽度最大600px
                    const maxWidth = 600;
                    
                    // 以高度为基准计算宽度
                    canvasHeight = screenHeight;
                    canvasWidth = canvasHeight * videoAspectRatio;
                    
                    // 如果宽度超过最大限制，则以宽度为准
                    if (canvasWidth > maxWidth) {
                        canvasWidth = maxWidth;
                        canvasHeight = canvasWidth / videoAspectRatio;
                    }
                }
                
                this.canvas.width = Math.round(canvasWidth);
                this.canvas.height = Math.round(canvasHeight);
                
                // Canvas尺寸已更新
                
                // 通知主程序视频尺寸已确定，可以更新UI中的canvas
                if (this.onVideoSizeReady && typeof this.onVideoSizeReady === 'function') {
                    this.onVideoSizeReady(videoWidth, videoHeight);
                }
            } else {
                console.warn('视频尺寸无效，使用屏幕尺寸初始化canvas');
                // 如果视频尺寸无效，根据设备类型使用不同策略
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight - 60;
                const isMobile = this.isMobileDevice();
                
                let canvasWidth, canvasHeight;
                
                if (isMobile) {
                    // 手机端：全屏
                    canvasWidth = screenWidth;
                    canvasHeight = screenHeight;
                } else {
                    // PC/平板端：高度铺满，宽度最大600px
                    const maxWidth = 600;
                    canvasWidth = Math.min(screenWidth, maxWidth);
                    canvasHeight = screenHeight;
                }
                
                this.canvas.width = Math.round(canvasWidth);
                this.canvas.height = Math.round(canvasHeight);
                
                // 即使视频尺寸无效，也要显示canvas让用户能看到界面
                this.showCanvasDirectly();
            }

            // 开始绘制视频帧到canvas（用于二维码识别）
            this.drawVideoFrame();

            // 在视频开始播放后再次检查尺寸，确保正确设置
            setTimeout(() => {
                if (this.video && this.canvas && this.video.videoWidth > 0 && this.video.videoHeight > 0) {
                    const newVideoWidth = this.video.videoWidth;
                    const newVideoHeight = this.video.videoHeight;
                    const screenWidth = window.innerWidth;
                    const screenHeight = window.innerHeight - 60;
                    const isMobile = this.isMobileDevice();
                    
                    // 计算期望的canvas尺寸（使用最新的设备适配逻辑）
                    const videoAspectRatio = newVideoWidth / newVideoHeight;
                    
                    let expectedWidth, expectedHeight;
                    
                    if (isMobile) {
                        // 手机端全屏逻辑
                        const screenAspectRatio = screenWidth / screenHeight;
                        
                        if (videoAspectRatio > screenAspectRatio) {
                            expectedHeight = screenHeight;
                            expectedWidth = expectedHeight * videoAspectRatio;
                        } else {
                            expectedWidth = screenWidth;
                            expectedHeight = expectedWidth / videoAspectRatio;
                        }
                    } else {
                        // PC/平板端逻辑
                        const maxWidth = 600;
                        expectedHeight = screenHeight;
                        expectedWidth = expectedHeight * videoAspectRatio;
                        
                        if (expectedWidth > maxWidth) {
                            expectedWidth = maxWidth;
                            expectedHeight = expectedWidth / videoAspectRatio;
                        }
                    }
                    
                    expectedWidth = Math.round(expectedWidth);
                    expectedHeight = Math.round(expectedHeight);
                    
                    // 如果尺寸有变化，重新设置canvas
                    if (this.canvas.width !== expectedWidth || this.canvas.height !== expectedHeight) {
                        // 延迟检查发现canvas尺寸需要调整
                        this.updateCanvasSizeInternal(newVideoWidth, newVideoHeight);
                    }
                }
            }, 500); // 500ms后再次检查

            // 摄像头启动成功
            
            // 备用显示机制：如果1秒后canvas仍然隐藏，强制显示
            setTimeout(() => {
                if (this.canvas && this.canvas.style.opacity === '0') {
                    // 备用机制：强制显示canvas
                    this.canvas.style.opacity = '1';
                }
            }, 1000);
        } catch (error) {
            console.error('启动摄像头失败:', error);
            throw new Error('无法访问摄像头: ' + error.message);
        }
    }

    /**
     * 绘制视频帧到canvas（用于二维码识别）- 优化版本
     */
    drawVideoFrame() {
        // 检查是否需要停止绘制
        if (!this.video || !this.canvas || !this.ctx || !this.stream) {
            // 绘制条件不满足，停止绘制循环
            return;
        }

        const now = Date.now();
        
        // 控制绘制频率，减少CPU占用
        if (now - this.lastDrawTime >= this.drawInterval) {
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                try {
                    // 清除canvas以避免残留图像
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // 将video画面绘制到canvas（用于二维码识别）
                    // 确保完整绘制，保持视频比例
                    this.ctx.drawImage(
                        this.video, 
                        0, 0, this.video.videoWidth, this.video.videoHeight,
                        0, 0, this.canvas.width, this.canvas.height
                    );
                    this.lastDrawTime = now;
                } catch (error) {
                    console.warn('绘制视频帧失败:', error);
                    // 绘制失败时也要停止循环
                    return;
                }
            }
        }

        // 只有在所有条件都满足时才继续绘制下一帧
        if (this.video && this.canvas && this.ctx && this.stream) {
            this.drawFrameId = requestAnimationFrame(() => {
                this.drawVideoFrame();
            });
        } else {
            // 绘制资源已释放，停止绘制循环
        }
    }

    /**
     * 获取当前图像数据
     * @returns {ImageData|null} 图像数据
     */
    getImageData() {
        if (!this.canvas || !this.ctx) {
            console.warn('getImageData: canvas或context不存在');
            return null;
        }

        // 检查canvas尺寸
        if (this.canvas.width <= 0 || this.canvas.height <= 0) {
            console.warn('getImageData: canvas尺寸无效', {
                width: this.canvas.width,
                height: this.canvas.height
            });
            return null;
        }

        try {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // 验证获取的ImageData
            if (!imageData || !imageData.data || imageData.data.length === 0) {
                console.warn('getImageData: 获取的ImageData无效');
                return null;
            }
            
            // 验证数据长度是否与尺寸匹配
            const expectedLength = this.canvas.width * this.canvas.height * 4;
            if (imageData.data.length !== expectedLength) {
                console.warn('getImageData: 数据长度不匹配', {
                    expected: expectedLength,
                    actual: imageData.data.length,
                    width: this.canvas.width,
                    height: this.canvas.height
                });
                return null;
            }
            
            return imageData;
        } catch (error) {
            console.error('getImageData: 获取图像数据失败', error);
            return null;
        }
    }

    /**
     * 停止摄像头
     */
    async stop() {
        try {
            // 停止绘制循环
            if (this.drawFrameId) {
                cancelAnimationFrame(this.drawFrameId);
                this.drawFrameId = null;
            }

            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }

            if (this.video) {
                this.video.srcObject = null;
                // 注意：video元素由UIManager管理，不在这里删除
                this.video = null;
            }

            // 重置状态
            this.lastDrawTime = 0;

            // 摄像头已停止
        } catch (error) {
            console.error('停止摄像头失败:', error);
        }
    }

    /**
     * 检查摄像头权限
     */
    async checkCameraPermission() {
        try {
            // 检查是否为HTTPS环境
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                throw new Error('摄像头访问需要HTTPS环境，当前为HTTP协议。请使用HTTPS访问或在localhost环境下测试。');
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('当前浏览器不支持摄像头访问功能');
            }

            // 尝试获取权限状态
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'camera' });
                if (permission.state === 'denied') {
                    throw new Error('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问');
                }
            }

            // 尝试访问摄像头验证权限
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('检查摄像头权限失败:', error);
            
            // 根据错误类型提供更友好的提示
            if (error.name === 'NotAllowedError') {
                throw new Error('摄像头权限被拒绝，请允许访问摄像头权限');
            } else if (error.name === 'NotFoundError') {
                throw new Error('未检测到摄像头设备');
            } else if (error.name === 'NotSupportedError' || error.name === 'OverconstrainedError') {
                throw new Error('摄像头不支持请求的配置');
            } else if (error.message.includes('HTTPS')) {
                throw error; // 直接抛出HTTPS相关错误
            } else {
                throw new Error('无法访问摄像头: ' + error.message);
            }
        }
    }

    /**
     * 内部方法：更新canvas尺寸（根据设备类型采用不同策略）
     */
    updateCanvasSizeInternal(videoWidth, videoHeight) {
        if (!this.canvas || !videoWidth || !videoHeight) {
            return;
        }
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - 60; // 减去导航栏高度
        const isMobile = this.isMobileDevice();
        const videoAspectRatio = videoWidth / videoHeight;
        
        let canvasWidth, canvasHeight;
        
        if (isMobile) {
            // 手机端：全屏显示，保持视频比例填充
            const screenAspectRatio = screenWidth / screenHeight;
            
            if (videoAspectRatio > screenAspectRatio) {
                // 视频更宽，以高度为准
                canvasHeight = screenHeight;
                canvasWidth = canvasHeight * videoAspectRatio;
            } else {
                // 视频更高，以宽度为准
                canvasWidth = screenWidth;
                canvasHeight = canvasWidth / videoAspectRatio;
            }
        } else {
            // PC/平板端：高度铺满，宽度最大600px
            const maxWidth = 600;
            
            // 以高度为基准计算宽度
            canvasHeight = screenHeight;
            canvasWidth = canvasHeight * videoAspectRatio;
            
            // 如果宽度超过最大限制，则以宽度为准
            if (canvasWidth > maxWidth) {
                canvasWidth = maxWidth;
                canvasHeight = canvasWidth / videoAspectRatio;
            }
        }
        
        this.canvas.width = Math.round(canvasWidth);
        this.canvas.height = Math.round(canvasHeight);
        
        // Canvas尺寸已更新（内部调用）
        
        // 通知主程序视频尺寸已确定
        if (this.onVideoSizeReady && typeof this.onVideoSizeReady === 'function') {
            this.onVideoSizeReady(videoWidth, videoHeight);
        }
    }

    /**
     * 直接显示canvas（在视频尺寸无效时的备用方案）
     */
    showCanvasDirectly() {
        if (!this.canvas) return;
        
        // 延迟显示，避免iOS Safari的闪烁问题
        setTimeout(() => {
            if (this.canvas) {
                this.canvas.style.opacity = '1';
                // Canvas已直接显示（备用方案）
            }
        }, 200); // 稍长延迟，确保iOS Safari处理完毕
    }

    /**
     * 检查是否支持摄像头
     */
    static async isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * 获取可用摄像头列表
     */
    static async getCameras() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return [];
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('获取摄像头列表失败:', error);
            return [];
        }
    }
}

export default CameraScanner; 