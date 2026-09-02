// 项目文件
import request from '@/utils/request';

// 项目文件查询分页
export function fetchGetPrjFileDataList(data: any) {
    return request({
        url: '/projectFile/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 项目文件查询详情
export function fetchGetPrjFileInfo(id: number | string) {
    return request({
        url: '/projectFile/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目文件新增
export function fetchSavePrjFileInfo(data?: any) {
    return request({
        url: '/projectFile/insert.do',
        method: 'POST',
        data,
    });
}

// 项目文件修改
export function fetchUpdatePrjFileInfo(data?: any) {
    return request({
        url: '/projectFile/insert.do',
        method: 'POST',
        data,
    });
}

// 项目文件删除(删除上传文件)
export function fetchDeletePrjFileDetailInfo(filepath: string) {
    return request({
        url: `/projectFile/deleteFile.do?filepath=${filepath}`,
        method: 'DELETE',
    });
}

// 项目文件删除
export function fetchDeletePrjFileInfo(id: number | string) {
    return request({
        url: `/projectFile/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
