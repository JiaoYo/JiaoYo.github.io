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
 * ==================== 研发产品缺陷（多人责任人模型，接口前缀 /rdDefectMain） ====================
 * 主表 tb_rd_defect_main，责任人表 tb_rd_defect_assignee；
 * 验证/报告/用例/记录以缺陷 id（defectId）为参数。
 */

/**
 * 研发产品列表（全量）
 */
export function fetchRdProjectListPage(params: any) {
  return request({
    url: `/rdProject/getPageList.do${buildQueryParams(params)}`,
    method: 'get'
  })
}

/**
 * 分页查询缺陷列表：page、limit、projectId、status、assignee、tester、fuzzy、startDate、endDate；
 * 每行含 assignees 多责任人数组
 */
export function fetchRdDefectPage(params: {
    page: number;
    limit: number;
    projectId?: number;
    status?: number;
    assignee?: number;
    tester?: number;
    fuzzy?: string;
    startDate?: string;
    endDate?: string;
}) {
    return request({
        url: `/rdDefectMain/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 获取缺陷详情：返回 { defect, assignees, logs }（兼容平铺结构）
 */
export function fetchRdDefectInfo(id: number | string) {
    return request({
        url: `/rdDefectMain/getById.do${buildQueryParams({ id })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 新增缺陷
 */
export function fetchAddRdDefect(data: any) {
    return request({
        url: '/rdDefectMain/insert.do',
        method: 'POST',
        data
    });
}

/**
 * 修改缺陷主要信息（创建人编辑共用，不能传状态/责任人）
 */
export function fetchUpdateRdDefect(data: any) {
    return request({
        url: '/rdDefectMain/update.do',
        method: 'PUT',
        data
    });
}

/**
 * 缺陷提出人验证，body: { passed, assigneeIds?, notes? }
 * 不通过时 assigneeIds 为责任人记录 id（tb_rd_defect_assignee.id，已完成记录）
 */
export function fetchCreatorVerify(defectId: number | string, data: { passed: boolean; assigneeIds?: number[]; notes?: string }) {
    return request({
        url: `/rdDefectMain/creatorVerify.do${buildQueryParams({ defectId })}`,
        method: 'POST',
        data
    });
}

/**
 * 查询缺陷全部责任人的独立缺陷报告（按责任人记录 assigneeId 关联）
 */
export function fetchGetReportList(defectId: number | string) {
    return request({
        url: `/rdDefectMain/getReportList.do${buildQueryParams({ defectId })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 查询当前全部有效测试用例
 */
export function fetchGetTestCaseList(defectId: number | string) {
    return request({
        url: `/rdDefectMain/getTestCaseList.do${buildQueryParams({ defectId })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 查询历次测试执行记录（按批次 batchNo 分组）
 */
export function fetchGetTestRecordList(defectId: number | string) {
    return request({
        url: `/rdDefectMain/getTestRecordList.do${buildQueryParams({ defectId })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 研发首页缺陷统计（总数/处理中/测试中/紧急/今日新增/今日关闭）
 */
export function fetchGetHomeStatistics(params?: { projectId?: number }) {
    return request({
        url: `/rdDefectMain/getHomeStatistics.do${buildQueryParams(params || {})}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 反馈信息列表（按日期倒序；与历史「每日进度」字段兼容）
 */
export function fetchGetProgressList(defectId: number | string) {
    return request({
        url: `/rdDefectMain/getProgressList.do${buildQueryParams({ defectId })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 提交反馈信息（body: { feedback }，最长 255 字符）
 */
export function fetchSubmitDefectFeedback(defectId: number | string, feedback: string) {
    return request({
        url: `/rdDefectMain/submitFeedback.do${buildQueryParams({ defectId })}`,
        method: 'POST',
        data: { feedback }
    });
}

/**
 * 暂停/恢复申请与审核记录列表
 */
export function fetchGetPauseRequestList(defectId: number | string) {
    return request({
        url: `/rdDefectMain/getPauseRequestList.do${buildQueryParams({ defectId })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 申请暂停（body: { reason }，审核由项目负责人在 web 端处理）
 */
export function fetchApplyPauseDefect(defectId: number | string, reason: string) {
    return request({
        url: `/rdDefectMain/applyPause.do${buildQueryParams({ defectId })}`,
        method: 'POST',
        data: { reason }
    });
}

/**
 * 申请恢复（原暂停申请人可提交，body: { reason }）
 */
export function fetchApplyResumeDefect(defectId: number | string, reason: string) {
    return request({
        url: `/rdDefectMain/applyResume.do${buildQueryParams({ defectId })}`,
        method: 'POST',
        data: { reason }
    });
}

