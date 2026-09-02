<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    months?: any;
    startMonth?: any;
    dateActiveColor?: string;
    textActiveColor?: string;
    selectedDate?: any;
    currentDate?: string;
    showActive?: boolean;
}

// Props
const props = withDefaults(defineProps<Props>(), {
    months: 6,
    startMonth: 1,
    dateActiveColor: '#62AEF8',
    textActiveColor: '#FFFFFF',
    selectedDate: 1,
    currentDate: '',
    showActive: true
});

const emit = defineEmits(['chooseDate']);

const dateActiveIndex = (dateIndex: number) => {
    return props.showActive ? getAssignDateInfo(false, 1) === (Number(props.startMonth) + dateIndex) : false;
};

const getAssignDateInfo = (isToday: boolean, index: number) => {
    return ((isToday ? props.currentDate : props.selectedDate) as any).split('-')[index] * 1;
};

const isCurrentDay = (dateIndex: number) => {
    return getAssignDateInfo(true, 0) === getAssignDateInfo(false, 0)
        && getAssignDateInfo(true, 1) === Number(props.startMonth) + dateIndex
        && props.showActive;
};

const chooseDate = (selectedDate: any) => {
    emit('chooseDate', selectedDate);
};
</script>

<template>
    <!-- 日期显示 -->
    <view class="month">
        <view class="month-box" v-for="(dateInfo, dateIndex) in months" :key="dateIndex"
            :style="{ backgroundColor: dateActiveIndex(dateIndex) ? dateActiveColor : '' }">
            <view class="month-box-date"
                @tap="chooseDate(`${getAssignDateInfo(false, 0)}-${Number(startMonth) + dateIndex}`)">
                <view class="month-box-date-text"
                    :style="{ color: dateActiveIndex(dateIndex) ? textActiveColor : '', }">
                    {{ Number(startMonth) + dateIndex }}月
                </view>
                <view class="month-box-date__isToday" v-if="isCurrentDay(dateIndex)"
                    :style="{ backgroundColor: dateActiveColor }"></view>
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.month {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;

    &-box {
        width: 60rpx;
        height: 60rpx;
        position: relative;
        // padding: 8rpx 24rpx;
        padding: 6rpx;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 12px 0;

        &-date {

            &-text {
                font-size: 28rpx;
                // color: #333333;
                font-weight: bold;
            }

            &__isToday {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                border-radius: 50%;
                z-index: -1;
                opacity: 0.4;
            }

        }
    }
}
</style>