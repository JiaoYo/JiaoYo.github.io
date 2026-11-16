<template>
	<view class="rd-page" :style="pageStyle">
		<!-- 顶部横幅 + 时间筛选 -->
		<view class="rd-banner" :style="cardStyle">
			<view class="rd-banner-top">
				<view class="rd-banner-title">研发中心</view>
				<view class="rd-banner-sub">聚焦研发进度 · 风险预警 · 提升项目协同效率</view>
			</view>
			<view class="rd-filter">
				<view class="rd-picker">
					<!-- max-date 收敛到今天：日/月/年均不可选未来 -->
					<wd-datetime-picker v-if="contractType === 'day'" type="date" :max-date="maxDateTs" v-model="model.dayTime" @confirm="handleTimeChange" />
					<wd-datetime-picker v-if="contractType === 'month'" type="year-month" :max-date="maxDateTs" v-model="model.monthTime" @confirm="handleTimeChange" />
					<wd-datetime-picker v-if="contractType === 'year'" type="year" :max-date="maxDateTs" v-model="model.yearTime" @confirm="handleTimeChange" />
				</view>
				<wd-radio-group size="small" v-model="contractType" shape="button" @change="handleRadioChange">
					<wd-radio v-for="item in typeList" :key="item.value" :value="item.value">{{ item.label }}</wd-radio>
				</wd-radio-group>
			</view>
		</view>

		<!-- 公告 -->
		<view v-if="notData" class="rd-notice" :style="cardStyle">
			<view class="rd-notice-bar"></view>
			<view class="rd-notice-marquee">
				<view class="rd-notice-track" :style="{ animationDuration: noticeDuration + 's' }">
					<text class="rd-notice-text">{{ notData }}</text>
					<text class="rd-notice-text">{{ notData }}</text>
				</view>
			</view>
		</view>

		<!-- 分类统计 6 卡片（每行三个） -->
		<view class="rd-grid7">
			<view v-for="(item, index) in totalList.slice(0, 6)" :key="item.label" class="rd-card7" :style="cardStyle">
				<view class="rd-icon" :style="{ background: iconColors[index] }">
					<wd-icon :name="iconNames[index]" size="34rpx" color="#ffffff" />
				</view>
				<view class="rd-card7-info">
					<view class="rd-card7-value">{{ item.value }}</view>
					<view class="rd-card7-label">{{ item.label }}</view>
				</view>
			</view>
		</view>

		<!-- 研发积分排行 -->
		<view class="rd-section-title">
			<view class="rd-dot"></view>
			<view class="rd-section-name">研发积分排行</view>
			<view v-if="!hasValidScore" class="rd-section-tip">未开榜</view>
		</view>
		<view class="rd-card" :style="cardStyle">
			<view v-for="(r, index) in displayRankList" :key="String(r.userId)" class="rd-rank-row" :class="{ 'rd-rank-pinned': r.rank === null || r.rank === undefined }">
				<view class="rd-rank-left">
					<view
						v-if="(contractType !== 'day') && hasValidScore && medalMap[Number(r.rank)]"
						class="rd-rank-medal"
						:style="{ color: medalMap[Number(r.rank)].color, background: medalMap[Number(r.rank)].bg }"
					>
						{{ medalMap[Number(r.rank)].text }}
					</view>
					<view v-else class="rd-rank-no">{{ (r.rank === null || r.rank === undefined) ? '—' : index + 1 }}</view>
					<view class="rd-rank-name">{{ r.username || '-' }}</view>
				</view>
				<view class="rd-rank-score">{{ fmtRankScore(r.totalScore) }}</view>
			</view>
			<view v-if="!displayRankList.length" class="rd-empty">暂无排行数据</view>
		</view>

		<!-- 部门研发概览 -->
		<view class="rd-section-title">
			<view class="rd-dot"></view>
			<view class="rd-section-name">部门研发概览</view>
		</view>
		<!-- 研发缺陷统计（点击胶囊跳缺陷列表，处理中/测试中带状态筛选） -->
		<view class="rd-card rd-defect-card" :style="cardStyle">
			<view class="rd-defect-header">
				<view class="rd-dot"></view>
				<view class="rd-defect-title">研发缺陷</view>
			</view>
			<view class="rd-defect-grid">
				<view v-for="item in defectSummary" :key="item.key" class="rd-defect-chip" :style="{ borderColor: item.color + '30', background: item.color + '10' }" @click="goDefectList(item.status)">
					<view class="rd-defect-value" :style="{ color: item.color }">{{ defectStats[item.key] || 0 }}</view>
					<view class="rd-defect-label">{{ item.label }}</view>
				</view>
			</view>
		</view>
		<view v-for="item in summaryList" :key="item.rdtype" class="rd-card" :style="cardStyle">
			<view class="rd-type-header">
				<view class="rd-type-dot" :style="{ background: getTypeColor(item.rdtype) }"></view>
				<view class="rd-type-info">
					<view class="rd-type-name">{{ getTypeName(item.rdtype) }}</view>
					<view class="rd-type-desc">{{ getTypeDesc(item.rdtype) }}</view>
				</view>
			</view>
			<view class="rd-overview">
				<view class="rd-overview-item">
					<view class="rd-overview-value blue">{{ item.projectCount }}</view>
					<view class="rd-overview-label">产品</view>
				</view>
				<view class="rd-overview-item">
					<view class="rd-overview-value blue">{{ item.demandCount }}</view>
					<view class="rd-overview-label">需求</view>
				</view>
				<view class="rd-overview-item">
					<view class="rd-overview-value purple">{{ item.taskCount }}</view>
					<view class="rd-overview-label">任务</view>
				</view>
				<view class="rd-overview-item">
					<view class="rd-overview-value red">{{ item.rdelay1 || 0 }}</view>
					<view class="rd-overview-label">延期</view>
				</view>
			</view>
			<view class="rd-progress-row">
				<view class="rd-progress-label">任务完成进度</view>
				<view class="rd-progress-num">{{ item.taskStatus8 }}/{{ item.taskCount }}</view>
			</view>
			<view class="rd-progress-track">
				<view class="rd-progress-bar" :style="{ width: progressWidth(item), background: getTypeColor(item.rdtype) }"></view>
			</view>
			<view class="rd-task-grid">
				<view v-for="task in getTaskStatus(item)" :key="task.label" class="rd-task-chip" :style="{ borderColor: task.color + '30', background: task.color + '10' }">
					<view class="rd-task-value" :style="{ color: task.color }">{{ task.value }}</view>
					<view class="rd-task-name">{{ task.label }}</view>
				</view>
			</view>
			<view class="rd-test-grid">
				<view v-for="test in getTestStatus(item)" :key="test.label" class="rd-test-item">
					<view class="rd-test-name" :style="{ color: test.color }">{{ test.label }}</view>
					<view class="rd-test-value" :style="{ color: test.color }">{{ test.value }}</view>
				</view>
			</view>
		</view>

		<!-- 研发测试中心概况 -->
		<view class="rd-section-title">
			<view class="rd-dot"></view>
			<view class="rd-section-name">研发测试中心概况</view>
		</view>
		<view class="rd-card rd-test-bar" :style="cardStyle">
			<view class="rd-test-icon" :style="{ background: iconColors[6] }">
				<wd-icon :name="iconNames[6]" size="40rpx" color="#ffffff" />
			</view>
			<view class="rd-test-bar-info">
				<view class="rd-test-bar-title">测试任务</view>
				<view class="rd-test-bar-label">研发测试中心 · 任务总数</view>
			</view>
			<view class="rd-test-bar-num">
				<text class="rd-test-total">{{ totalList[6].value }}</text>
				<text class="rd-test-unit">项</text>
			</view>
		</view>
		<view class="rd-row2">
			<view class="rd-card-half" :style="cardStyle">
				<view class="rd-half-title">测试用例优先级</view>
				<view class="rd-donut-wrap">
					<view class="rd-donut" :style="{ background: donutBg(priorityData) }">
						<view class="rd-donut-center" :style="{ background: cardStyle.background }">
							<view class="rd-donut-total">{{ priorityTotal }}</view>
							<view class="rd-donut-cap">用例总数</view>
						</view>
					</view>
				</view>
				<view class="rd-legend-list">
					<view v-for="p in priorityData" :key="p.name" class="rd-legend-row">
						<view class="rd-legend-dot" :style="{ background: p.color }"></view>
						<view class="rd-legend-name">{{ p.name }}</view>
						<view class="rd-legend-value">{{ p.value }}</view>
					</view>
				</view>
			</view>
			<view class="rd-card-half" :style="cardStyle">
				<view class="rd-half-title">测试执行状态</view>
				<view class="rd-donut-wrap">
					<view class="rd-donut" :style="{ background: donutBg(executeData) }">
						<view class="rd-donut-center" :style="{ background: cardStyle.background }">
							<view class="rd-donut-total">{{ executeTotal }}</view>
							<view class="rd-donut-cap">执行总数</view>
						</view>
					</view>
				</view>
				<view class="rd-legend-list">
					<view v-for="e in executeData" :key="e.name" class="rd-legend-row">
						<view class="rd-legend-dot" :style="{ background: e.color }"></view>
						<view class="rd-legend-name">{{ e.name }}</view>
						<view class="rd-legend-value">{{ e.value }}</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 研发风险中心 -->
		<view class="rd-section-title">
			<view class="rd-dot"></view>
			<view class="rd-section-name">研发风险中心</view>
		</view>
		<view class="rd-card" :style="cardStyle">
			<view class="rd-risk-header">
				<view class="rd-risk-title">
					<view class="rd-dot orange"></view>
					<view class="rd-risk-name">未确认紧急需求</view>
				</view>
				<view class="rd-risk-count">{{ DevBlockConfirmList.length || 0 }}项</view>
			</view>
			<view v-if="DevBlockConfirmList.length" class="rd-risk-list">
				<view v-for="item in DevBlockConfirmList" :key="item.id" class="rd-risk-item">
					<text>{{ getTypeName(item.rdtype) }}部门有</text>
					<text class="hl">未确认</text>
					<text>的</text>
					<text class="hl">紧急</text>
					<text>需求：</text>
					<text class="rd-risk-name-text">{{ item.dname }}</text>
				</view>
			</view>
			<view v-else class="rd-empty">暂无未确认紧急需求</view>
			<view class="rd-divider"></view>
			<view class="rd-risk-header">
				<view class="rd-risk-title">
					<view class="rd-dot red"></view>
					<view class="rd-risk-name">高风险任务</view>
				</view>
				<view class="rd-risk-count red">{{ delayList.length || 0 }}项</view>
			</view>
			<view v-if="delayList.length" class="rd-delay-list">
				<view v-for="item in delayList" :key="item.id" class="rd-delay-item">
					<view class="rd-delay-name">{{ item.tname }}</view>
					<view class="rd-delay-desc">负责人：{{ item.tcreaterName }} · 已延期{{ item.delayDays }}天</view>
				</view>
			</view>
			<view v-else class="rd-empty">暂无延期任务</view>
		</view>

		<!-- 近期任务 -->
		<view class="rd-section-title">
			<view class="rd-dot"></view>
			<view class="rd-section-name">近期任务</view>
		</view>
		<view class="rd-card" :style="cardStyle">
			<view v-for="row in recentProjectList" :key="row.username" class="rd-user-row">
				<view class="rd-user-top">
					<view class="rd-user-name">{{ row.username }}</view>
					<view class="rd-user-type" :style="tagStyle(row.rdtype)">{{ typeName(row.rdtype) }}</view>
				</view>
				<view class="rd-user-doing">正在进行任务：{{ doingCount(row) }} 项</view>
				<view v-if="doingList(row).length" class="rd-doing-list">
					<view :key="currentTaskIndex(row)" class="rd-doing-item rd-doing-switch">
						<view class="rd-doing-name">{{ taskName(row) }}</view>
						<view class="rd-doing-meta">
							<text v-if="taskMeta(row).project">{{ taskMeta(row).project }}</text>
							<text v-if="taskMeta(row).time" class="rd-doing-time">{{ taskMeta(row).time }}</text>
						</view>
					</view>
				</view>
				<view class="rd-user-stats">
					<view class="rd-us-item">
						<view class="rd-us-v">{{ row.projectCount || 0 }}</view>
						<view class="rd-us-l">产品</view>
					</view>
					<view class="rd-us-item">
						<view class="rd-us-v">{{ row.demandCount || 0 }}</view>
						<view class="rd-us-l">需求</view>
					</view>
					<view class="rd-us-item">
						<view class="rd-us-v">{{ row.taskCount || 0 }}</view>
						<view class="rd-us-l">任务</view>
					</view>
					<view class="rd-us-item">
						<view class="rd-us-v green">{{ row.finishTaskCount || 0 }}</view>
						<view class="rd-us-l">完成</view>
					</view>
					<view class="rd-us-item">
						<view class="rd-us-v red">{{ row.delayTaskCount || 0 }}</view>
						<view class="rd-us-l">延期</view>
					</view>
					<view class="rd-us-item">
						<view class="rd-us-v blue">{{ finishRate(row) }}</view>
						<view class="rd-us-l">完成率</view>
					</view>
				</view>
			</view>
			<view v-if="!recentProjectList.length" class="rd-empty">暂无近期任务</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { getSystemDate } from '@/utils/index';
import { useTheme } from '@/composables/theme/theme';
import { fetchDevHomeData, fetchUserTask, fetchDevBlockConfirm, fetchDevDelayTask, fetchNotice } from '@/service/rdhome';
import { fetchGetHomeStatistics } from '@/service/rddefect';
import { fetchGetRdScoreRank } from '@/service/rdScore';

const { theme } = useTheme();
// 主题色
const themeColors = computed(() => {
	if (isDark.value) {
		return {
			textPrimary: '#e8e8e8',
			textSecondary: '#8a9099',
			bgPrimary: '#2a2a2a',
			bgSecondary: '#3a3a3a',
			border: '#3a3a3a'
		};
	}
	return {
		textPrimary: '#1f2329',
		textSecondary: '#8a9099',
		bgPrimary: '#f6f8fb',
		bgSecondary: '#f0f2f5',
		border: '#eef0f3'
	};
});
// 页面级 CSS 变量样式
const pageStyle = computed(() => ({
	'--rd-text-primary': themeColors.value.textPrimary,
	'--rd-text-secondary': themeColors.value.textSecondary,
	'--rd-bg-primary': themeColors.value.bgPrimary,
	'--rd-bg-secondary': themeColors.value.bgSecondary,
	'--rd-border': themeColors.value.border
}));

const isDark = computed(() => theme.value === 'dark');
const cardStyle = computed(() => ({ background: isDark.value ? '#1b1b1b' : '#ffffff' }));

const contractType = ref<string>('year');
const typeList = ref([
	{ label: '日', value: 'day' },
	{ label: '月', value: 'month' },
	{ label: '年', value: 'year' },
	{ label: '累计', value: 'total' }
]);

const model = reactive<any>({
	dayTime: Number(getSystemDate(5)),
	monthTime: Number(getSystemDate(5)),
	yearTime: Number(getSystemDate(5))
});

// 日期/月/年选择上限：今天（到今日 23:59:59，不允许选未来）
const maxDateTs = new Date().setHours(23, 59, 59, 999);

// 7 分类统计
const totalList = ref<any[]>([
	{ label: '研发产品', value: 0 },
	{ label: '研发需求', value: 0 },
	{ label: '研发任务', value: 0 },
	{ label: '开发中任务', value: 0 },
	{ label: '延期任务', value: 0 },
	{ label: '暂停任务', value: 0 },
	{ label: '测试任务', value: 0 }
]);

const iconColors = ['#0055FE', '#36cfc9', '#9254de', '#1677ff', '#FF4D4F', '#faad14', '#13c2c2'];
const iconNames = ['app', 'edit', 'list', 'time', 'warning', 'pause', 'check-circle'];

// 部门研发概览（rdtype 0/1/2）
const summaryList = ref<any[]>([]);

const createDefaultSummary = () => {
	return [0, 1, 2].map((rdtype) => ({
		rdtype,
		projectCount: 0,
		demandCount: 0,
		taskCount: 0,
		taskStatus0: 0,
		taskStatus1: 0,
		taskStatus2: 0,
		taskStatus3: 0,
		taskStatus4: 0,
		taskStatus5: 0,
		taskStatus6: 0,
		taskStatus7: 0,
		taskStatus8: 0,
		testCount: 0,
		testStatus0: 0,
		testStatus1: 0,
		testStatus3: 0,
		testStatus4: 0,
		rdelay1: 0
	}));
};

// 测试优先级 / 测试执行汇总
const testprioritys = ref<any[]>([]);
const testexecuteStatuss = ref<any[]>([]);

const priorityData = computed(() => [
	{ name: 'P0阻断', value: testprioritys.value[0], color: '#F5222D' },
	{ name: 'P1高', value: testprioritys.value[1], color: '#FA8C16' },
	{ name: 'P2中', value: testprioritys.value[2], color: '#FADB14' },
	{ name: 'P3低', value: testprioritys.value[3], color: '#52C41A' }
]);

const executeData = computed(() => [
	{ name: '未执行', value: testexecuteStatuss.value[0], color: '#1677FF' },
	{ name: '通过', value: testexecuteStatuss.value[1], color: '#52C41A' },
	{ name: '失败', value: testexecuteStatuss.value[2], color: '#F5222D' },
	{ name: '阻塞', value: testexecuteStatuss.value[3], color: '#FA8C16' },
	{ name: '不适用', value: testexecuteStatuss.value[4], color: '#13C2C2' },
	{ name: '需重测', value: testexecuteStatuss.value[5], color: '#722ED1' }
]);

const priorityTotal = computed(() => priorityData.value.reduce((s: number, p: any) => s + (Number(p.value) || 0), 0));
const executeTotal = computed(() => executeData.value.reduce((s: number, e: any) => s + (Number(e.value) || 0), 0));

// 环形图背景：按占比生成 conic-gradient
const donutBg = (list: any[]) => {
	const total = list.reduce((s: number, it: any) => s + (Number(it.value) || 0), 0);
	if (!total) return 'conic-gradient(var(--rd-bg-secondary) 0% 100%)';
	let acc = 0;
	const segs = list.map((it: any) => {
		const from = acc * 100;
		acc += (Number(it.value) || 0) / total;
		return `${it.color} ${from}% ${acc * 100}%`;
	});
	return `conic-gradient(${segs.join(',')})`;
};

// 研发风险中心
const DevBlockConfirmList = ref<any[]>([]);
const delayList = ref<any[]>([]);

// 近期任务
const recentProjectList = ref<any[]>([]);

// 公告
const notData = ref<any>('');
// 跑马灯时长随公告长度自适应
const noticeDuration = computed(() => Math.max(12, Math.round(String(notData.value || '').length / 4)));

const handleRadioChange = () => {
	getRdHomeData();
	getRdRank();
};

const handleTimeChange = () => {
	getRdHomeData();
	getRdRank();
};

// ===== 研发积分排行：月/日取所选年月，年取所选年度，累计查全历史；日维度不参与排名仅识别不参与排名人员 =====
const rdRankList = ref<any[]>([]);
/** 完全不在榜单中展示的人员 */
const hiddenRankUserIds = new Set(['1030']);

const getRdRank = async () => {
	try {
		const now = new Date();
		const type = contractType.value;
		let params: any = {};
		if (type === 'month' || type === 'day') {
			const src = type === 'month' ? model.monthTime : model.dayTime;
			const d = new Date(Number(src) || Date.now());
			params = { year: d.getFullYear(), month: d.getMonth() + 1 };
		} else if (type === 'year') {
			const d = new Date(Number(model.yearTime) || Date.now());
			params = { year: d.getFullYear() };
		}
		const data = await fetchGetRdScoreRank(params);
		rdRankList.value = data || [];
	} catch (e) {
		console.error('获取研发积分排行失败', e);
	}
};

/** 榜上积分全为 0 视为未开榜：不展示奖牌图标（排名排序与积分数值仍按数据展示） */
const hasValidScore = computed(() => rdRankList.value.some((r: any) => Number(r.totalScore) > 0));

/** 展示榜单：参与排名的按 rank 升序，rank=null（999、1036 等不参与排名人员）固定并入末尾 */
const displayRankList = computed(() => {
	const ranked = rdRankList.value
		.filter((r: any) => r.rank !== null && r.rank !== undefined)
		.sort((a: any, b: any) => Number(a.rank) - Number(b.rank));
	const pinned = rdRankList.value.filter((r: any) => r.rank === null || r.rank === undefined);
	return [...ranked, ...pinned].filter((r: any) => !hiddenRankUserIds.has(String(r.userId)));
});

const medalMap: Record<number, { text: string; color: string; bg: string }> = {
	1: { text: 'NO1', color: '#d48806', bg: 'rgba(250, 173, 20, 0.15)' },
	2: { text: 'NO2', color: '#8a9099', bg: 'rgba(138, 144, 153, 0.15)' },
	3: { text: 'NO3', color: '#ad6800', bg: 'rgba(250, 140, 22, 0.15)' }
};

const fmtRankScore = (v: any) => {
	const n = Number(v);
	return Number.isNaN(n) ? '-' : n.toFixed(2);
};

const getRdHomeData = async () => {
	try {
		const data = await fetchDevHomeData({
			dates:
				contractType.value === 'total'
					? undefined
					: contractType.value === 'day'
						? getSystemDate(0, model.dayTime)
						: contractType.value === 'month'
							? getSystemDate(3, model.monthTime)
							: getSystemDate(4, model.yearTime)
		});
		const defaultList = createDefaultSummary();
		(data || []).forEach((item: any) => {
			const index = defaultList.findIndex((v) => v.rdtype === item.rdtype);
			if (index !== -1) {
				defaultList[index] = { ...defaultList[index], ...item };
			}
		});
		summaryList.value = defaultList;
		totalList.value.forEach((t) => (t.value = 0));
		testprioritys.value = [0, 0, 0, 0];
		testexecuteStatuss.value = [0, 0, 0, 0, 0, 0];
		summaryList.value.forEach((item: any) => {
			totalList.value[0].value += item.projectCount;
			totalList.value[1].value += item.demandCount;
			totalList.value[2].value += item.taskCount;
			totalList.value[3].value += item.taskStatus5;
			totalList.value[4].value += item.rdelay1 || 0;
			totalList.value[5].value += item.rstatus3 || 0;
			totalList.value[6].value += item.testCount || 0;
			testprioritys.value[0] += item.priority0 || 0;
			testprioritys.value[1] += item.priority1 || 0;
			testprioritys.value[2] += item.priority2 || 0;
			testprioritys.value[3] += item.priority3 || 0;
			testexecuteStatuss.value[0] += item.executeStatus0 || 0;
			testexecuteStatuss.value[1] += item.executeStatus1 || 0;
			testexecuteStatuss.value[2] += item.executeStatus2 || 0;
			testexecuteStatuss.value[3] += item.executeStatus3 || 0;
			testexecuteStatuss.value[4] += item.executeStatus4 || 0;
			testexecuteStatuss.value[5] += item.executeStatus5 || 0;
		});
	} catch (e) {
		console.error('获取研发首页数据失败', e);
	}
};

const getfetchDevBlockConfirm = async () => {
	try {
		const data = await fetchDevBlockConfirm({ page: 1, limit: 100 });
		DevBlockConfirmList.value = data.list || [];
	} catch (e) {
		console.error('获取未确认紧急需求失败', e);
	}
};

const getfetchDevDelayTask = async () => {
	try {
		const data = await fetchDevDelayTask({ page: 1, limit: 100 });
		delayList.value = data.list || [];
	} catch (e) {
		console.error('获取延期任务失败', e);
	}
};

const getNot = async () => {
	try {
		const data = await fetchNotice();
		notData.value = data;
	} catch (e) {
		console.error('获取公告失败', e);
	}
};

const getRdPrjList = async () => {
	try {
		const data = await fetchUserTask();
		recentProjectList.value = data || [];
	} catch (e) {
		console.error('获取近期任务失败', e);
	}
};

// 研发缺陷统计（/rdDefectMain/getHomeStatistics，点击胶囊跳缺陷列表）
const defectStats = ref<Record<string, number>>({
	totalCount: 0,
	processingCount: 0,
	testingCount: 0,
	urgentPendingCount: 0,
	todayNewCount: 0,
	todayClosedCount: 0
});

// 展示口径对齐 web 端 rdhome.vue：总缺陷/处理中/测试中/紧急/今日新增/今日关闭
const defectSummary = [
	{ key: 'totalCount', label: '总缺陷数量', color: '#1677ff', status: null },
	{ key: 'processingCount', label: '处理中', color: '#1677ff', status: 2 },
	{ key: 'testingCount', label: '测试中', color: '#722ed1', status: 5 },
	{ key: 'urgentPendingCount', label: '紧急', color: '#f5222d', status: null },
	{ key: 'todayNewCount', label: '今日新增', color: '#36cfc9', status: null },
	{ key: 'todayClosedCount', label: '今日关闭', color: '#52c41a', status: null }
];

const getDefectStatistics = async () => {
	try {
		const data = await fetchGetHomeStatistics();
		if (data) {
			defectStats.value = { ...defectStats.value, ...data };
		}
	} catch (e) {
		console.error('获取缺陷统计失败', e);
	}
};

const goDefectList = (status: number | null) => {
	uni.navigateTo({ url: '/mePages/rddefect/Index' + (status != null ? '?status=' + status : '') });
};

// 工具函数
const getTypeName = (type: number) => {
	const map: Record<number, string> = { 0: '平台研发', 1: '数据通讯', 2: '网络安全' };
	return map[type] || '未知类型';
};

const getTypeDesc = (type: number) => {
	const map: Record<number, string> = {
		0: '平台研发、公共组件、系统功能、平台架构',
		1: '采集协议、网关通讯、设备接入与数据链路',
		2: '安全审计、漏洞治理、权限与边界防护'
	};
	return map[type] || '未知类型';
};

const getTypeColor = (type: number) => {
	const map: Record<number, string> = { 0: '#5b8ff9', 1: '#36cfc9', 2: '#9254de' };
	return map[type] || '#8A9099';
};

const typeName = (rdtype: number) => getTypeName(rdtype);

const tagStyle = (rdtype: number) => {
	const c = getTypeColor(rdtype);
	return { color: c, background: c + '14', borderColor: c + '2e' };
};

const getTaskStatus = (item: any) => {
	return [
		{ label: '已完成', value: item.taskStatus8 || 0, color: '#14b8a6' },
		{ label: '开发中', value: item.taskStatus5 || 0, color: '#1677ff' },
		{ label: '待开始', value: item.taskStatus0 || 0, color: '#faad14' }
	];
};

const getTestStatus = (item: any) => {
	return [
		{ label: '待测试', value: item.testStatus0 || 0, color: '#f59e0b' },
		{ label: '测试中', value: item.testStatus1 || 0, color: '#1677ff' },
		{ label: '未通过', value: item.testStatus2 || 0, color: '#ef4444' },
		{ label: '已通过', value: item.testStatus3 || 0, color: '#22c55e' }
	];
};

const progressWidth = (item: any) => {
	const total = Number(item.taskCount) || 0;
	const done = Number(item.taskStatus8) || 0;
	const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
	return pct + '%';
};

const doingList = (row: any) => {
	let list = [];
	try {
		list = JSON.parse(row.doingTasks || '[]');
	} catch {
		list = [];
	}
	return list;
};

const doingCount = (row: any) => doingList(row).length;

// 近期任务轮播：每人每次只展示 1 条，每 2s 切换下一条
const activeTaskIndex = reactive<Record<string, number>>({});

const currentTaskIndex = (row: any) => {
	const list = doingList(row);
	if (!list.length) return -1;
	const idx = activeTaskIndex[row.username] ?? 0;
	return idx % list.length;
};

const currentTask = (row: any) => doingList(row)[currentTaskIndex(row)] || null;

const taskName = (row: any) => {
	const t = currentTask(row);
	if (!t) return '未命名任务';
	return t.tname || t.taskName || t.name || t.task || '未命名任务';
};

const taskMeta = (row: any) => {
	const t = currentTask(row) || {};
	return { project: t.pname || t.projectName || '', time: t.startTime || t.beginTime || '' };
};

const advanceTasks = () => {
	recentProjectList.value.forEach((row: any) => {
		const list = doingList(row);
		if (!list.length) return;
		const idx = activeTaskIndex[row.username] ?? 0;
		activeTaskIndex[row.username] = (idx + 1) % list.length;
	});
};

const finishRate = (row: any) => {
	const total = Number(row.taskCount) || 0;
	const finish = Number(row.finishTaskCount) || 0;
	return total ? ((finish / total) * 100).toFixed(1) + '%' : '0%';
};

// 下拉刷新：重新拉取全部研发数据
const refresh = async () => {
	await Promise.all([
		getRdHomeData(),
		getRdPrjList(),
		getfetchDevBlockConfirm(),
		getfetchDevDelayTask(),
		getNot(),
		getRdRank()
	]);
};

defineExpose({ refresh, startPolling, stopPolling });

let timer: any = null;
let taskTimer: any = null;

// 轮询启停（父页面 onHide/onShow 控制，避免离开页面后仍在发请求）
function startPolling() {
	if (timer) return;
	timer = setInterval(() => {
		getRdHomeData();
		getRdPrjList();
		getfetchDevBlockConfirm();
		getfetchDevDelayTask();
		getNot();
		getDefectStatistics();
		getRdRank();
	}, 1000 * 60);
	taskTimer = setInterval(advanceTasks, 2000);
}

function stopPolling() {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
	if (taskTimer) {
		clearInterval(taskTimer);
		taskTimer = null;
	}
}

onMounted(async () => {
	getRdHomeData();
	getfetchDevBlockConfirm();
	getfetchDevDelayTask();
	getNot();
	getDefectStatistics();
	getRdRank();
	await getRdPrjList();
	startPolling();
});

onUnmounted(() => {
	stopPolling();
});
</script>

<style scoped lang="scss">
.rd-page {
	padding: 24rpx;
	padding-bottom: 48rpx;
}

/* 顶部横幅 */
.rd-banner {
	border-radius: 24rpx;
	padding: 20rpx 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.04);
}
.rd-banner-top {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12rpx;
}
.rd-banner-title {
	font-size: 34rpx;
	font-weight: 700;
	color: var(--rd-text-primary);
}
.rd-banner-sub {
	font-size: 22rpx;
	color: var(--rd-text-secondary);
}
.rd-filter {
	margin-top: 16rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}
.rd-picker {
	flex: 1;
	height: 56rpx;
	display: flex;
	align-items: center;
	border-radius: 12rpx;
	padding: 0 16rpx;
	box-sizing: border-box;
}

/* 公告 */
.rd-notice {
	margin-top: 24rpx;
	border-radius: 20rpx;
	padding: 22rpx 24rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.04);
}
.rd-notice-bar {
	width: 8rpx;
	height: 32rpx;
	border-radius: 4rpx;
	background: #f5a623;
	flex-shrink: 0;
}
.rd-notice-marquee {
	flex: 1;
	margin-left: 16rpx;
	overflow: hidden;
}
.rd-notice-track {
	display: inline-block;
	white-space: nowrap;
	animation: rd-marquee 15s linear infinite;
}
.rd-notice-text {
	display: inline-block;
	white-space: nowrap;
	font-size: 24rpx;
	color: var(--rd-text-secondary);
	padding-right: 80rpx;
}
@keyframes rd-marquee {
	0% {
		transform: translateX(0);
	}
	100% {
		transform: translateX(-50%);
	}
}

/* 分类统计卡片（每行三个） */
.rd-grid7 {
	margin-top: 24rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.rd-card7 {
	display: flex;
	align-items: center;
	width: calc((100% - 32rpx) / 3);
	padding: 24rpx 20rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.04);
	box-sizing: border-box;
}
.rd-icon {
	width: 68rpx;
	height: 68rpx;
	border-radius: 20rpx;
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.rd-card7-info {
	margin-left: 16rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
.rd-card7-value {
	font-size: 40rpx;
	font-weight: 700;
	color: var(--rd-text-primary);
	line-height: 1.2;
}
.rd-card7-label {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: var(--rd-text-secondary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 区块标题 */
.rd-section-title {
	margin-top: 40rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
}
.rd-section-name {
	margin-left: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
}
/* 研发缺陷统计卡 */
.rd-defect-card {
	margin-bottom: 24rpx;
}
.rd-defect-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}
.rd-defect-title {
	margin-left: 12rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
}
.rd-defect-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16rpx;
}
.rd-defect-chip {
	border: 1rpx solid;
	border-radius: 16rpx;
	padding: 20rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.rd-defect-value {
	font-size: 34rpx;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
.rd-defect-label {
	margin-top: 6rpx;
	font-size: 22rpx;
	color: var(--rd-text-secondary);
}
.rd-dot {
	width: 12rpx;
	height: 28rpx;
	border-radius: 6rpx;
	background: #0055fe;
}
.rd-dot.orange {
	background: #f59e0b;
}
.rd-dot.red {
	background: #ef4444;
}

/* 通用卡片 */
.rd-card {
	border-radius: 24rpx;
	padding: 28rpx;
	box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.04);
	margin-bottom: 24rpx;
}

/* 部门研发概览 */
.rd-type-header {
	display: flex;
	align-items: center;
}
.rd-type-dot {
	width: 16rpx;
	height: 64rpx;
	border-radius: 8rpx;
	flex-shrink: 0;
}
.rd-type-info {
	margin-left: 16rpx;
}
.rd-type-name {
	font-size: 30rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
}
.rd-type-desc {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: var(--rd-text-secondary);
}
.rd-overview {
	margin-top: 24rpx;
	display: flex;
	background: var(--rd-bg-primary);
	border-radius: 16rpx;
	padding: 20rpx 0;
}
.rd-overview-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	border-right: 1rpx solid var(--rd-border);
}
.rd-overview-item:last-child {
	border-right: none;
}
.rd-overview-value {
	font-size: 36rpx;
	font-weight: 700;
}
.rd-overview-value.blue {
	color: #1677ff;
}
.rd-overview-value.purple {
	color: #9254de;
}
.rd-overview-value.red {
	color: #ef4444;
}
.rd-overview-label {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: var(--rd-text-secondary);
}
.rd-progress-row {
	margin-top: 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.rd-progress-label {
	font-size: 24rpx;
	color: var(--rd-text-primary);
}
.rd-progress-num {
	font-size: 24rpx;
	color: #1890ff;
	font-weight: 600;
}
.rd-progress-track {
	margin-top: 12rpx;
	height: 12rpx;
	border-radius: 6rpx;
	background: var(--rd-bg-secondary);
	overflow: hidden;
}
.rd-progress-bar {
	height: 100%;
	border-radius: 6rpx;
	transition: width 0.3s;
}
.rd-task-grid {
	margin-top: 20rpx;
	display: flex;
	gap: 16rpx;
}
.rd-task-chip {
	flex: 1;
	border: 1rpx solid;
	border-radius: 16rpx;
	padding: 16rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.rd-task-value {
	font-size: 32rpx;
	font-weight: 700;
}
.rd-task-name {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: var(--rd-text-secondary);
}
.rd-test-grid {
	margin-top: 16rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.rd-test-item {
	width: calc((100% - 50rpx) / 4);
	border: 1rpx solid var(--rd-border);
	border-radius: 12rpx;
	padding: 12rpx 12rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
}
.rd-test-name {
	font-size: 24rpx;
}
.rd-test-value {
	font-size: 28rpx;
	font-weight: 700;
}

/* 测试优先级 / 测试执行汇总 */
.rd-row2 {
	display: flex;
	gap: 16rpx;
	margin-bottom: 24rpx;
}
.rd-card-half {
	flex: 1;
	border-radius: 24rpx;
	padding: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.04);
	box-sizing: border-box;
}
.rd-half-title {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
	margin-bottom: 16rpx;
}
/* 测试任务总览条 */
.rd-test-bar {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}
.rd-test-bar-info {
	margin-left: 20rpx;
	flex: 1;
	overflow: hidden;
}
.rd-test-bar-title {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
}
.rd-test-bar-label {
	margin-top: 4rpx;
	font-size: 20rpx;
	color: var(--rd-text-secondary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.rd-test-bar-num {
	display: flex;
	align-items: baseline;
	gap: 6rpx;
	flex-shrink: 0;
}
.rd-test-unit {
	font-size: 22rpx;
	color: var(--rd-text-secondary);
}
.rd-test-icon {
	width: 72rpx;
	height: 72rpx;
	border-radius: 22rpx;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6rpx 16rpx rgba(19, 194, 194, 0.4);
}
.rd-test-total {
	font-size: 44rpx;
	font-weight: 700;
	color: #13c2c2;
	line-height: 1.1;
}
/* 环形图 */
.rd-donut-wrap {
	margin: 8rpx 0 12rpx;
	display: flex;
	justify-content: center;
}
.rd-donut {
	width: 168rpx;
	height: 168rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.rd-donut-center {
	width: 112rpx;
	height: 112rpx;
	border-radius: 50%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.rd-donut-total {
	font-size: 32rpx;
	font-weight: 700;
	color: var(--rd-text-primary);
	line-height: 1.1;
}
.rd-donut-cap {
	margin-top: 4rpx;
	font-size: 18rpx;
	color: var(--rd-text-secondary);
}
.rd-legend-list {
	display: flex;
	flex-direction: column;
}
.rd-legend-row {
	display: flex;
	align-items: center;
	padding: 8rpx 0;
}
.rd-legend-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	flex-shrink: 0;
}
.rd-legend-name {
	margin-left: 12rpx;
	font-size: 24rpx;
	color: var(--rd-text-primary);
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.rd-legend-value {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
}

/* 研发风险中心 */
.rd-risk-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.rd-risk-title {
	display: flex;
	align-items: center;
}
.rd-risk-name {
	margin-left: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
}
.rd-risk-count {
	font-size: 22rpx;
	color: #f59e0b;
	background: rgba(245, 158, 11, 0.12);
	border-radius: 24rpx;
	padding: 4rpx 16rpx;
}
.rd-risk-count.red {
	color: #ef4444;
	background: rgba(239, 68, 68, 0.1);
}
.rd-risk-list {
	margin-top: 16rpx;
	max-height: 320rpx;
	overflow-y: auto;
}
.rd-risk-item {
	font-size: 24rpx;
	color: var(--rd-text-primary);
	line-height: 1.6;
	padding: 10rpx 0;
	border-bottom: 1rpx solid var(--rd-border);
}
.rd-risk-item:last-child {
	border-bottom: none;
}
.rd-risk-item .hl {
	color: #f59e0b;
}
.rd-risk-name-text {
	color: #0055fe;
}
.rd-divider {
	height: 1rpx;
	background: var(--rd-border);
	margin: 20rpx 0;
}
.rd-delay-list {
	margin-top: 16rpx;
	max-height: 320rpx;
	overflow-y: auto;
}
.rd-delay-item {
	padding: 10rpx 0;
	border-bottom: 1rpx solid var(--rd-border);
}
.rd-delay-item:last-child {
	border-bottom: none;
}
.rd-delay-name {
	font-size: 26rpx;
	font-weight: 500;
	color: var(--rd-text-primary);
}
.rd-delay-desc {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: var(--rd-text-secondary);
}
.rd-empty {
	margin-top: 16rpx;
	font-size: 24rpx;
	color: var(--rd-text-secondary);
	text-align: center;
	padding: 20rpx 0;
}

/* 研发积分排行 */
.rd-section-tip {
	margin-left: 12rpx;
	font-size: 22rpx;
	color: var(--rd-text-secondary);
}
.rd-rank-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16rpx 8rpx;
	border-bottom: 1rpx solid var(--rd-border);
}
.rd-rank-row:last-child {
	border-bottom: none;
}
.rd-rank-left {
	display: flex;
	align-items: center;
	gap: 16rpx;
	min-width: 0;
}
.rd-rank-no {
	width: 64rpx;
	text-align: center;
	font-size: 26rpx;
	font-weight: 700;
	color: var(--rd-text-secondary);
	flex-shrink: 0;
}
.rd-rank-medal {
	min-width: 64rpx;
	text-align: center;
	padding: 4rpx 10rpx;
	border-radius: 10rpx;
	font-size: 22rpx;
	font-weight: 700;
	flex-shrink: 0;
}
.rd-rank-name {
	font-size: 26rpx;
	color: var(--rd-text-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.rd-rank-pinned .rd-rank-name {
	color: var(--rd-text-secondary);
}
.rd-rank-score {
	font-size: 28rpx;
	font-weight: 600;
	color: #2d8cf0;
	flex-shrink: 0;
	margin-left: 16rpx;
}

/* 近期任务 */
.rd-user-row {
	padding: 20rpx 0;
	border-bottom: 1rpx solid var(--rd-border);
}
.rd-user-row:last-child {
	border-bottom: none;
}
.rd-user-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.rd-user-name {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
}
.rd-user-type {
	font-size: 22rpx;
	border-radius: 8rpx;
	padding: 4rpx 14rpx;
	border: 1rpx solid;
}
.rd-user-doing {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: var(--rd-text-secondary);
}
.rd-doing-list {
	margin-top: 12rpx;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.rd-doing-item {
	background: var(--rd-bg-primary);
	border-radius: 12rpx;
	padding: 12rpx 16rpx;
}
.rd-doing-switch {
	animation: rd-task-switch 0.4s ease;
}
@keyframes rd-task-switch {
	0% {
		opacity: 0;
		transform: translateY(16rpx);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}
.rd-doing-name {
	font-size: 24rpx;
	color: var(--rd-text-primary);
}
.rd-doing-meta {
	margin-top: 4rpx;
	font-size: 20rpx;
	color: var(--rd-text-secondary);
	display: flex;
	justify-content: space-between;
}
.rd-user-stats {
	margin-top: 16rpx;
	display: flex;
}
.rd-us-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.rd-us-v {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--rd-text-primary);
}
.rd-us-v.green {
	color: #22c55e;
}
.rd-us-v.red {
	color: #ef4444;
}
.rd-us-v.blue {
	color: #1677ff;
}
.rd-us-l {
	margin-top: 2rpx;
	font-size: 20rpx;
	color: var(--rd-text-secondary);
}
</style>
