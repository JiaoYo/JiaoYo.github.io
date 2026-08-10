// 如果想响应式
import { reactive } from 'vue'

export const globalData = reactive({
    permissionList: [] as string[]
})