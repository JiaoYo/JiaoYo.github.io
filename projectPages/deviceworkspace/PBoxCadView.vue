<script setup lang="ts">
import { computed } from 'vue';
import type { TopologyPort } from './NetworkTopologyDrawer.vue';
import { getDeviceInterfaceProfile } from './deviceInterfaceProfiles';

const props = withDefaults(defineProps<{
    model: string;
    themeColor: string;
    dark?: boolean;
    topologyVisible?: boolean;
    connections?: TopologyPort[];
}>(), {
    connections: () => [],
});

const profile = computed(() => getDeviceInterfaceProfile(props.model));
const portColors = { ethernet: '#1677FF', serial: '#B7790C', dido: '#22A06B', power: '#D94149' };

const interfaceFaces = computed(() => (profile.value?.faces || []).map(face => {
    const activePorts = face.ports.flatMap(anchor => {
        const connection = props.topologyVisible ? props.connections.find(item =>
            item.kind === anchor.kind && anchor.aliases.includes(item.id.toLowerCase().replace(/^rs485-/, 'rs485_')),
        ) : undefined;
        // 默认电源线仅表示供电接口，不表示已接入；其余线必须来自实际连接记录。
        const port: TopologyPort | undefined = connection || (anchor.kind === 'power' ? {
            id: anchor.id, name: '电源接口', label: anchor.label, kind: 'power',
            status: '待接入', target: '', parameter: '设备供电接口',
        } : undefined);
        return port ? [{ ...anchor, port, connection }] : [];
    });
    const laneHeight = Math.max(32, (activePorts.length + 1) * 8);
    return {
        ...face,
        minWidth: Math.max(face.minWidth, activePorts.length > 3 ? activePorts.length * 120 : 0),
        laneHeight,
        slots: activePorts.map((anchor, index) => {
            const start = anchor.x;
            const end = (index + 0.5) * 100 / activePorts.length;
            return { ...anchor, color: portColors[anchor.port.kind], start, end,
                bend: laneHeight - (index + 1) * 8,
                horizontalLeft: Math.min(start, end), horizontalWidth: Math.abs(end - start) };
        }),
    };
}));
const hasUnmappedPorts = computed(() => props.topologyVisible && props.connections.some(
    port => !interfaceFaces.value.some(face => face.slots.some(slot => slot.connection === port)),
));

function portDetail(port: TopologyPort) {
    if (port.kind === 'ethernet') return port.ip || port.status;
    if (port.kind === 'serial') return port.devices?.length ? `子设备 ${port.devices.length} 台` : port.parameter || port.status;
    return port.parameter || port.status;
}
</script>

<template>
    <view class="cad-stage" :class="{ dark }">
        <text v-if="!profile" class="unmapped-note">{{ model }} 暂无线稿，接口连接请查看下方详情。</text>
        <view v-for="face in interfaceFaces" :key="face.id" class="interface-face">
            <view class="face-heading">
                <text class="face-title" :style="{ borderColor: themeColor }">{{ face.title }}</text>
                <text class="face-view-label">正视图</text>
            </view>
            <text v-if="face.minWidth" class="face-scroll-hint">左右滑动查看完整接口面及连线</text>
            <scroll-view scroll-x class="face-scroll" :key="`${model}-${face.id}`">
                <view class="face-content" :style="{ minWidth: `${face.minWidth}px` }">
                    <view class="face-artboard" :style="{ paddingTop: `${face.height / face.width * 100}%` }">
                        <image class="face-image" :src="`${face.image}${dark ? '-dark' : ''}.png`"
                            mode="aspectFit" :aria-label="`${model} ${face.title}正视线稿`" />
                        <template v-for="slot in face.slots" :key="slot.id">
                            <view class="port-stem" aria-hidden="true"
                                :style="{ left: `${slot.start}%`, top: `${slot.y}%`, height: `${100 - slot.y}%`, backgroundColor: slot.color }" />
                            <view class="port-anchor" aria-hidden="true"
                                :style="{ left: `${slot.start}%`, top: `${slot.y}%`, backgroundColor: slot.color }" />
                        </template>
                    </view>
                    <template v-if="face.slots.length">
                        <view class="wire-lane" aria-hidden="true" :style="{ height: `${face.laneHeight}px` }">
                            <template v-for="slot in face.slots" :key="slot.id">
                                <view class="wire-vertical"
                                    :style="{ left: `${slot.start}%`, top: '0', height: `${slot.bend}px`, backgroundColor: slot.color }" />
                                <view class="wire-horizontal"
                                    :style="{ left: `${slot.horizontalLeft}%`, top: `${slot.bend}px`, width: `${slot.horizontalWidth}%`, backgroundColor: slot.color }" />
                                <view class="wire-vertical"
                                    :style="{ left: `${slot.end}%`, top: `${slot.bend}px`, height: `${face.laneHeight - slot.bend}px`, backgroundColor: slot.color }" />
                            </template>
                        </view>
                        <view class="connection-cards">
                            <view v-for="slot in face.slots" :key="slot.id" class="connection-slot">
                                <view class="connection-card" :style="{ borderTopColor: slot.color }">
                                    <text class="connection-label">{{ slot.label }}</text>
                                    <text class="connection-detail">{{ portDetail(slot.port) }}</text>
                                </view>
                            </view>
                        </view>
                    </template>
                </view>
            </scroll-view>
            <text v-if="!face.slots.length" class="face-empty">此接口面暂无连接记录</text>
        </view>
        <text v-if="hasUnmappedPorts" class="unmapped-note">未标定物理位置的接口请查看下方详情。</text>
    </view>
</template>

<style lang="scss" scoped>
.cad-stage {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    color: #1F2A44;
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}
.interface-face {
    padding: 12px 8px;
    border: 1px solid #DDE7F3;
    border-radius: 12px;
    background: #FFFFFF;
}
.interface-face + .interface-face {
    margin-top: 12px;
}
.face-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    margin-bottom: 12px;
}
.face-title {
    border-left: 3px solid;
    padding-left: 8px;
    font-size: 14px;
    line-height: 20px;
    font-weight: 600;
}
.face-view-label,
.face-empty,
.face-scroll-hint,
.unmapped-note {
    font-size: 12px;
    line-height: 18px;
    color: #52617A;
}
.face-empty,
.face-scroll-hint,
.unmapped-note {
    display: block;
    margin: 8px 4px 0;
}
.face-scroll {
    width: 100%;
}
.face-content {
    width: 100%;
    padding-bottom: 4px;
}
.face-scroll-hint {
    margin: 0 4px 8px;
}
.face-artboard {
    position: relative;
    height: 0;
}
.face-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
.port-stem,
.wire-vertical {
    position: absolute;
    width: 1.5px;
    transform: translateX(-50%);
}
.port-anchor {
    position: absolute;
    width: 7px;
    height: 7px;
    border: 1px solid #FFFFFF;
    border-radius: 50%;
    transform: translate(-50%, -50%);
}
.wire-lane {
    position: relative;
    height: 32px;
}
.wire-horizontal {
    position: absolute;
    height: 1.5px;
    transform: translateY(-50%);
}
.connection-cards {
    display: flex;
    align-items: stretch;
}
.connection-slot {
    flex: 1;
    min-width: 0;
    padding: 0 3px;
    box-sizing: border-box;
}
.connection-card {
    height: 100%;
    padding: 7px 5px;
    border: 1px solid #DDE7F3;
    border-top-width: 2px;
    border-radius: 6px;
    background: #F4F8FF;
    box-sizing: border-box;
}
.connection-label,
.connection-detail {
    display: block;
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 12px;
    line-height: 17px;
}
.connection-label {
    font-weight: 600;
}
.connection-detail {
    margin-top: 4px;
    color: #52617A;
}
.dark {
    color: #E8ECF8;
}
.dark .interface-face {
    border-color: #33435E;
    background: #172238;
}
.dark .connection-card {
    border-right-color: #33435E;
    border-bottom-color: #33435E;
    border-left-color: #33435E;
    background: #0F1524;
}
.dark .face-view-label,
.dark .face-empty,
.dark .face-scroll-hint,
.dark .unmapped-note,
.dark .connection-detail {
    color: #B7C5D9;
}
.dark .port-anchor {
    border-color: #172238;
}
</style>
