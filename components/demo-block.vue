<template>
    <view :class="['demo-block', transparent ? '' : 'is-white', customClass]" :style="{ background: themeJson[theme].bgColor }">
        <view class="demo-title">{{ title }}</view>
        <view class="demo-container" :style="transparent ? '' : style">
            <slot />
        </view>
    </view>
</template>
<script lang="ts">
import themeJson from '../theme.json';
import { useTheme } from '@/composables/theme/theme';

const { themeVars, theme } = useTheme();

export default {
    options: {
        addGlobalClass: true,
        virtualHost: true,
        styleIsolation: 'shared',
    },
};
</script>
<script lang="ts" setup>
import { ref, watch } from 'vue';

interface Props {
    customClass?: string;
    title?: string;
    ver?: number | string;
    hor?: number | string;
    transparent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    customClass: '',
    ver: 10,
    hor: 15,
    transparent: false,
});

const style = ref<string>('');

watch(
    [() => props.ver, () => props.hor],
    () => {
        setStyle();
    },
    { deep: true, immediate: true }
);

function setStyle() {
    style.value = `margin: 0 ${props.hor}px;padding:${props.ver}px 0;`;
}
</script>
<style lang="scss" scoped>
.demo-block {
    color: #666;

    &:not(:first-child) {
        margin-top: 10px;
    }

    &:not(:last-child) {
        margin-bottom: 10px;
    }
}

.demo-title {
    padding: 10px 15px;
    font-size: 13px;
}
</style>
