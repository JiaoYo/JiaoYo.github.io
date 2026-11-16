// 人员日报统计（与 web 端共用后端接口；明细列表复用 projectdailyreport 的 getPage.do）
import request from '@/utils/request';

// 人员日报统计：periodType YEAR/MONTH/WEEK，period 年 yyyy / 月 yyyy-MM / 周 yyyy-Www（ISO 自然周）；
// 分页只作用于 people，summary 与 trend 始终基于全部命中数据；需 norms:report 权限
export function fetchGetPersonDailyStatistics(data: any) {
    return request({
        url: '/projectDailyReport/getPersonStatistics.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime(),
        },
    });
}
