import { ref, computed } from 'vue';

export interface TabbarItem {
    name: string;
    value: number | null;
    active: boolean;
    title: string;
    icon: string;
}

// 超级管理员
export const tabbarSuperItems = ref<TabbarItem[]>([
    { name: 'index', value: null, active: false, title: '首页', icon: 'home' },
    { name: 'project', value: null, active: true, title: '项目', icon: 'list' },
    { name: 'map', value: null, active: false, title: '工程调试单', icon: 'check-rectangle' },
    { name: 'me', value: null, active: false, title: '我', icon: 'user' },
]);

// 销售
export const tabbarSalesItems = ref<TabbarItem[]>([
    // { name: 'index', value: null, active: false, title: '首页', icon: 'home' },
    { name: 'project', value: null, active: true, title: '项目', icon: 'list' },
    { name: 'map', value: null, active: false, title: '工程调试单', icon: 'check-rectangle' },
    { name: 'me', value: null, active: false, title: '我', icon: 'user' },
]);

// 工程负责人、调试工程师
export const tabbarItems = ref<TabbarItem[]>([
    { name: 'index', value: null, active: false, title: '首页', icon: 'home' },
    { name: 'project', value: null, active: true, title: '项目', icon: 'list' },
    { name: 'map', value: null, active: false, title: '待办', icon: 'check-rectangle' },
    { name: 'me', value: null, active: false, title: '我', icon: 'user' },
]);

// 综合管理
export const tabbarComprehensivemanageItems = ref<TabbarItem[]>([
    { name: 'index', value: null, active: false, title: '首页', icon: 'home' },
    { name: 'project', value: null, active: true, title: '项目', icon: 'list' },
    { name: 'me', value: null, active: false, title: '我', icon: 'user' },
]);

// 研发、生产
export const tabbarElseItems = ref<TabbarItem[]>([
    { name: 'index', value: null, active: false, title: '首页', icon: 'home' },
    { name: 'project', value: null, active: true, title: '项目', icon: 'list' },
    // { name: 'map', value: null, active: false, title: '轨迹', icon: 'attach' },
    { name: 'me', value: null, active: false, title: '我', icon: 'user' },
]);

export function useTabbar() {
    const tabbarList = computed(() => uni.getStorageSync('usertype') === 0 ? tabbarSuperItems.value : uni.getStorageSync('usertype') === 1 ? tabbarSalesItems.value : (uni.getStorageSync('usertype') === 2 || uni.getStorageSync('usertype') === 3) ? tabbarItems.value : uni.getStorageSync('usertype') === 4 ? tabbarComprehensivemanageItems.value : tabbarElseItems.value);
    // const tabbarList = computed(() => tabbarItems.value);

    const activeTabbar = computed(() => {
        const item = tabbarList.value.find((item) => item.active);
        return item || tabbarList.value[0];
    });

    const getTabbarItemValue = (name: string) => {
        const item = tabbarList.value.find((item) => item.name === name);
        return item && item.value ? item.value : null;
    };

    const setTabbarItem = (name: string, value: number) => {
        const tabbarItem = tabbarList.value.find((item) => item.name === name);
        if (tabbarItem) {
            tabbarItem.value = value;
        }
    };

    const setTabbarItemActive = (name: string) => {
        tabbarList.value.forEach((item) => {
            if (item.name === name) {
                item.active = true;
            } else {
                item.active = false;
            }
        });
    };

    return {
        tabbarList,
        activeTabbar,
        getTabbarItemValue,
        setTabbarItem,
        setTabbarItemActive,
    };
}
