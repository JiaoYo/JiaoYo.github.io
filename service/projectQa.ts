import request from '@/utils/request';

/**
 * 产品答疑 - 分页查询
 */
export function fetchGetProjectQaPage(params: any) {
  return request<any>({
    url: '/projectQa/getPage.do',
    method: 'get',
    data:params
  });
}

/**
 * 产品答疑 - ID查询
 */
export function fetchGetProjectQaById(id: number) {
  return request<any>({
    url: '/projectQa/getById.do',
    method: 'get',
    data: { id }
  });
}

/**
 * 产品答疑 - 新增
 */
export function fetchInsertProjectQa(data: any) {
  return request<boolean>({
    url: '/projectQa/insert.do',
    method: 'post',
    data
  });
}

/**
 * 产品答疑 - 修改
 */
export function fetchUpdateProjectQa(data: any) {
  return request<boolean>({
    url: '/projectQa/update.do',
    method: 'put',
    data
  });
}

/**
 * 产品答疑 - 删除
 */
export function fetchDeleteProjectQa(id: number | string) {
  return request<boolean>({
    url: `/projectQa/delete.do?arrIds=${id}`,
    method: 'DELETE'
  });
}

/**
 * 产品答疑 - 问题查询
 */
export function fetchGetProblemPage(params: any) {
  return request<any>({
    url: '/projectQa/getProblemPage.do',
    method: 'get',
    data: params
  });
}



/**
 * AI 问答
 */
export function fetchGetAiAnswer(params: {question: string, sessionId: string;history?: any}, config?: any) {
  return request({
    url: '/ai/projectData/ask.do',
    method: 'post',
    data: params,
    ...config // 合并配置，包括signal
  });
}
/**
 * AI 问答流式问答
 */
export function fetchGetAiAnswerStream(params: { question: string; sessionId: string;history?: any }, config?: any) {
  return request({
    url: '/ai/projectData/askStream.do',
    method: 'post',
    data: params,
    responseType: 'stream',
    ...config
  });
}

/**
 * ==================== AI智能客服相关接口 ====================
 */

/**
 * 智能客服问答
 */
export function fetchCustomerServiceAsk(params: { question: string; sessionId: any;history?: any}, config?: any) {
  return request<any>({
    url: '/ai/customerService/ask.do',
    method: 'post',
    data: params,
    ...config
  });
}

/**
 * 智能客服流式问答
 */
export function fetchCustomerServiceAskStream(params: { question: string; sessionId: string }, config?: any) {
  return request({
    url: '/ai/customerService/askStream.do',
    method: 'post',
    data: params,
    responseType: 'stream',
    ...config
  });
}

/**
 * 智能客服状态
 */
export function fetchCustomerServiceStatus() {
  return request<any>({
    url: '/ai/customerService/status.do',
    method: 'get'
  });
}

/**
 * 评价智能客服回答
 */
export function fetchCustomerServiceFeedback(data: any) {
  return request<boolean>({
    url: '/ai/customerService/feedback.do',
    method: 'post',
    data
  });
}

/**
 * 查询待处理未命中问题
 */
export function fetchCustomerServiceUnansweredList(params: { limit?: number }) {
  return request<any>({
    url: '/ai/customerService/unanswered/list.do',
    method: 'get',
    data: params
  });
}

/**
 * 处理未命中问题并可加入问答别名
 */
export function fetchCustomerServiceResolveUnanswered(data: any) {
  return request<boolean>({
    url: '/ai/customerService/unanswered/resolve.do',
    method: 'post',
    data
  });
}

/**
 * 查询问答别名
 */
export function fetchCustomerServiceAliasList(qaId: number) {
  return request<any>({
    url: `/ai/customerService/alias/list.do?qaId=${qaId}`,
    method: 'get',
  });
}

/**
 * 批量新增问答别名
 */
export function fetchCustomerServiceSaveAliases(data: any) {
  return request<boolean>({
    url: '/ai/customerService/alias/save.do',
    method: 'post',
    data
  });
}

/**
 * 删除问答别名
 */
export function fetchCustomerServiceDeleteAlias(id: number | string) {
  return request<boolean>({
    url: `/ai/customerService/alias/delete.do?arrIds=${id}`,
    method: 'DELETE'
  });
}

/**
 * 手动刷新问答知识库
 */
export function fetchCustomerServiceRefresh() {
  return request<boolean>({
    url: '/ai/customerService/refresh.do',
    method: 'post'
  });
}
