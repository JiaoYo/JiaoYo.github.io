<template>
    <wd-popup :z-index="99" closable :close-on-click-modal="false" :modelValue="modelValue" custom-style="width: 92%; border-radius: 32rpx; padding: 20rpx; max-height: 80vh; overflow-y: auto;" @update:modelValue="handleVisibleChange">
        <view style="margin-bottom: 20rpx;">
            <wd-text text="工期变更记录" bold :color="dark ? '#ffffff' : '#000000'"></wd-text>
        </view>

        <view v-if="loading" style="display: flex; justify-content: center; align-items: center; padding: 60rpx 0;">
            <wd-loading size="36px"></wd-loading>
        </view>

        <view v-else-if="records.length === 0" style="padding: 60rpx 0;">
            <wd-status-tip image="../static/search.png" tip="暂无变更记录" />
        </view>

        <!-- 时间线：最新在前 -->
        <view v-else class="sc-timeline" :class="dark ? 'dark' : ''">
            <view v-for="(r, i) in records" :key="r.key" class="sc-item">
                <view class="sc-dot-col">
                    <view class="sc-dot" :style="{ background: i === 0 ? '#1677ff' : '#d9d9d9' }"></view>
                    <view v-if="i !== records.length - 1" class="sc-line"></view>
                </view>
                <view class="sc-body">
                    <view class="sc-date-row">
                        <text class="sc-old" :class="dark ? 'dark-sub' : ''">{{ r.oldEnd ?? '-' }}</text>
                        <text class="sc-arrow" :class="dark ? 'dark-sub' : ''">→</text>
                        <text class="sc-new">{{ r.newEnd ?? '-' }}</text>
                        <view class="sc-source-tag">{{ r.sourceText }}</view>
                    </view>
                    <view class="sc-period-row" :class="dark ? 'dark-sub' : ''">
                        <text>周期：{{ r.oldPeriod ?? '-' }} 天 → {{ r.newPeriod ?? '-' }} 天</text>
                        <text v-if="r.periodDelta !== null && r.periodDelta !== 0" :style="{ color: r.periodDelta > 0 ? '#d03050' : '#18a058', fontSize: '22rpx' }">（{{ r.periodDelta > 0 ? '延长' : '缩短' }} {{ Math.abs(r.periodDelta) }} 天）</text>
                    </view>
                    <view class="sc-meta-row" :class="dark ? 'dark-sub' : ''">
                        <text>操作人：{{ r.operator }}</text>
                        <text>｜操作时间：{{ r.changedAt }}</text>
                    </view>
                </view>
            </view>
        </view>
    </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { fetchGetScheduleChanges } from '@/service/prj';
import { fetchGetAllUserDataList } from '@/service/member';

/**
 * 工期变更记录弹窗（项目列表/详情共用）
 * GET /projectInfo/getScheduleChanges.do 按最新在前返回变更记录：
 * { id, pid, oldEndDate, newEndDate, oldPeriod, newPeriod, source, operatorId, changedAt }
 */
const props = defineProps<{
    modelValue: boolean;
    /** 项目 ID */
    id?: number | string;
    /** 暗色主题 */
    dark?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

function handleVisibleChange(val: boolean) {
    emit('update:modelValue', val);
}

// 操作人只回 ID，用全量用户字典映射姓名（组件内自建映射，避免跨模块耦合）
const userNameMap = ref<Record<string, string>>({});
let userMapLoaded = false;
async function loadUserNameMap() {
    if (userMapLoaded) return;
    userMapLoaded = true;
    try {
        const data: any = await fetchGetAllUserDataList({ page: 1, limit: 100 ,usertypes:'0,1,2,3,4,5,6,8,9,11,12'});
        const map: Record<string, string> = {};
        (data?.list ?? []).forEach((u: any) => {
            map[String(u.id)] = u.username;
        });
        userNameMap.value = map;
    } catch (err) {
        console.error('获取用户字典失败', err);
        userMapLoaded = false;
    }
}

/** 来源中文标签：PROJECT_LEAD 负责人改期；联络单写入等后续来源做候选映射，未知编码显示原文 */
const sourceTextMap: Record<string, string> = {
    PROJECT_LEAD: '负责人改期',
    OWNER: '负责人改期',
    OWNER_RESCHEDULE: '负责人改期',
    MANUAL: '负责人改期',
    UPDATE_PLANNED_END: '负责人改期',
    PROJECT_FORM: '联络单',
    CONTACT_FORM: '联络单',
    CONTACT: '联络单',
    LIAISON: '联络单',
    IMPORT: '历史导入',
    INIT: '初始设定'
};
function sourceText(raw: any) {
    return raw === null || raw === undefined || raw === '' ? '-' : sourceTextMap[String(raw)] || String(raw);
}

const loading = ref(false);
const rawList = ref<any[]>([]);

const records = computed(() =>
    rawList.value.map((r: any, i: number) => {
        const oldEnd = r.oldEndDate ?? r.oldCpdbtime ?? r.beforeDate ?? null;
        const newEnd = r.newEndDate ?? r.newCpdbtime ?? r.cpdbtime ?? r.afterDate ?? null;
        const oldPeriod = r.oldPeriod ?? r.beforePeriod ?? null;
        const newPeriod = r.newPeriod ?? r.afterPeriod ?? r.period ?? null;
        const periodDelta =
            oldPeriod !== null && oldPeriod !== undefined && newPeriod !== null && newPeriod !== undefined
                ? Number(newPeriod) - Number(oldPeriod)
                : null;
        return {
            key: r.id ?? i,
            oldEnd,
            newEnd,
            oldPeriod,
            newPeriod,
            periodDelta,
            sourceText: sourceText(r.source ?? r.sourceType),
            operator:
                r.operatorId !== null && r.operatorId !== undefined && r.operatorId !== ''
                    ? userNameMap.value[String(r.operatorId)] || `用户#${r.operatorId}`
                    : r.operatorName ?? r.operator ?? '-',
            changedAt: r.changedAt ?? r.updateTime ?? r.createTime ?? '-'
        };
    })
);

async function load() {
    if (!props.id) return;
    const g = gen;
    loading.value = true;
    rawList.value = [];
    try {
        const data: any = await fetchGetScheduleChanges({ id: Number(props.id) });
        if (g !== gen) return;
        rawList.value = Array.isArray(data) ? data : [];
    } catch (err) {
        if (g !== gen) return;
        console.error('获取工期变更记录失败', err);
    } finally {
        if (g === gen) loading.value = false;
    }
}

/** 代际计数：弹窗每次开/关自增，弱网下快速切换项目时旧响应不再应用（防跨项目数据串扰） */
let gen = 0;

watch(
    () => props.modelValue,
    (open) => {
        gen += 1;
        if (open) {
            load();
            loadUserNameMap();
        }
    },
    { immediate: true }
);
</script>

<style lang="scss" scoped>
.sc-timeline {
    padding: 10rpx 6rpx 20rpx;
}

.sc-item {
    display: flex;
}

.sc-dot-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 30rpx;
    flex-shrink: 0;
}

.sc-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    margin-top: 10rpx;
    flex-shrink: 0;
}

.sc-line {
    width: 2rpx;
    flex: 1;
    background: #f0f0f0;
    margin: 6rpx 0;
}

.sc-body {
    flex: 1;
    min-width: 0;
    padding: 0 0 30rpx 16rpx;
}

.sc-item:last-child .sc-body {
    padding-bottom: 6rpx;
}

.sc-date-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10rpx;
    font-size: 28rpx;
    font-weight: 600;
}

.sc-old {
    color: #333;
}

.dark .sc-old {
    color: #e8e8e8;
}

.sc-arrow {
    color: #999;
}

.sc-new {
    color: #1677ff;
}

.sc-source-tag {
    padding: 2rpx 16rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    font-weight: 400;
    background: rgba(22, 119, 255, 0.08);
    color: #1677ff;
}

.sc-period-row {
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 36rpx;
    color: #444;
    display: flex;
    flex-wrap: wrap;
    gap: 4rpx;
}

.sc-meta-row {
    margin-top: 6rpx;
    font-size: 22rpx;
    color: #999;
}
</style>
