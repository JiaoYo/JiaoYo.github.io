<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { reactive, ref, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { getSystemDate } from '@/utils/index';
import { fetchAddprojectTripRecord, fetchEditprojectTripRecord, fetchprojectTripRecord, fetchGetAllUserDataList, fetchGetPrjInfo } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';

const message = useMessage();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const loading = ref<boolean>(false);

const userShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    fuzzy: string;
    checkedUser: any;
}>({
    page: 1,
    limit: 100,
    total: 0,
    fuzzy: '',
    checkedUser: null
});

const userDataList = ref<any[]>([]);

const allUserDataList = ref<any[]>([]);

const model = reactive<{
    id: any;
    pid: any;
    traveler: any;
    travname: string;
    start: any;
    end: any;
}>({
    id: null,
    pid: null,
    traveler: null,
    travname: '',
    start: Date.now(),
    end: Date.now()
});

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshList'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取全部出差人
async function getAllUserDataList() {
    try {
        if (dataForm.page === 1) {
            userDataList.value = [];
            allUserDataList.value = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: dataForm.limit, usertypes: '2, 3, 9' });
        const list = (data.list || []).filter((u: any) => u.status !== 1);
        userDataList.value = userDataList.value.concat(list);
        allUserDataList.value = allUserDataList.value.concat(list);
        dataForm.total = Number(data.total);
    } catch (error) {
        console.error('获取全部出差人失败', error);
    }
}

// 打开出差人选择弹框
function handleLinkUserShowChange() {
    if (allUserDataList.value.length === 0) {
        getAllUserDataList();
    }
    userShow.value = true;
}

// 出差人刷新
function handleScrollUserRefreshChange() {
    triggered.value = true;
    dataForm.page = 1;
    getAllUserDataList();
    setTimeout(() => {
        triggered.value = false;
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    if (e.detail.direction === 'bottom' && allUserDataList.value.length < dataForm.total) {
        dataForm.page++;
        getAllUserDataList();
    }
}

// 关闭选择出差人弹框
function handleCloseChange() {
    userShow.value = false;
}

// 搜索
function handleSearchChange() {
    userDataList.value = allUserDataList.value.filter((item: any) => item.username.indexOf(dataForm.fuzzy) !== -1);
}

// 清除
function handleClearChange() {
    userDataList.value = allUserDataList.value;
}

// 选择出差人
function handleRadioSelectChange({ value }: { value: any }) {
    const user = userDataList.value.find((item: any) => value === item.id);
    model.traveler = value;
    model.travname = user ? user.username : '';
    userShow.value = false;
}

// 校验同一出差人日期是否重合（重合返回 true）
async function checkTripOverlap(traveler: any, start: string, end: string, excludeId: any): Promise<boolean> {
    try {
        let page = 1;
        const limit = 100;
        let total = Infinity;
        const records: any[] = [];
        while (records.length < total) {
            const data = await fetchprojectTripRecord({ pid: model.pid, page, limit });
            total = Number(data.total);
            records.push(...(data.list || []));
            if (!data.list || data.list.length < limit) break;
            page++;
        }
        return records.some((item: any) => {
            if (excludeId && Number(item.id) === Number(excludeId)) return false;
            if (Number(item.traveler) !== Number(traveler)) return false;
            if (!item.start || !item.end) return false;
            return start <= item.end && item.start <= end;
        });
    } catch (err) {
        console.error('校验出差日期重合失败', err);
        return false;
    }
}

async function handleSubmit() {
    if (model.traveler === null || model.traveler === undefined || model.traveler === '') {
        uni.showToast({ icon: 'none', title: '请选择出差人', duration: 1500 });
        return;
    }
    const start = getSystemDate(0, model.start);
    const end = getSystemDate(0, model.end);
    if (!start || !end) {
        uni.showToast({ icon: 'none', title: '请选择日期', duration: 1500 });
        return;
    }
    if (start > end) {
        uni.showToast({ icon: 'none', title: '结束日期不能早于开始日期', duration: 1500 });
        return;
    }
    loading.value = true;
    try {
        const overlap = await checkTripOverlap(model.traveler, start, end, model.id);
        if (overlap) {
            loading.value = false;
            uni.showToast({ icon: 'none', title: '该出差人在此日期段已有出差记录', duration: 2000 });
            return;
        }
        if (model.id) {
            await fetchEditprojectTripRecord([{ id: model.id, traveler: model.traveler, start, end,pid: model.pid }], model.pid);
        } else {
            await fetchAddprojectTripRecord([{ traveler: model.traveler, start, end ,pid: model.pid}], model.pid);
        }
        uni.showToast({
            icon: 'none',
            title: model.id ? '修改成功' : '新增成功',
            duration: 1500,
            complete: () => {
                loading.value = false;
                handleClickLeft(true);
            }
        });
    } catch (err) {
        console.error('提交出差记录失败', err);
        loading.value = false;
        uni.showToast({ icon: 'none', title: '提交失败', duration: 1500 });
    }
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    try {
        uni.createSelectorQuery()
            .select('.topFixedWrap')
            .boundingClientRect((rect: any) => {
                if (rect && rect.height !== undefined) {
                    topFixedHeight.value = rect.height;
                }
            })
            .exec();
    } catch (err) {
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad(async (options: any) => {
    // dtype === 2（无需调试）项目禁止所有子项的增删改
    try {
        const prjData = await fetchGetPrjInfo(Number(options.pid));
        if (Number(prjData.dtype) === 2) {
            uni.showToast({ title: '无需调试项目禁止子项操作', icon: 'none' });
            setTimeout(() => { uni.navigateBack(); }, 800);
            return;
        }
    } catch (error) {
        console.error('获取项目信息失败', error);
    }
    model.pid = Number(options.pid);
    model.id = options.id ? Number(options.id) : null;
    if (model.id) {
        model.traveler = options.traveler ? Number(options.traveler) : null;
        model.travname = options.travname ? decodeURIComponent(options.travname) : '';
        model.start = options.start ? new Date(String(options.start).replace(/-/g, '/')).getTime() : Date.now();
        model.end = options.end ? new Date(String(options.end).replace(/-/g, '/')).getTime() : Date.now();
        dataForm.checkedUser = model.traveler;
    }
    getAllUserDataList();
});

onReady(() => {
    recalcTopFixedHeight();
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-message-box />

        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow :title="model.id ? '编辑项目出差记录' : '新增项目出差记录'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view>
            <wd-input label="出差人" label-width="100px" disabled :model-value="model.travname" placeholder="请选择出差人">
                <template #suffix>
                    <wd-button icon="link" size="small" @click.stop="handleLinkUserShowChange">选择</wd-button>
                </template>
            </wd-input>
            <wd-datetime-picker type="date" v-model="model.start" align-right label="起始日期" label-width="100px" />
            <wd-datetime-picker type="date" v-model="model.end" align-right label="结束日期" label-width="100px" />

            <view class="footer">
                <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
            </view>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="userShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollUserRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-radio-group v-model="dataForm.checkedUser" shape="dot" @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in userDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.username }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 999;
    background-color: #FFFFFF;
    /* 保证内联元素正确换行 */
    box-sizing: border-box;
}

.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}

.radioCellWrap {
    :deep(.wd-cell__wrapper) {
        display: block !important;
    }
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}
</style>
