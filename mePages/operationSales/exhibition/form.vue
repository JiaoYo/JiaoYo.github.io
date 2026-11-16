<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
            <wd-navbar left-arrow :title="isEdit ? '修改展会' : '新建展会'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view style="padding: 20rpx;">
            <view class="form-tip" :style="{ background: isDark ? 'rgba(22, 119, 255, 0.12)' : '#e6f4ff', color: isDark ? '#69b1ff' : '#1677ff' }">
                <block v-if="isEdit">仅「进行中」的展会可修改；参展人为完整新名单，已被历史线索引用的参展人不能移除。</block>
                <block v-else>展会参展人可选择任意有效我司账号（不限制人员类型）；展会线索的实际获客人必须从该展会参展人中选择。</block>
            </view>

            <view class="section-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">展会名称（必填）</view>
                <input class="form-input" v-model="form.exhibitionName" maxlength="200" placeholder="必填" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">开始日期（必填）</view>
                <wd-datetime-picker type="date" v-model="startTs" :default-value="Date.now()" @confirm="onStartConfirm">
                    <view class="picker-value" :style="pickerBgStyle">
                        <text :class="{ placeholder: !form.startDate }">{{ form.startDate || '必填' }}</text>
                        <text v-if="form.startDate" class="clear-inline" @click.stop="clearStart">×</text>
                    </view>
                </wd-datetime-picker>

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">结束日期</view>
                <wd-datetime-picker type="date" v-model="endTs" :default-value="Date.now()" @confirm="onEndConfirm">
                    <view class="picker-value" :style="pickerBgStyle">
                        <text :class="{ placeholder: !form.endDate }">{{ form.endDate || '不填时按开始日期保存' }}</text>
                        <text v-if="form.endDate" class="clear-inline" @click.stop="clearEnd">×</text>
                    </view>
                </wd-datetime-picker>

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">地点</view>
                <input class="form-input" v-model="form.location" maxlength="255" placeholder="选填" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">参展人（至少一名）</view>
                <view class="picker-value" :style="pickerBgStyle" @click="openMemberPicker">
                    <block v-if="form.memberUserIds.length">
                        <view class="member-chip-row">
                            <view v-for="name in selectedMemberNames.slice(0, 8)" :key="name" class="mini-tag member-chip">{{ name }}</view>
                            <view v-if="selectedMemberNames.length > 8" class="mini-tag member-chip">+{{ selectedMemberNames.length - 8 }}</view>
                        </view>
                    </block>
                    <text v-else class="placeholder">选择一名或多名参展员工</text>
                </view>

                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">备注</view>
                <textarea class="form-textarea" v-model="form.remark" maxlength="1000" placeholder="选填，如展位号" :style="inputStyle" :placeholderStyle="'color:' + (isDark ? '#6a6a6a' : '#c0c4cc')" />
            </view>

            <wd-button block type="primary" :disabled="submitting || editLoading" @click="handleSubmit">{{ isEdit ? '确认修改' : '确认创建' }}</wd-button>
            <view style="height: 40rpx;"></view>
        </view>

        <!-- 参展人多选 -->
        <wd-popup v-model="memberPickerVisible" position="bottom" custom-class="op-popup" :safe-area-inset-bottom="true">
            <view class="popup-body" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">选择参展人</view>
                <scroll-view scroll-y class="member-scroll" :style="{ maxHeight: '50vh' }">
                    <view v-for="opt in memberSelectOptions" :key="opt.id" class="member-option" @click="toggleMember(opt.id)">
                        <text class="member-name" :style="{ color: isDark ? '#e8e8e8' : '#333' }">{{ opt.username }}</text>
                        <view class="check-dot" :class="{ checked: tempSelectedIds.includes(opt.id) }"
                            :style="tempSelectedIds.includes(opt.id) ? { background: '#1677ff', borderColor: '#1677ff' } : { borderColor: isDark ? '#6a6a6a' : '#ccc' }">
                            <text v-if="tempSelectedIds.includes(opt.id)" style="color: #fff; font-size: 22rpx;">✓</text>
                        </view>
                    </view>
                    <view v-if="!memberSelectOptions.length" class="empty-line" :style="{ color: isDark ? '#6a6a6a' : '#bbb' }">暂无可选人员</view>
                </scroll-view>
                <view class="popup-footer">
                    <wd-button size="small" type="info" plain @click="memberPickerVisible = false">取消</wd-button>
                    <wd-button size="small" type="primary" @click="confirmMembers">确定</wd-button>
                </view>
            </view>
        </wd-popup>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchExhibitionDetail, fetchExhibitionCreate, fetchExhibitionUpdate } from "@/service/operationSales";
import { useOpUserMap, fetchActiveUsers } from "../user-map";
import { formatTs } from "../constants";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const { nameOf, load: loadUserMap } = useOpUserMap();

const isEdit = ref(false);
const editLoading = ref(false);
const submitting = ref(false);
const exhibitionId = ref<number | ''>('');

const form = ref<any>({
    exhibitionName: '',
    startDate: '',
    endDate: '',
    location: '',
    remark: '',
    memberUserIds: [] as any[]
});
const startTs = ref<number>(Date.now());
const endTs = ref<number>(Date.now());

const chipStyleBg = computed(() => (isDark.value ? 'rgba(22, 119, 255, 0.2)' : 'rgba(22, 119, 255, 0.1)'));
const inputStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#f5f5f5', color: isDark.value ? '#e8e8e8' : '#333' }));
const pickerBgStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#f5f5f5' }));

/* ---------------- 候选人员：全部有效账号；修改时并入已保存参展人（含已停用账号） ---------------- */
const activeUsers = ref<any[]>([]);
const savedMembers = ref<any[]>([]);
const memberSelectOptions = computed(() => {
    const map = new Map<string, any>();
    activeUsers.value.forEach((u: any) => map.set(String(u.id), u));
    if (isEdit.value) {
        savedMembers.value.forEach((m: any) => {
            if (!map.has(String(m.user_id))) map.set(String(m.user_id), { id: m.user_id, username: m.username });
        });
    }
    return [...map.values()];
});
const selectedMemberNames = computed(() =>
    form.value.memberUserIds.map((id: any) => memberSelectOptions.value.find((u: any) => String(u.id) === String(id))?.username || nameOf(id) || `用户#${id}`)
);

/* ---------------- 参展人多选弹窗 ---------------- */
const memberPickerVisible = ref(false);
const tempSelectedIds = ref<any[]>([]);
function openMemberPicker() {
    tempSelectedIds.value = [...form.value.memberUserIds];
    memberPickerVisible.value = true;
}
function toggleMember(id: any) {
    const idx = tempSelectedIds.value.findIndex((v: any) => String(v) === String(id));
    if (idx >= 0) tempSelectedIds.value.splice(idx, 1);
    else tempSelectedIds.value.push(id);
}
function confirmMembers() {
    form.value.memberUserIds = [...tempSelectedIds.value];
    memberPickerVisible.value = false;
}

/* ---------------- 日期 ---------------- */
function onStartConfirm({ value }: any) { form.value.startDate = formatTs(value); }
function clearStart() { form.value.startDate = ''; }
function onEndConfirm({ value }: any) { form.value.endDate = formatTs(value); }
function clearEnd() { form.value.endDate = ''; }

/* ---------------- 修改回填：先取详情回填全部字段，参展人名单为完整新名单提交 ---------------- */
async function initEdit(id: number) {
    editLoading.value = true;
    try {
        const d: any = await fetchExhibitionDetail(id);
        if (!d) {
            uni.navigateBack();
            return;
        }
        savedMembers.value = d?.members || [];
        form.value = {
            exhibitionName: d?.exhibition_name || '',
            startDate: d?.start_date || '',
            endDate: d?.end_date || d?.start_date || '',
            location: d?.location || '',
            remark: d?.remark || '',
            memberUserIds: savedMembers.value.map((m: any) => m.user_id)
        };
        startTs.value = parseDay(d?.start_date) || Date.now();
        endTs.value = parseDay(d?.end_date || d?.start_date) || Date.now();
    } catch (err) {
        console.error('获取展会详情失败', err);
        uni.navigateBack();
    } finally {
        editLoading.value = false;
    }
}
// 'yyyy-MM-dd' → 时间戳（iOS 需把 - 换成 /）
function parseDay(s: any): number {
    if (!s) return 0;
    const n = Date.parse(String(s).replace(/-/g, '/') + ' 00:00:00');
    return Number.isFinite(n) ? n : 0;
}

/* ---------------- 提交 ---------------- */
async function handleSubmit() {
    if (submitting.value || editLoading.value) return;
    const m = form.value;
    if (!String(m.exhibitionName || '').trim()) {
        uni.showToast({ title: '请填写展会名称', icon: 'none' });
        return;
    }
    if (!m.startDate) {
        uni.showToast({ title: '请选择开始日期', icon: 'none' });
        return;
    }
    if (!m.memberUserIds.length) {
        uni.showToast({ title: '至少选择一名参展人', icon: 'none' });
        return;
    }
    submitting.value = true;
    try {
        const payload: any = {
            exhibitionName: String(m.exhibitionName).trim(),
            startDate: m.startDate,
            // 结束日期不传时后端按开始日期保存
            endDate: m.endDate || m.startDate,
            location: m.location || null,
            remark: m.remark || null,
            // 提交前对 ID 去重（同一人员只能选择一次）；传入时为完整新名单且至少一人
            memberUserIds: [...new Set(m.memberUserIds.map((id: any) => Number(id)))]
        };
        if (isEdit.value) {
            // 仅 ACTIVE 展会可修改；已被历史线索引用的参展人不能移除（后端拒绝并提示）
            await fetchExhibitionUpdate({ id: exhibitionId.value, ...payload });
            uni.showToast({ title: '展会已修改', icon: 'none' });
        } else {
            await fetchExhibitionCreate(payload);
            uni.showToast({ title: '展会已创建', icon: 'none' });
        }
        uni.$emit('refreshOpExhibitionList');
        setTimeout(() => uni.navigateBack(), 600);
    } finally {
        submitting.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }
onLoad(async (options: any) => {
    loadUserMap();
    try {
        activeUsers.value = await fetchActiveUsers();
    } catch (err) {
        console.error('获取人员列表失败', err);
    }
    if (options?.id) {
        isEdit.value = true;
        exhibitionId.value = Number(options.id);
        initEdit(exhibitionId.value);
    }
});
</script>
<style lang="scss" scoped>
.topFixedWrap {
    background-color: #fff;
}

.form-tip {
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 24rpx;
    line-height: 36rpx;
    margin-bottom: 20rpx;
}

.section-card {
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.form-label {
    font-size: 25rpx;
    margin: 16rpx 0 10rpx;

    &:first-child {
        margin-top: 0;
    }
}

.form-input {
    width: 100%;
    box-sizing: border-box;
    height: 76rpx;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
}

.form-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 120rpx;
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 26rpx;
}

.picker-value {
    position: relative;
    padding: 18rpx 20rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    word-break: break-all;
}

.placeholder {
    color: #bbb;
}

.clear-inline {
    position: absolute;
    right: 24rpx;
    top: 50%;
    transform: translateY(-50%);
    font-size: 34rpx;
    color: #999;
    padding: 0 8rpx;
}

.member-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.member-chip {
    padding: 6rpx 20rpx;
    border-radius: 22rpx;
    font-size: 23rpx;
    background: rgba(22, 119, 255, 0.1);
    color: #1677ff;
}

.mini-tag {
    white-space: nowrap;
}

.popup-body {
    padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
}

.popup-title {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 20rpx;
}

.member-scroll {
    max-height: 50vh;
}

.member-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 8rpx;
    border-bottom: 2rpx solid rgba(128, 128, 128, 0.08);
}

.member-name {
    font-size: 27rpx;
}

.check-dot {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    border: 3rpx solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    margin-top: 24rpx;
}

.empty-line {
    font-size: 26rpx;
    text-align: center;
    padding: 30rpx 0;
}
</style>
