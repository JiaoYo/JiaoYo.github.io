<script setup lang="ts">
import { computed, ref } from 'vue';

interface LifecycleRecord {
    title: string;
    description: string;
    time: string;
    status: string;
}

type LifecycleTab = 'factory' | 'running' | 'afterSales';

defineProps<{
    model: string;
    serialNumber: string;
    projectName: string;
    themeColor: string;
    dark?: boolean;
}>();

const visible = ref(false);
const activeTab = ref<LifecycleTab>('running');

const tabs: Array<{ key: LifecycleTab; label: string; description: string; operatorLabel: string; operator: string }> = [
    { key: 'factory', label: '出厂', description: '出厂测试与检验数据', operatorLabel: '出厂操作员', operator: '王工' },
    { key: 'running', label: '运行', description: '现场调试过程数据', operatorLabel: '调试员', operator: '李工' },
    { key: 'afterSales', label: '售后', description: '维修、更换、报废记录', operatorLabel: '维修员', operator: '暂无记录' },
];

const factoryRecords: LifecycleRecord[] = [
    { title: '出厂测试', description: '整机通电、通信与功能测试通过', time: '2026-08-18 09:30', status: '已通过' },
    { title: '固件烧录', description: '固件版本 V3.2.1，参数初始化完成', time: '2026-08-18 09:05', status: '已完成' },
    { title: '出厂检验', description: '外观、铭牌与 SN 信息核验通过', time: '2026-08-18 08:42', status: '已通过' },
];

const runningRecords: LifecycleRecord[] = [
    { title: '网络连通检查', description: '网关管理页面访问超时，等待继续排查', time: '2026-10-27 16:42', status: '进行中' },
    { title: '设备与供电准备', description: '确认设备型号、SN、接线与现场供电正常', time: '2026-10-27 14:20', status: '已完成' },
    { title: '设备进入调试', description: '李工创建本次现场调试记录', time: '2026-10-27 13:56', status: '已记录' },
];

const afterSalesRecords: LifecycleRecord[] = [
    { title: '维修', description: '暂无维修记录', time: '—', status: '无记录' },
    { title: '更换', description: '暂无部件或整机更换记录', time: '—', status: '无记录' },
    { title: '报废', description: '设备当前未进入报废流程', time: '—', status: '无记录' },
];

const recordsByTab: Record<LifecycleTab, LifecycleRecord[]> = {
    factory: factoryRecords,
    running: runningRecords,
    afterSales: afterSalesRecords,
};

const activeTabMeta = computed(() => tabs.find(tab => tab.key === activeTab.value) ?? tabs[1]);

function open(tab: LifecycleTab = 'running') {
    activeTab.value = tab;
    visible.value = true;
}

function close() {
    visible.value = false;
}

function selectTab(tab: LifecycleTab) {
    activeTab.value = tab;
}

defineExpose({ open });
</script>

<template>
    <wd-popup :model-value="visible" position="bottom" :z-index="1250" :hide-when-close="false" :lock-scroll="false"
        :custom-style="`height:84vh;border-radius:28rpx 28rpx 0 0;overflow:hidden;background:${dark ? '#0F1524' : '#F4F8FF'};`"
        @click-modal="close">
        <view class="lifecycle-drawer" :class="{ dark }">
            <view class="drawer-grabber" aria-hidden="true"></view>
            <view class="drawer-header">
                <view class="drawer-heading">
                    <view class="drawer-title-row">
                        <view class="lifecycle-title-icon" :style="{ color: themeColor }" aria-hidden="true">
                            <image class="lifecycle-title-icon-image" src="/static/lifecycle.png" mode="aspectFit" />
                        </view>
                        <text class="drawer-title">生命周期</text>
                    </view>
                    <text class="drawer-subtitle">{{ projectName || '未关联项目' }}</text>
                </view>
                <view class="close-button" role="button" aria-label="关闭生命周期" @click="close">
                    <wd-icon name="close" size="21px" />
                </view>
            </view>

            <view class="lifecycle-context">
                <text class="context-project">{{ model }} · {{ serialNumber }}</text>
                <text class="context-note">型号 / SN</text>
            </view>

            <view class="lifecycle-tabs" role="tablist" aria-label="生命周期阶段">
                <view v-for="tab in tabs" :key="tab.key" class="lifecycle-tab" :class="{ active: activeTab === tab.key }"
                    role="tab" :aria-selected="activeTab === tab.key" :style="activeTab === tab.key ? { color: themeColor, borderColor: themeColor } : undefined"
                    @click="selectTab(tab.key)">
                    <text class="tab-label">{{ tab.label }}</text>
                    <text class="tab-description">{{ tab.description }}</text>
                </view>
            </view>

            <scroll-view scroll-y class="lifecycle-scroll">
                <view class="lifecycle-summary" :style="{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}0D` }">
                    <view class="summary-heading">
                        <text class="summary-title">{{ activeTabMeta.description }}</text>
                        <text class="summary-count">{{ recordsByTab[activeTab].length }} 条</text>
                    </view>
                    <text class="summary-description">
                        {{ activeTab === 'factory' ? '设备出厂前的测试、烧录和检验结果。' : activeTab === 'running' ? '设备现场调试、检查与交接过程中的关键记录。' : '设备维修、更换与报废等售后处置记录。' }}
                    </text>
                    <view class="operator-row">
                        <text class="operator-label">{{ activeTabMeta.operatorLabel }}</text>
                        <text class="operator-value">{{ activeTabMeta.operator }}</text>
                    </view>
                </view>

                <view class="record-list">
                    <view v-for="(record, index) in recordsByTab[activeTab]" :key="`${record.title}-${record.time}`" class="record-item">
                        <view class="record-rail" :class="{ last: index === recordsByTab[activeTab].length - 1 }">
                            <view class="record-dot" :style="{ backgroundColor: themeColor }"></view>
                        </view>
                        <view class="record-card">
                            <view class="record-heading">
                                <text class="record-title">{{ record.title }}</text>
                                <text class="record-status" :class="{ empty: record.status === '无记录', active: record.status === '进行中' }" :style="record.status === '进行中' ? { color: themeColor, backgroundColor: `${themeColor}14` } : undefined">{{ record.status }}</text>
                            </view>
                            <text class="record-description">{{ record.description }}</text>
                            <text class="record-time">{{ record.time }}</text>
                        </view>
                    </view>
                </view>
                <text class="lifecycle-note">生命周期数据按设备 SN 保存，后续业务记录将在产生后自动归档。</text>
            </scroll-view>
        </view>
    </wd-popup>
</template>

<style lang="scss" scoped>
.lifecycle-drawer {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #1F2A44;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.lifecycle-drawer.dark {
    color: #E8ECF8;
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
    padding: 16rpx 28rpx 22rpx;
    border-bottom: 1px solid #E6EDF7;
}
.dark .drawer-header {
    border-bottom-color: #2A3548;
}
.drawer-heading {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8rpx;
    min-width: 0;
}
.drawer-title-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}
.lifecycle-title-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40rpx;
    height: 40rpx;
}
.lifecycle-title-icon-image {
    display: block;
    width: 100%;
    height: 100%;
}
.drawer-title {
    font-size: 32rpx;
    font-weight: 600;
}
.drawer-subtitle {
    overflow: hidden;
    color: #7A8AA5;
    font-size: 24rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 44px;
    color: #68768D;
}
.lifecycle-context {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin: 22rpx 28rpx 0;
    padding: 18rpx 20rpx;
    border-radius: 16rpx;
    background: #FFFFFF;
}
.dark .lifecycle-context,
.dark .record-card {
    background: #171F31;
}
.context-project {
    overflow: hidden;
    font-size: 25rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.context-note {
    flex-shrink: 0;
    color: #7A8AA5;
    font-size: 22rpx;
}
.lifecycle-tabs {
    display: flex;
    gap: 12rpx;
    margin: 20rpx 28rpx 0;
}
.lifecycle-tab {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    min-width: 0;
    padding: 18rpx 8rpx 16rpx;
    border: 1px solid transparent;
    border-radius: 16rpx;
    background: #FFFFFF;
    color: #68768D;
}
.dark .lifecycle-tab {
    background: #171F31;
    color: #A0ACC0;
}
.lifecycle-tab.active {
    background: #F0F5FF;
}
.dark .lifecycle-tab.active {
    background: #202D44;
}
.tab-label {
    font-size: 28rpx;
    font-weight: 600;
}
.tab-description {
    overflow: hidden;
    max-width: 100%;
    font-size: 20rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lifecycle-scroll {
    flex: 1;
    min-height: 0;
    padding: 22rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
}
.lifecycle-summary {
    padding: 20rpx 22rpx;
    border: 1px solid;
    border-radius: 18rpx;
}
.summary-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}
.summary-title {
    font-size: 27rpx;
    font-weight: 600;
}
.summary-count {
    flex-shrink: 0;
    color: #7A8AA5;
    font-size: 22rpx;
}
.summary-description {
    display: block;
    margin-top: 10rpx;
    color: #68768D;
    font-size: 24rpx;
    line-height: 1.6;
}
.dark .summary-description {
    color: #B1BCD0;
}
.operator-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 14rpx;
    padding-top: 12rpx;
    border-top: 1px solid #E2EAF5;
}
.dark .operator-row {
    border-top-color: #2A3548;
}
.operator-label {
    color: #68768D;
    font-size: 22rpx;
}
.operator-value {
    color: #1F2A44;
    font-size: 24rpx;
    font-weight: 600;
}
.dark .operator-value {
    color: #E8ECF8;
}
.record-list {
    margin-top: 22rpx;
}
.record-item {
    position: relative;
    display: flex;
    gap: 16rpx;
    min-height: 126rpx;
}
.record-rail {
    position: relative;
    flex-shrink: 0;
    width: 24rpx;
}
.record-rail::after {
    position: absolute;
    top: 28rpx;
    bottom: -2rpx;
    left: 11rpx;
    width: 2rpx;
    background: #D8E2F0;
    content: '';
}
.record-rail.last::after {
    display: none;
}
.record-dot {
    position: absolute;
    z-index: 1;
    top: 22rpx;
    left: 4rpx;
    width: 16rpx;
    height: 16rpx;
    border: 4rpx solid #D6E4FF;
    border-radius: 50%;
    box-sizing: content-box;
}
.record-card {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    margin-bottom: 16rpx;
    padding: 20rpx 22rpx;
    border-radius: 18rpx;
    background: #FFFFFF;
}
.record-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14rpx;
}
.record-title {
    font-size: 27rpx;
    font-weight: 500;
}
.record-status {
    flex-shrink: 0;
    padding: 4rpx 10rpx;
    border-radius: 8rpx;
    background: #E6F5ED;
    color: #16875A;
    font-size: 21rpx;
}
.record-status.empty {
    background: #F0F2F6;
    color: #7A8AA5;
}
.record-status.active {
    background: transparent;
}
.record-description {
    margin-top: 10rpx;
    color: #68768D;
    font-size: 24rpx;
    line-height: 1.6;
}
.dark .record-description {
    color: #B1BCD0;
}
.record-time {
    margin-top: 12rpx;
    color: #7A8AA5;
    font-size: 22rpx;
}
.lifecycle-note {
    display: block;
    padding: 8rpx 0 24rpx;
    color: #7A8AA5;
    font-size: 22rpx;
    line-height: 1.6;
    text-align: center;
}
</style>
