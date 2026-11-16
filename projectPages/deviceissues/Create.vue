<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { createDeviceIssue, DEVICE_ISSUE_TAGS } from '@/service/deviceIssues';

const { theme, themeVars } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const projectId = ref('');
const projectName = ref('');
const model = ref('');
const deviceSN = ref('');
const symptoms = ref('');
const investigation = ref('');
const solution = ref('');
const selectedTags = ref<string[]>([]);
const submitting = ref(false);
const symptomsError = ref('');
const tagsError = ref('');
const customTags = ref<string[]>([]);
const availableTags = computed(() => [...DEVICE_ISSUE_TAGS, ...customTags.value]);
const addingTag = ref(false);
const newTag = ref('');
const tagInputFocused = ref(false);

function startAddingTag() {
    addingTag.value = true;
    nextTick(() => {
        tagInputFocused.value = true;
    });
}

function confirmTag() {
    const tag = newTag.value.trim();
    if (!/^[\p{L}\p{N}]{2,6}$/u.test(tag)) {
        uni.showToast({ title: '标签需为2-6个字，不含空格和特殊符号', icon: 'none' });
        return;
    }
    if (availableTags.value.some(item => item.toLowerCase() === tag.toLowerCase())) {
        uni.showToast({ title: '该标签已存在', icon: 'none' });
        return;
    }
    customTags.value = [...customTags.value, tag];
    selectedTags.value = [...selectedTags.value, tag];
    newTag.value = '';
    addingTag.value = false;
    tagInputFocused.value = false;
    tagsError.value = '';
}

function cancelAddingTag() {
    newTag.value = '';
    addingTag.value = false;
    tagInputFocused.value = false;
}

function handleClickLeft() {
    uni.navigateBack();
}

function toggleTag(tag: string) {
    selectedTags.value = selectedTags.value.includes(tag)
        ? selectedTags.value.filter(item => item !== tag)
        : [...selectedTags.value, tag];
    tagsError.value = '';
}

async function submitIssue() {
    if (submitting.value) return;
    symptomsError.value = symptoms.value.trim() ? '' : '请填写问题现象';
    tagsError.value = selectedTags.value.length ? '' : '请至少选择一个问题标签';
    if (symptomsError.value || tagsError.value) {
        uni.showToast({ title: symptomsError.value || tagsError.value, icon: 'none' });
        return;
    }
    submitting.value = true;
    try {
        const issue = createDeviceIssue({
            projectId: projectId.value,
            projectName: projectName.value,
            model: model.value,
            symptoms: symptoms.value,
            investigation: investigation.value,
            solution: solution.value,
            tags: selectedTags.value,
        });
        const eventChannel = getCurrentPages().at(-1)?.getOpenerEventChannel?.();
        eventChannel?.emit?.('deviceIssueCreated', issue);
        uni.showToast({ title: '问题已保存', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 500);
    } catch (error) {
        console.error('新建同型号问题失败', error);
        uni.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
        submitting.value = false;
    }
}

function readOption(options: Record<string, string>, key: string) {
    const value = options?.[key] || '';
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

onLoad((options: Record<string, string>) => {
    projectId.value = readOption(options, 'projectId');
    projectName.value = readOption(options, 'projectName');
    model.value = readOption(options, 'model');
    deviceSN.value = readOption(options, 'sn');
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <view class="page-root" :class="{ dark: isDark }">
            <wd-navbar title="新建问题" left-arrow safe-area-inset-top placeholder fixed :bordered="false"
                :custom-style="`background:${isDark ? '#0F1524' : '#F4F8FF'}; color:${isDark ? '#E8ECF8' : '#1F2A44'};`" @click-left="handleClickLeft" />
            <scroll-view scroll-y class="form-scroll">
                <view class="form-page">
                    <view class="context-card surface">
                        <view class="context-heading">
                            <wd-icon name="link" size="18px" color="#0055FE" />
                            <text>关联设备信息</text>
                        </view>
                        <view class="context-row">
                            <text class="context-label">当前项目</text>
                            <text class="context-value" :class="{ empty: !projectName }">{{ projectName || '未关联项目' }}</text>
                        </view>
                        <view class="context-row">
                            <text class="context-label">设备型号</text>
                            <text class="context-value model-value">{{ model }}</text>
                        </view>
                        <view class="context-row">
                            <text class="context-label">设备 SN</text>
                            <text class="context-value" :class="{ empty: !deviceSN }">{{ deviceSN || '未关联设备' }}</text>
                        </view>
                    </view>

                    <view class="form-card surface">
                        <view class="field">
                            <view class="field-label"><text class="required-mark">*</text><text>问题现象</text></view>
                            <wd-textarea v-model="symptoms" placeholder="请描述设备出现的异常现象、发生条件及影响" :maxlength="1000"
                                auto-height clearable show-word-limit custom-style="padding:0;background:transparent;"
                                custom-textarea-container-class="issue-textarea-container" @input="symptomsError = ''" />
                            <text v-if="symptomsError" class="field-error" role="alert">{{ symptomsError }}</text>
                        </view>

                        <view class="field">
                            <view class="field-label"><text>排查过程</text><text class="optional-label">选填</text></view>
                            <wd-textarea v-model="investigation" placeholder="记录已检查的配置、日志、连接情况及排查结果" :maxlength="2000"
                                auto-height clearable show-word-limit custom-style="padding:0;background:transparent;"
                                custom-textarea-container-class="issue-textarea-container" />
                        </view>

                        <view class="field">
                            <view class="field-label"><text>解决办法</text><text class="optional-label">选填</text></view>
                            <wd-textarea v-model="solution" placeholder="记录处理步骤和恢复结果，尚未解决可暂不填写" :maxlength="2000"
                                auto-height clearable show-word-limit custom-style="padding:0;background:transparent;"
                                custom-textarea-container-class="issue-textarea-container" />
                        </view>

                        <view class="field tag-field">
                            <view class="field-label"><text class="required-mark">*</text><text>问题标签</text></view>
                            <view class="tag-options" role="group" aria-label="选择问题标签">
                                <view v-for="tag in availableTags" :key="tag" class="tag-option" :class="{ selected: selectedTags.includes(tag) }"
                                    role="checkbox" :aria-checked="selectedTags.includes(tag)" @click="toggleTag(tag)">
                                    <text>{{ tag }}</text>
                                </view>
                                <view v-if="addingTag" class="new-tag-editor">
                                    <input v-model="newTag" class="new-tag-input" :focus="tagInputFocused" :maxlength="6"
                                        placeholder="2-6字" confirm-type="done" @confirm="confirmTag" />
                                    <view class="tag-editor-action" role="button" aria-label="确认新增标签" @click="confirmTag">
                                        <wd-icon name="check" size="17px" color="#0055FE" />
                                    </view>
                                    <view class="tag-editor-action" role="button" aria-label="取消新增标签" @click="cancelAddingTag">
                                        <wd-icon name="close" size="17px" />
                                    </view>
                                </view>
                                <view v-else class="tag-option add-tag-button" role="button" aria-label="新增问题标签" @click="startAddingTag">
                                    <wd-icon name="add" size="16px" />
                                </view>
                            </view>
                            <text v-if="tagsError" class="field-error" role="alert">{{ tagsError }}</text>
                        </view>
                    </view>
                    <text class="form-note">问题将归入 {{ model }} 的同型号问题列表</text>
                </view>
            </scroll-view>
            <view class="submit-bar surface">
                <wd-button block :loading="submitting" custom-style="background:#0055FE;border-color:#0055FE;" @click="submitIssue">保存问题</wd-button>
            </view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.page-root {
    display: flex;
    flex-direction: column;
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
.form-scroll {
    flex: 1;
    min-height: 0;
}
.form-page {
    padding: 24rpx 24rpx 40rpx;
}
.context-card,
.form-card {
    border-radius: 24rpx;
    box-shadow: 0 5rpx 20rpx rgba(35, 69, 119, 0.035);
}
.context-card {
    padding: 24rpx 28rpx;
}
.context-heading {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 16rpx;
    font-size: 27rpx;
    font-weight: 600;
}
.context-row {
    display: flex;
    align-items: flex-start;
    gap: 24rpx;
    padding: 10rpx 0;
    font-size: 26rpx;
    line-height: 1.6;
}
.context-label {
    flex-shrink: 0;
    width: 112rpx;
    color: #7A8AA5;
}
.context-value {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
}
.model-value {
    font-weight: 600;
}
.context-value.empty {
    color: #7A8AA5;
}
.form-card {
    margin-top: 24rpx;
    padding: 28rpx;
}
.field + .field {
    margin-top: 32rpx;
    padding-top: 32rpx;
    border-top: 1px solid #EDF1F7;
}
.dark .field + .field {
    border-top-color: #2A3548;
}
.field-label {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 18rpx;
    font-size: 28rpx;
    font-weight: 600;
}
.required-mark {
    color: #D93025;
}
.optional-label {
    margin-left: 6rpx;
    color: #7A8AA5;
    font-size: 23rpx;
    font-weight: 400;
}
:deep(.issue-textarea-container) {
    min-height: 144rpx;
    padding: 20rpx;
    border: 1px solid #D8E2F0;
    border-radius: 16rpx;
    background: #F8FAFD;
}
.dark :deep(.issue-textarea-container) {
    border-color: #344056;
    background: #111A2A;
}
.field-error {
    display: block;
    margin-top: 12rpx;
    color: #D93025;
    font-size: 24rpx;
}
.tag-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}
.tag-option {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    min-height: 64rpx;
    padding: 0 22rpx;
    border: 1px solid #D8E2F0;
    border-radius: 14rpx;
    color: #5D6C85;
    font-size: 25rpx;
}
.tag-option.selected {
    border-color: #0055FE;
    background: #EAF2FF;
    color: #0055FE;
}
.dark .tag-option {
    border-color: #344056;
    color: #B1BCD0;
}
.dark .tag-option.selected {
    border-color: #80B4FF;
    background: #24334D;
    color: #80B4FF;
}
.add-tag-button {
    width: 64rpx;
    padding: 0;
    border-style: dashed;
    color: #0055FE;
}
.new-tag-editor {
    display: flex;
    align-items: center;
    gap: 6rpx;
    min-height: 64rpx;
    padding: 0 12rpx;
    border: 1px solid #0055FE;
    border-radius: 14rpx;
    background: #FFFFFF;
}
.dark .new-tag-editor {
    background: #171F31;
}
.new-tag-input {
    width: 144rpx;
    height: 60rpx;
    color: inherit;
    font-size: 25rpx;
}
.tag-editor-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48rpx;
    height: 60rpx;
}
.form-note {
    display: block;
    padding: 24rpx 4rpx;
    color: #7A8AA5;
    font-size: 23rpx;
    line-height: 1.6;
}
.submit-bar {
    flex-shrink: 0;
    padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
    box-shadow: 0 -4rpx 20rpx rgba(35, 69, 119, 0.04);
}
</style>
