/**
 * 主站调度管理 - 公共类型与工具
 * 对应 H5 端 mePages/dispatch 的逻辑
 */

/** 调度子表类型定义（type 对应后端 projectDispatchSub 的 type 字段） */
export const CONTACT_TYPES = [
	{ type: 1, label: '调度联系人', color: '#2f54eb' },
	{ type: 2, label: '对点联系人', color: '#13c2c2' },
	{ type: 3, label: '自动化联系人', color: '#fa8c16' },
	{ type: 4, label: '信通联系人', color: '#722ed1' },
	{ type: 5, label: '网安联系人', color: '#eb2f96' },
	{ type: 6, label: '供电公司联系人', color: '#52c41a' },
	{ type: 0, label: '主站IP', color: '#1890ff' },
	{ type: 7, label: '加密证书', color: '#faad14' },
	{ type: 8, label: '管理证书', color: '#faad14' },
	{ type: 9, label: '网安证书', color: '#faad14' }
];

/** 主表 count 字段名 → 子表 type */
export const COUNT_KEY_OF_TYPE: Record<number, string> = {
	0: 'type0Count',
	1: 'type1Count',
	2: 'type2Count',
	3: 'type3Count',
	4: 'type4Count',
	5: 'type5Count',
	6: 'type6Count',
	7: 'type7Count',
	8: 'type8Count',
	9: 'type9Count'
};

export const SUB_PAGE_SIZE = 100;

/** 根据 type 取子表类型名称 */
export function typeLabel(type: number): string {
	const t = CONTACT_TYPES.find(c => c.type === type);
	return t ? t.label : '';
}

/** 手机号或座机号 */
export const phoneReg = /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8}(-\d{1,6})?)$/;

export function isValidPhone(phone: string): boolean {
	const p = (phone || '').trim();
	if (!p) return false;
	return phoneReg.test(p);
}

/** IP 地址（每段 0-255，可带端口） */
export function isValidIp(ip: string): boolean {
	const m = (ip || '').trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?::\d{1,5})?$/);
	if (!m) return false;
	return [m[1], m[2], m[3], m[4]].every(n => Number(n) >= 0 && Number(n) <= 255);
}

/** 判断当前用户是否为管理员（usertype=0） */
export function isAdmin(): boolean {
	return Number(uni.getStorageSync('usertype')) === 0;
}

/** 当前登录用户 id */
export function currentUserId(): string {
	return String(uni.getStorageSync('userId') ?? '');
}

/**
 * 是否有操作权限：创建人本人 或 管理员
 * row.creater 为空时默认允许
 */
export function canOperate(creater: any): boolean {
	if (creater == null || creater === '') return true;
	return isAdmin() || String(creater) === currentUserId();
}

/** 统一解析子表列表返回（兼容数组 / {list} / {records}） */
export function pickRows(data: any): any[] {
	if (Array.isArray(data)) return data;
	if (data && Array.isArray(data.list)) return data.list;
	if (data && Array.isArray(data.records)) return data.records;
	return [];
}

/** 统一解析总数 */
export function pickTotal(data: any, rows: any[]): number {
	if (Array.isArray(data)) return rows.length;
	if (data && data.total != null) return Number(data.total);
	return rows.length;
}

/** 将子表行映射为统一结构 */
export function mapSubRow(it: any): any {
	return {
		id: it.id,
		name: it.contactPerson || '',
		value: it.contactInformation || '',
		notes: it.notes || '',
		username: it.username || it.creater || '',
		dbtime: it.dbtime || '',
		creater: it.creater
	};
}

/**
 * 解析证书 contactInformation
 * 新格式：JSON {"alias":"别名","url":"下载路径","fileName":"文件名"}
 * 兼容旧格式：url?fileName
 */
export function parseCertValue(v: any): { alias: string; url: string; fileName: string } {
	const out = { alias: '', url: '', fileName: '' };
	const raw = String(v || '').trim();
	if (!raw) return out;
	if (raw.startsWith('{')) {
		try {
			const obj = JSON.parse(raw);
			out.alias = obj.alias || '';
			out.url = obj.url || '';
			out.fileName = obj.fileName || '';
			return out;
		} catch (e) {
			/* 解析失败则回退到旧格式 */
		}
	}
	const idx = raw.indexOf('?');
	if (idx > -1) {
		out.url = raw.slice(0, idx);
		out.fileName = raw.slice(idx + 1);
	} else {
		out.url = raw;
	}
	return out;
}
