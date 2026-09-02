<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { computed, reactive, ref, onMounted, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { getSystemDate, hasPermission } from '@/utils/index';
import { fetchGetUploadFileTokenInfo, fetchGetDebugEquipmentDataList, fetchGetDebugBusinessInfo, fetchSaveDebugBusinessInfo, fetchUpdateDebugBusinessInfo, fetchGetAllUserDataList, fetchGetPrjWeightDataList, fetchGetPrjMemberDataList } from '@/service/index';
import { onReady, onLoad } from '@dcloudio/uni-app';
import { BASE_URL, QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';

const form = ref();

const { themeVars, theme } = useTheme();

const message = useMessage();

const loading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const prjForm = reactive({
    id: null,
    businessId: null
})

const userShow = ref<boolean>(false);

const userDataList = ref<any>([]);

const allUserDataList = ref<any>([]);

const contactShow = ref<boolean>(false);

const contactDataList = ref<any>([]);

const weightShow = ref<boolean>(false);

const weightDataList = ref<any>([]);

const userType = ref<number>(uni.getStorageSync('usertype'));

const triggered = ref<boolean>(false);

const contactTriggered = ref<boolean>(false);

const debuggerTriggered = ref<boolean>(false);

const debugEquipmentShow = ref<boolean>(false);

const debugEquipmentDataList = ref<any>([]);

const debuggerEquipmentTriggered = ref<boolean>(false);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const dataForm = reactive<{
    page: number;
    limit: number;
    total: number;
    fuzzy: string;
    checkedUser: any;
    contactPage: number;
    contactLimit: number;
    contactTotal: number;
    contactFuzzy: string;
    checkedContact: any;
    weightPage: number;
    weightLimit: number;
    weightTotal: number;
    weightFuzzy: string;
    checkedWeight: any;
	debugEquipmentPage: number;
	debugEquipmentLimit: number;
	debugEquipmentTotal: number;
	debugEquipmentFuzzy: string;
	checkedDebugEquipment: any;
}>({
    page: 1,
    limit: 100,
    total: 0,
    fuzzy: '',
    checkedUser: null,
    contactPage: 1,
    contactLimit: 100,
    contactTotal: 0,
    contactFuzzy: '',
    checkedContact: null,
    weightPage: 1,
    weightLimit: 100,
    weightTotal: 0,
    weightFuzzy: '',
    checkedWeight: null,
	debugEquipmentPage: 1,
	debugEquipmentLimit: 100,
	debugEquipmentTotal: 0,
	debugEquipmentFuzzy: '',
	checkedDebugEquipment: null
})

const statusList = ref<any[]>(userType.value === 3 ? [
    {
        label: '待调试',
        value: 0
    },
    {
        label: '实施中',
        value: 1
    },
    {
        label: '待审核',
        value: 2
    },
] : [
    {
        label: '待调试',
        value: 0
    },
    {
        label: '实施中',
        value: 1
    },
    {
        label: '待审核',
        value: 2
    },
    {
        label: '审核完成',
        value: 3
    }
]);

const model = reactive<{
    debugname: string;
    docker: string;
    dockcharge: string;
    dockcontact: string;
    debugresult: string;
    defaultStatus: number;
    status: number;
    notes: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    dtypename: string;
	eqmid: any;
	equipmentName: string;
    uname: string;
    rangeTime: any[];
    fileList: any;
    file2List: any;
    file3List: any;
    file4List: any;
}>({
    debugname: '',
    docker: '',
    dockcharge: '',
    dockcontact: '',
    debugresult: '',
    defaultStatus: 0,
    status: 0,
    notes: '',
    re1: '',
    re2: '',
    re3: '',
    re4: '',
    fl1: '',
    fl2: '',
    fl3: '',
    fl4: '',
    dtypename: '',
	eqmid: null,
	equipmentName: '',
    uname: '',
    rangeTime: [],
    fileList: [],
    file2List: [],
    file3List: [],
    file4List: []
    // rangeTime: [Date.now(), Date.now() + 90 * 24 * 60 * 60 * 1000]
});

const rules: FormRules = {
    dtypename: [
        {
            required: true,
            message: '请选择权重',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请选择权重');
                }
            }
        },
    ],
    debugname: [
        {
            required: true,
            message: '请输入业务名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入业务名称');
                }
            }
        },
    ],
	docker: [
		{
			required: true,
			message: '请选择对接方',
		}
	],
    dockcontact: [
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
                    return Promise.resolve();
                    // return Promise.reject('请输入联系方式');
                }
            }
        },
    ],
	equipmentName: [
		{
			required: true,
			message: '请选择调试设备',
		}
	],
	uname: [
		{
			required: true,
			message: '请选择调试工程师',
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

// 获取待调试业务详情
async function getDebugBusinessInfo() {
    const data = await fetchGetDebugBusinessInfo(Number(prjForm.businessId));
    model.debugname = data.debugname;
    model.docker = data.docker;
    model.dockcharge = data.dockcharge;
    model.dockcontact = data.dockcontact;
    model.debugresult = data.debugresult;
    model.defaultStatus = data.status;
    model.status = data.status;
    model.notes = data.notes;
    model.re1 = data.re1;
    model.re2 = data.re2;
    model.re3 = data.re3;
    model.re4 = data.re4;
    model.fl1 = data.fl1;
    model.fl2 = data.fl2;
    model.fl3 = data.fl3;
    model.fl4 = data.fl4;
    model.rangeTime = [getSystemDate(5, data.starttime), getSystemDate(5, data.endtime)];
    dataForm.checkedUser = data.dbcreater;
    dataForm.contactFuzzy = data.docker;
    dataForm.checkedWeight = data.dtype;
    dataForm.fuzzy = data.dbusername;
    dataForm.weightFuzzy = data.tname;
    model.uname = data.dbusername;
	model.eqmid = data.eqmid || null;
	model.equipmentName = data.eqmname || '';
	dataForm.debugEquipmentFuzzy =  data.eqmname || '';
	dataForm.checkedDebugEquipment = data.eqmid || null;
    getAllUserDataList();
    getAllContactDataList();
    getAllWeightDataList();
	getAllDebugEquipmentDataList();
}

// APP上传文件(附件1)
async function handleUploadFile1ClickChange(data: any) {
	model.fileList = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.fileList.length > 0) {
        let flag = true;
        for (let index = 0; index < model.fileList.length; index++) {
            if (model.fileList[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
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
        //     model.re1 = file.name;
        //     model.fileList = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件
async function handleRemoveFileClickChange() {
	model.re1 = "";
	model.fileList = [];
}

// APP上传文件(附件2)
async function handleUploadFile2ClickChange(data: any) {
	model.file2List = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.file2List.length > 0) {
        let flag = true;
        for (let index = 0; index < model.file2List.length; index++) {
            if (model.file2List[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
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
        //     model.re2 = file.name;
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
        for (let index = 0; index < model.file3List.length; index++) {
            if (model.file3List[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
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
        //     model.re3 = file.name;
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

// APP上传文件(附件4)
async function handleUploadFile4ClickChange(data: any) {
	model.file4List = data.length > 0 ? [data[data.length - 1]] : [];
    if (model.file4List.length > 0) {
        let flag = true;
        for (let index = 0; index < model.file4List.length; index++) {
            if (model.file4List[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            model.file4List = [];
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    model.file4List.forEach(async(file: any) => {
		model.re4 = file.name;
        // await uploadFile(file, '', (response, file) => {
        //     model.fl4 = response.data;
        //     model.re4 = file.name;
        //     model.file4List = [];
        // },
        // (error, file) => {
        //     console.error('上传失败:', error);
        // })
    });
}

// 删除附件4
async function handleRemoveFile4ClickChange() {
	model.re4 = "";
	model.file4List = [];
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

// 清除权重
function handleClearWeightFuzzyChange() {
    dataForm.weightPage = 1;
    getAllWeightDataList();
}

// 搜索权重
function handleSearchWeightFuzzyChange() {
    dataForm.weightPage = 1;
    getAllWeightDataList();
}

// 获取全部权重
async function getAllWeightDataList() {
    if (dataForm.weightPage === 1) {
        weightDataList.value = [];
    }
    try {
        const data = await fetchGetPrjWeightDataList({ page: dataForm.weightPage, limit: dataForm.weightLimit, fuzzy: dataForm.weightFuzzy });
        weightDataList.value = weightDataList.value.concat(data.list);
        dataForm.weightTotal = Number(data.total);
        if (prjForm.businessId) {
            let weightNameObj = weightDataList.value.find((item: any) => dataForm.checkedWeight === item.id);
            if (weightNameObj) {
                model.dtypename = weightNameObj.tname;
            }
        }
    } catch (error) {
        console.error('获取全部权重失败', error);
    }
}

// 打开权重选择弹框
async function handleLinkWeightShowChange() {
    weightShow.value = true;
}

// 刷新
function handleScrollRefreshChange() {
    triggered.value = true;
    dataForm.weightPage = 1;
    getAllWeightDataList();
    setTimeout(() => {
        triggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(权重)
function handleScrolltolowerWeightChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && weightDataList.value.length < dataForm.weightTotal) {
        dataForm.weightPage++;
        getAllWeightDataList();
    }
}

// 关闭权重弹框
function handleCloseWeightChange() {
    weightShow.value = false;
}

// 选择权重
function handleRadioSelectWeightChange({ value }: { value: any }) {
    const names = weightDataList.value.find((item: any) => value === item.id);
    model.dtypename = names ? names.tname : '';
    model.debugname = names ? names.tname : '';
    // if (!model.debugname) {
    //     model.debugname = names ? names.tname : '';
    // }
    weightShow.value = false;
}


// 清除对接人
function handleClearContactFuzzyChange() {
    dataForm.contactPage = 1;
    getAllWeightDataList();
}

// 搜索对接人
function handleSearchContactFuzzyChange() {
    dataForm.contactPage = 1;
    getAllContactDataList();
}

// 获取全部对接人
async function getAllContactDataList() {
    if (dataForm.contactPage === 1) {
        contactDataList.value = [];
    }
    try {
        const data = await fetchGetPrjMemberDataList({ page: dataForm.contactPage, limit: dataForm.contactLimit, pid: prjForm.id, fuzzy: dataForm.contactFuzzy });
        contactDataList.value = contactDataList.value.concat(data.list);
        dataForm.contactTotal = Number(data.total);
    } catch (error) {
        console.error('获取全部对接人失败', error);
    }
}

// 打开对接人选择弹框
async function handleLinkContactShowChange() {
    contactShow.value = true;
}

// 刷新(对接人)
function handleScrollContactRefreshChange() {
    contactTriggered.value = true;
    dataForm.contactPage = 1;
    getAllContactDataList();
    setTimeout(() => {
        contactTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(对接人)
function handleScrollContacttolowerWeightChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && contactDataList.value.length < dataForm.contactTotal) {
        dataForm.contactPage++;
        getAllContactDataList();
    }
}

// 关闭对接人弹框
function handleCloseContactChange() {
    contactShow.value = false;
}

// 选择对接人
function handleRadioSelectContactChange({ value }: { value: any }) {
    const names = contactDataList.value.find((item: any) => value === item.id);
    model.docker = names ? names.docker : null;
    model.dockcharge = names ? names.pname : '';
    model.dockcontact = names ? names.pcontact : '';
    contactShow.value = false;
}

// 清除
function handleClearChange() {
    // dataForm.page = 1;
    // getAllUserDataList();
    userDataList.value = allUserDataList.value;
}

// 搜索
function handleSearchChange() {
    // dataForm.page = 1;
    // getAllUserDataList();
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
        const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: dataForm.limit, usertypes: '2, 3' });
        // const data = await fetchGetAllUserDataList({ page: dataForm.page, limit: dataForm.limit, usertypes: '2, 3', fuzzy: dataForm.fuzzy });
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
    debuggerTriggered.value = true;
    dataForm.page = 1;
    getAllUserDataList();
    setTimeout(() => {
        debuggerTriggered.value = false;
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

// 选择调试工程师
function handleRadioSelectChange({ value }: { value: any }) {
    const names = userDataList.value.find((item: any) => value === item.id);
    model.uname = names ? names.username : '';
    userShow.value = false;
}

// 清除待调试设备
function handleDebugEquipmentClearChange() {
    dataForm.debugEquipmentPage = 1;
    getAllDebugEquipmentDataList();
}

// 搜索待调试设备
function handleDebugEquipmentSearchChange() {
    dataForm.debugEquipmentPage = 1;
    getAllDebugEquipmentDataList();
}

// 获取待调试设备
async function getAllDebugEquipmentDataList() {
    if (dataForm.debugEquipmentPage === 1) {
        debugEquipmentDataList.value = [];
    }
    try {
        const data = await fetchGetDebugEquipmentDataList({ page: dataForm.debugEquipmentPage, limit: dataForm.debugEquipmentLimit, fuzzy: dataForm.debugEquipmentFuzzy, pid: prjForm.id });
        debugEquipmentDataList.value = debugEquipmentDataList.value.concat(data.list);
        dataForm.debugEquipmentTotal = Number(data.total);
        if (model.eqmid) {
            let debugEquipmentNameObj = debugEquipmentDataList.value.find((item: any) => dataForm.checkedDebugEquipment === item.id);
            if (debugEquipmentNameObj) {
                model.equipmentName = debugEquipmentNameObj.devname;
            }
        }
    } catch (error) {
        console.error('获取全部权重失败', error);
    }
}

// 打开待调试设备选择弹框
async function handleLinkDebugEquipmentShowChange() {
    debugEquipmentShow.value = true;
}

// 刷新待调试设备
function handleScrollDebugEquipmentRefreshChange() {
    debuggerEquipmentTriggered.value = true;
    dataForm.debugEquipmentPage = 1;
    getAllDebugEquipmentDataList();
    setTimeout(() => {
        debuggerEquipmentTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部(待调试设备)
function handleScrollDebugEquipmenttolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && debugEquipmentDataList.value.length < dataForm.debugEquipmentTotal) {
        dataForm.debugEquipmentPage++;
        getAllDebugEquipmentDataList();
    }
}

// 关闭待调试设备弹框
function handleDebugEquipmentCloseChange() {
    debugEquipmentShow.value = false;
}

// 选择待调试设备
function handleRadioSelectDebugEquipmentChange({ value }: { value: any }) {
    const names = debugEquipmentDataList.value.find((item: any) => value === item.id);
    model.eqmid = value;
    model.equipmentName = names ? names.devname : null;
    debugEquipmentShow.value = false;
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
				const [res1, res2, res3, res4] = await Promise.all([
					handleUploadFileListChange(model.fileList),
					handleUploadFileListChange(model.file2List),
					handleUploadFileListChange(model.file3List),
					handleUploadFileListChange(model.file4List)
				]);
				model.fl1 = res1.length > 0 ? res1[0].url : '';
				model.fl2 = res2.length > 0 ? res2[0].url : '';
				model.fl3 = res3.length > 0 ? res3[0].url : '';
				model.fl4 = res4.length > 0 ? res4[0].url : '';
                loading.value = true;
                try {
                    if (prjForm.businessId) {
                        let queryParams = model.defaultStatus === Number(model.status) ? [{
                            id: prjForm.businessId,
                            pid: prjForm.id,
                            debugname: model.debugname,
                            docker: model.docker,
                            dockcharge: model.dockcharge,
                            dockcontact: model.dockcontact,
                            debugresult: model.debugresult,
                            notes: model.notes,
							eqmid: model.eqmid,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4,
                            dtype: dataForm.checkedWeight,
                            dbcreater: dataForm.checkedUser,
                            starttime: String(getSystemDate(0, model.rangeTime[0])),
                            endtime: String(getSystemDate(0, model.rangeTime[1]))
                        }] : [{
                            id: prjForm.businessId,
                            pid: prjForm.id,
                            debugname: model.debugname,
                            docker: model.docker,
                            dockcharge: model.dockcharge,
                            dockcontact: model.dockcontact,
                            debugresult: model.debugresult,
                            status: model.status,
                            notes: model.notes,
							eqmid: model.eqmid,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4,
                            dtype: dataForm.checkedWeight,
                            dbcreater: dataForm.checkedUser,
                            starttime: String(getSystemDate(0, model.rangeTime[0])),
                            endtime: String(getSystemDate(0, model.rangeTime[1]))
                        }];
                        message
                        .confirm({
                            msg: '确定要修改待调试业务吗？',
                            title: '提示',
                            confirmButtonProps: {
                                type: 'error',
                            },
                        })
                        .then(async () => {
                            const data = await fetchUpdateDebugBusinessInfo(queryParams);
                            uni.showToast({
                                title: '修改待调试业务成功',
                                icon: 'none',
                                duration: 1500,
                                complete: () => {
									model.fileList = [];
									model.file2List = [];
									model.file3List = [];
									model.file4List = [];
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
                        let queryParams = [{
                            pid: prjForm.id,
                            debugname: model.debugname,
                            docker: model.docker,
                            dockcharge: model.dockcharge,
                            dockcontact: model.dockcontact,
                            debugresult: model.debugresult,
                            status: model.status,
                            notes: model.notes,
							eqmid: model.eqmid,
                            re1: model.re1,
                            re2: model.re2,
                            re3: model.re3,
                            re4: model.re4,
                            fl1: model.fl1,
                            fl2: model.fl2,
                            fl3: model.fl3,
                            fl4: model.fl4,
                            dtype: dataForm.checkedWeight,
                            dbcreater: dataForm.checkedUser,
                            starttime: String(getSystemDate(0, model.rangeTime[0])),
                            endtime: String(getSystemDate(0, model.rangeTime[1]))
                        }];
                        const data = await fetchSaveDebugBusinessInfo(queryParams);
                        uni.showToast({
                            title: '新增待调试业务成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
								model.fileList = [];
								model.file2List = [];
								model.file3List = [];
								model.file4List = [];
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    }
                } catch (err) {
                    loading.value = false;
                    if (prjForm.businessId) {
                        console.error('修改待调试业务失败', err);
                    } else {
                        console.error('新增待调试业务失败', err);
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

onLoad((options: any) => {
    prjForm.id = options.pid;
    prjForm.businessId = options.id;
    if (prjForm.businessId) {
        getDebugBusinessInfo();
    } else {
        getAllUserDataList();
        getAllContactDataList();
        getAllWeightDataList();
		getAllDebugEquipmentDataList();
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
            <wd-navbar left-arrow :title="prjForm.businessId ? '修改待调试业务' : '新增待调试业务'" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />
        </view>

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="权重" label-width="100px" prop="dtypename" disabled v-model="model.dtypename" placeholder="请选择权重">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkWeightShowChange">权重</wd-button>
                    </template>
                </wd-input>
                <wd-input label="业务名称" label-width="100px" prop="debugname" required clearable v-model="model.debugname" placeholder="请输入业务名称" />
                <wd-input label="对接方" label-width="100px" prop="docker" clearable v-model="model.docker" placeholder="请输入对接方" @clear="dataForm.checkedContact = null;">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkContactShowChange">对接方</wd-button>
                    </template>
                </wd-input>
                <wd-input label="对接方负责人" label-width="100px" prop="dockcharge" clearable v-model="model.dockcharge" placeholder="请输入对接方负责人" />
                <wd-input label="联系方式" label-width="100px" prop="dockcontact" clearable v-model="model.dockcontact" placeholder="请输入联系方式" />
                <wd-input v-if="prjForm.businessId" label="调试结果" label-width="100px" prop="debugresult" clearable v-model="model.debugresult" placeholder="请输入调试结果" />
                <!-- <wd-select-picker label="调试结果" label-width="100px" prop="debugresult" v-model="model.debugresult" :show-confirm="false" :columns="contracttypeColumns" type="radio" :z-index="100" placeholder="请选择项目类型" /> -->
                <wd-select-picker v-if="prjForm.businessId" label="状态" label-width="100px" prop="status" v-model="model.status" :show-confirm="false" :columns="statusList" type="radio" :z-index="100" placeholder="请选择项目类型" />
                <wd-input label="调试设备" label-width="100px" prop="equipmentName" disabled v-model="model.equipmentName" placeholder="请选择调试设备">
					<template #suffix>
						<wd-button icon="link" size="small" @click.stop="handleLinkDebugEquipmentShowChange">调试设备</wd-button>
					</template>
				</wd-input>
				<wd-input label="调试工程师" label-width="100px" prop="uname" disabled v-model="model.uname" placeholder="请选择调试工程师">
                    <template #suffix>
                        <wd-button icon="link" size="small" @click.stop="handleLinkMemberShowChange">调试工程师</wd-button>
                    </template>
                </wd-input>
                <wd-datetime-picker label="起止时间" label-width="100px" type="date" v-model="model.rangeTime" :default-value="[Date.now(), Date.now() + 90 * 24 * 60 * 60 * 1000]" />
                <wd-textarea label="备注" label-width="100px" type="textarea" prop="notes" clearable v-model="model.notes" placeholder="请输入备注" />
                <view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
                    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                    <view style="margin-left: 10rpx; font-weight: bolder;">文件上传</view>
                </view>
                <wd-input type="text" label="附件1" label-width="40px" v-model="model.re1" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="model.fileList" @change="handleUploadFile1ClickChange">
								<template #default>
									<wd-button icon="cloud-upload" size="small">上传文件</wd-button>
								</template>
							</CjxUpload>
							
							<wd-icon v-if="model.re1" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFileClickChange"></wd-icon>
						</view>	
                    </template>
                </wd-input>

                <wd-input type="text" label="附件2" label-width="40px" v-model="model.re2" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="model.file2List" @change="handleUploadFile2ClickChange">
								<template #default>
									<wd-button icon="cloud-upload" size="small">上传文件</wd-button>
								</template>
							</CjxUpload>
							
							<wd-icon v-if="model.re2" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile2ClickChange"></wd-icon>
						</view>
                    </template>
                </wd-input>

                <wd-input type="text" label="附件3" label-width="40px" v-model="model.re3" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="model.file3List" @change="handleUploadFile3ClickChange">
								<template #default>
									<wd-button icon="cloud-upload" size="small">上传文件</wd-button>
								</template>
							</CjxUpload>
							
							<wd-icon v-if="model.re3" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile3ClickChange"></wd-icon>
						</view>
                    </template>
                </wd-input>

                <wd-input type="text" label="附件4" label-width="40px" v-model="model.re4" placeholder="请选择文件" center>
                    <template #suffix>
						<view style="display: flex; align-items: center; justify-content: space-between; gap: 0 10rpx;">
							<CjxUpload v-model="model.file4List" @change="handleUploadFile4ClickChange">
								<template #default>
									<wd-button icon="cloud-upload" size="small">上传文件</wd-button>
								</template>
							</CjxUpload>
							
							<wd-icon v-if="model.re4" name="delete-thin" size="22px" color="#ff0000" @click="handleRemoveFile4ClickChange"></wd-icon>
						</view>
                    </template>
                </wd-input>

                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="weightShow" position="left" @close="handleCloseWeightChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.weightFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchWeightFuzzyChange" @cancel="handleSearchWeightFuzzyChange" @clear="handleClearWeightFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerWeightChange" style="height: calc(100vh - 260rpx);">
                <wd-radio-group v-model="dataForm.checkedWeight" shape="dot" @change="handleRadioSelectWeightChange">
                    <wd-cell v-for="(item, index) in weightDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.tname }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="contactShow" position="left" @close="handleCloseContactChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.contactFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchContactFuzzyChange" @cancel="handleSearchContactFuzzyChange" @clear="handleClearContactFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="contactTriggered" @refresherrefresh="handleScrollContactRefreshChange" @scrolltolower="handleScrollContacttolowerWeightChange" style="height: calc(100vh - 260rpx);">
                <wd-radio-group v-model="dataForm.checkedContact" shape="dot" @change="handleRadioSelectContactChange">
                    <wd-cell v-for="(item, index) in contactDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.docker }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>

        <wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="userShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="dataForm.fuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />

            <scroll-view scroll-y refresher-enabled	:refresher-triggered="debuggerTriggered" @refresherrefresh="handleScrollDebuggerRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 260rpx);">
                <wd-radio-group v-model="dataForm.checkedUser" shape="dot" @change="handleRadioSelectChange">
                    <wd-cell v-for="(item, index) in userDataList" :key="index" custom-class="radioCellWrap">
                        <view class="custom-txt">
                            <wd-radio :value="item.id">{{ item.username }}</wd-radio>
                        </view>
                    </wd-cell>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
		
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="debugEquipmentShow" position="left" @close="handleDebugEquipmentCloseChange">
			<wd-gap height="70rpx" />

			<wd-search v-model="dataForm.debugEquipmentFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleDebugEquipmentSearchChange" @cancel="handleDebugEquipmentSearchChange" @clear="handleDebugEquipmentClearChange" />

			<scroll-view scroll-y refresher-enabled	:refresher-triggered="debuggerEquipmentTriggered" @refresherrefresh="handleScrollDebugEquipmentRefreshChange" @scrolltolower="handleScrollDebugEquipmenttolowerChange" style="height: calc(100vh - 260rpx);">
				<wd-radio-group v-model="dataForm.checkedDebugEquipment" shape="dot" @change="handleRadioSelectDebugEquipmentChange">
					<wd-cell v-for="(item, index) in debugEquipmentDataList" :key="index" custom-class="radioCellWrap">
						<view class="custom-txt">
							<wd-radio :value="item.id">{{ item.devname }}</wd-radio>
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

:deep(.wd-input__suffix) {
	display: flex !important;
	align-items: center !important;
	gap: 0 10rpx !important;
}
</style>