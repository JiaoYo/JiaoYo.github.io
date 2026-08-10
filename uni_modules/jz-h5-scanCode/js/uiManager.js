/**
 * UI管理器模块
 * 负责创建和管理扫码界面UI
 */

class UIManager {
    constructor() {
        this.scannerContainer = null;
        this.canvas = null;
        this.video = null;
        this.overlay = null;
        this.scanLine = null;
        this.scanLineAnimation = null;
        this.scanFrameColor = '#00ff00'; // 默认绿色
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
     * 创建扫码器UI - 微信风格全屏界面
     * @param {Object} options - UI配置选项
     * @returns {HTMLCanvasElement} canvas元素
     */
    createScannerUI(options = {}) {
        // 设置扫描框颜色
        if (options.scanFrameColor) {
            this.scanFrameColor = options.scanFrameColor;
        }
        // 如果已经存在，先移除
        this.removeScannerUI();

        // 创建全屏容器
        this.overlay = document.createElement('div');
        this.overlay.className = 'jz-scanner-fullscreen';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            z-index: 9999;
            display: flex;
            flex-direction: column;
        `;

        // 创建顶部导航栏
        const navbar = document.createElement('div');
        navbar.className = 'jz-scanner-navbar';
        navbar.style.cssText = `
            position: relative;
            height: 60px;
            background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 10001;
        `;

        // 左上角返回按钮
        const backButton = document.createElement('div');
        backButton.className = 'jz-scanner-back';
        backButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
        `;
        backButton.style.cssText = `
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 20px;
            background: rgba(255,255,255,0.1);
            transition: background 0.3s;
        `;

        // 标题
        const title = document.createElement('div');
        title.className = 'jz-scanner-title';
        title.textContent = '扫一扫';
        title.style.cssText = `
            color: white;
            font-size: 18px;
            font-weight: bold;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        `;

        // 右上角选择图片
        const selectImage = document.createElement('div');
        selectImage.className = 'jz-scanner-select';
        selectImage.textContent = '相册';
        selectImage.style.cssText = `
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 4px;
            background: rgba(255,255,255,0.1);
            transition: background 0.3s;
        `;

        // 组装导航栏
        navbar.appendChild(backButton);
        navbar.appendChild(title);
        navbar.appendChild(selectImage);

        // 创建扫码区域容器
        const scanArea = document.createElement('div');
        scanArea.className = 'jz-scanner-area';
        scanArea.style.cssText = `
            flex: 1;
            position: relative;
            overflow: hidden;
            height: calc(100vh - 60px);
            background-color: #000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // 检测设备类型，统一在方法开始时检测
        const isMobileDevice = this.isMobileDevice();

        // 创建video元素（用于显示摄像头画面）
        this.video = document.createElement('video');
        this.video.className = 'jz-scanner-video';
        this.video.setAttribute('playsinline', true);
        this.video.setAttribute('muted', true);
        this.video.setAttribute('autoplay', true);
        
        // 根据设备类型设置video样式
        if (isMobileDevice) {
            // 手机端：全屏覆盖
            this.video.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                background-color: #000;
            `;
        } else {
            // PC/平板端：居中显示，最大宽度600px
            this.video.style.cssText = `
                max-width: 600px;
                height: 100%;
                object-fit: contain;
                background-color: #000;
            `;
        }

        // 添加video事件监听，确保视频准备就绪时立即正确显示
        this.video.addEventListener('loadedmetadata', () => {
            // 视频metadata已加载
        });

        this.video.addEventListener('canplay', () => {
            // 视频可以开始播放
        });

        this.video.addEventListener('playing', () => {
            // 视频正在播放
        });

        // 创建canvas（用于扫码识别）
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'jz-scanner-canvas';
        
        // 先设置一个小的默认尺寸，避免初始显示异常
        // 实际尺寸将在摄像头准备就绪后设置
        this.canvas.width = 1;
        this.canvas.height = 1;
        
        // 根据设备类型设置不同的样式
        if (isMobileDevice) {
            // 手机端：全屏显示
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                pointer-events: none;
                object-fit: cover;
            `;
        } else {
            // PC/平板端：高度铺满，宽度最大600px，居中显示
            this.canvas.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                max-width: 600px;
                height: calc(100vh - 60px);
                opacity: 0;
                pointer-events: none;
                object-fit: contain;
            `;
        }

        // 创建扫描框遮罩
        const scanMask = document.createElement('div');
        scanMask.className = 'jz-scanner-mask';
        scanMask.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        `;

        // 创建扫描框
        const scanBox = document.createElement('div');
        scanBox.className = 'jz-scanner-box';
        const boxSize = Math.min(window.innerWidth, window.innerHeight) * 0.7;
        const boxTop = (window.innerHeight - 60 - boxSize) / 2;
        const boxLeft = (window.innerWidth - boxSize) / 2;
        
        scanBox.style.cssText = `
            position: absolute;
            top: ${boxTop}px;
            left: ${boxLeft}px;
            width: ${boxSize}px;
            height: ${boxSize}px;
            border: 2px solid rgba(255,255,255,0.5);
            border-radius: 12px;
            background: transparent;
            box-shadow: 
                0 0 0 2000px rgba(0,0,0,0.5),
                inset 0 0 0 1px rgba(255,255,255,0.2);
        `;

        // 创建四角标记
        this.createCornerMarkers(scanBox, boxSize);

        // 创建扫描线
        this.scanLine = document.createElement('div');
        this.scanLine.className = 'jz-scanner-line';
        this.scanLine.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            height: 3px;
            background: linear-gradient(90deg, transparent, ${this.scanFrameColor}, transparent);
            border-radius: 2px;
            box-shadow: 0 0 10px ${this.scanFrameColor};
        `;

        // 创建提示文字
        const hint = document.createElement('div');
        hint.className = 'jz-scanner-hint';
        hint.textContent = '将二维码放入框内，即可自动扫描';
        hint.style.cssText = `
            position: absolute;
            bottom: -60px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 16px;
            text-align: center;
            white-space: nowrap;
        `;

        // 组装扫描框
        scanBox.appendChild(this.scanLine);
        scanBox.appendChild(hint);
        scanMask.appendChild(scanBox);

        // 组装扫码区域
        scanArea.appendChild(this.video);
        scanArea.appendChild(this.canvas);
        scanArea.appendChild(scanMask);

        // 组装完整界面（移除底部功能区）
        this.overlay.appendChild(navbar);
        this.overlay.appendChild(scanArea);

        // 添加到body
        document.body.appendChild(this.overlay);

        // 添加事件监听（移除手电筒按钮参数）
        this.addEventListeners(backButton, selectImage);

        // 启动扫描线动画
        this.startScanLineAnimation();

        // 添加动画效果
        this.addShowAnimation();

        // 阻止页面滚动
        document.body.style.overflow = 'hidden';

        // 添加CSS样式
        this.addGlobalStyles();

        // 添加窗口大小变化监听
        this.addResizeListener();

        // UI已创建
        return this.canvas;
    }

    /**
     * 创建四角标记
     */
    createCornerMarkers(scanBox, boxSize) {
        const cornerSize = 20;
        const cornerThickness = 4;
        const corners = [
            { class: 'top-left', style: `top: -2px; left: -2px;` },
            { class: 'top-right', style: `top: -2px; right: -2px;` },
            { class: 'bottom-left', style: `bottom: -2px; left: -2px;` },
            { class: 'bottom-right', style: `bottom: -2px; right: -2px;` }
        ];

        corners.forEach(corner => {
            const marker = document.createElement('div');
            marker.className = `jz-corner ${corner.class}`;
            marker.style.cssText = `
                position: absolute;
                ${corner.style}
                width: ${cornerSize}px;
                height: ${cornerSize}px;
                border: ${cornerThickness}px solid ${this.scanFrameColor};
                border-radius: 4px;
            `;

            // 根据位置设置边框
            if (corner.class === 'top-left') {
                marker.style.borderRight = 'none';
                marker.style.borderBottom = 'none';
            } else if (corner.class === 'top-right') {
                marker.style.borderLeft = 'none';
                marker.style.borderBottom = 'none';
            } else if (corner.class === 'bottom-left') {
                marker.style.borderRight = 'none';
                marker.style.borderTop = 'none';
            } else if (corner.class === 'bottom-right') {
                marker.style.borderLeft = 'none';
                marker.style.borderTop = 'none';
            }

            scanBox.appendChild(marker);
        });
    }

    /**
     * 启动扫描线动画 - 优化版本
     */
    startScanLineAnimation() {
        if (!this.scanLine) return;

        let direction = 1;
        let position = 10;
        const maxPosition = this.scanLine.parentElement.offsetHeight - 30;
        let lastTime = 0;
        const animationInterval = 50; // 动画间隔，降低帧率

        const animate = (currentTime) => {
            if (currentTime - lastTime >= animationInterval) {
                position += direction * 3;
                
                if (position >= maxPosition) {
                    direction = -1;
                } else if (position <= 10) {
                    direction = 1;
                }

                this.scanLine.style.top = position + 'px';
                lastTime = currentTime;
            }
            
            this.scanLineAnimation = requestAnimationFrame(animate);
        };

        this.scanLineAnimation = requestAnimationFrame(animate);
    }

    /**
     * 停止扫描线动画
     */
    stopScanLineAnimation() {
        if (this.scanLineAnimation) {
            cancelAnimationFrame(this.scanLineAnimation);
            this.scanLineAnimation = null;
        }
    }

    /**
     * 添加事件监听
     */
    addEventListeners(backButton, selectImage) {
        // 返回按钮点击事件处理
        const handleBackClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 返回按钮被点击
            // 先派发关闭事件，让主逻辑处理
            const event = new CustomEvent('jz-scanner-close');
            document.dispatchEvent(event);
        };
        
        // 同时监听click和touchend事件，确保移动端兼容性
        backButton.addEventListener('click', handleBackClick);
        backButton.addEventListener('touchend', handleBackClick);

        // 选择图片按钮事件处理
        const handleSelectImage = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 相册按钮被点击
            
            // 优先使用uniapp API，否则降级到HTML5
            if (typeof uni !== 'undefined' && uni.chooseImage) {
                this.selectImageWithUni();
            } else {
                this.selectImageFile();
            }
        };
        
        selectImage.addEventListener('click', handleSelectImage);
        selectImage.addEventListener('touchend', handleSelectImage);

        // 添加悬停效果
        backButton.addEventListener('mouseenter', () => {
            backButton.style.background = 'rgba(255,255,255,0.2)';
        });
        backButton.addEventListener('mouseleave', () => {
            backButton.style.background = 'rgba(255,255,255,0.1)';
        });

        selectImage.addEventListener('mouseenter', () => {
            selectImage.style.background = 'rgba(255,255,255,0.2)';
        });
        selectImage.addEventListener('mouseleave', () => {
            selectImage.style.background = 'rgba(255,255,255,0.1)';
        });
    }

    /**
     * 使用uniapp API选择图片
     */
    selectImageWithUni() {
                    // 使用uni.chooseImage选择图片
        uni.chooseImage({
            count: 1, // 只允许选择一张图片
            sourceType: ['album', 'camera'], // 允许从相册选择和拍照
            sizeType: ['compressed'], // 优先使用压缩图，减少文件大小
            success: (res) => {
                                    // uniapp选择图片成功
                
                // 触发自定义事件，传递图片路径
                const customEvent = new CustomEvent('jz-scanner-uni-image-selected', {
                    detail: { 
                        tempFilePath: res.tempFilePaths[0],
                        tempFiles: res.tempFiles 
                    }
                });
                document.dispatchEvent(customEvent);
            },
            fail: (error) => {
                                    // uniapp选择图片失败或取消
                // 可以选择不触发任何事件，表示用户取消
            },
            complete: () => {
                                    // uniapp图片选择操作完成
            }
        });
    }

    /**
     * 选择图片文件（HTML5方式，降级方案）
     */
    selectImageFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        // 添加capture属性，支持拍照选项
        input.capture = 'environment'; // 支持拍照，使用后置摄像头
        input.style.display = 'none';
        
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const customEvent = new CustomEvent('jz-scanner-file-selected', {
                    detail: { file }
                });
                document.dispatchEvent(customEvent);
            }
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    /**
     * 获取video元素用于摄像头显示
     */
    getVideoElement() {
        return this.video;
    }

    /**
     * 移除扫码器UI
     */
    removeScannerUI() {
        this.stopScanLineAnimation();
        
        // 重置canvas状态，确保下次创建时状态正确
        if (this.canvas) {
            this.canvas.style.opacity = '0';
        }
        
        if (this.overlay && this.overlay.parentNode) {
            this.addHideAnimation(() => {
                this.overlay.parentNode.removeChild(this.overlay);
                this.overlay = null;
                this.canvas = null;
                this.video = null;
                this.scanLine = null;
                
                // 恢复页面滚动
                document.body.style.overflow = '';
                
                // 移除全局样式
                this.removeGlobalStyles();
                
                // 移除窗口大小变化监听
                this.removeResizeListener();
                
                // 扫码器UI已移除
            });
        } else {
            // 如果没有动画，直接清理
            this.overlay = null;
            this.canvas = null;
            this.video = null;
            this.scanLine = null;
            
            // 恢复页面滚动
            document.body.style.overflow = '';
            
            // 移除全局样式
            this.removeGlobalStyles();
            
            // 移除窗口大小变化监听
            this.removeResizeListener();
            
            // 扫码器UI已直接清理
        }
    }

    /**
     * 添加显示动画
     */
    addShowAnimation() {
        if (!this.overlay) return;

        this.overlay.style.opacity = '0';
        this.overlay.style.transform = 'scale(1.1)';
        this.overlay.style.transition = 'all 0.3s ease-out';

        // 强制重排
        this.overlay.offsetHeight;

        this.overlay.style.opacity = '1';
        this.overlay.style.transform = 'scale(1)';
    }

    /**
     * 添加隐藏动画
     */
    addHideAnimation(callback) {
        if (!this.overlay) {
            callback && callback();
            return;
        }

        this.overlay.style.transition = 'all 0.3s ease-in';
        this.overlay.style.opacity = '0';
        this.overlay.style.transform = 'scale(0.9)';

        setTimeout(() => {
            callback && callback();
        }, 300);
    }

    /**
     * 添加全局样式
     */
    addGlobalStyles() {
        if (document.getElementById('jz-scanner-styles')) return;

        const style = document.createElement('style');
        style.id = 'jz-scanner-styles';
        style.textContent = `
            @keyframes jz-scan-line {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(calc(100vh - 200px)); }
            }
            
            @keyframes jz-loading-spinner {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes jz-error-shake {
                0% { transform: translate(-50%, -50%) translateX(0); }
                25% { transform: translate(-50%, -50%) translateX(-10px); }
                50% { transform: translate(-50%, -50%) translateX(10px); }
                75% { transform: translate(-50%, -50%) translateX(-5px); }
                100% { transform: translate(-50%, -50%) translateX(0); }
            }
            
            @keyframes jz-success-appear {
                0% { 
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                100% { 
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            .jz-scanner-fullscreen * {
                box-sizing: border-box;
            }
            
            .jz-loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                animation: jz-loading-spinner 1s linear infinite;
            }
            
            .jz-progress-bar {
                width: 220px;
                height: 6px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                overflow: hidden;
                position: relative;
            }
            
            .jz-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #81C784);
                border-radius: 3px;
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
            }
            
            .jz-progress-text {
                font-size: 14px;
                opacity: 0.8;
                min-height: 18px;
            }
            
            .jz-processing-message {
                font-weight: 500;
                min-height: 20px;
            }
            
            @media (max-width: 480px) {
                .jz-scanner-navbar {
                    height: 50px !important;
                    padding: 0 15px !important;
                }
                .jz-scanner-title {
                    font-size: 16px !important;
                }
                .jz-scanner-select {
                    font-size: 14px !important;
                    padding: 6px 10px !important;
                }
                .jz-scanner-hint {
                    font-size: 14px !important;
                }
                .jz-loading-spinner {
                    width: 30px !important;
                    height: 30px !important;
                    border-width: 3px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 移除全局样式
     */
    removeGlobalStyles() {
        const style = document.getElementById('jz-scanner-styles');
        if (style) {
            style.parentNode.removeChild(style);
        }
    }

    /**
     * 显示扫码成功效果（已禁用）
     */
    showSuccessEffect() {
        // 不再显示成功弹窗，扫码成功后直接返回结果
        // 扫码成功，直接返回结果
    }

    /**
     * 显示错误信息
     */
    showErrorMessage(message) {
        if (!this.overlay) return;

        const errorTip = document.createElement('div');
        errorTip.className = 'jz-scanner-error';
        errorTip.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="3">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <div>${message}</div>
        `;
        errorTip.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(255, 255, 255, 0.95);
            color: #f44336;
            padding: 20px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10002;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: jz-error-shake 0.6s ease-out;
            max-width: 300px;
            text-align: center;
        `;

        this.overlay.appendChild(errorTip);

        setTimeout(() => {
            if (errorTip.parentNode) {
                errorTip.parentNode.removeChild(errorTip);
            }
        }, 3000);
    }

    /**
     * 显示处理提示
     */
    showProcessingTip(message = '正在处理...', progress = 0) {
        if (!this.overlay) return;

        // 移除已存在的提示
        this.hideProcessingTip();

        const processingTip = document.createElement('div');
        processingTip.className = 'jz-scanner-processing';
        processingTip.innerHTML = `
            <div class="jz-loading-spinner"></div>
            <div class="jz-processing-message">${message}</div>
            <div class="jz-progress-bar">
                <div class="jz-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="jz-progress-text">${progress}%</div>
        `;
        processingTip.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 25px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            z-index: 10003;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            box-shadow: 0 6px 25px rgba(0,0,0,0.6);
            min-width: 280px;
            max-width: 340px;
            text-align: center;
            backdrop-filter: blur(5px);
        `;

        this.overlay.appendChild(processingTip);
        this.processingTip = processingTip;
    }

    /**
     * 更新处理进度
     */
    updateProcessingProgress(message, progress = 0) {
        if (!this.processingTip) return;

        const messageEl = this.processingTip.querySelector('.jz-processing-message');
        const progressFill = this.processingTip.querySelector('.jz-progress-fill');
        const progressText = this.processingTip.querySelector('.jz-progress-text');

        if (messageEl) messageEl.textContent = message;
        if (progressFill) progressFill.style.width = progress + '%';
        if (progressText) progressText.textContent = progress + '%';
    }

    /**
     * 隐藏处理提示
     */
    hideProcessingTip() {
        if (this.processingTip && this.processingTip.parentNode) {
            // 添加淡出动画
            this.processingTip.style.opacity = '0';
            this.processingTip.style.transform = 'translate(-50%, -50%) scale(0.9)';
            
            setTimeout(() => {
                if (this.processingTip && this.processingTip.parentNode) {
                    this.processingTip.parentNode.removeChild(this.processingTip);
                    this.processingTip = null;
                }
            }, 200); // 200ms动画时间
        }
    }

    /**
     * 显示成功提示
     */
    showSuccessTip(message = '处理成功') {
        if (!this.overlay) return;

        const successTip = document.createElement('div');
        successTip.className = 'jz-scanner-success';
        successTip.innerHTML = `
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="3">
                <polyline points="20,6 9,17 4,12"/>
            </svg>
            <div>${message}</div>
        `;
        successTip.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(255, 255, 255, 0.95);
            color: #4CAF50;
            padding: 25px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10004;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            box-shadow: 0 6px 25px rgba(0,0,0,0.3);
            animation: jz-success-appear 0.3s ease-out;
            min-width: 200px;
            text-align: center;
        `;

        this.overlay.appendChild(successTip);

        setTimeout(() => {
            if (successTip.parentNode) {
                successTip.style.opacity = '0';
                successTip.style.transform = 'translate(-50%, -50%) scale(0.9)';
                setTimeout(() => {
                    if (successTip.parentNode) {
                        successTip.parentNode.removeChild(successTip);
                    }
                }, 200);
            }
        }, 1500);
    }

    /**
     * 动态更新canvas尺寸（当视频尺寸确定后调用）
     */
    updateCanvasSize(videoWidth, videoHeight) {
        if (!this.canvas || !videoWidth || !videoHeight) {
            return;
        }
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - 60; // 减去导航栏高度
        const isMobileDevice = this.isMobileDevice();
        const videoAspectRatio = videoWidth / videoHeight;
        
        let canvasWidth, canvasHeight;
        
        if (isMobileDevice) {
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
            
            // 设置canvas实际尺寸
            this.canvas.width = Math.round(canvasWidth);
            this.canvas.height = Math.round(canvasHeight);
            
            // 手机端CSS样式保持100%，由object-fit处理
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            
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
            
            // 设置canvas的实际渲染尺寸
            this.canvas.width = Math.round(canvasWidth);
            this.canvas.height = Math.round(canvasHeight);
            
            // 设置canvas的CSS显示尺寸，确保与实际尺寸一致
            this.canvas.style.width = this.canvas.width + 'px';
            this.canvas.style.height = this.canvas.height + 'px';
        }
        
        // UI中Canvas尺寸已更新
        
        // 尺寸确定后显示canvas，避免iOS Safari的闪烁问题
        this.showCanvas();
    }

    /**
     * 显示canvas（在尺寸确定后调用，避免iOS Safari闪烁）
     */
    showCanvas() {
        if (!this.canvas) return;
        
        // 延迟显示，确保尺寸调整完成
        setTimeout(() => {
            if (this.canvas) {
                this.canvas.style.opacity = '1';
                // Canvas已显示
            }
        }, 100); // 100ms延迟，给iOS Safari足够时间处理尺寸变更
    }

    /**
     * 添加窗口大小变化监听
     */
    addResizeListener() {
        this.handleResize = () => {
            if (this.canvas && this.video) {
                // 窗口大小变化时，重新计算canvas尺寸以避免拉伸
                const videoWidth = this.video.videoWidth;
                const videoHeight = this.video.videoHeight;
                
                if (videoWidth > 0 && videoHeight > 0) {
                    // 重新计算并更新canvas尺寸
                    this.updateCanvasSize(videoWidth, videoHeight);
                    // 窗口大小变化，重新计算canvas尺寸
                } else {
                    // 窗口大小变化，但视频尺寸无效
                }
            }
        };
        
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', this.handleResize);
    }

    /**
     * 移除窗口大小变化监听
     */
    removeResizeListener() {
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
            window.removeEventListener('orientationchange', this.handleResize);
            this.handleResize = null;
        }
    }

    /**
     * 获取当前canvas元素
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * 检查UI是否已创建
     */
    isUICreated() {
        return !!(this.overlay && this.canvas);
    }
}

export default UIManager; 