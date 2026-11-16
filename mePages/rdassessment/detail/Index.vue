<template>
	<wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
		<view class="page">
			<wd-navbar left-arrow title="研发考核详情" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft"></wd-navbar>
			<template v-if="rowData">
				<scroll-view :scroll-y="true" class="detail-scroll">
					<view class="section card">
						<view class="section-title"><text>基本信息</text></view>
						<view class="info-rows">
							<view class="info-row"><text class="lbl">被考核人</text><text class="val">{{ rowData.username || '-' }}</text></view>
							<view class="info-row"><text class="lbl">入职时间</text><text class="val">{{ rowData.joindate || '-' }}</text></view>
							<view class="info-row"><text class="lbl">所在部门</text><text class="val">{{ getDeptName(rowData.dept) }}</text></view>
							<view class="info-row"><text class="lbl">考核周期</text><text class="val">{{ rowData.evaluationcycle || '-' }}</text></view>
							<view class="info-row"><text class="lbl">状态</text><text class="val" :style="{ color: getStatusStyle(rowData.status).color }">{{ getStatusStyle(rowData.status).text }}</text></view>
						</view>
					</view>
					<block v-for="type in [0, 1, 2]" :key="type">
						<view v-if="getItemsByType(type).length > 0" class="section card">
							<view class="type-header">
								<text class="type-name">{{ getTypeName(type) }}</text>
								<!-- <text class="type-total">自评: {{ computedSelfTotal }} / 部门: {{ computedDeptTotal }}</text> -->
							</view>
							<view v-for="(item, idx) in getItemsByType(type)" :key="item.id || idx" class="score-item">
								<view class="score-item-header">
									<text class="score-item-name">{{ itemLabelMap[item.assessmentiteam] || '未知项' }}</text>
									<text class="score-item-full">满分: {{ item.fullmarks }}</text>
								</view>
								<view class="score-item-content">{{ item.assessmentstandards || '-' }}</view>
								<view v-if="item.scorebanddescription && item.scorebanddescription !== '/'" class="score-range">
									<text class="score-range-title">计分范围：</text>
									<text class="score-range-content">{{ formatScoreRange(item.scorebanddescription, item.fullmarks) }}</text>
								</view>
								<view class="score-row self-score-row">
									<view class="score-col">
										<text class="score-label">自评分<text v-if="isOwnData && rowData.status == 0 && operateType == 'edit' && item.realIdx <= requiredLastIdx" class="req-star"> *</text></text>
										<view v-if="isOwnData && rowData.status == 0 && operateType == 'edit'" class="rate-input-wrap">
											<wd-rate v-model="formData['s' + item.realIdx]" size="16px" :num="item.fullmarks"/>
										</view>
										<view v-else class="rate-val self-rate"><wd-rate :model-value="Number(getSelfScoreByIdx(item.realIdx))" :num="item.fullmarks" size="16px" readonly /></view>
									</view>
										<wd-input-number :disabled="!(isOwnData && rowData.status == 0 && operateType == 'edit')"  v-model="formData['s' + item.realIdx]" :min="0" :max="item.fullmarks" size="small" />
								</view>
								<view class="remark-row self-remark-row" v-if="isNew">
									<text class="score-label">自评备注</text>
									<view v-if="isOwnData && rowData.status == 0 && operateType == 'edit'" class="remark-input-wrap">
										<wd-input v-model="formData['sn' + item.realIdx]" maxlength="255" placeholder="备注" />
									</view>
									<text v-else class="score-remark">{{ getSelfRemarkByIdx(item.realIdx) }}</text>
								</view>
								<view class="score-row dept-score-row" v-if="rowData.status !== 0">
									<view class="score-col">
										<text class="score-label">部门评分<text v-if="canEditDeptRow(item) && item.realIdx <= requiredLastIdx" class="req-star"> *</text></text>
										<view v-if="canEditDeptRow(item)" class="rate-input-wrap">
											<wd-rate v-model="formData['d' + item.realIdx]" :num="item.fullmarks" size="16px" />
										</view>
										<view v-else class="rate-val dept-rate"><wd-rate :model-value="Number(getDeptScoreByIdx(item.realIdx))" :num="item.fullmarks" size="16px" readonly /></view>
									</view>
										<wd-input-number :disabled="!canEditDeptRow(item)" v-model="formData['d' + item.realIdx]" :min="0" :max="item.fullmarks" size="small" />
								</view>
								<view class="remark-row" v-if="rowData.status !== 0">
									<text class="score-label">备注</text>
									<view v-if="canEditDeptRow(item)" class="remark-input-wrap">
										<wd-input v-model="formData['n' + item.realIdx]"  maxlength="255" placeholder="备注" />
									</view>
									<text v-else class="score-remark">{{ getRemarkByIdx(item.realIdx) }}</text>
								</view>
							</view>
						</view>
					</block>
					<view class="section card total-section">
						<view class="total-row"><text class="total-label">自评总分</text><text class="total-val">{{ computedSelfTotal }}</text></view>
						<view class="total-row"><text class="total-label">部门总分</text><text class="total-val" :class="{ 'low-score': computedDeptTotal !== '-' && computedDeptTotal < scoreThreshold }">{{ computedDeptTotal }}</text></view>
					</view>
					<view class="section card">
						<view class="section-title"><text>考核说明</text></view>
						<view v-for="(note, i) in noteList" :key="i" class="note-item">{{ note }}</view>
					</view>
					<view class="section card">
						<view class="section-title"><text>签名信息</text></view>
						<view class="sign-section">
							<view class="sign-row"><text class="sign-label">部门负责人</text><text class="sign-status" :class="{ signed: rowData.hdsign }">{{ rowData.hdsign ? '已签名' : '未签名' }}</text></view>
							<view v-if="rowData.hdsign" class="sign-img-wrap"><image class="sign-img" :src="rowData.hdsign" mode="widthFix" /></view>
							<view class="info-row"><text class="lbl">确认日期</text><text class="val">{{ rowData.hddbtime || '-' }}</text></view>
						</view>
						<view class="sign-section">
							<view class="sign-row"><text class="sign-label">综合管理部</text><text class="sign-status" :class="{ signed: rowData.gasign }">{{ rowData.gasign ? '已签名' : '未签名' }}</text></view>
							<view v-if="rowData.gasign" class="sign-img-wrap"><image class="sign-img" :src="rowData.gasign" mode="widthFix" /></view>
							<view class="info-row"><text class="lbl">确认日期</text><text class="val">{{ rowData.gadbtime || '-' }}</text></view>
						</view>
						<view class="sign-section">
							<view class="sign-row"><text class="sign-label">被考核人</text><text class="sign-status" :class="{ signed: rowData.smsign }">{{ rowData.smsign ? '已签名' : '未签名' }}</text></view>
							<view v-if="rowData.smsign" class="sign-img-wrap"><image class="sign-img" :src="rowData.smsign" mode="widthFix" /></view>
							<view class="info-row"><text class="lbl">确认日期</text><text class="val">{{ rowData.smdbtime || '-' }}</text></view>
						</view>
						<view class="info-row"><text class="lbl">创建时间</text><text class="val">{{ rowData.dbtime || '-' }}</text></view>
					</view>
					<view class="bottom-space"></view>
				</scroll-view>
				<view class="bottom-bar">
					<wd-button v-if="rowData.status == 0 && isOwnData && operateType == 'edit'" type="primary" block @click="handleSubmitSelf">提交自评</wd-button>
					<block v-if="rowData.status == 1 && canDeptInput && operateType == 'edit'">
						<wd-button type="error" style="flex: 1" @click="openFailPopup">不合格</wd-button>
						<wd-button type="primary" style="flex: 1" @click="goSign('dept')">部门负责人签字</wd-button>
					</block>
					<wd-button v-if="rowData.status == 2 && canGaSign" type="primary" block @click="goSign('ga')">综合管理部签字</wd-button>
					<wd-button v-if="rowData.status == 3 && isOwnData && operateType == 'edit'" type="primary" block @click="goSign('sm')">确认考核</wd-button>
				</view>
			</template>
			<template v-else>
				<view class="loading-tip">未获取到考核数据</view>
			</template>
			<wd-popup :z-index="120" position="bottom" v-model="showFail" :custom-style="'border-radius: 24rpx 24rpx 0 0; padding: 32rpx 24rpx; background: ' + (isDark ? '#2a2a2a' : '#ffffff') + ';'">
				<view class="popup-header">
					<text class="popup-title">不合格原因</text>
					<view class="popup-close" @click="showFail = false">×</view>
				</view>
				<wd-textarea v-model="failReason" maxlength="255" placeholder="请输入不合格原因" custom-style="width: 100%" />
				<view class="popup-actions">
					<wd-button type="primary" block @click="handleFailConfirm">确定</wd-button>
				</view>
			</wd-popup>
			<wd-message-box />
		</view>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { useTheme } from "@/composables/theme/theme"
import { fetchGetProjectAssessmentTemplateListByPage, fetchUpdateProjectAssessmentInfo, fetchGetProjectAssessmentNewTemplateListByPage, fetchUpdateProjectAssessmentNewInfo } from "@/service/rdassessment"

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
// 试用版(new): 接口/考核项名称/日常岗位满分(15/85)/自评备注 sn 差异, 低分阈值 70(旧版 80)
const isNew = ref(false)
const scoreThreshold = computed(() => (isNew.value ? 70 : 80))
// 暗黑模式：页面底色 + CSS 变量统一控制卡片/文字底色（样式里用 var(--rd-*, 浅色默认) 取值）
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh'
    return 'min-height: 100vh; background: #1b1b1b; --rd-page-bg: #1b1b1b; --rd-card-bg: #2a2a2a; --rd-title: #e8e8e8; --rd-text: #c9cdd4; --rd-secondary: #8a9099; --rd-line: rgba(255, 255, 255, 0.08); --rd-line-soft: rgba(255, 255, 255, 0.06); --rd-field-bg: #333333; --rd-total-bg: rgba(22, 119, 255, 0.15); --rd-success-bg: rgba(82, 196, 26, 0.18); --rd-bar-shadow: none;'
})
const userId = ref(uni.getStorageSync("userId"))
const userType = ref(uni.getStorageSync("usertype"))
const rowData = ref(null)
const operateType = ref("look")
const templateList = ref([])
const loading = ref(false)

const formData = ref<Record<string, any>>({})

// 考核项(assessmentiteam)名称映射, 新旧版枚举有差异
const itemLabelMapOld: Record<number, string> = {
    0: "请假", 1: "违规违纪", 2: "响应与执行力", 3: "工作日志", 4: "代码提交",
    5: "代码合并", 6: "项目管理", 7: "项目延期", 8: "工作责任", 9: "交付质量",
    10: "技术资料归档", 11: "项目过程文档归档", 12: "客户/同事评价", 13: "难点突破",
    14: "项目提前", 15: "技术分享", 16: "技术创新"
}

// 新版: 0出勤情况 2工作日志 5代码质量 7工作责任 8任务积分, 其余与旧版一致
const itemLabelMapNew: Record<number, string> = {
    0: "出勤情况", 1: "违规违纪", 2: "工作日志", 3: "代码提交", 4: "代码合并",
    5: "代码质量", 6: "项目管理", 7: "工作责任", 8: "任务积分", 9: "交付质量",
    10: "技术资料归档", 11: "项目过程文档归档", 12: "客户/同事评价", 13: "难点突破",
    14: "项目提前", 15: "技术分享", 16: "技术创新"
}

const itemLabelMap = computed<Record<number, string>>(() => (isNew.value ? itemLabelMapNew : itemLabelMapOld))

// 分类名称: 新版日常/岗位满分为15/85分, 旧版为20/80分
function getTypeName(type: number): string {
    const dailyScore = isNew.value ? 15 : 20
    const postScore = isNew.value ? 85 : 80
    const map: Record<number, string> = { 0: `日常考核(${dailyScore}分)`, 1: `岗位考核(${postScore}分)`, 2: "附加分" }
    return map[type] || "未知分类"
}

const itemsWithIndex = computed(() => {
    if (!templateList.value.length) return []
    return templateList.value.map((item: any, idx: number) => ({ ...item, realIdx: idx + 1 }))
})

function getItemsByType(type: number) {
    return itemsWithIndex.value.filter((item: any) => item.assessmenttype === type)
}

const isOwnData = computed(() => {
    return rowData.value && String(userId.value) === String(rowData.value.creater)
})

const canDeptInput = computed(() => {
    if (!rowData.value) return false
    if (rowData.value.status !== 1) return false
    const uid = String(userId.value)
    if (rowData.value.dept == 0 && uid === "999") return true
    if (rowData.value.dept == 1 && uid === "1036") return true
    if (rowData.value.dept == 2 && uid === "1030") return true
    return false
})

const computedSelfTotal = computed(() => {
    if (!rowData.value) return "-"
    let sum = 0
    for (let i = 1; i <= 16; i++) {
        const val = formData.value["s" + i]
        if (val != null && val !== "") sum += Number(val)
    }
    return sum || "-"
})

const computedDeptTotal = computed(() => {
    if (!rowData.value) return "-"
    let sum = 0
    for (let i = 1; i <= 16; i++) {
        const val = formData.value["d" + i]
        if (val != null && val !== "") sum += Number(val)
    }
    return sum || "-"
})

function getSelfScoreByIdx(idx: number): string {
    if (operateType.value === 'edit' && isOwnData.value && rowData.value?.status == 0) {
        const val = formData.value["s" + idx]
        return val != null && val !== "" ? String(val) : "-"
    }
    const val = rowData.value ? rowData.value["s" + idx] : null
    // 空自评分：已提交后（status!=0）显示占位 /（口径同 web）
    return val != null && val !== "" ? String(val) : (rowData.value?.status != 0 ? '/' : '-')
}

function getDeptScoreByIdx(idx: number): string {
    if (operateType.value === 'edit' && rowData.value?.status == 1 && canDeptInput.value) {
        const val = formData.value["d" + idx]
        return val != null && val !== "" ? String(val) : "-"
    }
    // status1 部门负责人查看时部门评分列同样预填自评分（口径同 web onMounted 映射，不区分 operateType）
    const val = rowData.value
        ? (rowData.value.status == 1 && canDeptInput.value ? rowData.value["s" + idx] : rowData.value["d" + idx])
        : null
    // 空部门评分：部门提交后（status!=1）显示占位 /（口径同 web）
    return val != null && val !== "" ? String(val) : (rowData.value?.status != 1 ? '/' : '-')
}

function getRemarkByIdx(idx: number): string {
    if (operateType.value === 'edit' && canEditDeptRowByRealIdx(idx)) {
        return formData.value["n" + idx] || "-"
    }
    return rowData.value ? (rowData.value["n" + idx] || "-") : "-"
}

// 按 realIdx 反查考核项，供备注读取处复用 canEditDeptRow 判断
function canEditDeptRowByRealIdx(idx: number): boolean {
    const item = itemsWithIndex.value.find((it: any) => it.realIdx === idx)
    return item ? canEditDeptRow(item) : false
}

function getSelfRemarkByIdx(idx: number): string {
    if (isNew.value && operateType.value === 'edit' && isOwnData.value && rowData.value?.status == 0) {
        return formData.value["sn" + idx] || "-"
    }
    return rowData.value ? (rowData.value["sn" + idx] || "-") : "-"
}

function formatScoreRange(scorebanddescription: string, fullmarks: number): string {
    try {
        const obj = JSON.parse(scorebanddescription)
        if (fullmarks === 10) {
            const rangeMap: Record<string, string> = {
                "5": "9-10", "4": "7-8", "3": "5-6", "2": "3-4", "1": "1-2"
            }
            return Object.entries(obj).map(([key, val]) => {
                const displayKey = rangeMap[key] || key
                return displayKey + "分: " + val
            }).join("，")
        }
        return Object.entries(obj).map(([key, val]) => key + "分: " + val).join("，")
    } catch {
        return scorebanddescription
    }
}

function getScoreStyle(score: string | number, fullmarks: number): Record<string, string> {
    const num = typeof score === "string" ? parseFloat(score) : score
    if (isNaN(num) || num <= 0) return { color: "#969799" }
    const ratio = num / fullmarks
    if (ratio >= 0.8) return { color: "#52c41a" }
    if (ratio >= 0.5) return { color: "#faad14" }
    return { color: "#f5222d" }
}

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

const canGaSign = computed(() => rowData.value && rowData.value.status === 2 && userType.value == 4)

// 综合管理部(1022)在部门考核提交后(status=2)可修改日常考核的部门评分/备注（口径同 web canEditDailyDept）
const canEditDailyDept = computed(() => {
    if (!rowData.value) return false
    return rowData.value.status == 2 && operateType.value == 'edit' && String(userType.value) == '4' && String(userId.value) == '1022'
})

// 部门评分/备注单元格编辑权限：status1 部门负责人，或 1022 在 status2 改日常考核行
function canEditDeptRow(item: any): boolean {
    if (operateType.value !== 'edit') return false
    if (canDeptInput.value) return true
    return canEditDailyDept.value && item.assessmenttype === 0
}

// 前 N-4 项必填，最后 4 项选填（口径同 web slice(0, -4) 校验与必填星号）
const requiredLastIdx = computed(() => Math.max(0, itemsWithIndex.value.length - 4))

// 考核说明（口径同 web noteListOld/New）
const noteListOld = [
    '1、分数以部门评分为准，考核分≥80分即合格，不合格的考核分影响当月绩效，连续十二个月考核不合格月度数量≥2，认为岗位不胜任；',
    '2、岗位考核中的时效考核，以项目管理系统为准，上无相关数据的，加分项无效；考核加分项需要由被考核人主动向部门负责人提出，并附证明文件留档，加分影响当年年度绩效；',
    '3、每月1日-5日考核上个自然月工作内容，确认期为6日-10日，发综合部及被考核人签字确认，签字即为认可考核结果；',
    '4、岗位考核中，部分岗位从不涉及的考核项(例如对于测试人员，不涉及代码提交或代码合并)，应当由部门负责人按照其岗位职责从其它角度进行考核；',
    '5、本考核表中提到的"钉钉"等工具/软件/平台，具体以实际使用的为准。'
]
const noteListNew = [
    '1、分数以部门评分为准，考核分<70：不合格，连续十二个月内考核不合格月度数量≥2，认为岗位不胜任；70≤考核分≤78，有待改进；79≤考核分≤91，良；92≤考核分≤100+，优；考核分数影响当月绩效。',
    '2、岗位考核中的时效考核，以公司内部研发项目管理系统为准，系统上无相关数据的，加分项无效；考核加分项需要由被考核人主动向部门负责人提出，并附证明文件留档，加分影响当年年度绩效；',
    '3、每月1日-5日考核上个自然月工作内容，确认期为6日-10日，发综合部及被考核人签字确认，签字即为认可考核结果，如遇节假日顺延；',
    '4、岗位考核中，考核月不涉及的考核项(例如文档考核项，上个月无文档需要提交的情况)，默认打满分，且需要额外备注；',
    '5、岗位考核中，部分岗位从不涉及的考核项(例如对于测试人员，不涉及代码提交或代码合并)，应当由部门负责人按照其岗位职责从其它角度进行考核；',
    '6、本考核表中提到的"钉钉"、"禅道"等工具/软件/平台，具体以实际使用的为准。'
]
const noteList = computed(() => (isNew.value ? noteListNew : noteListOld))

async function loadTemplate() {
    if (templateList.value.length) return
    try {
        const res = await (isNew.value ? fetchGetProjectAssessmentNewTemplateListByPage() : fetchGetProjectAssessmentTemplateListByPage())
        templateList.value = res?.list || res || []
    } catch (e) {
        console.error("获取考核模板失败", e)
        templateList.value = []
    }
}

function initFormData() {
    const data: Record<string, any> = {}
    if (!rowData.value) return
    for (let i = 1; i <= 16; i++) {
        data["s" + i] = rowData.value["s" + i] ?? null
        // status1 部门负责人打开时，部门评分列预填自评分作为打分起点（口径同 web onMounted 映射）
        if (canDeptInput.value) {
            data["d" + i] = rowData.value["s" + i] ?? null
        } else {
            data["d" + i] = rowData.value["d" + i] ?? null
        }
        data["n" + i] = rowData.value["n" + i] ?? ""
        data["sn" + i] = rowData.value["sn" + i] ?? ""
    }
    formData.value = data
}

async function handleSubmitSelf() {
    if (loading.value) return
    // 前 N-4 项必填，最后 4 项选填（口径同 web slice(0, -4) 校验）
    const checkItems = itemsWithIndex.value.filter((item: any) => item.realIdx <= requiredLastIdx.value)
    const hasEmpty = checkItems.some((item: any) => {
        const val = formData.value["s" + item.realIdx]
        return val === null || val === undefined || val === ""
    })
    if (hasEmpty) {
        uni.showToast({ title: "请填写必填的自评分", icon: "none" })
        return
    }
    loading.value = true
    try {
        const params: Record<string, any> = {
            s0: computedSelfTotal.value === "-" ? 0 : Number(computedSelfTotal.value)
        }
        for (let i = 1; i <= 16; i++) {
            params["s" + i] = formData.value["s" + i] ?? null
            // 试用版提交自评备注 sn
            if (isNew.value) params["sn" + i] = formData.value["sn" + i] ?? null
        }
        params.status = 1
        const updateApi = isNew.value ? fetchUpdateProjectAssessmentNewInfo : fetchUpdateProjectAssessmentInfo
        await updateApi([{ ...rowData.value, ...params }])
        uni.showToast({ title: "提交成功", icon: "success" })
        uni.$emit('refreshRdAssessmentList')
        setTimeout(() => uni.navigateBack(), 1500)
    } catch (e) {
        console.error("提交失败", e)
        uni.showToast({ title: "提交失败", icon: "none" })
    } finally {
        loading.value = false
    }
}

function handleClickLeft() { uni.navigateBack() }

// 部门负责人判定不合格：所有部门评分置 0，携带原因跳转签字（签字保存时随 rowData 一并落库到 notes）
const showFail = ref(false)
const failReason = ref("")

function openFailPopup() {
    failReason.value = ""
    showFail.value = true
}

function handleFailConfirm() {
    if (!failReason.value.trim()) {
        uni.showToast({ title: "请输入不合格原因", icon: "none" })
        return
    }
    for (let i = 1; i <= 16; i++) formData.value["d" + i] = 0
    showFail.value = false
    goSign("dept", failReason.value.trim())
}

function goSign(type: string, notes?: string) {
    // 部门考核提交前校验必填部门评分（前 N-4 项，口径同 web status1 提交校验）；不合格流已全置 0 可直接通过
    if (type === 'dept') {
        const hasEmpty = itemsWithIndex.value.some((item: any) => {
            if (item.realIdx > requiredLastIdx.value) return false
            const val = formData.value["d" + item.realIdx]
            return val === null || val === undefined || val === ""
        })
        if (hasEmpty) {
            uni.showToast({ title: "请填写必填的部门评分", icon: "none" })
            return
        }
    }
    const payload: any = { ...rowData.value, ...formData.value }
    if (notes !== undefined) payload.notes = notes
    // 1022 调整过日常考核部门评分时，重算 d0 随签字一并落库（口径同 web status2 提交的 canEditDailyDept 分支）
    if (type === 'ga' && canEditDailyDept.value) {
        payload.gaDailyAdjusted = true
        payload.d0 = computedDeptTotal.value === "-" ? 0 : Number(computedDeptTotal.value)
    }
    uni.navigateTo({ url: "/mePages/rdassessment/signature/Index?rowData=" + encodeURIComponent(JSON.stringify(payload)) + "&signType=" + type + "&isNew=" + (isNew.value ? 1 : 0) })
}

onLoad((options) => {
    if (options.rowData) {
        try { rowData.value = JSON.parse(decodeURIComponent(options.rowData)) } catch (e) { console.error("解析rowData失败", e) }
    }
    operateType.value = options.operateType || "look"
    isNew.value = options.isNew === '1'
    loadTemplate()
})

watch(() => rowData.value, () => {
    if (rowData.value) {
        initFormData()
    }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: var(--rd-page-bg, #f5f6f8); }
.detail-scroll { height: calc(100vh - 180rpx); }
.section { margin: 20rpx; background: var(--rd-card-bg, #fff); border-radius: 20rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: var(--rd-title, #1a1a1a); margin-bottom: 20rpx; padding-bottom: 16rpx; border-bottom: 1rpx solid var(--rd-line, #f0f0f0); }
.info-rows .info-row { display: flex; padding: 12rpx 0; border-bottom: 1rpx solid var(--rd-line-soft, #f9f9f9); font-size: 26rpx; }
.info-rows .info-row:last-child { border-bottom: none; }
.info-rows .lbl { color: var(--rd-secondary, #969799); min-width: 160rpx; flex-shrink: 0; }
.info-rows .val { flex: 1; word-break: break-all; margin-left: 10rpx; color: var(--rd-text, #323233); }

.type-header { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; margin-bottom: 16rpx; border-bottom: 2rpx solid var(--rd-line, #e8e8e8); }
.type-name { font-size: 28rpx; font-weight: 600; color: #1677ff; }
.type-total { font-size: 24rpx; color: var(--rd-text, #666); }
.score-item { padding: 20rpx 0; border-bottom: 1rpx solid var(--rd-line, #f0f0f0); }
.score-item:last-child { border-bottom: none; }
.score-item-header { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.score-item-name { font-size: 28rpx; font-weight: 600; color: var(--rd-text, #333); }
.score-item-full { font-size: 24rpx; color: var(--rd-secondary, #999); }
.score-item-content { font-size: 24rpx; color: var(--rd-text, #666); line-height: 1.6; margin-bottom: 16rpx; white-space: pre-line; }
.score-item-row { display: flex; gap: 20rpx; }
.score-col { flex: 1; text-align: center; }
.score-label { display: block; font-size: 22rpx; color: var(--rd-secondary, #999); margin-bottom: 8rpx; }
.score-val { display: block; font-size: 32rpx; font-weight: 600; }
.score-remark { display: block; font-size: 24rpx; color: var(--rd-text, #666); }
.low-score { color: #f5222d !important; }

.score-row { display: flex; align-items: center; margin-bottom: 16rpx; }
.score-col { flex: 1; }
.self-score-row { border-left: 4rpx solid #fa8c16; padding-left: 16rpx; }
.dept-score-row { border-left: 4rpx solid #722ed1; padding-left: 16rpx; }
.rate-input-wrap { display: flex; justify-content: center; }
.rate-val { margin-top: 8rpx; }
.input-col { width: 160rpx; }
.input-col .wd-input-number { float: right; }
.self-rate .wd-rate, .self-rate-row .wd-rate { --wd-rate-color: #fa8c16 !important; }
.dept-rate .wd-rate, .dept-score-row .wd-rate { --wd-rate-color: #722ed1 !important; }
.remark-input-wrap { padding: 0 10rpx; }
.req-star { color: #f5222d; font-weight: 600; }
.note-item { font-size: 24rpx; color: var(--rd-text, #666); line-height: 1.9; margin-bottom: 8rpx; }

.total-section { background: var(--rd-total-bg, #f0f7ff); }
.total-row { display: flex; justify-content: space-between; padding: 16rpx 0; }
.total-row:first-child { border-bottom: 1rpx dashed var(--rd-line, #ccc); }
.total-label { font-size: 28rpx; font-weight: 600; color: var(--rd-title, #1a1a1a); }
.total-val { font-size: 36rpx; font-weight: 700; color: #1677ff; }

.sign-section { margin-bottom: 24rpx; padding-bottom: 24rpx; border-bottom: 1rpx dashed var(--rd-line, #eee); }
.sign-section:last-of-type { border-bottom: none; margin-bottom: 0; }
.sign-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.sign-label { font-weight: 600; font-size: 28rpx; color: var(--rd-text, #333); }
.sign-status { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 20rpx; background: var(--rd-field-bg, #f5f5f5); color: var(--rd-secondary, #909399); }
.sign-status.signed { background: var(--rd-success-bg, #f6ffed); color: #52c41a; }
/* 签名图保留白色底，避免暗色下黑色笔迹看不见 */
.sign-img-wrap { margin: 12rpx 0; background: #fff; border-radius: 12rpx; padding: 8rpx; }
.sign-img { width: 200rpx; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 30rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); background: var(--rd-card-bg, #fff); display: flex; gap: 16rpx; flex-wrap: wrap; box-shadow: var(--rd-bar-shadow, 0 -2rpx 10rpx rgba(0,0,0,0.05)); }
.bottom-space { height: 180rpx; }
.loading-tip { display: flex; justify-content: center; align-items: center; padding: 100rpx 0; font-size: 28rpx; color: var(--rd-secondary, #969799); }

.score-range { font-size: 24rpx; color: var(--rd-secondary, #8c8c8c); background: var(--rd-field-bg, #f9f9f9); padding: 12rpx 16rpx; border-radius: 8rpx; margin-bottom: 16rpx; }
.score-range-title { font-weight: 600; color: var(--rd-text, #595959); }
.score-range-content { color: var(--rd-secondary, #8c8c8c); }

/* 不合格弹层 */
.popup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.popup-title { font-size: 32rpx; font-weight: 600; color: var(--rd-title, #1a1a1a); }
.popup-close { width: 44rpx; height: 44rpx; line-height: 40rpx; text-align: center; border-radius: 50%; background: var(--rd-field-bg, #E6EAF2); color: var(--rd-secondary, #6A7590); font-size: 26rpx; }
.popup-actions { padding-top: 8rpx; }
</style>
