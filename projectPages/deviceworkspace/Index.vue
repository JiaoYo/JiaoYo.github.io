<script lang="ts" setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { startDeviceScan, type DeviceScanType } from '@/utils/deviceScan';
import DebugDocuments from './DebugDocuments.vue';
import ChecklistDrawer from './ChecklistDrawer.vue';
import CollaborationDrawer from './CollaborationDrawer.vue';
import LifecycleDrawer from './LifecycleDrawer.vue';
import NetworkTopologyDrawer, { type TopologyPort } from './NetworkTopologyDrawer.vue';
import NetworkConfigDrawer, { type NetworkConfigState } from './NetworkConfigDrawer.vue';

const { theme, themeVars } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const appThemeColor = computed(() => String(themeVars.value.colorTheme || '#0055FE'));
const scannedCode = ref('1021702119');
const scannedType = ref<DeviceScanType>('barCode');
const deviceModel = 'PBox6140H';
function readProjectName() {
    const storedName = String(uni.getStorageSync('projectname') || '');
    try {
        return decodeURIComponent(storedName);
    } catch {
        // 历史缓存可能不是 URL 编码，直接展示原始项目名。
        return storedName;
    }
}

const projectName = ref('');
const currentDebugger = String(uni.getStorageSync('username') || '当前用户');
const projectGateways = [
    { deviceNumber: '01', sn: '1021702119', lastDebugTime: '10月27日 16:42', note: '网口1接数采，IP 192.168.11.178，网口2接远动，IP192.168.100.177' },
    { deviceNumber: '02', sn: '1021702120', lastDebugTime: '10月26日 15:18', note: '网口1接数采，IP 192.168.11.179，网口2接远动，IP192.168.100.178' },
    { deviceNumber: '03', sn: '1021702121', lastDebugTime: '10月25日 11:06', note: '网口1接数采，IP 192.168.11.180，网口2接远动，IP192.168.100.179' },
];
const gatewayIndex = ref(0);
const gatewaySelectorVisible = ref(false);
const currentGateway = computed(() => projectGateways[gatewayIndex.value]);
const networkConfig = ref<NetworkConfigState | null>(null);
const gatewayRemark = ref('');
const gatewayRemarks: Record<string, string> = {
    '1021702119': '1 号并网柜数据采集网关',
    '1021702120': '2 号并网柜数据采集网关',
    '1021702121': '逆变器房远动通信网关',
};
const gatewayRemarkStorageKey = computed(() => `device-gateway-remark:${scannedCode.value}`);

const checkedItems = ref([true, false, false, false]);
const checkTimes = ref<(string | null)[]>(['2026-10-27 14:20', null, null, null]);
const completedCount = computed(() => checkedItems.value.filter(Boolean).length);
const topologyConnections = computed<TopologyPort[]>(() => {
    const connections: TopologyPort[] = [];
    const eth1Ip = networkConfig.value?.eth1.ip || '';
    const eth2Ip = networkConfig.value?.eth2.ip || '';
    if (eth1Ip) connections.push({ id: 'eth1', name: '以太网口 1', label: 'ETH1', kind: 'ethernet', status: '已接入', target: '调试网络 / 数采网络', ip: eth1Ip, parameter: '1000M · TCP/IP' });
    if (eth2Ip) connections.push({ id: 'eth2', name: '以太网口 2', label: 'ETH2', kind: 'ethernet', status: '已接入', target: '远动通信网络', ip: eth2Ip, parameter: '100M · TCP/IP' });
    const serialPorts = networkConfig.value?.serial;
    (['rs485_1', 'rs485_2'] as const).forEach((id, index) => {
        const serial = serialPorts?.[id];
        const devices = serial?.devices?.filter(device => device.name || device.address) || [];
        if (!serial || (!serial.baudRate && !serial.parity && !serial.dataBits && !serial.stopBits && !devices.length)) return;
        connections.push({
            id,
            name: `串口 ${index + 1}`,
            label: id === 'rs485_1' ? 'RS485-1' : 'RS485-2',
            kind: 'serial',
            status: devices.length ? `已接入 ${devices.length} 台` : '已配置',
            target: id === 'rs485_1' ? '现场采集总线' : '备用串行总线',
            parameter: [serial.baudRate, serial.dataBits, serial.parity, serial.stopBits].filter(Boolean).join(' · '),
            devices,
        });
    });
    const dido = networkConfig.value?.dido;
    if (dido?.inputs || dido?.outputs) {
        connections.push({ id: 'dido', name: 'DIDO 口', label: 'DIDO', kind: 'dido', status: '已配置', target: '消防告警 / 远程启停', parameter: `输入 ${dido.inputs || '未填写'} · 输出 ${dido.outputs || '未填写'}` });
    }
    const power = networkConfig.value?.dido?.power || '';
    connections.push({
        id: 'power',
        name: '电源接口',
        label: 'POWER',
        kind: 'power',
        status: power ? '已配置' : '待接入',
        target: '现场直流电源',
        parameter: power || '设备供电接口',
    });
    return connections;
});
const checklistStorageKey = computed(() => `device-checklist:${String(uni.getStorageSync('userId') || 'guest')}:${deviceModel}:${scannedCode.value}`);
const debugStages = [
    {
        shortName: '准备',
        title: '设备与供电准备',
        description: '先核对设备、固件和现场供电条件',
        steps: ['确认设备型号、外观和固件版本。', '检查供电、通信线缆及端子接线。', '核对设备 SN，记录初始状态。'],
        standard: '设备信息一致，供电与接线正常。',
        issue: '设备或供电异常，如何排查？',
    },
    {
        shortName: '接口',
        title: '接口信息检查',
        description: '核对网络、串口和 DIDO 接口参数',
        steps: ['确认以太网口 IP、子网掩码和默认网关。', '核对 RS485 串口参数及子设备地址。', '确认 DIDO 输入、输出与现场接线一致。'],
        standard: '网络、串口和 DIDO 信息完整，接口接线与参数一致。',
        issue: '接口信息缺失，如何排查？',
    },
    {
        shortName: '采集',
        title: '数据采集检查',
        description: '核对采集通道与测点数据',
        steps: ['检查从站地址和通信参数。', '按点表核对寄存器地址与数据类型。', '观察原始报文和测点更新。'],
        standard: '设备响应正常，测点数据持续更新。',
        issue: '测点没有数据，如何排查？',
    },
    {
        shortName: '上送',
        title: '平台上送检查',
        description: '确认数据已稳定上送至平台',
        steps: ['核对平台地址、端口和连接参数。', '检查平台在线状态和测点数据。', '持续观察重连日志与数据变化。'],
        standard: '平台持续在线，数据上送稳定。',
        issue: '平台离线或数据异常，如何排查？',
    },
];
const activeStageIndex = ref(1);
const activeStage = computed(() => debugStages[activeStageIndex.value]);
const interfaceSummary = computed(() => {
    const config = networkConfig.value;
    const network = [`ETH1：${config?.eth1.ip || '未配置'}`, `ETH2：${config?.eth2.ip || '未配置'}`];
    const serial = (['rs485_1', 'rs485_2'] as const).map((id, index) => {
        const port = config?.serial?.[id];
        const count = port?.devices?.filter(device => device.name || device.address).length || 0;
        return `RS485-${index + 1}：${port?.baudRate || '未配置'}${count ? ` · 子设备 ${count} 台` : ''}`;
    });
    const dido = config?.dido;
    return [
        { title: '网络信息', icon: 'wifi', values: network },
        { title: '串口信息', icon: 'link', values: serial },
        { title: 'DIDO 信息', icon: 'switch', values: [`输入：${dido?.inputs || '未配置'}`, `输出：${dido?.outputs || '未配置'}`] },
    ];
});
const nextStageIndex = computed(() => {
    const pendingIndex = checkedItems.value.findIndex(checked => !checked);
    return pendingIndex >= 0 ? pendingIndex : debugStages.length - 1;
});
const nextStage = computed(() => debugStages[nextStageIndex.value]);

const features = [
    { title: '现场备注', icon: 'note', description: '通过语音转文字、文字和图片记录现场情况，保存到设备工作区供项目成员查看。' },
    { title: '评论', icon: 'chat1', description: '项目成员可以围绕现场备注评论和回复；讨论不会自动改变检查项状态。' },
];

const quickMenuItems = [
    { title: '检查清单', icon: 'check-circle', count: 4 },
    { title: '接口配置', icon: 'setting', count: 3 },
    { title: '调试文档', icon: 'read', count: 3 },
    { title: '现场备注', icon: 'note', count: 1 },
    { title: '同型号问题', icon: 'help-circle', count: 3 },
    { title: '评论', icon: 'chat1', count: 2 },
];

const activeFeature = ref('');
const quickMenuOpen = ref(false);
const debugDocumentsRef = ref<InstanceType<typeof DebugDocuments> | null>(null);
const checklistDrawerRef = ref<InstanceType<typeof ChecklistDrawer> | null>(null);
const collaborationDrawerRef = ref<InstanceType<typeof CollaborationDrawer> | null>(null);
const lifecycleDrawerRef = ref<InstanceType<typeof LifecycleDrawer> | null>(null);
const networkTopologyDrawerRef = ref<InstanceType<typeof NetworkTopologyDrawer> | null>(null);
const networkConfigDrawerRef = ref<InstanceType<typeof NetworkConfigDrawer> | null>(null);

const activeFeatureDescription = computed(() => {
    if (activeFeature.value === '继续未完成步骤') {
        return '进入“接口信息检查”的操作指引，按步骤记录网络、串口和 DIDO 信息。此处仅预览入口，暂不修改调试进度。';
    }
    return features.find(item => item.title === activeFeature.value)?.description || '';
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

function copyDeviceValue(label: string, value: string) {
    uni.setClipboardData({
        data: value,
        success: () => uni.showToast({ title: `${label}已复制`, icon: 'success' }),
    });
}

function handleRestartScan() {
    startDeviceScan(scannedType.value);
}

function previewSitePhoto() {
    uni.previewImage({
        urls: ['/static/pbox6140h-site.jpg'],
        current: 0,
    });
}

function loadChecklistState() {
    gatewayRemark.value = uni.getStorageSync(gatewayRemarkStorageKey.value) || gatewayRemarks[scannedCode.value] || '';
    const saved = uni.getStorageSync(checklistStorageKey.value);
    if (Array.isArray(saved?.checkedItems) && saved.checkedItems.length === 4) {
        checkedItems.value = saved.checkedItems.map(Boolean);
        checkTimes.value = Array.isArray(saved.checkTimes) ? saved.checkTimes : [null, null, null, null];
    } else {
        checkedItems.value = [true, false, false, false];
        checkTimes.value = ['2026-10-27 14:20', null, null, null];
    }
    activeStageIndex.value = checkedItems.value.findIndex(checked => !checked);
    if (activeStageIndex.value < 0) activeStageIndex.value = debugStages.length - 1;
}

function loadNetworkConfig() {
    const key = `device-network-config:${String(uni.getStorageSync('userId') || 'guest')}:${deviceModel}:${scannedCode.value}`;
    networkConfig.value = uni.getStorageSync(key) || null;
}

function switchGateway(index: number) {
    gatewayIndex.value = index;
    scannedCode.value = currentGateway.value.sn;
    gatewaySelectorVisible.value = false;
    activeFeature.value = '';
    loadChecklistState();
    loadNetworkConfig();
}

function getGatewayDebugStatus(sn: string) {
    const saved = uni.getStorageSync(`device-checklist:${String(uni.getStorageSync('userId') || 'guest')}:${deviceModel}:${sn}`);
    const checkedItems = Array.isArray(saved?.checkedItems) ? saved.checkedItems : [true, false, false, false];
    const completed = checkedItems.filter(Boolean).length;
    return { completed, total: 4, label: completed === 4 ? '调试完成' : completed > 0 ? '调试中' : '待调试' };
}

function readOption(options: Record<string, string>, key: string) {
    const value = options?.[key] || '';
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function loadProjectAssociation(code: string) {
    const associations = uni.getStorageSync('device-project-associations') || {};
    const associatedProject = associations[code] || {};
    projectName.value = associatedProject.name || readProjectName() || '示例光伏项目';
}

onLoad((options: Record<string, string>) => {
    if (options?.code) scannedCode.value = readOption(options, 'code');
    if (options?.type === 'qrCode') scannedType.value = 'qrCode';
    const associatedName = readOption(options, 'projectName');
    if (associatedName) {
        projectName.value = associatedName;
    } else {
        loadProjectAssociation(scannedCode.value);
    }
    const matchedIndex = projectGateways.findIndex(gateway => gateway.sn === scannedCode.value);
    gatewayIndex.value = matchedIndex >= 0 ? matchedIndex : 0;
    loadChecklistState();
    loadNetworkConfig();
});

function handleGatewayRemarkChange() {
    gatewayRemarks[scannedCode.value] = gatewayRemark.value;
    uni.setStorageSync(gatewayRemarkStorageKey.value, gatewayRemark.value);
}

function handleChecklistChange(state: { checkedItems: boolean[]; checkTimes: (string | null)[] }) {
    uni.setStorageSync(checklistStorageKey.value, state);
    activeStageIndex.value = state.checkedItems.findIndex(checked => !checked);
    if (activeStageIndex.value < 0) activeStageIndex.value = debugStages.length - 1;
}

function selectStage(index: number) {
    activeStageIndex.value = index;
}

function openStageChecklist() {
    checklistDrawerRef.value?.open(activeStageIndex.value);
}

function openCurrentStageChecklist() {
    activeStageIndex.value = nextStageIndex.value;
    openStageChecklist();
}

function openStageTroubleshooting() {
    if (activeStageIndex.value === 1) {
        debugDocumentsRef.value?.open('troubleshooting');
    } else {
        handleFeaturePreview('同型号问题');
    }
}

function openLifecycle() {
    lifecycleDrawerRef.value?.open();
}

function openNetworkTopology() {
    loadNetworkConfig();
    networkTopologyDrawerRef.value?.open();
}

function openNetworkConfig() {
    loadNetworkConfig();
    networkConfigDrawerRef.value?.open();
}

function handleNetworkConfigSaved(config: NetworkConfigState) {
    const key = `device-network-config:${String(uni.getStorageSync('userId') || 'guest')}:${deviceModel}:${scannedCode.value}`;
    networkConfig.value = config;
    uni.setStorageSync(key, config);
}

function handleFeaturePreview(title: string) {
    quickMenuOpen.value = false;
    if (title === '检查清单') {
        checklistDrawerRef.value?.open();
        return;
    }
    if (title === '接口配置') {
        openNetworkConfig();
        return;
    }
    if (title === '调试文档') {
        debugDocumentsRef.value?.open();
        return;
    }
    if (title === '同型号问题') {
        uni.navigateTo({
            url: `/projectPages/deviceissues/Index?model=${encodeURIComponent(deviceModel)}&projectName=${encodeURIComponent(projectName.value)}&sn=${encodeURIComponent(scannedCode.value)}`,
        });
        return;
    }
    activeFeature.value = activeFeature.value === title ? '' : title;
}
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <view class="page-root" :class="{ dark: isDark }">
            <wd-navbar title="设备工作区" left-arrow safe-area-inset-top placeholder fixed :bordered="false"
                :custom-style="`background:${isDark ? '#0F1524' : '#F4F8FF'}; color:${isDark ? '#E8ECF8' : '#1F2A44'};`" @click-left="handleClickLeft" />

            <view class="workspace-page">
                <view class="workspace-tools">
                    <view class="project-summary">
                        <wd-icon name="link" size="15px" color="#0055FE" />
                        <text v-if="projectName" class="project-name">{{ projectName }}</text>
                        <view class="gateway-switch project-gateway-switch" role="button" aria-label="选择当前项目网关" @click.stop="gatewaySelectorVisible = true">
                            <wd-icon name="swap" size="14px" color="#3974C6" custom-style="transform: scaleX(-1);" />
                        </view>
                    </view>
                    <view class="scan-again" @click="handleRestartScan">
                        <wd-icon name="scan1" size="20px" />
                        <text>重新扫码</text>
                    </view>
                </view>

                <view class="identity-card surface">
                    <view class="project-row">
                        <view class="gateway-remark-row">
                            <wd-icon name="edit-outline" size="15px" color="#7A8AA5" />
                            <input v-model="gatewayRemark" class="gateway-remark-input" aria-label="网关备注" placeholder="填写网关备注" @blur="handleGatewayRemarkChange" @confirm="handleGatewayRemarkChange" />
                        </view>
                        <view class="device-image" role="button" aria-label="查看2D网络拓扑图" @click.stop="openNetworkTopology">
                            <image src="/static/pbox6140h.png" mode="aspectFit" :aria-label="`${deviceModel} 正面、侧面与顶面模型图`" />
                            <view class="device-image-hint" aria-hidden="true" :style="{ color: appThemeColor }">
                                <wd-icon name="view" size="16px" />
                            </view>
                        </view>
                    </view>
                    <view class="device-info">
                        <view class="device-info-item">
                            <view class="info-label-row">
                                <text class="info-label">设备型号</text>
                            </view>
                            <text class="info-value" role="button" aria-label="复制设备型号" @click="copyDeviceValue('设备型号', deviceModel)">{{ deviceModel }}</text>
                        </view>
                        <view class="device-info-item sn-info">
                            <view class="sn-label-row">
                                <view class="info-label-row">
                                    <text class="info-label">{{ scannedType === 'qrCode' ? '二维码内容' : '设备 SN' }}</text>
                                </view>
                                <view class="lifecycle-action" role="button" aria-label="查看设备生命周期" :style="{ color: appThemeColor }" @click.stop="openLifecycle">
                                    <image class="lifecycle-icon-image" src="/static/lifecycle.png" mode="aspectFit" aria-hidden="true" />
                                </view>
                            </view>
                            <text class="info-value" role="button" :aria-label="scannedType === 'qrCode' ? '复制二维码内容' : '复制设备 SN'" @click="copyDeviceValue(scannedType === 'qrCode' ? '二维码内容' : '设备 SN', scannedCode)">{{ scannedCode }}</text>
                        </view>
                    </view>
                    <view class="sync-row">
                        <view class="sync-status">
                            <wd-icon name="check-circle" size="15px" color="#22A06B" />
                            <text class="sync-label">已同步</text>
                        </view>
                        <text class="sync-time">今天 10:38</text>
                    </view>
                </view>

                <view class="progress-card surface">
                    <view class="progress-context" role="button" aria-label="查看历史调试和当前协作人员" @click="collaborationDrawerRef?.open()">
                        <wd-icon name="time" size="17px" color="#0055FE" />
                        <view class="debugger-names">
                            <text>上次调试：李工</text>
                            <text class="progress-context-divider">·</text>
                            <text>当前调试：{{ currentDebugger }}</text>
                        </view>
                        <wd-icon name="arrow-right" size="16px" color="#0055FE" />
                    </view>
                    <view class="stage-steps" role="group" aria-label="调试阶段进度">
                        <template v-for="(stage, index) in debugStages" :key="stage.shortName">
                            <view v-if="index" class="stage-connector" :class="{ completed: checkedItems[index - 1] }"></view>
                            <view class="stage-item" :class="{ active: activeStageIndex === index, completed: checkedItems[index] }"
                                role="button" :aria-label="`${stage.shortName}阶段，${checkedItems[index] ? '已完成' : '未完成'}`" @click="selectStage(index)">
                                <view class="stage-number">
                                    <wd-icon v-if="checkedItems[index]" name="check" size="18px" :color="activeStageIndex === index ? '#FFFFFF' : '#0055FE'" />
                                    <text v-else>{{ index + 1 }}</text>
                                </view>
                                <text class="stage-name">{{ stage.shortName }}</text>
                            </view>
                        </template>
                    </view>

                    <view class="stage-detail">
                        <view class="stage-detail-heading">
                            <text class="stage-index">{{ String(activeStageIndex + 1).padStart(2, '0') }}</text>
                            <text class="stage-title">{{ activeStage.title }}</text>
                            <text v-if="checkedItems[activeStageIndex]" class="stage-done">已完成</text>
                        </view>
                        <text class="stage-description">{{ activeStage.description }}</text>
                        <view v-for="(step, index) in activeStage.steps" :key="step" class="stage-step">
                            <text class="stage-step-number">{{ index + 1 }}</text>
                            <text class="stage-step-text">{{ step }}</text>
                        </view>
                        <view class="stage-standard">
                            <view class="stage-standard-heading">
                                <wd-icon name="check-circle" size="19px" color="#0055FE" />
                                <text>通过标准</text>
                            </view>
                            <text>{{ activeStage.standard }}</text>
                        </view>
                        <view v-if="activeStageIndex === 1" class="interface-summary">
                            <view v-for="section in interfaceSummary" :key="section.title" class="interface-summary-card">
                                <view class="interface-summary-heading">
                                    <wd-icon :name="section.icon" size="16px" color="#0055FE" />
                                    <text>{{ section.title }}</text>
                                </view>
                                <text v-for="value in section.values" :key="value" class="interface-summary-value">{{ value }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="stage-troubleshooting" role="button" @click="openStageTroubleshooting">
                        <wd-icon name="help-circle" size="19px" color="#0055FE" />
                        <text>{{ activeStage.issue }}</text>
                        <wd-icon name="arrow-right" size="18px" color="#0055FE" />
                    </view>
                </view>

                <view class="handoff-card surface">
                    <view class="card-heading">
                        <text class="card-title">当前待处理</text>
                        <text class="status-tag pending">待处理</text>
                    </view>
                    <text class="handoff-title">接口信息检查</text>
                    <text class="handoff-description">网络、串口和 DIDO 接口信息尚未补齐。</text>
                    <view class="handoff-note">
                        <view class="note-author">
                            <wd-icon name="note" size="16px" color="#A56913" />
                            <text>李工的交接备注</text>
                        </view>
                        <text class="note-content">{{ currentGateway.note }}</text>
                        <view class="note-attachment" role="button" aria-label="查看现场图片" @click="previewSitePhoto">
                            <image class="attachment-thumbnail" src="/static/pbox6140h-site.jpg" mode="aspectFill" />
                            <view class="attachment-caption">
                                <text>现场图片 1 张</text>
                                <text class="attachment-action">点击查看大图</text>
                            </view>
                            <wd-icon name="arrow-right" size="16px" />
                        </view>
                    </view>
                </view>

                <view v-if="activeFeature" class="feature-preview surface">
                    <view class="feature-preview-heading">
                        <text class="feature-preview-title">{{ activeFeature }}</text>
                        <view class="preview-close" role="button" aria-label="关闭界面预览" @click="activeFeature = ''">
                            <wd-icon name="close" size="18px" />
                        </view>
                    </view>
                    <text class="feature-preview-description">{{ activeFeatureDescription }}</text>
                    <text class="feature-preview-note">仅预览功能入口，暂不执行业务操作</text>
                </view>

                <view class="workspace-bottom-spacer"></view>
            </view>

            <view class="continue-bar surface">
                <view class="continue-context">
                    <text class="continue-label">下一步</text>
                    <text class="continue-title">{{ nextStage.title }}</text>
                </view>
                <wd-button custom-style="background:#0055FE;border-color:#0055FE;white-space:nowrap;" @click="openCurrentStageChecklist">记录检查结果</wd-button>
            </view>
            <view v-if="quickMenuOpen" class="quick-menu-dismiss" aria-hidden="true" @click="quickMenuOpen = false"></view>
            <view v-if="quickMenuOpen" class="quick-menu surface" role="menu" aria-label="工作区快捷菜单">
                <view class="quick-menu-heading">工作区工具</view>
                <view v-for="item in quickMenuItems" :key="item.title" class="quick-menu-item" role="menuitem" :aria-label="`快捷${item.title}`" @click="handleFeaturePreview(item.title)">
                    <view class="quick-menu-icon">
                        <wd-icon :name="item.icon" size="19px" color="#0055FE" />
                    </view>
                    <text>{{ item.title }}</text>
                    <text class="quick-menu-count" :aria-label="`${item.count}项`">{{ item.count }}</text>
                </view>
            </view>
            <view class="quick-menu-ball" role="button" :aria-expanded="quickMenuOpen" :aria-label="quickMenuOpen ? '收起工作区菜单' : '打开工作区菜单'" @click="quickMenuOpen = !quickMenuOpen">
                <wd-icon :name="quickMenuOpen ? 'close' : 'list'" size="24px" color="#FFFFFF" />
            </view>
            <wd-popup v-model="gatewaySelectorVisible" position="bottom" :z-index="1100" :lock-scroll="false"
                custom-style="border-radius:28rpx 28rpx 0 0;overflow:hidden;background:#F4F8FF;padding-bottom:env(safe-area-inset-bottom);">
                <view class="gateway-selector">
                    <view class="gateway-selector-header">
                        <view>
                            <text class="gateway-selector-title">选择网关设备</text>
                            <text class="gateway-selector-subtitle">当前项目：{{ projectName || '未关联项目' }}</text>
                        </view>
                        <view class="gateway-selector-close" role="button" aria-label="关闭设备选择" @click="gatewaySelectorVisible = false">
                            <wd-icon name="close" size="20px" />
                        </view>
                    </view>
                    <view v-for="(gateway, index) in projectGateways" :key="gateway.sn" class="gateway-option" :class="{ selected: gatewayIndex === index }"
                        role="button" :aria-label="`选择${gateway.deviceNumber}号网关 ${gateway.sn}`" @click="switchGateway(index)">
                        <view class="gateway-option-device">
                            <view class="gateway-option-remark-row">
                                <text class="gateway-option-number">{{ gatewayRemarks[gateway.sn] || `${gateway.deviceNumber} 号网关` }}</text>
                                <view class="gateway-debug-status" :class="{ completed: getGatewayDebugStatus(gateway.sn).completed === 4 }">
                                    <text>{{ getGatewayDebugStatus(gateway.sn).label }}</text>
                                    <text class="gateway-debug-count">{{ getGatewayDebugStatus(gateway.sn).completed }}/4</text>
                                </view>
                            </view>
                            <view class="gateway-option-detail">
                                <text class="gateway-option-model"><text class="gateway-option-label">型号 </text><text class="gateway-option-value">{{ deviceModel }}</text></text>
                                <text class="gateway-option-sn"><text class="gateway-option-label">SN </text><text class="gateway-option-value">{{ gateway.sn }}</text></text>
                            </view>
                        </view>
                        <wd-icon v-if="gatewayIndex === index" name="check-circle" size="22px" color="#0055FE" />
                        <wd-icon v-else name="arrow-right" size="18px" color="#7A8AA5" />
                    </view>
                </view>
            </wd-popup>
            <DebugDocuments ref="debugDocumentsRef" />
            <ChecklistDrawer ref="checklistDrawerRef" v-model:checked-items="checkedItems" v-model:check-times="checkTimes" @change="handleChecklistChange" />
            <CollaborationDrawer ref="collaborationDrawerRef" :gateway-number="`${currentGateway.deviceNumber} 号网关`"
                :serial-number="scannedCode" :model="deviceModel" :project-name="projectName" :current-user="currentDebugger" />
            <LifecycleDrawer ref="lifecycleDrawerRef" :model="deviceModel" :serial-number="scannedCode"
                :project-name="projectName" :theme-color="appThemeColor" :dark="isDark" />
            <NetworkTopologyDrawer ref="networkTopologyDrawerRef" :model="deviceModel" :serial-number="scannedCode"
                :project-name="projectName" :theme-color="appThemeColor" :dark="isDark" :connections="topologyConnections" />
            <NetworkConfigDrawer ref="networkConfigDrawerRef" :model="deviceModel" :serial-number="scannedCode"
                :project-name="projectName" :theme-color="appThemeColor" :dark="isDark" :config="networkConfig"
                @saved="handleNetworkConfigSaved" />
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.page-root {
    min-height: 100vh;
    background: #F4F8FF;
    color: #1F2A44;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.page-root.dark {
    background: #0F1524;
    color: #E8ECF8;
}
.surface {
    background: #FFFFFF;
}
.dark .surface {
    background: #171F31;
}
.scan-again {
    display: flex;
    align-items: center;
    gap: 6rpx;
    min-height: 44px;
    color: #0055FE;
    font-size: 26rpx;
    white-space: nowrap;
}
.dark .scan-again {
    color: #69B1FF;
}
.scan-page {
    padding: 40rpx 40rpx 56rpx;
}
.scan-intro {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 36rpx;
}
.scan-title {
    font-size: 40rpx;
    line-height: 1.4;
    font-weight: 600;
}
.scan-description {
    color: #68768D;
    font-size: 27rpx;
    line-height: 1.8;
    white-space: pre-line;
}
.dark .scan-description,
.dark .scan-default-note {
    color: #A0ACC0;
}
.scan-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    border-radius: 28rpx;
    background: #142236;
    box-shadow: 0 16rpx 36rpx rgba(20, 34, 54, 0.13);
}
.native-scan-region {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 230rpx;
    border-radius: 24rpx;
    background: #000000;
}
.native-scan-region.qrcode {
    width: 440rpx;
    height: 440rpx;
    margin-top: 28rpx;
}
.scan-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    color: #C0CDDD;
    font-size: 26rpx;
}
.scan-stage-note {
    padding: 26rpx 0;
    margin: 0;
    color: #C0CDDD;
    font-size: 26rpx;
}
.scan-type-switch {
    display: flex;
    gap: 12rpx;
    margin-top: 36rpx;
    padding: 8rpx;
    border-radius: 18rpx;
    background: #E8EEF8;
}
.dark .scan-type-switch {
    background: #171F31;
}
.scan-type-item {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    min-height: 80rpx;
    border: 1px solid transparent;
    border-radius: 12rpx;
    color: #68768D;
    font-size: 28rpx;
}
.scan-type-item.active {
    border-color: #D5E2FA;
    background: #FFFFFF;
    color: #0055FE;
    font-weight: 500;
}
.dark .scan-type-item {
    color: #A0ACC0;
}
.dark .scan-type-item.active {
    border-color: #344C75;
    background: #24334D;
    color: #80B4FF;
}
.scan-default-note {
    display: block;
    margin-top: 16rpx;
    color: #7A8AA5;
    font-size: 24rpx;
    text-align: center;
}
.torch-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    width: fit-content;
    min-height: 80rpx;
    margin: 20rpx auto 0;
    padding: 0 28rpx;
    color: #0055FE;
    font-size: 27rpx;
}
.dark .torch-button {
    color: #80B4FF;
}
.torch-button.enabled {
    color: #16875A;
}
.scan-demo-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    margin: 16rpx 0 24rpx;
    color: #7A8AA5;
    font-size: 24rpx;
}
.workspace-page {
    padding: 0 24rpx;
}
.workspace-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
}
.project-summary {
    display: flex;
    align-items: center;
    gap: 10rpx;
    min-width: 0;
    padding: 20rpx 0;
}
.project-summary .project-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.project-summary .project-gateway-switch {
    margin-left: 2rpx;
}
.preview-label {
    padding: 20rpx 4rpx;
    color: #7A8AA5;
    font-size: 24rpx;
}
.identity-card,
.progress-card,
.handoff-card,
.shortcut-card,
.check-card {
    border-radius: 24rpx;
    box-shadow: 0 5rpx 20rpx rgba(35, 69, 119, 0.035);
}
.identity-card {
    padding: 28rpx;
}
.project-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding-right: 176rpx;
}
.device-image {
    position: absolute;
    top: -24rpx;
    right: -8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 172rpx;
    height: 190rpx;
}
.device-image image {
    display: block;
    width: 100%;
    height: 100%;
}
.device-image-hint {
    position: absolute;
    left: 6rpx;
    bottom: 4rpx;
    display: flex;
    align-items: center;
    gap: 4rpx;
    justify-content: center;
    width: 34rpx;
    height: 34rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, .92);
    box-shadow: 0 3rpx 12rpx rgba(35, 69, 119, .08);
}
.dark .device-image-hint {
    background: rgba(23, 31, 49, .92);
}
.project-name {
    color: #5D6C85;
    font-size: 26rpx;
}
.dark .project-name {
    color: #A0ACC0;
}
.device-info {
    display: flex;
    gap: 20rpx;
    margin-top: 28rpx;
    padding-bottom: 26rpx;
}
.device-info-item {
    display: flex;
    flex-direction: column;
    gap: 10rpx;
    min-width: 0;
}
.sn-info {
    flex: 1;
}
.sn-label-row {
    display: flex;
    align-items: flex-start;
    gap: 40rpx;
}
.sn-info .info-value {
    align-self: flex-start;
    max-width: 100%;
}
.info-label-row {
    display: flex;
    align-items: center;
    height: 40rpx;
}
.gateway-switch {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: #3974C6;
}
.lifecycle-action {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40rpx;
    height: 40rpx;
    color: #0055FE;
}
.lifecycle-icon-image {
    display: block;
    width: 28rpx;
    height: 28rpx;
}
.dark .lifecycle-action {
    color: #80B4FF;
}
.dark .gateway-switch {
    color: #80B4FF;
}
.gateway-position {
    min-width: 40rpx;
    color: #7A8AA5;
    font-size: 21rpx;
    text-align: center;
}
.info-label {
    color: #7A8AA5;
    font-size: 24rpx;
}
.info-value {
    font-size: 27rpx;
    font-weight: 500;
    overflow-wrap: anywhere;
}
.sync-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 22rpx;
    border-top: 1px solid #EDF1F7;
    font-size: 24rpx;
}
.dark .sync-row {
    border-top-color: #2A3548;
}
.gateway-remark-row {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 12rpx;
    min-width: 0;
    min-height: 44rpx;
}
.gateway-remark-row .wd-icon {
    flex-shrink: 0;
    line-height: 1;
}
.gateway-remark-input {
    flex: 1;
    min-width: 0;
    height: 40rpx;
    color: #5D6C85;
    font-size: 24rpx;
    line-height: 40rpx;
}
.dark .gateway-remark-input {
    color: #B1BCD0;
}
.sync-label {
    color: #5D6C85;
    font-size: 24rpx;
}
.dark .sync-label {
    color: #B1BCD0;
}
.sync-status {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #16875A;
}
.sync-time {
    color: #7A8AA5;
}
.progress-card,
.handoff-card {
    margin-top: 20rpx;
    padding: 28rpx;
}
.progress-context {
    display: flex;
    align-items: center;
    gap: 10rpx;
    color: #0055FE;
    font-size: 25rpx;
}
.progress-context-divider {
    color: #A0ACC0;
}
.debugger-names {
    display: flex;
    flex: 1;
    align-items: center;
    flex-wrap: wrap;
    gap: 8rpx;
    min-width: 0;
    line-height: 1.5;
}
.stage-steps {
    display: flex;
    align-items: flex-start;
    margin-top: 28rpx;
}
.stage-item {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    width: 76rpx;
    color: #68768D;
    font-size: 24rpx;
}
.stage-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: #EEF1F7;
    color: #7A8AA5;
    font-size: 25rpx;
}
.stage-item.completed .stage-number {
    background: #EAF2FF;
    color: #0055FE;
}
.stage-item.active .stage-number {
    background: #0055FE;
    color: #FFFFFF;
    box-shadow: 0 4rpx 12rpx rgba(0, 85, 254, 0.18);
}
.stage-item.active .stage-name {
    color: #0055FE;
    font-weight: 600;
}
.stage-item.completed .stage-name {
    color: #5D6C85;
}
.stage-connector {
    flex: 1;
    min-width: 16rpx;
    height: 2rpx;
    margin-top: 28rpx;
    background: #DEE5F0;
}
.stage-connector.completed {
    background: #91B8F7;
}
.stage-detail {
    margin-top: 28rpx;
    padding: 26rpx;
    border: 1px solid #E4ECF8;
    border-radius: 20rpx;
    background: #FAFCFF;
}
.dark .stage-detail {
    border-color: #2A3548;
    background: #131C2C;
}
.stage-detail-heading {
    display: flex;
    align-items: center;
    gap: 18rpx;
}
.stage-index {
    color: #5D6C85;
    font-size: 36rpx;
    font-weight: 600;
}
.stage-title {
    flex: 1;
    font-size: 31rpx;
    font-weight: 600;
}
.stage-done {
    flex-shrink: 0;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    background: #E6F5ED;
    color: #16875A;
    font-size: 22rpx;
}
.stage-description {
    display: block;
    margin-top: 14rpx;
    color: #68768D;
    font-size: 26rpx;
    line-height: 1.7;
}
.dark .stage-description,
.dark .stage-item,
.dark .stage-index {
    color: #A0ACC0;
}
.stage-step {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    margin-top: 22rpx;
}
.stage-step-number {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 38rpx;
    height: 38rpx;
    margin-top: 3rpx;
    border-radius: 9rpx;
    background: #EDF4FF;
    color: #0055FE;
    font-size: 23rpx;
}
.dark .stage-step-number {
    background: #24334D;
    color: #80B4FF;
}
.stage-step-text {
    flex: 1;
    color: #3D4C63;
    font-size: 26rpx;
    line-height: 1.65;
}
.dark .stage-step-text {
    color: #B1BCD0;
}
.stage-standard {
    margin-top: 26rpx;
    padding: 20rpx;
    border-radius: 16rpx;
    background: #F0F5FF;
    color: #4F617D;
    font-size: 25rpx;
    line-height: 1.7;
}
.dark .stage-standard {
    background: #202D44;
    color: #B1BCD0;
}
.stage-standard-heading {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 10rpx;
    color: #0055FE;
    font-size: 26rpx;
    font-weight: 600;
}
.dark .stage-standard-heading,
.dark .stage-item.active .stage-name {
    color: #80B4FF;
}
.interface-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12rpx;
    margin-top: 18rpx;
}
.interface-summary-card {
    min-width: 0;
    padding: 14rpx;
    border: 1px solid #DDE7F3;
    border-radius: 14rpx;
    background: #FFFFFF;
}
.dark .interface-summary-card {
    border-color: #2A3548;
    background: #171F31;
}
.interface-summary-heading {
    display: flex;
    align-items: center;
    gap: 6rpx;
    color: #1F2A44;
    font-size: 22rpx;
    font-weight: 600;
}
.dark .interface-summary-heading {
    color: #E8ECF8;
}
.interface-summary-value {
    display: block;
    margin-top: 8rpx;
    overflow: hidden;
    color: #68768D;
    font-size: 19rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.stage-troubleshooting {
    display: flex;
    align-items: center;
    gap: 12rpx;
    min-height: 80rpx;
    margin-top: 20rpx;
    padding: 0 20rpx;
    border: 1px solid #E1E8F2;
    border-radius: 16rpx;
    color: #0055FE;
    font-size: 25rpx;
}
.stage-troubleshooting text {
    flex: 1;
}
.dark .stage-troubleshooting {
    border-color: #344056;
    color: #80B4FF;
}
.card-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    margin-bottom: 22rpx;
}
.card-title {
    font-size: 30rpx;
    font-weight: 600;
}
.progress-number {
    color: #0055FE;
    font-size: 34rpx;
    font-weight: 600;
    white-space: nowrap;
}
.progress-total {
    color: #7A8AA5;
    font-size: 24rpx;
    font-weight: 400;
}
.last-debugger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin-top: 24rpx;
    color: #68768D;
    font-size: 24rpx;
}
.debugger-name {
    display: flex;
    align-items: center;
    gap: 10rpx;
}
.dark .last-debugger,
.dark .info-label,
.dark .sync-time,
.dark .section-caption,
.dark .check-meta,
.dark .checklist-note,
.dark .continue-label {
    color: #A0ACC0;
}
.status-tag {
    padding: 5rpx 14rpx;
    border-radius: 10rpx;
    font-size: 23rpx;
}
.status-tag.pending {
    background: #FFF1D9;
    color: #A55B00;
}
.dark .status-tag.pending {
    background: #46371F;
    color: #FFC66E;
}
.handoff-title {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 1.5;
}
.handoff-description {
    display: block;
    margin-top: 12rpx;
    color: #5D6C85;
    font-size: 27rpx;
    line-height: 1.7;
}
.dark .handoff-description {
    color: #B1BCD0;
}
.handoff-note {
    margin-top: 22rpx;
    padding: 22rpx;
    border-radius: 16rpx;
    background: #FFF8E9;
}
.dark .handoff-note {
    background: #302C24;
}
.note-author {
    display: flex;
    align-items: center;
    gap: 10rpx;
    color: #90611A;
    font-size: 24rpx;
}
.dark .note-author {
    color: #DFBD78;
}
.note-content {
    display: block;
    margin-top: 14rpx;
    font-size: 27rpx;
    line-height: 1.7;
}
.note-attachment {
    display: flex;
    align-items: center;
    gap: 16rpx;
    min-height: 44px;
    margin-top: 20rpx;
    color: #7A8AA5;
    font-size: 24rpx;
}
.attachment-thumbnail {
    flex-shrink: 0;
    width: 88rpx;
    height: 108rpx;
    border: 1px solid #E7DCC1;
    border-radius: 10rpx;
    background: #FFFFFF;
}
.attachment-caption {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8rpx;
}
.attachment-action {
    color: #0055FE;
    font-size: 23rpx;
}
.shortcut-card {
    display: flex;
    margin-top: 20rpx;
    padding: 24rpx 8rpx;
}
.shortcut-item {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14rpx;
    min-width: 0;
    min-height: 112rpx;
    border-radius: 16rpx;
    font-size: 24rpx;
    text-align: center;
}
.shortcut-item.selected {
    background: #F0F5FF;
}
.dark .shortcut-item.selected {
    background: #24334D;
}
.shortcut-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    background: #EDF4FF;
}
.dark .shortcut-icon {
    background: #24334D;
}
.feature-preview {
    margin-top: 20rpx;
    padding: 24rpx;
    border: 1px solid #D6E4FF;
    border-radius: 20rpx;
}
.dark .feature-preview {
    border-color: #344C75;
}
.feature-preview-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}
.feature-preview-title {
    font-size: 28rpx;
    font-weight: 600;
}
.preview-close {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 64rpx;
    min-height: 44px;
    color: #7A8AA5;
}
.feature-preview-description {
    display: block;
    color: #5D6C85;
    font-size: 26rpx;
    line-height: 1.8;
}
.dark .feature-preview-description {
    color: #B1BCD0;
}
.feature-preview-note {
    display: block;
    margin-top: 16rpx;
    color: #7A8AA5;
    font-size: 23rpx;
}
.section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 32rpx 4rpx 18rpx;
}
.section-title {
    font-size: 30rpx;
    font-weight: 600;
}
.section-caption {
    color: #7A8AA5;
    font-size: 24rpx;
}
.check-card {
    padding: 8rpx 24rpx;
}
.check-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 18rpx;
    padding: 24rpx 0;
}
.check-item.current {
    margin: 0 -12rpx;
    padding: 24rpx 12rpx;
    border-radius: 16rpx;
    background: #F0F5FF;
}
.dark .check-item.current {
    background: #202D44;
}
.check-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 44rpx;
    height: 44rpx;
    margin-top: 3rpx;
    border-radius: 50%;
}
.check-icon.passed {
    background: #E6F5ED;
    color: #16875A;
}
.check-icon.pending {
    background: #FFF1D9;
    color: #A55B00;
}
.check-icon.unchecked {
    background: #F0F2F6;
    color: #7A8AA5;
}
.dark .check-icon.passed {
    background: #1E3B31;
}
.dark .check-icon.pending {
    background: #46371F;
    color: #FFC66E;
}
.dark .check-icon.unchecked {
    background: #293447;
}
.check-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}
.check-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rpx;
}
.check-title {
    font-size: 28rpx;
    font-weight: 500;
}
.check-status {
    flex-shrink: 0;
    font-size: 23rpx;
}
.check-status.passed {
    color: #16875A;
}
.check-status.pending {
    color: #A55B00;
}
.check-status.unchecked {
    color: #7A8AA5;
}
.check-meta {
    margin-top: 10rpx;
    color: #7A8AA5;
    font-size: 23rpx;
    line-height: 1.6;
}
.check-result {
    margin-top: 10rpx;
    color: #5D6C85;
    font-size: 25rpx;
    line-height: 1.65;
}
.dark .check-result {
    color: #B1BCD0;
}
.check-divider {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 62rpx;
    height: 1px;
    background: #EDF1F7;
}
.dark .check-divider {
    background: #2A3548;
}
.checklist-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    margin-top: 22rpx;
    color: #7A8AA5;
    font-size: 23rpx;
}
.workspace-bottom-spacer {
    height: 190rpx;
    padding-bottom: env(safe-area-inset-bottom);
}
.continue-bar {
    position: fixed;
    z-index: 90;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
    box-shadow: 0 -6rpx 24rpx rgba(35, 69, 119, 0.06);
}
.continue-context {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    min-width: 0;
}
.continue-label {
    color: #7A8AA5;
    font-size: 22rpx;
}
.continue-title {
    font-size: 26rpx;
    white-space: nowrap;
}
.gateway-selector {
    padding: 28rpx;
    color: #1F2A44;
}
.dark .gateway-selector {
    color: #E8ECF8;
}
.gateway-selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    margin-bottom: 24rpx;
}
.gateway-selector-title {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
}
.gateway-selector-subtitle {
    display: block;
    margin-top: 10rpx;
    color: #7A8AA5;
    font-size: 24rpx;
}
.gateway-selector-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 44px;
    color: #68768D;
}
.gateway-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    min-height: 104rpx;
    margin-bottom: 16rpx;
    padding: 20rpx 24rpx;
    border: 1px solid transparent;
    border-radius: 18rpx;
    background: #FFFFFF;
}
.dark .gateway-option {
    background: #171F31;
}
.gateway-option.selected {
    border-color: #B7D2FA;
    background: #EDF4FF;
}
.dark .gateway-option.selected {
    border-color: #344C75;
    background: #24334D;
}
.gateway-option-device {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10rpx;
    min-width: 0;
}
.gateway-option-remark-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}
.gateway-debug-status {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8rpx;
    padding: 4rpx 10rpx;
    border-radius: 8rpx;
    background: #FFF3E2;
    color: #A56913;
    font-size: 22rpx;
    white-space: nowrap;
}
.gateway-debug-status.completed {
    background: #E6F5ED;
    color: #16875A;
}
.dark .gateway-debug-status {
    background: #3C3224;
    color: #E9BB74;
}
.dark .gateway-debug-status.completed {
    background: #1E3B31;
    color: #6BCB9B;
}
.gateway-debug-count {
    font-size: 20rpx;
}
.gateway-option-detail {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10rpx 24rpx;
    font-size: 24rpx;
    font-weight: 400;
}
.gateway-option-label {
    font-weight: 400;
}
.gateway-option-value {
    color: #111111;
    font-weight: 700;
}
.dark .gateway-option-value {
    color: #E8ECF8;
}
.gateway-option-number {
    font-size: 28rpx;
    font-weight: 500;
}
.gateway-option-model,
.gateway-option-sn {
    color: #68768D;
    font-size: 25rpx;
}
.dark .gateway-option-model,
.dark .gateway-option-sn {
    color: #B1BCD0;
}
.quick-menu-dismiss {
    position: fixed;
    z-index: 790;
    inset: 0;
}
.quick-menu {
    position: fixed;
    z-index: 800;
    right: 24rpx;
    bottom: calc(286rpx + env(safe-area-inset-bottom));
    width: 340rpx;
    max-height: calc(100vh - 440rpx);
    padding: 16rpx;
    border: 1px solid #E2EAF6;
    border-radius: 22rpx;
    box-shadow: 0 12rpx 40rpx rgba(35, 69, 119, 0.16);
}
.dark .quick-menu {
    border-color: #344056;
}
.quick-menu-heading {
    padding: 8rpx 12rpx 16rpx;
    color: #7A8AA5;
    font-size: 23rpx;
}
.quick-menu-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    min-height: 76rpx;
    padding: 0 12rpx;
    border-radius: 14rpx;
    font-size: 26rpx;
}
.quick-menu-item:active {
    background: #EDF4FF;
}
.dark .quick-menu-item:active {
    background: #24334D;
}
.quick-menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48rpx;
    height: 48rpx;
    border-radius: 14rpx;
    background: #EDF4FF;
}
.dark .quick-menu-icon {
    background: #24334D;
}
.quick-menu-item text:not(.quick-menu-count) {
    flex: 1;
    white-space: nowrap;
}
.quick-menu-count {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-width: 40rpx;
    height: 36rpx;
    padding: 0 10rpx;
    border-radius: 18rpx;
    background: #EDF4FF;
    color: #0055FE;
    font-size: 22rpx;
    font-weight: 500;
}
.dark .quick-menu-count {
    background: #24334D;
    color: #80B4FF;
}
.quick-menu-ball {
    position: fixed;
    z-index: 810;
    right: 24rpx;
    bottom: calc(170rpx + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    justify-content: center;
    width: 96rpx;
    height: 96rpx;
    border: 4rpx solid #FFFFFF;
    border-radius: 50%;
    background: #0055FE;
    box-shadow: 0 8rpx 24rpx rgba(0, 85, 254, 0.25);
    color: #FFFFFF;
}
@media screen and (max-width: 340px) {
    .continue-title {
        font-size: 23rpx;
    }
    .continue-bar {
        gap: 12rpx;
        padding-right: 20rpx;
        padding-left: 20rpx;
    }
    .check-title {
        font-size: 26rpx;
    }
}
</style>
