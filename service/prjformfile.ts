// 工程调试单项目文件
import request from '@/utils/request';

// 工程调试单项目文件查询分页
export function fetchGetPrjformFileDataList(data: any) {
    return request({
        url: '/projectFormFile/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 工程调试单项目文件查询详情
export function fetchGetPrjformFileInfo(id: number | string) {
    return request({
        url: '/projectFormFile/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 工程调试单项目文件新增
export function fetchSavePrjformFileInfo(data?: any) {
    return request({
        url: '/projectFormFile/insert.do',
        method: 'POST',
        data,
    });
}

// 工程调试单项目文件修改
export function fetchUpdatePrjformFileInfo(data?: any) {
    return request({
        url: '/projectFormFile/insert.do',
        method: 'POST',
        data,
    });
}

// 工程调试单项目文件删除(删除上传文件)
export function fetchDeletePrjformFileDetailInfo(filepath: string) {
    return request({
        url: `/projectFormFile/deleteFile.do?filepath=${filepath}`,
        method: 'DELETE',
    });
}

// 工程调试单项目文件删除
export function fetchDeletePrjformFileInfo(id: number | string) {
    return request({
        url: `/projectFormFile/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
