<script lang="ts" setup>
import { useToast } from 'wot-design-uni';
import { reactive, ref, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onPageScroll, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import ZhTree from '@/components/zh-tree/tree.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    username: string;
}>({
    page: 1,
    limit: 50,
    username: '',
});

const gqTreeRef = ref(null);
const gqVisible = ref(false);

const range = ref([
    {
        id: "100",
        name: "测试100",
        value: "冗余值",
        children: [
            {
                id: "110",
                name: "测试110",
                value: "冗余值",
                pid: "100",
                children: [{
                    id: "111",
                    name: "测试111",
                    value: "冗余值",
                    pid: "110",
                }]
            },
            {
                id: "112",
                name: "测试112",
                value: "冗余值",
                pid: "100",
                children: [
                    {
                        id: "113",
                        name: "测试113",
                        value: "冗余值",
                        pid: "112",
                    },
                    {
                        id: "114",
                        name: "测试114",
                        value: "冗余值",
                        pid: "112",
                    }
                ]
            }
        ]
    },
    {
        id: "200",
        name: "测试200",
        value: "冗余值",
        children: [{
            id: "220",
            name: "测试220",
            value: "冗余值",
            pid: "200",
            children: [{
                id: "222",
                name: "测试222",
                value: "冗余值",
                pid: "220",
            }]
        }]
    },
    {
        id: "300",
        name: "测试300",
        value: "冗余值"
    }
]);

const axiosReturnRes = ref<any>([
    {
        id: "111",
        name: "测试111",
        value: "冗余值",
    },
    {
        id: "113",
        name: "测试113",
        value: "冗余值",
    },
    {
        id: "222",
        name: "测试222",
        value: "冗余值",
    },
    {
        id: "300",
        name: "测试300",
        value: "冗余值"
    },
]);

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 清除
function handleClearChange() {
    dataForm.page = 1;
    dataList.value = [];
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    dataList.value = [];
}

function treeCancel(e: any) {
    console.log("你点击了取消");
    console.log(e);
    gqVisible.value = false;
}

function treeConfirm(e: any) {
    console.log("你点击了确定");
    console.log('e', e);
    gqVisible.value = false;
    dataForm.username = "";
    e.forEach((item: any) => {
        dataForm.username += item.name + ', ';
    });
    dataForm.username = dataForm.username.substring(0, dataForm.username.length - 1);
}

function showTree2() {
    //打开选择器
    gqVisible.value = true;
    nextTick(() => {
        if (gqTreeRef.value) {
            (gqTreeRef.value as any)._show();
        }
    });
}

function deepCheckValue(options: any, values: any, idKey: any, childKey: any) {
    return options.map((i: any) => {
        if (values.indexOf(i[idKey]) > -1) {
            i['isGqAddChecked'] = true
        } else {
            i['isGqAddChecked'] = false
        }
        if (i[childKey] && i[childKey].length > 0) {
            deepCheckValue(i[childKey], values, idKey, childKey)
        }
        return i
    })
}

onLoad(() => {

});

onShow(() => {
    const idKeysResult = axiosReturnRes.value.map((x: any) => {
        return x.id
    })
    const options = JSON.parse(JSON.stringify(range.value))
    const newOptions = deepCheckValue(options, idKeysResult, 'id', 'children')
    range.value = [...newOptions]
})

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    dataForm.page = 1;

    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (dataList.value.length < total.value) {
        dataForm.page++;
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="团队日志" safe-area-inset-top placeholder fixed :bordered="false" right-text="筛选"
            @click-left="handleClickLeft" @click-right="showTree2">
            <template #right>
                <wd-text bold text="筛选" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                <wd-icon name="filter" custom-style="marginLeft: 8rpx" />
            </template>
        </wd-navbar>

        <wd-search disabled v-model="dataForm.username" custom-class="wdSearchContainer" placeholder="请选择用户"
            :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索"
            @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

        <view>
            <ZhTree v-if="gqVisible" ref="gqTreeRef" :isDark="isDark" :range="range" idKey="id" nameKey="name" allKey="value" childKey="children"
                pidKey="pid" :showSearch="true" :multiple="true" :cascade="true" :selectParent="true" :foldAll="false"
                confirmColor="#007aff" cancelColor="#757575" title="用户名" titleColor="#757575" @cancel="treeCancel"
                @confirm="treeConfirm">
            </ZhTree>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.list-item {
    // padding: 5rpx;
    color: #464646;
    border-bottom: 2rpx dashed #ccc;
}

.action {
    height: 100%;
}

.button {
    display: inline-block;
    padding: 0 11px;
    height: 100%;
    color: white;
    line-height: 42px;
}
</style>
