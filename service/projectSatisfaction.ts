/**
 * 技术支持满意度调查 API
 */
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

/** 答卷记录 */
export interface ProjectSatisfactAnswerItem {
	id: number;
	surveyId: number;
	surveyName: string;
	/** 调查类型：1 个人、2 小组 */
	surveyType: number;
	creater: number;
	createrName: string;
	surveyMonth: number;
	surveyDate: string;
	status: number;
	overallScore: number | null;
	dbtime: string;
	responseTimeliness: number | null;
	technicalProfessionalism: number | null;
	problemSolvingAbility: number | null;
	communicationClarity: number | null;
	supportCooperation: number | null;
	demandUnderstanding: number | null;
	technicalSolutionSupport: number | null;
	issueFollowUp: number | null;
	workResponsibility: number | null;
	onsitePerformance: number | null;
	technicalDocumentSupport: number | null;
	overallSatisfaction: number | null;
	mostSatisfiedAspect: string;
	improvementAspect: string;
	suggestion: string;
}

/** 调查题目 */
export interface ProjectSatisfactQuestionItem {
	id: number;
	type: number;
	surveyItem: string;
	surveyContent: string;
	maxScore: number;
}

/** 答卷分页查询 */
export function fetchGetProjectSatisfactAnswerPage(params: any) {
	return request({
		url: `/projectSupportSatisfactAnswer/getPage.do${buildQueryParams(params)}`,
		method: 'GET',
	});
}

/** 按ID查询答卷 */
export function fetchGetProjectSatisfactAnswerById(id: number) {
	return request({
		url: `/projectSupportSatisfactAnswer/getById.do?id=${id}`,
		method: 'GET',
	});
}

/** 新增答卷 */
export function fetchAddProjectSatisfactAnswer(data?: any) {
	return request({
		url: '/projectSupportSatisfactAnswer/insert.do',
		method: 'POST',
		data
	});
}

/** 修改答卷 */
export function fetchUpdateProjectSatisfactAnswer(data?: any) {
	return request({
		url: '/projectSupportSatisfactAnswer/update.do',
		method: 'PUT',
		data
	});
}

/** 删除答卷 */
export function fetchDeleteProjectSatisfactAnswer(arrIds: any) {
	return request({
		url: `/projectSupportSatisfactAnswer/delete.do?arrIds=${arrIds}`,
		method: 'DELETE',
	});
}

/** 查询全部调查题目 */
export function fetchGetProjectSatisfactQuestionList() {
	return request({
		url: '/projectSupportSatisfactQuestion/getList.do',
		method: 'GET'
	});
}

/** 查询是否存在未提交的答卷 */
export function fetchGetProjectSatisfactAnswerStatus() {
	return request({
		url: '/projectSupportSatisfactAnswer/getStatus.do',
		method: 'GET'
	});
}

/**
 * 查询报表
 * @param params.surveyType 调查类型：1 个人、2 小组，不传查全部
 */
export function fetchGetProjectSatisfactReport(params:{startMonth: number, endMonth: number, surveyType?: number}) {
	return request({
		url: `/projectSupportSatisfactAnswer/report.do${buildQueryParams(params)}`,
		method: 'GET'
	});
}
