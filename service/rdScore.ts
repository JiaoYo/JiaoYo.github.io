// 研发积分（排行/报表/月度结算）
import request from '@/utils/request';

/**
 * 构建查询参数字符串（兼容旧版安卓）
 */
function buildQueryParams(params: Record<string, any>): string {
    const parts: string[] = [];
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            parts.push(key + '=' + encodeURIComponent(String(params[key])));
        }
    }
    return parts.length > 0 ? '?' + parts.join('&') : '';
}

/** 研发积分查询参数：month 必须与 year 同传；userIds 不传表示全部人员 */
export interface RdScoreParams {
    /** 年份；不传查全历史 */
    year?: number;
    /** 月份 1~12 */
    month?: number;
    /** 人员 ID 逗号分隔，如 "1001,1002" */
    userIds?: string;
}

/** 研发积分行：rank/report 通用 */
export interface RdScoreItem {
    userId: number;
    username: string;
    /** 月度数据为 yyyy-MM；年度汇总和全历史查询为 null */
    period: string | null;
    /** 最终研发积分（其余兼容字段前端展示不使用，禁止自行相加） */
    totalScore: number;
    /** 仅 rank.do 由后端赋值，从 1 开始；999、1036 为 null 且固定排在列表末尾 */
    rank: number | null;
}

/**
 * 研发积分排行：后端完成排序，普通人员按 totalScore DESC, userId ASC 连续编号；
 * 不传时间=全历史汇总，仅 year=年度汇总，year+month=该月积分
 */
export function fetchGetRdScoreRank(params: RdScoreParams) {
    return request({
        url: `/rdScore/rank.do${buildQueryParams(params)}`,
        method: 'GET'
    });
}

/**
 * 研发积分报表：year+month=该月逐人数据；仅 year=该年各月逐人逐月数据（period 标识月份）；
 * 不传时间=全历史汇总。报表不保证顺序，需要名次请用 fetchGetRdScoreRank
 */
export function fetchGetRdScoreReport(params: RdScoreParams) {
    return request({
        url: `/rdScore/report.do${buildQueryParams(params)}`,
        method: 'GET'
    });
}

/**
 * 研发积分月度结算/历史回填（需 project:rd:settle 权限）：按指定季节工时规则计算并覆盖整月快照，
 * 必须整月全量执行，不要传 userIds
 */
export function fetchSettleRdScore(year: number, month: number, season: 'summer' | 'winter') {
    return request({
        url: `/rdScore/settle.do${buildQueryParams({ year, month, season })}`,
        method: 'POST'
    });
}
