<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { parseTime, deepClone } from './ts/utils';
import DateBox from './dateBox.vue'

// ==================== Props ====================
interface Props {
    duration?: number;
    cellHeight?: number;
    dateActiveColor?: string;
    sundayIndex?: number;
    mode: 'open' | 'close' | string;
    changeSetDefault?: boolean;
    defaultSelectedDate?: string | null;
    showArrowBtn?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    duration: 300,
    cellHeight: 75,
    dateActiveColor: '#FE6601',
    sundayIndex: 6,
    mode: 'open',
    changeSetDefault: true,
    defaultSelectedDate: null,
    showArrowBtn: true
});

// ==================== Emits ====================
const emit = defineEmits(['change', 'modeChange'])

// ==================== Refs & State ====================
const today = parseTime(new Date(), '{y}-{m}-{d}')
const selectedDate = ref<any>(null)
const week = ref<string[]>([])
const current = ref(1)
const calendarSwiperDates = ref<any>([[], [], []])
const swiperChangeByClick = ref(false)
const swiperMode = ref(props.mode)
const monthDateCache = reactive({})
const emitTimer = ref<any>(null)
const dateClick = ref(false)

// ==================== Computed ====================

const getcurCalendarDates = computed(() => {
    return swiperMode.value === 'open'
        ? calendarSwiperDates.value
        : getCalendarShrinkSwiperDates()
})

const getAdjacentYMD = computed(() => {
    const year = getAssignDateInfo(false, 0)
    const month = getAssignDateInfo(false, 1)
    const prev = `${month === 1 ? year - 1 : year}-${month === 1 ? 12 : month - 1}`
    const cur = `${year}-${month}`
    const next = `${month === 12 ? year + 1 : year}-${month === 12 ? 1 : month + 1}`
    return [prev, cur, next]
})

const getAssignDateInfo = (isToday: boolean, index: number) => {
    const dateStr = String((isToday ? today : selectedDate.value) || today);
    return parseInt(dateStr.split('-')[index])
}

const showBackToTodayBtn = computed(() => {
    return (
        getAssignDateInfo(false, 0) !== getAssignDateInfo(true, 0) ||
        getAssignDateInfo(false, 1) !== getAssignDateInfo(true, 1)
    )
})

const swiperHeight = computed(() => {
    const normalHeight = (calendarSwiperDates.value[current.value]?.length || 0) / 7 * (props.cellHeight + 20) + 'rpx'
    const shrinkHeight = props.cellHeight + 20 + 'rpx'
    return swiperMode.value === 'open' ? normalHeight : shrinkHeight
})

// ==================== Methods ====================

const init = () => {
    selectedDate.value = props.defaultSelectedDate || today
    initWeek()
    generateAdjacentMonthDate()
}

const initWeek = () => {
    let normalWeek = ['日', '一', '二', '三', '四', '五', '六']
    const sIndex = Math.max(0, Math.min(props.sundayIndex, 6))
    normalWeek.unshift(...normalWeek.slice(-sIndex))
    normalWeek.length = 7
    week.value = normalWeek
}

const adjacentSortByCurrent = (prev: any, cur: any, next: any) => {
    if (current.value === 0) return [cur, next, prev]
    if (current.value === 1) return [prev, cur, next]
    if (current.value === 2) return [next, prev, cur]
}

const generateAdjacentMonthDate = () => {
    const [prevYM, curYM, nextYM] = getAdjacentYMD.value
    const arr = [prevYM, curYM, nextYM].map(YM => {
        const [year, month] = YM.split('-')
        return generateMonthDateCache(Number(year), Number(month))
    })
    const [prev, cur, next] = arr
    calendarSwiperDates.value = adjacentSortByCurrent(prev, cur, next);
    if (swiperChangeByClick.value) swiperChangeByClick.value = false
}

const generateMonthDateCache = (year: any, month: any) => {
    const key = `${year}-${month}`
    if ((monthDateCache as any)[key]) return (monthDateCache as any)[key]
    const calendarDate = []
    const monthDates = new Date(year, month, 0).getDate()
    // const monthFirstDay = new Date(year, month - 1, 0).getDay()
    const monthFirstDay = new Date(year, month - 1, 1).getDay()
    const monthFirstDayInWeek = week.value.indexOf(['日', '一', '二', '三', '四', '五', '六'][monthFirstDay])

    // 填充上月
    if (monthFirstDayInWeek > 0) {
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year
        const prevMonthDates = new Date(prevYear, prevMonth, 0).getDate()
        for (let i = 0; i < monthFirstDayInWeek; i++) {
            const d = prevMonthDates - i
            const item = {
                year: prevYear,
                month: prevMonth,
                date: d,
                dateFormat: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                type: 'prev'
            }
            theDateIsToday(item)
            calendarDate.unshift(item)
        }
    }

    // 当月
    for (let i = 1; i <= monthDates; i++) {
        const item = {
            year,
            month,
            date: i,
            dateFormat: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
            type: 'cur'
        }
        theDateIsToday(item)
        calendarDate.push(item)
    }

    // 填充下月
    const residue = calendarDate.length % 7
    if (residue !== 0) {
        const nextMonth = month === 12 ? 1 : month + 1
        const nextYear = month === 12 ? year + 1 : year
        for (let i = 1; i <= 7 - residue; i++) {
            const item = {
                year: nextYear,
                month: nextMonth,
                date: i,
                dateFormat: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                type: 'next'
            }
            theDateIsToday(item)
            calendarDate.push(item)
        }
    }

    (monthDateCache as any)[key] = deepClone(calendarDate)
    return (monthDateCache as any)[key]
}

const theDateIsToday = (item: any) => {
    const isToday = `${item.year}${item.month}${item.date}` ===
        `${getAssignDateInfo(true, 0)}${getAssignDateInfo(true, 1)}${getAssignDateInfo(true, 2)}`
    if (isToday) item.isToday = true
}

const handleChange = (e: any) => {
    const newV = e.detail.current
    const oldV = current.value
    current.value = newV

    let direction = 0
    if (newV === 0 && oldV === 2) direction = 1 // 右滑
    else if (newV === 2 && oldV === 0) direction = -1 // 左滑
    else direction = newV > oldV ? 1 : -1

    swiperChange(direction)
}

const swiperChange = (direction: number) => {
    if (!swiperChangeByClick.value) {
        getPrevOrNextDate(direction)
    }
    if (swiperMode.value === 'open') {
        setTimeout(() => {
            generateAdjacentMonthDate()
        }, props.duration)
    }
}

const getPrevOrNextDate = (type: number) => {
    if (swiperMode.value === 'open') {
        let year = getAssignDateInfo(false, 0)
        let month = getAssignDateInfo(false, 1) + type
        const maxDate = new Date(year, month, 0).getDate()
        const curActiveDate = getAssignDateInfo(false, 2)
        const date = props.changeSetDefault
            ? 1
            : curActiveDate > maxDate ? maxDate : curActiveDate

        // 修正年月溢出
        if (month < 1) { year--; month = 12 }
        else if (month > 12) { year++; month = 1 }

        selectedDate.value = parseTime(new Date(year, month - 1, date), '{y}-{m}-{d}')
    } else {
        let next = current.value + type
        next = next < 0 ? 2 : next > 2 ? 0 : next
        selectedDate.value = getcurCalendarDates.value[next][0].dateFormat
    }
}

const goToDate = (date = today) => {
    try {
        const parts = String(date).split('-')
        if (parts.length < 2 || parts.length > 3) throw '参数有误'
        if (parts.length === 2) date += '-01'
    } catch (err) {
        throw new Error('请检查参数是否符合规范')
    }
    selectedDate.value = date
    generateAdjacentMonthDate()
}

const chooseDate = (dateInfo: any) => {
    if (dateInfo.dateFormat === selectedDate.value) return

    if (swiperMode.value === 'open') {
        if (dateInfo.type !== 'cur') {
            if (dateInfo.type === 'prev') {
                current.value = current.value === 0 ? 2 : current.value - 1
            } else {
                current.value = current.value === 2 ? 0 : current.value + 1
            }
            swiperChangeByClick.value = true
        } else {
            dateClick.value = true
        }
    } else {
        if (dateInfo.type !== 'cur') {
            swiperChangeByClick.value = true
        }
        dateClick.value = true
    }

    selectedDate.value = dateInfo.dateFormat
}

const emitDate = () => {
    if (emitTimer.value) {
        clearTimeout(emitTimer.value)
        emitTimer.value = null
    }
    emitTimer.value = setTimeout(() => {
        emit('change', { selectedDate: selectedDate.value })
        emitTimer.value = null
    }, props.duration + 200)
}

const toggleSwiperMode = () => {
    swiperMode.value = swiperMode.value === 'open' ? 'close' : 'open'
    emit('modeChange', { mode: swiperMode.value })
}

const getCalendarShrinkSwiperDates = () => {
    const [prevYM, curYM, nextYM] = getAdjacentYMD.value
    const curDates = (monthDateCache as any)[curYM]
    if (!curDates) return [[], [], []]

    const line = Math.floor(curDates.findIndex((item: any) => item.dateFormat === selectedDate.value) / 7)

    const cur = curDates.slice(line * 7, (line + 1) * 7)
    let prev, next

    // 上一周
    if (line === 0) {
        const prevDates = (monthDateCache as any)[prevYM]
        const prevLines = prevDates.length / 7
        if (curDates[0].dateFormat === selectedDate.value) {
            prev = prevDates.slice((prevLines - 1) * 7)
        } else {
            prev = prevDates.slice((prevLines - 2) * 7, (prevLines - 1) * 7)
        }
    } else {
        prev = curDates.slice((line - 1) * 7, line * 7)
    }

    // 下一周
    if (line + 1 === curDates.length / 7) {
        const nextDates = (monthDateCache as any)[nextYM]
        if (curDates[curDates.length - 1].type === 'cur') {
            next = nextDates.slice(0, 7)
        } else {
            next = nextDates.slice(7, 14)
        }
    } else {
        next = curDates.slice((line + 1) * 7, (line + 2) * 7)
    }

    return adjacentSortByCurrent(prev, cur, next)
}

// ==================== Watchers ====================
watch(selectedDate, (newV, oldV) => {
    if (swiperMode.value === 'close') {
        setTimeout(() => {
            generateAdjacentMonthDate()
        }, props.duration)
    }

    if (newV && (!oldV || dateClick.value)) {
        emitDate()
        dateClick.value = false
    } else {
        if (emitTimer.value) {
            clearTimeout(emitTimer.value)
            emitTimer.value = null
        }
        emitTimer.value = setTimeout(() => {
            emit('change', { selectedDate: newV })
            emitTimer.value = null
        }, props.duration + 200)
    }
})

// ==================== Lifecycle ====================
onMounted(() => {
    init()
})
</script>

<template>
    <!-- 日历滚动插件 -->
    <view class="zsy_calendar">
        <!-- 日历顶部信息 -->
        <view class="calendar_info">
            <text class="title">每日记录</text>
            <text class="desc">
                ({{ getAssignDateInfo(false, 0) === getAssignDateInfo(true, 0) ? '' : getAssignDateInfo(false, 0) + '年'
                }}{{ getAssignDateInfo(false, 1) }}月)
            </text>
            <text v-show="showBackToTodayBtn" class="backToToday" :style="{ color: dateActiveColor }" @click="goToDate()">回到今天</text>
        </view>

        <!-- 日历周数 -->
        <view class="calendar_week">
            <view v-for="(item, index) in week" :key="index" class="calendar_week__item">{{ item }}</view>
        </view>

        <!-- 日历轮播 -->
        <view class="calendar_swiper">
            <swiper key="normalSwiper" circular :style="{ height: swiperHeight }" :current="current"
                :duration="duration" :skip-hidden-item-layout="true" @change="handleChange">
                <swiper-item v-for="(swiper, swiperIndex) in 3" :key="swiperIndex" class="swiper-item">
                    <DateBox :dates="getcurCalendarDates[swiperIndex]" :cellHeight="cellHeight"
                        :selectedDate="selectedDate" :dateActiveColor="dateActiveColor" :swiperMode="swiperMode"
                        :showActive="emitTimer === null" @chooseDate="chooseDate" />
                </swiper-item>
            </swiper>
        </view>

        <!-- 日历切换模式 -->
        <view class="calendar_toggle" @tap="toggleSwiperMode">
            <view class="icon" :class="{ down: swiperMode === 'close' }"></view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.zsy_calendar {
    width: 100%;
    padding: 20rpx 0;
    box-sizing: border-box;
    // background-color: #fff;
    border-radius: 20rpx;
}

.calendar_info {
    display: flex;
    align-items: center;
    padding: 0 20rpx;
}

.calendar_info .title {
    font-size: 34rpx;
    font-weight: bold;
    // color: #2C2C2C;
}

.calendar_info .desc {
    margin-left: 29rpx;
    font-size: 28rpx;
    // color: #959595;
}

.calendar_info .backToToday {
    margin-left: auto;
    font-size: 24rpx;
}

.calendar_week {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 26rpx;
    // color: #959595;
    margin: 20rpx 0rpx;
}

.calendar_week .calendar_week__item {
    width: calc(100% / 7);
    text-align: center;
}

.calendar_toggle {
    position: relative;
    padding: 10rpx 0;
    margin: 10rpx 20rpx 0;
    display: flex;
    justify-content: center;
}

.calendar_toggle .icon {
    width: 30rpx;
    height: 30rpx;
    background-image: url('../../static/arrow.png');
    background-size: contain;
    background-repeat: no-repeat;
    margin: 0 auto;
    transform: rotate(0deg);
    transition: all .3s;
}

.icon.down {
    transform: rotate(180deg);
}

.calendar_toggle::before,
.calendar_toggle::after {
    width: calc(50% - 30rpx);
    border-top: solid 2rpx #EAEAEA;
    content: '';
    display: block;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
}

.calendar_toggle::before {
    left: 0;
}

.calendar_toggle::after {
    right: 0;
}
</style>