<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Props {
    weekOfMonth?: any;
    dateActiveColor?: string;
    textActiveColor?: string;
    selectedWeek?: any;
}

// Props
const props = withDefaults(defineProps<Props>(), {
    weekOfMonth: [],
    dateActiveColor: '#62AEF8',
    textActiveColor: '#FFFFFF',
    selectedWeek: 1
});

// Emit 定义
const emit = defineEmits(['chooseDate'])

// 数字转中文
const numberToChinese = (number: number) => {
    const chinese = ['一', '二', '三', '四', '五', '六']
    return chinese[number - 1] || number
}

// 点击选择周
const chooseDate = (dateInfo: any) => {
    emit('chooseDate', dateInfo)
}
</script>

<template>
    <!-- 日期显示 -->
    <div class="week">
        <div class="week-box" v-for="(dateInfo, dateIndex) in weekOfMonth" :key="dateIndex" :style="{ backgroundColor: selectedWeek === dateInfo ? dateActiveColor : '' }">
            <div class="week-box-date" @click="chooseDate(dateInfo)">
                <div class="week-box-date-text" :style="{ color: selectedWeek === dateInfo ? textActiveColor : '' }">
                    第{{ numberToChinese(dateInfo) }}周
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.week {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;

    &-box {
        padding: 8rpx 24rpx;
        border-radius: 20px;
        display: flex;
        align-items: center;
        margin: 12px 0;

        &-date {
            &-text {
                font-size: 28rpx;
                // color: #333333;
                font-weight: bold;
            }
        }
    }
}
</style>
