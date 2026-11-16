<script setup lang="ts">
import { ref, watch, defineProps, onMounted, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { getType } from '@/utils/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import { useTabbar } from '@/composables/useTabbar';
import { useLargeArrayStore } from '@/store/useDataStore';

const store = useLargeArrayStore();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

const props = defineProps<{ text: string[] | Ref<string[]> }>();

const textArray = ref<string[]>([]);

const projectContractArray = ref<any[]>([]);

const handleNextChange = (index: number) => {
    console.log('展示下一条，index: ', index);
    console.log('文本是：' + textArray.value[index]);
}

const handleClickNoticeBarChange = ({ text, index }: { text: string, index: number }) => {
    console.log(text);
    console.log(index);
    // if (projectContractArray.value[index].hasOwnProperty('cid')) {
    //     uni.navigateTo({
    //         url: '/projectPages/adddebugbusiness/Index?pid=' + projectContractArray.value[index].pid + '&id=' + projectContractArray.value[index].cid
    //     })
    // } else if (projectContractArray.value[index].hasOwnProperty('pid')) {
    //     uni.navigateTo({
    //         url: '/projectPages/contractpage/Index?id=' + projectContractArray.value[index].pid
    //     })
    // }
    if (projectContractArray.value[index].hasOwnProperty('messageType')) {
		if (projectContractArray.value[index].messageType === 'debug') {
			uni.navigateTo({
			    url: '/projectPages/projectdetail/Index?pid=' + projectContractArray.value[index].proid + '&activeTab=2'
			})
		} else {
			uni.navigateTo({
			    url: '/mePages/aftersalemanage/Index?comp=' + encodeURIComponent(projectContractArray.value[index].comp)
			})
		}
    } else {
        if (projectContractArray.value[index].type === 0) {
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            if (currentPage.route === 'pages/project') {
                // 当前已经在项目页面，直接更新数据
                // 假设项目页面有接收数据的方法
                uni.$emit('projectChanged', {
                    projectname: encodeURIComponent(projectContractArray.value[index].name)
                });
            } else {
                setTabbarItemActive('project');
                uni.setStorageSync('projectname', encodeURIComponent(projectContractArray.value[index].name));
                uni.switchTab({
                    url: '/pages/project'
                })
            }
        } else if (projectContractArray.value[index].type === 1) {
            uni.navigateTo({
                url: '/projectPages/projectdetail/Index?pid=' + projectContractArray.value[index].proid + '&activeTab=2'
            })
        } else if (projectContractArray.value[index].type === 2) {
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            if (currentPage.route === 'pages/project') {
                // 当前已经在项目页面，直接更新数据
                // 假设项目页面有接收数据的方法
                uni.$emit('projectChanged', {
                    projectname: encodeURIComponent(projectContractArray.value[index].projectname)
                });
            } else {
                setTabbarItemActive('project');
                uni.setStorageSync('projectname', encodeURIComponent(projectContractArray.value[index].projectname));
                uni.switchTab({
                    url: '/pages/project'
                })
            }
        } else if (projectContractArray.value[index].type === 3) {
            uni.navigateTo({
                url: '/projectPages/projectdetail/Index?pid=' + projectContractArray.value[index].proid + '&activeTab=2'
            })
        } else if (projectContractArray.value[index].type === 4) {
            uni.navigateTo({
                url: '/projectPages/projectdetail/Index?pid=' + projectContractArray.value[index].proid + '&activeTab=2'
            })
        }
    }

    textArray.value = [];
    projectContractArray.value = [];
}

onMounted(() => {
    uni.$off('user-logout');
    uni.$on('user-logout', () => {
        console.log('退出了');
        textArray.value = [];
        projectContractArray.value = [];
    })
});

watch(() => props.text, (n: any) => {
    if (n && n.value) {
        let newObject = JSON.parse(n.value);
        if (getType(newObject) === 'object') {
            if (newObject.hasOwnProperty('messageType')) {
				if (newObject.messageType === 'debug') {
					textArray.value.push(`项目名称: ${newObject.proname}   您有待调试任务, 请注意查看! `);
					projectContractArray.value = projectContractArray.value.concat([newObject]);
				} else {
					if (newObject.type === 0) {
						// textArray.value.push(`您有新的售后信息待审核, 请及时查看! `);
						// projectContractArray.value = projectContractArray.value.concat(newObject.data);
						newObject.data.forEach((item: any) => {
						    textArray.value.push(`您有新的售后信息: ${item.comp}  待审核, 请注意查看! `);
						});
						projectContractArray.value = projectContractArray.value.concat(newObject.data.map((newItem: any) => {
						    return {
						        type: newObject.type,
								messageType: newObject.messageType,
						        ...newItem
						    }
						}));
					} else {
						// textArray.value.push(`您有新的售后信息已审核通过, 请及时查看! `);
						// projectContractArray.value = projectContractArray.value.concat(newObject.data);
						newObject.data.forEach((item: any) => {
						    textArray.value.push(`您有新的售后信息: ${item.comp}  已审核通过, 请注意查看! `);
						});
						projectContractArray.value = projectContractArray.value.concat(newObject.data.map((newItem: any) => {
						    return {
						        type: newObject.type,
								messageType: newObject.messageType,
						        ...newItem
						    }
						}));
					}
				}
            } else {
                if (newObject.type === 0) {
					store.addItem(newObject.data);
                    textArray.value.push(`项目 [${newObject.name}] 待审核, 请注意查看! `);
                    projectContractArray.value = projectContractArray.value.concat([newObject.data]);
                } else if (newObject.type === 1) {
					store.addItem(newObject.data);
                    textArray.value.push(`项目 [${newObject.name}] 中有待审核任务, 请注意查看! `);
                    projectContractArray.value = projectContractArray.value.concat([newObject.data]);
                } else if (newObject.type === 2) {
                    newObject.data.forEach((item: any) => {
                        textArray.value.push(`项目名称: ${item.projectname}  待审核, 请注意查看! `);
                    });
                    projectContractArray.value = projectContractArray.value.concat(newObject.data.map((newItem: any) => {
						store.addItem({
                            type: newObject.type,
                            ...newItem
                        });
                        return {
                            type: newObject.type,
                            ...newItem
                        }
                    }));
                } else if (newObject.type === 3) {
                    newObject.data.forEach((item: any) => {
                        textArray.value.push(`项目名称: ${item.projectname}   调试业务名称: ${item.debugname}   待审核, 请注意查看! `);
                    });
                    projectContractArray.value = projectContractArray.value.concat(newObject.data.map((newItem: any) => {
						store.addItem({
						    type: newObject.type,
						    ...newItem
						});
                        return {
                            type: newObject.type,
                            ...newItem
                        }
                    }));
                } else if (newObject.type === 4) {
                    textArray.value.push(`项目名称: ${newObject.name}  有申请调试任务待通过, 请注意查看! `);
                    projectContractArray.value = projectContractArray.value.concat(newObject.data.map((newItem: any) => {
						store.addItem({
                            type: newObject.type,
                            ...newItem
                        });
                        return {
                            type: newObject.type,
                            ...newItem
                        }
                    }));
                }
            }
            textArray.value = Array.from(new Set(textArray.value));
            // projectContractArray.value.push(newObject);
            // if (newObject.hasOwnProperty('reviewname') && newObject.reviewname === 'contract') {
            //     newObject.contract.forEach((dataItem: string) => {
            //         textArray.value.push(`项目 [${newObject.project}]   中有新增合同, 合同名称 [${dataItem}],请注意查看! `);
            //     });
            // } else {
            //     textArray.value.push(`项目 [${newObject.project}] ,合同名称 [${newObject.contract}]  中有未审核任务,请注意查看! `);
            // }
        }
    } else {
        textArray.value = [];
    }
}, { immediate: true, deep: true });
</script>

<template>
	<wd-config-provider :theme="theme">
		<wd-notice-bar v-if="textArray.length > 0" closable :text="textArray" custom-class="noticeBar" @close="textArray = []; projectContractArray = [];" @click="handleClickNoticeBarChange" @next="handleNextChange" />
	</wd-config-provider>
</template>

<style lang="scss" scoped>
.noticeBar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 999;
    width: 100vw;
	border-radius: 0 !important;
}

.wot-theme-dark {
	:deep(.wd-notice-bar) {
		background: #332b1f !important;
	}
}
</style>