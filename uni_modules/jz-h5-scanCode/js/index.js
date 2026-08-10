/**
 * jz-h5-scanCode 扫码插件主入口
 * 提供与uni.scanCode一致的API接口
 * H5环境使用自定义扫码实现，其他平台使用uni原生扫码
 */

import CameraScanner from './cameraScanner.js'
import QRCodeDecoder from './qrCodeDecoder.js'
import UIManager from './uiManager.js'
import WorkerManager from './workerManager.js'

class JzH5ScanCode {
    constructor() {
        this.cameraScanner = new CameraScanner();
        this.qrCodeDecoder = new QRCodeDecoder();
        this.uiManager = new UIManager();
        this.workerManager = null; // Web Worker管理器，延迟初始化
        this.isScanning = false;
        this.isInitializing = false;
        this.currentOptions = null;
        this.scanAnimationId = null;
        this.scanLoopActive = false;
        this.lastScanTime = 0;
        this.scanInterval = 600; // 增加扫码间隔到600ms，进一步减少CPU占用
        this.isDecoding = false; // 添加解码状态标记，避免重复解码
        this.maxConcurrentDecodes = 1; // 限制并发解码数量
        this.currentDecodeCount = 0; // 当前解码任务数量
        this.isDestroyed = false; // 添加销毁状态标记
        this.memoryCheckInterval = null; // 内存检查定时器
        this.scanCount = 0; // 扫码次数计数
        this.maxScanCount = 1000; // 最大扫码次数，超过后重启解码器
        
        // 绑定事件处理器，确保this指向正确且可以正确移除
        this.boundHandleUIClose = this.handleUIClose.bind(this);
        this.boundHandleFileSelected = this.handleFileSelected.bind(this);
        this.boundHandleUniImageSelected = this.handleUniImageSelected.bind(this);
        
        // 预初始化解码器（后台进行）
        this.preInitializeDecoder();
        
        // 初始化Worker管理器
        this.initWorkerManager();
    }

    /**
     * 预初始化解码器（后台异步进行）
     */
    async preInitializeDecoder() {
        try {
            // 使用 setTimeout 确保不阻塞主线程
            setTimeout(async () => {
                await this.qrCodeDecoder.init();
                // 解码器预初始化完成
            }, 100);
        } catch (error) {
            console.warn('解码器预初始化失败:', error);
        }
    }

    /**
     * 初始化Worker管理器（后台异步进行）
     */
    async initWorkerManager() {
        try {
            // 延迟初始化Worker管理器以避免阻塞
            setTimeout(async () => {
                try {
                    this.workerManager = new WorkerManager();
                    const initialized = await this.workerManager.init();
                    
                    if (initialized) {
                        // 设置进度回调
                        this.workerManager.setProgressCallback((message, progress) => {
                            if (this.uiManager && this.uiManager.updateProcessingProgress) {
                                this.uiManager.updateProcessingProgress(message, progress);
                            }
                        });
                        
                        // Worker管理器初始化完成
                    } else {
                        console.warn('Worker管理器初始化失败，将使用主线程处理图片');
                    }
                } catch (error) {
                    console.warn('Worker管理器创建失败:', error.message);
                    this.workerManager = null;
                }
            }, 200);
        } catch (error) {
            console.warn('Worker管理器初始化异常:', error);
        }
    }

    /**
     * 检查当前是否为H5环境
     */
    isH5Environment() {
        // 检查是否在uni-app的H5环境中
        if (typeof uni !== 'undefined' && uni.getSystemInfoSync) {
            try {
                const systemInfo = uni.getSystemInfoSync();
                return systemInfo.platform === 'devtools' || systemInfo.uniPlatform === 'web';
            } catch (error) {
                console.warn('获取系统信息失败:', error);
            }
        }
        
        // 检查是否在浏览器环境中
        return typeof window !== 'undefined' && typeof document !== 'undefined' && !window.plus && !window.wx && !window.my;
    }

    /**
     * 扫码方法 - 与uni.scanCode API保持一致
     * @param {Object} options - 扫码参数
     */
    scanCode(options = {}) {
        // 防止重复调用
        if (this.isScanning || this.isInitializing) {
            console.warn('扫码正在进行中，忽略重复调用');
            if (options.fail) {
                options.fail({ errMsg: 'scanCode:fail busy' });
            }
            if (options.complete) {
                options.complete({ errMsg: 'scanCode:fail busy' });
            }
            return;
        }

        // 如果不是H5环境，直接使用uni.scanCode
        if (!this.isH5Environment()) {
            return this.useUniScanCode(options);
        }

        // H5环境使用自定义扫码实现
        return this.useH5ScanCode(options);
    }

    /**
     * 使用uni原生扫码接口
     */
    useUniScanCode(options) {
        if (typeof uni === 'undefined' || !uni.scanCode) {
            const error = '当前环境不支持uni.scanCode';
            if (options.fail) {
                options.fail({ errMsg: error });
            }
            if (options.complete) {
                options.complete({ errMsg: error });
            }
            return;
        }

                    // 使用uni原生扫码接口
        uni.scanCode(options);
    }

    /**
     * 使用H5自定义扫码实现
     */
    async useH5ScanCode(options) {
        if (this.isInitializing) {
            console.warn('扫码初始化中，请稍后重试');
            if (options.fail) {
                options.fail({ errMsg: 'scanCode:fail initializing' });
            }
            if (options.complete) {
                options.complete({ errMsg: 'scanCode:fail initializing' });
            }
            return;
        }

        // 第二次调用时确保完全重置状态
        if (this.isScanning || this.uiManager.isUICreated()) {
            // 检测到第二次调用，先清理之前的状态
            await this.stopScan();
            await new Promise(resolve => setTimeout(resolve, 100)); // 等待清理完成
        }

        this.isInitializing = true;
        
        try {
            // 使用H5自定义扫码实现
            this.currentOptions = options;

            // 使用 Promise 和 setTimeout 避免阻塞
            await new Promise(resolve => setTimeout(resolve, 0));

            // 快速检查摄像头支持情况（不等待权限）
            const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            
            // 如果明确要求仅相册或没有摄像头API，直接进入图片选择模式
            if (options.onlyFromCamera === false || !hasMediaDevices) {
                await this.startImagePickerMode();
                return;
            }

            // 先创建UI，获取canvas元素
            const canvasElement = await this.createScannerUI(options);
            
            // 然后使用真实的canvas初始化摄像头
            const cameraResult = await Promise.allSettled([
                this.checkAndInitCamera(options, canvasElement)
            ]);

            // 检查摄像头初始化结果
            if (cameraResult[0].status === 'rejected') {
                // 摄像头初始化失败，降级到图片选择模式
                
                // 停止扫描状态，避免后续操作
                this.isScanning = false;
                
                // 清理已创建的UI
                this.uiManager.removeScannerUI();
                
                // 短暂延迟后启动图片选择模式，给UI清理时间
                setTimeout(async () => {
                    await this.startImagePickerMode();
                }, 100);
                return;
            }
            
            // 绑定事件（必须在UI创建后）
            this.bindUIEvents();
            
            // 延迟启动扫码循环，确保摄像头完全准备就绪
            this.isScanning = true;
            setTimeout(() => {
                if (this.isScanning && !this.isDestroyed) {
                    this.startScanLoop();
                }
            }, 300); // 给摄像头一些时间完全启动
            
            // 启动内存监控
            this.startMemoryMonitor();

                            // H5扫码已启动
            
        } catch (error) {
            console.error('启动扫码失败:', error);
            
            // 清理状态
            this.cleanup();
            
            // 尝试降级到图片选择模式
            if (this.isCameraError(error)) {
                // 摄像头相关错误，尝试降级到图片选择模式
                try {
                    await this.startImagePickerMode();
                    return;
                } catch (fallbackError) {
                    console.error('图片选择模式也失败:', fallbackError);
                }
            }
            
            const errorMsg = 'scanCode:fail ' + error.message;
            if (options.fail) {
                options.fail({ errMsg: errorMsg });
            }
            if (options.complete) {
                options.complete({ errMsg: errorMsg });
            }
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * 创建扫码UI（异步，非阻塞）
     */
    async createScannerUI(options) {
        return new Promise((resolve, reject) => {
            try {
                // 使用 setTimeout 确保不阻塞主线程
                setTimeout(() => {
                    try {
                        const uiOptions = {
                            scanFrameColor: options.scanFrameColor || '#00ff00'
                        };
                        const canvasElement = this.uiManager.createScannerUI(uiOptions);
                        
                        // 根据参数配置UI
                        this.configureUI(options);
                        
                        resolve(canvasElement);
                    } catch (error) {
                        reject(error);
                    }
                }, 10);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 检查并初始化摄像头（异步，带超时）
     */
    async checkAndInitCamera(options, canvasElement, timeout = 5000) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('摄像头初始化超时'));
            }, timeout);

            try {
                // 检查摄像头可用性（快速检查）
                const cameraSupported = await this.checkCameraAvailability();
                if (!cameraSupported) {
                    clearTimeout(timeoutId);
                    reject(new Error('摄像头不可用'));
                    return;
                }

                // 等待解码器就绪（带超时）
                await this.waitForDecoderReady(2000);

                // 初始化摄像头
                const cameraConfig = this.buildCameraConfig(options);
                
                // 使用UI中的真实canvas进行初始化，传入视频尺寸回调
                const onVideoSizeReady = (videoWidth, videoHeight) => {
                    // 视频尺寸确定后，更新UI中canvas的尺寸
                    if (this.uiManager && this.uiManager.updateCanvasSize) {
                        this.uiManager.updateCanvasSize(videoWidth, videoHeight);
                    }
                };
                await this.cameraScanner.init(canvasElement, cameraConfig, onVideoSizeReady);

                clearTimeout(timeoutId);
                resolve();
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * 检查摄像头可用性（优化版，减少等待时间）
     */
    async checkCameraAvailability() {
        try {
            // 快速检查基础API支持
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return false;
            }

            // 使用Promise.race添加超时机制
            const checkPromise = this.performCameraCheck();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('检查超时')), 3000)
            );

            const result = await Promise.race([checkPromise, timeoutPromise]);
            return result;
        } catch (error) {
            // 摄像头检查失败
            return false;
        }
    }

    /**
     * 执行摄像头检查
     */
    async performCameraCheck() {
        try {
            // 检查设备列表
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            
            if (!hasCamera) {
                return false;
            }

            // 尝试获取摄像头权限（快速测试）
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            // 立即关闭流
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            // 摄像头权限或可用性检查失败
            return false;
        }
    }

    /**
     * 启动图片选择模式（优化版 - 使用uniapp API）
     */
    async startImagePickerMode() {
        try {
            // 启动图片选择模式
            
            // 确保解码器就绪
            await this.waitForDecoderReady(3000);
            
            // 检查是否在uniapp环境中
            if (typeof uni !== 'undefined' && uni.chooseImage) {
                // 使用uniapp的chooseImage API
                return this.useUniChooseImage();
            } else {
                // 降级到HTML5方式，但移除capture属性
                return this.useHtml5ImagePicker();
            }
            
        } catch (error) {
            console.error('启动图片选择模式失败:', error);
            
            // 隐藏处理提示
            if (this.uiManager && this.uiManager.hideProcessingTip) {
                this.uiManager.hideProcessingTip();
            }
            
            // 处理启动失败的错误
            this.handleScanError('图片选择功能启动失败: ' + error.message);
            throw error;
        }
    }

    /**
     * 使用uniapp的chooseImage API选择图片
     */
    async useUniChooseImage() {
        return new Promise((resolve, reject) => {
            // 使用uni.chooseImage选择图片
            
                    uni.chooseImage({
            count: 1, // 只允许选择一张图片
            sourceType: ['album', 'camera'], // 允许从相册选择和拍照
            sizeType: ['compressed'], // 优先使用压缩图，减少文件大小
                success: async (res) => {
                    try {
                        // 用户选择了图片
                        
                        // 处理选择的图片
                        await this.processUniSelectedImage(res.tempFilePaths[0]);
                        resolve();
                    } catch (error) {
                        console.error('处理选择的图片失败:', error);
                        
                        // 隐藏处理提示
                        if (this.uiManager && this.uiManager.hideProcessingTip) {
                            this.uiManager.hideProcessingTip();
                        }
                        
                        // 处理错误，避免重复弹窗
                        if (!error.message.includes('图片处理失败') && !error.message.includes('图片加载失败')) {
                            this.handleScanError(error.message || '图片处理失败');
                        }
                        reject(error);
                    }
                },
                fail: (error) => {
                    // 用户取消选择图片或选择失败
                    this.handleScanCancel();
                    resolve(); // 用户取消不算错误
                },
                complete: () => {
                    // 图片选择操作完成
                }
            });
        });
    }

    /**
     * 使用HTML5方式选择图片（降级方案）
     */
    async useHtml5ImagePicker() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    // 添加capture属性，支持拍照选项
                    fileInput.capture = 'environment'; // 支持拍照，使用后置摄像头
                    fileInput.style.display = 'none';
                    
                    document.body.appendChild(fileInput);
                    
                    const cleanup = () => {
                        if (document.body.contains(fileInput)) {
                            document.body.removeChild(fileInput);
                        }
                    };
                    
                    fileInput.addEventListener('change', async (event) => {
                        const file = event.target.files[0];
                        cleanup();
                        if (file) {
                            try {
                                await this.processSelectedImage(file);
                                resolve();
                            } catch (error) {
                                console.error('处理HTML5选择的图片失败:', error);
                                
                                // 隐藏处理提示
                                if (this.uiManager && this.uiManager.hideProcessingTip) {
                                    this.uiManager.hideProcessingTip();
                                }
                                
                                // 处理错误，避免重复弹窗
                                if (!error.message.includes('图片处理失败') && !error.message.includes('图片加载失败')) {
                                    this.handleScanError(error.message || '图片处理失败');
                                }
                                reject(error);
                            }
                        } else {
                            this.handleScanCancel();
                            resolve();
                        }
                    });
                    
                    // 添加取消处理
                    const handleCancel = () => {
                        cleanup();
                        this.handleScanCancel();
                        resolve();
                    };
                    
                    // 监听窗口焦点，检测用户是否取消了文件选择
                    let focusHandler;
                    const setupCancelDetection = () => {
                        focusHandler = () => {
                            setTimeout(() => {
                                if (!fileInput.files.length) {
                                    window.removeEventListener('focus', focusHandler);
                                    handleCancel();
                                }
                            }, 300);
                        };
                        window.addEventListener('focus', focusHandler);
                    };
                    
                    setupCancelDetection();
                    fileInput.click();
                    
                } catch (error) {
                    console.error('图片处理过程中发生错误:', error);
                    
                    // 隐藏处理提示
                    if (this.uiManager && this.uiManager.hideProcessingTip) {
                        this.uiManager.hideProcessingTip();
                    }
                    
                    // 不在这里调用handleScanError，让外层处理
                    reject(error);
                }
            }, 10);
        });
    }

    /**
     * 处理uniapp选择的图片（支持图片压缩）
     */
    async processUniSelectedImage(tempFilePath) {
        // 增加重试机制，特别针对拍照生成的临时文件
        return this.processUniSelectedImageWithRetry(tempFilePath, 3);
    }

    /**
     * 带重试机制的uniapp图片处理
     */
    async processUniSelectedImageWithRetry(tempFilePath, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // 处理uniapp图片
                
                // 对于拍照生成的图片，添加延迟确保文件完全写入
                if (attempt > 1 && (tempFilePath.includes('blob:') || tempFilePath.includes('camera') || tempFilePath.includes('tmp_'))) {
                    const delay = attempt * 500; // 递增延迟
                    // 延迟后重试
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                return await this.processUniSelectedImageCore(tempFilePath);
            } catch (error) {
                console.warn(`图片处理尝试 ${attempt} 失败:`, error.message);
                
                // 如果是最后一次尝试，抛出错误
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // 如果不是拍照相关的错误，不需要重试
                if (!this.shouldRetryImageProcessing(error, tempFilePath)) {
                    throw error;
                }
            }
        }
    }

    /**
     * 判断是否应该重试图片处理
     */
    shouldRetryImageProcessing(error, tempFilePath) {
        const errorMessage = error.message || '';
        const isCameraOrTempFile = tempFilePath.includes('blob:') || 
                                   tempFilePath.includes('camera') || 
                                   tempFilePath.includes('tmp_') || 
                                   tempFilePath.includes('temp');
        
        // 只对拍照或临时文件的加载失败进行重试
        return isCameraOrTempFile && (
            errorMessage.includes('图片加载失败') || 
            errorMessage.includes('拍照图片处理失败') ||
            errorMessage.includes('图片处理超时')
        );
    }

    /**
     * uniapp图片处理核心逻辑
     */
    async processUniSelectedImageCore(tempFilePath) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                
                // 设置超时
                const timeoutId = setTimeout(() => {
                    reject(new Error('图片处理超时'));
                }, 15000); // 增加超时时间到15秒
                
                const cleanup = () => {
                    clearTimeout(timeoutId);
                };
                
                img.onload = async () => {
                    cleanup();
                    try {
                        // 记录原始图片尺寸
                        
                        // 检查图片是否正确加载
                        if (!img.naturalWidth || !img.naturalHeight) {
                            throw new Error('图片数据无效');
                        }
                        
                        // 显示处理进度
                        if (this.uiManager && this.uiManager.showProcessingTip) {
                            this.uiManager.showProcessingTip('正在分析图片...', 0);
                        }
                        
                        // 防止立即失败 - 添加延迟让UI显示
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // 检查图片尺寸，使用Worker处理压缩
                        let processedImage = img;
                        const originalSize = img.naturalWidth * img.naturalHeight;
                        const fileSize = 0; // uniapp图片没有文件大小信息
                        
                        try {
                            if (originalSize > 4000000) { // 超过4MP
                                // 启用极限压缩模式
                                processedImage = await this.processImageWithWorker(img, 'extreme');
                            } else if (img.naturalWidth > 800 || img.naturalHeight > 800) {
                                // 启用标准压缩
                                processedImage = await this.processImageWithWorker(img, 'standard');
                            } else {
                                // 小图片，更新进度
                                if (this.uiManager && this.uiManager.updateProcessingProgress) {
                                    this.uiManager.updateProcessingProgress('图片尺寸合适，无需压缩', 100);
                                }
                            }
                        } catch (compressError) {
                            console.warn('Worker压缩失败，使用降级处理:', compressError.message);
                            
                            // 更新进度提示
                            if (this.uiManager && this.uiManager.updateProcessingProgress) {
                                this.uiManager.updateProcessingProgress('使用备用处理方案...', 30);
                            }
                            
                            try {
                                // 降级到原有的压缩方法
                                if (originalSize > 4000000) {
                                    processedImage = await this.extremeCompressForScan(img);
                                } else if (img.naturalWidth > 800 || img.naturalHeight > 800) {
                                    processedImage = await this.compressImageForScan(img, 800, 400, 0.6);
                                }
                            } catch (fallbackError) {
                                console.error('降级处理也失败:', fallbackError.message);
                                
                                // 隐藏处理提示
                                if (this.uiManager && this.uiManager.hideProcessingTip) {
                                    this.uiManager.hideProcessingTip();
                                }
                                
                                const error = '图片处理失败，请选择其他图片';
                                this.handleScanError(error);
                                reject(new Error(error));
                                return;
                            }
                        }
                        
                        // 使用 setTimeout 避免阻塞
                        setTimeout(async () => {
                            try {
                                const scanTypes = this.currentOptions?.scanType || [];
                                // 开始解码图片
                                
                                // 设置解码超时
                                const timeoutPromise = new Promise((_, timeoutReject) => {
                                    setTimeout(() => timeoutReject(new Error('uniapp图片解码超时')), 8000); // 8秒超时
                                });
                                
                                const decodePromise = this.qrCodeDecoder.decode(processedImage, scanTypes);
                                
                                // 使用Promise.race确保超时控制
                                const result = await Promise.race([decodePromise, timeoutPromise]);
                                
                                if (result) {
                                    // 图片解码成功
                                    
                                    // 显示成功提示
                                    if (this.uiManager && this.uiManager.hideProcessingTip) {
                                        this.uiManager.hideProcessingTip();
                                    }
                                    if (this.uiManager && this.uiManager.showSuccessTip) {
                                        this.uiManager.showSuccessTip('识别成功！');
                                    }
                                    
                                    // 先处理成功回调，再隐藏界面
                                    this.handleScanSuccess(result, 'album');
                                    
                                    // 图片处理完成后隐藏扫描界面
                                    this.hideScannerUIAfterImageProcess(true, '识别成功');
                                    
                                    resolve(result);
                                } else {
                                    // 图片中未找到条码
                                    
                                    // 隐藏处理提示
                                    if (this.uiManager && this.uiManager.hideProcessingTip) {
                                        this.uiManager.hideProcessingTip();
                                    }
                                    
                                    const error = '图片中未找到指定类型的条码';
                                    
                                    // 调用handleScanError来触发fail回调，确保页面状态正确重置
                                    this.handleScanError(error);
                                    
                                    // 不要直接隐藏界面，让handleScanError来处理
                                    // this.hideScannerUIAfterImageProcess(false, error);
                                    
                                    reject(new Error(error));
                                }
                            } catch (error) {
                                // 隐藏处理提示（如果存在）
                                if (this.uiManager && this.uiManager.hideProcessingTip) {
                                    this.uiManager.hideProcessingTip();
                                }
                                
                                let errorMessage = 'uniapp图片解码失败: ' + error.message;
                                if (error.message && error.message.includes('超时')) {
                                    errorMessage = '图片处理超时，请选择更小或更清晰的图片';
                                }
                                
                                // 图片解码异常
                                
                                // 调用handleScanError来触发fail回调，确保页面状态正确重置
                                this.handleScanError(errorMessage);
                                
                                // 不要直接隐藏界面，让handleScanError来处理
                                // this.hideScannerUIAfterImageProcess(false, errorMessage);
                                
                                reject(error);
                            }
                        }, 100); // 增加延迟到100ms
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = (event) => {
                    cleanup();
                    console.error('图片加载失败:', tempFilePath, event);
                    
                    // 隐藏处理提示（如果存在）
                    if (this.uiManager && this.uiManager.hideProcessingTip) {
                        this.uiManager.hideProcessingTip();
                    }
                    
                    // 改进错误判断逻辑，避免将拍照生成的blob图片误判为格式不支持
                    let errorMessage = '图片加载失败';
                    
                    // 优先检查是否是拍照或临时文件
                    if (tempFilePath.includes('camera') || 
                        tempFilePath.includes('tmp_') || 
                        tempFilePath.includes('temp') ||
                        tempFilePath.includes('blob:') ||  // blob通常是拍照生成的
                        tempFilePath.includes('wxfile://')) {
                        errorMessage = '拍照图片处理失败，请重新拍照或从相册选择其他图片';
                    } else if (tempFilePath.includes('file://') && !tempFilePath.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
                        // 只有当文件扩展名明确不支持时才提示格式问题
                        errorMessage = '图片格式可能不支持，请选择jpg、png、gif或webp格式的图片';
                    } else {
                        errorMessage = '图片加载失败，请重新选择图片';
                    }
                    
                    // 错误详情记录
                    
                    this.handleScanError(errorMessage);
                    reject(new Error(errorMessage));
                };
                
                // 处理图片路径，确保兼容性
                try {
                    // 对于uniapp临时文件，不设置跨域属性（扩展检测范围）
                    if (tempFilePath.includes('tmp_') || 
                        tempFilePath.includes('temp') || 
                        tempFilePath.includes('wxfile://') ||
                        tempFilePath.includes('blob:') ||
                        tempFilePath.includes('file://') ||
                        tempFilePath.includes('_doc/') ||
                        tempFilePath.includes('_documents/') ||
                        tempFilePath.includes('camera') ||
                        tempFilePath.match(/\w+:\/\/.*\.(jpg|jpeg|png|gif|webp)/i)) {
                        // 检测到uniapp临时文件，使用兼容模式
                        // 不设置crossOrigin，避免跨域问题
                    } else if (tempFilePath.startsWith('http')) {
                        // 检测到网络图片，设置跨域模式
                        img.crossOrigin = 'anonymous';
                    }
                    
                    // 设置图片路径
                    
                    // 添加图片加载成功回调用于调试
                    const originalOnLoad = img.onload;
                    img.onload = function() {
                        // 图片加载成功
                        originalOnLoad.call(this);
                    };
                    
                    img.src = tempFilePath;
                } catch (pathError) {
                    console.error('图片路径处理失败:', pathError);
                    cleanup();
                    const error = '图片路径无效，请重新选择';
                    this.handleScanError(error);
                    reject(new Error(error));
                }
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 处理选择的图片（优化版，支持图片压缩）
     */
    async processSelectedImage(file) {
        return new Promise((resolve, reject) => {
            try {
                // 开始处理选择的图片
                
                const img = new Image();
                const reader = new FileReader();
                
                // 设置超时
                const timeoutId = setTimeout(() => {
                    reject(new Error('图片处理超时'));
                }, 15000); // 增加超时时间到15秒
                
                const cleanup = () => {
                    clearTimeout(timeoutId);
                };
                
                img.onload = async () => {
                    cleanup();
                    try {
                        // 记录原始图片尺寸和文件大小
                        
                        // 检查图片是否正确加载
                        if (!img.naturalWidth || !img.naturalHeight) {
                            throw new Error('图片数据无效');
                        }
                        
                        // 显示处理进度
                        if (this.uiManager && this.uiManager.showProcessingTip) {
                            this.uiManager.showProcessingTip('正在分析图片...', 0);
                        }
                        
                        // 防止立即失败 - 添加延迟让UI显示
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // 检查图片尺寸，使用Worker处理压缩
                        let processedImage = img;
                        const originalSize = img.naturalWidth * img.naturalHeight;
                        
                        try {
                            if (originalSize > 4000000 || file.size > 3 * 1024 * 1024) { // 4MP或3MB
                                // 启用极限压缩模式
                                processedImage = await this.processImageWithWorker(img, 'extreme');
                            } else if (img.naturalWidth > 800 || img.naturalHeight > 800 || file.size > 1 * 1024 * 1024) {
                                // 启用标准压缩
                                processedImage = await this.processImageWithWorker(img, 'standard');
                            } else {
                                // 小图片，更新进度
                                if (this.uiManager && this.uiManager.updateProcessingProgress) {
                                    this.uiManager.updateProcessingProgress('图片尺寸合适，无需压缩', 100);
                                }
                            }
                        } catch (compressError) {
                            console.warn('Worker压缩失败，使用降级处理:', compressError.message);
                            
                            // 更新进度提示
                            if (this.uiManager && this.uiManager.updateProcessingProgress) {
                                this.uiManager.updateProcessingProgress('使用备用处理方案...', 30);
                            }
                            
                            try {
                                // 降级到原有的压缩方法
                                if (originalSize > 4000000 || file.size > 3 * 1024 * 1024) {
                                    processedImage = await this.extremeCompressForScan(img);
                                } else if (img.naturalWidth > 800 || img.naturalHeight > 800 || file.size > 1 * 1024 * 1024) {
                                    processedImage = await this.compressImageForScan(img, 800, 400, 0.6);
                                }
                            } catch (fallbackError) {
                                console.error('降级处理也失败:', fallbackError.message);
                                
                                // 隐藏处理提示
                                if (this.uiManager && this.uiManager.hideProcessingTip) {
                                    this.uiManager.hideProcessingTip();
                                }
                                
                                const error = '图片处理失败，请选择其他图片';
                                this.handleScanError(error);
                                reject(new Error(error));
                                return;
                            }
                        }
                        
                        // 使用 setTimeout 避免阻塞
                        setTimeout(async () => {
                            try {
                                const scanTypes = this.currentOptions?.scanType || [];
                                // 开始解码图片
                                
                                // 设置解码超时
                                const timeoutPromise = new Promise((_, timeoutReject) => {
                                    setTimeout(() => timeoutReject(new Error('图片解码超时')), 8000); // 8秒超时
                                });
                                
                                const decodePromise = this.qrCodeDecoder.decode(processedImage, scanTypes);
                                
                                // 使用Promise.race确保超时控制
                                const result = await Promise.race([decodePromise, timeoutPromise]);
                                
                                if (result) {
                                    // 图片解码成功
                                    
                                    // 显示成功提示
                                    if (this.uiManager && this.uiManager.hideProcessingTip) {
                                        this.uiManager.hideProcessingTip();
                                    }
                                    if (this.uiManager && this.uiManager.showSuccessTip) {
                                        this.uiManager.showSuccessTip('识别成功！');
                                    }
                                    
                                    this.handleScanSuccess(result, 'album');
                                    resolve(result);
                                } else {
                                    const error = '图片中未找到指定类型的条码';
                                    this.handleScanError(error);
                                    reject(new Error(error));
                                }
                            } catch (error) {
                                // 隐藏处理提示（如果存在）
                                if (this.uiManager && this.uiManager.hideProcessingTip) {
                                    this.uiManager.hideProcessingTip();
                                }
                                
                                let errorMessage = '图片解码失败: ' + error.message;
                                if (error.message && error.message.includes('超时')) {
                                    errorMessage = '图片处理超时，请选择更小或更清晰的图片';
                                }
                                
                                this.handleScanError(errorMessage);
                                reject(error);
                            }
                        }, 100); // 增加延迟到100ms
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    cleanup();
                    const error = '图片加载失败';
                    this.handleScanError(error);
                    reject(new Error(error));
                };
                
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                
                reader.onerror = () => {
                    cleanup();
                    const error = '文件读取失败';
                    this.handleScanError(error);
                    reject(new Error(error));
                };
                
                reader.readAsDataURL(file);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 处理扫码取消
     */
    handleScanCancel() {
        this.cleanup();
        
        if (this.currentOptions) {
            const errorMsg = 'scanCode:fail cancel';
            if (this.currentOptions.fail) {
                this.currentOptions.fail({ errMsg: errorMsg });
            }
            if (this.currentOptions.complete) {
                this.currentOptions.complete({ errMsg: errorMsg });
            }
        }
    }

    /**
     * 清理资源和状态
     */
    cleanup() {
        this.isScanning = false;
        this.isInitializing = false;
        this.scanLoopActive = false;
        this.isDecoding = false; // 重置解码状态
        this.currentDecodeCount = 0; // 重置解码任务计数
        this.scanCount = 0; // 重置扫码计数
        
        if (this.scanAnimationId) {
            cancelAnimationFrame(this.scanAnimationId);
            this.scanAnimationId = null;
        }
        
        // 停止内存监控
        this.stopMemoryMonitor();
        
        // 强制垃圾回收提示
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
            } catch (e) {
                // 忽略垃圾回收错误
            }
        }
    }

    /**
     * 判断是否为摄像头相关错误
     */
    isCameraError(error) {
        const errorMessage = error.message || error.toString();
        const cameraErrorKeywords = [
            'camera', 'getUserMedia', 'permission', 'NotAllowedError',
            'NotFoundError', 'NotReadableError', 'OverconstrainedError',
            'AbortError', '摄像头', '权限', '超时'
        ];
        
        return cameraErrorKeywords.some(keyword => 
            errorMessage.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    /**
     * 根据参数配置UI
     */
    configureUI(options) {
        // 使用 setTimeout 避免阻塞
        setTimeout(() => {
            const { onlyFromCamera } = options;
            
            if (onlyFromCamera) {
                const albumBtn = document.querySelector('.jz-scanner-select');
                if (albumBtn) {
                    albumBtn.style.display = 'none';
                }
            }
        }, 10);
    }

    /**
     * 构建摄像头配置
     */
    buildCameraConfig(options) {
        return {
            width: 1280,
            height: 720,
            facingMode: 'environment'
        };
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        document.addEventListener('jz-scanner-close', this.boundHandleUIClose);
        document.addEventListener('jz-scanner-file-selected', this.boundHandleFileSelected);
        document.addEventListener('jz-scanner-uni-image-selected', this.boundHandleUniImageSelected);
        // UI事件已绑定
    }

    /**
     * 解绑UI事件
     */
    unbindUIEvents() {
        document.removeEventListener('jz-scanner-close', this.boundHandleUIClose);
        document.removeEventListener('jz-scanner-file-selected', this.boundHandleFileSelected);
        document.removeEventListener('jz-scanner-uni-image-selected', this.boundHandleUniImageSelected);
        // UI事件已解绑
    }

    /**
     * 等待解码器初始化完成（优化版）
     */
    async waitForDecoderReady(timeout = 3000) {
        const startTime = Date.now();
        
        while (!(await this.qrCodeDecoder.isReady())) {
            if (Date.now() - startTime > timeout) {
                throw new Error('解码器初始化超时');
            }
            // 使用更短的等待间隔，但通过 requestAnimationFrame 优化
            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));
        }
        
        // 解码器已就绪
    }

    /**
     * 停止扫码
     */
    async stopScan() {
        try {
            // 标记为已销毁，防止新的操作
            this.isDestroyed = true;
            
            // 清理状态
            this.cleanup();
            
            // 等待所有解码任务完成或超时
            await this.waitForDecodeCompletion(2000);
            
            // 停止摄像头
            await this.cameraScanner.stop();
            
            // 清理UI
            this.uiManager.removeScannerUI();
            this.unbindUIEvents();
            
            // 清理当前选项
            this.currentOptions = null;
            
            // 扫码已完全停止
        } catch (error) {
            console.error('停止扫码失败:', error);
        } finally {
            // 确保状态重置
            this.isDestroyed = false;
        }
    }

    /**
     * 销毁扫码器实例，彻底清理所有资源
     */
    destroy() {
        // 销毁扫码器实例
        
        // 标记为已销毁
        this.isDestroyed = true;
        // 停止所有操作
        this.stopScan();
        // 销毁子组件
        if (this.qrCodeDecoder && typeof this.qrCodeDecoder.destroy === 'function') {
            this.qrCodeDecoder.destroy();
        }
        // 销毁Worker管理器
        if (this.workerManager && typeof this.workerManager.destroy === 'function') {
            this.workerManager.destroy();
        }
        // 清理引用
        this.cameraScanner = null;
        this.qrCodeDecoder = null;
        this.uiManager = null;
        this.workerManager = null;
        this.currentOptions = null;
        
        // 解绑事件处理器
        this.boundHandleUIClose = null;
        this.boundHandleFileSelected = null;
        this.boundHandleUniImageSelected = null;
        // 扫码器实例已销毁
    }

    /**
     * 启动内存监控
     */
    startMemoryMonitor() {
        // 每30秒检查一次内存状态
        this.memoryCheckInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 30000);
    }

    /**
     * 停止内存监控
     */
    stopMemoryMonitor() {
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
            this.memoryCheckInterval = null;
        }
    }

    /**
     * 检查内存使用情况
     */
    checkMemoryUsage() {
        try {
            if (performance.memory) {
                const memInfo = performance.memory;
                const usedPercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
                
                // 内存使用监控
                
                // 如果内存使用超过80%，触发清理
                if (usedPercent > 80) {
                    console.warn('内存使用过高，触发清理');
                    this.forceCleanup();
                }
            }
        } catch (error) {
            console.warn('内存检查失败:', error);
        }
    }

    /**
     * 强制清理内存
     */
    forceCleanup() {
        // 执行强制内存清理
        
        // 暂停扫码
        const wasScanning = this.isScanning;
        this.isScanning = false;
        
        // 等待当前解码完成
        setTimeout(async () => {
            try {
                // 重启解码器
                await this.restartDecoder();
                
                // 恢复扫码
                if (wasScanning) {
                    this.isScanning = true;
                }
                
                // 强制清理完成
            } catch (error) {
                console.error('强制清理失败:', error);
            }
        }, 500);
    }

    /**
     * 重启解码器
     */
    async restartDecoder() {
        try {
            // 重启解码器
            
            // 销毁旧的解码器
            if (this.qrCodeDecoder && typeof this.qrCodeDecoder.destroy === 'function') {
                this.qrCodeDecoder.destroy();
            }
            
            // 创建新的解码器
            this.qrCodeDecoder = new QRCodeDecoder();
            await this.qrCodeDecoder.init();
            
            // 重置计数器
            this.scanCount = 0;
            
            // 解码器重启完成
        } catch (error) {
            console.error('重启解码器失败:', error);
        }
    }

    /**
     * 针对扫码优化的图片压缩（分片处理，防止卡死）
     * @param {HTMLImageElement} img - 原始图片
     * @param {number} maxSize - 最大尺寸
     * @param {number} minSize - 最小尺寸
     * @param {number} quality - 压缩质量 (0-1)
     * @returns {HTMLCanvasElement} 压缩后的图片canvas
     */
    async compressImageForScan(img, maxSize = 800, minSize = 400, quality = 0.6) {
        return new Promise((resolve, reject) => {
            try {
                // 显示处理提示
                if (this.uiManager && this.uiManager.showProcessingTip) {
                    this.uiManager.showProcessingTip('正在优化图片...');
                }
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 计算最优压缩尺寸（针对扫码优化）
                let { width, height } = this.calculateOptimalScanSize(
                    img.naturalWidth, 
                    img.naturalHeight, 
                    maxSize,
                    minSize
                );
                
                canvas.width = width;
                canvas.height = height;
                
                // 扫码优化压缩
                
                // 使用快速渲染模式，优先性能
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium'; // 降低质量，提高速度
                
                // 分片处理大图片，避免一次性处理导致卡死
                this.drawImageInChunks(ctx, img, width, height)
                    .then(() => {
                        // 释放原始图片内存
                        if (img.src && typeof img.src === 'string') {
                            img.src = '';
                        }
                        
                        // 隐藏处理提示
                        if (this.uiManager && this.uiManager.hideProcessingTip) {
                            this.uiManager.hideProcessingTip();
                        }
                        
                        // 扫码优化压缩完成
                        resolve(canvas);
                    })
                    .catch(reject);
                
            } catch (error) {
                console.error('扫码图片压缩失败:', error);
                
                // 隐藏处理提示
                if (this.uiManager && this.uiManager.hideProcessingTip) {
                    this.uiManager.hideProcessingTip();
                }
                
                reject(error);
            }
        });
    }

    /**
     * 分片绘制图片，避免大图片一次性处理导致卡死
     */
    async drawImageInChunks(ctx, img, targetWidth, targetHeight) {
        return new Promise((resolve, reject) => {
            try {
                const chunkSize = 200; // 每次处理200px的区块
                let currentY = 0;
                
                const drawChunk = () => {
                    if (currentY >= targetHeight) {
                        resolve();
                        return;
                    }
                    
                    const chunkHeight = Math.min(chunkSize, targetHeight - currentY);
                    const sourceY = (currentY / targetHeight) * img.naturalHeight;
                    const sourceHeight = (chunkHeight / targetHeight) * img.naturalHeight;
                    
                    try {
                        // 绘制当前区块
                        ctx.drawImage(
                            img,
                            0, sourceY, img.naturalWidth, sourceHeight,
                            0, currentY, targetWidth, chunkHeight
                        );
                        
                        currentY += chunkHeight;
                        
                        // 使用 setTimeout 避免阻塞主线程
                        setTimeout(drawChunk, 10); // 每10ms处理一个区块
                        
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
     * 极限压缩方法（防止超大图片卡死）
     * @param {HTMLImageElement} img - 原始图片
     * @returns {HTMLCanvasElement} 极限压缩后的图片canvas
     */
    async extremeCompressForScan(img) {
        return new Promise((resolve, reject) => {
            try {
                // 启动极限压缩模式
                
                // 显示处理提示
                if (this.uiManager && this.uiManager.showProcessingTip) {
                    this.uiManager.showProcessingTip('正在极限压缩图片，请稍候...');
                }
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 极限压缩：固定为400px正方形，最低质量
                const targetSize = 400;
                canvas.width = targetSize;
                canvas.height = targetSize;
                
                // 极限压缩
                
                // 使用最快的渲染模式
                ctx.imageSmoothingEnabled = false; // 关闭抗锯齿，提高速度
                
                // 分多次绘制，避免一次性处理大图
                setTimeout(() => {
                    try {
                        // 直接绘制到目标尺寸，浏览器会自动缩放
                        ctx.drawImage(img, 0, 0, targetSize, targetSize);
                        
                        // 立即释放原图内存
                        if (img.src && typeof img.src === 'string') {
                            img.src = '';
                        }
                        
                        // 隐藏处理提示
                        if (this.uiManager && this.uiManager.hideProcessingTip) {
                            this.uiManager.hideProcessingTip();
                        }
                        
                        // 极限压缩完成
                        resolve(canvas);
                        
                    } catch (error) {
                        console.error('极限压缩失败:', error);
                        
                        // 隐藏处理提示
                        if (this.uiManager && this.uiManager.hideProcessingTip) {
                            this.uiManager.hideProcessingTip();
                        }
                        
                        reject(error);
                    }
                }, 100); // 延迟100ms执行，确保UI更新
                
            } catch (error) {
                console.error('极限压缩初始化失败:', error);
                reject(error);
            }
        });
    }

    /**
     * 使用Worker处理图片
     * @param {HTMLImageElement} img - 原始图片
     * @param {string} mode - 处理模式: 'standard' | 'extreme'
     * @returns {HTMLCanvasElement} 处理后的图片canvas
     */
    async processImageWithWorker(img, mode = 'standard') {
        if (!this.workerManager) {
            throw new Error('Worker管理器未初始化');
        }

        try {
            // 将图片转换为ImageData
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let result;
            const onProgress = (message, progress) => {
                if (this.uiManager && this.uiManager.updateProcessingProgress) {
                    this.uiManager.updateProcessingProgress(message, progress);
                }
            };

            if (mode === 'extreme') {
                // 使用极限压缩（不支持Worker时会自动降级）
                result = await this.workerManager.compressImage(imageData, 400, 400, 0.4, onProgress);
            } else {
                // 使用标准压缩
                result = await this.workerManager.compressImage(imageData, 800, 400, 0.6, onProgress);
            }

            if (!result || !result.imageData) {
                throw new Error('Worker处理返回无效结果');
            }

            // 将结果转换为Canvas
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = result.imageData.width;
            resultCanvas.height = result.imageData.height;
            resultCtx.putImageData(result.imageData, 0, 0);

                                    // Worker压缩完成

            return resultCanvas;
        } catch (error) {
            console.error('Worker图片处理失败:', error.message);
            throw new Error('图片处理失败: ' + error.message);
        }
    }

    /**
     * 压缩图片（兼容旧方法）
     * @param {HTMLImageElement} img - 原始图片
     * @param {number} maxSize - 最大尺寸
     * @param {number} quality - 压缩质量 (0-1)
     * @returns {HTMLCanvasElement} 压缩后的图片canvas
     */
    async compressImage(img, maxSize = 800, quality = 0.6) {
        // 检查是否需要极限压缩
        const originalSize = img.naturalWidth * img.naturalHeight;
        
        // 尝试使用Worker处理
        if (this.workerManager) {
            try {
                const mode = originalSize > 4000000 ? 'extreme' : 'standard';
                return await this.processImageWithWorker(img, mode);
            } catch (error) {
                console.warn('Worker处理失败，降级到主线程:', error.message);
            }
        }
        
        // 降级到原有方法
        if (originalSize > 4000000) { // 超过4MP使用极限压缩
            return this.extremeCompressForScan(img);
        }
        
        // 否则使用标准扫码压缩
        return this.compressImageForScan(img, maxSize, 400, quality);
    }

    /**
     * 计算针对扫码优化的尺寸
     * @param {number} originalWidth - 原始宽度
     * @param {number} originalHeight - 原始高度
     * @param {number} maxSize - 最大尺寸限制
     * @param {number} minSize - 最小尺寸限制
     * @returns {Object} 优化后的尺寸
     */
    calculateOptimalScanSize(originalWidth, originalHeight, maxSize, minSize) {
        let width = originalWidth;
        let height = originalHeight;
        
        // 计算压缩比例
        const ratio = Math.min(maxSize / width, maxSize / height);
        
        if (ratio < 1) {
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        
        // 确保不小于最小尺寸（保证扫码质量）
        if (width < minSize && height < minSize) {
            const minRatio = Math.max(minSize / width, minSize / height);
            width = Math.floor(width * minRatio);
            height = Math.floor(height * minRatio);
        }
        
        // 针对扫码场景，优先正方形比例
        const avgSize = Math.floor((width + height) / 2);
        if (avgSize <= maxSize && avgSize >= minSize) {
            // 使用更小的正方形尺寸，有利于扫码识别
            const squareSize = Math.min(avgSize, 600); // 最大600px正方形
            return { width: squareSize, height: squareSize };
        }
        
        return { width, height };
    }

    /**
     * 计算压缩后的尺寸（兼容旧方法）
     * @param {number} originalWidth - 原始宽度
     * @param {number} originalHeight - 原始高度
     * @param {number} maxSize - 最大尺寸限制
     * @returns {Object} 压缩后的尺寸
     */
    calculateCompressedSize(originalWidth, originalHeight, maxSize) {
        return this.calculateOptimalScanSize(originalWidth, originalHeight, maxSize, 400);
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 等待解码任务完成
     */
    async waitForDecodeCompletion(timeout = 2000) {
        const startTime = Date.now();
        
        while (this.currentDecodeCount > 0 && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (this.currentDecodeCount > 0) {
            console.warn(`解码任务未能在${timeout}ms内完成，强制清理`);
            this.currentDecodeCount = 0;
            this.isDecoding = false;
        }
    }

    /**
     * 处理UI关闭事件
     */
    handleUIClose() {
        // 处理UI关闭事件
        
        if (this.isScanning || this.isInitializing) {
            this.stopScan();
            
            if (this.currentOptions) {
                const errorMsg = 'scanCode:fail cancel';
                
                if (this.currentOptions.fail) {
                    this.currentOptions.fail({ errMsg: errorMsg });
                }
                if (this.currentOptions.complete) {
                    this.currentOptions.complete({ errMsg: errorMsg });
                }
            }
        } else {
            this.uiManager.removeScannerUI();
            this.unbindUIEvents();
        }
    }

    /**
     * 处理uniapp选择图片事件（支持图片压缩）
     * 重构：统一使用processUniSelectedImage方法，避免重复处理
     */
    async handleUniImageSelected(event) {
        const tempFilePath = event.detail.tempFilePath;
        if (!tempFilePath || !this.qrCodeDecoder) {
            return;
        }

        try {
            // UI事件：开始处理uniapp选择的图片
            
            // 统一使用processUniSelectedImage方法，避免重复处理逻辑
            await this.processUniSelectedImage(tempFilePath);
            
        } catch (error) {
            console.error('UI事件处理失败:', error);
            // 确保界面被隐藏
            this.hideScannerUIAfterImageProcess(false, error.message || '图片处理失败');
        }
    }

    /**
     * 统一处理图片处理完成后的界面隐藏
     * @param {boolean} success - 是否成功
     * @param {string} message - 消息内容
     */
    hideScannerUIAfterImageProcess(success, message = '') {
        // 图片处理完成，准备隐藏扫描界面
        
        // 对于失败的情况，只在控制台记录，不显示弹窗
        if (!success) {
            console.warn('图片处理失败:', message);
        }
        
        // 延迟隐藏界面，确保用户能看到结果
        const hideDelay = success ? 1000 : 1500; // 成功1秒后隐藏，失败1.5秒后隐藏
        
        setTimeout(() => {
            try {
                // 隐藏任何可能存在的错误提示
                if (this.uiManager && this.uiManager.hideProcessingTip) {
                    this.uiManager.hideProcessingTip();
                }
                
                // 停止扫码并清理资源
                this.stopScan();
                
                // 扫描界面已隐藏
            } catch (error) {
                console.error('隐藏扫描界面时出错:', error);
            }
        }, hideDelay);
    }

    /**
     * 处理选择图片事件（支持图片压缩）
     */
    async handleFileSelected(event) {
        const file = event.detail.file;
        if (!file || !this.qrCodeDecoder) {
            return;
        }

        try {
            // 开始扫描图片文件
            
            // 异步处理，避免阻塞
            setTimeout(async () => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        // UI HTML5图片尺寸记录
                        
                        // 检查图片尺寸，极限压缩策略防止卡死
                        let processedImage = img;
                        const originalSize = img.naturalWidth * img.naturalHeight;
                        
                        // 如果图片过大（超过4MP）或文件太大，进行极限压缩
                        if (originalSize > 4000000 || file.size > 3 * 1024 * 1024) { // 4MP或3MB
                            // UI HTML5启用极限压缩模式
                            processedImage = await this.extremeCompressForScan(img);
                        } else if (img.naturalWidth > 800 || img.naturalHeight > 800 || file.size > 1 * 1024 * 1024) {
                            // UI HTML5启用标准压缩
                            processedImage = await this.compressImageForScan(img, 800, 400, 0.6);
                        }
                        
                        const scanTypes = this.currentOptions?.scanType || [];
                        // 开始解码UI HTML5选择的图片
                        
                        const result = await this.qrCodeDecoder.decode(processedImage, scanTypes);
                        
                        if (result) {
                            // UI图片扫码成功
                            this.handleScanSuccess(result, 'album');
                            
                            // 图片处理完成后隐藏扫描界面
                            this.hideScannerUIAfterImageProcess(true, '识别成功');
                        } else {
                            // UI图片中未找到条码
                            
                            const error = '图片中未找到指定类型的条码';
                            // 调用handleScanError来触发fail回调，确保页面状态正确重置
                            this.handleScanError(error);
                            
                            // 不要直接隐藏界面，让handleScanError来处理
                            // this.hideScannerUIAfterImageProcess(false, '图片中未找到指定类型的条码');
                        }
                    } catch (error) {
                        console.error('图片扫码失败:', error);
                        
                        const errorMsg = '图片扫码失败: ' + error.message;
                        // 调用handleScanError来触发fail回调，确保页面状态正确重置
                        this.handleScanError(errorMsg);
                        
                        // 不要直接隐藏界面，让handleScanError来处理
                        // this.hideScannerUIAfterImageProcess(false, '图片扫码失败: ' + error.message);
                    }
                };
                
                img.onerror = () => {
                                            // UI HTML5图片加载失败
                    
                    const error = '图片加载失败';
                    // 调用handleScanError来触发fail回调，确保页面状态正确重置
                    this.handleScanError(error);
                    
                    // 不要直接隐藏界面，让handleScanError来处理
                    // this.hideScannerUIAfterImageProcess(false, '图片加载失败');
                };
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                                            // UI HTML5文件读取失败
                    
                    const error = '文件读取失败';
                    // 调用handleScanError来触发fail回调，确保页面状态正确重置
                    this.handleScanError(error);
                    
                    // 不要直接隐藏界面，让handleScanError来处理
                    // this.hideScannerUIAfterImageProcess(false, '文件读取失败');
                };
                reader.readAsDataURL(file);
            }, 50); // 增加延迟，确保UI响应
            
        } catch (error) {
            console.error('处理图片文件失败:', error);
            
            const errorMsg = '处理图片文件失败';
            // 调用handleScanError来触发fail回调，确保页面状态正确重置
            this.handleScanError(errorMsg);
            
            // 不要直接隐藏界面，让handleScanError来处理
            // this.hideScannerUIAfterImageProcess(false, '处理图片文件失败');
        }
    }

    /**
     * 扫码循环（优化版，防止卡顿）
     */
    startScanLoop() {
        if (!this.isScanning || this.scanLoopActive || this.isDestroyed) {
            return;
        }

        this.scanLoopActive = true;
        
        const scanFrame = async () => {
            // 检查状态，如果已销毁或停止扫码则退出
            if (!this.isScanning || !this.scanLoopActive || this.isDestroyed) {
                this.scanLoopActive = false;
                return;
            }

            const now = Date.now();
            
            // 控制扫码频率，避免过于频繁
            if (now - this.lastScanTime < this.scanInterval) {
                this.scanAnimationId = requestAnimationFrame(scanFrame);
                return;
            }

            // 严格的并发控制：如果已达到最大并发数或正在解码，跳过本次扫码
            if (this.isDecoding || this.currentDecodeCount >= this.maxConcurrentDecodes) {
                this.scanAnimationId = requestAnimationFrame(scanFrame);
                return;
            }

            this.lastScanTime = now;

            try {
                const imageData = this.cameraScanner.getImageData();
                
                // 验证imageData的有效性
                if (imageData && this.isScanning && imageData.data && imageData.width > 0 && imageData.height > 0) {
                    const scanTypes = this.currentOptions?.scanType || [];
                    
                    // 标记开始解码并增加计数
                    this.isDecoding = true;
                    this.currentDecodeCount++;
                    
                    // 使用 Promise 而不是 setTimeout，更好的错误处理
                    this.performDecode(imageData, scanTypes)
                        .finally(() => {
                            // 解码完成，重置标记和减少计数
                            this.isDecoding = false;
                            this.currentDecodeCount = Math.max(0, this.currentDecodeCount - 1);
                        });
                } else if (imageData === null) {
                    // 如果获取不到imageData，可能是canvas还没准备好，这是正常的，静默跳过
                    // console.debug('暂时无法获取图像数据，跳过本次扫码');
                }
            } catch (error) {
                console.warn('扫码过程中出错:', error);
                this.isDecoding = false;
                this.currentDecodeCount = Math.max(0, this.currentDecodeCount - 1);
            }

            // 继续下一帧
            if (this.isScanning && this.scanLoopActive) {
                this.scanAnimationId = requestAnimationFrame(scanFrame);
            }
        };

        this.scanAnimationId = requestAnimationFrame(scanFrame);
    }

    /**
     * 执行解码操作（独立方法，便于管理）
     */
    async performDecode(imageData, scanTypes) {
        return new Promise((resolve) => {
            // 使用 setTimeout 避免阻塞主线程，增加延迟
            setTimeout(async () => {
                try {
                    // 双重检查状态
                    if (!this.isScanning || this.isDestroyed) {
                        resolve();
                        return;
                    }

                    // 验证imageData的有效性
                    if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
                        console.debug('performDecode: 无效的图像数据，跳过本次解码');
                        resolve();
                        return;
                    }

                    if (imageData.width <= 0 || imageData.height <= 0) {
                        console.debug('performDecode: 图像尺寸无效，跳过本次解码');
                        resolve();
                        return;
                    }

                    // 增加扫码计数
                    this.scanCount++;
                    
                    // 检查是否需要重启解码器
                    if (this.scanCount >= this.maxScanCount) {
                        // 达到最大扫码次数，重启解码器
                        await this.restartDecoder();
                    }

                    const result = await this.qrCodeDecoder.decode(imageData, scanTypes);
                    if (result && this.isScanning && !this.isDestroyed) {
                        // 摄像头扫码成功
                        this.handleScanSuccess(result, 'camera');
                    }
                } catch (error) {
                    // 忽略解码错误，继续扫码
                    console.debug('解码失败，继续扫码:', error.message);
                } finally {
                    resolve();
                }
            }, 100); // 增加延迟到100ms，进一步减少CPU压力
        });
    }

    /**
     * 处理扫码成功
     */
    handleScanSuccess(result, imageChannel = 'camera') {
        // 扫码成功
        
        // 立即停止扫码循环
        this.cleanup();
        
        // 震动反馈
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // 构建返回数据
        const scanResult = this.buildScanResult(result, imageChannel);

        // 异步执行清理和回调，避免阻塞
        setTimeout(() => {
            this.stopScan();
            
            if (this.currentOptions) {
                if (this.currentOptions.success) {
                    this.currentOptions.success(scanResult);
                }
                if (this.currentOptions.complete) {
                    this.currentOptions.complete(scanResult);
                }
            }
        }, 0);
    }

    /**
     * 构建扫码结果，与uni.scanCode返回格式一致
     */
    buildScanResult(result, imageChannel) {
        const scanResult = {
            result: result.text,
            scanType: result.scanType || this.detectScanType(result.text),
            charSet: 'UTF-8',
            errMsg: 'scanCode:ok'
        };

        if (imageChannel) {
            scanResult.imageChannel = imageChannel;
        }

        if (result.format) {
            scanResult.format = result.format;
        }

        if (result.data) {
            try {
                scanResult.rawData = btoa(result.text);
            } catch (error) {
                scanResult.rawData = result.text;
            }
        }

        return scanResult;
    }

    /**
     * 检测扫码类型
     */
    detectScanType(content) {
        return 'qrCode';
    }

    /**
     * 处理扫码错误
     */
    handleScanError(error) {
        console.error('扫码错误:', error);
        this.cleanup();
        
        // 异步执行清理和回调
        setTimeout(() => {
            this.stopScan();

            if (this.currentOptions) {
                const errorMsg = 'scanCode:fail ' + error;
                
                if (this.currentOptions.fail) {
                    this.currentOptions.fail({ errMsg: errorMsg });
                }
                if (this.currentOptions.complete) {
                    this.currentOptions.complete({ errMsg: errorMsg });
                }
            }
        }, 0);
    }

    /**
     * 检查是否支持摄像头
     */
    static async isCameraSupported() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return false;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取可用摄像头列表
     */
    static async getCameras() {
        return await CameraScanner.getCameras();
    }

    /**
     * 检查是否支持原生条码检测
     */
    static isBarcodeDetectorSupported() {
        return QRCodeDecoder.isBarcodeDetectorSupported();
    }

    /**
     * 获取支持的条码格式
     */
    static async getSupportedFormats() {
        return await QRCodeDecoder.getSupportedFormats();
    }

    /**
     * 获取插件信息
     */
    static getPluginInfo() {
        return {
            name: 'jz-h5-scanCode',
            version: '1.0.4',
            description: 'H5环境下的二维码扫描插件，与uni.scanCode API兼容',
            author: 'JZ',
            cameraSupported: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
            barcodeDetectorSupported: 'BarcodeDetector' in window,
            platforms: {
                h5: '自定义扫码实现',
                app: 'uni.scanCode',
                'mp-weixin': 'uni.scanCode',
                'mp-alipay': 'uni.scanCode',
                'mp-baidu': 'uni.scanCode'
            }
        };
    }
}

// 创建单例实例
let jzH5ScanCode = new JzH5ScanCode();

// 导出与uni.scanCode兼容的接口
export default {
    scanCode: (options) => jzH5ScanCode.scanCode(options),
    
    // 静态方法
    isCameraSupported: JzH5ScanCode.isCameraSupported,
    getCameras: JzH5ScanCode.getCameras,
    isBarcodeDetectorSupported: JzH5ScanCode.isBarcodeDetectorSupported,
    getSupportedFormats: JzH5ScanCode.getSupportedFormats,
    getPluginInfo: JzH5ScanCode.getPluginInfo,
    
    // 插件销毁方法
    destroy: () => {
        // 销毁当前实例
        if (jzH5ScanCode && typeof jzH5ScanCode.destroy === 'function') {
            jzH5ScanCode.destroy();
        }
        // 重新创建新实例，确保下次使用时正常工作
        jzH5ScanCode = new JzH5ScanCode();
    },
    // 便捷方法：直接扫描图片
    scanFromImage: (options = {}) => {
        return jzH5ScanCode.scanCode({
            ...options,
            onlyFromCamera: false,
        });
    },
    
    // 便捷方法：检查设备能力并选择最佳扫码模式
    smartScan: async (options = {}) => {
        const cameraSupported = await JzH5ScanCode.isCameraSupported();
        // 设备摄像头支持检查
        
        if (!cameraSupported) {
            // 摄像头不可用，使用图片选择模式
            return jzH5ScanCode.scanCode({
                ...options,
                onlyFromCamera: false,
            });
        } else {
            // 摄像头可用，使用标准扫码模式
            return jzH5ScanCode.scanCode(options);
        }
    },
    
    // 兼容旧版本的方法名
    startScan: (options) => {
        console.warn('startScan方法已废弃，请使用scanCode方法');
        return jzH5ScanCode.scanCode({
            success: options.onSuccess,
            fail: options.onError,
            ...options
        });
    }
};
