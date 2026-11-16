<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
	<view class="form-page" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
		<!-- 顶部 -->
		<view class="form-header" :style="{ paddingTop: headerPad, background: isDark ? '#1b1b1b' : '#ffffff' }">
			<view class="form-header-left" :style="{ background: isDark ? '#2a2a2a' : '#f5f6f8' }" @click="goBack">
				<wd-icon name="arrow-left" size="20px" :color="isDark ? '#e8e8e8' : '#1a1a1a'"></wd-icon>
			</view>
			<text class="form-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ isEdit ? '编辑调度表' : '新增调度表' }}</text>
			<view class="form-header-right"></view>
		</view>

		<!-- 表单主体 -->
		<scroll-view scroll-y class="form-scroll" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
			<!-- 基本信息 -->
			<view class="basic-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
				<view class="basic-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">
					<view class="basic-dot"></view>
					<text :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">基本信息</text>
				</view>
				<wd-input label="调度名称" label-width="100px" v-model="basic.dname" placeholder="请输入调度名称" clearable required />
				<view class="province-picker">
					<wd-picker :columns="provinceColumns" v-model="basic.province" label="省份" label-width="100px" align-right required />
				</view>
				<wd-input label="地区" label-width="100px" v-model="basic.region" placeholder="请输入地区" clearable required />
			</view>

			<!-- 子表各类型 -->
			<view v-for="t in CONTACT_TYPES" :key="t.type" class="section">
				<view class="section-header" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }" @click="toggleSection(t.type)">
					<view class="section-header-left">
						<view class="section-dot" :style="{ background: t.color }"></view>
						<text class="section-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ t.label }}</text>
						<view class="section-count" :style="{ background: isDark ? '#3a3a3a' : '#f2f3f5', color: isDark ? '#8a9099' : '#86909c' }">{{ (sections[t.type] || []).length }}</view>
					</view>
					<wd-icon :name="expanded[t.type] ? 'arrow-up' : 'arrow-down'" size="16px" :color="isDark ? '#8a9099' : '#86909c'"></wd-icon>
				</view>

				<view v-if="expanded[t.type]" class="section-body" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
					<view v-if="(sections[t.type] || []).length === 0" class="section-empty" :style="{ color: isDark ? '#6a6a6a' : '#c0c4cc' }">暂无数据</view>
					<view v-for="(item, index) in sections[t.type]" :key="item._uid ?? index" class="section-item">
						<view class="section-item-main">
							<text class="section-item-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ t.type >= 7 ? (item.fileName || item.alias || item.name || '未命名') : (item.name || '未命名') }}</text>
							<text class="section-item-value" :style="{ color: isDark ? '#8a9099' : '#86909c' }">{{ t.type >= 7 ? (item.alias || '-') : (item.value || '-') }}</text>
						</view>
						<view class="section-item-actions">
							<text class="sec-action" @click="editItem(t.type, item)">编辑</text>
							<text class="sec-action danger" @click="deleteItem(t.type, item)">删除</text>
						</view>
					</view>
					<view class="section-add" :class="{ 'sec-add-disabled': t.type >= 7 }" @click="addItem(t.type)">
						<wd-icon name="add" size="16px" color="#1677ff"></wd-icon>
						<text>添加{{ t.label }}</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部保存 -->
		<view class="form-footer" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-button block type="primary" :loading="saving" @click="handleSave">保存</wd-button>
		</view>

		<!-- 子表项 添加/编辑 -->
		<item-editor v-model="itemEditorShow" :type="editorType" :pid="isEdit ? row?.id : null" :item="editingItem" @saved="onItemSaved" />
	</view>
</wd-config-provider>
</template>

<script lang="ts" setup>
import { useTheme } from "@/composables/theme/theme";
import { ref, computed, onMounted } from 'vue';
import { onLoad, onBackPress } from '@dcloudio/uni-app';
import { fetchProvinceList, fetchDispatchContactList, fetchDeleteDispatchContact, fetchOneAddDispatch, fetchEditDispatch, fetchAddDispatchContact } from '@/service/dispatch';
import { CONTACT_TYPES, pickRows, mapSubRow, parseCertValue } from '../modules/constants';
import itemEditor from '../modules/item-editor.vue';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

const row = ref<any>(null);

const isEdit = computed(() => !!(row.value && row.value.id != null));

const basic = ref<{ dname: string; province: any; region: string }>({ dname: '', province: [], region: '' });
const sections = ref<Record<number, any[]>>({});
const expanded = ref<Record<number, boolean>>({});
const saving = ref(false);

// 状态栏高度（自定义导航，页面从屏幕顶端开始，需手动避让状态栏）
const statusBarHeight = ref(0);
const headerPad = computed(() => (statusBarHeight.value + 10) + 'px');

onMounted(() => {
    try {
        const info = uni.getSystemInfoSync();
        statusBarHeight.value = info.statusBarHeight || 0;
    } catch (e) { /* ignore */ }
});

const itemEditorShow = ref(false);
const editorType = ref(1);
const editingItem = ref<any>(null);

// 省份
const provinceList = ref<any[]>([]);
const provinceColumns = computed(() => provinceList.value.map((p: any) => ({ value: p.id, label: p.name })));

async function loadProvinces() {
    try {
        const data = await fetchProvinceList();
        provinceList.value = Array.isArray(data) ? data : (data.list || []);
    } catch (e) {
        provinceList.value = [];
    }
}

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

onLoad(async (options: any) => {
    row.value = parseRow(options.row);
    saving.value = false;
    loadProvinces();
    // 重置 sections/expanded
    sections.value = {};
    expanded.value = {};
    CONTACT_TYPES.forEach(t => {
        sections.value[t.type] = [];
    });

    if (isEdit.value && row.value) {
        basic.value = {
            dname: row.value.dname || '',
            province: row.value.province ?? [],
            region: row.value.region || ''
        };
        // 编辑：加载全部子表数据
        await Promise.all(
            CONTACT_TYPES.map(async (t) => {
                try {
                    const data = await fetchDispatchContactList({ pid: row.value.id, type: t.type, page: 1, limit: 100, pageSize: 100 });
                    const rows = pickRows(data);
                    sections.value[t.type] = rows.map((it: any, idx: number) => {
                        const m = mapSubRow(it);
                        if (t.type >= 7) {
                            // 证书：解析 JSON {alias, url, fileName}（兼容旧 url?fileName）
                            const c = parseCertValue(m.value);
                            m.alias = c.alias || m.name;
                            m.fileName = c.fileName || m.name;
                            m.url = c.url;
                        }
                        m._uid = 'r' + idx;
                        return m;
                    });
                } catch (e) {
                    sections.value[t.type] = [];
                }
            })
        );
    } else {
        basic.value = { dname: '', province: [], region: '' };
    }
});

// 返回上一页
function goBack() {
    uni.navigateBack();
}

// 子表弹窗打开时，按返回或侧滑先关弹窗，避免直接退回列表页
onBackPress(() => {
    if (itemEditorShow.value) {
        itemEditorShow.value = false;
        return true;
    }
    return false;
});

// 展开/收起
function toggleSection(type: number) {
    expanded.value[type] = !expanded.value[type];
}

// 添加 / 编辑子表项
function addItem(type: number) {
    // 证书暂不支持新增（联系人 / IP 可正常新增）
    if (type >= 7) {
        uni.showToast({ icon: 'none', title: '证书暂不支持新增' });
        return;
    }
    editorType.value = type;
    editingItem.value = null;
    itemEditorShow.value = true;
}

function editItem(type: number, item: any) {
    editorType.value = type;
    editingItem.value = item;
    itemEditorShow.value = true;
}

// 子表项保存后回调（刷新完成后再提示；延迟一拍避开请求 complete 的 hideLoading 盖掉 toast）
async function onItemSaved(payload: any) {
    if (isEdit.value) {
        // 编辑模式已落库，刷新对应类型
        await refreshSection(editorType.value);
    } else {
        // 新增模式本地暂存
        sections.value[editorType.value].push({ ...payload, _uid: 'u' + Date.now() });
    }
    setTimeout(() => {
        uni.showToast({ icon: 'success', title: '保存成功' });
    }, 100);
}

async function refreshSection(type: number) {
    if (!row.value) return;
    try {
        const data = await fetchDispatchContactList({ pid: row.value.id, type, page: 1, limit: 100, pageSize: 100 });
        const rows = pickRows(data);
        sections.value[type] = rows.map((it: any, idx: number) => {
            const m = mapSubRow(it);
            if (type >= 7) {
                // 证书：解析 JSON {alias, url, fileName}
                const c = parseCertValue(m.value);
                m.alias = c.alias || m.name;
                m.fileName = c.fileName || m.name;
                m.url = c.url;
            }
            m._uid = 'r' + idx;
            return m;
        });
    } catch (e) {
        sections.value[type] = [];
    }
}

// 删除子表项
function deleteItem(type: number, item: any) {
    if (!item.id) {
        sections.value[type] = sections.value[type].filter(i => i !== item);
        return;
    }
    uni.showModal({
        title: '提示',
        content: '确定要删除该记录吗？',
        confirmColor: '#dd524d',
        success: async (res) => {
            if (!res.confirm) return;
            try {
                await fetchDeleteDispatchContact(item.id);
                uni.showToast({ icon: 'success', title: '删除成功' });
                refreshSection(type);
            } catch (e) {
                uni.showToast({ icon: 'none', title: '删除失败' });
            }
        }
    });
}

// 组装所有子表数据（新增模式）
function buildContacts(pid: number) {
    const contacts: any[] = [];
    CONTACT_TYPES.forEach((t) => {
        (sections.value[t.type] || []).forEach((item: any) => {
            const contactPerson = (item.name || '').trim();
            const contactInformation = (item.value || '').trim();
            const notes = (item.notes || '').trim();
            if (contactPerson || contactInformation || notes) {
                contacts.push({ pid, type: t.type, contactPerson, contactInformation, notes });
            }
        });
    });
    return contacts;
}

// 校验基本信息
function validateBasic(): string {
    if (!basic.value.dname.trim()) return '请输入调度名称';
    if (basic.value.province == null || (Array.isArray(basic.value.province) && basic.value.province.length === 0)) return '请选择省份';
    if (!basic.value.region.trim()) return '请输入地区';
    return '';
}

// 保存
async function handleSave() {
    const msg = validateBasic();
    if (msg) {
        uni.showToast({ icon: 'none', title: msg });
        return;
    }

    saving.value = true;
    try {
        if (isEdit.value) {
            // 编辑：仅更新基本信息（子表项已单独保存/删除）
            await fetchEditDispatch([{ id: row.value.id, dname: basic.value.dname, province: basic.value.province, region: basic.value.region }]);
            uni.$emit('refreshListDispatch');
            uni.navigateBack();
            uni.showToast({ icon: 'success', title: '修改成功' });
            return;
        }

        // 新增：先创建主表拿 id，再批量添加子表
        const id = await fetchOneAddDispatch({
            dname: basic.value.dname,
            province: basic.value.province,
            region: basic.value.region
        });
        const contacts = buildContacts(id);
        if (contacts.length > 0) {
            await fetchAddDispatchContact(contacts);
        }
        uni.$emit('refreshListDispatch');
        uni.navigateBack();
        uni.showToast({ icon: 'success', title: '添加成功' });
    } catch (e) {
        uni.showToast({ icon: 'none', title: isEdit.value ? '修改失败' : '添加失败' });
    } finally {
        saving.value = false;
    }
}
</script>

<style lang="scss" scoped>
.form-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f6f8;
}

.form-header {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	background: var(--wd-bg-color, #ffffff);
	gap: 12rpx;
}

.form-header-left,
.form-header-right {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
}

.form-title {
	flex: 1;
	text-align: center;
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a1a;
}

.form-scroll {
	flex: 1;
	min-height: 0;
	box-sizing: border-box;
	padding: 20rpx 24rpx;
	overscroll-behavior: contain;
	-webkit-overflow-scrolling: touch;
}

.basic-card {
	background: var(--wd-bg-color, #ffffff);
	border-radius: 16rpx;
	padding: 16rpx 24rpx;
	margin-bottom: 20rpx;
}

.basic-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	color: #1a1a1a;
	padding: 8rpx 0 16rpx;
}

.basic-dot,
.section-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #1677ff;
	flex-shrink: 0;
}

.province-picker {
	margin: 8rpx 0;
}

/* 子表区块 */
.section {
	background: var(--wd-bg-color, #ffffff);
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx;
}

.section-header-left {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.section-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #1a1a1a;
}

.section-count {
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 8rpx;
	border-radius: 999rpx;
	background: #f2f3f5;
	color: #86909c;
	font-size: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.section-body {
	padding: 0 24rpx 20rpx;
	border-top: 1rpx solid #f5f6f8;
}

.section-empty {
	font-size: 24rpx;
	color: #c0c4cc;
	text-align: center;
	padding: 20rpx 0;
}

.section-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f5f6f8;
}

.section-item-main {
	display: flex;
	flex-direction: column;
	min-width: 0;
	flex: 1;
	gap: 4rpx;
}

.section-item-name {
	font-size: 28rpx;
	color: #1a1a1a;
}

.section-item-value {
	font-size: 22rpx;
	color: #86909c;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.section-item-actions {
	display: flex;
	gap: 20rpx;
	flex-shrink: 0;
}

.sec-action {
	font-size: 26rpx;
	color: #1677ff;
}

.sec-action.danger {
	color: #dd524d;
}

.section-add {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 20rpx 0;
	font-size: 26rpx;
	color: #1677ff;
}

.section-add.sec-add-disabled {
	opacity: 0.5;
}

.form-footer {
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: var(--wd-bg-color, #ffffff);
	box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);
}


/* 暗黑模式样式 */
.dark-bg {
    background-color: #1b1b1b !important;
}
.dark-text {
    color: #e8e8e8 !important;
}
.dark-secondary {
    color: #8a9099 !important;
}
</style>
