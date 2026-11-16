import request from '@/utils/request';

/**
 * 研发首页查询
 */
export function fetchDevHomeData(params?: object) {
    return request({
        url: '/systemConf/RdHomePage.do',
        method: 'get',
        data:params
    });
}

/**
 * 查询个人近期任务
 */
export function fetchUserTask() {
    return request({
        url: '/systemConf/RdRecentTask.do',
        method: 'GET',
    })
} 

/**
 * 研发阻断级为确认需求
 */
export function fetchDevBlockConfirm(params?: object) {
    return request({
        url: '/systemConf/RdHomePageUrgent.do',
        method: 'get',
        data:params
    });
}
/**
 * 研发延期任务
 */
export function fetchDevDelayTask(params?: object) {
    return request({
        url: '/systemConf/RdHomePageDelay.do',
        method: 'get',
        data:params
    });
}
/**
 * 公告查询
 */
export function fetchNotice() {
    return request({
        url: '/systemConf/getNotice.do',
        method: 'get',
    });
}