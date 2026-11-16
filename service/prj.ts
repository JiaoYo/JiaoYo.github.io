// 项目信息
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

// 项目信息查询
export function fetchGetPrjDataList(data?: any, showLoading = true) {
    return request({
        url: '/projectInfo/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading
    });
}

// 查询新增的uuid信息
/**
 * 补齐项目财务和出差数据（对齐 web fetchRepairFinanceTrip）
 * 选择项目后执行补齐，系统按项目ID重新补全该项目的财务和出差数据
 */
export function fetchRepairFinanceTrip(params: { id: number }) {
    return request({
        url: `/projectInfo/repairFinanceTrip.do?id=${params.id}`,
        method: 'post',
        data: undefined
    });
}

export function fetchGetPrjIdByuuid(uuid: string) {
    return request({
        url: '/projectInfo/getByUuid.do',
        method: 'GET',
        data: {
            uuid,
            _t: new Date().getTime()
        }
    })
}

// 项目信息查询详情
export function fetchGetPrjInfo(id: number) {
    return request({
        url: '/projectInfo/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}
// 暂停 恢复项目
export function fetchPauseProject(id: number, pause: number, pauserea: string) {
  return request({
    url: `/projectInfo/updatePause.do?id=${id}&pause=${pause}&pauserea=${encodeURIComponent(pauserea)}`,
    method: 'put'
  });
}
// 项目信息新增
export function fetchSavePrjInfo(data?: any) {
    return request({
        url: '/projectInfo/insert.do',
        method: 'POST',
        data,
    });
}

// 项目信息修改
export function fetchUpdatePrjInfo(data?: any) {
    return request({
        url: '/projectInfo/update.do',
        method: 'PUT',
        data,
    });
}

// 项目信息删除
export function fetchDeletePrjInfo(id: number | string) {
    return request({
        url: `/projectInfo/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

// 获取项目关联合同
export function fetchGetContractsPageByPrjId(data?: any) {
    return request({
        url: '/projectInfo/getContractsPage.do',
        method: 'GET',
        data
    })
}

// 查询项目合同设备出库信息
export function fetchGetContractsDevicesPageByPrjId(data?: any) {
    return request({
        url: '/projectEquipment/getOutInventoryById.do',
        method: 'GET',
        data
    })
}


/**
 * 项目出差记录
 */
export function fetchprojectTripRecord(params: {pid: string | number,page: string | number,limit: string | number}) {
    return request({
        url: `/projectTraver/getPage.do?pid=${params.pid}&page=${params.page}&limit=${params.limit}`,
        method: 'GET',
    })
}

/**
 * 新增项目出差记录
 */
export function fetchAddprojectTripRecord(data: any,pid:any) {
    return request({
        url: `/projectTraver/insert.do?pid=${pid}`,
        method: 'POST',
        data
    })
}
/**
 * 编辑项目出差记录
 */
export function fetchEditprojectTripRecord(data: any,pid:any) {
    return request({
        url: `/projectTraver/update.do?pid=${pid}`,
        method: 'PUT',
        data
    })
}
/**
 * 删除项目出差记录
 */
export function fetchDeleteprojectTripRecord(params: {arrIds: string | number,pid: string | number}) {
    return request({
        url: `/projectTraver/delete.do?arrIds=${params.arrIds}&pid=${params.pid}`,
        method: 'delete',
    })
}
/**
 * 出差同步模式查询（0 自动同步 / 1 人工接管，口径同 web 端 fetchTraverSyncMode）
 */
export function fetchTraverSyncMode(params: {pid: string | number,traveler: string | number}) {
    return request({
        url: `/projectTraver/getSyncMode.do?pid=${params.pid}&traveler=${params.traveler}`,
        method: 'GET',
    })
}

/**
 * 恢复打卡自动同步（替换性操作：删除该出差人现有人工+自动记录并按打卡重建，口径同 web 端 fetchTraverRestoreAutoSync）
 */
export function fetchTraverRestoreAutoSync(params: {pid: string | number,traveler: string | number}) {
    return request({
        url: `/projectTraver/restoreAutoSync.do?pid=${params.pid}&traveler=${params.traveler}`,
        method: 'POST',
    })
}



/**
 * 查询项目出差人工时
 */
export function fetchprojectTripHour(params: {pid:any}) {
    return request({
        url: `/projectTrip/getTripByPid.do?pid=${params.pid}`,
        method: 'GET',
    })
}
// 网安产品
export function fetchGetNetworkSecurityProductDataListByPage(params: {page: number, limit: number, fuzzy?: string}) {
    return request<any>({
        url: `/networkSecurityProduct/getPage.do?` + (params.fuzzy ? `fuzzy=${params.fuzzy}` : ''),
        method: 'get',
    });
}
// 网安加固记录
export function fetchGetNetworkSecurityHardeningRecordDataListByPage(params: {page: number, limit: number, pid: string | number, fuzzy?: string}) {
    return request<any>({
        url: `/networkSecurityHardeningRecord/getPage.do?pid=${params.pid}&page=${params.page}&limit=${params.limit}` + (params.fuzzy ? `&fuzzy=${params.fuzzy}` : ''),
        method: 'get',
    });
}


/**
 * 查询合同列表
 */
export function fetchGetContractInfoList(params: {page: number, limit: number,contractnum?:string, fuzzy?: string,startTime?:string,endTime?:string}) {
    return request({
        url: `/projectContract/getPage.do${buildQueryParams(params)}`,
        method: 'GET',
    })
}
/**
 *查询合同项目绑定
 */
export function fetchGetPrjByContractInfo(params: {page: number, limit: number,conid?:string}) {
    return request({
        url: `/projectContractCorrelation/getPage.do${buildQueryParams(params)}`,
        method: 'GET',
    })
}
/**
 * 查询合同下设备
 */
export function fetchGetContractInfoDevice(params: {page: number, limit: number,pids?:string}) {
    return request({
        url: `/projectDevice/getPage.do${buildQueryParams(params)}`,
        method: 'GET',
    })
}


/**
 * 查询项目排班
 */
export function fetchprojectScheduling(params: any) {
    return request({
        url: `/systemConf/projectScheduling.do${buildQueryParams(params)}`,
        method: 'GET',
    })
}

/**
 * 项目负责人修改计划完成日期（cpdbtime，yyyy-MM-dd）
 * 仅 usertype=2（超管放行）可调用；日期必须晚于项目开始日；后端同时更新 period
 */
export function fetchUpdatePlannedEnd(params: { id: number; cpdbtime: string }) {
    return request({
        url: `/projectInfo/updatePlannedEnd.do${buildQueryParams(params)}`,
        method: 'PUT'
    })
}

/**
 * 工期变更记录（按最新在前排序）
 * 记录包含修改前后日期、周期、来源、操作人和修改时间；沿用 project:Info:select 权限
 */
export function fetchGetScheduleChanges(params: { id: number }) {
    return request({
        url: `/projectInfo/getScheduleChanges.do${buildQueryParams(params)}`,
        method: 'GET',
    })
}

// ---------------- 项目启动 / 启动确认单（对齐 web projectStartConfirm 模块与 startPrecheck） ----------------

/** 启动预检：前端必须以返回的 canStart 为准（勿按 dtype 本地推断） */
export function fetchStartPrecheck(id: number | string) {
    return request({
        url: `/projectInfo/startPrecheck.do${buildQueryParams({ id, _t: new Date().getTime() })}`,
        method: 'GET',
    });
}

/** 启动项目（后端 @RequestParam 接参，POST 拼 URL） */
export function fetchStartProject(id: number | string) {
    return request({
        url: `/projectInfo/start.do?id=${id}&_t=${new Date().getTime()}`,
        method: 'POST',
    });
}

/** 确认单库可选事项（仅启用项由后端过滤；允许人员类型 0/1/2） */
export function fetchStartConfirmLibraryOptions() {
    return request({
        url: '/projectStartConfirm/libraryOptions.do',
        method: 'GET',
        data: { _t: new Date().getTime() },
    });
}

/** 查询项目确认单（未生成时 data 为空） */
export function fetchStartConfirmGetByProject(projectId: number | string) {
    return request({
        url: `/projectStartConfirm/getByProject.do${buildQueryParams({ projectId, _t: new Date().getTime() })}`,
        method: 'GET',
    });
}

/** 生成或覆盖确认单草稿（同一项目仅一张；已有草稿时整体替换明细） */
export function fetchStartConfirmGenerate(data: { projectId: number; libraryItemIds: number[]; notes?: string }) {
    return request({
        url: '/projectStartConfirm/generate.do',
        method: 'POST',
        data,
    });
}

/** 确认确认单（确认人取当前登录用户；重复确认幂等成功；@RequestParam 拼 URL） */
export function fetchStartConfirmConfirm(projectId: number | string) {
    return request({
        url: `/projectStartConfirm/confirm.do?projectId=${projectId}&_t=${new Date().getTime()}`,
        method: 'POST',
    });
}
