// 项目财务报表（现场调试项目财务）—— 对齐 web 端 reportmanagement/FinancialReport，同一后端 /projectFinance
// 金额单位：元；日期格式 yyyy-MM-dd / yyyy-MM / yyyy
import request from '@/utils/request';

/** 财务行（一行 = 一个现场调试项目的财务汇总） */
export interface ProjectFinanceRow {
	id: number;
	pid?: number;
	proname?: string;
	contractname?: string;
	contractnum?: string;
	/** -1 未核准 0 未开始 1 进行中 2 待审核 3 完成 4 返工中 */
	status?: number;
	/** 项目进度（百分比数值） */
	progess?: number | string;
	/** 开始时间 */
	sdbtime?: string;
	/** 计划调试时间 */
	plantime?: string;
	/** 预计完成日期 */
	cpdbtime?: string;
	/** 验收时间 */
	ckdbtime?: string;
	/** 延期状态：0 正常 1 已延期 */
	ptype?: number;
	/** 项目出差人姓名 */
	username?: string;
	/** 计划天数 */
	period?: number | string;
	/** 实际天数 */
	actualdays?: number;
	/** 实际人次 */
	actualpers?: number;
	/** 服务费 */
	servicefee?: number;
	/** 单日工资 */
	dailywagecost?: number;
	/** 住宿补贴（日） */
	perac?: number;
	/** 用餐补贴（日） */
	perme?: number;
	/** 工资总成本 = 单日工资 × 实际人次 */
	totalwagecost?: number;
	/** 交通费合计（= 报销明细求和） */
	transportationexpenses?: number;
	/** 住宿费合计 */
	totaltravelexpenses?: number;
	/** 补贴费合计 */
	subsidy?: number;
	/** 总报销费用 */
	submit?: number;
	/** 总费用 = 总报销 + 工资总成本 */
	totalexpenses?: number;
	/** 毛利润 = 服务费 - 总费用 */
	grossprofit?: number;
	/** 报销笔数（后端聚合） */
	fcount?: number;
	financiaList?: any[];
}

/** 报销明细行（库字段 accommodation 即住宿费；submit = 交通 + 住宿 + 补贴） */
export interface ProjectReimbursementRow {
	id?: number;
	fid?: number;
	/** 报销人用户 id */
	submitter?: number;
	/** 交通费 */
	transportationexpenses?: number;
	/** 住宿费（库字段） */
	accommodation?: number;
	/** 前端展示字段，与 accommodation 同值 */
	totaltravelexpenses?: number;
	/** 补贴费 */
	subsidy?: number;
	/** 小计 */
	submit?: number;
	/** 备注 */
	notes1?: string;
	/** 创建人姓名 */
	username?: string;
	/** 创建时间 */
	dbtime?: string;
}

/** 出差打卡记录（行程日历） */
export interface ProjectTripItem {
	id?: number;
	/** 打卡日期 yyyy-MM-dd */
	dbtime: string;
	username: string;
	/** 当日工时（天） */
	dailyWorktime?: number;
}

/** 项目财务分页；date 支持 yyyy-MM-dd / yyyy-MM / yyyy，grossprofit 1 盈利 0 持平 -1 亏损 */
export function fetchProjectFinancePage(params: {
	page?: number;
	pageSize?: number;
	limit?: number;
	date?: string;
	creater?: number;
	status?: number;
	grossprofit?: number;
	fuzzy?: string;
}) {
	return request({
		url: '/projectFinance/getPage.do',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}

/** 批量保存财务字段（数组，每项含 id、可编辑字段及前端计算结果） */
export function fetchUpdateProjectFinance(data: Array<Partial<ProjectFinanceRow> & { id: number }>) {
	return request({
		url: '/projectFinance/update.do',
		method: 'PUT',
		data,
	});
}

/** 删除财务行（后端 @RequestParam 接参，DELETE 须拼 URL） */
export function fetchDeleteProjectFinance(arrIds: number | string) {
	return request({
		url: `/projectFinance/delete.do?arrIds=${arrIds}`,
		method: 'DELETE',
	});
}

/** 报销明细分页（按财务行 fid 查询） */
export function fetchProjectReimbursementPage(params: { page?: number; limit?: number; fid: number }) {
	return request({
		url: '/projectFinanceReimbursement/getPage.do',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}

/** 新增报销（数组） */
export function fetchAddProjectReimbursement(data: ProjectReimbursementRow[], confirmOverlap?: boolean) {
	return request({
		url: `/projectFinanceReimbursement/insert.do${confirmOverlap ? '?confirmOverlap=true' : ''}`,
		method: 'POST',
		data,
		silentError: true,
	});
}

/** 编辑报销（数组） */
export function fetchUpdateProjectReimbursement(data: ProjectReimbursementRow[], confirmOverlap?: boolean) {
	return request({
		url: `/projectFinanceReimbursement/update.do${confirmOverlap ? '?confirmOverlap=true' : ''}`,
		method: 'PUT',
		data,
		silentError: true,
	});
}

/** 删除报销（后端 @RequestParam 接参，DELETE 须拼 URL） */
export function fetchDeleteProjectReimbursement(arrIds: number | string) {
	return request({
		url: `/projectFinanceReimbursement/delete.do?arrIds=${arrIds}`,
		method: 'DELETE',
	});
}

/** 项目出差打卡记录（行程日历，按财务行 fid） */
export function fetchProjectTripList(params: { fid: number }) {
	return request({
		url: '/projectTrip/getList.do',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}

/** ==================== 报销完结 / 复核 / 日期冲突 / 附件（对齐 web FinancialReport） ==================== */

/** 检查报销日期交叉：返回空数组表示没有交叉；excludeId 排除当前记录 */
export function fetchCheckReimbursementDateConflict(params: { fid: number; submitter: number; startdate: string; enddate: string; excludeId?: number }) {
	return request({
		url: '/projectFinanceReimbursement/checkDateConflict.do',
		method: 'GET',
		data: params,
	});
}

/** 人工确认报销完结（原因 2-500 字符） */
export function fetchManualFinishReimbursement(fid: number, reason: string) {
	return request({
		url: `/projectFinance/manualFinishReimbursement.do?fid=${fid}&reason=${encodeURIComponent(reason)}`,
		method: 'PUT',
		data: undefined,
	});
}

/** 撤销人工完结（撤销后系统立即重新判断覆盖状态） */
export function fetchCancelManualFinishReimbursement(fid: number, reason: string) {
	return request({
		url: `/projectFinance/cancelManualFinishReimbursement.do?fid=${fid}&reason=${encodeURIComponent(reason)}`,
		method: 'PUT',
		data: undefined,
	});
}

/** 重算报销覆盖与完结状态 */
export function fetchRecalculateReimbursement(fid: number) {
	return request({
		url: `/projectFinance/recalculateReimbursement.do?fid=${fid}`,
		method: 'PUT',
		data: undefined,
	});
}

/** 报销附件列表（ftype=4，pid=报销记录 id） */
export function fetchFinanceFilePage(params: { page?: number; pid: number; limit?: number; ftype?: number }) {
	return request({
		url: '/projectRdFile/getPage.do',
		method: 'GET',
		data: params,
	});
}

/** 新增报销附件（ftype=4） */
export function fetchFinanceFileAdd(data: Array<{ furl: string; fname: string; pid: number; ftype?: number }>) {
	return request({
		url: '/projectRdFile/insert.do',
		method: 'POST',
		data,
	});
}

/** 删除报销附件 */
export function fetchFinanceFileDelete(arrIds: string) {
	return request({
		url: `/projectRdFile/delete.do?arrIds=${arrIds}`,
		method: 'DELETE',
		data: undefined,
	});
}
