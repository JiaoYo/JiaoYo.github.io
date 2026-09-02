import request from '@/utils/request';

// 获取菜单权限
export function fetchGetSystemMenuInfo() {
    return request({
        url: '/sys/menu/nav.do',
        method: 'GET',
        data: {
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    });
}

// 获取是否开启验证码
export function fetchGetCaptchaInfo() {
    return request({
        url: '/captchaEanble.do',
        method: 'GET',
        data: {
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    });
}

// 获取验证码
export function fetchGetCaptchaImageInfo(uuid: string) {
    return request({
        url: '/captcha',
        method: 'GET',
        data: {
            uuid,
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    });
}

// 获取系统配置
export function fetchGetSystemconfigInfo() {
    return request({
        url: '/systemConf/select.do',
        method: 'GET',
        data: {
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    });
}

// 更新系统配置
export function fetchSaveSystemConfigInfo(data: any) {
    return request({
        url: '/systemConf/update.do',
        method: 'POST',
        data
    });
}

// 获取首页项目合同数据源
export function fetchGetSystemHomePageInfo(s?: any) {
    return request({
        url: '/systemConf/selectHomePage.do',
        method: 'GET',
        data: {
            ...s,
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    });
}

// 获取首页调试数据源
export function fetchGetDebugHomePageInfo(s?: any) {
    return request({
        url: '/projectDebug/selectHomePage.do',
        method: 'GET',
        data: {
            ...s,
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    })
}

// 获取首页最近项目
export function fetchGetPrjHomePageInfo(data: any) {
    return request({
        url: '/projectInfo/getRecentPage.do',
        method: 'GET',
        data: data
    })
}

// 获取七牛云的TOKEN
export function fetchGetUploadFileTokenInfo(data?: any) {
    return request({
        url: '/projectFile/getToken.do',
        method: 'POST',
        data,
        header: {},
        showLoading: false
    });
}

// 获取系统项目权重
export function fetchGetSystemProjectInfo() {
    return request({
        url: '/systemConf/selectDailyNorms.do',
        method: 'GET',
        data: {
            _t: new Date().getTime()
        },
        header: {},
        showLoading: false
    })
}

// 获取系统项目权重
export function fetchUpdateSystemProjectInfo(data: any) {
    return request({
        url: '/systemConf/updateDailyNorms.do',
        method: 'POST',
        data
    })
}

// 日常行为规范报表
export function fetchGetDailyweeksummaryInfo(data: any) {
    return request({
        url: '/report/selectDailyReport.do',
        method: 'GET',
        data
    })
}

// 项目报表
export function fetchGetPrjReportInfo(data: any) {
    return request({
        url: '/report/selectProject.do',
        method: 'GET',
        data
    })
}