# op-cascader

### 使用方式

```html
<Op-Cascader v-model="form" :option="option" :props="props" :iconShow="true" maxHeight="600rpx" @change="onChange"></Op-Cascader>
```
```javascript
	
import OpCascader from '@/uni_modules/op-cascader/components/op-cascader/op-cascader.vue';

export default {
	components: { OpCascader },
	data() {
		return {
			form: [],
			props: { label: 'label', value: 'value', children: 'children'},
			option: [
				{ 
					label: '标题1', 
					value: '1',
					children: [
						{
							label: '标题1-1',
							value: '1-1',
							children: [
								{ label: '标题1-1-1', value: '1-1-1' },
								{ label: '标题1-1-2', value: '1-1-2' },
								{ label: '标题1-1-3', value: '1-1-3', disabled: true },
								{ label: '标题1-1-4', value: '1-1-4', disabled: true },
								{ label: '标题1-1-5', value: '1-1-5' },
								{ label: '标题1-1-6', value: '1-1-6' }
							]
						},
						{
							label: '标题1-2',
							value: '1-2',
							children: [
								{ label: '标题1-2-1', value: '1-2-1' },
								{ label: '标题1-2-2', value: '1-2-2' }
							]
						}
					]
				},
				{
					label: '标题2', 
					value: '2',
					children: [
						{
							label: '标题2-1',
							value: '2-1',
							children: [
								{ label: '标题2-1-1', value: '2-1-1' },
								{ label: '标题2-1-2', value: '2-1-2' }
							]
						},
						{
							label: '标题2-2',
							value: '2-2',
							children: [
								{ label: '标题2-2-1', value: '2-2-1' },
								{ label: '标题2-2-2', value: '2-2-2' }
							]
						}
					]
				},
				{
					label: '标题3', 
					value: '3',
				},
				{
					label: '标题4', 
					value: '4',
				},
				{
					label: '标题5', 
					value: '5',
				}
			]
		}
	},
	onLoad() {

	},
	methods: {
		onChange(val) {
			this.form = val
			console.log(val)
		}
	}
}

```


### 组件的属性说明如下：

| 属性             	| 类型    	| 默认值  	| 必填		| 说明                           	|
| ---------------- 	| ------- | ------- | ----	| ------------------------------ 	|
| v-model 		 			| Array  	| []      | 否  	| 双向绑定数据     			|
| props							| Object	| { label: `label`, value: `value`, children: `children` } | 否		| 自定义节点 label、value、options 的字段 |
| option		       	| Array	 	| [] 		 	| 是  	| 选项数据tree     		|




### 事件

| 事件名称  | 回调参数             | 说明                                                         |
| --------- | -------------------- | ------------------------------------------------------------ |
| change  	| (data) => void | 改变事件，data选中项value集合 |

