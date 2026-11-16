<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { uploadFile } from '@/utils/uploadFile';
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref, computed, onMounted, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { fetchGetUploadFileTokenInfo, fetchGetMeetingMinutesInfo, fetchSaveMeetingMinutesInfo, fetchUpdateMeetingMinutesInfo, fetchGetAllUserDataList } from '@/service/index';
import { hasPermission } from '@/utils/index';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const userType = ref<number>(uni.getStorageSync('usertype'));

const userShow = ref<boolean>(false);

const triggered = ref<boolean>(false);

const loading = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const userIdNameObj: Record<number, string> = {};

const userTypeMap: any = {
    0: [0, 1, 2, 3, 4, 5, 6, 9],
    1: [0, 1],
    2: [0, 2, 3, 9],
    3: [0, 2, 3],
    4: [0, 4],
    5: [0, 5],
    6: [0, 6],
	9: [0, 2, 3]
};

const getFilteredMeetingTypes = (type: number): { label: string, value: number }[] => {
    const allTypes = [
        { value: 0, label: '技术部每日例会' },
        { value: 1, label: '技术部周例会' },
        { value: 2, label: '研发周例会(网络安全)' },
        { value: 3, label: '研发周例会(数据通讯)' },
        { value: 4, label: '生产部周例会' },
        { value: 5, label: '销售周例会' },
        { value: 6, label: '管理层周例会' }
    ];

    if (type === 0 || type === 4) return allTypes; // 全部

    const filterMap: any = {
        0: [0, 1, 2, 3, 4, 5, 6],
        1: [5],
        2: [0, 1],
        3: [0, 1],
        4: [0, 1, 2, 3, 4, 5, 6],
        5: [2, 3],
        6: [4]
    };

    return allTypes.filter(item => filterMap[type]?.includes(item.value));
};

const dataForm = reactive<{
    page: number;
    total: number;
    fuzzy: string;
    userDataList: any;
    allUserDataList: any;
    checkedUser: any;
    deleteUserList: any;
}>({
    page: 1,
    total: 0,
    fuzzy: '',
    userDataList: [],
    allUserDataList: [],
    checkedUser: [],
    deleteUserList: []
})

const mettingminutesColumns = ref<{ label: string, value: number }[]>(getFilteredMeetingTypes(userType.value))

const model = reactive<{
    id: number;
    title: string;
    mtype: number;
    mdbtime: any;
    musers: string;
    mettingContent: string;
    mettingContentList: any;
    fl1: string;
    fl2: string;
    fl3: string;
    fileList: any;
    file2List: any;
    file3List: any;
	re1: string;
	re2: string;
	re3: string;
	// notes: string;
}>({
    id: 0,
    title: '',
    mtype: userType.value === 0 || userType.value === 4 || userType.value === 2 || userType.value === 3 ? 0 : userType.value === 1 ? 5 : userType.value === 5 ? 2 : userType.value === 6 ? 4 : 0,
    mdbtime: '',
    musers: '',
    mettingContent: '',
    mettingContentList: [
        {
            person: '',
            proname: '',
            desc: '',
            problem: ''
        }
    ],
    fl1: '',
    fl2: '',
    fl3: '',
    fileList: [],
    file2List: [],
    file3List: [],
	re1: '',
	re2: '',
	re3: '',
	// notes: ''
})

function getToday() {
    const date = new Date();
    if (model.mtype === 0) {
        date.setHours(17, 30, 0, 0);
    } else if (model.mtype === 1) {
        date.setHours(8, 30, 0, 0);
    } else if (model.mtype === 2) {
        date.setHours(9, 0, 0, 0);
    } else if (model.mtype === 3) {
        date.setHours(9, 0, 0, 0);
    } else if (model.mtype === 4) {
        date.setHours(8, 30, 0, 0);
    } else if (model.mtype === 5) {
        date.setHours(8, 30, 0, 0);
    } else if (model.mtype === 6) {
        date.setHours(8, 30, 0, 0);
    }
    return date;
}

// 选择会议类型
function handleSelectUtypeChange() {
    model.mdbtime = new Date(getToday()).getTime();
}

function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListPrjMettingmunutes'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 打开人员弹框
function handleLinkUserShowChange() {
    userShow.value = true;
}

// 清除
function handleClearUserFuzzyChange() {
    // model.page = 1;
    // getAlluserDataList();
    dataForm.userDataList = dataForm.allUserDataList;
}

// 搜索
function handleSearchUserFuzzyChange() {
    // model.page = 1;
    // getAlluserDataList();
    dataForm.userDataList = dataForm.allUserDataList.filter((item: any) => item.username.indexOf(dataForm.fuzzy) !== -1);
}

// 获取用户分页数据
async function getAlluserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (dataForm.page === 1) {
            dataForm.userDataList = [];
            dataForm.allUserDataList = [];
            dataForm.deleteUserList = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: 100, usertypes: userTypeMap[userType.value].join(",") });
        dataForm.total = Number(data.total);
        dataForm.userDataList = dataForm.userDataList.concat(data.list).filter((item: any) => item.status === 0);
        dataForm.deleteUserList = dataForm.deleteUserList.concat(data.list).filter((item: any) => item.status === 1);
        dataForm.allUserDataList = dataForm.allUserDataList.concat(data.list).filter((item: any) => item.status === 0);
        dataForm.allUserDataList.forEach((item: any) => {
            userIdNameObj[item.id] = item.username;
        });
    } catch (error) {
        console.error('获取用户分页数据失败', error);
    }
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.page = 1;
    getAlluserDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && dataForm.allUserDataList.length + dataForm.deleteUserList.length < dataForm.total) {
        dataForm.page++;
        getAlluserDataList();
    }
}

// 关闭弹出层
function handleUserCloseChange() {
    userShow.value = false;
}

// 选择用户
function handleCheckboxSelectChange({ value }: { value: any }) {
    // const names = dataForm.checkedUser.map((id: any) => userIdNameObj[id]).filter(Boolean);
    // model.musers = names.join(", ");
    model.musers = value.join(",");
}

// 添加调试人员
function handleAddDebugInfoChange(index: number) {
    model.mettingContentList.push({
        person: '',
        proname: '',
        desc: '',
        problem: model.mettingContentList[index].problem || ''
    })
}

// APP上传文件(附件1)
async function handleUploadFile1ClickChange(data: any) {
	model.fileList = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.fileList.length > 0) {
        let flag = true;
        // for (let index = 0; index < model.fileList.length; index++) {
        //     if (model.fileList[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            model.fileList = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    model.fileList.forEach(async(file: any) => {
		model.re1 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl1 = response.data;
        //     model.fileList = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件1
async function handleRemoveFileClickChange() {
	model.re1 = "";
	model.fileList = [];
}

// APP上传文件(附件2)
async function handleUploadFile2ClickChange(data: any) {
	model.file2List = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.file2List.length > 0) {
        let flag = true;
        // for (let index = 0; index < model.file2List.length; index++) {
        //     if (model.file2List[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            model.file2List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    model.file2List.forEach(async(file: any) => {
		model.re2 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl2 = response.data;
        //     model.file2List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件2
async function handleRemoveFile2ClickChange() {
	model.re2 = "";
	model.file2List = [];
}

// APP上传文件(附件3)
async function handleUploadFile3ClickChange(data: any) {
	model.file3List = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.file3List.length > 0) {
        let flag = true;
        // for (let index = 0; index < model.file3List.length; index++) {
        //     if (model.file3List[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            model.file3List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    model.file3List.forEach(async(file: any) => {
		model.re3 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl3 = response.data;
        //     model.file3List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件3
async function handleRemoveFile3ClickChange() {
	model.re3 = "";
	model.file3List = [];
}

// 获取详情
async function getMettingMinutesInfo() {
    const data = await fetchGetMeetingMinutesInfo(model.id);
    console.log('data', data);
    model.title = data.mtopic;
	// model.notes = data.con1;
    if (data.mtype === 0) {
        model.mettingContentList = data.con2 ? JSON.parse(data.con2) || [] : [];
    } else {
        model.mettingContent = data.con2;
    }
    model.mdbtime = Number(getSystemDate(5, data.mdbtime));
    model.mtype = data.mtype;
    model.musers = data.musers.replace(/、/g, ',');
    model.fl1 = data.fl1;
    model.fl2 = data.fl2;
    model.fl3 = data.fl3;
	model.re1 = "";
	model.re2 = "";
	model.re3 = "";
	if (model.re1) {
		let re1Array = model.re1.split("?");
		model.re1 = re1Array[re1Array.length - 1];
	}
	
	if (model.re2) {
		let re2Array = model.re2.split("?");
		model.re2 = re2Array[re2Array.length - 1];
	}
	
	if (model.re3) {
		let re3Array = model.re3.split("?");
		model.re3 = re3Array[re3Array.length - 1];
	}
    dataForm.checkedUser = model.musers.split(",");
}

/**
 * 上传一组文件，确保最终每个 file 都有 url
 */
function handleUploadFileListChange(fileList: any[]): Promise<any[]> {
	if (!fileList || fileList.length === 0) {
		return Promise.resolve([]);
	}

	const tasks = fileList.map(file => {
		// 跳过无效文件
		if (!file) return Promise.resolve(file);

		// 已是线上地址，直接跳过
		if (file.url && file.url.startsWith('https://pictures.linkqi.cn')) {
			return Promise.resolve(file);
		}

		// 需要上传
		return new Promise(resolve => {
			uploadFile(
				file,
				'',
				(response, f) => {
					f.url = response.data;
					resolve(f);
				},
				(error, f) => {
					console.error('上传失败:', error);
					resolve(f); // ⚠️ 不 reject，保证后续还能执行
				}
			);
		});
	});

	return Promise.all(tasks);
}

async function handleSubmitChange() {
    try {
        let flag: boolean = true;
        if (!model.title) {
            uni.showToast({
                title: '请输入标题',
                icon: 'none',
                duration: 1500
            });
            return false
        }
        if (!model.musers) {
            uni.showToast({
                title: '请输入参会人员',
                icon: 'none',
                duration: 1500
            });
            return false
        }
        if (model.mtype === 0) {
            if (model.mettingContentList.length === 0) {
                uni.showToast({
                    title: '请输入会议信息',
                    icon: 'none',
                    duration: 1500
                });
                return false
            } else {
                for (let index = 0; index < model.mettingContentList.length; index++) {
                    const item = model.mettingContentList[index];
                    if (!item.person || !item.proname || !item.desc) {
                        flag = false;
                        break;
                    }
                }
            }
            if (!flag) {
                uni.showToast({
                    title: '请补全会议信息',
                    icon: 'none',
                    duration: 1500
                });
                return false
            }
        } else {
            if (!model.mettingContent) {
                uni.showToast({
                    title: '请输入会议信息',
                    icon: 'none',
                    duration: 1500
                });
                return false
            }
        }

        if (model.id) {
            if (!hasPermission('project:Meeting:update')) {
                uni.showToast({
                    title: '暂无修改会议纪要权限，请联系管理员',
                    icon: 'none',
                    duration: 1500
                });
                return false
            }
        } else {
            if (!hasPermission('project:Meeting:insert')) {
                uni.showToast({
                    title: '暂无新增会议纪要权限，请联系管理员',
                    icon: 'none',
                    duration: 1500
                });
                return false
            }
        }
		const [res1, res2, res3] = await Promise.all([
			handleUploadFileListChange(model.fileList),
			handleUploadFileListChange(model.file2List),
			handleUploadFileListChange(model.file3List),
		]);
		model.fl1 = res1.length > 0 ? res1[0].url : '';
		model.fl2 = res2.length > 0 ? res2[0].url : '';
		model.fl3 = res3.length > 0 ? res3[0].url : '';
        loading.value = true;
        let queryParams = model.id ? [
            {
                id: model.id,
                mtopic: model.title,
				// con1: model.notes,
                con2: model.mtype === 0 ? JSON.stringify(model.mettingContentList) : model.mettingContent,
                mdbtime: getSystemDate(6, model.mdbtime),
                mtype: model.mtype,
                musers: model.musers,
                fl1: model.fl1,
                fl2: model.fl2,
                fl3: model.fl3
            }
        ] : [
            {
                id: model.id,
                mtopic: model.title,
				// con1: model.notes,
                con2: model.mtype === 0 ? JSON.stringify(model.mettingContentList) : model.mettingContent,
                mdbtime: getSystemDate(6, model.mdbtime),
                mtype: model.mtype,
                musers: model.musers,
                fl1: model.fl1,
                fl2: model.fl2,
                fl3: model.fl3
            }
        ];

        const data = model.id ? await fetchUpdateMeetingMinutesInfo(queryParams) : await fetchSaveMeetingMinutesInfo(queryParams);
        uni.showToast({
            title: '提交成功',
            icon: 'none',
            duration: 2000,
            complete: () => {
                loading.value = false;
                handleClickLeft(true);
            }
        });
    } catch (error) {
        console.error(model.id ? '修改会议纪要失败' : '新增会议纪要失败', error);
        loading.value = false;
    }
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

onLoad(async (options: any) => {
    await getAlluserDataList();
    model.id = Number(options.id);
    if (model.id) {
        getMettingMinutesInfo();
    } else {
        model.mdbtime = new Date(getToday()).getTime();
    }
    // 有些平台 onLoad -> DOM 还没渲染好，延后执行一次计算
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
});

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
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow :title="model.id ? '修改会议纪要' : '新增会议纪要'" safe-area-inset-top placeholder fixed :bordered="false"
                @click-left="handleClickLeft"></wd-navbar>
        </view>

        <view
            style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">标题</view>
        </view>
        <view
            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '0 20rpx', padding: '10rpx 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-input clearable v-model="model.title" placeholder="请输入标题" no-border></wd-input>
        </view>

        <view
            style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">会议时间</view>
        </view>

        <view
            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-datetime-picker v-model="model.mdbtime" placeholder="请选择会议时间" />
        </view>

        <view
            style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">会议类型</view>
        </view>
        <view
            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '0 20rpx', padding: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <!-- <wd-input clearable v-model="model.mtype" placeholder="请输入会议方式" no-border></wd-input> -->
            <wd-select-picker v-model="model.mtype" :show-confirm="false" label="会议类型" :columns="mettingminutesColumns"
                type="radio" :z-index="100" @confirm="handleSelectUtypeChange" />
        </view>

        <view style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0 10px 10px; gap: 0 20rpx 0 0; width: calc(100vw - 40rpx);">
            <view
                style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap;">
                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                <view style="margin-left: 10rpx; font-weight: bolder;">参会人员</view>
            </view>
            <wd-button icon="link" size="small" @click="handleLinkUserShowChange">关联参会人员</wd-button>
        </view>

        <view
            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.musers" readonly placeholder="请输入参会人员"></wd-textarea>
        </view>

        <view
            style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">会议信息</view>
        </view>

        <view v-if="model.mtype === 0">
            <view
                :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: index === 0 ? '0 20rpx 20rpx' : '20rpx', borderRadius: '20rpx', overflow: 'hidden' }"
                v-for="(item, index) in model.mettingContentList" :key="index">
                <wd-input clearable v-model="item.person" placeholder="请输入调试人员" no-border label="调试人员"
                    label-width="70px"></wd-input>
                <wd-input clearable v-model="item.proname" placeholder="请输入项目名称" no-border label="项目名称"
                    label-width="70px"></wd-input>
                <wd-textarea clearable v-model="item.desc" placeholder="请输入工作描述" label="工作描述"
                    label-width="70px"></wd-textarea>
                <wd-input clearable v-model="item.problem" placeholder="请输入遇到的问题" no-border label="遇到的问题"
                    label-width="70px"></wd-input>

                <view
                    style="display: flex; justify-content: flex-end; align-items: center; gap: 10rpx; padding-bottom: 20rpx; margin-right: 10rpx;">
                    <wd-button hairline type="error" size="small" @click="model.mettingContentList.splice(index, 1)"
                        v-if="model.mettingContentList.length > 1">删除</wd-button>
                    <wd-button hairline size="small" type="primary" @click="handleAddDebugInfoChange(index)">添加</wd-button>
                </view>
            </view>
        </view>

        <view v-else :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-textarea clearable v-model="model.mettingContent" placeholder="请输入会议信息"></wd-textarea>
        </view>
		
		<!-- <view style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0 10px 10px; gap: 0 20rpx 0 0; width: calc(100vw - 40rpx);">
		    <view
		        style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap;">
		        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
		        <view style="margin-left: 10rpx; font-weight: bolder;">备注</view>
		    </view>
		</view>
		
		<view
		    :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
		    <wd-textarea clearable v-model="model.notes" placeholder="请输入备注"></wd-textarea>
		</view> -->

        <view
            style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">附件1</view>
        </view>

        <view
            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-input type="text" label="附件1" label-width="40px" v-model="model.re1" placeholder="请选择附件" center>
                <template #suffix>
					<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
						<CjxUpload v-model="model.fileList" @change="handleUploadFile1ClickChange">
							<template #default>
								<wd-button icon="cloud-upload" size="small">上传附件</wd-button>
							</template>
						</CjxUpload>
						
						<wd-icon v-if="model.re1" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFileClickChange"></wd-icon>
					</view>
                </template>
            </wd-input>
        </view>

        <view
            style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">附件2</view>
        </view>
        <view
            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-input type="text" label="附件2" label-width="40px" v-model="model.re2" placeholder="请选择附件" center>
                <template #suffix>
					<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
						<CjxUpload v-model="model.file2List" @change="handleUploadFile2ClickChange">
							<template #default>
								<wd-button icon="cloud-upload" size="small">上传附件</wd-button>
							</template>
						</CjxUpload>
						
						<wd-icon v-if="model.re2" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile2ClickChange"></wd-icon>
					</view>
                </template>
            </wd-input>
        </view>

        <view
            style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
            <view style="width: 5px; height: 15px; background: #0055FE;"></view>
            <view style="margin-left: 10rpx; font-weight: bolder;">附件3</view>
        </view>
        <view
            :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', overflow: 'hidden' }">
            <wd-input type="text" label="附件3" label-width="40px" v-model="model.re3" placeholder="请选择附件" center>
                <template #suffix>
                    <view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
						<CjxUpload v-model="model.file3List" @change="handleUploadFile3ClickChange">
							<template #default>
								<wd-button icon="cloud-upload" size="small">上传附件</wd-button>
							</template>
						</CjxUpload>
						
						<wd-icon v-if="model.re3" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile3ClickChange"></wd-icon>
					</view>
                </template>
            </wd-input>
        </view>

        <view class="buttonWrap"
            v-if="hasPermission('project:Meeting:insert') || hasPermission('project:Meeting:update')">
            <wd-button hairline type="primary" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" :loading="loading"
                @click="handleSubmitChange">提交</wd-button>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="userShow" position="left" @close="handleUserCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchUserFuzzyChange" @cancel="handleSearchUserFuzzyChange" @clear="handleClearUserFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-cell-group border>
                    <wd-checkbox-group v-model="dataForm.checkedUser" @change="handleCheckboxSelectChange">
                        <wd-cell v-for="(item, index) in dataForm.userDataList" :key="index" :title="item.username" center>
                            <wd-checkbox :modelValue="item.username"></wd-checkbox>
                        </wd-cell>
                    </wd-checkbox-group>
                </wd-cell-group>
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
    /* 可选：微阴影让固定区更明显 */
    /* box-shadow: 0 1px 6px rgba(0,0,0,0.06); */
}

:deep(.wd-upload__evoke) {
    margin-left: 20rpx !important;
    margin-top: 20rpx !important;
    margin-bottom: 20rpx !important;
}

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
</style>