// 项目合同
import request from '@/utils/request';

// 项目合同查询
export function fetchGetPrjContractDataList(data?: any) {
    return request({
        url: '/projectContract/getPage.do',
        method: 'GET',
        data,
    });
}

// 项目合同查询详情
export function fetchGetPrjContractInfo(id: number | string) {
    return request({
        url: '/projectContract/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 项目合同新增
export function fetchSavePrjContractInfo(data?: any) {
    return request({
        url: '/projectContract/insert.do',
        method: 'POST',
        data,
    });
}

// 项目合同修改
export function fetchUpdatePrjContractInfo(data?: any) {
    return request({
        url: '/projectContract/update.do?proid=' + data[0].pid,
        method: 'PUT',
        data,
    });
}

// 项目合同审核
export function fetchUpdatePrjContractStatusInfo(data?: any) {
    return request({
        url: '/projectContract/updateCheck.do',
        method: 'PUT',
        data,
        header: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });
}

// 项目合同删除
export function fetchDeletePrjContractInfo(id: number | string) {
    return request({
        url: `/projectContract/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}
// 设置合同付款状态（独立接口，不并入合同编辑保存；权限 project:Contract:paystatus:update，口径同 web 端 fetchUpdateContractPaystatus）
export function fetchUpdateContractPaystatus(data: { id: number | string, paystatus: number }) {
    return request({
        url: '/projectContract/updatePaystatus.do',
        method: 'PUT',
        data,
    });
}

// 合同重点设备审核通过（仅待审核合同可调用；权限 project:Contract:audit，口径同 web 端 fetchApproveContractAudit）
export function fetchApproveContractAudit(id: number | string) {
    return request({
        url: '/projectContract/approveAudit.do',
        method: 'PUT',
        data: { id },
    });
}

// 合同设备（大管家数据）分页查询（pids=合同 id，口径同 web 端 fetchContractDeviceList）
export function fetchContractDeviceDataList(data?: any) {
    return request({
        url: '/projectDevice/getPage.do',
        method: 'GET',
        data,
    });
}