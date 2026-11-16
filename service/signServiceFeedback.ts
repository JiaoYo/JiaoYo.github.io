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
export function fetchGetFeedbackPage(params: Record<string, any>) {
  return request({ url: `/projectServiceSign/feedback/getPage.do${buildQueryParams(params)}`, method: 'GET' }) as Promise<{ list: any[]; total: number; }>;
}

export function fetchGetFeedbackStats() {
  return request({ url: '/projectServiceSign/feedback/stats.do', method: 'GET' }) as Promise<any>;
}
