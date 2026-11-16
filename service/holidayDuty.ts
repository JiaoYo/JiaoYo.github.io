// 值班管理（周末/法定节假日值班安排）—— 对齐 web 端 holidayDuty 模块，同一后端 /api/duty
// 日期格式 yyyy-MM-dd，时间格式 HH:mm
import request from '@/utils/request';

/** 日期类型：0=普通工作日/调休工作日，1=普通周末，2=法定节假日 */
export type DutyDayType = 0 | 1 | 2;

/** 值班人员 */
export interface DutyUser {
	dutyId?: number;
	userId: number;
	username: string;
	phone?: string;
	roleName?: string;
	sort?: number;
}

/** 值班安排（单日详情，无值班时仍返回日期属性） */
export interface DutySchedule {
	id?: number;
	dutyDate: string;
	week?: string;
	dayType?: DutyDayType;
	holidayName?: string;
	isWorkday?: 0 | 1;
	/** 该日期是否允许安排值班（有值班时表示允许追加人员） */
	canDuty?: boolean;
	hasDuty?: boolean;
	message?: string;
	startTime?: string;
	endTime?: string;
	emergencyPhone?: string;
	description?: string;
	remark?: string;
	userCount?: number;
	users: DutyUser[];
}

/** 月历单日（仅当月真实日期） */
export interface DutyCalendarDay {
	date: string;
	week: string;
	dayType: DutyDayType;
	holidayName?: string;
	isWorkday: 0 | 1;
	canDuty: boolean;
	hasDuty: boolean;
	users: DutyUser[];
}

/** 整月日历和汇总 */
export interface DutyCalendarMonth {
	year: number;
	month: number;
	dutyDays: number;
	weekendDays: number;
	holidayDays: number;
	userCount: number;
	days: DutyCalendarDay[];
}

/** 新增/修改值班入参（追加模式下仅 dutyDate + userIds 生效） */
export interface DutySaveRequest {
	dutyDate?: string;
	startTime?: string;
	endTime?: string;
	emergencyPhone?: string;
	description?: string;
	remark?: string;
	userIds: number[];
}

/** 人员月度值班统计 */
export interface DutyStatistic {
	userId: number;
	username: string;
	dutyDates: string[];
	dutyCount: number;
}

/** 月历 */
export function fetchGetDutyCalendar(params: { year: number; month: number }) {
	return request({
		url: '/api/duty/calendar',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}

/** 单日详情 */
export function fetchGetDutyDetail(params: { date: string }) {
	return request({
		url: '/api/duty/detail',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}

/** 新增值班；当天已有主记录时表示向该日追加人员 */
export function fetchCreateDuty(data: DutySaveRequest) {
	return request({
		url: '/api/duty',
		method: 'POST',
		data,
	});
}

/** 修改值班公共信息及最终人员集合（userIds 为保存后的完整集合） */
export function fetchUpdateDuty(id: number, data: DutySaveRequest) {
	return request({
		url: `/api/duty/${id}`,
		method: 'PUT',
		data,
	});
}

/** 删除当日某个值班人员（后端 @RequestParam 接参，DELETE 须拼在 URL 上） */
export function fetchDeleteDutyUser(date: string, userId: number) {
	return request({
		url: `/api/duty/user?date=${encodeURIComponent(date)}&userId=${userId}`,
		method: 'DELETE',
	});
}

/** 删除当日全部值班（主记录和人员关联） */
export function fetchDeleteDutyDate(date: string) {
	return request({
		url: `/api/duty/date/${encodeURIComponent(date)}`,
		method: 'DELETE',
	});
}

/** 近期值班（从当天起，按日期升序） */
export function fetchGetRecentDuty(limit = 15) {
	return request({
		url: '/api/duty/recent',
		method: 'GET',
		data: { limit, _t: new Date().getTime() },
	});
}

/** 人员月度值班统计 */
export function fetchGetDutyStatistics(params: { year: number; month: number }) {
	return request({
		url: '/api/duty/statistics',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}

/* ---------------- 值班报表（基路径 /api/duty/report，沿用值班管理查看权限） ---------------- */

/** 报表周期类型：MONTH 月度；YEAR 年度（后端兼容大小写） */
export type DutyReportPeriodType = 'MONTH' | 'YEAR';

/** 报表周期 */
export interface DutyReportPeriod {
	periodType: DutyReportPeriodType;
	year: number;
	/** 年度模式不返回 */
	month?: number;
	startDate: string;
	endDate: string;
	/** 面向展示的周期名，如 2026年9月 */
	label: string;
}

/** 汇总统计：值班天数口径为去重后的值班日期数，同一天多人值班仍计 1 天 */
export interface DutyReportSummary {
	dutyDays: number;
	/** 值班人次：同一天 3 人值班计 3 人次 */
	assignmentCount: number;
	/** 参与人数（去重） */
	userCount: number;
	/** 普通周末值班天数（按日期去重） */
	weekendDays: number;
	/** 法定节假日值班天数（按日期去重） */
	holidayDays: number;
}

/** 趋势项：月度为当月每个自然日（无数据补零），年度固定 12 项对应 1-12 月 */
export interface DutyReportTrend {
	bucket: string;
	label: string;
	dutyDays: number;
	assignmentCount: number;
	userCount: number;
}

/** 人员明细行：报表使用人员当前姓名；年度模式 dutyDates 为空数组，按月计数见 monthlyCounts */
export interface DutyUserReportRow {
	userId: number;
	username: string;
	roleName?: string;
	dutyCount: number;
	weekendCount: number;
	holidayCount: number;
	dutyDates: string[];
	/** 年度模式固定包含 1-12 键，无数据月份为 0；月度模式为空对象 */
	monthlyCounts: Record<string, number>;
}

/** 人员分页 */
export interface DutyReportPage {
	pageNum: number;
	pageSize: number;
	total: number;
	pages: number;
	list: DutyUserReportRow[];
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}

/** 值班报表响应：周期、汇总、趋势和人员分页明细；人员筛选同时作用于四者 */
export interface DutyReportResponse {
	period: DutyReportPeriod;
	summary: DutyReportSummary;
	trend: DutyReportTrend[];
	page: DutyReportPage;
}

/** 值班报表查询（月度/年度）；快速连续查询时请求方需自行丢弃过期响应 */
export function fetchQueryDutyReport(data: {
	periodType: DutyReportPeriodType;
	/** 年份 2000-2100 */
	year: number;
	/** 月份 1-12；月度必填，年度模式忽略 */
	month?: number;
	/** 人员 ID 数组；空数组或不传表示全部人员；后端自动去重，最多 500 项 */
	userIds?: number[];
	/** 页码，默认 1 */
	page?: number;
	/** 每页条数，默认 50，最大 300 */
	limit?: number;
}) {
	return request({
		url: '/api/duty/report/query',
		method: 'POST',
		data,
	});
}
