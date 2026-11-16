import request from '@/utils/request';

/**
 * 构建查询参数字符串
 */
function buildQueryParams(params: Record<string, any>): string {
  const parts: string[] = []
  for (const key in params) {
    const val = params[key]
    if (val !== undefined && val !== null && val !== '') {
      parts.push(`${key}=${encodeURIComponent(String(val))}`)
    }
  }
  return parts.length ? `?${parts.join('&')}` : ''
}


/**
 * ==================== 点表管理 ====================
 */

/**
 * 分页查询点表模板列表
 */
export function fetchPointPage(params: {
  page: number;
  limit: number;
  fuzzy?: string;
  muid?: number | '';
  mdid?: number | '';
  ptid?: number | '';
  status?: number | '';
}) {
  return request({
    url: `/point/getPage.do${buildQueryParams(params)}`,
    method: 'get',
    data: undefined
  });
}

/**
 * 删除点表模板
 */
export function fetchDeletePoint(id: string) {
  return request({
    url: `/point/delete.do?arrIds=${id}`,
    method: 'DELETE',
    data: undefined
  });
}

/**
 * 添加点表模板
 */
export function fetchAddPoint(data: {
  pname: string;
  muid?: number;
  mdid?: number;
  ptid?: number;
  fileurl?: string;
  notes?: string;
  status?: number;
}) {
  return request({
    url: '/point/insert.do',
    method: 'POST',
    data
  });
}

/**
 * 修改点表模板
 */
export function fetchUpdatePoint(data: {
  id: number;
  pname?: string;
  muid?: number;
  mdid?: number;
  ptid?: number;
  fileurl?: string;
  notes?: string;
  status?: number;
}) {
  return request({
    url: '/point/update.do',
    method: 'PUT',
    data
  });
}

/**
 * 分页查询点表厂家列表
 */
export function fetchPointManuPage(params: {
  page: number;
  limit: number;
  fuzzy?: string;
}) {
  return request({
    url: `/pointManu/getPage.do${buildQueryParams(params)}`,
    method: 'get',
    data: undefined
  });
}

/**
 * 添加点表厂家
 */
export function fetchAddPointManu(data: { manu: string; notes?: string }) {
  return request({
    url: '/pointManu/insert.do',
    method: 'POST',
    data
  });
}

/**
 * 修改点表厂家
 */
export function fetchUpdatePointManu(data: { id: number; manu: string; notes?: string }) {
  return request({
    url: '/pointManu/update.do',
    method: 'PUT',
    data
  });
}

/**
 * 删除点表厂家
 */
export function fetchDeletePointManu(id: string) {
  return request({
    url: `/pointManu/delete.do?arrIds=${id}`,
    method: 'DELETE',
    data: undefined
  });
}

/**
 * 分页查询点表型号列表
 */
export function fetchPointModelPage(params: {
  page: number;
  limit: number;
  pid?: number;
  fuzzy?: string;
}) {
  return request({
    url: `/pointModel/getPage.do${buildQueryParams(params)}`,
    method: 'get',
    data: undefined
  });
}

/**
 * 添加点表型号
 */
export function fetchAddPointModel(data: { model: string; pid: number; notes?: string }) {
  return request({
    url: '/pointModel/insert.do',
    method: 'POST',
    data
  });
}

/**
 * 修改点表型号
 */
export function fetchUpdatePointModel(data: { id: number; model: string; pid: number; notes?: string }) {
  return request({
    url: '/pointModel/update.do',
    method: 'PUT',
    data
  });
}

/**
 * 删除点表型号
 */
export function fetchDeletePointModel(id: string) {
  return request({
    url: `/pointModel/delete.do?arrIds=${id}`,
    method: 'DELETE',
    data: undefined
  });
}

/**
 * 分页查询点表协议列表
 */
export function fetchPointProtypePage(params: {
  page: number;
  limit: number;
  fuzzy?: string;
}) {
  return request({
    url: `/pointProtype/getPage.do${buildQueryParams(params)}`,
    method: 'get',
    data: undefined
  });
}

/**
 * 添加点表协议
 */
export function fetchAddPointProtype(data: { protype: string; notes?: string }) {
  return request({
    url: '/pointProtype/insert.do',
    method: 'POST',
    data
  });
}

/**
 * 修改点表协议
 */
export function fetchUpdatePointProtype(data: { id: number; protype: string; notes?: string }) {
  return request({
    url: '/pointProtype/update.do',
    method: 'PUT',
    data
  });
}

/**
 * 删除点表协议
 */
export function fetchDeletePointProtype(id: string) {
  return request({
    url: `/pointProtype/delete.do?arrIds=${id}`,
    method: 'DELETE',
    data: undefined
  });
}
