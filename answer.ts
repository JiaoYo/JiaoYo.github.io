import { request } from '../request';

/**
 * 考核问题查询
 */
export function fetchGetProjectProblemListByPage(params?: any) {
    return request({
        url: '/projectAssessmentTitle/getPage.do',
        method: 'get',
        params
    });
}

/**
 * 考核问题回答查询
 */
export function fetchGetProjectProblemAnswerDataListByPage(params?: any) {
    return request({
        url: '/projectAssessmentAnswer/getPage.do',
        method: 'get',
        params
    });
}

/**
 * 考核问题回答
 */
export function fetchSaveProjectProblemInfo(data?: any) {
    return request({
        url: '/projectAssessmentAnswer/insert.do',
        method: 'POST',
        data
    });
}

/**
 * 考核问题修改
 */
export function fetchUpdateProjectProblemInfo(data?: any) {
    return request({
        url: '/projectAssessmentAnswer/update.do',
        method: 'PUT',
        data
    });
}