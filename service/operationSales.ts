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

/**
 * ==================== 运营—销售统一线索 /operation ====================
 * 统一线索池：来源（origin_type）与归属（负责人）分离；
 * created_by / origin_user_id 创建后不变，current_owner_user_id 仅在交接被接收后改变；
 * pending_receiver_user_id 为等待接收的人，不代表已归属。
 * 人员类型：0 超管 / 1 销售 / 12 运营；查询结果字段 snake_case，请求字段 camelCase。
 */

/**
 * 展会分页列表（按开始日期、ID 倒序，已取消展会不在列表中）
 * 返回分页对象 { total, pageNum, pageSize, list }
 */
export function fetchExhibitionList(params?: { pageNum?: number; pageSize?: number }) {
    return request({
        url: `/operation/exhibition/list.do${buildQueryParams(params || {})}`,
        method: 'get',
        data: undefined
    });
}

/** 展会详情，members 为参展人列表（user_id/username） */
export function fetchExhibitionDetail(id: number | string) {
    return request({
        url: `/operation/exhibition/detail.do${buildQueryParams({ id })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 新建展会及多名参展员工
 * data: { exhibitionName 必填, startDate 必填 yyyy-MM-dd, endDate?, location?, remark?, memberUserIds: number[] 必填 }
 */
export function fetchExhibitionCreate(data: any) {
    return request({
        url: '/operation/exhibition/create.do',
        method: 'POST',
        data
    });
}

/**
 * 修改展会（仅 ACTIVE 可改）；memberUserIds 传入时为完整新名单且至少一人，
 * 已被线索引用的参展人不能移除（后端拒绝）
 */
export function fetchExhibitionUpdate(data: any) {
    return request({
        url: '/operation/exhibition/update.do',
        method: 'POST',
        data
    });
}

/** 取消展会（软删除）：列表不再显示，不能再为该展会新建线索 */
export function fetchExhibitionDelete(id: number | string) {
    return request({
        url: '/operation/exhibition/delete.do',
        method: 'POST',
        data: { id }
    });
}

/**
 * 新建线索
 * data: { originType, channelCode?, sourceRemark?, originUserId?, desiredOwnerUserId?,
 *         exhibitionId?, exhibitionMemberUserId?, customerName 必填, contactName?, contactPhone?,
 *         contactWechat?, consultationContent?, oldCustomer?, wechatAdded?, occurredAt? }
 */
export function fetchLeadCreate(data: any) {
    return request({
        url: '/operation/lead/create.do',
        method: 'POST',
        data
    });
}

/**
 * 线索分页列表
 * params: { pageNum, pageSize, scope: MINE/PENDING_FOR_ME/OWNED_BY_ME/ALL,
 *           originType?, processStatus?, outcomeStatus?, keyword?,
 *           year?, month?, handoffUserId?, receiverUserId? }
 * 发生时间（与 web operationSales/lead 查询一致）：不传 year 表示不限时间；
 * 只传 year = 全年；year + month（1-12 数字）= 指定年月。
 * handoffUserId = 交接人（创建人）筛选，receiverUserId = 当前负责人（销售）筛选。
 * 刻意不返回联系方式，列表仅展示非联系信息
 */
export function fetchLeadPage(params: any) {
    return request({
        url: `/operation/lead/list.do${buildQueryParams(params)}`,
        method: 'get',
        data: undefined
    });
}

/** 线索详情：根对象为线索完整资料，另含 handoffs[]、followups[] 全量时间线 */
export function fetchLeadDetail(id: number | string) {
    return request({
        url: `/operation/lead/detail.do${buildQueryParams({ id })}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 修改线索：完整资料更新而非局部 PATCH——编辑前必须先取详情回填全部字段再提交。
 * 已结束（FINISHED）线索不能修改；来源类型、展会关联、人员归属、状态不可改。
 */
export function fetchLeadUpdate(data: any) {
    return request({
        url: '/operation/lead/update.do',
        method: 'POST',
        data
    });
}

/**
 * 删除线索（软删除）：权限与修改相同；存在待接收交接时须先处理交接再删除
 */
export function fetchLeadDelete(id: number | string) {
    return request({
        url: '/operation/lead/delete.do',
        method: 'POST',
        data: { id }
    });
}

/** 发起交接：只有当前负责人可发起，data: { leadId, receiverUserId, remark? } */
export function fetchHandoffCreate(data: { leadId: number; receiverUserId: number; remark?: string }) {
    return request({
        url: '/operation/lead/handoff/create.do',
        method: 'POST',
        data
    });
}

/** 接收交接：只有待接收人可操作，data: { handoffId, remark? } */
export function fetchHandoffAccept(data: { handoffId: number; remark?: string }) {
    return request({
        url: '/operation/lead/handoff/accept.do',
        method: 'POST',
        data
    });
}

/** 拒绝交接：只有待接收人可操作，负责人不变并恢复原流程状态 */
export function fetchHandoffReject(data: { handoffId: number; remark?: string }) {
    return request({
        url: '/operation/lead/handoff/reject.do',
        method: 'POST',
        data
    });
}

/** 取消交接：只有发起人可取消仍为 PENDING 的交接 */
export function fetchHandoffCancel(data: { handoffId: number; remark?: string }) {
    return request({
        url: '/operation/lead/handoff/cancel.do',
        method: 'POST',
        data
    });
}

/**
 * 新增跟进：只有当前负责人（销售/超管）可添加，每次跟进新增记录不覆盖
 * data: { leadId, followupType?, content 必填, nextFollowupAt?, outcomeStatus? }
 * 终结结果（INVALID/DEAL/CLOSED_OTHER）会把流程置为 FINISHED
 */
export function fetchFollowupCreate(data: any) {
    return request({
        url: '/operation/lead/followup/create.do',
        method: 'POST',
        data
    });
}

/**
 * 未读交接通知列表（登录/重连兜底拉取）：返回分页对象 { total, list }，list 项 snake_case
 * （id、handoff_id、lead_id、receiver_user_id），仅销售/运营有数据
 */
export function fetchLeadNotificationUnread() {
    return request({
        url: '/operation/lead/notification/unread.do',
        method: 'get',
        data: undefined
    });
}

/**
 * 标记交接通知已读：仅接收人本人、显式已读动作（点击推送跳转）时调用，收到 WS 推送绝不调用
 * data: { id 必填，通知 id }
 */
export function fetchLeadNotificationRead(id: number | string) {
    return request({
        url: '/operation/lead/notification/read.do',
        method: 'POST',
        data: { id }
    });
}

/**
 * 疑似重复线索列表（2026-10-14）：仅返回 duplicate_status = SUSPECTED 的线索，返回字段全为 string；
 * 不含 process_status/outcome_status/contract_no，匹配候选在审核时经线索详情 duplicate_matches 获取
 * 返回分页对象 { total, list }
 */
export function fetchLeadDuplicateList(params?: { pageNum?: number; pageSize?: number }) {
    return request({
        url: `/operation/lead/duplicate/list.do${buildQueryParams(params || {})}`,
        method: 'get',
        data: undefined
    });
}

/**
 * 疑似重复人工审核：确认重复（duplicate=true）必须传 targetLeadId，该疑似记录随后软删除；
 * 确认非重复后状态改为 CONFIRMED_UNIQUE 恢复正常统计；成功后需同步刷新普通列表与报表
 * data: { leadId, duplicate, targetLeadId?, remark? }
 */
export function fetchLeadDuplicateReview(data: { leadId: number; duplicate: boolean; targetLeadId?: number; remark?: string }) {
    return request({
        url: '/operation/lead/duplicate/review.do',
        method: 'POST',
        data
    });
}

/**
 * 一键成交（2026-10-14）：合同号去空格必填且不超过 100 字符，必须存在于 tb_project_contract.contractnum；
 * 成功后保存 contract_no、outcome=DEAL、process=FINISHED；同线索同合同号重复提交按成功处理
 * data: { leadId, contractNumber }
 */
export function fetchLeadConfirmDeal(data: { leadId: number; contractNumber: string }) {
    return request({
        url: '/operation/lead/deal.do',
        method: 'POST',
        data
    });
}
