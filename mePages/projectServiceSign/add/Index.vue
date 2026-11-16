<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<view class="page" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
			<wd-navbar left-arrow :title="viewMode === 'result' ? '创建成功' : '新建签名服务单'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

			<!-- ============ 表单区 ============ -->
			<template v-if="viewMode === 'form'">
				<scroll-view :scroll-y="true" class="form-scroll" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
					<!-- 1. 项目与合同 -->
					<view class="section card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">1. 项目与合同</text></view>
						<view class="cell-row" @click="projectPopup = true">
							<text class="cell-label" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">关联项目</text>
							<view class="cell-value">
								<text :class="projectInfo.proname ? '' : 'placeholder'">{{ projectInfo.proname || '请选择项目' }}</text>
								<wd-icon v-if="form.projectId" name="close-circle" size="30rpx" :color="isDark ? '#6a6a6a' : '#9ca3af'" @click.stop="clearProject"></wd-icon>
								<wd-icon name="chevron-right" size="28rpx" :color="isDark ? '#6a6a6a' : '#c0c4cc'"></wd-icon>
							</view>
						</view>
						<view v-if="projectInfo.proname" class="info-rows">
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">项目名称</text><text class="val">{{ projectInfo.proname }}</text></view>
							<view class="info-row"><text class="lbl" :style="{ color: isDark ? '#8a9099' : '#8a8f99' }">项目地址</text><text class="val">{{ projectInfo.proaddr || '-' }}</text></view>
						</view>
						<view class="cell-row" :class="{ disabled: !form.projectId }" @click="openContract">
							<text class="cell-label" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">客户合同</text>
							<view class="cell-value">
								<text :class="selectedContractLabel ? '' : 'placeholder'">{{ selectedContractLabel || '请选择项目关联合同' }}</text>
								<wd-icon name="chevron-right" size="28rpx" :color="isDark ? '#6a6a6a' : '#c0c4cc'"></wd-icon>
							</view>
						</view>
					</view>

					<!-- 2. 人员与有效期 -->
					<view class="section card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">2. 人员与有效期</text></view>
						<view class="field-row">
							<text class="field-label" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">项目负责人</text>
							<input v-model="form.projectManager" class="field-input" placeholder="选择或输入项目负责人" placeholder-class="ph" />
							<text class="pick-btn" @click="openContactPicker('pm')">联系人</text>
						</view>
						<view class="field-row">
							<text class="field-label" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">现场联系人</text>
							<input v-model="form.siteContact" class="field-input" placeholder="选择或输入现场联系人" placeholder-class="ph" />
							<text class="pick-btn" @click="openContactPicker('sc')">联系人</text>
						</view>
						<view class="cell-row" @click="engineerPopup = true">
							<text class="cell-label" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">调试工程师</text>
							<view class="cell-value">
								<text :class="debugEngineerName ? '' : 'placeholder'">{{ debugEngineerName || '请选择调试工程师' }}</text>
								<wd-icon name="chevron-right" size="28rpx" :color="isDark ? '#6a6a6a' : '#c0c4cc'"></wd-icon>
							</view>
						</view>
						<wd-select-picker v-model="form.expireHours" label="链接有效期" :columns="expireHourOptions" type="radio" :z-index="300" placeholder="选择有效期（1~72小时）" />
					</view>

					<!-- 3. 提供设备 -->
					<view class="section card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="section-title">
							<text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">3. 提供设备</text>
							<view class="select-all" :class="{ active: allDevicesSelected }" @click="handleSelectAllDevices">
								<text>全选</text>
							</view>
						</view>
						<view v-if="!deviceOptions.length" class="empty-hint" :style="{ color: isDark ? '#6a6a6a' : '#9ca3af' }">{{ form.contractId ? '该合同下未查询到提供设备' : '请先选择项目与合同' }}</view>
						<view v-else class="device-list">
							<view v-for="d in deviceOptions" :key="d.id" class="device-item" :class="{ checked: form.deviceIds.includes(d.id) }" @click="toggleDevice(d.id)">
								<view class="device-check" :class="{ on: form.deviceIds.includes(d.id) }">
									<wd-icon v-if="form.deviceIds.includes(d.id)" name="check" size="28rpx" color="#ffffff"></wd-icon>
								</view>
								<view class="device-info">
									<view class="device-name">{{ d.devname || d.deviceName || d.name || `设备#${d.id}` }}</view>
									<view v-if="d.model || d.quantity != null" class="device-sub">{{ deviceText(d) }}</view>
								</view>
							</view>
						</view>
					</view>

					<!-- 4. 服务内容 -->
					<view class="section card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">4. 服务内容</text></view>
						<view v-if="!form.serviceItems.length" class="empty-hint" :style="{ color: isDark ? '#6a6a6a' : '#9ca3af' }">选择项目后自动带入调试任务，也可手动添加服务内容</view>
						<view v-for="(item, idx) in form.serviceItems" :key="idx" class="service-item" :style="{ background: isDark ? '#1b1b1b' : '#f7f8fa' }">
							<view class="svc-left">
								<text class="svc-tag" :class="item.debugId ? 'tag-debug' : 'tag-manual'">{{ item.debugId ? '调试任务' : '手工服务' }}</text>
								<input v-if="!item.debugId" v-model="item.serviceName" class="svc-input" placeholder="输入服务内容名称" placeholder-class="ph" />
								<text v-else class="svc-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ debugTaskName(item) }}</text>
							</view>
							<view class="svc-right">
								<wd-switch v-model="item.passed" size="20px"></wd-switch>
								<text class="svc-pass" :style="{ color: item.passed ? '#18a058' : '#d03050' }">{{ item.passed ? '通过' : '未通过' }}</text>
								<text class="svc-del" @click="removeServiceItem(idx)">删除</text>
							</view>
						</view>
						<view class="add-svc" :style="{ color: isDark ? '#69b1ff' : '#3b82f6', borderColor: isDark ? '#69b1ff' : '#9ec5ff' }" @click="addManualService">＋ 新增手工服务内容</view>
					</view>
				</scroll-view>

				<view class="bottom-bar" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
					<wd-button type="primary" block :loading="saving" :disabled="!canSubmit" @click="handleSubmit">生成签名链接</wd-button>
				</view>
			</template>

			<!-- ============ 结果区 ============ -->
			<template v-else-if="result">
				<scroll-view :scroll-y="true" class="form-scroll" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
					<view class="result-banner" :style="{ background: isDark ? 'linear-gradient(135deg, #166534, #14532d)' : 'linear-gradient(135deg, #52c41a, #389e0d)' }">
						<view class="banner-icon">✅</view>
						<view class="banner-title">签名任务已创建</view>
						<view class="banner-desc">请先打开「待签名服务单」核对内容，确认无误后复制签名链接转发给客户微信。签名链接仅在生成时展示一次，请妥善保存。</view>
					</view>

					<view class="section card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">任务信息</text></view>
						<view class="info-rows">
							<view class="info-row"><text class="lbl">任务编号</text><text class="val">{{ result.taskNo || result.task_no || result.taskId || '-' }}</text></view>
							<view class="info-row"><text class="lbl">链接到期</text><text class="val">{{ result.expiresAt || result.expireTime || '-' }}</text></view>
							<view class="info-row"><text class="lbl">客户名称</text><text class="val">{{ result.customerName || selectedContractLabel || '-' }}</text></view>
						</view>
					</view>

					<view class="section card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">客户签名链接</text></view>
						<view class="link-box" :style="{ background: isDark ? '#1b1b1b' : '#f7f8fa', color: isDark ? '#e8e8e8' : '#1f2937' }">{{ result.signUrl || '-' }}</view>
						<view class="btn-row">
							<wd-button size="small" type="primary" @click="copySignText(result.signUrl, '签名链接不存在')">复制签名链接</wd-button>
							<wd-button v-if="result.unsignedDocUrl" size="small" plain @click="openFileSheet(result)">文件</wd-button>
						</view>
					</view>

					<view class="section card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
						<view class="section-title"><text :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">微信转发文案</text></view>
						<view class="link-box pre" :style="{ background: isDark ? '#1b1b1b' : '#f7f8fa', color: isDark ? '#e8e8e8' : '#1f2937' }">{{ forwardTemplate }}</view>
						<view class="btn-row">
							<wd-button size="small" type="primary" @click="copySignText(forwardTemplate, '转发文案为空')">复制转发文案</wd-button>
						</view>
					</view>
				</scroll-view>

				<view class="bottom-bar" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
					<view class="btn-row two">
						<wd-button plain block @click="handleCreateAnother">再创建一条</wd-button>
						<wd-button type="primary" block @click="handleFinish">完成</wd-button>
					</view>
				</view>
			</template>

			<!-- ============ 项目选择弹窗 ============ -->
			<wd-popup v-model="projectPopup" position="bottom" :z-index="500" custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
				<view class="picker-wrap" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
					<view class="picker-header" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">选择项目</view>
					<wd-search v-model="projectKeyword" placeholder="输入项目名称搜索" placeholder-left cancel-txt="搜索" @search="searchProjects" @cancel="searchProjects" @clear="clearProjects" />
					<scroll-view scroll-y class="picker-list">
						<view v-for="item in projectOptions" :key="item.id" class="picker-item" :class="{ active: form.projectId === item.id }" @click="selectProject(item)">
							<text class="picker-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ item.proname }}</text>
							<wd-icon v-if="form.projectId === item.id" name="check" size="36rpx" color="#3b82f6"></wd-icon>
						</view>
						<view v-if="!projectLoading && projectOptions.length === 0" class="picker-empty" :style="{ color: isDark ? '#6a6a6a' : '#9ca3af' }">暂无项目</view>
					</scroll-view>
				</view>
			</wd-popup>

			<!-- ============ 合同选择弹窗 ============ -->
			<wd-popup v-model="contractPopup" position="bottom" :z-index="500" custom-style="height: 60vh; border-radius: 24rpx 24rpx 0 0;">
				<view class="picker-wrap" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
					<view class="picker-header" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">选择客户合同</view>
					<scroll-view scroll-y class="picker-list">
						<view v-for="c in contractOptions" :key="c.id" class="picker-item" :class="{ active: form.contractId === c.id }" @click="selectContract(c)">
							<view class="picker-main">
								<text class="picker-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ c.contractname || c.contractName || '未命名合同' }}</text>
								<text v-if="c.contractnum || c.contractNum" class="picker-sub">编号：{{ c.contractnum || c.contractNum }}</text>
							</view>
							<wd-icon v-if="form.contractId === c.id" name="check" size="36rpx" color="#3b82f6"></wd-icon>
						</view>
						<view v-if="!contractLoading && contractOptions.length === 0" class="picker-empty" :style="{ color: isDark ? '#6a6a6a' : '#9ca3af' }">该项目下暂无关联合同</view>
					</scroll-view>
				</view>
			</wd-popup>

			<!-- ============ 联系人选择弹窗 ============ -->
			<wd-popup v-model="contactPopup" position="bottom" :z-index="500" custom-style="height: 60vh; border-radius: 24rpx 24rpx 0 0;">
				<view class="picker-wrap" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
					<view class="picker-header" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">选择项目联系人</view>
					<scroll-view scroll-y class="picker-list">
						<view v-for="c in contactList" :key="c.id || c.dbtime" class="picker-item" @click="selectContact(c)">
							<view class="picker-main">
								<text class="picker-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ c.pname || '-' }}</text>
								<text v-if="c.pcontact" class="picker-sub">{{ c.pcontact }}</text>
							</view>
							<wd-icon name="arrow-right" size="28rpx" :color="isDark ? '#6a6a6a' : '#c0c4cc'"></wd-icon>
						</view>
						<view v-if="contactList.length === 0" class="picker-empty" :style="{ color: isDark ? '#6a6a6a' : '#9ca3af' }">暂无联系人</view>
					</scroll-view>
				</view>
			</wd-popup>

			<!-- ============ 调试工程师选择弹窗 ============ -->
			<wd-popup v-model="engineerPopup" position="bottom" :z-index="500" custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
				<view class="picker-wrap" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
					<view class="picker-header" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">选择调试工程师</view>
					<wd-search v-model="engineerKeyword" placeholder="搜索工程师" placeholder-left cancel-txt="搜索" />
					<scroll-view scroll-y class="picker-list">
						<view v-for="u in filteredEngineers" :key="u.id" class="picker-item" :class="{ active: form.debugEngineerId === u.id }" @click="selectEngineer(u)">
							<text class="picker-name" :style="{ color: isDark ? '#e8e8e8' : '#1f2937' }">{{ u.username }}</text>
							<wd-icon v-if="form.debugEngineerId === u.id" name="check" size="36rpx" color="#3b82f6"></wd-icon>
						</view>
						<view v-if="!engineerLoading && filteredEngineers.length === 0" class="picker-empty" :style="{ color: isDark ? '#6a6a6a' : '#9ca3af' }">暂无工程师</view>
					</scroll-view>
				</view>
			</wd-popup>

			<wd-message-box />
		</view>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
import {
	fetchQueryContracts,
	fetchQueryProjects,
	fetchQueryDevices,
	fetchQueryDebugTasks,
	fetchCreateSignTask
} from '@/service/projectServiceSign'
import { fetchGetPrjMemberDataList, fetchGetAllUserDataList } from '@/service/index'
import { copySignText, contractLabel, deviceText, showFileActions, buildDocName } from '../common'

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

const userId = String(uni.getStorageSync('userId'))
const userType = Number(uni.getStorageSync('usertype'))

// ===== 表单 =====
const form = ref<{
	projectId: number | null
	contractId: number | null
	projectManager: string
	siteContact: string
	debugEngineerId: number | null
	deviceIds: number[]
	serviceItems: { debugId?: number; serviceName?: string; passed: boolean }[]
	expireHours: number
}>({
	projectId: null,
	contractId: null,
	projectManager: '',
	siteContact: '',
	debugEngineerId: null,
	deviceIds: [],
	serviceItems: [],
	expireHours: 24
})

const projectInfo = ref<{ proname?: string; proaddr?: string }>({})
const saving = ref(false)
const viewMode = ref<'form' | 'result'>('form')
const result = ref<any>(null)

// ===== 项目 =====
const projectPopup = ref(false)
const projectKeyword = ref('')
const projectOptions = ref<any[]>([])
const projectLoading = ref(false)
let projectSeq = 0

async function loadProjects(keyword?: string) {
	const seq = ++projectSeq
	projectLoading.value = true
	try {
		const data = await fetchQueryProjects(keyword || undefined)
		if (seq !== projectSeq) return
		projectOptions.value = Array.isArray(data) ? data : []
	} catch (e) {
		console.error('加载项目失败', e)
		projectOptions.value = []
	} finally {
		if (seq === projectSeq) projectLoading.value = false
	}
}
function searchProjects() {
	loadProjects(projectKeyword.value)
}
function clearProjects() {
	projectKeyword.value = ''
	loadProjects()
}
function selectProject(item: any) {
	form.value.projectId = item.id
	projectInfo.value = { proname: item.proname, proaddr: item.proaddr }
	projectPopup.value = false
}

function clearProject() {
	form.value.projectId = null
	form.value.contractId = null
	form.value.deviceIds = []
	form.value.serviceItems = []
	form.value.projectManager = ''
	form.value.siteContact = ''
	projectInfo.value = {}
}

// ===== 合同 =====
const contractPopup = ref(false)
const contractOptions = ref<any[]>([])
const contractLoading = ref(false)

const selectedContractLabel = computed(() => {
	if (!form.value.contractId) return ''
	const c = contractOptions.value.find((o: any) => o.id === form.value.contractId)
	return c ? contractLabel(c) : ''
})

function openContract() {
	if (!form.value.projectId) {
		uni.showToast({ title: '请先选择项目', icon: 'none' })
		return
	}
	contractPopup.value = true
}

async function loadContracts(projectId: number) {
	contractLoading.value = true
	try {
		const data = await fetchQueryContracts(projectId)
		contractOptions.value = Array.isArray(data) ? data : []
		if (!contractOptions.value.length) {
			uni.showToast({ title: '该项目下未查询到关联合同', icon: 'none' })
		}
	} catch (e) {
		console.error('加载合同失败', e)
		contractOptions.value = []
	} finally {
		contractLoading.value = false
	}
}
function selectContract(c: any) {
	form.value.contractId = c.id
	contractPopup.value = false
}

// ===== 设备 =====
const deviceOptions = ref<any[]>([])
const deviceLoading = ref(false)

async function loadDevices(contractId: number) {
	deviceLoading.value = true
	try {
		const data = await fetchQueryDevices(contractId)
		deviceOptions.value = Array.isArray(data) ? data : []
		if (!deviceOptions.value.length) {
			uni.showToast({ title: '该合同下未查询到提供设备', icon: 'none' })
		}
	} catch (e) {
		console.error('加载设备失败', e)
		deviceOptions.value = []
	} finally {
		deviceLoading.value = false
	}
}

const allDevicesSelected = computed(() =>
	deviceOptions.value.length > 0 && deviceOptions.value.every((d: any) => form.value.deviceIds.includes(d.id))
)

function handleSelectAllDevices() {
	if (!deviceOptions.value.length) return
	form.value.deviceIds = allDevicesSelected.value ? [] : deviceOptions.value.map((d: any) => d.id)
}
function toggleDevice(id: number) {
	const idx = form.value.deviceIds.indexOf(id)
	if (idx > -1) form.value.deviceIds.splice(idx, 1)
	else form.value.deviceIds.push(id)
}

// ===== 调试任务（自动带入服务内容） =====
const debugTaskOptions = ref<any[]>([])

async function loadDebugTasks(projectId: number) {
	try {
		const data = await fetchQueryDebugTasks(projectId)
		debugTaskOptions.value = Array.isArray(data) ? data : []
	} catch (e) {
		console.error('加载调试任务失败', e)
		debugTaskOptions.value = []
	}
}

function debugTaskName(item: any) {
	const t = debugTaskOptions.value.find((x: any) => x.id === item.debugId)
	return t?.debugname || `任务#${item.debugId}`
}

// ===== 项目联系人 =====
const contactList = ref<any[]>([])
const contactPopup = ref(false)
const contactTarget = ref<'pm' | 'sc'>('pm')

async function loadContacts(projectId: number) {
	try {
		const data = await fetchGetPrjMemberDataList({ page: 1, limit: 100, pid: projectId })
		const list = Array.isArray(data) ? data : data?.list
		contactList.value = Array.isArray(list) ? list : []
		// 自动赋值第一条联系人：pname→项目负责人、pcontact→现场联系人
		const first = contactList.value[0]
		if (first && !form.value.projectManager) {
			form.value.projectManager = first.pname || ''
			form.value.siteContact = first.pcontact || ''
		}
	} catch (e) {
		console.error('加载联系人失败', e)
		contactList.value = []
	}
}

function openContactPicker(target: 'pm' | 'sc') {
	if (!contactList.value.length) {
		uni.showToast({ title: '暂无联系人，请手动输入', icon: 'none' })
		return
	}
	contactTarget.value = target
	contactPopup.value = true
}
function selectContact(c: any) {
	form.value.projectManager = c.pname || ''
	form.value.siteContact = c.pcontact || ''
	contactPopup.value = false
}

// 项目负责人命中联系人 → 自动带出现场联系人
watch(() => form.value.projectManager, (val) => {
	const matched = contactList.value.find((c: any) => c.pname === val)
	if (matched) form.value.siteContact = matched.pcontact || ''
})

// ===== 调试工程师 =====
const engineerPopup = ref(false)
const engineerKeyword = ref('')
const engineerOptions = ref<any[]>([])
const engineerLoading = ref(false)

const debugEngineerName = computed(() => {
	const u = engineerOptions.value.find((x: any) => x.id === form.value.debugEngineerId)
	return u?.username || ''
})

const filteredEngineers = computed(() => {
	const kw = engineerKeyword.value.trim().toLowerCase()
	if (!kw) return engineerOptions.value
	return engineerOptions.value.filter((u: any) => {
		const name = `${u.username || ''}${u.realname || u.name || ''}`.toLowerCase()
		return name.includes(kw)
	})
})

async function loadEngineers() {
	engineerLoading.value = true
	try {
		const data = await fetchGetAllUserDataList({ page: 1, limit: 200, usertypes: '3,9' })
		engineerOptions.value = ((data?.list || []) as any[]).filter((u: any) => u.status == 0)
	} catch (e) {
		console.error('加载工程师失败', e)
		engineerOptions.value = []
	} finally {
		engineerLoading.value = false
	}
}
function selectEngineer(u: any) {
	form.value.debugEngineerId = u.id
	engineerPopup.value = false
}

// ===== 服务内容 =====
function addManualService() {
	form.value.serviceItems.push({ serviceName: '', passed: true })
}
function removeServiceItem(index: number) {
	form.value.serviceItems.splice(index, 1)
}

// ===== 有效期 =====
const expireHourOptions = [
	{ label: '1小时', value: 1 },
	{ label: '2小时', value: 2 },
	{ label: '4小时', value: 4 },
	{ label: '8小时', value: 8 },
	{ label: '12小时', value: 12 },
	{ label: '24小时（推荐）', value: 24 },
	{ label: '48小时', value: 48 },
	{ label: '72小时', value: 72 }
]

// ===== 级联 watch =====
watch(() => form.value.projectId, (val) => {
	form.value.contractId = null
	form.value.deviceIds = []
	form.value.serviceItems = []
	form.value.projectManager = ''
	form.value.siteContact = ''
	contractOptions.value = []
	deviceOptions.value = []
	debugTaskOptions.value = []
	contactList.value = []
	if (val) {
		loadContracts(val)
		loadDebugTasks(val)
		loadContacts(val)
	}
})

watch(() => form.value.contractId, (val) => {
	form.value.deviceIds = []
	deviceOptions.value = []
	if (val) loadDevices(val)
})

// 调试任务选项变化 → 自动加入服务内容（默认通过），保留手工项
watch(debugTaskOptions, (tasks) => {
	form.value.serviceItems = form.value.serviceItems.filter((item: any) => !item.debugId)
	tasks.forEach((task: any) => {
		form.value.serviceItems.push({ debugId: task.id, passed: true })
	})
})

// ===== 提交 =====
const canSubmit = computed(() => {
	return form.value.projectId != null &&
		form.value.contractId != null &&
		!!form.value.projectManager.trim() &&
		!!form.value.siteContact.trim() &&
		form.value.debugEngineerId != null &&
		form.value.deviceIds.length > 0 &&
		form.value.serviceItems.filter((item: any) => item.debugId || (item.serviceName && item.serviceName.trim())).length > 0
})

async function handleSubmit() {
	if (!form.value.projectId) { uni.showToast({ title: '请选择项目', icon: 'none' }); return }
	if (!form.value.contractId) { uni.showToast({ title: '请选择客户合同', icon: 'none' }); return }
	if (!form.value.projectManager.trim()) { uni.showToast({ title: '请输入项目负责人', icon: 'none' }); return }
	if (!form.value.siteContact.trim()) { uni.showToast({ title: '请输入现场联系人', icon: 'none' }); return }
	if (!form.value.debugEngineerId) { uni.showToast({ title: '请选择调试工程师', icon: 'none' }); return }
	if (!form.value.deviceIds.length) { uni.showToast({ title: '请至少选择1台设备', icon: 'none' }); return }
	if (form.value.deviceIds.length > 100) { uni.showToast({ title: '最多选择100台设备', icon: 'none' }); return }

	const validItems = form.value.serviceItems.filter((item: any) => item.debugId || (item.serviceName && item.serviceName.trim()))
	if (!validItems.length) { uni.showToast({ title: '请至少添加1条服务内容', icon: 'none' }); return }
	if (validItems.length > 100) { uni.showToast({ title: '服务内容最多100条', icon: 'none' }); return }

	saving.value = true
	try {
		const payload = {
			contractId: form.value.contractId!,
			projectId: form.value.projectId!,
			projectManager: form.value.projectManager.trim(),
			siteContact: form.value.siteContact.trim(),
			debugEngineerId: form.value.debugEngineerId!,
			deviceIds: form.value.deviceIds,
			serviceItems: validItems.map((item: any) => ({
				debugId: item.debugId,
				serviceName: item.serviceName?.trim() || undefined,
				passed: item.passed
			})),
			expireHours: form.value.expireHours
		}
		const data = await fetchCreateSignTask(payload)
		result.value = data
		viewMode.value = 'result'
		uni.showToast({ title: '签名任务创建成功', icon: 'none' })
		uni.$emit('refreshServiceSign')
	} catch (e) {
		console.error('创建失败', e)
	} finally {
		saving.value = false
	}
}

// ===== 结果区 =====
const forwardTemplate = computed(() => {
	const projectName = projectInfo.value?.proname || result.value?.projectName || '该项目'
	const expireText = result.value?.expiresAt || result.value?.expireTime || '链接到期时间'
	const signUrl = result.value?.signUrl || ''
	return [
		`您好，以下为【${projectName}】项目现场安装调试服务确认单。`,
		`请在【${expireText}】前使用微信打开链接，核对设备及服务内容后完成签名。`,
		`签名链接：【${signUrl}】`,
		'如内容有误，请勿签名并及时联系我们。'
	].join('\n')
})

function openFileSheet(item: any) {
	showFileActions({
		url: item.unsignedDocUrl,
		name: buildDocName(item, false)
	})
}

function resetForm() {
	form.value = {
		projectId: null,
		contractId: null,
		projectManager: '',
		siteContact: '',
		debugEngineerId: userType === 3 || userType === 9 ? Number(userId) : null,
		deviceIds: [],
		serviceItems: [],
		expireHours: 24
	}
	projectInfo.value = {}
	contractOptions.value = []
	deviceOptions.value = []
	debugTaskOptions.value = []
	contactList.value = []
	projectOptions.value = []
	projectKeyword.value = ''
	result.value = null
	viewMode.value = 'form'
}

function handleCreateAnother() {
	resetForm()
	loadProjects()
}
function handleFinish() {
	// 返回列表页
	handleClickLeft()
}

// 轮询等待条件成立（用于等待 watch 触发的异步加载完成），超时兜底
function waitFor(cond: () => boolean, timeout = 5000): Promise<void> {
	return new Promise((resolve) => {
		const start = Date.now()
		const timer = setInterval(() => {
			if (cond() || Date.now() - start > timeout) {
				clearInterval(timer)
				resolve()
			}
		}, 100)
	})
}

// ===== 重新生成：带入原项目/合同 =====
async function applyPreset(options: any) {
	if (!options.projectName) return
	const projectName = decodeURIComponent(options.projectName)
	const contractNo = options.contractNo ? decodeURIComponent(options.contractNo) : ''
	const contractName = options.contractName ? decodeURIComponent(options.contractName) : ''
	projectKeyword.value = projectName
	await loadProjects(projectName)
	const project = projectOptions.value.find((o: any) => o.proname === projectName)
	if (!project) {
		uni.showToast({ title: '未匹配到原项目，请手动选择项目', icon: 'none' })
		loadProjects()
		return
	}
	form.value.projectId = project.id
	projectInfo.value = { proname: project.proname, proaddr: project.proaddr }
	// 项目 watch 会异步加载该项目下的合同；等待其加载完成后回填原合同，避免被 watch 重置
	await waitFor(() => contractOptions.value.length > 0)
	const contract = contractOptions.value.find((o: any) =>
		(contractNo && (o.contractnum === contractNo || o.contractNum === contractNo)) ||
		(contractName && (o.contractname === contractName || o.contractName === contractName))
	)
	if (contract) {
		form.value.contractId = contract.id
	} else {
		uni.showToast({ title: '未匹配到原合同，请手动选择合同', icon: 'none' })
	}
}

// ===== 初始化 =====
onLoad((options: any) => {
	loadEngineers()
	// 技术工程师/组长默认选自己
	if (userType === 3 || userType === 9) {
		form.value.debugEngineerId = Number(userId)
	}
	if (options?.projectName) {
		applyPreset(options)
	} else {
		loadProjects()
	}
})

function handleClickLeft() {
	// #ifdef H5
	history.go(-1)
	// #endif
	// #ifndef H5
	uni.navigateBack()
	// #endif
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f6f8;
	box-sizing: border-box;
	overflow: hidden;
}

.form-scroll {
	flex: 1;
	min-height: 0;
	padding: 20rpx;
	box-sizing: border-box;
}

.section.card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 6rpx 20rpx rgba(58, 111, 255, 0.04);

	.section-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 30rpx;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 8rpx;

		.select-all {
			font-size: 24rpx;
			font-weight: 400;
			color: #6b7280;
			padding: 6rpx 20rpx;
			border-radius: 999rpx;
			border: 1rpx solid #d8dce3;

			&.active {
				color: #3b82f6;
				border-color: #3b82f6;
				background: rgba(59, 130, 246, 0.06);
			}
		}
	}
}

// cell 行
.cell-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 26rpx 4rpx;
	border-bottom: 1rpx solid #f0f1f3;
	min-height: 44rpx;

	&:last-of-type {
		border-bottom: none;
	}
	&.disabled {
		opacity: 0.5;
	}

	.cell-label {
		font-size: 28rpx;
		color: #1f2937;
		flex-shrink: 0;
	}

	.cell-value {
		display: flex;
		align-items: center;
		gap: 12rpx;
		flex: 1;
		min-width: 0;
		justify-content: flex-end;

		text {
			font-size: 28rpx;
			color: #1f2937;
			max-width: 440rpx;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.placeholder {
			color: #9ca3af;
		}
	}
}

// 带输入框的字段行
.field-row {
	display: flex;
	align-items: center;
	padding: 18rpx 4rpx;
	border-bottom: 1rpx solid #f0f1f3;

	.field-label {
		font-size: 28rpx;
		color: #1f2937;
		flex-shrink: 0;
		width: 160rpx;
	}

	.field-input {
		flex: 1;
		min-width: 0;
		font-size: 28rpx;
		color: #1f2937;
	}

	.pick-btn {
		flex-shrink: 0;
		font-size: 24rpx;
		color: #3b82f6;
		border: 1rpx solid #9ec5ff;
		border-radius: 999rpx;
		padding: 6rpx 20rpx;
		margin-left: 16rpx;
	}
}

// 信息展示
.info-rows {
	padding: 8rpx 4rpx;

	.info-row {
		display: flex;
		align-items: flex-start;
		padding: 6rpx 0;
		font-size: 24rpx;

		.lbl {
			flex-shrink: 0;
			width: 150rpx;
			color: #8a8f99;
		}

		.val {
			flex: 1;
			min-width: 0;
			color: #333;
			word-break: break-all;
		}
	}
}

.empty-hint {
	font-size: 24rpx;
	color: #9ca3af;
	padding: 30rpx 0 10rpx;
	text-align: center;
}

// 设备列表
.device-list {
	margin-top: 12rpx;

	.device-item {
		display: flex;
		align-items: center;
		padding: 20rpx 16rpx;
		border-radius: 12rpx;
		background: #f7f8fa;
		margin-bottom: 12rpx;
		border: 1rpx solid transparent;

		&.checked {
			background: rgba(59, 130, 246, 0.06);
			border-color: rgba(59, 130, 246, 0.4);
		}

		.device-check {
			width: 40rpx;
			height: 40rpx;
			border-radius: 50%;
			border: 2rpx solid #c0c4cc;
			margin-right: 16rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			box-sizing: border-box;

			&.on {
				background: #3b82f6;
				border-color: #3b82f6;
			}
		}

		.device-info {
			flex: 1;
			min-width: 0;

			.device-name {
				font-size: 28rpx;
				color: #1f2937;
			}

			.device-sub {
				font-size: 22rpx;
				color: #8a8f99;
				margin-top: 4rpx;
			}
		}
	}
}

// 服务内容
.service-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 16rpx;
	border-radius: 12rpx;
	background: #f7f8fa;
	margin-top: 16rpx;

	.svc-left {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;

		.svc-tag {
			flex-shrink: 0;
			font-size: 20rpx;
			padding: 4rpx 12rpx;
			border-radius: 8rpx;
			margin-right: 12rpx;

			&.tag-debug { color: #1677ff; background: rgba(22, 119, 255, 0.1); }
			&.tag-manual { color: #6b7280; background: rgba(128, 128, 128, 0.12); }
		}

		.svc-input {
			flex: 1;
			min-width: 0;
			font-size: 26rpx;
			color: #1f2937;
		}

		.svc-name {
			flex: 1;
			min-width: 0;
			font-size: 26rpx;
			color: #1f2937;
		}
	}

	.svc-right {
		display: flex;
		align-items: center;
		gap: 16rpx;
		flex-shrink: 0;
		margin-left: 16rpx;

		.svc-pass {
			font-size: 22rpx;
		}

		.svc-del {
			font-size: 22rpx;
			color: #d03050;
		}
	}
}

.add-svc {
	text-align: center;
	font-size: 26rpx;
	color: #3b82f6;
	border: 1rpx dashed #9ec5ff;
	border-radius: 12rpx;
	padding: 18rpx 0;
	margin-top: 16rpx;
}

.bottom-bar {
	flex-shrink: 0;
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: #ffffff;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);

	.btn-row.two {
		display: flex;
		gap: 20rpx;
	}
}

// 结果区
.result-banner {
	background: linear-gradient(135deg, #52c41a, #389e0d);
	border-radius: 20rpx;
	padding: 32rpx;
	margin-bottom: 20rpx;
	color: #ffffff;

	.banner-icon { font-size: 56rpx; }
	.banner-title { font-size: 34rpx; font-weight: 600; margin-top: 12rpx; }
	.banner-desc { font-size: 24rpx; line-height: 1.6; margin-top: 12rpx; opacity: 0.95; }
}

.link-box {
	background: #f7f8fa;
	border-radius: 12rpx;
	padding: 20rpx;
	font-size: 24rpx;
	color: #1f2937;
	margin: 16rpx 0;
	word-break: break-all;

	&.pre {
		white-space: pre-wrap;
		line-height: 1.6;
	}
}

.btn-row {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

// picker 弹窗
.picker-wrap {
	height: 100%;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;

	.picker-header {
		font-size: 32rpx;
		font-weight: 600;
		text-align: center;
		padding: 30rpx 0 20rpx;
	}

	.picker-list {
		flex: 1;
		min-height: 0;

		.picker-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 26rpx 30rpx;
			border-bottom: 1rpx solid rgba(128, 128, 128, 0.12);

			&.active {
				background: rgba(59, 130, 246, 0.08);
			}

			.picker-main {
				flex: 1;
				min-width: 0;

				.picker-name {
					font-size: 28rpx;
					color: #1f2937;
					display: block;
				}

				.picker-sub {
					font-size: 22rpx;
					color: #8a8f99;
					margin-top: 4rpx;
					display: block;
				}
			}

			.picker-name {
				font-size: 28rpx;
				color: #1f2937;
				flex: 1;
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.picker-empty {
			text-align: center;
			padding: 60rpx 0;
			font-size: 26rpx;
			color: #9ca3af;
		}
	}
}

.ph {
	color: #9ca3af;
}
</style>
