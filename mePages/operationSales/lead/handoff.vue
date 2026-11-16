<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-navbar left-arrow title="发起交接" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />

        <view style="padding: 20rpx;">
            <!-- 规则提示（对齐 web NAlert） -->
            <view class="rule-tip" :style="{ background: isDark ? 'rgba(22, 119, 255, 0.12)' : '#e6f4ff', color: isDark ? '#69b1ff' : '#1677ff' }">
                只有当前负责人可发起交接；同一线索同一时间只能存在一条待处理交接，不能交接给自己，接收人必须是有效销售。发起后等待对方接收。
            </view>

            <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <!-- 线索（只读展示） -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">线索</view>
                <view class="lead-name" :style="{ background: isDark ? '#1b1b1b' : '#f5f5f5', color: isDark ? '#8a9099' : '#666' }">{{ leadName || ('#' + leadId) }}</view>

                <!-- 接收销售（必选，原生 picker） -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">接收销售（必选）</view>
                <picker mode="selector" :range="salesOptions" range-key="username" @change="handleReceiverPick">
                    <view class="picker-value" :style="{ background: isDark ? '#1b1b1b' : '#f5f5f5', color: model.receiverUserId ? (isDark ? '#e8e8e8' : '#333') : '#bbb' }">
                        {{ receiverName || '请选择有效销售' }}
                    </view>
                </picker>

                <!-- 交接说明（选填） -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">交接说明（选填）</view>
                <textarea class="op-textarea" v-model="model.remark" maxlength="500" placeholder="选填，如按区域转交" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" :style="{ background: isDark ? '#1b1b1b' : 'rgba(128, 128, 128, 0.08)', color: isDark ? '#e8e8e8' : '#333' }" />
            </view>

            <wd-button block type="warning" custom-style="margin-top: 30rpx;" :disabled="submitting" @click="submit">确认发起</wd-button>
            <view style="height: 40rpx;"></view>
        </view>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchHandoffCreate } from "@/service/operationSales";
import { fetchActiveUsers } from "../user-map";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

const leadId = ref<number | ''>('');
const leadName = ref('');
const submitting = ref(false);
const model = ref<any>({ receiverUserId: null, remark: '' });
const salesOptions = ref<any[]>([]);

const receiverName = computed(() => salesOptions.value.find((u: any) => String(u.id) === String(model.value.receiverUserId))?.username || '');

async function loadSales() {
    try {
        salesOptions.value = await fetchActiveUsers('1');
    } catch (err) {
        console.error('获取销售列表失败', err);
    }
}

// 原生 picker：e.detail.value 为选中项下标
function handleReceiverPick(e: any) {
    const u = salesOptions.value[Number(e.detail.value)];
    if (u) model.value.receiverUserId = u.id;
}

async function submit() {
    if (!model.value.receiverUserId) {
        uni.showToast({ title: '请选择接收的销售', icon: 'none' });
        return;
    }
    if (String(model.value.receiverUserId) === String(uni.getStorageSync('userId'))) {
        uni.showToast({ title: '不能交接给自己', icon: 'none' });
        return;
    }
    if (submitting.value) return;
    submitting.value = true;
    try {
        await fetchHandoffCreate({ leadId: leadId.value as number, receiverUserId: model.value.receiverUserId, remark: model.value.remark.trim() || undefined });
        uni.showToast({ title: '交接已发起，等待对方接收', icon: 'none' });
        uni.$emit('refreshOpLeadList');
        setTimeout(() => uni.navigateBack(), 600);
    } finally {
        submitting.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }
onLoad((options: any) => {
    leadId.value = options?.id ? Number(options.id) : '';
    leadName.value = options?.name ? decodeURIComponent(options.name) : '';
});
onMounted(() => { loadSales(); });
</script>
<style lang="scss" scoped>
.rule-tip {
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 24rpx;
    line-height: 36rpx;
    margin-bottom: 20rpx;
}

.form-card {
    border-radius: 20rpx;
    padding: 24rpx;
}

.form-label {
    font-size: 25rpx;
    margin: 8rpx 0 10rpx;
}

.lead-name {
    border-radius: 12rpx;
    padding: 18rpx 20rpx;
    font-size: 26rpx;
    margin-bottom: 20rpx;
}

.picker-value {
    padding: 18rpx 20rpx;
    border-radius: 12rpx;
    background: #f5f5f5;
    font-size: 26rpx;
    margin-bottom: 20rpx;
}

.op-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 160rpx;
    background: rgba(128, 128, 128, 0.08);
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 26rpx;
}

:deep(.whiteClass) {
    color: #6a6a6a;
}

:deep(.greyClass) {
    color: #c0c4cc;
}
</style>
