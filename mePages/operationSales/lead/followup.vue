<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'" :theme="theme">
        <wd-navbar left-arrow title="添加跟进" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />

        <view style="padding: 20rpx;">
            <!-- 规则提示（对齐 web） -->
            <view class="rule-tip" :style="{ background: isDark ? 'rgba(22, 119, 255, 0.12)' : '#e6f4ff', color: isDark ? '#69b1ff' : '#1677ff' }">
                每次跟进都会新增一条记录，不会覆盖之前的跟进历史。
            </view>

            <view class="form-card" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
                <!-- 跟进方式 -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">跟进方式</view>
                <view class="chip-row">
                    <view v-for="opt in followupTypeOptions" :key="opt.value" class="chip" :class="{ active: model.followupType === opt.value }"
                        :style="model.followupType === opt.value ? activeChipStyle : chipStyle" @click="model.followupType = opt.value">{{ opt.label }}</view>
                </view>

                <!-- 跟进内容（必填） -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">跟进内容（必填）</view>
                <textarea class="op-textarea content-textarea" v-model="model.content" maxlength="2000" placeholder="本次电话、微信、拜访、邮件的沟通纪要（必填）" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" :style="{ background: isDark ? '#1b1b1b' : 'rgba(128, 128, 128, 0.08)', color: isDark ? '#e8e8e8' : '#333' }" />

                <!-- 下次跟进（选填）：日期+时间双原生 picker，年月日+时分 -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">下次跟进（选填）</view>
                <view class="datetime-row">
                    <picker class="datetime-item" mode="date" :value="nextFollowupDate" @change="handleNextDateChange">
                        <view class="form-picker" :style="{ background: isDark ? '#1b1b1b' : '#f5f5f5', color: nextFollowupDate ? (isDark ? '#e8e8e8' : '#333') : '#bbb' }">{{ nextFollowupDate || '选择日期' }} <text class="arrow" :style="{ color: isDark ? '#6a6a6a' : '#c8c9cc' }">›</text></view>
                    </picker>
                    <picker class="datetime-item" mode="time" :value="nextFollowupTime" @change="handleNextTimeChange">
                        <view class="form-picker" :style="{ background: isDark ? '#1b1b1b' : '#f5f5f5', color: nextFollowupTime ? (isDark ? '#e8e8e8' : '#333') : '#bbb' }">{{ nextFollowupTime || '选择时间' }} <text class="arrow" :style="{ color: isDark ? '#6a6a6a' : '#c8c9cc' }">›</text></view>
                    </picker>
                    <view v-if="model.nextFollowupAt" class="clear-btn" :style="{ color: isDark ? '#6a6a6a' : '#999' }" @click.stop="clearNextFollowup">×</view>
                </view>

                <!-- 客户标记：老客户/已添加微信保存在线索上，随修改线索接口一并保存（回填当前值） -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">客户标记</view>
                <view class="switch-row" :style="{ borderBottom: '2rpx solid rgba(128, 128, 128, 0.08)' }">
                    <text class="switch-label" :style="{ color: isDark ? '#e8e8e8' : '#333' }">是老客户</text>
                    <switch :checked="model.oldCustomer" color="#1677ff" style="transform: scale(0.8);" @change="model.oldCustomer = $event.detail.value" />
                </view>
                <view class="switch-row">
                    <text class="switch-label" :style="{ color: isDark ? '#e8e8e8' : '#333' }">已添加微信</text>
                    <switch :checked="model.wechatAdded" color="#1677ff" style="transform: scale(0.8);" @change="model.wechatAdded = $event.detail.value" />
                </view>

                <!-- 跟进图片（选填，最多 6 张，单张 <10MB；提交时才上传） -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">跟进图片（选填，最多 6 张，单张不超过 10MB）</view>
                <view class="img-grid">
                    <view class="img-cell" v-for="(img, i) in imgList" :key="i">
                        <image class="img-thumb" :src="img.path" mode="aspectFill" @click="previewImg(i)" />
                        <view class="img-del" @click.stop="removeImg(i)">×</view>
                    </view>
                    <view v-if="imgList.length < IMG_MAX" class="img-add" :style="{ background: isDark ? '#1b1b1b' : '#f5f5f5', color: isDark ? '#6a6a6a' : '#999' }" @click="chooseImg">＋</view>
                </view>

                <!-- 跟进结果 -->
                <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">跟进结果</view>
                <view class="chip-row">
                    <view v-for="opt in leadOutcomeStatusOptions" :key="opt.value" class="chip" :class="{ active: model.outcomeStatus === opt.value }"
                        :style="model.outcomeStatus === opt.value ? activeChipStyle : chipStyle" @click="model.outcomeStatus = opt.value">{{ opt.label }}</view>
                </view>
                <!-- 合同号（成交必填）：与一键成交同口径，需为系统中已存在的合同号 -->
                <block v-if="model.outcomeStatus === 'DEAL'">
                    <view class="form-label" :style="{ color: isDark ? '#8a9099' : '#999' }">合同号（成交必填，需与已签合同一致）</view>
                    <input class="op-input" v-model="model.contractNumber" maxlength="100" placeholder="请输入合同号，如 HT20260315001" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" :style="{ background: isDark ? '#1b1b1b' : 'rgba(128, 128, 128, 0.08)', color: isDark ? '#e8e8e8' : '#333' }" />
                </block>
                <view v-if="pendingHandoff && isTerminal" class="terminal-warn" :style="{ background: isDark ? 'rgba(250, 140, 22, 0.12)' : '#fff7e6', color: isDark ? '#fa8c16' : '#d46b08' }">
                    该线索正在交接给「{{ pendingHandoffName }}」。提交终结结果前需先取消交接或等待对方处理完毕，否则待接收人将一直存在且无法操作。
                </view>
            </view>

            <wd-button block type="primary" custom-style="margin-top: 30rpx;" :disabled="submitting" @click="submit">{{ uploading ? '图片上传中…' : '确认提交' }}</wd-button>
            <view style="height: 40rpx;"></view>
        </view>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { uploadFile } from "@/utils/uploadFile";
import { fetchLeadDetail, fetchLeadUpdate, fetchFollowupCreate } from "@/service/operationSales";
import { fetchAddRdFileList } from "@/service/prjRdFile";
import { useOpUserMap } from "../user-map";
import {
    leadOutcomeStatusMap,
    leadOutcomeStatusOptions,
    terminalOutcomeStatuses,
    followupTypeOptions
} from "../constants";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const { nameOf, load: loadUserMap } = useOpUserMap();

const leadId = ref<number | ''>('');
const detail = ref<any>(null);
const submitting = ref(false);
const uploading = ref(false);

const model = ref<any>({ followupType: 'PHONE', content: '', nextFollowupAt: '', outcomeStatus: 'UNASSESSED', contractNumber: '', oldCustomer: false, wechatAdded: false });

const chipStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#f5f5f5', color: isDark.value ? '#c9cdd4' : '#4e5969' }));
const activeChipStyle = computed(() => ({ background: isDark.value ? 'rgba(22, 119, 255, 0.3)' : '#e6f4ff', color: isDark.value ? '#69b1ff' : '#1677ff', borderColor: isDark.value ? '#69b1ff' : '#1677ff' }));

/** 待处理交接：终结结果提交前必须先处理 */
const pendingHandoff = computed(() => (detail.value?.handoffs || []).find((h: any) => h.status === 'PENDING'));
const pendingHandoffName = computed(() => nameOf(pendingHandoff.value?.to_user_id));
const isTerminal = computed(() => terminalOutcomeStatuses.includes(model.value.outcomeStatus));

/* ---------------- 详情加载（回填客户标记 + 整体更新所需的线索字段） ---------------- */
async function getDetail() {
    if (!leadId.value) return;
    try {
        const res: any = await fetchLeadDetail(leadId.value);
        detail.value = res ?? null;
        // 客户标记回填当前值（响应布尔可能为数据库数值 1/0，对齐 web openFollowup）
        model.value.oldCustomer = Number(res?.old_customer) === 1 || res?.old_customer === true;
        model.value.wechatAdded = Number(res?.wechat_added) === 1 || res?.wechat_added === true;
    } catch (err) {
        console.error('获取线索详情失败', err);
    }
}

/* ---------------- 下次跟进：日期+时间双 picker（yyyy-MM-dd HH:mm:ss 提交；秒固定 00） ---------------- */
const nextFollowupDate = ref('');
const nextFollowupTime = ref('');
function syncNextFollowup() { model.value.nextFollowupAt = nextFollowupDate.value && nextFollowupTime.value ? `${nextFollowupDate.value} ${nextFollowupTime.value}:00` : ''; }
function handleNextDateChange(e: any) { nextFollowupDate.value = e.detail.value; syncNextFollowup(); }
function handleNextTimeChange(e: any) { nextFollowupTime.value = e.detail.value; syncNextFollowup(); }
function clearNextFollowup() { nextFollowupDate.value = ''; nextFollowupTime.value = ''; model.value.nextFollowupAt = ''; }

/* ---------------- 跟进图片：选择时校验，提交时才上传 ---------------- */
const IMG_MAX = 6;
const imgList = ref<any[]>([]);

function chooseImg() {
    const remain = IMG_MAX - imgList.value.length;
    if (remain <= 0) return;
    uni.chooseImage({
        count: remain,
        success: (res: any) => {
            const files: any[] = res.tempFiles || [];
            const paths: string[] = res.tempFilePaths || [];
            files.forEach((f: any, i: number) => {
                if (Number(f.size) / 1024 / 1024 >= 10) {
                    uni.showToast({ title: '有图片超过 10MB，已跳过', icon: 'none' });
                    return;
                }
                const p = paths[i] || f.path;
                if (!p) return;
                imgList.value.push({ path: p });
            });
        }
    });
}
function removeImg(i: number) { imgList.value.splice(i, 1); }
function previewImg(i: number) {
    uni.previewImage({ urls: imgList.value.map((x: any) => x.path), current: i });
}

/** 提交时逐张上传七牛，返回 { furl, fname } 列表；任一张失败即中止（对齐 web uploadPendingFollowupImgs） */
async function uploadPendingImgs(): Promise<{ furl: string; fname: string }[]> {
    const imgs: { furl: string; fname: string }[] = [];
    for (let i = 0; i < imgList.value.length; i++) {
        const item = imgList.value[i];
        const path = item.path as string;
        let name = String(path).split('/').pop() || '';
        if (!/\.[a-zA-Z0-9]+$/.test(name)) name = `followup_${Date.now()}_${i}.jpg`;
        // uploadFile 失败时走 onFail 而不抛出，用 furl 空值判定失败
        let furl = '';
        await uploadFile({ tempFilePath: path, url: path, name } as any, 'qiniu', (res: any) => { furl = res?.data || ''; });
        if (!furl) throw new Error('图片上传失败');
        imgs.push({ furl, fname: name });
    }
    return imgs;
}

/* ---------------- 提交 ---------------- */
async function submit() {
    if (!String(model.value.content || '').trim()) {
        uni.showToast({ title: '请填写本次跟进内容', icon: 'none' });
        return;
    }
    // 成交必须携带合同号：去空格后必填且不超过 100 字符（与一键成交同口径，存在性由后端校验）
    if (model.value.outcomeStatus === 'DEAL') {
        const contractNumber = String(model.value.contractNumber || '').replace(/\s/g, '');
        if (!contractNumber) {
            uni.showToast({ title: '成交必须填写合同号', icon: 'none' });
            return;
        }
        if (contractNumber.length > 100) {
            uni.showToast({ title: '合同号不能超过 100 个字符', icon: 'none' });
            return;
        }
        model.value.contractNumber = contractNumber;
    }
    if (submitting.value || uploading.value) return;
    const terminal = isTerminal.value;
    if (terminal && pendingHandoff.value) {
        // 有进行中的交接时，终结线索会导致待接收状态卡住，必须先取消交接（对齐 web 拦截）
        uni.showModal({
            title: '存在进行中的交接',
            content: `该线索正在交接中，等待对方接收。直接结束线索会导致待接收状态无法消除。请先取消交接，再提交终结结果。`,
            showCancel: false,
            confirmText: '我知道了',
            success: () => { }
        });
        return;
    }
    if (terminal) {
        // 终结结果会立即把线索置为 FINISHED，提交前二次确认
        const ok = await new Promise<boolean>(resolve => {
            uni.showModal({
                title: '确认结束线索？',
                content: `结果「${leadOutcomeStatusMap[model.value.outcomeStatus] || model.value.outcomeStatus}」为终结结果，提交后线索将进入「已结束」，不能再新增跟进或交接。`,
                confirmText: '确认提交',
                cancelText: '再想想',
                success: (r: any) => resolve(!!r.confirm),
                fail: () => resolve(false)
            });
        });
        if (!ok) return;
    }
    submitting.value = true;
    try {
        // 图片在提交时才上传：任一张失败即中止，不产生业务数据
        let imgs: { furl: string; fname: string }[] = [];
        if (imgList.value.length) {
            uploading.value = true;
            try {
                imgs = await uploadPendingImgs();
            } catch (err) {
                console.error('图片上传失败', err);
                uni.showToast({ title: '图片上传失败，请重试', icon: 'none' });
                return;
            } finally {
                uploading.value = false;
            }
        }
        // 客户标记（老客户/加微信）保存在线索上，走修改线索接口；该接口为完整资料更新，必须回填全部字段
        const d = detail.value || {};
        await fetchLeadUpdate({
            id: leadId.value,
            channelCode: d.origin_type === 'EXHIBITION' ? null : d.channel_code || null,
            sourceRemark: d.origin_type === 'EXHIBITION' ? null : d.source_remark || null,
            customerName: d.customer_name || '',
            contactName: d.contact_name || null,
            contactPhone: d.contact_phone || null,
            contactWechat: d.contact_wechat || null,
            consultationContent: d.consultation_content || null,
            oldCustomer: !!model.value.oldCustomer,
            wechatAdded: !!model.value.wechatAdded,
            // occurredAt 不传时后端保留原值
            occurredAt: d.occurred_at || undefined
        });
        // fetchFollowupCreate 返回跟进记录 id，图片登记以 pid 关联（ftype 11）
        const followupId: any = await fetchFollowupCreate({
            leadId: leadId.value,
            followupType: model.value.followupType || 'OTHER',
            content: model.value.content,
            nextFollowupAt: model.value.nextFollowupAt || undefined,
            outcomeStatus: model.value.outcomeStatus || 'UNASSESSED',
            // 成交时合同号必填（2026-10-14）：outcomeStatus=DEAL 必须传 contractNumber
            contractNumber: model.value.outcomeStatus === 'DEAL' ? String(model.value.contractNumber || '').replace(/\s/g, '') : undefined
        });
        if (imgs.length && followupId != null) {
            try {
                await fetchAddRdFileList(imgs.map(img => ({
                    furl: img.furl,
                    fname: img.fname || '跟进图片',
                    pid: followupId,
                    ftype: 11
                })));
            } catch (err) {
                console.error('跟进图片登记失败', err);
                uni.showToast({ title: '跟进已提交，但图片登记失败', icon: 'none' });
            }
        }
        uni.showToast({ title: terminal ? '跟进已提交，线索已结束' : '跟进已提交', icon: 'none' });
        uni.$emit('refreshOpLeadList');
        setTimeout(() => uni.navigateBack(), 600);
    } finally {
        submitting.value = false;
    }
}

function handleClickLeft() { uni.navigateBack(); }
onLoad((options: any) => {
    leadId.value = options?.id ? Number(options.id) : '';
});
onMounted(() => { getDetail(); loadUserMap(); });
</script>
<style lang="scss" scoped>
.rule-tip {
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 24rpx;
    line-height: 36rpx;
    margin-bottom: 20rpx;
}

.form-card {
    border-radius: 20rpx;
    padding: 24rpx;
}

.form-label {
    font-size: 25rpx;
    margin: 8rpx 0 10rpx;
}

.chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
    margin-bottom: 20rpx;
}

.chip {
    padding: 10rpx 26rpx;
    border-radius: 28rpx;
    font-size: 25rpx;
    border: 2rpx solid transparent;
}

.op-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 140rpx;
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 26rpx;
    margin-bottom: 20rpx;
}

.op-input {
    width: 100%;
    box-sizing: border-box;
    height: 72rpx;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
    margin-bottom: 20rpx;
}

.content-textarea {
    min-height: 200rpx;
}

.datetime-row {
    display: flex;
    gap: 16rpx;
    align-items: center;
    margin-bottom: 20rpx;
}

.datetime-item {
    flex: 1;
    min-width: 0;
}

.form-picker {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18rpx 20rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
}

.form-picker .arrow {
    font-size: 36rpx;
}

.clear-btn {
    font-size: 40rpx;
    padding: 0 8rpx;
    line-height: 1;
}

.switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10rpx 0;
}

.switch-label {
    font-size: 26rpx;
}

.img-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-bottom: 20rpx;
}

.img-cell {
    position: relative;
    width: 136rpx;
    height: 136rpx;
}

.img-thumb {
    width: 100%;
    height: 100%;
    border-radius: 12rpx;
    display: block;
}

.img-del {
    position: absolute;
    top: -12rpx;
    right: -12rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 30rpx;
    line-height: 38rpx;
    text-align: center;
}

.img-add {
    width: 136rpx;
    height: 136rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60rpx;
    font-weight: 300;
}

.terminal-warn {
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 24rpx;
    line-height: 36rpx;
}

:deep(.whiteClass) {
    color: #6a6a6a;
}

:deep(.greyClass) {
    color: #c0c4cc;
}
</style>
