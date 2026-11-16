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

/** 电网类型：0南网、1国网（新增默认传0） */
export type ProtocolGridType = 0 | 1;

/**
 * ==================== 规约转换器（后端模块 /protocolConverter） ====================
 */

/**
 * 分页查询规约转换器（null/空串条件由调用方剔除）
 */
export function fetchProtocolConverterPage(params: {
    page: number;
    limit: number;
    gridType?: ProtocolGridType;
    brandId?: number;
    inverterModel?: string;
    provinceId?: number;
    cityId?: number;
    startTime?: string;
    endTime?: string;
    _t?: number;
}) {
    return request({
        url: `/protocolConverter/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 规约转换器详情（编辑回显）
 */
export function fetchProtocolConverterDetail(id: number | string) {
    return request({
        url: `/protocolConverter/getById.do${buildQueryParams({ id })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 新增规约转换器，data 为新增记录ID；品牌/型号/省/市必填，不提交销售负责人和日期
 */
export function fetchProtocolConverterInsert(data: {
    gridType: ProtocolGridType;
    brandId: number;
    inverterModel: string;
    provinceId: number;
    cityId: number;
    harnessMaterialCode?: string;
    harnessName?: string;
    notes?: string;
}) {
    return request({
        url: '/protocolConverter/insertOne.do',
        method: 'POST',
        data
    });
}

/**
 * 修改规约转换器；线束/备注清空时提交空字符串
 */
export function fetchProtocolConverterUpdate(data: {
    id: number | string;
    gridType: ProtocolGridType;
    brandId: number;
    inverterModel: string;
    provinceId: number;
    cityId: number;
    harnessMaterialCode?: string;
    harnessName?: string;
    notes?: string;
}) {
    return request({
        url: '/protocolConverter/update.do',
        method: 'PUT',
        data
    });
}

/**
 * 删除规约转换器（一次最多100条；DELETE @RequestParam 须拼 URL）
 */
export function fetchProtocolConverterDelete(ids: string) {
    return request({
        url: `/protocolConverter/delete.do${buildQueryParams({ arrIds: ids })}`,
        method: 'DELETE',
        data: undefined
    });
}

/**
 * 省份下拉
 */
export function fetchProtocolConverterProvinces() {
    return request({
        url: '/protocolConverter/getProvinces.do',
        method: 'get',
        data: undefined
    });
}

/**
 * 城市下拉（按省份）
 */
export function fetchProtocolConverterCities(provinceId: number) {
    return request({
        url: `/protocolConverter/getCities.do${buildQueryParams({ provinceId })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * ==================== 逆变器品牌维护（/protocolConverterBrand） ====================
 */

/**
 * 品牌业务下拉（仅启用品牌）
 */
export function fetchProtocolConverterBrandOptions() {
    return request({
        url: '/protocolConverterBrand/getOptions.do',
        method: 'get',
        data: undefined
    });
}

/**
 * 品牌分页（默认 sortNo ASC, id ASC 排序）
 */
export function fetchProtocolConverterBrandPage(params: {
    page: number;
    limit: number;
    brandName?: string;
    status?: number;
    _t?: number;
}) {
    return request({
        url: `/protocolConverterBrand/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 品牌详情
 */
export function fetchProtocolConverterBrandDetail(id: number | string) {
    return request({
        url: `/protocolConverterBrand/getById.do${buildQueryParams({ id })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 新增品牌（status 不传默认1，sortNo 不传默认0）
 */
export function fetchProtocolConverterBrandInsert(data: { brandName: string; status: number; sortNo: number }) {
    return request({
        url: '/protocolConverterBrand/insertOne.do',
        method: 'POST',
        data
    });
}

/**
 * 修改/停用品牌
 */
export function fetchProtocolConverterBrandUpdate(data: { id: number | string; brandName: string; status: number; sortNo: number }) {
    return request({
        url: '/protocolConverterBrand/update.do',
        method: 'PUT',
        data
    });
}

/**
 * 删除品牌（被规约转换器引用时后端拒绝，提示改用停用；DELETE @RequestParam 须拼 URL）
 */
export function fetchProtocolConverterBrandDelete(ids: string) {
    return request({
        url: `/protocolConverterBrand/delete.do${buildQueryParams({ arrIds: ids })}`,
        method: 'DELETE',
        data: undefined
    });
}

/**
 * ==================== 规约图片（projectRdFile，pid=规约id，ftype 12接口/13铭牌/14线束） ====================
 */

/**
 * 分页查询文件列表（不带 proid，同 web 规约页口径）
 */
export function fetchProtocolRdFilePage(params: {
    pid: number | string;
    ftype: number;
    page: number;
    limit: number;
    _t?: number;
}) {
    return request({
        url: `/projectRdFile/getPage.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 添加文件（数组提交，返回带 id 的记录）
 */
export function fetchAddProtocolRdFile(data: Array<{ furl: string; fname: string; pid: number | string; ftype: number }>) {
    return request({
        url: '/projectRdFile/insert.do',
        method: 'POST',
        data
    });
}

/**
 * 更新文件（别名等）
 */
export function fetchUpdateProtocolRdFile(data: Array<{ id: number | string; furl: string; fname: string; pid: number | string; ftype: number }>) {
    return request({
        url: '/projectRdFile/update.do',
        method: 'PUT',
        data
    });
}

/**
 * 删除文件（ids 逗号分隔；DELETE @RequestParam 须拼 URL）
 */
export function fetchDeleteProtocolRdFile(ids: string) {
    return request({
        url: `/projectRdFile/delete.do${buildQueryParams({ arrIds: ids })}`,
        method: 'DELETE',
        data: undefined
    });
}
