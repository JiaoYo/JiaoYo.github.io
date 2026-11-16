<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow title="WorkBuddy管理" safe-area-inset-top placeholder :bordered="false" :custom-style="isDark ? 'background: #1b1b1b;' : ''" @click-left="handleClickLeft" />
        <view v-if="viewMode === 'list'" class="page-inner">
            <wd-tabs v-model="activeTab" :custom-style="isDark ? 'background: #2a2a2a;' : ''">
                <wd-tab title="专家来源" name="connector">
                    <view class="tab-body">
                        <view class="tip-bar" :style="{ background: isDark ? '#2a2a2a' : '#f0f7ff', color: isDark ? '#8a9099' : '#646566' }">维护允许接入 WorkBuddy 的专家 source 白名单；停用后新 OAuth 注册、新授权被拒绝，已签发 token 默认继续到期。改动即时生效，无需重启。</view>
                        <view class="tool-row">
                            <wd-search v-model="connectorKeyword" placeholder="按source或展示名称过滤" hide-cancel />
                            <wd-button size="small" type="primary" @click="goConnectorForm()">新增 source</wd-button>
                        </view>
                        <view v-if="filteredConnectors.length > 0" class="card-list">
                            <view v-for="c in filteredConnectors" :key="c.source" class="card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click="goConnectorForm(c)">
                                <view class="card-head">
                                    <text class="card-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ c.display_name || c.source }}</text>
                                    <view class="status-tag" :style="c.status === 'ACTIVE' ? { background: 'rgba(82,196,26,0.15)', color: '#52c41a' } : { background: 'rgba(255,77,79,0.15)', color: '#ff4d4f' }">{{ c.status === 'ACTIVE' ? '启用' : '停用' }}</view>
                                </view>
                                <view class="card-row" :style="{ color: isDark ? '#8a9099' : '#969799' }">
                                    <text>source：{{ c.source }}</text>
                                </view>
                                <view class="card-row" :style="{ color: isDark ? '#8a9099' : '#969799' }">
                                    <text>scopes：{{ c.allowed_scopes || '-' }}</text>
                                </view>
                                <view class="card-foot">
                                    <text class="foot-time" :style="{ color: isDark ? '#6a6a6a' : '#999' }">{{ c.created_at || '' }}</text>
                                    <view class="foot-ops" @click.stop>
                                        <text class="op-link" @click.stop="goConnectorForm(c)">编辑</text>
                                        <text class="op-link" :style="{ color: c.status === 'ACTIVE' ? '#ff4d4f' : '#52c41a' }" @click.stop="toggleConnector(c)">{{ c.status === 'ACTIVE' ? '停用' : '启用' }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>
                        <view v-else class="empty-wrap" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                            <wd-status-tip image="../../static/search.png" :tip="connectorKeyword ? '没有匹配的 source' : '暂无专家来源，点击右上角新增'" />
                        </view>
                    </view>
                </wd-tab>
                <wd-tab title="外部客户账户" name="account">
                    <view class="tab-body">
                        <view class="tip-bar" :style="{ background: isDark ? '#2a2a2a' : '#f0f7ff', color: isDark ? '#8a9099' : '#646566' }">外部客户账户由短信验证码登录自动创建；禁用后该手机号无法再发起验证码。真实手机号仅详情可见。</view>
                        <view class="tool-row">
                            <wd-search v-model="accountPhone" placeholder="输入手机号过滤" cancel-txt="搜索" @search="getAccounts" @cancel="getAccounts" @clear="clearAccountPhone" />
                        </view>
                        <view v-if="accountList.length > 0" class="card-list">
                            <view v-for="a in accountList" :key="a.id" class="card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click="openAccountDetail(a)">
                                <view class="card-head">
                                    <text class="card-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ a.phone_masked || '-' }}</text>
                                    <view class="status-tag" :style="a.status === 'ACTIVE' ? { background: 'rgba(82,196,26,0.15)', color: '#52c41a' } : { background: 'rgba(255,77,79,0.15)', color: '#ff4d4f' }">{{ a.status === 'ACTIVE' ? '正常' : '已禁用' }}</view>
                                </view>
                                <view class="card-row" :style="{ color: isDark ? '#8a9099' : '#969799' }">
                                    <text>ID：{{ a.id }}</text>
                                    <text>登录成功 {{ a.success_login_count || 0 }} 次 / 失败 {{ a.failed_login_count || 0 }} 次</text>
                                </view>
                                <view class="card-row" :style="{ color: isDark ? '#8a9099' : '#969799' }">
                                    <text>最近登录：{{ a.last_login_at || '从未登录' }}</text>
                                    <text v-if="a.last_login_ip">IP：{{ a.last_login_ip }}</text>
                                </view>
                                <view class="card-foot">
                                    <text class="foot-time" :style="{ color: isDark ? '#6a6a6a' : '#999' }">短信 {{ a.sms_send_count || 0 }} 条</text>
                                    <view class="foot-ops" @click.stop>
                                        <text class="op-link" @click.stop="openAccountDetail(a)">详情</text>
                                        <text class="op-link" :style="{ color: a.status === 'ACTIVE' ? '#ff4d4f' : '#52c41a' }" @click.stop="toggleAccount(a)">{{ a.status === 'ACTIVE' ? '禁用' : '启用' }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>
                        <view v-else class="empty-wrap" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                            <wd-status-tip image="../../static/search.png" :tip="accountPhone ? '没有匹配的账户' : '暂无外部客户账户'" />
                        </view>
                    </view>
                </wd-tab>
            </wd-tabs>
        </view>

        <!-- 账户详情（页面内视图，非弹层） -->
        <view v-if="viewMode === 'account-detail'" class="sub-page">
            <view class="sub-head" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="sub-back" :style="{ color: '#1677ff' }" @click="closeAccountDetail">‹ 返回</view>
                <text class="sub-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">账户详情</text>
                <text class="sub-placeholder"></text>
            </view>
            <scroll-view scroll-y class="sub-scroll">
                <view class="page-inner">
                    <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                        <view v-for="row in accountDetailRows" :key="row.label" class="detail-row">
                            <text class="detail-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ row.label }}</text>
                            <text class="detail-value" :style="{ color: isDark ? '#e8e8e8' : '#323233' }">{{ row.value }}</text>
                        </view>
                    </view>
                </view>
            </scroll-view>
        </view>
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import {
    fetchGetWorkbuddyConnectors,
    fetchSetWorkbuddyConnectorStatus,
    fetchGetWorkbuddyAccounts,
    fetchGetWorkbuddyAccount,
    fetchSetWorkbuddyAccountStatus,
    type WorkbuddyConnector,
    type WorkbuddyAccount
} from '@/service/workbuddy';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh; background: #f5f6f8;';
    return 'min-height: 100vh; background: #1b1b1b;';
});

const activeTab = ref('connector');
// 视图模式：list=双 tab 列表；account-detail=账户详情页
const viewMode = ref<'list' | 'account-detail'>('list');

// ==================== 专家 source ====================
const connectorList = ref<WorkbuddyConnector[]>([]);
const connectorKeyword = ref('');
const filteredConnectors = computed(() => {
    const kw = connectorKeyword.value.trim().toLowerCase();
    if (!kw) return connectorList.value;
    return connectorList.value.filter(c => (c.source || '').toLowerCase().includes(kw) || (c.display_name || '').toLowerCase().includes(kw));
});

async function getConnectors() {
    try {
        connectorList.value = await fetchGetWorkbuddyConnectors();
    } catch (err) {
        console.error('获取专家来源失败', err);
    }
}

// 新增/编辑跳转独立表单页
function goConnectorForm(c?: WorkbuddyConnector) {
    const q = c ? `?source=${encodeURIComponent(c.source)}` : '';
    uni.navigateTo({ url: `/mePages/workbuddy/ConnectorForm${q}` });
}

function toggleConnector(c: WorkbuddyConnector) {
    const next = c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    uni.showModal({
        title: '提示',
        content: next === 'DISABLED' ? `停用后新 OAuth 注册、新授权将被拒绝，已签发 token 默认继续到期。确认停用「${c.display_name || c.source}」？` : `确认启用「${c.display_name || c.source}」？`,
        success: async (res) => {
            if (!res.confirm) return;
            try {
                await fetchSetWorkbuddyConnectorStatus(c.source, next);
                uni.showToast({ title: next === 'DISABLED' ? '已停用' : '已启用', icon: 'success' });
                getConnectors();
            } catch (err: any) {
                uni.showToast({ title: err?.msg || '操作失败', icon: 'none' });
            }
        }
    });
}

// ==================== 外部客户账户 ====================
const accountList = ref<WorkbuddyAccount[]>([]);
const accountPhone = ref('');

async function getAccounts() {
    try {
        accountList.value = await fetchGetWorkbuddyAccounts(accountPhone.value.trim() || undefined);
    } catch (err) {
        console.error('获取客户账户失败', err);
    }
}
function clearAccountPhone() {
    accountPhone.value = '';
    getAccounts();
}

const accountDetail = ref<any>(null);
const accountDetailRows = computed(() => {
    const d = accountDetail.value;
    if (!d) return [];
    return [
        { label: '账户 ID', value: d.id },
        { label: '真实手机号', value: d.phone || d.phone_masked || '-' },
        { label: '状态', value: d.status === 'ACTIVE' ? '正常' : '已禁用' },
        { label: '登录成功次数', value: d.success_login_count ?? 0 },
        { label: '登录失败次数', value: d.failed_login_count ?? 0 },
        { label: '短信发送条数', value: d.sms_send_count ?? 0 },
        { label: '最近登录时间', value: d.last_login_at || '从未登录' },
        { label: '最近登录 IP', value: d.last_login_ip || '-' },
        { label: '最近短信时间', value: d.last_sms_at || '-' }
    ];
});

async function openAccountDetail(a: WorkbuddyAccount) {
    try {
        accountDetail.value = await fetchGetWorkbuddyAccount(a.id);
    } catch (err) {
        console.error('获取账户详情失败', err);
        accountDetail.value = a;
    }
    viewMode.value = 'account-detail';
}
function closeAccountDetail() {
    viewMode.value = 'list';
}

function toggleAccount(a: WorkbuddyAccount) {
    const next = a.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    uni.showModal({
        title: '提示',
        content: next === 'DISABLED' ? `禁用后该手机号无法再发起短信验证码登录。确认禁用账户「${a.phone_masked}」？` : `确认启用账户「${a.phone_masked}」？`,
        success: async (res) => {
            if (!res.confirm) return;
            try {
                await fetchSetWorkbuddyAccountStatus(a.id, next);
                uni.showToast({ title: next === 'DISABLED' ? '已禁用' : '已启用', icon: 'success' });
                getAccounts();
            } catch (err: any) {
                uni.showToast({ title: err?.msg || '操作失败', icon: 'none' });
            }
        }
    });
}

function handleClickLeft() { uni.navigateBack(); }

onLoad(() => {
    const ut = Number(uni.getStorageSync('usertype'));
    if (![0, 12].includes(ut)) { uni.showToast({ title: '无权限访问', icon: 'none' }); return; }
    getConnectors();
    getAccounts();
    // 表单页保存成功后刷新列表
    uni.$on('wb_connector_refresh', getConnectors);
});
onUnload(() => {
    uni.$off('wb_connector_refresh', getConnectors);
});
</script>

<style lang="scss" scoped>
.page-inner { display: flex; flex-direction: column; }
.tab-body { padding: 20rpx; }
.tip-bar { padding: 20rpx 24rpx; border-radius: 12rpx; font-size: 24rpx; line-height: 1.6; margin-bottom: 20rpx; }
.tool-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; }
.tool-row :deep(.wd-search) { flex: 1; }
.card-list { display: flex; flex-direction: column; gap: 20rpx; }
.card { border-radius: 16rpx; padding: 24rpx; }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.card-title { font-size: 30rpx; font-weight: 600; }
.status-tag { padding: 4rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; }
.card-row { display: flex; gap: 24rpx; font-size: 24rpx; margin-bottom: 8rpx; flex-wrap: wrap; }
.card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.foot-time { font-size: 22rpx; }
.foot-ops { display: flex; gap: 24rpx; }
.op-link { font-size: 26rpx; color: #1677ff; }
.empty-wrap { border-radius: 16rpx; padding: 80rpx 0; }
.sub-page { height: 100vh; display: flex; flex-direction: column; }
.sub-head { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 24rpx; }
.sub-back { font-size: 30rpx; width: 120rpx; }
.sub-title { font-size: 32rpx; font-weight: 600; }
.sub-placeholder { width: 120rpx; }
.sub-scroll { flex: 1; min-height: 0; }
.form-card { border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.form-item { margin-bottom: 24rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { display: block; font-size: 26rpx; margin-bottom: 12rpx; }
.required { color: #ff4d4f; }
.form-tip { font-size: 22rpx; margin-top: 8rpx; line-height: 1.5; }
.submit-wrap { padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); }
.detail-row { display: flex; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid rgba(128,128,128,0.15); }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 26rpx; }
.detail-value { font-size: 26rpx; }
</style>
