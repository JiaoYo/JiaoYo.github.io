<template>
  <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
    <view class="page">
      <view :style="{ height: topFixedHeight + 'px' }"></view>

      <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#FFFFFF' }">
        <wd-navbar left-arrow title="客户服务评价" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

        <view class="filter-area">
          <wd-search v-model="dataForm.fuzzy" placeholder="项目名称/工程师姓名" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

          <view class="date-range-wrap">
            <wd-datetime-picker type="date" :z-index="9999" v-model="dataForm.dates" :default-value="defaultValue" align-right label="评价日期" label-width="90px" custom-style="width: calc(100vw - 40rpx);" @confirm="handleConfirmDatesChange" />
            <wd-button v-if="dataForm.dates?.length === 2" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearDateChange" />
          </view>
        </view>
        
        <view class="summary-bar">
          <view class="summary-chip" :style="{ background: isDark ? '#3a3a3a' : '#f7f8fa', color: isDark ? '#8a9099' : '#4e5969' }">
            <text class="summary-dot"></text>
            <text class="summary-text">已加载 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="summary-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</text>
          </view>
          <view class="stats-btn-row">
            <view class="stats-btn" @click="goToStats">
              <wd-icon name="chart" size="18px" color="#fff" />
              <text class="stats-btn-text">评价统计</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="dataList.length > 0" class="list-content">
        <view v-for="(item, index) in dataList" :key="index" class="list-item" :style="{ background: cardBg, boxShadow: isDark ? '0 0 0 1rpx #3a3a3a' : 'none' }" @click="openDetail(item)">
          <view class="item-header">
            <text class="item-project">{{ pick(item, 'projectName') || '-' }}</text>
            <text class="status-tag" :style="getResolutionStyle(num(item, 'resolutionStatus'))">{{ getResolutionLabel(num(item, 'resolutionStatus')) }}</text>
          </view>
          <view class="item-engineer">
            <wd-icon name="user" size="14px" color="#999" />
            <text class="item-engineer-text">{{ pick(item, 'debugEngineerName') || '-' }}</text>
          </view>
          <view class="item-scores">
            <view class="score-item">
              <text class="score-label">总体满意度</text>
              <wd-rate readonly :model-value="num(item, 'overallSatisfaction')" size="12px" />
            </view>
            <view class="score-item">
              <text class="score-label">推荐意愿</text>
              <text class="score-value">{{ pick(item, 'recommendScore') ?? '-' }}/10</text>
            </view>
          </view>
          <view class="item-footer">
            <text class="item-time">{{ pick(item, 'submittedTime') || '-' }}</text>
          </view>
        </view>
        <wd-loadmore :state="listState" @reload="refresh" />
        <wd-backtop :bottom="110" :scroll-top="scrollTop" custom-style="background: #007aff; color:white;" />
      </view>

      <view v-else-if="listState !== 'loading'" :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: cardBg }">
        <wd-status-tip image="../../static/search.png" tip="暂无评价数据" />
      </view>
    </view>
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { getSystemDate } from '@/utils/index';
import { fetchGetFeedbackPage, fetchGetFeedbackStats } from '@/service/signServiceFeedback';
import { fetchGetPrjDataList, fetchGetAllUserDataList } from '@/service/index';
import { onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const cardBg = computed(() => isDark.value ? '#2a2a2a' : '#ffffff');

function handleBack() {
  // #ifdef H5
  history.go(-1);
  // #endif
  // #ifndef H5
  uni.navigateBack();
  // #endif
}

const topFixedHeight = ref<number>(0);
const scrollTop = ref<number>(0);
const listState = ref<'loading' | 'loadmore' | 'finished' | 'error'>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const listLoading = ref(false);
let pendingReload = false;

const defaultValue = ref<number[]>([Date.now() - 1000 * 60 * 60 * 24 * 7, Date.now()]);
const dataForm = reactive({
  page: 1,
  limit: 20,
  fuzzy: '',
  dates: [] as number[],
  projectId: undefined as number | undefined,
  debugEngineerId: undefined as number | undefined,
});

const stats = ref<any>({});

const prjShow = ref(false);
const prjFuzzy = ref('');
const prjDataList = ref<any[]>([]);
const prjPage = ref(1);
const prjTotal = ref(0);
const prjTriggered = ref(false);
const prjState = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore');
const projectName = ref('');

const engineerShow = ref(false);
const engineerFuzzy = ref('');
const engineerDataList = ref<any[]>([]);
const engineerPage = ref(1);
const engineerTotal = ref(0);
const engineerTriggered = ref(false);
const engineerState = ref<'loadmore' | 'loading' | 'finished' | 'error'>('loadmore');
const engineerName = ref('');

function pick(row: any, key: string) {
  if (!row) return undefined;
  const snake = key.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
  return row?.[key] ?? row?.[snake];
}

function num(row: any, key: string) {
  const v = pick(row, key);
  return v != null && v !== '' ? Number(v) : 0;
}

const RESOLUTION_MAP: Record<number, { label: string; type: string }> = {
  1: { label: '未解决', type: 'danger' },
  2: { label: '部分解决', type: 'warning' },
  3: { label: '彻底解决', type: 'success' }
};

const RESOLUTION_STYLE_MAP: Record<number, { bg: string; color: string }> = {
  1: { bg: '#fff1f0', color: '#f5222d' },
  2: { bg: '#fff7e6', color: '#fa8c16' },
  3: { bg: '#f6ffed', color: '#52c41a' }
};

function getResolutionLabel(status?: number) {
  if (!status) return '-';
  return RESOLUTION_MAP[status]?.label || String(status);
}

function getResolutionStyle(status?: number) {
  const s = RESOLUTION_STYLE_MAP[status || 0] || { bg: '#f4f4f5', color: '#909399' };
  return { background: s.bg, color: s.color };
}

function scoreColor(score?: number | string | null) {
  if (!score && score !== 0) return '#999';
  const s = Number(score);
  if (s >= 4) return '#18a058';
  if (s >= 3) return '#faad14';
  return '#f5222d';
}


function handleLinkPrjShowChange() { prjShow.value = true; if (prjDataList.value.length === 0) handlePrjSearchChange(); }
function handlePrjSearchChange() { prjPage.value = 1; prjDataList.value = []; getPrjDataList(); }
function handlePrjClearChange() { prjFuzzy.value = ''; handlePrjSearchChange(); }
function handlePrjRefreshChange() { prjTriggered.value = true; handlePrjSearchChange(); setTimeout(() => { prjTriggered.value = false; }, 1000); }
function handlePrjScrolltolowerChange() { if (prjState.value === 'finished' || prjState.value === 'loading') return; prjPage.value++; getPrjDataList(); }

async function getPrjDataList() {
  if (prjPage.value === 1) prjDataList.value = [];
  prjState.value = 'loading';
  try {
    const data = await fetchGetPrjDataList({ page: prjPage.value, limit: 50, fuzzy: prjFuzzy.value });
    prjTotal.value = Number(data.total);
    prjDataList.value = prjDataList.value.concat(data.list || []);
    prjState.value = prjDataList.value.length >= prjTotal.value ? 'finished' : 'loadmore';
  } catch (err) { console.error('获取项目列表失败', err); prjState.value = 'error'; }
}

function handlePrjSelectChange() {
  const prj = prjDataList.value.find(p => p.id === dataForm.projectId);
  projectName.value = prj?.proname || '';
  prjShow.value = false;
  handleSearchChange();
}

function handleClearProjectChange() { dataForm.projectId = undefined; projectName.value = ''; handleSearchChange(); }

function handleLinkEngineerShowChange() { engineerShow.value = true; if (engineerDataList.value.length === 0) handleEngineerSearchChange(); }
function handleEngineerSearchChange() { engineerPage.value = 1; engineerDataList.value = []; getEngineerDataList(); }
function handleEngineerClearChange() { engineerFuzzy.value = ''; handleEngineerSearchChange(); }
function handleEngineerRefreshChange() { engineerTriggered.value = true; handleEngineerSearchChange(); setTimeout(() => { engineerTriggered.value = false; }, 1000); }
function handleEngineerScrolltolowerChange() { if (engineerState.value === 'finished' || engineerState.value === 'loading') return; engineerPage.value++; getEngineerDataList(); }

async function getEngineerDataList() {
  if (engineerPage.value === 1) engineerDataList.value = [];
  engineerState.value = 'loading';
  try {
    const data = await fetchGetAllUserDataList({ page: engineerPage.value, limit: 50, fuzzy: engineerFuzzy.value, usertypes: '2,3,9' });
    engineerTotal.value = Number(data.total);
    engineerDataList.value = engineerDataList.value.concat((data.list || []).filter((item: any) => item.status === 0));
    engineerState.value = engineerDataList.value.length >= engineerTotal.value ? 'finished' : 'loadmore';
  } catch (err) { console.error('获取工程师列表失败', err); engineerState.value = 'error'; }
}

function handleEngineerSelectChange() {
  const eng = engineerDataList.value.find(u => u.id === dataForm.debugEngineerId);
  engineerName.value = eng?.username || '';
  engineerShow.value = false;
  handleSearchChange();
}

function handleClearEngineerChange() { dataForm.debugEngineerId = undefined; engineerName.value = ''; handleSearchChange(); }

function handleSearchChange() { dataForm.page = 1; getDataList(); }
function handleClearChange() { dataForm.fuzzy = ''; handleSearchChange(); }
function handleConfirmDatesChange({ value }: { value: number[] }) { dataForm.dates = value || []; handleSearchChange(); }
function handleClearDateChange() { dataForm.dates = []; handleSearchChange(); }

async function getDataList() {
  if (listLoading.value) { pendingReload = true; return; }
  listLoading.value = true;
  if (dataForm.page === 1) listState.value = 'loading';
  else listState.value = 'loadmore';
  try {
    const queryParams: Record<string, any> = { page: dataForm.page, limit: dataForm.limit };
    if (dataForm.fuzzy) queryParams.fuzzy = dataForm.fuzzy.trim();
    if (dataForm.dates?.length === 2) {
      queryParams.startTime = getSystemDate(0, dataForm.dates[0]) + ' 00:00:00';
      queryParams.endTime = getSystemDate(0, dataForm.dates[1]) + ' 23:59:59';
    }
    if (dataForm.projectId) queryParams.projectId = dataForm.projectId;
    if (dataForm.debugEngineerId) queryParams.debugEngineerId = dataForm.debugEngineerId;
    const res = await fetchGetFeedbackPage(queryParams);
    if (dataForm.page === 1) dataList.value = [];
    dataList.value = dataList.value.concat(res.list || []);
    total.value = Number(res.total || 0);
    listState.value = dataList.value.length >= total.value ? 'finished' : 'loadmore';
  } catch (err) { console.error('获取评价列表失败', err); listState.value = 'error'; }
  finally { listLoading.value = false; if (pendingReload) { pendingReload = false; getDataList(); } }
}

async function loadStats() {
  try { const res = await fetchGetFeedbackStats(); stats.value = res || {}; }
  catch (err) { console.error('获取统计数据失败', err); }
}

function openDetail(item: any) {
  uni.navigateTo({
    url: `/mePages/signServiceFeedback/detail?data=${encodeURIComponent(JSON.stringify(item))}`
  });
}
function goToStats() { uni.navigateTo({ url: '/mePages/signServiceFeedback/stats' }); }
function loadMore() { if (listLoading.value || listState.value === 'finished') return; dataForm.page++; getDataList(); }
function refresh() { dataForm.page = 1; getDataList(); loadStats(); }

function recalcTopFixedHeight() {
  try {
    uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => {
      if (rect && rect.height !== undefined) topFixedHeight.value = rect.height;
    }).exec();
  } catch (err) { topFixedHeight.value = 350; }
}

onMounted(() => { getDataList(); loadStats(); nextTick(() => { setTimeout(() => { recalcTopFixedHeight(); }, 100); }); });
onPageScroll((e: any) => { scrollTop.value = e.scrollTop; });
onPullDownRefresh(() => { refresh(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 800); });
onReachBottom(() => { loadMore(); });
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; box-sizing: border-box; }
.topFixedWrap { position: fixed; left: 0; top: 0; width: 100%; z-index: 99; background-color: #FFFFFF; box-sizing: border-box; }
.filter-area { padding: 20rpx; }
.date-range-wrap { display: flex; align-items: center; }
.filter-row { display: flex; align-items: center; margin-top: 16rpx; gap: 12rpx; }
.filter-label { width: 90px; font-size: 28rpx; color: #666; flex-shrink: 0; }
.prjSearchWrap { position: relative; flex: 1; }
.prjSearchMask { position: absolute; left: 0; top: 0; right: 0; bottom: 0; z-index: 10; }
.stats-btn { display: flex; align-items: center; justify-content: center; gap: 8rpx; padding: 5rpx 12rpx; background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%); border-radius: 12rpx; }
.stats-btn-text { font-size: 28rpx; color: #fff; font-weight: 500; }
.stats-cards { display: flex; gap: 20rpx; padding: 0 20rpx 20rpx; }
.stats-card { flex: 1; display: flex; align-items: center; gap: 16rpx; padding: 24rpx; border-radius: 16rpx; }
.stats-icon { width: 80rpx; height: 80rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; }
.stats-info { display: flex; flex-direction: column; gap: 8rpx; }
.stats-label { font-size: 24rpx; color: #999; }
.stats-value { font-size: 36rpx; font-weight: 600; color: #333; }
.summary-bar { padding: 0 24rpx 14rpx; display: flex; align-items: center; justify-content: space-between; }
.summary-chip { display: inline-flex; align-items: center; gap: 10rpx; padding: 8rpx 20rpx; border-radius: 999rpx; font-size: 24rpx; }
.summary-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%); }
.summary-num { font-weight: 600; margin: 0 4rpx; }
.list-content { padding: 20rpx; }
.list-item { margin-bottom: 20rpx; padding: 24rpx; border-radius: 20rpx; }
.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; gap: 16rpx; }
.item-project { font-size: 30rpx; font-weight: 600; color: #333; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-tag { padding: 6rpx 16rpx; border-radius: 16rpx; font-size: 22rpx; white-space: nowrap; flex-shrink: 0; }
.item-engineer { display: flex; align-items: center; gap: 8rpx; margin-bottom: 16rpx; }
.item-engineer-text { font-size: 26rpx; color: #666; }
.item-scores { display: flex; gap: 40rpx; margin-bottom: 16rpx; }
.score-item { display: flex; align-items: center; gap: 12rpx; }
.score-label { font-size: 24rpx; color: #999; }
.score-value { font-size: 28rpx; font-weight: 600; color: #18a058; }
.item-footer { display: flex; justify-content: flex-end; }
.item-time { font-size: 24rpx; color: #999; }
.detail-popup { max-height: 80vh; display: flex; flex-direction: column; }
.detail-header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #eee; }
.detail-title { font-size: 32rpx; font-weight: 600; }
.detail-content { flex: 1; padding: 20rpx; max-height: 60vh; }
.detail-section { margin-bottom: 32rpx; }
.section-title { font-size: 28rpx; font-weight: 600; color: #333; margin-bottom: 16rpx; padding-left: 16rpx; border-left: 4rpx solid #18a058; }
.rating-list { display: flex; flex-direction: column; gap: 20rpx; }
.rating-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx; background: #f8f9fa; border-radius: 12rpx; }
.rating-label { font-size: 28rpx; color: #666; }
.rating-score { font-size: 32rpx; font-weight: 600; color: #18a058; }
.feedback-list { display: flex; flex-direction: column; gap: 20rpx; }
.feedback-item { padding: 20rpx; background: #f8f9fa; border-radius: 12rpx; }
.feedback-label { display: block; font-size: 24rpx; color: #999; margin-bottom: 12rpx; }
.feedback-content { display: block; font-size: 28rpx; color: #333; line-height: 1.6; white-space: pre-wrap; }
.radioCellWrap { padding: 10rpx 20rpx !important; }
:deep(.wd-radio__label) { text-align: left !important; }
:deep(.wd-radio) { margin-right: 0 !important; }
.wot-theme-dark {
  .topFixedWrap { background-color: #1b1b1b !important; }
  .stats-card { background: #2a2a2a; }
  .stats-value { color: #fff; }
  .item-project { color: #fff; }
  .item-engineer-text { color: #999; }
  .detail-header { border-bottom-color: #3a3a3a; }
  .section-title { color: #fff; }
  .rating-item, .feedback-item { background: #2a2a2a; }
  .rating-label, .feedback-content { color: #fff; }
  :deep(.wd-search) { background: #2a2a2a !important; }
}
</style>