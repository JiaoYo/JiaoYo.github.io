<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PBoxCadView from './PBoxCadView.vue';

interface SubDevice {
    name: string;
    address: string;
}

type PortKind = 'ethernet' | 'serial' | 'dido' | 'power';

export interface TopologyPort {
    id: string;
    name: string;
    label: string;
    kind: PortKind;
    status: string;
    target: string;
    ip?: string;
    parameter?: string;
    devices?: SubDevice[];
}

const props = withDefaults(defineProps<{
    model: string;
    serialNumber: string;
    projectName: string;
    themeColor: string;
    dark?: boolean;
    connections?: TopologyPort[];
}>(), {
    connections: () => [],
});

const visible = ref(false);
const showTopology = ref(false);
const detailsExpanded = ref(false);
const topologyPorts = computed(() => props.connections);
const hasTopologyData = computed(() => topologyPorts.value.length > 0);
const keyParameters = computed(() => topologyPorts.value.map((port) => {
    if (port.kind === 'ethernet') return `${port.label} · ${port.ip}`;
    if (port.kind === 'serial') return `${port.label} · ${port.parameter || '已配置'}${port.devices?.length ? ` · ${port.devices.length} 台` : ''}`;
    return `${port.label} · ${port.parameter || '已配置'}`;
}));

watch(hasTopologyData, (value) => {
    showTopology.value = value;
    if (!value) detailsExpanded.value = false;
});

function open() {
    visible.value = true;
    showTopology.value = hasTopologyData.value;
    detailsExpanded.value = false;
}

function close() {
    visible.value = false;
}

defineExpose({ open });
</script>

<template>
    <wd-popup v-model="visible" position="bottom" :z-index="1280" :lock-scroll="false" :hide-when-close="false"
        :custom-style="`height:92vh;border-radius:28rpx 28rpx 0 0;overflow:hidden;background:${dark ? '#0F1524' : '#F4F8FF'};`"
        @click-modal="close">
        <view class="topology-drawer" :class="{ dark }">
            <view class="drawer-grabber" aria-hidden="true"></view>
            <view class="drawer-header">
                <view class="drawer-heading">
                    <view class="drawer-title-row">
                        <wd-icon name="share" size="22px" :color="themeColor" />
                        <text class="drawer-title">设备接口拓扑</text>
                    </view>
                    <text class="drawer-subtitle">{{ projectName || '未关联项目' }} · {{ model }} · {{ serialNumber }}</text>
                </view>
                <view class="close-button" role="button" aria-label="关闭设备接口拓扑" @click="close">
                    <wd-icon name="close" size="21px" />
                </view>
            </view>

            <scroll-view scroll-y class="topology-body">
                <view class="topology-model-area">
                    <PBoxCadView :model="model" :theme-color="themeColor" :dark="dark"
                        :topology-visible="showTopology && hasTopologyData" :connections="topologyPorts" />
                </view>

                <view class="topology-connections">
                <view v-if="!hasTopologyData" class="topology-empty" :style="{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}0D` }">
                    <view class="topology-empty-icon" :style="{ color: themeColor, backgroundColor: `${themeColor}14` }">
                        <wd-icon name="share" size="24px" />
                    </view>
                    <text class="topology-empty-title">暂无拓扑连接数据</text>
                    <text class="topology-empty-description">已标定的电源接口默认显示供电引线；补充 IP 地址、485 从站地址或接线信息后，再显示对应拓扑。</text>
                </view>

                <view v-else-if="showTopology" class="topology-section">
                    <view class="topology-legend" aria-label="接口类型图例">
                        <view class="legend-item"><view class="legend-line ethernet"></view><text>以太网</text></view>
                        <view class="legend-item"><view class="legend-line serial"></view><text>串口</text></view>
                        <view class="legend-item"><view class="legend-line dido"></view><text>DIDO</text></view>
                        <view class="legend-item"><view class="legend-line power"></view><text>电源</text></view>
                    </view>
                    <view class="topology-summary" role="button" :aria-expanded="detailsExpanded" :aria-label="detailsExpanded ? '收起接口说明' : '展开接口说明'" @click="detailsExpanded = !detailsExpanded">
                        <view>
                            <text class="topology-section-title">接口连接</text>
                            <view class="topology-summary-parameters">
                                <text v-for="parameter in keyParameters" :key="parameter" class="topology-summary-parameter">{{ parameter }}</text>
                            </view>
                        </view>
                        <text class="topology-section-count">{{ topologyPorts.length }} 个接口</text>
                        <wd-icon name="arrow-right" size="16px" class="summary-toggle-icon" :class="{ expanded: detailsExpanded }" :color="themeColor" />
                    </view>
                    <view v-if="detailsExpanded" class="topology-details">
                        <view class="topology-list">
                            <view v-for="port in topologyPorts" :key="port.id" class="topology-item">
                                <view class="topology-item-heading">
                                    <view class="port-kind-dot" :class="`kind-${port.kind}`"></view>
                                    <text class="port-label">{{ port.label }}</text>
                                    <text class="port-name">{{ port.name }}</text>
                                    <text class="port-status" :class="{ disconnected: port.status === '未接入' }">{{ port.status }}</text>
                                </view>
                                <text class="port-target">{{ port.target }}</text>
                                <view v-if="port.kind === 'ethernet'" class="port-detail-row">
                                    <text class="port-detail-label">IP 地址</text>
                                    <text class="port-detail-value">{{ port.ip }}</text>
                                </view>
                                <view v-if="port.kind === 'serial'" class="serial-detail">
                                    <view class="port-detail-row">
                                        <text class="port-detail-label">参数</text>
                                        <text class="port-detail-value">{{ port.parameter }}</text>
                                    </view>
                                    <view v-if="port.devices?.length" class="subdevice-list">
                                        <text v-for="device in port.devices" :key="device.address" class="subdevice-item">{{ device.name }} · 地址 {{ device.address }}</text>
                                    </view>
                                    <text v-else class="empty-device-note">当前没有接入子设备</text>
                                </view>
                                <view v-if="port.kind !== 'serial' && port.kind !== 'ethernet'" class="port-detail-row">
                                    <text class="port-detail-label">接口状态</text>
                                    <text class="port-detail-value">{{ port.parameter }}</text>
                                </view>
                            </view>
                        </view>
                        <view class="topology-note">
                            <wd-icon name="info-circle" size="16px" :color="themeColor" />
                            <text>电源引线默认显示接口位置，不代表已接入；其他引线根据实际配置绘制，未确认物理位置的接口仅列出详情。</text>
                        </view>
                    </view>
                </view>
                </view>
            </scroll-view>
        </view>
    </wd-popup>
</template>

<style lang="scss" scoped>
.topology-drawer {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #1F2A44;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.topology-drawer.dark {
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
.drawer-title {
    font-size: 32rpx;
    font-weight: 600;
}
.drawer-subtitle {
    overflow: hidden;
    color: #7A8AA5;
    font-size: 23rpx;
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
.topology-body {
    flex: 1;
    height: 0;
    min-height: 0;
    padding: 14rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
}
.topology-model-area {
    flex-shrink: 0;
}
.topology-connections {
    margin-top: 8rpx;
}
.topology-note {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin: 8rpx 4rpx 0;
    color: #7A8AA5;
    font-size: 19rpx;
    line-height: 1.5;
}
.topology-empty {
    display: flex;
    align-items: center;
    margin-top: 18rpx;
    padding: 24rpx;
    border: 1px solid;
    border-radius: 18rpx;
    flex-direction: column;
}
.topology-empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52rpx;
    height: 52rpx;
    border-radius: 16rpx;
}
.topology-empty-title {
    margin-top: 12rpx;
    color: #1F2A44;
    font-size: 27rpx;
    font-weight: 600;
}
.dark .topology-empty-title,
.dark .topology-section-title,
.dark .port-label,
.dark .port-detail-value {
    color: #E8ECF8;
}
.topology-empty-description {
    margin-top: 8rpx;
    color: #68768D;
    font-size: 22rpx;
    line-height: 1.55;
    text-align: center;
}
.topology-section {
    margin-top: 10rpx;
}
.topology-summary {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 10rpx 12rpx;
    border-radius: 12rpx;
    background: #FFFFFF;
}
.dark .topology-summary {
    background: #171F31;
}
.topology-section-title {
    display: block;
    color: #1F2A44;
    font-size: 25rpx;
    font-weight: 650;
}
.topology-summary-parameters {
    display: flex;
    flex-wrap: wrap;
    gap: 4rpx 12rpx;
    margin-top: 4rpx;
}
.topology-summary-parameter {
    color: #7A8AA5;
    font-size: 19rpx;
}
.topology-section-count {
    flex-shrink: 0;
    margin-left: auto;
    color: #7A8AA5;
    font-size: 19rpx;
}
.summary-toggle-icon {
    flex-shrink: 0;
    transition: transform .2s ease;
}
.summary-toggle-icon.expanded {
    transform: rotate(90deg);
}
.topology-details {
    margin-top: 8rpx;
}
.topology-legend {
    display: flex;
    gap: 16rpx;
    margin-top: 8rpx;
    padding: 8rpx 12rpx;
    border-radius: 10rpx;
    background: #FFFFFF;
}
.dark .topology-legend,
.dark .topology-item {
    background: #171F31;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 7rpx;
    color: #68768D;
    font-size: 19rpx;
}
.port-kind-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #7A8AA5;
}
.legend-line {
    width: 28rpx;
    height: 4rpx;
    flex-shrink: 0;
    border-radius: 999rpx;
    background: #7A8AA5;
}
.legend-line.ethernet,
.kind-ethernet {
    background: #1677FF;
}
.legend-line.serial,
.kind-serial {
    background: #B7790C;
}
.legend-line.dido,
.kind-dido {
    background: #22A06B;
}
.legend-line.power,
.kind-power {
    background: #D94149;
}
.topology-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8rpx;
    margin-top: 8rpx;
}
.topology-item {
    min-width: 0;
    padding: 10rpx 12rpx;
    border: 1px solid #E2EAF5;
    border-radius: 14rpx;
    background: #FFFFFF;
}
.dark .topology-item {
    border-color: #2A3548;
}
.topology-item-heading,
.port-detail-row {
    display: flex;
    align-items: center;
}
.topology-item-heading {
    gap: 7rpx;
}
.port-label {
    color: #1F2A44;
    font-size: 23rpx;
    font-weight: 650;
}
.port-name {
    color: #7A8AA5;
    font-size: 19rpx;
}
.port-status {
    margin-left: auto;
    color: #16875A;
    font-size: 19rpx;
}
.port-status.disconnected {
    color: #98A5B5;
}
.port-target {
    display: block;
    margin-top: 4rpx;
    color: #50617A;
    font-size: 19rpx;
}
.port-detail-row {
    justify-content: space-between;
    gap: 8rpx;
    margin-top: 5rpx;
}
.port-detail-label {
    color: #7A8AA5;
    font-size: 19rpx;
}
.port-detail-value {
    color: #1F2A44;
    font-size: 20rpx;
    font-weight: 600;
}
.subdevice-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6rpx 8rpx;
    margin-top: 5rpx;
}
.subdevice-item {
    padding: 4rpx 8rpx;
    border-radius: 6rpx;
    background: #F0F5FF;
    color: #3974C6;
    font-size: 18rpx;
}
.dark .subdevice-item {
    background: #202D44;
    color: #80B4FF;
}
.empty-device-note {
    display: block;
    margin-top: 5rpx;
    color: #98A5B5;
    font-size: 18rpx;
}

@media screen and (max-width: 640px) {
    .topology-list {
        grid-template-columns: 1fr;
    }
}
</style>
