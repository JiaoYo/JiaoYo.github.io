<script setup lang="ts">
import { computed, ref } from 'vue';

interface CheckItem {
    title: string;
    description: string;
}

interface ChecklistState {
    checkedItems: boolean[];
    checkTimes: (string | null)[];
}

const props = defineProps<{ checkedItems: boolean[]; checkTimes: (string | null)[] }>();
const emit = defineEmits<{
    (event: 'update:checkedItems', value: boolean[]): void;
    (event: 'update:checkTimes', value: (string | null)[]): void;
    (event: 'change', value: ChecklistState): void;
}>();
const visible = ref(false);
const highlightIndex = ref(-1);
const items: CheckItem[] = [
    { title: '设备与供电准备', description: '确认设备型号、外观、固件版本与现场供电。' },
    { title: '接口信息检查', description: '核对网络、串口和 DIDO 信息及现场接线。' },
    { title: '数据采集检查', description: '核对采集通道、测点配置及设备响应。' },
    { title: '平台上送检查', description: '确认平台持续在线，数据上送稳定。' },
];
const checkTimeLabels = computed(() => props.checkTimes.map(time => time ? `检查时间 ${time}` : '尚未检查'));
const completedCount = computed(() => props.checkedItems.filter(Boolean).length);
const percentage = computed(() => completedCount.value / items.length * 100);
const percentageText = computed(() => `${percentage.value}%`);

function open(index?: number) {
    visible.value = true;
    highlightIndex.value = typeof index === 'number' ? index : -1;
}

function close() {
    visible.value = false;
}

function toggleItem(index: number) {
    const checkedItems = [...props.checkedItems];
    checkedItems[index] = !checkedItems[index];
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const checkTimes = [...props.checkTimes];
    checkTimes[index] = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    emit('update:checkedItems', checkedItems);
    emit('update:checkTimes', checkTimes);
    emit('change', { checkedItems, checkTimes });
}

function recordCurrentStage() {
    toggleItem(highlightIndex.value);
    close();
}

defineExpose({ open });
</script>

<template>
    <wd-popup :model-value="visible" position="bottom" :z-index="1000" :hide-when-close="false" :lock-scroll="false"
        custom-style="height:78vh;border-radius:28rpx 28rpx 0 0;overflow:hidden;background:#F4F8FF;"
        @click-modal="close">
        <view class="checklist-drawer">
            <view class="drawer-grabber" aria-hidden="true"></view>
            <view class="drawer-header">
                <view class="drawer-heading">
                    <text class="drawer-title">检查清单</text>
                    <text class="drawer-subtitle">逐项确认现场调试结果，可勾选或取消</text>
                </view>
                <view class="close-button" role="button" aria-label="关闭检查清单" @click="close">
                    <wd-icon name="close" size="21px" />
                </view>
            </view>
            <view class="checklist-progress">
                <view class="progress-copy">
                    <text>已完成 {{ completedCount }} / {{ items.length }} 项</text>
                    <text class="progress-percentage">{{ percentageText }}</text>
                </view>
                <view class="progress-track">
                    <view class="progress-fill" :style="{ width: `${percentage}%` }"></view>
                </view>
            </view>
            <scroll-view scroll-y class="checklist-scroll">
                <view class="checklist-items">
                    <view v-for="(item, index) in items" :key="item.title" class="checklist-item" :class="{ checked: checkedItems[index], highlighted: highlightIndex === index }"
                        role="checkbox" :aria-checked="checkedItems[index]" :aria-label="item.title" @click="toggleItem(index)">
                        <view class="check-control" :class="{ checked: checkedItems[index] }">
                            <wd-icon v-if="checkedItems[index]" name="check" size="17px" color="#FFFFFF" />
                        </view>
                        <view class="check-item-content">
                            <text class="check-item-title">{{ item.title }}</text>
                            <text class="check-item-description">{{ item.description }}</text>
                            <text class="check-item-meta">{{ checkTimeLabels[index] }}</text>
                        </view>
                        <text class="check-item-status" :class="{ checked: checkedItems[index] }">{{ checkedItems[index] ? '已完成' : '待检查' }}</text>
                    </view>
                </view>
                <wd-button v-if="highlightIndex >= 0" block @click="recordCurrentStage">
                    {{ checkedItems[highlightIndex] ? '将当前阶段标记为未完成' : '确认当前阶段检查通过' }}
                </wd-button>
                <view class="local-state-note">
                    <wd-icon name="info-circle" size="15px" />
                    <text>当前员工的勾选独立保存在本机，不与服务器同步</text>
                </view>
            </scroll-view>
        </view>
    </wd-popup>
</template>

<style lang="scss" scoped>
.checklist-drawer {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #1F2A44;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.drawer-grabber {
    flex-shrink: 0;
    width: 64rpx;
    height: 8rpx;
    margin: 14rpx auto 4rpx;
    border-radius: 8rpx;
    background: #D0D9E7;
}
.drawer-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 20rpx;
    padding: 18rpx 28rpx 22rpx;
}
.drawer-heading {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10rpx;
}
.drawer-title {
    font-size: 32rpx;
    font-weight: 600;
}
.drawer-subtitle {
    color: #7A8AA5;
    font-size: 24rpx;
}
.close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 44px;
    color: #68768D;
}
.checklist-progress {
    flex-shrink: 0;
    margin: 0 28rpx 20rpx;
    padding: 22rpx 24rpx;
    border-radius: 18rpx;
    background: #FFFFFF;
}
.progress-copy {
    display: flex;
    justify-content: space-between;
    margin-bottom: 18rpx;
    color: #5D6C85;
    font-size: 25rpx;
}
.progress-track {
    height: 12rpx;
    border-radius: 8rpx;
    background: #E7EDF7;
    overflow: hidden;
}
.progress-fill {
    height: 100%;
    border-radius: 8rpx;
    background: #0055FE;
    transition: width 0.2s;
}
.checklist-scroll {
    flex: 1;
    min-height: 0;
    padding: 0 28rpx calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
}
.checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 18rpx;
    margin-bottom: 18rpx;
    padding: 26rpx 22rpx;
    border: 1px solid transparent;
    border-radius: 20rpx;
    background: #FFFFFF;
}
.checklist-item.checked {
    border-color: #DCE9FC;
}
.checklist-item.highlighted {
    border-color: #80AFFF;
    background: #F0F5FF;
}
.check-control {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40rpx;
    height: 40rpx;
    margin-top: 4rpx;
    border: 3rpx solid #A7B5C8;
    border-radius: 8rpx;
    background: #FFFFFF;
}
.check-control.checked {
    border-color: #0055FE;
    background: #0055FE;
}
.check-item-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}
.check-item-title {
    font-size: 28rpx;
    font-weight: 500;
    line-height: 1.5;
}
.check-item-description {
    margin-top: 12rpx;
    color: #68768D;
    font-size: 25rpx;
    line-height: 1.7;
}
.check-item-meta {
    margin-top: 14rpx;
    color: #7A8AA5;
    font-size: 22rpx;
    line-height: 1.6;
}
.check-item-status {
    flex-shrink: 0;
    margin-top: 4rpx;
    color: #A55B00;
    font-size: 23rpx;
}
.check-item-status.checked {
    color: #16875A;
}
.local-state-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 12rpx 0 24rpx;
    color: #7A8AA5;
    font-size: 23rpx;
}
</style>
