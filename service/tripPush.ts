import request from '@/utils/request'

/** 分页查询出差推送 */
export function fetchGetProjectTripPushPage(params: any) {
  return request({
    url: '/projectTripPush/getPage.do',
    method: 'get',
    data: params
  })
}

/** ID查询出差推送 */
export function fetchGetProjectTripPushById(id: number | string) {
  return request({
    url: '/projectTripPush/getById.do',
    method: 'get',
    data: { id }
  })
}

/** 新增出差推送(对象) */
export function fetchAddProjectTripPush(data: any) {
  return request({
    url: '/projectTripPush/insert.do',
    method: 'post',
    data
  })
}

/** 修改出差推送(数组) */
export function fetchUpdateProjectTripPush(data: any[]) {
  return request({
    url: '/projectTripPush/update.do',
    method: 'put',
    data
  })
}

/** 删除出差推送 */
export function fetchDeleteProjectTripPush(arrIds: string) {
  return request({
    url: `/projectTripPush/delete.do?arrIds=${arrIds}`,
    method: 'delete',
  })
}
