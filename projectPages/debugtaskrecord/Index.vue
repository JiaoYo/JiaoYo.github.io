<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { getSystemDate, hasPermission } from '@/utils/index';
import { fetchGetDebugTaskRecordPage, fetchSaveDebugTaskRecordInfo, fetchUpdateDebugTaskRecordInfo, fetchDeleteDebugTaskRecordInfo, fetchStartDebugTaskRecord, fetchCompleteDebugTaskRecord, fetchGetDebugTaskRecordLogs, fetchGetBusinessOptionsByEquipmentIds } from '@/service/debugTask';
import { fetchGetAllUserDataList } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

// ===== 路由参数 =====
const debugId = ref<any>(null);
const eqmid = ref<any>(null);
const dtype = ref<any>(null);
// 所属调试业务状态（开始任务要求业务已开始）
const businessStatus = ref<number>(-99);
const dbcreater = ref<any>(null);
const pageTitle = ref<string>('细分调试任务');
const isReadonly = ref<boolean>(false);

const userId = uni.getStorageSync('userId');
const userType = ref<number>(uni.getStorageSync('usertype'));

// 任务状态：0 待执行 1 执行中 2 已完成 3 已取消
const statusMeta: Record<number, any> = {
    0: { text: '待执行', color: 'rgba(156, 163, 175,0.15)', textColor: '#9ca3af' },
    1: { text: '执行中', color: 'rgba(59, 130, 246,0.15)', textColor: '#3B82F6' },
    2: { text: '已完成', color: 'rgba(16, 185, 129,0.15)', textColor: '#10B981' },
    3: { text: '已取消', color: 'rgba(239, 68, 68,0.15)', textColor: '#EF4444' }
};

const loading = ref<boolean>(false);

const records = ref<any[]>([]);

const totalText = computed(() => `共 ${records.value.length} 个细分任务，已完成 ${records.value.filter((item: any) => item.status === 2).length} 个`);

// 开始/完成/修改负责人仅项目权限开放时可见
const canUpdate = hasPermission('project:Debug:update');
// 任务负责人仅用户类型 0/2 可以修改（web debugTaskRecordDrawer 同款口径）
const canEditOperator = canUpdate && (userType.value === 0 || userType.value === 2);
const canInsert = hasPermission('project:Debug:insert');
const canDelete = hasPermission('project:Debug:delete');

// 开始/完成仅任务负责人可操作（后端同样校验当前登录人是负责人）
function isTaskOperator(record: any) {
    return record.operator != null && String(record.operator) === String(userId);
}

// 删除放宽：任务负责人本人，或用户类型为 0/2 的用户都可以删除
function canDeleteRow(record: any) {
    return isTaskOperator(record) || userType.value === 0 || userType.value === 2;
}

// 追加任务：仅业务尚未开始（status=0）时允许；候选取该业务类型下还未生成的任务模板
const canAppend = computed(() => canInsert && !isReadonly.value && Number(businessStatus.value) === 0);

// ===== 追加任务 =====
const appendShow = ref<boolean>(false);
const appendIds = ref<number[]>([]);
const appendOptions = ref<any[]>([]);
const appending = ref<boolean>(false);

// ===== 负责人行内编辑 =====
const userShow = ref<boolean>(false);
const userChecked = ref<any>(null);
const currentRecord = ref<any>(null);
const userDataList = ref<any>([]);

// ===== 操作日志 =====
const logsShow = ref<boolean>(false);
const logsLoading = ref<boolean>(false);
const logList = ref<any[]>([]);
const logTaskName = ref<string>('');

// 获取细分任务列表
async function getDataList() {
    if (!debugId.value) {
        return;
    }
    loading.value = true;
    try {
        const data = await fetchGetDebugTaskRecordPage({ page: 1, limit: 100, debugId: debugId.value });
        records.value = data.list || [];
        if (canAppend.value) {
            loadAppendOptions();
        }
    } catch (error) {
        console.error('获取细分任务失败', error);
    }
    loading.value = false;
}

// 追加任务候选：该设备该业务类型下的任务模板，排除已生成的
async function loadAppendOptions() {
    appendOptions.value = [];
    if (!eqmid.value || !Number(dtype.value)) {
        return;
    }
    try {
        const data = await fetchGetBusinessOptionsByEquipmentIds([eqmid.value]);
        const equipment = (data || []).find((item: any) => item.equipmentId == eqmid.value);
        const businesses = equipment?.businesses || [];
        const biz = businesses.find((item: any) => item.businessTypeId === Number(dtype.value));
        const existIds = records.value.map((item: any) => Number(item.templateTaskId));
        appendOptions.value = (biz?.tasks || []).filter((task: any) => existIds.indexOf(Number(task.templateTaskId)) === -1);
    } catch (error) {
        console.error('获取追加任务候选失败', error);
    }
}

// 打开追加任务弹框
function handleAppendShowChange() {
    if (appendOptions.value.length === 0) {
        uni.showToast({ title: '该业务类型下的任务模板均已生成', icon: 'none' });
        return;
    }
    appendIds.value = [];
    appendShow.value = true;
}

// 勾选/取消追加任务（chip 样式，原位 splice 保证 app 端渲染响应）
function handleAppendChipToggle(id: number) {
    const index = appendIds.value.indexOf(id);
    if (index > -1) {
        appendIds.value.splice(index, 1);
    } else {
        appendIds.value.push(id);
    }
}

// 追加任务提交
async function handleAppendSubmitChange() {
    if (!appendIds.value.length) {
        uni.showToast({ title: '请先选择要追加的调试任务', icon: 'none' });
        return;
    }
    appending.value = true;
    try {
        const queryParams = appendIds.value.map((templateTaskId: number) => ({
            debugId: debugId.value,
            templateTaskId: templateTaskId,
            operator: Number(dbcreater.value) || null
        }));
        await fetchSaveDebugTaskRecordInfo(queryParams);
        uni.showToast({ title: '任务已添加', icon: 'none' });
        appendShow.value = false;
        getDataList();
    } catch (error) {
        console.error('追加任务失败', error);
    }
    appending.value = false;
}

// 获取调试负责人数据源
async function getUserDataList() {
    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 500, usertypes: '2, 3, 9' });
        userDataList.value = (data.list || []).filter((item: any) => item.status == 0);
    } catch (error) {
        console.error('获取调试负责人数据源失败', error);
    }
}

// 打开负责人编辑弹框
function handleShowOperatorEdit(record: any) {
    currentRecord.value = record;
    userChecked.value = record.operator ?? null;
    userShow.value = true;
}

// 保存负责人修改（只允许修改待执行任务的负责人）
async function handleOperatorSubmitChange() {
    const record = currentRecord.value;
    if (!record) {
        userShow.value = false;
        return;
    }
    if (!userChecked.value || String(userChecked.value) === String(record.operator)) {
        userShow.value = false;
        return;
    }
    try {
        await fetchUpdateDebugTaskRecordInfo([{ id: record.id, operator: userChecked.value }]);
        uni.showToast({ title: '负责人已修改', icon: 'none' });
        userShow.value = false;
        getDataList();
    } catch (error) {
        console.error('修改负责人失败', error);
    }
}

// 开始任务（要求所属调试业务已开始）
function handleStartChange(record: any) {
    if (Number(businessStatus.value) !== 1) {
        uni.showToast({ title: '所属调试业务未开始，开始调试后才可执行任务', icon: 'none' });
        return;
    }
    uni.showModal({
        title: '提示',
        content: '确定开始该任务吗？',
        success: async (res: any) => {
            if (res.confirm) {
                try {
                    await fetchStartDebugTaskRecord(record.id);
                    uni.showToast({ title: '任务已开始', icon: 'none' });
                    getDataList();
                } catch (error) {
                    console.error('开始任务失败', error);
                }
            }
        }
    });
}

// 完成任务（只允许 1 → 2）
function handleCompleteChange(record: any) {
    uni.showModal({
        title: '提示',
        content: '确定完成该任务吗？',
        success: async (res: any) => {
            if (res.confirm) {
                try {
                    await fetchCompleteDebugTaskRecord(record.id);
                    uni.showToast({ title: '任务已完成', icon: 'none' });
                    getDataList();
                } catch (error) {
                    console.error('完成任务失败', error);
                }
            }
        }
    });
}

// 删除待执行任务（每个调试业务至少保留一条任务，由后端校验）
function handleDeleteChange(record: any) {
    uni.showModal({
        title: '提示',
        content: '删除后每个调试业务仍需至少保留一个任务，确定删除？',
        success: async (res: any) => {
            if (res.confirm) {
                try {
                    await fetchDeleteDebugTaskRecordInfo(record.id);
                    uni.showToast({ title: '删除成功', icon: 'none' });
                    getDataList();
                } catch (error) {
                    console.error('删除任务失败', error);
                }
            }
        }
    });
}

// 查看任务操作日志
async function handleShowLogsChange(record: any) {
    logsShow.value = true;
    logsLoading.value = true;
    logTaskName.value = record.taskName || '';
    logList.value = [];
    try {
        const data = await fetchGetDebugTaskRecordLogs(record.id);
        logList.value = data || [];
    } catch (error) {
        console.error('获取任务日志失败', error);
    }
    logsLoading.value = false;
}

// 日志动作展示
function getActionMeta(action?: string) {
    if (action === 'CREATE') return { text: '创建', color: '#3B82F6' };
    if (action === 'START') return { text: '开始', color: '#F59E0B' };
    if (action === 'COMPLETE') return { text: '完成', color: '#10B981' };
    return { text: action || '-', color: '#999999' };
}

onLoad((options: any) => {
    debugId.value = options.id;
    eqmid.value = options.eqmid;
    dtype.value = options.dtype;
    businessStatus.value = options.status != null ? Number(options.status) : -99;
    dbcreater.value = options.dbcreater;
    isReadonly.value = options.readonly === '1';
    if (options.name) {
        pageTitle.value = decodeURIComponent(options.name);
    }
    getDataList();
    getUserDataList();
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="pageTitle" safe-area-inset-top placeholder fixed :bordered="false" @click-left="() => { uni.navigateBack(); }" />

        <view style="display: flex; justify-content: space-between; align-items: center; padding: 20rpx 30rpx;">
            <view style="color: #999999; font-size: 26rpx;">{{ totalText }}</view>
            <view v-if="canAppend">
                <wd-button size="small" type="primary" plain @click="handleAppendShowChange">追加任务</wd-button>
            </view>
        </view>

        <view v-if="records.length > 0">
            <view v-for="(record, index) in records" :key="record.id" :class="['taskCard', { dark: isDark }]" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
                <view class="taskHead">
                    <text class="taskName">{{ record.taskName || '-' }}</text>
                    <view class="statusPill" :style="{ color: statusMeta[record.status]?.textColor || '#9ca3af', background: statusMeta[record.status]?.color || 'rgba(156, 163, 175,0.15)' }">
                        {{ statusMeta[record.status]?.text || '待执行' }}
                    </view>
                </view>
                <view class="taskRow taskRowFirst">
                    <text class="taskLabel">任务负责人</text>
                    <view class="taskValue">
                        <text>{{ record.operatorName || record.operator || '-' }}</text>
                        <wd-icon v-if="record.status === 0 && canEditOperator && !isReadonly" name="edit-outline" size="16px" @click="handleShowOperatorEdit(record)"></wd-icon>
                    </view>
                </view>
                <view class="taskRow">
                    <text class="taskLabel">开始</text>
                    <view class="taskValue">
                        <text>{{ record.startOperatorName || '—' }}</text>
                        <text v-if="record.startTime" class="taskTime">{{ getSystemDate(1, record.startTime) }}</text>
                    </view>
                </view>
                <view class="taskRow">
                    <text class="taskLabel">完成</text>
                    <view class="taskValue">
                        <text>{{ record.finishOperatorName || '—' }}</text>
                        <text v-if="record.finishTime" class="taskTime">{{ getSystemDate(1, record.finishTime) }}</text>
                    </view>
                </view>

                <view class="taskActions">
                    <wd-button v-if="record.status === 0 && canUpdate && !isReadonly && isTaskOperator(record)" size="small" type="success" @click="handleStartChange(record)">{{ Number(businessStatus) === 1 ? '开始' : '业务未开始' }}</wd-button>
                    <wd-button v-if="record.status === 1 && canUpdate && !isReadonly && isTaskOperator(record)" size="small" type="warning" @click="handleCompleteChange(record)">完成</wd-button>
                    <wd-button v-if="record.status === 0 && canDelete && !isReadonly && canDeleteRow(record) && Number(businessStatus) === 0" size="small" type="error" plain @click="handleDeleteChange(record)">删除</wd-button>
                    <wd-button size="small" type="primary" plain @click="handleShowLogsChange(record)">日志</wd-button>
                </view>
            </view>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-status-tip image="../../static/search.png" tip="该调试业务暂无细分任务记录" />
        </view>

        <!-- 追加任务弹框 -->
        <wd-popup closable custom-style="width: 90vw;" v-model="appendShow" position="left" @close="appendShow = false;">
            <wd-gap height="70rpx" />

            <view class="taskPopupTitle">追加任务</view>

            <scroll-view scroll-y style="height: calc(100vh - 380rpx);">
                <view class="taskChipWrap">
                    <view v-for="(item, index) in appendOptions" :key="index" class="taskChip" :class="{ active: appendIds.includes(item.templateTaskId) }" @click="handleAppendChipToggle(item.templateTaskId)">
                        {{ appendIds.includes(item.templateTaskId) ? '✓ ' : '' }}{{ item.taskName }}
                    </view>
                </view>
                <view v-if="appendOptions.length === 0" style="padding: 60rpx 0; text-align: center; color: #999999;">该业务类型下的任务模板均已生成</view>
            </scroll-view>

            <view style="padding: 20rpx 30rpx;">
                <wd-button type="primary" block :loading="appending" @click="handleAppendSubmitChange">确定（已选 {{ appendIds.length }} 个）</wd-button>
            </view>
        </wd-popup>

        <!-- 修改负责人弹框 -->
        <wd-popup closable custom-style="width: 90vw;" v-model="userShow" position="left" @close="userShow = false;">
            <wd-gap height="70rpx" />

            <scroll-view scroll-y style="height: calc(100vh - 380rpx);">
                <wd-radio-group v-model="userChecked" shape="dot">
                    <wd-cell v-for="(item, index) in userDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.username }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>

            <view style="padding: 20rpx 30rpx;">
                <wd-button type="primary" block @click="handleOperatorSubmitChange">确定</wd-button>
            </view>
        </wd-popup>

        <!-- 任务操作日志弹框 -->
        <wd-popup closable custom-style="width: 100vw; border-radius: 20rpx 20rpx 0 0;" v-model="logsShow" position="bottom" @close="logsShow = false;">
            <view style="padding: 30rpx;">
                <view style="font-weight: bolder; margin-bottom: 10rpx;">任务操作日志</view>
                <view v-if="logTaskName" style="color: #666666; font-size: 26rpx; margin-bottom: 12rpx;">任务：{{ logTaskName }}</view>

                <view v-if="logsLoading" style="padding: 40rpx 0; text-align: center; color: #999999;">加载中...</view>
                <view v-else-if="logList.length === 0" style="padding: 40rpx 0; text-align: center; color: #999999;">暂无日志</view>
                <view v-for="(log, index) in logList" :key="index" style="display: flex; align-items: center; gap: 20rpx; padding: 16rpx 0; border-bottom: 2rpx solid #efeff5; font-size: 26rpx;">
                    <view :style="{ color: getActionMeta(log.action).color, background: 'rgba(0,85,254,0.08)', borderRadius: '8rpx', padding: '4rpx 14rpx', flexShrink: 0 }">{{ getActionMeta(log.action).text }}</view>
                    <text>{{ log.operatorName || log.operator || '-' }}</text>
                    <text style="margin-left: auto; color: #999999;">{{ log.operationTime || log.dbtime || '-' }}</text>
                </view>
            </view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.radioCellWrap {
    :deep(.wd-cell__wrapper) {
        display: block !important;
    }
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

/* 细分任务卡片：标签靠左、值统一靠右 */
.taskCard {
    margin: 0 20rpx 20rpx;
    border-radius: 20rpx;
    padding: 6rpx 0;
}

.taskHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    padding: 20rpx 30rpx 10rpx;
}

.taskName {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    font-weight: 600;
    color: #333333;
    word-break: break-all;
}

.statusPill {
    flex-shrink: 0;
    border-radius: 999px;
    padding: 4rpx 20rpx;
    font-size: 24rpx;
}

.taskRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    padding: 18rpx 30rpx;
    border-top: 1rpx solid rgba(128, 128, 128, 0.12);
}

.taskRowFirst {
    border-top: none;
}

.taskLabel {
    flex-shrink: 0;
    font-size: 28rpx;
    color: #999999;
}

.taskValue {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12rpx;
    min-width: 0;
    font-size: 28rpx;
    color: #333333;
    text-align: right;
}

.taskTime {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #999999;
}

.taskActions {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    padding: 16rpx 30rpx;
}

/* 暗色适配 */
.taskCard.dark .taskName {
    color: #e8e8e8;
}

.taskCard.dark .taskLabel {
    color: #8a9099;
}

.taskCard.dark .taskValue {
    color: #e8e8e8;
}

.taskCard.dark .taskTime {
    color: #8a9099;
}

/* 弹框标题 + 任务横排 chip（同 adddebugbusiness） */
.taskPopupTitle {
    padding: 10rpx 30rpx 6rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
}

.taskChipWrap {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    padding: 24rpx 30rpx;
}

.taskChip {
    padding: 10rpx 24rpx;
    background: #f5f5f5;
    color: #333333;
    font-size: 26rpx;
    border-radius: 10rpx;
    border: 2rpx solid #f5f5f5;
    box-sizing: border-box;
}

.taskChip.active {
    color: #1677ff;
    background: rgba(22, 119, 255, 0.08);
    border-color: #1677ff;
}
</style>
