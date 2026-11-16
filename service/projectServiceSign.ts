import request from '@/utils/request';

const PREFIX = '/projectServiceSign';

/**
 * 查询项目关联合同
 */
export function fetchQueryContracts(projectId: number) {
  return request({
    url: `${PREFIX}/contracts.do`,
    method: 'get',
    data: { projectId }
  });
}

/**
 * 搜索客户项目
 */
export function fetchQueryProjects(fuzzy?: string) {
  return request({
    url: `${PREFIX}/projects.do`,
    method: 'get',
    data: { fuzzy }
  });
}

/**
 * 查询合同设备
 */
export function fetchQueryDevices(contractId: number) {
  return request({
    url: `${PREFIX}/devices.do`,
    method: 'get',
    data: { contractId }
  });
}

/**
 * 查询项目调试任务
 */
export function fetchQueryDebugTasks(projectId: number) {
  return request({
    url: `${PREFIX}/debugTasks.do`,
    method: 'get',
    data: { projectId }
  });
}

/**
 * 生成服务单和签名链接
 */
export function fetchCreateSignTask(data: {
  contractId: number;
  projectId: number;
  projectManager: string;
  siteContact: string;
  debugEngineerId: number;
  deviceIds: number[];
  serviceItems: { debugId?: number; serviceName?: string; passed: boolean }[];
  expireHours?: number;
}) {
  return request({
    url: `${PREFIX}/create.do`,
    method: 'post',
    data
  });
}

/**
 * 分页查询签名任务
 */
export function fetchGetSignTaskPage(params: {
  page: number;
  limit: number;
  status?: number;
  projectId?: number;
  fuzzy?: string;
  creater?: number;
}) {
  return request({
    url: `${PREFIX}/getPage.do`,
    method: 'get',
    data: params
  });
}

/**
 * 查询完整任务详情
 */
export function fetchGetSignTaskById(id: number) {
  return request({
    url: `${PREFIX}/getById.do`,
    method: 'get',
    data: { id }
  });
}

/**
 * 查询最新签名状态
 */
export function fetchGetSignStatus(id: number) {
  return request({
    url: `${PREFIX}/getStatus.do`,
    method: 'get',
    data: { id }
  });
}

/**
 * 撤销待签名链接
 */
export function fetchRevokeSignTask(id: number) {
  return request({
    url: `${PREFIX}/revoke.do`,
    method: 'post',
    data: { id }
  });
}

/**
 * 一键导出已签名任务完整证据包（zip）
 * app 端返回 ArrayBuffer，自行判断是否为 zip 或后端错误 JSON
 */
export function fetchExportSignEvidence(id: number) {
  return request({
    url: `${PREFIX}/exportEvidence.do`,
    method: 'get',
    data: { id },
    responseType: 'arraybuffer'
  });
}
