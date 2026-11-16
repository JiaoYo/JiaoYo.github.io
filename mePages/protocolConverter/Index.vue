<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view :style="{ height: topFixedHeight + 'px' }"></view>
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#f5f6f8' }">
            <wd-navbar left-arrow title="规约转换器" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />

            <!-- 筛选卡片：收起时=型号搜索+更多/收起+电网类型/品牌；展开后省市/日期/重置查询 -->
            <view class="filter-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
                <view class="fc-row">
                    <view class="model-input" :style="{ background: isDark ? '#383838' : '#f7f8fa' }">
                        <wd-icon name="search" size="16px" :color="isDark ? '#8a9099' : '#969799'" />
                        <input class="model-input-core" v-model="model.inverterModel" type="text" placeholder="逆变器型号模糊查询" placeholder-class="pc-grey" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="128" confirm-type="search" @confirm="handleSearch" />
                        <wd-icon v-if="model.inverterModel" name="close-circle" size="18px" :color="isDark ? '#8a9099' : '#969799'" @click="handleModelClear" />
                    </view>
                    <wd-button size="small" type="info" plain @click="toggleMoreFilters">{{ showMoreFilters ? '收起' : '更多' }}</wd-button>
                </view>
                <view class="fc-row">
                    <view class="fc-field">
                        <picker mode="selector" :range="gridOptions" range-key="label" class="fc-picker" @change="handleGridChange">
                            <view class="fc-cell" :class="{ 'fc-cell--on': model.gridType !== null }" :style="fcCellStyle(model.gridType !== null)">
                                <wd-icon name="link" size="16px" :color="isDark ? '#69b1ff' : '#1677ff'" />
                                <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">电网类型</text>
                                <text class="fc-text" :style="{ color: model.gridType !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ gridOptions.find(g => g.value === model.gridType)?.label || '全部电网' }}</text>
                                <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </picker>
                        <view class="fc-clear"></view>
                    </view>
                    <view class="fc-field">
                        <view class="fc-picker" @click="brandPickerShow = true">
                            <view class="fc-cell" :class="{ 'fc-cell--on': model.brandId !== null }" :style="fcCellStyle(model.brandId !== null)">
                                <wd-icon name="picture" size="16px" :color="isDark ? '#ffc53d' : '#fa8c16'" />
                                <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">品牌</text>
                                <text class="fc-text" :style="{ color: model.brandId !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ selectedBrandLabel }}</text>
                                <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </view>
                        <view v-if="model.brandId !== null" class="fc-clear" @click="handleBrandClear">
                            <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                        <view v-else class="fc-clear"></view>
                    </view>
                </view>
                <view v-if="showMoreFilters" class="fc-more">
                <view class="fc-row">
                    <view class="fc-field">
                        <picker mode="selector" :range="provinceOptions" range-key="label" class="fc-picker" @change="handleProvinceChange">
                            <view class="fc-cell" :class="{ 'fc-cell--on': model.provinceId !== null }" :style="fcCellStyle(model.provinceId !== null)">
                                <wd-icon name="location" size="16px" :color="isDark ? '#73d13d' : '#52c41a'" />
                                <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">省份</text>
                                <text class="fc-text" :style="{ color: model.provinceId !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ provinceOptions.find(p => p.value === model.provinceId)?.label || '全部省份' }}</text>
                                <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </picker>
                        <view class="fc-clear"></view>
                    </view>
                    <view class="fc-field">
                        <picker mode="selector" :range="cityOptions" range-key="label" class="fc-picker" @change="handleCityChange">
                            <view class="fc-cell" :class="{ 'fc-cell--on': model.cityId !== null }" :style="fcCellStyle(model.cityId !== null)">
                                <text class="fc-cap fc-cap--lead" :style="{ color: isDark ? '#8a9099' : '#969799' }">城市</text>
                                <text class="fc-text" :style="{ color: model.cityId !== null ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ cityOptions.find(c => c.value === model.cityId)?.label || '全部城市' }}</text>
                                <wd-icon name="arrow-down" size="12px" :color="isDark ? '#8a9099' : '#969799'" />
                            </view>
                        </picker>
                        <view v-if="model.cityId !== null" class="fc-clear" @click="handleCityClear">
                            <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                        <view v-else class="fc-clear"></view>
                    </view>
                </view>
                <view class="fc-row">
                    <view class="fc-field">
                        <picker mode="date" :value="model.startTime || ''" class="fc-picker" @change="(e) => handleDateChange('startTime', e)">
                            <view class="fc-cell" :class="{ 'fc-cell--on': !!model.startTime }" :style="fcCellStyle(!!model.startTime)">
                                <wd-icon name="calendar" size="16px" :color="isDark ? '#b37feb' : '#722ed1'" />
                                <text class="fc-cap" :style="{ color: isDark ? '#8a9099' : '#969799' }">开始</text>
                                <text class="fc-text" :style="{ color: model.startTime ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ model.startTime || '创建日期起' }}</text>
                            </view>
                        </picker>
                        <view v-if="model.startTime" class="fc-clear" @click="handleDateClear('startTime')">
                            <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                        <view v-else class="fc-clear"></view>
                    </view>
                    <view class="fc-field">
                        <picker mode="date" :value="model.endTime || ''" class="fc-picker" @change="(e) => handleDateChange('endTime', e)">
                            <view class="fc-cell" :class="{ 'fc-cell--on': !!model.endTime }" :style="fcCellStyle(!!model.endTime)">
                                <text class="fc-cap fc-cap--lead" :style="{ color: isDark ? '#8a9099' : '#969799' }">结束</text>
                                <text class="fc-text" :style="{ color: model.endTime ? (isDark ? '#e8e8e8' : '#1a1a1a') : (isDark ? '#8a9099' : '#969799') }">{{ model.endTime || '创建日期止' }}</text>
                            </view>
                        </picker>
                        <view v-if="model.endTime" class="fc-clear" @click="handleDateClear('endTime')">
                            <wd-icon name="close-circle" size="20px" :color="isDark ? '#8a9099' : '#969799'" />
                        </view>
                        <view v-else class="fc-clear"></view>
                    </view>
                </view>
                <view class="fc-foot">
                    <view class="fc-count" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">已加载 <text class="fc-count-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ dataList.length }}</text> / 共 <text class="fc-count-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ total }}</text> 条</view>
                    <view class="fc-actions">
                        <wd-button size="small" type="info" plain @click="handleReset">重置</wd-button>
                        <wd-button size="small" type="primary" @click="handleSearch">查询</wd-button>
                    </view>
                </view>
                </view>
            </view>
            <!-- 操作按钮：批量管理/逆变器品牌维护/新增，置于筛选区下方 -->
            <view v-if="canInsert || canBrand || canDelete" class="head-actions">
                <view v-if="canDelete" class="act-btn" :style="actBtnStyle('warn')" @click="toggleSelectMode">
                    <wd-icon :name="selectMode ? 'check-circle' : 'delete'" size="15px" :color="actFgColor('warn')" />
                    <text class="act-btn-text" :style="{ color: actFgColor('warn') }">{{ selectMode ? '退出批量' : '批量管理' }}</text>
                </view>
                <view v-if="canBrand" class="act-btn" :style="actBtnStyle('info')" @click="openBrand">
                    <wd-icon name="setting" size="15px" :color="actFgColor('info')" />
                    <text class="act-btn-text" :style="{ color: actFgColor('info') }">逆变器品牌维护</text>
                </view>
                <view v-if="canInsert" class="act-btn" :style="actBtnStyle('primary')" @click="openForm()">
                    <wd-icon name="add" size="15px" :color="actFgColor('primary')" />
                    <text class="act-btn-text" :style="{ color: actFgColor('primary') }">新增</text>
                </view>
            </view>
        </view>

        <view style="margin: 10rpx;" :style="listVars">
            <view v-if="dataList.length > 0">
                <view v-for="row in dataList" :key="row.id" class="list-item" @click="selectMode ? toggleSelect(row) : undefined">
                    <view class="item-header">
                        <view v-if="selectMode" class="sel-box" @click.stop="toggleSelect(row)">
                            <wd-icon :name="checkedIds.includes(row.id) ? 'check-circle-filled' : 'circle'" size="22px" :color="checkedIds.includes(row.id) ? (isDark ? '#69b1ff' : '#1677ff') : (isDark ? '#8a9099' : '#c0c4cc')" />
                        </view>
                        <view class="header-main">
                            <view class="item-title">{{ row.inverterModel || '-' }}</view>
                            <view class="item-sub">{{ row.brandName || '-' }}</view>
                        </view>
                        <view class="grid-tag" :style="Number(row.gridType) === 1 ? gridCnStyle : gridSnStyle">{{ Number(row.gridType) === 1 ? '国网' : '南网' }}</view>
                    </view>
                    <!-- 图片三入口：ftype 12接口/13铭牌/14线束，角标数量（文字+数字标识） -->
                    <view class="img-row">
                        <view v-for="img in imageTypes" :key="img.ftype" class="img-cell" :style="{ background: isDark ? '#383838' : '#f7f8fa' }" @click.stop="openImages(row, img.ftype)">
                            <view class="img-cell-ico">
                                <wd-icon name="picture" size="20px" :color="Number(row['fileNum' + img.ftype]) > 0 ? (isDark ? '#ffc53d' : '#fa8c16') : (isDark ? '#8a9099' : '#c0c4cc')" />
                            </view>
                            <text class="img-cell-label" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }">{{ img.label }}</text>
                            <text class="img-cell-num" :style="{ color: Number(row['fileNum' + img.ftype]) > 0 ? (isDark ? '#ffc53d' : '#fa8c16') : (isDark ? '#8a9099' : '#969799') }">{{ Number(row['fileNum' + img.ftype]) || 0 }}张</text>
                        </view>
                    </view>
                    <view class="meta-grid">
                        <view class="meta-item"><text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">线束物料编码</text><text class="meta-val" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row.harnessMaterialCode || '-' }}</text></view>
                        <view class="meta-item"><text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">线束名称</text><text class="meta-val" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row.harnessName || '-' }}</text></view>
                        <view class="meta-item"><text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">项目地</text><text class="meta-val" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ (row.provinceName || '') + (row.cityName || '') || '-' }}</text></view>
                        <view class="meta-item"><text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">销售负责人</text><text class="meta-val" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row.username || '-' }}</text></view>
                        <view class="meta-item"><text class="meta-label" :style="{ color: isDark ? '#8a9099' : '#969799' }">日期</text><text class="meta-val" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ row.dbtime || '-' }}</text></view>
                    </view>
                    <view v-if="row.notes" class="notes-line" :style="{ background: isDark ? '#333333' : '#f7f8fa', color: isDark ? '#c9cdd4' : '#4e5969' }">备注：{{ row.notes }}</view>
                    <view v-if="!selectMode && (canUpdate || canDelete)" class="item-footer">
                        <wd-button v-if="canUpdate" size="small" type="primary" plain @click.stop="openForm(row)">编辑</wd-button>
                        <wd-button v-if="canDelete" size="small" type="error" plain @click.stop="handleRowDelete(row)">删除</wd-button>
                    </view>
                </view>
                <wd-loadmore :state="state" @reload="getDataList" />
                <view v-if="selectMode" style="height: 140rpx;"></view>
            </view>
            <view v-else style="display: flex; justify-content: center; align-items: center; padding: 80rpx 0;">
                <wd-status-tip image="../../static/search.png" tip="暂无数据" />
            </view>
        </view>

        <!-- 批量删除底栏 -->
        <view v-if="selectMode" class="batch-bar" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
            <view class="sel-box" @click="toggleSelectAll">
                <wd-icon :name="isAllChecked ? 'check-circle-filled' : 'circle'" size="22px" :color="isAllChecked ? (isDark ? '#69b1ff' : '#1677ff') : (isDark ? '#8a9099' : '#c0c4cc')" />
                <text class="sel-all-text" :style="{ color: isDark ? '#c9cdd4' : '#4e5969' }">全选</text>
            </view>
            <text class="batch-count" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">已选 <text class="batch-num" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ checkedIds.length }}</text> 条</text>
            <wd-button size="small" type="error" :disabled="checkedIds.length === 0" @click="handleBatchDelete">批量删除</wd-button>
        </view>

        <!-- 图片弹框：查看 + 快捷上传（无修改权限只读） -->
        <wd-popup closable v-model="imgShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="imgShow = false">
            <view class="sheet" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="sheet-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ currentImageLabel }}（最多5张）</view>
                <scroll-view scroll-y class="img-scroll" :style="{ maxHeight: '500rpx' }">
                    <view class="img-grid">
                        <view v-for="(item, index) in imgList" :key="index" class="img-grid-cell">
                            <image class="img-thumb" :src="displaySrc(item)" mode="aspectFill" @click="previewImage(index)" />
                            <view v-if="fileModalEditable && imgSaving === false" class="img-remove" @click.stop="removeImage(index)">
                                <wd-icon name="close-circle" size="20px" color="#ffffff" />
                            </view>
                        </view>
                        <view v-if="fileModalEditable && imgList.length < 5" class="img-grid-cell img-add" :style="{ borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(128,128,128,0.45)', color: isDark ? '#8a9099' : '#969799' }" @click="chooseImage">
                            <wd-icon name="camera" size="26px" />
                        </view>
                        <view v-if="!imgList.length && !fileModalEditable" class="img-empty" :style="{ color: isDark ? '#8a9099' : '#969799' }">暂无图片</view>
                    </view>
                </scroll-view>
                <view class="img-count" :style="{ color: isDark ? '#8a9099' : '#969799' }">{{ imgList.length }}/5</view>
                <view class="sheet-actions">
                    <wd-button block plain @click="imgShow = false">{{ fileModalEditable ? '取消' : '关闭' }}</wd-button>
                    <wd-button v-if="fileModalEditable" block type="primary" :loading="imgSaving" @click="saveImages">保存</wd-button>
                </view>
            </view>
        </wd-popup>

        <wd-message-box />

        <!-- 逆变器品牌选择弹层：搜索 + 分页 + 触底加载 -->
        <protocol-brand-picker v-model="brandPickerShow" :selected-id="model.brandId" :allow-all="true" @confirm="handleBrandPicked" />
    </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import { useMessage } from 'wot-design-uni';
import {
    fetchAddProtocolRdFile,
    fetchProtocolConverterDelete,
    fetchDeleteProtocolRdFile,
    fetchProtocolConverterCities,
    fetchProtocolConverterPage,
    fetchProtocolConverterProvinces,
    fetchProtocolRdFilePage,
    fetchUpdateProtocolRdFile
} from '@/service/protocolConverter';
import { uploadFile } from '@/utils/uploadFile';
import { hasPermission } from '@/utils/index';
import ProtocolBrandPicker from '@/components/protocol-brand-picker.vue';

const message = useMessage();
const theme = computed(() => (isDark.value ? 'dark' : 'light'));
const themeVars = computed(() => ({
    colorTheme: isDark.value ? '#1677ff' : '#1677ff'
}));
const isDark = computed(() => uni.getStorageSync('isDark') == 1);

/* ===== 权限（web v-no-auth 同名键） ===== */
const canInsert = hasPermission('protocol:converter:insert');
const canUpdate = hasPermission('protocol:converter:update');
const canDelete = hasPermission('protocol:converter:delete');
const canBrand = hasPermission('protocol:converterBrand:select');
/** 图片弹框编辑能力同 web：有修改权限才可上传/删除，否则只读查看 */
const fileModalEditable = canUpdate;

/* ===== 固定头部高度 ===== */
const topFixedHeight = ref(0);
let recalcRetries = 0;
let recalcTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRecalc() {
    // 最多重试 5 次（页面销毁后不再循环）；量到有效值后清零
    if (recalcRetries >= 5) return;
    recalcRetries++;
    if (recalcTimer) clearTimeout(recalcTimer);
    recalcTimer = setTimeout(() => { recalcTimer = null; recalcTopFixedHeight(); }, 200);
}
function recalcTopFixedHeight() {
    // uni H5 内部在 .topFixedWrap 未挂载时同步抛 parentElement null（同 attendancestatistics 兜底模式）；
    // 页面 show 过渡未完成时可能量到 height 0（返回本页时踩过），0 视为无效延迟重试
    try {
        uni.createSelectorQuery()
            .select('.topFixedWrap')
            .boundingClientRect((rect: any) => {
                if (rect && rect.height > 0) {
                    topFixedHeight.value = rect.height;
                    recalcRetries = 0;
                } else {
                    scheduleRecalc();
                }
            })
            .exec();
    } catch (err) {
        scheduleRecalc();
    }
}
function handleClickLeft() { uni.navigateBack(); }

/* ===== 列表查询 ===== */
const model = ref({
    page: 1, limit: 20, gridType: null as number | null, brandId: null as number | null,
    inverterModel: '', provinceId: null as number | null, cityId: null as number | null,
    startTime: '', endTime: ''
});
const dataList = ref<any[]>([]);
const total = ref(0);
const state = ref<'loadmore' | 'loading' | 'finished' | 'error'>('finished');
let listLoading = false;
let pendingReload = false;

async function getDataList() {
    if (listLoading) { pendingReload = true; return; }
    listLoading = true;
    try {
        if (model.value.page === 1) dataList.value = [];
        const params: any = { page: model.value.page, limit: model.value.limit, _t: new Date().getTime() };
        if (model.value.gridType !== null) params.gridType = model.value.gridType;
        if (model.value.brandId !== null) params.brandId = model.value.brandId;
        if (model.value.inverterModel) params.inverterModel = model.value.inverterModel;
        if (model.value.provinceId !== null) params.provinceId = model.value.provinceId;
        if (model.value.cityId !== null) params.cityId = model.value.cityId;
        if (model.value.startTime) params.startTime = model.value.startTime;
        if (model.value.endTime) params.endTime = model.value.endTime;
        const data: any = await fetchProtocolConverterPage(params);
        const rows = Array.isArray(data) ? data : (data?.list || []);
        dataList.value = dataList.value.concat(rows);
        total.value = Number(data?.total ?? rows.length);
        state.value = dataList.value.length < total.value ? 'loadmore' : 'finished';
    } catch (err) { console.error('获取规约列表失败', err); state.value = 'error'; }
    finally {
        listLoading = false;
        if (pendingReload) { pendingReload = false; getDataList(); }
    }
}
function reload() { model.value.page = 1; dataList.value = []; getDataList(); }
function handleSearch() { reload(); }
function handleReset() {
    model.value.gridType = null;
    model.value.brandId = null;
    selectedBrandLabel.value = '全部品牌';
    model.value.inverterModel = '';
    model.value.provinceId = null;
    model.value.cityId = null;
    model.value.startTime = '';
    model.value.endTime = '';
    cityOptions.value = [{ label: '全部城市', value: null as any }];
    reload();
}

/* ===== 下拉数据 ===== */
const gridOptions = [{ label: '全部电网', value: null as any }, { label: '南网', value: 0 }, { label: '国网', value: 1 }];
// 品牌：弹层内搜索+分页选择（仅启用品牌），选中后只留 id+显示名
const brandPickerShow = ref(false);
const selectedBrandLabel = ref('全部品牌');
const provinceOptions = ref<any[]>([{ label: '全部省份', value: null as any }]);
const cityOptions = ref<any[]>([{ label: '全部城市', value: null as any }]);

async function loadProvinceOptions() {
    try {
        const data: any = await fetchProtocolConverterProvinces();
        const list = Array.isArray(data) ? data : [];
        provinceOptions.value = [{ label: '全部省份', value: null as any }, ...list.map((p: any) => ({ label: p.name, value: Number(p.id) }))];
    } catch (err) { console.error('获取省份失败', err); }
}
async function loadCityOptions(provinceId: number) {
    try {
        const data: any = await fetchProtocolConverterCities(provinceId);
        const list = Array.isArray(data) ? data : [];
        cityOptions.value = [{ label: '全部城市', value: null as any }, ...list.map((c: any) => ({ label: c.name, value: Number(c.id) }))];
    } catch (err) { console.error('获取城市失败', err); }
}

/* ===== 筛选交互 ===== */
function handleGridChange(e: any) {
    model.value.gridType = gridOptions[e.detail.value]?.value ?? null;
    reload();
}
function handleBrandPicked(row: any) {
    model.value.brandId = row.id;
    selectedBrandLabel.value = row.label || '全部品牌';
    reload();
}
function handleBrandClear() {
    model.value.brandId = null;
    selectedBrandLabel.value = '全部品牌';
    reload();
}
function handleModelClear() { model.value.inverterModel = ''; reload(); }
function handleProvinceChange(e: any) {
    const opt = provinceOptions.value[e.detail.value];
    const pid = opt && opt.value !== null ? opt.value : null;
    model.value.provinceId = pid;
    model.value.cityId = null;
    cityOptions.value = [{ label: '全部城市', value: null as any }];
    if (pid !== null) loadCityOptions(pid);
    reload();
}
function handleCityChange(e: any) {
    const opt = cityOptions.value[e.detail.value];
    model.value.cityId = opt && opt.value !== null ? opt.value : null;
    reload();
}
function handleCityClear() { model.value.cityId = null; reload(); }
function handleDateChange(key: 'startTime' | 'endTime', e: any) {
    model.value[key] = e.detail.value || '';
    reload();
}
function handleDateClear(key: 'startTime' | 'endTime') {
    model.value[key] = '';
    reload();
}

/** 更多筛选展开/收起（收起时保留已选条件，仍随常用控件即时查询） */
const showMoreFilters = ref(false);
function toggleMoreFilters() { showMoreFilters.value = !showMoreFilters.value; }
// 展开/收起改变固定头高度：等布局稳定后重测，否则占位过矮、列表顶部被筛选区遮住
watch(showMoreFilters, () => {
    nextTick(() => setTimeout(recalcTopFixedHeight, 60));
});

/** 操作按钮配色：warn 橙色淡底 / info 中性灰 / primary 蓝色实底（文字为准，颜色辅助） */
function actBtnStyle(kind: 'warn' | 'info' | 'primary') {
    if (kind === 'warn') {
        return isDark.value
            ? { background: 'rgba(250, 140, 22, 0.15)', borderColor: 'rgba(255, 197, 61, 0.4)' }
            : { background: '#fff7e6', borderColor: 'rgba(250, 140, 22, 0.4)' };
    }
    if (kind === 'info') {
        return isDark.value
            ? { background: '#383838', borderColor: 'rgba(255, 255, 255, 0.1)' }
            : { background: '#f2f3f5', borderColor: 'rgba(128, 128, 128, 0.2)' };
    }
    return isDark.value
        ? { background: '#1677ff', borderColor: 'rgba(255, 255, 255, 0.1)' }
        : { background: '#1677ff', borderColor: 'transparent' };
}
function actFgColor(kind: 'warn' | 'info' | 'primary') {
    if (kind === 'warn') return isDark.value ? '#ffc53d' : '#fa8c16';
    if (kind === 'info') return isDark.value ? '#c9cdd4' : '#4e5969';
    return '#ffffff';
}

/** 筛选控件配色：选中淡蓝底描边、未选中灰底（颜色仅辅助，字段值文字为准） */
function fcCellStyle(active: boolean) {
    return active
        ? (isDark.value
            ? { background: 'rgba(22, 119, 255, 0.12)', borderColor: 'rgba(105, 177, 255, 0.45)' }
            : { background: 'rgba(22, 119, 255, 0.06)', borderColor: 'rgba(22, 119, 255, 0.35)' })
        : (isDark.value
            ? { background: '#383838', borderColor: 'rgba(255, 255, 255, 0.08)' }
            : { background: '#f7f8fa', borderColor: '#f0f1f3' });
}

/* ===== 批量删除（选择模式） ===== */
const selectMode = ref(false);
const checkedIds = ref<any[]>([]);
const isAllChecked = computed(() => dataList.value.length > 0 && dataList.value.every(r => checkedIds.value.includes(r.id)));
function toggleSelectMode() {
    selectMode.value = !selectMode.value;
    checkedIds.value = [];
}
function toggleSelect(row: any) {
    const i = checkedIds.value.indexOf(row.id);
    if (i >= 0) checkedIds.value.splice(i, 1);
    else checkedIds.value.push(row.id);
}
function toggleSelectAll() {
    if (isAllChecked.value) checkedIds.value = [];
    else checkedIds.value = dataList.value.map(r => r.id);
}
function handleBatchDelete() {
    if (checkedIds.value.length === 0) return;
    message
        .confirm({ title: '提示', msg: '确定要删除选中的吗？' })
        .then(async () => {
            try {
                await fetchProtocolConverterDelete(checkedIds.value.join(','));
                uni.showToast({ title: '删除成功', icon: 'success' });
                checkedIds.value = [];
                reload();
            } catch (err) { console.error('批量删除失败', err); }
        })
        .catch(() => {});
}
function handleRowDelete(row: any) {
    message
        .confirm({ title: '提示', msg: '确定删除该规约转换器吗？' })
        .then(async () => {
            try {
                await fetchProtocolConverterDelete(String(row.id));
                uni.showToast({ title: '删除成功', icon: 'success' });
                reload();
            } catch (err) { console.error('删除失败', err); }
        })
        .catch(() => {});
}

/* ===== 新增/编辑跳转 ===== */
const clickLock = ref(false);
function openForm(row?: any) {
    if (clickLock.value) return;
    clickLock.value = true;
    const url = row ? `/mePages/protocolConverter/form/Index?id=${row.id}` : '/mePages/protocolConverter/form/Index';
    uni.navigateTo({ url });
    setTimeout(() => { clickLock.value = false; }, 500);
}
function openBrand() {
    if (clickLock.value) return;
    clickLock.value = true;
    uni.navigateTo({ url: '/mePages/protocolConverter/brand/Index' });
    setTimeout(() => { clickLock.value = false; }, 500);
}

/* ===== 图片弹框（ftype 12接口/13铭牌/14线束，pid=规约id） ===== */
const imageTypes = [
    { ftype: 12, label: '逆变器接口图片' },
    { ftype: 13, label: '逆变器铭牌图片' },
    { ftype: 14, label: '线束图片' }
];
const imgShow = ref(false);
const imgFtype = ref(12);
const imgRow = ref<any>(null);
const imgList = ref<any[]>([]);
const imgOldList = ref<any[]>([]);
const imgSaving = ref(false);
const currentImageLabel = computed(() => imageTypes.find(t => t.ftype === imgFtype.value)?.label || '图片');

async function openImages(row: any, ftype: number) {
    imgShow.value = true;
    imgFtype.value = ftype;
    imgRow.value = row;
    imgList.value = [];
    imgOldList.value = [];
    if (!row?.id) return;
    try {
        const data: any = await fetchProtocolRdFilePage({ pid: row.id, ftype, page: 1, limit: 100, _t: new Date().getTime() });
        const list = ((Array.isArray(data) ? data : data?.list) || []).map((item: any) => ({
            id: item.id,
            url: item.furl,
            fname: item.fname
        }));
        imgList.value = list;
        imgOldList.value = list.map((item: any) => ({ ...item }));
    } catch (err) { console.error('获取图片失败', err); }
}

/** 已上传的走七牛 imageView2 裁方图（预览看原图）；未上传的用本地临时路径 */
function displaySrc(item: any) {
    if (item.url) return `${String(item.url).split('?')[0]}?imageView2/1/w/180/h/180/q/75`;
    return item.tempPath || '';
}
function previewImage(index: number) {
    const urls = imgList.value.map(i => (i.url ? String(i.url).split('?')[0] : i.tempPath));
    uni.previewImage({ urls, current: index });
}
function chooseImage() {
    const remain = 5 - imgList.value.length;
    if (remain <= 0) { uni.showToast({ title: '最多上传5张', icon: 'none' }); return; }
    uni.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        success: (res: any) => {
            const files = res.tempFiles || [];
            const paths = res.tempFilePaths || [];
            files.forEach((tf: any, i: number) => {
                if (imgList.value.length >= 5) return;
                imgList.value.push({
                    tempPath: tf.path || paths[i],
                    fname: tf.name || ('img_' + new Date().getTime() + '.png')
                });
            });
        }
    });
}
function removeImage(index: number) {
    imgList.value.splice(index, 1);
}

/** 保存：先传新图，再按 diff 新增/改别名/删除（同 web product 文件弹框口径） */
async function saveImages() {
    const row = imgRow.value;
    if (!row?.id) { imgShow.value = false; return; }
    if (imgSaving.value) return;
    imgSaving.value = true;
    try {
        // 1. 上传新增图片
        const toUpload = imgList.value.filter((item: any) => item.tempPath && !item.url);
        for (const item of toUpload) {
            const url = await new Promise<string>((resolve, reject) => {
                uploadFile(
                    { name: item.fname, url: item.tempPath, tempFilePath: item.tempPath },
                    'qiniu',
                    (res: any) => resolve(res.data),
                    () => reject(new Error('upload fail'))
                );
            });
            item.url = url;
        }
        // 2. 新增记录 / 更新别名
        for (const item of imgList.value) {
            const payload = { furl: item.url, fname: item.fname, pid: row.id, ftype: imgFtype.value };
            if (item.id) {
                const old = imgOldList.value.find((o: any) => o.id === item.id);
                if (old && old.fname !== item.fname) {
                    await fetchUpdateProtocolRdFile([{ id: item.id, ...payload }]);
                }
            } else if (item.url) {
                const res: any = await fetchAddProtocolRdFile([payload]);
                const saved = Array.isArray(res) ? res[0] : res;
                if (saved?.id) item.id = saved.id;
            }
        }
        // 3. 删除被移除的图片
        const deletedIds = imgOldList.value
            .filter((o: any) => !imgList.value.some((n: any) => n.id === o.id))
            .map((o: any) => o.id);
        if (deletedIds.length > 0) {
            await fetchDeleteProtocolRdFile(deletedIds.join(','));
        }
        uni.showToast({ title: '保存成功', icon: 'success' });
        imgShow.value = false;
        reload();
    } catch (err) {
        console.error('保存图片失败', err);
        uni.showToast({ title: '上传失败', icon: 'none' });
    } finally {
        imgSaving.value = false;
    }
}

/* ===== 主题变量 ===== */
const listVars = computed(() => isDark.value ? {
    '--li-card-bg': '#2a2a2a',
    '--li-title': '#e8e8e8',
    '--li-sub': '#8a9099',
    '--li-line': 'rgba(255,255,255,0.08)',
    '--li-meta-bg': '#333333',
    '--li-shadow': 'none'
} : {
    '--li-card-bg': '#ffffff',
    '--li-title': '#1a1a1a',
    '--li-sub': '#969799',
    '--li-line': '#f0f1f3',
    '--li-meta-bg': '#f7f8fa',
    '--li-shadow': '0 2rpx 8rpx rgba(0, 0, 0, 0.05)'
});
const gridSnStyle = computed(() => isDark.value
    ? { background: 'rgba(24, 144, 255, 0.18)', color: '#69b1ff' }
    : { background: '#e6f7ff', color: '#1890ff' });
const gridCnStyle = computed(() => isDark.value
    ? { background: 'rgba(82, 196, 26, 0.16)', color: '#73d13d' }
    : { background: '#f6ffed', color: '#52c41a' });

/* ===== 生命周期 ===== */
onMounted(() => {
    loadProvinceOptions();
    // 默认进入即请求列表
    reload();
    uni.$on('refreshProtocolConverterList', reload);
});
onShow(() => {
    recalcTopFixedHeight();
});
onBeforeUnmount(() => {
    uni.$off('refreshProtocolConverterList', reload);
    if (recalcTimer) clearTimeout(recalcTimer);
});
onPullDownRefresh(() => {
    reload();
    setTimeout(() => { uni.stopPullDownRefresh(); }, 600);
});
onReachBottom(() => {
    if (state.value === 'loadmore' && !listLoading) {
        model.value.page += 1;
        getDataList();
    }
});
</script>

<style lang="scss" scoped>
.topFixedWrap { position: fixed; left: 0; top: 0; width: 100%; z-index: 99; box-sizing: border-box; }
.head-actions { display: flex; gap: 16rpx; margin-top: 16rpx; padding: 0 20rpx 16rpx; align-items: center; }
.act-btn { flex: 1; min-width: 0; height: 68rpx; border-radius: 16rpx; border: 1rpx solid transparent; display: flex; align-items: center; justify-content: center; gap: 8rpx; }
.act-btn-text { font-size: 26rpx; font-weight: 500; white-space: nowrap; }

/* ===== 筛选卡片 ===== */
.filter-card { margin: 4rpx 20rpx 0; padding: 20rpx; border-radius: 20rpx; display: flex; flex-direction: column; gap: 16rpx; }
.fc-row { display: flex; gap: 16rpx; }
.fc-field { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8rpx; }
.fc-picker { flex: 1; min-width: 0; }
.fc-cell { display: flex; align-items: center; gap: 10rpx; padding: 16rpx 18rpx; border-radius: 14rpx; border: 1rpx solid transparent; }
.fc-cap { flex-shrink: 0; font-size: 22rpx; }
.fc-cap--lead { width: 58rpx; }
.fc-text { flex: 1; min-width: 0; text-align: right; font-size: 24rpx; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fc-clear { flex: 0 0 40rpx; display: flex; align-items: center; justify-content: center; }
.fc-foot { display: flex; align-items: center; justify-content: space-between; }
.fc-count { font-size: 24rpx; }
.fc-count-num { font-weight: 600; }
.fc-actions { display: flex; gap: 16rpx; }
.fc-more { display: flex; flex-direction: column; gap: 16rpx; }

.model-input { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12rpx; padding: 16rpx 18rpx; border-radius: 14rpx; }
.model-input-core { flex: 1; min-width: 0; height: 40rpx; font-size: 26rpx; }
.pc-grey { color: #bfbfbf; }

/* ===== 列表卡片 ===== */
.list-item { background: var(--li-card-bg); border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; box-shadow: var(--li-shadow); }
.item-header { display: flex; align-items: flex-start; gap: 16rpx; }
.sel-box { display: flex; align-items: center; padding-top: 4rpx; }
.sel-all-text { margin-left: 8rpx; font-size: 26rpx; }
.header-main { flex: 1; min-width: 0; }
.item-title { font-size: 30rpx; font-weight: 600; color: var(--li-title); word-break: break-all; }
.item-sub { margin-top: 6rpx; font-size: 24rpx; color: var(--li-sub); }
.grid-tag { flex-shrink: 0; padding: 6rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 500; white-space: nowrap; }

.img-row { display: flex; gap: 16rpx; margin-top: 20rpx; }
.img-cell { flex: 1; min-width: 0; border-radius: 14rpx; padding: 16rpx 0; display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.img-cell-ico { display: flex; align-items: center; }
.img-cell-label { font-size: 22rpx; white-space: nowrap; }
.img-cell-num { font-size: 24rpx; font-weight: 600; }

.meta-grid { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid var(--li-line); display: flex; flex-direction: column; gap: 10rpx; }
.meta-item { display: flex; align-items: baseline; gap: 16rpx; }
.meta-label { flex: 0 0 170rpx; font-size: 24rpx; }
.meta-val { flex: 1; min-width: 0; font-size: 25rpx; word-break: break-all; }

.notes-line { margin-top: 16rpx; padding: 14rpx 18rpx; border-radius: 12rpx; font-size: 24rpx; line-height: 1.6; }

.item-footer { display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid var(--li-line); }

/* ===== 批量删除底栏 ===== */
.batch-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; display: flex; align-items: center; gap: 24rpx; padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06); }
.batch-count { flex: 1; font-size: 26rpx; }
.batch-num { font-weight: 700; }

/* ===== 图片弹框 ===== */
.sheet { padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom)); border-radius: 24rpx 24rpx 0 0; }
.sheet-title { font-size: 32rpx; font-weight: 600; margin-bottom: 24rpx; }
.sheet-actions { display: flex; gap: 20rpx; margin-top: 24rpx; }
.img-scroll { min-height: 120rpx; }
.img-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.img-grid-cell { position: relative; width: 150rpx; height: 150rpx; border-radius: 12rpx; overflow: hidden; border: 1rpx solid rgba(128, 128, 128, 0.25); }
.img-thumb { width: 100%; height: 100%; display: block; }
.img-remove { position: absolute; top: 4rpx; right: 4rpx; width: 44rpx; height: 44rpx; border-radius: 50%; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; }
.img-add { display: flex; align-items: center; justify-content: center; border-style: dashed; }
.img-empty { font-size: 24rpx; padding: 30rpx 0; }
.img-count { margin-top: 16rpx; font-size: 24rpx; }
</style>
