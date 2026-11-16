<script lang="ts" setup>
import { reactive, ref, computed } from "vue";
import { useTheme } from "@/composables/theme/theme";
import { fetchGetTelecomDeviceOnlineNotice, fetchGetTelecomDeviceOnlineNoticePage, fetchGetTelecomOrderInfoBySerialNumber } from "@/service/sim";
import { onLoad, onPullDownRefresh } from "@dcloudio/uni-app";
const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === "dark");
const showCalendar = ref(false);
const areaMap = {
  "100133": "济南市", "100134": "青岛市", "100135": "淄博市", "100136": "枣庄市", "100137": "东营市",
  "100138": "烟台市", "100139": "潍坊市", "100140": "济宁市", "100141": "泰安市", "100142": "威海市",
  "100143": "日照市", "100145": "临沂市", "100146": "德州市", "100147": "聊城市", "100148": "滨州市",
  "100149": "菏泽市", "1001331": "莱芜市(国网)"
};
const areaOptions = computed(() => Object.entries(areaMap).map(([value, label]) => ({ label, value })));
const onlineForm = reactive({ iccid: "", msisdn: "", imsi: "", upTime: null, upAreaCode: undefined });
const onlineLoading = ref(false);
const onlineResult = ref("");
const showOnlineResult = ref(false);
function handleClickLeft() { uni.navigateBack(); }
function handleCalendarConfirm(timestamp) {
  onlineForm.upTime = timestamp;
}
const handleOnlineSubmit = async () => {
  if (!onlineForm.iccid && !onlineForm.msisdn && !onlineForm.imsi) { uni.showToast({ title: "ICCID、接入号、IMSI 至少填写一项", icon: "none" }); return; }
  if (!onlineForm.upTime) { uni.showToast({ title: "请选择上线时间", icon: "none" }); return; }
  if (!onlineForm.upAreaCode) { uni.showToast({ title: "请选择上线地市", icon: "none" }); return; }
  onlineLoading.value = true;
  showOnlineResult.value = false;
  try {
    const upTimeStr = onlineForm.upTime ? new Date(onlineForm.upTime).toISOString().replace("T", " ").slice(0, 19) : "";
    const params = { iccid: onlineForm.iccid || "", msisdn: onlineForm.msisdn || "", imsi: onlineForm.imsi || "", upTime: upTimeStr, upAreaCode: onlineForm.upAreaCode };
    const res = await fetchGetTelecomDeviceOnlineNotice(params);
    if (!res.error) {
      onlineResult.value = res.data?.transactionId || "提交成功";
      showOnlineResult.value = true;
      fetchList();
      uni.showToast({ title: "设备在线通知提交成功", icon: "success" });
      Object.assign(onlineForm, { iccid: "", msisdn: "", imsi: "", upTime: null, upAreaCode: undefined });
    } else { uni.showToast({ title: res.error?.message || "提交失败", icon: "none" }); }
  } catch (error) { uni.showToast({ title: "提交失败，请重试", icon: "none" }); } finally { onlineLoading.value = false; }
};
const queryParams = reactive({ fuzzy: "" });
const loading = ref(false);
const tableData = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, itemCount: 0 });
function formatCalendarTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const p = n => n.toString().padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}
function formatTime(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  const pad = n => n.toString().padStart(2, "0");
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
}
async function fetchList() {
  loading.value = true;
  try {
    const params = { page: pagination.page, limit: pagination.pageSize, fuzzy: queryParams.fuzzy };
    const res = await fetchGetTelecomDeviceOnlineNoticePage(params);
    if (res?.data) { tableData.value = res.data.list || []; pagination.itemCount = res.data.total || 0; }
    else if (res?.list) { tableData.value = res.list || []; pagination.itemCount = res.total || 0; }
    else { tableData.value = []; pagination.itemCount = 0; }
  } catch (error) { uni.showToast({ title: "查询列表失败", icon: "none" }); } finally { loading.value = false; }
}
function handleListSearch() { pagination.page = 1; fetchList(); }
function handleListReset() { queryParams.fuzzy = ""; pagination.page = 1; fetchList(); }


const handleViewOrder = (row) => {
  if (!row.transactionId) { uni.showToast({ title: "该记录无订单流水号", icon: "none" }); return; }
  uni.navigateTo({ url: `/mePages/simCardAreaManage/orderDetail?id=${row.id}` });
};
onLoad(() => { fetchList(); });
onPullDownRefresh(() => { fetchList(); setTimeout(() => { uni.hideNavigationBarLoading(); uni.stopPullDownRefresh(); }, 1000); });
</script>
<template>
  <wd-config-provider :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f5f5;'"
    :theme="theme">
    <wd-navbar left-arrow title="SIM卡区域管理" safe-area-inset-top placeholder :bordered="false"
      :custom-style="isDark ? 'background: #1b1b1b;' : 'background: #fff;'" @click-left="handleClickLeft" />
    <view class="page-content" :class="isDark ? 'dark' : ''">
      <view class="card operation-card">
        <view class="card-header">
          <view class="header-left"><text class="card-icon">📡</text>
            <view class="header-text"><text class="card-title">设备在线通知</text><text
                class="card-subtitle">提交设备上线信息，获取订单流水号</text></view>
          </view>
        </view>
        <view class="form-content">
          <view class="form-row">
    <view class="form-item">
      <text class="form-label">
        <text class="required-dot">*</text>
        ICCID
      </text>
      <wd-input
        v-model="onlineForm.iccid"
        placeholder="请输入ICCID"
        clearable
        :custom-style="{
          background: isDark ? '#252525' : '#f8fafc'
        }"
      />
    </view>

    <view class="form-item">
      <text class="form-label">
        <text class="required-dot">*</text>
        接入号
        <text class="form-label-tip">(MSISDN)</text>
      </text>
      <wd-input
        v-model="onlineForm.msisdn"
        placeholder="请输入接入号"
        clearable
        :custom-style="{
          background: isDark ? '#252525' : '#f8fafc'
        }"
      />
    </view>
  </view>

  <view class="form-row">
    <view class="form-item">
      <text class="form-label">
        <text class="required-dot">*</text>
        IMSI
      </text>
      <wd-input
        v-model="onlineForm.imsi"
        placeholder="请输入IMSI"
        clearable
        :custom-style="{
          background: isDark ? '#252525' : '#f8fafc'
        }"
      />
    </view>

    <view class="form-item">
      <text class="form-label">
        <text class="required-dot">*</text>
        上线地市
      </text>
      <wd-picker
        v-model="onlineForm.upAreaCode"
        :columns="areaOptions"
        placeholder="请选择上线地市"
        :custom-style="{
          background: isDark ? '#252525' : '#f8fafc'
        }"
      />
    </view>
  </view>
          <view class="form-row single">
            <view class="form-item">
              <text class="form-label">上线时间📅</text>
                <wd-calendar v-model="showCalendar" type="datetime"
                  :default-time="onlineForm.upTime ? new Date(onlineForm.upTime) : new Date()"
                  @confirm="handleCalendarConfirm" />
            </view>
          </view>
          <view class="form-actions"><wd-button type="primary" :loading="onlineLoading" @click="handleOnlineSubmit"
              custom-style="width: 100%;">提交通知</wd-button></view>
          <view v-if="showOnlineResult" class="result-box success-box"><text class="success-icon">✓</text><text
              class="success-text">通知提交成功！订单号：<text class="result-order">{{ onlineResult }}</text></text></view>
        </view>
      </view>
      <view class="card table-card">
        <view class="card-header">
          <view class="header-left"><text class="card-icon">📋</text>
            <view class="header-text"><text class="card-title">在线通知记录列表</text><text class="card-subtitle">共 {{
              pagination.itemCount }} 条记录</text></view>
          </view>
        </view>
        <view class="search-bar"><wd-input v-model="queryParams.fuzzy" placeholder="ICCID / MSISDN / IMSI" clearable
            :custom-style="{ background: isDark ? '#2a2a2a' : '#fff', width: '420rpx' }"
            @change="handleListSearch" /><wd-button type="primary" size="small"
            @click="handleListSearch">查询</wd-button><wd-button type="info" size="small" plain
            @click="handleListReset">重置</wd-button></view>
        <view class="list-content">
          <view v-if="loading" class="loading-wrap"><wd-loading type="ring" /></view>
          <view v-else-if="tableData.length === 0" class="empty-wrap"><wd-status-tip image="empty" content="暂无数据" />
          </view>
          <view v-else class="table-wrap">
            <view v-for="(item, index) in tableData" :key="index" class="table-item" :class="isDark ? 'dark' : ''">
              <view class="item-main">
                <view class="item-row">
                  <view class="item-cell"><text class="cell-label">ICCID</text><text class="cell-value">{{ item.iccid ||
                      '-' }}</text></view>
                  <view class="item-cell"><text class="cell-label">MSISDN</text><text class="cell-value">{{ item.msisdn
                      || '-' }}</text></view>
                </view>
                <view class="item-row">
                  <view class="item-cell"><text class="cell-label">IMSI</text><text class="cell-value">{{ item.imsi ||
                      '-' }}</text></view>
                  <view class="item-cell"><text class="cell-label">上线地市</text><text class="cell-value">{{
                    areaMap[item.upAreaCode] || item.upAreaCode || '-' }}</text></view>
                </view>
                <view class="item-row">
                  <view class="item-cell full"><text class="cell-label">上线时间</text><text class="cell-value">{{
                      formatTime(item.upTime) }}</text></view>
                </view>
                <view class="item-row">
                  <view class="item-cell full"><text class="cell-label">订单状态</text><text class="cell-value status">{{
                    item.orderStatus || '-' }}</text></view>
                </view>
              </view>
              <view class="item-action" @click="handleViewOrder(item)"><wd-button type="primary" size="small"
                  plain>查看订单</wd-button></view>
            </view>
          </view>
          <view v-if="tableData.length > 0" class="pagination"><wd-pagination :current="pagination.page"
              :page-size="pagination.pageSize" :total="pagination.itemCount" show-page-size
              @change="({ current }) => { pagination.page = current; fetchList(); }" /></view>
        </view>
      </view>
    </view>
  </wd-config-provider>
</template>
<style lang="scss" scoped>
.page-content {
  padding: 20rpx;
  padding-bottom: 40rpx;
}

.page-content.dark {
  background: #1b1b1b;
}

.card {
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card.dark {
  background: #2a2a2a;
}

.card-header {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.dark .card-header {
  border-bottom-color: #444;
}

.header-left {
  display: flex;
  align-items: flex-start;
}

.card-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2a44;
}

.dark .card-title {
  color: #e8e8e8;
}

.card-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

.form-content {
  padding: 24rpx;
}

.form-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.form-row.single .form-item {
  flex: 1;
}

.form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  min-width: 160rpx;
  white-space: nowrap;
}

.dark .form-label {
  color: #aaa;
}

.calendar-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  height: 72rpx;
  background: #fff;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.calendar-input.dark {
  background: #2a2a2a;
}

.calendar-placeholder {
  font-size: 28rpx;
  color: #999;
}

.calendar-text {
  font-size: 28rpx;
  color: #333;
}

.dark .calendar-text {
  color: #e0e0e0;
}

.calendar-icon {
  font-size: 28rpx;
}

.form-actions {
  margin-top: 20rpx;
}

.result-box {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f0f9f0;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.dark .result-box {
  background: #1a3d1a;
}

.dark .success-text {
  color: #a5d6a7;
}

.success-box {
  background: #e8f5e9;
  border: 1rpx solid #a5d6a7;
}

.success-icon {
  font-size: 32rpx;
  color: #4caf50;
  font-weight: bold;
}

.success-text {
  font-size: 26rpx;
  color: #2e7d32;
}

.result-order {
  font-weight: 600;
  color: #07c160;
}

.search-bar {
  padding: 20rpx 24rpx;
  display: flex;
  gap: 16rpx;
  align-items: center;
  flex-wrap: wrap;
  border-bottom: 1rpx solid #f0f0f0;
}

.dark .search-bar {
  border-bottom-color: #444;
}

.list-content {
  min-height: 400rpx;
}

.loading-wrap,
.empty-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300rpx;
}

.table-wrap {
  padding: 0 24rpx;
}

.table-item {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.dark .table-item {
  background: #383838;
}

.item-main {
  margin-bottom: 16rpx;
}

.item-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 12rpx;
}

.item-row:last-child {
  margin-bottom: 0;
}

.item-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-cell.full {
  flex: none;
  width: 100%;
}

.cell-label {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.cell-value {
  font-size: 26rpx;
  color: #333;
}

.dark .cell-value {
  color: #e0e0e0;
}

.cell-value.status {
  color: #1890ff;
  font-weight: 500;
}

.item-action {
  display: flex;
  justify-content: flex-end;
  border-top: 1rpx dashed #e0e0e0;
  padding-top: 16rpx;
}

.dark .item-action {
  border-top-color: #555;
}

.pagination {
  padding: 20rpx 24rpx;
  display: flex;
  justify-content: center;
}

.order-modal {
  padding: 32rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f2a44;
}

.dark .modal-title {
  color: #e8e8e8;
}

.modal-content {
  margin-bottom: 32rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.dark .detail-row {
  border-bottom-color: #444;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
}

.dark .detail-label {
  color: #aaa;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.dark .detail-value {
  color: #e0e0e0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}
.form-content {
  padding: 28rpx 24rpx 24rpx;
}

.form-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.form-row.single {
  margin-bottom: 0;
}

.form-row.single .form-item {
  flex: 1;
}

.form-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.form-label {
  display: flex;
  align-items: center;
  height: 40rpx;
  margin-bottom: 12rpx;

  font-size: 26rpx;
  line-height: 40rpx;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.dark .form-label {
  color: #e5e5e5;
}

.required-dot {
  margin-right: 4rpx;
  color: #f5222d;
  font-size: 26rpx;
}

.form-label-tip {
  margin-left: 4rpx;
  font-size: 22rpx;
  font-weight: 400;
  color: #999;
}

.dark .form-label-tip {
  color: #888;
}

/* 输入框 */
.form-item :deep(.wd-input) {
  min-height: 76rpx;
  box-sizing: border-box;
  border: 1rpx solid #e5e7eb;
  border-radius: 10rpx;
  transition: all 0.2s;
  padding:0 16rpx;
}

.form-item :deep(.wd-input__inner) {
  font-size: 27rpx;
}

.dark .form-item :deep(.wd-input) {
  border-color: #444;
}

/* 输入框聚焦效果 */
.form-item :deep(.wd-input:focus-within) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2rpx rgba(24, 144, 255, 0.08);
}

/* 时间选择 */
.calendar-input {
  width: 100%;
  height: 76rpx;
  padding: 0 22rpx;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #f8fafc;
  border: 1rpx solid #e5e7eb;
  border-radius: 10rpx;

  transition: all 0.2s;
}

.calendar-input.dark {
  background: #252525;
  border-color: #444;
}

.calendar-input:active {
  border-color: #1890ff;
  background: #f5faff;
}

.dark .calendar-input:active {
  background: #292929;
}

.calendar-placeholder {
  font-size: 27rpx;
  color: #999;
}

.calendar-text {
  font-size: 27rpx;
  color: #333;
}

.dark .calendar-text {
  color: #e5e5e5;
}

.calendar-icon {
  flex-shrink: 0;
  margin-left: 12rpx;
  font-size: 28rpx;
}

/* 提交按钮 */
.form-actions {
  margin-top: 28rpx;
}

.form-actions :deep(.wd-button) {
  font-size: 29rpx;
  font-weight: 500;
}

/* 成功提示 */
.result-box {
  margin-top: 20rpx;
  padding: 20rpx 24rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-sizing: border-box;
}

.success-box {
  background: #f0f9f3;
  border: 1rpx solid #b7ebc6;
}

.dark .success-box {
  background: #1d3525;
  border-color: #315b3d;
}

.success-icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;
  background: #52c41a;
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

.success-text {
  flex: 1;
  font-size: 25rpx;
  line-height: 38rpx;
  color: #389e0d;
}

.dark .success-text {
  color: #95de64;
}

.result-order {
  font-weight: 600;
  word-break: break-all;
}
</style>
