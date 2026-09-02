<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { v4 as uuidv4 } from "uuid";
import { fetchGetPrjCycleInfo, fetchSavePrjCycleInfo, fetchGetPrjCycleIdInfoByuuid, fetchUpdatePrjCycleInfo, fetchGetAllUserDataList, fetchSavePrjTechnicianInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const form = ref();
const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const prjCycleDate = ref<any[]>([Date.now(), Date.now() + 90 * 24 * 60 * 60 * 1000]);

const userShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

const userDataList = ref<any>([]);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    checkedUser: any;
}>({
    page: 1,
    limit: 100,
    total: 0,
    checkedUser: []
})

const prjForm = reactive({
    id: null,
    cycleId: null
})

const uuid = ref<string>(uuidv4());

const model = reactive<{
    prophase: string;
    procontact: string;
    starttime: string;
    endtime: string;
    notes: string;
    uname: string;
}>({
    prophase: '',
    procontact: '',
    starttime: String(getSystemDate(0, prjCycleDate.value[0])),
    endtime: String(getSystemDate(0, prjCycleDate.value[1])),
    notes: '',
    uname: ''
});

const rules: FormRules = {
    prophase: [
        {
            required: true,
            message: '请输入项目阶段',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入项目阶段');
                }
            }
        },
    ],
    procontact: [
        {
            required: false,
            message: '请输入联系方式',
            validator: (value: string) => {
                if (value) {
                    // if (!/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(value)) {
                    //     return Promise.reject('请输入正确的联系方式');
                    // } else {
                    //     return Promise.resolve();
                    // }
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入联系方式');
                }
            }
        },
    ]
};

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

function handleConfirmDateChange({ value }: { value: any }) {
    console.log(value)
    if (value && value.length > 0) {
        model.starttime = String(getSystemDate(0, value[0]));
        model.endtime = String(getSystemDate(0, value[1]));
    } else {
        model.starttime = "";
        model.endtime = "";
    }
}

// 获取项目周期基本信息
async function getPrjCycleInfo() {
    try {
        const data = await fetchGetPrjCycleInfo(Number(prjForm.cycleId));
        model.prophase = data.prophase;
        model.procontact = data.procontact;
        model.starttime = data.starttime;
        model.endtime = data.endtime;
        model.notes = data.notes;
        prjCycleDate.value = [getSystemDate(5, data.starttime), getSystemDate(5, data.endtime)];
    } catch (error) {
        console.log('获取项目周期基本信息失败', 'none');
    }
}

// 获取全部调试人员
async function getAllUserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            userDataList.value = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: dataForm.limit, usertypes: '2, 3' });
        userDataList.value = userDataList.value.concat(data.list);
        dataForm.total = Number(data.total);
    } catch (error) {
        console.error('获取全部调试人员失败', error);
    }
}

// 打开工程师选择弹框
async function handleLinkMemberShowChange() {
    userShow.value = true;
}

// 工程师刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.page = 1;
    getAllUserDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && userDataList.value.length < dataForm.total) {
        dataForm.page++;
        getAllUserDataList();
    }
}

// 关闭选择人员弹框
function handleCloseChange() {
    userShow.value = false;
}

// 选择调试工程师
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const names = userDataList.value.filter((item: any) => dataForm.checkedUser.includes(item.id)).map((item: any) => item.username);
    model.uname = names.join(", ");
}

// 提交
function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                loading.value = true;
                try {
                    if (prjForm.cycleId) {
                        let queryParams = [{
                            id: prjForm.cycleId,
                            pid: prjForm.id,
                            prophase: model.prophase,
                            procontact: model.procontact,
                            starttime: model.starttime,
                            endtime: model.endtime,
                            notes: model.notes
                        }];
                        const data = await fetchUpdatePrjCycleInfo(queryParams);
                        uni.showToast({
                            title: '修改项目周期成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = [{
                            pid: prjForm.id,
                            prophase: model.prophase,
                            procontact: model.procontact,
                            starttime: model.starttime,
                            endtime: model.endtime,
                            notes: model.notes,
                            uuid: uuid.value
                        }];
                        const data = await fetchSavePrjCycleInfo(queryParams);
                        if (dataForm.checkedUser.length > 0) {
                            getPrjCycleInfoByuuid();
                        } else {
                            uni.showToast({
                                title: '新增项目周期成功',
                                icon: 'none',
                                duration: 1500,
                                complete: () => {
                                    loading.value = false;
                                    handleClickLeft(true);
                                }
                            });
                        }
                    }
                } catch (err) {
                    loading.value = false;
                    if (prjForm.cycleId) {
                        console.error('修改项目周期失败', err);
                    } else {
                        console.error('新增项目周期失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

// 获取新增项目周期的id
async function getPrjCycleInfoByuuid() {
    try {
        const data = await fetchGetPrjCycleIdInfoByuuid(uuid.value);
        handleSavePidAndUidChange(data);
    } catch (error) {
        console.error('根据uuid获取项目周期失败', error);
    }
}

// 新增调试工程师的关联
async function handleSavePidAndUidChange(id: number) {
    try {
        let queryParams = dataForm.checkedUser.map((item: any) => {
            return {
                pid: id,
                uid: item
            }
        });
        const data = await fetchSavePrjTechnicianInfo(queryParams);
        uni.showToast({
            title: '新增项目周期成功',
            icon: 'none',
            duration: 1500,
            complete: () => {
                handleClickLeft(true);
            }
        });
    } catch (error) {
        console.error('根据uuid获取项目周期失败', error);

    }
}

onLoad(async (options: any) => {
    prjForm.id = options.pid;
    prjForm.cycleId = options.id;
    await getAllUserDataList();
    if (prjForm.cycleId) {
        getPrjCycleInfo();
    }
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="prjForm.cycleId ? '修改项目周期' : '新增项目周期'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="项目阶段" label-width="100px" prop="prophase" required clearable v-model="model.prophase" placeholder="请输入项目阶段" />
                <wd-input label="联系方式" label-width="100px" prop="procontact" clearable v-model="model.procontact" placeholder="请输入联系方式" />
                <wd-datetime-picker v-model="prjCycleDate" label="起止时间" label-width="100px" type="date" @confirm="handleConfirmDateChange"></wd-datetime-picker>
                <wd-input label="调试工程师" label-width="100px" prop="uname" disabled v-model="model.uname" placeholder="请选择调试工程师">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkMemberShowChange">调试工程师</wd-button>
                    </template>
                </wd-input>
                <wd-textarea label="备注" label-width="100px" type="textarea" prop="notes" clearable v-model="model.notes" placeholder="请输入备注" />
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup v-model="userShow" position="left" @close="handleCloseChange">
            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="margin-top: 90rpx; height: calc(100vh - 90rpx);">
                <wd-cell-group border>
                    <wd-checkbox-group v-model="dataForm.checkedUser" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in userDataList" :key="index" :title="item.username" center>
                            <view class="custom-txt">
                                <wd-checkbox :modelValue="item.id" custom-style="margin: 0;"></wd-checkbox>
                            </view>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>
            </scroll-view>
        </wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}

.custom-txt {
    color: black;
    width: 40vw;
}
</style>