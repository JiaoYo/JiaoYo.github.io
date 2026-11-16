// 运营线索统计报表 —— 对齐 web reportmanagement/leadReport，同一后端 /operation/lead/report.do
// 口径：按线索发生日期 date 落期筛选（非创建时间），排除已删除线索；
// 各结果状态为线索"当前"的最新状态，无历史快照；valid_plus_deal_count（有效＋成交）
// 为服务端汇总指标，不重复计入总线索数。
import request from '@/utils/request';

/** 汇总指标 */
export interface LeadReportSummary {
	total_count?: number;
	valid_count?: number;
	invalid_count?: number;
	unassessed_count?: number;
	deal_count?: number;
	other_count?: number;
	valid_plus_deal_count?: number;
	creator_count?: number;
	channel_count?: number;
}

/** 创建人统计行（行内占比分母 = 该行 total_count） */
export interface LeadReportCreatorRow {
	created_by?: number;
	created_by_name?: string;
	total_count?: number;
	valid_count?: number;
	invalid_count?: number;
	unassessed_count?: number;
	deal_count?: number;
	other_count?: number;
	valid_plus_deal_count?: number;
}

/** 渠道统计行（2026-10-14 新增）：指标与创建人行相同，channel_code 为空表示未填写，由前端展示为「未填写」 */
export interface LeadReportChannelRow {
	channel_code?: string;
	total_count?: number;
	valid_count?: number;
	invalid_count?: number;
	unassessed_count?: number;
	deal_count?: number;
	other_count?: number;
	valid_plus_deal_count?: number;
}

/** 报表整页数据：summary 汇总 + creators 按创建人明细 + channels 按渠道明细（2026-10-14 新增） + filters 后端实际生效的时间筛选 */
export interface LeadReportData {
	summary?: LeadReportSummary;
	creators?: LeadReportCreatorRow[];
	channels?: LeadReportChannelRow[];
	filters?: { year?: number; month?: number };
}

/** 运营线索统计报表（scope 固定 ALL 运营全员视角；全部时间不传 year/month，月传 year+month 数字） */
export function fetchLeadReport(params: { scope: 'ALL'; year?: number; month?: number; created_by?: number }) {
	return request({
		url: '/operation/lead/report.do',
		method: 'GET',
		data: { ...params, _t: new Date().getTime() },
	});
}
