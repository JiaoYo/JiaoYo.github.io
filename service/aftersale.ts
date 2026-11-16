// 售后信息
import request from '@/utils/request';
import { getUUID, doSM2Sign, replaceByMap, stringToHex } from "@/utils/index";

// 售后信息查询(客户信息)
export function fetchGetAftersaleCompDataList(data?: any, showLoading = true) {
    return request({
        url: '/aftermarketComp/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading
    });
}

// 售后信息查询详情(客户信息)
export function fetchGetAftersaleCompInfo(id: number) {
    return request({
        url: '/aftermarketComp/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 售后信息新增(客户信息)
export function fetchSaveAftersaleCompInfo(creater: number, data?: any) {
	const timestamp = Date.now();
	const nonce = getUUID();
	const fieldsComp = ['contact', 'contactinfo', 'comp', 'project', 'mtype'];
	let newStr = '',
		signature = '',
		replaceStr = data.map((obj: any) => {
			return fieldsComp.map(field => obj[field] !== null && obj[field] !== undefined ? obj[field] : '').filter(v => v !== '').join('');
		})
	signature = doSM2Sign(nonce + timestamp + replaceStr.join(''));
	newStr = replaceByMap(signature);
    return request({
        url: '/aftermarketComp/insert.do?creater=' + creater,
        method: 'POST',
        data,
		header: {
			'signature': stringToHex(newStr),
			'timestamp': timestamp,
			'nonce': nonce
		},
    });
}

// 售后信息修改(客户信息)
export function fetchUpdateAftersaleCompInfo(data?: any) {
    return request({
        url: '/aftermarketComp/update.do',
        method: 'PUT',
        data,
    });
}

// 售后信息删除(客户信息)
export function fetchDeleteAftersaleCompInfo(id: number | string, pwd: string) {
    return request({
        url: `/aftermarketComp/delete.do?arrIds=${id}&pwd=${pwd}`,
        method: 'DELETE',
    });
}

// 审核售后信息
export function fetchReviewAftersaleInfo(data: any) {
    return request({
        url: '/aftermarketComp/review.do',
        method: 'PUT',
		data,
        header: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });
}

// 查询售后信息(扫码加密信息)
export function fetchGetAftersaleInfoByEncryptedId(data: any) {
    return request({
        url: '/aftermarketComp/selectByEncryptedId.do',
        method: 'GET',
		data: {
			...data,
			_t: new Date().getTime()
		}
    });
}

// 售后信息查询(设备信息)
export function fetchGetAftersaleSnDataList(data?: any, showLoading = true) {
    return request({
        url: '/aftermarket/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading
    });
}

// 售后信息查询详情(设备信息)
export function fetchGetAftersaleSnInfo(id: number) {
    return request({
        url: '/aftermarket/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 售后信息新增(设备信息)
export function fetchSaveAftersaleSnInfo(uid: string, data?: any) {
	const timestamp = Date.now();
	const nonce = getUUID();
	const fields = ['details', 'sn'];
	let newStr = '',
		signature = '',
		replaceStr = data.map((obj: any) => {
			return fields.map(field => obj[field] !== null && obj[field] !== undefined ? obj[field] : '').filter(v => v !== '').join('');
		})
	replaceStr = uid + replaceStr.join('');	
	signature = doSM2Sign(nonce + timestamp + replaceStr);
	newStr = replaceByMap(signature);
    return request({
        url: '/aftermarket/insert.do?uid=' + uid,
        method: 'POST',
        data,
		header: {
			'signature': stringToHex(newStr),
			'timestamp': timestamp,
			'nonce': nonce
		}
    });
}

// 售后信息修改(设备信息)
export function fetchUpdateAftersaleSnInfo(data?: any) {
    return request({
        url: '/aftermarket/update.do',
        method: 'PUT',
        data,
    });
}

// 售后信息删除(设备信息)
export function fetchDeleteAftersaleSnInfo(id: number | string, pwd: string) {
    return request({
        url: `/aftermarket/delete.do?arrIds=${id}&pwd=${pwd}`,
        method: 'DELETE',
    });
}

// 设备分页查询
export function fetchGetAftersaleSnAndDeviceDataList(data?: any, showLoading = true) {
    return request({
        url: '/aftermarket/getSnPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading
    });
}

// 获取客户信息
export function fetchGetCompanyDataList(data?: any, showLoading = false) {
    return request({
        url: '/aftermarket/getProjectPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading
    });
}

// 获取网关型号信息
export function fetchGetInterfaceDataList(data?: any, showLoading = false) {
    return request({
        url: '/aftermarket/getInterfacePage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        },
        header: {},
        showLoading
    });
}

// 网关信息查询
export function fetchGetSnInfoBySn(sn: string) {
	return request({
		url: '/aftermarket/selectBySn.do',
		method: 'GET',
		data: {
			sn,
			_t: new Date().getTime()
		}
	})
}

// 售后原因
export function fetchGetAftersaleReasonDataList(data?: any) {
    return request({
        url: '/aftermarketReason/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 售后原因查询详情
export function fetchGetAftersaleReasonInfo(id: number) {
    return request({
        url: '/aftermarketReason/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 售后原因新增
export function fetchSaveAftersaleReasonInfo(data?: any) {
    return request({
        url: '/aftermarketReason/insert.do',
        method: 'POST',
        data,
    });
}

// 售后原因修改
export function fetchUpdateAftersaleReasonInfo(data?: any) {
    return request({
        url: '/aftermarketReason/update.do',
        method: 'PUT',
        data,
    });
}

// 售后原因删除
export function fetchDeleteAftersaleReasonInfo(id: number | string) {
    return request({
        url: `/aftermarketReason/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}

// 最新版本新增售后信息
export function fetchSaveAftersaleWithSnInfo(data: any) {
	const timestamp = Date.now();
	const nonce = getUUID();
	const fieldsComp = ['contact', 'contactinfo', 'comp', 'project'];
	let newStr = '',
		signature = '',
		replaceStr = [data].map((obj: any) => {
			return fieldsComp.map(field => obj[field] !== null && obj[field] !== undefined ? obj[field] : '').filter(v => v !== '').join('');
		})
	signature = doSM2Sign(nonce + timestamp + replaceStr.join(''));
	newStr = replaceByMap(signature);
    return request({
        url: '/aftermarketComp/insertAmc.do',
        method: 'POST',
        data,
		header: {
			'signature': stringToHex(newStr),
			'timestamp': timestamp,
			'nonce': nonce
		},
    });
}

// 售后中间表查询
export function fetchGetAftersaleMiddleDataList(data?: any) {
    return request({
        url: '/aftermarketMiddle/getPage.do',
        method: 'GET',
        data: {
            ...data,
            _t: new Date().getTime()
        }
    });
}

// 售后中间表查询详情
export function fetchGetAftersaleMiddleInfo(id: number) {
    return request({
        url: '/aftermarketMiddle/getById.do',
        method: 'GET',
        data: {
            id,
            _t: new Date().getTime(),
        },
    });
}

// 售后中间表新增
export function fetchSaveAftersaleMiddleInfo(data?: any) {
    return request({
        url: '/aftermarketMiddle/insert.do',
        method: 'POST',
        data,
    });
}

// 售后中间表修改
export function fetchUpdateAftersaleMiddleInfo(data?: any) {
    return request({
        url: '/aftermarketMiddle/update.do',
        method: 'PUT',
        data,
    });
}

// 售后中间表删除
export function fetchDeleteAftersaleMiddleInfo(id: number | string) {
    return request({
        url: `/aftermarketMiddle/delete.do?arrIds=${id}`,
        method: 'DELETE',
    });
}