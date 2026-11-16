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
 * ==================== 研发考核 ====================
 */

/**
 * 分页查询研发考核列表
 */
export function fetchGetProjectAssessmentListByPage(params: {
    page: number;
    limit: number;
    evaluationcycle?: string;
    dept?: number;
    creater?: number;
    fuzzy?: string;
}) {
    return request({
        url: `/rdAssessment/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 修改研发考核
 */
export function fetchUpdateProjectAssessmentInfo(data: Array<any>) {
    return request({
        url: '/rdAssessment/update.do',
        method: 'PUT',
        data
    });
}

/**
 * 查询研发模板
 */
export function fetchGetProjectAssessmentTemplateListByPage() {
    return request({
        url: '/rdAssessment/getModel.do',
        method: 'get'
    });
}

/**
 * ==================== 研发考核(试用版) ====================
 */

/**
 * 分页查询研发考核列表(试用版)
 */
export function fetchGetProjectAssessmentNewListByPage(params: {
    page: number;
    limit: number;
    evaluationcycle?: string;
    dept?: number;
    creater?: number;
    fuzzy?: string;
}) {
    return request({
        url: `/rdAssessmentNew/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 修改研发考核(试用版)
 */
export function fetchUpdateProjectAssessmentNewInfo(data: Array<any>) {
    return request({
        url: '/rdAssessmentNew/update.do',
        method: 'PUT',
        data
    });
}

/**
 * 查询研发模板(试用版)
 */
export function fetchGetProjectAssessmentNewTemplateListByPage() {
    return request({
        url: '/rdAssessmentNew/getModel.do',
        method: 'get'
    });
}

/**
 * 获取研发考核详情
 */
export function fetchGetProjectAssessmentInfo(id: string) {
    return request({
        url: '/rdAssessment/getById.do',
        method: 'get',
        data: undefined,
        params: { id }
    });
}




/**
 * 研发周报查询
 */
export function fetchRdReportPage(params: any) {
  return request({
    url: `/rdWeek/getPage.do${buildQueryParams(params)}`,
    method: 'get'
  })
}
