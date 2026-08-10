<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import monthBox from './monthBox.vue'
import { parseTime } from './ts/utils'

interface Props {
    duration?: number;
    cellHeight?: number;
    dateActiveColor?: string;
    textActiveColor?: string;
    defaultSelectedDate?: string | null
}

// Props
const props = withDefaults(defineProps<Props>(), {
    duration: 300,
    cellHeight: 75,
    dateActiveColor: '#62AEF8',
    textActiveColor: '#FFFFFF',
    defaultSelectedDate: null
});

const emit = defineEmits(['change'])

const today = parseTime(new Date(), '{y}-{m}')
const current = ref(1)
const selectedDate = ref<any>(props.defaultSelectedDate || today)
const showActive = ref(true)
const monthDateCache = ref<any>([])

// 获取指定日期信息
const getAssignDateInfo = (isToday: boolean, index: number) => {
    const dateStr = (isToday ? today : selectedDate.value) || today;
    return parseInt(String(dateStr).split('-')[index])
}

// 返回轮播图高度
const swiperHeight = computed(() => `${props.cellHeight + 20}rpx`)

// 是否显示回到本月按钮
const showBackToTodayBtn = computed(() => {
    return getAssignDateInfo(true, 0) !== getAssignDateInfo(false, 0) ||
        getAssignDateInfo(true, 1) !== getAssignDateInfo(false, 1)
})

// 初始化数据
const init = () => {
    if (selectedDate.value === null) { // 默认选中日期为当天
        selectedDate.value = props.defaultSelectedDate || today
    }
    generateMonthDateCache(getAssignDateInfo(true, 0), getAssignDateInfo(true, 1))
}

// picker选择年月
const bindDateChange = (e: any) => {
    selectedDate.value = e.detail.value
    generateMonthDateCache(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1))
}

// 选中日期事件
const chooseDate = (e: any) => {
    const [y, m] = e.split('-')
    selectedDate.value = parseTime(new Date(Number(y), Number(m) - 1), '{y}-{m}')
    emitDate()
}

// 回到本月
const goToCurrentMonth = () => {
    selectedDate.value = parseTime(new Date(getAssignDateInfo(true, 0), getAssignDateInfo(true, 1) - 1), '{y}-{m}')
    generateMonthDateCache(getAssignDateInfo(true, 0), getAssignDateInfo(true, 1))
}

// 轮播图切换结束
const swiperChange = (e: any)  => {
    getStartMonthOfYear(e);
}

// 轮播滑动中触发，取消展示高亮
const swiperTransition = (e: any) => {
    if (e.detail.dx !== 0) showActive.value = false
}

// 轮播结束时触发，恢复高亮
const swiperTransitionFinish = () => {
    if (!showActive.value) showActive.value = true
}

// 获取轮播切换年月
const getStartMonthOfYear = (type: number) => {
    let startYear: any, startMonth: any;
    if (type === 1) {
        startMonth = getAssignDateInfo(false, 1) + (type) * 6 > 12 ? 1 : 7;
        startYear = getAssignDateInfo(false, 1) + (type) * 6 > 12 ? getAssignDateInfo(false,
            0) + 1 : getAssignDateInfo(false, 0);
    } else if (type === -1) {
        startMonth = getAssignDateInfo(false, 1) + (type) * 6 < 1 ? 7 : 1;
        startYear = getAssignDateInfo(false, 1) + (type) * 6 < 1 ? getAssignDateInfo(false, 0) -
            1 : getAssignDateInfo(false, 0);
    }
    selectedDate.value = parseTime(new Date(startYear, startMonth - 1), '{y}-{m}')
    generateMonthDateCache(startYear, startMonth)
}

// 根据current自动对轮播数据进行衔接排序
const adjacentSortByCurrent = (prev: any, cur: any, next: any) => {
    if (current.value === 0) return [cur, next, prev]
    if (current.value === 1) return [prev, cur, next]
    if (current.value === 2) return [next, prev, cur]
}

// 对邻月/年进行缓存数据
const generateMonthDateCache = (year: any, month: any) => {
    year = Number(year)
    month = Number(month)
    const arry = []
    const SM = month < 7 ? 1 : 7
    arry.push(
        { year: SM === 7 ? year : year - 1, firstMonth: SM === 7 ? 1 : 7 },
        { year: year, firstMonth: SM },
        { year: SM === 7 ? year + 1 : year, firstMonth: SM === 7 ? 1 : 7 }
    )
    const [prev, cur, next] = arry
    monthDateCache.value = adjacentSortByCurrent(prev, cur, next)
    emitDate()
}

// 向父组件传递当前选中数据
const emitDate = () => {
    emit('change', {
        selectedDate: parseTime(new Date(getAssignDateInfo(false, 0), getAssignDateInfo(false, 1) - 1), '{y}-{m}')
    })
}

// 监听轮播切换
watch(current, (newV, oldV) => {
    if (newV === 0 && oldV === 2) {
        swiperChange(1)
        return
    }
    if (newV === 2 && oldV === 0) {
        swiperChange(-1)
        return
    }
    if (newV > oldV) {
        swiperChange(1)
    } else {
        swiperChange(-1)
    }
})

onMounted(() => {
    init()
})
</script>

<template>
    <!-- 月历滚动插件 -->
    <div class="statistic_month">
        <!-- 月历顶部信息 -->
        <div class="month_info">
            <picker mode="date" :value="selectedDate" fields="month" @change="bindDateChange">
                <span class="uni-month__header-text month__header-year">{{ getAssignDateInfo(false, 0) }}</span>
                <span class="uni-month__header-text month__header-month">{{ getAssignDateInfo(false, 1) }}月</span>
            </picker>
            <span v-show="showBackToTodayBtn" class="backToToday" :style="{ color: dateActiveColor }"
                @click="goToCurrentMonth">回到本月</span>
        </div>

        <!-- 月历轮播 -->
        <div class="month_swiper">
            <swiper key="normalSwiper" circular :style="{ height: swiperHeight }" :current="current"
                :duration="duration" :skip-hidden-item-layout="true" @change="e => current = e.detail.current"
                @transition="swiperTransition" @animationfinish="swiperTransitionFinish">
                <swiper-item v-for="(swiper, index) in 3" :key="index" class="swiper-item">
                    <month-box v-if="monthDateCache[index]" :cell-height="cellHeight" :start-month="monthDateCache[index].firstMonth"
                        :dateActiveColor="dateActiveColor" :textActiveColor="textActiveColor"
                        :selected-date="selectedDate"
                        :currentDate="`${getAssignDateInfo(true, 0)}-${getAssignDateInfo(true, 1)}`"
                        :showActive="showActive" @chooseDate="chooseDate" />
                </swiper-item>
            </swiper>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.statistic_month {
    width: 100%;
    // padding: 20rpx 0;
    padding: 20rpx 0 0 0;
    box-sizing: border-box;
    // background-color: #fff;
}

.month_swiper {
    border-bottom: 1px solid #F2F2F2;
}

/* 月历顶部信息 */
.month_info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20rpx;
}

.month_info .backToToday {
    margin-left: auto;
    font-size: 24rpx;
}

/* piker选择年月 */
.uni-month__header-text {
    font-size: 28rpx;
    // color: #333333;
    font-weight: bold;
}

.month__header-year {
    padding-right: 8rpx;
    border-right: 1px solid #F2F2F2;
}

.month__header-month {
    padding-left: 8rpx;
}
</style>
