/**
 * =========================
 * 研发产品缺陷 常量定义（自主站 rddefect 模块移植，多人责任人模型）
 * =========================
 */

// 缺陷来源 0:首次调试 1:内部使用 2:运行后出现 3:客户反馈 4:运维发现 5:其他
export const defectSourceMap: Record<number, string> = {
    0: '首次调试',
    1: '内部使用',
    2: '运行后出现',
    3: '客户反馈',
    4: '运维发现',
    5: '其他'
};
export const defectSourceOptions = Object.keys(defectSourceMap).map(key => ({
    label: defectSourceMap[Number(key)],
    value: Number(key)
}));

// 影响程度 0:流程中断 1:数据错误 2:体验问题 3:显示问题
export const defectSeverityMap: Record<number, string> = {
    0: '流程中断',
    1: '数据错误',
    2: '体验问题',
    3: '显示问题'
};
export const defectSeverityOptions = Object.keys(defectSeverityMap).map(key => ({
    label: defectSeverityMap[Number(key)],
    value: Number(key)
}));
// 影响程度颜色
export const defectSeverityColorMap: Record<number, string> = {
    0: '#f5222d',
    1: '#f5222d',
    2: '#fa8c16',
    3: '#1677ff'
};

// 优先级 0紧急 1高 2中 3低
export const defectPriorityMap: Record<number, string> = {
    0: '紧急',
    1: '高',
    2: '中',
    3: '低'
};
export const defectPriorityOptions = Object.keys(defectPriorityMap).map(key => ({
    label: defectPriorityMap[Number(key)],
    value: Number(key)
}));
// 优先级颜色
export const defectPriorityColorMap: Record<number, string> = {
    0: '#f5222d',
    1: '#fa8c16',
    2: '#1677ff',
    3: '#909399'
};

// 主状态 0待指派 1待确认 2处理中 3待测试 4拒绝 5测试验证 6缺陷提出人验证 7负责人验证 8关闭
export const defectStatusMap: Record<number, string> = {
    0: '待指派',
    1: '待确认',
    2: '处理中',
    3: '待测试',
    4: '拒绝',
    5: '测试验证',
    6: '缺陷提出人验证',
    7: '负责人验证',
    8: '关闭'
};
export const defectStatusOptions = Object.keys(defectStatusMap).map(key => ({
    label: defectStatusMap[Number(key)],
    value: Number(key)
}));
// 状态颜色
export const defectStatusColorMap: Record<number, string> = {
    0: '#fa8c16', // 待指派
    1: '#fa8c16', // 待确认
    2: '#1677ff', // 处理中
    3: '#1677ff', // 待测试
    4: '#f5222d', // 拒绝
    5: '#1677ff', // 测试验证
    6: '#1677ff', // 缺陷提出人验证
    7: '#1677ff', // 负责人验证
    8: '#52c41a'  // 关闭
};

// 责任人状态 0待确认 1处理中 2已完成 3拒绝 4取消
export const defectAssigneeStatusMap: Record<number, string> = {
    0: '待确认',
    1: '处理中',
    2: '已完成',
    3: '拒绝',
    4: '取消'
};
// 责任人状态颜色
export const defectAssigneeStatusColorMap: Record<number, string> = {
    0: '#fa8c16', // 待确认
    1: '#1677ff', // 处理中
    2: '#52c41a', // 已完成
    3: '#f5222d', // 拒绝
    4: '#909399'  // 取消
};

// 责任人指派方式 0管理员指派 1主动认领 2转派 3协助处理
export const defectAssignTypeMap: Record<number, string> = {
    0: '管理员指派',
    1: '主动认领',
    2: '转派',
    3: '协助处理'
};

// 操作日志动作（tb_rd_defect_log.action）：0~19 流程动作，20~21 记录类，22~29 暂停/恢复与提出人系列
export const defectLogActionMap: Record<number, string> = {
    0: '创建',
    1: '指派',
    2: '认领',
    3: '确认',
    4: '拒绝',
    5: '开始',
    6: '完成',
    7: '提交测试',
    8: '测试通过',
    9: '测试不通过',
    10: '提出人通过',
    11: '提出人不通过',
    12: '负责人通过',
    13: '负责人不通过',
    14: '关闭',
    15: '重开',
    16: '取消',
    17: '转派',
    18: '修改',
    19: '协助',
    20: '反馈信息',
    21: '缺陷报告',
    22: '申请暂停',
    23: '同意暂停',
    24: '拒绝暂停',
    25: '申请恢复',
    26: '恢复',
    27: '拒绝恢复',
    28: '修改提出人',
    29: '一键暂停'
};

// ------------------------------------------------------------------
// 暂停状态（pauseStatus，与主状态 0~8 分离，暂停/恢复均不改写原 status）
// 0 正常、1 暂停待审核、2 已暂停、3 恢复待审核；
// pauseStatus=2/3 时流程写操作后端拒绝，纯反馈与暂停恢复申请仍允许
// ------------------------------------------------------------------
export const defectPauseStatusMap: Record<number, string> = {
    0: '正常',
    1: '暂停待审核',
    2: '已暂停',
    3: '恢复待审核'
};
// 暂停状态颜色：正常不展示，1/3 待审核橙色，2 已暂停红色（流程冻结）
export const defectPauseStatusColorMap: Record<number, string> = {
    0: '#52c41a',
    1: '#fa8c16',
    2: '#f5222d',
    3: '#fa8c16'
};
/** 暂停状态是否冻结流程写操作（2 已暂停 / 3 恢复待审核） */
export const isDefectPaused = (row: any): boolean => [2, 3].includes(Number(row?.pauseStatus));

// 恢复方式（resumeMode）
export const defectResumeModeMap: Record<number, string> = {
    0: '恢复申请审核通过',
    1: '负责人一键恢复',
    2: '责任人一键恢复',
    3: '负责人关闭结束暂停'
};

// 测试用例类型 0正常 1异常 2边界 3权限安全 4兼容 5性能 6接口API 7回归
export const defectCaseTypeMap: Record<number, string> = {
    0: '正常',
    1: '异常',
    2: '边界',
    3: '权限安全',
    4: '兼容',
    5: '性能',
    6: '接口API',
    7: '回归'
};

// 测试用例优先级 0紧急 1高 2中 3低
export const defectCasePriorityMap: Record<number, string> = {
    0: '紧急',
    1: '高',
    2: '中',
    3: '低'
};

export interface DefectTimelineItem {
    label: string;
    time: string;
    type: 'success' | 'error' | 'info' | 'default';
    /** 尾节点「下一步」待办提示（非日志事实）：虚线样式，仅未关闭缺陷追加 */
    pending?: boolean;
}

/**
 * 富文本空值判断（编辑必填校验与提交归一用，口径同详情 rich-or-plain 展示组件）：
 * 纯文本 trim 判空；HTML 剥标签后无文字且无 img/video/iframe/table（WangEditor 空内容为 "<p><br></p>"）视为空
 */
export function isRichEmpty(v: any): boolean {
    const s = String(v ?? '');
    if (!s.trim()) return true;
    if (!s.includes('<')) return false;
    const text = s.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
    return !text && !/<img|<video|<iframe|<table/i.test(s);
}

// 时间线节点颜色
export const defectTimelineColorMap: Record<DefectTimelineItem['type'], string> = {
    success: '#52c41a',
    error: '#f5222d',
    info: '#1677ff',
    default: '#d9d9d9'
};

// 人名解析：行/责任人记录上的 *Name 字段优先，其次按用户 ID 查 userMap
function whoOf(id: any, name: any, userMap?: Record<string, string>): string {
    return name || (id != null && userMap ? userMap[String(id)] : '') || '';
}

/**
 * 按时间就近从日志表带出说明文字（tb_rd_defect_log.notes）。
 * 只记日志、不落在业务记录上的字段用此匹配：协助说明（action 19）、测试整体备注（action 8/9）等。
 * 以业务时间锚点就近（±1 分钟）匹配，操作人与业务记录上的操作者相同者优先，匹配不上返回空串。
 */
export function pickLogNotes(logs: any[], actions: number[], time: string, operator?: any): string {
    const t = Date.parse(time || '');
    if (Number.isNaN(t) || !Array.isArray(logs)) return '';
    let best = '';
    let bestDiff = Infinity;
    let bestOp = false;
    for (const log of logs) {
        if (!actions.includes(Number(log?.action)) || !log?.notes) continue;
        const lt = Date.parse(log?.dbtime || '');
        if (Number.isNaN(lt)) continue;
        const diff = Math.abs(lt - t);
        if (diff > 60_000) continue;
        const sameOp = operator != null && String(log?.operator ?? '') === String(operator);
        if (best === '' || (sameOp && !bestOp) || (sameOp === bestOp && diff < bestDiff)) {
            best = String(log.notes);
            bestOp = sameOp;
            bestDiff = diff;
        }
    }
    return best;
}

/**
 * 状态流转时间线：完全由操作日志驱动，每条入线日志一个节点，按时间升序，带操作人姓名与时间
 * - 入线规则：beforeStatus ≠ afterStatus 的状态变更日志 + 没有 beforeStatus 的记录型日志（创建/指派/认领/协助）均入线；
 *   beforeStatus = afterStatus 的修改/缺陷报告等非流转操作不入线
 * - 描述按日志动作 + 说明生成：人名优先取 *Name 字段，缺失时按用户 ID 从 userMap 解析；
 *   日志 assigneeId 指向责任人记录 id，指派/取消等节点经记录解析责任人姓名
 * - 无日志的历史数据兜底仅展示创建/关闭；未关闭缺陷最近一步成功操作标为当前位置（蓝色），拒绝/取消保持红色
 */
export function getDefectTimeline(row: any, userMap?: Record<string, string>): DefectTimelineItem[] {
  if (!row) return [];
  const events: DefectTimelineItem[] = [];
  const closed = Number(row.status) === 8;

  // 无操作日志的历史数据兜底
  if (!Array.isArray(row?.logs) || !row.logs.length) {
    const creater = whoOf(row?.creater, row?.createrName, userMap);
    if (row?.dbtime) {
      events.push({ label: creater ? `${creater} 发现缺陷并反馈` : '发现缺陷并反馈', time: row.dbtime, type: 'success' });
    }
  if (row?.closeTime) {
      events.push({ label: '流程结束，缺陷关闭', time: row.closeTime, type: 'info' });
    }
    appendDefectNextStep(events, row, undefined, userMap);
    return events;
  }

  const logs: any[] = row.logs;
  // 日志 assigneeId → 责任人记录 → 责任人姓名
  const assignees = Array.isArray(row?.assignees) ? row.assignees : [];
  const asgNameOf = (assigneeId: any): string => {
    const rec = assignees.find((a: any) => String(a?.id) === String(assigneeId));
    return rec ? whoOf(rec?.assignee, rec?.assigneeName, userMap) : '';
  };

  // 记录型/审核型动作不进状态流转：修改、反馈信息、缺陷报告、暂停/恢复审核拒绝、修改提出人——
  // 主状态不变且高频，即便日志缺 beforeStatus 也不入线（否则每条反馈都会变成一个时间线节点）
  const nonFlowActions = [18, 20, 21, 24, 27, 28];
  // 暂停流转节点：申请暂停/同意暂停/一键暂停/申请恢复/恢复——主状态不变但涉及流程冻结/解冻，均入线
  const pauseFlowActions = [22, 23, 25, 26, 29];
  // 入线过滤：状态真实流转（beforeStatus ≠ afterStatus）、没有 beforeStatus 的记录型操作（创建/指派/认领/协助）、暂停流转节点；
  // 转派(17)强制入线：主状态由现有逻辑重算、通常不变（beforeStatus == afterStatus），但转派本身是流程节点，必须展示
  const statusLogs = logs.filter((l: any) => {
    const act = Number(l.action);
    if (nonFlowActions.includes(act)) return false;
    if (pauseFlowActions.includes(act)) return true;
    if (act === 17) return true;
    return l?.beforeStatus == null || Number(l.beforeStatus) !== Number(l.afterStatus);
  });
  for (const l of statusLogs) {
    const op = whoOf(l?.operator, l?.operatorName, userMap) || '相关人员';
    const act = Number(l.action);
    const note = l?.notes ? String(l.notes) : '';
    let label = '';
    let type: DefectTimelineItem['type'] = 'success';
    switch (act) {
      case 0: label = `${op} ${note || '创建缺陷'}`; break;
      case 1: {
        const asg = asgNameOf(l?.assigneeId);
        label = asg ? `${op} 指派 ${asg}` : `${op} ${note || '指派责任人'}`;
        break;
      }
      case 2: label = `${op} 认领了缺陷`; break;
      case 3: label = `${op} 确认接收，进入处理中`; break;
      case 4: label = `${op} 拒绝处理${note ? `（原因：${note}）` : ''}`; type = 'error'; break;
      case 5: label = `${op} 开始处理`; break;
      case 6: label = `${op} 处理完成，转入待测试`; break;
      case 7: label = `${op} 开始测试，进入到测试验证阶段`; break;
      case 8: label = `${op} 测试验证通过`; break;
      case 9: label = `${op} 测试不通过，退回处理中${note ? `（原因：${note}）` : ''}`; type = 'error'; break;
      case 10: label = `${op} 提出人验证通过`; break;
      case 11: label = `${op} 提出人验证不通过，退回处理中${note ? `（原因：${note}）` : ''}`; type = 'error'; break;
      case 12: label = `${op} 负责人验证通过`; break;
      case 13: label = `${op} 负责人验证不通过，退回处理中${note ? `（原因：${note}）` : ''}`; type = 'error'; break;
      case 14: label = `${op} 关闭缺陷 ${note ? `（关闭信息：${note}）` : ''}`; type = 'info'; break;
      case 15: label = `${op} 重新打开缺陷`; break;
      case 16: {
        const asg = asgNameOf(l?.assigneeId);
        label = asg ? `${op} 取消 ${asg} 的处理资格` : `${op} 取消责任人${note ? `：${note}` : ''}`;
        type = 'error';
        break;
      }
      case 17: {
        const asg = asgNameOf(l?.assigneeId);
        // label = asg ? `${op} 将处理任务转派给 ${asg}${note ? `（说明：${note}）` : ''}` : `${op} 转派处理任务${note ? `：${note}` : ''}`;
        label =`${op} 将处理任务${note}` ;
        break;
      }
      case 19: {
        // 协助：notes 形如"新增协助处理人：xxx"
        const asg = asgNameOf(l?.assigneeId);
        if (asg) {
          const m = note.match(/说明[：:]([^，,]*)/);
          label = `${op} 添加 ${asg} 协助${m ? `：${m[1]}` : ''}`;
        } else {
          label = `${op} ${note || '添加协助人'}`;
        }
        break;
      }
      // 暂停流转节点（主状态不变但流程冻结/解冻）：申请类为灰色中间态（notes 为申请原因），
      // 进入暂停为红色警示，恢复为绿色回归处理；审核拒绝（24/27）不入线、见操作日志页签
      case 22: label = `${op} 申请暂停${note ? `（原因：${note}）` : ''}`; type = 'default'; break;
      case 25: label = `${op} 申请恢复${note ? `（原因：${note}）` : ''}`; type = 'default'; break;
      case 23: label = `${op} 同意暂停申请，缺陷暂停${note ? `（${note}）` : ''}`; type = 'error'; break;
      case 29: label = `${op} 一键暂停缺陷${note ? `（${note}）` : ''}`; type = 'error'; break;
      case 26: label = `${op} 恢复缺陷处理${note ? `（${note}）` : ''}`; break;
      default:
        // 其余动作（含日志未覆盖的新类型）：按动作名或说明展示
        label = `${op} ${defectLogActionMap[act] || note || '状态变更'}`;
        break;
    }
    if (label) events.push({ label, time: l.dbtime, type });
  }

  // 按时间升序排列（YYYY-MM-DD HH:mm:ss 字符串比较即时间序；同秒保持插入顺序）
  events.sort((x, y) => String(x.time).localeCompare(String(y.time)));
  // 未关闭缺陷：最近一步成功操作标为当前位置（蓝色）；拒绝/取消节点保持红色
  if (!closed && events.length) {
    const last = events[events.length - 1];
    if (last.type === 'success') last.type = 'info';
  }
  // 尾节点：追加「下一步」待办提示（非日志事实，pending 标记为虚线样式）
  appendDefectNextStep(events, row, assignees, userMap);
  return events;
}

/**
 * 时间线尾部「下一步」待办提示：当前卡点 + 等待中的动作，附进行中省略号
 * - 仅未关闭缺陷追加（status ≠ 8）；已关闭为终态不加
 * - 暂停/审核中间态优先于主状态措辞；人名优先取记录上的 *Name 字段，缺失回退 userMap
 */
export function appendDefectNextStep(
  events: DefectTimelineItem[],
  row: any,
  assignees?: any[],
  userMap?: Record<string, string>
): void {
  if (!row || Number(row?.status) === 8) return;
  const pause = Number(row?.pauseStatus) || 0;
  // 暂停态覆盖主状态：流程冻结，下一步只看暂停生命周期
  if (pause === 1) {
    events.push({ label: '暂停申请待负责人审核中······', time: '', type: 'default', pending: true });
    return;
  }
  if (pause === 2) {
    // 暂停满六个月自动关闭：后端返回当前周期自动关闭时间时随尾节点提示（恢复/人工关闭后周期失效）
    const ac = String(row?.pauseAutoCloseTime || '').trim();
    events.push({
      label: ac
        ? `缺陷已暂停，待申请恢复中（暂停满 6 个月将于 ${ac} 自动关闭）······`
        : '缺陷已暂停，待申请恢复中······',
      time: '',
      type: 'default',
      pending: true
    });
    return;
  }
  if (pause === 3) {
    events.push({ label: '恢复申请待负责人审核中······', time: '', type: 'default', pending: true });
    return;
  }
  const records = Array.isArray(assignees) ? assignees : Array.isArray(row?.assignees) ? row.assignees : [];
  const joined = records.filter((a: any) => [0, 1].includes(Number(a?.status)));
  const waitingConfirm = records.filter((a: any) => Number(a?.status) === 0);
  const hasTester = !!String(row?.tester ?? '').trim();
  const asgName = (a: any) => whoOf(a?.assignee, a?.assigneeName, userMap);
  let label = '';
  switch (Number(row?.status)) {
    case 0:
      label = '待指派或认领缺陷中···';
      break;
    case 1: {
      const names = waitingConfirm.map(asgName).filter(Boolean);
      label = names.length ? `待责任人确认接收中（${names.join('、')}）···` : '待责任人确认接收中···';
      break;
    }
    case 2: {
      const names = joined.map(asgName).filter(Boolean);
      label = names.length ? `待责任人处理完成中（${names.join('、')}）···` : '待责任人处理完成中···';
      break;
    }
    case 3:
      label = hasTester ? '待开始测试···' : '待测试开始···';
      break;
    case 4:
      label = '待重新指派或提出人确认关闭中···';
      break;
    case 5: {
      const tn = row?.testerName || whoOf(row?.tester, undefined, userMap);
      label = tn ? `待测试验证中（${tn}）···` : '待测试验证中···';
      break;
    }
    case 6:
      label = '待提出人验证中···';
      break;
    case 7:
      label = '待负责人验证中···';
      break;
    default:
      label = '';
  }
  if (label) events.push({ label, time: '', type: 'default', pending: true });
}

// 复现频率
export const defectReproduceFrequencyOptions = [
    { label: '必现', value: '必现' },
    { label: '偶现', value: '偶现' },
    { label: '无法复现', value: '无法复现' }
];

// 是否需要负责人验证
export const defectResponsibleverifyOptions = [
    { label: '否', value: 0 },
    { label: '是', value: 1 }
];

// 研发产品负责人（rdtype）0:李吉峰 1:孙东洪 2:徐顺乐
export const defectRdtypeMap: Record<number, string> = {
    0: '李吉峰',
    1: '孙东洪',
    2: '徐顺乐'
};
export const defectRdtypeOptions = Object.keys(defectRdtypeMap).map(key => ({
    label: defectRdtypeMap[Number(key)],
    value: Number(key)
}));

/**
 * 处理人下拉需手动补充的人员
 * 后端 usertypes=5 的用户列表可能不包含以下人员，需前端补入
 */
export const extraAssigneeUsers = [
    { id: 999, username: '李吉峰' },
    { id: 1030, username: '徐顺乐' },
    { id: 1036, username: '孙东洪' },
    { id: 1024, username: '张豪' }
];

/**
 * 将补充人员合并到用户列表前部，按 id 去重（统一转 String 比较，兼容接口返回 number/string）
 */
export function mergeExtraUsers(list: any[] = []): any[] {
    const existIds = new Set(list.map((item: any) => String(item.id)));
    const extras = extraAssigneeUsers.filter(item => !existIds.has(String(item.id)));
    return [...extras, ...list];
}
