<script setup lang="ts">
import { ref } from 'vue';

interface DebugDocument {
    id: string;
    title: string;
    category: string;
    description: string;
    updatedAt: string;
    sections: { title: string; content: string; steps?: string[] }[];
}

const emit = defineEmits<{ (event: 'minimize'): void }>();
const visible = ref(false);
const previewScrollTop = ref(0);
const documents: DebugDocument[] = [
    {
        id: 'commissioning',
        title: 'PBox6140H 现场调试指引',
        category: '调试流程',
        description: '从设备核对、接线到数据上送的现场检查步骤。',
        updatedAt: '2026-10-20',
        sections: [
            { title: '调试前准备', content: '确认设备型号为 PBox6140H，准备项目点表、网络参数和现场接线图。' },
            { title: '检查顺序', content: '按以下顺序完成检查，前一项异常时先记录并处理，再继续后续操作。', steps: ['核对设备外观、型号和固件版本。', '检查供电、通信线缆和端子接线。', '配置两个网口并检查管理页面与链路状态。', '核对采集测点，确认平台数据正常上送。'] },
            { title: '结果记录', content: '将异常现象、配置截图和处理结果记录到设备工作区，便于后续交接。' },
        ],
    },
    {
        id: 'network',
        title: '双网口与平台接入说明',
        category: '网络配置',
        description: '数采网口、远动网口及平台连接的配置注意事项。',
        updatedAt: '2026-10-18',
        sections: [
            { title: '网口用途', content: '网口1用于数采，网口2用于远动。实际地址以当前项目的网络规划为准。' },
            { title: '接入检查', content: '配置前确认网线接入正确，避免两个网络的 IP 地址或路由相互混用。', steps: ['记录两个网口的 IP、子网掩码和网关。', '分别检查网口链路与目标设备连通性。', '核对平台地址、端口和心跳周期。', '持续观察重连日志与平台在线状态。'] },
            { title: '注意事项', content: '修改网络配置前保留原参数。若管理页面无法访问，先检查管理端口和电脑代理设置。' },
        ],
    },
    {
        id: 'troubleshooting',
        title: '常见异常排查手册',
        category: '异常处理',
        description: '管理页面超时、测点无数据和平台离线的排查顺序。',
        updatedAt: '2026-10-15',
        sections: [
            { title: '管理页面访问超时', content: '确认设备地址和端口正确，检查电脑与设备是否处于同一网络，并暂时关闭代理或 VPN。' },
            { title: '平台没有测点数据', content: '先检查采集日志是否有设备响应，再核对从站地址、寄存器偏移、数据类型及字节序。' },
            { title: '平台反复离线', content: '检查供电、网线和上行网络，核对平台连接参数，恢复后持续观察重连记录。' },
        ],
    },
];
const selectedDocument = ref<DebugDocument>(documents[0]);
const previewing = ref(false);

function open(documentId?: string) {
    if (documentId) {
        const document = documents.find(item => item.id === documentId);
        if (document) {
            selectedDocument.value = document;
            previewScrollTop.value = 0;
        }
    }
    previewing.value = Boolean(documentId);
    visible.value = true;
}

function minimize() {
    visible.value = false;
    emit('minimize');
}

function selectDocument(document: DebugDocument) {
    selectedDocument.value = document;
    previewScrollTop.value = 0;
    previewing.value = true;
}

function backToList() {
    previewing.value = false;
}

function handlePreviewScroll(event: { detail: { scrollTop: number } }) {
    previewScrollTop.value = event.detail.scrollTop;
}

defineExpose({ open });
</script>

<template>
    <wd-popup :model-value="visible" position="bottom" :z-index="1000" :hide-when-close="false" :lock-scroll="false"
        custom-style="height:82vh;border-radius:28rpx 28rpx 0 0;overflow:hidden;background:#F4F8FF;"
        @click-modal="minimize">
        <view class="document-drawer">
            <view class="drawer-grabber" aria-hidden="true"></view>
            <view class="drawer-header">
                <view v-if="previewing" class="drawer-back" role="button" aria-label="返回文档列表" @click="backToList">
                    <wd-icon name="arrow-left" size="20px" />
                </view>
                <view class="drawer-heading">
                    <text class="drawer-title">{{ previewing ? selectedDocument.title : '调试文档' }}</text>
                    <text v-if="!previewing" class="drawer-subtitle">选择文档查看现场操作指引</text>
                </view>
                <view class="minimize-button" role="button" aria-label="缩小调试文档" @click="minimize">
                    <wd-icon name="minus" size="20px" />
                    <text>缩小</text>
                </view>
            </view>

            <scroll-view v-if="!previewing" scroll-y class="document-list">
                <view v-for="document in documents" :key="document.id" class="document-item" role="button" @click="selectDocument(document)">
                    <view class="document-icon">
                        <wd-icon name="read" size="25px" color="#0055FE" />
                    </view>
                    <view class="document-info">
                        <text class="document-category">{{ document.category }}</text>
                        <text class="document-title">{{ document.title }}</text>
                        <text class="document-description">{{ document.description }}</text>
                        <text class="document-date">更新于 {{ document.updatedAt }}</text>
                    </view>
                    <view class="document-preview-action">
                        <text>预览</text>
                        <wd-icon name="arrow-right" size="16px" />
                    </view>
                </view>
                <view class="document-list-note">文档为演示内容，现场操作以项目要求为准</view>
            </scroll-view>

            <scroll-view v-else scroll-y class="document-preview" :scroll-top="previewScrollTop" @scroll="handlePreviewScroll">
                <view class="preview-document-meta">{{ selectedDocument.category }} · 更新于 {{ selectedDocument.updatedAt }}</view>
                <view v-for="section in selectedDocument.sections" :key="section.title" class="preview-section">
                    <text class="preview-section-title">{{ section.title }}</text>
                    <text class="preview-section-content">{{ section.content }}</text>
                    <view v-for="(step, index) in section.steps" :key="step" class="preview-step">
                        <text class="preview-step-number">{{ index + 1 }}</text>
                        <text class="preview-section-content">{{ step }}</text>
                    </view>
                </view>
            </scroll-view>
        </view>
    </wd-popup>
</template>

<style lang="scss" scoped>
.document-drawer {
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
    gap: 12rpx;
    min-height: 100rpx;
    padding: 16rpx 28rpx 20rpx;
    border-bottom: 1px solid #E6EDF7;
}
.drawer-heading {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8rpx;
    min-width: 0;
}
.drawer-title {
    font-size: 30rpx;
    font-weight: 600;
    line-height: 1.5;
}
.drawer-subtitle {
    color: #7A8AA5;
    font-size: 23rpx;
}
.drawer-back,
.minimize-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 64rpx;
    min-height: 44px;
}
.minimize-button {
    gap: 6rpx;
    color: #0055FE;
    font-size: 25rpx;
}
.document-list,
.document-preview {
    flex: 1;
    min-height: 0;
    padding: 24rpx;
    box-sizing: border-box;
}
.document-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 20rpx;
    padding: 24rpx;
    border-radius: 20rpx;
    background: #FFFFFF;
}
.document-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    background: #EDF4FF;
}
.document-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}
.document-category,
.preview-document-meta {
    color: #3974C6;
    font-size: 23rpx;
}
.document-title {
    margin-top: 10rpx;
    font-size: 28rpx;
    font-weight: 600;
    line-height: 1.5;
}
.document-description {
    margin-top: 10rpx;
    color: #68768D;
    font-size: 24rpx;
    line-height: 1.65;
}
.document-date {
    margin-top: 12rpx;
    color: #7A8AA5;
    font-size: 22rpx;
}
.document-preview-action {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 4rpx;
    min-height: 44px;
    color: #0055FE;
    font-size: 24rpx;
}
.document-list-note {
    padding: 12rpx 0 24rpx;
    color: #7A8AA5;
    font-size: 23rpx;
    text-align: center;
}
.preview-section {
    margin-bottom: 20rpx;
    padding: 28rpx;
    border-radius: 20rpx;
    background: #FFFFFF;
}
.preview-section-title {
    display: block;
    margin-bottom: 16rpx;
    font-size: 29rpx;
    font-weight: 600;
}
.preview-section-content {
    flex: 1;
    color: #5D6C85;
    font-size: 26rpx;
    line-height: 1.9;
}
.preview-step {
    display: flex;
    align-items: flex-start;
    gap: 14rpx;
    margin-top: 18rpx;
}
.preview-step-number {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36rpx;
    height: 36rpx;
    margin-top: 6rpx;
    border-radius: 50%;
    background: #EDF4FF;
    color: #0055FE;
    font-size: 22rpx;
}
</style>
