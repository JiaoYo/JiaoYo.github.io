// 项目日报图片附件（projectRdFile，ftype=10）
import request from '@/utils/request';

// 图片附件分页查询
export function fetchGetPrjRdFileList(data?: any) {
    return request({
        url: '/projectRdFile/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 新增日报图片附件
export function fetchAddPrjRdFile(data?: any) {
    return request({
        url: '/projectRdFile/insertOne.do',
        method: 'POST',
        data,
    });
}

// 删除日报图片附件（arrIds 逗号分隔）
export function fetchDeletePrjRdFile(pid: number | string, arrIds: number | string) {
    return request({
        url: `/projectRdFile/deleteDailyList.do?pid=${pid}&arrIds=${arrIds}`,
        method: 'DELETE',
    });
}

// 研发文件批量登记（数组提交；ftype 11=销售线索跟进图片，pid=跟进记录 id）
export function fetchAddRdFileList(data: any[]) {
    return request({
        url: '/projectRdFile/insert.do',
        method: 'POST',
        data,
    });
}
