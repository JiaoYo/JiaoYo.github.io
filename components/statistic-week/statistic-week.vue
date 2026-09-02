<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import WeekBox from './weekBox.vue'
import { parseTime } from './ts/utils'

interface Props {
    duration?: number;
    cellHeight?: number;
    dateActiveColor?: string;
    defaultSelectedDate?: string | null
}

// Props
const props = withDefaults(defineProps<Props>(), {
    duration: 300,
    cellHeight: 75,
    dateActiveColor: '#62AEF8',
    defaultSelectedDate: null
});

const emit = defineEmits(['change'])

// 响应式数据
const today = parseTime(new Date(), '{y}-{m}-{d}')
const current = ref<number>(1)
const selectedDate = ref<any>(null)
const selectedWeek = ref<number>(0)
const weekOfMonthCount = ref<any>([])
const MondayOfYear = ref<number>(0)
const weekDateRange = ref<string>('')
const todayMonth = ref<any>('')
const todayYear = ref<any>('')
const todayWeek = ref<any>('')

// 计算属性
const getAssignDateInfo = (isToday: boolean, index: number) => {
    const dateStr = (isToday ? today : selectedDate.value) || today;
    return parseInt(String(dateStr).split('-')[index])
}

const showBackToTodayBtn = computed(() => {
    return getAssignDateInfo(false, 0) !== todayYear.value ||
        getAssignDateInfo(false, 1) !== todayMonth.value ||
        selectedWeek.value !== todayWeek.value
})

const swiperHeight = computed(() => `${props.cellHeight + 20}rpx`)

// 初始化
onMounted(() => {
    init()
})

// Watchers
watch(current, (newV, oldV) => {
    if (newV === 0 && oldV === 2) swiperChange(1)
    else if (newV === 2 && oldV === 0) swiperChange(-1)
    else newV > oldV ? swiperChange(1) : swiperChange(-1)
})

// Methods
function init() {
    if (selectedDate.value === null) { // 默认选中日期为当天
        selectedDate.value = props.defaultSelectedDate || today
    }
    getCurrentWeek(...[getAssignDateInfo(true, 0), getAssignDateInfo(true, 1), getAssignDateInfo(true, 2)])
    getWeeks(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1))
    emitDate()
}

function bindDateChange(e: any) {
    const value = e.detail.value
    selectedDate.value = value;
    getWeeks(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1))
    selectedWeek.value = 1
    emitDate()
}

function chooseDate(week: any) {
    selectedWeek.value = week
    emitDate()
}

function swiperChange(direction: number) {
    getPrevOrNextDate(direction)
}

function swiperTransition(e: any) {
    if (e.detail.dx != 0) selectedWeek.value = 0
}

function swiperTransitionFinish() {
    if (selectedWeek.value === 0) {
        selectedWeek.value = 1
        emitDate()
    }
}

function getPrevOrNextDate(type: number) {
    if (type == 1) {
        let currentMonth = getAssignDateInfo(false, 1) + type === 13 ? 1 : getAssignDateInfo(false,
            1) + type;
        let currentYear = getAssignDateInfo(false, 1) + type === 13 ? getAssignDateInfo(false, 0) +
            1 : getAssignDateInfo(false, 0);
        selectedDate.value = parseTime(new Date(currentYear, currentMonth - 1), '{y}-{m}');
    } else if (type == -1) {
        let currentMonth = getAssignDateInfo(false, 1) + type === 0 ? 12 : getAssignDateInfo(false, 1) + type;
        let currentYear = getAssignDateInfo(false, 1) + type === 0 ? getAssignDateInfo(false, 0) - 1 : getAssignDateInfo(false, 0);
        selectedDate.value = parseTime(new Date(currentYear, currentMonth - 1), '{y}-{m}');
    }
    getWeeks(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1))
}

function getMondayTime(year: any, month: any, weekday: any) {
    let newDate = new Date();
    newDate.setFullYear(year, month - 1, 1); //该月第一天
    let week = newDate.getDay(); //该月的第一天是星期几
    if (week == 0) week = 7; //如果该月的第一天是0 那么就是周日
    let monday, newMonth; //第几周的周一的日期
    if (week != 1) { //如果该月的第一天不是星期一 .....
        newDate.setFullYear(year, month - 1, 2 - week); //那么就向上个月去找第一周的周一
        var lastDate = newDate.getDate(); //获取第一周的周一的日期
        newDate.setFullYear(year, month - 1, 0); //周一的上个月的总天数
        var lastDateCount = newDate.getDate(); //周一的上个月的总天数
        monday = (lastDate + (weekday - 1) * 7) % lastDateCount == 0 ? lastDateCount : (lastDate + (weekday -
            1) * 7) % lastDateCount; //计算出每个月第几周的周一的日期
        if (weekday == 1) {
            newMonth = month - 1 == 0 ? 12 : month - 1;
        } else {
            newMonth = month;
        }
    } else { //如果该月的第一天是星期一 .....
        monday = 1 + (weekday - 1) * 7; //那么直接计算出每个月第几周的周一的日期
        newMonth = month;
    }
    MondayOfYear.value = month < newMonth ? year - 1 : year
    return newMonth + "." + monday;
}

function getSundayTime(year: any, month: any, weekday: any) {
    let newDate = new Date();
    let monDay: any = getMondayTime(year, month, weekday); //获取第几周的周一
    newDate.setFullYear(year, monDay.split(".")[0], 0); //取第几周的月总天数
    var monthCount = newDate.getDate(); //该月总天数
    var sunDay = (Number(monDay.split(".")[1]) + 6) % monthCount == 0 ? monthCount : (Number(monDay.split(".")[
        1]) + 6) % monthCount; //第几周的周日的日
    return month + "." + sunDay;
}

function getWeeks(year: any, month: any) {
    let newDate = new Date();
    newDate.setFullYear(year, month, 0); //该月的最后一天，也就是该月天数
    let currentLastDay = newDate.getDate(); // 该月的最后一天
    let week = newDate.getDay(); //该月的最后一天是星期几
    let week_count = Math.ceil((currentLastDay - week) / 7); //该月最后一周的周日日期
    weekOfMonthCount.value = [];			//重置周数数组
    for(let i = 0; i < week_count; i++){
        weekOfMonthCount.value.push(i + 1);
    }
}

function getCurrentWeek(year: any, month: any, day: any) {
    let currentDate = new Date(year, month - 1, day);
    let currentWeek = currentDate.getDay(); //当前日期是星期几
    if (currentWeek == 0) currentWeek = 7; //如果当前日期是0 那么就是周日
    let currentDay = currentDate.getDate(); //当前日期是几号
    currentDate.setFullYear(year, month, 0); //当前月的最后一天
    let currentMonthDays = currentDate.getDate(); //当前月总天数
    let currentWeekLastDay = (currentDay + 7 - currentWeek) % currentMonthDays == 0 ? currentMonthDays : (
        currentDay + 7 - currentWeek) % currentMonthDays; //当前日期所在的周的最后一天是几号
    let currentMonth = month + Math.floor((currentDay + 7 - currentWeek) / currentMonthDays == 1 ? 0 : (
        currentDay + 7 - currentWeek) / currentMonthDays); //计算出当前日期的所在的周的月份
    currentMonth = currentMonth % 12 == 0 ? currentMonth : currentMonth % 12; //如果月份超过12月进行处理
    let currentYear = currentMonth < month ? year + 1 : year; //计算出当前日期的所在的周的年份
    selectedDate.value = parseTime(new Date(currentYear, currentMonth - 1, currentWeekLastDay), '{y}-{m}-{d}');
    selectedWeek.value = Math.ceil(currentWeekLastDay / 7); //当前日期的周日在本月的第几周
    weekDateRange.value =
        `${getMondayTime(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1), selectedWeek.value) }-${getSundayTime(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1), selectedWeek.value)}`
    todayYear.value = getAssignDateInfo(false, 0); //当前日期所在的年份
    todayMonth.value = getAssignDateInfo(false, 1); //当前日期所在的月份
    todayWeek.value = selectedWeek.value; //当前日期所在的周数
}

function emitDate() {
    weekDateRange.value = `${getMondayTime(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1), selectedWeek.value)}-${getSundayTime(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1), selectedWeek.value)}`
    const e = {
        MondayOfYear: MondayOfYear.value,
        weekDateRange: weekDateRange.value,
        selectedDate: parseTime(new Date(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1) - 1), '{y}-{m}'),
        selectedWeek: selectedWeek.value
    }
    emit('change', e)
}

function goToCurrentWeek() {
    getCurrentWeek(getAssignDateInfo(true, 0), getAssignDateInfo(true, 1), getAssignDateInfo(true, 2))
    getWeeks(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1))
    emitDate()
}
</script>

<template>
    <div class="statistic_week">
        <!-- 周历顶部信息 -->
        <div class="week_info">
            <picker mode="date" :value="selectedDate" fields="month" @change="bindDateChange">
                <text class="uni-week__header-text week__header-year">{{ MondayOfYear }}</text>
                <text class="uni-week__header-text week__header-month">{{ weekDateRange }}</text>
            </picker>
            <view v-show="showBackToTodayBtn" class="backToToday" :style="{ color: dateActiveColor }" @click="goToCurrentWeek()">回到本周</view>
        </div>

        <!-- 周历轮播 -->
        <div class="week_swiper">
            <swiper key="normalSwiper" circular :style="{ height: swiperHeight }" :current="current"
                :duration="duration" :skip-hidden-item-layout="true" @change="e => current = e.detail.current"
                @transition="swiperTransition" @animationfinish="swiperTransitionFinish">
                <swiper-item v-for="(swiper, index) in 3" :key="index" class="swiper-item">
                    <WeekBox :weekOfMonth="weekOfMonthCount" :cellHeight="cellHeight" :selectedWeek="selectedWeek" @chooseDate="chooseDate" />
                </swiper-item>
            </swiper>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.statistic_week {
    width: 100%;
    // padding: 20rpx 0;
    padding: 20rpx 0 0 0;
    box-sizing: border-box;
    // background-color: #fff;
}

.week_swiper {
    border-bottom: 1px solid #F2F2F2;
}

.week_info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20rpx;
}

.backToToday {
    margin-left: auto;
    font-size: 24rpx;
    cursor: pointer;
}

.uni-week__header-text {
    font-size: 28rpx;
    // color: #333;
    font-weight: bold;
}

.week__header-year {
    padding-right: 8rpx;
    border-right: 1px solid #F2F2F2;
}

.week__header-month {
    padding-left: 8rpx;
}
</style>
