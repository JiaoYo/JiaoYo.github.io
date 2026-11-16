<template>
    <wd-popup :z-index="99" closable :close-on-click-modal="false" :modelValue="modelValue" custom-style="width: 94%; border-radius: 32rpx; padding: 20rpx; max-height: 86vh;" @update:modelValue="handleVisibleChange">
        <view style="margin-bottom: 16rpx; padding-right: 80rpx;">
            <wd-text text="项目启动确认单" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
        </view>

        <!-- 头部：项目名 + 确认单状态 + 生成/确认人 -->
        <view class="sc-head" :class="dark ? 'dark' : ''">
            <text class="sc-projname" :class="dark ? 'dark-value' : ''">{{ project?.proname || '-' }}</text>
            <view class="sc-status-tag" :style="statusTagStyle">{{ statusTagLabel }}</view>
        </view>
        <view v-if="confirmInfo?.createrName || confirmInfo?.confirmedByName" class="sc-subline" :class="dark ? 'dark-sub' : ''">
            <text v-if="confirmInfo?.createrName">生成人：{{ confirmInfo.createrName }}</text>
            <text v-if="confirmInfo?.confirmedByName">确认人：{{ confirmInfo.confirmedByName }}（{{ confirmInfo.confirmedTime || '-' }}）</text>
        </view>
        <view v-if="Number(project?.dtype) === 0 && Number(project?.status) === 0" class="sc-alert warn" :class="dark ? 'dark' : ''">
            现场调试项目启动前必须生成并确认《项目启动确认单》。
        </view>
        <view v-else-if="[1, 2].includes(Number(project?.dtype)) && Number(project?.status) === 0" class="sc-alert info" :class="dark ? 'dark' : ''">
            远程调试 / 无需调试项目不强制确认单，可直接启动。
        </view>

        <!-- 选择确认事项（未生成 / 草稿重新选择） -->
        <view v-if="selecting" class="sc-body">
            <view v-if="confirmInfo" class="sc-alert warn" :class="dark ? 'dark' : ''">
                该项目已存在草稿，重新生成将在原确认单上整体替换明细。
            </view>
            <view v-if="!categoryGroups.length && !loading" style="padding: 40rpx 0; text-align: center;" :class="dark ? 'dark-sub' : ''">确认单库暂无启用的确认事项</view>
            <scroll-view scroll-y class="sc-select-scroll" :class="dark ? 'dark' : ''">
                <view v-for="group in categoryGroups" :key="group.category" style="margin-bottom: 20rpx;">
                    <view style="display: flex; align-items: center; gap: 10rpx; margin-bottom: 10rpx;">
                        <view style="width: 6rpx; height: 26rpx; border-radius: 4rpx; background: #1890ff;"></view>
                        <text class="sc-category" :class="dark ? 'dark-value' : ''">{{ group.category }}</text>
                    </view>
                    <view v-for="item in group.items" :key="item.id" class="sc-check-item" :class="[dark ? 'dark' : '', { checked: selectedIds.includes(item.id) }]" @click="toggleItem(item.id)">
                        <view class="sc-check-circle" :class="{ checked: selectedIds.includes(item.id) }">{{ selectedIds.includes(item.id) ? '✓' : '' }}</view>
                        <view style="flex: 1; min-width: 0;">
                            <text class="sc-check-content" :class="dark ? 'dark-value' : ''">{{ item.itemContent }}</text>
                            <text v-if="item.itemDesc" class="sc-check-desc" :class="dark ? 'dark-sub' : ''">{{ item.itemDesc }}</text>
                        </view>
                    </view>
                </view>
            </scroll-view>
            <textarea class="sc-textarea" :class="dark ? 'dark' : ''" v-model="notes" maxlength="1000" placeholder="备注（选填，最多 1000 字），如：已与客户及现场负责人沟通" :placeholder-style="dark ? 'color:#6a6a6a;' : 'color:#c0c4cc;'" auto-height></textarea>
            <view style="display: flex; justify-content: flex-end; gap: 0 10rpx; margin-top: 16rpx;">
                <wd-button size="small" hairline type="info" :disabled="generating" @click="handleCancelSelect">{{ confirmInfo ? '返回核对' : '取消' }}</wd-button>
                <wd-button size="small" hairline type="primary" :disabled="!canEdit || generating" :loading="generating" @click="handleGenerateClick">{{ confirmInfo ? '重新生成草稿' : '生成确认单草稿' }}</wd-button>
            </view>
        </view>

        <!-- 确认单快照（草稿核对 / 已确认只读） -->
        <view v-else-if="confirmInfo" class="sc-body">
            <view v-if="confirmInfo.notes" class="sc-notes" :class="dark ? 'dark' : ''">备注：{{ confirmInfo.notes }}</view>
            <scroll-view scroll-y class="sc-snapshot-scroll" :class="dark ? 'dark' : ''">
                <view class="sc-snap-row head" :class="dark ? 'dark' : ''">
                    <text style="width: 60rpx; flex: none;">序号</text>
                    <text style="width: 150rpx; flex: none;">分类</text>
                    <text style="flex: 1;">确认事项</text>
                    <text style="width: 240rpx; flex: none;">说明</text>
                </view>
                <view v-for="(item, index) in confirmInfo.items" :key="item.id" class="sc-snap-row" :class="dark ? 'dark' : ''">
                    <text style="width: 60rpx; flex: none; text-align: center;" :class="dark ? 'dark-sub' : ''">{{ index + 1 }}</text>
                    <text style="width: 150rpx; flex: none;" :class="dark ? 'dark-value' : ''">{{ item.categorySnapshot }}</text>
                    <text style="flex: 1;" :class="dark ? 'dark-value' : ''">{{ item.contentSnapshot }}</text>
                    <text style="width: 240rpx; flex: none;" :class="dark ? 'dark-sub' : ''">{{ item.descSnapshot || '-' }}</text>
                </view>
                <view v-if="!(confirmInfo.items || []).length" style="padding: 30rpx 0; text-align: center;" :class="dark ? 'dark-sub' : ''">暂无确认事项</view>
                <view v-if="Number(confirmInfo.status) === 1" style="font-size: 22rpx; padding: 8rpx 4rpx 0;" :class="dark ? 'dark-sub' : ''">
                    确认单已确认，内容为生成时的快照，库事项后续修改或停用不影响本项目。
                </view>
            </scroll-view>
            <view style="display: flex; justify-content: flex-end; gap: 0 10rpx; margin-top: 16rpx;">
                <wd-button size="small" hairline type="info" @click="handleClose">关闭</wd-button>
                <wd-button v-if="Number(confirmInfo.status) === 0 && canEdit" size="small" hairline type="info" :disabled="confirming" @click="selecting = true">重新选择事项</wd-button>
                <wd-button v-if="Number(confirmInfo.status) === 0 && canEdit" size="small" hairline type="primary" :disabled="confirming" :loading="confirming" @click="handleConfirmClick">确认确认单</wd-button>
                <wd-button v-if="Number(confirmInfo.status) === 1 && Number(project?.status) === 0 && canUpdateProject" size="small" type="primary" :disabled="starting" :loading="starting" @click="handleStartClick">启动项目</wd-button>
            </view>
        </view>

        <!-- 未生成且只读 -->
        <view v-else-if="!loading" style="padding: 50rpx 0; text-align: center;" :class="dark ? 'dark-sub' : ''">
            尚未生成确认单
            <view style="display: flex; justify-content: flex-end; gap: 0 10rpx; margin-top: 24rpx;">
                <wd-button size="small" hairline type="info" @click="handleClose">关闭</wd-button>
            </view>
        </view>
    </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { hasPermission } from '@/utils/index';
import { fetchStartConfirmLibraryOptions, fetchStartConfirmGetByProject, fetchStartConfirmGenerate, fetchStartConfirmConfirm, fetchStartProject } from '@/service/index';

/**
 * 项目启动确认单弹窗（参考 web 端 projectList modules/start-confirm-modal）
 *
 * 两步操作：勾选确认单库事项生成草稿 → 核对快照内容后确认（不自动确认，避免误操作）；
 * status=0 草稿可重新生成覆盖；status=1 已确认只读；
 * 已确认且项目未启动时可直接「启动项目」（等价 web 弹窗内启动）。
 */
const props = defineProps<{
    modelValue: boolean;
    /** 项目行快照（至少含 id / proname / status / dtype / pause / ptype） */
    project?: any;
    /** 暗色主题 */
    dark?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    /** 确认单确认/项目启动成功，通知父级刷新列表 */
    (e: 'refresh'): void;
}>();

function handleVisibleChange(val: boolean) {
    emit('update:modelValue', val);
}
function handleClose() {
    emit('update:modelValue', false);
}

const userType = ref<number>(Number(uni.getStorageSync('usertype')));
const canUpdateProject = computed(() => hasPermission('project:Info:update'));
/** 确认单允许操作的人员类型：0/1/2（同 web canOperate） */
const canOperate = computed(() => [0, 1, 2].includes(userType.value));
/** 仅未开始(0)、未暂停、未作废的项目允许生成/覆盖/确认 */
const canEdit = computed(() => canOperate.value && Number(props.project?.status) === 0 && Number(props.project?.pause) !== 1 && Number(props.project?.ptype) !== 2);

/** 代际计数：弹窗关闭/项目变化时自增，晚到的旧响应不再应用 */
let gen = 0;

const loading = ref(false);
const libraryItems = ref<any[]>([]);
const confirmInfo = ref<any | null>(null);
/** 重新选择事项（草稿覆盖模式） */
const selecting = ref(false);
const selectedIds = ref<number[]>([]);
const notes = ref('');
const generating = ref(false);
const confirming = ref(false);
const starting = ref(false);

/** 库事项按 category 分组（保持后端 sortNo 顺序），仅展示启用项 */
const categoryGroups = computed(() => {
    const map = new Map<string, any[]>();
    libraryItems.value
        .filter((item: any) => Number(item.enabled) === 1)
        .forEach((item: any) => {
            const key = String(item.category || '其他');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
});

const statusTagLabel = computed(() => {
    if (!confirmInfo.value) return '未生成';
    return Number(confirmInfo.value.status) === 1 ? '已确认' : '草稿';
});
const statusTagStyle = computed(() => {
    const confirmed = Number(confirmInfo.value?.status) === 1;
    const color = !confirmInfo.value ? '#909399' : confirmed ? '#52c41a' : '#fa8c16';
    return { background: color + '1A', color };
});

function toggleItem(id: number) {
    if (!canEdit.value) return;
    const idx = selectedIds.value.indexOf(id);
    if (idx >= 0) selectedIds.value.splice(idx, 1);
    else selectedIds.value.push(id);
}

async function loadData() {
    if (!props.project?.id) return;
    const cur = ++gen;
    loading.value = true;
    try {
        const [libRes, confirmRes] = await Promise.all([
            canOperate.value ? fetchStartConfirmLibraryOptions() : Promise.resolve(null),
            fetchStartConfirmGetByProject(props.project.id)
        ]);
        if (cur !== gen) return;
        if (libRes) libraryItems.value = libRes as any;
        confirmInfo.value = confirmRes || null;
        // 草稿明细预勾选（按库事项 id），备注带入草稿
        selectedIds.value = (confirmInfo.value?.items || []).map((item: any) => item.sourceItemId);
        notes.value = confirmInfo.value?.notes || '';
        // 可编辑（未启动）且未生成时直接进入选择；已确认/无权限项目只读展示
        selecting.value = canEdit.value && !confirmInfo.value;
    } catch (err) {
        console.error('获取启动确认单失败', err);
    } finally {
        if (cur === gen) loading.value = false;
    }
}

watch(() => props.modelValue, val => {
    if (val) loadData();
});

function handleCancelSelect() {
    if (confirmInfo.value) {
        // 从"重新选择"返回草稿快照视图
        selecting.value = false;
        selectedIds.value = (confirmInfo.value?.items || []).map((item: any) => item.sourceItemId);
        notes.value = confirmInfo.value?.notes || '';
    } else {
        handleClose();
    }
}

function handleGenerateClick() {
    if (!selectedIds.value.length) {
        uni.showToast({ icon: 'none', title: '请至少勾选一项确认事项' });
        return;
    }
    const doGenerate = () => handleGenerate();
    if (confirmInfo.value) {
        uni.showModal({
            title: '提示',
            content: '重新生成将覆盖原草稿及明细，确定吗？',
            success: res => {
                if (res.confirm) doGenerate();
            }
        });
        return;
    }
    doGenerate();
}

/** 生成草稿（已有草稿时在同一确认单上整体替换明细） */
async function handleGenerate() {
    generating.value = true;
    try {
        const data: any = await fetchStartConfirmGenerate({
            projectId: props.project.id,
            libraryItemIds: selectedIds.value,
            notes: notes.value.trim() || undefined
        });
        confirmInfo.value = data;
        selecting.value = false;
        uni.showToast({ icon: 'none', title: '确认单草稿已生成，请核对快照内容后确认', duration: 2000 });
    } catch (err) {
        // 失败重新同步：库事项被停用→刷新可选项；确认单已被他人确认→自动切只读（错误提示由 request 统一 toast）
        console.error('生成确认单草稿失败', err);
        await loadData();
    } finally {
        generating.value = false;
    }
}

function handleConfirmClick() {
    uni.showModal({
        title: '提示',
        content: '确认后确认单不可再修改，确定确认吗？',
        success: res => {
            if (res.confirm) handleConfirm();
        }
    });
}

/** 确认确认单（确认人由后端取当前登录用户；重复确认幂等） */
async function handleConfirm() {
    confirming.value = true;
    try {
        const data: any = await fetchStartConfirmConfirm(props.project.id);
        confirmInfo.value = data;
        uni.showToast({ icon: 'none', title: '确认单已确认', duration: 1500 });
        emit('refresh');
    } catch (err) {
        // 草稿包含已停用事项等场景：重新查询确认单并回到可编辑态（错误提示由 request 统一 toast）
        console.error('确认确认单失败', err);
        await loadData();
    } finally {
        confirming.value = false;
    }
}

function handleStartClick() {
    uni.showModal({
        title: '提示',
        content: '确定启动该项目吗？',
        success: res => {
            if (res.confirm) handleStart();
        }
    });
}

/** 确认单确认后直接启动项目 */
async function handleStart() {
    starting.value = true;
    try {
        await fetchStartProject(props.project.id);
        uni.showToast({ icon: 'none', title: '项目启动成功', duration: 1500 });
        handleClose();
        emit('refresh');
    } catch (err) {
        // 项目状态已变化等场景：刷新确认单展示并通知父级刷新，防止重复提交
        console.error('启动项目失败', err);
        await loadData();
        emit('refresh');
    } finally {
        starting.value = false;
    }
}
</script>

<style lang="scss" scoped>
.sc-head {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex-wrap: wrap;
}

.sc-projname {
    font-size: 28rpx;
    font-weight: 600;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sc-status-tag {
    padding: 4rpx 16rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    flex: none;
}

.sc-subline {
    display: flex;
    gap: 24rpx;
    flex-wrap: wrap;
    font-size: 22rpx;
    margin-top: 8rpx;
}

.sc-alert {
    padding: 14rpx 20rpx;
    border-radius: 12rpx;
    font-size: 24rpx;
    line-height: 34rpx;
    margin-top: 12rpx;
}

.sc-alert.warn {
    background: #fff7e6;
    color: #d46b08;
}

.sc-alert.info {
    background: #e6f4ff;
    color: #1677ff;
}

.sc-body {
    margin-top: 12rpx;
}

.sc-select-scroll {
    max-height: 560rpx;
}

.sc-category {
    font-size: 26rpx;
    font-weight: 600;
}

.sc-check-item {
    display: flex;
    align-items: flex-start;
    gap: 14rpx;
    padding: 12rpx 16rpx;
    margin: 0 0 10rpx 26rpx;
    border-radius: 12rpx;
    background: #f7f8fa;
}

.sc-check-item.checked {
    background: #e6f4ff;
}

.sc-check-circle {
    width: 34rpx;
    height: 34rpx;
    border-radius: 50%;
    border: 2rpx solid #c0c4cc;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22rpx;
    color: #fff;
    margin-top: 2rpx;
}

.sc-check-circle.checked {
    background: #1677ff;
    border-color: #1677ff;
}

.sc-check-content {
    display: block;
    font-size: 26rpx;
    line-height: 36rpx;
    word-break: break-all;
}

.sc-check-desc {
    display: block;
    font-size: 22rpx;
    line-height: 30rpx;
    word-break: break-all;
    margin-top: 4rpx;
}

.sc-textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 120rpx;
    padding: 16rpx 20rpx;
    border-radius: 12rpx;
    background: #f5f5f5;
    font-size: 24rpx;
    margin-top: 8rpx;
}

.sc-notes {
    padding: 14rpx 20rpx;
    border-radius: 12rpx;
    background: #f7f8fa;
    font-size: 24rpx;
    line-height: 34rpx;
    margin-bottom: 12rpx;
    word-break: break-all;
}

.sc-snapshot-scroll {
    max-height: 560rpx;
}

.sc-snap-row {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    padding: 12rpx 16rpx;
    border-bottom: 2rpx solid #f0f0f0;
    font-size: 24rpx;
    line-height: 34rpx;
    word-break: break-all;
}

.sc-snap-row.head {
    font-weight: 600;
    background: #f7f8fa;
    border-radius: 8rpx 8rpx 0 0;
}

/* 暗色适配 */
.dark {
    background: #2a2a2a;
}

.dark.sc-alert.warn {
    background: rgba(250, 140, 22, 0.15);
    color: #fa8c16;
}

.dark.sc-alert.info {
    background: rgba(22, 119, 255, 0.18);
    color: #69b1ff;
}

.sc-check-item.dark {
    background: #1b1b1b;
}

.sc-check-item.dark.checked {
    background: rgba(22, 119, 255, 0.25);
}

.sc-textarea.dark,
.sc-notes.dark {
    background: #1b1b1b;
}

.sc-snap-row.dark {
    border-bottom-color: #333;
}

.sc-snap-row.head.dark {
    background: #1b1b1b;
}

.dark-value {
    color: #e8e8e8;
}

.dark-sub {
    color: #8a9099;
}
</style>
