<template>
<view class="op-cascader" :style="{maxHeight: maxHeight}">
	<template v-for="(opt, optInx) in newOption" :key="optInx">
		<view class="cascader-content" :style="isDark ? '#1b1b1b' : '#ffffff'">
			<scroll-view :scroll-y="true" style="height: 100%;">
				<template v-for="(item, index) in opt" :key="index">
					<view v-if="item._parentId==0 || (optInx >0 && modelValue[optInx-1] == item._parentId)" 
						class="cascader-item" 
						:class="{active: modelValue[optInx] == item[valueKey]}" 
						@click="select(item[valueKey], optInx, index)"
					>
						<view class="cascader-item-label">{{ item[labelKey] }}</view>
						<template v-if="iconShow">
							<image v-if="modelValue[optInx] == item[valueKey]" class="icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAOHSURBVHgB7ZldbtpAEMdnFgeBaCV6gnKDkhMUpCbKW9oTRDlB04cS5SnwUFWiL+EEbW+QxzSJFHqCcIOSGyD1I4Hgne44obWNbXb9BQ/8HhJsL+Y/u7O7szMAa9YkAiEFGm2qliq/6rZdeI1CPAegOiFVkbDKz9XnEZIYEqn/IL8LIftn75/2IQUSGbDz6WeDRUMB9mZidWGj1J9TALt30XoygJjEMsARDtYxEjQgBYigX5Cwf3ZUHoIhRgawqxQr42P1iweQBUgnk9/lTr+NI+2v6Dbc+XhbkwW4Uh9rkC1DYUNTdzSETqOtrpqgFl1D9uIZp6O2upO6TuOFI8DiAcWV6SRNDo4IRPOiVYyc4JEG5Og2IeBI2LQZ5U6hLsQTdrnimQcNrCWsRagBzmqzVPH/qBUrt8dhDwNd6NF1fsAKIXHavAzYvQNHwLbgM6wYKK3AUZgbga0Pkzpu2NewggSNwtwIkHWfzS4bAocRum2R4y4fcwagwF3IC5Kdi8NyEwg6Os1VpLvnX5E8BqjJ28htw1Lizw8rbf54flhuE+qMBFUtFba773gMkEI2IA9c4pnt7lg7svW7kccAEuIlZE2AeNV1bd2vo29v8s4BomzdJ6F4B4EvPJeeh2i285qsIKmId8DwSWw0gU1WkNTEOy8LN0D7Farn3StIpBGpip/HO4n5oK0BIjS2u/8DrFAjMhHvPW76XUj7LKpoRxqRWc/LofvKuw8QmqY3go3I0G3I18mW+wJR3sTItLARcN4qO73vGOEibZ/nxJj72jsHbE40xcIzEjPSFs+oaKHvvvYYMC3dDXQncgAeI7IQzxPYH07Pnwe6f04Q8C3Ep/3QL2mLd8R++dYq77vvWf5G7EZYgIQGSMgCCYWe/97cRnZ5VO7rhbb5wptnUI4ocCemqd4BI084+Rt0P9AAZxSAerAikKReWHIrNBa63xjzpjSEZaM03N959xY3oQb03z0bCQnNBMtqcpR41hCVbo+MRp1hI7kUI5QLjwjtN4vS7AvDaaf8o4zI051YvFo0mzqlJ7MCh1DJXsNTmzGPbpNqgYPhF06Kd5tZrk682kxuS5smtbJ4RT41Gpw/TbPIRxI6vHyDIYnKrFy9UYegA0LcRTAss7KfS/iq4vvTOMJnpFLoZl6prJ4qYDec3NJDeqY2M4rFonMUxAFJecOip+PSwKQauWZNRvwFjird3f4t0GAAAAAASUVORK5CYII=" mode="aspectFit"></image>
							<image v-else class="icon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAQdSURBVHgB7VlbTiJBFC3QGOOHz1/RxOjPGP8HF+C4AMUFDC5AWYfMAtQFyMwC0AXIAgwmRuMP86uJfBhjVOYcUtW5XV0N3dA0TMJJSFc/qLqn7q2q+1BqjDH6QkYlgPv7+1lcNrPZ7I+vr68VXL/hOpfJZPhctVqtJp418IzXa1xrGxsbNZUA+iIAwfNa6AMjbFSQFC5V/M5Apq56RE8EKDguJQidVwkAZGpvb29HW1tbDRUTsQhoU6HgxUBHmUwD2qh+fHzcol1bWFh4WVpa4iyrp6en2efn5xyay5OTk3lobBdC51SQyBkuJ9BIU0VEZAI3Nze5mZmZ3/bAELYCgSpxbRqTwTVTRH8Fq7/G6+vrflRtRCJQr9c3p6am/kg7R/sagx+vr6/HVrvEw8NDDn0dSyIkgUn5GWVtdCVgC8/FNzExcbK2tnamEsTj42Px8/OzZMbBtQkSe91IdCRgm02cmekFWhtyvCbMaaeTOYUS4IKFjV5J4dHe79dkusFBgpO2E7awsx36KplOaDZpCE9wDGpZnxNKy1AK+95JgKYjt0rafBrCG9BEOaa5pyz67AnASWB6evqX+HMl6QUbBRyTB5x45NRCgAD3Z3nCopOyGhIgx5Fo511acGmgKP5USdN0bHBsymDu6XfZ37gI7JoGjv3UTccGT3lxe6DdGQ8+AlSROEgaq6urA9nv44AuCmVhG+bcdtvlex8BqEjaWFWNDjxZbDPyEYC6tkU7kYAjCUCWW9Feke/sNeDZF/yfv2pEQPfctBntyXc2Ac9Vfn9/H9ruYwO2/yJu5+Q7HwHpLscJKgYNKYteyB6y6j+Hj4BxoAh7vx0mpCx0seU7ext9ER/OqdGBtzaxC/nWpm1C3sEFMt/V6GDZNOQkt++tDz12MKdNNSKwDljf+WQfZJfidleNDjxZ7AM2YEIyEgoLItIE3XsZI9vpGx8B7rdQ14V4VFDDh0yiBfyzwDkgzQiMCwwv1ZCgQ1tvEl3ufYAAVSRDORlepg2MfWzaTKS53Puwk1gG1HmkOg5Vyri7uzuUs88soOs7JwEdRJyae6b+uJhUSqDpYC3K2T8NC21DfSGshbKMhNDheRrrwWQDZWQ4Pz8fmlgIJcAdicksua2y40GSYB7WTmVSBpOmd6GjN6rVtmeRuBrEmqDNM4kss4HM0HXLikRKr+tc/rmsDaBdQVWl3EtVRYIa5U5n5aI4YXuJpNcN7KSrGIxpj9h1Ln3KF+RO0xYoZhI5domJuwMGCJiQXvBVvK+hzMR4umEiKf6P7jn+l9cxrbPExN2GC7aTzfdFwEBrowwhtlUC4CHFXa+X0mu/ZdZ2nYtFu17KrHANLqCty35qxokUugldM6ZdswrJaC5nFboZiNRZ8KbQi4uL9TimMsYYA8I/5WtETy5O2jYAAAAASUVORK5CYII=" mode="aspectFit"></image>
						</template>
					</view>
				</template>
			</scroll-view>
		</view>
	</template>
</view>
</template>

<script setup>
import { ref, defineModel, defineProps, defineEmits, watch } from 'vue';
const modelValue = defineModel({type: Array, default: []});
const DefProps = defineProps({
	option: {   // tree数据
		type: Array,
		default: () => []
	},
	props: { // 属性值
		type: Object,
		default: {
			label: 'label',
			value: 'value',
			children: 'children',
			disabled: 'disabled',
		}
	},
	maxHeight: { //最大下拉高度
		type: String,
		default: "400rpx"
	},
	iconShow: {  // 是由否显示左侧按钮
		type: Boolean,
		default: false,
	},
	isDark: {
		type: Boolean,
		default: false
	}
})
const Emits = defineEmits(['change'])
const newOption = ref([]); // 选项tree
const labelKey = ref('label'); // 默认属性key
const valueKey = ref('value');
const childrenKey = ref('children');
const disabled = ref('disabledKey');

// 配置属性key
watch(() => DefProps.props, (newVal, oldVal) => {
	labelKey.value = newVal.label??'label'
	valueKey.value = newVal.value??'value'
	childrenKey.value = newVal.children??'children'
	disabled.value = newVal.disabledKey??'disabledKey'
}, { deep: true, immediate: true})

// 整理tree数据根据层级分类数组
watch(()=> DefProps.option, (newVal, oldVal) => {
	if(newVal){
		let tree = treeConfig(newVal);
		newOption.value = setData(tree);
	}
}, { deep: true, immediate: true});


// 默认tree列表配置，设置父子级关系和层级
function treeConfig(arr, parentId=0, level=0) {
	let list = JSON.parse(JSON.stringify(arr))
	list.forEach(item => {
		item._parentId = parentId;
		item._level = level+1;
		if(item[childrenKey.value] && item[childrenKey.value].length > 0){
			item[childrenKey.value] = treeConfig(item[childrenKey.value], item[valueKey.value], item._level);
		}
	})
	return list
}

// 将tree数据根据层级分类
function setData(tree, list = []) {
	tree.forEach(item => {
		let obj = {}
		for(let k in item){
			if( k != childrenKey.value ){
				obj[k] = item[k];
			}
		}
		if(!list[obj._level - 1]){
			list[obj._level - 1] = [];
		}
		list[obj._level - 1].push(obj);
		
		if(item[childrenKey.value] && item[childrenKey.value].length > 0){
			list = setData(item[childrenKey.value], list)
		}
	})
	return list
}

// 选择
function select(value, parentIndex, index) {
	let arr = JSON.parse(JSON.stringify(modelValue.value))
	arr[parentIndex] = value;
	let list = []
	for(let i =0; i < arr.length; i++) {
		if(i <= parentIndex){
			list.push(arr[i]);
		}
	}
	modelValue.value = list;
	Emits('change', list, value)
}
</script>
<style lang="scss" scoped>
page, view, text, swiper, swiper-item, image, navigator, icon, form, input, button{
	box-sizing: border-box;
}

.op-cascader{
	width: 100%;
	height: 100%;
	display: flex;
	box-sizing: border-box;
	.cascader-content{
		flex: 1;
		overflow: hidden;
		// background-color: #fff;
		.cascader-item{
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding-left: 20rpx;
			padding-right: 8rpx;
			&.active{
				.cascader-item-label{
					color: #468AF7;
				}
			}
			.cascader-item-label{
				flex: 1;
				text-align: left;
				color: #364462;
				font-size: 32rpx;
				line-height: 92rpx;
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				&.active{
					color: #468AF7;
				}
			}
			>.icon{
				width: 40rpx;
				height: 40rpx;
			}
		}
	}
}
</style>