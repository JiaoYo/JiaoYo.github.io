<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow :title="isView ? '查看评价' : '评价'" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <scroll-view scroll-y class="page-scroll">
            <view class="page-inner">
                <!-- 被评价信息 -->
                <view class="meta-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <view class="meta-row">
                        <text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">被评价研发</text>
                        <text class="meta-value" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ form.rdUserName || '-' }}</text>
                    </view>
                    <view class="meta-row">
                        <text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">调查月份</text>
                        <text class="meta-value" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ monthText }}</text>
                    </view>
                </view>

                <!-- 五维打分 -->
                <view v-for="dim in DIMENSIONS" :key="dim.field" class="dim-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <view class="dim-card-head">
                        <text class="dim-card-label" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ dim.label }}</text>
                        <view class="star-row">
                            <text v-for="n in 5" :key="n" class="star" :style="{ color: n <= form[dim.field] ? '#f7b500' : (isDark ? '#444' : '#dcdfe6') }" @click="!isView && (form[dim.field] = n)">★</text>
                            <text class="star-num" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ form[dim.field] }}分</text>
                        </view>
                    </view>
                    <view class="dim-card-desc" :style="{ color: isDark ? '#6a6a6a' : '#999' }">{{ dim.desc }}</view>
                </view>

                <!-- 反馈 -->
                <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                    <text class="form-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">反馈（可空，最多500字）</text>
                    <wd-textarea v-model="form.feedback" placeholder="整体良好" :maxlength="500" :disabled="isView" />
                </view>

                <view v-if="!isView" class="submit-tip" :style="{ color: isDark ? '#6a6a6a' : '#999' }">默认各项均为5分，如无调整可直接提交；提交后计入考核汇总。</view>
                <view v-if="!isView" class="submit-wrap">
                    <wd-button type="primary" size="large" :loading="submitting" custom-style="width:100%" @click="submitScore">提交评价</wd-button>
                </view>
            </view>
        </scroll-view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchUpdateRdSatisfaction } from '@/service/rdSatisfaction';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh; background: #f5f6f8;';
    return 'min-height: 100vh; background: #1b1b1b;';
});

/** 五个评分维度，顺序与接口字段一致 */
const DIMENSIONS = [
    { field: 'responseSpeed', label: '响应速度', desc: '需求/问题响应是否及时，反馈速度是否满足预期' },
    { field: 'communicationEfficiency', label: '沟通效率', desc: '沟通是否顺畅高效，信息传递是否清晰准确' },
    { field: 'problemSolvingEfficiency', label: '问题解决效率', desc: '问题定位与解决的速度和效果，是否闭环' },
    { field: 'productUsability', label: '产品易用性', desc: '功能设计是否合理，操作是否便捷易上手' },
    { field: 'productStability', label: '产品稳定性', desc: '系统运行是否稳定，是否存在频繁异常或数据错误' }
];

const isView = ref(false);
const submitting = ref(false);
const form = ref<any>({ id: undefined, rdUserName: '', surveyMonth: undefined, responseSpeed: 5, communicationEfficiency: 5, problemSolvingEfficiency: 5, productUsability: 5, productStability: 5, feedback: '' });

const monthText = computed(() => {
    const m = form.value.surveyMonth;
    if (m === null || m === undefined || !String(m).match(/^\d{6}$/)) return m ? String(m) : '-';
    const s = String(m);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}`;
});

function onRow(payload: any) {
    const row = payload?.row;
    if (!row) return;
    isView.value = !!payload?.view;
    form.value = {
        id: row.id,
        rdUserName: row.rdUserName || '',
        surveyMonth: row.surveyMonth,
        responseSpeed: row.responseSpeed ?? 5,
        communicationEfficiency: row.communicationEfficiency ?? 5,
        problemSolvingEfficiency: row.problemSolvingEfficiency ?? 5,
        productUsability: row.productUsability ?? 5,
        productStability: row.productStability ?? 5,
        feedback: row.feedback || ''
    };
}

async function submitScore() {
    if (!form.value.id || submitting.value) return;
    submitting.value = true;
    try {
        await fetchUpdateRdSatisfaction({
            id: form.value.id,
            responseSpeed: form.value.responseSpeed,
            communicationEfficiency: form.value.communicationEfficiency,
            problemSolvingEfficiency: form.value.problemSolvingEfficiency,
            productUsability: form.value.productUsability,
            productStability: form.value.productStability,
            feedback: form.value.feedback
        });
        uni.showToast({ title: '提交成功', icon: 'success' });
        uni.$emit('rdSatisfaction_refresh');
        setTimeout(() => uni.navigateBack(), 400);
    } catch (err: any) {
        uni.showToast({ title: err?.msg || '提交失败', icon: 'none' });
    } finally {
        submitting.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }

onLoad(() => {
    uni.$on('rdSatisfaction_row', onRow);
});
onUnload(() => {
    uni.$off('rdSatisfaction_row', onRow);
});
</script>

<style lang="scss" scoped>
.page-scroll { height: calc(100vh - 88rpx); }
.page-inner { padding: 20rpx; }
.meta-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.meta-row { display: flex; justify-content: space-between; padding: 10rpx 0; }
.meta-label { font-size: 26rpx; }
.meta-value { font-size: 26rpx; font-weight: 500; }
.dim-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.dim-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.dim-card-label { font-size: 28rpx; font-weight: 500; }
.star-row { display: flex; align-items: center; gap: 6rpx; }
.star { font-size: 44rpx; line-height: 1; }
.star-num { font-size: 22rpx; margin-left: 10rpx; }
.dim-card-desc { font-size: 22rpx; line-height: 1.5; }
.form-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.form-label { display: block; font-size: 26rpx; margin-bottom: 12rpx; }
.submit-tip { font-size: 22rpx; line-height: 1.6; margin: 12rpx 0 24rpx; }
.submit-wrap { padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); }
</style>
