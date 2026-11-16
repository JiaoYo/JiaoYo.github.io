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
 * ==================== 研发需求 ====================
 */

/**
 * 分页查询研发需求列表
 */
export function fetchRdDemandPage(params: {
    page: number;
    limit: number;
    pid?: number;
    fuzzy?: string;
    creater?: number;
    rdtype?: number;
    dstatus?: number;
    priority?: number;
    hasTask?: number;
}) {
    return request({
        url: `/rdDemand/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 获取研发需求详情
 */
export function fetchRdDemandInfo(id: number) {
    return request({
        url: '/rdDemand/getById.do',
        method: 'get',
        params: { id }
    });
}

/**
 * 新增研发需求
 */
export function fetchAddRdDemand(data: any) {
    return request({
        url: '/rdDemand/insert.do',
        method: 'POST',
        data
    });
}

/**
 * 修改研发需求
 */
export function fetchUpdateRdDemand(data: any) {
    return request({
        url: '/rdDemand/update.do',
        method: 'PUT',
        data
    });
}

export function fetchDeleteRdDemandInfo(id: number | string) {
    return request({
        url: `/rdDemand/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

/**
 * 评审研发需求（口径同 web：PUT /rdDemand/reUpdate.do，参数走 query）
 */
export function fetchReviewRdDemandPage(data: {
    id: number;
    dstatus: number;
    renotes?: string;
    proid?: number;
}) {
    return request({
        url: `/rdDemand/reUpdate.do${buildQueryParams({ id: data.id, dstatus: data.dstatus, renotes: data.renotes, proid: data.proid })}`,
        method: 'put',
        data: undefined
    });
}

/**
 * ==================== 文件相关 ====================
 */

/**
 * 分页查询文件列表
 */
export function fetchRdFilePage(params: {
    proid: number;
    pid: number;
    page: number;
    limit: number;
    ftype?: number;
}) {
    return request({
        url: `/projectRdFile/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 添加文件
 */
export function fetchAddRdFile(data: Array<{
    furl: string;
    fname: string;
    pid: number;
    proid: number;
    ftype?: number;
}>) {
    return request({
        url: '/projectRdFile/insert.do',
        method: 'POST',
        data
    });
}

/**
 * 删除文件
 */
export function fetchDeleteRdFile(ids: string) {
    return request({
        url: `/projectRdFile/delete.do?ids=${ids}`,
        method: 'DELETE',
    });
}

/**
 * 更新研发文件（别名等）
 */
export function fetchUpdateRdFile(data: any) {
    return request({
        url: '/projectRdFile/update.do',
        method: 'put',
        data
    });
}

/**
 * ==================== 任务状态 ====================
 */

/**
 * 获取需求下的任务状态
 */
export function fetchRdTaskStatus(params: {
    proid: number;
    pid: number;
}) {
    return request({
        url: `/rdTask/getTaskStatus.do${buildQueryParams(params)}`,
        method: 'get',
    });
}

/**
 * ==================== 抄送人 ====================
 */

/**
 * 分页查询抄送人列表
 */
export function fetchRdCopy(params: {
    page: number;
    limit: number;
    pid: number;
}) {
    return request({
        url: `/rdDemandCc/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 添加抄送人
 */
export function fetchAddRdCopy(data: Array<{
    cc: string | number;
    pid: number;
}>) {
    return request({
        url: '/rdDemandCc/insert.do',
        method: 'POST',
        data
    });
}

/**
 * 删除抄送人
 */
export function fetchDeleteRdCopy(ids: string) {
    return request({
        url: `/rdDemandCc/delete.do${buildQueryParams({ arrIds: ids })}`,
        method: 'delete',
        data: undefined
    });
}

export function fetchRdProjectPage(params: any) {
  return request({
    url: `/rdProject/getPage.do${buildQueryParams(params)}`,
    method: 'get'
  })
}

/**
 * 查询合同列表（需求来源=三方合同时选择合同编号；fuzzy=合同名称、contractnum=合同编号）
 */
export function fetchGetContractList(params: {
    page: number;
    limit: number;
    fuzzy?: string;
    contractnum?: string;
}) {
    return request({
        url: `/projectContract/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}
