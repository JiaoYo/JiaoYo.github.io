<script setup lang="ts">
import { computed, ref } from 'vue';

interface DebugRecord {
    name: string;
    role: string;
    time: string;
    stage: string;
    result: string;
}

const props = defineProps<{
    gatewayNumber: string;
    serialNumber: string;
    model: string;
    projectName: string;
    currentUser: string;
}>();
const emit = defineEmits<{ (event: 'close'): void }>();
const visible = ref(false);
const records: DebugRecord[] = [
    { name: '李工', role: '现场调试', time: '10月27日 16:42', stage: '网络连通检查', result: '记录网关管理页面访问超时，交接继续排查' },
    { name: '王工', role: '办公室协助', time: '10月27日 14:36', stage: '设备与供电准备', result: '确认设备型号、SN 与现场供电正常' },
    { name: '李工', role: '现场调试', time: '10月26日 15:18', stage: '设备与供电准备', result: '完成设备接线及上电检查' },
];
const viewers = computed(() => [
    { name: props.currentUser, role: '当前用户 · 现场', current: true },
    { name: '王工', role: '办公室 · 可协助', current: false },
]);

function open() {
    visible.value = true;
}

function close() {
    visible.value = false;
    emit('close');
}

defineExpose({ open });
</script>

<template>
    <wd-popup :model-value="visible" position="bottom" :z-index="1200" :hide-when-close="false" :lock-scroll="false"
        custom-style="height:82vh;border-radius:28rpx 28rpx 0 0;overflow:hidden;background:#F4F8FF;"
        @click-modal="close">
        <view class="collaboration-drawer">
            <view class="drawer-grabber" aria-hidden="true"></view>
            <view class="drawer-header">
                <view class="drawer-heading">
                    <text class="drawer-title">调试协作</text>
                    <text class="drawer-subtitle">{{ gatewayNumber }} · {{ model }}</text>
                </view>
                <view class="close-button" role="button" aria-label="关闭调试协作" @click="close">
                    <wd-icon name="close" size="21px" />
                </view>
            </view>
            <scroll-view scroll-y class="collaboration-scroll">
                <view class="section-heading">
                    <text class="section-title">当前查看</text>
                    <text class="section-note">演示在线信息</text>
                </view>
                <view class="viewer-list">
                    <view v-for="viewer in viewers" :key="viewer.name" class="viewer-row">
                        <view class="avatar">{{ viewer.name.charAt(0) }}</view>
                        <view class="person-info">
                            <text class="person-name">{{ viewer.name }}</text>
                            <text class="person-role">{{ viewer.role }}</text>
                        </view>
                        <view class="viewer-state"><view class="online-dot"></view><text>{{ viewer.current ? '正在查看' : '可协助' }}</text></view>
                    </view>
                </view>

                <view class="section-heading history-heading">
                    <text class="section-title">历史调试</text>
                    <text class="section-note">{{ records.length }} 条记录</text>
                </view>
                <view class="history-list">
                    <view v-for="record in records" :key="`${record.name}-${record.time}`" class="history-item">
                        <view class="history-marker"></view>
                        <view class="history-content">
                            <view class="history-meta">
                                <text class="person-name">{{ record.name }}</text>
                                <text class="history-role">{{ record.role }}</text>
                                <text class="history-time">{{ record.time }}</text>
                            </view>
                            <text class="history-stage">{{ record.stage }}</text>
                            <text class="history-result">{{ record.result }}</text>
                        </view>
                    </view>
                </view>
                <text class="demo-note">历史记录和查看人员为演示数据，实时协作需接入服务端</text>
            </scroll-view>
        </view>
    </wd-popup>
</template>

<style lang="scss" scoped>
.collaboration-drawer {
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
    padding: 16rpx 28rpx 24rpx;
    border-bottom: 1px solid #E6EDF7;
}
.drawer-heading {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8rpx;
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
    height: 64rpx;
}
.collaboration-scroll {
    flex: 1;
    min-height: 0;
    padding: 24rpx;
    box-sizing: border-box;
}
.viewer-list {
    padding: 24rpx;
    border-radius: 20rpx;
    background: #FFFFFF;
}
.section-title {
    font-size: 28rpx;
    font-weight: 600;
}
.section-note {
    color: #7A8AA5;
    font-size: 23rpx;
}
.section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin: 30rpx 4rpx 16rpx;
}
.viewer-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
}
.viewer-row + .viewer-row {
    margin-top: 22rpx;
    padding-top: 22rpx;
    border-top: 1px solid #EDF1F7;
}
.avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: #EAF2FF;
    color: #0055FE;
    font-size: 26rpx;
}
.person-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6rpx;
}
.person-name {
    font-size: 27rpx;
    font-weight: 500;
}
.person-role {
    color: #7A8AA5;
    font-size: 23rpx;
}
.viewer-state {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #16875A;
    font-size: 23rpx;
}
.online-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #22A06B;
}
.history-heading {
    margin-top: 34rpx;
}
.history-list {
    padding: 4rpx 4rpx 0;
}
.history-item {
    position: relative;
    display: flex;
    gap: 18rpx;
    padding-bottom: 26rpx;
}
.history-item:not(:last-child)::before {
    position: absolute;
    left: 9rpx;
    top: 24rpx;
    bottom: 0;
    width: 2rpx;
    background: #D8E2F0;
    content: '';
}
.history-marker {
    z-index: 1;
    flex-shrink: 0;
    width: 20rpx;
    height: 20rpx;
    margin-top: 8rpx;
    border: 4rpx solid #D6E4FF;
    border-radius: 50%;
    background: #0055FE;
}
.history-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 22rpx;
    border-radius: 16rpx;
    background: #FFFFFF;
}
.history-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12rpx;
}
.history-role {
    padding: 3rpx 10rpx;
    border-radius: 8rpx;
    background: #EDF4FF;
    color: #3974C6;
    font-size: 21rpx;
}
.history-time {
    margin-left: auto;
    color: #7A8AA5;
    font-size: 22rpx;
}
.history-stage {
    margin-top: 14rpx;
    font-size: 25rpx;
    font-weight: 500;
}
.history-result {
    margin-top: 10rpx;
    color: #68768D;
    font-size: 24rpx;
    line-height: 1.7;
}
.demo-note {
    display: block;
    padding: 12rpx 0 28rpx;
    color: #7A8AA5;
    font-size: 22rpx;
    line-height: 1.6;
    text-align: center;
}
</style>
