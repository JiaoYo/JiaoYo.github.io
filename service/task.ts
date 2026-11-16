
// 会议纪要
import request from '@/utils/request';

/**
 * 实时任务相关API
 */

/**
 * 查询实时任务配置
 */
export function fetchGetTaskConfig(data:any) {
  return request<any>({
    url: '/projectRealTime/getPage.do',
    method: 'get',
    data
  })
}
/**
 * 新增实时配置
 */
export function fetchInsertTaskConfig(data:any){
  return request<any>({
    url: '/projectRealTime/insertOne.do',
    method: 'post',
    data
  })
}
/**
 *  修改实时配置
 */
export function fetchUpdateTaskConfig(data:any){
  return request<any>({
    url: '/projectRealTime/update.do',
    method: 'put',
    data
  })
}
/**
 * 删除实时配置
 */
export function fetchDeleteTaskConfig(id: number | string) {
  return request<any>({
    url: `/projectRealTime/delete.do?arrIds=${id}`,
    method: 'DELETE'
  })
}

// 分页查询实时任务
export function fetchGetTaskPage(data: {
  page: number
  limit: number
  pid?: number
  status?: number
  fuzzy?: string
}) {
  return request<any>({
    url: '/projectRealTimeTask/getPage.do',
    method: 'get',
    data
  })
}

// ID查询实时任务
export function fetchGetTaskById(id: number) {
  return request<any>({
    url: '/projectRealTimeTask/getById.do',
    method: 'get',
    data: { id }
  })
}

// 新增实时任务
export function fetchInsertTask(data: {
  realTimeId: number
  taskName: string
  status?: number
  taskProgress?: number
  ecd?: string
}) {
  return request<any>({
    url: '/projectRealTimeTask/insertOne.do',
    method: 'post',
    data
  })
}

// 修改实时任务
export function fetchUpdateTask(data: {
  id: number
  pid?: number
  weChatName?: string
  taskName?: string
  status?: number
  taskProgress?: number
  ecd?: string
  delayed?: number
  delayRsn?: string
}) {
  return request<any>({
    url: '/projectRealTimeTask/update.do',
    method: 'put',
    data
  })
}

// 切换用户
export function fetchUpdateTaskCreater(id: number) {
  return request<any>({
    url: '/projectRealTimeTask/updateCreater.do',
    method: 'put',
    data: id,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 删除实时任务
export function fetchDeleteTasks(id: number | string) {
  return request<any>({
    url: `/projectRealTimeTask/delete.do?arrIds=${id}`,
    method: 'DELETE'
  })
}

// 查询今日实时任务人员
export function fetchGetTodayTaskUserList(data?: {
  creaters?: number[]
  status?: number
  date?: string
}) {
  return request<any>({
    url: '/projectRealTimeTask/getTodayTaskUserList.do',
    method: 'get',
    data
  })
}

/**
 * 实时任务操作日志相关API
 */

// 分页查询实时任务操作日志
export function fetchGetTaskLogPage(data: {
  page: number
  limit: number
  pid?: number
  type?: number
}) {
  return request<any>({
    url: '/projectRealTimeTaskLog/getPage.do',
    method: 'get',
    data
  })
}

// ID查询实时任务操作日志
export function fetchGetTaskLogById(id: number) {
  return request<any>({
    url: '/projectRealTimeTaskLog/getById.do',
    method: 'get',
    data: { id }
  })
}

// 新增实时任务操作日志
export function fetchInsertTaskLog(data: {
  pid: number
  type: number
}) {
  return request<any>({
    url: '/projectRealTimeTaskLog/insertOne.do',
    method: 'post',
    data
  })
}

