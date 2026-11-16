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

/**
 * ==================== 研发满意度调查（对齐 web rdSatisfaction）====================
 * 每月1日凌晨生成上月调查：评价人 usertype 1/2/3/9，被评价研发 usertype=5；
 * 五项等权 1—5 分，新记录默认满分；总分=五项算术平均值；status 0=系统默认，1=已人工评价。
 */

/** 调查任务分页：评价人只能看自己的任务；研发匿名查看对自己的评价；管理岗 0/4 可查看全部 */
export function fetchGetRdSatisfactionPage(params: {
    page: number;
    limit: number;
    /** 调查月份 yyyyMM */
    surveyMonth?: number;
    rdUserId?: number;
    /** 0=待评价（系统默认满分）；1=已人工评价 */
    status?: number;
}) {
    return request({
        url: `/rdSatisfaction/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/** 统计：任务数量、默认/人工评价数量和五个维度均分（均分含默认满分记录） */
export function fetchGetRdSatisfactionStats(params: { surveyMonth?: number; rdUserId?: number }) {
    return request({
        url: `/rdSatisfaction/getStats.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 提交评价：只传 id + 五项分数 + feedback；
 * 服务端只接受当前登录人的分数及反馈，提交后 overallScore 重算、status 变为 1
 */
export function fetchUpdateRdSatisfaction(data: {
    id: number;
    responseSpeed: number;
    communicationEfficiency: number;
    problemSolvingEfficiency: number;
    productUsability: number;
    productStability: number;
    feedback?: string;
}) {
    return request({
        url: '/rdSatisfaction/update.do',
        method: 'put',
        data
    });
}
