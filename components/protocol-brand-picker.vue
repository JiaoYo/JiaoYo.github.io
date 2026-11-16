<template>
    <wd-popup closable v-model="show" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="close">
        <view class="pbp-wrap" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
            <view class="pbp-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">选择逆变器品牌</view>
            <view class="pbp-search" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                <wd-icon name="search" size="16px" :color="isDark ? '#8a9099' : '#969799'" />
                <input class="pbp-search-core" v-model="keyword" type="text" placeholder="搜索品牌名称" placeholder-class="pbp-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="50" confirm-type="search" @input="handleInput" @confirm="handleSearch" />
                <wd-icon v-if="keyword" name="close-circle" size="18px" :color="isDark ? '#8a9099' : '#969799'" @click="handleClear" />
            </view>
            <scroll-view scroll-y class="pbp-list" @scrolltolower="loadMore">
                <view v-if="allowAll" class="pbp-row" @click="pick(null, '全部品牌')">
                    <text class="pbp-row-text" :style="{ color: selectedId === null ? (isDark ? '#69b1ff' : '#1677ff') : (isDark ? '#c9cdd4' : '#1a1a1a'), fontWeight: selectedId === null ? 600 : 400 }">全部品牌</text>
                    <wd-icon v-if="selectedId === null" name="check-circle-filled" size="18px" :color="isDark ? '#69b1ff' : '#1677ff'" />
                </view>
                <view v-for="row in list" :key="row.id" class="pbp-row" @click="pick(row.id, row.brandName)">
                    <text class="pbp-row-text" :style="{ color: isSelected(row.id) ? (isDark ? '#69b1ff' : '#1677ff') : (isDark ? '#c9cdd4' : '#1a1a1a'), fontWeight: isSelected(row.id) ? 600 : 400 }">{{ row.brandName }}</text>
                    <wd-icon v-if="isSelected(row.id)" name="check-circle-filled" size="18px" :color="isDark ? '#69b1ff' : '#1677ff'" />
                </view>
                <wd-loadmore :state="state" @reload="loadMore" />
                <view v-if="list.length === 0 && state === 'finished'" class="pbp-empty" :style="{ color: isDark ? '#8a9099' : '#969799' }">暂无匹配品牌</view>
                <view style="height: 20rpx;"></view>
            </scroll-view>
        </view>
    </wd-popup>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { fetchProtocolConverterBrandPage } from '@/service/protocolConverter';

/**
 * 逆变器品牌选择弹层：关键字搜索（300ms 防抖）+ 服务端分页 + 触底加载下一页（同 web form-search 下拉口径，仅启用品牌）
 */
const props = defineProps<{
    modelValue: boolean;
    selectedId: number | null;
    /** 允许选「全部品牌」（筛选用）；表单场景不传则只有具体品牌 */
    allowAll?: boolean;
}>();
const emit = defineEmits(['update:modelValue', 'confirm']);

const isDark = computed(() => uni.getStorageSync('isDark') == 1);
const show = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
});

const PAGE_SIZE = 20;
const keyword = ref('');
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('finished');
let loading = false;
let searchTimer: ReturnType<typeof setTimeout> | null = null;

function isSelected(id: number) {
    return props.selectedId !== null && Number(props.selectedId) === Number(id);
}

async function fetchPage() {
    if (loading) return;
    loading = true;
    try {
        if (page.value === 1) list.value = [];
        const params: any = { page: page.value, limit: PAGE_SIZE, status: 1, _t: new Date().getTime() };
        if (keyword.value.trim()) params.brandName = keyword.value.trim();
        const data: any = await fetchProtocolConverterBrandPage(params);
        const rows = Array.isArray(data) ? data : (data?.list || []);
        list.value = list.value.concat(rows);
        total.value = Number(data?.total ?? rows.length);
        state.value = list.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) {
        console.error('获取品牌分页失败', err);
        state.value = 'error';
    } finally {
        loading = false;
    }
}

/** 打开时重置到第一页全量（品牌可能刚维护过，每次进弹层都拉新） */
watch(() => props.modelValue, (v) => {
    if (v) {
        keyword.value = '';
        page.value = 1;
        state.value = 'finished';
        fetchPage();
    }
});

function handleSearch() {
    if (searchTimer) clearTimeout(searchTimer);
    page.value = 1;
    state.value = 'finished';
    fetchPage();
}
/** 输入防抖 300ms 后搜索（同 web 下拉内搜索） */
function handleInput() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        searchTimer = null;
        handleSearch();
    }, 300);
}
function handleClear() {
    if (searchTimer) clearTimeout(searchTimer);
    keyword.value = '';
    handleSearch();
}
function loadMore() {
    if (state.value !== 'loadmore' || loading) return;
    page.value += 1;
    fetchPage();
}
function pick(id: number | null, label: string) {
    emit('confirm', { id, label });
    close();
}
function close() {
    emit('update:modelValue', false);
}
</script>

<style lang="scss" scoped>
.pbp-wrap { padding: 30rpx 30rpx 0; border-radius: 24rpx 24rpx 0 0; display: flex; flex-direction: column; height: 60vh; }
.pbp-title { font-size: 32rpx; font-weight: 600; margin-bottom: 24rpx; }
.pbp-search { display: flex; align-items: center; gap: 12rpx; padding: 16rpx 18rpx; border-radius: 14rpx; margin-bottom: 16rpx; }
.pbp-search-core { flex: 1; min-width: 0; height: 40rpx; font-size: 26rpx; }
.pbp-grey { color: #bfbfbf; }
.pbp-list { flex: 1; min-height: 0; }
.pbp-row { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 24rpx 8rpx; border-bottom: 1rpx solid rgba(128, 128, 128, 0.12); }
.pbp-row-text { flex: 1; min-width: 0; font-size: 27rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pbp-empty { text-align: center; padding: 60rpx 0; font-size: 26rpx; }
</style>
