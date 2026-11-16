// 项目现场文件（图片/视频/压缩包）画廊 —— 对齐 web 端 projectImage 模块接口
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
 * 项目图片/视频分页查询（sort=4 现场照片 / sort=8 现场视频，不传时同时查询）
 * 与 web 端 fetchGetProjectImg 同一接口
 */
export function fetchGetProjectImg(params: {
    page: number;
    limit: number;
    /** 项目 ID，传入时必须大于 0 */
    pid?: number;
    /** 4=现场照片 8=现场视频，不传时同时查询 */
    sort?: number;
    /** 文件创建开始日期 yyyy-MM-dd（含当天） */
    startTime?: string;
    /** 文件创建结束日期 yyyy-MM-dd（含当天） */
    endTime?: string;
    /** true=我已下载 false=我未下载，不传=不限制 */
    downloaded?: boolean;
}) {
    return request({
        url: '/projectFile/getImagePage.do',
        method: 'GET',
        data: {
            ...params,
            _t: new Date().getTime(),
        },
    });
}

/** 记录图片下载（先记录，成功后再开始下载） */
export function fetchRecordImageDownload(params: { fileId: number }) {
    return request({
        url: `/projectFile/recordImageDownload.do${buildQueryParams(params)}`,
        method: 'POST',
    });
}

/** 新增评价（evaluation 仅支持：点赞 / 不采纳） */
export function fetchInsertProjectFileEvaluation(params: { fileId: number; evaluation: string }) {
    return request({
        url: `/projectFileEvaluation/insert.do${buildQueryParams(params)}`,
        method: 'POST',
    });
}

/** 删除当前登录用户对该文件的评价 */
export function fetchDeleteProjectFileEvaluation(params: { fileId: number }) {
    return request({
        url: `/projectFileEvaluation/delete.do${buildQueryParams(params)}`,
        method: 'DELETE',
    });
}

/** 评价分页查询（evaluation 不传时查询该文件全部评价） */
export function fetchGetProjectFileEvaluationPage(params: { page: number; limit: number; fileId: number; evaluation?: string }) {
    return request({
        url: `/projectFileEvaluation/getPage.do${buildQueryParams(params)}`,
        method: 'GET',
        data: {
            ...params,
            _t: new Date().getTime(),
        },
    });
}

/** 下载记录分页详情（权限 project:File:image:select） */
export function fetchGetProjectFileDownloadPage(params: { page: number; limit: number; fileId: number }) {
    return request({
        url: '/projectFileDownload/getPage.do',
        method: 'GET',
        data: {
            ...params,
            _t: new Date().getTime(),
        },
    });
}
