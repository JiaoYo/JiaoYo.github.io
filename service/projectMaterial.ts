// 项目物料库 / 物料-权重关系（与 web 端共用后端接口）
import request from '@/utils/request';

// 物料库分页查询（fuzzy 同时匹配名称、物料编码、厂家和型号；devtype 0 我司设备 1 非我司设备）
export function fetchGetProjectMaterialPage(data: any) {
    return request({
        url: '/projectMaterialLibrary/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 物料库详情（记录不存在时 data 为 null）
export function fetchGetProjectMaterialInfo(id: number | string) {
    return request({
        url: '/projectMaterialLibrary/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 物料库新增（数组，最多 100 条；物料编码全表唯一）
export function fetchSaveProjectMaterialInfo(data?: any) {
    return request({
        url: '/projectMaterialLibrary/insert.do',
        method: 'POST',
        data,
    });
}

// 物料库修改（每项必须含 id）
export function fetchUpdateProjectMaterialInfo(data?: any) {
    return request({
        url: '/projectMaterialLibrary/update.do',
        method: 'PUT',
        data,
    });
}

// 物料库删除（仅删物料库，不影响项目设备）
export function fetchDeleteProjectMaterialInfo(id: number | string) {
    return request({
        url: `/projectMaterialLibrary/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

// 物料-权重关系分页查询（mid 物料 id，wid 权重类型 id，fuzzy 匹配物料名称/编码/权重类型名称）
export function fetchGetMaterialWeightPage(data: any) {
    return request({
        url: '/projectMaterialLibraryWeight/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 物料-权重关系详情
export function fetchGetMaterialWeightInfo(id: number | string) {
    return request({
        url: '/projectMaterialLibraryWeight/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 物料-权重关系新增（每项必须包含 mid、wid；(mid, wid) 唯一）
export function fetchSaveMaterialWeightInfo(data?: any) {
    return request({
        url: '/projectMaterialLibraryWeight/insert.do',
        method: 'POST',
        data,
    });
}

// 物料-权重关系修改（每项必须包含 id，并至少包含 mid 或 wid）
export function fetchUpdateMaterialWeightInfo(data?: any) {
    return request({
        url: '/projectMaterialLibraryWeight/update.do',
        method: 'PUT',
        data,
    });
}

// 物料-权重关系删除
export function fetchDeleteMaterialWeightInfo(id: number | string) {
    return request({
        url: `/projectMaterialLibraryWeight/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
