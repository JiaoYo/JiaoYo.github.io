import request from '@/utils/request';

// 考核列表
export function fetchAssessmentList(params?: any) {
    return request<any>({
        url: '/projectAssessment/getPage.do',
        method: 'get',
        data: params
    });
}
/**
 * 新增考核
 */
export function fetchAddAssessment(params: object) {
    return request({
        url: '/projectAssessment/insert.do',
        method: 'post',
        data: params
    });
}
/**
 * 编辑考核
 */
export function fetchEditAssessment(params: object) {
    return request({
        url: '/projectAssessment/update.do',
        method: 'put',
        data: params
    });
}
/**
 * 删除考核
 */
export function fetchDeleteAssessment(id: number | string) {
    return request({
        url: `/projectAssessment/delete.do?arrIds=${id}`,
        method: 'DELETE'
    });
}
/**
 * 开始考核
 */
export function fetchStartAssessment(id: any) {
    return request({
        url: '/projectAssessment/updateStatus.do',
        method: 'get',
        data: { id }
    });
}

/**
 * 查询参与人列表
 */
export function fetchAssessmentUserList(params: object) {
    return request({
        url: '/projectAssessmentParticipate/getPage.do',
        method: 'get',
        data: params
    });
}
/**
 * 新增参与人
 */
export function fetchAddAssessmentUser(params: object) {
    return request({
        url: '/projectAssessmentParticipate/insert.do',
        method: 'post',
        data: params
    });
}

/**
 * 删除参与人
 */
export function fetchDeleteAssessmentUser(id: number | string) {
    return request({
        url: `/projectAssessmentParticipate/delete.do?arrIds=${id}`,
        method: 'DELETE'
    });
}

/**
 * 查询考核问题
 */
export function fetchAssessmentQuestionList(params: object) {
    return request({
        url: '/projectAssessmentTitle/getPage.do',
        method: 'get',
        data: params
    });
}
/**
 * 新增考核问题
 */
export function fetchAddAssessmentQuestion(params: object) {
    return request({
        url: '/projectAssessmentTitle/insert.do',
        method: 'post',
        data: params
    });
}
/**
 * 编辑考核问题
 */
export function fetchEditAssessmentQuestion(params: object) {
    return request({
        url: '/projectAssessmentTitle/update.do',
        method: 'put',
        data: params
    })
}
/**
 * 删除考核问题
 * */
export function fetchDeleteAssessmentQuestion(id: number | string) {
    return request({
        url: `/projectAssessmentTitle/delete.do?arrIds=${id}`,
        method: 'DELETE'
    });
}

/**
 * 考核问题查询
 */
export function fetchGetProjectProblemListByPage(params?: any) {
    return request({
        url: '/projectAssessmentTitle/getPage.do',
        method: 'get',
        data: params
    });
}

/**
 * 考核问题回答查询
 */
export function fetchGetProjectProblemAnswerDataListByPage(params?: any) {
    return request({
        url: '/projectAssessmentAnswer/getPage.do',
        method: 'get',
        data: params
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
