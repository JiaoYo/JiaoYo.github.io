// store/useDataStore.ts
import { defineStore } from 'pinia'

export const useLargeArrayStore = defineStore('data', {
	state: () => ({
		items: [],
		// 待调试任务数量（底部待办 tab 角标用）
		todoCount: 0
	}),
	actions: {
		// 初始化/全量替换（谨慎使用，会整体刷新）
		setList(newArray : any[]) {
			this.items = newArray
		},
		// 添加一项（去重：同一待审核事件被重复推送时不再追加，避免角标/列表数量翻倍）
		addItem(item : any) {
			// 去重键：type + id/proid + debugname，重连回放/重复消息会整批重推，防止 items 翻倍
			const key = (i: any) => `${i.type ?? ''}:${i.id ?? i.proid ?? ''}:${i.debugname ?? ''}`;
			const k = key(item);
			if (k && k !== '::' && this.items.some((i: any) => key(i) === k)) {
				return;
			}
			this.items.push(item)   // 直接 push，响应式更新
		},
		// 删除一项
		removeItemById(id : number | string) {
			const index = this.items.findIndex(i => i.id === id)
			if (index !== -1) {
				this.items.splice(index, 1)   // 只删除一项
			}
		},
		// 删除一项
		removeItemByProname(proname : string, type : number) {
			console.log('this.items', this.items);
			const index = this.items.findIndex(i => i.projectname === proname && i.type === type);
			if (index !== -1) {
				console.log("2222");
				this.items.splice(index, 1)   // 只删除一项
			}
		},
		// 清空
		clearList() {
			this.items = []
		}
	}
})