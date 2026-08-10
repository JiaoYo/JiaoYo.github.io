// store/useDataStore.ts
import { defineStore } from 'pinia'

export const useLargeArrayStore = defineStore('data', {
	state: () => ({
		items: []
	}),
	actions: {
		// 初始化/全量替换（谨慎使用，会整体刷新）
		setList(newArray : any[]) {
			this.items = newArray
		},
		// 添加一项
		addItem(item : any) {
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