<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchDeviceIssues, type DeviceIssue } from '@/service/deviceIssues';

const { theme, themeVars } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const model = ref('PBox6140H');
const projectId = ref('');
const projectName = ref('');
const deviceSN = ref('');
const issues = ref<DeviceIssue[]>([]);
const loading = ref(true);
const loadError = ref('');
const expandedIssueId = ref('');
const selectedTags = ref<string[]>([]);
const availableTags = computed(() => [...new Set(issues.value.flatMap(issue => issue.tags))]);
const filteredIssues = computed(() => {
    if (!selectedTags.value.length) return issues.value;
    return issues.value.filter(issue => issue.tags.some(tag => selectedTags.value.includes(tag)));
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif
    // #ifndef H5
    uni.navigateBack();
    // #endif
}

async function loadIssues() {
    loading.value = true;
    loadError.value = '';
    try {
        issues.value = await fetchDeviceIssues(model.value);
    } catch (error) {
        console.error('获取同型号问题失败', error);
        issues.value = [];
        loadError.value = '问题案例加载失败，请重新加载';
    } finally {
        loading.value = false;
        uni.stopPullDownRefresh();
    }
}

function toggleTag(tag: string) {
    selectedTags.value = selectedTags.value.includes(tag)
        ? selectedTags.value.filter(item => item !== tag)
        : [...selectedTags.value, tag];
}

function clearTags() {
    selectedTags.value = [];
}

function toggleIssue(issueId: string) {
    expandedIssueId.value = expandedIssueId.value === issueId ? '' : issueId;
}

function createIssue() {
    uni.navigateTo({
        url: `/projectPages/deviceissues/Create?model=${encodeURIComponent(model.value)}&projectId=${encodeURIComponent(projectId.value)}&projectName=${encodeURIComponent(projectName.value)}&sn=${encodeURIComponent(deviceSN.value)}`,
        events: {
            deviceIssueCreated(issue: DeviceIssue) {
                issues.value = [issue, ...issues.value.filter(item => item.id !== issue.id)];
                expandedIssueId.value = issue.id;
            },
        },
    });
}

onLoad((options: Record<string, string>) => {
    if (options?.model) model.value = options.model;
    if (options?.projectId) projectId.value = options.projectId;
    if (options?.projectName) projectName.value = options.projectName;
    if (options?.sn) deviceSN.value = options.sn;
    loadIssues();
});

onPullDownRefresh(loadIssues);
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <view class="page-root" :class="{ dark: isDark }">
            <wd-navbar title="同型号问题" left-arrow safe-area-inset-top placeholder fixed :bordered="false"
                :custom-style="`background:${isDark ? '#0F1524' : '#F4F8FF'}; color:${isDark ? '#E8ECF8' : '#1F2A44'};`" @click-left="handleClickLeft" />

            <view class="issues-page">
                <view class="model-summary">
                    <view class="model-heading">
                        <view class="model-icon">
                            <wd-icon name="computer" size="28px" color="#0055FE" />
                        </view>
                        <view class="model-info">
                            <text class="model-label">设备型号</text>
                            <text class="model-name">{{ model }}</text>
                        </view>
                        <view class="create-issue-button" role="button" aria-label="新建同型号问题" @click="createIssue">
                            <wd-icon name="add" size="16px" />
                            <text>新建</text>
                        </view>
                    </view>
                    <text class="summary-description">查看该型号以往遇到的问题和现场处理办法，为当前调试提供参考。</text>
                    <view class="mock-notice">
                        <wd-icon name="info-circle" size="14px" />
                        <text>历史案例为模拟数据，新建问题仅保存在本机</text>
                    </view>
                </view>

                <view v-if="loading" class="state-card surface">
                    <wd-loading color="#0055FE" />
                    <text class="state-title">正在查询同型号问题</text>
                    <text class="state-description">正在整理 {{ model }} 的历史案例</text>
                </view>

                <view v-else-if="loadError" class="state-card surface" role="alert">
                    <wd-icon name="warning-outline" size="32px" color="#D46B08" />
                    <text class="state-title">暂时无法加载</text>
                    <text class="state-description">{{ loadError }}</text>
                    <wd-button size="small" @click="loadIssues">重新加载</wd-button>
                </view>

                <template v-else-if="issues.length">
                    <view class="filter-section">
                        <view class="filter-heading">
                            <text class="filter-title">按标签筛选</text>
                            <view v-if="selectedTags.length" class="clear-filter" role="button" @click="clearTags">
                                <text>清空{{ selectedTags.length }}项</text>
                                <wd-icon name="close" size="13px" />
                            </view>
                        </view>
                        <view class="filter-tags" role="group" aria-label="问题标签筛选">
                            <view v-for="tag in availableTags" :key="tag" class="filter-tag" :class="{ active: selectedTags.includes(tag) }"
                                role="button" :aria-pressed="selectedTags.includes(tag)" :aria-label="`筛选${tag}`" @click="toggleTag(tag)">
                                <text>#{{ tag }}</text>
                                <wd-icon v-if="selectedTags.includes(tag)" name="check" size="13px" />
                            </view>
                        </view>
                    </view>
                    <view class="list-heading">
                        <text class="section-title">问题与解决办法</text>
                        <text class="resolved-count">匹配 {{ filteredIssues.length }} 个案例</text>
                    </view>
                    <view v-if="filteredIssues.length" class="issue-list">
                        <view v-for="issue in filteredIssues" :key="issue.id" class="issue-card surface">
                            <view class="issue-header" role="button" :aria-expanded="expandedIssueId === issue.id" @click="toggleIssue(issue.id)">
                                <view class="issue-title-group">
                                    <view class="issue-tags">
                                        <text v-for="tag in issue.tags" :key="tag" class="issue-tag">#{{ tag }}</text>
                                    </view>
                                    <text class="issue-title">{{ issue.title }}</text>
                                    <view class="issue-meta">
                                        <text class="resolved-badge" :class="{ pending: issue.status === 'pending' }">{{ issue.status === 'pending' ? '待解决' : '已解决' }}</text>
                                        <text v-if="issue.status === 'pending'">{{ issue.projectName || '当前项目' }}</text>
                                        <text v-else>处理于 {{ issue.resolvedAt }}</text>
                                    </view>
                                </view>
                                <view class="expand-button">
                                    <text>{{ expandedIssueId === issue.id ? '收起' : '查看详情' }}</text>
                                    <wd-icon :name="expandedIssueId === issue.id ? 'arrow-up' : 'arrow-down'" size="16px" />
                                </view>
                            </view>
                            <view v-if="expandedIssueId === issue.id" class="issue-detail">
                                <view class="detail-section">
                                    <text class="detail-label">问题现象</text>
                                    <text class="detail-text">{{ issue.symptoms }}</text>
                                </view>
                                <view v-if="issue.investigation || issue.cause" class="detail-section">
                                    <text class="detail-label">排查过程</text>
                                    <text class="detail-text">{{ issue.investigation || issue.cause }}</text>
                                </view>
                                <view v-if="issue.solution" class="solution-section">
                                    <text class="detail-label">解决办法</text>
                                    <text class="detail-text solution-text">{{ issue.solution }}</text>
                                </view>
                                <view v-else-if="issue.solutions?.length" class="solution-section">
                                    <text class="detail-label">解决办法</text>
                                    <view v-for="(step, index) in issue.solutions" :key="step" class="solution-step">
                                        <text class="step-number">{{ index + 1 }}</text>
                                        <text class="detail-text">{{ step }}</text>
                                    </view>
                                </view>
                                <view v-if="issue.resolution" class="resolution-note">
                                    <wd-icon name="check-circle" size="16px" color="#16875A" />
                                    <text>{{ issue.resolution }}</text>
                                </view>
                            </view>
                        </view>
                    </view>
                    <view v-else class="filter-empty">
                        <text>暂无符合所选标签的案例</text>
                        <text class="clear-filter-link" role="button" @click="clearTags">清空筛选，查看全部</text>
                    </view>
                    <view class="reference-note">
                        <wd-icon name="help-circle" size="15px" />
                        <text>现场处理前请核对实际配置和项目要求</text>
                    </view>
                </template>

                <view v-else class="state-card surface">
                    <view class="empty-icon">
                        <wd-icon name="search" size="30px" color="#7A8AA5" />
                    </view>
                    <text class="state-title">暂无同型号问题</text>
                    <text class="state-description">还没有收录 {{ model }} 的历史案例</text>
                </view>
            </view>
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
.issues-page {
    padding: 0 24rpx calc(40rpx + env(safe-area-inset-bottom));
}
.surface {
    background: #FFFFFF;
}
.dark .surface {
    background: #171F31;
}
.model-summary {
    padding: 24rpx 4rpx 26rpx;
}
.model-heading {
    display: flex;
    align-items: center;
    gap: 20rpx;
}
.model-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    background: #E5EFFF;
}
.dark .model-icon {
    background: #24334D;
}
.model-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8rpx;
    min-width: 0;
}
.model-label {
    color: #7A8AA5;
    font-size: 24rpx;
}
.model-name {
    font-size: 36rpx;
    font-weight: 600;
    overflow-wrap: anywhere;
}
.create-issue-button {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    min-width: 116rpx;
    min-height: 64rpx;
    padding: 0 18rpx;
    border: 1px solid #0055FE;
    border-radius: 16rpx;
    background: #0055FE;
    color: #FFFFFF;
    font-size: 26rpx;
}
.dark .create-issue-button {
    border-color: #3974C6;
    background: #3974C6;
}
.summary-description {
    display: block;
    margin-top: 22rpx;
    color: #5D6C85;
    font-size: 26rpx;
    line-height: 1.8;
}
.dark .summary-description {
    color: #B1BCD0;
}
.mock-notice {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 18rpx;
    color: #7A8AA5;
    font-size: 23rpx;
}
.dark .mock-notice,
.dark .model-label,
.dark .resolved-count,
.dark .reference-note {
    color: #A0ACC0;
}
.filter-section {
    margin: 0 0 24rpx;
}
.filter-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    margin: 0 4rpx 12rpx;
}
.filter-title {
    color: #5D6C85;
    font-size: 25rpx;
}
.dark .filter-title {
    color: #B1BCD0;
}
.clear-filter {
    display: flex;
    align-items: center;
    gap: 6rpx;
    min-height: 44px;
    color: #0055FE;
    font-size: 24rpx;
}
.dark .clear-filter {
    color: #80B4FF;
}
.filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
}
.filter-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    min-height: 48rpx;
    padding: 0 14rpx;
    border: 1px solid #D8E2F0;
    border-radius: 10rpx;
    background: #FFFFFF;
    color: #5D6C85;
    font-size: 22rpx;
}
.filter-tag.active {
    border-color: #0055FE;
    background: #EAF2FF;
    color: #0055FE;
    font-weight: 500;
}
.dark .filter-tag {
    border-color: #344056;
    background: #171F31;
    color: #B1BCD0;
}
.dark .filter-tag.active {
    border-color: #80B4FF;
    background: #24334D;
    color: #80B4FF;
}
.filter-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    padding: 56rpx 24rpx;
    color: #7A8AA5;
    font-size: 26rpx;
}
.clear-filter-link {
    min-height: 44px;
    color: #0055FE;
    line-height: 44px;
}
.dark .clear-filter-link {
    color: #80B4FF;
}
.list-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin: 4rpx 4rpx 20rpx;
}
.section-title {
    font-size: 30rpx;
    font-weight: 600;
}
.resolved-count {
    color: #7A8AA5;
    font-size: 23rpx;
}
.issue-card {
    margin-bottom: 20rpx;
    border-radius: 24rpx;
    box-shadow: 0 5rpx 20rpx rgba(35, 69, 119, 0.035);
    overflow: hidden;
}
.issue-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    min-height: 88rpx;
    padding: 28rpx;
}
.issue-title-group {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}
.issue-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6rpx 12rpx;
}
.issue-tag {
    color: #3974C6;
    font-size: 22rpx;
    line-height: 1.5;
}
.dark .issue-tag {
    color: #80B4FF;
}
.issue-title {
    margin-top: 12rpx;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 1.6;
}
.issue-meta {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 18rpx;
    color: #7A8AA5;
    font-size: 23rpx;
}
.resolved-badge {
    padding: 3rpx 10rpx;
    border-radius: 8rpx;
    background: #E6F5ED;
    color: #16875A;
}
.dark .resolved-badge {
    background: #1E3B31;
    color: #6BCB9B;
}
.resolved-badge.pending {
    background: #FFF3E2;
    color: #A56913;
}
.dark .resolved-badge.pending {
    background: #3C3224;
    color: #E9BB74;
}
.solution-text {
    display: block;
    margin-top: 16rpx;
    white-space: pre-wrap;
}
.expand-button {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 6rpx;
    min-height: 44px;
    color: #0055FE;
    font-size: 24rpx;
    white-space: nowrap;
}
.dark .expand-button {
    color: #80B4FF;
}
.issue-detail {
    margin: 0 28rpx;
    padding: 4rpx 0 28rpx;
    border-top: 1px solid #EDF1F7;
}
.dark .issue-detail {
    border-top-color: #2A3548;
}
.detail-section,
.solution-section {
    margin-top: 24rpx;
}
.detail-label {
    display: block;
    margin-bottom: 12rpx;
    font-size: 26rpx;
    font-weight: 600;
}
.detail-text {
    flex: 1;
    color: #5D6C85;
    font-size: 26rpx;
    line-height: 1.8;
}
.dark .detail-text {
    color: #B1BCD0;
}
.solution-step {
    display: flex;
    align-items: flex-start;
    gap: 14rpx;
    margin-top: 16rpx;
}
.step-number {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36rpx;
    height: 36rpx;
    margin-top: 4rpx;
    border-radius: 50%;
    background: #EDF4FF;
    color: #0055FE;
    font-size: 22rpx;
}
.dark .step-number {
    background: #24334D;
    color: #80B4FF;
}
.resolution-note {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-top: 26rpx;
    padding: 20rpx;
    border-radius: 16rpx;
    background: #F0F8F3;
    color: #286849;
    font-size: 25rpx;
    line-height: 1.7;
}
.dark .resolution-note {
    background: #1E302A;
    color: #A6D9BD;
}
.state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    min-height: 300rpx;
    padding: 40rpx;
    border-radius: 24rpx;
    text-align: center;
}
.state-title {
    font-size: 28rpx;
    font-weight: 500;
}
.state-description {
    color: #7A8AA5;
    font-size: 25rpx;
    line-height: 1.7;
}
.empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 84rpx;
    height: 84rpx;
    border-radius: 50%;
    background: #F0F2F6;
}
.dark .empty-icon {
    background: #293447;
}
.reference-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 10rpx 0;
    color: #7A8AA5;
    font-size: 23rpx;
}
@media screen and (max-width: 340px) {
    .issue-header {
        gap: 12rpx;
        padding: 24rpx;
    }
    .issue-detail {
        margin: 0 24rpx;
    }
    .expand-button {
        font-size: 22rpx;
    }
}
</style>
