<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref } from 'vue';
import { hasPermission } from '@/utils/index';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetPrjTechnicianDetailInfo, fetchSavePrjTechnicianInfo, fetchUpdatePrjTechnicianInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const loading = ref<boolean>(false);

const userShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

const userDataList = ref<any>([]);

const allUserDataList = ref<any>([]);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    checkedUser: any
}>({
    page: 1,
    limit: 100,
    total: 0,
    checkedUser: []
})

const model = reactive<{
    pid: number | null;
    did: number | null;
    uid: number;
    uname: string;
    enotes: string;
}>({
    pid: null,
    did: null,
    uid: 0,
    uname: '',
    enotes: ''
});

const rules: FormRules = {
    uname: [
        {
            required: true,
            message: '请选择调试人员',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择调试人员');
                }
            }
        },
    ]
};

const form = ref();
const { themeVars, theme } = useTheme();

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrjdebug'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取全部调试人员
async function getAllUserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            userDataList.value = [];
            allUserDataList.value = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: dataForm.limit, usertypes: '2, 3, 9' });
        console.log('data获取全部调试人员', data);
        userDataList.value = userDataList.value.concat(data.list);
        allUserDataList.value = allUserDataList.value.concat(data.list);
        dataForm.total = Number(data.total);
    } catch (error) {
        console.error('获取全部调试人员失败', error);
    }
}

// 获取项目调试人员详情
async function getPrjdebugmemberInfo() {
    try {
        const data = await fetchGetPrjTechnicianDetailInfo(Number(model.did));
        console.log('data获取项目调试人员详情', data);
        model.uname = data.uname;
        model.enotes = data.enotes;
        model.uid = data.uid;
    } catch (error) {
        console.error('获取项目调试人员详情失败', error);
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

// 选择调试工程师(修改)
function handleRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    userShow.value = false;
    // 获取对应名称
    const names = userDataList.value.find((item: any) => value === item.id);
    model.uname = names ? names.username : '';
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                loading.value = true;
                try {
                    if (model.did) {
                        let queryParams = [{
                            id: model.did,
                            pid: model.pid,
                            uid: model.uid,
                            enotes: model.enotes
                        }];
                        const data = await fetchUpdatePrjTechnicianInfo(queryParams);
                        uni.showToast({
                            title: '修改调试工程师成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = dataForm.checkedUser.map((item: any) => {
                            return {
                                pid: model.pid,
                                uid: item,
                                enotes: model.enotes
                            }
                        });
                        const data = await fetchSavePrjTechnicianInfo(queryParams);
                        uni.showToast({
                            title: '新增调试工程师成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    }

                } catch (err) {
                    loading.value = false;
                    if (model.did) {
                        console.error('修改调试工程师失败', err);
                    } else {
                        console.error('新增调试工程师失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

onLoad((options: any) => {
    model.pid = options.pid;
    model.did = options.did;
    dataForm.page = 1;
    dataForm.total = 0;
    userDataList.value = [];
    getAllUserDataList();
    if (model.did) {
        getPrjdebugmemberInfo();
    }
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="model.did ? '修改调试工程师' : '新增调试工程师'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="工程师" label-width="100px" prop="username" required disabled clearable v-model="model.uname" placeholder="请选择工程师">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click="handleLinkMemberShowChange">选择工程师</wd-button>
                    </template>
                </wd-input>
                <wd-textarea label="备注" label-width="100px" type="textarea" v-model="model.enotes" placeholder="请输入备注" clearable prop="enotes" />
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup :custom-style="`width: 90vw;`" v-model="userShow" position="left" @close="handleCloseChange">
            <scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="margin-top: 90rpx; height: calc(100vh - 90rpx);">
                <wd-cell-group border v-if="!model.did">
                    <wd-checkbox-group v-model="dataForm.checkedUser" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in userDataList" :key="index" :title="item.username" center>
                            <view class="custom-txt">
                                <wd-checkbox :modelValue="item.id" custom-style="margin: 0;"></wd-checkbox>
                            </view>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>

                <wd-radio-group v-model="model.uid" shape="dot" v-else @change="handleRadioSelectChange">
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
.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}

.custom-txt {
    color: black;
    width: 40vw;
}

:deep(.radioCellWrap) {
    padding: 10rpx !important;
}
</style>