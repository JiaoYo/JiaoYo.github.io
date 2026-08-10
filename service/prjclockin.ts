// 项目打卡
import request from '@/utils/request';

// 项目打卡查询
export function fetchGetPrjClockinDataList(data?: any) {
    return request({
        url: '/projectClockin/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 项目打卡查询详情
export function fetchGetPrjClockinInfo(id: number | string) {
    return request({
        url: '/projectClockin/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 校验打卡
export function fetchCheckPrjClockinInfo(data?: any) {
    return request({
        url: '/projectClockin/checkClockin.do',
        method: 'POST',
        data,
        header: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        showLoading: false
    });
}

// 项目打卡新增
export function fetchSavePrjClockinInfo(data?: any) {
    return request({
        url: data.hasOwnProperty('status') ? '/projectClockin/insert.do?check=' + data.check + '&status=' + data.status : '/projectClockin/insert.do?check=' + data.check,
        method: 'POST',
        data: data.list,
        header: {},
        showLoading: data.list[0].hasOwnProperty('ctype') ? false : true
    });
}

// 项目打卡上一次的记录
export function fetchGetPrjClockinLastInfo(data?: any) {
    return request({
        url: '/projectClockin/getLastClockin.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
        header: {},
        showLoading: false
    });
}

// 项目打卡报表查询
export function fetchGetPrjClockinRecordInfo(data?: any) {
    return request({
        url: '/projectClockin/getReport.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}

// 项目人员轨迹查询
export function fetchGetTrajectoryInfo(data: any) {
    return request({
        url: '/projectClockin/getTrajectory.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    })
}

// 项目人员实时轨迹
export function fetchGetRealtimeTrajectoryInfo() {
    return request({
        url: '/systemConf/RealTimeTrajectory.do',
        method: 'GET',
        data: {
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    })
}

// 项目人员实时轨迹详情
export function fetchGetRealtimeTrajectoryDetailInfo(data: any) {
    return request({
        url: '/systemConf/RealTimeTrajectoryDetails.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    })
}

// 项目人员历史轨迹
export function fetchGetHistoryTrajectoryDataList(data: any) {
    return request({
        url: '/systemConf/HistoryTrajectory.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    })
}

// 获取系统上报打卡的数据
export function fetchGetSystemReportDataList(data: any) {
    return request({
        url: '/projectClockin/getReportSystem.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    })
}