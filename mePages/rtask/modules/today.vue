<template>
	<view class="today-wrap">
		<!-- 统计 -->
		<view class="stats-grid">
			<view v-for="item in statList" :key="item.label" class="stat-cell">
				<text class="stat-num" :style="{ color: item.color || textColor }">{{ item.value }}</text>
				<text class="stat-label" :style="{ color: subColor }">{{ item.label }}</text>
			</view>
		</view>

		<!-- 筛选 -->
		<view class="filter-wrap">
			<view class="filter-head" @click="filterExpanded = !filterExpanded">
				<view class="filter-head-left">
					<text class="filter-title" :style="{ color: textColor }">筛选</text>
					<text class="filter-summary" :style="{ color: subColor }">{{ filterSummary }}</text>
				</view>
				<view class="filter-head-right">
					<wd-button size="small" type="primary" :loading="loading" @click.stop="handleRefresh">查询</wd-button>
					<text class="filter-arrow" :style="{ color: subColor }">{{ filterExpanded ? '收起' : '展开' }}</text>
				</view>
			</view>
			<view v-if="filterExpanded" class="filter-body">
				<view class="filter-row">
					<text class="filter-label" :style="{ color: subColor }">类型</text>
					<view class="segment">
						<view v-for="opt in filterTypeOptions" :key="opt.value" class="segment-item" :style="segmentItemStyle(filterType === opt.value)" @click="selectType(opt.value)">
							{{ opt.label }}
						</view>
					</view>
				</view>
				<view class="filter-row">
					<text class="filter-label" :style="{ color: subColor }">状态</text>
					<view class="segment">
						<view v-for="opt in statusOptions" :key="opt.value" class="segment-item" :style="segmentItemStyle(filterStatus === opt.value)" @click="selectStatus(opt.value)">
							{{ opt.label }}
						</view>
					</view>
				</view>
				<view class="filter-row">
					<text class="filter-label" :style="{ color: subColor }">范围</text>
					<picker :range="filterCreateOptions" range-key="label" :value="filterCreateIndex" @change="onCreateChange">
						<view class="picker-cell" :style="{ color: textColor, borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb' }">
							{{ filterCreateLabel }}
						</view>
					</picker>
					<text class="filter-label" :style="{ color: subColor, marginLeft: '20rpx' }">日期</text>
					<picker mode="date" :value="filterDate || ''" @change="onDateChange">
						<view class="picker-cell" :style="{ color: textColor, borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb' }">
							{{ filterDate || '选择日期' }}
						</view>
					</picker>
					<text class="filter-label" :style="{ color: subColor, marginLeft: '20rpx' }">延期</text>
					<picker :range="delayedOptions" range-key="label" :value="filterDelayedIndex" @change="onDelayedChange">
						<view class="picker-cell picker-cell-sm" :style="{ color: textColor, borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb' }">
							{{ filterDelayedLabel }}
						</view>
					</picker>
				</view>
			</view>
		</view>


		<!-- 列表 -->
		<scroll-view :scroll-y="true" :scroll-into-view="scrollIntoId" refresher-enabled :refresher-triggered="triggered" @refresherrefresh="onRefresh" @scrolltolower="loadMore" class="list-scroll">
			<view id="listTop" />

			<!-- 层级展示：组 → 人 → 项目 → 任务 -->
			<view v-for="section in displaySections" :key="section.key" class="section-block">
				<view v-if="section.type === 'group'" class="team-header" :style="{ background: isDark ? '#1d2a3a' : '#eef4ff' }" @click="toggleGroup(section.group)">
					<text class="team-header-name" :style="{ color: textColor }">{{ section.group.tname || '未命名项目组' }}</text>
					<text class="team-header-count" :style="{ color: subColor }">{{ section.users.length }} 人 · {{ sectionTaskCount(section) }} 个任务</text>
					<text class="team-header-arrow" :style="{ color: subColor }">{{ groupExpandedFn(section.group) ? '收起' : '展开' }}</text>
				</view>
				<view v-if="section.type !== 'group' || groupExpandedFn(section.group)" class="section-body">
					<view v-for="user in section.users" :key="user.creater" class="user-block">
						<!-- 用户分组头 -->
						<view class="user-header" :style="{ background: isDark ? '#1c1c1e' : '#ffffff' }" @click="toggleUser(user)">
							<view class="user-avatar" :style="{ background: avatarColor(user.username) }">
								{{ (user.username || '?').charAt(0) }}
							</view>
							<text class="user-name" :style="{ color: textColor }">{{ user.username }}</text>
							<text class="user-count" :style="{ color: subColor }">{{ taskCountOf(user) }} 个任务</text>
							<text class="header-arrow" :style="{ color: subColor }">{{ userExpanded(user) ? '收起' : '展开' }}</text>
						</view>

						<!-- 项目分组 -->
						<view v-if="userExpanded(user)" class="user-projects">
							<view v-for="project in user.projects" :key="project.realTimeId || project.id" class="project-block">
								<view class="project-header" @click="toggleProject(project)">
									<view class="project-info">
										<view class="project-name-row">
											<text class="project-name-icon">📁</text>
											<text class="project-name" :style="{ color: textColor }">{{ project.proname || '未命名项目' }}</text>
										</view>
										<view class="project-wechat-row">
											<text class="wechat-icon">💬</text>
											<text class="project-wechat" :style="{ color: subColor }">{{ project.weChatName || '无微信群' }}</text>
											<text v-if="project.weChatName" class="wechat-copy" :style="{ color: '#3b82f6' }" @click.stop="copyText(project.weChatName)">复制</text>
										</view>
									</view>
									<view class="project-meta">
										<text class="project-count" :style="{ color: subColor }">{{ project.tasks.length }} 个</text>
										<text class="header-arrow" :style="{ color: subColor }">{{ projectExpanded(project) ? '收起' : '展开' }}</text>
									</view>
								</view>
								<view v-if="projectExpanded(project)" class="project-tasks">
									<view v-for="task in project.tasks" :key="task.id" class="task-slot">
										<taskcard :task="task" :simple="true" @reload="handleRefresh" />
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view v-if="!loading && isEmpty" class="empty">暂无任务数据</view>
			<view class="bottom-space"></view>
		</scroll-view>

		<!-- 新增任务 -->
		<wd-fab v-if="isManager" :disabled="clickLock" :draggable="true" position="right-bottom" :z-index="2" :gap="{ bottom: 40 }" :expandable="false" @click="openAdd"></wd-fab>
	</view>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import { fetchGetTodayTaskUserList } from '@/service/task'
import { fetchGetProjectTeamDataList, fetchGetUserDataList } from '@/service/index'
import { MANAGE_USER_TYPES } from './constants'
import taskcard from './taskcard.vue'

const props = defineProps<{ contentHeight: number }>()

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))
const lineColor = computed(() => (isDark.value ? 'rgba(255,255,255,0.16)' : '#e5e7eb'))

function copyText(text: string) {
    if (!text) return
    uni.setClipboardData({
        data: text,
        success: () => uni.showToast({ title: '已复制', icon: 'none' }),
    })
}

const userType = Number(uni.getStorageSync('usertype'))
const isManager = MANAGE_USER_TYPES.includes(userType)

const clickLock = ref(false)

// ===== 统计 =====
const stats = ref<any>({ userCount: 0, taskCount: 0, projectCount: 0, pausedCount: 0, debuggingCount: 0, completedCount: 0, delayedCount: 0 })
const statList = computed(() => [
    { label: '参与人员', value: stats.value.userCount, color: '' },
    { label: '涉及项目', value: stats.value.projectCount, color: '' },
    { label: '任务总数', value: stats.value.taskCount, color: '' },
    { label: '调试中', value: stats.value.debuggingCount, color: '#3b82f6' },
    { label: '暂停', value: stats.value.pausedCount, color: '#facc15' },
    { label: '已完成', value: stats.value.completedCount, color: '#22c55e' },
    { label: '延期', value: stats.value.delayedCount, color: '#ef4444' },
])

// ===== 筛选 =====
const filterTypeOptions = [
    { label: '全部', value: 'all' },
    { label: '项目组', value: 'team' },
    { label: '个人', value: 'user' },
]
const statusOptions = [
    { label: '全部', value: -1 },
    { label: '调试中', value: 1 },
    { label: '暂停', value: 2 },
    { label: '已完成', value: 3 },
]
// 是否延期：0 否、1 是；不传不限制
const delayedOptions = [
    { label: '全部', value: -1 },
    { label: '否', value: 0 },
    { label: '是', value: 1 },
]
const filterType = ref<string>('user')
const filterStatus = ref<number>(1)
const filterDelayed = ref<number>(-1)
// usertype 为 2/3/9（管理者）时默认查询范围是自己
const filterCreate = ref<string>(isManager ? String(uni.getStorageSync('userId')) : 'all')
const filterDate = ref<string>('')
const filterExpanded = ref(false)

const teamList = ref<any[]>([])
const userSList = ref<any[]>([])
const groupEntries = ref<any[]>([])

const filterCreateOptions = computed(() => {
    if (filterType.value === 'all') return [{ label: '全部', value: 'all' }]
    const options = [{ label: '全部', value: 'all' }]
    if (filterType.value === 'user') {
        userSList.value.forEach((u) => options.push({ label: u.username, value: String(u.id) }))
    } else if (filterType.value === 'team') {
        teamList.value.forEach((g) => options.push({ label: g.tname, value: String(g.id) }))
    }
    return options
})
const filterCreateIndex = computed(() => {
    const idx = filterCreateOptions.value.findIndex((o) => o.value === filterCreate.value)
    return idx === -1 ? 0 : idx
})
const filterCreateLabel = computed(() => filterCreateOptions.value[filterCreateIndex.value]?.label || '全部')
const filterDelayedIndex = computed(() => {
    const idx = delayedOptions.findIndex((o) => o.value === filterDelayed.value)
    return idx === -1 ? 0 : idx
})
const filterDelayedLabel = computed(() => delayedOptions[filterDelayedIndex.value]?.label || '全部')
const filterSummary = computed(() => {
    const parts: string[] = []
    const type = filterTypeOptions.find((o) => o.value === filterType.value)?.label || ''
    const status = statusOptions.find((o) => o.value === filterStatus.value)?.label || ''
    parts.push(type, status)
    if (filterDelayed.value !== -1) parts.push(`延期·${delayedOptions.find((o) => o.value === filterDelayed.value)?.label || ''}`)
    if (filterType.value !== 'all') parts.push(filterCreateLabel.value)
    if (filterDate.value) parts.push(filterDate.value)
    return parts.join(' · ')
})

function onFilterTypeChange() {
    filterCreate.value = 'all'
    handleRefresh()
}
function onCreateChange(e: any) {
    filterCreate.value = filterCreateOptions.value[e.detail.value]?.value || 'all'
    handleRefresh()
}
function onDateChange(e: any) {
    filterDate.value = e.detail.value || ''
    handleRefresh()
}
function handleFilterChange() {
    handleRefresh()
}

// ===== 分段控件 =====
function segmentItemStyle(active: boolean) {
    if (active) {
        return { background: isDark.value ? '#3d3d3f' : '#ffffff', color: '#3b82f6', fontWeight: '600' }
    }
    return { color: subColor.value }
}
function selectType(v: string) {
    if (filterType.value === v) return
    filterType.value = v
    onFilterTypeChange()
}
function selectStatus(v: number) {
    if (filterStatus.value === v) return
    filterStatus.value = v
    handleRefresh()
}
function onDelayedChange(e: any) {
    filterDelayed.value = delayedOptions[e.detail.value]?.value ?? -1
    handleRefresh()
}

// ===== 数据加载 =====
const loading = ref(false)
const triggered = ref(false)
const userList = ref<any[]>([])
const scrollIntoId = ref('')
let loadSeq = 0 // 请求序号：只采纳最新一次请求的响应，丢弃过期响应
let filterTimer: ReturnType<typeof setTimeout> | null = null // 筛选防抖定时器

function avatarColor(name: string) {
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
    let sum = 0
    for (let i = 0; i < (name || '').length; i++) sum += (name as any).charCodeAt(i)
    return colors[sum % colors.length]
}

function taskCountOf(user: any) {
    return (user.projects || []).reduce((acc: number, p: any) => acc + (p.tasks || []).length, 0)
}

// ===== 层级展示（组 → 人 → 项目 → 任务）=====
const displaySections = computed(() => {
    if (filterType.value === 'team' && (!filterCreate.value || filterCreate.value === 'all')) {
        return groupEntries.value.map((e) => ({ type: 'group', group: e.group, users: e.users, key: e.group.id }))
    }
    if (selectedGroup.value) {
        return [{ type: 'group', group: selectedGroup.value, users: userList.value, key: selectedGroup.value.id }]
    }
    return [{ type: 'flat', users: userList.value, key: 'flat' }]
})
function sectionTaskCount(section: any) {
    return (section.users || []).reduce((acc: number, u: any) => acc + taskCountOf(u), 0)
}
const isEmpty = computed(() => {
    if (!displaySections.value.length) return true
    return displaySections.value.every((s: any) => !(s.users || []).length)
})

// ===== 分组折叠 =====
const collapsedUsers = ref<Set<string | number>>(new Set())
const collapsedProjects = ref<Set<string | number>>(new Set())
const collapsedGroups = ref<Set<string | number>>(new Set())
function groupExpandedFn(group: any) {
    return !collapsedGroups.value.has(group.id)
}
function toggleGroup(group: any) {
    const s = new Set(collapsedGroups.value)
    if (s.has(group.id)) s.delete(group.id); else s.add(group.id)
    collapsedGroups.value = s
}
function userExpanded(user: any) {
    return !collapsedUsers.value.has(user.creater)
}
function projectExpanded(project: any) {
    return !collapsedProjects.value.has(project.realTimeId ?? project.id)
}
function toggleUser(user: any) {
    const s = new Set(collapsedUsers.value)
    if (s.has(user.creater)) s.delete(user.creater); else s.add(user.creater)
    collapsedUsers.value = s
}
function toggleProject(project: any) {
    const key = project.realTimeId ?? project.id
    const s = new Set(collapsedProjects.value)
    if (s.has(key)) s.delete(key); else s.add(key)
    collapsedProjects.value = s
}

async function loadData() {
    const seq = ++loadSeq
    loading.value = true
    try {
        const query = {
            ...(filterStatus.value !== -1 ? { status: filterStatus.value } : {}),
            ...(filterDelayed.value !== -1 ? { isdelayed: filterDelayed.value } : {}),
            ...(filterDate.value ? { date: filterDate.value } : {}),
        }
        // 类型为项目组且范围=全部：按组分别查询，页面按 组名→人→项目→任务 层级展示
        if (filterType.value === 'team' && (!filterCreate.value || filterCreate.value === 'all')) {
            // 汇总所有已分组人员，其余人员归入「未分组」
            const groupedIds = new Set<number>()
            teamList.value.forEach((g: any) => getGroupMemberIds(g).forEach((id: number) => groupedIds.add(id)))
            const ungroupedIds = userSList.value
                .filter((u: any) => !groupedIds.has(Number(u.id)))
                .map((u: any) => Number(u.id))

            const entries = await Promise.all([
                ...teamList.value.map(async (g: any) => {
                    const members = getGroupMemberIds(g)
                    if (!members.length) return { group: g, users: [] }
                    try {
                        const data = await fetchGetTodayTaskUserList({ creaters: members, ...query })
                        return { group: g, users: data.users || [] }
                    } catch (e) {
                        console.error('加载小组任务失败', g.id, e)
                        return { group: g, users: [] }
                    }
                }),
                // 未分组人员单独成组
                ...(ungroupedIds.length
                    ? [
                          (async () => {
                              try {
                                  const data = await fetchGetTodayTaskUserList({ creaters: ungroupedIds, ...query })
                                  const users = data.users || []
                                  if (!users.length) return null
                                  return { group: { id: 'ungrouped', tname: '未分组' }, users }
                              } catch (e) {
                                  console.error('加载未分组任务失败', e)
                                  return null
                              }
                          })(),
                      ]
                    : []),
            ])
            if (seq !== loadSeq) return // 已有更新的请求在途，丢弃本次过期响应
            const valid = entries.filter(Boolean)
            // 先置空再赋值：uni-app vue3 视图层直接整体替换渲染数组会抛 remove/setAttr 未定义
            groupEntries.value = []
            groupEntries.value = valid
            userList.value = []
            computeStatsFromEntries(valid)
        } else {
            let creaters: number[] | undefined
            if (filterType.value === 'user') {
                if (filterCreate.value && filterCreate.value !== 'all') creaters = [Number(filterCreate.value)]
            } else if (filterType.value === 'team') {
                if (filterCreate.value && filterCreate.value !== 'all') {
                    const group = teamList.value.find((g) => g.id === Number(filterCreate.value))
                    if (group) creaters = getGroupMemberIds(group)
                }
            }
            const data = await fetchGetTodayTaskUserList({
                ...(creaters && creaters.length ? { creaters } : {}),
                ...query,
            })
            if (seq !== loadSeq) return // 已有更新的请求在途，丢弃本次过期响应
            // 先置空再赋值：uni-app vue3 视图层直接整体替换渲染数组会抛 remove/setAttr 未定义
            userList.value = []
            userList.value = data.users || []
            groupEntries.value = []
            stats.value = {
                userCount: data.userCount || 0,
                taskCount: data.taskCount || 0,
                projectCount: data.projectCount || 0,
                pausedCount: data.pausedCount || 0,
                debuggingCount: data.debuggingCount || 0,
                completedCount: data.completedCount || 0,
                delayedCount: data.delayedCount || 0,
            }
        }
    } catch (e) {
        if (seq !== loadSeq) return
        console.error('加载今日任务失败', e)
        userList.value = []
        groupEntries.value = []
    } finally {
        if (seq === loadSeq) {
            loading.value = false
            triggered.value = false
        }
    }
}

function getGroupMemberIds(group: any): number[] {
    const members: number[] = []
    if (group.teamleader) members.push(Number(group.teamleader))
    if (group.list) group.list.forEach((m: any) => { if (m.teammember) members.push(Number(m.teammember)) })
    return members
}

function computeStatsFromEntries(entries: any[]) {
    const allUsers = entries.flatMap((e) => e.users || [])
    const tasks = allUsers.flatMap((u) => (u.projects || []).flatMap((p: any) => p.tasks || []))
    const projects = allUsers.flatMap((u) => u.projects || [])
    stats.value = {
        userCount: new Set(allUsers.map((u) => u.creater)).size,
        taskCount: tasks.length,
        projectCount: new Set(projects.map((p: any) => p.realTimeId ?? p.id)).size,
        pausedCount: tasks.filter((t: any) => Number(t.status) === 2).length,
        debuggingCount: tasks.filter((t: any) => Number(t.status) === 1).length,
        completedCount: tasks.filter((t: any) => Number(t.status) === 3).length,
        delayedCount: tasks.filter((t: any) => Number(t.isdelayed) === 1).length,
    }
}

// 筛选变化：防抖合并（快速连续切换只发最后一次请求），避免并发请求导致卡顿/列表错乱
function handleRefresh() {
    scrollIntoId.value = 'listTop'
    setTimeout(() => { scrollIntoId.value = '' }, 100)
    if (filterTimer) clearTimeout(filterTimer)
    filterTimer = setTimeout(() => {
        filterTimer = null
        loadData()
    }, 200)
}

function onRefresh() {
    triggered.value = true
    loadData()
}

// 看板一次性返回全部数据，无需分页
function loadMore() {}

// ===== 新增任务 =====
function openAdd() {
    if (clickLock.value) return
    clickLock.value = true
    setTimeout(() => { clickLock.value = false }, 500)
    uni.navigateTo({ url: '/mePages/rtask/addtask/Index' })
}

// ===== 获取小组与用户 =====
const selectedGroup = computed(() => {
    if (filterType.value !== 'team') return null
    if (!filterCreate.value || filterCreate.value === 'all') return null
    return teamList.value.find((g) => g.id === Number(filterCreate.value)) || null
})
async function getTeamList() {
    try {
        const data = await fetchGetProjectTeamDataList({ page: 1, limit: 100 })
        teamList.value = [] // 先置空再赋值，避免视图层直接替换渲染数组报错
        teamList.value = data.list || []
    } catch (e) {
        console.error('获取项目组失败', e)
    }
}
async function getUserList() {
    try {
        const data = await fetchGetUserDataList({ page: 1, limit: 100 })
        const list = data.list || []
        const filtered = list.filter((item: any) => MANAGE_USER_TYPES.includes(item.usertype) && item.status == 0)
        userSList.value = [] // 先置空再赋值，避免视图层直接替换渲染数组报错
        userSList.value = filtered
    } catch (e) {
        console.error('获取用户列表失败', e)
    }
}

// ===== 生命周期 =====
let timer: any = null
onMounted(() => {
    loadData()
    getTeamList()
    getUserList()
    uni.$on('refreshRealtimeTask', handleRefresh) // 新增任务页保存后刷新
    // 60s 自动刷新
    timer = setInterval(() => {
        loadData()
    }, 60 * 1000)
})
onBeforeUnmount(() => {
    uni.$off('refreshRealtimeTask', handleRefresh)
    if (timer) {
        clearInterval(timer)
        timer = null
    }
})
</script>

<style lang="scss" scoped>
.today-wrap {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .stats-grid {
        flex-shrink: 0;
        display: flex;
        padding: 12rpx 20rpx 0;

        .stat-cell {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8rpx 0;

            .stat-num {
                font-size: 28rpx;
                font-weight: 700;
                line-height: 1.2;
            }

            .stat-label {
                font-size: 18rpx;
                margin-top: 2rpx;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }

    .filter-wrap {
        flex-shrink: 0;
        padding: 0 20rpx;

        .filter-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16rpx 0;

            .filter-head-left {
                display: flex;
                align-items: center;
                gap: 16rpx;
                flex: 1;
                min-width: 0;
            }

            .filter-title {
                font-size: 28rpx;
                font-weight: 600;
            }

            .filter-summary {
                font-size: 22rpx;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .filter-head-right {
                display: flex;
                align-items: center;
                gap: 16rpx;
            }

            .filter-arrow {
                font-size: 22rpx;
            }
        }

        .filter-body {
            padding: 4rpx 0 12rpx;
        }

        .segment {
            flex: 1;
            min-width: 0;
            display: flex;
            background: rgba(128, 128, 128, 0.12);
            border-radius: 14rpx;
            padding: 4rpx;

            .segment-item {
                flex: 1;
                text-align: center;
                padding: 10rpx 0;
                font-size: 24rpx;
                line-height: 1.2;
                border-radius: 11rpx;
                transition: all 0.15s;
            }
        }

        .filter-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            padding: 10rpx 0;

            .filter-label {
                font-size: 24rpx;
                flex-shrink: 0;
                width: 64rpx;
            }

            .picker-cell {
                min-width: 160rpx;
                max-width: 360rpx;
                padding: 8rpx 20rpx;
                border: 1rpx solid;
                border-radius: 12rpx;
                font-size: 24rpx;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                box-sizing: border-box;
            }

            .picker-cell-sm {
                min-width: 88rpx;
                max-width: 120rpx;
                padding: 8rpx 14rpx;
            }
        }
    }

    .list-scroll {
        flex: 1;
        min-height: 0;
        margin-top: 10rpx;

        .user-header {
            display: flex;
            align-items: center;
            gap: 16rpx;
            padding: 20rpx;
            margin-bottom: 16rpx;
            border-radius: 16rpx;

            .user-avatar {
                width: 56rpx;
                height: 56rpx;
                border-radius: 50%;
                color: #fff;
                font-size: 28rpx;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .user-name {
                font-size: 28rpx;
                font-weight: 600;
            }

            .user-count {
                font-size: 22rpx;
            }

            .header-arrow {
                font-size: 22rpx;
                margin-left: auto;
            }
        }

        .project-block {
            margin-left: 24rpx;
            padding: 0 20rpx 0 24rpx;
            border-left: 2rpx solid;
            border-left-color: v-bind(lineColor);

            .project-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12rpx 4rpx 16rpx;

                .project-info {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    flex: 1;

                    .project-name {
                        font-size: 28rpx;
                        font-weight: 600;
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                        overflow: hidden;
                        word-break: break-all;
                    }

                    .project-wechat {
                        font-size: 22rpx;
                        margin-top: 4rpx;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }

                .project-name-row {
                    display: flex;
                    align-items: center;
                    gap: 8rpx;

                    .project-name-icon {
                        font-size: 26rpx;
                        flex-shrink: 0;
                    }

                    .project-name {
                        flex: 1;
                        min-width: 0;
                    }
                }

                .project-wechat-row {
                    display: flex;
                    align-items: center;
                    min-width: 0;
                    margin-top: 4rpx;

                    .wechat-icon {
                        font-size: 22rpx;
                        flex-shrink: 0;
                        margin-right: 12rpx;
                    }

                    .project-wechat {
                        flex: 0 1 auto;
                        min-width: 0;
                        margin-top: 0;
                        font-size: 22rpx;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .wechat-copy {
                        font-size: 22rpx;
                        flex-shrink: 0;
                        margin-left: 12rpx;
                        padding: 2rpx 10rpx;
                        border-radius: 8rpx;
                        background: rgba(59, 130, 246, 0.1);
                    }
                }

                .project-meta {
                    display: flex;
                    align-items: center;
                    gap: 12rpx;
                    flex-shrink: 0;
                    margin-left: 16rpx;
                }

                .project-count {
                    font-size: 22rpx;
                }

                .header-arrow {
                    font-size: 22rpx;
                }
            }

            .task-slot {
                margin-left: 20rpx;
                padding-left: 20rpx;
                padding-bottom: 4rpx;
                border-left: 2rpx solid;
                border-left-color: v-bind(lineColor);
            }
        }

        .team-header {
            display: flex;
            align-items: center;
            gap: 16rpx;
            padding: 20rpx;
            margin-bottom: 16rpx;
            border-radius: 16rpx;

            .team-header-name {
                font-size: 30rpx;
                font-weight: 700;
                flex-shrink: 0;
                max-width: 50%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .team-header-count {
                font-size: 22rpx;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: right;
                margin-right: 16rpx;
            }

            .team-header-arrow {
                font-size: 22rpx;
                flex-shrink: 0;
            }
        }

        .empty {
            text-align: center;
            padding: 100rpx 0;
            font-size: 26rpx;
            color: v-bind(subColor);
        }

        .bottom-space {
            height: 160rpx;
        }
    }

}
</style>
