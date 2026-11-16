// 工程项目周期完成率报表 V2 —— 对齐 web 端 reportmanagement/projectCycleReport
// 口径说明：按实际业务事件时间归属统计；REVIEWED 按送审时间(pending_review_time)、COMPLETED 按实际完成时间(ckdbtime)。
// 按期率=按期项目/全部命中项目；周期效率=计划工期合计/实际投入人天合计；贡献率=个人任务权重/项目总任务权重。
import request from '@/utils/request';

/** 统计口径：REVIEWED 项目送审 / COMPLETED 项目完成 */
export type ProjectCycleReportType = 'REVIEWED' | 'COMPLETED';

/** 项目人员归属：负责人数据库中也是参与人，但接口已从 participants 中排除，前端不要重复合并 */
export interface CycleProjectMember {
	userId: number;
	userName: string;
	/** RESPONSIBLE 负责人 / PARTICIPANT 参与人 */
	role: 'RESPONSIBLE' | 'PARTICIPANT';
	/** 个人已完成调试任务权重：只统计 status=2 且 finish_time <= 口径事件时间的任务 */
	taskWeight: number | null;
	/** 贡献率 = 个人任务权重 / 项目总任务权重 × 100；缺少有效任务权重时为 null */
	contributionRate: number | null;
}

/** 项目明细（单行） */
export interface CycleProjectV2Item {
	projectId: number;
	projectName: string;
	/** 口径事件时间：REVIEWED=送审时间，COMPLETED=实际完成时间（yyyy-MM-dd HH:mm:ss） */
	eventTime: string | null;
	/** 送审时间（yyyy-MM-dd HH:mm:ss） */
	pendingReviewTime: string | null;
	/** 实际完成时间（yyyy-MM-dd HH:mm:ss） */
	actualEndTime: string | null;
	actualStartDate: string | null;
	plannedEndDate: string | null;
	plannedDays: number | null;
	/** 实际投入人天；区间缺人/缺时间/时间倒置时为 null，原因写入 dataIssue */
	actualEffortDays: number | null;
	/** 口径时间晚于计划完成日期的天数；计划日期缺失或非法时为 null */
	delayDays: number | null;
	/** 是否按期；计划日期缺失或非法时为 null（显示"-"，不按"否"处理） */
	onTime: boolean | null;
	/** 项目已完成调试任务权重合计 */
	totalTaskWeight: number | null;
	responsible: CycleProjectMember | null;
	/** 参与人列表（后端已排除负责人） */
	participants: CycleProjectMember[];
	warrantyEndDate: string | null;
	bonusIssued: boolean;
	bonusIssuedTime: string | null;
	bonusIssuedBy: number | null;
	bonusIssuedByName: string | null;
	/** 项目状态：仅展示用（-1 未通过审核 0 未开始 1 进行中 2 待审核 3 已完成 4 返工中） */
	status: number | null;
	progress: number | null;
	/** 数据问题（可能多个，中文分号连接） */
	dataIssue: string | null;
	/** 项目调试类型：0 现场 / 1 远程 / 2 无需调试，空为未设置 */
	dtype: number | null;
	/** 出差统计（分人） */
	travelStats?: Array<{ userId: number; userName: string; travelCount: number; travelDays: number }>;
	travelCountTotal?: number;
	travelDaysTotal?: number;
}

/** 汇总：始终基于本次按事件时间查出的全部项目计算，与明细分页无关 */
export interface CycleCompletionV2Summary {
	totalProjects: number;
	onTimeProjects: number;
	lateProjects: number;
	/** 计划数据不完整（无法判断按期）的项目数 */
	scheduleDataIncompleteProjects: number;
	/** 按期率 = 按期项目 / 全部命中项目 × 100 */
	onTimeRate: number;
	averageDelayDays: number;
	plannedDaysTotal: number;
	/** 实际投入人天合计（不是任务权重） */
	actualEffortDaysTotal: number;
	/** 已完成调试任务权重合计 */
	taskWeightTotal: number;
	/** 周期效率 = 计划工期合计 / 实际投入人天合计 × 100 */
	cycleEfficiencyRate: number;
}

/** 人员统计行 */
export interface CyclePersonV2Stat {
	userId: number;
	userName: string;
	projectCount?: number;
	responsibleProjectCount?: number;
	collaborationProjectCount?: number;
	onTimeProjectCount?: number;
	lateProjectCount?: number;
	scheduleDataIncompleteProjectCount?: number;
	onTimeRate?: number | null;
	averageDelayDays?: number | null;
	effectiveWeightProjectCount?: number;
	taskWeight?: number;
	dataIssueProjectCount?: number;
	[key: string]: number | string | boolean | null | undefined;
}

/** 报表响应 */
export interface ProjectCycleCompletionV2Report {
	reportType: ProjectCycleReportType;
	/** 规范化后的查询区间（yyyy-MM，结束月包含整月） */
	startMonth: string;
	endMonth: string;
	/** 面向展示的闭区间日期 */
	periodStart: string;
	periodEnd: string;
	/** 全部筛选命中的项目数（分页只作用于 projects） */
	total: number;
	page: number;
	limit: number;
	pages: number;
	summary: CycleCompletionV2Summary;
	personStats: CyclePersonV2Stat[];
	/** 当前页项目明细 */
	projects: CycleProjectV2Item[];
}

/** 周期完成率报表 V2：月份跨度最多 24 个月，支持跨年 */
export function fetchGetProjectCycleCompletionV2(params: {
	reportType: ProjectCycleReportType;
	/** 开始月份 yyyy-MM */
	startMonth: string;
	/** 结束月份 yyyy-MM，包含该月 */
	endMonth: string;
	/** 负责人或参与人 ID，逗号分隔，最多 100 个 */
	userIds?: string;
	/** 项目调试类型：0 现场、1 远程、2 无需调试，逗号分隔；未传/空值默认 [0,1] */
	debugTypes?: string;
	page?: number;
	/** 默认 20，最大 100 */
	limit?: number;
}) {
	return request({
		url: '/report/selectProjectCycleCompletionV2.do',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}

/** 修改奖金发放标识（需 project:Info:update 权限）：标记为已发放时后端记录操作人和操作时间 */
export function fetchUpdateProjectBonusIssued(params: { projectId: number; bonusIssued: boolean }) {
	return request({
		url: '/report/updateProjectBonusIssued.do',
		method: 'PUT',
		data: params,
	});
}
