<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<view class="page">
			<wd-navbar left-arrow title="签字确认" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
			<scroll-view :scroll-y="true" class="content-scroll">
				<view class="section card">
					<view class="section-title"><text>考核信息</text></view>
					<view class="info-rows">
						<view class="info-row"><text class="lbl">被考核人</text><text class="val">{{ rowData?.username || '-' }}</text></view>
						<view class="info-row"><text class="lbl">所在部门</text><text class="val">{{ getDeptName(rowData?.dept) }}</text></view>
						<view class="info-row"><text class="lbl">考核周期</text><text class="val">{{ rowData?.evaluationcycle || '-' }}</text></view>
						<view class="info-row"><text class="lbl">状态</text><text class="val" :style="{ color: getStatusStyle(rowData?.status).color }">{{ getStatusStyle(rowData?.status).text }}</text></view>
					</view>
				</view>

				<view class="section card">
					<view class="section-title"><text>签字信息</text></view>
					<view class="sign-type-info">
						<view class="sign-type-badge" :class="signType">{{ getSignTypeText() }}</view>
					</view>
					<view class="sign-area">
						<view class="sign-label">请在此处签名：</view>
						<view class="canvas-wrap">
							<canvas canvas-id="signCanvas" id="signCanvas" class="sign-canvas" :disable-scroll="true" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"></canvas>
						</view>
						<view class="canvas-actions">
							<wd-button size="small" plain @click="clearCanvas">重写</wd-button>
						</view>
					</view>
				</view>

				<view class="bottom-space"></view>
			</scroll-view>

			<view class="bottom-bar">
				<wd-button size="small" plain block @click="handleClickLeft">取消</wd-button>
				<wd-button type="primary" block :loading="loading" @click="handleSubmit">确认签字</wd-button>
			</view>
		</view>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, getCurrentInstance } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { useTheme } from "@/composables/theme/theme"
import { fetchUpdateProjectAssessmentInfo, fetchUpdateProjectAssessmentNewInfo } from "@/service/rdassessment"
import { uploadFile } from "@/utils/uploadFile"

const { themeVars, theme } = useTheme()
const { proxy } = getCurrentInstance() as any
const rowData = ref<any>(null)
const signType = ref("") // dept, ga, sm
const isNew = ref(false) // 试用版走 rdAssessmentNew 接口
const loading = ref(false)
const signImage = ref("")

// 画布相关
let ctx: UniApp.CanvasContext | null = null
let isDrawing = false
let lastX = 0
let lastY = 0
let canvasWidth = 0
let canvasHeight = 0

const deptMap: Record<number, string> = { 0: "平台", 1: "数据通讯", 2: "网络安全" }
function getDeptName(dept: number): string { return deptMap[dept] || "" }

const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: "被考核人未提交", color: "#909399" },
    1: { text: "待部门负责人确认", color: "#fa8c16" },
    2: { text: "待综合管理部确认", color: "#722ed1" },
    3: { text: "待被考核人确认", color: "#1890ff" },
    4: { text: "完成", color: "#52c41a" }
}

function getStatusStyle(status: number) { return statusMap[status] || { text: "未知", color: "#909399" } }

function getSignTypeText(): string {
    if (signType.value === "dept") return "部门负责人签字"
    if (signType.value === "ga") return "综合管理部签字"
    if (signType.value === "sm") return "被考核人确认"
    return "签字确认"
}

function initCanvas() {
    setTimeout(() => {
        ctx = uni.createCanvasContext('signCanvas', proxy)
        if (ctx) {
            ctx.setLineWidth(3)
            ctx.setLineCap('round')
            ctx.setLineJoin('round')
            ctx.setStrokeStyle('#333')
        }
        // 获取画布尺寸
        uni.createSelectorQuery().select('#signCanvas').boundingClientRect((res: any) => {
            if (res) {
                canvasWidth = res.width
                canvasHeight = res.height
            }
        }).exec()
    }, 200)
}

function onTouchStart(e: any) {
    if (!ctx) return
    isDrawing = true
    const touch = e.touches[0]
    lastX = touch.x
    lastY = touch.y
}

function onTouchMove(e: any) {
    if (!isDrawing || !ctx) return
    const touch = e.touches[0]
    const x = touch.x
    const y = touch.y

    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.draw(true)

    lastX = x
    lastY = y
}

function onTouchEnd() {
    isDrawing = false
}

function clearCanvas() {
    if (!ctx || !canvasWidth || !canvasHeight) return
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.draw()
    signImage.value = ""
}

function getSignImage(): Promise<string> {
    return new Promise((resolve) => {
        if (!ctx) {
            resolve("")
            return
        }
        uni.canvasToTempFilePath({
            canvasId: 'signCanvas',
            fileType: 'png',
            quality: 1,
            success: (res) => {
                resolve(res.tempFilePath)
            },
            fail: () => {
                resolve("")
            }
        }, proxy)
    })
}

async function handleSubmit() {
    if (loading.value) return
    loading.value = true
    try {
        const img = await getSignImage()
        if (!img) {
            uni.showToast({ title: "请先签名", icon: "none" })
            loading.value = false
            return
        }

        // 上传签名图片到服务器
        const uploadedPath = await uploadSignImage(img)
        signImage.value = uploadedPath

        const now = new Date()
        const updateApi = isNew.value ? fetchUpdateProjectAssessmentNewInfo : fetchUpdateProjectAssessmentInfo

        if (signType.value === "dept") {
            const params: Record<string, any> = {d0:0 }
            for (let i = 1; i <= 16; i++) {
                params["d" + i] = rowData.value["d" + i] ?? null
                // Number 归一化：d 项可能为字符串，直接 += 会拼成 "05" 之类（口径同 web deptTotal 的 Number 求和）
                params.d0 += Number(rowData.value["d" + i]) || 0
            }
            params.status = 2
            params.hdsign = uploadedPath
            await updateApi([{ ...rowData.value, ...params }])
            uni.showToast({ title: "签字成功", icon: "success" })
            uni.$emit('refreshRdAssessmentList')

        } else if (signType.value === "ga") {
            const params: Record<string, any> = { id: rowData.value.id, status: 3, gasign: uploadedPath }
            // 1022 调整过日常考核部门评分时，携带重算后的 d0（明细 d/n 已随 payload 整体落库，口径同 web canEditDailyDept 分支）
            if (rowData.value.gaDailyAdjusted) params.d0 = rowData.value.d0
            await updateApi([{ ...rowData.value, ...params }])
            uni.showToast({ title: "签字成功", icon: "success" })
            uni.$emit('refreshRdAssessmentList')

        } else if (signType.value === "sm") {
            const params = { id: rowData.value.id, status: 4, smsign: uploadedPath }
            await updateApi([params])
            uni.showToast({ title: "确认成功", icon: "success" })
            uni.$emit('refreshRdAssessmentList')
        }

        setTimeout(() => { uni.navigateBack() }, 1000)
    } catch (e) {
        console.error("签字失败", e)
        uni.showToast({ title: "签字失败", icon: "none" })
    } finally {
        loading.value = false
    }
}

// 上传签名图片到服务器
function uploadSignImage(tempFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const fileName = `sign_${Date.now()}.png`
        uploadFile(
            { name: fileName, url: tempFilePath, tempFilePath },
            'qiniu',
            (res: any) => {
                // res.data 是服务器返回的文件路径
                resolve(res.data)
            },
            (err: any) => {
                console.error("上传签名失败", err)
                reject(err)
            }
        )
    })
}

function handleClickLeft() { uni.navigateBack() }

const itemsWithIndex = ref<any[]>([])

onLoad(async (options) => {
    if (options.rowData) {
      console.log(JSON.parse(decodeURIComponent(options.rowData)),'ssssssss');
      
        try { rowData.value = JSON.parse(decodeURIComponent(options.rowData)) } catch (e) { console.error(e) }
    }
    if (options.signType) { signType.value = options.signType }
    isNew.value = options.isNew === '1'
    initCanvas()
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.content-scroll { height: calc(100vh - 120rpx); }
.section { margin: 20rpx; background: #fff; border-radius: 20rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: 600; margin-bottom: 20rpx; padding-bottom: 16rpx; border-bottom: 1rpx solid #f0f0f0; }
.info-rows .info-row { display: flex; padding: 12rpx 0; border-bottom: 1rpx solid #f9f9f9; font-size: 26rpx; }
.info-rows .info-row:last-child { border-bottom: none; }
.info-rows .lbl { color: #969799; min-width: 160rpx; flex-shrink: 0; }
.info-rows .val { flex: 1; word-break: break-all; margin-left: 10rpx; }

.sign-type-info { text-align: center; margin-bottom: 30rpx; }
.sign-type-badge { display: inline-block; padding: 12rpx 40rpx; border-radius: 30rpx; font-size: 28rpx; font-weight: 600; }
.sign-type-badge.dept { background: #fa8c16; color: #fff; }
.sign-type-badge.ga { background: #722ed1; color: #fff; }
.sign-type-badge.sm { background: #1890ff; color: #fff; }

.sign-area { margin-bottom: 30rpx; }
.sign-label { font-size: 26rpx; color: #666; margin-bottom: 16rpx; }
.canvas-wrap { border: 2rpx dashed #ddd; border-radius: 16rpx; background: #fff; }
.sign-canvas { width: 100%; height: 300rpx; }
.canvas-actions { text-align: center; margin-top: 20rpx; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 30rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); background: #fff; display: flex; gap: 20rpx; box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05); }
.bottom-space { height: 160rpx; }
</style>
