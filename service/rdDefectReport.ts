// 研发质量驾驶舱（缺陷报表）—— 对齐 web ordermanage reportmanagement/defectReport
// 一次请求返回整页数据：summary 顶部指标、trends 收敛趋势、statusDistribution 流程状态分布、
// productQuality 产品质量洞察、teamEfficiency 团队效能分析、agingDistribution 存量风险分层。
// 后端权限 rd:defect:select；作废/无权限场景由后端控制。
import request from '@/utils/request';

/** 顶部指标汇总 */
export interface RdDefectSummary {
	totalCount: number;
	newCount: number;
	closedCount: number;
	unclosedCount: number;
	averageProcessingHours: number | null;
	firstTestPassRate: number | null;
	reworkRate: number | null;
	reopenRate: number | null;
}

/** 收敛趋势点：年查询按月、月查询按日 */
export interface RdDefectTrendPoint {
	label: string;
	newCount: number;
	closedCount: number;
	unclosedCount: number;
}

/** 流程状态分布项；code 仅用于前端固定配色（PROCESSING/WAIT_TEST/TEST_VERIFY/WAIT_ASSIGN_CONFIRM/PAUSED/REJECTED） */
export interface RdDefectStatusItem {
	code: string;
	name: string;
	count: number;
}

/** 存量账龄分段（D0_3/D4_7/D8_30/D31_PLUS） */
export interface RdDefectAgingItem {
	code: string;
	name: string;
	count: number;
}

/** 产品质量洞察行 */
export interface RdDefectProductRow {
	projectId: number;
	productName: string;
	defectCount: number;
	unclosedCount: number;
	averageProcessingHours: number | null;
	firstTestPassRate: number | null;
	reopenRate: number | null;
}

/** 团队效能行：历史返工责任人明细不完整时 reworkDataComplete=false、reworkRate=null */
export interface RdDefectTeamRow {
	userId: number;
	userName: string;
	participationCount: number;
	completedCount: number;
	currentPendingCount: number;
	averageProcessingHours: number | null;
	reworkRate: number | null;
	reworkDataComplete: boolean;
}

/** 驾驶舱整页响应 */
export interface RdDefectDashboard {
	year: number;
	month: number | null;
	periodStart: string;
	periodEnd: string;
	/** 本次请求的数据截止时间 */
	dataAsOf: string;
	scope: string;
	metricDefinition: string;
	summary: RdDefectSummary;
	trends: RdDefectTrendPoint[];
	statusDistribution: RdDefectStatusItem[];
	agingDistribution: RdDefectAgingItem[];
	productQuality: RdDefectProductRow[];
	teamEfficiency: RdDefectTeamRow[];
}

export function fetchRdDefectDashboard(params: {
	/** 四位年份，必填（2000-2100） */
	year: number | string;
	/** 月份 1~12；不传查整年 */
	month?: number;
	/** 产品(研发项目)ID 逗号分隔，最多 100 项 */
	projectIds?: string;
	/** 缺陷责任人 ID 逗号分隔（usertype=5），最多 100 项 */
	userIds?: string;
	/** 优先级 0=P0 ~ 3=P3 */
	priority?: number;
}) {
	return request({
		url: '/rdDefectStatistics/getDashboard.do',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}
