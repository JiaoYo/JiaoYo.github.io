<script setup lang="ts">
import { ref, defineProps, watch, defineExpose, onMounted } from 'vue';

/**
 * 定义树节点类型
 */
interface TreeItem {
    name: string;
    rank: number;
    show: boolean;
    lastRank: boolean;
    showChild: boolean;
    checked: boolean;
    isPickerShow?: boolean;
}

const props = defineProps({
    showSearch: {
        type: Boolean,
        default: true
    },
	isDark: {
		type: Boolean,
		default: false
	},
    range: {
        type: Array,
        default: () => []
    },
    idKey: { // 字段key值
        type: String,
        default: 'id'
    },
    pidKey: { // 字段key值
        type: String,
        default: 'pid'
    },
    nameKey: { // 字段value值
        type: String,
        default: 'name'
    },
    allKey: { // 冗余字段
        type: String,
        default: 'value'
    },
    childKey: { // 字段value值
        type: String,
        default: 'children'
    },
    title: { // 头
        type: String,
        default: ''
    },
    multiple: { // 是否可以多选
        type: Boolean,
        default: true
    },
    cascade: { // 是否级联选择
        type: Boolean,
        default: false
    },
    selectParent: { // 是否可以选父级
        type: Boolean,
        default: true
    },
    maskClick: { // 点击遮罩层是否关闭
        type: Boolean,
        default: true
    },
    confirmColor: { // 确定按钮颜色
        type: String,
        default: '' // #007aff
    },
    cancelColor: { // 取消按钮颜色
        type: String,
        default: '' // #757575
    },
    titleColor: { // 标题颜色
        type: String,
        default: '' // #757575
    },
    currentIcon: { // 展开时候的图标
        type: String,
        default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAYAAACqj0o2AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MEQ0QTM0MzQ1Q0RBMTFFOUE0MjY4NzI1Njc1RjI1ODIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MEQ0QTM0MzU1Q0RBMTFFOUE0MjY4NzI1Njc1RjI1ODIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDowRDRBMzQzMjVDREExMUU5QTQyNjg3MjU2NzVGMjU4MiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDowRDRBMzQzMzVDREExMUU5QTQyNjg3MjU2NzVGMjU4MiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PidwepsAAAK0SURBVHja7JxbTsJAFIYHww7ciStgCeoGvGxAiOsgURegoL5720AXYLiIr0aJviq3Zx3PhIEnKG3ndtr+f3KixrSUj/ZjzjClIqUUiFm2gAAQAREQEUAEREAERAQQAREQAREBREAEREBEEqa67h9RFDWllDv0awWYlqlQHmu1WjMRRMoV1QFttA12y3xRtdNczq8EsE4/f8FumX2q77ROvNXk8UGMEKdUz6tYJHljaZAbuyUH+UR1to5BEohTuqwPCeS4pAA/qY6o/kyHOAMCeRK3owJnj+rH1jjxhqpVsstaebCz6TmnHWyXyY+xHjSBWBY/bvSgadtXBj9u9KCN3rnIfkzkQVsTEEX0Y2IP2oKo/HhMICcFAThUcwVZNGU6FdbX/XURzkbVF4+ybGhjPrFdgP66QdXNurGtSdk6Xdb9nAJ8oDo3OQlsQZzkdPw41ONBo6vI5scDefRjZg+6gpg3Pxp50CXEvPjR2IOuIXL3oxUPuobI3Y9WPOgDIlc/WvOgL4iL/vqFCcD7LH0xB4hj7cfQ/fWH9qCT+FhG0tN+DBk1PzjOM0SVllixcsBT1AvYc/kAPhc0hRg/3uvxoCgKRN9+dOrBUBB9+9GpB0NC9OVH5x4MDdG1H714kANEV3705kEOEBf9dcPi/lQnsuvLg1wgSu3Ha0v7Uh4MMgUXeuG71H407a+VBy9CPQkOdw+MtB+nGbd/D+FBbhBNxo9SjwcngJjNj0E9yBFiFj8G9SBXiGn8GNyDnCEm8SMLD3KHGOdHNh7kDjHOj2w8mAeIi/5arX+c6b/fxHz9oADEdGdjR/fXCw/OOB5oVfCOgnepz8IB14PMw03jCmTE+QBx5z0gAmKSqK9OUF+hcAeIhu/QYr4Qie8rjW83hhMBERARQAREQAREBBABERCLnH8BBgA+TQI7U4t53AAAAABJRU5ErkJggg=='
    },
    defaultIcon: { // 折叠时候的图标
        type: String,
        default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAYAAACqj0o2AAACE0lEQVR4Xu3c200DMRCF4XEltJAOkEugA+ggpUAHoQMqiFMCdEAJUMEiS4mEELlIO7bPOeN9i6K1rG/952myyea1WiCtXmEuYBPR4RBMxInoIOCwhOtJLKVszWyXc/5y2BvNEq6I+/3+kFK6M7OHnPM7jcLKjbZAvD/uaZtzflm5P4rbWyJWgDcze1LPuzVihfxUz7sH4ilJ2bx7Isrm3RtRMu8RiHJ5j0SUyXs0okTeCIj0eSMh0uaNhkiZNyIiXd7IiDR5oyNS5M2ACJ83EyJs3myIkHkzIsLlzYwIkzc7IkTeCojD81ZCHJa3GuKQvBURu+etjNgtb3XELnlHQGyedyTEZnlHQ2ySd0RE97wjI7rlHR3RJe+JeIrbLOecD6ePpZQ6W1kn2epo4MUrPOKyLN8ppYq1+y1VStncOjIdGnFZlo+U0uOtWOeOY2TE12Ouq//pEA7xXL7XfvcufR8K0Svfv6CREN3yDYfYIt9QiK3yjYTYLF95xB75SiP2ylcZsVu+cogj8pVCHJWvEuKwfOkREfKlRkTJlxkRJl86RMR8qRBR82VChM0XHpEhX2hElnyREWnyhUNkzBcKkTVfJETafIcjKuQ7FFEl35GIMvl2R1TMtyuiar49EWXzbY5oZpv/hibXTF2h3+s60FRKeT6+3TjMS3nrA3ZFRD8xrfY3ER1kJ+JEdBBwWGKeRAfEH1wS5WFZSDB/AAAAAElFTkSuQmCC'
    },
    lastIcon: { // 没有子集的图标
        type: String,
        default: ''
    }
});

const treeList = ref<TreeItem[]>([]); // 原始树数据
const keyWord = ref<string>('');
const showTree = ref<boolean>(false);

const emit = defineEmits<{
    (e: 'cancel', result: any): void
    (e: 'confirm', result: any): void
    // 添加你需要的其他事件
}>()

const _maskClick = (): void => {
    emit("cancel", []);
}
const _show = (): void => {
    showTree.value = true
}

const _hide = (): void => {
    showTree.value = false
}

const _cancel = (): void => {
    _hide();
    emit("cancel", []);
}

const _confirm = (): void => {
    // 处理所选数据
    let rt: any = [];
    treeList.value.forEach((v: any, i: number) => {
        if (treeList.value[i].checked) {
            rt.push({
                id: (treeList.value[i] as any).id,
                name: (treeList.value[i] as any).name,
                value: (treeList.value[i] as any).value,
                pid: (treeList.value[i] as any).pid || 0,
            })
        }
    })
    _hide();
    emit("confirm", rt);
}

const filterOp = (e: any) => {
    console.log('e', e);
    keyWord.value = e.detail.value
    let oldArr = treeList.value;
    if (keyWord.value != "") {
        keyWord.value = keyWord.value.toLowerCase();
        const newArr = oldArr.map((item) => {
            if (item.name.toString().toLowerCase().indexOf(keyWord.value) > -1) {
                item['isPickerShow'] = true
            } else {
                item['isPickerShow'] = false
            }
            return item
        })
        treeList.value = newArr
    } else {
        const newArr = oldArr.map((item) => {
            delete item['isPickerShow']
            return item
        })
        treeList.value = newArr
    }
}

// 重置数据
const _reTreeList = () => {
    treeList.value.forEach((v: any, i: number) => {
        treeList.value[i].checked = v.orChecked
    })
}

//开始加载数据
const _initTree = (range = props.range) => {
    treeList.value = [];
    _renderTreeList(range);
    _initShowTree();
}

const getInclude = (arr1: any, arr2: any) => {
    return arr2.every((val: any) => arr1.includes(val))
}

const _initShowTree = () => {
    const treeListArr = JSON.parse(JSON.stringify(treeList.value))
    let checkedList: any = []
    let checkedParentList: any = []
    treeListArr.map((treeItem: any) => {
        if (treeItem.checked) {
            checkedList = [...checkedList, treeItem.id]
            checkedParentList = [...checkedParentList, ...treeItem.parentId]
        }
    })
    let checkedSetList = [...new Set(checkedList)];
    const checkedParentSetList = [...new Set(checkedParentList)];
    // 如果选择了 级联
    if (props.cascade && props.multiple && props.selectParent) {
        let i = checkedParentSetList.length - 1
        for (i; i >= 0; i--) {
            //获取父级下标
            const nextIndex = treeListArr.findIndex((item: any) => item.id == checkedParentSetList[i])
            //从父级数据中取到所有同级id数组
            const sonarrId = treeListArr[nextIndex]?.sonarrId
            if (sonarrId.length > 0 && getInclude(checkedSetList, sonarrId)) {
                treeListArr[nextIndex].checked = true
                checkedSetList = [...checkedSetList, treeListArr[nextIndex].id]
            }
        }
    }
    const newTreeList = treeListArr.map((treeItem: any) => {
        // 父亲都展开 都显示
        if (checkedParentSetList.indexOf(treeItem.id) > -1) {
            treeItem.show = true
            treeItem.showChild = true
        }
        // 兄弟也展开 也显示
        if (getInclude(checkedParentSetList, treeItem.parentId)) {
            treeItem.show = true
        }
        // 所有checked的 都选中
        if (checkedSetList.indexOf(treeItem.id) > -1) {
            treeItem.checked = true
        }
        return treeItem
    })
    treeList.value = newTreeList
}

//扁平化树结构
const _renderTreeList = (list: any, rank = 0, parentId2 = []) => {
    list.forEach((item: any) => {
        let parentId = JSON.parse(JSON.stringify(parentId2))
        // 处理parentId
        if (rank != 0) {
            parentId.push(item[props.pidKey])
        }
        // 处理sonarrId children
        const sonarrId: any = []
        let children = 0
        let lastRank = true
        if (item[props.childKey] && item[props.childKey].length > 0) {
            item[props.childKey].map((itemD: any) => {
                sonarrId.push(itemD[props.idKey])
            })
            children = item[props.childKey].length
            lastRank = false
        }

        const childObj = {
            id: item[props.idKey],
            name: item[props.nameKey],
            value: item[props.allKey],
            pid: item.pid || 0,
            parentId: parentId, // 父级id数组
            sonarrId: sonarrId, //子级id数组
            rank: rank, // 层级
            lastRank: lastRank,
            showChild: false, //子级是否显示
            show: rank == 0 ? true : false, // 自身是否显示
            checked: item.isGqAddChecked ? item.isGqAddChecked : false, //是否选中
            children: children
        }
        treeList.value.push(childObj)
        if (item[props.childKey] && item[props.childKey].length > 0) {
            let rank2 = rank + 1
            _renderTreeList(item[props.childKey], rank2, parentId)
        }
    })
}

//选中/取消数据
const _treeItemSelect = (item: any, index: number) => {
    item.checked = !item.checked
    _fixMultiple(index)
    //开启级联并且在多选状态下和父级可选的状态下
    if (props.cascade && props.multiple && props.selectParent) {
        //给子集孙集....同步选择状态
        treeList.value.forEach((childItem: any, i: number) => {
            if (childItem.parentId.includes(item.id)) {
                childItem.checked = item.checked
            }
        })
        //在子集选中之后同步父级状态
        if (item.rank > 0) {
            //如果是选中状态，选择性同步 父级状态
            if (item.checked) {
                let i = item.parentId.length - 1
                //倒序遍历父级数组
                for (i; i >= 0; i--) {
                    //获取父级下标
                    const nextIndex = treeList.value.findIndex((itemT: any) => itemT.id === item.parentId[i])
                    //从父级数据中取到所有同级id数组
                    const obj = (treeList.value[nextIndex] as any).sonarrId
                    //在所有同级选中的情况下type等于true
                    let type = true
                    //遍历同级id数组
                    obj.forEach((childItem: any, i: number) => {
                        //获取同级数据下标
                        const ziIndex = treeList.value.findIndex((itemT: any) => itemT.id === childItem)
                        //判断同级是否选中
                        if (!treeList.value[ziIndex].checked) {
                            //只要有一个没选中type改为false
                            type = false
                        }
                    })
                    //遍历万所有同级之后，如果同级全都选中，则网父级同步状态
                    if (type) {
                        treeList.value[nextIndex].checked = true
                    } else {
                        //反之取消父级状态
                        //（其实父级在现在的情况下本来就应该是false，加else纯属以防万一）
                        treeList.value[nextIndex].checked = false
                    }
                }
            } else {
                //子集取消状态，同时取消所有父级的选中状态
                item.parentId.forEach((childItem: any, i: number) => {
                    const nextIndex = treeList.value.findIndex((itemT: any) => itemT.id === childItem)
                    treeList.value[nextIndex].checked = false
                })
            }
        }
    }
}

// 处理单选多选
const _fixMultiple = (index: number) => {
    if (!props.multiple) {
        // 如果是单选
        treeList.value.forEach((v: any, i: number) => {
            if (i != index) {
                treeList.value[i].checked = false
            } else {
                treeList.value[i].checked = true
            }
        })
    }
}

// 点击
const _treeItemTap = (item: any, index: number) => {
    if (item.lastRank === true) {
        //点击最后一级时触发事件
        treeList.value[index].checked = !treeList.value[index].checked
        _fixMultiple(index)
        return;
    }
    let id = item.id;
    item.showChild = !item.showChild;
    if (item.showChild) {
        //子集数据加载过则不在填充
        if (item.children > 0) {
            treeList.value.forEach((childItem: any, i: number) => {
                //隐藏所有子级
                if (childItem.parentId.includes(item.id) && item.parentId.length + 1 ==
                    childItem
                        .parentId.length) {
                    childItem.showChild = false;
                    childItem.show = true
                }
            })
            return
        }
        const range = props.range
        // 找到当前元素
        const own = getOwn(id, range)
        //子集数据
        const checkedChildren = own.children
        if (checkedChildren && checkedChildren.length > 0) {
            item.children = checkedChildren.length
        } else {
            item.children = checkedChildren
        }
        //如果接口返回值为空认为是末级
        if (!checkedChildren || checkedChildren.length <= 0) {
            item.lastRank = true
            if (!props.cascade) {
                treeList.value[index].checked = !treeList.value[index].checked
                _fixMultiple(index)
            }
            return;
        }
        // 子元素插入的索引位置
        const nextIndex = treeList.value.findIndex((itemT: any) => itemT.id === item.id)
        const newRank = item.rank + 1
        let parentId = []
        if (item.parentId.length > 0) {
            parentId = JSON.parse(JSON.stringify(item.parentId))
        }
        parentId.push(item.id)
        let sonarrId: any = []
        checkedChildren.forEach((itemC: any) => {
            const childObj = {
                id: itemC[props.idKey],
                name: itemC[props.nameKey],
                value: itemC[props.allKey],
                parentId: parentId, // 父级id数组
                sonarrId: [], //子级id数组
                rank: item.rank + 1, // 层级
                showChild: false, //子级是否显示
                show: true, // 自身是否显示
                checked: props.cascade ? item.checked : false, //是否选中
                lastRank: false, //是否末级
                children: 0
            }
            sonarrId.push(childObj.id)
            if (!treeList.value.some((itemT: any) => itemT.id === itemC[props.idKey])) {
                treeList.value.splice(nextIndex + 1, 0, childObj)
            }
        })
        item.sonarrId = sonarrId
    } else {
        //隐藏子集
        treeList.value.forEach((childItem: any, i: number) => {
            //隐藏所有子级
            if (childItem.parentId.includes(item.id)) {
                childItem.showChild = false;
                childItem.show = false
            }
        })
    }
    console.log(treeList.value);
}

const getOwn = (id: any, arr: any) => {
    let returnedItem: any = null
    //利用foreach循环遍历
    arr.forEach((item: any) => {
        //判断递归结束条件
        if (item[props.idKey] == id) {
            // 存储数据到空数组
            returnedItem = item
        } else if (item.children != null) {
            //递归调用
            getOwn(id, item.children);
        }
    })
    return returnedItem
}

watch(() => props.range, (list) => {
    if (list.length) {
        _initTree(list);
    }
});

watch(() => props.selectParent, () => {
    if (props.range.length) {
        _reTreeList();
    }
});

onMounted(() => {
    _initTree();
});

defineExpose({
    _show
})
</script>

<template>
    <view class="tree">
        <view class="tree-mask" :class="{ show: showTree }" @click="_maskClick"></view>
        <view class="tree-cnt" :class="{ show: showTree }" :style="{ background: props.isDark ? '#000000' : '#FFFFFF', color: props.isDark ? '#FFFFFF' : '#000000' }">
            <view class="tree-bar" :style="{ background: props.isDark ? '#000000' : '#FFFFFF', color: props.isDark ? '#FFFFFF' : '#000000', borderTop: '1rpx solid #f5f5f5' }">
                <view class="tree-bar-cancel" :style="{ color: props.isDark ? '#FFFFFF' : '#757575' }" hover-class="hover-c" @click="_cancel">
                    关闭
                </view>

                <view class="midInput" v-if="showSearch">
                    <input class="searchArea" @input="filterOp" :placeholder="'请输入' + title" :style="{ background: props.isDark ? '#323233' : '#EFEFEF' }" />
                    <icon class="searchIcon" type="search" />
                </view>

                <view class="tree-bar-title" v-else :style="{ color: titleColor }">{{ title }}</view>
                <view class="tree-bar-confirm" :style="{ color: confirmColor }" hover-class="hover-c" @click="_confirm">
                    确定
                </view>
            </view>

            <view class="tree-view" :style="{ background: props.isDark ? '#000000' : '#FFFFFF', color: props.isDark ? '#FFFFFF' : '#000000' }">
                <scroll-view class="tree-view-sc" scroll-y>
                    <block v-for="(item, index) in treeList" :key="index">
                        <view class="tree-item" v-if="item.isPickerShow == true || item.isPickerShow == undefined"
                            :style="{
                                paddingLeft: item.rank * 15 + 'px',
                                zIndex: item.rank * -1 + 50,
								color: props.isDark ? '#ffffff' : ''
                            }" :class="{
                            show: keyWord !== '' ? true : item.show,
                            last: item.lastRank,
                            showchild: item.showChild,
                        }">
                            <view class="tree-label" @click.stop="_treeItemTap(item, index)">
                                <image class="tree-icon"
                                    :src="item.lastRank ? lastIcon : item.showChild ? currentIcon : defaultIcon" />
                                {{ item.name }}
                            </view>

                            <view class="tree-check" @click.stop="_treeItemSelect(item, index)"
                                v-if="selectParent ? true : item.lastRank">
                                <view v-if="item.checked" class="tree-check-yes" :class="{ radio: !multiple }"
                                    :style="{ borderColor: confirmColor }">
                                    <view class="tree-check-yes-b" :style="{ backgroundColor: confirmColor }"></view>
                                </view>
                                <view v-else class="tree-check-no" :class="{ radio: !multiple }"
                                    :style="{ borderColor: confirmColor }"></view>
                            </view>
                        </view>
                    </block>
                </scroll-view>
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.tree-mask {
    position: fixed;
    top: 0rpx;
    right: 0rpx;
    bottom: 0rpx;
    left: 0rpx;
    z-index: 9998;
    background-color: rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: all 0.3s ease;
    visibility: hidden;
}

.tree-mask.show {
    visibility: visible;
    opacity: 1;
}

.tree-cnt {
    position: fixed;
    top: 0rpx;
    right: 0rpx;
    bottom: 0rpx;
    left: 0rpx;
    z-index: 9999;
    top: 360rpx;
    transition: all 0.3s ease;
    transform: translateY(100%);
}

.tree-cnt.show {
    transform: translateY(0);
}

.tree-bar {
    background-color: #fff;
    height: 100rpx;
    padding-left: 20rpx;
    padding-right: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    border-bottom-width: 1rpx !important;
    border-bottom-style: solid;
    border-bottom-color: #f5f5f5;
    font-size: 32rpx;
    color: #757575;
    line-height: 1;
}

.midInput {
    width: 64%;
    height: 30px;
    position: relative;
    line-height: 30px;
}

.searchArea {
    text-align: left;
    background-color: #efefef;
    border-radius: 20px;
    padding: 4px 10px;
}

.searchIcon {
    position: absolute;
    right: 5px;
    top: 0px;
    width: 30px;
    height: 30px;
    text-align: center;
    display: flex;
    align-items: center;
}

.tree-bar-confirm {
    color: #007aff;
}

.tree-view {
    position: absolute;
    top: 0rpx;
    right: 0rpx;
    bottom: 0rpx;
    left: 0rpx;
    top: 100rpx;
    background-color: #fff;
    padding-top: 20rpx;
    padding-right: 20rpx;
    padding-bottom: 20rpx;
    padding-left: 20rpx;
}

.tree-view-sc {
    height: 100%;
    overflow: hidden;
}

.tree-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 26rpx;
    color: #757575;
    line-height: 1;
    height: 0;
    opacity: 0;
    transition: 0.2s;
    position: relative;
    overflow: hidden;
}

.tree-item.show {
    height: 80rpx;
    opacity: 1;
}

.tree-item.showchild:before {
    transform: rotate(90deg);
}

.tree-item.last:before {
    opacity: 0;
}

.tree-icon {
    width: 26rpx;
    height: 26rpx;
    margin-right: 8rpx;
}

.tree-label {
    flex: 1;
    display: flex;
    align-items: center;
    height: 100%;
    line-height: 1.2;
}

.tree-check {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tree-check-yes,
.tree-check-no {
    width: 20px;
    height: 20px;
    border-top-left-radius: 20%;
    border-top-right-radius: 20%;
    border-bottom-right-radius: 20%;
    border-bottom-left-radius: 20%;
    border-top-width: 1rpx;
    border-left-width: 1rpx;
    border-bottom-width: 1rpx;
    border-right-width: 1rpx;
    border-style: solid;
    border-color: #007aff;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
}

/* 精准绘制一个细线对号 */
.tree-check-yes::after {
    content: "";
    position: absolute;
    width: 6px;
    height: 10px;
    border-right: 1px solid #007aff;
    border-bottom: 1px solid #007aff;
    transform: rotate(45deg);
    top: 13px;
}


.tree-check-yes-b {
    background: none;
    // width: 12px;
    // height: 12px;
    // border-top-left-radius: 20%;
    // border-top-right-radius: 20%;
    // border-bottom-right-radius: 20%;
    // border-bottom-left-radius: 20%;
    // background-color: #007aff;
}

.tree-check .radio {
    border-top-left-radius: 50%;
    border-top-right-radius: 50%;
    border-bottom-right-radius: 50%;
    border-bottom-left-radius: 50%;
}

.tree-check .radio .tree-check-yes-b {
    border-top-left-radius: 50%;
    border-top-right-radius: 50%;
    border-bottom-right-radius: 50%;
    border-bottom-left-radius: 50%;
}

.hover-c {
    opacity: 0.6;
}
</style>