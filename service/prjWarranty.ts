// 项目质保
import request from '@/utils/request';

// 修改质保时间
export function fetchUpdatePrjWarranty(data?: any) {
    return request({
        url: '/projectInfo/updateWarranty.do',
        method: 'GET',
        data,
    });
}
