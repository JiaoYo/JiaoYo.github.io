<template>
  <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
    <view class="page" :class="{ dark: isDark }">
      <wd-navbar left-arrow :title="personName + ' - 日报明细'" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <scroll-view :scroll-y="true" class="content-scroll" @scrolltolower="loadMore">
        <view class="content-inner">
          <!-- 统计信息条 -->
          <view class="info-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="info-row">
              <text class="info-label" :style="{ color: subColor }">统计周期</text>
              <text class="info-value" :style="{ color: textColor }">{{ period || '-' }}</text>
            </view>
            <view class="info-row">
              <text class="info-label" :style="{ color: subColor }">统计区间</text>
              <text class="info-value" :style="{ color: textColor }">{{ startTime && endTime ? startTime + ' ~ ' + endTime : '-' }}</text>
            </view>
            <view v-if="pid" class="info-row">
              <text class="info-label" :style="{ color: subColor }">项目筛选</text>
              <text class="info-value" :style="{ color: textColor }">已按当前项目筛选</text>
            </view>
            <view class="info-row">
              <text class="info-label" :style="{ color: subColor }">日报数</text>
              <text class="info-value" :style="{ color: '#2d8cf0' }">共 {{ fmtNum(total) }} 份</text>
            </view>
          </view>

          <!-- 日报明细列表 -->
          <view v-for="item in rows" :key="String(item.id)" class="day-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="day-head">
              <text class="day-time" :style="{ color: textColor }">{{ item.dbtime || '-' }}</text>
              <view class="day-head-right">
                <text class="day-img" :style="{ color: subColor }">图片 {{ fmtNum(item.filenum) }}</text>
                <view class="day-type" :class="{ sup: Number(item.status) === 2 }">{{ Number(item.status) === 2 ? '补录' : '日报' }}</view>
              </view>
            </view>
            <!-- 项目名称 chips（多项目逗号拼接拆开） -->
            <view v-if="item.projectNames.length" class="proj-wrap">
              <text v-for="(name, i) in item.projectNames" :key="i + name" class="proj-chip">{{ name }}</text>
            </view>
            <!-- 工作内容：每个项目一张卡片 -->
            <view v-if="item.contextItems.length">
              <view v-for="(it, i) in item.contextItems" :key="i" class="ctx-card" :style="{ background: isDark ? '#333333' : '#fafafa' }">
                <view v-if="it.proname" class="ctx-title" :style="{ color: textColor }">📌 {{ it.proname }}</view>
                <view class="ctx-body" :style="{ color: isDark ? '#b8c0cc' : '#555555' }">{{ it.notes || '-' }}</view>
              </view>
            </view>
            <view v-else class="ctx-empty" :style="{ color: subColor }">-</view>
          </view>

          <view v-if="!rows.length && !listLoading" class="empty" :style="{ color: subColor }">该统计区间内暂无日报明细</view>
          <view v-if="listLoading" class="list-foot" :style="{ color: subColor }">加载中...</view>
          <view v-else-if="rows.length && !hasNextPage" class="list-foot" :style="{ color: subColor }">没有更多了</view>
        </view>
      </scroll-view>
    </view>
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/theme/theme'
import { fetchGetPrjdailyreportList } from '@/service/projectdailyreport'

const { themeVars, theme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

function handleBack() {
  // #ifdef H5
  history.go(-1)
  // #endif
  // #ifndef H5
  uni.navigateBack()
  // #endif
}

/** 计数：null/undefined 视为 0 */
function fmtCount(v: any) {
  return v == null ? 0 : Number(v) || 0
}
/** 千分位计数 */
function fmtNum(v: any) {
  return fmtCount(v).toLocaleString('en-US')
}

/** 解析 context(JSON 字符串)：项目名称拆出全部项目名（多项目逗号拼接），工作内容按项目逐条展示 */
function parseContextItem(item: any) {
  let parsed: any = null
  try {
    parsed = JSON.parse(item.context)
  } catch (e) {
    parsed = null
  }
  const projects = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
  const contextItems = projects.map((p: any) => ({
    proname: p && p.proname ? p.proname : '',
    notes: p && p.notes ? String(p.notes) : '',
  }))
  const names: string[] = []
  projects.forEach((p: any) => {
    String((p && p.proname) || '')
      .split(/[,，]/)
      .map((n: string) => n.trim())
      .filter(Boolean)
      .forEach((n: string) => names.push(n))
  })
  return { contextItems, projectNames: names }
}

/* ---------------- 查询参数：来自列表页（沿用统计响应里的包含式起止时间；注意 statrtTime 为后端既有拼写） ---------------- */
const personId = ref<number | null>(null)
const personName = ref('-')
const period = ref('')
const startTime = ref('')
const endTime = ref('')
const pid = ref('')

const PAGE_SIZE = 20
const rows = ref<any[]>([])
const total = ref(0)
const hasNextPage = ref(false)
const page = ref(1)
const listLoading = ref(false)
let reqSeq = 0

async function loadData(append = false) {
  if (!personId.value || !startTime.value || !endTime.value) return
  const seq = ++reqSeq
  if (!append) page.value = 1
  listLoading.value = true
  if (!append) uni.showLoading({ title: '查询中...', mask: true })
  try {
    const params: any = {
      page: page.value,
      limit: PAGE_SIZE,
      statrtTime: startTime.value,
      endTime: endTime.value,
      creater: personId.value,
    }
    if (pid.value) params.pid = pid.value
    const data: any = await fetchGetPrjdailyreportList(params)
    if (seq !== reqSeq) return // 已发出更新的查询，丢弃本次旧响应
    const list = (data?.list || []).map((item: any) => ({ ...item, ...parseContextItem(item) }))
    const next = append ? rows.value.concat(list) : list
    // app 端嵌套 template 数组整体替换的渲染坑：先置空再赋值
    rows.value = []
    rows.value = next
    total.value = fmtCount(data?.total)
    hasNextPage.value = rows.value.length < total.value
  } catch (e) {
    console.error('获取日报明细失败', e)
  } finally {
    if (seq === reqSeq) {
      listLoading.value = false
      uni.hideLoading()
    }
  }
}

/** 滚动到底：在途保护 + 无下一页直接跳过 */
function loadMore() {
  if (listLoading.value || !hasNextPage.value) return
  page.value += 1
  loadData(true)
}

onLoad((options: any) => {
  personId.value = options.userId ? Number(options.userId) : null
  personName.value = options.username ? decodeURIComponent(options.username) : '-'
  period.value = options.period ? decodeURIComponent(options.period) : ''
  startTime.value = options.startTime || ''
  endTime.value = options.endTime || ''
  pid.value = options.pid || ''
  loadData()
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.content-scroll {
  flex: 1;
  min-height: 0;
}
.content-inner {
  padding: 20rpx;
}

/* 统计信息条 */
.info-card {
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
}
.info-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  padding: 6rpx 0;
}
.info-label {
  flex-shrink: 0;
  font-size: 22rpx;
  width: 120rpx;
}
.info-value {
  font-size: 24rpx;
  line-height: 1.5;
}

/* 日报明细卡 */
.day-card {
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.day-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.day-time {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 600;
}
.day-head-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.day-img {
  font-size: 22rpx;
}
.day-type {
  font-size: 20rpx;
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.1);
  border-radius: 8rpx;
  padding: 4rpx 14rpx;
}
.day-type.sup {
  color: #64748b;
  background: rgba(100, 116, 139, 0.12);
}

/* 项目名称 chips：蓝底左粗边，与 web 的 chip 样式一致 */
.proj-wrap {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.proj-chip {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4rpx 18rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #1890ff;
  background: #e6f4ff;
  border: 1rpx solid #d9e8ff;
  border-left: 6rpx solid #1890ff;
  border-radius: 10rpx;
}

/* 工作内容卡片：每个项目一张 */
.ctx-card {
  margin-top: 14rpx;
  border-radius: 14rpx;
  padding: 18rpx 20rpx;
  border: 1rpx solid rgba(128, 128, 128, 0.12);
}
.ctx-title {
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}
.ctx-body {
  font-size: 24rpx;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
}
.ctx-empty {
  margin-top: 12rpx;
  font-size: 24rpx;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  font-size: 26rpx;
}
.list-foot {
  text-align: center;
  padding: 16rpx 0 32rpx;
  font-size: 22rpx;
}

/* ---------------- 暗黑模式 ---------------- */
.page.dark .day-type {
  color: #69b1ff;
  background: rgba(105, 177, 255, 0.12);
}
.page.dark .day-type.sup {
  color: #a8b3c0;
  background: rgba(168, 179, 192, 0.14);
}
.page.dark .proj-chip {
  color: #79c0ff;
  background: rgba(56, 139, 253, 0.16);
  border-color: rgba(56, 139, 253, 0.35);
}
</style>
