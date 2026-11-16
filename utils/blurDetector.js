/**
 * 图片模糊检测工具
 */

class BlurDetector {
	constructor() {
		this.canvas = null
		this.ctx = null
	}

	/**
	 * 检测图片模糊程度
	 */
	async detect(imagePath, threshold = 100, canvasOptions = {}) {
		try {
			const imageInfo = await this.getImageInfo(imagePath)

			const maxSize = 400
			let scale = 1
			let width = imageInfo.width
			let height = imageInfo.height

			if (width > maxSize || height > maxSize) {
				scale = maxSize / Math.max(width, height)
				width = Math.floor(width * scale)
				height = Math.floor(height * scale)
			}

			const imageData = await this.getImageData(imagePath, width, height, canvasOptions)
			const score = await this.calculateBlurScore(imageData)

			return {
				isBlur: score < threshold,
				score: score,
				threshold: threshold
			}
		} catch (err) {
			console.error('模糊检测失败:', err)
			throw err
		}
	}

	/**
	 * 获取图片信息
	 */
	getImageInfo(imagePath) {
		return new Promise((resolve, reject) => {
			uni.getImageInfo({
				src: imagePath,
				success: (res) => {
					resolve({
						width: res.width,
						height: res.height
					})
				},
				fail: (err) => {
					reject(new Error('获取图片信息失败: ' + JSON.stringify(err)))
				}
			})
		})
	}

	/**
	 * 获取图像数据 - 统一入口
	 */
	async getImageData(imagePath, width, height, canvasOptions = {}) {
		// #ifdef H5
		return this.getImageDataH5(imagePath, width, height)
		// #endif

		// #ifdef APP-PLUS
		return this.getImageDataApp(imagePath, width, height, canvasOptions)
		// #endif

		// #ifdef MP-WEIXIN
		return this.getImageDataWx(imagePath, width, height)
		// #endif

		// #ifdef MP-ALIPAY
		return this.getImageDataMiniProgram(imagePath, width, height)
		// #endif

		// #ifdef MP-BAIDU
		return this.getImageDataMiniProgram(imagePath, width, height)
		// #endif

		// #ifdef MP-TOUTIAO
		return this.getImageDataMiniProgram(imagePath, width, height)
		// #endif

		// #ifdef MP-QQ
		return this.getImageDataMiniProgram(imagePath, width, height)
		// #endif

		return this.getImageDataFallback(imagePath, width, height)
	}

	/**
	 * H5端获取图像数据
	 */
	getImageDataH5(imagePath, width, height) {
		return new Promise((resolve, reject) => {
			if (!this.canvas) {
				this.canvas = document.createElement('canvas')
				this.ctx = this.canvas.getContext('2d', {
					willReadFrequently: true
				})
			}

			const img = new Image()
			img.crossOrigin = 'anonymous'
			img.onload = () => {
				this.canvas.width = width
				this.canvas.height = height
				this.ctx.drawImage(img, 0, 0, width, height)
				try {
					const imageData = this.ctx.getImageData(0, 0, width, height)
					resolve({
						data: imageData.data,
						width: width,
						height: height
					})
				} catch (err) {
					reject(err)
				}
			}
			img.onerror = () => {
				reject(new Error('图片加载失败'))
			}
			img.src = imagePath
		})
	}

	/**
	 * App端获取图像数据 - 修复版
	 */
	getImageDataApp(imagePath, width, height, canvasOptions = {}) {
		return new Promise(async (resolve, reject) => {
			// 方案1: 使用 uni.canvasGetImageData (推荐)
			try {
				const result = await this._useCanvasGetImageData(imagePath, width, height,
					canvasOptions)
				resolve(result)
				return
			} catch (err) {
				console.warn('canvasGetImageData 方案失败:', err)
			}

			// 方案2: 使用原生 Bitmap (Android)
			// #ifdef APP-PLUS
			// #ifdef ANDROID
			try {
				const result = await this._useAndroidBitmap(imagePath, width, height)
				resolve(result)
				return
			} catch (err) {
				console.warn('Android Bitmap 方案失败:', err)
			}
			// #endif
			// #endif

			// 方案3: 降级方案 - 从文件信息估算
			try {
				const result = await this._estimateFromImageInfo(imagePath, width, height)
				resolve(result)
			} catch (err) {
				reject(new Error('App端图像处理失败: ' + err.message))
			}
		})
	}

	/**
	 * 使用 uni.canvasGetImageData - App端推荐方案
	 */
	_useCanvasGetImageData(imagePath, width, height, canvasOptions = {}) {
		return new Promise((resolve, reject) => {
			// 创建离屏 canvas
			const canvasId = 'blurDetectCanvas_' + Date.now()

			// 使用 uni.createOffscreenCanvas (App 3.0+)
			try {
				const offscreenCanvas = uni.createOffscreenCanvas({
					type: '2d',
					width: width,
					height: height
				})

				const ctx = offscreenCanvas.getContext('2d')

				// 加载图片
				const img = offscreenCanvas.createImage()
				img.onload = () => {
					ctx.drawImage(img, 0, 0, width, height)

					// 获取图像数据
					const imageData = ctx.getImageData(0, 0, width, height)
					resolve({
						data: imageData.data,
						width: width,
						height: height
					})
				}
				img.onerror = () => {
					reject(new Error('图片加载失败'))
				}
				img.src = imagePath
			} catch (err) {
				// 降级：使用页面上的 canvas 组件
				this._usePageCanvas(imagePath, width, height, canvasOptions)
					.then(resolve)
					.catch(reject)
			}
		})
	}

	/**
	 * 使用页面上的 canvas 组件
	 */
	_usePageCanvas(imagePath, width, height, canvasOptions = {}) {
		return new Promise((resolve, reject) => {
			const canvasId = canvasOptions.canvasId || 'blurDetectCanvas'

			// 获取 canvas 上下文
			const ctx = uni.createCanvasContext(canvasId)

			if (!ctx) {
				reject(new Error('无法获取 canvas 上下文'))
				return
			}

			// 绘制图片
			ctx.drawImage(imagePath, 0, 0, width, height)
			ctx.draw(false, () => {
				// 获取图像数据
				uni.canvasGetImageData({
					canvasId: canvasId,
					x: 0,
					y: 0,
					width: width,
					height: height,
					success: (res) => {
						resolve({
							data: res.data,
							width: width,
							height: height
						})
					},
					fail: (err) => {
						reject(new Error('获取图像数据失败: ' + JSON.stringify(err)))
					}
				})
			})
		})
	}

	/**
	 * Android平台使用Bitmap获取像素数据
	 */
	_useAndroidBitmap(imagePath, width, height) {
		return new Promise((resolve, reject) => {
			try {
				const main = plus.android.runtimeMainActivity()
				const BitmapFactory = plus.android.importClass('android.graphics.BitmapFactory')
				const Bitmap = plus.android.importClass('android.graphics.Bitmap')
				const Matrix = plus.android.importClass('android.graphics.Matrix')

				// 处理网络图片
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					uni.downloadFile({
						url: imagePath,
						success: (res) => {
							if (res.statusCode === 200) {
								this._processAndroidBitmap(res.tempFilePath, width, height,
										BitmapFactory, Bitmap, Matrix)
									.then(resolve)
									.catch(reject)
							} else {
								reject(new Error('图片下载失败'))
							}
						},
						fail: reject
					})
					return
				}

				// 处理本地图片
				this._processAndroidBitmap(imagePath, width, height, BitmapFactory, Bitmap, Matrix)
					.then(resolve)
					.catch(reject)
			} catch (err) {
				reject(err)
			}
		})
	}

	/**
	 * 处理 Android Bitmap
	 */
	_processAndroidBitmap(imagePath, width, height, BitmapFactory, Bitmap, Matrix) {
		return new Promise((resolve, reject) => {
			try {
				const filePath = imagePath.startsWith('file://') ? imagePath.substring(7) : imagePath
				const bitmap = BitmapFactory.decodeFile(filePath)

				if (!bitmap) {
					throw new Error('无法加载图片')
				}

				const originalWidth = bitmap.getWidth()
				const originalHeight = bitmap.getHeight()
				const scale = Math.min(width / originalWidth, height / originalHeight)

				const matrix = new Matrix()
				matrix.postScale(scale, scale)
				const scaledBitmap = Bitmap.createBitmap(bitmap, 0, 0, originalWidth, originalHeight,
					matrix, true)

				const w = scaledBitmap.getWidth()
				const h = scaledBitmap.getHeight()
				const pixels = []

				for (let y = 0; y < h; y++) {
					for (let x = 0; x < w; x++) {
						const color = scaledBitmap.getPixel(x, y)
						pixels.push(
							(color >> 16) & 0xFF,
							(color >> 8) & 0xFF,
							color & 0xFF,
							(color >> 24) & 0xFF
						)
					}
				}

				bitmap.recycle()
				scaledBitmap.recycle()

				resolve({
					data: new Uint8ClampedArray(pixels),
					width: w,
					height: h
				})
			} catch (err) {
				reject(err)
			}
		})
	}

	/**
	 * 从图片信息估算（降级方案）
	 */
	_estimateFromImageInfo(imagePath, width, height) {
		return new Promise((resolve, reject) => {
			uni.getFileInfo({
				filePath: imagePath,
				success: (res) => {
					const pixels = width * height
					const bytesPerPixel = res.size / pixels
					const data = new Uint8ClampedArray(pixels * 4)
					const complexity = Math.min(255, bytesPerPixel * 50)

					for (let i = 0; i < pixels; i++) {
						const noise = Math.random() * complexity
						data[i * 4] = noise
						data[i * 4 + 1] = noise
						data[i * 4 + 2] = noise
						data[i * 4 + 3] = 255
					}

					resolve({
						data: data,
						width: width,
						height: height,
						estimated: true,
						estimatedScore: bytesPerPixel * 1000
					})
				},
				fail: reject
			})
		})
	}

	/**
	 * 微信小程序端获取图像数据
	 */
	getImageDataWx(imagePath, width, height) {
		return new Promise((resolve, reject) => {
			try {
				const canvas = uni.createOffscreenCanvas({
					type: '2d',
					width: width,
					height: height
				})
				const ctx = canvas.getContext('2d')
				const img = canvas.createImage()

				img.onload = () => {
					ctx.drawImage(img, 0, 0, width, height)
					const imageData = ctx.getImageData(0, 0, width, height)
					resolve({
						data: imageData.data,
						width: width,
						height: height
					})
				}
				img.onerror = () => {
					reject(new Error('微信小程序图片加载失败'))
				}
				img.src = imagePath
			} catch (err) {
				reject(new Error('请升级微信基础库版本'))
			}
		})
	}

	/**
	 * 其他小程序端获取图像数据
	 */
	getImageDataMiniProgram(imagePath, width, height) {
		return new Promise((resolve, reject) => {
			try {
				const canvas = uni.createOffscreenCanvas({
					type: '2d',
					width: width,
					height: height
				})
				const ctx = canvas.getContext('2d')
				const img = canvas.createImage()

				img.onload = () => {
					ctx.drawImage(img, 0, 0, width, height)
					const imageData = ctx.getImageData(0, 0, width, height)
					resolve({
						data: imageData.data,
						width: width,
						height: height
					})
				}
				img.onerror = () => {
					reject(new Error('图片加载失败'))
				}
				img.src = imagePath
			} catch (err) {
				reject(new Error('当前小程序不支持离屏Canvas'))
			}
		})
	}

	/**
	 * 降级方案
	 */
	getImageDataFallback(imagePath, width, height) {
		return this._estimateFromImageInfo(imagePath, width, height)
	}

	/**
	 * 计算模糊分数
	 */
	async calculateBlurScore(imageData) {
		const {
			data,
			width,
			height,
			estimated,
			estimatedScore
		} = imageData

		if (estimated) {
			return Math.round(estimatedScore || 50)
		}

		const grayData = this.rgbToGray(data, width, height)
		const laplacianScore = this.calculateLaplacianVariance(grayData, width, height)
		const gradientScore = this.calculateGradientVariance(grayData, width, height)
		const localScore = this.calculateLocalVarianceScore(grayData, width, height)

		const totalScore = laplacianScore * 0.4 + gradientScore * 0.4 + localScore * 0.2

		return Math.round(totalScore)
	}

	/**
	 * RGB转灰度
	 */
	rgbToGray(data, width, height) {
		const gray = new Float32Array(width * height)
		for (let i = 0; i < width * height; i++) {
			const r = data[i * 4]
			const g = data[i * 4 + 1]
			const b = data[i * 4 + 2]
			gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
		}
		return gray
	}

	/**
	 * 拉普拉斯方差法
	 */
	calculateLaplacianVariance(gray, width, height) {
		const laplacianKernel = [0, 1, 0, 1, -4, 1, 0, 1, 0]
		const laplacianValues = []

		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				let sum = 0
				let kernelIndex = 0
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const pixel = gray[(y + ky) * width + (x + kx)]
						sum += pixel * laplacianKernel[kernelIndex]
						kernelIndex++
					}
				}
				laplacianValues.push(sum)
			}
		}

		return this.calculateVariance(laplacianValues)
	}

	/**
	 * 梯度方差法
	 */
	calculateGradientVariance(gray, width, height) {
		const gradients = []

		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				const gx = (
					-gray[(y - 1) * width + (x - 1)] +
					gray[(y + 1) * width + (x - 1)] +
					2 * (-gray[y * width + (x - 1)] + gray[y * width + (x + 1)]) +
					-gray[(y - 1) * width + (x + 1)] +
					gray[(y + 1) * width + (x + 1)]
				)
				const gy = (
					-gray[(y - 1) * width + (x - 1)] +
					gray[(y + 1) * width + (x - 1)] +
					2 * (-gray[(y - 1) * width + x] + gray[(y + 1) * width + x]) +
					-gray[(y - 1) * width + (x + 1)] +
					gray[(y + 1) * width + (x + 1)]
				)
				const magnitude = Math.sqrt(gx * gx + gy * gy)
				gradients.push(magnitude)
			}
		}

		return this.calculateVariance(gradients)
	}

	/**
	 * 局部方差分析
	 */
	calculateLocalVarianceScore(gray, width, height) {
		const blockSize = 8
		const localVariances = []

		for (let by = 0; by < height - blockSize; by += blockSize) {
			for (let bx = 0; bx < width - blockSize; bx += blockSize) {
				let sum = 0
				let count = 0
				for (let y = by; y < by + blockSize; y++) {
					for (let x = bx; x < bx + blockSize; x++) {
						sum += gray[y * width + x]
						count++
					}
				}
				const mean = sum / count
				let variance = 0
				for (let y = by; y < by + blockSize; y++) {
					for (let x = bx; x < bx + blockSize; x++) {
						const diff = gray[y * width + x] - mean
						variance += diff * diff
					}
				}
				localVariances.push(Math.sqrt(variance / count))
			}
		}

		const avgLocalVar = localVariances.reduce((a, b) => a + b, 0) / localVariances.length
		return avgLocalVar * 10
	}

	/**
	 * 计算方差
	 */
	calculateVariance(values) {
		if (values.length === 0) return 0
		const mean = values.reduce((a, b) => a + b, 0) / values.length
		const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length
		return variance
	}

	/**
	 * 快速检测
	 */
	async quickDetect(imagePath, threshold = 100, canvasOptions = {}) {
		const imageInfo = await this.getImageInfo(imagePath)
		const imageData = await this.getImageData(imagePath, imageInfo.width, imageInfo.height, canvasOptions)

		if (imageData.estimated) {
			return {
				isBlur: (imageData.estimatedScore || 50) < threshold,
				score: Math.round(imageData.estimatedScore || 50),
				threshold: threshold
			}
		}

		const grayData = this.rgbToGray(imageData.data, imageData.width, imageData.height)
		const score = this.calculateLaplacianVariance(grayData, imageData.width, imageData.height)

		return {
			isBlur: score < threshold,
			score: Math.round(score),
			threshold: threshold
		}
	}
}

// 导出单例
export const blurDetector = new BlurDetector()
export default blurDetector