import request from '@/utils/request';

/**
 * ==================== WorkBuddy 后台管理（对齐 web workbuddy）====================
 * 专家 source 白名单维护 + 外部客户账户维护，接口前缀 /api/workbuddy-admin；
 * 响应为 { success, data } 结构，app 端 request 直接返回 payload 数组。
 * 新增/停用后即时生效（内存白名单，30s 定时刷新），无需重启服务。
 */

export type WorkbuddyStatus = 'ACTIVE' | 'DISABLED';

/** 专家 source（字段为后端下划线命名，保持原样） */
export interface WorkbuddyConnector {
    /** source 标识，只允许小写字母、数字和连字符；须与专家包 source 一致 */
    source: string;
    /** 市场展示名称 */
    display_name: string;
    status: WorkbuddyStatus;
    allowed_scopes: string;
    created_at: string;
    updated_at: string;
}

/** 外部客户账户（真实手机号属敏感信息，仅详情可能下发，列表为脱敏号码） */
export interface WorkbuddyAccount {
    id: number;
    phone?: string;
    phone_masked: string;
    status: WorkbuddyStatus;
    success_login_count: number;
    failed_login_count: number;
    sms_send_count: number;
    last_login_at: string | null;
    last_sms_at: string | null;
    last_login_ip: string | null;
}

// ==================== 专家 source ====================

/** 查询全部专家 source（响应为 { success, data: [...] } 包装，解包 data） */
export async function fetchGetWorkbuddyConnectors(): Promise<WorkbuddyConnector[]> {
    const raw: any = await request({
        url: '/api/workbuddy-admin/connectors',
        method: 'get',
        data: undefined
    });
    return Array.isArray(raw) ? raw : raw?.data ?? [];
}

/** 新增 source */
export function fetchSaveWorkbuddyConnector(data: {
    source: string;
    display_name: string;
    status: WorkbuddyStatus;
    allowed_scopes: string;
}) {
    return request({
        url: '/api/workbuddy-admin/connectors',
        method: 'post',
        data
    });
}

/** 修改 source（source 本身不可改） */
export function fetchUpdateWorkbuddyConnector(
    source: string,
    data: {
        display_name: string;
        status: WorkbuddyStatus;
        allowed_scopes: string;
    }
) {
    return request({
        url: `/api/workbuddy-admin/connectors/${encodeURIComponent(source)}`,
        method: 'put',
        data
    });
}

/** 启用/停用 source；停用后新 OAuth 注册、新授权被拒绝，已签发 token 默认继续到期 */
export function fetchSetWorkbuddyConnectorStatus(source: string, status: WorkbuddyStatus) {
    return request({
        url: `/api/workbuddy-admin/connectors/${encodeURIComponent(source)}/status`,
        method: 'put',
        data: { status }
    });
}

// ==================== 外部客户账户 ====================

/** 查询客户账户列表，可按手机号过滤（响应为 { success, data } 包装，data 可能是数组或分页结构 { items }） */
export async function fetchGetWorkbuddyAccounts(phone?: string): Promise<WorkbuddyAccount[]> {
    const raw: any = await request({
        url: '/api/workbuddy-admin/accounts',
        method: 'get',
        params: phone ? { phone } : undefined
    });
    const payload = Array.isArray(raw) ? raw : raw?.data ?? raw;
    return Array.isArray(payload) ? payload : payload?.items ?? [];
}

/** 查询单个客户账户（响应为 { success, data } 包装，解包 data） */
export async function fetchGetWorkbuddyAccount(id: number): Promise<WorkbuddyAccount> {
    const raw: any = await request({
        url: `/api/workbuddy-admin/accounts/${id}`,
        method: 'get',
        data: undefined
    });
    return raw?.data ?? raw;
}

/** 禁用/启用客户账户 */
export function fetchSetWorkbuddyAccountStatus(id: number, status: WorkbuddyStatus) {
    return request({
        url: `/api/workbuddy-admin/accounts/${id}/status`,
        method: 'put',
        data: { status }
    });
}
