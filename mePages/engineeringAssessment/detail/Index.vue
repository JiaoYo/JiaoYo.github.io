<template>
	<page-meta :disable-scroll="signPopupShow" />
	<wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6fb;'" :theme="theme">
		<view :style="{ height: topFixedHeight + 'px' }"></view>
		<view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#1b1b1b' : '#fff' }">
			<wd-navbar left-arrow :title="pageTitle" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
			<view class="head-card" :style="{ background: isDark ? '#1b1b1b' : '#fff' }">
				<view class="sheet-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ sheetTitle }}</view>
				<view class="head-tag-row">
					<view class="head-tag" :style="statusStyle">{{ statusTextMap[Number(inst.status)] ?? '-' }}</view>
					<view class="head-tag" :style="sourceTagStyle">{{ scheduleSource === 'MANUAL' ? '手工指定' : '默认日期' }}</view>
				</view>
				<view class="head-range" :style="{ color: isDark ? '#8a9099' : '#969799' }">开放时间：{{ windowRangeText }}</view>
			</view>
		</view>

		<view class="body" :style="pageVars">
			<!-- 窗口关闭提示：评分控件全部只读 -->
			<view v-if="!windowOpen" class="tip-bar tip-bar--closed">考核窗口未开启或已关闭，评分输入已禁用；如需补交/修订请联系管理员或综合管理重新开启。</view>
			<!-- 已取消资格原因（只读展示） -->
			<view v-if="inst.disqualifyReason" class="tip-bar tip-bar--disqualify">已取消阶梯奖金资格：{{ inst.disqualifyReason }}</view>

			<!-- 基本信息 -->
			<view class="section-card">
				<view class="info-rows">
					<view class="info-row"><text class="lbl">被评分人</text><text class="val">{{ inst.employeeName || '-' }}</text></view>
					<view class="info-row"><text class="lbl">入职时间</text><text class="val">{{ entryDateText }}</text></view>
					<view class="info-row"><text class="lbl">所在部门</text><text class="val">{{ departmentText }}</text></view>
					<view class="info-row"><text class="lbl">评分周期</text><text class="val">{{ inst.evaluationCycle || '-' }}</text></view>
				</view>
			</view>

			<!-- BONUS 上级评分：资格与取消原因（与考核说明第 4~7 条对应） -->
			<view v-if="reviewEdit && isBonus" class="section-card">
				<view class="section-title">阶梯奖金资格</view>
				<view class="elig-radios">
					<view class="radio-chip" :class="{ 'radio-chip--on': Number(eligibilityValue) === 1 }" @click="eligibilityValue = 1">合格</view>
					<view class="radio-chip" :class="{ 'radio-chip--on': Number(eligibilityValue) === 0 }" @click="eligibilityValue = 0">取消资格（最终系数强制为 0，原始评分保留）</view>
				</view>
				<view v-if="Number(eligibilityValue) === 0" class="area-wrap" style="margin-top: 16rpx;">
					<textarea v-model="disqualifyReason" class="area-input" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }" placeholder="请填写取消资格原因（必填），如：当月请假和调休合计超过3天" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" :maxlength="200" />
				</view>
			</view>

			<!-- 评分表主体：按纸质 Excel 版式逐项还原（移动端卡片化） -->
			<view class="section-card">
				<view v-for="item in rows" :key="item.id" class="item-card">
					<view class="item-head">
						<view class="item-no">{{ item.sortNo }}</view>
						<view v-if="hasCategory && item.categoryName" class="item-cat">{{ item.categoryName }}</view>
						<view class="item-max">满分 {{ item.maxScore }}</view>
					</view>
					<view class="item-name">
						<text class="item-name-text">{{ item.itemName }}</text>
						<view v-if="String(item.scoreMode) === 'AUTO_OVERRIDE'" class="auto-tag">{{ autoSourceLabel(item) }}</view>
					</view>
					<view class="item-standard">{{ item.assessmentStandard }}</view>

					<view class="band-label">计分范围<text v-if="(selfEdit || reviewEdit) && String(item.scoreMode) === 'FIXED'" class="band-label-tip">（点击选择档位，分数自动填入）</text></view>
					<view class="band-grid">
						<view v-for="n in 5" :key="n" class="band-cell"
							:class="{ 'band-cell--click': bandCellClickable(item, bandAt(item, n)), 'band-cell--empty': !bandAt(item, n), 'band-cell--sel-self': pickedBands.has(item.id + ':self') && isBandSel(item, bandAt(item, n), 'selfScore'), 'band-cell--sel-review': pickedBands.has(item.id + ':review') && isBandSel(item, bandAt(item, n), 'reviewScore') }"
							@click="onBandCellClick(item, n)">
							<view class="band-head">{{ meta.bandHeads[n - 1] }}</view>
							<view class="band-desc">{{ bandAt(item, n)?.bandDescription || '/' }}</view>
						</view>
					</view>

					<view class="score-rows">
						<view class="score-row">
							<text class="score-row-label">自评分</text>
							<view class="score-row-body">
								<input v-if="selfEdit && String(item.scoreMode) !== 'FIXED'" class="score-input" type="digit" :value="item.selfScore ?? ''" :placeholder="'0-' + item.maxScore" placeholder-class="score-input-ph" @input="(e) => onScoreInput(item, 'selfScore', e)" @blur="onScoreBlur(item, 'selfScore')" />
								<view v-else class="score-num">
									<text v-if="!isBlankScore(item.selfScore)">{{ item.selfScore }}</text>
									<text v-else-if="selfEdit && String(item.scoreMode) === 'FIXED'" class="score-hint">点选分档</text>
									<text v-else>{{ Number(inst.status) !== 0 ? '/' : '' }}</text>
								</view>
							</view>
						</view>
						<view class="score-row">
							<text class="score-row-label">自备注</text>
							<view class="score-row-body">
								<textarea v-if="selfEdit" class="note-input" :value="item.selfNote || ''" placeholder="备注" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" auto-height :maxlength="200" @input="(e) => (item.selfNote = e.detail.value)" />
								<text v-else class="note-text">{{ item.selfNote || '' }}</text>
							</view>
						</view>
						<view class="score-row">
							<text class="score-row-label">{{ meta.reviewColName }}</text>
							<view class="score-row-body">
								<input v-if="reviewEdit && String(item.scoreMode) !== 'FIXED'" class="score-input" type="digit" :value="item.reviewScore ?? ''" :placeholder="'0-' + item.maxScore" placeholder-class="score-input-ph" @input="(e) => onScoreInput(item, 'reviewScore', e)" @blur="onScoreBlur(item, 'reviewScore')" />
								<view v-else class="score-num">
									<text v-if="!isBlankScore(item.reviewScore)">{{ item.reviewScore }}</text>
									<text v-else-if="reviewEdit && String(item.scoreMode) === 'FIXED'" class="score-hint">点选分档</text>
									<text v-else>{{ Number(inst.status) === 0 ? '/' : '' }}</text>
								</view>
							</view>
						</view>
						<view class="score-row">
							<text class="score-row-label">备注</text>
							<view class="score-row-body">
								<textarea v-if="reviewEdit" class="note-input" :value="item.reviewNote || ''" placeholder="备注" :placeholder-style="'color:' + (isDark ? '#6b7075' : '#bfbfbf')" auto-height :maxlength="200" @input="(e) => (item.reviewNote = e.detail.value)" />
								<text v-else class="note-text">{{ item.reviewNote || '' }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 总计得分 -->
				<view class="total-row">
					<text class="total-label">总计得分</text>
					<view class="total-cell">
						<text class="total-cap">自评分</text>
						<text class="total-num">{{ selfTotalShow }}</text>
					</view>
					<view class="total-cell">
						<text class="total-cap">{{ meta.reviewColName }}</text>
						<text class="total-num">{{ reviewTotalShow }}</text>
					</view>
				</view>

				<view v-if="!rows.length && !loading" class="empty-tip">暂无评分项数据</view>
			</view>

			<!-- 签字确认（Excel 原顺序角色）：实例快照携带签名图片/签名值与签名时间 -->
			<view class="section-card">
				<view class="section-title">签字确认</view>
				<view v-for="(role, ri) in meta.signRoles" :key="ri" class="sign-row">
					<view class="sign-role">{{ role }}<text v-if="signerName(role)" class="sign-name">（{{ signerName(role) }}）</text></view>
					<view class="sign-body">
						<block v-if="canSignRole(role)">
							<view v-if="!signSignature(role)" class="sign-go" @click="toSignature(role)">去签字</view>
							<view v-else class="sign-line" @click="toSignature(role)">
								<image v-if="hasImageSign(role)" class="sign-img" :src="signSignature(role)" mode="aspectFit" />
								<text v-else class="sign-value">{{ signSignature(role) }}</text>
							</view>
						</block>
						<view v-else-if="signSignature(role)" class="sign-line">
							<image v-if="hasImageSign(role)" class="sign-img" :src="signSignature(role)" mode="aspectFit" />
							<text v-else class="sign-value">{{ signSignature(role) }}</text>
						</view>
						<text v-else class="sign-empty">未签字</text>
					</view>
					<view v-if="signDate(role)" class="sign-date">确认时间：{{ signDate(role) }}</view>
				</view>
			</view>

			<!-- 考核说明（Excel 原文） -->
			<view class="section-card">
				<view class="section-title">考核说明</view>
				<view class="notice-text">{{ meta.notice }}</view>
			</view>

			<!-- 评分系数（经理/阶梯奖金表第二页原样；组长表无此页） -->
			<view v-if="meta.coefRows.length" class="section-card">
				<view class="section-title">评分系数</view>
				<view class="coef-grid">
					<view class="coef-cell coef-cell--label">分数</view>
					<view v-for="(row, i) in meta.coefRows" :key="'s' + i" class="coef-cell" :class="{ 'coef-cell--hit': coefHit(row) }">
						{{ row[0] }}<text v-if="coefHit(row)" class="coef-hit-tag">当前</text>
					</view>
					<view class="coef-cell coef-cell--label">系数</view>
					<view v-for="(row, i) in meta.coefRows" :key="'c' + i" class="coef-cell" :class="{ 'coef-cell--hit': coefHit(row) }">
						{{ row[1] }}<text v-if="coefHit(row)" class="coef-hit-tag">当前</text>
					</view>
				</view>
			</view>

			<view class="bottom-space"></view>
		</view>

		<!-- 底部操作栏 -->
		<view v-if="selfEdit || reviewEdit || canConfirm" class="bottom-bar" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
			<wd-button v-if="selfEdit" class="bar-btn" type="primary" :loading="submitting" @click="handleSubmitSelf">提交自评</wd-button>
			<wd-button v-if="reviewEdit" class="bar-btn" type="primary" :loading="submitting" @click="handleSubmitReview">提交{{ meta.reviewColName }}</wd-button>
			<wd-button v-if="canConfirm" class="bar-btn" type="success" :loading="confirmSubmitting" @click="toSignature('被评分人')">确认并签名</wd-button>
		</view>

		<!-- 签名板：手写签名（上级签字随评分提交；被考核人签字即确认走 confirm.do） -->
		<wd-popup closable v-model="signPopupShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
			<view class="sheet" :style="{ background: isDark ? '#2a2a2a' : '#fff' }">
				<view class="sheet-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pendingSignRole }}签字</view>
				<view class="sign-tip" :style="{ color: isDark ? '#8a9099' : '#969799' }">请在本区域手写签名，保存后回填签字栏</view>
				<view class="canvas-wrap">
					<canvas canvas-id="eaSignCanvas" id="eaSignCanvas" class="sign-canvas" :disable-scroll="true" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"></canvas>
				</view>
				<view class="canvas-actions">
					<wd-button size="small" plain @click="clearCanvas">重写</wd-button>
				</view>
				<view class="sheet-actions">
					<wd-button block plain @click="signPopupShow = false">取消</wd-button>
					<wd-button block type="primary" :loading="signSaving" @click="saveSignature">保存签名</wd-button>
				</view>
			</view>
		</wd-popup>
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, computed, watch, getCurrentInstance } from 'vue';
import { onLoad, onReady, onShow, onHide, onUnload } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import {
	fetchGetEngineeringAssessmentDetail,
	fetchSubmitEngineeringAssessmentSelf,
	fetchSubmitEngineeringAssessmentReview,
	fetchConfirmEngineeringAssessment,
	type EngineeringAssessmentType
} from '@/service/engineeringAssessment';
import { uploadFile } from '@/utils/uploadFile';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const { proxy } = getCurrentInstance() as any;

const instanceId = ref<string>('');
const assessmentType = ref<EngineeringAssessmentType>('MANAGER');
const TYPE_TITLE: Record<EngineeringAssessmentType, string> = {
	MANAGER: '经理月度考核',
	LEADER: '组长月度考核',
	BONUS: '阶梯奖金考核'
};
const pageTitle = computed(() => TYPE_TITLE[assessmentType.value] || '考核详情');

/** 三份纸质评分表的版式差异（表名/列名/分档表头/签字行/考核说明均按 Excel 原样固定，口径同 web TYPE_META） */
interface SheetMeta {
	/** 评分表大标题（BONUS 带年份前缀，取评分周期年份） */
	sheetTitle: (cycle: string) => string;
	/** 上级评分列名：BONUS 为"部门评分" */
	reviewColName: string;
	/** 分档表头（计分范围 5 列子表头） */
	bandHeads: string[];
	/** 是否有"评分分类"列（组长表无此列） */
	hasCategory: boolean;
	/** 签字行角色（Excel 原顺序） */
	signRoles: string[];
	/** 考核说明（Excel 原文） */
	notice: string;
	/** 所在部门默认值（详情接口不下发部门时的兜底） */
	dept: string;
	/** 评分系数表（组长表无此页） */
	coefRows: Array<[string, string]>;
}

const TYPE_META: Record<EngineeringAssessmentType, SheetMeta> = {
	MANAGER: {
		sheetTitle: () => '工程部经理月度考核评分表',
		reviewColName: '上级评分',
		bandHeads: ['20-17/10-9/5分', '16-13/8-7/4分', '12-9/6-5/3分', '8-5/4-3/2分', '4-1/2-1/1分'],
		hasCategory: true,
		signRoles: ['上级管理层', '被评分人'],
		notice:
			'1、评分表每项得分总和相加为最终得分；2、①日常考核（违规违纪、贡献度、服从意识等）如不符合公司基础标准不予评分；②分数以上级评分为准，考核分≥80分即合格，连续三个月考核不合格月度数量≥2，认为岗位不胜任；3、每月1日-5日考核上个自然月工作内容，确认期为6日-10日，发综合部及被考核人签字确认，签字即为认可考核结果。',
		dept: '工程中心',
		coefRows: [
			['＜60', '0'],
			['60-69', '0.7'],
			['70-79', '0.9'],
			['80-89', '1.1'],
			['90-99', '1.2'],
			['100', '1.3']
		]
	},
	LEADER: {
		sheetTitle: () => '工程部组长月度考核评分表',
		reviewColName: '上级评分',
		bandHeads: ['20-17/10-9/5分', '16-13/8-7分/4分', '12-9/6-5分/3分', '8-5/4-3分/2分', '4-1/2-1/1分'],
		hasCategory: false,
		signRoles: ['上级管理层', '被评分人'],
		notice:
			'1、全部评分项包含组长自身及管理组员相关绩效，评分表每项得分总和相加为最终得分；2、①违规违纪、贡献度、服从意识等如不符合公司基础标准不予评分；②如果组内接班人员离职，岗位考核标准退回到过度标准；③每月参加读书会晨读≥22天；④岗位考核发放时需参评人在职在岗；⑤连续3个月出现60分以下评分，取消资格。3、每月1日-5日考核上个自然月工作内容，确认期为6日-10日，发综合部及被考核人签字确认，签字即为认可考核结果。4、自2026年5月1日起正式实施。',
		dept: '工程中心',
		coefRows: []
	},
	BONUS: {
		sheetTitle: (cycle) => `${cycle ? cycle.slice(0, 4) : '2026'}工程部月度阶梯奖金评分表`,
		reviewColName: '部门评分',
		bandHeads: ['5分', '4分', '3分', '2分', '1分'],
		hasCategory: true,
		signRoles: ['部门负责人', '被评分人'],
		notice:
			'1、评分表每项得分总和相加为最终得分；2、评分分数以部门评分为准；3、次月5号前提交评分结果（逢节假日则顺延提交）；4、当月请假+调休超过3天的直接取消激励资格；5、月度项目不做达20%的直接取消激励资格；6、未经请示擅自帮客户调试不属于我司产品设备的直接取消激励资格；7、阶梯奖金发放时需参评人在职在岗。',
		dept: '工程部',
		coefRows: [
			['＜60', '0'],
			['60-69', '0.7'],
			['70-79', '0.9'],
			['80-89', '1.1'],
			['90-99', '1.2'],
			['100-110', '1.3']
		]
	}
};

const meta = computed(() => TYPE_META[assessmentType.value]);
const isBonus = computed(() => assessmentType.value === 'BONUS');
const hasCategory = computed(() => meta.value.hasCategory);

const loading = ref(false);
const detail = ref<any>(null);
/** 展开用可编辑行（从 detail.items 拷贝，避免直接改响应数据） */
const rows = ref<any[]>([]);
/** 本次编辑会话中用户亲手点选过的档位（itemId:side）——高亮只反映点选，带出/已存的分数不亮格 */
const pickedBands = ref(new Set<string>());
const submitting = ref(false);

const inst = computed(() => detail.value?.instance || {});
const batch = computed(() => detail.value?.batch || null);

const sheetTitle = computed(() => meta.value.sheetTitle(String(inst.value?.evaluationCycle || '')));
const entryDateText = computed(
	() => inst.value?.joinDate ?? inst.value?.entryDate ?? inst.value?.hireDate ?? inst.value?.entryTime ?? '-'
);
const departmentText = computed(() => inst.value?.departmentName ?? meta.value.dept);

/** 后端授权标记（权威），行级控件只做展示层推导 */
const canSelfScore = computed(() => !!detail.value?.canSelfScore);
const canReview = computed(() => !!detail.value?.canReview);

/* ===== 窗口状态：不能只信 windowStatus，按 openAt/closeAt + 当前时间判断（30s 心跳刷新按钮态） ===== */
const nowTick = ref(Date.now());
let tickTimer: ReturnType<typeof setInterval> | null = null;
function startTick() {
	if (tickTimer) return;
	tickTimer = setInterval(() => { nowTick.value = Date.now(); }, 30000);
}
function stopTick() {
	if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
}

function toDate(str: string | null | undefined) {
	if (!str) return null;
	const d = new Date(String(str).replace(/-/g, '/'));
	return Number.isNaN(d.getTime()) ? null : d;
}
const windowOpen = computed(() => {
	const open = toDate(batch.value?.openAt ?? inst.value?.openAt);
	const close = toDate(batch.value?.closeAt ?? inst.value?.closeAt);
	const now = nowTick.value;
	return !!open && !!close && open.getTime() <= now && now <= close.getTime();
});

/** 自评可编辑：后端授权 + 状态待自评 + 窗口开启 */
const selfEdit = computed(() => canSelfScore.value && Number(inst.value?.status) === 0 && windowOpen.value);
/** 上级评分可编辑（状态 1 待评分 / 2 待个人确认签名可修订）：后端授权 + 窗口开启 */
const reviewEdit = computed(() => canReview.value && windowOpen.value && [1, 2].includes(Number(inst.value?.status)));
/** 当前登录人是否为被考核人本人 */
const isSelfEmployee = computed(() => String(inst.value?.employeeId ?? '') === String(uni.getStorageSync('userId')));
/** 状态 2 待个人确认签名：被考核人查看最终结果后签字确认（confirm.do → 状态 5 已完成） */
const confirmPending = computed(() => Number(inst.value?.status) === 2);
/** 确认签名可用：被考核人本人（后端下发 canEmployeeConfirm 时以后端为准）+ 状态 2 + 窗口开启 */
const canConfirm = computed(() => {
	const granted = detail.value?.canEmployeeConfirm != null ? !!detail.value.canEmployeeConfirm : isSelfEmployee.value;
	return granted && confirmPending.value && windowOpen.value;
});

const statusTextMap: Record<number, string> = {
	0: '待自评',
	1: '待上级评分',
	2: '待个人确认签名',
	3: '已退回',
	4: '已作废',
	5: '已完成'
};
const statusStyle = computed(() => {
	const status = Number(inst.value?.status);
	const palettes: any = {
		0: { light: { bg: '#e6f7ff', color: '#1890ff' }, dark: { bg: 'rgba(24, 144, 255, 0.18)', color: '#69b1ff' } },
		1: { light: { bg: '#fff7e6', color: '#fa8c16' }, dark: { bg: 'rgba(212, 136, 6, 0.16)', color: '#ffc53d' } },
		2: { light: { bg: '#e6fffb', color: '#13c2c2' }, dark: { bg: 'rgba(19, 194, 194, 0.16)', color: '#36cfc9' } },
		3: { light: { bg: '#f9f0ff', color: '#722ed1' }, dark: { bg: 'rgba(114, 46, 209, 0.22)', color: '#b37feb' } },
		4: { light: { bg: '#f4f4f5', color: '#909399' }, dark: { bg: 'rgba(255, 255, 255, 0.09)', color: '#a8b0bc' } },
		5: { light: { bg: '#f6ffed', color: '#52c41a' }, dark: { bg: 'rgba(82, 196, 26, 0.16)', color: '#73d13d' } }
	};
	const entry = palettes[status] || palettes[4];
	const st = isDark.value ? entry.dark : entry.light;
	return { background: st.bg, color: st.color };
});
const sourceTagStyle = computed(() => {
	if (scheduleSource.value === 'MANUAL') return isDark.value ? { background: 'rgba(212, 136, 6, 0.16)', color: '#ffc53d' } : { background: '#fff7e6', color: '#fa8c16' };
	return isDark.value ? { background: 'rgba(24, 144, 255, 0.18)', color: '#69b1ff' } : { background: '#e6f7ff', color: '#1890ff' };
});

/** 窗口时间段展示 */
const windowRangeText = computed(() => {
	const open = batch.value?.openAt ?? inst.value?.openAt;
	const close = batch.value?.closeAt ?? inst.value?.closeAt;
	if (!open && !close) return '-';
	return `${open || '-'} ~ ${close || '-'}`;
});
const scheduleSource = computed(() => batch.value?.scheduleSource ?? inst.value?.scheduleSource ?? 'DEFAULT');

/** 页面配色 CSS 变量：暗黑换深底亮字 */
const pageVars = computed<Record<string, string>>(() => isDark.value ? {
	'--ea-card-bg': '#2a2a2a',
	'--ea-title': '#e8e8e8',
	'--ea-sub': '#8a9099',
	'--ea-line': 'rgba(255, 255, 255, 0.08)',
	'--ea-label-bg': 'rgba(255, 255, 255, 0.06)',
	'--ea-field-bg': '#1b1b1b',
	'--ea-item-bg': 'rgba(255, 255, 255, 0.04)',
	'--ea-band-bg': 'rgba(255, 255, 255, 0.05)'
} : {
	'--ea-card-bg': '#ffffff',
	'--ea-title': '#1a1a1a',
	'--ea-sub': '#969799',
	'--ea-line': '#f0f1f3',
	'--ea-label-bg': '#f7f8fa',
	'--ea-field-bg': '#f7f8fa',
	'--ea-item-bg': '#fafbfc',
	'--ea-band-bg': '#f7f8fa'
});

async function loadDetail() {
	loading.value = true;
	try {
		const data: any = await fetchGetEngineeringAssessmentDetail(instanceId.value);
		detail.value = data;
		// 已有签名回填本地值（展示 + 重签）
		selfSignUrl.value = String(inst.value?.employeeSignature ?? '');
		reviewSignUrl.value = String(inst.value?.reviewerSignature ?? '');
		pickedBands.value = new Set();
		rows.value = ((data as any).items || [])
			.map((it: any) => ({ ...it, bands: it.bands || [] }))
			.sort((a: any, b: any) => Number(a.sortNo) - Number(b.sortNo));
		syncEligibility();
	} catch (err) { console.error('获取考核详情失败', err); }
	finally { loading.value = false; setTimeout(recalcTopFixedHeight, 300); }
}

/* ===== 评分档位 ===== */
/** 按档位序号取档位（后端只下发存在的档位，缺档位显示 /） */
function bandAt(item: any, no: number) {
	return (item.bands || []).find((b: any) => Number(b.bandNo) === no) || null;
}
/** FIXED 档位可选择的分值（去重降序，校验用） */
function bandFixedScores(item: any) {
	const vals = (item.bands || [])
		.map((b: any) => Number(b.fixedScore))
		.filter((v: number) => !Number.isNaN(v));
	return [...new Set(vals)].sort((a: number, b: number) => b - a);
}
/** BAND 档位区间（后端下发 min/max 时才有；字段名防御式读取） */
function bandRanges(item: any) {
	return (item.bands || [])
		.map((b: any) => ({
			min: b.minScore ?? (b as any).scoreMin ?? (b as any).min ?? null,
			max: b.maxScore ?? (b as any).scoreMax ?? (b as any).max ?? null
		}))
		.filter((r: any) => r.min != null || r.max != null);
}

/** 单项分数校验：返回错误文案或 null */
function validateScore(item: any, score: any): string | null {
	if (score === null || score === undefined || score === '') {
		return '存在未评分的考核项，请填写全部分数';
	}
	const s = Number(score);
	if (Number.isNaN(s) || s < 0 || s > Number(item.maxScore)) {
		return `「${item.itemName}」分数须在 0~${item.maxScore} 之间`;
	}
	const mode = String(item.scoreMode);
	if (mode === 'FIXED') {
		const fixed = bandFixedScores(item);
		if (fixed.length && !fixed.includes(s)) {
			return `「${item.itemName}」为档位计分，只能选择：${fixed.join(' / ')} 分`;
		}
	} else if (mode === 'BAND') {
		const ranges = bandRanges(item);
		if (ranges.length && s !== 0) {
			const inBand = ranges.some((r: any) => s >= Number(r.min ?? 0) && s <= Number(r.max ?? item.maxScore));
			if (!inBand) {
				return `「${item.itemName}」分数须落在某个评分档位区间内（0 分始终允许）`;
			}
		}
	}
	return null;
}

/** AUTO_OVERRIDE 自动数据源标识（防御式读取，当前版本仍允许人工评分） */
function autoSourceLabel(item: any) {
	return item.autoSource || item.dataSource || '自动数据源';
}

/** 分数是否未填（null/undefined/'' 均视为未评分） */
function isBlankScore(v: any) {
	return v === null || v === undefined || v === '';
}

/* ===== 分档格交互：FIXED 项点击分档格即选定该档（对应纸质表"圈档"） ===== */
function bandCellClickable(item: any, band: any) {
	return (selfEdit.value || reviewEdit.value) && String(item.scoreMode) === 'FIXED' && band != null && band.fixedScore != null;
}
/** 档位选中高亮判断：0 分是合法选中值，但 null/undefined/'' 未评分不得命中 fixedScore=0 档（Number(null)===0） */
function isBandSel(item: any, band: any, key: 'selfScore' | 'reviewScore') {
	if (!band) return false;
	const v = item[key];
	return v !== null && v !== undefined && v !== '' && Number(band.fixedScore) === Number(v);
}
function onBandCellClick(item: any, bandNo: number) {
	const band = bandAt(item, bandNo);
	if (!band || !bandCellClickable(item, band)) return;
	if (selfEdit.value) {
		item.selfScore = Number(band.fixedScore);
		pickedBands.value.add(`${item.id}:self`);
	} else if (reviewEdit.value) {
		item.reviewScore = Number(band.fixedScore);
		pickedBands.value.add(`${item.id}:review`);
	}
}

/* ===== 分数输入：input 过程保留原始字符串（避免 Number 归一吞掉小数点），失焦归一并夹取 0~满分 ===== */
function onScoreInput(item: any, key: 'selfScore' | 'reviewScore', e: any) {
	item[key] = e.detail.value;
}
function onScoreBlur(item: any, key: 'selfScore' | 'reviewScore') {
	const raw = item[key];
	if (raw === '' || raw === null || raw === undefined) return;
	let n = Number(raw);
	if (Number.isNaN(n)) { item[key] = ''; return; }
	const max = Number(item.maxScore);
	if (n < 0) n = 0;
	if (n > max) n = max;
	item[key] = n;
}

/* ===== 汇总与结果 ===== */
const selfTotalLive = computed(() => rows.value.reduce((sum, r) => sum + Number(r.selfScore || 0), 0));
const reviewTotalLive = computed(() => rows.value.reduce((sum, r) => sum + Number(r.reviewScore || 0), 0));
const selfTotalShow = computed(() => (selfEdit.value ? selfTotalLive.value : inst.value?.selfTotalScore ?? '/'));
const reviewTotalShow = computed(() => (reviewEdit.value ? reviewTotalLive.value : inst.value?.reviewTotalScore ?? '/'));

/** 系数表当前命中格（最终得分已产生时高亮对应系数） */
function coefHit(row: [string, string]) {
	return inst.value?.coefficient != null && Number(row[1]) === Number(inst.value.coefficient);
}

/* ===== 签字区：实例快照带签名（图片地址或签名值）与签名时间；旧数据无签名时间时回退评分产生日 ===== */
function fmtDate(v: any) {
	return v ? String(v).slice(0, 10) : '';
}
function signRoleKey(role: string) {
	return role === '被评分人' ? 'employee' : 'reviewer';
}
function signDate(role: string) {
	const key = signRoleKey(role);
	const signedAt = inst.value?.[key === 'employee' ? 'employeeSignedAt' : 'reviewerSignedAt'];
	if (signedAt) return String(signedAt).slice(0, 16);
	// 旧数据兜底：评分已产生但无签名时间时，展示最近更新日期
	if (key === 'employee') {
		return inst.value?.selfTotalScore != null ? fmtDate(inst.value?.updatedAt) : '';
	}
	return inst.value?.reviewTotalScore != null ? fmtDate(inst.value?.updatedAt) : '';
}
/** 签名值：图片地址或签名文本（弹窗签过优先用本地值） */
function signSignature(role: string) {
	const key = signRoleKey(role);
	const local = key === 'employee' ? selfSignUrl.value : reviewSignUrl.value;
	if (local) return local;
	return String(inst.value?.[key === 'employee' ? 'employeeSignature' : 'reviewerSignature'] ?? '');
}
function isSignatureUrl(v: string) {
	return /^(https?:\/\/|data:image|\/|\.\/)/i.test(v || '') || /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(v || '');
}
function hasImageSign(role: string) {
	return isSignatureUrl(signSignature(role));
}
/** 签字行姓名前缀：仅被评分人显示（employeeName），上级只显示签名 */
function signerName(role: string) {
	if (signRoleKey(role) !== 'employee') return '';
	return String(inst.value?.employeeName ?? '');
}
/** 可签字：上级在评分阶段签字（随 submitReview 提交）；被考核人在状态 2 待个人确认签名时签字确认（走 confirm.do，自评阶段不签字） */
function canSignRole(role: string) {
	if (signRoleKey(role) === 'reviewer') return reviewEdit.value;
	return canConfirm.value;
}

/* ===== 签名板（同研发考核签字页：手写 → 上传 → 回填） ===== */
const signPopupShow = ref(false);
/** 当前签字角色：被评分人=确认签字，其余=上级签字 */
const pendingSignRole = ref('');
/** 本地签字结果（图片地址），随提交上报后端 */
const selfSignUrl = ref('');
const reviewSignUrl = ref('');
const signSaving = ref(false);
/** 确认签名提交中 */
const confirmSubmitting = ref(false);

function toSignature(role: string) {
	pendingSignRole.value = role;
	signPopupShow.value = true;
}

watch(signPopupShow, (v) => {
	if (v) setTimeout(initCanvas, 300);
});

// 画布相关
let ctx: UniApp.CanvasContext | null = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let canvasWidth = 0;
let canvasHeight = 0;

function initCanvas() {
	ctx = uni.createCanvasContext('eaSignCanvas', proxy);
	if (ctx) {
		ctx.setLineWidth(3);
		ctx.setLineCap('round');
		ctx.setLineJoin('round');
		ctx.setStrokeStyle('#333');
	}
	uni.createSelectorQuery().select('#eaSignCanvas').boundingClientRect((res: any) => {
		if (res) {
			canvasWidth = res.width;
			canvasHeight = res.height;
		}
	}).exec();
}

function onTouchStart(e: any) {
	if (!ctx) return;
	isDrawing = true;
	const touch = e.touches[0];
	lastX = touch.x;
	lastY = touch.y;
}

function onTouchMove(e: any) {
	if (!isDrawing || !ctx) return;
	const touch = e.touches[0];
	const x = touch.x;
	const y = touch.y;
	ctx.beginPath();
	ctx.moveTo(lastX, lastY);
	ctx.lineTo(x, y);
	ctx.stroke();
	ctx.draw(true);
	lastX = x;
	lastY = y;
}

function onTouchEnd() {
	isDrawing = false;
}

function clearCanvas() {
	if (!ctx || !canvasWidth || !canvasHeight) return;
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.draw();
}

function getSignImage(): Promise<string> {
	return new Promise((resolve) => {
		if (!ctx) {
			resolve('');
			return;
		}
		uni.canvasToTempFilePath({
			canvasId: 'eaSignCanvas',
			fileType: 'png',
			quality: 1,
			success: (res) => resolve(res.tempFilePath),
			fail: () => resolve('')
		}, proxy);
	});
}

// 上传签名图片到服务器
function uploadSignImage(tempFilePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const fileName = `ea_sign_${Date.now()}.png`;
		uploadFile(
			{ name: fileName, url: tempFilePath, tempFilePath },
			'qiniu',
			(res: any) => resolve(res.data),
			(err: any) => reject(err)
		);
	});
}

async function saveSignature() {
	if (signSaving.value) return;
	signSaving.value = true;
	try {
		const img = await getSignImage();
		if (!img) {
			uni.showToast({ title: '请先签名', icon: 'none' });
			return;
		}
		const url = await uploadSignImage(img);
		signPopupShow.value = false;
		if (signRoleKey(pendingSignRole.value) === 'employee') {
			// 被考核人签字即确认：confirm.do 签名确认后状态 2 → 5（已完成）
			selfSignUrl.value = url;
			await doConfirm(url);
		} else {
			// 上级签字随「提交上级评分」一并上报
			reviewSignUrl.value = url;
			uni.showToast({ title: '签名已保存', icon: 'success' });
		}
	} catch (err) {
		console.error('签名保存失败', err);
		uni.showToast({ title: '签名保存失败', icon: 'none' });
	} finally {
		signSaving.value = false;
	}
}

/** 个人确认并签名（confirm.do）：状态 2 → 5，确认后重载详情展示最终结果 */
async function doConfirm(signature: string) {
	if (confirmSubmitting.value) return;
	confirmSubmitting.value = true;
	try {
		await fetchConfirmEngineeringAssessment({ instanceId: instanceId.value, signature });
		uni.showToast({ title: '签名确认成功', icon: 'success' });
		uni.$emit('refreshEngineeringAssessmentList');
		await loadDetail();
	} catch (err) { console.error('签名确认失败', err); }
	finally { confirmSubmitting.value = false; }
}

/* ===== 提交 ===== */
const eligibilityValue = ref<number>(1);
const disqualifyReason = ref('');

/** 详情加载后把资格/取消原因回填到编辑区（BONUS 上级评分） */
function syncEligibility() {
	if (inst.value?.eligibilityStatus != null) {
		eligibilityValue.value = Number(inst.value.eligibilityStatus);
	}
	if (inst.value?.disqualifyReason) {
		disqualifyReason.value = String(inst.value.disqualifyReason);
	}
}

function buildItems(scoreKey: string, noteKey: string) {
	return rows.value.map((r: any) => ({
		itemId: r.id,
		score: Number(r[scoreKey]),
		note: r[noteKey] || ''
	}));
}

async function handleSubmitSelf() {
	for (const r of rows.value) {
		const err = validateScore(r, r.selfScore);
		if (err) {
			uni.showToast({ title: err, icon: 'none' });
			return;
		}
	}
	submitting.value = true;
	try {
		// 自评阶段不签字（个人签名在状态 2 确认阶段走 confirm.do）；提交后自评分由后端复制为上级评分默认值
		await fetchSubmitEngineeringAssessmentSelf({
			instanceId: instanceId.value,
			items: buildItems('selfScore', 'selfNote')
		});
		uni.showToast({ title: '自评提交成功', icon: 'success' });
		uni.$emit('refreshEngineeringAssessmentList');
		setTimeout(() => { uni.navigateBack(); }, 800);
	} catch (err) { console.error('自评提交失败', err); }
	finally { submitting.value = false; }
}

async function handleSubmitReview() {
	const reviewRole = meta.value.signRoles[0];
	// 提交前必须已签字（含历史已存签字；未签提示并中止）
	if (!signSignature(reviewRole)) {
		uni.showToast({ title: '请先完成签字后再提交上级评分', icon: 'none' });
		return;
	}
	for (const r of rows.value) {
		const err = validateScore(r, r.reviewScore);
		if (err) {
			uni.showToast({ title: err, icon: 'none' });
			return;
		}
	}
	if (isBonus.value && Number(eligibilityValue.value) === 0 && !disqualifyReason.value.trim()) {
		uni.showToast({ title: '取消资格时必须填写取消原因', icon: 'none' });
		return;
	}
	submitting.value = true;
	try {
		const payload: any = {
			instanceId: instanceId.value,
			// 本次签名：签过则传图片地址，未签时后端回退当前用户 signature1
			...(reviewSignUrl.value ? { signature: reviewSignUrl.value } : {}),
			items: buildItems('reviewScore', 'reviewNote')
		};
		if (isBonus.value) {
			payload.eligibilityStatus = Number(eligibilityValue.value);
			if (Number(eligibilityValue.value) === 0) {
				payload.disqualifyReason = disqualifyReason.value.trim();
			}
		}
		await fetchSubmitEngineeringAssessmentReview(payload);
		uni.showToast({ title: `${meta.value.reviewColName}提交成功`, icon: 'success' });
		uni.$emit('refreshEngineeringAssessmentList');
		setTimeout(() => { uni.navigateBack(); }, 800);
	} catch (err) { console.error('评分提交失败', err); }
	finally { submitting.value = false; }
}

function handleClickLeft() { uni.navigateBack(); }

const topFixedHeight = ref<number>(220);
function recalcTopFixedHeight() {
	uni.createSelectorQuery().select('.topFixedWrap').boundingClientRect((rect: any) => {
		if (rect) topFixedHeight.value = rect.height;
	}).exec();
}

onLoad((options: any) => {
	instanceId.value = String(options?.instanceId || '');
	const qType = options?.assessmentType as EngineeringAssessmentType | undefined;
	if (qType && TYPE_META[qType as EngineeringAssessmentType]) assessmentType.value = qType;
	startTick();
	loadDetail();
});

onShow(() => { startTick(); });
onHide(() => { stopTick(); });
onUnload(() => { stopTick(); });
onReady(() => { recalcTopFixedHeight(); });
</script>

<style lang="scss" scoped>
.topFixedWrap { position: fixed; left: 0; top: 0; width: 100%; z-index: 99; }
.head-card { padding: 4rpx 30rpx 16rpx; }
.sheet-title { font-size: 32rpx; font-weight: 700; letter-spacing: 2rpx; }
.head-tag-row { display: flex; gap: 12rpx; margin-top: 12rpx; }
.head-tag { padding: 6rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 500; }
.head-range { margin-top: 10rpx; font-size: 22rpx; }
.body { padding: 10rpx 20rpx 0; }
.tip-bar { padding: 16rpx 20rpx; border-radius: 14rpx; font-size: 24rpx; line-height: 1.6; margin-bottom: 16rpx; }
.tip-bar--closed { background: rgba(230, 126, 34, 0.12); color: #a0620d; }
.tip-bar--disqualify { background: rgba(245, 34, 45, 0.1); color: #f5222d; }
.section-card { margin-bottom: 16rpx; padding: 24rpx; background: var(--ea-card-bg, #fff); border-radius: 20rpx; }
.section-title { font-size: 28rpx; font-weight: 600; margin-bottom: 20rpx; padding-bottom: 14rpx; border-bottom: 1rpx solid var(--ea-line, #f0f1f3); color: var(--ea-title, #1a1a1a); }
.info-rows .info-row { display: flex; padding: 12rpx 0; border-bottom: 1rpx solid var(--ea-line, #f9f9f9); font-size: 26rpx; }
.info-rows .info-row:last-child { border-bottom: none; }
.info-rows .lbl { color: var(--ea-sub, #969799); min-width: 160rpx; flex-shrink: 0; }
.info-rows .val { flex: 1; word-break: break-all; margin-left: 10rpx; color: var(--ea-title, #1a1a1a); }
.elig-radios { display: flex; flex-direction: column; gap: 14rpx; }
.radio-chip { padding: 16rpx 20rpx; border-radius: 14rpx; border: 2rpx solid var(--ea-line, #f0f1f3); font-size: 26rpx; color: var(--ea-title, #1a1a1a); background: var(--ea-field-bg, #f7f8fa); }
.radio-chip--on { border-color: #1677ff; color: #1677ff; font-weight: 600; background: rgba(22, 119, 255, 0.06); }
.area-wrap { border: 1rpx solid var(--ea-line, #f0f1f3); border-radius: 14rpx; padding: 8rpx 20rpx; background: var(--ea-field-bg, #f7f8fa); }
.area-input { width: 100%; min-height: 100rpx; font-size: 26rpx; }
.item-card { padding: 20rpx; margin-bottom: 20rpx; background: var(--ea-item-bg, #fafbfc); border: 1rpx solid var(--ea-line, #f0f1f3); border-radius: 16rpx; }
.item-card:last-of-type { margin-bottom: 0; }
.item-head { display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
.item-no { flex-shrink: 0; min-width: 44rpx; height: 44rpx; line-height: 44rpx; text-align: center; border-radius: 10rpx; background: var(--ea-label-bg, #f2f3f5); font-size: 24rpx; font-weight: 600; color: var(--ea-sub, #969799); }
.item-cat { padding: 4rpx 14rpx; border-radius: 999rpx; background: rgba(22, 119, 255, 0.08); font-size: 20rpx; color: #1677ff; }
.item-max { margin-left: auto; flex-shrink: 0; font-size: 22rpx; color: var(--ea-sub, #969799); }
.item-name { display: flex; align-items: flex-start; gap: 12rpx; margin-bottom: 8rpx; }
.item-name-text { flex: 1; min-width: 0; font-size: 28rpx; font-weight: 600; line-height: 1.5; color: var(--ea-title, #1a1a1a); word-break: break-all; }
.auto-tag { flex-shrink: 0; padding: 4rpx 12rpx; border-radius: 8rpx; background: rgba(24, 144, 255, 0.1); font-size: 20rpx; color: #1890ff; }
.item-standard { font-size: 24rpx; line-height: 1.6; color: var(--ea-sub, #969799); word-break: break-all; margin-bottom: 16rpx; }
.band-label { font-size: 22rpx; color: var(--ea-sub, #969799); margin-bottom: 10rpx; }
.band-label-tip { color: #1677ff; }
.band-grid { display: flex; gap: 8rpx; margin-bottom: 16rpx; }
.band-cell { flex: 1; min-width: 0; padding: 10rpx 8rpx; border-radius: 12rpx; background: var(--ea-band-bg, #f7f8fa); border: 2rpx solid transparent; text-align: center; }
.band-cell--click { border-color: #91caff; }
.band-cell--empty { opacity: 0.55; }
.band-cell--sel-self, .band-cell--sel-review { border-color: #1677ff; background: rgba(22, 119, 255, 0.1); .band-head { color: #1677ff; } }
.band-head { font-size: 18rpx; font-weight: 600; color: var(--ea-sub, #969799); margin-bottom: 6rpx; }
.band-desc { font-size: 20rpx; line-height: 1.4; color: var(--ea-title, #1a1a1a); word-break: break-all; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; }
.score-rows { display: flex; flex-direction: column; gap: 12rpx; }
.score-row { display: flex; align-items: flex-start; gap: 16rpx; }
.score-row-label { flex-shrink: 0; width: 130rpx; padding-top: 14rpx; font-size: 24rpx; color: var(--ea-sub, #969799); }
.score-row-body { flex: 1; min-width: 0; }
.score-input { width: 100%; height: 64rpx; padding: 0 20rpx; border-radius: 12rpx; background: var(--ea-field-bg, #f7f8fa); font-size: 28rpx; font-weight: 600; color: var(--ea-title, #1a1a1a); }
.score-input-ph { color: #bfbfbf; font-weight: 400; }
.score-num { min-height: 64rpx; line-height: 64rpx; font-size: 28rpx; font-weight: 600; color: var(--ea-title, #1a1a1a); }
.score-hint { font-size: 24rpx; font-weight: 400; color: #1677ff; }
.note-input { width: 100%; min-height: 60rpx; padding: 10rpx 20rpx; border-radius: 12rpx; background: var(--ea-field-bg, #f7f8fa); font-size: 24rpx; color: var(--ea-title, #1a1a1a); }
.note-text { display: block; padding: 10rpx 0; font-size: 24rpx; line-height: 1.6; color: var(--ea-title, #1a1a1a); word-break: break-all; }
.total-row { display: flex; align-items: center; gap: 16rpx; padding: 20rpx; margin-top: 8rpx; border-radius: 16rpx; background: var(--ea-label-bg, #f2f3f5); }
.total-label { flex: 1; font-size: 28rpx; font-weight: 700; color: var(--ea-title, #1a1a1a); }
.total-cell { display: flex; flex-direction: column; align-items: center; min-width: 140rpx; }
.total-cap { font-size: 20rpx; color: var(--ea-sub, #969799); }
.total-num { font-size: 36rpx; font-weight: 700; color: #1677ff; }
.empty-tip { text-align: center; padding: 60rpx 0; font-size: 26rpx; color: var(--ea-sub, #969799); }
.sign-row { padding: 16rpx 0; border-bottom: 1rpx solid var(--ea-line, #f0f1f3); }
.sign-row:last-child { border-bottom: none; }
.sign-role { font-size: 26rpx; font-weight: 600; color: var(--ea-title, #1a1a1a); margin-bottom: 10rpx; }
.sign-name { font-size: 24rpx; font-weight: 400; color: var(--ea-sub, #969799); }
.sign-body { min-height: 60rpx; display: flex; align-items: center; }
.sign-go { padding: 8rpx 28rpx; border-radius: 999rpx; background: #1677ff; color: #fff; font-size: 24rpx; font-weight: 500; }
.sign-line { display: flex; align-items: center; min-height: 60rpx; }
.sign-img { height: 80rpx; width: 220rpx; }
.sign-value { font-size: 24rpx; color: var(--ea-title, #1a1a1a); word-break: break-all; }
.sign-empty { font-size: 24rpx; color: var(--ea-sub, #969799); }
.sign-date { margin-top: 8rpx; font-size: 22rpx; color: var(--ea-sub, #969799); }
.notice-text { font-size: 24rpx; line-height: 1.8; color: var(--ea-title, #1a1a1a); word-break: break-all; }
.coef-grid { display: flex; flex-wrap: wrap; gap: 8rpx; }
.coef-cell { flex: 1; min-width: 0; padding: 12rpx 4rpx; border-radius: 10rpx; background: var(--ea-band-bg, #f7f8fa); border: 2rpx solid transparent; text-align: center; font-size: 22rpx; color: var(--ea-title, #1a1a1a); }
.coef-cell--label { flex: 0 0 90rpx; background: var(--ea-label-bg, #f2f3f5); font-weight: 600; color: var(--ea-sub, #969799); }
.coef-cell--hit { border-color: #1677ff; background: rgba(22, 119, 255, 0.1); font-weight: 700; }
.coef-hit-tag { display: block; font-size: 18rpx; font-weight: 500; color: #1677ff; }
.bottom-space { height: 160rpx; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 98; padding: 20rpx 30rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); display: flex; gap: 20rpx; box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05); }
.bar-btn { flex: 1; }
.sheet { padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom)); border-radius: 24rpx 24rpx 0 0; }
.sheet-title { font-size: 32rpx; font-weight: 600; margin-bottom: 12rpx; }
.sign-tip { font-size: 24rpx; margin-bottom: 16rpx; }
.canvas-wrap { border: 2rpx dashed #ddd; border-radius: 16rpx; background: #fff; }
.sign-canvas { width: 100%; height: 300rpx; }
.canvas-actions { text-align: center; margin-top: 16rpx; }
.sheet-actions { display: flex; gap: 20rpx; margin-top: 24rpx; }
</style>
