<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

export interface NetworkRoute {
    destination: string;
    gateway: string;
    interface: string;
    metric: string;
}

export interface SerialDevice {
    name: string;
    address: string;
}

export interface SerialPortConfig {
    baudRate: string;
    parity: string;
    dataBits: string;
    stopBits: string;
    devices: SerialDevice[];
}

export interface NetworkConfigState {
    eth1: { ip: string; mask: string; gateway: string };
    eth2: { ip: string; mask: string; gateway: string };
    serial: { rs485_1: SerialPortConfig; rs485_2: SerialPortConfig };
    dido: { inputs: string; outputs: string; power: string };
    routes: NetworkRoute[];
}

const props = withDefaults(defineProps<{
    model: string;
    serialNumber: string;
    projectName: string;
    themeColor: string;
    dark?: boolean;
    config?: NetworkConfigState | null;
}>(), {
    config: null,
});

const emit = defineEmits<{
    saved: [config: NetworkConfigState];
}>();

const visible = ref(false);
const isAppVersion = ref(false);
const form = ref<NetworkConfigState>(createEmptyConfig());
const ethernetPorts = computed(() => [
    { key: 'eth1', title: 'ETH1 · 以太网口 1', config: form.value.eth1 },
    { key: 'eth2', title: 'ETH2 · 以太网口 2', config: form.value.eth2 },
]);
const serialPorts = computed(() => [
    { key: 'rs485_1' as const, title: 'RS485-1 · 串口 1', config: form.value.serial.rs485_1 },
    { key: 'rs485_2' as const, title: 'RS485-2 · 串口 2', config: form.value.serial.rs485_2 },
]);

function createEmptyConfig(): NetworkConfigState {
    return {
        eth1: { ip: '', mask: '', gateway: '' },
        eth2: { ip: '', mask: '', gateway: '' },
        serial: {
            rs485_1: { baudRate: '', parity: '', dataBits: '', stopBits: '', devices: [] },
            rs485_2: { baudRate: '', parity: '', dataBits: '', stopBits: '', devices: [] },
        },
        dido: { inputs: '', outputs: '', power: '' },
        routes: [],
    };
}

function cloneConfig(config: NetworkConfigState | null | undefined): NetworkConfigState {
    const fallback = createEmptyConfig();
    if (!config) return fallback;
    return {
        eth1: { ...fallback.eth1, ...config.eth1 },
        eth2: { ...fallback.eth2, ...config.eth2 },
        serial: {
            rs485_1: { ...fallback.serial.rs485_1, ...config.serial?.rs485_1, devices: [...(config.serial?.rs485_1?.devices || [])] },
            rs485_2: { ...fallback.serial.rs485_2, ...config.serial?.rs485_2, devices: [...(config.serial?.rs485_2?.devices || [])] },
        },
        dido: { ...fallback.dido, ...config.dido },
        routes: Array.isArray(config.routes) ? config.routes.map(route => ({ ...route })) : [],
    };
}

watch(() => props.config, (config) => {
    if (!visible.value) form.value = cloneConfig(config);
}, { deep: true, immediate: true });

function open() {
    form.value = cloneConfig(props.config);
    visible.value = true;
}

function close() {
    visible.value = false;
}

function addRoute() {
    form.value.routes.push({ destination: '', gateway: '', interface: 'ETH1', metric: '10' });
}

function removeRoute(index: number) {
    form.value.routes.splice(index, 1);
}

function addSerialDevice(port: 'rs485_1' | 'rs485_2') {
    form.value.serial[port].devices.push({ name: '', address: '' });
}

function removeSerialDevice(port: 'rs485_1' | 'rs485_2', index: number) {
    form.value.serial[port].devices.splice(index, 1);
}

function save() {
    const config = cloneConfig(form.value);
    emit('saved', config);
    visible.value = false;
    uni.showToast({ title: '接口配置已保存', icon: 'success' });
}

defineExpose({ open });

onMounted(() => {
    const systemInfo = uni.getSystemInfoSync();
    isAppVersion.value = systemInfo.uniPlatform === 'app';
});
</script>

<template>
    <wd-popup v-model="visible" position="bottom" :z-index="1300" :lock-scroll="false" :hide-when-close="false"
        :custom-style="`height:92vh;border-radius:28rpx 28rpx 0 0;overflow:hidden;background:${dark ? '#0F1524' : '#F4F8FF'};`"
        @click-modal="close">
        <view class="network-config-drawer" :class="{ dark }">
            <view class="drawer-grabber" aria-hidden="true"></view>
            <view class="drawer-header">
                <view class="drawer-heading">
                    <view class="drawer-title-row">
                        <wd-icon name="setting" size="22px" :color="themeColor" />
                        <text class="drawer-title">接口配置</text>
                    </view>
                    <text class="drawer-subtitle">{{ projectName || '未关联项目' }} · {{ model }} · {{ serialNumber }}</text>
                </view>
                <view class="close-button" role="button" aria-label="关闭接口配置" @click="close">
                    <wd-icon name="close" size="21px" />
                </view>
            </view>

            <scroll-view scroll-y class="config-scroll">
                <view class="config-note" :style="{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}0D` }">
                    <wd-icon name="info-circle" size="17px" :color="themeColor" />
                    <text>保存接口信息后，设备 3D 拓扑图会显示对应端口和连接线。</text>
                </view>
                <view v-if="isAppVersion" class="app-version-note" :style="{ borderColor: `${themeColor}45`, backgroundColor: `${themeColor}0D` }">
                    <wd-icon name="desktop" size="18px" :color="themeColor" />
                    <text>当前为 App 版本，建议使用桌面版填写网络或串口信息，桌面版支持自动获取接口参数；当前仍可手动保存。</text>
                </view>

                <view class="config-section">
                    <view class="section-heading">
                        <text class="section-title">以太网口</text>
                        <text class="section-caption">IP、子网掩码和默认网关</text>
                    </view>
                    <view v-for="port in ethernetPorts" :key="port.key" class="ethernet-card">
                        <view class="ethernet-card-heading">
                            <text>{{ port.title }}</text>
                            <text class="card-status">{{ port.config.ip ? '已配置' : '待配置' }}</text>
                        </view>
                        <view class="field-grid">
                            <view class="field-item">
                                <text class="field-label">IP 地址</text>
                                <input v-model="port.config.ip" class="field-input" inputmode="decimal" placeholder="例如 192.168.11.178" />
                            </view>
                            <view class="field-item">
                                <text class="field-label">子网掩码</text>
                                <input v-model="port.config.mask" class="field-input" inputmode="decimal" placeholder="例如 255.255.255.0" />
                            </view>
                            <view class="field-item field-wide">
                                <text class="field-label">默认网关</text>
                                <input v-model="port.config.gateway" class="field-input" inputmode="decimal" placeholder="例如 192.168.11.1" />
                            </view>
                        </view>
                    </view>
                </view>

                <view class="config-section">
                    <view class="section-heading">
                        <text class="section-title">串口信息</text>
                        <text class="section-caption">RS485 参数和子设备地址</text>
                    </view>
                    <view v-for="port in serialPorts" :key="port.key" class="ethernet-card serial-card">
                        <view class="ethernet-card-heading">
                            <text>{{ port.title }}</text>
                            <text class="card-status">{{ port.config.devices.length ? `子设备 ${port.config.devices.length} 台` : '待配置' }}</text>
                        </view>
                        <view class="field-grid">
                            <view class="field-item">
                                <text class="field-label">波特率</text>
                                <input v-model="port.config.baudRate" class="field-input" inputmode="numeric" placeholder="例如 9600" />
                            </view>
                            <view class="field-item">
                                <text class="field-label">校验</text>
                                <input v-model="port.config.parity" class="field-input" placeholder="例如 N" />
                            </view>
                            <view class="field-item">
                                <text class="field-label">数据位</text>
                                <input v-model="port.config.dataBits" class="field-input" inputmode="numeric" placeholder="例如 8" />
                            </view>
                            <view class="field-item">
                                <text class="field-label">停止位</text>
                                <input v-model="port.config.stopBits" class="field-input" inputmode="numeric" placeholder="例如 1" />
                            </view>
                        </view>
                        <view class="device-address-heading">
                            <text class="field-label">子设备地址</text>
                            <view class="add-route" role="button" :aria-label="`为${port.title}添加子设备`" :style="{ color: themeColor }" @click="addSerialDevice(port.key)">
                                <wd-icon name="add" size="16px" />
                                <text>添加子设备</text>
                            </view>
                        </view>
                        <view v-if="!port.config.devices.length" class="route-empty compact-empty">暂无子设备地址</view>
                        <view v-for="(device, index) in port.config.devices" :key="`${port.key}-${index}`" class="serial-device-row">
                            <input v-model="device.name" class="field-input" placeholder="子设备名称" />
                            <input v-model="device.address" class="field-input" inputmode="numeric" placeholder="地址，如 01" />
                            <view class="remove-route" role="button" :aria-label="`删除${port.title}第${index + 1}个子设备`" @click="removeSerialDevice(port.key, index)">
                                <wd-icon name="delete" size="16px" />
                            </view>
                        </view>
                    </view>
                </view>

                <view class="config-section">
                    <view class="section-heading">
                        <text class="section-title">DIDO 信息</text>
                        <text class="section-caption">数字量输入和输出接线</text>
                    </view>
                    <view class="ethernet-card">
                        <view class="field-grid">
                            <view class="field-item field-wide">
                                <text class="field-label">输入接线</text>
                                <input v-model="form.dido.inputs" class="field-input" placeholder="例如 DI1 消防告警" />
                            </view>
                            <view class="field-item field-wide">
                                <text class="field-label">输出接线</text>
                                <input v-model="form.dido.outputs" class="field-input" placeholder="例如 DO1 远程启停" />
                            </view>
                            <view class="field-item field-wide">
                                <text class="field-label">电源接口</text>
                                <input v-model="form.dido.power" class="field-input" placeholder="例如 DC 24V · 1.2A" />
                            </view>
                        </view>
                    </view>
                </view>

                <view class="config-section">
                    <view class="section-heading">
                        <view>
                            <text class="section-title">静态路由</text>
                            <text class="section-caption">为指定目标网段选择出口</text>
                        </view>
                        <view class="add-route" role="button" aria-label="添加静态路由" :style="{ color: themeColor }" @click="addRoute">
                            <wd-icon name="add" size="16px" />
                            <text>添加路由</text>
                        </view>
                    </view>
                    <view v-if="!form.routes.length" class="route-empty">暂无静态路由，点击右上角添加。</view>
                    <view v-for="(route, index) in form.routes" :key="index" class="route-card">
                        <view class="route-card-heading">
                            <text>路由 {{ index + 1 }}</text>
                            <view class="remove-route" role="button" :aria-label="`删除路由${index + 1}`" @click="removeRoute(index)">
                                <wd-icon name="delete" size="16px" />
                            </view>
                        </view>
                        <view class="field-grid route-fields">
                            <view class="field-item">
                                <text class="field-label">目标网段</text>
                                <input v-model="route.destination" class="field-input" placeholder="例如 10.10.0.0/16" />
                            </view>
                            <view class="field-item">
                                <text class="field-label">下一跳网关</text>
                                <input v-model="route.gateway" class="field-input" inputmode="decimal" placeholder="例如 192.168.11.1" />
                            </view>
                            <view class="field-item">
                                <text class="field-label">出口接口</text>
                                <picker :range="['ETH1', 'ETH2']" :value="route.interface === 'ETH2' ? 1 : 0" @change="route.interface = Number($event.detail.value) === 1 ? 'ETH2' : 'ETH1'">
                                    <view class="field-input picker-input">{{ route.interface }}</view>
                                </picker>
                            </view>
                            <view class="field-item">
                                <text class="field-label">跃点</text>
                                <input v-model="route.metric" class="field-input" inputmode="numeric" placeholder="10" />
                            </view>
                        </view>
                    </view>
                </view>
            </scroll-view>

            <view class="config-footer">
                <wd-button plain @click="close">取消</wd-button>
                <wd-button :style="{ backgroundColor: themeColor, borderColor: themeColor }" @click="save">保存配置</wd-button>
            </view>
        </view>
    </wd-popup>
</template>

<style lang="scss" scoped>
.network-config-drawer {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #1F2A44;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.network-config-drawer.dark {
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
.config-scroll {
    flex: 1;
    min-height: 0;
    padding: 20rpx 28rpx;
    box-sizing: border-box;
}
.config-note {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx 18rpx;
    border: 1px solid;
    border-radius: 14rpx;
    color: #68768D;
    font-size: 22rpx;
    line-height: 1.45;
}
.app-version-note {
    display: flex;
    align-items: flex-start;
    gap: 8rpx;
    margin-top: 12rpx;
    padding: 14rpx 18rpx;
    border: 1px solid;
    border-radius: 14rpx;
    color: #3974C6;
    font-size: 21rpx;
    line-height: 1.5;
}
.dark .app-version-note {
    color: #A9C7FF;
}
.config-section {
    margin-top: 24rpx;
}
.section-heading,
.ethernet-card-heading,
.route-card-heading,
.config-footer,
.add-route,
.remove-route {
    display: flex;
    align-items: center;
}
.section-heading,
.ethernet-card-heading,
.route-card-heading {
    justify-content: space-between;
    gap: 16rpx;
}
.section-title {
    display: block;
    color: #1F2A44;
    font-size: 28rpx;
    font-weight: 650;
}
.dark .section-title,
.dark .ethernet-card-heading,
.dark .route-card-heading {
    color: #E8ECF8;
}
.section-caption {
    display: block;
    margin-top: 4rpx;
    color: #7A8AA5;
    font-size: 21rpx;
}
.add-route {
    gap: 5rpx;
    font-size: 22rpx;
}
.ethernet-card,
.route-card {
    margin-top: 12rpx;
    padding: 16rpx;
    border: 1px solid #E2EAF5;
    border-radius: 14rpx;
    background: #FFFFFF;
}
.dark .ethernet-card,
.dark .route-card {
    border-color: #2A3548;
    background: #171F31;
}
.ethernet-card-heading,
.route-card-heading {
    color: #1F2A44;
    font-size: 24rpx;
    font-weight: 600;
}
.card-status {
    color: #7A8AA5;
    font-size: 20rpx;
    font-weight: 400;
}
.field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12rpx;
    margin-top: 14rpx;
}
.field-item {
    min-width: 0;
}
.field-wide {
    grid-column: 1 / -1;
}
.field-label {
    display: block;
    margin-bottom: 6rpx;
    color: #7A8AA5;
    font-size: 20rpx;
}
.device-address-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16rpx;
}
.compact-empty {
    margin-top: 8rpx;
    padding: 12rpx;
}
.serial-device-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, .8fr) 34rpx;
    gap: 8rpx;
    align-items: center;
    margin-top: 8rpx;
}
.field-input {
    width: 100%;
    height: 64rpx;
    padding: 0 14rpx;
    border: 1px solid #D8E2EF;
    border-radius: 9rpx;
    background: #F8FAFD;
    color: #1F2A44;
    font-size: 22rpx;
    line-height: 64rpx;
    box-sizing: border-box;
}
.dark .field-input,
.dark .picker-input {
    border-color: #364762;
    background: #121B2C;
    color: #E8ECF8;
}
.picker-input {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.route-empty {
    margin-top: 12rpx;
    padding: 22rpx;
    border: 1px dashed #CBD8E8;
    border-radius: 12rpx;
    color: #98A5B5;
    font-size: 21rpx;
    text-align: center;
}
.remove-route {
    justify-content: center;
    width: 34rpx;
    height: 34rpx;
    color: #98A5B5;
}
.config-footer {
    flex-shrink: 0;
    justify-content: flex-end;
    gap: 14rpx;
    padding: 16rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));
    border-top: 1px solid #E6EDF7;
}
.dark .config-footer {
    border-top-color: #2A3548;
}
</style>
