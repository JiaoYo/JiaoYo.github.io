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

/** 工程考核类别：MANAGER 经理月度考核 / LEADER 组长月度考核 / BONUS 阶梯奖金考核 */
export type EngineeringAssessmentType = 'MANAGER' | 'LEADER' | 'BONUS';

/**
 * ==================== 工程考核中心（后端模块 /engineeringAssessment） ====================
 */

/**
 * 分页查询工程考核列表
 */
export function fetchGetEngineeringAssessmentPage(params: {
    page: number;
    limit: number;
    assessmentType?: EngineeringAssessmentType;
    evaluationCycle?: string;
    status?: number;
    employeeId?: number;
    _t?: number;
}) {
    return request({
        url: `/engineeringAssessment/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 查询考核详情（instance + batch + template + items + 各阶段授权标记）
 */
export function fetchGetEngineeringAssessmentDetail(id: number | string) {
    return request({
        url: `/engineeringAssessment/getDetail.do${buildQueryParams({ id, _t: new Date().getTime() })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 查询考核模板
 */
export function fetchGetEngineeringAssessmentModel(assessmentType: EngineeringAssessmentType) {
    return request({
        url: `/engineeringAssessment/getModel.do${buildQueryParams({ assessmentType })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 提交自评（全部考核项必填；提交后状态 0→1，自评分由后端复制为上级评分默认值）
 */
export function fetchSubmitEngineeringAssessmentSelf(data: {
    instanceId: number | string;
    items: Array<{ itemId: number | string; score: number; note?: string }>;
}) {
    return request({
        url: '/engineeringAssessment/submitSelf.do',
        method: 'PUT',
        data
    });
}

/**
 * 提交上级评分/部门评分（signature 未传时后端回退当前用户 signature1；BONUS 取消资格后系数强制为 0）
 */
export function fetchSubmitEngineeringAssessmentReview(data: {
    instanceId: number | string;
    signature?: string;
    items: Array<{ itemId: number | string; score: number; note?: string }>;
    eligibilityStatus?: number;
    disqualifyReason?: string;
}) {
    return request({
        url: '/engineeringAssessment/submitReview.do',
        method: 'PUT',
        data
    });
}

/**
 * 被考核人确认并签名（状态 2→5，需窗口开启）
 */
export function fetchConfirmEngineeringAssessment(data: {
    instanceId: number | string;
    signature?: string;
}) {
    return request({
        url: '/engineeringAssessment/confirm.do',
        method: 'PUT',
        data
    });
}

/**
 * 查询当前开放窗口（windowStatus 0 未开启 / 1 已开启 / 2 已关闭）
 */
export function fetchGetEngineeringAssessmentWindow(assessmentType: EngineeringAssessmentType) {
    return request({
        url: `/engineeringAssessment/getWindow.do${buildQueryParams({ assessmentType, _t: new Date().getTime() })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 指定当前批次开启/关闭日期（手工日期只影响当前月份，下月恢复默认）
 */
export function fetchSetEngineeringAssessmentWindow(data: {
    assessmentType: EngineeringAssessmentType;
    openDate?: string;
    closeDate?: string;
    reason: string;
}) {
    return request({
        url: '/engineeringAssessment/setWindow.do',
        method: 'PUT',
        data
    });
}

/**
 * 立即开启/重新开启（closeDate 省略且原关闭时间已过时默认开放至当天 23:59:59；不重复发送新考核消息）
 */
export function fetchOpenEngineeringAssessment(data: {
    assessmentType: EngineeringAssessmentType;
    closeDate?: string;
    reason: string;
}) {
    return request({
        url: '/engineeringAssessment/open.do',
        method: 'POST',
        data
    });
}

/**
 * 立即关闭（关闭后评分控件只读，列表/详情仍可访问）
 */
export function fetchCloseEngineeringAssessment(data: {
    assessmentType: EngineeringAssessmentType;
    reason: string;
}) {
    return request({
        url: '/engineeringAssessment/close.do',
        method: 'POST',
        data
    });
}

/**
 * 补生成当前考核（幂等：已存在不重复创建、不重复发首次通知；assessmentType 省略时补生成三个模块）
 */
export function fetchGenerateEngineeringAssessment(assessmentType?: EngineeringAssessmentType) {
    return request({
        url: `/engineeringAssessment/generate.do${buildQueryParams(assessmentType ? { assessmentType } : {})}`,
        method: 'POST',
        data: undefined
    });
}

/**
 * 重新发送提醒（重新开启不会自动重复推送；向指定被考核人重发 REMINDER 通知）
 */
export function fetchResendEngineeringAssessmentNotification(params: {
    assessmentType: EngineeringAssessmentType;
    employeeId: number | string;
}) {
    return request({
        url: `/engineeringAssessment/resendNotification.do${buildQueryParams(params)}`,
        method: 'POST',
        data: undefined
    });
}
