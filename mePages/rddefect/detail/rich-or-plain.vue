<template>
    <view v-if="isEmptyRich" class="rop-empty">--</view>
    <view v-else-if="isRich" class="rop-rich">
        <rich-text :nodes="safeNodes"></rich-text>
    </view>
    <view v-else class="rop-plain">{{ value }}</view>
</template>
<script lang="ts" setup>
import { computed } from "vue";

// 富文本/纯文本自适应展示：值含标签走 rich-text（app 端无编辑器，仅查看），
// 否则按纯文本保留换行展示（web 端 richOrPlainSteps 对纯文本的兼容口径一致）
const props = defineProps<{ value: any }>();

const isRich = computed(() => String(props.value ?? '').includes('<'));
// 空值判断：WangEditor 空内容为 "<p><br></p>"，剥离 HTML 后判空（纯图片/表格视为已填）
const isEmptyRich = computed(() => {
    const s = String(props.value ?? '');
    if (!s.trim()) return true;
    if (!s.includes('<')) return false;
    const text = s.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
    return !text && !/<img|<video|<iframe|<table/i.test(s);
});
// 图片约束不超出容器宽度
const safeNodes = computed(() => String(props.value).replace(/<img/gi, '<img style="max-width:100%;height:auto;"'));
</script>
<style lang="scss" scoped>
.rop-empty { font-size: 26rpx; color: var(--rd-label, #c0c4cc); line-height: 40rpx; }
.rop-plain { font-size: 26rpx; color: var(--rd-field-color, #333); line-height: 40rpx; white-space: pre-line; word-break: break-all; }
.rop-rich { font-size: 26rpx; color: var(--rd-field-color, #333); line-height: 40rpx; word-break: break-all; overflow-x: auto; }
</style>
