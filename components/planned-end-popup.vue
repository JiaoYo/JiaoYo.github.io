<template>
    <wd-popup :z-index="99" closable :close-on-click-modal="false" :modelValue="modelValue" custom-style="width: 90%; border-radius: 32rpx; padding: 20rpx;" @update:modelValue="handleVisibleChange">
        <view style="margin-bottom: 16rpx;">
            <wd-text text="修改计划完成日期" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
        </view>

        <view v-if="row" class="pe-tip" :class="dark ? 'dark' : ''">
            仅项目开始后的计划日期可由项目负责人修改；日期必须晚于项目开始日，保存后周期（period）按新日期自动更新。
        </view>

        <view v-if="row" class="pe-info" :class="dark ? 'dark' : ''">
            <view class="pe-info-row">
                <text class="pe-info-label" :class="dark ? 'dark-sub' : ''">项目名称</text>
                <text class="pe-info-value" :class="dark ? 'dark-value' : ''">{{ row.proname || '-' }}</text>
            </view>
            <view class="pe-info-row">
                <text class="pe-info-label" :class="dark ? 'dark-sub' : ''">开始日期</text>
                <text class="pe-info-value" :class="dark ? 'dark-value' : ''">{{ row.plannedStartTime || '未开始' }}</text>
            </view>
            <view class="pe-info-row">
                <text class="pe-info-label" :class="dark ? 'dark-sub' : ''">当前计划</text>
                <text class="pe-info-value" :class="dark ? 'dark-value' : ''">{{ row.cpdbtime || '-' }}{{ row.period ? '（周期 ' + row.period + ' 天）' : '' }}</text>
            </view>
        </view>

        <view v-if="row" class="pe-picker-row" :class="dark ? 'dark' : ''">
            <wd-datetime-picker label="新计划完成" label-width="100px" type="date" :z-index="9999" root-portal v-model="newEndDate" :min-date="minDate" :max-date="maxDate" placeholder="必填，晚于项目开始日" align-right custom-class="pePicker" />
            <wd-icon v-if="newEndDate" name="close-circle" size="30rpx" @click="handleClearDateChange"></wd-icon>
        </view>

        <view style="display: flex; justify-content: flex-end; gap: 0 10rpx; margin-top: 20rpx;">
            <wd-button hairline type="info" @click="handleVisibleChange(false)" block>取消</wd-button>
            <wd-button hairline type="primary" :loading="submitting" @click="handleSubmitChange" block>确认修改</wd-button>
        </view>
    </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { fetchUpdatePlannedEnd } from '@/service/prj';

/**
 * 项目负责人改期弹窗（已开始项目，列表/详情共用）
 * 仅 usertype=2 的项目负责人可用（超管放行）；日期必须晚于项目开始日；后端同时更新 period
 */
const props = defineProps<{
    modelValue: boolean;
    /** 项目行（需含 id / proname / plannedStartTime / cpdbtime / period） */
    row?: any;
    /** 暗色主题 */
    dark?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    /** 修改成功后通知父级刷新（cpdbtime/period 已变） */
    (e: 'updated'): void;
}>();

function handleVisibleChange(val: boolean) {
    emit('update:modelValue', val);
}

const submitting = ref(false);
const newEndDate = ref<number | null>(null);

/** 改期仅针对已开始项目（有开始日期），字符串 yyyy-MM-dd */
const startDate = computed(() => String(props.row?.plannedStartTime || ''));

// 新完成日期不可早于等于开始日：用 min-date 挡住开始日及之前
const minDate = computed(() => {
    if (!startDate.value) return new Date('2010-01-01').getTime();
    return new Date(startDate.value + 'T00:00:00').getTime() + 86400000;
});
const maxDate = computed(() => new Date().getTime() + 10 * 365 * 86400000);

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            // 打开时回填当前计划完成日期
            newEndDate.value = props.row?.cpdbtime ? new Date(props.row.cpdbtime + 'T00:00:00').getTime() : null;
        }
    },
    { immediate: true }
);

function handleClearDateChange() {
    newEndDate.value = null;
}

// 时间戳 -> YYYY-MM-DD
function formatPlannedDate(val: number | null): string | null {
    if (!val) return null;
    const d = new Date(val);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
}

async function handleSubmitChange() {
    const dateStr = formatPlannedDate(newEndDate.value);
    if (!dateStr) {
        uni.showToast({ icon: 'none', title: '请选择新的计划完成日期', duration: 1500 });
        return;
    }
    if (startDate.value && dateStr <= startDate.value) {
        uni.showToast({ icon: 'none', title: '日期必须晚于项目开始日（' + startDate.value + '）', duration: 2000 });
        return;
    }
    if (!props.row?.id) return;
    submitting.value = true;
    try {
        await fetchUpdatePlannedEnd({ id: Number(props.row.id), cpdbtime: dateStr });
        uni.showToast({ icon: 'success', title: '计划完成日期已修改', duration: 1500 });
        handleVisibleChange(false);
        emit('updated');
    } catch (err) {
        console.error('修改计划完成日期失败', err);
    } finally {
        submitting.value = false;
    }
}
</script>

<style lang="scss" scoped>
.pe-tip {
    font-size: 22rpx;
    line-height: 34rpx;
    color: #1677ff;
    background: rgba(22, 119, 255, 0.06);
    border-radius: 12rpx;
    padding: 12rpx 20rpx;
    margin-bottom: 16rpx;
}

.pe-info {
    border-radius: 12rpx;
    padding: 8rpx 20rpx;
    margin-bottom: 16rpx;
    background: rgba(0, 0, 0, 0.02);
}

.dark.pe-info {
    background: rgba(255, 255, 255, 0.05);
}

.pe-info-row {
    display: flex;
    align-items: flex-start;
    font-size: 26rpx;
    line-height: 44rpx;
}

.pe-info-label {
    width: 140rpx;
    flex-shrink: 0;
    color: #999;
}

.pe-info-value {
    flex: 1;
    color: #333;
}

.pe-picker-row {
    display: flex;
    align-items: center;
    gap: 0 10rpx;
}
</style>
