<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { hasPermission, getSystemDate } from '@/utils/index';
import { fetchGetPrjInfo, fetchGetPrjDataList, fetchSavePrjmojiInfo, fetchUpdatePrjmojiInfo, fetchGetPrjmojiInfo, fetchGetContractsPageByPrjId } from '@/service/index';

const form = ref();
const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const prjIdNameObj: Record<number, string> = {};

const prjForm = reactive({
    id: 0
})

const prjShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

const contractPrjShow = ref<boolean>(false);

const contractPrjTriggered = ref<boolean>(false);

const model = reactive<{
	id: any;
    page: number;
    total: number;
    fuzzy: string;
    prjDataList: any;
    checkedPrj: any;
	prjName: string;
	contractPage: number;
	contractTotal: number;
	contractFuzzy: string;
	contractPrjDataList: any;
	allContractPrjDataList: any;
	checkedContractPrj: any;
    cusname: string;
    token: string;
    passward: string;
    longitude: string;
    latitude: string;
	pro: string;
	expiare: any;
	jsonfmt: string;
	csvfmt: string;
	notes: string;
}>({
	id: null,
    page: 1,
    total: 0,
    fuzzy: '',
    prjDataList: [],
    checkedPrj: null,
    prjName: '',
	contractPage: 1,
	contractTotal: 0,
	contractFuzzy: '',
	contractPrjDataList: [],
	allContractPrjDataList: [],
	checkedContractPrj: null,
    cusname: '',
	token: '',
	passward: '',
	longitude: '',
	latitude: '',
	pro: '',
	expiare: Number(getSystemDate(5, undefined, 365)),
	jsonfmt: '',
	csvfmt: '',
	notes: ''
})

const rules: FormRules = {
    cusname: [
        {
            required: true,
            message: '请输入客户名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入客户名称');
                }
            }
        },
    ],
    token: [
        {
            required: true,
            message: '请输入气象信息token',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入气象信息token');
                }
            }
        },
    ],
    passward: [
        {
            required: true,
            message: '请输入气象信息password',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入气象信息password');
                }
            }
        },
    ],
    longitude: [
        {
            required: true,
            message: '请输入经度',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入经度');
                }
            }
        },
    ],
    latitude: [
        {
            required: true,
            message: '请输入纬度',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入纬度');
                }
            }
        },
    ],
	jsonfmt: [
        {
            required: true,
            message: '请输入JSON格式',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入JSON格式');
                }
            }
        },
    ],
	csvfmt: [
	    {
	        required: true,
	        message: '请输入CSV格式',
	        validator: (value: string) => {
	            if (value) {
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入CSV格式');
	            }
	        }
	    },
	]
};

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrjDaily'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取项目信息
async function getPrjBaseInfo() {
    const data = await fetchGetPrjInfo((prjForm.id as number));
    model.prjName = data ? data.proname : '';
    model.fuzzy = data ? data.proname : '';
    model.page = 1;
    getPrjDataList();
}

// 打开弹出层
function handleLinkPrjShowChange() {
    prjShow.value = true;
}

// 清除
function handleClearChange() {
    model.page = 1;
    getPrjDataList();
}

// 搜索
function handleSearchChange() {
    model.page = 1;
    getPrjDataList();
}

// 获取项目分页数据
async function getPrjDataList() {
    if (!hasPermission('project:Info:select')) {
        return
    }
    if (model.page === 1) {
        model.prjDataList = [];
    }
    try {
        const data = await fetchGetPrjDataList({ page: model.page, limit: 100, fuzzy: model.fuzzy });
        model.total = Number(data.total);
        model.prjDataList = model.prjDataList.concat(data.list);
        model.prjDataList.forEach((item: any) => {
            prjIdNameObj[item.id] = item.proname;
        });
    } catch (error) {
        console.error('获取项目分页数据失败', error);
    }
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    model.page = 1;
    getPrjDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.prjDataList.length < model.total) {
        model.page++;
        getPrjDataList();
    }
}

// 关闭弹出层
function handleCloseChange() {
    prjShow.value = false;
}

// 选择项目
function handleCheckboxSelectChange({ value }: { value: any }) {
    console.log('value', value);
    model.prjName = prjIdNameObj[model.checkedPrj];
	prjShow.value = false;
	model.contractPage = 1;
	getContractPrjDataList();
}

// 清除选择项
function handleClearPrjChange() {
    model.prjName = '';
    model.checkedPrj = null;
}

// 打开弹出层(合同项目名称)
function handleLinkContractPrjShowChange() {
	if (!model.prjName) {
		uni.showToast({
			icon: 'none',
			title: '请先选择项目',
			duration: 1500
		})
		return
	}
    contractPrjShow.value = true;
}

// 清除(合同项目名称)
function handleClearContractPrjFuzzyChange() {
	model.contractPrjDataList = model.allContractPrjDataList;
}

// 搜索(合同项目名称)
function handleSearchContractPrjFuzzyChange() {
	if (model.contractFuzzy) {
		model.contractPrjDataList = model.allContractPrjDataList.filter((item: any) => item.contractname.toLocaleLowerCase().indexOf(model.contractFuzzy) !== -1);
	} else {
		model.contractPrjDataList = model.allContractPrjDataList;
	}
}

// 获取合同项目分页数据(合同项目名称)
async function getContractPrjDataList() {
    if (model.contractPage === 1) {
        model.contractPrjDataList = [];
		model.allContractPrjDataList = [];
    }
    try {
        const data = await fetchGetContractsPageByPrjId({ page: model.contractPage, limit: 100, id: model.checkedPrj });
        model.contractTotal = Number(data.total);
        model.contractPrjDataList = model.contractPrjDataList.concat(data.list);
		model.allContractPrjDataList = model.allContractPrjDataList.concat(data.list);
		if (model.id) {
			for (var i = 0; i < model.contractPrjDataList.length; i++) {
				if (model.contractPrjDataList[i].contractname === model.pro) {
					model.checkedContractPrj = model.pro;
					break;
				}
			}
		}
    } catch (error) {
        console.error('获取项目分页数据失败', error);
    }
}

// 刷新(合同项目名称)
function handleScrollRefreshContractPrjChange() {
    contractPrjTriggered.value = true;
    model.contractPage = 1;
    getContractPrjDataList();
    setTimeout(() => {
        contractPrjTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(合同项目名称)
function handleScrolltolowerContractPrjChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.contractPrjDataList.length < model.contractTotal) {
        model.contractPage++;
        getContractPrjDataList();
    }
}

// 关闭弹出层(合同项目名称)
function handleCloseContractPrjChange() {
    contractPrjShow.value = false;
}

// 选择合同项目名称(合同项目名称)
function handleRadioContractPrjSelectChange({ value }: { value: any }) {
    console.log('value', value);
    model.pro = value;
	contractPrjShow.value = false;
}

// 清除选择项(合同项目名称)
function handleClearContractPrjChange() {
    model.pro = '';
    model.checkedContractPrj = null;
}

async function getInfo() {
	const data = await fetchGetPrjmojiInfo(model.id);
	prjForm.id = data.pid;
	model.cusname = data.cusname;
	model.pro = data.pro;
	model.token = data.token;
	model.passward = data.passward;
	model.longitude = data.longitude;
	model.latitude = data.latitude;
	model.expiare = Number(getSystemDate(5, data.expiare));
	model.checkedPrj = Number(prjForm.id);
	model.notes = data.notes;
	model.jsonfmt = data.jsonfmt;
	model.csvfmt = data.csvfmt;
	getPrjBaseInfo();
	model.contractPage = 1;
	getContractPrjDataList();
}

async function handleSubmitChange() {
    if (!model.prjName) {
        uni.showToast({
            icon: 'none',
            title: '请选择项目',
            duration: 1500
        })
        return false
    }
	if (!model.cusname) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入客户名称',
	        duration: 1500
	    })
	    return false
	}
    if (!model.token) {
        uni.showToast({
            icon: 'none',
            title: '请输入气象信息token',
            duration: 1500
        })
        return false
    }
	if (!model.passward) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入气象信息password',
	        duration: 1500
	    })
	    return false
	}
	if (!model.longitude) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入经度',
	        duration: 1500
	    })
	    return false
	}
	if (!model.latitude) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入纬度',
	        duration: 1500
	    })
	    return false
	}
	if (!model.pro) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入墨迹合同项目名称',
	        duration: 1500
	    })
	    return false
	}
	if (!model.jsonfmt) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入JSON格式',
	        duration: 1500
	    })
	    return false
	}
	if (!model.csvfmt) {
	    uni.showToast({
	        icon: 'none',
	        title: '请输入CSV格式',
	        duration: 1500
	    })
	    return false
	}
    if (!hasPermission('project:moji:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无权限，请联系管理员',
            duration: 1500
        })
        return false
    }
    loading.value = true;
    try {
        // 获取对应名称
        let queryParams = model.id ? [{
			id: model.id,
            pid: model.checkedPrj,
			cusname: model.cusname,
			pro: model.pro,
			token: model.token,
			passward: model.passward,
			longitude: model.longitude,
			latitude: model.latitude,
			notes: model.notes,
			jsonfmt: model.jsonfmt,
			csvfmt: model.csvfmt,
			expiare: String(getSystemDate(0, (model.expiare as any)))
        }] : [{
            pid: model.checkedPrj,
            cusname: model.cusname,
			pro: model.pro,
            token: model.token,
            passward: model.passward,
            longitude: model.longitude,
            latitude: model.latitude,
			notes: model.notes,
			jsonfmt: model.jsonfmt,
			csvfmt: model.csvfmt,
            expiare: String(getSystemDate(0, (model.expiare as any)))
        }];
        const data = model.id ? await fetchUpdatePrjmojiInfo(queryParams) : await fetchSavePrjmojiInfo(queryParams);
        if (model.id) {
			uni.showToast({
				title: '修改气象信息成功',
				icon: 'none',
				duration: 1500,
				complete: () => {
					loading.value = false;
					handleClickLeft(true);
				}
			});
		} else {
			uni.showToast({
				title: '新增气象信息成功',
				icon: 'none',
				duration: 1500,
				complete: () => {
					loading.value = false;
					handleClickLeft(true);
				}
			});
		}
    } catch (err) {
        console.error(model.id ? '修改气象信息失败' : '新增气象信息失败', err);
        loading.value = false;
    }
}

onLoad((options: any) => {
    if (options.id) {
		model.id = options.id;
		getInfo();
    } else {
        getPrjDataList();
    }
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="model.id ? '修改气象信息' : '新增气象信息'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft"></wd-navbar>

        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
            <view style="display: flex; align-items: center;">
                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                <view style="margin-left: 10rpx; font-weight: bolder;">项目名称</view>
            </view>
            <view>
                <wd-button icon="link" size="small" @click="handleLinkPrjShowChange">关联项目</wd-button>
            </view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 20rpx', borderRadius: '20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
            <wd-textarea clearable readonly v-model="model.prjName" placeholder="请选择项目名称" no-border auto-height custom-class="dailyLinkedPrjWrap"></wd-textarea>
            <wd-button v-if="model.prjName" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearPrjChange"></wd-button>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">客户名称</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden', padding: '10rpx 20rpx' }">
            <wd-input clearable v-model="model.cusname" placeholder="请输入客户名称" no-border></wd-input>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">气象信息token</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden', padding: '10rpx 20rpx' }">
            <wd-input clearable v-model="model.token" placeholder="请输入气象信息token" no-border></wd-input>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">气象信息password</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden', padding: '10rpx 20rpx' }">
            <wd-input clearable v-model="model.passward" placeholder="请输入气象信息password" no-border></wd-input>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">经度</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden', padding: '10rpx 20rpx' }">
            <wd-input type="number" clearable v-model="model.longitude" placeholder="请输入经度" no-border></wd-input>
        </view>

        <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">纬度</view>
        </view>
        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden', padding: '10rpx 20rpx' }">
            <wd-input type="number" clearable v-model="model.latitude" placeholder="请输入纬度" no-border></wd-input>
        </view>
		
		<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
		    <view style="display: flex; align-items: center;">
		        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		        <view style="margin-left: 10rpx; font-weight: bolder;">合同项目名称</view>
		    </view>
		    <view>
		        <wd-button icon="link" size="small" @click="handleLinkContractPrjShowChange">关联合同项目</wd-button>
		    </view>
		</view>
		
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 20rpx', borderRadius: '20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
		    <wd-textarea v-model="model.pro" placeholder="请选择或输入墨迹合同项目名称" no-border auto-height custom-class="dailyLinkedPrjWrap"></wd-textarea>
		    <wd-button v-if="model.pro" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearContractPrjChange"></wd-button>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">过期时间</view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
			<wd-datetime-picker type="date" prop="expiare" v-model="model.expiare" placeholder="请选择过期时间" />
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">JSON格式</view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 0', borderRadius: '20rpx' }">
		    <wd-textarea clearable v-model="model.jsonfmt" placeholder="请输入JSON格式" no-border></wd-textarea>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">CSV格式</view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 0', borderRadius: '20rpx' }">
		    <wd-textarea clearable v-model="model.csvfmt" placeholder="请输入CSV格式" no-border></wd-textarea>
		</view>
		
		<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
		    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		    <view style="margin-left: 10rpx; font-weight: bolder;">备注</view>
		</view>
		<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', margin: '0 20rpx', padding: '5rpx 0', borderRadius: '20rpx' }">
		    <wd-textarea clearable v-model="model.notes" placeholder="请输入备注" no-border></wd-textarea>
		</view>

        <view class="buttonWrap">
            <wd-button hairline type="primary" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" :loading="loading" @click="handleSubmitChange">提交</wd-button>
        </view>

		<!-- 项目名称 -->
        <wd-popup closable custom-style="width: 90vw; margin-top: 85rpx;" v-model="prjShow" position="left" @close="handleCloseChange">
            <!-- <view v-for="(item, index) in model.prjDataList" :key="index" class="custom-txt">
                {{ item.proname }}
            </view> -->
            <wd-gap height="70rpx" />

            <wd-search v-model="model.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-radio-group v-model="model.checkedPrj" shape="dot" @change="handleCheckboxSelectChange">
					<wd-radio v-for="(prjItem, prjIndex) in model.prjDataList" :key="prjIndex" class="radioCellWrap" :value="prjItem.id">{{ prjItem.proname }}</wd-radio>
				</wd-radio-group>
            </scroll-view>
        </wd-popup>
		
		<!-- 合同项目名称 -->
		<wd-popup closable custom-style="width: 90vw; margin-top: 85rpx;" v-model="contractPrjShow" position="left" @close="handleCloseContractPrjChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="model.contractFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchContractPrjFuzzyChange" @cancel="handleSearchContractPrjFuzzyChange" @clear="handleClearContractPrjFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="contractPrjTriggered" @refresherrefresh="handleScrollRefreshContractPrjChange" @scrolltolower="handleScrolltolowerContractPrjChange" style="height: calc(100vh - 260rpx);">
		        <wd-radio-group v-model="model.checkedContractPrj" shape="dot" @change="handleRadioContractPrjSelectChange">
					<wd-radio v-for="(contractPrjItem, contractPrjIndex) in model.contractPrjDataList" :key="contractPrjIndex" class="radioCellWrap" :value="contractPrjItem.contractname">{{ contractPrjItem.contractname }}</wd-radio>
				</wd-radio-group>
		    </scroll-view>
		</wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.buttonWrap {
    display: flex;
    justify-content: center;
    align-items: center;
    width: calc(100vw - 40rpx);
    margin: 30rpx 40rpx 30rpx 0;
    padding: 0 0 40rpx 20rpx;
}

.darkButtonWrap {
    width: 100% !important;
}

.lightButtonWrap {
    width: 100% !important;
}

:deep(.wd-cell__left) {
    flex: 6 !important;
}

.dailyLinkedPrjWrap {
    width: calc(100% - 100rpx) !important;

    :deep(.wd-textarea__inner) {
        padding-left: 0 !important;
    }
}

.radioCellWrap {
    padding: 10rpx 20rpx !important;
}

:deep(.wd-radio) {
    margin-right: 0 !important;
}

:deep(.wd-radio__label) {
	width: calc(100% - 60rpx) !important;
	text-align: left !important;
}
</style>