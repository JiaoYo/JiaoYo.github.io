<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
	<view class="manager" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
		<!-- 顶部 -->
		<view class="manager-header" :style="{ paddingTop: headerPad, background: isDark ? '#1b1b1b' : '#ffffff' }">
			<view class="manager-header-left" :style="{ background: isDark ? '#2a2a2a' : '#f5f6f8' }" @click="goBack">
				<wd-icon name="arrow-left" size="20px" :color="isDark ? '#e8e8e8' : '#1a1a1a'"></wd-icon>
			</view>
			<view class="manager-header-title">
				<text class="manager-dname" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row?.dname || '调度详情' }}</text>
				<text class="manager-sub" :style="{ color: isDark ? '#8a9099' : '#86909c' }">{{ typeLabel(activeType) }}</text>
			</view>
			<view class="manager-header-right" :style="{ background: isDark ? '#2a2a2a' : '#f5f6f8' }" @click="openAdd">
				<wd-icon name="add" size="22px" color="#1677ff"></wd-icon>
			</view>
		</view>

		<!-- 类型导航 -->
		<view class="type-wrap" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', borderBottomColor: isDark ? '#3a3a3a' : '#f0f1f3' }">
			<view
				v-for="t in typeList"
				:key="t.type"
				class="type-item"
				:class="{ activeDark: activeType === t.type &&isDark,'active': activeType === t.type && !isDark}"
				:style="activeType === t.type ? {} : { background: isDark ? '#2a2a2a' : '#f2f3f5', borderColor: isDark ? '#3a3a3a' : 'transparent' }"
				@click="switchType(t.type)"
			>
				<view class="type-dot" :style="{ background: t.color }"></view>
				<text class="type-name" :style="{ color: activeType === t.type ? '#1677ff' : (isDark ? '#8a9099' : '#4e5969') }">{{ t.label }}</text>
				<text class="type-num" :class="{ zero: !t.count, has: t.count > 0 }" :style="t.count > 0 ? { background: t.color } : { background: isDark ? '#3a3a3a' : '#ececec', color: isDark ? '#6a6a6a' : '#c0c4cc' }">{{ t.count }}</text>
			</view>
		</view>

		<!-- 列表 -->
		<scroll-view scroll-y class="list-scroll">
			<view v-if="loading" class="list-tip">
				<wd-loading size="24px"></wd-loading>
				<text class="list-tip-text">加载中...</text>
			</view>

			<view v-else-if="subList.length === 0" class="list-empty">
				<view class="empty-icon">
					<wd-icon name="doc" size="40px" color="#c0c4cc"></wd-icon>
				</view>
				<text class="empty-text">暂无数据，点击右上角添加</text>
			</view>

			<view v-else class="item-list">
				<view v-for="(item, index) in subList" :key="item.id ?? 'new-' + index" class="item-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
					<view class="item-main">
						<view class="item-line">
							<text class="item-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ item.name || '未命名' }}</text>
							<view v-if="canOperate(item.creater)" class="item-actions">
								<text class="action-link" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click="openEdit(item)">编辑</text>
								<text class="action-link danger" :style="{ color: isDark ? '#ff7875' : '#dd524d' }" @click="handleDelete(item)">删除</text>
							</view>
						</view>

						<!-- 联系人：掩码 + 查看明文 -->
						<view v-if="activeType >= 1 && activeType <= 6" class="item-value" @click="openVerify(item)">
							<text class="value-mask" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">{{ item.value ? item.value : '-' }}</text>
							<text class="value-link" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">查看明文</text>
						</view>
						<!-- 主站IP -->
						<view v-else-if="activeType === 0" class="item-value">
							<text class="value-ip" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">{{ item.value || '-' }}</text>
							<text v-if="item.value" class="value-copy" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click.stop="copyText(item.value)">复制</text>
						</view>
						<!-- 证书 -->
						<view v-else class="item-value">
							<text class="value-file" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">📄 {{  item.fileName || item.name || '-' }}</text>
							<text v-if="item.url" class="value-copy" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click.stop="copyText(item.url)">复制链接</text>
							<text v-if="item.url" class="value-copy" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click.stop="downloadUrl(item.url)">下载</text>
						</view>

						<view v-if="item.notes" class="item-notes" :style="{ color: isDark ? '#8a9099' : '#86909c' }">备注：{{ item.notes }}</view>
						<view class="item-meta" :style="{ color: isDark ? '#6a6a6a' : '#c0c4cc', borderTopColor: isDark ? '#3a3a3a' : '#f5f6f8' }">
							<text :style="{ color: isDark ? '#6a6a6a' : '#c0c4cc' }">创建人：{{ item.username || '-' }}</text>
							<text class="item-time" :style="{ color: isDark ? '#6a6a6a' : '#c0c4cc' }">{{ item.dbtime || '' }}</text>
						</view>
					</view>
				</view>

				<view v-if="subList.length < subTotal" class="load-more" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click="loadMore">
					<text :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">已加载 {{ subList.length }} / {{ subTotal }}，点击加载更多</text>
				</view>
			</view>
		</scroll-view>

		<!-- 底部添加按钮 -->
		<view class="manager-footer" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-button block type="primary" @click="openAdd">
				<wd-icon name="add" size="18px" color="#ffffff"></wd-icon>
				<text>添加{{ typeLabel(activeType) }}</text>
			</wd-button>
		</view>

		<!-- 子表项 添加/编辑 -->
		<item-editor v-model="itemEditorShow" :type="activeType" :pid="row?.id" :item="editingItem" @saved="onItemSaved" />

		<!-- 明文验证 -->
		<verify-popup v-model="verifyShow" :ids="verifyIds" :contact-name="verifyName" />
	</view>
</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad, onBackPress } from '@dcloudio/uni-app';
import { useTheme } from "@/composables/theme/theme";
import { useMessage } from 'wot-design-uni';
import { fetchDispatchContactList, fetchDeleteDispatchContact } from '@/service/dispatch';
import { CONTACT_TYPES, COUNT_KEY_OF_TYPE, SUB_PAGE_SIZE, pickRows, pickTotal, mapSubRow, canOperate, typeLabel, parseCertValue } from '../modules/constants';
import itemEditor from '../modules/item-editor.vue';
import verifyPopup from '../modules/verify-popup.vue';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === "dark");
const message = useMessage();

const row = ref<any>(null);
const activeType = ref(1);
const subList = ref<any[]>([]);
const subTotal = ref(0);
const subPage = ref(1);
const loading = ref(false);

const itemEditorShow = ref(false);
const editingItem = ref<any>(null);
const verifyShow = ref(false);
const verifyIds = ref('');
const verifyName = ref('');

// 状态栏高度（自定义导航，页面从屏幕顶端开始，需手动避让状态栏）
const statusBarHeight = ref(0);
const headerPad = computed(() => (statusBarHeight.value + 10) + 'px');

onMounted(() => {
    try {
        const info = uni.getSystemInfoSync();
        statusBarHeight.value = info.statusBarHeight || 0;
    } catch (e) { /* ignore */ }
});

// 解析跳转参数 row（兼容 H5 已解码 / 小程序未解码两种情况）
function parseRow(str?: string): any {
    if (!str) return null;
    try {
        return JSON.parse(str);
    } catch (e1) {
        try {
            return JSON.parse(decodeURIComponent(str));
        } catch (e2) {
            return null;
        }
    }
}

onLoad((options: any) => {
    row.value = parseRow(options.row);
    activeType.value = Number(options.type ?? 1) || 1;
    loadList();
});

// 类型列表（带数量）
const typeList = computed(() => {
    const r = row.value || {};
    return CONTACT_TYPES.map(t => ({
        ...t,
        count: Number(r[COUNT_KEY_OF_TYPE[t.type]] || 0)
    }));
});

function switchType(type: number) {
    if (activeType.value === type) return;
    activeType.value = type;
    loadList();
}

// 返回上一页
function goBack() {
    uni.navigateBack();
}

// 子表弹窗/明文验证打开时，按返回或侧滑先关弹窗，避免直接退回列表页
onBackPress(() => {
    if (itemEditorShow.value || verifyShow.value) {
        itemEditorShow.value = false;
        verifyShow.value = false;
        return true;
    }
    return false;
});

// 加载当前类型列表
async function loadList() {
    if (!row.value) return false;
    loading.value = true;
    subList.value = [];
    subPage.value = 1;
    try {
        const data = await fetchDispatchContactList({
            pid: row.value.id,
            type: activeType.value,
            page: 1,
            limit: SUB_PAGE_SIZE,
            pageSize: SUB_PAGE_SIZE
        });
        const rows = pickRows(data);
        subTotal.value = pickTotal(data, rows);
        subList.value = rows.map((it: any) => {
            const m = mapSubRow(it);
            if (activeType.value >= 7) {
                // 证书：解析 JSON {alias, url, fileName}（兼容旧 url?fileName）
                const c = parseCertValue(m.value);
                m.alias = c.alias || m.name;
                m.fileName = c.fileName || m.name;
                m.url = c.url;
            }
            return m;
        });
        return true;
    } catch (e) {
        subTotal.value = 0;
        subList.value = [];
        return false;
    } finally {
        loading.value = false;
    }
}

async function loadMore() {
    if (subList.value.length >= subTotal.value) return;
    subPage.value++;
    try {
        const data = await fetchDispatchContactList({
            pid: row.value.id,
            type: activeType.value,
            page: subPage.value,
            limit: SUB_PAGE_SIZE,
            pageSize: SUB_PAGE_SIZE
        });
        const rows = pickRows(data);
        subList.value = subList.value.concat(rows.map((it: any) => mapSubRow(it)));
    } catch (e) {
        /* ignore */
    }
}

// 添加 / 编辑
function openAdd() {
    editingItem.value = null;
    itemEditorShow.value = true;
}

function openEdit(item: any) {
    editingItem.value = item;
    itemEditorShow.value = true;
}

// 子表变化后通知列表页刷新（角标数量同步）
function notifyChanged() {
    uni.$emit('refreshListDispatch');
}

// 子表项保存后刷新（刷新完成后再提示；延迟一拍避开请求 complete 的 hideLoading 盖掉 toast）
async function onItemSaved() {
    const ok = await loadList();
    if (ok) {
        notifyChanged();
    }
    setTimeout(() => {
        uni.showToast({ icon: 'success', title: '保存成功' });
    }, 100);
}

// 查看明文
function openVerify(item: any) {
    if (!item.id) {
        uni.showToast({ icon: 'none', title: '请先保存该联系人' });
        return;
    }
    verifyIds.value = String(item.id);
    verifyName.value = item.name || '';
    verifyShow.value = true;
}

// 删除
function handleDelete(item: any) {
    if (!item.id) {
        subList.value = subList.value.filter(i => i !== item);
        return;
    }
    message
    .confirm({
        msg: '确定要删除该记录吗？',
        title: '提示',
        zIndex: 2000,
        confirmButtonProps: {
            type: 'error',
        },
    })
    .then(async () => {
        try {
            await fetchDeleteDispatchContact(item.id);
            await loadList();
            // 删除后同步角标数量
            notifyChanged();
            uni.showToast({ icon: 'success', title: '删除成功' });
        } catch (e) {
            uni.showToast({ icon: 'none', title: '删除失败' });
        }
    })
    .catch(() => {
        console.log('点击了取消按钮');
    });
}

// 复制
function copyText(text: string) {
    uni.setClipboardData({
        data: text,
        success: () => uni.showToast({ icon: 'success', title: '已复制' })
    });
}

// 下载证书：跳转系统浏览器下载
function downloadUrl(url: string) {
    if (!url) return;
    // #ifdef APP || APP-PLUS
    plus.runtime.openURL(url);
    // #endif

    // #ifdef H5
    window.open(url);
    // #endif
}
</script>

<style lang="scss" scoped>
.manager {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f6f8;
}

/* 顶部 */
.manager-header {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	background: var(--wd-bg-color, #ffffff);
	gap: 12rpx;
}

.manager-header-left,
.manager-header-right {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.manager-header-right.add-disabled {
	opacity: 0.4;
}

.manager-header-title {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.manager-dname {
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a1a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.manager-sub {
	font-size: 22rpx;
	color: #86909c;
}

/* 类型导航 */
.type-wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	padding: 20rpx 24rpx 8rpx;
	background: var(--wd-bg-color, #ffffff);
	border-bottom: 1rpx solid #f0f1f3;
	flex-shrink: 0;
}

.type-item {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	height: 60rpx;
	padding: 0 20rpx;
	border-radius: 12rpx;
	background: var(--wd-bg-color-grey, #f2f3f5);
	border: 1rpx solid transparent;
	box-sizing: border-box;
}

.type-item.activeDark {
	background: #1a3a5c;
	border-color: #69b1ff;
}
.type-item.active {
	background: rgba(26, 58, 92, 0.1);
	border-color: #69b1ff;
}

.type-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.type-name {
	font-size: 24rpx;
	color: var(--wd-text-color-secondary, #4e5969);
	white-space: nowrap;
}

.type-item.active .type-name {
	color: #1677ff;
	font-weight: 600;
}

.type-num {
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 8rpx;
	border-radius: 999rpx;
	background: #ececec;
	color: #c0c4cc;
	font-size: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.type-num.has {
	color: #ffffff;
}

/* 列表 */
.list-scroll {
	flex: 1;
	min-height: 0;
	box-sizing: border-box;
	overscroll-behavior: contain;
	-webkit-overflow-scrolling: touch;
}

.list-tip,
.list-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;
	gap: 16rpx;
}

.list-tip-text,
.empty-text {
	font-size: 26rpx;
	color: #86909c;
}

.empty-icon {
	width: 120rpx;
	height: 120rpx;
	background: var(--wd-bg-color-grey, #f2f3f5);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.item-list {
	padding: 20rpx 24rpx;
}

.item-card {
	background: var(--wd-bg-color, #ffffff);
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.item-line {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12rpx;
}

.item-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #1a1a1a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
	min-width: 0;
}

.item-actions {
	display: flex;
	gap: 24rpx;
	flex-shrink: 0;
}

.action-link {
	font-size: 26rpx;
	color: #1677ff;
}

.action-link.danger {
	color: #dd524d;
}

.item-value {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 16rpx 0;
}

.value-mask,
.value-ip,
.value-file {
	font-size: 26rpx;
	color: var(--wd-text-color-secondary, #4e5969);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
	min-width: 0;
	font-family: monospace;
}

.value-link,
.value-copy {
	font-size: 24rpx;
	color: #1677ff;
	flex-shrink: 0;
}

.item-notes {
	font-size: 24rpx;
	color: #86909c;
	padding: 8rpx 0;
}

.item-meta {
	display: flex;
	justify-content: space-between;
	font-size: 22rpx;
	color: #c0c4cc;
	padding-top: 12rpx;
	border-top: 1rpx solid #f5f6f8;
}

.item-time {
	margin-left: 16rpx;
}

.load-more {
	text-align: center;
	padding: 24rpx;
	font-size: 24rpx;
	color: #1677ff;
}

/* 底部 */
.manager-footer {
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: var(--wd-bg-color, #ffffff);
	box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.manager-footer .add-disabled {
	opacity: 0.5;
}
</style>
