<template>
    <div class="circle-wrap" :style="wrapStyle">
        <div class="circle-ring" :style="ringStyle"></div>
        <div class="circle-inner" :style="innerStyle">
            <slot v-if="props.showText">{{ displayProgress }}%</slot>
            <slot v-else></slot>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from "vue";

const props = defineProps({
    progress: { type: Number, default: 0 }, // 0-100
    size: { type: Number, default: 120 }, // px
    thickness: { type: Number, default: 12 }, // 环宽度
    bgColor: { type: String, default: "#eee" }, // 背景色
    progressColor: { type: String, default: "#409EFF" }, // 进度条颜色
    reverse: { type: Boolean, default: false }, // 是否逆向
    showText: { type: Boolean, default: true },
    textColor: { type: String, default: "#333" },
    fontSize: { type: Number, default: 14 },
    duration: { type: Number, default: 600 }, // 动画时长 ms
    startAngle: { type: Number, default: -90 } // 起始角度（默认从12点钟方向）
});

// 内部动画进度
const animatedProgress = ref(props.progress);
let timer = null;

watch(
    () => props.progress,
    (newVal) => {
        clearInterval(timer);
        let start = animatedProgress.value;
        let end = Math.min(100, Math.max(0, newVal));
        const diff = end - start;
        if (diff === 0) return;

        const frameRate = 1000 / 30; // 每秒30帧
        const steps = Math.ceil(props.duration / frameRate);
        let currentStep = 0;

        timer = setInterval(() => {
            currentStep++;
            animatedProgress.value = start + diff * (currentStep / steps);
            if (currentStep >= steps) {
                animatedProgress.value = end;
                clearInterval(timer);
            }
        }, frameRate);
    },
    { immediate: true }
);

onUnmounted(() => {
    clearInterval(timer);
});

const displayProgress = computed(() => Math.round(animatedProgress.value));

const wrapStyle = computed(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
    position: "relative",
    display: "inline-block"
}));

const ringStyle = computed(() => {
    const pct = animatedProgress.value;
    const prog = props.progressColor;
    const track = props.bgColor;
    const start = props.startAngle;

    let bg;
    if (props.reverse) {
        const split = 100 - pct;
        bg = `conic-gradient(from ${start}deg, ${track} 0% ${split}%, ${prog} ${split}% 100%)`;
    } else {
        bg = `conic-gradient(from ${start}deg, ${prog} 0% ${pct}%, ${track} ${pct}% 100%)`;
    }

    return {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: bg,
        position: "absolute",
        left: 0,
        top: 0
    };
});

const innerStyle = computed(() => {
    const s = props.size;
    const t = props.thickness;
    const innerSize = Math.max(0, s - 2 * t);
    return {
        width: `${innerSize}px`,
        height: `${innerSize}px`,
        backgroundColor: "#fff",
        borderRadius: "50%",
        position: "absolute",
        left: `${(s - innerSize) / 2}px`,
        top: `${(s - innerSize) / 2}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: props.textColor,
        fontSize: `${props.fontSize}px`
    };
});
</script>

<style scoped>
.percent {
    line-height: 1;
}
</style>
