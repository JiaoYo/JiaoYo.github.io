<template>
	<view class="addtask-page">
		<wd-navbar left-arrow title="新增实时任务" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>

		<view class="form-wrap">
			<view class="card">
				<!-- 所属项目 -->
				<wd-cell
	        title="所属项目"
	        :value="form.pname || '请选择项目'"
	        is-link
	        @click="prjShow = true"
	      >
	        <template #title>
	          <view class="project-value">
	              <text>
	              {{'所属项目' }}
	            </text>
	            <wd-icon
	              v-if="form.pid"
	              class="clear-project"
	              name="close-circle"
	              size="30rpx"
	              color="#3b82f6"
	              @click.stop="clearProject"
	            ></wd-icon>
	          </view>
	        </template>
	      </wd-cell>
				<wd-cell v-if="!form.pid">
					<wd-input v-model="newPname" label="项目名称" placeholder="未选项目时请填写项目名称" clearable />
				</wd-cell>
				<wd-cell>
					<wd-input v-model="form.weChatName" label="微信群名" placeholder="请输入微信群名" :readonly="isAddTimeConfig" :clearable="!isAddTimeConfig" />
				</wd-cell>
				<wd-cell>
					<wd-input v-model="form.taskName" label="任务名称" placeholder="请输入任务名称" :maxlength="255" />
				</wd-cell>

				<wd-cell title="预计完成日期">
					<picker mode="date" :value="form.ecd" :start="todayStr" @change="onEcdChange">
						<text :style="form.ecd ? { color: isDark ? '#e5e5e5' : '#1f2937' } : { color: isDark ? '#8e8e93' : '#9ca3af' }">{{ form.ecd || '请选择预计完成日期' }}</text>
					</picker>
				</wd-cell>
			</view>

			<view class="btn-row">
				<wd-button size="medium" plain @click="handleClickLeft">取消</wd-button>
				<wd-button size="medium" type="primary" :loading="saving" @click="handleAdd">确定</wd-button>
			</view>
		</view>

		<!-- 项目选择弹窗 -->
		<wd-popup v-model="prjShow" position="left" :z-index="500" custom-style="width: 82vw; height: 100vh;">
			<view class="prj-picker">
				<view class="prj-header" :style="{ color: isDark ? '#ffffff' : '#1f2937' }">选择项目</view>
				<wd-search v-model="fuzzy" placeholder="搜索项目" placeholder-left cancel-txt="搜索" @search="handleSearch" @cancel="handleSearch" @clear="handleClear" />
				<scroll-view scroll-y class="prj-list" :style="{ height: 'calc(100vh - 200rpx)' }" @scrolltolower="loadMoreProject">
					<view v-for="item in projectList" :key="item.id" class="prj-item" :class="{ active: form.pid === item.id }" @click="selectProject(item)">
						<text class="prj-name" :style="{ color: isDark ? '#e5e5e5' : '#1f2937' }">{{ item.proname }}</text>
						<text v-if="form.pid === item.id" class="prj-check">✓</text>
					</view>
					<view v-if="!loadingProject && projectList.length === 0" class="prj-empty">暂无项目</view>
					<wd-loadmore :state="prjState" @reload="loadProject" />
				</scroll-view>
			</view>
		</wd-popup>
	</view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
import { fetchGetTaskConfig, fetchInsertTask, fetchInsertTaskConfig } from '@/service/task'
import { fetchGetPrjDataList } from '@/service/index'

const { theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

// ===== 表单 =====
const form = ref<any>({ pid: null, pname: '', weChatName: '', taskName: '', ecd: '' })
const newPname = ref('')
const isAddTimeConfig = ref(false)
const timeConfigId = ref<any>(null)
const saving = ref(false)

// ===== 项目列表 =====
const prjShow = ref(false)
const fuzzy = ref('')
const projectList = ref<any[]>([])
const prjPage = ref(1)
const prjTotal = ref(0)
const loadingProject = ref(false)
const prjState = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore')

async function loadProject(reset = false) {
    if (reset) {
        prjPage.value = 1
        projectList.value = []
        prjTotal.value = 0
    }
    loadingProject.value = true
    prjState.value = 'loading'
    try {
        const data = await fetchGetPrjDataList({
            page: prjPage.value,
            limit: 20,
            ...(fuzzy.value ? { fuzzy: fuzzy.value } : {}),
        })
        const list = data.list || []
        prjTotal.value = data.total || 0
        projectList.value = prjPage.value === 1 ? list : [...projectList.value, ...list]
        prjState.value = projectList.value.length >= prjTotal.value ? 'finished' : 'loadmore'
    } catch (e) {
        console.error('加载项目列表失败', e)
        prjState.value = 'error'
    } finally {
        loadingProject.value = false
    }
}

function handleSearch() {
    loadProject(true)
}
function handleClear() {
    fuzzy.value = ''
    loadProject(true)
}
function loadMoreProject() {
    if (prjState.value === 'finished' || prjState.value === 'loading') return
    prjPage.value++
    loadProject()
}

// ===== 获取已有实时配置 =====
async function getTimeConfig(pid: number) {
    try {
        const data = await fetchGetTaskConfig({ page: 1, limit: 10, pid })
        if (data.list && data.list.length === 1) {
            isAddTimeConfig.value = true
            timeConfigId.value = data.list[0].id
            form.value.weChatName = data.list[0].weChatName || ''
        } else {
            isAddTimeConfig.value = false
            timeConfigId.value = null
        }
    } catch (e) {
        console.error('获取任务配置失败', e)
        isAddTimeConfig.value = false
        timeConfigId.value = null
    }
}

function selectProject(item: any) {
    form.value.pid = item.id
    form.value.pname = item.proname || ''
    newPname.value = ''
    prjShow.value = false
    if (item.id) getTimeConfig(item.id)
}

// ===== 预计完成日期 =====
// 仅允许选择今天及之后的日期
const todayStr = computed(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
})
function onEcdChange(e: any) {
    form.value.ecd = e.detail.value || ''
}
function clearProject() {
    form.value.pid = null
    form.value.pname = ''
    newPname.value = ''

    // 清空项目后，重新允许填写微信群名
    form.value.weChatName = ''

    // 重置已有实时配置状态
    isAddTimeConfig.value = false
    timeConfigId.value = null
}

// ===== 页面初始化 =====
onLoad((options: any) => {
    form.value = { pid: null, pname: '', weChatName: '', taskName: '', ecd: '' }
    newPname.value = ''
    isAddTimeConfig.value = false
    timeConfigId.value = null
    if (options?.projectId) {
        form.value.pid = Number(options.projectId)
        form.value.pname = options.proname || ''
        form.value.weChatName = options.weChatName || ''
        getTimeConfig(form.value.pid)
    } else if (options?.configId) {
        form.value.pid = options.pid ? Number(options.pid) : null
        form.value.pname = options.proname || ''
        form.value.weChatName = options.weChatName || ''
        isAddTimeConfig.value = true
        timeConfigId.value = options.configId
    }
    if (projectList.value.length === 0) loadProject()
})

// 返回上个页面
function handleClickLeft() {
    // #ifdef H5
    history.go(-1)
    // #endif

    // #ifndef H5
    uni.navigateBack()
    // #endif
}

// ===== 提交 =====
async function handleAdd() {
    if (!form.value.weChatName?.trim()) {
        uni.showToast({ title: '请输入微信群名', icon: 'none' })
        return
    }
    if (!form.value.taskName?.trim()) {
        uni.showToast({ title: '请输入任务名称', icon: 'none' })
        return
    }
    if (!form.value.ecd) {
        uni.showToast({ title: '请选择预计完成日期', icon: 'none' })
        return
    }
    if (!form.value.pid && !newPname.value?.trim()) {
        uni.showToast({ title: '请选择项目或填写项目名称', icon: 'none' })
        return
    }
    saving.value = true
    try {
        if (form.value.pid) {
            if (isAddTimeConfig.value) {
                await fetchInsertTask({ realTimeId: timeConfigId.value, taskName: form.value.taskName, status: 1, taskProgress: 0, ecd: form.value.ecd+' 00:00:00' })
            } else {
                const configId = await fetchInsertTaskConfig({ pid: form.value.pid, weChatName: form.value.weChatName })
                await fetchInsertTask({ realTimeId: configId, taskName: form.value.taskName, status: 1, taskProgress: 0, ecd: form.value.ecd+' 00:00:00' })
            }
        } else if (timeConfigId.value) {
            await fetchInsertTask({ realTimeId: timeConfigId.value, taskName: form.value.taskName, status: 1, taskProgress: 0, ecd: form.value.ecd+' 00:00:00' })
        } else {
            const configId = await fetchInsertTaskConfig({ pid: null, weChatName: form.value.weChatName, pname: newPname.value })
            await fetchInsertTask({ realTimeId: configId, taskName: form.value.taskName, status: 1, taskProgress: 0, ecd: form.value.ecd+' 00:00:00' })
        }
        uni.$emit('refreshRealtimeTask') // 通知列表页刷新
        uni.showToast({ title: '添加成功', icon: 'none' })
        handleClickLeft()
    } catch (e) {
        console.error('添加任务失败', e)
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.addtask-page {
    min-height: 100vh;
    background: #f5f6f8;
    box-sizing: border-box;
}

.form-wrap {
    padding: 24rpx 20rpx;
    box-sizing: border-box;

    .card {
        background: #ffffff;
        border-radius: 16rpx;
        overflow: hidden;
    }

    .btn-row {
        display: flex;
        justify-content: flex-end;
        gap: 20rpx;
        margin-top: 30rpx;
        padding-bottom: 20rpx;
    }
}

.project-value {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16rpx;
    min-width: 0;

    text:first-child {
        max-width: 360rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .placeholder {
        color: #9ca3af;
    }

    .clear-project {
        flex-shrink: 0;
        padding: 10rpx 0 10rpx 16rpx;
    }
}

.prj-picker {
    height: 100%;
    display: flex;
    flex-direction: column;

    .prj-header {
        font-size: 32rpx;
        font-weight: 600;
        text-align: center;
        padding: 30rpx 0 20rpx;
    }

    .prj-list {
        flex: 1;

        .prj-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 26rpx 30rpx;
            border-bottom: 1rpx solid rgba(128, 128, 128, 0.12);

            .prj-name {
                font-size: 28rpx;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .prj-check {
                color: #3b82f6;
                font-size: 30rpx;
                margin-left: 16rpx;
            }

            &.active {
                background: rgba(59, 130, 246, 0.08);
            }
        }

        .prj-empty {
            text-align: center;
            padding: 60rpx 0;
            font-size: 26rpx;
            color: #9ca3af;
        }
    }
}

.wd-input.is-cell{
  padding: 0 !important;
}
</style>
