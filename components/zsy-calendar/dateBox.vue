<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    dates: any;
    cellHeight: number;
    dateActiveColor: string;
    selectedDate?: string;
    swiperMode: 'open' | 'close' | string;
    showActive: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    dates: [],
    cellHeight: 75,
    dateActiveColor: '#FE6601',
    selectedDate: '',
    swiperMode: 'open',
    showActive: false
});

const emit = defineEmits(['chooseDate'])

const dateActiveIndex = computed(() => {
    return props.showActive
        ? props.dates.map((item: any) => item.dateFormat).indexOf(props.selectedDate)
        : -1
})

const onChooseDate = (dateInfo: any) => {
    emit('chooseDate', dateInfo)
}
</script>

<template>
    <!-- 日期显示 -->
    <view class="date_box">
        <view v-for="(dateInfo, dateIndex) in dates" :key="dateIndex" class="calendar_date__box">
            <view class="calendar_date"
                :class="{ isSelected: dateActiveIndex === dateIndex && dateInfo.type === 'cur' }" :style="{
                    height: cellHeight + 'rpx',
                    width: cellHeight + 'rpx',
                    color: swiperMode === 'open' ? dateInfo.type === 'cur' ? '' : '#959595' : '',
                    backgroundColor: dateActiveIndex === dateIndex && dateInfo.type === 'cur' ? dateActiveColor : ''
                }" @click="onChooseDate(dateInfo)">
                <view class="calendar_date__number">{{ dateInfo.date }}</view>
                <view class="calendar_date__isToday" v-if="dateInfo.isToday" :style="{ backgroundColor: dateActiveColor }"></view>
                <view class="calendar_date__cricle"></view>
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.date_box {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
}

.date_box .calendar_date__box {
    width: calc(100% / 7);
    margin-top: 20rpx;
}

.calendar_date__box .calendar_date {
    text-align: center;
    margin: 0 auto;
    font-weight: bold;
    font-size: 28rpx;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
}

.calendar_date__box .calendar_date.isSelected {
    color: #FFFFFF !important;
}

.calendar_date .calendar_date__isToday {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 50%;
    z-index: -1;
    opacity: 0.4;
}

.calendar_date .calendar_date__cricle {
    width: 9rpx;
    height: 9rpx;
    border-radius: 50%;
    margin-top: 5rpx;
    background-color: #FFFFFF;
}
</style>
