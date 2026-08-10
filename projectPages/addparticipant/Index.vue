<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref, onMounted, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { hasPermission } from '@/utils/index';
import { fetchGetPrjDataList, fetchGetProjectParticipantInfo, fetchSaveProjectParticipantInfo, fetchUpdateProjectParticipantInfo, fetchGetAllUserDataList, fetchGetPrjInfo } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const message = useMessage();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const userShow = ref<boolean>(false);

const userDataList = ref<any>([]);

const allUserDataList = ref<any>([]);

const prjShow = ref<boolean>(false);

const prjDataList = ref<any>([]);

const userType = ref<number>(uni.getStorageSync('usertype'));

const triggered = ref<boolean>(false);

const prjTriggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    fuzzy: string;
    checkedUser: any;
    prjPage: number;
    prjLimit: number;
    prjTotal: number;
    prjFuzzy: string;
    checkedPrj: any;
}>({
    page: 1,
    limit: 100,
    total: 0,
    fuzzy: '',
    checkedUser: null,
    prjPage: 1,
    prjLimit: 100,
    prjTotal: 0,
    prjFuzzy: '',
    checkedPrj: null
})

const model = reactive<{
	id: any;
    prjName: string;
    uname: string;
}>({
	id: null,
    prjName: '',
    uname: ''
});

const rules: FormRules = {
	uname: [
		{
			required: true,
			message: '请选择参与人',
		}
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

// 获取项目参与人详情
async function getParticipantInfo() {
    const data = await fetchGetProjectParticipantInfo(Number(model.id));
    dataForm.checkedPrj = data.pid;
    dataForm.checkedUser = data.participant;
    model.uname = data.prtcname;
	const data1 = await fetchGetPrjInfo(Number(data.pid));
	dataForm.prjFuzzy = data1.proname;
	model.prjName = data1.proname;
    getAllUserDataList();
    getAllPrjDataList();
}

// 清除
function handleClearChange() {
    userDataList.value = allUserDataList.value;
}

// 搜索
function handleSearchChange() {
    userDataList.value = allUserDataList.value.filter((item: any) => item.username.indexOf(dataForm.fuzzy) !== -1);
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
        userDataList.value = userDataList.value.concat(data.list);
        allUserDataList.value = allUserDataList.value.concat(data.list);
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
function handleScrollDebuggerRefreshChange() {
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
    if (e.detail.direction === 'bottom' && allUserDataList.value.length < dataForm.total) {
        dataForm.page++;
        getAllUserDataList();
    }
}

// 关闭选择人员弹框
function handleCloseChange() {
    userShow.value = false;
}

// 选择调试工程师（新增）
function handleCheckSelectChange({ value }: { value: any }) {
    const names = userDataList.value.filter((item: any) => value.indexOf(item.id) !== -1).map((nameItem: any) => {
		return nameItem.username
	});
    model.uname = names.length > 0 ? names.join(",") : '';
}

// 选择调试工程师(修改)
function handleRadioSelectChange({ value }: { value: any }) {
    const names = userDataList.value.find((item: any) => value === item.id);
    model.uname = names ? names.username : '';
    userShow.value = false;
}

// 清除项目
function handleClearPrjChange() {
    dataForm.prjPage = 1;
    getAllPrjDataList();
}

// 搜索项目
function handleSearchPrjChange() {
    dataForm.prjPage = 1;
    getAllPrjDataList();
}

// 获取项目
async function getAllPrjDataList() {
    if (dataForm.prjPage === 1) {
        prjDataList.value = [];
    }
    try {
        const data = await fetchGetPrjDataList({ page: dataForm.prjPage, limit: dataForm.prjLimit, fuzzy: dataForm.prjFuzzy });
        prjDataList.value = prjDataList.value.concat(data.list);
        dataForm.prjTotal = Number(data.total);
    } catch (error) {
        console.error('获取项目失败', error);
    }
}

// 打开项目弹框
async function handleLinkPrjShowChange() {
    prjShow.value = true;
}

// 刷新项目
function handleScrollPrjRefreshChange() {
    prjTriggered.value = true;
    dataForm.prjPage = 1;
    getAllPrjDataList();
    setTimeout(() => {
        prjTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(项目)
function handleScrollPrjtolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && prjDataList.value.length < dataForm.prjTotal) {
        dataForm.prjPage++;
        getAllPrjDataList();
    }
}

// 关闭项目弹框
function handleClosePrjChange() {
    prjShow.value = false;
}

// 选择项目
function handleRadioSelectPrjChange({ value }: { value: any }) {
    const names = prjDataList.value.find((item: any) => value === item.id);
    model.prjName = names ? names.proname : null;
    prjShow.value = false;
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
                    if (model.id) {
                        let queryParams = [{
                            id: model.id,
                            pid: dataForm.checkedPrj,
                            participant: dataForm.checkedUser,
                        }];
                        message
                        .confirm({
                            msg: '确定要修改项目参与人吗？',
                            title: '提示',
                            confirmButtonProps: {
                                type: 'error',
                            },
                        })
                        .then(async () => {
                            const data = await fetchUpdateProjectParticipantInfo(queryParams);
                            uni.showToast({
                                title: '修改项目参与人成功',
                                icon: 'none',
                                duration: 1500,
                                complete: () => {
                                    loading.value = false;
                                    handleClickLeft(true);
                                }
                            });
                        })
                        .catch(() => {
                            console.log('点击了取消按钮');
                            loading.value = false;
                        });
                    } else {
                        let queryParams = dataForm.checkedUser.map((item: any) => {
							return {
								pid: dataForm.checkedPrj,
								participant: item
							}
						});
                        const data = await fetchSaveProjectParticipantInfo(queryParams);
                        uni.showToast({
                            title: '新增项目参与人成功',
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
                    if (model.id) {
                        console.error('修改项目参与人失败', err);
                    } else {
                        console.error('新增项目参与人失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    // use createSelectorQuery 获取真实高度（适配小程序/APP/H5）
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
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad(async(options: any) => {
    dataForm.checkedPrj = Number(options.pid);
    model.id = options.id;
    if (model.id) {
        getParticipantInfo();
    } else {
		const data = await fetchGetPrjInfo(Number(options.pid));
		dataForm.prjFuzzy = data.proname;
		model.prjName = data.proname;
		dataForm.checkedUser = [];
        await getAllUserDataList();
        await getAllPrjDataList();
    }
});

onReady(() => {
    recalcTopFixedHeight();
})

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
    // 可监听窗口尺寸变更（H5 情况），小屏旋转/resize 时重新计算
    try {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', recalcTopFixedHeight);
        }
    } catch (e) { /* ignore */ }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow :title="model.id ? '修改项目参与人' : '新增项目参与人'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="项目" label-width="100px" prop="prjName" disabled v-model="model.prjName" placeholder="请选择项目">
					<template #suffix>
						<wd-button icon="link" size="small" @click.stop="handleLinkPrjShowChange">项目</wd-button>
					</template>
				</wd-input>
				<wd-input label="参与人" label-width="100px" prop="uname" disabled v-model="model.uname" placeholder="请选择参与人">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkMemberShowChange">参与人</wd-button>
                    </template>
                </wd-input>

                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="prjShow" position="left" @close="handleClosePrjChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.prjFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchPrjChange" @cancel="handleSearchPrjChange" @clear="handleClearPrjChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="prjTriggered" @refresherrefresh="handleScrollPrjRefreshChange" @scrolltolower="handleScrollPrjtolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-radio-group v-model="dataForm.checkedPrj" shape="dot" @change="handleRadioSelectPrjChange">
                    <wd-cell v-for="(item, index) in prjDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.proname }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="userShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <view v-if="model.id">
				<scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollDebuggerRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
				    <wd-radio-group v-model="dataForm.checkedUser" shape="dot" @change="handleRadioSelectChange">
				        <wd-cell v-for="(item, index) in userDataList" :key="index" custom-class="radioCellWrap">
				            <view class="custom-txt">
				                <wd-radio :value="item.id">{{ item.username }}</wd-radio>
				            </view>
				        </wd-cell>
				    </wd-radio-group>
				</scroll-view>
			</view>
			
			<view v-else>
				<scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollDebuggerRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
					<wd-cell-group border>
					    <wd-checkbox-group v-model="dataForm.checkedUser" @change="handleCheckSelectChange">
					        <wd-cell v-for="(item, index) in userDataList" :key="index" :title="item.username" center>
					            <wd-checkbox :modelValue="item.id"></wd-checkbox>
					        </wd-cell>
					    </wd-checkbox-group>
					</wd-cell-group>
				</scroll-view>
			</view>
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
    /* 可选：微阴影让固定区更明显 */
    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
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