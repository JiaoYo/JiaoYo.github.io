<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { onReady, onLoad, onUnload, onPullDownRefresh, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { reactive, ref, nextTick, computed, watch } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { getExtensionFromUrl, downloadFile, isImageUrl, hasPermission, getFileType, isSupportedFileType } from '@/utils/index';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';
import CjxPreviewOffice from '@/uni_modules/cjx-previewOffice/components/cjx-previewOffice/cjx-previewOffice.vue';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';
import { fetchGetPrjFormInfo, fetchGetPrjformMemberDataList, fetchGetPrjformDebugBusinessDataList, fetchGetPrjformDebugEquipmentDataList, fetchDeletePrjformMemberInfo, fetchDeletePrjformDebugEquipmentInfo, fetchDeletePrjformDebugBusinessInfo, fetchUpdatePrjformDebugBusinessInfo, fetchUpdatePrjformDebugEquipmentInfo, fetchSavePrjformFileInfo, fetchGetPrjformFileDataList, fetchDeletePrjFormInfo, fetchDeletePrjformFileDetailInfo, fetchDeletePrjFileDetailInfo, fetchDeletePrjformFileInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const message = useMessage();

const pronameTitle = ref<string>('');

const activeTab = ref<number>(0);

const isDark = computed(() => theme.value === 'dark');

const userType = ref<number>(uni.getStorageSync('usertype'));

const selectedUploadfileType = ref<number>(0);

const uploadFileVisibleShow = ref<boolean>(false);

const uploadFileFileList = ref<any[]>([]);

// 一键清点设备
const equipmentManageVisible = ref<boolean>(false);

const checkedAllDevice = ref<boolean>(false);

// 搜索条件
const searchForm = reactive<{
	devname: string;
	businessname: string;
	username: string;
}>({
	devname: '',
	businessname: '',
	username: ''
})

const extIconMap: Record<string, number> = {
    "docx": 0,
    "DOCX": 0,
    "pdf": 1,
    "PDF": 1,
    "xlsx": 2,
    "XLSX": 2,
    'xls': 2,
    "XLS": 2,
    "rar":  3,
    "RAR":  3,
    "tar":  4,
    "TAR":  4,
    "tar.gz": 4,
    "TAR.GZ": 4,
    "gz": 4,
    "ppt": 5,
    "PPT": 5,
    "pptx": 5,
    "PPTX": 5,
    "txt": 6,
    "TXT": 6,
    "7z": 3,
    "7Z": 3,
    "zip": 4,
    "ZIP": 4
};

const options = ref<any>(hasPermission('project:form:File:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const equipmentOptions = ref<any>(hasPermission('project:Form:Equipment:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const debugOptions = ref<any>(hasPermission('project:Form:Debug:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const contactOptions = ref<any>(hasPermission('project:Form:Contact:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const tabsList = ref<{ title: string, value: number }[]>([
    {
        title: '项目概览',
        value: 0
    },
    {
        title: '调试设备',
        value: 1
    },
    {
        title: '调试业务',
        value: 2
    },
	{
		title: '调试单文件',
		value: 3
	},
    {
        title: '联系人',
        value: 4
    }
]);

// 滚动高度集合
const tabScrollTop = ref<any[]>([0, 0, 0, 0, 0]);

const dataForm = reactive<{
    contractPage: number;
    contractTotal: number;
    prjMemberPage: number;
    prjMemberTotal: number;
    prjDebugEquipmentPage: number;
    prjDebugEquipmentTotal: number;
    prjDebugBusinessPage: number;
    prjDebugBusinessTotal: number;
	prjContractPrjFilePage: number;
	prjContractPrjFileTotal: number;
}>({
    contractPage: 1,
    contractTotal: 1,
    prjMemberPage: 1,
    prjMemberTotal: 0,
    prjDebugEquipmentPage: 1,
    prjDebugEquipmentTotal: 0,
    prjDebugBusinessPage: 1,
    prjDebugBusinessTotal: 0,
    prjContractPrjFilePage: 1,
    prjContractPrjFileTotal: 0
})

interface DebugbussinessItem {
    id: number;
    debugname: string;
    docker: string;
    dockcharge: string;
    dockcontact: string;
    notes: string;
    username: string;
    dbtime: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    eqmname: string;
    starttime: string;
    endtime: string;
}

interface DebugequipmentItem {
    id: number;
    pid: number;
    devname: string;
    devmodel: string;
    devnum: number;
    devunit: string;
    notes: string;
    username: string;
    dbtime: string;
    etype: number;
    devmanu: string;
    re1: string;
    re2: string;
    re3: string;
    re4: string;
    fl1: string;
    fl2: string;
    fl3: string;
    fl4: string;
    devstatus: number;
    install: number;
    connectionmode: string;
    manucontact: string;
    manuinfo: string;
    checked: boolean;
}

interface MemberItem {
    id: number;
    pname: string;
    docker: string;
    pcontact: string;
    proposition: string;
    username: string;
    dbtime: string;
    checked: boolean;
}

const prjDetailInfo = reactive({
    id: '',
    plantime: "",
    dbtime: "",
    dispatch: "",
    dtype: 0,
    proaddr: "",
	proid: 0,
    proname: "",
    sbtime: "",
    status: 0,
    username: "",
    provice: null,
    region: null,
    memberDataList: [] as MemberItem[],
    debugBussinessList: [] as DebugbussinessItem[],
    debugEquipmentList: [] as DebugequipmentItem[],
	fileList: [] as any[],
})

// 项目图纸列表
const projectDrawingsFileList = ref<any[]>([]);

// 项目文件
const ipAddressList = ref<any[]>([]);

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取项目联络单详情
async function getContractDetailInfo() {
    try {
        const data = await fetchGetPrjFormInfo((prjDetailInfo.id as any));
        console.log('data项目详情', data);
		prjDetailInfo.proid = data.proid;
        prjDetailInfo.proname = data.proname;
        prjDetailInfo.plantime = data.plantime;
        prjDetailInfo.proaddr = data.proaddr;
        prjDetailInfo.provice = data.provice;
        prjDetailInfo.region = data.region;
        prjDetailInfo.dtype = data.dtype;
        prjDetailInfo.dispatch = data.dispatch || '';
        prjDetailInfo.dbtime = data.dbtime;
        prjDetailInfo.sbtime = data.sbtime;
        prjDetailInfo.status = data.status;
        prjDetailInfo.username = data.username;
    } catch (err) {
        console.error('获取项目联络单信息失败', err);
    }
}

// 拨打电话
function handleMakePhoneNumber(phoneNumber: string) {
    uni.makePhoneCall({
        phoneNumber
    })
}

// 搜索(设备名称)
function handleSearchDevnameChange() {
    dataForm.prjDebugEquipmentPage = 1;
    getContractDebugEquipmentDataList();
}

// 清除(设备名称)
function handleClearDevnameChange() {
    dataForm.prjDebugEquipmentPage = 1;
    getContractDebugEquipmentDataList();
}

// 搜索(业务名称)
function handleSearchBusinessnameChange() {
    dataForm.prjDebugBusinessPage = 1;
    getContractDebugBusinessDataList();
}

// 清除(业务名称)
function handleClearBusinessnameChange() {
    dataForm.prjDebugBusinessPage = 1;
    getContractDebugBusinessDataList();
}

// 搜索(联系人)
function handleSearchUsernameChange() {
    dataForm.prjMemberPage = 1;
    getPrjMemberDataList();
}

// 清除(联系人)
function handleClearUsernameChange() {
    dataForm.prjMemberPage = 1;
    getPrjMemberDataList();
}

// 获取项目成员
async function getPrjMemberDataList() {
    if (dataForm.prjMemberPage === 1) {
        prjDetailInfo.memberDataList = [];
    }
    try {
        const data = await fetchGetPrjformMemberDataList({ page: dataForm.prjMemberPage, limit: 100, pid: prjDetailInfo.id, fuzzy: searchForm.username });
        dataForm.prjMemberTotal = Number(data.total);
        prjDetailInfo.memberDataList = prjDetailInfo.memberDataList.concat(data.list);
    } catch (err) {
        console.error('获取项目成员失败', err);
    }
}

// 页面跳转
function handleJumpChange(currentTab: number, url: string | null) {
    if (url) {
        uni.navigateTo({
            url
        })
    } else {
        if (currentTab === 1) {
            uni.navigateTo({
                url: '/projectPages/addprjformdebugequipment/Index?pid=' + prjDetailInfo.id + '&proId=' + prjDetailInfo.proid
            })
        } else if (currentTab === 2) {
            uni.navigateTo({
                url: '/projectPages/addprjformdebugbusiness/Index?pid=' + prjDetailInfo.id
            })
        } else if (currentTab === 4) {
            uni.navigateTo({
                url: '/projectPages/addprjformmember/Index?pid=' + prjDetailInfo.id
            })
        }
    }
}

// 获取调试设备列表
async function getContractDebugEquipmentDataList() {
    if (dataForm.prjDebugEquipmentPage === 1) {
        prjDetailInfo.debugEquipmentList = [];
    }
    try {
        const data = await fetchGetPrjformDebugEquipmentDataList({ page: dataForm.prjDebugEquipmentPage, limit: 100, pid: prjDetailInfo.id, fuzzy: searchForm.devname });
        dataForm.prjDebugEquipmentTotal = Number(data.total);
        prjDetailInfo.debugEquipmentList = prjDetailInfo.debugEquipmentList.concat(data.list.map((item: any) => {
            return {
                ...item,
                checked: item.checked || false
            }
        }));
    } catch (err) {
        console.error('获取调试设备列表失败', err);
    }
}

// 获取调试业务列表
async function getContractDebugBusinessDataList() {
    if (dataForm.prjDebugBusinessPage === 1) {
        prjDetailInfo.debugBussinessList = [];
    }
    try {
        const data = await fetchGetPrjformDebugBusinessDataList({ page: dataForm.prjDebugBusinessPage, limit: 100, pid: prjDetailInfo.id, creater: uni.getStorageSync('userId'), fuzzy: searchForm.businessname });
        dataForm.prjDebugBusinessTotal = Number(data.total);
        prjDetailInfo.debugBussinessList = prjDetailInfo.debugBussinessList.concat(data.list);
    } catch (err) {
        console.error('获取调试业务列表失败', err);
    }
}

// 获取项目文件信息
async function getContractPrjFileInfo() {
    if (dataForm.prjContractPrjFilePage === 1) {
        projectDrawingsFileList.value = [];
        ipAddressList.value = [];
        prjDetailInfo.fileList = [];
    }
    try {
        const data = await fetchGetPrjformFileDataList({ page: dataForm.prjContractPrjFilePage, limit: 100,  pid: prjDetailInfo.id });
        console.log('data文件', data);
        dataForm.prjContractPrjFileTotal = Number(data.total);
        prjDetailInfo.fileList = prjDetailInfo.fileList.concat(data.list);
        prjDetailInfo.fileList.forEach((item: any) => {
            if (item.sort === 1) {
                projectDrawingsFileList.value.push({
                    id: item.id,
                    url: item.file,
                    filename: item.filename,
                    username: item.username,
                    dbtime: item.dbtime
                })
            } else if (item.sort === 2) {
                ipAddressList.value.push({
                    id: item.id,
                    url: item.file,
                    filename: item.filename,
                    username: item.username,
                    dbtime: item.dbtime
                })
            }
        });
    } catch (err) {
        console.error('获取项目文件信息失败', err);
    }
}

// 删除操作
async function handleDeleteDiffTypeChange(id: number) {
    try {
        message
        .confirm({
            msg: '确定要删除该' + (activeTab.value === 1 ? '调试设备' : activeTab.value === 2 ? '调试业务' : activeTab.value === 4 ? '联系人' : '调试设备') + '吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            if (activeTab.value === 1) {
                if (!hasPermission('project:Form:Equipment:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除调试设备权限，请联系管理员',
                        duration: 1500
                    })
                    return
                }
            } else if (activeTab.value === 2) {
                if (!hasPermission('project:Form:Debug:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除调试业务权限，请联系管理员',
                        duration: 1500
                    })
                    return
                }
            } else if (activeTab.value === 4) {
                if (!hasPermission('project:Form:Contact:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除联系人权限，请联系管理员',
                        duration: 1500
                    })
                }
                return
            }
            const data = activeTab.value === 1 ? fetchDeletePrjformDebugEquipmentInfo(id) : activeTab.value === 2 ? await fetchDeletePrjformDebugBusinessInfo(id, Number(prjDetailInfo.id)) : activeTab.value === 3 ? await fetchDeletePrjformMemberInfo(id) : '';
            uni.showToast({
                icon: "none",
                title: "删除成功",
                duration: 1500,
                complete: async () => {
					tabScrollTop.value[activeTab.value] = 0;
					handleGotoTopChange();
                    if (activeTab.value === 1) {
                        dataForm.prjDebugEquipmentPage = 1;
                        getContractDebugEquipmentDataList();
                    } else if (activeTab.value === 2) {
                        dataForm.prjDebugBusinessPage = 1;
                        getContractDebugBusinessDataList();
                    } else if (activeTab.value === 4) {
                        dataForm.prjMemberPage = 1;
                        getPrjMemberDataList()
                    }
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('删除失败', error);
    }
}

// 删除项目文件
async function handleDeleteFileChange(url: string, id: number) {
    message
    .confirm({
        msg: '确定要删除该项目文件吗？',
        title: '提示',
        confirmButtonProps: {
            type: 'error',
        },
    })
    .then(async () => {
        if (!hasPermission('project:form:File:delete')) {
            uni.showToast({
                icon: 'none',
                title: '暂无删除项目文件权限，请联系管理员',
                duration: 1500
            })
            return
        }
        try {
            const data = await fetchDeletePrjFileDetailInfo(url.includes("?") ? url.split("?")[0] : url);
            const data2 = await fetchDeletePrjformFileInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除成功",
                duration: 1500,
                complete: async () => {
                    dataForm.prjContractPrjFilePage = 1;
					tabScrollTop.value[activeTab.value] = 0;
					handleGotoTopChange();
                    getContractPrjFileInfo();
                }
            })
        } catch (error) {
            console.error('删除失败', error);
            // const data2 = await fetchDeletePrjFileInfo(id);
            // uni.showToast({
            //     icon: "none",
            //     title: "删除成功",
            //     duration: 1500,
            //     complete: async () => {
            //         dataForm.prjContractPrjFilePage = 1;
            //         getContractPrjFileInfo();
            //     }
            // })
        }
    })
    .catch(() => {
        console.log('点击了取消按钮');
    });
}

// 滚动到顶部
function handleGotoTopChange() {
	uni.pageScrollTo({
		scrollTop: 0,
		duration: 0
	})
}

// 预览
const handlePreviewFileChange = (url: string) => {
    if (!isSupportedFileType(url) && !isImageUrl(url)) {
        uni.showToast({
            icon: 'none',
            duration: 1500,
            title: '该文件无法预览，请下载至本地进行查看'
        })
        // uni.navigateTo({
        //     url: '/projectPages/preview/Index?url=' + encodeURIComponent(url) + '&ext=' + getExtensionFromUrl(url).toLocaleLowerCase()
        // })
    } else {
        // uni.showToast({
        //     icon: 'none',
        //     duration: 1500,
        //     title: '该文件无法预览，请下载至本地进行查看'
        // })
    }
}

const handleTabsChange = ({ index, name }: { index: number, name: number }) => {
	nextTick(() => {
		uni.pageScrollTo({
			scrollTop: tabScrollTop.value[activeTab.value] || 0,
			duration: 0
		});
	})
	// uni.pageScrollTo({
	// 	scrollTop: 0,
	// 	duration: 300
	// });

    if (index === 3) {

    }
}

// 点击上传
function handleUploadFileSelectClickChange(index: number) {
	selectedUploadfileType.value = index;
	uploadFileFileList.value = [];
	uploadFileVisibleShow.value = true;
}

// 取消上传
function handleCloseChange() {
	selectedUploadfileType.value = 0;
	uploadFileVisibleShow.value = false;
	uploadFileFileList.value = [];
}

// 上传逻辑处理
async function handleUploadfileSubmitChange() {
	if (uploadFileFileList.value.length === 0) {
		uni.showToast({
			icon: 'none',
			title: '请先选择文件再进行上传',
			duration: 1500
		})
		return
	}
	const uploadPromises = uploadFileFileList.value.map(async(file: any) => {
		// 跳过无效文件
		if (!file) return Promise.resolve(file);
		
		// 如果已经是有效线上地址，直接通过
		if (file.url && file.url.startsWith("https://pictures.linkqi.cn")) {
			return Promise.resolve(file);
		}
		
		return new Promise((resolve, reject) => {
			uploadFile(file, '', (response, f) => {
				f.url = response.data;
				resolve(f);
			}, (error, f) => {
				console.error('上传失败:', error);
				resolve(f); // 或根据需求决定是否继续
			});
		});
	});
	
	try {
		await Promise.all(uploadPromises);
		// 此时所有文件的 url 应该都是有效的
		handleUpdateFileInsertChange(uploadFileFileList.value, selectedUploadfileType.value);
		uploadFileVisibleShow.value = false;
	} catch (err) {
		console.error('批量上传出错', err);
		// 可选：提示部分失败
	}
}

// APP上传文件(项目图纸)
async function handleUploadClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        // for (let index = 0; index < data.length; index++) {
        //     if (data[index].size > 100 * 1024 * 1024) {
        //         flag = false;
        //         break;
        //     }
        // }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }
	uploadFileFileList.value = uploadFileFileList.value.map(item => {
		return {
			...item,
			aliasname: item.name
		}
	})
}

// 更新文件
async function handleUpdateFileInsertChange(uploadFileList: any, sort: number) {
    try {
		let queryParams = uploadFileList.map((item: any) => {
			return {
				file: item.url,
				filename: item.aliasname || item.name,
				pid: prjDetailInfo.id,
				sort: sort
			}
		})
        const data = await fetchSavePrjformFileInfo(queryParams);
        uni.showToast({
            title: '新增成功',
            icon: 'none',
            duration: 1500,
            complete: () => {
                dataForm.prjContractPrjFilePage = 1;
                getContractPrjFileInfo();
            }
        });
    } catch (error) {
        console.error('新增失败', error);
    }
}

async function getDataList() {
    if (activeTab.value === 1) {
        dataForm.prjDebugEquipmentPage = 1;
        getContractDebugEquipmentDataList();
    } else if (activeTab.value === 2) {
        dataForm.prjDebugBusinessPage = 1;
        getContractDebugBusinessDataList();
    } else if (activeTab.value === 4) {
        dataForm.prjMemberPage = 1;
        getPrjMemberDataList();
    }
}

// 全选
function handleCheckAllChange({ value }: { value: boolean }) {
    if (value) {
        prjDetailInfo.debugEquipmentList.forEach((item: any)=>{
            item.checked = true;
        })
    } else {
        prjDetailInfo.debugEquipmentList.forEach((item: any)=>{
            item.checked = false;
        })
    }
}

// 一键修改设备状态
async function handleInventoryDeiceChange() {
    try {
        const queryParams = checkedAllDevice.value ? prjDetailInfo.debugEquipmentList.map((item: any) => {
            if(item.devstatus === 2) {
                return {
                    id: item.id,
                    devstatus: 0
                }
            } else{
                return null
            }
        }).filter((item: any) => item !== null) : prjDetailInfo.debugEquipmentList.map((item: any) => {
            if(item.devstatus === 2 && item.checked) {
                return {
                    id: item.id,
                    devstatus: 0
                }
            } else{
                return null
            }
        }).filter((item: any) => item !== null)
        console.log('q', queryParams);
        if (queryParams.length === 0) {
            uni.showToast({
                title: '请选择待修改设备',
                icon: 'none',
                duration: 1500
            });
            return false
        }
        message
            .confirm({
                msg: '确定要一键修改设备状态吗？',
                title: '提示',
                confirmButtonProps: {
                    type: 'error',
                },
            })
            .then(async () => {
                const data = await fetchUpdatePrjformDebugEquipmentInfo(queryParams);
                uni.showToast({
                    title: '一键修改设备状态成功',
                    icon: 'none',
                    duration: 1500,
					complete: () => {
						dataForm.prjDebugEquipmentPage = 1;
						getContractDebugEquipmentDataList();
					}
                });
            })
            .catch(() => {
                console.log('点击了取消按钮');
            });
    } catch (err) {
        console.error('一键修改设备状态失败', err);
    }
}

onLoad((options: any) => {
    prjDetailInfo.id = options.pid;
	if (options.hasOwnProperty('proname')) {
		pronameTitle.value = decodeURIComponent(options.proname);
	}
    activeTab.value = options.hasOwnProperty('activeTab') ? Number(options.activeTab) || 0 : 0;
    getContractDetailInfo();
    getContractDebugEquipmentDataList();
    getContractDebugBusinessDataList();
	getContractPrjFileInfo();
    getPrjMemberDataList();
    uni.$on('refreshPrjFormMemberList', getDataList); // 监听刷新事件
});

onPageScroll((e: any) => {
	tabScrollTop.value[activeTab.value] = e.scrollTop;
})

onUnload(() => {
    uni.$off('refreshPrjFormMemberList', getDataList); // 页面销毁时解绑
});

onPullDownRefresh(() => {
    if (activeTab.value === 0) {
        getContractDetailInfo();
    } else if (activeTab.value === 1) {
        dataForm.prjDebugEquipmentPage = 1;
        getContractDebugEquipmentDataList();
    } else if (activeTab.value === 2) {
        dataForm.prjDebugBusinessPage = 1;
        getContractDebugBusinessDataList();
    } else if (activeTab.value === 3) {
        dataForm.prjContractPrjFilePage = 1;
        getContractPrjFileInfo();
    } else if (activeTab.value === 4) {
        dataForm.prjMemberPage = 1;
        getPrjMemberDataList();
    }
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    console.log('触发上拉加载');
    if (activeTab.value ===1) {
        if (prjDetailInfo.debugEquipmentList.length < dataForm.prjDebugEquipmentTotal) {
            dataForm.prjDebugEquipmentPage++;
            getContractDebugEquipmentDataList();
        }
    } else if (activeTab.value === 2) {
        if (prjDetailInfo.debugBussinessList.length < dataForm.prjDebugBusinessTotal) {
            dataForm.prjDebugBusinessPage++;
            getContractDebugBusinessDataList();
        }
    } else if (activeTab.value === 3) {
        if (prjDetailInfo.fileList.length < dataForm.prjContractPrjFileTotal) {
            dataForm.prjContractPrjFilePage++;
            getContractPrjFileInfo();
        }
    } else if (activeTab.value === 4) {
        if (prjDetailInfo.memberDataList.length < dataForm.prjMemberTotal) {
            dataForm.prjMemberPage++;
            getPrjMemberDataList();
        }
    }
});

watch(
    () => prjDetailInfo.debugEquipmentList.map(item => item.checked),
    (checkedList) => {
        const checkedCount = checkedList.filter(Boolean).length;
        checkedAllDevice.value = checkedCount === dataForm.prjDebugEquipmentTotal
    },
    { deep: true }
)
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-message-box />
		<wd-navbar left-arrow :title="pronameTitle" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft">
            <template #right>
                <wd-button type="text" v-if="activeTab === 1 && hasPermission('project:Form:Equipment:update')" @click="equipmentManageVisible = !equipmentManageVisible;">管理</wd-button>
                <wd-button v-if="(activeTab === 1 && hasPermission('project:Form:Equipment:insert')) || (activeTab === 2 && hasPermission('project:Form:Debug:insert')) || (activeTab === 4 && hasPermission('project:Form:Contact:update'))" type="icon" icon="add-circle" size="large" @click="handleJumpChange(activeTab, null)"></wd-button>
            </template>
        </wd-navbar>

        <wd-tabs swipeable animated v-model="activeTab" @change="handleTabsChange">
            <block v-for="(item, index) in tabsList" :key="index">
                <!-- <wd-tab :title="item.title"  :disabled="index === 5 ? (prjDetailInfo.cs === 0 ? true : false) : index === 6 ? (prjDetailInfo.ds === 0 ? true : false) : false"> -->
                <wd-tab :title="item.title">
					<!-- #ifdef H5 -->
					<wd-sticky v-if="activeTab === 1 || activeTab === 2 || activeTab === 4" :offset-top="42">
						<!-- 搜索框 -->
						<wd-search v-model="searchForm.devname" v-if="activeTab === 1" placeholder="请输入设备名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
							cancel-txt="搜索" @search="handleSearchDevnameChange" @cancel="handleSearchDevnameChange" @clear="handleClearDevnameChange" />
						<!-- 搜索框 -->
						<wd-search v-model="searchForm.businessname" v-if="activeTab === 2" placeholder="请输入业务名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
							cancel-txt="搜索" @search="handleSearchBusinessnameChange" @cancel="handleSearchBusinessnameChange" @clear="handleClearBusinessnameChange" />
						<!-- 搜索框 -->
						<wd-search v-model="searchForm.username" v-if="activeTab === 4" placeholder="请输入姓名" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
							cancel-txt="搜索" @search="handleSearchUsernameChange" @cancel="handleSearchUsernameChange" @clear="handleClearUsernameChange" />
					</wd-sticky>
					<!-- #endif -->
					
					<!-- #ifdef APP || APP-PLUS -->
					<wd-sticky v-if="activeTab === 1 || activeTab === 2 || activeTab === 4" :offset-top="128">
						<!-- 搜索框 -->
						<wd-search v-model="searchForm.devname" v-if="activeTab === 1" placeholder="请输入设备名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
							cancel-txt="搜索" @search="handleSearchDevnameChange" @cancel="handleSearchDevnameChange" @clear="handleClearDevnameChange" />
						<!-- 搜索框 -->
						<wd-search v-model="searchForm.businessname" v-if="activeTab === 2" placeholder="请输入业务名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
							cancel-txt="搜索" @search="handleSearchBusinessnameChange" @cancel="handleSearchBusinessnameChange" @clear="handleClearBusinessnameChange" />
						<!-- 搜索框 -->
						<wd-search v-model="searchForm.username" v-if="activeTab === 4" placeholder="请输入姓名" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
							cancel-txt="搜索" @search="handleSearchUsernameChange" @cancel="handleSearchUsernameChange" @clear="handleClearUsernameChange" />
					</wd-sticky>
					<!-- #endif -->
					
                    <wd-gap :bg-color="isDark ? '#000000' : '#F5F5F5'" height="110rpx" />

                    <view v-if="activeTab === 0">
                        <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 40rpx', borderRadius: '20rpx' }">
                            <view style="padding: 5rpx;">
                                <wd-cell title="项目名称" :value="prjDetailInfo.proname" custom-class="customCell" />
                                <wd-cell title="调度名称" :value="prjDetailInfo.dispatch || '--'" custom-class="customCell" />
                                <wd-cell title="计划调试时间" :value="prjDetailInfo.plantime || '--'" custom-class="customCell" />
                                <wd-cell title="状态" custom-class="customCell">
                                    <wd-tag round :type="prjDetailInfo.status === 0 ? 'primary' : prjDetailInfo.status === 1 ? 'success' : 'default'">
                                        {{ prjDetailInfo.status === 0 ? '未提交' : prjDetailInfo.status === 1 ? '已提交' : '未知'  }}
                                    </wd-tag>
                                </wd-cell>
                                <wd-cell title="调试类型" custom-class="customCell">
                                    <wd-tag type="primary" round>
                                        {{ prjDetailInfo.dtype === 0 ? '现场调试' : prjDetailInfo.dtype === 1 ? '远程调试' : prjDetailInfo.dtype === 2 ? '无需调试' : '未知' }}
                                    </wd-tag>
                                </wd-cell>
                                <wd-cell v-if="prjDetailInfo.status === 1" title="提交时间" :value="prjDetailInfo.sbtime || '--'" custom-class="customCell" />
                                <wd-cell title="项目地址" :value="prjDetailInfo.proaddr" custom-class="customCell"></wd-cell>
                                <wd-cell title="创建者" :value="prjDetailInfo.username" custom-class="customCell" />
                                <wd-cell title="创建时间" :value="prjDetailInfo.dbtime" custom-class="customCell" />
                            </view>
                        </view>
                    </view>
				</wd-tab>
			</block>
		</wd-tabs>

		<view v-if="activeTab === 1">
			<view v-if="prjDetailInfo.debugEquipmentList.length > 0" style="margin-bottom: 40rpx;">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(businessDeviceItem, businessDeviceIndex) in prjDetailInfo.debugEquipmentList" :key="businessDeviceIndex" :right-options="equipmentOptions" @click="handleDeleteDiffTypeChange(businessDeviceItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: businessDeviceIndex === 0 ? '0 20rpx 0' : businessDeviceIndex === dataForm.prjDebugEquipmentTotal - 1 ? (equipmentManageVisible ? '20rpx 20rpx 100rpx 20rpx' : '20rpx 20rpx 0 20rpx') : '20rpx 20rpx 0', borderRadius: '20rpx', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }">
							<view style="padding: 0 0 0 20rpx;" v-if="hasPermission('project:Form:Equipment:update') && equipmentManageVisible">
								<wd-checkbox v-model="businessDeviceItem.checked"></wd-checkbox>
							</view>
							<view :style="{ width: hasPermission('project:Form:Equipment:update') && equipmentManageVisible ? 'calc(100% - 40rpx)' : '100%' }">
								<wd-cell :title="businessDeviceItem.devname" custom-class="customCellDebugbusinessWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<view style="display: flex; align-items: center; justify-content: flex-end; gap: 0 20rpx;">
										<wd-tag :type="businessDeviceItem.devstatus === 1 ? 'danger' : businessDeviceItem.devstatus === 0 ? 'success' : 'default'" round>
											{{ businessDeviceItem.devstatus === 0 ? '正常' : businessDeviceItem.devstatus === 1 ? '异常' : '未知' }}
										</wd-tag>
										<wd-icon v-if="hasPermission('project:Form:Equipment:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/addprjformdebugequipment/Index?pid=' + prjDetailInfo.id + '&proId=' + prjDetailInfo.proid + '&id=' + businessDeviceItem.id)"></wd-icon>
									</view>
								</wd-cell>
								<view @click="handleJumpChange(2, '/projectPages/prjformdebugequipmentinfo/Index?id=' + businessDeviceItem.id)">
									<!-- <wd-cell title="设备名称/型号" :value="businessDeviceItem.devname + ' / ' + (businessDeviceItem.devmodel || '--')" custom-class="customCell" ellipsis></wd-cell> -->
									<wd-cell title="型号" :value="businessDeviceItem.devmodel" custom-class="customCell"></wd-cell>
									<wd-cell title="数量" :value="businessDeviceItem.devunit ? businessDeviceItem.devnum + businessDeviceItem.devunit : businessDeviceItem.devnum" custom-class="customCell"></wd-cell>
									<wd-cell title="是否安装就位" custom-class="customCell">
										<wd-tag :type="businessDeviceItem.install === 1 ? 'danger' : businessDeviceItem.install === 0 ? 'success' : 'default'" round>
											{{ businessDeviceItem.install === 0 ? '是' : businessDeviceItem.install === 1 ? '否' : '未知' }}
										</wd-tag>
									</wd-cell>
									<wd-cell title="接线方式" :value="businessDeviceItem.connectionmode" custom-class="customCell"></wd-cell>
									<wd-cell title="厂家联系人" :value="businessDeviceItem.manucontact" custom-class="customCell"></wd-cell>
									<wd-cell title="厂家联系方式" :value="businessDeviceItem.manuinfo" custom-class="customCell"></wd-cell>
									<wd-cell title="创建者/时间" :value="businessDeviceItem.username" custom-class="customCell">
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="businessDeviceItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessDeviceItem.username }}
											</view>
											<view v-if="businessDeviceItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessDeviceItem.dbtime }}
											</view>
										</view>
									</wd-cell>
									<!-- <wd-cell title="备注" :value="businessDeviceItem.notes" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="创建者" :value="businessDeviceItem.username" custom-class="customCell" ellipsis />
									<wd-cell title="创建时间" :value="businessDeviceItem.dbtime" custom-class="customCell" ellipsis /> -->
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>

				<view v-if="equipmentManageVisible" :style="{ width: 'calc(100vw - 40rpx)', padding: '20rpx', position: 'fixed', left: 0, bottom: 0, background: isDark ? '#000000' : '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: isDark ? '1rpx solid #cccccc' : 'none' }">
					<wd-checkbox v-model="checkedAllDevice" @change="handleCheckAllChange">全选</wd-checkbox>
					<view>
						<wd-button type="success" @click="handleInventoryDeiceChange">一键修改设备状态</wd-button>
					</view>
				</view>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无项目联络单调试设备" />
			</view>
		</view>

		<view v-if="activeTab === 2">
			<view v-if="prjDetailInfo.debugBussinessList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(businessItem, businessIndex) in prjDetailInfo.debugBussinessList" :key="businessIndex" :right-options="debugOptions" @click="handleDeleteDiffTypeChange(businessItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: businessIndex === 0 ? '0 20rpx 0' : businessIndex === dataForm.prjDebugBusinessTotal - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 5rpx;">
								<wd-cell :title="businessItem.debugname" custom-class="customCellDebugbusinessWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<view style="display: flex; align-items: center; justify-content: flex-end; gap: 0 20rpx;">
										<!-- <wd-tag :type="businessItem.status === -1 ? 'warning' : businessItem.status === 0 ? 'default' : businessItem.status === 1 ? 'primary' : businessItem.status === 2 ? 'warning' : businessItem.status === 3 ? 'success' : 'default'" round>
											{{ businessItem.status === -1 ? '申请中' : businessItem.status === 0 ? '待调试' : businessItem.status === 1 ? '实施中' : businessItem.status === 2 ? '待审核' : businessItem.status === 3 ? '审核完成' : '未知' }}
										</wd-tag> -->
										<wd-icon v-if="hasPermission('project:Form:Debug:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/addprjformdebugbusiness/Index?pid=' + prjDetailInfo.id + '&id=' + businessItem.id)"></wd-icon>
									</view>
								</wd-cell>
								<view @click="handleJumpChange(1, '/projectPages/prjformdebugbussinessinfo/Index?id=' + businessItem.id)">
									<wd-cell v-if="businessItem.tname" title="权重名称" :value="businessItem.tname" custom-class="customCell" />
									<wd-cell v-if="businessItem.eqmname" title="调试设备" :value="businessItem.eqmname" custom-class="customCell" />
									<wd-cell v-if="businessItem.dbusername" title="调试人" :value="businessItem.dbusername" custom-class="customCell" />
									<wd-cell title="计划起止时间" v-if="businessItem.starttime || businessItem.endtime" :value="(businessItem.starttime || '--') + ' ~ ' + (businessItem.endtime || '--')" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="对接方信息" :value="businessItem.docker" custom-class="customCell" ellipsis v-if="businessItem.docker || businessItem.dockcharge || businessItem.dockcontact">
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="businessItem.docker" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												<view>对接方: </view>
												<view style="margin-left: 5px;">{{ businessItem.docker }}</view>
											</view>
											<view v-if="businessItem.dockcharge" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												<view>对接方负责人: </view>
												<view style="margin-left: 5px;">{{ businessItem.dockcharge }}</view>
											</view>
											<view v-if="businessItem.dockcontact" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												<view>联系方式: </view>
												<view style="margin-left: 5px;">{{ businessItem.dockcontact }}</view>
											</view>
										</view>
									</wd-cell>
									<wd-cell title="创建者/时间" :value="businessItem.username" custom-class="customCell" ellipsis>
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="businessItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessItem.username }}
											</view>
											<view v-if="businessItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessItem.dbtime }}
											</view>
										</view>
									</wd-cell>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无项目联络单调试业务" />
			</view>
		</view>
		
		<view v-if="activeTab === 3">
			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10rpx 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">项目图纸</view>
				</view>
				<view v-if="hasPermission('project:form:File:insert')">
					<wd-icon name="cloud-upload" size="22px" @click="handleUploadFileSelectClickChange(1)"></wd-icon>
				</view>
			</view>

			<view v-if="projectDrawingsFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
				<view v-for="(projectDrawingsFileItem, projectDrawingsFileIndex) in projectDrawingsFileList" :key="projectDrawingsFileIndex">
					<view style="padding: 20rpx;">
						<view class="prjInfoHeader">
							<view class="left">
								<wd-img :width="30" :height="30" :src="projectDrawingsFileItem.url" v-if="isImageUrl(projectDrawingsFileItem.url)" :preview-src="projectDrawingsFileItem.url" :enable-preview="true" />
								<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(projectDrawingsFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							</view>

							<view class="right" v-if="isSupportedFileType(projectDrawingsFileItem.url)">
								<CjxPreviewOffice
									ref="previewOfficeRef"
									:value="projectDrawingsFileItem.url"
									:name="projectDrawingsFileItem.filename"
									:type="getFileType(projectDrawingsFileItem.url)"
								>
									<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ projectDrawingsFileItem.filename }}</span>
								</CjxPreviewOffice>
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="projectDrawingsFileItem.username" />
									<wd-text bold :text="projectDrawingsFileItem.dbtime" />
								</view>
							</view>

							<view class="right" v-else @click="handlePreviewFileChange(projectDrawingsFileItem.url)">
								<wd-text bold :text="projectDrawingsFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="projectDrawingsFileItem.username" />
									<wd-text bold :text="projectDrawingsFileItem.dbtime" />
								</view>
							</view>

							<view style="display: flex; flex-direction: column; gap: 10rpx; width: 22px; margin-left: 18px;">
								<wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(projectDrawingsFileItem.url, null)"></wd-icon>
								<wd-icon v-if="hasPermission('project:form:File:delete')" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(projectDrawingsFileItem.url, projectDrawingsFileItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目图纸" />
			</view>

			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">项目文件</view>
				</view>
				<view v-if="hasPermission('project:form:File:insert')">
					<wd-icon name="cloud-upload" size="22px" @click="handleUploadFileSelectClickChange(2)"></wd-icon>
				</view>
			</view>

			<view v-if="ipAddressList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
				<view v-for="(ipAddressItem, ipAddressIndex) in ipAddressList" :key="ipAddressIndex">
					<view style="padding: 20rpx;">
						<view class="prjInfoHeader">
							<view class="left">
								<wd-img :width="30" :height="30" :src="ipAddressItem.url" v-if="isImageUrl(ipAddressItem.url)" :preview-src="ipAddressItem.url" :enable-preview="true" />
								<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(ipAddressItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							</view>
							<view class="right" v-if="isSupportedFileType(ipAddressItem.url)">
								<CjxPreviewOffice
									ref="previewOfficeRef"
									:value="ipAddressItem.url"
									:name="ipAddressItem.filename"
									:type="getFileType(ipAddressItem.url)"
								>
									<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ ipAddressItem.filename }}</span>
								</CjxPreviewOffice>
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="ipAddressItem.username" />
									<wd-text bold :text="ipAddressItem.dbtime" />
								</view>
							</view>

							<view class="right" v-else @click="handlePreviewFileChange(ipAddressItem.url)">
								<wd-text bold :text="ipAddressItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="ipAddressItem.username" />
									<wd-text bold :text="ipAddressItem.dbtime" />
								</view>
							</view>

							<view style="display: flex; flex-direction: column; gap: 10rpx; width: 22px; margin-left: 18px;">
								<wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(ipAddressItem.url, null)"></wd-icon>
								<wd-icon v-if="hasPermission('project:form:File:delete')" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(ipAddressItem.url, ipAddressItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目文件" />
			</view>
		</view>

		<view v-if="activeTab === 4">
			<view v-if="prjDetailInfo.memberDataList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(memberItem, memberIndex) in prjDetailInfo.memberDataList" :key="memberIndex" :right-options="contactOptions" @click="handleDeleteDiffTypeChange(memberItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: memberIndex === 0 ? '0 20rpx 0' : memberIndex === dataForm.prjMemberTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 5rpx;">
								<wd-cell :title="memberItem.pname" custom-class="customCellContractWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<wd-icon v-if="hasPermission('project:Form:Contact:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/addprjformmember/Index?pid=' + prjDetailInfo.id + '&id=' + memberItem.id)"></wd-icon>
								</wd-cell>
								<view>
									<wd-cell title="对接人" :value="memberItem.docker" custom-class="customCell"></wd-cell>
									<wd-cell title="联系方式" :value="memberItem.pcontact" custom-class="customCell">
										<view v-if="memberItem.pcontact" @click.stop="handleMakePhoneNumber(memberItem.pcontact)">
											<wd-text :text="memberItem.pcontact" type="warning" decoration="underline" />
										</view>
									</wd-cell>
									<wd-cell title="备注" :value="memberItem.proposition" custom-class="customCell"></wd-cell>
									<wd-cell title="创建者/时间" :value="memberItem.username" custom-class="customCell">
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="memberItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ memberItem.username }}
											</view>
											<view v-if="memberItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ memberItem.dbtime }}
											</view>
										</view>
									</wd-cell>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无项目联络单联系人" />
			</view>
		</view>
	
		
		<wd-popup closable :safe-area-inset-bottom="true" :custom-style="`width: 90vw; margin-top: 162rpx; height: calc(100vh - 162rpx);`" v-model="uploadFileVisibleShow" position="left" @close="handleCloseChange">
		    <wd-gap height="50rpx" />
			
			<view v-if="hasPermission('project:form:File:insert')" style="padding-left: 20rpx; margin-top: 20rpx;">
			    <CjxUpload v-model="uploadFileFileList" @change="handleUploadClickChange">
			        <template #default>
						<wd-button icon="cloud-upload" type="primary">选择文件</wd-button>
			        </template>
			    </CjxUpload>
			</view>
			
			<scroll-view scroll-y="true">
				<view style="margin-bottom: 140rpx;">
					<view v-for="(item, index) in uploadFileFileList" :key="index" style="padding: 20rpx;" class="uploadfileWrap">
						<view style="display: flex; align-items: center; margin: 10rpx 0;">
							<view style="width: 5px; height: 15px; background: #0055FE;"></view>
							<view style="margin-left: 10rpx; font-weight: bolder;">文件名称</view>
						</view>
						<view style="font-weight: bolder; margin: 0 0 20rpx;">{{ item.file?.name }}</view>
						
						<view style="display: flex; align-items: center; margin: 10rpx 0;">
							<view style="width: 5px; height: 15px; background: #0055FE;"></view>
							<view style="margin-left: 10rpx; font-weight: bolder;">文件别名</view>
						</view>
						<wd-input clearable type="text" v-model="item.aliasname" placeholder="请输入文件别名" />
						<view style="margin-top: 20rpx; display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
							<wd-button type="error" @click="uploadFileFileList.splice(index, 1);">删除</wd-button>
						</view>
					</view>
				</view>
			</scroll-view>
			
			<view style="position: fixed; width: calc(90vw - 40rpx); padding: 20rpx; bottom: 0; z-index: 99; bordor: none;">
				<wd-button type="primary" custom-class="uploadfileSubmitButton" @click="handleUploadfileSubmitChange">确定</wd-button>
			</view>
		</wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.wd-tabs) {
    background-color: transparent !important;
}

:deep(.wd-tabs__nav) {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 99 !important;
}

:deep(.wd-search) {
	width: calc(100vw - 20rpx) !important;
	overflow: hidden !important;
}

.rowGridClass {
    padding: 20rpx;
    width: calc(100vw - 80rpx);
    margin: 0 20rpx;
    border-radius: 20rpx;
}

.colGridClass {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 10rpx;
}

:deep(.wd-progress__outer) {
    height: 7px !important;
    border-radius: 10px !important;
}

:deep(.wd-progress__inner) {
    border-radius: 10px !important;
}

.prjInfoHeader {
    display: flex;
    align-items: center;
    margin: 10rpx 0 !important;
    margin-bottom: 20rpx;

    .left {
        width: 26px;
        height: 26px;
        margin-right: 20rpx;
    }

    .right {
        display: flex;
        flex-direction: column;
    }
}

:deep(.cellValueClass) {
    font-size: 16px !important;
    font-weight: bolder !important;
}

:deep(.dividerRootClass) {
    height: 100px !important;
}

.buttonWrap {
    display: flex;
    justify-content: center;
    align-items: center;
    width: calc(100vw - 40rpx);
    margin: 30rpx 40rpx 30rpx 0;
    padding: 0 0 0 20rpx;
}

.darkButtonWrap {
    width: 100% !important;
}

.lightButtonWrap {
    width: 100% !important;
}

:deep(.cellLabelTitle) {
    font-weight: bolder !important;
}

.cellCustomLabelTitle {
    font-weight: bolder !important;
}

.customCellContractWrap {
    :deep(.wd-cell__left) {
        flex: 5 !important;
    }
}

.customCellDebugbusinessWrap{
    :deep(.wd-cell__left) {
        flex: 1.5 !important;
    }
}

.customCell {
    // padding: 0 !important;

    :deep(.wd-cell__right) {
        flex: 2 !important;
    }
    // padding: 10rpx 10rpx 10rpx 10rpx !important;
}

:deep(.uni-swipe:nth-child(1) .uni-swipe_button) {
    margin-top: 0 !important;
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}

.uploadfileWrap {
	.wd-cell {
		padding-left: 0 !important;
		padding-right: 0 !important;
	}
}

.uploadfileSubmitButton {
	width: 100% !important;
}
</style>