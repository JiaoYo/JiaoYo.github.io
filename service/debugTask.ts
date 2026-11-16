// 调试任务模板 / 细分任务记录 / 设备可选调试业务（与 web 端共用后端接口）
import request from '@/utils/request';

// 调试任务模板分页查询（pid 为调试类型/权重 ID，fuzzy 同时匹配任务名称、备注和调试类型名称）
export function fetchGetDebugTaskTemplatePage(data: any) {
    return request({
        url: '/projectDebugTask/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 调试任务模板详情（记录不存在时 data 为 null）
export function fetchGetDebugTaskTemplateInfo(id: number | string) {
    return request({
        url: '/projectDebugTask/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 调试任务模板新增（数组，最多 100 条；同一调试类型下任务名称唯一）
export function fetchSaveDebugTaskTemplateInfo(data?: any) {
    return request({
        url: '/projectDebugTask/insert.do',
        method: 'POST',
        data,
    });
}

// 调试任务模板修改（每项必须含 id；weight 不传表示不修改）
export function fetchUpdateDebugTaskTemplateInfo(data?: any) {
    return request({
        url: '/projectDebugTask/update.do',
        method: 'PUT',
        data,
    });
}

// 调试任务模板删除
export function fetchDeleteDebugTaskTemplateInfo(id: number | string) {
    return request({
        url: `/projectDebugTask/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

// 细分任务记录分页查询（debugId 为所属调试业务 ID，limit 最大 100）
export function fetchGetDebugTaskRecordPage(data: any) {
    return request({
        url: '/projectDebugTaskRecord/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 新增待执行任务（仅允许给尚未开始的调试业务追加）
export function fetchSaveDebugTaskRecordInfo(data?: any) {
    return request({
        url: '/projectDebugTaskRecord/insert.do',
        method: 'POST',
        data,
    });
}

// 修改任务负责人（只允许修改待执行任务的 operator）
export function fetchUpdateDebugTaskRecordInfo(data?: any) {
    return request({
        url: '/projectDebugTaskRecord/update.do',
        method: 'PUT',
        data,
    });
}

// 删除待执行任务（每个调试业务至少保留一条任务）
export function fetchDeleteDebugTaskRecordInfo(id: number | string) {
    return request({
        url: `/projectDebugTaskRecord/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

// 开始任务（要求所属调试业务已开始且当前登录人是任务负责人）
export function fetchStartDebugTaskRecord(id: number | string) {
    return request({
        url: `/projectDebugTaskRecord/start.do?id=${id}`,
        method: 'PUT',
    });
}

// 完成任务（只允许 1 → 2，完成时间和操作人由后端写入）
export function fetchCompleteDebugTaskRecord(id: number | string) {
    return request({
        url: `/projectDebugTaskRecord/complete.do?id=${id}`,
        method: 'PUT',
    });
}

// 查询任务操作日志（action：CREATE / START / COMPLETE）
export function fetchGetDebugTaskRecordLogs(recordId: number | string) {
    return request({
        url: `/projectDebugTaskRecord/getLogs.do?recordId=${recordId}`,
        method: 'GET',
    });
}

// 选择调试设备后加载该设备可选的调试业务和任务（设备 → 物料绑定 → 调试类型 → 任务模板）
export function fetchGetBusinessOptionsByEquipmentIds(equipmentIds: Array<number | string>) {
    return request({
        url: `/projectDebug/getBusinessOptionsByEquipmentIds.do?equipmentIds=${equipmentIds.join(',')}`,
        method: 'GET',
    });
}

// 原子保存设备、调试业务和所选任务（任意校验失败整体回滚；data 为已创建的调试业务列表）
export function fetchSaveBusinessWithTasks(data?: any) {
    return request({
        url: '/projectDebug/saveBusinessWithTasks.do',
        method: 'POST',
        data,
    });
}
